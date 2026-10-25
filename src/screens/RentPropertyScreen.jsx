import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  ImageBackground,
  StatusBar,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import WhiteArrowIcon from '../assets/image/onboarding/arrow.svg';
import ArrowIcon from '../assets/image/home/actioncard/arrow.svg';
import BackIcon from '../assets/image/new-property/back-icon.svg';

import FlatImg from '../assets/image/rent-property/flat.png';
import VillaImg from '../assets/image/rent-property/villa.png';
import IndependentHouseImg from '../assets/image/rent-property/independent-house.png';
import ShopImg from '../assets/image/rent-property/shop.png';
import OfficeImg from '../assets/image/rent-property/office.png';
import GodownImg from '../assets/image/rent-property/godown.png';
import ShowroomImg from '../assets/image/rent-property/showroom.png';
import OpenLandImg from '../assets/image/rent-property/open-land.png';
import BgImg from '../assets/image/rent-property/background-img.png';
import BottomBgImg from '../assets/image/rent-property/rentbottom-bg.png';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';

const {width} = Dimensions.get('window');

export default function RentPropertyScreen() {
  const navigation = useNavigation();

  const cardData = [
    {title: 'Flat For Rent', img: FlatImg, ptype: 'RentalFlat'},
    {title: 'Villa For Rent', img: VillaImg, ptype: 'RentalPlot'},
    {title: 'Office For Rent', img: OfficeImg, ptype: 'RentalOffice'},
    {
      title: 'Independent House For Rent',
      img: IndependentHouseImg,
      ptype: 'RentalFarmHouse',
    },
    {title: 'Shop For Rent', img: ShopImg, ptype: 'RentalShop'},
    {
      title: 'Rental Farm House',
      img: IndependentHouseImg,
      ptype: 'RentalFarmHouse',
    },
    {title: 'Godown For Rent', img: GodownImg, ptype: 'RentalGodown'},
    {title: 'Showroom For Rent', img: ShowroomImg, ptype: 'RentalShowroom'},
    {title: 'Open Land For Rent', img: OpenLandImg, ptype: 'Lease'},
  ];

  // const cardData = [
  //   {title: 'Rental Flat', img: FlatImg, ptype: 'RentalFlat'},
  //   {title: 'Rental Plot', img: RowHouseImg, ptype: 'RentalPlot'},
  //   {title: 'Rental Office', img: OfficeImg, ptype: 'RentalOffice'},
  //   {title: 'Rental Farm House', img: FarmHouseImg, ptype: 'RentalFarmHouse'},
  //   {title: 'Rental Shop', img: ShopImg, ptype: 'RentalShop'},
  //   {title: 'Resale Godown', img: GodownImg, ptype: 'Lease'},
  //   {title: 'Resale Farm', img: ResaleFarmHouseImg, ptype: 'FarmLand'},
  //   {title: 'Resale Bungalow', img: BungalowImg, ptype: 'Resale'},
  // ];

  const formatTitle = title => {
    const words = title.split(' ');
    let result = '';
    for (let i = 0; i < words.length; i += 2) {
      result += words.slice(i, i + 2).join(' ') + '\n';
    }
    return result.trim();
  };

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

        <Text style={styles.headerTitle}>Properties on Rent</Text>

        <View style={{width: 22}} />
      </View>

      {/* CARDS */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.wrapper, {paddingBottom: 32}]}>
        {cardData.map((item, index) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('PropertyListScreen', {
                ptype: item?.ptype,
              })
            }
            key={index}
            activeOpacity={0.85}
            style={styles.card}>
            <ImageBackground
              source={BgImg}
              style={styles.cardBg}
              imageStyle={styles.cardBgImage}
              resizeMode="cover">
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
            </ImageBackground>
          </TouchableOpacity>
        ))}

        <TouchableOpacity activeOpacity={0.9} style={styles.bottomCard}>
          <ImageBackground
            source={BottomBgImg}
            style={styles.bottomBg}
            imageStyle={styles.bottomBgImg}
            resizeMode="cover">
            <View style={styles.bottomLeft}>
              <LinearGradient
                colors={['#EDE0FF', '#DFCEF4']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.pgTagBorder}>
                <View style={styles.pgTag}>
                  <Text style={styles.pgTagText}>PG Rentals</Text>
                </View>
              </LinearGradient>

              <Text style={styles.bottomTitle}>Rental PG</Text>
              <Text style={styles.bottomSub}>
                For Students & Working{'\n'}Professionals
              </Text>

              <LinearGradient
                colors={['#6C43C9', '#3D1C7B']}
                start={{x: 0.5, y: 0}}
                end={{x: 0.5, y: 1}}
                style={styles.bottomBtn}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('NoPropertyFound')}>
                  <Text style={styles.bottomBtnText}>Explore PG Options</Text>
                </TouchableOpacity>
                <WhiteArrowIcon width={14} height={14} />
              </LinearGradient>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FF',
  },
  header: {
    height: 56,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: 'SegoeUI-Regular',
    fontSize: 16,

    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
    color: '#000',
  },
  wrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  card: {
    width: (width - 18 * 3) / 2,
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 16,
    boxShadow: '0px 4px 6px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  cardBg: {
    flex: 1,
    paddingVertical: 12,
  },
  cardBgImage: {
    borderRadius: 16,
  },
  row1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 6,
  },

  title: {
    fontSize: 16,
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
    color: '#3F2D62',
    flex: 1,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
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
    transform: [{translateY: -18}],
    width: 8,
    height: 36,
    backgroundColor: '#040404ff',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  bottomCard: {
    width: width - 36,
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: 24,
    borderRadius: 18,
    overflow: 'hidden',
  },
  bottomBg: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 170,
  },
  bottomBgImg: {
    borderRadius: 18,
  },
  bottomLeft: {
    flex: 1,
  },
  pgTagBorder: {
    padding: 1,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
    boxShadow: '0px 4px 6px rgba(0,0,0,0.08)',
  },
  pgTag: {
    backgroundColor: '#DFCEF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pgTagText: {
    fontSize: 16,
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
    color: '#3F2D62',
  },
  bottomTitle: {
    fontSize: 24,
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
    color: '#FFFFFF',
  },
  bottomSub: {
    fontSize: 12,
    color: '#fff',
    marginTop: 6,
    marginBottom: 12,
  },
  bottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  bottomBtnText: {
    color: '#FFF',
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
    fontSize: 13,
    marginRight: 6,
  },
  bottomImage: {
    width: 130,
    height: 140,
  },
});
