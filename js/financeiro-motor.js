// ============================================================
// Motor financeiro — receita, custo e resultado por turma, consolidados
// por curso, formação, área, tipo de turma e contratante (B2B × B2C).
//
// Fontes (todas já existentes no protótipo):
// - Receita: itens dos contratos (Contratos). Cada aluno ocupando vaga
//   (aprovado ou aguardando conferência) com matrícula ativa vale o seu
//   valorFinal; vagas vendidas e ainda vazias valem o valor do molde do
//   pacote. Contratos cancelados e rascunhos ficam de fora.
// - Recebido: parcelas pagas do contrato, rateadas pelos itens.
// - Custo do instrutor: item do contrato do instrutor para a turma; sem
//   contrato, a tabela de valor-hora dele; sem nada, estimativa.
// - Material, coffee, outros e alíquota de imposto: lançados por turma
//   (chave própria no localStorage, semente em financeiro-data.js).
//
// Depende de: Cursos, Formacoes, Contratos, Clientes (ctx dos contratos),
// opcionalmente Turmas, Instrutores, Areas.
// ============================================================

const Financeiro = (() => {
  const CHAVE = 'prototipo-financeiro-custos-v2';

  const arred = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const soma = (xs, f) => arred(xs.reduce((s, x) => s + (Number(f(x)) || 0), 0));
  const hoje = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10); // data local do navegador
  const fmtMoeda = (n) => (n == null ? '—' : Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }));
  const fmtMoedaCentavos = (n) => (n == null ? '—' : Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
  // R$ 12,3 mil / R$ 1,2 mi — para tiles e eixos.
  const fmtCompacto = (n) => {
    const v = Number(n) || 0; const abs = Math.abs(v); const sinal = v < 0 ? '-' : '';
    if (abs >= 1e6) return `${sinal}R$ ${(abs / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mi`;
    if (abs >= 1e3) return `${sinal}R$ ${(abs / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: abs >= 1e5 ? 0 : 1 })} mil`;
    return `${sinal}R$ ${abs.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
  };
  const fmtPct = (p) => (p == null ? '—' : `${Number(p).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`);
  const pct = (parte, todo) => (todo ? arred((parte / todo) * 100) : null);

  // ---------- Custos lançados por turma ----------

  function carregarCustos(turmas, cursos) {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) return JSON.parse(salvo);
    } catch (_) { /* semente */ }
    return typeof gerarCustosTurmaSeed === 'function' ? gerarCustosTurmaSeed(turmas, cursos) : {};
  }
  function salvarCustos(mapa) {
    localStorage.setItem(CHAVE, JSON.stringify(mapa));
  }
  const custosVazios = () => ({ material: 0, coffee: 0, outros: 0, impostoPct: (typeof FINANCEIRO_PARAMETROS !== 'undefined' ? FINANCEIRO_PARAMETROS.impostoPct : 34), observacao: '' });
  const custosDe = (mapa, turmaId) => ({ ...custosVazios(), ...(mapa?.[turmaId] ?? {}) });

  function validarCustos(dados) {
    const erros = [];
    ['material', 'coffee', 'outros'].forEach((k) => {
      const v = dados[k];
      if (v === '' || v == null) return;
      if (Number.isNaN(Number(v)) || Number(v) < 0) erros.push({ campo: k, mensagem: 'Informe um valor igual ou maior que zero.' });
    });
    const imp = Number(dados.impostoPct);
    if (dados.impostoPct === '' || dados.impostoPct == null || Number.isNaN(imp) || imp < 0 || imp > 100) erros.push({ campo: 'impostoPct', mensagem: 'Alíquota entre 0 e 100.' });
    return erros;
  }
  function definirCustos(mapa, turmaId, dados) {
    return {
      ...mapa,
      [turmaId]: {
        material: arred(dados.material), coffee: arred(dados.coffee), outros: arred(dados.outros),
        impostoPct: arred(dados.impostoPct), observacao: String(dados.observacao ?? '').trim(),
      },
    };
  }

  // ---------- Contexto ----------

  function contexto() {
    const cursos = Cursos.carregar();
    const turmas = typeof Turmas !== 'undefined' ? Turmas.carregar() : Cursos.todasTurmas();
    const formacoes = Formacoes.carregar();
    const clientes = Clientes.carregar();
    const ctxContratos = { empresas: clientes.empresas, alunos: clientes.alunos, responsaveis: clientes.responsaveis ?? [], cursos, formacoes };
    const contratos = Contratos.carregar();
    const instrutores = typeof Instrutores !== 'undefined' ? Instrutores.carregar() : [];
    const areas = typeof Areas !== 'undefined' ? Areas.carregar() : [];
    const custos = carregarCustos(turmas, cursos);
    return { cursos, turmas, formacoes, clientes, ctxContratos, contratos, instrutores, areas, custos };
  }

  const porId = (lista, id) => lista.find((x) => x.id === id) ?? null;

  // ---------- Receita: itens dos contratos ----------

  // Um item de receita por (contrato × aluno × curso/turma) ou por vaga vendida vazia.
  function itensReceita(ctx) {
    const itens = [];
    ctx.contratos.forEach((c) => {
      if (c.status === 'cancelado' || c.status === 'rascunho') return;
      const t = Contratos.totais(c);
      const fracaoPaga = t.final > 0 ? Math.min(1, t.pago / t.final) : 0;
      const empresa = c.contratante === 'empresa' ? porId(ctx.clientes.empresas, c.empresaId) : null;
      const base = {
        contratoId: c.id, codigo: c.codigo, criadoEm: c.criadoEm.slice(0, 10), vendedorId: c.vendedorId,
        segmento: c.contratante === 'empresa' ? 'b2b' : 'b2c', empresaId: empresa?.id ?? null, empresaNome: empresa?.nomeFantasia ?? empresa?.razaoSocial ?? null,
        status: c.status, situacaoCobranca: Contratos.situacaoCobranca(c), fracaoPaga,
      };
      c.alunos.forEach((v) => {
        if (!Contratos.ocupaVaga(v)) return;
        v.itens.forEach((i) => {
          const valor = Contratos.valorMatricula(c, i);
          if (!valor) return;
          itens.push({ ...base, tipo: 'aluno', alunoId: v.alunoId, situacaoVinculo: v.situacao, statusMatricula: i.status, formacaoId: i.formacaoId ?? null, cursoId: i.cursoId, turmaId: i.turmaId ?? null, valor: arred(valor), recebido: arred(valor * fracaoPaga) });
        });
      });
      c.pacotes.forEach((p) => {
        const livres = Contratos.vagasDoPacote(c, p).livres;
        if (!livres) return;
        p.itens.forEach((i) => {
          const valor = arred((Number(i.valorFinal) || 0) * livres);
          if (!valor) return;
          itens.push({ ...base, tipo: 'vaga', alunoId: null, vagas: livres, formacaoId: i.formacaoId ?? null, cursoId: i.cursoId, turmaId: i.turmaId ?? null, valor, recebido: arred(valor * fracaoPaga) });
        });
      });
    });
    return itens;
  }

  // ---------- Custo do instrutor ----------

  function custoInstrutor(ctx, t, curso) {
    const horas = Number(curso?.cargaHoraria) || 0;
    if (!t.instrutorId) return { valor: 0, origem: 'sem_instrutor', horas, valorHora: 0 };
    const i = porId(ctx.instrutores, t.instrutorId);
    if (i) {
      const contrato = (i.contratos ?? []).filter((c) => c.status !== 'cancelado').find((c) => c.itens.some((it) => it.turmaId === t.id));
      const item = contrato?.itens.find((it) => it.turmaId === t.id);
      if (item) return { valor: arred(item.total), origem: 'contrato', horas: item.horas, valorHora: item.valorHora, contratoCodigo: contrato.codigo };
      // Folha não tem contrato nem tabela: o salário fica fora do sistema e só o custo-hora de referência entra no DRE.
      if (i.remuneracao === 'folha') {
        const ch = Number(i.custoHoraReferencia) || 0;
        return ch ? { valor: arred(horas * ch), origem: 'folha', horas, valorHora: ch } : { valor: 0, origem: 'folha_sem_custo', horas, valorHora: 0 };
      }
      if (typeof Instrutores !== 'undefined' && (i.valoresHora ?? []).length) {
        const est = Instrutores.itemDeTurma(i, t.id);
        return { valor: arred(est.total), origem: 'tabela', horas: est.horas, valorHora: est.valorHora };
      }
    }
    const vh = typeof FINANCEIRO_PARAMETROS !== 'undefined' ? FINANCEIRO_PARAMETROS.valorHoraEstimado : 100;
    return { valor: arred(horas * vh), origem: 'estimado', horas, valorHora: vh };
  }
  const ORIGENS_INSTRUTOR = { contrato: 'contrato do instrutor', tabela: 'tabela de valor-hora (sem contrato)', estimado: 'estimativa (sem tabela)', folha: 'custo-hora de referência (folha)', folha_sem_custo: 'custo de folha não informado', sem_instrutor: 'sem instrutor' };

  // ---------- Linhas por turma ----------

  function linhaTurma(ctx, t, itens) {
    const curso = porId(ctx.cursos, t.cursoId);
    const formacao = t.formacaoId ? porId(ctx.formacoes, t.formacaoId) : null;
    const area = curso?.areaId && ctx.areas.length ? porId(ctx.areas, curso.areaId) : null;
    const meus = itens.filter((i) => i.turmaId === t.id);
    const alunos = meus.filter((i) => i.tipo === 'aluno');
    const receita = soma(meus, (i) => i.valor);
    const recebido = soma(meus, (i) => i.recebido);
    const b2b = soma(meus.filter((i) => i.segmento === 'b2b'), (i) => i.valor);
    const b2c = arred(receita - b2b);
    const instr = custoInstrutor(ctx, t, curso);
    const c = custosDe(ctx.custos, t.id);
    const custos = { instrutor: instr.valor, material: c.material, coffee: c.coffee, outros: c.outros, total: arred(instr.valor + c.material + c.coffee + c.outros) };
    const imposto = arred(receita * (c.impostoPct / 100));
    const resultado = arred(receita - custos.total - imposto);
    const matriculados = alunos.filter((i) => i.statusMatricula === 'matriculado' || i.statusMatricula === 'concluido').length;
    const vagasVendidas = matriculados + meus.filter((i) => i.tipo === 'vaga').reduce((s, i) => s + i.vagas, 0);
    const situacao = typeof Turmas !== 'undefined' ? Turmas.situacao(t) : t.status;
    return {
      turma: t, curso, formacao, area, id: t.id, codigo: t.codigo, nome: curso?.nome ?? 'Curso removido', tipo: t.tipo, situacao,
      ano: t.inicio.slice(0, 4), inicio: t.inicio, fim: t.fim,
      receita, recebido, aberto: arred(receita - recebido), b2b, b2c,
      alunos: matriculados, alunosB2b: alunos.filter((i) => i.segmento === 'b2b').length, vagasVendidas, vagas: Number(t.vagas) || 0,
      ocupacao: pct(vagasVendidas, Number(t.vagas) || 0),
      ticket: matriculados ? arred(soma(alunos, (i) => i.valor) / matriculados) : null,
      custos, instrutor: instr, impostoPct: c.impostoPct, imposto, resultado, margem: receita ? pct(resultado, receita) : null,
      custosLancados: Boolean(ctx.custos?.[t.id]), observacao: c.observacao,
    };
  }

  function linhasTurma(ctx, itens = itensReceita(ctx)) {
    return ctx.turmas.filter((t) => t.status !== 'cancelada').map((t) => linhaTurma(ctx, t, itens)).sort((a, b) => b.inicio.localeCompare(a.inicio));
  }

  // ---------- Filtros ----------

  function anos(linhas) {
    return [...new Set(linhas.map((l) => l.ano))].sort().reverse();
  }
  function filtrar(linhas, { ano = '', formacaoId = '', areaId = '', tipo = '', situacao = '' } = {}) {
    return linhas.filter((l) => (!ano || l.ano === ano)
      && (!formacaoId || (formacaoId === '__avulsa' ? !l.turma.formacaoId : l.turma.formacaoId === formacaoId))
      && (!areaId || l.curso?.areaId === areaId)
      && (!tipo || l.tipo === tipo)
      && (!situacao || l.situacao === situacao));
  }

  // ---------- Consolidação ----------

  function totais(linhas) {
    const receita = soma(linhas, (l) => l.receita);
    const custos = {
      instrutor: soma(linhas, (l) => l.custos.instrutor), material: soma(linhas, (l) => l.custos.material),
      coffee: soma(linhas, (l) => l.custos.coffee), outros: soma(linhas, (l) => l.custos.outros), total: soma(linhas, (l) => l.custos.total),
    };
    const imposto = soma(linhas, (l) => l.imposto);
    const resultado = arred(receita - custos.total - imposto);
    const alunos = linhas.reduce((s, l) => s + l.alunos, 0);
    const vagas = linhas.reduce((s, l) => s + l.vagas, 0);
    const vagasVendidas = linhas.reduce((s, l) => s + l.vagasVendidas, 0);
    return {
      n: linhas.length, receita, recebido: soma(linhas, (l) => l.recebido), aberto: soma(linhas, (l) => l.aberto),
      b2b: soma(linhas, (l) => l.b2b), b2c: soma(linhas, (l) => l.b2c),
      custos, imposto, resultado, margem: receita ? pct(resultado, receita) : null,
      alunos, vagas, vagasVendidas, ocupacao: pct(vagasVendidas, vagas),
      ticket: alunos ? arred(linhas.reduce((s, l) => s + (l.ticket ?? 0) * l.alunos, 0) / alunos) : null,
      custoPorAluno: alunos ? arred((custos.total + imposto) / alunos) : null,
      estimados: linhas.filter((l) => l.instrutor.origem !== 'contrato').length,
    };
  }

  // chave: 'curso' | 'formacao' | 'area' | 'tipo' | 'instrutor'
  function agrupar(linhas, chave) {
    const idDe = {
      curso: (l) => l.curso?.id ?? '__sem', formacao: (l) => l.turma.formacaoId ?? '__avulsa', area: (l) => l.curso?.areaId ?? '__sem',
      tipo: (l) => l.tipo, instrutor: (l) => l.turma.instrutorId ?? '__sem',
    }[chave];
    const nomeDe = {
      curso: (l) => l.nome, formacao: (l) => (l.formacao ? `${l.formacao.codigo} · ${l.formacao.nome}` : 'Avulsas (abertas e in company)'),
      area: (l) => l.area?.nome ?? 'Sem área', tipo: (l) => ({ formacao: 'Formação', aberta: 'Turma aberta', incompany: 'In company' }[l.tipo] ?? l.tipo),
      instrutor: (l) => (typeof INSTRUTORES !== 'undefined' ? INSTRUTORES.find((i) => i.id === l.turma.instrutorId)?.nome : null) ?? 'Sem instrutor',
    }[chave];
    const mapa = new Map();
    linhas.forEach((l) => {
      const id = idDe(l);
      if (!mapa.has(id)) mapa.set(id, { id, nome: nomeDe(l), codigo: chave === 'curso' ? l.curso?.codigo ?? '' : chave === 'formacao' ? l.formacao?.codigo ?? '' : '', linhas: [], ref: chave === 'curso' ? l.curso : chave === 'formacao' ? l.formacao : chave === 'area' ? l.area : null });
      mapa.get(id).linhas.push(l);
    });
    return [...mapa.values()].map((g) => ({ ...g, ...totais(g.linhas) })).sort((a, b) => b.receita - a.receita);
  }

  // ---------- Série mensal ----------

  const mesDe = (iso) => iso.slice(0, 7);
  const rotuloMes = (ym) => { const [a, m] = ym.split('-'); return `${['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][Number(m) - 1]}/${a.slice(2)}`; };
  function mesesEntre(ini, fim) {
    const out = []; let [a, m] = ini.split('-').map(Number); const [af, mf] = fim.split('-').map(Number);
    while (a < af || (a === af && m <= mf)) { out.push(`${a}-${String(m).padStart(2, '0')}`); m += 1; if (m > 12) { m = 1; a += 1; } }
    return out;
  }

  // Competência: receita e custo da turma rateados pelos meses em que ela acontece.
  // Caixa: vendido (contratos criados) e recebido (parcelas pagas) no mês.
  function serieMensal(ctx, linhas, { de = null, ate = null } = {}) {
    if (!linhas.length) return [];
    const ini = de ?? mesDe(linhas.reduce((m, l) => (l.inicio < m ? l.inicio : m), linhas[0].inicio));
    const fim = ate ?? mesDe(linhas.reduce((m, l) => (l.fim > m ? l.fim : m), linhas[0].fim));
    const meses = mesesEntre(ini, fim);
    const acc = Object.fromEntries(meses.map((m) => [m, { mes: m, rotulo: rotuloMes(m), receita: 0, custo: 0, imposto: 0, vendido: 0, recebido: 0 }]));
    linhas.forEach((l) => {
      const ms = mesesEntre(mesDe(l.inicio), mesDe(l.fim)).filter((m) => acc[m]);
      if (!ms.length) return;
      ms.forEach((m) => { acc[m].receita += l.receita / ms.length; acc[m].custo += l.custos.total / ms.length; acc[m].imposto += l.imposto / ms.length; });
    });
    const turmaIds = new Set(linhas.map((l) => l.id));
    ctx.contratos.forEach((c) => {
      if (c.status === 'cancelado' || c.status === 'rascunho') return;
      const t = Contratos.totais(c);
      // Conta o contrato inteiro quando alguma turma dele está no recorte.
      const relevante = c.alunos.some((v) => v.itens.some((i) => turmaIds.has(i.turmaId))) || c.pacotes.some((p) => p.itens.some((i) => turmaIds.has(i.turmaId)));
      if (!relevante) return;
      const mv = mesDe(c.criadoEm); if (acc[mv]) acc[mv].vendido += t.final;
      c.parcelas.forEach((p) => { if (p.status === 'paga' && p.pagoEm) { const mp = mesDe(p.pagoEm); if (acc[mp]) acc[mp].recebido += p.valor; } });
    });
    return meses.map((m) => { const x = acc[m]; return { ...x, receita: arred(x.receita), custo: arred(x.custo), imposto: arred(x.imposto), resultado: arred(x.receita - x.custo - x.imposto), vendido: arred(x.vendido), recebido: arred(x.recebido) }; });
  }

  // ---------- Foco de marketing ----------

  // Pontua cada curso por margem, receita, ocupação e demanda (alunos); explica o porquê.
  function focoMarketing(porCurso, linhas) {
    const comReceita = porCurso.filter((g) => g.receita > 0);
    if (!comReceita.length) return [];
    const max = (f) => Math.max(1, ...comReceita.map(f));
    const mReceita = max((g) => g.receita); const mAlunos = max((g) => g.alunos);
    const ref = hoje();
    return comReceita.map((g) => {
      const margem = Math.max(0, g.margem ?? 0) / 100;
      const pReceita = g.receita / mReceita;
      const pOcup = (g.ocupacao ?? 0) / 100;
      const pDemanda = g.alunos / mAlunos;
      const score = Math.round((0.35 * margem + 0.3 * pReceita + 0.2 * pOcup + 0.15 * pDemanda) * 100);
      const abertas = g.linhas.filter((l) => l.tipo === 'aberta');
      const proximas = g.linhas.filter((l) => l.inicio > ref && l.vagasVendidas < l.vagas);
      const vagasLivres = proximas.reduce((s, l) => s + (l.vagas - l.vagasVendidas), 0);
      const motivos = [];
      if ((g.margem ?? 0) >= 40) motivos.push(`margem de ${fmtPct(g.margem)}`);
      else if ((g.margem ?? 0) < 15) motivos.push(`margem baixa (${fmtPct(g.margem)})`);
      if (pReceita >= 0.6) motivos.push('entre as maiores receitas');
      if ((g.ocupacao ?? 0) >= 85) motivos.push(`ocupação de ${fmtPct(g.ocupacao)} — demanda reprimida`);
      else if ((g.ocupacao ?? 0) < 50) motivos.push(`ocupação de ${fmtPct(g.ocupacao)}`);
      if (abertas.length) motivos.push(`${abertas.length} turma${abertas.length > 1 ? 's' : ''} aberta${abertas.length > 1 ? 's' : ''} (vende avulso)`);
      if (vagasLivres) motivos.push(`${vagasLivres} vaga${vagasLivres > 1 ? 's' : ''} livre${vagasLivres > 1 ? 's' : ''} em turma futura`);
      const acao = vagasLivres && (g.margem ?? 0) >= 25 ? 'Campanha agora: há vagas e margem.'
        : (g.margem ?? 0) >= 40 && (g.ocupacao ?? 0) >= 85 ? 'Abrir nova turma: lota e dá margem.'
          : (g.margem ?? 0) < 15 ? 'Rever preço ou custo antes de investir em mídia.'
            : (g.ocupacao ?? 0) < 50 ? 'Divulgar para preencher vagas.'
              : 'Manter divulgação de rotina.';
      return { ...g, score, vagasLivres, proximas, motivos, acao };
    }).sort((a, b) => b.score - a.score);
  }

  // ---------- Painel executivo ----------

  function painel(ctx, linhas = linhasTurma(ctx)) {
    const ref = hoje();
    const ano = ref.slice(0, 4);
    const doAno = filtrar(linhas, { ano });
    const tAno = totais(doAno);
    const tTudo = totais(linhas);
    const emAndamento = linhas.filter((l) => l.situacao === 'em_andamento');
    const proximas = linhas.filter((l) => l.inicio > ref).sort((a, b) => a.inicio.localeCompare(b.inicio));
    const contratos = ctx.contratos.filter((c) => c.status !== 'cancelado');
    const porStatus = {};
    (typeof STATUS_CONTRATO !== 'undefined' ? STATUS_CONTRATO : []).forEach((s) => { porStatus[s.id] = ctx.contratos.filter((c) => c.status === s.id).length; });
    const cobranca = { em_dia: 0, inadimplente: 0, recuperante: 0, quitado: 0, sem_parcelas: 0 };
    let vencido = 0; let vencidas = 0;
    contratos.forEach((c) => {
      const s = Contratos.situacaoCobranca(c); if (s) cobranca[s] += 1;
      Contratos.parcelasVencidas(c).forEach((p) => { vencido += p.valor; vencidas += 1; });
    });
    const aguardando = contratos.reduce((s, c) => s + Contratos.resumoPacotes(c).aguardando, 0);
    const vagas = contratos.reduce((acc, c) => { const r = Contratos.resumoPacotes(c); acc.vendidas += r.vagas; acc.livres += r.livres; return acc; }, { vendidas: 0, livres: 0 });
    const alunosAtivos = new Set();
    contratos.forEach((c) => Contratos.itensMatriculados(c).forEach((i) => { if (i.status === 'matriculado') alunosAtivos.add(i.alunoId); }));
    const empresasAtivas = new Set(contratos.filter((c) => c.contratante === 'empresa').map((c) => c.empresaId)).size;
    const formacoesAtivas = ctx.formacoes.filter((f) => f.status === 'ativo').map((f) => {
      const ls = linhas.filter((l) => l.turma.formacaoId === f.id);
      const t = totais(ls);
      const alunos = typeof Formacoes.alunosDaFormacao === 'function' ? Formacoes.alunosDaFormacao(f.id, ctx.cursos).length : t.alunos;
      const concluidas = ls.filter((l) => l.situacao === 'concluida').length;
      return { formacao: f, receita: t.receita, resultado: t.resultado, margem: t.margem, alunos, turmas: ls.length, concluidas, progresso: ls.length ? Math.round((concluidas / ls.length) * 100) : 0, emAndamento: ls.find((l) => l.situacao === 'em_andamento') ?? null };
    }).sort((a, b) => b.receita - a.receita);
    // Últimos 12 meses fechados em `ref` (competência).
    const [anoRef, mesRef] = ref.split('-').map(Number);
    const de = mesRef === 12 ? `${anoRef}-01` : `${anoRef - 1}-${String(mesRef + 1).padStart(2, '0')}`;
    const serie12 = serieMensal(ctx, linhas, { de, ate: mesDe(ref) });
    const ultimos12 = serie12.reduce((a, m) => ({ receita: a.receita + m.receita, custo: a.custo + m.custo, imposto: a.imposto + m.imposto, vendido: a.vendido + m.vendido, recebido: a.recebido + m.recebido }), { receita: 0, custo: 0, imposto: 0, vendido: 0, recebido: 0 });
    ultimos12.resultado = arred(ultimos12.receita - ultimos12.custo - ultimos12.imposto);
    ultimos12.margem = ultimos12.receita ? pct(ultimos12.resultado, ultimos12.receita) : null;
    return {
      ref, ano, tAno, tTudo, ultimos12, serie12, emAndamento, proximas, porStatus, cobranca, vencido: arred(vencido), vencidas, aguardando, vagas,
      alunosAtivos: alunosAtivos.size, empresasAtivas, formacoesAtivas, nContratos: contratos.length,
    };
  }

  return {
    CHAVE, ORIGENS_INSTRUTOR, arred, fmtMoeda, fmtMoedaCentavos, fmtCompacto, fmtPct, pct, hoje,
    carregarCustos, salvarCustos, custosDe, validarCustos, definirCustos,
    contexto, itensReceita, custoInstrutor, linhaTurma, linhasTurma, anos, filtrar, totais, agrupar, serieMensal, rotuloMes, focoMarketing, painel,
  };
})();
