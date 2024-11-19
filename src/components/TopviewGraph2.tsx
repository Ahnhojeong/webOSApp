import React, { useCallback, useEffect, useMemo, useRef } from 'react';

type TrajectoryDataType = { x: number; y: number; z: number };

type ShotDataListType = {
  trajectoryData: TrajectoryDataType[];
  trajectoryYardData: TrajectoryDataType[];
  clubType: number;
};

type TopViewGraphProps = {
  shotDataList: ShotDataListType[];
  userDistance: 'meter' | 'yard';
};

const CLUB_TYPE = [
  { type: 0, color: '#6AA6E6', label: 'Driver' },
  { type: 1, color: '#42A96F', label: 'Wood' },
  { type: 2, color: '#DACA6B', label: 'Hybrid' },
  { type: 3, color: '#E78C73', label: 'Iron' },
  { type: 4, color: '#C9AE92', label: 'Wedge' },
] as const;

export const TopViewGraph2 = ({
  shotDataList,
  userDistance = 'meter',
}: TopViewGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const topviewRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const bgImageRef = useRef<HTMLImageElement>();

  // 메모이제이션된 최대 거리 계산
  // const maxDistance = useMemo(() => {
  //   if (!shotDataList.length) return 0;

  //   const zValues = shotDataList.map((data) => {
  //     const trajectory =
  //       userDistance === 'yard' ? data.trajectoryYardData : data.trajectoryData;
  //     return trajectory[trajectory.length - 1]?.z || 0;
  //   });

  //   const maxZ = Math.max(...zValues);
  //   return maxZ < 40 ? 50 : Math.ceil((maxZ + 20) / 10) * 10;
  // }, [shotDataList, userDistance]);

  // maxDistance 부분을 수정
  const { maxXDistance, maxZDistance } = useMemo(() => {
    if (!shotDataList.length) return { maxXDistance: 0, maxZDistance: 0 };

    const values = shotDataList.map((data) => {
      const trajectory =
        userDistance === 'yard' ? data.trajectoryYardData : data.trajectoryData;
      const lastPoint = trajectory[trajectory.length - 1];
      return {
        x: Math.abs(lastPoint?.x || 0), // x값의 절대값 사용
        z: lastPoint?.z || 0,
      };
    });

    const maxX = Math.max(...values.map((v) => v.x));
    const maxZ = Math.max(...values.map((v) => v.z));

    // x축 범위 계산
    const baseXValue = maxX < 5 ? 10 : Math.ceil((maxX + 2) / 5) * 5;
    // z축 범위 계산 (기존 로직)
    const baseZValue = maxZ < 40 ? 50 : Math.ceil((maxZ + 20) / 10) * 10;

    return {
      maxXDistance: baseXValue,
      maxZDistance: baseZValue,
    };
  }, [shotDataList, userDistance]);

  // 좌표 변환 함수들을 메모이제이션
  // const transformCoordinates = useMemo(() => {
  //   return {
  //     x: (value: number, width: number) => {
  //       if (!maxDistance) return 0;
  //       const normalizedValue = value / maxDistance;
  //       return normalizedValue * width + width / 2;
  //     },
  //     z: (value: number, height: number) => {
  //       if (!maxDistance) return 0;
  //       return height - (value / maxDistance) * height;
  //     },
  //   };
  // }, [maxDistance]);
  const transformCoordinates = useMemo(() => {
    return {
      x: (value: number, width: number) => {
        if (!maxXDistance) return width / 2;
        const normalizedValue = value / maxXDistance;
        return normalizedValue * (width / 2) + width / 2;
      },
      z: (value: number, height: number) => {
        if (!maxZDistance) return height;
        return height - (value / maxZDistance) * height;
      },
    };
  }, [maxXDistance, maxZDistance]);

  // 캔버스 클리어 및 기본 그리드 그리기
  // drawBackground 함수 수정

  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);

      // Z축(거리) 그리드 그리기
      const zStep = 10;
      const totalZGrids = maxZDistance / zStep;

      // 거리 마커 스타일 설정
      ctx.font = 'bold 20px Helvetica Neue';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (let i = 1; i <= totalZGrids; i++) {
        const radius = (i / totalZGrids) * height;
        ctx.beginPath();
        ctx.arc(width / 2, height, radius, Math.PI, 0);
        ctx.strokeStyle =
          i % 5 === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)';
        ctx.setLineDash(i % 5 === 0 ? [] : [2, 2]);
        ctx.stroke();

        if (i % 5 === 0) {
          const yPos = height - radius;
          const distance = i * zStep;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(distance.toString(), width / 2 - width / 2 + 30, yPos);
        }
      }

      // X축 그리드 그리기
      const xStep = 5; // X축은 5단위로 분할
      const totalXGrids = maxXDistance / xStep;
      const xGridWidth = width / 2 / totalXGrids;

      for (let i = -totalXGrids; i <= totalXGrids; i++) {
        const x = width / 2 + i * xGridWidth;

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.strokeStyle =
          i === 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)';
        ctx.setLineDash(i === 0 ? [] : [2, 2]);
        ctx.stroke();
      }
    },
    [maxXDistance, maxZDistance],
  );

  // 이전 샷들 그리기
  const drawPreviousShots = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (shotDataList.length <= 1) return;

      for (let i = 0; i < shotDataList.length - 1; i++) {
        const data =
          userDistance === 'yard'
            ? shotDataList[i].trajectoryYardData
            : shotDataList[i].trajectoryData;

        const lastPoint = data[data.length - 1];
        if (!lastPoint) continue;

        const x = transformCoordinates.x(lastPoint.x, width);
        const y = transformCoordinates.z(lastPoint.z, height);

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = CLUB_TYPE[shotDataList[i].clubType]?.color || '#fff';
        ctx.fill();
      }
    },
    [shotDataList, userDistance, transformCoordinates],
  );

  // 현재 샷 애니메이션 그리기

  const animateCurrentShot = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (!shotDataList.length) return;

      const currentShot = shotDataList[shotDataList.length - 1];
      const trajectory =
        userDistance === 'yard'
          ? currentShot.trajectoryYardData
          : currentShot.trajectoryData;

      let currentIndex = 0;
      const color = CLUB_TYPE[currentShot.clubType]?.color || '#fff';

      const animate = () => {
        if (currentIndex >= trajectory.length) {
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }

          // 애니메이션이 끝났을 때 최종 위치에 큰 원 그리기
          const finalPoint = trajectory[trajectory.length - 1];
          const x = transformCoordinates.x(finalPoint.x, width);
          const y = transformCoordinates.z(finalPoint.z, height);

          // 바깥 원
          ctx.beginPath();
          ctx.arc(x, y, 16, 0, Math.PI * 2);
          ctx.fillStyle = `${color}50`;
          ctx.fill();

          // 안쪽 원
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();

          return;
        }

        const point = trajectory[currentIndex];
        const x = transformCoordinates.x(point.x, width);
        const y = transformCoordinates.z(point.z, height);

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        currentIndex++;
        animationRef.current = requestAnimationFrame(animate);
      };

      animate();
    },
    [shotDataList, userDistance, transformCoordinates],
  );
  // 메인 렌더링 로직
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = topviewRef.current;
    if (!canvas || !container) return;

    const { width, height } = container.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 기존 애니메이션 정리
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    drawBackground(ctx, width, height);
    drawPreviousShots(ctx, width, height);
    animateCurrentShot(ctx, width, height);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawBackground, drawPreviousShots, animateCurrentShot]);

  return (
    <div className="w-full h-full">
      <div
        className="relative w-full h-full rounded-[8px] overflow-hidden"
        style={{
          backgroundImage: 'url(./images/topview.jpg)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
        }}
        ref={topviewRef}
      >
        <canvas
          ref={canvasRef}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
        />
        <div className="absolute bottom-0 left-0 w-full h-[88px] flex items-end text-[#C0C0C5] bg-gradient-to-t from-[rgba(0,0,0,0.5)] to-[rgba(0,0,0,0)]">
          <ul className="flex flex-wrap p-[12px] leading-[24px]">
            {CLUB_TYPE.map((item, index) => (
              <li className="w-[72px] flex items-center gap-[4px]" key={index}>
                <span className="w-[16px] h-[16px] flex items-center justify-center relative">
                  <span
                    className="absolute left-0 top-0 w-full h-full rounded-full"
                    style={{
                      backgroundColor:
                        item.type ===
                        shotDataList[shotDataList.length - 1]?.clubType
                          ? `${item.color}50`
                          : 'transparent',
                    }}
                  />
                  <span
                    className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[8px] h-[8px] rounded-full"
                    style={{
                      backgroundColor:
                        item.type ===
                        shotDataList[shotDataList.length - 1]?.clubType
                          ? item.color
                          : 'transparent',
                      border:
                        item.type !==
                        shotDataList[shotDataList.length - 1]?.clubType
                          ? `2px solid ${item.color}`
                          : 'none',
                    }}
                  />
                </span>
                <span className="text-[16px] font-['Helvetica Neue']">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
