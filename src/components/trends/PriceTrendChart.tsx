import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';

const PriceTrendChart = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Price Trend</Text>

      <View style={styles.chartContainer}>
        <Svg width="100%" height="160" viewBox="0 0 360 160">
          {/* Grid lines */}
          <Line x1="0" y1="130" x2="360" y2="130" stroke="#EAE6F7" />
          <Line x1="0" y1="80" x2="360" y2="80" stroke="#EAE6F7" />
          <Line x1="0" y1="30" x2="360" y2="30" stroke="#EAE6F7" />

          {/* Line */}
          <Path
            d="M10 120 C60 115, 120 105, 180 95 S300 70, 350 65"
            stroke="#7A3EF0"
            strokeWidth="3"
            fill="none"
          />

          {/* Area fill */}
          <Path
            d="M10 120 C60 115, 120 105, 180 95 S300 70, 350 65 L350 160 L10 160 Z"
            fill="rgba(122, 62, 240, 0.1)"
          />
        </Svg>

        {/* X-axis labels */}
        <View style={styles.xAxis}>
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map(m => (
            <Text key={m} style={styles.axisText}>{m}</Text>
          ))}
        </View>

        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.axisText}>₹10K</Text>
          <Text style={styles.axisText}>₹5K</Text>
          <Text style={styles.axisText}>₹0</Text>
        </View>
      </View>
    </View>
  );
};

export default PriceTrendChart;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 10,
  },
  chartContainer: {
    position: 'relative',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginTop: 6,
  },
  yAxis: {
    position: 'absolute',
    left: -2,
    top: 10,
    justifyContent: 'space-between',
    height: 120,
  },
  axisText: {
    fontSize: 11,
    color: '#8E8E93',
  },
});
