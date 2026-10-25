// PropertyReviewScreen.jsx
// Usage in navigator:
//   <Stack.Screen name="PropertyReview" component={PropertyReviewScreen} />
// Navigate to it:
//   navigation.navigate('PropertyReview', { property: propertyObject })

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Linking,
  ToastAndroid,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import {
  X,
  Trash2,
  Headphones,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  XCircle,
  ArrowLeft,
} from 'lucide-react-native';
import Svg, {Path, Circle} from 'react-native-svg';
import {useNavigation, useRoute} from '@react-navigation/native';
import {getCompletionInfo} from './ListingCard';

const PURPLE = '#6C3EF0';

/* ─────────────────────────────────────────
   KEY FIELDS
───────────────────────────────────────── */
const KEY_FIELDS = [
  {
    key: 'propertyType',
    label: 'Property Basic',
    desc: 'Add property details and specifications.',
    iconBg: '#EFF6FF',
    iconColor: '#3B82F6',
    iconEl: color => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
  {
    key: 'propertyDetails',
    label: 'Property Details',
    desc: 'Add features like corner plot, park facing etc.',
    iconBg: '#ECFDF5',
    iconColor: '#10B981',
    iconEl: color => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 17l4-8 4 4 4-6 4 10H3z"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
  {
    key: 'amenitiesFeature',
    label: 'Amenities',
    desc: 'Add amenities like lift, power backup, security etc.',
    iconBg: '#FFF7E6',
    iconColor: '#F59E0B',
    iconEl: color => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 6h18M3 12h18M3 18h18"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Path
          d="M8 6V4M12 6V4M16 6V4"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    ),
  },

  {
    key: 'photoUrls',
    label: 'Photos',
    desc: 'Add photos of the property from different angles.',
    iconBg: '#F5F3FF',
    iconColor: '#7C3AED',
    iconEl: color => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
        <Path
          d="M12 7l1.5 4.5L18 13l-4.5 1.5L12 19l-1.5-4.5L6 13l4.5-1.5L12 7z"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
];

/* ─────────────────────────────────────────
   REVIEW STEP (timeline)
───────────────────────────────────────── */
const ReviewStep = ({number, title, desc, done, active, last}) => (
  <View style={rss.row}>
    <View style={rss.leftCol}>
      <View
        style={[
          rss.circle,
          done && rss.circleDone,
          active && rss.circleActive,
        ]}>
        {done ? (
          <CheckCircle2 size={13} color="#fff" />
        ) : (
          <Text style={[rss.num, active && {color: '#fff'}]}>{number}</Text>
        )}
      </View>
      {!last && <View style={[rss.line, done && rss.lineDone]} />}
    </View>
    <View style={rss.textCol}>
      <Text style={[rss.title, active && {color: '#D97706'}]}>{title}</Text>
      <Text style={rss.desc}>{desc}</Text>
    </View>
  </View>
);

const rss = StyleSheet.create({
  row: {flexDirection: 'row', marginBottom: 4},
  leftCol: {alignItems: 'center', marginRight: 12, width: 28},
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: {backgroundColor: '#22C55E', borderColor: '#22C55E'},
  circleActive: {backgroundColor: '#D97706', borderColor: '#D97706'},
  num: {fontSize: 12, fontWeight: '600', color: '#6B7280'},
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 3,
    minHeight: 24,
  },
  lineDone: {backgroundColor: '#22C55E'},
  textCol: {flex: 1, paddingBottom: 20},
  title: {fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 2},
  desc: {fontSize: 12, color: '#9CA3AF'},
});

/* ─────────────────────────────────────────
   CIRCULAR PROGRESS
───────────────────────────────────────── */
const CircularProgress = ({percentage}) => {
  const r = 36,
    sw = 7,
    circ = 2 * Math.PI * r;
  const offset = circ - (circ * percentage) / 100;
  return (
    <View style={{justifyContent: 'center', alignItems: 'center'}}>
      <Svg width={86} height={86}>
        <Circle
          cx="43"
          cy="43"
          r={r}
          stroke="#E5E7EB"
          strokeWidth={sw}
          fill="none"
        />
        <Circle
          cx="43"
          cy="43"
          r={r}
          stroke={PURPLE}
          strokeWidth={sw}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin="43,43"
        />
      </Svg>
      <View style={{position: 'absolute', alignItems: 'center'}}>
        <Text style={{fontSize: 20, fontWeight: '800', color: PURPLE}}>
          {percentage}%
        </Text>
        <Text style={{fontSize: 10, color: '#6B7280'}}>Complete</Text>
      </View>
    </View>
  );
};

/* ═══════════════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════════════ */
const PropertyReviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const property = route.params?.property;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ── Completion info ── */
  const {percent: completionPercent} = getCompletionInfo(property) || {
    percent: 0,
  };

  const isApproved = property?.approve === 'Approved';
  const isNotApproved = property?.approve === 'Not Approved';
  const isPending = !isApproved && !isNotApproved;
  const showCompleteSection = completionPercent < 90;

  const missingKeyFields = KEY_FIELDS.filter(kf => {
    const val = property?.[kf.key];
    if (val === null || val === undefined) return true;
    if (Array.isArray(val)) return val.length === 0;
    if (typeof val === 'string') {
      const t = val.trim();
      return t === '' || t === 'null' || t === '[]' || t === '{}';
    }
    return false;
  });

  const displayFields = KEY_FIELDS.map(kf => ({
    ...kf,
    isFilled: !missingKeyFields.find(m => m.key === kf.key),
  }));

  const missingFields = displayFields.filter(f => !f.isFilled);
  const completedFields = displayFields.filter(f => f.isFilled);

  /* ── Navigate to edit step ── */
  const goToStep = key => {
    navigation.navigate('RentOldNewProperty', {
      mode: 'edit',
      step:
        key === 'propertyType'
          ? 1
          : key === 'propertyDetails'
          ? 2
          : key === 'amenitiesFeature'
          ? 3
          : 4,
      propertyData: property,
      focusField: key,
    });
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(
        `https://aws-api.reparv.in/customerapp/property/delete/${property.propertyid}`,
        {method: 'DELETE'},
      );
      const data = await res.json();
      if (res.ok) {
        setShowDeleteModal(false);
        ToastAndroid.show('Property deleted successfully!', ToastAndroid.SHORT);
        navigation.goBack();
      } else {
        ToastAndroid.show(
          'Delete failed: ' + (data.message || 'Unknown error'),
          ToastAndroid.SHORT,
        );
      }
    } catch {
      ToastAndroid.show('Something went wrong', ToastAndroid.SHORT);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Top Bar ── */}
      <View style={s.topBar}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <ArrowLeft size={22} color="#111" />
        </TouchableOpacity>
        <Text style={s.topTitle}>
          {isApproved && showCompleteSection
            ? 'Complete Your Listing'
            : isApproved
            ? 'Property Status'
            : 'Property Review Status'}
        </Text>
        <View style={{width: 38}} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.scroll}>
        {/* ══════════════════════════════════════
            PENDING STATE
        ══════════════════════════════════════ */}
        {isPending && (
          <>
            {/* Banner */}
            <View style={s.rejectedBanner}>
              <View style={s.rejectedIconCircle}>
                <XCircle size={32} color="#DC2626" />
              </View>
              <Text style={s.rejectedTitle}>Property Not Approved</Text>
              <Text style={s.rejectedMessage}>
                Unfortunately, your property listing could not be approved at
                this time. Please review the details, make the necessary
                corrections, and submit again for review.
              </Text>
            </View>

            {/* Timeline */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Review Timeline</Text>
              <ReviewStep
                number={1}
                title="Submitted"
                desc="Your listing was successfully submitted"
                done
              />
              <ReviewStep
                number={2}
                title="Reviewed"
                desc="Reparv team completed the review"
                done
              />
              <ReviewStep
                number={3}
                title="Rejected"
                desc="Changes are required before approval"
                active
                last
              />
            </View>

            {/* Reasons */}
            <View style={s.reasonCard}>
              <Text style={s.reasonTitle}>Possible Reasons</Text>
              {[
                'Incomplete property information',
                'Missing or unclear property images',
                'Incorrect pricing or property details',
                'Listing does not meet platform guidelines',
              ].map(r => (
                <Text key={r} style={s.reasonItem}>
                  • {r}
                </Text>
              ))}
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={s.resubmitBtn}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('RentOldNewProperty', {
                  mode: 'edit',
                  propertyData: property,
                })
              }>
              <Text style={s.resubmitBtnText}>Update & Resubmit</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ══════════════════════════════════════
            APPROVED STATE
        ══════════════════════════════════════ */}
        {isApproved && (
          <>
            {/* Approved banner */}
            <View style={s.approvedBanner}>
              <View style={s.approvedIconCircle}>
                <CheckCircle2 size={32} color="#16A34A" />
              </View>
              <Text style={s.approvedTitle}>Property Approved!</Text>
              <Text style={s.approvedMessage}>
                Your property has been submitted successfully.{'\n'}
                It is now live and visible to buyers.
              </Text>
            </View>

            {/* Complete section if < 90% */}
            {showCompleteSection && (
              <>
                {/* Progress card */}
                <View style={s.progressCard}>
                  <View style={{width: 86, height: 86, flexShrink: 0}}>
                    <CircularProgress percentage={completionPercent} />
                  </View>
                  <View style={s.progressRight}>
                    <Text style={s.progressTitle} numberOfLines={2}>
                      Listing Progress
                    </Text>
                    <Text style={s.progressSub} numberOfLines={2}>
                      {completedFields.length} of {KEY_FIELDS.length} sections
                      completed
                    </Text>
                    <View style={s.progressTrack}>
                      <View
                        style={[
                          s.progressFill,
                          {width: `${completionPercent}%`},
                        ]}
                      />
                    </View>
                  </View>
                </View>

                {/* Required fields */}
                {missingFields.length > 0 && (
                  <>
                    <Text style={s.sectionHeader}>
                      Required to Get Approved ({missingFields.length})
                    </Text>
                    {missingFields.map(f => (
                      <TouchableOpacity
                        key={f.key}
                        style={s.fieldCard}
                        activeOpacity={0.75}
                        onPress={() => goToStep(f.key)}>
                        <View style={[s.iconBox, {backgroundColor: f.iconBg}]}>
                          {f.iconEl(f.iconColor)}
                        </View>
                        <View style={s.fieldText}>
                          <Text style={s.fieldLabel}>{f.label}</Text>
                          <Text style={s.fieldDesc}>
                            + {f.desc.replace(/^\+\s*/, '')}
                          </Text>
                        </View>
                        <View style={s.requiredBadge}>
                          <Text style={s.requiredText}>Required</Text>
                        </View>
                        <ChevronRight
                          size={18}
                          color="#9CA3AF"
                          style={{marginLeft: 4}}
                        />
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {/* Completed fields */}
                {completedFields.length > 0 && (
                  <>
                    <Text style={s.sectionHeader}>
                      Completed ({completedFields.length})
                    </Text>
                    {completedFields.map(f => (
                      <TouchableOpacity
                        key={f.key}
                        style={s.fieldCardDone}
                        activeOpacity={0.75}
                        onPress={() => goToStep(f.key)}>
                        <View style={[s.iconBox, {backgroundColor: f.iconBg}]}>
                          {f.iconEl(f.iconColor)}
                        </View>
                        <View style={s.fieldText}>
                          <Text style={s.fieldLabel}>{f.label}</Text>
                          <Text style={s.fieldDesc}>{f.desc}</Text>
                        </View>
                        <View style={s.doneCircle}>
                          <CheckCircle2 size={20} color="#fff" fill="#22C55E" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {/* CTA */}
                <TouchableOpacity
                  style={s.ctaBtn}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate('RentOldNewProperty', {
                      mode: 'edit',
                      propertyData: property,
                    })
                  }>
                  <Text style={s.ctaText}>Complete Next Step →</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* ══════════════════════════════════════
            NOT APPROVED STATE
        ══════════════════════════════════════ */}
        {isNotApproved && (
          <>
            {/* Not Approved banner */}
            <View style={s.notApprovedBanner}>
              <View style={s.notApprovedIconCircle}>
                <AlertTriangle size={32} color="#fff" />
              </View>
              <Text style={s.notApprovedTitle}>Not Approved</Text>
              <Text style={s.notApprovedMessage}>
                Complete the missing details to get your listing approved.
              </Text>
            </View>

            {showCompleteSection && (
              <>
                {/* Progress card */}
                <View style={s.progressCard}>
                  <View style={{width: 86, height: 86, flexShrink: 0}}>
                    <CircularProgress percentage={completionPercent} />
                  </View>
                  <View style={s.progressRight}>
                    <Text style={s.progressTitle} numberOfLines={2}>
                      Listing Progress
                    </Text>
                    <Text style={s.progressSub} numberOfLines={2}>
                      {completedFields.length} of {KEY_FIELDS.length} sections
                      completed
                    </Text>
                    <View style={s.progressTrack}>
                      <View
                        style={[
                          s.progressFill,
                          {width: `${completionPercent}%`},
                        ]}
                      />
                    </View>
                  </View>
                </View>

                {/* Required fields */}
                {missingFields.length > 0 && (
                  <>
                    <Text style={s.sectionHeader}>
                      Required to Get Approved ({missingFields.length})
                    </Text>
                    {missingFields.map(f => (
                      <TouchableOpacity
                        key={f.key}
                        style={s.fieldCard}
                        activeOpacity={0.75}
                        onPress={() => goToStep(f.key)}>
                        <View style={[s.iconBox, {backgroundColor: f.iconBg}]}>
                          {f.iconEl(f.iconColor)}
                        </View>
                        <View style={s.fieldText}>
                          <Text style={s.fieldLabel}>{f.label}</Text>
                          <Text style={s.fieldDesc}>
                            + {f.desc.replace(/^\+\s*/, '')}
                          </Text>
                        </View>
                        <View style={s.requiredBadge}>
                          <Text style={s.requiredText}>Required</Text>
                        </View>
                        <ChevronRight
                          size={18}
                          color="#9CA3AF"
                          style={{marginLeft: 4}}
                        />
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {/* Completed fields */}
                {completedFields.length > 0 && (
                  <>
                    <Text style={s.sectionHeader}>
                      Completed ({completedFields.length})
                    </Text>
                    {completedFields.map(f => (
                      <TouchableOpacity
                        key={f.key}
                        style={s.fieldCardDone}
                        activeOpacity={0.75}
                        onPress={() => goToStep(f.key)}>
                        <View style={[s.iconBox, {backgroundColor: f.iconBg}]}>
                          {f.iconEl(f.iconColor)}
                        </View>
                        <View style={s.fieldText}>
                          <Text style={s.fieldLabel}>{f.label}</Text>
                          <Text style={s.fieldDesc}>{f.desc}</Text>
                        </View>
                        <View style={s.doneCircle}>
                          <CheckCircle2 size={20} color="#fff" fill="#22C55E" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {/* CTA */}
                <TouchableOpacity
                  style={s.ctaBtn}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate('RentOldNewProperty', {
                      mode: 'edit',
                      propertyData: property,
                    })
                  }>
                  <Text style={s.ctaText}>Complete Next Step →</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* ── Shared bottom actions ── */}
        <View style={s.divider} />

        <TouchableOpacity
          style={s.supportBtn}
          activeOpacity={0.7}
          onPress={() => Linking.openURL('tel:8010881965')}>
          <Headphones size={16} color={PURPLE} />
          <Text style={s.supportBtnText}>Contact Reparv Support</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.deleteBtn}
          activeOpacity={0.7}
          onPress={() => setShowDeleteModal(true)}>
          <Trash2 size={16} color="#EF4444" />
          <Text style={s.deleteBtnText}>Delete Property</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ══════════════════════════════════════
          DELETE CONFIRM MODAL
          Single Modal, rendered at screen root.
          No nesting. No siblings. Fully isolated.
      ══════════════════════════════════════ */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent
        statusBarTranslucent
        hardwareAccelerated
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}>
        <TouchableWithoutFeedback
          onPress={() => !isDeleting && setShowDeleteModal(false)}>
          <View style={dm.bg}>
            <TouchableWithoutFeedback>
              <View style={dm.card}>
                <View style={dm.iconCircle}>
                  <AlertTriangle size={38} color="#EF4444" strokeWidth={2} />
                </View>

                <Text style={dm.title}>Delete Property?</Text>

                <Text style={dm.desc}>
                  Are you sure? This action cannot be undone and all data will
                  be permanently removed.
                </Text>

                <View style={dm.infoBox}>
                  <Text style={dm.infoName} numberOfLines={2}>
                    {property?.propertyName || 'This Property'}
                  </Text>
                  <Text style={dm.infoId}>ID: REP#{property?.propertyid}</Text>
                </View>

                <View style={dm.btns}>
                  <TouchableOpacity
                    style={dm.cancelBtn}
                    onPress={() => setShowDeleteModal(false)}
                    disabled={isDeleting}
                    activeOpacity={0.7}>
                    <Text style={dm.cancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[dm.deleteBtn, isDeleting && {opacity: 0.7}]}
                    onPress={handleDelete}
                    disabled={isDeleting}
                    activeOpacity={0.7}>
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Trash2 size={15} color="#fff" />
                        <Text style={dm.deleteText}>Delete</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default PropertyReviewScreen;

/* ─────────────────────────────────────────
   SCREEN STYLES
───────────────────────────────────────── */
const s = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F8F9FB'},

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    flex: 1,
    textAlign: 'center',
  },

  scroll: {padding: 16, paddingBottom: 40},

  /* ── Approved banner ── */
  approvedBanner: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  approvedIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  approvedTitle: {fontSize: 20, fontWeight: '700', color: '#15803D'},
  approvedMessage: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 21,
    textAlign: 'center',
  },

  /* ── Rejected / Pending banner ── */
  rejectedBanner: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  rejectedIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  rejectedTitle: {fontSize: 20, fontWeight: '700', color: '#991B1B'},
  rejectedMessage: {
    fontSize: 13,
    color: '#B91C1C',
    lineHeight: 21,
    textAlign: 'center',
  },

  /* ── Not Approved banner ── */
  notApprovedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FDE2E2',
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  notApprovedIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notApprovedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 3,
  },
  notApprovedMessage: {fontSize: 13, color: '#4B5563', lineHeight: 19, flex: 1},

  /* ── Timeline card ── */
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },

  /* ── Reason card ── */
  reasonCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  reasonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 10,
  },
  reasonItem: {fontSize: 14, color: '#7F1D1D', marginBottom: 6, lineHeight: 20},

  /* ── Resubmit btn ── */
  resubmitBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 4,
  },
  resubmitBtnText: {color: '#fff', fontSize: 16, fontWeight: '600'},

  /* ── Progress card ── */
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 6,
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
  },
  progressRight: {flex: 1, flexShrink: 1, minWidth: 0},
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  progressSub: {fontSize: 13, color: '#6B7280', marginBottom: 10},
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: {height: 7, borderRadius: 4, backgroundColor: PURPLE},

  /* ── Section headers ── */
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 18,
    marginBottom: 10,
  },

  /* ── Field cards ── */
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 1},
  },
  fieldCardDone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    gap: 12,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fieldText: {flex: 1, minWidth: 0},
  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  fieldDesc: {fontSize: 13, color: '#6B7280', lineHeight: 18},
  requiredBadge: {
    backgroundColor: '#FFF4E5',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexShrink: 0,
  },
  requiredText: {fontSize: 12, fontWeight: '700', color: '#F97316'},
  doneCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  /* ── CTA ── */
  ctaBtn: {
    backgroundColor: '#5B3FD9',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 4,
  },
  ctaText: {color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.2},

  /* ── Bottom shared ── */
  divider: {height: 1, backgroundColor: '#F0F0F0', marginVertical: 18},
  supportBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: PURPLE,
    borderWidth: 1.5,
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    gap: 8,
    backgroundColor: '#fff',
  },
  supportBtnText: {color: PURPLE, fontWeight: '600', fontSize: 15},
  deleteBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#EF4444',
    borderWidth: 1.5,
    padding: 14,
    borderRadius: 14,
    gap: 8,
    backgroundColor: '#fff',
  },
  deleteBtnText: {color: '#EF4444', fontWeight: '600', fontSize: 15},
});

/* ─────────────────────────────────────────
   DELETE MODAL STYLES
───────────────────────────────────────── */
const dm = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.15,
    shadowRadius: 14,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 18,
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoId: {fontSize: 12, color: '#9CA3AF'},
  btns: {flexDirection: 'row', gap: 12, width: '100%'},
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {fontSize: 15, fontWeight: '600', color: '#374151'},
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {fontSize: 15, fontWeight: '600', color: '#fff'},
});
