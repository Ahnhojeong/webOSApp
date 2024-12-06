import { useSetup } from '@/context/SetupContext';
import { setupSteps } from '@/utils/webos/serviceRequest';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const DeviceSetup: React.FC = () => {
  const { state, dispatch, handleSuccess, handleFailure } = useSetup();
  const navigate = useNavigate();
  const [searchStartTime] = useState<number>(Date.now());
  const [remainingTime, setRemainingTime] = useState<number>(300); // 남은 시간을 위한 state 추가

  // const checkDevices = useCallback(async () => {
  //   if (Date.now() - searchStartTime >= 300000) {
  //     dispatch({ type: 'SEARCH_TIMEOUT' });
  //     navigate('/fail');
  //     return;
  //   }

  //   window.webOS.service.request('luna://com.hojeong.app.service/', {
  //     method: 'udpClient/devices',
  //     parameters: {},
  //     onSuccess: (res: { devices: any[] }) => {
  //       if (res.devices && res.devices.length > 0) {
  //       }
  //       handleSuccess(1);
  //       dispatch({ type: 'DEVICE_FOUND' });
  //       navigate('/connectDevice');
  //     },
  //     onFailure: (err) => handleFailure(1, err),
  //   });
  // }, [handleFailure, handleSuccess, navigate, dispatch, searchStartTime]);

  // // UDP Start 요청
  // useEffect(() => {
  //   if (state.currentStep === 0) {
  //     window.webOS.service.request('luna://com.hojeong.app.service/', {
  //       method: 'udpClient/start',
  //       parameters: {},
  //       onSuccess: () => handleSuccess(0),
  //       onFailure: (err) => handleFailure(0, err),
  //     });
  //   }
  // }, [state.currentStep, handleSuccess, handleFailure]);

  // Device 검색 시작

  const checkDevices = useCallback(async () => {
    try {
      if (Date.now() - searchStartTime >= 300000) {
        dispatch({ type: 'SEARCH_TIMEOUT' });
        navigate('/fail');
        return;
      }

      const hasDevices = await setupSteps.checkDevices();
      if (hasDevices) {
        handleSuccess(1);
        dispatch({ type: 'DEVICE_FOUND' });
        navigate('/connectDevice');
      }
    } catch (err) {
      handleFailure(1, err);
    }
  }, [handleFailure, handleSuccess, navigate, dispatch, searchStartTime]);

  useEffect(() => {
    const initSetup = async () => {
      try {
        if (state.currentStep === 0) {
          await setupSteps.startUdp({
            onSuccess: (res) => {
              console.log('UDP Started:', res);
              handleSuccess(0);
            },
            onFailure: (err) => {
              console.error('UDP Start failed:', err);
              handleFailure(0, err);
            },
          });
        }
      } catch (err) {
        handleFailure(0, err);
      }
    };

    initSetup();
  }, [state.currentStep]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    // currentStep이 1이 되면 (UDP Start 성공 후) devices 검색 시작
    if (state.currentStep === 1 && !state.deviceFound) {
      interval = setInterval(() => {
        checkDevices();
      }, 3000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.currentStep, state.deviceFound, checkDevices]);

  // 타이머 업데이트를 위한 새로운 useEffect
  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;

    if (state.currentStep === 1 && !state.deviceFound) {
      timerInterval = setInterval(() => {
        const elapsed = Date.now() - searchStartTime;
        const remaining = Math.max(0, Math.floor((300000 - elapsed) / 1000));
        setRemainingTime(remaining);

        if (remaining === 0) {
          dispatch({ type: 'SEARCH_TIMEOUT' });
          navigate('/fail');
        }
      }, 1000);
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [
    state.currentStep,
    state.deviceFound,
    searchStartTime,
    dispatch,
    navigate,
  ]);

  return (
    <div className="p-4">
      <h2>Initial Setup</h2>
      <p>
        {state.currentStep === 0
          ? 'Starting UDP...'
          : 'Searching for devices...'}
      </p>
      {state.currentStep === 1 && (
        <p>Time remaining: {remainingTime} seconds</p>
      )}
      {state.error && <p className="text-red-500">{state.error}</p>}
    </div>
  );
};
