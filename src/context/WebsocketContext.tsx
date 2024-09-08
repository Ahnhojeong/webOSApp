import {
  IBallData,
  IClubData,
  IFlightData,
  IShotEventData,
  IShotImageInfoData,
  IShotValue,
  ShotDataType,
} from '@/types/websocket';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

// 필요한 타입 정의
interface IWebsocketPayloadType {
  channel: string;
  data: any; // Shot Event에 따라 달라집니다.
  data_type: null | ShotDataType;
  source: string;
  target: string;
  timestamp: string;
  type: string;
  method?: string;
}

interface ShotData {
  shotDataInfo: any;
  shotEvent: IShotEventData;
  shotDataBall: IBallData;
  shotDataClub: IClubData;
  shotDataFlight: IFlightData;
  shotImage: IShotImageInfoData;
  isReady?: boolean;
  [key: string]: any;
}

interface ISubscribeAck {
  error: null | any;
  id: string;
  method: string;
  result: null | any;
  result_type: null | any;
  source: string;
  success: boolean;
  timestamp: string;
}

// 이벤트 핸들러 타입 정의
type EventHandler<T> = (data: T) => void;

interface WebsocketContextType {
  shotData: ShotData;
  subscribeData: ISubscribeAck;
}

const WebsocketContext = createContext<WebsocketContextType | undefined>(
  undefined,
);

const WS_URL = 'wss://192.168.1.124:54321/ws/v1'; // Websocket URL

const SHOT_VALUE_INIT: IShotValue = { value: 0, method: '', confidence: 0 };

export const WebsocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const ws = useRef<null | WebSocket>(null);
  const [subscribeData, setSubscribeData] = useState<ISubscribeAck>({
    error: null,
    id: '',
    method: '',
    result: null,
    result_type: null,
    source: 'device/launch_monitor',
    success: false,
    timestamp: '',
  });

  const [shotData, setShotData] = useState<ShotData>({
    shotDataInfo: {},
    shotEvent: { shot_id: '', shot_mode: '', impact_timestamp: 0 },
    shotDataBall: {
      back_spin: '',
      ball_position_before_launch: {
        x: 0,
        y: 0,
        z: 0,
      },
      horizontal_launch_angle: SHOT_VALUE_INIT,
      roll_spin: SHOT_VALUE_INIT,
      shot_id: '',
      side_spin: SHOT_VALUE_INIT,
      speed: SHOT_VALUE_INIT,
      spin_tilt_axis: SHOT_VALUE_INIT,
      total_spin: SHOT_VALUE_INIT,
      vertical_launch_angle: SHOT_VALUE_INIT,
    },
    shotDataClub: {
      attack_angle: SHOT_VALUE_INIT,
      ball_impact_position_horizontal: SHOT_VALUE_INIT,
      ball_impact_position_vertical: SHOT_VALUE_INIT,
      dynamic_loft_angle: SHOT_VALUE_INIT,
      face_angle: SHOT_VALUE_INIT,
      face_to_path_angle: SHOT_VALUE_INIT,
      head_speed: SHOT_VALUE_INIT,
      lie_angle: SHOT_VALUE_INIT,
      path: SHOT_VALUE_INIT,
      shot_id: '',
      smash_factor: SHOT_VALUE_INIT,
    },
    shotDataFlight: {
      apex_distance: SHOT_VALUE_INIT,
      apex_height: SHOT_VALUE_INIT,
      carry_distance: SHOT_VALUE_INIT,
      flight_time: SHOT_VALUE_INIT,
      flight_type: SHOT_VALUE_INIT,
      shot_id: '',
      side_distance: SHOT_VALUE_INIT,
      trajectory_array: SHOT_VALUE_INIT,
      trajectory_array_encoded: SHOT_VALUE_INIT,
      trajectory_array_length: 0,
      trajectory_array_time_delta: 0,
    },
    shotImage: {
      ball_images: [],
      club_images: [],
      impact_images: [],
      impact_timestamp: 0,
      shot_id: '',
    },
    isReady: false,
  });
  // uuid
  const generateGuid = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  };

  // Subscribe
  const subscribeChannel = ({
    ws,
    channel,
  }: {
    ws: null | WebSocket;
    channel: string;
  }) => {
    if (ws) {
      const channelInfo = JSON.stringify({
        id: generateGuid(),
        method: 'subscribe',
        target: channel,
        params: {
          channel: [`${channel}@shot_data`, `${channel}@control_event`],
          snapshot: true,
        },
      });

      ws.send(channelInfo);
    }
  };
  const handleLaunchMonitorEvent = (payload: IWebsocketPayloadType) => {
    console.log('============ handleLaunchMonitorEvent =============', payload);

    setShotData((prevData) => {
      switch (payload.data_type) {
        case 'ShotDataInfo':
          console.log('# Event : ShotDataInfo #');
          return { ...prevData, shotDataInfo: payload.data };
        case 'ShotEvent':
          console.log('# Event : ShotEvent #');
          if (payload.data.shot_id) {
            console.log('샷 이미지 요청 -> API로 진행됩니다.');
          }
          return { ...prevData, shotEvent: payload.data };
        case 'ShotDataBall':
          console.log('# Event : ShotDataBall #');
          return { ...prevData, shotDataBall: payload.data };
        case 'ShotDataClub':
          console.log('# Event : ShotDataClub #');
          return { ...prevData, shotDataClub: payload.data };
        case 'ShotDataFlight':
          console.log('# Event : ShotDataFlight #');
          return { ...prevData, shotDataFlight: payload.data };
        case 'ShotImage':
          console.log('# Event : ShotImage #');
          return { ...prevData, shotImage: payload.data };
        case 'ReadyToShot':
          console.log('# Event : ReadyToShot #');
          return { ...prevData, isReady: true };
        case 'NotReady':
          console.log('# Event : NotReady #');
          return { ...prevData, isReady: false };
        default:
          return prevData;
      }
    });
  };

  // Receive Message
  const receiveMessage = (msg: string) => {
    try {
      const payload: IWebsocketPayloadType = JSON.parse(msg);

      if (!payload) {
        console.error('Event payload null');
        return;
      }

      if (payload.type === 'ping') {
        console.log('Event: ping');
        return;
      }

      if (payload.method === 'subscribe') {
        setSubscribeData(JSON.parse(msg));
      }

      if (payload.target === 'application') {
        console.log(`Event channel = ${payload.channel}`);

        if (payload.channel.startsWith('device/launch_monitor@')) {
          handleLaunchMonitorEvent(payload);
        } else if (payload.channel.startsWith('device/balance_optix@')) {
          // handleBalanceOptixEvent(payload);
        } else if (payload.channel.startsWith('device/swing_optix@')) {
          // handleSwingOptixEvent(payload);
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  useEffect(() => {
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log('websocket open');
      if (ws.current && ws.current.readyState === 1) {
        ws.current.onmessage = (event: MessageEvent) => {
          console.log('websocket message -> ', JSON.parse(event.data));
          receiveMessage(event.data);
        };

        // 1. Subscribe
        subscribeChannel({
          ws: ws.current,
          channel: 'device/launch_monitor',
        });
      }
    };

    ws.current.onclose = () => {
      console.log('websocket close');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  useEffect(() => {
    console.log('shotData ---> ', shotData);
  }, [shotData]);

  return (
    <WebsocketContext.Provider value={{ shotData, subscribeData }}>
      {children}
    </WebsocketContext.Provider>
  );
};

export const useWebsocket = () => {
  const context = useContext(WebsocketContext);
  if (context === undefined) {
    throw new Error('useWebsocket must be used within a WebsocketProvider');
  }
  return context;
};
