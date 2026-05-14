import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, loadData, saveData, defaultUsers } from '@/lib/store';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('currentUser');
      }
    }
    
    // Initialize data if needed
    const data = loadData();
    if (!data.users || data.users.length === 0) {
      saveData({ ...data, users: defaultUsers });
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const data = loadData();
    const user = data.users.find(
      u => u.username === username && u.password === password && u.active
    );
    
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      login, 
      logout, 
      isAuthenticated: !!currentUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
