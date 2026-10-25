import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  Dimensions,
  FlatList,
  Image,
} from 'react-native';
import {ArrowDown, ArrowRight, MapPin, X} from 'lucide-react-native';
const {width} = Dimensions.get('window');
const cardWidth = (width - 60) / 3; // 3 cards in a row with padding

const getGeolocationModule = () => {
  try {
    // Lazy require prevents app crash when native module is not linked.
    return require('@react-native-community/geolocation').default;
  } catch (error) {
    return null;
  }
};

const citiesImages = {
  Delhi: require('../../assets/image/citiies/dilhi.jpg'),
  Mumbai: require('../../assets/image/citiies/mumbai.jpg'),
  Bangalore: require('../../assets/image/citiies/bang.jpg'),
  Nagpur: require('../../assets/image/citiies/nagpur.jpg'),
  Pune: require('../../assets/image/citiies/pune.jpg'),
  Lucknow: require('../../assets/image/citiies/lucknow.jpg'),
  Hyderabad: require('../../assets/image/citiies/hy.jpg'),
  Ahmedabad: require('../../assets/image/citiies/ah.jpg'),
  Noida: require('../../assets/image/citiies/noida.jpg'),
  Chennai: require('../../assets/image/citiies/ch.jpg'),
  Nashik: require('../../assets/image/citiies/nashik.png'),
  Jaipur: require('../../assets/image/citiies/jaipur.jpg'),
  Jodhpur: require('../../assets/image/citiies/jodhpur.jpg'),
  Kolkata: require('../../assets/image/citiies/kol.jpg'),
  Chandigarh: require('../../assets/image/citiies/chh.jpg'),
};

const popularCities = [
  'Delhi',
  'Mumbai',
  'Bangalore',
  'Nagpur',
  'Pune',
  'Lucknow',
  'Hyderabad',
  'Ahmedabad',
  'Noida',
  'Chennai',
  'Nashik',
  'Jaipur',
  'Jodhpur',
  'Kolkata',
  'Chandigarh',
];

const CustomePicker = ({cities = [], selectedCity, onSelect}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filteredCities = cities;

  const quickAccess = cities.filter(city =>
    city.toLowerCase().includes(searchText.toLowerCase()),
  );

  const getCurrentLocationCity = async () => {
    const Geolocation = getGeolocationModule();
    if (!Geolocation?.getCurrentPosition) {
      alert('Location service is unavailable. Please reinstall and rebuild the app.');
      return;
    }

    Geolocation.getCurrentPosition(
      async position => {
        const {latitude, longitude} = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          const data = await response.json();

          const city =
            data?.address?.city ||
            data?.address?.town ||
            data?.address?.village ||
            data?.address?.state;

          if (city) {
            onSelect(city);
            setModalVisible(false);
          } else {
            alert('Unable to detect city from location');
          }
        } catch (error) {
          console.log('Geocoding error:', error);
          alert('Failed to fetch city name');
        }
      },
      error => {
        console.log(error);
        alert('Location permission denied');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };

  return (
    <View>
      {/* Picker Button */}
      <TouchableOpacity
        style={styles.pickerBtn}
        onPress={() => setModalVisible(true)}>
        <View style={styles.pickerContent}>
          <Text style={styles.pickerText}>{selectedCity || 'Select City'}</Text>
          <ArrowDown
            size={16}
            color="#7A2EFF"
            style={{transform: [{rotate: modalVisible ? '180deg' : '0deg'}]}}
          />
        </View>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.dragHandle} />
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}>
              <X size={20} color="#444" />
            </TouchableOpacity>

            <Text style={styles.header}>Choose Your City</Text>
            <Text style={styles.subHeader}>
              Select a city to explore properties
            </Text>

            {/* Search Bar */}
            <TextInput
              style={styles.searchBar}
              placeholder="Search property by location"
              value={searchText}
              onChangeText={setSearchText}
            />

            {/* Use Current Location */}
            {/* Use Current Location */}
            <TouchableOpacity
              style={styles.currentLocationBtn}
              onPress={getCurrentLocationCity}>
              <Text style={styles.currentLocationText}>
                Use Current Location
              </Text>
            </TouchableOpacity>

            {/* Quick Access */}
            <View style={styles.quickAccessWrapper}>
              {quickAccess.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickAccess}>
                  {quickAccess.map(city => (
                    <TouchableOpacity
                      key={city}
                      style={[
                        styles.quickBtn,
                        selectedCity === city && styles.quickBtnActive,
                      ]}
                      onPress={() => onSelect(city)}>
                      <Text
                        style={[
                          styles.quickText,
                          selectedCity === city && styles.quickTextActive,
                        ]}>
                        {city}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No cities found</Text>
                  <Text style={styles.emptySubTitle}>
                    Try searching with a different location
                  </Text>
                </View>
              )}
            </View>

            {/* Popular Cities */}
            <Text style={styles.popularHeader}>Popular Cities</Text>
            <FlatList
              data={popularCities}
              numColumns={3}
              keyExtractor={(item, idx) => item + idx}
              columnWrapperStyle={{
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.cityCard,
                    selectedCity === item && styles.cityCardActive,
                  ]}
                  onPress={() => onSelect(item)}>
                  <Image
                    source={citiesImages[item] || citiesImages['Nagpur']}
                    style={styles.cityImage}
                  />
                  <View
                    style={[
                      styles.cityLabel,
                      selectedCity === item && styles.cityLabelActive,
                    ]}>
                    <Text
                      style={[
                        styles.cityLabelText,
                        selectedCity === item && styles.cityLabelTextActive,
                      ]}>
                      {item}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />

            {/* Bottom Fixed */}
            <View style={styles.bottomBar}>
              <View style={styles.cityInfo}>
                <View style={styles.cityIconWrap}>
                  <MapPin size={18} color="#7A2EFF" />
                </View>

                <View>
                  <Text style={styles.selectedLabel}>Selected City</Text>
                  <Text style={styles.selectedCityText}>
                    {selectedCity || 'Choose a city'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.viewBtn,
                  !selectedCity && styles.viewBtnDisabled,
                ]}
                disabled={!selectedCity}
                onPress={() => {
                  onSelect(selectedCity);
                  setModalVisible(false);
                }}>
                <Text style={styles.viewBtnText}>View Properties</Text>
                <ArrowRight size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CustomePicker;

const styles = StyleSheet.create({
  pickerBtn: {paddingHorizontal: 12, paddingVertical: 8},
  pickerContent: {flexDirection: 'row', alignItems: 'center', gap: 6},
  pickerText: {color: '#7A2EFF', fontWeight: '600', fontSize: 16},

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 80,
    maxHeight: '90%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCC',
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {fontSize: 20, fontWeight: '700', marginBottom: 4},
  subHeader: {fontSize: 14, color: '#666', marginBottom: 16},

  searchBar: {
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },

  currentLocationBtn: {
    backgroundColor: '#7A2EFF',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  currentLocationText: {color: '#FFF', fontWeight: '600'},

  quickAccessWrapper: {
    marginBottom: 16,
  },

  quickAccess: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },

  quickBtn: {
    borderWidth: 1,
    borderColor: '#7A2EFF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 10,
    backgroundColor: '#FFF',
  },

  quickBtnActive: {
    backgroundColor: '#7A2EFF',
  },

  quickText: {
    color: '#7A2EFF',
    fontWeight: '600',
    fontSize: 14,
  },

  quickTextActive: {
    color: '#FFF',
  },

  emptyState: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
  },

  emptySubTitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },

  popularHeader: {fontSize: 16, fontWeight: '600', marginBottom: 8},

  cityCard: {
    width: cardWidth,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  cityCardActive: {borderColor: '#7A2EFF', borderWidth: 2},
  cityImage: {width: '100%', height: cardWidth, resizeMode: 'cover'},
  cityLabel: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  cityLabelActive: {backgroundColor: '#7A2EFF'},
  cityLabelText: {color: '#FFF', fontWeight: '600'},
  cityLabelTextActive: {color: '#FFF'},

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },

  cityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  cityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1E9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },

  selectedCityText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C2C2C',
  },

  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7A2EFF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },

  viewBtnDisabled: {
    backgroundColor: '#C8B9FF',
  },

  viewBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
