import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, boolean, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectCode: text("project_code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  clientId: varchar("client_id"),
  clientName: text("client_name").notNull(),
  clientContact: text("client_contact"),
  status: text("status").notNull().default("active"), // active, completed, on-hold, cancelled
  health: text("health").notNull().default("on-track"), // on-track, at-risk, behind-schedule
  progress: decimal("progress", { precision: 5, scale: 2 }).default("0"),
  budgetAmount: decimal("budget_amount", { precision: 12, scale: 2 }),
  actualAmount: decimal("actual_amount", { precision: 12, scale: 2 }).default("0"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  dueDate: date("due_date"),
  projectType: text("project_type"), // industrial-control, warehouse-electrical, hvac-control, etc.
  acumaticaId: text("acumatica_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  parentTaskId: varchar("parent_task_id"),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("not-started"), // not-started, in-progress, completed, blocked
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  progress: decimal("progress", { precision: 5, scale: 2 }).default("0"),
  estimatedHours: decimal("estimated_hours", { precision: 8, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 8, scale: 2 }).default("0"),
  budgetAmount: decimal("budget_amount", { precision: 12, scale: 2 }),
  actualAmount: decimal("actual_amount", { precision: 12, scale: 2 }).default("0"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  dueDate: date("due_date"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  taskCode: text("task_code"),
  level: integer("level").default(1),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const timeEntries = pgTable("time_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  taskId: varchar("task_id").references(() => tasks.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  date: date("date").notNull(),
  hours: decimal("hours", { precision: 8, scale: 2 }).notNull(),
  description: text("description"),
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }),
  isApproved: boolean("is_approved").default(false),
  approvedBy: varchar("approved_by").references(() => users.id),
  acumaticaId: text("acumatica_id"),
  lumberTimeId: text("lumber_time_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rfis = pgTable("rfis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  rfiNumber: text("rfi_number").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"), // open, pending, answered, closed
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  submittedBy: varchar("submitted_by").references(() => users.id).notNull(),
  assignedTo: varchar("assigned_to").references(() => users.id),
  submittedDate: date("submitted_date").notNull(),
  requiredDate: date("required_date"),
  answeredDate: date("answered_date"),
  answer: text("answer"),
  attachments: jsonb("attachments"), // array of file references
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const changeOrders = pgTable("change_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  coNumber: text("co_number").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("draft"), // draft, submitted, approved, rejected, implemented
  type: text("type").notNull(), // addition, deletion, modification
  requestedBy: varchar("requested_by").references(() => users.id).notNull(),
  approvedBy: varchar("approved_by").references(() => users.id),
  costImpact: decimal("cost_impact", { precision: 12, scale: 2 }).default("0"),
  timeImpact: integer("time_impact").default(0), // in days
  submittedDate: date("submitted_date").notNull(),
  approvedDate: date("approved_date"),
  implementedDate: date("implemented_date"),
  justification: text("justification"),
  attachments: jsonb("attachments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const risks = pgTable("risks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // technical, financial, schedule, resource, safety
  probability: text("probability").notNull(), // low, medium, high
  impact: text("impact").notNull(), // low, medium, high
  riskScore: integer("risk_score"), // calculated from probability * impact
  status: text("status").notNull().default("open"), // open, monitoring, mitigated, closed
  owner: varchar("owner").references(() => users.id).notNull(),
  identifiedDate: date("identified_date").notNull(),
  targetDate: date("target_date"),
  mitigationPlan: text("mitigation_plan"),
  contingencyPlan: text("contingency_plan"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const acumaticaSync = pgTable("acumatica_sync", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  syncType: text("sync_type").notNull(), // projects, budgets, actuals, employees
  status: text("status").notNull(), // pending, in-progress, completed, failed
  recordsProcessed: integer("records_processed").default(0),
  recordsSuccessful: integer("records_successful").default(0),
  recordsFailed: integer("records_failed").default(0),
  errorMessage: text("error_message"),
  syncData: jsonb("sync_data"),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  createdAt: true,
});

export const insertRfiSchema = createInsertSchema(rfis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChangeOrderSchema = createInsertSchema(changeOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRiskSchema = createInsertSchema(risks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAcumaticaSyncSchema = createInsertSchema(acumaticaSync).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type RFI = typeof rfis.$inferSelect;
export type InsertRFI = z.infer<typeof insertRfiSchema>;
export type ChangeOrder = typeof changeOrders.$inferSelect;
export type InsertChangeOrder = z.infer<typeof insertChangeOrderSchema>;
export type Risk = typeof risks.$inferSelect;
export type InsertRisk = z.infer<typeof insertRiskSchema>;
export type AcumaticaSync = typeof acumaticaSync.$inferSelect;
export type InsertAcumaticaSync = z.infer<typeof insertAcumaticaSyncSchema>;
