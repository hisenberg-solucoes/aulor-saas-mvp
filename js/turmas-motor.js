// ============================================================
// Motor da tela "Turmas": regras puras (sem DOM).
// Uma TURMA é a oferta concreta de um CURSO (js/cursos-data.js) num período,
// com turno, formato, instrutor, sala e vagas. Pode pertencer a uma FORMAÇÃO
// (turma da edição) ou ser avulsa (turma aberta / in company).
// Semente e constantes ficam em js/cursos-data.js (TURMAS_CURSO, AGENDAS,
// STATUS_TURMA, TIPOS_TURMA) porque cursos e contratos também as leem.
// Persistência em localStorage — trocar o sufixo da chave força reset.
// A chave é lida também por Cursos.todasTurmas() — manter em sincronia.
// ============================================================

const Turmas = (() => {
  const CHAVE = 'aulor-v1-turmas-v11'; // (08/09/2026: risco de não fechar é derivado — RN11 — sem bump); v11 (07/09/2026): catálogo ProWay completo (turmas de todas as áreas); v10 (03/09/2026): requisitos de software/máquina por turma (RN10); v9: AULAS_CANCELADAS_SEED com 23 cancelamentos

  // Situação exibida = status administrativo + fase pelas datas (RN2).
  const SITUACOES = [
    { id: 'planejada', nome: 'Planejada', descricao: 'Datas previstas; ainda depende de vagas/confirmação.' },
    { id: 'confirmada', nome: 'Confirmada', descricao: 'Vai acontecer — ainda não começou.' },
    { id: 'em_andamento', nome: 'Em andamento', descricao: 'Entre a data de início e a de fim.' },
    { id: 'concluida', nome: 'Concluída', descricao: 'Data de fim já passou.' },
    { id: 'cancelada', nome: 'Cancelada', descricao: 'Não vai acontecer; histórico preservado.' },
  ];

  function clonar(x) {
    return JSON.parse(JSON.stringify(x));
  }

  function carregar() {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) return JSON.parse(salvo);
    } catch (_) { /* volta para a semente */ }
    return semearAulas(clonar(TURMAS_CURSO));
  }

  // Semente de aulas canceladas/repostas (AULAS_CANCELADAS_SEED, cursos-data.js): materializa o agendamento das
  // turmas citadas pela agenda em vigor e cancela/repõe as aulas listadas. Só quando o motor de aulas está carregado
  // (páginas sem aulas-motor seguem na prévia da agenda). Determinístico: ids iguais a cada carga.
  function semearAulas(lista) {
    if (typeof Aulas === 'undefined' || typeof AULAS_CANCELADAS_SEED === 'undefined') return lista;
    AULAS_CANCELADAS_SEED.forEach((c) => {
      const t = porId(lista, c.turmaId);
      const agenda = t ? agendaDe(t) : null;
      if (!agenda) return;
      if (!Array.isArray(t.aulas)) t.aulas = Aulas.distribuirConteudo(Aulas.gerar(t, agenda), typeof Cursos !== 'undefined' ? Cursos.porId(Cursos.carregar(), t.cursoId) : null);
      const alvo = t.aulas.find((a) => a.data === c.data && a.status !== 'cancelada' && (!c.inicio || a.inicio === c.inicio));
      if (!alvo) return;
      t.aulas = Aulas.cancelar(t.aulas, alvo.id, c.motivo);
      if (c.repor) {
        const enc = Aulas.proximoEncaixe(t.aulas, agenda, t.fim);
        if (enc) t.aulas = Aulas.incluir(t.aulas, { ...enc, observacoes: `Reposição da aula de ${c.data.slice(8, 10)}/${c.data.slice(5, 7)}` }, 'reposicao').lista;
      }
    });
    return lista;
  }

  function salvar(lista) {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  }

  const normalizar = (t) => Cursos.normalizar(t);
  const numero = (v) => Cursos.numero(v);

  // "Hoje" é a data local do navegador (08/09/2026: antes era a data fixa da semente, SEED_HOJE,
  // que continua valendo só para GERAR a semente em *-data.js).
  function hoje() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function novoId(lista) {
    let n = lista.length + 1;
    while (lista.some((x) => x.id === `t${n}`)) n += 1;
    return `t${n}`;
  }

  const porId = (lista, id) => lista.find((t) => t.id === id) ?? null;
  const tipoDe = (dados) => (dados.formacaoId ? 'formacao' : dados.tipo === 'incompany' ? 'incompany' : 'aberta');

  // Agenda em vigor: a da formação (herdada) ou a própria (avulsa).
  function formacaoDe(id) {
    if (!id || typeof Formacoes === 'undefined') return null;
    return Formacoes.porId(Formacoes.carregar(), id);
  }
  function agendaDe(t) {
    return t.formacaoId ? (formacaoDe(t.formacaoId)?.agenda ?? null) : (t.agenda ?? null);
  }

  // Aulas da turma: as AGENDADAS (gravadas em `t.aulas` pelo Gerar aulas da turma) quando existem;
  // senão a PRÉVIA calculada pela agenda em vigor entre início e fim. Só as não canceladas.
  const temAgendamento = (t) => Array.isArray(t.aulas);
  function aulas(t) {
    if (temAgendamento(t)) return Aulas.numerar(t.aulas).filter((a) => a.status !== 'cancelada');
    return Agenda.datasAulas(agendaDe(t), t.inicio, t.fim).map((a) => ({ ...a, status: 'prevista', origem: 'agenda', salaId: null, instrutorId: null, moduloIds: [], conteudo: '' }));
  }
  // Todas as aulas agendadas, inclusive canceladas (null quando ainda não agendou).
  const aulasAgendadas = (t) => (temAgendamento(t) ? Aulas.numerar(t.aulas) : null);
  const salvarAulas = (lista, id, aulasNovas) => lista.map((t) => (t.id === id ? { ...t, aulas: aulasNovas } : t));
  const horasAula = (a) => { const [hi, mi] = a.inicio.split(':').map(Number); const [hf, mf] = a.fim.split(':').map(Number); return (hf * 60 + mf - hi * 60 - mi) / 60; };
  const horasAulas = (as) => as.reduce((s, a) => s + horasAula(a), 0);

  // ---------- Situação ----------

  // RN2: cancelada vence tudo; concluída gravada ou fim já passado; depois as datas; senão o status.
  function situacao(t, ref = hoje()) {
    if (t.status === 'cancelada') return 'cancelada';
    if (t.status === 'concluida' || t.fim < ref) return 'concluida';
    if (t.inicio <= ref) return 'em_andamento';
    return t.status;
  }

  const situacaoDe = (id) => SITUACOES.find((s) => s.id === id) ?? null;
  const podeEditar = (t) => situacao(t) !== 'cancelada' && situacao(t) !== 'concluida';
  const podeConfirmar = (t) => situacao(t) === 'planejada';
  const podeCancelar = (t) => t.status !== 'cancelada' && situacao(t) !== 'concluida';
  const podeReabrir = (t) => t.status === 'cancelada';

  // ---------- Consultas ----------

  const turmasDoCurso = (lista, cursoId) => lista.filter((t) => t.cursoId === cursoId);
  // Turmas de um curso dentro de uma formação (ou avulsas quando formacaoId é null), mais recente primeiro.
  const turmasDoCursoNaFormacao = (lista, cursoId, formacaoId) => lista
    .filter((t) => t.cursoId === cursoId && (t.formacaoId ?? null) === (formacaoId ?? null))
    .sort((a, b) => b.inicio.localeCompare(a.inicio));
  const turmasDaFormacao = (lista, formacaoId) => lista.filter((t) => t.formacaoId === formacaoId);

  // Matrículas ligadas à turma (via itens de contrato). Só funciona com Contratos carregado.
  // Índice turmaId → matrículas, montado uma vez por passada síncrona (listas com centenas de turmas × centenas de
  // contratos ficavam lentas recarregando os contratos a cada turma). Some sozinho no próximo tick, então nunca fica
  // velho depois de um Contratos.salvar.
  let _indiceMatriculas = null;
  function indiceMatriculas() {
    if (_indiceMatriculas) return _indiceMatriculas;
    const idx = new Map();
    Contratos.carregar().forEach((c) => {
      // Item = matrícula (aluno × curso/turma). Desde a chave contratos v7 só alunos aprovados (ou desistentes) contam;
      // quem entrou pelo link e ainda aguarda conferência fica fora.
      Contratos.itensMatriculados(c).forEach((item) => {
        if (!item.turmaId) return;
        if (!idx.has(item.turmaId)) idx.set(item.turmaId, []);
        idx.get(item.turmaId).push({ contrato: c, item, matricula: item, alunoId: item.alunoId });
      });
    });
    _indiceMatriculas = idx;
    if (typeof setTimeout === 'function') setTimeout(() => { _indiceMatriculas = null; }, 0);
    return idx;
  }
  const invalidarMatriculas = () => { _indiceMatriculas = null; };

  function matriculas(t) {
    if (typeof Contratos === 'undefined') return null;
    const linhas = indiceMatriculas().get(t.id) ?? [];
    const conta = (s) => linhas.filter((l) => l.matricula.status === s).length;
    return {
      linhas,
      total: linhas.length,
      ativos: conta('matriculado'),
      concluidos: conta('concluido'),
      congeladas: conta('congelada'),
      desistiu: conta('desistiu'),
      canceladas: conta('cancelada'),
      // Ocupam vaga: matriculados, congelados (pausa, a vaga fica reservada) e concluídos.
      ocupadas: conta('matriculado') + conta('congelada') + conta('concluido'),
    };
  }

  // Pseudo-situação do filtro "Situação": só as turmas em risco de não fechar (RN11), na ordem do risco.
  const SITUACAO_RISCO = '__risco';

  function filtrar(lista, cursos, { busca = '', formacaoId = '', tipo = '', situacao: sit = '', instrutorId = '', formato = '', ref = hoje() } = {}) {
    const termo = normalizar(busca);
    const emRisco = sit === SITUACAO_RISCO ? new Map(turmasEmRisco(lista, cursos, ref).map((r, i) => [r.turma.id, i])) : null;
    if (emRisco) return lista.filter((t) => emRisco.has(t.id)).sort((a, b) => emRisco.get(a.id) - emRisco.get(b.id));
    return lista
      .filter((t) => {
        if (!termo) return true;
        const curso = Cursos.porId(cursos, t.cursoId);
        const instrutor = INSTRUTORES.find((i) => i.id === t.instrutorId);
        return normalizar(`${t.codigo} ${curso?.codigo ?? ''} ${curso?.nome ?? ''} ${instrutor?.nome ?? ''}`).includes(termo);
      })
      .filter((t) => !formacaoId || (formacaoId === '__avulsa' ? !t.formacaoId : t.formacaoId === formacaoId))
      .filter((t) => !tipo || t.tipo === tipo)
      .filter((t) => !sit || situacao(t, ref) === sit)
      .filter((t) => !instrutorId || t.instrutorId === instrutorId)
      .filter((t) => !formato || t.formato === formato)
      .sort((a, b) => b.inicio.localeCompare(a.inicio) || a.codigo.localeCompare(b.codigo, 'pt-BR'));
  }

  function contagem(lista, ref = hoje()) {
    const c = Object.fromEntries(SITUACOES.map((s) => [s.id, 0]));
    lista.forEach((t) => { c[situacao(t, ref)] += 1; });
    return c;
  }

  // ---------- Risco de não fechar (RN11, 08/09/2026) ----------
  // "Fechar" a turma = atingir o mínimo de alunos até o início. O comercial precisa saber cedo quais
  // turmas ainda não fecharam para concentrar a venda nelas. Só entram turmas planejadas/confirmadas
  // que ainda não começaram; a partir do início a turma ou aconteceu ou foi cancelada.
  // Mínimo de alunos: o da turma (`t.vagasMin`, quando um dia existir), senão o do curso
  // (`curso.comercial.vagasMin`), senão metade das vagas [sup.].
  // Níveis [sup.]: crítico (≤ 15 dias e falta gente), alerta (≤ 45 dias e falta gente) e atenção
  // (mais de 45 dias, falta gente e ocupação abaixo de 30% — longe do início só assusta quando está vazia).
  const RISCO = {
    critico: { id: 'critico', nome: 'Crítico', ordem: 0, dias: 15 },
    alerta: { id: 'alerta', nome: 'Alerta', ordem: 1, dias: 45 },
    atencao: { id: 'atencao', nome: 'Atenção', ordem: 2, ocupacaoMax: 30 },
  };
  const NIVEIS_RISCO = [RISCO.critico, RISCO.alerta, RISCO.atencao];
  const FRACAO_MINIMO_PADRAO = 0.5;

  const diasEntre = (de, ate) => Math.round((new Date(`${ate}T00:00:00`) - new Date(`${de}T00:00:00`)) / 86400000);

  function minimoDe(t, curso) {
    const daTurma = numero(t.vagasMin);
    if (daTurma != null && !Number.isNaN(daTurma) && daTurma > 0) return { minimo: daTurma, origemMinimo: 'turma' };
    const doCurso = numero(curso?.comercial?.vagasMin);
    if (doCurso != null && !Number.isNaN(doCurso) && doCurso > 0) return { minimo: doCurso, origemMinimo: 'curso' };
    return { minimo: Math.max(1, Math.ceil((Number(t.vagas) || 0) * FRACAO_MINIMO_PADRAO)), origemMinimo: 'padrao' };
  }

  // Turma de formação só corre risco enquanto a EDIÇÃO não começou: depois que a primeira turma da
  // formação abre, os módulos seguintes vão acontecer com quem está matriculado [sup.].
  // `lista` é opcional — sem ela, a turma de formação é avaliada sozinha.
  function formacaoJaComecou(t, lista, ref) {
    if (!t.formacaoId || !Array.isArray(lista)) return false;
    return lista.some((x) => x.formacaoId === t.formacaoId && x.status !== 'cancelada' && x.inicio <= ref);
  }

  function nivelRisco({ faltam, diasParaInicio, ocupacaoPct }) {
    if (faltam <= 0) return null;
    if (diasParaInicio <= RISCO.critico.dias) return 'critico';
    if (diasParaInicio <= RISCO.alerta.dias) return 'alerta';
    if (ocupacaoPct < RISCO.atencao.ocupacaoMax) return 'atencao';
    return null;
  }

  // Avaliação de uma turma: null quando não se aplica (já começou, concluída, cancelada) ou não há risco.
  // `cursos` = lista de cursos (para o mínimo e o preço); `lista` = todas as turmas (para saber se a formação já começou).
  function risco(t, cursos, ref = hoje(), lista = null) {
    const sit = situacao(t, ref);
    if (sit !== 'planejada' && sit !== 'confirmada') return null;
    if (formacaoJaComecou(t, lista, ref)) return null;
    const curso = Cursos.porId(cursos, t.cursoId);
    const { minimo, origemMinimo } = minimoDe(t, curso);
    const ocupadas = matriculas(t)?.ocupadas ?? 0;
    const faltam = Math.max(0, minimo - ocupadas);
    const diasParaInicio = diasEntre(ref, t.inicio);
    const ocupacaoPct = t.vagas ? Math.round((ocupadas / t.vagas) * 100) : 0;
    const nivel = nivelRisco({ faltam, diasParaInicio, ocupacaoPct });
    if (!nivel) return null;
    const preco = numero(curso?.comercial?.precoReferencia);
    return {
      turma: t, curso, nivel, minimo, origemMinimo, ocupadas, faltam, diasParaInicio, ocupacaoPct,
      vagas: t.vagas,
      // Receita em jogo = o que falta vender pelo preço de referência do curso (null quando o curso não tem preço) [sup.].
      valorEmJogo: preco != null && !Number.isNaN(preco) ? faltam * preco : null,
    };
  }

  // Todas as turmas em risco, crítico primeiro e, no mesmo nível, a que começa antes.
  function turmasEmRisco(lista, cursos, ref = hoje()) {
    return lista
      .map((t) => risco(t, cursos, ref, lista))
      .filter(Boolean)
      .sort((a, b) => RISCO[a.nivel].ordem - RISCO[b.nivel].ordem || a.diasParaInicio - b.diasParaInicio || a.turma.codigo.localeCompare(b.turma.codigo, 'pt-BR'));
  }

  // Totais para o cartão: quantas por nível e o valor em jogo somado (só das turmas com preço).
  function resumoRisco(emRisco) {
    const r = { total: emRisco.length, critico: 0, alerta: 0, atencao: 0, valorEmJogo: 0, semPreco: 0 };
    emRisco.forEach((x) => { r[x.nivel] += 1; if (x.valorEmJogo == null) r.semPreco += 1; else r.valorEmJogo += x.valorEmJogo; });
    return r;
  }

  // ---------- Código ----------

  // RN1: código único dentro da mesma formação (ou entre as avulsas).
  const mesmoEscopo = (a, formacaoId) => (a.formacaoId ?? null) === (formacaoId ?? null);

  function sugerirCodigo(lista, curso, agenda, formacaoId = null, idAtual = null) {
    if (!curso) return '';
    const base = `${curso.codigo} ${Agenda.sufixoCodigo(agenda)}`.trim();
    const existe = (cod) => lista.some((t) => t.id !== idAtual && mesmoEscopo(t, formacaoId) && normalizar(t.codigo) === normalizar(cod));
    if (!existe(base)) return base;
    let n = 2;
    while (existe(`${base} ${n}`)) n += 1;
    return `${base} ${n}`;
  }

  // ---------- Validação ----------

  const ehData = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v ?? ''));

  // Link de reunião: aceita qualquer URL http(s); avisa (não bloqueia) quando não é do Google Meet.
  const urlValida = (url) => /^https?:\/\/\S+$/i.test(url);
  const ehMeet = (url) => /^https:\/\/meet\.google\.com\//i.test(url);

  function validar(dados, lista, cursos, idAtual = null) {
    const erros = [];
    const meetLink = String(dados.meetLink ?? '').trim();
    if (meetLink && !urlValida(meetLink)) erros.push({ campo: 'meetLink', mensagem: 'Informe o endereço completo, começando com https://.' });
    const outros = lista.filter((t) => t.id !== idAtual);
    const curso = Cursos.porId(cursos, dados.cursoId);
    const codigo = String(dados.codigo ?? '').trim();
    const formacaoId = dados.formacaoId || null;
    if (!curso) erros.push({ campo: 'cursoId', mensagem: 'Escolha o curso da turma.' });
    if (!codigo) erros.push({ campo: 'codigo', mensagem: 'Informe o código da turma.' });
    else if (codigo.length < 2 || codigo.length > 20) erros.push({ campo: 'codigo', mensagem: 'Use de 2 a 20 caracteres.' });
    else if (outros.some((t) => mesmoEscopo(t, formacaoId) && normalizar(t.codigo) === normalizar(codigo))) erros.push({ campo: 'codigo', mensagem: formacaoId ? 'Já existe uma turma com esse código nesta formação.' : 'Já existe uma turma avulsa com esse código.' });
    if (!formacaoId) erros.push(...Agenda.validar(dados.agenda ?? Agenda.vazia()));
    if (!ehData(dados.inicio)) erros.push({ campo: 'inicio', mensagem: 'Informe a data de início.' });
    if (!ehData(dados.fim)) erros.push({ campo: 'fim', mensagem: 'Informe a data de fim.' });
    else if (ehData(dados.inicio) && dados.fim < dados.inicio) erros.push({ campo: 'fim', mensagem: 'O fim não pode ser antes do início.' });
    const vagas = numero(dados.vagas);
    if (vagas == null || Number.isNaN(vagas) || !Number.isInteger(vagas) || vagas < 1) erros.push({ campo: 'vagas', mensagem: 'Número inteiro de vagas (≥ 1).' });
    if (dados.instrutorId && !INSTRUTORES.some((i) => i.id === dados.instrutorId)) erros.push({ campo: 'instrutorId', mensagem: 'Instrutor inválido.' });
    if (dados.status && !STATUS_TURMA.some((s) => s.id === dados.status)) erros.push({ campo: 'status', mensagem: 'Status inválido.' });
    if (formacaoId && curso && typeof Formacoes !== 'undefined') {
      const f = Formacoes.porId(Formacoes.carregar(), formacaoId);
      if (!f) erros.push({ campo: 'formacaoId', mensagem: 'Formação não encontrada.' });
      else if (!Formacoes.temAgenda(f)) erros.push({ campo: 'formacaoId', mensagem: 'Defina a agenda das aulas da formação antes de abrir turmas.' });
      else if (!f.itens.some((i) => i.cursoId === curso.id)) erros.push({ campo: 'formacaoId', mensagem: 'Este curso não faz parte da formação escolhida.' });
    }
    return erros;
  }

  // Avisos que não bloqueiam (faixa âmbar). `ctx` = { curso, formacao, sala, instrutor, ocupadas }.
  function pendencias(t, { curso, formacao, sala, instrutor, ocupadas = null } = {}) {
    const p = [];
    if (t.status === 'cancelada') return p;
    if (!curso) p.push('Curso não encontrado no catálogo');
    else if (curso.status !== 'ativo') p.push(`Curso ${curso.status === 'rascunho' ? 'em rascunho' : 'inativo'}`);
    if (t.formacaoId && formacao && formacao.status !== 'ativo') p.push(`Formação ${formacao.status === 'rascunho' ? 'em rascunho' : 'inativa'}`);
    if (!t.instrutorId) p.push('Sem instrutor');
    else if (curso && !curso.instrutorIds.includes(t.instrutorId)) p.push(`${instrutor?.nome ?? 'Instrutor'} não está entre os instrutores habilitados do curso`);
    if (!t.salaId) p.push(t.formato === 'online' ? 'Sem sala virtual' : 'Sem sala');
    else if (sala) {
      if (sala.status !== 'ativa') p.push(`Sala ${sala.nome} ${sala.status === 'manutencao' ? 'em manutenção' : 'inativa'}`);
      if (sala.tipo === 'virtual' && t.formato === 'presencial') p.push('Turma presencial em sala virtual');
      if (sala.tipo !== 'virtual' && t.formato === 'online') p.push('Turma online em sala física');
      if (sala.capacidade?.alunos != null && t.formato !== 'online' && t.vagas > sala.capacidade.alunos) p.push(`Vagas (${t.vagas}) acima da capacidade da sala (${sala.capacidade.alunos})`);
    }
    if (curso && curso.formatos.length && !curso.formatos.includes(t.formato)) p.push('Formato não previsto no curso');
    if ((t.formato === 'online' || t.formato === 'hibrido') && !t.meetLink) p.push('Sem link do Google Meet');
    if (t.meetLink && !ehMeet(t.meetLink)) p.push('Link de reunião fora do Google Meet');
    if (ocupadas != null && ocupadas > t.vagas) p.push(`Matrículas (${ocupadas}) acima das vagas (${t.vagas})`);
    return p;
  }

  // ---------- Gravações (Google Meet) ----------
  // Cada gravação fica em `t.gravacoes`: { id, data (dia da aula), titulo, url, duracaoMin, observacoes }.
  // A gravação aponta para a aula pela DATA, não pelo id: sobrevive a reagendamentos e vale
  // também antes de gravar o agendamento (aulas da prévia não têm id). Uma aula pode ter várias.

  const gravacoes = (t) => [...(t.gravacoes ?? [])].sort((a, b) => a.data.localeCompare(b.data) || (a.inicio ?? '').localeCompare(b.inicio ?? '') || a.titulo.localeCompare(b.titulo, 'pt-BR'));

  // Aulas realizadas (data < hoje) + datas que têm gravação sem aula na agenda, cada uma com suas gravações.
  function gravacoesPorAula(t, ref = hoje()) {
    const todas = aulas(t);
    const porData = new Map();
    todas.filter((a) => a.data < ref).forEach((a) => porData.set(a.data, { aula: a, data: a.data, gravacoes: [] }));
    gravacoes(t).forEach((g) => {
      if (!porData.has(g.data)) porData.set(g.data, { aula: todas.find((a) => a.data === g.data) ?? null, data: g.data, gravacoes: [] });
      porData.get(g.data).gravacoes.push(g);
    });
    return [...porData.values()].sort((a, b) => b.data.localeCompare(a.data));
  }

  function novoIdGravacao(t) {
    let n = (t.gravacoes ?? []).length + 1;
    while ((t.gravacoes ?? []).some((g) => g.id === `g${n}`)) n += 1;
    return `g${n}`;
  }

  function validarGravacao(dados) {
    const erros = [];
    const url = String(dados.url ?? '').trim();
    if (!ehData(dados.data)) erros.push({ campo: 'data', mensagem: 'Escolha a aula gravada.' });
    if (!String(dados.titulo ?? '').trim()) erros.push({ campo: 'titulo', mensagem: 'Dê um nome à gravação (ex.: Parte 1).' });
    if (!url) erros.push({ campo: 'url', mensagem: 'Cole o link da gravação (Google Drive).' });
    else if (!urlValida(url)) erros.push({ campo: 'url', mensagem: 'Informe o endereço completo, começando com https://.' });
    const dur = String(dados.duracaoMin ?? '').trim();
    if (dur && (!Number.isInteger(Number(dur)) || Number(dur) < 1)) erros.push({ campo: 'duracaoMin', mensagem: 'Duração em minutos inteiros (≥ 1).' });
    return erros;
  }

  function limparGravacao(dados) {
    const dur = String(dados.duracaoMin ?? '').trim();
    return {
      data: dados.data,
      titulo: String(dados.titulo).trim(),
      url: String(dados.url).trim(),
      duracaoMin: dur ? Number(dur) : null,
      observacoes: String(dados.observacoes ?? '').trim(),
    };
  }

  const comGravacoes = (lista, id, fn) => lista.map((t) => (t.id === id ? { ...t, gravacoes: fn(t) } : t));
  const incluirGravacao = (lista, id, dados) => comGravacoes(lista, id, (t) => [...(t.gravacoes ?? []), { id: novoIdGravacao(t), ...limparGravacao(dados) }]);
  const atualizarGravacao = (lista, id, gId, dados) => comGravacoes(lista, id, (t) => (t.gravacoes ?? []).map((g) => (g.id === gId ? { ...g, ...limparGravacao(dados) } : g)));
  const removerGravacao = (lista, id, gId) => comGravacoes(lista, id, (t) => (t.gravacoes ?? []).filter((g) => g.id !== gId));

  // Duração em "1h 30min".
  function duracaoTexto(min) {
    if (!min) return '';
    const h = Math.floor(min / 60); const m = min % 60;
    return [h ? `${h}h` : '', m ? `${m}min` : ''].filter(Boolean).join(' ');
  }

  // ---------- Requisitos de software e máquina (RN10) ----------
  // O CURSO define, no catálogo, o que as aulas exigem (curso.infraestrutura). A TURMA
  // nasce com uma CÓPIA disso e segue por conta própria: cada edição tem sua sala, suas
  // máquinas e o que o instrutor decidiu usar. Quem mexe é a coordenação (turma.html) ou
  // o próprio instrutor (Portal do Professor) — e o suporte usa esta lista na instalação.
  // Item: { softwareId (id do catálogo ou null quando é "fora do catálogo"), nome, observacao, site, origem: 'curso'|'turma', por }.
  // `site` (onde baixar) só existe em item fora do catálogo; o do catálogo usa o de SOFTWARES_CATALOGO.
  // `t.requisitos` só existe depois da cópia: turmas da semente antiga leem o curso enquanto ninguém mexe.

  const cursoDe = (cursoId) => (typeof Cursos !== 'undefined' ? Cursos.porId(Cursos.carregar(), cursoId) : null);
  const chaveSoftware = (item) => Cursos.chaveSoftware(item);

  // Cópia dos requisitos do catálogo do curso, já marcada como vinda dele.
  function requisitosDoCurso(curso) {
    const infra = curso?.infraestrutura ?? { softwares: [], requisitosMaquina: '' };
    return {
      softwares: (infra.softwares ?? []).map((s) => ({ softwareId: s.softwareId ?? null, nome: String(s.nome ?? '').trim(), observacao: String(s.observacao ?? '').trim(), site: String(s.site ?? '').trim(), origem: 'curso', por: '' })),
      requisitosMaquina: String(infra.requisitosMaquina ?? '').trim(),
    };
  }

  const novosRequisitos = (curso) => ({ ...requisitosDoCurso(curso), copiadoEm: hoje(), atualizadoEm: null, atualizadoPor: '' });

  // Requisitos em vigor da turma. `herdado` = ainda são os do curso, ninguém mexeu nesta turma.
  function requisitos(t, curso = null) {
    const c = curso ?? cursoDe(t.cursoId);
    const base = t.requisitos
      ? { ...t.requisitos, softwares: (t.requisitos.softwares ?? []).map((s) => ({ ...s })), herdado: false }
      : { ...requisitosDoCurso(c), copiadoEm: null, atualizadoEm: null, atualizadoPor: '', herdado: true };
    base.softwares.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    return base;
  }

  // O que mudou em relação ao curso hoje — a turma não acompanha o catálogo depois de criada.
  function comparacaoRequisitos(t, curso = null) {
    const c = curso ?? cursoDe(t.cursoId);
    const daTurma = requisitos(t, c);
    const doCurso = requisitosDoCurso(c);
    const naTurma = new Set(daTurma.softwares.map(chaveSoftware));
    const noCurso = new Set(doCurso.softwares.map(chaveSoftware));
    const faltando = doCurso.softwares.filter((s) => !naTurma.has(chaveSoftware(s)));
    const extras = daTurma.softwares.filter((s) => !noCurso.has(chaveSoftware(s)));
    const maquinaDiferente = daTurma.requisitosMaquina !== doCurso.requisitosMaquina;
    return { faltando, extras, maquinaDiferente, igual: !faltando.length && !extras.length && !maquinaDiferente };
  }

  // Aplica `fn` sobre os requisitos em vigor, materializando a cópia na primeira mexida.
  function comRequisitos(lista, id, fn, { curso = null, autor = '' } = {}) {
    return lista.map((t) => {
      if (t.id !== id) return t;
      const atual = requisitos(t, curso);
      const novo = fn({ softwares: atual.softwares.map((s) => ({ ...s })), requisitosMaquina: atual.requisitosMaquina });
      return {
        ...t,
        requisitos: {
          softwares: novo.softwares,
          requisitosMaquina: String(novo.requisitosMaquina ?? '').trim(),
          copiadoEm: t.requisitos?.copiadoEm ?? hoje(),
          atualizadoEm: hoje(),
          atualizadoPor: String(autor ?? '').trim(),
        },
      };
    });
  }

  function adicionarSoftwaresRequisitos(lista, id, softwareIds, opts = {}) {
    return comRequisitos(lista, id, (r) => {
      const ja = new Set(r.softwares.map(chaveSoftware));
      const novos = softwareIds
        .map((sid) => (typeof softwareDoCatalogo === 'function' ? softwareDoCatalogo(sid) : null))
        .filter(Boolean)
        .map((s) => ({ softwareId: s.id, nome: s.nome, observacao: '', site: '', origem: 'turma', por: String(opts.autor ?? '') }))
        .filter((s) => !ja.has(chaveSoftware(s)));
      return { ...r, softwares: [...r.softwares, ...novos] };
    }, opts);
  }

  function validarSoftwareLivreRequisito(dados, atuais) {
    const nome = String(dados.nome ?? '').trim();
    if (!nome) return [{ campo: 'nome', mensagem: 'Informe o nome do software.' }];
    if (nome.length > 80) return [{ campo: 'nome', mensagem: 'Use até 80 caracteres.' }];
    if (atuais.some((s) => normalizar(s.nome) === normalizar(nome))) return [{ campo: 'nome', mensagem: 'Este software já está na lista da turma.' }];
    return Cursos.validarSite(dados.site);
  }

  function adicionarSoftwareLivreRequisito(lista, id, dados, opts = {}) {
    return comRequisitos(lista, id, (r) => ({
      ...r,
      softwares: [...r.softwares, { softwareId: null, nome: String(dados.nome).trim(), observacao: String(dados.observacao ?? '').trim(), site: String(dados.site ?? '').trim(), origem: 'turma', por: String(opts.autor ?? '') }],
    }), opts);
  }

  const removerSoftwareRequisito = (lista, id, chave, opts = {}) => comRequisitos(lista, id, (r) => ({ ...r, softwares: r.softwares.filter((s) => chaveSoftware(s) !== chave) }), opts);

  // `site` só chega quando o item é fora do catálogo (o do catálogo tem o site do próprio catálogo).
  const atualizarObservacaoRequisito = (lista, id, chave, observacao, opts = {}) => comRequisitos(lista, id, (r) => ({
    ...r,
    softwares: r.softwares.map((s) => (chaveSoftware(s) === chave
      ? { ...s, observacao: String(observacao ?? '').trim(), ...(opts.site === undefined ? {} : { site: String(opts.site ?? '').trim() }) }
      : s)),
  }), opts);

  const definirRequisitosMaquina = (lista, id, texto, opts = {}) => comRequisitos(lista, id, (r) => ({ ...r, requisitosMaquina: String(texto ?? '') }), opts);

  // Volta a lista da turma para a do curso — descarta os ajustes desta edição.
  function recarregarRequisitosDoCurso(lista, id, curso = null, autor = '') {
    return lista.map((t) => (t.id === id
      ? { ...t, requisitos: { ...requisitosDoCurso(curso ?? cursoDe(t.cursoId)), copiadoEm: hoje(), atualizadoEm: hoje(), atualizadoPor: String(autor ?? '').trim() } }
      : t));
  }

  // ---------- CRUD ----------

  function limpar(dados) {
    const formacaoId = dados.formacaoId || null;
    const agenda = formacaoId ? null : Agenda.normalizar(dados.agenda ?? Agenda.vazia());
    const emVigor = formacaoId ? formacaoDe(formacaoId)?.agenda ?? null : agenda;
    return {
      codigo: String(dados.codigo).trim().toUpperCase(),
      cursoId: dados.cursoId,
      formacaoId,
      edicao: formacaoId, // alias lido pelas telas de contratos/formações
      tipo: tipoDe({ ...dados, formacaoId }),
      instrutorId: dados.instrutorId || null,
      salaId: dados.salaId || null,
      agenda,
      formato: emVigor?.formato ?? null,
      turno: Agenda.descrever(emVigor),
      inicio: dados.inicio,
      fim: dados.fim,
      vagas: numero(dados.vagas),
      observacoes: String(dados.observacoes ?? '').trim(),
      meetLink: String(dados.meetLink ?? '').trim() || null,
      // Centro de receita padrão (js/centros-receita.js), herdado pela venda da turma. Ausente = não mexe.
      ...(dados.centroReceitaId !== undefined ? { centroReceitaId: dados.centroReceitaId || null } : {}),
      // Requisitos não passam pelo formulário da turma: só entram quando quem chama manda (criação).
      ...(dados.requisitos !== undefined ? { requisitos: dados.requisitos } : {}),
      // Template de certificado só para turma avulsa (formação usa o da formação). Ausente = herda do curso.
      ...(dados.templateId !== undefined ? { certificado: { templateId: formacaoId ? null : (dados.templateId || null) } } : {}),
      ...(dados.status ? { status: dados.status } : {}),
    };
  }

  // Toda turma nasce com a cópia dos requisitos do curso (RN10) — inclusive as criadas na formação.
  function incluir(lista, dados) {
    const base = { id: novoId(lista), status: 'planejada', ...limpar(dados) };
    const turma = { ...base, requisitos: base.requisitos ?? novosRequisitos(cursoDe(dados.cursoId)) };
    return { lista: [...lista, turma], turma };
  }

  function atualizar(lista, id, dados) {
    return lista.map((t) => (t.id === id ? { ...t, ...limpar(dados) } : t));
  }

  function alterarStatus(lista, id, status) {
    return lista.map((t) => (t.id === id ? { ...t, status } : t));
  }

  function remover(lista, id) {
    return lista.filter((t) => t.id !== id);
  }

  // RN5: só sem matrículas (qualquer status — histórico).
  function podeExcluir(t) {
    const m = matriculas(t);
    return !m || m.total === 0;
  }

  return {
    CHAVE, SITUACOES, SITUACAO_RISCO, RISCO, NIVEIS_RISCO,
    carregar, salvar, porId, normalizar, hoje, agendaDe, aulas, aulasAgendadas, temAgendamento, salvarAulas, horasAula, horasAulas, situacao, situacaoDe,
    podeEditar, podeConfirmar, podeCancelar, podeReabrir, podeExcluir,
    turmasDoCurso, turmasDoCursoNaFormacao, turmasDaFormacao, matriculas, invalidarMatriculas, filtrar, contagem, risco, turmasEmRisco, resumoRisco,
    sugerirCodigo, validar, pendencias,
    incluir, atualizar, alterarStatus, remover,
    ehMeet, gravacoes, gravacoesPorAula, validarGravacao, incluirGravacao, atualizarGravacao, removerGravacao, duracaoTexto,
    chaveSoftware, requisitos, requisitosDoCurso, comparacaoRequisitos, recarregarRequisitosDoCurso,
    adicionarSoftwaresRequisitos, validarSoftwareLivreRequisito, adicionarSoftwareLivreRequisito,
    removerSoftwareRequisito, atualizarObservacaoRequisito, definirRequisitosMaquina,
  };
})();
