interface WebOSService {
  request: (
    url: string,
    options: {
      method: string;
      parameters: any;
      onSuccess: (response: any) => void;
      onFailure: (error: any) => void;
      subscribe?: boolean;
    },
  ) => void;
  cancel: (
    url: string,
    options: {
      method: string;
      parameters: any;
      onSuccess: (response: any) => void;
      onFailure: (error: any) => void;
      subscribe?: boolean;
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
