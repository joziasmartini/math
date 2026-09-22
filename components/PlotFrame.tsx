import type { ReactNode } from "react";
import {
  DEFAULT_WINDOW,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  formatPi,
  type PlotWindow,
  type Series,
  xToPx,
  xTicksAt,
  yToPx,
  yTicksAt,
} from "@/lib/plot";

interface PlotFrameProps {
  win?: PlotWindow;
  series?: Series[];
  asymptotes?: number[];
  width?: number;
  height?: number;
  showGrid?: boolean;
  showAxes?: boolean;
  showTickLabels?: boolean;
  className?: string;
  children?: ReactNode;
}

export function PlotFrame({
  win = DEFAULT_WINDOW,
  series = [],
  asymptotes = [],
  width = VIEW_WIDTH,
  height = VIEW_HEIGHT,
  showGrid = true,
  showAxes = true,
  showTickLabels = true,
  className,
  children,
}: PlotFrameProps) {
  const zeroX = xToPx(0, win, width);
  const zeroY = yToPx(0, win, height);
  const xTicks = xTicksAt(win);
  const yTicks = yTicksAt(win);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
    >
      {showGrid && (
        <g stroke="rgba(145,145,145,0.22)" strokeWidth="1">
          {xTicks.map((tick, i) => (
            <line
              key={`x${i}`}
              x1={xToPx(tick, win, width)}
              y1="0"
              x2={xToPx(tick, win, width)}
              y2={String(height)}
            />
          ))}
          {yTicks.map((tick, i) => (
            <line
              key={`y${i}`}
              x1="0"
              y1={yToPx(tick, win, height)}
              x2={String(width)}
              y2={yToPx(tick, win, height)}
            />
          ))}
        </g>
      )}

      {asymptotes.map((x, i) => {
        const px = xToPx(x, win, width);
        if (px < 0 || px > width) return null;
        return (
          <line
            key={`a${i}`}
            x1={px}
            y1="0"
            x2={px}
            y2={String(height)}
            stroke="rgba(113,113,122,0.35)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
        );
      })}

      {showAxes && (
        <g stroke="#3f3f46" strokeWidth="1.5">
          <line x1="0" y1={zeroY} x2={String(width)} y2={zeroY} />
          <line x1={zeroX} y1="0" x2={zeroX} y2={String(height)} />
        </g>
      )}

      {showTickLabels && (
        <g
          fontFamily="var(--font-geist-mono), ui-monospace, monospace"
          fontSize="10"
          fill="#a1a1aa"
        >
          {xTicks.map((tick, i) => {
            if (Math.abs(tick) < 0.5) return null;
            return (
              <text
                key={`xl${i}`}
                x={xToPx(tick, win, width)}
                y={zeroY + 16}
                textAnchor="middle"
              >
                {formatPi(tick)}
              </text>
            );
          })}
          {yTicks.map((tick, i) => {
            if (Math.abs(tick) < 1e-6) return null;
            return (
              <text
                key={`yl${i}`}
                x={zeroX + 6}
                y={yToPx(tick, win, height) + 3}
                textAnchor="start"
              >
                {formatPi(tick)}
              </text>
            );
          })}
        </g>
      )}

      <g fill="none" strokeLinejoin="round" strokeLinecap="round">
        {series.map((s, i) => (
          <path
            key={i}
            d={s.d}
            stroke={s.stroke ?? "#09090b"}
            strokeWidth={s.strokeWidth ?? 2}
            strokeDasharray={s.strokeDasharray}
            opacity={s.opacity}
          />
        ))}
      </g>

      {children}
    </svg>
  );
}