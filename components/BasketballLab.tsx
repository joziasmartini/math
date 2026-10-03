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
const BALL_R = 12;

const RIM_MID = (RIM_FRONT + RIM_BACK) / 2;
const RIM_INNER_F = RIM_FRONT + 0.06;
const RIM_INNER_B = RIM_BACK - 0.06;

const BOARD_FACE = 8.85;
const BOARD_BACK = 9.62;
const BOARD_BOT = 2.9;
const BOARD_TOP = 4.42;
const POST_W = 0.24;

const NET_BOTTOM = RIM_Y - 0.52;
const NET_TAPER = 0.6;
const NET_STRANDS = 7;

/* Física de colisão -------------------------------------------------------- */

const BALL_W = BALL_R / (SVG_W / WORLD_W);
const RIM_TUBE = 0.05;
const RIM_EDGES = [
  { x: RIM_FRONT, y: RIM_Y },
  { x: RIM_BACK, y: RIM_Y },
];
const E_RIM = 0.55;
const F_RIM = 0.7;
const E_BOARD = 0.6;
const F_BOARD = 0.85;
const REST_VN = 0.5;
const HIT_CD = 0.08;
const BOARD_SLOT = 2;
const SIM_DT = 1 / 240;
const MAX_T = 4.5;

interface Flight {
  vx: number;
  vy: number;
}

interface Point {
  x: number;
  y: number;
}

interface Sim {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scored: boolean;
  bounces: number;
  impacts: Point[];
  hitAt: number[];
  done: boolean;
}

function wx(x: number) {
  return (x / WORLD_W) * SVG_W;
}

function wy(y: number) {
  return SVG_H - (y / WORLD_H) * SVG_H;
}

function createSim(f: Flight): Sim {
  return {
    t: 0,
    x: RELEASE.x,
    y: RELEASE.y,
    vx: f.vx,
    vy: f.vy,
    scored: false,
    bounces: 0,
    impacts: [],
    hitAt: [-Infinity, -Infinity, -Infinity],
    done: false,
  };
}

/**
 * Resolve o contato com um obstáculo estático: normal com restituição,
 * tangencial com atrito. Contato lento não quica (a bola encosta e escorrega),
 * e o mesmo obstáculo não conta dois quiques em sequência.
 */
function bounce(
  sim: Sim,
  nx: number,
  ny: number,
  restitution: number,
  friction: number,
  slot: number
) {
  const vn = sim.vx * nx + sim.vy * ny;
  if (vn >= 0) return false;

  const tx = -ny;
  const ty = nx;
  const vt = sim.vx * tx + sim.vy * ty;

  if (-vn < REST_VN) {
    sim.vx = tx * vt;
    sim.vy = ty * vt;
    return false;
  }
  if (sim.t - sim.hitAt[slot] < HIT_CD) return false;

  sim.hitAt[slot] = sim.t;
  const rn = -vn * restitution;
  const rt = vt * (1 - friction);
  sim.vx = nx * rn + tx * rt;
  sim.vy = ny * rn + ty * rt;
  return true;
}

/**
 * Avança a bola em micro-passos. Entre impactos o trecho continua sendo uma
 * parábola; ao tocar aro ou quadro, o trecho é fechado e nasce outro com a
 * velocidade refletida. A cesta é creditada ao cruzar o plano do aro por
 * dentro, nunca por encostar na rede.
 */
function advance(sim: Sim, dt: number, onStep?: (p: Point) => void) {
  let left = dt;
  while (left > 1e-9 && !sim.done) {
    const h = Math.min(SIM_DT, left);
    left -= h;

    const px = sim.x;
    const py = sim.y;

    sim.vy -= G * h;
    sim.x += sim.vx * h;
    sim.y += sim.vy * h;
    sim.t += h;

    let contact = false;
    const reach = BALL_W + RIM_TUBE;
    for (let i = 0; i < RIM_EDGES.length; i++) {
      const e = RIM_EDGES[i];
      const dx = sim.x - e.x;
      const dy = sim.y - e.y;
      const d = Math.hypot(dx, dy);
      if (d >= reach) continue;
      const nx = d > 1e-6 ? dx / d : 0;
      const ny = d > 1e-6 ? dy / d : 1;
      sim.x = e.x + nx * reach;
      sim.y = e.y + ny * reach;
      contact = true;
      if (bounce(sim, nx, ny, E_RIM, F_RIM, i)) {
        sim.bounces++;
        sim.impacts.push({ x: e.x, y: e.y });
      }
    }

    if (
      sim.vx > 0 &&
      sim.x + BALL_W > BOARD_FACE &&
      sim.y > BOARD_BOT &&
      sim.y < BOARD_TOP
    ) {
      sim.x = BOARD_FACE - BALL_W;
      contact = true;
      if (bounce(sim, -1, 0, E_BOARD, F_BOARD, BOARD_SLOT)) {
        sim.bounces++;
        sim.impacts.push({ x: BOARD_FACE, y: sim.y });
      }
    }

    if (!contact && py > RIM_Y && sim.y <= RIM_Y) {
      const k = (py - RIM_Y) / (py - sim.y);
      const crossX = px + (sim.x - px) * k;
      if (crossX > RIM_INNER_F && crossX < RIM_INNER_B) sim.scored = true;
    }

    if (sim.y <= 0) {
      sim.y = 0;
      sim.done = true;
    }

    onStep?.(sim);
  }
}

/** Roda a simulação inteira — alimenta a previsão e a linha tracejada. */
function simulate(f: Flight) {
  const sim = createSim(f);
  const points: Point[] = [];
  advance(sim, MAX_T, (p) => {
    if (p.y > 0) points.push({ x: p.x, y: p.y });
  });
  return { sim, points };
}

function netBottomX(x: number) {
  return RIM_MID + (x - RIM_MID) * NET_TAPER;
}

export default function BasketballLab() {
  const [force, setForce] = useState(0.6);
  const [angle, setAngle] = useState(50);
  const [t, setT] = useState(0);
  const [trail, setTrail] = useState<Point[]>([]);
  const [frame, setFrame] = useState<Point>(RELEASE);
  const [speed, setSpeed] = useState(0);
  const displaySpeed = Math.round(speed * 100) / 100;
  const [bounces, setBounces] = useState(0);
  const [impacts, setImpacts] = useState<Point[]>([]);
  const [scored, setScored] = useState(false);
  const [ended, setEnded] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [showTrajectory, setShowTrajectory] = useState(false);

  const simRef = useRef<Sim>(createSim({ vx: 0, vy: 0 }));
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const publishedRef = useRef(0);

  const v0 = useMemo(() => {
    const raw = FORCE_MIN + force * (FORCE_MAX - FORCE_MIN);
    return Math.round(raw * 100) / 100;
  }, [force]);
  const theta = (angle * Math.PI) / 180;
  const vx = useMemo(() => v0 * Math.cos(theta), [v0, theta]);
  const vy = useMemo(() => v0 * Math.sin(theta), [v0, theta]);

  const timeOfFlight = useMemo(() => {
    const d = Math.sqrt(vy * vy + 2 * G * RELEASE.y);
    return (vy + d) / G;
  }, [vy]);

  const range = useMemo(() => RELEASE.x + vx * timeOfFlight, [vx, timeOfFlight]);
  const maxHeight = useMemo(() => RELEASE.y + (vy * vy) / (2 * G), [vy]);

  const preview = useMemo(() => simulate({ vx, vy }), [vx, vy]);
  const predicted = preview.sim.scored;

  const predictedPath = useMemo(() => {
    const { points } = preview;
    if (points.length === 0) return "";
    return points
      .map((p, i) => `${i === 0 ? "M" : " L"}${wx(p.x).toFixed(1)} ${wy(p.y).toFixed(1)}`)
      .join("");
  }, [preview]);

  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  const display = animating || ended ? frame : RELEASE;
  const displayX = Math.round(display.x * 100) / 100;
  const displayY = Math.round(display.y * 100) / 100;
  const spinDeg = animating || ended ? ((displayX - RELEASE.x) * 2.6 * 180) / Math.PI : 0;

  function tick(now: number) {
    const sim = simRef.current;
    const last = lastTsRef.current ?? now;
    const delta = Math.min((now - last) / 1000, 0.05);
    lastTsRef.current = now;

    advance(sim, delta);

    if (sim.scored) setScored(true);
    if (sim.bounces > publishedRef.current) {
      publishedRef.current = sim.bounces;
      setBounces(sim.bounces);
      setImpacts([...sim.impacts]);
    }

    setT(sim.t);
    setFrame({ x: sim.x, y: sim.y });
    setSpeed(Math.hypot(sim.vx, sim.vy));
    setTrail((list) => [...list, { x: sim.x, y: sim.y }]);

    if (!sim.done && sim.t < MAX_T) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      setAnimating(false);
      setEnded(true);
    }
  }

  function launch() {
    if (animating) return;
    simRef.current = createSim({ vx, vy });
    setTrail([]);
    setFrame({ ...RELEASE });
    setSpeed(v0);
    setBounces(0);
    setImpacts([]);
    setScored(false);
    setEnded(false);
    lastTsRef.current = null;
    publishedRef.current = 0;
    setT(0);
    setAnimating(true);
    rafRef.current = requestAnimationFrame(tick);
  }

  function reset() {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = null;
    simRef.current = createSim({ vx: 0, vy: 0 });
    setAnimating(false);
    setFrame({ ...RELEASE });
    setSpeed(0);
    setBounces(0);
    setImpacts([]);
    setTrail([]);
    setScored(false);
    setEnded(false);
    setT(0);
    publishedRef.current = 0;
  }

  const status = scored
    ? "CESTA ✓"
    : animating
      ? bounces > 0
        ? "QUICOU"
        : "VOANDO"
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
                label="Velocidade"
                value={force}
                min={0}
                max={1}
                step={0.01}
                onChange={setForce}
                format={() => `${v0.toFixed(2)} m/s`}
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

            <div className="mb-4 flex items-center gap-2">
              <input
                id="show-trajectory"
                type="checkbox"
                checked={showTrajectory}
                onChange={(e) => setShowTrajectory(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-zinc-950"
              />
              <label
                htmlFor="show-trajectory"
                className="cursor-pointer font-mono text-[10px] uppercase tracking-wider text-zinc-500"
              >
                Mostrar trajetória prevista
              </label>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <Readout label="Velocidade v₀" value={`${v0.toFixed(2)} m/s`} />
              <Readout
                label="Alcance R"
                value={`${range.toFixed(2)} m`}
                sub={`Q = v₀²·sen(2θ)/g · voo livre`}
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
                value={predicted ? "cesta ✓" : preview.sim.bounces > 0 ? "fora (quique)" : "fora"}
                sub="apenas se cruzar o aro por dentro"
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
              <SummaryStat label="Velocidade" value={`${v0.toFixed(2)} m/s`} />
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

              {impacts.map((p, i) => (
                <circle
                  key={i}
                  cx={wx(p.x)}
                  cy={wy(p.y)}
                  r="4.5"
                  fill="none"
                  stroke="#09090b"
                  strokeWidth="1.75"
                />
              ))}

              {showTrajectory && (
                <path
                  d={predictedPath}
                  fill="none"
                  stroke="#a1a1aa"
                  strokeWidth="1.25"
                  strokeDasharray="6 6"
                />
              )}

              <Basket scored={scored} />

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
                t = {t.toFixed(2)}s · x = {displayX.toFixed(2)}m · y = {displayY.toFixed(2)}m · v = {displaySpeed.toFixed(2)} m/s
              </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 md:grid-cols-5">
            <SceneStat
              label="Trajetória"
              value={scored ? "cesta" : bounces > 0 ? "com quique" : "balística"}
            />
            <SceneStat
              label="Quiques"
              value={bounces === 0 ? "nenhum" : `${bounces} no aro/quadro`}
            />
            <SceneStat label="Rastro" value={`${trail.length} pontos`} />
            <SceneStat label="Velocidade" value={`${v0.toFixed(2)} m/s`} />
            <SceneStat label="Ângulo" value={`${angle}°`} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Basket                                                                      */
/* -------------------------------------------------------------------------- */

function Basket({ scored }: { scored: boolean }) {
  const postL = BOARD_BACK - POST_W;
  const plateL = postL - 0.7;
  const plateR = BOARD_BACK + 0.34;
  const plateTop = wy(0.11);

  const rimY = wy(RIM_Y);
  const botY = wy(NET_BOTTOM);
  const midX = wx(RIM_MID);

  const strands = Array.from({ length: NET_STRANDS }, (_, i) => {
    const fx = RIM_FRONT + ((RIM_BACK - RIM_FRONT) * i) / (NET_STRANDS - 1);
    const p0 = { x: wx(fx), y: rimY };
    const p1 = { x: wx(netBottomX(fx)), y: botY };
    const c = {
      x: midX + ((p0.x + p1.x) / 2 - midX) * 0.88,
      y: (rimY + botY) / 2,
    };
    return { p0, c, p1 };
  });

  const at = (s: { p0: Point; c: Point; p1: Point }, u: number): Point => {
    const k = 1 - u;
    return {
      x: k * k * s.p0.x + 2 * k * u * s.c.x + u * u * s.p1.x,
      y: k * k * s.p0.y + 2 * k * u * s.c.y + u * u * s.p1.y,
    };
  };

  const left = strands[0];
  const right = strands[strands.length - 1];
  const ring = (u: number) => {
    const a = at(left, u);
    const b = at(right, u);
    return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${((a.x + b.x) / 2).toFixed(1)} ${(
      (a.y + b.y) / 2 +
      7
    ).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  };

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <ellipse
        cx={wx(postL + POST_W / 2)}
        cy={wy(0.03)}
        rx={(wx(plateR) - wx(plateL)) / 2}
        ry="5"
        fill="#09090b"
        opacity="0.08"
      />

      <rect
        x={wx(plateL)}
        y={plateTop}
        width={wx(plateR) - wx(plateL)}
        height={wy(0) - plateTop}
        rx="2"
        fill="#e4e4e7"
        stroke="#09090b"
        strokeWidth="2"
      />

      <g fill="#f4f4f5" stroke="#09090b" strokeWidth="2">
        <path
          d={`M${wx(postL).toFixed(1)} ${wy(1.02).toFixed(1)} L${wx(
            plateL + 0.12
          ).toFixed(1)} ${wy(0.11).toFixed(1)} L${wx(postL).toFixed(1)} ${wy(
            0.11
          ).toFixed(1)} Z`}
        />
        <path
          d={`M${wx(BOARD_BACK).toFixed(1)} ${wy(0.78).toFixed(1)} L${wx(
            plateR - 0.1
          ).toFixed(1)} ${wy(0.11).toFixed(1)} L${wx(BOARD_BACK).toFixed(
            1
          )} ${wy(0.11).toFixed(1)} Z`}
        />
      </g>

      <rect
        x={wx(postL)}
        y={wy(BOARD_TOP)}
        width={wx(BOARD_BACK) - wx(postL)}
        height={wy(0) - wy(BOARD_TOP)}
        fill="#fafafa"
        stroke="#09090b"
        strokeWidth="2.5"
      />
      <line
        x1={wx(postL) + 4.5}
        y1={wy(0.5)}
        x2={wx(postL) + 4.5}
        y2={wy(BOARD_TOP - 0.25)}
        stroke="#d4d4d8"
        strokeWidth="3"
      />

      <rect
        x={wx(BOARD_FACE)}
        y={wy(BOARD_TOP)}
        width={wx(BOARD_BACK) - wx(BOARD_FACE)}
        height={wy(BOARD_BOT) - wy(BOARD_TOP)}
        rx="2"
        fill="#ffffff"
        stroke="#09090b"
        strokeWidth="2.5"
      />

      <path
        d={`M${wx(BOARD_FACE).toFixed(1)} ${wy(RIM_Y + 0.22).toFixed(1)} L${wx(
          BOARD_FACE - 0.36
        ).toFixed(1)} ${wy(RIM_Y + 0.05).toFixed(1)} L${wx(
          BOARD_FACE
        ).toFixed(1)} ${wy(RIM_Y + 0.05).toFixed(1)} Z`}
        fill="#09090b"
      />

      <g fill="none" stroke="#a1a1aa" strokeWidth="1.5">
        {strands.map((s, i) => (
          <path
            key={i}
            d={`M${s.p0.x.toFixed(1)} ${s.p0.y.toFixed(1)} Q${s.c.x.toFixed(
              1
            )} ${s.c.y.toFixed(1)} ${s.p1.x.toFixed(1)} ${s.p1.y.toFixed(1)}`}
          />
        ))}
        <path d={ring(0.36)} />
        <path d={ring(0.68)} />
      </g>

      <line
        x1={wx(RIM_FRONT)}
        y1={rimY}
        x2={wx(RIM_BACK)}
        y2={rimY}
        stroke="#09090b"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <rect
        x={wx(BOARD_FACE - 0.02)}
        y={wy(RIM_Y + 0.15)}
        width={wx(BOARD_FACE + 0.09) - wx(BOARD_FACE - 0.02)}
        height={wy(RIM_Y - 0.11) - wy(RIM_Y + 0.15)}
        rx="1.5"
        fill="#09090b"
      />

      {scored && (
        <text
          x={midX}
          y={wy(RIM_Y + 0.78)}
          textAnchor="middle"
          fontFamily="var(--font-geist-mono), ui-monospace, monospace"
          fontSize="11"
          fontWeight="600"
          fill="#09090b"
          stroke="#ffffff"
          strokeWidth="3.5"
          paintOrder="stroke"
        >
          cesta ✓
        </text>
      )}
    </g>
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