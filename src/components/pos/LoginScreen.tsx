import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart, User, Lock, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export function LoginScreen() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [showReset, setShowReset] = useState(false);
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      toast.success('Login successful!');
    } else {
      toast.error('Invalid username or password!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="pos-card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
              <ShoppingCart className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">JAY POS PRO</h1>
            <p className="text-muted-foreground mt-2">Complete Professional System</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setShowReset(false)}
              className={`flex-1 py-2.5 rounded-md font-medium transition-all ${
                !showReset ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setShowReset(true)}
              className={`flex-1 py-2.5 rounded-md font-medium transition-all ${
                showReset ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Reset Password
            </button>
          </div>

          {!showReset ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <User className="w-4 h-4" /> Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pos-input"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Lock className="w-4 h-4" /> Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pos-input"
                  placeholder="Enter password"
                />
              </div>

              <button type="submit" className="pos-btn-primary w-full py-3 text-base">
                <KeyRound className="w-5 h-5" />
                Sign In
              </button>

              {/* Default Credentials */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-sm text-foreground mb-3">Default Credentials:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex justify-between">
                    <span className="font-medium text-foreground">Admin:</span>
                    <span>admin / Admin@123</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="font-medium text-foreground">Cashier:</span>
                    <span>cashier / Cashier@123</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="font-medium text-foreground">Manager:</span>
                    <span>manager / Manager@123</span>
                  </li>
                </ul>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Username</label>
                <input type="text" className="pos-input" placeholder="Enter username" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Current Password</label>
                <input type="password" className="pos-input" placeholder="Current password" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">New Password</label>
                <input type="password" className="pos-input" placeholder="New password" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Confirm Password</label>
                <input type="password" className="pos-input" placeholder="Confirm new password" />
              </div>
              <button className="pos-btn-success w-full py-3">
                <KeyRound className="w-5 h-5" />
                Reset Password
              </button>
              <button 
                onClick={() => setShowReset(false)}
                className="pos-btn-outline w-full py-3"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
