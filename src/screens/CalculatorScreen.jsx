import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
  TextInput,
  Share,
  Clipboard,
  KeyboardAvoidingView,
  ToastAndroid,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import {
  ArrowLeft,
  Users,
  Plus,
  X,
  Copy,
  MessageCircle,
  TrendingUp,
  Maximize2,
  Percent,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import EmiRightSide from '../assets/image/trends/rside.png';
import EmiLeftSide from '../assets/image/trends/lside.png';
import {formatIndianAmount} from '../utils/formatIndianAmount';

const {width} = Dimensions.get('window');

const HORIZONTAL_PADDING = 16;
const CARD_INNER_PADDING = 16;

// Screen padding + card padding on each side
const CARD_SLIDER_LENGTH =
  width - HORIZONTAL_PADDING * 2 - CARD_INNER_PADDING * 2;

// ─── Sample avatars ───────────────────────────────────────────────
const SAMPLE_AVATARS = [
  'https://images.pexels.com/photos/7616706/pexels-photo-7616706.jpeg',
  'https://images.unsplash.com/photo-1614025000673-edf238aaf5d4',
  'https://images.unsplash.com/photo-1625540383825-2efce9ea3acd',
  'https://images.unsplash.com/photo-1767607740661-05e668190cdc',
  'https://images.unsplash.com/photo-1775218888901-088696a4ee0b',
];

// ─── Tab keys ─────────────────────────────────────────────────────
const TABS = {
  RENT: 'rent',
  BROKERAGE: 'brokerage',
  SIP: 'sip',
  AREA: 'area',
};

const TAB_BAR_CLEARANCE = 100;

export default function CalculatorScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = TAB_BAR_CLEARANCE + insets.bottom + 16;
  const canGoBack = navigation.canGoBack?.() ?? false;
  const [activeTab, setActiveTab] = useState(TABS.RENT);

  /* ─────────────── Rent Split State ─────── */
  const [rentAmount, setRentAmount] = useState('12000');
  const [people, setPeople] = useState([
    {name: 'You', photo: SAMPLE_AVATARS[0]},
    {name: 'Rahul', photo: SAMPLE_AVATARS[2]},
    {name: 'Sneha', photo: SAMPLE_AVATARS[1]},
  ]);
  const [newName, setNewName] = useState('');

  const totalRent = parseFloat(rentAmount.replace(/[^0-9.]/g, '')) || 0;
  const share = people.length > 0 ? Math.floor(totalRent / people.length) : 0;
  const remainder = totalRent - share * people.length;

  /* ─────────────── Rent Split Handlers ─── */
  const addPerson = () => {
    const name = newName.trim();
    if (!name) return;
    const photo = SAMPLE_AVATARS[people.length % SAMPLE_AVATARS.length];
    setPeople(prev => [...prev, {name, photo}]);
    setNewName('');
  };

  const removePerson = i => {
    if (people.length <= 1) return;
    setPeople(prev => prev.filter((_, idx) => idx !== i));
  };

  const buildSummary = () =>
    `🏠 Reparv Rent Split\nTotal Rent: ₹${totalRent.toLocaleString(
      'en-IN',
    )}\nSplit ${people.length} ways:\n` +
    people
      .map((p, idx) => {
        const amt = idx === 0 ? share + remainder : share;
        return `• ${p.name}: ₹${amt.toLocaleString('en-IN')}/mo`;
      })
      .join('\n');

  const onShare = async () => {
    try {
      await Share.share({message: buildSummary()});
    } catch (_) {}
  };

  const onCopy = () => {
    Clipboard.setString(buildSummary());
    ToastAndroid.show('Split details copied to clipboard.', ToastAndroid.SHORT);
  };

  /* ─────────────── Brokerage State ─────── */
  const [propValue, setPropValue] = useState(5000000);
  // brokerageRateInput is the text the user types; brokerageRateNum is parsed float
  const [brokerageRateInput, setBrokerageRateInput] = useState('2');
  const brokerageRateNum = Math.min(
    10,
    Math.max(0, parseFloat(brokerageRateInput.replace(/[^0-9.]/g, '')) || 0),
  );
  // Quick preset selection (null when user typed a custom value)
  const [selectedPresetRate, setSelectedPresetRate] = useState(2);

  const brokerage = Math.round(propValue * (brokerageRateNum / 100));
  const gst = Math.round(brokerage * 0.18);
  const totalBrokerage = brokerage + gst;
  // Effective total cost including property value
  const totalCost = propValue + totalBrokerage;

  const handlePresetRate = r => {
    setSelectedPresetRate(r);
    setBrokerageRateInput(String(r));
  };

  const handleManualRateChange = v => {
    setSelectedPresetRate(null);
    setBrokerageRateInput(v.replace(/[^0-9.]/g, ''));
  };

  /* ─────────────── SIP State ──────────── */
  const [targetAmount, setTargetAmount] = useState('2000000');
  const [sipYears, setSipYears] = useState(5);
  const [sipReturn, setSipReturn] = useState(12);
  const sipMonthlyRate = sipReturn / 12 / 100;
  const sipMonths = sipYears * 12;
  const sipMonthly =
    sipMonthlyRate > 0
      ? Math.round(
          ((parseFloat(targetAmount.replace(/[^0-9.]/g, '')) || 0) *
            sipMonthlyRate) /
            (Math.pow(1 + sipMonthlyRate, sipMonths) - 1),
        )
      : Math.round(
          (parseFloat(targetAmount.replace(/[^0-9.]/g, '')) || 0) / sipMonths,
        );
  const sipTotalInvested = sipMonthly * sipMonths;
  const sipTargetNum = parseFloat(targetAmount.replace(/[^0-9.]/g, '')) || 0;
  const sipGain = sipTargetNum - sipTotalInvested;

  /* ─────────────── Area Converter State ─ */
  const [areaInput, setAreaInput] = useState('1000');
  const [areaFromUnit, setAreaFromUnit] = useState('sqft');
  const areaVal = parseFloat(areaInput.replace(/[^0-9.]/g, '')) || 0;

  const TO_SQFT = {
    sqft: 1,
    sqm: 10.7639,
    gaj: 9,
    bigha: 26909.8,
    cent: 435.6,
  };
  const UNIT_LABELS = {
    sqft: 'Sq Ft',
    sqm: 'Sq Metre',
    gaj: 'Gaj',
    bigha: 'Bigha',
    cent: 'Cent',
  };
  const inSqft = areaVal * TO_SQFT[areaFromUnit];
  const areaResults = Object.entries(TO_SQFT).map(([unit, factor]) => ({
    unit,
    label: UNIT_LABELS[unit],
    value: (inSqft / factor).toFixed(unit === 'sqft' ? 0 : 3),
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#FAF8FF" barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        {canGoBack ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <ArrowLeft size={22} color="#111" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSide} />
        )}
        <Text style={styles.headerTitle}>Property Calculator</Text>
        <View style={styles.headerSide} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {paddingBottom: scrollBottomPadding},
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces>
          <Text style={styles.subTitle}>
            Make smarter property decisions instantly
          </Text>

          {/* ── Tabs ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsRow}>
            <Tab
              icon={Users}
              label="Rent Split"
              active={activeTab === TABS.RENT}
              onPress={() => setActiveTab(TABS.RENT)}
            />
            <Tab
              icon={Percent}
              label="Brokerage"
              active={activeTab === TABS.BROKERAGE}
              onPress={() => setActiveTab(TABS.BROKERAGE)}
            />
            <Tab
              icon={TrendingUp}
              label="SIP to Down Payment"
              active={activeTab === TABS.SIP}
              onPress={() => setActiveTab(TABS.SIP)}
            />
          </ScrollView>


          {/* ════════════════ RENT SPLIT TAB ════════════════ */}
          {activeTab === TABS.RENT && (
            <View style={styles.tabPanel}>
              <LinearGradient
                colors={['#8A38F5', '#5E23DC']}
                style={styles.rentGradientCard}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}>
                <View style={styles.decorCircle1} />
                <View style={styles.decorCircle2} />
                <Text style={styles.rentGradLabel}>Total monthly rent</Text>
                <View style={styles.rentInputRow}>
                  <Text style={styles.rentRupee}>₹</Text>
                  <TextInput
                    value={rentAmount}
                    onChangeText={v => setRentAmount(v.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    placeholder="12,000"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    style={styles.rentInput}
                    selectionColor="rgba(255,255,255,0.7)"
                  />
                </View>
                <Text style={styles.rentHint}>per month · tap to edit</Text>
              </LinearGradient>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionLabel}>Quick select</Text>
                <View style={styles.presetsRow}>
                  {['8000', '12000', '18000', '25000'].map(amt => (
                    <TouchableOpacity
                      key={amt}
                      onPress={() => setRentAmount(amt)}
                      style={[
                        styles.presetChip,
                        rentAmount === amt && styles.presetChipActive,
                      ]}
                      activeOpacity={0.8}>
                      <Text
                        style={[
                          styles.presetText,
                          rentAmount === amt && styles.presetTextActive,
                        ]}>
                        ₹{parseInt(amt, 10).toLocaleString('en-IN')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.rentSectionHeader}>
                  <Text style={styles.rentSectionTitle}>
                    Roommates ({people.length})
                  </Text>
                  <View style={styles.splitBadge}>
                    <Text style={styles.splitBadgeText}>
                      ÷ {people.length} ways
                    </Text>
                  </View>
                </View>

                <View style={styles.chipsWrap}>
                  {people.map((p, i) => (
                    <View key={`chip-${i}`} style={styles.chip}>
                      <View style={styles.chipAvatarWrapper}>
                        <Text style={styles.chipAvatarText}>
                          {p.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.chipTxt} numberOfLines={1}>
                        {p.name}
                      </Text>
                      {people.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removePerson(i)}
                          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                          <View style={styles.chipXCircle}>
                            <X size={10} color="#6B7280" strokeWidth={2.8} />
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>

                <View style={styles.addRow}>
                  <TextInput
                    value={newName}
                    onChangeText={setNewName}
                    onSubmitEditing={addPerson}
                    placeholder="Add roommate name…"
                    placeholderTextColor="#9CA3AF"
                    style={styles.addInput}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    onPress={addPerson}
                    style={styles.addBtn}
                    activeOpacity={0.85}>
                    <Plus size={16} color="#fff" strokeWidth={2.5} />
                    <Text style={styles.addBtnTxt}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.summaryBanner}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemVal}>
                    ₹{totalRent.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.summaryItemLabel}>Total Rent</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryItemVal, styles.summaryHighlight]}>
                    ₹{share.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.summaryItemLabel}>Per Person</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemVal}>{people.length}</Text>
                  <Text style={styles.summaryItemLabel}>Roommates</Text>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionLabel}>Each person pays</Text>

                {people.map((p, i) => {
                  const personShare = i === 0 ? share + remainder : share;
                  const percent =
                    totalRent > 0
                      ? Math.round((personShare / totalRent) * 100)
                      : 0;
                  return (
                    <View key={`split-${i}`} style={styles.splitCard}>
                      <View style={styles.splitAvatarCircle}>
                        <Text style={styles.splitAvatarText}>
                          {p.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.splitBody}>
                        <View style={styles.splitTopRow}>
                          <Text style={styles.splitName} numberOfLines={1}>
                            {p.name}
                          </Text>
                          <Text style={styles.splitAmt}>
                            ₹{personShare.toLocaleString('en-IN')}
                            <Text style={styles.splitMo}>/mo</Text>
                          </Text>
                        </View>
                        <View style={styles.progressBarBg}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {width: `${percent}%`},
                            ]}
                          />
                        </View>
                        <Text style={styles.splitSub}>
                          {percent}% of total rent
                          {i === 0 && remainder > 0
                            ? ` · includes ₹${remainder} rounding`
                            : ''}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  onPress={onCopy}
                  style={[styles.actionBtn, styles.outlineBtn]}
                  activeOpacity={0.82}>
                  <Copy size={16} color="#7C3AED" strokeWidth={2.2} />
                  <Text style={styles.outlineBtnTxt}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onShare}
                  style={[styles.actionBtn, styles.whatsappBtn]}
                  activeOpacity={0.85}>
                  <MessageCircle size={16} color="#fff" strokeWidth={2.2} />
                  <Text style={styles.filledBtnTxt}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ════════════════ BROKERAGE TAB ════════════════ */}
          {activeTab === TABS.BROKERAGE && (
            <View style={styles.newTabContainer}>
              <View style={styles.card}>
                {/* Property Value */}
                <Field
                  label="Property Value"
                  value={`₹ ${formatIndianAmount(propValue)}`}
                  onPress={() => {}}
                />
                <MultiSlider
                  values={[propValue]}
                  sliderLength={CARD_SLIDER_LENGTH}
                  onValuesChange={v => setPropValue(v[0])}
                  min={500000}
                  max={100000000}
                  step={100000}
                  selectedStyle={{backgroundColor: '#7C3AED'}}
                  unselectedStyle={{backgroundColor: '#E5E7EB'}}
                  markerStyle={styles.marker}
                />
                <RangeRow left="₹ 5 L" right="₹ 10 Cr+" />

                {/* Brokerage Rate – Quick Presets */}
                <Text style={[styles.fieldLabel, {marginTop: 8}]}>
                  Brokerage Rate
                </Text>
                <View style={styles.segmentRow}>
                  {[0.5, 1, 1.5, 2].map(r => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => handlePresetRate(r)}
                      style={[
                        styles.segmentBtn,
                        selectedPresetRate === r && styles.segmentBtnActive,
                      ]}>
                      <Text
                        style={[
                          styles.segmentTxt,
                          selectedPresetRate === r && styles.segmentTxtActive,
                        ]}>
                        {r}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Manual Rate Input */}
                <Text style={[styles.fieldLabel, {marginTop: 12}]}>
                  Or enter custom rate
                </Text>
                <View style={styles.manualRateRow}>
                  <TextInput
                    value={brokerageRateInput}
                    onChangeText={handleManualRateChange}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 1.75"
                    placeholderTextColor="#9CA3AF"
                    style={styles.manualRateInput}
                    selectionColor="#7C3AED"
                    returnKeyType="done"
                  />
                  <View style={styles.manualRateSuffix}>
                    <Text style={styles.manualRateSuffixTxt}>%</Text>
                  </View>
                </View>
                <Text style={styles.manualRateHint}>
                  Effective rate: {brokerageRateNum}% (max 10%)
                </Text>
              </View>

              {/* Result gradient card */}
              <View style={styles.emiCardWrap}>
                <LinearGradient
                  colors={['#8A38F5', '#5E23DC']}
                  style={styles.emiCard}>
                  <Image source={EmiLeftSide} style={styles.leftImage} />
                  <Image source={EmiRightSide} style={styles.rightImage} />
                  <View style={styles.emiTextBlock}>
                    <Text style={styles.emiLabel}>
                      Total Brokerage (incl. GST)
                    </Text>
                    <Text style={styles.emiValue}>
                      ₹{totalBrokerage.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.emiSub}>
                      At {brokerageRateNum}% + 18% GST
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.breakdown}>
                <Text style={styles.breakdownTitle}>Cost Breakdown</Text>
                <Row
                  label="Property Value"
                  value={`₹${formatIndianAmount(propValue)}`}
                />
                <Row
                  label={`Brokerage (${brokerageRateNum}%)`}
                  value={`₹${formatIndianAmount(brokerage)}`}
                />
                <Row
                  label="GST on Brokerage (18%)"
                  value={`₹${formatIndianAmount(gst)}`}
                  danger
                />
                <View style={styles.divider} />
                <Row
                  label="Total Brokerage Payable"
                  value={`₹${formatIndianAmount(totalBrokerage)}`}
                  bold
                />
                <View style={styles.divider} />
                <Row
                  label="Total Cost (Prop. + Brokerage)"
                  value={`₹${formatIndianAmount(totalCost)}`}
                  bold
                />
              </View>

              {/* Who pays brokerage section */}
              <View style={styles.card}>
                <Text style={[styles.breakdownTitle, {marginBottom: 4}]}>
                  Who typically pays?
                </Text>
                <View style={styles.whoRow}>
                  <View style={styles.whoCard}>
                    <Text style={styles.whoEmoji}>🧑‍💼</Text>
                    <Text style={styles.whoLabel}>Seller</Text>
                    <Text style={styles.whoSplit}>50%</Text>
                    <Text style={styles.whoAmt}>
                      ₹{formatIndianAmount(Math.round(totalBrokerage / 2))}
                    </Text>
                  </View>
                  <View style={styles.whoDivider} />
                  <View style={styles.whoCard}>
                    <Text style={styles.whoEmoji}>🏠</Text>
                    <Text style={styles.whoLabel}>Buyer</Text>
                    <Text style={styles.whoSplit}>50%</Text>
                    <Text style={styles.whoAmt}>
                      ₹{formatIndianAmount(Math.round(totalBrokerage / 2))}
                    </Text>
                  </View>
                </View>
                <Text style={styles.whoNote}>
                  * Split varies by agreement. Sometimes one party pays full
                  brokerage.
                </Text>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>💡 What you should know</Text>
                <Text style={styles.infoText}>
                  • Standard brokerage is 1–2% of the property value{'\n'}• 18%
                  GST is mandatory on brokerage fees{'\n'}• Brokerage is
                  negotiable — always negotiate before signing
                  {'\n'}• Typically split between buyer & seller or paid by one
                  party
                  {'\n'}• For rentals, brokerage is usually 1 month's rent{'\n'}
                  • Verify the broker's RERA registration before engaging{'\n'}•
                  Unregistered brokers cannot legally charge brokerage in
                  Maharashtra
                </Text>
              </View>
            </View>
          )}

          {/* ════════════════ SIP TO DOWN PAYMENT TAB ════════════════ */}
          {activeTab === TABS.SIP && (
            <View style={styles.newTabContainer}>
              <LinearGradient
                colors={['#8A38F5', '#5E23DC']}
                style={styles.rentGradientCard}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}>
                <View style={styles.decorCircle1} />
                <View style={styles.decorCircle2} />
                <Text style={styles.rentGradLabel}>
                  Target Down Payment Amount
                </Text>
                <View style={styles.rentInputRow}>
                  <Text style={styles.rentRupee}>₹</Text>
                  <TextInput
                    value={targetAmount}
                    onChangeText={v =>
                      setTargetAmount(v.replace(/[^0-9]/g, ''))
                    }
                    keyboardType="numeric"
                    placeholder="20,00,000"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    style={styles.rentInput}
                    selectionColor="rgba(255,255,255,0.7)"
                  />
                </View>
                <Text style={styles.rentHint}>tap to edit target</Text>
              </LinearGradient>

              <View style={styles.presetsRow}>
                {['500000', '1000000', '2000000', '5000000'].map(amt => (
                  <TouchableOpacity
                    key={amt}
                    onPress={() => setTargetAmount(amt)}
                    style={[
                      styles.presetChip,
                      targetAmount === amt && styles.presetChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.presetText,
                        targetAmount === amt && styles.presetTextActive,
                      ]}>
                      ₹{formatIndianAmount(parseInt(amt))}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.card}>
                <Field
                  label="Time Horizon (Years)"
                  value={`${sipYears} Years`}
                  onPress={() => {}}
                />
                <MultiSlider
                  values={[sipYears]}
                  sliderLength={CARD_SLIDER_LENGTH}
                  onValuesChange={v => setSipYears(v[0])}
                  min={1}
                  max={20}
                  step={1}
                  selectedStyle={{backgroundColor: '#7C3AED'}}
                  unselectedStyle={{backgroundColor: '#E5E7EB'}}
                  markerStyle={styles.marker}
                />
                <RangeRow left="1 Year" right="20 Years" />

                <Field
                  label="Expected Return (% P.A.)"
                  value={`${sipReturn}%`}
                  onPress={() => {}}
                />
                <MultiSlider
                  values={[sipReturn]}
                  sliderLength={CARD_SLIDER_LENGTH}
                  onValuesChange={v => setSipReturn(v[0])}
                  min={6}
                  max={20}
                  step={0.5}
                  selectedStyle={{backgroundColor: '#7C3AED'}}
                  unselectedStyle={{backgroundColor: '#E5E7EB'}}
                  markerStyle={styles.marker}
                />
                <RangeRow left="6%" right="20%" />
              </View>

              <View style={styles.emiCardWrap}>
                <LinearGradient
                  colors={['#8A38F5', '#5E23DC']}
                  style={styles.emiCard}>
                  <Image source={EmiLeftSide} style={styles.leftImage} />
                  <Image source={EmiRightSide} style={styles.rightImage} />
                  <View style={styles.emiTextBlock}>
                    <Text style={styles.emiLabel}>Monthly SIP Needed</Text>
                    <Text style={styles.emiValue}>
                      ₹{sipMonthly.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.emiSub}>
                      To reach ₹{formatIndianAmount(sipTargetNum)} in {sipYears}{' '}
                      yrs
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.breakdown}>
                <Text style={styles.breakdownTitle}>Investment Summary</Text>
                <Row
                  label="Monthly SIP"
                  value={`₹${sipMonthly.toLocaleString('en-IN')}`}
                />
                <Row
                  label="Total Invested"
                  value={`₹${formatIndianAmount(sipTotalInvested)}`}
                />
                <Row
                  label="Estimated Gain"
                  value={`₹${formatIndianAmount(Math.max(sipGain, 0))}`}
                />
                <View style={styles.divider} />
                <Row
                  label="Target Corpus"
                  value={`₹${formatIndianAmount(sipTargetNum)}`}
                  bold
                />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>💡 SIP tip</Text>
                <Text style={styles.infoText}>
                  • SIP returns are market-linked; 12% is a typical equity
                  mutual fund average{'\n'}• Start early — even 1 extra year
                  reduces your monthly SIP significantly{'\n'}• Use step-up SIP
                  (increase 10% annually) to reach goals faster
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Shared small components
────────────────────────────────────────────────────────────────── */

const Tab = ({icon: Icon, label, active, onPress}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    style={[styles.tab, active && styles.activeTab]}>
    <Icon size={16} color={active ? '#FFF' : '#6B7280'} strokeWidth={2.2} />
    <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const Field = ({label, value, onPress}) => (
  <View style={styles.fieldHeader}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TouchableOpacity onPress={onPress} style={styles.inputBox}>
      <Text style={styles.inputText}>{value}</Text>
    </TouchableOpacity>
  </View>
);

const RangeRow = ({left, right}) => (
  <View style={styles.rangeRow}>
    <Text style={styles.rangeText}>{left}</Text>
    <Text style={styles.rangeText}>{right}</Text>
  </View>
);

const Row = ({label, value, bold, danger}) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text
      style={[
        styles.rowValue,
        bold && {fontWeight: '700'},
        danger && {color: '#EF4444'},
      ]}>
      {value}
    </Text>
  </View>
);

/* ──────────────────────────────────────────────────────────────────
   Styles
────────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F5F3FF'},
  flex: {flex: 1},
  scrollContent: {
    paddingTop: 4,
  },

  header: {
    height: 52,
    paddingHorizontal: HORIZONTAL_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8FF',
  },
  headerSide: {width: 28},
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
    }),
  },

  subTitle: {
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    paddingHorizontal: 24,
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },

  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {elevation: 1},
    }),
  },
  activeTab: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.28,
        shadowRadius: 8,
      },
      android: {elevation: 3},
    }),
  },
  tabText: {fontSize: 13, fontWeight: '600', color: '#6B7280'},
  tabTextActive: {color: '#FFF'},

  tabPanel: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: 14,
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    ...Platform.select({
      ios: {
        shadowColor: '#5E23DC',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {elevation: 2},
    }),
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  tabContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 4,
    paddingBottom: 8,
  },
  newTabContainer: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 0,
    paddingBottom: 8,
    gap: 14,
  },

  card: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: CARD_INNER_PADDING,
    gap: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {elevation: 2},
    }),
  },
  fieldHeader: {flexDirection: 'row', justifyContent: 'space-between'},
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    ...Platform.select({
      android: {includeFontPadding: false, textAlignVertical: 'center'},
    }),
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 6 : 4,
  },
  inputText: {fontWeight: '600', color: '#000'},
  rangeRow: {flexDirection: 'row', justifyContent: 'space-between'},
  rangeText: {fontSize: 11, color: '#7C3AED', fontWeight: '500'},
  marker: {
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    borderWidth: 3,
    borderColor: '#FFF',
  },

  emiCardWrap: {
    width: '100%',
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#5E23DC',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.22,
        shadowRadius: 10,
      },
      android: {elevation: 4},
    }),
  },
  emiCard: {
    width: '100%',
    minHeight: 152,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emiTextBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    paddingVertical: 4,
    gap: 6,
  },
  leftImage: {
    position: 'absolute',
    left: -16,
    bottom: -16,
    width: 96,
    height: 96,
    opacity: 0.9,
  },
  rightImage: {
    position: 'absolute',
    right: -16,
    top: -16,
    width: 96,
    height: 96,
    opacity: 0.9,
  },
  emiLabel: {
    color: '#EDE9FE',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  emiValue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFF',
    lineHeight: Platform.OS === 'ios' ? 42 : 40,
    marginTop: 4,
    marginBottom: 2,
  },
  emiSub: {
    color: 'rgba(237,233,254,0.92)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },

  breakdown: {
    width: '100%',
    backgroundColor: '#FFF',
    marginTop: 12,
    borderRadius: 16,
    paddingHorizontal: CARD_INNER_PADDING,
    paddingTop: 14,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {elevation: 2},
    }),
  },
  breakdownTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    color: '#000',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  rowLabel: {color: '#374151', fontSize: 14, flex: 1, paddingRight: 8},
  rowValue: {
    fontWeight: '600',
    color: '#000',
    fontSize: 14,
    textAlign: 'right',
  },
  divider: {height: 1, backgroundColor: '#E5E7EB', marginVertical: 6},
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 4,
    color: '#000',
  },
  pieChartWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    paddingBottom: 4,
  },

  legendRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 12,
    marginBottom: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: 8},
  legendDot: {width: 12, height: 12, borderRadius: 6},
  legendText: {fontSize: 14, fontWeight: '600', color: '#374151'},

  /* Rent Split */
  rentGradientCard: {
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 22,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.28,
        shadowRadius: 16,
      },
      android: {elevation: 6},
    }),
  },
  decorCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.07)',
    right: -30,
    top: -30,
  },
  decorCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    left: -20,
    bottom: -20,
  },
  rentGradLabel: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  rentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rentRupee: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 44,
  },
  rentInput: {
    flex: 1,
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
    paddingVertical: 0,
    marginLeft: 2,
    letterSpacing: -0.5,
    minHeight: 48,
  },
  rentHint: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },

  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  presetChipActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3E8FF',
  },
  presetText: {fontSize: 13, fontWeight: '600', color: '#6B7280'},
  presetTextActive: {color: '#7C3AED'},

  rentSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  rentSectionTitle: {fontSize: 16, fontWeight: '700', color: '#111827'},
  splitBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  splitBadgeText: {color: '#6D28D9', fontSize: 12, fontWeight: '700'},

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FFF',
    paddingLeft: 4,
    paddingRight: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipAvatarWrapper: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipAvatarText: {color: '#FFF', fontSize: 12, fontWeight: '700'},
  chipTxt: {fontWeight: '600', color: '#111', fontSize: 13},
  chipXCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  addInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 11,
    borderRadius: 14,
    color: '#111827',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 48,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    borderRadius: 14,
    minHeight: 48,
    minWidth: 88,
  },
  addBtnTxt: {color: '#fff', fontSize: 14, fontWeight: '700'},

  summaryBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    ...Platform.select({
      ios: {
        shadowColor: '#5E23DC',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {elevation: 2},
    }),
  },
  summaryItem: {flex: 1, alignItems: 'center', paddingHorizontal: 4},
  summaryItemVal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  summaryHighlight: {color: '#7C3AED'},
  summaryItemLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryDivider: {width: 1, backgroundColor: '#E5E7EB', marginVertical: 4},

  splitCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: '#FAFAFF',
    gap: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  splitAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  splitAvatarText: {color: '#FFF', fontSize: 16, fontWeight: '800'},
  splitBody: {flex: 1, minWidth: 0},
  splitTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  splitName: {
    flex: 1,
    fontWeight: '700',
    color: '#111827',
    fontSize: 15,
  },
  progressBarBg: {
    height: 5,
    backgroundColor: '#EDE9FE',
    borderRadius: 5,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressBarFill: {height: 5, backgroundColor: '#7C3AED', borderRadius: 5},
  splitSub: {fontSize: 11, color: '#9CA3AF', fontWeight: '500'},
  splitAmt: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7C3AED',
    flexShrink: 0,
  },
  splitMo: {fontSize: 11, fontWeight: '600', color: '#9CA3AF'},

  btnRow: {flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 8},
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 15,
    borderRadius: 14,
  },
  outlineBtn: {backgroundColor: '#FFF', borderWidth: 2, borderColor: '#7C3AED'},
  outlineBtnTxt: {fontWeight: '700', color: '#7C3AED', fontSize: 14},
  whatsappBtn: {backgroundColor: '#25D366'},
  filledBtnTxt: {fontWeight: '700', color: '#fff', fontSize: 14},

  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  segmentBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
  },
  segmentBtnActive: {borderColor: '#7C3AED', backgroundColor: '#F3E8FF'},
  segmentTxt: {fontSize: 14, fontWeight: '600', color: '#6B7280'},
  segmentTxtActive: {color: '#7C3AED'},

  /* Brokerage manual rate input */
  manualRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  manualRateInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  manualRateSuffix: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 13,
    borderLeftWidth: 1.5,
    borderLeftColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualRateSuffixTxt: {fontSize: 16, fontWeight: '800', color: '#7C3AED'},
  manualRateHint: {fontSize: 11, color: '#9CA3AF', marginTop: 4},

  /* Who pays section */
  whoRow: {
    flexDirection: 'row',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    borderRadius: 16,
    overflow: 'hidden',
  },
  whoCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
    backgroundColor: '#F9F7FF',
  },
  whoDivider: {width: 1, backgroundColor: '#EDE9FE'},
  whoEmoji: {fontSize: 24},
  whoLabel: {fontSize: 13, fontWeight: '600', color: '#374151'},
  whoSplit: {fontSize: 20, fontWeight: '800', color: '#7C3AED'},
  whoAmt: {fontSize: 12, color: '#6B7280', fontWeight: '500'},
  whoNote: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 10,
    lineHeight: 16,
  },

  /* Area converter */
  areaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  areaCard: {
    width: (width - 32 - 10) / 2,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  areaCardActive: {borderColor: '#7C3AED', backgroundColor: '#F3E8FF'},
  areaCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  areaCardValue: {fontSize: 22, fontWeight: '800', color: '#111'},
  activeUnitBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  activeUnitBadgeTxt: {color: '#fff', fontSize: 10, fontWeight: '700'},

  infoBox: {
    width: '100%',
    backgroundColor: '#F3E8FF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B21B6',
    marginBottom: 8,
  },
  infoText: {fontSize: 13, color: '#4C1D95', lineHeight: 20},
});
