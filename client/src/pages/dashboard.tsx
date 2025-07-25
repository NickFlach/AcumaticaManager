import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import MetricsCards from "@/components/dashboard/metrics-cards";
import ProjectHealthChart from "@/components/dashboard/project-health-chart";
import BudgetChart from "@/components/dashboard/budget-chart";
import ProjectTable from "@/components/projects/project-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, HelpCircle, RefreshCw, Database, Smartphone, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DashboardMetrics } from "@/types";
import type { Project } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const handleSync = async () => {
    try {
      await apiRequest('POST', '/api/acumatica/sync', { syncType: 'projects' });
      toast({
        title: "Sync Started",
        description: "Acumatica sync initiated successfully",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to start Acumatica sync",
        variant: "destructive",
      });
    }
  };

  const handleNewProject = () => {
    // TODO: Open new project modal
    toast({
      title: "Feature Coming Soon",
      description: "New project creation will be available soon",
    });
  };

  const recentActivities = [
    {
      icon: Clock,
      iconBg: "bg-secondary/10",
      iconColor: "text-secondary",
      title: "Time logged for Industrial Control Panel Upgrade",
      subtitle: "John Smith • 2 hours ago"
    },
    {
      icon: HelpCircle,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      title: "New RFI submitted for Warehouse project",
      subtitle: "Sarah Wilson • 4 hours ago"
    },
    {
      icon: RefreshCw,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      title: "Acumatica data synchronized successfully",
      subtitle: "System • 6 hours ago"
    }
  ];

  const integrations = [
    {
      name: "Acumatica ERP",
      icon: Database,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      status: "Connected",
      lastSync: "6 hours ago"
    },
    {
      name: "Lumber Time App",
      icon: Smartphone,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      status: "Active",
      lastSync: "2 hours ago"
    },
    {
      name: "Excel/MPP Export",
      icon: FileSpreadsheet,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      status: "Ready for export",
      lastSync: "Ready"
    }
  ];

  const quickActions = [
    { label: "Import Projects", color: "bg-primary/10 text-primary hover:bg-primary/20" },
    { label: "Export Timesheet", color: "bg-secondary/10 text-secondary hover:bg-secondary/20" },
    { label: "Sync Budgets", color: "bg-warning/10 text-warning hover:bg-warning/20" },
    { label: "Generate Report", color: "bg-purple-100 text-purple-600 hover:bg-purple-200" }
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Project Dashboard"
        subtitle="Monitor project health, progress, and budgets"
        onSync={handleSync}
        onNew={handleNewProject}
        showSyncButton
        showNewButton
      />

      <main className="flex-1 overflow-auto p-6">
        {/* Key Metrics */}
        {metrics && <MetricsCards metrics={metrics} isLoading={metricsLoading} />}

        {/* Project Health Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {metrics && <ProjectHealthChart metrics={metrics} isLoading={metricsLoading} />}
          {metrics && <BudgetChart metrics={metrics} isLoading={metricsLoading} />}
        </div>

        {/* Active Projects Table */}
        {projects && (
          <div className="mb-8">
            <ProjectTable 
              projects={projects} 
              isLoading={projectsLoading}
              onViewProject={(id) => {
                toast({
                  title: "Feature Coming Soon",
                  description: "Project detail view will be available soon",
                });
              }}
            />
          </div>
        )}

        {/* Recent Activity & Integrations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 ${activity.iconBg} rounded-full flex items-center justify-center mt-0.5`}>
                      <activity.icon className={activity.iconColor} size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-primary hover:text-primary/80">
                View All Activity
              </Button>
            </CardContent>
          </Card>

          {/* Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">System Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.map((integration, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${integration.iconBg} rounded-lg flex items-center justify-center`}>
                        <integration.icon className={integration.iconColor} size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{integration.name}</p>
                        <p className="text-xs text-gray-500">Last sync: {integration.lastSync}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-secondary rounded-full"></div>
                      <span className="text-xs text-gray-600">{integration.status}</span>
                    </div>
                  </div>
                ))}

                {/* Quick Actions */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className={`p-3 text-xs font-medium ${action.color}`}
                        onClick={() => {
                          toast({
                            title: "Feature Coming Soon",
                            description: `${action.label} functionality will be available soon`,
                          });
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
