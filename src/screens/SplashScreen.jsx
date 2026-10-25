import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, useWindowDimensions} from 'react-native';
import Logo from '../assets/image/common/logo2.svg';
import HomeIcon from '../assets/image/common/homeIcon.svg';

const SplashScreen = ({navigation}) => {
  const {width} = useWindowDimensions();
  const logoW = Math.min(300, Math.round(width * 0.82));
  const logoH = Math.round(logoW * (130 / 300));

  const bgAnim = useRef(new Animated.Value(0)).current;
  const homeOpacity = useRef(new Animated.Value(1)).current;
  const logoX = useRef(new Animated.Value(width)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    Animated.sequence([
      Animated.delay(400),

      Animated.parallel([
        Animated.timing(bgAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(homeOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),

      Animated.timing(bgAnim, {
        toValue: 2,
        duration: 600,
        useNativeDriver: false,
      }),

      Animated.parallel([
        Animated.timing(logoX, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ]).start(({finished}) => {
      if (!finished || cancelled) {
        return;
      }
      try {
        const state = navigation.getState();
        const names = state?.routeNames;
        if (!Array.isArray(names) || !names.includes('Onboarding')) {
          return;
        }
        navigation.replace('Onboarding');
      } catch {
        // Navigator may already be unmounted (e.g. auth loaded → root stack switched).
      }
    });

    return () => {
      cancelled = true;
    };
  }, [navigation]);

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['#FFFFFF', '#8200d9', '#FFFFFF'],
  });

  return (
    <Animated.View style={[styles.container, {backgroundColor: bgColor}]}>
      <Animated.View style={{opacity: homeOpacity, position: 'absolute'}}>
        {/* <HomeIcon width={120} height={120} /> */}
      </Animated.View>

      <Animated.View
        style={{
          transform: [{translateX: logoX}],
          opacity: logoOpacity,
        }}>
        <Logo width={logoW} height={logoH} />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SplashScreen;
