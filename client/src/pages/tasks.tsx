import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import GanttChart from "@/components/tasks/gantt-chart";
import TaskSheet from "@/components/tasks/task-sheet";
import CalendarView from "@/components/tasks/calendar-view";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Grid3X3, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Task, Project } from "@shared/schema";

export default function Tasks() {
  const [activeView, setActiveView] = useState<'gantt' | 'sheet' | 'calendar'>('gantt');
  const { toast } = useToast();

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const handleNewTask = () => {
    toast({
      title: "Feature Coming Soon",
      description: "New task creation will be available soon",
    });
  };

  const handleExport = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Task export functionality will be available soon",
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Task Management"
        subtitle="Plan, track, and manage project tasks with Gantt charts, sheet views, and calendar views"
        actions={
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleExport}>
              Export Tasks
            </Button>
            <Button onClick={handleNewTask} className="bg-primary hover:bg-primary/90">
              New Task
            </Button>
          </div>
        }
      />

      <main className="flex-1 overflow-hidden">
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="h-full flex flex-col">
          <div className="border-b border-gray-200 px-6 py-4">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="gantt" className="flex items-center space-x-2">
                <BarChart3 size={16} />
                <span>Gantt Chart</span>
              </TabsTrigger>
              <TabsTrigger value="sheet" className="flex items-center space-x-2">
                <Grid3X3 size={16} />
                <span>Sheet View</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center space-x-2">
                <Calendar size={16} />
                <span>Calendar</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="gantt" className="h-full mt-0">
              <GanttChart 
                tasks={tasks || []} 
                projects={projects || []}
                isLoading={tasksLoading || projectsLoading}
              />
            </TabsContent>

            <TabsContent value="sheet" className="h-full mt-0">
              <TaskSheet 
                tasks={tasks || []} 
                projects={projects || []}
                isLoading={tasksLoading || projectsLoading}
              />
            </TabsContent>

            <TabsContent value="calendar" className="h-full mt-0">
              <CalendarView 
                tasks={tasks || []} 
                projects={projects || []}
                isLoading={tasksLoading || projectsLoading}
              />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
