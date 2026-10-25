import React from 'react';
import Svg, {Path} from 'react-native-svg';

const CalendarCheckIcon = ({
  width = 14,
  height = 15,
  stroke = '#000',
}) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 14 15"
      fill="none">
      <Path
        d="M9.08333 0.75V2.75M3.08333 0.75V2.75M6.08333 0.75V2.75M11.4167 8.41667V6.41667C11.4167 4.21667 11.4167 3.11667 10.7333 2.43333C10.05 1.75 8.95 1.75 6.75 1.75H5.41667C3.21667 1.75 2.11667 1.75 1.43333 2.43333C0.75 3.11667 0.75 4.21667 0.75 6.41667V9.41667C0.75 11.6167 0.75 12.7167 1.43333 13.4C2.11667 14.0833 3.21667 14.0833 5.41667 14.0833H6.75M3.41667 9.41667H6.08333M3.41667 6.75H8.75M8.08333 12.75C8.08333 12.75 8.75 12.75 9.41667 14.0833C9.41667 14.0833 10.868 10.75 12.75 10.0833"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default CalendarCheckIcon;
