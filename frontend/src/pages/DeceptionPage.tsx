import { useState } from 'react';
import { Shield, Play, Zap, Server, Globe, Database, AlertTriangle } from 'lucide-react';
import { getDeceptionAction } from '../api/endpoints';
import type { DeceptionActionResponse, SeverityLevel } from '../api/types';
import { Card, LoadingSpinner, SeverityBadge } from '../components/common';

interface ThreatScenario {
    name: string;
    severity: SeverityLevel;
    attack_type: string;
    confidence: number;
    icon: typeof Shield;
}

const THREAT_SCENARIOS: ThreatScenario[] = [
    { name: 'DDoS Attack', severity: 'critical', attack_type: 'DDoS', confidence: 0.95, icon: Zap },
    { name: 'Port Scan', severity: 'medium', attack_type: 'PortScan', confidence: 0.85, icon: Globe },
    { name: 'Brute Force', severity: 'high', attack_type: 'BruteForce', confidence: 0.9, icon: Server },
    { name: 'SQL Injection', severity: 'high', attack_type: 'Injection', confidence: 0.88, icon: Database },
    { name: 'Botnet C2', severity: 'critical', attack_type: 'Botnet', confidence: 0.92, icon: AlertTriangle },
];

interface HoneypotStatus {
    name: string;
    type: string;
    active: boolean;
    interactions: number;
}

const HONEYPOTS: HoneypotStatus[] = [
    { name: 'SSH Honeypot', type: 'ssh', active: true, interactions: 247 },
    { name: 'HTTP Honeypot', type: 'http', active: true, interactions: 1523 },
    { name: 'MySQL Honeypot', type: 'mysql', active: false, interactions: 89 },
    { name: 'SMB Honeypot', type: 'smb', active: true, interactions: 156 },
];

export function DeceptionPage() {
    const [result, setResult] = useState<DeceptionActionResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedScenario, setSelectedScenario] = useState<ThreatScenario | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGetDecision = async (scenario: ThreatScenario) => {
        setSelectedScenario(scenario);
        setLoading(true);
        setError(null);
        try {
            // Generate a random observation vector based on scenario
            const observation = Array.from({ length: 10 }, () => Math.random());
            // Bias observation based on severity
            if (scenario.severity === 'critical') {
                observation[0] = 0.9;
                observation[1] = 0.8;
            } else if (scenario.severity === 'high') {
                observation[0] = 0.7;
                observation[1] = 0.6;
            }
            const res = await getDeceptionAction({ observation });
            setResult(res);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get deception decision');
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (actionName: string): string => {
        if (actionName.includes('block')) return 'bg-red-500';
        if (actionName.includes('redirect') || actionName.includes('hp')) return 'bg-purple-500';
        if (actionName.includes('monitoring')) return 'bg-blue-500';
        if (actionName.includes('observe')) return 'bg-yellow-500';
        return 'bg-gray-500';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-100">Deception Environment</h2>
                <p className="text-gray-400 mt-1">
                    RL-based deception agent with adaptive honeypot orchestration
                </p>
            </div>

            {/* Threat Scenarios */}
            <Card title="Select Threat Scenario">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {THREAT_SCENARIOS.map((scenario) => {
                        const Icon = scenario.icon;
                        const isSelected = selectedScenario?.name === scenario.name;
                        return (
                            <button
                                key={scenario.name}
                                onClick={() => handleGetDecision(scenario)}
                                disabled={loading}
                                className={`p-4 rounded-lg border transition-all ${isSelected
                                    ? 'border-cyan-500 bg-cyan-500/20'
                                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                                    }`}
                            >
                                <Icon className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                                <h4 className="text-sm font-medium text-gray-200">{scenario.name}</h4>
                                <SeverityBadge severity={scenario.severity} className="mt-2 text-xs" />
                            </button>
                        );
                    })}
                </div>
                {error && (
                    <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                        {error}
                    </div>
                )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Decision Result */}
                <Card title="RL Agent Decision">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : result ? (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getActionColor(result.action_name)} mb-4`}>
                                    <Shield className="w-10 h-10 text-white" />
                                </div>
                                <span className="inline-block px-4 py-2 text-lg font-medium rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/50">
                                    {result.action_name.replace(/_/g, ' ').toUpperCase()}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                                        <span className="text-gray-400 text-sm block">Action ID</span>
                                        <span className="text-xl font-bold text-gray-200">{result.action_id}</span>
                                    </div>
                                    <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                                        <span className="text-gray-400 text-sm block">Model</span>
                                        <span className="text-xl font-bold text-purple-400">{result.model_type.toUpperCase()}</span>
                                    </div>
                                    <div className="p-3 bg-gray-700/50 rounded-lg text-center">
                                        <span className="text-gray-400 text-sm block">Latency</span>
                                        <span className="text-xl font-bold text-gray-200">
                                            {result.latency_ms.toFixed(1)}ms
                                        </span>
                                    </div>
                                </div>

                                {result.action_name.includes('hp') && (
                                    <div className="p-3 bg-purple-500/20 border border-purple-500/50 rounded-lg">
                                        <span className="text-gray-400 text-sm block mb-1">Honeypot Target</span>
                                        <span className="text-lg font-bold text-purple-400">
                                            {result.action_name.replace('activate_', '').replace('redirect_to_', '')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Select a threat scenario to get the agent's decision
                        </div>
                    )}
                </Card>

                {/* Honeypot Status */}
                <Card title="Honeypot Status">
                    <div className="space-y-4">
                        {HONEYPOTS.map((honeypot) => (
                            <div
                                key={honeypot.name}
                                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-3 h-3 rounded-full ${honeypot.active ? 'bg-green-500' : 'bg-gray-500'
                                            }`}
                                    />
                                    <div>
                                        <h4 className="font-medium text-gray-200">{honeypot.name}</h4>
                                        <span className="text-xs text-gray-500">{honeypot.type}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-bold text-cyan-400">{honeypot.interactions}</span>
                                    <span className="text-xs text-gray-500 block">interactions</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Play className="w-4 h-4 text-cyan-400" />
                            <span className="font-medium text-cyan-400">RL Policy</span>
                        </div>
                        <p className="text-sm text-gray-400">
                            DQN-based agent trained with 50k episodes. Epsilon-greedy exploration with
                            adaptive decay. Reward shaping based on attacker engagement time.
                        </p>
                    </div>
                </Card>
            </div>

            {/* Action Legend */}
            <Card title="Action Definitions">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="font-medium text-gray-200">BLOCK</span>
                        </div>
                        <p className="text-xs text-gray-400">Immediately drop connection</p>
                    </div>
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500" />
                            <span className="font-medium text-gray-200">REDIRECT</span>
                        </div>
                        <p className="text-xs text-gray-400">Send to honeypot for analysis</p>
                    </div>
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <span className="font-medium text-gray-200">SLOW_DOWN</span>
                        </div>
                        <p className="text-xs text-gray-400">Rate limit connection</p>
                    </div>
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="font-medium text-gray-200">MONITOR</span>
                        </div>
                        <p className="text-xs text-gray-400">Allow with enhanced logging</p>
                    </div>
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="font-medium text-gray-200">ALLOW</span>
                        </div>
                        <p className="text-xs text-gray-400">Permit normal traffic</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
