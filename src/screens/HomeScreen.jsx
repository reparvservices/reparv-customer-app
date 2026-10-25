import React, {useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  BackHandler,
  StatusBar,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {ChevronRight, MapPin, Bed, Bath, Maximize} from 'lucide-react-native';

// ── Updated Components ──
import HomeHeader from '../components/home/HomeHeader';
import ActionCards from '../components/home/ActionCards';
import RentProperty from '../components/home/RentProperty';
import NewLaunchShowcase from '../components/home/NewLauncCard';
import {SafeAreaView} from 'react-native-safe-area-context';
import {getImageUri} from '../utils/imageHandle';
import NearbyPropertiesBanner from '../components/home/NearbyPropertiesBanner';
import TrendingProperties from '../components/home/TrendingProperties';
import MapExplorerBanner from '../components/home/MapExplorerBanner';
import FutureLuxuryCard from '../components/home/FutureLuxuryCard';

/* ─────────────────────────────────────────────────────
   MAIN HOME SCREEN
───────────────────────────────────────────────────── */
export default function HomeScreen() {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };
      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => sub.remove();
    }, []),
  );

  return (
    <SafeAreaView style={{flex: 1}} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <HomeHeader />

          <NearbyPropertiesBanner navigation={navigation} />

          <ActionCards />
          <TrendingProperties />
          <View style={{padding: 13}}>
            <FutureLuxuryCard />
          </View>
          <RentProperty />
          <NewLaunchShowcase />
          <MapExplorerBanner navigation={navigation} />
          <View style={{height: 32}} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  scrollContent: {
    paddingBottom: 16,
  },
});
