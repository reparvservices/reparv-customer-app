import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  sendOtpAPI,
  verifyOtpAPI,
  resendOtpAPI,
  googleLoginApi,
  logoutAPI,
  facebookLoginApi,
} from './authService';
import {logInfo, logWarn} from '../../utils/appLogger';

const GUEST_MODE_KEY = 'ReparvGuestMode';
const ONBOARDING_DONE_KEY = 'ReparvOnboardingDone';
const GUEST_LOCATION_KEY = 'ReparvGuestLocation';

async function readGuestLocation() {
  try {
    const raw = await AsyncStorage.getItem(GUEST_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.city) return null;
    return {city: parsed.city, state: parsed.state || ''};
  } catch {
    return null;
  }
}

export async function persistGuestLocation(city, state) {
  await AsyncStorage.setItem(
    GUEST_LOCATION_KEY,
    JSON.stringify({city, state: state || ''}),
  );
}

export async function clearGuestLocationStorage() {
  await AsyncStorage.removeItem(GUEST_LOCATION_KEY);
}

/** City used for property browse (logged-in profile or guest picker). */
export const selectBrowseCity = state =>
  state.auth.user?.city || state.auth.guestLocation?.city || '';

export const selectBrowseState = state =>
  state.auth.user?.state || state.auth.guestLocation?.state || '';

/**
 * STEP 1: Send OTP
 */
export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (credentials, thunkAPI) => {
    console.log(credentials);

    try {
      const res = await sendOtpAPI(credentials);

      console.log(res, 'rrr');
      if (!res.success) {
        return thunkAPI.rejectWithValue(res.message);
      }

      return true;
    } catch {
      return thunkAPI.rejectWithValue('Failed to send OTP');
    }
  },
);

/**
 * STEP 2: Verify OTP
 */
export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (data, thunkAPI) => {
    try {
      const res = await verifyOtpAPI(data);

      if (!res?.token || !res?.user) {
        return thunkAPI.rejectWithValue('Invalid login response');
      }

      await AsyncStorage.setItem('Reparvtoken', res.token);
      await AsyncStorage.setItem('Reparvuser', JSON.stringify(res.user));
      await AsyncStorage.removeItem(GUEST_MODE_KEY);
      await clearGuestLocationStorage();
      logInfo('token_saved', {source: 'verifyOtp'});

      return res;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  },
);

/**
 * STEP 3: Resend OTP
 */
export const resendOtp = createAsyncThunk(
  'auth/resendOtp',
  async (contact, thunkAPI) => {
    try {
      const res = await resendOtpAPI(contact);

      if (!res.success) {
        return thunkAPI.rejectWithValue(res.message);
      }

      return true;
    } catch {
      return thunkAPI.rejectWithValue('Failed to resend OTP');
    }
  },
);

/**
 * Google Login (UNCHANGED)
 */
export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (idToken, {rejectWithValue}) => {
    try {
      const response = await googleLoginApi(idToken);
      await AsyncStorage.setItem('Reparvtoken', response.token);
      await AsyncStorage.setItem('Reparvuser', JSON.stringify(response.user));
      await AsyncStorage.removeItem(GUEST_MODE_KEY);
      await clearGuestLocationStorage();
      logInfo('token_saved', {source: 'google'});

      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Facebook Login (UNCHANGED)
 */
export const facebookLoginSlice = createAsyncThunk(
  'auth/facebookLogin',
  async (facebookUser, {rejectWithValue}) => {
    try {
      const response = await facebookLoginApi(facebookUser);

      await AsyncStorage.setItem('Reparvtoken', response.token);
      await AsyncStorage.setItem('Reparvuser', JSON.stringify(response.user));
      await AsyncStorage.removeItem(GUEST_MODE_KEY);
      await clearGuestLocationStorage();
      logInfo('token_saved', {source: 'facebook'});

      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  await logoutAPI();
  return true;
});

export const loadUser = createAsyncThunk('auth/loadUser', async () => {
  try {
    const token = await AsyncStorage.getItem('Reparvtoken');
    const user = await AsyncStorage.getItem('Reparvuser');

    if (token && user) {
      logInfo('token_loaded');
      return {
        token,
        user: JSON.parse(user),
        isGuest: false,
      };
    }

    const guestMode = await AsyncStorage.getItem(GUEST_MODE_KEY);
    if (guestMode === '1') {
      const guestLocation = await readGuestLocation();
      logInfo('guest_mode_restored');
      return {
        token: null,
        user: null,
        isGuest: true,
        guestLocation,
      };
    }

    logWarn('session_restore_missing');
    return {
      token: null,
      user: null,
      isGuest: false,
    };
  } catch {
    return {
      token: null,
      user: null,
      isGuest: false,
    };
  }
});

export const enterGuestMode = createAsyncThunk(
  'auth/enterGuestMode',
  async () => {
    await AsyncStorage.setItem(GUEST_MODE_KEY, '1');
    await AsyncStorage.setItem(ONBOARDING_DONE_KEY, '1');
    return true;
  },
);

export const markOnboardingComplete = createAsyncThunk(
  'auth/markOnboardingComplete',
  async () => {
    await AsyncStorage.setItem(ONBOARDING_DONE_KEY, '1');
    return true;
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: false,
    isGuest: false,
    otpSent: false,
    otpVerified: false,
    user: null,
    token: null,
    isLoading: false,
    isBootstrapping: true,
    error: null,
    pendingAuthAction: null,
    guestLocation: null,
  },
  reducers: {
    clearAuthError: state => {
      state.error = null;
    },
    setPendingAuthAction: (state, action) => {
      state.pendingAuthAction = action.payload;
    },
    clearPendingAuthAction: state => {
      state.pendingAuthAction = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },

    /**
     * setUserLocation
     * Fired after the user picks a city in LocationPickerModal.
     * Updates city + state on the in-memory user object so every
     * component reading user.city from Redux re-renders instantly.
     *
     * Usage:
     *   dispatch(setUserLocation({ city: 'Pune', state: 'Maharashtra' }))
     */
    setUserLocation: (state, action) => {
      const {city, state: regionState} = action.payload;
      if (state.user) {
        state.user.city = city;
        state.user.state = regionState;
      } else {
        state.guestLocation = {city, state: regionState};
      }
    },
    /** Immediate guest mode — used before AsyncStorage persist completes */
    setGuestBrowsing: state => {
      state.isGuest = true;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.isBootstrapping = false;
      state.pendingAuthAction = null;
    },
    /** User chose Sign in — leave guest mode and show auth stack login */
    prepareForSignIn: state => {
      state.isGuest = false;
      state.isBootstrapping = false;
    },
  },
  extraReducers: builder => {
    builder
      // SEND OTP
      .addCase(sendOtp.pending, state => {
        state.isLoading = true;
      })
      .addCase(sendOtp.fulfilled, state => {
        state.isLoading = false;
        state.otpSent = true;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // VERIFY OTP
      .addCase(verifyOtp.pending, state => {
        state.isLoading = true;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.isGuest = false;
        state.guestLocation = null;
        state.otpVerified = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // RESEND OTP
      .addCase(resendOtp.pending, state => {
        state.isLoading = true;
      })
      .addCase(resendOtp.fulfilled, state => {
        state.isLoading = false;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // GOOGLE LOGIN
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.isGuest = false;
        state.guestLocation = null;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isLoading = false;
      })

      // FACEBOOK LOGIN
      .addCase(facebookLoginSlice.pending, state => {
        state.isLoading = true;
      })
      .addCase(facebookLoginSlice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.isGuest = false;
        state.guestLocation = null;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(facebookLoginSlice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // LOGOUT
      .addCase(logoutUser.fulfilled, state => {
        state.isAuthenticated = false;
        state.isGuest = true;
        state.user = null;
        state.token = null;
        state.otpVerified = false;
        state.isBootstrapping = false;
        state.pendingAuthAction = null;
      })

      .addCase(enterGuestMode.fulfilled, state => {
        state.isGuest = true;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.isBootstrapping = false;
      })

      // LOAD USER
      .addCase(loadUser.pending, state => {
        state.isLoading = true;
        state.isBootstrapping = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isBootstrapping = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isGuest = Boolean(action.payload.isGuest);
        state.guestLocation = action.payload.guestLocation ?? null;
        state.isAuthenticated = Boolean(
          action.payload.token && action.payload.user,
        );
      });
  },
});

export const {
  clearAuthError,
  setUser,
  setUserLocation,
  setPendingAuthAction,
  clearPendingAuthAction,
  setGuestBrowsing,
  prepareForSignIn,
} = authSlice.actions;
export default authSlice.reducer;
