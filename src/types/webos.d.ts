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