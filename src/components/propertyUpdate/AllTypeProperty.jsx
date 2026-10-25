import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';

import IndependentIcon from '../../assets/image/rent-oldnew-property/property-type/independent-house.png';
import IndependentFloorIcon from '../../assets/image/rent-oldnew-property/property-type/independent-floor.png';
import DuplexIcon from '../../assets/image/rent-oldnew-property/property-type/duplex.png';
import ResidentialPlotIcon from '../../assets/image/rent-oldnew-property/property-type/residential-plot.png';
import StudioIcon from '../../assets/image/rent-oldnew-property/property-type/studio.png';
import PenthouseIcon from '../../assets/image/rent-oldnew-property/property-type/pent-house.png';
import FlatIcon from '../../assets/image/rent-oldnew-property/property-type/flat.png';
import CommercialPlotIcon from '../../assets/image/rent-oldnew-property/property-type/commercial-plot.png';
import OfficeIcon from '../../assets/image/rent-oldnew-property/property-type/office-space.png';
import WarehouseIcon from '../../assets/image/rent-oldnew-property/property-type/warehouse.png';
import ShowroomsIcon from '../../assets/image/rent-oldnew-property/property-type/showrooms.png';
import ShopIcon from '../../assets/image/rent-oldnew-property/property-type/shops.png';

export const ALL_PROPERTY_TYPES = [
  // ── Rental types ──
  {id: 'RentalFlat', label: 'Rental Flat', icon: IndependentIcon},
  {id: 'RentalVilla', label: 'Rental Villa', icon: IndependentFloorIcon},
  {id: 'RentalHouse', label: 'Rental House', icon: PenthouseIcon},
  {id: 'RentalShop', label: 'Rental Shop', icon: ShopIcon, hideBhk: true},
  {
    id: 'RentalOffice',
    label: 'Rental Office',
    icon: OfficeIcon,
    hideBhk: true,
  },
  {
    id: 'RentalShowRoom',
    label: 'Rental ShowRoom',
    icon: StudioIcon,
    hideBhk: true,
  },
  {
    id: 'RentalGodown',
    label: 'Rental Godown',
    icon: FlatIcon,
    hideBhk: true,
  },
  {
    id: 'RentalWarehouse',
    label: 'Rental Warehouse',
    icon: WarehouseIcon,
    hideBhk: true,
  },

  // ── New Property / Sell types ──
  {
    id: 'NewFlat',
    label: 'Flat / Apartment',
    icon: FlatIcon,
  },
  {
    id: 'IndependentHouse',
    label: 'Independent House/Villa',
    icon: IndependentIcon,
  },
  {
    id: 'IndependentFloor',
    label: 'Independent Floor',
    icon: IndependentFloorIcon,
  },
  {
    id: 'Duplex',
    label: 'Duplex',
    icon: DuplexIcon,
  },
  {
    id: 'NewPlot',
    label: 'New Plot',
    icon: ResidentialPlotIcon,
    hideBhk: true,
  },
  {
    id: 'Studio',
    label: 'Studio',
    icon: StudioIcon,
  },
  {
    id: 'CommercialPlot',
    label: 'Commercial Plot',
    icon: CommercialPlotIcon,
    hideBhk: true,
  },
  {
    id: 'OfficeSpace',
    label: 'Office Space',
    icon: OfficeIcon,
    hideBhk: true,
  },
  {
    id: 'Warehouse',
    label: 'Warehouse',
    icon: WarehouseIcon,
    hideBhk: true,
  },
  {
    id: 'Showrooms',
    label: 'Showrooms',
    icon: ShowroomsIcon,
    hideBhk: true,
  },
  {
    id: 'Shop',
    label: 'Shop',
    icon: ShopIcon,
    hideBhk: true,
  },
  {
    id: 'FarmLand',
    label: 'Farm Land',
    icon: CommercialPlotIcon,
    hideBhk: true,
    isFarm: true,
  },
  {
    id: 'FarmHouse',
    label: 'Farm House',
    icon: IndependentFloorIcon,
    hideBhk: true,
    isFarm: true,
  },

  // ── Resale Property types ──
  {
    id: 'ResaleFlat',
    label: 'Resale Flat',
    icon: FlatIcon,
  },
  {
    id: 'ResalePlot',
    label: 'Resale Plot',
    icon: ResidentialPlotIcon,
    hideBhk: true,
  },
  {
    id: 'ResaleHouse',
    label: 'Resale House',
    icon: IndependentIcon,
  },
  {
    id: 'ResaleVilla',
    label: 'Resale Villa',
    icon: IndependentIcon,
  },
  {
    id: 'ResaleShop',
    label: 'Resale Shop',
    icon: ShopIcon,
    hideBhk: true,
  },
  {
    id: 'ResaleOffice',
    label: 'Resale Office',
    icon: OfficeIcon,
    hideBhk: true,
  },
  {
    id: 'ResaleFarmHouse',
    label: 'Resale Farm House',
    icon: IndependentIcon,
    hideBhk: true,
    isFarm: true,
  },
  {
    id: 'ResaleGodown',
    label: 'Resale Godown',
    icon: WarehouseIcon,
    hideBhk: true,
  },
  {
    id: 'ResaleBunglow',
    label: 'Resale Bunglow',
    icon: IndependentFloorIcon,
  },
  {
    id: 'ResaleShowRoom',
    label: 'Resale ShowRoom',
    icon: ShowroomsIcon,
    hideBhk: true,
  },

  // ── Premium types ──
  {
    id: 'Penthouse',
    label: 'Penthouse',
    icon: PenthouseIcon,
  },
];

export const isFarmType = id =>
  !!ALL_PROPERTY_TYPES.find(t => t.id === id)?.isFarm;
export const allTypeHidesBhk = id =>
  !!ALL_PROPERTY_TYPES.find(t => t.id === id)?.hideBhk;

const BHK_OPTIONS = [
  {id: '1 RK', label: '1 RK'},
  {id: '1 BHK', label: '1 BHK'},
  {id: '2 BHK', label: '2 BHK'},
  {id: '3 BHK', label: '3 BHK'},
  {id: '4 BHK', label: '4 BHK'},
  {id: '4+ BHK', label: '4+ BHK'},
];

export default function AllPropertyTypeSelector({
  value,
  onChange,
  bhkValue,
  onBhkChange,
  error,
  bhkError,
}) {
  const selectedType = ALL_PROPERTY_TYPES.find(t => t.id === value);
  const showBhk = value && !selectedType?.hideBhk;

  const handleTypePress = item => {
    onChange(item.id);
    if (item.hideBhk && onBhkChange) onBhkChange('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        Property Type <Text style={styles.required}>*</Text>
      </Text>

      <View style={styles.grid}>
        {ALL_PROPERTY_TYPES.map(item => {
          const selected = value === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() => handleTypePress(item)}
              style={[styles.card, selected && styles.cardActive]}>
              <Image
                source={item.icon}
                style={[styles.icon, selected && styles.iconActive]}
                resizeMode="contain"
              />
              <Text
                numberOfLines={1}
                style={[styles.label, selected && styles.labelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* ── BHK Configuration ── */}
      {showBhk && (
        <View style={styles.bhkSection}>
          <View style={styles.divider} />

          <Text style={styles.heading}>
            BHK Configuration <Text style={styles.required}>*</Text>
          </Text>

          <View style={styles.bhkRow}>
            {BHK_OPTIONS.map(item => {
              const selected = bhkValue === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  onPress={() => onBhkChange && onBhkChange(item.id)}
                  style={[styles.bhkChip, selected && styles.bhkChipActive]}>
                  <Text
                    style={[
                      styles.bhkLabel,
                      selected && styles.bhkLabelActive,
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {bhkError ? <Text style={styles.error}>{bhkError}</Text> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingTop: 16,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'SegoeUI-Regular',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  required: {color: '#E33629'},
  grid: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'flex-start',
  },
  cardActive: {
    borderColor: '#8A38F5',
    backgroundColor: '#8A38F5',
  },
  icon: {
    width: 26,
    height: 26,
    marginBottom: 8,
    tintColor: '#868686',
  },
  iconActive: {tintColor: '#fff'},
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#868686',
    textAlign: 'left',
    alignSelf: 'flex-start',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  labelActive: {
    color: '#fff',
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  // ── BHK ──
  bhkSection: {marginTop: 4},
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 18,
  },
  bhkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  bhkChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#FFFFFF',
    minWidth: 64,
    alignItems: 'center',
  },
  bhkChipActive: {
    borderColor: '#8A38F5',
    backgroundColor: '#8A38F5',
  },
  bhkLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#868686',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  bhkLabelActive: {
    color: '#fff',
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  error: {
    color: '#E33629',
    fontSize: 12,
    marginVertical: 6,
  },
});
