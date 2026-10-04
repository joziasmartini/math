import Link from "next/link";
import { getVisualizations, type Visualization } from "@/lib/visualizations";
import { VizPreview } from "@/components/VizPreview";
import BasketballLab from "@/components/BasketballLab";
import SonarGrid from "@/components/SonarGrid";
import {
  ArrowUpRight,
  Compass,
  FlaskConical,
  Sigma,
  Sparkles,
  VectorPolygon,
} from "lucide-react";

export default function Home() {
  const vizzes = getVisualizations();

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-1 flex-col px-6 py-10 lg:px-10">
        <header className="relative mb-14 overflow-hidden rounded-3xl bg-white">
          <SonarGrid
            spacing={30}
            dotRadius={1.6}
            baseOpacity={0.14}
            color="#18181b"
            pingEvery={1.8}
            speed={300}
            ringWidth={120}
            amplitude={0.8}
            className="px-6 py-14 lg:px-10 lg:py-20"
          >
            <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
              <span className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500 backdrop-blur">
                <VectorPolygon className="h-3.5 w-3.5" />
                7 visualizações disponíveis
              </span>
            </div>

            <div className="flex flex-col items-center gap-6 text-center">
              <div>
                <h1 className="bg-gradient-to-br from-zinc-950 via-zinc-600 to-zinc-950 bg-clip-text text-7xl font-semibold tracking-[-0.05em] text-transparent md:text-8xl">
                  Matemática Interativa
                </h1>
                <p className="mx-auto mt-5 max-w-2xl font-mono text-sm leading-6 text-zinc-500">
                  <span className="box-decoration-clone bg-white px-2 py-0.5">
                    Aprenda matemática através da visualização. Explore cada
                    equação como uma cena interativa e com parâmetros
                    ajustáveis.
                  </span>
                </p>
              </div>
            </div>
          </SonarGrid>
        </header>

        <section className="mb-14">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                <FlaskConical className="h-3.5 w-3.5" />
                LABORATÓRIO / 01
              </div>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                Experimentos interativos
              </h2>
              <p className="mt-2 max-w-2xl font-mono text-xs leading-5 text-zinc-500">
                Simulações físicas com parâmetros ajustáveis e animação em
                tempo real. Comece pelo primeiro experimento: o tiro livre de
                basquete.
              </p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
              1 experimento
            </span>
          </div>

          <BasketballLab />
        </section>

        <section className="mb-14">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                <Compass className="h-3.5 w-3.5" />
                EXPLORAR / 02
              </div>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                Galeria de visualizações
              </h2>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
              Trigo… {vizzes.length} páginas
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vizzes.map((viz) => (
              <GalleryCard key={viz.slug} viz={viz} />
            ))}
          </div>
        </section>

        <footer className="mt-12 flex flex-col justify-between gap-3 border-t border-zinc-200 pt-6 font-mono text-[10px] uppercase tracking-wider text-zinc-400 md:flex-row">
          <span className="flex items-center gap-2">
            <Sigma className="h-3.5 w-3.5" />
            Interface de visualização matemática
          </span>
          <span>TypeScript / React / Next.js / Tailwind</span>
        </footer>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function GalleryCard({ viz }: { viz: Visualization }) {
  return (
    <Link
      href={`/viz/${viz.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-1 hover:border-zinc-950 hover:shadow-[0_16px_40px_-18px_rgba(0,0,0,0.28)]"
    >
      <div className="relative h-44 overflow-hidden border-b border-zinc-100 bg-zinc-50/60">
        <VizPreview viz={viz} className="h-full w-full" />
        <span className="absolute left-4 top-4 rounded-md border border-zinc-200 bg-white/90 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 backdrop-blur">
          viz. {viz.index}
        </span>
        <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md bg-zinc-950 text-white opacity-0 transition group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      <div className="flex flex-col gap-3 p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
          {viz.category}
        </div>
        <h2 className="text-xl font-semibold tracking-tight">{viz.title}</h2>

        <div className="flex items-center gap-3">
          <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-zinc-950 px-2 font-mono text-xs font-bold text-white">
            {viz.glyph}
          </span>
          <span className="truncate font-mono text-sm text-zinc-700">
            {viz.equation}
          </span>
        </div>

        <p className="text-sm leading-5 text-zinc-500">{viz.description}</p>

        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {viz.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

function PlaceholderCard({
  index,
  title,
  category,
  description,
}: {
  index: string;
  title: string;
  category: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            CARD {index}/03 — {category}
          </div>
          <h3 className="mt-0.5 text-lg font-semibold">{title}</h3>
        </div>
        <span className="ml-auto rounded-md border border-zinc-200 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-zinc-400">
          em breve
        </span>
      </div>
      <p className="font-mono text-xs leading-5 text-zinc-500">{description}</p>
    </div>
  );
}