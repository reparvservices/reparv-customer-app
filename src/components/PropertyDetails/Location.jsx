import {StyleSheet, Text, View, Dimensions} from 'react-native';
import {WebView} from 'react-native-webview';
import {MapPin, Building2} from 'lucide-react-native';

const {width} = Dimensions.get('window');
const isTablet = width >= 768;

export const Location = ({latitude, longitude, address, landmark, pincode}) => {
  
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<style>
  html, body, #map {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map').setView([${latitude}, ${longitude}], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);
  L.marker([${latitude}, ${longitude}]).addTo(map);
</script>
</body>
</html>
`;

  return (
    <View style={styles.wrapper}>
      <View style={styles.infoCard}>
        {/* Title inside card */}
        <Text style={styles.sectionTitle}>Location</Text>

        {/* Address Card */}
        <View style={styles.addressCard}>
          <View style={styles.iconCircle}>
            <MapPin size={18} color="#6C2BD9" />
          </View>

          <View style={{flex: 1}}>
            <Text style={styles.primaryAddress}>{address}</Text>

            <View style={styles.subRow}>
              <Building2 size={14} color="#888" />
              <Text style={styles.subText}>
                {landmark} • {pincode}
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Map */}
        <View style={styles.mapContainer}>
          <WebView
            originWhitelist={['*']}
            source={{html}}
            scrollEnabled={false}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 12,
    marginTop: 16,
  },

  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },

  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFE8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },

  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  subText: {
    fontSize: 13,
    color: '#777',
  },

  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },

  mapContainer: {
    height: isTablet ? 340 : 300,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
