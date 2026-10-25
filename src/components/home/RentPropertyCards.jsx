import React, {useMemo} from 'react';
import {API_BASE_URL} from '../../config/api';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import {useState, useEffect} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {Building2, Eye, HeartIcon, Map, MapPin} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {selectBrowseCity} from '../../features/auth/authSlice';
import Location from '../../assets/image/home/rented-properties-card/location.png';
import {formatIndianAmount} from '../../utils/formatIndianAmount';
import {fetchAllPropertiesCached} from '../../services/allPropertiesCache';
import {getImageUri} from '../../utils/imageHandle';
import {
  formatDistance,
  haversineKm,
  useUserLocation,
} from '../../hooks/userLocation';

const {width} = Dimensions.get('window');

/* ---------------------------------------
   SKELETON CARD
--------------------------------------- */
const RentSkeletonCard = () => {
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
    <View style={styles.card}>
      <Animated.View style={[styles.skeletonImage, {opacity}]} />
      <View style={styles.bottom}>
        <Animated.View style={[styles.skeletonLocation, {opacity}]} />
        <Animated.View style={[styles.skeletonTitle, {opacity}]} />
        <View style={styles.skeletonRow}>
          <Animated.View style={[styles.skeletonFeature, {opacity}]} />
          <Animated.View style={[styles.skeletonPrice, {opacity}]} />
        </View>
        <View style={styles.divider} />
        <View style={styles.skeletonFooter}>
          <Animated.View style={[styles.skeletonIcon, {opacity}]} />
          <Animated.View style={[styles.skeletonButton, {opacity}]} />
        </View>
      </View>
    </View>
  );
};

/* ---------------------------------------
   SUBSCRIPTION CHECK HELPER
--------------------------------------- */
export const checkSubscription = async partnerid => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/projectpartner/subscription/user/${partnerid}`,
    );
    const data = await res.json();
    return data?.success && data?.active;
  } catch {
    return false;
  }
};

/* ---------------------------------------
   DISTANCE BADGE
--------------------------------------- */
const DistanceBadge = ({userCoords, locationLoading, item}) => {
  const distanceLabel = useMemo(() => {
    if (!userCoords || !item?.latitude || !item?.longitude) return null;
    const km = haversineKm(
      userCoords.latitude,
      userCoords.longitude,
      parseFloat(item.latitude),
      parseFloat(item.longitude),
    );
    return formatDistance(km);
  }, [userCoords, item?.latitude, item?.longitude]);

  if (locationLoading) {
    return (
      <View style={styles.distancePill}>
        <ActivityIndicator size={9} color="#8A38F5" />
        <Text style={styles.distanceText}> …</Text>
      </View>
    );
  }

  if (!distanceLabel) return null;

  return (
    <View style={styles.distancePill}>
      <MapPin size={10} color="#8A38F5" strokeWidth={2.5} />
      <Text style={styles.distanceText}>{distanceLabel} away</Text>
    </View>
  );
};

/* ---------------------------------------
   EMPTY STATE
--------------------------------------- */
const EmptyState = ({onPopularAreas, onExpandRadius}) => (
  <View style={styles.emptyWrapper}>
    <View style={styles.emptyCard}>
      <View style={styles.emptyIconCircle}>
        <Map size={32} color="#7C3AED" strokeWidth={1.8} />
      </View>
      <Text style={styles.emptyTitle}>No rental properties nearby</Text>
      <Text style={styles.emptySubtitle}>
        Try expanding your search radius or check out these popular areas
        instead.
      </Text>
      <View style={styles.emptyActions}>
        <TouchableOpacity
          style={styles.btnOutline}
          activeOpacity={0.8}
          onPress={onPopularAreas}>
          <Text style={styles.btnOutlineText}>Popular Areas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnFilled}
          activeOpacity={0.85}
          onPress={onExpandRadius}>
          <Text style={styles.btnFilledText}>Explore More</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

/* ---------------------------------------
   SECTION HEADER
--------------------------------------- */
const SectionHeader = () => (
  <View style={styles.sectionHeader}>
    <LinearGradient colors={['#8A38F5', '#FAF8FF']} style={styles.line} />
    <Text style={styles.titleText}>Properties on Rents</Text>
    <LinearGradient colors={['#FAF8FF', '#8A38F5']} style={styles.line} />
  </View>
);

/* ---------------------------------------
   MAIN COMPONENT
--------------------------------------- */
export default function RentPropertyCards() {
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [likeCounts, setLikeCounts] = useState({});
  const navigation = useNavigation();

  const {coords: userCoords, loading: locationLoading} = useUserLocation();

  const browseCity = useSelector(selectBrowseCity);
  const selectedCity = (browseCity || '').trim().toLowerCase();

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

  useEffect(() => {
    fetchFlats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity]);

  const fetchVisits = async propertyid => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/customerapp/enquiry/getvisits?propertyid=${propertyid}`,
      );
      const data = await res.json();
      return data?.totalVisitors || 0;
    } catch {
      return 0;
    }
  };

  const fetchFlats = async () => {
    setLoading(true);
    try {
      const data = await fetchAllPropertiesCached();
      const filtered = data.filter(
        item =>
          item.status === 'Active' &&
          item.approve === 'Approved' &&
          item.propertyCategory?.startsWith('Rental') &&
          isCityMatch(item),
      );

      // ✅ Sort newest uploaded first (by updated_at descending)
      filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

      const updated = await Promise.all(
        filtered.map(async item => {
          const assured = item.partnerid
            ? await checkSubscription(item.partnerid)
            : false;
          const totalVisitors = await fetchVisits(item.propertyid);

          // ✅ Flag properties uploaded within the last 7 days
          const isNew =
            item.updated_at &&
            (Date.now() - new Date(item.updated_at).getTime()) /
              (1000 * 60 * 60 * 24) <=
              7;

          return {...item, reparvAssured: assured, totalVisitors, isNew};
        }),
      );
      setFlats(updated);
      fetchAllLikes(updated);
    } catch (error) {
      console.error('Error fetching rental properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllLikes = async properties => {
    try {
      const results = await Promise.all(
        properties.map(async item => {
          const res = await fetch(
            `${API_BASE_URL}/customerapp/property/likes/${item.propertyid}`,
          );
          const data = await res.json();
          return {propertyId: item.propertyid, likeCount: data?.likeCount || 0};
        }),
      );
      const likeMap = {};
      results.forEach(r => {
        likeMap[r.propertyId] = r.likeCount;
      });
      setLikeCounts(likeMap);
    } catch (err) {
      console.log('Like fetch error:', err);
    }
  };

  /* ── CARD UI ── */
  const renderItem = ({item}) => {
    const imageUri = getImageUri(
      item.frontView ? JSON.parse(item.frontView)[0] : null,
    );

    return (
      <View style={styles.card}>
        {/* IMAGE */}
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('PropertyDetails', {seoSlug: item?.seoSlug})
          }
          style={styles.imageContainer}>
          {imageUri ? (
            <Image source={{uri: imageUri}} style={styles.image} />
          ) : (
            <View style={[styles.image, {backgroundColor: '#eee'}]} />
          )}

          {/* REPARV Assured — top left */}
          {item?.reparvAssured && (
            <View style={styles.leftBadge}>
              <Text style={styles.badgeText}>REPARV Assured</Text>
            </View>
          )}

          {/* HOT DEAL — top right */}
          {item?.hotDeal === 'Active' && (
            <View style={styles.rightBadge}>
              <Text style={styles.badgeText}>HOT DEAL</Text>
            </View>
          )}

          {/* ✅ NEW badge — bottom left, only when not Assured (avoids overlap) */}
          {item?.isNew && !item?.reparvAssured && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>✦ NEW</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* CONTENT */}
        <View style={styles.bottom}>
          {/* Location row */}
          <View style={styles.propertyRow}>
            <Image source={Location} style={styles.icon} />
            <Text style={styles.propertyType} numberOfLines={1}>
              {item.location || item?.city}
            </Text>
          </View>

          {/* User GPS distance shown right below location */}
          <DistanceBadge
            userCoords={userCoords}
            locationLoading={locationLoading}
            item={item}
          />

          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.propertyName}
          </Text>

          <View style={styles.featuresPriceRow}>
            <View style={styles.featureRow}>
              <View style={styles.featureCircle}>
                <Building2 size={12} />
              </View>
              <Text style={styles.featureText}>{item?.propertyCategory}</Text>
            </View>
            <Text style={styles.price}>
              ₹{formatIndianAmount(item?.totalOfferPrice)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.ownerRow}>
            <View style={{flexDirection: 'row', gap: 4}}>
              {likeCounts[item.propertyid] > 0 && (
                <View style={styles.ownerLeft}>
                  <HeartIcon size={25} fill="#8A38F5" color="#8A38F5" />
                  <Text style={styles.visitorText}>
                    {likeCounts[item.propertyid] ?? 0}
                  </Text>
                </View>
              )}
              {item?.totalVisitors > 0 && (
                <View style={styles.ownerLeft}>
                  <Eye size={25} color="#7A2EFF" />
                  <Text style={styles.visitorText}>{item?.totalVisitors}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.showDetailsBtn}
              onPress={() =>
                navigation.navigate('PropertyDetails', {seoSlug: item?.seoSlug})
              }>
              <Text style={styles.showDetailsText}>Show Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  /* ── RENDER STATES ── */
  if (loading) {
    return (
      <View>
        <SectionHeader />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}>
          <RentSkeletonCard />
          <RentSkeletonCard />
          <RentSkeletonCard />
        </ScrollView>
      </View>
    );
  }

  if (!flats.length) {
    return (
      <View>
        <SectionHeader />
        <EmptyState
          onPopularAreas={() => navigation.navigate('LocationPickerScreen')}
          onExpandRadius={() =>
            navigation.navigate('PropertyListScreen', {listingGroup: 'rent'})
          }
        />
      </View>
    );
  }

  return (
    <View>
      <SectionHeader />
      <FlatList
        data={flats}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => String(item.propertyid)}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={5}
      />
    </View>
  );
}

/* ---------------------------------------
   STYLES
--------------------------------------- */
const styles = StyleSheet.create({
  listContent: {paddingHorizontal: 18, marginTop: 14},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 16,
    color: 'black',
  },
  titleText: {fontSize: 17, fontWeight: '700', color: 'black'},
  line: {width: '25%', height: 3, borderRadius: 1},

  // ── Skeleton ──
  skeletonImage: {width: '100%', height: 130, backgroundColor: '#E5E7EB'},
  skeletonLocation: {
    width: '70%',
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonTitle: {
    width: '90%',
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonFeature: {
    width: 100,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonPrice: {
    width: 60,
    height: 18,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonIcon: {
    width: 40,
    height: 25,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonButton: {
    width: 100,
    height: 32,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },

  // ── Empty State ──
  emptyWrapper: {paddingHorizontal: 20, marginBottom: 10},
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
    width: width * 0.65,
    backgroundColor: '#fff',
    borderRadius: 14,
    marginRight: 14,
    overflow: 'hidden',
  },
  imageContainer: {height: 130, backgroundColor: '#F3F3F3'},
  image: {width: '100%', height: '100%', resizeMode: 'cover'},

  // Top-left: REPARV Assured
  leftBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#8A38F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  // Top-right: HOT DEAL
  rightBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  // ✅ Bottom-left: NEW
  newBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  badgeText: {color: '#fff', fontSize: 10, fontWeight: '700'},
  bottom: {padding: 10, gap: 4},

  // Location row
  propertyRow: {flexDirection: 'row', alignItems: 'center'},
  icon: {width: 16, height: 16, marginRight: 4},
  propertyType: {fontSize: 11, color: '#000000', flex: 1},

  // ── Distance pill shown below location ──
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#F3EEFF',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  distanceText: {fontSize: 10, fontWeight: '600', color: '#7C3AED'},

  cardTitle: {fontSize: 12, fontWeight: '700', color: '#000'},
  featuresPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  featureRow: {flexDirection: 'row', alignItems: 'center'},
  featureCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F1F1F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  featureText: {fontSize: 11, color: '#000'},
  price: {fontSize: 12, fontWeight: '700'},
  divider: {height: 1, backgroundColor: '#E3E3E3', marginVertical: 4},
  ownerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ownerLeft: {flexDirection: 'row', alignItems: 'center', gap: 6},
  visitorText: {fontSize: 11, fontWeight: '600', color: '#444'},
  showDetailsBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#8A38F5',
    borderRadius: 8,
  },
  showDetailsText: {color: '#fff', fontSize: 14, fontWeight: '700'},
});
