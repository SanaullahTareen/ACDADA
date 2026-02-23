import { Shield, AlertTriangle, Activity, Zap, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { KPICard, Card } from '../components/common';
import {
    SeverityDistributionChart,
    DecisionDistributionChart,
    AttackTypeChart,
    RecentEventsPanel,
} from '../components/dashboard';

export function DashboardPage() {
    const { events, systemStatus, health, healthLoading } = useApp();

    // Compute KPIs from events
    const threatCount = events.filter((e) => e.is_threat).length;
    const anomalyCount = events.filter((e) => e.is_anomaly).length;
    const criticalCount = events.filter((e) => e.severity === 'critical').length;
    const avgLatency = events.length
        ? (events.reduce((sum, e) => sum + e.processing_time_ms, 0) / events.length).toFixed(1)
        : '0';

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-100">System Overview</h2>
                <p className="text-slate-400 mt-1">Real-time cyber defense monitoring dashboard</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <KPICard
                    title="System Health"
                    value={healthLoading ? '...' : `${systemStatus?.overall_health?.toFixed(0) || 0}%`}
                    icon={<Activity className="w-5 h-5 text-sky-400" />}
                    color="cyan"
                />
                <KPICard
                    title="Threats Detected"
                    value={threatCount}
                    icon={<Shield className="w-5 h-5 text-rose-400" />}
                    color="red"
                />
                <KPICard
                    title="Anomalies"
                    value={anomalyCount}
                    icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
                    color="yellow"
                />
                <KPICard
                    title="Critical Alerts"
                    value={criticalCount}
                    icon={<Zap className="w-5 h-5 text-rose-400" />}
                    color="red"
                />
                <KPICard
                    title="Avg Latency"
                    value={`${avgLatency}ms`}
                    icon={<Clock className="w-5 h-5 text-blue-400" />}
                    color="blue"
                />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Severity Distribution">
                    <SeverityDistributionChart events={events} />
                </Card>
                <Card title="Decision Distribution">
                    <DecisionDistributionChart events={events} />
                </Card>
                <Card title="Attack Types">
                    <AttackTypeChart events={events} />
                </Card>
            </div>

            {/* Agent status & recent events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Agent Status">
                    <div className="space-y-3">
                        {systemStatus?.agents ? (
                            Object.entries(systemStatus.agents).map(([name, { loaded }]) => (
                                <div
                                    key={name}
                                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-700/50 transition-all hover:bg-slate-700/50"
                                >
                                    <span className="text-slate-300 capitalize font-medium">
                                        {name.replace(/_/g, ' ')}
                                    </span>
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium border ${loaded
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                            }`}
                                    >
                                        {loaded ? 'Loaded' : 'Offline'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-slate-500 text-center py-8">
                                {health ? 'No agents data' : 'Connect to backend to see agent status'}
                            </div>
                        )}
                    </div>
                </Card>
                <Card title="Recent Events">
                    <RecentEventsPanel events={events} maxItems={8} />
                </Card>
            </div>
        </div>
    );
}
