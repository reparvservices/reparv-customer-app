import {
  Linking,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import {Download, FileImage, FileText} from 'lucide-react-native';
import {getImageUri} from '../../utils/imageHandle';

/** Project brochure download card, like the website's PropertyBrochure. */
export const PropertyBrochure = ({brochureFile, propertyName}) => {
  if (!brochureFile) return null;

  const isPdf = /\.pdf(?:$|\?)/i.test(brochureFile);
  const Icon = isPdf ? FileText : FileImage;

  const openBrochure = async () => {
    try {
      await Linking.openURL(getImageUri(brochureFile));
    } catch {
      ToastAndroid.show('Unable to open brochure', ToastAndroid.SHORT);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.infoRow}>
        <View style={styles.iconBox}>
          <Icon size={26} color="#8A38F5" />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>Project Brochure</Text>
          <Text style={styles.subtitle}>
            Floor plans, specifications and price details of{' '}
            {propertyName || 'this property'}
            {isPdf ? ' (PDF)' : ''}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.downloadBtn}
        activeOpacity={0.85}
        onPress={openBrochure}>
        <Download size={16} color="white" />
        <Text style={styles.downloadText}>Download Brochure</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE7FB',
    gap: 14,
  },
  infoRow: {flexDirection: 'row', alignItems: 'center', gap: 14},
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F6F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {flex: 1},
  title: {fontSize: 17, fontWeight: '700', color: '#000'},
  subtitle: {fontSize: 13, color: '#868686', marginTop: 2},
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8A38F5',
    borderRadius: 12,
    paddingVertical: 12,
  },
  downloadText: {fontSize: 14, fontWeight: '700', color: 'white'},
});
