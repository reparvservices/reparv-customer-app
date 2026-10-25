import React, {useEffect, useRef, useState} from 'react';
import {API_BASE_URL} from '../config/api';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
  Linking,
  ToastAndroid,
  Share,
  Alert,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import {Highlights} from '../components/PropertyDetails/Highlights';
import {Overview} from '../components/PropertyDetails/Overview';
import {Amenities} from '../components/PropertyDetails/Amenities';
import {Location} from '../components/PropertyDetails/Location';
import Svg, {Path} from 'react-native-svg';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Building2,
  Calendar,
  Car,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Cpu,
  Droplet,
  Heart,
  Home,
  IndianRupee,
  Layers,
  Leaf,
  MapPin,
  Phone,
  Share2,
  ShieldCheck,
  Tag,
  Trash2,
  Trees,
  TrendingUp,
  X,
  Zap,
  CalendarCheck,
} from 'lucide-react-native';
import {PropertyIntro} from '../components/PropertyDetails/PropertyIntro';
import {TypeWisePricing} from '../components/PropertyDetails/TypeWisePricing';
import {PropertyBrochure} from '../components/PropertyDetails/PropertyBrochure';
import {PropertyVideos} from '../components/PropertyDetails/PropertyVideos';
import {
  propertyContactOf,
  recordPropertyEnquiry,
  trackPropertyAction,
} from '../utils/propertyEnquiry';
import LinearGradient from 'react-native-linear-gradient';
import SimilerProperty from '../components/PropertyDetails/SimilerProperty';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {formatIndianAmount} from '../utils/formatIndianAmount';
import {AUTH_ACTION_TYPES, requireAuth} from '../utils/authGuard';
import PropertyUploadModal from '../components/property/PropertyBookModal';
import PriceSummaryDrawer from '../components/property/PriceSummaryDrawer';
import PropertyVideoModal from '../components/PropertyDetails/VideoModel';
import {SafeAreaView} from 'react-native-safe-area-context';
import {getImageUri, parseFrontView} from '../utils/imageHandle';
import PlotAvailabilityModal from './PlotAvailability';
import {formatDistance, useUserLocation} from '../hooks/userLocation';

// Listings store 'NA' / 'null' / 'No' when there is no RERA number
const hasReraNumber = value =>
  !['', 'null', 'undefined', 'na', 'n/a', 'no', 'none', '-'].includes(
    String(value ?? '').trim().toLowerCase(),
  );

const {width} = Dimensions.get('window');
const isTablet = width >= 768;
const TABS = ['Highlights', 'Overview', 'Amenities', 'About', 'Location'];
const BASE_URL = `${API_BASE_URL}/customerapp`;

const AVAILABILITY_CATEGORIES = [
  'NewPlot',
  'NewFlat',
  'CommercialPlot',
  'CommercialFlat',
  'RentalFlat',
  'RentalPlot',
];

// Categories whose availability comes from wings/flats (the rest use khasra/plots)
const FLAT_AVAILABILITY_CATEGORIES = ['NewFlat', 'CommercialFlat', 'RentalFlat'];

// ─────────────────────────────────────────────────────────────────────────────
// ALL IMAGE KEYS — every DB image column in display order
// Existing: frontView | sideView | hallView | kitchenView | bedroomView
//           bathroomView | balconyView | nearestLandmark | developedAmenities
//           extraImages
// New:      entranceView | roadView | parkingView | interiorView
//           warehouseArea | loadingArea | officeArea | cabinView
//           washroomView | displayArea | showroomInterior
//           farmGardenArea | terraceSitout
// ─────────────────────────────────────────────────────────────────────────────
const THUMBNAIL_CATEGORIES = [
  // ── existing ──
  {key: 'frontView', label: 'Front View'},
  {key: 'sideView', label: 'Side View'},
  {key: 'hallView', label: 'Hall'},
  {key: 'kitchenView', label: 'Kitchen'},
  {key: 'bedroomView', label: 'Bedroom'},
  {key: 'bathroomView', label: 'Bathroom'},
  {key: 'balconyView', label: 'Balcony'},
  {key: 'nearestLandmark', label: 'Landmark'},
  {key: 'developedAmenities', label: 'Amenities'},

  // ── new ──
  {key: 'entranceView', label: 'Entrance'},
  {key: 'roadView', label: 'Road View'},
  {key: 'parkingView', label: 'Parking'},
  {key: 'interiorView', label: 'Interior'},
  {key: 'warehouseArea', label: 'Warehouse'},
  {key: 'loadingArea', label: 'Loading Area'},
  {key: 'officeArea', label: 'Office Area'},
  {key: 'cabinView', label: 'Cabin / Meeting'},
  {key: 'washroomView', label: 'Washroom'},
  {key: 'displayArea', label: 'Display Area'},
  {key: 'showroomInterior', label: 'Showroom Interior'},
  {key: 'farmGardenArea', label: 'Farm / Garden'},
  {key: 'terraceSitout', label: 'Terrace / Sit-out'},

  // ── extra (JSON array) ──
  {key: 'extraImages', label: 'More Photos'},
];

// Flat list of all keys — used to build the combined hero image list
const ALL_CATEGORY_KEYS = THUMBNAIL_CATEGORIES.map(t => t.key);

// ─── HELPERS ──────────────────────────────────────────────────────────────────
/**
 * Parses a DB image column value into a string[].
 * Handles: JSON string, plain string, array, null/undefined.
 * extraImages is a JSON array; all others are also stored as JSON arrays
 * but may occasionally arrive as a plain URL string.
 */
const safeParseImages = raw => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      // plain URL string (legacy fallback)
      return raw.trim() ? [raw.trim()] : [];
    }
  }
  return [];
};

const safeTrim = str => (str ? str.trim() : '');

// ─── HAVERSINE DISTANCE ───────────────────────────────────────────────────────
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── SKELETON BOX ─────────────────────────────────────────────────────────────
const SkeletonBox = ({width: w, height: h, style = {}, borderRadius = 8}) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.85],
  });

  return (
    <Animated.View
      style={[
        {
          width: w,
          height: h,
          borderRadius,
          backgroundColor: '#D1C4E9',
          opacity,
        },
        style,
      ]}
    />
  );
};

// ─── SKELETON SCREEN ──────────────────────────────────────────────────────────
const PropertyDetailsSkeleton = () => (
  <SafeAreaView style={{flex: 1, backgroundColor: '#F7F7F7'}}>
    <SkeletonBox width={width} height={250} borderRadius={0} />
    <View style={{flexDirection: 'row', gap: 10, padding: 12, marginTop: 8}}>
      {[1, 2, 3].map(i => (
        <SkeletonBox key={i} width={120} height={62} borderRadius={14} />
      ))}
    </View>
    <View
      style={{
        backgroundColor: '#FFF',
        margin: 12,
        borderRadius: 20,
        padding: 16,
        gap: 14,
        elevation: 2,
      }}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <SkeletonBox width="60%" height={28} borderRadius={6} />
        <SkeletonBox width={110} height={48} borderRadius={12} />
      </View>
      <SkeletonBox width="50%" height={18} borderRadius={6} />
      <SkeletonBox width="70%" height={16} borderRadius={6} />
      <View style={{flexDirection: 'row', gap: 10}}>
        {[1, 2, 3].map(i => (
          <SkeletonBox
            key={i}
            width={(width - 68) / 3}
            height={80}
            borderRadius={14}
          />
        ))}
      </View>
      <SkeletonBox width="100%" height={140} borderRadius={18} />
      <SkeletonBox width="100%" height={68} borderRadius={14} />
      <SkeletonBox width="100%" height={68} borderRadius={14} />
    </View>
  </SafeAreaView>
);

// ─── ZOOM IMAGE MODAL ─────────────────────────────────────────────────────────
const ZoomImageModal = ({visible, images, initialIndex, onClose}) => {
  const [currentIdx, setCurrentIdx] = useState(initialIndex);
  const flatRef = useRef(null);
  const {width: w, height: h} = Dimensions.get('window');

  useEffect(() => {
    if (!visible || images.length === 0) return;
    setTimeout(() => {
      flatRef.current?.scrollToIndex({index: initialIndex, animated: false});
    }, 100);
    setCurrentIdx(initialIndex);
  }, [visible, initialIndex]);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={{flex: 1, backgroundColor: '#000'}}>
        <View style={zoomStyles.header}>
          <Text style={zoomStyles.counter}>
            {currentIdx + 1} / {images.length}
          </Text>
          <TouchableOpacity onPress={onClose} style={zoomStyles.closeBtn}>
            <Text style={zoomStyles.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          ref={flatRef}
          data={images}
          horizontal
          pagingEnabled
          keyExtractor={(_, i) => String(i)}
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({length: w, offset: w * index, index})}
          onMomentumScrollEnd={e => {
            setCurrentIdx(Math.round(e.nativeEvent.contentOffset.x / w));
          }}
          renderItem={({item}) => (
            <ScrollView
              style={{width: w, height: h}}
              contentContainerStyle={zoomStyles.scrollContent}
              maximumZoomScale={4}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              centerContent>
              <Image
                source={{uri: item.uri}}
                style={{width: w, height: h}}
                resizeMode="contain"
              />
            </ScrollView>
          )}
        />
      </View>
    </Modal>
  );
};

// ─── REMOVE WISHLIST MODAL ────────────────────────────────────────────────────
const RemoveWishlistModal = ({
  visible,
  onCancel,
  onConfirm,
  loading,
  propertyName,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 15,
          stiffness: 200,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={!loading ? onCancel : undefined}>
      <Animated.View style={[removeStyles.backdrop, {opacity: opacityAnim}]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={!loading ? onCancel : undefined}
        />
        <Animated.View
          style={[
            removeStyles.card,
            {transform: [{scale: scaleAnim}], opacity: opacityAnim},
          ]}>
          {!loading && (
            <TouchableOpacity style={removeStyles.closeBtn} onPress={onCancel}>
              <X size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          <View style={removeStyles.iconOuter}>
            <View style={removeStyles.iconInner}>
              <Heart size={30} color="#EF4444" fill="#EF4444" />
            </View>
          </View>
          <Text style={removeStyles.title}>Remove from Wishlist?</Text>
          <Text style={removeStyles.subtitle}>
            {propertyName
              ? `"${propertyName}" will be removed\nfrom your saved properties.`
              : 'This property will be removed\nfrom your saved properties.'}
          </Text>
          <View style={removeStyles.divider} />
          <View style={removeStyles.btnRow}>
            <TouchableOpacity
              activeOpacity={0.75}
              disabled={loading}
              onPress={onCancel}
              style={removeStyles.cancelBtn}>
              <Text style={removeStyles.cancelText}>Keep it</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={loading}
              onPress={onConfirm}
              style={[removeStyles.confirmBtn, loading && {opacity: 0.65}]}>
              {loading ? (
                <ActivityIndicator size={18} color="#FFF" />
              ) : (
                <>
                  <Trash2 size={15} color="#FFF" />
                  <Text style={removeStyles.confirmText}>Yes, Remove</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
const PropertyDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);
  const {token, user} = auth;
  const {seoSlug} = route.params || {};

  const [activeTab, setActiveTab] = useState('Highlights');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('frontView');
  const [propertyData, setPropertyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [open, setOpen] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [plotData, setPlotData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [videoModel, setVideoModel] = useState(false);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);

  const mainImageRef = useRef(null);
  const cardScrollRef = useRef(null);

  // ── Guard: seoSlug required ────────────────────────────────────────────────
  useEffect(() => {
    if (!seoSlug) navigation.goBack();
  }, [seoSlug]);

  // ── Fetch property data ────────────────────────────────────────────────────
  useEffect(() => {
    if (!seoSlug) return;
    const fetchPropertyData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/frontend/propertyinfo/${seoSlug}`,
        );
        const data = await response.json();
        setPropertyData(data);
      } catch (error) {
        console.error('Error fetching property data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPropertyData();
  }, [seoSlug]);

  // ── Check wishlist status ──────────────────────────────────────────────────
  useEffect(() => {
    if (!propertyData?.propertyid || !user?.id) return;
    const checkWishlist = async () => {
      try {
        const res = await fetch(`${BASE_URL}/property/get-wishlist/${user.id}`);
        const json = await res.json();
        const list = json?.data || [];
        setIsLiked(
          list.some(item => item?.propertyid === propertyData.propertyid),
        );
      } catch (err) {
        console.log('Wishlist check error:', err);
      }
    };
    checkWishlist();
  }, [propertyData?.propertyid, user?.id]);

  // ── Track visit ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!propertyData?.propertyid) return;
    fetch(`${API_BASE_URL}/customerapp/enquiry/addvisits`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({propertyid: propertyData.propertyid}),
    }).catch(err => console.log('Add visit error:', err));
  }, [propertyData?.propertyid]);

  // ── Reset images when slug changes ────────────────────────────────────────
  useEffect(() => {
    setSelectedImages([]);
    setActiveCategory('frontView');
    setCurrentIndex(0);
    cardScrollRef.current?.scrollTo({y: 0, animated: true});
  }, [seoSlug]);

  // ── Fetch plot / flat availability data ───────────────────────────────────
  useEffect(() => {
    if (!propertyData?.propertyid) return;
    const fetchPlotData = async () => {
      try {
        const isFlat = FLAT_AVAILABILITY_CATEGORIES.includes(
          propertyData?.propertyCategory,
        );
        const url = isFlat
          ? `${API_BASE_URL}/frontend/properties/additionalinfo/flat/get/all/${propertyData.propertyid}`
          : `${API_BASE_URL}/frontend/properties/additionalinfo/plot/get/all/${propertyData.propertyid}`;
        const response = await fetch(url);
        const json = await response.json();
        setPlotData(json);
      } catch (error) {
        console.error('Fetch Plot Data Error:', error);
      }
    };
    fetchPlotData();
  }, [propertyData?.propertyid]);

  // ── Live distance from user to property ───────────────────────────────────
  const {coords: userCoords, loading: userLocationLoading} = useUserLocation();
  let userDistance = null; // null = still locating
  if (propertyData) {
    const propLat = parseFloat(propertyData.latitude);
    const propLon = parseFloat(propertyData.longitude);
    if (!propertyData.latitude || !propertyData.longitude) {
      userDistance = 'unavailable';
    } else if (userCoords) {
      userDistance = formatDistance(
        haversineKm(userCoords.latitude, userCoords.longitude, propLat, propLon),
      );
    } else if (!userLocationLoading) {
      userDistance = 'unavailable';
    }
  }

  // ── Derived: build full hero image list from ALL columns ──────────────────
  // Only include keys that have images — order follows THUMBNAIL_CATEGORIES
  const allHeroImages = ALL_CATEGORY_KEYS.flatMap(key =>
    safeParseImages(propertyData?.[key]),
  );

  // When a thumbnail pill is tapped we store that section's images in
  // selectedImages; clearing it (empty array) reverts to showing all.
  const heroImages = selectedImages.length > 0 ? selectedImages : allHeroImages;
  const zoomImages = heroImages.map(img => ({uri: getImageUri(img)}));

  const savings =
    (propertyData?.totalSalesPrice || 0) - (propertyData?.totalOfferPrice || 0);

  const showAvailability = AVAILABILITY_CATEGORIES.includes(
    propertyData?.propertyCategory,
  );

  const isRental = [
    'RentalOffice',
    'RentalFlat',
    'RentalPlot',
    'RentalShop',
  ].includes(propertyData?.propertyCategory);

  // ── Share ─────────────────────────────────────────────────────────────────
  const buildShareText = data => {
    if (!data) return '';
    const price = data?.totalOfferPrice || data?.totalSalesPrice;
    const formattedPrice = price
      ? `₹${Number(price).toLocaleString('en-IN')}`
      : 'Price on Request';
    return (
      `🏡 *Property for Sale on Reparv*\n\n*${
        data?.propertyName || 'Premium Residential Property'
      }*\n\n` +
      `📍 *Location:* ${
        data?.location ? `${data.location}, ${data.city}` : 'N/A'
      }\n\n` +
      `💰 *Price:* ${formattedPrice}\n\n` +
      `🔗 https://www.reparv.in/property-info/${data?.seoSlug}`
    );
  };

  const onShareProperty = async () => {
    try {
      const result = await Share.share({message: buildShareText(propertyData)});
      if (result?.action === Share.sharedAction) {
        trackPropertyAction(propertyData?.propertyid, 'share');
      }
    } catch (error) {
      console.warn('Error sharing property', error);
    }
  };

  // ── WhatsApp enquiry ──────────────────────────────────────────────────────
  const sendHelloOnWhatsApp = async () => {
    if (
      !requireAuth(navigation, dispatch, auth, {
        type: AUTH_ACTION_TYPES.CONTACT_WHATSAPP,
        params: {seoSlug},
      })
    ) {
      return;
    }
    const phoneNumber = `91${propertyContactOf(propertyData)}`;
    recordPropertyEnquiry(propertyData, user, 'whatsapp');
    trackPropertyAction(propertyData?.propertyid, 'whatsapp');
    const message =
      `Hello,\n\nNew property enquiry:\n\n👤 *Client:* ${user?.fullname}\n` +
      `📞 *Contact:* ${user?.contact}\n🏠 *Property:* ${propertyData?.propertyCategory}\n` +
      `📍 ${propertyData?.address}, ${propertyData?.city}\n💰 ₹${propertyData?.totalOfferPrice}\n\n` +
      `https://www.reparv.in/property-info/${seoSlug}\n\nBest regards,\n*Reparv Team*`;
    try {
      await Linking.openURL(
        `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`,
      );
    } catch {
      Alert.alert('Error', 'WhatsApp not available');
    }
  };

  // ── Wishlist ──────────────────────────────────────────────────────────────
  const handleLikePress = async () => {
    if (
      !requireAuth(navigation, dispatch, auth, {
        type: AUTH_ACTION_TYPES.WISHLIST,
        params: {seoSlug, propertyid: propertyData?.propertyid},
      })
    ) {
      return;
    }
    if (isLiked) {
      setRemoveModalVisible(true);
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}/property/add-wishlist`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          user_id: user?.id,
          property_id: propertyData?.propertyid,
        }),
      });
      const data = await response.json();
      setIsLiked(true);
      ToastAndroid.show(`${data?.message}`, ToastAndroid.LONG);
    } catch {
      ToastAndroid.show('Error Adding Property in Wishlist', ToastAndroid.LONG);
    }
  };

  const confirmRemoveWishlist = async () => {
    if (!user?.id || !propertyData?.propertyid) return;
    setRemoving(true);
    try {
      const res = await fetch(
        `${BASE_URL}/property/remove-wishlist/${user.id}/${propertyData.propertyid}`,
        {method: 'DELETE'},
      );
      const json = await res.json();
      if (json?.success || res.ok) {
        setIsLiked(false);
        setRemoveModalVisible(false);
        ToastAndroid.show('Removed from Wishlist', ToastAndroid.SHORT);
      } else {
        ToastAndroid.show('Failed to remove. Try again.', ToastAndroid.SHORT);
      }
    } catch {
      ToastAndroid.show('Something went wrong.', ToastAndroid.SHORT);
    } finally {
      setRemoving(false);
    }
  };

  const cancelRemoveWishlist = () => {
    if (removing) return;
    setRemoveModalVisible(false);
  };

  // ── Prop shapes for tab components ────────────────────────────────────────
  const propertyFeatures = {
    plotType: propertyData?.propertyType,
    area:
      propertyData?.propertyCategory === 'FarmLand'
        ? propertyData?.builtUpArea
          ? `${propertyData.builtUpArea}`
          : '—'
        : '—',
    facing: propertyData?.propertyFacing,
    ...(propertyData?.propertyCategory !== 'FarmLand'
      ? {furnishingFeature: propertyData?.furnishing}
      : {}),
    status: 'Available',
    approval: safeTrim(propertyData?.propertyApprovedBy),
    ...(propertyData?.propertyCategory !== 'NewPlot' &&
    propertyData?.propertyCategory !== 'RentalPlot' &&
    propertyData?.propertyCategory !== 'FarmLand'
      ? {
          parking:
            propertyData?.parkingAvailabilit || propertyData?.parkingFeature,
        }
      : {}),
    water: propertyData?.waterSupply,
  };

  const propertyOverview = [
    {label: 'Property Category', value: propertyData?.propertyCategory},
    {label: 'Ownership Type', value: propertyData?.ownershipType},
    ...(propertyData?.propertyCategory !== 'NewPlot'
      ? [
          {label: 'Built Year', value: propertyData?.builtYear},
          {label: 'Total Floors', value: propertyData?.totalFloors},
          {label: 'Floor Number', value: propertyData?.floorNo},
        ]
      : []),
    {
      label: 'Carpet Area',
      value: propertyData?.carpetArea
        ? `${propertyData.carpetArea} Sq.ft`
        : '—',
    },
    {
      label: 'Built-up Area',
      value: propertyData?.builtUpArea
        ? propertyData?.propertyCategory === 'FarmLand'
          ? `${propertyData.builtUpArea}`
          : `${propertyData.builtUpArea} Sq.ft`
        : '—',
    },
    {label: 'Total Floors', value: propertyData?.totalFloors},
    {label: 'Floor Number', value: propertyData?.floorNo},
    {label: 'Power Backup', value: propertyData?.powerBackup},
    {label: 'RERA Registered', value: propertyData?.reraRegistered},
  ];

  const featuresData = [
    {key: 'Parking', value: propertyData?.parkingFeature, icon: Car},
    {key: 'Terrace', value: propertyData?.terraceFeature, icon: Trees},
    {key: 'Smart Home', value: propertyData?.smartHomeFeature, icon: Cpu},
    {
      key: 'Property Status',
      value: propertyData?.propertyStatusFeature,
      icon: Home,
    },
    {key: 'Total Floors', value: propertyData?.totalFloors, icon: Building2},
    {key: 'Built-up Area', value: propertyData?.builtUpArea, icon: Layers},
    {key: 'Water Supply', value: propertyData?.waterSupply, icon: Droplet},
    {key: 'Power Backup', value: propertyData?.powerBackup, icon: Zap},
  ];

  const benefitsData = [
    {key: 'Security', value: propertyData?.securityBenefit, icon: ShieldCheck},
    {
      key: 'Prime Location',
      value: propertyData?.primeLocationBenefit,
      icon: MapPin,
    },
    {
      key: 'Rental Income',
      value: propertyData?.rentalIncomeBenefit,
      icon: IndianRupee,
    },
    {
      key: 'Quality Construction',
      value: propertyData?.qualityBenefit,
      icon: Award,
    },
    {key: 'Eco Friendly', value: propertyData?.ecofriendlyBenefit, icon: Leaf},
    {
      key: 'Capital Appreciation',
      value: propertyData?.capitalAppreciationBenefit,
      icon: TrendingUp,
    },
  ];

  const property = {
    title: propertyData?.propertyName,
    location: `${propertyData?.city}, ${propertyData?.state}`,
    videoLink: propertyData?.videoLink,
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) return <PropertyDetailsSkeleton />;

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F7F7F7"
        translucent={false}
      />
      <View style={styles.container}>
        <ScrollView ref={cardScrollRef} showsVerticalScrollIndicator={false}>
          {/* ── HERO IMAGE SECTION ────────────────────────────────────────── */}
          <View style={styles.imageWrapper}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 18L9 12L15 6"
                  stroke="white"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            {heroImages.length > 0 ? (
              <ScrollView
                ref={mainImageRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={e =>
                  setCurrentIndex(
                    Math.round(e.nativeEvent.contentOffset.x / width),
                  )
                }>
                {heroImages.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.95}
                    onPress={() => {
                      setZoomIndex(index);
                      setZoomVisible(true);
                    }}>
                    <Image
                      source={{uri: getImageUri(item)}}
                      style={styles.heroImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <TouchableOpacity
                activeOpacity={0.95}
                onPress={() => {
                  setZoomIndex(0);
                  setZoomVisible(true);
                }}>
                <Image
                  source={{
                    uri: getImageUri(
                      parseFrontView(propertyData?.frontView)[0],
                    ),
                  }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}

            {heroImages.length > 1 && (
              <View style={styles.dotsRow}>
                {heroImages.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === currentIndex && styles.dotActive]}
                  />
                ))}
              </View>
            )}

            {heroImages.length > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.heroArrowBtn, styles.heroArrowLeft]}
                  onPress={() => {
                    const prevIdx = Math.max(currentIndex - 1, 0);
                    mainImageRef.current?.scrollTo({
                      x: prevIdx * width,
                      animated: true,
                    });
                    setCurrentIndex(prevIdx);
                  }}>
                  <ChevronLeft size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.heroArrowBtn, styles.heroArrowRight]}
                  onPress={() => {
                    const nextIdx = Math.min(
                      currentIndex + 1,
                      heroImages.length - 1,
                    );
                    mainImageRef.current?.scrollTo({
                      x: nextIdx * width,
                      animated: true,
                    });
                    setCurrentIndex(nextIdx);
                  }}>
                  <ChevronRight size={20} color="#fff" />
                </TouchableOpacity>
              </>
            )}

            {heroImages.length > 1 && (
              <View style={styles.counterPill}>
                <Text style={styles.counterText}>
                  {currentIndex + 1} / {heroImages.length}
                </Text>
              </View>
            )}

            <View style={styles.imageActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={handleLikePress}>
                <Heart
                  size={22}
                  color="#8A38F5"
                  fill={isLiked ? '#8A38F5' : 'none'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={onShareProperty}>
                <Share2 size={20} color="#8A38F5" />
              </TouchableOpacity>
            </View>

            {propertyData?.videoLink && (
              <TouchableOpacity
                style={styles.videoWrapper}
                activeOpacity={0.9}
                onPress={() => setVideoModel(true)}>
                <Image
                  source={{
                    uri: getImageUri(
                      parseFrontView(propertyData?.frontView)[0],
                    ),
                  }}
                  style={styles.videoPreview}
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(94,35,220,0.76)']}
                  locations={[0, 0.68]}
                  style={styles.videoGradient}
                />
                <View style={styles.playButton}>
                  <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <Path
                      d="M6.73188 12.9638C10.1738 12.9638 12.9638 10.1738 12.9638 6.73188C12.9638 3.29001 10.1738 0.5 6.73188 0.5C3.29001 0.5 0.5 3.29001 0.5 6.73188C0.5 10.1738 3.29001 12.9638 6.73188 12.9638Z"
                      stroke="white"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M5.48535 6.73197V4.57324L7.35492 5.6526L9.22448 6.73197L7.35492 7.81133L5.48535 8.89069V6.73197Z"
                      stroke="white"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <Text style={styles.videoLabel}>Property{'\n'}Video</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── THUMBNAIL PILLS ───────────────────────────────────────────── */}
          {/* Only renders pills for keys that actually have images */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={thumbStyles.scrollContent}>
            {THUMBNAIL_CATEGORIES.map(({key, label}) => {
              const imagesArray = safeParseImages(propertyData?.[key]);
              if (imagesArray.length === 0) return null;

              const isActive = activeCategory === key;

              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.85}
                  onPress={() => {
                    setActiveCategory(key);
                    // Find this section's first image in the combined hero list
                    const globalIdx = allHeroImages.findIndex(
                      img => img === imagesArray[0],
                    );
                    const targetIdx = globalIdx >= 0 ? globalIdx : 0;
                    setCurrentIndex(targetIdx);
                    mainImageRef.current?.scrollTo({
                      x: targetIdx * width,
                      animated: true,
                    });
                  }}
                  style={[
                    thumbStyles.pill,
                    isActive && thumbStyles.activePill,
                  ]}>
                  <Image
                    source={{uri: getImageUri(imagesArray[0])}}
                    style={[
                      thumbStyles.pillImage,
                      isActive && thumbStyles.activePillImage,
                    ]}
                  />
                  <Text
                    style={[
                      thumbStyles.pillText,
                      isActive && thumbStyles.activePillText,
                    ]}
                    numberOfLines={1}>
                    {label}
                  </Text>
                  {isActive && imagesArray.length > 1 && (
                    <View style={thumbStyles.countBadge}>
                      <Text style={thumbStyles.countBadgeText}>
                        {imagesArray.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── PROPERTY INFO CARD ────────────────────────────────────────── */}
          <View style={cardStyles.card}>
            {/* Title + Approval Badge */}
            <View style={cardStyles.titleRow}>
              <Text style={cardStyles.propertyName} numberOfLines={2}>
                {propertyData?.propertyName}
              </Text>
              {propertyData?.propertyApprovedBy ? (
                <View style={cardStyles.nmrdaBadge}>
                  <View style={cardStyles.nmrdaIconBox}>
                    <ClipboardList size={18} color="#6D28D9" strokeWidth={2} />
                  </View>
                  <View style={cardStyles.nmrdaTextCol}>
                    <Text style={cardStyles.nmrdaTopText}>
                      {safeTrim(propertyData.propertyApprovedBy) || 'NMRDA'}
                    </Text>
                    <Text style={cardStyles.nmrdaBottomText}>APPROVED</Text>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Project By */}
            {!!propertyData?.projectBy?.trim() && (
              <Text style={cardStyles.projectByText}>
                Project by{' '}
                <Text style={cardStyles.projectByName}>
                  {propertyData?.projectBy}
                </Text>
              </Text>
            )}

            {/* Available / Booked Pills */}
            {(propertyData?.availableCount > 0 ||
              propertyData?.bookedCount > 0) && (
              <View style={cardStyles.availabilityRow}>
                {propertyData?.availableCount > 0 && (
                  <View style={cardStyles.availablePill}>
                    <View style={cardStyles.greenDot} />
                    <Text style={cardStyles.availableText}>
                      {propertyData.availableCount} Available
                    </Text>
                  </View>
                )}
                {propertyData?.availableCount > 0 &&
                  propertyData?.bookedCount > 0 && (
                    <View style={cardStyles.pillDivider} />
                  )}
                <View style={cardStyles.bookedPill}>
                  <View style={cardStyles.redDot} />
                  <Text style={cardStyles.bookedText}>
                    {propertyData.bookedCount} Booked
                  </Text>
                </View>
              </View>
            )}

            {/* Location */}
            <View style={cardStyles.locationRow}>
              <MapPin size={14} color="#9CA3AF" />
              <Text style={cardStyles.locationText} numberOfLines={2}>
                {propertyData?.address ? `${propertyData.address}, ` : ''}
                {propertyData?.city}, {propertyData?.state} –{' '}
                {propertyData?.pincode}
              </Text>
            </View>

            {/* ── 3 FEATURE BOXES ─────────────────────────────────────────── */}
            <View style={cardStyles.featureBoxRow}>
              <View style={cardStyles.featureBox}>
                <View
                  style={[
                    cardStyles.featureIconCircle,
                    {backgroundColor: '#EEF2FF'},
                  ]}>
                  <ShieldCheck size={20} color="#6366F1" strokeWidth={2} />
                </View>
                <Text style={cardStyles.featureBoxText}>
                  {safeTrim(propertyData?.propertyApprovedBy) || ''}
                  {'\n'}Approved
                </Text>
              </View>

              <View style={cardStyles.featureBox}>
                <View
                  style={[
                    cardStyles.featureIconCircle,
                    {backgroundColor: '#FDF2F8'},
                  ]}>
                  <MapPin size={20} color="#C026D3" strokeWidth={2} />
                </View>
                {userDistance == null ? (
                  <View style={cardStyles.distanceLoadingRow}>
                    <ActivityIndicator size={12} color="#C026D3" />
                    <Text style={cardStyles.featureBoxTextSmall}>
                      {' '}
                      Locating…
                    </Text>
                  </View>
                ) : userDistance === 'unavailable' ? (
                  <Text style={[cardStyles.featureBoxText, {color: '#9CA3AF'}]}>
                    Distance{'\n'}
                    <Text style={cardStyles.featureBoxTextSub}>
                      Not Available
                    </Text>
                  </Text>
                ) : (
                  <Text style={cardStyles.featureBoxText}>
                    {userDistance}
                    {'\n'}
                    <Text style={cardStyles.featureBoxTextSub}>from You</Text>
                  </Text>
                )}
              </View>

              <View style={cardStyles.featureBox}>
                <View
                  style={[
                    cardStyles.featureIconCircle,
                    {backgroundColor: '#FFF1F2'},
                  ]}>
                  <BadgeCheck size={20} color="#E11D48" strokeWidth={2} />
                </View>
                <Text style={cardStyles.featureBoxText}>
                  Assured{'\n'}Quality
                </Text>
              </View>
            </View>

            {/* Price Card */}
            <LinearGradient
              colors={['#F9F7FF', '#FFFFFF']}
              start={{x: 0, y: 0}}
              end={{x: 0.97, y: 0.26}}
              style={cardStyles.priceCard}>
              <Text style={cardStyles.startingFromLabel}>STARTING FROM</Text>
              <View style={cardStyles.priceMainRow}>
                <Text style={cardStyles.offerPrice}>
                  ₹{formatIndianAmount(propertyData?.totalOfferPrice)}
                </Text>
                {savings > 0 && (
                  <View style={cardStyles.savingsPill}>
                    <Tag size={12} color="#059669" strokeWidth={2.5} />
                    <Text style={cardStyles.savingsText}>
                      Save ₹{formatIndianAmount(savings)}
                    </Text>
                  </View>
                )}
              </View>
              {propertyData?.totalSalesPrice &&
                propertyData.totalSalesPrice !==
                  propertyData?.totalOfferPrice && (
                  <Text style={cardStyles.strikePriceCard}>
                    ₹{formatIndianAmount(propertyData?.totalSalesPrice)}
                  </Text>
                )}
              <View style={cardStyles.priceDivider} />
              <View style={cardStyles.limitedRow}>
                <Clock size={14} color="#7C3AED" strokeWidth={2} />
                <Text style={cardStyles.limitedText}>Limited Time Offer</Text>
              </View>
            </LinearGradient>


            {/* Total Price Card */}
            <View style={cardStyles.totalCard}>
              <View style={cardStyles.serviceIconBox}>
                <Building2 size={20} color="#6D28D9" strokeWidth={2} />
              </View>
              <View style={cardStyles.serviceTextCol}>
                <Text style={cardStyles.serviceLabel}>Total Price</Text>
                <Text style={cardStyles.serviceAmount}>
                  ₹{formatIndianAmount(propertyData?.totalOfferPrice)}
                </Text>
                <Text style={cardStyles.otherCharges}>+ Other Charges</Text>
              </View>
              <TouchableOpacity
                style={[cardStyles.serviceBtn, cardStyles.serviceBtnWide]}
                activeOpacity={0.8}
                onPress={() => setShowDrawer(true)}>
                <Text style={cardStyles.serviceBtnText}>
                  View Full Cost{'\n'}Sheet
                </Text>
                <ArrowRight size={15} color="#6D28D9" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Trust Row */}
            <View style={cardStyles.trustRow}>
              <View style={cardStyles.trustItem}>
                <CheckCircle size={13} color="#9CA3AF" />
                <Text style={cardStyles.trustText}>
                  Transparent{'\n'}Pricing
                </Text>
              </View>
              <View style={cardStyles.trustDivider} />
              <View style={cardStyles.trustItem}>
                <X size={13} color="#9CA3AF" strokeWidth={2.5} />
                <Text style={cardStyles.trustText}>No Hidden{'\n'}Charges</Text>
              </View>
              {/* Only claim RERA when the listing has a RERA number */}
              {hasReraNumber(propertyData?.reraRegistered) && (
                <>
                  <View style={cardStyles.trustDivider} />
                  <View style={cardStyles.trustItem}>
                    <Building2 size={13} color="#9CA3AF" />
                    <Text style={cardStyles.trustText}>RERA{'\n'}Registered</Text>
                  </View>
                </>
              )}
            </View>

            {/* CTA Buttons */}
            <View style={ctaStyles.row}>
              <TouchableOpacity
                style={ctaStyles.callBtn}
                activeOpacity={0.8}
                onPress={() => {
                  if (
                    !requireAuth(navigation, dispatch, auth, {
                      type: AUTH_ACTION_TYPES.CONTACT_CALL,
                      params: {seoSlug},
                    })
                  ) {
                    return;
                  }
                  recordPropertyEnquiry(propertyData, user, 'call');
                  trackPropertyAction(propertyData?.propertyid, 'call');
                  Linking.openURL(`tel:+91${propertyContactOf(propertyData)}`);
                }}>
                <Phone size={18} color="#7C3AED" strokeWidth={2} />
                <Text style={ctaStyles.callBtnText}>Call Promoter</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={ctaStyles.whatsappBtn}
                activeOpacity={0.8}
                onPress={sendHelloOnWhatsApp}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                    fill="#25D366"
                  />
                </Svg>
                <Text style={ctaStyles.whatsappBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={ctaStyles.bookBtn}
              activeOpacity={0.85}
              onPress={() => {
                if (
                  !requireAuth(navigation, dispatch, auth, {
                    type: AUTH_ACTION_TYPES.BOOK_VISIT,
                    params: {seoSlug},
                  })
                ) {
                  return;
                }
                setOpen(true);
              }}>
              <Calendar size={20} color="#FFF" strokeWidth={2} />
              <Text style={ctaStyles.bookBtnText}>Book Site Visit</Text>
            </TouchableOpacity>

            {showAvailability &&
              (propertyData?.availableCount > 0 ||
                propertyData?.bookedCount > 0) && (
                <TouchableOpacity
                  style={ctaStyles.availabilityBtn}
                  activeOpacity={0.85}
                  onPress={() => setModalVisible(true)}>
                  <CalendarCheck size={20} color="#7C3AED" strokeWidth={2} />
                  <Text style={ctaStyles.availabilityBtnText}>
                    Check Availability
                  </Text>
                </TouchableOpacity>
              )}

            <Text style={ctaStyles.infoText}>
              Free site visit • No brokerage charges
            </Text>
          </View>

          {/* ── TYPE-WISE PRICING ─────────────────────────────────────────── */}
          <TypeWisePricing
            propertyId={propertyData?.propertyid}
            propertyCategory={propertyData?.propertyCategory}
            propertyType={propertyData?.propertyType}
          />

          {/* ── TABS ──────────────────────────────────────────────────────── */}
          <View style={styles.tabsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsRow}>
              {TABS.map(tab => {
                const isActive = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    activeOpacity={0.7}
                    style={styles.tabContainer}>
                    <Text
                      style={[
                        styles.tabText,
                        isActive && styles.activeTabText,
                      ]}>
                      {tab}
                    </Text>
                    {isActive && <View style={styles.activeIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── TAB CONTENT ───────────────────────────────────────────────── */}
          <View style={styles.tabContent}>
            {activeTab === 'Highlights' && (
              <Highlights
                propertyFeatures={propertyFeatures}
                propertyData={propertyData}
              />
            )}
            {activeTab === 'About' && (
              <PropertyIntro
                propertyDescription={propertyData?.propertyDescription}
              />
            )}
            {activeTab === 'Overview' && (
              <Overview propertyOverview={propertyOverview} />
            )}
            {activeTab === 'Amenities' && (
              <Amenities
                featuresData={featuresData}
                benefitsData={benefitsData}
              />
            )}
            {activeTab === 'Location' && (
              <Location
                latitude={propertyData?.latitude}
                longitude={propertyData?.longitude}
                address={propertyData?.address}
                landmark={`${propertyData?.city} , ${propertyData?.state}`}
                pincode={propertyData?.pincode}
              />
            )}
          </View>

          {/* ── BROCHURE & VIDEOS ─────────────────────────────────────────── */}
          <PropertyBrochure
            brochureFile={propertyData?.brochureFile}
            propertyName={propertyData?.propertyName}
          />
          <PropertyVideos
            propertyVideo={propertyData?.propertyVideo}
            videoLink={propertyData?.videoLink}
            instagramReelLink={propertyData?.instagramReelLink}
          />

          {/* ── SIMILAR PROPERTIES ────────────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={['#8A38F5', '#FAF8FF']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.line}
            />
            <Text style={styles.titleText}>Similar Properties</Text>
            <LinearGradient
              colors={['#FAF8FF', '#8A38F5']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.line}
            />
          </View>

          <SimilerProperty
            propertyid={propertyData?.propertyid}
            filterType={propertyData?.propertyCategory}
            city={propertyData?.city}
            budget={propertyData?.totalOfferPrice}
          />
        </ScrollView>

        {/* ── MODALS ────────────────────────────────────────────────────── */}
        <PropertyUploadModal
          visible={open}
          onClose={() => setOpen(false)}
          propertyid={propertyData?.propertyid}
          category={propertyData?.propertyCategory}
          user={user}
          token={token}
        />
        <PriceSummaryDrawer
          visible={showDrawer}
          onClose={() => setShowDrawer(false)}
          propertyData={propertyData}
          totalPrice={propertyData?.totalSalesPrice}
        />
        <PropertyVideoModal
          visible={videoModel}
          onClose={() => setVideoModel(false)}
          property={property}
          onBook={() => {
            setOpen(true);
            setVideoModel(false);
          }}
        />
      </View>

      <PlotAvailabilityModal
        seoSlug={propertyData?.seoSlug}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        apiData={plotData}
        onBook={() => setOpen(true)}
        propertyCategory={propertyData?.propertyCategory}
      />
      <ZoomImageModal
        visible={zoomVisible}
        images={zoomImages}
        initialIndex={zoomIndex}
        onClose={() => setZoomVisible(false)}
      />
      <RemoveWishlistModal
        visible={removeModalVisible}
        onCancel={cancelRemoveWishlist}
        onConfirm={confirmRemoveWishlist}
        loading={removing}
        propertyName={propertyData?.propertyName}
      />
    </SafeAreaView>
  );
};

export default PropertyDetailsScreen;

// ─── BASE STYLES ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: 'white'},
  container: {flex: 1, backgroundColor: 'white'},
  heroImage: {width, height: isTablet ? 360 : 250},
  imageWrapper: {position: 'relative'},
  backButton: {
    position: 'absolute',
    marginTop: 5,
    left: 15,
    zIndex: 10,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
  },
  imageActions: {
    position: 'absolute',
    marginTop: 5,
    right: 12,
    flexDirection: 'row',
    gap: 10,
  },
  heroArrowBtn: {
    position: 'absolute',
    top: '50%',
    transform: [{translateY: -20}],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heroArrowLeft: {left: 12},
  heroArrowRight: {right: 12},
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {width: 18, backgroundColor: '#8A38F5'},
  counterPill: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  counterText: {display: 'none'},
  tabsWrapper: {
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFF',
  },
  tabsRow: {paddingHorizontal: 12, flexDirection: 'row'},
  tabContainer: {marginRight: 24, alignItems: 'center'},
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    paddingVertical: 12,
  },
  activeTabText: {color: '#6C2BD9', fontWeight: '700'},
  activeIndicator: {
    height: 3,
    width: '100%',
    backgroundColor: '#6C2BD9',
    borderRadius: 2,
    marginTop: 2,
  },
  tabContent: {},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 16,
  },
  titleText: {fontSize: 17, fontWeight: '700', color: '#000000'},
  line: {width: '25%', height: 3, borderRadius: 1},
  videoWrapper: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 120,
    height: 69,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 6,
  },
  videoPreview: {width: '100%', height: '100%'},
  videoGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    borderRadius: 6,
  },
  playButton: {
    position: 'absolute',
    top: '15%',
    left: '45%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLabel: {
    position: 'absolute',
    bottom: 5,
    left: 36,
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

// ─── THUMBNAIL PILL STYLES ────────────────────────────────────────────────────
const thumbStyles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    paddingLeft: 7,
    paddingRight: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  activePill: {
    backgroundColor: '#8A38F5',
    borderColor: '#8A38F5',
    shadowColor: '#8A38F5',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  pillImage: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
  },
  activePillImage: {borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)'},
  pillText: {fontSize: 13, fontWeight: '600', color: '#374151', maxWidth: 88},
  activePillText: {color: '#FFFFFF'},
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countBadgeText: {color: '#FFF', fontSize: 11, fontWeight: '700'},
});

// ─── PROPERTY CARD STYLES ─────────────────────────────────────────────────────
const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  propertyName: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  nmrdaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 8,
    paddingHorizontal: 10,
    paddingLeft: 8,
    flexShrink: 0,
    minWidth: 112,
  },
  nmrdaIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nmrdaTextCol: {gap: 1},
  nmrdaTopText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.1,
  },
  nmrdaBottomText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.4,
  },
  projectByText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 10,
  },
  projectByName: {
    color: '#7C3AED',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  availablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  bookedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  pillDivider: {width: 1, height: 18, backgroundColor: '#E5E7EB'},
  greenDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E'},
  redDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444'},
  availableText: {fontSize: 13, fontWeight: '600', color: '#16A34A'},
  bookedText: {fontSize: 13, fontWeight: '600', color: '#DC2626'},
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 18,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 1,
  },
  featureBoxRow: {flexDirection: 'row', gap: 6, marginBottom: 16},
  featureBox: {
    flex: 1,
    backgroundColor: '#FAFAFF',
    borderRadius: 16,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    gap: 4,
    minHeight: 90,
    justifyContent: 'center',
  },
  featureIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBoxText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E1B4B',
    textAlign: 'center',
    lineHeight: 18,
  },
  featureBoxTextSub: {fontSize: 11, fontWeight: '500', color: '#6B7280'},
  featureBoxTextSmall: {fontSize: 11, fontWeight: '500', color: '#C026D3'},
  distanceLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  priceCard: {
    borderRadius: 18,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  startingFromLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  priceMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 6,
  },
  offerPrice: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
  },
  savingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDF4',
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 6,
  },
  savingsText: {fontSize: 13, fontWeight: '700', color: '#059669'},
  strikePriceCard: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    fontWeight: '500',
    marginBottom: 14,
  },
  priceDivider: {height: 1, backgroundColor: '#E5E7EB', marginBottom: 12},
  limitedRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  limitedText: {fontSize: 13, color: '#7C3AED', fontWeight: '600'},
  emiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  serviceIconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  serviceTextCol: {flex: 1},
  serviceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 3,
  },
  serviceAmount: {fontSize: 19, fontWeight: '800', color: '#0F172A'},
  serviceUnit: {fontSize: 13, fontWeight: '500', color: '#9CA3AF'},
  otherCharges: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '400',
    marginTop: 2,
  },
  serviceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexShrink: 0,
  },
  serviceBtnWide: {paddingHorizontal: 14},
  serviceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
    textAlign: 'center',
    lineHeight: 18,
  },
  trustRow: {
    backgroundColor: '#F6F8F7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderRadius: 12,
    borderTopColor: '#F3F4F6',
    marginBottom: 16,
  },
  trustItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  trustText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    lineHeight: 16,
  },
  trustDivider: {width: 1, height: 28, backgroundColor: '#E5E7EB'},
});

// ─── CTA STYLES ───────────────────────────────────────────────────────────────
const ctaStyles = StyleSheet.create({
  row: {flexDirection: 'row', gap: 12, marginBottom: 14},
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
    backgroundColor: '#FAFAFF',
  },
  callBtnText: {fontSize: 14, fontWeight: '700', color: '#7C3AED'},
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FFF4',
  },
  whatsappBtnText: {fontSize: 14, fontWeight: '700', color: '#16A34A'},
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    height: 54,
    borderRadius: 16,
    backgroundColor: '#8A38F5',
    shadowColor: '#8A38F5',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 12,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  availabilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
    marginBottom: 12,
  },
  availabilityBtnText: {
    color: '#7C3AED',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 10,
  },
});

// ─── ZOOM STYLES ──────────────────────────────────────────────────────────────
const zoomStyles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  counter: {color: '#fff', fontSize: 15, fontWeight: '600'},
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: {color: '#fff', fontSize: 18, fontWeight: '700'},
  scrollContent: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── REMOVE WISHLIST STYLES ───────────────────────────────────────────────────
const removeStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 26,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 36,
    paddingBottom: 26,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 7,
    borderRadius: 99,
    backgroundColor: '#F3F4F6',
  },
  iconOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 6,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 22,
  },
  btnRow: {flexDirection: 'row', gap: 12, width: '100%'},
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  cancelText: {fontSize: 15, fontWeight: '600', color: '#374151'},
  confirmBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    shadowColor: '#EF4444',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmText: {fontSize: 15, fontWeight: '700', color: '#FFF'},
});
