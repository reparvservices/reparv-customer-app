/**
 * Tuya OpenAPI — device status + switch. Credentials: `src/config/tuya.user.js` only.
 */
import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getTuyaCredentials,
  isTuyaConfigured,
} from '../config/tuyaCredentials';

const EMPTY_BODY_SHA256 =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

const FETCH_TIMEOUT_MS = 25000;
const TOKEN_KEY = 'TUYA_ACCESS_TOKEN';
const REFRESH_TOKEN_KEY = 'TUYA_REFRESH_TOKEN';
const TOKEN_EXPIRES_AT_KEY = 'TUYA_TOKEN_EXPIRES_AT';
const REFRESH_BUFFER_MS = 60 * 1000;

export {getTuyaCredentials, isTuyaConfigured};
export const getTuyaAuthConfig = getTuyaCredentials;

function requireCredentials() {
  const c = getTuyaCredentials();
  if (!c.clientId || !c.secret) {
    const err = new Error(
      '[Tuya] Missing clientId or secret — set them in src/config/tuya.user.js',
    );
    err.code = 'TUYA_NOT_CONFIGURED';
    throw err;
  }
  return c;
}

function requireDeviceContext() {
  const c = requireCredentials();
  if (!c.deviceId) {
    const err = new Error(
      '[Tuya] Missing deviceId — set it in src/config/tuya.user.js',
    );
    err.code = 'TUYA_NOT_CONFIGURED';
    throw err;
  }
  return c;
}

export function logTuyaApiError(tag, error, meta = {}) {
  if (!__DEV__) {
    return;
  }
  const line = {
    tag,
    message: error?.message,
    code: error?.code,
    httpStatus: error?.status,
    details: error?.details,
    ...meta,
  };
  console.warn('[TuyaApi]', tag, line);
  if (error?.stack) {
    console.warn('[TuyaApi]', tag, error.stack);
  }
}

export function sortQueryParams(url) {
  const [pathPart, queryString] = String(url).split('?');
  if (!queryString) {
    return pathPart;
  }
  const params = queryString
    .split('&')
    .filter(Boolean)
    .map(pair => {
      const [key, value = ''] = pair.split('=');
      return [decodeURIComponent(key), decodeURIComponent(value)];
    })
    .sort(([a], [b]) => a.localeCompare(b));
  const normalized = params
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `${pathPart}?${normalized}`;
}

function buildPathWithSortedQuery(path, params) {
  if (!params || typeof params !== 'object') {
    return path;
  }
  const keys = Object.keys(params).sort((a, b) => a.localeCompare(b));
  const qs = keys
    .map(
      k => `${encodeURIComponent(k)}=${encodeURIComponent(String(params[k]))}`,
    )
    .join('&');
  return qs ? `${path}?${qs}` : path;
}

export function generateSign(
  {clientId, secret},
  accessTokenForSign,
  method,
  pathWithQuery,
  bodyForSign,
) {
  const t = Date.now().toString();
  const m = String(method || 'GET').toUpperCase();
  const sortedPath = sortQueryParams(pathWithQuery);
  const bodyHash =
    bodyForSign && String(bodyForSign).length > 0
      ? CryptoJS.SHA256(
          typeof bodyForSign === 'string'
            ? bodyForSign
            : JSON.stringify(bodyForSign),
        ).toString(CryptoJS.enc.Hex)
      : EMPTY_BODY_SHA256;
  const stringToSign = `${m}\n${bodyHash}\n\n${sortedPath}`;
  const strToMac = `${clientId}${accessTokenForSign || ''}${t}${stringToSign}`;
  const sign = CryptoJS.HmacSHA256(strToMac, secret)
    .toString(CryptoJS.enc.Hex)
    .toUpperCase();
  return {sign, t};
}

function normalizeTuyaError(data) {
  const code = Number(data?.code);
  const msg = data?.msg || 'Tuya request failed';
  const err = new Error(code ? `[${code}] ${msg}` : msg);
  err.code = code;
  err.details = data;
  if (code === 1010) {
    err.hint =
      'Access token expired — the app will try to refresh automatically.';
  }
  if (code === 501) {
    err.hint =
      'Tuya 501 often means this route is not enabled for your project/token. The app falls back to standard device APIs when possible.';
  }
  if (code === 28841002) {
    err.hint =
      'Tuya denied this API for your current cloud plan (common on /v1.0/iot-03/... when only Energy Micro is enabled, or when the dev subscription expired). Options: (1) Renew API access in Tuya Developer Platform, or (2) Use Energy Micro in the app: set userId + assetId in src/config/tuya.user.js — get asset_id from GET /v1.0/cloud/energy/micro/assets?user_id=<uid> (same as your working curl).';
  }
  return err;
}

async function parseJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (_e) {
    const err = new Error(
      `Bad response (${res.status}): ${text.slice(0, 200)}`,
    );
    err.status = res.status;
    logTuyaApiError('parseJson', err, {snippet: text.slice(0, 400)});
    throw err;
  }
}

function fetchWithTimeout(url, options = {}, ms = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, {...options, signal: controller.signal}).finally(() =>
    clearTimeout(id),
  );
}

async function saveTokens(payload) {
  let accessToken = payload?.access_token || '';
  let refreshToken = payload?.refresh_token || '';
  if (!refreshToken) {
    const prev = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (prev) {
      refreshToken = prev;
    }
  }
  if (!accessToken) {
    const err = new Error('[Tuya] Token response missing access_token');
    err.code = 'TOKEN_RESPONSE_INVALID';
    throw err;
  }
  const expireSec = Number(payload?.expire_time || 7200);
  const expiresAt = Date.now() + expireSec * 1000;
  await AsyncStorage.multiSet([
    [TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshToken],
    [TOKEN_EXPIRES_AT_KEY, String(expiresAt)],
  ]);
  return accessToken;
}

async function getStoredTokenMeta() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const expiresAt = Number(
    (await AsyncStorage.getItem(TOKEN_EXPIRES_AT_KEY)) || 0,
  );
  return {token, expiresAt};
}

export async function createInitialTokensIfNeeded() {
  if (!isTuyaConfigured()) {
    return;
  }
  const existing = await AsyncStorage.getItem(TOKEN_KEY);
  if (existing) {
    return;
  }
  const {authCode} = requireCredentials();
  if (authCode) {
    await fetchNewAccessTokenGrant3(authCode);
    return;
  }
  await fetchNewAccessTokenGrant1();
}

/** @deprecated */
export async function seedInitialTokensIfEmpty() {
  await createInitialTokensIfNeeded();
}

export async function refreshTuyaSessionOnLaunch() {
  if (!isTuyaConfigured()) {
    return;
  }
  const {authCode} = requireCredentials();
  if (authCode) {
    // Prefer a fresh user-scoped token every time screen opens.
    await fetchNewAccessTokenGrant3(authCode);
    return;
  }
  await createInitialTokensIfNeeded();
  await getAccessToken({force: true});
}

function tokenNeedsRefresh(expiresAt) {
  if (!expiresAt) {
    return true;
  }
  return Date.now() >= expiresAt - REFRESH_BUFFER_MS;
}

async function refreshAccessToken(refreshTok) {
  const creds = requireCredentials();
  const {baseUrl, clientId, secret} = creds;
  const path = `/v1.0/token/${refreshTok}`;
  const {sign, t} = generateSign({clientId, secret}, '', 'GET', path, '');
  const url = `${baseUrl}${path}`;
  const res = await fetchWithTimeout(url, {
    method: 'GET',
    headers: {
      client_id: clientId,
      sign,
      sign_method: 'HMAC-SHA256',
      t,
    },
  });
  const json = await parseJson(res);
  if (!json?.success) {
    const err = normalizeTuyaError(json);
    logTuyaApiError('token.refresh', err, {path});
    throw err;
  }
  return saveTokens(json.result);
}

async function fetchNewAccessTokenGrant1() {
  const creds = requireCredentials();
  const {baseUrl, clientId, secret} = creds;
  const path = buildPathWithSortedQuery('/v1.0/token', {grant_type: 1});
  const {sign, t} = generateSign({clientId, secret}, '', 'GET', path, '');
  const url = `${baseUrl}${path}`;
  const res = await fetchWithTimeout(url, {
    method: 'GET',
    headers: {
      client_id: clientId,
      sign,
      sign_method: 'HMAC-SHA256',
      t,
    },
  });
  const json = await parseJson(res);
  if (!json?.success) {
    const err = normalizeTuyaError(json);
    logTuyaApiError('token.grant_type_1', err, {path});
    throw err;
  }
  return saveTokens(json.result);
}

async function fetchNewAccessTokenGrant3(authCode) {
  const creds = requireCredentials();
  const {baseUrl, clientId, secret} = creds;
  const path = buildPathWithSortedQuery('/v1.0/authorize_token', {
    code: authCode,
    grant_type: 3,
  });
  const {sign, t} = generateSign({clientId, secret}, '', 'GET', path, '');
  const url = `${baseUrl}${path}`;
  const res = await fetchWithTimeout(url, {
    method: 'GET',
    headers: {
      client_id: clientId,
      sign,
      sign_method: 'HMAC-SHA256',
      t,
    },
  });
  const json = await parseJson(res);
  if (!json?.success) {
    const err = normalizeTuyaError(json);
    logTuyaApiError('token.grant_type_3', err, {path});
    throw err;
  }
  return saveTokens(json.result);
}

async function obtainFreshAccessToken() {
  const {authCode} = requireCredentials();
  const refreshTok = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  if (refreshTok) {
    try {
      return await refreshAccessToken(refreshTok);
    } catch (e) {
      if (e?.details) {
        logTuyaApiError('token.refresh.fallback', e, {
          next: authCode ? 'grant_type_3' : 'grant_type_1',
        });
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      } else {
        throw e;
      }
    }
  }
  if (authCode) {
    return fetchNewAccessTokenGrant3(authCode);
  }
  return fetchNewAccessTokenGrant1();
}

export async function getAccessToken({force = false} = {}) {
  if (!isTuyaConfigured()) {
    const err = new Error(
      '[Tuya] Not configured — add credentials in src/config/tuya.user.js',
    );
    err.code = 'TUYA_NOT_CONFIGURED';
    throw err;
  }
  await createInitialTokensIfNeeded();
  let {token, expiresAt} = await getStoredTokenMeta();

  if (!force && token && !tokenNeedsRefresh(expiresAt)) {
    return token;
  }

  return obtainFreshAccessToken();
}

async function tuyaBusinessRequest(
  {method = 'GET', path, params, body},
  _retryAfterRefresh = true,
) {
  const creds = requireCredentials();
  const {baseUrl, clientId, secret} = creds;
  const accessToken = await getAccessToken({force: false});
  if (!String(accessToken || '').trim()) {
    const err = new Error('[Tuya] No access token');
    err.code = 'NO_ACCESS_TOKEN';
    throw err;
  }

  const pathWithQuery = buildPathWithSortedQuery(path, params);
  let bodyString = '';
  if (body !== undefined && body !== null && body !== '') {
    bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const {sign, t} = generateSign(
    {clientId, secret},
    accessToken,
    method,
    pathWithQuery,
    bodyString,
  );
  const headers = {
    client_id: clientId,
    sign_method: 'HMAC-SHA256',
    t,
    access_token: accessToken,
    sign,
  };
  if (bodyString && method !== 'GET' && method !== 'DELETE') {
    headers['Content-Type'] = 'application/json';
  }

  const url = `${baseUrl}${pathWithQuery}`;
  const fetchOpts = {method, headers};
  if (bodyString && method !== 'GET' && method !== 'DELETE') {
    fetchOpts.body = bodyString;
  }

  let res;
  try {
    res = await fetchWithTimeout(url, fetchOpts);
  } catch (e) {
    const name = e?.name || '';
    const wrapped =
      name === 'AbortError'
        ? new Error('Request timed out — check internet connection.')
        : new Error(e?.message || 'Network request failed');
    wrapped.cause = e;
    logTuyaApiError('tuyaBusinessRequest.network', wrapped, {
      path: pathWithQuery,
    });
    throw wrapped;
  }

  const json = await parseJson(res);
  const failCode = Number(json.code);

  if (
    !json.success &&
    _retryAfterRefresh &&
    (failCode === 1010 || failCode === 501)
  ) {
    await getAccessToken({force: true});
    return tuyaBusinessRequest({method, path, params, body}, false);
  }

  if (!json.success) {
    const err = normalizeTuyaError(json);
    logTuyaApiError('tuyaBusinessRequest', err, {
      path: pathWithQuery,
      tid: json.tid,
    });
    throw err;
  }
  return json.result;
}

async function fetchDeviceDetailStandard(deviceId) {
  try {
    const detail = await tuyaBusinessRequest({
      method: 'GET',
      path: `/v1.0/devices/${deviceId}`,
    });
    if (detail && typeof detail === 'object') {
      const online =
        typeof detail.online === 'boolean'
          ? detail.online
          : typeof detail.isOnline === 'boolean'
            ? detail.isOnline
            : undefined;
      const status = Array.isArray(detail.status) ? detail.status : [];
      return {
        ...detail,
        ...(online !== undefined ? {online} : {}),
        status,
      };
    }
  } catch (e) {
    logTuyaApiError('fetchDeviceDetailStandard.devices', e, {deviceId});
  }

  const status = await tuyaBusinessRequest({
    method: 'GET',
    path: `/v1.0/iot-03/devices/${deviceId}/status`,
  });
  const list = Array.isArray(status) ? status : [];
  return {
    status: list,
  };
}

export async function fetchMicroDevice() {
  if (!isTuyaConfigured()) {
    const err = new Error(
      '[Tuya] Not configured — add credentials in src/config/tuya.user.js',
    );
    err.code = 'TUYA_NOT_CONFIGURED';
    throw err;
  }
  const c = requireDeviceContext();
  const {userId, deviceId, assetId} = c;

  const tryMicro = Boolean(userId && assetId);
  if (tryMicro) {
    try {
      return await tuyaBusinessRequest({
        method: 'GET',
        path: `/v1.0/cloud/energy/micro/assets/${assetId}/device`,
        params: {device_id: deviceId, user_id: userId},
      });
    } catch (e) {
      const code = Number(e?.code);
      if (code === 501 || code === 1106) {
        logTuyaApiError('fetchMicroDevice.fallback', e, {deviceId});
        return fetchDeviceDetailStandard(deviceId);
      }
      if (code === 28841002) {
        logTuyaApiError('fetchMicroDevice.no_iot_core_fallback', e, {
          deviceId,
          note: 'IoT Core fallback usually hits the same plan error; fix subscription or use Energy Micro only.',
        });
      }
      throw e;
    }
  }

  return fetchDeviceDetailStandard(deviceId);
}

export async function postMicroDeviceSwitch(on) {
  const c = requireDeviceContext();
  const {userId, deviceId} = c;
  const boolVal = Boolean(on);

  const tryMicro = Boolean(userId);
  if (tryMicro) {
    try {
      return await tuyaBusinessRequest({
        method: 'POST',
        path: `/v1.0/cloud/energy/micro/device/command/${deviceId}`,
        params: {
          code: 'switch',
          user_id: userId,
          value: String(boolVal),
        },
      });
    } catch (e) {
      const code = Number(e?.code);
      if (code === 501 || code === 1106) {
        logTuyaApiError('postMicroDeviceSwitch.fallback', e, {deviceId});
        return tuyaBusinessRequest({
          method: 'POST',
          path: `/v1.0/iot-03/devices/${deviceId}/commands`,
          body: {
            commands: [{code: 'switch', value: boolVal}],
          },
        });
      }
      throw e;
    }
  }

  return tuyaBusinessRequest({
    method: 'POST',
    path: `/v1.0/iot-03/devices/${deviceId}/commands`,
    body: {
      commands: [{code: 'switch', value: boolVal}],
    },
  });
}
