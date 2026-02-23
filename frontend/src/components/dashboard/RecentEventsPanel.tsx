import type { PipelineEvent } from '../../api/types';
import { SeverityBadge } from '../common/SeverityBadge';
import { DecisionBadge } from '../common/DecisionBadge';

interface RecentEventsPanelProps {
    events: PipelineEvent[];
    maxItems?: number;
}

export function RecentEventsPanel({ events, maxItems = 10 }: RecentEventsPanelProps) {
    const recentEvents = events.slice(0, maxItems);

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour12: false });
    };

    if (recentEvents.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-gray-500">
                No events yet. Start a simulation or connect to the backend.
            </div>
        );
    }

    return (
        <div className="space-y-2 max-h-96 overflow-y-auto">
            {recentEvents.map((event) => (
                <div
                    key={event.flow_id + event.timestamp}
                    className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 font-mono w-20">
                            {formatTime(event.timestamp)}
                        </span>
                        <SeverityBadge severity={event.severity} size="sm" />
                        {event.attack_type && (
                            <span className="text-sm text-gray-300">{event.attack_type}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <DecisionBadge decision={event.decision} size="sm" />
                        <span className="text-xs text-gray-500 font-mono">
                            {event.processing_time_ms.toFixed(1)}ms
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
