import React, {useState} from 'react';
import {API_BASE_URL} from '../../config/api';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ToastAndroid,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import logo from '../../assets/image/common/logo.png';

const PropertyUploadModal = ({
  visible,
  onClose,
  propertyid,
  category,
  user,
}) => {
  const [form, setForm] = useState({
    fullname: user?.fullname || '',
    phone: user?.contact || '',
  });

  const [otp, setOtp] = useState('');
  const [serverOtp, setServerOtp] = useState(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = API_BASE_URL;

  // ✅ Check if number changed
  const isSameNumber = form.phone === user?.contact;

  const onChange = (key, value) => {
    setForm(prev => ({...prev, [key]: value}));

    // Reset OTP if phone changes
    if (key === 'phone') {
      setIsOtpSent(false);
      setOtp('');
      setServerOtp(null);
    }
  };

  // ✅ Send OTP
  const sendOtp = async ({phone}) => {
    ToastAndroid.show('Sending OTP...', ToastAndroid.SHORT);

    try {
      const response = await fetch(`${API_URL}/customerapp/enquiry/send-otp`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({phone}),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.log('Send OTP API Error:', error);
      return {success: false};
    }
  };

  const handleSendOtp = async () => {
    if (!form.phone || form.phone.length !== 10) {
      ToastAndroid.show(
        'Enter valid 10 digit mobile number',
        ToastAndroid.LONG,
      );
      return;
    }

    try {
      setLoading(true);

      const response = await sendOtp({phone: form.phone});

      if (response?.success) {
        setServerOtp(response?.otp); // old logic
        setIsOtpSent(true);
        ToastAndroid.show('OTP Sent Successfully', ToastAndroid.LONG);
      } else {
        ToastAndroid.show(
          response?.message || 'Failed to send OTP',
          ToastAndroid.LONG,
        );
      }
    } catch (error) {
      console.log(error);
      ToastAndroid.show('Error sending OTP', ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Submit Enquiry
  const handleSubmit = async () => {
    if (!form.fullname) {
      ToastAndroid.show('Enter your name', ToastAndroid.LONG);
      return;
    }

    if (!propertyid || !category) {
      ToastAndroid.show('Missing property data', ToastAndroid.LONG);
      return;
    }

    // If number changed → require OTP
    if (!isSameNumber) {
      if (!isOtpSent) {
        ToastAndroid.show(
          'Please verify mobile number first',
          ToastAndroid.LONG,
        );
        return;
      }

      if (otp !== serverOtp) {
        ToastAndroid.show('Invalid OTP', ToastAndroid.LONG);
        return;
      }
    }

    const payload = {
      fullname: form.fullname,
      phone: form.phone,
      propertyid,
      category,
      user_id: user?.id || null,
    };

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/customerapp/enquiry/add`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed');

      ToastAndroid.show(
        'Property Enquiry Sent Successfully!',
        ToastAndroid.LONG,
      );

      // Reset state
      setOtp('');
      setServerOtp(null);
      setIsOtpSent(false);

      onClose();
    } catch (error) {
      console.error(error);
      ToastAndroid.show('Something went wrong', ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Image source={logo} style={styles.logoImage} />
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Conveniently Book a Property Visit</Text>

          {/* Full Name */}
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            placeholder="Enter Your Full Name*"
            style={styles.input}
            value={form.fullname}
            onChangeText={text => onChange('fullname', text)}
          />

          {/* Phone */}
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            placeholder="Enter Mobile Number*"
            keyboardType="phone-pad"
            maxLength={10}
            style={[styles.input, isOtpSent && styles.disabledInput]}
            value={form.phone}
            editable={!isOtpSent}
            onChangeText={text => onChange('phone', text)}
          />

          {/* Send OTP Button (Only if number changed) */}
          {!isSameNumber && !isOtpSent && (
            <TouchableOpacity
              style={styles.otpButton}
              onPress={handleSendOtp}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.otpText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          )}

          {/* OTP Input */}
          {!isSameNumber && isOtpSent && (
            <>
              <Text style={styles.label}>Enter OTP</Text>
              <TextInput
                placeholder="Enter OTP"
                keyboardType="number-pad"
                maxLength={6}
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
              />
            </>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Book Site Visit Now</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.helper}>
            By registering, you’ll get a call from our agent.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default PropertyUploadModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoImage: {
    height: 38,
    width: 110,
  },
  close: {
    fontSize: 22,
    color: '#111',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    marginTop: 8,
    marginBottom: 10,
  },
  label: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 6,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 16,
    color: '#111',
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  otpButton: {
    marginTop: 12,
    height: 54,
    backgroundColor: '#7340c5',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  otpText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  button: {
    height: 54,
    backgroundColor: '#6D28D9',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  helper: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
  },
});
