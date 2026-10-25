import React, {useState, useEffect, useRef, useCallback} from 'react';
import {API_BASE_URL} from '../config/api';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
  TextInput,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch} from 'react-redux';
import {setUser} from '../features/auth/authSlice';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowBigRight} from 'lucide-react-native';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const PANEL_HEIGHT = SCREEN_HEIGHT * 0.64;

// ── Colour tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#F8F5FF', // very soft lavender white
  surface: '#FFFFFF',
  surfaceAlt: '#F2ECFF', // light violet tint
  accent: '#8A38F5', // primary violet
  accentDark: '#6B1FD4', // deeper violet
  accentLight: '#EEE4FF', // blush violet tint
  accentMid: '#B67AF8', // mid violet
  accentGlow: 'rgba(138,56,245,0.18)',
  ink: '#1A0533', // very dark violet-black
  inkMid: '#5B4B72', // muted violet grey
  inkFaint: '#A394B8', // light violet grey
  border: '#E4D9F7',
  borderActive: '#8A38F5',
  white: '#FFFFFF',
};

// ── Decorative illustration ───────────────────────────────────────────────────
const LocationIllustration = () => (
  <View style={ill.wrap}>
    {/* Pulsing rings */}
    <View style={[ill.ring, ill.ring3]} />
    <View style={[ill.ring, ill.ring2]} />
    <View style={[ill.ring, ill.ring1]} />

    {/* Hexagon-like background */}
    <View style={ill.hexBg} />

    {/* Pin outer circle */}
    <View style={ill.pinOuter}>
      <View style={ill.pinInner}>
        {/* White hole */}
        <View style={ill.pinHole} />
      </View>
    </View>
    {/* Pin tail */}
    <View style={ill.pinTail} />
    {/* Drop shadow */}
    <View style={ill.pinShadow} />

    {/* Sparkle dots */}
    <View style={[ill.spark, {top: 12, right: 28, width: 8, height: 8}]} />
    <View
      style={[
        ill.spark,
        {top: 32, left: 18, width: 5, height: 5, opacity: 0.5},
      ]}
    />
    <View
      style={[
        ill.spark,
        {bottom: 30, right: 16, width: 6, height: 6, opacity: 0.7},
      ]}
    />
    <View
      style={[
        ill.spark,
        {bottom: 18, left: 26, width: 4, height: 4, opacity: 0.4},
      ]}
    />
    {/* Small cross stars */}
    <View style={[ill.starH, {top: 20, left: 30}]} />
    <View style={[ill.starV, {top: 20, left: 30}]} />
    <View style={[ill.starH, {bottom: 36, right: 28, opacity: 0.5}]} />
    <View style={[ill.starV, {bottom: 36, right: 28, opacity: 0.5}]} />
  </View>
);

// ── Search bar ────────────────────────────────────────────────────────────────
const SearchBar = ({value, onChange, placeholder}) => (
  <View style={ps.wrap}>
    <Text style={ps.icon}>🔍</Text>
    <TextInput
      style={ps.input}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={C.inkFaint}
      autoCorrect={false}
    />
    {value.length > 0 && (
      <TouchableOpacity onPress={() => onChange('')} style={ps.clearBtn}>
        <Text style={ps.clearText}>✕</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ── Main screen ───────────────────────────────────────────────────────────────
export default function CompleteProfileScreen({navigation}) {
  const dispatch = useDispatch();

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [saving, setSaving] = useState(false);

  // Animated values
  const panelAnim = useRef(new Animated.Value(PANEL_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const heroAnim = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.85)).current;
  const headAnim = useRef(new Animated.Value(0)).current;
  const headY = useRef(new Animated.Value(24)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card1Y = useRef(new Animated.Value(28)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card2Y = useRef(new Animated.Value(28)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;
  const btnY = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroAnim, {
          toValue: 1,
          duration: 480,
          useNativeDriver: true,
        }),
        Animated.spring(heroScale, {
          toValue: 1,
          tension: 55,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(headAnim, {
          toValue: 1,
          duration: 360,
          useNativeDriver: true,
        }),
        Animated.timing(headY, {
          toValue: 0,
          duration: 360,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(card1Anim, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(card1Y, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(card2Anim, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(card2Y, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(btnAnim, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(btnY, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    fetchStates();
  }, []);

  useEffect(() => {
    if (selectedState) {
      setSelectedCity(null);
      setCities([]);
      fetchCities(selectedState.state);
    }
  }, [selectedState]);

  const openPanel = useCallback(
    type => {
      setSearchText('');
      setActivePanel(type);
      Animated.parallel([
        Animated.spring(panelAnim, {
          toValue: 0,
          tension: 68,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [panelAnim, backdropAnim],
  );

  const closePanel = useCallback(() => {
    Animated.parallel([
      Animated.timing(panelAnim, {
        toValue: PANEL_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActivePanel(null);
      setSearchText('');
    });
  }, [panelAnim, backdropAnim]);

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/states`);
      const data = await res.json();
      setStates(data || []);
    } catch (err) {
      console.log('Error fetching states:', err);
      Alert.alert('Error', 'Failed to load states. Please try again.');
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchCities = async stateName => {
    setLoadingCities(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/cities/${stateName}`,
      );
      const data = await res.json();
      setCities(data || []);
    } catch (err) {
      console.log('Error fetching cities:', err);
      Alert.alert('Error', 'Failed to load cities. Please try again.');
    } finally {
      setLoadingCities(false);
    }
  };

  const handleSelectState = item => {
    setSelectedState(item);
    closePanel();
  };
  const handleSelectCity = item => {
    setSelectedCity(item);
    closePanel();
  };

  const handleSave = async () => {
    if (!selectedState || !selectedCity) {
      Alert.alert('Required', 'Please select both State and City to continue.');
      return;
    }
    setSaving(true);
    try {
      const userData = await AsyncStorage.getItem('Reparvuser');
      if (!userData) return;
      const parsedUser = JSON.parse(userData);

      const res = await fetch(
        `${API_BASE_URL}/customerapp/user/update`,
        {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            fullname: parsedUser?.fullname,
            contact: parsedUser?.contact,
            user_id: parsedUser.id,
            state: selectedState.state,
            city: selectedCity.city,
          }),
        },
      );
      const result = await res.json();

      if (res.ok) {
        const updatedUser = {
          ...parsedUser,
          state: selectedState.state,
          city: selectedCity.city,
        };
        await AsyncStorage.setItem('Reparvuser', JSON.stringify(updatedUser));
        dispatch(setUser(updatedUser));
        navigation.replace('MainTabs');
      } else {
        Alert.alert('Error', result?.message || 'Failed to save. Try again.');
      }
    } catch (err) {
      console.log('Save error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Panel derived
  const isLoading = activePanel === 'state' ? loadingStates : loadingCities;
  const rawList = activePanel === 'state' ? states : cities;
  const labelKey = activePanel === 'state' ? 'state' : 'city';
  const panelTitle =
    activePanel === 'state' ? 'Select Your State' : 'Select Your City';
  const searchPlaceholder =
    activePanel === 'state' ? 'Search states...' : 'Search cities...';
  const filteredList = rawList.filter(item =>
    item[labelKey]?.toLowerCase().includes(searchText.toLowerCase()),
  );
  const canContinue = !!selectedState && !!selectedCity && !saving;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar backgroundColor={C.bg} barStyle="dark-content" />

      {/* Soft violet blob decorations */}
      <View style={s.blob1} />
      <View style={s.blob2} />
      <View style={s.blob3} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* ── Top pill ── */}
        <Animated.View style={[s.pillWrap, {opacity: heroAnim}]}>
          <View style={s.pill}>
            <View style={s.pillDot} />
            <Text style={s.pillText}>LOCATION SETUP</Text>
          </View>
        </Animated.View>

        {/* ── Illustration ── */}
        <Animated.View
          style={[
            s.heroWrap,
            {opacity: heroAnim, transform: [{scale: heroScale}]},
          ]}>
          <LocationIllustration />
        </Animated.View>

        {/* ── Headline ── */}
        <Animated.View
          style={[
            s.headWrap,
            {opacity: headAnim, transform: [{translateY: headY}]},
          ]}>
          <Text style={s.headline}>Where do you{'\n'}want to explore?</Text>
          <Text style={s.sub}>
            Pick your state & city — we'll show you the best properties nearby
          </Text>
        </Animated.View>

        {/* ── State card ── */}
        <Animated.View
          style={[
            {opacity: card1Anim, transform: [{translateY: card1Y}]},
            s.fieldWrap,
          ]}>
          <View style={s.labelRow}>
            <Text style={s.fieldLabel}>STATE</Text>
            {selectedState && (
              <View style={s.tickBadge}>
                <Text style={s.tickBadgeText}>✓ Done</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[s.card, selectedState && s.cardActive]}
            onPress={() => openPanel('state')}
            activeOpacity={0.8}>
            {/* Gradient-like left strip */}
            <View style={[s.strip, selectedState && s.stripActive]} />
            <View
              style={[s.cardIconWrap, selectedState && s.cardIconWrapActive]}>
              <Text style={s.cardEmoji}>🗺</Text>
            </View>
            <View style={s.cardBody}>
              <Text style={s.cardHint}>State / Province</Text>
              <Text style={[s.cardValue, !selectedState && s.cardPlaceholder]}>
                {selectedState ? selectedState.state : 'Tap to select'}
              </Text>
            </View>
            <View style={[s.chevron, selectedState && s.chevronActive]}>
              <Text
                style={[s.chevronText, selectedState && s.chevronTextActive]}>
                ›
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── City card ── */}
        <Animated.View
          style={[
            {opacity: card2Anim, transform: [{translateY: card2Y}]},
            s.fieldWrap,
          ]}>
          <View style={s.labelRow}>
            <Text style={s.fieldLabel}>CITY</Text>
            {selectedCity && (
              <View style={s.tickBadge}>
                <Text style={s.tickBadgeText}>✓ Done</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[
              s.card,
              selectedCity && s.cardActive,
              !selectedState && s.cardDisabled,
            ]}
            onPress={() => {
              if (!selectedState) {
                Alert.alert(
                  'Select State First',
                  'Please pick a state before choosing a city.',
                );
                return;
              }
              openPanel('city');
            }}
            activeOpacity={0.8}>
            <View style={[s.strip, selectedCity && s.stripActive]} />
            <View
              style={[s.cardIconWrap, selectedCity && s.cardIconWrapActive]}>
              <Text style={s.cardEmoji}>🏙</Text>
            </View>
            <View style={s.cardBody}>
              <Text style={s.cardHint}>City / District</Text>
              <Text style={[s.cardValue, !selectedCity && s.cardPlaceholder]}>
                {selectedCity
                  ? selectedCity.city
                  : selectedState
                  ? 'Tap to select'
                  : 'Choose state first'}
              </Text>
            </View>
            <View style={[s.chevron, selectedCity && s.chevronActive]}>
              <Text
                style={[s.chevronText, selectedCity && s.chevronTextActive]}>
                ›
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Summary banner ── */}
        {selectedState && selectedCity && (
          <View style={s.summaryBanner}>
            <View style={s.summaryLeft}>
              <Text style={s.summaryPin}>📍</Text>
            </View>
            <View style={s.summaryBody}>
              <Text style={s.summaryLabel}>YOUR LOCATION</Text>
              <Text style={s.summaryValue}>
                {selectedCity.city}, {selectedState.state}
              </Text>
            </View>
            <View style={s.summaryCheck}>
              <Text style={s.summaryCheckText}>✓</Text>
            </View>
          </View>
        )}

        {/* ── Continue button ── */}
        <Animated.View
          style={[
            {opacity: btnAnim, transform: [{translateY: btnY}]},
            s.btnWrap,
          ]}>
          <TouchableOpacity
            style={[s.btn, !canContinue && s.btnDisabled]}
            onPress={handleSave}
            disabled={!canContinue}
            activeOpacity={0.88}>
            {saving ? (
              <ActivityIndicator color={C.white} size="small" />
            ) : (
              <View style={s.btnInner}>
                <Text style={[s.btnText, !canContinue && s.btnTextDisabled]}>
                  Continue
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={s.footnote}>
            You can change this anytime in your profile
          </Text>
        </Animated.View>
      </ScrollView>

      {/* ── Backdrop ── */}
      {activePanel !== null && (
        <Animated.View
          style={[s.backdrop, {opacity: backdropAnim}]}
          pointerEvents="auto">
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={closePanel}
          />
        </Animated.View>
      )}

      {/* ── Slide-up panel ── */}
      <Animated.View
        style={[s.panel, {transform: [{translateY: panelAnim}]}]}
        pointerEvents={activePanel ? 'auto' : 'none'}>
        <View style={s.panelHandle} />

        <View style={s.panelHeader}>
          <View>
            <Text style={s.panelTitle}>{panelTitle}</Text>
            <Text style={s.panelSub}>
              {isLoading ? 'Loading...' : `${filteredList.length} available`}
            </Text>
          </View>
          <TouchableOpacity style={s.panelClose} onPress={closePanel}>
            <Text style={s.panelCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={s.panelDivider} />

        <SearchBar
          value={searchText}
          onChange={setSearchText}
          placeholder={searchPlaceholder}
        />

        {isLoading ? (
          <View style={s.loader}>
            <ActivityIndicator size="large" color={C.accent} />
            <Text style={s.loaderText}>Fetching options...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredList}
            keyExtractor={(item, i) => String(item.id ?? i)}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.listContent}
            renderItem={({item}) => {
              const isSelected =
                activePanel === 'state'
                  ? selectedState?.id === item.id
                  : selectedCity?.id === item.id;
              return (
                <TouchableOpacity
                  style={[s.listItem, isSelected && s.listItemSelected]}
                  onPress={() =>
                    activePanel === 'state'
                      ? handleSelectState(item)
                      : handleSelectCity(item)
                  }
                  activeOpacity={0.7}>
                  <View style={[s.radio, isSelected && s.radioSelected]}>
                    {isSelected && <View style={s.radioDot} />}
                  </View>
                  <Text style={[s.listText, isSelected && s.listTextSelected]}>
                    {item[labelKey]}
                  </Text>
                  {isSelected && (
                    <View style={s.listCheck}>
                      <Text style={s.listCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <Text style={s.emptyIcon}>🔍</Text>
                <Text style={s.emptyTitle}>Nothing found</Text>
                <Text style={s.emptyText}>
                  {searchText
                    ? `No results for "${searchText}"`
                    : 'No options available'}
                </Text>
              </View>
            }
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

// ── Illustration styles ───────────────────────────────────────────────────────
const ill = StyleSheet.create({
  wrap: {
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  ring: {position: 'absolute', borderRadius: 999, borderWidth: 1.5},
  ring1: {width: 86, height: 86, borderColor: 'rgba(138,56,245,0.22)'},
  ring2: {width: 116, height: 116, borderColor: 'rgba(138,56,245,0.11)'},
  ring3: {width: 150, height: 150, borderColor: 'rgba(138,56,245,0.05)'},
  hexBg: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(138,56,245,0.1)',
    transform: [{rotate: '15deg'}],
  },
  pinOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.accent,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 12,
    zIndex: 3,
  },
  pinInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinHole: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.white,
  },
  pinTail: {
    position: 'absolute',
    bottom: 20,
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: C.accent,
    zIndex: 2,
  },
  pinShadow: {
    position: 'absolute',
    bottom: 14,
    width: 26,
    height: 7,
    borderRadius: 13,
    backgroundColor: 'rgba(138,56,245,0.2)',
    zIndex: 1,
  },
  spark: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: C.accentMid,
  },
  starH: {
    position: 'absolute',
    width: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: C.accentMid,
    opacity: 0.7,
  },
  starV: {
    position: 'absolute',
    width: 2,
    height: 12,
    borderRadius: 1,
    backgroundColor: C.accentMid,
    opacity: 0.7,
  },
});

// ── Search bar styles ─────────────────────────────────────────────────────────
const ps = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceAlt,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  icon: {fontSize: 14, marginRight: 10},
  input: {flex: 1, fontSize: 14, color: C.ink, padding: 0},
  clearBtn: {padding: 4},
  clearText: {fontSize: 12, color: C.inkFaint},
});

// ── Main styles ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: {flex: 1, backgroundColor: C.bg},

  blob1: {
    position: 'absolute',
    top: -60,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(138,56,245,0.07)',
  },
  blob2: {
    position: 'absolute',
    top: 180,
    left: -90,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(138,56,245,0.05)',
  },
  blob3: {
    position: 'absolute',
    bottom: 60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(138,56,245,0.04)',
  },

  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 22, paddingTop: 18, paddingBottom: 48},

  // Top pill
  pillWrap: {alignItems: 'flex-start', marginBottom: 18},
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.accentLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 7,
  },
  pillDot: {width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent},
  pillText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.accent,
    letterSpacing: 2,
  },

  heroWrap: {marginBottom: 22, alignItems: 'center'},

  // Headline
  headWrap: {marginBottom: 28},
  headline: {
    fontSize: 32,
    fontWeight: '800',
    color: C.ink,

    letterSpacing: -0.6,
    marginBottom: 10,
  },
  sub: {fontSize: 14, color: C.inkMid},

  // Field
  fieldWrap: {marginBottom: 16},
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: C.inkFaint,
    letterSpacing: 2.2,
  },
  tickBadge: {
    backgroundColor: C.accentLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tickBadgeText: {fontSize: 10, fontWeight: '700', color: C.accent},

  // Selector card
  card: {
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: 'rgba(138,56,245,0.12)',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardActive: {
    borderColor: C.accent,
    shadowColor: C.accentGlow,
    shadowOpacity: 1,
    shadowRadius: 14,
  },
  cardDisabled: {opacity: 0.42},

  strip: {
    width: 5,
    alignSelf: 'stretch',
    backgroundColor: C.border,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  stripActive: {backgroundColor: C.accent},

  cardIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 14,
    marginRight: 12,
  },
  cardIconWrapActive: {backgroundColor: C.accentLight},
  cardEmoji: {fontSize: 20},
  cardBody: {flex: 1, paddingVertical: 16},
  cardHint: {
    fontSize: 10,
    fontWeight: '700',
    color: C.inkFaint,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  cardValue: {fontSize: 15, fontWeight: '700', color: C.ink},
  cardPlaceholder: {color: C.inkFaint, fontWeight: '400'},

  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  chevronActive: {backgroundColor: C.accentLight},
  chevronText: {fontSize: 22, color: C.inkFaint, marginTop: -2},
  chevronTextActive: {color: C.accent},

  // Summary banner
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.accentLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(138,56,245,0.2)',
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  summaryLeft: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryPin: {fontSize: 18},
  summaryBody: {flex: 1},
  summaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: C.accentMid,
    letterSpacing: 1.8,
    marginBottom: 3,
  },
  summaryValue: {fontSize: 14, fontWeight: '700', color: C.accentDark},
  summaryCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCheckText: {fontSize: 12, color: C.white, fontWeight: '800'},

  // Button
  btnWrap: {marginTop: 20},
  btn: {
    backgroundColor: C.accent,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: C.accent,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.38,
    shadowRadius: 18,
    elevation: 8,
  },
  btnDisabled: {backgroundColor: C.surfaceAlt, shadowOpacity: 0, elevation: 0},
  btnInner: {flexDirection: 'row', alignItems: 'center', gap: 12},
  btnText: {
    fontSize: 16,
    fontWeight: '800',
    color: C.white,
    letterSpacing: 0.3,
  },
  btnTextDisabled: {color: C.inkFaint},
  btnArrowBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnArrowBoxDisabled: {backgroundColor: C.border},
  btnArrow: {fontSize: 16, color: C.white, fontWeight: '800'},
  footnote: {
    textAlign: 'center',
    fontSize: 12,
    color: C.inkFaint,
    marginTop: 14,
  },

  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,5,51,0.5)',
    zIndex: 10,
  },

  // Slide panel
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    zIndex: 20,
    paddingTop: 12,
    shadowColor: C.accent,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  panelHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.ink,
    letterSpacing: -0.3,
  },
  panelSub: {fontSize: 12, color: C.inkFaint, marginTop: 3, fontWeight: '500'},
  panelDivider: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: 20,
    marginBottom: 14,
  },
  panelClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelCloseText: {fontSize: 13, color: C.inkMid, fontWeight: '700'},

  loader: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14},
  loaderText: {fontSize: 14, color: C.inkFaint},

  listContent: {paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24},
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 4,
  },
  listItemSelected: {
    backgroundColor: C.accentLight,
    borderWidth: 1,
    borderColor: 'rgba(138,56,245,0.2)',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  radioSelected: {borderColor: C.accent},
  radioDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: C.accent},
  listText: {fontSize: 15, color: C.inkMid, flex: 1, fontWeight: '500'},
  listTextSelected: {color: C.ink, fontWeight: '700'},
  listCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listCheckText: {fontSize: 11, color: C.white, fontWeight: '800'},

  emptyWrap: {alignItems: 'center', paddingVertical: 44, gap: 8},
  emptyIcon: {fontSize: 32, marginBottom: 4},
  emptyTitle: {fontSize: 15, fontWeight: '700', color: C.ink},
  emptyText: {fontSize: 13, color: C.inkFaint, textAlign: 'center'},
});
