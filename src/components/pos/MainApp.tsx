import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Dashboard } from './Dashboard';
import { Billing } from './Billing';
import { QuickBill } from './QuickBill';
import { Inventory } from './Inventory';
import { Employees } from './Employees';
import { CashManagement } from './CashManagement';
import { Reports } from './Reports';
import { AdminSettings } from './AdminSettings';

export function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { currentUser } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'billing':
        return <Billing />;
      case 'quickBill':
        return <QuickBill />;
      case 'inventory':
        return <Inventory />;
      case 'employees':
        return <Employees />;
      case 'cash':
        return <CashManagement />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          userRole={currentUser?.role || 'Cashier'}
        />
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
