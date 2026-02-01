'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Node as GraphNode } from '../types';
import { LABEL_COLORS, DEFAULT_LABELS } from '../constants';
import { BottomSheet } from './BottomSheet';
import { api } from '@/lib/api-client';

const ObsidianEditor = dynamic(
  () => import('./ObsidianEditor').then((mod) => mod.ObsidianEditor),
  { ssr: false }
);

interface Props {
  node: GraphNode;
  onClose: () => void;
  onUpdate?: (updatedNode?: GraphNode) => void;
  onDelete?: () => void;
  isMobile?: boolean;
}

interface LabelComboboxProps {
  value: string;
  onChange: (value: string) => void;
  existingLabels: string[];
  placeholder?: string;
}

function LabelCombobox({ value, onChange, existingLabels, placeholder }: LabelComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as HTMLElement)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLabels = useMemo(() => {
    const searchTerm = inputValue.toLowerCase();
    return DEFAULT_LABELS.filter(
      (label) =>
        label.toLowerCase().includes(searchTerm) && !existingLabels.includes(label)
    );
  }, [inputValue, existingLabels]);

  const showCreateOption =
    inputValue.trim() &&
    !DEFAULT_LABELS.some((l) => l.toLowerCase() === inputValue.toLowerCase()) &&
    !existingLabels.some((l) => l.toLowerCase() === inputValue.toLowerCase());

  const handleSelect = (label: string) => {
    onChange(label);
    setInputValue('');
    setIsOpen(false);
  };

  const handleCreate = () => {
    const newLabel = inputValue.trim();
    if (newLabel) {
      onChange(newLabel);
      setInputValue('');
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder || 'Type to search or create...'}
        className="w-full px-3 py-2 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:border-foreground"
      />
      {isOpen && (filteredLabels.length > 0 || showCreateOption) && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded shadow-lg max-h-48 overflow-y-auto">
          {filteredLabels.map((label) => (
            <button
              key={label}
              onClick={() => handleSelect(label)}
              className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent flex items-center gap-2"
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: LABEL_COLORS[label] || '#6B7280' }}
              />
              {label}
            </button>
          ))}
          {showCreateOption && (
            <button
              onClick={handleCreate}
              className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent border-t border-border"
            >
              + Create &quot;{inputValue.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function NodeDetailPanel({ node, onClose, onUpdate, onDelete, isMobile }: Props) {
  const [editedText, setEditedText] = useState<string>('');
  const [editedProperties, setEditedProperties] = useState<Record<string, unknown>>({});
  const [newLabel, setNewLabel] = useState('');
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropValue, setNewPropValue] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    const { text, ...otherProps } = node.properties as { text?: string; [key: string]: unknown };
    setEditedText(typeof text === 'string' ? text : '');
    setEditedProperties(otherProps);
    setNewLabel('');
    setNewPropKey('');
    setNewPropValue('');
    setError(null);
    setSaveStatus('idle');
    initialLoadRef.current = true;
  }, [node]);

  const doSave = useCallback(async () => {
    setSaveStatus('saving');
    setError(null);
    try {
      const updateData: Record<string, unknown> = {
        ...editedProperties,
        text: editedText,
      };
      const labelToAdd = newLabel;
      if (labelToAdd) {
        updateData.addLabel = labelToAdd;
      }

      const result = await api.updateNode(node.id, updateData);
      setNewLabel('');
      setSaveStatus('saved');
      
      const updatedNode: GraphNode = {
        id: node.id,
        labels: labelToAdd ? [...node.labels, labelToAdd] : node.labels,
        properties: { ...editedProperties, text: editedText },
      };
      onUpdate?.(updatedNode);
      
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSaveStatus('error');
    }
  }, [editedText, editedProperties, newLabel, node.id, node.labels, onUpdate]);

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
  }, [editedText, editedProperties, newLabel, doSave]);

  const handleDelete = async () => {
    if (!confirm('Delete this node?')) return;

    setDeleting(true);
    setError(null);
    try {
      await api.deleteNode(node.id);
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

  const handleLabelSelect = (label: string) => {
    setNewLabel(label);
  };

  const content = (
    <div className="space-y-4">
      <div>
        <ObsidianEditor
          value={editedText}
          onChange={setEditedText}
          minHeight="200px"
        />
      </div>

      <div>
        <div className="text-sm font-medium text-muted-foreground mb-2">Labels</div>
        <div className="flex flex-wrap gap-2 mb-2">
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
            <span className="text-muted-foreground text-sm italic">No labels</span>
          )}
        </div>

        <LabelCombobox
          value={newLabel}
          onChange={handleLabelSelect}
          existingLabels={node.labels}
          placeholder="Add label..."
        />
        {newLabel && (
          <div className="mt-2 text-xs text-muted-foreground">
            Will add: <span className="text-foreground">{newLabel}</span>
          </div>
        )}
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
                        <input
                          type={typeof node.properties[key] === 'number' ? 'number' : 'text'}
                          value={String(value ?? '')}
                          onChange={(e) => handlePropertyChange(key, e.target.value)}
                          step={typeof node.properties[key] === 'number' ? '0.01' : undefined}
                          className="w-full px-2 py-1 bg-input border border-border rounded text-sm text-foreground focus:outline-none focus:border-foreground"
                        />
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
                  onClick={handleDelete}
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
      <BottomSheet title="Edit Node" onClose={onClose} data-testid="node-detail-panel">
        {content}
      </BottomSheet>
    );
  }

  return (
    <div data-testid="node-detail-panel" className="fixed top-0 right-0 h-full w-96 max-w-[90vw] bg-panel border-l border-border p-4 overflow-y-auto z-40">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">Edit</h2>
          {statusIndicator}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">
          ✕
        </button>
      </div>
      {content}
    </div>
  );
}
