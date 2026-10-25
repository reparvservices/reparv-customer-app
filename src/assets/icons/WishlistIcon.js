import React from 'react';
import Svg, {Path} from 'react-native-svg';

const WishlistIcon = ({
  width = 14,
  height = 12,
  fill = '#FFFFFF',
}) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 14 12"
      fill="none">
      <Path
        d="M3.66667 5.84875e-07C1.64167 5.84875e-07 0 1.64167 0 3.66667C0 7.33333 4.33333 10.6667 6.66667 11.442C9 10.6667 13.3333 7.33333 13.3333 3.66667C13.3333 1.64167 11.6917 5.84875e-07 9.66667 5.84875e-07C8.42667 5.84875e-07 7.33 0.615667 6.66667 1.558C6.3285 1.07646 5.87932 0.68347 5.35712 0.412276C4.83492 0.141082 4.25508 -0.000331883 3.66667 5.84875e-07Z"
        fill={fill}
      />
    </Svg>
  );
};

export default WishlistIcon;
