import {logWarn, logError} from './appLogger';

const DEFAULT_TIMEOUT_MS = 12000;

export class ApiError extends Error {
  constructor(message, status = 0, code = 'API_ERROR', details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function timeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  return {controller, timeout};
}

async function parseResponseBody(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toApiError(error, context) {
  if (error instanceof ApiError) {
    return error;
  }
  if (error?.name === 'AbortError') {
    return new ApiError('Request timed out. Please try again.', 0, 'TIMEOUT', {
      context,
    });
  }
  return new ApiError(
    'Unable to connect right now. Please check your internet and try again.',
    0,
    'NETWORK',
    {context},
  );
}

export async function requestJson(url, options = {}, context = 'request') {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const {controller, timeout} = timeoutSignal(timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });

    const body = await parseResponseBody(response);

    if (!response.ok) {
      throw new ApiError(
        body?.message || 'Request failed. Please try again.',
        response.status,
        'HTTP_ERROR',
        {context, body},
      );
    }

    return body;
  } catch (error) {
    const apiError = toApiError(error, context);
    if (apiError.code === 'TIMEOUT' || apiError.code === 'NETWORK') {
      logWarn('network_request_failed', {context, code: apiError.code});
    } else {
      logError('network_request_failed', {
        context,
        code: apiError.code,
        status: apiError.status,
      });
    }
    throw apiError;
  } finally {
    clearTimeout(timeout);
  }
}
