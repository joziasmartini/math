import type { PlotWindow } from "@/lib/plot";

export type VizKind =
  | "sine"
  | "cosine"
  | "tangent"
  | "identity"
  | "unit-circle"
  | "frequency";

export interface Visualization {
  slug: string;
  index: string;
  glyph: string;
  title: string;
  category: string;
  equation: string;
  description: string;
  detail: string;
  tags: string[];
  kind: VizKind;
  window?: PlotWindow;
}

export const visualizations: Visualization[] = [
  {
    slug: "seno",
    index: "01",
    glyph: "sin",
    title: "Seno",
    category: "Função senoidal",
    equation: "y = A·sin(x + φ)",
    description:
      "Curva periódica com a forma da onda fundamental da trigonometria.",
    detail:
      "Animê a fase φ para ver a onda deslizar horizontalmente sobre o eixo x, e ajuste a amplitude A para esticar ou comprimir a onda verticalmente. Período fixo T = 2π.",
    tags: ["onda", "período", "fase"],
    kind: "sine",
  },
  {
    slug: "cosseno",
    index: "02",
    glyph: "cos",
    title: "Cosseno",
    category: "Função senoidal",
    equation: "y = A·cos(x + φ)",
    description:
      "Mesma onda do seno, deslocada de π/2 — uma simples rotação de fase.",
    detail:
      "Compare com o seno: cos(x) = sin(x + π/2). Movimente a fase e a amplitude para confirmar que as duas curvas são a mesma onda com origens diferentes.",
    tags: ["onda", "deslocamento", "π/2"],
    kind: "cosine",
  },
  {
    slug: "tangente",
    index: "03",
    glyph: "tan",
    title: "Tangente",
    category: "Razão trigonométrica",
    equation: "y = A·tan(x)",
    description:
      "Reta inclinada que explodes em assíntotas a cada múltiplo ímpar de π/2.",
    detail:
      "tan(x) = sin(x)/cos(x). Quando cos(x) se anula, a tangente dispara para o infinito — as linhas tracejadas marcam essas assíntotas verticais.",
    tags: ["assíntota", "razão", "descontinuidade"],
    kind: "tangent",
  },
  {
    slug: "identidade",
    index: "04",
    glyph: "sin²",
    title: "Identidade Fundamental",
    category: "Identidade pitagórica",
    equation: "sin²(x) + cos²(x) = 1",
    description:
      "As duas curvas ao quadrado se somam em 1 para qualquer ângulo.",
    detail:
      "Enquanto sin²(x) e cos²(x) oscilam entre 0 e 1, a soma delas permanece exatamente constante: 1. É a forma analítica do teorema de Pitágoras no círculo unitário.",
    tags: ["quadrados", "soma", "constante"],
    kind: "identity",
    window: { xMin: -2 * Math.PI, xMax: 2 * Math.PI, yMin: -0.25, yMax: 1.25 },
  },
  {
    slug: "circulo",
    index: "05",
    glyph: "θ",
    title: "Círculo Trigonométrico",
    category: "Geometria do círculo",
    equation: "x = cosθ,  y = sinθ",
    description:
      "Senos e cossenos como projeções de um ponto que gira no raio unitário.",
    detail:
      "Gire o ângulo θ e observe cosθ como a projeção sobre o eixo x e sinθ como a projeção sobre o eixo y. O raio unitário fixa a identidade fundamental.",
    tags: ["círculo", "projeção", "radiano"],
    kind: "unit-circle",
  },
  {
    slug: "periodo",
    index: "06",
    glyph: "ω",
    title: "Período e Frequência",
    category: "Frequência angular",
    equation: "y = sin(k·x),  T = 2π/k",
    description:
      "Multiplicar o argumento comprime a onda e reduz o período ao inverso.",
    detail:
      "Aumente k para encolher o período T = 2π/k: cada revolução do argumento completa menos voltas no círculo antes da onda se repetir.",
    tags: ["frequência", "comprimento", "k"],
    kind: "frequency",
  },
];

export function getVisualizations(): Visualization[] {
  return visualizations;
}

export function findVisualization(slug: string): Visualization | undefined {
  return visualizations.find((v) => v.slug === slug);
}