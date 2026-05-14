import React from 'react';
import { useOrganizationContext } from '@/context/OrganizationContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Zap, 
  Package, 
  Users, 
  Wallet, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Database } from '@/integrations/supabase/types';

type PermissionType = Database['public']['Enums']['permission_type'];

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  permission?: PermissionType;
}

const navItems: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'billing', icon: ShoppingCart, label: 'Billing' },
  { id: 'quickBill', icon: Zap, label: 'Quick Bill' },
  { id: 'inventory', icon: Package, label: 'Inventory', permission: 'manage_products' },
  { id: 'employees', icon: Users, label: 'Team', permission: 'manage_users' },
  { id: 'cash', icon: Wallet, label: 'Cash', permission: 'manage_cash' },
  { id: 'reports', icon: BarChart3, label: 'Reports', permission: 'view_reports' },
  { id: 'settings', icon: Settings, label: 'Settings', permission: 'manage_settings' },
];

export function AppSidebar({ activeTab, onTabChange, collapsed, onToggle }: AppSidebarProps) {
  const { hasPermission, isOwner, isAdmin } = useOrganizationContext();

  const visibleItems = navItems.filter(item => {
    if (!item.permission) return true;
    if (isOwner() || isAdmin()) return true;
    return hasPermission(item.permission);
  });

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className={cn(
          "bg-card border-r border-border flex flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <nav className="flex-1 p-3 space-y-1">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            if (collapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onTabChange(item.id)}
                      className={cn(
                        "w-full h-10 rounded-lg flex items-center justify-center transition-all",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full h-10 rounded-lg flex items-center gap-3 px-3 transition-all",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              "w-full justify-center",
              !collapsed && "justify-start"
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
