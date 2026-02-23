import { Wifi, WifiOff, Activity, AlertTriangle, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import clsx from 'clsx';

export function Topbar() {
    const { isWsConnected, wsStatus, health, systemStatus, healthError } = useApp();

    const formatUptime = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    return (
        <header className="flex items-center justify-between h-16 px-6 bg-gray-900 border-b border-gray-800">
            {/* Left: Title */}
            <div>
                <h1 className="text-lg font-semibold text-gray-100">
                    Autonomous Cyber Deception & Adaptive Defense
                </h1>
            </div>

            {/* Right: Status indicators */}
            <div className="flex items-center gap-6">
                {/* WebSocket status */}
                <div
                    className={clsx(
                        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
                        isWsConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    )}
                >
                    {isWsConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    <span className="capitalize">{wsStatus}</span>
                </div>

                {/* System health */}
                {healthError ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>API Offline</span>
                    </div>
                ) : health ? (
                    <div
                        className={clsx(
                            'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
                            health.status === 'ok' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        )}
                    >
                        <Activity className="w-4 h-4" />
                        <span>{systemStatus?.overall_health?.toFixed(0) ?? '--'}% Health</span>
                    </div>
                ) : null}

                {/* Events processed */}
                {systemStatus && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="font-mono">{systemStatus.total_events_processed.toLocaleString()}</span>
                        <span>events</span>
                    </div>
                )}

                {/* Uptime */}
                {health && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{formatUptime(health.uptime_seconds)}</span>
                    </div>
                )}
            </div>
        </header>
    );
}
