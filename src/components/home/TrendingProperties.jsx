import React from 'react';
import {API_BASE_URL} from '../../config/api';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  Animated,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {selectBrowseCity} from '../../features/auth/authSlice';
import {MapPin, Bed, Bath, Maximize, Map} from 'lucide-react-native';
import {getImageUri} from '../../utils/imageHandle';
import {
  useUserLocation,
  haversineKm,
  formatDistance,
} from '../../hooks/userLocation';
const {width} = Dimensions.get('window');

/* ─────────────────────────────────────────────────────
   DISTANCE BADGE  (replaces old static distanceFromCityCenter)
───────────────────────────────────────────────────── */
const DistanceBadge = ({userCoords, locationLoading, item}) => {
  const distanceLabel = React.useMemo(() => {
    if (!userCoords || !item?.latitude || !item?.longitude) return null;
    const km = haversineKm(
      userCoords.latitude,
      userCoords.longitude,
      parseFloat(item.latitude),
      parseFloat(item.longitude),
    );
    return formatDistance(km);
  }, [userCoords, item?.latitude, item?.longitude]);

  // Still waiting for GPS
  if (locationLoading) {
    return (
      <View style={trendStyles.distanceBadge}>
        <ActivityIndicator size={9} color="#FFFFFF" />
        <Text style={trendStyles.distanceBadgeText}> …</Text>
      </View>
    );
  }

  // No property coords or permission denied
  if (!distanceLabel) return null;

  return (
    <View style={trendStyles.distanceBadge}>
      <MapPin size={9} color="#FFFFFF" strokeWidth={2.5} />
      <Text style={trendStyles.distanceBadgeText}>{distanceLabel}</Text>
    </View>
  );
};

/* ─────────────────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────────────────── */
const SkeletonCard = () => {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={trendStyles.card}>
      <Animated.View style={[trendStyles.skeletonImage, {opacity}]} />
      <View style={trendStyles.content}>
        <Animated.View style={[trendStyles.skeletonPrice, {opacity}]} />
        <Animated.View style={[trendStyles.skeletonTitle, {opacity}]} />
        <Animated.View style={[trendStyles.skeletonLocation, {opacity}]} />
        <View style={trendStyles.configRow}>
          <Animated.View style={[trendStyles.skeletonChip, {opacity}]} />
          <Animated.View style={[trendStyles.skeletonChip, {opacity}]} />
          <Animated.View style={[trendStyles.skeletonChip, {opacity}]} />
        </View>
      </View>
    </View>
  );
};

/* ─────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────── */
const EmptyState = ({onPopularAreas, onExpandRadius}) => (
  <View style={trendStyles.emptyWrapper}>
    <View style={trendStyles.emptyCard}>
      <View style={trendStyles.emptyIconCircle}>
        <Map size={32} color="#7C3AED" strokeWidth={1.8} />
      </View>
      <Text style={trendStyles.emptyTitle}>No trending properties nearby</Text>
      <Text style={trendStyles.emptySubtitle}>
        Try expanding your search radius or check out these popular areas
        instead.
      </Text>
      <View style={trendStyles.emptyActions}>
        <TouchableOpacity
          style={trendStyles.btnOutline}
          activeOpacity={0.8}
          onPress={onPopularAreas}>
          <Text style={trendStyles.btnOutlineText}>Popular Areas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={trendStyles.btnFilled}
          activeOpacity={0.85}
          onPress={onExpandRadius}>
          <Text style={trendStyles.btnFilledText}>Expand Radius</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

/* ─────────────────────────────────────────────────────
   TRENDING PROPERTIES
───────────────────────────────────────────────────── */
function TrendingProperties() {
  const navigation = useNavigation();
  const [properties, setProperties] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const browseCity = useSelector(selectBrowseCity);
  const selectedCity = (browseCity || '').trim().toLowerCase();

  // ── Real GPS distance — one permission prompt per mount ────────
  const {coords: userCoords, loading: locationLoading} = useUserLocation();

  const isCityMatch = item => {
    if (!selectedCity) return true;
    const propertyCity = String(item?.city || '')
      .trim()
      .toLowerCase();
    const propertyLocation = String(item?.location || '')
      .trim()
      .toLowerCase();
    return (
      propertyCity === selectedCity ||
      propertyLocation.includes(selectedCity) ||
      selectedCity.includes(propertyCity)
    );
  };

  React.useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/frontend/all-properties`)
      .then(r => r.json())
      .then(data => {
        const filtered = data
          .filter(
            item =>
              item.status === 'Active' &&
              item.approve === 'Approved' &&
              !item.propertyCategory?.startsWith('Rental') &&
              isCityMatch(item),
          )
          .slice(0, 8);
        setProperties(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity]);

  const formatPrice = price => {
    if (!price) return '—';
    const num = Number(price);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    return `₹${num}`;
  };

  return (
    <View style={trendStyles.section}>
      <View style={trendStyles.header}>
        <Text style={trendStyles.title}>Trending Properties</Text>
        {/* <TouchableOpacity style={trendStyles.seeAll}>
          <Text style={trendStyles.seeAllText}>See All</Text>
          <ChevronRight size={14} color="#8A38F5" strokeWidth={2.5} />
        </TouchableOpacity> */}
      </View>

      {loading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal: 20, gap: 14}}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      ) : properties.length === 0 ? (
        <EmptyState
          onPopularAreas={() => navigation.navigate('LocationPickerScreen')}
          onExpandRadius={() => navigation.navigate('PropertyMap')}
        />
      ) : (
        <FlatList
          data={properties}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => String(item.propertyid)}
          contentContainerStyle={{paddingHorizontal: 20, gap: 14}}
          renderItem={({item}) => {
            const uri = getImageUri(
              item.frontView ? JSON.parse(item.frontView)[0] : null,
            );
            const isBuy = !item.propertyCategory?.startsWith('Rental');

            return (
              <TouchableOpacity
                style={trendStyles.card}
                activeOpacity={0.9}
                onPress={() =>
                  navigation.navigate('PropertyDetails', {
                    seoSlug: item?.seoSlug,
                  })
                }>
                {/* ── IMAGE + OVERLAID BADGES ── */}
                <View style={trendStyles.imgWrap}>
                  {uri ? (
                    <Image
                      source={{uri}}
                      style={trendStyles.img}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[trendStyles.img, {backgroundColor: '#F3F4F6'}]}
                    />
                  )}

                  {/* Buy / Rent — top left */}
                  <View
                    style={[
                      trendStyles.badge,
                      {backgroundColor: isBuy ? '#8A38F5' : '#16A34A'},
                    ]}>
                    <Text style={trendStyles.badgeText}>
                      {isBuy ? 'Buy' : 'Rent'}
                    </Text>
                  </View>
                </View>

                {/* ── CONTENT ── */}
                <View style={trendStyles.content}>
                  <Text style={trendStyles.price}>
                    {formatPrice(item?.totalOfferPrice)}
                  </Text>
                  {/* ── GPS distance — top right ── */}
                  <DistanceBadge
                    userCoords={userCoords}
                    locationLoading={locationLoading}
                    item={item}
                  />
                  <Text style={trendStyles.name} numberOfLines={1}>
                    {item.propertyName}
                  </Text>

                  <View style={trendStyles.locRow}>
                    <MapPin size={11} color="#9CA3AF" strokeWidth={2} />
                    <Text style={trendStyles.locText} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>
                  <View style={trendStyles.configRow}>
                    {item.bedrooms && (
                      <View style={trendStyles.configChip}>
                        <Bed size={11} color="#6B7280" />
                        <Text style={trendStyles.configText}>
                          {item.bedrooms} Beds
                        </Text>
                      </View>
                    )}
                    {item.bathrooms && (
                      <View style={trendStyles.configChip}>
                        <Bath size={11} color="#6B7280" />
                        <Text style={trendStyles.configText}>
                          {item.bathrooms} Baths
                        </Text>
                      </View>
                    )}
                    {item.carpetArea && (
                      <View style={trendStyles.configChip}>
                        <Maximize size={11} color="#6B7280" />
                        <Text style={trendStyles.configText}>
                          {item.carpetArea} sqft
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

export default TrendingProperties;

/* ─────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────── */
const trendStyles = StyleSheet.create({
  section: {marginTop: 28, marginBottom: 10},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.3,
  },
  seeAll: {flexDirection: 'row', alignItems: 'center', gap: 2},
  seeAllText: {fontSize: 13, fontWeight: '600', color: '#8A38F5'},

  // ── Skeleton ──
  skeletonImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#E5E7EB',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  skeletonPrice: {
    width: '40%',
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonTitle: {
    width: '80%',
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonLocation: {
    width: '60%',
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonChip: {
    width: 60,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },

  // ── Empty State ──
  emptyWrapper: {paddingHorizontal: 20},
  emptyCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 6,
  },
  emptyActions: {flexDirection: 'row', gap: 12, marginTop: 6, width: '100%'},
  btnOutline: {
    flex: 1,
    height: 48,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
  },
  btnOutlineText: {fontSize: 14, fontWeight: '700', color: '#1A1A2E'},
  btnFilled: {
    flex: 1,
    height: 48,
    borderRadius: 50,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnFilledText: {fontSize: 14, fontWeight: '700', color: '#FFFFFF'},

  // ── Property Card ──
  card: {
    width: width * 0.58,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
  },
  imgWrap: {height: 160, backgroundColor: '#F3F4F6'},
  img: {width: '100%', height: '100%'},

  // Buy/Rent — top left
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {color: '#FFF', fontSize: 10, fontWeight: '700'},

  // GPS distance — top right (purple tint to match brand)
  distanceBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(138, 56, 245, 0.82)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceBadgeText: {color: '#FFFFFF', fontSize: 10, fontWeight: '700'},

  // Content
  content: {padding: 12, gap: 4},
  price: {fontSize: 17, fontWeight: '800', color: '#1A1A2E'},
  name: {fontSize: 13, fontWeight: '600', color: '#374151'},
  locRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  locText: {fontSize: 11, color: '#9CA3AF', flex: 1},
  configRow: {flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap'},
  configChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  configText: {fontSize: 10, color: '#6B7280', fontWeight: '500'},
});
