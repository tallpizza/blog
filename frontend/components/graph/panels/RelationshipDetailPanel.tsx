'use client';

import { useState, useEffect } from 'react';
import { Relationship } from '../types';
import { BottomSheet } from './BottomSheet';
import { ResizablePanel } from './ResizablePanel';
import { api } from '@/lib/api-client';

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
      await api.updateRelationship(relationship.id, editedProperties);
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
        <div className="text-sm font-medium text-muted-foreground">Type</div>
        <div className="text-lg text-foreground">{relationship.type}</div>
      </div>

      <div>
        <div className="text-sm font-medium text-muted-foreground">From Node</div>
        <div className="text-foreground text-sm truncate">{relationship.startNode}</div>
      </div>

      <div>
        <div className="text-sm font-medium text-muted-foreground">To Node</div>
        <div className="text-foreground text-sm truncate">{relationship.endNode}</div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium text-muted-foreground">Properties</div>
          {!isEditing && (
            <button
              data-testid="edit-rel-btn"
              onClick={() => setIsEditing(true)}
              className="text-xs px-2 py-1 bg-accent hover:bg-muted text-foreground rounded"
            >
              Edit
            </button>
          )}
        </div>

        <div className="space-y-2">
          {Object.entries(editedProperties).map(([key, value]) => (
            <div key={key} className="border-b border-border pb-2">
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">{key}</div>
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
                  value={typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}
                  onChange={(e) => handlePropertyChange(key, e.target.value)}
                  step={typeof relationship.properties[key] === 'number' ? '0.01' : undefined}
                  className="w-full px-2 py-1 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:border-foreground"
                />
              ) : (
                <div className="text-sm text-foreground">{String(value)}</div>
              )}
            </div>
          ))}

          {Object.keys(editedProperties).length === 0 && !isEditing && (
            <div className="text-muted-foreground text-sm italic">No properties</div>
          )}

          {isEditing && (
            <div className="border-t border-border pt-3">
              <div className="text-xs text-muted-foreground mb-2">Add Property</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Key"
                  value={newPropKey}
                  onChange={(e) => setNewPropKey(e.target.value)}
                  className="flex-1 px-2 py-1 bg-input border border-border rounded text-sm text-foreground"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={newPropValue}
                  onChange={(e) => setNewPropValue(e.target.value)}
                  className="flex-1 px-2 py-1 bg-input border border-border rounded text-sm text-foreground"
                />
                <button
                  onClick={handleAddProperty}
                  className="px-2 py-1 bg-accent hover:bg-muted text-foreground rounded text-sm"
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
            className="flex-1 px-3 py-2 bg-foreground hover:bg-foreground/90 disabled:bg-muted text-background text-sm rounded"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="flex-1 px-3 py-2 bg-accent hover:bg-muted text-foreground text-sm rounded"
          >
            Cancel
          </button>
        </div>
      )}

      <button
        data-testid="delete-rel-btn"
        onClick={onDelete}
        disabled={deleting || isEditing}
        className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-muted disabled:text-muted-foreground"
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
    <ResizablePanel
      storageKey="relationship-detail"
      defaultWidth={320}
      minWidth={280}
      maxWidth={600}
    >
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold text-foreground">Relationship</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
      </div>
      {content}
    </ResizablePanel>
  );
}
