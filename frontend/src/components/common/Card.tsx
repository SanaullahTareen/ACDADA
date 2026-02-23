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
        <div className={clsx('bg-gray-800 rounded-xl border border-gray-700 shadow-lg', className)}>
            {(title || headerAction || icon) && (
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                        {icon && <span className="text-cyan-400">{icon}</span>}
                        <div>
                            {title && <h3 className="text-lg font-semibold text-gray-100">{title}</h3>}
                            {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
                        </div>
                    </div>
                    {headerAction}
                </div>
            )}
            <div className="p-5">{children}</div>
        </div>
    );
}
