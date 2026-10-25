import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Pressable,
  Platform,
  Image,
  Modal,
  Alert,
  Linking,
  BackHandler,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {launchImageLibrary} from 'react-native-image-picker';
import {
  ArrowLeft,
  Building,
  Building2,
  Check,
  CheckCheck,
  ChevronDown,
  Factory,
  House,
  Images,
  IndianRupee,
  Instagram,
  LandPlot,
  Lightbulb,
  Lock,
  MapPin,
  FileText,
  Ruler,
  Store,
  Tractor,
  Trees,
  Undo2,
  User,
  Video,
  Warehouse,
  X,
  Youtube,
} from 'lucide-react-native';
import {API_BASE_URL} from '../config/api';
import {uploadToS3} from '../utils/uploadS3';
import ListingLocationPicker from '../components/old-property/ListingLocationPicker';
import {validateVideoLinks, youtubeIdOf} from '../utils/videoLinks';
import {
  LISTING_TYPES,
  PROPERTY_KINDS,
  SALE_CONDITIONS,
  categoriesFor,
  areaModeFor,
  requiredAreaField,
  basicDetailFieldsFor,
  BASIC_DETAIL_KEYS,
  BHK_OPTIONS,
  LAND_UNITS,
  needsConfiguration,
  parseLandArea,
} from '../utils/propertyListing';

// "List Property" — same 4-step flow as the website
// (reparv-website src/components/dashboard/SellProperty.jsx).

const PURPLE = '#8A38F5';
const GRAY = '#868686';
const BORDER = '#E0E0E0';
const RED = '#EF4444';

const CATEGORY_ICONS = {
  Building,
  Building2,
  Factory,
  House,
  LandPlot,
  Store,
  Tractor,
  Trees,
  Warehouse,
};

const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
const PHOTO_MAX_EDGE = 1600;
const PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-m4v',
];
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

const PROPERTY_NAME_REGEX = /^[A-Za-z0-9\s\-&.,'()/]+$/;
const OWNER_NAME_REGEX = /^[A-Za-z\s.]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PINCODE_REGEX = /^[1-9]\d{5}$/;
const MAX_DESCRIPTION = 3000;

const STEPS = [
  {key: 'type', label: 'Type', title: 'What are you listing?'},
  {key: 'location', label: 'Location', title: 'Where is it?'},
  {key: 'details', label: 'Price & Details', title: 'Price & details'},
  {key: 'media', label: 'Photos & Videos', title: 'Photos & videos'},
];
const STEP_FIELDS = {
  1: ['propertyCategory', 'propertyName'],
  2: ['address', 'location', 'pincode', 'state', 'city'],
  3: [
    'area',
    'propertyType',
    'totalSalesPrice',
    'totalOfferPrice',
    'propertyDescription',
    'projectBy',
    'contact',
    'email',
  ],
};
const FIELD_ORDER = [1, 2, 3].flatMap(n => STEP_FIELDS[n]);
const stepOfField = field =>
  Number(Object.keys(STEP_FIELDS).find(n => STEP_FIELDS[n].includes(field))) ||
  1;

const DRAFT_KEY = 'reparv.listingDraft.v1';

/** 4500000 → "45,00,000" */
const formatINR = digits => {
  const s = String(digits || '');
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
};

/** ₹45,00,000 → "₹45 Lakh" so an extra/missing zero is easy to spot */
const priceInWords = value => {
  const n = Number(value);
  if (!n || n < 0) return '';
  if (n >= 1e7) return `₹${+(n / 1e7).toFixed(2)} Crore`;
  if (n >= 1e5) return `₹${+(n / 1e5).toFixed(2)} Lakh`;
  return `₹${formatINR(n)}`;
};

const EMPTY_PROPERTY = listingType => ({
  propertyCategory: '',
  listingType,
  propertyKind: 'Residential',
  propertyName: '',
  builtUpArea: '',
  carpetArea: '',
  totalSalesPrice: '',
  totalOfferPrice: '',
  state: '',
  city: '',
  address: '',
  location: '',
  pincode: '',
  latitude: '',
  longitude: '',
  propertyType: '',
  propertyDescription: '',
  projectBy: '',
  contact: '',
  email: '',
  videoLink: '',
  instagramReelLink: '',
});

/* ───────────────────────── Small form pieces ───────────────────────── */

const Label = ({children, required, optional}) => (
  <Text style={styles.label}>
    {children}
    {required ? <Text style={styles.required}> *</Text> : null}
    {optional ? <Text style={styles.optional}> (optional)</Text> : null}
  </Text>
);

const ErrorText = ({children}) =>
  children ? <Text style={styles.errorText}>{children}</Text> : null;

const Hint = ({children}) =>
  children ? <Text style={styles.hint}>{children}</Text> : null;

const SectionTitle = ({Icon, children, required, optional}) => (
  <View style={styles.sectionTitleRow}>
    {Icon ? <Icon size={20} color={PURPLE} /> : null}
    <Text style={styles.sectionTitle}>
      {children}
      {required ? <Text style={styles.required}> *</Text> : null}
      {optional ? (
        <Text style={styles.sectionOptional}> (optional)</Text>
      ) : null}
    </Text>
  </View>
);

const Input = ({error, style, ...props}) => (
  <TextInput
    placeholderTextColor="#9CA3AF"
    {...props}
    style={[styles.input, error && styles.inputError, style]}
  />
);

/** Tap-to-open option list, standing in for the website's <select> */
const SelectField = ({
  value,
  placeholder = 'Select',
  options,
  onSelect,
  error,
  disabled,
  title,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.input,
          styles.selectBox,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}>
        <Text
          numberOfLines={1}
          style={[styles.selectText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <ChevronDown size={16} color="#111" />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable
            style={styles.modalSheet}
            onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title || placeholder}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <X size={22} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {options.length === 0 ? (
                <Text style={styles.modalEmpty}>Nothing to choose yet</Text>
              ) : (
                options.map(option => {
                  const active = option === value;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={styles.modalItem}
                      onPress={() => {
                        onSelect(option);
                        setOpen(false);
                      }}>
                      <Text
                        style={[
                          styles.modalItemText,
                          active && styles.modalItemTextActive,
                        ]}>
                        {option}
                      </Text>
                      {active ? <Check size={16} color={PURPLE} /> : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

/* ───────────────────────────── Screen ───────────────────────────── */

export default function OldPropertyScreen({route}) {
  const navigation = useNavigation();
  const {user} = useSelector(state => state.auth);
  const scrollRef = useRef(null);

  const initialListingType =
    route?.params?.type === 'rent' || route?.params?.listingType === 'rent'
      ? 'Rent'
      : 'Sell';

  const [step, setStep] = useState(1);
  const [condition, setCondition] = useState('new');
  const [newProperty, setNewProperty] = useState(() =>
    EMPTY_PROPERTY(initialListingType),
  );
  const [errors, setErrors] = useState({});
  const [photos, setPhotos] = useState([]); // [{ uri, type, fileName, fileSize }]
  const [photoError, setPhotoError] = useState('');
  const [video, setVideo] = useState(null);
  const [mediaErrors, setMediaErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [nameStatus, setNameStatus] = useState('idle'); // idle | checking | available | taken
  const [savedDraft, setSavedDraft] = useState(null);
  const [draftReady, setDraftReady] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const classification = {
    listingType: newProperty.listingType,
    propertyKind: newProperty.propertyKind || 'Residential',
    condition,
    propertyCategory: newProperty.propertyCategory,
  };
  const isRent = newProperty.listingType === 'Rent';
  const showConfiguration = needsConfiguration(newProperty);
  const areaMode = areaModeFor(newProperty);
  const categories = categoriesFor(classification);

  const priceLabels = isRent
    ? {
        total: 'Monthly Rent',
        offer: 'Offer Rent',
        offerHint:
          'Rent you are willing to settle at (not more than the monthly rent)',
      }
    : {
        total: 'Total Price',
        offer: 'Offer Price',
        offerHint:
          'Price you are willing to settle at (not more than the total price)',
      };

  const set = patch => setNewProperty(prev => ({...prev, ...patch}));
  const clearError = (...keys) =>
    setErrors(prev => {
      const next = {...prev};
      keys.forEach(k => delete next[k]);
      return next;
    });

  /* ---------------- DATA ---------------- */
  useEffect(() => {
    fetch(`${API_BASE_URL}/admin/states`)
      .then(res => (res.ok ? res.json() : []))
      .then(data => setStates(Array.isArray(data) ? data : []))
      .catch(err => console.log('Error fetching states:', err));
  }, []);

  useEffect(() => {
    if (!newProperty.state) {
      setCities([]);
      return;
    }
    fetch(
      `${API_BASE_URL}/admin/cities/${encodeURIComponent(newProperty.state)}`,
    )
      .then(res => (res.ok ? res.json() : []))
      .then(data => setCities(Array.isArray(data) ? data : []))
      .catch(err => console.log('Error fetching cities:', err));
  }, [newProperty.state]);

  // Pre-fill the owner's contact details from the logged-in account
  useEffect(() => {
    if (!user) return;
    setNewProperty(prev => ({
      ...prev,
      projectBy:
        prev.projectBy ||
        String(user.fullname || '')
          .replace(/[^A-Za-z\s.]/g, '')
          .trim(),
      contact:
        prev.contact ||
        String(user.contact || '')
          .replace(/\D/g, '')
          .slice(-10),
      email: prev.email || user.email || '',
    }));
  }, [user]);

  // Check the property name is free while the user types (unique name = unique page URL)
  useEffect(() => {
    const name = newProperty.propertyName.trim();
    if (!name || name.length < 3 || !PROPERTY_NAME_REGEX.test(name)) {
      setNameStatus('idle');
      return;
    }
    setNameStatus('checking');
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/customerapp/property/check-name?name=${encodeURIComponent(
            name,
          )}`,
          {signal: controller.signal},
        );
        if (!res.ok) return setNameStatus('idle');
        const data = await res.json();
        setNameStatus(data?.available ? 'available' : 'taken');
      } catch (err) {
        if (err.name !== 'AbortError') setNameStatus('idle');
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [newProperty.propertyName]);

  /* ---------------- VALIDATION ---------------- */
  const validateDetails = () => {
    const e = {};
    const p = newProperty;
    const name = p.propertyName.trim();

    if (!p.propertyCategory) e.propertyCategory = 'Select a category';

    if (!name) e.propertyName = 'Property name is required';
    else if (name.length < 3) e.propertyName = 'Use at least 3 characters';
    else if (!PROPERTY_NAME_REGEX.test(name)) {
      e.propertyName = "Use letters, numbers, spaces and - & . , ' ( ) / only";
    } else if (nameStatus === 'taken') {
      e.propertyName =
        'This name is already used. Try adding the area or building number';
    }

    if (!p.address.trim()) e.address = 'Address is required';
    if (!p.location.trim()) e.location = 'Locality is required';
    if (p.pincode && !PINCODE_REGEX.test(p.pincode)) {
      e.pincode = 'Enter a valid 6-digit pincode';
    }
    if (!p.state) e.state = 'Select a state';
    if (!p.city) e.city = 'Select a city';

    if (!String(p[requiredAreaField(p)] || '').trim()) {
      e.area = 'Area is required';
    }
    if (showConfiguration && !p.propertyType) {
      e.propertyType = 'Select the configuration';
    }

    const total = Number(p.totalSalesPrice);
    const offer = Number(p.totalOfferPrice);
    if (!total || total <= 0) {
      e.totalSalesPrice = `${priceLabels.total} is required`;
    }
    if (!offer || offer <= 0) {
      e.totalOfferPrice = `${priceLabels.offer} is required`;
    } else if (total > 0 && offer > total) {
      e.totalOfferPrice = `${
        priceLabels.offer
      } can't be more than the ${priceLabels.total.toLowerCase()}`;
    }

    if (!p.projectBy.trim()) e.projectBy = 'Owner name is required';
    else if (!OWNER_NAME_REGEX.test(p.projectBy.trim())) {
      e.projectBy = 'Use letters only';
    }
    if (!PHONE_REGEX.test(p.contact)) {
      e.contact = 'Enter a valid 10-digit mobile number';
    }
    if (p.email && !EMAIL_REGEX.test(p.email)) {
      e.email = 'Enter a valid email address';
    }
    if (p.propertyDescription.length > MAX_DESCRIPTION) {
      e.propertyDescription = `Keep the description under ${MAX_DESCRIPTION} characters`;
    }
    return e;
  };

  /* ---------------- STEPS ---------------- */
  const stepErrors = (n, errs) =>
    Object.fromEntries(
      Object.entries(errs).filter(([k]) => (STEP_FIELDS[n] || []).includes(k)),
    );

  const goToStep = n => {
    setStep(n);
    scrollRef.current?.scrollTo({y: 0, animated: true});
  };

  const goNext = () => {
    const errs = stepErrors(step, validateDetails());
    setErrors(errs);
    // Bring the highlighted fields into view, like the website does
    if (Object.keys(errs).length) {
      scrollRef.current?.scrollTo({y: 0, animated: true});
      return;
    }
    goToStep(step + 1);
  };

  const goBack = () => goToStep(Math.max(1, step - 1));

  // A step can be revisited once every earlier step is valid
  const canOpenStep = n => {
    if (n <= step) return true;
    const all = validateDetails();
    for (let s = 1; s < n; s++) {
      if (Object.keys(stepErrors(s, all)).length) return false;
    }
    return true;
  };

  const handleHeaderBack = () => {
    if (submitting) return;
    if (step > 1) goBack();
    else navigation.goBack();
  };

  // Android back walks the steps like the header arrow
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (submitting) return true;
      if (step > 1) {
        goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, submitting]);

  /* ---------------- DRAFT ---------------- */
  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY)
      .then(raw => {
        const draft = raw ? JSON.parse(raw) : null;
        if (
          draft?.property &&
          (draft.property.propertyName || draft.property.propertyCategory)
        ) {
          setSavedDraft(draft);
        }
      })
      .catch(() => {})
      .finally(() => setDraftReady(true));
  }, []);

  useEffect(() => {
    // Don't overwrite a saved draft before the user chose to restore or discard it
    if (!draftReady || savedDraft) return;
    if (!newProperty.propertyName && !newProperty.propertyCategory) return;
    const timer = setTimeout(() => {
      AsyncStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          property: newProperty,
          condition,
          step: Math.min(step, 3),
          savedAt: Date.now(),
        }),
      ).catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [draftReady, savedDraft, newProperty, condition, step]);

  const restoreDraft = () => {
    setNewProperty(prev => ({...prev, ...savedDraft.property}));
    if (savedDraft.condition) setCondition(savedDraft.condition);
    setStep(savedDraft.step || 1);
    setSavedDraft(null);
  };

  const discardDraft = () => {
    AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
    setSavedDraft(null);
  };

  /* ---------------- CLASSIFICATION ---------------- */
  const updateClassification = patch => {
    const nextClass = {...classification, ...patch};
    if (!('propertyCategory' in patch)) {
      const stillValid = categoriesFor(nextClass).some(
        c => c.value === nextClass.propertyCategory,
      );
      if (!stillValid) nextClass.propertyCategory = '';
    }
    setCondition(nextClass.condition);
    const next = {
      ...newProperty,
      listingType: nextClass.listingType,
      propertyKind: nextClass.propertyKind,
      propertyCategory: nextClass.propertyCategory,
    };
    // Area inputs differ by type (sq.ft vs "2.5 Acre") — reset when that changes
    if (areaModeFor(next) !== areaModeFor(newProperty)) {
      next.builtUpArea = '';
      next.carpetArea = '';
    }
    if (!needsConfiguration(next)) next.propertyType = '';
    setNewProperty(next);
    if (nextClass.propertyCategory) clearError('propertyCategory');
  };

  /* ---------------- PHOTOS & VIDEO ---------------- */
  const pickPhotos = () => {
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) return;
    setPhotoError('');
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: room,
        maxWidth: PHOTO_MAX_EDGE,
        maxHeight: PHOTO_MAX_EDGE,
        quality: 0.82,
      },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          setPhotoError(response.errorMessage || 'Could not open your photos');
          return;
        }
        const valid = [];
        (response.assets || []).forEach(asset => {
          if (asset.type && !PHOTO_TYPES.includes(asset.type)) {
            setPhotoError('Only JPG, PNG or WEBP photos are allowed');
          } else if (asset.fileSize > MAX_PHOTO_BYTES) {
            setPhotoError('Each photo must be smaller than 15 MB');
          } else {
            valid.push(asset);
          }
        });
        if (valid.length > room) {
          setPhotoError(`You can add up to ${MAX_PHOTOS} photos`);
        }
        const added = valid.slice(0, room);
        if (added.length) setPhotos(prev => [...prev, ...added]);
      },
    );
  };

  const removePhoto = index => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoError('');
  };

  const makeCover = index =>
    setPhotos(prev => [prev[index], ...prev.filter((_, i) => i !== index)]);

  const pickVideo = () => {
    launchImageLibrary({mediaType: 'video', selectionLimit: 1}, response => {
      if (response.didCancel) return;
      const asset = response.assets?.[0];
      if (!asset) return;
      let error = '';
      if (asset.type && !VIDEO_TYPES.includes(asset.type)) {
        error = 'Upload an MP4, MOV or WEBM video';
      } else if (asset.fileSize > MAX_VIDEO_BYTES) {
        error = 'Video must be 200 MB or smaller';
      }
      setMediaErrors(prev => ({...prev, video: error}));
      if (!error) setVideo(asset);
    });
  };

  /* ---------------- SUBMIT ---------------- */
  const submit = async () => {
    if (submitting) return;
    if (!user?.id) {
      navigation.navigate('Login');
      return;
    }

    const errs = validateDetails();
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = FIELD_ORDER.find(k => errs[k]);
      goToStep(stepOfField(first));
      return;
    }
    if (photos.length === 0) {
      setPhotoError('Add at least 1 photo of the property');
      return;
    }
    const mediaErrs = validateVideoLinks(newProperty);
    setMediaErrors(mediaErrs);
    if (Object.keys(mediaErrs).length) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const propertyName = newProperty.propertyName.trim();

      // Re-check the name before spending time on uploads
      setSubmitStatus('Checking details...');
      const nameRes = await fetch(
        `${API_BASE_URL}/customerapp/property/check-name?name=${encodeURIComponent(
          propertyName,
        )}`,
      );
      if (nameRes.ok && !(await nameRes.json())?.available) {
        setNameStatus('taken');
        setErrors({
          propertyName:
            'This name is already used. Try adding the area or building number',
        });
        goToStep(1);
        return;
      }

      // Only send the basic-info fields shown for this property type
      const payload = {
        ...newProperty,
        propertyName,
        address: newProperty.address.trim(),
        location: newProperty.location.trim(),
        propertyDescription: newProperty.propertyDescription.trim(),
        projectBy: newProperty.projectBy.trim(),
        email: newProperty.email.trim(),
        // Stored as a JSON array, e.g. ["2 BHK"], like the rest of the site expects
        propertyType:
          showConfiguration && newProperty.propertyType
            ? [newProperty.propertyType]
            : undefined,
        customerid: user.id,
      };
      const shownDetails = new Set(
        basicDetailFieldsFor(newProperty).map(f => f.key),
      );
      BASIC_DETAIL_KEYS.forEach(k => {
        if (!shownDetails.has(k)) delete payload[k];
      });

      // Upload photos (first photo is the cover)
      const urls = [];
      for (let i = 0; i < photos.length; i++) {
        setSubmitStatus(`Uploading photo ${i + 1} of ${photos.length}...`);
        const url = await uploadToS3(photos[i], 'uploads');
        if (!url) {
          throw new Error(
            'A photo failed to upload. Please check your connection and try again.',
          );
        }
        urls.push(url);
      }
      [
        'frontView',
        'sideView',
        'kitchenView',
        'hallView',
        'bedroomView',
        'bathroomView',
        'balconyView',
        'nearestLandmark',
        'developedAmenities',
      ].forEach(field => {
        payload[field] = [];
      });
      payload.frontView = urls;

      if (video) {
        setSubmitStatus('Uploading video...');
        const videoUrl = await uploadToS3(video, 'uploads/videos');
        if (!videoUrl) {
          throw new Error(
            'The video failed to upload. Remove it or try again on a faster connection.',
          );
        }
        payload.propertyVideo = videoUrl;
      }
      payload.videoLink = newProperty.videoLink.trim();
      payload.instagramReelLink = newProperty.instagramReelLink.trim();

      setSubmitStatus('Saving your listing...');
      const response = await fetch(
        `${API_BASE_URL}/customerapp/property/post`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json().catch(() => ({}));

      if (response.status === 409) {
        setNameStatus('taken');
        setErrors({
          propertyName: data.message || 'Property name already exists',
        });
        goToStep(1);
        return;
      }
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save. Please try again.');
      }

      discardDraft();
      Alert.alert(
        'Listing submitted',
        `Your property is under review. It will be visible to ${
          isRent ? 'tenants' : 'buyers'
        } once our team verifies it.`,
      );
      navigation.replace('mylisting');
    } catch (err) {
      console.log('Error saving property:', err);
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
      setSubmitStatus('');
    }
  };

  const progress = Math.round(((step - 1) / STEPS.length) * 100);
  const currentStepErrors = useMemo(
    () => (step < 4 ? stepErrors(step, errors) : {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, errors],
  );
  const land = parseLandArea(newProperty.builtUpArea);
  const ytId = youtubeIdOf(newProperty.videoLink);

  /* ---------------- RENDER ---------------- */
  const renderStepper = () => (
    <View style={styles.stepper}>
      <View style={styles.stepperTop}>
        <Text style={styles.stepCount}>
          Step {step} of {STEPS.length}
        </Text>
        <Text style={styles.stepDone}>{progress}% done</Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, {width: `${Math.max(progress, 4)}%`}]}
        />
      </View>
      <View style={styles.stepList}>
        {STEPS.map(({key, label}, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          const clickable = !submitting && n !== step && canOpenStep(n);
          return (
            <TouchableOpacity
              key={key}
              style={styles.stepItem}
              disabled={!clickable}
              onPress={() => goToStep(n)}>
              <View
                style={[
                  styles.stepDot,
                  (done || active) && styles.stepDotActive,
                  active && styles.stepDotRing,
                ]}>
                {done ? (
                  <Check size={12} color="#fff" strokeWidth={3} />
                ) : (
                  <Text
                    style={[
                      styles.stepDotText,
                      active && styles.stepDotTextActive,
                    ]}>
                    {n}
                  </Text>
                )}
              </View>
              <Text
                style={[styles.stepLabel, active && styles.stepLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderTypeStep = () => (
    <>
      {/* SELL / RENT */}
      <Text style={styles.groupTitle}>
        What do you want to do?<Text style={styles.required}> *</Text>
      </Text>
      <View style={styles.listingTypeRow}>
        {LISTING_TYPES.map(({key, label, hint}) => {
          const active = newProperty.listingType === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.listingTypeCard, active && styles.tabActive]}
              onPress={() => updateClassification({listingType: key})}>
              <Text
                style={[styles.listingTypeLabel, active && styles.textWhite]}>
                {label}
              </Text>
              <Text
                style={[
                  styles.listingTypeHint,
                  active && styles.listingTypeHintActive,
                ]}>
                {hint}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* NEW LAUNCH / RESALE (Sell only) */}
      {!isRent && (
        <>
          <Text style={styles.subGroupTitle}>Property is</Text>
          <View style={styles.tabWrap}>
            {SALE_CONDITIONS.map(({key, label}) => (
              <TouchableOpacity
                key={key}
                style={[styles.tab, condition === key && styles.tabActive]}
                onPress={() => updateClassification({condition: key})}>
                <Text
                  style={[
                    styles.tabText,
                    condition === key && styles.textWhite,
                  ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* RESIDENTIAL / COMMERCIAL / AGRICULTURE */}
      <Text style={styles.subGroupTitle}>
        Property Type<Text style={styles.required}> *</Text>
      </Text>
      <View style={styles.tabWrap}>
        {PROPERTY_KINDS.map(({key, label}) => {
          const active = newProperty.propertyKind === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => updateClassification({propertyKind: key})}>
              <Text style={[styles.tabText, active && styles.textWhite]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* CATEGORY */}
      <Text style={styles.subGroupTitle}>
        Category<Text style={styles.required}> *</Text>
      </Text>
      <View style={styles.categoryGrid}>
        {categories.map(({label, value, icon}) => {
          const active = newProperty.propertyCategory === value;
          const Icon = CATEGORY_ICONS[icon] || Building2;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.categoryBtn, active && styles.tabActive]}
              onPress={() => updateClassification({propertyCategory: value})}>
              <Icon size={16} color={active ? '#FFFFFF' : GRAY} />
              <Text
                style={[styles.categoryText, active && styles.categoryActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <ErrorText>{errors.propertyCategory}</ErrorText>

      {/* PROPERTY NAME */}
      <View style={styles.block}>
        <SectionTitle Icon={Building2} required>
          Property Name
        </SectionTitle>
        <Input
          maxLength={100}
          value={newProperty.propertyName}
          onChangeText={t => {
            set({propertyName: t});
            clearError('propertyName');
          }}
          placeholder="e.g. Sai Datta Heights, Wing B"
          error={errors.propertyName || nameStatus === 'taken'}
        />
        {errors.propertyName ? (
          <ErrorText>{errors.propertyName}</ErrorText>
        ) : nameStatus === 'taken' ? (
          <ErrorText>
            This name is already used. Try adding the area or building number
          </ErrorText>
        ) : nameStatus === 'available' ? (
          <Text style={styles.successText}>✓ Name is available</Text>
        ) : nameStatus === 'checking' ? (
          <Hint>Checking availability...</Hint>
        ) : (
          <Hint>Must be unique. It is used in your listing's web address.</Hint>
        )}
      </View>
    </>
  );

  const renderLocationStep = () => (
    <View>
      <SectionTitle Icon={MapPin}>Address Details</SectionTitle>

      <Label required>Address</Label>
      <Input
        placeholder="House no, Street, Area"
        value={newProperty.address}
        onChangeText={t => {
          set({address: t});
          clearError('address');
        }}
        error={errors.address}
      />
      <ErrorText>{errors.address}</ErrorText>

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Label required>State</Label>
          <SelectField
            value={newProperty.state}
            placeholder="Select State"
            title="Select State"
            options={states.map(s => s.state)}
            onSelect={v => {
              set({state: v, city: ''});
              clearError('state', 'city');
            }}
            error={errors.state}
          />
          <ErrorText>{errors.state}</ErrorText>
        </View>
        <View style={styles.flex1}>
          <Label required>City</Label>
          <SelectField
            value={newProperty.city}
            placeholder={
              newProperty.state ? 'Select City' : 'Select state first'
            }
            title="Select City"
            disabled={!newProperty.state}
            options={cities.map(c => c.city)}
            onSelect={v => {
              set({city: v});
              clearError('city');
            }}
            error={errors.city}
          />
          <ErrorText>{errors.city}</ErrorText>
        </View>
      </View>

      <Label required>Locality / Area</Label>
      <Input
        maxLength={100}
        placeholder="e.g. Manish Nagar"
        value={newProperty.location}
        onChangeText={t => {
          set({location: t});
          clearError('location');
        }}
        error={errors.location}
      />
      {errors.location ? (
        <ErrorText>{errors.location}</ErrorText>
      ) : (
        <Hint>Shown on your listing card and used in search</Hint>
      )}

      <Label optional>Pincode</Label>
      <Input
        keyboardType="number-pad"
        maxLength={6}
        placeholder="e.g. 440015"
        value={newProperty.pincode}
        onChangeText={t => {
          set({pincode: t.replace(/\D/g, '')});
          clearError('pincode');
        }}
        error={errors.pincode}
      />
      <ErrorText>{errors.pincode}</ErrorText>

      <Text style={[styles.label, styles.mt16]}>
        Pin on Map<Text style={styles.optional}> (recommended)</Text>
      </Text>
      <ListingLocationPicker
        latitude={newProperty.latitude}
        longitude={newProperty.longitude}
        onChange={(latitude, longitude) => set({latitude, longitude})}
      />
      <Hint>
        Listings with a map pin appear on Map View and in "near me" searches.
      </Hint>
    </View>
  );

  const renderDetailsStep = () => (
    <>
      {/* AREA */}
      <View>
        <SectionTitle Icon={Ruler} required>
          {areaMode === 'land'
            ? 'Land Area'
            : areaMode === 'plot'
            ? 'Plot Area'
            : 'Property Area'}
        </SectionTitle>

        {areaMode === 'built' && (
          <>
            <View style={styles.row}>
              <Input
                style={styles.flex1}
                keyboardType="decimal-pad"
                placeholder="Enter carpet area"
                value={newProperty.carpetArea}
                onChangeText={t => {
                  set({carpetArea: t.replace(/[^0-9.]/g, '')});
                  clearError('area');
                }}
                error={errors.area}
              />
              <View style={styles.unitBox}>
                <Text style={styles.unitText}>sq.ft</Text>
              </View>
            </View>
            <Hint>Enter the total carpet area</Hint>
            <Input
              style={styles.mt12}
              keyboardType="decimal-pad"
              placeholder="Built up area (sq.ft) — optional"
              value={newProperty.builtUpArea}
              onChangeText={t => set({builtUpArea: t.replace(/[^0-9.]/g, '')})}
            />
          </>
        )}

        {areaMode === 'plot' && (
          <>
            <View style={styles.row}>
              <Input
                style={styles.flex1}
                keyboardType="decimal-pad"
                placeholder="Enter plot area"
                value={newProperty.carpetArea || newProperty.builtUpArea}
                onChangeText={t => {
                  const v = t.replace(/[^0-9.]/g, '');
                  set({carpetArea: v, builtUpArea: v});
                  clearError('area');
                }}
                error={errors.area}
              />
              <View style={styles.unitBox}>
                <Text style={styles.unitText}>sq.ft</Text>
              </View>
            </View>
            <Hint>Enter the total plot area</Hint>
          </>
        )}

        {areaMode === 'land' && (
          <>
            <View style={styles.row}>
              <Input
                style={styles.flex1}
                keyboardType="decimal-pad"
                placeholder="Enter land area"
                value={land.value}
                onChangeText={t => {
                  const v = t.replace(/[^0-9.]/g, '');
                  set({
                    builtUpArea: v ? `${v} ${land.unit}` : '',
                    carpetArea: '',
                  });
                  clearError('area');
                }}
                error={errors.area}
              />
              <View style={styles.unitSelect}>
                <SelectField
                  value={land.unit}
                  title="Land unit"
                  options={LAND_UNITS}
                  onSelect={u =>
                    set({
                      builtUpArea: land.value ? `${land.value} ${u}` : '',
                      carpetArea: '',
                    })
                  }
                />
              </View>
            </View>
            <Hint>Enter the total land area and choose the unit</Hint>
          </>
        )}
        <ErrorText>{errors.area}</ErrorText>
      </View>

      {/* TYPE-SPECIFIC DETAILS */}
      <View style={styles.block}>
        <Text style={styles.sectionTitlePlain}>
          {areaMode === 'land' ? 'Land Details' : 'Property Details'}
        </Text>
        {basicDetailFieldsFor(newProperty).map(f => (
          <View key={f.key} style={styles.mb12}>
            <Label>{f.label}</Label>
            {f.type === 'select' ? (
              <SelectField
                value={newProperty[f.key] || ''}
                title={f.label}
                options={f.options}
                onSelect={v => set({[f.key]: v})}
              />
            ) : (
              <Input
                keyboardType="number-pad"
                placeholder={f.placeholder}
                value={newProperty[f.key] || ''}
                onChangeText={t => set({[f.key]: t.replace(/\D/g, '')})}
              />
            )}
          </View>
        ))}
      </View>

      {/* CONFIGURATION (BHK) */}
      {showConfiguration && (
        <View style={styles.block}>
          <SectionTitle Icon={Building2} required>
            Configuration
          </SectionTitle>
          <Hint>Buyers filter by this, so pick the closest match</Hint>
          <View style={[styles.tabWrap, styles.mt8]}>
            {BHK_OPTIONS.map(option => {
              const active = newProperty.propertyType === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.bhkChip,
                    errors.propertyType && styles.bhkChipError,
                    active && styles.tabActive,
                  ]}
                  onPress={() => {
                    set({propertyType: option});
                    clearError('propertyType');
                  }}>
                  <Text
                    style={[
                      styles.bhkText,
                      active && styles.textWhite,
                      active && styles.bold,
                    ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <ErrorText>{errors.propertyType}</ErrorText>
        </View>
      )}

      {/* PRICING */}
      <View style={styles.block}>
        <SectionTitle Icon={IndianRupee}>Pricing Details</SectionTitle>
        {[
          {
            key: 'totalSalesPrice',
            label: priceLabels.total,
            hint: isRent ? 'Per month' : '',
          },
          {
            key: 'totalOfferPrice',
            label: priceLabels.offer,
            hint: priceLabels.offerHint,
          },
        ].map(({key, label, hint}) => {
          const words = priceInWords(newProperty[key]);
          return (
            <View key={key} style={styles.mb12}>
              <Label required>{label}</Label>
              <View
                style={[styles.prefixInput, errors[key] && styles.inputError]}>
                <Text style={styles.prefixText}>₹</Text>
                <TextInput
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  value={formatINR(newProperty[key])}
                  onChangeText={t => {
                    set({[key]: t.replace(/\D/g, '').slice(0, 12)});
                    clearError(key);
                  }}
                  style={styles.prefixField}
                />
              </View>
              {errors[key] ? (
                <ErrorText>{errors[key]}</ErrorText>
              ) : words || hint ? (
                <Text style={styles.hint}>
                  {words ? (
                    <Text style={styles.priceWords}>{words}</Text>
                  ) : null}
                  {words && hint ? ' · ' : ''}
                  {hint}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* DESCRIPTION */}
      <View style={styles.block}>
        <SectionTitle Icon={FileText} optional>
          Description
        </SectionTitle>
        <Hint>
          Highlight what makes it special: nearby schools, metro, view, recent
          renovation, society amenities.
        </Hint>
        <Input
          multiline
          maxLength={MAX_DESCRIPTION}
          textAlignVertical="top"
          value={newProperty.propertyDescription}
          onChangeText={t => {
            set({propertyDescription: t});
            clearError('propertyDescription');
          }}
          placeholder="e.g. Spacious east-facing 2 BHK, 5 minutes from Manish Nagar metro station, 24x7 water and power backup."
          style={[styles.textArea, styles.mt8]}
          error={errors.propertyDescription}
        />
        <View style={styles.counterRow}>
          <Text style={styles.errorText}>{errors.propertyDescription}</Text>
          <Text style={styles.hint}>
            {newProperty.propertyDescription.length}/{MAX_DESCRIPTION}
          </Text>
        </View>
      </View>

      {/* CONTACT */}
      <View style={styles.block}>
        <SectionTitle Icon={User}>Contact Details</SectionTitle>
        <Hint>
          Pre-filled from your profile. Change them if someone else handles
          enquiries.
        </Hint>

        <View style={styles.mt12}>
          <Label required>Owner Name</Label>
          <Input
            value={newProperty.projectBy}
            onChangeText={t => {
              set({projectBy: t.replace(/[^A-Za-z\s.]/g, '')});
              clearError('projectBy');
            }}
            error={errors.projectBy}
          />
          <ErrorText>{errors.projectBy}</ErrorText>
        </View>

        <View style={styles.mt12}>
          <Label required>Phone</Label>
          <View
            style={[styles.prefixInput, errors.contact && styles.inputError]}>
            <Text style={styles.phonePrefix}>+91</Text>
            <TextInput
              keyboardType="phone-pad"
              maxLength={10}
              value={newProperty.contact}
              onChangeText={t => {
                set({contact: t.replace(/\D/g, '')});
                clearError('contact');
              }}
              style={styles.prefixField}
            />
          </View>
          <ErrorText>{errors.contact}</ErrorText>
        </View>

        <View style={styles.mt12}>
          <Label optional>Email</Label>
          <Input
            keyboardType="email-address"
            autoCapitalize="none"
            value={newProperty.email}
            onChangeText={t => {
              set({email: t});
              clearError('email');
            }}
            error={errors.email}
          />
          <ErrorText>{errors.email}</ErrorText>
        </View>
      </View>

      {/* SECURITY */}
      <View style={styles.secureNote}>
        <Lock size={14} color={PURPLE} />
        <Text style={styles.secureText}>
          Your contact details are secure and shared only with verified{' '}
          {isRent ? 'tenants' : 'buyers'}
        </Text>
      </View>
    </>
  );

  const renderMediaStep = () => (
    <>
      {/* PHOTOS */}
      <View>
        <SectionTitle Icon={Images} required>
          Property Photos
        </SectionTitle>
        <Text style={styles.mediaHint}>
          Add 1 to {MAX_PHOTOS} clear photos. The first photo is the cover shown
          in search results.
        </Text>

        {photos.length < MAX_PHOTOS && (
          <TouchableOpacity
            style={[
              styles.dropZone,
              photoError && styles.dropZoneError,
              submitting && styles.dimmed,
            ]}
            disabled={submitting}
            onPress={pickPhotos}>
            <Images size={30} color={PURPLE} />
            <Text style={styles.dropTitle}>
              {photos.length ? 'Add more photos' : 'Tap to upload photos'}
            </Text>
            <Text style={styles.dropHint}>
              JPG, PNG or WEBP · {photos.length}/{MAX_PHOTOS} added · large
              photos are compressed automatically
            </Text>
          </TouchableOpacity>
        )}
        <ErrorText>{photoError}</ErrorText>

        {photos.length > 0 && (
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <View
                key={photo.uri}
                style={[styles.photoTile, index === 0 && styles.photoCover]}>
                <Image source={{uri: photo.uri}} style={styles.photoImg} />
                {index === 0 ? (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>Cover</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.makeCoverBtn}
                    disabled={submitting}
                    onPress={() => makeCover(index)}>
                    <Text style={styles.makeCoverText}>Make cover</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.removeBtn}
                  disabled={submitting}
                  onPress={() => removePhoto(index)}>
                  <X size={12} color="#fff" strokeWidth={3} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* VIDEOS */}
      <View style={styles.block}>
        <SectionTitle Icon={Video} optional>
          Videos
        </SectionTitle>
        <Text style={styles.mediaHint}>
          A short walkthrough video or reel helps buyers decide faster.
        </Text>

        <View style={styles.mediaLabelRow}>
          <Video size={14} color={PURPLE} />
          <Text style={styles.label}>Walkthrough video</Text>
        </View>
        {video ? (
          <View style={styles.videoCard}>
            <Video size={22} color={PURPLE} />
            <View style={styles.flex1}>
              <Text style={styles.videoName} numberOfLines={1}>
                {video.fileName || 'Selected video'}
              </Text>
              <Text style={styles.hint}>
                {video.fileSize
                  ? `${(video.fileSize / (1024 * 1024)).toFixed(1)} MB · `
                  : ''}
                will upload when you submit
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeBtnInline}
              disabled={submitting}
              onPress={() => setVideo(null)}>
              <X size={12} color="#fff" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.videoDrop,
              mediaErrors.video && styles.dropZoneError,
              submitting && styles.dimmed,
            ]}
            disabled={submitting}
            onPress={pickVideo}>
            <Video size={24} color={PURPLE} />
            <Text style={styles.dropTitleSmall}>Choose video</Text>
            <Text style={styles.dropHint}>MP4, MOV or WEBM · up to 200 MB</Text>
          </TouchableOpacity>
        )}
        <ErrorText>{mediaErrors.video}</ErrorText>

        <View style={[styles.mediaLabelRow, styles.mt16]}>
          <Youtube size={14} color="#DC2626" />
          <Text style={styles.label}>YouTube link</Text>
        </View>
        <Input
          keyboardType="url"
          autoCapitalize="none"
          value={newProperty.videoLink}
          onChangeText={t => {
            set({videoLink: t});
            setMediaErrors(prev => ({...prev, videoLink: ''}));
          }}
          placeholder="https://youtu.be/..."
          editable={!submitting}
          error={mediaErrors.videoLink}
        />
        <ErrorText>{mediaErrors.videoLink}</ErrorText>
        {ytId ? (
          <Image
            source={{uri: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}}
            style={styles.ytPreview}
          />
        ) : null}

        <View style={[styles.mediaLabelRow, styles.mt16]}>
          <Instagram size={14} color="#DB2777" />
          <Text style={styles.label}>Instagram reel link</Text>
        </View>
        <Input
          keyboardType="url"
          autoCapitalize="none"
          value={newProperty.instagramReelLink}
          onChangeText={t => {
            set({instagramReelLink: t});
            setMediaErrors(prev => ({...prev, instagramReelLink: ''}));
          }}
          placeholder="https://www.instagram.com/reel/..."
          editable={!submitting}
          error={mediaErrors.instagramReelLink}
        />
        {mediaErrors.instagramReelLink ? (
          <ErrorText>{mediaErrors.instagramReelLink}</ErrorText>
        ) : (
          <Hint>Open the reel on Instagram → Share → Copy link</Hint>
        )}
      </View>

      {submitError ? (
        <Text style={styles.errorBanner}>{submitError}</Text>
      ) : null}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar backgroundColor="#F7F3FF" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleHeaderBack}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <ArrowLeft size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{STEPS[step - 1].label}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          {/* Draft restore */}
          {savedDraft && (
            <View style={styles.draftBanner}>
              <View style={styles.draftTextRow}>
                <Undo2 size={14} color={PURPLE} style={styles.draftIcon} />
                <Text style={styles.draftText}>
                  You have an unfinished listing
                  {savedDraft.property.propertyName ? (
                    <>
                      {' for '}
                      <Text style={styles.bold}>
                        {savedDraft.property.propertyName}
                      </Text>
                    </>
                  ) : null}
                  . Continue where you left off?
                </Text>
              </View>
              <View style={styles.draftActions}>
                <TouchableOpacity
                  style={styles.draftFresh}
                  onPress={discardDraft}>
                  <Text style={styles.draftFreshText}>Start fresh</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.draftContinue}
                  onPress={restoreDraft}>
                  <Text style={styles.draftContinueText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {renderStepper()}

          <Text style={styles.stepTitle}>{STEPS[step - 1].title}</Text>

          {step === 1 && renderTypeStep()}
          {step === 2 && renderLocationStep()}
          {step === 3 && renderDetailsStep()}
          {step === 4 && renderMediaStep()}

          {/* Footer */}
          {step < 4 ? (
            <>
              {Object.keys(currentStepErrors).length > 0 && (
                <Text style={styles.errorBanner}>
                  Please fix the highlighted fields to continue.
                </Text>
              )}
              <View style={styles.footer}>
                <TouchableOpacity style={styles.primaryBtn} onPress={goNext}>
                  <Text style={styles.primaryText}>
                    Continue to {STEPS[step].label} →
                  </Text>
                </TouchableOpacity>
                {step > 1 && (
                  <TouchableOpacity style={styles.backBtn} onPress={goBack}>
                    <Text style={styles.backText}>← Back</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            <View style={styles.footerFinal}>
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  styles.submitBtn,
                  submitting && styles.dimmed,
                ]}
                disabled={submitting}
                onPress={submit}>
                {submitting ? (
                  <View style={styles.row}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.primaryText}>
                      {submitStatus || 'Submitting...'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.primaryText}>
                    Submit for Verification
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.backBtn, submitting && styles.dimmed]}
                disabled={submitting}
                onPress={goBack}>
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick tips — shown below the form, like the website on mobile */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <View style={styles.tipsIcon}>
              <Lightbulb size={20} color={PURPLE} />
            </View>
            <View>
              <Text style={styles.tipsTitle}>Quick Tips</Text>
              <Text style={styles.tipsSub}>
                Get the best value for your property
              </Text>
            </View>
          </View>
          {[
            'Add clear, bright photos to get more enquiries',
            'Accurate details help buyers find your property faster',
            'Every listing is verified by our team before it goes live',
          ].map(tip => (
            <View key={tip} style={styles.tipRow}>
              <CheckCheck size={18} color={PURPLE} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
          <View style={styles.tipsDivider} />
          <View style={styles.secureRow}>
            <Lock size={16} color="#000" />
            <Text style={styles.secureTitle}>100% Secure & Private</Text>
          </View>
          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpText}>
              Our property experts are here to assist you
            </Text>
            <TouchableOpacity
              style={styles.helpBtn}
              onPress={() => Linking.openURL('tel:+918010881965')}>
              <Text style={styles.helpBtnText}>Talk to Expert</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const noFontPadding = Platform.select({
  android: {includeFontPadding: false},
  default: {},
});

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F7F3FF'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'SegoeUI-Bold',
    fontWeight: '700',
    color: '#000',
  },
  headerSpacer: {width: 20},
  scrollContent: {paddingHorizontal: 16, paddingBottom: 32},

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    paddingVertical: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {elevation: 1},
    }),
  },

  // Draft
  draftBanner: {
    marginBottom: 24,
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4D8FF',
    backgroundColor: '#FAF8FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  draftTextRow: {flexDirection: 'row', gap: 8},
  draftIcon: {marginTop: 2},
  draftText: {flex: 1, fontSize: 14, color: '#111'},
  draftActions: {flexDirection: 'row', gap: 8},
  draftFresh: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  draftFreshText: {fontSize: 14, fontWeight: '600', color: '#4B5563'},
  draftContinue: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: PURPLE,
  },
  draftContinueText: {fontSize: 14, fontWeight: '600', color: '#fff'},

  // Stepper
  stepper: {marginBottom: 32},
  stepperTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepCount: {fontSize: 12, fontWeight: '600', color: PURPLE},
  stepDone: {fontSize: 12, fontWeight: '600', color: '#9CA3AF'},
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {height: '100%', backgroundColor: PURPLE},
  stepList: {flexDirection: 'row', gap: 8},
  stepItem: {flex: 1, alignItems: 'center', gap: 6},
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  stepDotActive: {backgroundColor: PURPLE},
  stepDotRing: {borderWidth: 4, borderColor: 'rgba(138,56,245,0.2)'},
  stepDotText: {fontSize: 12, fontWeight: '700', color: '#6B7280'},
  stepDotTextActive: {color: '#fff'},
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 13,
  },
  stepLabelActive: {color: '#000'},
  stepTitle: {
    fontSize: 20,
    fontFamily: 'SegoeUI-Bold',
    fontWeight: '700',
    color: '#000',
    marginBottom: 24,
  },

  // Type step
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  subGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  listingTypeRow: {flexDirection: 'row', gap: 8, marginBottom: 24},
  listingTypeCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 12,
  },
  listingTypeLabel: {fontSize: 15, fontWeight: '600', color: '#374151'},
  listingTypeHint: {fontSize: 11, lineHeight: 14, marginTop: 2, color: GRAY},
  listingTypeHintActive: {color: '#EDE9FE'},
  tabWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24},
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  tabActive: {backgroundColor: PURPLE, borderColor: PURPLE},
  tabText: {fontSize: 14, fontWeight: '600', color: '#374151'},
  textWhite: {color: '#FFFFFF'},
  categoryGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  categoryBtn: {
    width: '48.5%',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  categoryText: {fontSize: 14, color: GRAY},
  categoryActive: {color: '#FFFFFF', fontWeight: '700'},

  // Shared blocks
  block: {marginTop: 32},
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    ...noFontPadding,
  },
  sectionTitlePlain: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  sectionOptional: {fontSize: 14, fontWeight: '400', color: '#9CA3AF'},
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111',
    marginBottom: 4,
    marginLeft: 4,
    marginTop: 12,
  },
  required: {color: RED},
  optional: {color: '#9CA3AF', fontWeight: '400'},
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 11 : 8,
    fontSize: 14,
    color: '#000',
    backgroundColor: '#FFFFFF',
  },
  inputError: {borderColor: RED},
  inputDisabled: {backgroundColor: '#F9FAFB'},
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 42,
    gap: 6,
  },
  selectText: {flex: 1, fontSize: 14, color: '#000'},
  placeholderText: {color: '#6B7280'},
  errorText: {fontSize: 12, color: RED, marginTop: 4},
  successText: {fontSize: 12, color: '#16A34A', marginTop: 4},
  hint: {fontSize: 12, color: GRAY, marginTop: 4, marginLeft: 4},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12},
  flex1: {flex: 1},
  mt8: {marginTop: 8},
  mt12: {marginTop: 12},
  mt16: {marginTop: 16},
  mb12: {marginBottom: 12},
  bold: {fontWeight: '700'},
  dimmed: {opacity: 0.6},

  // Details step
  unitBox: {
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 11 : 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  unitText: {fontSize: 14, color: '#000'},
  unitSelect: {width: 120},
  bhkChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  bhkChipError: {borderColor: '#FCA5A5'},
  bhkText: {fontSize: 14, color: '#374151'},
  prefixInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
  },
  prefixText: {paddingLeft: 16, fontSize: 14, color: '#6B7280'},
  phonePrefix: {
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 11 : 10,
    fontSize: 14,
    color: '#4B5563',
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  prefixField: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 11 : 8,
    fontSize: 14,
    color: '#000',
  },
  priceWords: {fontWeight: '600', color: '#374151'},
  textArea: {minHeight: 120},
  counterRow: {flexDirection: 'row', justifyContent: 'space-between'},
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3EDFF',
  },
  secureText: {flex: 1, fontSize: 14, color: '#111'},

  // Media step
  mediaHint: {fontSize: 14, color: GRAY, marginBottom: 16},
  dropZone: {
    alignItems: 'center',
    gap: 8,
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: PURPLE,
    backgroundColor: '#FFFFFF',
  },
  dropZoneError: {borderColor: '#F87171'},
  dropTitle: {fontSize: 15, fontWeight: '600', color: '#000'},
  dropTitleSmall: {fontSize: 14, fontWeight: '600', color: '#000'},
  dropHint: {fontSize: 12, color: GRAY, textAlign: 'center'},
  photoGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 24},
  photoTile: {
    width: '47.5%',
    height: 140,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  photoCover: {borderWidth: 2, borderColor: PURPLE},
  photoImg: {width: '100%', height: '100%'},
  coverBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: PURPLE,
  },
  coverBadgeText: {fontSize: 11, fontWeight: '600', color: '#fff'},
  makeCoverBtn: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  makeCoverText: {fontSize: 11, fontWeight: '600', color: '#5323DC'},
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RED,
  },
  removeBtnInline: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RED,
  },
  mediaLabelRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  videoDrop: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    aspectRatio: 16 / 9,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D9D9D9',
    paddingHorizontal: 12,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  videoName: {fontSize: 14, fontWeight: '600', color: '#000'},
  ytPreview: {
    marginTop: 8,
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },

  // Footer
  errorBanner: {
    marginTop: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  footer: {
    gap: 12,
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerFinal: {gap: 12, marginTop: 40},
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: PURPLE,
    elevation: 2,
  },
  submitBtn: {borderRadius: 8, elevation: 4, shadowColor: PURPLE},
  primaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    ...noFontPadding,
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PURPLE,
  },
  backText: {fontSize: 15, fontWeight: '600', color: PURPLE},

  // Quick tips
  tipsCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    paddingVertical: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 1},
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  tipsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
  },
  tipsTitle: {
    fontSize: 18,
    fontFamily: 'SegoeUI-Bold',
    fontWeight: '700',
    color: '#000',
  },
  tipsSub: {fontSize: 12, color: '#6B7280'},
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  tipText: {flex: 1, fontSize: 14, color: GRAY},
  tipsDivider: {height: 1, backgroundColor: '#D9D9D9', marginVertical: 8},
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  secureTitle: {fontSize: 14, fontWeight: '700', color: '#000'},
  helpBox: {
    marginTop: 24,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#EEE1FF',
  },
  helpTitle: {fontSize: 15, fontWeight: '600', color: '#000'},
  helpText: {fontSize: 14, color: GRAY, marginTop: 4, marginBottom: 16},
  helpBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#5323DC',
  },
  helpBtnText: {fontSize: 14, fontWeight: '600', color: '#fff'},

  // Option sheet
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    // Pixel height: percentage heights don't resolve inside the Android modal
    maxHeight: Dimensions.get('window').height * 0.65,
    minHeight: 220,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {fontSize: 16, fontWeight: '700', color: '#000'},
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  modalItemText: {fontSize: 15, color: '#333'},
  modalItemTextActive: {color: PURPLE, fontWeight: '700'},
  modalEmpty: {padding: 20, fontSize: 14, color: GRAY, textAlign: 'center'},
});
