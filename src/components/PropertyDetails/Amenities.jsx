import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';

const {width} = Dimensions.get('window');
const ITEM_WIDTH = width / 2 - 32;

export const Amenities = ({featuresData = [], benefitsData = []}) => {
  const [activeTab, setActiveTab] = useState('AMENITIES');

  const filterData = data =>
    data.filter(item => {
      if (!item?.value) return false;
      const val = String(item.value).trim();
      return val !== '' && val.toUpperCase() !== 'NO' && val !== '—';
    });

  const amenities = filterData(featuresData);
  const benefits = filterData(benefitsData);

  const activeData = activeTab === 'AMENITIES' ? amenities : benefits;

  if (!amenities.length && !benefits.length) return null;

  return (
    <View style={styles.wrapper}>
      {/* Title */}
      <Text style={styles.sectionTitle}>Features & Amenities</Text>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['AMENITIES', 'BENEFITS'].map(tab => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={styles.tabBtn}
              activeOpacity={0.7}>
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab === 'AMENITIES' ? 'Amenities' : 'Benefits'}
              </Text>

              {isActive && <View style={styles.activeUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {activeData.map((item, index) => {
          const Icon = item.icon;
          return (
            <View key={index} style={styles.gridItem}>
              {Icon && <Icon size={16} color="#6C2BD9" />}
              <Text style={styles.gridText}>{item.value}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontFamily: 'SegoeUI-Bold',
    fontWeight: '700',
    color: '#111',
    marginHorizontal: 16,
    marginBottom: 10,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },

  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
    marginHorizontal: 16,
    marginBottom: 14,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },

  tabBtn: {
    marginRight: 24,
  },

  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E8E',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },

  activeTabText: {
    color: '#6C2BD9',
    fontWeight: '600',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },

  activeUnderline: {
    height: 3,
    width: 100,
    backgroundColor: '#6C2BD9',
    marginTop: 6,
    borderRadius: 2,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },

  gridItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },

  gridText: {
    fontSize: 12,
    fontFamily: 'SegoeUI-Bold',
    fontWeight: '500',
    color: '#111',
    marginLeft: 8,
    flex: 1,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
});
