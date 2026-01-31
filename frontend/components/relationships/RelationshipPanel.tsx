'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface RelationshipFormData {
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
}

interface GraphNode {
  id: number;
  labels: string[];
  properties: Record<string, unknown>;
}

interface GraphData {
  nodes: GraphNode[];
  relationships: Array<{
    id: number;
    type: string;
    startNode: number;
    endNode: number;
  }>;
}

export default function RelationshipPanel() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<RelationshipFormData>({
    order_id: 0,
    product_id: 0,
    quantity: 1,
    price: 0,
  });

  const queryClient = useQueryClient();

  const { data: graphData } = useQuery<GraphData>({
    queryKey: ['graph'],
    queryFn: async () => {
      const res = await fetch('/api/graph');
      return res.json();
    },
  });

  const orders = graphData?.nodes.filter(n => n.labels.includes('Order')) || [];
  const products = graphData?.nodes.filter(n => n.labels.includes('Product')) || [];

  const createRelMutation = useMutation({
    mutationFn: async (data: RelationshipFormData) => {
      const response = await fetch('/api/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create relationship');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph'] });
      setIsFormOpen(false);
      setFormData({ order_id: 0, product_id: 0, quantity: 1, price: 0 });
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
                onChange={(e) => setFormData({ ...formData, order_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value={0}>Select Order...</option>
                {orders.map(order => (
                  <option key={order.id} value={order.properties.id as number}>
                    Order #{String(order.properties.id)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Product</label>
              <select
                data-testid="rel-product"
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value={0}>Select Product...</option>
                {products.map(product => (
                  <option key={product.id} value={product.properties.id as number}>
                    {product.properties.name as string || `Product #${product.properties.id}`}
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
