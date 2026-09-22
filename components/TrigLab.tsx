"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlotFrame } from "@/components/PlotFrame";
import { UnitCircle } from "@/components/UnitCircle";
import { buildPlotContent } from "@/lib/series";
import { DEFAULT_WINDOW, PI, TWO_PI } from "@/lib/plot";
import type { Visualization } from "@/lib/visualizations";

const ANIMATED_KINDS = ["sine", "cosine", "unit-circle"];

export default function TrigLab({ viz }: { viz: Visualization }) {
  const [phase, setPhase] = useState(0);
  const [amp, setAmp] = useState(1);
  const [k, setK] = useState(1);
  const [angle, setAngle] = useState(PI / 4);
  const [xProbe, setXProbe] = useState(0.75);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      if (viz.kind === "unit-circle") {
        setAngle((a) => (a + 0.03) % TWO_PI);
      } else {
        setPhase((p) => p + 0.05);
      }
    }, 30);
    return () => clearInterval(id);
  }, [playing, viz.kind]);

  const win = viz.window ?? DEFAULT_WINDOW;
  const content = useMemo(
    () => buildPlotContent(viz.kind, { phase, amp, k }, win),
    [viz.kind, phase, amp, k, win]
  );
  const stats = useMemo(
    () => computeStats(viz.kind, { phase, amp, k, angle, xProbe }),
    [viz.kind, phase, amp, k, angle, xProbe]
  );

  const animated = ANIMATED_KINDS.includes(viz.kind);

  function reset() {
    setPlaying(false);
    setPhase(0);
    setAmp(1);
    setK(1);
    setAngle(PI / 4);
    setXProbe(0.75);
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <header className="mb-10 border-b border-zinc-200 pb-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-xs font-bold text-white">
              {viz.glyph}
            </div>
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-zinc-500">
              Trigonometria / {viz.category}
            </span>
            <Link
              href="/"
              className="ml-auto font-mono text-xs uppercase tracking-wider text-zinc-400 transition hover:text-zinc-950"
            >
              ← Índice
            </Link>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
                {viz.title}
              </h1>
              <p className="mt-3 max-w-2xl font-mono text-sm leading-6 text-zinc-500">
                {viz.detail}
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6">
              <SectionTitle
                index="01"
                title="Parâmetros"
                note="Ajustes que reparametrizam a curva em tempo real."
              />
              <div className="space-y-5">
                {(viz.kind === "sine" || viz.kind === "cosine") && (
                  <>
                    <Slider
                      label="Fase (φ)"
                      value={phase}
                      min={-PI}
                      max={PI}
                      step={0.05}
                      onChange={setPhase}
                      format={(v) => `${(v / PI).toFixed(2)}π`}
                    />
                    <Slider label="Amplitude (A)" value={amp} min={0.1} max={2} step={0.05} onChange={setAmp} />
                  </>
                )}
                {viz.kind === "tangent" && (
                  <Slider
                    label="Amplitude (A)"
                    value={amp}
                    min={0.1}
                    max={3}
                    step={0.05}
                    onChange={setAmp}
                  />
                )}
                {viz.kind === "identity" && (
                  <Slider
                    label="Posição de prova (x)"
                    value={xProbe}
                    min={win.xMin}
                    max={win.xMax}
                    step={0.05}
                    onChange={setXProbe}
                    format={(v) => `${(v / PI).toFixed(2)}π`}
                  />
                )}
                {viz.kind === "unit-circle" && (
                  <Slider
                    label="Ângulo (θ)"
                    value={angle}
                    min={0}
                    max={TWO_PI}
                    step={0.005}
                    onChange={setAngle}
                    format={(v) => `${Math.round((v * 180) / PI)}°`}
                  />
                )}
                {viz.kind === "frequency" && (
                  <Slider
                    label="Frequência (k)"
                    value={k}
                    min={0.5}
                    max={3}
                    step={0.05}
                    onChange={setK}
                  />
                )}
              </div>

              <div className="my-7 h-px bg-zinc-200" />

              <div className="mb-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                  DOMÍNIO SOB ANÁLISE
                </div>
                <h3 className="mt-1 text-sm font-semibold">Intervalo exibido</h3>
              </div>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200">
                <MiniStat label="x ∈" value={`[${(win.xMin / PI).toFixed(1)}π … ${(win.xMax / PI).toFixed(1)}π]`} />
                <MiniStat
                  label="y ∈"
                  value={`[${win.yMin} … ${win.yMax}]`}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6">
              <SectionTitle
                index="02"
                title="Execução"
                note={
                  animated
                    ? "Anime o parâmetro dinâmico ou redefina o estado."
                    : "Reinicie a visualização para o estado padrão."
                }
              />
              <div className="space-y-3">
                {animated && (
                  <button
                    onClick={() => setPlaying((p) => !p)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider text-white transition hover:bg-zinc-800"
                  >
                    {playing ? "❚❚ Pausar animação" : "▶ Executar animação"}
                  </button>
                )}
                <button
                  onClick={reset}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider transition hover:border-zinc-950 hover:bg-zinc-950 hover:text-white"
                >
                  ↺ Redefinir
                </button>
              </div>

              <div className="my-6 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200">
                <SummaryStat label="Função" value={viz.glyph} />
                <SummaryStat label="Categoria" value={viz.category} />
                <SummaryStat label="Status" value={playing ? "girando" : "pronto"} />
              </div>
            </section>
          </div>

          <div className="min-w-0 space-y-6">
            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-200 px-6 py-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                  EQUAÇÃO / 03
                </div>
              </div>
              <div className="bg-zinc-950 px-6 py-10 text-white md:px-10">
                <EquationTokens viz={viz} angle={angle} />
                <p className="mt-3 max-w-xl font-mono text-sm leading-6 text-zinc-400">
                  {viz.detail}
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3 font-mono text-xs">
                  <Chip>{viz.equation}</Chip>
                  <Chip>{viz.kind}</Chip>
                  {viz.tags.map((t) => (
                    <Chip key={t}>{t}</Chip>
                  ))}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                    MALHA / 04
                  </div>
                  <p className="mt-1 font-semibold">Visualização da equação</p>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                  SVG vetorial
                </span>
              </div>

              <div className="relative mt-3 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white">
                {viz.kind === "unit-circle" ? (
                  <UnitCircle angle={angle} className="h-auto w-full max-w-[460px]" />
                ) : (
                  <PlotFrame
                    win={win}
                    series={content.series}
                    asymptotes={content.asymptotes}
                    className="h-auto w-full"
                  />
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200">
              <div className="flex flex-col gap-4 border-b border-zinc-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                    VALORES / 05
                  </div>
                  <h2 className="mt-1 font-semibold">Leitura numérica</h2>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      playing ? "bg-zinc-950" : "bg-zinc-300"
                    }`}
                  />
                  {playing ? "ANIMANDO" : "PRONTO"}
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-zinc-200 md:grid-cols-4">
                {stats.map((s) => (
                  <Stat key={s.label} label={s.label} value={s.value} />
                ))}
              </div>
            </section>
          </div>
        </div>

        <footer className="mt-10 flex flex-col justify-between gap-3 border-t border-zinc-200 pt-6 font-mono text-[10px] uppercase tracking-wider text-zinc-400 md:flex-row">
          <span>
            Galeria {viz.index} de 06 — {viz.title}
          </span>
          <span>Math / Trigonometria / SVG</span>
        </footer>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Readouts                                                                    */
/* -------------------------------------------------------------------------- */

interface Readout {
  label: string;
  value: string;
}

interface SimState {
  phase: number;
  amp: number;
  k: number;
  angle: number;
  xProbe: number;
}

function computeStats(kind: Visualization["kind"], s: SimState): Readout[] {
  switch (kind) {
    case "sine":
    case "cosine":
      return [
        { label: "Amplitude (A)", value: s.amp.toFixed(2) },
        { label: "Fase (φ)", value: `${(s.phase / PI).toFixed(2)}π` },
        { label: "Período (T)", value: `2π ≈ ${TWO_PI.toFixed(3)}` },
        {
          label: "y(0)",
          value: (
            kind === "sine"
              ? s.amp * Math.sin(s.phase)
              : s.amp * Math.cos(s.phase)
          ).toFixed(3),
        },
      ];
    case "tangent":
      return [
        { label: "Amplitude (A)", value: s.amp.toFixed(2) },
        { label: "Assíntotas", value: "π/2 + kπ" },
        { label: "tan(0)", value: "0" },
        { label: "tan(π/4)", value: s.amp.toFixed(2) },
      ];
    case "identity": {
      const sn = Math.sin(s.xProbe);
      const cs = Math.cos(s.xProbe);
      return [
        { label: "x", value: `${(s.xProbe / PI).toFixed(2)}π` },
        { label: "sin(x)", value: sn.toFixed(4) },
        { label: "cos(x)", value: cs.toFixed(4) },
        { label: "sin² + cos²", value: (sn * sn + cs * cs).toFixed(6) },
      ];
    }
    case "unit-circle":
      return [
        { label: "θ", value: `${Math.round((s.angle * 180) / PI)}°` },
        { label: "cos(θ)", value: Math.cos(s.angle).toFixed(4) },
        { label: "sin(θ)", value: Math.sin(s.angle).toFixed(4) },
        {
          label: "tan(θ)",
          value:
            Math.abs(Math.cos(s.angle)) < 1e-6
              ? "undefined"
              : Math.tan(s.angle).toFixed(4),
        },
      ];
    case "frequency":
      return [
        { label: "Frequência (k)", value: s.k.toFixed(2) },
        { label: "Período (T)", value: `${(TWO_PI / s.k).toFixed(3)}` },
        { label: "Freq. (f)", value: `${(s.k / TWO_PI).toFixed(3)}` },
        { label: "T vs. base", value: `2π → ${(TWO_PI / s.k / TWO_PI).toFixed(2)}×` },
      ];
  }
}

/* -------------------------------------------------------------------------- */
/* Equation tokens                                                             */
/* -------------------------------------------------------------------------- */

function EquationTokens({ viz, angle }: { viz: Visualization; angle: number }) {
  switch (viz.kind) {
    case "sine":
    case "cosine": {
      const g = viz.kind === "sine" ? "sin" : "cos";
      return (
        <div className="flex flex-wrap items-baseline gap-x-3 font-mono text-lg tracking-tight md:text-2xl">
          <span className="text-zinc-400">y</span>
          <span className="text-zinc-600">=</span>
          <span>A</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400">{g}</span>
          <span className="text-zinc-400">(</span>
          <span>x</span>
          <span className="text-zinc-600">+</span>
          <span className="text-zinc-400">φ</span>
          <span className="text-zinc-400">)</span>
        </div>
      );
    }
    case "tangent":
      return (
        <div className="flex flex-wrap items-baseline gap-x-3 font-mono text-lg tracking-tight md:text-2xl">
          <span className="text-zinc-400">y</span>
          <span className="text-zinc-600">=</span>
          <span>A</span>
          <span className="text-zinc-600">·</span>
          <span>tan</span>
          <span className="text-zinc-400">(</span>
          <span>x</span>
          <span className="text-zinc-400">)</span>
        </div>
      );
    case "identity":
      return (
        <div className="flex flex-wrap items-baseline gap-x-3 font-mono text-lg tracking-tight md:text-2xl">
          <span className="text-zinc-400">sin</span>
          <span className="text-zinc-400">²</span>
          <span className="text-zinc-400">(</span>
          <span>x</span>
          <span className="text-zinc-400">)</span>
          <span className="text-zinc-600">+</span>
          <span>cos</span>
          <span className="text-zinc-400">²</span>
          <span className="text-zinc-400">(</span>
          <span>x</span>
          <span className="text-zinc-400">)</span>
          <span className="text-zinc-600">=</span>
          <span>1</span>
        </div>
      );
    case "unit-circle":
      return (
        <div className="flex flex-wrap items-baseline gap-x-3 font-mono text-lg tracking-tight md:text-2xl">
          <span className="text-zinc-400">x</span>
          <span className="text-zinc-600">=</span>
          <span>cos</span>
          <span className="text-zinc-400">θ</span>
          <span className="text-zinc-600">=</span>
          <span>{Math.cos(angle).toFixed(3)}</span>
          <span className="mx-2 text-zinc-600">·</span>
          <span className="text-zinc-400">y</span>
          <span className="text-zinc-600">=</span>
          <span>sin</span>
          <span className="text-zinc-400">θ</span>
          <span className="text-zinc-600">=</span>
          <span>{Math.sin(angle).toFixed(3)}</span>
        </div>
      );
    case "frequency":
      return (
        <div className="flex flex-wrap items-baseline gap-x-3 font-mono text-lg tracking-tight md:text-2xl">
          <span className="text-zinc-400">y</span>
          <span className="text-zinc-600">=</span>
          <span>sin</span>
          <span className="text-zinc-400">(</span>
          <span className="text-zinc-400">k</span>
          <span className="text-zinc-600">·</span>
          <span>x</span>
          <span className="text-zinc-400">)</span>
        </div>
      );
  }
}

/* -------------------------------------------------------------------------- */
/* UI components                                                               */
/* -------------------------------------------------------------------------- */

function SectionTitle({
  index,
  title,
  note,
}: {
  index: string;
  title: string;
  note: string;
}) {
  return (
    <div className="mb-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
        {index}
      </div>
      <h2 className="mt-1 text-lg font-semibold">{title}</h2>
      <p className="mt-1 font-mono text-[10px] leading-4 text-zinc-400">{note}</p>
    </div>
  );
}

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

function Chip({ children }: { children: string }) {
  return (
    <span className="rounded-md border border-zinc-700 px-3 py-1.5 text-zinc-400">
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-5 py-5">
      <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">{label}</div>
      <div className="mt-2 truncate font-mono text-sm font-medium">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-3 text-center">
      <div className="font-mono text-[8px] uppercase tracking-wider text-zinc-400">{label}</div>
      <div className="mt-1 font-mono text-sm font-semibold">{value}</div>
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