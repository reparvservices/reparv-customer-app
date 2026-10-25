import React, {useState, useRef, useEffect} from 'react';
import {API_BASE_URL} from '../../config/api';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  Animated,
  StatusBar,
  Modal,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
  Rect,
} from 'react-native-svg';
import {
  Key,
  Zap,
  Shield,
  Calendar,
  UserX,
  Bell,
  ArrowLeft,
  Network,
  Sparkles,
  CheckCircle2,
} from 'lucide-react-native';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

const {width: SW, height: SH} = Dimensions.get('window');

/* ─── Brand colors ─── */
const PURPLE = '#5E23DC';
const PURPLE_LIGHT = '#EEE8FD';
const PURPLE_MID = '#7C4AF5';

/* ─── API ─── */
const NOTIFY_URL = `${API_BASE_URL}/customerapp/user/notify/`;

/* ─── Features ─── */
const FEATURES = [
  {Icon: Key, label: 'Remote\nAccess', bg: '#EDE8FF'},
  {Icon: Zap, label: 'Energy\nTracking', bg: '#FFF4E0'},
  {Icon: Shield, label: 'Smart\nSecurity', bg: '#E6F7EE'},
  {Icon: Calendar, label: '24/7\nVisits', bg: '#E8F1FF'},
  {Icon: UserX, label: 'No\nBrokers', bg: '#FFE8EC'},
];

const STATS = [
  {value: '500+', label: 'Smart Homes'},
  {value: '2026', label: 'Launch Year'},
  {value: '10+', label: 'Cities'},
];

/* ─── Helpers ─── */
const isValidEmail = email =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase().trim());

/* ════════════════════════════════════════════
   GRADIENT "COMING SOON" TEXT
════════════════════════════════════════════ */
const GradientComingSoon = () => {
  const w = SW - 48;
  const cx = w / 2;
  return (
    <Svg width={w} height={110} style={{marginBottom: 4}}>
      <Defs>
        <LinearGradient id="csG" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#321376" stopOpacity="1" />
          <Stop offset="0.5" stopColor={PURPLE} stopOpacity="1" />
          <Stop offset="1" stopColor="#9B59F5" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <SvgText
        x={cx}
        y={48}
        textAnchor="middle"
        fontSize={56}
        fontWeight="900"
        letterSpacing={-2}
        fill="url(#csG)">
        COMING
      </SvgText>
      <SvgText
        x={cx}
        y={104}
        textAnchor="middle"
        fontSize={56}
        fontWeight="900"
        letterSpacing={-2}
        fill="url(#csG)">
        SOON
      </SvgText>
    </Svg>
  );
};

/* ════════════════════════════════════════════
   SUCCESS MODAL
════════════════════════════════════════════ */
const SuccessModal = ({visible, onClose}) => {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 14,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(0.7);
      opacity.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={ss.overlay}>
        <Animated.View style={[ss.card, {opacity, transform: [{scale}]}]}>
          {/* Icon area */}
          <View style={ss.iconWrap}>
            <View style={ss.iconOuter}>
              <View style={ss.iconInner}>
                <CheckCircle2 size={34} color={PURPLE} strokeWidth={2} />
              </View>
            </View>
            {/* Sparkle dots */}
            {[0, 1, 2, 3, 4, 5].map(i => (
              <View
                key={i}
                style={[
                  ss.sparkle,
                  {
                    top: 22 + 36 * Math.sin((i * Math.PI * 2) / 6),
                    left: 22 + 36 * Math.cos((i * Math.PI * 2) / 6),
                    width: i % 2 === 0 ? 6 : 4,
                    height: i % 2 === 0 ? 6 : 4,
                    borderRadius: i % 2 === 0 ? 3 : 2,
                    backgroundColor:
                      i % 3 === 0
                        ? PURPLE
                        : i % 3 === 1
                        ? '#9B59F5'
                        : '#00D8D8',
                  },
                ]}
              />
            ))}
          </View>

          <Text style={ss.title}>You're on the list!</Text>
          <Text style={ss.msg}>
            We'll notify you as soon as Smart Living launches.{'\n'}Stay tuned
            for something extraordinary!
          </Text>

          <View style={ss.divider} />

          <TouchableOpacity
            style={ss.btn}
            onPress={onClose}
            activeOpacity={0.85}>
            <Text style={ss.btnText}>Awesome, thanks!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const ss = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 16},
    shadowOpacity: 0.18,
    shadowRadius: 30,
  },
  iconWrap: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  iconOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: PURPLE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DDD5FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  msg: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 21,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 20,
  },
  btn: {
    width: '100%',
    height: 54,
    borderRadius: 999,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PURPLE,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

/* ════════════════════════════════════════════
   FEATURE PILL CARD
════════════════════════════════════════════ */
const FeatureCard = ({Icon, label, bg, delay}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay,
      useNativeDriver: true,
      damping: 14,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        f.card,
        {
          opacity: anim,
          transform: [
            {scale: anim},
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}>
      <View style={[f.iconWrap, {backgroundColor: bg}]}>
        <Icon size={22} color={PURPLE} strokeWidth={1.8} />
      </View>
      <Text style={f.label}>{label}</Text>
    </Animated.View>
  );
};

const f = StyleSheet.create({
  card: {
    width: (SW - 48 - 48) / 5,
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
    lineHeight: 14,
  },
});

/* ════════════════════════════════════════════
   STAT PILL
════════════════════════════════════════════ */
const StatPill = ({value, label}) => (
  <View style={st.pill}>
    <Text style={st.value}>{value}</Text>
    <Text style={st.label}>{label}</Text>
  </View>
);

const st = StyleSheet.create({
  pill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: PURPLE,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: '#888',
    marginTop: 2,
  },
});

/* ════════════════════════════════════════════
   COMING SOON SCREEN
════════════════════════════════════════════ */
const ComingSoonScreen = () => {
  const navigation = useNavigation();
  const {user} = useSelector(state => state?.auth);
  const scrollY = useRef(new Animated.Value(0)).current;

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  /* header fade */
  const headerOpacity = scrollY.interpolate({
    inputRange: [160, 220],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  /* image parallax */
  const imageTranslate = scrollY.interpolate({
    inputRange: [-100, 0, 200],
    outputRange: [-40, 0, 80],
    extrapolate: 'clamp',
  });

  const onEmailChange = text => {
    setEmail(text);
    if (text.length > 0 && !isValidEmail(text))
      setEmailError('Enter a valid email address');
    else setEmailError('');
  };

  const handleNotify = async () => {
    if (!email.trim()) {
      setEmailError('Email address is required');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(NOTIFY_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          contact: user?.fullname?.trim(),
          mobile: user?.contact?.trim(),
          email: email.trim().toLowerCase(),
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessVisible(true);
      } else {
        Alert.alert(
          'Oops!',
          data.message || 'Something went wrong. Please try again.',
        );
      }
    } catch (e) {
      Alert.alert(
        'Connection Error',
        'Unable to reach the server. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={p.root}>
      {/* <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      /> */}

      {/* ── Sticky header (appears on scroll) ── */}
      <Animated.View style={[p.stickyHeader, {opacity: headerOpacity}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={p.stickyBack}>
          <ArrowLeft size={20} color="#111" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={p.stickyTitle}>Smart Living</Text>
        <View style={{width: 40}} />
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {useNativeDriver: true},
        )}
        scrollEventThrottle={16}>
        {/* ══ HERO IMAGE ══ */}
        <View style={p.heroWrap}>
          <Animated.Image
            source={require('../../assets/image/home/commingbuilding.png')}
            style={[p.heroImg]}
            resizeMode="stretch"
          />
          {/* Dark gradient overlay */}
          <View style={p.heroGradient} />

          {/* Back button (absolute, only visible before sticky header) */}
          <TouchableOpacity
            style={p.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}>
            <ArrowLeft size={20} color="#111" strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Badge */}
          <View style={p.badge}>
            <Network size={12} color={PURPLE} strokeWidth={2} />
            <Text style={p.badgeText}>CONNECTED ATRIUM</Text>
          </View>

          {/* Hero tag line */}
          <View style={p.heroTag}>
            <Sparkles size={14} color="#FFD700" strokeWidth={2} />
            <Text style={p.heroTagText}>
              India's First Smart Rental Ecosystem
            </Text>
          </View>
        </View>

        {/* ══ CONTENT CARD ══ */}
        <View style={p.contentCard}>
          {/* COMING SOON headline */}
          <View style={p.headlineWrap}>
            <GradientComingSoon />
          </View>

          {/* Subtitle */}
          <Text style={p.subtitle}>
            The future of luxury living is almost here.{'\n'}Get notified when
            we launch.
          </Text>

          {/* ─ Stats row ─ */}
          <View style={p.statsRow}>
            {STATS.map(s => (
              <StatPill key={s.label} {...s} />
            ))}
          </View>

          {/* ─ Section label ─ */}
          <View style={p.sectionLabelRow}>
            <View style={p.sectionLine} />
            <Text style={p.sectionLabel}>SMART FEATURES</Text>
            <View style={p.sectionLine} />
          </View>

          {/* ─ Feature cards ─ */}
          <View style={p.featuresRow}>
            {FEATURES.map(({Icon, label, bg}, i) => (
              <FeatureCard
                key={label}
                Icon={Icon}
                label={label}
                bg={bg}
                delay={i * 70}
              />
            ))}
          </View>

          {/* ─ Divider ─ */}
          <View style={p.divider} />

          {/* ─ Notify section ─ */}
          <View style={p.notifySection}>
            <View style={p.notifyHeader}>
              <Bell size={18} color={PURPLE} strokeWidth={2} />
              <Text style={p.notifyTitle}>Get Early Access</Text>
            </View>
            <Text style={p.notifyDesc}>
              Be the first to know when Smart Living launches in your city.
            </Text>

            <TextInput
              style={[p.input, emailError ? p.inputError : null]}
              placeholder="Enter your email address *"
              placeholderTextColor="#BBBBBB"
              value={email}
              onChangeText={onEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {!!emailError && <Text style={p.errorText}>{emailError}</Text>}

            <TouchableOpacity
              style={[p.notifyBtn, loading && p.notifyBtnDisabled]}
              onPress={handleNotify}
              disabled={loading}
              activeOpacity={0.87}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={p.notifyBtnText}>Notify Me</Text>
                  <Bell
                    size={18}
                    color="#fff"
                    strokeWidth={2}
                    style={{marginLeft: 10}}
                  />
                </>
              )}
            </TouchableOpacity>

            <Text style={p.disclaimer}>No spam ever. Unsubscribe anytime.</Text>
          </View>

          <View style={{height: Platform.OS === 'ios' ? 44 : 30}} />
        </View>
      </Animated.ScrollView>

      <SuccessModal
        visible={successVisible}
        onClose={() => {
          setSuccessVisible(false);
          setEmail('');
          setEmailError('');
        }}
      />
    </SafeAreaView>
  );
};

/* ════════════════════════════════════════════
   SCREEN STYLES
════════════════════════════════════════════ */
const p = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F6F5FB',
  },

  /* ── Sticky header ── */
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  stickyBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.3,
  },

  /* ── Hero ── */
  heroWrap: {
    height: SH * 0.42,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImg: {
    width: '100%',
    height: SH * 0.5,
    position: 'absolute',
    top: 0,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,5,25,0.38)',
  },
  backBtn: {
    position: 'absolute',
    // top: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 14) + 12,
    top: 10,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    zIndex: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.8,
  },
  heroTag: {
    position: 'absolute',
    bottom: 42,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.1,
  },

  /* ── Content card ── */
  contentCard: {
    backgroundColor: '#F6F5FB',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingTop: 28,
    paddingHorizontal: 24,
  },

  headlineWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14.5,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '400',
  },

  /* ── Stats ── */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },

  /* ── Section label ── */
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0DCF5',
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PURPLE,
    letterSpacing: 1.2,
  },

  /* ── Features ── */
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },

  /* ── Divider ── */
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E4E0F5',
    marginBottom: 24,
  },

  /* ── Notify section ── */
  notifySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: PURPLE,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  notifyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  notifyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.3,
  },
  notifyDesc: {
    fontSize: 13,
    color: '#777',
    lineHeight: 19,
    marginBottom: 18,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: '#F4F4F8',
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 14,
    color: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginBottom: 4,
  },
  inputError: {
    borderColor: '#E5384F',
    backgroundColor: '#FFF5F6',
  },
  errorText: {
    alignSelf: 'flex-start',
    marginLeft: 6,
    marginBottom: 4,
    fontSize: 11.5,
    color: '#E5384F',
    fontWeight: '500',
  },
  notifyBtn: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    backgroundColor: PURPLE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: PURPLE,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.38,
    shadowRadius: 18,
  },
  notifyBtnDisabled: {opacity: 0.68},
  notifyBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  disclaimer: {
    fontSize: 11.5,
    color: '#AAA',
    textAlign: 'center',
    marginTop: 14,
    fontWeight: '400',
  },
});

export default ComingSoonScreen;
