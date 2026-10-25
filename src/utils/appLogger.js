const RELEASE_LOG_PREFIX = '[reparv]';

function sanitizeMeta(meta) {
  if (!meta || typeof meta !== 'object') {
    return undefined;
  }

  const clone = {};
  Object.keys(meta).forEach(key => {
    const value = meta[key];
    if (value === undefined || value === null) {
      return;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      clone[key] = value;
    }
  });

  return Object.keys(clone).length > 0 ? clone : undefined;
}

function writeLog(level, event, meta) {
  const payload = sanitizeMeta(meta);
  const message = `${RELEASE_LOG_PREFIX} ${event}`;

  if (__DEV__) {
    console[level](message, payload ?? '');
    return;
  }

  if (level === 'error' || level === 'warn') {
    console[level](message);
  }
}

export function logInfo(event, meta) {
  writeLog('info', event, meta);
}

export function logWarn(event, meta) {
  writeLog('warn', event, meta);
}

export function logError(event, meta) {
  writeLog('error', event, meta);
}
