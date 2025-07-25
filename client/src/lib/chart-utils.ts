export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  category?: string;
}

export class ChartUtils {
  static generateProgressChartData(projects: any[]) {
    const onTrack = projects.filter(p => p.health === 'on-track').length;
    const atRisk = projects.filter(p => p.health === 'at-risk').length;
    const behindSchedule = projects.filter(p => p.health === 'behind-schedule').length;
    
    return [
      { label: 'On Track', value: onTrack, color: 'hsl(153, 79%, 40%)' },
      { label: 'At Risk', value: atRisk, color: 'hsl(33, 100%, 50%)' },
      { label: 'Behind Schedule', value: behindSchedule, color: 'hsl(0, 84.2%, 60.2%)' }
    ];
  }

  static generateBudgetChartData(projects: any[]) {
    const totalBudget = projects.reduce((sum, p) => sum + (parseFloat(p.budgetAmount || '0')), 0);
    const totalActual = projects.reduce((sum, p) => sum + (parseFloat(p.actualAmount || '0')), 0);
    
    return [
      { label: 'Budgeted', value: totalBudget, color: 'hsl(207, 90%, 54%)' },
      { label: 'Actual', value: totalActual, color: 'hsl(153, 79%, 40%)' }
    ];
  }

  static generateTimelineData(projects: any[], tasks: any[]) {
    const timelineData: TimeSeriesPoint[] = [];
    
    // Generate monthly budget vs actual data
    const monthlyData = new Map<string, { budget: number; actual: number }>();
    
    projects.forEach(project => {
      if (project.startDate) {
        const month = new Date(project.startDate).toISOString().slice(0, 7);
        const existing = monthlyData.get(month) || { budget: 0, actual: 0 };
        monthlyData.set(month, {
          budget: existing.budget + (parseFloat(project.budgetAmount || '0')),
          actual: existing.actual + (parseFloat(project.actualAmount || '0'))
        });
      }
    });
    
    Array.from(monthlyData.entries()).forEach(([month, data]) => {
      timelineData.push(
        { date: month, value: data.budget, category: 'Budget' },
        { date: month, value: data.actual, category: 'Actual' }
      );
    });
    
    return timelineData.sort((a, b) => a.date.localeCompare(b.date));
  }

  static generateTaskProgressData(tasks: any[]) {
    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const colors = {
      'not-started': 'hsl(20, 5.9%, 90%)',
      'in-progress': 'hsl(33, 100%, 50%)',
      'completed': 'hsl(153, 79%, 40%)',
      'blocked': 'hsl(0, 84.2%, 60.2%)'
    };
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      label: status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      color: colors[status as keyof typeof colors] || 'hsl(20, 5.9%, 90%)'
    }));
  }

  static generateRiskMatrix(risks: any[]) {
    const matrix = [
      [0, 0, 0], // Low impact
      [0, 0, 0], // Medium impact  
      [0, 0, 0]  // High impact
    ];
    
    risks.forEach(risk => {
      const probabilityIndex = ['low', 'medium', 'high'].indexOf(risk.probability);
      const impactIndex = ['low', 'medium', 'high'].indexOf(risk.impact);
      
      if (probabilityIndex >= 0 && impactIndex >= 0) {
        matrix[impactIndex][probabilityIndex]++;
      }
    });
    
    return matrix;
  }

  static generateGanttData(projects: any[], tasks: any[]) {
    return projects.map(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      
      return {
        id: project.id,
        name: project.name,
        start: new Date(project.startDate || Date.now()),
        end: new Date(project.endDate || Date.now()),
        progress: parseFloat(project.progress || '0') / 100,
        type: 'project' as const,
        level: 0,
        children: projectTasks.map(task => ({
          id: task.id,
          name: task.name,
          start: new Date(task.startDate || project.startDate || Date.now()),
          end: new Date(task.endDate || project.endDate || Date.now()),
          progress: parseFloat(task.progress || '0') / 100,
          type: 'task' as const,
          level: task.level || 1,
          dependencies: task.parentTaskId ? [task.parentTaskId] : []
        }))
      };
    });
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  static formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  static formatHours(hours: number): string {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  }

  static calculateVariance(budget: number, actual: number): { amount: number; percentage: number; isOverBudget: boolean } {
    const amount = actual - budget;
    const percentage = budget > 0 ? (amount / budget) * 100 : 0;
    return {
      amount,
      percentage,
      isOverBudget: amount > 0
    };
  }

  static getHealthColor(health: string): string {
    const colors = {
      'on-track': 'hsl(153, 79%, 40%)',
      'at-risk': 'hsl(33, 100%, 50%)',
      'behind-schedule': 'hsl(0, 84.2%, 60.2%)'
    };
    return colors[health as keyof typeof colors] || 'hsl(20, 5.9%, 90%)';
  }

  static getStatusColor(status: string): string {
    const colors = {
      'active': 'hsl(153, 79%, 40%)',
      'completed': 'hsl(207, 90%, 54%)',
      'on-hold': 'hsl(33, 100%, 50%)',
      'cancelled': 'hsl(0, 84.2%, 60.2%)',
      'not-started': 'hsl(20, 5.9%, 90%)',
      'in-progress': 'hsl(33, 100%, 50%)',
      'blocked': 'hsl(0, 84.2%, 60.2%)',
      'open': 'hsl(33, 100%, 50%)',
      'pending': 'hsl(207, 90%, 54%)',
      'answered': 'hsl(153, 79%, 40%)',
      'closed': 'hsl(20, 5.9%, 90%)'
    };
    return colors[status as keyof typeof colors] || 'hsl(20, 5.9%, 90%)';
  }
}
