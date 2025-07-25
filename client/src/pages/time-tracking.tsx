import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Clock, CheckCircle, XCircle, Smartphone, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertTimeEntrySchema, type TimeEntry, type Project, type Task } from "@shared/schema";
import { ChartUtils } from "@/lib/chart-utils";
import type { z } from "zod";

const timeEntryFormSchema = insertTimeEntrySchema.extend({
  date: insertTimeEntrySchema.shape.date,
});

type TimeEntryFormData = z.infer<typeof timeEntryFormSchema>;

export default function TimeTracking() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const { toast } = useToast();

  const { data: timeEntries, isLoading: timeEntriesLoading } = useQuery<TimeEntry[]>({
    queryKey: ['/api/time-entries'],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const createTimeEntryMutation = useMutation({
    mutationFn: async (data: TimeEntryFormData) => {
      const response = await apiRequest('POST', '/api/time-entries', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-entries'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Time entry logged successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to log time entry",
        variant: "destructive",
      });
    },
  });

  const form = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntryFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      hours: "0",
      description: "",
      hourlyRate: "65",
      isApproved: false,
    },
  });

  const handleCreateTimeEntry = (data: TimeEntryFormData) => {
    const totalAmount = (parseFloat(data.hours) * parseFloat(data.hourlyRate || "0")).toString();
    createTimeEntryMutation.mutate({
      ...data,
      totalAmount,
      userId: "admin-user-id", // TODO: Get from auth context
    });
  };

  const handleLumberTimeSync = () => {
    toast({
      title: "Lumber Time Sync",
      description: "Simulating sync with Lumber Time app for union electrical contractor time tracking",
    });
  };

  const projectTasks = tasks?.filter(task => task.projectId === selectedProject) || [];

  const totalHours = timeEntries?.reduce((sum, entry) => sum + parseFloat(entry.hours), 0) || 0;
  const totalAmount = timeEntries?.reduce((sum, entry) => sum + parseFloat(entry.totalAmount || "0"), 0) || 0;
  const pendingApproval = timeEntries?.filter(entry => !entry.isApproved).length || 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Time Tracking"
        subtitle="Track labor hours, manage timesheets, and sync with Lumber Time app"
        actions={
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleLumberTimeSync}>
              <Smartphone size={16} className="mr-2" />
              Lumber Time Sync
            </Button>
            <Button variant="outline">
              <Download size={16} className="mr-2" />
              Export Timesheet
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus size={16} className="mr-2" />
                  Log Time
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Log Time Entry</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateTimeEntry)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="projectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project *</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedProject(value);
                              }} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {projects?.map((project) => (
                                  <SelectItem key={project.id} value={project.id}>
                                    {project.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="taskId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Task (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select task" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">No specific task</SelectItem>
                                {projectTasks.map((task) => (
                                  <SelectItem key={task.id} value={task.id}>
                                    {task.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="hours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hours *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.25"
                                placeholder="8.00" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="hourlyRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hourly Rate</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="65.00" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the work performed..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-4 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createTimeEntryMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {createTimeEntryMutation.isPending ? "Logging..." : "Log Time"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <main className="flex-1 overflow-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Hours This Week</p>
                  <p className="text-3xl font-bold text-gray-900">{totalHours.toFixed(1)}</p>
                </div>
                <Clock className="w-12 h-12 text-primary bg-primary/10 p-2 rounded-lg" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Amount</p>
                  <p className="text-3xl font-bold text-gray-900">{ChartUtils.formatCurrency(totalAmount)}</p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <span className="text-secondary text-xl font-bold">$</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending Approval</p>
                  <p className="text-3xl font-bold text-gray-900">{pendingApproval}</p>
                </div>
                <XCircle className="w-12 h-12 text-warning bg-warning/10 p-2 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {timeEntriesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No time entries found. Log your first time entry to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    timeEntries?.map((entry) => {
                      const project = projects?.find(p => p.id === entry.projectId);
                      const task = tasks?.find(t => t.id === entry.taskId);

                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {entry.date ? new Date(entry.date).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{project?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{project?.projectCode}</div>
                          </TableCell>
                          <TableCell>
                            {task ? (
                              <div className="text-sm">{task.name}</div>
                            ) : (
                              <span className="text-gray-400">General</span>
                            )}
                          </TableCell>
                          <TableCell>{entry.hours}</TableCell>
                          <TableCell>{ChartUtils.formatCurrency(parseFloat(entry.hourlyRate || "0"))}</TableCell>
                          <TableCell>{ChartUtils.formatCurrency(parseFloat(entry.totalAmount || "0"))}</TableCell>
                          <TableCell>
                            <Badge variant={entry.isApproved ? "secondary" : "outline"}>
                              {entry.isApproved ? (
                                <>
                                  <CheckCircle size={12} className="mr-1" />
                                  Approved
                                </>
                              ) : (
                                <>
                                  <XCircle size={12} className="mr-1" />
                                  Pending
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {entry.description || 'No description'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
