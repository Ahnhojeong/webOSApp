import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';

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

export const TopviewGraph3 = ({
  shotDataList,
  userDistance = 'meter',
}: TopViewGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const isFirstRender = useRef(true);
  const previousShotsRef = useRef<{ x: number; y: number; clubType: number }[]>(
    [],
  );

  const [currentClubType, setCurrentClubType] = useState(999);
  const [dimensions, setDimensions] = useState({ width: 324, height: 824 });
  const containerRef = useRef<HTMLDivElement>(null);

  // 최적화된 maxDataValue 계산
  const { maxDataValue, processedShots } = useMemo(() => {
    if (shotDataList.length === 0) {
      return { maxDataValue: 0, processedShots: [] };
    }

    let maxX = 0;
    let maxZ = 0;
    const shots: { x: number; z: number; clubType: number }[] = [];

    shotDataList.forEach((shot) => {
      const data =
        userDistance === 'yard' ? shot.trajectoryYardData : shot.trajectoryData;
      if (data.length === 0) return;

      const lastPoint = data[data.length - 1];
      maxX = Math.max(maxX, lastPoint.x);
      maxZ = Math.max(maxZ, lastPoint.z);
      shots.push({ x: lastPoint.x, z: lastPoint.z, clubType: shot.clubType });
    });

    const baseValue = maxZ < 40 ? 50 : Math.ceil((maxZ + 20) / 10) * 10;
    const rangeValue = 95 + Math.floor(maxX / 10) * 45;
    const finalMaxValue = Math.max(baseValue, rangeValue);

    return {
      maxDataValue: finalMaxValue,
      processedShots: shots,
    };
  }, [shotDataList, userDistance]);

  // 좌표 변환 함수 최적화
  const transformCoordinates = useCallback(
    (x: number, z: number) => {
      if (maxDataValue === 0) return { x: 0, y: 0 };

      const centerX = dimensions.width / 2;
      const normalizedX = (x / maxDataValue) * dimensions.height;
      const normalizedY = (z / maxDataValue) * dimensions.height;

      return {
        x: centerX + normalizedX,
        y: dimensions.height - normalizedY,
      };
    },
    [dimensions, maxDataValue],
  );

  // 그리드 그리기 함수
  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const centerX = dimensions.width / 2;
      const step = maxDataValue / 10;

      ctx.save();

      // 반원 그리기
      for (let i = 1; i <= 10; i++) {
        const radius = (i / 10) * dimensions.height;
        ctx.beginPath();
        ctx.arc(centerX, dimensions.height, radius, Math.PI, 2 * Math.PI);

        if (i % 5 === 0) {
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.5;

          // 거리 텍스트는 5단위로만 표시
          ctx.font = '20px Bebas Neue';
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'left';
          ctx.fillText(
            (i * step).toString(),
            16,
            dimensions.height - radius + 10,
          );
        } else {
          ctx.lineWidth = 0.5;
          ctx.globalAlpha = 0.3;
          ctx.setLineDash([2, 2]);
        }

        ctx.strokeStyle = '#fff';
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 수직선 그리기
      const lineCount = 10;
      const lineSpacing = dimensions.width / (lineCount * 2);

      // 중앙선
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, dimensions.height);
      ctx.strokeStyle = '#fff';
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.stroke();

      // 좌우 보조선
      ctx.setLineDash([2, 2]);
      ctx.globalAlpha = 0.3;
      for (let i = 1; i <= lineCount; i++) {
        const xLeft = centerX - i * lineSpacing;
        const xRight = centerX + i * lineSpacing;

        ctx.beginPath();
        ctx.moveTo(xLeft, 0);
        ctx.lineTo(xLeft, dimensions.height);
        ctx.moveTo(xRight, 0);
        ctx.lineTo(xRight, dimensions.height);
        ctx.stroke();
      }

      ctx.restore();
    },
    [dimensions, maxDataValue],
  );

  // 샷 포인트 그리기 함수
  const drawShot = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      clubType: number,
      isCurrentShot: boolean,
    ) => {
      const color = CLUB_TYPE[clubType]?.color || '#fff';

      if (isCurrentShot) {
        // 외부 원
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.5;
        ctx.fill();

        // 장식 원
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, 2 * Math.PI);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
        ctx.stroke();

        // 내부 원
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      } else {
        // 이전 샷
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.globalAlpha = 1;
        ctx.fill();
      }
    },
    [],
  );

  // 메인 렌더링 함수
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 그리드 그리기
    drawGrid(ctx);

    // 이전 샷들 그리기
    processedShots.slice(0, -1).forEach((shot) => {
      const { x, y } = transformCoordinates(shot.x, shot.z);
      drawShot(ctx, x, y, shot.clubType, false);
    });

    // 현재 샷 그리기
    if (processedShots.length > 0) {
      const currentShot = processedShots[processedShots.length - 1];
      const { x, y } = transformCoordinates(currentShot.x, currentShot.z);
      drawShot(ctx, x, y, currentShot.clubType, true);
    }

    animationFrameRef.current = requestAnimationFrame(render);
  }, [drawGrid, drawShot, processedShots, transformCoordinates]);

  // 초기 설정 및 리사이즈 처리
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 렌더링 시작
  useEffect(() => {
    if (processedShots.length > 0) {
      setCurrentClubType(processedShots[processedShots.length - 1].clubType);
    }
    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render, processedShots]);

  return (
    <div className="w-[324px] h-[824px]">
      <div
        ref={containerRef}
        className="relative w-full h-full rounded-[8px] overflow-hidden"
        style={{
          backgroundImage: 'url(/images/topview.jpg)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
        }}
      >
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
        />
        <div className="absolute bottom-0 left-0 w-full h-[88px] flex items-end text-[#C0C0C5] bg-gradient-to-t from-[rgba(0,0,0,0.5)] to-[rgba(0,0,0,0)]">
          <ul className="flex flex-wrap p-[12px] leading-[24px]">
            {CLUB_TYPE.map((item, index) => (
              <li className="w-[72px] flex items-center gap-[4px]" key={index}>
                <span className="w-[16px] h-[16px] flex items-center justify-center relative">
                  <span
                    className={`absolute left-0 top-0 w-full h-full rounded-full ${
                      item.type === currentClubType
                        ? 'opacity-50'
                        : 'bg-transparent'
                    }`}
                    style={{
                      backgroundColor:
                        item.type === currentClubType
                          ? item.color
                          : 'transparent',
                    }}
                  />
                  <span
                    className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[8px] h-[8px] rounded-full ${
                      item.type === currentClubType
                        ? 'border-none'
                        : 'border-2 box-content'
                    }`}
                    style={{
                      backgroundColor:
                        item.type === currentClubType
                          ? item.color
                          : 'transparent',
                      borderColor:
                        item.type !== currentClubType ? item.color : '',
                    }}
                  />
                </span>
                <span
                  className="text-[16px]"
                  style={{ fontFamily: 'Helvetica Neue' }}
                >
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
