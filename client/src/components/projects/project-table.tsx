import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  MoreHorizontal, 
  Grid3X3, 
  Calendar, 
  BarChart3, 
  Filter, 
  Download 
} from "lucide-react";
import { ChartUtils } from "@/lib/chart-utils";
import type { Project } from "@shared/schema";

interface ProjectTableProps {
  projects: Project[];
  isLoading?: boolean;
  onViewProject?: (projectId: string) => void;
}

export default function ProjectTable({ projects, isLoading, onViewProject }: ProjectTableProps) {
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'gantt'>('table');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'on-hold': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getHealthBadgeVariant = (health: string) => {
    switch (health) {
      case 'on-track': return 'secondary';
      case 'at-risk': return 'outline';
      case 'behind-schedule': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Active Projects</h3>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <Grid3X3 size={16} />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Calendar size={16} />
              </Button>
              <Button
                variant={viewMode === 'gantt' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('gantt')}
              >
                <BarChart3 size={16} />
              </Button>
            </div>
            <Button variant="outline" size="sm">
              <Filter size={16} className="mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download size={16} className="mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No projects found. Create your first project to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((project) => {
                    const progress = parseFloat(project.progress || '0');
                    const budget = parseFloat(project.budgetAmount || '0');
                    const actual = parseFloat(project.actualAmount || '0');
                    const variance = ChartUtils.calculateVariance(budget, actual);

                    return (
                      <TableRow 
                        key={project.id}
                        className="table-row-hover"
                        onClick={() => onViewProject?.(project.id)}
                      >
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {project.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {project.projectCode}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">{project.clientName}</div>
                          {project.clientContact && (
                            <div className="text-sm text-gray-500">
                              Contact: {project.clientContact}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900 mb-1">{progress}%</div>
                          <Progress value={progress} className="w-24" />
                        </TableCell>
                        <TableCell>
                          <Badge variant={getHealthBadgeVariant(project.health)}>
                            {project.health.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">
                            {ChartUtils.formatCurrency(actual)} / {ChartUtils.formatCurrency(budget)}
                          </div>
                          <div className={`text-xs ${variance.isOverBudget ? 'text-destructive' : 'text-secondary'}`}>
                            {ChartUtils.formatPercentage(Math.abs(variance.percentage))} {variance.isOverBudget ? 'over' : 'under'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-900">
                          {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'TBD'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewProject?.(project.id);
                              }}
                            >
                              View
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const progress = parseFloat(project.progress || '0');
                const budget = parseFloat(project.budgetAmount || '0');
                const actual = parseFloat(project.actualAmount || '0');

                return (
                  <Card 
                    key={project.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onViewProject?.(project.id)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{project.name}</h4>
                          <p className="text-sm text-gray-500">{project.clientName}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} />
                        </div>

                        <div className="flex justify-between items-center">
                          <Badge variant={getHealthBadgeVariant(project.health)}>
                            {project.health.replace('-', ' ')}
                          </Badge>
                          <div className="text-sm text-gray-500">
                            {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'TBD'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'gantt' && (
          <div className="p-6">
            <div className="text-center py-8 text-gray-500">
              Gantt chart view coming soon. Switch to Table or Grid view for now.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
