'use client';

import dynamic from 'next/dynamic';
import QueryProvider from '@/components/providers/QueryProvider';
import NodePanel from '@/components/nodes/NodePanel';

const GraphViewer = dynamic(() => import('@/components/graph/GraphViewer'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen">Loading graph...</div>,
});

export default function Home() {
  return (
    <QueryProvider>
      <div className="relative">
        <GraphViewer />
        <NodePanel />
      </div>
    </QueryProvider>
  );
}
