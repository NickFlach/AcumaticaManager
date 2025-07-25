export interface DashboardMetrics {
  activeProjects: number;
  onTimeRate: string;
  budgetVariance: string;
  openRfis: number;
  totalBudget: number;
  totalActual: number;
  projectHealthStats: {
    onTrack: number;
    atRisk: number;
    behindSchedule: number;
  };
}

export interface ProjectWithTasks {
  id: string;
  projectCode: string;
  name: string;
  description?: string;
  clientName: string;
  clientContact?: string;
  status: string;
  health: string;
  progress: string;
  budgetAmount?: string;
  actualAmount: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  projectType?: string;
  tasks?: TaskWithSubtasks[];
}

export interface TaskWithSubtasks {
  id: string;
  projectId: string;
  parentTaskId?: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  progress: string;
  estimatedHours?: string;
  actualHours: string;
  budgetAmount?: string;
  actualAmount: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  assignedTo?: string;
  taskCode?: string;
  level: number;
  sortOrder: number;
  subtasks?: TaskWithSubtasks[];
}

export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies?: string[];
  type: 'task' | 'milestone' | 'project';
  level: number;
  isExpanded?: boolean;
  children?: GanttTask[];
}

export interface ExcelImportResult {
  success: boolean;
  recordsImported: number;
  errors: string[];
  warnings: string[];
}

export interface ExcelExportOptions {
  type: 'projects' | 'tasks' | 'time-entries' | 'rfis' | 'change-orders' | 'risks';
  filters?: Record<string, any>;
  includeSubtasks?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}
