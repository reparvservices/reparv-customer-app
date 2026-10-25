import React, {useEffect, useState, useCallback, useRef} from 'react';
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
  BackHandler,
  Pressable,
} from 'react-native';
import PropertyCard from '../components/property/PropertyCard';
import EmptyState from '../components/utilsComponents/CustomeEmptyState';
import BackIcon from '../assets/image/new-property/back-icon.svg';
import {useNavigation, useRoute} from '@react-navigation/native';
import SearchIcon from '../assets/image/home/search.png';
import {ListFilter, X, ChevronUp, ChevronDown} from 'lucide-react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {parseBhkList} from '../utils/parseBhk';
import {fetchAllPropertiesCached} from '../services/allPropertiesCache';
import {useSelector} from 'react-redux';
import {getImageUri, parseFrontView} from '../utils/imageHandle';
import {selectBrowseCity} from '../features/auth/authSlice';

const {width} = Dimensions.get('window');

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

// ─── Filter options mirrored from reparv.in (website: components/property/FilterSidebar.jsx) ───
const NEW_PROPERTY_TYPES = [
  'NewFlat',
  'NewPlot',
  'NewShop',
  'RowHouse',
  'Lease',
  'FarmLand',
  'FarmHouse',
  'CommercialFlat',
  'CommercialPlot',
  'IndustrialSpace',
];

const RESALE_PROPERTY_TYPES = [
  'Resale',
  'ResaleFlat',
  'ResaleHouse',
  'ResaleShop',
  'ResaleOffice',
  'ResaleFarmLand',
  'ResaleRowHouse',
  'ResaleGodown',
  'ResaleBunglow',
];

const isRentalCategory = category =>
  category.startsWith('Rental') || category === 'Lease';

const RENTAL_PROPERTY_TYPES = [
  'RentalFlat',
  'RentalShop',
  'RentalHouse',
  'RentalOffice',
];

const FLAT_BHK_TYPES = [
  '1 RK',
  '1 BHK',
  '2 BHK',
  '2.5 BHK',
  '3 BHK',
  '3.5 BHK',
  '4 BHK',
  '5 BHK',
  'Above 5 BHK',
  'Pent House',
  'Builder Floor',
  'Studio Apartment',
  'Duplex Apartment',
  'Serviced Apartment',
];

const BHK_TYPES_BY_CATEGORY = {
  NewFlat: FLAT_BHK_TYPES,
  RentalFlat: FLAT_BHK_TYPES,
  NewPlot: [
    'Corner Plot',
    'Park Facing Plot',
    'Road Facing Plot',
    'Gated Community Plot',
  ],
  CommercialFlat: [
    'Office Space',
    'Co-Working Space',
    'Corporate Office',
    'Studio Office',
  ],
  CommercialShop: ['Shop', 'Showroom', 'Restaurant / Cafe', 'Bank / ATM'],
  IndustrialSpace: ['Godown', 'Cold Storage', 'Small Manufacturing Unit'],
  CommercialPlot: [
    'Office Building Plot',
    'Warehouse Plot',
    'Mixed-Use Development Plot',
    'Highway-Facing Plot',
    'Petrol Pump Plot',
    'School / Hospital Plot',
  ],
};

const formatCategoryLabel = category =>
  category?.replace(/([a-z])([A-Z])/g, '$1 $2');

// ─── Collapsible filter section (title + chevron), as on reparv.in ───
const FilterSection = ({title, open, onToggle, children}) => (
  <View style={styles.filterSection}>
    <TouchableOpacity
      style={styles.filterSectionHeader}
      onPress={onToggle}
      activeOpacity={0.7}>
      <Text style={styles.filterSectionTitle}>{title}</Text>
      {open ? (
        <ChevronUp size={18} color="#111" strokeWidth={2.5} />
      ) : (
        <ChevronDown size={18} color="#111" strokeWidth={2.5} />
      )}
    </TouchableOpacity>
    {open && <View style={styles.filterSectionBody}>{children}</View>}
  </View>
);

const CheckboxRow = ({label, checked, onPress}) => (
  <TouchableOpacity style={styles.checkboxRow} onPress={onPress}>
    <View style={[styles.checkbox, checked && styles.checkboxActive]}>
      {checked && <Text style={styles.checkboxTick}>✓</Text>}
    </View>
    <Text style={styles.checkboxText}>{label}</Text>
  </TouchableOpacity>
);

// ─── BHK-only pattern: only show genuine BHK / bedroom type values ───
const BHK_VALID_PATTERN = /^\d+(\.\d+)?\s*(bhk|rk|bedroom|bed|studio)/i;
const isBhkValue = val => BHK_VALID_PATTERN.test(String(val).trim());

// ─── Highlight matching text bold ───
const HighlightMatch = ({text, query, style}) => {
  if (!text || !query) return <Text style={style}>{text}</Text>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <Text style={style}>{text}</Text>;
  return (
    <Text style={style}>
      {text.slice(0, idx)}
      <Text style={[style, {fontWeight: '900', color: '#111'}]}>
        {text.slice(idx, idx + query.length)}
      </Text>
      {text.slice(idx + query.length)}
    </Text>
  );
};

// ─── Active Filter Chip ───
const ActiveChip = ({label, onRemove}) => (
  <View style={styles.activeChip}>
    <Text style={styles.activeChipText} numberOfLines={1}>
      {label}
    </Text>
    <TouchableOpacity
      onPress={onRemove}
      hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
      <X size={11} color="#7A2EFF" strokeWidth={2.5} />
    </TouchableOpacity>
  </View>
);

const PropertyListScreen = () => {
  const navigation = useNavigation();
  const browseCity = useSelector(state => selectBrowseCity(state));
  const route = useRoute();
  const ptype = route?.params?.ptype;
  // 'buy' = everything for sale (new + resale, no rentals), like reparv.in /properties/type/buy
  // 'rent' = every rental listing (Rental* + Lease)
  const listingGroup = route?.params?.listingGroup;
  const initialCity = route?.params?.city ?? browseCity ?? '';

  const [flats, setFlats] = useState([]);
  const [filteredFlats, setFilteredFlats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState(ptype);

  // Search & autocomplete
  const [searchText, setSearchText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const searchInputRef = useRef(null);

  // City
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');

  // Filter option lists
  const [propertyCategory, setPropertyCategory] = useState([]);
  const [bhk, setBhk] = useState([]);
  // Budget inputs are in rupees (as on reparv.in); filterbudget holds lakhs
  const [budgetInputs, setBudgetInputs] = useState({min: '', max: ''});
  const [openSections, setOpenSections] = useState({
    type: true,
    bhk: true,
    budget: true,
    locations: true,
    amenities: true,
  });

  // Active filter states
  const [amenities, setAmenities] = useState([]);
  const [filterpropertyCategory, setFilterPropertyCategory] = useState([]);
  const [filterbhk, setFilterBhk] = useState([]);
  const [filterbudget, setFilterBudget] = useState([]);
  const [filterLocations, setFilterLocations] = useState([]);

  // ─── Android back handler closes filter ───
  useEffect(() => {
    const onBackPress = () => {
      if (filterVisible) {
        setFilterVisible(false);
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [filterVisible]);

  // ─── Init ───
  useEffect(() => {
    fetchFlats();
  }, []);

  useEffect(() => {
    if (ptype) setSelectedTab(ptype);
  }, [ptype]);

  useEffect(() => {
    if (initialCity) setSelectedCity(initialCity);
  }, [initialCity]);

  useEffect(() => {
    if (flats.length > 0) applyFilters();
  }, [flats, selectedTab, selectedCity, searchText]);

  // ─── Helpers ───
  const normalize = str =>
    str
      ?.toLowerCase()
      .replace(/[()]/g, '')
      .replace(/\//g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // value is in Lakhs (e.g. 0.01 = ₹1K, 1 = ₹1L, 100 = ₹1Cr)
  const formatPrice = value => {
    if (value >= 100)
      return `${(value / 100).toFixed(value % 100 === 0 ? 0 : 1)} Cr`;
    if (value >= 1)
      return `${Number.isInteger(value) ? value : value.toFixed(1)} L`;
    // Below 1 lakh → show in thousands
    const thousands = Math.round(value * 100); // 0.01 lakh = 1000 → 1K
    return `${thousands}K`;
  };

  const getUniqueCleanValues = (data, key) => {
    return [
      ...new Set(
        data
          .flatMap(item => {
            const value = item[key];
            if (Array.isArray(value)) return value;
            if (typeof value === 'string') return [value];
            return [];
          })
          .map(v => v?.trim())
          .filter(v => v && v !== '[""]' && v !== '[]'),
      ),
    ];
  };

  const normalizeCity = value =>
    String(value || '')
      .trim()
      .toLowerCase();

  const cityMatches = (itemCity, activeCity) => {
    if (!activeCity) return true;
    const a = normalizeCity(itemCity);
    const b = normalizeCity(activeCity);
    return a.includes(b) || b.includes(a);
  };

  const normalizePropertyCategory = value => {
    if (!value) return '';
    return value
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .trim();
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

  // ─── Fetch ───
  const fetchFlats = async () => {
    setLoading(true);
    try {
      const data = await fetchAllPropertiesCached();
      const activeApproved = data.filter(
        item => item.status === 'Active' && item.approve === 'Approved',
      );
      setFlats(activeApproved);
      setFilteredFlats(activeApproved);

      // ── FIX: Only real BHK values in BHK filter ──
      const rawBhk = getUniqueCleanValues(activeApproved, 'propertyType');
      const cleanBhk = parseBhkList(rawBhk).filter(isBhkValue);
      setBhk(cleanBhk);

      setPropertyCategory(
        getUniqueCleanValues(activeApproved, 'propertyCategory'),
      );

      const uniqueCities = [
        ...new Set(
          activeApproved.map(item => item.city?.trim()).filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b));
      setCities(uniqueCities);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Autocomplete suggestion builder ───
  const buildSuggestions = useCallback(
    text => {
      if (!text || text.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      const lower = text.toLowerCase();
      const matched = flats
        .filter(
          f =>
            f.propertyName?.toLowerCase().includes(lower) ||
            f.location?.toLowerCase().includes(lower) ||
            f.city?.toLowerCase().includes(lower) ||
            f.address?.toLowerCase().includes(lower),
        )
        .slice(0, 8)
        .map(f => ({
          type: 'Project',
          label: f.propertyName,
          city: f.city,
          location: f.location,
          image: f.frontView
            ? getImageUri(parseFrontView(f.frontView)[0])
            : f.propertyImages?.[0] || null,
          searchText: f.propertyName,
          seoSlug: f.seoSlug,
        }));
      setSuggestions(matched);
      setShowSuggestions(matched.length > 0);
    },
    [flats],
  );

  // ─── NLP Search Parser ───
  const parseSearchQuery = useCallback(
    text => {
      if (!text) return {bhk: null, city: null, category: null, rawText: ''};
      const lower = text.toLowerCase().trim();

      const bhkMatch = lower.match(/(\d+)\s*(?:bhk|bedroom|bed)/);
      const parsedBhk = bhkMatch ? `${bhkMatch[1]} BHK` : null;

      let parsedCity = null;
      const inMatch = lower.match(/\bin\s+([a-zA-Z\s]+?)(?:\s|$)/);
      const cityCandidate = inMatch ? inMatch[1].trim() : lower;
      parsedCity =
        cities.find(c => c.toLowerCase() === cityCandidate.toLowerCase()) ||
        cities.find(c =>
          cityCandidate.toLowerCase().includes(c.toLowerCase()),
        ) ||
        null;

      const CATEGORY_KEYWORDS = {
        'rental flat': [
          'rental flat',
          'rental flats',
          'rent flat',
          'rent flats',
          'flat for rent',
          'flats for rent',
          'rental apartment',
          'rental apartments',
          'rentalflat',
        ],
        'rental villa': [
          'rental villa',
          'rental villas',
          'rent villa',
          'rent villas',
          'villa for rent',
          'rentalvilla',
        ],
        'rental plot': [
          'rental plot',
          'rental plots',
          'rent plot',
          'rent plots',
          'plot for rent',
          'rentalplot',
        ],
        'rental row house': [
          'rental rowhouse',
          'rental row house',
          'rent rowhouse',
          'rent row house',
          'rentalrowhouse',
        ],
        'resale flat': [
          'resale flat',
          'resale flats',
          'resale apartment',
          'resale apartments',
          'second hand flat',
          'second hand flats',
          'resaleflat',
        ],
        'resale villa': [
          'resale villa',
          'resale villas',
          'second hand villa',
          'resalevilla',
        ],
        'resale plot': [
          'resale plot',
          'resale plots',
          'second hand plot',
          'resaleplot',
        ],
        'new flat': [
          'new flat',
          'new flats',
          'new project',
          'new launch',
          'under construction',
          'new apartment',
          'new apartments',
          'newflat',
        ],
        'new villa': ['new villa', 'new villas', 'newvilla'],
        flat: ['flat', 'flats', 'apartment', 'apartments'],
        villa: ['villa', 'villas'],
        'row house': ['rowhouse', 'row house', 'row-house'],
        plot: ['plot', 'land', 'plots'],
        bungalow: ['bungalow', 'bungalows'],
      };

      let parsedCategory = null;
      for (const [key, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(kw => lower.includes(kw))) {
          parsedCategory =
            propertyCategory.find(
              c => normalizePropertyCategory(c) === key.toLowerCase(),
            ) || null;
          if (parsedCategory) break;
        }
      }

      return {
        bhk: parsedBhk,
        city: parsedCity,
        category: parsedCategory,
        rawText: lower,
      };
    },
    [cities, propertyCategory],
  );

  // ─── Apply Filters ───
  const applyFilters = useCallback(() => {
    const {
      bhk: parsedBhk,
      city: parsedCity,
      category: parsedCategory,
    } = parseSearchQuery(searchText);

    const effectiveCity = parsedCity || selectedCity;
    const effectiveTab = parsedCategory || selectedTab;

    if (parsedCity && parsedCity !== selectedCity) setSelectedCity(parsedCity);
    if (parsedCategory && parsedCategory !== selectedTab)
      setSelectedTab(parsedCategory);

    const filtered = flats.filter(item => {
      const category = String(item.propertyCategory || '');
      const matchGroup =
        listingGroup === 'buy'
          ? !category.startsWith('Rental')
          : listingGroup === 'rent'
          ? isRentalCategory(category)
          : true;

      const matchTab =
        !effectiveTab ||
        normalizePropertyCategory(item.propertyCategory) ===
          normalizePropertyCategory(effectiveTab);

      const matchCategory =
        !filterpropertyCategory.length ||
        filterpropertyCategory.some(
          fc =>
            normalizePropertyCategory(fc) ===
            normalizePropertyCategory(item.propertyCategory),
        );

      const activeBhkFilters = filterbhk.length
        ? filterbhk
        : parsedBhk
        ? [parsedBhk]
        : [];
      const matchBhk =
        !activeBhkFilters.length ||
        (Array.isArray(item.propertyType) &&
          item.propertyType.some(pt =>
            activeBhkFilters.some(
              fb => fb.toLowerCase() === pt?.trim().toLowerCase(),
            ),
          ));

      const priceInLakh = item.totalOfferPrice
        ? Number(item.totalOfferPrice) / 100000
        : 0;
      const matchBudget =
        !filterbudget.length ||
        (priceInLakh >= filterbudget[0] && priceInLakh <= filterbudget[1]);

      const matchCity = cityMatches(item.city, effectiveCity);

      const matchLocation =
        !filterLocations.length ||
        filterLocations.some(
          loc => normalize(loc) === normalize(item.location || ''),
        );

      let strippedQuery = searchText.toLowerCase();
      strippedQuery = strippedQuery.replace(/\d+\s*(?:bhk|bedroom|bed)/g, '');
      strippedQuery = strippedQuery.replace(/\bin\s+[\w\s]+/g, '');
      const allCategoryKeywords = [
        'rental',
        'rent',
        'resale',
        'new',
        'flat',
        'flats',
        'apartment',
        'apartments',
        'villa',
        'villas',
        'plot',
        'plots',
        'rowhouse',
        'row house',
        'bungalow',
        'bungalows',
        'for rent',
        'for sale',
        'second hand',
        'under construction',
        'launch',
        'project',
        'land',
      ];
      allCategoryKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        strippedQuery = strippedQuery.replace(regex, '');
      });
      strippedQuery = strippedQuery.replace(/\s+/g, ' ').trim();

      const searchableFields = [
        item.city,
        item.location,
        item.projectBy,
        item.propertyName,
        item.address,
        item.nearestLandmark,
        item.seoSlug,
        item.propertyDescription,
        normalizePropertyCategory(item.propertyCategory),
        ...(Array.isArray(item.propertyType) ? item.propertyType : []),
      ]
        .filter(Boolean)
        .map(f => String(f).toLowerCase());

      const matchSearch =
        !strippedQuery ||
        searchableFields.some(field => field.includes(strippedQuery));

      const matchAmenities =
        !amenities.length ||
        amenities.every(selectedAmenity => {
          const propertyAmenities = getPropertyAmenities(item);
          const matchKeys = AMENITY_MATCH_MAP[selectedAmenity] || [];
          return matchKeys.some(key =>
            propertyAmenities.some(pa => pa.includes(key)),
          );
        });

      return (
        matchGroup &&
        matchTab &&
        matchCategory &&
        matchBhk &&
        matchBudget &&
        matchCity &&
        matchLocation &&
        matchSearch &&
        matchAmenities
      );
    });

    setFilteredFlats(filtered);
    setFilterVisible(false);
  }, [
    flats,
    listingGroup,
    searchText,
    selectedCity,
    selectedTab,
    filterpropertyCategory,
    filterbhk,
    filterbudget,
    filterLocations,
    amenities,
    parseSearchQuery,
  ]);

  const handleSuggestionSelect = item => {
    if (item.city) setSelectedCity(item.city);
    setSearchText(item.searchText || item.label);
    setShowSuggestions(false);
    searchInputRef.current?.blur();
  };

  const renderItem = useCallback(({item}) => <PropertyCard item={item} />, []);

  // Fixed Property Type list per listing mode, same as reparv.in
  const filterTypeOptions = React.useMemo(() => {
    if (ptype?.startsWith('Rental') || listingGroup === 'rent') {
      return RENTAL_PROPERTY_TYPES;
    }
    if (ptype?.startsWith('Resale')) return RESALE_PROPERTY_TYPES;
    if (listingGroup === 'buy') {
      return [...NEW_PROPERTY_TYPES, ...RESALE_PROPERTY_TYPES];
    }
    return NEW_PROPERTY_TYPES;
  }, [ptype, listingGroup]);

  const selectedFilterType = filterpropertyCategory[0] || '';
  const bhkOptions = BHK_TYPES_BY_CATEGORY[selectedFilterType] || [];

  // Locations available for the current city + chosen type
  const locationOptions = React.useMemo(() => {
    const typeForLocations = selectedFilterType || selectedTab;
    return [
      ...new Set(
        flats
          .filter(
            item =>
              cityMatches(item.city, selectedCity) &&
              (!typeForLocations ||
                normalizePropertyCategory(item.propertyCategory) ===
                  normalizePropertyCategory(typeForLocations)),
          )
          .map(item => item.location?.trim())
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [flats, selectedCity, selectedFilterType, selectedTab]);

  const toggleSection = key =>
    setOpenSections(prev => ({...prev, [key]: !prev[key]}));

  const toggleInList = (setFn, value) =>
    setFn(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value],
    );

  const onBudgetInputChange = (key, text) => {
    const next = {...budgetInputs, [key]: text.replace(/[^0-9]/g, '')};
    setBudgetInputs(next);
    if (!next.min && !next.max) {
      setFilterBudget([]);
      return;
    }
    setFilterBudget([
      next.min ? Number(next.min) / 100000 : 0,
      next.max ? Number(next.max) / 100000 : Infinity,
    ]);
  };

  const clearFilterSelections = () => {
    setFilterPropertyCategory([]);
    setFilterBhk([]);
    setFilterBudget([]);
    setBudgetInputs({min: '', max: ''});
    setFilterLocations([]);
    setAmenities([]);
  };

  const filteredCategories = React.useMemo(() => {
    if (!ptype && listingGroup === 'buy') {
      return propertyCategory.filter(item => !item.startsWith('Rental'));
    }
    if (!ptype && listingGroup === 'rent') {
      return propertyCategory.filter(isRentalCategory);
    }
    if (!ptype) return propertyCategory;
    if (ptype.startsWith('Rental'))
      return propertyCategory.filter(item => item.startsWith('Rental'));
    if (ptype.startsWith('Resale'))
      return propertyCategory.filter(item => item.startsWith('Resale'));
    return propertyCategory.filter(
      item => !item.startsWith('Rental') && !item.startsWith('Resale'),
    );
  }, [ptype, listingGroup, propertyCategory]);

  // ─── Active filters for display chips ───
  const activeFilterChips = React.useMemo(() => {
    const chips = [];
    filterpropertyCategory.forEach(cat =>
      chips.push({
        key: `cat-${cat}`,
        label: formatCategoryLabel(cat),
        onRemove: () =>
          setFilterPropertyCategory(prev => prev.filter(c => c !== cat)),
      }),
    );
    filterbhk.forEach(b =>
      chips.push({
        key: `bhk-${b}`,
        label: b,
        onRemove: () => setFilterBhk(prev => prev.filter(c => c !== b)),
      }),
    );
    filterLocations.forEach(loc =>
      chips.push({
        key: `loc-${loc}`,
        label: loc,
        onRemove: () => setFilterLocations(prev => prev.filter(l => l !== loc)),
      }),
    );
    amenities.forEach(a =>
      chips.push({
        key: `am-${a}`,
        label: a,
        onRemove: () => setAmenities(prev => prev.filter(c => c !== a)),
      }),
    );
    if (filterbudget.length === 2) {
      const [min, max] = filterbudget;
      let label;
      if (min > 0 && max !== Infinity)
        label = `₹${formatPrice(min)} – ₹${formatPrice(max)}`;
      else if (min > 0) label = `Above ₹${formatPrice(min)}`;
      else label = `Under ₹${formatPrice(max)}`;
      chips.push({
        key: 'budget',
        label,
        onRemove: () => {
          setFilterBudget([]);
          setBudgetInputs({min: '', max: ''});
        },
      });
    }
    return chips;
  }, [
    filterpropertyCategory,
    filterbhk,
    filterLocations,
    amenities,
    filterbudget,
  ]);

  const hasActiveFilters = activeFilterChips.length > 0;

  const resetAllFilters = () => {
    clearFilterSelections();
    applyFilters();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F7F7F7"
        translucent={false}
      />

      <View style={{flex: 1, position: 'relative'}}>
        <View style={styles.container}>
          {/* ── Search Row ── */}
          <View style={styles.searchRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}>
              <BackIcon width={18} height={18} fill="#555" />
            </TouchableOpacity>

            <View style={styles.searchBox}>
              <Image
                source={SearchIcon}
                style={styles.searchIcon}
                resizeMode="contain"
              />
              <TextInput
                ref={searchInputRef}
                placeholder="Search city, project, locality..."
                placeholderTextColor="#9CA3AF"
                value={searchText}
                onChangeText={text => {
                  setSearchText(text);
                  buildSuggestions(text);
                  if (!text) {
                    setSelectedCity('');
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => {
                  if (searchText.length >= 2) setShowSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 180);
                }}
                style={styles.searchInput}
                returnKeyType="search"
                onSubmitEditing={() => {
                  setShowSuggestions(false);
                  applyFilters();
                }}
              />
              {searchText.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchText('');
                    setSelectedCity('');
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  style={styles.clearBtn}>
                  <Text style={styles.clearX}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.filterBtn,
                hasActiveFilters && styles.filterBtnActive,
              ]}
              onPress={() => setFilterVisible(true)}
              activeOpacity={0.85}>
              <ListFilter width={20} height={20} color="#fff" />
              {hasActiveFilters && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {activeFilterChips.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Autocomplete Dropdown ── */}
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <TouchableOpacity
                style={styles.showAllRow}
                onPress={() => {
                  setShowSuggestions(false);
                  applyFilters();
                }}>
                <Text style={styles.showAllText}>Show All</Text>
              </TouchableOpacity>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                style={{maxHeight: 320}}
                showsVerticalScrollIndicator={false}>
                {suggestions.map((item, idx) => (
                  <TouchableOpacity
                    key={`${item.type}-${idx}`}
                    style={[
                      styles.suggestionItem,
                      idx === suggestions.length - 1 && {borderBottomWidth: 0},
                    ]}
                    onPress={() =>
                      navigation.navigate('PropertyDetails', {
                        seoSlug: item?.seoSlug,
                      })
                    }>
                    <View style={styles.suggestionThumb}>
                      {item.image ? (
                        <Image
                          source={{uri: item.image}}
                          style={styles.suggestionThumbImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.suggestionThumbPlaceholder} />
                      )}
                    </View>
                    <View style={styles.suggestionLeft}>
                      <HighlightMatch
                        text={item.label}
                        query={searchText}
                        style={styles.suggestionLabel}
                      />
                      <Text style={styles.suggestionSublabel} numberOfLines={1}>
                        {item.city}
                        {item.location
                          ? ` - ${item.location.toUpperCase()}`
                          : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Category Tabs ── */}
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
                      style={[
                        styles.tabText,
                        isActive && styles.activeTabText,
                      ]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Active Filter Chips ── */}
          {hasActiveFilters && (
            <View style={styles.activeFiltersRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.activeFiltersScroll}>
                {activeFilterChips.map(chip => (
                  <ActiveChip
                    key={chip.key}
                    label={chip.label}
                    onRemove={() => {
                      chip.onRemove();
                      // re-apply with slight delay so state updates
                      setTimeout(applyFilters, 50);
                    }}
                  />
                ))}
                <TouchableOpacity
                  onPress={resetAllFilters}
                  style={styles.clearAllChip}>
                  <Text style={styles.clearAllChipText}>Clear All</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* ── Result Count Row ── */}
          <View style={styles.resultRow}>
            <View>
              <Text
                style={[styles.resultText, {fontSize: 12, color: '#868686'}]}>
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
            {selectedCity ? (
              <TouchableOpacity
                onPress={() => {
                  setSelectedCity('');
                  setSearchText('');
                }}
                style={styles.clearCityBtn}>
                <Text style={styles.clearCityText}>✕ {selectedCity}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* ── Property List ── */}
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#7A2EFF" />
              <Text style={styles.loaderText}>Loading properties...</Text>
            </View>
          ) : filteredFlats.length === 0 ? (
            <EmptyState
              city={selectedCity || 'your city'}
              suggestedCities={cities
                .filter(city => !cityMatches(city, selectedCity))
                .slice(0, 8)}
              onSelectCity={city => {
                setSelectedCity(city);
                setSearchText('');
              }}
              onReset={() => {
                clearFilterSelections();
                setSelectedCity('');
                setSelectedTab('');
                setSearchText('');
                fetchFlats();
                setFilterVisible(false);
              }}
            />
          ) : (
            <FlatList
              data={filteredFlats}
              renderItem={renderItem}
              keyExtractor={item => item.propertyid.toString()}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={Platform.OS === 'android'}
              initialNumToRender={8}
              maxToRenderPerBatch={10}
              windowSize={10}
              updateCellsBatchingPeriod={50}
            />
          )}

          {/* ── FILTER MODAL ── */}
          <Modal
            visible={filterVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setFilterVisible(false)}>
            {/* ── Backdrop tap closes modal ── */}
            <Pressable
              style={styles.overlay}
              onPress={() => setFilterVisible(false)}>
              {/* Inner sheet — stop propagation so tapping inside doesn't close */}
              <Pressable
                style={styles.sheet}
                onPress={e => e.stopPropagation()}>
                {/* ── Drag handle ── */}
                <View style={styles.dragHandle} />

                {/* ── Header ── */}
                <View style={styles.headerRow}>
                  <Text style={styles.headerTitle}>Filters</Text>
                  <View style={styles.headerActions}>
                    <TouchableOpacity onPress={clearFilterSelections}>
                      <Text style={styles.resetText}>Reset All</Text>
                    </TouchableOpacity>

                    {/* ── Close (✕) button ── */}
                    <TouchableOpacity
                      onPress={() => setFilterVisible(false)}
                      style={styles.closeBtn}
                      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                      <X size={18} color="#444" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ── Scrollable content ── */}
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{paddingBottom: 8}}>
                  <FilterSection
                    title="Property Type"
                    open={openSections.type}
                    onToggle={() => toggleSection('type')}>
                    <View style={styles.chipWrap}>
                      {filterTypeOptions.map(item => {
                        const active = selectedFilterType === item;
                        return (
                          <TouchableOpacity
                            key={item}
                            onPress={() => {
                              setSelectedTab('');
                              setFilterPropertyCategory(active ? [] : [item]);
                              setFilterBhk([]);
                              setFilterLocations([]);
                            }}
                            style={[styles.chip, active && styles.chipActive]}>
                            <Text
                              style={[
                                styles.chipText,
                                active && styles.chipTextActive,
                              ]}>
                              {formatCategoryLabel(item)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </FilterSection>

                  <FilterSection
                    title="BHK Configuration"
                    open={openSections.bhk}
                    onToggle={() => toggleSection('bhk')}>
                    {bhkOptions.length > 0 ? (
                      <View style={styles.chipWrap}>
                        {bhkOptions.map(item => {
                          const active = filterbhk.includes(item);
                          return (
                            <TouchableOpacity
                              key={item}
                              onPress={() => setFilterBhk(active ? [] : [item])}
                              style={[
                                styles.chip,
                                styles.chipSquare,
                                active && styles.chipActive,
                              ]}>
                              <Text
                                style={[
                                  styles.chipText,
                                  active && styles.chipTextActive,
                                ]}>
                                {item}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={styles.filterHint}>
                        {selectedFilterType
                          ? 'No configurations for this property type'
                          : 'Select a property type to see configurations'}
                      </Text>
                    )}
                  </FilterSection>

                  <FilterSection
                    title="Budget Range"
                    open={openSections.budget}
                    onToggle={() => toggleSection('budget')}>
                    <View style={styles.budgetRow}>
                      <View style={styles.budgetField}>
                        <Text style={styles.budgetLabel}>Min</Text>
                        <TextInput
                          value={budgetInputs.min}
                          onChangeText={t => onBudgetInputChange('min', t)}
                          keyboardType="number-pad"
                          placeholder="₹ Min"
                          placeholderTextColor="#9CA3AF"
                          style={styles.budgetInput}
                        />
                      </View>
                      <View style={styles.budgetField}>
                        <Text style={styles.budgetLabel}>Max</Text>
                        <TextInput
                          value={budgetInputs.max}
                          onChangeText={t => onBudgetInputChange('max', t)}
                          keyboardType="number-pad"
                          placeholder="₹ Max"
                          placeholderTextColor="#9CA3AF"
                          style={styles.budgetInput}
                        />
                      </View>
                    </View>
                  </FilterSection>

                  <FilterSection
                    title="Locations"
                    open={openSections.locations}
                    onToggle={() => toggleSection('locations')}>
                    {locationOptions.length > 0 ? (
                      <ScrollView
                        nestedScrollEnabled
                        style={styles.checkList}
                        showsVerticalScrollIndicator={false}>
                        {locationOptions.map(loc => (
                          <CheckboxRow
                            key={loc}
                            label={loc}
                            checked={filterLocations.includes(loc)}
                            onPress={() =>
                              toggleInList(setFilterLocations, loc)
                            }
                          />
                        ))}
                      </ScrollView>
                    ) : (
                      <Text style={styles.filterHint}>
                        No locations available
                      </Text>
                    )}
                  </FilterSection>

                  <FilterSection
                    title="Amenities"
                    open={openSections.amenities}
                    onToggle={() => toggleSection('amenities')}>
                    <ScrollView
                      nestedScrollEnabled
                      style={styles.checkList}
                      showsVerticalScrollIndicator={false}>
                      {AMENITIES_DATA.map(item => (
                        <CheckboxRow
                          key={item}
                          label={item}
                          checked={amenities.includes(item)}
                          onPress={() => toggleInList(setAmenities, item)}
                        />
                      ))}
                    </ScrollView>
                  </FilterSection>
                </ScrollView>

                {/* ── Sticky bottom buttons ── */}
                <View style={styles.stickyFooter}>
                  <TouchableOpacity
                    style={styles.footerResetBtn}
                    onPress={clearFilterSelections}>
                    <Text style={styles.footerResetText}>Reset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.applyBtn}
                    onPress={applyFilters}>
                    <Text style={styles.applyText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PropertyListScreen;

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

  // ── Search ──
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.09)',
    paddingHorizontal: 14,
    height: 52,
  },
  searchIcon: {
    width: 17,
    height: 17,
    tintColor: '#9CA3AF',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#111827',
    padding: 0,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  clearBtn: {paddingHorizontal: 6, paddingVertical: 4},
  clearX: {fontSize: 13, color: '#AAAAAA'},

  // ── Filter button with badge ──
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#7A2EFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  filterBtnActive: {
    backgroundColor: '#5E10E6',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F7F7F7',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },

  // ── Autocomplete ──
  suggestionsContainer: {
    position: 'absolute',
    top: 68,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 16,
    zIndex: 999,
    elevation: 14,
    shadowColor: '#7A2EFF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  showAllRow: {
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  showAllText: {
    color: '#7A2EFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 12,
  },
  suggestionThumb: {
    width: 62,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#EDE9FE',
  },
  suggestionThumbImg: {width: '100%', height: '100%'},
  suggestionThumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EDE9FE',
  },
  suggestionLeft: {flex: 1, gap: 4},
  suggestionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  suggestionSublabel: {fontSize: 12, color: '#6B7280'},

  // ── Tabs ──
  tabRow: {flexDirection: 'row', marginBottom: 10},
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD',
    marginRight: 8,
    height: 30,
  },
  activeTab: {backgroundColor: '#7A2EFF', borderColor: '#7A2EFF'},
  tabText: {color: '#777'},
  activeTabText: {color: 'white'},

  // ── Active filter chips ──
  activeFiltersRow: {
    marginBottom: 8,
  },
  activeFiltersScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#C4B5FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: 160,
  },
  activeChipText: {
    fontSize: 12,
    color: '#7A2EFF',
    fontWeight: '600',
    flexShrink: 1,
  },
  clearAllChip: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  clearAllChipText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
  },

  // ── Result Row ──
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  resultText: {color: 'black'},
  clearCityBtn: {
    backgroundColor: '#F4EDFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  clearCityText: {color: '#7A2EFF', fontWeight: '600', fontSize: 13},

  // ── Loader ──
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  loaderText: {marginTop: 10, fontSize: 14, color: '#868686'},

  // ── Filter Modal ──
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 0,
    maxHeight: '88%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCC',
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 14,
  },

  // ── Modal Header ──
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  resetText: {
    color: '#000',
    fontWeight: '400',
    fontSize: 14,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Filter sections (mirrors reparv.in FilterSidebar) ──
  filterSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontFamily: 'SegoeUI-Bold',
    fontWeight: '700',
    color: '#000',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  filterSectionBody: {marginTop: 14},
  filterHint: {fontSize: 12, color: '#9CA3AF'},

  chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FBF5FF',
  },
  chipSquare: {borderRadius: 8},
  chipActive: {backgroundColor: '#8A38F5'},
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  chipTextActive: {
    color: '#fff',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },

  // ── Budget ──
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  budgetField: {flex: 1},
  budgetLabel: {
    marginLeft: 4,
    marginBottom: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  budgetInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    color: '#000',
  },

  // ── Locations / Amenities checkboxes ──
  checkList: {maxHeight: 170},
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    marginRight: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#8A38F5',
    borderColor: '#8A38F5',
  },
  checkboxTick: {color: '#fff', fontSize: 9, fontWeight: '700'},
  checkboxText: {
    flex: 1,
    fontSize: 13,
    color: '#111',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },

  // ── Sticky footer ──
  stickyFooter: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 4,
    backgroundColor: '#FFF',
  },
  footerResetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerResetText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: '#8A38F5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
});
