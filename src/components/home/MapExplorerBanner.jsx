import React, {useEffect, useRef, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  MapPin,
  Navigation,
  ArrowRight,
  TrendingUp,
  Building2,
} from 'lucide-react-native';

import {useResponsiveMetrics} from '../../utils/responsive';
// ─────────────────────────────────────────────────────────────
// Ripple ring
// ─────────────────────────────────────────────────────────────
const RippleRing = ({delay = 0, size = 38, color = 'rgba(97,54,216,0.35)'}) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {toValue: 0, duration: 0, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: color,
        opacity: anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.9, 0.3, 0],
        }),
        transform: [
          {
            scale: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 2.4],
            }),
          },
        ],
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────────
// Price pin with bounce + ripples
// ─────────────────────────────────────────────────────────────
const PricePin = ({
  price,
  top,
  left,
  accent = '#6136D8',
  rippleColor = 'rgba(97,54,216,0.3)',
  delay = 0,
}) => {
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(bounce, {
          toValue: -5,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top,
        left,
        alignItems: 'center',
        zIndex: 20,
        transform: [{translateY: bounce}],
      }}>
      <View
        style={[pin.bubble, {backgroundColor: accent, shadowColor: accent}]}>
        <Text style={pin.price}>{price}</Text>
      </View>
      <View style={pin.dotWrap}>
        <RippleRing delay={0} size={34} color={rippleColor} />
        <RippleRing delay={600} size={34} color={rippleColor} />
        <View style={[pin.dot, {backgroundColor: accent}]} />
      </View>
    </Animated.View>
  );
};

const pin = StyleSheet.create({
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginBottom: 3,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 6,
  },
  price: {color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.2},
  dotWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});

// ─────────────────────────────────────────────────────────────
// "You are here" pulsing dot
// ─────────────────────────────────────────────────────────────
const YouDot = ({top, left}) => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.9,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  return (
    <View
      style={{
        position: 'absolute',
        top,
        left,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 25,
      }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: 'rgba(97,54,216,0.18)',
          transform: [{scale: pulse}],
        }}
      />
      <View
        style={{
          width: 13,
          height: 13,
          borderRadius: 7,
          backgroundColor: '#6136D8',
          borderWidth: 2.5,
          borderColor: '#fff',
          shadowColor: '#6136D8',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.4,
          shadowRadius: 4,
          elevation: 5,
        }}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// Light-mode map graphic — pure RN views, no image
// ─────────────────────────────────────────────────────────────
const MapGraphic = () => (
  <View style={map.root}>
    <View style={map.surface} />

    {/* Grid lines */}
    {[20, 44, 68, 92, 116, 140].map(t => (
      <View key={`h${t}`} style={[map.gridH, {top: t}]} />
    ))}
    {[24, 54, 84, 114, 144].map(l => (
      <View key={`v${l}`} style={[map.gridV, {left: l}]} />
    ))}

    {/* Diagonal road strokes */}
    <View
      style={[
        map.road,
        {top: 32, left: 8, width: 130, transform: [{rotate: '16deg'}]},
      ]}
    />
    <View
      style={[
        map.road,
        {top: 74, left: 18, width: 110, transform: [{rotate: '-10deg'}]},
      ]}
    />
    <View
      style={[
        map.road,
        {top: 108, left: 4, width: 150, transform: [{rotate: '7deg'}]},
      ]}
    />

    {/* Main arteries (white roads) */}
    <View style={[map.mainRoad, {top: 57, left: 0, width: 172, height: 5}]} />
    <View style={[map.mainRoad, {top: 0, left: 72, width: 5, height: 160}]} />

    {/* Building blocks */}
    <View style={[map.block, {top: 22, left: 26, width: 34, height: 22}]} />
    <View style={[map.block, {top: 22, left: 80, width: 46, height: 26}]} />
    <View style={[map.block, {top: 82, left: 12, width: 42, height: 20}]} />
    <View style={[map.block, {top: 90, left: 82, width: 38, height: 22}]} />
    <View
      style={[map.blockGreen, {top: 116, left: 28, width: 58, height: 28}]}
    />
    <View style={[map.block, {top: 116, left: 108, width: 30, height: 18}]} />

    {/* Property pins */}
    <PricePin
      price="₹45L"
      top={6}
      left={12}
      accent="#6136D8"
      rippleColor="rgba(97,54,216,0.3)"
      delay={0}
    />
    <PricePin
      price="₹1.2Cr"
      top={50}
      left={82}
      accent="#F59E0B"
      rippleColor="rgba(245,158,11,0.3)"
      delay={400}
    />
    <PricePin
      price="₹72L"
      top={90}
      left={30}
      accent="#10B981"
      rippleColor="rgba(16,185,129,0.3)"
      delay={800}
    />

    {/* You are here */}
    <YouDot top={62} left={54} />

    {/* Compass */}
    <View style={map.compass}>
      <Navigation size={11} color="#6136D8" fill="#6136D8" />
    </View>

    {/* Edge fades blend into card bg (#F7F5FF) */}
    <LinearGradient
      colors={['transparent', 'rgba(247,245,255,0.8)', '#F7F5FF']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 0}}
      style={map.fadeRight}
      pointerEvents="none"
    />
    <LinearGradient
      colors={['rgba(247,245,255,0.65)', 'transparent']}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={map.fadeTop}
      pointerEvents="none"
    />
  </View>
);

const map = StyleSheet.create({
  root: {
    position: 'absolute',
    right: -6,
    top: 0,
    bottom: 0,
    width: 176,
    overflow: 'hidden',
  },
  surface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EDF1FA',
  },
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(160,170,210,0.22)',
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(160,170,210,0.22)',
  },
  road: {
    position: 'absolute',
    height: 2.5,
    backgroundColor: 'rgba(180,185,220,0.4)',
    borderRadius: 2,
  },
  mainRoad: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 2,
  },
  block: {
    position: 'absolute',
    borderRadius: 4,
    backgroundColor: 'rgba(140,150,200,0.2)',
  },
  blockGreen: {
    position: 'absolute',
    borderRadius: 4,
    backgroundColor: 'rgba(110,210,150,0.26)',
  },
  compass: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(97,54,216,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  fadeRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 50,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
  },
});

// ─────────────────────────────────────────────────────────────
// Main Banner
// ─────────────────────────────────────────────────────────────
export default function MapExplorerBanner({navigation}) {
  const {width, ms, font} = useResponsiveMetrics();
  const shimmer = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const dotPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, {
          toValue: 1.5,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(dotPulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(btnScale, {
      toValue: 0.96,
      friction: 3,
      useNativeDriver: true,
    }).start();
  const onPressOut = () =>
    Animated.spring(btnScale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();

  const b = useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginHorizontal: ms(16, 0.25),
          marginVertical: ms(12, 0.2),
          borderRadius: ms(32, 0.2),
          alignSelf: 'stretch',
          paddingTop: ms(20, 0.2),
          paddingHorizontal: ms(20, 0.2),
          paddingBottom: ms(26, 0.22),
          gap: ms(14, 0.15),
          overflow: 'hidden',
          backgroundColor: '#F7F5FF',
          shadowColor: '#6136D8',
          shadowOffset: {width: 0, height: ms(8, 0.15)},
          shadowOpacity: 0.12,
          shadowRadius: ms(16, 0.15),
          elevation: 10,
        },

        topRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          height: ms(26, 0.12),
          zIndex: 5,
        },
        liveTag: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: ms(6, 0.1),
          backgroundColor: 'rgba(97,54,216,0.07)',
          borderWidth: 1,
          borderColor: 'rgba(97,54,216,0.18)',
          borderRadius: 999,
          paddingHorizontal: ms(10, 0.12),
          paddingVertical: ms(4, 0.08),
          alignSelf: 'flex-start',
        },
        liveDot: {
          width: ms(7, 0.1),
          height: ms(7, 0.1),
          borderRadius: ms(4, 0.1),
          backgroundColor: '#6136D8',
          shadowColor: '#6136D8',
          shadowOffset: {width: 0, height: 0},
          shadowOpacity: 0.6,
          shadowRadius: 5,
          elevation: 4,
        },
        liveTagTxt: {
          color: '#6136D8',
          fontSize: font(11, 0.35),
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          lineHeight: font(16, 0.3),
        },

        headingBlock: {
          paddingTop: ms(4, 0.1),
          gap: ms(6, 0.1),
          alignSelf: 'stretch',
          width: '100%',
          zIndex: 5,
        },
        heading: {
          color: '#1A0A3E',
          fontSize: font(22, 0.28),
          fontWeight: '800',
          lineHeight: font(29, 0.25),
          letterSpacing: -0.3,
        },
        sub: {
          color: '#6B7280',
          fontSize: font(13, 0.28),
          fontWeight: '400',
          lineHeight: font(19, 0.28),
        },

        statsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: ms(12, 0.15),
          paddingTop: ms(4, 0.12),
          zIndex: 5,
        },
        stat: {flexDirection: 'row', alignItems: 'center', gap: ms(8, 0.12)},
        statIconWrap: {
          width: ms(32, 0.18),
          height: ms(32, 0.18),
          borderRadius: ms(16, 0.18),
          backgroundColor: 'rgba(97,54,216,0.09)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        statNum: {
          color: '#1A0A3E',
          fontSize: font(14, 0.28),
          fontWeight: '800',
          lineHeight: font(16, 0.25),
        },
        statLbl: {
          color: '#9CA3AF',
          fontSize: font(10, 0.35),
          fontWeight: '400',
          lineHeight: font(14, 0.3),
          marginTop: 1,
        },
        statDivider: {
          width: 1,
          height: ms(32, 0.18),
          backgroundColor: 'rgba(97,54,216,0.12)',
        },

        btnRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: ms(4, 0.12),
          zIndex: 6,
        },
        viewBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: ms(8, 0.12),
          backgroundColor: '#6136D8',
          borderRadius: 999,
          paddingVertical: ms(10, 0.15),
          paddingLeft: ms(18, 0.15),
          paddingRight: ms(10, 0.12),
          overflow: 'hidden',
          shadowColor: '#6136D8',
          shadowOffset: {width: 0, height: ms(6, 0.12)},
          shadowOpacity: 0.35,
          shadowRadius: ms(10, 0.12),
          elevation: 6,
        },
        btnShimmer: {
          position: 'absolute',
          left: -ms(60, 0.15),
          top: 0,
          bottom: 0,
          width: ms(60, 0.15),
          backgroundColor: 'rgba(255,255,255,0.2)',
        },
        viewBtnTxt: {
          color: '#FFFFFF',
          fontSize: font(14, 0.28),
          fontWeight: '700',
          lineHeight: font(20, 0.28),
        },
        arrowCircle: {
          width: ms(22, 0.15),
          height: ms(22, 0.15),
          borderRadius: ms(11, 0.15),
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [width, ms, font],
  );

  return (
    <View style={b.card}>
      {/* Map fills right half */}
      <MapGraphic />

      {/* ── Live tag ── */}
      <View style={b.topRow}>
        <View style={b.liveTag}>
          <Animated.View
            style={[b.liveDot, {transform: [{scale: dotPulse}]}]}
          />
          <Text style={b.liveTagTxt}>LIVE MAP</Text>
        </View>
      </View>

      {/* ── Heading ── */}
      <View style={b.headingBlock}>
        <Text style={b.heading}>
          See Every{'\n'}Property,{'\n'}On the Map.
        </Text>
        <Text style={b.sub}>
          Browse pins, check prices &{'\n'}explore areas near you
        </Text>
      </View>

      {/* ── Stats ── */}
      <View style={b.statsRow}>
        <View style={b.stat}>
          <View style={b.statIconWrap}>
            <TrendingUp size={14} color="#6136D8" strokeWidth={2} />
          </View>
          <View>
            <Text style={b.statNum}>500+</Text>
            <Text style={b.statLbl}>Active Pins</Text>
          </View>
        </View>

        <View style={b.statDivider} />

        <View style={b.stat}>
          <View style={b.statIconWrap}>
            <Building2 size={14} color="#6136D8" strokeWidth={2} />
          </View>
          <View>
            <Text style={b.statNum}>20+</Text>
            <Text style={b.statLbl}>Cities Live</Text>
          </View>
        </View>
      </View>

      {/* ── CTA ── */}
      <View style={b.btnRow}>
        <Animated.View style={{transform: [{scale: btnScale}]}}>
          <TouchableOpacity
            style={b.viewBtn}
            activeOpacity={1}
            onPress={() => navigation?.navigate('CityPropertyMapScreen')}
            onPressIn={onPressIn}
            onPressOut={onPressOut}>
            <Animated.View
              style={[
                b.btnShimmer,
                {
                  opacity: shimmer.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.45, 0],
                  }),
                  transform: [
                    {
                      translateX: shimmer.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-width * 0.36, width * 0.42],
                      }),
                    },
                  ],
                },
              ]}
            />
            <MapPin size={14} color="#fff" fill="#fff" strokeWidth={2} />
            <Text style={b.viewBtnTxt}>Explore on Map</Text>
            <View style={b.arrowCircle}>
              <ArrowRight size={12} color="#6136D8" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}
