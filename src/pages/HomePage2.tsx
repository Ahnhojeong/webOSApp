import { FPSMeter } from '@/components/FPSMeter';
import { TopViewGraph111 } from '@/components/TopviewGraph111';
import { TopviewGraph3 } from '@/components/TopviewGraph3';
import { TopViewGraph4 } from '@/components/TopViewGraph4MO';
import { test2 } from '@/lib/data';
import { useEffect, useState } from 'react';

const HomePage2 = () => {
  const [currentTrajectoryIndex, setCurrentTrajectoryIndex] = useState(0);
  const [shotDataList, setShotDataList] = useState([
    {
      trajectoryData: test2[0].trajectoryData,
      clubType: 0,
      trajectoryYardData: test2[0].trajectoryData,
      carry: 208.8,
      maxXvalue: 60,
      id: '23432',
    },
  ]);

  // // 5초마다 랜덤으로 currentTrajectoryIndex 업데이트
  // useEffect(() => {
  //   const intervalId = setInterval(() => {
  //     setCurrentTrajectoryIndex((prev) => {
  //       const newIndex = (prev + 1) % 4;
  //       setShotDataList((prevList) => [...prevList, test2[newIndex]]);
  //       return newIndex;
  //     });
  //   }, 5000);

  //   return () => clearInterval(intervalId);
  // }, []);

  return (
    <div className="font-secondary p-4 bg-black">
      <div className="w-[260px] h-[800px]">
        <FPSMeter />
        <TopViewGraph111 shotDataList={shotDataList} userDistance="meter" />
      </div>
    </div>
  );
};

export default HomePage2;
