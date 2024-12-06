export interface ISetWifiParams {
  ssid: string;
  password: string;
  encryption: string;
}

// JS-service를 요청하기 위한 유틸함수
interface ServiceRequestOptions {
  onSuccess?: (response: any) => void;
  onFailure?: (error: any) => void;
  parameters?: any;
}

const serviceRequest = (
  method: string,
  options: ServiceRequestOptions = {},
): Promise<any> => {
  const { parameters = {}, onSuccess, onFailure } = options;

  return new Promise((resolve, reject) => {
    window.webOS.service.request('luna://com.hojeong.app.service/', {
      method,
      parameters,
      onSuccess: (response: any) => {
        if (onSuccess) onSuccess(response);
        resolve(response);
      },
      onFailure: (error: any) => {
        if (onFailure) onFailure(error);
        reject(error);
      },
    });
  });
};

// 각 단계별 JS-service 요청 함수 정의
export const setupSteps = {
  async startUdp(
    options?: Pick<ServiceRequestOptions, 'onSuccess' | 'onFailure'>,
  ) {
    return await serviceRequest('udpClient/start', options);
  },

  async checkDevices(options?: ServiceRequestOptions) {
    const res = await serviceRequest('udpClient/devices', options);
    return res.devices?.length > 0;
  },

  async startTcpClient(options?: ServiceRequestOptions) {
    return await serviceRequest('tcpClient/start', options);
  },

  async initPacket(options?: ServiceRequestOptions) {
    return await serviceRequest('tcpClient/sendPacketInit', options);
  },

  async setWifiList(options?: ServiceRequestOptions) {
    return await serviceRequest('tcpClient/sendPacketSetWifilist', options);
  },

  async getWifiList(options?: ServiceRequestOptions) {
    return await serviceRequest('tcpClient/sendPacketGetWifilist', options);
  },
  // {
  //     ssid = 'QED_OFFICE_2.4GHz',
  //     password = 'qedoffice1234',
  //     encryption = 'on',
  //   }: ISetWifiParams
  async setWifi(options?: ServiceRequestOptions) {
    return await serviceRequest('tcpClient/sendPacketSetWifi', {
      parameters: options?.parameters,
    });
  },

  async disconnectDevice(options?: ServiceRequestOptions) {
    return await serviceRequest('device/disconnect', options);
  },

  async connectDevice(options?: ServiceRequestOptions) {
    return await serviceRequest('device/connect', options);
  },
};
