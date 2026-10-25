import React from 'react';
import {View, Text, StyleSheet, TextInput, Platform} from 'react-native';

export default function OldPriceDetails({
  sellingPrice,
  totalPrice,
  setTotalPrice,
  onChangeSelling,
  error,
  error2,
}) {
  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.currencyIcon}>₹</Text>
        <Text style={styles.heading}>Pricing Details</Text>
      </View>

      {/* Selling Price */}
      <Text style={styles.label}>
        Property Total Price <Text style={styles.required}>*</Text>
      </Text>
      <View style={styles.inputWrapper}>
        <Text style={styles.prefix}>₹</Text>
        <TextInput
          placeholder="00"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          style={styles.input}
          value={totalPrice}
          onChangeText={setTotalPrice}
        />
      </View>
      {error2 && <Text style={styles.error}>{error2}</Text>}

      {/* Expected Offer Price */}
      <Text style={[styles.label, {marginTop: 14}]}>Expected Offer Price</Text>
      <View style={styles.inputWrapper}>
        <Text style={styles.prefix}>₹</Text>
        <TextInput
          placeholder="00"
          placeholderTextColor="#868686"
          keyboardType="numeric"
          style={styles.input}
          value={sellingPrice}
          onChangeText={onChangeSelling}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.helperText}>Price you're willing to negotiate</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  currencyIcon: {
    fontSize: 28,
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
    color: '#8A38F5',
    marginRight: 8,
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

  label: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
    marginBottom: 4,
  },

  required: {
    color: '#E33629',
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '400',
    color: '#868686',
    marginRight: 6,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },

  helperText: {
    fontSize: 12,
    color: '#868686',
    marginTop: 6,
  },
  error: {
    color: '#E33629',
    fontSize: 12,
    marginVertical: 6,
  },
});
