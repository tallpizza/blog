'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

interface NodePanelProps {
  onNodeCreated?: (nodeId: string) => void;
}

export default function NodePanel({ onNodeCreated }: NodePanelProps) {
  const queryClient = useQueryClient();

  const createNodeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Node' }),
      });
      if (!response.ok) throw new Error('Failed to create node');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['graph'] });
      onNodeCreated?.(data.id);
    },
  });

  return (
    <button
      data-testid="add-node-btn"
      onClick={() => createNodeMutation.mutate()}
      disabled={createNodeMutation.isPending}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 border border-blue-500/40 disabled:bg-blue-400"
    >
      {createNodeMutation.isPending ? 'Creating...' : '+ Add Node'}
    </button>
  );
}
