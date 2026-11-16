/**
 * Release builds always use production. Debug builds use the local server
 * (reached through `adb reverse tcp:3000 tcp:3000`). Flip USE_LOCAL_API to test against production.
 */
const PRODUCTION_API = 'https://aws-api.reparv.in';
const LOCAL_API = 'http://localhost:3000';
const USE_LOCAL_API = true;

export const API_BASE_URL = __DEV__ && USE_LOCAL_API ? LOCAL_API : PRODUCTION_API;
