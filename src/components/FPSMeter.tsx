import { useState, useEffect, useCallback, useRef } from 'react';

const useFPS = () => {
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

export const FPSMeter = ({ className = '', style = {} }) => {
  const fps = useFPS();

  return (
    <div
      className={`fixed top-2 left-2 bg-black/50 text-white px-2 py-1 rounded ${className}`}
      style={{
        fontFamily: 'monospace',
        fontSize: '14px',
        zIndex: 9999,
        ...style,
      }}
    >
      FPS: {Math.round(fps)}
    </div>
  );
};
