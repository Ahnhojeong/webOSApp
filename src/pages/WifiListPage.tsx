import { useSetup } from '@/context/SetupContext';
import { setupSteps } from '@/utils/webos/serviceRequest';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const WifiListPage: React.FC = () => {
  // const { state, handleSuccess, handleFailure, dispatch } = useSetup();
  // const navigate = useNavigate();

  // useEffect(() => {
  //   const completeSetup = async () => {
  //     try {
  //       // 6단계: Set WiFi
  //       window.webOS.service.request('luna://com.hojeong.app.service/', {
  //         method: 'tcpClient/sendPacketSetWifi',
  //         parameters: {
  //           encryption: 'on',
  //           ssid: 'QED_OFFICE_2.4GHz',
  //           password: 'qedoffice1234',
  //           type: 1,
  //         },
  //         onSuccess: () => {
  //           handleSuccess(6); // Set WiFi 성공 (6 → 7)

  //           // 7단계: Disconnect device
  //           window.webOS.service.request('luna://com.hojeong.app.service/', {
  //             method: 'device/disconnect',
  //             parameters: {},
  //             onSuccess: () => {
  //               handleSuccess(7); // Disconnect 성공 (7 → 8)

  //               // 8단계: Connect device
  //               window.webOS.service.request(
  //                 'luna://com.hojeong.app.service/',
  //                 {
  //                   method: 'device/connect',
  //                   parameters: {},
  //                   onSuccess: () => {
  //                     handleSuccess(8); // Connect 성공 (8 → 9)
  //                     dispatch({ type: 'COMPLETE_SETUP' });
  //                     navigate('/success');
  //                   },
  //                   onFailure: (err) => handleFailure(8, err),
  //                 },
  //               );
  //             },
  //             onFailure: (err) => handleFailure(7, err),
  //           });
  //         },
  //         onFailure: (err) => handleFailure(6, err),
  //       });
  //     } catch (err) {
  //       handleFailure(state.currentStep, err);
  //     }
  //   };
  //   if (state.wifiListReceived) {
  //     completeSetup();
  //   }
  // }, [state.wifiListReceived]);

  const { state, handleSuccess, handleFailure, dispatch } = useSetup();
  const navigate = useNavigate();

  const completeSetup = async () => {
    try {
      await setupSteps.setWifi({
        parameters: {
          ssid: 'QED_OFFICE_2.4GHz',
          password: 'qedoffice1234',
          encryption: 'on',
        },
        onSuccess: (res) => {
          console.log('setWifi success res -> ', res);
        },
        onFailure: (err) => {
          console.log('setWifi fail err -> ', err);
        },
      });
      handleSuccess(6);

      await setupSteps.disconnectDevice({
        onSuccess: (res) => {
          console.log('disconnectDevice success res -> ', res);
        },
        onFailure: (err) => {
          console.log('disconnectDevice fail err -> ', err);
        },
      });
      handleSuccess(7);

      await setupSteps.connectDevice({
        onSuccess: (res) => {
          console.log('connectDevice success res -> ', res);
        },
        onFailure: (err) => {
          console.log('connectDevice fail err -> ', err);
        },
      });
      handleSuccess(8);

      dispatch({ type: 'COMPLETE_SETUP' });
      navigate('/success');
    } catch (err) {
      handleFailure(state.currentStep, err);
    }
  };

  useEffect(() => {
    if (state.wifiListReceived) {
      completeSetup();
    }
  }, [state.wifiListReceived]);

  return (
    <div className="p-4">
      <h2>WiFi Setup</h2>
      <p>Configuring WiFi settings...</p>
      {state.error && <p className="text-red-500">{state.error}</p>}
    </div>
  );
};
