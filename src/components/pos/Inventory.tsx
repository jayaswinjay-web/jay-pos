import React, { useState } from 'react';
import { usePOS } from '@/context/POSContext';
import { Search, Plus, Edit2, Trash2, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export function Inventory() {
  const { products, addProduct, updateProduct, deleteProduct } = usePOS();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<typeof products[0] | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    sku: ''
  });

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', price: '', stock: '', category: '', sku: '' });
    setShowModal(true);
  };

  const openEditModal = (product: typeof products[0]) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      sku: product.sku
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.price || !formData.stock || !formData.category || !formData.sku) {
      toast.error('Please fill in all fields');
      return;
    }

    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      category: formData.category,
      sku: formData.sku
    };

    if (editingProduct) {
      updateProduct({ ...productData, id: editingProduct.id });
    } else {
      addProduct(productData);
    }

    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Package className="w-7 h-7 text-primary" />
            Inventory Management
          </h2>
          <p className="text-muted-foreground mt-1">{products.length} products in stock</p>
        </div>
        <button onClick={openAddModal} className="pos-btn-primary">
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, SKU, or category..."
          className="pos-input pl-12"
        />
      </div>

      {/* Products Table */}
      <div className="pos-card overflow-hidden">
        <table className="pos-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.id}>
                <td className="font-mono text-sm">{product.sku}</td>
                <td className="font-medium text-foreground">{product.name}</td>
                <td>{product.category}</td>
                <td className="font-semibold text-primary">₹{product.price.toLocaleString()}</td>
                <td>{product.stock}</td>
                <td>
                  <span className={`pos-badge ${
                    product.stock > 10 ? 'pos-badge-success' : 
                    product.stock > 0 ? 'pos-badge-warning' : 'pos-badge-danger'
                  }`}>
                    {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="pos-input"
                placeholder="Enter product name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  className="pos-input"
                  placeholder="e.g., PRD001"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="pos-input"
                  placeholder="e.g., Electronics"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Price (₹)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="pos-input"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Stock Quantity</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  className="pos-input"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowModal(false)} className="pos-btn-outline flex-1">
                Cancel
              </button>
              <button onClick={handleSubmit} className="pos-btn-primary flex-1">
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
