import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, ChevronDown, Calendar, Plus, Minus } from "lucide-react";
import { ChartUtils } from "@/lib/chart-utils";
import type { Task, Project } from "@shared/schema";

interface GanttChartProps {
  tasks: Task[];
  projects: Project[];
  isLoading?: boolean;
}

interface GanttItem {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  type: 'project' | 'task';
  level: number;
  parentId?: string;
  isExpanded?: boolean;
  children?: GanttItem[];
}

export default function GanttChart({ tasks, projects, isLoading }: GanttChartProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [scale, setScale] = useState<'days' | 'weeks' | 'months'>('weeks');
  const scrollRef = useRef<HTMLDivElement>(null);

  const ganttData = generateGanttData(projects, tasks);
  const timeRange = calculateTimeRange(ganttData);
  const timeColumns = generateTimeColumns(timeRange.start, timeRange.end, scale);

  useEffect(() => {
    // Auto-expand all projects by default
    const projectIds = projects.map(p => p.id);
    setExpandedItems(new Set(projectIds));
  }, [projects]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const visibleItems = filterVisibleItems(ganttData, expandedItems);

  const toggleExpand = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getTaskPosition = (start: Date, end: Date) => {
    const totalDays = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24);
    const startDays = (start.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    
    const left = (startDays / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    
    return { left: `${Math.max(0, left)}%`, width: `${Math.max(1, width)}%` };
  };

  const getTaskColor = (type: string, status?: string) => {
    if (type === 'project') return 'bg-primary';
    
    switch (status) {
      case 'completed': return 'bg-secondary';
      case 'in-progress': return 'bg-warning';
      case 'blocked': return 'bg-destructive';
      default: return 'bg-gray-400';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle>Gantt Chart</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale('days')}
              className={scale === 'days' ? 'bg-primary text-white' : ''}
            >
              Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale('weeks')}
              className={scale === 'weeks' ? 'bg-primary text-white' : ''}
            >
              Weeks
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale('months')}
              className={scale === 'months' ? 'bg-primary text-white' : ''}
            >
              Months
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full flex">
          {/* Task List */}
          <div className="w-80 border-r border-gray-200 flex-shrink-0">
            <div className="h-12 border-b border-gray-200 bg-gray-50 flex items-center px-4 font-medium text-sm">
              Task Name
            </div>
            <div className="overflow-y-auto custom-scrollbar" style={{ height: 'calc(100% - 3rem)' }}>
              {visibleItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    selectedItem === item.id ? 'bg-primary/10 border-primary' : ''
                  }`}
                  style={{ paddingLeft: `${16 + item.level * 20}px` }}
                  onClick={() => setSelectedItem(item.id)}
                >
                  {item.children && item.children.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-6 w-6 mr-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(item.id);
                      }}
                    >
                      {expandedItems.has(item.id) ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </Button>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className={`truncate ${item.type === 'project' ? 'font-semibold' : 'text-sm'}`}>
                      {item.name}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                      >
                        {item.progress}%
                      </Badge>
                      {item.type === 'project' && (
                        <span className="text-xs text-gray-500">
                          {item.children?.length || 0} tasks
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-x-auto custom-scrollbar" ref={scrollRef}>
            <div className="min-w-full">
              {/* Timeline Header */}
              <div className="h-12 border-b border-gray-200 bg-gray-50 flex">
                {timeColumns.map((column, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 border-r border-gray-200 px-2 py-2 text-xs font-medium text-center"
                    style={{ width: `${100 / timeColumns.length}%` }}
                  >
                    {column.label}
                  </div>
                ))}
              </div>

              {/* Timeline Content */}
              <div className="relative">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex">
                  {timeColumns.map((_, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 border-r border-gray-100"
                      style={{ width: `${100 / timeColumns.length}%` }}
                    />
                  ))}
                </div>

                {/* Task Bars */}
                {visibleItems.map((item, index) => {
                  const position = getTaskPosition(item.start, item.end);
                  const taskColor = getTaskColor(item.type, 
                    item.type === 'task' ? tasks.find(t => t.id === item.id)?.status : undefined
                  );

                  return (
                    <div
                      key={item.id}
                      className="relative h-12 border-b border-gray-100 hover:bg-gray-50"
                      onClick={() => setSelectedItem(item.id)}
                    >
                      <div
                        className={`absolute top-2 h-8 ${taskColor} rounded-sm flex items-center justify-between px-2 text-white text-xs font-medium shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                        style={position}
                      >
                        <span className="truncate flex-1">
                          {item.progress > 0 && `${item.progress}%`}
                        </span>
                        
                        {/* Progress indicator */}
                        {item.progress > 0 && (
                          <div className="absolute inset-0 bg-white/20 rounded-sm">
                            <div
                              className="h-full bg-white/30 rounded-sm transition-all"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function generateGanttData(projects: Project[], tasks: Task[]): GanttItem[] {
  return projects.map(project => {
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    const projectStart = new Date(project.startDate || Date.now());
    const projectEnd = new Date(project.endDate || Date.now());

    const children: GanttItem[] = projectTasks.map(task => ({
      id: task.id,
      name: task.name,
      start: new Date(task.startDate || projectStart),
      end: new Date(task.endDate || projectEnd),
      progress: parseFloat(task.progress || '0'),
      type: 'task' as const,
      level: task.level || 1,
      parentId: project.id,
    }));

    return {
      id: project.id,
      name: project.name,
      start: projectStart,
      end: projectEnd,
      progress: parseFloat(project.progress || '0'),
      type: 'project' as const,
      level: 0,
      children,
    };
  });
}

function calculateTimeRange(items: GanttItem[]) {
  const allDates = items.flatMap(item => [
    item.start,
    item.end,
    ...(item.children?.flatMap(child => [child.start, child.end]) || [])
  ]);

  const start = new Date(Math.min(...allDates.map(d => d.getTime())));
  const end = new Date(Math.max(...allDates.map(d => d.getTime())));

  // Add some padding
  start.setDate(start.getDate() - 7);
  end.setDate(end.getDate() + 7);

  return { start, end };
}

function generateTimeColumns(start: Date, end: Date, scale: 'days' | 'weeks' | 'months') {
  const columns = [];
  const current = new Date(start);

  while (current <= end) {
    let label = '';
    const next = new Date(current);

    switch (scale) {
      case 'days':
        label = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        next.setDate(next.getDate() + 1);
        break;
      case 'weeks':
        const weekStart = new Date(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        label = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        next.setDate(next.getDate() + 7);
        break;
      case 'months':
        label = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        next.setMonth(next.getMonth() + 1);
        break;
    }

    columns.push({ label, date: new Date(current) });
    current.setTime(next.getTime());

    if (columns.length > 50) break; // Prevent infinite loops
  }

  return columns;
}

function filterVisibleItems(items: GanttItem[], expandedItems: Set<string>): GanttItem[] {
  const result: GanttItem[] = [];

  for (const item of items) {
    result.push(item);
    
    if (item.children && expandedItems.has(item.id)) {
      result.push(...item.children);
    }
  }

  return result;
}
