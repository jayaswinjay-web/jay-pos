import React, { forwardRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { OrganizationProvider, useOrganizationContext } from '@/context/OrganizationContext';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { OnboardingScreen } from '@/components/auth/OnboardingScreen';
import { AppLayout } from '@/components/app/AppLayout';
import { Loader2, ShoppingCart } from 'lucide-react';

const LoadingScreen = forwardRef<HTMLDivElement>(function LoadingScreen(_, ref) {
  return (
    <div ref={ref} className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <ShoppingCart className="w-8 h-8 text-primary" />
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Loading JAY POS...</p>
      </div>
    </div>
  );
});

const AuthenticatedApp = forwardRef<HTMLDivElement>(function AuthenticatedApp(_, ref) {
  const { organization, loading } = useOrganizationContext();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!organization) {
    return <OnboardingScreen />;
  }

  return <AppLayout />;
});

function AppContent() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <OrganizationProvider>
      <AuthenticatedApp />
    </OrganizationProvider>
  );
}

const Index = () => {
  return <AppContent />;
};

export default Index;
