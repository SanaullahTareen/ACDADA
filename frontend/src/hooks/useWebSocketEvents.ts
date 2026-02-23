import { useEffect, useRef, useState, useCallback } from 'react';
import type { PipelineEvent } from '../api/types';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketEventsReturn {
    events: PipelineEvent[];
    isConnected: boolean;
    connectionStatus: ConnectionStatus;
    clearEvents: () => void;
}

const WS_URL = import.meta.env.DEV
    ? 'ws://localhost:8000/ws/events'
    : `ws://${window.location.host}/ws/events`;

const MAX_EVENTS = 500;
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

export function useWebSocketEvents(): UseWebSocketEventsReturn {
    const [events, setEvents] = useState<PipelineEvent[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttempts = useRef(0);
    const reconnectTimeout = useRef<number | null>(null);

    const clearEvents = useCallback(() => {
        setEvents([]);
    }, []);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        setConnectionStatus('connecting');
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            setConnectionStatus('connected');
            reconnectAttempts.current = 0;
            console.log('[WS] Connected');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as PipelineEvent;
                setEvents((prev) => {
                    const next = [data, ...prev];
                    return next.slice(0, MAX_EVENTS);
                });
            } catch (err) {
                console.error('[WS] Parse error:', err);
            }
        };

        ws.onerror = () => {
            setConnectionStatus('error');
            console.error('[WS] Error');
        };

        ws.onclose = () => {
            setConnectionStatus('disconnected');
            console.log('[WS] Disconnected');

            // Auto-reconnect with exponential backoff
            if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                const delay = RECONNECT_DELAY_MS * Math.pow(1.5, reconnectAttempts.current);
                reconnectAttempts.current++;
                reconnectTimeout.current = window.setTimeout(connect, delay);
            }
        };

        wsRef.current = ws;
    }, []);

    useEffect(() => {
        connect();

        // Keep-alive ping every 30s
        const pingInterval = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send('ping');
            }
        }, 30000);

        return () => {
            clearInterval(pingInterval);
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
            wsRef.current?.close();
        };
    }, [connect]);

    return {
        events,
        isConnected: connectionStatus === 'connected',
        connectionStatus,
        clearEvents,
    };
}
