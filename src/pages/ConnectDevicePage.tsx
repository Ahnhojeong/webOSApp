import { useSetup } from '@/context/SetupContext';
import { setupSteps } from '@/utils/webos/serviceRequest';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ConnectDevicePage.tsx
export const ConnectDevicePage: React.FC = () => {
  // const { state, handleSuccess, dispatch, handleFailure } = useSetup();
  // const navigate = useNavigate();

  // useEffect(() => {
  //   const executeSteps = async () => {
  //     try {
  //       // 2단계: TCP Client Start
  //       window.webOS.service.request('luna://com.hojeong.app.service/', {
  //         method: 'tcpClient/start',
  //         parameters: {},
  //         onSuccess: () => {
  //           handleSuccess(2); // TCP Start 성공 (2 → 3)

  //           // 3단계: Packet Init
  //           window.webOS.service.request('luna://com.hojeong.app.service/', {
  //             method: 'tcpClient/sendPacketInit',
  //             parameters: {},
  //             onSuccess: () => {
  //               handleSuccess(3); // Packet Init 성공 (3 → 4)

  //               // 4단계: Set WiFi List
  //               window.webOS.service.request(
  //                 'luna://com.hojeong.app.service/',
  //                 {
  //                   method: 'tcpClient/sendPacketSetWifilist',
  //                   parameters: {},
  //                   onSuccess: () => {
  //                     handleSuccess(4); // Set WiFi List 성공 (4 → 5)

  //                     // 5단계: Get WiFi List
  //                     window.webOS.service.request(
  //                       'luna://com.hojeong.app.service/',
  //                       {
  //                         method: 'tcpClient/sendPacketGetWifilist',
  //                         parameters: {},
  //                         onSuccess: () => {
  //                           handleSuccess(5); // Get WiFi List 성공 (5 → 6)
  //                           dispatch({ type: 'WIFI_LIST_RECEIVED' });
  //                           navigate('/wifilist');
  //                         },
  //                         onFailure: (err) => handleFailure(5, err),
  //                       },
  //                     );
  //                   },
  //                   onFailure: (err) => handleFailure(4, err),
  //                 },
  //               );
  //             },
  //             onFailure: (err) => handleFailure(3, err),
  //           });
  //         },
  //         onFailure: (err) => handleFailure(2, err),
  //       });
  //     } catch (err) {
  //       handleFailure(state.currentStep, err);
  //     }
  //   };

  //   executeSteps();
  // }, []);

  const { state, handleSuccess, handleFailure } = useSetup();
  const navigate = useNavigate();

  const executeSteps = async () => {
    try {
      await setupSteps.startTcpClient({
        onSuccess: (res) => {
          console.log('startTcpClient success res -> ', res);
        },
        onFailure: (err) => {
          console.log('startTcpClient fail err -> ', err);
        },
      });
      handleSuccess(2);

      await setupSteps.initPacket({
        onSuccess: (res) => {
          console.log('initPacket success res -> ', res);
        },
        onFailure: (err) => {
          console.log('initPacket fail err -> ', err);
        },
      });
      handleSuccess(3);

      await setupSteps.setWifiList({
        onSuccess: (res) => {
          console.log('setWifiList success res -> ', res);
        },
        onFailure: (err) => {
          console.log('setWifiList fail err -> ', err);
        },
      });
      handleSuccess(4);

      await setupSteps.getWifiList({
        onSuccess: (res) => {
          console.log('getWifiList success res -> ', res);
        },
        onFailure: (err) => {
          console.log('getWifiList fail err -> ', err);
        },
      });
      handleSuccess(5);

      navigate('/wifilist');
    } catch (err) {
      handleFailure(state.currentStep, err);
    }
  };

  useEffect(() => {
    executeSteps();
  }, []);

  return (
    <div className="p-4">
      <h2>Connecting to Device</h2>
      <p>Setting up connection...</p>
      {state.error && <p className="text-red-500">{state.error}</p>}
    </div>
  );
};
