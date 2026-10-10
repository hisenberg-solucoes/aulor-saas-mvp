// ============================================================
// Tema visual compartilhado (tokens do Aulor + classes de componente).
// Carregado de forma síncrona no <head>, ANTES do Tailwind browser build:
// injeta o <style type="text/tailwindcss">, as fontes, o favicon e o
// styles.css. Assim cada página não repete o bloco @theme.
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
  --color-laranja-profundo: #8A4F20;
  --color-areia: #F5F0E8;
  --color-neutral-925: #111111;
  --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
  --font-display: 'Plus Jakarta Sans', ui-sans-serif, sans-serif;
}

/* Em camada "components": utilitários na classe (ex.: text-red-700) sobrescrevem estes padrões. */
@layer components {
.nav-item {
  @apply flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition;
}
.nav-item-ativo {
  @apply relative bg-white/10 text-white;
}
.nav-item-ativo::before {
  content: '';
  @apply absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r bg-laranja;
}

.campo {
  @apply w-full rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-slate-700 dark:text-neutral-200 placeholder:text-slate-400 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400 focus:ring-2 focus:ring-petrol-800/20 disabled:opacity-60;
}
.campo-erro {
  @apply border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20;
}
.rotulo {
  @apply block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1;
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

/* Botões. O primário usa o cobre escuro: branco sobre #A05E28 passa AA (o #C47A3A não passa). */
.btn-pri, .btn-sec, .btn-fantasma, .btn-perigo {
  @apply inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition whitespace-nowrap
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-petrol-800/40 dark:focus-visible:ring-sky-400/50
    disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-pri { @apply bg-laranja-escuro hover:bg-laranja-profundo text-white shadow-sm; }
.btn-sec { @apply border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-900; }
.btn-fantasma { @apply text-petrol-800 dark:text-sky-300 hover:bg-petrol-800/5 dark:hover:bg-sky-400/10; }
.btn-perigo { @apply bg-red-600 hover:bg-red-700 text-white; }
.btn-pequeno { @apply px-2.5 py-1.5 text-xs; }

.painel { @apply bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl; }
.link { @apply text-petrol-800 dark:text-sky-300 hover:underline underline-offset-2; }

.aba {
  @apply relative px-1 pb-2.5 pt-1 text-sm font-medium text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-100 transition whitespace-nowrap;
}
.aba-ativa {
  @apply text-petrol-800 dark:text-sky-300;
}
.aba-ativa::after {
  content: '';
  @apply absolute left-0 right-0 bottom-0 h-0.5 rounded bg-laranja;
}

.tabela { @apply w-full text-sm; }
.tabela th { @apply text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 px-4 py-2.5 border-b border-slate-200 dark:border-neutral-800 whitespace-nowrap; }
.tabela td { @apply px-4 py-3 border-b border-slate-100 dark:border-neutral-900 text-slate-700 dark:text-neutral-200 align-middle; }
.tabela tbody tr:last-child td { @apply border-b-0; }
.tabela tbody tr.linha-link { @apply cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900/60; }
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
  link({ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap' });
  link({ rel: 'stylesheet', href: 'styles.css' });
  link({ rel: 'icon', type: 'image/svg+xml', href: 'img/aulor-favicon.svg' });
})();
