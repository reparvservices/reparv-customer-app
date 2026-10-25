import React, {memo} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {Power} from 'lucide-react-native';

const BTN = 220;
const RING = 6;

const UI = {
  purple: '#7B3FE4',
  offLight: '#B0BEC5',
  offMid: '#90A4AE',
  offDeep: '#78909C',
  offline: '#E53935',
  error: '#FB8C00',
  ringShadow: 'rgba(123, 63, 228, 0.35)',
};

function DeviceCard({
  name,
  connectionState = 'unknown',
  isOn,
  loading,
  syncing = false,
  onToggle,
  colors,
}) {
  const accent = colors.accent || UI.purple;
  const mintBg = colors.mintBg || '#D4F8E2';
  const mintText = colors.mintText || '#2D8A56';

  const disabled =
    loading ||
    connectionState === 'error' ||
    connectionState === 'unknown' ||
    connectionState === 'offline' ||
    !onToggle;

  const onPress = () => {
    if (!disabled && onToggle) {
      onToggle(!isOn);
    }
  };

  const renderStatus = () => {
    if (connectionState === 'online') {
      return (
        <View style={[styles.mintPill, {backgroundColor: mintBg}]}>
          <Text style={[styles.mintPillText, {color: mintText}]}>
            Connected
          </Text>
        </View>
      );
    }
    const fallback = {
      offline: {label: 'Offline', color: UI.offline},
      unknown: {label: '…', color: colors.subText},
      error: {label: 'Could not load', color: UI.error},
    };
    const meta = fallback[connectionState] || fallback.unknown;
    return (
      <Text style={[styles.statusLine, {color: meta.color}]}>{meta.label}</Text>
    );
  };

  return (
    <View style={[styles.card, {backgroundColor: colors.card}]}>
      <Text style={[styles.deviceName, {color: colors.text}]} numberOfLines={2}>
        {name || 'Smart device'}
      </Text>
      <View style={styles.statusWrap}>{renderStatus()}</View>
      <Text
        style={[styles.stateHint, {color: colors.bodyText || colors.subText}]}>
        {isOn ? 'Power is on' : 'Power is off'}
      </Text>

      <View style={styles.buttonArea}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isOn ? 'Turn power off' : 'Turn power on'}
          accessibilityState={{disabled}}
          disabled={disabled}
          onPress={onPress}
          style={({pressed}) => [
            styles.pressable,
            pressed && !disabled && styles.pressablePressed,
            disabled && styles.pressableDisabled,
          ]}>
          <View style={[styles.outerRing, {shadowColor: UI.ringShadow}]}>
            {isOn ? (
              <View
                style={[
                  styles.innerOn,
                  {borderColor: 'rgba(123,63,228,0.15)'},
                ]}>
                {loading ? (
                  <ActivityIndicator color={accent} size="large" />
                ) : (
                  <Power color={accent} size={76} strokeWidth={2.2} />
                )}
              </View>
            ) : (
              <LinearGradient
                colors={[UI.offLight, UI.offMid, UI.offDeep]}
                start={{x: 0.15, y: 0}}
                end={{x: 0.9, y: 1}}
                style={styles.gradient}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="large" />
                ) : (
                  <Power color="#FFFFFF" size={76} strokeWidth={2.2} />
                )}
              </LinearGradient>
            )}
          </View>
        </Pressable>
      </View>

      {syncing ? (
        <Text style={[styles.syncLine, {color: colors.subText}]}>
          Syncing with device…
        </Text>
      ) : null}
      <Text style={[styles.footerHint, {color: colors.subText}]}>
        {disabled && connectionState === 'offline'
          ? 'Connect the device to use power control.'
          : disabled && connectionState === 'error'
          ? 'Fix the connection above, then try again.'
          : 'Tap the button to turn on or off.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingTop: 22,
    paddingBottom: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  statusWrap: {
    marginTop: 12,
    alignItems: 'center',
  },
  mintPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mintPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusLine: {
    fontSize: 14,
    fontWeight: '600',
  },
  stateHint: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '500',
  },
  buttonArea: {
    marginTop: 32,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressable: {
    borderRadius: BTN / 2 + RING,
  },
  pressablePressed: {
    opacity: 0.94,
    transform: [{scale: 0.98}],
  },
  pressableDisabled: {
    opacity: 0.5,
  },
  outerRing: {
    width: BTN + RING * 2,
    height: BTN + RING * 2,
    borderRadius: (BTN + RING * 2) / 2,
    backgroundColor: '#FFFFFF',
    padding: RING,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  innerOn: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  gradient: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerHint: {
    fontSize: 13,
    textAlign: 'center',

    paddingHorizontal: 12,
  },
  syncLine: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 6,
  },
});

export default memo(DeviceCard);
