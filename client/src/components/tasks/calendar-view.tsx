import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Filter,
  Plus,
  Clock,
  AlertTriangle
} from "lucide-react";
import { ChartUtils } from "@/lib/chart-utils";
import type { Task, Project } from "@shared/schema";

interface CalendarViewProps {
  tasks: Task[];
  projects: Project[];
  isLoading?: boolean;
}

interface CalendarTask extends Task {
  project?: Project;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: CalendarTask[];
}

export default function CalendarView({ tasks, projects, isLoading }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const projectMap = new Map(projects.map(p => [p.id, p]));
  const calendarTasks: CalendarTask[] = tasks.map(task => ({
    ...task,
    project: projectMap.get(task.projectId),
  }));

  const filteredTasks = calendarTasks.filter(task => {
    const matchesProject = filterProject === 'all' || task.projectId === filterProject;
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesProject && matchesStatus;
  });

  const calendarDays = generateCalendarDays(currentDate, view, filteredTasks);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const navigate = (direction: 'prev' | 'next') => {
    if (view === 'month') {
      navigateMonth(direction);
    } else {
      navigateWeek(direction);
    }
  };

  const getTaskColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-secondary';
      case 'in-progress': return 'bg-primary';
      case 'blocked': return 'bg-destructive';
      case 'not-started': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const formatDateHeader = () => {
    if (view === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
      } else {
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${weekStart.getFullYear()}`;
      }
    }
  };

  const todayTasks = filteredTasks.filter(task => {
    const today = new Date();
    const taskDate = new Date(task.dueDate || task.endDate || '');
    return isSameDay(taskDate, today);
  });

  const overdueTasks = filteredTasks.filter(task => {
    const today = new Date();
    const taskDate = new Date(task.dueDate || task.endDate || '');
    return taskDate < today && task.status !== 'completed';
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CalendarIcon size={24} />
            <span>Task Calendar</span>
          </CardTitle>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('month')}
              className={view === 'month' ? 'bg-primary text-white' : ''}
            >
              Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('week')}
              className={view === 'week' ? 'bg-primary text-white' : ''}
            >
              Week
            </Button>
          </div>
        </div>

        {/* Navigation and Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigate('prev')}>
                <ChevronLeft size={16} />
              </Button>
              <h3 className="text-lg font-semibold min-w-[200px] text-center">
                {formatDateHeader()}
              </h3>
              <Button variant="outline" size="sm" onClick={() => navigate('next')}>
                <ChevronRight size={16} />
              </Button>
            </div>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-40">
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
              <Plus size={16} className="mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {(todayTasks.length > 0 || overdueTasks.length > 0) && (
          <div className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
            {todayTasks.length > 0 && (
              <div className="flex items-center space-x-2">
                <Clock size={16} className="text-primary" />
                <span className="text-sm font-medium">
                  {todayTasks.length} task{todayTasks.length !== 1 ? 's' : ''} due today
                </span>
              </div>
            )}
            {overdueTasks.length > 0 && (
              <div className="flex items-center space-x-2">
                <AlertTriangle size={16} className="text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full overflow-auto custom-scrollbar">
          {/* Calendar Grid */}
          <div className="p-4">
            {view === 'month' ? (
              <MonthView calendarDays={calendarDays} getTaskColor={getTaskColor} />
            ) : (
              <WeekView calendarDays={calendarDays} getTaskColor={getTaskColor} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MonthView({ 
  calendarDays, 
  getTaskColor 
}: { 
  calendarDays: CalendarDay[];
  getTaskColor: (status: string) => string;
}) {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="space-y-4">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2">
        {weekdays.map(day => (
          <div key={day} className="p-2 text-center font-semibold text-gray-700 bg-gray-50 rounded">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`min-h-[120px] p-2 border rounded-lg ${
              day.isCurrentMonth 
                ? 'bg-white border-gray-200' 
                : 'bg-gray-50 border-gray-100'
            } ${
              day.isToday 
                ? 'ring-2 ring-primary ring-opacity-50' 
                : ''
            }`}
          >
            <div className={`text-sm font-medium mb-2 ${
              day.isCurrentMonth 
                ? day.isToday 
                  ? 'text-primary' 
                  : 'text-gray-900'
                : 'text-gray-400'
            }`}>
              {day.date.getDate()}
            </div>
            
            <div className="space-y-1">
              {day.tasks.slice(0, 3).map((task, taskIndex) => (
                <div
                  key={taskIndex}
                  className={`text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80 ${getTaskColor(task.status)}`}
                  title={`${task.name} - ${task.project?.name || 'No Project'}`}
                >
                  {task.name}
                </div>
              ))}
              {day.tasks.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{day.tasks.length - 3} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekView({ 
  calendarDays, 
  getTaskColor 
}: { 
  calendarDays: CalendarDay[];
  getTaskColor: (status: string) => string;
}) {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-4">
        {calendarDays.slice(0, 7).map((day, index) => (
          <div key={index} className="space-y-2">
            <div className={`text-center p-3 rounded-lg ${
              day.isToday 
                ? 'bg-primary text-white' 
                : 'bg-gray-50'
            }`}>
              <div className="font-semibold">{weekdays[index]}</div>
              <div className="text-2xl font-bold mt-1">
                {day.date.getDate()}
              </div>
            </div>
            
            <div className="space-y-2 min-h-[400px] bg-gray-50 rounded-lg p-3">
              {day.tasks.map((task, taskIndex) => (
                <div
                  key={taskIndex}
                  className={`p-2 rounded text-white text-sm cursor-pointer hover:opacity-80 ${getTaskColor(task.status)}`}
                >
                  <div className="font-medium truncate">{task.name}</div>
                  <div className="text-xs opacity-90">
                    {task.project?.name || 'No Project'}
                  </div>
                  {task.dueDate && (
                    <div className="text-xs opacity-90">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function generateCalendarDays(currentDate: Date, view: 'month' | 'week', tasks: CalendarTask[]): CalendarDay[] {
  const days: CalendarDay[] = [];
  const today = new Date();

  if (view === 'month') {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = getWeekStart(firstDay);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 41); // 6 weeks

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayTasks = getTasksForDate(date, tasks);
      
      days.push({
        date: new Date(date),
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
        isToday: isSameDay(date, today),
        tasks: dayTasks,
      });
    }
  } else {
    // Week view
    const weekStart = getWeekStart(currentDate);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      
      const dayTasks = getTasksForDate(date, tasks);
      
      days.push({
        date: new Date(date),
        isCurrentMonth: true,
        isToday: isSameDay(date, today),
        tasks: dayTasks,
      });
    }
  }

  return days;
}

function getWeekStart(date: Date): Date {
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  return weekStart;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

function getTasksForDate(date: Date, tasks: CalendarTask[]): CalendarTask[] {
  return tasks.filter(task => {
    const taskDate = new Date(task.dueDate || task.endDate || task.startDate || '');
    return isSameDay(taskDate, date);
  });
}
