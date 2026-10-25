import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const NoPropertyFound = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🏚️</Text>
      <Text style={styles.title}>No Property Found</Text>
      <Text style={styles.subtitle}>
        There are no properties available{'\n'}in this area right now.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F8F7FC',
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888780',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default NoPropertyFound;
