// ============================================================
// Tema visual compartilhado: a direção "Ficha em cartões" do protótipo
// original (DESIGN.md). Tokens do Aulor + classes de componente.
// Carregado de forma síncrona no <head>, ANTES do Tailwind browser build:
// injeta o <style type="text/tailwindcss">, as fontes, o favicon e o
// styles.css. Assim cada página não repete o bloco @theme.
//
// Cartão branco sobre o fundo neutro frio no claro; no escuro, o cartão
// quase preto sobre o preto, como as telas em cartões do original hoje.
// Toda classe clara vem com o par dark: na mesma regra.
// ============================================================

(function () {
  const css = `
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-petrol-700: #15526B;
  --color-petrol-800: #0F3D4E;
  --color-petrol-900: #0B2D3C;
  --color-petrol-950: #071E2C;
  --color-laranja: #C47A3A;
  --color-laranja-escuro: #A05E28;
  --color-areia: #F5F0E8;
  --color-fundo: #F3F5F6; /* petróleo a 5% sobre branco: neutro frio da paleta */
  --color-neutral-925: #111111;
  --font-sans: 'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif;
  --font-display: 'Atkinson Hyperlegible Next', ui-sans-serif, sans-serif;
  --font-registro: 'Source Serif 4', Georgia, serif; /* só no nome do registro aberto */
}

/* Em camada "components": utilitários na classe (ex.: text-red-700) sobrescrevem estes padrões. */
@layer components {
.campo {
  @apply w-full rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-slate-700 dark:text-neutral-200 placeholder:text-slate-400 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400 focus:ring-2 focus:ring-petrol-800/20 disabled:opacity-60;
}
.campo-erro {
  @apply border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20;
}
/* Regra do Rótulo Baixo: 12px/500 em caixa normal, na cor de apoio. */
.rotulo {
  @apply block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1;
}
.check {
  @apply appearance-none shrink-0 h-[18px] w-[18px] rounded-[5px] border-2 border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 cursor-pointer transition
    hover:border-petrol-800 dark:hover:border-sky-400
    focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 dark:focus-visible:ring-sky-400/40
    checked:border-petrol-800 checked:bg-petrol-800 dark:checked:border-sky-400 dark:checked:bg-sky-400
    disabled:opacity-50 disabled:cursor-not-allowed bg-center bg-no-repeat;
}
.check:checked {
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M3.5 8.5l3 3 6-6.5' stroke='white' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e");
  background-size: 14px 14px;
}
.dark .check:checked {
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M3.5 8.5l3 3 6-6.5' stroke='%23000' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e");
}

/* Botões (BOTAO_* do original). Petróleo é a única cor que diz "clique aqui"; cobre nunca vai em botão. */
.btn-pri, .btn-sec, .btn-fantasma, .btn-perigo {
  @apply inline-flex items-center justify-center gap-1.5 h-9 rounded-lg px-3 text-sm font-medium transition whitespace-nowrap
    focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 dark:focus-visible:ring-sky-400/50
    disabled:opacity-40 disabled:cursor-not-allowed;
}
.btn-pri { @apply px-3.5 font-semibold bg-petrol-800 hover:bg-petrol-900 text-white dark:bg-areia dark:hover:bg-white dark:text-petrol-800 shadow-sm; }
.btn-sec { @apply border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300; }
.btn-fantasma { @apply h-8 px-2.5 rounded-md text-slate-500 dark:text-neutral-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900; }
.btn-perigo { @apply font-semibold bg-red-600 hover:bg-red-700 text-white; }
.btn-pequeno { @apply h-8 px-2.5; }

/* Cartão: a única coisa elevada na página (CARTAO do original). */
.painel { @apply bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)]; }
.link { @apply text-petrol-800 dark:text-sky-300 hover:underline underline-offset-2; }

/* Abas: inativa em apoio; ativa em tinta com sublinhado de 2px no papel marca-tinta. Cobre nunca sublinha aba. */
.aba {
  @apply px-0.5 pb-2.5 text-sm border-b-2 border-transparent text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200 transition whitespace-nowrap;
}
.aba-ativa {
  @apply border-[color:var(--f-marca-tinta)] text-slate-900 dark:text-neutral-100 font-medium hover:text-slate-900 dark:hover:text-neutral-100;
}

/* Tabela no cartão, de borda a borda dele (THEAD/TD do original). */
.tabela { @apply w-full text-sm; }
.tabela th { @apply text-left text-xs font-medium text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 px-4 py-2.5 border-b border-slate-200 dark:border-neutral-800 whitespace-nowrap; }
.tabela td { @apply px-4 py-2.5 border-b border-slate-100 dark:border-neutral-900 text-slate-600 dark:text-neutral-300 align-middle; }
.tabela tbody tr:last-child td { @apply border-b-0; }
.tabela tbody tr.linha-link { @apply cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900; }
.num { @apply tabular-nums text-right whitespace-nowrap; }
.tabela th.num { @apply text-right; } /* o th.text-left acima venceria o .num */
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
  // Plus Jakarta Sans só nas páginas que mostram a folha do certificado (fonte "Moderna" do modelo).
  const folha = /certificado|validar/.test(location.pathname) ? '&family=Plus+Jakarta+Sans:wght@400;500;600;700' : '';
  link({ rel: 'preconnect', href: 'https://fonts.googleapis.com' });
  link({ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' });
  link({ rel: 'stylesheet', href: `https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,600${folha}&display=swap` });
  link({ rel: 'stylesheet', href: `styles.css${new URL(document.currentScript.src).search}` }); // mesmo ?v= da página
  link({ rel: 'icon', type: 'image/svg+xml', href: 'img/aulor-favicon.svg' });
})();
