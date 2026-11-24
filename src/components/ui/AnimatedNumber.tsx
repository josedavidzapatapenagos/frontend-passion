import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  formatter?: (value: number) => string;
  className?: string;
};

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export const AnimatedNumber = ({ value, duration = 900, decimals = 0, prefix = "", suffix = "", formatter, className }: Props) => {
  const [displayValue, setDisplayValue] = useState(0);
  const fromValueRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const fromValue = fromValueRef.current;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = easeOutExpo(progress);
      const current = fromValue + (value - fromValue) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromValueRef.current = value;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value, duration]);

  const text = formatter
    ? formatter(displayValue)
    : `${prefix}${displayValue.toLocaleString("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;

  return <span className={className}>{text}</span>;
};
