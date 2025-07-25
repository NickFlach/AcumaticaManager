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
import { Plus, ArrowUpDown, DollarSign, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertChangeOrderSchema, type ChangeOrder, type Project } from "@shared/schema";
import { ChartUtils } from "@/lib/chart-utils";
import type { z } from "zod";

const changeOrderFormSchema = insertChangeOrderSchema.extend({
  submittedDate: insertChangeOrderSchema.shape.submittedDate,
});

type ChangeOrderFormData = z.infer<typeof changeOrderFormSchema>;

export default function ChangeOrders() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: changeOrders, isLoading: changeOrdersLoading } = useQuery<ChangeOrder[]>({
    queryKey: ['/api/change-orders'],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const createChangeOrderMutation = useMutation({
    mutationFn: async (data: ChangeOrderFormData) => {
      const response = await apiRequest('POST', '/api/change-orders', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/change-orders'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Change order created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create change order",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ChangeOrderFormData>({
    resolver: zodResolver(changeOrderFormSchema),
    defaultValues: {
      coNumber: "",
      title: "",
      description: "",
      status: "draft",
      type: "addition",
      costImpact: "0",
      timeImpact: 0,
      submittedDate: new Date().toISOString().split('T')[0],
      requestedBy: "admin-user-id", // TODO: Get from auth context
      justification: "",
    },
  });

  const handleCreateChangeOrder = (data: ChangeOrderFormData) => {
    createChangeOrderMutation.mutate(data);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'outline';
      case 'submitted':
        return 'default';
      case 'approved':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      case 'implemented':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'addition':
        return 'secondary';
      case 'deletion':
        return 'destructive';
      case 'modification':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const totalCostImpact = changeOrders?.reduce((sum, co) => sum + parseFloat(co.costImpact || "0"), 0) || 0;
  const pendingApproval = changeOrders?.filter(co => co.status === 'submitted').length || 0;
  const approved = changeOrders?.filter(co => co.status === 'approved').length || 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Change Order Management"
        subtitle="Track project changes, cost impacts, and approval workflows"
        actions={
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus size={16} className="mr-2" />
                New Change Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create New Change Order</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateChangeOrder)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="coNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CO Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., CO-001" {...field} />
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
                        <FormLabel>Change Order Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description of the change" {...field} />
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
                            placeholder="Provide detailed description of the proposed change..."
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
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Change Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="addition">Addition</SelectItem>
                              <SelectItem value="deletion">Deletion</SelectItem>
                              <SelectItem value="modification">Modification</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="costImpact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost Impact ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="timeImpact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Impact (days)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="0" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="justification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Justification</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Explain why this change is necessary..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
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
                      disabled={createChangeOrderMutation.isPending}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {createChangeOrderMutation.isPending ? "Creating..." : "Create Change Order"}
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
                  <p className="text-sm font-medium text-gray-500">Total Cost Impact</p>
                  <p className="text-3xl font-bold text-gray-900">{ChartUtils.formatCurrency(totalCostImpact)}</p>
                </div>
                <DollarSign className="w-12 h-12 text-primary bg-primary/10 p-2 rounded-lg" />
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
                <Clock className="w-12 h-12 text-warning bg-warning/10 p-2 rounded-lg" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Approved</p>
                  <p className="text-3xl font-bold text-gray-900">{approved}</p>
                </div>
                <FileText className="w-12 h-12 text-secondary bg-secondary/10 p-2 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Change Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Change Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {changeOrdersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CO #</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost Impact</TableHead>
                    <TableHead>Time Impact</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {changeOrders?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No change orders found. Create your first change order to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    changeOrders?.map((co) => {
                      const project = projects?.find(p => p.id === co.projectId);
                      const costImpact = parseFloat(co.costImpact || "0");

                      return (
                        <TableRow key={co.id} className="table-row-hover">
                          <TableCell className="font-medium">{co.coNumber}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{project?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{project?.projectCode}</div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate font-medium">{co.title}</div>
                            <div className="text-xs text-gray-500 truncate">{co.description}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getTypeBadgeVariant(co.type)}>
                              {co.type.charAt(0).toUpperCase() + co.type.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(co.status)}>
                              {co.status.charAt(0).toUpperCase() + co.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={costImpact >= 0 ? 'text-destructive' : 'text-secondary'}>
                              {costImpact >= 0 ? '+' : ''}{ChartUtils.formatCurrency(costImpact)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={co.timeImpact && co.timeImpact > 0 ? 'text-warning' : 'text-gray-900'}>
                              {co.timeImpact ? `${co.timeImpact} days` : 'No impact'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {co.submittedDate ? new Date(co.submittedDate).toLocaleDateString() : 'N/A'}
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
