import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCallback, useEffect, useRef, useState } from 'react';

interface NotifyHeader {
  hard_key: number;
  event_id: number;
  command: number;
  req_id: number;
  length: number;
}

interface NotifyParamShotGuid {
  Data1: number;
  Data2: number;
  Data3: number;
  Data4: number[];
}

interface NotifyParamShotDataEx1 {
  shotguid: NotifyParamShotGuid;
  category: number;
  rightlefthanded: number;
  xposx1000: number;
  yposx1000: number;
  zposx1000: number;
  ballspeedx1000: number;
  inclineX1000: number;
  azimuthX1000: number;
  spincalc_method: number;
  assurance_spin: number;
  backspinX1000: number;
  sidespinX1000: number;
  rollspinX1000: number;
  clubcalc_method: number;
  assurance_clubspeed: number;
  assurance_clubpath: number;
  assurance_faceangle: number;
  assurance_attackangle: number;
  assurance_loftangle: number;
  assurance_lieangle: number;
  assurance_faceimpactLateral: number;
  assurance_faceimpactVertical: number;
  clubspeedX1000: number;
  clubpathX1000: number;
  faceangleX1000: number;
  attackAngleX1000: number;
  loftangleX1000: number;
  lieangleX1000: number;
  faceimpactLateralX1000: number;
  faceimpactVerticalX1000: number;
  impactTimestamp: number;
}

interface NotifyParamStateData {
  rightleft: number;
  clubtype: number;
  allowTee: number;
  allowIron: number;
  allowPutter: number;
  unitDistance: number;
  unitSpeed: number;
  altitude: number;
  altitude_mode: number;
}

interface NotifyParamGoodShot {
  status: number;
  shotdataEX1: NotifyParamShotDataEx1;
  statedata: NotifyParamStateData;
}

interface NotifyParamShotImg {
  shotImgPath: string;
}

interface NotifyParamStateChanged {
  status: number;
  statedata: NotifyParamStateData;
}

interface NotifyPacket {
  header: NotifyHeader;
  param:
    | NotifyParamGoodShot
    | NotifyParamShotImg
    | NotifyParamStateChanged
    | any;
  tcp_client_received: number;
}

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

  const handleMessage = useCallback((event: MessageEvent) => {
    console.log('1-1. webOS websocket message -> ', event.data);

    let data: any;

    try {
      // JSON 형식인지 먼저 파싱을 시도
      data = JSON.parse(event.data);
    } catch (error) {
      // 파싱에 실패하면 원본 데이터를 그대로 사용합니다.
      data = event.data;
    }

    // 이제 data는 객체이거나 원본 텍스트입니다.
    if (typeof data === 'object' && data !== null) {
      console.log('webOS websocket 받은 데이터는 객체입니다:', data);
      // 객체에 대한 처리를 여기서 수행합니다.
      if (data.header) {
        console.log('1-2. webOS websocket 받은 데이터에 header가 포함됩니다.');
        switch (data.header.command) {
          case 1: // GoodShot
            handleGoodShot(data.param as NotifyParamGoodShot);
            break;
          case 2: // ShotImg
            handleShotImg(data.param as NotifyParamShotImg);
            break;
          case 4: // StateChanged
            handleStateChanged(data.param as NotifyParamStateChanged);
            break;
          default:
            console.log('Unknown command:', data.header.command);
        }
      } else {
        console.log(
          '1-3. webOS websocket 받은 데이터에 header가 없습니다 -> ',
          event.data,
        );
      }
    } else {
      console.log('1-4. webOS websocket 받은 데이터는 텍스트입니다 -> ', data);
      // 텍스트에 대한 처리를 여기서 수행합니다.
    }
  }, []);

  const handleGoodShot = (param: NotifyParamGoodShot) => {
    console.log('Handling Good Shot:', param);
    // GoodShot 데이터 처리 로직
  };

  const handleShotImg = (param: NotifyParamShotImg) => {
    console.log('Handling Shot Image:', param);
    // ShotImg 데이터 처리 로직
    // 이미지 저장소=`http://${ip}/${param.shotImgPath}` ex)http://192.168.1.61/SCAMIMG/CURRENT/
  };

  const handleStateChanged = (param: NotifyParamStateChanged) => {
    console.log('Handling State Changed: ', param);
  };

  useEffect(() => {
    if (wsOpen) {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log('1. webOS websocket open', ws.current?.readyState);
        if (ws.current && ws.current.readyState === 1) {
          // ws.current.onmessage = (event: MessageEvent) => {
          //   console.log('1-1. webOS websocket message -> ', event.data);
          // };
          ws.current.onmessage = handleMessage;
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

  function serviceOn() {
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
  }

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

  const callJsServiceUdp = (value: string) => {
    window.webOS.service.request('luna://com.hojeong.app.service/', {
      method: 'udpClient/' + value,
      parameters: {},
      onFailure: showFailure,
      onSuccess: showSuccess,
      subscribe: true,
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
            onClick={() => callJsServiceTcpGetNotifyPacket()}
            className="mb-4"
          >
            get notify packet
          </Button>

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
        <div style={{ width: '100%', wordBreak: 'break-all' }}>
          {resNotify?.message}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
