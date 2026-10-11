import { Machine, Order, Scenario } from "../types/scheduler";

export interface ValidationIssue {
  type: "ERROR" | "WARNING";
  field: string;
  message: string;
  orderId?: string;
  machineId?: string;
  operationId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

/**
 * Detects cycles in operation dependencies for a given order using DFS graph coloring.
 * Colors: 0 = unvisited (white), 1 = visiting/in current recursion stack (gray), 2 = visited (black)
 */
export function detectDependencyCycles(order: Order): { hasCycle: boolean; cyclePath?: string[] } {
  const opMap = new Map<string, typeof order.operations[0]>();
  for (const op of order.operations) {
    opMap.set(op.id, op);
  }

  const visited = new Map<string, number>(); // 0, 1, 2
  const parentMap = new Map<string, string>();

  function dfs(opId: string, path: string[]): { hasCycle: boolean; cyclePath?: string[] } {
    visited.set(opId, 1); // Mark as visiting (in recursion stack)
    path.push(opId);

    const op = opMap.get(opId);
    if (op && op.dependencies) {
      for (const depId of op.dependencies) {
        if (!opMap.has(depId)) {
          continue; // Missing dependency caught separately
        }
        const state = visited.get(depId) || 0;
        if (state === 1) {
          // Cycle found!
          const cycleStartIndex = path.indexOf(depId);
          const cycleTrace = path.slice(cycleStartIndex).concat(depId);
          return { hasCycle: true, cyclePath: cycleTrace };
        }
        if (state === 0) {
          parentMap.set(depId, opId);
          const res = dfs(depId, [...path]);
          if (res.hasCycle) return res;
        }
      }
    }

    visited.set(opId, 2); // Mark as visited
    return { hasCycle: false };
  }

  for (const op of order.operations) {
    if ((visited.get(op.id) || 0) === 0) {
      const res = dfs(op.id, []);
      if (res.hasCycle) {
        return res;
      }
    }
  }

  return { hasCycle: false };
}

/**
 * Validates a complete scenario or individual machines & orders before simulation.
 */
export function validateScenario(scenario: Scenario | { machines: Machine[]; orders: Order[] }): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const { machines, orders } = scenario;

  // 1. Machine validations
  if (!machines || machines.length === 0) {
    errors.push({
      type: "ERROR",
      field: "machines",
      message: "At least one machine must be configured in the factory.",
    });
  }

  const machineIdSet = new Set<string>();
  const availableCapabilities = new Set<string>();

  for (let i = 0; i < machines.length; i++) {
    const m = machines[i];
    if (!m.id || m.id.trim() === "") {
      errors.push({
        type: "ERROR",
        field: `machines[${i}].id`,
        message: `Machine at index ${i} has an empty Machine ID.`,
      });
    } else if (machineIdSet.has(m.id)) {
      errors.push({
        type: "ERROR",
        field: `machines[${i}].id`,
        machineId: m.id,
        message: `Duplicate machine ID detected: "${m.id}". Every machine must have a unique ID.`,
      });
    } else {
      machineIdSet.add(m.id);
    }

    if (!m.name || m.name.trim() === "") {
      errors.push({
        type: "ERROR",
        field: `machines[${i}].name`,
        machineId: m.id,
        message: `Machine "${m.id}" is missing a descriptive name.`,
      });
    }

    if (m.processingSpeed <= 0) {
      errors.push({
        type: "ERROR",
        field: `machines[${i}].processingSpeed`,
        machineId: m.id,
        message: `Machine "${m.id}" processing speed must be greater than 0 (got ${m.processingSpeed}).`,
      });
    }

    if (!m.capabilities || m.capabilities.length === 0) {
      warnings.push({
        type: "WARNING",
        field: `machines[${i}].capabilities`,
        machineId: m.id,
        message: `Machine "${m.name}" (${m.id}) has no assigned capabilities and will remain idle.`,
      });
    } else {
      for (const cap of m.capabilities) {
        if (cap && cap.trim()) {
          availableCapabilities.add(cap.trim().toLowerCase());
        }
      }
    }
  }

  // 2. Order validations
  if (!orders || orders.length === 0) {
    errors.push({
      type: "ERROR",
      field: "orders",
      message: "At least one production order must be specified.",
    });
  }

  const orderIdSet = new Set<string>();

  for (let i = 0; i < (orders || []).length; i++) {
    const ord = orders[i];
    if (!ord.id || ord.id.trim() === "") {
      errors.push({
        type: "ERROR",
        field: `orders[${i}].id`,
        message: `Order at index ${i} has an empty Order ID.`,
      });
    } else if (orderIdSet.has(ord.id)) {
      errors.push({
        type: "ERROR",
        field: `orders[${i}].id`,
        orderId: ord.id,
        message: `Duplicate order ID detected: "${ord.id}". Every order must have a unique ID.`,
      });
    } else {
      orderIdSet.add(ord.id);
    }

    if (ord.deadline <= 0) {
      errors.push({
        type: "ERROR",
        field: `orders[${i}].deadline`,
        orderId: ord.id,
        message: `Order "${ord.id}" deadline must be greater than 0 minutes.`,
      });
    }

    if (!ord.operations || ord.operations.length === 0) {
      errors.push({
        type: "ERROR",
        field: `orders[${i}].operations`,
        orderId: ord.id,
        message: `Order "${ord.id}" (${ord.productName}) has no manufacturing operations defined.`,
      });
      continue;
    }

    // Check operation IDs within order
    const opIdSet = new Set<string>();
    let totalMinimumWorkMinutes = 0;

    for (let j = 0; j < ord.operations.length; j++) {
      const op = ord.operations[j];

      if (!op.id || op.id.trim() === "") {
        errors.push({
          type: "ERROR",
          field: `orders[${i}].operations[${j}].id`,
          orderId: ord.id,
          message: `Operation at index ${j} in Order "${ord.id}" is missing an ID.`,
        });
      } else if (opIdSet.has(op.id)) {
        errors.push({
          type: "ERROR",
          field: `orders[${i}].operations[${j}].id`,
          orderId: ord.id,
          operationId: op.id,
          message: `Duplicate operation ID "${op.id}" found in Order "${ord.id}".`,
        });
      } else {
        opIdSet.add(op.id);
      }

      if (op.processingTime <= 0) {
        errors.push({
          type: "ERROR",
          field: `orders[${i}].operations[${j}].processingTime`,
          orderId: ord.id,
          operationId: op.id,
          message: `Operation "${op.name}" in Order "${ord.id}" processing time must be > 0 (got ${op.processingTime}).`,
        });
      } else {
        totalMinimumWorkMinutes += op.processingTime;
      }

      // Check capability existence
      const reqCap = op.requiredCapability ? op.requiredCapability.trim().toLowerCase() : "";
      if (!reqCap) {
        errors.push({
          type: "ERROR",
          field: `orders[${i}].operations[${j}].requiredCapability`,
          orderId: ord.id,
          operationId: op.id,
          message: `Operation "${op.name}" (${op.id}) must specify a required capability.`,
        });
      } else if (!availableCapabilities.has(reqCap)) {
        errors.push({
          type: "ERROR",
          field: `orders[${i}].operations[${j}].requiredCapability`,
          orderId: ord.id,
          operationId: op.id,
          message: `No machine in the factory has capability "${op.requiredCapability}" required by Operation "${op.name}" (${op.id}).`,
        });
      }

      // Check dependency references
      if (op.dependencies) {
        for (const depId of op.dependencies) {
          if (depId === op.id) {
            errors.push({
              type: "ERROR",
              field: `orders[${i}].operations[${j}].dependencies`,
              orderId: ord.id,
              operationId: op.id,
              message: `Operation "${op.id}" cannot depend on itself.`,
            });
          }
        }
      }
    }

    // Check dependency cycle detection (Academic DSA requirement)
    const cycleCheck = detectDependencyCycles(ord);
    if (cycleCheck.hasCycle) {
      const pathStr = (cycleCheck.cyclePath || []).join(" -> ");
      errors.push({
        type: "ERROR",
        field: `orders[${i}].dependencies`,
        orderId: ord.id,
        message: `Invalid operation dependency: cycle detected in Order "${ord.id}" [${pathStr}].`,
      });
    }

    // Check if total work exceeds deadline
    if (totalMinimumWorkMinutes > ord.deadline) {
      warnings.push({
        type: "WARNING",
        field: `orders[${i}].deadline`,
        orderId: ord.id,
        message: `Order "${ord.id}" total required work (${totalMinimumWorkMinutes} min) exceeds deadline (${ord.deadline} min). This order will likely experience delay.`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

