import {API_BASE_URL} from '../config/api';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {Alert} from 'react-native';

// export const googleLogin = async () => {
//   try {
//     //  Check Play Services
//     await GoogleSignin.hasPlayServices({
//       showPlayServicesUpdateDialog: true,
//     });

//     //  Start Sign-In
//     const userInfo = await GoogleSignin.signIn();

//     console.log('Google User Info:', userInfo);

//     // ❗ IMPORTANT: idToken must exist
//     if (!userInfo.idToken) {
//       throw new Error('No ID Token received');
//     }

//     //  Send idToken to backend
//     const res = await fetch(
//       `${API_BASE_URL}/customerapp/user/google-login`,
//       {
//         method: 'POST',
//         headers: {'Content-Type': 'application/json'},
//         body: JSON.stringify({
//           idToken: userInfo.idToken,
//         }),
//       },
//     );

//     const data = await res.json();
//     return data;

//   } catch (error) {
//     console.log('Google Sign-In Error:', error);

//     if (error.code === statusCodes.SIGN_IN_CANCELLED) {
//       Alert.alert('Cancelled', 'Sign-in cancelled');
//     } else if (error.code === statusCodes.IN_PROGRESS) {
//       Alert.alert('In Progress', 'Sign-in already in progress');
//     } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
//       Alert.alert('Error', 'Play Services not available');
//     } else {
//       Alert.alert('Error', error.message || 'Google Sign-In failed');
//     }

//     throw error;
//   }
// };
