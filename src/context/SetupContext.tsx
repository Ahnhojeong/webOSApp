import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from 'react';

interface SetupState {
  currentStep: number;
  error: string | null;
  deviceFound: boolean;
  wifiListReceived: boolean;
  isCompleted: boolean;
}

type SetupAction =
  | { type: 'NEXT_STEP' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'DEVICE_FOUND' }
  | { type: 'WIFI_LIST_RECEIVED' }
  | { type: 'COMPLETE_SETUP' }
  | { type: 'SEARCH_TIMEOUT' }; // 추가

const initialState: SetupState = {
  currentStep: 0,
  error: null,
  deviceFound: false,
  wifiListReceived: false,
  isCompleted: false,
};

const SetupContext = createContext<
  | {
      state: SetupState;
      dispatch: React.Dispatch<SetupAction>;
      handleSuccess: (step: number) => void;
      handleFailure: (step: number, error: any) => void;
    }
  | undefined
>(undefined);

function setupReducer(state: SetupState, action: SetupAction): SetupState {
  switch (action.type) {
    case 'NEXT_STEP':
      return { ...state, currentStep: state.currentStep + 1, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'DEVICE_FOUND':
      return { ...state, deviceFound: true };
    case 'WIFI_LIST_RECEIVED':
      return { ...state, wifiListReceived: true };
    case 'COMPLETE_SETUP':
      return { ...state, isCompleted: true };
    case 'SEARCH_TIMEOUT':
      return { ...state, error: 'Device search timed out after 5 minutes' };
    default:
      return state;
  }
}

export const SetupProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(setupReducer, initialState);

  const handleSuccess = useCallback((step: number) => {
    console.log(`Step ${step} completed successfully`);
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  const handleFailure = useCallback((step: number, error: any) => {
    console.error(`Error at step ${step}:`, error);
    dispatch({
      type: 'SET_ERROR',
      payload: `Failed at step ${step}: ${error.message}`,
    });
  }, []);

  return (
    <SetupContext.Provider
      value={{ state, dispatch, handleSuccess, handleFailure }}
    >
      {children}
    </SetupContext.Provider>
  );
};

export const useSetup = () => {
  const context = useContext(SetupContext);
  if (!context) {
    throw new Error('useSetup must be used within a SetupProvider');
  }
  return context;
};
