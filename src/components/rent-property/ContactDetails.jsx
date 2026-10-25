import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';

import User from '../../assets/image/rent-oldnew-property/profile.png';
import Lock from '../../assets/image/rent-oldnew-property/lock.png';

export default function ContactDetails({
  ownerName,
  phone,
  onOwnerChange,
  onPhoneChange,
  errors,
}) {
  return (
    <View style={styles.container}>
      {/* Heading */}
      <View style={styles.headingRow}>
        <Image source={User} style={styles.headingIcon} />
        <Text style={styles.heading}>Contact Details</Text>
      </View>

      {/* Owner Name */}
      <Text style={styles.label}>
        Owner Name <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        placeholder="Enter Full Name"
        placeholderTextColor="#868686"
        style={styles.input}
        value={ownerName}
        onChangeText={onOwnerChange}
      />
      {errors?.ownerName && (
        <Text style={styles.error}>{errors.ownerName}</Text>
      )}

      {/* Phone Number */}
      <Text style={styles.label}>
        Phone Number <Text style={styles.required}>*</Text>
      </Text>

      <View style={styles.phoneRow}>
        <View style={styles.countryCode}>
          <Text style={styles.countryText}>+91</Text>
        </View>

        <TextInput
          placeholder="Enter Mobile Number"
          placeholderTextColor="#868686"
          keyboardType="number-pad"
          style={styles.phoneInput}
          maxLength={10}
          value={phone}
          onChangeText={text => {
            const numeric = text.replace(/[^0-9]/g, '');
            onPhoneChange(numeric);
          }}
        />
      </View>
      {errors?.phone && <Text style={styles.error}>{errors.phone}</Text>}

      {/* Email */}
      {/* <Text style={styles.label}>Email Address</Text>
      <TextInput
        placeholder="Enter email (optional)"
        placeholderTextColor="#868686"
        keyboardType="email-address"
        style={styles.input}
      /> */}

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Image source={Lock} style={styles.lockIcon} />
        <Text style={styles.infoText}>
          Your contact details are secure and will only be shared with verified
          buyers
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },

  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  headingIcon: {
    width: 22,
    height: 22,
    marginRight: 8,
  },
  heading: {
    fontSize: 16,
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
    color: '#000',
    fontFamily: 'SegoeUI-Regular',
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

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 14,
    backgroundColor: '#fff',
    color: '#000',
  },

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  countryCode: {
    height: 48,
    width: 60,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  countryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#000',
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF5FF',
    padding: 12,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 20,
  },
  lockIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#868686',
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
