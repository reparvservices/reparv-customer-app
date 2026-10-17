import React, {useCallback, useState, useEffect, useRef} from 'react';
import {API_BASE_URL} from '../../config/api';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Platform,
  PixelRatio,
  Animated,
  InteractionManager,
  PermissionsAndroid, //  ADDED
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {MapPin, ChevronDown, Search, User} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation'; //  ADDED
import {getImageUri} from '../../utils/imageHandle';
import {
  persistGuestLocation,
  selectBrowseCity,
  selectBrowseState,
  setUserLocation,
} from '../../features/auth/authSlice';

const heroBanner = require('../../assets/image/home/Hero-Banner.png');

// ── Responsive helpers ──────────────────────────────────────────────────────
const {width} = Dimensions.get('window');
const BASE_WIDTH = 390;
const scale = width / BASE_WIDTH;
const rs = size => Math.round(PixelRatio.roundToNearestPixel(size * scale));
const rf = (size, min = size * 0.8, max = size * 1.2) =>
  Math.min(max, Math.max(min, rs(size)));

//  Safe dev logger — no crash in production
const devLog = (...args) => {
  if (__DEV__) console.log(...args);
};

const API_HOST = API_BASE_URL;

// ── Placeholder templates (city injected at runtime) ──────────────────────
const PLACEHOLDER_TEMPLATES = [
  city => `1 BHK in ${city}`,
  city => `Plot in ${city}`,
  city => `2 BHK in ${city}`,
  city => `Villa in ${city}`,
  city => `Commercial space in ${city}`,
  city => `3 BHK flat in ${city}`,
  city => `Affordable homes in ${city}`,
  city => `New launch in ${city}`,
];

// ── Typewriter hook ───────────────────────────────────────────────────────
function useTypewriterPlaceholder(city) {
  const [displayText, setDisplayText] = useState('');
  const cursorAnim = useRef(new Animated.Value(1)).current;
  const indexRef = useRef(0);
  const charIndexRef = useRef(0);
  const phaseRef = useRef('typing');
  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const blinkRef = useRef(null);

  const cityLabel = city || 'your city';

  useEffect(() => {
    mountedRef.current = true;
    blinkRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    blinkRef.current.start();
    return () => {
      mountedRef.current = false;
      blinkRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    charIndexRef.current = 0;
    phaseRef.current = 'typing';
    setDisplayText('');

    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      if (!mountedRef.current) return;

      const tick = () => {
        if (!mountedRef.current) return;

        const fullText =
          PLACEHOLDER_TEMPLATES[
            indexRef.current % PLACEHOLDER_TEMPLATES.length
          ](cityLabel);

        if (phaseRef.current === 'typing') {
          charIndexRef.current += 1;
          setDisplayText(fullText.slice(0, charIndexRef.current));
          if (charIndexRef.current >= fullText.length) {
            phaseRef.current = 'pause';
            timerRef.current = setTimeout(tick, 1800);
            return;
          }
          timerRef.current = setTimeout(tick, 65);
        } else if (phaseRef.current === 'pause') {
          phaseRef.current = 'erasing';
          timerRef.current = setTimeout(tick, 40);
        } else if (phaseRef.current === 'erasing') {
          charIndexRef.current -= 1;
          setDisplayText(fullText.slice(0, charIndexRef.current));
          if (charIndexRef.current <= 0) {
            indexRef.current += 1;
            charIndexRef.current = 0;
            phaseRef.current = 'typing';
            timerRef.current = setTimeout(tick, 380);
            return;
          }
          timerRef.current = setTimeout(tick, 32);
        }
      };

      timerRef.current = setTimeout(tick, 500);
    });

    return () => {
      interactionHandle.cancel();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [cityLabel]);

  return {displayText, cursorAnim};
}

// ─────────────────────────────────────────────────────────────────────────────

export default function HomeHeader() {
  const navigation = useNavigation();
  const {user} = useSelector(state => state.auth);
  const browseCity = useSelector(selectBrowseCity);
  const browseState = useSelector(selectBrowseState);
  const [userimage, setUserImage] = useState(null);
  const dispatch = useDispatch();

  const searchPulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(searchPulseAnim, {
          toValue: 1.012,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(searchPulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // ── Request location permission ─────────────────────────────────────────
  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const alreadyGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (alreadyGranted) {
          devLog('📍 Location permission already granted.');
          return true;
        }
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'This app needs access to your location to show nearby properties.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          },
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true; // iOS — handled via Info.plist
    } catch (error) {
      devLog('Location permission error:', error);
      return false;
    }
  };

  // ── Fetch city + state from GPS coords ─────────────────────────────────
  const getUserCityAndState = useCallback(async () => {
    try {
      const locationSource = await AsyncStorage.getItem('locationSource');
      if (locationSource === 'manual' && user?.city && user?.state) {
        devLog('📍 Manual location set, skipping GPS fetch.');
        return;
      }

      if (browseCity && browseState) {
        return;
      }

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        devLog('📍 Location permission denied.');
        return;
      }

      Geolocation.getCurrentPosition(
        async position => {
          const {latitude, longitude} = position.coords;
          devLog('📍 Current position:', latitude, longitude);

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {headers: {'User-Agent': 'Reparv-App'}},
          );
          const data = await response.json();
          devLog('🗺️ Geocoding response:', data);

          const city =
            data?.address?.city ||
            data?.address?.town ||
            data?.address?.village ||
            data?.address?.suburb ||
            '';
          const state = data?.address?.state || '';

          if (city && state) {
            devLog('📍 Resolved GPS location:', {city, state});

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
              // ✅ Mark source as gps so future manual picks can still override
              await AsyncStorage.setItem('locationSource', 'gps');
            } catch (storageError) {
              devLog('AsyncStorage error:', storageError);
            }

            dispatch(setUserLocation({city, state}));
          }
        },
        error => {
          devLog('📍 Geolocation error:', error);
        },
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    } catch (error) {
      devLog('getUserCityAndState error:', error);
    }
  }, [browseCity, browseState, dispatch, user?.city, user?.state]);
  // ── Fetch user profile image ────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('Reparvuser');
      if (!userData) return;
      const parsedUser = JSON.parse(userData);
      if (!parsedUser?.id) return;
      const res = await fetch(
        `${API_HOST}/customerapp/user/profile?id=${parsedUser.id}`,
      );
      const data = await res.json();
      if (res.ok && data?.data?.userimage) {
        setUserImage(data.data.userimage);
      }
    } catch (err) {
      devLog('Profile fetch error:', err);
    }
  }, []);

  //  Both profile AND location are fetched when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const load = async () => {
        if (!isActive) return;
        await fetchProfile();
        await getUserCityAndState(); //  NOW ACTUALLY CALLED
      };
      load();
      return () => {
        isActive = false;
      };
    }, [fetchProfile, getUserCityAndState]),
  );

  const locationLine =
    browseCity && browseState
      ? `${browseCity}, ${browseState}`
      : browseCity || browseState || 'Set your location';

  const openLocationPicker = useCallback(() => {
    navigation.navigate('LocationPickerScreen');
  }, [navigation]);

  const {displayText, cursorAnim} = useTypewriterPlaceholder(browseCity);
  const styles = makeStyles();

  return (
    <View style={styles.topBlock}>
      {/* ── Top row: location + avatar ── */}
      <View style={styles.row}>
        <View style={styles.locationBlock}>
          <View style={styles.pinCircle}>
            <MapPin size={rs(18)} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <View style={styles.locationTextWrap}>
            <Text style={styles.yourLoc}>Your Location</Text>
            <TouchableOpacity
              style={styles.locationLineRow}
              activeOpacity={0.7}
              onPress={openLocationPicker}>
              <Text
                style={styles.locationMain}
                numberOfLines={1}
                ellipsizeMode="tail">
                {locationLine}
              </Text>
              <ChevronDown size={rs(17)} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.85}
          style={styles.avatarOuter}>
          {userimage ? (
            <Image source={{uri: getImageUri(userimage)}} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <User size={rs(22)} color="#8A38F5" strokeWidth={2} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Search bar ── */}
      <Animated.View style={{transform: [{scale: searchPulseAnim}]}}>
        <TouchableOpacity
          style={styles.searchShell}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('PropertyListScreen')}>
          <View style={styles.searchIconWrap}>
            <Search size={rs(16)} color="#8A38F5" strokeWidth={2.2} />
          </View>
          <View style={styles.searchDivider} />
          <View style={styles.placeholderRow}>
            <Text
              style={styles.searchPlaceholder}
              numberOfLines={1}
              ellipsizeMode="tail">
              {displayText || 'Search properties…'}
            </Text>
            <Animated.Text style={[styles.cursor, {opacity: cursorAnim}]}>
              |
            </Animated.Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
function makeStyles() {
  const avatarSize = Math.min(60, Math.max(44, rs(52)));
  const pinSize = Math.min(50, Math.max(38, rs(44)));

  return StyleSheet.create({
    topBlock: {
      paddingHorizontal: rs(20),
      paddingTop: rs(8),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: rs(16),
    },
    locationBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
      marginRight: rs(10),
    },
    pinCircle: {
      width: pinSize,
      height: pinSize,
      borderRadius: pinSize / 2,
      backgroundColor: '#6E56CF',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginRight: rs(10),
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.08)',
    },
    locationTextWrap: {
      flex: 1,
      minWidth: 0,
    },
    yourLoc: {
      fontSize: rf(12, 10, 13),
      color: '#868686',
      marginBottom: 2,
    },
    locationLineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 0,
    },
    locationMain: {
      fontSize: rf(17, 13, 17),
      fontWeight: '700',
      color: '#111827',
      flex: 1,
      minWidth: 0,
      marginRight: 1,
      ...Platform.select({
        android: {includeFontPadding: false, textAlignVertical: 'center'},
        default: {},
      }),
    },
    avatarOuter: {
      borderRadius: avatarSize / 2 + 2,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.08)',
      overflow: 'hidden',
      backgroundColor: '#FFFFFF',
      flexShrink: 0,
    },
    avatar: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
    },
    avatarFallback: {
      backgroundColor: '#F3ECFE',
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchShell: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: rs(28),
      paddingLeft: rs(12),
      paddingRight: rs(16),
      paddingVertical: Platform.OS === 'ios' ? rs(13) : rs(11),
      borderWidth: 1.5,
      borderColor: 'rgba(138,56,245,0.18)',
      marginBottom: rs(4),
      ...Platform.select({
        ios: {
          shadowColor: '#8A38F5',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
      }),
    },
    searchIconWrap: {
      width: rs(32),
      height: rs(32),
      borderRadius: rs(16),
      backgroundColor: 'rgba(138,56,245,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    searchDivider: {
      width: 1,
      height: rs(20),
      backgroundColor: 'rgba(0,0,0,0.1)',
      marginHorizontal: rs(10),
      flexShrink: 0,
    },
    placeholderRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 0,
      overflow: 'hidden',
    },
    searchPlaceholder: {
      fontSize: rf(14, 12, 16),
      color: '#9CA3AF',
      flexShrink: 1,
      ...Platform.select({
        android: {includeFontPadding: false},
        default: {},
      }),
    },
    cursor: {
      fontSize: rf(16, 14, 18),
      color: '#8A38F5',
      fontWeight: '300',
      marginLeft: 1,
      ...Platform.select({
        android: {includeFontPadding: false, textAlignVertical: 'center'},
        default: {},
      }),
    },
  });
}
