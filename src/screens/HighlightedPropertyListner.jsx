import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import PropertyCard from '../components/property/PropertyCard';
import CustomSlider from '../components/utilsComponents/CustomSlider';
import CustomePicker from '../components/utilsComponents/CustomPicker';
import EmptyState from '../components/utilsComponents/CustomeEmptyState';
import DistenceSlider from '../components/utilsComponents/DistenceSlider';
import BackIcon from '../assets/image/new-property/back-icon.svg';
import {useNavigation, useRoute} from '@react-navigation/native';
import SearchIcon from '../assets/image/home/search.png';
import {Filter, ListFilter} from 'lucide-react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

const {width} = Dimensions.get('window');
const CARD_WIDTH = width - 32;

const AMENITIES_DATA = [
  '24x7 Security',
  'CCTV Surveillance',
  'Gated Community',
  'Power Backup',
  'Borewell / Municipal Water',
  'Smart Door Lock',
  'Video Door Phone',
  'Fire Safety System',
  'Lift/Elevator',
  'Parking',
  'Facing (Road / Park / Lake / Corner)',
  'Eco-friendly features',
];

const AMENITY_MATCH_MAP = {
  '24x7 Security': ['24x7 security'],
  'CCTV Surveillance': ['cctv'],
  'Gated Community': ['gated'],
  'Power Backup': ['backup', 'dg'],
  'Borewell / Municipal Water': ['water', 'municipal', 'borewell'],
  'Smart Door Lock': ['smart'],
  'Video Door Phone': ['video'],
  'Fire Safety System': ['fire'],
  'Lift/Elevator': ['lift', 'elevator'],
  Parking: ['parking'],
  'Facing (Road / Park / Lake / Corner)': ['facing'],
  'Eco-friendly features': ['eco'],
};

const HighlightedPropertyListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    properties = [],
    ptype = '',
    title = 'Properties',
  } = route.params || {};

  const [allFlats] = useState(properties);
  const [filteredFlats, setFilteredFlats] = useState(properties);
  const [flats, setFlats] = useState(properties);
  const [loading, setLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [resultCount, setResultCount] = useState(0);
  const [selectedTab, setSelectedTab] = useState(ptype);
  const [showCityPicker, setShowCityPicker] = useState(false);
  //  Correct states
  const [propertyCategory, setPropertyCategory] = useState([]);
  const [bhk, setBhk] = useState([]); // comes from API
  const [budget, setBudget] = useState([0, 500]); // Lakh
  const [radius, setRadius] = useState(5);
  const [cities, setCities] = useState([]);
  const [searchText, setSearchText] = useState('');

  //filter getting States
  const [amenities, setAmenities] = useState([]);
  const [filterpropertyCategory, setFilterPropertyCategory] = useState([]);
  const [filterbhk, setFilterBhk] = useState([]); // comes from API
  const [filterbudget, setFilterBudget] = useState([]); // Lakh
  const [filterradius, setFilterRadius] = useState();
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    if (ptype) {
      setSelectedTab(ptype);
    }
  }, [ptype]);

  useEffect(() => {
    if (flats.length > 0) {
      applyFilters();
    }
  }, [flats, selectedTab, selectedCity, searchText]);

  const normalize = str =>
    str
      ?.toLowerCase()
      .replace(/[()]/g, '')
      .replace(/\//g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const formatPrice = value => {
    if (value >= 100) {
      return `${(value / 100).toFixed(1)} Cr`;
    }
    return `${value} L`;
  };

  const getUniqueCleanValues = (data, key) => {
    return [
      ...new Set(
        data
          .flatMap(item => {
            const value = item[key];

            // If array → return as-is
            if (Array.isArray(value)) return value;

            // If string → wrap in array
            if (typeof value === 'string') return [value];

            return [];
          })
          .map(v => v?.trim())
          .filter(
            v =>
              v &&
              v !== '[""]' && // remove bad stringified empty array
              v !== '[]',
          ),
      ),
    ];
  };

  const getPropertyAmenities = item => {
    const list = [];

    if (item.amenitiesFeature) list.push(...item.amenitiesFeature.split(' / '));

    if (item.securityBenefit) list.push(item.securityBenefit);
    if (item.primeLocationBenefit) list.push(item.primeLocationBenefit);
    if (item.parkingFeature) list.push(item.parkingFeature);
    if (item.powerBackup) list.push(item.powerBackup);
    if (item.waterSupply) list.push(item.waterSupply);

    return list.map(a => normalize(a));
  };

  const applyFilters = () => {
    const hasAnyAmenityMatch =
      amenities.length === 0 ||
      flats.some(item => {
        const flatAmenities = getPropertyAmenities(item); // normalized

        return amenities.every(selectedAmenity => {
          const keywords = AMENITY_MATCH_MAP[selectedAmenity]?.map(
            normalize,
          ) || [normalize(selectedAmenity)];

          return keywords.some(keyword =>
            flatAmenities.some(a => a.includes(keyword)),
          );
        });
      });

    const filtered = flats.filter(item => {
      const matchCategory =
        !filterpropertyCategory.length ||
        filterpropertyCategory.includes(item.propertyCategory);

      const matchTab = !selectedTab || item.propertyCategory === selectedTab;

      const matchBhk =
        !filterbhk.length ||
        (item.propertyType &&
          item.propertyType.some(pt => filterbhk.includes(pt)));

      const priceInLakh = item.totalOfferPrice
        ? Number(item.totalOfferPrice) / 100000
        : 0;

      const matchBudget =
        !budget.length ||
        (priceInLakh >= budget[0] && priceInLakh <= budget[1]);

      // const matchAmenities =
      //   !amenities.length ||
      //   !hasAnyAmenityMatch || //IMPORTANT LINE
      //   (() => {
      //     const flatAmenities = getPropertyAmenities(item);

      //     return amenities.every(selectedAmenity => {
      //       const keywords = AMENITY_MATCH_MAP[selectedAmenity]?.map(
      //         normalize,
      //       ) || [normalize(selectedAmenity)];

      //       return keywords.some(keyword =>
      //         flatAmenities.some(a => a.includes(keyword)),
      //       );
      //     });
      //   })();
      const matchSearch =
        !searchText ||
        [item.city, item.location, item.projectBy, item.propertyName]
          .filter(Boolean)
          .some(field =>
            field.toLowerCase().includes(searchText.toLowerCase()),
          );

      const matchRadius =
        !radius || !item.distanceFromCityCenter
          ? true
          : Number(item.distanceFromCityCenter) <= radius;

      const matchCity = !selectedCity || item.city === selectedCity;

      return (
        matchCategory &&
        matchTab &&
        matchBhk &&
        matchBudget &&
        matchCity &&
        matchSearch
      );
    });

    setFilteredFlats(filtered);
    setResultCount(filtered.length);
    setFilterVisible(false);
  };

  const renderItem = ({item}) => <PropertyCard item={item} />;
  const filteredCategories = React.useMemo(() => {
    if (!ptype) return propertyCategory;

    // Case 1: Rental
    if (ptype.startsWith('Rental')) {
      return propertyCategory.filter(item => item.startsWith('Rental'));
    }

    // Case 2: Resale
    if (ptype.startsWith('Resale')) {
      return propertyCategory.filter(item => item.startsWith('Resale'));
    }

    // Case 3: Others (exclude Rental & Resale)
    return propertyCategory.filter(
      item => !item.startsWith('Rental') && !item.startsWith('Resale'),
    );
  }, [ptype, propertyCategory]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F7F7F7"
        translucent={false}
      />

      <View
        style={[
          styles.container,
          // {
          //   paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
          // },
        ]}>
        {/* Search */}
        <View style={styles.searchRow}>
          <TouchableOpacity
            style={{marginTop: 6, paddingHorizontal: 4}}
            onPress={() => navigation.goBack()}>
            <BackIcon width={26} height={26} fill="gray" />
          </TouchableOpacity>

          <View style={styles.searchBox}>
            <Image
              source={SearchIcon}
              style={styles.searchIcon}
              resizeMode="contain"
            />

            <TextInput
              placeholder="Search by location, city, project..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={text => setSearchText(text)}
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterVisible(true)}>
            <ListFilter
              width={20}
              height={20}
              color={'#7A2EFF'}
              fill="#7A2EFF"
            />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabRow}>
            {filteredCategories.map(tab => {
              const isActive = selectedTab === tab;

              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setSelectedTab(tab)}
                  style={[styles.tab, isActive && styles.activeTab]}>
                  <Text
                    style={[styles.tabText, isActive && styles.activeTabText]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        {/* Result Count */}
        <View style={styles.resultRow}>
          {/* Properties Count */}
          <View>
            <Text style={[styles.resultText, {fontSize: 12, color: '#868686'}]}>
              <Text
                style={{
                  fontWeight: '700',
                  fontSize: 16,
                  fontFamily: 'SegoeUI-Bold',
                  ...Platform.select({
                    android: {
                      includeFontPadding: false,
                      textAlignVertical: 'center',
                    },
                    default: {},
                  }),
                  color: 'black',
                }}>
                {filteredFlats.length} Properties Found
              </Text>
            </Text>
            <Text style={{fontSize: 12, color: '#555'}}>
              in {selectedCity || 'All Cities'}
            </Text>
          </View>

          {/* City Picker */}
          <CustomePicker
            cities={cities}
            selectedCity={selectedCity}
            onSelect={city => {
              setSelectedCity(city);
            }}
          />

          {/* Sort Button */}
          {/* <TouchableOpacity>
    <Text style={styles.sortText}>Sort ⬍</Text>
  </TouchableOpacity> */}
        </View>

        {/* Property List */}

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#7A2EFF" />
            <Text style={styles.loaderText}>Loading properties...</Text>
          </View>
        ) : filteredFlats.length === 0 ? (
          <EmptyState
            city={selectedCity || 'your city'}
            onReset={() => {
              setFilterPropertyCategory([]);
              setFilterBhk([]);
              setFilterBudget([0, 0]);
              setFilterRadius(5);
              setAmenities([]);
              setSelectedCity('');
              setSelectedTab('');

              setFilterVisible(false);
            }}
          />
        ) : (
          <FlatList
            data={filteredFlats}
            renderItem={renderItem}
            keyExtractor={item => item.propertyid.toString()}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* FILTER MODAL*/}
        <Modal visible={filterVisible} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <View style={styles.dragHandle} />

              {/* Header */}
              <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>Filters</Text>
                <TouchableOpacity
                  onPress={() => {
                    // Reset all filter states
                    setFilterPropertyCategory([]);
                    setFilterBhk([]);
                    setFilterBudget([0, 0]);
                    setFilterRadius(5);
                    setAmenities([]);

                    // Show the list again with only tab / city / search applied
                    // (state setters above apply on the next render)
                    const query = searchText?.toLowerCase();
                    const resetList = flats.filter(
                      item =>
                        (!selectedTab ||
                          item.propertyCategory === selectedTab) &&
                        (!selectedCity || item.city === selectedCity) &&
                        (!query ||
                          [
                            item.city,
                            item.location,
                            item.projectBy,
                            item.propertyName,
                          ]
                            .filter(Boolean)
                            .some(field =>
                              field.toLowerCase().includes(query),
                            )),
                    );
                    setFilteredFlats(resetList);
                    setResultCount(resetList.length);

                    // Close modal
                    setFilterVisible(false);
                  }}>
                  <Text style={styles.resetText}>Reset All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.separator} />
              {/* Scrollable Content */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{paddingBottom: 20}}>
                {/* Property Category */}
                <Text style={styles.sectionTitle}>Property Type</Text>
                <View style={styles.chipWrap}>
                  {propertyCategory.length > 0 &&
                    propertyCategory.map(item => (
                      <TouchableOpacity
                        key={item}
                        onPress={() => {
                          setSelectedTab('');
                          setFilterPropertyCategory(prev =>
                            prev.includes(item)
                              ? prev.filter(i => i !== item)
                              : [...prev, item],
                          );
                        }}
                        style={[
                          styles.chip,
                          filterpropertyCategory.includes(item) &&
                            styles.chipActive,
                        ]}>
                        <Text
                          style={[
                            styles.chipText,
                            filterpropertyCategory.includes(item) &&
                              styles.chipTextActive,
                          ]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
                <View style={styles.separator} />

                {/* BHK */}
                <Text style={styles.sectionTitle}>BHK Configuration</Text>
                <View style={styles.chipWrap}>
                  {bhk.length > 0 &&
                    bhk.map(item => (
                      <TouchableOpacity
                        key={item}
                        onPress={() =>
                          setFilterBhk(prev =>
                            prev.includes(item)
                              ? prev.filter(i => i !== item)
                              : [...prev, item],
                          )
                        }
                        style={[
                          styles.chip,
                          filterbhk.includes(item) && styles.chipActive,
                        ]}>
                        <Text
                          style={[
                            styles.chipText,
                            filterbhk.includes(item) && styles.chipTextActive,
                          ]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
                <View style={styles.separator} />
                {/* Budget */}
                <Text style={[styles.sectionTitle, {marginTop: 5}]}>
                  Budget Range
                </Text>
                <View style={styles.rangeRow}>
                  <View style={styles.rangeBox}>
                    <Text>₹ {formatPrice(budget[0])}</Text>
                  </View>

                  <View style={styles.rangeBox}>
                    <Text>₹ {formatPrice(budget[1])}</Text>
                  </View>
                </View>

                <CustomSlider
                  min={0}
                  max={500}
                  values={budget}
                  onChange={setBudget}
                />

                <View style={styles.separator} />
                {/* Radius */}
                <Text style={styles.sectionTitle}>Location Radius</Text>

                <View style={styles.radiusRow}>
                  <Text>Within {radius} km</Text>
                  <Text style={{color: '#7A2EFF', fontWeight: '600'}}>
                    {radius} km
                  </Text>
                </View>

                <DistenceSlider
                  min={1}
                  max={20}
                  value={radius}
                  unit="km"
                  onChange={setRadius}
                />

                <View style={styles.separator} />
                {/* Amenities */}
                <Text style={styles.sectionTitle}>Amenities</Text>

                <FlatList
                  data={AMENITIES_DATA}
                  keyExtractor={item => item}
                  numColumns={2}
                  columnWrapperStyle={{justifyContent: 'space-between'}}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={styles.checkboxRow}
                      onPress={() =>
                        setAmenities(prev =>
                          prev.includes(item)
                            ? prev.filter(a => a !== item)
                            : [...prev, item],
                        )
                      }>
                      <View
                        style={[
                          styles.checkbox,
                          amenities.includes(item) && styles.checkboxActive,
                        ]}
                      />
                      <Text style={styles.checkboxText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </ScrollView>

              {/* Apply Button */}
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default HighlightedPropertyListScreen;
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 16,
  },

  searchRow: {
    flexDirection: 'row',
    // marginTop: 10,
    marginBottom: 12,
    alignItems: 'center',
    gap: 8,
  },

  searchBox: {
    flex: 1, // take remaining space
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    borderColor: '#DDD',
    paddingHorizontal: 12,
    borderWidth: 1,
    height: 44,
  },

  filterBtn: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7A2EFF',
    height: 44,
    marginLeft: 8,
  },

  searchIcon: {
    width: 16,
    height: 16,
    tintColor: '#868686', // optional (works if PNG is single-color)
  },

  searchInput: {
    flex: 1,
    marginTop: 2,
    marginLeft: 8,
    fontSize: 14,
    color: '#000',
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },

  placeholder: {
    color: '#999',
  },

  filterText: {
    color: '#7A2EFF',
    fontWeight: '600',
  },

  tabRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD',
    marginRight: 8,
    height: 30,
  },
  activeTab: {
    backgroundColor: '#7A2EFF',
    borderColor: '#7A2EFF',
  },
  tabText: {
    color: '#777',
  },
  activeTabText: {
    color: 'white',
  },

  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  resultText: {
    color: 'black',
    gap: 5,
  },
  sortText: {
    color: '#7A2EFF',
    fontWeight: '600',
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  image: {
    width: CARD_WIDTH,
    height: 200,
  },
  assuredTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#7A2EFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  assuredText: {
    color: '#FFF',
    fontSize: 12,
  },
  heart: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 6,
  },

  cardBody: {
    padding: 12,
  },
  location: {
    color: '#777',
    fontSize: 13,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  info: {
    color: '#555',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  owner: {
    color: '#666',
  },
  detailsBtn: {
    backgroundColor: '#7A2EFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailsText: {
    color: '#FFF',
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },

  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },

  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCC',
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 12,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  resetText: {
    color: '#7A2EFF',
    fontWeight: '600',
  },

  sectionTitle: {
    marginTop: 18,
    marginBottom: 10,
    fontWeight: '700',
  },

  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F4EDFF',
  },

  chipActive: {
    backgroundColor: '#7A2EFF',
  },

  chipText: {
    color: '#555',
  },

  chipTextActive: {
    color: '#ffffffff',
    fontWeight: '600',
  },

  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  rangeBox: {
    backgroundColor: '#F4EDFF',
    padding: 10,
    borderRadius: 8,
    width: '45%',
  },

  radiusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', //  important for wrapped text
    flex: 1,
    paddingVertical: 8,
    paddingRight: 12,
  },

  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#999',
    marginRight: 8,
    borderRadius: 4,
    marginTop: 2,
  },

  checkboxActive: {
    backgroundColor: '#7A2EFF',
    borderColor: '#7A2EFF',
  },

  checkboxText: {
    flex: 1, //  KEY FIX
    fontSize: 14,
    color: '#444',
    flexWrap: 'wrap',
  },

  checkboxActive: {
    backgroundColor: '#7A2EFF',
    borderColor: '#7A2EFF',
  },

  applyBtn: {
    backgroundColor: '#7A2EFF',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
  },

  applyText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '700',
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: '#D9D9D9',
    marginVertical: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },

  loaderText: {
    marginTop: 10,
    fontSize: 14,
    color: '#868686',
  },
});
