'use client';

import { useState } from 'react';
import { BottomSheet } from './BottomSheet';

const RELATIONSHIP_TYPES = ['RELATES_TO', 'BELONGS_TO', 'CONTAINS', 'PLACED', 'LINKS_TO'];

interface Props {
  fromLabel: string;
  toLabel: string;
  onConfirm: (relType: string) => void;
  onCancel: () => void;
  creating: boolean;
  isMobile?: boolean;
}

export function CreateLinkPanel({ fromLabel, toLabel, onConfirm, onCancel, creating, isMobile }: Props) {
  const [relType, setRelType] = useState('RELATES_TO');

  const content = (
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

      <div>
        <label className="text-sm text-gray-400 block mb-2">Relationship Type</label>
        <select
          value={relType}
          onChange={(e) => setRelType(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
          {RELATIONSHIP_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <button
        data-testid="confirm-link-btn"
        onClick={() => onConfirm(relType)}
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
  );

  if (isMobile) {
    return (
      <BottomSheet title="Create Link" onClose={onCancel}>
        {content}
      </BottomSheet>
    );
  }

  return (
    <div className="fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto z-40">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold text-white">Create Link</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-white text-xl">✕</button>
      </div>
      {content}
    </div>
  );
}
