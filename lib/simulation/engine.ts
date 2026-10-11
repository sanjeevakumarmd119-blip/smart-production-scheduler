import {
  Machine,
  Order,
  ScheduleEntry,
  SimulationEvent,
  OperationStatus,
  MachineStatus,
} from "../types/scheduler";

export interface LiveMachineState {
  machine: Machine;
  status: MachineStatus;
  currentOperationId?: string;
  currentOrderId?: string;
  currentOperationName?: string;
  currentProgressPercent: number;
  timeRemainingInCurrentOp: number;
  isFailed: boolean;
  isMaintenance: boolean;
  failureReason?: string;
  maintenanceReason?: string;
  cumulativeBusyMinutes: number;
  utilizationPercent: number;
}

export interface LiveOperationState {
  operationId: string;
  orderId: string;
  operationName: string;
  machineId: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: OperationStatus;
  progressPercent: number;
  isDelayed: boolean;
}

export interface SimulationTickResult {
  currentTime: number;
  formattedTime: string;
  liveMachines: LiveMachineState[];
  liveOperations: LiveOperationState[];
  triggeredEvents: SimulationEvent[];
  needsRescheduling: boolean;
  reschedulingReason?: string;
  isCompleted: boolean;
  makespan: number;
}

/**
 * Formats numeric simulation minutes into industrial HH:MM factory wall clock format.
 * Base starting time is 09:00 AM.
 */
export function formatSimulationTime(minutes: number, baseHour: number = 9, baseMinute: number = 0): string {
  const totalMins = baseHour * 60 + baseMinute + Math.max(0, Math.floor(minutes));
  const hours = Math.floor(totalMins / 60) % 24;
  const mins = totalMins % 60;
  const hh = hours.toString().padStart(2, "0");
  const mm = mins.toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Computes the real-time simulation snapshot for all machines, operations, and events at currentTime.
 */
export function evaluateSimulationTick(
  currentTime: number,
  orders: Order[],
  machines: Machine[],
  scheduleEntries: ScheduleEntry[],
  events: SimulationEvent[]
): SimulationTickResult {
  const liveMachines: LiveMachineState[] = [];
  const liveOperations: LiveOperationState[] = [];
  const triggeredEvents: SimulationEvent[] = [];
  let needsRescheduling = false;
  let reschedulingReason: string | undefined;

  // 1. Check for events triggering at or before currentTime that are not yet applied
  for (const evt of events) {
    if (currentTime >= evt.triggerTime && !evt.applied) {
      triggeredEvents.push(evt);
      needsRescheduling = true;
      reschedulingReason = evt.description;
    }
  }

  // 2. Determine makespan (max end time of all schedule entries)
  let makespan = 0;
  for (const entry of scheduleEntries) {
    if (entry.endTime > makespan) {
      makespan = entry.endTime;
    }
  }

  // 3. Evaluate each schedule entry status at currentTime
  for (const entry of scheduleEntries) {
    let status: OperationStatus = "SCHEDULED";
    let progress = 0;

    const ord = orders.find((o) => o.id === entry.orderId);
    const deadline = ord?.deadline || Number.MAX_SAFE_INTEGER;
    const isDelayed = entry.endTime > deadline;

    if (currentTime >= entry.endTime) {
      status = "COMPLETED";
      progress = 100;
    } else if (currentTime >= entry.startTime && currentTime < entry.endTime) {
      status = "RUNNING";
      const elapsed = currentTime - entry.startTime;
      progress = Math.min(99, Math.max(1, Math.round((elapsed / entry.duration) * 100)));
    } else {
      status = "SCHEDULED";
      progress = 0;
    }

    liveOperations.push({
      operationId: entry.operationId,
      orderId: entry.orderId,
      operationName: entry.operationName,
      machineId: entry.machineId,
      startTime: entry.startTime,
      endTime: entry.endTime,
      duration: entry.duration,
      status,
      progressPercent: progress,
      isDelayed,
    });
  }

  // 4. Evaluate each machine's dynamic state
  for (const machine of machines) {
    // Check failure
    let isFailed = false;
    let failureReason: string | undefined;
    if (machine.failures) {
      for (const f of machine.failures) {
        if (f.status === "ACTIVE" && currentTime >= f.startTime && currentTime < f.startTime + f.duration) {
          isFailed = true;
          failureReason = f.reason;
          break;
        }
      }
    }

    // Check maintenance
    let isMaintenance = false;
    let maintenanceReason: string | undefined;
    if (machine.maintenancePeriods) {
      for (const m of machine.maintenancePeriods) {
        if (currentTime >= m.startTime && currentTime < m.endTime && m.status !== "COMPLETED") {
          isMaintenance = true;
          maintenanceReason = m.reason;
          break;
        }
      }
    }

    // Find current active operation on this machine
    const activeEntry = scheduleEntries.find(
      (e) => e.machineId === machine.id && currentTime >= e.startTime && currentTime < e.endTime
    );

    let machineStatus: MachineStatus = "AVAILABLE";
    if (isFailed) {
      machineStatus = "FAILED";
    } else if (isMaintenance) {
      machineStatus = "MAINTENANCE";
    } else if (activeEntry) {
      machineStatus = "BUSY";
    } else if (machine.status === "OFFLINE") {
      machineStatus = "OFFLINE";
    }

    let currentProgress = 0;
    let timeRemaining = 0;

    if (activeEntry && !isFailed && !isMaintenance) {
      const elapsed = currentTime - activeEntry.startTime;
      currentProgress = Math.min(99, Math.max(1, Math.round((elapsed / activeEntry.duration) * 100)));
      timeRemaining = Math.max(0, activeEntry.endTime - currentTime);
    }

    // Calculate cumulative busy time up to currentTime
    const mEntries = scheduleEntries.filter((e) => e.machineId === machine.id);
    let busyUpToNow = 0;
    for (const e of mEntries) {
      if (currentTime >= e.endTime) {
        busyUpToNow += e.duration;
      } else if (currentTime > e.startTime && currentTime < e.endTime) {
        busyUpToNow += currentTime - e.startTime;
      }
    }

    const denom = Math.max(1, currentTime);
    const utilPercent = Math.min(100, Number(((busyUpToNow / denom) * 100).toFixed(1)));

    liveMachines.push({
      machine,
      status: machineStatus,
      currentOperationId: activeEntry?.operationId,
      currentOrderId: activeEntry?.orderId,
      currentOperationName: activeEntry?.operationName,
      currentProgressPercent: currentProgress,
      timeRemainingInCurrentOp: timeRemaining,
      isFailed,
      isMaintenance,
      failureReason,
      maintenanceReason,
      cumulativeBusyMinutes: busyUpToNow,
      utilizationPercent: utilPercent,
    });
  }

  const isCompleted = makespan > 0 && currentTime >= makespan;

  return {
    currentTime,
    formattedTime: formatSimulationTime(currentTime),
    liveMachines,
    liveOperations,
    triggeredEvents,
    needsRescheduling,
    reschedulingReason,
    isCompleted,
    makespan,
  };
}

