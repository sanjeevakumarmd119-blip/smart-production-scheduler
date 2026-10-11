import { Order, PriorityLevel, Operation } from "../types/scheduler";

export interface PriorityScoreResult {
  totalScore: number;
  priorityBase: number;
  slackPenalty: number;
  remainingWorkBonus: number;
  fifoBonus: number;
  urgentBoost: number;
  explanation: string;
}

const PRIORITY_BASE_VALUES: Record<PriorityLevel, number> = {
  CRITICAL: 500,
  HIGH: 300,
  MEDIUM: 150,
  LOW: 50,
};

/**
 * Calculates the remaining manufacturing work in minutes for an order from a given operation onward.
 */
export function calculateRemainingWork(order: Order, currentOpId: string): number {
  let remaining = 0;
  let found = false;

  for (const op of order.operations) {
    if (op.id === currentOpId) {
      found = true;
    }
    if (found && op.status !== "COMPLETED") {
      remaining += op.processingTime;
    }
  }

  // If not found in sequential scan, sum all non-completed operations
  if (!found) {
    for (const op of order.operations) {
      if (op.status !== "COMPLETED") {
        remaining += op.processingTime;
      }
    }
  }

  return remaining;
}

/**
 * Evaluates the dynamic urgency and priority ranking of an operation at a given simulation time.
 * Higher score = higher dispatch priority in the scheduling queue.
 */
export function evaluateOperationPriority(
  order: Order,
  operation: Operation,
  currentTime: number = 0
): PriorityScoreResult {
  const priorityBase = PRIORITY_BASE_VALUES[order.priority] || 100;
  const remainingWork = calculateRemainingWork(order, operation.id);
  
  // Slack = Deadline - (CurrentTime + RemainingWork)
  // Negative slack means the order is already projected to be late, requiring maximum urgency
  const estimatedFinish = currentTime + remainingWork;
  const slack = order.deadline - estimatedFinish;

  let slackPenalty = 0;
  if (slack < 0) {
    // Already behind schedule: massive priority boost
    slackPenalty = Math.abs(slack) * 4.0;
  } else if (slack <= 30) {
    // Tight deadline: linear priority boost
    slackPenalty = (30 - slack) * 2.5;
  } else {
    // Plenty of slack: small negative adjustment so urgent jobs overtake it
    slackPenalty = -Math.min(slack * 0.2, 50);
  }

  // Longer remaining work gets a slight boost to prevent pipeline starvation
  const remainingWorkBonus = remainingWork * 0.5;

  // Earlier order arrival time (FIFO fairness)
  const fifoBonus = Math.max(0, 100 - order.createdAtTime * 0.5);

  // Urgent order manual flag boost
  const urgentBoost = order.isUrgent ? 250 : 0;

  const totalScore = priorityBase + slackPenalty + remainingWorkBonus + fifoBonus + urgentBoost;

  let explanation = `Order ${order.id} [${order.priority}]: Base(${priorityBase}) `;
  if (order.isUrgent) explanation += `+ Urgent(${urgentBoost}) `;
  if (slack < 0) {
    explanation += `+ Overdue Slack(+${slackPenalty.toFixed(1)}) `;
  } else if (slack <= 30) {
    explanation += `+ Tight Slack(+${slackPenalty.toFixed(1)}) `;
  }
  explanation += `-> Total Priority Score: ${totalScore.toFixed(1)}`;

  return {
    totalScore,
    priorityBase,
    slackPenalty,
    remainingWorkBonus,
    fifoBonus,
    urgentBoost,
    explanation,
  };
}

