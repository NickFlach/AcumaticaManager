import { Card, CardContent } from "@/components/ui/card";
import { FolderKanban, CheckCircle, DollarSign, HelpCircle } from "lucide-react";
import type { DashboardMetrics } from "@/types";

interface MetricsCardsProps {
  metrics: DashboardMetrics;
  isLoading?: boolean;
}

export default function MetricsCards({ metrics, isLoading }: MetricsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Active Projects",
      value: metrics.activeProjects.toString(),
      change: "+2 from last month",
      changeType: "positive" as const,
      icon: FolderKanban,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "On-Time Completion",
      value: metrics.onTimeRate,
      change: "+5% improvement",
      changeType: "positive" as const,
      icon: CheckCircle,
      iconBg: "bg-secondary/10",
      iconColor: "text-secondary",
    },
    {
      title: "Budget Variance",
      value: metrics.budgetVariance,
      change: "Within acceptable range",
      changeType: metrics.budgetVariance.startsWith('-') ? "positive" : "negative" as const,
      icon: DollarSign,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
    },
    {
      title: "Open RFIs",
      value: metrics.openRfis.toString(),
      change: "3 critical",
      changeType: "negative" as const,
      icon: HelpCircle,
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => (
        <Card key={card.title} className="hover:shadow-sm transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                <card.icon className={`${card.iconColor}`} size={24} />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <span 
                className={`text-sm font-medium ${
                  card.changeType === 'positive' ? 'text-secondary' : 'text-destructive'
                }`}
              >
                {card.change}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
