import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import {ArrowLeft} from 'lucide-react-native';
import DeviceCard from '../components/DeviceCard';
import useDevice from '../hooks/useDevice';
import {refreshTuyaSessionOnLaunch} from '../../../services/tuyaApi';

export const BREAKER_UI = {
  purple: '#7B3FE4',
  purpleMid: '#8040E6',
  lilac: '#9B66F0',
  lilacBlob: 'rgba(155, 102, 240, 0.38)',
  headerText: '#FFFFFF',
  headerIcon: '#FFFFFF',
  screenBg: '#7B3FE4',
  cardBg: '#FFFFFF',
  titleText: '#333333',
  bodyText: '#666666',
  mutedText: '#999999',
  accent: '#7B3FE4',
  divider: 'rgba(255,255,255,0.22)',
  danger: '#E53935',
  dangerBg: 'rgba(255,255,255,0.95)',
  mintBg: '#D4F8E2',
  mintText: '#2D8A56',
};

export default function DashboardScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [sessionSyncing, setSessionSyncing] = useState(false);
  const {
    device,
    loading,
    refreshing,
    error,
    switchOn,
    connectionState,
    refresh,
    toggle,
  } = useDevice({polling: isFocused, interval: 45000});

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setSessionSyncing(true);
      refreshTuyaSessionOnLaunch()
        .then(() => {
          if (!active) {
            return;
          }
          refresh();
        })
        .finally(() => {
          if (active) {
            setSessionSyncing(false);
          }
        });
      return () => {
        active = false;
      };
    }, [refresh]),
  );

  const colors = {
    card: BREAKER_UI.cardBg,
    text: BREAKER_UI.titleText,
    subText: BREAKER_UI.mutedText,
    bodyText: BREAKER_UI.bodyText,
    danger: BREAKER_UI.danger,
    accent: BREAKER_UI.accent,
    mintBg: BREAKER_UI.mintBg,
    mintText: BREAKER_UI.mintText,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={BREAKER_UI.purple}
        translucent={false}
      />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.headerIcon}
          accessibilityLabel="Go back">
          <ArrowLeft color={BREAKER_UI.headerIcon} size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Smart breaker
          </Text>
          {refreshing && device ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Updating…
            </Text>
          ) : sessionSyncing ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Syncing token…
            </Text>
          ) : null}
        </View>
        <View style={styles.headerIcon} />
      </View>

      <View style={styles.body}>
        <View pointerEvents="none" style={styles.blobs}>
          <View style={styles.blobTopRight} />
          <View style={styles.blobBottomLeft} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="#FFFFFF"
              colors={[BREAKER_UI.purple]}
            />
          }>
          {error && !device ? (
            <View style={[styles.errorBlock, styles.errorFirst]}>
              <Text style={styles.errorText}>
                {error?.message || 'Failed to load device.'}
              </Text>
              {error?.hint ? (
                <Text style={styles.hintText}>{error.hint}</Text>
              ) : null}
            </View>
          ) : null}

          {loading && !device ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          ) : error && !device ? null : (
            <DeviceCard
              name={
                device?.name ||
                device?.productName ||
                device?.product_name ||
                'Circuit breaker'
              }
              connectionState={connectionState}
              isOn={switchOn}
              onToggle={toggle}
              loading={loading}
              syncing={refreshing && !!device}
              colors={colors}
            />
          )}

          {error && device ? (
            <View style={styles.errorBlock}>
              <Text style={styles.errorText}>
                {error?.message || 'Failed to load device.'}
              </Text>
              {error?.hint ? (
                <Text style={styles.hintText}>{error.hint}</Text>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BREAKER_UI.purple,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 12,
    backgroundColor: BREAKER_UI.purple,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BREAKER_UI.divider,
  },
  headerIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BREAKER_UI.headerText,
    textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  body: {
    flex: 1,
    backgroundColor: BREAKER_UI.screenBg,
    overflow: 'hidden',
  },
  blobs: {
    ...StyleSheet.absoluteFillObject,
  },
  blobTopRight: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: BREAKER_UI.lilacBlob,
    top: -80,
    right: -100,
  },
  blobBottomLeft: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: BREAKER_UI.lilacBlob,
    bottom: -120,
    left: -140,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  loader: {
    flex: 1,
    minHeight: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBlock: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: BREAKER_UI.dangerBg,
  },
  errorFirst: {
    marginTop: 0,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: BREAKER_UI.danger,
  },
  hintText: {
    marginTop: 8,
    fontSize: 12,
    color: BREAKER_UI.bodyText,
  },
});

export const TUYA_UI = BREAKER_UI;
