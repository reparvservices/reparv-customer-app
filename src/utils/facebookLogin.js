import {LoginManager, AccessToken} from 'react-native-fbsdk-next';
import auth from '@react-native-firebase/auth';

export const facebookLogin = async () => {
  try {
    // Always logout first to avoid cached sessions
    await LoginManager.logOut();

    // Trigger Facebook Login
    const result = await LoginManager.logInWithPermissions([
      'public_profile',
      'email',
    ]);

    if (result.isCancelled) {
      throw new Error('Facebook login cancelled by user');
    }

    // Get Facebook access token
    const data = await AccessToken.getCurrentAccessToken();

    if (!data?.accessToken) {
      throw new Error('Facebook access token not found');
    }

    // Create Firebase credential
    const facebookCredential = auth.FacebookAuthProvider.credential(
      data.accessToken,
    );

    // Sign in to Firebase
    const userCredential = await auth().signInWithCredential(
      facebookCredential,
    );

    const user = userCredential.user;

    // 🔥 Return ONLY required fields (backend-friendly)
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  } catch (error) {
    console.error(' [FACEBOOK LOGIN ERROR]', error);
    throw error;
  }
};
