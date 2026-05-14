import React, { useState, useEffect } from 'react';
import { User, Phone, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CustomerInfo {
  name: string;
  phone: string;
}

interface CustomerInputProps {
  customer: CustomerInfo | null;
  onCustomerChange: (customer: CustomerInfo | null) => void;
}

// Simple storage key for customer history
const CUSTOMER_HISTORY_KEY = 'pos_customer_history';

interface StoredCustomer extends CustomerInfo {
  lastVisit: string;
}

export function CustomerInput({ customer, onCustomerChange }: CustomerInputProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [searchResults, setSearchResults] = useState<StoredCustomer[]>([]);

  // Load customer data when phone changes
  useEffect(() => {
    if (phone.length >= 10) {
      const history = getCustomerHistory();
      const existing = history.find(c => c.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''));
      if (existing && !name) {
        setName(existing.name);
      }
    }
  }, [phone, name]);

  // Search customers
  useEffect(() => {
    if (phone.length >= 3 || name.length >= 2) {
      const history = getCustomerHistory();
      const results = history.filter(c => 
        c.phone.includes(phone) || 
        c.name.toLowerCase().includes(name.toLowerCase())
      ).slice(0, 5);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [phone, name]);

  const getCustomerHistory = (): StoredCustomer[] => {
    try {
      const stored = localStorage.getItem(CUSTOMER_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveCustomerHistory = (customerData: CustomerInfo) => {
    const history = getCustomerHistory();
    const cleanPhone = customerData.phone.replace(/\D/g, '');
    
    // Remove existing entry for this phone
    const filtered = history.filter(c => c.phone.replace(/\D/g, '') !== cleanPhone);
    
    // Add new entry at the beginning
    const updated: StoredCustomer[] = [
      { ...customerData, lastVisit: new Date().toISOString() },
      ...filtered
    ].slice(0, 50); // Keep last 50 customers
    
    localStorage.setItem(CUSTOMER_HISTORY_KEY, JSON.stringify(updated));
  };

  const handleSave = () => {
    if (!name.trim() && !phone.trim()) {
      onCustomerChange(null);
      setOpen(false);
      return;
    }

    const customerData: CustomerInfo = {
      name: name.trim(),
      phone: phone.trim()
    };

    // Save to history if phone is valid
    if (phone.replace(/\D/g, '').length >= 10) {
      saveCustomerHistory(customerData);
    }

    onCustomerChange(customerData);
    setOpen(false);
  };

  const handleClear = () => {
    setName('');
    setPhone('');
    onCustomerChange(null);
    setOpen(false);
  };

  const handleSelectCustomer = (selectedCustomer: StoredCustomer) => {
    setName(selectedCustomer.name);
    setPhone(selectedCustomer.phone);
    onCustomerChange({
      name: selectedCustomer.name,
      phone: selectedCustomer.phone
    });
    setSearchResults([]);
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setName(customer?.name || '');
      setPhone(customer?.phone || '');
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8">
          <User className="w-3.5 h-3.5" />
          {customer ? (
            <span className="max-w-[100px] truncate text-xs">
              {customer.name || customer.phone}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">Customer</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Customer Details
            </h4>
            {customer && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClear}>
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="pl-8 h-9"
                  maxLength={15}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Customer Name</Label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter customer name"
                  className="pl-8 h-9"
                />
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border rounded-lg max-h-32 overflow-auto">
                <div className="p-1.5 text-xs text-muted-foreground flex items-center gap-1 border-b bg-muted/50">
                  <Search className="w-3 h-3" />
                  Recent customers
                </div>
                {searchResults.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectCustomer(c)}
                    className="w-full text-left px-2 py-1.5 hover:bg-muted text-sm flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleClear}>
              Clear
            </Button>
            <Button size="sm" className="flex-1" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}