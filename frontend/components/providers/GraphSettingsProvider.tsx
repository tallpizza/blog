'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, GraphSettings, DEFAULT_GRAPH_SETTINGS } from '@/lib/api-client';

interface GraphSettingsContextType {
  settings: GraphSettings;
  updateSettings: (settings: Partial<GraphSettings>) => Promise<void>;
  loading: boolean;
}

const GraphSettingsContext = createContext<GraphSettingsContextType | null>(null);

export function GraphSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GraphSettings>(DEFAULT_GRAPH_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getGraphSettings()
      .then((savedSettings) => {
        if (savedSettings) {
          setSettings({ ...DEFAULT_GRAPH_SETTINGS, ...savedSettings });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<GraphSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    await api.setGraphSettings(merged);
  }, [settings]);

  return (
    <GraphSettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </GraphSettingsContext.Provider>
  );
}

export function useGraphSettings() {
  const context = useContext(GraphSettingsContext);
  if (!context) {
    throw new Error('useGraphSettings must be used within GraphSettingsProvider');
  }
  return context;
}
