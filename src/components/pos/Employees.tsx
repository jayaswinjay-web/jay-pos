import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Shield, UserCheck, UserX } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { loadData, saveData, User } from '@/lib/store';

export function Employees() {
  const [employees, setEmployees] = useState<User[]>(() => loadData().users);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'Cashier' as 'Admin' | 'Cashier' | 'Manager',
    active: true
  });

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormData({ username: '', password: '', name: '', role: 'Cashier', active: true });
    setShowModal(true);
  };

  const openEditModal = (employee: User) => {
    setEditingEmployee(employee);
    setFormData({
      username: employee.username,
      password: employee.password,
      name: employee.name,
      role: employee.role,
      active: employee.active
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!formData.username || !formData.password || !formData.name) {
      toast.error('Please fill in all fields');
      return;
    }

    const data = loadData();
    
    if (editingEmployee) {
      const updated = data.users.map(u => 
        u.id === editingEmployee.id 
          ? { ...u, ...formData }
          : u
      );
      data.users = updated;
      setEmployees(updated);
      toast.success('Employee updated successfully!');
    } else {
      // Check if username exists
      if (data.users.some(u => u.username === formData.username)) {
        toast.error('Username already exists!');
        return;
      }
      
      const newEmployee: User = {
        id: Date.now(),
        ...formData
      };
      data.users = [...data.users, newEmployee];
      setEmployees(data.users);
      toast.success('Employee added successfully!');
    }
    
    saveData(data);
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      const data = loadData();
      data.users = data.users.filter(u => u.id !== id);
      saveData(data);
      setEmployees(data.users);
      toast.success('Employee deleted successfully!');
    }
  };

  const toggleStatus = (id: number) => {
    const data = loadData();
    data.users = data.users.map(u => 
      u.id === id ? { ...u, active: !u.active } : u
    );
    saveData(data);
    setEmployees(data.users);
    toast.success('Employee status updated!');
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-primary/20 text-primary';
      case 'Manager':
        return 'bg-warning/20 text-warning';
      default:
        return 'bg-success/20 text-success';
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Users className="w-7 h-7 text-primary" />
            Employee Management
          </h2>
          <p className="text-muted-foreground mt-1">{employees.length} employees registered</p>
        </div>
        <button onClick={openAddModal} className="pos-btn-primary">
          <Plus className="w-5 h-5" />
          Add Employee
        </button>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(employee => (
          <div key={employee.id} className="pos-card p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  employee.active ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <span className="text-lg font-bold text-primary">
                    {employee.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{employee.name}</h3>
                  <p className="text-sm text-muted-foreground">@{employee.username}</p>
                </div>
              </div>
              <span className={`pos-badge ${getRoleBadge(employee.role)}`}>
                <Shield className="w-3 h-3 mr-1" />
                {employee.role}
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                onClick={() => toggleStatus(employee.id)}
                className={`pos-btn-ghost text-sm ${employee.active ? 'text-success' : 'text-destructive'}`}
              >
                {employee.active ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Active
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4" />
                    Inactive
                  </>
                )}
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(employee)}
                  className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(employee.id)}
                  className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="pos-input"
                placeholder="Enter full name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="pos-input"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="pos-input"
                  placeholder="Enter password"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                  className="pos-input"
                >
                  <option value="Cashier">Cashier</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select
                  value={formData.active ? 'active' : 'inactive'}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.value === 'active' }))}
                  className="pos-input"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowModal(false)} className="pos-btn-outline flex-1">
                Cancel
              </button>
              <button onClick={handleSubmit} className="pos-btn-primary flex-1">
                {editingEmployee ? 'Update Employee' : 'Add Employee'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
