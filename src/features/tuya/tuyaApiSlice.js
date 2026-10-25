import {createApi, fakeBaseQuery} from '@reduxjs/toolkit/query/react';
import {fetchMicroDevice, logTuyaApiError, postMicroDeviceSwitch} from '../../services/tuyaApi';

export const tuyaApi = createApi({
  reducerPath: 'tuyaApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['TuyaDevice'],
  keepUnusedDataFor: 120,
  endpoints: builder => ({
    getMicroDevice: builder.query({
      async queryFn() {
        try {
          const data = await fetchMicroDevice();
          return {data};
        } catch (e) {
          logTuyaApiError('rtk.getMicroDevice', e, {});
          return {
            error: {
              status: typeof e.code === 'number' ? e.code : 'TUYA_ERROR',
              data: {
                message: e.message,
                code: e.code,
                hint: e.hint,
                details: e.details,
              },
            },
          };
        }
      },
      providesTags: ['TuyaDevice'],
    }),

    postMicroDeviceSwitch: builder.mutation({
      async queryFn({on}) {
        try {
          const data = await postMicroDeviceSwitch(on);
          return {data};
        } catch (e) {
          logTuyaApiError('rtk.postMicroDeviceSwitch', e, {});
          return {
            error: {
              status: typeof e.code === 'number' ? e.code : 'TUYA_ERROR',
              data: {
                message: e.message,
                code: e.code,
                hint: e.hint,
                details: e.details,
              },
            },
          };
        }
      },
      invalidatesTags: ['TuyaDevice'],
    }),
  }),
});

export const {useGetMicroDeviceQuery, usePostMicroDeviceSwitchMutation} = tuyaApi;
