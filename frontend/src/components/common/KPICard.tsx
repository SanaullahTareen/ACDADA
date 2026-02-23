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
    cyan: 'border-sky-500/20 bg-sky-500/5 hover:border-sky-500/40 hover:bg-sky-500/10',
    green: 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 hover:bg-emerald-500/10',
    red: 'border-rose-500/20 bg-rose-500/5 hover:border-rose-500/40 hover:bg-rose-500/10',
    yellow: 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 hover:bg-amber-500/10',
    purple: 'border-violet-500/20 bg-violet-500/5 hover:border-violet-500/40 hover:bg-violet-500/10',
    blue: 'border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40 hover:bg-blue-500/10',
};

const textColors = {
    cyan: 'text-sky-400',
    green: 'text-emerald-400',
    red: 'text-rose-400',
    yellow: 'text-amber-400',
    purple: 'text-violet-400',
    blue: 'text-blue-400',
};

const iconBgColors = {
    cyan: 'bg-sky-500/10',
    green: 'bg-emerald-500/10',
    red: 'bg-rose-500/10',
    yellow: 'bg-amber-500/10',
    purple: 'bg-violet-500/10',
    blue: 'bg-blue-500/10',
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
                'rounded-xl border p-4 transition-all duration-200 backdrop-blur-sm',
                colorClasses[color],
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-400">{title}</p>
                    <p className={clsx('text-2xl font-bold mt-1 tracking-tight', textColors[color])}>{value}</p>
                    {trendValue && (
                        <p
                            className={clsx(
                                'text-xs mt-2 font-medium',
                                trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-500'
                            )}
                        >
                            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
                        </p>
                    )}
                </div>
                {icon && <div className={clsx('p-2.5 rounded-lg', iconBgColors[color])}>{icon}</div>}
            </div>
        </div>
    );
}
