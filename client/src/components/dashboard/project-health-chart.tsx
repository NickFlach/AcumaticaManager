import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardMetrics } from "@/types";

interface ProjectHealthChartProps {
  metrics: DashboardMetrics;
  isLoading?: boolean;
}

export default function ProjectHealthChart({ metrics, isLoading }: ProjectHealthChartProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { projectHealthStats } = metrics;
  const total = projectHealthStats.onTrack + projectHealthStats.atRisk + projectHealthStats.behindSchedule;

  const healthData = [
    {
      label: "On Track",
      count: projectHealthStats.onTrack,
      percentage: total > 0 ? (projectHealthStats.onTrack / total) * 100 : 0,
      color: "bg-secondary",
    },
    {
      label: "At Risk",
      count: projectHealthStats.atRisk,
      percentage: total > 0 ? (projectHealthStats.atRisk / total) * 100 : 0,
      color: "bg-warning",
    },
    {
      label: "Behind Schedule",
      count: projectHealthStats.behindSchedule,
      percentage: total > 0 ? (projectHealthStats.behindSchedule / total) * 100 : 0,
      color: "bg-destructive",
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Project Health Status</CardTitle>
        <Button variant="ghost" size="sm">
          <MoreHorizontal size={16} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {healthData.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 ${item.color} rounded-full`}></div>
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {item.count} projects
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${item.color} h-2 rounded-full progress-bar`}
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
