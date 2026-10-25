import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';


const EmptyState = ({city, onReset, suggestedCities = [], onSelectCity}) => {
  const cityName = city && city !== 'your city' ? city : 'this city';

  return (
    <View style={styles.container}>
      {/* <Icon name="home-search-outline" size={80} color="#C9B7FF" /> */}

      <Text style={styles.title}>No Properties Found</Text>

      <Text style={styles.subtitle}>
        We couldn’t find any properties in {cityName}. Find in another city.
      </Text>

      {suggestedCities.length > 0 && (
        <View style={styles.cityWrap}>
          {suggestedCities.map(cityItem => (
            <TouchableOpacity
              key={cityItem}
              style={styles.cityChip}
              onPress={() => onSelectCity && onSelectCity(cityItem)}>
              <Text style={styles.cityChipText}>{cityItem}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
          <Text style={styles.resetText}>Reset Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EmptyState;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 6,
    textAlign: 'center',
  },
  cityWrap: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  cityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#6C4DFF',
    backgroundColor: '#F6F1FF',
  },
  cityChipText: {
    color: '#6C4DFF',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  resetBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6C4DFF',
  },
  resetText: {
    color: '#6C4DFF',
    fontWeight: '600',
  },
  cityBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#6C4DFF',
  },
  cityText: {
    color: '#fff',
    fontWeight: '600',
  },
});
