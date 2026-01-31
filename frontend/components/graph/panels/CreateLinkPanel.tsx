interface Props {
  fromLabel: string;
  toLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  creating: boolean;
}

export function CreateLinkPanel({ fromLabel, toLabel, onConfirm, onCancel, creating }: Props) {
  return (
    <div className="w-80 bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold text-white">Create Link</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-white">✕</button>
      </div>

      <div className="space-y-4">
        <div className="p-3 bg-gray-800 rounded-lg">
          <div className="text-sm text-blue-400 font-medium">From</div>
          <div className="text-white">{fromLabel}</div>
        </div>
        
        <div className="flex justify-center">
          <span className="text-gray-500">↓</span>
        </div>
        
        <div className="p-3 bg-gray-800 rounded-lg">
          <div className="text-sm text-green-400 font-medium">To</div>
          <div className="text-white">{toLabel}</div>
        </div>

        <button
          data-testid="confirm-link-btn"
          onClick={onConfirm}
          disabled={creating}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600"
        >
          {creating ? 'Creating...' : 'Create Link'}
        </button>
        
        <button
          onClick={onCancel}
          className="w-full px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
