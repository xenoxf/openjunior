type RecoveryAction = () => Promise<boolean>;

interface RecoveryAttempt {
  error: string;
  action: RecoveryAction;
  maxAttempts: number;
  attempt: number;
  lastAttempt: number;
}

const RECOVERY_TIMEOUT_MS = 30000;
const RECOVERY_RETRY_BASE_MS = 1000;

const activeRecoveries = new Map<string, RecoveryAttempt>();

function recoveryKey(error: string): string {
  if (/ECONNREFUSED|connection refused/i.test(error)) return 'connection';
  if (/ETIMEDOUT|timeout|fetch.*failed|ERR_NETWORK/i.test(error)) return 'network';
  if (/429|rate.?limit|too many requests/i.test(error)) return 'rate-limit';
  if (/500|internal.*server.*error/i.test(error)) return 'server-error';
  if (/model.*not.*available|model.*not.*found/i.test(error)) return 'model';
  return 'generic';
}

export function registerAutoRecovery(
  error: string,
  action: RecoveryAction,
  maxAttempts = 3,
): void {
  const key = recoveryKey(error);
  const existing = activeRecoveries.get(key);

  if (existing) {
    existing.attempt++;
    existing.lastAttempt = Date.now();
    return;
  }

  activeRecoveries.set(key, {
    error,
    action,
    maxAttempts,
    attempt: 1,
    lastAttempt: Date.now(),
  });
}

export async function attemptAutoRecovery(error: string): Promise<boolean> {
  const key = recoveryKey(error);
  const recovery = activeRecoveries.get(key);

  if (!recovery) return false;
  if (Date.now() - recovery.lastAttempt > RECOVERY_TIMEOUT_MS) {
    activeRecoveries.delete(key);
    return false;
  }
  if (recovery.attempt > recovery.maxAttempts) {
    activeRecoveries.delete(key);
    return false;
  }

  const delay = Math.min(
    RECOVERY_RETRY_BASE_MS * Math.pow(2, recovery.attempt - 1),
    8000,
  );

  await new Promise((r) => setTimeout(r, delay));

  try {
    const ok = await recovery.action();
    if (ok) {
      activeRecoveries.delete(key);
      return true;
    }
  } catch {
    // retry will count as next attempt
  }

  recovery.attempt++;
  recovery.lastAttempt = Date.now();
  return false;
}

export function isRecovering(error: string): boolean {
  const key = recoveryKey(error);
  return activeRecoveries.has(key);
}

export function clearRecovery(error: string): void {
  const key = recoveryKey(error);
  activeRecoveries.delete(key);
}

export async function withAutoRecovery<T>(
  fn: () => Promise<T>,
  onError: (error: string) => RecoveryAction | null,
  onRecovered?: () => void,
  onExhausted?: (error: string) => void,
): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const action = onError(message);
    if (!action) throw err;

    registerAutoRecovery(message, action);

    const recovered = await attemptAutoRecovery(message);
    if (recovered) {
      onRecovered?.();
      return await fn();
    }

    onExhausted?.(message);
    return null;
  }
}
