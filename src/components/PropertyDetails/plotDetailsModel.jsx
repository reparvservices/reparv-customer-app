import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {X} from 'lucide-react-native';

// Skeleton Components
const SkeletonBox = ({width, height, style}) => (
  <View style={[styles.skeleton, {width, height}, style]} />
);

const PropertyDetailsSkeleton = () => (
  <View style={styles.container}>
    {/* Header Skeleton */}
    <View style={styles.header}>
      <SkeletonBox width={150} height={24} />
      <SkeletonBox width={32} height={32} style={{borderRadius: 16}} />
    </View>

    {/* Details Rows Skeleton */}
    <View style={styles.scrollContent}>
      <View style={styles.detailsCard}>
        {[...Array(13)].map((_, i) => (
          <View key={i} style={styles.skeletonRow}>
            <SkeletonBox width={120} height={16} />
            <SkeletonBox width={100} height={16} />
          </View>
        ))}
        {/* Total Row Skeleton */}
        <View style={[styles.skeletonRow, {backgroundColor: '#F9FAFB'}]}>
          <SkeletonBox width={100} height={18} />
          <SkeletonBox width={120} height={20} />
        </View>
      </View>
    </View>

    {/* Footer Skeleton */}
    <View style={styles.footer}>
      <SkeletonBox width="100%" height={52} style={{borderRadius: 14}} />
    </View>
  </View>
);

export default function PropertyPlotDetailsView({
  propertyInfo,
  onClose,
  onBook,
}) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (propertyInfo) {
      // Simulate loading delay
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  }, [propertyInfo]);

  if (!propertyInfo) return null;

  const formatAmount = amount => {
    if (!amount) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const DetailRow = ({label, value}) => {
    if (!value || value === '₹0') return null;
    return (
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    );
  };

  if (isLoading) {
    return <PropertyDetailsSkeleton />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Property Details</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X size={20} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Details List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.detailsCard}>
          <DetailRow label="Mouza" value={propertyInfo.mouza} />
          <DetailRow label="Khasra No" value={propertyInfo.khasrano} />
          <DetailRow
            label={propertyInfo.plotno ? 'plot Number' : 'Flat Number'}
            value={propertyInfo.plotno || propertyInfo.flatno}
          />
          <DetailRow
            label={propertyInfo.plotno ? 'plot Facing' : 'Flat Facing'}
            value={propertyInfo.plotfacing || propertyInfo.flatfacing}
          />
          <DetailRow label="Plot Size" value={propertyInfo.plotsize} />
          <DetailRow
            label="Plot Area"
            value={
              propertyInfo.payablearea
                ? `${propertyInfo.payablearea} sq.ft.`
                : null
            }
          />
          <DetailRow
            label="Sqft Price"
            value={formatAmount(propertyInfo.sqftprice)}
          />
          <DetailRow
            label="Stamp Duty"
            value={formatAmount(propertyInfo.stampduty)}
          />
          <DetailRow
            label="Registration"
            value={formatAmount(propertyInfo.registration)}
          />
          <DetailRow
            label="Advocate Fee"
            value={formatAmount(propertyInfo.advocatefee)}
          />
          <DetailRow
            label="Maintenance"
            value={formatAmount(propertyInfo.maintenance)}
          />
          <DetailRow label="GST" value={formatAmount(propertyInfo.gst)} />
          <DetailRow label="Other" value={formatAmount(propertyInfo.other)} />

          {/* Total Price */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Price</Text>
            <Text style={styles.totalValue}>
              {formatAmount(propertyInfo.totalcost)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.bookBtn} onPress={onBook}>
          <Text style={styles.bookBtnText}>Book Site Visit Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },

  skeleton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },

  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    padding: 20,
  },
  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    textAlign: 'right',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7C3AED',
  },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bookBtn: {
    backgroundColor: '#6D28D9',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  bookBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
