// ============================================================
// Motor da tela "Formações": regras puras (sem DOM).
// Depende de Cursos.* (js/cursos-motor.js) para resolver os cursos.
// Persistência em localStorage — trocar o sufixo da chave força reset.
// ============================================================

const Formacoes = (() => {
  const CHAVE = 'aulor-v1-formacoes-v8'; // v8 (28/10/2026): área em texto livre e sem eixo

  function clonar(x) {
    return JSON.parse(JSON.stringify(x));
  }

  function carregar() {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) return JSON.parse(salvo);
    } catch (_) { /* volta para a semente */ }
    return clonar(FORMACOES_SEED);
  }

  function salvar(lista) {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  }

  const normalizar = (t) => Cursos.normalizar(t);
  const numero = (v) => Cursos.numero(v);

  function novoId(lista) {
    let n = lista.length + 1;
    while (lista.some((x) => x.id === `f${n}`)) n += 1;
    return `f${n}`;
  }

  function porId(lista, id) {
    return lista.find((f) => f.id === id) ?? null;
  }

  // ---------- Cursos da formação ----------

  // Itens resolvidos na ordem da formação; cursos que sumiram do catálogo são ignorados.
  // `horas` = carga horária do item na formação: a sobrescrita (item.cargaHoraria) ou a do catálogo.
  function cursosDe(formacao, cursos) {
    return formacao.itens
      .map((i) => ({ ...i, curso: Cursos.porId(cursos, i.cursoId) }))
      .filter((i) => i.curso)
      .map((i) => ({ ...i, horas: horasItem(i, i.curso) }));
  }

  const horasItem = (item, curso) => (item.cargaHoraria != null ? Number(item.cargaHoraria) : Number(curso?.cargaHoraria) || 0);
  const somaHoras = (itens) => itens.reduce((s, i) => s + (Number(i.horas) || 0), 0);

  // Totalizadores: geral e por obrigatoriedade.
  function totais(formacao, cursos) {
    const itens = cursosDe(formacao, cursos);
    const soma = somaHoras;
    const total = soma(itens);
    return {
      n: itens.length,
      obrigatorios: itens.filter((i) => i.obrigatorio).length,
      optativos: itens.filter((i) => !i.obrigatorio).length,
      horas: total,
      horasObrigatorias: soma(itens.filter((i) => i.obrigatorio)),
      horasOptativas: soma(itens.filter((i) => !i.obrigatorio)),
      formatosComuns: FORMATOS.filter((f) => itens.length && itens.every((i) => i.curso.formatos.includes(f.id))).map((f) => f.id),
      somaPrecos: itens.reduce((s, i) => s + (i.curso.comercial.precoReferencia ?? 0), 0),
      semPreco: itens.filter((i) => i.curso.comercial.precoReferencia == null).length,
    };
  }

  const temAgenda = (f) => Boolean(f?.agenda?.periodos?.length && f.agenda.formato);

  function pendencias(formacao, cursos) {
    const p = [];
    const itens = cursosDe(formacao, cursos);
    if (!itens.length) p.push('Sem cursos');
    if (!formacao.descricao.trim()) p.push('Descrição');
    if (!temAgenda(formacao)) p.push('Agenda das aulas');
    const naoAtivos = itens.filter((i) => i.curso.status !== 'ativo');
    if (naoAtivos.length) p.push(`${naoAtivos.length === 1 ? 'Curso' : 'Cursos'} não ativo${naoAtivos.length === 1 ? '' : 's'}: ${naoAtivos.map((i) => i.curso.codigo).join(', ')}`);
    if (itens.length && !itens.some((i) => i.obrigatorio)) p.push('Nenhum curso obrigatório');
    if (formacao.comercial.precoReferencia == null) p.push('Preço de referência');
    return p;
  }

  // ---------- Lista ----------

  function filtrar(lista, cursos, { busca = '', status = '', area = '' } = {}) {
    const termo = normalizar(busca);
    return lista
      .filter((f) => !termo || normalizar(`${f.codigo} ${f.nome} ${f.resumo}`).includes(termo))
      .filter((f) => !status || f.status === status)
      .filter((f) => !area || normalizar(f.area) === normalizar(area))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  // ---------- Validações ----------

  function validarDados(dados, lista, idAtual = null) {
    const erros = [];
    const outros = lista.filter((f) => f.id !== idAtual);
    const codigo = String(dados.codigo ?? '').trim();
    const nome = String(dados.nome ?? '').trim();
    if (!codigo) erros.push({ campo: 'codigo', mensagem: 'Informe o código da formação.' });
    else if (!/^[A-Za-z0-9-]{2,10}$/.test(codigo)) erros.push({ campo: 'codigo', mensagem: 'Use de 2 a 10 letras/números, sem espaços.' });
    else if (outros.some((f) => normalizar(f.codigo) === normalizar(codigo))) erros.push({ campo: 'codigo', mensagem: 'Já existe uma formação com esse código.' });
    if (!nome) erros.push({ campo: 'nome', mensagem: 'Informe o nome da formação.' });
    else if (outros.some((f) => normalizar(f.nome) === normalizar(nome))) erros.push({ campo: 'nome', mensagem: 'Já existe uma formação com esse nome.' });
    if (dados.status && !STATUS_FORMACAO.some((s) => s.id === dados.status)) erros.push({ campo: 'status', mensagem: 'Status inválido.' });
    return erros;
  }

  function validarCertificado(dados, formacao) {
    const erros = [];
    if (!dados.emite) return erros;
    const min = numero(dados.minimoOptativos);
    const optativos = formacao.itens.filter((i) => !i.obrigatorio).length;
    if (min == null || Number.isNaN(min) || min < 0 || !Number.isInteger(min)) erros.push({ campo: 'minimoOptativos', mensagem: 'Número inteiro (≥ 0).' });
    else if (min > optativos) erros.push({ campo: 'minimoOptativos', mensagem: `A formação tem só ${optativos} optativo${optativos === 1 ? '' : 's'}.` });
    return erros;
  }

  function validarComercial(dados) {
    const erros = [];
    const preco = numero(dados.precoReferencia);
    if (preco != null && (Number.isNaN(preco) || preco < 0)) erros.push({ campo: 'precoReferencia', mensagem: 'Preço inválido.' });
    const parc = numero(dados.parcelasMax);
    if (parc != null && (Number.isNaN(parc) || parc < 1 || !Number.isInteger(parc))) erros.push({ campo: 'parcelasMax', mensagem: 'Número inteiro de parcelas (≥ 1).' });
    return erros;
  }

  // ---------- CRUD ----------

  function limparDados(dados) {
    return {
      codigo: String(dados.codigo).trim().toUpperCase(),
      nome: String(dados.nome).trim(),
      area: String(dados.area ?? '').trim(),
      resumo: String(dados.resumo ?? '').trim(),
      descricao: String(dados.descricao ?? '').trim(),
      publicoAlvo: String(dados.publicoAlvo ?? '').trim(),
      ...(dados.status ? { status: dados.status } : {}),
    };
  }

  // `templateId` (template de certificado) vem junto dos dados básicos: undefined = não mexer; '' ou null = padrão do tipo.
  const comTemplate = (f, dados) => (dados.templateId === undefined ? f : { ...f, certificado: { ...f.certificado, templateId: dados.templateId || null } });

  function incluir(lista, dados) {
    const formacao = comTemplate(formacaoSeed({ id: novoId(lista), status: 'rascunho', ...limparDados(dados) }), dados);
    return { lista: [...lista, formacao], formacao };
  }

  function atualizar(lista, id, patch) {
    return lista.map((f) => (f.id === id ? { ...f, ...patch } : f));
  }

  function atualizarDados(lista, id, dados) {
    return lista.map((f) => (f.id === id ? comTemplate({ ...f, ...limparDados(dados) }, dados) : f));
  }

  function remover(lista, id) {
    return lista.filter((f) => f.id !== id);
  }

  function nomeDeCopia(lista, nome) {
    const base = `Cópia de ${nome}`;
    if (!lista.some((f) => normalizar(f.nome) === normalizar(base))) return base;
    let n = 2;
    while (lista.some((f) => normalizar(f.nome) === normalizar(`${base} (${n})`))) n += 1;
    return `${base} (${n})`;
  }

  function codigoDeCopia(lista, codigo) {
    let n = 2;
    const raiz = codigo.replace(/-\d+$/, '').slice(0, 7);
    while (lista.some((f) => normalizar(f.codigo) === normalizar(`${raiz}-${n}`))) n += 1;
    return `${raiz}-${n}`;
  }

  function duplicar(lista, origemId, { codigo, nome }) {
    const copia = clonar(porId(lista, origemId));
    copia.id = novoId(lista);
    copia.codigo = String(codigo).trim().toUpperCase();
    copia.nome = String(nome).trim();
    copia.status = 'rascunho';
    copia.comercial.publicadoSite = false;
    return { lista: [...lista, copia], formacao: copia };
  }

  function alterarStatus(lista, id, status) {
    const f = porId(lista, id);
    return atualizar(lista, id, { status, ...(status === 'inativo' ? { comercial: { ...f.comercial, publicadoSite: false } } : {}) });
  }

  function atualizarCertificado(lista, id, dados) {
    return atualizar(lista, id, {
      certificado: {
        emite: Boolean(dados.emite),
        exigeTodosObrigatorios: Boolean(dados.emite && dados.exigeTodosObrigatorios),
        minimoOptativos: dados.emite ? (numero(dados.minimoOptativos) ?? 0) : 0,
        templateId: dados.emite ? (dados.templateId || null) : null, // null = template padrão de formação
      },
    });
  }

  // Agenda das aulas (dias, horários, recorrência, formato) — as turmas da formação herdam.
  const validarAgenda = (agenda) => Agenda.validar(agenda);

  function atualizarAgenda(lista, id, agenda) {
    return atualizar(lista, id, { agenda: Agenda.normalizar(agenda) });
  }

  function atualizarComercial(lista, id, dados) {
    return atualizar(lista, id, {
      comercial: { precoReferencia: numero(dados.precoReferencia), parcelasMax: numero(dados.parcelasMax), publicadoSite: Boolean(dados.publicadoSite) },
    });
  }

  // ---------- Cursos na formação ----------

  // RN10: a sequência de cursos só muda em rascunho. Ativa tem turmas/alunos; inativa está encerrada.
  const podeEditarCursos = (f) => Boolean(f) && f.status === 'rascunho';

  function adicionarCursos(lista, id, cursoIds, obrigatorio = true) {
    const f = porId(lista, id);
    if (!podeEditarCursos(f)) return lista;
    const novos = cursoIds.filter((c) => !f.itens.some((i) => i.cursoId === c)).map((cursoId) => ({ cursoId, obrigatorio }));
    return atualizar(lista, id, { itens: [...f.itens, ...novos] });
  }

  function removerCurso(lista, id, cursoId) {
    const f = porId(lista, id);
    if (!podeEditarCursos(f)) return lista;
    return atualizar(lista, id, { itens: f.itens.filter((i) => i.cursoId !== cursoId) });
  }

  // Carga horária do curso só nesta formação (não mexe no catálogo). null/'' volta a usar a do curso.
  function validarCargaHoraria(valor) {
    if (valor == null || String(valor).trim() === '') return [];
    const n = Number(String(valor).replace(',', '.'));
    if (Number.isNaN(n) || n <= 0) return [{ campo: 'cargaHoraria', mensagem: 'Carga horária deve ser maior que zero (ou vazia para usar a do curso).' }];
    return [];
  }

  function definirCargaHoraria(lista, id, cursoId, valor) {
    const f = porId(lista, id);
    if (!podeEditarCursos(f)) return lista;
    const vazio = valor == null || String(valor).trim() === '';
    const n = vazio ? null : Number(String(valor).replace(',', '.'));
    return atualizar(lista, id, { itens: f.itens.map((i) => {
      if (i.cursoId !== cursoId) return i;
      const { cargaHoraria, ...resto } = i;
      return n == null ? resto : { ...resto, cargaHoraria: n };
    }) });
  }

  function alternarObrigatorio(lista, id, cursoId) {
    const f = porId(lista, id);
    if (!podeEditarCursos(f)) return lista;
    return atualizar(lista, id, { itens: f.itens.map((i) => (i.cursoId === cursoId ? { ...i, obrigatorio: !i.obrigatorio } : i)) });
  }

  function moverCurso(lista, id, cursoId, delta) {
    const f = porId(lista, id);
    if (!podeEditarCursos(f)) return lista;
    const itens = [...f.itens];
    const i = itens.findIndex((x) => x.cursoId === cursoId);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= itens.length) return lista;
    [itens[i], itens[j]] = [itens[j], itens[i]];
    return atualizar(lista, id, { itens });
  }

  // Arrastar e soltar: leva o curso para a posição `destino` (índice na sequência). Mesma regra RN10 do moverCurso.
  function reordenarCurso(lista, id, cursoId, destino) {
    const f = porId(lista, id);
    if (!podeEditarCursos(f)) return lista;
    const itens = [...f.itens];
    const i = itens.findIndex((x) => x.cursoId === cursoId);
    const j = Math.max(0, Math.min(itens.length - 1, Number(destino)));
    if (i < 0 || Number.isNaN(j) || i === j) return lista;
    const [item] = itens.splice(i, 1);
    itens.splice(j, 0, item);
    return atualizar(lista, id, { itens });
  }

  // ---------- Alunos da formação (via contratos) ----------

  // Só funciona quando a página carregou Clientes/Contratos (formacao.html carrega).
  // Uma linha por aluno × contrato de venda desta formação, com a edição (turmas dos itens),
  // o responsável financeiro, a situação de cobrança e o progresso nas matrículas.
  function alunosDaFormacao(formacaoId, cursos) {
    if (typeof Contratos === 'undefined' || typeof Clientes === 'undefined') return [];
    const dados = Clientes.carregar();
    const ctx = { empresas: dados.empresas, alunos: dados.alunos, responsaveis: dados.responsaveis ?? [], cursos, formacoes: carregar() };
    const hoje = Contratos.hoje();
    const linhas = [];
    Contratos.carregar().forEach((c) => {
      // Desde a chave contratos v7 os itens ficam no vínculo do aluno: só entram alunos aprovados (ou desistentes) com itens desta formação.
      const itensC = Contratos.itensMatriculados(c);
      const alunosNaFormacao = [...new Set(itensC.filter((it) => it.formacaoId === formacaoId).map((it) => it.alunoId))];
      if (!alunosNaFormacao.length) return;
      const responsavel = Contratos.responsavelFinanceiro(ctx, c);
      const situacao = Contratos.situacaoCobranca(c);
      alunosNaFormacao.forEach((alunoId) => {
        const aluno = Contratos.porId(ctx.alunos, alunoId);
        const ms = itensC.filter((m) => m.alunoId === alunoId && m.formacaoId === formacaoId);
        const edicaoId = ms.map((it) => Contratos.turmaDe(it.turmaId)).find((t) => t?.edicao)?.edicao ?? null;
        const edicao = edicaoId && typeof EDICOES !== 'undefined' ? EDICOES[edicaoId] : null;
        const conta = (s) => ms.filter((m) => m.status === s).length;
        const progresso = { total: ms.length, concluidas: conta('concluido'), ativas: conta('matriculado'), congeladas: conta('congelada'), desistiu: conta('desistiu'), canceladas: conta('cancelada') };
        let situacaoAluno = 'cursando';
        if (c.status === 'cancelado' || (ms.length && progresso.canceladas === ms.length)) situacaoAluno = 'cancelada';
        else if (progresso.desistiu) situacaoAluno = 'desistiu';
        else if (ms.length && progresso.concluidas === ms.length) situacaoAluno = 'concluido';
        else if (progresso.congeladas && !progresso.ativas) situacaoAluno = 'congelada';
        // Curso em andamento (turma cobrindo hoje) ou o próximo a começar.
        const itensAtivos = ms.filter((m) => m.status === 'matriculado').map((m) => ({ item: m, turma: Contratos.turmaDe(m.turmaId) }));
        const emCurso = itensAtivos.find((x) => x.turma && x.turma.inicio <= hoje && x.turma.fim >= hoje) ?? itensAtivos.filter((x) => x.turma && x.turma.inicio > hoje).sort((a, b) => a.turma.inicio.localeCompare(b.turma.inicio))[0] ?? null;
        const cursoAtual = emCurso ? { curso: Cursos.porId(cursos, emCurso.item.cursoId), turma: emCurso.turma, futuro: emCurso.turma.inicio > hoje } : null;
        const valor = Contratos.arred(ms.reduce((s, m) => s + Contratos.valorMatricula(c, m), 0));
        const codigoMatricula = ms[0]?.codigo ?? '';
        linhas.push({ contrato: c, aluno, alunoId, codigoMatricula, responsavel, situacao, edicao, edicaoId, progresso, situacaoAluno, cursoAtual, valor });
      });
    });
    return linhas.sort((a, b) => (b.edicao?.inicio ?? '').localeCompare(a.edicao?.inicio ?? '') || (a.aluno?.nome ?? '').localeCompare(b.aluno?.nome ?? '', 'pt-BR'));
  }

  // Edições presentes nas linhas (para o filtro), da mais recente para a mais antiga.
  function edicoesDe(linhas) {
    const mapa = new Map();
    linhas.forEach((l) => { const k = l.edicaoId ?? '__sem'; if (!mapa.has(k)) mapa.set(k, l.edicao ?? { id: '__sem', nome: 'Turma a definir', periodo: '', inicio: '' }); });
    return [...mapa.values()].sort((a, b) => (b.inicio ?? '').localeCompare(a.inicio ?? ''));
  }

  function filtrarAlunos(linhas, { busca = '', edicaoId = '', situacaoAluno = '' } = {}) {
    const termo = normalizar(busca);
    return linhas
      .filter((l) => !termo || normalizar(`${l.aluno?.nome ?? ''} ${l.codigoMatricula} ${l.contrato.codigo} ${l.responsavel?.nome ?? ''}`).includes(termo))
      .filter((l) => !edicaoId || (l.edicaoId ?? '__sem') === edicaoId)
      .filter((l) => !situacaoAluno || l.situacaoAluno === situacaoAluno);
  }

  return {
    carregar, salvar, porId, normalizar,
    cursosDe, totais, pendencias, filtrar,
    alunosDaFormacao, edicoesDe, filtrarAlunos,
    validarDados, validarCertificado, validarComercial,
    incluir, atualizarDados, remover, nomeDeCopia, codigoDeCopia, duplicar, alterarStatus,
    atualizarCertificado, atualizarComercial, validarAgenda, temAgenda, atualizarAgenda,
    podeEditarCursos, adicionarCursos, removerCurso, alternarObrigatorio, moverCurso, reordenarCurso, horasItem, somaHoras, validarCargaHoraria, definirCargaHoraria,
  };
})();
