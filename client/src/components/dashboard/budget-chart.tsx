import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartUtils } from "@/lib/chart-utils";
import type { DashboardMetrics } from "@/types";

interface BudgetChartProps {
  metrics: DashboardMetrics;
  isLoading?: boolean;
}

export default function BudgetChart({ metrics, isLoading }: BudgetChartProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const variance = ChartUtils.calculateVariance(metrics.totalBudget, metrics.totalActual);
  const budgetProgress = metrics.totalBudget > 0 ? (metrics.totalActual / metrics.totalBudget) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Budget vs Actual (YTD)</CardTitle>
        <Select defaultValue="quarter">
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Budgeted: {ChartUtils.formatCurrency(metrics.totalBudget)}</span>
              <span>Actual: {ChartUtils.formatCurrency(metrics.totalActual)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 relative">
              <div className="bg-primary h-4 rounded-full" style={{ width: '100%' }}></div>
              <div 
                className="bg-secondary h-4 rounded-full absolute top-0 left-0 progress-bar" 
                style={{ width: `${Math.min(budgetProgress, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>
                {ChartUtils.formatPercentage(Math.abs(variance.percentage))} {variance.isOverBudget ? 'over' : 'under'} budget
              </span>
              <span className={variance.isOverBudget ? 'text-destructive font-medium' : 'text-secondary font-medium'}>
                {variance.isOverBudget ? 'Over Budget' : 'Favorable'}
              </span>
            </div>
          </div>

          {/* Monthly breakdown */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500">Labor Costs</p>
              <p className="text-lg font-semibold text-gray-900">
                {ChartUtils.formatCurrency(metrics.totalActual * 0.75)}
              </p>
              <p className="text-xs text-secondary">-2.1%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Materials</p>
              <p className="text-lg font-semibold text-gray-900">
                {ChartUtils.formatCurrency(metrics.totalActual * 0.20)}
              </p>
              <p className="text-xs text-warning">+4.8%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Equipment</p>
              <p className="text-lg font-semibold text-gray-900">
                {ChartUtils.formatCurrency(metrics.totalActual * 0.05)}
              </p>
              <p className="text-xs text-secondary">-8.3%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
