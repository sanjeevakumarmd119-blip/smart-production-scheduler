import { pgTable, text, serial, integer, doublePrecision, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const scenarios = pgTable("scenarios", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  isPreset: boolean("is_preset").default(false),
  category: text("category").default("Custom"),
  objectiveWeights: jsonb("objective_weights"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const machines = pgTable("machines", {
  id: text("id").notNull(),
  scenarioId: text("scenario_id").references(() => scenarios.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  capabilities: jsonb("capabilities").notNull(), // string[]
  processingSpeed: doublePrecision("processing_speed").default(1.0).notNull(),
  status: text("status").default("AVAILABLE").notNull(),
  hourlyCost: doublePrecision("hourly_cost").default(50.0),
  maintenancePeriods: jsonb("maintenance_periods"), // MaintenancePeriod[]
  failures: jsonb("failures"), // MachineFailure[]
});

export const orders = pgTable("orders", {
  id: text("id").notNull(),
  scenarioId: text("scenario_id").references(() => scenarios.id, { onDelete: "cascade" }),
  customerName: text("customer_name").notNull(),
  productName: text("product_name").notNull(),
  priority: text("priority").notNull(), // CRITICAL | HIGH | MEDIUM | LOW
  quantity: integer("quantity").default(1).notNull(),
  deadline: integer("deadline").notNull(), // minutes
  status: text("status").default("PENDING").notNull(),
  createdAtTime: integer("created_at_time").default(0).notNull(),
  isUrgent: boolean("is_urgent").default(false),
});

export const operations = pgTable("operations", {
  id: text("id").notNull(),
  orderId: text("order_id").notNull(),
  scenarioId: text("scenario_id").references(() => scenarios.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sequenceNumber: integer("sequence_number").notNull(),
  requiredCapability: text("required_capability").notNull(),
  processingTime: integer("processing_time").notNull(),
  dependencies: jsonb("dependencies").notNull(), // string[]
  status: text("status").default("PENDING").notNull(),
});

export const simulationRuns = pgTable("simulation_runs", {
  id: text("id").primaryKey(),
  scenarioId: text("scenario_id").references(() => scenarios.id, { onDelete: "set null" }),
  scenarioName: text("scenario_name").notNull(),
  runTimeMinutes: integer("run_time_minutes").notNull(),
  totalOrders: integer("total_orders").notNull(),
  completedOrders: integer("completed_orders").notNull(),
  delayedOrders: integer("delayed_orders").notNull(),
  totalIdleTime: doublePrecision("total_idle_time").notNull(),
  averageUtilization: doublePrecision("average_utilization").notNull(),
  overallScore: doublePrecision("overall_score").notNull(),
  bottleneckMachine: text("bottleneck_machine"),
  reschedulingCount: integer("rescheduling_count").default(0),
  scheduleData: jsonb("schedule_data"), // ScheduleEntry[]
  metricsData: jsonb("metrics_data"), // SimulationMetrics
  createdAt: timestamp("created_at").defaultNow(),
});

