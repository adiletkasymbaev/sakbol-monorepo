import { Button } from "@heroui/react";
import { useSosButton } from '../hooks/useSosButton';
import IconSos from "../icons/IconSos";

type Props = {
  size?: number;
  stroke?: number;
  className?: string;
};

function calcRing(size: number, stroke: number, progress: number) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);

  return { radius, circumference, dashOffset };
}

export default function SosButton({ size = 48, stroke = 3, className = "" }: Props) {
  const { progress, handlers } = useSosButton();

  const { radius, circumference, dashOffset } = calcRing(size, stroke, progress);

  return (
    <div className={`sos-button-wrap relative flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="absolute pointer-events-none">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke="rgba(249,204,36,0.95)"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 120ms linear, opacity 200ms",
            opacity: progress > 0 ? 1 : 0,
          }}
        />
      </svg>

      <Button isIconOnly className="sos-button relative z-10" {...handlers}>
        <IconSos />
      </Button>
    </div>
  );
}