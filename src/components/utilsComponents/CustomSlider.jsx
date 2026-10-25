import React, {useRef} from 'react';
import {View, PanResponder, Dimensions} from 'react-native';

const {width} = Dimensions.get('window');

const CustomSlider = ({
  min = 0,
  max = 500,
  values = [50, 300],
  onChange,
}) => {
  const trackWidth = width - 64;
  const thumbSize = 18;

  const minX = (values[0] / max) * trackWidth;
  const maxX = (values[1] / max) * trackWidth;

  const minPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        let x = Math.max(0, Math.min(minX + g.dx, maxX - thumbSize));
        const newMin = Math.round((x / trackWidth) * max);
        onChange([newMin, values[1]]);
      },
    }),
  ).current;

  const maxPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        let x = Math.min(
          trackWidth,
          Math.max(maxX + g.dx, minX + thumbSize),
        );
        const newMax = Math.round((x / trackWidth) * max);
        onChange([values[0], newMax]);
      },
    }),
  ).current;

  return (
    <View style={{marginVertical: 16}}>
      {/* Track */}
      <View
        style={{
          height: 4,
          backgroundColor: '#E0E0E0',
          borderRadius: 4,
          width: trackWidth,
          alignSelf: 'center',
        }}>
        {/* Active track */}
        <View
          style={{
            position: 'absolute',
            left: minX,
            width: maxX - minX,
            height: 4,
            backgroundColor: '#7A2EFF',
            borderRadius: 4,
          }}
        />

        {/* Min Thumb */}
        <View
          {...minPan.panHandlers}
          style={{
            position: 'absolute',
            left: minX - thumbSize / 2,
            top: -7,
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: '#7A2EFF',
          }}
        />

        {/* Max Thumb */}
        <View
          {...maxPan.panHandlers}
          style={{
            position: 'absolute',
            left: maxX - thumbSize / 2,
            top: -7,
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: '#7A2EFF',
          }}
        />
      </View>
    </View>
  );
};

export default CustomSlider;
