import {useEffect, useRef} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {clearPendingAuthAction} from '../features/auth/authSlice';
import {navigationRef} from '../navigation/Navigationref';
import {AUTH_ACTION_TYPES, isLoggedIn} from '../utils/authGuard';

/**
 * After login, resumes the workflow the guest started (wishlist, book visit, etc.).
 */
export default function usePendingAuthResume() {
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);
  const pendingAuthAction = useSelector(state => state.auth.pendingAuthAction);
  const resumedRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn(auth) || !pendingAuthAction || resumedRef.current) {
      return;
    }

    resumedRef.current = true;
    const action = pendingAuthAction;
    dispatch(clearPendingAuthAction());

    const {type, params = {}} = action;

    const navigate = (screen, params) => {
      const run = () => {
        if (navigationRef.isReady()) {
          navigationRef.navigate(screen, params);
        } else {
          setTimeout(run, 100);
        }
      };
      run();
    };

    switch (type) {
      case AUTH_ACTION_TYPES.WISHLIST:
      case AUTH_ACTION_TYPES.BOOK_VISIT:
      case AUTH_ACTION_TYPES.CONTACT_CALL:
      case AUTH_ACTION_TYPES.CONTACT_WHATSAPP:
        if (params.seoSlug) {
          navigate('PropertyDetails', {seoSlug: params.seoSlug});
        }
        break;
      case AUTH_ACTION_TYPES.MY_LISTINGS:
        navigate('mylisting');
        break;
      case AUTH_ACTION_TYPES.ACTIVITIES:
        navigate('MainTabs', {screen: 'Activities'});
        break;
      case AUTH_ACTION_TYPES.SELL_PROPERTY:
        navigate('OldProperty', params);
        break;
      case AUTH_ACTION_TYPES.PROFILE:
        navigate('MainTabs', {screen: 'Profile'});
        break;
      default:
        break;
    }
  }, [auth, dispatch, pendingAuthAction]);
}
