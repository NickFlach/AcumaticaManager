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
import { Plus, AlertTriangle, Shield, Eye, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertRiskSchema, type Risk, type Project } from "@shared/schema";
import type { z } from "zod";

const riskFormSchema = insertRiskSchema.extend({
  identifiedDate: insertRiskSchema.shape.identifiedDate,
  targetDate: insertRiskSchema.shape.targetDate.optional(),
});

type RiskFormData = z.infer<typeof riskFormSchema>;

export default function RiskManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: risks, isLoading: risksLoading } = useQuery<Risk[]>({
    queryKey: ['/api/risks'],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const createRiskMutation = useMutation({
    mutationFn: async (data: RiskFormData) => {
      // Calculate risk score based on probability and impact
      const probabilityScore = { low: 1, medium: 2, high: 3 }[data.probability as keyof typeof probabilityScore] || 1;
      const impactScore = { low: 1, medium: 2, high: 3 }[data.impact as keyof typeof impactScore] || 1;
      const riskScore = probabilityScore * impactScore;

      const response = await apiRequest('POST', '/api/risks', { ...data, riskScore });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/risks'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Risk created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create risk",
        variant: "destructive",
      });
    },
  });

  const form = useForm<RiskFormData>({
    resolver: zodResolver(riskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "technical",
      probability: "medium",
      impact: "medium",
      status: "open",
      identifiedDate: new Date().toISOString().split('T')[0],
      owner: "admin-user-id", // TODO: Get from auth context
      mitigationPlan: "",
      contingencyPlan: "",
    },
  });

  const handleCreateRisk = (data: RiskFormData) => {
    createRiskMutation.mutate(data);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      technical: 'bg-blue-100 text-blue-800',
      financial: 'bg-green-100 text-green-800',
      schedule: 'bg-yellow-100 text-yellow-800',
      resource: 'bg-purple-100 text-purple-800',
      safety: 'bg-red-100 text-red-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 6) return 'text-destructive';
    if (score >= 4) return 'text-warning';
    return 'text-secondary';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'monitoring':
        return 'outline';
      case 'mitigated':
        return 'secondary';
      case 'closed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const highRisks = risks?.filter(risk => (risk.riskScore || 0) >= 6).length || 0;
  const openRisks = risks?.filter(risk => risk.status === 'open').length || 0;
  const mitigatedRisks = risks?.filter(risk => risk.status === 'mitigated').length || 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Risk Management"
        subtitle="Identify, assess, and manage project risks with mitigation strategies"
        actions={
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus size={16} className="mr-2" />
                New Risk
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create New Risk</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateRisk)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Risk Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="technical">Technical</SelectItem>
                              <SelectItem value="financial">Financial</SelectItem>
                              <SelectItem value="schedule">Schedule</SelectItem>
                              <SelectItem value="resource">Resource</SelectItem>
                              <SelectItem value="safety">Safety</SelectItem>
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
                        <FormLabel>Risk Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description of the risk" {...field} />
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
                            placeholder="Provide detailed description of the risk and its potential consequences..."
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
                      name="probability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Probability</FormLabel>
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
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="impact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Impact</FormLabel>
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
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="targetDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Mitigation Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="mitigationPlan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mitigation Plan</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the plan to reduce or eliminate this risk..."
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
                    name="contingencyPlan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contingency Plan</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what to do if this risk materializes..."
                            rows={3}
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
                      disabled={createRiskMutation.isPending}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {createRiskMutation.isPending ? "Creating..." : "Create Risk"}
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
                  <p className="text-sm font-medium text-gray-500">High Risk Items</p>
                  <p className="text-3xl font-bold text-gray-900">{highRisks}</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-destructive bg-destructive/10 p-2 rounded-lg" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Open Risks</p>
                  <p className="text-3xl font-bold text-gray-900">{openRisks}</p>
                </div>
                <Eye className="w-12 h-12 text-warning bg-warning/10 p-2 rounded-lg" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Mitigated Risks</p>
                  <p className="text-3xl font-bold text-gray-900">{mitigatedRisks}</p>
                </div>
                <Shield className="w-12 h-12 text-secondary bg-secondary/10 p-2 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Risk Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div></div>
                <div className="text-center font-medium">Low</div>
                <div className="text-center font-medium">Medium</div>
                <div className="text-center font-medium">High</div>
                
                <div className="font-medium">High</div>
                <div className="h-16 bg-warning/20 border border-warning rounded flex items-center justify-center">
                  {risks?.filter(r => r.impact === 'high' && r.probability === 'low').length || 0}
                </div>
                <div className="h-16 bg-destructive/20 border border-destructive rounded flex items-center justify-center">
                  {risks?.filter(r => r.impact === 'high' && r.probability === 'medium').length || 0}
                </div>
                <div className="h-16 bg-destructive/40 border border-destructive rounded flex items-center justify-center">
                  {risks?.filter(r => r.impact === 'high' && r.probability === 'high').length || 0}
                </div>

                <div className="font-medium">Medium</div>
                <div className="h-16 bg-secondary/20 border border-secondary rounded flex items-center justify-center">
                  {risks?.filter(r => r.impact === 'medium' && r.probability === 'low').length || 0}
                </div>
                <div className="h-16 bg-warning/20 border border-warning rounded flex items-center justify-center">
                  {risks?.filter(r => r.impact === 'medium' && r.probability === 'medium').length || 0}
                </div>
                <div className="h-16 bg-destructive/20 border border-destructive rounded flex items-center justify-center">
                  {risks?.filter(r => r.impact === 'medium' && r.probability === 'high').length || 0}
                </div>

                <div className="font-medium">Low</div>
                <div className="h-16 bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
                  {risks?.filter(r => r.impact === 'low' && r.probability === 'low').length || 0}
                </div>
                <div className="h-16 bg-secondary/20 border border-secondary rounded flex items-center justify-center">
                  {risks?.filter(r => r.impact === 'low' && r.probability === 'medium').length || 0}
                </div>
                <div className="h-16 bg-warning/20 border border-warning rounded flex items-center justify-center">
                  {risks?.filter(r => r.impact === 'low' && r.probability === 'high').length || 0}
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>Probability →</span>
                  <span>Impact ↑</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">New Risks (This Month)</span>
                  <span className="font-semibold">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Risks Closed</span>
                  <span className="font-semibold text-secondary">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Overdue Mitigations</span>
                  <span className="font-semibold text-destructive">2</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risks Table */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Register</CardTitle>
          </CardHeader>
          <CardContent>
            {risksLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Risk</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Probability</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Target Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {risks?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No risks found. Create your first risk to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    risks?.map((risk) => {
                      const project = projects?.find(p => p.id === risk.projectId);
                      const riskScore = risk.riskScore || 0;

                      return (
                        <TableRow key={risk.id} className="table-row-hover">
                          <TableCell className="max-w-xs">
                            <div className="truncate font-medium">{risk.title}</div>
                            <div className="text-xs text-gray-500 truncate">{risk.description}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{project?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{project?.projectCode}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoryColor(risk.category)}>
                              {risk.category.charAt(0).toUpperCase() + risk.category.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {risk.probability.charAt(0).toUpperCase() + risk.probability.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {risk.impact.charAt(0).toUpperCase() + risk.impact.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`font-bold ${getRiskScoreColor(riskScore)}`}>
                              {riskScore}/9
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(risk.status)}>
                              {risk.status.charAt(0).toUpperCase() + risk.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {risk.targetDate ? (
                              <span className={
                                new Date(risk.targetDate) < new Date() 
                                  ? 'text-destructive font-medium' 
                                  : 'text-gray-900'
                              }>
                                {new Date(risk.targetDate).toLocaleDateString()}
                              </span>
                            ) : (
                              'Not set'
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
