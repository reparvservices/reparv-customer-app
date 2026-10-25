import React, {useEffect, useRef, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ToastAndroid,
  TextInput,
  Pressable,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {WebView} from 'react-native-webview';

import BackIcon from '../assets/image/new-property/back-icon.svg';
import ArrowIcon from '../assets/image/onboarding/arrow.svg';

import OldPropertyArea from '../components/old-property/OldPropertyArea';
import FarmLandArea from '../components/old-property/FarmLandArea';
import OldPriceDetails from '../components/old-property/OldPriceDetails';
import OldContactDetails from '../components/old-property/OldContactDetails';
import OldUploadImg from '../components/old-property/OldUploadImg';
import {MapPin, X, Navigation2, Crosshair} from 'lucide-react-native';
import {useSelector} from 'react-redux';
import AllPropertyTypeSelector, {
  allTypeHidesBhk,
} from '../components/propertyUpdate/AllTypeProperty';

// ─── API Base URL ─────────────────────────────────────────────────────────────
const API_BASE_URL = 'https://aws-api.reparv.in';

// ─── Geocode cache ────────────────────────────────────────────────────────────
const geoCache = {};

const geocodePlace = async (pincode, city, stateName) => {
  const q = `${pincode || ''} ${city || ''} ${stateName || ''} India`.trim();
  if (geoCache[q]) return geoCache[q];
  try {
    const r = await fetch(
      `${API_BASE_URL}/api/map/geocode?q=${encodeURIComponent(q)}`,
    );
    const d = await r.json();
    if (d?.length > 0) {
      const c = {lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon)};
      geoCache[q] = c;
      return c;
    }
  } catch {}
  return null;
};

const reverseGeocode = async (lat, lng) => {
  const k = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (geoCache[k]) return geoCache[k];
  try {
    const r = await fetch(
      `${API_BASE_URL}/api/map/reverse?lat=${lat}&lon=${lng}`,
    );
    const d = await r.json();
    const result = {
      pincode: d?.address?.postcode || '',
      displayName: d?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    };
    geoCache[k] = result;
    return result;
  } catch {
    return {pincode: '', displayName: `${lat.toFixed(5)}, ${lng.toFixed(5)}`};
  }
};

// ─── Map HTML builder ─────────────────────────────────────────────────────────
const buildMap = (lat, lng, zoom) => `<!DOCTYPE html><html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#map{width:100%;height:100%;overflow:hidden}
.pin{width:30px;height:30px;background:#8A38F5;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(138,56,245,0.5)}
.dot{width:10px;height:10px;background:white;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
#btn{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#8A38F5;color:white;border:none;border-radius:14px;padding:14px 36px;font-size:15px;font-weight:700;cursor:pointer;z-index:9999;display:none;align-items:center;box-shadow:0 4px 16px rgba(138,56,245,0.4);white-space:nowrap}
#btn.show{display:flex}
#chip{position:fixed;top:12px;left:12px;right:12px;background:rgba(255,255,255,0.96);border-radius:12px;padding:10px 14px;font-size:12px;color:#111;box-shadow:0 2px 10px rgba(0,0,0,0.12);z-index:9999;display:none;line-height:1.5}
#chip.show{display:block}
#chip .lbl{font-weight:700;color:#8A38F5;font-size:11px;margin-bottom:2px}
#chip .coords{font-size:11px;color:#9CA3AF;margin-top:2px}
#hint{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.6);color:white;border-radius:20px;padding:8px 16px;font-size:12px;z-index:9999;white-space:nowrap}
</style>
</head>
<body>
<div id="map"></div>
<div id="chip"><div class="lbl">📍 Pinned Location</div><div id="addr">Fetching...</div><div class="coords" id="coords"></div></div>
<div id="hint">👆 Tap to place pin · Drag to adjust</div>
<button id="btn" onclick="doConfirm()">✓  Confirm Location</button>
<script>
var map = L.map('map').setView([${lat},${lng}],${zoom});
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{
  subdomains:['a','b','c','d'],maxZoom:19
}).addTo(map);
var sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19});
L.control.layers({'Street Map':map,'Satellite':sat},{},{position:'topright'}).addTo(map);
var icon = L.divIcon({
  className:'',
  html:'<div class="pin"><div class="dot"></div></div>',
  iconSize:[30,30],
  iconAnchor:[15,30]
});
var mk = null, cLat = null, cLng = null;
${
  lat !== 20.5937
    ? `mk=L.marker([${lat},${lng}],{icon:icon,draggable:true}).addTo(map);
       cLat=${lat}; cLng=${lng};
       mk.on('dragend',onDrag);
       showChip(${lat},${lng});
       document.getElementById('btn').classList.add('show');`
    : ''
}
map.on('click',function(e){ place(e.latlng.lat, e.latlng.lng); });
function place(lat,lng){
  cLat=lat; cLng=lng;
  if(mk){ mk.setLatLng([lat,lng]); }
  else { mk=L.marker([lat,lng],{icon:icon,draggable:true}).addTo(map); mk.on('dragend',onDrag); }
  document.getElementById('btn').classList.add('show');
  document.getElementById('hint').style.display='none';
  showChip(lat,lng);
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'SEL',lat:lat,lng:lng}));
}
function onDrag(e){
  var p=e.target.getLatLng();
  place(p.lat,p.lng);
}
function showChip(lat,lng){
  document.getElementById('chip').classList.add('show');
  document.getElementById('addr').innerText='Fetching address...';
  document.getElementById('coords').innerText=lat.toFixed(6)+'°N  '+lng.toFixed(6)+'°E';
}
function updateAddr(a){ document.getElementById('addr').innerText=a; }
function doConfirm(){
  if(cLat===null) return;
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'CONFIRM',lat:cLat,lng:cLng}));
}
function flyTo(lat,lng,z){ map.flyTo([lat,lng],z||13,{animate:true,duration:1.2}); }
</script>
</body></html>`;

// ─── MapModal component ───────────────────────────────────────────────────────
function MapModal({
  visible,
  onClose,
  onConfirm,
  initialCoords,
  cityName,
  stateName,
  pincode,
}) {
  const [center, setCenter] = useState({lat: 20.5937, lng: 78.9629});
  const [zoom, setZoom] = useState(5);
  const [loading, setLoading] = useState(true);
  const [revAddr, setRevAddr] = useState('');
  const [revPc, setRevPc] = useState('');
  const [pending, setPending] = useState(null);
  const wvRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    setPending(null);
    setRevAddr('');
    setRevPc('');
    if (initialCoords?.latitude && initialCoords?.longitude) {
      setCenter({lat: initialCoords.latitude, lng: initialCoords.longitude});
      setZoom(14);
      setLoading(false);
      return;
    }
    setLoading(true);
    geocodePlace(pincode, cityName, stateName).then(c => {
      if (c) {
        setCenter(c);
        setZoom(13);
      } else {
        setCenter({lat: 20.5937, lng: 78.9629});
        setZoom(5);
      }
      setLoading(false);
    });
  }, [visible]);

  const onMsg = useCallback(
    async e => {
      try {
        const msg = JSON.parse(e.nativeEvent.data);

        if (msg.type === 'SEL') {
          // User tapped / dragged pin — store pending coords and reverse-geocode
          const newPending = {latitude: msg.lat, longitude: msg.lng};
          setPending(newPending);
          const r = await reverseGeocode(msg.lat, msg.lng);
          setRevAddr(r.displayName);
          setRevPc(r.pincode);
          wvRef.current?.injectJavaScript(
            `updateAddr(${JSON.stringify(r.displayName)}); true;`,
          );
        }

        if (msg.type === 'CONFIRM') {
          // User pressed "Confirm Location" — use the last pending coords
          const coords =
            pending ||
            (initialCoords
              ? {
                  latitude: initialCoords.latitude,
                  longitude: initialCoords.longitude,
                }
              : null);

          if (!coords) {
            ToastAndroid.show(
              'Please pin a location first',
              ToastAndroid.SHORT,
            );
            return;
          }

          // ✅ Pass lat/lng + address back to parent
          onConfirm({
            latitude: coords.latitude,
            longitude: coords.longitude,
            address: revAddr,
            pincode: revPc,
          });
          onClose();
        }
      } catch (err) {
        console.log('MapModal message error:', err);
      }
    },
    [pending, revAddr, revPc, initialCoords, onConfirm, onClose],
  );

  const handleRecenter = async () => {
    const c = await geocodePlace(pincode, cityName, stateName);
    if (c) {
      wvRef.current?.injectJavaScript(`flyTo(${c.lat},${c.lng},13); true;`);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
        {/* Header bar */}
        <View style={mapStyles.bar}>
          <TouchableOpacity onPress={onClose} style={mapStyles.barBtn}>
            <X size={22} color="#111" />
          </TouchableOpacity>
          <View style={{alignItems: 'center', flex: 1}}>
            <Text style={mapStyles.title}>Pin Location</Text>
            {(cityName || stateName) && (
              <Text style={mapStyles.sub}>
                {[cityName, stateName].filter(Boolean).join(', ')}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[mapStyles.barBtn, mapStyles.recenter]}
            onPress={handleRecenter}>
            <Crosshair size={20} color="#8A38F5" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={mapStyles.loader}>
            <ActivityIndicator size="large" color="#8A38F5" />
            <Text style={mapStyles.loaderText}>
              Locating {cityName || 'location'}...
            </Text>
          </View>
        ) : (
          <WebView
            ref={wvRef}
            style={{flex: 1}}
            source={{html: buildMap(center.lat, center.lng, zoom)}}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            onMessage={onMsg}
            scrollEnabled={false}
            bounces={false}
            mixedContentMode="always"
            allowUniversalAccessFromFileURLs
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const mapStyles = StyleSheet.create({
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  barBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  recenter: {
    backgroundColor: '#F3E8FF',
  },
  title: {fontSize: 15, fontWeight: '700', color: '#111827'},
  sub: {fontSize: 12, color: '#6B7280', marginTop: 1},
  loader: {flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12},
  loaderText: {fontSize: 14, color: '#6B7280'},
});

// ── Farm type IDs
const FARM_TYPES = ['FarmLand', 'FarmHouse'];
const isFarmType = id => FARM_TYPES.includes(id);

const NO_INTERIOR_CATS = new Set([
  'NewPlot',
  'ResaleFarmLand',
  'NewShop',
  'OfficeSpace',
  'Showrooms',
  'Warehouse',
  'ResaleShop',
  'ResaleOffice',
  'ResaleGodown',
  'RentalShop',
  'RentalOffice',
  'FarmLand',
  'FarmHouse',
  'ResaleWarehouse',
  'CommercialPlot',
  'ResaleCommercial',
  'ResalePlot',
  'RentalVilla',
  'RentalBungalow',
  'RentalFarmHouse',
  'RentalShowroom',
  'RentalGodown',
]);

const NO_LOAN_CATS = new Set([
  'RentalFlat',
  'RentalPlot',
  'RentalShop',
  'RentalOffice',
  'RentalVilla',
  'RentalBungalow',
  'RentalFarmHouse',
  'RentalShowroom',
  'RentalGodown',
]);

const NO_FLOOR_CATS = new Set([
  'FarmLand',
  'NewPlot',
  'RentalPlot',
  'ResaleHouse',
  'ResaleVilla',
  'ResaleBungalow',
  'IndependentHouse',
  'ResaleFarmHouse',
  'Warehouse',
  'ResaleGodown',
  'CommercialPlot',
  'ResaleCommercial',
  'ResalePlot',
  'RentalVilla',
  'RentalBungalow',
  'RentalFarmHouse',
  'RentalGodown',
]);

// ── Option sets
const OWNERSHIP_TYPES = [
  'Freehold',
  'Leasehold',
  'Co-operative Society',
  'Power of Attorney',
];
const PROPERTY_FACING_OPTS = [
  'East-facing',
  'West-facing',
  'North-facing',
  'South-facing',
  'North-East',
  'North-West',
  'South-East',
  'South-West',
];
const LOAN_OPTIONS = ['Yes', 'No'];
const WATER_SUPPLY_OPTS = [
  'Municipal / Corporation Water',
  'Borewell / Tanker',
  'Both',
  'No Water Supply',
];
const POWER_BACKUP_OPTS = [
  'State Electricity Board Supply',
  'Full Power Backup',
  'Partial Power Backup',
  'No Power Backup',
  'Solar Power',
];
const FURNISHING_OPTS = ['Fully Furnished', 'Semi Furnished', 'Unfurnished'];
const PROPERTY_STATUS_OPTS = [
  'Ready to Move',
  'Under Construction',
  'New Launch',
];
const LOCATION_FEATURE_OPTS = [
  'Main Road Facing',
  'Corner Property',
  'Park Facing',
  'Near Metro',
  'Near School / College',
  'Near Hospital',
  'Near Mall',
];
const PARKING_FEATURE_OPTS = [
  'Basement Parking',
  'Open Parking',
  'Covered Parking',
  'No Parking',
  'Multi-level Parking',
];
const TERRACE_FEATURE_OPTS = [
  'Main Road Facing',
  'Private Terrace',
  'Shared Terrace',
  'No Terrace',
  'Terrace Garden',
];
const AMENITIES_OPTS = [
  'Lift / Elevator',
  'Swimming Pool',
  'Gymnasium',
  'Club House',
  'Children Play Area',
  'Jogging Track',
  'Indoor Games Room',
  'Party Hall',
  'Temple / Prayer Room',
  'Garden / Landscape',
  'Intercom',
  'Fire Safety Systems',
  'Visitor Parking',
  'Servant Quarters',
];
const SMART_HOME_OPTS = [
  'Smart Security Cameras / CCTV with Remote Access',
  'Smart Lighting System',
  'Smart Thermostat',
  'Video Door Bell',
  'Smart Locks',
  'Home Automation System',
];
const SECURITY_BENEFIT_OPTS = [
  '24x7 Security',
  'CCTV Surveillance',
  'Gated Community',
  'Intercom Facility',
  'Security Guard',
];
const PRIME_LOCATION_BENEFIT_OPTS = [
  'Near School / College',
  'Near Hospital',
  'Near Airport',
  'Near Railway Station',
  'Near Metro Station',
  'IT Hub Proximity',
];
const RENTAL_INCOME_BENEFIT_OPTS = [
  'Residential Long-Term Rental',
  'Commercial Rental',
  'Short-Term / Airbnb Potential',
  'High Rental Demand Area',
];
const QUALITY_BENEFIT_OPTS = [
  'Low Maintenance Cost',
  'Premium Construction Quality',
  'Branded Fittings',
  'Energy Efficient',
];
const CAPITAL_APPRECIATION_BENEFIT_OPTS = [
  'Increased Return on Investment (ROI)',
  'High Growth Area',
  'Infrastructure Development Nearby',
  'Smart City Project',
];
const ECOFRIENDLY_BENEFIT_OPTS = [
  'Solar Panels',
  'Rainwater Harvesting',
  'Green Building Certified',
  'EV Charging Points',
];

const SHOW_CARPET_AREA_TYPES = [
  'NewFlat',
  'ResaleFlat',
  'RentalFlat',
  'Studio',
  'Penthouse',
  'Duplex',
  'OfficeSpace',
  'RentalOffice',
  'ResaleOffice',
  'NewShop',
  'RentalShop',
  'ResaleShop',
  'Showrooms',
  'RentalShowRoom',
  'ResaleShowRoom',
];
const shouldShowCarpetArea = type => SHOW_CARPET_AREA_TYPES.includes(type);

const RERA_HIDDEN_TYPES = new Set([
  'ResaleHouse',
  'ResaleVilla',
  'ResaleBungalow',
  'IndependentHouse',
  'FarmHouse',
  'ResaleFarmHouse',
  'OfficeSpace',
  'ResaleOffice',
  'Warehouse',
  'ResaleWarehouse',
  'ResaleGodown',
  'RentalFlat',
  'RentalShop',
  'RentalPlot',
  'RentalOffice',
  'RentalVilla',
  'RentalBungalow',
  'RentalFarmHouse',
  'RentalShowroom',
  'RentalGodown',
]);

// ── Step Indicator
const STEP_LABELS = ['Basic Info', 'Property Details', 'Amenities', 'Photos'];
const TOTAL_STEPS = 4;

const StepIndicator = ({currentStep}) => (
  <View style={styles.stepWrapper}>
    {[1, 2, 3, 4].map((s, idx) => (
      <React.Fragment key={s}>
        <View style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              currentStep > s && styles.stepCircleDone,
              currentStep === s && styles.stepCircleActive,
            ]}>
            {currentStep > s ? (
              <Text style={styles.stepCheckmark}>✓</Text>
            ) : (
              <Text
                style={[
                  styles.stepNumber,
                  currentStep === s && styles.stepNumberActive,
                ]}>
                {s}
              </Text>
            )}
          </View>
          <Text
            style={[
              styles.stepLabel,
              currentStep === s && styles.stepLabelActive,
            ]}>
            {STEP_LABELS[idx]}
          </Text>
        </View>
        {s < TOTAL_STEPS && (
          <View
            style={[
              styles.stepConnector,
              currentStep > s && styles.stepConnectorDone,
            ]}
          />
        )}
      </React.Fragment>
    ))}
  </View>
);

// ── ChipSelector
const ChipSelector = ({label, options, value, onSelect, required = false}) => (
  <View style={styles.chipGroup}>
    <Text style={styles.chipGroupLabel}>
      {label}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
    <View style={styles.chipRow}>
      {options.map(opt => {
        const active = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(active ? '' : opt)}
            activeOpacity={0.7}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// ── MultiChipSelector
const MultiChipSelector = ({
  label,
  options,
  value = [],
  onSelect,
  required = false,
}) => {
  const selected = Array.isArray(value) ? value : [];
  const toggle = opt =>
    onSelect(
      selected.includes(opt)
        ? selected.filter(x => x !== opt)
        : [...selected, opt],
    );
  return (
    <View style={styles.chipGroup}>
      <Text style={styles.chipGroupLabel}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={styles.chipRow}>
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggle(opt)}
              activeOpacity={0.7}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ── CustomDropdownModal
const CustomDropdownModal = ({visible, onClose, data, onSelect, title}) => {
  if (!visible) return null;
  return (
    <View style={styles.customModalOverlay}>
      <Pressable style={styles.customModalBackdrop} onPress={onClose} />
      <View style={styles.customModalContent}>
        <View style={styles.customModalHeader}>
          <Text style={styles.customModalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color="#666" size={24} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.customModalScroll}>
          {data.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.customModalItem}
              onPress={() => onSelect(item)}
              activeOpacity={0.7}>
              <Text style={styles.customModalItemText}>
                {item.state || item.city}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

// ── FeatureCard
const FeatureCard = ({title, children}) => (
  <View style={styles.featureCard}>
    <View style={styles.featureCardHeader}>
      <View style={styles.featureCardAccent} />
      <Text style={styles.featureCardTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

// ── NavButtons
const NavButtons = ({
  onBack,
  onNext,
  nextLabel,
  nextColors = ['#8A38F5', '#6D28D9'],
}) => (
  <View style={styles.actionRow}>
    <Pressable style={styles.actionBtn} onPress={onBack}>
      <LinearGradient colors={['#A855F7', '#8B5CF6']} style={styles.gradient}>
        <Text style={styles.btnText}>← Back</Text>
      </LinearGradient>
    </Pressable>
    <Pressable style={styles.actionBtn} onPress={onNext}>
      <LinearGradient colors={nextColors} style={styles.gradient}>
        <Text style={styles.btnText}>{nextLabel}</Text>
      </LinearGradient>
    </Pressable>
  </View>
);

// ─────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────
export default function RentOldNewPropertyScreen({route}) {
  const navigation = useNavigation();
  const {user} = useSelector(state => state.auth);
  const mode = route?.params?.mode || 'add';
  const editStep = route?.params?.step || 1;
  const propertyData = route?.params?.propertyData || null;

  const skipCityReset = useRef(false);
  const scrollRef = useRef(null);

  const [step, setStep] = useState(editStep);
  const [errors, setErrors] = useState({});

  // ── Step 1 state
  const [propertyType, setPropertyType] = useState(null);
  const [bhk, setBhk] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [address, setAddress] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [city, setCity] = useState('');
  const [builtUpArea, setBuiltUpArea] = useState('');
  const [carpetArea, setCarpetArea] = useState('');
  const [farmUnit, setFarmUnit] = useState('Acre');
  const [sellingPrice, setSellingPrice] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');

  // ── Location dropdowns
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [stateModal, setStateModal] = useState(false);
  const [cityModal, setCityModal] = useState(false);

  // ✅ Map / pin state
  const [pinned, setPinned] = useState(null); // {latitude, longitude}
  const [pinnedAddr, setPinnedAddr] = useState(''); // human-readable address
  const [showMap, setShowMap] = useState(false);

  // ── Step 2 state
  const [ownershipType, setOwnershipType] = useState('');
  const [propertyFacing, setPropertyFacing] = useState('');
  const [loanAvailability, setLoanAvailability] = useState('');
  const [reraRegistered, setReraRegistered] = useState('');
  const [propertyStatus, setPropertyStatus] = useState('');
  const [furnishing, setFurnishing] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [floorNo, setFloorNo] = useState('');
  const [builtYear, setBuiltYear] = useState('');
  const [waterSupply, setWaterSupply] = useState('');
  const [powerBackup, setPowerBackup] = useState('');
  const [locationFeature, setLocationFeature] = useState([]);
  const [parkingFeature, setParkingFeature] = useState('');
  const [terraceFeature, setTerraceFeature] = useState('');
  const [propertyDescription, setPropertyDescription] = useState('');

  // ── Step 3 state
  const [amenitiesFeature, setAmenitiesFeature] = useState([]);
  const [smartHomeFeature, setSmartHomeFeature] = useState([]);
  const [securityBenefit, setSecurityBenefit] = useState('');
  const [primeLocationBenefit, setPrimeLocationBenefit] = useState('');
  const [rentalIncomeBenefit, setRentalIncomeBenefit] = useState('');
  const [qualityBenefit, setQualityBenefit] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [capitalAppreciationBenefit, setCapitalAppreciationBenefit] =
    useState('');
  const [ecofriendlyBenefit, setEcofriendlyBenefit] = useState('');
  const APPROVED_BY_OPTS = [
    'AMC',
    'AUDA',
    'BMRDA',
    'GNIDA',
    'IDA',
    'KDA',
    'KDMC',
    'MCG',
    'MCGM',
    'MDDA',
    'MMRDA',
    'NA. TP.',
    'NMRDA',
    'NNL',
    'PCMC',
    'PDA',
    'PMC',
    'PMRDA',
    'TP',
    'VVCMC',
    'WBHIRA',
  ];

  // ── Step 4 state: Images
  const [imageFiles, setImageFiles] = useState({
    frontView: null,
    sideView: null,
    kitchenView: null,
    hallView: null,
    bedroomView: null,
    bathroomView: null,
    balconyView: null,
    nearestLandmark: null,
    developedAmenities: null,
    entranceView: null,
    roadView: null,
    parkingView: null,
    interiorView: null,
    warehouseArea: null,
    loadingArea: null,
    officeArea: null,
    cabinView: null,
    washroomView: null,
    displayArea: null,
    showroomInterior: null,
    farmGardenArea: null,
    terraceSitout: null,
  });

  // ── Helpers
  const splitToArray = val =>
    !val || val === 'null' || val === 'undefined'
      ? []
      : val
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
  const nullStr = v => (!v || v === 'null' || v === 'undefined' ? '' : v);

  // ── Map enabled only when city is selected
  const mapEnabled = Boolean(selectedState && city);

  // ── Derived flags
  const isPlot = NO_INTERIOR_CATS.has(propertyType);
  const isNoLoan = NO_LOAN_CATS.has(propertyType);
  const isNoFloor =
    NO_FLOOR_CATS.has(propertyType) || NO_INTERIOR_CATS.has(propertyType);

  // ── Prefill on edit
  useEffect(() => {
    if (mode === 'edit' && propertyData) {
      const propType =
        propertyData.propertyCategory || propertyData.propertyType;
      setPropertyType(propType);
      setBuiltYear(propertyData.builtYear || '');
      setBhk(propertyData.propertyType || '');
      setPropertyName(propertyData.propertyName || '');
      setAddress(propertyData.address || '');
      skipCityReset.current = true;
      setSelectedState(propertyData.state || '');
      setCity(propertyData.city || '');
      setApprovedBy(nullStr(propertyData.propertyApprovedBy));

      // ✅ Prefill pinned location from saved lat/lng
      if (propertyData.latitude && propertyData.longitude) {
        const lat = parseFloat(propertyData.latitude);
        const lng = parseFloat(propertyData.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          setPinned({latitude: lat, longitude: lng});
          setPinnedAddr(
            propertyData.pinnedAddress || propertyData.address || '',
          );
        }
      }

      if (isFarmType(propType) && propertyData.builtUpArea) {
        const match = String(propertyData.builtUpArea).match(
          /^(\d+(?:\.\d+)?)\s+(.+)$/,
        );
        if (match) {
          setBuiltUpArea(propertyData.builtUpArea);
          setFarmUnit(match[2]);
        } else {
          setBuiltUpArea(propertyData.builtUpArea || '');
        }
      } else {
        setBuiltUpArea(propertyData.builtUpArea || '');
        setCarpetArea(propertyData.carpetArea || '');
      }

      setSellingPrice(String(propertyData.totalOfferPrice || ''));
      setTotalPrice(String(propertyData.totalSalesPrice || ''));
      setOwnerName(propertyData.projectBy || '');
      setPhone(propertyData.contact || '');

      const IMAGE_KEYS = [
        'frontView',
        'sideView',
        'kitchenView',
        'hallView',
        'bedroomView',
        'bathroomView',
        'balconyView',
        'nearestLandmark',
        'developedAmenities',
        'entranceView',
        'roadView',
        'parkingView',
        'interiorView',
        'warehouseArea',
        'loadingArea',
        'officeArea',
        'cabinView',
        'washroomView',
        'displayArea',
        'showroomInterior',
        'farmGardenArea',
        'terraceSitout',
      ];
      const prefillImages = {};
      IMAGE_KEYS.forEach(key => {
        const raw = propertyData[key];
        if (!raw) {
          prefillImages[key] = [];
          return;
        }
        if (Array.isArray(raw)) {
          prefillImages[key] = raw.filter(Boolean);
          return;
        }
        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            prefillImages[key] = Array.isArray(parsed)
              ? parsed.filter(Boolean)
              : [raw];
          } catch {
            prefillImages[key] = [raw];
          }
        }
      });
      setImageFiles(prefillImages);
      setPropertyDescription(propertyData.propertyDescription || '');
      setOwnershipType(nullStr(propertyData.ownershipType));
      setPropertyFacing(nullStr(propertyData.propertyFacing));
      setLoanAvailability(nullStr(propertyData.loanAvailability));
      setReraRegistered(nullStr(propertyData.reraRegistered));
      setPropertyStatus(nullStr(propertyData.propertyStatusFeature));
      setFurnishing(
        nullStr(propertyData.furnishingFeature || propertyData.furnishing),
      );
      setTotalFloors(
        propertyData.totalFloors && propertyData.totalFloors !== 'null'
          ? String(propertyData.totalFloors)
          : '',
      );
      setFloorNo(
        propertyData.floorNo && propertyData.floorNo !== 'null'
          ? String(propertyData.floorNo)
          : '',
      );
      setWaterSupply(nullStr(propertyData.waterSupply));
      setPowerBackup(nullStr(propertyData.powerBackup));
      setLocationFeature(splitToArray(propertyData.locationFeature));
      setParkingFeature(nullStr(propertyData.parkingFeature));
      setTerraceFeature(nullStr(propertyData.terraceFeature));
      setAmenitiesFeature(splitToArray(propertyData.amenitiesFeature));
      setSmartHomeFeature(splitToArray(propertyData.smartHomeFeature));
      setSecurityBenefit(nullStr(propertyData.securityBenefit));
      setPrimeLocationBenefit(nullStr(propertyData.primeLocationBenefit));
      setRentalIncomeBenefit(nullStr(propertyData.rentalIncomeBenefit));
      setQualityBenefit(nullStr(propertyData.qualityBenefit));
      setCapitalAppreciationBenefit(
        nullStr(propertyData.capitalAppreciationBenefit),
      );
      setEcofriendlyBenefit(nullStr(propertyData.ecofriendlyBenefit));
    }
  }, [mode, propertyData]);

  const handlePropertyTypeChange = val => {
    setPropertyType(val);
    if (allTypeHidesBhk(val)) setBhk('');
    setBuiltUpArea('');
    setCarpetArea('');
    setFarmUnit('Acre');
  };

  // Scroll to top on step change
  useEffect(() => {
    scrollRef.current?.scrollTo({y: 0, animated: false});
  }, [step]);

  // Fetch states
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/states`);
        const data = await res.json();
        setStates(data || []);
      } catch (err) {
        console.log('Error fetching states:', err);
      }
    };
    fetchStates();
  }, []);

  // Fetch cities on state change
  useEffect(() => {
    if (!selectedState) return;
    const fetchCities = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/admin/cities/${selectedState}`,
        );
        const data = await res.json();
        setCities(data || []);
      } catch (err) {
        console.log('Error fetching cities:', err);
      }
    };
    fetchCities();
    if (skipCityReset.current) {
      skipCityReset.current = false;
    } else {
      setCity('');
    }
  }, [selectedState]);

  // ── Validations
  const validateStepOne = () => {
    const newErrors = {};
    if (!propertyType) newErrors.propertyType = 'Please select property type';
    if (!allTypeHidesBhk(propertyType) && !bhk)
      newErrors.bhk = 'Please select BHK configuration';
    if (!propertyName) newErrors.propertyName = 'Property name required';
    if (!address) newErrors.address = 'Address required';
    if (!selectedState) newErrors.state = 'State required';
    if (!city) newErrors.city = 'City required';
    if (!builtUpArea)
      newErrors.builtUpArea = isFarmType(propertyType)
        ? 'Land area required'
        : 'Built-up area required';
    if (shouldShowCarpetArea(propertyType) && !carpetArea)
      newErrors.carpetArea = 'Carpet area required';
    if (!sellingPrice) newErrors.sellingPrice = 'Offer price required';
    if (!totalPrice) newErrors.totalPrice = 'Selling price required';
    if (!phone || phone.length !== 10)
      newErrors.phone = 'Valid mobile number required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStepFour = () => {
    const total = Object.values(imageFiles).reduce(
      (s, arr) => s + (arr?.length || 0),
      0,
    );
    if (mode === 'add' && total < 5) {
      ToastAndroid.show('Upload at least 5 images', ToastAndroid.SHORT);
      return false;
    }
    return true;
  };

  // ✅ Map confirm handler — receives {latitude, longitude, address, pincode}
  const handleMapConfirm = useCallback(
    ({latitude, longitude, address: addr, pincode: pc}) => {
      setPinned({latitude, longitude});
      setPinnedAddr(
        addr || `${latitude.toFixed(6)}°N, ${longitude.toFixed(6)}°E`,
      );
      // Optionally auto-fill address field if empty
      if (!address && addr) {
        setAddress(addr);
      }
    },
    [address],
  );

  // ── Submit
  const handleSubmit = async () => {
    const isPlotLocal = NO_INTERIOR_CATS.has(propertyType);
    const isNoLoanLocal = NO_LOAN_CATS.has(propertyType);
    const isNoFloorLocal =
      NO_FLOOR_CATS.has(propertyType) || NO_INTERIOR_CATS.has(propertyType);
    try {
      const areasPayload = isFarmType(propertyType)
        ? JSON.stringify([
            {label: 'Total Land Area', value: builtUpArea, unit: farmUnit},
          ])
        : JSON.stringify(
            shouldShowCarpetArea(propertyType)
              ? [
                  {label: 'Built-up Area', value: builtUpArea, unit: 'sq.ft.'},
                  {label: 'Carpet Area', value: carpetArea, unit: 'sq.ft.'},
                ]
              : [{label: 'Built-up Area', value: builtUpArea, unit: 'sq.ft.'}],
          );

      const payload = {
        property_type: propertyType,
        bhk_type: bhk || null,
        property_name: propertyName,
        price: totalPrice,
        ofprice: sellingPrice,
        contact: phone,
        state: selectedState,
        city,
        propertyApprovedBy: approvedBy || null,
        builtYear: builtYear || null,
        ownername: ownerName || '',
        customerid: user?.id || '',
        address,
        propertyDescription,
        areas: areasPayload,
        // ✅ lat/lng sent to backend
        latitude: pinned ? String(pinned.latitude) : null,
        longitude: pinned ? String(pinned.longitude) : null,
        pinned_address: pinnedAddr || null,
        // Property details
        ownership_type: ownershipType || null,
        property_facing: propertyFacing || null,
        loan_availability: isNoLoanLocal ? null : loanAvailability || null,
        rera_registered: reraRegistered || null,
        property_status: isPlotLocal ? null : propertyStatus || null,
        furnishing: isPlotLocal ? null : furnishing || null,
        total_floors: isNoFloorLocal ? null : totalFloors || null,
        floor_no: isNoFloorLocal ? null : floorNo || null,
        water_supply: waterSupply || null,
        power_backup: powerBackup || null,
        location_feature: locationFeature.length
          ? locationFeature.join(', ')
          : null,
        parking_feature: parkingFeature || null,
        terrace_feature: isPlotLocal ? null : terraceFeature || null,
        amenities_feature: amenitiesFeature.length
          ? amenitiesFeature.join(', ')
          : null,
        smart_home_feature: smartHomeFeature.length
          ? smartHomeFeature.join(', ')
          : null,
        security_benefit: securityBenefit || null,
        prime_location_benefit: primeLocationBenefit || null,
        rental_income_benefit: rentalIncomeBenefit || null,
        quality_benefit: qualityBenefit || null,
        capital_appreciation_benefit: capitalAppreciationBenefit || null,
        ecofriendly_benefit: ecofriendlyBenefit || null,
        ...Object.fromEntries(
          Object.entries(imageFiles).filter(([, arr]) => arr && arr.length > 0),
        ),
      };

      const isEdit = mode === 'edit';
      const url = isEdit
        ? `${API_BASE_URL}/customerapp/property/update/${propertyData.propertyid}`
        : `${API_BASE_URL}/customerapp/property/post`;

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        ToastAndroid.show(
          mode === 'edit'
            ? 'Property updated successfully'
            : 'Property added successfully',
          ToastAndroid.SHORT,
        );
        navigation.goBack();
      } else {
        ToastAndroid.show('Submission failed', ToastAndroid.LONG);
      }
    } catch (err) {
      console.log('Submit error:', err);
      ToastAndroid.show('Network error', ToastAndroid.LONG);
    }
  };

  // ── Navigation
  const handleNext = () => {
    if (step === 1) {
      if (validateStepOne()) {
        setStep(2);
        setTimeout(
          () => scrollRef.current?.scrollTo({y: 0, animated: false}),
          50,
        );
      }
    } else if (step === 2) {
      setStep(3);
      setTimeout(
        () => scrollRef.current?.scrollTo({y: 0, animated: false}),
        50,
      );
    } else if (step === 3) {
      setStep(4);
      setTimeout(
        () => scrollRef.current?.scrollTo({y: 0, animated: false}),
        50,
      );
    } else {
      if (validateStepFour()) handleSubmit();
    }
  };

  const handleBackPress = () => {
    if (step > 1) {
      setStep(step - 1);
      setTimeout(
        () => scrollRef.current?.scrollTo({y: 0, animated: false}),
        50,
      );
    } else {
      navigation.goBack();
    }
  };

  const headerTitle = () => {
    const titles =
      mode === 'edit'
        ? [
            'Update Details',
            'Update Property Info',
            'Update Amenities',
            'Update Photos',
          ]
        : [
            'Basic Details',
            'Property Details',
            'Amenities & Benefits',
            'Upload Photos',
          ];
    return titles[step - 1];
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FAF8FF" barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <BackIcon width={22} height={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle()}</Text>
        <View style={{width: 22}} />
      </View>

      {/* STEP INDICATOR */}
      <StepIndicator currentStep={step} />

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent}>
        {/* ══════════════════════════════════════
            STEP 1 — Basic Info
        ══════════════════════════════════════ */}
        {step === 1 && (
          <>
            <AllPropertyTypeSelector
              value={propertyType}
              onChange={handlePropertyTypeChange}
              bhkValue={bhk}
              onBhkChange={setBhk}
              error={errors.propertyType}
              bhkError={errors.bhk}
            />
            <View style={styles.section}>
              <ChipSelector
                label="Approved By"
                options={APPROVED_BY_OPTS}
                value={approvedBy}
                onSelect={setApprovedBy}
              />
            </View>

            {/* Property Name */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Property Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                placeholder="Enter Building / Project / Society Name"
                placeholderTextColor="#868686"
                style={styles.input}
                value={propertyName}
                onChangeText={setPropertyName}
              />
              {errors.propertyName && (
                <Text style={styles.error}>{errors.propertyName}</Text>
              )}
            </View>

            {/* Address Details */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MapPin color="#8A38F5" size={16} />
                <Text style={styles.sectionTitle}>
                  Address Details <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <TextInput
                placeholder="Enter Property Location"
                placeholderTextColor="#868686"
                style={styles.input}
                value={address}
                onChangeText={setAddress}
              />
              <View style={styles.row}>
                <Pressable
                  style={styles.pickerBox}
                  onPress={() => setStateModal(true)}>
                  <View>
                    <Text style={styles.pickerLabel}>State</Text>
                    <Text
                      style={[
                        styles.pickerValue,
                        !selectedState && styles.placeholderText,
                      ]}>
                      {selectedState || 'Select State'}
                    </Text>
                  </View>
                  <ArrowIcon width={14} height={14} />
                </Pressable>
                <Pressable
                  style={[
                    styles.pickerBox,
                    !selectedState && styles.disabledPicker,
                  ]}
                  disabled={!selectedState}
                  onPress={() => setCityModal(true)}>
                  <View>
                    <Text style={styles.pickerLabel}>City</Text>
                    <Text
                      style={[
                        styles.pickerValue,
                        !city && styles.placeholderText,
                      ]}>
                      {city || 'Select City'}
                    </Text>
                  </View>
                  <ArrowIcon width={14} height={14} />
                </Pressable>
              </View>
              {errors.state && <Text style={styles.error}>{errors.state}</Text>}
              {errors.city && <Text style={styles.error}>{errors.city}</Text>}
            </View>

            {/* ✅ Map Location Picker */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, pinned && {color: '#16A34A'}]}>
                Location on Map{' '}
                <Text style={{color: '#EF4444', fontSize: 14}}>*</Text>
              </Text>

              {mapEnabled ? (
                pinned ? (
                  /* ── Pinned card ── */
                  <View style={styles.pinnedCard}>
                    <View style={styles.pinnedRow}>
                      <View style={styles.pinIcon}>
                        <MapPin size={20} color="#8A38F5" />
                      </View>
                      <View style={{flex: 1}}>
                        <Text style={styles.pinnedTitle}>
                          📍 Location Pinned
                        </Text>
                        <Text style={styles.pinnedAddr} numberOfLines={2}>
                          {pinnedAddr}
                        </Text>
                        <Text style={styles.pinnedCoords}>
                          {pinned.latitude.toFixed(6)}°N ·{' '}
                          {pinned.longitude.toFixed(6)}°E
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.changeBtn}
                        onPress={() => setShowMap(true)}>
                        <Text style={styles.changeBtnText}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  /* ── Empty state — tap to open map ── */
                  <TouchableOpacity
                    style={styles.mapPlaceholder}
                    onPress={() => setShowMap(true)}
                    activeOpacity={0.8}>
                    <View style={styles.mapIconWrap}>
                      <Navigation2 size={28} color="#8A38F5" />
                    </View>
                    <Text style={styles.mapPlaceholderTitle}>
                      Tap to Pin Location
                    </Text>
                    <Text style={styles.mapPlaceholderSub}>
                      Opens map near {city || selectedState}
                    </Text>
                  </TouchableOpacity>
                )
              ) : (
                /* ── Disabled — city not selected yet ── */
                <View style={styles.mapDisabled}>
                  <MapPin size={24} color="#D1D5DB" />
                  <Text style={styles.mapDisabledText}>
                    Select state and city first
                  </Text>
                </View>
              )}
            </View>

            {/* Area */}
            {isFarmType(propertyType) ? (
              <FarmLandArea
                value={builtUpArea}
                unit={farmUnit}
                onChange={setBuiltUpArea}
                onUnitChange={setFarmUnit}
                error={errors.builtUpArea}
              />
            ) : (
              <OldPropertyArea
                builtUpArea={builtUpArea}
                carpetArea={
                  shouldShowCarpetArea(propertyType) ? carpetArea : ''
                }
                showCarpetArea={shouldShowCarpetArea(propertyType)}
                onBuiltUpChange={setBuiltUpArea}
                onCarpetChange={setCarpetArea}
                builtUpError={errors.builtUpArea}
                carpetError={errors.carpetArea}
              />
            )}

            <OldPriceDetails
              sellingPrice={sellingPrice}
              totalPrice={totalPrice}
              setTotalPrice={setTotalPrice}
              onChangeSelling={setSellingPrice}
              error={errors.sellingPrice}
              error2={errors.totalPrice}
            />

            <OldContactDetails
              ownerName={ownerName}
              phone={phone}
              onOwnerChange={setOwnerName}
              onPhoneChange={setPhone}
              errors={errors}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
              <Text style={styles.primaryText}>
                Continue to Property Details →
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* ══════════════════════════════════════
            STEP 2 — Property Details
        ══════════════════════════════════════ */}
        {step === 2 && (
          <>
            <FeatureCard title="Ownership & Legal">
              <ChipSelector
                label="Ownership Type"
                required
                options={OWNERSHIP_TYPES}
                value={ownershipType}
                onSelect={setOwnershipType}
              />
              <ChipSelector
                label="Property Facing"
                options={PROPERTY_FACING_OPTS}
                value={propertyFacing}
                onSelect={setPropertyFacing}
              />
              {!isNoLoan && (
                <ChipSelector
                  label="Loan Availability"
                  options={LOAN_OPTIONS}
                  value={loanAvailability}
                  onSelect={setLoanAvailability}
                />
              )}
              {!RERA_HIDDEN_TYPES.has(propertyType) && (
                <View style={styles.chipGroup}>
                  <Text style={styles.chipGroupLabel}>
                    RERA Registration No.
                  </Text>
                  <TextInput
                    style={styles.inlineInput}
                    value={reraRegistered}
                    onChangeText={setReraRegistered}
                    placeholder="e.g. P50500077372"
                    placeholderTextColor="#C4B9F0"
                  />
                </View>
              )}
              <View style={styles.halfCol}>
                <Text style={styles.chipGroupLabel}>Built Year</Text>
                <TextInput
                  style={styles.inlineInput}
                  value={builtYear}
                  onChangeText={setBuiltYear}
                  placeholder="e.g. 2020"
                  placeholderTextColor="#C4B9F0"
                  keyboardType="numeric"
                />
              </View>
            </FeatureCard>

            {!isPlot && (
              <FeatureCard title="Interior Details">
                <ChipSelector
                  label="Property Status"
                  options={PROPERTY_STATUS_OPTS}
                  value={propertyStatus}
                  onSelect={setPropertyStatus}
                />
                <ChipSelector
                  label="Furnishing"
                  options={FURNISHING_OPTS}
                  value={furnishing}
                  onSelect={setFurnishing}
                />
                {!isNoFloor && (
                  <View style={styles.twoColRow}>
                    <View style={styles.halfCol}>
                      <Text style={styles.chipGroupLabel}>Total Floors</Text>
                      <TextInput
                        style={styles.inlineInput}
                        value={totalFloors}
                        onChangeText={setTotalFloors}
                        placeholder="e.g. 10"
                        placeholderTextColor="#C4B9F0"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.halfCol}>
                      <Text style={styles.chipGroupLabel}>Floor No.</Text>
                      <TextInput
                        style={styles.inlineInput}
                        value={floorNo}
                        onChangeText={setFloorNo}
                        placeholder="e.g. 3"
                        placeholderTextColor="#C4B9F0"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                )}
              </FeatureCard>
            )}

            {![
              'CommercialPlot',
              'ResaleCommercial',
              'FarmLand',
              'ResalePlot',
              'NewPlot',
            ].includes(propertyType) && (
              <FeatureCard title="Utilities">
                <ChipSelector
                  label="Water Supply"
                  options={WATER_SUPPLY_OPTS}
                  value={waterSupply}
                  onSelect={setWaterSupply}
                />
                <ChipSelector
                  label="Power Backup"
                  options={POWER_BACKUP_OPTS}
                  value={powerBackup}
                  onSelect={setPowerBackup}
                />
              </FeatureCard>
            )}

            <FeatureCard title="Location & Parking">
              <MultiChipSelector
                label="Location Features"
                options={LOCATION_FEATURE_OPTS}
                value={locationFeature}
                onSelect={setLocationFeature}
              />
              {!isPlot && (
                <ChipSelector
                  label="Parking"
                  options={PARKING_FEATURE_OPTS}
                  value={parkingFeature}
                  onSelect={setParkingFeature}
                />
              )}
              {!isPlot && (
                <ChipSelector
                  label="Terrace"
                  options={TERRACE_FEATURE_OPTS}
                  value={terraceFeature}
                  onSelect={setTerraceFeature}
                />
              )}
              <View style={styles.chipGroup}>
                <Text style={styles.chipGroupLabel}>About Property</Text>
                <TextInput
                  style={styles.textArea}
                  value={propertyDescription}
                  onChangeText={setPropertyDescription}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  placeholder="Enter property description"
                  placeholderTextColor="#C4B9F0"
                />
              </View>
            </FeatureCard>

            <NavButtons
              onBack={() => setStep(1)}
              onNext={handleNext}
              nextLabel="Continue"
            />
          </>
        )}

        {/* ══════════════════════════════════════
            STEP 3 — Amenities & Benefits
        ══════════════════════════════════════ */}
        {step === 3 && (
          <>
            <FeatureCard title="Amenities">
              <MultiChipSelector
                label="Select all that apply"
                options={AMENITIES_OPTS}
                value={amenitiesFeature}
                onSelect={setAmenitiesFeature}
              />
            </FeatureCard>

            <FeatureCard title="Smart Home Features">
              <MultiChipSelector
                label="Select all that apply"
                options={SMART_HOME_OPTS}
                value={smartHomeFeature}
                onSelect={setSmartHomeFeature}
              />
            </FeatureCard>

            <FeatureCard title="Property Benefits">
              <ChipSelector
                label="Security"
                options={SECURITY_BENEFIT_OPTS}
                value={securityBenefit}
                onSelect={setSecurityBenefit}
              />
              <ChipSelector
                label="Prime Location"
                options={PRIME_LOCATION_BENEFIT_OPTS}
                value={primeLocationBenefit}
                onSelect={setPrimeLocationBenefit}
              />
              <ChipSelector
                label="Rental Income"
                options={RENTAL_INCOME_BENEFIT_OPTS}
                value={rentalIncomeBenefit}
                onSelect={setRentalIncomeBenefit}
              />
              <ChipSelector
                label="Quality"
                options={QUALITY_BENEFIT_OPTS}
                value={qualityBenefit}
                onSelect={setQualityBenefit}
              />
              <ChipSelector
                label="Capital Appreciation"
                options={CAPITAL_APPRECIATION_BENEFIT_OPTS}
                value={capitalAppreciationBenefit}
                onSelect={setCapitalAppreciationBenefit}
              />
              <ChipSelector
                label="Eco-Friendly"
                options={ECOFRIENDLY_BENEFIT_OPTS}
                value={ecofriendlyBenefit}
                onSelect={setEcofriendlyBenefit}
              />
            </FeatureCard>

            <NavButtons
              onBack={() => setStep(2)}
              onNext={handleNext}
              nextLabel="Continue"
            />
          </>
        )}

        {/* ══════════════════════════════════════
            STEP 4 — Upload Photos
        ══════════════════════════════════════ */}
        {step === 4 && (
          <>
            <OldUploadImg
              imageFiles={imageFiles}
              setImageFiles={setImageFiles}
              propertyType={propertyType}
            />
            <NavButtons
              onBack={() => setStep(3)}
              onNext={handleNext}
              nextLabel={
                mode === 'edit' ? 'Update Property ✓' : 'Submit Property ✓'
              }
              nextColors={['#34D399', '#10B981']}
            />
          </>
        )}

        <Text style={styles.footerText}>
          All fields marked with * are mandatory
        </Text>
      </ScrollView>

      {/* ✅ Map Modal */}
      <MapModal
        visible={showMap}
        onClose={() => setShowMap(false)}
        onConfirm={handleMapConfirm}
        initialCoords={pinned}
        cityName={city}
        stateName={selectedState}
        pincode=""
      />

      {/* State Dropdown */}
      <CustomDropdownModal
        visible={stateModal}
        onClose={() => setStateModal(false)}
        data={states}
        onSelect={item => {
          setSelectedState(item.state);
          setStateModal(false);
        }}
        title="Select State"
      />

      {/* City Dropdown */}
      <CustomDropdownModal
        visible={cityModal}
        onClose={() => setCityModal(false)}
        data={cities}
        onSelect={item => {
          setCity(item.city);
          setCityModal(false);
        }}
        title="Select City"
      />
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────
   Styles
───────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FAF8FF'},
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'SegoeUI-Bold',
    color: 'black',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stepItem: {alignItems: 'center', gap: 3},
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {borderColor: '#8A38F5', backgroundColor: '#8A38F5'},
  stepCircleDone: {borderColor: '#10B981', backgroundColor: '#10B981'},
  stepNumber: {
    fontSize: 12,
    fontFamily: 'SegoeUI-Bold',
    color: '#9CA3AF',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  stepNumberActive: {color: '#fff'},
  stepCheckmark: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  stepLabel: {
    fontSize: 12,
    fontFamily: 'SegoeUI-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  stepLabelActive: {color: '#8A38F5', fontFamily: 'SegoeUI-Bold'},
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 14,
    marginHorizontal: 2,
  },
  stepConnectorDone: {backgroundColor: '#10B981'},
  scrollContent: {paddingBottom: 32, gap: 16},
  section: {backgroundColor: '#fff', padding: 16},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', gap: 6},
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'SegoeUI-Bold',
    marginBottom: 8,
    color: '#383737',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  required: {color: '#E33629'},
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    color: '#000',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  row: {flexDirection: 'row', gap: 12},
  pickerBox: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickerLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
    fontFamily: 'SegoeUI-Regular',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  pickerValue: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  placeholderText: {color: '#9CA3AF', fontFamily: 'SegoeUI-Regular'},
  disabledPicker: {backgroundColor: '#F3F4F6', borderColor: '#E5E7EB'},
  error: {color: '#E33629', fontSize: 12, marginBottom: 6},

  // ── Map UI
  pinnedCard: {
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    padding: 14,
  },
  pinnedRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 12},
  pinIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinnedTitle: {
    fontSize: 13,
    fontFamily: 'SegoeUI-Bold',
    color: '#16A34A',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  pinnedAddr: {
    fontSize: 12,
    color: '#374151',
    marginTop: 2,
    lineHeight: 17,
    fontFamily: 'SegoeUI-Regular',
  },
  pinnedCoords: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 3,
    fontFamily: 'SegoeUI-Regular',
  },
  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#8A38F5',
    borderRadius: 8,
    marginTop: 2,
  },
  changeBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  mapPlaceholder: {
    height: 110,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C4B5FD',
    backgroundColor: '#FAF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  mapIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderTitle: {
    fontSize: 14,
    fontFamily: 'SegoeUI-Bold',
    color: '#6D28D9',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  mapPlaceholderSub: {
    fontSize: 12,
    color: '#A78BFA',
    fontFamily: 'SegoeUI-Regular',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  mapDisabled: {
    height: 80,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    flexDirection: 'row',
  },
  mapDisabledText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'SegoeUI-Regular',
  },

  // ── Buttons
  primaryButton: {
    marginHorizontal: 24,
    height: 52,
    backgroundColor: '#8A38F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  actionRow: {flexDirection: 'row', gap: 12, paddingHorizontal: 16},
  actionBtn: {flex: 1, height: 50, borderRadius: 12},
  gradient: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'SegoeUI-Bold',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },

  // ── Feature Card
  featureCard: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  featureCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  featureCardAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#8A38F5',
  },
  featureCardTitle: {
    fontSize: 15,
    fontFamily: 'SegoeUI-Bold',
    color: '#111827',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },

  // ── Chips
  chipGroup: {marginBottom: 16},
  chipGroupLabel: {
    fontSize: 13,
    fontFamily: 'SegoeUI-Bold',
    color: '#374151',
    marginBottom: 8,
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  chipActive: {borderColor: '#8A38F5', backgroundColor: '#F3E8FF'},
  chipText: {
    fontSize: 12,
    fontFamily: 'SegoeUI-Regular',
    color: '#6B7280',
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
  chipTextActive: {color: '#6D28D9', fontFamily: 'SegoeUI-Bold'},

  // ── Inputs
  inlineInput: {
    height: 44,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  textArea: {
    width: '100%',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#D9D0FF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E1B39',
    backgroundColor: '#F9F7FF',
  },
  twoColRow: {flexDirection: 'row', gap: 12, marginBottom: 8},
  halfCol: {flex: 1},

  // ── Dropdown modal
  customModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  customModalBackdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)'},
  customModalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingTop: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  customModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  customModalTitle: {
    fontSize: 18,
    fontFamily: 'SegoeUI-Bold',
    color: '#111827',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },
  closeButton: {padding: 4},
  customModalScroll: {paddingHorizontal: 20},
  customModalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  customModalItemText: {
    fontSize: 16,
    fontFamily: 'SegoeUI-Regular',
    color: '#374151',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
      default: {},
    }),
  },

  // ── Footer
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 12,
    ...Platform.select({android: {includeFontPadding: false}, default: {}}),
  },
});
