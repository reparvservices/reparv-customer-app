import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export const ModalBox = ({
  title,
  value,
  setValue,
  onCancel,
  onApply,
}) => (
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      {/* Title */}
      <Text style={styles.modalTitle}>{title}</Text>
      <Text style={styles.modalSubtitle}>
        Enter value
      </Text>

      {/* Input */}
      <TextInput
        style={styles.modalInput}
        keyboardType="numeric"
        placeholder="Enter value"
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={setValue}
      />

      {/* Actions */}
      <View style={styles.modalActions}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onApply} style={styles.applyBtn}>
          <Text style={styles.applyText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBox: {
    width: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 10},
    elevation: 10,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 14,
  },

  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    backgroundColor: '#FAFAFF',
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 14,
    marginTop: 20,
  },

  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  cancelText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 14,
  },

  applyBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 6},
    elevation: 6,
  },

  applyText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
