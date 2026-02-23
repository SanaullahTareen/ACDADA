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
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    }}
                    labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
