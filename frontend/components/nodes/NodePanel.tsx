'use client';

import { useMutation } from '@tanstack/react-query';
import { Node } from '@/components/graph/types';
import { api } from '@/lib/api-client';

interface NodePanelProps {
  onNodeCreated?: (node: Node) => void;
}

export default function NodePanel({ onNodeCreated }: NodePanelProps) {
  const createNodeMutation = useMutation({
    mutationFn: () => api.createNode({ text: '' }),
    onSuccess: (data) => {
      onNodeCreated?.(data as Node);
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
