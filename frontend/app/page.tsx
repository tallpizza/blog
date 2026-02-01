'use client';

import dynamic from 'next/dynamic';
import QueryProvider from '@/components/providers/QueryProvider';

const GraphViewer = dynamic(() => import('@/components/graph/GraphViewer'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen bg-background text-foreground">Loading graph...</div>,
});

export default function Home() {
  return (
    <QueryProvider>
      <GraphViewer />
    </QueryProvider>
  );
}
