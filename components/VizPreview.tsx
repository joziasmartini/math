import { PlotFrame } from "@/components/PlotFrame";
import { UnitCircle } from "@/components/UnitCircle";
import { buildPlotContent } from "@/lib/series";
import { DEFAULT_WINDOW } from "@/lib/plot";
import type { Visualization } from "@/lib/visualizations";

interface VizPreviewProps {
  viz: Visualization;
  className?: string;
}

export function VizPreview({ viz, className }: VizPreviewProps) {
  if (viz.kind === "unit-circle") {
    return <UnitCircle angle={0.75} className={className} />;
  }
  const win = viz.window ?? DEFAULT_WINDOW;
  const { series, asymptotes } = buildPlotContent(
    viz.kind,
    { phase: 0.6, amp: 1, k: 2 },
    win
  );
  return (
    <PlotFrame
      win={win}
      series={series}
      asymptotes={asymptotes}
      className={className}
    />
  );
}