'use client';

import dynamic from 'next/dynamic';

const GraphViewer = dynamic(() => import('@/components/graph/GraphViewer'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen">Loading graph...</div>,
});

export default function Home() {
  return <GraphViewer />;
}
