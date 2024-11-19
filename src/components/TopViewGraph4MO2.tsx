import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

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

// 디바운스 유틸리티 함수 -> 리사이즈 이벤트 발생 시 연속적인 상태 업데이트 방지
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout; // 클로저
  return function executedFunction(...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait); // timer 값의 scope를 할당하고 함수가 지정된 시간에 작동되도록 스케줄링
  };
}

function getClubColor(clubType: number): string {
  return CLUB_TYPE.find((club) => club.type === clubType)?.color || '#fff';
}

export function TopViewGraph4({
  shotDataList,
  userDistance,
}: TopViewGraphProps) {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  const currentClubTypeRef = useRef<number>(999);
  const [curShot, setCurShot] = useState<number>(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const gridImageRef = useRef<ImageData | null>(null);
  const coordCacheRef = useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  );

  // 좌표 변환 함수 메모이제이션
  const getTrajectoryData = useCallback(
    (shot: ShotDataListType) =>
      userDistance === 'yard' ? shot.trajectoryYardData : shot.trajectoryData,
    [userDistance],
  );

  // maxValue 계산 메모이제이션
  const calculateMaxValue = useCallback(() => {
    const zValues = shotDataList.map((shot) => {
      const data = getTrajectoryData(shot);
      return data[data.length - 1].z;
    });

    const xValues = shotDataList.map((shot) => {
      const data = getTrajectoryData(shot);
      return data[data.length - 1].x;
    });

    const maxXValue = Math.max(...xValues);
    const maxZValue = Math.max(...zValues) < 40 ? 50 : Math.max(...zValues);
    const adjustedMaxZValue = Math.ceil((maxZValue + 20) / 10) * 10;
    const baseZValue = 95;
    const incrementPerRange = 45;
    const rangeIndex = Math.floor(maxXValue / 10);
    const rangeMaxZValue = baseZValue + rangeIndex * incrementPerRange;
    return Math.max(adjustedMaxZValue, rangeMaxZValue);
  }, [shotDataList, getTrajectoryData]);

  const maxValue = useMemo(() => calculateMaxValue(), [calculateMaxValue]);

  // 좌표 변환 함수 최적화
  const toCanvasCoord = useCallback(
    (x: number, z: number) => {
      const cacheKey = `${x}-${z}`;
      if (coordCacheRef.current.has(cacheKey)) {
        return coordCacheRef.current.get(cacheKey)!;
      } // 좌표 계산 캐싱 추가

      const coord = {
        x: dimensions.width / 2 + ((x / maxValue) * dimensions.width) / 2,
        y: dimensions.height - (z / maxValue) * dimensions.height,
      };

      coordCacheRef.current.set(cacheKey, coord);
      return coord;
    },
    [dimensions.width, dimensions.height, maxValue],
  );

  // 리사이즈 핸들러 - 디바운스 적용
  useEffect(() => {
    const handleResize = debounce(() => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
      gridImageRef.current = null; // 그리드 캐시 초기화
      coordCacheRef.current.clear(); // 좌표 캐시 초기화
    }, 500);

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize); // 클린업
  }, []);

  // 그리드 그리기
  useEffect(() => {
    if (!gridCanvasRef.current || !dimensions.width || !dimensions.height)
      return;

    const gridCanvas = gridCanvasRef.current;
    const gridCtx = gridCanvas.getContext('2d')!;

    gridCanvas.width = dimensions.width;
    gridCanvas.height = dimensions.height;

    // 매번 캔버스를 그리지 않고 캐시된 그리드가 있으면 사용
    if (gridImageRef.current) {
      gridCtx.putImageData(gridImageRef.current, 0, 0);
      return;
    }

    // svg -> canvas로 변경
    function drawGrid() {
      const step = 10;
      const totalGrids = maxValue / step;
      const cx = dimensions.width / 2;
      const cy = dimensions.height;

      // 반원 그리기
      for (let i = 1; i <= totalGrids; i++) {
        const radius = (i / totalGrids) * dimensions.height;

        gridCtx.beginPath();
        gridCtx.arc(cx, cy, radius, Math.PI, 0);
        gridCtx.strokeStyle = '#fff';
        gridCtx.lineWidth = 1;

        if (i % 5 === 0) {
          gridCtx.globalAlpha = 0.5;
          gridCtx.setLineDash([]);
        } else {
          gridCtx.setLineDash([2, 2]);
          gridCtx.globalAlpha = 0.3;
        }

        gridCtx.stroke();

        if ((i * step) % 50 === 0) {
          gridCtx.setLineDash([]);
          gridCtx.globalAlpha = 1;
          gridCtx.font = '20px Helvetica';
          gridCtx.fillStyle = '#fff';
          gridCtx.textAlign = 'left';
          gridCtx.fillText((i * step).toString(), 16, cy - radius + 10);
        }
      }

      // 수직선 그리기
      const lineSpacing = dimensions.height / totalGrids;
      const halfLineCount = totalGrids / 2;

      gridCtx.beginPath();
      gridCtx.setLineDash([]);
      gridCtx.globalAlpha = 0.5;
      gridCtx.moveTo(cx, 0);
      gridCtx.lineTo(cx, dimensions.height);
      gridCtx.stroke();

      gridCtx.setLineDash([2, 2]);
      gridCtx.globalAlpha = 0.3;

      for (let i = 1; i <= halfLineCount; i++) {
        const offset = i * lineSpacing;
        gridCtx.beginPath();
        gridCtx.moveTo(cx - offset, 0);
        gridCtx.lineTo(cx - offset, dimensions.height);
        gridCtx.moveTo(cx + offset, 0);
        gridCtx.lineTo(cx + offset, dimensions.height);
        gridCtx.stroke();
      }
    }

    drawGrid();
    // 그리드 이미지 캐싱
    gridImageRef.current = gridCtx.getImageData(
      0,
      0,
      dimensions.width,
      dimensions.height,
    );
  }, [dimensions, maxValue]);

  // 애니메이션
  useEffect(() => {
    if (
      !mainCanvasRef.current ||
      !dimensions.width ||
      !dimensions.height ||
      !shotDataList.length
    )
      return;

    const mainCanvas = mainCanvasRef.current;
    const mainCtx = mainCanvas.getContext('2d')!;

    mainCanvas.width = dimensions.width;
    mainCanvas.height = dimensions.height;

    let lastDrawTime = 0;
    const FPS = 60;
    const frameDelay = 1000 / FPS;

    function drawPoint(x: number, y: number, color: string, isFinal = false) {
      mainCtx.beginPath();
      mainCtx.fillStyle = color;

      if (isFinal) {
        mainCtx.globalAlpha = 0.5;
        mainCtx.arc(x, y, 16, 0, Math.PI * 2);
        mainCtx.fill();

        mainCtx.beginPath();
        mainCtx.globalAlpha = 1;
        mainCtx.strokeStyle = '#fff';
        mainCtx.lineWidth = 1;
        mainCtx.arc(x, y, 16, 0, Math.PI * 2);
        mainCtx.stroke();

        mainCtx.beginPath();
        mainCtx.arc(x, y, 8, 0, Math.PI * 2);
        mainCtx.fill();
      } else {
        mainCtx.globalAlpha = 1;
        mainCtx.arc(x, y, 6, 0, Math.PI * 2);
        mainCtx.fill();
      }
    }

    function drawPreviousShots() {
      shotDataList.slice(0, -1).forEach((shot) => {
        const trajectory = getTrajectoryData(shot);
        const lastPoint = trajectory[trajectory.length - 1];
        const { x, y } = toCanvasCoord(lastPoint.x, lastPoint.z);
        drawPoint(x, y, getClubColor(shot.clubType));
      });
    }

    const currentShot = shotDataList[shotDataList.length - 1];
    setCurShot(currentShot.clubType);
    const points = getTrajectoryData(currentShot);
    const color = getClubColor(currentShot.clubType);
    currentClubTypeRef.current = currentShot.clubType;
    let startTime: number;

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;

      // FPS 제한
      if (timestamp - lastDrawTime < frameDelay) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      lastDrawTime = timestamp;
      const progress = (timestamp - startTime) / 2000;

      mainCtx.clearRect(0, 0, dimensions.width, dimensions.height);
      drawPreviousShots();

      const index = Math.min(
        Math.floor(progress * points.length),
        points.length - 1,
      );

      const point = points[index];
      const { x, y } = toCanvasCoord(point.x, point.z);
      drawPoint(x, y, color, index === points.length - 1);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    }

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      coordCacheRef.current.clear(); // 클린업
    };
  }, [
    shotDataList,
    userDistance,
    dimensions,
    getTrajectoryData,
    toCanvasCoord,
  ]);

  return (
    <div className="w-full h-full" ref={containerRef}>
      <div
        className="relative w-full h-full rounded-[8px] overflow-hidden"
        style={{
          backgroundImage: 'url(./images/topview.jpg)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
        }}
      >
        <canvas
          ref={gridCanvasRef}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-full"
        />
        <canvas
          ref={mainCanvasRef}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-full"
        />
        <div className="absolute bottom-0 left-0 w-full h-[88px] flex items-end text-[#C0C0C5] bg-gradient-to-t from-[rgba(0,0,0,0.5)] to-[rgba(0,0,0,0)]">
          <ul className="flex flex-wrap p-[12px] leading-[24px]">
            {CLUB_TYPE.map(({ type, color, label }) => (
              <li className="w-[72px] flex items-center gap-[4px]" key={type}>
                <span className="w-[16px] h-[16px] flex items-center justify-center relative">
                  <span
                    className="absolute left-0 top-0 w-full h-full rounded-full"
                    style={{
                      backgroundColor: type === curShot ? color : 'transparent',
                      opacity: type === curShot ? 0.5 : 1,
                    }}
                  />
                  <span
                    className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[8px] h-[8px] rounded-full
                      ${type === curShot ? 'border-none' : 'border-2 box-content'}`}
                    style={{
                      backgroundColor: type === curShot ? color : 'transparent',
                      borderColor: type !== curShot ? color : '',
                    }}
                  />
                </span>
                <span className="text-[16px] font-helvetica">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
