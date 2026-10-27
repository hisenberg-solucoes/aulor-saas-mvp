// ============================================================
// Menu lateral compartilhado (DESIGN.md do aulor-web, Shell). A sidebar é IDÊNTICA em
// todas as telas: a unidade em uso, o Início fixo e os módulos da V1 na mesma ordem,
// colapsáveis (estado em localStorage['aulor-v1-home-menus']); só muda o
// destaque do item ativo — o grupo dele abre nesta visita, sem gravar estado.
// A barra de contexto leva o nome do módulo como h1; a pessoa abre um menu com Sair.
// Páginas de detalhe (turma.html, curso.html…) herdam o item da lista via
// MENU_ALIAS. Para incluir um módulo novo: acrescente em MENU_GRUPOS (uma
// vez) — todas as páginas passam a exibi-lo. Carregar com `defer` depois de
// tooltip.js.
// ============================================================

const MENU_GRUPOS = [
  {
    "id": "comercial",
    "nome": "Comercial",
    "itens": [
      {
        "href": "contratos.html",
        "nome": "Vendas",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z\" />"
      },
      {
        "href": "alunos.html",
        "nome": "Alunos",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z\" />"
      },
      {
        "href": "responsaveis.html",
        "nome": "Responsáveis",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z\" />"
      },
      {
        "href": "empresas.html",
        "nome": "Empresas",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21\" />"
      }
    ]
  },
  {
    "id": "pedagogico",
    "nome": "Pedagógico",
    "itens": [
      {
        "href": "cursos.html",
        "nome": "Cursos",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.55 50.55 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5\" />"
      },
      {
        "href": "formacoes.html",
        "nome": "Formações",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122\" />"
      },
      {
        "href": "turmas.html",
        "nome": "Turmas",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z\" />"
      },
      {
        "href": "feriados.html",
        "nome": "Feriados",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5\" />"
      },
      {
        "href": "materiais.html",
        "nome": "Materiais das aulas",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z\" />"
      }
    ]
  },
  {
    "id": "financeiro",
    "nome": "Financeiro",
    "itens": [
      {
        "href": "financeiro.html",
        "nome": "Financeiro",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" />"
      },
      {
        "href": "contas-bancarias.html",
        "nome": "Contas bancárias",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z\" />"
      },
      {
        "href": "centros-custo.html",
        "nome": "Centros de custo",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6\" />"
      }
    ]
  },
  {
    "id": "pessoas",
    "nome": "Pessoas",
    "itens": [
      {
        "href": "instrutores.html",
        "nome": "Instrutores",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.55 50.55 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5\" />"
      },
      {
        "href": "colaboradores.html",
        "nome": "Colaboradores",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z\" />"
      }
    ]
  },
  {
    "id": "configuracoes",
    "nome": "Configurações",
    "itens": [
      {
        "href": "perfis.html",
        "nome": "Perfis de acesso",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z\" />"
      },
      {
        "href": "modelos-contrato.html",
        "nome": "Modelos de contrato",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z\" />"
      }
    ]
  }
];


// Os grupos só com os itens que a pessoa pode ver (js/acesso.js); o Início fica sempre.
function menuVisivel() {
  if (typeof Acesso === 'undefined') return MENU_GRUPOS;
  return MENU_GRUPOS.map((g) => ({ ...g, itens: g.itens.filter((i) => Acesso.pode(Acesso.tela(i.href))) })).filter((g) => g.itens.length);
}

const MENU_FIXOS = [
  {
    href: 'home.html', nome: 'Início',
    icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />',
  },
];

// Sessão da demonstração: quem entrou (gravada em entrar.html). Só demonstra; não é segurança.
const SESSAO_CHAVE = 'aulor-v1-sessao';
const Sessao = {
  atual() { try { return JSON.parse(localStorage.getItem(SESSAO_CHAVE)) || null; } catch (_) { return null; } },
  entrar(s) { localStorage.setItem(SESSAO_CHAVE, JSON.stringify(s)); },
  sair() { localStorage.removeItem(SESSAO_CHAVE); },
};
const UNIDADE = 'ProWay';

(function () {
  const SETA = '<svg data-seta aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>';
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pagina = () => (location.pathname.split('/').pop() || 'home.html').toLowerCase();

  const item = (it, ativo) => `
        <a href="${it.href}" class="nav-item${ativo ? ' nav-item-ativo' : ''}"${ativo ? ' aria-current="page"' : ''}>
          <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">${it.icone}</svg>
          <span>${esc(it.nome)}</span>
        </a>`;

  // Mesma sidebar em todas as telas: unidade, Início e os grupos colapsáveis (estado
  // guardado). O grupo do item ativo abre nesta visita, sem alterar o estado salvo.
  function render(nav, atual, grupos) {
    const CHAVE = 'aulor-v1-home-menus';
    let estado = {};
    try { estado = JSON.parse(localStorage.getItem(CHAVE) || '{}'); } catch (_) { estado = {}; }
    let html = `
        <div class="shell-unidade"><span class="shell-unidade-rotulo">Unidade</span><span class="shell-unidade-nome">${esc(UNIDADE)}</span></div>`;
    html += MENU_FIXOS.map((it) => item(it, it.href === atual)).join('');
    html += grupos.map((g) => `
        <div class="menu-grupo" data-grupo="${g.id}">
          <button type="button" data-toggle-grupo aria-expanded="true" aria-controls="grupo-${g.id}" class="menu-grupo-botao">
            <span>${esc(g.nome)}</span>${SETA}
          </button>
          <div id="grupo-${g.id}">${g.itens.map((it) => item(it, it.href === atual)).join('')}</div>
        </div>`).join('');
    nav.innerHTML = html;
    const aplicar = (grupo, aberto) => {
      const btn = grupo.querySelector('[data-toggle-grupo]');
      btn.setAttribute('aria-expanded', String(aberto));
      grupo.querySelector('#' + btn.getAttribute('aria-controls')).hidden = !aberto;
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
    // A sidebar não muda de posição ao trocar de página: restaura o scroll da visita anterior.
    nav.scrollTop = Number(sessionStorage.getItem('aulor-v1-menu-scroll') || 0);
    nav.addEventListener('scroll', () => sessionStorage.setItem('aulor-v1-menu-scroll', String(nav.scrollTop)));
    nav.querySelector('.nav-item-ativo')?.scrollIntoView({ block: 'nearest' });
  }

  // A pessoa: avatar com as iniciais (primeira e última palavra) e o nome; abre um popover com o e-mail e Sair.
  function renderUsuario(sessao) {
    const alvo = document.querySelector('.shell-usuario');
    if (!alvo) return;
    const partes = sessao.nome.trim().split(/\s+/);
    const iniciais = (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
    const bloco = document.createElement('div');
    bloco.innerHTML = `
      <button type="button" class="shell-usuario" popovertarget="menu-conta" aria-haspopup="menu">
        <span class="shell-avatar" aria-hidden="true">${esc(iniciais)}</span>
        <span class="shell-usuario-nome">${esc(sessao.nome)}</span>
      </button>
      <div id="menu-conta" popover class="menu-conta ficha" role="menu">
        <p class="menu-conta-email">${esc(sessao.email)}</p>
        <p class="menu-conta-perfil">${esc(sessao.perfilNome ?? '')}</p>
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
    menu.querySelector('[data-sair]').addEventListener('click', () => { Sessao.sair(); location.href = 'entrar.html?saiu=1'; });
  }

  function iniciar() {
    const nav = document.querySelector('aside[data-sidebar] nav');
    if (!nav) return;
    const sessao = Sessao.atual() ?? { nome: 'Ana Souza', email: 'ana.souza@proway.com.br', perfil: 'administrador', perfilNome: 'Administrador' };
    // Detalhe herda o item da lista (turma.html → Turmas): os dois são a mesma tela do catálogo.
    const p = pagina();
    const tela = typeof Acesso !== 'undefined' ? Acesso.tela(p) : p.replace(/\.html$/, '');
    const atual = MENU_GRUPOS.flatMap((g) => g.itens).find((i) => i.href === `${tela}.html`)?.href ?? p;
    render(nav, atual, menuVisivel());
    // Barra de contexto: diz onde você está (o módulo), não o que a tela é.
    const grupo = MENU_GRUPOS.find((g) => g.itens.some((i) => i.href === atual));
    const h1 = document.querySelector('.shell-titulo');
    if (h1) h1.textContent = grupo ? grupo.nome : 'Início';
    renderUsuario(sessao);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
