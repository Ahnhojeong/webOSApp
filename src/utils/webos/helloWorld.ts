// webOS 타입 정의
interface WebOSService {
  request: (
    url: string,
    options: {
      method: string;
      parameters: any;
      onSuccess: (response: any) => void;
      onFailure: (error: any) => void;
    },
  ) => void;
}

interface WebOS {
  service: WebOSService;
}

declare global {
  interface Window {
    webOS: WebOS;
  }
}

export function displayReponse(value: string) {
  return window.webOS.service.request('luna://com.hojeong.app.service/', {
    method: 'hello',
    parameters: { name: value },
    onFailure: showFailure,
    onSuccess: showSuccess,
  });
}

function showSuccess(res: { returnValue: boolean; data: string }) {
  console.log('showSuccess res -> ', res);
  return res;
}

function showFailure(err: {
  errorCode: number;
  errorText: string;
  returnValue: boolean;
}) {
  console.log('showFailure err -> ', err);
  return err;
}
