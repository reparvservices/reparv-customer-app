import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';

import UploadIcon from '../../assets/image/rent-oldnew-property/img-upload.png';
import {uploadToS3} from '../../utils/uploadS3';

const IMAGE_SECTIONS = [
  {key: 'frontView', label: 'Front View'},
  {key: 'sideView', label: 'Side View'},
  {key: 'hallView', label: 'Hall'},
  {key: 'kitchenView', label: 'Kitchen'},
  {key: 'bedroomView', label: 'Bedroom'},
  {key: 'bathroomView', label: 'Bathroom'},
  {key: 'balconyView', label: 'Balcony'},
  {key: 'nearestLandmark', label: 'Landmark'},
  {key: 'developedAmenities', label: 'Amenities'},
];

// ── Circular percentage ring (pure RN, no SVG lib) ────────────
function ProgressRing({percent, size = 64, stroke = 5, color = '#8A38F5'}) {
  const segments = 12;
  const filled = Math.round((percent / 100) * segments);

  return (
    <View
      style={{
        width: size,
        height: size,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {Array.from({length: segments}).map((_, i) => {
        const angle = (i / segments) * 2 * Math.PI - Math.PI / 2;
        const r = (size - stroke * 2) / 2;
        const cx = size / 2 + r * Math.cos(angle) - stroke;
        const cy = size / 2 + r * Math.sin(angle) - stroke;
        const isActive = i < filled;
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
              backgroundColor: isActive ? color : '#E5E7EB',
            }}
          />
        );
      })}
      <Text style={{fontSize: 13, fontWeight: '700', color}}>{percent}%</Text>
    </View>
  );
}

export default function UploadImg({imageFiles, setImageFiles}) {
  const [error, setError] = useState('');
  const [selectedSection, setSelectedSection] = useState(IMAGE_SECTIONS[0].key);

  // progress per section: null = idle, 0-100 = uploading
  const [sectionProgress, setSectionProgress] = useState({});

  const pickImage = () => {
    launchImageLibrary(
      {mediaType: 'photo', selectionLimit: 1},
      async response => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (!asset) return;

        // ── Start simulated progress 0 → 90% ──
        let simulated = 0;
        setSectionProgress(prev => ({...prev, [selectedSection]: 0}));

        const interval = setInterval(() => {
          const remaining = 90 - simulated;
          const step = Math.random() * remaining * 0.25;
          simulated = Math.min(simulated + step, 90);
          setSectionProgress(prev => ({
            ...prev,
            [selectedSection]: Math.round(simulated),
          }));
        }, 300);

        try {
          const s3Url = await uploadToS3(asset, 'uploads');

          clearInterval(interval);

          if (!s3Url) {
            setSectionProgress(prev => ({...prev, [selectedSection]: null}));
            setError('Upload failed. Please try again.');
            return;
          }

          // ── Snap to 100% briefly ──
          setSectionProgress(prev => ({...prev, [selectedSection]: 100}));
          await new Promise(res => setTimeout(res, 500));

          // ── Store only the S3 URL (string) ──
          setImageFiles(prev => ({
            ...prev,
            [selectedSection]: s3Url,
          }));
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

  useEffect(() => {
    const uploadedCount = Object.values(imageFiles).filter(v => !!v).length;
    setError(
      uploadedCount >= 5 ? '' : 'Please upload at least 5 property photos',
    );
  }, [imageFiles]);

  const currentUrl = imageFiles[selectedSection]; // string | null
  const progress = sectionProgress[selectedSection] ?? null;
  const isUploading = progress !== null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Upload Property Photos <Text style={styles.required}>*</Text>
      </Text>

      {/* SECTION SELECTOR */}
      <View style={styles.sectionRow}>
        {IMAGE_SECTIONS.map(sec => {
          const hasImage = !!imageFiles[sec.key];
          const uploading = sectionProgress[sec.key] != null;
          return (
            <TouchableOpacity
              key={sec.key}
              style={[
                styles.sectionBtn,
                selectedSection === sec.key && styles.activeSection,
                hasImage && selectedSection !== sec.key && styles.doneSection,
              ]}
              onPress={() => setSelectedSection(sec.key)}>
              <Text
                style={[
                  styles.sectionText,
                  selectedSection === sec.key && styles.activeText,
                  hasImage && selectedSection !== sec.key && styles.doneText,
                ]}>
                {uploading
                  ? `${sectionProgress[sec.key]}%`
                  : hasImage
                  ? `✓ ${sec.label}`
                  : sec.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* UPLOAD BOX */}
      <View style={styles.uploadBox}>
        {isUploading ? (
          /* ── Progress state ── */
          <View style={styles.progressState}>
            <ProgressRing percent={progress} />
            <Text style={styles.progressLabel}>
              {progress < 100 ? 'Uploading to cloud…' : 'Almost done!'}
            </Text>
          </View>
        ) : currentUrl ? (
          /* ── Preview state ── */
          <Image source={{uri: currentUrl}} style={styles.previewImage} />
        ) : (
          /* ── Empty state ── */
          <>
            <Image source={UploadIcon} style={styles.icon} />
            <Text style={styles.helperText}>
              Upload image for{' '}
              {IMAGE_SECTIONS.find(s => s.key === selectedSection)?.label}
            </Text>
          </>
        )}

        <TouchableOpacity
          style={[styles.uploadBtn, isUploading && styles.uploadBtnDisabled]}
          onPress={pickImage}
          disabled={isUploading}>
          <Text style={styles.uploadBtnText}>
            {isUploading
              ? `${progress}% uploading…`
              : currentUrl
              ? 'Replace Photo'
              : 'Upload Photo'}
          </Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 16,
    fontFamily: 'SegoeUI-Bold',
    marginBottom: 12,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  required: {color: '#E33629'},

  // Section pills
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
  activeSection: {
    backgroundColor: '#8A38F5',
    borderColor: '#8A38F5',
  },
  doneSection: {
    backgroundColor: '#DCFCE7',
    borderColor: '#6EE7B7',
  },
  sectionText: {fontSize: 12, color: '#555'},
  activeText: {color: '#fff', fontFamily: 'SegoeUI-Bold'},
  doneText: {color: '#059669', fontFamily: 'SegoeUI-Bold'},

  // Upload box
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

  // Progress
  progressState: {alignItems: 'center', gap: 12},
  progressLabel: {
    fontSize: 13,
    color: '#8A38F5',
    fontWeight: '600',
  },

  icon: {
    width: 42,
    height: 32,
    tintColor: '#8A38F5',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#868686',
    marginBottom: 10,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  previewImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    marginBottom: 12,
  },

  // Buttons
  uploadBtn: {
    marginTop: 12,
    paddingHorizontal: 28,
    height: 36,
    backgroundColor: '#8A38F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBtnDisabled: {
    backgroundColor: '#C4B5FD',
  },
  uploadBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },

  error: {
    color: '#E33629',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});
