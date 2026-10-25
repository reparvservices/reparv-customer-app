import React, {useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  Animated,
  StatusBar,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

const BRAND = '#5E23DC';
const BRAND_LIGHT = '#F0EBFF';

const SOCIALS = [
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@reparv.inn_',
    desc: 'Property reels & daily updates',
    url: 'https://www.instagram.com/reparv.inn_/',
    gradient: ['#F58529', '#DD2A7B', '#8134AF'],
    logo: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png',
    category: 'Visual',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    handle: 'Reparv Official',
    desc: 'Property tours & investment tips',
    url: 'https://www.youtube.com/@reparv',
    gradient: ['#FF4444', '#CC0000'],
    logo: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png',
    category: 'Video',
  },
  //   {
  //     id: 'whatsapp',
  //     name: 'WhatsApp Channel',
  //     handle: 'Reparv Official',
  //     desc: 'Exclusive deals & property alerts',
  //     url: 'https://whatsapp.com/channel/reparv',
  //     gradient: ['#25D366', '#128C7E'],
  //     logo: 'https://cdn-icons-png.flaticon.com/512/733/733585.png',
  //     category: 'Messaging',
  //   },
  {
    id: 'facebook',
    name: 'Facebook',
    handle: 'Reparv',
    desc: 'Community discussions & listings',
    url: 'https://www.facebook.com/reparv/',
    gradient: ['#1877F2', '#0C5ECB'],
    logo: 'https://cdn-icons-png.flaticon.com/512/733/733547.png',
    category: 'Community',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    handle: '@reparvapp',
    desc: 'Real-time market updates',
    url: 'https://x.com/reparvnews?s=11',
    gradient: ['#1A1A1A', '#444'],
    logo: 'https://cdn-icons-png.flaticon.com/512/5969/5969020.png',
    category: 'News',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    handle: 'Reparv Technologies',
    desc: 'Company news & careers',
    url: 'https://www.linkedin.com/company/105339179',
    gradient: ['#0077B5', '#005E91'],
    logo: 'https://cdn-icons-png.flaticon.com/512/733/733561.png',
    category: 'Professional',
  },

  {
    id: 'threads',
    name: 'Threads',
    handle: '@reparv.inn_',
    desc: 'Behind the scenes & tips',
    url: 'https://www.threads.com/@reparv.inn_?igshid=NTc4MTIwNjQ2YQ==',
    gradient: ['#1A1A1A', '#333'],
    logo: 'https://cdn-icons-png.flaticon.com/512/12407/12407822.png',
    category: 'Social',
  },
];

/* ─── Social Card ──────────────────────────────────────────────────────── */
const SocialCard = ({item, index}) => {
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay: 300 + index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay: 300 + index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.975,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();

  const onPressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();

  return (
    <Animated.View
      style={{opacity, transform: [{translateY}, {scale: scaleAnim}]}}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => Linking.openURL(item.url).catch(() => {})}
        onPressIn={onPressIn}
        onPressOut={onPressOut}>
        <View style={styles.card}>
          {/* Platform logo — full image, no background */}
          <Image
            source={{uri: item.logo}}
            style={styles.iconWrap}
            resizeMode="contain"
          />

          {/* Info */}
          <View style={styles.cardBody}>
            <View style={styles.cardTopRow}>
              <Text style={styles.cardName}>{item.name}</Text>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{item.category}</Text>
              </View>
            </View>
            <Text style={styles.cardHandle}>{item.handle}</Text>
            <Text style={styles.cardDesc} numberOfLines={1}>
              {item.desc}
            </Text>
          </View>

          {/* Follow button */}
          <LinearGradient
            colors={[BRAND, '#7B4DFF']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.followPill}>
            <Text style={styles.followPillText}>Follow</Text>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ─── Main Screen ──────────────────────────────────────────────────────── */
export default function FollowUsScreen() {
  const navigation = useNavigation();
  const heroAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <ArrowLeft size={20} color="#1A1A2E" strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Follow Us</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* ── Hero banner ── */}
        <Animated.View
          style={[
            styles.heroBanner,
            {
              opacity: heroAnim,
              transform: [
                {
                  translateY: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, 0],
                  }),
                },
              ],
            },
          ]}>
          <LinearGradient
            colors={['#5E23DC', '#8B5CF6', '#A78BFA']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.heroBg}>
            <View style={styles.deco1} />
            <View style={styles.deco2} />
            <View style={styles.deco3} />
            <View style={styles.heroContent}>
              <View style={styles.heroLogoRow}>
                <View style={styles.heroLogo}>
                  <Text style={styles.heroLogoText}>R</Text>
                </View>
                <View>
                  <Text style={styles.heroAppName}>Reparv</Text>
                  <Text style={styles.heroTagline}>
                    Maharashtra's #1 Property App
                  </Text>
                </View>
              </View>
              <Text style={styles.heroHeading}>Stay Connected</Text>
              <Text style={styles.heroSub}>
                Follow us across platforms for exclusive deals,{'\n'}market
                insights & real estate tips.
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Section heading ── */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionTitle}>All Platforms</Text>
        </View>

        {/* ── Cards ── */}
        <View style={styles.cardsList}>
          {SOCIALS.map((item, index) => (
            <SocialCard key={item.id} item={item} index={index} />
          ))}
        </View>

        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteText}>
            Tap any card to open on your device
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F7F7FB'},

  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0F0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: 0.2,
  },

  scrollContent: {paddingBottom: 50},

  heroBanner: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: BRAND,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.22,
    shadowRadius: 20,
  },
  heroBg: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 22,
    overflow: 'hidden',
  },
  deco1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  deco2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -20,
    left: 20,
  },
  deco3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: 30,
    right: 80,
  },
  heroContent: {zIndex: 1},
  heroLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  heroLogo: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroLogoText: {fontSize: 22, fontWeight: '900', color: '#fff'},
  heroAppName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  heroTagline: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    marginTop: 1,
  },
  heroHeading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSub: {fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 20},

  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#ECECF3',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  statItem: {flex: 1, alignItems: 'center'},
  statNum: {fontSize: 22, fontWeight: '800', color: BRAND, letterSpacing: -0.5},
  statLbl: {fontSize: 11, color: '#888', marginTop: 3, fontWeight: '500'},
  statDivider: {width: 1, height: 32, backgroundColor: '#ECECF3'},

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 14,
  },
  sectionAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: BRAND,
  },
  sectionTitle: {fontSize: 16, fontWeight: '800', color: '#1A1A2E'},

  cardsList: {paddingHorizontal: 16, gap: 10},

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECECF3',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.04,
    shadowRadius: 8,
    gap: 12,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 15,
    flexShrink: 0,
    backgroundColor: 'transparent',
  },
  cardBody: {flex: 1, gap: 3},
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  cardName: {fontSize: 14, fontWeight: '700', color: '#1A1A2E'},
  categoryTag: {
    backgroundColor: BRAND_LIGHT,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  categoryTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: BRAND,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  cardHandle: {fontSize: 12, color: '#888', fontWeight: '500'},
  cardDesc: {fontSize: 11, color: '#AAAABC'},

  followPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    flexShrink: 0,
  },
  followPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },

  bottomNote: {
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 10,
  },
  bottomNoteText: {fontSize: 12, color: '#CCCCCC', fontWeight: '500'},
});
