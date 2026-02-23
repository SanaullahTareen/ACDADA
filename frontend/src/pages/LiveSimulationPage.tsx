import { useState, useCallback } from 'react';
import { Play, Square, Send, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { analyzeEvent } from '../api/endpoints';
import type { PipelineResponse } from '../api/types';
import { Card, SeverityBadge, DecisionBadge, LoadingSpinner } from '../components/common';
import { RecentEventsPanel } from '../components/dashboard';

// Generate random features (simulating network traffic)
function generateRandomFeatures(attackType: string): number[] {
    const features = Array.from({ length: 78 }, () => Math.random());

    // Bias certain features based on attack type
    if (attackType === 'attack') {
        features[0] = 0.8 + Math.random() * 0.2; // high packet rate
        features[5] = 0.7 + Math.random() * 0.3; // suspicious flags
    } else if (attackType === 'anomaly') {
        features[10] = Math.random() * 0.3; // unusual value
        features[15] = 0.9 + Math.random() * 0.1; // outlier
    }

    return features;
}

export function LiveSimulationPage() {
    const { events, clearEvents, settings } = useApp();
    const [isSimulating, setIsSimulating] = useState(false);
    const [lastResult, setLastResult] = useState<PipelineResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [simType, setSimType] = useState<'random' | 'attack' | 'benign' | 'anomaly'>('random');

    const simulateOne = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const type = simType === 'random'
                ? ['attack', 'benign', 'anomaly'][Math.floor(Math.random() * 3)]
                : simType;

            const features = generateRandomFeatures(type);
            const result = await analyzeEvent({
                features,
                label: type === 'benign' ? 0 : 1,
            });
            setLastResult(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze');
        } finally {
            setLoading(false);
        }
    }, [simType]);

    const toggleSimulation = useCallback(() => {
        setIsSimulating((prev) => !prev);
    }, []);

    // Auto-simulation effect
    useState(() => {
        if (!isSimulating) return;
        const interval = setInterval(() => {
            simulateOne();
        }, 1000 / settings.simulationRate);
        return () => clearInterval(interval);
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">Live Simulation</h2>
                    <p className="text-slate-400 mt-1">Generate and analyze synthetic network traffic</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={clearEvents}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear Events
                    </button>
                </div>
            </div>

            {/* Controls */}
            <Card title="Simulation Controls">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Traffic type selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-sm">Traffic Type:</span>
                        <select
                            value={simType}
                            onChange={(e) => setSimType(e.target.value as typeof simType)}
                            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="random">Random Mix</option>
                            <option value="attack">Attacks Only</option>
                            <option value="benign">Benign Only</option>
                            <option value="anomaly">Anomalies Only</option>
                        </select>
                    </div>

                    {/* Single send button */}
                    <button
                        onClick={simulateOne}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 rounded-lg text-white transition-colors"
                    >
                        {loading ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4" />}
                        Send One
                    </button>

                    {/* Auto-simulation toggle */}
                    <button
                        onClick={toggleSimulation}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors ${isSimulating
                                ? 'bg-red-600 hover:bg-red-500'
                                : 'bg-green-600 hover:bg-green-500'
                            }`}
                    >
                        {isSimulating ? (
                            <>
                                <Square className="w-4 h-4" />
                                Stop Auto
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Start Auto
                            </>
                        )}
                    </button>

                    {/* Rate display */}
                    <span className="text-slate-500 text-sm">
                        Rate: {settings.simulationRate}/sec
                    </span>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                        {error}
                    </div>
                )}
            </Card>

            {/* Results grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Last result */}
                <Card title="Last Analysis Result">
                    {lastResult ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400">Flow ID</span>
                                <span className="text-slate-200 font-mono">{lastResult.flow_id}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400">Severity</span>
                                <SeverityBadge severity={lastResult.severity} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400">Decision</span>
                                <DecisionBadge decision={lastResult.decision} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400">Threat</span>
                                <span className={lastResult.is_threat ? 'text-red-400' : 'text-green-400'}>
                                    {lastResult.is_threat ? 'Yes' : 'No'} ({(lastResult.threat_confidence * 100).toFixed(1)}%)
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400">Anomaly</span>
                                <span className={lastResult.is_anomaly ? 'text-yellow-400' : 'text-green-400'}>
                                    {lastResult.is_anomaly ? 'Yes' : 'No'} ({(lastResult.anomaly_score * 100).toFixed(1)}%)
                                </span>
                            </div>
                            {lastResult.attack_type && (
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Attack Type</span>
                                    <span className="text-blue-400">{lastResult.attack_type}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400">Processing Time</span>
                                <span className="text-slate-200">{lastResult.processing_time_ms.toFixed(2)}ms</span>
                            </div>
                            {lastResult.recommendations.length > 0 && (
                                <div className="border-t border-slate-700 pt-4">
                                    <span className="text-slate-400 text-sm">Recommendations:</span>
                                    <ul className="mt-2 space-y-1">
                                        {lastResult.recommendations.map((rec, i) => (
                                            <li key={i} className="text-sm text-slate-300">• {rec}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-slate-500 text-center py-8">
                            Send an event to see the analysis result
                        </div>
                    )}
                </Card>

                {/* Live event stream */}
                <Card title="Event Stream" subtitle={`${events.length} events captured`}>
                    <RecentEventsPanel events={events} maxItems={15} />
                </Card>
            </div>
        </div>
    );
}
