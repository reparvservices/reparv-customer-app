import React, {useMemo} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  PixelRatio,
  useWindowDimensions,
} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';

import ActivitiesScreen from '../screens/ActivitiesScreen';
import CalculatorScreen from '../screens/CalculatorScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HomeIcon from '../assets/image/bottom-navigator/home.png';
import TrendsIcon from '../assets/image/bottom-navigator/trends.png';
import ActivitiesIcon from '../assets/image/bottom-navigator/activities.png';
import CalculatorIcon from '../assets/image/bottom-navigator/calculator.png';
import ProfileIcon from '../assets/image/bottom-navigator/profile.png';
import {SafeAreaView} from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();
const LAYOUT_BASE_W = 375;

function CustomTabBar({state, navigation}) {
  const {width} = useWindowDimensions();
  const tabs = [
    {label: 'Home', icon: HomeIcon, route: 'Home'},
    {label: 'Activities', icon: ActivitiesIcon, route: 'Activities'},
    {label: 'Calculator', icon: CalculatorIcon, route: 'Calculator'},
    {label: 'Profile', icon: ProfileIcon, route: 'Profile'},
  ];

  const styles = useMemo(() => {
    const r = size =>
      Math.round(
        PixelRatio.roundToNearestPixel((width / LAYOUT_BASE_W) * size),
      );

    return StyleSheet.create({
      tabBarShell: {
        backgroundColor: '#FFFFFF',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.07,
        shadowRadius: 6,
      },
      tabBar: {
        flexDirection: 'row',
        minHeight: Math.max(56, r(70)),
        backgroundColor: '#FFFFFF',
        width: '100%',
        maxWidth: 560,
        alignSelf: 'center',
      },
      tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: r(8),
      },
      profileCircle: {
        width: r(34),
        height: r(34),
        borderRadius: r(17),
        borderWidth: 1.5,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
      },
      profileCircleActive: {
        borderColor: '#5E23DC',
      },
      profileIcon: {
        width: r(16),
        height: r(19),
      },
      icon: {
        width: r(28),
        height: r(25),
        marginBottom: r(4),
      },
      label: {
        fontSize: Math.max(10, r(12)),
      },
      indicator: {
        position: 'absolute',
        bottom: 0,
        width: r(29),
        height: r(5),
        borderTopLeftRadius: r(6),
        borderTopRightRadius: r(6),
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        backgroundColor: '#5E23DC',
      },
    });
  }, [width]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.tabBarShell}>
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => {
          const focused = state.index === index;

          return (
            <TouchableOpacity
              key={tab.route}
              style={styles.tabItem}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(tab.route)}>
              {tab.label === 'Profile' ? (
                <View
                  style={[
                    styles.profileCircle,
                    focused && styles.profileCircleActive,
                  ]}>
                  <Image
                    source={tab.icon}
                    style={[
                      styles.profileIcon,
                      {tintColor: focused ? '#5E23DC' : '#B8B8B8'},
                    ]}
                  />
                </View>
              ) : (
                <Image
                  source={tab.icon}
                  style={[
                    styles.icon,
                    {tintColor: focused ? '#5E23DC' : '#B8B8B8'},
                  ]}
                />
              )}

              <Text
                style={[
                  styles.label,
                  {
                    color: focused ? '#5E23DC' : '#868686',
                    fontWeight: focused ? '700' : '400',
                  },
                ]}>
                {tab.label}
              </Text>

              {focused && <View style={styles.indicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{headerShown: false, lazy: true}}
      tabBar={props => <CustomTabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeScreen} />

      <Tab.Screen name="Activities" component={ActivitiesScreen} />
      <Tab.Screen name="Calculator" component={CalculatorScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
