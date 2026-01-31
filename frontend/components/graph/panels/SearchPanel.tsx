'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ForceGraphNode } from '../types';

interface Props {
  nodes: ForceGraphNode[];
  onNodeSelect: (nodeId: string) => void;
  onHighlightChange: (nodeIds: Set<string>) => void;
}

export function SearchPanel({ nodes, onNodeSelect, onHighlightChange }: Props) {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const matchingNodes = useMemo(() => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return nodes.filter(node => {
      const labelMatch = node.label.toLowerCase().includes(lowerQuery);
      const labelsMatch = node.labels.some(l => l.toLowerCase().includes(lowerQuery));
      const propsMatch = Object.values(node.originalNode.properties).some(val => 
        String(val).toLowerCase().includes(lowerQuery)
      );
      return labelMatch || labelsMatch || propsMatch;
    });
  }, [nodes, query]);

  useEffect(() => {
    const nodeIds = new Set(matchingNodes.map(n => n.id));
    onHighlightChange(nodeIds);
  }, [matchingNodes, onHighlightChange]);

  const handleClear = useCallback(() => {
    setQuery('');
    onHighlightChange(new Set());
  }, [onHighlightChange]);

  const handleResultClick = useCallback((nodeId: string) => {
    onNodeSelect(nodeId);
    setIsExpanded(false);
  }, [onNodeSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && matchingNodes.length === 1) {
      handleResultClick(matchingNodes[0].id);
    }
  }, [handleClear, handleResultClick, matchingNodes]);

  return (
    <div className="absolute top-4 right-4 z-20">
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-800 overflow-hidden">
        <div className="flex items-center px-3 py-2">
          <svg 
            className="w-4 h-4 text-gray-500 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search nodes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onKeyDown={handleKeyDown}
            data-testid="search-input"
            className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-48"
          />
          {query && (
            <button
              onClick={handleClear}
              className="text-gray-500 hover:text-white ml-2"
              data-testid="search-clear"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {isExpanded && query && (
          <div className="border-t border-gray-800 max-h-64 overflow-y-auto">
            {matchingNodes.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No matching nodes</div>
            ) : (
              <>
                <div className="px-3 py-1 text-xs text-gray-500 bg-gray-800/50">
                  {matchingNodes.length} result{matchingNodes.length !== 1 ? 's' : ''}
                </div>
                {matchingNodes.map(node => (
                  <button
                    key={node.id}
                    onClick={() => handleResultClick(node.id)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-800 transition-colors flex items-center gap-2"
                    data-testid={`search-result-${node.id}`}
                  >
                    <span 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: node.color }}
                    />
                    <span className="text-sm text-white truncate flex-1">
                      {node.label}
                    </span>
                    {node.labels.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {node.labels[0]}
                      </span>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
