import { useSetup } from '@/context/SetupContext';

export const SuccessPage: React.FC = () => {
  const { state } = useSetup();

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-green-600">Setup Completed!</h2>
      <p className="mt-4">
        All device configuration steps have been successfully completed.
      </p>
    </div>
  );
};
