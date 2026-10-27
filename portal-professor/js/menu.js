// ============================================================
// Menu lateral do Portal do Professor. Na V1 o portal é só "Minhas turmas"
// (turmas.html, a entrada do portal); a página de detalhe (turma.html) herda
// o destaque do item via MENU_ALIAS. Carregar com `defer` depois de tooltip.js.
// ============================================================

const MENU_FIXOS = [
  {
    href: 'turmas.html', nome: 'Minhas turmas',
    icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.55 50.55 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />',
  },
];

// Página de detalhe → item da lista que fica destacado.
const MENU_ALIAS = {
  'turma.html': 'turmas.html',
};

(function () {
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pagina = () => (location.pathname.split('/').pop() || 'turmas.html').toLowerCase();

  const item = (it, ativo) => `
        <a href="${it.href}" class="nav-item${ativo ? ' nav-item-ativo' : ''}"${ativo ? ' aria-current="page"' : ''}>
          <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">${it.icone}</svg>
          <span class="truncate">${esc(it.nome)}</span>
        </a>`;

  function iniciar() {
    const nav = document.querySelector('aside[data-sidebar] nav');
    if (!nav) return;
    nav.className = 'flex-1 min-h-0 overflow-y-auto py-4 px-3 space-y-1 text-sm';
    const p = pagina();
    const atual = MENU_ALIAS[p] ?? p;
    nav.innerHTML = MENU_FIXOS.map((it) => item(it, it.href === atual)).join('');
    // O nav estático de cada página vem com visibility:hidden para não piscar
    // antes da troca pelo menu definitivo; revela só depois do render.
    nav.style.visibility = '';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
