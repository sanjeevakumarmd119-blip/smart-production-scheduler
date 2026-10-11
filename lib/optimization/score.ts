import {
  Machine,
  Order,
  ScheduleEntry,
  ScheduleObjectiveWeights,
  ScheduleScoreBreakdown,
  SimulationMetrics,
} from "../types/scheduler";

export const DEFAULT_OBJECTIVE_WEIGHTS: ScheduleObjectiveWeights = {
  completionReward: 100,
  onTimeReward: 80,
  priorityMultiplier: 50,
  utilizationReward: 40,
  idleTimePenalty: 1.5,
  delayPenalty: 3.0,
  conflictPenalty: 500,
  missedDeadlinePenalty: 150,
};

const PRIORITY_MULTIPLIERS = {
  CRITICAL: 4.0,
  HIGH: 2.5,
  MEDIUM: 1.5,
  LOW: 1.0,
};

/**
 * Calculates comprehensive production simulation metrics, bottlenecks, and the multi-attribute schedule score.
 */
export function calculateScheduleMetrics(
  orders: Order[],
  machines: Machine[],
  scheduleEntries: ScheduleEntry[],
  totalReschedulingEvents: number = 0,
  customWeights?: Partial<ScheduleObjectiveWeights>
): SimulationMetrics {
  const weights: ScheduleObjectiveWeights = {
    ...DEFAULT_OBJECTIVE_WEIGHTS,
    ...customWeights,
  };

  const totalOrders = orders.length;
  let completedOrders = 0;
  let delayedOrders = 0;
  let onTimeOrders = 0;
  let totalOrderDurationSum = 0;
  let deadlineViolations = 0;
  let totalDelayMinutes = 0;

  // Track order finish times
  const orderFinishTimes = new Map<string, number>();
  const orderStartTimes = new Map<string, number>();

  for (const entry of scheduleEntries) {
    const curEnd = orderFinishTimes.get(entry.orderId) || 0;
    orderFinishTimes.set(entry.orderId, Math.max(curEnd, entry.endTime));

    const curStart = orderStartTimes.get(entry.orderId);
    if (curStart === undefined || entry.startTime < curStart) {
      orderStartTimes.set(entry.orderId, entry.startTime);
    }
  }

  let mostDelayedOrder: { id: string; customerName: string; delayMinutes: number } | undefined;
  let maxDelayFound = 0;

  for (const order of orders) {
    const finishTime = orderFinishTimes.get(order.id);
    if (finishTime !== undefined) {
      completedOrders++;
      const duration = finishTime - (order.createdAtTime || 0);
      totalOrderDurationSum += duration;

      if (finishTime <= order.deadline) {
        onTimeOrders++;
      } else {
        delayedOrders++;
        deadlineViolations++;
        const delay = finishTime - order.deadline;
        totalDelayMinutes += delay;
        if (delay > maxDelayFound) {
          maxDelayFound = delay;
          mostDelayedOrder = {
            id: order.id,
            customerName: order.customerName,
            delayMinutes: delay,
          };
        }
      }
    }
  }

  // Makespan (Total production completion time)
  let makespan = 0;
  for (const entry of scheduleEntries) {
    if (entry.endTime > makespan) {
      makespan = entry.endTime;
    }
  }

  const averageOrderCompletionTime =
    completedOrders > 0 ? Number((totalOrderDurationSum / completedOrders).toFixed(1)) : 0;

  // Machine metrics
  const machineUtilizationById: Record<string, number> = {};
  const machineIdleTimeById: Record<string, number> = {};
  const machineWorkloadById: Record<string, number> = {};
  let totalMachineBusyMinutes = 0;
  let totalIdleTime = 0;

  let bestPerformingMachine = { id: "", name: "None", utilization: 0 };
  let mostLoadedMachine = { id: "", name: "None", workloadMinutes: 0 };

  for (const machine of machines) {
    const entries = scheduleEntries.filter((e) => e.machineId === machine.id);
    const busyMinutes = entries.reduce((sum, e) => sum + (e.endTime - e.startTime), 0);
    machineWorkloadById[machine.id] = busyMinutes;
    totalMachineBusyMinutes += busyMinutes;

    const machineMakespan = makespan > 0 ? makespan : 1;
    const idleMinutes = Math.max(0, machineMakespan - busyMinutes);
    machineIdleTimeById[machine.id] = idleMinutes;
    totalIdleTime += idleMinutes;

    const utilization = Number(((busyMinutes / machineMakespan) * 100).toFixed(1));
    machineUtilizationById[machine.id] = utilization;

    if (utilization > bestPerformingMachine.utilization) {
      bestPerformingMachine = {
        id: machine.id,
        name: machine.name,
        utilization,
      };
    }

    if (busyMinutes > mostLoadedMachine.workloadMinutes) {
      mostLoadedMachine = {
        id: machine.id,
        name: machine.name,
        workloadMinutes: busyMinutes,
      };
    }
  }

  const averageMachineUtilization =
    machines.length > 0
      ? Number(
          (
            Object.values(machineUtilizationById).reduce((a, b) => a + b, 0) /
            machines.length
          ).toFixed(1)
        )
      : 0;

  // Check scheduling conflicts (overlapping entries on the same machine)
  let schedulingConflicts = 0;
  for (const machine of machines) {
    const mEntries = scheduleEntries
      .filter((e) => e.machineId === machine.id)
      .sort((a, b) => a.startTime - b.startTime);
    for (let i = 0; i < mEntries.length - 1; i++) {
      if (mEntries[i].endTime > mEntries[i + 1].startTime) {
        schedulingConflicts++;
      }
    }
  }

  // Bottleneck analysis: calculate queue wait time before each machine
  let criticalBottleneck: { machineId: string; machineName: string; queueWaitMinutes: number; reason: string } | undefined;
  const machineWaitTime = new Map<string, number>();

  for (const entry of scheduleEntries) {
    // Find operation's ready time vs actual start time
    const readyTime = orderStartTimes.get(entry.orderId) || 0;
    const wait = Math.max(0, entry.startTime - readyTime);
    const currentWait = machineWaitTime.get(entry.machineId) || 0;
    machineWaitTime.set(entry.machineId, currentWait + wait);
  }

  let maxWait = 0;
  machineWaitTime.forEach((wait, mId) => {
    if (wait > maxWait) {
      maxWait = wait;
      const m = machines.find((m) => m.id === mId);
      if (m) {
        criticalBottleneck = {
          machineId: m.id,
          machineName: m.name,
          queueWaitMinutes: wait,
          reason: `${m.name} (${m.id}) accumulated ${wait} min of upstream queuing delay, making it the primary production bottleneck.`,
        };
      }
    }
  });

  // Calculate Weighted Schedule Score
  let priorityReward = 0;
  for (const order of orders) {
    if (orderFinishTimes.has(order.id)) {
      const mult = PRIORITY_MULTIPLIERS[order.priority] || 1.0;
      priorityReward += weights.priorityMultiplier * mult;
    }
  }

  const completionReward = completedOrders * weights.completionReward;
  const onTimeReward = onTimeOrders * weights.onTimeReward;
  const utilizationReward = (averageMachineUtilization / 100) * weights.utilizationReward * machines.length * 10;
  const idleTimePenalty = totalIdleTime * weights.idleTimePenalty;
  const delayPenalty = totalDelayMinutes * weights.delayPenalty;
  const conflictPenalty = schedulingConflicts * weights.conflictPenalty;
  const missedDeadlinePenalty = deadlineViolations * weights.missedDeadlinePenalty;

  const rawScore =
    completionReward +
    onTimeReward +
    priorityReward +
    utilizationReward -
    idleTimePenalty -
    delayPenalty -
    conflictPenalty -
    missedDeadlinePenalty;

  const totalScore = Math.max(0, Number(rawScore.toFixed(1)));

  const scoreBreakdown: ScheduleScoreBreakdown = {
    totalScore,
    completionReward: Number(completionReward.toFixed(1)),
    onTimeReward: Number(onTimeReward.toFixed(1)),
    priorityReward: Number(priorityReward.toFixed(1)),
    utilizationReward: Number(utilizationReward.toFixed(1)),
    idleTimePenalty: Number(idleTimePenalty.toFixed(1)),
    delayPenalty: Number(delayPenalty.toFixed(1)),
    conflictPenalty: Number(conflictPenalty.toFixed(1)),
    missedDeadlinePenalty: Number(missedDeadlinePenalty.toFixed(1)),
    explanation: `Score ${totalScore} = Completion(+${completionReward.toFixed(0)}) + OnTime(+${onTimeReward.toFixed(0)}) + Priority(+${priorityReward.toFixed(0)}) + Util(+${utilizationReward.toFixed(0)}) - Idle(-${idleTimePenalty.toFixed(0)}) - Delay(-${delayPenalty.toFixed(0)}) - Missed(-${missedDeadlinePenalty.toFixed(0)})`,
  };

  return {
    totalOrders,
    completedOrders,
    delayedOrders,
    onTimeOrders,
    totalProductionTime: makespan,
    averageOrderCompletionTime,
    totalIdleTime,
    averageMachineUtilization,
    machineUtilizationById,
    machineIdleTimeById,
    schedulingConflicts,
    deadlineViolations,
    overallScheduleScore: totalScore,
    scoreBreakdown,
    bestPerformingMachine: bestPerformingMachine.id ? bestPerformingMachine : { id: machines[0]?.id || "M1", name: machines[0]?.name || "N/A", utilization: 0 },
    mostLoadedMachine: mostLoadedMachine.id ? mostLoadedMachine : { id: machines[0]?.id || "M1", name: machines[0]?.name || "N/A", workloadMinutes: 0 },
    mostDelayedOrder,
    criticalBottleneck,
    totalReschedulingEvents,
  };
}

