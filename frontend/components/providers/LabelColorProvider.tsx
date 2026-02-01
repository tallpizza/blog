'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, LabelColors } from '@/lib/api-client';

const DEFAULT_COLORS: LabelColors = {
  Problem: '#EF4444',
  Idea: '#F59E0B',
  Solution: '#10B981',
};

interface LabelColorContextType {
  colors: LabelColors;
  getColor: (label: string) => string;
  setColor: (label: string, color: string) => Promise<void>;
  loading: boolean;
}

const LabelColorContext = createContext<LabelColorContextType | null>(null);

export function LabelColorProvider({ children }: { children: ReactNode }) {
  const [colors, setColors] = useState<LabelColors>(DEFAULT_COLORS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLabelColors()
      .then((savedColors) => {
        if (Object.keys(savedColors).length > 0) {
          setColors({ ...DEFAULT_COLORS, ...savedColors });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getColor = useCallback((label: string): string => {
    return colors[label] || '#6B7280';
  }, [colors]);

  const setColor = useCallback(async (label: string, color: string) => {
    const newColors = { ...colors, [label]: color };
    setColors(newColors);
    await api.setLabelColors(newColors);
  }, [colors]);

  return (
    <LabelColorContext.Provider value={{ colors, getColor, setColor, loading }}>
      {children}
    </LabelColorContext.Provider>
  );
}

export function useLabelColors() {
  const context = useContext(LabelColorContext);
  if (!context) {
    throw new Error('useLabelColors must be used within LabelColorProvider');
  }
  return context;
}
