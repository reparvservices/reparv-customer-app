import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft} from 'lucide-react-native';
import {AUTH_ACTION_TYPES, requireAuth} from '../utils/authGuard';
import {fetchMyVenueBookings, cancelVenueBooking, rupees} from '../utils/venueApi';

const PRIMARY = '#5E23DC';
const COLORS = {
  confirmed: ['#DCFCE7', '#166534'],
  held: ['#FEF9C3', '#854D0E'],
  completed: ['#E5E7EB', '#374151'],
  cancelled: ['#FEE2E2', '#991B1B'],
};

export default function MyVenueBookingsScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);
  const token = auth?.token;
  const loggedIn = Boolean(auth?.isAuthenticated && auth?.user?.id && token);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!loggedIn) {
        setLoading(false);
        return;
      }
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        setItems(await fetchMyVenueBookings(token));
      } catch (e) {
        setError(e?.message || 'Could not load your bookings.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loggedIn, token],
  );

  useEffect(() => {
    load();
  }, [load]);

  const cancel = b => {
    Alert.alert(
      'Cancel this booking?',
      `Refund depends on the venue's cancellation policy (${b.cancellation_policy}). You paid ${rupees(b.amount_paid)}.`,
      [
        {text: 'Keep booking', style: 'cancel'},
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: async () => {
            try {
              const r = await cancelVenueBooking(b.id, token, 'Cancelled by customer');
              Alert.alert(
                'Booking cancelled',
                r.refund_amount > 0
                  ? `${rupees(r.refund_amount)} (${r.refund_percent}%) will be refunded to your original payment method.`
                  : 'No refund applies under the cancellation policy.',
              );
              load();
            } catch (e) {
              Alert.alert('Could not cancel', e?.message || 'Please try again.');
            }
          },
        },
      ],
    );
  };

  const renderItem = ({item: b}) => {
    const [bg, fg] = COLORS[b.status] || COLORS.completed;
    return (
      <View style={styles.card}>
        <View style={styles.top}>
          <Text style={styles.title} numberOfLines={1}>{b.listing_title}</Text>
          <View style={[styles.badge, {backgroundColor: bg}]}>
            <Text style={[styles.badgeText, {color: fg}]}>{b.status === 'held' ? 'awaiting payment' : b.status}</Text>
          </View>
        </View>
        <Text style={styles.meta}>{b.listing_city} · Ref {b.booking_ref}</Text>
        <Text style={styles.meta}>
          {b.start_date} → {b.end_date}{b.slot !== 'full' ? ` (${b.slot})` : ''} · {b.guests} guests
        </Text>
        <Text style={styles.money}>
          Paid {rupees(b.amount_paid)} of {rupees(b.total_amount)}
          {b.refund_amount ? `  ·  Refunded ${rupees(b.refund_amount)}` : ''}
        </Text>
        {b.status === 'confirmed' ? (
          <TouchableOpacity onPress={() => cancel(b)} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancel booking</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={22} color="#111827" /></TouchableOpacity>
        <Text style={styles.h1}>My venue bookings</Text>
        <View style={{width: 22}} />
      </View>
      {!loggedIn ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Log in to see your bookings.</Text>
          <TouchableOpacity onPress={() => requireAuth(navigation, dispatch, auth, {type: AUTH_ACTION_TYPES.VENUE})}>
            <Text style={styles.link}>Log in</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <ActivityIndicator style={styles.center} color={PRIMARY} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.muted}>{error}</Text>
          <TouchableOpacity onPress={() => load()}><Text style={styles.link}>Try again</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={b => String(b.id)}
          renderItem={renderItem}
          contentContainerStyle={items.length ? {padding: 16} : styles.center}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={PRIMARY} />}
          ListEmptyComponent={<Text style={styles.muted}>No venue bookings yet.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#F9FAFB'},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16},
  h1: {fontSize: 18, fontWeight: '700', color: '#111827'},
  center: {flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24},
  muted: {color: '#6B7280', textAlign: 'center'},
  link: {color: PRIMARY, fontWeight: '700', marginTop: 10},
  card: {backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#EEF0F3'},
  top: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  title: {flex: 1, fontSize: 16, fontWeight: '700', color: '#111827', marginRight: 8},
  badge: {borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3},
  badgeText: {fontSize: 11, fontWeight: '700', textTransform: 'capitalize'},
  meta: {color: '#6B7280', marginTop: 4},
  money: {color: '#111827', fontWeight: '600', marginTop: 8},
  cancel: {marginTop: 12, alignSelf: 'flex-start'},
  cancelText: {color: '#DC2626', fontWeight: '700'},
});
