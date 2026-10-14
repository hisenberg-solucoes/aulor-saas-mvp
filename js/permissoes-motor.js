// ============================================================
// Motor de permissões — núcleo do protótipo.
// Não conhece a UI: só responde "quem pode o quê" e oferece as
// operações de gestão (perfis, permissões, vínculo de usuários).
//
// Regra de resolução: as permissões efetivas de um usuário são a
// UNIÃO das permissões dos seus perfis ATIVOS. Perfil desativado
// não concede nada (mas mantém a configuração salva). Qualquer perfil
// pode ser dado a qualquer usuário.
//
// Aulor MVP: perfil com `protegido: true` (Administrador) concede tudo,
// inclusive telas novas do catálogo, e não pode ser editado, inativado
// nem excluído — mesma regra do AccessProfile protegido do backend.
// ============================================================

const Permissoes = (() => {
  // ---------- Consultas ----------

  function getPortal(portalId) {
    return PORTAIS.find((p) => p.id === portalId) || null;
  }

  // Ordem alfabética (pt-BR, ignorando acentos/caixa) para módulos e telas.
  // As ações NÃO são ordenadas: a ordem declarada tem significado
  // ("visualizar" primeiro, por ser o acesso à tela).
  function ordenarPorNome(a, b) {
    return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
  }

  function modulosDoPortal(portalId) {
    return MODULOS.filter((m) => m.portal === portalId).sort(ordenarPorNome);
  }

  function featuresDoPortal(portalId) {
    const ids = new Set(modulosDoPortal(portalId).map((m) => m.id));
    return FEATURES.filter((f) => ids.has(f.modulo));
  }

  function getModulo(moduloId) {
    return MODULOS.find((m) => m.id === moduloId) || null;
  }

  function featuresDoModulo(moduloId) {
    return FEATURES.filter((f) => f.modulo === moduloId).sort(ordenarPorNome);
  }

  function getFeature(featureId) {
    return FEATURES.find((f) => f.id === featureId) || null;
  }

  function getPerfil(perfilId) {
    return PERFIS.find((p) => p.id === perfilId) || null;
  }

  function getUsuario(usuarioId) {
    return USUARIOS.find((u) => u.id === usuarioId) || null;
  }

  function perfilConcede(perfil, featureId, acaoId) {
    if (!perfil.ativo) return false;
    if (perfil.protegido) return !!getFeature(featureId)?.acoes.some((a) => a.id === acaoId);
    return (perfil.permissoes[featureId] || []).includes(acaoId);
  }

  // A ação é concedida por algum perfil ATIVO do usuário?
  function concedidaPorPerfis(usuario, featureId, acaoId) {
    return usuario.perfis.some((perfilId) => {
      const perfil = getPerfil(perfilId);
      return perfil && perfilConcede(perfil, featureId, acaoId);
    });
  }

  // A ação é uma permissão extra individual do usuário?
  function concedidaPorExtra(usuario, featureId, acaoId) {
    return (usuario.extras?.[featureId] || []).includes(acaoId);
  }

  // Checagem central: perfis ativos + permissões extras individuais.
  function pode(usuario, featureId, acaoId) {
    return concedidaPorPerfis(usuario, featureId, acaoId) || concedidaPorExtra(usuario, featureId, acaoId);
  }

  // Acesso à tela = ação "visualizar" liberada na feature.
  function podeAcessarTela(usuario, featureId) {
    return pode(usuario, featureId, 'visualizar');
  }

  // Resolve as ações de uma feature para o usuário, com a origem
  // (quais perfis concedem) — útil para auditoria e para a UI.
  function acoesResolvidas(usuario, featureId) {
    const feature = getFeature(featureId);
    if (!feature) return [];
    return feature.acoes.map((acao) => {
      const origens = usuario.perfis
        .map(getPerfil)
        .filter((perfil) => perfil && perfilConcede(perfil, featureId, acao.id))
        .map((perfil) => perfil.nome);
      const extra = concedidaPorExtra(usuario, featureId, acao.id);
      if (extra) origens.push('Permissão extra');
      return {
        ...acao,
        permitido: origens.length > 0,
        // true quando a ação só existe por causa da permissão extra
        somenteExtra: extra && origens.length === 1,
        origens,
      };
    });
  }

  // ---------- Gestão de perfis ----------

  function criarPerfil(nome) {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) return { erro: 'Informe um nome para o perfil.' };
    if (PERFIS.some((p) => p.nome.toLowerCase() === nomeLimpo.toLowerCase())) {
      return { erro: `Já existe um perfil chamado "${nomeLimpo}".` };
    }

    const base = nomeLimpo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'perfil';
    let id = base;
    let n = 2;
    while (PERFIS.some((p) => p.id === id)) id = `${base}-${n++}`;

    const perfil = { id, nome: nomeLimpo, ativo: true, permissoes: {} };
    PERFIS.push(perfil);
    return { perfil };
  }

  // Duplica um perfil: copia todas as permissões (usuários
  // vinculados NÃO são copiados). Reusa criarPerfil para validação de nome
  // e geração de id.
  function duplicarPerfil(perfilId, nome) {
    const origem = getPerfil(perfilId);
    if (!origem) return { erro: 'Perfil de origem não encontrado.' };
    const resultado = criarPerfil(nome);
    if (resultado.erro) return resultado;
    resultado.perfil.permissoes = JSON.parse(JSON.stringify(origem.permissoes));
    return resultado;
  }

  function excluirPerfil(perfilId) {
    const indice = PERFIS.findIndex((p) => p.id === perfilId);
    if (indice === -1 || PERFIS[indice].protegido) return;
    PERFIS.splice(indice, 1);
    // Remove o vínculo de todos os usuários que estavam no perfil.
    USUARIOS.forEach((u) => {
      u.perfis = u.perfis.filter((id) => id !== perfilId);
    });
  }

  function alternarPerfilAtivo(perfilId) {
    const perfil = getPerfil(perfilId);
    if (perfil && !perfil.protegido) perfil.ativo = !perfil.ativo;
  }

  // Ativa/desativa uma permissão (feature + ação) dentro do perfil.
  function alternarPermissao(perfilId, featureId, acaoId) {
    const perfil = getPerfil(perfilId);
    if (!perfil || perfil.protegido) return false;
    const atuais = perfil.permissoes[featureId] || [];
    const ativa = atuais.includes(acaoId);
    perfil.permissoes[featureId] = ativa
      ? atuais.filter((id) => id !== acaoId)
      : [...atuais, acaoId];
    if (!perfil.permissoes[featureId].length) delete perfil.permissoes[featureId];
    return !ativa; // novo estado
  }

  // Concede ou revoga TODAS as ações de uma feature no perfil.
  function definirTodasAcoes(perfilId, featureId, conceder) {
    const perfil = getPerfil(perfilId);
    const feature = getFeature(featureId);
    if (!perfil || !feature || perfil.protegido) return;
    if (conceder) {
      perfil.permissoes[featureId] = feature.acoes.map((a) => a.id);
    } else {
      delete perfil.permissoes[featureId];
    }
  }

  // Concede ou revoga todas as ações de todas as features de um módulo.
  function definirModulo(perfilId, moduloId, conceder) {
    featuresDoModulo(moduloId).forEach((f) => definirTodasAcoes(perfilId, f.id, conceder));
  }

  // Conta ações ativas/total do perfil em um conjunto de features.
  function contagemAcoes(perfil, features) {
    let ativas = 0;
    let total = 0;
    features.forEach((f) => {
      total += f.acoes.length;
      ativas += (perfil.permissoes[f.id] || []).length;
    });
    return { ativas, total };
  }

  // ---------- Permissões extras por usuário ----------

  // Concede ou revoga uma permissão extra individual (além dos perfis).
  function alternarPermissaoExtra(usuarioId, featureId, acaoId) {
    const usuario = getUsuario(usuarioId);
    if (!usuario) return false;
    if (!usuario.extras) usuario.extras = {};
    const atuais = usuario.extras[featureId] || [];
    const ativa = atuais.includes(acaoId);
    usuario.extras[featureId] = ativa
      ? atuais.filter((id) => id !== acaoId)
      : [...atuais, acaoId];
    if (!usuario.extras[featureId].length) delete usuario.extras[featureId];
    return !ativa; // novo estado
  }

  function totalExtras(usuario) {
    return Object.values(usuario.extras || {}).reduce((soma, acoes) => soma + acoes.length, 0);
  }

  // ---------- Vínculo usuário × perfil ----------

  // Retorna { incluido } com o novo estado, ou { erro }.
  function alternarUsuarioNoPerfil(usuarioId, perfilId) {
    const usuario = getUsuario(usuarioId);
    const perfil = getPerfil(perfilId);
    if (!usuario || !perfil) return { erro: 'Usuário ou perfil não encontrado.' };
    const incluido = usuario.perfis.includes(perfilId);
    usuario.perfis = incluido
      ? usuario.perfis.filter((id) => id !== perfilId)
      : [...usuario.perfis, perfilId];
    return { incluido: !incluido }; // novo estado
  }

  return {
    getPortal,
    modulosDoPortal,
    featuresDoPortal,
    getModulo,
    featuresDoModulo,
    getFeature,
    getPerfil,
    getUsuario,
    perfilConcede,
    concedidaPorPerfis,
    concedidaPorExtra,
    alternarPermissaoExtra,
    totalExtras,
    pode,
    podeAcessarTela,
    acoesResolvidas,
    criarPerfil,
    duplicarPerfil,
    excluirPerfil,
    alternarPerfilAtivo,
    alternarPermissao,
    definirTodasAcoes,
    definirModulo,
    contagemAcoes,
    alternarUsuarioNoPerfil,
  };
})();
