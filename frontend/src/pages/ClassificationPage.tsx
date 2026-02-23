import { useState } from 'react';
import { Crosshair } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { classifyAttack } from '../api/endpoints';
import type { ClassifyResponse } from '../api/types';
import { Card, LoadingSpinner } from '../components/common';
import { ATTACK_TYPES } from '../api/types';

const COLORS = [
    '#22c55e', // Benign - green
    '#ef4444', // DDoS - red
    '#f97316', // DoS - orange
    '#eab308', // BruteForce - yellow
    '#a855f7', // Botnet - purple
    '#3b82f6', // PortScan - blue
    '#ec4899', // SQL-Injection - pink
    '#6b7280', // Other - gray
];

export function ClassificationPage() {
    const [features, setFeatures] = useState<string>('');
    const [result, setResult] = useState<ClassifyResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const parseFeatures = (input: string): number[] => {
        if (!input.trim()) {
            return Array.from({ length: 78 }, () => Math.random());
        }
        return input.split(',').map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v));
    };

    const handleClassify = async () => {
        setLoading(true);
        setError(null);
        try {
            const featArray = parseFeatures(features);
            if (featArray.length < 10) {
                throw new Error('At least 10 features required');
            }
            const res = await classifyAttack({ features: featArray });
            setResult(res);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Classification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateRandom = () => {
        const randomFeats = Array.from({ length: 78 }, () => Math.random().toFixed(4));
        setFeatures(randomFeats.join(', '));
    };

    const chartData = result
        ? Object.entries(result.probabilities).map(([name, value]) => ({
            name,
            value: value * 100,
            fill: COLORS[ATTACK_TYPES.indexOf(name as typeof ATTACK_TYPES[number])] || '#6b7280',
        }))
        : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-100">Attack Classification</h2>
                <p className="text-gray-400 mt-1">
                    Multi-class classification using XGBoost + DNN ensemble
                </p>
            </div>

            {/* Input */}
            <Card title="Feature Input">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            Enter feature vector (comma-separated):
                        </label>
                        <textarea
                            value={features}
                            onChange={(e) => setFeatures(e.target.value)}
                            placeholder="Leave empty for random features"
                            className="w-full h-24 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleClassify}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 rounded-lg text-white transition-colors"
                        >
                            {loading ? <LoadingSpinner size="sm" /> : <Crosshair className="w-4 h-4" />}
                            Classify Attack
                        </button>
                        <button
                            onClick={handleGenerateRandom}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
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
                {/* Prediction */}
                <Card title="Classification Result">
                    {result ? (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-cyan-500/20 border-2 border-cyan-500 mb-4">
                                    <Crosshair className="w-10 h-10 text-cyan-400" />
                                </div>
                                <h3 className="text-3xl font-bold text-cyan-400">{result.attack_type}</h3>
                                <p className="text-gray-400 mt-1">
                                    Confidence: {(result.confidence * 100).toFixed(1)}%
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                                    <span className="text-gray-400 text-sm block">Class ID</span>
                                    <span className="text-xl font-bold text-gray-200">{result.attack_type_id}</span>
                                </div>
                                <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                                    <span className="text-gray-400 text-sm block">Latency</span>
                                    <span className="text-xl font-bold text-gray-200">
                                        {result.latency_ms.toFixed(1)}ms
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-gray-500">
                            Run classification to see results
                        </div>
                    )}
                </Card>

                {/* Probability distribution */}
                <Card title="Class Probabilities">
                    {result ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData} layout="vertical">
                                <XAxis
                                    type="number"
                                    domain={[0, 100]}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickFormatter={(v) => `${v}%`}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    width={90}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1f2937',
                                        border: '1px solid #374151',
                                        borderRadius: '8px',
                                    }}
                                    formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Probability']}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={index} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Run classification to see probability distribution
                        </div>
                    )}
                </Card>
            </div>

            {/* Attack Types Reference */}
            <Card title="Attack Types Reference">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {ATTACK_TYPES.map((type, index) => (
                        <div
                            key={type}
                            className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-lg"
                        >
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[index] }}
                            />
                            <span className="text-gray-300 text-sm">{type}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
