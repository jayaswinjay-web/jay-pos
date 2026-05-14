import React, { useState, useCallback } from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { DashboardView } from './views/DashboardView';
import { BillingView } from './views/BillingView';
import { QuickBillView } from './views/QuickBillView';
import { InventoryView } from './views/InventoryView';
import { TeamView } from './views/TeamView';
import { CashView } from './views/CashView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

type TabType = 'dashboard' | 'billing' | 'quickBill' | 'inventory' | 'employees' | 'cash' | 'reports' | 'settings';

export function AppLayout() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as TabType);
    setMobileMenuOpen(false);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'billing':
        return <BillingView />;
      case 'quickBill':
        return <QuickBillView />;
      case 'inventory':
        return <InventoryView />;
      case 'employees':
        return <TeamView />;
      case 'cash':
        return <CashView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  // Mobile layout with sheet menu
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="h-14 bg-card border-b border-border flex items-center justify-between px-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <AppSidebar 
                activeTab={activeTab}
                onTabChange={handleTabChange}
                collapsed={false}
                onToggle={() => {}}
              />
            </SheetContent>
          </Sheet>
          
          <AppHeader onNavigate={handleTabChange} isMobile />
        </div>
        
        <main className="flex-1 overflow-auto p-4">
          {renderContent()}
        </main>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader onNavigate={handleTabChange} />
      
      <div className="flex-1 flex overflow-hidden">
        <AppSidebar 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
