import { useSetup } from '@/context/SetupContext';

export const FailPage: React.FC = () => {
  const { state } = useSetup();

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-red-600">Setup Failed</h2>
      <p className="mt-4">
        Unable to find any devices after 5 minutes of searching.
      </p>
      <p className="mt-2">Please check:</p>
      <ul className="list-disc ml-6 mt-2">
        <li>The device is powered on</li>
        <li>The device is within range</li>
        <li>The device is in pairing mode</li>
      </ul>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Try Again
      </button>
    </div>
  );
};
