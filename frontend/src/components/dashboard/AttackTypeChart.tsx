import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { PipelineEvent } from '../../api/types';
import { ATTACK_TYPES } from '../../api/types';
import { useMemo } from 'react';

interface AttackTypeChartProps {
    events: PipelineEvent[];
}

export function AttackTypeChart({ events }: AttackTypeChartProps) {
    const data = useMemo(() => {
        const counts: Record<string, number> = {};
        ATTACK_TYPES.forEach((t) => (counts[t] = 0));

        events.forEach((e) => {
            if (e.attack_type && e.attack_type in counts) {
                counts[e.attack_type]++;
            }
        });

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [events]);

    return (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
                <XAxis
                    dataKey="name"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#f3f4f6' }}
                />
                <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
