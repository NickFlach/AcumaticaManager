import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Clock, 
  HelpCircle, 
  ArrowUpDown, 
  AlertTriangle, 
  Cloud, 
  FileSpreadsheet, 
  Zap, 
  Settings,
  User,
  Users,
  Shield,
  LogOut
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Task Management", href: "/tasks", icon: CheckSquare },
  { name: "Time Tracking", href: "/time-tracking", icon: Clock },
  { name: "RFI Tracking", href: "/rfi-tracking", icon: HelpCircle },
  { name: "Change Orders", href: "/change-orders", icon: ArrowUpDown },
  { name: "Risk Management", href: "/risk-management", icon: AlertTriangle },
];

const accountNavigation = [
  { name: "Profile", href: "/profile", icon: User },
  { name: "Account Settings", href: "/account-settings", icon: Settings },
];

const adminNavigation = [
  { name: "User Management", href: "/admin/users", icon: Users },
];

const integrations = [
  { name: "Acumatica Sync", href: "/acumatica-sync", icon: Cloud },
  { name: "Excel Import/Export", href: "/excel-import-export", icon: FileSpreadsheet },
];

// Helper function to get user initials
function getUserInitials(firstName?: string, lastName?: string, username?: string): string {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (username) {
    return username.substring(0, 2).toUpperCase();
  }
  return "U";
}

// Helper function to get display name
function getDisplayName(firstName?: string, lastName?: string, username?: string): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  return username || "User";
}

// Helper function to format role
function formatRole(role?: string): string {
  if (!role) return "User";
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
      {/* Logo and Company */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">ElectroProject Pro</h1>
            <p className="text-sm text-gray-500">Union Electrical PM</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}

        <div className="border-t border-gray-200 my-4"></div>
        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Integrations</p>
        {integrations.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(/ /g, '-')}`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}

        <div className="border-t border-gray-200 my-4"></div>
        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Account</p>
        {accountNavigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(/ /g, '-')}`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}

        {user?.role === 'admin' && (
          <>
            <div className="border-t border-gray-200 my-4"></div>
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Shield size={12} />
              Admin
            </p>
            {adminNavigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    data-testid={`nav-admin-${item.name.toLowerCase().replace(/ /g, '-')}`}
                  >
                    <item.icon size={20} />
                    <span>{item.name}</span>
                  </a>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        {user ? (
          <div className="flex items-center space-x-3">
            <div 
              className="w-8 h-8 bg-primary rounded-full flex items-center justify-center"
              data-testid="user-avatar"
            >
              <span className="text-white text-sm font-medium">
                {getUserInitials(user.firstName, user.lastName, user.username)}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900" data-testid="user-name">
                {getDisplayName(user.firstName, user.lastName, user.username)}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500" data-testid="user-role">
                  {formatRole(user.role)}
                </p>
                {!user.emailVerified && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Unverified
                  </span>
                )}
                {!user.isActive && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Inactive
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/account-settings">
                <a className="text-gray-400 hover:text-gray-600" data-testid="button-settings">
                  <Settings size={16} />
                </a>
              </Link>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-red-600 transition-colors"
                data-testid="button-logout"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded mb-1"></div>
              <div className="h-3 bg-gray-300 rounded w-2/3"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
