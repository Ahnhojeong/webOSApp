import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWebsocket } from '@/context/WebsocketContext';
import { SHOT_DATA } from '@/utils/constant/shotData';
import { useCallback, useEffect, useRef, useState } from 'react';

const WS_URL = 'ws://192.168.1.65:9000'; // Websocket URL (Port를 제외한 IP는 webOS 기기의 IP를 입력해주세요.)

const HomePage = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const { subscribeData, shotData } = useWebsocket(); // WebSocket - ShotData
  const [res, setRes] = useState<{ returnValue: boolean; message: string }>(); // JS-service Sample
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

  return (
    <div className="font-secondary p-4">
      <div>
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
          <div>Images...</div> {/* image 받아와서 렌더링 필요 */}
          <h1>Club Image</h1>
          <div>Images...</div> {/* image 받아와서 렌더링 필요 */}
        </div>
      </div>

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
        <div>{res?.message}</div>
      </div>

      <div>
        <h1 className="text-3xl mt-5 border-t-[1px] p-2">
          JS Service Websocket Test
        </h1>
        <div className="flex flex-col w-60">
          <Button id="serviceOn" onClick={serviceOn} className="mb-4">
            Websocker ON
          </Button>
          <Button id="serviceOff" onClick={serviceOff}>
            Websocker OFF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
