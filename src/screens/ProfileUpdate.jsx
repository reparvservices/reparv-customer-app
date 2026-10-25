import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ToastAndroid,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, Camera, ChevronDown} from 'lucide-react-native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {uploadToS3} from '../utils/uploadS3';

const PURPLE = '#7C3AED';
const BG = '#FAF8FF';
const BASE_URL = 'https://aws-api.reparv.in'; // ✅ single source of truth

export default function UpdateProfileScreen({navigation, route}) {
  const {
    fullname: f,
    email: e,
    contact: c,
    userimage,
    userid,
    state: s,
    city: ci,
  } = route.params;

  const [fullname, setFullname] = useState(f || '');
  const [email, setEmail] = useState(e || '');
  const [contact, setContact] = useState(c || '');
  const [saving, setSaving] = useState(false);

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState(s ? {state: s} : null);
  const [selectedCity, setSelectedCity] = useState(ci ? {city: ci} : null);
  const [stateModal, setStateModal] = useState(false);
  const [cityModal, setCityModal] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  const [profileImage, setProfileImage] = useState(
    userimage ? {uri: userimage} : null,
  );

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    if (selectedState) fetchCities(selectedState.state);
  }, [selectedState]);

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/states`);
      const data = await res.json();
      setStates(data || []);
    } catch (err) {
      console.log('Error fetching states:', err);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchCities = async stateName => {
    setLoadingCities(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/cities/${stateName}`);
      const data = await res.json();
      setCities(data || []);
    } catch (err) {
      console.log('Error fetching cities:', err);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleImageResult = result => {
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Image Error', result.errorMessage || 'Something went wrong');
      return;
    }
    if (result.assets?.length) {
      setProfileImage(result.assets[0]);
    }
  };

  const pickFromGallery = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
      selectionLimit: 1,
    });
    handleImageResult(result);
  };

  const takePhoto = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.7,
      cameraType: 'front',
      saveToPhotos: true,
    });
    handleImageResult(result);
  };

  const pickImage = () => {
    Alert.alert(
      'Profile Photo',
      'Choose an option',
      [
        {text: 'Camera', onPress: takePhoto},
        {text: 'Gallery', onPress: pickFromGallery},
        {text: 'Cancel', style: 'cancel'},
      ],
      {cancelable: true},
    );
  };

  /* ---------- UPDATE PROFILE ---------- */
  const updateProfile = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[6-9]\d{9}$/;

    if (!fullname.trim()) return Alert.alert('Please enter full name');
    if (!email && !contact)
      return Alert.alert('Email or mobile number is required');
    if (email && !emailRegex.test(email)) return Alert.alert('Invalid email');
    if (contact && !mobileRegex.test(contact))
      return Alert.alert('Invalid mobile number');

    setSaving(true);

    try {
      // ✅ Upload image to S3 first if a new image was picked
      let imageUrl = userimage || null; // keep existing by default

      const isNewImage =
        profileImage?.uri &&
        (profileImage.uri.startsWith('file://') ||
          profileImage.uri.startsWith('content://'));

      if (isNewImage) {
        ToastAndroid.show('Uploading image...', ToastAndroid.SHORT);
        const uploadedUrl = await uploadToS3(profileImage, 'uploads');
        if (!uploadedUrl) {
          ToastAndroid.show(
            'Image upload failed. Try again.',
            ToastAndroid.LONG,
          );
          setSaving(false);
          return;
        }
        imageUrl = uploadedUrl;
      }

      // ✅ Send JSON — no FormData, no multer needed
      const response = await fetch(`${BASE_URL}/customerapp/user/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userid,
          fullname,
          email: email || null,
          contact: contact || null,
          state: selectedState?.state || null,
          city: selectedCity?.city || null,
          userimage: imageUrl,
        }),
      });

      // ✅ Safe JSON parse
      const rawText = await response.text();
      let data = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        console.log('Non-JSON response:', rawText);
        ToastAndroid.show('Server error. Try again.', ToastAndroid.LONG);
        return;
      }

      if (response.ok) {
        ToastAndroid.show('Profile updated successfully!', ToastAndroid.LONG);
        navigation.goBack();
      } else {
        ToastAndroid.show(
          data.message || 'Something went wrong',
          ToastAndroid.LONG,
        );
      }
    } catch (err) {
      console.log('Update profile error:', err);
      ToastAndroid.show('Network error. Try again.', ToastAndroid.LONG);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Dropdown Modal ---------- */
  const DropdownModal = ({
    visible,
    onClose,
    data,
    onSelect,
    loading,
    title,
    labelKey,
    searchValue,
    onSearchChange,
  }) => {
    const filtered = data.filter(item =>
      item[labelKey]?.toLowerCase().includes(searchValue.toLowerCase()),
    );

    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalSearch}
              value={searchValue}
              onChangeText={onSearchChange}
              placeholder={`Search ${title.toLowerCase()}...`}
              placeholderTextColor="#9CA3AF"
            />
            {loading ? (
              <View style={styles.modalLoader}>
                <ActivityIndicator size="large" color={PURPLE} />
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item, i) => String(item.id ?? i)}
                keyboardShouldPersistTaps="handled"
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}>
                    <Text style={styles.modalItemText}>{item[labelKey]}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.modalEmpty}>No options found</Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Information</Text>
        <View style={{width: 22}} />
      </View>

      <ScrollView contentContainerStyle={{paddingBottom: 140}}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{
              uri:
                profileImage?.uri ||
                userimage ||
                'https://randomuser.me/api/portraits/men/1.jpg',
            }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
            <Camera size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Label text="Name" />
          <Input value={fullname} onChangeText={setFullname} />

          <Label text="Email" />
          <Input value={email} onChangeText={setEmail} />

          <Label text="Phone Number" />
          <Input value={contact} onChangeText={setContact} keyboard="numeric" />

          <Label text="State" />
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => {
              setStateSearch('');
              setStateModal(true);
            }}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.dropdownText,
                !selectedState && styles.dropdownPlaceholder,
              ]}>
              {selectedState ? selectedState.state : 'Select State'}
            </Text>
            <ChevronDown size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <Label text="City" />
          <TouchableOpacity
            style={[styles.dropdown, !selectedState && styles.dropdownDisabled]}
            onPress={() => {
              if (!selectedState) {
                Alert.alert(
                  'Select State First',
                  'Please select a state before choosing a city.',
                );
                return;
              }
              setCitySearch('');
              setCityModal(true);
            }}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.dropdownText,
                !selectedCity && styles.dropdownPlaceholder,
              ]}>
              {selectedCity
                ? selectedCity.city
                : selectedState
                ? 'Select City'
                : 'Select state first'}
            </Text>
            <ChevronDown size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && {opacity: 0.8}]}
          onPress={updateProfile}
          disabled={saving}>
          {saving ? (
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.saveText}>Saving...</Text>
            </View>
          ) : (
            <Text style={styles.saveText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      <DropdownModal
        visible={stateModal}
        onClose={() => setStateModal(false)}
        data={states}
        onSelect={item => {
          setSelectedState(item);
          setSelectedCity(null);
          setCities([]);
        }}
        loading={loadingStates}
        title="State"
        labelKey="state"
        searchValue={stateSearch}
        onSearchChange={setStateSearch}
      />

      <DropdownModal
        visible={cityModal}
        onClose={() => setCityModal(false)}
        data={cities}
        onSelect={setSelectedCity}
        loading={loadingCities}
        title="City"
        labelKey="city"
        searchValue={citySearch}
        onSearchChange={setCitySearch}
      />
    </SafeAreaView>
  );
}

const Label = ({text}) => <Text style={styles.label}>{text}</Text>;
const Input = ({value, onChangeText, keyboard}) => (
  <TextInput
    value={value}
    onChangeText={onChangeText}
    keyboardType={keyboard}
    style={styles.input}
  />
);

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: BG},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  headerTitle: {fontSize: 18, fontWeight: '600', color: '#000'},
  avatarWrapper: {alignItems: 'center', marginTop: 20},
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EDE9FE',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: PURPLE,
    padding: 10,
    borderRadius: 20,
  },
  card: {backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16},
  label: {fontSize: 13, marginTop: 12, marginBottom: 6, color: '#000'},
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#000',
  },
  dropdown: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownDisabled: {opacity: 0.5},
  dropdownText: {fontSize: 14, color: '#111827'},
  dropdownPlaceholder: {color: '#9CA3AF'},
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: BG,
  },
  saveBtn: {
    backgroundColor: PURPLE,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {fontSize: 17, fontWeight: '700', color: '#111827'},
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {fontSize: 13, color: '#374151', fontWeight: '600'},
  modalSearch: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 14,
    color: '#111827',
  },
  modalLoader: {padding: 40, alignItems: 'center'},
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  modalItemText: {fontSize: 15, color: '#111827'},
  modalEmpty: {
    textAlign: 'center',
    padding: 30,
    color: '#9CA3AF',
    fontSize: 14,
  },
});
