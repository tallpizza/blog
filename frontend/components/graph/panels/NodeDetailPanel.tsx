import { Node } from '../types';
import { LABEL_COLORS } from '../constants';

interface Props {
  node: Node;
  onClose: () => void;
}

export function NodeDetailPanel({ node, onClose }: Props) {
  return (
    <div className="w-80 bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold text-white">Node Details</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-sm font-medium text-gray-400">ID</div>
          <div className="text-lg text-white">{node.id}</div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-400">Labels</div>
          <div className="flex gap-2 mt-1">
            {node.labels.map((label) => (
              <span
                key={label}
                className="px-2 py-1 rounded text-sm text-white"
                style={{ backgroundColor: LABEL_COLORS[label] || '#6B7280' }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-400 mb-2">Properties</div>
          <div className="space-y-2">
            {Object.entries(node.properties).map(([key, value]) => (
              <div key={key} className="border-b border-gray-800 pb-2">
                <div className="text-xs text-gray-500">{key}</div>
                <div className="text-sm text-gray-200">{String(value)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
