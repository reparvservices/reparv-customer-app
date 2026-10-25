import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

import ArrowIcon from '../assets/image/home/actioncard/arrow.svg';
import BackIcon from '../assets/image/new-property/back-icon.svg';

// New Property Images
import FlatImg from '../assets/image/new-property/flat.png';
import ShopImg from '../assets/image/new-property/shop.png';
import OfficeImg from '../assets/image/new-property/office-space.png';
import FarmHouseImg from '../assets/image/new-property/farm-house.png';
import LandImg from '../assets/image/new-property/house.png';
import Plot from '../assets/image/new-property/newplot.png';
import Farm from '../assets/image/new-property/farm.png';
import Industry from '../assets/image/new-property/industry.png';

// Resale Images
import ResaleFlatImg from '../assets/image/resale-property/resale-flat.png';
import ResaleRowHouseImg from '../assets/image/resale-property/row-house.png';
import ResaleOfficeImg from '../assets/image/resale-property/office.png';
import ResaleFarmHouseImg from '../assets/image/resale-property/farm-house.png';
import ResaleGodownImg from '../assets/image/resale-property/godown.png';
import ResaleFarmImg from '../assets/image/resale-property/resale-farm.png';
import ResaleBungalowImg from '../assets/image/resale-property/bungalow.png';
import ResaleShopImg from '../assets/image/resale-property/shop.png';

const {width} = Dimensions.get('window');
const CARD_W = (width - 18 * 3) / 2;

const newCardData = [
  {title: 'Buy New Flat', img: FlatImg, ptype: 'NewFlat'},
  {title: 'Buy New Plot', img: Plot, ptype: 'NewPlot'},
  {title: 'Buy New Shop', img: ShopImg, ptype: 'NewShop'},
  {title: 'Buy Row House', img: LandImg, ptype: 'RowHouse'},
  {title: 'Buy New Farm Land', img: Farm, ptype: 'FarmLand'},
  {title: 'Buy New Farm House', img: FarmHouseImg, ptype: 'FarmHouse'},
  {title: 'Buy Commercial Flat', img: OfficeImg, ptype: 'CommercialFlat'},
  {title: 'Buy Commercial Plot', img: Plot, ptype: 'CommercialPlot'},
  {title: 'Buy Industrial Space', img: Industry, ptype: 'IndustrialSpace'},
];

const resaleCardData = [
  {title: 'Resale Flat', img: ResaleFlatImg, ptype: 'ResaleFlat'},
  {title: 'Resale Office', img: ResaleOfficeImg, ptype: 'ResaleOffice'},
  {title: 'Resale Farm House', img: ResaleFarmHouseImg, ptype: 'ResaleHouse'},
  {title: 'Resale Shop', img: ResaleShopImg, ptype: 'ResaleShop'},
  {title: 'Resale Godown', img: ResaleGodownImg, ptype: 'ResaleGodown'},
  {title: 'Resale Farm Land', img: ResaleFarmImg, ptype: 'ResaleFarmLand'},
  {title: 'Resale Row House', img: ResaleRowHouseImg, ptype: 'ResaleRowHouse'},
  {title: 'Resale Bungalow', img: ResaleBungalowImg, ptype: 'ResaleBungalow'},
];

const formatTitle = title => {
  const words = title.split(' ');
  let result = '';
  for (let i = 0; i < words.length; i += 2) {
    result += words.slice(i, i + 2).join(' ') + '\n';
  }
  return result.trim();
};

export default function NewPropertyScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('new');

  const cardData = activeTab === 'new' ? newCardData : resaleCardData;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="#FAF8FF"
        barStyle="dark-content"
        translucent={false}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackIcon width={22} height={22} />
        </TouchableOpacity>
        <Text
          style={styles.headerTitle}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.9}>
          Buy Property
        </Text>
        <View style={{width: 22}} />
      </View>

      {/* TAB BAR */}
      <View style={styles.tabWrapper}>
        <View style={styles.tabContainer}>
          {['new', 'resale'].map(tab => {
            const isActive = activeTab === tab;
            const label = tab === 'new' ? 'New' : 'Resale';
            const count =
              tab === 'new' ? newCardData.length : resaleCardData.length;
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.85}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab)}>
                {isActive && <View style={styles.tabDot} />}
                <Text
                  style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {label}
                </Text>
                {isActive && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* CARDS */}
      <ScrollView
        key={activeTab}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.wrapper}>
        {cardData.map((item, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.85}
            style={styles.card}
            onPress={() =>
              navigation.navigate('PropertyListScreen', {ptype: item.ptype})
            }>
            <View style={styles.row1}>
              <Text style={styles.title}>{formatTitle(item.title)}</Text>
              <View style={styles.circle}>
                <ArrowIcon width={16} height={16} />
              </View>
            </View>
            <View style={styles.row2}>
              <Image
                source={item.img}
                style={styles.image}
                resizeMode="contain"
              />
              <View style={styles.verticalLine} />
            </View>
          </TouchableOpacity>
        ))}
        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FF',
  },

  /* ── Header ── */
  header: {
    height: 56,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'SegoeUI-Bold',
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  /* ── Tab Bar ── */
  tabWrapper: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEEBF8',
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(94,35,220,0.1)',
  },
  tabDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#5E23DC',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'SegoeUI-Bold',
    color: '#9585C0',
  },
  tabTextActive: {
    color: '#3F2D62',
  },
  tabBadge: {
    backgroundColor: '#5E23DC',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  tabBadgeText: {
    fontSize: 11,
    fontFamily: 'SegoeUI-Bold',
    color: '#FFFFFF',
  },

  /* ── Grid ── */
  wrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  card: {
    width: CARD_W,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  row1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  title: {
    fontSize: 15,
    fontFamily: 'SegoeUI-Bold',
    fontWeight: '800',
    color: '#3F2D62',

    flex: 1,
    flexShrink: 1,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EEE8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row2: {
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: 140,
    height: 110,
  },
  verticalLine: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{translateY: -24}],
    width: 8,
    height: 36,
    backgroundColor: '#5E23DC',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
});
