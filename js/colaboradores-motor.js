// ============================================================
// Motor da tela "Colaboradores": regras puras (sem DOM).
// Trazido do protótipo original (snorlax-jornada). No MVP a lista mora na base
// única (`colaboradores` em js/aulor.js) e o bloco `Acesso` mexe nos mesmos
// PERFIS/USUARIOS que Usuários e Perfis de acesso usam (Acessos, js/shell.js),
// para que vincular/criar usuário aqui apareça lá e vice-versa.
// ============================================================

const Colaboradores = (() => {
  const clonar = (x) => JSON.parse(JSON.stringify(x));

  const carregar = () => clonar(Aulor.colaboradores() ?? []);

  function salvar(lista) {
    Aulor.carregar().colaboradores = clonar(lista);
    Aulor.salvar();
    Acesso.sincronizar(lista);
  }

  // ---------- Helpers ----------

  const normalizar = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const digitos = (v) => String(v ?? '').replace(/\D/g, '');
  const porId = (lista, id) => lista.find((c) => c.id === id) ?? null;

  function numero(v) {
    if (v === '' || v == null) return null;
    const n = Number(String(v).replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  }

  function novoId(itens, prefixo) {
    let n = itens.length + 1;
    while (itens.some((x) => x.id === `${prefixo}${n}`)) n += 1;
    return `${prefixo}${n}`;
  }

  function proximaMatricula(lista) {
    const maior = lista.reduce((m, c) => Math.max(m, Number(digitos(c.matricula)) || 0), 0);
    return String(maior + 1).padStart(4, '0');
  }

  function cpfValido(v) {
    if (typeof Documento !== 'undefined') return Documento.cpfValido(v);
    const d = digitos(v);
    if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
    const calc = (n) => { let s = 0; for (let i = 0; i < n; i += 1) s += Number(d[i]) * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
    return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
  }


  // CNPJ pode ser alfanumérico: normaliza com Documento.limpar (mantém letras); fallback só dígitos.

  const emailValido = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

  function fmtCpf(v) { const d = digitos(v); return d.length === 11 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : v || ''; }
  function fmtTelefone(v) {
    const d = digitos(v);
    if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return v || '';
  }
  const fmtData = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR') : '');

  function idade(iso, hoje = COLAB_HOJE) {
    if (!iso) return null;
    const n = new Date(`${iso}T12:00:00`); const h = new Date(`${hoje}T12:00:00`);
    let a = h.getFullYear() - n.getFullYear();
    if (h < new Date(h.getFullYear(), n.getMonth(), n.getDate())) a -= 1;
    return a;
  }

  // "2 anos e 3 meses" entre a admissão e o desligamento (ou hoje).
  function tempoDeCasa(c, hoje = COLAB_HOJE) {
    if (!c.admissao) return '';
    const ini = new Date(`${c.admissao}T12:00:00`);
    const fim = new Date(`${c.desligamento?.data ?? hoje}T12:00:00`);
    let meses = (fim.getFullYear() - ini.getFullYear()) * 12 + (fim.getMonth() - ini.getMonth());
    if (fim.getDate() < ini.getDate()) meses -= 1;
    if (meses < 1) return 'menos de 1 mês';
    const anos = Math.floor(meses / 12); const resto = meses % 12;
    const partes = [];
    if (anos) partes.push(`${anos} ano${anos === 1 ? '' : 's'}`);
    if (resto) partes.push(`${resto} ${resto === 1 ? 'mês' : 'meses'}`);
    return partes.join(' e ');
  }

  // ---------- Lista ----------

  function filtrar(lista, { busca = '', departamentoId = '', status = '' } = {}) {
    const termo = normalizar(busca);
    const termoDig = digitos(busca);
    return lista
      .filter((c) => !termo || normalizar(`${c.matricula} ${c.nome} ${c.nomeSocial} ${c.cargo} ${c.contato.email}`).includes(termo) || (termoDig && digitos(c.cpf).includes(termoDig)))
      .filter((c) => !departamentoId || c.departamentoId === departamentoId)
      .filter((c) => !status || c.status === status)
      .sort((a, b) => (a.nomeSocial || a.nome).localeCompare(b.nomeSocial || b.nome, 'pt-BR'));
  }

  function contagem(lista) {
    return STATUS_COLABORADOR.reduce((acc, s) => ({ ...acc, [s.id]: lista.filter((x) => x.status === s.id).length }), { total: lista.length });
  }

  // ---------- Pendências ----------

  // Avisos que não bloqueiam, mas mostram o que falta no cadastro e no acesso.
  function pendencias(c, acesso = null) {
    const p = [];
    if (c.status === 'desligado') {
      if (acesso?.usuario && acesso.perfis.length) p.push('Acesso ainda ativo após o desligamento');
      return p;
    }
    if (!cpfValido(c.cpf)) p.push('CPF');
    if (!c.nascimento) p.push('Data de nascimento');
    if (!c.contato.celular) p.push('Celular');
    if (!c.contato.email) p.push('E-mail corporativo');
    if (!c.acesso.usuarioId) p.push('Usuário de acesso');
    else if (acesso && !acesso.usuario) p.push('Usuário de acesso não existe mais');
    else if (acesso && !acesso.perfis.length) p.push('Usuário sem perfil de acesso');
    return p;
  }

  // ---------- Validações ----------

  function validarDados(dados, lista, idAtual = null) {
    const erros = [];
    const outros = lista.filter((c) => c.id !== idAtual);
    const nome = String(dados.nome ?? '').trim();
    if (nome.length < 3) erros.push({ campo: 'nome', mensagem: 'Informe o nome completo.' });
    const cpf = digitos(dados.cpf);
    if (!cpf) erros.push({ campo: 'cpf', mensagem: 'Informe o CPF.' });
    else if (!cpfValido(cpf)) erros.push({ campo: 'cpf', mensagem: 'CPF inválido.' });
    else if (outros.some((c) => digitos(c.cpf) === cpf)) erros.push({ campo: 'cpf', mensagem: 'Já existe um colaborador com esse CPF.' });
    if (!String(dados.cargo ?? '').trim()) erros.push({ campo: 'cargo', mensagem: 'Informe o cargo.' });
    if (!DEPARTAMENTOS.some((d) => d.id === dados.departamentoId)) erros.push({ campo: 'departamentoId', mensagem: 'Escolha o departamento.' });
    if (!dados.admissao) erros.push({ campo: 'admissao', mensagem: 'Informe a data de admissão.' });
    const email = String(dados.email ?? '').trim();
    if (!emailValido(email)) erros.push({ campo: 'email', mensagem: 'E-mail inválido.' });
    else if (email && outros.some((c) => normalizar(c.contato.email) === normalizar(email))) erros.push({ campo: 'email', mensagem: 'Já existe um colaborador com esse e-mail.' });
    if (dados.matricula != null) {
      const m = String(dados.matricula).trim();
      if (!m) erros.push({ campo: 'matricula', mensagem: 'Informe a matrícula.' });
      else if (outros.some((c) => c.matricula === m)) erros.push({ campo: 'matricula', mensagem: 'Matrícula já usada.' });
    }
    return erros;
  }

  function validarPessoais(dados) {
    const erros = [];
    if (dados.nascimento) {
      const a = idade(dados.nascimento);
      if (a == null || a < 14 || a > 100) erros.push({ campo: 'nascimento', mensagem: 'Data de nascimento improvável.' });
    }
    return erros;
  }

  function validarContato(dados) {
    const erros = [];
    const cel = digitos(dados.celular);
    if (cel && cel.length !== 11) erros.push({ campo: 'celular', mensagem: 'Celular com DDD + 9 dígitos.' });
    return erros;
  }

  function validarAfastamento(dados) {
    const erros = [];
    if (!dados.inicio) erros.push({ campo: 'inicio', mensagem: 'Informe o início.' });
    if (!MOTIVOS_AFASTAMENTO.some((m) => m.id === dados.motivo)) erros.push({ campo: 'motivo', mensagem: 'Escolha o motivo.' });
    if (dados.previsaoRetorno && dados.inicio && dados.previsaoRetorno < dados.inicio) erros.push({ campo: 'previsaoRetorno', mensagem: 'Retorno antes do início.' });
    return erros;
  }

  function validarDesligamento(dados, c) {
    const erros = [];
    if (!dados.data) erros.push({ campo: 'data', mensagem: 'Informe a data.' });
    else if (c.admissao && dados.data < c.admissao) erros.push({ campo: 'data', mensagem: 'Antes da admissão.' });
    if (!MOTIVOS_DESLIGAMENTO.some((m) => m.id === dados.motivo)) erros.push({ campo: 'motivo', mensagem: 'Escolha o motivo.' });
    return erros;
  }

  // ---------- CRUD ----------

  const atualizar = (lista, id, patch) => lista.map((c) => (c.id === id ? { ...c, ...patch } : c));

  function registrar(c, em, texto) {
    return { ...c, historico: [...(c.historico ?? []), { em, texto }] };
  }

  function limparDados(dados) {
    return {
      nome: String(dados.nome).trim(),
      cpf: digitos(dados.cpf),
      cargo: String(dados.cargo).trim(),
      departamentoId: dados.departamentoId,
      admissao: dados.admissao,
    };
  }

  function incluir(lista, dados, hoje = COLAB_HOJE) {
    const limpo = limparDados(dados);
    let c = colaboradorSeed({ id: novoId(lista, 'c'), matricula: proximaMatricula(lista), status: 'ativo', ...limpo });
    c.contato.email = String(dados.email ?? '').trim();
    c = registrar(c, limpo.admissao || hoje, `Admissão — ${limpo.cargo}`);
    return { lista: [...lista, c], colaborador: c };
  }

  // Editar dados principais; mudança de cargo entra no histórico.
  function atualizarDados(lista, id, dados) {
    const atual = porId(lista, id);
    const limpo = limparDados(dados);
    const patch = { ...limpo, matricula: String(dados.matricula ?? atual.matricula).trim(), contato: { ...atual.contato, email: String(dados.email ?? '').trim() } };
    let c = { ...atual, ...patch };
    if (limpo.cargo !== atual.cargo) c = registrar(c, COLAB_HOJE, `Cargo alterado: ${atual.cargo} → ${limpo.cargo}`);
    return lista.map((x) => (x.id === id ? c : x));
  }

  function atualizarPessoais(lista, id, dados) {
    return atualizar(lista, id, {
      nomeSocial: String(dados.nomeSocial ?? '').trim(),
      nascimento: dados.nascimento || '',
    });
  }

  function atualizarContato(lista, id, dados) {
    const atual = porId(lista, id);
    return atualizar(lista, id, {
      contato: { email: atual.contato.email, celular: digitos(dados.celular) },
    });
  }

  function atualizarObservacoes(lista, id, texto) {
    return atualizar(lista, id, { observacoes: String(texto ?? '').trim() });
  }

  function vincularUsuario(lista, id, usuarioId) {
    return atualizar(lista, id, { acesso: { usuarioId: usuarioId || null } });
  }

  // ---------- Status ----------

  function afastar(lista, id, dados) {
    const c = porId(lista, id);
    const motivo = MOTIVOS_AFASTAMENTO.find((m) => m.id === dados.motivo)?.nome ?? '';
    const novo = registrar({ ...c, status: 'afastado', afastamento: { inicio: dados.inicio, previsaoRetorno: dados.previsaoRetorno || '', motivo: dados.motivo } }, dados.inicio, `Afastamento — ${motivo}${dados.previsaoRetorno ? ` (retorno previsto ${fmtData(dados.previsaoRetorno)})` : ''}`);
    return lista.map((x) => (x.id === id ? novo : x));
  }

  function encerrarAfastamento(lista, id, hoje = COLAB_HOJE) {
    const c = porId(lista, id);
    const novo = registrar({ ...c, status: 'ativo', afastamento: null }, hoje, 'Retorno do afastamento');
    return lista.map((x) => (x.id === id ? novo : x));
  }

  function desligar(lista, id, dados) {
    const c = porId(lista, id);
    const motivo = MOTIVOS_DESLIGAMENTO.find((m) => m.id === dados.motivo)?.nome ?? '';
    const novo = registrar({ ...c, status: 'desligado', afastamento: null, desligamento: { data: dados.data, motivo: dados.motivo } }, dados.data, `Desligamento — ${motivo}`);
    return lista.map((x) => (x.id === id ? novo : x));
  }

  // Readmissão: volta a ativo com nova data de admissão; o histórico anterior fica.
  function readmitir(lista, id, admissao) {
    const c = porId(lista, id);
    const novo = registrar({ ...c, status: 'ativo', desligamento: null, admissao }, admissao, 'Readmissão');
    return lista.map((x) => (x.id === id ? novo : x));
  }

  const remover = (lista, id) => lista.filter((c) => c.id !== id);

  // ---------- Acesso (usuários e perfis do MVP) ----------
  // Mexe nos PERFIS/USUARIOS já carregados pelo shell (Acessos) e grava pela
  // mesma chave de Usuários e Perfis de acesso.

  const Acesso = (() => {
    const snapshot = () => ({ perfis: PERFIS, usuarios: USUARIOS });
    const gravar = () => { if (typeof Acessos !== 'undefined') Acessos.salvar(); };

    const usuarios = () => snapshot().usuarios.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    const perfis = () => snapshot().perfis.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    // Situação do usuário vinculado: { usuario, perfis: [perfil ativo...], inativos: [...], extras: n } ou null.
    function de(usuarioId) {
      if (!usuarioId) return null;
      const s = snapshot();
      const usuario = s.usuarios.find((u) => u.id === usuarioId) ?? null;
      if (!usuario) return { usuario: null, perfis: [], inativos: [], extras: 0 };
      const todos = usuario.perfis.map((pid) => s.perfis.find((p) => p.id === pid)).filter(Boolean);
      return {
        usuario,
        perfis: todos.filter((p) => p.ativo !== false),
        inativos: todos.filter((p) => p.ativo === false),
        extras: Object.values(usuario.extras ?? {}).reduce((n, acoes) => n + acoes.length, 0),
      };
    }

    // Usuários que nenhum colaborador da lista aponta (candidatos a vínculo).
    function livres(lista, exceto = null) {
      const usados = new Set(lista.filter((c) => c.id !== exceto).map((c) => c.acesso.usuarioId).filter(Boolean));
      return usuarios().filter((u) => !usados.has(u.id));
    }

    const filtrarPerfis = (s, perfilIds) => perfilIds.filter((p) => s.perfis.some((x) => x.id === p));

    // E-mail, cargo e o vínculo com o colaborador entram no salvar (sincronizar).
    function criar(nome, perfilIds) {
      const s = snapshot();
      const usuario = {
        id: `u${Math.max(0, ...s.usuarios.map((u) => Number(String(u.id).slice(1)) || 0)) + 1}`,
        nome: String(nome).trim(), email: '', cargo: '', status: 'ativo', vinculos: [],
        perfis: filtrarPerfis(s, perfilIds),
        extras: {},
      };
      s.usuarios.push(usuario);
      gravar(s);
      return usuario;
    }

    function definirPerfis(usuarioId, perfilIds) {
      const s = snapshot();
      const u = s.usuarios.find((x) => x.id === usuarioId);
      if (!u) return false;
      u.perfis = filtrarPerfis(s, perfilIds);
      gravar(s);
      return true;
    }

    // Bloquear = tirar todos os perfis e extras; o usuário continua existindo (histórico).
    function bloquear(usuarioId) {
      const s = snapshot();
      const u = s.usuarios.find((x) => x.id === usuarioId);
      if (!u) return false;
      u.perfis = []; u.extras = {};
      gravar(s);
      return true;
    }

    // Mantém `usuario.vinculos` (que o MVP usa para o tipo de usuário) igual a `colaborador.acesso.usuarioId`.
    // Vínculo de colaborador que não aponta para um colaborador da lista (convite antigo) fica como está.
    function sincronizar(lista) {
      const ids = new Set(lista.map((c) => c.id));
      USUARIOS.forEach((u) => {
        const meus = lista.filter((c) => c.acesso?.usuarioId === u.id);
        u.vinculos = (u.vinculos ?? []).filter((v) => v.tipo !== 'colaborador' || (!ids.has(v.id) && !(meus.length && v.id === u.id)));
        meus.forEach((c) => {
          u.vinculos.push({ tipo: 'colaborador', id: c.id });
          if (!u.email) u.email = c.contato.email;
          if (!u.cargo) u.cargo = c.cargo;
        });
      });
      gravar();
    }

    return { usuarios, perfis, de, livres, criar, definirPerfis, bloquear, sincronizar };
  })();

  return {
    carregar, salvar, normalizar, digitos, porId, numero, proximaMatricula,
    cpfValido, fmtCpf, fmtTelefone, fmtData, idade, tempoDeCasa,
    filtrar, contagem, pendencias,
    validarDados, validarPessoais, validarContato, validarAfastamento, validarDesligamento,
    incluir, atualizarDados, atualizarPessoais, atualizarContato, atualizarObservacoes, vincularUsuario,
    afastar, encerrarAfastamento, desligar, readmitir, remover,
    Acesso,
  };
})();
