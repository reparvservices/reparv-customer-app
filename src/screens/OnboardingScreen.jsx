import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';

import On1 from '../assets/image/onboarding/On boarding screen 1.svg';
import On2 from '../assets/image/onboarding/On boarding screen 2.svg';
import On3 from '../assets/image/onboarding/On boarding screen 3.svg';
import Skip from '../assets/image/onboarding/skip.svg';
import Arrow from '../assets/image/onboarding/arrow.svg';
import Logo from '../assets/image/common/logo2.svg';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch} from 'react-redux';
import {continueAsGuest} from '../utils/continueAsGuest';
import {prepareForSignIn} from '../features/auth/authSlice';

const {width, height} = Dimensions.get('window');

const slides = [
  {id: 1, Component: On1, text: 'Your Property Journey Starts Here.'},
  {id: 2, Component: On2, text: 'All-in-One Real Estate Partner.'},
  {id: 3, Component: On3, text: 'Focused on What Matters.'},
];

export default function OnboardingScreen({navigation}) {
  const dispatch = useDispatch();
  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);
  const fadeAnimPrev = useRef(new Animated.Value(1)).current;
  const fadeAnimNext = useRef(new Animated.Value(0)).current;

  const startGuestBrowsing = () => {
    continueAsGuest(dispatch);
  };

  const handleSignIn = () => {
    dispatch(prepareForSignIn());
    navigation.navigate('Login', {signIn: true});
  };

  const handleNext = () => {
    if (index === slides.length - 1) {
      startGuestBrowsing();
      return;
    }

    setPrevIndex(index);
    setIndex(index + 1);

    fadeAnimPrev.setValue(1);
    fadeAnimNext.setValue(0);

    Animated.parallel([
      Animated.timing(fadeAnimPrev, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimNext, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSkip = () => {
    startGuestBrowsing();
  };

  const CurrentSvg = slides[index].Component;
  const PrevSvg = slides[prevIndex].Component;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="#FAF8FF"
        barStyle="dark-content"
        translucent={false}
      />
      <View style={styles.logoContainer}>
        <Logo width={84} height={35} />
      </View>

      <Animated.View style={[styles.absolute, {opacity: fadeAnimPrev}]}>
        <PrevSvg
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid slice"
        />
      </Animated.View>

      <Animated.View style={[styles.absolute, {opacity: fadeAnimNext}]}>
        <CurrentSvg
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid slice"
        />
      </Animated.View>

      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <View style={styles.skipContent}>
          <Text style={styles.skipText}>Skip</Text>
          <Skip width={20} height={20} style={{marginLeft: 6}} />
        </View>
      </TouchableOpacity>

      <View style={styles.bottomContainer}>
        <Text style={styles.title}>{slides[index].text}</Text>

        <View style={styles.dotsContainer}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, index === i && styles.activeDot]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <View style={styles.nextContent}>
            <Text style={styles.nextText}>
              {index === slides.length - 1 ? 'Start Browsing' : 'Next'}
            </Text>
            <Arrow width={24} height={24} style={{marginLeft: 6}} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signInBtn} onPress={handleSignIn}>
          <Text style={styles.signInText}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  absolute: {position: 'absolute', width, height},
  logoContainer: {position: 'absolute', top: 45, left: 20, zIndex: 10},
  skipBtn: {
    position: 'absolute',
    top: 45,
    right: 20,
    backgroundColor: '#5E23DC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  skipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SegoeUI-Bold',
    // fontWeight: '700'
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    paddingHorizontal: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'SegoeUI-Bold',
    width: '80%',
    marginBottom: 20,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  dotsContainer: {flexDirection: 'row', alignSelf: 'center', marginBottom: 25},
  dot: {
    width: 19,
    height: 4,
    borderRadius: 7,
    marginHorizontal: 6,
    backgroundColor: '#fff',
  },
  activeDot: {width: 50, backgroundColor: '#5E23DC'},
  nextContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextBtn: {
    backgroundColor: '#5E23DC',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  nextText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  signInBtn: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signInText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'SegoeUI-Bold',
    textDecorationLine: 'underline',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
});
