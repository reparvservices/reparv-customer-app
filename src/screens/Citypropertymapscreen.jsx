import React, {useEffect, useRef, useState, useCallback, useMemo} from 'react';
import {API_BASE_URL} from '../config/api';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
  Platform,
  ScrollView,
  TextInput,
  FlatList,
  PanResponder,
} from 'react-native';
import {WebView} from 'react-native-webview';
import Slider from '@react-native-community/slider';
import {getImageUri} from '../utils/imageHandle';
import {formatDistance, useUserLocation} from '../hooks/userLocation';
import {
  ArrowLeft,
  Filter,
  ChevronDown,
  Search,
  X,
  Check,
  Home,
  Ruler,
  Compass,
  CreditCard,
  Building2,
  MapPin,
  TriangleAlert,
  RefreshCcw,
  SquareDashedMousePointer,
  ScanSearch,
} from 'lucide-react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_URL = `${API_BASE_URL}/frontend/all-properties`;

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
  skeleton1: '#E2E8F0',
};

const BUDGET_MIN = 1_000;
const BUDGET_MAX = 50_000_000;
const BUDGET_STEP = 15_000;

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

// A wrapped map pick can store e.g. longitude 439.07 — never plot those
const isValidCoord = (lat, lon) =>
  Number.isFinite(lat) &&
  Number.isFinite(lon) &&
  lat !== 0 &&
  lon !== 0 &&
  Math.abs(lat) <= 90 &&
  Math.abs(lon) <= 180;

const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

function computeCityBounds(cityProps) {
  const coords = cityProps
    .map(p => ({lat: parseFloat(p.latitude), lon: parseFloat(p.longitude)}))
    .filter(c => isValidCoord(c.lat, c.lon));
  if (!coords.length) return null;

  // Median, not mean: one mistyped location must not pull the map off the city
  const centLat = median(coords.map(c => c.lat));
  const centLon = median(coords.map(c => c.lon));

  let maxDist = 0;
  coords.forEach(c => {
    const d = haversineKm(centLat, centLon, c.lat, c.lon);
    if (d > maxDist) maxDist = d;
  });

  const circleKm = Math.max(maxDist + 3, 8);
  return {lat: centLat, lon: centLon, circleKm};
}

function circleKmToZoom(km) {
  if (km < 5) return 14;
  if (km < 10) return 13;
  if (km < 20) return 12;
  if (km < 50) return 11;
  return 10;
}

// ─── Leaflet HTML ─────────────────────────────────────────────────────────────
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
    html, body, #map { width:100%; height:100%; background:#0f172a; }
    .leaflet-control-attribution,
    .leaflet-control-zoom { display:none !important; }
    .pm-wrap { display:flex; flex-direction:column; align-items:center; }
    .pm-bubble {
      background:#6E56CF; padding:5px 10px; border-radius:10px;
      display:flex; flex-direction:column; align-items:center;
      box-shadow:0 2px 8px rgba(110,86,207,0.35); white-space:nowrap;
    }
    .pm-bubble.sel { background:#fff; border:2px solid #6E56CF; }
    .pm-price {
      color:#fff; font-weight:700; font-size:11.5px;
      font-family:-apple-system,sans-serif; line-height:1.3;
    }
    .pm-bubble.sel .pm-price { color:#6E56CF; }
    .pm-pin {
      width:0; height:0;
      border-left:5px solid transparent;
      border-right:5px solid transparent;
      border-top:7px solid #6E56CF;
    }
    .city-dot {
      width:14px; height:14px; border-radius:7px;
      background:#6E56CF; border:3px solid #fff;
      box-shadow:0 0 0 2px #6E56CF;
    }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl:false, attributionControl:false });
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { maxZoom:19, tileSize:256 }
  ).addTo(map);
  map.setView([20.5937, 78.9629], 5);
  var propertyMarkers = {};
  var cityCircle     = null;
  var cityCenterDot  = null;
  function _fmt(val) {
    var n = parseFloat(val);
    if (!n) return '\u2014';
    if (n >= 10000000) return '\u20b9' + (n/10000000).toFixed(1) + ' Cr';
    if (n >= 100000)   return '\u20b9' + (n/100000).toFixed(2)   + ' L';
    if (n >= 1000)     return '\u20b9' + (n/1000).toFixed(0)     + 'K';
    return '\u20b9' + n;
  }
  function _priceIcon(price, selected) {
    var priceStr = _fmt(price);
    var html = '<div class="pm-wrap">' +
               '<div class="pm-bubble'+(selected?' sel':'')+'">'+
               '<span class="pm-price">'+priceStr+'</span></div>'+
               '<div class="pm-pin"></div></div>';
    var w = Math.max(priceStr.length * 8 + 22, 58);
    return L.divIcon({ html:html, className:'', iconSize:[w,36], iconAnchor:[w/2,36] });
  }
  map.on('click', function() {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type:'MAP_PRESS' }));
  });
  window.flyTo = function(lat, lon, zoom) {
    map.setView([lat, lon], zoom || 12, { animate:true, duration:0.9 });
  };
  window.clearMap = function() {
    Object.keys(propertyMarkers).forEach(function(id) {
      map.removeLayer(propertyMarkers[id]);
    });
    propertyMarkers = {};
    if (cityCircle)    { map.removeLayer(cityCircle);    cityCircle    = null; }
    if (cityCenterDot) { map.removeLayer(cityCenterDot); cityCenterDot = null; }
  };
  window.updateCityMap = function(data) {
    var center     = data.centerCoords;
    var mList      = data.markers || [];
    var circleKm   = data.circleKm   || 10;
    var selectedId = data.selectedId || null;
    if (center) {
      var cLL = [center.lat, center.lon];
      if (cityCircle) {
        cityCircle.setLatLng(cLL);
        cityCircle.setRadius(circleKm * 1000);
      } else {
        cityCircle = L.circle(cLL, {
          radius:      circleKm * 1000,
          color:       '#6E56CF',
          weight:      2,
          dashArray:   '8, 5',
          fillColor:   'rgba(110,86,207,0.07)',
          fillOpacity: 1,
        }).addTo(map);
      }
      var dotIcon = L.divIcon({
        html:'<div class="city-dot"></div>',
        className:'', iconSize:[14,14], iconAnchor:[7,7],
      });
      if (cityCenterDot) {
        cityCenterDot.setLatLng(cLL);
        cityCenterDot.setIcon(dotIcon);
      } else {
        cityCenterDot = L.marker(cLL, { icon:dotIcon, zIndexOffset:999 }).addTo(map);
      }
    }
    var incoming = {};
    mList.forEach(function(m) { incoming[m.id] = true; });
    Object.keys(propertyMarkers).forEach(function(id) {
      if (!incoming[id]) { map.removeLayer(propertyMarkers[id]); delete propertyMarkers[id]; }
    });
    mList.forEach(function(m) {
      if (!m.lat || !m.lon) return;
      var sel  = m.id === selectedId;
      var icon = _priceIcon(m.price, sel);
      if (propertyMarkers[m.id]) {
        propertyMarkers[m.id].setIcon(icon);
        propertyMarkers[m.id].setZIndexOffset(sel ? 200 : 0);
      } else {
        var mk = L.marker([m.lat, m.lon], {
          icon:icon, zIndexOffset:sel ? 200 : 0, bubblingMouseEvents:false,
        });
        mk.on('click', function() {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type:'MARKER_PRESS', id:m.id })
          );
        });
        mk.addTo(map);
        propertyMarkers[m.id] = mk;
      }
    });
  };
  window.ReactNativeWebView.postMessage(JSON.stringify({ type:'MAP_READY' }));
<\/script>
</body>
</html>`;

// ─── Custom Slider ────────────────────────────────────────────────────────────
const CustomSlider = ({
  minimumValue = 0,
  maximumValue = 1,
  step = 0,
  value,
  onValueChange,
  onSlidingComplete,
  style,
}) => {
  const trackWidth = useRef(0);
  const animVal = useRef(new Animated.Value(value)).current;
  const currentVal = useRef(value);

  // Sync animVal when value prop changes externally
  useEffect(() => {
    animVal.setValue(value);
    currentVal.current = value;
  }, [value]);

  const clampStep = raw => {
    const range = maximumValue - minimumValue;
    let clamped = Math.max(minimumValue, Math.min(maximumValue, raw));
    if (step > 0) {
      clamped =
        Math.round((clamped - minimumValue) / step) * step + minimumValue;
    }
    return Math.max(minimumValue, Math.min(maximumValue, clamped));
  };

  const xToValue = x => {
    const ratio = Math.max(0, Math.min(1, x / (trackWidth.current || 1)));
    return clampStep(minimumValue + ratio * (maximumValue - minimumValue));
  };

  const valueToRatio = v => (v - minimumValue) / (maximumValue - minimumValue);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: evt => {
        const x = evt.nativeEvent.locationX;
        const newVal = xToValue(x);
        currentVal.current = newVal;
        animVal.setValue(newVal);
        onValueChange?.(newVal);
      },
      onPanResponderMove: evt => {
        const x = evt.nativeEvent.locationX;
        const newVal = xToValue(x);
        if (newVal !== currentVal.current) {
          currentVal.current = newVal;
          animVal.setValue(newVal);
          onValueChange?.(newVal);
        }
      },
      onPanResponderRelease: () => {
        onSlidingComplete?.(currentVal.current);
      },
    }),
  ).current;

  const thumbLeft = animVal.interpolate({
    inputRange: [minimumValue, maximumValue],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[{height: 40, justifyContent: 'center'}, style]}
      {...panResponder.panHandlers}
      onLayout={e => {
        trackWidth.current = e.nativeEvent.layout.width;
      }}>
      {/* Track background */}
      <View style={cs.track}>
        {/* Filled portion */}
        <Animated.View
          style={[
            cs.fill,
            {
              width: thumbLeft.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      {/* Thumb */}
      <Animated.View
        style={[
          cs.thumb,
          {
            left: thumbLeft.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
};

const cs = StyleSheet.create({
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: C.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: C.primary,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.white,
    borderWidth: 2.5,
    borderColor: C.primary,
    top: '50%',
    marginTop: -11,
    marginLeft: -11,
    shadowColor: C.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
});
// ─── Skeleton ─────────────────────────────────────────────────────────────────
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
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: C.skeleton1,
          opacity: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 1],
          }),
        },
        style,
      ]}
    />
  );
};

// ─── City Picker Modal ────────────────────────────────────────────────────────
const CityPickerModal = ({
  visible,
  onClose,
  cities,
  selectedCity,
  onSelect,
}) => {
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const slideY = useRef(new Animated.Value(700)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const filtered = useMemo(() => {
    if (!search.trim()) return cities;
    return cities.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [cities, search]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setSearch('');
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(slideY, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideY, {
          toValue: 700,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({finished}) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <Animated.View style={[cp.backdrop, {opacity}]}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onClose}
      />
      <Animated.View style={[cp.sheet, {transform: [{translateY: slideY}]}]}>
        <View style={cp.handle} />

        {/* Header */}
        <View style={cp.header}>
          <Text style={cp.title}>Select City</Text>
          <TouchableOpacity style={cp.closeBtn} onPress={onClose}>
            <X size={16} color={C.textSub} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={cp.searchWrap}>
          <Search size={15} color={C.textMuted} strokeWidth={2} />
          <TextInput
            style={cp.searchInput}
            placeholder="Search city…"
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            autoCapitalize="words"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <X size={14} color={C.textMuted} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.name}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={cp.list}
          ListEmptyComponent={
            <View style={cp.emptySearch}>
              <Text style={cp.emptySearchTxt}>No cities match "{search}"</Text>
            </View>
          }
          renderItem={({item}) => {
            const active = selectedCity === item.name;
            return (
              <TouchableOpacity
                style={[cp.cityRow, active && cp.cityRowActive]}
                onPress={() => {
                  onSelect(item.name);
                  onClose();
                }}
                activeOpacity={0.75}>
                <View style={cp.cityLeft}>
                  <View
                    style={[cp.cityIconWrap, active && cp.cityIconWrapActive]}>
                    <Building2
                      size={18}
                      color={active ? C.primary : C.textMuted}
                      strokeWidth={1.8}
                    />
                  </View>
                  <View style={cp.cityMeta}>
                    <Text style={[cp.cityName, active && cp.cityNameActive]}>
                      {item.name}
                    </Text>
                    <Text style={cp.cityCount}>{item.count} properties</Text>
                  </View>
                </View>
                {active ? (
                  <View style={cp.cityCheckWrap}>
                    <Check size={13} color={C.white} strokeWidth={3} />
                  </View>
                ) : (
                  <ChevronDown
                    size={16}
                    color={C.textMuted}
                    style={{transform: [{rotate: '-90deg'}]}}
                  />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </Animated.View>
    </Animated.View>
  );
};

const cp = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.52)',
    zIndex: 70,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -6},
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  title: {color: C.text, fontSize: 17, fontWeight: '800'},
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  list: {paddingHorizontal: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 16},
  emptySearch: {alignItems: 'center', paddingVertical: 32},
  emptySearchTxt: {color: C.textMuted, fontSize: 14},

  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginBottom: 4,
  },
  cityRowActive: {backgroundColor: C.primaryLight},
  cityLeft: {flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12},
  cityIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityIconWrapActive: {
    backgroundColor: C.primaryMid + '40',
    borderColor: C.primaryMid,
  },
  cityMeta: {flex: 1},
  cityName: {color: C.text, fontSize: 14, fontWeight: '700', marginBottom: 2},
  cityNameActive: {color: C.primary},
  cityCount: {color: C.textMuted, fontSize: 11, fontWeight: '500'},
  cityCheckWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

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
        {/* Header */}
        <View style={s.filterHeader}>
          <Text style={s.filterTitle}>Filters</Text>
          <View style={{flexDirection: 'row', gap: 8, alignItems: 'center'}}>
            {activeCount > 0 && (
              <TouchableOpacity style={s.resetBtn} onPress={onReset}>
                <RefreshCcw size={12} color={C.textSub} strokeWidth={2.5} />
                <Text style={s.resetTxt}>Reset</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <X size={15} color={C.textSub} strokeWidth={2.5} />
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
              {maxBudget >= BUDGET_MAX ? '₹5Cr+' : formatPrice(maxBudget)}
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
                  onBudgetChange(Math.min(num, BUDGET_MAX));
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
          contentContainerStyle={[s.chipRow, {marginBottom: 4}]}>
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
        <CustomSlider
          style={s.slider}
          minimumValue={BUDGET_MIN}
          maximumValue={BUDGET_MAX}
          step={BUDGET_STEP}
          value={budgetSliderVal}
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
          <Text style={s.sliderRangeTxt}>₹5Cr</Text>
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

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({hasFilters, onReset, noCity, onPickCity}) => {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        s.emptyState,
        {transform: [{scale: scaleAnim}], opacity: opacityAnim},
      ]}>
      {noCity ? (
        <Building2
          size={42}
          color={C.primaryMid}
          strokeWidth={1.5}
          style={{marginBottom: 12}}
        />
      ) : (
        <ScanSearch
          size={42}
          color={C.primaryMid}
          strokeWidth={1.5}
          style={{marginBottom: 12}}
        />
      )}
      <Text style={s.emptyTitle}>
        {noCity ? 'Choose a City' : 'No properties found'}
      </Text>
      <Text style={s.emptySubtitle}>
        {noCity
          ? 'Tap the city button above to browse properties in any city.'
          : 'No properties match your filters. Try resetting them.'}
      </Text>
      <View style={s.emptyActions}>
        {noCity && (
          <TouchableOpacity
            style={s.emptyBtnPrimary}
            onPress={onPickCity}
            activeOpacity={0.8}>
            <Text style={s.emptyBtnPrimaryTxt}>Pick a City</Text>
          </TouchableOpacity>
        )}
        {hasFilters && !noCity && (
          <TouchableOpacity
            style={s.emptyBtnOutline}
            onPress={onReset}
            activeOpacity={0.8}>
            <Text style={s.emptyBtnOutlineTxt}>Reset Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CityPropertyMapScreen({navigation}) {
  // Distance chip on the property card (null until location is available)
  const {coords: userLocation} = useUserLocation();
  const userCoords = useMemo(
    () =>
      userLocation
        ? {lat: userLocation.latitude, lon: userLocation.longitude}
        : null,
    [userLocation],
  );
  const webViewRef = useRef(null);

  const [status, setStatus] = useState('loading');
  const [statusMsg, setStatusMsg] = useState('Loading properties…');
  const [allProperties, setAllProperties] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [webViewReady, setWebViewReady] = useState(false);
  const pillAnim = useRef(new Animated.Value(0)).current;

  const [showCityPicker, setShowCityPicker] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [maxBudget, setMaxBudget] = useState(0);
  const [budgetSliderVal, setBudgetSliderVal] = useState(BUDGET_MAX);
  const [pendingCategories, setPendingCategories] = useState([]);
  const [pendingMaxBudget, setPendingMaxBudget] = useState(BUDGET_MAX);
  const [pendingBudgetSlider, setPendingBudgetSlider] = useState(BUDGET_MAX);

  const uniqueCities = useMemo(() => {
    const map = {};
    allProperties.forEach(p => {
      if (p.city) {
        const name = p.city.trim();
        map[name] = (map[name] || 0) + 1;
      }
    });
    return Object.entries(map)
      .map(([name, count]) => ({name, count}))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [allProperties]);

  const cityProperties = useMemo(() => {
    if (!selectedCity) return [];
    return allProperties.filter(p => p.city && p.city.trim() === selectedCity);
  }, [allProperties, selectedCity]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set();
    cityProperties.forEach(p => {
      if (p.propertyCategory) cats.add(p.propertyCategory);
    });
    return [...cats].sort();
  }, [cityProperties]);

  const cityBounds = useMemo(() => {
    if (!cityProperties.length) return null;
    return computeCityBounds(cityProperties);
  }, [cityProperties]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategories.length > 0) count += 1;
    if (maxBudget > 0 && maxBudget < BUDGET_MAX) count += 1;
    return count;
  }, [selectedCategories, maxBudget]);

  const filteredProperties = useMemo(() => {
    return cityProperties.filter(p => {
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
  }, [cityProperties, selectedCategories, maxBudget]);

  const categoryCounts = useMemo(() => {
    const map = {};
    cityProperties.forEach(p => {
      if (p.propertyCategory)
        map[p.propertyCategory] = (map[p.propertyCategory] || 0) + 1;
    });
    return map;
  }, [cityProperties]);

  const animatePill = useCallback(() => {
    pillAnim.setValue(0);
    Animated.spring(pillAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  }, [pillAnim]);

  const flyTo = useCallback((lat, lon, zoom) => {
    webViewRef.current?.injectJavaScript(
      `window.flyTo(${lat}, ${lon}, ${zoom || 12}); true;`,
    );
  }, []);

  useEffect(() => {
    if (!webViewReady || !webViewRef.current) return;
    if (!selectedCity || !cityBounds) {
      webViewRef.current.injectJavaScript(`window.clearMap(); true;`);
      return;
    }
    const markers = filteredProperties
      .map(p => ({
        id: p.propertyid,
        lat: parseFloat(p.latitude),
        lon: parseFloat(p.longitude),
        price: p.totalOfferPrice || p.totalSalesPrice,
      }))
      .filter(m => isValidCoord(m.lat, m.lon));

    const payload = JSON.stringify({
      centerCoords: {lat: cityBounds.lat, lon: cityBounds.lon},
      markers,
      circleKm: cityBounds.circleKm,
      selectedId: selectedProperty?.propertyid ?? null,
    });
    webViewRef.current.injectJavaScript(
      `window.updateCityMap(${payload}); true;`,
    );
  }, [
    webViewReady,
    filteredProperties,
    cityBounds,
    selectedCity,
    selectedProperty,
  ]);

  useEffect(() => {
    if (!webViewReady || !cityBounds) return;
    const zoom = circleKmToZoom(cityBounds.circleKm);
    setTimeout(() => flyTo(cityBounds.lat, cityBounds.lon, zoom), 200);
  }, [webViewReady, cityBounds]);

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
            filteredProperties.find(p => p.propertyid === msg.id) ||
            allProperties.find(p => p.propertyid === msg.id);
          if (prop) setSelectedProperty(prop);
        }
      } catch (_) {}
    },
    [filteredProperties, allProperties],
  );

  const boot = useCallback(async () => {
    setStatus('loading');
    setStatusMsg('Loading properties…');
    // ─── inside boot() ────────────────────────────────────────────────────────────
    const props = await fetch(API_URL)
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : d.properties || d.data || [];
        return list.filter(
          item =>
            item.status === 'Active' &&
            item.approve === 'Approved' &&
            !!parseFloat(item.latitude) && // ← add this
            !!parseFloat(item.longitude), // ← add this
        );
      })
      .catch(() => []);
    setAllProperties(props);
    setStatus('ready');
    animatePill();
  }, [animatePill]);

  useEffect(() => {
    boot();
  }, []);

  const handleCitySelect = useCallback(
    city => {
      setSelectedCity(city);
      setSelectedProperty(null);
      setActiveTab('All');
      setSelectedCategories([]);
      animatePill();
    },
    [animatePill],
  );

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

  return (
    <SafeAreaView style={s.container}>
      {/* ── Top Bar ── */}
      <View style={s.topBar}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <ArrowLeft size={22} color={C.text} strokeWidth={2} />
        </TouchableOpacity>

        {/* City picker */}
        <TouchableOpacity
          style={s.cityPickerBtn}
          onPress={() => setShowCityPicker(true)}
          activeOpacity={0.8}>
          <Building2 size={16} color={C.primary} strokeWidth={2} />
          <Text style={s.cityPickerTxt} numberOfLines={1}>
            {selectedCity || 'Select City'}
          </Text>
          <ChevronDown
            size={16}
            color={selectedCity ? C.primary : C.textMuted}
          />
        </TouchableOpacity>

        {/* Filter button */}
        <TouchableOpacity
          style={[s.topBarBtn, activeFilterCount > 0 && s.topBarBtnActive]}
          onPress={openFilters}
          activeOpacity={0.8}>
          <Filter
            size={14}
            color={activeFilterCount > 0 ? C.white : C.textSub}
            strokeWidth={2}
          />
          <Text
            style={[
              s.topBarBtnTxt,
              activeFilterCount > 0 && s.topBarBtnTxtActive,
            ]}>
            Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Category Tab Bar ── */}
      {status === 'ready' && selectedCity && uniqueCategories.length > 0 && (
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
                  {cityProperties.length}
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

      {/* ── Map Wrapper ── */}
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

        {/* Loading overlay */}
        {status === 'loading' && (
          <View style={s.overlay}>
            <View style={s.overlayCard}>
              <ActivityIndicator size="large" color={C.primary} />
              <Text style={s.overlayMsg}>{statusMsg}</Text>
            </View>
          </View>
        )}

        {/* Error overlay */}
        {status === 'error' && (
          <View style={s.overlay}>
            <View style={s.overlayCard}>
              <TriangleAlert
                size={38}
                color={C.danger}
                strokeWidth={1.5}
                style={{marginBottom: 10}}
              />
              <Text style={s.errTitle}>Failed to load</Text>
              <Text style={s.errMsg}>{statusMsg}</Text>
              <TouchableOpacity style={s.retryBtn} onPress={boot}>
                <RefreshCcw size={14} color={C.white} strokeWidth={2.5} />
                <Text style={s.retryTxt}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Property count pill */}
        {status === 'ready' && selectedCity && (
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
            <View style={s.pillDot} />
            <Text style={s.pillTxt}>
              {filteredProperties.length}{' '}
              {filteredProperties.length === 1 ? 'property' : 'properties'}
              {activeFilterCount > 0 || activeTab !== 'All'
                ? ' matched'
                : ` in ${selectedCity}`}
            </Text>
          </Animated.View>
        )}

        {/* Empty state */}
        {status === 'ready' &&
          !selectedProperty &&
          (!selectedCity ||
            (selectedCity && filteredProperties.length === 0)) && (
            <EmptyState
              noCity={!selectedCity}
              hasFilters={activeFilterCount > 0 || activeTab !== 'All'}
              onReset={handleResetAll}
              onPickCity={() => setShowCityPicker(true)}
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

      {/* City picker (full screen, outside mapWrapper) */}
      <CityPickerModal
        visible={showCityPicker}
        onClose={() => setShowCityPicker(false)}
        cities={uniqueCities}
        selectedCity={selectedCity}
        onSelect={handleCitySelect}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  cityPickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: C.primaryMid,
  },
  cityPickerTxt: {flex: 1, color: C.primary, fontSize: 14, fontWeight: '700'},
  topBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  topBarBtnActive: {backgroundColor: C.primary, borderColor: C.primary},
  topBarBtnTxt: {color: C.textSub, fontSize: 12, fontWeight: '600'},
  topBarBtnTxtActive: {color: C.white, fontWeight: '700'},

  // Tab Bar
  topTabBar: {
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 10,
    zIndex: 9,
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

  // Overlays
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248,250,252,0.9)',
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
  overlayMsg: {
    color: C.textSub,
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  errTitle: {color: C.text, fontSize: 17, fontWeight: '700', marginBottom: 8},
  errMsg: {
    color: C.textSub,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  pillDot: {width: 7, height: 7, borderRadius: 4, backgroundColor: C.success},
  pillTxt: {color: C.text, fontWeight: '600', fontSize: 13},

  // Property sheet
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.08,
    shadowRadius: 16,
    borderTopWidth: 1,
    borderColor: C.border,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  sheetName: {color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 6},
  tagRow: {flexDirection: 'row', gap: 6, flexWrap: 'wrap'},
  tagBlue: {
    backgroundColor: C.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  tagBlueTxt: {color: C.primary, fontSize: 11, fontWeight: '700'},
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  cityStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 12,
  },
  cityStripTxt: {color: C.primary, fontSize: 13, fontWeight: '600', flex: 1},
  cardRow: {flexDirection: 'row', gap: 12, marginBottom: 14},
  cardImg: {width: 84, height: 84, borderRadius: 12, backgroundColor: C.bg},
  cardImgFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  cardInfo: {flex: 1, justifyContent: 'center', gap: 5},
  infoRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  infoTxt: {color: C.textSub, fontSize: 12, flex: 1, lineHeight: 17},
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  priceLabel: {
    color: C.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  priceMain: {color: C.primary, fontSize: 20, fontWeight: '800'},
  priceStrike: {
    color: C.textMuted,
    fontSize: 12,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  detailsBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    shadowColor: C.shadow,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  detailsBtnTxt: {color: C.white, fontSize: 13, fontWeight: '700'},

  // Empty state
  emptyState: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  emptyTitle: {color: C.text, fontSize: 17, fontWeight: '800', marginBottom: 8},
  emptySubtitle: {
    color: C.textSub,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  emptyBtnOutline: {
    borderWidth: 1.5,
    borderColor: C.primary,
    borderRadius: 50,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  emptyBtnOutlineTxt: {color: C.primary, fontWeight: '700', fontSize: 13},
  emptyBtnPrimary: {
    backgroundColor: C.primary,
    borderRadius: 50,
    paddingHorizontal: 22,
    paddingVertical: 11,
    shadowColor: C.shadow,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  emptyBtnPrimaryTxt: {color: C.white, fontWeight: '700', fontSize: 13},

  // Filter modal
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.bg,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.border,
  },
  resetTxt: {color: C.textSub, fontSize: 12, fontWeight: '600'},
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
  slider: {height: 38, marginHorizontal: -6},
  sliderRangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
