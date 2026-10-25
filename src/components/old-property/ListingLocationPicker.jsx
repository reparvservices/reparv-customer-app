import React, {useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {WebView} from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';
import {LocateFixed} from 'lucide-react-native';

// Map pin for a listing — same behaviour, tiles and default centre as the
// website's LocationPicker (reparv-website src/components/dashboard/LocationPicker.jsx).
// Leaflet in a WebView, like the app's Map View screen.

const PURPLE = '#8A38F5';
const DEFAULT_CENTER = [21.1458, 79.0882];

const buildHtml = initial => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; background:#e8edf3; }
    .leaflet-control-attribution { font-size:9px !important; }
    .pin { width:26px; height:26px; border-radius:50% 50% 50% 0; background:${PURPLE};
           transform:rotate(-45deg); border:3px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,.35); }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var initial = ${JSON.stringify(initial)};
  var map = L.map('map', { zoomControl: true, attributionControl: true })
    .setView(initial || ${JSON.stringify(DEFAULT_CENTER)}, initial ? 16 : 12);
  L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], maxZoom: 20, attribution: '© Google Maps'
  }).addTo(map);

  var icon = L.divIcon({ className: '', html: '<div class="pin"></div>', iconSize: [26, 26], iconAnchor: [13, 26] });
  var marker = null;

  function send(lat, lng) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ lat: lat, lng: lng }));
  }
  function placeMarker(lat, lng) {
    if (marker) { marker.setLatLng([lat, lng]); return; }
    marker = L.marker([lat, lng], { draggable: true, icon: icon }).addTo(map);
    marker.on('dragend', function (e) {
      var p = e.target.getLatLng();
      send(p.lat, p.lng);
    });
  }
  // Called from the app
  window.setPin = function (lat, lng, fly) {
    placeMarker(lat, lng);
    if (fly) map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 0.6 });
  };
  window.clearPin = function () {
    if (marker) { map.removeLayer(marker); marker = null; }
  };

  if (initial) placeMarker(initial[0], initial[1]);
  map.on('click', function (e) {
    placeMarker(e.latlng.lat, e.latlng.lng);
    send(e.latlng.lat, e.latlng.lng);
  });
</script>
</body>
</html>`;

/**
 * latitude / longitude : strings (may be empty)
 * onChange(lat, lng)   : strings, or ('', '') when the pin is removed
 */
export default function ListingLocationPicker({latitude, longitude, onChange}) {
  const webRef = useRef(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  const hasPin = !!(latitude && longitude);

  // Built once: later pin changes go through injectJavaScript so the map keeps its view
  const html = useMemo(
    () => buildHtml(hasPin ? [Number(latitude), Number(longitude)] : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const pick = (lat, lng) => {
    setGeoError('');
    onChange(lat.toFixed(7), lng.toFixed(7));
  };

  const onMessage = event => {
    try {
      const {lat, lng} = JSON.parse(event.nativeEvent.data);
      if (Number.isFinite(lat) && Number.isFinite(lng)) pick(lat, lng);
    } catch {
      /* ignore */
    }
  };

  const removePin = () => {
    webRef.current?.injectJavaScript('window.clearPin(); true;');
    onChange('', '');
  };

  const locateMe = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        setGeoError(
          "Couldn't get your location. Allow location access or tap the map instead.",
        );
        return;
      }
    }
    setLocating(true);
    setGeoError('');
    Geolocation.getCurrentPosition(
      pos => {
        setLocating(false);
        const {latitude: lat, longitude: lng} = pos.coords;
        pick(lat, lng);
        webRef.current?.injectJavaScript(
          `window.setPin(${lat}, ${lng}, true); true;`,
        );
      },
      () => {
        setLocating(false);
        setGeoError(
          "Couldn't get your location. Allow location access or tap the map instead.",
        );
      },
      {enableHighAccuracy: true, timeout: 10000},
    );
  };

  return (
    <View>
      <Text style={styles.hint}>
        {hasPin
          ? 'Drag the pin or tap the map to adjust it.'
          : "Tap the map to drop a pin at the property's location."}
      </Text>
      <View style={styles.actions}>
        {hasPin && (
          <TouchableOpacity onPress={removePin}>
            <Text style={styles.removeText}>Remove pin</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.locateBtn, locating && styles.dimmed]}
          disabled={locating}
          onPress={locateMe}>
          {locating ? (
            <ActivityIndicator size="small" color={PURPLE} />
          ) : (
            <LocateFixed size={14} color={PURPLE} />
          )}
          <Text style={styles.locateText}>
            {locating ? 'Locating...' : 'Use my current location'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapBox}>
        <WebView
          ref={webRef}
          originWhitelist={['*']}
          source={{html}}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          nestedScrollEnabled
          scrollEnabled={false}
          overScrollMode="never"
          style={styles.web}
        />
      </View>

      {geoError ? <Text style={styles.error}>{geoError}</Text> : null}
      {hasPin && (
        <Text style={styles.coords}>
          {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {fontSize: 12, color: '#868686', marginBottom: 8},
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginBottom: 8,
  },
  removeText: {fontSize: 12, fontWeight: '600', color: '#6B7280'},
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PURPLE,
  },
  locateText: {fontSize: 12, fontWeight: '600', color: PURPLE},
  dimmed: {opacity: 0.6},
  mapBox: {
    height: 260,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  web: {flex: 1, backgroundColor: '#e8edf3'},
  error: {fontSize: 12, color: '#EF4444', marginTop: 4},
  coords: {fontSize: 11, color: '#9CA3AF', marginTop: 4},
});
