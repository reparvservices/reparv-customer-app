import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';

import AreaIcon from '../../assets/image/rent-oldnew-property/property-area.png';
import Dropdown from '../../assets/image/rent-oldnew-property/dropdown.png';

export default function OldPropertyArea({
  builtUpArea,
  carpetArea,
  onBuiltUpChange,
  onCarpetChange,
  builtUpError,
  carpetError,
  showCarpetArea = true,
}) {
  console.log(builtUpArea, 'fff');
  return (
    <View style={styles.wrapper}>
      <View style={styles.headingRow}>
        <Image source={AreaIcon} style={styles.icon} />
        <Text style={styles.heading}>
          Property Area <Text style={styles.required}>*</Text>
        </Text>
      </View>

      {/* Built-up Area */}
      <Text style={styles.label}>Built-up Area *</Text>

      <View style={styles.inputWrapper}>
        <TextInput
          placeholder="Enter built-up area"
          placeholderTextColor="#868686"
          style={styles.input}
          keyboardType="numeric"
          value={builtUpArea}
          onChangeText={onBuiltUpChange}
        />

        <View style={styles.divider} />

        <TouchableOpacity style={styles.unitWrapper}>
          <Text style={styles.unitText}>sq.ft</Text>
          <Image source={Dropdown} style={styles.arrow} />
        </TouchableOpacity>
      </View>

      {builtUpError && <Text style={styles.error}>{builtUpError}</Text>}

      {showCarpetArea && (
        <>
          {/* Carpet Area */}
          <Text style={[styles.label, {marginTop: 16}]}>Carpet Area *</Text>

          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Enter carpet area"
              placeholderTextColor="#868686"
              style={styles.input}
              keyboardType="numeric"
              value={carpetArea}
              onChangeText={onCarpetChange}
            />

            <View style={styles.divider} />
            <TouchableOpacity style={styles.unitWrapper}>
              <Text style={styles.unitText}>sq.ft</Text>
              <Image source={Dropdown} style={styles.arrow} />
            </TouchableOpacity>
          </View>

          {carpetError && <Text style={styles.error}>{carpetError}</Text>}
        </>
      )}

      <View style={styles.helperRow}>
        <View style={styles.infoCircle}>
          <Text style={styles.infoText}>i</Text>
        </View>
        <Text style={styles.helperText}>
          Enter both built-up and carpet area
        </Text>
      </View>
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
    marginBottom: 16,
  },

  icon: {
    width: 26,
    height: 26,
    marginRight: 8,
    tintColor: '#8A38F5',
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

  label: {
    fontSize: 14,
    fontFamily: 'SegoeUI-Bold',
    color: '#383737',
    marginBottom: 8,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },

  required: {
    color: '#E33629',
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
  },

  unitText: {
    fontSize: 16,
    color: '#000',
    marginRight: 6,
    fontFamily: 'SegoeUI-Regular',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },

  arrow: {
    width: 12,
    height: 12,
    resizeMode: 'contain',
  },

  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
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
    marginTop: 4,
  },
});
