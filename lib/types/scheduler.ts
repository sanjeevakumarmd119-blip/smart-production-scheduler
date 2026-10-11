export type PriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type OrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DELAYED" | "CANCELLED";

export type MachineStatus = "AVAILABLE" | "BUSY" | "MAINTENANCE" | "FAILED" | "OFFLINE";

export type OperationStatus =
  | "PENDING"
  | "READY"
  | "SCHEDULED"
  | "RUNNING"
  | "COMPLETED"
  | "DELAYED"
  | "BLOCKED"
  | "FAILED"
  | "MAINTENANCE_PAUSED";

export interface Capability {
  id: string;
  name: string;
  description?: string;
}

export interface MaintenancePeriod {
  id: string;
  machineId: string;
  startTime: number; // in simulation minutes from T=0
  endTime: number;
  reason: string;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED";
}

export interface MachineFailure {
  id: string;
  machineId: string;
  startTime: number; // in simulation minutes
  duration: number; // duration in minutes
  resolvedTime?: number;
  reason: string;
  status: "ACTIVE" | "RESOLVED";
}

export interface Machine {
  id: string;
  name: string;
  type: string;
  capabilities: string[]; // list of capability names or IDs
  processingSpeed: number; // multiplier, default 1.0 (e.g., 1.2 = 20% faster)
  status: MachineStatus;
  currentOperationId?: string;
  maintenancePeriods?: MaintenancePeriod[];
  failures?: MachineFailure[];
  hourlyCost?: number;
}

export interface Operation {
  id: string;
  orderId: string;
  name: string;
  sequenceNumber: number;
  requiredCapability: string;
  processingTime: number; // base duration in minutes
  dependencies: string[]; // array of operation IDs that must complete first
  status: OperationStatus;
  assignedMachineId?: string;
  actualStartTime?: number;
  actualEndTime?: number;
  scheduledStartTime?: number;
  scheduledEndTime?: number;
  progressPercent?: number; // 0 to 100
}

export interface Order {
  id: string;
  customerName: string;
  productName: string;
  priority: PriorityLevel;
  quantity: number;
  deadline: number; // simulation minute by which order must finish
  dueDateFormatted?: string;
  status: OrderStatus;
  createdAtTime: number; // minute order entered factory (e.g. 0 or dynamic arrival)
  operations: Operation[];
  isUrgent?: boolean;
}

export interface ScheduleEntry {
  id: string;
  orderId: string;
  operationId: string;
  operationName: string;
  machineId: string;
  machineName: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: OperationStatus;
  isPreempted?: boolean;
  explanation?: string; // explainable AI scheduling reason
}

export interface ScheduleObjectiveWeights {
  completionReward: number; // weight for completed orders (default: 100)
  onTimeReward: number; // weight for completing before deadline (default: 80)
  priorityMultiplier: number; // weight for priority classes (default: 50)
  utilizationReward: number; // weight for machine utilization % (default: 40)
  idleTimePenalty: number; // penalty per minute of machine idle time (default: 1.5)
  delayPenalty: number; // penalty per minute of late delivery (default: 3.0)
  conflictPenalty: number; // penalty for machine overlaps or clashes (default: 500)
  missedDeadlinePenalty: number; // flat penalty for each missed deadline (default: 150)
}

export interface ScheduleScoreBreakdown {
  totalScore: number;
  completionReward: number;
  onTimeReward: number;
  priorityReward: number;
  utilizationReward: number;
  idleTimePenalty: number;
  delayPenalty: number;
  conflictPenalty: number;
  missedDeadlinePenalty: number;
  explanation: string;
}

export interface SimulationMetrics {
  totalOrders: number;
  completedOrders: number;
  delayedOrders: number;
  onTimeOrders: number;
  totalProductionTime: number; // makespan (max completion time)
  averageOrderCompletionTime: number;
  totalIdleTime: number; // sum of idle minutes across all machines
  averageMachineUtilization: number; // percentage 0 - 100
  machineUtilizationById: Record<string, number>;
  machineIdleTimeById: Record<string, number>;
  schedulingConflicts: number;
  deadlineViolations: number;
  overallScheduleScore: number;
  scoreBreakdown: ScheduleScoreBreakdown;
  bestPerformingMachine: { id: string; name: string; utilization: number };
  mostLoadedMachine: { id: string; name: string; workloadMinutes: number };
  mostDelayedOrder?: { id: string; customerName: string; delayMinutes: number };
  criticalBottleneck?: { machineId: string; machineName: string; queueWaitMinutes: number; reason: string };
  totalReschedulingEvents: number;
}

export type EventType =
  | "MACHINE_FAILURE"
  | "MACHINE_RECOVERY"
  | "ADD_URGENT_ORDER"
  | "START_MAINTENANCE"
  | "END_MAINTENANCE"
  | "CHANGE_PROCESSING_TIME"
  | "CHANGE_DEADLINE";

export interface SimulationEvent {
  id: string;
  type: EventType;
  triggerTime: number; // minute at which event fires
  applied: boolean;
  machineId?: string;
  orderId?: string;
  operationId?: string;
  duration?: number;
  newProcessingTime?: number;
  newDeadline?: number;
  urgentOrder?: Order;
  reason?: string;
  description: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  isPreset?: boolean;
  category?: string;
  machines: Machine[];
  orders: Order[];
  events: SimulationEvent[];
  weights?: Partial<ScheduleObjectiveWeights>;
  createdAt?: string;
  updatedAt?: string;
}

export interface RescheduleComparison {
  timestamp: number;
  triggerReason: string;
  before: {
    makespan: number;
    completedOrders: number;
    delayedOrders: number;
    totalIdleTime: number;
    averageUtilization: number;
    scheduleScore: number;
    entries: ScheduleEntry[];
  };
  after: {
    makespan: number;
    completedOrders: number;
    delayedOrders: number;
    totalIdleTime: number;
    averageUtilization: number;
    scheduleScore: number;
    entries: ScheduleEntry[];
  };
  delta: {
    makespanDiff: number;
    delayedOrdersDiff: number;
    idleTimeDiff: number;
    utilizationDiff: number;
    scoreDiff: number;
  };
  explanation: string;
  affectedOrders: string[];
  reassignedOperations: string[];
}

export interface DecisionLogEntry {
  step: number;
  time: number;
  operationId: string;
  operationName: string;
  orderId: string;
  orderPriority: PriorityLevel;
  chosenMachineId: string;
  chosenMachineName: string;
  scheduledStart: number;
  scheduledEnd: number;
  reason: string;
  alternativeMachinesEvaluated: {
    machineId: string;
    earliestAvailable: number;
    isCompatible: boolean;
    speed: number;
    rejectionReason?: string;
  }[];
}

