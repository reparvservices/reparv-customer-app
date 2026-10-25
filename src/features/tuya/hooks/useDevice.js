import {useCallback, useMemo} from 'react';
import {devWarn} from '../../../utils/devLog';
import {isTuyaConfigured} from '../../../services/tuyaApi';
import {useGetMicroDeviceQuery, usePostMicroDeviceSwitchMutation} from '../tuyaApiSlice';

const statusValue = (statusList, code) =>
  statusList?.find(item => item.code === code)?.value;

const parseSwitchOn = statusList => {
  const raw =
    statusValue(statusList, 'switch') ?? statusValue(statusList, 'switch_1');
  if (raw === true || raw === 1) {
    return true;
  }
  if (raw === false || raw === 0) {
    return false;
  }
  const s = String(raw ?? '').toLowerCase();
  if (s === 'true' || s === '1' || s === 'on') {
    return true;
  }
  if (s === 'false' || s === '0' || s === 'off') {
    return false;
  }
  return false;
};

function toAppError(rtkError) {
  if (!rtkError) {
    return null;
  }
  const data = rtkError.data || {};
  const err = new Error(
    data.message || rtkError.error || rtkError.message || 'Request failed',
  );
  err.code = data.code ?? rtkError.status;
  err.details = data.details;
  if (data.hint) {
    err.hint = data.hint;
  }
  return err;
}

export default function useDevice({polling = true, interval = 45000} = {}) {
  const configured = isTuyaConfigured();
  const {
    data: device,
    error: queryError,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetMicroDeviceQuery(undefined, {
    skip: !configured,
    pollingInterval: polling && configured ? interval : 0,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const [postSwitch, {isLoading: isToggling}] =
    usePostMicroDeviceSwitchMutation();

  const error = !configured
    ? toAppError({
        data: {
          message: 'Smart breaker is not configured.',
          code: 'TUYA_NOT_CONFIGURED',
          hint: 'Add Tuya credentials in src/config/tuya.user.js (see tuya.user.sample.js).',
        },
      })
    : isError
      ? toAppError(queryError)
      : null;

  const loading = (configured && isLoading && !device) || isToggling;
  const refreshing = isFetching && !isLoading;

  const {online, switchOn, connectionState} = useMemo(() => {
    const statusList = Array.isArray(device?.status) ? device.status : [];
    let isOnline = false;
    if (device) {
      if (typeof device.online === 'boolean') {
        isOnline = device.online;
      } else {
        const os = statusValue(statusList, 'online_state');
        if (os != null && os !== '') {
          isOnline = String(os).toLowerCase() === 'online';
        }
      }
    }

    const nextConnectionState = error
      ? 'error'
      : !device
        ? 'unknown'
        : isOnline
          ? 'online'
          : 'offline';

    return {
      online: isOnline,
      switchOn: parseSwitchOn(statusList),
      connectionState: nextConnectionState,
    };
  }, [device, error]);

  const toggle = useCallback(
    async next => {
      if (!configured) {
        return;
      }
      try {
        await postSwitch({on: next}).unwrap();
      } catch (e) {
        devWarn('[useDevice.toggle]', e?.message || e);
      }
    },
    [configured, postSwitch],
  );

  return {
    device,
    loading,
    refreshing,
    error,
    refresh: refetch,
    toggle,
    online,
    switchOn,
    connectionState,
  };
}
