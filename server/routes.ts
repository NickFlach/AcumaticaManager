import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertTaskSchema, insertTimeEntrySchema, insertRfiSchema, insertChangeOrderSchema, insertRiskSchema, insertAcumaticaSyncSchema } from "@shared/schema";
import { z } from "zod";
import { 
  requireAuth, 
  requireSession, 
  optionalAuth, 
  requireRole,
  requireEmailVerified,
  requireActiveAccount,
  authRequired,
  adminRequired,
  roleRequired,
  generalRateLimit
} from "./auth-middleware";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication demonstration routes - showing middleware in action
  app.get("/api/auth/test/public", (req, res) => {
    res.json({ message: "Public endpoint - no authentication required", user: req.user || null });
  });

  app.get("/api/auth/test/optional", optionalAuth, (req, res) => {
    res.json({ 
      message: "Optional authentication endpoint", 
      authenticated: !!req.user,
      user: req.user ? { id: req.user.id, username: req.user.username, role: req.user.role } : null 
    });
  });

  app.get("/api/auth/test/required", ...authRequired, (req, res) => {
    res.json({ 
      message: "Authentication required endpoint", 
      user: { id: req.user!.id, username: req.user!.username, role: req.user!.role },
      authMethod: req.authMethod
    });
  });

  app.get("/api/auth/test/admin", ...adminRequired, (req, res) => {
    res.json({ 
      message: "Admin only endpoint", 
      user: { id: req.user!.id, username: req.user!.username, role: req.user!.role }
    });
  });

  app.get("/api/auth/test/manager", ...roleRequired(['admin', 'manager']), (req, res) => {
    res.json({ 
      message: "Manager or Admin only endpoint", 
      user: { id: req.user!.id, username: req.user!.username, role: req.user!.role }
    });
  });

  // Projects routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid project data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, validatedData);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid project data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Tasks routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const { projectId } = req.query;
      const tasks = projectId 
        ? await storage.getTasksByProject(projectId as string)
        : await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid task data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, validatedData);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid task data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Time entries routes
  app.get("/api/time-entries", async (req, res) => {
    try {
      const { projectId, userId } = req.query;
      let timeEntries;
      if (projectId) {
        timeEntries = await storage.getTimeEntriesByProject(projectId as string);
      } else if (userId) {
        timeEntries = await storage.getTimeEntriesByUser(userId as string);
      } else {
        timeEntries = await storage.getTimeEntries();
      }
      res.json(timeEntries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch time entries" });
    }
  });

  app.post("/api/time-entries", async (req, res) => {
    try {
      const validatedData = insertTimeEntrySchema.parse(req.body);
      const timeEntry = await storage.createTimeEntry(validatedData);
      res.status(201).json(timeEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid time entry data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create time entry" });
    }
  });

  app.put("/api/time-entries/:id", async (req, res) => {
    try {
      const validatedData = insertTimeEntrySchema.partial().parse(req.body);
      const timeEntry = await storage.updateTimeEntry(req.params.id, validatedData);
      if (!timeEntry) {
        return res.status(404).json({ error: "Time entry not found" });
      }
      res.json(timeEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid time entry data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update time entry" });
    }
  });

  app.delete("/api/time-entries/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTimeEntry(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Time entry not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete time entry" });
    }
  });

  // RFIs routes
  app.get("/api/rfis", async (req, res) => {
    try {
      const { projectId } = req.query;
      const rfis = projectId 
        ? await storage.getRfisByProject(projectId as string)
        : await storage.getRfis();
      res.json(rfis);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch RFIs" });
    }
  });

  app.post("/api/rfis", async (req, res) => {
    try {
      const validatedData = insertRfiSchema.parse(req.body);
      const rfi = await storage.createRfi(validatedData);
      res.status(201).json(rfi);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid RFI data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create RFI" });
    }
  });

  app.put("/api/rfis/:id", async (req, res) => {
    try {
      const validatedData = insertRfiSchema.partial().parse(req.body);
      const rfi = await storage.updateRfi(req.params.id, validatedData);
      if (!rfi) {
        return res.status(404).json({ error: "RFI not found" });
      }
      res.json(rfi);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid RFI data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update RFI" });
    }
  });

  app.delete("/api/rfis/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteRfi(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "RFI not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete RFI" });
    }
  });

  // Change Orders routes
  app.get("/api/change-orders", async (req, res) => {
    try {
      const { projectId } = req.query;
      const changeOrders = projectId 
        ? await storage.getChangeOrdersByProject(projectId as string)
        : await storage.getChangeOrders();
      res.json(changeOrders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch change orders" });
    }
  });

  app.post("/api/change-orders", async (req, res) => {
    try {
      const validatedData = insertChangeOrderSchema.parse(req.body);
      const changeOrder = await storage.createChangeOrder(validatedData);
      res.status(201).json(changeOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid change order data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create change order" });
    }
  });

  app.put("/api/change-orders/:id", async (req, res) => {
    try {
      const validatedData = insertChangeOrderSchema.partial().parse(req.body);
      const changeOrder = await storage.updateChangeOrder(req.params.id, validatedData);
      if (!changeOrder) {
        return res.status(404).json({ error: "Change order not found" });
      }
      res.json(changeOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid change order data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update change order" });
    }
  });

  // Risks routes
  app.get("/api/risks", async (req, res) => {
    try {
      const { projectId } = req.query;
      const risks = projectId 
        ? await storage.getRisksByProject(projectId as string)
        : await storage.getRisks();
      res.json(risks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risks" });
    }
  });

  app.post("/api/risks", async (req, res) => {
    try {
      const validatedData = insertRiskSchema.parse(req.body);
      const risk = await storage.createRisk(validatedData);
      res.status(201).json(risk);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid risk data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create risk" });
    }
  });

  app.put("/api/risks/:id", async (req, res) => {
    try {
      const validatedData = insertRiskSchema.partial().parse(req.body);
      const risk = await storage.updateRisk(req.params.id, validatedData);
      if (!risk) {
        return res.status(404).json({ error: "Risk not found" });
      }
      res.json(risk);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid risk data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update risk" });
    }
  });

  // Acumatica Sync routes
  app.get("/api/acumatica/sync", async (req, res) => {
    try {
      const syncs = await storage.getAcumaticaSyncs();
      res.json(syncs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sync history" });
    }
  });

  app.post("/api/acumatica/sync", async (req, res) => {
    try {
      const { syncType } = req.body;
      if (!syncType) {
        return res.status(400).json({ error: "Sync type is required" });
      }

      const syncData = {
        syncType,
        status: "in-progress" as const,
        recordsProcessed: 0,
        recordsSuccessful: 0,
        recordsFailed: 0,
        startedAt: new Date(),
        syncData: null,
      };

      const sync = await storage.createAcumaticaSync(syncData);

      // Simulate sync process
      setTimeout(async () => {
        await storage.updateAcumaticaSync(sync.id, {
          status: "completed",
          recordsProcessed: 100,
          recordsSuccessful: 98,
          recordsFailed: 2,
          completedAt: new Date(),
        });
      }, 2000);

      res.status(201).json(sync);
    } catch (error) {
      res.status(500).json({ error: "Failed to start sync" });
    }
  });

  // Dashboard metrics endpoint
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      const tasks = await storage.getTasks();
      const rfis = await storage.getRfis();
      const timeEntries = await storage.getTimeEntries();

      const activeProjects = projects.filter(p => p.status === "active").length;
      const onTimeProjects = projects.filter(p => p.health === "on-track").length;
      const totalProjects = projects.length;
      const onTimeRate = totalProjects > 0 ? Math.round((onTimeProjects / totalProjects) * 100) : 0;
      
      const totalBudget = projects.reduce((sum, p) => sum + (parseFloat(p.budgetAmount || "0")), 0);
      const totalActual = projects.reduce((sum, p) => sum + (parseFloat(p.actualAmount || "0")), 0);
      const budgetVariance = totalBudget > 0 ? ((totalActual - totalBudget) / totalBudget) * 100 : 0;
      
      const openRfis = rfis.filter(r => r.status === "open").length;

      res.json({
        activeProjects,
        onTimeRate: `${onTimeRate}%`,
        budgetVariance: `${budgetVariance.toFixed(1)}%`,
        openRfis,
        totalBudget,
        totalActual,
        projectHealthStats: {
          onTrack: projects.filter(p => p.health === "on-track").length,
          atRisk: projects.filter(p => p.health === "at-risk").length,
          behindSchedule: projects.filter(p => p.health === "behind-schedule").length,
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // Excel export endpoint
  app.get("/api/export/:type", async (req, res) => {
    try {
      const { type } = req.params;
      let data;

      switch (type) {
        case "projects":
          data = await storage.getProjects();
          break;
        case "tasks":
          data = await storage.getTasks();
          break;
        case "time-entries":
          data = await storage.getTimeEntries();
          break;
        case "rfis":
          data = await storage.getRfis();
          break;
        case "change-orders":
          data = await storage.getChangeOrders();
          break;
        case "risks":
          data = await storage.getRisks();
          break;
        default:
          return res.status(400).json({ error: "Invalid export type" });
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
