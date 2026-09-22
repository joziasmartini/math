interface UnitCircleProps {
  angle: number;
  showLabels?: boolean;
  showProjections?: boolean;
  className?: string;
}

const SIZE = 340;
const C = SIZE / 2;
const R = 128;

const ANGLE_LABELS = [
  { angle: 0, label: "0" },
  { angle: Math.PI / 2, label: "π/2" },
  { angle: Math.PI, label: "π" },
  { angle: -Math.PI / 2, label: "-π/2" },
];

function px(x: number) {
  return C + x * R;
}

function py(y: number) {
  return C - y * R;
}

export function UnitCircle({
  angle,
  showLabels = true,
  showProjections = true,
  className,
}: UnitCircleProps) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dirX = Math.sign(cos);
  const horizontalExtra = 24;
  const verticalExtra = 18;

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={className} role="img">
      <g stroke="rgba(145,145,145,0.25)" strokeWidth="1">
        <line x1={String(C - R)} y1={py(0.5)} x2={String(C + R)} y2={py(0.5)} />
        <line x1={String(C - R)} y1={py(-0.5)} x2={String(C + R)} y2={py(-0.5)} />
        <line x1={px(0.5)} y1={String(C - R)} x2={px(0.5)} y2={String(C + R)} />
        <line
          x1={px(-0.5)}
          y1={String(C - R)}
          x2={px(-0.5)}
          y2={String(C + R)}
        />
      </g>

      <line
        x1={px(-1.15)}
        y1={C}
        x2={px(1.15)}
        y2={C}
        stroke="#3f3f46"
        strokeWidth="1.5"
      />
      <line
        x1={C}
        y1={py(-1.15)}
        x2={C}
        y2={py(1.15)}
        stroke="#3f3f46"
        strokeWidth="1.5"
      />

      <circle cx={C} cy={C} r={R} fill="none" stroke="#09090b" strokeWidth="2" />
      <circle cx={C} cy={C} r={2.5} fill="#09090b" />

      {showLabels &&
        ANGLE_LABELS.map(({ angle: a, label }) => (
          <text
            key={label}
            x={px(Math.cos(a) * 1.3)}
            y={py(Math.sin(a) * 1.3) + 3.5}
            textAnchor="middle"
            fontFamily="var(--font-geist-mono), ui-monospace, monospace"
            fontSize="11"
            fill="#a1a1aa"
          >
            {label}
          </text>
        ))}

      {showProjections && (
        <g>
          <path
            d={`M ${px(cos)} ${py(0)} H ${px(cos)} V ${py(sin)} L ${px(0)} ${py(
              sin
            )}`}
            fill="none"
            stroke="#a1a1aa"
            strokeWidth="1.25"
            strokeDasharray="4 4"
          />
          <rect
            x={Math.min(px(0), px(cos))}
            y={py(0)}
            width={Math.abs(cos) * R}
            height={horizontalExtra}
            fill="#e4e4e7"
          />
          <rect
            x={px(0)}
            y={Math.min(py(0), py(sin))}
            width={verticalExtra}
            height={Math.abs(sin) * R}
            fill="#d4d4d8"
          />
          <text
            x={Math.min(px(0), px(cos)) + Math.abs(cos) * R / 2}
            y={py(0) + 16}
            textAnchor="middle"
            fontFamily="var(--font-geist-mono), ui-monospace, monospace"
            fontSize="11"
            fontWeight="600"
            fill="#09090b"
          >
            cosθ
          </text>
          <text
            x={px(0) + 7}
            y={Math.min(py(0), py(sin)) + Math.abs(sin) * R / 2 + 3}
            textAnchor="middle"
            fontFamily="var(--font-geist-mono), ui-monospace, monospace"
            fontSize="11"
            fontWeight="600"
            fill="#3f3f46"
          >
            sinθ
          </text>
          <path
            d={`M ${C} ${C} L ${px(cos)} ${py(sin)}`}
            stroke="#09090b"
            strokeWidth="1.5"
          />
          <circle cx={C} cy={C} r={42} fill="none" stroke="rgba(9,9,11,0.25)" />
          <circle
            cx={px(Math.cos(angle) * 0.5)}
            cy={py(Math.sin(angle) * 0.5)}
            r={5}
            fill="#fafafa"
            stroke="#09090b"
            strokeWidth="1.25"
          />
          <circle cx={px(cos)} cy={py(sin)} r={5} fill="#09090b" />
          <text
            x={px(cos) + dirX * 10}
            y={py(sin) + (sin >= 0 ? -7 : 14)}
            textAnchor={dirX > 0 ? "start" : "end"}
            alignmentBaseline={sin >= 0 ? "baseline" : "hanging"}
            fontFamily="var(--font-geist-mono), ui-monospace, monospace"
            fontSize="11"
            fontWeight="600"
            fill="#09090b"
          >
            P
          </text>
        </g>
      )}
    </svg>
  );
}