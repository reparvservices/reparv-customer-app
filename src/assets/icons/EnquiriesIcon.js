import React from 'react';
import Svg, {G, Path, Defs, ClipPath, Rect} from 'react-native-svg';

const EnquiriesIcon = ({width = 16, height = 16, stroke = '#000'}) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none">
      <G clipPath="url(#clip0)">
        <Path
          d="M4.66671 6.00016H10.6667M4.66671 8.66683H10.6667M4.66671 11.3335H8.00004M14.6667 8.00016C14.6667 11.6822 11.682 14.6668 8.00004 14.6668H1.33337V8.00016C1.33337 4.31816 4.31804 1.3335 8.00004 1.3335C11.682 1.3335 14.6667 4.31816 14.6667 8.00016Z"
          stroke={stroke}
          strokeWidth={1.3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0">
          <Rect width="16" height="16" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
};

export default EnquiriesIcon;
