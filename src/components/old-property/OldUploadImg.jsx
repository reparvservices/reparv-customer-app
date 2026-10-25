import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {X} from 'lucide-react-native';

import UploadIcon from '../../assets/image/rent-oldnew-property/img-upload.png';
import {uploadToS3} from '../../utils/uploadS3';

const MAX_PER_SECTION = 5;
const MAX_EXTRA = 10;

// ─────────────────────────────────────────────────────────────────────────────
// ALL DB IMAGE COLUMNS (each key = exact DB column name)
//
//  EXISTING:  frontView | sideView | hallView | kitchenView | bedroomView
//             bathroomView | balconyView | nearestLandmark | developedAmenities
//             extraImages (JSON)
//
//  NEW:       entranceView | roadView | parkingView | interiorView
//             warehouseArea | loadingArea | officeArea | cabinView
//             washroomView | displayArea | showroomInterior
//             farmGardenArea | terraceSitout
// ─────────────────────────────────────────────────────────────────────────────

// ── Residential: Flat, Apartment, House, Villa, Floor, Duplex, Studio, Penthouse, Bunglow ──
const RESIDENTIAL_SECTIONS = [
  {key: 'frontView', label: 'Front View'},
  {key: 'sideView', label: 'Side View'},
  {key: 'hallView', label: 'Hall'},
  {key: 'kitchenView', label: 'Kitchen'},
  {key: 'bedroomView', label: 'Bedroom'},
  {key: 'bathroomView', label: 'Bathroom'},
  {key: 'balconyView', label: 'Balcony'},
  {key: 'extraImages', label: 'Extra / Other'},
];

// ── Plot / Land ──
const PLOT_SECTIONS = [
  {key: 'frontView', label: 'Front View'},
  {key: 'nearestLandmark', label: 'Nearest Landmark'},
  {key: 'developedAmenities', label: 'Developed Amenities'},
  {key: 'extraImages', label: 'Extra / Other'},
];

// ── Farm House / Resale Farm House ──
const FARMHOUSE_SECTIONS = [
  {key: 'frontView', label: 'Front View'},
  {key: 'sideView', label: 'Side View'},
  {key: 'hallView', label: 'Hall'},
  {key: 'kitchenView', label: 'Kitchen'},
  {key: 'bathroomView', label: 'Bathroom'},
  {key: 'terraceSitout', label: 'Terrace / Sit-out'},
  {key: 'farmGardenArea', label: 'Farm / Garden Area'},
  {key: 'extraImages', label: 'Extra / Other'},
];

// ── Shop / Rental Shop / Resale Shop ──
const SHOP_SECTIONS = [
  {key: 'frontView', label: 'Front View'},
  {key: 'interiorView', label: 'Interior'},
  {key: 'entranceView', label: 'Entrance'},
  {key: 'roadView', label: 'Road View'},
  {key: 'parkingView', label: 'Parking'},
  {key: 'extraImages', label: 'Extra / Other'},
];

// ── Office Space / Rental Office / Resale Office ──
const OFFICE_SECTIONS = [
  {key: 'frontView', label: 'Front View'},
  {key: 'officeArea', label: 'Office Area'},
  {key: 'cabinView', label: 'Cabin / Meeting Room'},
  {key: 'washroomView', label: 'Washroom'},
  {key: 'parkingView', label: 'Parking'},
  {key: 'extraImages', label: 'Extra / Other'},
];

// ── Warehouse / Godown ──
const WAREHOUSE_SECTIONS = [
  {key: 'frontView', label: 'Front View'},
  {key: 'warehouseArea', label: 'Warehouse Area'},
  {key: 'loadingArea', label: 'Loading Area'},
  {key: 'washroomView', label: 'Washroom'},
  {key: 'parkingView', label: 'Parking'},
  {key: 'extraImages', label: 'Extra / Other'},
];

// ── Showroom / Rental ShowRoom / Resale ShowRoom ──
const SHOWROOM_SECTIONS = [
  {key: 'frontView', label: 'Front View'},
  {key: 'showroomInterior', label: 'Showroom Interior'},
  {key: 'entranceView', label: 'Entrance'},
  {key: 'displayArea', label: 'Display Area'},
  {key: 'roadView', label: 'Road View'},
  {key: 'parkingView', label: 'Parking'},
  {key: 'washroomView', label: 'Washroom'},
  {key: 'extraImages', label: 'Extra / Other'},
];

// ─────────────────────────────────────────────────────────────────────────────
// MAP: propertyType id → section list
// ─────────────────────────────────────────────────────────────────────────────
const PROPERTY_TYPE_SECTIONS = {
  // Plots & Land
  NewPlot: PLOT_SECTIONS,
  CommercialPlot: PLOT_SECTIONS,
  ResalePlot: PLOT_SECTIONS,
  FarmLand: PLOT_SECTIONS,

  // Farm Houses
  FarmHouse: FARMHOUSE_SECTIONS,
  ResaleFarmHouse: FARMHOUSE_SECTIONS,

  // Shops
  Shop: SHOP_SECTIONS,
  ResaleShop: SHOP_SECTIONS,
  RentalShop: SHOP_SECTIONS,

  // Offices
  OfficeSpace: OFFICE_SECTIONS,
  ResaleOffice: OFFICE_SECTIONS,
  RentalOffice: OFFICE_SECTIONS,

  // Warehouses & Godowns
  Warehouse: WAREHOUSE_SECTIONS,
  ResaleGodown: WAREHOUSE_SECTIONS,
  RentalWarehouse: WAREHOUSE_SECTIONS,
  RentalGodown: WAREHOUSE_SECTIONS,

  // Showrooms
  Showrooms: SHOWROOM_SECTIONS,
  ResaleShowRoom: SHOWROOM_SECTIONS,
  RentalShowRoom: SHOWROOM_SECTIONS,

  // Residential
  NewFlat: RESIDENTIAL_SECTIONS,
  IndependentHouse: RESIDENTIAL_SECTIONS,
  IndependentFloor: RESIDENTIAL_SECTIONS,
  Duplex: RESIDENTIAL_SECTIONS,
  Studio: RESIDENTIAL_SECTIONS,
  Penthouse: RESIDENTIAL_SECTIONS,
  ResaleFlat: RESIDENTIAL_SECTIONS,
  ResaleHouse: RESIDENTIAL_SECTIONS,
  ResaleVilla: RESIDENTIAL_SECTIONS,
  ResaleBunglow: RESIDENTIAL_SECTIONS,
  RentalFlat: RESIDENTIAL_SECTIONS,
  RentalVilla: RESIDENTIAL_SECTIONS,
  RentalHouse: RESIDENTIAL_SECTIONS,
};

const getImageSections = propertyType =>
  PROPERTY_TYPE_SECTIONS[propertyType] ?? RESIDENTIAL_SECTIONS;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const getUrlsForSection = (imageFiles, key) => {
  const val = imageFiles[key];
  if (key === 'extraImages') {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return [];
  }
  if (Array.isArray(val)) return val;
  if (val) return [val];
  return [];
};

const maxForSection = key =>
  key === 'extraImages' ? MAX_EXTRA : MAX_PER_SECTION;

// ─────────────────────────────────────────────────────────────────────────────
// Circular progress ring
// ─────────────────────────────────────────────────────────────────────────────
function ProgressRing({percent, size = 56, stroke = 5, color = '#8A38F5'}) {
  const segments = 12;
  const filled = Math.round((percent / 100) * segments);
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {Array.from({length: segments}).map((_, i) => {
        const angle = (i / segments) * 2 * Math.PI - Math.PI / 2;
        const r = (size - stroke * 2) / 2;
        const cx = size / 2 + r * Math.cos(angle) - stroke;
        const cy = size / 2 + r * Math.sin(angle) - stroke;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: cx,
              top: cy,
              width: stroke * 2,
              height: stroke * 2,
              borderRadius: stroke,
              backgroundColor: i < filled ? color : '#E5E7EB',
            }}
          />
        );
      })}
      <Text style={{fontSize: 11, fontWeight: '700', color}}>{percent}%</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function OldUploadImg({
  imageFiles,
  setImageFiles,
  propertyType,
}) {
  const IMAGE_SECTIONS = getImageSections(propertyType);

  const [error, setError] = useState('');
  const [selectedSection, setSelectedSection] = useState(IMAGE_SECTIONS[0].key);
  const [sectionProgress, setSectionProgress] = useState({});

  useEffect(() => {
    setSelectedSection(getImageSections(propertyType)[0].key);
  }, [propertyType]);

  const currentUrls = getUrlsForSection(imageFiles, selectedSection);
  const maxAllowed = maxForSection(selectedSection);
  const progress = sectionProgress[selectedSection] ?? null;
  const isUploading = progress !== null;
  const canAddMore = currentUrls.length < maxAllowed;

  const pickImages = () => {
    const remaining = maxAllowed - currentUrls.length;
    if (remaining <= 0) return;

    launchImageLibrary(
      {mediaType: 'photo', selectionLimit: remaining},
      async response => {
        if (response.didCancel || response.errorCode) return;
        const assets = response.assets;
        if (!assets?.length) return;

        let simulated = 0;
        setSectionProgress(prev => ({...prev, [selectedSection]: 0}));

        const interval = setInterval(() => {
          const rem = 90 - simulated;
          const step = Math.random() * rem * 0.25;
          simulated = Math.min(simulated + step, 90);
          setSectionProgress(prev => ({
            ...prev,
            [selectedSection]: Math.round(simulated),
          }));
        }, 300);

        try {
          const uploadedUrls = await Promise.all(
            assets.map(asset => uploadToS3(asset, 'uploads')),
          );
          clearInterval(interval);

          const validUrls = uploadedUrls.filter(Boolean);
          if (!validUrls.length) {
            setSectionProgress(prev => ({...prev, [selectedSection]: null}));
            setError('Upload failed. Please try again.');
            return;
          }

          setSectionProgress(prev => ({...prev, [selectedSection]: 100}));
          await new Promise(res => setTimeout(res, 500));

          setImageFiles(prev => {
            const existing = getUrlsForSection(prev, selectedSection);
            const merged = [...existing, ...validUrls].slice(0, maxAllowed);
            return {...prev, [selectedSection]: merged};
          });
        } catch (err) {
          clearInterval(interval);
          console.log('Upload error:', err);
          setError('Upload failed. Please try again.');
        } finally {
          setSectionProgress(prev => ({...prev, [selectedSection]: null}));
        }
      },
    );
  };

  const removeImage = (sectionKey, urlIndex) => {
    setImageFiles(prev => {
      const existing = getUrlsForSection(prev, sectionKey);
      return {...prev, [sectionKey]: existing.filter((_, i) => i !== urlIndex)};
    });
  };

  useEffect(() => {
    const hasAnyImage = IMAGE_SECTIONS.some(
      sec => getUrlsForSection(imageFiles, sec.key).length > 0,
    );
    setError(hasAnyImage ? '' : 'Please upload at least one property image');
  }, [imageFiles, IMAGE_SECTIONS]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Upload Property Photos <Text style={styles.required}>*</Text>
      </Text>

      {/* ── Section pills ── */}
      <View style={styles.sectionRow}>
        {IMAGE_SECTIONS.map(sec => {
          const urls = getUrlsForSection(imageFiles, sec.key);
          const count = urls.length;
          const uploading = sectionProgress[sec.key] != null;
          const isActive = selectedSection === sec.key;

          return (
            <TouchableOpacity
              key={sec.key}
              style={[
                styles.sectionBtn,
                isActive && styles.activeSection,
                !isActive && count > 0 && styles.doneSection,
              ]}
              onPress={() => setSelectedSection(sec.key)}>
              <Text
                style={[
                  styles.sectionText,
                  isActive && styles.activeText,
                  !isActive && count > 0 && styles.doneText,
                ]}>
                {uploading
                  ? `${sectionProgress[sec.key]}%`
                  : count > 0
                  ? `✓ ${sec.label} (${count})`
                  : sec.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Upload box ── */}
      <View style={styles.uploadBox}>
        {isUploading ? (
          <View style={styles.progressState}>
            <ProgressRing percent={progress} />
            <Text style={styles.progressLabel}>
              {progress < 100 ? 'Uploading to cloud…' : 'Almost done!'}
            </Text>
          </View>
        ) : (
          <>
            {currentUrls.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbRow}>
                {currentUrls.map((url, idx) => (
                  <View key={idx} style={styles.thumbWrap}>
                    <Image source={{uri: url}} style={styles.thumb} />
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeImage(selectedSection, idx)}
                      activeOpacity={0.8}>
                      <X size={10} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {currentUrls.length === 0 && (
              <>
                <Image source={UploadIcon} style={styles.icon} />
                <Text style={styles.helperText}>
                  Upload images for{' '}
                  {IMAGE_SECTIONS.find(s => s.key === selectedSection)?.label}
                </Text>
              </>
            )}

            {currentUrls.length > 0 && (
              <Text style={styles.countLabel}>
                {currentUrls.length}/{maxAllowed} photos uploaded
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.uploadBtn,
                !canAddMore && styles.uploadBtnDisabled,
              ]}
              onPress={pickImages}
              disabled={!canAddMore}>
              <Text style={styles.uploadBtnText}>
                {!canAddMore
                  ? `Max ${maxAllowed} photos reached`
                  : currentUrls.length > 0
                  ? '+ Add More Photos'
                  : 'Upload Photos'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {paddingHorizontal: 24, backgroundColor: '#FAF8FF'},
  title: {
    fontSize: 16,
    fontFamily: 'SegoeUI-Bold',
    marginBottom: 12,
    color: '#000',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  required: {color: '#E33629'},
  sectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  sectionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  activeSection: {backgroundColor: '#8A38F5', borderColor: '#8A38F5'},
  doneSection: {backgroundColor: '#DCFCE7', borderColor: '#6EE7B7'},
  sectionText: {fontSize: 12, color: '#555'},
  activeText: {color: '#fff', fontFamily: 'SegoeUI-Bold'},
  doneText: {color: '#059669', fontFamily: 'SegoeUI-Bold'},
  uploadBox: {
    borderWidth: 1,
    borderColor: '#868686',
    borderRadius: 8,
    backgroundColor: '#FAF8FF',
    padding: 16,
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'center',
  },
  thumbRow: {flexDirection: 'row', gap: 10, paddingBottom: 8},
  thumbWrap: {position: 'relative'},
  thumb: {width: 80, height: 80, borderRadius: 8, backgroundColor: '#E5E7EB'},
  removeBtn: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  countLabel: {
    fontSize: 12,
    color: '#8A38F5',
    fontFamily: 'SegoeUI-Bold',
    marginTop: 8,
    marginBottom: 4,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  progressState: {alignItems: 'center', gap: 12},
  progressLabel: {fontSize: 13, color: '#8A38F5', fontWeight: '600'},
  icon: {width: 42, height: 32, tintColor: '#8A38F5', marginBottom: 8},
  helperText: {fontSize: 12, color: '#868686', marginBottom: 10},
  uploadBtn: {
    marginTop: 12,
    paddingHorizontal: 28,
    height: 36,
    backgroundColor: '#8A38F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBtnDisabled: {backgroundColor: '#C4B5FD'},
  uploadBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  error: {color: '#E33629', fontSize: 12, marginTop: 8, textAlign: 'center'},
});
