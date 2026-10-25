import React, {use, useState} from 'react';
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

const ISSUE_TYPES = ['Technical Issue', 'Property Related', 'App Related'];

const RaiseSupportTicketModal = ({visible, onClose}) => {
  const {user} = useSelector(state => state.auth);
  const [selectedIssue, setSelectedIssue] = useState('');
  const [openDropdown, setOpenDropdown] = useState(false);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelect = item => {
    setSelectedIssue(item);
    setOpenDropdown(false);
  };

  const handleSubmit = async () => {
    if (!selectedIssue || !description) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/customerapp/ticket/add`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: user?.contact,
            issue: selectedIssue,
            details: description,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          `Ticket Created Successfully\nTicket No: ${data.ticketno}`,
        );
        setSelectedIssue('');
        setDescription('');
        onClose();
      } else {
        Alert.alert('Error', data.message || 'Something went wrong');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Network error');
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
              <Text style={styles.title}>Raise Support Ticket</Text>
              <Text style={styles.subtitle}>
                We will get back to you within 24 hours
              </Text>
            </View>

            <TouchableOpacity onPress={onClose}>
              <X size={22} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Issue Type */}
          <Text style={styles.label}>Issue Type</Text>

          <TouchableOpacity
            style={styles.dropdown}
            activeOpacity={0.8}
            onPress={() => setOpenDropdown(!openDropdown)}>
            <View style={styles.row}>
              <HelpCircle size={18} color="#8A38F5" />
              <Text
                style={[styles.dropdownText, selectedIssue && {color: '#000'}]}>
                {selectedIssue || 'Select issue type'}
              </Text>
            </View>
            <ChevronDown size={20} color="#888" />
          </TouchableOpacity>

          {openDropdown && (
            <View style={styles.dropdownList}>
              {ISSUE_TYPES.map(item => (
                <TouchableOpacity
                  key={item}
                  style={styles.dropdownItem}
                  onPress={() => handleSelect(item)}>
                  <Text style={styles.dropdownItemText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            multiline
            value={description}
            onChangeText={setDescription}
            placeholder="Describe Your issue in Detail. Mention Property details and Transaction ID in detail."
            placeholderTextColor="#999"
            style={styles.textArea}
          />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && {opacity: 0.6}]}
            disabled={loading}
            onPress={handleSubmit}>
            <Text style={styles.submitText}>
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Your ticket number will be generated instantly
          </Text>
        </View>
      </View>
    </Modal>
  );
};

export default RaiseSupportTicketModal;

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
    color: '#000',
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
