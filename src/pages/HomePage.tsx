import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCallback, useEffect, useRef, useState } from 'react';

const WS_URL = 'ws://localhost:9000'; // Websocket URL (Port를 제외한 IP는 webOS 기기의 IP를 입력해주세요.)

const HomePage = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [res, setRes] = useState<{ returnValue: boolean; message: string }>(); // JS-service Sample
  const [resNotify, setResNotify] = useState<{
    returnValue: boolean;
    message: string;
  }>();
  const [value, setValue] = useState<string>(''); // JS-service request params Sample

  const onChangeValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  function showSuccess(res: { returnValue: boolean; data: string }) {
    console.log('showSuccess res -> ', res);
    setRes({
      returnValue: res.returnValue,
      message: res.data,
    });
    return res;
  }

  function showSuccessNotify(res: { returnValue: boolean; data: string }) {
    console.log('showSuccessNotify res -> ', res);
    setResNotify({
      returnValue: res.returnValue,
      message: res.data,
    });
    return res;
  }

  function showFailure(err: {
    errorCode: number;
    errorText: string;
    returnValue: boolean;
  }) {
    console.log('showFailure err -> ', err);
    setRes({
      returnValue: err.returnValue,
      message: err.errorText,
    });
    return err;
  }

  function showFailureNotify(err: {
    errorCode: number;
    errorText: string;
    returnValue: boolean;
  }) {
    console.log('showFailure err -> ', err);
    setResNotify({
      returnValue: err.returnValue,
      message: err.errorText,
    });
    return err;
  }

  const callJsService = (value: string) => {
    window.webOS.service.request('luna://com.hojeong.app.service/', {
      method: 'hello',
      parameters: { name: value },
      onFailure: showFailure,
      onSuccess: showSuccess,
    });
  };

  const ws = useRef<null | WebSocket>(null);
  const [wsOpen, setWsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (wsOpen) {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log('1. webOS websocket open', ws.current?.readyState);
        if (ws.current && ws.current.readyState === 1) {
          ws.current.onmessage = (event: MessageEvent) => {
            console.log('1-1. webOS websocket message -> ', event.data);
          };
        }
      };

      ws.current.onclose = () => {
        console.log('2. webOS websocket close');
      };

      return () => {
        if (ws.current) {
          ws.current.close();
        }
      };
    }
  }, [wsOpen]);

  const callService = useRef<any>(null);

  const serviceOn = useCallback(() => {
    console.log('call websocket server open');
    callService.current = window.webOS.service.request(
      'luna://com.hojeong.app.service/',
      {
        method: 'serviceOn',
        parameters: {},
        onFailure: (err) => {
          console.log('serviceOn error ::', err);
        },
        onSuccess: (res: { reply: string }) => {
          console.log('serviceOn res ::', res);
          setWsOpen(true);
        },
        subscribe: true,
      },
    );
  }, []);

  const serviceOff = useCallback(() => {
    if (callService.current) {
      console.log('cancel websocket server');
      callService.current.cancel();

      window.webOS.service.request('luna://com.hojeong.app.service/', {
        method: 'serviceOff',
        parameters: {},
        onFailure: (err) => {
          console.log('serviceOff error ::', err);
        },
        onSuccess: (res) => {
          console.log('serviceOff res ::', res);
          setWsOpen(false);
        },
      });
    }
  }, [callService]);

  useEffect(() => {
    // 사전 준비 사항이 완료되었다는 전제로 EYEMINI 연결 동작을 진행
    serviceOn();
  }, [serviceOn]);

  const callJsServiceUdp = (value: string) => {
    window.webOS.service.request('luna://com.hojeong.app.service/', {
      method: 'udpClient/' + value,
      parameters: {},
      onFailure: showFailure,
      onSuccess: showSuccess,
    });
  };
  const callJsServiceTcp = (value: string) => {
    window.webOS.service.request('luna://com.hojeong.app.service/', {
      method: 'tcpClient/' + value,
      parameters: {},
      onFailure: showFailure,
      onSuccess: showSuccess,
    });
  };
  const callJsServiceDevice = (value: string) => {
    window.webOS.service.request('luna://com.hojeong.app.service/', {
      method: 'device/' + value,
      parameters: {},
      onFailure: showFailure,
      onSuccess: showSuccess,
    });
  };
  const callJsServiceDeviceConnect = (serialNumber: string) => {
    window.webOS.service.request('luna://com.hojeong.app.service/', {
      method: 'device/connect',
      parameters: { serialNumber: serialNumber },
      onFailure: showFailure,
      onSuccess: showSuccess,
    });
  };

  const callJsServiceTcpSubscribe = (value: string) => {
    window.webOS.service.request('luna://com.hojeong.app.service/', {
      method: 'tcpClient/' + value,
      parameters: {},
      onFailure: showFailure,
      onSuccess: showSuccess,
      subscribe: true,
    });
  };

  const callJsServiceTcpRequest = (value: string) => {
    window.webOS.service.request('luna://com.hojeong.app.service/', {
      method: 'tcpClientRequest/' + value,
      parameters: {},
      onFailure: showFailure,
      onSuccess: showSuccess,
    });
  };
  const callJsServiceTcpNotify = (value: string) => {
    window.webOS.service.request('luna://com.hojeong.app.service/', {
      method: 'tcpClientNotify/' + value,
      parameters: {},
      onFailure: showFailure,
      onSuccess: showSuccess,
    });
  };
  const callJsServiceTcpStart = () => {
    window.webOS.service.request('luna://com.hojeong.app.service/', {
      method: 'tcpClient/start',
      parameters: { ip: '' }, // ip주소 설정, 빈칸일 경우 udpClient에서 가장 최신 찾은 기기 연결
      onFailure: showFailure,
      onSuccess: showSuccess,
    });
  };

  const callJsServiceTcpSendPacketInit = () => {
    window.webOS.service.request('luna://com.hojeong.app.service/', {
      method: 'tcpClient/sendPacketInit',
      parameters: {},
      onFailure: showFailure,
      onSuccess: showSuccess,
    });
  };
  const callJsServiceTcpSendPacketActCode = () => {
    window.webOS.service.request('luna://com.hojeong.app.service/', {
      method: 'tcpClient/sendPacketActCode',
      parameters: {},
      onFailure: showFailure,
      onSuccess: showSuccess,
    });
  };
  const callJsServiceTcpSendPacketSetWifilist = () => {
    window.webOS.service.request('luna://com.hojeong.app.service/', {
      method: 'tcpClient/sendPacketSetWifilist',
      parameters: {},
      onFailure: showFailure,
      onSuccess: showSuccess,
    });
  };
  const callJsServiceTcpSendPacketGetWifilist = () => {
    window.webOS.service.request('luna://com.hojeong.app.service/', {
      method: 'tcpClient/sendPacketGetWifilist',
      parameters: {},
      onFailure: showFailure,
      onSuccess: showSuccess,
    });
  };
  const callJsServiceTcpSendPacketSetWifi = () => {
    window.webOS.service.request('luna://com.hojeong.app.service/', {
      method: 'tcpClient/sendPacketSetWifi',
      parameters: {
        encryption: 'on',
        ssid: 'Creatz_Newbiz_5G',
        password: 'passion1869!',
        type: 1,
      },
      onFailure: showFailure,
      onSuccess: showSuccess,
    });
  };
  const callJsServiceTcpCalcTrajectoryFile = () => {
    window.webOS.service.request('luna://com.hojeong.app.service/', {
      method: 'tcpClient/sendPacketCalcTrajectoryFile',
      parameters: {
        ballspeedX10: 1,
        clubspeed_BX10: 0,
        clubspeed_AX10: 0,
        clubpathX10: 0,
        clubfaceangleX10: 0,
        sidespin: 0,
        backspin: 0,
        azimuthX10: 0,
        inclineX10: 0,
      },
      onFailure: showFailure,
      onSuccess: showSuccess,
    });
  };

  const callJsServiceTcpGetNotifyPacket = () => {
    window.webOS.service.request('luna://com.hojeong.app.service/', {
      method: 'tcpClient/getNotifyPacket',
      parameters: {},
      onFailure: showFailureNotify,
      onSuccess: showSuccessNotify,
    });
  };

  const callJsServiceWifiTest = () => {
    window.webOS.service.request('luna://com.webos.service.wifi', {
      method: 'findnetworks',
      parameters: { interval: 15000 },
      onFailure: showFailure,
      onSuccess: showSuccess,
    });
  };

  const callJsServiceWifiTest2 = () => {
    window.webOS.service.request('luna://com.webos.service.wifi', {
      method: 'getNetworks',
      parameters: {},
      onFailure: showFailure,
      onSuccess: showSuccess,
    });
  };
  const callJsServiceWifiTest3 = () => {
    window.webOS.service.request('luna://com.webos.service.wifi', {
      method: 'scan',
      parameters: {},
      onFailure: showFailure,
      onSuccess: showSuccess,
    });
  };

  return (
    <div className="font-secondary p-4">
      {/* <div>
        <h1 className="text-3xl mt-5 border-t-[1px] p-2">Shot Data List</h1>
        <h1>Device: {subscribeData.source}</h1>
        <div className="flex">
          <div className="p-2">
            <h3 className="mb-2">Status</h3>
            <div>
              <div className="bg-gray-200 mb-2 text-black dark:text-black">
                <h5 className="">Launch Monitor</h5>
                <p>{shotData.isReady ? 'Ready' : 'Searching...'}</p>
              </div>
              <div className="bg-gray-200 mb-2 text-black dark:text-black">
                <h5>Handedness</h5>
                <p>-</p>
              </div>
              <div className="bg-gray-200 mb-2 text-black dark:text-black">
                <h5>Club</h5>
                <p>-</p>
              </div>
              <div className="bg-gray-200 mb-2 text-black dark:text-black">
                <h5>Surface</h5>
                <p>-</p>
              </div>
            </div>
          </div>
          <div className="flex-auto w-64 p-2">
            <h3 className="mb-2">Data</h3>
            <div>
              {Object.keys(shotData).map((key: string) => {
                if (SHOT_DATA[key]) {
                  return (
                    <div key={key} className="flex items-center">
                      <div className="font-medium">{key} </div>
                      <div className="flex flex-wrap">
                        {SHOT_DATA[key]?.map((item) => {
                          return (
                            <div
                              key={item.key}
                              className="bg-gray-300 p-2 m-2 dark:text-black"
                            >
                              {item.key} <br />
                              {shotData[key][item.key].value}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>

        <div>
          <h1>Ball Image</h1>
          <div>Images...</div>
          <h1>Club Image</h1>
          <div>Images...</div>
        </div>
      </div> */}

      <div>
        <h1 className="text-3xl mt-5 border-t-[1px] p-2">JS Service Sample</h1>
        <p>버튼을 클릭하면 등록한 js-service를 호출합니다.</p>

        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="text"
            ref={inputRef}
            placeholder="params.."
            value={value}
            onChange={onChangeValue}
          />
          <Button onClick={() => callJsService(value)}>js-service 호출</Button>
        </div>
        <div style={{ width: '100%', wordBreak: 'break-all' }}>
          {res?.message}
        </div>
      </div>

      <div>
        <h1 className="text-3xl mt-5 border-t-[1px] p-2">
          JS Service Websocket Test
        </h1>
        <div className="flex flex-col w-60">
          <Button id="serviceOn" onClick={serviceOn} className="mb-4">
            Websocket ON
          </Button>
          <Button id="serviceOff" onClick={serviceOff}>
            Websocket OFF
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-3xl mt-5 border-t-[1px] p-2">UDP client</h1>
        <div>
          <Button onClick={() => callJsServiceUdp('start')} className="mb-4">
            start
          </Button>
          <Button onClick={() => callJsServiceUdp('devices')} className="mb-4">
            devices
          </Button>
          <Button
            onClick={() => callJsServiceUdp('getMessage')}
            className="mb-4"
          >
            getMessage
          </Button>
          <Button onClick={() => callJsServiceUdp('stop')} className="mb-4">
            stop
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-3xl mt-5 border-t-[1px] p-2">TCP client</h1>
        <div>
          <Button onClick={() => callJsServiceTcpStart()} className="mb-4">
            start
          </Button>

          <Button
            onClick={() => callJsServiceTcpSendPacketInit()}
            className="mb-4"
          >
            Init
          </Button>
          <Button
            onClick={() => callJsServiceTcpSendPacketSetWifilist()}
            className="mb-4"
          >
            SetWifilist
          </Button>
          <Button
            onClick={() => callJsServiceTcpSendPacketGetWifilist()}
            className="mb-4"
          >
            GetWifilist
          </Button>
          <Button
            onClick={() => callJsServiceTcpSendPacketSetWifi()}
            className="mb-4"
          >
            SetWifi
          </Button>

          <Button
            onClick={() => callJsServiceTcpSendPacketActCode()}
            className="mb-4"
          >
            send packet act code
          </Button>

          <Button
            onClick={() => callJsServiceTcpRequest('getLog')}
            className="mb-4"
          >
            get log (request)
          </Button>
          <Button
            onClick={() => callJsServiceTcpNotify('getLog')}
            className="mb-4"
          >
            get log (notify)
          </Button>

          <Button onClick={() => callJsServiceTcp('status')} className="mb-4">
            status
          </Button>
          <Button onClick={() => callJsServiceTcp('stop')} className="mb-4">
            stop
          </Button>

          <Button
            onClick={() => callJsServiceTcp('startGetSensorStatus')}
            className="mb-4"
          >
            startGetSensorStatus
          </Button>
          <Button
            onClick={() => callJsServiceTcp('stopGetSensorStatus')}
            className="mb-4"
          >
            stopGetSensorStatus
          </Button>

          <Button
            onClick={() => callJsServiceTcpGetNotifyPacket()}
            className="mb-4"
          >
            get notify packet
          </Button>
        </div>
        <div>
          <Button onClick={() => callJsServiceWifiTest()} className="mb-4">
            wifi test
          </Button>
          <Button onClick={() => callJsServiceWifiTest2()} className="mb-4">
            wifi test2
          </Button>
          <Button onClick={() => callJsServiceWifiTest3()} className="mb-4">
            wifi test3
          </Button>
        </div>
        <div>
          <Button
            onClick={() => callJsServiceDevice('connect')}
            className="mb-4"
          >
            device/connect
          </Button>

          <Button
            onClick={() => callJsServiceDeviceConnect('501000008535')}
            className="mb-4"
          >
            device/connect - serialNumber
          </Button>

          <Button
            onClick={() => callJsServiceDevice('disconnect')}
            className="mb-4"
          >
            device/disconnect
          </Button>

          <Button
            onClick={() => callJsServiceTcpCalcTrajectoryFile()}
            className="mb-4"
          >
            CalcTrajectoryFile
          </Button>
        </div>
        <div style={{ width: '100%', wordBreak: 'break-all' }}>
          {resNotify?.message}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
