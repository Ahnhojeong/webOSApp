import { FPSMeter } from '@/components/FPSMeter';
import { RiveDemo, UrlDemo } from '@/components/RiveApp';

function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="RiveContainer">
        <UrlDemo />
      </div>
      <FPSMeter />
    </div>
  );
}

export default TestPage;
