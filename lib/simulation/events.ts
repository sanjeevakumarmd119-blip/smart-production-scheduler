import { SimulationEvent, Order, Machine, EventType } from "../types/scheduler";

export function createMachineFailureEvent(
  machineId: string,
  triggerTime: number,
  duration: number = 40,
  reason: string = "Sudden actuator mechanism jam"
): SimulationEvent {
  return {
    id: `evt-fail-${machineId}-${Date.now()}`,
    type: "MACHINE_FAILURE",
    triggerTime,
    applied: false,
    machineId,
    duration,
    reason,
    description: `Machine ${machineId} unexpected failure at T=${triggerTime}m (${duration} min downtime)`,
  };
}

export function createMachineRecoveryEvent(
  machineId: string,
  triggerTime: number
): SimulationEvent {
  return {
    id: `evt-recov-${machineId}-${Date.now()}`,
    type: "MACHINE_RECOVERY",
    triggerTime,
    applied: false,
    machineId,
    description: `Machine ${machineId} manual recovery restored at T=${triggerTime}m`,
  };
}

export function createUrgentOrderEvent(
  urgentOrder: Order,
  triggerTime: number
): SimulationEvent {
  return {
    id: `evt-urg-${urgentOrder.id}-${Date.now()}`,
    type: "ADD_URGENT_ORDER",
    triggerTime,
    applied: false,
    orderId: urgentOrder.id,
    urgentOrder,
    description: `Urgent priority order ${urgentOrder.id} (${urgentOrder.customerName}) arrives at T=${triggerTime}m`,
  };
}

export function createMaintenanceEvent(
  machineId: string,
  triggerTime: number,
  duration: number = 45,
  reason: string = "Scheduled preventive maintenance & recalibration"
): SimulationEvent {
  return {
    id: `evt-maint-${machineId}-${Date.now()}`,
    type: "START_MAINTENANCE",
    triggerTime,
    applied: false,
    machineId,
    duration,
    reason,
    description: `Machine ${machineId} scheduled maintenance starts at T=${triggerTime}m (${duration}m)`,
  };
}

