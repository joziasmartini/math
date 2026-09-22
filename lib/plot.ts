export const PI = Math.PI;
export const TWO_PI = 2 * Math.PI;

export interface PlotWindow {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export const DEFAULT_WINDOW: PlotWindow = {
  xMin: -2 * PI,
  xMax: 2 * PI,
  yMin: -2.4,
  yMax: 2.4,
};

export const VIEW_WIDTH = 720;
export const VIEW_HEIGHT = 400;

export interface Series {
  d: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  opacity?: number;
}

export function xToPx(
  x: number,
  win: PlotWindow,
  width = VIEW_WIDTH
): number {
  return ((x - win.xMin) / (win.xMax - win.xMin)) * width;
}

export function yToPx(
  y: number,
  win: PlotWindow,
  height = VIEW_HEIGHT
): number {
  return height - ((y - win.yMin) / (win.yMax - win.yMin)) * height;
}

export interface PathOptions {
  width?: number;
  height?: number;
  samples?: number;
}

export function functionPath(
  fn: (x: number) => number,
  win: PlotWindow = DEFAULT_WINDOW,
  opts: PathOptions = {}
): string {
  const width = opts.width ?? VIEW_WIDTH;
  const height = opts.height ?? VIEW_HEIGHT;
  const samples = opts.samples ?? 480;
  const step = (win.xMax - win.xMin) / samples;
  let d = "";
  let pen = false;
  for (let i = 0; i <= samples; i++) {
    const x = win.xMin + i * step;
    const y = fn(x);
    const valid = Number.isFinite(y) && y >= win.yMin && y <= win.yMax;
    if (!valid) {
      pen = false;
      continue;
    }
    const px = xToPx(x, win, width);
    const py = yToPx(y, win, height);
    d += pen
      ? ` L${px.toFixed(2)} ${py.toFixed(2)}`
      : `M${px.toFixed(2)} ${py.toFixed(2)}`;
    pen = true;
  }
  return d;
}

export function xTicksAt(win: PlotWindow, step = PI / 2): number[] {
  const ticks: number[] = [];
  for (
    let v = Math.ceil(win.xMin / step) * step;
    v <= win.xMax + 1e-9;
    v += step
  ) {
    ticks.push(Number(v.toFixed(8)));
  }
  return ticks;
}

export function yTicksAt(win: PlotWindow, step = 1): number[] {
  const ticks: number[] = [];
  for (
    let v = Math.ceil(win.yMin / step) * step;
    v <= win.yMax + 1e-9;
    v += step
  ) {
    ticks.push(Number(v.toFixed(8)));
  }
  return ticks;
}

export function formatPi(value: number): string {
  const quarter = value / (PI / 2);
  if (Math.abs(Math.round(quarter) - quarter) > 1e-6) {
    return trimNumber(value);
  }
  const k = Math.round(quarter);
  const sign = k < 0 ? "-" : "";
  const abs = Math.abs(k);
  if (abs === 0) return "0";
  if (abs % 2 === 0) {
    const n = abs / 2;
    return `${sign}${n === 1 ? "" : n}π`;
  }
  return `${sign}${abs === 1 ? "" : abs}π/2`;
}

export function formatTick(value: number): string {
  return trimNumber(value) === "0" ? "0" : trimNumber(value);
}

function trimNumber(value: number): string {
  const fixed = value.toFixed(4);
  const trimmed = fixed.replace(/\.?0+$/, "");
  return trimmed === "-0" ? "0" : trimmed;
}