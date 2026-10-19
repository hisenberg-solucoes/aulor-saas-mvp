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
  const CHAVE = 'aulor-mvp-acessos-v2'; // v2: colaboradores e instrutores (Pessoas)
  function carregar() {
    localStorage.removeItem('aulor-mvp-acessos-v1'); // formato anterior
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
    inicio: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
    alunos: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
    cursos: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.55 50.55 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
    matriculas: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    financeiro: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z',
    aulas: 'M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75',
    certificados: 'M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z',
    acessos: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    configuracoes: 'M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
    turmas: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
    risco: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    alertas: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
    cobrancas: 'M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
    instrutores: 'M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z',
    colaboradores: 'M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z',
    usuarios: 'M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z',
    template: 'M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z',
    seta: 'M19.5 8.25l-7.5 7.5-7.5-7.5',
    menu: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
    lua: 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z',
    sol: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
    fechar: 'M6 18L18 6M6 6l12 12',
  };

  // feature (permissão) → módulo do plano comercial.
  const MODULO_DA_FEATURE = {
    painel: 'painel', alunos: 'cadastros', cursos: 'cadastros', turmas: 'cadastros', colaboradores: 'cadastros', instrutores: 'cadastros',
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
    { grupo: 'comercial', href: 'matriculas.html', nome: 'Matrículas', icone: 'matriculas', features: ['matriculas'] },
    { grupo: 'comercial', href: 'turmas-risco.html', nome: 'Turmas em risco', icone: 'risco', features: ['turmas'] },
    { grupo: 'pedagogico', href: 'cursos.html', nome: 'Cursos', icone: 'cursos', features: ['cursos'] },
    { grupo: 'pedagogico', href: 'turmas.html', nome: 'Turmas', icone: 'turmas', features: ['turmas'] },
    { grupo: 'pedagogico', href: 'aulas.html', nome: 'Aulas e chamadas', nomeProfessor: 'Minhas aulas', icone: 'aulas', features: ['frequencia', 'minhas-aulas'] },
    { grupo: 'pedagogico', href: 'alertas-frequencia.html', nome: 'Alertas de frequência', icone: 'alertas', features: ['frequencia'] },
    { grupo: 'pedagogico', href: 'certificados.html', nome: 'Certificados', icone: 'certificados', features: ['certificados'] },
    { grupo: 'pedagogico', href: 'templates-certificado.html', nome: 'Modelos de certificado', icone: 'template', features: ['configuracoes'] },
    { grupo: 'financeiro', href: 'financeiro.html', nome: 'Financeiro', icone: 'financeiro', features: ['receber', 'pagar'] },
    { grupo: 'financeiro', href: 'cobrancas.html', nome: 'Cobranças', icone: 'cobrancas', features: ['receber'] },
    { grupo: 'pessoas', href: 'colaboradores.html', nome: 'Colaboradores', icone: 'colaboradores', features: ['colaboradores'] },
    { grupo: 'pessoas', href: 'instrutores.html', nome: 'Instrutores', icone: 'instrutores', features: ['instrutores'] },
    { grupo: 'pessoas', href: 'usuarios.html', nome: 'Usuários', icone: 'usuarios', features: ['usuarios'] },
    { grupo: 'configuracoes', href: 'perfis.html', nome: 'Perfis de acesso', icone: 'acessos', features: ['perfis-acesso'] },
    { grupo: 'configuracoes', href: 'configuracoes.html', nome: 'Escola e regras', icone: 'configuracoes', features: ['configuracoes'] },
  ];
  const ALIAS = {
    'aluno.html': 'alunos.html', 'curso.html': 'cursos.html', 'turma.html': 'turmas.html',
    'matricula.html': 'matriculas.html', 'matricula-nova.html': 'matriculas.html', 'chamada.html': 'aulas.html',
    'certificado.html': 'certificados.html', 'modelo-certificado.html': 'templates-certificado.html', 'perfil.html': 'perfis.html',
    'colaborador.html': 'colaboradores.html', 'instrutor.html': 'instrutores.html',
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
      return `<a href="${i.href}" class="nav-item ${ativo ? 'nav-item-ativo' : ''}" ${ativo ? 'aria-current="page"' : ''}>${svg(ICONES[i.icone])}<span class="truncate">${esc(rotulo)}</span></a>`;
    };
    const visiveis = MENU.filter((i) => podeAlguma(i.features, u));
    return visiveis.filter((i) => !i.grupo).map(link).join('') + GRUPOS.map((g) => {
      const itens = visiveis.filter((i) => i.grupo === g.id);
      if (!itens.length) return '';
      const aberto = itens.some((i) => i.href === atual) || !fechados[g.id];
      return `
        <div data-grupo="${g.id}">
          <button type="button" data-toggle-grupo aria-expanded="${aberto}" aria-controls="grupo-${g.id}"
            class="w-full flex items-center justify-between px-3 mt-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-200 hover:bg-white/5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30">
            <span>${esc(g.nome)}</span>${svg(ICONES.seta, `h-3.5 w-3.5 transition-transform ${aberto ? '' : '-rotate-90'}`)}
          </button>
          <div id="grupo-${g.id}" class="space-y-1 mt-0.5 ${aberto ? '' : 'hidden'}">${itens.map(link).join('')}</div>
        </div>`;
    }).join('');
  }

  function ligarGrupos() {
    document.querySelectorAll('[data-sidebar] [data-grupo]').forEach((grupo) => {
      const btn = grupo.querySelector('[data-toggle-grupo]');
      btn.addEventListener('click', () => {
        const aberto = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(aberto));
        grupo.querySelector('[id^="grupo-"]').classList.toggle('hidden', !aberto);
        btn.querySelector('svg').classList.toggle('-rotate-90', !aberto);
        const estado = gruposFechados();
        estado[grupo.dataset.grupo] = !aberto;
        localStorage.setItem(CHAVE_MENUS, JSON.stringify(estado));
      });
    });
  }

  function montar() {
    const u = usuario();
    const titulo = document.body.dataset.titulo || document.title.replace(/^Aulor · /, '');
    const plano = Planos.efetivo(Aulor.assinatura());
    const iniciais = (u?.nome ?? '').split(/\s+/).filter(Boolean).map((p, i, a) => (i === 0 || i === a.length - 1 ? p[0] : '')).join('').toUpperCase();
    document.body.classList.add('h-full', 'bg-areia', 'dark:bg-black', 'font-sans', 'text-slate-800', 'dark:text-neutral-100', 'antialiased');
    document.body.insertAdjacentHTML('afterbegin', `
      <a href="#tela" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-white focus:text-petrol-800 focus:px-3 focus:py-2 focus:rounded-lg">Pular para o conteúdo</a>
      <div class="flex h-screen overflow-hidden">
        <div data-fundo-menu class="hidden fixed inset-0 z-30 bg-slate-900/50 md:hidden"></div>
        <aside data-sidebar class="hidden md:flex w-60 shrink-0 bg-petrol-950 dark:bg-petrol-900 text-slate-300 flex-col dark:border-r dark:border-white/10">
          <div class="h-14 flex items-center gap-3 px-5 border-b border-white/10">
            <img src="img/aulor-simbolo.svg" alt="" class="h-9 w-9 shrink-0">
            <div class="leading-tight min-w-0">
              <img src="img/aulor-wordmark-claro.svg" alt="Aulor" class="h-4 w-auto">
              <p class="text-[11px] text-slate-400 mt-1 truncate" title="${esc(Aulor.escola().nome)}">${esc(Aulor.escola().nome)}</p>
            </div>
          </div>
          <nav class="flex-1 py-4 px-3 space-y-1 text-sm overflow-y-auto" aria-label="Menu principal">${navHtml(u)}</nav>
          <div class="px-3 py-3 border-t border-white/10">
            <button type="button" data-abrir-demo class="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left hover:bg-white/5 transition">
              <span class="min-w-0">
                <span class="block text-[11px] font-semibold uppercase tracking-wider text-laranja">Demonstração</span>
                <span class="block text-xs text-slate-400 truncate">Plano ${esc(plano.nome)} · dados fictícios</span>
              </span>
              ${svg('M8.25 4.5l7.5 7.5-7.5 7.5', 'h-4 w-4 text-slate-500')}
            </button>
          </div>
        </aside>

        <div class="flex-1 flex flex-col overflow-hidden min-w-0">
          <header class="h-14 shrink-0 bg-petrol-950 dark:bg-petrol-900 border-b border-white/10 px-3 md:px-6 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 min-w-0">
              <button type="button" data-menu title="Menu" aria-label="Mostrar ou ocultar o menu"
                class="-ml-1 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40">${svg(ICONES.menu)}</button>
              <h1 class="font-display font-semibold text-white truncate">${esc(titulo)}</h1>
            </div>
            <div class="flex items-center gap-1.5 sm:gap-3">
              <button type="button" data-toggle-tema title="Tema escuro"
                class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
                <span class="dark:hidden">${svg(ICONES.lua)}</span><span class="hidden dark:block">${svg(ICONES.sol)}</span>
              </button>
              <button type="button" data-abrir-demo title="Trocar de usuário ou restaurar a demonstração"
                class="flex items-center gap-2.5 pl-2 sm:pl-3 sm:border-l border-white/15 rounded-lg text-left hover:bg-white/5 transition py-1 pr-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
                <span class="h-8 w-8 rounded-full bg-petrol-700 text-white grid place-items-center text-xs font-semibold">${esc(iniciais)}</span>
                <span class="leading-tight hidden sm:block">
                  <span class="block text-sm font-medium text-white">${esc(u?.nome ?? '')}</span>
                  <span class="block text-[11px] text-slate-400">${esc(perfisTexto(u))}</span>
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
    ['Nova matrícula com parcelamento', 'matricula-nova.html?turma=tu6'],
    ['Parcelas em Contas a receber', 'financeiro.html'],
    ['Cobranças: quem está em atraso e o lembrete', 'cobrancas.html'],
    ['Chamada do professor (abra no celular)', 'aulas.html'],
    ['Concluir a turma que terminou', 'turma.html?id=tu2'],
    ['Emitir e validar o certificado', 'certificados.html'],
  ];

  function abrirPainelDemo() {
    const u = usuario();
    const root = document.getElementById('demo-root');
    const plano = Aulor.assinatura().planoId;
    const ativos = USUARIOS.filter((x) => x.status === 'ativo');
    root.innerHTML = `
      <div class="fixed inset-0 z-50 flex justify-end">
        <div data-fechar-demo class="absolute inset-0 bg-slate-900/50 dark:bg-black/70"></div>
        <aside role="dialog" aria-modal="true" aria-label="Demonstração" class="drawer-anim relative w-full max-w-md h-full overflow-y-auto bg-white dark:bg-neutral-950 border-l border-slate-200 dark:border-neutral-800 shadow-xl">
          <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-wider text-laranja-escuro dark:text-laranja">Ambiente de demonstração</p>
              <h2 class="font-display font-semibold text-slate-900 dark:text-neutral-100">${esc(Aulor.escola().nome)}</h2>
              <p class="text-xs text-slate-500 dark:text-neutral-400 mt-1">Escola e pessoas fictícias. As alterações ficam salvas só neste navegador — não há servidor, autenticação real nem isolamento entre escolas nesta versão.</p>
            </div>
            <button type="button" data-fechar-demo class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${svg(ICONES.fechar)}</button>
          </div>

          <section class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">Entrar como</h3>
            <div class="space-y-1">
              ${ativos.map((x) => `
                <button type="button" data-entrar="${x.id}" class="w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition ${x.id === u?.id ? 'bg-petrol-800/5 dark:bg-sky-400/10 ring-1 ring-petrol-800/20 dark:ring-sky-400/30' : 'hover:bg-slate-50 dark:hover:bg-neutral-900'}">
                  <span class="min-w-0 flex-1">
                    <span class="block text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(x.nome)} ${x.id === u?.id ? '<span class="text-xs font-normal text-slate-400">· você</span>' : ''}</span>
                    <span class="block text-xs text-slate-500 dark:text-neutral-400">${esc(x.cargo)} · perfil ${esc(perfisTexto(x))}</span>
                  </span>
                </button>`).join('')}
            </div>
          </section>

          <section class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">Roteiro de 10 minutos</h3>
            <ol class="space-y-1 text-sm list-decimal list-inside marker:text-slate-400">
              ${ROTEIRO.map(([t, href]) => `<li><a class="text-petrol-800 dark:text-sky-300 hover:underline" href="${href}">${esc(t)}</a></li>`).join('')}
            </ol>
          </section>

          <section class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">Plano da escola</h3>
            <p class="text-xs text-slate-500 dark:text-neutral-400 mb-2">Troca o plano para mostrar o que cada um libera (hipótese comercial em validação).</p>
            <div class="grid grid-cols-3 gap-2">
              ${Planos.PLANOS.map((p) => `<button type="button" data-plano="${p.id}" class="rounded-lg border px-2 py-2 text-sm font-medium transition ${p.id === plano ? 'border-petrol-800 bg-petrol-800 text-white dark:border-sky-400 dark:bg-sky-400 dark:text-black' : 'border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 hover:border-slate-400'}">${esc(p.nome)}</button>`).join('')}
            </div>
          </section>

          <section class="px-5 py-4">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">Restaurar demonstração</h3>
            <p class="text-xs text-slate-500 dark:text-neutral-400 mb-2">Apaga as alterações e gera a escola de novo com datas a partir de hoje.</p>
            <button type="button" data-restaurar class="rounded-lg border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/40 transition">Restaurar dados iniciais</button>
            <a href="validar.html" class="block mt-4 text-sm text-petrol-800 dark:text-sky-300 hover:underline">Abrir a página pública de validação de certificados</a>
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
        <p class="text-sm font-semibold text-laranja-escuro dark:text-laranja">Sem acesso</p>
        <h2 class="font-display text-xl font-semibold text-slate-900 dark:text-neutral-100 mt-1">Seu perfil não libera esta tela</h2>
        <p class="text-sm text-slate-500 dark:text-neutral-400 mt-2">${esc(nome())} entra com o perfil ${esc(perfisTexto(usuario()))}. Peça ao administrador da escola para ajustar em Pessoas › Usuários.</p>
        <a href="${primeiraPagina()}" class="inline-block mt-5 rounded-lg bg-laranja-escuro hover:bg-laranja-profundo text-white px-4 py-2 text-sm font-semibold">Ir para o início</a>
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
