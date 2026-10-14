// ============================================================
// Tema visual compartilhado: direção Ficha (DESIGN.md), papéis --f-* e classes de componente.
// Carregado de forma síncrona no <head>, ANTES do Tailwind browser build:
// injeta o <style type="text/tailwindcss">, as fontes, o favicon e o
// styles.css. Assim cada página não repete o bloco @theme.
// ============================================================

(function () {
  const css = `
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* Ficha: Atkinson Hyperlegible Next na interface (13px), Source Serif 4 só no nome do registro aberto. */
  --font-sans: 'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif;
  --font-display: 'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif;
  --font-registro: 'Source Serif 4', Georgia, serif;
  --text-sm: 13px;
  --text-sm--line-height: 20px;
}

/* Papéis da Ficha: valores em styles.css (:root no claro, html.dark no escuro). */
@theme inline {
  --color-papel: var(--f-papel);
  --color-elevado: var(--f-elevado);
  --color-faixa: var(--f-faixa);
  --color-linha: var(--f-linha);
  --color-linha-forte: var(--f-linha-forte);
  --color-tinta: var(--f-tinta);
  --color-tinta-2: var(--f-tinta-2);
  --color-tinta-3: var(--f-tinta-3);
  --color-realce: var(--f-realce);
  --color-selecao: var(--f-selecao);
  --color-marca: var(--f-marca);
  --color-sobre-marca: var(--f-sobre-marca);
  --color-marca-tinta: var(--f-marca-tinta);
  --color-cobre: var(--f-cobre);
  --color-cobre-tinta: var(--f-cobre-tinta);
  --color-bom: var(--f-bom);
  --color-ruim: var(--f-ruim);
  --color-sobre-ruim: var(--f-sobre-ruim);
  --color-aviso: var(--f-aviso);
  --color-etiqueta: var(--f-etiqueta);
  --color-etiqueta-tinta: var(--f-etiqueta-tinta);
  --color-veu: var(--f-veu);
}

/* Em camada "components": utilitários na classe (ex.: text-ruim) sobrescrevem estes padrões.
   Foco: o anel vem de .ficha :focus-visible (styles.css), igual em todos os controles. */
@layer components {
.campo {
  @apply w-full rounded-lg border border-linha-forte bg-elevado px-2.5 py-[5px] text-[13px] leading-5 text-tinta placeholder:text-tinta-3 transition hover:border-tinta-3/60 focus:border-marca-tinta disabled:opacity-40 aria-[invalid=true]:border-ruim;
}
.campo-erro {
  @apply border-ruim hover:border-ruim focus:border-ruim;
}
.rotulo {
  @apply block text-xs font-medium text-tinta-2 mb-1.5;
}
.check {
  @apply appearance-none shrink-0 h-4 w-4 rounded border border-linha-forte bg-elevado cursor-pointer transition
    hover:border-marca-tinta checked:border-marca checked:bg-marca
    disabled:opacity-40 disabled:cursor-not-allowed bg-center bg-no-repeat;
}
.check:checked {
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M3.5 8.5l3 3 6-6.5' stroke='%23F5F0E8' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e");
  background-size: 12px 12px;
}
/* No escuro a marca é areia: o visto passa a petróleo (sobre-marca). */
.dark .check:checked {
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M3.5 8.5l3 3 6-6.5' stroke='%230F3D4E' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e");
}

/* Botões da Ficha: 32px, 13px/500. Primário em marca (petróleo no claro, areia no escuro), um por área. */
.btn-pri, .btn-sec, .btn-fantasma, .btn-perigo {
  @apply inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium transition whitespace-nowrap
    disabled:opacity-40 disabled:cursor-not-allowed;
}
.btn-pri { @apply bg-marca text-sobre-marca hover:bg-marca/90; }
.btn-sec { @apply border border-linha-forte bg-elevado text-tinta hover:bg-realce disabled:hover:bg-elevado; }
.btn-fantasma { @apply h-7 px-2 rounded-md text-[12.5px] text-tinta-2 hover:bg-realce hover:text-tinta; }
.btn-perigo { @apply bg-ruim text-sobre-ruim hover:bg-ruim/90; }
.btn-pequeno { @apply h-7 px-2.5 text-xs; }

/* Cartão: o layout V0 das telas, nos papéis da Ficha (elevado sobre o papel, contorno linha). */
.painel { @apply bg-elevado border border-linha rounded-xl; }
.link { @apply font-medium text-marca-tinta underline underline-offset-[3px] decoration-linha-forte transition hover:decoration-current; }

/* Abas: 13px/500 em tinta 3; a ativa em tinta com sublinhado de 2px. */
.aba {
  @apply relative pb-2.5 pt-1 text-[13px] font-medium text-tinta-3 hover:text-tinta-2 transition whitespace-nowrap;
}
.aba-ativa {
  @apply text-tinta hover:text-tinta;
}
.aba-ativa::after {
  content: '';
  @apply absolute left-0 right-0 bottom-0 h-0.5 bg-tinta;
}

/* Tabela: cabeçalho em label (12px/500, tinta 3), linhas de 36px separadas por linha. */
.tabela { @apply w-full text-[13px] leading-5; }
.tabela th { @apply text-left text-xs font-medium text-tinta-3 px-4 py-2 border-b border-linha whitespace-nowrap; }
.tabela td { @apply px-4 py-2 border-b border-linha text-tinta align-middle; }
.tabela tbody tr:last-child td { @apply border-b-0; }
.tabela tbody tr.linha-link { @apply cursor-pointer hover:bg-realce; }
.num { @apply tabular-nums text-right whitespace-nowrap; }
}
`;

  const estilo = document.createElement('style');
  estilo.type = 'text/tailwindcss';
  estilo.textContent = css;
  document.head.appendChild(estilo);

  const link = (attrs) => {
    const el = document.createElement('link');
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  };
  link({ rel: 'preconnect', href: 'https://fonts.googleapis.com' });
  link({ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' });
  link({ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,600&display=swap' });
  link({ rel: 'stylesheet', href: 'styles.css' });
  link({ rel: 'icon', type: 'image/svg+xml', href: 'img/aulor-favicon.svg' });
})();
