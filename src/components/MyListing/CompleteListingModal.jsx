import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  X,
  CheckCircle,
  Circle,
  Camera,
  FileText,
  MapPin,
  IndianRupee,
  Phone,
  Tag,
  Home,
} from 'lucide-react-native';

const PURPLE = '#6C3EF0';
const {height: SCREEN_HEIGHT} = Dimensions.get('window');

// ─── Steps use ONLY fields confirmed from your API shape ─────────────────────
// Fields seen in code: propertytitle, propertyCategory, propertyType,
// city, propertyFor, listingType, propertyid, images/image/mainImage
const COMPLETION_STEPS = [
  {
    key: 'title',
    label: 'Property Title',
    desc: 'Add a clear, descriptive title',
    icon: FileText,
    // propertytitle is the actual field from myproperty API
    check: p => {
      const v = p?.propertytitle || p?.propertyTitle || p?.title || '';
      return v.trim().length > 0;
    },
  },
  {
    key: 'photos',
    label: 'Photos',
    desc: 'Upload at least 1 property photo',
    icon: Camera,
    // Accept any image field — mainImage, image, images array, propertyImages
    check: p => {
      if (Array.isArray(p?.images) && p.images.length > 0) return true;
      if (Array.isArray(p?.propertyImages) && p.propertyImages.length > 0)
        return true;
      if (p?.mainImage) return true;
      if (p?.image) return true;
      if (p?.thumbnail) return true;
      return false;
    },
  },
  {
    key: 'location',
    label: 'Location / City',
    desc: 'Add city or area details',
    icon: MapPin,
    // city is used in the screen already
    check: p => {
      const v = p?.city || p?.location || p?.area || p?.address || '';
      return v.trim().length > 0;
    },
  },
  {
    key: 'price',
    label: 'Price / Rent',
    desc: 'Set the expected price or rent amount',
    icon: IndianRupee,
    // Accept any numeric price/rent field
    check: p => {
      return !!(
        p?.price ||
        p?.rent ||
        p?.expectedPrice ||
        p?.expectedRent ||
        p?.totalPrice ||
        p?.amount ||
        p?.salePrice
      );
    },
  },
  {
    key: 'category',
    label: 'Property Category',
    desc: 'Select the correct property type',
    icon: Tag,
    // propertyCategory and propertyType both used in screen
    check: p => {
      const v = p?.propertyCategory || p?.propertyType || '';
      return v.trim().length > 0;
    },
  },
  {
    key: 'listing_type',
    label: 'Listing Type',
    desc: 'Specify if property is for Sale or Rent',
    icon: Home,
    // listingType and propertyFor both used in filter logic in the screen
    check: p => {
      const v = p?.listingType || p?.propertyFor || '';
      return v.trim().length > 0;
    },
  },
];

// ── Exported helpers ──────────────────────────────────────────────────────────

export function getCompletionPercent(property) {
  if (!property) return 0;
  const done = COMPLETION_STEPS.filter(s => s.check(property)).length;
  return Math.round((done / COMPLETION_STEPS.length) * 100);
}

// Returns only properties that are NOT at 100%
export function getIncompleteProperties(properties) {
  return (properties || []).filter(p => getCompletionPercent(p) < 100);
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export default function CompleteListingModal({visible, onClose, properties}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Compute per-step: how many properties have it done vs not
  const stepsSummary = COMPLETION_STEPS.map(step => {
    const doneProps = (properties || []).filter(p => step.check(p));
    const totalProps = (properties || []).length;
    const allDone = doneProps.length === totalProps;
    return {
      ...step,
      doneCount: doneProps.length,
      totalCount: totalProps,
      allDone,
    };
  });

  const incompleteSteps = stepsSummary.filter(s => !s.allDone);
  const totalSteps = COMPLETION_STEPS.length;
  const doneSteps = stepsSummary.filter(s => s.allDone).length;
  const overallPercent = Math.round((doneSteps / totalSteps) * 100);

  const barColor =
    overallPercent >= 80
      ? '#10B981'
      : overallPercent >= 50
      ? '#F97316'
      : '#EF4444';

  const incompleteCount = getIncompleteProperties(properties || []).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, {opacity: fadeAnim}]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[styles.sheet, {transform: [{translateY: slideAnim}]}]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>Complete Your Listings</Text>
            {/* <Text style={styles.sheetSubtitle}>
              {incompleteCount === 0
                ? 'All listings are complete'
                : `${incompleteCount} of ${(properties || []).length} ${
                    incompleteCount === 1 ? 'listing needs' : 'listings need'
                  } attention`}
            </Text> */}
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetScroll}>
          {/* ── Overall progress card ─────────────────────────────── */}
          <View style={styles.overallCard}>
            <View style={styles.overallRow}>
              <Text style={styles.overallLabel}>Overall completion</Text>
              <Text style={[styles.overallPercent, {color: barColor}]}>
                {overallPercent}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {width: `${overallPercent}%`, backgroundColor: barColor},
                ]}
              />
            </View>
            <Text style={styles.progressHint}>
              {doneSteps}/{totalSteps} fields complete across all listings
            </Text>
          </View>

          {/* ── Unified step checklist ────────────────────────────── */}
          {incompleteCount === 0 ? (
            <View style={styles.allDoneWrap}>
              <CheckCircle size={44} color="#10B981" />
              <Text style={styles.allDoneTitle}>
                All listings are complete!
              </Text>
              <Text style={styles.allDoneSub}>
                Your listings have all the info buyers need.
              </Text>
            </View>
          ) : (
            <View style={styles.stepsCard}>
              <Text style={styles.stepsCardTitle}>What's missing</Text>
              {stepsSummary.map((step, idx) => {
                const Icon = step.icon;
                const isLast = idx === stepsSummary.length - 1;
                return (
                  <View
                    key={step.key}
                    style={[styles.stepRow, !isLast && styles.stepRowBorder]}>
                    {/* Icon bubble */}
                    <View
                      style={[
                        styles.stepIconBubble,
                        step.allDone
                          ? styles.stepIconBubbleDone
                          : styles.stepIconBubblePending,
                      ]}>
                      {step.allDone ? (
                        <CheckCircle size={16} color="#10B981" />
                      ) : (
                        <Icon size={15} color={PURPLE} />
                      )}
                    </View>

                    {/* Text */}
                    <View style={styles.stepTextWrap}>
                      <Text
                        style={[
                          styles.stepLabel,
                          step.allDone && styles.stepLabelDone,
                        ]}>
                        {step.label}
                      </Text>
                      {!step.allDone && (
                        <Text style={styles.stepDesc}>{step.desc}</Text>
                      )}
                    </View>

                    {/* Right badge: shows how many properties done */}
                    <View
                      style={[
                        styles.stepBadge,
                        step.allDone
                          ? styles.stepBadgeDone
                          : styles.stepBadgePending,
                      ]}>
                      <Text
                        style={[
                          styles.stepBadgeText,
                          step.allDone
                            ? styles.stepBadgeTextDone
                            : styles.stepBadgeTextPending,
                        ]}>
                        {step.doneCount}/{step.totalCount}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Tips ─────────────────────────────────────────────── */}
          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>
              Why complete listings get more enquiries
            </Text>
            {[
              'Complete listings appear higher in search results',
              'Photos increase enquiries by up to 3×',
              'Accurate pricing attracts serious buyers',
              'Location details help buyers find your property',
            ].map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.88,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  sheetTitle: {fontSize: 17, fontWeight: '700', color: '#111'},
  sheetSubtitle: {fontSize: 12, color: '#9CA3AF', marginTop: 2},
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: {padding: 16, paddingBottom: 44, gap: 14},

  /* Overall progress card */
  overallCard: {
    backgroundColor: '#F9F8FF',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#DDD6FE',
    padding: 14,
  },
  overallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  overallLabel: {fontSize: 13, fontWeight: '600', color: '#374151'},
  overallPercent: {fontSize: 18, fontWeight: '700'},
  progressTrack: {
    height: 7,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {height: 7, borderRadius: 4},
  progressHint: {fontSize: 11, color: '#9CA3AF'},

  /* All done */
  allDoneWrap: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  allDoneTitle: {fontSize: 16, fontWeight: '700', color: '#111'},
  allDoneSub: {fontSize: 13, color: '#9CA3AF', textAlign: 'center'},

  /* Steps card — unified for all properties */
  stepsCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  stepsCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  stepRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  stepIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconBubbleDone: {backgroundColor: '#F0FDF4'},
  stepIconBubblePending: {backgroundColor: '#EDE9FE'},
  stepTextWrap: {flex: 1},
  stepLabel: {fontSize: 13, fontWeight: '600', color: '#111'},
  stepLabelDone: {color: '#9CA3AF', fontWeight: '500'},
  stepDesc: {fontSize: 11, color: '#9CA3AF', marginTop: 2},
  stepBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  stepBadgeDone: {backgroundColor: '#DCFCE7'},
  stepBadgePending: {backgroundColor: '#F3F4F6'},
  stepBadgeText: {fontSize: 11, fontWeight: '700'},
  stepBadgeTextDone: {color: '#16A34A'},
  stepBadgeTextPending: {color: '#6B7280'},

  /* Tips */
  tipsBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#BBF7D0',
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 10,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginTop: 6,
  },
  tipText: {flex: 1, fontSize: 12, color: '#047857', lineHeight: 18},
});
