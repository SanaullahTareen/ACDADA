import clsx from 'clsx';
import type { DecisionAction } from '../../api/types';
import { DECISION_COLORS } from '../../api/types';

interface DecisionBadgeProps {
    decision: DecisionAction;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
};

const labels: Record<DecisionAction, string> = {
    block_and_redirect: 'Block & Redirect',
    deploy_deception: 'Deploy Deception',
    increase_monitoring: 'Increase Monitoring',
    observe: 'Observe',
    allow: 'Allow',
};

export function DecisionBadge({ decision, size = 'md', className }: DecisionBadgeProps) {
    return (
        <span
            className={clsx(
                'inline-flex items-center rounded-full font-medium',
                DECISION_COLORS[decision],
                sizeClasses[size],
                className
            )}
        >
            {labels[decision]}
        </span>
    );
}
