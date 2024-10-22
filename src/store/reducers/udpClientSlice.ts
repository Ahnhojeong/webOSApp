import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IMsgResponse {
  returnValue: boolean;
  data: string;
}

export interface IUdpMsg extends IMsgResponse {
  updated?: number;
}

// 네트워크 정보를 위한 인터페이스
interface NetworkInfo {
  interface: string;
  ipaddr: string;
  mac: string;
}

// 디바이스 정보를 위한 인터페이스
interface DeviceInfo {
  devGuid: number[];
  modelName: string;
  hwVersion: string;
  swVersion: string;
  serialNumber: string;
  hashKey: string;
  networkInfo: NetworkInfo;
  updated: number;
}

type OverrideData<T, U> = Omit<T, 'data'> & { data: U }; // 타입 유틸리티를 사용하여 재사용 가능한 방식으로 정의
export type IUdpDeviceInfo = OverrideData<IMsgResponse, string | DeviceInfo[]>;

const udpClientSlice = createSlice({
  name: 'udpClient',
  initialState: {
    start: {
      returnValue: true,
      data: '',
    } as IMsgResponse,
    getMessage: {
      returnValue: true,
      data: '',
      updated: 0,
    } as IUdpMsg,
    devices: {
      returnValue: true,
      data: '',
    } as IUdpDeviceInfo,
    stop: {
      returnValue: true,
      data: '',
    } as IMsgResponse,
  },
  reducers: {
    setUdpClientStart: (state, action: PayloadAction<IMsgResponse>) => {
      state.start = action.payload;
    },
    setUdpClientGetMessage: (state, action: PayloadAction<IUdpMsg>) => {
      state.getMessage = action.payload;
    },
    setUdpClientDevices: (state, action: PayloadAction<IUdpDeviceInfo>) => {
      state.devices = action.payload;
    },
    setUdpClientStop: (state, action: PayloadAction<IMsgResponse>) => {
      state.stop = action.payload;
    },
  },
});

export const {
  setUdpClientStart,
  setUdpClientGetMessage,
  setUdpClientDevices,
  setUdpClientStop,
} = udpClientSlice.actions;
export default udpClientSlice.reducer;
