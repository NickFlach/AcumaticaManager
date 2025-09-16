import { type User, type InsertUser, type Project, type InsertProject, type Task, type InsertTask, type TimeEntry, type InsertTimeEntry, type RFI, type InsertRFI, type ChangeOrder, type InsertChangeOrder, type Risk, type InsertRisk, type AcumaticaSync, type InsertAcumaticaSync } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  
  // Tasks
  getTasks(): Promise<Task[]>;
  getTasksByProject(projectId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  
  // Time Entries
  getTimeEntries(): Promise<TimeEntry[]>;
  getTimeEntriesByProject(projectId: string): Promise<TimeEntry[]>;
  getTimeEntriesByUser(userId: string): Promise<TimeEntry[]>;
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, timeEntry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: string): Promise<boolean>;
  
  // RFIs
  getRfis(): Promise<RFI[]>;
  getRfisByProject(projectId: string): Promise<RFI[]>;
  getRfi(id: string): Promise<RFI | undefined>;
  createRfi(rfi: InsertRFI): Promise<RFI>;
  updateRfi(id: string, rfi: Partial<InsertRFI>): Promise<RFI | undefined>;
  deleteRfi(id: string): Promise<boolean>;
  
  // Change Orders
  getChangeOrders(): Promise<ChangeOrder[]>;
  getChangeOrdersByProject(projectId: string): Promise<ChangeOrder[]>;
  getChangeOrder(id: string): Promise<ChangeOrder | undefined>;
  createChangeOrder(changeOrder: InsertChangeOrder): Promise<ChangeOrder>;
  updateChangeOrder(id: string, changeOrder: Partial<InsertChangeOrder>): Promise<ChangeOrder | undefined>;
  deleteChangeOrder(id: string): Promise<boolean>;
  
  // Risks
  getRisks(): Promise<Risk[]>;
  getRisksByProject(projectId: string): Promise<Risk[]>;
  getRisk(id: string): Promise<Risk | undefined>;
  createRisk(risk: InsertRisk): Promise<Risk>;
  updateRisk(id: string, risk: Partial<InsertRisk>): Promise<Risk | undefined>;
  deleteRisk(id: string): Promise<boolean>;
  
  // Acumatica Sync
  getAcumaticaSyncs(): Promise<AcumaticaSync[]>;
  createAcumaticaSync(sync: InsertAcumaticaSync): Promise<AcumaticaSync>;
  updateAcumaticaSync(id: string, sync: Partial<InsertAcumaticaSync>): Promise<AcumaticaSync | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private tasks: Map<string, Task>;
  private timeEntries: Map<string, TimeEntry>;
  private rfis: Map<string, RFI>;
  private changeOrders: Map<string, ChangeOrder>;
  private risks: Map<string, Risk>;
  private acumaticaSyncs: Map<string, AcumaticaSync>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.tasks = new Map();
    this.timeEntries = new Map();
    this.rfis = new Map();
    this.changeOrders = new Map();
    this.risks = new Map();
    this.acumaticaSyncs = new Map();
    this.initializeData();
  }

  private initializeData() {
    // Create default admin user
    const adminUserId = randomUUID();
    const adminUser: User = {
      id: adminUserId,
      username: "admin",
      password: "admin",
      email: "admin@electroproject.com",
      role: "admin",
      firstName: "John",
      lastName: "Smith",
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Create sample projects
    const project1Id = randomUUID();
    const project1: Project = {
      id: project1Id,
      projectCode: "ICP-2024-001",
      name: "Industrial Control Panel Upgrade",
      description: "Upgrade existing control panel systems with modern PLC and HMI interfaces",
      clientId: null,
      clientName: "Manufacturing Corp",
      clientContact: "Mike Johnson",
      status: "active",
      health: "on-track",
      progress: "78",
      budgetAmount: "500000",
      actualAmount: "485000",
      startDate: "2024-01-15",
      endDate: "2024-03-15",
      dueDate: "2024-03-15",
      projectType: "industrial-control",
      acumaticaId: "ACU-001",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(project1.id, project1);

    const project2Id = randomUUID();
    const project2: Project = {
      id: project2Id,
      projectCode: "WEI-2024-002",
      name: "Warehouse Electrical Installation",
      description: "Complete electrical installation for new warehouse facility",
      clientId: null,
      clientName: "Logistics Solutions",
      clientContact: "Sarah Wilson",
      status: "active",
      health: "at-risk",
      progress: "45",
      budgetAmount: "315000",
      actualAmount: "328000",
      startDate: "2024-02-01",
      endDate: "2024-04-30",
      dueDate: "2024-04-02",
      projectType: "warehouse-electrical",
      acumaticaId: "ACU-002",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(project2.id, project2);

    const project3Id = randomUUID();
    const project3: Project = {
      id: project3Id,
      projectCode: "HCS-2024-003",
      name: "HVAC Control System Retrofit",
      description: "Retrofit existing HVAC controls with smart building automation",
      clientId: null,
      clientName: "Office Complex LLC",
      clientContact: "David Chen",
      status: "active",
      health: "on-track",
      progress: "92",
      budgetAmount: "220000",
      actualAmount: "195000",
      startDate: "2023-12-01",
      endDate: "2024-02-28",
      dueDate: "2024-02-28",
      projectType: "hvac-control",
      acumaticaId: "ACU-003",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(project3.id, project3);

    // Create sample tasks
    const task1Id = randomUUID();
    const task1: Task = {
      id: task1Id,
      projectId: project1Id,
      parentTaskId: null,
      name: "Site Survey and Assessment",
      description: "Conduct thorough site survey and existing system assessment",
      status: "completed",
      priority: "high",
      progress: "100",
      estimatedHours: "40",
      actualHours: "38",
      budgetAmount: "8000",
      actualAmount: "7600",
      startDate: "2024-01-15",
      endDate: "2024-01-19",
      dueDate: "2024-01-19",
      assignedTo: adminUserId,
      taskCode: "ICP-001-01",
      level: 1,
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(task1.id, task1);

    const task2Id = randomUUID();
    const task2: Task = {
      id: task2Id,
      projectId: project1Id,
      parentTaskId: null,
      name: "PLC Programming",
      description: "Program new Allen-Bradley PLC with updated control logic",
      status: "in-progress",
      priority: "critical",
      progress: "65",
      estimatedHours: "80",
      actualHours: "52",
      budgetAmount: "16000",
      actualAmount: "10400",
      startDate: "2024-02-01",
      endDate: "2024-02-20",
      dueDate: "2024-02-20",
      assignedTo: adminUserId,
      taskCode: "ICP-001-02",
      level: 1,
      sortOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(task2.id, task2);

    const task3Id = randomUUID();
    const task3: Task = {
      id: task3Id,
      projectId: project2Id,
      parentTaskId: null,
      name: "Electrical Panel Installation",
      description: "Install main electrical distribution panels",
      status: "not-started",
      priority: "high",
      progress: "0",
      estimatedHours: "60",
      actualHours: "0",
      budgetAmount: "12000",
      actualAmount: "0",
      startDate: "2024-03-01",
      endDate: "2024-03-10",
      dueDate: "2024-03-10",
      assignedTo: adminUserId,
      taskCode: "WEI-002-01",
      level: 1,
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(task3.id, task3);

    // Create sample time entries
    const timeEntry1Id = randomUUID();
    const timeEntry1: TimeEntry = {
      id: timeEntry1Id,
      projectId: project1Id,
      taskId: task1Id,
      userId: adminUserId,
      date: "2024-01-15",
      hours: "8",
      description: "Initial site survey and documentation",
      hourlyRate: "75",
      totalAmount: "600",
      isApproved: true,
      approvedBy: adminUserId,
      acumaticaId: "TIME-001",
      lumberTimeId: "LT-001",
      createdAt: new Date(),
    };
    this.timeEntries.set(timeEntry1.id, timeEntry1);

    const timeEntry2Id = randomUUID();
    const timeEntry2: TimeEntry = {
      id: timeEntry2Id,
      projectId: project1Id,
      taskId: task2Id,
      userId: adminUserId,
      date: "2024-02-01",
      hours: "6.5",
      description: "PLC programming and testing",
      hourlyRate: "85",
      totalAmount: "552.50",
      isApproved: false,
      approvedBy: null,
      acumaticaId: "TIME-002",
      lumberTimeId: "LT-002",
      createdAt: new Date(),
    };
    this.timeEntries.set(timeEntry2.id, timeEntry2);

    // Create sample RFIs
    const rfi1Id = randomUUID();
    const rfi1: RFI = {
      id: rfi1Id,
      projectId: project1Id,
      rfiNumber: "RFI-001",
      title: "Control Panel Specifications Clarification",
      description: "Need clarification on specific control panel requirements for Zone 3",
      status: "open",
      priority: "medium",
      submittedBy: adminUserId,
      assignedTo: null,
      submittedDate: "2024-02-05",
      requiredDate: "2024-02-12",
      answeredDate: null,
      answer: null,
      attachments: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rfis.set(rfi1.id, rfi1);

    const rfi2Id = randomUUID();
    const rfi2: RFI = {
      id: rfi2Id,
      projectId: project2Id,
      rfiNumber: "RFI-002",
      title: "Warehouse Power Requirements",
      description: "Clarification needed on power requirements for automated equipment",
      status: "pending",
      priority: "high",
      submittedBy: adminUserId,
      assignedTo: null,
      submittedDate: "2024-02-10",
      requiredDate: "2024-02-17",
      answeredDate: null,
      answer: null,
      attachments: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rfis.set(rfi2.id, rfi2);

    // Create sample change orders
    const co1Id = randomUUID();
    const co1: ChangeOrder = {
      id: co1Id,
      projectId: project1Id,
      coNumber: "CO-001",
      title: "Additional Safety Interlocks",
      description: "Add additional safety interlocks as requested by safety engineer",
      status: "approved",
      type: "addition",
      requestedBy: adminUserId,
      approvedBy: adminUserId,
      costImpact: "15000",
      timeImpact: 5,
      submittedDate: "2024-01-25",
      approvedDate: "2024-01-30",
      implementedDate: null,
      justification: "Safety requirement identified during initial assessment",
      attachments: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.changeOrders.set(co1.id, co1);

    // Create sample risks
    const risk1Id = randomUUID();
    const risk1: Risk = {
      id: risk1Id,
      projectId: project1Id,
      title: "Equipment Delivery Delays",
      description: "Risk of PLC equipment delivery delays due to supply chain issues",
      category: "schedule",
      probability: "medium",
      impact: "high",
      riskScore: 6,
      status: "monitoring",
      owner: adminUserId,
      identifiedDate: "2024-01-20",
      targetDate: "2024-02-15",
      mitigationPlan: "Identify alternative suppliers and expedite orders",
      contingencyPlan: "Use existing equipment from warehouse if available",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.risks.set(risk1.id, risk1);

    const risk2Id = randomUUID();
    const risk2: Risk = {
      id: risk2Id,
      projectId: project2Id,
      title: "Weather-Related Construction Delays",
      description: "Winter weather conditions may impact outdoor electrical work",
      category: "schedule",
      probability: "high",
      impact: "medium",
      riskScore: 6,
      status: "open",
      owner: adminUserId,
      identifiedDate: "2024-02-01",
      targetDate: "2024-03-01",
      mitigationPlan: "Schedule weather-sensitive work for better weather periods",
      contingencyPlan: "Use temporary weather protection structures",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.risks.set(risk2.id, risk2);

    // Create sample sync records
    const sync1Id = randomUUID();
    const sync1: AcumaticaSync = {
      id: sync1Id,
      syncType: "projects",
      status: "completed",
      recordsProcessed: 25,
      recordsSuccessful: 23,
      recordsFailed: 2,
      errorMessage: null,
      syncData: null,
      startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 5 * 60 * 1000), // 5 minutes later
    };
    this.acumaticaSyncs.set(sync1.id, sync1);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      role: insertUser.role ?? "user"
    };
    this.users.set(id, user);
    return user;
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      ...insertProject,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: insertProject.status ?? "active",
      health: insertProject.health ?? "on-track",
      progress: insertProject.progress ?? "0",
      actualAmount: insertProject.actualAmount ?? "0",
      description: insertProject.description ?? null,
      clientId: insertProject.clientId ?? null,
      clientContact: insertProject.clientContact ?? null,
      budgetAmount: insertProject.budgetAmount ?? null,
      startDate: insertProject.startDate ?? null,
      endDate: insertProject.endDate ?? null,
      dueDate: insertProject.dueDate ?? null,
      projectType: insertProject.projectType ?? null,
      acumaticaId: insertProject.acumaticaId ?? null
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updateData: Partial<InsertProject>): Promise<Project | undefined> {
    const existing = this.projects.get(id);
    if (!existing) return undefined;
    
    const updated: Project = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.projectId === projectId);
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = {
      ...insertTask,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: insertTask.status ?? "not-started",
      priority: insertTask.priority ?? "medium",
      progress: insertTask.progress ?? "0",
      actualHours: insertTask.actualHours ?? "0",
      actualAmount: insertTask.actualAmount ?? "0",
      level: insertTask.level ?? 1,
      sortOrder: insertTask.sortOrder ?? 0,
      description: insertTask.description ?? null,
      parentTaskId: insertTask.parentTaskId ?? null,
      estimatedHours: insertTask.estimatedHours ?? null,
      budgetAmount: insertTask.budgetAmount ?? null,
      startDate: insertTask.startDate ?? null,
      endDate: insertTask.endDate ?? null,
      dueDate: insertTask.dueDate ?? null,
      assignedTo: insertTask.assignedTo ?? null,
      taskCode: insertTask.taskCode ?? null
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;
    
    const updated: Task = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Time Entries
  async getTimeEntries(): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values());
  }

  async getTimeEntriesByProject(projectId: string): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values()).filter(entry => entry.projectId === projectId);
  }

  async getTimeEntriesByUser(userId: string): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values()).filter(entry => entry.userId === userId);
  }

  async createTimeEntry(insertTimeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const id = randomUUID();
    const timeEntry: TimeEntry = {
      ...insertTimeEntry,
      id,
      createdAt: new Date(),
      isApproved: insertTimeEntry.isApproved ?? false,
      description: insertTimeEntry.description ?? null,
      taskId: insertTimeEntry.taskId ?? null,
      hourlyRate: insertTimeEntry.hourlyRate ?? null,
      totalAmount: insertTimeEntry.totalAmount ?? null,
      approvedBy: insertTimeEntry.approvedBy ?? null,
      acumaticaId: insertTimeEntry.acumaticaId ?? null,
      lumberTimeId: insertTimeEntry.lumberTimeId ?? null
    };
    this.timeEntries.set(id, timeEntry);
    return timeEntry;
  }

  async updateTimeEntry(id: string, updateData: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const existing = this.timeEntries.get(id);
    if (!existing) return undefined;
    
    const updated: TimeEntry = { ...existing, ...updateData };
    this.timeEntries.set(id, updated);
    return updated;
  }

  async deleteTimeEntry(id: string): Promise<boolean> {
    return this.timeEntries.delete(id);
  }

  // RFIs
  async getRfis(): Promise<RFI[]> {
    return Array.from(this.rfis.values());
  }

  async getRfisByProject(projectId: string): Promise<RFI[]> {
    return Array.from(this.rfis.values()).filter(rfi => rfi.projectId === projectId);
  }

  async getRfi(id: string): Promise<RFI | undefined> {
    return this.rfis.get(id);
  }

  async createRfi(insertRfi: InsertRFI): Promise<RFI> {
    const id = randomUUID();
    const rfi: RFI = {
      ...insertRfi,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: insertRfi.status ?? "open",
      priority: insertRfi.priority ?? "medium",
      assignedTo: insertRfi.assignedTo ?? null,
      requiredDate: insertRfi.requiredDate ?? null,
      answeredDate: insertRfi.answeredDate ?? null,
      answer: insertRfi.answer ?? null,
      attachments: insertRfi.attachments ?? null
    };
    this.rfis.set(id, rfi);
    return rfi;
  }

  async updateRfi(id: string, updateData: Partial<InsertRFI>): Promise<RFI | undefined> {
    const existing = this.rfis.get(id);
    if (!existing) return undefined;
    
    const updated: RFI = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.rfis.set(id, updated);
    return updated;
  }

  async deleteRfi(id: string): Promise<boolean> {
    return this.rfis.delete(id);
  }

  // Change Orders
  async getChangeOrders(): Promise<ChangeOrder[]> {
    return Array.from(this.changeOrders.values());
  }

  async getChangeOrdersByProject(projectId: string): Promise<ChangeOrder[]> {
    return Array.from(this.changeOrders.values()).filter(co => co.projectId === projectId);
  }

  async getChangeOrder(id: string): Promise<ChangeOrder | undefined> {
    return this.changeOrders.get(id);
  }

  async createChangeOrder(insertChangeOrder: InsertChangeOrder): Promise<ChangeOrder> {
    const id = randomUUID();
    const changeOrder: ChangeOrder = {
      ...insertChangeOrder,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: insertChangeOrder.status ?? "draft",
      costImpact: insertChangeOrder.costImpact ?? "0",
      timeImpact: insertChangeOrder.timeImpact ?? 0,
      approvedBy: insertChangeOrder.approvedBy ?? null,
      approvedDate: insertChangeOrder.approvedDate ?? null,
      implementedDate: insertChangeOrder.implementedDate ?? null,
      justification: insertChangeOrder.justification ?? null,
      attachments: insertChangeOrder.attachments ?? null
    };
    this.changeOrders.set(id, changeOrder);
    return changeOrder;
  }

  async updateChangeOrder(id: string, updateData: Partial<InsertChangeOrder>): Promise<ChangeOrder | undefined> {
    const existing = this.changeOrders.get(id);
    if (!existing) return undefined;
    
    const updated: ChangeOrder = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.changeOrders.set(id, updated);
    return updated;
  }

  async deleteChangeOrder(id: string): Promise<boolean> {
    return this.changeOrders.delete(id);
  }

  // Risks
  async getRisks(): Promise<Risk[]> {
    return Array.from(this.risks.values());
  }

  async getRisksByProject(projectId: string): Promise<Risk[]> {
    return Array.from(this.risks.values()).filter(risk => risk.projectId === projectId);
  }

  async getRisk(id: string): Promise<Risk | undefined> {
    return this.risks.get(id);
  }

  async createRisk(insertRisk: InsertRisk): Promise<Risk> {
    const id = randomUUID();
    const risk: Risk = {
      ...insertRisk,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: insertRisk.status ?? "open",
      riskScore: insertRisk.riskScore ?? null,
      targetDate: insertRisk.targetDate ?? null,
      mitigationPlan: insertRisk.mitigationPlan ?? null,
      contingencyPlan: insertRisk.contingencyPlan ?? null
    };
    this.risks.set(id, risk);
    return risk;
  }

  async updateRisk(id: string, updateData: Partial<InsertRisk>): Promise<Risk | undefined> {
    const existing = this.risks.get(id);
    if (!existing) return undefined;
    
    const updated: Risk = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.risks.set(id, updated);
    return updated;
  }

  async deleteRisk(id: string): Promise<boolean> {
    return this.risks.delete(id);
  }

  // Acumatica Sync
  async getAcumaticaSyncs(): Promise<AcumaticaSync[]> {
    return Array.from(this.acumaticaSyncs.values());
  }

  async createAcumaticaSync(insertSync: InsertAcumaticaSync): Promise<AcumaticaSync> {
    const id = randomUUID();
    const sync: AcumaticaSync = { 
      ...insertSync, 
      id,
      recordsProcessed: insertSync.recordsProcessed ?? 0,
      recordsSuccessful: insertSync.recordsSuccessful ?? 0,
      recordsFailed: insertSync.recordsFailed ?? 0,
      errorMessage: insertSync.errorMessage ?? null,
      syncData: insertSync.syncData ?? null,
      completedAt: insertSync.completedAt ?? null
    };
    this.acumaticaSyncs.set(id, sync);
    return sync;
  }

  async updateAcumaticaSync(id: string, updateData: Partial<InsertAcumaticaSync>): Promise<AcumaticaSync | undefined> {
    const existing = this.acumaticaSyncs.get(id);
    if (!existing) return undefined;
    
    const updated: AcumaticaSync = { ...existing, ...updateData };
    this.acumaticaSyncs.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
