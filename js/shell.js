// ============================================================
// Shell do sistema da escola: barra lateral, cabeçalho, sessão de
// demonstração e controle de acesso.
//
// Perfis e permissões VALEM de verdade aqui: o menu só mostra o que o
// usuário logado pode ver (Permissoes.pode) e o que o plano da escola
// inclui (Planos), cada página declara a tela que exige em
// <body data-acesso="feature[,feature]"> e as telas perguntam
// Shell.pode(feature, ação) antes de mostrar botões.
//
// Não depende de base.js (as páginas de perfis usam o app de permissões,
// que tem helpers próprios). Carregar no fim do <body>, depois de
// permissoes-*.js, planos.js, aulor.js e semente.js.
// ============================================================

// Usuários e perfis salvos (mesma chave lida por js/permissoes-app.js).
const Acessos = (() => {
  const CHAVE = 'aulor-mvp-acessos-v2'; // v2: permissão "Trocar de turma"
  localStorage.removeItem('aulor-mvp-acessos-v1');
  function carregar() {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return;
    try {
      const s = JSON.parse(bruto);
      if (Array.isArray(s.perfis)) PERFIS.splice(0, PERFIS.length, ...s.perfis);
      if (Array.isArray(s.usuarios)) USUARIOS.splice(0, USUARIOS.length, ...s.usuarios);
    } catch (_) { localStorage.removeItem(CHAVE); }
  }
  const salvar = () => localStorage.setItem(CHAVE, JSON.stringify({ perfis: PERFIS, usuarios: USUARIOS }));
  const restaurar = () => localStorage.removeItem(CHAVE);
  carregar();
  return { CHAVE, carregar, salvar, restaurar };
})();

const Shell = (() => {
  const CHAVE_SESSAO = 'aulor-mvp-sessao';
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const svg = (d, cls = 'h-5 w-5') => `<svg class="${cls} shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="${d}"/></svg>`;

  const ICONES = {
    inicio: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75',
    alunos: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
    cursos: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.55 50.55 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
    matriculas: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    financeiro: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    aulas: 'M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75',
    certificados: 'M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z',
    acessos: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    configuracoes: 'M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
    turmas: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
    risco: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    alertas: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    professores: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.55 50.55 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
    usuarios: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
    template: 'M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
    seta: 'M19.5 8.25l-7.5 7.5-7.5-7.5',
    menu: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
    lua: 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z',
    sol: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
    fechar: 'M6 18L18 6M6 6l12 12',
  };

  // feature (permissão) → módulo do plano comercial.
  const MODULO_DA_FEATURE = {
    painel: 'painel', alunos: 'cadastros', cursos: 'cadastros', turmas: 'cadastros', professores: 'cadastros',
    matriculas: 'matriculas', receber: 'receber', pagar: 'pagar', frequencia: 'frequencia', 'minhas-aulas': 'frequencia',
    certificados: 'certificados', usuarios: 'acessos', 'perfis-acesso': 'acessos', configuracoes: 'painel',
  };

  // Mesma divisão por módulos do protótipo original (grupos = MODULOS de
  // permissoes-data.js). Cada perfil vê só os itens que pode abrir; grupos
  // sem itens visíveis somem.
  const GRUPOS = [
    { id: 'comercial', nome: 'Comercial' },
    { id: 'pedagogico', nome: 'Pedagógico' },
    { id: 'financeiro', nome: 'Financeiro' },
    { id: 'pessoas', nome: 'Pessoas' },
    { id: 'configuracoes', nome: 'Configurações' },
  ];
  const MENU = [
    { href: 'inicio.html', nome: 'Visão geral', icone: 'inicio', features: ['painel'] },
    { grupo: 'comercial', href: 'alunos.html', nome: 'Alunos', icone: 'alunos', features: ['alunos'] },
    { grupo: 'comercial', href: 'matriculas.html', nome: 'Vendas', icone: 'matriculas', features: ['matriculas'] },
    { grupo: 'comercial', href: 'turmas-risco.html', nome: 'Turmas em risco', icone: 'risco', features: ['turmas'] },
    { grupo: 'pedagogico', href: 'cursos.html', nome: 'Cursos', icone: 'cursos', features: ['cursos'] },
    { grupo: 'pedagogico', href: 'turmas.html', nome: 'Turmas', icone: 'turmas', features: ['turmas'] },
    { grupo: 'pedagogico', href: 'aulas.html', nome: 'Aulas e chamadas', nomeProfessor: 'Minhas aulas', icone: 'aulas', features: ['frequencia', 'minhas-aulas'] },
    { grupo: 'pedagogico', href: 'alertas-frequencia.html', nome: 'Alertas de frequência', icone: 'alertas', features: ['frequencia'] },
    { grupo: 'pedagogico', href: 'certificados.html', nome: 'Certificados', icone: 'certificados', features: ['certificados'] },
    { grupo: 'pedagogico', href: 'templates-certificado.html', nome: 'Modelos de certificado', icone: 'template', features: ['configuracoes'] },
    { grupo: 'financeiro', href: 'financeiro.html', nome: 'Financeiro', icone: 'financeiro', features: ['receber', 'pagar'] },
    { grupo: 'pessoas', href: 'professores.html', nome: 'Professores', icone: 'professores', features: ['professores'] },
    { grupo: 'pessoas', href: 'usuarios.html', nome: 'Usuários', icone: 'usuarios', features: ['usuarios'] },
    { grupo: 'configuracoes', href: 'perfis.html', nome: 'Perfis de acesso', icone: 'acessos', features: ['perfis-acesso'] },
    { grupo: 'configuracoes', href: 'configuracoes.html', nome: 'Escola e regras', icone: 'configuracoes', features: ['configuracoes'] },
  ];
  const ALIAS = {
    'aluno.html': 'alunos.html', 'curso.html': 'cursos.html', 'turma.html': 'turmas.html',
    'matricula.html': 'matriculas.html', 'matricula-nova.html': 'matriculas.html', 'chamada.html': 'aulas.html',
    'certificado.html': 'certificados.html', 'modelo-certificado.html': 'templates-certificado.html', 'perfil.html': 'perfis.html',
    'cobrancas.html': 'financeiro.html', // Cobranças virou a aba "Em atraso" do Financeiro
  };

  // ---------- Sessão (demonstração: escolher o usuário, sem senha) ----------

  const usuarioId = () => localStorage.getItem(CHAVE_SESSAO);
  function usuario() {
    const u = USUARIOS.find((x) => x.id === usuarioId());
    return u && u.status === 'ativo' ? u : null;
  }
  function entrar(id) { localStorage.setItem(CHAVE_SESSAO, id); }
  function sair() { localStorage.removeItem(CHAVE_SESSAO); }

  const temPlano = (feature) => !MODULO_DA_FEATURE[feature] || Aulor.temModulo(MODULO_DA_FEATURE[feature]);
  function podeUsuario(u, feature, acao = 'visualizar') {
    return !!u && temPlano(feature) && Permissoes.pode(u, feature, acao);
  }
  const pode = (feature, acao = 'visualizar') => podeUsuario(usuario(), feature, acao);
  const podeAlguma = (features, u = usuario()) => features.some((f) => podeUsuario(u, f));
  const professorIds = (u = usuario()) => (u?.vinculos ?? []).filter((v) => v.tipo === 'instrutor').map((v) => v.id);
  const nome = () => usuario()?.nome ?? '';
  const ehSoProfessor = (u = usuario()) => !!u && !podeUsuario(u, 'frequencia') && podeUsuario(u, 'minhas-aulas');
  const perfisTexto = (u) => (u?.perfis ?? []).map((id) => PERFIS.find((p) => p.id === id)?.nome).filter(Boolean).join(' + ') || 'Sem perfil';
  const itensVisiveis = (u = usuario()) => MENU.filter((i) => i.href && podeAlguma(i.features, u));
  const primeiraPagina = (u = usuario()) => itensVisiveis(u)[0]?.href ?? 'entrar.html';

  // Pode lançar/corrigir a chamada desta turma? (todas as turmas ou só as próprias, no caso do professor)
  function podeChamada(turma) {
    if (pode('frequencia', 'registrar')) return true;
    return pode('minhas-aulas', 'registrar') && professorIds().includes(turma.professorId);
  }
  function podeVerTurma(turma) {
    if (pode('turmas') || pode('frequencia')) return true;
    return pode('minhas-aulas') && professorIds().includes(turma.professorId);
  }

  // ---------- Layout ----------

  const paginaAtual = () => location.pathname.split('/').pop() || 'index.html';

  const CHAVE_MENUS = 'aulor-mvp-menus';
  const gruposFechados = () => { try { return JSON.parse(localStorage.getItem(CHAVE_MENUS) || '{}'); } catch (_) { return {}; } };

  function navHtml(u) {
    const atual = ALIAS[paginaAtual()] ?? paginaAtual();
    const fechados = gruposFechados();
    const link = (i) => {
      const ativo = i.href === atual;
      const rotulo = i.nomeProfessor && ehSoProfessor(u) ? i.nomeProfessor : i.nome;
      return `<a href="${i.href}" class="nav-item${ativo ? ' nav-item-ativo' : ''}"${ativo ? ' aria-current="page"' : ''}>${svg(ICONES[i.icone], '')}<span>${esc(rotulo)}</span></a>`;
    };
    const visiveis = MENU.filter((i) => podeAlguma(i.features, u));
    // Estilo do item e do grupo vem do .shell de styles.css (igual ao original); a seta gira pelo aria-expanded.
    const busca = `
        <label class="shell-busca">
          <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input data-busca-menu type="search" placeholder="Buscar no menu" aria-label="Buscar no menu" autocomplete="off" />
        </label>`;
    return busca + visiveis.filter((i) => !i.grupo).map(link).join('') + GRUPOS.map((g) => {
      const itens = visiveis.filter((i) => i.grupo === g.id);
      if (!itens.length) return '';
      const aberto = itens.some((i) => i.href === atual) || !fechados[g.id];
      return `
        <div class="menu-grupo" data-grupo="${g.id}">
          <button type="button" data-toggle-grupo aria-expanded="${aberto}" aria-controls="grupo-${g.id}" class="menu-grupo-botao">
            <span>${esc(g.nome)}</span><svg data-seta aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="${ICONES.seta}"/></svg>
          </button>
          <div id="grupo-${g.id}" ${aberto ? '' : 'hidden'}>${itens.map(link).join('')}</div>
        </div>`;
    }).join('');
  }

  // Nome do item do menu da página atual (a ficha herda o da lista): é o contexto da barra do topo.
  function contextoAtual(u) {
    const atual = ALIAS[paginaAtual()] ?? paginaAtual();
    const item = MENU.find((i) => i.href === atual);
    if (!item) return document.body.dataset.titulo || document.title.replace(/^Aulor · /, '');
    if (ehSoProfessor(u) && !podeAlguma(item.features, u)) return 'Minhas aulas'; // turma e chamada do professor
    return item.nomeProfessor && ehSoProfessor(u) ? item.nomeProfessor : item.nome;
  }

  function ligarGrupos() {
    document.querySelectorAll('[data-sidebar] [data-grupo]').forEach((grupo) => {
      const btn = grupo.querySelector('[data-toggle-grupo]');
      btn.addEventListener('click', () => {
        const aberto = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(aberto));
        grupo.querySelector('[id^="grupo-"]').hidden = !aberto;
        const estado = gruposFechados();
        estado[grupo.dataset.grupo] = !aberto;
        localStorage.setItem(CHAVE_MENUS, JSON.stringify(estado));
      });
    });
    // "Buscar no menu" (menu.js do original): esconde itens e grupos sem o termo; Esc limpa.
    const nav = document.querySelector('[data-sidebar] .shell-nav');
    const busca = nav?.querySelector('[data-busca-menu]');
    if (!busca) return;
    const normalizar = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); // base.js carrega depois do shell
    const filtrar = () => {
      const termo = normalizar(busca.value.trim());
      const mostra = (a) => !termo || normalizar(a.textContent).includes(termo);
      // style.display inline: a classe .hidden perde para o display:flex de .nav-item
      nav.querySelectorAll(':scope > .nav-item').forEach((a) => { a.style.display = mostra(a) ? '' : 'none'; });
      nav.querySelectorAll('.menu-grupo').forEach((grupo) => {
        const itens = [...grupo.querySelectorAll('.nav-item')];
        itens.forEach((a) => { a.style.display = mostra(a) ? '' : 'none'; });
        grupo.hidden = !!termo && !itens.some(mostra);
        const aberto = termo ? true : !!grupo.querySelector('.nav-item-ativo') || !gruposFechados()[grupo.dataset.grupo];
        grupo.querySelector('[data-toggle-grupo]').setAttribute('aria-expanded', String(aberto));
        grupo.querySelector('[id^="grupo-"]').hidden = !aberto;
      });
    };
    busca.addEventListener('input', filtrar);
    busca.addEventListener('keydown', (e) => { if (e.key === 'Escape') { busca.value = ''; filtrar(); busca.blur(); } });
  }

  function montar() {
    const u = usuario();
    const plano = Planos.efetivo(Aulor.assinatura());
    const iniciais = (u?.nome ?? '').split(/\s+/).filter(Boolean).map((p, i, a) => (i === 0 || i === a.length - 1 ? p[0] : '')).join('').toUpperCase();
    document.body.classList.add('h-full', 'bg-fundo', 'dark:bg-black', 'font-sans', 'text-slate-800', 'dark:text-neutral-100', 'antialiased');
    // Shell igual ao do original (classes .shell-* em styles.css): azul profundo nos dois modos.
    // A barra do topo diz onde você está; o título da tela fica no conteúdo.
    document.body.insertAdjacentHTML('afterbegin', `
      <a href="#tela" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-white focus:text-petrol-800 focus:px-3 focus:py-2 focus:rounded-lg">Pular para o conteúdo</a>
      <div class="flex h-screen overflow-hidden">
        <div data-fundo-menu class="hidden fixed inset-0 z-30 bg-slate-900/50 md:hidden"></div>
        <aside data-sidebar class="shell shell-lateral">
          <div class="shell-marca">
            <img src="img/aulor-simbolo.svg" alt="" class="shell-simbolo">
            <div class="min-w-0">
              <img src="img/aulor-wordmark-claro.svg" alt="Aulor" class="shell-wordmark">
              <p class="shell-sub truncate" title="${esc(Aulor.escola().nome)}">${esc(Aulor.escola().nome)}</p>
            </div>
          </div>
          <nav class="shell-nav" aria-label="Menu principal">${navHtml(u)}</nav>
          <div class="shell-rodape">
            <button type="button" data-abrir-demo class="shell-demo">
              <span class="min-w-0">
                <span class="shell-demo-titulo">Demonstração</span>
                <span class="block truncate">Plano ${esc(plano.nome)} · dados fictícios</span>
              </span>
              ${svg('M8.25 4.5l7.5 7.5-7.5 7.5', 'h-4 w-4')}
            </button>
          </div>
        </aside>

        <div class="flex-1 flex flex-col overflow-hidden min-w-0">
          <header class="shell shell-topo">
            <div class="shell-contexto">
              <button type="button" data-menu title="Ocultar menu" aria-label="Mostrar ou ocultar o menu" class="shell-icone">${svg(ICONES.menu, '')}</button>
              <h1 class="shell-titulo">${esc(contextoAtual(u))}</h1>
            </div>
            <div class="shell-acoes">
              <button type="button" data-toggle-tema title="Tema escuro" class="shell-icone">
                <svg class="shell-tema-lua" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="${ICONES.lua}"/></svg>
                <svg class="shell-tema-sol" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="${ICONES.sol}"/></svg>
              </button>
              <button type="button" data-abrir-demo title="Trocar de usuário ou restaurar a demonstração" class="shell-usuario text-left">
                <span class="shell-avatar" aria-hidden="true">${esc(iniciais)}</span>
                <span class="hidden sm:block">
                  <span class="shell-usuario-nome">${esc(u?.nome ?? '')}</span>
                  <span class="shell-usuario-papel">${esc(perfisTexto(u))}</span>
                </span>
              </button>
            </div>
          </header>
          <main id="tela" class="flex-1 overflow-y-auto p-4 md:p-6" tabindex="-1"></main>
        </div>
      </div>
      <div id="modal-root"></div>
      <div id="demo-root"></div>
      <div id="toast-root" class="fixed bottom-5 right-5 left-5 sm:left-auto z-50 space-y-2 flex flex-col items-end" aria-live="polite"></div>`);

    const fundo = document.querySelector('[data-fundo-menu]');
    // Celular: o menu abre por cima do conteúdo (classe no <html>, CSS em styles.css).
    const fecharMenuCelular = () => { document.documentElement.classList.remove('menu-aberto'); fundo.classList.add('hidden'); };
    document.querySelector('[data-menu]').addEventListener('click', () => {
      if (window.matchMedia('(min-width: 768px)').matches) { window.Sidebar?.alternar(); return; }
      if (document.documentElement.classList.contains('menu-aberto')) fecharMenuCelular();
      else { document.documentElement.classList.add('menu-aberto'); fundo.classList.remove('hidden'); }
    });
    fundo.addEventListener('click', fecharMenuCelular);
    ligarGrupos();
    document.querySelectorAll('[data-abrir-demo]').forEach((b) => b.addEventListener('click', abrirPainelDemo));
  }

  // ---------- Painel de demonstração ----------

  const ROTEIRO = [
    ['Visão geral: o que precisa de atenção hoje', 'inicio.html'],
    ['Turmas: horários, vagas e situação', 'turmas.html'],
    ['Turmas em risco de não fechar', 'turmas-risco.html'],
    ['Nova venda com parcelamento', 'matricula-nova.html?turma=tu6'],
    ['Parcelas em Contas a receber', 'financeiro.html'],
    ['Em atraso: quem deve e o lembrete pronto', 'financeiro.html?aba=atraso'],
    ['Chamada do professor (abra no celular)', 'aulas.html'],
    ['Concluir a turma que terminou, com a nota final', 'turma.html?id=tu2'],
    ['Emitir e validar o certificado', 'certificados.html'],
  ];

  function abrirPainelDemo() {
    const u = usuario();
    const root = document.getElementById('demo-root');
    const plano = Aulor.assinatura().planoId;
    const ativos = USUARIOS.filter((x) => x.status === 'ativo');
    root.innerHTML = `
      <div class="fixed inset-0 z-50 flex justify-end">
        <div data-fechar-demo class="absolute inset-0 bg-[color:var(--f-veu)]"></div>
        <aside role="dialog" aria-modal="true" aria-label="Demonstração" class="drawer-anim relative w-full max-w-md h-full overflow-y-auto bg-white dark:bg-neutral-950 border-l border-slate-200 dark:border-neutral-800 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.4)]">
          <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-medium text-slate-500 dark:text-neutral-400">Ambiente de demonstração</p>
              <h2 class="text-[15px] font-semibold text-slate-900 dark:text-neutral-100">${esc(Aulor.escola().nome)}</h2>
              <p class="text-xs text-slate-500 dark:text-neutral-400 mt-1">Escola e pessoas fictícias. As alterações ficam salvas só neste navegador — não há servidor, autenticação real nem isolamento entre escolas nesta versão.</p>
            </div>
            <button type="button" data-fechar-demo class="btn-fantasma -mr-1.5 -mt-1 px-1.5" aria-label="Fechar">${svg(ICONES.fechar)}</button>
          </div>

          <section class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
            <h3 class="text-[15px] font-semibold text-slate-900 dark:text-neutral-100 mb-2">Entrar como</h3>
            <div class="space-y-1">
              ${ativos.map((x) => `
                <button type="button" data-entrar="${x.id}" class="w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition ${x.id === u?.id ? 'bg-petrol-800/10 dark:bg-sky-950/60' : 'hover:bg-slate-100 dark:hover:bg-neutral-900'}">
                  <span class="min-w-0 flex-1">
                    <span class="block text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(x.nome)} ${x.id === u?.id ? '<span class="text-xs font-normal text-slate-500 dark:text-neutral-400">· você</span>' : ''}</span>
                    <span class="block text-xs text-slate-500 dark:text-neutral-400">${esc(x.cargo)} · perfil ${esc(perfisTexto(x))}</span>
                  </span>
                </button>`).join('')}
            </div>
          </section>

          <section class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
            <h3 class="text-[15px] font-semibold text-slate-900 dark:text-neutral-100 mb-2">Roteiro de 10 minutos</h3>
            <ol class="space-y-1 text-sm list-decimal list-inside marker:text-slate-400">
              ${ROTEIRO.map(([t, href]) => `<li><a class="link" href="${href}">${esc(t)}</a></li>`).join('')}
            </ol>
          </section>

          <section class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
            <h3 class="text-[15px] font-semibold text-slate-900 dark:text-neutral-100 mb-1">Plano da escola</h3>
            <p class="text-xs text-slate-500 dark:text-neutral-400 mb-2">Troca o plano para mostrar o que cada um libera (hipótese comercial em validação).</p>
            <div class="grid grid-cols-3 gap-2">
              ${Planos.PLANOS.map((p) => `<button type="button" data-plano="${p.id}" aria-pressed="${p.id === plano}" class="h-9 rounded-lg border px-2 text-sm font-medium transition ${p.id === plano ? 'border-petrol-800 bg-petrol-800 text-white dark:border-areia dark:bg-areia dark:text-petrol-800' : 'border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 hover:text-petrol-800 dark:hover:border-sky-400 dark:hover:text-sky-300'}">${esc(p.nome)}</button>`).join('')}
            </div>
          </section>

          <section class="px-5 py-4">
            <h3 class="text-[15px] font-semibold text-slate-900 dark:text-neutral-100 mb-1">Restaurar demonstração</h3>
            <p class="text-xs text-slate-500 dark:text-neutral-400 mb-2">Apaga as alterações e gera a escola de novo com datas a partir de hoje.</p>
            <button type="button" data-restaurar class="btn-sec text-red-700 dark:text-red-400 hover:border-red-600 hover:text-red-700 dark:hover:border-red-500 dark:hover:text-red-400">Restaurar dados iniciais</button>
            <a href="validar.html" class="link block mt-4 text-sm">Abrir a página pública de validação de certificados</a>
          </section>
        </aside>
      </div>`;
    const fechar = () => { root.innerHTML = ''; document.removeEventListener('keydown', aoTeclar); };
    const aoTeclar = (e) => { if (e.key === 'Escape') fechar(); };
    document.addEventListener('keydown', aoTeclar);
    root.querySelectorAll('[data-fechar-demo]').forEach((b) => b.addEventListener('click', fechar));
    root.querySelectorAll('[data-entrar]').forEach((b) => b.addEventListener('click', () => {
      entrar(b.dataset.entrar);
      const destino = paginaAtual();
      const novo = usuario();
      const item = MENU.find((i) => i.href === (ALIAS[destino] ?? destino));
      location.href = item && podeAlguma(item.features, novo) ? location.href : primeiraPagina(novo);
    }));
    root.querySelectorAll('[data-plano]').forEach((b) => b.addEventListener('click', () => { Aulor.definirPlano(b.dataset.plano); location.reload(); }));
    root.querySelector('[data-restaurar]').addEventListener('click', (e) => {
      const b = e.currentTarget;
      if (b.dataset.confirmar !== '1') { b.dataset.confirmar = '1'; b.textContent = 'Clique de novo para confirmar'; return; }
      Aulor.restaurar();
      Acessos.restaurar();
      location.reload();
    });
  }

  function semAcesso() {
    document.getElementById('tela').innerHTML = `
      <div class="max-w-md mx-auto mt-16 text-center">
        <p class="text-sm font-medium text-slate-500 dark:text-neutral-400">Sem acesso</p>
        <h2 class="text-xl font-semibold text-slate-900 dark:text-neutral-100 mt-1">Seu perfil não libera esta tela</h2>
        <p class="text-sm text-slate-500 dark:text-neutral-400 mt-2">${esc(nome())} entra com o perfil ${esc(perfisTexto(usuario()))}. Peça ao administrador da escola para ajustar em Pessoas › Usuários.</p>
        <a href="${primeiraPagina()}" class="btn-pri mt-5">Ir para o início</a>
      </div>`;
  }

  // ---------- Inicialização ----------

  let permitido = false;
  (function iniciar() {
    if (document.body.hasAttribute('data-sem-layout')) return; // entrar.html, index.html, validar.html
    if (!usuario()) {
      location.replace(`entrar.html?volta=${encodeURIComponent(paginaAtual() + location.search)}`);
      return;
    }
    montar();
    const exige = (document.body.dataset.acesso ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    permitido = !exige.length || podeAlguma(exige);
    if (!permitido) semAcesso();
  })();

  return {
    get permitido() { return permitido; },
    usuario, nome, pode, podeAlguma, podeChamada, podeVerTurma, professorIds, ehSoProfessor, perfisTexto,
    itensVisiveis, primeiraPagina, entrar, sair, podeUsuario, MENU,
  };
})();
