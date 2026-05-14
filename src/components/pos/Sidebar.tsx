import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Zap, 
  Package, 
  Users, 
  Wallet, 
  BarChart3, 
  Settings 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: string;
}

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'billing', icon: ShoppingCart, label: 'Billing' },
  { id: 'quickBill', icon: Zap, label: 'Quick Bill' },
  { id: 'inventory', icon: Package, label: 'Inventory', adminOnly: true },
  { id: 'employees', icon: Users, label: 'Employees', adminOnly: true },
  { id: 'cash', icon: Wallet, label: 'Cash', roles: ['Admin', 'Manager'] },
  { id: 'reports', icon: BarChart3, label: 'Reports' },
  { id: 'settings', icon: Settings, label: 'Settings', adminOnly: true },
];

export function Sidebar({ activeTab, onTabChange, userRole }: SidebarProps) {
  const visibleItems = navItems.filter(item => {
    if (item.adminOnly && userRole !== 'Admin') return false;
    if (item.roles && !item.roles.includes(userRole)) return false;
    return true;
  });

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`pos-nav-item w-full ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
