import React, {useCallback, useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {useSelector, useDispatch} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '../config/api';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';

import BottomTabNavigator from './BottomTabNavigator';
import OldPropertyScreen from '../screens/OldPropertyScreen';
import NewPropertyScreen from '../screens/NewPropertyScreen';
import RentPropertyScreen from '../screens/RentPropertyScreen';
import ResalePropertyScreen from '../screens/ResalePropertyScreen';
import RentOldNewPropertyScreen from '../screens/RentOldNewPropertyScreen';
import PropertyListScreen from '../screens/PropertyListScreen';
import PropertyDetailsScreen from '../screens/PropertyDetailsScreen';
import PropertyBookDetails from '../screens/PropertyBookDetails';
import MyListingsScreen from '../screens/MyListingsScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import UpdateProfileScreen from '../screens/ProfileUpdate';
import TermsPrivacyScreen from '../screens/TermsPrivacyScreen';
import BlogDetailScreen from '../screens/BlogDetailScreen';
import HighlightedPropertyListScreen from '../screens/HighlightedPropertyListner';
import CompleteProfileScreen from '../screens/CompleteProfileScreen';
import DashboardScreen from '../features/tuya/screens/DashboardScreen';
import {setUser} from '../features/auth/authSlice';
import {navigationRef} from './Navigationref';
import {devLog} from '../utils/devLog';
import {requestJson} from '../utils/networkClient';
import {logError, logInfo, logWarn} from '../utils/appLogger';
import PropertyMapScreen from '../screens/PropertyMapScreen';
import LocationPickerScreen from '../components/home/LocationPickerScreen';
import NoPropertyFound from '../screens/NoPropertyFound';
import SimilerPropertyDetailsScreen from '../screens/SimilerPropertyDetailsScreen';
import CityPropertyMapScreen from '../screens/Citypropertymapscreen';
import ComingSoonScreen from '../components/home/ComingSoonScreen';
import FollowUsScreen from '../screens/followusScreen';
import PropertyReviewScreen from '../components/MyListing/PropertyReviewCard';
import usePendingAuthResume from '../hooks/usePendingAuthResume';
import {getFocusedRouteName} from './navigationState';
import {GUEST_HOME_ROUTE, resetGuestToHome} from '../utils/continueAsGuest';
import AgentWidgetHost from '../components/agent/AgentWidgetHost';

const guestStackInitialState = {
  index: 0,
  routes: [GUEST_HOME_ROUTE],
};

const Stack = createStackNavigator();
const stackScreenOptions = {headerShown: false};

function registerBrowseScreens(StackNavigator) {
  return (
    <>
      <StackNavigator.Screen name="MainTabs" component={BottomTabNavigator} />
      <StackNavigator.Screen name="OldProperty" component={OldPropertyScreen} />
      <StackNavigator.Screen name="NewProperty" component={NewPropertyScreen} />
      <StackNavigator.Screen
        name="RentOldNewProperty"
        component={RentOldNewPropertyScreen}
      />
      <StackNavigator.Screen
        name="RentProperty"
        component={RentPropertyScreen}
      />
      <StackNavigator.Screen
        name="ResaleProperty"
        component={ResalePropertyScreen}
      />
      <StackNavigator.Screen
        name="PropertyListScreen"
        component={PropertyListScreen}
      />
      <StackNavigator.Screen
        name="HighlightedPropertyListScreen"
        component={HighlightedPropertyListScreen}
      />
      <StackNavigator.Screen
        name="PropertyDetails"
        component={PropertyDetailsScreen}
      />
      <StackNavigator.Screen
        name="SimilerPropertyDetailsScreen"
        component={SimilerPropertyDetailsScreen}
      />
      <StackNavigator.Screen
        name="PropertyBookDetails"
        component={PropertyBookDetails}
      />
      <StackNavigator.Screen name="mylisting" component={MyListingsScreen} />
      <StackNavigator.Screen name="HelpCenter" component={HelpCenterScreen} />
      <StackNavigator.Screen
        name="UpdateProfile"
        component={UpdateProfileScreen}
      />
      <StackNavigator.Screen name="BlogDetails" component={BlogDetailScreen} />
      <StackNavigator.Screen name="TuyaDashboard" component={DashboardScreen} />
      <StackNavigator.Screen name="PropertyMap" component={PropertyMapScreen} />
      <StackNavigator.Screen
        name="CityPropertyMapScreen"
        component={CityPropertyMapScreen}
      />
      <StackNavigator.Screen
        name="LocationPickerScreen"
        component={LocationPickerScreen}
        options={{headerShown: false, animation: 'slide_from_bottom'}}
      />
      <StackNavigator.Screen
        name="NoPropertyFound"
        component={NoPropertyFound}
      />
      <StackNavigator.Screen
        name="ComingSoonScreen"
        component={ComingSoonScreen}
      />
      <StackNavigator.Screen
        name="TermsPrivacyScreen"
        component={TermsPrivacyScreen}
      />
      <StackNavigator.Screen name="FollowUs" component={FollowUsScreen} />
      <StackNavigator.Screen
        name="PropertyReview"
        component={PropertyReviewScreen}
      />
    </>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="TermsPrivacyScreen" component={TermsPrivacyScreen} />
    </Stack.Navigator>
  );
}

function GuestStack() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      initialState={guestStackInitialState}
      screenOptions={stackScreenOptions}>
      {registerBrowseScreens(Stack)}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: false,
          cardStyle: {backgroundColor: '#321376'},
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}

function CompleteProfileStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
      {registerBrowseScreens(Stack)}
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={stackScreenOptions}>
      {registerBrowseScreens(Stack)}
    </Stack.Navigator>
  );
}

function AuthenticatedNavigationEffects() {
  usePendingAuthResume();
  return null;
}

function isLocationComplete(user) {
  if (!user || !user.id) return false;
  const hasState =
    user.state !== null &&
    user.state !== undefined &&
    String(user.state).trim() !== '';
  const hasCity =
    user.city !== null &&
    user.city !== undefined &&
    String(user.city).trim() !== '';
  return hasState && hasCity;
}

export default function AppNavigator() {
  const dispatch = useDispatch();
  const {isAuthenticated, isGuest, user, token, isBootstrapping} = useSelector(
    state => state.auth,
  );
  const [profileStatus, setProfileStatus] = useState('idle');
  const [bootstrapTimedOut, setBootstrapTimedOut] = useState(false);

  useEffect(() => {
    if (!isBootstrapping) {
      setBootstrapTimedOut(false);
      return;
    }

    const timer = setTimeout(() => {
      setBootstrapTimedOut(true);
      logWarn('bootstrap_timeout');
    }, 5000);

    return () => clearTimeout(timer);
  }, [isBootstrapping]);

  const fetchProfile = useCallback(
    async userId => {
      try {
        setProfileStatus('loading');
        const data = await requestJson(
          `${API_BASE_URL}/customerapp/user/profile?id=${userId}`,
          {
            headers: {
              ...(token ? {Authorization: `Bearer ${token}`} : {}),
            },
          },
          'auth.fetchProfile',
        );

        if (data?.data) {
          await AsyncStorage.setItem('Reparvuser', JSON.stringify(data.data));
          dispatch(setUser(data.data));
          logInfo('dashboard_profile_loaded');
          setProfileStatus('success');
        } else {
          setProfileStatus('failed');
        }
      } catch (err) {
        setProfileStatus('failed');
        logError('dashboard_profile_failed', {
          code: err?.code,
          status: err?.status,
        });
        devLog('Profile fetch error:', err?.message);
      }
    },
    [dispatch, token],
  );

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchProfile(user.id);
    }
  }, [fetchProfile, isAuthenticated, user?.id]);

  const navigationKey =
    isAuthenticated && user?.id
      ? !isLocationComplete(user)
        ? 'complete-profile'
        : 'main'
      : isGuest
      ? 'guest'
      : 'auth';

  // After switching to guest stack, open Home (not Login)
  useEffect(() => {
    if (navigationKey !== 'guest' || isBootstrapping) {
      return undefined;
    }
    const focusHome = () => {
      const currentRoute = getFocusedRouteName(navigationRef.getRootState());
      if (currentRoute === 'Home') {
        return;
      }
      resetGuestToHome();
    };
    const timers = [0, 80, 200].map(ms => setTimeout(focusHome, ms));
    return () => timers.forEach(clearTimeout);
  }, [navigationKey, isBootstrapping]);

  const renderStack = () => {
    if (isAuthenticated && user?.id) {
      if (!isLocationComplete(user)) {
        return <CompleteProfileStack />;
      }
      return <AppStack />;
    }

    if (isGuest) {
      return <GuestStack />;
    }

    return <AuthStack />;
  };

  if (isBootstrapping && !bootstrapTimedOut) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#5E23DC" />
        <Text style={styles.title}>Initializing app</Text>
        <Text style={styles.subTitle}>Restoring your session securely...</Text>
      </View>
    );
  }

  if (isAuthenticated && user?.id && profileStatus === 'failed') {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Unable to load account data</Text>
        <Text style={styles.subTitle}>
          Check your internet connection and try again.
        </Text>
        <Pressable
          style={styles.retryBtn}
          onPress={() => fetchProfile(user.id)}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const showAgentWidget =
    isGuest || (isAuthenticated && user?.id && isLocationComplete(user));

  return (
    <NavigationContainer ref={navigationRef} key={navigationKey}>
      {(isAuthenticated && user?.id) || isGuest ? (
        <AuthenticatedNavigationEffects />
      ) : null}
      {renderStack()}
      {showAgentWidget ? <AgentWidgetHost /> : null}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  title: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
  },
  subTitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 18,
    backgroundColor: '#5E23DC',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
