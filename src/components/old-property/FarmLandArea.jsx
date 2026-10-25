import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';

import AreaIcon from '../../assets/image/rent-oldnew-property/property-area.png';

const UNITS = [
  {id: 'Acre', label: 'Acre'},
  {id: 'Guntha', label: 'Guntha'},
  {id: 'Hectare', label: 'Hectare'},
  {id: 'Sq.ft', label: 'Sq.ft'},
];

export default function FarmLandArea({
  value,
  unit,
  onChange,
  onUnitChange,
  error,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedUnit = UNITS.find(u => u.id === unit) || UNITS[0];

  return (
    <View style={styles.wrapper}>
      <View style={styles.headingRow}>
        <Image source={AreaIcon} style={styles.icon} />
        <Text style={styles.heading}>
          Land Area Details <Text style={styles.required}>*</Text>
        </Text>
      </View>

      {/* Area label */}
      <Text style={styles.subLabel}>Total Area</Text>

      {/* Input + unit selector */}
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder="Enter area"
          placeholderTextColor="#868686"
          style={styles.input}
          keyboardType="numeric"
          value={value}
          onChangeText={onChange}
        />
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.unitWrapper}
          activeOpacity={0.7}
          onPress={() => setModalVisible(true)}>
          <Text style={styles.unitText}>{selectedUnit.label}</Text>
          <Text style={styles.dropArrow}>▾</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Unit chips for quick selection */}
      <View style={styles.chipRow}>
        {UNITS.map(u => {
          const active = unit === u.id;
          return (
            <TouchableOpacity
              key={u.id}
              activeOpacity={0.8}
              onPress={() => onUnitChange(u.id)}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {u.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.helperRow}>
        <View style={styles.infoCircle}>
          <Text style={styles.infoText}>i</Text>
        </View>
        <Text style={styles.helperText}>Enter the total land area</Text>
      </View>

      {/* Unit picker modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Unit</Text>
            <FlatList
              data={UNITS}
              keyExtractor={u => u.id}
              renderItem={({item}) => {
                const active = unit === item.id;
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.modalItem, active && styles.modalItemActive]}
                    onPress={() => {
                      onUnitChange(item.id);
                      setModalVisible(false);
                    }}>
                    <Text
                      style={[
                        styles.modalItemText,
                        active && styles.modalItemTextActive,
                      ]}>
                      {item.label}
                    </Text>
                    {active && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    width: 26,
    height: 26,
    marginRight: 8,
    tintColor: '#8A38F5',
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'SegoeUI-Bold',
    color: '#000',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  required: {
    color: '#E33629',
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#383737',
    fontFamily: 'SegoeUI-Bold',
    marginBottom: 8,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: '#B8B8B8',
    marginHorizontal: 12,
  },
  unitWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unitText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8A38F5',
    fontFamily: 'SegoeUI-Regular',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  dropArrow: {
    fontSize: 14,
    color: '#8A38F5',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#F9F9F9',
  },
  chipActive: {
    borderColor: '#8A38F5',
    backgroundColor: '#8A38F5',
  },
  chipText: {
    fontSize: 13,
    color: '#868686',
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
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  infoCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#868686',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  helperText: {
    fontSize: 12,
    color: '#868686',
  },
  error: {
    color: '#E33629',
    fontSize: 12,
    marginVertical: 6,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    paddingTop: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9D9D9',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'SegoeUI-Bold',
    color: '#111827',
    paddingHorizontal: 20,
    marginBottom: 8,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemActive: {
    backgroundColor: '#FAF5FF',
  },
  modalItemText: {
    fontSize: 16,
    fontFamily: 'SegoeUI-Regular',
    color: '#374151',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  modalItemTextActive: {
    color: '#8A38F5',
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  checkmark: {
    color: '#8A38F5',
    fontSize: 16,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
});
