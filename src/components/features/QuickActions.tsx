import React from 'react';
import { 
  Keyboard, 
  Calculator, 
  Printer, 
  RotateCcw, 
  Pause, 
  Percent,
  User,
  Trash2,
  Search,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface QuickActionsProps {
  onAction: (action: string) => void;
  cartCount?: number;
  hasCustomer?: boolean;
  hasDiscount?: boolean;
}

const SHORTCUTS = [
  { key: 'F1', action: 'search', icon: Search, label: 'Search Products' },
  { key: 'F2', action: 'customer', icon: User, label: 'Add Customer' },
  { key: 'F3', action: 'discount', icon: Percent, label: 'Apply Discount' },
  { key: 'F4', action: 'hold', icon: Pause, label: 'Hold Bill' },
  { key: 'F5', action: 'clear', icon: Trash2, label: 'Clear Cart' },
  { key: 'F8', action: 'calculator', icon: Calculator, label: 'Calculator' },
  { key: 'F9', action: 'print', icon: Printer, label: 'Print Last' },
  { key: 'F10', action: 'refund', icon: RotateCcw, label: 'Refund' },
  { key: 'F12', action: 'checkout', icon: Plus, label: 'Quick Checkout' },
];

export function QuickActions({ onAction, cartCount = 0, hasCustomer, hasDiscount }: QuickActionsProps) {
  // Register keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcut = SHORTCUTS.find(s => s.key === e.key);
      if (shortcut) {
        e.preventDefault();
        onAction(shortcut.action);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAction]);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {SHORTCUTS.slice(0, 6).map(({ key, action, icon: Icon, label }) => (
        <Tooltip key={key}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 gap-1.5"
              onClick={() => onAction(action)}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-xs hidden sm:inline">{label.split(' ')[0]}</span>
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                {key}
              </Badge>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{label} ({key})</p>
          </TooltipContent>
        </Tooltip>
      ))}
      
      <div className="hidden lg:flex items-center gap-1 ml-2 pl-2 border-l">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              onClick={() => onAction('shortcuts')}
            >
              <Keyboard className="w-3.5 h-3.5 mr-1" />
              <span className="text-xs">All Shortcuts</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {SHORTCUTS.map(({ key, label }) => (
                <div key={key} className="flex justify-between gap-2">
                  <span>{label}</span>
                  <Badge variant="secondary" className="text-[10px]">{key}</Badge>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-1 ml-auto">
        {cartCount > 0 && (
          <Badge variant="default" className="text-xs">
            {cartCount} items
          </Badge>
        )}
        {hasCustomer && (
          <Badge variant="secondary" className="text-xs">
            <User className="w-3 h-3 mr-1" />
            Customer
          </Badge>
        )}
        {hasDiscount && (
          <Badge variant="outline" className="text-xs text-emerald-500">
            <Percent className="w-3 h-3 mr-1" />
            Discount
          </Badge>
        )}
      </div>
    </div>
  );
}
