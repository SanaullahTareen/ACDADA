import { useState, useCallback, useEffect } from 'react';
import { Play, Square, Send, Trash2, AlertTriangle, Shield, Activity, ToggleLeft, ToggleRight, Clock, Gauge, Percent } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { analyzeEvent } from '../api/endpoints';
import type { PipelineResponse } from '../api/types';
import { Card, SeverityBadge, DecisionBadge, LoadingSpinner } from '../components/common';
import { RecentEventsPanel } from '../components/dashboard';

// Generate random features (simulating network traffic) - 110 features to match backend
function generateRandomFeatures(attackType: string): number[] {
    const features = Array.from({ length: 110 }, () => Math.random());

    // Bias certain features based on attack type
    if (attackType === 'attack') {
        features[0] = 0.8 + Math.random() * 0.2; // high packet rate
        features[5] = 0.7 + Math.random() * 0.3; // suspicious flags
        features[20] = 0.9 + Math.random() * 0.1; // suspicious pattern
    } else if (attackType === 'anomaly') {
        features[10] = Math.random() * 0.3; // unusual value
        features[15] = 0.9 + Math.random() * 0.1; // outlier
        features[30] = 0.05 + Math.random() * 0.1; // rare occurrence
    }

    return features;
}

// Attack types for demo mode
const ATTACK_TYPES = ['DDoS', 'SQL Injection', 'XSS', 'Brute Force', 'Port Scan', 'Malware', 'Phishing'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
const DECISIONS = ['allow', 'monitor', 'block', 'redirect', 'quarantine'] as const;

// Generate fake/demo response for testing without backend
// normalPercent controls normal/benign traffic percentage (default 95%)
function generateFakeResponse(simType: string, normalPercent: number = 95): PipelineResponse {
    const rand = Math.random();
    const normalThreshold = normalPercent / 100;
    const attackThreshold = normalThreshold + (1 - normalThreshold) * 0.6; // 60% of remaining for attacks

    // If simType is 'random', use normalPercent for benign ratio
    let type: string;
    if (simType === 'random') {
        if (rand < normalThreshold) type = 'benign';        // normalPercent% benign
        else if (rand < attackThreshold) type = 'attack';   // 60% of remainder = attacks
        else type = 'anomaly';                               // 40% of remainder = anomalies
    } else {
        type = simType;
    }

    const isThreat = type === 'attack';
    const isAnomaly = type === 'anomaly';
    const attackType = isThreat || isAnomaly
        ? ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)]
        : 'Benign';

    const threatConf = isThreat ? 0.6 + Math.random() * 0.4 : Math.random() * 0.2;
    const anomalyScore = isAnomaly ? 0.5 + Math.random() * 0.5 : Math.random() * 0.2;

    let severityIdx = 0;
    if (threatConf > 0.8 || anomalyScore > 0.8) severityIdx = 3;
    else if (threatConf > 0.6 || anomalyScore > 0.6) severityIdx = 2;
    else if (threatConf > 0.4 || anomalyScore > 0.4) severityIdx = 1;

    // Benign traffic gets 'allow' (index 0), threats get escalating decisions
    const isBenign = !isThreat && !isAnomaly;
    const decisionIdx = isBenign ? 0 : Math.min(severityIdx + 1, 4);

    return {
        flow_id: Math.random().toString(36).substring(2, 14),
        timestamp: new Date().toISOString(),
        is_threat: isThreat,
        threat_confidence: threatConf,
        is_anomaly: isAnomaly,
        anomaly_score: anomalyScore,
        attack_type: attackType,
        attack_confidence: isThreat ? 0.7 + Math.random() * 0.3 : null,
        severity: isBenign ? 'low' : SEVERITIES[severityIdx],
        decision: DECISIONS[decisionIdx],
        deception_action: severityIdx >= 2 ? 'deploy_honeypot' : null,
        recommendations: severityIdx >= 2 ? ['Block source IP', 'Enable rate limiting', 'Alert SOC team'] : [],
        consensus_score: isBenign ? 0.0 : 0.5 + Math.random() * 0.5,
        processing_time_ms: 5 + Math.random() * 50,
        agent_outputs: {},
    };
}

// Live stats interface
interface LiveStats {
    totalEvents: number;
    threats: number;
    anomalies: number;
    criticalAlerts: number;
    attackTypes: Record<string, number>;
}

export function LiveSimulationPage() {
    const { events, clearEvents, settings, updateSettings } = useApp();
    const [isSimulating, setIsSimulating] = useState(false);
    const [lastResult, setLastResult] = useState<PipelineResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [simType, setSimType] = useState<'random' | 'attack' | 'benign' | 'anomaly'>('random');
    const [liveStats, setLiveStats] = useState<LiveStats>({
        totalEvents: 0,
        threats: 0,
        anomalies: 0,
        criticalAlerts: 0,
        attackTypes: {},
    });
    const [logMessages, setLogMessages] = useState<string[]>([]);

    // Use demoMode from global settings
    const demoMode = settings.demoMode ?? false;

    // Demo mode 5-minute limit
    const DEMO_TIME_LIMIT = 5 * 60 * 1000; // 5 minutes in ms
    const [demoStartTime, setDemoStartTime] = useState<number | null>(null);
    const [demoTimeRemaining, setDemoTimeRemaining] = useState<number>(DEMO_TIME_LIMIT);

    // Demo-only settings
    const [demoRate, setDemoRate] = useState(2); // logs per second
    const [demoNormalPercent, setDemoNormalPercent] = useState(95); // % of normal/benign logs

    // Add log message helper
    const addLog = useCallback((msg: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogMessages(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 99)]);
    }, []);

    const simulateOne = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const type = simType === 'random'
                ? ['attack', 'benign', 'anomaly'][Math.floor(Math.random() * 3)]
                : simType;

            let result: PipelineResponse;

            if (demoMode) {
                // Demo mode: generate fake data without backend
                addLog(`[DEMO] Generating ${type} traffic sample...`);
                await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100)); // Simulate latency
                result = generateFakeResponse(simType, demoNormalPercent);
            } else {
                // Live mode: call real backend API
                const features = generateRandomFeatures(type);
                addLog(`Sending ${type} traffic sample...`);
                result = await analyzeEvent({
                    features,
                    label: type === 'benign' ? 0 : 1,
                });
            }
            setLastResult(result);

            // Update live stats
            setLiveStats(prev => {
                const newStats = { ...prev };
                newStats.totalEvents++;
                if (result.is_threat) {
                    newStats.threats++;
                    addLog(`⚠️ THREAT DETECTED - Confidence: ${(result.threat_confidence * 100).toFixed(1)}%`);
                }
                if (result.is_anomaly) {
                    newStats.anomalies++;
                    addLog(`🔍 ANOMALY DETECTED - Score: ${(result.anomaly_score * 100).toFixed(1)}%`);
                }
                if (result.severity === 'critical' || result.severity === 'high') {
                    newStats.criticalAlerts++;
                    addLog(`🚨 ${result.severity.toUpperCase()} ALERT - Decision: ${result.decision}`);
                }
                if (result.attack_type && result.attack_type !== 'Benign') {
                    newStats.attackTypes[result.attack_type] = (newStats.attackTypes[result.attack_type] || 0) + 1;
                    addLog(`🎯 Attack classified: ${result.attack_type}`);
                }
                return newStats;
            });

            addLog(`✓ ${demoMode ? '[DEMO] ' : ''}Analyzed in ${result.processing_time_ms.toFixed(2)}ms - ${result.severity}`);
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to analyze';
            setError(errMsg);
            addLog(`❌ ERROR: ${errMsg}`);
        } finally {
            setLoading(false);
        }
    }, [simType, addLog, demoMode, demoNormalPercent]);

    const toggleSimulation = useCallback(() => {
        setIsSimulating((prev) => {
            if (!prev) {
                addLog('▶️ Auto-simulation STARTED');
                if (demoMode) {
                    setDemoStartTime(Date.now());
                    setDemoTimeRemaining(DEMO_TIME_LIMIT);
                    addLog('⏱️ Demo mode limited to 5 minutes');
                }
            } else {
                addLog('⏹️ Auto-simulation STOPPED');
                setDemoStartTime(null);
            }
            return !prev;
        });
    }, [addLog, demoMode, DEMO_TIME_LIMIT]);

    // Clear stats when clearing events
    const handleClearAll = useCallback(() => {
        clearEvents();
        setLiveStats({ totalEvents: 0, threats: 0, anomalies: 0, criticalAlerts: 0, attackTypes: {} });
        setLogMessages([]);
        setLastResult(null);
    }, [clearEvents]);

    // Auto-simulation effect - use demoRate when in demo mode
    useEffect(() => {
        if (!isSimulating) return;
        const rate = demoMode ? demoRate : settings.simulationRate;
        const interval = setInterval(() => {
            simulateOne();
        }, 1000 / rate);
        return () => clearInterval(interval);
    }, [isSimulating, settings.simulationRate, simulateOne, demoMode, demoRate]);

    // Demo mode countdown timer
    useEffect(() => {
        if (!isSimulating || !demoMode || !demoStartTime) return;

        const timerInterval = setInterval(() => {
            const elapsed = Date.now() - demoStartTime;
            const remaining = Math.max(0, DEMO_TIME_LIMIT - elapsed);
            setDemoTimeRemaining(remaining);

            if (remaining <= 0) {
                setIsSimulating(false);
                setDemoStartTime(null);
                addLog('⏱️ Demo mode time limit reached (5 minutes). Auto-simulation stopped.');
            }
        }, 1000);

        return () => clearInterval(timerInterval);
    }, [isSimulating, demoMode, demoStartTime, DEMO_TIME_LIMIT, addLog]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">Live Simulation</h2>
                    <p className="text-slate-400 mt-1">Generate and analyze synthetic network traffic</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Demo Mode Toggle */}
                    <button
                        onClick={() => {
                            const newDemoMode = !demoMode;
                            updateSettings({ demoMode: newDemoMode });
                            addLog(newDemoMode ? '🎭 Switched to DEMO MODE (Fake Data)' : '🔌 Switched to LIVE MODE (Backend API)');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${demoMode
                            ? 'bg-purple-600/30 border border-purple-500 text-purple-300'
                            : 'bg-green-600/30 border border-green-500 text-green-300'
                            }`}
                    >
                        {demoMode ? (
                            <>
                                <ToggleRight className="w-5 h-5" />
                                Demo Mode
                            </>
                        ) : (
                            <>
                                <ToggleLeft className="w-5 h-5" />
                                Live Mode
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleClearAll}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear All
                    </button>
                </div>
            </div>

            {/* Mode Indicator Banner */}
            {demoMode && (
                <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-purple-400 font-medium">🎭 Demo Mode Active</span>
                        <span className="text-purple-300/70 text-sm">Generating fake data — no backend required</span>
                    </div>
                    {isSimulating && (
                        <div className="flex items-center gap-2 text-purple-300">
                            <Clock className="w-4 h-4" />
                            <span className="font-mono text-sm">
                                {Math.floor(demoTimeRemaining / 60000)}:{String(Math.floor((demoTimeRemaining % 60000) / 1000)).padStart(2, '0')}
                            </span>
                            <span className="text-purple-300/70 text-xs">remaining</span>
                        </div>
                    )}
                </div>
            )}

            {/* Demo Mode Settings - Only visible in demo mode */}
            {demoMode && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex flex-wrap items-center gap-6">
                        {/* Rate per second */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-purple-300">
                                <Gauge className="w-4 h-4" />
                                <span className="text-sm">Rate:</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={demoRate}
                                onChange={(e) => setDemoRate(parseInt(e.target.value))}
                                className="w-24 h-2 bg-purple-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                            <span className="text-purple-300 font-mono text-sm w-16">{demoRate}/sec</span>
                        </div>

                        {/* Normal percentage */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-purple-300">
                                <Percent className="w-4 h-4" />
                                <span className="text-sm">Normal:</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={demoNormalPercent}
                                onChange={(e) => setDemoNormalPercent(parseInt(e.target.value))}
                                className="w-24 h-2 bg-purple-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                            <span className="text-purple-300 font-mono text-sm w-12">{demoNormalPercent}%</span>
                        </div>

                        <span className="text-purple-300/50 text-xs">
                            ({100 - demoNormalPercent}% threats/anomalies)
                        </span>
                    </div>
                </div>
            )}

            {/* Live Stats Panel */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                        <Activity className="w-4 h-4" />
                        Total Events
                    </div>
                    <div className="text-2xl font-bold text-blue-400">{liveStats.totalEvents}</div>
                </div>
                <div className="bg-slate-800/50 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                        <Shield className="w-4 h-4 text-red-400" />
                        Threats
                    </div>
                    <div className="text-2xl font-bold text-red-400">{liveStats.threats}</div>
                </div>
                <div className="bg-slate-800/50 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        Anomalies
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">{liveStats.anomalies}</div>
                </div>
                <div className="bg-slate-800/50 border border-orange-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        Critical Alerts
                    </div>
                    <div className="text-2xl font-bold text-orange-400">{liveStats.criticalAlerts}</div>
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

                    {/* Rate display - only in live mode since demo has its own rate control */}
                    {!demoMode && (
                        <span className="text-slate-500 text-sm">
                            Rate: {settings.simulationRate}/sec
                        </span>
                    )}
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

            {/* Live Log Console */}
            <Card title="Live Log Console" subtitle={`${logMessages.length} messages`}>
                <div className="bg-slate-900 rounded-lg p-3 h-64 overflow-y-auto font-mono text-sm">
                    {logMessages.length === 0 ? (
                        <div className="text-slate-500 text-center py-8">
                            Click "Send One" or "Start Auto" to see live logs
                        </div>
                    ) : (
                        logMessages.map((msg, i) => (
                            <div
                                key={i}
                                className={`py-1 border-b border-slate-800 last:border-0 ${msg.includes('ERROR') ? 'text-red-400' :
                                    msg.includes('THREAT') ? 'text-red-400' :
                                        msg.includes('CRITICAL') || msg.includes('HIGH') ? 'text-orange-400' :
                                            msg.includes('ANOMALY') ? 'text-yellow-400' :
                                                msg.includes('Attack classified') ? 'text-purple-400' :
                                                    msg.includes('✓') ? 'text-green-400' :
                                                        'text-slate-300'
                                    }`}
                            >
                                {msg}
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {/* Attack Type Distribution */}
            {Object.keys(liveStats.attackTypes).length > 0 && (
                <Card title="Attack Type Distribution">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(liveStats.attackTypes).map(([type, count]) => (
                            <div key={type} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-center">
                                <div className="text-slate-400 text-xs mb-1">{type}</div>
                                <div className="text-lg font-bold text-purple-400">{count}</div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
