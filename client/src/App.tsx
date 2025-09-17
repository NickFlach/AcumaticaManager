import { Switch, Route, Redirect, Router } from "wouter";
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

// Profile and admin pages
import ProfilePage from "@/pages/profile";
import AccountSettingsPage from "@/pages/account-settings";
import AdminUsersPage from "@/pages/admin/users";
import { WhitePaper } from "@/pages/WhitePaper";

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

// Admin route wrapper - requires admin role
function AdminRoute({ component: Component, ...props }: { component: any }) {
  const { isAuthenticated, isInitializing, user } = useAuth();

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

  if (user?.role !== 'admin') {
    return <Redirect to="/" />;
  }

  return <Component {...props} />;
}

// Protected wrapper components that include sidebar layout
function ProtectedDashboard(props: any) {
  return (
    <div className="flex h-screen bg-gray-50" data-testid="protected-dashboard">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Dashboard {...props} />
      </div>
    </div>
  );
}

function ProtectedProjects(props: any) {
  return (
    <div className="flex h-screen bg-gray-50" data-testid="protected-projects">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Projects {...props} />
      </div>
    </div>
  );
}

function ProtectedTasks(props: any) {
  return (
    <div className="flex h-screen bg-gray-50" data-testid="protected-tasks">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tasks {...props} />
      </div>
    </div>
  );
}

function ProtectedTimeTracking(props: any) {
  return (
    <div className="flex h-screen bg-gray-50" data-testid="protected-time-tracking">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TimeTracking {...props} />
      </div>
    </div>
  );
}

function ProtectedRfiTracking(props: any) {
  return (
    <div className="flex h-screen bg-gray-50" data-testid="protected-rfi-tracking">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <RfiTracking {...props} />
      </div>
    </div>
  );
}

function ProtectedChangeOrders(props: any) {
  return (
    <div className="flex h-screen bg-gray-50" data-testid="protected-change-orders">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChangeOrders {...props} />
      </div>
    </div>
  );
}

function ProtectedRiskManagement(props: any) {
  return (
    <div className="flex h-screen bg-gray-50" data-testid="protected-risk-management">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <RiskManagement {...props} />
      </div>
    </div>
  );
}

function ProtectedAcumaticaSync(props: any) {
  return (
    <div className="flex h-screen bg-gray-50" data-testid="protected-acumatica-sync">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AcumaticaSync {...props} />
      </div>
    </div>
  );
}

function ProtectedExcelImportExport(props: any) {
  return (
    <div className="flex h-screen bg-gray-50" data-testid="protected-excel-import-export">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ExcelImportExport {...props} />
      </div>
    </div>
  );
}

// Profile and account settings protected wrappers
function ProtectedProfile(props: any) {
  return (
    <div className="flex h-screen bg-gray-50" data-testid="protected-profile">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ProfilePage {...props} />
      </div>
    </div>
  );
}

function ProtectedAccountSettings(props: any) {
  return (
    <div className="flex h-screen bg-gray-50" data-testid="protected-account-settings">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AccountSettingsPage {...props} />
      </div>
    </div>
  );
}

// Admin protected wrapper
function ProtectedAdminUsers(props: any) {
  return (
    <div className="flex h-screen bg-gray-50" data-testid="protected-admin-users">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminUsersPage {...props} />
      </div>
    </div>
  );
}

function ProtectedWhitePaper(props: any) {
  return (
    <div className="flex h-screen bg-gray-50" data-testid="protected-white-paper">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <WhitePaper {...props} />
      </div>
    </div>
  );
}

function AppRoutes() {
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
      
      {/* Protected Routes - Each route individually wrapped */}
      <Route path="/">
        <ProtectedRoute component={ProtectedDashboard} />
      </Route>
      <Route path="/projects">
        <ProtectedRoute component={ProtectedProjects} />
      </Route>
      <Route path="/tasks">
        <ProtectedRoute component={ProtectedTasks} />
      </Route>
      <Route path="/time-tracking">
        <ProtectedRoute component={ProtectedTimeTracking} />
      </Route>
      <Route path="/rfi-tracking">
        <ProtectedRoute component={ProtectedRfiTracking} />
      </Route>
      <Route path="/change-orders">
        <ProtectedRoute component={ProtectedChangeOrders} />
      </Route>
      <Route path="/risk-management">
        <ProtectedRoute component={ProtectedRiskManagement} />
      </Route>
      <Route path="/acumatica-sync">
        <ProtectedRoute component={ProtectedAcumaticaSync} />
      </Route>
      <Route path="/excel-import-export">
        <ProtectedRoute component={ProtectedExcelImportExport} />
      </Route>
      
      {/* Profile and Account Routes */}
      <Route path="/profile">
        <ProtectedRoute component={ProtectedProfile} />
      </Route>
      <Route path="/account-settings">
        <ProtectedRoute component={ProtectedAccountSettings} />
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin/users">
        <AdminRoute component={ProtectedAdminUsers} />
      </Route>
      
      {/* Resources Routes */}
      <Route path="/white-paper">
        <ProtectedRoute component={ProtectedWhitePaper} />
      </Route>
      
      {/* Catch all - redirect to login if not authenticated, otherwise not found */}
      <Route>
        <ProtectedRoute component={NotFound} />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <TooltipProvider>
            <Toaster />
            <AppRoutes />
          </TooltipProvider>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
