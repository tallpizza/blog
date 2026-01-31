'use client';

import { useState, useEffect } from 'react';
import { Relationship } from '../types';
import { BottomSheet } from './BottomSheet';

interface Props {
  relationship: Relationship;
  onClose: () => void;
  onDelete: () => void;
  onUpdate?: () => void;
  deleting: boolean;
  isMobile?: boolean;
}

export function RelationshipDetailPanel({ 
  relationship, 
  onClose, 
  onDelete, 
  onUpdate,
  deleting, 
  isMobile 
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProperties, setEditedProperties] = useState<Record<string, unknown>>({});
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropValue, setNewPropValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEditedProperties({ ...relationship.properties });
    setIsEditing(false);
    setNewPropKey('');
    setNewPropValue('');
    setError(null);
  }, [relationship]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/relationships/${encodeURIComponent(relationship.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties: editedProperties }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update relationship');
      }
      setIsEditing(false);
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const handlePropertyChange = (key: string, value: string) => {
    const originalValue = relationship.properties[key];
    let parsedValue: string | number = value;
    
    if (typeof originalValue === 'number') {
      parsedValue = value === '' ? 0 : parseFloat(value);
      if (isNaN(parsedValue)) parsedValue = 0;
    }
    
    setEditedProperties(prev => ({ ...prev, [key]: parsedValue }));
  };

  const handleAddProperty = () => {
    if (!newPropKey.trim()) return;
    setEditedProperties(prev => ({ ...prev, [newPropKey]: newPropValue }));
    setNewPropKey('');
    setNewPropValue('');
  };

  const handleRemoveProperty = (key: string) => {
    setEditedProperties(prev => {
      const newProps = { ...prev };
      delete newProps[key];
      return newProps;
    });
  };

  const handleCancel = () => {
    setEditedProperties({ ...relationship.properties });
    setIsEditing(false);
    setError(null);
  };

  const content = (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-medium text-gray-400">Type</div>
        <div className="text-lg text-white">{relationship.type}</div>
      </div>

      <div>
        <div className="text-sm font-medium text-gray-400">From Node</div>
        <div className="text-gray-200 text-sm truncate">{relationship.startNode}</div>
      </div>

      <div>
        <div className="text-sm font-medium text-gray-400">To Node</div>
        <div className="text-gray-200 text-sm truncate">{relationship.endNode}</div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium text-gray-400">Properties</div>
          {!isEditing && (
            <button
              data-testid="edit-rel-btn"
              onClick={() => setIsEditing(true)}
              className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Edit
            </button>
          )}
        </div>

        <div className="space-y-2">
          {Object.entries(editedProperties).map(([key, value]) => (
            <div key={key} className="border-b border-gray-800 pb-2">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">{key}</div>
                {isEditing && (
                  <button
                    onClick={() => handleRemoveProperty(key)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                )}
              </div>
              {isEditing ? (
                <input
                  type={typeof relationship.properties[key] === 'number' ? 'number' : 'text'}
                  value={value ?? ''}
                  onChange={(e) => handlePropertyChange(key, e.target.value)}
                  step={typeof relationship.properties[key] === 'number' ? '0.01' : undefined}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                />
              ) : (
                <div className="text-sm text-gray-200">{String(value)}</div>
              )}
            </div>
          ))}

          {Object.keys(editedProperties).length === 0 && !isEditing && (
            <div className="text-gray-500 text-sm italic">No properties</div>
          )}

          {isEditing && (
            <div className="border-t border-gray-700 pt-3">
              <div className="text-xs text-gray-500 mb-2">Add Property</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Key"
                  value={newPropKey}
                  onChange={(e) => setNewPropKey(e.target.value)}
                  className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={newPropValue}
                  onChange={(e) => setNewPropValue(e.target.value)}
                  className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                />
                <button
                  onClick={handleAddProperty}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="px-3 py-2 bg-red-900/50 text-red-300 text-sm rounded">
          {error}
        </div>
      )}

      {isEditing && (
        <div className="flex gap-2">
          <button
            data-testid="save-rel-btn"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white text-sm rounded"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
          >
            Cancel
          </button>
        </div>
      )}

      <button
        data-testid="delete-rel-btn"
        onClick={onDelete}
        disabled={deleting || isEditing}
        className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-600"
      >
        {deleting ? 'Deleting...' : 'Delete Relationship'}
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet title="Relationship" onClose={onClose}>
        {content}
      </BottomSheet>
    );
  }

  return (
    <div className="fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto z-40">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold text-white">Relationship</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
      </div>
      {content}
    </div>
  );
}
