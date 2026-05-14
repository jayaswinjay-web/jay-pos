import React, { useState, memo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Building2, Mail, Lock, User, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { GoogleSignIn } from './GoogleSignIn';
import { GoogleSignUpFlow } from './GoogleSignUpFlow';
import { Separator } from '@/components/ui/separator';

type AuthMode = 'login' | 'register' | 'forgot';

export const AuthScreen = memo(function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signOut, requestPasswordOtp } = useAuth();
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'verify'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setOrgName('');
    setSubdomain('');
    setForgotStep('email');
    setOtpCode('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      toast.success('Welcome back!');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName || !orgName || !subdomain) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      const { data: authData, error: authError } = await signUp(email, password, displayName);
      if (authError) throw authError;
      
      if (authData.user) {
        const { data: orgId, error: orgError } = await supabase.rpc('create_organization', {
          _name: orgName,
          _subdomain: subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ''),
          _owner_name: displayName,
          _owner_email: email,
        });
        
        if (orgError) throw orgError;
        
        toast.success('Account created! Welcome to your new store.');
        // Reload to let OrganizationProvider fetch the newly created org
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      if (forgotStep === 'email') {
        const { error } = await requestPasswordOtp(email);
        if (error) throw error;

        setForgotStep('verify');
        toast.success('OTP sent to your email');
        return;
      }

      if (otpCode.trim().length !== 6) {
        toast.error('Please enter the 6-digit OTP');
        return;
      }

      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      if (newPassword !== confirmNewPassword) {
        toast.error('Passwords do not match');
        return;
      }

      const { error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode.trim(),
        type: 'email',
      });
      if (otpError) throw otpError;

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      await signOut();
      toast.success('Password updated successfully! Please sign in.');
      switchMode('login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full border-2 border-white/20"></div>
          <div className="absolute bottom-40 right-10 w-96 h-96 rounded-full border-2 border-white/20"></div>
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full border-2 border-white/20"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <ShoppingCart className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">JAY POS</span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            Enterprise Point of Sale
            <br />
            <span className="text-white/80">for Modern Businesses</span>
          </h1>
          
          <p className="text-lg text-white/70 max-w-md">
            Manage your store, track sales, and grow your business with our professional POS system.
          </p>
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-white/80">
            <Sparkles className="w-5 h-5" />
            <span>Multi-store management</span>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <Sparkles className="w-5 h-5" />
            <span>Custom roles & permissions</span>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <Sparkles className="w-5 h-5" />
            <span>UPI & Card payments</span>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <Sparkles className="w-5 h-5" />
            <span>Real-time analytics</span>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Forms */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <ShoppingCart className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">JAY POS</span>
          </div>
          
          {/* Login Form */}
          {mode === 'login' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                <p className="text-muted-foreground mt-1">Sign in to access your store</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder="you@company.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <GoogleSignIn className="w-full" />
              </form>
              
              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="text-primary font-medium hover:underline"
                  >
                    Create one
                  </button>
                </p>
              </div>
            </div>
          )}
          
          {/* Register Form */}
          {mode === 'register' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Create your store</h2>
                <p className="text-muted-foreground mt-1">Start your 14-day free trial</p>
              </div>
              
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Your Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-10"
                      placeholder="John Doe"
                      required
                      autoComplete="name"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="orgName">Business Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="orgName"
                      type="text"
                      value={orgName}
                      onChange={(e) => {
                        setOrgName(e.target.value);
                        setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                      }}
                      className="pl-10"
                      placeholder="My Store"
                      required
                      autoComplete="organization"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Store URL</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="subdomain"
                      type="text"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="mystore"
                      required
                      className="flex-1"
                    />
                    <span className="text-muted-foreground text-sm whitespace-nowrap">.jaypos.app</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="regEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="regEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder="you@company.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="regPassword">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="regPassword"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      placeholder="Min 6 characters"
                      minLength={6}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Store
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or sign up with</span>
                  </div>
                </div>

                <GoogleSignUpFlow className="w-full" />
              </form>
              
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
          
          {/* Forgot Password Form */}
          {mode === 'forgot' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Reset password</h2>
                <p className="text-muted-foreground mt-1">
                  {forgotStep === 'email'
                    ? "We'll send a 6-digit OTP to your email"
                    : 'Enter OTP and set your new password'}
                </p>
              </div>
              
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgotEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="forgotEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder="you@company.com"
                      required
                      autoComplete="email"
                      disabled={forgotStep === 'verify'}
                    />
                  </div>
                </div>

                {forgotStep === 'verify' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="forgotOtp">OTP Code</Label>
                      <InputOTP
                        id="forgotOtp"
                        maxLength={6}
                        value={otpCode}
                        onChange={(value) => setOtpCode(value.replace(/\s/g, ''))}
                      >
                        <InputOTPGroup className="justify-center w-full">
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newForgotPassword">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="newForgotPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pl-10"
                          placeholder="Min 6 characters"
                          minLength={6}
                          required
                          autoComplete="new-password"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmForgotPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="confirmForgotPassword"
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="pl-10"
                          placeholder="Repeat password"
                          minLength={6}
                          required
                          autoComplete="new-password"
                        />
                      </div>
                    </div>
                  </>
                )}
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {forgotStep === 'email' ? 'Send OTP' : 'Verify OTP & Update Password'}
                </Button>
              </form>
              
              {forgotStep === 'verify' ? (
                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => setForgotStep('email')}
                    className="text-primary font-medium hover:underline"
                  >
                    Use a different email
                  </button>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
