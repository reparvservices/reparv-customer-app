import {CommonActions} from '@react-navigation/native';
import {
  clearPendingAuthAction,
  enterGuestMode,
  setGuestBrowsing,
} from '../features/auth/authSlice';
import {navigationRef} from '../navigation/Navigationref';

/** Guest user lands on BottomTabNavigator → Home tab */
export const GUEST_HOME_ROUTE = {
  name: 'MainTabs',
  state: {
    index: 0,
    routes: [{name: 'Home'}],
  },
};

const homeResetAction = CommonActions.reset({
  index: 0,
  routes: [GUEST_HOME_ROUTE],
});

/** Open MainTabs with Home tab selected */
export function resetGuestToHome() {
  if (!navigationRef.isReady()) {
    return false;
  }
  navigationRef.dispatch(homeResetAction);
  return true;
}

/**
 * Mark user as guest and navigate to Home tab.
 * Call from Continue as Guest / Start Browsing — no login screen after this.
 */
export function continueAsGuest(dispatch) {
  dispatch(clearPendingAuthAction());
  dispatch(setGuestBrowsing());
  dispatch(enterGuestMode());

  const tryHome = () => resetGuestToHome();

  tryHome();
  [50, 150, 350, 600].forEach(ms => setTimeout(tryHome, ms));
}
