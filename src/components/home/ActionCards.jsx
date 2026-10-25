import React, {useMemo} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {AUTH_ACTION_TYPES, requireAuth} from '../../utils/authGuard';
import {ArrowUpRight} from 'lucide-react-native';
import {Fonts} from '../../theme/fonts';
import {moderateScale, scaleFont} from '../../utils/responsive';

import ListPropertyImg from '../../assets/image/home/explore/list-property.webp';
import BuyPropertyImg from '../../assets/image/home/explore/buy-property.webp';
import RentPropertyImg from '../../assets/image/home/explore/rent-property.webp';
import CommercialPropertyImg from '../../assets/image/home/explore/commercial-property.webp';

// Mirrors the reparv.in hero action cards (website: components/home/hero/PropertyActionCard.jsx)
const cardData = [
  {
    title: 'List Property',
    description: 'Post your property and reach genuine buyers or tenants.',
    image: ListPropertyImg,
    screen: 'OldProperty',
    params: {mode: 'add', type: 'sell'},
    requiresAuth: true,
  },
  {
    title: 'Buy Properties',
    description: 'Explore properties that match your needs.',
    image: BuyPropertyImg,
    screen: 'PropertyListScreen',
    params: {listingGroup: 'buy'},
  },
  {
    title: 'Rent Properties',
    description: 'Find the right rental space in your preferred location.',
    image: RentPropertyImg,
    screen: 'PropertyListScreen',
    params: {listingGroup: 'rent'},
  },
  {
    title: 'Commercial Properties',
    description:
      'Discover shops, offices and commercial spaces for your business.',
    image: CommercialPropertyImg,
    screen: 'PropertyListScreen',
    params: {ptype: 'CommercialFlat'},
  },
];

function createStyles(width, fontScale) {
  const ms = (size, factor = 0.35) => moderateScale(size, width, factor);
  const sf = (size, factor = 0.35) => scaleFont(size, width, fontScale, factor);

  const horizontalPadding = ms(16, 0.3);
  const cardGap = ms(12, 0.3);
  const cardWidth = (width - horizontalPadding * 2 - cardGap) / 2;

  return StyleSheet.create({
    section: {
      marginTop: 4,
      marginBottom: 10,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: ms(20, 0.25),
      marginBottom: ms(14, 0.25),
    },
    sectionTitle: {
      fontSize: sf(18),
      fontFamily: Fonts.bold,
      fontWeight: '700',
      color: '#1F2937',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: horizontalPadding,
      gap: cardGap,
    },
    card: {
      width: cardWidth,
      backgroundColor: '#FFFFFF',
      borderRadius: ms(16, 0.2),
      borderWidth: 1,
      borderColor: '#ECEEF3',
      padding: ms(14, 0.25),
      ...Platform.select({
        ios: {
          shadowColor: '#1E0A50',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.04,
          shadowRadius: 4,
        },
        android: {
          elevation: 1,
          shadowColor: '#94A3B8',
        },
      }),
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: ms(6, 0.25),
    },
    cardTitle: {
      flex: 1,
      fontSize: sf(15),
      lineHeight: sf(19),
      fontFamily: Fonts.bold,
      fontWeight: '700',
      color: '#3F2D62',
      ...Platform.select({android: {includeFontPadding: false}}),
    },
    arrowBadge: {
      width: ms(28, 0.25),
      height: ms(28, 0.25),
      borderRadius: ms(14, 0.25),
      backgroundColor: '#EDE3FF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardDescription: {
      marginTop: ms(6, 0.25),
      fontSize: sf(11.5),
      lineHeight: sf(15.5),
      fontFamily: Fonts.regular,
      color: '#64748B',
      ...Platform.select({android: {includeFontPadding: false}}),
    },
    imageWrap: {
      marginTop: 'auto',
      paddingTop: ms(10, 0.25),
      height: ms(106, 0.3),
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    image: {
      width: '100%',
      height: '100%',
    },
  });
}

export default function ActionCards() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);
  const {width, fontScale} = useWindowDimensions();
  const styles = useMemo(
    () => createStyles(width, fontScale),
    [width, fontScale],
  );

  const arrowIconPx = Math.round(moderateScale(15, width, 0.25));

  const handlePress = item => {
    if (
      item.requiresAuth &&
      !requireAuth(navigation, dispatch, auth, {
        type: AUTH_ACTION_TYPES.SELL_PROPERTY,
        params: item.params,
      })
    ) {
      return;
    }
    navigation.navigate(item.screen, item.params);
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Explore Options</Text>
      </View>

      <View style={styles.grid}>
        {cardData.map(item => (
          <TouchableOpacity
            key={item.title}
            style={styles.card}
            activeOpacity={0.88}
            onPress={() => handlePress(item)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.arrowBadge}>
                <ArrowUpRight
                  size={arrowIconPx}
                  color="#7029E8"
                  strokeWidth={2.2}
                />
              </View>
            </View>

            <Text style={styles.cardDescription}>{item.description}</Text>

            <View style={styles.imageWrap}>
              <Image
                source={item.image}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
