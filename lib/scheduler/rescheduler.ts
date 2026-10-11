import {
  Machine,
  Order,
  ScheduleEntry,
  SimulationEvent,
  RescheduleComparison,
  ScheduleObjectiveWeights,
} from "../types/scheduler";
import { generateProductionSchedule } from "./scheduler";
import { calculateScheduleMetrics } from "../optimization/score";

export interface DynamicRescheduleParams {
  currentTime: number;
  triggerEvent:
    | SimulationEvent
    | {
        type: string;
        description: string;
        machineId?: string;
        orderId?: string;
        operationId?: string;
        duration?: number;
        reason?: string;
        newProcessingTime?: number;
        newDeadline?: number;
        urgentOrder?: Order;
      };
  originalSchedule: ScheduleEntry[];
  orders: Order[];
  machines: Machine[];
  totalReschedulingEventsSoFar?: number;
  customWeights?: Partial<ScheduleObjectiveWeights>;
}

export interface DynamicRescheduleResult {
  updatedSchedule: ScheduleEntry[];
  updatedOrders: Order[];
  updatedMachines: Machine[];
  comparison: RescheduleComparison;
  explanation: string;
}

/**
 * Executes an intelligent dynamic reschedule during ongoing simulation without resetting the factory.
 * Preserves completed and valid in-flight operations, recalibrates timelines, and generates comparison metrics.
 */
export function performDynamicReschedule(params: DynamicRescheduleParams): DynamicRescheduleResult {
  const {
    currentTime,
    triggerEvent,
    originalSchedule,
    orders: initialOrders,
    machines: initialMachines,
    totalReschedulingEventsSoFar = 0,
    customWeights,
  } = params;

  // Deep clone to prevent unintended mutations
  const orders: Order[] = JSON.parse(JSON.stringify(initialOrders));
  const machines: Machine[] = JSON.parse(JSON.stringify(initialMachines));

  // 1. Process Event Updates on Orders / Machines
  if (triggerEvent.type === "MACHINE_FAILURE" && triggerEvent.machineId) {
    const machine = machines.find((m) => m.id === triggerEvent.machineId);
    if (machine) {
      machine.status = "FAILED";
      const failureDuration = (triggerEvent as SimulationEvent).duration || 45;
      if (!machine.failures) machine.failures = [];
      machine.failures.push({
        id: `fail-${machine.id}-${currentTime}`,
        machineId: machine.id,
        startTime: currentTime,
        duration: failureDuration,
        reason: (triggerEvent as SimulationEvent).reason || "Unexpected mechanical/hardware breakdown",
        status: "ACTIVE",
      });
    }
  } else if (triggerEvent.type === "MACHINE_RECOVERY" && triggerEvent.machineId) {
    const machine = machines.find((m) => m.id === triggerEvent.machineId);
    if (machine) {
      machine.status = "AVAILABLE";
      if (machine.failures) {
        for (const f of machine.failures) {
          if (f.status === "ACTIVE") {
            f.status = "RESOLVED";
            f.resolvedTime = currentTime;
          }
        }
      }
    }
  } else if (triggerEvent.type === "START_MAINTENANCE" && triggerEvent.machineId) {
    const machine = machines.find((m) => m.id === triggerEvent.machineId);
    if (machine) {
      machine.status = "MAINTENANCE";
      const duration = (triggerEvent as SimulationEvent).duration || 30;
      if (!machine.maintenancePeriods) machine.maintenancePeriods = [];
      machine.maintenancePeriods.push({
        id: `maint-${machine.id}-${currentTime}`,
        machineId: machine.id,
        startTime: currentTime,
        endTime: currentTime + duration,
        reason: (triggerEvent as SimulationEvent).reason || "Scheduled preventative maintenance",
        status: "ACTIVE",
      });
    }
  } else if (triggerEvent.type === "END_MAINTENANCE" && triggerEvent.machineId) {
    const machine = machines.find((m) => m.id === triggerEvent.machineId);
    if (machine) {
      machine.status = "AVAILABLE";
      if (machine.maintenancePeriods) {
        for (const mp of machine.maintenancePeriods) {
          if (mp.status === "ACTIVE") {
            mp.status = "COMPLETED";
            mp.endTime = currentTime;
          }
        }
      }
    }
  } else if (triggerEvent.type === "ADD_URGENT_ORDER") {
    const urgentOrder = (triggerEvent as SimulationEvent).urgentOrder;
    if (urgentOrder) {
      urgentOrder.createdAtTime = currentTime;
      urgentOrder.isUrgent = true;
      // If order not yet in list, add it
      if (!orders.some((o) => o.id === urgentOrder.id)) {
        orders.push(urgentOrder);
      }
    }
  } else if (triggerEvent.type === "CHANGE_PROCESSING_TIME" && triggerEvent.orderId && triggerEvent.operationId) {
    const ord = orders.find((o) => o.id === triggerEvent.orderId);
    if (ord) {
      const op = ord.operations.find((o) => o.id === triggerEvent.operationId);
      if (op && (triggerEvent as SimulationEvent).newProcessingTime) {
        op.processingTime = (triggerEvent as SimulationEvent).newProcessingTime!;
      }
    }
  } else if (triggerEvent.type === "CHANGE_DEADLINE" && triggerEvent.orderId) {
    const ord = orders.find((o) => o.id === triggerEvent.orderId);
    if (ord && (triggerEvent as SimulationEvent).newDeadline) {
      ord.deadline = (triggerEvent as SimulationEvent).newDeadline!;
    }
  }

  // 2. Classify original entries into:
  // - LOCKED: Already finished prior to currentTime OR currently running without conflict
  // - PREEMPTED / UNBOUND: Needs to be rescheduled
  const lockedEntries: ScheduleEntry[] = [];
  const affectedOrderIds = new Set<string>();
  const reassignedOpIds = new Set<string>();

  const failedMachineIds = new Set<string>(
    machines.filter((m) => m.status === "FAILED" || m.status === "MAINTENANCE").map((m) => m.id)
  );

  for (const entry of originalSchedule) {
    if (entry.endTime <= currentTime) {
      // Completed operation: must be strictly preserved
      lockedEntries.push({
        ...entry,
        status: "COMPLETED",
      });
    } else if (entry.startTime < currentTime && entry.endTime > currentTime) {
      // In-flight operation
      if (failedMachineIds.has(entry.machineId)) {
        // Machine failed while operation was running! Must be interrupted & rescheduled
        affectedOrderIds.add(entry.orderId);
        reassignedOpIds.add(entry.operationId);
      } else {
        // Healthy machine: keep in-flight operation locked
        lockedEntries.push({
          ...entry,
          status: "RUNNING",
        });
      }
    } else {
      // Future operation (startTime >= currentTime): will be re-evaluated and optimized
      if (failedMachineIds.has(entry.machineId)) {
        affectedOrderIds.add(entry.orderId);
        reassignedOpIds.add(entry.operationId);
      }
    }
  }

  if (triggerEvent.type === "ADD_URGENT_ORDER" && triggerEvent.orderId) {
    affectedOrderIds.add(triggerEvent.orderId);
  }

  // 3. Generate New Schedule starting from currentTime with locked entries preserved
  const schedulingResult = generateProductionSchedule(
    orders,
    machines,
    currentTime,
    lockedEntries,
    customWeights
  );

  // 4. Calculate Before vs After Metrics
  const beforeMetrics = calculateScheduleMetrics(
    initialOrders,
    initialMachines,
    originalSchedule,
    totalReschedulingEventsSoFar,
    customWeights
  );

  const afterMetrics = calculateScheduleMetrics(
    orders,
    machines,
    schedulingResult.scheduleEntries,
    totalReschedulingEventsSoFar + 1,
    customWeights
  );

  // Determine affected orders and reassigned operations
  for (const entry of schedulingResult.scheduleEntries) {
    const orig = originalSchedule.find((e) => e.operationId === entry.operationId);
    if (orig && (orig.machineId !== entry.machineId || orig.startTime !== entry.startTime)) {
      reassignedOpIds.add(entry.operationId);
      affectedOrderIds.add(entry.orderId);
    }
  }

  // Construct explainable summary
  let explanation = `Dynamic Rescheduling triggered at T=${currentTime}m due to "${triggerEvent.description}". `;
  if (triggerEvent.type === "MACHINE_FAILURE") {
    explanation += `Workloads on failed machine ${triggerEvent.machineId} were rerouted to compatible backup stations. `;
  } else if (triggerEvent.type === "ADD_URGENT_ORDER") {
    explanation += `Urgent order prioritized using slack-aware priority queue without stalling critical operations. `;
  }

  const makespanDiff = afterMetrics.totalProductionTime - beforeMetrics.totalProductionTime;
  const scoreDiff = afterMetrics.overallScheduleScore - beforeMetrics.overallScheduleScore;

  if (scoreDiff >= 0) {
    explanation += `Schedule quality improved by +${scoreDiff.toFixed(1)} score points.`;
  } else {
    explanation += `Disruption contained with makespan change of ${makespanDiff >= 0 ? "+" : ""}${makespanDiff}m.`;
  }

  const comparison: RescheduleComparison = {
    timestamp: currentTime,
    triggerReason: triggerEvent.description,
    before: {
      makespan: beforeMetrics.totalProductionTime,
      completedOrders: beforeMetrics.completedOrders,
      delayedOrders: beforeMetrics.delayedOrders,
      totalIdleTime: beforeMetrics.totalIdleTime,
      averageUtilization: beforeMetrics.averageMachineUtilization,
      scheduleScore: beforeMetrics.overallScheduleScore,
      entries: originalSchedule,
    },
    after: {
      makespan: afterMetrics.totalProductionTime,
      completedOrders: afterMetrics.completedOrders,
      delayedOrders: afterMetrics.delayedOrders,
      totalIdleTime: afterMetrics.totalIdleTime,
      averageUtilization: afterMetrics.averageMachineUtilization,
      scheduleScore: afterMetrics.overallScheduleScore,
      entries: schedulingResult.scheduleEntries,
    },
    delta: {
      makespanDiff,
      delayedOrdersDiff: afterMetrics.delayedOrders - beforeMetrics.delayedOrders,
      idleTimeDiff: afterMetrics.totalIdleTime - beforeMetrics.totalIdleTime,
      utilizationDiff: Number(
        (afterMetrics.averageMachineUtilization - beforeMetrics.averageMachineUtilization).toFixed(1)
      ),
      scoreDiff: Number(scoreDiff.toFixed(1)),
    },
    explanation,
    affectedOrders: Array.from(affectedOrderIds),
    reassignedOperations: Array.from(reassignedOpIds),
  };

  return {
    updatedSchedule: schedulingResult.scheduleEntries,
    updatedOrders: orders,
    updatedMachines: machines,
    comparison,
    explanation,
  };
}

