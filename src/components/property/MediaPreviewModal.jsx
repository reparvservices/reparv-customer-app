import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import {X, Download, FileText} from 'lucide-react-native';

const MediaPreviewModal = ({visible, onClose, uri}) => {
  const isPdf = uri?.toLowerCase().endsWith('.pdf');
  const handleOpen = url => {
    if (!url) {
      // replace with your toast util
      console.warn('No file URL available');
      return;
    }
    Linking.openURL(url);
  };

  if (!uri) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.card}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={{color: '#6B7280', marginTop: 30}}>
              No file available
            </Text>
          </View>
        </View>
      </Modal>
    );
  }
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={22} color="#fff" />
          </TouchableOpacity>

          {/* Content */}
          {isPdf ? (
            <View style={styles.pdfContainer}>
              <FileText size={56} color="#6D28D9" />
              <Text style={styles.pdfTitle}>PDF Preview</Text>
              <Text style={styles.pdfSub}>
                This file can’t be previewed here
              </Text>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => handleOpen(uri)}>
                <Download size={18} color="#fff" />
                <Text style={styles.btnText}>Open PDF</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Image source={{uri}} style={styles.image} resizeMode="contain" />

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => handleOpen(uri)}>
                <Download size={18} color="#fff" />
                <Text style={styles.btnText}>Download</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default MediaPreviewModal;
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },

  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },

  image: {
    width: '100%',
    height: 260,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    marginBottom: 20,
  },

  pdfContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },

  pdfTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    marginTop: 10,
  },

  pdfSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6D28D9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },

  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
