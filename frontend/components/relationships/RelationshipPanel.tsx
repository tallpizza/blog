'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, GraphData } from '@/lib/api-client';

interface RelationshipFormData {
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
}

export default function RelationshipPanel() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<RelationshipFormData>({
    order_id: '',
    product_id: '',
    quantity: 1,
    price: 0,
  });

  const queryClient = useQueryClient();

  const { data: graphData } = useQuery<GraphData>({
    queryKey: ['graph'],
    queryFn: () => api.getGraph(),
  });

  const orders = graphData?.nodes.filter(n => n.labels.includes('Order')) || [];
  const products = graphData?.nodes.filter(n => n.labels.includes('Product')) || [];

  const createRelMutation = useMutation({
    mutationFn: async (data: RelationshipFormData) => {
      return api.createRelationship({
        startNodeId: data.order_id,
        endNodeId: data.product_id,
        type: 'CONTAINS',
        properties: { quantity: data.quantity, price: data.price },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph'] });
      setIsFormOpen(false);
      setFormData({ order_id: '', product_id: '', quantity: 1, price: 0 });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.order_id && formData.product_id) {
      createRelMutation.mutate(formData);
    }
  };

  return (
    <div className="absolute top-4 left-4 z-10">
      {!isFormOpen ? (
        <button
          data-testid="add-rel-btn"
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700"
        >
          + Add Link
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl p-6 w-80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Create Link</h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Links an Order to a Product (CONTAINS relationship)
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Order</label>
              <select
                data-testid="rel-order"
                value={formData.order_id}
                onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select Order...</option>
                {orders.map(order => (
                  <option key={order.id} value={order.id}>
                    Order #{order.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Product</label>
              <select
                data-testid="rel-product"
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select Product...</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {String(product.properties.name || product.properties.text || `Product #${product.id}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                data-testid="rel-quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input
                data-testid="rel-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <button
              data-testid="save-rel-btn"
              type="submit"
              disabled={createRelMutation.isPending || !formData.order_id || !formData.product_id}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
            >
              {createRelMutation.isPending ? 'Creating...' : 'Create Link'}
            </button>

            {createRelMutation.isError && (
              <div className="text-red-600 text-sm">
                Error: {createRelMutation.error.message}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
