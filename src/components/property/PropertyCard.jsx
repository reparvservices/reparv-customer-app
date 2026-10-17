import {useNavigation} from '@react-navigation/native';
import {Building2, Eye, Heart, HeartIcon, MapPin} from 'lucide-react-native';
import React, {useState, useEffect} from 'react';
import {API_BASE_URL} from '../../config/api';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ToastAndroid,
  Platform,
} from 'react-native';
import Svg, {Circle, ClipPath, Defs, G, Path, Rect} from 'react-native-svg';
import {useDispatch, useSelector} from 'react-redux';
import {AUTH_ACTION_TYPES, requireAuth} from '../../utils/authGuard';
import {formatIndianAmount} from '../../utils/formatIndianAmount';
import {getImageUri, parseFrontView} from '../../utils/imageHandle';

const {width} = Dimensions.get('window');
const IMAGE_BASE_URL = 'https://reparv-assets.s3.ap-south-1.amazonaws.com';

function PropertyCard({item, iswishList}) {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);
  const {user} = auth;
  const [isLiked, setIsLiked] = useState(false);
  const [reparvAssured, setReparvAssured] = useState(false); //  state for tag
  const [likeCount, setLikeCount] = useState(0);
  const [visitorCount, setVisitorCount] = useState(0);
  //  Check subscription if partnerid exists
  useEffect(() => {
    const checkSubscription = async () => {
      if (item.projectpartnerid) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/projectpartner/subscription/user/${item?.projectpartnerid}`,
          );
          const data = await res.json();
          if (data.active) {
            setReparvAssured(true);
          } else {
            setReparvAssured(false);
          }
        } catch (err) {
          console.error('Subscription check error:', err);
          setReparvAssured(false);
        }
      } else {
        setReparvAssured(false);
      }
    };

    checkSubscription();
  }, [item.projectpartnerid]);

  useEffect(() => {
    fetchLikeCount();
    fetchVisits(item?.propertyid);
  }, [item?.propertyid]);
  const handleLikePress = async () => {
    if (
      !requireAuth(navigation, dispatch, auth, {
        type: AUTH_ACTION_TYPES.WISHLIST,
        params: {
          seoSlug: item?.seoSlug,
          propertyid: item?.propertyid,
        },
      })
    ) {
      return;
    }
    setIsLiked(prev => !prev);
    try {
      const response = await fetch(
        `${API_BASE_URL}/customerapp/property/add-wishlist`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            user_id: user?.id || null,
            property_id: item?.propertyid,
          }),
        },
      );

      const data = await response.json();
      ToastAndroid.show(data?.message, ToastAndroid.SHORT);
    } catch (err) {
      ToastAndroid.show(
        'Error adding property to wishlist',
        ToastAndroid.SHORT,
      );
    }
  };

  /* ---------------------------------------
     FETCH VISITS
  --------------------------------------- */
  const fetchVisits = async propertyid => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/customerapp/enquiry/getvisits?propertyid=${propertyid}`,
      );
      const data = await res.json();
      setVisitorCount(data?.totalVisitors || 0);
    } catch (err) {
      setVisitorCount(0);
    }
  };

  const fetchLikeCount = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/customerapp/property/likes/${item.propertyid}`,
      );
      const data = await res.json();

      setLikeCount(data?.likeCount || 0);
    } catch {
      setLikeCount(0);
    }
  };

  return (
    <View style={styles.card}>
      {/* IMAGE */}
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('PropertyDetails', {
            seoSlug: item?.seoSlug,
          })
        }
        style={styles.imageWrapper}>
        {item.frontView ? (
          <Image
            source={{
              uri: getImageUri(parseFrontView(item?.frontView)[0]),
            }}
            style={styles.image}
          />
        ) : (
          <View style={[styles.image, {backgroundColor: '#EEE'}]} />
        )}

        {/*  Show REPARV Assured only if subscription active */}
        {reparvAssured && (
          <View style={styles.assuredTag}>
            <Text style={styles.assuredText}>REPARV Assured</Text>
          </View>
        )}
        {!iswishList && (
          <TouchableOpacity style={styles.heartBtn} onPress={handleLikePress}>
            <Heart
              size={20}
              color="#7A2EFF"
              fill={isLiked ? '#7A2EFF' : 'none'}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* BODY */}
      <View style={styles.cardBody}>
        <View style={styles.locationRow}>
          <MapPin size={14} color="#6B7280" />
          <Text style={styles.location}>
            {item?.location}, {item?.city}
          </Text>
        </View>

        <Text style={styles.title}>{item?.propertyName}</Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
          {/* Property Category Badge */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              height: 36,
              borderRadius: 22,
              backgroundColor: 'rgba(138, 56, 245, 0.1)',
            }}>
            <Building2
              width={16}
              height={16}
              color="#8A38F5"
              style={{marginRight: 6}}
            />
            <Text
              style={{
                fontFamily: 'SegoeUI-Bold',
                fontWeight: '700',
                fontSize: 12,
                ...Platform.select({
                  android: {
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                  },
                  default: {},
                }),

                letterSpacing: 0,
                color: '#8A38F5',
              }}>
              {item?.propertyCategory}
            </Text>
          </View>

          <View>
            <Text style={styles.priceOld}>
              ₹{formatIndianAmount(item?.totalSalesPrice)}
            </Text>
            <Text style={styles.priceNew}>
              ₹{formatIndianAmount(item?.totalOfferPrice)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={{gap: 10, flexDirection: 'row'}}>
            {likeCount > 0 && (
              <View style={styles.ownerLeft}>
                <HeartIcon size={25} fill={'#7A2EFF'} color="#7A2EFF" />
                <Text style={styles.visitorText}>{likeCount}</Text>
              </View>
            )}
            {visitorCount > 0 && (
              <View style={styles.ownerLeft}>
                <Eye size={25} color="#7A2EFF" />
                <Text style={styles.visitorText}>{visitorCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.detailsBtn}
            onPress={() =>
              navigation.navigate('PropertyDetails', {
                seoSlug: item?.seoSlug,
              })
            }>
            <Text style={styles.detailsText}>Show Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default React.memo(PropertyCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    marginBottom: 18,
    overflow: 'hidden',
    borderColor: 'gray',
    borderWidth: 0.5,
  },

  imageWrapper: {
    width: '100%',
    height: 200, // 🔽 reduced height
    backgroundColor: '#F3F4F6',
  },

  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },

  assuredTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#7A2EFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },

  assuredText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },

  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFF',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    // elevation: 3,
  },

  cardBody: {
    padding: 16,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  location: {
    fontSize: 13,
    color: '#6B7280',
  },

  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginVertical: 6,
  },

  infoText: {
    fontSize: 13,
    color: '#4B5563',
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },

  priceOld: {
    fontSize: 13,
    color: '#868686',
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
    textDecorationLine: 'line-through',
  },

  priceNew: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },

  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  ownerName: {
    fontSize: 13,
    // fontWeight: '700',
    color: '#868686',
  },

  ownerType: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  detailsBtn: {
    backgroundColor: '#7A2EFF',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },

  detailsText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    //
  },
  divider: {
    width: '100%', // responsive instead of fixed px
    height: 1,
    marginTop: 6,
    backgroundColor: '#D9D9D9',
    // marginVertical: 16, // spacing (adjust if needed)
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
  visitorText: {
    fontSize: 11,

    color: '#444',
  },
  chatBtn: {
    width: 34,
    height: 28,
    backgroundColor: '#8A38F5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
