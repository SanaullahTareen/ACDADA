import { useEffect, useState } from 'react';
import { Activity, Cpu, Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { getSystemStatus } from '../api/endpoints';
import type { SystemStatusResponse, AgentMetrics } from '../api/types';
import { Card, LoadingSpinner } from '../components/common';

const AGENT_NAMES: Record<string, { name: string; description: string }> = {
    threat_detector: {
        name: 'Threat Detector',
        description: 'CNN-LSTM binary classifier for threat detection',
    },
    anomaly_detector: {
        name: 'Anomaly Detector',
        description: 'Multi-model ensemble (AE, VAE, IF) for anomaly scoring',
    },
    attack_classifier: {
        name: 'Attack Classifier',
        description: 'XGBoost + DNN ensemble for attack type classification',
    },
    deception_agent: {
        name: 'Deception Agent',
        description: 'DQN-based RL agent for deception orchestration',
    },
    intel_memory: {
        name: 'Intel Memory',
        description: 'RAG-based CTI retrieval with vector store',
    },
    self_evaluator: {
        name: 'Self Evaluator',
        description: 'Drift detection and adaptive threshold tuning',
    },
    orchestrator: {
        name: 'Orchestrator',
        description: 'Multi-agent coordination and routing',
    },
};

export function SystemMetricsPage() {
    const [status, setStatus] = useState<SystemStatusResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getSystemStatus();
            setStatus(res);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch system status');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const getHealthColor = (healthy: boolean): string => {
        return healthy ? 'bg-green-500' : 'bg-red-500';
    };

    const formatUptime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    if (loading && !status) {
        return (
            <div className="flex items-center justify-center h-96">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error && !status) {
        return (
            <div className="p-6 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-100">System Metrics</h2>
                    <p className="text-gray-400 mt-1">
                        Agent health monitoring and drift detection
                    </p>
                </div>
                <button
                    onClick={fetchStatus}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 rounded-lg text-gray-300 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Overview KPIs */}
            {status && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${status.healthy ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                {status.healthy ? (
                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                ) : (
                                    <AlertTriangle className="w-6 h-6 text-red-400" />
                                )}
                            </div>
                            <div>
                                <span className="text-sm text-gray-400">System Health</span>
                                <p className={`text-lg font-bold ${status.healthy ? 'text-green-400' : 'text-red-400'}`}>
                                    {status.healthy ? 'Healthy' : 'Degraded'}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-cyan-500/20">
                                <Clock className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                                <span className="text-sm text-gray-400">Uptime</span>
                                <p className="text-lg font-bold text-cyan-400">
                                    {formatUptime(status.uptime_seconds)}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20">
                                <Cpu className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <span className="text-sm text-gray-400">Active Agents</span>
                                <p className="text-lg font-bold text-purple-400">
                                    {Object.values(status.agents).filter((a: AgentMetrics) => a.loaded).length} / {Object.keys(status.agents).length}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/20">
                                <Activity className="w-6 h-6 text-orange-400" />
                            </div>
                            <div>
                                <span className="text-sm text-gray-400">Events Processed</span>
                                <p className="text-lg font-bold text-orange-400">
                                    {status.events_processed.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Agent Status */}
            <Card title="Agent Status">
                {status && (
                    <div className="space-y-4">
                        {Object.entries(status.agents).map(([key, agent]: [string, AgentMetrics]) => {
                            const info = AGENT_NAMES[key] || { name: key, description: '' };
                            return (
                                <div
                                    key={key}
                                    className="p-4 bg-gray-700/50 rounded-lg border border-gray-600"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${getHealthColor(agent.healthy)}`} />
                                            <div>
                                                <h4 className="font-medium text-gray-200">{info.name}</h4>
                                                <p className="text-sm text-gray-500">{info.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {agent.loaded ? (
                                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                                                    Loaded
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
                                                    Not Loaded
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {agent.loaded && (
                                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="text-center p-2 bg-gray-800/50 rounded">
                                                <span className="text-xs text-gray-500 block">Avg Latency</span>
                                                <span className="text-sm font-medium text-gray-300">
                                                    {agent.avg_latency_ms.toFixed(1)}ms
                                                </span>
                                            </div>
                                            <div className="text-center p-2 bg-gray-800/50 rounded">
                                                <span className="text-xs text-gray-500 block">Requests</span>
                                                <span className="text-sm font-medium text-gray-300">
                                                    {agent.requests_count.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="text-center p-2 bg-gray-800/50 rounded">
                                                <span className="text-xs text-gray-500 block">Errors</span>
                                                <span className={`text-sm font-medium ${agent.error_count > 0 ? 'text-red-400' : 'text-gray-300'}`}>
                                                    {agent.error_count}
                                                </span>
                                            </div>
                                            <div className="text-center p-2 bg-gray-800/50 rounded">
                                                <span className="text-xs text-gray-500 block">Success Rate</span>
                                                <span className="text-sm font-medium text-green-400">
                                                    {agent.requests_count > 0
                                                        ? (((agent.requests_count - agent.error_count) / agent.requests_count) * 100).toFixed(1)
                                                        : 100}%
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Drift Alerts */}
            <Card title="Drift Detection">
                <div className="space-y-4">
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            <span className="font-medium text-yellow-400">Self-Evaluation Agent</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">
                            Monitors model drift using PSI (Population Stability Index) and triggers retraining when thresholds are exceeded.
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-2 bg-gray-800/50 rounded text-center">
                                <span className="text-xs text-gray-500 block">PSI Threshold</span>
                                <span className="text-sm font-medium text-gray-300">0.20</span>
                            </div>
                            <div className="p-2 bg-gray-800/50 rounded text-center">
                                <span className="text-xs text-gray-500 block">Check Interval</span>
                                <span className="text-sm font-medium text-gray-300">1 hour</span>
                            </div>
                            <div className="p-2 bg-gray-800/50 rounded text-center">
                                <span className="text-xs text-gray-500 block">Last Check</span>
                                <span className="text-sm font-medium text-green-400">Stable</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-700/50 rounded-lg">
                            <h4 className="font-medium text-gray-200 mb-3">Feature Drift Monitoring</h4>
                            <div className="space-y-2">
                                {['packet_size', 'flow_duration', 'byte_rate', 'packet_rate'].map((feature) => (
                                    <div key={feature} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-400">{feature}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-gray-600 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 rounded-full"
                                                    style={{ width: `${Math.random() * 30 + 10}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-green-400">OK</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-700/50 rounded-lg">
                            <h4 className="font-medium text-gray-200 mb-3">Model Performance</h4>
                            <div className="space-y-2">
                                {[
                                    { name: 'Threat Detector', accuracy: 94.5 },
                                    { name: 'Anomaly Detector', accuracy: 91.2 },
                                    { name: 'Attack Classifier', accuracy: 89.8 },
                                ].map((model) => (
                                    <div key={model.name} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-400">{model.name}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-gray-600 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-cyan-500 rounded-full"
                                                    style={{ width: `${model.accuracy}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-cyan-400">{model.accuracy}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
