/**
 * Copy values into `tuya.user.js` for local builds (do not commit secrets).
 *
 * If GET /v1.0/cloud/energy/micro/assets?user_id=... works (curl) but
 * /v1.0/iot-03/devices/... returns 28841002, you must set userId + assetId
 * here so the app uses Energy Micro device APIs instead of IoT Core.
 * Optional: set authCode to let app create first token via
 * /v1.0/authorize_token?code=...&grant_type=3.
 * asset_id appears in the JSON under result[].sub_assets... (e.g. reparvservices).
 */
export default {
  baseUrl: 'https://openapi.tuyaeu.com',
  clientId: '',
  secret: '',
  authCode: '',
  userId: '',
  deviceId: '',
  assetId: '',
};
