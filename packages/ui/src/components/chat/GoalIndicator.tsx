import React from 'react';
import { useGoalStore } from '@/stores/useGoalStore';
import { useSessionUIStore } from '@/sync/session-ui-store';
import { Icon } from '@/components/icon/Icon';

export const GoalIndicator = React.memo(() => {
    const currentSessionId = useSessionUIStore((s) => s.currentSessionId);
    const goal = useGoalStore((s) => currentSessionId ? s.goals[currentSessionId] : null);

    if (!goal) return null;

    const duration = Math.round((Date.now() - goal.createdAt) / 1000);
    const minutes = Math.floor(duration / 60);
    const timeStr = minutes > 0 ? `${minutes}m` : `${duration}s`;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[color-mix(in_srgb,var(--primary-base)_10%,transparent)] border border-[color-mix(in_srgb,var(--primary-base)_20%,transparent)]">
            <Icon name="compass-3" className="h-3.5 w-3.5 text-[var(--primary-base)] flex-shrink-0" />
            <span className="text-xs text-foreground truncate flex-1">{goal.text}</span>
            <span className="text-[10px] text-muted-foreground flex-shrink-0 whitespace-nowrap">
                {goal.turnCount}t · {timeStr}
            </span>
        </div>
    );
});

GoalIndicator.displayName = 'GoalIndicator';
