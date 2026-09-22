import {
  functionPath,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  yToPx,
  type PlotWindow,
  type Series,
} from "@/lib/plot";
import type { VizKind } from "@/lib/visualizations";

export interface PlotParams {
  phase: number;
  amp: number;
  k: number;
}

export interface PlotContent {
  series: Series[];
  asymptotes: number[];
}

export function tangentAsymptotes(win: PlotWindow): number[] {
  const out: number[] = [];
  let x = Math.PI / 2;
  while (x <= win.xMax) {
    out.push(x);
    x += Math.PI;
  }
  x = Math.PI / 2 - Math.PI;
  while (x >= win.xMin) {
    out.push(x);
    x -= Math.PI;
  }
  return out;
}

export function buildPlotContent(
  kind: VizKind,
  params: PlotParams,
  win: PlotWindow,
  width = VIEW_WIDTH,
  height = VIEW_HEIGHT
): PlotContent {
  const asymptotes: number[] = [];
  let series: Series[] = [];

  switch (kind) {
    case "sine":
      series = [
        {
          d: functionPath((x) => Math.sin(x), win, { width, height }),
          stroke: "#a1a1aa",
          strokeWidth: 1.25,
          opacity: 0.85,
        },
        {
          d: functionPath(
            (x) => params.amp * Math.sin(x + params.phase),
            win,
            { width, height }
          ),
          stroke: "#09090b",
          strokeWidth: 2,
        },
      ];
      break;
    case "cosine":
      series = [
        {
          d: functionPath((x) => Math.cos(x), win, { width, height }),
          stroke: "#a1a1aa",
          strokeWidth: 1.25,
          opacity: 0.85,
        },
        {
          d: functionPath(
            (x) => params.amp * Math.cos(x + params.phase),
            win,
            { width, height }
          ),
          stroke: "#09090b",
          strokeWidth: 2,
        },
      ];
      break;
    case "tangent":
      asymptotes.push(...tangentAsymptotes(win));
      series = [
        {
          d: functionPath(
            (x) => params.amp * Math.tan(x),
            win,
            { width, height, samples: 720 }
          ),
          stroke: "#09090b",
          strokeWidth: 2,
        },
      ];
      break;
    case "identity":
      series = [
        {
          d: functionPath(
            (x) => Math.pow(Math.sin(x), 2),
            win,
            { width, height }
          ),
          stroke: "#52525b",
          strokeWidth: 2,
        },
        {
          d: functionPath(
            (x) => Math.pow(Math.cos(x), 2),
            win,
            { width, height }
          ),
          stroke: "#a1a1aa",
          strokeWidth: 2,
        },
        {
          d: `M0 ${yToPx(1, win, height).toFixed(2)} L${width.toFixed(
            2
          )} ${yToPx(1, win, height).toFixed(2)}`,
          stroke: "#09090b",
          strokeWidth: 2,
          strokeDasharray: "6 5",
        },
      ];
      break;
    case "frequency":
      series = [
        {
          d: functionPath((x) => Math.sin(x), win, { width, height }),
          stroke: "#a1a1aa",
          strokeWidth: 1.25,
          opacity: 0.85,
        },
        {
          d: functionPath(
            (x) => Math.sin(params.k * x),
            win,
            { width, height }
          ),
          stroke: "#09090b",
          strokeWidth: 2,
        },
      ];
      break;
    case "unit-circle":
      series = [];
      break;
  }

  return { series, asymptotes };
}