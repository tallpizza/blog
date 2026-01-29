'use client';

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">CDC Event Viewer</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Event Streams</h2>
          <div data-testid="event-list" className="space-y-4">
            <div data-testid="event-item" className="border-l-4 border-blue-500 pl-4 py-2">
              <h3 className="font-medium">PostgreSQL CDC Events</h3>
              <p className="text-sm text-gray-600">
                Topics: pg-cdc.public.categories, pg-cdc.public.products, 
                pg-cdc.public.customers, pg-cdc.public.orders, pg-cdc.public.order_items
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Status: Active (Debezium connector running)
              </p>
            </div>
            
            <div data-testid="event-item" className="border-l-4 border-gray-400 pl-4 py-2">
              <h3 className="font-medium">Neo4j CDC Events</h3>
              <p className="text-sm text-gray-600">
                Topic: neo4j-cdc-events
              </p>
              <p className="text-sm text-red-500 mt-1">
                Status: Blocked (Neo4j Connector 5.1.19 incompatible with Neo4j 5.26.20)
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Redpanda Console</h2>
          <p className="text-gray-600 mb-4">
            View real-time CDC events, topic details, and consumer groups in Redpanda Console.
          </p>
          <a
            href="http://localhost:8080"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Open Redpanda Console →
          </a>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">Note</h3>
          <p className="text-sm text-yellow-700">
            This is a simplified CDC event viewer. For full event inspection, filtering, and replay capabilities, 
            use Redpanda Console at <code className="bg-yellow-100 px-1 rounded">http://localhost:8080</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
