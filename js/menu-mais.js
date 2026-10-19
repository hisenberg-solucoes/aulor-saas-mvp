// ============================================================
// Menu "Mais" do cabeçalho de registro (fichas de clientes e de contrato) e da linha do Financeiro.
// Separado de avaliacoes-ui.js porque compras tem o seu próprio abrirMenu (com título)
// e carrega aquele arquivo também.
// ============================================================

// Mesmo desenho do ⋯ de compras. Esc, Tab ou clique fora fecham; setas andam.
// Item desabilitado continua focável para o motivo (`detalhe`) ser lido.
let menuAberto = null;
function fecharMenu() {
  if (!menuAberto) return;
  const { el, gatilho, fora, tecla } = menuAberto;
  menuAberto = null;
  el.remove();
  gatilho.setAttribute('aria-expanded', 'false');
  document.removeEventListener('mousedown', fora, true);
  document.removeEventListener('keydown', tecla, true);
  window.removeEventListener('scroll', fecharMenu, true);
  window.removeEventListener('resize', fecharMenu);
}
function abrirMenu(gatilho, itens) {
  if (menuAberto?.gatilho === gatilho) { fecharMenu(); return; }
  fecharMenu();
  const el = document.createElement('div');
  el.setAttribute('role', 'menu');
  el.className = 'fixed z-50 w-64 rounded-[10px] border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.28)] p-1.5';
  el.innerHTML = itens.map((it, i) => (it === 'sep' ? '<div role="separator" class="my-1 border-t border-slate-100 dark:border-neutral-900"></div>' : `
    <button type="button" role="menuitem" data-i="${i}" ${it.desabilitado ? 'aria-disabled="true"' : ''}
      class="block w-full text-left px-2.5 py-1.5 rounded-md text-sm transition focus:outline-none ${it.desabilitado ? 'cursor-not-allowed text-slate-400 dark:text-neutral-500 focus:bg-slate-100 dark:focus:bg-neutral-900' : it.perigo ? 'text-red-700 dark:text-red-400 hover:bg-red-50 focus:bg-red-50 dark:hover:bg-red-950/40 dark:focus:bg-red-950/40' : 'text-slate-700 dark:text-neutral-200 hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-neutral-900 dark:focus:bg-neutral-900'}">
      ${esc(it.nome)}${it.detalhe ? `<span class="block text-xs text-slate-500 dark:text-neutral-400">${esc(it.detalhe)}</span>` : ''}
    </button>`)).join('');
  // Posição e largura inline: o Tailwind do CDN só gera classe nova depois que ela entra no DOM, e a medida abaixo vem antes.
  el.style.position = 'fixed';
  el.style.width = '16rem';
  document.body.appendChild(el);
  const r = gatilho.getBoundingClientRect();
  el.style.left = `${Math.max(8, Math.min(r.right - el.offsetWidth, window.innerWidth - el.offsetWidth - 8))}px`;
  // Perto do pé da janela (menu de linha de tabela), abre para cima.
  el.style.top = `${r.bottom + el.offsetHeight + 8 > window.innerHeight && r.top > el.offsetHeight ? r.top - el.offsetHeight - 4 : r.bottom + 4}px`;
  const botoes = [...el.querySelectorAll('[data-i]')];
  // O foco volta ao ⋯ antes da ação: o modal que ela abrir devolve o foco para ele ao fechar.
  botoes.forEach((b) => b.addEventListener('click', () => { const it = itens[Number(b.dataset.i)]; if (it.desabilitado) return; fecharMenu(); gatilho.focus(); it.acao(); }));
  const fora = (e) => { if (!el.contains(e.target) && !gatilho.contains(e.target)) fecharMenu(); };
  const tecla = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); fecharMenu(); gatilho.focus(); }
    else if (e.key === 'Tab') { e.preventDefault(); fecharMenu(); gatilho.focus(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const i = botoes.indexOf(document.activeElement); botoes[(i + (e.key === 'ArrowDown' ? 1 : -1) + botoes.length) % botoes.length].focus(); }
  };
  document.addEventListener('mousedown', fora, true);
  document.addEventListener('keydown', tecla, true);
  window.addEventListener('scroll', fecharMenu, true);
  window.addEventListener('resize', fecharMenu);
  gatilho.setAttribute('aria-expanded', 'true');
  menuAberto = { el, gatilho, fora, tecla };
  botoes[0]?.focus({ preventScroll: true });
}
