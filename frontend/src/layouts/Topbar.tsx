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
        <header className="flex items-center justify-between h-16 px-6 bg-slate-900/80 border-b border-slate-700/50 backdrop-blur-sm">
            {/* Left: Title */}
            <div>
                <h1 className="text-lg font-semibold text-slate-100">
                    Autonomous Cyber Deception & Adaptive Defense
                </h1>
            </div>

            {/* Right: Status indicators */}
            <div className="flex items-center gap-4">
                {/* WebSocket status */}
                <div
                    className={clsx(
                        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                        isWsConnected 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                    )}
                >
                    {isWsConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    <span className="capitalize">{wsStatus}</span>
                </div>

                {/* System health */}
                {healthError ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-sm font-medium">
                        <AlertTriangle className="w-4 h-4" />
                        <span>API Offline</span>
                    </div>
                ) : health ? (
                    <div
                        className={clsx(
                            'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                            health.status === 'ok' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        )}
                    >
                        <Activity className="w-4 h-4" />
                        <span>{systemStatus?.overall_health?.toFixed(0) ?? '--'}% Health</span>
                    </div>
                ) : null}

                {/* Events processed */}
                {systemStatus && (
                    <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                        <span className="font-mono font-medium text-slate-300">{systemStatus.total_events_processed.toLocaleString()}</span>
                        <span>events</span>
                    </div>
                )}

                {/* Uptime */}
                {health && (
                    <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium text-slate-300">{formatUptime(health.uptime_seconds)}</span>
                    </div>
                )}
            </div>
        </header>
    );
}
