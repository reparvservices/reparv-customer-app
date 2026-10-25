/**
 * LocationPickerScreen.js  —  Reparv
 * Simple State → City location picker
 * Robust 3-step GPS fallback  ·  Android permission handling
 */
import {API_BASE_URL} from '../../config/api';

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  Dimensions,
  PixelRatio,
  Animated,
  PermissionsAndroid,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {
  ArrowLeft,
  Search,
  X,
  MapPin,
  LocateFixed,
  Check,
  ChevronRight,
  AlertCircle,
} from 'lucide-react-native';
import {
  resumeLiveLocation,
  saveBrowseLocation,
} from '../../services/liveLocation';
import {SafeAreaView} from 'react-native-safe-area-context';

// ─────────────────────────────────────────────────────────────────────────────
// Responsive
// ─────────────────────────────────────────────────────────────────────────────
const {width} = Dimensions.get('window');
const BASE = 390;
const sc = width / BASE;
const rs = v => Math.round(PixelRatio.roundToNearestPixel(v * sc));
const rf = (v, lo = v * 0.82, hi = v * 1.18) =>
  Math.min(hi, Math.max(lo, rs(v)));

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────
const P = {
  primary: '#7C3AED',
  dark: '#1F2937',
  gray: '#6B7280',
  light: '#F3F4F6',
  white: '#FFFFFF',
  border: '#E5E7EB',
  green: '#10B981',
  red: '#EF4444',
};

const API = API_BASE_URL;

// ─────────────────────────────────────────────────────────────────────────────
// Android permission helper
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Error message helper
// ─────────────────────────────────────────────────────────────────────────────
function locationErrMsg(code) {
  if (code === 1) return 'Permission denied. Enable Location in Settings.';
  if (code === 2) return 'GPS unavailable. Make sure Location is ON.';
  if (code === 3) return 'Timed out. Move to open area and retry.';
  return 'Could not get location. Please try again.';
}

// ═════════════════════════════════════════════════════════════════════════════
// SCREEN
// ═════════════════════════════════════════════════════════════════════════════
export default function LocationPickerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const {user, guestLocation} = useSelector(s => s.auth);
  const activeCity = user?.city ?? guestLocation?.city;
  const activeState = user?.state ?? guestLocation?.state;
  const onSelectParam = route?.params?.onSelect;

  // ── data state ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState('state');
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selState, setSelState] = useState('');
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [stateQ, setStateQ] = useState('');
  const [cityQ, setCityQ] = useState('');

  // ── geo state ──────────────────────────────────────────────────────────────
  const [geoPhase, setGeoPhase] = useState('idle');
  const [geoMsg, setGeoMsg] = useState('');

  // ── animation refs ─────────────────────────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(0)).current;

  // ── mount ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchStates();
  }, []);

  // ── API helpers ────────────────────────────────────────────────────────────
  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const d = await (await fetch(`${API}/admin/states`)).json();
      setStates(d || []);
    } catch {
      setStates([]);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchCities = async name => {
    setLoadingCities(true);
    setCities([]);
    try {
      const d = await (
        await fetch(`${API}/admin/cities/${encodeURIComponent(name)}`)
      ).json();
      setCities(d || []);
    } catch {
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  // ── persist & go back ─────────────────────────────────────────────────────
  const persist = useCallback(
    async (city, state, source = 'manual') => {
      // 'manual' pins this city; 'gps' keeps following the live location
      await saveBrowseLocation(dispatch, city, state, source);
      if (onSelectParam) onSelectParam(city, state);
      navigation.goBack();
    },
    [dispatch, onSelectParam, navigation],
  );
  // ── slide animations ───────────────────────────────────────────────────────
  const slideToCity = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 260,
      useNativeDriver: true,
    }).start(() => {
      setStep('city');
      slideAnim.setValue(width);
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 68,
        friction: 12,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const slideToState = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 240,
      useNativeDriver: true,
    }).start(() => {
      setStep('state');
      setStateQ('');
      slideAnim.setValue(-width);
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 68,
        friction: 12,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // ── handlers ───────────────────────────────────────────────────────────────
  const onStatePress = useCallback(
    item => {
      setSelState(item.state);
      setCityQ('');
      fetchCities(item.state);
      slideToCity();
    },
    [slideToCity],
  );

  const onCityPress = useCallback(
    item => persist(item.city, selState),
    [persist, selState],
  );

  const onBack = useCallback(() => {
    if (step === 'city') slideToState();
    else navigation.goBack();
  }, [step, slideToState, navigation]);

  // ── detect location ────────────────────────────────────────────────────────
  const detectLocation = useCallback(async () => {
    setGeoPhase('loading');
    setGeoMsg('');
    try {
      const granted = await requestAndroidPermission();
      if (!granted) {
        setGeoPhase('error');
        setGeoMsg('Permission denied. Enable Location in Settings.');
        return;
      }
      const {city, state} = await resumeLiveLocation();
      if (!city && !state) {
        setGeoPhase('error');
        setGeoMsg('Location detected but city not found. Select manually.');
        return;
      }
      await persist(city, state, 'gps');
    } catch (err) {
      setGeoPhase('error');
      setGeoMsg(locationErrMsg(err?.code));
    }
  }, [persist]);

  // ── filtered data ──────────────────────────────────────────────────────────
  const filtStates = stateQ
    ? states.filter(s => s.state.toLowerCase().includes(stateQ.toLowerCase()))
    : states;

  const filtCities = cityQ
    ? cities.filter(c => c.city.toLowerCase().includes(cityQ.toLowerCase()))
    : cities;

  const currentLabel =
    activeCity && activeState
      ? `${activeCity}, ${activeState}`
      : activeCity || activeState || null;

  // ── renderers ──────────────────────────────────────────────────────────────
  const renderState = useCallback(
    ({item}) => {
      const active = item.state === (activeState || '');
      return (
        <TouchableOpacity
          style={[s.row, active && s.rowActive]}
          onPress={() => onStatePress(item)}
          activeOpacity={0.7}>
          <Text style={[s.rowLabel, active && s.rowLabelActive]}>
            {item.state}
          </Text>
          {active ? (
            <View style={s.checkBadge}>
              <Check size={rs(14)} color={P.white} strokeWidth={2.5} />
            </View>
          ) : (
            <ChevronRight size={rs(18)} color={P.border} strokeWidth={2} />
          )}
        </TouchableOpacity>
      );
    },
    [activeState, onStatePress],
  );

  const renderCity = useCallback(
    ({item}) => {
      const active = item.city === (activeCity || '');
      return (
        <TouchableOpacity
          style={[s.row, active && s.rowActive]}
          onPress={() => onCityPress(item)}
          activeOpacity={0.7}>
          <Text style={[s.rowLabel, active && s.rowLabelActive]}>
            {item.city}
          </Text>
          {active && (
            <View style={s.checkBadge}>
              <Check size={rs(14)} color={P.white} strokeWidth={2.5} />
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [activeCity, onCityPress],
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      <View style={s.safe}>
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={onBack}
            hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
            <ArrowLeft size={rs(22)} color={P.dark} strokeWidth={2} />
          </TouchableOpacity>

          <View style={s.titleBox}>
            <Text style={s.title}>
              {step === 'state' ? 'Select State' : selState}
            </Text>
            {currentLabel && (
              <View style={s.currentChip}>
                <MapPin size={rs(12)} color={P.gray} strokeWidth={2} />
                <Text style={s.currentTxt} numberOfLines={1}>
                  {currentLabel}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Search ──────────────────────────────────────────────────── */}
        <View style={s.searchBox}>
          <Search size={rs(18)} color={P.gray} strokeWidth={2} />
          <TextInput
            style={s.searchInput}
            placeholder={step === 'state' ? 'Search state' : 'Search city'}
            placeholderTextColor={P.gray}
            value={step === 'state' ? stateQ : cityQ}
            onChangeText={step === 'state' ? setStateQ : setCityQ}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {(step === 'state' ? stateQ : cityQ).length > 0 && (
            <TouchableOpacity
              onPress={() => (step === 'state' ? setStateQ('') : setCityQ(''))}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <X size={rs(18)} color={P.gray} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Detect location ─────────────────────────────────────────── */}
        <TouchableOpacity
          style={s.detectBtn}
          activeOpacity={0.7}
          onPress={detectLocation}
          disabled={geoPhase === 'loading'}>
          {geoPhase === 'loading' ? (
            <ActivityIndicator size="small" color={P.primary} />
          ) : (
            <LocateFixed size={rs(18)} color={P.primary} strokeWidth={2} />
          )}
          <Text style={s.detectTxt}>
            {geoPhase === 'loading'
              ? 'Detecting location...'
              : 'Use current location'}
          </Text>
        </TouchableOpacity>

        {/* ── Error banner ────────────────────────────────────────────── */}
        {geoPhase === 'error' && (
          <View style={s.errBanner}>
            <AlertCircle size={rs(16)} color={P.red} strokeWidth={2} />
            <Text style={s.errTxt}>{geoMsg}</Text>
            <TouchableOpacity
              onPress={() => {
                setGeoPhase('idle');
                setGeoMsg('');
              }}>
              <X size={rs(16)} color={P.red} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── List ─────────────────────────────────────────────────────── */}
        <Animated.View
          style={[s.listBox, {transform: [{translateX: slideAnim}]}]}>
          {step === 'state' ? (
            loadingStates ? (
              <View style={s.center}>
                <ActivityIndicator size="large" color={P.primary} />
              </View>
            ) : (
              <FlatList
                data={filtStates}
                keyExtractor={i => String(i.id)}
                renderItem={renderState}
                ItemSeparatorComponent={() => <View style={s.divider} />}
                contentContainerStyle={{paddingBottom: rs(40)}}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={s.center}>
                    <Text style={s.emptyTxt}>No states found</Text>
                  </View>
                }
              />
            )
          ) : loadingCities ? (
            <View style={s.center}>
              <ActivityIndicator size="large" color={P.primary} />
            </View>
          ) : (
            <FlatList
              data={filtCities}
              keyExtractor={i => String(i.id)}
              renderItem={renderCity}
              ItemSeparatorComponent={() => <View style={s.divider} />}
              contentContainerStyle={{paddingBottom: rs(40)}}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={s.center}>
                  <Text style={s.emptyTxt}>No cities found</Text>
                </View>
              }
            />
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.white,
  },
  safe: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(16),
    paddingVertical: rs(12),
    gap: rs(12),
    borderBottomWidth: 1,
    borderBottomColor: P.border,
  },
  backBtn: {
    width: rs(40),
    height: rs(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBox: {
    flex: 1,
  },
  title: {
    fontSize: rf(20, 18, 22),
    fontWeight: '700',
    color: P.dark,
  },
  currentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    marginTop: rs(4),
  },
  currentTxt: {
    fontSize: rf(13, 12, 14),
    color: P.gray,
    fontWeight: '500',
  },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    marginHorizontal: rs(16),
    marginTop: rs(16),
    marginBottom: rs(12),
    paddingHorizontal: rs(14),
    paddingVertical: Platform.OS === 'ios' ? rs(12) : rs(8),
    backgroundColor: P.light,
    borderRadius: rs(12),
    borderWidth: 1,
    borderColor: P.border,
  },
  searchInput: {
    flex: 1,
    fontSize: rf(15, 14, 16),
    color: P.dark,
    padding: 0,
  },

  // Detect button
  detectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    marginHorizontal: rs(16),
    marginBottom: rs(12),
    paddingVertical: rs(14),
    backgroundColor: P.light,
    borderRadius: rs(12),
    borderWidth: 1,
    borderColor: P.border,
  },
  detectTxt: {
    fontSize: rf(14, 13, 15),
    fontWeight: '600',
    color: P.primary,
  },

  // Error banner
  errBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    marginHorizontal: rs(16),
    marginBottom: rs(12),
    paddingHorizontal: rs(12),
    paddingVertical: rs(10),
    backgroundColor: '#FEE2E2',
    borderRadius: rs(10),
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errTxt: {
    flex: 1,
    fontSize: rf(13, 12, 14),
    color: P.red,
    fontWeight: '500',
  },

  // List
  listBox: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(20),
    paddingVertical: rs(16),
    backgroundColor: P.white,
  },
  rowActive: {
    backgroundColor: '#F9FAFB',
  },
  rowLabel: {
    fontSize: rf(16, 15, 17),
    fontWeight: '500',
    color: P.dark,
    flex: 1,
  },
  rowLabelActive: {
    fontWeight: '600',
    color: P.primary,
  },
  checkBadge: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(14),
    backgroundColor: P.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: P.border,
    marginLeft: rs(20),
  },

  // Empty/Loading
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: rs(60),
  },
  emptyTxt: {
    fontSize: rf(14, 13, 15),
    color: P.gray,
  },
});
