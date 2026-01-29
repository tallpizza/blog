'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface NodeFormData {
  type: 'Product' | 'Category' | 'Customer' | 'Order';
  name: string;
  price?: number;
  category_id?: number;
  email?: string;
  total?: number;
}

export default function NodePanel() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<NodeFormData>({
    type: 'Product',
    name: '',
  });

  const queryClient = useQueryClient();

  const createNodeMutation = useMutation({
    mutationFn: async (data: NodeFormData) => {
      const response = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create node');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph'] });
      setIsFormOpen(false);
      setFormData({ type: 'Product', name: '' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createNodeMutation.mutate(formData);
  };

  return (
    <div className="absolute top-4 right-4 z-10">
      {!isFormOpen ? (
        <button
          data-testid="add-node-btn"
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700"
        >
          + Add Node
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl p-6 w-80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Create Node</h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                data-testid="node-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="Product">Product</option>
                <option value="Category">Category</option>
                <option value="Customer">Customer</option>
                <option value="Order">Order</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                data-testid="node-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            {formData.type === 'Product' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    data-testid="node-price"
                    type="number"
                    step="0.01"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category ID</label>
                  <input
                    type="number"
                    value={formData.category_id || ''}
                    onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </>
            )}

            {formData.type === 'Customer' && (
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            )}

            {formData.type === 'Order' && (
              <div>
                <label className="block text-sm font-medium mb-1">Total</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total || ''}
                  onChange={(e) => setFormData({ ...formData, total: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            )}

            <button
              data-testid="save-node-btn"
              type="submit"
              disabled={createNodeMutation.isPending}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {createNodeMutation.isPending ? 'Creating...' : 'Create Node'}
            </button>

            {createNodeMutation.isError && (
              <div className="text-red-600 text-sm">
                Error: {createNodeMutation.error.message}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
