import {API_BASE_URL} from '../config/api';
const ALL_PROPERTIES_URL = `${API_BASE_URL}/frontend/all-properties`;

const TTL_MS = 2 * 60 * 1000;

let cachedList = null;
let cachedAt = 0;
let inflight = null;

export function isAllPropertiesCacheFresh() {
  return Array.isArray(cachedList) && Date.now() - cachedAt < TTL_MS;
}

/** Synchronous read when TTL valid (for initial state). */
export function peekFreshAllProperties() {
  return isAllPropertiesCacheFresh() ? cachedList : null;
}

export function invalidateAllPropertiesCache() {
  cachedList = null;
  cachedAt = 0;
}

/**
 * Single-flight fetch with short TTL. All screens/components share one request.
 */
export async function fetchAllPropertiesCached({force = false} = {}) {
  if (!force && isAllPropertiesCacheFresh()) {
    return cachedList;
  }
  if (!force && inflight) {
    return inflight;
  }

  inflight = (async () => {
    try {
      const response = await fetch(ALL_PROPERTIES_URL);
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      cachedList = list;
      cachedAt = Date.now();
      return list;
    } catch (e) {
      if (cachedList) {
        return cachedList;
      }
      throw e;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
