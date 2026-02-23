import { useState } from 'react';
import { Shield, AlertTriangle, Send } from 'lucide-react';
import { detectThreat, detectAnomaly } from '../api/endpoints';
import type { ThreatDetectResponse, AnomalyDetectResponse } from '../api/types';
import { Card, LoadingSpinner } from '../components/common';

export function DetectionPage() {
    const [features, setFeatures] = useState<string>('');
    const [threatResult, setThreatResult] = useState<ThreatDetectResponse | null>(null);
    const [anomalyResult, setAnomalyResult] = useState<AnomalyDetectResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const parseFeatures = (input: string): number[] => {
        if (!input.trim()) {
            // Generate random features for demo
            return Array.from({ length: 78 }, () => Math.random());
        }
        return input.split(',').map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v));
    };

    const handleDetect = async () => {
        setLoading(true);
        setError(null);
        try {
            const featArray = parseFeatures(features);
            if (featArray.length < 10) {
                throw new Error('At least 10 features required');
            }

            const [threat, anomaly] = await Promise.all([
                detectThreat({ features: featArray }),
                detectAnomaly({ features: featArray }),
            ]);

            setThreatResult(threat);
            setAnomalyResult(anomaly);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Detection failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateRandom = () => {
        const randomFeats = Array.from({ length: 78 }, () => Math.random().toFixed(4));
        setFeatures(randomFeats.join(', '));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-100">Detection Analysis</h2>
                <p className="text-slate-400 mt-1">
                    Test threat detection and anomaly detection models individually
                </p>
            </div>

            {/* Input card */}
            <Card title="Feature Input">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">
                            Enter feature vector (comma-separated values):
                        </label>
                        <textarea
                            value={features}
                            onChange={(e) => setFeatures(e.target.value)}
                            placeholder="0.5, 0.3, 0.8, 0.2, ... (leave empty for random)"
                            className="w-full h-24 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDetect}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 rounded-lg text-white transition-colors"
                        >
                            {loading ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4" />}
                            Run Detection
                        </button>
                        <button
                            onClick={handleGenerateRandom}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
                        >
                            Generate Random
                        </button>
                    </div>
                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                            {error}
                        </div>
                    )}
                </div>
            </Card>

            {/* Results */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Threat Detection */}
                <Card title="Threat Detection" subtitle="Binary classification: Attack vs Benign">
                    {threatResult ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center">
                                <div
                                    className={`w-32 h-32 rounded-full flex items-center justify-center ${threatResult.is_threat
                                            ? 'bg-red-500/20 border-2 border-red-500'
                                            : 'bg-green-500/20 border-2 border-green-500'
                                        }`}
                                >
                                    <div className="text-center">
                                        <Shield
                                            className={`w-10 h-10 mx-auto ${threatResult.is_threat ? 'text-red-400' : 'text-green-400'
                                                }`}
                                        />
                                        <span
                                            className={`text-2xl font-bold ${threatResult.is_threat ? 'text-red-400' : 'text-green-400'
                                                }`}
                                        >
                                            {(threatResult.confidence * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                                    <span className="text-slate-400 text-sm block">Result</span>
                                    <span
                                        className={`font-bold ${threatResult.is_threat ? 'text-red-400' : 'text-green-400'
                                            }`}
                                    >
                                        {threatResult.is_threat ? 'THREAT' : 'BENIGN'}
                                    </span>
                                </div>
                                <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                                    <span className="text-slate-400 text-sm block">Model</span>
                                    <span className="text-blue-400 text-sm">{threatResult.model_used}</span>
                                </div>
                            </div>
                            <div className="text-center text-slate-500 text-sm">
                                Latency: {threatResult.latency_ms.toFixed(2)}ms
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-slate-500">
                            Run detection to see results
                        </div>
                    )}
                </Card>

                {/* Anomaly Detection */}
                <Card title="Anomaly Detection" subtitle="Ensemble: Autoencoder + VAE + Isolation Forest">
                    {anomalyResult ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center">
                                <div
                                    className={`w-32 h-32 rounded-full flex items-center justify-center ${anomalyResult.is_anomaly
                                            ? 'bg-yellow-500/20 border-2 border-yellow-500'
                                            : 'bg-green-500/20 border-2 border-green-500'
                                        }`}
                                >
                                    <div className="text-center">
                                        <AlertTriangle
                                            className={`w-10 h-10 mx-auto ${anomalyResult.is_anomaly ? 'text-yellow-400' : 'text-green-400'
                                                }`}
                                        />
                                        <span
                                            className={`text-2xl font-bold ${anomalyResult.is_anomaly ? 'text-yellow-400' : 'text-green-400'
                                                }`}
                                        >
                                            {(anomalyResult.anomaly_score * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Method breakdown */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Autoencoder</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 h-2 bg-slate-700 rounded-full">
                                            <div
                                                className="h-full bg-cyan-500 rounded-full"
                                                style={{ width: `${anomalyResult.method_scores.ae * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-slate-300 w-12 text-right">
                                            {(anomalyResult.method_scores.ae * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">VAE</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 h-2 bg-slate-700 rounded-full">
                                            <div
                                                className="h-full bg-purple-500 rounded-full"
                                                style={{ width: `${anomalyResult.method_scores.vae * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-slate-300 w-12 text-right">
                                            {(anomalyResult.method_scores.vae * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Isolation Forest</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-32 h-2 bg-slate-700 rounded-full">
                                            <div
                                                className="h-full bg-orange-500 rounded-full"
                                                style={{ width: `${anomalyResult.method_scores.if * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-slate-300 w-12 text-right">
                                            {(anomalyResult.method_scores.if * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center text-slate-500 text-sm">
                                Threshold: {(anomalyResult.threshold * 100).toFixed(0)}% | Latency:{' '}
                                {anomalyResult.latency_ms.toFixed(2)}ms
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-slate-500">
                            Run detection to see results
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
