import React, {useEffect, useRef, useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
  PermissionsAndroid,
  ScrollView,
  TextInput,
  PanResponder,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import {WebView} from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSelector} from 'react-redux';
import {getImageUri} from '../utils/imageHandle';
import {fetchAllPropertiesCached} from '../services/allPropertiesCache';
import {getLiveLocation} from '../services/liveLocation';
import {useUserLocation} from '../hooks/userLocation';
import {API_BASE_URL} from '../config/api';
import {Filter, LocateFixed, ArrowLeft, Radius} from 'lucide-react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  primary: '#6E56CF',
  primaryLight: '#EEE9FF',
  primaryMid: '#BEB0F0',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSub: '#64748B',
  textMuted: '#94A3B8',
  white: '#FFFFFF',
  shadow: '#6E56CF',
  success: '#10B981',
  successLight: '#D1FAE5',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  skeleton1: '#E2E8F0',
  skeleton2: '#F1F5F9',
  trackBg: '#E9E3FF',
  accentBlue: '#185FA5',
  accentBlueDark: '#0C447C',
};

const RADIUS_KM_DEFAULT = 5;
const INDIA_CENTER = {lat: 20.5937, lon: 78.9629};
const INDIA_BOUNDS = {minLat: 6, maxLat: 37.6, minLon: 68, maxLon: 98};
const BUDGET_MIN = 1_000;
const BUDGET_MAX = 20_000_000;
const BUDGET_STEP = 15_000;

// Radius preset chips
const RADIUS_PRESETS = [
  {label: '1 km', value: 1},
  {label: '5 km', value: 5},
  {label: '10 km', value: 10},
  {label: '25 km', value: 25},
  {label: '30 km', value: 30},
  {label: '60 km', value: 60},
  {label: '100 km', value: 100},
];

// Approximate height of the bottom radius panel (used for FAB / banner placement)
const SLIDER_PANEL_HEIGHT = Platform.OS === 'ios' ? 168 : 158;

Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
  locationProvider: 'auto',
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatPrice(val) {
  const n = parseFloat(val);
  if (!n) return '—';
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(1) + ' Cr';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(2) + ' L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(0) + 'K';
  return '₹' + n;
}

function formatDistance(km) {
  if (km < 1) return (km * 1000).toFixed(0) + 'm';
  return km.toFixed(1) + 'km';
}

function getFirstImage(frontView) {
  try {
    const arr = JSON.parse(frontView);
    return Array.isArray(arr) && arr[0] ? arr[0] : null;
  } catch {
    return typeof frontView === 'string' ? frontView : null;
  }
}

function prettifyCategory(cat) {
  if (!cat) return cat;
  return cat
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

function filterActiveProperties(list) {
  return (Array.isArray(list) ? list : []).filter(
    item => item.status === 'Active' && item.approve === 'Approved',
  );
}

function isInIndia(lat, lon) {
  return (
    lat >= INDIA_BOUNDS.minLat &&
    lat <= INDIA_BOUNDS.maxLat &&
    lon >= INDIA_BOUNDS.minLon &&
    lon <= INDIA_BOUNDS.maxLon
  );
}

const geocodeCache = {};

async function geocodeCityState(city, state) {
  const label = `${city || ''} ${state || ''} India`.trim();
  if (!city) return null;
  if (geocodeCache[label]) return geocodeCache[label];

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/map/geocode?q=${encodeURIComponent(label)}`,
    );
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      if (lat && lon && isInIndia(lat, lon)) {
        const coords = {lat, lon, source: 'city', label: city};
        geocodeCache[label] = coords;
        return coords;
      }
    }
  } catch (_) {}

  return null;
}

async function readSavedCityState() {
  try {
    const raw = await AsyncStorage.getItem('Reparvuser');
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (user?.city) {
      return {city: user.city, state: user.state || ''};
    }
  } catch (_) {}
  return null;
}

/** Prefer GPS inside India; otherwise fall back to saved city or India center. */
async function resolveMapCoords(gpsCoords, profile) {
  if (gpsCoords?.lat && gpsCoords?.lon && isInIndia(gpsCoords.lat, gpsCoords.lon)) {
    return {...gpsCoords, source: 'gps'};
  }

  const city = profile?.city;
  const state = profile?.state || '';
  if (city) {
    const geocoded = await geocodeCityState(city, state);
    if (geocoded) return geocoded;
  }

  return {...INDIA_CENTER, source: 'default'};
}

function getCurrentPosition(options) {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      p =>
        resolve({
          lat: p.coords.latitude,
          lon: p.coords.longitude,
          accuracy: p.coords.accuracy,
        }),
      reject,
      options,
    );
  });
}

/** Current fix from the app-wide live tracker, if it already has one. */
function getLiveFix() {
  const c = getLiveLocation().coords;
  return c ? {lat: c.latitude, lon: c.longitude, accuracy: c.accuracy} : null;
}

/** Fast cached fix first, then high-accuracy refinement. */
function getLocationRobust({onFastFix} = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = coords => {
      if (settled) return;
      settled = true;
      resolve(coords);
    };

    getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 4000,
      maximumAge: 300000,
    })
      .then(coords => {
        onFastFix?.(coords);
        if (coords.accuracy != null && coords.accuracy <= 120) {
          finish(coords);
        }
      })
      .catch(() => {});

    getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 14000,
      maximumAge: 0,
    })
      .then(finish)
      .catch(() => {
        getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 60000,
        })
          .then(finish)
          .catch(err => {
            if (!settled) reject(err);
          });
      });
  });
}

async function requestAndroidPermission() {
  if (Platform.OS !== 'android') return true;
  const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  if (await PermissionsAndroid.check(fine)) return true;
  const r = await PermissionsAndroid.request(fine, {
    title: 'Location Permission',
    message: 'Reparv needs your location to show nearby properties.',
    buttonPositive: 'Allow',
    buttonNegative: 'Deny',
  });
  if (r === PermissionsAndroid.RESULTS.GRANTED) return true;
  const coarse = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  );
  return coarse === PermissionsAndroid.RESULTS.GRANTED;
}

function locationErrMsg(code) {
  if (code === 1)
    return 'Permission denied.\nGo to Settings → Apps → Permissions → Enable Location.';
  if (code === 2)
    return 'Location unavailable.\nMake sure GPS is ON in device Settings → Location.';
  if (code === 3)
    return 'Location timed out.\nMove to an open area or enable Wi-Fi and try again.';
  return 'Could not get your location. Please try again.';
}

// ─── CUSTOM SLIDER COMPONENT ──────────────────────────────────────────────────
const SliderV2 = ({
  minimumValue = 0,
  maximumValue = 1,
  step = 0,
  value,
  onValueChange,
  onSlidingComplete,
  style,
  formatLabel,
  trackHeight = 5,
  thumbSize = 22,
  touchHeight = 44,
}) => {
  const [trackW, setTrackW] = useState(0);
  const [trackPageX, setTrackPageX] = useState(0);
  const trackRef = useRef(null);
  const isDragging = useRef(false);
  const internalVal = useRef(value);
  const [displayVal, setDisplayVal] = useState(value);

  const thumbScale = useRef(new Animated.Value(1)).current;
  const tooltipAnim = useRef(new Animated.Value(0)).current;

  const range = maximumValue - minimumValue;

  const clamp = useCallback(
    raw => {
      let v = Math.max(minimumValue, Math.min(maximumValue, raw));
      if (step > 0) {
        v = Math.round((v - minimumValue) / step) * step + minimumValue;
      }
      return parseFloat(v.toFixed(8));
    },
    [minimumValue, maximumValue, step],
  );

  const fraction =
    range > 0
      ? Math.max(0, Math.min(1, (displayVal - minimumValue) / range))
      : 0;

  const pctFromPageX = useCallback(
    pageX => {
      if (trackW === 0) return fraction;
      const usable = trackW - thumbSize;
      const rel = pageX - trackPageX - thumbSize / 2;
      return Math.max(0, Math.min(1, rel / usable));
    },
    [trackW, trackPageX, thumbSize, fraction],
  );

  const panResponder = useRef(null);

  useEffect(() => {
    panResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: evt => {
        isDragging.current = true;
        Animated.parallel([
          Animated.spring(thumbScale, {
            toValue: 1.35,
            useNativeDriver: true,
            tension: 250,
            friction: 8,
          }),
          Animated.timing(tooltipAnim, {
            toValue: 1,
            duration: 130,
            useNativeDriver: true,
          }),
        ]).start();
        const pct = pctFromPageX(evt.nativeEvent.pageX);
        const v = clamp(minimumValue + pct * range);
        internalVal.current = v;
        setDisplayVal(v);
        onValueChange?.(v);
      },
      onPanResponderMove: evt => {
        const pct = pctFromPageX(evt.nativeEvent.pageX);
        const v = clamp(minimumValue + pct * range);
        internalVal.current = v;
        setDisplayVal(v);
        onValueChange?.(v);
      },
      onPanResponderRelease: evt => {
        isDragging.current = false;
        Animated.parallel([
          Animated.spring(thumbScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 250,
            friction: 8,
          }),
          Animated.timing(tooltipAnim, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start();
        const pct = pctFromPageX(evt.nativeEvent.pageX);
        const v = clamp(minimumValue + pct * range);
        internalVal.current = v;
        setDisplayVal(v);
        onValueChange?.(v);
        onSlidingComplete?.(v);
      },
      onPanResponderTerminateRequest: () => false,
      onPanResponderTerminate: () => {
        isDragging.current = false;
        Animated.parallel([
          Animated.spring(thumbScale, {toValue: 1, useNativeDriver: true}),
          Animated.timing(tooltipAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      },
    });
  }, [
    trackW,
    trackPageX,
    minimumValue,
    maximumValue,
    step,
    range,
    clamp,
    pctFromPageX,
  ]);

  useEffect(() => {
    if (!isDragging.current) {
      setDisplayVal(value);
    }
  }, [value]);

  const measureTrack = () => {
    trackRef.current?.measure((_x, _y, w, _h, pageX) => {
      setTrackW(w);
      setTrackPageX(pageX);
    });
  };

  const USABLE = trackW > 0 ? trackW - thumbSize : 0;
  const thumbLeft = fraction * USABLE;

  return (
    <View style={[{height: touchHeight, justifyContent: 'center'}, style]}>
      {formatLabel && (
        <Animated.View
          pointerEvents="none"
          style={[
            sliderS.tooltipWrap,
            {
              left: thumbLeft,
              opacity: tooltipAnim,
              transform: [
                {
                  translateY: tooltipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [6, 0],
                  }),
                },
              ],
            },
          ]}>
          <View style={sliderS.tooltip}>
            <Text style={sliderS.tooltipTxt}>{formatLabel(displayVal)}</Text>
          </View>
          <View style={sliderS.tooltipArrow} />
        </Animated.View>
      )}
      <View
        ref={trackRef}
        style={[sliderS.trackWrap2, {height: touchHeight}]}
        onLayout={measureTrack}
        {...(panResponder.current ? panResponder.current.panHandlers : {})}>
        <View
          style={[
            sliderS.trackBg,
            {height: trackHeight, borderRadius: trackHeight / 2},
          ]}>
          <View
            style={[
              sliderS.trackFill,
              {
                height: trackHeight,
                borderRadius: trackHeight / 2,
                width: thumbLeft + thumbSize / 2,
              },
            ]}
          />
        </View>
        <Animated.View
          pointerEvents="none"
          style={[
            sliderS.thumb2,
            {
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              left: thumbLeft,
              top: (touchHeight - thumbSize) / 2,
              transform: [{scale: thumbScale}],
            },
          ]}>
          <View
            style={[
              sliderS.thumbDot,
              {
                width: thumbSize * 0.38,
                height: thumbSize * 0.38,
                borderRadius: thumbSize * 0.19,
              },
            ]}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const sliderS = StyleSheet.create({
  trackWrap2: {
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  trackBg: {
    width: '100%',
    backgroundColor: C.trackBg,
    position: 'relative',
    overflow: 'visible',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: C.primary,
  },
  thumb2: {
    position: 'absolute',
    backgroundColor: C.white,
    shadowColor: C.shadow,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: C.primary,
  },
  thumbDot: {
    backgroundColor: C.primary,
  },
  tooltipWrap: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  tooltip: {
    backgroundColor: C.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: C.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  tooltipTxt: {
    color: C.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: C.primary,
    marginTop: -1,
  },
});

// ─── Leaflet Hybrid Map HTML (Google labels + satellite) ─────────────────────
const LEAFLET_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0,
        maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; background:#e8edf3; }
    .leaflet-control-zoom { display:none !important; }
    .leaflet-control-attribution {
      font-size:9px !important; background:rgba(255,255,255,0.85) !important;
      padding:2px 6px !important; border-radius:6px 0 0 0 !important;
    }
    #tileLoader {
      position:absolute; inset:0; z-index:999;
      display:flex; align-items:center; justify-content:center;
      background:rgba(232,237,243,0.72); pointer-events:none;
      transition:opacity .35s ease;
    }
    #tileLoader.hide { opacity:0; }
    .tileSpinner {
      width:34px; height:34px; border-radius:50%;
      border:3px solid rgba(110,86,207,0.18);
      border-top-color:#6E56CF;
      animation:spin .8s linear infinite;
    }
    @keyframes spin { to { transform:rotate(360deg); } }
    .pm-wrap { display:flex; flex-direction:column; align-items:center; }
    .pm-bubble {
      background:#6E56CF; padding:5px 10px; border-radius:10px;
      display:flex; flex-direction:column; align-items:center;
      box-shadow:0 2px 10px rgba(110,86,207,0.38); white-space:nowrap;
      border:1.5px solid rgba(255,255,255,0.9);
    }
    .pm-bubble.sel { background:#fff; border:2px solid #6E56CF; box-shadow:0 4px 14px rgba(110,86,207,0.28); }
    .pm-price { color:#fff; font-weight:700; font-size:11.5px; font-family:-apple-system,sans-serif; line-height:1.3; }
    .pm-bubble.sel .pm-price { color:#6E56CF; }
    .pm-dist { color:rgba(255,255,255,0.82); font-size:9px; font-weight:500; font-family:-apple-system,sans-serif; margin-top:1px; }
    .pm-bubble.sel .pm-dist { color:#8B7AE8; }
    .pm-pin { width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:7px solid #6E56CF; }
    .pm-bubble.sel + .pm-pin { border-top-color:#6E56CF; }
    .ud-pulse {
      width:38px; height:38px; border-radius:19px;
      background:rgba(37,99,235,0.14); border:2px solid #2563EB;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 0 0 6px rgba(37,99,235,0.12);
      animation:pulse 2s ease-out infinite;
    }
    .ud-inner { width:10px; height:10px; border-radius:5px; background:#2563EB; border:2px solid #fff; }
    @keyframes pulse {
      0% { box-shadow:0 0 0 0 rgba(37,99,235,0.28); }
      70% { box-shadow:0 0 0 12px rgba(37,99,235,0); }
      100% { box-shadow:0 0 0 0 rgba(37,99,235,0); }
    }
  </style>
</head>
<body>
<div id="map"></div>
<div id="tileLoader"><div class="tileSpinner"></div></div>
<script>
  var map = L.map('map', { zoomControl:false, attributionControl:true, preferCanvas:true });
  var baseLayer = L.tileLayer(
    'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    {
      subdomains: ['mt0','mt1','mt2','mt3'],
      maxZoom: 20,
      attribution: '\\u00a9 Google Maps'
    }
  ).addTo(map);
  map.setView([20.5937, 78.9629], 5);
  var propertyMarkers = {}, userMarker = null, radiusCircle = null;
  var updateTimer = null, tilesReady = false;
  var tileLoader = document.getElementById('tileLoader');
  function hideTileLoader() {
    if (!tilesReady) {
      tilesReady = true;
      tileLoader.classList.add('hide');
      setTimeout(function(){ tileLoader.style.display='none'; }, 380);
    }
  }
  baseLayer.on('loading', function(){ tileLoader.style.display='flex'; tileLoader.classList.remove('hide'); tilesReady=false; });
  baseLayer.on('load', hideTileLoader);
  setTimeout(hideTileLoader, 2500);
  function _fmt(val) {
    var n=parseFloat(val); if(!n) return '\\u2014';
    if(n>=10000000) return '\\u20b9'+(n/10000000).toFixed(1)+' Cr';
    if(n>=100000) return '\\u20b9'+(n/100000).toFixed(2)+' L';
    if(n>=1000) return '\\u20b9'+(n/1000).toFixed(0)+'K';
    return '\\u20b9'+n;
  }
  function _dist(km) { return km<1?(km*1000).toFixed(0)+'m':km.toFixed(1)+'km'; }
  function _hav(lat1,lon1,lat2,lon2) {
    var R=6371,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
    var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  }
  function _zoomForRadius(km) {
    if (km <= 1) return 15;
    if (km <= 5) return 13;
    if (km <= 10) return 12;
    if (km <= 25) return 11;
    if (km <= 60) return 10;
    return 9;
  }
  function _priceIcon(price,selected,distKm) {
    var priceStr=_fmt(price), distStr=distKm!=null?_dist(distKm):null;
    var inner='<span class="pm-price">'+priceStr+'</span>'+(distStr?'<span class="pm-dist">'+distStr+'</span>':'');
    var html='<div class="pm-wrap"><div class="pm-bubble'+(selected?' sel':'')+'">'+inner+'</div><div class="pm-pin"></div></div>';
    var w=Math.max(priceStr.length*8+22,58), h=distStr?44:36;
    return L.divIcon({ html:html, className:'', iconSize:[w,h], iconAnchor:[w/2,h] });
  }
  map.on('click', function() { window.ReactNativeWebView.postMessage(JSON.stringify({type:'MAP_PRESS'})); });
  window.flyTo = function(lat,lon,zoom) {
    map.flyTo([lat,lon], zoom||13, {animate:true, duration:0.9});
  };
  window.flyToRadius = function(lat,lon,radiusKm) {
    map.flyTo([lat,lon], _zoomForRadius(radiusKm||5), {animate:true, duration:0.9});
  };
  function _applyMap(data) {
    var uc=data.userCoords, mList=data.markers||[], radiusKm=data.radiusKm||5;
    if(uc) {
      var uLL=[uc.lat,uc.lon];
      var uIcon=L.divIcon({
        html:'<div class="ud-pulse"><div class="ud-inner"></div></div>',
        className:'', iconSize:[38,38], iconAnchor:[19,19]
      });
      if(userMarker){userMarker.setLatLng(uLL);userMarker.setIcon(uIcon);}
      else{userMarker=L.marker(uLL,{icon:uIcon,zIndexOffset:999}).addTo(map);}
      if(radiusCircle){
        radiusCircle.setLatLng(uLL);
        radiusCircle.setRadius(radiusKm*1000);
      } else {
        radiusCircle=L.circle(uLL,{
          radius:radiusKm*1000, color:'#6E56CF', weight:2,
          fillColor:'rgba(110,86,207,0.08)', fillOpacity:1
        }).addTo(map);
      }
    }
    var incoming={};
    mList.forEach(function(m){incoming[m.id]=true;});
    Object.keys(propertyMarkers).forEach(function(id){
      if(!incoming[id]){map.removeLayer(propertyMarkers[id]);delete propertyMarkers[id];}
    });
    mList.forEach(function(m){
      if(!m.lat||!m.lon) return;
      var distKm=uc?_hav(uc.lat,uc.lon,m.lat,m.lon):null;
      var icon=_priceIcon(m.price,m.selected,distKm);
      if(propertyMarkers[m.id]){
        propertyMarkers[m.id].setIcon(icon);
        propertyMarkers[m.id].setZIndexOffset(m.selected?200:0);
      } else {
        var mk=L.marker([m.lat,m.lon],{icon:icon,zIndexOffset:m.selected?200:0,bubblingMouseEvents:false});
        mk.on('click',function(){
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'MARKER_PRESS',id:m.id}));
        });
        mk.addTo(map); propertyMarkers[m.id]=mk;
      }
    });
  }
  window.updateMap = function(data) {
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(function(){ _applyMap(data); }, 60);
  };
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'MAP_READY'}));
<\/script>
</body>
</html>`;

// ─── Map boot loader ─────────────────────────────────────────────────────────
const LOADER_STEPS = ['map', 'properties', 'location'];

const MapLoader = ({message, step}) => {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {toValue: 1, duration: 280, useNativeDriver: true}).start();
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      }),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {toValue: 1, duration: 900, useNativeDriver: true}),
        Animated.timing(pulse, {toValue: 0, duration: 900, useNativeDriver: true}),
      ]),
    );
    spinLoop.start();
    pulseLoop.start();
    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [fade, spin, pulse]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const pinScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const stepIndex = LOADER_STEPS.indexOf(step);

  return (
    <Animated.View style={[s.mapLoaderWrap, {opacity: fade}]}>
      <View style={s.mapLoaderCard}>
        <Animated.View style={{transform: [{scale: pinScale}]}}>
          <View style={s.mapLoaderPinOuter}>
            <Animated.View
              style={[s.mapLoaderRing, {transform: [{rotate}]}]}
            />
            <Text style={s.mapLoaderPinIcon}>📍</Text>
          </View>
        </Animated.View>
        <Text style={s.mapLoaderTitle}>Preparing your map</Text>
        <Text style={s.mapLoaderMsg}>{message}</Text>
        <View style={s.mapLoaderSteps}>
          {LOADER_STEPS.map((key, idx) => (
            <View
              key={key}
              style={[
                s.mapLoaderStep,
                idx <= stepIndex && s.mapLoaderStepActive,
              ]}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
const SkeletonBox = ({width, height, borderRadius = 8, style}) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const opacity = anim.interpolate({inputRange: [0, 1], outputRange: [0.4, 1]});
  return (
    <Animated.View
      style={[
        {width, height, borderRadius, backgroundColor: C.skeleton1, opacity},
        style,
      ]}
    />
  );
};

// ─── Compact empty banner (filters only — radius is handled in bottom panel) ─
const EmptyBanner = ({onReset, bottomOffset}) => {
  const slideAnim = useRef(new Animated.Value(12)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 120,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        s.emptyBanner,
        {
          bottom: bottomOffset,
          opacity: opacityAnim,
          transform: [{translateY: slideAnim}],
        },
      ]}>
      <View style={s.emptyBannerLeft}>
        <Text style={s.emptyBannerIcon}>🔍</Text>
        <View style={s.emptyBannerTextWrap}>
          <Text style={s.emptyBannerTitle}>No matching properties</Text>
          <Text style={s.emptyBannerSub}>Try resetting your filters</Text>
        </View>
      </View>
      <TouchableOpacity
        style={s.emptyBannerBtn}
        onPress={onReset}
        activeOpacity={0.8}>
        <Text style={s.emptyBannerBtnTxt}>Reset</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Property Bottom Card ─────────────────────────────────────────────────────
const PropertyCard = ({property, onClose, navigation, userCoords}) => {
  const slideY = useRef(new Animated.Value(340)).current;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
    Animated.spring(slideY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 85,
      friction: 11,
    }).start();
  }, [property]);

  const image = getFirstImage(property.frontView);
  const offerPrice = formatPrice(property.totalOfferPrice);
  const salesPrice = formatPrice(property.totalSalesPrice);
  const hasDiscount =
    property.totalSalesPrice &&
    property.totalOfferPrice !== property.totalSalesPrice;

  const types = Array.isArray(property.propertyType)
    ? property.propertyType.join(' · ')
    : property.propertyType || '';

  const distance = useMemo(() => {
    if (!userCoords) return null;
    const lat = parseFloat(property.latitude);
    const lon = parseFloat(property.longitude);
    if (!lat || !lon) return null;
    return haversineKm(userCoords.lat, userCoords.lon, lat, lon);
  }, [property, userCoords]);

  const locationLine = [property.location, property.city, property.state]
    .filter(Boolean)
    .join(', ');

  return (
    <Animated.View style={[pc.sheet, {transform: [{translateY: slideY}]}]}>
      {/* ── Drag handle ── */}
      <View style={pc.handle} />

      {/* ── Hero image banner ── */}
      <View style={pc.heroBanner}>
        {image && !imgError ? (
          <>
            {!imgLoaded && (
              <View style={StyleSheet.absoluteFill}>
                <SkeletonBox width="100%" height={148} borderRadius={0} />
              </View>
            )}
            <Image
              source={{uri: getImageUri(image)}}
              style={[StyleSheet.absoluteFill, {opacity: imgLoaded ? 1 : 0}]}
              resizeMode="cover"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        ) : (
          <View style={pc.heroFallback}>
            <Text style={pc.heroFallbackIcon}>🏗️</Text>
          </View>
        )}

        {/* Dark gradient scrim */}
        <View style={pc.heroScrim} />

        {/* Top badges row */}
        <View style={pc.heroBadgeRow}>
          <View style={pc.categoryBadge}>
            <Text style={pc.categoryBadgeTxt}>
              {prettifyCategory(property.propertyCategory)}
            </Text>
          </View>
        </View>

        {/* Close button */}
        <TouchableOpacity
          style={pc.closeBtn}
          onPress={onClose}
          activeOpacity={0.85}>
          <Text style={pc.closeTxt}>✕</Text>
        </TouchableOpacity>

        {/* Location line at bottom of hero */}
        <View style={pc.heroLocationRow}>
          <Text style={pc.heroLocationIcon}>📍</Text>
          <Text style={pc.heroLocationTxt} numberOfLines={1}>
            {locationLine}
          </Text>
        </View>
      </View>

      {/* ── Card body ── */}
      <View style={pc.body}>
        {/* Property name + price */}
        <View style={pc.nameRow}>
          <Text style={pc.propName} numberOfLines={2}>
            {property.propertyName}
          </Text>
          <View style={pc.priceBlock}>
            <Text style={pc.priceLabel}>Offer Price</Text>
            <Text style={pc.priceMain}>{offerPrice}</Text>
            {hasDiscount && (
              <Text style={pc.priceStrike}>MRP {salesPrice}</Text>
            )}
          </View>
        </View>

        {/* Stat chips */}
        <View style={pc.statsRow}>
          {!!property.carpetArea && (
            <View style={pc.statChip}>
              <Text style={pc.statIcon}>📐</Text>
              <View>
                <Text style={pc.statLabel}>Area</Text>
                <Text style={pc.statValue}>{property.carpetArea} sq.ft</Text>
              </View>
            </View>
          )}
          {!!property.propertyFacing && (
            <View style={pc.statChip}>
              <Text style={pc.statIcon}>🧭</Text>
              <View>
                <Text style={pc.statLabel}>Facing</Text>
                <Text style={pc.statValue}>{property.propertyFacing}</Text>
              </View>
            </View>
          )}
          {distance != null && (
            <View style={[pc.statChip, pc.statChipGreen]}>
              <Text style={pc.statIcon}>📍</Text>
              <View>
                <Text style={pc.statLabel}>Distance</Text>
                <Text style={[pc.statValue, pc.statValueGreen]}>
                  {formatDistance(distance)}
                </Text>
              </View>
            </View>
          )}
          {!!types && (
            <View style={[pc.statChip, pc.statChipWide]}>
              <Text style={pc.statIcon}>🏠</Text>
              <View>
                <Text style={pc.statLabel}>Type</Text>
                <Text style={pc.statValue} numberOfLines={1}>
                  {types}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={pc.ctaBtn}
          activeOpacity={0.88}
          onPress={() =>
            navigation.navigate('PropertyDetails', {seoSlug: property.seoSlug})
          }>
          <Text style={pc.ctaBtnTxt}>View Details</Text>
          <Text style={pc.ctaArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ─── Filter Panel ─────────────────────────────────────────────────────────────
const FilterPanel = ({
  visible,
  onClose,
  uniqueCategories,
  selectedCategories,
  onToggleCategory,
  maxBudget,
  budgetSliderVal,
  onBudgetChange,
  onBudgetRelease,
  onReset,
  onApply,
  activeCount,
}) => {
  const [mounted, setMounted] = useState(false);
  const [inputText, setInputText] = useState('');
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (maxBudget >= BUDGET_MAX) setInputText('');
    else setInputText(String(Math.round(maxBudget)));
  }, [maxBudget]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.92,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(({finished}) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <Animated.View style={[s.backdrop, {opacity}]}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onClose}
      />
      <Animated.View style={[s.filterCard, {transform: [{scale}]}]}>
        <View style={s.filterHeader}>
          <Text style={s.filterTitle}>Filters</Text>
          <View style={{flexDirection: 'row', gap: 8, alignItems: 'center'}}>
            {activeCount > 0 && (
              <TouchableOpacity style={s.resetBtn} onPress={onReset}>
                <Text style={s.resetTxt}>Reset</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Text style={s.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.divider} />
        <Text style={s.filterLabel}>Property Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipRow}
          style={{marginBottom: 6}}>
          {uniqueCategories.map(cat => {
            const active = selectedCategories.includes(cat);
            return (
              <TouchableOpacity
                key={cat}
                style={[s.chip, active && s.chipActive]}
                onPress={() => onToggleCategory(cat)}
                activeOpacity={0.75}>
                <Text style={[s.chipTxt, active && s.chipTxtActive]}>
                  {prettifyCategory(cat)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={s.divider} />
        <View style={s.budgetHeader}>
          <Text style={s.filterLabel}>Max Budget</Text>
          <View style={s.budgetBadge}>
            <Text style={s.budgetBadgeTxt}>
              {maxBudget >= BUDGET_MAX ? '₹2Cr+' : formatPrice(maxBudget)}
            </Text>
          </View>
        </View>

        <View style={s.amountInputRow}>
          <View style={s.amountInputWrap}>
            <Text style={s.amountPrefix}>₹</Text>
            <TextInput
              style={s.amountInput}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor={C.textMuted}
              value={inputText}
              onChangeText={text => {
                const clean = text.replace(/[^0-9]/g, '');
                setInputText(clean);
                const num = parseInt(clean, 10);
                if (!isNaN(num) && num >= BUDGET_MIN) {
                  const clamped = Math.min(num, BUDGET_MAX);
                  onBudgetChange(clamped);
                }
              }}
              onBlur={() => {
                const num = parseInt(inputText, 10);
                if (!isNaN(num) && num >= BUDGET_MIN) {
                  const clamped = Math.min(num, BUDGET_MAX);
                  onBudgetChange(clamped);
                  onBudgetRelease(clamped);
                  setInputText(String(clamped));
                } else {
                  setInputText(
                    maxBudget >= BUDGET_MAX
                      ? ''
                      : String(Math.round(maxBudget)),
                  );
                }
              }}
              maxLength={10}
              returnKeyType="done"
            />
          </View>
          {inputText.length > 0 && (
            <View style={s.amountParsed}>
              <Text style={s.amountParsedTxt}>
                {formatPrice(parseInt(inputText, 10) || 0)}
              </Text>
            </View>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[s.chipRow, {marginBottom: 8}]}>
          {[500000, 1000000, 2000000, 5000000, 10000000].map(amt => {
            const active = maxBudget === amt;
            return (
              <TouchableOpacity
                key={amt}
                style={[s.chip, active && s.chipActive]}
                onPress={() => {
                  onBudgetChange(amt);
                  onBudgetRelease(amt);
                  setInputText(String(amt));
                }}
                activeOpacity={0.75}>
                <Text style={[s.chipTxt, active && s.chipTxtActive]}>
                  {formatPrice(amt)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <SliderV2
          minimumValue={BUDGET_MIN}
          maximumValue={BUDGET_MAX}
          step={BUDGET_STEP}
          value={budgetSliderVal}
          trackHeight={6}
          thumbSize={24}
          touchHeight={48}
          style={s.slider}
          formatLabel={v => (v >= BUDGET_MAX ? '₹2Cr+' : formatPrice(v))}
          onValueChange={v => {
            onBudgetChange(v);
            setInputText(v >= BUDGET_MAX ? '' : String(Math.round(v)));
          }}
          onSlidingComplete={v => {
            onBudgetRelease(v);
            setInputText(v >= BUDGET_MAX ? '' : String(Math.round(v)));
          }}
        />
        <View style={s.sliderRangeRow}>
          <Text style={s.sliderRangeTxt}>₹1K</Text>
          <Text style={s.sliderRangeTxt}>₹2Cr</Text>
        </View>

        <TouchableOpacity
          style={s.applyBtn}
          onPress={onApply}
          activeOpacity={0.85}>
          <Text style={s.applyTxt}>
            Apply{activeCount > 0 ? ` (${activeCount})` : ''}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PropertyMapScreen({navigation}) {
  const webViewRef = useRef(null);
  const insets = useSafeAreaInsets();
  const {user} = useSelector(state => state?.auth || {});

  const [status, setStatus] = useState('loading');
  const [statusMsg, setStatusMsg] = useState('Loading map…');
  const [loaderStep, setLoaderStep] = useState('map');
  const [userCoords, setUserCoords] = useState(null);
  const [allProperties, setAllProperties] = useState([]);
  const [nearbyProperties, setNearbyProperties] = useState([]);
  const [radiusKm, setRadiusKm] = useState(RADIUS_KM_DEFAULT);
  const [sliderValue, setSliderValue] = useState(RADIUS_KM_DEFAULT);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [webViewReady, setWebViewReady] = useState(false);
  const pillAnim = useRef(new Animated.Value(0)).current;

  const [activeTab, setActiveTab] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  // Radius panel stays closed until the user asks for it (map FAB)
  const [showRadiusPanel, setShowRadiusPanel] = useState(false);
  const [radiusPanelHeight, setRadiusPanelHeight] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [maxBudget, setMaxBudget] = useState(0);
  const [budgetSliderVal, setBudgetSliderVal] = useState(0);
  const [pendingCategories, setPendingCategories] = useState([]);
  const [pendingMaxBudget, setPendingMaxBudget] = useState(0);
  const [pendingBudgetSlider, setPendingBudgetSlider] = useState(0);

  const [sortKey, setSortKey] = useState('distance');

  // 1️⃣ categoryCounts first
  const categoryCounts = useMemo(() => {
    const map = {};
    nearbyProperties.forEach(p => {
      if (p.propertyCategory)
        map[p.propertyCategory] = (map[p.propertyCategory] || 0) + 1;
    });
    return map;
  }, [nearbyProperties]);

  // 2️⃣ uniqueCategories second (depends on categoryCounts)
  const uniqueCategories = useMemo(() => {
    const cats = new Set();
    allProperties.forEach(p => {
      if (p.propertyCategory) cats.add(p.propertyCategory);
    });
    return [...cats]
      .filter(cat => (categoryCounts[cat] || 0) > 0)
      .sort((a, b) => (categoryCounts[b] || 0) - (categoryCounts[a] || 0));
  }, [allProperties, categoryCounts]);
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategories.length > 0) count += 1;
    if (maxBudget > 0 && maxBudget < BUDGET_MAX) count += 1;
    return count;
  }, [selectedCategories, maxBudget]);

  const filteredProperties = useMemo(() => {
    return nearbyProperties.filter(p => {
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(p.propertyCategory)
      )
        return false;
      if (maxBudget > 0 && maxBudget < BUDGET_MAX) {
        const price = parseFloat(p.totalOfferPrice || p.totalSalesPrice || 0);
        if (price > maxBudget) return false;
      }
      return true;
    });
  }, [nearbyProperties, selectedCategories, maxBudget]);

  const displayedProperties = useMemo(() => {
    return [...filteredProperties].sort((a, b) => {
      if (sortKey === 'price_asc')
        return (
          parseFloat(a.totalOfferPrice || 0) -
          parseFloat(b.totalOfferPrice || 0)
        );
      if (sortKey === 'price_desc')
        return (
          parseFloat(b.totalOfferPrice || 0) -
          parseFloat(a.totalOfferPrice || 0)
        );
      if (sortKey === 'newest')
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (!userCoords) return 0;
      const da = haversineKm(
        userCoords.lat,
        userCoords.lon,
        parseFloat(a.latitude),
        parseFloat(a.longitude),
      );
      const db = haversineKm(
        userCoords.lat,
        userCoords.lon,
        parseFloat(b.latitude),
        parseFloat(b.longitude),
      );
      return da - db;
    });
  }, [filteredProperties, sortKey, userCoords]);

  const animatePill = useCallback(() => {
    pillAnim.setValue(0);
    Animated.spring(pillAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  }, [pillAnim]);

  const filterNearby = useCallback(
    (props, coords, km) =>
      props.filter(p => {
        const lat = parseFloat(p.latitude);
        const lon = parseFloat(p.longitude);
        return (
          lat && lon && haversineKm(coords.lat, coords.lon, lat, lon) <= km
        );
      }),
    [],
  );

  const flyTo = useCallback((lat, lon, km = radiusKm) => {
    webViewRef.current?.injectJavaScript(
      `window.flyToRadius(${lat}, ${lon}, ${km}); true;`,
    );
  }, [radiusKm]);

  const mapUpdateTimer = useRef(null);

  useEffect(() => {
    if (!webViewReady || !webViewRef.current) return;
    const markers = displayedProperties
      .map(p => ({
        id: p.propertyid,
        lat: parseFloat(p.latitude),
        lon: parseFloat(p.longitude),
        price: p.totalOfferPrice || p.totalSalesPrice,
        selected: selectedProperty?.propertyid === p.propertyid,
      }))
      // Skip missing or out-of-range coords (e.g. a wrapped longitude 439.07)
      .filter(
        m =>
          m.lat &&
          m.lon &&
          Math.abs(m.lat) <= 90 &&
          Math.abs(m.lon) <= 180,
      );
    const payload = JSON.stringify({userCoords, markers, radiusKm});
    if (mapUpdateTimer.current) clearTimeout(mapUpdateTimer.current);
    mapUpdateTimer.current = setTimeout(() => {
      webViewRef.current?.injectJavaScript(
        `window.updateMap(${payload}); true;`,
      );
    }, 80);
    return () => {
      if (mapUpdateTimer.current) clearTimeout(mapUpdateTimer.current);
    };
  }, [
    webViewReady,
    displayedProperties,
    userCoords,
    radiusKm,
    selectedProperty,
  ]);

  const onWebViewMessage = useCallback(
    event => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'MAP_READY') {
          setWebViewReady(true);
        } else if (msg.type === 'MAP_PRESS') {
          setSelectedProperty(null);
        } else if (msg.type === 'MARKER_PRESS') {
          const prop =
            displayedProperties.find(p => p.propertyid === msg.id) ||
            allProperties.find(p => p.propertyid === msg.id);
          if (prop) setSelectedProperty(prop);
        }
      } catch (_) {}
    },
    [displayedProperties, allProperties],
  );

  useEffect(() => {
    if (pendingBudgetSlider === 0) {
      setPendingBudgetSlider(BUDGET_MAX);
      setPendingMaxBudget(BUDGET_MAX);
    }
  }, []);

  const boot = useCallback(
    async (existingProps = null) => {
      setStatus('loading');
      setLoaderStep('map');
      setStatusMsg('Loading map…');

      const hasPerm = await requestAndroidPermission();
      if (!hasPerm) {
        setStatus('error');
        setStatusMsg(locationErrMsg(1));
        return;
      }

      setLoaderStep('properties');
      setStatusMsg('Fetching nearby properties…');

      let props = existingProps;
      try {
        if (!props) {
          const raw = await fetchAllPropertiesCached();
          props = filterActiveProperties(raw);
          setAllProperties(props);
        }
      } catch {
        props = props || [];
      }

      setLoaderStep('location');
      setStatusMsg('Getting your precise location…');

      const savedProfile = await readSavedCityState();
      const profile = {
        city: savedProfile?.city || user?.city,
        state: savedProfile?.state || user?.state || '',
      };

      try {
        let gpsCoords = getLiveFix();
        if (!gpsCoords) {
          try {
            gpsCoords = await getLocationRobust({
              onFastFix: fastCoords => {
                if (!isInIndia(fastCoords.lat, fastCoords.lon)) return;
                setUserCoords(fastCoords);
                setStatusMsg('Refining your location…');
                if (webViewReady) {
                  flyTo(fastCoords.lat, fastCoords.lon, RADIUS_KM_DEFAULT);
                }
              },
            });
          } catch (_) {
            gpsCoords = null;
          }
        }

        if (gpsCoords && !isInIndia(gpsCoords.lat, gpsCoords.lon)) {
          setStatusMsg(
            profile.city
              ? `GPS outside India — using ${profile.city}…`
              : 'GPS unavailable — using India map center…',
          );
        }

        const coords = await resolveMapCoords(gpsCoords, profile);

        setUserCoords(coords);
        const nearby = filterNearby(props, coords, RADIUS_KM_DEFAULT);
        setNearbyProperties(nearby);
        setRadiusKm(RADIUS_KM_DEFAULT);
        setSliderValue(RADIUS_KM_DEFAULT);
        setStatus('ready');
        animatePill();
        requestAnimationFrame(() => {
          flyTo(coords.lat, coords.lon, RADIUS_KM_DEFAULT);
        });
      } catch (err) {
        setStatus('error');
        setStatusMsg(locationErrMsg(err?.code));
      }
    },
    [filterNearby, animatePill, flyTo, webViewReady, user?.city, user?.state],
  );

  useEffect(() => {
    boot();
  }, []);

  // boot() can resolve (live fix + cached properties) before the WebView
  // reports MAP_READY, so do the initial fly-in once both are ready.
  const didInitialFly = useRef(false);
  useEffect(() => {
    if (didInitialFly.current || !webViewReady || status !== 'ready') return;
    if (!userCoords) return;
    didInitialFly.current = true;
    flyTo(userCoords.lat, userCoords.lon, radiusKm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webViewReady, status]);

  // Follow the user's live position: moves the blue dot + radius ring and
  // refreshes the nearby list. The camera only moves on boot / recenter so
  // it never fights the user's panning.
  const {coords: liveCoords} = useUserLocation();
  useEffect(() => {
    if (status !== 'ready' || !liveCoords) return;
    const {latitude: lat, longitude: lon, accuracy} = liveCoords;
    if (!isInIndia(lat, lon)) return;
    setUserCoords({lat, lon, accuracy, source: 'gps'});
    setNearbyProperties(
      filterNearby(allProperties, {lat, lon}, radiusKm),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveCoords, status]);

  const applyRadius = useCallback(
    km => {
      const r = parseFloat(km.toFixed(1));
      setRadiusKm(r);
      setSliderValue(r);
      if (userCoords) {
        setNearbyProperties(filterNearby(allProperties, userCoords, r));
        animatePill();
        setSelectedProperty(null);
        flyTo(userCoords.lat, userCoords.lon, r);
      }
    },
    [allProperties, userCoords, filterNearby, animatePill, flyTo],
  );

  const recenter = useCallback(async () => {
    setStatusMsg('Updating your location…');
    try {
      const savedProfile = await readSavedCityState();
      const profile = {
        city: savedProfile?.city || user?.city,
        state: savedProfile?.state || user?.state || '',
      };
      let gpsCoords = getLiveFix();
      if (!gpsCoords) {
        try {
          gpsCoords = await getLocationRobust();
        } catch (_) {}
      }
      const coords = await resolveMapCoords(gpsCoords, profile);
      setUserCoords(coords);
      setNearbyProperties(
        filterNearby(allProperties, coords, radiusKm),
      );
      flyTo(coords.lat, coords.lon, radiusKm);
      animatePill();
    } catch (_) {
      if (userCoords) flyTo(userCoords.lat, userCoords.lon, radiusKm);
    }
  }, [
    userCoords,
    flyTo,
    user?.city,
    user?.state,
    allProperties,
    radiusKm,
    filterNearby,
    animatePill,
  ]);

  const handleTabSelect = useCallback(
    cat => {
      setActiveTab(cat);
      setSelectedCategories(cat === 'All' ? [] : [cat]);
      setSelectedProperty(null);
      animatePill();
    },
    [animatePill],
  );

  const openFilters = useCallback(() => {
    setPendingCategories([...selectedCategories]);
    setPendingMaxBudget(maxBudget > 0 ? maxBudget : BUDGET_MAX);
    setPendingBudgetSlider(maxBudget > 0 ? maxBudget : BUDGET_MAX);
    setShowFilters(true);
  }, [selectedCategories, maxBudget]);

  const onTogglePendingCategory = useCallback(cat => {
    setPendingCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat],
    );
  }, []);

  const onApplyFilters = useCallback(() => {
    setSelectedCategories(pendingCategories);
    setMaxBudget(pendingMaxBudget >= BUDGET_MAX ? 0 : pendingMaxBudget);
    setBudgetSliderVal(pendingBudgetSlider);
    setSelectedProperty(null);
    setActiveTab('All');
    animatePill();
    setShowFilters(false);
  }, [pendingCategories, pendingMaxBudget, pendingBudgetSlider, animatePill]);

  const onResetFilters = useCallback(() => {
    setPendingCategories([]);
    setPendingMaxBudget(BUDGET_MAX);
    setPendingBudgetSlider(BUDGET_MAX);
  }, []);

  const handleResetAll = useCallback(() => {
    setSelectedCategories([]);
    setMaxBudget(0);
    setBudgetSliderVal(BUDGET_MAX);
    setSelectedProperty(null);
    setActiveTab('All');
    animatePill();
  }, [animatePill]);

  const hasActiveFilters = activeFilterCount > 0 || activeTab !== 'All';
  const showEmptyBanner =
    status === 'ready' &&
    displayedProperties.length === 0 &&
    !selectedProperty &&
    hasActiveFilters;
  const showNoResultsHint =
    status === 'ready' && displayedProperties.length === 0 && !hasActiveFilters;
  // Measured panel height (falls back to the estimate before first layout)
  const sliderPanelBottom = showRadiusPanel
    ? radiusPanelHeight || SLIDER_PANEL_HEIGHT + insets.bottom
    : insets.bottom + 8;
  const fabBottom = sliderPanelBottom + 16;
  const emptyBannerBottom = sliderPanelBottom + 12;

  const pillLabel =
    displayedProperties.length === 0
      ? hasActiveFilters
        ? 'No matches'
        : `0 in ${radiusKm} km`
      : `${displayedProperties.length} ${
          displayedProperties.length === 1 ? 'property' : 'properties'
        }${hasActiveFilters ? ' matched' : ' nearby'}`;

  return (
    <SafeAreaView style={s.container}>
      {/* ══ Category Tab Bar ══════════════════════════════════════════════ */}
      {status === 'ready' && uniqueCategories.length > 0 && (
        <View style={s.topTabBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.topTabContent}
            keyboardShouldPersistTaps="handled">
            <TouchableOpacity
              style={[s.topTab, activeTab === 'All' && s.topTabActive]}
              onPress={() => handleTabSelect('All')}
              activeOpacity={0.75}>
              <Text
                style={[s.topTabTxt, activeTab === 'All' && s.topTabTxtActive]}>
                All
              </Text>
              <View
                style={[
                  s.topTabBadge,
                  activeTab === 'All' && s.topTabBadgeActive,
                ]}>
                <Text
                  style={[
                    s.topTabBadgeTxt,
                    activeTab === 'All' && s.topTabBadgeTxtActive,
                  ]}>
                  {nearbyProperties.length}
                </Text>
              </View>
            </TouchableOpacity>
            {uniqueCategories.map(cat => {
              const isActive = activeTab === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[s.topTab, isActive && s.topTabActive]}
                  onPress={() => handleTabSelect(cat)}
                  activeOpacity={0.75}>
                  <Text style={[s.topTabTxt, isActive && s.topTabTxtActive]}>
                    {prettifyCategory(cat)}
                  </Text>
                  <View
                    style={[s.topTabBadge, isActive && s.topTabBadgeActive]}>
                    <Text
                      style={[
                        s.topTabBadgeTxt,
                        isActive && s.topTabBadgeTxtActive,
                      ]}>
                      {categoryCounts[cat] || 0}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ══ Map wrapper ══════════════════════════════════════════════════ */}
      <View style={s.mapWrapper}>
        <WebView
          ref={webViewRef}
          style={s.map}
          source={{html: LEAFLET_HTML}}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
          allowFileAccess={true}
          scrollEnabled={false}
          onMessage={onWebViewMessage}
        />

        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <ArrowLeft size={20} color={C.text} strokeWidth={2} />
        </TouchableOpacity>

        {status === 'loading' && (
          <MapLoader message={statusMsg} step={loaderStep} />
        )}

        {status === 'error' && (
          <View style={s.overlay}>
            <View style={s.overlayCard}>
              <Text style={s.errEmoji}>📍</Text>
              <Text style={s.errTitle}>Location Error</Text>
              <Text style={s.errMsg}>{statusMsg}</Text>
              <TouchableOpacity
                style={s.retryBtn}
                onPress={() =>
                  boot(allProperties.length ? allProperties : null)
                }>
                <Text style={s.retryTxt}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Count pill */}
        {status === 'ready' && (
          <Animated.View
            style={[
              s.pill,
              {
                opacity: pillAnim,
                transform: [
                  {
                    scale: pillAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                ],
              },
            ]}>
            <View
              style={[
                s.pillDot,
                displayedProperties.length === 0 && s.pillDotEmpty,
              ]}
            />
            <Text style={s.pillTxt} numberOfLines={1}>
              {pillLabel}
            </Text>
          </Animated.View>
        )}

        {/* Map FABs */}
        {status === 'ready' && (
          <View style={[s.fabCol, {bottom: fabBottom}]}>
            <TouchableOpacity
              style={s.fabBtn}
              onPress={recenter}
              activeOpacity={0.85}
              accessibilityLabel="Recenter map">
              <LocateFixed size={18} color={C.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.fabBtn, showRadiusPanel && s.fabBtnActive]}
              onPress={() => setShowRadiusPanel(v => !v)}
              activeOpacity={0.85}
              accessibilityLabel="Search radius">
              <View style={[s.fabIcon, showRadiusPanel && s.fabIconActive]}>
                <Radius
                  size={18}
                  color={showRadiusPanel ? C.white : C.textSub}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.fabBtn, activeFilterCount > 0 && s.fabBtnActive]}
              onPress={openFilters}
              activeOpacity={0.85}>
              <View
                style={[s.fabIcon, activeFilterCount > 0 && s.fabIconActive]}>
                <Filter
                  size={18}
                  color={activeFilterCount > 0 ? C.white : C.textSub}
                />
              </View>
              {activeFilterCount > 0 && (
                <View style={s.fabBadge}>
                  <Text style={s.fabBadgeTxt}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Bottom radius panel ── */}
        {status === 'ready' && showRadiusPanel && (
          <View
            onLayout={e => setRadiusPanelHeight(e.nativeEvent.layout.height)}
            style={[s.sliderPanel, {paddingBottom: Math.max(insets.bottom, 12)}]}>
            <TouchableOpacity
              onPress={() => setShowRadiusPanel(false)}
              hitSlop={{top: 10, bottom: 10, left: 40, right: 40}}
              accessibilityLabel="Close search radius">
              <View style={s.sliderHandle} />
            </TouchableOpacity>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.presetRow}
              style={s.presetScroll}>
              {RADIUS_PRESETS.map(p => {
                const active = radiusKm === p.value;
                return (
                  <TouchableOpacity
                    key={p.value}
                    style={[s.presetChip, active && s.presetChipActive]}
                    onPress={() => applyRadius(p.value)}
                    activeOpacity={0.75}>
                    <Text
                      style={[
                        s.presetChipTxt,
                        active && s.presetChipTxtActive,
                      ]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={s.sliderLabelRow}>
              <View style={s.sliderLabelCol}>
                <Text style={s.sliderLabel}>Search radius</Text>
                {showNoResultsHint ? (
                  <Text style={s.expandHint}>
                    Widen the radius to discover more properties
                  </Text>
                ) : null}
              </View>
              <View style={s.radiusValuePill}>
                <Text style={s.radiusValueTxt}>
                  {sliderValue.toFixed(sliderValue % 1 === 0 ? 0 : 1)} km
                </Text>
              </View>
            </View>

            <View style={s.sliderTrackWrap}>
              <SliderV2
                minimumValue={1}
                maximumValue={100}
                step={0.5}
                value={sliderValue}
                trackHeight={6}
                thumbSize={26}
                touchHeight={44}
                style={s.sliderControl}
                formatLabel={v => `${v.toFixed(1)} km`}
                onValueChange={setSliderValue}
                onSlidingComplete={km => applyRadius(km)}
              />
            </View>

            <View style={s.rangeRow}>
              <Text style={s.rangeTxt}>1 km</Text>
              <Text style={s.rangeTxt}>100 km</Text>
            </View>
          </View>
        )}

        {showEmptyBanner && (
          <EmptyBanner
            onReset={handleResetAll}
            bottomOffset={emptyBannerBottom}
          />
        )}

        {/* Property bottom sheet */}
        {selectedProperty && (
          <PropertyCard
            property={selectedProperty}
            onClose={() => setSelectedProperty(null)}
            navigation={navigation}
            userCoords={userCoords}
          />
        )}

        {/* Filter modal */}
        <FilterPanel
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          uniqueCategories={uniqueCategories}
          selectedCategories={pendingCategories}
          onToggleCategory={onTogglePendingCategory}
          maxBudget={pendingMaxBudget}
          budgetSliderVal={pendingBudgetSlider}
          onBudgetChange={v => {
            setPendingBudgetSlider(v);
            setPendingMaxBudget(v);
          }}
          onBudgetRelease={v => {
            setPendingBudgetSlider(v);
            setPendingMaxBudget(v);
          }}
          onReset={onResetFilters}
          onApply={onApplyFilters}
          activeCount={
            (pendingCategories.length > 0 ? 1 : 0) +
            (pendingMaxBudget < BUDGET_MAX ? 1 : 0)
          }
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Property Card Styles (redesigned) ───────────────────────────────────────
const pc = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -8},
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 0,
  },

  // ── Hero banner ──
  heroBanner: {
    height: 148,
    backgroundColor: C.accentBlue,
    overflow: 'hidden',
    position: 'relative',
  },
  heroFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F1FB',
  },
  heroFallbackIcon: {
    fontSize: 44,
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0)',
    // top scrim for badges
  },
  // Gradient-like scrim at bottom of hero for location text legibility
  heroBadgeRow: {
    position: 'absolute',
    top: 10,
    left: 12,
    flexDirection: 'row',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: C.primary,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  categoryBadgeTxt: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  closeTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  heroLocationRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  heroLocationIcon: {
    fontSize: 12,
  },
  heroLocationTxt: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },

  // ── Body ──
  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 18,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  propName: {
    flex: 1,
    color: C.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  priceBlock: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  priceLabel: {
    color: C.textMuted,
    fontSize: 9,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  priceMain: {
    color: C.primary,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 23,
  },
  priceStrike: {
    color: C.textMuted,
    fontSize: 11,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },

  // ── Stat chips ──
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: C.bg,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  statChipGreen: {
    backgroundColor: '#EAF3DE',
    borderColor: '#C0DD97',
  },
  statChipWide: {
    flex: 1,
    flexWrap: 'wrap',
  },
  statIcon: {
    fontSize: 14,
  },
  statLabel: {
    color: C.textMuted,
    fontSize: 9,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    color: C.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  statValueGreen: {
    color: '#27500A',
  },

  // ── CTA button ──
  ctaBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: C.accentBlueDark,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaBtnTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  ctaArrow: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

// ─── General Styles ───────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},

  // Tab bar
  topTabBar: {
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  topTabContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  topTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.bg,
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  topTabActive: {backgroundColor: C.primary, borderColor: C.primary},
  topTabTxt: {color: C.textSub, fontSize: 12, fontWeight: '600'},
  topTabTxtActive: {color: C.white, fontWeight: '700'},
  topTabBadge: {
    backgroundColor: C.primaryLight,
    borderRadius: 20,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  topTabBadgeActive: {backgroundColor: 'rgba(255,255,255,0.25)'},
  topTabBadgeTxt: {color: C.primary, fontSize: 10, fontWeight: '800'},
  topTabBadgeTxtActive: {color: C.white},

  // Map
  mapWrapper: {flex: 1},
  map: {flex: 1},

  // Loader
  mapLoaderWrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248,250,252,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  mapLoaderCard: {
    backgroundColor: C.card,
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 26,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  mapLoaderPinOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  mapLoaderRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: C.primary,
    borderRightColor: C.primary,
  },
  mapLoaderPinIcon: {fontSize: 26},
  mapLoaderTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  mapLoaderMsg: {
    color: C.textSub,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  mapLoaderSteps: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  mapLoaderStep: {
    width: 28,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.border,
  },
  mapLoaderStepActive: {backgroundColor: C.primary},

  // Overlays
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248,250,252,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  overlayCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  errEmoji: {fontSize: 38, marginBottom: 10},
  errTitle: {color: C.text, fontSize: 17, fontWeight: '700', marginBottom: 8},
  errMsg: {
    color: C.textSub,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  retryBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 50,
    shadowColor: C.shadow,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  retryTxt: {color: C.white, fontWeight: '700', fontSize: 14},

  // Pill
  pill: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 16 : 14,
    left: 68,
    right: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 55,
  },
  pillDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: C.success},
  pillDotEmpty: {backgroundColor: '#F59E0B'},
  pillTxt: {
    color: C.text,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: -0.1,
    flexShrink: 1,
  },

  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 16 : 14,
    left: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 60,
  },

  // FAB
  fabCol: {
    position: 'absolute',
    right: 14,
    gap: 10,
    alignItems: 'center',
    zIndex: 5,
  },
  fabBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  fabBtnActive: {backgroundColor: C.primary, borderColor: C.primary},
  fabIcon: {alignItems: 'center', justifyContent: 'center'},
  fabIconActive: {},
  fabBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.white,
  },
  fabBadgeTxt: {color: C.white, fontSize: 9, fontWeight: '800'},

  // Radius slider panel
  sliderPanel: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 18,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -6},
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 16,
    zIndex: 6,
  },
  sliderHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    marginBottom: 14,
  },
  presetScroll: {marginBottom: 14},
  presetRow: {flexDirection: 'row', gap: 8, paddingRight: 4},
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
    minWidth: 56,
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: C.primaryLight,
    borderColor: C.primary,
  },
  presetChipTxt: {color: C.textSub, fontSize: 13, fontWeight: '600'},
  presetChipTxtActive: {color: C.primary, fontWeight: '700'},
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  sliderLabelCol: {flex: 1, minWidth: 0},
  sliderLabel: {
    color: C.text,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  expandHint: {
    marginTop: 3,
    color: '#B45309',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  radiusValuePill: {
    backgroundColor: C.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  radiusValueTxt: {color: C.primary, fontSize: 13, fontWeight: '800'},
  sliderTrackWrap: {
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  sliderControl: {marginHorizontal: 0},
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  rangeTxt: {color: C.textSub, fontSize: 12, fontWeight: '600'},

  // Compact empty banner (filter mismatch only)
  emptyBanner: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.white,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    zIndex: 4,
    gap: 10,
  },
  emptyBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emptyBannerIcon: {fontSize: 18},
  emptyBannerTextWrap: {flex: 1},
  emptyBannerTitle: {
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 1,
  },
  emptyBannerSub: {color: C.textSub, fontSize: 11, lineHeight: 15},
  emptyBannerBtn: {
    backgroundColor: C.primary,
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  emptyBannerBtnTxt: {color: C.white, fontWeight: '700', fontSize: 12},

  // Filter
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.5)',
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  filterCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.16,
    shadowRadius: 24,
    zIndex: 51,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterTitle: {color: C.text, fontSize: 17, fontWeight: '800'},
  resetBtn: {
    backgroundColor: C.bg,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.border,
  },
  resetTxt: {color: C.textSub, fontSize: 12, fontWeight: '600'},
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: C.border,
    flexShrink: 0,
  },
  closeTxt: {color: C.textSub, fontSize: 12, fontWeight: '600', lineHeight: 14},
  divider: {height: 1, backgroundColor: C.border, marginBottom: 16},
  filterLabel: {
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  chipRow: {flexDirection: 'row', gap: 8, paddingBottom: 4, paddingRight: 8},
  chip: {
    backgroundColor: C.bg,
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  chipActive: {backgroundColor: C.primaryLight, borderColor: C.primary},
  chipTxt: {color: C.textSub, fontSize: 12, fontWeight: '600'},
  chipTxtActive: {color: C.primary, fontWeight: '700'},
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  amountInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  amountPrefix: {
    color: C.primary,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    color: C.text,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 0,
  },
  amountParsed: {
    backgroundColor: C.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  amountParsedTxt: {color: C.primary, fontSize: 12, fontWeight: '800'},
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 4,
  },
  budgetBadge: {
    backgroundColor: C.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  budgetBadgeTxt: {color: C.primary, fontSize: 12, fontWeight: '800'},
  slider: {marginHorizontal: 0, marginBottom: 0},
  sliderRangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 2,
  },
  sliderRangeTxt: {color: C.textMuted, fontSize: 11},
  applyBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: C.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  applyTxt: {color: C.white, fontSize: 15, fontWeight: '700'},
});
