import {useNavigation, useRoute} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {API_BASE_URL} from '../config/api';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {
  Path,
  Circle,
  Ellipse,
  G,
  Rect,
  Defs,
  ClipPath,
} from 'react-native-svg';
import {formatIndianAmount} from '../utils/formatIndianAmount';

const {width} = Dimensions.get('window');

export default function PropertyBookDetails() {
  const route = useRoute();
  const {booking} = route.params;
  const navigation = useNavigation();
  const [propertyData, setPropertyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    getCustomer();
  }, [booking]);
  useEffect(() => {
    if (!booking?.seoSlug) return;

    const fetchPropertyData = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/frontend/propertyinfo/${booking?.seoSlug}`,
        );

        const data = await response.json();
        setPropertyData(data);
      } catch (error) {
        console.error('Error fetching property data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyData();
  }, [booking?.seoSlug]);

  const getCustomer = async () => {
    try {
      fetch(
        `${API_BASE_URL}/customerapp/enquiry/payment/get/${booking?.enquirerid}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ).then(res =>
        res.json().then(res => {
          setCustomerPayments(res);
          console.log(res, 'rrrr');
        }),
      );
    } catch (error) {
      console.error('Error fetching customer payment:', error);
    }
  };

  const calculateBalance = (payments, customer) => {
    const totalPaid = payments.reduce((sum, p) => sum + p?.paymentAmount, 0);
    const balance = customer?.dealamount - totalPaid;
    console.log(`Remaining balance: ₹${balance}`);
  };

  const parseAmount = val => (isNaN(Number(val)) ? 0 : parseFloat(val));

  const totalPaidAmount =
    parseAmount(booking?.tokenamount) +
    (Array.isArray(customerPayments)
      ? customerPayments.reduce(
          (sum, p) => sum + parseAmount(p?.paymentAmount),
          0,
        )
      : 0);

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator color={'#8A38F5'} />
      </View>
    );
  }
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#8A38F5" />
      <View style={styles.container}>
        {/* HEADER */}
        <LinearGradient
          colors={['#8A38F5', '#5E23DC']}
          start={{x: 0.5, y: 0}}
          end={{x: 0.5, y: 1}}
          style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 18L9 12L15 6"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          {/* Figma Ellipse Decorations */}
          <View style={styles.ellipse1} />
          <View style={styles.ellipse2} />
          <View style={styles.checkIcon}>
            <Svg width="50" height="50" viewBox="0 0 50 50" fill="none">
              <Circle cx="25" cy="25" r="25" fill="white" />
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M34.546 18.1111C34.8272 18.3924 34.9852 18.7738 34.9852 19.1716C34.9852 19.5693 34.8272 19.9508 34.546 20.2321L23.303 31.4751C23.1544 31.6237 22.978 31.7416 22.7839 31.822C22.5898 31.9024 22.3817 31.9438 22.1715 31.9438C21.9614 31.9438 21.7533 31.9024 21.5591 31.822C21.365 31.7416 21.1886 31.6237 21.04 31.4751L15.454 25.8901C15.3108 25.7517 15.1965 25.5862 15.1179 25.4032C15.0393 25.2202 14.9979 25.0233 14.9962 24.8242C14.9944 24.625 15.0324 24.4275 15.1078 24.2431C15.1832 24.0588 15.2946 23.8913 15.4354 23.7505C15.5763 23.6096 15.7438 23.4983 15.9281 23.4228C16.1124 23.3474 16.31 23.3095 16.5091 23.3112C16.7083 23.3129 16.9051 23.3543 17.0881 23.4329C17.2711 23.5115 17.4367 23.6258 17.575 23.7691L22.171 28.3651L32.424 18.1111C32.5633 17.9717 32.7287 17.8611 32.9108 17.7857C33.0928 17.7102 33.288 17.6714 33.485 17.6714C33.6821 17.6714 33.8772 17.7102 34.0593 17.7857C34.2413 17.8611 34.4067 17.9717 34.546 18.1111Z"
                fill="#5E23DC"
              />
            </Svg>
          </View>
          <Text style={styles.headerTitle}>Booking Confirmed!</Text>
          <Text style={styles.headerSubtitle}>
            Your property visit has been scheduled
          </Text>
        </LinearGradient>

        {/* Visit Details Card */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.card, {marginTop: -50, gap: 1}]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Visit Details</Text>
              <View style={styles.statusPillConfirmed}>
                <Text style={styles.statusTextConfirmed}>Confirmed</Text>
              </View>
            </View>

            {/* Customer Name */}
            <View style={styles.row}>
              <Svg
                width="28"
                height="29"
                viewBox="0 0 35 36"
                fill="none"
                xmlns="http://www.w3.org/2000/Svg">
                <Circle
                  cx="17.28"
                  cy="17.28"
                  r="16.78"
                  fill="white"
                  stroke="#8A38F5"
                />
                <Path
                  d="M17.28 15.4371C20.8589 15.4371 23.76 12.5359 23.76 8.95705C23.76 5.37825 20.8589 2.47705 17.28 2.47705C13.7012 2.47705 10.8 5.37825 10.8 8.95705C10.8 12.5359 13.7012 15.4371 17.28 15.4371Z"
                  fill="#5E23DC"
                />
                <Path
                  d="M33.3288 30.4275C32.6566 27.367 31.1153 24.5657 28.89 22.3599C28.3499 21.8178 27.7646 21.3229 27.1404 20.8803C24.2979 18.7481 20.8332 17.6096 17.28 17.6403C12.9353 17.618 8.75805 19.3145 5.65919 22.3599C3.43386 24.5657 1.89256 27.367 1.22039 30.4275C1.10356 30.9686 1.10987 31.5291 1.23886 32.0675C1.36785 32.6059 1.61621 33.1084 1.96559 33.5378C2.32742 33.9765 2.78305 34.3285 3.29893 34.5677C3.8148 34.807 4.37778 34.9274 4.94639 34.9202H29.6136C30.1839 34.9206 30.7469 34.7927 31.261 34.5459C31.7752 34.2991 32.2272 33.9398 32.5836 33.4947C32.9267 33.0702 33.1715 32.575 33.3003 32.0447C33.4292 31.5143 33.4389 30.962 33.3288 30.4275Z"
                  fill="#5E23DC"
                />
              </Svg>

              <View style={styles.rowText}>
                <Text style={styles.label}>Customer Name</Text>
                <Text style={styles.value}>{booking?.customer}</Text>
              </View>
            </View>

            {/* Contact Number */}
            <View style={styles.row}>
              <Svg
                width="28"
                height="29"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <Path
                  d="M16.5712 5.17061C15.9862 4.00136 14.7638 3.05561 13.2623 3.22286C11.919 3.37211 9.92475 3.87161 8.565 5.50961C7.16925 7.19186 6.64875 9.81536 7.7205 13.7461C8.865 17.9394 10.5645 22.0734 12.6773 25.4086C14.7743 28.7199 17.3573 31.3704 20.3205 32.3866C22.941 33.2851 24.945 32.9101 26.4068 31.9231C27.8168 30.9714 28.5907 29.5396 28.9913 28.5481C29.4398 27.4381 29.1443 26.2824 28.5592 25.4304L26.4015 22.2924C25.9248 21.599 25.2386 21.0765 24.4433 20.8016C23.6481 20.5266 22.7857 20.5137 21.9825 20.7646L19.0005 21.6969C18.9063 21.7289 18.8048 21.7328 18.7084 21.7078C18.612 21.6829 18.5251 21.6303 18.4583 21.5566C17.1308 20.0019 15.6435 17.8336 15.2393 15.6391C15.2263 15.5805 15.2351 15.5192 15.264 15.4666C15.7028 14.7294 16.458 13.8939 17.2088 13.1626C18.4815 11.9236 18.9638 9.95411 18.1238 8.27561L16.5712 5.17061Z"
                  fill="#5E23DC"
                />
              </Svg>

              <View style={styles.rowText}>
                <Text style={styles.label}>Contact Number</Text>
                <Text style={styles.value}>{booking?.contact}</Text>
              </View>
            </View>

            {/* Visit Date & Time */}
            <View style={styles.row}>
              <Svg
                width="28"
                height="29"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <Path
                  d="M12.75 21C13.2473 21 13.7242 20.8025 14.0758 20.4508C14.4275 20.0992 14.625 19.6223 14.625 19.125C14.625 18.6277 14.4275 18.1508 14.0758 17.7992C13.7242 17.4475 13.2473 17.25 12.75 17.25C12.2527 17.25 11.7758 17.4475 11.4242 17.7992C11.0725 18.1508 10.875 18.6277 10.875 19.125C10.875 19.6223 11.0725 20.0992 11.4242 20.4508C11.7758 20.8025 12.2527 21 12.75 21ZM12.75 26.25C13.2473 26.25 13.7242 26.0525 14.0758 25.7008C14.4275 25.3492 14.625 24.8723 14.625 24.375C14.625 23.8777 14.4275 23.4008 14.0758 23.0492C13.7242 22.6975 13.2473 22.5 12.75 22.5C12.2527 22.5 11.7758 22.6975 11.4242 23.0492C11.0725 23.4008 10.875 23.8777 10.875 24.375C10.875 24.8723 11.0725 25.3492 11.4242 25.7008C11.7758 26.0525 12.2527 26.25 12.75 26.25ZM19.875 19.125C19.875 19.6223 19.6775 20.0992 19.3258 20.4508C18.9742 20.8025 18.4973 21 18 21C17.5027 21 17.0258 20.8025 16.6742 20.4508C16.3225 20.0992 16.125 19.6223 16.125 19.125C16.125 18.6277 16.3225 18.1508 16.6742 17.7992C17.0258 17.4475 17.5027 17.25 18 17.25C18.4973 17.25 18.9742 17.4475 19.3258 17.7992C19.6775 18.1508 19.875 18.6277 19.875 19.125ZM18 26.25C18.4973 26.25 18.9742 26.0525 19.3258 25.7008C19.6775 25.3492 19.875 24.8723 19.875 24.375C19.875 23.8777 19.6775 23.4008 19.3258 23.0492C18.9742 22.6975 18.4973 22.5 18 22.5C17.5027 22.5 17.0258 22.6975 16.6742 23.0492C16.3225 23.4008 16.125 23.8777 16.125 24.375C16.125 24.8723 16.3225 25.3492 16.6742 25.7008C17.0258 26.0525 17.5027 26.25 18 26.25ZM25.125 19.125C25.125 19.6223 24.9275 20.0992 24.5758 20.4508C24.2242 20.8025 23.7473 21 23.25 21C22.7527 21 22.2758 20.8025 21.9242 20.4508C21.5725 20.0992 21.375 19.6223 21.375 19.125C21.375 18.6277 21.5725 18.1508 21.9242 17.7992C22.2758 17.4475 22.7527 17.25 23.25 17.25C23.7473 17.25 24.2242 17.4475 24.5758 17.7992C24.9275 18.1508 25.125 18.6277 25.125 19.125Z"
                  fill="#5E23DC"
                />
                <Path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M12 4.875C12.2984 4.875 12.5845 4.99353 12.7955 5.2045C13.0065 5.41548 13.125 5.70163 13.125 6V7.125H22.875V6C22.875 5.70163 22.9935 5.41548 23.2045 5.2045C23.4155 4.99353 23.7016 4.875 24 4.875C24.2984 4.875 24.5845 4.99353 24.7955 5.2045C25.0065 5.41548 25.125 5.70163 25.125 6V7.137C25.353 7.143 25.5655 7.154 25.7625 7.17C26.3325 7.215 26.8665 7.317 27.372 7.575C28.1483 7.97051 28.7795 8.60167 29.175 9.378C29.433 9.8835 29.535 10.4175 29.58 10.9875C29.625 11.535 29.625 12.2025 29.625 13.005V24.495C29.625 25.2975 29.625 25.965 29.58 26.5125C29.535 27.0825 29.433 27.6165 29.175 28.122C28.7799 28.8981 28.1493 29.5292 27.3735 29.925C26.8665 30.183 26.3325 30.285 25.7625 30.33C25.215 30.375 24.5475 30.375 23.7465 30.375H12.255C11.4525 30.375 10.785 30.375 10.2375 30.33C9.6675 30.285 9.1335 30.183 8.628 29.925C7.85213 29.5303 7.22102 28.9002 6.825 28.125C6.567 27.618 6.465 27.084 6.42 26.514C6.375 25.9665 6.375 25.299 6.375 24.498V13.005C6.375 12.2025 6.375 11.535 6.42 10.9875C6.465 10.4175 6.567 9.8835 6.825 9.378C7.22051 8.60167 7.85167 7.97051 8.628 7.575C9.1335 7.317 9.6675 7.215 10.2375 7.17C10.4345 7.154 10.647 7.143 10.875 7.137V6C10.875 5.85226 10.9041 5.70597 10.9606 5.56948C11.0172 5.43299 11.1 5.30897 11.2045 5.2045C11.309 5.10004 11.433 5.01717 11.5695 4.96064C11.706 4.9041 11.8523 4.875 12 4.875ZM10.875 9.75V9.387C10.7233 9.39167 10.5718 9.40017 10.4205 9.4125C9.99 9.447 9.7845 9.51 9.6495 9.579C9.29612 9.75886 9.00886 10.0461 8.829 10.3995C8.76 10.5345 8.697 10.74 8.6625 11.1705C8.6265 11.6145 8.625 12.1905 8.625 13.05V13.875H27.375V13.05C27.375 12.192 27.375 11.6145 27.3375 11.1705C27.303 10.74 27.24 10.5345 27.171 10.3995C26.9911 10.0461 26.7039 9.75886 26.3505 9.579C26.2155 9.51 26.01 9.447 25.578 9.4125C25.4272 9.40019 25.2762 9.39169 25.125 9.387V9.75C25.125 10.0484 25.0065 10.3345 24.7955 10.5455C24.5845 10.7565 24.2984 10.875 24 10.875C23.7016 10.875 23.4155 10.7565 23.2045 10.5455C22.9935 10.3345 22.875 10.0484 22.875 9.75V9.375H13.125V9.75C13.125 10.0484 13.0065 10.3345 12.7955 10.5455C12.5845 10.7565 12.2984 10.875 12 10.875C11.7016 10.875 11.4155 10.7565 11.2045 10.5455C10.9935 10.3345 10.875 10.0484 10.875 9.75ZM27.375 15.375H8.625V24.45C8.625 25.308 8.625 25.8855 8.6625 26.328C8.697 26.76 8.76 26.9655 8.829 27.1005C9.009 27.4545 9.2955 27.741 9.6495 27.921C9.7845 27.99 9.99 28.053 10.4205 28.0875C10.8645 28.1235 11.4405 28.125 12.3 28.125H23.7C24.558 28.125 25.1355 28.125 25.578 28.0875C26.01 28.053 26.2155 27.99 26.3505 27.921C26.7039 27.7411 26.9911 27.4539 27.171 27.1005C27.24 26.9655 27.303 26.76 27.3375 26.328C27.3735 25.8855 27.375 25.308 27.375 24.45V15.375Z"
                  fill="#5E23DC"
                />
                <Path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M14.625 11.625C14.625 11.3266 14.7435 11.0405 14.9545 10.8295C15.1655 10.6185 15.4516 10.5 15.75 10.5H20.25C20.5484 10.5 20.8345 10.6185 21.0455 10.8295C21.2565 11.0405 21.375 11.3266 21.375 11.625C21.375 11.9234 21.2565 12.2095 21.0455 12.4205C20.8345 12.6315 20.5484 12.75 20.25 12.75H15.75C15.4516 12.75 15.1655 12.6315 14.9545 12.4205C14.7435 12.2095 14.625 11.9234 14.625 11.625Z"
                  fill="#5E23DC"
                />
              </Svg>

              <View style={styles.rowText}>
                <Text style={styles.label}>Booking Date & Time</Text>
                <Text style={styles.value}>{booking?.created_at}</Text>
              </View>
            </View>

            {/* Property */}
            <View style={styles.row}>
              <Svg
                width="28"
                height="29"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <Path
                  d="M31.5 28.5H34.5V31.5H1.5V28.5H4.5V6C4.5 5.60218 4.65804 5.22064 4.93934 4.93934C5.22064 4.65804 5.60218 4.5 6 4.5H21C21.3978 4.5 21.7794 4.65804 22.0607 4.93934C22.342 5.22064 22.5 5.60218 22.5 6V28.5H25.5V13.5H30C30.3978 13.5 30.7794 13.658 31.0607 13.9393C31.342 14.2206 31.5 14.6022 31.5 15V28.5ZM10.5 16.5V19.5H16.5V16.5H10.5ZM10.5 10.5V13.5H16.5V10.5H10.5Z"
                  fill="#5E23DC"
                />
              </Svg>

              <View style={styles.rowText}>
                <Text style={styles.label}>Property</Text>
                <Text style={styles.value}>{propertyData?.propertyName}</Text>
                <Text style={styles.subValue} allowFontScaling={true}>
                  {propertyData?.city}, {propertyData?.state} –{' '}
                  {propertyData?.pincode}
                </Text>
              </View>
            </View>
            <View
              style={{
                alignItems: 'center',
                width: '100%',
                height: 1,
                backgroundColor: '#D9D9D9',
              }}
            />

            {/* Channel Partner */}
            <View style={[styles.row, {marginTop: 10}]}>
              <View
                style={{
                  backgroundColor: '#DBF1FF',
                  padding: 6,
                  borderRadius: 50,
                }}>
                <Svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <Path
                    d="M11 6.0001H14L17.29 2.7001C17.3829 2.60637 17.4935 2.53197 17.6154 2.4812C17.7373 2.43044 17.868 2.4043 18 2.4043C18.132 2.4043 18.2627 2.43044 18.3846 2.4812C18.5064 2.53197 18.617 2.60637 18.71 2.7001L21.29 5.2901C21.4762 5.47746 21.5808 5.73091 21.5808 5.9951C21.5808 6.25928 21.4762 6.51273 21.29 6.7001L19 9.0001H11V11.0001C11 11.2653 10.8946 11.5197 10.7071 11.7072C10.5196 11.8947 10.2652 12.0001 9.99998 12.0001C9.73477 12.0001 9.48041 11.8947 9.29288 11.7072C9.10534 11.5197 8.99998 11.2653 8.99998 11.0001V8.0001C8.99998 7.46966 9.2107 6.96095 9.58577 6.58588C9.96084 6.21081 10.4695 6.0001 11 6.0001ZM4.99998 11.0001V15.0001L2.70998 17.2901C2.52373 17.4775 2.41919 17.7309 2.41919 17.9951C2.41919 18.2593 2.52373 18.5127 2.70998 18.7001L5.28998 21.2901C5.38295 21.3838 5.49355 21.4582 5.61541 21.509C5.73726 21.5598 5.86797 21.5859 5.99998 21.5859C6.13199 21.5859 6.2627 21.5598 6.38456 21.509C6.50642 21.4582 6.61702 21.3838 6.70998 21.2901L11 17.0001H15C15.2652 17.0001 15.5196 16.8947 15.7071 16.7072C15.8946 16.5197 16 16.2653 16 16.0001V15.0001H17C17.2652 15.0001 17.5196 14.8947 17.7071 14.7072C17.8946 14.5197 18 14.2653 18 14.0001V13.0001H19C19.2652 13.0001 19.5196 12.8947 19.7071 12.7072C19.8946 12.5197 20 12.2653 20 12.0001V11.0001H13V12.0001C13 12.5305 12.7893 13.0392 12.4142 13.4143C12.0391 13.7894 11.5304 14.0001 11 14.0001H8.99998C8.46955 14.0001 7.96084 13.7894 7.58577 13.4143C7.2107 13.0392 6.99998 12.5305 6.99998 12.0001V9.0001L4.99998 11.0001Z"
                    fill="#0099FF"
                  />
                </Svg>
              </View>

              <View style={styles.rowText}>
                <Text style={styles.label}>Territory Partner</Text>
                <Text style={styles.value}>{booking?.territoryName}</Text>
                <Text style={styles.subValue}>
                  Partner ID: REPARV{booking?.territorypartnerid}
                </Text>
              </View>
            </View>
          </View>

          {/* <ScrollView contentContainerStyle={styles.scrollContent}> */}
          <View>
            {/* PAYMENT SUMMARY CARD */}
            <View style={[styles.card, {gap: 8, padding: 0}]}>
              <View style={styles.titleRow}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M11.005 2L18.303 4.28C18.5065 4.34354 18.6844 4.47048 18.8107 4.64229C18.937 4.81409 19.0051 5.02177 19.005 5.235V7H21.005C21.2702 7 21.5246 7.10536 21.7121 7.29289C21.8996 7.48043 22.005 7.73478 22.005 8V10H9.005V8C9.005 7.73478 9.11036 7.48043 9.2979 7.29289C9.48543 7.10536 9.73979 7 10.005 7H17.005V5.97L11.005 4.094L5.005 5.97V13.374C5.00486 13.9862 5.14525 14.5903 5.41537 15.1397C5.68548 15.6892 6.07811 16.1692 6.563 16.543L6.752 16.679L11.005 19.579L14.787 17H10.005C9.73979 17 9.48543 16.8946 9.2979 16.7071C9.11036 16.5196 9.005 16.2652 9.005 16V12H22.005V16C22.005 16.2652 21.8996 16.5196 21.7121 16.7071C21.5246 16.8946 21.2702 17 21.005 17L17.785 17.001C17.398 17.511 16.928 17.961 16.385 18.331L11.005 22L5.625 18.332C4.81753 17.7815 4.15676 17.042 3.70014 16.1779C3.24353 15.3138 3.0049 14.3513 3.005 13.374V5.235C3.00513 5.02194 3.07329 4.81449 3.19957 4.64289C3.32584 4.47128 3.50363 4.34449 3.707 4.281L11.005 2Z"
                    fill="#5E23DC"
                  />
                </Svg>

                <Text style={styles.cardTitle}>Payment Summary</Text>
              </View>

              <View style={[styles.summaryRow, {paddingHorizontal: 10}]}>
                <Text style={styles.summaryLabel}>Deal Amount</Text>
                <Text style={styles.summaryValue}>
                  ₹{formatIndianAmount(booking?.dealamount)}
                </Text>
              </View>
              <View
                style={{
                  alignItems: 'center',
                  width: '100%',
                  height: 1, // height for the divider line

                  backgroundColor: '#D9D9D9', // border color equivalent
                }}
              />
              <View style={[styles.summaryRow, {paddingHorizontal: 10}]}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.summaryLabel}>Token Paid</Text>

                  {/* Rectangle 207 Badge */}
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidBadgeText}>Paid</Text>
                  </View>
                </View>

                <Text style={[styles.summaryValue, {color: '#6D28D9'}]}>
                  ₹{formatIndianAmount(booking?.tokenamount)}
                </Text>
              </View>

              <View style={[styles.summaryRow, {paddingHorizontal: 10}]}>
                <Text style={styles.summaryLabel}>
                  Total Paid Amount {'\n'} with Token
                </Text>
                <Text style={styles.summaryValue}>
                  ₹{formatIndianAmount(totalPaidAmount)}
                </Text>
              </View>
              <View
                style={[
                  styles.summaryRow,
                  {
                    backgroundColor: '#EFE7FF',
                    paddingVertical: 10,
                    paddingHorizontal: 10,
                  },
                ]}>
                <Text style={styles.summaryLabel}>Remaining Balance</Text>
                <Text style={[styles.summaryValue, {color: '#6D28D9'}]}>
                  ₹
                  {formatIndianAmount(
                    parseAmount(booking?.dealamount) -
                      (parseAmount(booking?.tokenamount) +
                        customerPayments.reduce(
                          (sum, p) => sum + parseAmount(p?.paymentAmount),
                          0,
                        )),
                  )}
                </Text>
              </View>

              <View style={styles.noteBox}>
                <Svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <G clip-path="url(#clip0_3604_421)">
                    <Path
                      d="M8.00004 14.6668C11.6819 14.6668 14.6667 11.6821 14.6667 8.00016C14.6667 4.31826 11.6819 1.3335 8.00004 1.3335C4.31814 1.3335 1.33337 4.31826 1.33337 8.00016C1.33337 11.6821 4.31814 14.6668 8.00004 14.6668Z"
                      stroke="#FFAB00"
                      stroke-width="2"
                    />
                    <Path
                      d="M8 4.66699H8.00667"
                      stroke="#FFAB00"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                    <Path
                      d="M6.66675 7.3335H8.00008V10.6668M6.66675 10.6668H9.33341"
                      stroke="#FFAB00"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </G>
                  <Defs>
                    <ClipPath id="clip0_3604_421">
                      <Rect width="16" height="16" fill="white" />
                    </ClipPath>
                  </Defs>
                </Svg>

                <Text style={styles.noteText}>
                  Payment schedule will be shared by your channel partner within
                  24 hours.
                </Text>
              </View>
            </View>

            {/* PAYMENT STATUS CARD */}

            {customerPayments.length > 0 &&
              customerPayments.map(d => {
                return (
                  <>
                    <View style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Payment Status</Text>
                        <View style={styles.statusPillConfirmed}>
                          <Text style={styles.statusTextConfirmed}>
                            Success
                          </Text>
                        </View>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Payment Method</Text>
                        <Text style={styles.summaryValue}>{d?.paymentTyp}</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Paid Amount</Text>
                        <Text style={styles.summaryValue}>
                          ₹{formatIndianAmount(d?.paymentAmount)}
                        </Text>
                      </View>

                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Date & Time</Text>
                        <Text style={styles.summaryValue}>{d?.created_at}</Text>
                      </View>

                      <TouchableOpacity>
                        <Text style={styles.downloadReceipt}>
                          Download Receipt ⬇
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                );
              })}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                navigation.goBack();
              }}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  header: {
    backgroundColor: '#8A38F5',
    paddingVertical: 50,
    alignItems: 'center',

    // overflow: 'hidden',
  },
  checkIcon: {marginBottom: 12},
  headerTitle: {fontSize: 20, fontWeight: '700', color: '#fff'},
  headerSubtitle: {fontSize: 14, color: '#fff', marginTop: 4},
  backButton: {
    position: 'absolute',
    top: 40, // adjust for StatusBar
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)', // optional glass effect
  },

  // Figma-style ellipses
  ellipse1: {
    position: 'absolute',
    width: 124,
    height: 118,
    borderRadius: 124 / 2,
    backgroundColor: 'white',
    opacity: 0.2,
    top: -23,
    left: 288,
  },
  ellipse2: {
    position: 'absolute',
    width: 72,
    height: 89,
    borderRadius: 62 / 2,
    backgroundColor: 'white',
    opacity: 0.2,
    bottom: -30,
    left: -10,
  },

  scrollContent: {
    padding: 16,
    marginTop: 30,
    paddingBottom: 50,
    zIndex: 1000,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center', //vertical alignment
    marginBottom: 12,
    marginTop: 10,
    marginInline: 10,
    gap: 6,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 10, // spacing between icon & text
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    zIndex: 1000,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusPillConfirmed: {
    backgroundColor: '#C6FFDB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusTextConfirmed: {
    color: '#16A34A',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    gap: 8,
  },
  rowText: {
    marginLeft: 8,
    flex: 1, // THIS FIXES CUTTING
  },

  label: {
    fontSize: 12,
    color: '#6B7280',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
  },
  subValue: {
    fontSize: 12,
    color: '#9CA3AF',
    flexShrink: 1,
    flexWrap: 'wrap',
  },

  paidBadge: {
    width: 50,
    height: 21,
    backgroundColor: '#EFE7FF',
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  paidBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5E23DC',
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#374151',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  noteBox: {
    flexDirection: 'row',
    width: '100%',
    gap: 5,
    minHeight: 68,
    backgroundColor: '#FFFCF5',
    borderWidth: 1,
    borderColor: '#FFBC33',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    justifyContent: 'center',
  },

  noteText: {
    color: '#FFAB00', // closer to Figma warning text
    fontSize: 12,

    flexWrap: 'wrap',
  },

  downloadReceipt: {
    color: '#6D28D9',
    fontWeight: '700',
    marginTop: 12,
  },
  closeBtn: {
    backgroundColor: '#6D28D9',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  closeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
