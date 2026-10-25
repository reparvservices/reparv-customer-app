import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Platform} from 'react-native';
import {ChevronDown, ChevronUp} from 'lucide-react-native';

const FARM_FEATURE_CATEGORIES = [
  {
    key: 'roadAccess',
    label: 'Road & Access',
    farmhouseOnly: false,
    options: [
      'Highway Touch',
      'Main Road Touch',
      'Tar Road Access',
      'Kachha Road Access',
      'Corner Plot',
      'Road Facing',
      'Internal Road',
      'Wide Road Access',
      'Truck Accessible',
      'Gated Entry',
    ],
  },
  {
    key: 'waterFeatures',
    label: 'Water Features',
    farmhouseOnly: false,
    options: [
      'Borewell',
      'Open Well',
      'Canal Water',
      'River Access',
      'Lake Nearby',
      'Water Pipeline',
      'Drip Irrigation',
      'Sprinkler System',
      'Water Tank',
      'Year Round Water',
      'Rainwater Harvesting',
    ],
  },
  {
    key: 'electricity',
    label: 'Electricity & Utilities',
    farmhouseOnly: false,
    options: [
      'Electricity Connection',
      '3 Phase Connection',
      'Transformer Nearby',
      'Solar Power',
      'Solar Pump',
      'Street Lights',
      'Internet Available',
    ],
  },
  {
    key: 'farmingFeatures',
    label: 'Farming Features',
    farmhouseOnly: false,
    options: [
      'Fertile Soil',
      'Black Soil',
      'Red Soil',
      'Organic Farming Ready',
      'Cultivated Land',
      'Ready for Farming',
      'Greenhouse',
      'Polyhouse',
      'Dairy Farming Setup',
      'Poultry Farming Setup',
      'Fish Farming Setup',
    ],
  },
  {
    key: 'treesCrops',
    label: 'Trees & Crops',
    farmhouseOnly: false,
    options: [
      'Mango Farm',
      'Orange Farm',
      'Coconut Trees',
      'Teak Plantation',
      'Banana Farm',
      'Existing Crops',
      'Fruit Bearing Trees',
      'Bamboo Plantation',
    ],
  },
  {
    key: 'legalFeatures',
    label: 'Investment & Legal',
    farmhouseOnly: false,
    options: [
      'Clear Title',
      '7/12 Available',
      'Mutation Completed',
      'NA Potential',
      'NA Approved',
      'Bank Loan Available',
      'Government Approved',
      'Ready Possession',
    ],
  },
  {
    key: 'nearbyConnectivity',
    label: 'Nearby Connectivity',
    farmhouseOnly: false,
    options: [
      'Near Highway',
      'Near MIDC',
      'Near City',
      'Near Village',
      'Near Tourism Spot',
      'Near Temple',
      'Near School',
      'Near Hospital',
      'Near Market',
    ],
  },
  {
    key: 'lifestyleLeisure',
    label: 'Lifestyle & Leisure',
    farmhouseOnly: true, // ← only visible for FarmHouse
    options: [
      'Mountain View',
      'Lake View',
      'River View',
      'Garden Area',
      'Weekend Home Suitable',
      'Resort Potential',
      'Peaceful Location',
      'Eco Friendly Location',
      'Sunrise View',
      'Sunset View',
    ],
  },
];

/* ── Single collapsible category ── */
const CategorySection = ({category, selected, onToggle, propertyType}) => {
  const [expanded, setExpanded] = useState(true);

  // Hide lifestyle & leisure for FarmLand — only show for FarmHouse
  if (category.farmhouseOnly && propertyType !== 'FarmHouse') return null;

  const selectedCount = category.options.filter(o =>
    selected.includes(o),
  ).length;

  return (
    <View style={styles.categoryBlock}>
      {/* Header */}
      <TouchableOpacity
        style={styles.categoryHeader}
        activeOpacity={0.8}
        onPress={() => setExpanded(p => !p)}>
        <View style={styles.categoryHeaderLeft}>
          <Text style={styles.categoryLabel}>{category.label}</Text>
          {selectedCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{selectedCount}</Text>
            </View>
          )}
        </View>
        {expanded ? (
          <ChevronUp size={18} color="#8A38F5" />
        ) : (
          <ChevronDown size={18} color="#868686" />
        )}
      </TouchableOpacity>

      {/* Chips */}
      {expanded && (
        <View style={styles.chipsWrap}>
          {category.options.map(opt => {
            const active = selected.includes(opt);
            return (
              <TouchableOpacity
                key={opt}
                activeOpacity={0.8}
                onPress={() => onToggle(opt)}
                style={[styles.chip, active && styles.chipActive]}>
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}>
                  {active ? `✓ ${opt}` : opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

/* ── Main component ── */
export default function FarmFeaturesAmenities({
  value = [],
  onChange = () => {}, // ← safe default prevents "not a function" crash
  propertyType,
}) {
  const safeValue = Array.isArray(value) ? value : [];

  const toggleOption = opt => {
    if (typeof onChange !== 'function') return;
    const updated = safeValue.includes(opt)
      ? safeValue.filter(o => o !== opt)
      : [...safeValue, opt];
    onChange(updated);
  };

  return (
    <View style={styles.wrapper}>
      {/* Heading row */}
      <View style={styles.headingRow}>
        <Text style={styles.heading}>
          Features & Amenities
          <Text style={styles.optional}> (Optional)</Text>
        </Text>
        {safeValue.length > 0 && (
          <Text style={styles.totalSelected}>{safeValue.length} selected</Text>
        )}
      </View>

      {FARM_FEATURE_CATEGORIES.map(cat => (
        <CategorySection
          key={cat.key}
          category={cat}
          selected={safeValue}
          onToggle={toggleOption}
          propertyType={propertyType}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  // Heading
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heading: {
    fontSize: 16,
    fontFamily: 'SegoeUI-Bold',
    color: '#000',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  optional: {
    fontSize: 12,
    color: '#868686',
    fontFamily: 'SegoeUI-Regular',
  },
  totalSelected: {
    fontSize: 12,
    color: '#8A38F5',
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },

  // Category block
  categoryBlock: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0EBFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FAF5FF',
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontFamily: 'SegoeUI-Bold',
    color: '#1F1F1F',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  countBadge: {
    backgroundColor: '#8A38F5',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },

  // Chips
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    backgroundColor: '#FDFBFF',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#fff',
  },
  chipActive: {
    borderColor: '#8A38F5',
    backgroundColor: '#8A38F5',
  },
  chipText: {
    fontSize: 12,
    color: '#555',
    fontFamily: 'SegoeUI-Regular',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  chipTextActive: {
    color: '#fff',
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
});
