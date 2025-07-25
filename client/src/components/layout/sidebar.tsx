import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
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
  Settings 
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

const integrations = [
  { name: "Acumatica Sync", href: "/acumatica-sync", icon: Cloud },
  { name: "Excel Import/Export", href: "/excel-import-export", icon: FileSpreadsheet },
];

export default function Sidebar() {
  const [location] = useLocation();

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
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">JS</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">John Smith</p>
            <p className="text-xs text-gray-500">Project Manager</p>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <Settings size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
