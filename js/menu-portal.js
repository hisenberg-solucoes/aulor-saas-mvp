// ============================================================
// Shell dos portais do aluno e do professor: o mesmo do administrativo
// (js/menu.js; DESIGN.md do aulor-web, Shell). Na sidebar, o portal e a
// escola no lugar da unidade, os itens fixos e os grupos colapsáveis (estado
// em localStorage['aulor-v1-portal-<id>-menus']); na barra de contexto, o
// nome do grupo como h1 e a pessoa, que abre um popover com o e-mail e Sair.
// Cada portal declara o menu em <portal>/js/menu.js (MENU_FIXOS, MENU_GRUPOS,
// MENU_ALIAS e MENU_PORTAL). Carregar com `defer`, depois dele.
// ============================================================

(function () {
  const ESCOLA = 'ProWay';
  const SETA = '<svg data-seta aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>';
  const FORA = '<svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>';
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pagina = () => (location.pathname.split('/').pop() || MENU_FIXOS[0].href).toLowerCase();

  // Item que leva para fora (Cursos EAD, na Toolzz) abre em nova aba e diz para onde vai.
  const item = (it, ativo) => `
        <a href="${it.href}" class="nav-item${ativo ? ' nav-item-ativo' : ''}"${ativo ? ' aria-current="page"' : ''}${it.externo ? ' target="_blank" rel="noopener"' : ''}>
          <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">${it.icone}</svg>
          <span>${esc(it.nome)}</span>${it.externo ? `<span class="nav-externo">${esc(it.externo)}${FORA}</span>` : ''}
        </a>`;

  function render(nav, atual) {
    const CHAVE = `aulor-v1-portal-${MENU_PORTAL.id}-menus`;
    let estado = {};
    try { estado = JSON.parse(localStorage.getItem(CHAVE) || '{}'); } catch (_) { estado = {}; }
    nav.innerHTML = `
        <div class="shell-unidade"><span class="shell-unidade-rotulo">${esc(MENU_PORTAL.nome)}</span><span class="shell-unidade-nome">${ESCOLA}</span></div>`
      + MENU_FIXOS.map((it) => item(it, it.href === atual)).join('')
      + MENU_GRUPOS.map((g) => `
        <div class="menu-grupo" data-grupo="${g.id}">
          <button type="button" data-toggle-grupo aria-expanded="true" aria-controls="grupo-${g.id}" class="menu-grupo-botao">
            <span>${esc(g.nome)}</span>${SETA}
          </button>
          <div id="grupo-${g.id}">${g.itens.map((it) => item(it, it.href === atual)).join('')}</div>
        </div>`).join('');
    const aplicar = (grupo, aberto) => {
      const btn = grupo.querySelector('[data-toggle-grupo]');
      btn.setAttribute('aria-expanded', String(aberto));
      grupo.querySelector('#' + btn.getAttribute('aria-controls')).hidden = !aberto;
    };
    nav.querySelectorAll('.menu-grupo').forEach((grupo) => {
      const id = grupo.dataset.grupo;
      aplicar(grupo, !!grupo.querySelector('.nav-item-ativo') || estado[id] !== false);
      grupo.querySelector('[data-toggle-grupo]').addEventListener('click', () => {
        const aberto = grupo.querySelector('[data-toggle-grupo]').getAttribute('aria-expanded') !== 'true';
        estado[id] = aberto; localStorage.setItem(CHAVE, JSON.stringify(estado)); aplicar(grupo, aberto);
      });
    });
  }

  // A pessoa: avatar com as iniciais (primeira e última palavra) e o nome; abre um popover com o e-mail, o papel e Sair.
  function renderUsuario(pessoa) {
    const alvo = document.querySelector('.shell-usuario');
    if (!alvo || !pessoa) return;
    const partes = pessoa.nome.trim().split(/\s+/);
    const iniciais = (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
    const bloco = document.createElement('div');
    bloco.innerHTML = `
      <button type="button" class="shell-usuario" popovertarget="menu-conta" aria-haspopup="menu">
        <span class="shell-avatar" aria-hidden="true">${esc(iniciais)}</span>
        <span class="shell-usuario-nome">${esc(pessoa.nome)}</span>
      </button>
      <div id="menu-conta" popover class="menu-conta ficha" role="menu">
        <p class="menu-conta-email">${esc(pessoa.email || 'Sem e-mail cadastrado')}</p>
        <p class="menu-conta-perfil">${esc(MENU_PORTAL.papel)}</p>
        <hr>
        <button type="button" role="menuitem" data-sair>Sair</button>
      </div>`;
    const [botao, menu] = bloco.children;
    alvo.replaceWith(botao);
    document.body.append(menu); // fora do .shell: abre sobre o conteúdo, com os tons dele
    menu.addEventListener('toggle', (e) => {
      if (e.newState !== 'open') return;
      const r = botao.getBoundingClientRect();
      menu.style.top = `${r.bottom + 4}px`;
      menu.style.right = `${innerWidth - r.right}px`;
    });
    menu.querySelector('[data-sair]').addEventListener('click', MENU_PORTAL.sair);
  }

  // Celular: cada célula das tabelas .tabela leva o rótulo da coluna, e styles.css (.tabela-cartoes)
  // empilha a linha como cartão. As telas redesenham as tabelas, então o observador rotula as linhas novas.
  function rotularTabelas() {
    document.querySelectorAll('table.tabela tbody tr:not([data-rotulada])').forEach((tr) => {
      const tabela = tr.closest('table');
      const rotulos = [...tabela.querySelectorAll('thead th')].map((th) => th.textContent.trim());
      let col = 0;
      [...tr.cells].forEach((td) => { td.dataset.rotulo = td.colSpan > 1 ? '' : rotulos[col] ?? ''; col += td.colSpan; });
      tr.dataset.rotulada = '';
      tabela.classList.add('tabela-cartoes');
    });
  }

  function iniciar() {
    rotularTabelas();
    new MutationObserver(rotularTabelas).observe(document.body, { childList: true, subtree: true });
    const nav = document.querySelector('aside[data-sidebar] nav');
    if (!nav) return;
    const p = pagina();
    const atual = MENU_ALIAS[p] ?? p;
    render(nav, atual);
    // Barra de contexto: diz onde você está (o grupo, ou o item fixo), não o que a tela é.
    const h1 = document.querySelector('.shell-titulo');
    if (h1) h1.textContent = MENU_GRUPOS.find((g) => g.itens.some((i) => i.href === atual))?.nome
      ?? MENU_FIXOS.find((i) => i.href === atual)?.nome ?? MENU_FIXOS[0].nome;
    renderUsuario(MENU_PORTAL.pessoa());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
