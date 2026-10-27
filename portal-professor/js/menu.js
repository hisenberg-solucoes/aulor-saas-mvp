// ============================================================
// Menu lateral compartilhado do Portal do Professor — mesmo comportamento do
// js/menu.js do admin: a sidebar é IDÊNTICA em todas as telas, item "Início"
// fixo no topo + grupos na mesma ordem, colapsáveis (estado em
// localStorage['prototipo-portal-professor-menus']); só muda o destaque do
// item ativo — o grupo dele abre nesta visita, sem gravar estado. Busca no
// topo filtra itens/grupos; o scroll da sidebar persiste entre páginas.
// Páginas de detalhe (turma.html, aula.html, contrato.html) herdam o item da
// lista via MENU_ALIAS. Carregar com `defer` depois de tooltip.js/privacidade.js.
//
// Modo de compartilhamento de tela (privacidade.js): item/grupo com
// `privado: true` sai com `data-privado` e some quando o modo está ligado.
// ============================================================

const MENU_FIXOS = [
  {
    href: 'home.html', nome: 'Início',
    icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />',
  },
];

const MENU_GRUPOS = [
  {
    id: 'turmas', nome: 'Turmas',
    itens: [
      {
        href: 'turmas.html', nome: 'Minhas turmas',
        icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.55 50.55 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />',
      },
      {
        href: 'calendario.html', nome: 'Calendário',
        icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />',
      },
    ],
  },
  {
    id: 'alunos', nome: 'Alunos', privado: true,
    itens: [
      {
        href: 'avaliacoes.html', nome: 'Avaliações', privado: true,
        icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />',
      },
      {
        href: 'dossies.html', nome: 'Dossiês', privado: true,
        icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />',
      },
    ],
  },
  {
    id: 'financeiro', nome: 'Financeiro', privado: true,
    itens: [
      {
        href: 'pagamentos.html', nome: 'Pagamentos', privado: true,
        icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />',
      },
      {
        href: 'contratos.html', nome: 'Contratos', privado: true,
        icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />',
      },
    ],
  },
  {
    id: 'conta', nome: 'Conta', privado: true,
    itens: [
      {
        href: 'meus-dados.html', nome: 'Meus dados', privado: true,
        icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />',
      },
    ],
  },
];

// Página de detalhe → item da lista que fica destacado.
const MENU_ALIAS = {
  'turma.html': 'turmas.html',
  'aula.html': 'turmas.html',
  'contrato.html': 'contratos.html',
  'dossie.html': 'dossies.html',
};

(function () {
  const CHAVE = 'prototipo-portal-professor-menus';
  const CHAVE_SCROLL = 'prototipo-portal-professor-menu-scroll';
  const SETA = '<svg class="h-3.5 w-3.5 transition-transform" data-seta fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>';
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pagina = () => (location.pathname.split('/').pop() || 'home.html').toLowerCase();

  const item = (it, ativo) => `
        <a href="${it.href}"${it.privado ? ' data-privado' : ''} class="nav-item${ativo ? ' nav-item-ativo' : ''}"${ativo ? ' aria-current="page"' : ''}>
          <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">${it.icone}</svg>
          <span class="truncate">${esc(it.nome)}</span>
        </a>`;

  // Mesma sidebar em todas as telas: Início + todos os grupos colapsáveis (estado
  // guardado). O grupo do item ativo abre nesta visita, sem alterar o estado salvo.
  function render(nav, atual) {
    let estado = {};
    try { estado = JSON.parse(localStorage.getItem(CHAVE) || '{}'); } catch (_) { estado = {}; }
    let html = `
        <label class="relative block mb-2">
          <svg class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input data-busca-menu type="search" placeholder="Buscar no menu" autocomplete="off"
            class="w-full rounded-lg bg-white/5 border border-white/10 pl-8 pr-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent" />
        </label>`;
    html += MENU_FIXOS.map((it) => item(it, it.href === atual)).join('');
    // Folha: a aula vem no salário, sem contrato nem pagamento pelo portal.
    const folha = typeof PortalProfessor !== 'undefined' && PortalProfessor.instrutorLogado()?.remuneracao === 'folha';
    html += MENU_GRUPOS.filter((g) => !(folha && g.id === 'financeiro')).map((g) => `
        <div class="menu-grupo" data-grupo="${g.id}"${g.privado ? ' data-privado' : ''}>
          <button type="button" data-toggle-grupo aria-expanded="true" aria-controls="grupo-${g.id}"
            class="w-full flex items-center justify-between px-3 mt-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-200 hover:bg-white/5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30">
            <span>${esc(g.nome)}</span>${SETA}
          </button>
          <div id="grupo-${g.id}" class="space-y-1 mt-0.5">${g.itens.map((it) => item(it, it.href === atual)).join('')}</div>
        </div>`).join('');
    nav.innerHTML = html;
    const aplicar = (grupo, aberto) => {
      const btn = grupo.querySelector('[data-toggle-grupo]');
      btn.setAttribute('aria-expanded', String(aberto));
      grupo.querySelector('#' + btn.getAttribute('aria-controls')).classList.toggle('hidden', !aberto);
      btn.querySelector('[data-seta]').classList.toggle('-rotate-90', !aberto);
    };
    nav.querySelectorAll('.menu-grupo').forEach((grupo) => {
      const id = grupo.dataset.grupo;
      const temAtivo = !!grupo.querySelector('.nav-item-ativo');
      aplicar(grupo, temAtivo || estado[id] !== false);
      grupo.querySelector('[data-toggle-grupo]').addEventListener('click', () => {
        const aberto = grupo.querySelector('[data-toggle-grupo]').getAttribute('aria-expanded') !== 'true';
        estado[id] = aberto; localStorage.setItem(CHAVE, JSON.stringify(estado)); aplicar(grupo, aberto);
      });
    });
    const busca = nav.querySelector('[data-busca-menu]');
    const normalizar = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const filtrar = () => {
      const termo = normalizar(busca.value.trim());
      // style.display inline: a classe .hidden perde para o display:flex de .nav-item
      nav.querySelectorAll(':scope > .nav-item').forEach((a) => {
        a.style.display = !termo || normalizar(a.textContent).includes(termo) ? '' : 'none';
      });
      nav.querySelectorAll('.menu-grupo').forEach((grupo) => {
        let visiveis = 0;
        grupo.querySelectorAll('.nav-item').forEach((a) => {
          const mostra = !termo || normalizar(a.textContent).includes(termo);
          a.style.display = mostra ? '' : 'none';
          if (mostra) visiveis += 1;
        });
        grupo.classList.toggle('hidden', !!termo && !visiveis);
        aplicar(grupo, termo ? true : !!grupo.querySelector('.nav-item-ativo') || estado[grupo.dataset.grupo] !== false);
      });
    };
    busca.addEventListener('input', filtrar);
    busca.addEventListener('keydown', (e) => { if (e.key === 'Escape') { busca.value = ''; filtrar(); busca.blur(); } });
    // A sidebar não muda de posição ao trocar de página: restaura o scroll da
    // visita anterior; o scrollIntoView('nearest') só age se o item ativo ficou
    // fora da área visível.
    nav.scrollTop = Number(sessionStorage.getItem(CHAVE_SCROLL) || 0);
    nav.addEventListener('scroll', () => sessionStorage.setItem(CHAVE_SCROLL, String(nav.scrollTop)));
    nav.querySelector('.nav-item-ativo')?.scrollIntoView({ block: 'nearest' });
  }

  function iniciar() {
    const nav = document.querySelector('aside[data-sidebar] nav');
    if (!nav) return;
    nav.className = 'flex-1 min-h-0 overflow-y-auto py-4 px-3 space-y-1 text-sm';
    const p = pagina();
    render(nav, MENU_ALIAS[p] ?? p);
    // O nav estático de cada página vem com visibility:hidden para não piscar
    // antes da troca pelo menu definitivo; revela só depois do render.
    nav.style.visibility = '';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
