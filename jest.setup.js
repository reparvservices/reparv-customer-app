/* Mocks for native / side-effect modules so `App` can render under Jest */

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const {View} = require('react-native');
  return {
    GestureHandlerRootView: ({children, style}) =>
      React.createElement(View, {style}, children),
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: c => c,
    Directions: {},
  };
});

jest.mock('@react-native-firebase/messaging', () => {
  const noop = () => jest.fn();
  return () => ({
    requestPermission: jest.fn(() => Promise.resolve(1)),
    getToken: jest.fn(() => Promise.resolve('test-token')),
    onMessage: noop,
    onNotificationOpenedApp: noop,
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    AuthorizationStatus: {AUTHORIZED: 1, PROVISIONAL: 2, DENIED: 0},
  });
});

jest.mock('react-native-fbsdk-next', () => ({
  Settings: {initializeSDK: jest.fn()},
}));

jest.mock('react-native-version-check', () => ({
  needUpdate: jest.fn(() => Promise.resolve({isNeeded: false})),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {configure: jest.fn()},
}));

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    signInWithCredential: jest.fn(),
    signInWithPhoneNumber: jest.fn(),
    currentUser: null,
  }),
}));

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  getApp: jest.fn(() => ({name: '[DEFAULT]'})),
  getApps: jest.fn(() => [{name: '[DEFAULT]'}]),
}));

