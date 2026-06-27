import React from 'react';
import { Icon } from '@/components/icon/Icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { matchError } from '@/lib/errorMessages';

interface ErrorRecoveryProps {
  error: string | Error;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorRecovery: React.FC<ErrorRecoveryProps> = ({
  error,
  onRetry,
  onDismiss,
  className,
}) => {
  const errorInfo = React.useMemo(() => matchError(error), [error]);
  const message = typeof error === 'string' ? error : error.message;

  if (!errorInfo) {
    return (
      <div className={cn('flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4', className)}>
        <div className="flex items-start gap-3">
          <Icon name="error-warning" className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="typography-ui-header font-medium text-foreground">Error</h4>
            <p className="typography-ui-label text-muted-foreground mt-1 break-words">{message}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-8">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <Icon name="refresh" className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3 rounded-lg border border-border bg-card p-4', className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon name={errorInfo.icon as 'error-warning' | 'cloud-off' | 'hourglass' | 'shield-keyhole' | 'lock' | 'file-search' | 'timer' | 'bar-chart-box' | 'brain' | 'file' | 'shield'} className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="typography-ui-header font-medium text-foreground">{errorInfo.title}</h4>
          <p className="typography-ui-label text-muted-foreground mt-1">{errorInfo.description}</p>
        </div>
      </div>

      <div className="rounded-md bg-muted/50 px-3 py-2">
        <p className="typography-ui-label text-muted-foreground">{errorInfo.suggestion}</p>
      </div>

      <div className="flex items-center gap-2">
        {errorInfo.recoverable && onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <Icon name="refresh" className="h-3.5 w-3.5 mr-1.5" />
            Try Again
          </Button>
        )}
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </div>
    </div>
  );
};
