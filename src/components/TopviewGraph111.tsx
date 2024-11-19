import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type TrajectoryDataType = { x: number; y: number; z: number };

type ShotDataListType = {
  trajectoryData: TrajectoryDataType[];
  trajectoryYardData: TrajectoryDataType[];
  clubType: number;
  maxXvalue: number;
  carry: number;
  id: string;
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
];

export const TopViewGraph111 = ({
  shotDataList,
  userDistance = 'meter',
}: TopViewGraphProps) => {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null); // 배경용 캔버스
  // const animationCanvasRef = useRef<HTMLCanvasElement>(null); // 애니메이션용 캔버스
  const topviewRef = useRef<HTMLDivElement | null>(null);
  const [currentClubType, setCurrentClubType] = useState(999);
  const [maxDataValue, setMaxDataValue] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 800, height: 800 });
  const CONTAINER_HEIGHT = dimensions.height;
  const PIXEL_CENTER_START_X = dimensions.height / 2;

  // x축 조정 함수
  const adjustedX = useCallback(
    (value: number) => {
      if (maxDataValue === 0 || maxDataValue === undefined) return 0;
      const normalizedValue = value / maxDataValue;
      const totalWidth = dimensions.height;
      return parseFloat(
        (normalizedValue * totalWidth + dimensions.height / 2).toFixed(1),
      );
    },
    [dimensions.height, maxDataValue, userDistance],
  );

  // Y축 조정 함수
  const adjustedConvertY = useCallback(
    (r: number, xValue: number, lastZ: number = 1, carry: number = 1) => {
      if (maxDataValue === 0 || maxDataValue === undefined) return 0;
      // 원의 방정식을 이용해 반원에서 y 값을 계산
      // x^2 + y^2 = r^2 이므로, 이를 변형하면 y = sqrt(r^2 - x^2)로 계산 가능
      // 호정님넘겨준캐리값 / 마지막배열 z
      const result =
        Math.sqrt(Math.pow(r, 2) - Math.pow(xValue, 2)) * (carry / lastZ);

      if (isNaN(result))
        return CONTAINER_HEIGHT - (r / maxDataValue) * CONTAINER_HEIGHT;

      // 계산된 값을 바탕으로 yPosition으로 위치 재설정
      const yPosition =
        CONTAINER_HEIGHT - (result / maxDataValue) * CONTAINER_HEIGHT;

      return parseFloat(yPosition.toFixed(1));
    },
    [CONTAINER_HEIGHT, maxDataValue],
  );

  // const adjustedConvertY = useCallback(
  //   (r: number, xValue: number, lastZ: number = 1, carry: number = 1) => {
  //     if (maxDataValue === 0 || maxDataValue === undefined) return 0;

  //     // xValue는 원의 중심으로부터의 거리이므로,
  //     // (x - cx)² + (y - cy)² = r² 형태가 되어야 합니다.
  //     // 여기서 cy는 CONTAINER_HEIGHT이므로
  //     const result =
  //       CONTAINER_HEIGHT -
  //       Math.sqrt(Math.pow(r, 2) - Math.pow(xValue - CONTAINER_HEIGHT / 2, 2)) *
  //         (carry / lastZ);

  //     if (isNaN(result))
  //       return CONTAINER_HEIGHT - (r / maxDataValue) * CONTAINER_HEIGHT;

  //     return parseFloat(result.toFixed(1));
  //   },
  //   [CONTAINER_HEIGHT, maxDataValue],
  // );

  const convertedShotList = useMemo(() => {
    const lastShotList = shotDataList[shotDataList.length - 1];
    const carray = lastShotList.carry;
    const trajectory =
      userDistance === 'meter'
        ? lastShotList.trajectoryData
        : lastShotList.trajectoryYardData;
    const adjustedTrajectoryData =
      shotDataList[shotDataList.length - 1].trajectoryData?.map(
        (coordinate) => {
          return {
            x: adjustedX(coordinate.x),
            y: coordinate.y,
            z: adjustedConvertY(
              coordinate.z,
              coordinate.x,
              trajectory[trajectory.length - 1].z,
              carray,
            ),
          };
        },
      ) || [];

    const adjustedTrajectoryYardData =
      shotDataList[shotDataList.length - 1].trajectoryYardData?.map(
        (coordinate) => {
          return {
            x: adjustedX(coordinate.x),
            y: coordinate.y,
            z: adjustedConvertY(
              coordinate.z,
              coordinate.x,
              trajectory[trajectory.length - 1].z,
              carray,
            ),
          };
        },
      ) || [];

    const result = {
      trajectoryData: adjustedTrajectoryData,
      trajectoryYardData: adjustedTrajectoryYardData,
      clubType: shotDataList[shotDataList.length - 1].clubType,
    };

    return result || null;
  }, [adjustedConvertY, adjustedX, shotDataList]);

  useEffect(() => {
    if (topviewRef.current) {
      const { width, height } = topviewRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, []);

  // maxValue 구하는 부분
  useEffect(() => {
    const svg = svgRef.current;
    if (svg) {
      const outerCircles = svg.querySelectorAll('.current-outer-circle');
      const decoCircles = svg.querySelectorAll('.current-deco-circle');
      const innerCircles = svg.querySelectorAll('.current-inner-circle');

      outerCircles.forEach((circle) => circle.remove());
      decoCircles.forEach((circle) => circle.remove());
      innerCircles.forEach((circle) => circle.remove());
    }
    // 샷데이터가 1개이상이면
    if (shotDataList.length > 0) {
      // 가장 마지막 샷의 clubType 확인
      // zValues : 그동안 쳤던 샷 최종 거리 구하기(z값)
      const zValues = shotDataList.map((data: ShotDataListType) => data.carry);

      const xValues = shotDataList.map(
        (data: ShotDataListType) => data.maxXvalue,
      );

      // maxZValue : zValues중 가장 큰값 -> 최대값을 기준으로 좌표를 설정하기 위해
      const maxXValue = Math.max(...xValues);
      const maxZValue = Math.max(...zValues) < 40 ? 50 : Math.max(...zValues);

      // x값에 따라 maxDataValue를 재설정
      const calculateFinalMaxZValue = (
        adjustedMaxZValue: number,
        maxXValue: number,
      ) => {
        // maxXValue에 따른 maxZValue를 계산
        const baseZValue = 95;
        const incrementPerRange = 45; // 55씩 증가하는 값

        // maxXValue의 범위에 따라 후자의 값을 결정
        const rangeIndex = Math.floor(maxXValue / 10);
        const rangeMaxZValue = baseZValue + rangeIndex * incrementPerRange;

        // adjustedMaxZValue가 rangeMaxZValue보다 작으면 rangeMaxZValue를 사용
        return Math.max(adjustedMaxZValue, rangeMaxZValue);
      };

      // 예시로, 현재 값을 설정하는 부분
      const adjustedMaxZValue = Math.ceil((maxZValue + 20) / 10) * 10;

      // 최종 maxDataValue 결정
      const finalMaxZValue = calculateFinalMaxZValue(
        adjustedMaxZValue,
        maxXValue,
      );
      setMaxDataValue(finalMaxZValue);
    }
  }, [shotDataList, userDistance]);

  // 배경 (x그리드, y그리드, 거리수치)
  useEffect(() => {
    const canvas = backgroundCanvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Canvas 초기화
    context.clearRect(0, 0, canvas.width, canvas.height);

    const adjustedY = (value: number) => {
      const containerHeight = dimensions.height;
      return containerHeight - (value / maxDataValue) * containerHeight;
    };

    // X 좌표를 중앙을 기준으로 조정하는 함수
    const adjustedX = (value: number) => {
      const containerWidth = dimensions.height;
      const centerX = containerWidth / 2;
      return centerX + value;
    };

    const svgHeight = dimensions.height;
    const step = 10;
    const totalLines = maxDataValue / step;
    const lineSpacing = dimensions.height / totalLines;
    const halfLineCount = totalLines / 2;
    const maxRadius = dimensions.height;
    const cx = dimensions.height / 2;
    const cy = dimensions.height;

    // 폰트 설정 및 텍스트 색상
    const fontSize = 20;
    context.font = `${fontSize}px Bebas Neue`;
    context.fillStyle = '#fff'; // 텍스트 투명도 1

    // 원 그리기
    for (let i = 1; i <= totalLines; i++) {
      const radius = (i / totalLines) * maxRadius;

      context.beginPath();
      context.arc(cx, cy, radius, 0, 2 * Math.PI);
      context.strokeStyle = '#fff';
      context.lineWidth = 1;

      if (i % 5 === 0) {
        context.globalAlpha = 0.5;
      } else {
        context.setLineDash([2, 2]);
        context.globalAlpha = 0.3;
      }

      context.stroke();
      context.setLineDash([]); // Reset dash
      context.globalAlpha = 1;
    }

    // 중앙 라인 그리기
    context.beginPath();
    context.moveTo(dimensions.height / 2, 0);
    context.lineTo(dimensions.height / 2, svgHeight);
    context.strokeStyle = '#fff';
    context.setLineDash([]);
    context.globalAlpha = 0.5;
    context.stroke();

    // 왼쪽 및 오른쪽 라인 그리기
    for (let i = 1; i <= halfLineCount; i++) {
      const xPositionLeft = adjustedX(-(i * lineSpacing));
      const xPositionRight = adjustedX(i * lineSpacing);

      context.beginPath();
      context.moveTo(xPositionLeft, 0);
      context.lineTo(xPositionLeft, svgHeight);
      context.strokeStyle = '#fff';
      context.setLineDash([2, 2]);
      context.globalAlpha = 0.3;
      context.stroke();

      context.beginPath();
      context.moveTo(xPositionRight, 0);
      context.lineTo(xPositionRight, svgHeight);
      context.stroke();
    }

    // 거리 수치(y-axis 텍스트) 추가
    context.globalAlpha = 1; // 텍스트 투명도를 1로 설정
    for (let i = step; i <= maxDataValue + step; i += step) {
      const yPosition = adjustedY(i);

      // 50의 배수일 경우 텍스트 추가
      if (i % 50 === 0) {
        const xPosition = dimensions.height / 2 - dimensions.width / 2 + 16;
        context.fillText(i.toString(), xPosition, yPosition + fontSize / 2);
      }
    }

    // Reset styles to avoid affecting future drawings
    context.setLineDash([]);
    context.globalAlpha = 1;
  }, [maxDataValue, userDistance, dimensions.height, dimensions.width]);

  // 이전원 구하는 그리는 부분
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // canvas가 null일 경우 처리
    const context = canvas.getContext('2d');
    if (!context) return; // context가 null일 경우 처리

    // Canvas 초기화: 이전의 원을 지웁니다
    context.clearRect(0, 0, canvas.width, canvas.height);

    // 이전에 있던 원(샷) 좌표 그리는 부분
    if (shotDataList.length > 1) {
      const circleCoordinateList = [];

      for (let i = 0; i < shotDataList.length; i++) {
        const trajectoryData =
          userDistance === 'yard'
            ? shotDataList[i].trajectoryYardData // yard 데이터
            : shotDataList[i].trajectoryData; // meter 데이터

        if (i < shotDataList.length - 1) {
          circleCoordinateList.push({
            x: trajectoryData[trajectoryData.length - 1].x,
            z: trajectoryData[trajectoryData.length - 1].z,
          });
        }
      }

      // 원을 캔버스에 그립니다
      circleCoordinateList.forEach((circleCoordinate, index) => {
        const lastX = adjustedX(circleCoordinate.x);
        const lastY = adjustedConvertY(circleCoordinate.z, circleCoordinate.x); // Y축 조정

        const radius = 6; // 반경을 6px로 설정
        const clubType = shotDataList[index].clubType;
        const fillColor = getFillColorByClubType(clubType);

        // 원을 canvas에 그리기
        context.beginPath();
        context.arc(lastX, lastY, radius, 0, Math.PI * 2); // 원 그리기
        context.fillStyle = fillColor;
        context.fill();
        context.closePath();
      });
    }
  }, [adjustedConvertY, adjustedX, shotDataList, userDistance]);

  // shot 구하는 공식
  useEffect(() => {
    if (convertedShotList.trajectoryData.length > 0) {
      const currentClubType = convertedShotList && convertedShotList.clubType;
      setCurrentClubType(currentClubType);

      const svg = svgRef.current;
      let deltaTime;
      let previousTime = performance.now();
      let raf: number;
      let sumTime = 0;

      const startAnimation = () => {
        const startTime = performance.now();
        previousTime = startTime;
        animate(startTime);
      };

      // 현재 원(샷) 그리는 부분 -> 애니메이션 필요
      const drawCurrentCircle = (
        svg: SVGSVGElement,
        lastX: number,
        lastY: number,
        fillColor: string,
        isAnimationEnd: boolean,
      ) => {
        const decoRadius = isAnimationEnd ? 16 : 6;
        const outerRadius = isAnimationEnd ? 16 : 6; // 애니메이션이 끝났을 때 큰 원, 아니면 작은 원
        const innerRadius = isAnimationEnd ? 8 : 0; // 애니메이션이 끝났을 때 내부 원, 아니면 없음

        let outerCircle: SVGCircleElement | null = svg.querySelector(
          '.current-outer-circle',
        );

        if (!outerCircle) {
          outerCircle = document.createElementNS(svgNS, 'circle');
          outerCircle.setAttribute('cx', lastX.toString());
          outerCircle.setAttribute('cy', lastY.toString());
          outerCircle.setAttribute('r', '6'); // 초기 반지름을 작은 원으로 설정
          outerCircle.setAttribute('fill', fillColor);
          // outerCircle.setAttribute("opacity", "1"); // 초기 opacity 설정
          outerCircle.classList.add('current-outer-circle');
        }

        outerCircle.setAttribute('cx', lastX.toString());
        outerCircle.setAttribute('cy', lastY.toString());

        // 외부 원
        svg.appendChild(outerCircle); // 외부 원 추가

        // 내부 원 (애니메이션이 끝났을 때만 그리기)
        if (isAnimationEnd) {
          const decoCircle = document.createElementNS(svgNS, 'circle');
          decoCircle.setAttribute('r', '0'); // 초기 반지름을 작은 원으로 설정
          decoCircle.setAttribute('fill', 'transparent'); // 내부 색을 투명하게 설정
          decoCircle.setAttribute('stroke', 'white');
          decoCircle.setAttribute('stroke-width', '1');
          decoCircle.classList.add('current-deco-circle');
          decoCircle.setAttribute('cx', lastX.toString());
          decoCircle.setAttribute('cy', lastY.toString());
          svg.appendChild(decoCircle);

          if (decoCircle) {
            decoCircle.style.transition = 'r 0.5s ease, opacity 0.5s ease';
          }

          const innerCircle = document.createElementNS(svgNS, 'circle');
          innerCircle.setAttribute('cx', lastX.toString());
          innerCircle.setAttribute('cy', lastY.toString());
          innerCircle.setAttribute('r', '0'); // 초기 반지름을 0으로 설정
          innerCircle.setAttribute('fill', fillColor);
          innerCircle.classList.add('current-inner-circle');

          svg.appendChild(innerCircle); // 내부 원 추가

          // 애니메이션 적용
          setTimeout(() => {
            if (outerCircle) {
              outerCircle.setAttribute('r', outerRadius.toString()); // 애니메이션 끝난 후의 반지름
              outerCircle.setAttribute('opacity', isAnimationEnd ? '0.5' : '1'); // 투명도 적용
              outerCircle.style.transition = 'r 0.5s ease, opacity 0.5s ease';
            }

            if (decoCircle) {
              decoCircle.setAttribute('r', decoRadius.toString());
            }
            innerCircle.setAttribute('r', innerRadius.toString()); // 내부 원 반지름 애니메이션 적용
          }, 0);
        }

        // transition 설정

        if (isAnimationEnd) {
          const innerCircle = svg.querySelector(
            '.current-inner-circle',
          ) as SVGCircleElement;
          if (innerCircle) {
            innerCircle.style.transition = 'r 0.5s ease';
          }
        }
      };

      const animate = (currentTime: number) => {
        if (previousTime === 0) {
          previousTime = currentTime;
        }

        deltaTime = (currentTime - previousTime) / 1000; // 초로 바꾸기
        previousTime = currentTime;
        sumTime += deltaTime;

        const index = Math.min(
          convertedShotList.trajectoryData.length,
          Math.max(2, Math.ceil(sumTime / 0.02)),
        );

        const isAnimationEnd = index >= convertedShotList.trajectoryData.length;

        if (svg) {
          // path 만 즉 라인을 제거
          const clubType = convertedShotList && convertedShotList.clubType;
          const fillColor = getFillColorByClubType(clubType);

          const lastX =
            index <= convertedShotList.trajectoryData.length
              ? convertedShotList.trajectoryData[index - 1].x
              : convertedShotList.trajectoryData[
                  convertedShotList.trajectoryData.length - 1
                ].x + PIXEL_CENTER_START_X;
          // 기존 adjustedY 방식으로 y 값을 재조정
          const lastY =
            index <= convertedShotList.trajectoryData.length
              ? convertedShotList.trajectoryData[index - 1].z
              : convertedShotList.trajectoryData[
                  convertedShotList.trajectoryData.length - 1
                ].z;

          drawCurrentCircle(svg, lastX, lastY, fillColor, isAnimationEnd); // 원 그리기
        }

        if (index < convertedShotList.trajectoryData.length) {
          raf = requestAnimationFrame(animate); // 다음 프레임 요청
        }
      };

      startAnimation();
      return () => {
        cancelAnimationFrame(raf);
      };
    }
  }, [convertedShotList, dimensions.height]);

  return (
    <div className="w-full h-full">
      {/* 기존코드 영역 h-full w-full로 조정*/}
      <div
        className="relative w-full h-full rounded-[8px] overflow-hidden"
        style={{
          backgroundImage: 'url(/images/topview.jpg)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
        }}
        ref={topviewRef}
      >
        <canvas
          ref={backgroundCanvasRef} // 배경용 캔버스
          width={dimensions.height}
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
                      backgroundColor: `${
                        item.type === currentClubType
                          ? item.color
                          : 'transparent'
                      }`,
                    }}
                  ></span>
                  <span
                    className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[8px] h-[8px] rounded-full ${
                      item.type === currentClubType
                        ? 'border-none'
                        : `border-2 box-content`
                    }`}
                    style={{
                      backgroundColor: `${
                        item.type === currentClubType
                          ? item.color
                          : 'transparent'
                      }`,
                      borderColor: `${
                        item.type !== currentClubType ? item.color : ''
                      }`,
                    }}
                  ></span>
                </span>
                <span
                  style={{ fontFamily: 'Helvetica Neue' }}
                  className="text-[16px]"
                >
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <canvas
          ref={canvasRef}
          width={dimensions.height}
          height={dimensions.height}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
        />

        <svg
          ref={svgRef}
          width={dimensions.height}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.height} ${dimensions.height}`}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
        ></svg>
      </div>
    </div>
  );
};

function getFillColorByClubType(clubType: number): string {
  switch (clubType) {
    case 0:
      return '#6AA6E6';
    case 1:
      return '#42A96F';
    case 2:
      return '#DACA6B';
    case 3:
      return '#E78C73';
    case 4:
      return '#C9AE92';
    default:
      return '#fff';
  }
}
