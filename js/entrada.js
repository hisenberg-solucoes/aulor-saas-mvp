// ============================================================
// Quem entra e em qual portal, a partir dos cadastros: colaborador com usuário
// de acesso (perfis em js/permissoes-data.js), a conta que nasceu no aceite de
// um convite (AULOR-007), instrutor e aluno, pelo e-mail. Usado pela entrada
// (entrar.html) e pelo convidado (convite.html). Só demonstra: na V1 real,
// autenticação e permissões são do back-end.
// ============================================================

const Entrada = (() => {
  const SENHA_PROTOTIPO = '123456';
  const CODIGO_DEMO = '246810';
  const CHAVE_SENHAS = 'aulor-v1-senhas';
  const CHAVE_PERMISSOES = 'aulor-v1-permissionamento-v6'; // a mesma de js/permissoes-app.js
  const norm = (s) => String(s ?? '').trim().toLowerCase();

  function senhas() {
    try { return JSON.parse(localStorage.getItem(CHAVE_SENHAS)) || {}; } catch (_) { return {}; }
  }
  const senhaConfere = (email, senha) => (senhas()[norm(email)] ?? SENHA_PROTOTIPO) === senha;
  const gravarSenha = (email, senha) => localStorage.setItem(CHAVE_SENHAS, JSON.stringify({ ...senhas(), [norm(email)]: senha }));

  function permissoes() {
    try {
      const s = JSON.parse(localStorage.getItem(CHAVE_PERMISSOES));
      if (Array.isArray(s?.perfis) && Array.isArray(s?.usuarios)) return s;
    } catch (_) { /* semente */ }
    return { perfis: PERFIS, usuarios: USUARIOS };
  }

  // Permissões efetivas no portal administrativo ({ telaId: [ações] }): união dos perfis ativos e das
  // extras do usuário, só nas telas em que ele pode "visualizar".
  function acessoDe(usuarioId, s = permissoes()) {
    const u = s.usuarios.find((x) => x.id === usuarioId);
    if (!u) return { acesso: {}, perfis: [] };
    const perfis = u.perfis.map((id) => s.perfis.find((p) => p.id === id)).filter((p) => p?.ativo);
    const adm = new Set(FEATURES.filter((f) => MODULOS.find((m) => m.id === f.modulo)?.portal === 'administrativo').map((f) => f.id));
    const acesso = {};
    for (const fonte of [...perfis.map((p) => p.permissoes), u.extras ?? {}]) {
      for (const [tela, acoes] of Object.entries(fonte)) if (adm.has(tela)) acesso[tela] = [...new Set([...(acesso[tela] ?? []), ...acoes])];
    }
    return { acesso: Object.fromEntries(Object.entries(acesso).filter(([, a]) => a.includes('visualizar'))), perfis };
  }

  // Os acessos de quem tem este e-mail: [{ portal: 'equipe' | 'professor' | 'aluno', nome, ... }].
  function contas(email) {
    const e = norm(email);
    if (!e) return [];
    const r = [];
    const col = Colaboradores.carregar().find((c) => norm(c.contato?.email) === e && c.status !== 'desligado' && c.acesso?.usuarioId);
    // A conta do convite entra pelo e-mail do convite, que pode não ser o corporativo nem o de contato.
    const conta = permissoes().usuarios.find((u) => norm(u.email) === e);
    const usuarioId = col?.acesso.usuarioId ?? conta?.id;
    if (usuarioId) {
      const { acesso, perfis } = acessoDe(usuarioId);
      if (Object.keys(acesso).length) r.push({ portal: 'equipe', nome: col?.nome ?? conta.nome, usuarioId, acesso, perfis });
    }
    const ins = Instrutores.carregar().find((i) => (norm(i.contato?.email) === e || (conta && Instrutores.usuarioDe(i) === conta.id)) && i.status !== 'inativo');
    if (ins) r.push({ portal: 'professor', nome: ins.nome, instrutorId: ins.id });
    const alu = Clientes.carregar().alunos.find((a) => norm(a.email) === e && a.status !== 'inativo');
    if (alu) r.push({ portal: 'aluno', nome: alu.nomeSocial || alu.nome, alunoId: alu.id });
    return r;
  }

  // Grava a sessão do portal e devolve para onde ir.
  function entrar(conta, email) {
    const em = new Date().toISOString();
    if (conta.portal === 'professor') {
      localStorage.setItem('aulor-v1-portal-professor-sessao', JSON.stringify({ instrutorId: conta.instrutorId, em }));
      return 'portal-professor/turmas.html';
    }
    if (conta.portal === 'aluno') {
      localStorage.setItem('aulor-v1-portal-aluno-sessao', JSON.stringify({ alunoId: conta.alunoId, em }));
      return 'portal-aluno/home.html';
    }
    // Vendedor externo: sem "ver todas", a pessoa vê só as vendas em que é a vendedora.
    const externo = conta.perfis.some((p) => p.id === 'vendedor_externo') && !conta.acesso.contratos?.includes('ver-todas');
    Sessao.entrar({
      usuarioId: conta.usuarioId, nome: conta.nome, email: norm(email),
      perfil: externo ? 'vendedor_externo' : conta.perfis[0]?.id ?? null,
      perfilNome: conta.perfis.map((p) => p.nome).join(', '),
      vendedorId: conta.usuarioId, acesso: conta.acesso, em,
    });
    return 'home.html';
  }

  return { SENHA_PROTOTIPO, CODIGO_DEMO, norm, senhaConfere, gravarSenha, acessoDe, contas, entrar };
})();
