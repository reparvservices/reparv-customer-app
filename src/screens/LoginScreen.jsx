import React, {useRef, useState, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  useWindowDimensions,
  Modal,
  StatusBar,
  ActivityIndicator,
  ToastAndroid,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';

import Bg1 from '../assets/image/login/login1.svg';
import Bg2 from '../assets/image/login/login2.svg';
import Bg3 from '../assets/image/login/login3.svg';
import Hyperbola from '../assets/image/login/hyperbola-shape.svg';
import Google from '../assets/image/login/devicon_google.svg';
import Facebook from '../assets/image/login/facebook.svg';
import Logo from '../assets/image/login/logo.svg';
import DropdownIcon from '../assets/image/login/dropdown.svg';
import LinearGradient from 'react-native-linear-gradient';
import OtpModal from '../components/login/OtpModal';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {
  facebookLoginSlice,
  sendOtp,
  googleLogin,
} from '../features/auth/authSlice';
import {continueAsGuest} from '../utils/continueAsGuest';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {facebookLogin} from '../utils/facebookLogin';

import {createLoginStyles} from '../utils/loginScreenStyles';

/** Carousel slides — must stay as plain data, not inside StyleSheet.create */
const slides = [
  {
    id: 1,
    image: Bg1,
    title: 'Buy Property with Confidence',
    smallText: 'Verified homes • Transparent pricing',
  },
  {
    id: 2,
    image: Bg2,
    title: 'Sell Your Property Faster',
    smallText: 'List • Connect • Close',
  },
  {
    id: 3,
    image: Bg3,
    title: 'Rent Made Simple',
    smallText: 'Homes • Shops • Offices',
  },
];

const showMessage = message => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }
  Alert.alert('Reparv', message);
};

// ─────────────────────────────────────────────
// LOGIN MODAL
// ─────────────────────────────────────────────
function LoginModal({
  visible,
  onClose,
  onSwitchToSignUp,
  onOtpSent,
  onContinueAsGuest,
  styles,
  width,
  height,
}) {
  const dispatch = useDispatch();
  const {isLoading} = useSelector(state => state.auth);
  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (phoneNumber.trim().length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError('');
    try {
      await dispatch(
        sendOtp({contact: phoneNumber, fullname: 'User'}),
      ).unwrap();
      onOtpSent(phoneNumber);
    } catch (err) {
      showMessage(err || 'Failed to send OTP');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.bottomCardWrapper}>
          <Hyperbola
            width={width}
            height={height * 0.75}
            style={{position: 'absolute', top: 0}}
            preserveAspectRatio="xMidYMid slice"
          />

          <ScrollView
            contentContainerStyle={styles.bottomCardContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <Logo width={84} height={35} />

            <Text style={styles.mainTitle}>
              Welcome <Text style={{color: '#000'}}>Back!</Text>
            </Text>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <LinearGradient
                colors={['#FFFFFF', '#5E23DC']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.dividerLine}
              />
              <Text style={[styles.loginText, {marginHorizontal: 10}]}>
                Login
              </Text>
              <LinearGradient
                colors={['#5E23DC', '#FFFFFF']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.dividerLine}
              />
            </View>

            {/* Phone Input */}
            <View style={styles.phoneWrapper}>
              <Text style={styles.label}>Phone Number</Text>
              <View
                style={[styles.phoneRow, isFocused && styles.phoneRowFocused]}>
                <View style={styles.countryRow}>
                  {/* ── country code same size as input text ── */}
                  <Text style={styles.country}>+91</Text>
                  <DropdownIcon
                    width={20}
                    height={20}
                    style={{marginLeft: 4}}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  maxLength={10}
                  placeholderTextColor="#868686"
                  keyboardType="number-pad"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  value={phoneNumber}
                  onChangeText={text => {
                    setPhoneNumber(text);
                    if (error) setError('');
                  }}
                />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {isLoading ? (
              <ActivityIndicator color="#5E23DC" style={{marginTop: 22}} />
            ) : (
              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                <Text style={styles.loginBtnText}>Send OTP</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.terms}>
              By clicking above you agree to{' '}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate('TermsPrivacyScreen')}>
                Terms & Conditions.
              </Text>
            </Text>

            <TouchableOpacity onPress={onSwitchToSignUp} style={{marginTop: 8}}>
              <Text style={styles.switchText}>
                New user?{' '}
                <Text style={styles.switchLink}>Create an account</Text>
              </Text>
            </TouchableOpacity>

            {Platform.OS === 'android' && (
              <>
                <Text style={styles.or}>Or login with</Text>
                <SocialButtons styles={styles} />
              </>
            )}

            <TouchableOpacity
              style={styles.guestBtn}
              onPress={onContinueAsGuest}>
              <Text style={styles.guestBtnText}>Continue as Guest</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// SIGN UP MODAL
// ─────────────────────────────────────────────
function SignUpModal({
  visible,
  onClose,
  onSwitchToLogin,
  onOtpSent,
  onContinueAsGuest,
  styles,
  width,
  height,
}) {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const {isLoading} = useSelector(state => state.auth);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (phoneNumber.trim().length !== 10)
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    try {
      await dispatch(
        sendOtp({contact: phoneNumber, fullname: fullName}),
      ).unwrap();
      onOtpSent(phoneNumber);
    } catch (err) {
      showMessage(err || 'Failed to send OTP');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.bottomCardWrapper}>
          <Hyperbola
            width={width}
            height={height * 0.75}
            style={{position: 'absolute', top: 0}}
            preserveAspectRatio="xMidYMid slice"
          />

          <ScrollView
            contentContainerStyle={styles.bottomCardContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <Logo width={84} height={35} />

            <Text style={styles.mainTitle}>
              Create Your <Text style={{color: '#000'}}>Account</Text>
            </Text>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <LinearGradient
                colors={['#FFFFFF', '#5E23DC']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.dividerLine}
              />
              <Text style={[styles.loginText, {marginHorizontal: 10}]}>
                Sign Up
              </Text>
              <LinearGradient
                colors={['#5E23DC', '#FFFFFF']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.dividerLine}
              />
            </View>

            {/* First Name */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={[
                  styles.inputField,
                  errors.firstName && styles.inputError,
                ]}
                placeholder="Enter your first name"
                placeholderTextColor="#868686"
                value={firstName}
                onChangeText={text => {
                  setFirstName(text);
                  if (errors.firstName)
                    setErrors(prev => ({...prev, firstName: ''}));
                }}
                autoCapitalize="words"
              />
              {errors.firstName ? (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              ) : null}
            </View>

            {/* Last Name */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={[
                  styles.inputField,
                  errors.lastName && styles.inputError,
                ]}
                placeholder="Enter your last name"
                placeholderTextColor="#868686"
                value={lastName}
                onChangeText={text => {
                  setLastName(text);
                  if (errors.lastName)
                    setErrors(prev => ({...prev, lastName: ''}));
                }}
                autoCapitalize="words"
              />
              {errors.lastName ? (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              ) : null}
            </View>

            {/* Phone Input */}
            <View style={styles.phoneWrapper}>
              <Text style={styles.label}>Phone Number</Text>
              <View
                style={[
                  styles.phoneRow,
                  isFocused && styles.phoneRowFocused,
                  errors.phone && styles.phoneRowError,
                ]}>
                <View style={styles.countryRow}>
                  <Text style={styles.country}>+91</Text>
                  <DropdownIcon
                    width={20}
                    height={20}
                    style={{marginLeft: 4}}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  maxLength={10}
                  placeholderTextColor="#868686"
                  keyboardType="number-pad"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  value={phoneNumber}
                  onChangeText={text => {
                    setPhoneNumber(text);
                    if (errors.phone) setErrors(prev => ({...prev, phone: ''}));
                  }}
                />
              </View>
              {errors.phone ? (
                <Text style={styles.errorText}>{errors.phone}</Text>
              ) : null}
            </View>

            {isLoading ? (
              <ActivityIndicator color="#5E23DC" style={{marginTop: 22}} />
            ) : (
              <TouchableOpacity style={styles.loginBtn} onPress={handleSignUp}>
                <Text style={styles.loginBtnText}>Send OTP</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.terms}>
              By clicking above you agree to{' '}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate('TermsPrivacyScreen')}>
                Terms & Conditions
              </Text>
            </Text>

            <TouchableOpacity onPress={onSwitchToLogin} style={{marginTop: 8}}>
              <Text style={styles.switchText}>
                Already have an account?{' '}
                <Text style={styles.switchLink}>Login</Text>
              </Text>
            </TouchableOpacity>

            {Platform.OS === 'android' && (
              <>
                <Text style={styles.or}>Or sign up with</Text>
                <SocialButtons styles={styles} />
              </>
            )}

            <TouchableOpacity
              style={styles.guestBtn}
              onPress={onContinueAsGuest}>
              <Text style={styles.guestBtnText}>Continue as Guest</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// SHARED: Social Buttons
// ─────────────────────────────────────────────
function SocialButtons({styles}) {
  const dispatch = useDispatch();

  const signInWithGoogle = async () => {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    return userInfo.data?.idToken;
  };

  const handleGoogleLogin = async () => {
    try {
      const idToken = await signInWithGoogle();
      await dispatch(googleLogin(idToken)).unwrap();
      showMessage('Login Successful');
    } catch (err) {
      console.log('Google Login Error:', err);
    }
  };

  const faceBookLogin = async () => {
    const fbUser = await facebookLogin();
    dispatch(facebookLoginSlice(fbUser));
  };

  return (
    <View style={styles.socialRow}>
      <TouchableOpacity
        onPress={handleGoogleLogin}
        style={styles.socialIconWrapper}
        activeOpacity={0.7}>
        <Google width={24} height={24} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={faceBookLogin}
        style={styles.socialIconWrapper}
        activeOpacity={0.7}>
        <Facebook width={26} height={26} />
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────
// MAIN LOGIN SCREEN
// ─────────────────────────────────────────────
export default function LoginScreen() {
  const {width, height} = useWindowDimensions();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const {isAuthenticated, isLoading, isGuest} = useSelector(
    state => state.auth,
  );
  const styles = useMemo(
    () => createLoginStyles(width, height),
    [width, height],
  );

  const flatRef = useRef();
  const [index, setIndex] = useState(0);
  const [activeModal, setActiveModal] = useState('login');
  const [otpPhone, setOtpPhone] = useState('');

  const wantsSignIn = Boolean(
    route.params?.signIn || route.params?.fromAuthGate,
  );
  const showMarketingBanner = activeModal !== 'otp';

  const handleContinueAsGuest = () => {
    setActiveModal(null);
    continueAsGuest(dispatch);
  };

  const isVerifyingOtp = isLoading && activeModal === 'otp';
  const showTransition = isAuthenticated || isVerifyingOtp;

  useFocusEffect(
    useCallback(() => {
      if (wantsSignIn && !isGuest) {
        setActiveModal('login');
      }
    }, [wantsSignIn, isGuest]),
  );

  useEffect(() => {
    if (showTransition) {
      return undefined;
    }
    const timer = setInterval(() => {
      const nextIndex = (index + 1) % slides.length;
      setIndex(nextIndex);
      flatRef?.current?.scrollToIndex({animated: true, index: nextIndex});
    }, 3000);
    return () => clearInterval(timer);
  }, [index, showTransition]);

  if (showTransition) {
    return (
      <SafeAreaView
        style={styles.transitionContainer}
        edges={['top', 'bottom']}>
        <StatusBar
          backgroundColor="#FAF8FF"
          barStyle="dark-content"
          translucent={false}
        />
        <ActivityIndicator size="large" color="#5E23DC" />
      </SafeAreaView>
    );
  }

  const breakTitle = text => {
    const words = text.split(' ');
    if (words.length <= 3) return text;
    return words.slice(0, 3).join(' ') + '\n' + words.slice(3).join(' ');
  };

  const handleOtpSent = phone => {
    setOtpPhone(phone);
    setActiveModal('otp');
  };

  const isOtpOpen = activeModal === 'otp';

  return (
    <SafeAreaView
      style={[styles.container, isOtpOpen && styles.containerOtp]}
      edges={['top', 'bottom']}>
      <StatusBar
        backgroundColor={isOtpOpen ? '#FFFFFF' : '#321376'}
        barStyle={isOtpOpen ? 'dark-content' : 'light-content'}
        translucent={false}
      />

      {/* ── Marketing banner carousel ── */}
      {showMarketingBanner && (
        <View style={styles.topContainer}>
          <FlatList
            ref={flatRef}
            data={slides}
            keyExtractor={item => item.id.toString()}
            horizontal
            pagingEnabled
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            renderItem={({item}) => {
              const Bg = item.image;
              return (
                <View style={styles.slide}>
                  <Bg
                    width={width}
                    height={height * 0.42}
                    preserveAspectRatio="xMidYMid slice"
                  />
                  <View style={styles.overlayText}>
                    <Text style={styles.title}>{breakTitle(item.title)}</Text>
                    <Text style={styles.smallText}>{item.smallText}</Text>
                    <View style={styles.dotsContainer}>
                      {slides.map((_, i) => (
                        <View
                          key={i}
                          style={[styles.dot, index === i && styles.activeDot]}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}

      <LoginModal
        visible={activeModal === 'login'}
        onClose={() => {}}
        onSwitchToSignUp={() => setActiveModal('signup')}
        onOtpSent={handleOtpSent}
        onContinueAsGuest={handleContinueAsGuest}
        styles={styles}
        width={width}
        height={height}
      />

      <SignUpModal
        visible={activeModal === 'signup'}
        onClose={() => {}}
        onSwitchToLogin={() => setActiveModal('login')}
        onOtpSent={handleOtpSent}
        onContinueAsGuest={handleContinueAsGuest}
        styles={styles}
        width={width}
        height={height}
      />

      <OtpModal
        visible={activeModal === 'otp'}
        onClose={() => setActiveModal('login')}
        phone={otpPhone}
        onEdit={() => setActiveModal('login')}
      />
    </SafeAreaView>
  );
}
