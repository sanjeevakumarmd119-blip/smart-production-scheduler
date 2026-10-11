"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  Machine,
  Order,
  ScheduleEntry,
  SimulationEvent,
  Scenario,
  SimulationMetrics,
  RescheduleComparison,
  PriorityLevel,
} from "../types/scheduler";
import { PRESET_SCENARIOS } from "../presets/presets";
import { generateProductionSchedule } from "../scheduler/scheduler";
import { performDynamicReschedule } from "../scheduler/rescheduler";
import { evaluateSimulationTick, formatSimulationTime } from "../simulation/engine";
import { calculateScheduleMetrics, DEFAULT_OBJECTIVE_WEIGHTS } from "../optimization/score";
import { validateScenario } from "../validation/validator";

interface ProductionContextType {
  // Scenario state
  activeScenario: Scenario;
  allScenarios: Scenario[];
  loadScenario: (scenario: Scenario) => void;
  loadPresetById: (presetId: string) => void;

  // Domain data
  machines: Machine[];
  orders: Order[];
  scheduleEntries: ScheduleEntry[];
  events: SimulationEvent[];
  metrics: SimulationMetrics;
  lastRescheduleComparison: RescheduleComparison | null;

  // Simulator controls
  currentTime: number;
  formattedTime: string;
  isRunning: boolean;
  playbackSpeed: number; // 0.5, 1, 2, 5, 10
  simulationStatus: "READY" | "RUNNING" | "PAUSED" | "COMPLETED" | "RESCHEDULING_REQUIRED";
  statusMessage: string;

  // Actions
  startSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  stepSimulation: (minutes?: number) => void;
  resetSimulation: () => void;
  setSpeed: (speed: number) => void;
  generateSchedule: () => boolean;
  executeReschedule: (
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
        }
  ) => void;
  injectEvent: (event: SimulationEvent) => void;

  // CRUD for Machines & Orders
  addMachine: (machine: Machine) => void;
  updateMachine: (machine: Machine) => void;
  deleteMachine: (machineId: string) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  deleteOrder: (orderId: string) => void;

  // Objective weights
  customWeights: typeof DEFAULT_OBJECTIVE_WEIGHTS;
  updateWeights: (weights: Partial<typeof DEFAULT_OBJECTIVE_WEIGHTS>) => void;
}

const ProductionContext = createContext<ProductionContextType | null>(null);

export function ProductionProvider({ children }: { children: React.ReactNode }) {
  const [allScenarios, setAllScenarios] = useState<Scenario[]>(PRESET_SCENARIOS);
  const [activeScenario, setActiveScenario] = useState<Scenario>(PRESET_SCENARIOS[0]);

  const [machines, setMachines] = useState<Machine[]>(PRESET_SCENARIOS[0].machines);
  const [orders, setOrders] = useState<Order[]>(PRESET_SCENARIOS[0].orders);
  const [events, setEvents] = useState<SimulationEvent[]>(PRESET_SCENARIOS[0].events || []);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [lastRescheduleComparison, setLastRescheduleComparison] = useState<RescheduleComparison | null>(null);
  const [customWeights, setCustomWeights] = useState(DEFAULT_OBJECTIVE_WEIGHTS);

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [simulationStatus, setSimulationStatus] = useState<
    "READY" | "RUNNING" | "PAUSED" | "COMPLETED" | "RESCHEDULING_REQUIRED"
  >("READY");
  const [statusMessage, setStatusMessage] = useState<string>("Ready to simulate");

  const [metrics, setMetrics] = useState<SimulationMetrics>(() =>
    calculateScheduleMetrics(PRESET_SCENARIOS[0].orders, PRESET_SCENARIOS[0].machines, [])
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate initial schedule
  const generateSchedule = useCallback(() => {
    const val = validateScenario({ machines, orders });
    if (!val.isValid) {
      setStatusMessage(`Validation error: ${val.errors[0]?.message}`);
      return false;
    }

    const res = generateProductionSchedule(orders, machines, currentTime, [], customWeights);
    setScheduleEntries(res.scheduleEntries);
    setMetrics(res.metrics);
    setStatusMessage("Schedule generated successfully.");
    return true;
  }, [machines, orders, currentTime, customWeights]);

  // Initial schedule generation on mount
  useEffect(() => {
    const res = generateProductionSchedule(machines.length ? orders : [], machines, 0, [], customWeights);
    setScheduleEntries(res.scheduleEntries);
    setMetrics(res.metrics);
  }, []);

  // Load a scenario
  const loadScenario = useCallback(
    (sc: Scenario) => {
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setActiveScenario(sc);
      const clonedMachines: Machine[] = JSON.parse(JSON.stringify(sc.machines));
      const clonedOrders: Order[] = JSON.parse(JSON.stringify(sc.orders));
      const clonedEvents: SimulationEvent[] = JSON.parse(JSON.stringify(sc.events || []));

      setMachines(clonedMachines);
      setOrders(clonedOrders);
      setEvents(clonedEvents);
      setCurrentTime(0);
      setSimulationStatus("READY");
      setLastRescheduleComparison(null);

      const res = generateProductionSchedule(clonedOrders, clonedMachines, 0, [], customWeights);
      setScheduleEntries(res.scheduleEntries);
      setMetrics(res.metrics);
      setStatusMessage(`Scenario "${sc.name}" loaded.`);
    },
    [customWeights]
  );

  const loadPresetById = useCallback(
    (presetId: string) => {
      const p = PRESET_SCENARIOS.find((item) => item.id === presetId);
      if (p) {
        loadScenario(p);
      }
    },
    [loadScenario]
  );

  const executeReschedule = useCallback(
    (
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
          }
    ) => {
      const res = performDynamicReschedule({
        currentTime,
        triggerEvent,
        originalSchedule: scheduleEntries,
        orders,
        machines,
        totalReschedulingEventsSoFar: metrics.totalReschedulingEvents,
        customWeights,
      });

      setScheduleEntries(res.updatedSchedule);
      setOrders(res.updatedOrders);
      setMachines(res.updatedMachines);
      setLastRescheduleComparison(res.comparison);

      const newMetrics = calculateScheduleMetrics(
        res.updatedOrders,
        res.updatedMachines,
        res.updatedSchedule,
        metrics.totalReschedulingEvents + 1,
        customWeights
      );
      setMetrics(newMetrics);
      setSimulationStatus("RUNNING");
      setStatusMessage(`Dynamic Reschedule: ${res.explanation}`);
    },
    [currentTime, scheduleEntries, orders, machines, metrics.totalReschedulingEvents, customWeights]
  );

  // Inject a dynamic event
  const injectEvent = useCallback(
    (event: SimulationEvent) => {
      setEvents((prev) => [...prev, event]);
      // If event triggers immediately at or before currentTime, trigger reschedule
      if (currentTime >= event.triggerTime) {
        executeReschedule(event);
      } else {
        setStatusMessage(`Event queued for T=${event.triggerTime}m: ${event.description}`);
      }
    },
    [currentTime, executeReschedule]
  );

  // Step simulation forward
  const stepSimulation = useCallback(
    (minutes: number = 1) => {
      setCurrentTime((prevTime) => {
        const nextTime = prevTime + minutes;
        const tick = evaluateSimulationTick(nextTime, orders, machines, scheduleEntries, events);

        if (tick.needsRescheduling && tick.triggeredEvents.length > 0) {
          setIsRunning(false);
          setSimulationStatus("RESCHEDULING_REQUIRED");
          setStatusMessage(`ALERT: ${tick.reschedulingReason}. Rescheduling required.`);
          // Mark event as applied
          setEvents((evts) =>
            evts.map((e) => (tick.triggeredEvents.some((t) => t.id === e.id) ? { ...e, applied: true } : e))
          );
          // Auto execute reschedule on event
          executeReschedule(tick.triggeredEvents[0]);
          return nextTime;
        }

        if (tick.isCompleted) {
          setIsRunning(false);
          setSimulationStatus("COMPLETED");
          setStatusMessage("Production simulation completed! All orders fulfilled.");
        }

        return nextTime;
      });
    },
    [orders, machines, scheduleEntries, events, executeReschedule]
  );

  // Simulator timer effect
  useEffect(() => {
    if (isRunning) {
      const intervalMs = Math.max(50, 1000 / playbackSpeed);
      timerRef.current = setInterval(() => {
        stepSimulation(1);
      }, intervalMs);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, playbackSpeed, stepSimulation]);

  const startSimulation = useCallback(() => {
    if (scheduleEntries.length === 0) {
      generateSchedule();
    }
    setIsRunning(true);
    setSimulationStatus("RUNNING");
    setStatusMessage("Simulation running...");
  }, [scheduleEntries.length, generateSchedule]);

  const pauseSimulation = useCallback(() => {
    setIsRunning(false);
    setSimulationStatus("PAUSED");
    setStatusMessage("Simulation paused.");
  }, []);

  const resumeSimulation = useCallback(() => {
    setIsRunning(true);
    setSimulationStatus("RUNNING");
    setStatusMessage("Simulation resumed.");
  }, []);

  const resetSimulation = useCallback(() => {
    setIsRunning(false);
    setCurrentTime(0);
    setSimulationStatus("READY");
    setStatusMessage("Simulation reset to T=0m.");
    // Reset machines and orders to clean initial state
    const cleanMachines: Machine[] = activeScenario.machines.map((m) => ({
      ...m,
      status: "AVAILABLE",
      failures: [],
      maintenancePeriods: m.maintenancePeriods?.map((p) => ({ ...p, status: "SCHEDULED" })),
    }));
    const cleanOrders: Order[] = activeScenario.orders.map((o) => ({
      ...o,
      status: "PENDING",
      operations: o.operations.map((op) => ({ ...op, status: "PENDING" })),
    }));
    setMachines(cleanMachines);
    setOrders(cleanOrders);
    setEvents(JSON.parse(JSON.stringify(activeScenario.events || [])));
    const res = generateProductionSchedule(cleanOrders, cleanMachines, 0, [], customWeights);
    setScheduleEntries(res.scheduleEntries);
    setMetrics(res.metrics);
  }, [activeScenario, customWeights]);

  const setSpeed = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
  }, []);

  // Machine CRUD
  const addMachine = useCallback((m: Machine) => {
    setMachines((prev) => [...prev, m]);
  }, []);

  const updateMachine = useCallback((m: Machine) => {
    setMachines((prev) => prev.map((item) => (item.id === m.id ? m : item)));
  }, []);

  const deleteMachine = useCallback((id: string) => {
    setMachines((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Order CRUD
  const addOrder = useCallback((ord: Order) => {
    setOrders((prev) => [...prev, ord]);
  }, []);

  const updateOrder = useCallback((ord: Order) => {
    setOrders((prev) => prev.map((item) => (item.id === ord.id ? ord : item)));
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateWeights = useCallback((w: Partial<typeof DEFAULT_OBJECTIVE_WEIGHTS>) => {
    setCustomWeights((prev) => ({ ...prev, ...w }));
  }, []);

  return (
    <ProductionContext.Provider
      value={{
        activeScenario,
        allScenarios,
        loadScenario,
        loadPresetById,
        machines,
        orders,
        scheduleEntries,
        events,
        metrics,
        lastRescheduleComparison,
        currentTime,
        formattedTime: formatSimulationTime(currentTime),
        isRunning,
        playbackSpeed,
        simulationStatus,
        statusMessage,
        startSimulation,
        pauseSimulation,
        resumeSimulation,
        stepSimulation,
        resetSimulation,
        setSpeed,
        generateSchedule,
        executeReschedule,
        injectEvent,
        addMachine,
        updateMachine,
        deleteMachine,
        addOrder,
        updateOrder,
        deleteOrder,
        customWeights,
        updateWeights,
      }}
    >
      {children}
    </ProductionContext.Provider>
  );
}

export function useProduction() {
  const context = useContext(ProductionContext);
  if (!context) {
    throw new Error("useProduction must be used within a ProductionProvider");
  }
  return context;
}

