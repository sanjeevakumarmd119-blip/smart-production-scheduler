import { describe, it, expect } from "vitest";
import { generateProductionSchedule } from "../lib/scheduler/scheduler";
import { performDynamicReschedule } from "../lib/scheduler/rescheduler";
import { validateScenario, detectDependencyCycles } from "../lib/validation/validator";
import { calculateScheduleMetrics } from "../lib/optimization/score";
import { evaluateOperationPriority } from "../lib/scheduler/priority";
import { PRESET_SCENARIOS } from "../lib/presets/presets";
import { Machine, Order } from "../lib/types/scheduler";

describe("Production Scheduling Engine - Academic Verification Suite", () => {
  const sampleMachines: Machine[] = [
    {
      id: "M1",
      name: "Assembly Robot",
      type: "Robotic Pick & Place",
      capabilities: ["Component Assembly"],
      processingSpeed: 1.0,
      status: "AVAILABLE",
    },
    {
      id: "M2",
      name: "Soldering Station",
      type: "Selective Soldering",
      capabilities: ["Soldering"],
      processingSpeed: 1.0,
      status: "AVAILABLE",
    },
    {
      id: "M3",
      name: "Testing Station",
      type: "Automated Tester",
      capabilities: ["Testing"],
      processingSpeed: 1.0,
      status: "AVAILABLE",
    },
  ];

  const sampleOrders: Order[] = [
    {
      id: "ORD-1",
      customerName: "Client A",
      productName: "Controller Alpha",
      priority: "CRITICAL",
      quantity: 10,
      deadline: 60,
      status: "PENDING",
      createdAtTime: 0,
      operations: [
        {
          id: "OP-1-1",
          orderId: "ORD-1",
          name: "Component Assembly",
          sequenceNumber: 1,
          requiredCapability: "Component Assembly",
          processingTime: 10,
          dependencies: [],
          status: "PENDING",
        },
        {
          id: "OP-1-2",
          orderId: "ORD-1",
          name: "Soldering",
          sequenceNumber: 2,
          requiredCapability: "Soldering",
          processingTime: 10,
          dependencies: ["OP-1-1"],
          status: "PENDING",
        },
        {
          id: "OP-1-3",
          orderId: "ORD-1",
          name: "Testing",
          sequenceNumber: 3,
          requiredCapability: "Testing",
          processingTime: 10,
          dependencies: ["OP-1-2"],
          status: "PENDING",
        },
      ],
    },
    {
      id: "ORD-2",
      customerName: "Client B",
      productName: "Controller Beta",
      priority: "LOW",
      quantity: 10,
      deadline: 120,
      status: "PENDING",
      createdAtTime: 0,
      operations: [
        {
          id: "OP-2-1",
          orderId: "ORD-2",
          name: "Component Assembly",
          sequenceNumber: 1,
          requiredCapability: "Component Assembly",
          processingTime: 15,
          dependencies: [],
          status: "PENDING",
        },
        {
          id: "OP-2-2",
          orderId: "ORD-2",
          name: "Soldering",
          sequenceNumber: 2,
          requiredCapability: "Soldering",
          processingTime: 15,
          dependencies: ["OP-2-1"],
          status: "PENDING",
        },
      ],
    },
  ];

  it("1. should schedule critical priority orders before low priority orders", () => {
    const result = generateProductionSchedule(sampleOrders, sampleMachines, 0);

    expect(result.isFeasible).toBe(true);
    expect(result.scheduleEntries.length).toBe(5);

    const op1_1 = result.scheduleEntries.find((e) => e.operationId === "OP-1-1");
    const op2_1 = result.scheduleEntries.find((e) => e.operationId === "OP-2-1");

    expect(op1_1).toBeDefined();
    expect(op2_1).toBeDefined();

    // Critical Order 1's assembly should start at T=0
    expect(op1_1!.startTime).toBe(0);
    // Low Order 2's assembly should wait until M1 is free at T=10
    expect(op2_1!.startTime).toBe(10);
  });

  it("2. should enforce strict DAG dependency ordering", () => {
    const result = generateProductionSchedule(sampleOrders, sampleMachines, 0);

    const op1_1 = result.scheduleEntries.find((e) => e.operationId === "OP-1-1")!;
    const op1_2 = result.scheduleEntries.find((e) => e.operationId === "OP-1-2")!;
    const op1_3 = result.scheduleEntries.find((e) => e.operationId === "OP-1-3")!;

    // Soldering cannot start before Assembly ends
    expect(op1_2.startTime).toBeGreaterThanOrEqual(op1_1.endTime);
    // Testing cannot start before Soldering ends
    expect(op1_3.startTime).toBeGreaterThanOrEqual(op1_2.endTime);
  });

  it("3. should detect dependency cycles correctly", () => {
    const cyclicOrder: Order = {
      id: "ORD-CYCLE",
      customerName: "Faulty Client",
      productName: "Bad Device",
      priority: "HIGH",
      quantity: 1,
      deadline: 100,
      status: "PENDING",
      createdAtTime: 0,
      operations: [
        {
          id: "OP-C1",
          orderId: "ORD-CYCLE",
          name: "Op 1",
          sequenceNumber: 1,
          requiredCapability: "Component Assembly",
          processingTime: 10,
          dependencies: ["OP-C2"], // Cycle: C1 -> C2 -> C1
          status: "PENDING",
        },
        {
          id: "OP-C2",
          orderId: "ORD-CYCLE",
          name: "Op 2",
          sequenceNumber: 2,
          requiredCapability: "Soldering",
          processingTime: 10,
          dependencies: ["OP-C1"],
          status: "PENDING",
        },
      ],
    };

    const cycleCheck = detectDependencyCycles(cyclicOrder);
    expect(cycleCheck.hasCycle).toBe(true);

    const validation = validateScenario({
      machines: sampleMachines,
      orders: [cyclicOrder],
    });
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.message.includes("cycle detected"))).toBe(true);
  });

  it("4. should execute dynamic rescheduling upon machine failure while preserving completed tasks", () => {
    // Generate initial schedule
    const initial = generateProductionSchedule(sampleOrders, sampleMachines, 0);

    // Simulate failure of M2 at T=15 for 30 minutes
    const rescheduleResult = performDynamicReschedule({
      currentTime: 15,
      triggerEvent: {
        type: "MACHINE_FAILURE",
        machineId: "M2",
        description: "Soldering station M2 heating element failure",
      },
      originalSchedule: initial.scheduleEntries,
      orders: sampleOrders,
      machines: sampleMachines,
    });

    expect(rescheduleResult.updatedSchedule.length).toBe(5);

    // Operation OP-1-1 was finished at T=10, must still have start=0, end=10
    const op1_1 = rescheduleResult.updatedSchedule.find((e) => e.operationId === "OP-1-1")!;
    expect(op1_1.startTime).toBe(0);
    expect(op1_1.endTime).toBe(10);
    expect(op1_1.status).toBe("COMPLETED");

    expect(rescheduleResult.comparison.affectedOrders.length).toBeGreaterThan(0);
  });

  it("5. should correctly load and generate schedules for all 8 preset scenarios", () => {
    for (const preset of PRESET_SCENARIOS) {
      const val = validateScenario(preset);
      expect(val.isValid).toBe(true);

      const result = generateProductionSchedule(preset.orders, preset.machines, 0);
      expect(result.scheduleEntries.length).toBeGreaterThan(0);
      expect(result.metrics.overallScheduleScore).toBeGreaterThanOrEqual(0);
      expect(result.metrics.totalProductionTime).toBeGreaterThan(0);
    }
  });

  it("6. should handle edge case of empty or invalid input gracefully", () => {
    const val = validateScenario({ machines: [], orders: [] });
    expect(val.isValid).toBe(false);
    expect(val.errors.length).toBeGreaterThanOrEqual(2);
  });

  it("7. should scale processing time according to machine speed factor", () => {
    const fastMachine: Machine = {
      id: "M-FAST",
      name: "Turbo Robot",
      type: "High Speed",
      capabilities: ["Component Assembly"],
      processingSpeed: 2.0, // 2x speed means 20m takes 10m
      status: "AVAILABLE",
    };

    const singleOrder: Order = {
      id: "ORD-SPEED",
      customerName: "Fast Client",
      productName: "Speedy Controller",
      priority: "HIGH",
      quantity: 1,
      deadline: 50,
      status: "PENDING",
      createdAtTime: 0,
      operations: [
        {
          id: "OP-SPD-1",
          orderId: "ORD-SPEED",
          name: "Assembly",
          sequenceNumber: 1,
          requiredCapability: "Component Assembly",
          processingTime: 20,
          dependencies: [],
          status: "PENDING",
        },
      ],
    };

    const result = generateProductionSchedule([singleOrder], [fastMachine], 0);
    expect(result.scheduleEntries.length).toBe(1);
    expect(result.scheduleEntries[0].duration).toBe(10); // 20 / 2.0 = 10
    expect(result.scheduleEntries[0].endTime).toBe(10);
  });

  it("8. should schedule around planned maintenance windows without conflict", () => {
    const maintMachine: Machine = {
      id: "M-MAINT",
      name: "Maintenance Robot",
      type: "Precision",
      capabilities: ["Testing"],
      processingSpeed: 1.0,
      status: "AVAILABLE",
      maintenancePeriods: [
        {
          id: "MP-1",
          machineId: "M-MAINT",
          startTime: 10,
          endTime: 30,
          reason: "Recalibration",
          status: "SCHEDULED",
        },
      ],
    };

    const order: Order = {
      id: "ORD-M",
      customerName: "Client M",
      productName: "Unit M",
      priority: "HIGH",
      quantity: 1,
      deadline: 100,
      status: "PENDING",
      createdAtTime: 0,
      operations: [
        {
          id: "OP-M-1",
          orderId: "ORD-M",
          name: "Testing Op 1",
          sequenceNumber: 1,
          requiredCapability: "Testing",
          processingTime: 15,
          dependencies: [],
          status: "PENDING",
        },
      ],
    };

    // Op takes 15 min. Free gap before maintenance is 0-10 (only 10 min, not enough for 15 min op).
    // Therefore, it must be scheduled AFTER maintenance at T=30 -> 45!
    const result = generateProductionSchedule([order], [maintMachine], 0);
    expect(result.scheduleEntries.length).toBe(1);
    expect(result.scheduleEntries[0].startTime).toBe(30);
    expect(result.scheduleEntries[0].endTime).toBe(45);
  });
});
