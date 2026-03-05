import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { PipelineEvent, SystemStatusResponse, HealthResponse } from '../api/types';
import { useWebSocketEvents } from '../hooks/useWebSocketEvents';
import { useHealth } from '../hooks/useHealth';

interface Settings {
    apiUrl: string;
    simulationRate: number;
    threatThreshold: number;
    anomalyThreshold: number;
    demoMode: boolean;
}

interface AppContextValue {
    // WebSocket events
    events: PipelineEvent[];
    isWsConnected: boolean;
    wsStatus: string;
    clearEvents: () => void;

    // System status
    health: HealthResponse | null;
    systemStatus: SystemStatusResponse | null;
    healthLoading: boolean;
    healthError: string | null;
    refreshHealth: () => void;

    // Settings
    settings: Settings;
    updateSettings: (updates: Partial<Settings>) => void;
    setSettings: (settings: Settings) => void;

    // UI state
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
}

const defaultSettings: Settings = {
    apiUrl: 'http://localhost:8000',
    simulationRate: 1,
    threatThreshold: 0.5,
    anomalyThreshold: 0.5,
    demoMode: false,
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    // WebSocket
    const { events, isConnected, connectionStatus, clearEvents } = useWebSocketEvents();

    // Health polling
    const { health, status, loading, error, refresh } = useHealth();

    // Settings (persisted to localStorage)
    const [settings, setSettings] = useState<Settings>(() => {
        const saved = localStorage.getItem('acdada_settings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    });

    const updateSettings = useCallback((updates: Partial<Settings>) => {
        setSettings((prev) => {
            const next = { ...prev, ...updates };
            localStorage.setItem('acdada_settings', JSON.stringify(next));
            return next;
        });
    }, []);

    const setSettingsValue = useCallback((newSettings: Settings) => {
        localStorage.setItem('acdada_settings', JSON.stringify(newSettings));
        setSettings(newSettings);
    }, []);

    // UI
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const toggleSidebar = useCallback(() => setSidebarCollapsed((p) => !p), []);

    const value: AppContextValue = {
        events,
        isWsConnected: isConnected,
        wsStatus: connectionStatus,
        clearEvents,
        health,
        systemStatus: status,
        healthLoading: loading,
        healthError: error,
        refreshHealth: refresh,
        settings,
        updateSettings,
        setSettings: setSettingsValue,
        sidebarCollapsed,
        toggleSidebar,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
