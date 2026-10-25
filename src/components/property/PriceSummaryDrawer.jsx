import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {X, Info} from 'lucide-react-native';

const formatAmount = value => Number(value || 0).toLocaleString('en-IN');

const ItemRow = ({label, value, highlight}) => (
  <View style={styles.itemRow}>
    <Text style={styles.itemLabel}>{label}</Text>
    <Text style={[styles.itemValue, highlight && styles.highlightValue]}>
      {value}
    </Text>
  </View>
);

const InfoText = ({text}) => (
  <View style={styles.infoRow}>
    <Info size={13} color="#7C7C88" />
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

const PriceSummaryDrawer = ({visible, onClose, propertyData}) => {
  const basePrice = Number(propertyData?.totalOfferPrice || 0);
  const stampDuty = basePrice * (Number(propertyData?.stampDuty || 0) / 100);
  const registrationFee =
    basePrice * (Number(propertyData?.registrationFee || 0) / 100);
  const gst = basePrice * (Number(propertyData?.gst || 0) / 100);
  const advocateFee = Number(propertyData?.advocateFee || 0);
  const msebWater = Number(propertyData?.msebWater || 0);
  const maintenance = Number(propertyData?.maintenance || 0);
  const other = Number(propertyData?.other || 0);

  const totalCost =
    basePrice +
    stampDuty +
    registrationFee +
    gst +
    advocateFee +
    msebWater +
    maintenance +
    other;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Price Summary</Text>
              <Text style={styles.subtitle}>Complete cost breakdown</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color="#111" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}>
            <ItemRow
              label="Base Price"
              value={`₹ ${formatAmount(basePrice)}`}
              highlight
            />

            <ItemRow
              label="Stamp Duty"
              value={`${formatAmount(propertyData?.stampDuty)} %`}
            />
            <InfoText text="State government tax for property registration." />

            <ItemRow
              label="Registration Fee"
              value={` ${formatAmount(propertyData?.registrationFee)} %`}
            />
            <InfoText text="Legal fee to record ownership." />

            <ItemRow
              label="GST"
              value={` ${formatAmount(propertyData?.gst)} %`}
            />
            <InfoText text="Applicable only on under-construction properties." />

            <ItemRow
              label="Advocate Fee"
              value={`₹ ${formatAmount(advocateFee)}`}
            />

            <ItemRow
              label="MSEB & Water"
              value={`₹ ${formatAmount(msebWater)}`}
            />

            <ItemRow
              label="Maintenance"
              value={`₹ ${formatAmount(maintenance)}`}
            />

            <ItemRow
              label="Other Charges"
              value={
                propertyData?.other
                  ? `₹ ${formatAmount(propertyData?.other)}`
                  : '—'
              }
            />

            <View style={{height: 110}} />
          </ScrollView>

          {/* Sticky Total */}
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Property Price</Text>
            <Text style={styles.totalValue}>₹ {formatAmount(totalCost)}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PriceSummaryDrawer;
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#F1F1F5',
  },

  title: {
    fontSize: 20,
    fontFamily: 'Sugio-Bold',
    color: '#111',
  },

  subtitle: {
    fontSize: 13,
    fontFamily: 'Sugio-Regular',
    color: '#6B7280',
    marginTop: 2,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },

  itemLabel: {
    fontSize: 14,
    fontFamily: 'Sugio-Medium',
    color: '#374151',
  },

  itemValue: {
    fontSize: 14,
    fontFamily: 'Sugio-SemiBold',
    color: '#111',
  },

  highlightValue: {
    fontSize: 16,
    color: '#4F46E5',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 10,
  },

  infoText: {
    fontSize: 12,
    fontFamily: 'Sugio-Regular',
    color: '#7C7C88',
    flex: 1,
  },

  totalBox: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#EEF2FF',
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#E0E7FF',
  },

  totalLabel: {
    fontSize: 13,
    fontFamily: 'Sugio-Medium',
    color: '#4338CA',
  },

  totalValue: {
    fontSize: 24,
    fontFamily: 'Sugio-Bold',
    color: '#111',
    marginTop: 4,
  },
});
