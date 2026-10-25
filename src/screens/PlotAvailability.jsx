import {ChevronDown} from 'lucide-react-native';
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import PropertyPlotDetailsView from '../components/PropertyDetails/plotDetailsModel';
import {formatIndianAmount} from '../utils/formatIndianAmount';

const {width} = Dimensions.get('window');

// Skeleton Components
const SkeletonBox = ({width, height, style}) => (
  <View style={[styles.skeleton, {width, height}, style]} />
);

const PlotAvailabilitySkeleton = () => (
  <View style={styles.container}>
    {/* Header Skeleton */}
    <View style={styles.header}>
      <SkeletonBox width={150} height={24} />
      <SkeletonBox width={32} height={32} style={{borderRadius: 16}} />
    </View>

    {/* Tabs Skeleton */}
    <View style={{flexDirection: 'row', gap: 12, marginBottom: 16}}>
      <SkeletonBox width={100} height={60} style={{borderRadius: 12}} />
      <SkeletonBox width={100} height={60} style={{borderRadius: 12}} />
      <SkeletonBox width={100} height={60} style={{borderRadius: 12}} />
    </View>

    {/* Legend Skeleton */}
    <View style={{flexDirection: 'row', gap: 16, marginBottom: 12}}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
        <SkeletonBox width={10} height={10} style={{borderRadius: 5}} />
        <SkeletonBox width={60} height={14} />
      </View>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
        <SkeletonBox width={10} height={10} style={{borderRadius: 5}} />
        <SkeletonBox width={60} height={14} />
      </View>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
        <SkeletonBox width={10} height={10} style={{borderRadius: 5}} />
        <SkeletonBox width={60} height={14} />
      </View>
    </View>

    {/* Filter Skeleton */}
    <View style={{flexDirection: 'row', gap: 8, marginBottom: 16}}>
      <SkeletonBox width={60} height={32} style={{borderRadius: 20}} />
      <SkeletonBox width={80} height={32} style={{borderRadius: 20}} />
      <SkeletonBox width={70} height={32} style={{borderRadius: 20}} />
      <SkeletonBox width={70} height={32} style={{borderRadius: 20}} />
    </View>

    {/* Grid Skeleton */}
    <View style={styles.unitsGrid}>
      {[...Array(16)].map((_, i) => (
        <SkeletonBox
          key={i}
          width={(width - 60) / 4}
          height={60}
          style={{borderRadius: 12}}
        />
      ))}
    </View>
  </View>
);

export default function PlotAvailabilityModal({
  seoSlug,
  visible,
  onClose,
  apiData = [],
  onBook,
  propertyCategory,
}) {
  const [filter, setFilter] = useState('All');
  const [selectedKhasra, setSelectedKhasra] = useState(null);
  const [allUnits, setAllUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isPlotCategory = ['NewPlot', 'CommercialPlot', 'RentalPlot'].includes(
    propertyCategory,
  );
  const unitLabel = isPlotCategory ? 'Plot' : 'Flat';

  const getGroupKey = item => item.khasrano || item.wing;

  useEffect(() => {
    if (apiData.length > 0) {
      setIsLoading(true);
      setTimeout(() => {
        if (!selectedKhasra) {
          setSelectedKhasra(getGroupKey(apiData[0]));
        }
        setIsLoading(false);
      }, 500);
    } else {
      setIsLoading(false);
    }
  }, [apiData]);

  useEffect(() => {
    if (!selectedKhasra) return;

    setIsLoading(true);
    setTimeout(() => {
      const groupObj = apiData.find(
        item => getGroupKey(item) === selectedKhasra,
      );
      if (!groupObj || !groupObj.rows?.length) {
        setAllUnits([]);
      } else {
        setAllUnits(groupObj.rows);
      }
      setSelectedUnit(null);
      setIsLoading(false);
    }, 300);
  }, [selectedKhasra]);

  const applyFilter = unit => {
    if (filter === 'All') return true;
    return unit.status === filter;
  };

  const filteredUnits = allUnits.length > 0 ? allUnits.filter(applyFilter) : [];

  const getUnitNo = unit => (isPlotCategory ? unit.plotno : unit.flatno);

  const renderUnit = unit => {
    const unitNo = getUnitNo(unit);

    const selected = selectedUnit && getUnitNo(selectedUnit) === unitNo;

    const isBooked = unit.status === 'Booked';
    const isReserved = unit.status === 'Reserved';
    const isDisabled = isBooked || isReserved;

    return (
      <TouchableOpacity
        key={unitNo}
        disabled={isDisabled}
        onPress={() => setSelectedUnit(unit)}
        style={[
          styles.unitBox,
          isBooked && styles.bookedBox,
          isReserved && styles.reservedBox,
          selected && styles.selectedBox,
        ]}>
        <Text style={styles.unitLabel}>
          {unitLabel} {unitNo}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          {isLoading ? (
            <View style={[styles.container, {paddingBottom: 20}]}>
              <PlotAvailabilitySkeleton />
            </View>
          ) : apiData.length === 0 ? (
            // ── No data at all ──────────────────────────────────────────────
            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.title}>{unitLabel} Availability</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Text style={styles.close}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏠</Text>
                <Text style={styles.emptyTitle}>No Data Available</Text>
                <Text style={styles.emptySubtitle}>
                  Availability information for this property has not been added
                  yet. Please check back later.
                </Text>
              </View>
            </View>
          ) : (
            // ── Normal content ───────────────────────────────────────────────
            <View style={styles.container}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>{unitLabel} Availability</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Text style={styles.close}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Khasra/Wing Tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsContainer}>
                {apiData?.length > 0 &&
                  apiData.map(item => {
                    const value = getGroupKey(item);
                    const isActive = selectedKhasra === value;
                    return (
                      <TouchableOpacity
                        key={value}
                        onPress={() => setSelectedKhasra(value)}
                        style={[styles.tab, isActive && styles.tabActive]}>
                        <Text
                          style={[
                            styles.tabText,
                            isActive && styles.tabTextActive,
                          ]}>
                          {isPlotCategory ? 'KHASRA' : 'WING'}
                        </Text>
                        <Text
                          style={[
                            styles.tabNumber,
                            isActive && styles.tabNumberActive,
                          ]}>
                          {value}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>

              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, {backgroundColor: '#22C55E'}]} />
                  <Text style={styles.legendText}>Available</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, {backgroundColor: '#F59E0B'}]} />
                  <Text style={styles.legendText}>Reserved</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, {backgroundColor: '#EF4444'}]} />
                  <Text style={styles.legendText}>Booked</Text>
                </View>
              </View>

              {/* Status Filter */}
              <View style={styles.filterRow}>
                {['All', 'Available', 'Reserved', 'Booked'].map(f => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFilter(f)}
                    style={[
                      styles.filterBtn,
                      filter === f && styles.filterActive,
                    ]}>
                    <Text
                      style={[
                        styles.filterText,
                        filter === f && styles.filterTextActive,
                      ]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Units Grid */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.gridContainer}>
                {filteredUnits.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🏠</Text>
                    <Text style={styles.emptyTitle}>No Units Found</Text>
                    <Text style={styles.emptySubtitle}>
                      {filter !== 'All'
                        ? `No ${filter.toLowerCase()} units in this section.`
                        : 'No units available for this section.'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.unitsGrid}>
                    {filteredUnits.map(renderUnit)}
                  </View>
                )}
              </ScrollView>

              {/* Selected Unit Footer */}
              {selectedUnit && (
                <View style={styles.footer}>
                  <View>
                    <Text style={styles.selectedLabel}>
                      {unitLabel} {getUnitNo(selectedUnit)}
                    </Text>
                    <Text style={styles.selectedArea}>
                      {selectedUnit.payablearea} sq.ft
                    </Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <Text style={styles.selectedPrice}>
                      ₹{formatIndianAmount(selectedUnit.totalcost)}
                    </Text>
                    <TouchableOpacity
                      style={styles.viewBtn}
                      onPress={() => setOpen(true)}>
                      <Text style={styles.viewBtnText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>

      {/* Details Modal */}
      <Modal
        visible={open}
        animationType="slide"
        transparent
        statusBarTranslucent>
        <View style={styles.detailsOverlay}>
          <View style={styles.detailsContainer}>
            <PropertyPlotDetailsView
              propertyInfo={selectedUnit}
              seoSlug={seoSlug}
              onBack={() => setOpen(false)}
              onClose={() => setOpen(false)}
              onBook={onBook}
              onDownload={() => {}}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '92%',
  },

  skeleton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
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
  close: {
    fontSize: 18,
    color: '#666',
  },

  tabsContainer: {
    paddingBottom: 16,
    gap: 12,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    minWidth: 100,
    minHeight: 60,
    marginBottom: 20,
  },
  tabActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: '#E9D5FF',
  },
  tabNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginTop: 2,
  },
  tabNumberActive: {
    color: '#FFF',
  },

  legend: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterActive: {
    backgroundColor: '#7C3AED',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFF',
  },

  gridContainer: {
    paddingBottom: 20,
  },
  unitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },

  unitBox: {
    width: (width - 60) / 4,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookedBox: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  reservedBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  selectedBox: {
    backgroundColor: '#F5F3FF',
    borderColor: '#7C3AED',
    borderWidth: 3,
  },
  unitLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginBottom: 16,
  },
  selectedLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  selectedArea: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  selectedPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: 8,
  },
  viewBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  viewBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Empty State ────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  detailsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  detailsContainer: {
    height: '92%',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
});
