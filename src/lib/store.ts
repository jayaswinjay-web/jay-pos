// Types
export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  role: 'Admin' | 'Cashier' | 'Manager';
  active: boolean;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  sku: string;
}

export interface CartItem extends Product {
  quantity: number;
  total: number;
}

export interface Transaction {
  id: number;
  invoiceNo: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'upi' | 'card';
  status: 'completed' | 'pending' | 'cancelled';
  cashier: string;
  customer?: string;
}

// Default data
export const defaultUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    password: 'Admin@123',
    name: 'Administrator',
    role: 'Admin',
    active: true
  },
  {
    id: 2,
    username: 'cashier',
    password: 'Cashier@123',
    name: 'John Cashier',
    role: 'Cashier',
    active: true
  },
  {
    id: 3,
    username: 'manager',
    password: 'Manager@123',
    name: 'Sarah Manager',
    role: 'Manager',
    active: true
  }
];

export const defaultProducts: Product[] = [
  { id: 1, name: 'Dell Laptop i5 12th Gen', price: 45000, stock: 5, category: 'Electronics', sku: 'LAP001' },
  { id: 2, name: 'Wireless Mouse Logitech', price: 799, stock: 25, category: 'Electronics', sku: 'MOU001' },
  { id: 3, name: 'Mechanical Keyboard RGB', price: 2499, stock: 15, category: 'Electronics', sku: 'KEY001' },
  { id: 4, name: 'USB-C Hub 7-in-1', price: 1299, stock: 30, category: 'Electronics', sku: 'HUB001' },
  { id: 5, name: 'Webcam HD 1080p', price: 1999, stock: 12, category: 'Electronics', sku: 'CAM001' },
  { id: 6, name: 'Monitor Stand Wooden', price: 899, stock: 20, category: 'Accessories', sku: 'STD001' },
  { id: 7, name: 'Laptop Bag Premium', price: 1499, stock: 18, category: 'Accessories', sku: 'BAG001' },
  { id: 8, name: 'Wireless Earbuds TWS', price: 1299, stock: 40, category: 'Audio', sku: 'EAR001' },
  { id: 9, name: 'Bluetooth Speaker 20W', price: 2999, stock: 8, category: 'Audio', sku: 'SPK001' },
  { id: 10, name: 'Power Bank 20000mAh', price: 1599, stock: 35, category: 'Electronics', sku: 'PWR001' },
  { id: 11, name: 'HDMI Cable 2m', price: 299, stock: 50, category: 'Cables', sku: 'CBL001' },
  { id: 12, name: 'USB Flash Drive 64GB', price: 499, stock: 45, category: 'Storage', sku: 'USB001' },
];

export const defaultTransactions: Transaction[] = [
  {
    id: 1,
    invoiceNo: 'INV-0001',
    date: new Date().toISOString(),
    items: [
      { ...defaultProducts[0], quantity: 1, total: 45000 },
      { ...defaultProducts[1], quantity: 2, total: 1598 }
    ],
    subtotal: 46598,
    tax: 8387.64,
    discount: 0,
    total: 54985.64,
    paymentMethod: 'card',
    status: 'completed',
    cashier: 'Administrator',
    customer: 'Walk-in Customer'
  },
  {
    id: 2,
    invoiceNo: 'INV-0002',
    date: new Date(Date.now() - 3600000).toISOString(),
    items: [
      { ...defaultProducts[7], quantity: 2, total: 2598 },
      { ...defaultProducts[9], quantity: 1, total: 1599 }
    ],
    subtotal: 4197,
    tax: 755.46,
    discount: 200,
    total: 4752.46,
    paymentMethod: 'upi',
    status: 'completed',
    cashier: 'John Cashier',
    customer: 'Regular Customer'
  }
];

// Local storage helpers
const STORAGE_KEY = 'jay_pos_data';

interface CashLog {
  id: number;
  type: 'in' | 'out';
  amount: number;
  description: string;
  date: string;
  user: string;
}

interface POSData {
  users: User[];
  products: Product[];
  transactions: Transaction[];
  cashLogs: CashLog[];
  settings: Record<string, unknown>;
}

export function loadData(): POSData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  
  // Return defaults
  return {
    users: defaultUsers,
    products: defaultProducts,
    transactions: defaultTransactions,
    cashLogs: [],
    settings: {}
  };
}

export function saveData(data: POSData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

export function generateInvoiceNo(): string {
  const data = loadData();
  const nextNum = (data.transactions.length + 1).toString().padStart(4, '0');
  return `INV-${nextNum}`;
}
