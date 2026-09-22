import Link from "next/link";
import { getVisualizations, type Visualization } from "@/lib/visualizations";
import { VizPreview } from "@/components/VizPreview";
import BasketballLab from "@/components/BasketballLab";

export default function Home() {
  const vizzes = getVisualizations();

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-1 flex-col px-6 py-10 lg:px-10">
        <header className="mb-14 border-b border-zinc-200 pb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-sm font-bold text-white">
              ∑
            </div>
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-zinc-500">
              Galeria / Visualizações de equações
            </span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="text-5xl font-semibold tracking-[-0.04em] md:text-7xl">
                Math
              </h1>
              <p className="mt-4 max-w-2xl font-mono text-sm leading-6 text-zinc-500">
                Aprendendo matemática através da visualização. Explore cada
                equação como uma cena interativa e ajustável.
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-zinc-950" />
              {vizzes.length} visualizações disponíveis
            </div>
          </div>
        </header>

        <section className="mb-14">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
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
              3 experimentos
            </span>
          </div>

          <BasketballLab />

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <PlaceholderCard
              index="02"
              glyph="?"
              title="Em desenvolvimento"
              category="Experimento 02"
              description="Próximos experimentos de balística e movimento chegam em breve."
            />
            <PlaceholderCard
              index="03"
              glyph="?"
              title="Em desenvolvimento"
              category="Experimento 03"
              description="Um espaço reservado para o terceiro experimento da seção."
            />
          </div>
        </section>

        <section className="mb-14">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
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
          <span>Interface de visualização matemática</span>
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
        <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md bg-zinc-950 font-mono text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
          ↗
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
  glyph,
  title,
  category,
  description,
}: {
  index: string;
  glyph: string;
  title: string;
  category: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 font-mono text-sm font-semibold text-zinc-400">
          {glyph}
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