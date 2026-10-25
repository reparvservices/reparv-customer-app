import {configureStore} from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import {tuyaApi} from '../features/tuya/tuyaApiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [tuyaApi.reducerPath]: tuyaApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(tuyaApi.middleware),
});
