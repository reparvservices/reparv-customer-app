import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Animated,
  Modal,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, AlertTriangle} from 'lucide-react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Svg, {Path} from 'react-native-svg';
import {useSelector} from 'react-redux';
import {ListingCard} from '../components/MyListing/ListingCard';
import CompleteListingModal, {
  getIncompleteProperties,
} from '../components/MyListing/CompleteListingModal';

const PURPLE = '#6C3EF0';
const BG = '#F5F5F5';

// ─── Shimmer animation hook ───────────────────────────────────────────────────
function useShimmer() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [anim]);
  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });
  return opacity;
}

// ─── Skeleton primitives ──────────────────────────────────────────────────────
function SkeletonBox({w, h, radius = 6, style}) {
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[
        {
          width: w,
          height: h,
          borderRadius: radius,
          backgroundColor: '#E0E0E0',
          opacity,
        },
        style,
      ]}
    />
  );
}

// ─── Stats bar skeleton ───────────────────────────────────────────────────────
function StatsBarSkeleton() {
  return (
    <View style={skStyles.statsBar}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={skStyles.statItem}>
          <SkeletonBox w={32} h={20} radius={4} />
          <SkeletonBox w={44} h={10} radius={4} style={{marginTop: 6}} />
        </View>
      ))}
    </View>
  );
}

// ─── Filter chips skeleton ────────────────────────────────────────────────────
function FilterChipsSkeleton() {
  return (
    <View style={skStyles.chipsRow}>
      {[64, 88, 72, 80].map((w, i) => (
        <SkeletonBox key={i} w={w} h={32} radius={20} />
      ))}
    </View>
  );
}

// ─── Listing card skeleton ────────────────────────────────────────────────────
function ListingCardSkeleton() {
  return (
    <View style={skStyles.card}>
      {/* Image placeholder */}
      <SkeletonBox w="100%" h={160} radius={12} />
      <View style={skStyles.cardBody}>
        {/* Title */}
        <SkeletonBox w="70%" h={14} radius={4} />
        {/* Subtitle */}
        <SkeletonBox w="50%" h={11} radius={4} style={{marginTop: 8}} />
        {/* Price + badge row */}
        <View style={skStyles.cardRow}>
          <SkeletonBox w={90} h={18} radius={4} />
          <SkeletonBox w={56} h={22} radius={20} />
        </View>
        {/* Stats row */}
        <View style={skStyles.cardRow}>
          <SkeletonBox w={44} h={11} radius={4} />
          <SkeletonBox w={44} h={11} radius={4} />
          <SkeletonBox w={44} h={11} radius={4} />
        </View>
      </View>
    </View>
  );
}

// ─── Enquiry card skeleton ────────────────────────────────────────────────────
function EnquiryCardSkeleton() {
  return (
    <View style={skStyles.enquiryCard}>
      <SkeletonBox w={44} h={44} radius={22} />
      <View style={{flex: 1, gap: 6}}>
        <SkeletonBox w="55%" h={13} radius={4} />
        <SkeletonBox w="75%" h={10} radius={4} />
        <SkeletonBox w="40%" h={10} radius={4} />
      </View>
      <SkeletonBox w={66} h={32} radius={20} />
    </View>
  );
}

// ─── Full page skeleton ───────────────────────────────────────────────────────
function MyListingsSkeleton() {
  return (
    <ScrollView
      scrollEnabled={false}
      contentContainerStyle={{paddingBottom: 40, backgroundColor: BG}}>
      <StatsBarSkeleton />
      {/* Banner placeholder */}
      <SkeletonBox
        w="auto"
        h={62}
        radius={14}
        style={{marginHorizontal: 16, marginTop: 16, marginBottom: 4}}
      />
      <FilterChipsSkeleton />
      <ListingCardSkeleton />
      <ListingCardSkeleton />
      {/* Enquiries heading */}
      <SkeletonBox
        w={160}
        h={18}
        radius={4}
        style={{marginHorizontal: 16, marginTop: 20, marginBottom: 12}}
      />
      <View style={skStyles.enquiriesBox}>
        <EnquiryCardSkeleton />
        <EnquiryCardSkeleton />
        <EnquiryCardSkeleton />
      </View>
    </ScrollView>
  );
}

// ─── Build dynamic category tabs from real data ───────────────────────────────
function buildCategoryTabs(properties) {
  if (!properties?.length) return [{key: 'all', label: 'All (0)'}];
  const categoryMap = {};
  properties.forEach(p => {
    const raw = (p.propertyCategory || p.propertyType || 'Other')
      .trim()
      .replace(/\b\w/g, c => c.toUpperCase());
    categoryMap[raw] = (categoryMap[raw] || 0) + 1;
  });
  return [
    {key: 'all', label: `All (${properties.length})`},
    ...Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        key: name.toLowerCase().replace(/\s+/g, '_'),
        label: `${name} (${count})`,
        categoryName: name,
      })),
  ];
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function MyListingsScreen() {
  const navigation = useNavigation();
  const auth = useSelector(state => state.auth);

  const [loading, setLoading] = useState(true);
  const [propertyData, setPropertyData] = useState([]);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [totalCalls, setTotalCalls] = useState(0);
  const [totalShares, setTotalShares] = useState(0);
  const [totalWhatsapp, setTotalWhatsapp] = useState(0);
  const [enquiries, setEnquiries] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchProperties();
      fetchWishlist();
      fetchEnquiries();
    }, []),
  );

  const fetchWishlist = async () => {
    try {
      await fetch(
        `https://aws-api.reparv.in/customerapp/property/get-wishlist/${auth?.user?.id}`,
      );
    } catch {}
  };

  const fetchProperties = async () => {
    try {
      if (!auth?.user?.id) return;
      setLoading(true);
      const res = await fetch(
        `https://aws-api.reparv.in/customerapp/property/myproperty/${auth.user.id}`,
      );
      const data = await res.json();
      const properties = Array.isArray(data) ? data : [];
      setPropertyData(properties);
      fetchAllVisitors(properties);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const fetchAllVisitors = async properties => {
    try {
      let visitors = 0,
        calls = 0,
        shares = 0,
        whatsapp = 0;
      await Promise.all(
        properties.map(async item => {
          try {
            const response = await fetch(
              `https://aws-api.reparv.in/customerapp/enquiry/getvisits?propertyid=${item.propertyid}`,
            );
            const data = await response.json();
            if (response.ok && data) {
              visitors += Number(data.totalVisitors || 0);
              calls += Number(data.calls || 0);
              shares += Number(data.share || 0);
              whatsapp += Number(data.whatsapp_enquiry || 0);
            }
          } catch {}
        }),
      );
      setTotalVisitors(visitors);
      setTotalCalls(calls);
      setTotalShares(shares);
      setTotalWhatsapp(whatsapp);
    } catch {}
  };

  const fetchEnquiries = async () => {
    try {
      if (!auth?.user?.id) return;
      const res = await fetch(
        `https://aws-api.reparv.in/customerapp/enquiry/getvisitors/${auth.user.id}`,
      );
      const data = await res.json();
      setEnquiries(Array.isArray(data) ? data : []);
    } catch {
      setEnquiries([]);
    }
  };

  const TABS = useMemo(() => buildCategoryTabs(propertyData), [propertyData]);

  const filteredProperties = useMemo(() => {
    if (activeTab === 'all') return propertyData;
    const tab = TABS.find(t => t.key === activeTab);
    if (!tab?.categoryName) return propertyData;
    return propertyData.filter(p => {
      const raw = (p.propertyCategory || p.propertyType || '')
        .trim()
        .replace(/\b\w/g, c => c.toUpperCase());
      return raw === tab.categoryName;
    });
  }, [propertyData, activeTab, TABS]);

  const incompleteProperties = useMemo(
    () => getIncompleteProperties(propertyData),
    [propertyData],
  );
  const hasIncomplete = incompleteProperties.length > 0;

  const statsData = [
    {label: 'Views', value: totalVisitors},
    {label: 'Calls', value: totalCalls},
    {label: 'Shares', value: totalShares},
    {label: 'WhatsApp', value: totalWhatsapp},
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header — always visible */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Listings</Text>
        <TouchableOpacity
          style={styles.headerAddBtn}
          onPress={() => setShowAddMenu(true)}>
          <Text style={styles.headerAddText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* ── Loading state: skeleton replaces everything below header ───── */}
      {loading ? (
        <MyListingsSkeleton />
      ) : (
        <>
          {/* Stats Tab Bar */}
          <View style={styles.statsTabBar}>
            {statsData.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.statsTabItem,
                  index === 0 && styles.statsTabItemActive,
                ]}>
                <Text
                  style={[
                    styles.statsTabValue,
                    index === 0 && styles.statsTabValueActive,
                  ]}>
                  {item.value}
                </Text>
                <Text
                  style={[
                    styles.statsTabLabel,
                    index === 0 && styles.statsTabLabelActive,
                  ]}>
                  {item.label}
                </Text>
                {index === 0 && <View style={styles.statsTabUnderline} />}
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}>
            {/* Banner */}
            {hasIncomplete && (
              <View style={styles.completeBanner}>
                <View style={styles.bannerIconWrap}>
                  <AlertTriangle size={20} color="#F97316" />
                </View>
                <View style={styles.bannerTextWrap}>
                  <Text style={styles.bannerText}>
                    Complete your listings to get more enquiries
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.bannerBtn}
                  onPress={() => setModalVisible(true)}>
                  <Text style={styles.bannerBtnText}>See How ›</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Dynamic category filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterRow}>
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.filterChip,
                    activeTab === tab.key && styles.filterChipActive,
                  ]}
                  onPress={() => setActiveTab(tab.key)}>
                  <Text
                    style={[
                      styles.filterChipText,
                      activeTab === tab.key && styles.filterChipTextActive,
                    ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Listing cards */}
            {filteredProperties.length > 0 ? (
              filteredProperties.map((d, index) => (
                <ListingCard key={d?.propertyid || index} propertyData={d} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No listings found</Text>
              </View>
            )}

            {/* Recent Enquiries */}
            <Text style={styles.sectionTitle}>Recent Enquiries</Text>
            <View style={styles.enquiriesContainer}>
              {enquiries.length === 0 ? (
                <View style={styles.noEnquiriesWrap}>
                  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      stroke="#D1D5DB"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M4.5 4.5l15 15"
                      stroke="#D1D5DB"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </Svg>
                  <Text style={styles.noEnquiriesText}>No enquiries yet</Text>
                </View>
              ) : (
                enquiries.map(item => (
                  <EnquiryCard key={item.enquirersid} item={item} />
                ))
              )}
            </View>
          </ScrollView>
        </>
      )}

      <CompleteListingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        properties={propertyData}
      />
      <Modal
        visible={showAddMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddMenu(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAddMenu(false)}>
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowAddMenu(false);
                navigation.navigate('OldProperty', {
                  listingType: 'sell',
                });
              }}>
              <Text style={styles.menuText}>Sell Property</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowAddMenu(false);
                navigation.navigate('OldProperty', {mode: 'add', type: 'rent'});
              }}>
              <Text style={styles.menuText}>Rent Property</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

/* ─── EnquiryCard ─────────────────────────────────────────────────────────── */
const EnquiryCard = ({item}) => (
  <View style={styles.enquiryCard}>
    <View style={styles.enquiryAvatar}>
      <Text style={styles.enquiryAvatarText}>
        {(item?.customer || 'U')[0].toUpperCase()}
      </Text>
    </View>
    <View style={{flex: 1, gap: 3}}>
      <Text style={styles.enqName}>{item.customer}</Text>
      <Text style={styles.enqSub}>Interested in: {item.propertyName}</Text>
      <Text style={styles.enqSub}>{item.city}</Text>
      <Text style={styles.enqSub}>{item.contact}</Text>
      <Text style={styles.enqTime}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
    <TouchableOpacity
      style={styles.replyBtn}
      onPress={() => Linking.openURL(`tel:${item?.contact}`)}>
      <Text style={styles.replyText}>Contact</Text>
    </TouchableOpacity>
  </View>
);

/* ─── Skeleton styles ─────────────────────────────────────────────────────── */
const skStyles = StyleSheet.create({
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  cardBody: {
    padding: 14,
    gap: 8,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  enquiriesBox: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  enquiryCard: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
});

/* ─── Main styles ─────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#fff'},

  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  headerTitle: {fontSize: 18, fontWeight: '700', color: '#111'},
  headerAddBtn: {
    width: 36,
    height: 36,
    backgroundColor: PURPLE,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAddText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 28,
  },

  statsTabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingHorizontal: 8,
  },
  statsTabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  statsTabItemActive: {},
  statsTabValue: {fontSize: 18, fontWeight: '700', color: '#333'},
  statsTabValueActive: {color: PURPLE},
  statsTabLabel: {fontSize: 11, color: '#9CA3AF', marginTop: 2},
  statsTabLabelActive: {color: '#9CA3AF'},
  statsTabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2.5,
    borderRadius: 2,
    backgroundColor: PURPLE,
  },

  container: {paddingBottom: 40, backgroundColor: BG},

  completeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFE4C8',
  },
  bannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0E0',
    borderWidth: 1,
    borderColor: '#FFD4A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextWrap: {flex: 1},
  bannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 19,
  },
  bannerBtn: {
    backgroundColor: '#F97316',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  bannerBtnText: {color: '#fff', fontWeight: '700', fontSize: 13},

  filterScroll: {marginTop: 12},
  filterRow: {paddingHorizontal: 16, gap: 8, paddingBottom: 4},
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {backgroundColor: '#EDE9FE', borderColor: '#DDD6FE'},
  filterChipText: {fontSize: 13, fontWeight: '500', color: '#6B7280'},
  filterChipTextActive: {color: PURPLE, fontWeight: '600'},

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
    marginHorizontal: 16,
    color: '#111',
  },

  emptyState: {alignItems: 'center', paddingVertical: 40},
  emptyText: {color: '#9CA3AF', fontSize: 14},

  enquiriesContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  noEnquiriesWrap: {alignItems: 'center', paddingVertical: 40, gap: 10},
  noEnquiriesText: {color: '#9CA3AF', fontSize: 14},

  enquiryCard: {
    backgroundColor: '#fff',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  enquiryAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enquiryAvatarText: {color: '#fff', fontWeight: '700', fontSize: 16},
  enqName: {fontSize: 14, fontWeight: '700', color: '#111111'},
  enqSub: {fontSize: 12, color: '#9CA3AF'},
  enqTime: {fontSize: 11, color: '#9CA3AF', marginTop: 2},
  replyBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  replyText: {color: '#fff', fontSize: 13, fontWeight: '600'},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },

  dropdownMenu: {
    position: 'absolute',
    top: 90,
    right: 16,
    width: 180,
    backgroundColor: '#FFF',
    borderRadius: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },

  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  menuText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },

  menuDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
});
