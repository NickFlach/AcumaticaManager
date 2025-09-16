import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
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

// Auth pages
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import ForgotPasswordPage from "@/pages/auth/forgot-password";
import ResetPasswordPage from "@/pages/auth/reset-password";

// Protected route wrapper
function ProtectedRoute({ component: Component, ...props }: { component: any }) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/auth/login" />;
  }

  return <Component {...props} />;
}

// Auth route wrapper
function AuthRoute({ component: Component, ...props }: { component: any }) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  return <Component {...props} />;
}

function Router() {
  const { isAuthenticated, isInitializing } = useAuth();
  
  // Show loading spinner during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Auth Routes - No sidebar */}
      <Route path="/auth/login">
        <AuthRoute component={LoginPage} />
      </Route>
      <Route path="/auth/register">
        <AuthRoute component={RegisterPage} />
      </Route>
      <Route path="/auth/forgot-password">
        <AuthRoute component={ForgotPasswordPage} />
      </Route>
      <Route path="/auth/reset-password">
        <AuthRoute component={ResetPasswordPage} />
      </Route>
      
      {/* Protected Routes - With sidebar */}
      <Route>
        {isAuthenticated ? (
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
        ) : (
          <Redirect to="/auth/login" />
        )}
      </Route>
    </Switch>
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
