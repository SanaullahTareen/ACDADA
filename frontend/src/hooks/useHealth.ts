import { useState, useEffect, useCallback } from 'react';
import { getHealth, getSystemStatus } from '../api/endpoints';
import type { HealthResponse, SystemStatusResponse } from '../api/types';

interface UseHealthReturn {
    health: HealthResponse | null;
    status: SystemStatusResponse | null;
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

const POLL_INTERVAL_MS = 10000; // 10 seconds

export function useHealth(): UseHealthReturn {
    const [health, setHealth] = useState<HealthResponse | null>(null);
    const [status, setStatus] = useState<SystemStatusResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [h, s] = await Promise.all([getHealth(), getSystemStatus()]);
            setHealth(h);
            setStatus(s);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch health');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [fetchData]);

    return { health, status, loading, error, refresh: fetchData };
}
