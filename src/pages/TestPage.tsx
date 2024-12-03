import CameraRecorder from '@/components/CameraRecorder';
import { FPSMeter } from '@/components/FPSMeter';
import Game from '@/components/Game';

function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      {/* <CameraRecorder /> */}
      <Game />
      <FPSMeter />
    </div>
  );
}

export default TestPage;
