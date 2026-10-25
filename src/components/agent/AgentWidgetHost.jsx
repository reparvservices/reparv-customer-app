import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import AgentWidget from './AgentWidget';
import {navigationRef} from '../../navigation/Navigationref';
import {getFocusedRouteName} from '../../navigation/navigationState';

const HIDDEN_ROUTES = new Set([
  'Splash',
  'Onboarding',
  'Login',
  'CompleteProfile',
  'Calculator',
  'PropertyMap',
]);

function readFocusedRoute() {
  if (!navigationRef.isReady()) {
    return undefined;
  }
  return getFocusedRouteName(navigationRef.getRootState());
}

export default function AgentWidgetHost() {
  const [routeName, setRouteName] = useState(readFocusedRoute);

  useEffect(() => {
    let unsubscribe = () => {};

    const syncRoute = () => {
      setRouteName(readFocusedRoute());
    };

    const attach = () => {
      syncRoute();
      unsubscribe = navigationRef.addListener('state', syncRoute);
    };

    if (navigationRef.isReady()) {
      attach();
    } else {
      const interval = setInterval(() => {
        if (navigationRef.isReady()) {
          clearInterval(interval);
          attach();
        }
      }, 50);

      return () => {
        clearInterval(interval);
        unsubscribe();
      };
    }

    return () => unsubscribe();
  }, []);

  if (!routeName || HIDDEN_ROUTES.has(routeName)) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <AgentWidget />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});
