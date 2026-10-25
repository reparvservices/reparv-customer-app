import {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {IndianRupee, SquareDashed} from 'lucide-react-native';
import {API_BASE_URL} from '../../config/api';
import {formatIndianAmount} from '../../utils/formatIndianAmount';

const FLAT_CATEGORIES = ['NewFlat', 'CommercialFlat'];
const PLOT_CATEGORIES = ['NewPlot', 'CommercialPlot'];

const isValid = value =>
  value !== null &&
  value !== undefined &&
  value !== '' &&
  value !== 0 &&
  value !== '0';

const formatCategory = category =>
  String(category || '').replace(/([a-z])([A-Z])/g, '$1 $2');

/**
 * Area and price per property type (e.g. 2 BHK / 3 BHK), like the website's
 * TypeWisePricing. Renders nothing when the listing has no types.
 */
export const TypeWisePricing = ({propertyId, propertyCategory, propertyType}) => {
  const types = Array.isArray(propertyType) ? propertyType.filter(Boolean) : [];
  const [activeType, setActiveType] = useState(types[0] || '');
  const [typeData, setTypeData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Reset when another property is opened on this screen
  useEffect(() => {
    setActiveType(types[0] || '');
  }, [propertyId, types[0]]);

  useEffect(() => {
    if (!propertyId || !activeType) return;
    let ignore = false;
    const fetchTypeData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/frontend/properties/additionalinfo/data/get/${propertyId}?type=${encodeURIComponent(
            activeType,
          )}`,
        );
        const json = response.ok ? await response.json() : null;
        if (!ignore) setTypeData(json);
      } catch (error) {
        console.error('Fetch type-wise pricing error:', error);
        if (!ignore) setTypeData(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchTypeData();
    return () => {
      ignore = true;
    };
  }, [propertyId, activeType]);

  if (!types.length) return null;

  const isPlot = PLOT_CATEGORIES.includes(propertyCategory);
  const isFlat = FLAT_CATEGORIES.includes(propertyCategory);

  const rows = [
    {label: 'Built-Up Area', value: typeData?.builtuparea, show: !isPlot},
    {
      label: 'Super Built-Up Area',
      value: typeData?.superbuiltuparea,
      show: !isPlot,
    },
    {label: 'Carpet Area', value: typeData?.carpetarea, show: !isPlot},
    {label: 'Additional Area', value: typeData?.additionalarea, show: !isPlot},
    {label: 'Plot Size', value: typeData?.plotsize, show: !isFlat},
    {label: 'Payable Area', value: typeData?.payablearea, show: true},
  ].filter(row => row.show && isValid(row.value));

  const totalCost = parseFloat(typeData?.totalcost);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{formatCategory(propertyCategory)}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}>
        {types.map(type => {
          const isActive = type === activeType;
          return (
            <TouchableOpacity
              key={type}
              activeOpacity={0.8}
              onPress={() => setActiveType(type)}
              style={[styles.chip, isActive && styles.activeChip]}>
              <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                {type}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={styles.loader} color="#8A38F5" />
      ) : rows.length || totalCost > 0 ? (
        <View style={styles.grid}>
          {rows.map(row => (
            <View key={row.label} style={styles.gridItem}>
              <SquareDashed size={16} color="#111" />
              <View style={styles.gridTextCol}>
                <Text style={styles.gridLabel}>{row.label}</Text>
                <Text style={styles.gridValue}>{row.value}</Text>
              </View>
            </View>
          ))}
          {totalCost > 0 && (
            <View style={styles.gridItem}>
              <IndianRupee size={16} color="#111" />
              <View style={styles.gridTextCol}>
                <Text style={styles.gridLabel}>Total Price</Text>
                <Text style={styles.gridValue}>
                  ₹{formatIndianAmount(totalCost)}
                </Text>
              </View>
            </View>
          )}
        </View>
      ) : (
        <Text style={styles.emptyText}>
          Details for {activeType} are not available yet.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE7FB',
  },
  title: {fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 12},
  chipsRow: {gap: 10, paddingBottom: 4},
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  activeChip: {backgroundColor: '#8A38F5', borderColor: '#8A38F5'},
  chipText: {fontSize: 13, fontWeight: '600', color: '#374151'},
  activeChipText: {color: 'white'},
  loader: {marginTop: 20, marginBottom: 8},
  grid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, rowGap: 16},
  gridItem: {width: '50%', flexDirection: 'row', gap: 8, paddingRight: 8},
  gridTextCol: {flex: 1},
  gridLabel: {fontSize: 12, color: 'rgba(0,0,0,0.4)'},
  gridValue: {fontSize: 14, color: '#000', marginTop: 2},
  emptyText: {fontSize: 13, color: '#6B7280', marginTop: 16},
});
