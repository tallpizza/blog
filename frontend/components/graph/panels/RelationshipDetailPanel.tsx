'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Relationship } from '../types';
import { BottomSheet } from './BottomSheet';
import { ResizablePanel } from './ResizablePanel';
import { api } from '@/lib/api-client';

const ObsidianEditor = dynamic(
  () => import('./ObsidianEditor').then((mod) => mod.ObsidianEditor),
  { ssr: false }
);

type ObsidianEditorRef = { setValue: (value: string) => void };

interface Props {
  relationship: Relationship;
  onClose: () => void;
  onDelete: () => void;
  onUpdate?: (updatedRel?: Relationship) => void;
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
  const [editedText, setEditedText] = useState<string>('');
  const [editedProperties, setEditedProperties] = useState<Record<string, unknown>>({});
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropValue, setNewPropValue] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);
  const lastRelIdRef = useRef<string | null>(null);
  const originalTextRef = useRef<string>('');
  const originalPropertiesRef = useRef<Record<string, unknown>>({});
  const editorRef = useRef<ObsidianEditorRef>(null);

  useEffect(() => {
    if (lastRelIdRef.current === relationship.id) return;

    lastRelIdRef.current = relationship.id;
    const { text, ...otherProps } = relationship.properties as { text?: string; [key: string]: unknown };
    const textValue = typeof text === 'string' ? text : '';

    setEditedText(textValue);
    setEditedProperties(otherProps);
    setNewPropKey('');
    setNewPropValue('');
    setError(null);
    setSaveStatus('idle');
    setShowAdvanced(false);
    initialLoadRef.current = true;

    originalTextRef.current = textValue;
    originalPropertiesRef.current = otherProps;

    editorRef.current?.setValue(textValue);
  }, [relationship]);

  const hasChanges = useCallback(() => {
    if (editedText !== originalTextRef.current) return true;

    const origKeys = Object.keys(originalPropertiesRef.current);
    const editKeys = Object.keys(editedProperties);
    if (origKeys.length !== editKeys.length) return true;

    for (const key of editKeys) {
      if (editedProperties[key] !== originalPropertiesRef.current[key]) return true;
    }
    return false;
  }, [editedText, editedProperties]);

  const doSave = useCallback(async () => {
    if (!hasChanges()) {
      setSaveStatus('idle');
      return;
    }

    setSaveStatus('saving');
    setError(null);
    try {
      const properties: Record<string, unknown> = {
        ...editedProperties,
        text: editedText,
      };

      await api.updateRelationship(relationship.id, properties);
      setSaveStatus('saved');

      originalTextRef.current = editedText;
      originalPropertiesRef.current = { ...editedProperties };

      const updatedRel: Relationship = {
        ...relationship,
        properties: { ...editedProperties, text: editedText },
      };
      onUpdate?.(updatedRel);

      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSaveStatus('error');
    }
  }, [editedText, editedProperties, relationship, onUpdate, hasChanges]);

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('idle');
    saveTimeoutRef.current = setTimeout(() => {
      doSave();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editedText, editedProperties, doSave]);

  const handlePropertyChange = (key: string, value: string) => {
    const originalValue = relationship.properties[key];
    let parsedValue: unknown = value;

    if (typeof originalValue === 'number') {
      parsedValue = value === '' ? 0 : parseFloat(value);
      if (isNaN(parsedValue as number)) parsedValue = 0;
    }

    setEditedProperties((prev) => ({ ...prev, [key]: parsedValue }));
  };

  const handleAddProperty = () => {
    if (!newPropKey.trim()) return;
    setEditedProperties((prev) => ({ ...prev, [newPropKey]: newPropValue }));
    setNewPropKey('');
    setNewPropValue('');
  };

  const handleRemoveProperty = (key: string) => {
    if (!confirm(`Delete property "${key}"?`)) return;
    setEditedProperties((prev) => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  const content = (
    <div className="space-y-4">
      <div>
        <ObsidianEditor
          innerRef={editorRef}
          value={editedText}
          onChange={setEditedText}
          minHeight="150px"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded text-xs bg-accent text-foreground">
          {relationship.type}
        </span>
      </div>

      {error && (
        <div className="px-3 py-2 bg-red-900/50 text-red-300 text-sm rounded">{error}</div>
      )}

      <div className="border-t border-border pt-3">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          More options
        </button>

        <div
          className={`grid transition-all duration-200 ease-in-out ${
            showAdvanced ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-4">
              {Object.keys(editedProperties).length > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Properties</div>
                  <div className="space-y-3">
                    {Object.entries(editedProperties).map(([key, value]) => (
                      <div key={key}>
                        <label className="text-xs text-muted-foreground block mb-1">{key}</label>
                        <div className="flex gap-2">
                          <input
                            type={typeof relationship.properties[key] === 'number' ? 'number' : 'text'}
                            value={String(value ?? '')}
                            onChange={(e) => handlePropertyChange(key, e.target.value)}
                            step={typeof relationship.properties[key] === 'number' ? '0.01' : undefined}
                            className="flex-1 px-2 py-1 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:border-foreground"
                          />
                          <button
                            onClick={() => handleRemoveProperty(key)}
                            className="px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded text-sm transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
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

              <div className="pt-2">
                <button
                  data-testid="delete-rel-btn"
                  onClick={onDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded text-sm transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const statusIndicator = (
    <div className="flex items-center gap-2">
      {saveStatus === 'saving' && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Saving
        </span>
      )}
      {saveStatus === 'saved' && (
        <span className="text-xs text-foreground flex items-center gap-1">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Saved
        </span>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet title="Edit Link" onClose={onClose}>
        {content}
      </BottomSheet>
    );
  }

  return (
    <ResizablePanel
      storageKey="relationship-detail"
      defaultWidth={384}
      minWidth={320}
      maxWidth={700}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">Edit</h2>
          {statusIndicator}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
      </div>
      {content}
    </ResizablePanel>
  );
}
