import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IMsgResponse } from './udpClientSlice';

export interface AckHeader {
  status: number;
  answer: number;
  command: number;
  ack_id: number;
  length: number;
}

interface RequestPacket {
  header: AckHeader;
  param: null;
  tcp_client_received: number;
}

interface IWifiList {
  ssidArray: string[];
  qualityArray: string[];
  levelArray: string[];
  encryptionArray: string[];
}

interface WifiList {
  header: AckHeader;
  param: {
    wifiList: IWifiList;
    number: number; // 0보다 큰 상태여야 setWifi 가능, -1이면 계속해서 getWifilist 체크
  };
  tcp_client_received: number;
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

export interface TcpStatus {
  ip: string;
  requestRunning: boolean;
  notifyRunning: boolean;
}

export interface TcpNotifyStateChanged {
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

export interface INotifyStateChanged {
  header: AckHeader | {};
  param: {
    status: number;
    statedata: TcpNotifyStateChanged;
  } | null;
  tcp_client_received: number;
}

export interface INotifyGoodShot {
  header: AckHeader | {};
  param: {
    status: number;
    shotdatEx1: NotifyParamShotDataEx1;
    statedata: TcpNotifyStateChanged;
  } | null;
  tcp_client_received: number;
}

export interface INotifyShotImg {
  header: AckHeader | {};
  param: {
    shotImgPath: string;
  } | null;
  tcp_client_received: number;
}

export interface ISensorState {
  header: AckHeader | {};
  param: {
    status: number;
  } | null;
  tcp_client_received: number;
}

export interface BallPositionType {
  ballexist: number;
  shotresult: number;
  x: number;
  y: number;
  z: number;
}

export interface IBallPosition {
  header: AckHeader | {};
  param: {
    teeBallPos: BallPositionType;
    ironBallPos: BallPositionType;
    puttingBallPos: BallPositionType;
  } | null;
  tcp_client_received: number;
}

type OverrideData<T, U> = Omit<T, 'data'> & { data: U }; // 타입 유틸리티를 사용하여 재사용 가능한 방식으로 정의
export type ITcpPacketInit = OverrideData<IMsgResponse, string | RequestPacket>;
export type ITcpWifiList = OverrideData<IMsgResponse, string | WifiList>;
export type ITcpStatus = OverrideData<IMsgResponse, string | TcpStatus>;

const tcpClientSlice = createSlice({
  name: 'tcpClient',
  initialState: {
    start: {
      returnValue: false,
      data: '',
    } as IMsgResponse,
    sendPacketInit: {
      returnValue: false,
      data: '',
    } as ITcpPacketInit,
    getWifiList: {
      returnValue: false,
      data: '',
    } as ITcpWifiList,
    setWifiList: {
      // setWifiList 이후 getWifiList 진행 권장
      returnValue: false,
      data: '',
    } as ITcpPacketInit,
    setWifi: {
      returnValue: false,
      data: '',
    } as ITcpPacketInit,
    status: {
      // ex) {"ip":"192.168.0.68","requestRunning":true,"notifyRunning":true}
      // notifyRunning이 true가 된 상태면 notifyPacket을 수신할 준비 완료된 상태
      returnValue: false,
      data: '',
    } as ITcpStatus,
    stateChanged: {} as INotifyStateChanged,
    goodShot: {} as INotifyGoodShot,
    shotImg: {} as INotifyShotImg,
    sensorState: {} as ISensorState,
    ballPosition: {} as IBallPosition,
  },
  reducers: {
    setTcpClientStart: (state, action: PayloadAction<IMsgResponse>) => {
      state.start = action.payload;
    },
    setTcpClientSendPacketInit: (
      state,
      action: PayloadAction<ITcpPacketInit>,
    ) => {
      state.sendPacketInit = action.payload;
    },
    setTcpClientGetWifiList: (state, action: PayloadAction<ITcpWifiList>) => {
      state.getWifiList = action.payload;
    },
    setTcpClientSetWifiList: (state, action: PayloadAction<ITcpPacketInit>) => {
      state.setWifiList = action.payload;
    },
    setTcpClientSetWifi: (state, action: PayloadAction<ITcpPacketInit>) => {
      state.setWifi = action.payload;
    },
    setTcpClientStatus: (state, action: PayloadAction<ITcpStatus>) => {
      state.status = action.payload;
    },
    setNotifyStateChanged: (
      state,
      action: PayloadAction<INotifyStateChanged>,
    ) => {
      state.stateChanged = action.payload;
    },
    setNotifyGoodShot: (state, action: PayloadAction<INotifyGoodShot>) => {
      state.goodShot = action.payload;
    },
    setNotifyShotImg: (state, action: PayloadAction<INotifyShotImg>) => {
      state.shotImg = action.payload;
    },
    setSensorState: (state, action: PayloadAction<ISensorState>) => {
      state.sensorState = action.payload;
    },
    setBallPosition: (state, action: PayloadAction<IBallPosition>) => {
      state.ballPosition = action.payload;
    },
  },
});

export const {
  setTcpClientStart,
  setTcpClientSendPacketInit,
  setTcpClientGetWifiList,
  setTcpClientSetWifiList,
  setTcpClientSetWifi,
  setTcpClientStatus,
  setNotifyStateChanged,
  setNotifyGoodShot,
  setNotifyShotImg,
} = tcpClientSlice.actions;
export default tcpClientSlice.reducer;
