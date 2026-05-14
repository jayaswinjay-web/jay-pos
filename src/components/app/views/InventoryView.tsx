import React, { useState, useMemo, useRef } from 'react';
import { useOrganizationContext } from '@/context/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  Loader2,
  Save,
  AlertTriangle,
  Camera,
  Upload,
  Download,
  Barcode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CameraScanner } from '@/components/billing/CameraScanner';

type Product = Tables<'products'>;

export function InventoryView() {
  const { organization, products, refreshProducts, storeSettings, hasPermission } = useOrganizationContext();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    price: '',
    stock: '',
    category: '',
    description: ''
  });

  const canManage = hasPermission('manage_products');

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean) as string[]);
    return Array.from(cats);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock > 0 && p.stock <= 10);
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return products.filter(p => p.stock === 0);
  }, [products]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: storeSettings?.currency || 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setForm({ name: '', sku: '', price: '', stock: '', category: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      sku: product.sku || '',
      price: String(product.price),
      stock: String(product.stock),
      category: product.category || '',
      description: product.description || ''
    });
    setShowModal(true);
  };

  const handleProductScanned = (product: Product) => {
    openEditModal(product);
    setShowCamera(false);
  };

  const handleSave = async () => {
    if (!organization || !form.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    
    setLoading(true);
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({
            name: form.name.trim(),
            sku: form.sku.trim() || null,
            price: parseFloat(form.price) || 0,
            stock: parseInt(form.stock) || 0,
            category: form.category.trim() || null,
            description: form.description.trim() || null
          })
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Product updated');
      } else {
        const { error } = await supabase
          .from('products')
          .insert({
            organization_id: organization.id,
            name: form.name.trim(),
            sku: form.sku.trim() || null,
            price: parseFloat(form.price) || 0,
            stock: parseInt(form.stock) || 0,
            category: form.category.trim() || null,
            description: form.description.trim() || null
          });

        if (error) throw error;
        toast.success('Product added');
      }

      setShowModal(false);
      refreshProducts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', deleteProduct.id);

      if (error) throw error;
      toast.success('Product deleted');
      refreshProducts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    } finally {
      setDeleteProduct(null);
    }
  };

  const handleBulkImport = async () => {
    if (!organization || !bulkData.trim()) {
      toast.error('Please enter product data');
      return;
    }

    setImporting(true);
    try {
      const lines = bulkData.trim().split('\n');
      const productsToInsert: any[] = [];

      for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          productsToInsert.push({
            organization_id: organization.id,
            name: parts[0],
            price: parseFloat(parts[1]) || 0,
            stock: parseInt(parts[2]) || 0,
            sku: parts[3] || null,
            category: parts[4] || null
          });
        }
      }

      if (productsToInsert.length === 0) {
        toast.error('No valid products found');
        return;
      }

      const { error } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (error) throw error;

      toast.success(`Imported ${productsToInsert.length} products`);
      setShowBulkImport(false);
      setBulkData('');
      refreshProducts();
    } catch (error: any) {
      toast.error(error.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Skip header row if exists
      const lines = text.split('\n');
      const dataLines = lines[0].toLowerCase().includes('name') ? lines.slice(1) : lines;
      setBulkData(dataLines.join('\n'));
    };
    reader.readAsText(file);
  };

  const exportProducts = () => {
    const csv = [
      'Name,Price,Stock,SKU,Category,Description',
      ...products.map(p => 
        `"${p.name}",${p.price},${p.stock},"${p.sku || ''}","${p.category || ''}","${p.description || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Products exported');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Inventory</h2>
          <p className="text-muted-foreground">{products.length} products</p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCamera(true)}>
              <Camera className="w-4 h-4 mr-2" />
              Scan
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowBulkImport(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={exportProducts}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        )}
      </div>

      {/* Stock Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {outOfStockProducts.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              {outOfStockProducts.length} out of stock
            </Badge>
          )}
          {lowStockProducts.length > 0 && (
            <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600">
              <AlertTriangle className="w-3 h-3" />
              {lowStockProducts.length} low stock
            </Badge>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="pl-10"
        />
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">SKU</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Price</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Stock</th>
                  {canManage && (
                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{product.name}</p>
                          {product.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        {product.sku && <Barcode className="w-3 h-3" />}
                        {product.sku || '-'}
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <Badge variant="secondary">{product.category || 'Uncategorized'}</Badge>
                    </td>
                    <td className="p-4 text-right font-medium">{formatCurrency(Number(product.price))}</td>
                    <td className="p-4 text-right">
                      <Badge 
                        variant={product.stock > 10 ? 'default' : product.stock > 0 ? 'outline' : 'destructive'}
                      >
                        {product.stock}
                      </Badge>
                    </td>
                    {canManage && (
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(product)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive"
                            onClick={() => setDeleteProduct(product)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No products found</p>
                      <p className="text-sm">Try a different search term or add a new product</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Camera Scanner */}
      <CameraScanner
        products={products}
        onProductScanned={handleProductScanned}
        open={showCamera}
        onOpenChange={setShowCamera}
      />

      {/* Bulk Import Modal */}
      <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Bulk Import Products
            </DialogTitle>
            <DialogDescription>
              Import multiple products at once via CSV or manual entry
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* CSV Upload */}
            <div className="space-y-2">
              <Label>Upload CSV File</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose CSV File
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or paste data</span>
              </div>
            </div>

            {/* Manual Entry */}
            <div className="space-y-2">
              <Label>Product Data (one per line)</Label>
              <Textarea
                value={bulkData}
                onChange={(e) => setBulkData(e.target.value)}
                placeholder="Name, Price, Stock, SKU, Category&#10;Product 1, 100, 50, SKU001, Electronics&#10;Product 2, 200, 25, SKU002, Accessories"
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Format: Name, Price, Stock, SKU (optional), Category (optional)
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkImport(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkImport} disabled={importing || !bulkData.trim()}>
                {importing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                Import Products
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update the product details below' : 'Fill in the product details to add it to your inventory'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Wireless Mouse"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU / Barcode</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm(f => ({ ...f, sku: e.target.value }))}
                  placeholder="SKU123"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={form.category} 
                  onValueChange={(v) => setForm(f => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select or type" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Clothing">Clothing</SelectItem>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Stock Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm(f => ({ ...f, stock: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Product description (optional)"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading || !form.name.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {editingProduct ? 'Update' : 'Add Product'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
