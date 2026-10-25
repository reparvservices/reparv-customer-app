import React, {useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {BedDouble, Bath, Maximize2, MapPin, Heart} from 'lucide-react-native';
import {formatIndianAmount} from '../../utils/formatIndianAmount';
import {getImageUri, parseFrontView} from '../../utils/imageHandle';
import {useAllPropertiesCache} from '../../hooks/useAllPropertiesCache';

const {width} = Dimensions.get('window');
const CARD_W = width * 0.78;
const CARD_STRIDE = CARD_W + 14;

function formatBhkLabel(item) {
  const pt = item?.propertyType;
  if (Array.isArray(pt) && pt.length) {
    const first = pt.find(Boolean);
    if (first) {
      return first;
    }
  }
  if (typeof pt === 'string' && pt.trim()) {
    return pt;
  }
  return '—';
}

function formatArea(item) {
  const n = item?.builtUpArea || item?.carpetArea || item?.plotArea;
  if (n == null || n === '') {
    return '—';
  }
  const num = Number(n);
  if (Number.isNaN(num)) {
    return `${n} sqft`;
  }
  return `${num.toLocaleString('en-IN')} sqft`;
}

export default function HomePropertyCarousel({title, variant = 'sale'}) {
  const navigation = useNavigation();
  const {data, loading} = useAllPropertiesCache();

  const items = useMemo(() => {
    if (!data?.length) {
      return [];
    }
    return data
      .filter(
        i =>
          i.status === 'Active' &&
          i.approve === 'Approved' &&
          (variant === 'rent'
            ? i.propertyCategory?.startsWith('Rental')
            : !i.propertyCategory?.startsWith('Rental')),
      )
      .slice(0, 12);
  }, [data, variant]);

  const onSeeAll = useCallback(() => {
    navigation.navigate('PropertyListScreen');
  }, [navigation]);

  const renderCard = useCallback(
    ({item}) => {
      const paths = parseFrontView(item?.frontView);
      const uri = paths[0] ? getImageUri(paths[0]) : null;
      const price = item?.totalOfferPrice
        ? `₹${formatIndianAmount(item.totalOfferPrice)}`
        : '—';
      const priceLine = variant === 'rent' ? `${price}/mo` : price;
      const loc =
        [item?.location, item?.city].filter(Boolean).join(', ') || '—';

      return (
        <View style={styles.cardShell}>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.92}
            onPress={() =>
              navigation.navigate('PropertyDetails', {seoSlug: item?.seoSlug})
            }>
            <View style={styles.imageWrap}>
              {uri ? (
                <Image source={{uri}} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]} />
              )}
              <View
                style={[
                  styles.tag,
                  variant === 'rent' ? styles.tagRent : styles.tagBuy,
                ]}>
                <Text
                  style={[
                    styles.tagText,
                    variant === 'rent' ? styles.tagTextRent : styles.tagTextBuy,
                  ]}>
                  {variant === 'rent' ? 'For Rent' : 'Buy'}
                </Text>
              </View>
              <View style={styles.heartCircle}>
                <Heart size={18} color="#1a1a1a" strokeWidth={2} />
              </View>
            </View>

            <View style={styles.body}>
              <Text style={styles.price}>{priceLine}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {item?.propertyName || 'Property'}
              </Text>
              <View style={styles.locRow}>
                <MapPin size={14} color="#868686" style={styles.locPin} />
                <Text style={styles.loc} numberOfLines={1}>
                  {loc}
                </Text>
              </View>
              <View style={styles.specs}>
                <View style={styles.specItem}>
                  <BedDouble
                    size={14}
                    color="#6B7280"
                    style={styles.specIcon}
                  />
                  <Text style={styles.specText}>{formatBhkLabel(item)}</Text>
                </View>
                <View style={styles.specItem}>
                  <Bath size={14} color="#6B7280" style={styles.specIcon} />
                  <Text style={styles.specText}>—</Text>
                </View>
                <View style={styles.specItem}>
                  <Maximize2
                    size={14}
                    color="#6B7280"
                    style={styles.specIcon}
                  />
                  <Text style={styles.specText} numberOfLines={1}>
                    {formatArea(item)}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      );
    },
    [navigation, variant],
  );

  const keyExtractor = useCallback(
    (item, index) =>
      String(item.propertyid ?? item.seoSlug ?? `carousel-${index}`),
    [],
  );

  const getItemLayout = useCallback(
    (_, index) => ({
      length: CARD_STRIDE,
      offset: CARD_STRIDE * index,
      index,
    }),
    [],
  );

  if (loading && items.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.headRow}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <ActivityIndicator
          color="#6E56CF"
          style={styles.inlineLoader}
          size="small"
        />
      </View>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity onPress={onSeeAll} hitSlop={12}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.listPad}
        renderItem={renderCard}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={5}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
  },
  inlineLoader: {
    marginVertical: 24,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'SegoeUI-Bold',
    color: '#111827',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  seeAll: {
    fontSize: 15,
    fontFamily: 'SegoeUI-Bold',
    color: '#6E56CF',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  listPad: {
    paddingLeft: 20,
    paddingRight: 8,
    paddingBottom: 4,
  },
  cardShell: {
    width: CARD_W,
    marginRight: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...Platform.select({
      android: {elevation: 0},
      default: {},
    }),
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageWrap: {
    height: 168,
    backgroundColor: '#EEF0F4',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: '#E5E7EB',
  },
  tag: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagBuy: {
    backgroundColor: '#FFFFFF',
  },
  tagRent: {
    backgroundColor: '#DCFCE7',
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  tagTextBuy: {
    color: '#111827',
  },
  tagTextRent: {
    color: '#166534',
  },
  heartCircle: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...Platform.select({
      android: {elevation: 0},
      default: {},
    }),
  },
  body: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  price: {
    fontSize: 18,
    fontFamily: 'SegoeUI-Bold',
    color: '#111827',
    marginBottom: 4,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  name: {
    fontSize: 16,
    fontFamily: 'SegoeUI-Bold',
    color: '#111827',
    marginBottom: 6,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locPin: {
    marginRight: 4,
  },
  loc: {
    flex: 1,
    fontSize: 13,
    color: '#868686',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  specs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  specIcon: {
    marginRight: 4,
  },
  specText: {
    fontSize: 12,
    color: '#4B5563',
    flexShrink: 1,
  },
});
