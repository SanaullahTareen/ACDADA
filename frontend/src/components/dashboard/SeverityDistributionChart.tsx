import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { PipelineEvent, SeverityLevel } from '../../api/types';
import { useMemo } from 'react';

interface SeverityDistributionChartProps {
    events: PipelineEvent[];
}

const COLORS: Record<SeverityLevel, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
};

export function SeverityDistributionChart({ events }: SeverityDistributionChartProps) {
    const data = useMemo(() => {
        const counts: Record<SeverityLevel, number> = { critical: 0, high: 0, medium: 0, low: 0 };
        events.forEach((e) => {
            if (e.severity in counts) counts[e.severity]++;
        });
        return Object.entries(counts).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
            fill: COLORS[name as SeverityLevel],
        }));
    }, [events]);

    return (
        <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} layout="vertical">
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    width={80}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#f3f4f6' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
