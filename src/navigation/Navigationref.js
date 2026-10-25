import {createNavigationContainerRef} from '@react-navigation/native';

// Shared navigation ref — used by notification handlers in App.js
// to navigate from outside the component tree
export const navigationRef = createNavigationContainerRef();
