// ============================================================
// Portal do Aluno — motor (sem DOM).
// Sessão do aluno logado + consultas sobre os cadastros do
// administrativo (Clientes, Contratos, Turmas, Cursos, Aulas…).
// ============================================================

const PortalAluno = (() => {
  const CHAVE_SESSAO = 'aulor-v1-portal-aluno-sessao';
  // Senha única do protótipo: no sistema real vem do cadastro de usuário (permissoes.html).
  const SENHA_PROTOTIPO = '123456';

  const hoje = () => (typeof Turmas !== 'undefined' ? Turmas.hoje() : new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10));
  const normalizarEmail = (s) => String(s ?? '').trim().toLowerCase();

  // ---------- Sessão ----------

  function sessao() {
    try {
      const s = JSON.parse(localStorage.getItem(CHAVE_SESSAO) ?? 'null');
      return s && s.alunoId ? s : null;
    } catch (_) { return null; }
  }
  const entrar = (alunoId) => localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ alunoId, em: new Date().toISOString() }));
  const sair = () => localStorage.removeItem(CHAVE_SESSAO);

  // Login por e-mail do aluno cadastrado (clientes) + senha do protótipo.
  function autenticar(email, senha) {
    const e = normalizarEmail(email);
    if (!e) return { erro: 'Informe o e-mail.' };
    if (!senha) return { erro: 'Informe a senha.' };
    const aluno = Clientes.carregar().alunos.find((a) => normalizarEmail(a.email) === e) ?? null;
    if (!aluno || senha !== SENHA_PROTOTIPO) return { erro: 'E-mail ou senha incorretos.' };
    if (aluno.status === 'inativo') return { erro: 'Seu acesso está inativo. Fale com a secretaria.' };
    return { aluno };
  }

  const alunoLogado = () => {
    const s = sessao();
    return s ? Clientes.porId(Clientes.carregar().alunos, s.alunoId) ?? null : null;
  };

  const iniciais = (nome) => String(nome ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  const primeiroNome = (nome) => String(nome ?? '').split(/\s+/)[0] ?? '';

  // ---------- Consultas ----------

  const fmtData = (iso) => (iso ? Clientes.fmtData(iso) : '');
  const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const diaSemana = (iso) => DIAS[new Date(`${iso}T12:00:00`).getDay()];
  const fmtDataLonga = (iso) => {
    const d = new Date(`${iso}T12:00:00`);
    return `${diaSemana(iso)}, ${d.getDate()} de ${['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][d.getMonth()]}`;
  };
  const rotuloDia = (iso, ref = hoje()) => {
    if (iso === ref) return 'Hoje';
    const amanha = new Date(`${ref}T12:00:00`); amanha.setDate(amanha.getDate() + 1);
    if (iso === amanha.toISOString().slice(0, 10)) return 'Amanhã';
    return fmtDataLonga(iso);
  };

  // Matrículas do aluno (itens de contrato matriculado/concluído), enriquecidas com curso, turma,
  // formação, instrutor, sala e progresso de aulas.
  function matriculas(alunoId, ref = hoje()) {
    const cursos = Cursos.carregar();
    const turmas = Turmas.carregar();
    const formacoes = typeof Formacoes !== 'undefined' ? Formacoes.carregar() : [];
    const instrutores = typeof Instrutores !== 'undefined' ? Instrutores.carregar() : [];
    const salas = typeof Salas !== 'undefined' ? Salas.carregar() : [];
    const linhas = [];
    Contratos.contratosDoAluno(Contratos.carregar(), alunoId).forEach((c) => {
      if (c.status === 'cancelado' || c.status === 'rascunho') return;
      Contratos.itensDoAluno(c, alunoId).filter(Contratos.matriculaAtiva).forEach((item) => {
        const turma = Turmas.porId(turmas, item.turmaId);
        if (!turma) return;
        const curso = Cursos.porId(cursos, item.cursoId ?? turma.cursoId);
        const aulas = Turmas.aulas(turma);
        const realizadas = aulas.filter((a) => a.data < ref).length;
        const situacao = item.status === 'concluido' ? 'concluida' : Turmas.situacao(turma, ref);
        linhas.push({
          contrato: c, item, turma, curso,
          formacao: turma.formacaoId ? Formacoes.porId(formacoes, turma.formacaoId) : null,
          instrutor: instrutores.find((i) => i.id === turma.instrutorId) ?? null,
          sala: salas.find((s) => s.id === turma.salaId) ?? null,
          aulas, realizadas,
          progresso: aulas.length ? Math.round((realizadas / aulas.length) * 100) : 0,
          situacao, // em_andamento | planejada | confirmada | concluida | cancelada
        });
      });
    });
    const ordem = { em_andamento: 0, confirmada: 1, planejada: 1, concluida: 2, cancelada: 3 };
    return linhas.sort((a, b) => (ordem[a.situacao] ?? 9) - (ordem[b.situacao] ?? 9) || a.turma.inicio.localeCompare(b.turma.inicio));
  }

  // Próximas aulas (hoje em diante) de todas as matrículas ativas, em ordem cronológica.
  function proximasAulas(ms, ref = hoje(), limite = 5) {
    const lista = [];
    ms.filter((m) => m.situacao !== 'concluida' && m.situacao !== 'cancelada').forEach((m) => {
      m.aulas.filter((a) => a.data >= ref).forEach((a) => lista.push({ ...a, matricula: m }));
    });
    return lista.sort((a, b) => a.data.localeCompare(b.data) || a.inicio.localeCompare(b.inicio)).slice(0, limite);
  }

  // Avaliações que o aluno enviou em avaliacao-aluno.html (chave compartilhada;
  // envio = { turmaId, alunoId, modalidade, questionarioId, data, … }).
  function enviosAvaliacao(alunoId) {
    try {
      return JSON.parse(localStorage.getItem('aulor-v1-avaliacao-aluno-envios') ?? '[]').filter((e) => e.alunoId === alunoId);
    } catch (_) { return []; }
  }

  // Avaliações que o aluno ainda pode responder: diária da aula de hoje (turma em andamento)
  // e final das turmas encerradas nos últimos 7 dias. Some quando já há envio (a final vale uma vez).
  function avaliacoesPendentes(ms, ref = hoje(), alunoId = null) {
    const limite = new Date(`${ref}T12:00:00`); limite.setDate(limite.getDate() - 7);
    const desde = limite.toISOString().slice(0, 10);
    const envios = enviosAvaliacao(alunoId);
    const enviada = (m, modalidade) => envios.some((e) => e.turmaId === m.turma.id && e.modalidade === modalidade && (modalidade === 'final' || e.data === ref));
    const pendentes = [];
    ms.forEach((m) => {
      if (m.situacao === 'em_andamento' && m.aulas.some((a) => a.data === ref) && !enviada(m, 'diaria')) pendentes.push({ modalidade: 'diaria', matricula: m });
      const ultima = m.aulas.at(-1)?.data ?? m.turma.fim;
      if (ultima >= desde && ultima <= ref && !enviada(m, 'final')) pendentes.push({ modalidade: 'final', matricula: m });
    });
    return pendentes;
  }

  // Gravações do Meet mais recentes entre as turmas do aluno.
  function gravacoesRecentes(ms, limite = 4) {
    const lista = [];
    ms.forEach((m) => (m.turma.gravacoes ?? []).forEach((g) => lista.push({ ...g, matricula: m })));
    return lista.sort((a, b) => b.data.localeCompare(a.data)).slice(0, limite);
  }

  // Resumo financeiro: só quando o aluno é o próprio pagador dos contratos (responsável/empresa não aparecem aqui).
  function financeiro(alunoId, ref = hoje()) {
    const contratos = Contratos.contratosDoAluno(Contratos.carregar(), alunoId).filter((c) => c.status !== 'cancelado' && c.status !== 'rascunho');
    const abertas = contratos.flatMap((c) => c.parcelas.filter((p) => p.status === 'emitida' || p.status === 'prevista').map((p) => ({ ...p, contrato: c })));
    const vencidas = abertas.filter((p) => p.status === 'emitida' && p.vencimento < ref);
    const proxima = abertas.filter((p) => p.vencimento >= ref).sort((a, b) => a.vencimento.localeCompare(b.vencimento))[0] ?? null;
    return { contratos: contratos.length, abertas: abertas.length, vencidas, proxima };
  }

  // ---------- Financeiro (tela portal-aluno/financeiro.html) ----------

  // Contexto dos contratos (mesmo formato usado por contratos-app / clientes-motor).
  function contextoFinanceiro() {
    const dados = Clientes.carregar();
    return { lista: Contratos.carregar(), ctx: { empresas: dados.empresas, alunos: dados.alunos, responsaveis: dados.responsaveis ?? [], cursos: Cursos.carregar(), formacoes: Formacoes.carregar() } };
  }

  const somar = (ps) => Math.round(ps.reduce((s, p) => s + (Number(p.valor) || 0), 0) * 100) / 100;

  // O aluno paga este contrato? Só quando o responsável financeiro derivado é o próprio aluno.
  const alunoPagaContrato = (ctx, c, alunoId) => {
    const r = Contratos.responsavelFinanceiro(ctx, c);
    return r.tipo === 'aluno' && r.aluno?.id === alunoId;
  };

  // Rótulo/ponto da parcela como o aluno vê (vencida é derivada de emitida + vencimento < hoje).
  function situacaoParcela(p, ref = hoje()) {
    if (p.status === 'paga') return { id: 'paga', nome: `Paga em ${fmtData(p.pagoEm)}` };
    if (p.status === 'cancelada') return { id: 'cancelada', nome: 'Cancelada' };
    if (p.status === 'emitida') return p.vencimento < ref ? { id: 'vencida', nome: 'Vencida' } : { id: 'emitida', nome: 'Boleto emitido' };
    return { id: 'prevista', nome: 'Prevista' };
  }

  // Códigos simulados (determinísticos por contrato × parcela): linha digitável do boleto e Pix copia e cola.
  const digitos = (semente, n) => {
    let h = 2166136261;
    const out = [];
    const txt = String(semente);
    for (let i = 0; out.length < n; i++) {
      h ^= txt.charCodeAt(i % txt.length) + i;
      h = Math.imul(h, 16777619) >>> 0;
      out.push(h % 10);
    }
    return out.join('');
  };
  function linhaDigitavel(c, p) {
    const d = digitos(`${c.id}|${p.n}|boleto`, 44);
    const cents = String(Math.round(p.valor * 100)).padStart(10, '0');
    return `23790.${d.slice(0, 5)} ${d.slice(5, 10)}.${d.slice(10, 16)} ${d.slice(16, 21)}.${d.slice(21, 27)} ${d[27]} ${d.slice(28, 32)}${cents}`;
  }
  function pixCopiaCola(c, p) {
    const d = digitos(`${c.id}|${p.n}|pix`, 32);
    const valor = p.valor.toFixed(2);
    return `00020126580014br.gov.bcb.pix0136${d.slice(0, 8)}-${d.slice(8, 12)}-${d.slice(12, 16)}-${d.slice(16, 20)}-${d.slice(20, 32)}52040000530398654${String(valor.length).padStart(2, '0')}${valor}5802BR5925PROWAY INFORMATICA E TREIN6009BLUMENAU62070503***6304${d.slice(0, 4).toUpperCase()}`;
  }

  // Linha do tempo financeira do contrato, derivada das parcelas, NF e assinatura (+ eventos do histórico
  // sobre desistência/acordo/cancelamento).
  // A administração registra "Venda …" no histórico; no portal o aluno vê o contrato.
  const TEXTOS_CONTRATO = [[/^Venda (criad|cancelad|reabert|quitad)a\b/, 'Contrato $1o'], [/ da venda\b/, ' do contrato'], [/: venda cancelada$/, ': contrato cancelado']];
  const textoDoAluno = (t) => TEXTOS_CONTRATO.reduce((x, [de, para]) => x.replace(de, para), String(t ?? ''));

  function historicoFinanceiro(c) {
    const ev = [];
    ev.push({ em: c.criadoEm, texto: 'Contrato criado' });
    const ass = Contratos.assinadoEm(c);
    if (ass) ev.push({ em: `${ass}T12:00:00`, texto: 'Contrato assinado pelas duas partes' });
    const emissoes = new Map();
    c.parcelas.filter((p) => p.emitidaEm).forEach((p) => { if (!emissoes.has(p.emitidaEm)) emissoes.set(p.emitidaEm, []); emissoes.get(p.emitidaEm).push(p.n); });
    emissoes.forEach((ns, em) => ev.push({ em: `${em}T09:00:00`, texto: ns.length === 1 ? `Boleto da parcela ${ns[0]} emitido` : `Boletos das parcelas ${ns[0]} a ${ns[ns.length - 1]} emitidos` }));
    c.parcelas.filter((p) => p.status === 'paga' && p.pagoEm).forEach((p) => ev.push({ em: `${p.pagoEm}T14:00:00`, texto: `Parcela ${p.n}/${c.parcelas.length} paga · ${Contratos.fmtMoeda(p.valor)}` }));
    if (c.nf) ev.push({ em: `${c.nf.emitidaEm}T11:00:00`, texto: `Nota fiscal ${c.nf.numero} emitida` });
    (c.historico ?? []).filter((h) => /desist|acordo|cancel|renegoc|recupera/i.test(h.texto)).forEach((h) => ev.push({ em: h.em, texto: textoDoAluno(h.texto) }));
    return ev.sort((a, b) => b.em.localeCompare(a.em));
  }

  // Financeiro completo do aluno: um bloco por contrato (não rascunho/cancelado) + resumo.
  function financeiroDetalhado(alunoId, ref = hoje()) {
    const { lista, ctx } = contextoFinanceiro();
    const aluno = Clientes.porId(ctx.alunos, alunoId);
    const turmas = typeof Turmas !== 'undefined' ? Turmas.carregar() : [];
    const contratos = Contratos.contratosDoAluno(lista, alunoId)
      .filter((c) => c.status !== 'cancelado' && c.status !== 'rascunho')
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
      .map((c) => {
        const responsavel = Contratos.responsavelFinanceiro(ctx, c);
        const pagaEste = alunoPagaContrato(ctx, c, alunoId);
        const itens = Contratos.itensDoAluno(c, alunoId).map((it) => ({
          item: it,
          curso: Clientes.porId(ctx.cursos, it.cursoId),
          formacao: it.formacaoId ? Clientes.porId(ctx.formacoes, it.formacaoId) : null,
          turma: turmas.find((t) => t.id === it.turmaId) ?? null,
          valor: Contratos.valorMatricula(c, it),
          ativa: Contratos.matriculaAtiva(it),
        }));
        const parcelas = c.parcelas.map((p) => ({ ...p, situacao: situacaoParcela(p, ref), vencida: Contratos.parcelaVencida(p, ref) }));
        return {
          contrato: c, codigo: c.codigo, descricao: Contratos.descricao(ctx, c), venda: Contratos.resumoVenda(ctx, c),
          responsavel, pagaEste, itens, valorAluno: somar(itens.map((i) => ({ valor: i.valor }))),
          totais: Contratos.totais(c), situacao: Contratos.situacaoCobranca(c, ref),
          assinado: Contratos.assinado(c), assinadoEm: Contratos.assinadoEm(c), nf: c.nf ?? null,
          forma: c.cobranca?.forma ?? null, parcelas, historico: historicoFinanceiro(c),
        };
      });
    const todas = contratos.flatMap((b) => b.parcelas.map((p) => ({ ...p, bloco: b })));
    const vencidas = todas.filter((p) => p.vencida);
    const abertas = todas.filter((p) => p.status === 'emitida' || p.status === 'prevista');
    const proxima = abertas.filter((p) => p.vencimento >= ref).sort((a, b) => a.vencimento.localeCompare(b.vencimento))[0] ?? null;
    let situacao = 'sem_cobrancas';
    if (vencidas.length) situacao = 'vencida';
    else if (abertas.length) situacao = 'em_dia';
    else if (todas.some((p) => p.status === 'paga')) situacao = 'quitado';
    const formaPreferida = aluno?.cobranca?.formaPreferida ?? proxima?.bloco.forma ?? null;
    return {
      aluno, contratos, situacao, vencidas, abertas, proxima,
      totalPago: somar(todas.filter((p) => p.status === 'paga')), totalAberto: somar(abertas), totalVencido: somar(vencidas),
      formaPreferida, pagadorProprio: contratos.length ? contratos.every((b) => b.pagaEste) : (aluno?.pagador ?? 'proprio') === 'proprio',
    };
  }


  // ---------- Meus cursos (tela portal-aluno/cursos.html) ----------

  // Situação da matrícula como o aluno vê: junta o status do item de contrato com a fase da turma.
  const SITUACOES_MATRICULA = {
    concluida: { id: 'concluida', nome: 'Concluído' },
    em_andamento: { id: 'em_andamento', nome: 'Em andamento' },
    a_iniciar: { id: 'a_iniciar', nome: 'A iniciar' },
    congelada: { id: 'congelada', nome: 'Congelada' },
    desistiu: { id: 'desistiu', nome: 'Desistiu' },
    cancelada: { id: 'cancelada', nome: 'Cancelada' },
  };
  function situacaoMatricula(item, turma, ref = hoje()) {
    if (item.status === 'desistiu') return 'desistiu';
    if (item.status === 'congelada') return 'congelada';
    if (item.status === 'cancelada') return 'cancelada';
    if (item.status === 'concluido') return 'concluida';
    const s = Turmas.situacao(turma, ref);
    if (s === 'cancelada') return 'cancelada';
    if (s === 'concluida') return 'concluida';
    if (s === 'em_andamento') return 'em_andamento';
    return 'a_iniciar';
  }

  // ---- Presença (js/presencas-motor.js) ----
  // Frequência do aluno na turma como o portal mostra; null quando o motor de presenças não está na página.
  // Mínimo = o do certificado do curso quando definido; senão FREQUENCIA_MINIMA. Curso concluído/desistido
  // abaixo do mínimo = "reprovado por frequência"; em andamento = "em risco".
  function frequenciaMatricula(turma, alunoId, aulas, situacaoAluno, curso, ref = hoje()) {
    if (typeof Presencas === 'undefined') return null;
    const minimo = curso?.certificado?.frequenciaMinima ?? FREQUENCIA_MINIMA;
    const concluido = situacaoAluno === 'concluida' || situacaoAluno === 'desistiu' || situacaoAluno === 'cancelada';
    return Presencas.frequencia(turma.id, alunoId, aulas, ref, { concluido, minimo });
  }

  // Resumo de presença do aluno em todas as matrículas ativas (para a home do portal): percentual geral,
  // pior situação, cursos em risco/atenção e o curso em andamento com a frequência.
  function presencaResumo(alunoId, ref = hoje()) {
    if (typeof Presencas === 'undefined') return null;
    const ms = todasMatriculas(alunoId, ref).filter((m) => m.frequencia && m.situacaoAluno !== 'desistiu' && m.situacaoAluno !== 'cancelada' && m.situacaoAluno !== 'congelada');
    const geral = Presencas.consolidar(ms.map((m) => m.frequencia));
    const alertas = ms.filter((m) => ['risco', 'atencao', 'reprovado_frequencia'].includes(m.frequencia.status)).map((m) => ({ matricula: m, frequencia: m.frequencia }));
    const emAndamento = ms.filter((m) => m.situacaoAluno === 'em_andamento').map((m) => ({ matricula: m, frequencia: m.frequencia }));
    return { ...geral, alertas, emAndamento, matriculas: ms.length };
  }

  // Todas as matrículas do aluno (inclusive desistiu/cancelada), no mesmo formato de `matriculas`,
  // mais: `situacaoAluno` (concluida | em_andamento | a_iniciar | desistiu | cancelada), `horas` (carga
  // horária do curso — a da formação quando ela sobrescreve), `horasConcluidas` (aulas já dadas, limitadas
  // à carga horária; curso concluído conta tudo), `codigoMatricula`, `ordem` (posição na formação) e `area`.
  function todasMatriculas(alunoId, ref = hoje()) {
    const cursos = Cursos.carregar();
    const turmas = Turmas.carregar();
    const formacoes = typeof Formacoes !== 'undefined' ? Formacoes.carregar() : [];
    const instrutores = typeof Instrutores !== 'undefined' ? Instrutores.carregar() : [];
    const salas = typeof Salas !== 'undefined' ? Salas.carregar() : [];
    const areas = typeof Areas !== 'undefined' ? Areas.carregar() : [];
    const linhas = [];
    Contratos.contratosDoAluno(Contratos.carregar(), alunoId).forEach((c) => {
      if (c.status === 'rascunho') return;
      Contratos.itensDoAluno(c, alunoId).forEach((item) => {
        const turma = Turmas.porId(turmas, item.turmaId);
        if (!turma) return;
        const curso = Cursos.porId(cursos, item.cursoId ?? turma.cursoId);
        const formacao = turma.formacaoId ? Formacoes.porId(formacoes, turma.formacaoId) : null;
        const itemFormacao = formacao?.itens.find((i) => i.cursoId === (curso?.id ?? item.cursoId)) ?? null;
        const aulas = Turmas.aulas(turma);
        const realizadas = aulas.filter((a) => a.data < ref);
        const situacao = item.status === 'concluido' ? 'concluida' : Turmas.situacao(turma, ref);
        const situacaoAluno = c.status === 'cancelado' ? 'cancelada' : situacaoMatricula(item, turma, ref);
        const horas = itemFormacao?.cargaHoraria != null ? Number(itemFormacao.cargaHoraria) : Number(curso?.cargaHoraria) || 0;
        const horasDadas = Math.round(Turmas.horasAulas(realizadas) * 10) / 10;
        const horasConcluidas = situacaoAluno === 'concluida' ? horas : situacaoAluno === 'em_andamento' ? Math.min(horas, horasDadas) : 0;
        linhas.push({
          contrato: c, item, turma, curso, formacao,
          instrutor: instrutores.find((i) => i.id === turma.instrutorId) ?? null,
          sala: salas.find((s) => s.id === turma.salaId) ?? null,
          area: curso?.areaId ? Areas.porId(areas, curso.areaId) : null,
          aulas, realizadas: realizadas.length,
          progresso: aulas.length ? Math.round((realizadas.length / aulas.length) * 100) : 0,
          situacao, situacaoAluno, horas, horasConcluidas,
          codigoMatricula: Contratos.codigoMatricula(c, alunoId),
          ordem: formacao ? formacao.itens.findIndex((i) => i.cursoId === (curso?.id ?? item.cursoId)) : -1,
          // Presença (js/presencas-motor.js, quando carregado): null sem o motor.
          frequencia: frequenciaMatricula(turma, alunoId, aulas, situacaoAluno, curso, ref),
        });
      });
    });
    return linhas;
  }

  // Matrículas agrupadas por formação (+ grupo dos avulsos), na ordem da formação; formações concluídas por último.
  // Cada grupo: { chave, formacao, contrato, contratante, itens, concluidos, emAndamento, horas, horasConcluidas, inicio, fim, turno, situacao }.
  function cursosAgrupados(alunoId, ref = hoje()) {
    const ms = todasMatriculas(alunoId, ref);
    const { ctx } = contextoFinanceiro();
    const grupos = new Map();
    ms.forEach((m) => {
      const chave = m.formacao ? `${m.formacao.id}|${m.contrato.id}` : '_avulsos';
      if (!grupos.has(chave)) grupos.set(chave, { chave, formacao: m.formacao, contrato: m.formacao ? m.contrato : null, itens: [] });
      grupos.get(chave).itens.push(m);
    });
    const ordemSit = { em_andamento: 0, a_iniciar: 1, concluida: 2, desistiu: 3, cancelada: 4 };
    const lista = [...grupos.values()].map((g) => {
      g.itens.sort((a, b) => (g.formacao ? a.ordem - b.ordem : 0) || a.turma.inicio.localeCompare(b.turma.inicio));
      const ativos = g.itens.filter((m) => m.situacaoAluno !== 'desistiu' && m.situacaoAluno !== 'cancelada');
      g.concluidos = ativos.filter((m) => m.situacaoAluno === 'concluida').length;
      g.emAndamento = ativos.filter((m) => m.situacaoAluno === 'em_andamento').length;
      g.horas = ativos.reduce((s, m) => s + m.horas, 0);
      g.horasConcluidas = Math.round(ativos.reduce((s, m) => s + m.horasConcluidas, 0) * 10) / 10;
      g.inicio = g.itens.map((m) => m.turma.inicio).sort()[0] ?? null;
      g.fim = g.itens.map((m) => m.turma.fim).sort().pop() ?? null;
      g.turno = g.itens.find((m) => m.turma.turno)?.turma.turno ?? '';
      g.contratante = g.contrato ? Contratos.responsavelFinanceiro(ctx, g.contrato).nome : '';
      // Presença geral do grupo (soma das aulas dadas × válidas dos cursos ativos); null sem o motor de presenças.
      g.frequencia = typeof Presencas !== 'undefined' ? Presencas.consolidar(ativos.map((m) => m.frequencia), { concluido: ativos.length > 0 && ativos.every((m) => m.situacaoAluno === 'concluida') }) : null;
      if (!ativos.length) g.situacao = g.itens.every((m) => m.situacaoAluno === 'cancelada') ? 'cancelada' : 'desistiu';
      else if (ativos.every((m) => m.situacaoAluno === 'concluida')) g.situacao = 'concluida';
      else if (ativos.some((m) => m.situacaoAluno === 'em_andamento') || ativos.some((m) => m.situacaoAluno === 'concluida')) g.situacao = 'em_andamento';
      else g.situacao = 'a_iniciar';
      return g;
    });
    lista.sort((a, b) => (a.chave === '_avulsos') - (b.chave === '_avulsos') || (ordemSit[a.situacao] ?? 9) - (ordemSit[b.situacao] ?? 9) || String(a.inicio).localeCompare(String(b.inicio)));
    // Avulsos entre os grupos ativos e os concluídos: concluídas sempre por último.
    const concluidas = lista.filter((g) => g.chave !== '_avulsos' && (g.situacao === 'concluida' || g.situacao === 'desistiu' || g.situacao === 'cancelada'));
    const restantes = lista.filter((g) => !concluidas.includes(g));
    const ordenados = [...restantes, ...concluidas];
    const ativas = ms.filter((m) => m.situacaoAluno !== 'desistiu' && m.situacaoAluno !== 'cancelada');
    return {
      grupos: ordenados,
      matriculas: ms,
      totais: {
        formacoes: ordenados.filter((g) => g.formacao).length,
        cursos: ativas.length,
        concluidos: ativas.filter((m) => m.situacaoAluno === 'concluida').length,
        emAndamento: ativas.filter((m) => m.situacaoAluno === 'em_andamento').length,
        aIniciar: ativas.filter((m) => m.situacaoAluno === 'a_iniciar').length,
        horas: ativas.reduce((s, m) => s + m.horas, 0),
        horasConcluidas: Math.round(ativas.reduce((s, m) => s + m.horasConcluidas, 0) * 10) / 10,
      },
    };
  }

  // Detalhe de um curso do aluno (turma): aulas com situação e gravações, módulos marcados como dados,
  // softwares/materiais/pré-requisitos e situação do certificado.
  function detalheCurso(alunoId, turmaId, ref = hoje()) {
    const m = todasMatriculas(alunoId, ref).find((x) => x.turma.id === turmaId);
    if (!m) return null;
    const cursos = Cursos.carregar();
    const salas = typeof Salas !== 'undefined' ? Salas.carregar() : [];
    const agendadas = Turmas.aulasAgendadas(m.turma);
    const gravs = Turmas.gravacoes(m.turma);
    const aulas = (agendadas ?? m.aulas).map((a) => ({
      ...a,
      situacaoAula: a.status === 'cancelada' ? 'cancelada' : a.data < ref ? 'realizada' : a.data === ref ? 'hoje' : 'prevista',
      sala: (a.salaId ? salas.find((s) => s.id === a.salaId) : null) ?? m.sala,
      gravacoes: gravs.filter((g) => g.data === a.data),
      horas: Turmas.horasAula(a),
      // Registro de presença do aluno nesta aula (null: sem motor, aula futura ou chamada não feita).
      presenca: typeof Presencas !== 'undefined' && a.data < ref && a.status !== 'cancelada' ? Presencas.registroDe(m.turma.id, alunoId, a) : null,
    }));
    const realizadas = aulas.filter((a) => a.situacaoAula === 'realizada');
    // Módulos dados: pelos moduloIds das aulas realizadas quando o agendamento distribuiu conteúdo;
    // senão, estimativa pelas horas acumuladas (módulos na ordem até as horas já dadas).
    const comConteudo = realizadas.some((a) => (a.moduloIds ?? []).length);
    const dadosIds = new Set(realizadas.flatMap((a) => a.moduloIds ?? []));
    const horasDadas = realizadas.reduce((s, a) => s + a.horas, 0);
    let acc = 0;
    const modulos = (m.curso?.modulos ?? []).map((mod) => {
      const h = Number(mod.cargaHoraria) || 0;
      const ini = acc; acc += h;
      const dado = m.situacaoAluno === 'concluida' || (comConteudo ? dadosIds.has(mod.id) : h > 0 && acc <= horasDadas + 0.01);
      const emAndamento = !dado && !comConteudo && horasDadas > ini && horasDadas < acc;
      return { ...mod, dado, emAndamento, estimado: !comConteudo && m.situacaoAluno !== 'concluida' };
    });
    const catalogo = typeof SOFTWARES_CATALOGO !== 'undefined' ? SOFTWARES_CATALOGO : [];
    const softwares = (m.curso?.infraestrutura?.softwares ?? []).map((s) => ({ ...s, catalogo: s.softwareId ? catalogo.find((c) => c.id === s.softwareId) ?? null : null }));
    const preRequisitos = (m.curso?.preRequisitoCursoIds ?? []).map((id) => Cursos.porId(cursos, id)).filter(Boolean);
    const materiais = (m.curso?.materiais ?? []).filter((x) => !Cursos.materialPendente(x));
    const certCurso = m.curso?.certificado ?? null;
    const certFormacao = m.formacao?.certificado ?? null;
    const pendentes = aulas.filter((a) => a.situacaoAula !== 'realizada' && a.situacaoAula !== 'cancelada').length;
    let certificado;
    if (!certCurso?.emite) certificado = { situacao: 'nao_emite', texto: 'Este curso não emite certificado próprio.' };
    // Frequência abaixo do mínimo no curso concluído: sem certificado (regra do próprio curso).
    else if (m.situacaoAluno === 'concluida' && m.frequencia?.status === 'reprovado_frequencia') certificado = { situacao: 'indisponivel', texto: `Indisponível — frequência de ${m.frequencia.percentual}%, abaixo do mínimo de ${m.frequencia.minimo}%. Fale com a secretaria sobre reposição ou justificativa das faltas.`, motivo: 'frequencia' };
    else if (m.situacaoAluno === 'concluida') certificado = { situacao: 'disponivel', texto: 'Curso concluído — certificado disponível.' };
    else if (m.situacaoAluno === 'em_andamento') certificado = { situacao: 'em_curso', texto: `Faltam ${pendentes} ${pendentes === 1 ? 'aula' : 'aulas'} para concluir o curso.` };
    else if (m.situacaoAluno === 'a_iniciar') certificado = { situacao: 'a_iniciar', texto: `O curso começa em ${fmtData(m.turma.inicio)}.` };
    else certificado = { situacao: 'indisponivel', texto: m.situacaoAluno === 'desistiu' ? 'Matrícula encerrada por desistência — sem certificado.' : 'Matrícula cancelada — sem certificado.' };
    const { ctx } = contextoFinanceiro();
    return {
      ...m, aulas, realizadasLista: realizadas, modulos, softwares, preRequisitos, materiais,
      certificado: { ...certificado, curso: certCurso, formacao: certFormacao },
      contratante: Contratos.responsavelFinanceiro(ctx, m.contrato).nome,
      aulaHoje: aulas.some((a) => a.situacaoAula === 'hoje'),
      formacaoItens: m.formacao ? Formacoes.cursosDe(m.formacao, cursos) : [],
    };
  }


  // ---------- Suporte (tela portal-aluno/suporte.html) ----------
  // Grava na mesma chave/estrutura do motor de chamados (Chamados, js/chamados-motor.js).
  // O aluno não escolhe tipo, categoria nem prioridade: escolhe um ASSUNTO em linguagem
  // dele, e o assunto define tipo/categoria/prioridade internos.

  const ASSUNTOS_SUPORTE = [
    { id: 'aula', nome: 'Aula / conteúdo', descricao: 'Dúvida sobre a aula, o instrutor, a presença ou o material da turma.', tipo: 'software', categoriaId: 'duvida', prioridade: 'media', pedeTurma: true },
    { id: 'acesso', nome: 'Acesso e senha', descricao: 'Não consigo entrar no portal, no Meet ou na conta da escola.', tipo: 'software', categoriaId: 'acesso', prioridade: 'alta', pedeTurma: false },
    { id: 'gravacoes', nome: 'Gravações e materiais', descricao: 'Gravação que não abre, aula que não foi gravada, apostila ou arquivo faltando.', tipo: 'software', categoriaId: 'duvida', prioridade: 'media', pedeTurma: true },
    { id: 'financeiro', nome: 'Financeiro / boleto', descricao: 'Boleto, Pix, comprovante, nota fiscal ou valor da parcela.', tipo: 'software', categoriaId: 'duvida', prioridade: 'media', pedeTurma: false },
    { id: 'certificado', nome: 'Certificado', descricao: 'Certificado não liberado, nome ou carga horária errados.', tipo: 'software', categoriaId: 'dados', prioridade: 'media', pedeTurma: true },
    { id: 'instalacao', nome: 'Instalação de software no meu computador', descricao: 'Preciso de ajuda para instalar ou configurar um programa da aula na minha máquina.', tipo: 'software', categoriaId: 'duvida', prioridade: 'media', pedeTurma: true, pedeSoftware: true },
    { id: 'escola', nome: 'Computador ou sala da escola', descricao: 'Máquina do laboratório, internet, projetor, ar-condicionado.', tipo: 'infra', categoriaId: 'computador', prioridade: 'media', pedeTurma: true },
    { id: 'outro', nome: 'Outro assunto', descricao: 'Qualquer outra coisa — a secretaria encaminha para quem resolve.', tipo: 'software', categoriaId: 'outro-software', prioridade: 'media', pedeTurma: false },
  ];

  const SISTEMAS_OPERACIONAIS = [
    { id: 'windows11', nome: 'Windows 11' },
    { id: 'windows10', nome: 'Windows 10' },
    { id: 'macos', nome: 'macOS' },
    { id: 'linux', nome: 'Linux (Ubuntu ou outro)' },
    { id: 'chromebook', nome: 'Chromebook' },
    { id: 'nao-sei', nome: 'Não sei' },
  ];

  const CANAIS_SUPORTE = {
    whatsapp: { numero: '(47) 99999-0000', link: 'https://wa.me/5547999990000' },
    email: 'secretaria@proway.com.br',
    horario: 'segunda a sexta, das 8h às 22h; sábado, das 8h às 12h',
  };

  const assuntosSuporte = () => ASSUNTOS_SUPORTE;
  const assuntoSuporte = (id) => ASSUNTOS_SUPORTE.find((a) => a.id === id) ?? null;
  const sistemasOperacionais = () => SISTEMAS_OPERACIONAIS;
  const sistemaOperacional = (id) => SISTEMAS_OPERACIONAIS.find((s) => s.id === id) ?? null;
  const canaisSuporte = () => CANAIS_SUPORTE;

  // Autor do aluno no motor de chamados (snapshot, sempre como solicitante).
  const autorAluno = (aluno) => ({ tipo: 'aluno', id: aluno.id, nome: aluno.nomeSocial || aluno.nome, papel: 'solicitante' });

  const chamadosDoAluno = (lista, alunoId) => Chamados.doSolicitante(lista, 'aluno', alunoId);

  // Turma pré-selecionada no formulário: só quando há UMA única matrícula em andamento.
  function turmaPadrao(ms) {
    const andamento = ms.filter((m) => m.situacao === 'em_andamento');
    return andamento.length === 1 ? andamento[0].turma.id : '';
  }

  // Prazo de resposta em linguagem simples, a partir do SLA da prioridade interna.
  function prazoRespostaSimples(prioridade) {
    const h = Chamados.prioridadeDe(prioridade)?.slaHoras ?? 48;
    if (h <= 2) return 'em até 2 horas';
    if (h <= 8) return 'ainda hoje (em até 8 horas)';
    if (h <= 48) return 'em até 2 dias úteis';
    return 'em até 5 dias úteis';
  }

  function validarChamadoAluno(d) {
    const erros = [];
    const a = assuntoSuporte(d.assuntoId);
    if (!a) erros.push({ campo: 'assuntoId', mensagem: 'Escolha sobre o que é o chamado.' });
    if (!String(d.titulo ?? '').trim()) erros.push({ campo: 'titulo', mensagem: 'Resuma em uma linha.' });
    else if (d.titulo.trim().length < 8) erros.push({ campo: 'titulo', mensagem: 'Resumo muito curto — descreva um pouco mais.' });
    if (!String(d.descricao ?? '').trim()) erros.push({ campo: 'descricao', mensagem: 'Conte o que aconteceu.' });
    if (a?.pedeSoftware) {
      if (!d.softwareId) erros.push({ campo: 'softwareId', mensagem: 'Qual programa?' });
      if (!sistemaOperacional(d.sistemaOperacional)) erros.push({ campo: 'sistemaOperacional', mensagem: 'Qual o sistema do seu computador?' });
    }
    return erros;
  }

  // Monta os dados que Chamados.abrir espera + o contexto extra do portal.
  // `d`: { assuntoId, turmaId, titulo, descricao, softwareId, sistemaOperacional, anexos[] }
  function montarChamadoAluno(aluno, ms, d) {
    const a = assuntoSuporte(d.assuntoId);
    const m = d.turmaId ? ms.find((x) => x.turma.id === d.turmaId) ?? null : null;
    const sw = d.softwareId ? Chamados.softwareDe(d.softwareId) : null;
    const so = sistemaOperacional(d.sistemaOperacional);
    const linhas = [String(d.descricao ?? '').trim()];
    const contexto = [];
    if (m) contexto.push(`Turma: ${m.turma.codigo} · ${m.curso?.nome ?? ''}`.trim());
    if (sw) contexto.push(`Programa: ${sw.nome}${sw.versao ? ` ${sw.versao}` : ''}`);
    if (so) contexto.push(`Computador do aluno: ${so.nome}`);
    if (d.anexos?.length) contexto.push(`Anexos: ${d.anexos.join(', ')}`);
    if (contexto.length) linhas.push('', '— Informado pelo portal do aluno —', ...contexto);
    return {
      dados: {
        solicitante: autorAluno(aluno), tipo: a.tipo, categoriaId: a.categoriaId, prioridade: a.prioridade,
        titulo: String(d.titulo ?? '').trim(), descricao: linhas.join('\n'),
        salaId: a.tipo === 'infra' ? (m?.turma.salaId ?? null) : null,
        equipamento: sw ? `Computador pessoal${so ? ` · ${so.nome}` : ''}` : '',
      },
      extra: {
        origem: 'portal-aluno',
        contexto: { assuntoId: a.id, turmaId: m?.turma.id ?? null, turmaCodigo: m?.turma.codigo ?? null, cursoNome: m?.curso?.nome ?? null, softwareId: sw?.id ?? null, sistemaOperacional: so?.id ?? null, anexos: d.anexos ?? [] },
      },
    };
  }

  // Abre o chamado no motor de chamados e anexa o contexto do portal ao registro (campos extras
  // que as telas internas ignoram). Retorna { lista, chamado }.
  function abrirChamadoAluno(lista, aluno, ms, d) {
    const { dados, extra } = montarChamadoAluno(aluno, ms, d);
    const r = Chamados.abrir(lista, dados, autorAluno(aluno));
    const chamado = { ...r.chamado, ...extra };
    return { lista: r.lista.map((c) => (c.id === chamado.id ? chamado : c)), chamado };
  }

  // ---------- Contratos (tela portal-aluno/contratos.html) ----------

  // Situação do contrato como o aluno vê (o fluxo interno rascunho → aguardando → comercial OK → adm OK
  // vira Em elaboração / Aguardando assinatura / Ativo / Concluído / Cancelado).
  const SITUACOES_CONTRATO_PORTAL = [
    { id: 'rascunho', nome: 'Em elaboração', ponto: 'bg-slate-400' },
    { id: 'aguardando', nome: 'Aguardando assinatura', ponto: 'bg-amber-500' },
    { id: 'aguardando_pagamento', nome: 'Aguardando 1ª parcela', ponto: 'bg-amber-500' },
    { id: 'ativo', nome: 'Ativo', ponto: 'bg-emerald-500' },
    { id: 'concluido', nome: 'Concluído', ponto: 'bg-sky-500' },
    { id: 'cancelado', nome: 'Cancelado', ponto: 'bg-red-500' },
  ];
  function situacaoContrato(c, alunoId) {
    let id = c.status;
    if (c.status === 'aguardando' && Contratos.assinado(c)) id = 'aguardando_pagamento';
    if (c.status === 'comercial_ok' || c.status === 'adm_ok') {
      const itens = Contratos.itensDoAluno(c, alunoId).filter(Contratos.matriculaAtiva);
      id = itens.length && itens.every((i) => i.status === 'concluido') ? 'concluido' : 'ativo';
    }
    return SITUACOES_CONTRATO_PORTAL.find((s) => s.id === id) ?? SITUACOES_CONTRATO_PORTAL[2];
  }

  // Progresso de uma matrícula (item do contrato) para a aba Evolução.
  function progressoMatricula(item, ref = hoje()) {
    const turma = typeof Turmas !== 'undefined' ? Turmas.porId(Turmas.carregar(), item.turmaId) : null;
    const curso = Clientes.porId(Cursos.carregar(), item.cursoId ?? turma?.cursoId);
    const instrutores = typeof Instrutores !== 'undefined' ? Instrutores.carregar() : [];
    const aulas = turma ? Turmas.aulas(turma) : [];
    const realizadas = aulas.filter((a) => a.data <= ref).length;
    const pct = aulas.length ? Math.round((realizadas / aulas.length) * 100) : (turma ? Math.round(Contratos.progressoTurma(turma, ref, 'dias').fracao * 100) : 0);
    let situacao;
    if (item.status === 'desistiu') situacao = 'desistiu';
    else if (item.status === 'congelada') situacao = 'congelada';
    else if (item.status === 'cancelada') situacao = 'cancelada';
    else if (item.status === 'concluido' || (turma && turma.fim < ref)) situacao = 'concluido';
    else if (!turma) situacao = 'sem_turma';
    else if (turma.inicio > ref) situacao = 'a_iniciar';
    else situacao = 'em_andamento';
    return {
      item, curso, turma, instrutor: instrutores.find((i) => i.id === turma?.instrutorId) ?? null,
      aulas: aulas.length, realizadas, pct: situacao === 'concluido' ? 100 : situacao === 'a_iniciar' ? 0 : pct, situacao,
    };
  }

  // Linha do tempo do contrato: histórico + eventos dos envelopes Clicksign + NF + cancelamento (mais recente primeiro, sem repetição).
  function linhaDoTempoContrato(c) {
    const ev = [];
    (c.historico ?? []).forEach((h) => ev.push({ em: h.em, texto: textoDoAluno(h.texto), tipo: /assin/i.test(h.texto) ? 'assinatura' : /cancel/i.test(h.texto) ? 'cancelamento' : /NF |nota fiscal/i.test(h.texto) ? 'nf' : /boleto|parcela/i.test(h.texto) ? 'cobranca' : 'geral' }));
    Contratos.historicoAssinaturas(c).forEach((e) => { const texto = textoDoAluno(e.texto); if (!ev.some((x) => x.em === e.em && x.texto === texto)) ev.push({ em: e.em, texto, tipo: 'assinatura' }); });
    if (c.nf && !ev.some((x) => x.tipo === 'nf')) ev.push({ em: `${c.nf.emitidaEm}T11:00:00`, texto: `Nota fiscal ${c.nf.numero} emitida`, tipo: 'nf' });
    if (c.cancelamento?.em && !ev.some((x) => x.tipo === 'cancelamento')) ev.push({ em: c.cancelamento.em, texto: `Contrato cancelado${c.cancelamento.motivo ? `: ${c.cancelamento.motivo}` : ''}`, tipo: 'cancelamento' });
    return ev.sort((a, b) => String(b.em).localeCompare(String(a.em)));
  }

  // Contratação online: o aluno entrou pelo link do pacote (origem 'link'). A semente só tem 'escola'.
  const contratacaoOnline = (c, alunoId) => Contratos.vinculoDe(c, alunoId)?.origem === 'link';
  const diasDesde = (iso, ref = hoje()) => Math.round((Date.UTC(+ref.slice(0, 4), +ref.slice(5, 7) - 1, +ref.slice(8, 10)) - Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))) / 86400000);
  function arrependimento(c, alunoId, ref = hoje()) {
    const dias = diasDesde(c.criadoEm.slice(0, 10), ref);
    const limite = Contratos.REGRAS_RESCISAO.arrependimentoDias;
    return { online: contratacaoOnline(c, alunoId), dias, dentro: dias >= 0 && dias <= limite, limite, ate: (() => { const d = new Date(`${c.criadoEm.slice(0, 10)}T12:00:00`); d.setDate(d.getDate() + limite); return d.toISOString().slice(0, 10); })() };
  }

  // Signatário pendente do aluno no envelope em andamento (quando ele é o contratante).
  function assinaturaPendenteDoAluno(ctx, c, alunoId) {
    const env = Contratos.envelopeEmAndamento(c);
    if (!env || Contratos.assinaturaDe(c, 'contratante')) return null;
    const r = Contratos.responsavelFinanceiro(ctx, c);
    if (r.tipo !== 'aluno' || r.aluno?.id !== alunoId) return null;
    return env.signatarios.find((s) => s.papel === 'contratante' && s.status === 'pendente') ?? null;
  }

  // Turmas futuras do mesmo curso (para o pedido de transferência).
  function turmasParaTransferencia(item, ref = hoje()) {
    if (typeof Turmas === 'undefined') return [];
    return Turmas.carregar().filter((t) => t.cursoId === item.cursoId && t.id !== item.turmaId && t.inicio > ref && t.status !== 'cancelada').sort((a, b) => a.inicio.localeCompare(b.inicio));
  }

  // Um bloco por contrato do aluno (todos menos rascunho), com o que a tela de contratos precisa.
  function contratosDetalhados(alunoId, ref = hoje()) {
    const { lista, ctx } = contextoFinanceiro();
    const vendedores = typeof VENDEDORES !== 'undefined' ? VENDEDORES : [];
    return Contratos.contratosDoAluno(lista, alunoId)
      .filter((c) => c.status !== 'rascunho')
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
      .map((c) => {
        const responsavel = Contratos.responsavelFinanceiro(ctx, c);
        const itens = Contratos.itensDoAluno(c, alunoId);
        const matriculas = itens.map((it) => progressoMatricula(it, ref));
        const turmas = matriculas.map((m) => m.turma).filter(Boolean);
        const inicio = turmas.map((t) => t.inicio).sort()[0] ?? null;
        const fim = turmas.map((t) => t.fim).sort().pop() ?? null;
        const ativas = matriculas.filter((m) => Contratos.matriculaAtiva(m.item));
        return {
          contrato: c, codigo: c.codigo, situacao: situacaoContrato(c, alunoId),
          descricao: Contratos.descricao(ctx, c), venda: Contratos.resumoVenda(ctx, c),
          responsavel, ehContratante: responsavel.tipo === 'aluno' && responsavel.aluno?.id === alunoId,
          vinculo: Contratos.vinculoDe(c, alunoId), itens, matriculas, inicio, fim,
          concluidos: ativas.filter((m) => m.situacao === 'concluido').length, totalAtivos: ativas.length,
          valorAluno: somar(itens.map((i) => ({ valor: Contratos.valorMatricula(c, i) }))), totais: Contratos.totais(c),
          vendedor: vendedores.find((v) => v.id === c.vendedorId)?.nome ?? '',
          assinaturas: { contratante: Contratos.assinaturaDe(c, 'contratante'), escola: Contratos.assinaturaDe(c, 'escola') },
          assinado: Contratos.assinado(c), assinadoEm: Contratos.assinadoEm(c), envelope: Contratos.envelopeAtual(c),
          assinaturaPendente: assinaturaPendenteDoAluno(ctx, c, alunoId),
          nf: c.nf ?? null, arrependimento: arrependimento(c, alunoId, ref), linhaDoTempo: linhaDoTempoContrato(c), ctx,
        };
      });
  }

  // Rescisão como o aluno vê: data = hoje, 1/3 por aulas, desconto perde eficácia; arrependimento só se contratação online.
  const simularRescisaoPortal = (bloco, ref = hoje()) => Contratos.simularRescisao(bloco.ctx, bloco.contrato, { data: ref, criterio: 'aulas', perdeDesconto: true, arrependimento: bloco.arrependimento.online });

  // ---------- Solicitações do aluno (localStorage próprio do portal) ----------

  const CHAVE_SOLICITACOES = 'aulor-v1-portal-aluno-solicitacoes-v1';
  const TIPOS_SOLICITACAO = [
    { id: 'cancelamento', nome: 'Cancelamento do contrato', descricao: 'Rescisão do contrato inteiro, com o acerto calculado pelos Termos Gerais.' },
    { id: 'segunda_via', nome: 'Segunda via / atualização de dados', descricao: 'Nova cópia do contrato ou correção dos seus dados no documento.' },
    { id: 'trancamento', nome: 'Trancamento', descricao: 'Pausa temporária das aulas, mantendo o contrato.' },
    { id: 'transferencia', nome: 'Transferência de turma', descricao: 'Trocar uma matrícula para outra turma futura do mesmo curso.' },
  ];
  const STATUS_SOLICITACAO = [
    { id: 'em_analise', nome: 'Em análise', ponto: 'bg-amber-500' },
    { id: 'aprovada', nome: 'Aprovada', ponto: 'bg-emerald-500' },
    { id: 'recusada', nome: 'Recusada', ponto: 'bg-red-500' },
    { id: 'cancelada_pelo_aluno', nome: 'Desistiu do pedido', ponto: 'bg-slate-400' },
  ];
  function solicitacoes() {
    try { const l = JSON.parse(localStorage.getItem(CHAVE_SOLICITACOES) ?? '[]'); return Array.isArray(l) ? l : []; } catch (_) { return []; }
  }
  const salvarSolicitacoes = (l) => localStorage.setItem(CHAVE_SOLICITACOES, JSON.stringify(l));
  const solicitacoesDoAluno = (alunoId, contratoId = null) => solicitacoes().filter((s) => s.alunoId === alunoId && (!contratoId || s.contratoId === contratoId)).sort((a, b) => b.em.localeCompare(a.em));
  const solicitacaoAberta = (alunoId, contratoId, tipo) => solicitacoesDoAluno(alunoId, contratoId).find((s) => s.tipo === tipo && s.status === 'em_analise') ?? null;
  function registrarSolicitacao({ alunoId, contratoId, tipo, dados = {} }) {
    const l = solicitacoes();
    const s = { id: `sol${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`, alunoId, contratoId, tipo, em: new Date().toISOString().slice(0, 19), status: 'em_analise', dados, resposta: null };
    salvarSolicitacoes([...l, s]);
    return s;
  }
  function desistirSolicitacao(id) {
    salvarSolicitacoes(solicitacoes().map((s) => (s.id === id && s.status === 'em_analise' ? { ...s, status: 'cancelada_pelo_aluno', canceladaEm: new Date().toISOString().slice(0, 19) } : s)));
  }

  // Avatar do chip/cabeçalho: foto do cadastro (`aluno.foto`, enviada em meus-dados.html) ou iniciais.
  const escHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const avatarHtml = (aluno, nome = aluno?.nomeSocial || aluno?.nome) => (aluno?.foto ? `<img src="${escHtml(aluno.foto)}" alt="" class="h-full w-full object-cover rounded-full">` : escHtml(iniciais(nome)));

  return {
    CHAVE_SESSAO, SENHA_PROTOTIPO, hoje,
    sessao, entrar, sair, autenticar, alunoLogado, iniciais, primeiroNome, avatarHtml,
    fmtData, fmtDataLonga, rotuloDia, diaSemana,
    matriculas, proximasAulas, enviosAvaliacao, avaliacoesPendentes, gravacoesRecentes, financeiro,
    contextoFinanceiro, financeiroDetalhado, situacaoParcela, linhaDigitavel, pixCopiaCola, historicoFinanceiro,
    SITUACOES_MATRICULA, situacaoMatricula, todasMatriculas, cursosAgrupados, detalheCurso, frequenciaMatricula, presencaResumo,
    // contratos (portal-aluno/contratos.html)
    SITUACOES_CONTRATO_PORTAL, situacaoContrato, progressoMatricula, linhaDoTempoContrato, contratacaoOnline, arrependimento, assinaturaPendenteDoAluno, turmasParaTransferencia, contratosDetalhados, simularRescisaoPortal,
    CHAVE_SOLICITACOES, TIPOS_SOLICITACAO, STATUS_SOLICITACAO, solicitacoes, solicitacoesDoAluno, solicitacaoAberta, registrarSolicitacao, desistirSolicitacao,
    // suporte (portal-aluno/suporte.html)
    assuntosSuporte, assuntoSuporte, sistemasOperacionais, sistemaOperacional, canaisSuporte, autorAluno, chamadosDoAluno, turmaPadrao, prazoRespostaSimples, validarChamadoAluno, montarChamadoAluno, abrirChamadoAluno,
  };
})();
