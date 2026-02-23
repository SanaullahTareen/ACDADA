import { useEffect, useState } from 'react';
import { RefreshCw, Filter, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { getEvents } from '../api/endpoints';
import type { StoredEvent, SeverityLevel } from '../api/types';
import { Card, LoadingSpinner, SeverityBadge, DecisionBadge } from '../components/common';

const PAGE_SIZE = 20;

export function EventsPage() {
    const [events, setEvents] = useState<StoredEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [filters, setFilters] = useState({
        severity: '' as SeverityLevel | '',
        is_threat: '' as 'true' | 'false' | '',
        attack_type: '',
    });
    const [showFilters, setShowFilters] = useState(false);

    const fetchEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, string | number> = {
                skip: page * PAGE_SIZE,
                limit: PAGE_SIZE,
            };
            if (filters.severity) params.severity = filters.severity;
            if (filters.is_threat) params.is_threat = filters.is_threat;
            if (filters.attack_type) params.attack_type = filters.attack_type;

            const res = await getEvents(params);
            setEvents(res.events);
            setTotalPages(Math.ceil(res.total / PAGE_SIZE));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch events');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [page, filters]);

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setPage(0);
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const formatTimestamp = (ts: string) => {
        return new Date(ts).toLocaleString();
    };

    const handleExport = () => {
        const csv = [
            ['Event ID', 'Timestamp', 'Is Threat', 'Severity', 'Attack Type', 'Confidence', 'Decision'].join(','),
            ...events.map((e) =>
                [
                    e.event_id,
                    e.timestamp,
                    e.is_threat,
                    e.severity,
                    e.attack_type || '',
                    e.confidence.toFixed(3),
                    e.decision,
                ].join(',')
            ),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `events-export-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-100">Events</h2>
                    <p className="text-gray-400 mt-1">
                        Browse and filter processed security events
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showFilters ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button
                        onClick={fetchEvents}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 rounded-lg text-gray-300 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <Card>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Severity</label>
                            <select
                                value={filters.severity}
                                onChange={(e) => handleFilterChange('severity', e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="">All</option>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Threat Status</label>
                            <select
                                value={filters.is_threat}
                                onChange={(e) => handleFilterChange('is_threat', e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="">All</option>
                                <option value="true">Threats Only</option>
                                <option value="false">Benign Only</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Attack Type</label>
                            <select
                                value={filters.attack_type}
                                onChange={(e) => handleFilterChange('attack_type', e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="">All</option>
                                <option value="Benign">Benign</option>
                                <option value="DDoS">DDoS</option>
                                <option value="DoS">DoS</option>
                                <option value="BruteForce">BruteForce</option>
                                <option value="Botnet">Botnet</option>
                                <option value="PortScan">PortScan</option>
                                <option value="Injection">Injection</option>
                            </select>
                        </div>
                    </div>
                </Card>
            )}

            {/* Table */}
            <Card>
                {error ? (
                    <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                        {error}
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center h-64">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                        No events found
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                                        Event ID
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                                        Timestamp
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                                        Threat
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                                        Severity
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                                        Attack Type
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                                        Confidence
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                                        Decision
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((event) => (
                                    <tr
                                        key={event.event_id}
                                        className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-sm text-gray-300">
                                                {event.event_id.slice(0, 8)}...
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-400">
                                            {formatTimestamp(event.timestamp)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`px-2 py-1 text-xs rounded ${event.is_threat
                                                    ? 'bg-red-500/20 text-red-400'
                                                    : 'bg-green-500/20 text-green-400'
                                                    }`}
                                            >
                                                {event.is_threat ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <SeverityBadge severity={event.severity} />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-300">
                                            {event.attack_type || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-cyan-500 rounded-full"
                                                        style={{ width: `${event.confidence * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-gray-400">
                                                    {(event.confidence * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <DecisionBadge decision={event.decision} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && events.length > 0 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                        <span className="text-sm text-gray-400">
                            Page {page + 1} of {totalPages || 1}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 disabled:text-gray-500 rounded text-gray-300 text-sm transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 disabled:text-gray-500 rounded text-gray-300 text-sm transition-colors"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
