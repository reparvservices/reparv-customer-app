import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ArrowUpRight } from 'lucide-react-native';

const HighGrowthAreaCard = () => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.area}>Area Name</Text>
          <Text style={styles.location}>Location Title</Text>
        </View>

        <View style={styles.growth}>
          <ArrowUpRight size={16} color="#22C55E" />
          <Text style={styles.growthText}>8.4%</Text>
          <Text style={styles.period}>3M Growth</Text>
        </View>
      </View>

      {/* Mini Graph */}
      <Svg width="100%" height="80" viewBox="0 0 360 80">
        <Path
          d="M0 60 C80 55, 160 50, 240 45 S320 40, 360 38"
          stroke="#22C55E"
          strokeWidth="2.5"
          fill="none"
        />
        <Path
          d="M0 60 C80 55, 160 50, 240 45 S320 40, 360 38 L360 80 L0 80 Z"
          fill="rgba(34,197,94,0.15)"
        />
      </Svg>

      <View style={styles.footer}>
        <Text style={styles.label}>Avg. Price/sq.ft</Text>
        <Text style={styles.price}>₹18,200</Text>
      </View>
    </View>
  );
};

export default HighGrowthAreaCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  area: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  location: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  growth: {
    alignItems: 'flex-end',
  },
  growthText: {
    color: '#22C55E',
    fontWeight: '600',
    fontSize: 13,
  },
  period: {
    fontSize: 11,
    color: '#8E8E93',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    color: '#8E8E93',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
});
