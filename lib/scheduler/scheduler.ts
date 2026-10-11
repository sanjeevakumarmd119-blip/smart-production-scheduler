import {
  Machine,
  Order,
  ScheduleEntry,
  DecisionLogEntry,
  SimulationMetrics,
  ScheduleObjectiveWeights,
} from "../types/scheduler";
import { buildDAG, areDependenciesSatisfied } from "./dag";
import { evaluateOperationPriority } from "./priority";
import { selectBestMachine, TimeInterval } from "./machine-assignment";
import { calculateScheduleMetrics } from "../optimization/score";

export interface SchedulingResult {
  scheduleEntries: ScheduleEntry[];
  metrics: SimulationMetrics;
  decisionLogs: DecisionLogEntry[];
  unassignedOperations: { orderId: string; operationId: string; reason: string }[];
  isFeasible: boolean;
}

/**
 * Generates an optimized, deterministic, explainable production schedule
 * for all orders and machines according to priority heuristics and dependency DAG.
 */
export function generateProductionSchedule(
  orders: Order[],
  machines: Machine[],
  currentTime: number = 0,
  lockedEntries: ScheduleEntry[] = [], // Entries that have already completed or started
  customWeights?: Partial<ScheduleObjectiveWeights>
): SchedulingResult {
  const scheduleEntries: ScheduleEntry[] = [...lockedEntries];
  const decisionLogs: DecisionLogEntry[] = [];
  const unassignedOperations: { orderId: string; operationId: string; reason: string }[] = [];

  // Track occupied time intervals per machine
  const machineSchedules = new Map<string, TimeInterval[]>();
  for (const machine of machines) {
    machineSchedules.set(machine.id, []);
  }

  // Populate locked entries into machine intervals and track completed operations
  const completedOperationIds = new Set<string>();
  const operationEndTimes = new Map<string, number>();

  for (const entry of lockedEntries) {
    const intervals = machineSchedules.get(entry.machineId) || [];
    intervals.push({
      start: entry.startTime,
      end: entry.endTime,
      type: "OCCUPIED",
    });
    machineSchedules.set(entry.machineId, intervals);

    // Both completed and currently running locked operations have determined end times
    completedOperationIds.add(entry.operationId);
    operationEndTimes.set(entry.operationId, entry.endTime);
  }

  // Build DAG of operations
  const dag = buildDAG(orders, completedOperationIds, operationEndTimes);

  // Set of scheduled operation IDs
  const scheduledOpIds = new Set<string>(lockedEntries.map((e) => e.operationId));

  // Map orders and operations for fast lookup
  const orderMap = new Map<string, Order>();
  for (const order of orders) {
    orderMap.set(order.id, order);
  }

  let stepCounter = 1;
  const maxIterations = 5000;
  let iterations = 0;

  // Main Event / Scheduling Loop
  while (iterations++ < maxIterations) {
    // 1. Gather all currently eligible operations (all dependencies satisfied and not yet scheduled)
    const eligibleNodes: typeof dag.readyQueue = [];
    dag.nodes.forEach((node, opId) => {
      if (scheduledOpIds.has(opId) || completedOperationIds.has(opId)) {
        return;
      }

      const depCheck = areDependenciesSatisfied(node.operation, completedOperationIds);
      if (depCheck.satisfied) {
        // Calculate dynamic ready time: Max of order creation time and all dependency end times
        let readyTime = Math.max(currentTime, node.order.createdAtTime || 0);
        for (const predId of node.predecessors) {
          const endTime = operationEndTimes.get(predId) || 0;
          readyTime = Math.max(readyTime, endTime);
        }
        node.earliestReadyTime = readyTime;
        eligibleNodes.push(node);
      }
    });

    if (eligibleNodes.length === 0) {
      // No more eligible operations to schedule
      break;
    }

    // 2. Sort eligible operations by Priority Score (Priority, Deadline Slack, FIFO, Urgent boost)
    eligibleNodes.sort((a, b) => {
      const scoreA = evaluateOperationPriority(a.order, a.operation, a.earliestReadyTime);
      const scoreB = evaluateOperationPriority(b.order, b.operation, b.earliestReadyTime);

      if (scoreA.totalScore !== scoreB.totalScore) {
        return scoreB.totalScore - scoreA.totalScore; // Higher priority score first
      }

      // Tie-breakers:
      // 1. Earlier ready time
      if (a.earliestReadyTime !== b.earliestReadyTime) {
        return a.earliestReadyTime - b.earliestReadyTime;
      }
      // 2. Longer critical path (preserve bottleneck flow)
      return b.criticalPathLength - a.criticalPathLength;
    });

    // 3. Pick top priority eligible operation
    const selectedNode = eligibleNodes[0];
    const op = selectedNode.operation;
    const order = selectedNode.order;

    // 4. Select best machine
    const assignment = selectBestMachine(
      op,
      selectedNode.earliestReadyTime,
      machines,
      machineSchedules
    );

    if (!assignment.selectedMachine || assignment.scheduledStartTime < 0) {
      // Cannot assign right now (no compatible machine)
      unassignedOperations.push({
        orderId: order.id,
        operationId: op.id,
        reason: assignment.explanation,
      });
      scheduledOpIds.add(op.id); // mark to prevent infinite loop
      continue;
    }

    // 5. Schedule the operation
    const entryId = `sched-${order.id}-${op.id}-${stepCounter}`;
    const newEntry: ScheduleEntry = {
      id: entryId,
      orderId: order.id,
      operationId: op.id,
      operationName: op.name,
      machineId: assignment.selectedMachine.id,
      machineName: assignment.selectedMachine.name,
      startTime: assignment.scheduledStartTime,
      endTime: assignment.scheduledEndTime,
      duration: assignment.effectiveDuration,
      status: "SCHEDULED",
      explanation: assignment.explanation,
    };

    scheduleEntries.push(newEntry);
    scheduledOpIds.add(op.id);
    completedOperationIds.add(op.id);
    operationEndTimes.set(op.id, assignment.scheduledEndTime);

    // Update machine occupied intervals
    const mIntervals = machineSchedules.get(assignment.selectedMachine.id) || [];
    mIntervals.push({
      start: assignment.scheduledStartTime,
      end: assignment.scheduledEndTime,
      type: "OCCUPIED",
    });
    machineSchedules.set(assignment.selectedMachine.id, mIntervals);

    // Record explainable AI decision log
    const prioResult = evaluateOperationPriority(order, op, selectedNode.earliestReadyTime);
    decisionLogs.push({
      step: stepCounter++,
      time: assignment.scheduledStartTime,
      operationId: op.id,
      operationName: op.name,
      orderId: order.id,
      orderPriority: order.priority,
      chosenMachineId: assignment.selectedMachine.id,
      chosenMachineName: assignment.selectedMachine.name,
      scheduledStart: assignment.scheduledStartTime,
      scheduledEnd: assignment.scheduledEndTime,
      reason: `${prioResult.explanation} -> Selected ${assignment.selectedMachine.name} (Start: T=${assignment.scheduledStartTime}m, Finish: T=${assignment.scheduledEndTime}m, Duration: ${assignment.effectiveDuration}m).`,
      alternativeMachinesEvaluated: assignment.evaluations.map((ev) => ({
        machineId: ev.machine.id,
        earliestAvailable: ev.earliestStartTime,
        isCompatible: ev.isCompatible,
        speed: ev.machine.processingSpeed,
        rejectionReason: ev.rejectionReason,
      })),
    });
  }

  // Calculate comprehensive metrics and optimization score
  const metrics = calculateScheduleMetrics(
    orders,
    machines,
    scheduleEntries,
    0,
    customWeights
  );

  return {
    scheduleEntries,
    metrics,
    decisionLogs,
    unassignedOperations,
    isFeasible: unassignedOperations.length === 0,
  };
}
