import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import Tasks from "@/pages/tasks";
import TimeTracking from "@/pages/time-tracking";
import RfiTracking from "@/pages/rfi-tracking";
import ChangeOrders from "@/pages/change-orders";
import RiskManagement from "@/pages/risk-management";
import AcumaticaSync from "@/pages/acumatica-sync";
import ExcelImportExport from "@/pages/excel-import-export";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/projects" component={Projects} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/time-tracking" component={TimeTracking} />
          <Route path="/rfi-tracking" component={RfiTracking} />
          <Route path="/change-orders" component={ChangeOrders} />
          <Route path="/risk-management" component={RiskManagement} />
          <Route path="/acumatica-sync" component={AcumaticaSync} />
          <Route path="/excel-import-export" component={ExcelImportExport} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
