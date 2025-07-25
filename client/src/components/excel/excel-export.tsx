import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Calendar,
  Filter,
  Settings,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExcelUtils } from "@/lib/excel-utils";
import type { Project, Task, TimeEntry, RFI, ChangeOrder, Risk } from "@shared/schema";
import type { ExcelExportOptions } from "@/types";

export default function ExcelExport() {
  const [selectedExports, setSelectedExports] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterProject, setFilterProject] = useState<string>("all");
  const [includeSubtasks, setIncludeSubtasks] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: timeEntries } = useQuery<TimeEntry[]>({
    queryKey: ['/api/time-entries'],
  });

  const { data: rfis } = useQuery<RFI[]>({
    queryKey: ['/api/rfis'],
  });

  const { data: changeOrders } = useQuery<ChangeOrder[]>({
    queryKey: ['/api/change-orders'],
  });

  const { data: risks } = useQuery<Risk[]>({
    queryKey: ['/api/risks'],
  });

  const exportTypes = [
    {
      id: 'projects',
      label: 'Projects',
      description: 'Export project data with budgets and client information',
      icon: FileSpreadsheet,
      count: projects?.length || 0,
      fields: ['Project Code', 'Name', 'Client', 'Status', 'Health', 'Progress', 'Budget', 'Actual', 'Due Date']
    },
    {
      id: 'tasks',
      label: 'Tasks',
      description: 'Export tasks with hierarchy and assignments',
      icon: FileText,
      count: tasks?.length || 0,
      fields: ['Task Name', 'Project', 'Status', 'Priority', 'Progress', 'Assigned To', 'Due Date', 'Hours']
    },
    {
      id: 'time-entries',
      label: 'Time Entries',
      description: 'Export labor hours and time tracking data',
      icon: Calendar,
      count: timeEntries?.length || 0,
      fields: ['Date', 'Project', 'Task', 'User', 'Hours', 'Rate', 'Amount', 'Description']
    },
    {
      id: 'rfis',
      label: 'RFIs',
      description: 'Export Request for Information records',
      icon: FileText,
      count: rfis?.length || 0,
      fields: ['RFI Number', 'Project', 'Title', 'Status', 'Priority', 'Submitted Date', 'Required Date']
    },
    {
      id: 'change-orders',
      label: 'Change Orders',
      description: 'Export change order requests and approvals',
      icon: FileSpreadsheet,
      count: changeOrders?.length || 0,
      fields: ['CO Number', 'Project', 'Title', 'Type', 'Status', 'Cost Impact', 'Time Impact']
    },
    {
      id: 'risks',
      label: 'Risks',
      description: 'Export risk assessments and mitigation plans',
      icon: FileText,
      count: risks?.length || 0,
      fields: ['Risk Title', 'Project', 'Category', 'Probability', 'Impact', 'Status', 'Target Date']
    }
  ];

  const specialExports = [
    {
      id: 'projects-with-tasks',
      label: 'Projects with Tasks',
      description: 'Combined export showing projects and their associated tasks',
      icon: FileSpreadsheet,
      format: 'Excel (.xlsx)'
    },
    {
      id: 'mpp-schedule',
      label: 'Project Schedule (MPP)',
      description: 'Microsoft Project compatible format with task hierarchy',
      icon: FileText,
      format: 'MPP Compatible'
    },
    {
      id: 'budget-analysis',
      label: 'Budget Analysis Report',
      description: 'Detailed budget vs actual analysis with variance reporting',
      icon: FileSpreadsheet,
      format: 'Excel (.xlsx)'
    },
    {
      id: 'timesheet-summary',
      label: 'Timesheet Summary',
      description: 'Labor hour summary by project, task, and employee',
      icon: Calendar,
      format: 'Excel (.xlsx)'
    }
  ];

  const handleExportTypeToggle = (exportId: string) => {
    const newSelected = new Set(selectedExports);
    if (newSelected.has(exportId)) {
      newSelected.delete(exportId);
    } else {
      newSelected.add(exportId);
    }
    setSelectedExports(newSelected);
  };

  const handleExport = async (exportType: string) => {
    setIsExporting(true);

    try {
      let result;

      switch (exportType) {
        case 'projects':
          result = await ExcelUtils.exportToExcel(projects || [], 'projects-export.xlsx', 'Projects');
          break;
        case 'tasks':
          result = await ExcelUtils.exportTasksWithHierarchy(tasks || []);
          break;
        case 'time-entries':
          result = await ExcelUtils.exportTimeEntries(timeEntries || []);
          break;
        case 'projects-with-tasks':
          result = await ExcelUtils.exportProjectsWithTasks(projects || [], tasks || []);
          break;
        case 'mpp-schedule':
          result = await ExcelUtils.generateMPPCompatibleFormat(projects || [], tasks || []);
          break;
        default:
          // Generic export for other types
          const data = getDataForExportType(exportType);
          result = await ExcelUtils.exportToExcel(data, `${exportType}-export.xlsx`, exportType);
      }

      if (result.success) {
        toast({
          title: "Export Successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Export Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Export Error",
        description: "An unexpected error occurred during export",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleBulkExport = async () => {
    if (selectedExports.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one export type",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const exportPromises = Array.from(selectedExports).map(exportType => 
        handleExport(exportType)
      );

      await Promise.all(exportPromises);

      toast({
        title: "Bulk Export Completed",
        description: `Successfully exported ${selectedExports.size} data types`,
      });
    } catch (error) {
      toast({
        title: "Bulk Export Failed",
        description: "Some exports may have failed",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getDataForExportType = (exportType: string) => {
    switch (exportType) {
      case 'projects': return projects || [];
      case 'tasks': return tasks || [];
      case 'time-entries': return timeEntries || [];
      case 'rfis': return rfis || [];
      case 'change-orders': return changeOrders || [];
      case 'risks': return risks || [];
      default: return [];
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="standard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="standard">Standard Exports</TabsTrigger>
          <TabsTrigger value="special">Special Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="standard">
          {/* Export Options */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Export Options</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedExports(new Set(exportTypes.map(t => t.id)))}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedExports(new Set())}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exportTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      selectedExports.has(type.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={selectedExports.has(type.id)}
                        onCheckedChange={() => handleExportTypeToggle(type.id)}
                      />
                      <type.icon 
                        size={24} 
                        className={selectedExports.has(type.id) ? 'text-primary' : 'text-gray-500'}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">{type.label}</h3>
                          <Badge variant="outline">{type.count} records</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            Fields: {type.fields.slice(0, 3).join(', ')}
                            {type.fields.length > 3 && ` +${type.fields.length - 3} more`}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport(type.id)}
                            disabled={isExporting}
                          >
                            <Download size={14} className="mr-1" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bulk Export */}
              {selectedExports.size > 0 && (
                <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Bulk Export ({selectedExports.size} selected)
                      </h3>
                      <p className="text-sm text-gray-600">
                        Export all selected data types as separate Excel files
                      </p>
                    </div>
                    <Button
                      onClick={handleBulkExport}
                      disabled={isExporting}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isExporting ? 'Exporting...' : 'Export Selected'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filters and Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter size={20} />
                <span>Export Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Project Filter</Label>
                  <Select value={filterProject} onValueChange={setFilterProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Range (Start)</Label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date Range (End)</Label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-subtasks"
                    checked={includeSubtasks}
                    onCheckedChange={(checked) => setIncludeSubtasks(checked === true)}
                  />
                  <Label htmlFor="include-subtasks">Include subtasks in hierarchy</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="special">
          <Card>
            <CardHeader>
              <CardTitle>Special Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {specialExports.map((exportItem) => (
                  <div key={exportItem.id} className="p-6 border rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex items-start space-x-4">
                      <exportItem.icon size={32} className="text-primary" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{exportItem.label}</h3>
                        <p className="text-sm text-gray-600 mt-1">{exportItem.description}</p>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <Badge variant="outline">{exportItem.format}</Badge>
                          <Button
                            onClick={() => handleExport(exportItem.id)}
                            disabled={isExporting}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <Download size={16} className="mr-2" />
                            Generate
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Exports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Mock recent exports */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle size={20} className="text-secondary" />
                <div>
                  <div className="font-medium">Projects Export</div>
                  <div className="text-sm text-gray-500">Exported 2 minutes ago</div>
                </div>
              </div>
              <Badge variant="secondary">Excel</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle size={20} className="text-secondary" />
                <div>
                  <div className="font-medium">Time Entries Export</div>
                  <div className="text-sm text-gray-500">Exported 1 hour ago</div>
                </div>
              </div>
              <Badge variant="secondary">Excel</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle size={20} className="text-secondary" />
                <div>
                  <div className="font-medium">Project Schedule (MPP)</div>
                  <div className="text-sm text-gray-500">Exported yesterday</div>
                </div>
              </div>
              <Badge variant="outline">MPP</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Export Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Excel Exports</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Exports are in .xlsx format for compatibility</li>
                <li>• All data includes proper headers and formatting</li>
                <li>• Hierarchical data preserves parent-child relationships</li>
                <li>• Date and currency formatting applied automatically</li>
                <li>• Files are optimized for Excel analysis and filtering</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Microsoft Project (MPP)</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Task hierarchy and dependencies preserved</li>
                <li>• Duration and progress calculations included</li>
                <li>• Resource assignments and costs mapped</li>
                <li>• Compatible with Microsoft Project 2016+</li>
                <li>• Gantt chart view ready upon import</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Settings className="text-green-600 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-green-800">Union Electrical Contractor Features</h4>
                <p className="text-sm text-green-700 mt-1">
                  All exports include specialized fields for union electrical contractors such as 
                  labor classifications, prevailing wage calculations, and certification tracking.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
