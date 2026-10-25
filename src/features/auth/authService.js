import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '../../config/api';
import {requestJson, ApiError} from '../../utils/networkClient';
import {logInfo} from '../../utils/appLogger';

const API_URL = API_BASE_URL;

/**
 * STEP 1: Send OTP (Login / Signup)
 */
export const sendOtpAPI = async credentials => {
  return requestJson(
    `${API_URL}/customerapp/user/signup`,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(credentials),
    },
    'auth.sendOtp',
  );
};

/**
 * STEP 2: Verify OTP
 */
export const verifyOtpAPI = async data => {
  const json = await requestJson(
    `${API_URL}/customerapp/user/verify-otp`,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data),
    },
    'auth.verifyOtp',
  );

  if (!json?.success || !json?.token || !json?.user) {
    throw new ApiError(
      'Invalid login response from server.',
      200,
      'INVALID_AUTH',
    );
  }

  logInfo('login_success', {source: 'otp'});
  return json; // { success, token, user }
};

/**
 * STEP 3: Resend OTP
 */
export const resendOtpAPI = async contact => {
  return requestJson(
    `${API_URL}/customerapp/user/resend-otp`,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({contact}),
    },
    'auth.resendOtp',
  );
};

/**
 * Google Login (UNCHANGED)
 */
export const googleLoginApi = async idToken => {
  const data = await requestJson(
    `${API_URL}/customerapp/user/google-login`,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({token: idToken}),
    },
    'auth.googleLogin',
  );
  logInfo('login_success', {source: 'google'});
  return data;
};

/**
 * Facebook Login
 * payload = { uid, email, displayName, photoURL }
 */
export const facebookLoginApi = async payload => {
  const data = await requestJson(
    `${API_URL}/customerapp/user/facebook-login`,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    },
    'auth.facebookLogin',
  );
  logInfo('login_success', {source: 'facebook'});
  return data; // { success, token, user }
};

export const logoutAPI = async () => {
  await AsyncStorage.multiRemove(['Reparvtoken', 'Reparvuser']);
  await AsyncStorage.setItem('ReparvGuestMode', '1');
};

export const getStoredAuth = async () => {
  try {
    const token = await AsyncStorage.getItem('Reparvtoken');
    const userString = await AsyncStorage.getItem('Reparvuser');

    if (!token || !userString) return null;

    return {token, user: JSON.parse(userString)};
  } catch {
    return null;
  }
};
