import sample from './tuya.user.sample';
import user from './tuya.user';

export function getTuyaCredentials() {
  const raw = user?.default ?? user;
  const b = raw && typeof raw === 'object' ? raw : sample;
  return {
    baseUrl: String(b.baseUrl || sample.baseUrl || 'https://openapi.tuyaeu.com').trim(),
    clientId: String(b.clientId ?? '').trim(),
    secret: String(b.secret ?? '').trim(),
    authCode: String(b.authCode ?? '').trim(),
    userId: String(b.userId ?? '').trim(),
    deviceId: String(b.deviceId ?? '').trim(),
    assetId: String(b.assetId ?? '').trim(),
  };
}

export function isTuyaConfigured() {
  const c = getTuyaCredentials();
  return Boolean(c.clientId && c.secret && c.deviceId);
}
