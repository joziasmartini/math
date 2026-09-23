"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";

const G = 9.81;
const FORCE_MIN = 5;
const FORCE_MAX = 11;
const WORLD_W = 11;
const WORLD_H = 6;
const SVG_W = 760;
const SVG_H = 420;
const RELEASE = { x: 1.8, y: 2.2 };
const HOOP_X = 8.45;
const RIM_FRONT = 8.0;
const RIM_BACK = 8.85;
const RIM_Y = 3.05;
const CATCH = 0.42;
const BALL_R = 12;

interface Flight {
  vx: number;
  vy: number;
}

interface Point {
  x: number;
  y: number;
}

function wx(x: number) {
  return (x / WORLD_W) * SVG_W;
}

function wy(y: number) {
  return SVG_H - (y / WORLD_H) * SVG_H;
}

function posAt(f: Flight, tt: number): Point {
  return {
    x: RELEASE.x + f.vx * tt,
    y: RELEASE.y + f.vy * tt - 0.5 * G * tt * tt,
  };
}

function willScore(f: Flight) {
  const yLo = RIM_Y - CATCH;
  const yHi = RIM_Y + CATCH;
  const tApex = f.vy / G;
  const tF = (RIM_FRONT - RELEASE.x) / f.vx;
  const tB = (RIM_BACK - RELEASE.x) / f.vx;
  const t0 = Math.max(tF, Math.min(tApex, tB));
  if (t0 >= tB) return false;
  return posAt(f, t0).y >= yLo && posAt(f, tB).y <= yHi;
}

export default function BasketballLab() {
  const [force, setForce] = useState(0.6);
  const [angle, setAngle] = useState(50);
  const [t, setT] = useState(0);
  const [trail, setTrail] = useState<Point[]>([]);
  const [frozen, setFrozen] = useState<Flight | null>(null);
  const [scored, setScored] = useState(false);
  const [ended, setEnded] = useState(false);
  const [animating, setAnimating] = useState(false);

  const flightRef = useRef<Flight>({ vx: 0, vy: 0 });
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const pendingScoreRef = useRef(false);

  const v0 = useMemo(() => FORCE_MIN + force * (FORCE_MAX - FORCE_MIN), [force]);
  const theta = (angle * Math.PI) / 180;
  const vx = useMemo(() => v0 * Math.cos(theta), [v0, theta]);
  const vy = useMemo(() => v0 * Math.sin(theta), [v0, theta]);

  const tRef = useRef(0);
  const timeOfFlight = useMemo(() => {
    const d = Math.sqrt(vy * vy + 2 * G * RELEASE.y);
    return (vy + d) / G;
  }, [vy]);

  const range = useMemo(() => RELEASE.x + vx * timeOfFlight, [vx, timeOfFlight]);
  const maxHeight = useMemo(() => RELEASE.y + (vy * vy) / (2 * G), [vy]);

  const predicted = useMemo(() => willScore({ vx, vy }), [vx, vy]);

  const predictedPath = useMemo(() => {
    let d = "";
    const N = 200;
    for (let i = 0; i <= N; i++) {
      const tt = (i / N) * timeOfFlight;
      const p = posAt({ vx, vy }, tt);
      if (p.y < 0) break;
      d += `${i === 0 ? "M" : " L"}${wx(p.x).toFixed(1)} ${wy(p.y).toFixed(1)}`;
    }
    return d;
  }, [vx, vy, timeOfFlight]);

  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  const display = frozen ? posAt(frozen, t) : RELEASE;
  const speed = frozen ? Math.hypot(frozen.vx, frozen.vy - G * t) : v0;
  const spinDeg = frozen ? ((display.x - RELEASE.x) * 2.6 * 180) / Math.PI : 0;

  function tick(now: number) {
    const f = flightRef.current;
    const last = lastTsRef.current ?? now;
    const delta = Math.min((now - last) / 1000, 0.05);
    lastTsRef.current = now;
    const next = tRef.current + delta;

    const p = posAt(f, next);
    const vyT = f.vy - G * next;

    if (
      pendingScoreRef.current &&
      p.x >= RIM_FRONT &&
      p.x <= RIM_BACK &&
      vyT < 0 &&
      p.y >= RIM_Y - CATCH &&
      p.y <= RIM_Y + CATCH
    ) {
      pendingScoreRef.current = false;
      setScored(true);
    }

    tRef.current = next;
    setT(next);
    setTrail((list) => [...list, p]);

    const onGround = p.y <= 0.02;
    const done = onGround || next >= elapsedLimit(f);
    if (!done) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      setAnimating(false);
      setEnded(true);
    }
  }

  function elapsedLimit(f: Flight) {
    const d = Math.sqrt(f.vy * f.vy + 2 * G * RELEASE.y);
    return (f.vy + d) / G + 0.5;
  }

  function launch() {
    if (animating) return;
    const f: Flight = { vx, vy };
    flightRef.current = f;
    pendingScoreRef.current = willScore(f);
    setFrozen(f);
    setTrail([]);
    setScored(false);
    setEnded(false);
    tRef.current = 0;
    lastTsRef.current = null;
    setT(0);
    setAnimating(true);
    rafRef.current = requestAnimationFrame(tick);
  }

  function reset() {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = null;
    pendingScoreRef.current = false;
    setAnimating(false);
    setFrozen(null);
    setTrail([]);
    setScored(false);
    setEnded(false);
    tRef.current = 0;
    setT(0);
  }

  const status = animating
    ? scored
      ? "CESTA ✓"
      : "VOANDO"
    : scored
      ? "CESTA ✓"
      : ended
        ? "ERROU"
        : "PRONTO";

  const trailPoints = trail.map((p) => `${wx(p.x).toFixed(1)},${wy(p.y).toFixed(1)}`).join(" ");

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            CARD 01/03 — LABORATÓRIO
          </div>
          <h3 className="mt-1 text-lg font-semibold">Basquete — tiro livre</h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span
            className={`h-2 w-2 rounded-full ${
              status === "PRONTO" ? "bg-zinc-300" : "bg-zinc-950"
            }`}
          />
          {status}
        </div>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6">
            <div className="mb-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                ENTRADA / 01
              </div>
              <h3 className="mt-1 text-lg font-semibold">Parâmetros do tiro</h3>
              <p className="mt-1 font-mono text-[10px] leading-4 text-zinc-400">
                Força e ângulo definem o lançamento balístico.
              </p>
            </div>

            <div className="space-y-5">
              <Slider
                label="Força"
                value={force}
                min={0}
                max={1}
                step={0.01}
                onChange={setForce}
                format={() => `${v0} m/s`}
              />
              <Slider
                label="Ângulo (θ)"
                value={angle}
                min={20}
                max={85}
                step={1}
                onChange={setAngle}
                format={(v) => `${v}°`}
              />
            </div>

            <div className="my-7 h-px bg-zinc-200" />

            <div className="mb-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                TRAJETÓRIA PREVISTA
              </div>
              <h3 className="mt-1 text-sm font-semibold">Fórmulas do lançamento</h3>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <Readout label="Velocidade v₀" value={`${v0.toFixed(2)} m/s`} />
              <Readout
                label="Alcance R"
                value={`${range.toFixed(2)} m`}
                sub={`Q = v₀²·sen(2θ)/g`}
              />
              <Readout
                label="Altura máx H"
                value={`${maxHeight.toFixed(2)} m`}
              />
              <Readout
                label="Tempo de voo T"
                value={`${timeOfFlight.toFixed(2)} s`}
              />
              <Readout
                label="Resultado previsto"
                value={predicted ? "cesta ✓" : "fora"}
                sub={`banda do aro ±${CATCH.toFixed(2)} m`}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6">
            <div className="mb-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                EXECUÇÃO / 02
              </div>
              <h3 className="mt-1 text-lg font-semibold">Arremesso</h3>
            </div>

            <div className="space-y-3">
              <button
                onClick={launch}
                disabled={animating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Play className="h-3.5 w-3.5" />
                Atirar
              </button>
              <button
                onClick={reset}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider transition hover:border-zinc-950 hover:bg-zinc-950 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Resetar
              </button>
            </div>

            <div className="my-6 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200">
              <SummaryStat label="Estado" value={status} />
              <SummaryStat label="Força" value={v0.toFixed(1)} />
              <SummaryStat label="Ângulo" value={`${angle}°`} />
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                CENA 2D / 03
              </div>
              <p className="mt-1 font-semibold">Ginásio — vista lateral</p>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
              cesta a {HOOP_X}m · aro a {RIM_Y}m
            </span>
          </div>

          <div className="relative mt-3 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="h-auto w-full">
              <g stroke="rgba(145,145,145,0.15)" strokeWidth="1">
                {[1, 2, 3, 4, 5].map((y) => (
                  <line key={y} x1="0" y1={wy(y)} x2={String(SVG_W)} y2={wy(y)} />
                ))}
                {[1, 3, 5, 7, 9].map((x) => (
                  <line key={x} x1={wx(x)} y1="0" x2={wx(x)} y2={String(SVG_H)} />
                ))}
              </g>

              <rect x="0" y={wy(0)} width={String(SVG_W)} height={String(SVG_H - wy(0))} fill="#fafafa" />
              <line x1="0" y1={wy(0)} x2={String(SVG_W)} y2={wy(0)} stroke="#a1a1aa" strokeWidth="1.5" />

              {[0, 2, 4, 6, 8, 10].map((x) => (
                <text
                  key={x}
                  x={wx(x)}
                  y={wy(0) + 16}
                  textAnchor="middle"
                  fontFamily="var(--font-geist-mono), ui-monospace, monospace"
                  fontSize="9"
                  fill="#c4c4c4"
                >
                  {x}
                </text>
              ))}

              <polyline
                points={trailPoints}
                fill="none"
                stroke="#09090b"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              <path
                d={predictedPath}
                fill="none"
                stroke="#a1a1aa"
                strokeWidth="1.25"
                strokeDasharray="6 6"
              />

              <g>
                <rect x={wx(8.85)} y={wy(4.05)} width={wx(9.4) - wx(8.85)} height={wy(2.95) - wy(4.05)} rx="2" fill="#ffffff" stroke="#09090b" strokeWidth="2" />
                <rect x={wx(9.27)} y={wy(0)} width={6} height={wy(0) - wy(4.05)} fill="none" stroke="#09090b" strokeWidth="2" />
                <line x1={wx(8.0)} y1={wy(RIM_Y)} x2={wx(8.85)} y2={wy(RIM_Y)} stroke="#09090b" strokeWidth="6" />
                <g stroke="#71717a" strokeWidth="1.75">
                  <line x1={wx(8.0)} y1={wy(RIM_Y)} x2={wx(8.13)} y2={wy(2.55)} />
                  <line x1={wx(8.85)} y1={wy(RIM_Y)} x2={wx(8.85)} y2={wy(2.55)} />
                  <line x1={wx(8.425)} y1={wy(RIM_Y)} x2={wx(8.425)} y2={wy(2.55)} />
                  <line x1={wx(8.0)} y1={wy(RIM_Y)} x2={wx(8.85)} y2={wy(2.55)} />
                  <line x1={wx(8.85)} y1={wy(RIM_Y)} x2={wx(8.0)} y2={wy(2.55)} />
                </g>
              </g>

              <g stroke="#09090b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <circle cx={wx(1.78)} cy={wy(1.845)} r="12.8" fill="#ffffff" />
                <line x1={wx(1.75)} y1={wy(1.66)} x2={wx(1.62)} y2={wy(0.95)} />
                <line x1={wx(1.62)} y1={wy(0.95)} x2={wx(1.47)} y2={wy(0.47)} />
                <line x1={wx(1.47)} y1={wy(0.47)} x2={wx(1.38)} y2={wy(0.05)} />
                <line x1={wx(1.62)} y1={wy(0.95)} x2={wx(1.79)} y2={wy(0.47)} />
                <line x1={wx(1.79)} y1={wy(0.47)} x2={wx(1.86)} y2={wy(0.05)} />
                <line x1={wx(1.75)} y1={wy(1.66)} x2={wx(RELEASE.x)} y2={wy(RELEASE.y)} />
                <line x1={wx(1.75)} y1={wy(1.66)} x2={wx(1.24)} y2={wy(1.48)} />
              </g>
              <g fill="#09090b">
                <circle cx={wx(1.62)} cy={wy(0.95)} r="3" />
                <circle cx={wx(1.75)} cy={wy(1.66)} r="3" />
                <circle cx={wx(1.47)} cy={wy(0.47)} r="2.5" />
                <circle cx={wx(1.79)} cy={wy(0.47)} r="2.5" />
                <circle cx={wx(1.24)} cy={wy(1.48)} r="3" />
              </g>

              <g
                transform={`rotate(${spinDeg.toFixed(1)} ${wx(display.x)} ${wy(display.y)})`}
              >
                <circle
                  cx={wx(display.x)}
                  cy={wy(display.y)}
                  r={BALL_R}
                  fill="#ffffff"
                  stroke="#09090b"
                  strokeWidth="2.5"
                />
                <path
                  d={`M ${wx(display.x) - BALL_R} ${wy(display.y)} H ${wx(
                    display.x
                  ) + BALL_R}`}
                  fill="none"
                  stroke="#09090b"
                  strokeWidth="1.5"
                />
                <path
                  d={`M ${wx(display.x)} ${wy(display.y) - BALL_R} V ${wy(
                    display.y
                  ) + BALL_R}`}
                  fill="none"
                  stroke="#09090b"
                  strokeWidth="1.5"
                />
              </g>

              <g
                fontFamily="var(--font-geist-mono), ui-monospace, monospace"
                fontSize="9"
                fill="#52525b"
              >
                <text x="10" y={SVG_H - 24}>cesta · {RIM_Y} m</text>
                <text x="10" y={SVG_H - 10}>x [m]</text>
              </g>
            </svg>

            <div className="absolute left-3 top-3 rounded-md border border-zinc-200 bg-white/85 px-2 py-1 font-mono text-[10px] text-zinc-600 backdrop-blur">
              t = {t.toFixed(2)}s · x = {display.x.toFixed(2)}m · y = {display.y.toFixed(2)}m · v = {speed.toFixed(2)} m/s
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 md:grid-cols-4">
            <SceneStat label="Trajetória" value={scored ? "cesta" : "balística"} />
            <SceneStat label="Rastro" value={`${trail.length} pontos`} />
            <SceneStat label="Força" value={`${v0.toFixed(2)} m/s`} />
            <SceneStat label="Ângulo" value={`${angle}°`} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* UI components                                                               */
/* -------------------------------------------------------------------------- */

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
          {label}
        </span>
        <span className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 font-mono text-xs font-medium text-zinc-950">
          {format ? format(value) : value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-zinc-950"
      />
    </label>
  );
}

function Readout({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-zinc-400">{label}</span>
      <div className="text-right">
        <span className="font-medium text-zinc-950">{value}</span>
        {sub && <div className="text-[10px] text-zinc-400">{sub}</div>}
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-3 text-center">
      <div className="font-mono text-[8px] uppercase tracking-wider text-zinc-400">{label}</div>
      <div className="mt-1 font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}

function SceneStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-white px-4 py-3">
      <div className="font-mono text-[8px] uppercase tracking-wider text-zinc-400">{label}</div>
      <div className="mt-1 truncate font-mono text-xs font-medium">{value}</div>
    </div>
  );
}