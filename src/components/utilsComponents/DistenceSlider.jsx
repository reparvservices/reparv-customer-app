import React, {useRef} from 'react';
import {
  View,
  Text,
  PanResponder,
  Dimensions,
  StyleSheet,
} from 'react-native';

const {width} = Dimensions.get('window');

const DistenceSlider = ({
  min = 0,
  max = 100,
  value,
  onChange,
  unit = '',
}) => {
  const trackWidth = width - 64;
  const thumbSize = 18; // 🔹 small dot

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        let x = Math.min(
          Math.max(0, gesture.dx + (value / max) * trackWidth),
          trackWidth,
        );

        const newValue = Math.round((x / trackWidth) * max);
        onChange(newValue);
      },
    }),
  ).current;

  const progress = (value / max) * trackWidth;

  return (
    <View style={styles.wrapper}>
      {/* Value Label */}
     

      {/* Track */}
      <View style={[styles.track, {width: trackWidth}]}>
        <View style={[styles.activeTrack, {width: progress}]} />

        {/* Thumb */}
        <View
          {...panResponder.panHandlers}
          style={[
            styles.thumb,
            {left: progress - thumbSize / 2},
          ]}
        />
      </View>
    </View>
  );
};

export default DistenceSlider;
const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 20,
    alignItems: 'center',
  },

  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A2EFF',
    marginBottom: 8,
  },

  track: {
    height: 5,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
  },

  activeTrack: {
    height: 5,
    backgroundColor: '#7A2EFF',
    borderRadius: 4,
  },

  thumb: {
    position: 'absolute',
    top: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7A2EFF',

    // subtle shadow for premium feel
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1},
    elevation: 3,
  },
});
