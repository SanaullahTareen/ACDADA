import type { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
    title?: string;
    subtitle?: string;
    children: ReactNode;
    className?: string;
    headerAction?: ReactNode;
    icon?: ReactNode;
}

export function Card({ title, subtitle, children, className, headerAction, icon }: CardProps) {
    return (
        <div className={clsx(
            'bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-xl shadow-slate-950/50 backdrop-blur-sm',
            className
        )}>
            {(title || headerAction || icon) && (
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                        {icon && <span className="text-blue-400 p-2 bg-blue-500/10 rounded-lg">{icon}</span>}
                        <div>
                            {title && <h3 className="text-base font-semibold text-slate-100">{title}</h3>}
                            {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
                        </div>
                    </div>
                    {headerAction}
                </div>
            )}
            <div className="p-5">{children}</div>
        </div>
    );
}
