import { useFPS } from '@/hooks/useFPS';

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
