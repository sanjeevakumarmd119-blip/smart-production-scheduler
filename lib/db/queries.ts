import { getDb, isDatabaseConfigured } from "./db";
import { scenarios, machines, orders, operations, simulationRuns } from "./schema";
import { eq, desc } from "drizzle-orm";
import { Scenario, SimulationMetrics, ScheduleEntry } from "../types/scheduler";
import { PRESET_SCENARIOS } from "../presets/presets";

// In-memory fallback cache when running locally without active Neon DB connection
let inMemoryScenarios: Scenario[] = [...PRESET_SCENARIOS];
let inMemoryRuns: any[] = [];

/**
 * Fetch all scenarios (combines database records with predefined presets).
 */
export async function getAllScenarios(): Promise<Scenario[]> {
  const db = getDb();
  if (!db) {
    return inMemoryScenarios;
  }

  try {
    const dbScenarios = await db.select().from(scenarios);
    const result: Scenario[] = [];

    for (const sc of dbScenarios) {
      const scMachines = await db.select().from(machines).where(eq(machines.scenarioId, sc.id));
      const scOrders = await db.select().from(orders).where(eq(orders.scenarioId, sc.id));
      const scOps = await db.select().from(operations).where(eq(operations.scenarioId, sc.id));

      const fullOrders = scOrders.map((ord: any) => ({
        ...ord,
        operations: scOps.filter((op: any) => op.orderId === ord.id),
      }));

      result.push({
        id: sc.id,
        name: sc.name,
        description: sc.description,
        isPreset: sc.isPreset || false,
        category: sc.category || "Custom",
        machines: scMachines,
        orders: fullOrders,
        events: [],
        createdAt: sc.createdAt?.toISOString(),
        updatedAt: sc.updatedAt?.toISOString(),
      });
    }

    // Merge with presets if not already in DB
    const dbIds = new Set(result.map((r) => r.id));
    for (const preset of PRESET_SCENARIOS) {
      if (!dbIds.has(preset.id)) {
        result.unshift(preset);
      }
    }

    return result;
  } catch (error) {
    console.warn("Error reading from database, falling back to memory:", error);
    return inMemoryScenarios;
  }
}

/**
 * Saves a new or updated scenario into the database / repository.
 */
export async function saveScenario(scenario: Scenario): Promise<{ success: boolean; id: string; message: string }> {
  const db = getDb();
  if (!db) {
    const idx = inMemoryScenarios.findIndex((s) => s.id === scenario.id);
    if (idx >= 0) {
      inMemoryScenarios[idx] = { ...scenario, updatedAt: new Date().toISOString() };
    } else {
      inMemoryScenarios.unshift({
        ...scenario,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    return { success: true, id: scenario.id, message: "Scenario saved to local store (Neon DB offline)." };
  }

  try {
    // Delete existing scenario records if updating
    await db.delete(operations).where(eq(operations.scenarioId, scenario.id));
    await db.delete(orders).where(eq(orders.scenarioId, scenario.id));
    await db.delete(machines).where(eq(machines.scenarioId, scenario.id));
    await db.delete(scenarios).where(eq(scenarios.id, scenario.id));

    // Insert scenario header
    await db.insert(scenarios).values({
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      isPreset: scenario.isPreset || false,
      category: scenario.category || "Custom",
      objectiveWeights: scenario.weights || null,
    });

    // Insert machines
    for (const m of scenario.machines) {
      await db.insert(machines).values({
        id: m.id,
        scenarioId: scenario.id,
        name: m.name,
        type: m.type,
        capabilities: m.capabilities,
        processingSpeed: m.processingSpeed,
        status: m.status,
        hourlyCost: m.hourlyCost,
        maintenancePeriods: m.maintenancePeriods || [],
        failures: m.failures || [],
      });
    }

    // Insert orders and operations
    for (const ord of scenario.orders) {
      await db.insert(orders).values({
        id: ord.id,
        scenarioId: scenario.id,
        customerName: ord.customerName,
        productName: ord.productName,
        priority: ord.priority,
        quantity: ord.quantity,
        deadline: ord.deadline,
        status: ord.status,
        createdAtTime: ord.createdAtTime,
        isUrgent: ord.isUrgent || false,
      });

      for (const op of ord.operations) {
        await db.insert(operations).values({
          id: op.id,
          orderId: ord.id,
          scenarioId: scenario.id,
          name: op.name,
          sequenceNumber: op.sequenceNumber,
          requiredCapability: op.requiredCapability,
          processingTime: op.processingTime,
          dependencies: op.dependencies,
          status: op.status,
        });
      }
    }

    return { success: true, id: scenario.id, message: "Scenario persisted successfully to Neon PostgreSQL." };
  } catch (error: any) {
    console.error("Database save failed:", error);
    return { success: false, id: scenario.id, message: `Database error: ${error.message}` };
  }
}

/**
 * Saves a completed simulation run with full metrics and Gantt schedule entries.
 */
export async function saveSimulationRun(
  scenarioId: string,
  scenarioName: string,
  metrics: SimulationMetrics,
  scheduleEntries: ScheduleEntry[]
): Promise<{ success: boolean; runId: string }> {
  const runId = `run-${Date.now()}`;
  const record = {
    id: runId,
    scenarioId,
    scenarioName,
    runTimeMinutes: metrics.totalProductionTime,
    totalOrders: metrics.totalOrders,
    completedOrders: metrics.completedOrders,
    delayedOrders: metrics.delayedOrders,
    totalIdleTime: metrics.totalIdleTime,
    averageUtilization: metrics.averageMachineUtilization,
    overallScore: metrics.overallScheduleScore,
    bottleneckMachine: metrics.criticalBottleneck ? `${metrics.criticalBottleneck.machineName} (${metrics.criticalBottleneck.machineId})` : "None",
    reschedulingCount: metrics.totalReschedulingEvents,
    scheduleData: scheduleEntries,
    metricsData: metrics,
    createdAt: new Date(),
  };

  const db = getDb();
  if (!db) {
    inMemoryRuns.unshift(record);
    return { success: true, runId };
  }

  try {
    await db.insert(simulationRuns).values(record);
    return { success: true, runId };
  } catch (e) {
    console.warn("Failed to persist run in DB, cached in memory:", e);
    inMemoryRuns.unshift(record);
    return { success: true, runId };
  }
}

/**
 * Retrieves past simulation runs for analytics and history viewing.
 */
export async function getSimulationRuns(limit: number = 20) {
  const db = getDb();
  if (!db) {
    return inMemoryRuns.slice(0, limit);
  }

  try {
    const runs = await db.select().from(simulationRuns).orderBy(desc(simulationRuns.createdAt)).limit(limit);
    return runs;
  } catch (e) {
    return inMemoryRuns.slice(0, limit);
  }
}

