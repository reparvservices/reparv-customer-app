// services/liveLocation.js
//
// Single app-wide source of the user's real-time location.
// - Watches GPS continuously while the app is in the foreground
// - Pauses in background, resumes (and re-checks permission) on foreground
// - Keeps Redux city/state in sync as the user moves, unless the user
//   picked a city manually in LocationPickerScreen
//
// Read coords in components with `useUserLocation()` (hooks/userLocation.js).
import {AppState, PermissionsAndroid, Platform} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  persistGuestLocation,
  setUserLocation,
} from '../features/auth/authSlice';
import {haversineKm} from '../hooks/userLocation';

export const LOCATION_SOURCE_KEY = 'locationSource';

// Re-resolve city/state only after moving this far from the last lookup
const GEOCODE_DISTANCE_KM = 1;

const WATCH_OPTIONS = {
  enableHighAccuracy: true,
  distanceFilter: 25, // metres
  interval: 10000,
  fastestInterval: 5000,
  maximumAge: 10000,
  timeout: 20000,
};

const devLog = (...args) => {
  if (__DEV__) console.log(...args);
};

Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
  locationProvider: 'auto',
});

/* ---------------- store ---------------- */
// status: 'idle' | 'loading' | 'ready' | 'denied' | 'error'
let snapshot = {coords: null, status: 'idle'};
const listeners = new Set();

const setSnapshot = patch => {
  snapshot = {...snapshot, ...patch};
  listeners.forEach(l => l());
};

export const subscribeLiveLocation = listener => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getLiveLocation = () => snapshot;

/* ---------------- reverse geocode ---------------- */
// BigDataCloud — free, no key, India-optimised
export async function reverseGeocode(lat, lon) {
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client` +
    `?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
  const data = await (await fetch(url)).json();
  const city =
    data?.city ||
    data?.locality ||
    data?.localityInfo?.administrative?.find(a => a.adminLevel === 5)?.name ||
    data?.localityInfo?.administrative?.find(a => a.adminLevel === 4)?.name ||
    '';
  const state = data?.principalSubdivision || '';
  return {city: city.trim(), state: state.trim()};
}

/** Save city/state to storage + Redux. source: 'gps' | 'manual' */
export async function saveBrowseLocation(dispatch, city, state, source) {
  try {
    const raw = await AsyncStorage.getItem('Reparvuser');
    if (raw) {
      await AsyncStorage.setItem(
        'Reparvuser',
        JSON.stringify({...JSON.parse(raw), city, state}),
      );
    } else {
      await persistGuestLocation(city, state);
    }
    await AsyncStorage.setItem(LOCATION_SOURCE_KEY, source);
  } catch (e) {
    devLog('📍 saveBrowseLocation storage error:', e);
  }
  dispatch(setUserLocation({city, state}));
}

/* ---------------- tracking ---------------- */
let dispatchRef = null;
let watchId = null;
let appStateSub = null;
let lastGeocoded = null;
let geocoding = false;

async function ensurePermission() {
  if (Platform.OS !== 'android') return true;
  const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  const coarse = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;
  if (
    (await PermissionsAndroid.check(fine)) ||
    (await PermissionsAndroid.check(coarse))
  ) {
    return true;
  }
  const result = await PermissionsAndroid.request(fine, {
    title: 'Location Permission',
    message:
      'This app needs access to your location to show nearby properties.',
    buttonPositive: 'Allow',
    buttonNegative: 'Deny',
  });
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

async function syncCity(latitude, longitude) {
  if (geocoding || !dispatchRef) return;
  if (
    lastGeocoded &&
    haversineKm(
      lastGeocoded.latitude,
      lastGeocoded.longitude,
      latitude,
      longitude,
    ) < GEOCODE_DISTANCE_KM
  ) {
    return;
  }
  geocoding = true;
  try {
    const source = await AsyncStorage.getItem(LOCATION_SOURCE_KEY);
    if (source === 'manual') return;
    const {city, state} = await reverseGeocode(latitude, longitude);
    if (!city) return;
    lastGeocoded = {latitude, longitude};
    devLog('📍 Live location city:', {city, state});
    await saveBrowseLocation(dispatchRef, city, state, 'gps');
  } catch (e) {
    devLog('📍 Reverse geocode error:', e);
  } finally {
    geocoding = false;
  }
}

function onPosition(position) {
  const {latitude, longitude, accuracy} = position.coords;
  setSnapshot({coords: {latitude, longitude, accuracy}, status: 'ready'});
  syncCity(latitude, longitude);
}

function onError(error) {
  devLog('📍 Live location error:', error?.message || error);
  if (error?.code === 1) {
    setSnapshot({status: 'denied'});
  } else if (!snapshot.coords) {
    setSnapshot({status: 'error'});
  }
}

async function startWatch() {
  if (watchId != null) return;
  if (!snapshot.coords) setSnapshot({status: 'loading'});
  const granted = await ensurePermission();
  if (!granted) {
    setSnapshot({status: 'denied'});
    return;
  }
  if (watchId != null) return;
  // Quick cached fix so screens don't wait for the first GPS update
  Geolocation.getCurrentPosition(onPosition, () => {}, {
    enableHighAccuracy: false,
    timeout: 3000,
    maximumAge: 300000,
  });
  watchId = Geolocation.watchPosition(onPosition, onError, WATCH_OPTIONS);
}

function stopWatch() {
  if (watchId == null) return;
  Geolocation.clearWatch(watchId);
  watchId = null;
}

/** Start app-wide tracking. Call once from the app root. */
export function startLiveLocation(dispatch) {
  dispatchRef = dispatch;
  startWatch();
  if (!appStateSub) {
    appStateSub = AppState.addEventListener('change', next => {
      if (next === 'active') startWatch();
      else if (next === 'background') stopWatch();
    });
  }
  return () => {
    stopWatch();
    appStateSub?.remove();
    appStateSub = null;
  };
}

/**
 * Switch back from a manually-picked city to live GPS.
 * Resolves with {city, state} for the current position.
 */
export async function resumeLiveLocation() {
  await AsyncStorage.setItem(LOCATION_SOURCE_KEY, 'gps');
  lastGeocoded = null;
  await startWatch();
  const position = await new Promise((resolve, reject) =>
    Geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
    }),
  );
  const {latitude, longitude, accuracy} = position.coords;
  setSnapshot({coords: {latitude, longitude, accuracy}, status: 'ready'});
  const {city, state} = await reverseGeocode(latitude, longitude);
  lastGeocoded = {latitude, longitude};
  return {city, state};
}
