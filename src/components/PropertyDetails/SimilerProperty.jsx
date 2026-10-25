import React, {useEffect, useState, useRef} from 'react';
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
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import Location from '../../assets/image/home/rented-properties-card/location.png';
import {formatIndianAmount} from '../../utils/formatIndianAmount';
import {Building2, Eye, HeartIcon} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {checkSubscription} from '../home/RentPropertyCards';
import {fetchAllPropertiesCached} from '../../services/allPropertiesCache';
import {getImageUri} from '../../utils/imageHandle';

const {width} = Dimensions.get('window');
const IMAGE_BASE_URL = 'https://reparv-assets.s3.ap-south-1.amazonaws.com';
const CARD_WIDTH = width * 0.65;

// ── Shimmer bone ──────────────────────────────────────────────────────────────
function ShimmerBone({style}) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  return (
    <Animated.View
      style={[{backgroundColor: '#E0E0E0', borderRadius: 6, opacity}, style]}
    />
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={styles.card}>
      {/* Image placeholder */}
      <ShimmerBone style={{height: 130, borderRadius: 0}} />

      <View style={styles.bottom}>
        {/* Location row */}
        <ShimmerBone style={{width: '55%', height: 10, marginBottom: 6}} />

        {/* Title */}
        <ShimmerBone style={{width: '90%', height: 12, marginBottom: 4}} />
        <ShimmerBone style={{width: '70%', height: 12, marginBottom: 10}} />

        {/* Features + price row */}
        <View style={styles.featuresPriceRow}>
          <ShimmerBone style={{width: 80, height: 10}} />
          <ShimmerBone style={{width: 60, height: 10}} />
        </View>

        {/* Divider */}
        <ShimmerBone
          style={{
            width: '100%',
            height: 1,
            marginVertical: 10,
            borderRadius: 0,
          }}
        />

        {/* Owner row */}
        <View style={styles.ownerRow}>
          <View style={{flexDirection: 'row', gap: 8}}>
            <ShimmerBone style={{width: 28, height: 28, borderRadius: 14}} />
            <ShimmerBone style={{width: 28, height: 28, borderRadius: 14}} />
          </View>
          <ShimmerBone style={{width: 88, height: 30, borderRadius: 8}} />
        </View>
      </View>
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SimilerProperty({
  propertyid,
  filterType,
  city,
  budget,
}) {
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [likeCounts, setLikeCounts] = useState({});
  const navigation = useNavigation();

  useEffect(() => {
    fetchFlats();
  }, []);

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
          item.propertyid !== propertyid,
      );

      const userFilter = filtered.filter(
        item =>
          item.propertyCategory === filterType &&
          item.city === city &&
          item.totalOfferPrice <= budget,
      );

      const updated = await Promise.all(
        userFilter.map(async item => {
          const assured = item.partnerid
            ? await checkSubscription(item.partnerid)
            : false;
          const totalVisitors = await fetchVisits(item.propertyid);
          return {...item, reparvAssured: assured, totalVisitors};
        }),
      );

      setFlats(updated);
      fetchAllLikes(updated);
    } catch (error) {
      console.error('Error fetching properties:', error);
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

  const renderItem = ({item}) => (
    <View style={styles.card}>
      {/* IMAGE */}
      <View style={styles.imageContainer}>
        {item.frontView ? (
          <Image
            source={{uri: getImageUri(JSON.parse(item.frontView)[0])}}
            style={styles.image}
          />
        ) : (
          <View style={[styles.image, {backgroundColor: '#eee'}]} />
        )}
        {item?.hotDeal !== 'Inactive' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Recommended</Text>
          </View>
        )}
      </View>

      {/* CONTENT */}
      <View style={styles.bottom}>
        <View style={styles.propertyRow}>
          <Image source={Location} style={styles.icon} />
          <Text style={styles.propertyType}>
            {item.location} ({item.distanceFromCityCenter} KM)
          </Text>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.propertyName}
        </Text>

        <View style={styles.featuresPriceRow}>
          <View style={styles.featureRow}>
            <View style={styles.featureCircle}>
              <Building2 size={12} style={styles.featureIcon} />
            </View>
            <Text style={styles.featureText}>
              {item?.propertyCategory || ''}
            </Text>
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
                <HeartIcon size={25} fill={'#8A38F5'} color="#8A38F5" />
                <Text style={[styles.visitorText, {color: '#474747'}]}>
                  {likeCounts[item.propertyid] ?? 0}
                </Text>
              </View>
            )}
            {item?.totalVisitors > 0 && (
              <View style={styles.ownerLeft}>
                <Eye size={25} color="#7A2EFF" />
                <Text style={[styles.visitorText, {color: '#474747'}]}>
                  {item?.totalVisitors}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.showDetailsBtn}
            onPress={() =>
              navigation.navigate('SimilerPropertyDetailsScreen', {
                seoSlug: item?.seoSlug,
              })
            }>
            <Text style={styles.showDetailsText}>Show Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // ── Skeleton state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View
        style={{flexDirection: 'row', paddingHorizontal: 18, marginTop: 14}}>
        {[0, 1, 2].map(i => (
          <SkeletonCard key={i} />
        ))}
      </View>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (flats.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient
          colors={['#8A38F5', '#C9A7FF']}
          style={styles.emptyIcon}>
          <Text style={styles.emptyIconText}>🏠</Text>
        </LinearGradient>
        <Text style={styles.emptyTitle}>No Similar Properties Found</Text>
        <Text style={styles.emptySubtitle}>
          We couldn't find properties matching your selected criteria. Try
          adjusting the budget, city, or property type.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={flats}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={item => String(item.propertyid)}
      contentContainerStyle={{paddingHorizontal: 18, marginTop: 14}}
      renderItem={renderItem}
    />
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyIconText: {fontSize: 28, color: '#FFFFFF'},
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {fontSize: 13, color: '#868686', textAlign: 'center'},
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginRight: 14,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 130,
    width: '100%',
    backgroundColor: '#F3F3F3',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#8A38F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {color: '#FFFFFF', fontSize: 10, fontFamily: 'SegoeUI-Bold'},
  bottom: {padding: 10},
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  icon: {width: 16, height: 16, marginRight: 4},
  propertyType: {
    fontSize: 11,
    color: '#868686',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: 'SegoeUI-Bold',
    color: '#000000',
    marginTop: 2,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  featuresPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
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
  featureIcon: {width: 12, height: 12},
  featureText: {
    fontSize: 11,
    color: '#6F6F6F',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  price: {
    fontSize: 12,
    fontFamily: 'SegoeUI-Bold',
    color: '#000000',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E3E3E3',
    marginVertical: 8,
  },
  ownerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ownerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  visitorText: {fontSize: 13, fontWeight: '600'},
  showDetailsBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#8A38F5',
    borderRadius: 8,
  },
  showDetailsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
});
