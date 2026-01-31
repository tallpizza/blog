'use client';

import { useState, useEffect } from 'react';
import { Node } from '../types';
import { LABEL_COLORS } from '../constants';
import { BottomSheet } from './BottomSheet';

const AVAILABLE_LABELS = ['Product', 'Category', 'Customer', 'Order'];

interface Props {
  node: Node;
  onClose: () => void;
  onUpdate?: () => void;
  onDelete?: () => void;
  isMobile?: boolean;
}

export function NodeDetailPanel({ node, onClose, onUpdate, onDelete, isMobile }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProperties, setEditedProperties] = useState<Record<string, any>>({});
  const [newLabel, setNewLabel] = useState('');
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropValue, setNewPropValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEditedProperties({ ...node.properties });
    setIsEditing(false);
    setNewLabel('');
    setNewPropKey('');
    setNewPropValue('');
    setError(null);
  }, [node]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const body: any = { ...editedProperties };
      if (newLabel) {
        body.addLabel = newLabel;
      }
      
      const response = await fetch(`/api/nodes/${encodeURIComponent(node.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update node');
      }
      setIsEditing(false);
      setNewLabel('');
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this node?')) return;
    
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/nodes/${encodeURIComponent(node.id)}`, {
        method: 'DELETE',
      });
      if (!response.ok && response.status !== 204) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete node');
      }
      onDelete?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeleting(false);
    }
  };

  const handlePropertyChange = (key: string, value: string) => {
    const originalValue = node.properties[key];
    let parsedValue: any = value;
    
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

  const handleCancel = () => {
    setEditedProperties({ ...node.properties });
    setIsEditing(false);
    setNewLabel('');
    setError(null);
  };

  const availableLabelsToAdd = AVAILABLE_LABELS.filter(l => !node.labels.includes(l));

  const content = (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-medium text-gray-400 mb-2">Labels</div>
        <div className="flex flex-wrap gap-2">
          {node.labels.length > 0 ? (
            node.labels.map((label) => (
              <span
                key={label}
                className="px-2 py-1 rounded text-sm text-white"
                style={{ backgroundColor: LABEL_COLORS[label] || '#6B7280' }}
              >
                {label}
              </span>
            ))
          ) : (
            <span className="text-gray-500 text-sm italic">No labels</span>
          )}
        </div>
        
        {isEditing && availableLabelsToAdd.length > 0 && (
          <div className="mt-2">
            <select
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
            >
              <option value="">Add label...</option>
              {availableLabelsToAdd.map(label => (
                <option key={label} value={label}>{label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium text-gray-400">Properties</div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Edit
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          {Object.entries(editedProperties).map(([key, value]) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-1">{key}</label>
              {isEditing ? (
                <input
                  type={typeof node.properties[key] === 'number' ? 'number' : 'text'}
                  value={value ?? ''}
                  onChange={(e) => handlePropertyChange(key, e.target.value)}
                  step={typeof node.properties[key] === 'number' ? '0.01' : undefined}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                />
              ) : (
                <div className="text-sm text-gray-200 bg-gray-800 px-2 py-1 rounded">
                  {String(value)}
                </div>
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

      <div className="pt-4 border-t border-gray-800">
        <button
          onClick={handleDelete}
          disabled={deleting || isEditing}
          className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:text-red-400 text-white text-sm rounded"
        >
          {deleting ? 'Deleting...' : 'Delete Node'}
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet title="Node Details" onClose={onClose}>
        {content}
      </BottomSheet>
    );
  }

  return (
    <div className="fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto z-40">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold text-white">Node Details</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
      </div>
      {content}
    </div>
  );
}
