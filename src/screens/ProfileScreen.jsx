import React, {useCallback, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  ScrollView,
  ToastAndroid,
  ActivityIndicator,
  Platform,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {logoutUser} from '../features/auth/authSlice';
import {isLoggedIn, requireAuth, AUTH_ACTION_TYPES} from '../utils/authGuard';
import {
  FileText,
  ShieldOff,
  UserCircle,
  UserX,
  ArrowLeft,
  ChevronRight,
  Heart,
  LogOut,
  Building2,
  PhoneIncoming,
  PencilIcon,
  Trash2,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import VersionCheck from 'react-native-version-check';
import {getImageUri} from '../utils/imageHandle';

const MANAGE_DEVICE_ALLOWED_CONTACTS = new Set([
  '9322396236',
  '7410756686',
  '9552224626',
]);

function normalizePhoneDigits(value) {
  if (value == null || value === '') return '';
  return String(value).replace(/\D/g, '');
}

function isManageDeviceContact(contact) {
  const digits = normalizePhoneDigits(contact);
  if (!digits) return false;
  const last10 = digits.length > 10 ? digits.slice(-10) : digits;
  return (
    MANAGE_DEVICE_ALLOWED_CONTACTS.has(digits) ||
    MANAGE_DEVICE_ALLOWED_CONTACTS.has(last10)
  );
}

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);
  const [user, setUser] = useState(null);
  const navigation = useNavigation();
  const [properties, setProperty] = useState(0);
  const [saved, setSaved] = useState(0);
  const [enquiryCount, setEnquiryCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const showManageDevice = useMemo(() => {
    const loginPhone =
      user?.contact ??
      user?.phone ??
      auth?.user?.contact ??
      auth?.user?.phone ??
      '';
    return isManageDeviceContact(loginPhone);
  }, [user?.contact, user?.phone, auth?.user?.contact, auth?.user?.phone]);

  const deleteVerificationText = useMemo(() => {
    return 'DELETEMYACCOUNT';
  }, []);

  /** Native marketing version + build (matches Xcode / Play Console). */
  const appVersionLabel = useMemo(() => {
    try {
      const version = VersionCheck.getCurrentVersion();
      const build = VersionCheck.getCurrentBuildNumber();
      if (version && build && String(build) !== String(version)) {
        return `Version ${version} (${build})`;
      }
      return version ? `Version ${version}` : '';
    } catch {
      return '';
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('Reparvuser');
      if (!userData) {
        setLoading(false);
        return;
      }

      const parsedUser = JSON.parse(userData);
      if (!parsedUser?.id) {
        setLoading(false);
        return;
      }

      const res = await fetch(
        `https://aws-api.reparv.in/customerapp/user/profile?id=${parsedUser.id}`,
      );
      const data = await res.json();
      if (res.ok) setUser(data?.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    try {
      if (!auth?.user?.id) return;
      const res = await fetch(
        `https://aws-api.reparv.in/customerapp/property/myproperty/${auth.user.id}`,
      );
      const data = await res.json();
      setProperty(Array.isArray(data) ? data.length : 0);
    } catch (error) {}
  }, [auth?.user?.id]);

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await fetch(
        `https://aws-api.reparv.in/customerapp/property/get-wishlist/${auth?.user?.id}`,
      );
      const json = await res.json();
      setSaved(json?.data?.length);
    } catch (error) {}
  }, [auth?.user?.id]);

  const fetchEnquiries = useCallback(async () => {
    try {
      if (!auth?.user?.id) return;
      const res = await fetch(
        `https://aws-api.reparv.in/customerapp/enquiry/getvisitors/${auth.user.id}`,
      );
      const data = await res.json();
      setEnquiryCount(Array.isArray(data) ? data.length : 0);
    } catch (error) {}
  }, [auth?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchProperties();
      fetchWishlist();
      fetchProfile();
      fetchEnquiries();
    }, [fetchEnquiries, fetchProfile, fetchProperties, fetchWishlist]),
  );

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== deleteVerificationText) {
      ToastAndroid.show(
        `Please type "${deleteVerificationText}" exactly to confirm`,
        ToastAndroid.LONG,
      );
      return;
    }

    try {
      setDeleting(true);

      const res = await fetch(
        'https://aws-api.reparv.in/customerapp/user/delete-account',
        {
          method: 'DELETE',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({user_id: user?.id ?? auth?.user?.id}),
        },
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setDeleteModalVisible(false);
        ToastAndroid.show('Account deleted successfully', ToastAndroid.SHORT);
        await AsyncStorage.removeItem('Reparvuser');
        dispatch(logoutUser());
      } else {
        ToastAndroid.show(
          data?.message ?? 'Failed to delete account',
          ToastAndroid.SHORT,
        );
      }
    } catch (error) {
      ToastAndroid.show('Something went wrong. Try again.', ToastAndroid.SHORT);
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteConfirmText('');
    setDeleteModalVisible(true);
  };

  const closeDeleteModal = () => {
    if (!deleting) {
      setDeleteConfirmText('');
      setDeleteModalVisible(false);
    }
  };

  if (!isLoggedIn(auth)) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar backgroundColor="#FAF8FF" barStyle="dark-content" />
        <View style={styles.guestWrap}>
          <UserCircle size={56} color="#5E23DC" />
          <Text style={styles.guestTitle}>Sign in to your account</Text>
          <Text style={styles.guestSubtitle}>
            Save properties, manage listings, and track enquiries after you sign
            in.
          </Text>
          <TouchableOpacity
            style={styles.guestPrimaryBtn}
            onPress={() =>
              requireAuth(navigation, dispatch, auth, {
                type: AUTH_ACTION_TYPES.PROFILE,
              })
            }>
            <Text style={styles.guestPrimaryBtnText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#a545ee" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#FAF8FF" barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#111" />
        </TouchableOpacity>

        <View style={{flex: 1, alignItems: 'center'}}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {showManageDevice ? (
          <TouchableOpacity
            style={styles.manageDeviceBtn}
            onPress={() => navigation.navigate('TuyaDashboard')}>
            <Text style={styles.manageDeviceBtnText}>Manage Device</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRightSpacer} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileRow}>
          <View style={styles.profileLeft}>
            <View style={styles.avatarWrapper}>
              <Image
                source={
                  user?.userimage
                    ? {
                        uri: user.userimage.startsWith('http')
                          ? user.userimage
                          : `${auth?.BASE_URL}${user.userimage}`,
                      }
                    : require('../assets/image/home/user.png')
                }
                style={styles.avatar}
              />
            </View>

            <View style={styles.userInfo}>
              <Text
                style={styles.userName}
                numberOfLines={2}
                ellipsizeMode="tail">
                {user?.fullname || 'User Name'}
              </Text>
              <Text style={styles.userContact}>{user?.contact || '—'}</Text>
              {user?.email && (
                <Text style={styles.userEmail}>{user.email}</Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() =>
              navigation.navigate('UpdateProfile', {
                fullname: user?.fullname,
                email: user?.email,
                contact: user?.contact,
                userid: user?.id,
                state: user?.state,
                city: user?.city,
                userimage: user?.userimage ? getImageUri(user.userimage) : null,
              })
            }>
            <Text style={styles.editText}>
              <PencilIcon color={'white'} size={13} />
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerLine} />

        <View style={styles.statsCard}>
          <TouchableOpacity
            style={styles.statWrapper}
            onPress={() => navigation.navigate('mylisting')}>
            <StatItem icon={Building2} label="My Listings" value={properties} />
          </TouchableOpacity>

          <View style={styles.verticalDivider} />

          <TouchableOpacity
            style={styles.statWrapper}
            onPress={() => navigation.navigate('Activities')}>
            <StatItem icon={Heart} label="Saved" value={saved} />
          </TouchableOpacity>

          <View style={styles.verticalDivider} />

          <TouchableOpacity
            style={styles.statWrapper}
            onPress={() => navigation.navigate('mylisting')}>
            <StatItem
              icon={PhoneIncoming}
              label="Enquiry"
              value={enquiryCount}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.menuCard}>
          <MenuItem
            label="My Listings"
            image={require('../assets/image/Profile/list.png')}
            list
            page="mylisting"
            navigation={navigation}
          />
          <MenuItem
            label="My Enquiry"
            image={require('../assets/image/Profile/artical.png')}
            page="Activities"
            navigation={navigation}
          />
          <MenuItem
            label="Sell Property"
            image={require('../assets/image/Profile/sell.png')}
            page="OldProperty"
            navigation={navigation}
          />
          {/* Rent Property: uses onPress for custom navigation params */}
          <MenuItem
            label="Rent Property"
            image={require('../assets/image/Profile/sell.png')}
            onPress={() =>
              navigation.navigate('OldProperty', {mode: 'add', type: 'rent'})
            }
          />
          <MenuItem
            label="Help Center"
            image={require('../assets/image/Profile/help.png')}
            page="HelpCenter"
            navigation={navigation}
          />
          <MenuItem
            label="Follow Us"
            image={require('../assets/image/Profile/insta.png')}
            page="FollowUs"
            big={true}
            navigation={navigation}
          />
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => dispatch(logoutUser())}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={openDeleteModal}>
          <Trash2 size={20} color="#6B7280" />
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>

        {appVersionLabel ? (
          <Text style={styles.version}>{appVersionLabel}</Text>
        ) : null}
      </ScrollView>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconRing}>
              <UserX size={30} color="#A32D2D" />
            </View>

            <Text style={styles.modalTitle}>Delete your account?</Text>

            <Text style={styles.modalBody}>
              This is{' '}
              <Text style={styles.modalBold}>
                permanent and cannot be undone.
              </Text>
              {'\n'}The following data will be lost forever.
            </Text>

            <View style={styles.warnBadge}>
              <ShieldOff size={14} color="#B45309" />
              <Text style={styles.warnBadgeText}>
                Once deleted,{' '}
                <Text style={styles.warnBadgeBold}>
                  recovery is not possible
                </Text>
              </Text>
            </View>

            <View style={styles.verificationBox}>
              <Text style={styles.verificationLabel}>
                Type{' '}
                <Text style={styles.verificationCode}>
                  {deleteVerificationText}
                </Text>{' '}
                to confirm
              </Text>
              <TextInput
                style={styles.verificationInput}
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder={deleteVerificationText}
                placeholderTextColor="#9CA3AF"
                editable={!deleting}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={closeDeleteModal}
                disabled={deleting}>
                <ArrowLeft size={15} color="#374151" />
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalBtn,
                  styles.confirmDeleteBtn,
                  deleting && {opacity: 0.7},
                ]}
                onPress={handleDeleteAccount}
                disabled={deleting}>
                {deleting ? (
                  <ActivityIndicator size="small" color="#F7C1C1" />
                ) : (
                  <>
                    <Trash2 size={15} color="#F7C1C1" />
                    <Text style={styles.confirmDeleteBtnText}>Yes, delete</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const LossItem = ({icon, text}) => (
  <View style={styles.lossRow}>
    <View style={styles.lossIcon}>{icon}</View>
    <Text style={styles.lossText}>{text}</Text>
  </View>
);

const StatItem = ({icon: Icon, label, value}) => (
  <View style={styles.statItem}>
    <View style={styles.statIcon}>
      <Icon size={20} color="#6D28D9" />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ── MenuItem: supports both page-based nav and a direct onPress handler ──
const MenuItem = ({image, label, list, page, navigation, big, onPress}) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => {
      if (onPress) {
        onPress();
      } else if (page && navigation) {
        navigation.navigate(page);
      }
    }}>
    <View style={styles.menuLeft}>
      <View
        style={[
          styles.menuIcon,
          list && {backgroundColor: '#5E23DC', padding: 6},
          big && {backgroundColor: '#FFFFFF', marginLeft: -7},
        ]}>
        <Image
          source={image}
          style={[
            styles.menuImage,
            list && {width: 19, height: 19, tintColor: '#FFF'},
            big && {width: 44, height: 44},
          ]}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.menuText} numberOfLines={2}>
        {label}
      </Text>
    </View>
    <ChevronRight size={20} color="#111" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  container: {flex: 1, backgroundColor: '#FAF8FF'},
  guestWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  guestTitle: {
    marginTop: 20,
    fontSize: 20,
    fontFamily: 'SegoeUI-Bold',
    color: '#111',
    textAlign: 'center',
  },
  guestSubtitle: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  guestPrimaryBtn: {
    marginTop: 24,
    backgroundColor: '#5E23DC',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  guestPrimaryBtnText: {
    color: '#fff',
    fontFamily: 'SegoeUI-Bold',
    fontSize: 16,
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'SegoeUI-Bold',
    color: '#111',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  headerRightSpacer: {minWidth: 44, minHeight: 44},
  manageDeviceBtn: {
    backgroundColor: '#6D28D9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
  },
  manageDeviceBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 10,
    alignItems: 'flex-start',
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  avatarWrapper: {
    borderWidth: 3,
    borderColor: '#7C3AED',
    borderRadius: 50,
    padding: 2,
  },
  avatar: {width: 64, height: 64, borderRadius: 32},
  userInfo: {flex: 1, minWidth: 0, justifyContent: 'center', paddingTop: 2},
  userName: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: '#111827',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  userContact: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
    color: '#6B7280',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  userEmail: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
    color: '#9CA3AF',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  editBtn: {
    backgroundColor: '#6D28D9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexShrink: 0,
    marginTop: 4,
  },
  editText: {fontSize: 13, color: '#FFF', fontWeight: '600'},
  dividerLine: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  statsCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    paddingVertical: 20,
  },
  statItem: {flex: 1, alignItems: 'center', paddingHorizontal: 6},
  statWrapper: {flex: 1, alignItems: 'center'},
  statIcon: {
    backgroundColor: '#EDE9FE',
    padding: 10,
    borderRadius: 12,
    marginBottom: 6,
  },
  statValue: {
    color: '#000',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  verticalDivider: {width: 1, backgroundColor: '#E5E7EB'},
  menuCard: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuLeft: {flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1},
  menuIcon: {borderRadius: 10},
  menuImage: {width: 34, height: 34, tintColor: '#5E23DC'},
  menuText: {
    flex: 1,
    fontFamily: 'SegoeUI-Bold',
    fontSize: 14,
    lineHeight: 20,
    color: '#111',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#EF4444',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  deleteBtn: {
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  deleteText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#6B7280',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    color: '#9CA3AF',
    marginTop: 14,
    marginBottom: 28,
    paddingHorizontal: 20,
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  modalIconRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FCEBEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  modalBody: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 18,
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  modalBold: {fontWeight: '600', color: '#111827'},
  lossList: {
    alignSelf: 'stretch',
    backgroundColor: '#FCEBEB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  lossRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lossIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F7C1C1',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lossText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#791F1F',
    flex: 1,
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  warnBadge: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  warnBadgeText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#92400E',
    flex: 1,
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  warnBadgeBold: {fontWeight: '600', color: '#78350F'},
  verificationBox: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  verificationLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  verificationCode: {
    fontWeight: '700',
    color: '#A32D2D',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  verificationInput: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  confirmDeleteBtn: {
    backgroundColor: '#A32D2D',
  },
  confirmDeleteBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F7C1C1',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
});
