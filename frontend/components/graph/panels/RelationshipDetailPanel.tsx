import { Relationship } from '../types';

interface Props {
  relationship: Relationship;
  onClose: () => void;
  onDelete: () => void;
  deleting: boolean;
}

export function RelationshipDetailPanel({ relationship, onClose, onDelete, deleting }: Props) {
  return (
    <div className="w-80 bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold text-white">Relationship</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-sm font-medium text-gray-400">Type</div>
          <div className="text-lg text-white">{relationship.type}</div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-400">From Node</div>
          <div className="text-gray-200">{relationship.startNode}</div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-400">To Node</div>
          <div className="text-gray-200">{relationship.endNode}</div>
        </div>

        {Object.keys(relationship.properties).length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-400 mb-2">Properties</div>
            <div className="space-y-2">
              {Object.entries(relationship.properties).map(([key, value]) => (
                <div key={key} className="border-b border-gray-800 pb-2">
                  <div className="text-xs text-gray-500">{key}</div>
                  <div className="text-sm text-gray-200">{String(value)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          data-testid="delete-rel-btn"
          onClick={onDelete}
          disabled={deleting}
          className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-600"
        >
          {deleting ? 'Deleting...' : 'Delete Relationship'}
        </button>
      </div>
    </div>
  );
}
