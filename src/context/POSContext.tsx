import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem, Transaction, loadData, saveData, generateInvoiceNo } from '@/lib/store';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface POSContextType {
  products: Product[];
  cart: CartItem[];
  transactions: Transaction[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateCartQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => { subtotal: number; tax: number; total: number };
  processPayment: (method: 'cash' | 'upi' | 'card', discount?: number) => Transaction | null;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: number) => void;
  getTodayStats: () => { revenue: number; orders: number; products: number; lowStock: number };
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export function POSProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    const data = loadData();
    setProducts(data.products);
    setTransactions(data.transactions);
  }, []);

  const persistData = (newProducts?: Product[], newTransactions?: Transaction[]) => {
    const data = loadData();
    saveData({
      ...data,
      products: newProducts || products,
      transactions: newTransactions || transactions
    });
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    if (product.stock < quantity) {
      toast.error('Not enough stock available!');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity + quantity > product.stock) {
          toast.error('Not enough stock available!');
          return prev;
        }
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * item.price }
            : item
        );
      }
      toast.success(`${product.name} added to cart`);
      return [...prev, { ...product, quantity, total: quantity * product.price }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (quantity > product.stock) {
      toast.error('Not enough stock available!');
      return;
    }

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity, total: quantity * item.price }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const processPayment = (method: 'cash' | 'upi' | 'card', discount: number = 0): Transaction | null => {
    if (cart.length === 0) {
      toast.error('Cart is empty!');
      return null;
    }

    const { subtotal, tax, total } = getCartTotal();
    const finalTotal = total - discount;

    const transaction: Transaction = {
      id: Date.now(),
      invoiceNo: generateInvoiceNo(),
      date: new Date().toISOString(),
      items: [...cart],
      subtotal,
      tax,
      discount,
      total: finalTotal,
      paymentMethod: method,
      status: 'completed',
      cashier: currentUser?.name || 'Unknown',
      customer: 'Walk-in Customer'
    };

    // Update stock
    const updatedProducts = products.map(product => {
      const cartItem = cart.find(item => item.id === product.id);
      if (cartItem) {
        return { ...product, stock: product.stock - cartItem.quantity };
      }
      return product;
    });

    const updatedTransactions = [...transactions, transaction];

    setProducts(updatedProducts);
    setTransactions(updatedTransactions);
    setCart([]);
    persistData(updatedProducts, updatedTransactions);

    toast.success(`Payment successful! Invoice: ${transaction.invoiceNo}`);
    return transaction;
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: Date.now() };
    const updated = [...products, newProduct];
    setProducts(updated);
    persistData(updated);
    toast.success('Product added successfully!');
  };

  const updateProduct = (product: Product) => {
    const updated = products.map(p => p.id === product.id ? product : p);
    setProducts(updated);
    persistData(updated);
    toast.success('Product updated successfully!');
  };

  const deleteProduct = (productId: number) => {
    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);
    persistData(updated);
    toast.success('Product deleted successfully!');
  };

  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todayTransactions = transactions.filter(
      t => new Date(t.date).toDateString() === today && t.status === 'completed'
    );
    
    const revenue = todayTransactions.reduce((sum, t) => sum + t.total, 0);
    const orders = todayTransactions.length;
    const lowStock = products.filter(p => p.stock <= 5).length;

    return { revenue, orders, products: products.length, lowStock };
  };

  return (
    <POSContext.Provider value={{
      products,
      cart,
      transactions,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      getCartTotal,
      processPayment,
      addProduct,
      updateProduct,
      deleteProduct,
      getTodayStats
    }}>
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
}
