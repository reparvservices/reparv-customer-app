import React, {useState} from 'react';
import {API_BASE_URL} from '../../config/api';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {X, ChevronDown, HelpCircle} from 'lucide-react-native';
import {useSelector} from 'react-redux';

const ContactUs = ({visible, onClose}) => {
  const {user} = useSelector(state => state.auth);

  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!description) {
      Alert.alert('Error', 'Please enter your question');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/project-partner/profile/contact`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: user?.fullname || 'Reparv User',
            contact: user?.contact,
            message: description,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          'Your message has been sent successfully. Our team will contact you soon.',
        );
        setDescription('');
        onClose();
      } else {
        Alert.alert('Error', data.message || 'Something went wrong');
      }
    } catch (error) {
      console.log('Contact form error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Ask Questions </Text>
              <Text style={styles.subtitle}>
                We will get back to you within 24 hours
              </Text>
            </View>

            <TouchableOpacity onPress={onClose}>
              <X size={22} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={styles.label}>Enter Question Description</Text>
          <TextInput
            multiline
            value={description}
            onChangeText={setDescription}
            placeholder="send your question"
            placeholderTextColor="#999"
            style={styles.textArea}
          />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && {opacity: 0.6}]}
            disabled={loading}
            onPress={handleSubmit}>
            <Text style={styles.submitText}>
              {loading ? 'Sending...' : 'Send Question'}
            </Text>
          </TouchableOpacity>

          {/* <Text style={styles.footerText}>
            Your ticket number will be generated instantly
          </Text> */}
        </View>
      </View>
    </Modal>
  );
};

export default ContactUs;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  label: {
    marginTop: 16,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownText: {
    color: '#999',
    fontSize: 14,
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  attachmentBox: {
    borderWidth: 1,
    borderColor: '#D0C2F5',
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  uploadText: {
    color: '#8A38F5',
    fontWeight: '600',
  },
  uploadHint: {
    fontSize: 12,
    color: '#999',
  },
  submitBtn: {
    backgroundColor: '#8A38F5',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  submitText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 12,
    color: '#777',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    marginTop: 6,
    overflow: 'hidden',
  },

  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },

  dropdownItemText: {
    fontSize: 14,
    color: '#000',
  },
});
