import { useState, useEffect, useCallback, useRef } from 'react';

// FPS 측정을 위한 커스텀 훅
export const useFPS = () => {
  const [fps, setFPS] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const animationFrameId = useRef<any>(null);

  const measureFPS = useCallback(() => {
    const currentTime = performance.now();
    frameCount.current++;

    // 1초마다 FPS 계산
    if (currentTime >= lastTime.current + 1000) {
      setFPS(frameCount.current);
      frameCount.current = 0;
      lastTime.current = currentTime;
    }

    animationFrameId.current = requestAnimationFrame(measureFPS);
  }, []);

  useEffect(() => {
    measureFPS();

    // 클린업 함수
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [measureFPS]);

  return fps;
};
