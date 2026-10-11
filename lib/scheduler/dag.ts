import { Order, Operation } from "../types/scheduler";

export interface DAGNode {
  operation: Operation;
  order: Order;
  inDegree: number;
  predecessors: string[];
  successors: string[];
  earliestReadyTime: number;
  criticalPathLength: number; // total remaining duration along the longest path to order completion
}

export interface DAGGraph {
  nodes: Map<string, DAGNode>;
  readyQueue: DAGNode[]; // Nodes with inDegree === 0
}

/**
 * Builds a Directed Acyclic Graph (DAG) for all operations across all orders.
 * Computes in-degrees, predecessors, successors, and critical path lengths.
 */
export function buildDAG(
  orders: Order[],
  completedOperationIds: Set<string> = new Set(),
  operationEndTimes: Map<string, number> = new Map()
): DAGGraph {
  const nodes = new Map<string, DAGNode>();

  // Initialize nodes
  for (const order of orders) {
    for (const op of order.operations) {
      nodes.set(op.id, {
        operation: op,
        order,
        inDegree: 0,
        predecessors: [...(op.dependencies || [])],
        successors: [],
        earliestReadyTime: order.createdAtTime || 0,
        criticalPathLength: op.processingTime,
      });
    }
  }

  // Populate successors and in-degrees (accounting for already completed operations)
  nodes.forEach((node) => {
    let unfulfilledDeps = 0;
    let maxDepEndTime = node.order.createdAtTime || 0;

    for (const predId of node.predecessors) {
      const predNode = nodes.get(predId);
      if (predNode) {
        predNode.successors.push(node.operation.id);
      }

      if (completedOperationIds.has(predId)) {
        const endTime = operationEndTimes.get(predId) || 0;
        maxDepEndTime = Math.max(maxDepEndTime, endTime);
      } else {
        unfulfilledDeps++;
      }
    }

    node.inDegree = unfulfilledDeps;
    node.earliestReadyTime = maxDepEndTime;
  });

  // Calculate Critical Path Length for each node (longest path to order finish)
  for (const order of orders) {
    const orderOps = order.operations;
    // Process backwards
    for (let i = orderOps.length - 1; i >= 0; i--) {
      const op = orderOps[i];
      const node = nodes.get(op.id);
      if (!node) continue;

      let maxSuccPath = 0;
      for (const succId of node.successors) {
        const succNode = nodes.get(succId);
        if (succNode && succNode.order.id === order.id) {
          maxSuccPath = Math.max(maxSuccPath, succNode.criticalPathLength);
        }
      }
      node.criticalPathLength = op.processingTime + maxSuccPath;
    }
  }

  // Collect initial ready nodes (inDegree === 0 and not already completed)
  const readyQueue: DAGNode[] = [];
  nodes.forEach((node) => {
    if (node.inDegree === 0 && !completedOperationIds.has(node.operation.id)) {
      readyQueue.push(node);
    }
  });

  return { nodes, readyQueue };
}

/**
 * Checks if all prerequisite operations for a given operation are satisfied.
 */
export function areDependenciesSatisfied(
  operation: Operation,
  completedOperationIds: Set<string>
): { satisfied: boolean; missingDependencies: string[] } {
  const missing: string[] = [];
  for (const depId of operation.dependencies || []) {
    if (!completedOperationIds.has(depId)) {
      missing.push(depId);
    }
  }
  return {
    satisfied: missing.length === 0,
    missingDependencies: missing,
  };
}

