import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationContext } from '@/context/OrganizationContext';
import { 
  ShoppingCart, 
  Clock, 
  LogOut, 
  ChevronDown, 
  User,
  Settings,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tables } from '@/integrations/supabase/types';

type CustomRole = Tables<'custom_roles'>;

interface AppHeaderProps {
  onNavigate: (tab: string) => void;
  isMobile?: boolean;
}

export function AppHeader({ onNavigate, isMobile = false }: AppHeaderProps) {
  const { signOut } = useAuth();
  const { organization, member, storeSettings } = useOrganizationContext();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  const initials = member?.display_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const roleName = (member?.role as CustomRole)?.name || 'Member';

  // Mobile header - simplified
  if (isMobile) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground text-sm">
            {storeSettings?.store_name || 'JAY POS'}
          </span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{member?.display_name}</p>
                <p className="text-xs text-muted-foreground">{member?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onNavigate('settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Desktop header
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
      {/* Left: Logo & Store Name */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="hidden sm:block">
          <h1 className="font-semibold text-foreground">
            {storeSettings?.store_name || organization?.name || 'JAY POS'}
          </h1>
          <p className="text-xs text-muted-foreground">{organization?.subdomain}.jaypos.app</p>
        </div>
      </div>

      {/* Right: Time, Notifications, Profile */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Time */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="hidden sm:flex">
          <Bell className="w-5 h-5" />
        </Button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-foreground">{member?.display_name}</p>
                <p className="text-xs text-muted-foreground">{roleName}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden lg:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{member?.display_name}</p>
                <p className="text-xs text-muted-foreground">{member?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onNavigate('settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate('profile')}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
