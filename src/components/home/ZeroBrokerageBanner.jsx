import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {Zap} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {AUTH_ACTION_TYPES, requireAuth} from '../../utils/authGuard';

export default function ZeroBrokerageBanner() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);

  return (
    <TouchableOpacity
      style={styles.wrap}
      activeOpacity={0.92}
      onPress={() => {
        if (
          !requireAuth(navigation, dispatch, auth, {
            type: AUTH_ACTION_TYPES.SELL_PROPERTY,
            params: {mode: 'add', type: 'sell'},
          })
        ) {
          return;
        }
        navigation.navigate('OldProperty', {mode: 'add', type: 'sell'});
      }}>
      <LinearGradient
        colors={['#FFF4E8', '#FFE8CC']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.card}>
        <View style={styles.textCol}>
          <Text style={styles.title}>Zero Brokerage</Text>
          <Text style={styles.sub}>List your property for free today.</Text>
        </View>
        <View style={styles.iconCircle}>
          <Zap size={26} color="#EA580C" strokeWidth={2.2} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 4,
  },
  card: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...Platform.select({
      android: {elevation: 0},
      default: {},
    }),
  },
  textCol: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: 'SegoeUI-Bold',
    color: '#C2410C',
    marginBottom: 4,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  sub: {
    fontSize: 13,
    color: '#EA580C',
    opacity: 0.95,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...Platform.select({
      android: {elevation: 0},
      default: {},
    }),
  },
});
