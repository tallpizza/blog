'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [graphData, setGraphData] = useState(null);
  
  useEffect(() => {
    fetch('/api/graph')
      .then(res => res.json())
      .then(data => setGraphData(data))
      .catch(err => console.error(err));
  }, []);
  
  if (!graphData) return <div>Loading...</div>;
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(graphData, null, 2)}
      </pre>
    </div>
  );
}
