import React, {useState} from 'react';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import {icons} from '../../utils/benifitsSvg';
import MediaPreviewModal from '../property/MediaPreviewModal';
import LinearGradient from 'react-native-linear-gradient';

/* ─────────────────────────────────────────
   Offered Property Type Section
───────────────────────────────────────── */
const OfferedPropertyType = ({propertyType, Imguri}) => {
  const propertyTypes = Array.isArray(propertyType)
    ? propertyType
    : propertyType
    ? [propertyType]
    : [];
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.offerContainer}>
      {/* ── Header ── */}
      <Text style={styles.offerTitle}>Offered Property Type</Text>

      {/* ── Chips ── */}
      <View style={styles.chipsWrap}>
        {propertyTypes.map((d, index) => (
          <View key={index} style={styles.offerBox}>
            <Text style={styles.offerText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Download Brochure ── */}
      <TouchableOpacity
        onPress={() => setVisible(true)}
        activeOpacity={0.85}
        style={styles.brochureBtn}>
        <LinearGradient
          colors={['#7C3AED', '#A855F7']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.brochureGradient}>
          {/* Left: PDF icon */}
          <View style={styles.pdfIconBox}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M6 2H14L20 8V22H6V2Z" fill="#FFFFFF" opacity={0.85} />
              <Path d="M14 2L20 8H14V2Z" fill="#C4B5FD" />
              <Path
                d="M9 13H15M9 16H13"
                stroke="#7C3AED"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </Svg>
            <Text style={styles.pdfLabel}>PDF</Text>
          </View>

          {/* Middle: Text */}
          <View style={styles.brochureTextWrap}>
            <Text style={styles.brochureSubText}>
              Tap to view &amp; download
            </Text>
            <Text style={styles.brochureMainText}>Property Brochure</Text>
          </View>

          {/* Right: Arrow icon */}
          <View style={styles.arrowBox}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 3V15M12 15L8 11M12 15L16 11M4 18V21H20V18"
                stroke="#7C3AED"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <MediaPreviewModal
        visible={visible}
        onClose={() => setVisible(false)}
        uri={Imguri}
      />
    </View>
  );
};

/* ─────────────────────────────────────────
   Highlights Section
───────────────────────────────────────── */
export const Highlights = ({propertyFeatures, propertyData}) => {
  const features = propertyFeatures || {};
  const baseURL = 'https://reparv-assets.s3.ap-south-1.amazonaws.com';

  const getHighestBHK = (types = []) => {
    if (!Array.isArray(types)) return null;

    let maxBHK = null;
    let hasRK = false;

    types.forEach(type => {
      const lower = type.toLowerCase().trim();

      // Check RK
      if (lower.includes('rk')) {
        hasRK = true;
      }

      // Match: 1 BHK, 2 BHK, 2.5 BHK, 4+ BHK
      const match = lower.match(/(\d+(?:\.\d+)?)\s*\+?\s*bhk/);

      if (match) {
        const bhkNumber = parseFloat(match[1]);

        if (maxBHK === null || bhkNumber > maxBHK) {
          maxBHK = bhkNumber;
        }
      }
    });

    if (maxBHK !== null) {
      // Remove decimal if whole number
      return Number.isInteger(maxBHK) ? `${maxBHK} BHK` : `${maxBHK} BHK`;
    }

    if (hasRK) return '1 RK';

    return null;
  };
  const highlightsData = [
    // Hide Spacious rooms for NewPlot
    ...(propertyData?.propertyCategory !== 'NewPlot'
      ? [
          {
            key: 'plotType',
            title: getHighestBHK(features.plotType) || '—',
            subtitle: 'Spacious rooms',
            iconIndex: 0,
          },
        ]
      : []),

    {
      key: 'water',
      title: features?.water || '—',
      subtitle: 'Water Supply',
      iconIndex: 1,
    },
    {
      key: 'area',
      title: features.area || '—',
      subtitle: 'Built-up area',
      iconIndex: 2,
    },
    {
      key: 'parking',
      title: features.parking || '—',
      subtitle: 'Parking',
      iconIndex: 3,
    },

    // Hide Furnishing for NewPlot
    ...(propertyData?.propertyCategory !== 'NewPlot' &&
    propertyData?.propertyCategory !== 'FarmLand'
      ? [
          {
            key: 'furnishing',
            title: features.furnishingFeature || 'Not Mention',
            subtitle: 'Furnishing',
            iconIndex: 4,
          },
        ]
      : []),

    {
      key: 'status',
      title: features.status || '—',
      subtitle: 'Project Status',
      iconIndex: 5,
    },
    {
      key: 'approval',
      title: features.approval || '—',
      subtitle: 'Approved By',
      iconIndex: 6,
    },
    {
      key: 'facing',
      title: features.facing || '—',
      subtitle: 'Facing',
      iconIndex: 7,
    },
  ];

  const validHighlights = highlightsData.filter(
    item =>
      item?.title && item.title !== '—' && String(item.title).trim() !== '',
  );
  return (
    <>
      {propertyData?.brochureFile && (
        <OfferedPropertyType
          propertyType={propertyData?.propertyType}
          Imguri={`${baseURL}${propertyData.brochureFile}`}
        />
      )}

      <View style={styles.highlightContainer}>
        <Text style={styles.sectionTitle}>Property Highlights</Text>
        <View style={styles.grid}>
          {validHighlights.map(item => (
            <HighlightItem
              key={item.key}
              icon={icons?.[item.iconIndex]}
              title={item.title}
              subtitle={item.subtitle}
            />
          ))}
        </View>
      </View>
    </>
  );
};

const HighlightItem = ({icon, title, subtitle}) => (
  <View style={styles.card}>
    <View style={styles.iconBox}>{icon ? icon : <Text>—</Text>}</View>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardSubtitle}>{subtitle}</Text>
  </View>
);

/* ─────────────────────────────────────────
   Styles
───────────────────────────────────────── */
const styles = StyleSheet.create({
  /* ── Offered Property Type ── */
  offerContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  offerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },

  /* Chips */
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },

  offerBox: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F0FF',
  },

  offerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
  },

  divider: {
    height: 1,
    backgroundColor: '#EDE9FE',
    marginBottom: 14,
  },

  /* Brochure Button */
  brochureBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },

  brochureGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderRadius: 14,
  },

  pdfIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },

  pdfLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  brochureTextWrap: {
    flex: 1,
  },

  brochureSubText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '400',
  },

  brochureMainText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },

  arrowBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Property Highlights ── */
  highlightContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 12,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  card: {
    width: '48%',
    backgroundColor: '#FAFAFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },

  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },

  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
});
