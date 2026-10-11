import { Machine, Operation } from "../types/scheduler";

export interface TimeInterval {
  start: number;
  end: number;
  type: "OCCUPIED" | "MAINTENANCE" | "FAILURE";
  reason?: string;
}

export interface MachineAssignmentEvaluation {
  machine: Machine;
  isCompatible: boolean;
  earliestStartTime: number;
  earliestFinishTime: number;
  effectiveDuration: number;
  workloadMinutes: number;
  rejectionReason?: string;
}

export interface BestMachineResult {
  selectedMachine: Machine | null;
  scheduledStartTime: number;
  scheduledEndTime: number;
  effectiveDuration: number;
  evaluations: MachineAssignmentEvaluation[];
  explanation: string;
}

/**
 * Finds the earliest contiguous free time slot on a machine of required duration >= effectiveDuration,
 * starting at or after earliestReadyTime.
 */
export function findEarliestAvailableSlot(
  occupiedIntervals: TimeInterval[],
  effectiveDuration: number,
  earliestReadyTime: number
): number {
  if (occupiedIntervals.length === 0) {
    return earliestReadyTime;
  }

  // Sort occupied intervals by start time
  const sorted = [...occupiedIntervals].sort((a, b) => a.start - b.start);

  // Merge overlapping or adjacent occupied intervals
  const merged: TimeInterval[] = [];
  for (const interval of sorted) {
    if (merged.length === 0) {
      merged.push({ ...interval });
    } else {
      const last = merged[merged.length - 1];
      if (interval.start <= last.end) {
        last.end = Math.max(last.end, interval.end);
      } else {
        merged.push({ ...interval });
      }
    }
  }

  let candidateStart = earliestReadyTime;

  for (const block of merged) {
    if (candidateStart + effectiveDuration <= block.start) {
      // Found a gap before this block that fits the operation
      return candidateStart;
    }
    // Otherwise, candidate start must jump past this blocked interval
    if (candidateStart < block.end) {
      candidateStart = block.end;
    }
  }

  return candidateStart;
}

/**
 * Evaluates all factory machines for an operation and selects the optimal one
 * based on earliest completion time and load balance heuristics.
 */
export function selectBestMachine(
  operation: Operation,
  earliestReadyTime: number,
  machines: Machine[],
  machineSchedules: Map<string, TimeInterval[]>
): BestMachineResult {
  const evaluations: MachineAssignmentEvaluation[] = [];
  const reqCap = operation.requiredCapability.trim().toLowerCase();

  for (const machine of machines) {
    // Check capability compatibility
    const hasCap = machine.capabilities.some(
      (c) => c.trim().toLowerCase() === reqCap
    );

    if (!hasCap) {
      evaluations.push({
        machine,
        isCompatible: false,
        earliestStartTime: -1,
        earliestFinishTime: -1,
        effectiveDuration: -1,
        workloadMinutes: 0,
        rejectionReason: `Lacks required capability "${operation.requiredCapability}"`,
      });
      continue;
    }

    if (machine.status === "OFFLINE") {
      evaluations.push({
        machine,
        isCompatible: true,
        earliestStartTime: -1,
        earliestFinishTime: -1,
        effectiveDuration: -1,
        workloadMinutes: 0,
        rejectionReason: `Machine is currently OFFLINE`,
      });
      continue;
    }

    // Calculate effective duration using machine processing speed factor
    const speed = machine.processingSpeed > 0 ? machine.processingSpeed : 1.0;
    const effectiveDuration = Math.max(1, Math.ceil(operation.processingTime / speed));

    // Get all occupied intervals (scheduled ops + maintenance + failures)
    const intervals = machineSchedules.get(machine.id) || [];
    const allIntervals = [...intervals];

    // Add machine maintenance periods
    if (machine.maintenancePeriods) {
      for (const maint of machine.maintenancePeriods) {
        allIntervals.push({
          start: maint.startTime,
          end: maint.endTime,
          type: "MAINTENANCE",
          reason: maint.reason,
        });
      }
    }

    // Add machine failure periods
    if (machine.failures) {
      for (const fail of machine.failures) {
        allIntervals.push({
          start: fail.startTime,
          end: fail.startTime + fail.duration,
          type: "FAILURE",
          reason: fail.reason,
        });
      }
    }

    // Calculate total scheduled workload for load balancing
    const workloadMinutes = intervals.reduce((sum, inv) => sum + (inv.end - inv.start), 0);

    // Find earliest feasible start time
    const earliestStart = findEarliestAvailableSlot(allIntervals, effectiveDuration, earliestReadyTime);
    const earliestFinish = earliestStart + effectiveDuration;

    evaluations.push({
      machine,
      isCompatible: true,
      earliestStartTime: earliestStart,
      earliestFinishTime: earliestFinish,
      effectiveDuration,
      workloadMinutes,
    });
  }

  // Filter compatible machines
  const compatibleEvaluations = evaluations.filter(
    (e) => e.isCompatible && e.earliestStartTime >= 0
  );

  if (compatibleEvaluations.length === 0) {
    return {
      selectedMachine: null,
      scheduledStartTime: -1,
      scheduledEndTime: -1,
      effectiveDuration: -1,
      evaluations,
      explanation: `No available compatible machine found for capability "${operation.requiredCapability}".`,
    };
  }

  // Sort by:
  // 1. Earliest Finish Time (Minimizes Makespan & Delay)
  // 2. Workload Minutes (Load Balancing)
  // 3. Machine Processing Speed (Higher speed preferred on ties)
  compatibleEvaluations.sort((a, b) => {
    if (a.earliestFinishTime !== b.earliestFinishTime) {
      return a.earliestFinishTime - b.earliestFinishTime;
    }
    if (a.workloadMinutes !== b.workloadMinutes) {
      return a.workloadMinutes - b.workloadMinutes;
    }
    return b.machine.processingSpeed - a.machine.processingSpeed;
  });

  const best = compatibleEvaluations[0];
  const explanation = `Assigned to ${best.machine.name} (${best.machine.id}) starting at T=${best.earliestStartTime}m (finish T=${best.earliestFinishTime}m, effective duration ${best.effectiveDuration}m @ ${best.machine.processingSpeed}x speed). Earliest completion among ${compatibleEvaluations.length} candidate machines.`;

  return {
    selectedMachine: best.machine,
    scheduledStartTime: best.earliestStartTime,
    scheduledEndTime: best.earliestFinishTime,
    effectiveDuration: best.effectiveDuration,
    evaluations,
    explanation,
  };
}

