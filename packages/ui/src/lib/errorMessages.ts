export interface ErrorMessage {
  pattern: RegExp;
  title: string;
  description: string;
  suggestion: string;
  icon: string;
  recoverable: boolean;
}

export const ERROR_MESSAGES: ErrorMessage[] = [
  {
    pattern: /ECONNREFUSED|connection refused/i,
    title: 'Connection Refused',
    description: 'The server is not running or not reachable.',
    suggestion: 'Make sure the OpenCode server is running. Try restarting it from the terminal.',
    icon: 'cloud-off',
    recoverable: true,
  },
  {
    pattern: /ETIMEDOUT|timeout/i,
    title: 'Request Timeout',
    description: 'The request took too long to complete.',
    suggestion: 'The server might be busy. Try again in a moment.',
    icon: 'hourglass',
    recoverable: true,
  },
  {
    pattern: /401|unauthorized|invalid.*api.*key/i,
    title: 'Authentication Error',
    description: 'Your API key is invalid or has expired.',
    suggestion: 'Check your API key in Settings > Providers.',
    icon: 'shield-keyhole',
    recoverable: false,
  },
  {
    pattern: /403|forbidden|access.*denied/i,
    title: 'Access Denied',
    description: 'You don\'t have permission to access this resource.',
    suggestion: 'Check your account permissions or try a different provider.',
    icon: 'lock',
    recoverable: false,
  },
  {
    pattern: /404|not found/i,
    title: 'Not Found',
    description: 'The requested resource could not be found.',
    suggestion: 'Check the URL or resource path.',
    icon: 'file-search',
    recoverable: false,
  },
  {
    pattern: /429|rate.?limit|too many requests/i,
    title: 'Rate Limited',
    description: 'Too many requests. Please wait before trying again.',
    suggestion: 'Wait a moment and try again, or switch to a different model.',
    icon: 'timer',
    recoverable: true,
  },
  {
    pattern: /500|internal.*server.*error|server.*error/i,
    title: 'Server Error',
    description: 'Something went wrong on the server side.',
    suggestion: 'Try again in a moment. If the problem persists, restart the server.',
    icon: 'error-warning',
    recoverable: true,
  },
  {
    pattern: /network|fetch.*failed|ERR_NETWORK/i,
    title: 'Network Error',
    description: 'Unable to connect to the network.',
    suggestion: 'Check your internet connection and try again.',
    icon: 'cloud-off',
    recoverable: true,
  },
  {
    pattern: /quota|limit.*exceeded|insufficient.*credits/i,
    title: 'Quota Exceeded',
    description: 'You\'ve reached your usage limit.',
    suggestion: 'Wait for your quota to reset or upgrade your plan.',
    icon: 'bar-chart-box',
    recoverable: false,
  },
  {
    pattern: /model.*not.*available|model.*not.*found/i,
    title: 'Model Unavailable',
    description: 'The selected model is not available.',
    suggestion: 'Try a different model from the model selector.',
    icon: 'brain',
    recoverable: true,
  },
  {
    pattern: /file.*not.*found|ENOENT/i,
    title: 'File Not Found',
    description: 'The file you\'re trying to access doesn\'t exist.',
    suggestion: 'Check the file path and make sure the file exists.',
    icon: 'file',
    recoverable: false,
  },
  {
    pattern: /permission.*denied|EACCES/i,
    title: 'Permission Denied',
    description: 'You don\'t have permission to access this file or directory.',
    suggestion: 'Check file permissions or run with appropriate access.',
    icon: 'shield',
    recoverable: false,
  },
];

export function matchError(error: string | Error): ErrorMessage | null {
  const message = typeof error === 'string' ? error : error.message;
  for (const entry of ERROR_MESSAGES) {
    if (entry.pattern.test(message)) {
      return entry;
    }
  }
  return null;
}

export function getErrorTitle(error: string | Error): string {
  const match = matchError(error);
  return match?.title ?? 'Unknown Error';
}

export function getErrorSuggestion(error: string | Error): string {
  const match = matchError(error);
  return match?.suggestion ?? 'Try again or check the console for details.';
}
