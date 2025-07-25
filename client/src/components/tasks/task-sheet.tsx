import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Filter, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronRight,
  ChevronDown,
  MoreHorizontal
} from "lucide-react";
import { ChartUtils } from "@/lib/chart-utils";
import type { Task, Project } from "@shared/schema";

interface TaskSheetProps {
  tasks: Task[];
  projects: Project[];
  isLoading?: boolean;
}

interface TaskHierarchy extends Task {
  project?: Project;
  children?: TaskHierarchy[];
  isExpanded?: boolean;
}

export default function TaskSheet({ tasks, projects, isLoading }: TaskSheetProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hierarchicalTasks = buildTaskHierarchy(tasks, projects);
  const filteredTasks = filterTasks(hierarchicalTasks, searchTerm, filterProject, filterStatus);
  const visibleTasks = flattenVisibleTasks(filteredTasks, expandedTasks);

  const toggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const toggleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'secondary';
      case 'in-progress': return 'default';
      case 'blocked': return 'destructive';
      case 'not-started': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'outline';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle>Task Sheet</CardTitle>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline">
              <Plus size={16} className="mr-2" />
              Add Task
            </Button>
            <Button size="sm" variant="outline">
              Bulk Edit
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not-started">Not Started</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Filter size={16} className="mr-2" />
            More Filters
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full overflow-auto custom-scrollbar">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="w-12">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTasks(new Set(visibleTasks.map(t => t.id)));
                      } else {
                        setSelectedTasks(new Set());
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="w-8"></TableHead>
                <TableHead className="min-w-[300px]">Task Name</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Estimated Hours</TableHead>
                <TableHead>Actual Hours</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                    No tasks found. Adjust your filters or create a new task.
                  </TableCell>
                </TableRow>
              ) : (
                visibleTasks.map((task) => {
                  const hasChildren = task.children && task.children.length > 0;
                  const isExpanded = expandedTasks.has(task.id);
                  const progress = parseFloat(task.progress || '0');
                  const estimatedHours = parseFloat(task.estimatedHours || '0');
                  const actualHours = parseFloat(task.actualHours || '0');
                  const budget = parseFloat(task.budgetAmount || '0');
                  const actual = parseFloat(task.actualAmount || '0');

                  return (
                    <TableRow 
                      key={task.id}
                      className={`${selectedTasks.has(task.id) ? 'bg-primary/10' : ''} hover:bg-muted/50`}
                    >
                      <TableCell>
                        <input 
                          type="checkbox"
                          className="h-4 w-4"
                          checked={selectedTasks.has(task.id)}
                          onChange={() => toggleSelectTask(task.id)}
                        />
                      </TableCell>
                      
                      <TableCell>
                        {hasChildren && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-6 w-6"
                            onClick={() => toggleExpand(task.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </Button>
                        )}
                      </TableCell>

                      <TableCell>
                        <div 
                          className="font-medium"
                          style={{ paddingLeft: `${(task.level || 0) * 20}px` }}
                        >
                          {task.name}
                        </div>
                        {task.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {task.description}
                          </div>
                        )}
                        {task.taskCode && (
                          <div className="text-xs text-gray-400">
                            Code: {task.taskCode}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        {task.project && (
                          <div>
                            <div className="font-medium text-sm">{task.project.name}</div>
                            <div className="text-xs text-gray-500">{task.project.projectCode}</div>
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(task.status)}>
                          {task.status.replace('-', ' ')}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(task.priority)}>
                          {task.priority}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="w-24">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </TableCell>

                      <TableCell>
                        {task.assignedTo ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-white">
                              U
                            </div>
                            <span className="text-sm">User</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Unassigned</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {task.dueDate ? (
                          <span className={
                            new Date(task.dueDate) < new Date() 
                              ? 'text-destructive font-medium' 
                              : 'text-gray-900'
                          }>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-gray-400">Not set</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="text-sm">
                          {estimatedHours > 0 ? ChartUtils.formatHours(estimatedHours) : '-'}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm font-medium">
                          {actualHours > 0 ? ChartUtils.formatHours(actualHours) : '-'}
                        </span>
                        {estimatedHours > 0 && actualHours > 0 && (
                          <div className={`text-xs ${
                            actualHours > estimatedHours ? 'text-destructive' : 'text-secondary'
                          }`}>
                            {actualHours > estimatedHours ? 'Over' : 'Under'} by {Math.abs(actualHours - estimatedHours).toFixed(1)}h
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {budget > 0 ? ChartUtils.formatCurrency(actual) : '-'}
                          {budget > 0 && (
                            <div className="text-xs text-gray-500">
                              / {ChartUtils.formatCurrency(budget)}
                            </div>
                          )}
                        </div>
                        {budget > 0 && actual > 0 && (
                          <div className={`text-xs ${
                            actual > budget ? 'text-destructive' : 'text-secondary'
                          }`}>
                            {ChartUtils.formatPercentage(((actual - budget) / budget) * 100)} 
                            {actual > budget ? ' over' : ' under'}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit size={14} />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 size={14} />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function buildTaskHierarchy(tasks: Task[], projects: Project[]): TaskHierarchy[] {
  const projectMap = new Map(projects.map(p => [p.id, p]));
  const taskMap = new Map<string, TaskHierarchy>();
  const rootTasks: TaskHierarchy[] = [];

  // Create task objects with project references
  tasks.forEach(task => {
    const hierarchyTask: TaskHierarchy = {
      ...task,
      project: projectMap.get(task.projectId),
      children: [],
    };
    taskMap.set(task.id, hierarchyTask);
  });

  // Build hierarchy
  taskMap.forEach(task => {
    if (task.parentTaskId && taskMap.has(task.parentTaskId)) {
      const parent = taskMap.get(task.parentTaskId)!;
      parent.children = parent.children || [];
      parent.children.push(task);
    } else {
      rootTasks.push(task);
    }
  });

  return rootTasks;
}

function filterTasks(
  tasks: TaskHierarchy[], 
  searchTerm: string, 
  filterProject: string, 
  filterStatus: string
): TaskHierarchy[] {
  return tasks.filter(task => {
    const matchesSearch = !searchTerm || 
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.taskCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProject = filterProject === 'all' || task.projectId === filterProject;
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;

    const matchesFilters = matchesSearch && matchesProject && matchesStatus;

    if (matchesFilters) {
      return true;
    }

    // Include if any children match
    if (task.children) {
      const filteredChildren = filterTasks(task.children, searchTerm, filterProject, filterStatus);
      task.children = filteredChildren;
      return filteredChildren.length > 0;
    }

    return false;
  });
}

function flattenVisibleTasks(tasks: TaskHierarchy[], expandedTasks: Set<string>): TaskHierarchy[] {
  const result: TaskHierarchy[] = [];

  function traverse(taskList: TaskHierarchy[], level = 0) {
    taskList.forEach(task => {
      const taskWithLevel = { ...task, level };
      result.push(taskWithLevel);

      if (task.children && task.children.length > 0 && expandedTasks.has(task.id)) {
        traverse(task.children, level + 1);
      }
    });
  }

  traverse(tasks);
  return result;
}
