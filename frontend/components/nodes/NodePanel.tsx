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
      className="px-4 py-2 bg-foreground text-background rounded-lg shadow-lg hover:bg-foreground/90 border border-border disabled:bg-muted disabled:text-muted-foreground"
    >
      {createNodeMutation.isPending ? 'Creating...' : '+ Add Node'}
    </button>
  );
}
