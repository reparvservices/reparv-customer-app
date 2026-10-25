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

export default function PropertyArea({value, onChange, error}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.headingRow}>
        <Image source={AreaIcon} style={styles.icon} />
        <Text style={styles.heading}>
          Property Area <Text style={styles.required}>*</Text>
        </Text>
      </View>

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

        <TouchableOpacity style={styles.unitWrapper}>
          <Text style={styles.unitText}>sq.ft</Text>
          <Image source={Dropdown} style={styles.arrow} />
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.helperRow}>
        <View style={styles.infoCircle}>
          <Text style={styles.infoText}>i</Text>
        </View>
        <Text style={styles.helperText}>Enter the total built-up area</Text>
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
    marginBottom: 12,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
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
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
    color: '#000',
    fontFamily: 'Segoe UI',
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
    fontWeight: '400',
    color: '#000',
    marginRight: 6,
    fontFamily: 'Segoe UI',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  arrow: {
    fontSize: 18,
    color: '#000',
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
});
