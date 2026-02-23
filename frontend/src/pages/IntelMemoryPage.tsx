import { useState } from 'react';
import { Search, Brain, Target, Clock, Tag, BarChart3 } from 'lucide-react';
import { queryThreatIntel, profileAttack } from '../api/endpoints';
import type { ThreatIntelResponse, AttackProfileResponse } from '../api/types';
import { Card, LoadingSpinner } from '../components/common';

export function IntelMemoryPage() {
    const [query, setQuery] = useState('');
    const [intelResult, setIntelResult] = useState<ThreatIntelResponse | null>(null);
    const [profileResult, setProfileResult] = useState<AttackProfileResponse | null>(null);
    const [loading, setLoading] = useState<'intel' | 'profile' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [indicators, setIndicators] = useState('');

    const handleQueryIntel = async () => {
        if (!query.trim()) return;
        setLoading('intel');
        setError(null);
        try {
            const res = await queryThreatIntel({ description: query, k: 5 });
            setIntelResult(res);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Intel query failed');
        } finally {
            setLoading(null);
        }
    };

    const handleProfileAttack = async () => {
        if (!indicators.trim()) return;
        setLoading('profile');
        setError(null);
        try {
            const indicatorList = indicators.split(',').map((i) => i.trim()).filter(Boolean);
            const res = await profileAttack({ indicators: indicatorList });
            setProfileResult(res);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Profile query failed');
        } finally {
            setLoading(null);
        }
    };

    const getSeverityColor = (severity: string): string => {
        switch (severity.toLowerCase()) {
            case 'critical':
                return 'text-red-400 bg-red-500/20';
            case 'high':
                return 'text-orange-400 bg-orange-500/20';
            case 'medium':
                return 'text-yellow-400 bg-yellow-500/20';
            case 'low':
                return 'text-green-400 bg-green-500/20';
            default:
                return 'text-gray-400 bg-gray-500/20';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-100">Threat Intelligence Memory</h2>
                <p className="text-gray-400 mt-1">
                    RAG-based CTI retrieval with semantic search and attack profiling
                </p>
            </div>

            {/* Intel Query */}
            <Card title="CTI Search">
                <div className="space-y-4">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleQueryIntel()}
                            placeholder="Describe the threat (e.g., 'ransomware encryption methods')"
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <button
                            onClick={handleQueryIntel}
                            disabled={loading === 'intel' || !query.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 rounded-lg text-white transition-colors"
                        >
                            {loading === 'intel' ? <LoadingSpinner size="sm" /> : <Search className="w-4 h-4" />}
                            Search
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                            {error}
                        </div>
                    )}

                    {intelResult && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-gray-700/50 rounded-lg">
                                    <span className="text-gray-400 text-sm block mb-1">Likely Category</span>
                                    <span className="text-lg font-bold text-cyan-400">{intelResult.likely_category}</span>
                                </div>
                                <div className="p-4 bg-gray-700/50 rounded-lg">
                                    <span className="text-gray-400 text-sm block mb-1">Likely Severity</span>
                                    <span
                                        className={`text-lg font-bold px-2 py-1 rounded ${getSeverityColor(intelResult.likely_severity)}`}
                                    >
                                        {intelResult.likely_severity}
                                    </span>
                                </div>
                                <div className="p-4 bg-gray-700/50 rounded-lg">
                                    <span className="text-gray-400 text-sm block mb-1">Confidence</span>
                                    <span className="text-lg font-bold text-gray-200">
                                        {(intelResult.confidence * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            {/* Tags */}
                            {intelResult.top_tags.length > 0 && (
                                <div className="p-4 bg-gray-700/50 rounded-lg">
                                    <span className="text-gray-400 text-sm block mb-2">Top Tags</span>
                                    <div className="flex flex-wrap gap-2">
                                        {intelResult.top_tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="flex items-center gap-1 px-2 py-1 bg-cyan-500/20 text-cyan-400 text-sm rounded"
                                            >
                                                <Tag className="w-3 h-3" />
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Similar Threats */}
                            {intelResult.similar_threats.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-medium text-gray-200">Similar Threats</h4>
                                    {intelResult.similar_threats.map((threat, index) => (
                                        <div key={index} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <p className="text-gray-200">{threat.text}</p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <span className="text-xs text-gray-500">Category: {threat.category}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded ${getSeverityColor(threat.severity)}`}>
                                                            {threat.severity}
                                                        </span>
                                                    </div>
                                                    {threat.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {threat.tags.slice(0, 5).map((tag, i) => (
                                                                <span key={i} className="text-xs text-gray-500">
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-cyan-400">
                                                        {(threat.similarity * 100).toFixed(0)}%
                                                    </div>
                                                    <span className="text-xs text-gray-500">similarity</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Recommendations */}
                            {intelResult.recommendations.length > 0 && (
                                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                                    <h4 className="font-medium text-green-400 mb-2">Recommendations</h4>
                                    <ul className="space-y-1">
                                        {intelResult.recommendations.map((rec, index) => (
                                            <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                                                <span className="text-green-400 mt-1">•</span>
                                                {rec}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>

            {/* Attack Profiler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Attack Profiler">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">
                                Enter IOCs (comma-separated IPs, domains, hashes):
                            </label>
                            <textarea
                                value={indicators}
                                onChange={(e) => setIndicators(e.target.value)}
                                placeholder="e.g., 192.168.1.1, malware.example.com, abc123..."
                                className="w-full h-20 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                            />
                        </div>
                        <button
                            onClick={handleProfileAttack}
                            disabled={loading === 'profile' || !indicators.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 rounded-lg text-white transition-colors"
                        >
                            {loading === 'profile' ? <LoadingSpinner size="sm" /> : <Brain className="w-4 h-4" />}
                            Profile Indicators
                        </button>

                        {profileResult && (
                            <div className="space-y-4 mt-4">
                                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="w-4 h-4 text-purple-400" />
                                        <span className="font-medium text-purple-400">Profile Summary</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-gray-400 text-sm block">Indicators Analyzed</span>
                                            <span className="text-xl font-bold text-gray-200">{profileResult.n_indicators}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 text-sm block">Overall Severity</span>
                                            <span
                                                className={`text-xl font-bold px-2 py-1 rounded ${getSeverityColor(profileResult.overall_severity)}`}
                                            >
                                                {profileResult.overall_severity}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {profileResult && (
                    <div className="space-y-6">
                        {/* Attack Categories */}
                        <Card title="Attack Categories">
                            <div className="space-y-3">
                                {Object.entries(profileResult.attack_categories).map(([category, count]) => (
                                    <div key={category} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4 text-cyan-400" />
                                            <span className="text-gray-300">{category}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-gray-600 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-cyan-500 rounded-full"
                                                    style={{
                                                        width: `${Math.min(100, (count / profileResult.n_indicators) * 100)}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm text-gray-400 w-8">{count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Recommendations */}
                        <Card title="Recommended Actions">
                            <div className="space-y-2">
                                {profileResult.recommendations.map((rec, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg"
                                    >
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        <span className="text-gray-300 text-sm">{rec}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex items-center gap-1 text-sm text-gray-400">
                                <Clock className="w-3 h-3" />
                                Analysis complete
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* Info */}
            <Card title="About Threat Intelligence Memory">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-700/50 rounded-lg">
                        <h4 className="font-medium text-cyan-400 mb-2">Vector Store</h4>
                        <p className="text-sm text-gray-400">
                            ChromaDB with sentence-transformers embeddings. 10k+ CTI documents indexed.
                        </p>
                    </div>
                    <div className="p-4 bg-gray-700/50 rounded-lg">
                        <h4 className="font-medium text-cyan-400 mb-2">RAG Pipeline</h4>
                        <p className="text-sm text-gray-400">
                            Retrieval-augmented generation with top-k semantic search and reranking.
                        </p>
                    </div>
                    <div className="p-4 bg-gray-700/50 rounded-lg">
                        <h4 className="font-medium text-cyan-400 mb-2">Attack Profiles</h4>
                        <p className="text-sm text-gray-400">
                            MITRE ATT&CK aligned profiles with TTPs and recommended mitigations.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
