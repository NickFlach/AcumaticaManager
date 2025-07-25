import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onSync?: () => void;
  onNew?: () => void;
  showSyncButton?: boolean;
  showNewButton?: boolean;
}

export default function Header({ 
  title, 
  subtitle, 
  actions, 
  onSync, 
  onNew, 
  showSyncButton = false, 
  showNewButton = false 
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {showSyncButton && onSync && (
            <Button 
              onClick={onSync}
              variant="outline"
              className="bg-secondary text-white hover:bg-secondary/90 border-secondary"
            >
              <RefreshCw size={16} className="mr-2" />
              Sync Acumatica
            </Button>
          )}
          {showNewButton && onNew && (
            <Button onClick={onNew} className="bg-primary hover:bg-primary/90">
              <Plus size={16} className="mr-2" />
              New Project
            </Button>
          )}
          {actions}
        </div>
      </div>
    </header>
  );
}
