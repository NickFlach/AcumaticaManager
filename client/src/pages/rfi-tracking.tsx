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
import { Plus, HelpCircle, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertRfiSchema, type RFI, type Project } from "@shared/schema";
import type { z } from "zod";

const rfiFormSchema = insertRfiSchema.extend({
  submittedDate: insertRfiSchema.shape.submittedDate,
  requiredDate: insertRfiSchema.shape.requiredDate.optional(),
});

type RFIFormData = z.infer<typeof rfiFormSchema>;

export default function RfiTracking() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: rfis, isLoading: rfisLoading } = useQuery<RFI[]>({
    queryKey: ['/api/rfis'],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const createRfiMutation = useMutation({
    mutationFn: async (data: RFIFormData) => {
      const response = await apiRequest('POST', '/api/rfis', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rfis'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "RFI created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create RFI",
        variant: "destructive",
      });
    },
  });

  const form = useForm<RFIFormData>({
    resolver: zodResolver(rfiFormSchema),
    defaultValues: {
      rfiNumber: "",
      title: "",
      description: "",
      status: "open",
      priority: "medium",
      submittedDate: new Date().toISOString().split('T')[0],
      submittedBy: "admin-user-id", // TODO: Get from auth context
    },
  });

  const handleCreateRfi = (data: RFIFormData) => {
    createRfiMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <HelpCircle size={16} className="text-warning" />;
      case 'pending':
        return <Clock size={16} className="text-primary" />;
      case 'answered':
        return <CheckCircle size={16} className="text-secondary" />;
      case 'closed':
        return <CheckCircle size={16} className="text-gray-500" />;
      default:
        return <HelpCircle size={16} className="text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'outline';
      case 'pending':
        return 'default';
      case 'answered':
        return 'secondary';
      case 'closed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'outline';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const openRfis = rfis?.filter(rfi => rfi.status === 'open').length || 0;
  const pendingRfis = rfis?.filter(rfi => rfi.status === 'pending').length || 0;
  const criticalRfis = rfis?.filter(rfi => rfi.priority === 'critical').length || 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="RFI Tracking"
        subtitle="Manage Requests for Information and track responses for electrical projects"
        actions={
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus size={16} className="mr-2" />
                New RFI
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New RFI</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateRfi)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="rfiNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RFI Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., RFI-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
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
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RFI Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description of the request" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detailed Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide detailed information about what you need clarification on..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="submittedDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Submitted Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="requiredDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Response Required By</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                      disabled={createRfiMutation.isPending}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {createRfiMutation.isPending ? "Creating..." : "Create RFI"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      <main className="flex-1 overflow-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Open RFIs</p>
                  <p className="text-3xl font-bold text-gray-900">{openRfis}</p>
                </div>
                <HelpCircle className="w-12 h-12 text-warning bg-warning/10 p-2 rounded-lg" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending Response</p>
                  <p className="text-3xl font-bold text-gray-900">{pendingRfis}</p>
                </div>
                <Clock className="w-12 h-12 text-primary bg-primary/10 p-2 rounded-lg" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Critical Priority</p>
                  <p className="text-3xl font-bold text-gray-900">{criticalRfis}</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-destructive bg-destructive/10 p-2 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RFIs Table */}
        <Card>
          <CardHeader>
            <CardTitle>RFI List</CardTitle>
          </CardHeader>
          <CardContent>
            {rfisLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RFI #</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Required By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfis?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No RFIs found. Create your first RFI to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rfis?.map((rfi) => {
                      const project = projects?.find(p => p.id === rfi.projectId);

                      return (
                        <TableRow key={rfi.id} className="table-row-hover">
                          <TableCell className="font-medium">{rfi.rfiNumber}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{project?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{project?.projectCode}</div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate font-medium">{rfi.title}</div>
                            <div className="text-xs text-gray-500 truncate">{rfi.description}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(rfi.status)} className="flex items-center space-x-1">
                              {getStatusIcon(rfi.status)}
                              <span>{rfi.status.charAt(0).toUpperCase() + rfi.status.slice(1)}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPriorityBadgeVariant(rfi.priority)}>
                              {rfi.priority.charAt(0).toUpperCase() + rfi.priority.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {rfi.submittedDate ? new Date(rfi.submittedDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {rfi.requiredDate ? (
                              <span className={
                                new Date(rfi.requiredDate) < new Date() 
                                  ? 'text-destructive font-medium' 
                                  : 'text-gray-900'
                              }>
                                {new Date(rfi.requiredDate).toLocaleDateString()}
                              </span>
                            ) : (
                              'Not specified'
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
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
