import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, MapPin, Users} from 'lucide-react-native';
import {fetchVenues, rupees, VENUE_TYPES} from '../utils/venueApi';

const PRIMARY = '#5E23DC';

function VenueCard({item, onPress}) {
  const img = item.images?.[0];
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      {img ? <Image source={{uri: img}} style={styles.cardImg} /> : <View style={[styles.cardImg, styles.noImg]} />}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.row}>
          <MapPin size={14} color="#6B7280" />
          <Text style={styles.meta}> {item.city} · {item.type}</Text>
        </View>
        <View style={styles.row}>
          <Users size={14} color="#6B7280" />
          <Text style={styles.meta}> up to {item.capacity} guests</Text>
        </View>
        <Text style={styles.price}>
          {rupees(item.base_price)}
          <Text style={styles.per}> / {item.price_model === 'night' ? 'night' : 'slot'}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function VenuesScreen() {
  const navigation = useNavigation();
  const [type, setType] = useState('');
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const {listings} = await fetchVenues({type, q: submitted});
      setItems(listings);
    } catch (e) {
      setError(e?.message || 'Could not load venues.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [type, submitted]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Stays & Venues</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyVenueBookings')}>
          <Text style={styles.link}>My bookings</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search by city or name"
        placeholderTextColor="#9CA3AF"
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        onSubmitEditing={() => setSubmitted(query.trim())}
      />
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {['', ...VENUE_TYPES].map(t => (
            <TouchableOpacity key={t || 'all'} onPress={() => setType(t)} style={[styles.chip, type === t && styles.chipOn]}>
              <Text style={[styles.chipText, type === t && styles.chipTextOn]}>{t || 'All'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.center} color={PRIMARY} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.empty}>{error}</Text>
          <TouchableOpacity onPress={() => load()}><Text style={styles.link}>Try again</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => String(i.id)}
          renderItem={({item}) => (
            <VenueCard item={item} onPress={() => navigation.navigate('VenueDetail', {id: item.id})} />
          )}
          contentContainerStyle={items.length ? styles.list : styles.center}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={PRIMARY} />}
          ListEmptyComponent={<Text style={styles.empty}>No venues available yet. Please check back soon.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#F9FAFB'},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16},
  title: {fontSize: 18, fontWeight: '700', color: '#111827'},
  link: {color: PRIMARY, fontWeight: '700'},
  search: {marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB', color: '#111827'},
  chips: {paddingHorizontal: 16, paddingVertical: 12},
  chip: {paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8},
  chipOn: {backgroundColor: PRIMARY, borderColor: PRIMARY},
  chipText: {color: '#374151', textTransform: 'capitalize', fontWeight: '600'},
  chipTextOn: {color: '#fff'},
  list: {padding: 16},
  center: {flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24},
  empty: {color: '#6B7280', textAlign: 'center', marginBottom: 8},
  card: {backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#EEF0F3'},
  cardImg: {width: '100%', height: 180, backgroundColor: '#E5E7EB'},
  noImg: {alignItems: 'center', justifyContent: 'center'},
  cardBody: {padding: 14},
  cardTitle: {fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6},
  row: {flexDirection: 'row', alignItems: 'center', marginBottom: 2},
  meta: {color: '#6B7280', fontSize: 13, textTransform: 'capitalize'},
  price: {marginTop: 8, fontSize: 17, fontWeight: '800', color: PRIMARY},
  per: {fontSize: 12, fontWeight: '500', color: '#6B7280'},
});
