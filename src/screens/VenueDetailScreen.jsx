import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation, useRoute} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import RazorpayCheckout from 'react-native-razorpay';
import {ArrowLeft, MapPin, Users, Minus, Plus} from 'lucide-react-native';
import {AUTH_ACTION_TYPES, requireAuth} from '../utils/authGuard';
import {
  fetchVenue,
  fetchUnavailable,
  fetchQuote,
  createVenueBooking,
  verifyVenuePayment,
  rupees,
  toIso,
  addDaysIso,
  stayClashes,
} from '../utils/venueApi';

const PRIMARY = '#5E23DC';
const SLOTS = [
  {key: 'full', label: 'Full day'},
  {key: 'morning', label: 'Morning'},
  {key: 'evening', label: 'Evening'},
];

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const fromIso = iso => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const pretty = iso => fromIso(iso).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'});

/** The payment went through but the confirmation call failed: retry a few times. */
async function verifyWithRetry(payload, token) {
  let lastError;
  for (let i = 0; i < 3; i++) {
    try {
      return await verifyVenuePayment(payload, token);
    } catch (e) {
      lastError = e;
      // a business rejection (4xx) will not change on retry
      if (e?.status && e.status < 500 && e.status !== 409) {
        throw e;
      }
      await new Promise(r => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw lastError;
}

export default function VenueDetailScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {id} = useRoute().params;
  const auth = useSelector(state => state.auth);
  const {width} = useWindowDimensions();

  const [venue, setVenue] = useState(null);
  const [unavailable, setUnavailable] = useState([]);
  const [error, setError] = useState(null);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [slot, setSlot] = useState('full');
  const [guests, setGuests] = useState(2);
  const [picker, setPicker] = useState(null); // 'start' | 'end'
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    Promise.all([fetchVenue(id), fetchUnavailable(id)])
      .then(([v, u]) => {
        setVenue(v);
        setUnavailable(u);
        setGuests(Math.min(2, v.capacity || 2));
      })
      .catch(e => setError(e?.message || 'Could not load this venue.'));
  }, [id]);

  const isSlot = venue?.price_model === 'slot';
  const stay = useMemo(() => {
    if (!start) {return null;}
    if (isSlot) {return {start, end: addDaysIso(start, 1), slot};}
    if (!end) {return null;}
    return {start, end, slot: 'full'};
  }, [start, end, slot, isSlot]);

  const clash = stay && unavailable.some(t => stayClashes(stay, t));

  useEffect(() => {
    setQuote(null);
    setQuoteError(null);
    if (!stay || clash) {return;}
    let alive = true;
    fetchQuote(id, {start_date: stay.start, end_date: stay.end, slot: stay.slot, guests})
      .then(q => alive && setQuote(q.quote))
      .catch(e => alive && setQuoteError(e?.message || 'Could not price this stay.'));
    return () => {
      alive = false;
    };
  }, [id, stay, clash, guests]);

  const onPick = useCallback(
    (event, date) => {
      const which = picker;
      setPicker(Platform.OS === 'ios' ? which : null);
      if (event?.type === 'dismissed' || !date) {return;}
      const iso = toIso(date);
      if (which === 'start') {
        setStart(iso);
        if (end && end <= iso) {setEnd(null);}
      } else {
        setEnd(iso);
      }
    },
    [picker, end],
  );

  const book = async () => {
    if (!requireAuth(navigation, dispatch, auth, {type: AUTH_ACTION_TYPES.VENUE, params: {id}})) {return;}
    const token = auth.token;
    if (!stay || !quote || paying) {return;}
    setPaying(true);
    let order;
    try {
      order = await createVenueBooking(
        {
          listing_id: id,
          start_date: stay.start,
          end_date: stay.end,
          slot: stay.slot,
          guests,
          guest_name: auth.user?.fullname || auth.user?.name || '',
          guest_phone: auth.user?.contact || auth.user?.phone || '',
        },
        token,
      );
    } catch (e) {
      setPaying(false);
      Alert.alert('Could not reserve', e?.message || 'Please try again.');
      return;
    }

    let payment;
    try {
      payment = await RazorpayCheckout.open({
        description: `${venue.title} · ${pretty(stay.start)}`,
        currency: order.currency,
        key: order.key,
        amount: order.amount,
        order_id: order.order_id,
        name: 'Reparv',
        prefill: {
          email: auth.user?.email || '',
          contact: auth.user?.contact || auth.user?.phone || '',
          name: auth.user?.fullname || auth.user?.name || '',
        },
        theme: {color: PRIMARY},
      });
    } catch {
      setPaying(false);
      Alert.alert('Payment not completed', 'Your dates are held for 10 minutes. Tap Book now again to retry.');
      return;
    }

    try {
      await verifyWithRetry(
        {
          razorpay_order_id: payment.razorpay_order_id,
          razorpay_payment_id: payment.razorpay_payment_id,
          razorpay_signature: payment.razorpay_signature,
        },
        token,
      );
      setPaying(false);
      Alert.alert('Booking confirmed 🎉', `Reference ${order.booking_ref}`, [
        {text: 'View booking', onPress: () => navigation.replace('MyVenueBookings')},
      ]);
    } catch (e) {
      setPaying(false);
      // The money was taken. The server also confirms via Razorpay's webhook, so do not ask them to pay again.
      Alert.alert(
        'Payment received',
        e?.status === 409
          ? e.message
          : `We are confirming your booking (${order.booking_ref}). Check My Bookings in a minute; if it is not confirmed, you will be refunded.`,
        [{text: 'My bookings', onPress: () => navigation.replace('MyVenueBookings')}],
      );
    }
  };

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.muted}>{error}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.link}>Go back</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }
  if (!venue) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={PRIMARY} />
      </SafeAreaView>
    );
  }

  const images = venue.images?.length ? venue.images : [null];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={{paddingBottom: 130}}>
        <View>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(u, i) => `${u}-${i}`}
            onMomentumScrollEnd={e => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({item}) =>
              item ? (
                <Image source={{uri: item}} style={{width, height: 260}} />
              ) : (
                <View style={{width, height: 260, backgroundColor: '#E5E7EB'}} />
              )
            }
          />
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
          {images.length > 1 && <Text style={styles.pager}>{page + 1}/{images.length}</Text>}
        </View>

        <View style={styles.pad}>
          <Text style={styles.h1}>{venue.title}</Text>
          <View style={styles.row}>
            <MapPin size={15} color="#6B7280" />
            <Text style={styles.muted}> {[venue.address, venue.city].filter(Boolean).join(', ')}</Text>
          </View>
          <View style={styles.row}>
            <Users size={15} color="#6B7280" />
            <Text style={styles.muted}> Up to {venue.capacity} guests{venue.bedrooms ? ` · ${venue.bedrooms} bedrooms` : ''}</Text>
          </View>
          {venue.description ? <Text style={styles.body}>{venue.description}</Text> : null}

          {venue.amenities?.length ? (
            <View style={styles.wrap}>
              {venue.amenities.map(a => (
                <View key={a} style={styles.tag}><Text style={styles.tagText}>{a}</Text></View>
              ))}
            </View>
          ) : null}

          <Text style={styles.h2}>Choose your dates</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateBox} onPress={() => setPicker('start')}>
              <Text style={styles.dateLabel}>{isSlot ? 'Date' : 'Check-in'}</Text>
              <Text style={styles.dateValue}>{start ? pretty(start) : 'Select'}</Text>
            </TouchableOpacity>
            {!isSlot && (
              <TouchableOpacity style={[styles.dateBox, !start && styles.disabled]} disabled={!start} onPress={() => setPicker('end')}>
                <Text style={styles.dateLabel}>Check-out</Text>
                <Text style={styles.dateValue}>{end ? pretty(end) : 'Select'}</Text>
              </TouchableOpacity>
            )}
          </View>
          {isSlot && (
            <View style={styles.wrap}>
              {SLOTS.map(s => (
                <TouchableOpacity key={s.key} onPress={() => setSlot(s.key)} style={[styles.chip, slot === s.key && styles.chipOn]}>
                  <Text style={[styles.chipText, slot === s.key && styles.chipTextOn]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.guestRow}>
            <Text style={styles.h3}>Guests</Text>
            <View style={styles.row}>
              <TouchableOpacity style={styles.step} onPress={() => setGuests(g => Math.max(1, g - 1))}><Minus size={16} color={PRIMARY} /></TouchableOpacity>
              <Text style={styles.guestNum}>{guests}</Text>
              <TouchableOpacity style={styles.step} onPress={() => setGuests(g => Math.min(venue.capacity, g + 1))}><Plus size={16} color={PRIMARY} /></TouchableOpacity>
            </View>
          </View>

          {clash ? <Text style={styles.error}>These dates are not available. Please pick other dates.</Text> : null}
          {quoteError ? <Text style={styles.error}>{quoteError}</Text> : null}

          {quote && !clash ? (
            <View style={styles.quote}>
              {quote.lines.length > 1 || !isSlot ? (
                <Text style={styles.qLine}>
                  {rupees(quote.stay_total)} · {isSlot ? 'venue' : `${quote.lines.length} night(s)`}
                </Text>
              ) : (
                <Text style={styles.qLine}>Venue {rupees(quote.stay_total)}</Text>
              )}
              {quote.cleaning_fee ? <Text style={styles.qLine}>Cleaning fee {rupees(quote.cleaning_fee)}</Text> : null}
              <Text style={styles.qLine}>GST ({quote.gst_percent}%) {rupees(quote.gst_amount)}</Text>
              <Text style={styles.qTotal}>Total {rupees(quote.total_amount)}</Text>
              {quote.balance_due > 0 ? (
                <Text style={styles.qNote}>Pay {rupees(quote.payable_now)} now ({quote.deposit_percent}%). Balance {rupees(quote.balance_due)} is paid to the host directly.</Text>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.h2}>Cancellation</Text>
          <Text style={styles.body}>{venue.cancellation_text}</Text>
          {venue.rules ? (<><Text style={styles.h2}>House rules</Text><Text style={styles.body}>{venue.rules}</Text></>) : null}
        </View>
      </ScrollView>

      <View style={styles.bar}>
        <View>
          <Text style={styles.barPrice}>{quote ? rupees(quote.payable_now) : rupees(venue.base_price)}</Text>
          <Text style={styles.barSub}>{quote ? 'to pay now' : `per ${venue.price_model === 'night' ? 'night' : 'slot'}`}</Text>
        </View>
        <TouchableOpacity style={[styles.cta, (!quote || clash || paying) && styles.ctaOff]} disabled={!quote || clash || paying} onPress={book}>
          {paying ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Book now</Text>}
        </TouchableOpacity>
      </View>

      {picker ? (
        <DateTimePicker
          value={fromIso(picker === 'end' ? end || addDaysIso(start, 1) : start || toIso(startOfToday()))}
          mode="date"
          minimumDate={picker === 'end' ? fromIso(addDaysIso(start, 1)) : startOfToday()}
          onChange={onPick}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#fff'},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24},
  pad: {padding: 16},
  back: {position: 'absolute', top: 12, left: 12, backgroundColor: '#fff', borderRadius: 18, padding: 8},
  pager: {position: 'absolute', bottom: 10, right: 12, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, overflow: 'hidden'},
  h1: {fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 6},
  h2: {fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 20, marginBottom: 8},
  h3: {fontSize: 15, fontWeight: '600', color: '#111827'},
  row: {flexDirection: 'row', alignItems: 'center', marginTop: 2},
  muted: {color: '#6B7280', fontSize: 14, textTransform: 'none'},
  body: {color: '#374151', lineHeight: 21, marginTop: 8},
  link: {color: PRIMARY, fontWeight: '700', marginTop: 10},
  wrap: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 10},
  tag: {backgroundColor: '#F3F0FF', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, marginRight: 8, marginBottom: 8},
  tagText: {color: PRIMARY, fontWeight: '600', fontSize: 12},
  dateRow: {flexDirection: 'row'},
  dateBox: {flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, marginRight: 10},
  disabled: {opacity: 0.45},
  dateLabel: {fontSize: 12, color: '#6B7280'},
  dateValue: {fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 2},
  chip: {paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8, marginTop: 4},
  chipOn: {backgroundColor: PRIMARY, borderColor: PRIMARY},
  chipText: {color: '#374151', fontWeight: '600'},
  chipTextOn: {color: '#fff'},
  guestRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16},
  step: {borderWidth: 1, borderColor: PRIMARY, borderRadius: 16, padding: 6},
  guestNum: {minWidth: 36, textAlign: 'center', fontWeight: '700', fontSize: 16},
  error: {color: '#DC2626', marginTop: 12},
  quote: {backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginTop: 14},
  qLine: {color: '#374151', marginBottom: 4},
  qTotal: {fontWeight: '800', fontSize: 16, color: '#111827', marginTop: 4},
  qNote: {color: '#6B7280', fontSize: 12, marginTop: 6},
  bar: {position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 14, borderTopWidth: 1, borderTopColor: '#E5E7EB'},
  barPrice: {fontSize: 18, fontWeight: '800', color: '#111827'},
  barSub: {fontSize: 12, color: '#6B7280'},
  cta: {backgroundColor: PRIMARY, paddingHorizontal: 34, paddingVertical: 13, borderRadius: 12, minWidth: 140, alignItems: 'center'},
  ctaOff: {opacity: 0.45},
  ctaText: {color: '#fff', fontWeight: '800', fontSize: 15},
});
