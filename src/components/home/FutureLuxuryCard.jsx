import React, {useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import {Monitor} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';

const {width: SW} = Dimensions.get('window');

const PURPLE_BTN = '#7C4AF5';

/* ─── gradient title words ─── */
const GRADIENT_WORDS = [
  {text: 'Future', color: '#100625'},
  {text: ' of ', color: '#1D0B42'},
  {text: 'Smart', color: '#461AA4'},
  {text: ' '},
  {text: 'Renting', color: '#5E23DC'},
];

/* ════════════════════════════════════════════
   FUTURE LUXURY CARD
════════════════════════════════════════════ */
const FutureLuxuryCard = ({onPress}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const navigation = useNavigation();

  const handlePressIn = () =>
    Animated.spring(scale, {toValue: 0.97, useNativeDriver: true}).start();

  const handlePressOut = () =>
    Animated.spring(scale, {toValue: 1, useNativeDriver: true}).start();

  const handlePress = () => {
    onPress?.();
    navigation.navigate('ComingSoonScreen');
  };

  return (
    <View style={c.card}>
      {/* Title */}
      <Text style={c.titleContainer}>
        {GRADIENT_WORDS.map((word, i) =>
          word.color ? (
            <Text key={i} style={[c.titleWord, {color: word.color}]}>
              {word.text}
            </Text>
          ) : (
            word.text
          ),
        )}
      </Text>

      {/* Pill button → navigates to ComingSoonScreen */}
      <Animated.View style={{transform: [{scale}]}}>
        <TouchableOpacity
          style={c.pillBtn}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}>
          <View style={c.iconCircle}>
            <Monitor size={22} color="#fff" strokeWidth={1.8} />
          </View>
          <View style={c.pillText}>
            <Text style={c.pillLabel}>Smart Living</Text>
            <View style={c.pillSub}>
              <View style={c.dot} />
              <Text style={c.pillSubText}>Coming Soon →</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

/* ════════════════════════════════════════════
   STYLES
════════════════════════════════════════════ */
const c = StyleSheet.create({
  card: {
    backgroundColor: '#F5F5FD',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 24,
    elevation: 10,
  },
  titleContainer: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 42,
    flexWrap: 'wrap',
  },
  titleWord: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PURPLE_BTN,
    borderRadius: 999,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 24,
    gap: 14,
    shadowColor: '#6C3DF5',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {flexDirection: 'column', gap: 3},
  pillLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  pillSub: {flexDirection: 'row', alignItems: 'center', gap: 6},
  dot: {width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#00D8D8'},
  pillSubText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
});

export default FutureLuxuryCard;
