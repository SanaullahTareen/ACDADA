import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { PipelineEvent, DecisionAction } from '../../api/types';
import { useMemo } from 'react';

interface DecisionDistributionChartProps {
    events: PipelineEvent[];
}

const COLORS: Record<DecisionAction, string> = {
    block_and_redirect: '#ef4444',
    deploy_deception: '#a855f7',
    increase_monitoring: '#3b82f6',
    observe: '#6b7280',
    allow: '#22c55e',
};

const LABELS: Record<DecisionAction, string> = {
    block_and_redirect: 'Block',
    deploy_deception: 'Deception',
    increase_monitoring: 'Monitor',
    observe: 'Observe',
    allow: 'Allow',
};

export function DecisionDistributionChart({ events }: DecisionDistributionChartProps) {
    const data = useMemo(() => {
        const counts: Record<DecisionAction, number> = {
            block_and_redirect: 0,
            deploy_deception: 0,
            increase_monitoring: 0,
            observe: 0,
            allow: 0,
        };
        events.forEach((e) => {
            if (e.decision in counts) counts[e.decision]++;
        });
        return Object.entries(counts)
            .filter(([, value]) => value > 0)
            .map(([name, value]) => ({
                name: LABELS[name as DecisionAction],
                value,
                fill: COLORS[name as DecisionAction],
            }));
    }, [events]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-gray-500">
                No decision data yet
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={200}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#f3f4f6' }}
                />
                <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value) => <span style={{ color: '#9ca3af' }}>{value}</span>}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
