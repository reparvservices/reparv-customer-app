import {setPendingAuthAction} from '../features/auth/authSlice';

export const AUTH_ACTION_TYPES = {
  WISHLIST: 'wishlist',
  BOOK_VISIT: 'book_visit',
  CONTACT_CALL: 'contact_call',
  CONTACT_WHATSAPP: 'contact_whatsapp',
  SELL_PROPERTY: 'sell_property',
  MY_LISTINGS: 'my_listings',
  ACTIVITIES: 'activities',
  PROFILE: 'profile',
};

export function isLoggedIn(auth) {
  return Boolean(auth?.isAuthenticated && auth?.user?.id);
}

/**
 * Redirects guest users to Login and stores the intended action for post-login resume.
 */
export function requireAuth(navigation, dispatch, auth, action) {
  if (isLoggedIn(auth)) {
    return true;
  }
  dispatch(setPendingAuthAction(action));
  navigation.navigate('Login', {signIn: true});
  return false;
}
