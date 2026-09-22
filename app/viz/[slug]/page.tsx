import { notFound } from "next/navigation";
import TrigLab from "@/components/TrigLab";
import {
  findVisualization,
  getVisualizations,
} from "@/lib/visualizations";

export function generateStaticParams() {
  return getVisualizations().map((viz) => ({ slug: viz.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const viz = findVisualization(slug);
  if (!viz) return { title: "Não encontrado" };
  return {
    title: `${viz.title} — Math`,
    description: viz.detail,
  };
}

export default async function VizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const viz = findVisualization(slug);
  if (!viz) notFound();
  return <TrigLab viz={viz} />;
}