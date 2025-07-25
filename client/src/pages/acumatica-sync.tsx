import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, 
  Database, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  Upload,
  Settings,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AcumaticaSync } from "@shared/schema";

export default function AcumaticaSync() {
  const [syncInProgress, setSyncInProgress] = useState(false);
  const { toast } = useToast();

  const { data: syncs, isLoading: syncsLoading } = useQuery<AcumaticaSync[]>({
    queryKey: ['/api/acumatica/sync'],
  });

  const syncMutation = useMutation({
    mutationFn: async (syncType: string) => {
      setSyncInProgress(true);
      const response = await apiRequest('POST', '/api/acumatica/sync', { syncType });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/acumatica/sync'] });
      toast({
        title: "Sync Started",
        description: `${data.syncType} sync initiated successfully`,
      });
      
      // Simulate completion after 3 seconds
      setTimeout(() => {
        setSyncInProgress(false);
        queryClient.invalidateQueries({ queryKey: ['/api/acumatica/sync'] });
        toast({
          title: "Sync Completed",
          description: "Data synchronization completed successfully",
        });
      }, 3000);
    },
    onError: (error) => {
      setSyncInProgress(false);
      toast({
        title: "Sync Failed",
        description: "Failed to start Acumatica sync",
        variant: "destructive",
      });
    },
  });

  const handleSync = (syncType: string) => {
    syncMutation.mutate(syncType);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-secondary" />;
      case 'failed':
        return <XCircle size={16} className="text-destructive" />;
      case 'in-progress':
        return <Clock size={16} className="text-warning animate-spin" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'in-progress':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const lastSync = syncs?.[0];
  const completedSyncs = syncs?.filter(s => s.status === 'completed').length || 0;
  const failedSyncs = syncs?.filter(s => s.status === 'failed').length || 0;

  const syncTypes = [
    {
      type: 'projects',
      title: 'Projects',
      description: 'Sync project data including budgets and actuals',
      icon: Database,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      type: 'budgets',
      title: 'Budgets',
      description: 'Import budget allocations for each project task',
      icon: Upload,
      color: 'bg-green-100 text-green-600'
    },
    {
      type: 'actuals',
      title: 'Actuals',
      description: 'Import actual costs and labor hours',
      icon: Download,
      color: 'bg-orange-100 text-orange-600'
    },
    {
      type: 'employees',
      title: 'Employees',
      description: 'Sync employee data and labor rates',
      icon: Settings,
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Acumatica Integration"
        subtitle="Synchronize data between Acumatica ERP and project management system"
      />

      <main className="flex-1 overflow-auto p-6">
        {/* Connection Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="text-primary" size={24} />
              <span>Acumatica Connection Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-secondary rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium text-gray-900">Connected to Acumatica ERP</p>
                  <p className="text-sm text-gray-500">
                    Last sync: {lastSync?.completedAt ? new Date(lastSync.completedAt).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Server: production.acumatica.com</p>
                  <p className="text-sm text-gray-500">Version: 2024R1</p>
                </div>
                <Button variant="outline" size="sm">
                  <Settings size={16} className="mr-2" />
                  Configure
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sync Summary Cards */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed Syncs</p>
                  <p className="text-3xl font-bold text-gray-900">{completedSyncs}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-secondary bg-secondary/10 p-2 rounded-lg" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Failed Syncs</p>
                  <p className="text-3xl font-bold text-gray-900">{failedSyncs}</p>
                </div>
                <XCircle className="w-12 h-12 text-destructive bg-destructive/10 p-2 rounded-lg" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Sync Status</p>
                  <p className="text-lg font-bold text-gray-900">
                    {syncInProgress ? 'In Progress' : 'Ready'}
                  </p>
                </div>
                {syncInProgress ? (
                  <RefreshCw className="w-12 h-12 text-warning bg-warning/10 p-2 rounded-lg animate-spin" />
                ) : (
                  <Database className="w-12 h-12 text-primary bg-primary/10 p-2 rounded-lg" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="manual" className="space-y-6">
          <TabsList>
            <TabsTrigger value="manual">Manual Sync</TabsTrigger>
            <TabsTrigger value="history">Sync History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {syncTypes.map((syncType) => (
                <Card key={syncType.type}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 ${syncType.color} rounded-lg flex items-center justify-center`}>
                          <syncType.icon size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{syncType.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{syncType.description}</p>
                          
                          {syncInProgress && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                <span>Syncing...</span>
                                <span>67%</span>
                              </div>
                              <Progress value={67} className="h-2" />
                            </div>
                          )}
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleSync(syncType.type)}
                        disabled={syncInProgress}
                        className="bg-primary hover:bg-primary/90"
                        size="sm"
                      >
                        {syncInProgress ? (
                          <>
                            <RefreshCw size={16} className="mr-2 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw size={16} className="mr-2" />
                            Sync Now
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Sync All Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900">Perform a complete synchronization of all data types</p>
                    <p className="text-sm text-gray-500 mt-1">
                      This may take several minutes depending on the amount of data
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleSync('all')}
                    disabled={syncInProgress}
                    className="bg-secondary hover:bg-secondary/90"
                  >
                    {syncInProgress ? 'Syncing...' : 'Sync All'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Synchronization History</CardTitle>
              </CardHeader>
              <CardContent>
                {syncsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Success Rate</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syncs?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            No sync history found. Run your first sync to see results here.
                          </TableCell>
                        </TableRow>
                      ) : (
                        syncs?.map((sync) => {
                          const successRate = sync.recordsProcessed > 0 
                            ? (sync.recordsSuccessful / sync.recordsProcessed) * 100 
                            : 0;

                          return (
                            <TableRow key={sync.id}>
                              <TableCell className="font-medium">
                                {sync.syncType.charAt(0).toUpperCase() + sync.syncType.slice(1)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(sync.status)} className="flex items-center space-x-1 w-fit">
                                  {getStatusIcon(sync.status)}
                                  <span>{sync.status.charAt(0).toUpperCase() + sync.status.slice(1)}</span>
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {sync.startedAt ? new Date(sync.startedAt).toLocaleString() : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {sync.completedAt ? new Date(sync.completedAt).toLocaleString() : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {sync.recordsProcessed || 0} processed
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <span className={successRate >= 90 ? 'text-secondary' : successRate >= 70 ? 'text-warning' : 'text-destructive'}>
                                    {successRate.toFixed(1)}%
                                  </span>
                                  {sync.recordsFailed > 0 && (
                                    <AlertCircle size={16} className="text-warning" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  View Log
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
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Synchronization Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Connection Settings</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Server URL</label>
                        <input 
                          type="text" 
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          value="https://production.acumatica.com"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Company Database</label>
                        <input 
                          type="text" 
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          value="ElectricalContractor"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Sync Schedule</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Auto-sync Projects</label>
                        <input type="checkbox" className="h-4 w-4 text-primary" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Auto-sync Budgets</label>
                        <input type="checkbox" className="h-4 w-4 text-primary" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Auto-sync Actuals</label>
                        <input type="checkbox" className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Data Mapping</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-3">
                      Configure how Acumatica fields map to project management system fields:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Acumatica Project ID → PM Project Code</li>
                      <li>• Acumatica Budget → PM Budget Amount</li>
                      <li>• Acumatica Actual Cost → PM Actual Amount</li>
                      <li>• Employee ID → PM User ID</li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline">Test Connection</Button>
                  <Button className="bg-primary hover:bg-primary/90">Save Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
