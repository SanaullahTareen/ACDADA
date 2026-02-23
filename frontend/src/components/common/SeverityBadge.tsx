import clsx from 'clsx';
import type { SeverityLevel } from '../../api/types';
import { SEVERITY_COLORS } from '../../api/types';

interface SeverityBadgeProps {
    severity: SeverityLevel;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
};

export function SeverityBadge({ severity, size = 'md', className }: SeverityBadgeProps) {
    return (
        <span
            className={clsx(
                'inline-flex items-center rounded-full font-medium uppercase border',
                SEVERITY_COLORS[severity],
                sizeClasses[size],
                className
            )}
        >
            {severity}
        </span>
    );
}
