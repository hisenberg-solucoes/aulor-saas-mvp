// ============================================================
// Motor da tela "Contratos": regras puras (sem DOM). Persistência em
// localStorage — chave v8 (31/08/2026: mesmo modelo do v7, só a semente mudou —
// status "congelada" nas matrículas; chaves v6/v7 salvas são ignoradas e a
// semente é recarregada). Depende de Clientes
// (clientes-motor.js), Cursos/CURSOS (cursos-data.js) e FORMACOES_SEED
// (formacoes-data.js). `ctx` = { empresas, alunos, responsaveis, cursos, formacoes }.
//
// Modelo (docs/contratos-pacotes-especificacao.md): o contrato vende N
// PACOTES (molde de itens × vagas). Cada aluno entra em UM pacote com uma
// cópia dos itens (matrículas), pela escola (aprovado) ou pelo link do
// pacote (aguardando conferência). Valor do contrato = vagas livres × valor
// do pacote + alunos ocupando vaga pelo valor individual. Assinatura em duas
// partes (contratante + ProWay), Clicksign simulado, rescisão do contrato inteiro.
// ============================================================

const Contratos = (() => {
  const CHAVE = 'aulor-v1-contratos-v10'; // v10: semente com centro de receita e vendedor externo

  const clonar = (x) => JSON.parse(JSON.stringify(x));

  // Histórico salvo antes de 16/10/2026 chama a venda de "Contrato".
  const TEXTOS_VENDA = [[/^Contrato (criad|cancelad|reabert)o\b/, 'Venda $1a'], [/^Aluno removido do contrato$/, 'Aluno removido da venda']];
  const textoVenda = (h) => ({ ...h, texto: TEXTOS_VENDA.reduce((t, [de, para]) => t.replace(de, para), String(h.texto ?? '')) });

  // Garante os campos do v7 em contratos salvos por versões intermediárias.
  const completar = (c) => ({
    ...contratoSeed({}), ...c,
    pacotes: (c.pacotes ?? []).map((p) => ({ convite: null, ...p })),
    alunos: (c.alunos ?? []).map((v) => ({ ajustado: false, recusa: null, conferidoEm: null, entrouEm: c.criadoEm, origem: 'escola', ...v })),
    historico: (c.historico ?? []).map(textoVenda),
  });

  function carregar() {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) return JSON.parse(salvo).map(completar);
    } catch (_) { /* volta para a semente */ }
    return clonar(CONTRATOS_SEED);
  }

  function salvar(lista) {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
    if (typeof Turmas !== 'undefined' && Turmas.invalidarMatriculas) Turmas.invalidarMatriculas();
  }

  const normalizar = (t) => Clientes.normalizar(t);
  const porId = (lista, id) => lista.find((x) => x.id === id) ?? null;
  const arred = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const hoje = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10); // data local do navegador
  const agora = () => new Date().toISOString().slice(0, 19);

  function novoId(lista, prefixo) {
    let n = lista.length + 1;
    while (lista.some((x) => x.id === `${prefixo}${n}`)) n += 1;
    return `${prefixo}${n}`;
  }

  // ---------- Formatos ----------

  const fmtMoeda = (n) => (n == null || Number.isNaN(Number(n)) ? '—' : Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
  const fmtData = (iso) => (iso ? Clientes.fmtData(String(iso).slice(0, 10)) : '');
  const fmtDataHora = (iso) => (iso ? `${fmtData(iso)} ${String(iso).slice(11, 16)}`.trim() : '');
  // Aceita número ou texto digitado ('1.234,56'). Número já numérico não passa pela limpeza de separadores.
  const numero = (v) => (typeof v === 'number' ? v : v === '' || v == null ? null : Number(String(v).replace(/\./g, '').replace(',', '.')));

  // Código "AAAA-MM-NNN": sequencial dentro do mês de criação.
  function proximoCodigo(lista, isoData = agora()) {
    const prefixo = isoData.slice(0, 7);
    const usados = lista.filter((c) => c.codigo.startsWith(prefixo)).map((c) => Number(c.codigo.slice(8)) || 0);
    return `${prefixo}-${String((usados.length ? Math.max(...usados) : 0) + 1).padStart(3, '0')}`;
  }

  // ---------- Leitura / derivados ----------

  const statusDe = (c) => STATUS_CONTRATO.find((s) => s.id === c.status);
  const cursoDe = (ctx, id) => porId(ctx.cursos, id);
  const turmaDe = (id) => (id ? Cursos.todasTurmas().find((t) => t.id === id) ?? null : null);
  const formacaoDe = (ctx, id) => porId(ctx.formacoes, id);
  const empresaDe = (ctx, c) => (c.contratante === 'empresa' ? porId(ctx.empresas, c.empresaId) : null);
  const nomeEmpresa = (e) => (e ? e.nomeFantasia || e.razaoSocial : '');
  const situacaoVinculoDe = (v) => SITUACOES_VINCULO.find((s) => s.id === v.situacao);

  // Pacotes e vínculos.
  const pacoteDe = (c, pacoteId) => c.pacotes.find((p) => p.id === pacoteId) ?? null;
  const vinculoDe = (c, alunoId) => c.alunos.find((v) => v.alunoId === alunoId) ?? null;
  const vinculosDoPacote = (c, pacoteId) => c.alunos.filter((v) => v.pacoteId === pacoteId);
  // Ocupa vaga: aguardando conferência ou aprovado (RN-06). Recusado/desistente liberam (RN-07).
  const ocupaVaga = (v) => v.situacao === 'aguardando' || v.situacao === 'aprovado';
  // Matriculado de fato (conta em turma/faturamento por aluno): aprovado, ou desistente (matrículas "desistiu").
  const matriculado = (v) => v.situacao === 'aprovado' || v.situacao === 'desistente';
  const alunoIdsDe = (c) => c.alunos.filter(ocupaVaga).map((v) => v.alunoId);
  const alunosDe = (ctx, c) => alunoIdsDe(c).map((id) => porId(ctx.alunos, id)).filter(Boolean);
  const alunosAguardando = (c) => c.alunos.filter((v) => v.situacao === 'aguardando');
  const recusadosDoPacote = (c, pacoteId) => vinculosDoPacote(c, pacoteId).filter((v) => v.situacao === 'recusado');

  function vagasDoPacote(c, p) {
    const vs = vinculosDoPacote(c, p.id);
    const conta = (s) => vs.filter((v) => v.situacao === s).length;
    const ocupadas = vs.filter(ocupaVaga).length;
    return { vagas: p.vagas, ocupadas, livres: Math.max(0, p.vagas - ocupadas), aguardando: conta('aguardando'), aprovados: conta('aprovado'), recusados: conta('recusado'), desistentes: conta('desistente') };
  }

  // Totais de vagas do contrato inteiro.
  function resumoPacotes(c) {
    const r = { nPacotes: c.pacotes.length, vagas: 0, ocupadas: 0, livres: 0, aguardando: 0, aprovados: 0, recusados: 0, desistentes: 0 };
    c.pacotes.forEach((p) => { const v = vagasDoPacote(c, p); ['vagas', 'ocupadas', 'livres', 'aguardando', 'aprovados', 'recusados', 'desistentes'].forEach((k) => { r[k] += v[k]; }); });
    return r;
  }

  const valorPacote = (p) => arred(p.itens.reduce((s, i) => s + (Number(i.valorFinal) || 0), 0));
  const valorBasePacote = (p) => arred(p.itens.reduce((s, i) => s + (Number(i.valorBase) || 0), 0));

  // "SIGLA (dd/mm/aaaa) - Nome do curso" ou "SIGLA - Nome" (turma a definir).
  function rotuloItem(ctx, it) {
    const curso = cursoDe(ctx, it.cursoId);
    const turma = turmaDe(it.turmaId);
    const sigla = curso?.codigo ?? '?';
    const nome = curso?.nome ?? 'Curso removido';
    return turma ? `${turma.codigo} (${fmtData(turma.inicio)}) - ${nome}` : `${sigla} - ${nome}`;
  }

  // Itens (matrículas) enriquecidos com aluno/pacote/código. `filtro` decide quais vínculos entram.
  const enriquecer = (v, i) => ({ ...i, alunoId: v.alunoId, pacoteId: v.pacoteId, codigo: v.codigo, situacao: v.situacao });
  const todosItens = (c, filtro = ocupaVaga) => c.alunos.filter(filtro).flatMap((v) => v.itens.map((i) => enriquecer(v, i)));
  const itensMatriculados = (c) => todosItens(c, matriculado);
  const itensDoAluno = (c, alunoId) => { const v = vinculoDe(c, alunoId); return v ? v.itens.map((i) => enriquecer(v, i)) : []; };
  const itemDe = (c, id) => todosItens(c, () => true).find((i) => i.id === id) ?? null;
  // Ativa = vale no contrato/faturamento: matriculado, congelada (pausa: o aluno segue devendo a vaga [sup.]) e concluído.
  const matriculaAtiva = (m) => m.status === 'matriculado' || m.status === 'congelada' || m.status === 'concluido';
  const valorMatricula = (c, m) => (matriculaAtiva(m) ? Number(m.valorFinal) || 0 : 0);
  const valorBaseMatricula = (c, m) => (matriculaAtiva(m) ? Number(m.valorBase) || 0 : 0);
  const codigoMatricula = (c, alunoId) => vinculoDe(c, alunoId)?.codigo ?? '';

  // Próximo "codigo-NN" (NN nunca reaproveitado, mesmo de recusados).
  function proximoCodigoMatricula(c) {
    const usados = c.alunos.map((v) => Number(String(v.codigo).slice(-2)) || 0);
    return `${c.codigo}-${String((usados.length ? Math.max(...usados) : 0) + 1).padStart(2, '0')}`;
  }

  // Itens de um aluno agrupados: uma entrada por formação (com os cursos dela) + uma entrada "avulsos".
  function gruposDoAluno(ctx, c, alunoId) {
    return agruparItens(ctx, c, itensDoAluno(c, alunoId));
  }
  function agruparItens(ctx, c, itens) {
    const grupos = [];
    itens.forEach((it) => {
      const chave = it.formacaoId ?? 'avulsos';
      let g = grupos.find((x) => x.chave === chave);
      if (!g) { g = { chave, formacaoId: it.formacaoId ?? null, formacao: it.formacaoId ? formacaoDe(ctx, it.formacaoId) : null, itens: [] }; grupos.push(g); }
      g.itens.push(it);
    });
    return grupos.map((g) => ({ ...g, base: arred(g.itens.reduce((s, i) => s + (i.status ? valorBaseMatricula(c, i) : Number(i.valorBase) || 0), 0)), final: arred(g.itens.reduce((s, i) => s + (i.status ? valorMatricula(c, i) : Number(i.valorFinal) || 0), 0)), ativos: g.itens.filter((i) => !i.status || matriculaAtiva(i)).length }));
  }

  // O que foi vendido (distinto, nos pacotes): formações e cursos avulsos.
  function resumoVenda(ctx, c) {
    const formacaoIds = [...new Set(c.pacotes.flatMap((p) => p.itens.filter((i) => i.formacaoId).map((i) => i.formacaoId)))];
    const avulsoIds = [...new Set(c.pacotes.flatMap((p) => p.itens.filter((i) => !i.formacaoId).map((i) => i.cursoId)))];
    return { formacoes: formacaoIds.map((id) => formacaoDe(ctx, id)).filter(Boolean), nFormacoes: formacaoIds.length, cursosAvulsos: avulsoIds.map((id) => cursoDe(ctx, id)).filter(Boolean), nAvulsos: avulsoIds.length };
  }

  // Descrição automática ("o que foi vendido"), salvo quando o usuário escreveu a dele.
  function descricao(ctx, c) {
    if (c.descricao) return c.descricao;
    const r = resumoVenda(ctx, c);
    const partes = [];
    if (r.formacoes.length) partes.push(r.formacoes.map((f) => f.nome).join(' · '));
    if (r.cursosAvulsos.length) partes.push(r.formacoes.length ? `+ ${r.cursosAvulsos.length === 1 ? r.cursosAvulsos[0].nome : `${r.cursosAvulsos.length} cursos avulsos`}` : r.cursosAvulsos.map((x) => x.nome).join(' · '));
    return partes.length ? partes.join(' ') : 'Sem pacotes';
  }

  // "n pacotes · n vagas (n ocupadas)" para lista e cabeçalho.
  function resumoVagasTexto(c) {
    const r = resumoPacotes(c);
    return `${r.nPacotes} ${r.nPacotes === 1 ? 'pacote' : 'pacotes'} · ${r.vagas} ${r.vagas === 1 ? 'vaga' : 'vagas'} (${r.ocupadas} ${r.ocupadas === 1 ? 'ocupada' : 'ocupadas'})`;
  }

  // Responsável financeiro: empresa; ou, no particular, o Responsável cadastrado / o aluno (ou quem paga por ele).
  function responsavelFinanceiro(ctx, c) {
    if (!c.contratante) return { tipo: null, nome: 'Contratante não definido', documento: '', email: '', pendencias: ['Contratante'], empresa: null, aluno: null, responsavel: null };
    if (c.contratante === 'empresa') {
      const e = empresaDe(ctx, c);
      if (!e) return { tipo: 'empresa', nome: 'Empresa não definida', documento: '', pendencias: ['Empresa contratante'], empresa: null };
      return { tipo: 'empresa', nome: nomeEmpresa(e), documento: Clientes.fmtCnpj(e.cnpj), email: e.cobranca.emailCobranca || e.email, empresa: e, pendencias: e.status === 'ativo' ? Clientes.pendenciasEmpresa(e) : ['Empresa inativa', ...Clientes.pendenciasEmpresa(e)] };
    }
    const r = c.responsavel;
    if (r?.tipo === 'responsavel') {
      const resp = porId(ctx.responsaveis ?? [], r.id);
      if (!resp) return { tipo: 'responsavel', nome: 'Responsável não encontrado', documento: '', pendencias: ['Responsável financeiro'], responsavel: null };
      return { tipo: 'responsavel', nome: resp.nome, documento: Clientes.fmtCpf(resp.cpf), email: resp.email, responsavel: resp, pendencias: resp.status === 'ativo' ? Clientes.pendenciasResponsavel(resp) : ['Responsável inativo', ...Clientes.pendenciasResponsavel(resp)] };
    }
    const a = r?.tipo === 'aluno' ? porId(ctx.alunos, r.id) : null;
    if (!a) return { tipo: 'aluno', nome: 'Responsável não definido', documento: '', pendencias: ['Responsável financeiro'], aluno: null };
    const pend = Clientes.pendenciasAluno(a, ctx.empresas);
    if (a.pagador === 'terceiro' && a.responsavel.nome) {
      return { tipo: 'terceiro', nome: a.responsavel.nome, documento: Clientes.fmtCpf(a.responsavel.cpf), email: a.responsavel.email, aluno: a, parentesco: a.responsavel.parentesco, pendencias: pend };
    }
    if (a.pagador === 'empresa') {
      const e = porId(ctx.empresas, a.empresaId);
      return { tipo: 'empresa', nome: nomeEmpresa(e) || 'Empresa do aluno', documento: e ? Clientes.fmtCnpj(e.cnpj) : '', email: e?.cobranca.emailCobranca || e?.email, aluno: a, empresa: e, pendencias: [...pend, ...(e ? Clientes.pendenciasEmpresa(e) : [])] };
    }
    return { tipo: 'aluno', nome: a.nomeSocial || a.nome, documento: Clientes.fmtCpf(a.cpf), email: a.email, aluno: a, pendencias: pend };
  }

  // Valor do contrato (RN-13): por pacote, vagas livres × valor do pacote + alunos ocupando vaga pelos itens ativos deles.
  function totais(c) {
    const porPacote = c.pacotes.map((p) => {
      const vg = vagasDoPacote(c, p);
      const ocupantes = vinculosDoPacote(c, p.id).filter(ocupaVaga);
      const alunosFinal = arred(ocupantes.reduce((s, v) => s + v.itens.reduce((t, i) => t + valorMatricula(c, i), 0), 0));
      const alunosBase = arred(ocupantes.reduce((s, v) => s + v.itens.reduce((t, i) => t + valorBaseMatricula(c, i), 0), 0));
      const vp = valorPacote(p); const bp = valorBasePacote(p);
      return { pacoteId: p.id, pacote: p, ...vg, valorPacote: vp, basePacote: bp, livresFinal: arred(vg.livres * vp), livresBase: arred(vg.livres * bp), alunosFinal, alunosBase, final: arred(vg.livres * vp + alunosFinal), base: arred(vg.livres * bp + alunosBase) };
    });
    const base = arred(porPacote.reduce((s, x) => s + x.base, 0));
    const final = arred(porPacote.reduce((s, x) => s + x.final, 0));
    const pago = arred(c.parcelas.filter((p) => p.status === 'paga').reduce((s, p) => s + p.valor, 0));
    const aberto = arred(c.parcelas.filter((p) => p.status === 'emitida' || p.status === 'prevista').reduce((s, p) => s + p.valor, 0));
    const porAluno = c.alunos.map((v) => ({ alunoId: v.alunoId, pacoteId: v.pacoteId, situacao: v.situacao, base: ocupaVaga(v) ? arred(v.itens.reduce((s, i) => s + valorBaseMatricula(c, i), 0)) : 0, final: ocupaVaga(v) ? arred(v.itens.reduce((s, i) => s + valorMatricula(c, i), 0)) : 0, nItens: v.itens.length, ativos: v.itens.filter(matriculaAtiva).length }));
    const r = resumoPacotes(c);
    return { base, final, desconto: arred(base - final), pago, aberto, nAlunos: r.ocupadas, nAguardando: r.aguardando, nItens: todosItens(c).length, porAluno, porPacote, ...r };
  }

  const parcelaVencida = (p, ref = hoje()) => p.status === 'emitida' && p.vencimento < ref;

  // Situação de cobrança derivada das parcelas — inadimplente/recuperante não são escolhidos à mão.
  function situacaoCobranca(c, ref = hoje()) {
    if (c.status === 'cancelado' || c.status === 'rascunho') return null;
    if (!c.parcelas.length) return 'sem_parcelas';
    if (c.parcelas.every((p) => p.status === 'paga' || p.status === 'cancelada')) return 'quitado';
    if (c.parcelas.some((p) => parcelaVencida(p, ref))) return c.recuperacao ? 'recuperante' : 'inadimplente';
    return 'em_dia';
  }

  const parcelasVencidas = (c, ref = hoje()) => c.parcelas.filter((p) => parcelaVencida(p, ref));

  // Atraso e encargos (multa + juros, item 23) de cada parcela vencida: a mesma conta da rescisão, para quem vai cobrar.
  const vencidasComEncargos = (c, ref = hoje()) => parcelasVencidas(c, ref).map((p) => {
    const dias = diasEntre(p.vencimento, ref);
    return { parcela: p, dias, encargos: arred(p.valor * REGRAS_RESCISAO.multaAtraso + p.valor * REGRAS_RESCISAO.jurosMes * dias / 30) };
  });
  function resumoVencido(c, ref = hoje()) {
    const v = vencidasComEncargos(c, ref);
    return { n: v.length, valor: arred(v.reduce((s, x) => s + x.parcela.valor, 0)), encargos: arred(v.reduce((s, x) => s + x.encargos, 0)), dias: Math.max(0, ...v.map((x) => x.dias)) };
  }

  // ---------- Assinaturas (duas partes) ----------

  const assinaturaDe = (c, parte) => c.assinaturas?.[parte] ?? null;
  const assinado = (c) => Boolean(assinaturaDe(c, 'contratante') && assinaturaDe(c, 'escola'));
  const partesPendentes = (c) => PARTES_ASSINATURA.filter((p) => !assinaturaDe(c, p.id));
  const assinadoEm = (c) => (assinado(c) ? [assinaturaDe(c, 'contratante').assinadoEm, assinaturaDe(c, 'escola').assinadoEm].sort().pop() : null);

  // ---------- Pendências (o que trava cada passo) ----------

  const valorValido = (i) => Number(i.valorFinal) >= 0 && Number(i.valorBase) >= 0;

  // Para gerar o documento (RN-26): contratante definido e sem pendências de cadastro, ≥ 1 pacote com vaga, valores, condição.
  function pendenciasDocumento(ctx, c) {
    const p = [];
    if (!c.contratante) p.push('Contratante');
    else {
      const r = responsavelFinanceiro(ctx, c);
      if (c.contratante === 'empresa' && !r.empresa) p.push('Empresa contratante');
      else if (c.contratante === 'particular' && !r.aluno && !r.responsavel) p.push('Responsável financeiro');
      else if (r.pendencias.length) p.push(`Cadastro do contratante (${r.pendencias.join(', ')})`);
    }
    if (!c.pacotes.some((x) => x.vagas >= 1)) p.push('Pelo menos um pacote com vaga');
    if (c.pacotes.some((x) => !x.itens.length)) p.push('Itens em todos os pacotes');
    if (c.pacotes.some((x) => x.itens.some((i) => !valorValido(i))) || todosItens(c).some((i) => !valorValido(i))) p.push('Valores dos itens');
    if (c.pacotes.length && totais(c).final <= 0) p.push('Valor total maior que zero');
    if (!c.cobranca.parcelas || !c.cobranca.primeiroVencimento) p.push('Condição de pagamento (parcelas e 1º vencimento)');
    return p;
  }

  // Para emitir boleto/NF: cadastro do responsável financeiro completo (Clientes.pendencias*) + PO quando exigido.
  function pendenciasEmissao(ctx, c) {
    const r = responsavelFinanceiro(ctx, c);
    const p = [...r.pendencias];
    const e = r.empresa ?? empresaDe(ctx, c);
    if (e && e.cobranca.exigePedidoCompra && !c.cobranca.pedidoCompra) p.push('Número do pedido de compra (PO)');
    if (!c.parcelas.length) p.push('Parcelas geradas');
    return p;
  }

  function pendenciasComercialOk(c) {
    const p = [];
    if (!assinaturaDe(c, 'contratante')) p.push('Assinatura do contratante');
    if (!assinaturaDe(c, 'escola')) p.push('Assinatura da ProWay');
    if (!c.parcelas.some((x) => x.status === 'paga')) p.push('1ª parcela paga');
    return p;
  }

  function pendenciasAdmOk(c) {
    const p = [];
    if (c.status !== 'comercial_ok') p.push('Comercial OK');
    if (!c.nf) p.push('Nota fiscal emitida');
    if (itensMatriculados(c).some((m) => matriculaAtiva(m) && !m.turmaId)) p.push('Turma definida em todos os itens');
    return p;
  }

  // Próxima ação sugerida para a faixa/Resumo e a lista. Parcela vencida vem antes da etapa do processo:
  // `divida` traz quanto e há quanto tempo, e `etapa` o passo do fluxo que ainda falta (nulo em Adm OK).
  // `aguardando` = alunos a conferir (a UI mostra à parte).
  function proximaAcao(ctx, c) {
    const aguardando = alunosAguardando(c).length;
    const passo = passoDoFluxo(ctx, c);
    const sit = situacaoCobranca(c);
    if (sit !== 'inadimplente' && sit !== 'recuperante') return { ...passo, aguardando, divida: null, etapa: null };
    const v = resumoVencido(c);
    const divida = sit === 'inadimplente'
      ? { texto: `${v.n === 1 ? '1 parcela vencida' : `${v.n} parcelas vencidas`} — cobrar ou registrar acordo.`, acao: 'recuperacao' }
      : { texto: 'Em recuperação — acompanhar o acordo.', acao: null };
    return { ...divida, aguardando, divida: { situacao: sit, ...v }, etapa: c.status === 'adm_ok' ? null : passo };
  }

  function passoDoFluxo(ctx, c) {
    if (c.status === 'cancelado') return { texto: 'Venda cancelada.', acao: null };
    if (c.status === 'rascunho') {
      if (!c.contratante) return { texto: 'Defina o contratante para gerar o documento e abrir os links dos pacotes.', acao: 'contratante' };
      const p = pendenciasDocumento(ctx, c);
      return p.length ? { texto: `Completar: ${p.join(' · ')}.`, acao: null } : { texto: 'Venda completa — gere o documento e envie para assinatura.', acao: 'documento' };
    }
    if (c.status === 'aguardando') {
      const p = pendenciasComercialOk(c);
      if (!p.length) return { texto: 'Assinado pelas duas partes e pago — marque Comercial OK.', acao: 'comercial_ok' };
      const falta = `Falta ${p.map((x) => x[0].toLowerCase() + x.slice(1)).join(', ').replace(/, ([^,]*)$/, ' e $1')}.`;
      const env = envelopePendente(c);
      if (!assinado(c) && !env && podeEnviarClicksign(c)) return { texto: `${falta} Envie o documento para assinatura no Clicksign.`, acao: 'clicksign' };
      if (!assinado(c) && env?.status === 'recusado') return { texto: `${falta} Envelope ${env.envelopeId} recusado por ${signatariosRecusaram(env).map((x) => x.nome).join(', ')} — revise e envie um novo.`, acao: 'clicksign' };
      const aguard = env ? ` Aguardando ${signatariosPendentes(env).map((x) => x.nome).join(', ')} no Clicksign (${env.envelopeId}).` : '';
      const emitir = c.parcelas.some((x) => x.status === 'prevista');
      if (emitir && !pendenciasEmissao(ctx, c).length) return { texto: `${falta}${aguard} Emita os boletos.`, acao: 'boletos' };
      if (emitir) return { texto: `${falta}${aguard} Boleto travado: ${pendenciasEmissao(ctx, c).join(' · ')}.`, acao: null };
      return { texto: `${falta}${aguard}`, acao: null };
    }
    if (c.status === 'comercial_ok') {
      const p = pendenciasAdmOk(c);
      if (!p.length) return { texto: 'Tudo conferido — marque Adm OK.', acao: 'adm_ok' };
      if (!c.nf) return pendenciasEmissao(ctx, c).length ? { texto: `NF travada: ${pendenciasEmissao(ctx, c).join(' · ')}.`, acao: null } : { texto: 'Emita a nota fiscal.', acao: 'nf' };
      return { texto: `Falta: ${p.join(' · ')}.`, acao: null };
    }
    // Adm OK com parcela vencida já saiu em proximaAcao; aqui só sobra o que não pede ação.
    return { texto: situacaoCobranca(c) === 'quitado' ? 'Venda quitada.' : 'Em andamento.', acao: null };
  }

  // ---------- Filtros e agrupamentos ----------

  // `contratante`: 'empresa' | 'particular' | 'sem' (sem contratante). `aguardando`: '1' = só com alunos a conferir.
  function filtrar(lista, ctx, { busca = '', status = '', contratante = '', situacao = '', vendedor = '', aguardando = '' } = {}) {
    const termo = normalizar(busca);
    return lista
      .filter((c) => {
        if (!termo) return true;
        const r = responsavelFinanceiro(ctx, c);
        const alunos = c.alunos.map((v) => porId(ctx.alunos, v.alunoId)?.nome ?? '').join(' ');
        const cursos = c.pacotes.flatMap((p) => p.itens.map((it) => cursoDe(ctx, it.cursoId)?.nome ?? '')).join(' ');
        const pacotes = c.pacotes.map((p) => p.nome).join(' ');
        return normalizar(`${c.codigo} ${r.nome} ${nomeEmpresa(empresaDe(ctx, c))} ${alunos} ${descricao(ctx, c)} ${cursos} ${pacotes}`).includes(termo);
      })
      .filter((c) => !status || c.status === status)
      .filter((c) => !contratante || (contratante === 'sem' ? !c.contratante : c.contratante === contratante))
      .filter((c) => !situacao || situacaoCobranca(c) === situacao)
      .filter((c) => !vendedor || c.vendedorId === vendedor)
      .filter((c) => !aguardando || alunosAguardando(c).length > 0)
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  // Visão por turma: matrículas de alunos aprovados (e desistentes, com R$ 0) via contratos não cancelados.
  function porTurma(lista, ctx) {
    const mapa = new Map();
    lista.forEach((c) => {
      if (c.status === 'cancelado') return;
      itensMatriculados(c).forEach((it) => {
        const chave = it.turmaId ?? `sem-${it.cursoId}`;
        if (!mapa.has(chave)) mapa.set(chave, { chave, turma: turmaDe(it.turmaId), curso: cursoDe(ctx, it.cursoId), rotulo: rotuloItem(ctx, it), linhas: [] });
        mapa.get(chave).linhas.push({ matricula: it, item: it, contrato: c, aluno: porId(ctx.alunos, it.alunoId), valor: valorMatricula(c, it) });
      });
    });
    return [...mapa.values()]
      .map((g) => ({ ...g, faturamento: arred(g.linhas.reduce((s, l) => s + l.valor, 0)), ativos: g.linhas.filter((l) => matriculaAtiva(l.matricula)).length, linhas: g.linhas.sort((a, b) => (a.aluno?.nome ?? '').localeCompare(b.aluno?.nome ?? '', 'pt-BR')) }))
      .sort((a, b) => (b.turma?.inicio ?? '').localeCompare(a.turma?.inicio ?? '') || a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
  }

  // Todas as parcelas não pagas, para a página Cobranças.
  function cobrancas(lista, ctx, ref = hoje()) {
    const linhas = [];
    lista.forEach((c) => {
      if (c.status === 'cancelado' || c.status === 'rascunho') return;
      c.parcelas.forEach((p) => {
        if (p.status === 'paga' || p.status === 'cancelada') return;
        linhas.push({ contrato: c, parcela: p, responsavel: responsavelFinanceiro(ctx, c), vencida: parcelaVencida(p, ref), situacao: situacaoCobranca(c, ref), bloqueios: p.status === 'prevista' ? pendenciasEmissao(ctx, c) : [] });
      });
    });
    return linhas.sort((a, b) => a.parcela.vencimento.localeCompare(b.parcela.vencimento));
  }

  // Histórico para Clientes: uma linha por item (matrícula) do aluno, com o pacote e a situação do vínculo.
  function historicoAluno(lista, ctx, alunoId) {
    const linhas = [];
    lista.forEach((c) => {
      const v = vinculoDe(c, alunoId);
      if (!v) return;
      const pacote = pacoteDe(c, v.pacoteId);
      itensDoAluno(c, alunoId).forEach((it) => {
        const turma = turmaDe(it.turmaId);
        linhas.push({ contrato: c, vinculo: v, pacote, matricula: it, item: it, turma, curso: cursoDe(ctx, it.cursoId), rotulo: rotuloItem(ctx, it), tipo: it.formacaoId ? `Formação ${formacaoDe(ctx, it.formacaoId)?.nome ?? ''}` : (turma ? TIPOS_TURMA[turma.tipo] : 'Curso avulso'), inicio: turma?.inicio ?? c.criadoEm.slice(0, 10), valor: ocupaVaga(v) ? valorMatricula(c, it) : 0 });
      });
    });
    return linhas.sort((a, b) => b.inicio.localeCompare(a.inicio));
  }

  function historicoEmpresa(lista, ctx, empresaId) {
    return lista.filter((c) => c.contratante === 'empresa' && c.empresaId === empresaId).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  // Contratos em que o aluno tem vínculo (qualquer situação).
  const contratosDoAluno = (lista, alunoId) => lista.filter((c) => Boolean(vinculoDe(c, alunoId)));

  // Débito visto pelos CONTRATOS (o cadastro do aluno tem a marcação manual, que é outra coisa).
  // Só entram contratos em que ele ocupa vaga e que estão inadimplentes/recuperantes.
  // A dívida é separada por quem paga: quando o responsável financeiro não é o próprio
  // aluno (empresa, responsável, terceiro), a parcela vencida NÃO é dívida dele.
  function debitoDoAluno(lista, ctx, alunoId, ref = hoje()) {
    const linhas = contratosDoAluno(lista, alunoId).map((c) => {
      const sit = situacaoCobranca(c, ref);
      if (sit !== 'inadimplente' && sit !== 'recuperante') return null;
      const v = vinculoDe(c, alunoId);
      if (!v || !ocupaVaga(v)) return null;
      const venc = parcelasVencidas(c, ref);
      if (!venc.length) return null;
      const r = responsavelFinanceiro(ctx, c);
      // Contratante ainda não definido → 'indefinido' (nunca cai como dívida do aluno).
      return { contratoId: c.id, codigo: c.codigo, situacao: sit, quemPaga: r.tipo ?? 'indefinido', nomeQuemPaga: r.nome, n: venc.length, valor: arred(venc.reduce((s, p) => s + p.valor, 0)) };
    }).filter(Boolean);
    const resumo = (ls) => ({
      n: ls.reduce((s, l) => s + l.n, 0),
      valor: arred(ls.reduce((s, l) => s + l.valor, 0)),
      codigos: ls.map((l) => l.codigo),
      nomes: [...new Set(ls.map((l) => l.nomeQuemPaga))],
      // Acordo de recuperação em TODOS os contratos do grupo: está vencido, mas combinado.
      emAcordo: ls.length > 0 && ls.every((l) => l.situacao === 'recuperante'),
    });
    const proprio = linhas.filter((l) => l.quemPaga === 'aluno');
    const outros = linhas.filter((l) => l.quemPaga !== 'aluno');
    return { linhas, proprio: resumo(proprio), outros: { ...resumo(outros), tipos: [...new Set(outros.map((l) => l.quemPaga))] } };
  }

  // Débito de quem paga com cadastro próprio (empresa ou responsável): parcelas vencidas dos contratos
  // em que ele é o responsável financeiro — inclui contrato particular de aluno com "empresa paga".
  // Uma passada pela lista; chave `${tipo}:${id}` (ex.: 'empresa:e1'). Terceiro sem cadastro fica de fora.
  function debitosPorPagador(lista, ctx, ref = hoje()) {
    const porPagador = new Map();
    lista.forEach((c) => {
      const sit = situacaoCobranca(c, ref);
      if (sit !== 'inadimplente' && sit !== 'recuperante') return;
      const r = responsavelFinanceiro(ctx, c);
      const quem = r.tipo === 'empresa' ? r.empresa : r.tipo === 'responsavel' ? r.responsavel : null;
      if (!quem) return;
      const venc = parcelasVencidas(c, ref);
      const chave = `${r.tipo}:${quem.id}`;
      const d = porPagador.get(chave) ?? { n: 0, valor: 0, codigos: [], emAcordo: true };
      d.n += venc.length;
      d.valor = arred(d.valor + venc.reduce((s, p) => s + p.valor, 0));
      d.codigos.push(c.codigo);
      d.emAcordo = d.emAcordo && sit === 'recuperante';
      porPagador.set(chave, d);
    });
    return porPagador;
  }

  // ---------- Rateio e moldes ----------

  // Distribui o preço da formação pelos cursos proporcionalmente à carga horária; centavos vão para o último.
  function ratear(valor, cursos) {
    const total = cursos.reduce((s, c) => s + (Number(c.cargaHoraria) || 0), 0);
    if (!cursos.length) return [];
    if (!total) return cursos.map(() => arred(valor / cursos.length));
    const partes = cursos.map((c) => arred(valor * (Number(c.cargaHoraria) || 0) / total));
    const soma = arred(partes.reduce((s, v) => s + v, 0));
    partes[partes.length - 1] = arred(partes[partes.length - 1] + (arred(valor) - soma));
    return partes;
  }

  // Modelos de item de uma formação (rateados) ou de cursos avulsos (preço de referência) — RN-02.
  function modelosItens(ctx, { venda, formacaoId, cursoIds }) {
    if (venda === 'formacao') {
      const f = formacaoDe(ctx, formacaoId);
      if (!f) return [];
      const cursos = f.itens.map((i) => cursoDe(ctx, i.cursoId)).filter(Boolean);
      const partes = ratear(Number(f.comercial.precoReferencia) || 0, cursos);
      return cursos.map((c, i) => ({ formacaoId: f.id, cursoId: c.id, turmaId: null, valorBase: partes[i], valorFinal: partes[i] }));
    }
    if (venda === 'cursos') return (cursoIds ?? []).map((id) => { const c = cursoDe(ctx, id); const v = Number(c?.comercial.precoReferencia) || 0; return { formacaoId: null, cursoId: id, turmaId: null, valorBase: v, valorFinal: v }; });
    return [];
  }

  // Preço de catálogo hoje para um item (rateio da formação ou referência do curso). null se não der para saber.
  function referenciaCatalogo(ctx, it) {
    if (it.formacaoId) {
      const m = modelosItens(ctx, { venda: 'formacao', formacaoId: it.formacaoId }).find((x) => x.cursoId === it.cursoId);
      return m ? m.valorBase : null;
    }
    const c = cursoDe(ctx, it.cursoId);
    return c ? arred(c.comercial.precoReferencia) : null;
  }

  // Nome sugerido do pacote: a formação (+ avulsos) ou os cursos.
  function nomePacoteSugerido(ctx, itens) {
    const formacaoId = itens.find((i) => i.formacaoId)?.formacaoId ?? null;
    const avulsos = itens.filter((i) => !i.formacaoId);
    const nomeCurso = (id) => cursoDe(ctx, id)?.nome ?? id;
    if (formacaoId) return `${formacaoDe(ctx, formacaoId)?.nome ?? formacaoId}${avulsos.length ? ` + ${avulsos.length === 1 ? nomeCurso(avulsos[0].cursoId) : `${avulsos.length} cursos avulsos`}` : ''}`;
    if (!avulsos.length) return 'Sem itens';
    return avulsos.length === 1 ? nomeCurso(avulsos[0].cursoId) : `${avulsos.length} cursos avulsos`;
  }

  const limparMolde = (m) => ({ formacaoId: m.formacaoId ?? null, cursoId: m.cursoId, turmaId: m.turmaId || null, valorBase: arred(m.valorBase), valorFinal: arred(m.valorFinal), ...(m.avisoTabela ? { avisoTabela: m.avisoTabela } : {}) });

  // Copia o molde para um vínculo (RN-03): ids novos, status matriculado; preserva id/status de item já existente do mesmo curso.
  function copiarMolde(c, molde, existentes = []) {
    const ids = todosItens(c, () => true).map((i) => i.id);
    let n = ids.length;
    const novoIdItem = () => { n += 1; while (ids.includes(`i${n}`)) n += 1; ids.push(`i${n}`); return `i${n}`; };
    return molde.map((m) => {
      const ex = existentes.find((i) => i.cursoId === m.cursoId && (i.formacaoId ?? null) === (m.formacaoId ?? null));
      return { id: ex?.id ?? novoIdItem(), ...limparMolde(m), status: ex?.status ?? 'matriculado' };
    });
  }

  // Ajustado = itens do aluno diferem do molde em curso, formação ou valores (turma e status não contam) — RN-04.
  const chaveItem = (i) => `${i.formacaoId ?? ''}|${i.cursoId}|${arred(i.valorBase)}|${arred(i.valorFinal)}`;
  function diferencasDoMolde(ctx, c, v) {
    const p = pacoteDe(c, v.pacoteId);
    if (!p) return [];
    const nome = (i) => cursoDe(ctx, i.cursoId)?.nome ?? i.cursoId;
    const d = [];
    v.itens.forEach((i) => {
      const m = p.itens.find((x) => x.cursoId === i.cursoId && (x.formacaoId ?? null) === (i.formacaoId ?? null));
      if (!m) d.push(`${nome(i)}: a mais`);
      else if (arred(m.valorFinal) !== arred(i.valorFinal) || arred(m.valorBase) !== arred(i.valorBase)) d.push(`${nome(i)}: ${fmtMoeda(i.valorFinal)} (pacote ${fmtMoeda(m.valorFinal)})`);
    });
    p.itens.forEach((m) => { if (!v.itens.some((i) => i.cursoId === m.cursoId && (i.formacaoId ?? null) === (m.formacaoId ?? null))) d.push(`${nome(m)}: removido`); });
    return d;
  }
  function recalcularAjustado(c, alunoId) {
    return { ...c, alunos: c.alunos.map((v) => {
      if (v.alunoId !== alunoId) return v;
      const p = pacoteDe(c, v.pacoteId);
      const a = [...v.itens.map(chaveItem)].sort().join(';'); const b = p ? [...p.itens.map(chaveItem)].sort().join(';') : '';
      return { ...v, ajustado: a !== b };
    }) };
  }

  // ---------- CRUD do contrato ----------

  const registrar = (c, texto, por = 'Ana Souza') => ({ ...c, historico: [...c.historico, { em: agora(), texto, por }] });
  const atualizar = (lista, id, fn) => lista.map((c) => (c.id === id ? fn(c) : c));
  const editavel = (c) => c.status === 'rascunho';
  const podeExcluir = (c) => c.status === 'rascunho';
  const remover = (lista, id) => lista.filter((c) => c.id !== id);

  const vagasValidas = (v) => Number.isInteger(Number(v)) && Number(v) >= 1;

  // Novo contrato = vendedor + centro de receita + 1º pacote (RF-01).
  function validarNovo(ctx, d) {
    const erros = validarPacoteNovo(ctx, d);
    if (!VENDEDORES.some((v) => v.id === d.vendedorId)) erros.push({ campo: 'vendedorId', mensagem: 'Escolha o vendedor.' });
    if (!CentrosReceita.ativos().some((cr) => cr.id === d.centroReceitaId)) erros.push({ campo: 'centroReceitaId', mensagem: 'Escolha o centro de receita.' });
    return erros;
  }

  function validarPacoteNovo(ctx, d) {
    const erros = [];
    if (!TIPOS_VENDA.some((t) => t.id === d.venda)) erros.push({ campo: 'venda', mensagem: 'Escolha formação ou cursos avulsos.' });
    if (d.venda === 'formacao' && !formacaoDe(ctx, d.formacaoId)) erros.push({ campo: 'formacaoId', mensagem: 'Escolha a formação.' });
    if (d.venda === 'cursos' && !(d.cursoIds ?? []).length) erros.push({ campo: 'cursoIds', mensagem: 'Escolha pelo menos um curso.' });
    if (!vagasValidas(d.vagas)) erros.push({ campo: 'vagas', mensagem: 'Informe o número de vagas (mínimo 1).' });
    return erros;
  }

  function novoPacote(ctx, c, d) {
    const itens = modelosItens(ctx, d).map(limparMolde);
    return { id: novoId(c.pacotes, 'p'), nome: String(d.nome ?? '').trim() || nomePacoteSugerido(ctx, itens), formacaoId: d.venda === 'formacao' ? d.formacaoId : null, itens, vagas: Number(d.vagas), convite: null };
  }

  function incluir(lista, ctx, d) {
    const criadoEm = agora();
    let c = contratoSeed({
      id: novoId(lista, 'ct'), codigo: proximoCodigo(lista, criadoEm), criadoEm, status: 'rascunho', vendedorId: d.vendedorId, centroReceitaId: d.centroReceitaId,
      // Particular nasce sem responsável: o 1º aluno que se cadastra pelo link do pacote vira o responsável (cadastrarPeloLinkPacote).
      contratante: d.contratante === 'particular' ? 'particular' : null, empresaId: null, responsavel: null,
      cobranca: { forma: 'boleto', parcelas: d.venda === 'formacao' ? (formacaoDe(ctx, d.formacaoId)?.comercial.parcelasMax ?? 1) : 1, primeiroVencimento: '', pedidoCompra: '' },
    });
    const p = novoPacote(ctx, c, d);
    c = { ...c, pacotes: [p] };
    c = registrar(c, `Venda criada com o pacote "${p.nome}" (${p.vagas} vaga${p.vagas === 1 ? '' : 's'})`, VENDEDORES.find((v) => v.id === d.vendedorId)?.nome);
    return { lista: [...lista, c], contrato: c };
  }

  function atualizarDados(lista, id, d) {
    return atualizar(lista, id, (c) => ({ ...c, descricao: String(d.descricao ?? '').trim(), observacoes: String(d.observacoes ?? '').trim(), vendedorId: d.vendedorId || c.vendedorId, centroReceitaId: d.centroReceitaId || c.centroReceitaId }));
  }

  // Contratante (RN-09/RN-10): empresa, ou particular com responsável único (cadastro de Responsável ou um aluno). Só em rascunho.
  function validarContratante(ctx, d) {
    const erros = [];
    if (!TIPOS_CONTRATANTE.some((t) => t.id === d.contratante)) erros.push({ campo: 'contratante', mensagem: 'Escolha quem contrata.' });
    if (d.contratante === 'empresa') {
      const e = porId(ctx.empresas, d.empresaId);
      if (!e) erros.push({ campo: 'empresaId', mensagem: 'Escolha a empresa.' });
      else if (e.status === 'inativo') erros.push({ campo: 'empresaId', mensagem: 'Empresa inativa não pode fechar venda.' });
    }
    if (d.contratante === 'particular') {
      const r = d.responsavel ?? {};
      if (!TIPOS_RESPONSAVEL_CONTRATO.some((t) => t.id === r.tipo)) erros.push({ campo: 'responsavelTipo', mensagem: 'Escolha quem é o responsável financeiro.' });
      else if (r.tipo === 'responsavel' && !porId(ctx.responsaveis ?? [], r.id)) erros.push({ campo: 'responsavelId', mensagem: 'Escolha o responsável.' });
      else if (r.tipo === 'aluno' && !porId(ctx.alunos, r.id)) erros.push({ campo: 'responsavelId', mensagem: 'Escolha o aluno.' });
    }
    return erros;
  }

  function definirContratante(lista, ctx, id, d) {
    return atualizar(lista, id, (c) => {
      if (!editavel(c) || validarContratante(ctx, d).length) return c;
      const empresa = d.contratante === 'empresa' ? porId(ctx.empresas, d.empresaId) : null;
      const nc = {
        ...c, contratante: d.contratante, empresaId: empresa ? empresa.id : null,
        responsavel: d.contratante === 'particular' ? { tipo: d.responsavel.tipo, id: d.responsavel.id } : null,
        cobranca: { ...c.cobranca, forma: empresa?.cobranca.formaPreferida ?? c.cobranca.forma },
      };
      const r = responsavelFinanceiro(ctx, nc);
      return registrar(nc, `Contratante definido: ${d.contratante === 'empresa' ? nomeEmpresa(empresa) : `particular · ${r.nome}`}`);
    });
  }

  // Lado Clientes ao vincular alunos (RN-10/RN-11): empresa → vincula e "empresa paga"; particular com Responsável
  // cadastrado → vínculo aluno × responsável com papel financeiro. Retorna os dados de Clientes atualizados.
  function sincronizarAlunosComContrato(dadosClientes, c, alunoIds) {
    let d = dadosClientes;
    alunoIds.forEach((alunoId) => {
      const a = porId(d.alunos, alunoId);
      if (!a) return;
      if (c.contratante === 'empresa' && c.empresaId && !a.empresaId) {
        d = Clientes.vincularEmpresa(d, alunoId, c.empresaId, a.cargo);
        d = Clientes.atualizarEnderecoCobrancaAluno(d, alunoId, { endereco: a.endereco, pagador: 'empresa', responsavel: a.responsavel, cobranca: a.cobranca });
      }
      if (c.contratante === 'particular' && c.responsavel?.tipo === 'responsavel' && porId(d.responsaveis, c.responsavel.id)) {
        const atual = a.responsaveis.find((v) => v.responsavelId === c.responsavel.id);
        if (!atual?.papeis.includes('financeiro')) d = Clientes.vincularResponsavel(d, alunoId, { responsavelId: c.responsavel.id, parentesco: atual?.parentesco || 'outro', papeis: [...(atual?.papeis ?? []), 'financeiro'], principal: atual?.principal ?? !a.responsaveis.length });
      }
    });
    return d;
  }

  // ---------- Pacotes ----------

  function adicionarPacote(lista, ctx, id, d) {
    return atualizar(lista, id, (c) => {
      if (validarPacoteNovo(ctx, d).length) return c;
      const p = novoPacote(ctx, c, d);
      const parcelasMax = d.venda === 'formacao' ? (formacaoDe(ctx, d.formacaoId)?.comercial.parcelasMax ?? 0) : 0;
      const nc = { ...c, pacotes: [...c.pacotes, p], cobranca: { ...c.cobranca, parcelas: Math.max(c.cobranca.parcelas || 1, parcelasMax || 1) } };
      return registrar(nc, `Pacote "${p.nome}" adicionado (${p.vagas} vaga${p.vagas === 1 ? '' : 's'})`);
    });
  }

  // Edição do molde (RN-05/RN-06/RN-14): vagas ≥ ocupadas; fora do rascunho só vagas para cima e turmas.
  function validarPacoteEdicao(c, pacoteId, d) {
    const erros = [];
    const p = pacoteDe(c, pacoteId);
    if (!p) return [{ campo: 'nome', mensagem: 'Pacote não encontrado.' }];
    if (!String(d.nome ?? '').trim()) erros.push({ campo: 'nome', mensagem: 'Dê um nome ao pacote.' });
    const vg = vagasDoPacote(c, p);
    if (!vagasValidas(d.vagas)) erros.push({ campo: 'vagas', mensagem: 'Mínimo 1 vaga.' });
    else if (Number(d.vagas) < vg.ocupadas) erros.push({ campo: 'vagas', mensagem: `Há ${vg.ocupadas} aluno${vg.ocupadas === 1 ? '' : 's'} ocupando vagas.` });
    else if (!editavel(c) && Number(d.vagas) < p.vagas) erros.push({ campo: 'vagas', mensagem: 'Depois do documento as vagas só aumentam — reabra a venda ou faça um aditivo.' });
    if (d.itens) {
      if (!d.itens.length) erros.push({ campo: 'itens', mensagem: 'O pacote precisa de pelo menos um item.' });
      d.itens.forEach((i, idx) => validarItem(i).forEach((e) => erros.push({ campo: `itens.${idx}.${e.campo}`, mensagem: e.mensagem })));
      if (!editavel(c)) {
        const antes = [...p.itens.map(chaveItem)].sort().join(';'); const depois = [...d.itens.map((i) => chaveItem({ ...i, valorBase: numero(i.valorBase), valorFinal: numero(i.valorFinal) }))].sort().join(';');
        if (antes !== depois) erros.push({ campo: 'itens', mensagem: 'Depois do documento só a turma dos itens pode mudar.' });
      }
    }
    return erros;
  }

  // `aplicarAosAlunos`: reescreve os itens dos vínculos NÃO ajustados do pacote com o molde novo (RN-05 [sup.]).
  function atualizarPacote(lista, id, pacoteId, d, { aplicarAosAlunos = false } = {}) {
    return atualizar(lista, id, (c) => {
      if (validarPacoteEdicao(c, pacoteId, d).length) return c;
      const p = pacoteDe(c, pacoteId);
      const itens = d.itens ? d.itens.map((i) => limparMolde({ ...i, valorBase: numero(i.valorBase), valorFinal: numero(i.valorFinal) })) : p.itens;
      const np = { ...p, nome: String(d.nome).trim(), vagas: Number(d.vagas), itens, formacaoId: itens.find((i) => i.formacaoId)?.formacaoId ?? null };
      let nc = { ...c, pacotes: c.pacotes.map((x) => (x.id === pacoteId ? np : x)) };
      let aplicados = 0;
      if (aplicarAosAlunos && d.itens) {
        nc = { ...nc, alunos: nc.alunos.map((v) => {
          if (v.pacoteId !== pacoteId || v.ajustado || v.situacao === 'recusado') return v;
          aplicados += 1;
          return { ...v, itens: copiarMolde(nc, np.itens, v.itens) };
        }) };
      }
      nc.alunos.filter((v) => v.pacoteId === pacoteId).forEach((v) => { nc = recalcularAjustado(nc, v.alunoId); });
      return registrar(nc, `Pacote "${np.nome}" atualizado (${np.vagas} vaga${np.vagas === 1 ? '' : 's'})${aplicados ? ` · molde aplicado a ${aplicados} aluno${aplicados === 1 ? '' : 's'}` : ''}`);
    });
  }

  // Só sem vínculos, em qualquer situação (RN-08).
  const podeRemoverPacote = (c, pacoteId) => editavel(c) && !vinculosDoPacote(c, pacoteId).length;
  function removerPacote(lista, id, pacoteId) {
    return atualizar(lista, id, (c) => (podeRemoverPacote(c, pacoteId) ? registrar({ ...c, pacotes: c.pacotes.filter((p) => p.id !== pacoteId) }, `Pacote "${pacoteDe(c, pacoteId)?.nome}" removido`) : c));
  }

  // [sup.] Duplicar pacote dentro do contrato: mesmo molde e vagas, sem alunos nem link.
  function duplicarPacote(lista, id, pacoteId) {
    return atualizar(lista, id, (c) => {
      const p = pacoteDe(c, pacoteId);
      if (!p || !editavel(c)) return c;
      const np = { ...clonar(p), id: novoId(c.pacotes, 'p'), nome: `${p.nome} (cópia)`, convite: null };
      return registrar({ ...c, pacotes: [...c.pacotes, np] }, `Pacote "${p.nome}" duplicado`);
    });
  }

  // Desconto (%) sobre o valor base (RN-16): geral (moldes + vínculos não ajustados), por pacote, ou por aluno (marca ajustado).
  function aplicarDesconto(lista, id, percentual, { pacoteId = null, alunoId = null } = {}) {
    const pct = Math.min(100, Math.max(0, Number(percentual) || 0));
    const aplicar = (i) => ({ ...i, valorFinal: arred(i.valorBase * (1 - pct / 100)) });
    return atualizar(lista, id, (c) => {
      let nc;
      if (alunoId) {
        nc = { ...c, alunos: c.alunos.map((v) => (v.alunoId === alunoId ? { ...v, itens: v.itens.map(aplicar) } : v)) };
        nc = recalcularAjustado(nc, alunoId);
      } else {
        nc = {
          ...c,
          pacotes: c.pacotes.map((p) => (!pacoteId || p.id === pacoteId ? { ...p, itens: p.itens.map(aplicar) } : p)),
          alunos: c.alunos.map((v) => ((!pacoteId || v.pacoteId === pacoteId) && !v.ajustado ? { ...v, itens: v.itens.map(aplicar) } : v)),
        };
      }
      const alvo = alunoId ? `aos itens de ${alunoId}` : pacoteId ? `ao pacote "${pacoteDe(c, pacoteId)?.nome}"` : 'a todos os pacotes';
      return registrar(nc, `Desconto de ${pct}% aplicado ${alvo}`);
    });
  }

  // ---------- Vínculos (alunos nos pacotes) ----------

  // RN-01: um aluno só uma vez no contrato (recusado pode voltar). Vagas: excedente só com `aumentarVagas` (RF-14 [sup.]).
  function validarVinculoAlunos(c, pacoteId, alunoIds, { aumentarVagas = false } = {}) {
    const erros = [];
    const p = pacoteDe(c, pacoteId);
    if (!p) return ['Pacote não encontrado.'];
    if (!alunoIds.length) erros.push('Escolha pelo menos um aluno.');
    const ja = alunoIds.filter((a) => { const v = vinculoDe(c, a); return v && v.situacao !== 'recusado'; });
    if (ja.length) erros.push(`${ja.length} aluno${ja.length === 1 ? ' já está' : 's já estão'} nesta venda (um pacote por aluno).`);
    const novos = alunoIds.length - ja.length;
    const livres = vagasDoPacote(c, p).livres;
    if (novos > livres && !aumentarVagas) erros.push(livres ? `Só ${livres} vaga${livres === 1 ? '' : 's'} livre${livres === 1 ? '' : 's'} — aumente as vagas do pacote.` : 'Sem vaga livre — aumente as vagas do pacote.');
    return erros;
  }

  // Cria (ou reativa, se recusado) o vínculo: copia o molde, código sequencial, situação/origem (RN-03, RN-19, RN-24).
  function vincularAlunos(lista, id, pacoteId, alunoIds, { origem = 'escola', situacao = 'aprovado', aumentarVagas = false, em = agora(), por = 'Ana Souza' } = {}) {
    return atualizar(lista, id, (c) => {
      if (validarVinculoAlunos(c, pacoteId, alunoIds, { aumentarVagas }).length) return c;
      let nc = c;
      const p = pacoteDe(c, pacoteId);
      const novos = alunoIds.filter((a) => !vinculoDe(c, a) || vinculoDe(c, a).situacao === 'recusado').length;
      const faltam = Math.max(0, novos - vagasDoPacote(c, p).livres);
      if (faltam) nc = { ...nc, pacotes: nc.pacotes.map((x) => (x.id === pacoteId ? { ...x, vagas: x.vagas + faltam } : x)) };
      alunoIds.forEach((alunoId) => {
        const ex = vinculoDe(nc, alunoId);
        if (ex && ex.situacao !== 'recusado') return;
        const v = { alunoId, pacoteId, situacao, origem, codigo: ex?.codigo ?? proximoCodigoMatricula(nc), itens: copiarMolde(nc, p.itens), ajustado: false, entrouEm: em, conferidoEm: situacao === 'aprovado' ? em : null, recusa: null };
        nc = { ...nc, alunos: ex ? nc.alunos.map((x) => (x.alunoId === alunoId ? v : x)) : [...nc.alunos, v] };
      });
      const n = alunoIds.length;
      return registrar(nc, `${n} aluno${n === 1 ? '' : 's'} vinculado${n === 1 ? '' : 's'} ao pacote "${p.nome}"${situacao === 'aguardando' ? ' — aguardando conferência' : ''}${faltam ? ` · vagas aumentadas em ${faltam}` : ''}`, por);
    });
  }

  // Conferência (RN-22/RN-23).
  function aprovarAluno(lista, id, alunoId, por = 'Ana Souza') {
    return atualizar(lista, id, (c) => {
      const v = vinculoDe(c, alunoId);
      if (!v || v.situacao !== 'aguardando') return c;
      return registrar({ ...c, alunos: c.alunos.map((x) => (x.alunoId === alunoId ? { ...x, situacao: 'aprovado', conferidoEm: agora() } : x)) }, `Aluno ${alunoId} aprovado na conferência`, por);
    });
  }

  const validarRecusa = (motivo) => (String(motivo ?? '').trim() ? [] : [{ campo: 'motivo', mensagem: 'Informe o motivo da recusa.' }]);
  function recusarAluno(lista, id, alunoId, motivo, por = 'Ana Souza') {
    return atualizar(lista, id, (c) => {
      const v = vinculoDe(c, alunoId);
      if (!v || v.situacao !== 'aguardando' || validarRecusa(motivo).length) return c;
      const m = String(motivo).trim();
      return registrar({ ...c, alunos: c.alunos.map((x) => (x.alunoId === alunoId ? { ...x, situacao: 'recusado', conferidoEm: agora(), recusa: { em: agora(), motivo: m } } : x)) }, `Aluno ${alunoId} recusado — vaga liberada: ${m}`, por);
    });
  }

  // Em rascunho apaga o vínculo; depois do documento vira desistente (vaga liberada) com as matrículas "desistiu" (RN-08).
  function removerAluno(lista, id, alunoId, motivo = null) {
    return atualizar(lista, id, (c) => {
      const v = vinculoDe(c, alunoId);
      if (!v) return c;
      if (editavel(c) || v.situacao === 'aguardando') return registrar({ ...c, alunos: c.alunos.filter((x) => x.alunoId !== alunoId) }, 'Aluno removido da venda');
      const canc = cancelamentoDe(motivo);
      return registrar({ ...c, alunos: c.alunos.map((x) => (x.alunoId === alunoId ? { ...x, situacao: 'desistente', itens: x.itens.map((m) => (matriculaAtiva(m) ? { ...m, status: 'desistiu', cancelamento: canc } : m)) } : x)) }, `Aluno marcado como desistente — vaga liberada${canc.tipo !== 'nao_informado' ? ` (${motivoCancelamentoDe(canc.tipo).toLowerCase()})` : ''}`);
    });
  }

  // Motivo do cancelamento da matrícula: `motivo` = { tipo, texto } (MOTIVOS_CANCELAMENTO) ou nada → "não informado".
  const motivoCancelamentoDe = (id) => MOTIVOS_CANCELAMENTO.find((m) => m.id === id)?.nome ?? 'Não informado';
  const cancelamentoDe = (motivo, tipoPadrao = 'nao_informado') => ({ em: agora(), tipo: motivo?.tipo || tipoPadrao, texto: String(motivo?.texto ?? '').trim() });

  // ---------- Itens do aluno (ajustes individuais, RN-04) ----------

  const alterarVinculo = (c, alunoId, fn) => recalcularAjustado({ ...c, alunos: c.alunos.map((v) => (v.alunoId === alunoId ? fn(v) : v)) }, alunoId);

  // `motivo` = { tipo, texto } quando o novo status é "desistiu"; voltar para matriculado/concluído limpa o cancelamento.
  function alterarStatusMatricula(lista, id, itemId, status, motivo = null) {
    return atualizar(lista, id, (c) => {
      const it = itemDe(c, itemId);
      const cancelamento = status === 'desistiu' ? cancelamentoDe(motivo) : status === 'cancelada' ? cancelamentoDe(motivo, 'contrato') : null;
      return it ? alterarVinculo(c, it.alunoId, (v) => ({ ...v, itens: v.itens.map((m) => (m.id === itemId ? { ...m, status, cancelamento } : m)) })) : c;
    });
  }

  // ---------- Congelar / retomar a matrícula do aluno (03/09/2026) ----------
  // Pausa por aluno, não por item: quem congela some das aulas e das contas de frequência
  // (docs/pedagogico.md), mas SEGUE ocupando a vaga e valendo no contrato [sup.] — por isso
  // não é desistência. Só faz sentido em contrato fechado: em rascunho ninguém está cursando.
  const itensCongelaveis = (v) => (v?.itens ?? []).filter((m) => m.status === 'matriculado');
  const itensCongelados = (v) => (v?.itens ?? []).filter((m) => m.status === 'congelada');
  const podeCongelar = (c, alunoId) => c.status !== 'rascunho' && c.status !== 'cancelado' && itensCongelaveis(vinculoDe(c, alunoId)).length > 0;
  const podeRetomar = (c, alunoId) => c.status !== 'cancelado' && itensCongelados(vinculoDe(c, alunoId)).length > 0;

  function congelarAluno(lista, id, alunoId, texto = '') {
    return atualizar(lista, id, (c) => {
      if (!podeCongelar(c, alunoId)) return c;
      const em = hoje();
      const n = itensCongelaveis(vinculoDe(c, alunoId)).length;
      const nome = Clientes.porId(Clientes.carregar().alunos, alunoId)?.nome ?? alunoId;
      return registrar(alterarVinculo(c, alunoId, (v) => ({
        ...v,
        itens: v.itens.map((m) => (m.status === 'matriculado' ? { ...m, status: 'congelada', congelamento: { em, texto: String(texto ?? '').trim() } } : m)),
      })), `Matrícula de ${nome} congelada em ${n} ${n === 1 ? 'item' : 'itens'}${String(texto ?? '').trim() ? ` — ${String(texto).trim()}` : ''}`);
    });
  }

  function retomarAluno(lista, id, alunoId) {
    return atualizar(lista, id, (c) => {
      if (!podeRetomar(c, alunoId)) return c;
      const n = itensCongelados(vinculoDe(c, alunoId)).length;
      const nome = Clientes.porId(Clientes.carregar().alunos, alunoId)?.nome ?? alunoId;
      return registrar(alterarVinculo(c, alunoId, (v) => ({
        ...v,
        itens: v.itens.map((m) => (m.status === 'congelada' ? { ...m, status: 'matriculado', congelamento: null } : m)),
      })), `Matrícula de ${nome} retomada em ${n} ${n === 1 ? 'item' : 'itens'}`);
    });
  }

  function validarItem(d) {
    const erros = [];
    const base = numero(d.valorBase); const fin = numero(d.valorFinal);
    if (base == null || Number.isNaN(base) || base < 0) erros.push({ campo: 'valorBase', mensagem: 'Valor base inválido.' });
    if (fin == null || Number.isNaN(fin) || fin < 0) erros.push({ campo: 'valorFinal', mensagem: 'Valor final inválido.' });
    if (base != null && fin != null && fin > base) erros.push({ campo: 'valorFinal', mensagem: 'Valor final não pode ser maior que o base.' });
    return erros;
  }

  function atualizarItem(lista, id, itemId, d) {
    return atualizar(lista, id, (c) => {
      const it = itemDe(c, itemId);
      if (!it) return c;
      return registrar(alterarVinculo(c, it.alunoId, (v) => ({ ...v, itens: v.itens.map((i) => (i.id === itemId ? { ...i, turmaId: d.turmaId || null, valorBase: arred(numero(d.valorBase)), valorFinal: arred(numero(d.valorFinal)) } : i)) })), 'Item ajustado');
    });
  }

  // Acrescenta modelos aos itens de um aluno (ignora curso repetido do mesmo grupo).
  function acrescentarItensAluno(c, alunoId, modelos) {
    return alterarVinculo(c, alunoId, (v) => {
      const novos = modelos.filter((m) => !v.itens.some((i) => i.cursoId === m.cursoId && (i.formacaoId ?? null) === (m.formacaoId ?? null)));
      return { ...v, itens: [...v.itens, ...copiarMolde(c, novos)] };
    });
  }

  function adicionarFormacao(lista, ctx, id, alunoId, formacaoId) {
    return atualizar(lista, id, (c) => {
      const v = vinculoDe(c, alunoId);
      if (!v || v.itens.some((i) => i.formacaoId === formacaoId)) return c;
      const f = formacaoDe(ctx, formacaoId);
      const nc = acrescentarItensAluno(c, alunoId, modelosItens(ctx, { venda: 'formacao', formacaoId }));
      return registrar({ ...nc, cobranca: { ...nc.cobranca, parcelas: Math.max(nc.cobranca.parcelas || 1, f?.comercial.parcelasMax || 1) } }, `Formação ${f?.nome ?? formacaoId} adicionada para ${alunoId}`);
    });
  }

  function adicionarCursos(lista, ctx, id, alunoId, cursoIds) {
    return atualizar(lista, id, (c) => {
      if (!vinculoDe(c, alunoId)) return c;
      const nc = acrescentarItensAluno(c, alunoId, modelosItens(ctx, { venda: 'cursos', cursoIds }));
      const n = vinculoDe(nc, alunoId).itens.length - vinculoDe(c, alunoId).itens.length;
      return registrar(nc, `${n} curso(s) avulso(s) adicionado(s) para ${alunoId}`);
    });
  }

  // Copia os itens ativos de outro aluno (do mesmo pacote ou não) para este.
  function copiarItens(lista, id, deAlunoId, paraAlunoId) {
    return atualizar(lista, id, (c) => {
      const de = vinculoDe(c, deAlunoId); const para = vinculoDe(c, paraAlunoId);
      if (!de || !para) return c;
      const nc = alterarVinculo(c, paraAlunoId, (v) => ({ ...v, itens: copiarMolde(c, de.itens.filter(matriculaAtiva).map(limparMolde), v.itens) }));
      return registrar(nc, `Itens de ${deAlunoId} copiados para ${paraAlunoId}`);
    });
  }

  function removerItem(lista, id, itemId) {
    return atualizar(lista, id, (c) => {
      const it = itemDe(c, itemId);
      return it ? registrar(alterarVinculo(c, it.alunoId, (v) => ({ ...v, itens: v.itens.filter((i) => i.id !== itemId) })), 'Curso removido do aluno') : c;
    });
  }

  function removerFormacao(lista, id, alunoId, formacaoId) {
    return atualizar(lista, id, (c) => (vinculoDe(c, alunoId) ? registrar(alterarVinculo(c, alunoId, (v) => ({ ...v, itens: v.itens.filter((i) => i.formacaoId !== formacaoId) })), 'Formação removida do aluno') : c));
  }

  // Volta os itens do aluno ao molde do pacote (desfaz os ajustes).
  function restaurarMolde(lista, id, alunoId) {
    return atualizar(lista, id, (c) => {
      const v = vinculoDe(c, alunoId); const p = v && pacoteDe(c, v.pacoteId);
      if (!p) return c;
      return registrar(alterarVinculo(c, alunoId, (x) => ({ ...x, itens: copiarMolde(c, p.itens, x.itens) })), `Itens de ${alunoId} voltaram ao molde do pacote`);
    });
  }

  // ---------- Link do pacote (RN-17 a RN-21) ----------

  const gerarToken = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');
  const paginaAluno = (variante) => (variante === 'passos' ? 'cadastro-aluno-steps.html' : 'cadastro-aluno.html');
  const baseUrl = () => (typeof location === 'undefined' ? '' : `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`);
  const urlConvitePacote = (p, variante = 'formulario') => `${baseUrl()}${paginaAluno(variante)}?pacote=${p.convite?.token ?? ''}`;

  // Por que o link está (ou não) aberto — RN-18.
  function situacaoConvite(c, p) {
    if (!p.convite) return 'sem_link';
    if (c.status === 'cancelado') return 'cancelado';
    if (!p.convite.ativo) return 'desativado';
    if (!c.contratante) return 'sem_contratante';
    if (vagasDoPacote(c, p).livres <= 0) return 'sem_vaga';
    return 'aberto';
  }
  const conviteAberto = (c, p) => situacaoConvite(c, p) === 'aberto';
  // Texto da página pública de cadastro quando o link não está aberto — o aluno precisa saber se é temporário ou definitivo.
  const AVISOS_CONVITE_PUBLICO = {
    sem_contratante: { titulo: 'Link ainda não liberado', texto: 'A ProWay ainda está finalizando este contrato. Tente de novo mais tarde ou fale com quem enviou o link.' },
    sem_vaga: { titulo: 'Vagas esgotadas', texto: 'Todas as vagas deste link já foram preenchidas. Fale com a ProWay para verificar outra turma.' },
    desativado: { titulo: 'Link desativado', texto: 'Este link foi desativado pela ProWay e não está mais aceitando cadastros. Fale com quem enviou o link.' },
    cancelado: { titulo: 'Link encerrado', texto: 'O contrato deste link foi cancelado. Fale com a ProWay.' },
    sem_link: { titulo: 'Link inválido ou expirado', texto: 'Peça um novo link para a ProWay pelo WhatsApp ou e-mail.' },
  };
  const avisoConvitePublico = (c, p) => AVISOS_CONVITE_PUBLICO[situacaoConvite(c, p)] ?? { titulo: 'Link encerrado', texto: 'Este link não está mais aceitando cadastros. Fale com a ProWay.' };
  const SITUACOES_CONVITE = {
    aberto: 'Aberto', desativado: 'Link desativado', sem_vaga: 'Sem vaga livre', sem_contratante: 'Falta definir o contratante', cancelado: 'Venda cancelada', sem_link: 'Link ainda não gerado',
  };

  function gerarConvitePacote(lista, id, pacoteId) {
    return atualizar(lista, id, (c) => {
      const p = pacoteDe(c, pacoteId);
      if (!p || c.status === 'cancelado') return c;
      const nc = { ...c, pacotes: c.pacotes.map((x) => (x.id === pacoteId ? { ...x, convite: { token: gerarToken(), criadoEm: agora(), ativo: true, usos: [] } } : x)) };
      return registrar(nc, `Link de cadastro do pacote "${p.nome}" ${p.convite ? 'renovado (o anterior deixou de valer)' : 'gerado'}`);
    });
  }

  function alterarConvitePacote(lista, id, pacoteId, patch) {
    return atualizar(lista, id, (c) => {
      const p = pacoteDe(c, pacoteId);
      if (!p?.convite) return c;
      return { ...c, pacotes: c.pacotes.map((x) => (x.id === pacoteId ? { ...x, convite: { ...x.convite, ...('ativo' in patch ? { ativo: Boolean(patch.ativo) } : {}) } } : x)) };
    });
  }

  function pacotePorConvite(lista, token) {
    if (!token) return null;
    for (const c of lista) { const p = c.pacotes.find((x) => x.convite?.token === token); if (p) return { contrato: c, pacote: p }; }
    return null;
  }

  // Mensagem padrão de WhatsApp/e-mail (RF-16).
  const mensagemConvite = (ctx, c, p, url) => `Olá! Para entrar no ${p.nome} do contrato ${c.codigo} da ProWay${empresaDe(ctx, c) ? ` (${nomeEmpresa(empresaDe(ctx, c))})` : ''}, preencha seu cadastro neste link: ${url}`;

  // Dados mascarados de um cadastro existente (RN-20): "Maria S. L.", "m***@dominio", "(47) 9****-1234".
  function mascarar(a) {
    const partes = String(a.nome ?? '').split(' ').filter(Boolean);
    const nome = partes.map((p, i) => (i === 0 ? p : `${p[0]}.`)).join(' ');
    const [user = '', dom = ''] = String(a.email ?? '').split('@');
    const email = a.email ? `${user[0] ?? ''}***@${dom}` : '';
    const cel = Clientes.digitos(a.celular);
    const celular = cel.length === 11 ? `(${cel.slice(0, 2)}) ${cel[2]}****-${cel.slice(7)}` : cel ? `${cel.slice(0, 2)}*****${cel.slice(-2)}` : '';
    return { nome, email, celular };
  }

  const alunoPorCpf = (dadosClientes, cpf) => { const d = Clientes.digitos(cpf); return d.length === 11 ? dadosClientes.alunos.find((a) => a.cpf === d) ?? null : null; };

  // GET /publico/pacote/{token}/cpf/{cpf}: existe? já está no contrato? dados mascarados + campos não sensíveis para pré-preencher.
  function consultarCpfPacote(lista, dadosClientes, token, cpf) {
    const alvo = pacotePorConvite(lista, token);
    const a = alunoPorCpf(dadosClientes, cpf);
    if (!alvo || !a) return { existe: false, jaNoContrato: false, mascarado: null, preencher: null };
    const v = vinculoDe(alvo.contrato, a.id);
    return { existe: true, jaNoContrato: Boolean(v && v.situacao !== 'recusado'), mascarado: mascarar(a), preencher: preencherDoExistente(a) };
  }

  // O que o formulário pode receber do cadastro existente sem revelar o que está mascarado (nome, e-mail, celular ficam em branco).
  const preencherDoExistente = (a) => ({
    nomeSocial: a.nomeSocial, rg: a.rg, nascimento: a.nascimento, genero: a.genero ?? '', escolaridade: a.escolaridade ?? '', profissao: a.profissao, cargo: a.cargo, telefone: a.telefone,
    endereco: { ...a.endereco }, necessidades: { tipos: [...(a.necessidades?.tipos ?? [])], detalhes: a.necessidades?.detalhes ?? '', atendimento: a.necessidades?.atendimento ?? '' },
    comunicacoes: Boolean(a.consentimentos?.comunicacoes), imagem: Boolean(a.consentimentos?.imagem),
  });

  // Ajusta o que o aluno mandou ao contrato: empresa → colaborador pago pela empresa; particular → o pagador é o
  // responsável do contrato (Responsável cadastrado vira "outra pessoa"; aluno responsável → "o próprio") — RN-21 [sup.].
  function dadosParaContrato(dadosClientes, c, d) {
    if (c.contratante === 'empresa') return { ...d, pagador: 'empresa', empresaId: c.empresaId };
    if (c.responsavel?.tipo === 'responsavel') {
      const r = porId(dadosClientes.responsaveis ?? [], c.responsavel.id);
      if (r) return { ...d, empresaId: null, pagador: 'terceiro', responsavel: { nome: r.nome, cpf: r.cpf, parentesco: '', email: r.email, celular: r.celular } };
    }
    return { ...d, empresaId: null, pagador: 'proprio', responsavel: { nome: '', cpf: '', parentesco: '', email: '', celular: '' } };
  }

  function validarCadastroPeloPacote(dadosClientes, c, p, d) {
    const existente = alunoPorCpf(dadosClientes, d.cpf);
    const v = existente ? vinculoDe(c, existente.id) : null;
    if (v && v.situacao !== 'recusado') return { erros: [{ campo: 'cpf', mensagem: 'Você já está neste contrato.' }], existente, jaNoContrato: true };
    const dd = dadosParaContrato(dadosClientes, c, d);
    // Quem paga é o responsável do contrato: pendências de "quem paga"/menor sem responsável não se aplicam aqui.
    const erros = Clientes.validarPreenchimentoAluno(dd, dadosClientes.alunos, existente ? existente.id : null).filter((e) => e.campo !== 'pagador' && !String(e.campo).startsWith('responsavel.'));
    return { erros, existente, jaNoContrato: false };
  }

  // Grava nos dois lados (RN-19/RN-20): cria ou reaproveita o aluno em Clientes e o vincula ao pacote como "aguardando".
  function cadastrarPeloLinkPacote(lista, dadosClientes, token, d) {
    const alvo = pacotePorConvite(lista, token);
    if (!alvo || !conviteAberto(alvo.contrato, alvo.pacote)) return { lista, dados: dadosClientes, erros: [{ campo: 'nome', mensagem: 'Este link não está mais disponível.' }] };
    const { contrato: c, pacote: p } = alvo;
    const { erros, existente } = validarCadastroPeloPacote(dadosClientes, c, p, d);
    if (erros.length) return { lista, dados: dadosClientes, erros };
    const em = new Date().toISOString();
    const empresa = c.contratante === 'empresa';
    const { dados, alunoId } = Clientes.cadastrarAlunoPublico(dadosClientes, dadosParaContrato(dadosClientes, c, d), {
      idReaproveitar: existente ? existente.id : null, empresaId: empresa ? c.empresaId : null, origem: empresa ? 'empresa' : null,
      convite: { criadoEm: p.convite.criadoEm.slice(0, 10), preenchidoEm: em, via: 'pacote', contratoId: c.id, pacoteId: p.id },
    });
    const nomeAluno = porId(dados.alunos, alunoId)?.nome ?? alunoId;
    let nl = vincularAlunos(lista, c.id, p.id, [alunoId], { origem: 'link', situacao: 'aguardando', em: em.slice(0, 19), por: 'Aluno' });
    if (c.contratante === 'particular' && !c.responsavel) nl = atualizar(nl, c.id, (x) => ({ ...x, responsavel: { tipo: 'aluno', id: alunoId } }));
    nl = atualizar(nl, c.id, (x) => registrar({ ...x, pacotes: x.pacotes.map((y) => (y.id === p.id ? { ...y, convite: { ...y.convite, usos: [...y.convite.usos, { alunoId, em }] } } : y)) }, `Aluno ${nomeAluno} entrou pelo link do pacote "${p.nome}"${existente ? ' (cadastro existente reaproveitado)' : ''}`, 'Aluno'));
    nl = regerarParcelas(nl, c.id);
    return { lista: nl, dados: sincronizarAlunosComContrato(dados, porId(nl, c.id), [alunoId]), erros: [], alunoId };
  }

  // ---------- Duplicar (RN-28 a RN-31) ----------

  const OPCOES_DUPLICAR_PADRAO = { vagas: true, condicao: true, descricao: true, vendedor: true, alunos: false, contratante: false, turmas: 'definir', valores: 'negociado' };

  // Itens do contrato cujo preço de catálogo hoje difere do valor base original (RN-31).
  function avisosTabela(ctx, c) {
    const avisos = [];
    c.pacotes.forEach((p) => p.itens.forEach((it) => {
      const ref = referenciaCatalogo(ctx, it);
      if (ref != null && arred(ref) !== arred(it.valorBase)) avisos.push({ pacoteId: p.id, pacote: p.nome, cursoId: it.cursoId, rotulo: rotuloItem(ctx, it), original: arred(it.valorBase), atual: arred(ref) });
    }));
    return avisos;
  }

  function previaDuplicar(ctx, c, op = {}) {
    const o = { ...OPCOES_DUPLICAR_PADRAO, ...op };
    const alunos = o.alunos ? c.alunos.filter(ocupaVaga) : [];
    const vagas = c.pacotes.reduce((s, p) => s + (o.vagas ? p.vagas : Math.max(1, alunos.filter((v) => v.pacoteId === p.id).length)), 0);
    return { nPacotes: c.pacotes.length, vagas, nAlunos: alunos.length, avisos: avisosTabela(ctx, c), opcoes: o };
  }

  function duplicar(lista, ctx, id, op = {}, { vendedorAtual = 'ana', por = 'Ana Souza' } = {}) {
    const c = porId(lista, id);
    if (!c) return { lista, contrato: null, avisos: [] };
    const o = { ...OPCOES_DUPLICAR_PADRAO, ...op };
    const avisos = avisosTabela(ctx, c);
    const criadoEm = agora();
    const ajustarItem = (it) => {
      const aviso = avisos.find((a) => a.cursoId === it.cursoId && arred(a.original) === arred(it.valorBase));
      const ref = referenciaCatalogo(ctx, it);
      const base = { ...it, turmaId: o.turmas === 'manter' ? it.turmaId ?? null : null };
      if (o.valores === 'tabela' && ref != null) return { ...base, valorBase: arred(ref), valorFinal: arred(ref), ...(aviso ? { avisoTabela: { original: aviso.original, atual: aviso.atual } } : {}) };
      return aviso && ref != null && arred(ref) !== arred(it.valorBase) ? { ...base, avisoTabela: { original: arred(it.valorBase), atual: arred(ref) } } : base;
    };
    const alunosOrigem = o.alunos ? c.alunos.filter(ocupaVaga) : [];
    const pacotes = c.pacotes.map((p) => ({
      id: p.id, nome: p.nome, formacaoId: p.formacaoId ?? null, itens: p.itens.map((it) => limparMolde(ajustarItem(it))),
      vagas: o.vagas ? p.vagas : Math.max(1, alunosOrigem.filter((v) => v.pacoteId === p.id).length), convite: null,
    }));
    let nc = contratoSeed({
      id: novoId(lista, 'ct'), codigo: proximoCodigo(lista, criadoEm), criadoEm, status: 'rascunho', vendedorId: o.vendedor ? c.vendedorId : vendedorAtual, centroReceitaId: c.centroReceitaId,
      descricao: o.descricao ? c.descricao : '', observacoes: o.descricao ? c.observacoes : '',
      contratante: o.contratante ? c.contratante : null, empresaId: o.contratante ? c.empresaId : null, responsavel: o.contratante && c.responsavel ? { ...c.responsavel } : null,
      pacotes, alunos: [],
      cobranca: o.condicao ? { ...c.cobranca } : { forma: 'boleto', parcelas: c.cobranca.parcelas || 1, primeiroVencimento: '', pedidoCompra: '' },
      duplicadoDe: c.id,
    });
    alunosOrigem.forEach((v) => {
      const itens = v.itens.filter(matriculaAtiva).map((it) => ({ ...limparMolde(ajustarItem(it)), status: 'matriculado' }));
      const codigo = proximoCodigoMatricula(nc);
      nc = { ...nc, alunos: [...nc.alunos, { alunoId: v.alunoId, pacoteId: v.pacoteId, situacao: 'aprovado', origem: 'escola', codigo, itens: copiarMolde(nc, itens), ajustado: false, entrouEm: criadoEm, conferidoEm: criadoEm, recusa: null }] };
      nc = recalcularAjustado(nc, v.alunoId);
    });
    nc = registrar(nc, `Duplicado de ${c.codigo}${avisos.length ? ` · ${avisos.length} item(ns) com preço de tabela diferente do original` : ''}`, por);
    const nl = regerarParcelas([...lista, nc], nc.id);
    return { lista: nl, contrato: porId(nl, nc.id), avisos };
  }

  // ---------- Cobrança (parcelas / boletos) ----------

  function gerarParcelas(valor, n, primeiroVencimento) {
    const qtd = Math.max(1, Number(n) || 1);
    const cada = Math.floor((arred(valor) * 100) / qtd) / 100;
    const resto = arred(arred(valor) - cada * qtd);
    const [y, m, d] = primeiroVencimento.split('-').map(Number);
    return Array.from({ length: qtd }, (_, i) => {
      const dt = new Date(y, m - 1 + i, 1);
      const ultimo = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
      const venc = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(Math.min(d, ultimo)).padStart(2, '0')}`;
      return { n: i + 1, vencimento: venc, valor: arred(i === 0 ? cada + resto : cada), status: 'prevista', emitidaEm: null, pagoEm: null };
    });
  }

  const parcelasTravadas = (c) => c.parcelas.some((p) => p.status === 'emitida' || p.status === 'paga');
  // RN-15: depois da 1ª emissão as parcelas não acompanham o valor — a UI avisa a divergência.
  const parcelasDivergem = (c) => c.parcelas.length > 0 && Math.abs(c.parcelas.reduce((s, p) => s + (p.status === 'cancelada' ? 0 : p.valor), 0) - totais(c).final) > 0.01;

  function validarCobranca(c, d) {
    const erros = [];
    const n = Number(d.parcelas);
    if (!Number.isInteger(n) || n < 1 || n > 48) erros.push({ campo: 'parcelas', mensagem: 'Entre 1 e 48 parcelas.' });
    if (!d.primeiroVencimento) erros.push({ campo: 'primeiroVencimento', mensagem: 'Informe o 1º vencimento.' });
    if (!FORMAS_COBRANCA.some((f) => f.id === d.forma)) erros.push({ campo: 'forma', mensagem: 'Escolha a forma.' });
    if (parcelasTravadas(c) && (n !== c.cobranca.parcelas || d.primeiroVencimento !== c.cobranca.primeiroVencimento)) erros.push({ campo: 'parcelas', mensagem: 'Já há boleto emitido/pago — cancele a venda ou renegocie para mudar o parcelamento.' });
    return erros;
  }

  function definirCobranca(lista, id, d) {
    return atualizar(lista, id, (c) => {
      const cobranca = { forma: d.forma, parcelas: Number(d.parcelas), primeiroVencimento: d.primeiroVencimento, pedidoCompra: String(d.pedidoCompra ?? '').trim() };
      const parcelas = parcelasTravadas(c) ? c.parcelas : gerarParcelas(totais(c).final, cobranca.parcelas, cobranca.primeiroVencimento);
      return registrar({ ...c, cobranca, parcelas }, parcelasTravadas(c) ? 'Condição de cobrança atualizada' : `${cobranca.parcelas} parcela(s) gerada(s) a partir de ${fmtData(cobranca.primeiroVencimento)}`);
    });
  }

  // Regera as parcelas previstas quando o valor do contrato mudou (só as não emitidas).
  function regerarParcelas(lista, id) {
    return atualizar(lista, id, (c) => {
      if (parcelasTravadas(c) || !c.cobranca.primeiroVencimento) return c;
      return { ...c, parcelas: gerarParcelas(totais(c).final, c.cobranca.parcelas, c.cobranca.primeiroVencimento) };
    });
  }

  function emitirBoletos(lista, ctx, id, ns = null) {
    return atualizar(lista, id, (c) => {
      if (pendenciasEmissao(ctx, c).length) return c;
      const alvo = c.parcelas.filter((p) => p.status === 'prevista' && (!ns || ns.includes(p.n)));
      if (!alvo.length) return c;
      const em = hoje();
      return registrar({ ...c, parcelas: c.parcelas.map((p) => (alvo.includes(p) ? { ...p, status: 'emitida', emitidaEm: em } : p)) }, alvo.length === 1 ? `Boleto ${alvo[0].n}/${c.parcelas.length} emitido` : `Boletos ${alvo.map((p) => p.n).join(', ')} emitidos`);
    });
  }

  // Baixa manual: data e valor que entraram. Abaixo do valor da parcela é pagamento parcial, que vira acordo.
  function validarPagamento(p, d, ref = hoje()) {
    const erros = [];
    if (!d.pagoEm) erros.push({ campo: 'pagoEm', mensagem: 'Informe a data do pagamento.' });
    else if (d.pagoEm > ref) erros.push({ campo: 'pagoEm', mensagem: 'A data não pode ser futura.' });
    const v = numero(d.valorPago);
    if (!(v > 0)) erros.push({ campo: 'valorPago', mensagem: 'Informe o valor pago.' });
    else if (v < p.valor - 0.005) erros.push({ campo: 'valorPago', mensagem: `Menor que a parcela (${fmtMoeda(p.valor)}). Pagamento parcial se registra como acordo de recuperação.` });
    return erros;
  }

  function registrarPagamento(lista, id, n, pagoEm = hoje(), valorPago = null) {
    return atualizar(lista, id, (c) => registrar({ ...c, parcelas: c.parcelas.map((p) => (p.n === n ? { ...p, status: 'paga', pagoEm, valorPago: valorPago == null ? null : arred(numero(valorPago)) } : p)) }, `Parcela ${n}/${c.parcelas.length} paga em ${fmtData(pagoEm)}${valorPago == null ? '' : ` (${fmtMoeda(numero(valorPago))})`}`));
  }

  function estornarPagamento(lista, id, n) {
    return atualizar(lista, id, (c) => registrar({ ...c, parcelas: c.parcelas.map((p) => (p.n === n ? { ...p, status: p.emitidaEm ? 'emitida' : 'prevista', pagoEm: null, valorPago: null } : p)) }, `Pagamento da parcela ${n}/${c.parcelas.length} estornado`));
  }

  // ---------- Documento, assinatura, NF, fluxo ----------

  const podeGerarDocumento = (ctx, c) => c.status !== 'cancelado' && !pendenciasDocumento(ctx, c).length && !envelopeEmAndamento(c);

  function gerarDocumento(lista, ctx, id) {
    return atualizar(lista, id, (c) => {
      if (!podeGerarDocumento(ctx, c)) return c;
      const versao = (c.documento?.versao ?? 0) + 1;
      const nc = { ...c, documento: { geradoEm: agora(), versao }, status: c.status === 'rascunho' ? 'aguardando' : c.status };
      return registrar(nc, `Documento gerado (v${versao})`);
    });
  }

  // Anexo vivo (RN-25): alunos aprovados e a data da última mudança neles depois do documento.
  function anexoAlunos(c) {
    const aprovados = c.alunos.filter((v) => v.situacao === 'aprovado');
    const datas = c.alunos.map((v) => v.conferidoEm ?? v.entrouEm).filter(Boolean).sort();
    const ultima = datas[datas.length - 1] ?? null;
    return { aprovados, atualizadoEm: c.documento && ultima && ultima >= c.documento.geradoEm ? ultima : null };
  }

  const temAlgumaAssinatura = (c) => Boolean(assinaturaDe(c, 'contratante') || assinaturaDe(c, 'escola'));
  const podeReabrir = (c) => c.status === 'aguardando' && !temAlgumaAssinatura(c) && !parcelasTravadas(c) && !envelopeEmAndamento(c);
  function reabrir(lista, id) {
    return atualizar(lista, id, (c) => (podeReabrir(c) ? registrar({ ...c, status: 'rascunho' }, 'Venda reaberta para edição') : c));
  }

  // ---------- Clicksign (simulado) ----------

  const envelopeAtual = (c) => { const l = c.envelopes ?? []; return l[l.length - 1] ?? null; };
  const envelopeEmAndamento = (c) => { const e = envelopeAtual(c); return e && e.status === 'enviado' ? e : null; };
  const envelopePendente = (c) => { const e = envelopeAtual(c); return e && (e.status === 'enviado' || e.status === 'recusado') ? e : null; };
  const signatariosPendentes = (e) => e.signatarios.filter((s) => s.status === 'pendente');
  const signatariosRecusaram = (e) => e.signatarios.filter((s) => s.status === 'recusado');
  const statusEnvelopeDe = (e) => STATUS_ENVELOPE.find((s) => s.id === e.status);

  const podeEnviarClicksign = (c) => c.status === 'aguardando' && Boolean(c.documento) && !assinado(c) && !envelopeEmAndamento(c);
  const podeRegistrarAssinaturaManual = (c) => c.status === 'aguardando' && Boolean(c.documento) && !assinado(c) && !envelopeEmAndamento(c);

  // Signatários: contratante (empresa / responsável / aluno) obrigatório, alunos aprovados opcionais, escola obrigatória.
  function signatariosSugeridos(ctx, c) {
    const r = responsavelFinanceiro(ctx, c);
    const lista = [];
    if (!assinaturaDe(c, 'contratante')) {
      if (r.tipo === 'empresa' && r.empresa) {
        const ct = Clientes.contatoPrincipal ? Clientes.contatoPrincipal(r.empresa) : (r.empresa.contatos.find((x) => x.principal) ?? r.empresa.contatos[0] ?? null);
        lista.push({ id: 'contratante', papel: 'contratante', nome: ct ? `${ct.nome} (${nomeEmpresa(r.empresa)})` : nomeEmpresa(r.empresa), email: ct?.email || r.empresa.email || '', obrigatorio: true, detalhe: ct ? `${ct.cargo || 'contato principal'} · CNPJ ${r.documento}` : `sem contato principal · CNPJ ${r.documento}` });
      } else if (r.tipo === 'responsavel' && r.responsavel) {
        lista.push({ id: 'contratante', papel: 'contratante', nome: r.nome, email: r.email || '', obrigatorio: true, responsavelId: r.responsavel.id, detalhe: `responsável financeiro · CPF ${r.documento}` });
      } else if (r.tipo === 'terceiro') {
        lista.push({ id: 'contratante', papel: 'contratante', nome: r.nome, email: r.email || r.aluno.email || '', obrigatorio: true, alunoId: r.aluno.id, detalhe: `responsável (${r.parentesco || 'terceiro'}) por ${r.aluno.nome} · CPF ${r.documento}` });
      } else if (r.aluno) {
        lista.push({ id: 'contratante', papel: 'contratante', nome: r.nome, email: r.email || '', obrigatorio: true, alunoId: r.aluno.id, detalhe: `o próprio aluno · CPF ${r.documento}` });
      }
    }
    const contratanteAlunoId = r.tipo === 'aluno' ? r.aluno?.id : null;
    c.alunos.filter((v) => v.situacao === 'aprovado' && v.alunoId !== contratanteAlunoId && v.itens.some(matriculaAtiva)).forEach((v) => {
      const a = porId(ctx.alunos, v.alunoId);
      if (!a) return;
      lista.push({ id: `aluno:${a.id}`, papel: 'aluno', alunoId: a.id, nome: a.nomeSocial || a.nome, email: a.email || '', obrigatorio: false, detalhe: r.tipo === 'terceiro' && r.aluno?.id === a.id ? 'menor — assina junto com o responsável' : `aluno · ${pacoteDe(c, v.pacoteId)?.nome ?? ''}` });
    });
    if (!assinaturaDe(c, 'escola')) lista.push({ id: 'escola', papel: 'escola', nome: ESCOLA_SIGNATARIA.nome, email: ESCOLA_SIGNATARIA.email, obrigatorio: true, detalhe: 'assina pela administração' });
    return lista;
  }

  function validarEnvio(ctx, c, ids) {
    const erros = [];
    if (!podeEnviarClicksign(c)) erros.push('O contrato precisa estar gerado, sem as duas assinaturas e sem envelope em andamento.');
    const sug = signatariosSugeridos(ctx, c);
    const escolhidos = sug.filter((s) => s.obrigatorio || ids.includes(s.id));
    if (!assinaturaDe(c, 'contratante') && !escolhidos.some((s) => s.papel === 'contratante')) erros.push('Contratante não definido.');
    escolhidos.filter((s) => !s.email).forEach((s) => erros.push(`${s.nome}: sem e-mail cadastrado.`));
    return erros;
  }

  const eventoEnv = (e, texto, por) => ({ ...e, eventos: [...e.eventos, { em: agora(), texto, por }] });
  const atualizarEnvelope = (c, envId, fn) => ({ ...c, envelopes: c.envelopes.map((e) => (e.id === envId ? fn(e) : e)) });

  function enviarClicksign(lista, ctx, id, { ids = [], prazoDias = 7, mensagem = '' } = {}, por = 'Ana Souza') {
    return atualizar(lista, id, (c) => {
      if (validarEnvio(ctx, c, ids).length) return c;
      const sig = signatariosSugeridos(ctx, c).filter((s) => s.obrigatorio || ids.includes(s.id));
      const n = c.envelopes.length + 1;
      const envelopeId = `CS-${String(Date.now()).slice(-6)}`;
      const env = {
        id: `env${n}`, envelopeId, versao: c.documento.versao, enviadoEm: agora(), enviadoPor: por, prazoDias: Number(prazoDias) || 7, mensagem: String(mensagem ?? '').trim(),
        status: 'enviado', concluidoEm: null, cancelamento: null,
        signatarios: sig.map((s) => ({ id: s.id, papel: s.papel, alunoId: s.alunoId ?? null, nome: s.nome, email: s.email, status: 'pendente', assinadoEm: null, motivo: '' })),
        eventos: [{ em: agora(), texto: `Enviado ao Clicksign (${envelopeId}) para ${sig.map((s) => s.nome).join(', ')}`, por }],
      };
      return registrar({ ...c, envelopes: [...c.envelopes, env] }, `Documento v${c.documento.versao} enviado para assinatura no Clicksign (${envelopeId})`, por);
    });
  }

  function assinarNoClicksign(lista, id, signatarioId) {
    return atualizar(lista, id, (c) => {
      const env = envelopeEmAndamento(c);
      const s = env?.signatarios.find((x) => x.id === signatarioId);
      if (!s || s.status !== 'pendente') return c;
      let nc = atualizarEnvelope(c, env.id, (e) => eventoEnv({ ...e, signatarios: e.signatarios.map((x) => (x.id === signatarioId ? { ...x, status: 'assinado', assinadoEm: agora() } : x)) }, `${s.nome} assinou (Clicksign)`, 'Clicksign'));
      if (s.papel === 'contratante' || s.papel === 'escola') nc = { ...nc, assinaturas: { ...nc.assinaturas, [s.papel]: { assinadoEm: hoje(), meio: 'eletronica', por: s.nome, envelopeId: env.envelopeId } } };
      nc = registrar(nc, `${s.nome} assinou no Clicksign${s.papel === 'escola' ? ' (ProWay)' : s.papel === 'contratante' ? ' (contratante)' : ''}`, 'Clicksign');
      const e2 = envelopeAtual(nc);
      if (signatariosPendentes(e2).length) return nc;
      nc = atualizarEnvelope(nc, e2.id, (e) => eventoEnv({ ...e, status: 'assinado', concluidoEm: agora() }, 'Todos assinaram — documento assinado arquivado', 'Clicksign'));
      return registrar(nc, assinado(nc) ? `Contrato assinado pelas duas partes no Clicksign (${e2.envelopeId})` : `Envelope ${e2.envelopeId} concluído`, 'Clicksign');
    });
  }

  function recusarNoClicksign(lista, id, signatarioId, motivo) {
    return atualizar(lista, id, (c) => {
      const env = envelopeEmAndamento(c);
      const s = env?.signatarios.find((x) => x.id === signatarioId);
      if (!s || s.status !== 'pendente') return c;
      const m = String(motivo ?? '').trim();
      const nc = atualizarEnvelope(c, env.id, (e) => eventoEnv({ ...e, status: 'recusado', signatarios: e.signatarios.map((x) => (x.id === signatarioId ? { ...x, status: 'recusado', motivo: m } : x)) }, `${s.nome} recusou${m ? `: ${m}` : ''} (Clicksign)`, 'Clicksign'));
      return registrar(nc, `${s.nome} recusou a assinatura no Clicksign${m ? `: ${m}` : ''}`, 'Clicksign');
    });
  }

  function lembrarClicksign(lista, id, signatarioId = null, por = 'Ana Souza') {
    return atualizar(lista, id, (c) => {
      const env = envelopeEmAndamento(c);
      if (!env) return c;
      const alvo = signatarioId ? env.signatarios.filter((x) => x.id === signatarioId && x.status === 'pendente') : signatariosPendentes(env);
      if (!alvo.length) return c;
      const nomes = alvo.map((x) => x.nome).join(', ');
      return registrar(atualizarEnvelope(c, env.id, (e) => eventoEnv(e, `Lembrete reenviado para ${nomes}`, por)), `Lembrete de assinatura reenviado para ${nomes}`, por);
    });
  }

  function cancelarEnvelope(lista, id, motivo, por = 'Ana Souza') {
    return atualizar(lista, id, (c) => {
      const env = envelopePendente(c);
      if (!env) return c;
      const m = String(motivo ?? '').trim();
      let nc = atualizarEnvelope(c, env.id, (e) => eventoEnv({ ...e, status: 'cancelado', cancelamento: { em: agora(), motivo: m } }, `Envelope cancelado${m ? `: ${m}` : ''}`, por));
      const ass = { ...nc.assinaturas };
      PARTES_ASSINATURA.forEach((p) => { if (ass[p.id]?.envelopeId === env.envelopeId) ass[p.id] = null; });
      nc = { ...nc, assinaturas: ass };
      return registrar(nc, `Envelope ${env.envelopeId} cancelado${m ? `: ${m}` : ''}`, por);
    });
  }

  const historicoAssinaturas = (c) => (c.envelopes ?? []).flatMap((e) => e.eventos.map((ev) => ({ ...ev, envelopeId: e.envelopeId, versao: e.versao }))).sort((a, b) => b.em.localeCompare(a.em));

  function validarAssinatura(c, d) {
    const erros = [];
    if (!PARTES_ASSINATURA.some((p) => p.id === d.parte)) erros.push({ campo: 'parte', mensagem: 'Escolha quem assinou.' });
    else if (assinaturaDe(c, d.parte)) erros.push({ campo: 'parte', mensagem: 'Essa parte já assinou.' });
    if (!d.assinadoEm) erros.push({ campo: 'assinadoEm', mensagem: 'Informe a data.' });
    if (d.assinadoEm && d.assinadoEm > hoje()) erros.push({ campo: 'assinadoEm', mensagem: 'Data no futuro.' });
    if (!MEIOS_ASSINATURA.some((m) => m.id === d.meio && m.id !== 'eletronica')) erros.push({ campo: 'meio', mensagem: 'Escolha o meio (eletrônica só pelo Clicksign).' });
    if (!String(d.por ?? '').trim()) erros.push({ campo: 'por', mensagem: 'Quem assinou.' });
    return erros;
  }

  function registrarAssinatura(lista, id, d) {
    return atualizar(lista, id, (c) => {
      if (!podeRegistrarAssinaturaManual(c) || validarAssinatura(c, d).length) return c;
      const parte = PARTES_ASSINATURA.find((p) => p.id === d.parte);
      const nc = { ...c, assinaturas: { ...c.assinaturas, [d.parte]: { assinadoEm: d.assinadoEm, meio: d.meio, por: String(d.por).trim(), envelopeId: null } } };
      return registrar(nc, `${parte.nome} assinou fora do Clicksign (${MEIOS_ASSINATURA.find((m) => m.id === d.meio)?.nome.toLowerCase()}) — ${String(d.por).trim()}${assinado(nc) ? ' · contrato assinado pelas duas partes' : ''}`);
    });
  }

  function emitirNf(lista, ctx, id, numeroNf) {
    return atualizar(lista, id, (c) => (pendenciasEmissao(ctx, c).length ? c : registrar({ ...c, nf: { numero: String(numeroNf).trim(), emitidaEm: hoje() } }, `NF ${String(numeroNf).trim()} emitida`)));
  }

  // ---------- Rescisão (cancelamento com cálculo) ----------
  // Termos Gerais ProWay (itens 11, 13, 14, 15, 16, 22, 23). SEMPRE do contrato
  // inteiro (28/08/2026). Por matrícula ativa dos alunos que ocupam vaga:
  //   concluída → 100% · em andamento → 50% até 1/3 da duração, 100% depois ·
  //   não iniciada → multa de 10%. Vagas livres entram pelo valor do pacote como
  //   "não iniciado" (RN-27). Desconto perde eficácia (valor base).
  const REGRAS_RESCISAO = { multaNaoIniciado: 0.1, fracaoLimite: 1 / 3, pctAteLimite: 0.5, arrependimentoDias: 7, prazoPagamentoDias: 5, validadeCartaMeses: 6, multaAtraso: 0.02, jurosMes: 0.01 };
  const CRITERIOS_TERCO = [
    { id: 'aulas', nome: 'Aulas realizadas', descricao: 'Aulas da turma já dadas até a data do pedido ÷ total de aulas.' },
    { id: 'dias', nome: 'Dias corridos', descricao: 'Dias entre o início da turma e a data do pedido ÷ duração em dias.' },
  ];
  const DESTINOS_SALDO = [
    { id: 'cobrar', nome: 'Cobrar do contratante', descricao: 'Pagamento em 5 dias a partir da notificação (item 15).' },
    { id: 'devolver', nome: 'Devolver em dinheiro', descricao: 'ProWay devolve em 5 dias (item 15).' },
    { id: 'carta_credito', nome: 'Carta de crédito', descricao: 'Válida por 6 meses para outro curso; não vira dinheiro (item 16).' },
    { id: 'quitado', nome: 'Nada a pagar ou devolver', descricao: 'O que foi pago cobre exatamente o devido.' },
  ];

  const diasEntre = (a, b) => Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 86400000);
  function somarDias(iso, n) { const d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) + n)); return d.toISOString().slice(0, 10); }
  function somarMeses(iso, n) { const d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1 + n, +iso.slice(8, 10))); return d.toISOString().slice(0, 10); }

  function progressoTurma(turma, ref, criterio) {
    if (criterio === 'aulas' && typeof Turmas !== 'undefined') {
      const todas = Turmas.aulas(turma);
      if (todas.length) { const feitas = todas.filter((a) => a.data <= ref).length; return { unidade: 'aulas', total: todas.length, decorridas: feitas, fracao: feitas / todas.length }; }
    }
    const total = Math.max(1, diasEntre(turma.inicio, turma.fim) + 1);
    const dec = Math.min(total, Math.max(0, diasEntre(turma.inicio, ref) + 1));
    return { unidade: 'dias', total, decorridas: dec, fracao: dec / total };
  }

  function simularRescisao(ctx, c, { data = hoje(), criterio = 'aulas', perdeDesconto = true, arrependimento = false } = {}) {
    const ref = data || hoje();
    const R = REGRAS_RESCISAO;
    const diasDesdeInscricao = diasEntre(c.criadoEm.slice(0, 10), ref);
    const dentroArrependimento = arrependimento && diasDesdeInscricao >= 0 && diasDesdeInscricao <= R.arrependimentoDias;
    const linhas = todosItens(c).filter(matriculaAtiva).map((it) => {
      const turma = turmaDe(it.turmaId);
      const base = perdeDesconto ? Number(it.valorBase) || 0 : Number(it.valorFinal) || 0;
      let situacao; let pct; let regra; let progresso = null;
      if (dentroArrependimento) { situacao = 'arrependimento'; pct = 0; regra = 'Desistência em até 7 dias da inscrição — sem penalidade (item 13)'; }
      else if (it.status === 'concluido' || (turma && turma.fim < ref)) { situacao = 'concluido'; pct = 1; regra = 'Curso concluído — 100% devido'; }
      else if (!turma || turma.inicio > ref) { situacao = 'nao_iniciado'; pct = R.multaNaoIniciado; regra = `Não iniciado — multa de ${Math.round(R.multaNaoIniciado * 100)}% (item 11)`; }
      else {
        progresso = progressoTurma(turma, ref, criterio);
        const ate = progresso.fracao <= R.fracaoLimite;
        pct = ate ? R.pctAteLimite : 1;
        situacao = 'em_andamento';
        regra = `Em andamento: ${progresso.decorridas}/${progresso.total} ${progresso.unidade} (${Math.round(progresso.fracao * 100)}%) — ${ate ? 'até' : 'após'} 1/3 da duração → ${Math.round(pct * 100)}% (item 14)`;
      }
      return { item: it, alunoId: it.alunoId, pacoteId: it.pacoteId, turma, situacao, progresso, pct, regra, base, devido: arred(base * pct) };
    });
    // Vagas livres: cobradas como "não iniciado" pelo valor do pacote (uma linha por pacote).
    c.pacotes.forEach((p) => {
      const livres = vagasDoPacote(c, p).livres;
      if (!livres) return;
      const base = arred(livres * (perdeDesconto ? valorBasePacote(p) : valorPacote(p)));
      const pct = dentroArrependimento ? 0 : R.multaNaoIniciado;
      linhas.push({ item: null, alunoId: null, pacoteId: p.id, pacote: p, vagas: livres, turma: null, situacao: dentroArrependimento ? 'arrependimento' : 'nao_iniciado', progresso: null, pct, regra: dentroArrependimento ? 'Desistência em até 7 dias da inscrição — sem penalidade (item 13)' : `${livres} vaga${livres === 1 ? '' : 's'} livre${livres === 1 ? '' : 's'} não iniciada${livres === 1 ? '' : 's'} — multa de ${Math.round(R.multaNaoIniciado * 100)}% (item 11)`, base, devido: arred(base * pct) });
    });
    const devido = arred(linhas.reduce((s, l) => s + l.devido, 0));
    const pago = arred(c.parcelas.filter((p) => p.status === 'paga').reduce((s, p) => s + p.valor, 0));
    const vencidas = vencidasComEncargos(c, ref);
    const encargos = arred(vencidas.reduce((s, v) => s + v.encargos, 0));
    const saldo = arred(devido - pago + encargos);
    const destino = saldo > 0 ? 'cobrar' : saldo < 0 ? 'devolver' : 'quitado';
    return {
      data: ref, criterio, perdeDesconto, arrependimento: dentroArrependimento, diasDesdeInscricao, linhas, devido, pago, vencidas, encargos, saldo, destino,
      prazo: somarDias(ref, R.prazoPagamentoDias), validadeCarta: somarMeses(ref, R.validadeCartaMeses), regras: { ...R },
    };
  }

  function avancar(lista, id, novoStatus) {
    return atualizar(lista, id, (c) => {
      if (novoStatus === 'comercial_ok' && (c.status !== 'aguardando' || pendenciasComercialOk(c).length)) return c;
      if (novoStatus === 'adm_ok' && pendenciasAdmOk(c).length) return c;
      return registrar({ ...c, status: novoStatus }, STATUS_CONTRATO.find((s) => s.id === novoStatus)?.nome);
    });
  }

  // `rescisao` = simulação aceita no modal (+ `destino` escolhido quando há saldo a devolver).
  function cancelar(lista, id, motivo, rescisao = null) {
    lista = cancelarEnvelope(lista, id, 'venda cancelada');
    const memoria = rescisao ? { ...rescisao, linhas: rescisao.linhas.map((l) => ({ itemId: l.item?.id ?? null, alunoId: l.alunoId, pacoteId: l.pacoteId ?? null, vagas: l.vagas ?? null, situacao: l.situacao, progresso: l.progresso, pct: l.pct, regra: l.regra, base: l.base, devido: l.devido })), vencidas: rescisao.vencidas.map((v) => ({ n: v.parcela.n, valor: v.parcela.valor, dias: v.dias, encargos: v.encargos })) } : null;
    const resumoSaldo = memoria ? (memoria.saldo > 0 ? ` — saldo a cobrar ${fmtMoeda(memoria.saldo)} até ${fmtData(memoria.prazo)}` : memoria.saldo < 0 ? ` — ${memoria.destino === 'carta_credito' ? 'carta de crédito' : 'devolução'} de ${fmtMoeda(-memoria.saldo)}` : ' — sem saldo') : '';
    return atualizar(lista, id, (c) => registrar({
      ...c, status: 'cancelado', cancelamento: { em: agora(), motivo: String(motivo ?? '').trim(), rescisao: memoria }, recuperacao: null,
      parcelas: c.parcelas.map((p) => (p.status === 'paga' ? p : { ...p, status: 'cancelada' })),
      alunos: c.alunos.map((v) => ({ ...v, itens: v.itens.map((m) => (matriculaAtiva(m) ? { ...m, status: 'cancelada', cancelamento: cancelamentoDe({ tipo: 'contrato', texto: motivo }, 'contrato') } : m)) })),
      pacotes: c.pacotes.map((p) => (p.convite ? { ...p, convite: { ...p.convite, ativo: false } } : p)),
    }, `Venda cancelada${motivo ? `: ${motivo}` : ''}${resumoSaldo}`));
  }

  function registrarRecuperacao(lista, id, acordo) {
    return atualizar(lista, id, (c) => registrar({ ...c, recuperacao: { desde: hoje(), acordo: String(acordo ?? '').trim() } }, 'Acordo de recuperação registrado'));
  }

  const encerrarRecuperacao = (lista, id) => atualizar(lista, id, (c) => registrar({ ...c, recuperacao: null }, 'Recuperação encerrada'));

  // ---------- Indicadores comerciais (aba Indicadores da lista) ----------
  // Fechado = Comercial OK ou Adm OK. Data de fechamento = assinatura das duas partes, senão 1ª parcela paga,
  // senão documento gerado, senão criação. Pipeline/carteira/inadimplência/vagas/ocupação são foto de hoje;
  // vendas, criados e cancelados obedecem ao período.
  const fechado = (c) => c.status === 'comercial_ok' || c.status === 'adm_ok';
  const emAberto = (c) => c.status === 'rascunho' || c.status === 'aguardando';
  const dia = (iso) => (iso ? String(iso).slice(0, 10) : null);
  function dataFechamento(c) {
    if (!fechado(c)) return null;
    const paga1 = c.parcelas.find((p) => p.n === 1 && p.status === 'paga')?.pagoEm;
    return dia(assinadoEm(c) ?? paga1 ?? c.documento?.geradoEm ?? c.criadoEm);
  }
  const mesDe = (iso) => String(iso).slice(0, 7);
  const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const rotuloMes = (ym) => `${MESES_CURTOS[+ym.slice(5, 7) - 1]}/${ym.slice(2, 4)}`;
  function mesesEntre(de, ate) {
    const out = []; let ym = mesDe(de); const fim = mesDe(ate);
    while (ym <= fim && out.length < 120) { out.push(ym); ym = somarMeses(`${ym}-01`, 1).slice(0, 7); }
    return out;
  }
  const fmtCompacto = (n) => {
    const v = Number(n) || 0; const abs = Math.abs(v);
    if (abs >= 1e6) return `R$ ${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mi`;
    if (abs >= 1e3) return `R$ ${(v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
    return fmtMoeda(v);
  };

  // Períodos do seletor, relativos a `ref` (hoje). "Desde o início" começa no 1º contrato.
  function periodosIndicadores(lista, ref = hoje()) {
    const ano = ref.slice(0, 4);
    const inicioMes = `${ref.slice(0, 7)}-01`;
    const fimMes = somarDias(somarMeses(inicioMes, 1), -1);
    const mesesAtras = (n) => somarMeses(inicioMes, -(n - 1));
    const primeiro = lista.map((c) => dia(c.criadoEm)).sort()[0] ?? inicioMes;
    return [
      { id: 'mes', nome: 'Este mês', de: inicioMes, ate: fimMes },
      { id: '3m', nome: 'Últimos 3 meses', de: mesesAtras(3), ate: fimMes },
      { id: '6m', nome: 'Últimos 6 meses', de: mesesAtras(6), ate: fimMes },
      { id: '12m', nome: 'Últimos 12 meses', de: mesesAtras(12), ate: fimMes },
      { id: 'ano', nome: `Este ano (${ano})`, de: `${ano}-01-01`, ate: `${ano}-12-31` },
      { id: 'ano_anterior', nome: `Ano anterior (${+ano - 1})`, de: `${+ano - 1}-01-01`, ate: `${+ano - 1}-12-31` },
      { id: 'tudo', nome: 'Desde o início', de: `${mesDe(primeiro < inicioMes ? primeiro : inicioMes)}-01`, ate: fimMes },
    ];
  }

  // Meta mensal de vendas fechadas (R$) [sup.]: uma só para a escola, guardada à parte dos contratos.
  const CHAVE_META = 'aulor-v1-comercial-meta-v1';
  const META_PADRAO = { mensal: 30000 };
  function metaComercial() {
    try { const m = JSON.parse(localStorage.getItem(CHAVE_META)); if (m && Number.isFinite(Number(m.mensal))) return { mensal: Number(m.mensal) }; } catch (_) { /* padrão */ }
    return { ...META_PADRAO };
  }
  function salvarMetaComercial(mensal) {
    const v = numero(mensal);
    if (v == null || Number.isNaN(v) || v < 0) return [{ campo: 'mensal', mensagem: 'Informe um valor maior ou igual a zero.' }];
    localStorage.setItem(CHAVE_META, JSON.stringify({ mensal: arred(v) }));
    return [];
  }

  // Pesos do pipeline ponderado [sup.] (probabilidade de fechar por etapa).
  const PESO_PIPELINE = { rascunho: 0.3, aguardando: 0.7 };
  const ETAPAS_FUNIL = ['rascunho', 'aguardando', 'comercial_ok', 'adm_ok', 'cancelado'];

  function indicadoresComerciais(lista, ctx, { de, ate, vendedorId = '' } = {}) {
    const base = vendedorId ? lista.filter((c) => c.vendedorId === vendedorId) : lista;
    const noPeriodo = (d) => Boolean(d) && d >= de && d <= ate;
    const tot = (c) => totais(c);
    const soma = (arr, f) => arred(arr.reduce((s, c) => s + f(c), 0));
    const media = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null);
    const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);

    const fechados = base.filter((c) => noPeriodo(dataFechamento(c)));
    const criados = base.filter((c) => noPeriodo(dia(c.criadoEm)));
    const cancelados = base.filter((c) => c.status === 'cancelado' && noPeriodo(dia(c.cancelamento?.em)));
    const abertos = base.filter(emAberto);
    const ativos = base.filter(fechado);

    // Vendas fechadas
    const valor = soma(fechados, (c) => tot(c).final);
    const valorBase = soma(fechados, (c) => tot(c).base);
    const b2b = fechados.filter((c) => c.contratante === 'empresa');
    const valorB2b = soma(b2b, (c) => tot(c).final);
    const alunos = fechados.reduce((s, c) => s + tot(c).nAlunos, 0);
    const vagasVendidas = fechados.reduce((s, c) => s + resumoPacotes(c).vagas, 0);
    const ciclo = media(fechados.map((c) => diasEntre(dia(c.criadoEm), dataFechamento(c))));

    // Período anterior de mesmo tamanho (variação)
    const nDias = diasEntre(de, ate) + 1;
    const deAnt = somarDias(de, -nDias); const ateAnt = somarDias(de, -1);
    const fechadosAnt = base.filter((c) => { const d = dataFechamento(c); return Boolean(d) && d >= deAnt && d <= ateAnt; });
    const anterior = { de: deAnt, ate: ateAnt, n: fechadosAnt.length, valor: soma(fechadosAnt, (c) => tot(c).final) };

    // Meta do período = meta mensal × meses do período
    const meta = metaComercial();
    const nMeses = mesesEntre(de, ate).length;
    const metaPeriodo = meta.mensal != null ? arred(meta.mensal * nMeses) : null;

    // Pipeline (foto de hoje)
    const pipeline = {
      n: abertos.length, valor: soma(abertos, (c) => tot(c).final),
      ponderado: soma(abertos, (c) => tot(c).final * PESO_PIPELINE[c.status]),
      rascunho: abertos.filter((c) => c.status === 'rascunho').length, aguardando: abertos.filter((c) => c.status === 'aguardando').length,
      valorRascunho: soma(abertos.filter((c) => c.status === 'rascunho'), (c) => tot(c).final), valorAguardando: soma(abertos.filter((c) => c.status === 'aguardando'), (c) => tot(c).final),
      pesos: PESO_PIPELINE,
    };

    // Cancelamentos e conversão (ganhos ÷ ganhos + perdidos no período)
    const cancel = { n: cancelados.length, valor: soma(cancelados, (c) => tot(c).final), taxa: pct(cancelados.length, fechados.length + cancelados.length), motivos: cancelados.map((c) => ({ id: c.id, codigo: c.codigo, em: dia(c.cancelamento?.em), motivo: c.cancelamento?.motivo ?? '', valor: tot(c).final, status: c.status })) };
    const conversao = pct(fechados.length, fechados.length + cancelados.length);

    // Inadimplência e vagas (foto de hoje, contratos ativos)
    const inadimplentes = ativos.filter((c) => parcelasVencidas(c).length);
    const inadimplencia = { n: inadimplentes.length, ativos: ativos.length, taxa: pct(inadimplentes.length, ativos.length), valor: soma(inadimplentes, (c) => parcelasVencidas(c).reduce((s, p) => s + p.valor, 0)) };
    const vagas = ativos.reduce((s, c) => { const r = resumoPacotes(c); s.vendidas += r.vagas; s.ocupadas += r.ocupadas; s.livres += r.livres; s.aguardando += r.aguardando; return s; }, { vendidas: 0, ocupadas: 0, livres: 0, aguardando: 0 });
    vagas.valorLivres = soma(ativos, (c) => tot(c).porPacote.reduce((s, p) => s + p.livresFinal, 0));

    // Série mensal
    const serie = mesesEntre(de, ate).map((ym) => ({ ym, rotulo: rotuloMes(ym), fechados: 0, valor: 0, criados: 0, cancelados: 0 }));
    const idx = Object.fromEntries(serie.map((p, i) => [p.ym, i]));
    fechados.forEach((c) => { const p = serie[idx[mesDe(dataFechamento(c))]]; if (p) { p.fechados += 1; p.valor = arred(p.valor + tot(c).final); } });
    criados.forEach((c) => { const p = serie[idx[mesDe(c.criadoEm)]]; if (p) p.criados += 1; });
    cancelados.forEach((c) => { const p = serie[idx[mesDe(c.cancelamento.em)]]; if (p) p.cancelados += 1; });

    // Funil: coorte dos contratos criados no período, pelo status de hoje
    const funil = ETAPAS_FUNIL.map((s) => { const cs = criados.filter((c) => c.status === s); return { status: s, nome: STATUS_CONTRATO.find((x) => x.id === s)?.curto ?? STATUS_CONTRATO.find((x) => x.id === s)?.nome ?? s, n: cs.length, valor: soma(cs, (c) => tot(c).final) }; });
    const chegaram = (s) => (s === 'rascunho' ? criados.length : criados.filter((c) => c.status !== 'cancelado' && (STATUS_CONTRATO.find((x) => x.id === c.status)?.ordem ?? 0) >= (STATUS_CONTRATO.find((x) => x.id === s)?.ordem ?? 0)).length);
    const funilAcumulado = ['rascunho', 'aguardando', 'comercial_ok', 'adm_ok'].map((s) => ({ status: s, nome: STATUS_CONTRATO.find((x) => x.id === s)?.curto ?? STATUS_CONTRATO.find((x) => x.id === s)?.nome, n: chegaram(s), pct: pct(chegaram(s), criados.length) }));

    // Por vendedor
    const porVendedor = VENDEDORES.map((v) => {
      const f = fechados.filter((c) => c.vendedorId === v.id);
      const vf = soma(f, (c) => tot(c).final); const vb = soma(f, (c) => tot(c).base);
      const ab = abertos.filter((c) => c.vendedorId === v.id);
      return { vendedorId: v.id, nome: v.nome, n: f.length, valor: vf, ticket: f.length ? arred(vf / f.length) : null, desconto: pct(vb - vf, vb), ciclo: media(f.map((c) => diasEntre(dia(c.criadoEm), dataFechamento(c)))), cancelados: cancelados.filter((c) => c.vendedorId === v.id).length, pipeline: soma(ab, (c) => tot(c).final), nPipeline: ab.length, participacao: pct(vf, valor), alunos: f.reduce((s, c) => s + tot(c).nAlunos, 0) };
    }).sort((a, b) => b.valor - a.valor || a.nome.localeCompare(b.nome, 'pt-BR'));

    // Mix de produto (valor fechado por formação / curso avulso)
    const mix = {};
    fechados.forEach((c) => {
      tot(c).porPacote.forEach((pp) => {
        const p = pp.pacote;
        if (p.formacaoId) { const k = `f:${p.formacaoId}`; mix[k] = mix[k] ?? { id: k, nome: formacaoDe(ctx, p.formacaoId)?.nome ?? p.nome, tipo: 'formacao', valor: 0, n: 0, alunos: 0 }; mix[k].valor = arred(mix[k].valor + pp.final); mix[k].n += 1; mix[k].alunos += pp.ocupadas; return; }
        const somaItens = p.itens.reduce((s, i) => s + (Number(i.valorFinal) || 0), 0) || 1;
        p.itens.forEach((i) => { const k = `c:${i.cursoId}`; mix[k] = mix[k] ?? { id: k, nome: cursoDe(ctx, i.cursoId)?.nome ?? i.cursoId, tipo: 'curso', valor: 0, n: 0, alunos: 0 }; mix[k].valor = arred(mix[k].valor + pp.final * ((Number(i.valorFinal) || 0) / somaItens)); mix[k].n += 1; mix[k].alunos += pp.ocupadas; });
      });
    });
    const mixProduto = Object.values(mix).sort((a, b) => b.valor - a.valor);

    // Origem dos alunos (aprovados nos contratos fechados do período)
    const origens = fechados.flatMap((c) => c.alunos.filter((v) => v.situacao === 'aprovado')).reduce((m, v) => { m[v.origem] = (m[v.origem] ?? 0) + 1; return m; }, { escola: 0, link: 0 });

    // Recompra (histórico inteiro): contratantes com 2+ contratos fechados
    const chave = (c) => (c.contratante === 'empresa' ? `empresa:${c.empresaId}` : c.responsavel ? `${c.responsavel.tipo}:${c.responsavel.id}` : null);
    const porContratante = {};
    base.filter(fechado).forEach((c) => { const k = chave(c); if (k) porContratante[k] = (porContratante[k] ?? 0) + 1; });
    const contratantes = Object.keys(porContratante).length;
    const recorrentes = Object.values(porContratante).filter((n) => n >= 2).length;
    const recompra = { contratantes, recorrentes, taxa: pct(recorrentes, contratantes) };

    // Ocupação das turmas ativas (foto de hoje): matrículas ativas ÷ vagas, agrupando as turmas de uma edição de formação
    const turmasAtivas = Cursos.todasTurmas().filter((t) => t.status !== 'concluida' && t.status !== 'cancelada');
    const ocupPorTurma = {};
    lista.filter((c) => c.status !== 'cancelado').forEach((c) => itensMatriculados(c).forEach((m) => { if (matriculaAtiva(m) && m.turmaId) ocupPorTurma[m.turmaId] = (ocupPorTurma[m.turmaId] ?? 0) + 1; }));
    const grupos = {};
    turmasAtivas.forEach((t) => {
      const k = t.formacaoId ?? t.id;
      const g = grupos[k] ?? (grupos[k] = { id: k, nome: t.formacaoId ? (formacaoDe(ctx, t.formacaoId)?.nome ?? t.formacaoId) : `${t.codigo} · ${cursoDe(ctx, t.cursoId)?.nome ?? t.cursoId}`, tipo: t.formacaoId ? 'formacao' : 'turma', vagas: 0, ocupadas: 0, turmas: 0, inicio: t.inicio, status: t.status });
      g.turmas += 1; g.vagas = Math.max(g.vagas, t.vagas ?? 0); g.ocupadas = Math.max(g.ocupadas, ocupPorTurma[t.id] ?? 0); if (t.inicio < g.inicio) g.inicio = t.inicio;
    });
    const ocupacao = Object.values(grupos).map((g) => ({ ...g, pct: pct(g.ocupadas, g.vagas) })).sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0) || a.nome.localeCompare(b.nome, 'pt-BR'));
    const ocupacaoGeral = { vagas: ocupacao.reduce((s, g) => s + g.vagas, 0), ocupadas: ocupacao.reduce((s, g) => s + g.ocupadas, 0) };
    ocupacaoGeral.taxa = pct(ocupacaoGeral.ocupadas, ocupacaoGeral.vagas);

    return {
      periodo: { de, ate, nMeses, nDias },
      vendas: { n: fechados.length, valor, valorBase, desconto: arred(valorBase - valor), descontoPct: pct(valorBase - valor, valorBase), ticket: fechados.length ? arred(valor / fechados.length) : null, b2b: b2b.length, b2c: fechados.length - b2b.length, valorB2b, valorB2c: arred(valor - valorB2b), alunos, vagasVendidas, ciclo: ciclo == null ? null : Math.round(ciclo * 10) / 10 },
      anterior, meta: { mensal: meta.mensal, periodo: metaPeriodo, pct: metaPeriodo ? pct(valor, metaPeriodo) : null },
      criados: criados.length, pipeline, cancelamentos: cancel, conversao, inadimplencia, vagas, recompra,
      serie, funil, funilAcumulado, porVendedor, mixProduto, origens, ocupacao, ocupacaoGeral,
      fechados, cancelados,
    };
  }

  return {
    carregar, salvar, porId, normalizar, arred, hoje, numero,
    fmtMoeda, fmtData, fmtDataHora, proximoCodigo,
    statusDe, cursoDe, turmaDe, formacaoDe, empresaDe, nomeEmpresa, situacaoVinculoDe, rotuloItem, descricao, resumoVenda, resumoVagasTexto, responsavelFinanceiro,
    // pacotes e vínculos
    pacoteDe, vinculoDe, vinculosDoPacote, ocupaVaga, matriculado, alunoIdsDe, alunosDe, alunosAguardando, recusadosDoPacote, vagasDoPacote, resumoPacotes, valorPacote, valorBasePacote,
    todosItens, itensMatriculados, itensDoAluno, itemDe, matriculaAtiva, valorMatricula, gruposDoAluno, agruparItens, codigoMatricula, diferencasDoMolde,
    totais, parcelaVencida, parcelasVencidas, vencidasComEncargos, resumoVencido, situacaoCobranca,
    assinaturaDe, assinado, assinadoEm, partesPendentes,
    pendenciasDocumento, pendenciasEmissao, pendenciasComercialOk, pendenciasAdmOk, proximaAcao,
    filtrar, porTurma, cobrancas, historicoAluno, historicoEmpresa, contratosDoAluno, debitoDoAluno, debitosPorPagador,
    ratear, modelosItens, referenciaCatalogo, nomePacoteSugerido,
    validarNovo, incluir, atualizarDados, validarContratante, definirContratante, sincronizarAlunosComContrato,
    validarPacoteNovo, adicionarPacote, validarPacoteEdicao, atualizarPacote, podeRemoverPacote, removerPacote, duplicarPacote, aplicarDesconto,
    validarVinculoAlunos, vincularAlunos, aprovarAluno, validarRecusa, recusarAluno, removerAluno,
    alterarStatusMatricula, motivoCancelamentoDe, podeCongelar, podeRetomar, congelarAluno, retomarAluno, itensCongelados, validarItem, atualizarItem, adicionarFormacao, adicionarCursos, copiarItens, removerItem, removerFormacao, restaurarMolde,
    SITUACOES_CONVITE, situacaoConvite, conviteAberto, avisoConvitePublico, urlConvitePacote, gerarConvitePacote, alterarConvitePacote, pacotePorConvite, mensagemConvite,
    mascarar, alunoPorCpf, consultarCpfPacote, preencherDoExistente, dadosParaContrato, validarCadastroPeloPacote, cadastrarPeloLinkPacote,
    OPCOES_DUPLICAR_PADRAO, avisosTabela, previaDuplicar, duplicar,
    gerarParcelas, parcelasTravadas, parcelasDivergem, validarCobranca, definirCobranca, regerarParcelas, emitirBoletos, validarPagamento, registrarPagamento, estornarPagamento,
    podeGerarDocumento, gerarDocumento, anexoAlunos, podeReabrir, reabrir, validarAssinatura, podeRegistrarAssinaturaManual, registrarAssinatura, emitirNf, avancar, cancelar, simularRescisao, progressoTurma, REGRAS_RESCISAO, CRITERIOS_TERCO, DESTINOS_SALDO, registrarRecuperacao, encerrarRecuperacao,
    envelopeAtual, envelopeEmAndamento, envelopePendente, signatariosPendentes, signatariosRecusaram, statusEnvelopeDe, podeEnviarClicksign, signatariosSugeridos, validarEnvio,
    enviarClicksign, assinarNoClicksign, recusarNoClicksign, lembrarClicksign, cancelarEnvelope, historicoAssinaturas,
    remover, podeExcluir, editavel,
    // indicadores comerciais
    fechado, emAberto, dataFechamento, diasEntre, rotuloMes, mesesEntre, fmtCompacto, periodosIndicadores, metaComercial, salvarMetaComercial, PESO_PIPELINE, indicadoresComerciais,
  };
})();
