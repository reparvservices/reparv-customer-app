import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ToastAndroid,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import BackIcon from '../../assets/image/login/arrow.svg';
import {verifyOtp, sendOtp} from '../../features/auth/authSlice';

const showToast = message => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }
  Alert.alert('Reparv', message);
};

export default function OtpModal({visible, onClose, phone, onEdit}) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();

  const safeTop =
    insets.top ||
    initialWindowMetrics?.insets.top ||
    (Platform.OS === 'ios' ? 59 : 0);
  const safeBottom = insets.bottom || initialWindowMetrics?.insets.bottom || 0;
  const inputRefs = useRef([]);

  const [otp, setOtp] = useState(Array(6).fill(''));
  const [errorMsg, setErrorMsg] = useState('');
  const [resendTimer, setResendTimer] = useState(30);

  const {isLoading} = useSelector(state => state.auth);

  const otpBoxSize = Math.min(
    52,
    Math.max(44, Math.round((width - 80) / 6 - 8)),
  );

  useEffect(() => {
    if (!visible) {
      setOtp(Array(6).fill(''));
      setErrorMsg('');
      return;
    }

    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const focusTimer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 400);

    return () => {
      clearInterval(interval);
      clearTimeout(focusTimer);
    };
  }, [visible]);

  const handleChange = (text, index) => {
    if (!/^\d?$/.test(text)) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = text;
    setOtp(updatedOtp);
    setErrorMsg('');

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');

    if (otpValue.length !== 6) {
      return setErrorMsg('Enter valid OTP');
    }

    try {
      await dispatch(
        verifyOtp({
          contact: phone,
          otp: otpValue,
        }),
      ).unwrap();

      showToast('Login Successful');
      setOtp(Array(6).fill(''));
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err || 'Invalid or expired OTP');
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    try {
      dispatch(
        sendOtp({
          contact: phone,
          fullname: 'User',
        }),
      ),
        ToastAndroid.show('OTP Sent Again', ToastAndroid.SHORT);
      setResendTimer(30);
      setOtp(Array(6).fill(''));
      setErrorMsg('');
      inputRefs.current[0]?.focus();
    } catch {
      setErrorMsg('Failed to resend OTP');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <View
        style={[
          styles.root,
          {
            paddingTop: safeTop,
            paddingBottom: safeBottom,
          },
        ]}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backRow}
            onPress={onClose}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <BackIcon width={24} height={24} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={safeTop + 56}>
          <View style={styles.centerWrap}>
            <View style={styles.contentBlock}>
              <Text style={styles.titleCenter}>Verify your Number</Text>

              <View style={styles.subtitleRow}>
                <Text style={styles.subtitleText}>OTP sent to {phone}</Text>
                <Pressable onPress={onEdit} hitSlop={8}>
                  <Text style={styles.edit}>Edit</Text>
                </Pressable>
              </View>

              <Text style={styles.label}>Enter OTP</Text>

              <View style={styles.otpRow}>
                {otp.map((value, i) => (
                  <TextInput
                    key={i}
                    ref={ref => {
                      inputRefs.current[i] = ref;
                    }}
                    style={[
                      styles.otpInput,
                      {width: otpBoxSize, height: otpBoxSize},
                    ]}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete={
                      Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'
                    }
                    maxLength={1}
                    value={value}
                    onChangeText={text => handleChange(text, i)}
                    onKeyPress={e => handleKeyPress(e, i)}
                  />
                ))}
              </View>

              {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

              <Pressable onPress={handleResend} disabled={resendTimer > 0}>
                <Text
                  style={[
                    styles.resend,
                    resendTimer === 0 && styles.resendActive,
                  ]}>
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </Text>
              </Pressable>

              <TouchableOpacity
                style={[
                  styles.verifyBtn,
                  otp.join('').length !== 6 && styles.verifyBtnDisabled,
                ]}
                disabled={otp.join('').length !== 6 || isLoading}
                onPress={handleVerify}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.verifyBtnText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    fontFamily: 'SegoeUI-Bold',
    marginLeft: 8,
    color: '#000',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  contentBlock: {
    width: '100%',
    alignItems: 'center',
  },
  titleCenter: {
    fontSize: 24,
    fontFamily: 'SegoeUI-Bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  subtitleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 12,
    color: '#868686',
    marginRight: 6,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  edit: {
    color: '#5E23DC',
    fontFamily: 'SegoeUI-Bold',
    fontSize: 12,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  label: {
    fontSize: 14,
    fontFamily: 'SegoeUI-Bold',
    marginTop: 16,
    marginBottom: 4,
    textAlign: 'center',
    color: '#000',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 16,
    paddingHorizontal: 4,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    color: '#000',
    backgroundColor: '#FAFAFA',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  resend: {
    fontSize: 12,
    color: '#868686',
    textAlign: 'right',
    alignSelf: 'stretch',
    marginBottom: 12,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  resendActive: {
    color: '#5E23DC',
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
    default: {},
  },
  verifyBtn: {
    backgroundColor: '#5E23DC',
    paddingVertical: 15,
    borderRadius: 15,
    alignSelf: 'stretch',
    width: '100%',
  },
  verifyBtnDisabled: {
    opacity: 0.6,
  },
  verifyBtnText: {
    color: '#fff',
    fontFamily: 'SegoeUI-Bold',
    textAlign: 'center',
    fontSize: 16,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  error: {
    color: 'red',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    alignSelf: 'stretch',
  },
});
