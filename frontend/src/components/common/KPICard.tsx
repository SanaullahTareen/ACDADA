import type { ReactNode } from 'react';
import clsx from 'clsx';

interface KPICardProps {
    title: string;
    value: string | number;
    icon?: ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color?: 'cyan' | 'green' | 'red' | 'yellow' | 'purple' | 'blue';
    className?: string;
}

const colorClasses = {
    cyan: 'border-cyan-500/30 bg-cyan-500/10',
    green: 'border-green-500/30 bg-green-500/10',
    red: 'border-red-500/30 bg-red-500/10',
    yellow: 'border-yellow-500/30 bg-yellow-500/10',
    purple: 'border-purple-500/30 bg-purple-500/10',
    blue: 'border-blue-500/30 bg-blue-500/10',
};

const textColors = {
    cyan: 'text-cyan-400',
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
    blue: 'text-blue-400',
};

export function KPICard({
    title,
    value,
    icon,
    trend,
    trendValue,
    color = 'cyan',
    className,
}: KPICardProps) {
    return (
        <div
            className={clsx(
                'rounded-xl border p-4 transition-all hover:scale-[1.02]',
                colorClasses[color],
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-400">{title}</p>
                    <p className={clsx('text-2xl font-bold mt-1', textColors[color])}>{value}</p>
                    {trendValue && (
                        <p
                            className={clsx(
                                'text-xs mt-1',
                                trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-500'
                            )}
                        >
                            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
                        </p>
                    )}
                </div>
                {icon && <div className={clsx('p-2 rounded-lg', colorClasses[color])}>{icon}</div>}
            </div>
        </div>
    );
}
