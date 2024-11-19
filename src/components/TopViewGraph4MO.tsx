import { useEffect, useRef, useState } from 'react';

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

  // 유틸리티 함수들
  const getTrajectoryData = (shot: ShotDataListType) =>
    userDistance === 'yard' ? shot.trajectoryYardData : shot.trajectoryData;

  const calculateMaxValue = () => {
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
  };

  // 그리드 그리기를 위한 useEffect
  useEffect(() => {
    if (!containerRef.current || !gridCanvasRef.current || !shotDataList.length)
      return;

    const { width, height } = containerRef.current.getBoundingClientRect();
    const gridCanvas = gridCanvasRef.current;
    const gridCtx = gridCanvas.getContext('2d')!;

    gridCanvas.width = width;
    gridCanvas.height = height;

    const maxValue = calculateMaxValue();

    function drawGrid() {
      const step = 10;
      const totalGrids = maxValue / step;
      const cx = width / 2;
      const cy = height;

      // 반원 그리기
      for (let i = 1; i <= totalGrids; i++) {
        const radius = (i / totalGrids) * height;

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

        // 거리 텍스트
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
      const lineSpacing = height / totalGrids;
      const halfLineCount = totalGrids / 2;

      // 중앙 수직선
      gridCtx.beginPath();
      gridCtx.setLineDash([]);
      gridCtx.globalAlpha = 0.5;
      gridCtx.moveTo(cx, 0);
      gridCtx.lineTo(cx, height);
      gridCtx.stroke();

      // 좌우 수직선
      gridCtx.setLineDash([2, 2]);
      gridCtx.globalAlpha = 0.3;

      for (let i = 1; i <= halfLineCount; i++) {
        const offset = i * lineSpacing;

        // 왼쪽
        gridCtx.beginPath();
        gridCtx.moveTo(cx - offset, 0);
        gridCtx.lineTo(cx - offset, height);
        gridCtx.stroke();

        // 오른쪽
        gridCtx.beginPath();
        gridCtx.moveTo(cx + offset, 0);
        gridCtx.lineTo(cx + offset, height);
        gridCtx.stroke();
      }
    }

    drawGrid();
  }, [shotDataList, userDistance]);

  // 애니메이션을 위한 useEffect
  useEffect(() => {
    if (!mainCanvasRef.current || !containerRef.current || !shotDataList.length)
      return;

    const mainCanvas = mainCanvasRef.current;
    const mainCtx = mainCanvas.getContext('2d')!;
    const { width, height } = containerRef.current.getBoundingClientRect();

    mainCanvas.width = width;
    mainCanvas.height = height;

    const maxValue = calculateMaxValue();

    const toCanvasCoord = (x: number, z: number) => ({
      x: width / 2 + ((x / maxValue) * width) / 2,
      y: height - (z / maxValue) * height,
    });

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
    console.log('Current club type:', currentShot.clubType);
    setCurShot(currentShot.clubType);
    const points = getTrajectoryData(currentShot);
    const color = getClubColor(currentShot.clubType);
    currentClubTypeRef.current = currentShot.clubType;
    let startTime: number;

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / 2000;

      mainCtx.clearRect(0, 0, width, height);
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

    // 이전 애니메이션 정리
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [shotDataList, userDistance]);

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
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
        />
        <canvas
          ref={mainCanvasRef}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
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
