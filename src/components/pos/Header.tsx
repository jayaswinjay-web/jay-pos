import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart, KeyRound, LogOut, Clock } from 'lucide-react';

export function Header() {
  const { currentUser, logout } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">JAY POS System</h1>
            <p className="text-xs text-muted-foreground">
              Welcome, {currentUser?.name} ({currentUser?.role})
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
          <Clock className="w-4 h-4" />
          <span className="font-mono text-sm">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <button className="pos-btn-ghost">
          <KeyRound className="w-4 h-4" />
          <span className="hidden sm:inline">Change Password</span>
        </button>
        
        <button onClick={logout} className="pos-btn-outline text-destructive border-destructive hover:bg-destructive/10">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
