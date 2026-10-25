import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  ToastAndroid,
  ActivityIndicator,
} from 'react-native';
import {
  Eye,
  MoreVertical,
  Building,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import Svg, {Path, Circle} from 'react-native-svg';
import PropertyReviewModal from './PropertyReviewCard';
import {getImageUri, parseFrontView} from '../../utils/imageHandle';
import {devLog} from '../../utils/devLog';
import {formatArea} from '../../utils/formatArea';

const PURPLE = '#6C3EF0';

/* ─── Progress ring ─── */
const ProgressRing = ({percent = 60, size = 52, strokeWidth = 5}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (percent / 100);
  const empty = circumference - filled;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#F97316"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${filled} ${empty}`}
        strokeLinecap="round"
        rotation={-90}
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
};

const FARM_TYPES = new Set(['FarmLand', 'FarmHouse']);

const NO_INTERIOR_CATS = new Set([
  'NewPlot',
  'ResaleFarmLand',
  'NewShop',
  'OfficeSpace',
  'Showrooms',
  'Warehouse',
  'ResaleShop',
  'ResaleOffice',
  'ResaleGodown',
  'RentalShop',
  'RentalOffice',
  'FarmLand',
  'FarmHouse',
  'ResaleWarehouse',
  'CommercialPlot',
  'ResaleCommercial',
  'ResalePlot',
  'RentalVilla',
  'RentalBungalow',
  'RentalFarmHouse',
  'RentalShowroom',
  'RentalGodown',
]);

const NO_LOAN_CATS = new Set([
  'RentalFlat',
  'RentalPlot',
  'RentalShop',
  'RentalOffice',
  'RentalVilla',
  'RentalBungalow',
  'RentalFarmHouse',
  'RentalShowroom',
  'RentalGodown',
]);

const NO_FLOOR_CATS = new Set([
  'FarmLand',
  'NewPlot',
  'RentalPlot',
  'ResaleHouse',
  'ResaleVilla',
  'ResaleBungalow',
  'IndependentHouse',
  'ResaleFarmHouse',
  'Warehouse',
  'ResaleGodown',
  'CommercialPlot',
  'ResaleCommercial',
  'ResalePlot',
  'RentalVilla',
  'RentalBungalow',
  'RentalFarmHouse',
  'RentalGodown',
]);

const NO_RERA_TYPES = new Set([
  'ResaleHouse',
  'ResaleVilla',
  'ResaleBungalow',
  'IndependentHouse',
  'FarmHouse',
  'ResaleFarmHouse',
  'OfficeSpace',
  'ResaleOffice',
  'Warehouse',
  'ResaleWarehouse',
  'ResaleGodown',
  'RentalFlat',
  'RentalShop',
  'RentalPlot',
  'RentalOffice',
  'RentalVilla',
  'RentalBungalow',
  'RentalFarmHouse',
  'RentalShowroom',
  'RentalGodown',
]);

const NO_UTILITIES_CATS = new Set([
  'CommercialPlot',
  'ResaleCommercial',
  'FarmLand',
  'ResalePlot',
  'NewPlot',
]);

const NO_FURNISHING_TYPES = new Set([
  'Warehouse',
  'ResaleWarehouse',
  'ResaleGodown',
  'NewPlot',
  'ResaleOffice',
  'CommercialPlot',
  'ResaleCommercial',
  'ResalePlot',
  'FarmLand',
]);

/* ─── Completion fields ─── */
export const COMPLETION_FIELDS = [
  {
    key: 'propertyType',
    label: 'Property Features',
    icon: 'features',
    description: 'Corner plot, park facing etc.',
  },
  {
    key: 'propertyCategory',
    label: 'Property Category',
    icon: 'category',
    description: 'Type of property (Plot, Flat…)',
  },
  {
    key: 'propertyName',
    label: 'Property Name',
    icon: 'name',
    description: 'Title/name of the listing',
  },
  {
    key: 'totalSalesPrice',
    label: 'Sales Price',
    icon: 'price',
    description: 'Total sales price',
  },
  {
    key: 'totalOfferPrice',
    label: 'Offer Price',
    icon: 'price',
    description: 'Discounted / offer price',
  },
  {
    key: 'contact',
    label: 'Contact',
    icon: 'phone',
    description: 'Owner / agent contact number',
  },
  {
    key: 'projectBy',
    label: 'Project By',
    icon: 'name',
    description: 'Developer / builder name',
  },
  {
    key: 'state',
    label: 'State',
    icon: 'location',
    description: 'State where property is located',
  },
  {
    key: 'city',
    label: 'City',
    icon: 'location',
    description: 'City where property is located',
  },
  {
    key: 'address',
    label: 'Address',
    icon: 'location',
    description: 'Full address of the property',
  },
  {
    key: 'seoSlug',
    label: 'SEO Slug',
    icon: 'name',
    description: 'URL-friendly property slug',
  },
  {
    key: 'propertyDescription',
    label: 'Description',
    icon: 'name',
    description: 'Detailed property description',
  },
  {
    key: 'ownershipType',
    label: 'Ownership Type',
    icon: 'ownership',
    description: 'Freehold, leasehold etc.',
  },
  {
    key: 'propertyFacing',
    label: 'Facing Direction',
    icon: 'facing',
    description: 'North, South, East, West facing',
  },
  {
    key: 'loanAvailability',
    label: 'Loan Availability',
    icon: 'price',
    description: 'Is home loan available?',
  },
  {
    key: 'reraRegistered',
    label: 'RERA Number',
    icon: 'ownership',
    description: 'RERA registration number',
  },
  {
    key: 'waterSupply',
    label: 'Water Supply',
    icon: 'amenities',
    description: 'Municipal, borewell etc.',
  },
  {
    key: 'powerBackup',
    label: 'Power Backup',
    icon: 'amenities',
    description: 'Generator, inverter etc.',
  },
  {
    key: 'locationFeature',
    label: 'Location Feature',
    icon: 'location',
    description: 'Main road, highway facing etc.',
  },
  {
    key: 'parkingFeature',
    label: 'Parking',
    icon: 'amenities',
    description: 'Covered, basement, open parking',
  },
  {
    key: 'amenitiesFeature',
    label: 'Amenities',
    icon: 'amenities',
    description: 'Lift, gym, pool etc.',
  },
  {
    key: 'smartHomeFeature',
    label: 'Smart Home',
    icon: 'amenities',
    description: 'CCTV, smart locks etc.',
  },
  {
    key: 'securityBenefit',
    label: 'Security',
    icon: 'amenities',
    description: '24x7 security, gated community',
  },
  {
    key: 'frontView',
    label: 'Property Photos',
    icon: 'photo',
    description: 'Clear front-view photos',
  },
];

const isFilledVal = val => {
  if (val === null || val === undefined) return false;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'string') {
    const t = val.trim();
    return t !== '' && t !== 'null' && t !== '[]' && t !== '{}';
  }
  return true;
};

export const getCompletionInfo = propertyData => {
  const propType = propertyData?.propertyCategory || propertyData?.propertyType;
  const isPlot = NO_INTERIOR_CATS.has(propType);
  const isNoLoan = NO_LOAN_CATS.has(propType);
  const isNoFloor =
    NO_FLOOR_CATS.has(propType) || NO_INTERIOR_CATS.has(propType);
  const isNoRera = NO_RERA_TYPES.has(propType);
  const isNoUtil = NO_UTILITIES_CATS.has(propType);
  const isNoFurnish =
    NO_FURNISHING_TYPES.has(propType) || NO_INTERIOR_CATS.has(propType);

  const skippedKeys = new Set();
  if (isNoLoan) skippedKeys.add('loanAvailability');
  if (isNoRera) skippedKeys.add('reraRegistered');
  if (isPlot) skippedKeys.add('propertyStatusFeature');
  if (isNoFurnish) skippedKeys.add('furnishingFeature');
  if (isNoFloor) {
    skippedKeys.add('totalFloors');
    skippedKeys.add('floorNo');
  }
  if (isNoUtil) {
    skippedKeys.add('waterSupply');
    skippedKeys.add('powerBackup');
  }
  if (isPlot) {
    skippedKeys.add('terraceFeature');
    skippedKeys.add('parkingFeature');
  }

  const applicableFields = COMPLETION_FIELDS.filter(
    f => !skippedKeys.has(f.key),
  );
  const results = applicableFields.map(f => ({
    ...f,
    isFilled: isFilledVal(propertyData?.[f.key]),
  }));
  const filledCount = results.filter(f => f.isFilled).length;
  const percent = Math.round((filledCount / results.length) * 100);
  return {percent, fields: results, missing: results.filter(f => !f.isFilled)};
};

/* ─── Delete Confirm Modal ─── */
const DeleteConfirmModal = ({
  visible,
  property,
  onCancel,
  onConfirm,
  isDeleting,
}) => (
  <Modal
    visible={visible}
    animationType="fade"
    transparent
    onRequestClose={onCancel}>
    <View style={delStyles.bg}>
      <View style={delStyles.card}>
        <View style={delStyles.warningCircle}>
          <AlertTriangle size={38} color="#EF4444" strokeWidth={2} />
        </View>
        <Text style={delStyles.title}>Delete Property?</Text>
        <Text style={delStyles.desc}>
          Are you sure? This action cannot be undone and all data will be
          permanently removed.
        </Text>
        <View style={delStyles.infoBox}>
          <Text style={delStyles.infoName}>{property?.propertyName}</Text>
          <Text style={delStyles.infoId}>ID: REP#{property?.propertyid}</Text>
        </View>
        <View style={delStyles.btns}>
          <TouchableOpacity
            style={delStyles.cancelBtn}
            onPress={onCancel}
            disabled={isDeleting}>
            <Text style={delStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={delStyles.confirmBtn}
            onPress={onConfirm}
            disabled={isDeleting}>
            {isDeleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Trash2 size={15} color="#fff" />
                <Text style={delStyles.confirmText}>Delete</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

/* ═══════════════════════════════════════════
   LISTING CARD
═══════════════════════════════════════════ */
export const ListingCard = ({propertyData, onDeleteSuccess}) => {
  const navigation = useNavigation();
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [totalCalls, setTotalCalls] = useState(0);
  const [totalWhatsapp, setTotalWhatsapp] = useState(0);
  const [propertyView, setPropertyView] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {percent: completionPercent} = getCompletionInfo(propertyData);
  const isCompleted = completionPercent >= 90;

  const isApproved = propertyData?.approve === 'Approved';
  const isRejected = propertyData?.approve === 'Rejected';
  const isNotApproved = propertyData?.approve === 'Not Approved';
  const isPending = !isApproved && !isRejected && !isNotApproved;

  const fetchVisitors = useCallback(async () => {
    const id = propertyData?.propertyid;
    if (!id) return;
    try {
      const res = await fetch(
        `https://aws-api.reparv.in/customerapp/enquiry/getvisits?propertyid=${id}`,
      );
      const data = await res.json();
      if (res.ok && data) {
        setTotalVisitors(Number(data.totalVisitors || 0));
        setTotalCalls(Number(data.calls || 0));
        setTotalWhatsapp(Number(data.whatsapp_enquiry || 0));
      }
    } catch (err) {
      devLog(
        `Visitor fetch failed for property ${propertyData?.propertyid}`,
        err,
      );
    }
  }, [propertyData?.propertyid]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `https://aws-api.reparv.in/customerapp/property/delete/${propertyData.propertyid}`,
        {method: 'DELETE'},
      );
      const data = await response.json();
      if (response.ok) {
        setShowDeleteModal(false);
        ToastAndroid.show('Property deleted successfully!', ToastAndroid.SHORT);
        onDeleteSuccess?.();
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

  /* ── Badge colors ── */
  const badgeColor = isApproved
    ? '#22C55E'
    : isRejected
    ? '#EF4444'
    : isNotApproved
    ? '#F59E0B'
    : '#F59E0B';

  const badgeLabel = isApproved
    ? 'Approved'
    : isRejected
    ? 'Rejected'
    : isNotApproved
    ? 'Pending'
    : 'Pending';

  return (
    <View style={[styles.card, isRejected && styles.cardRejected]}>
      {/* ── TOP ROW: image + info ── */}
      <View style={styles.topRow}>
        <View style={styles.imgWrap}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              navigation.navigate('PropertyDetails', {
                seoSlug: propertyData?.seoSlug,
              })
            }>
            <Image
              source={{
                uri: getImageUri(parseFrontView(propertyData?.frontView)[0]),
              }}
              style={styles.img}
              resizeMode="cover"
            />
          </TouchableOpacity>

          {/* ── REJECTED stamp overlay ── */}
          {isRejected && (
            <View style={styles.rejectedStampWrap} pointerEvents="none">
              <View style={styles.rejectedStamp}>
                <Text style={styles.rejectedStampText}>REJECTED</Text>
              </View>
            </View>
          )}

          {/* Status badge */}
          {propertyData?.approve && (
            <View style={[styles.badge, {backgroundColor: badgeColor}]}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          )}

          {/* "Under Correction" secondary badge for rejected */}
          {isRejected && (
            <View style={styles.correctionBadge}>
              <Text style={styles.correctionBadgeText}>Under Correction</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {propertyData?.propertyName}
            </Text>
          </View>

          <View style={styles.locRow}>
            <Svg
              width={12}
              height={12}
              viewBox="0 0 17 20"
              fill="none"
              style={{marginRight: 3, marginTop: 1}}>
              <Path
                d="M8.33 2.08C10.01 2.08 11.58 2.72 12.77 3.89C13.94 5.04 14.58 6.57 14.58 8.2C14.58 9.82 13.94 11.35 12.77 12.51L8.33 16.87L3.9 12.51C2.73 11.35 2.09 9.82 2.09 8.2C2.09 6.57 2.73 5.04 3.9 3.88C5.09 2.72 6.68 2.08 8.33 2.08ZM8.33 0C6.13 0 4.01 0.86 2.44 2.4C0.87 3.93 0 6.01 0 8.2C0 10.39 0.87 12.37 2.44 13.9L8.33 19.79L14.23 13.99C15.8 12.45 16.67 10.37 16.67 8.2C16.67 6.01 15.8 3.93 14.23 2.4C12.65 0.86 10.54 0 8.33 0Z"
                fill="#868686"
              />
            </Svg>
            <Text style={styles.locText} numberOfLines={2}>
              {propertyData?.address}, {propertyData?.city},{' '}
              {propertyData?.state}
            </Text>
          </View>

          <View style={styles.chipsCol}>
            {propertyData?.propertyCategory ? (
              <View style={styles.chip}>
                <Building size={12} color="#6B7280" />
                <Text style={styles.chipText}>
                  {propertyData.propertyCategory}
                </Text>
              </View>
            ) : null}
            {propertyData?.builtUpArea ? (
              <View style={[styles.chip, {marginTop: 5}]}>
                <Svg width={12} height={12} viewBox="0 0 16 16" fill="none">
                  <Path
                    d="M6.66667 2H2V6M14 9.33333V14H10M2 10V8.66667H3.33333M6 8.66667H7.33333V10M7.33333 12.6667V14H6M2 12.6667V14H3.33333M9.296 3.39067L9.31467 6.672L12.596 6.69067M9.66933 6.31733L13.324 2.66267"
                    stroke="#6B7280"
                    strokeWidth={1.3}
                    strokeLinecap="square"
                  />
                </Svg>
                <Text style={styles.chipText}>
                  {formatArea(propertyData.builtUpArea)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* ── REJECTED INLINE SECTION ── */}
      {isRejected && (
        <>
          <View style={styles.divider} />
          <View style={styles.rejectionBox}>
            <View style={styles.rejectionHeader}>
              <AlertTriangle size={14} color="#D97706" />
              <Text style={styles.rejectionTitle}>Rejection Reason</Text>
            </View>
            <Text style={styles.rejectionItem}>
              • {propertyData?.rejectreason || 'Not specified by admin'}
            </Text>
            {/* <Text style={styles.rejectionItem}>
              • Low quality images uploaded
            </Text>
            <Text style={styles.rejectionItem}>
              • Missing ownership documents
            </Text> */}
          </View>
          <View style={styles.divider} />
          {/* Rejected action buttons */}
          <View style={styles.rejectedActions}>
            <TouchableOpacity
              style={styles.fixResubmitBtn}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('RentOldNewProperty', {
                  mode: 'edit',
                  propertyData,
                })
              }>
              <RefreshCw size={14} color="#fff" />
              <Text style={styles.fixResubmitText}>Fix & Resubmit</Text>
            </TouchableOpacity>

            <View style={styles.rejectedBtnRow}>
              <TouchableOpacity
                style={styles.viewDetailsBtn}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('PropertyDetails', {
                    seoSlug: propertyData?.seoSlug,
                  })
                }>
                <Eye size={14} color={PURPLE} />
                <Text style={styles.viewDetailsText}>View Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteOutlineBtn}
                activeOpacity={0.8}
                onPress={() => setShowDeleteModal(true)}>
                <Trash2 size={14} color="#EF4444" />
                <Text style={styles.deleteOutlineText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* ── NON-REJECTED SECTIONS ── */}
      {!isRejected && (
        <>
          <View style={styles.divider} />

          {/* COMPLETION ROW */}
          {!isApproved && (
            <>
              {isCompleted ? (
                <View style={styles.completedRow}>
                  <CheckCircle2 size={18} color="#22C55E" />
                  <Text style={styles.completedText}>Listing Completed</Text>
                  <Text style={styles.completedPct}>{completionPercent}%</Text>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.completionRow}
                  onPress={() =>
                    navigation.navigate('PropertyReview', {
                      property: propertyData,
                    })
                  }>
                  <View style={styles.ringWrap}>
                    <ProgressRing
                      percent={completionPercent}
                      size={52}
                      strokeWidth={5}
                    />
                    <View style={styles.ringLabelAbs}>
                      <Text style={styles.ringPct}>{completionPercent}%</Text>
                    </View>
                  </View>
                  <Text style={styles.completeLabel}>Complete</Text>
                  <View style={styles.completeBtn}>
                    <Text style={styles.completeBtnText}>Complete Now ›</Text>
                  </View>
                </TouchableOpacity>
              )}
              <View style={styles.divider} />
            </>
          )}

          {/* FOOTER */}
          <View style={styles.footerRow}>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Eye size={14} color="#9CA3AF" />
                <Text style={styles.statText}>{totalVisitors}</Text>
              </View>
              <View style={styles.stat}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    stroke="#22C55E"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.statText}>{totalCalls}</Text>
              </View>
              <View style={styles.stat}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                    stroke="#6B7280"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.statText}>{totalWhatsapp}</Text>
              </View>
              <View style={styles.stat}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    stroke="#F97316"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.statText}>0</Text>
              </View>
            </View>

            {/* Edit + Delete buttons */}
            <View style={styles.footerBtns}>
              <TouchableOpacity
                style={styles.deleteIconBtn}
                onPress={() => setShowDeleteModal(true)}
                hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                <Trash2 size={15} color="#EF4444" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editBtn}
                onPress={() =>
                  navigation.navigate('RentOldNewProperty', {
                    mode: 'edit',
                    propertyData,
                  })
                }>
                <Text style={styles.editText}>Edit</Text>
                <Svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <Path
                    d="M2.5 3.167H1.833a1.333 1.333 0 00-1.333 1.333V10.5a1.333 1.333 0 001.333 1.333H7.833A1.333 1.333 0 009.167 10.5V9.834"
                    stroke="white"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M8.5 1.833L10.5 3.833M11.423 2.89a1.833 1.833 0 00-2.593-2.593L3.333 6.5V8.5H5.333L11.423 2.89z"
                    stroke="white"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* ── Modals ── */}
      {/* <PropertyReviewModal
        visible={propertyView}
        onClose={() => setPropertyView(false)}
        property={propertyData}
      /> */}

      <DeleteConfirmModal
        visible={showDeleteModal}
        property={propertyData}
        isDeleting={isDeleting}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
    overflow: 'hidden',
  },
  cardRejected: {
    borderColor: '#FECACA',
    borderWidth: 1,
  },
  topRow: {flexDirection: 'row', padding: 12, gap: 12},
  imgWrap: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    flexShrink: 0,
  },
  img: {width: 120, height: 120},
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  correctionBadge: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    marginHorizontal: 6,
    backgroundColor: '#FFF7ED',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
  },
  correctionBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.2,
  },
  infoCol: {flex: 1, paddingTop: 2},
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    lineHeight: 22,
  },
  locRow: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8},
  locText: {fontSize: 12, color: '#6B7280', flex: 1, lineHeight: 17},
  chipsCol: {flexDirection: 'column'},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  chipText: {fontSize: 12, color: '#6B7280', fontWeight: '500'},
  divider: {height: 1, backgroundColor: '#F3F4F6'},

  /* ── Rejection inline section ── */
  rejectionBox: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFBEB',
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  rejectionTitle: {fontSize: 13, fontWeight: '700', color: '#D97706'},
  rejectionItem: {fontSize: 12, color: '#78350F', lineHeight: 20},

  /* ── Rejected action buttons ── */
  rejectedActions: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  fixResubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PURPLE,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 7,
  },
  fixResubmitText: {color: '#fff', fontSize: 14, fontWeight: '700'},
  rejectedBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  viewDetailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: PURPLE,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  viewDetailsText: {color: PURPLE, fontSize: 13, fontWeight: '600'},
  deleteOutlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  deleteOutlineText: {color: '#EF4444', fontSize: 13, fontWeight: '600'},

  /* Completion row — incomplete */
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#fff',
  },
  ringWrap: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringLabelAbs: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPct: {fontSize: 11, fontWeight: '800', color: '#F97316'},
  completeLabel: {fontSize: 15, fontWeight: '600', color: '#374151', flex: 1},
  completeBtn: {
    borderWidth: 1.5,
    borderColor: PURPLE,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  completeBtnText: {color: PURPLE, fontSize: 13, fontWeight: '700'},

  /* Completion row — completed ≥90% */
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#F0FDF4',
  },
  completedText: {fontSize: 14, fontWeight: '600', color: '#15803D', flex: 1},
  completedPct: {fontSize: 13, fontWeight: '700', color: '#22C55E'},

  /* Footer */
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsRow: {flexDirection: 'row', gap: 14, alignItems: 'center'},
  stat: {flexDirection: 'row', alignItems: 'center', gap: 4},
  statText: {fontSize: 12, fontWeight: '600', color: '#374151'},

  footerBtns: {flexDirection: 'row', alignItems: 'center', gap: 8},

  deleteIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PURPLE,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  editText: {color: '#fff', fontSize: 13, fontWeight: '600'},
  /* ── Rejected stamp overlay ── */
  rejectedStampWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  rejectedStamp: {
    borderWidth: 3,
    borderColor: '#D32F2F',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 1,
    transform: [{rotate: '-25deg'}],
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  rejectedStampText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#D32F2F',
    letterSpacing: 3,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
});

/* ── Delete modal styles ── */
const delStyles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  warningCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {fontSize: 21, fontWeight: '700', color: '#1F2937', marginBottom: 10},
  desc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
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
  infoId: {fontSize: 12, color: '#6B7280'},
  btns: {flexDirection: 'row', gap: 12, width: '100%'},
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {fontSize: 15, fontWeight: '600', color: '#374151'},
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {fontSize: 15, fontWeight: '600', color: '#fff'},
});
