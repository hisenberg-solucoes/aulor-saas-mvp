// ============================================================
// Portal do Professor — motor (sem DOM).
// Sessão do instrutor logado + consultas sobre os cadastros do
// administrativo (Instrutores, Turmas, Cursos, Formações, Salas,
// Contratos/Clientes para as matrículas…). Só leitura.
// ============================================================

const PortalProfessor = (() => {
  const CHAVE_SESSAO = 'prototipo-portal-professor-sessao';
  // Senha única do protótipo: no sistema real vem do cadastro de usuário (permissoes.html, tipo "professor").
  const SENHA_PROTOTIPO = '123456';

  const hoje = () => (typeof Turmas !== 'undefined' ? Turmas.hoje() : Instrutores.hoje());
  const normalizarEmail = (s) => String(s ?? '').trim().toLowerCase();

  // ---------- Sessão ----------

  function sessao() {
    try {
      const s = JSON.parse(localStorage.getItem(CHAVE_SESSAO) ?? 'null');
      return s && s.instrutorId ? s : null;
    } catch (_) { return null; }
  }
  const entrar = (instrutorId) => localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ instrutorId, em: new Date().toISOString() }));
  const sair = () => localStorage.removeItem(CHAVE_SESSAO);

  // Login por e-mail do instrutor cadastrado (contato.email) + senha do protótipo.
  function autenticar(email, senha) {
    const e = normalizarEmail(email);
    if (!e) return { erro: 'Informe o e-mail.' };
    if (!senha) return { erro: 'Informe a senha.' };
    const instrutor = Instrutores.carregar().find((i) => normalizarEmail(i.contato?.email) === e) ?? null;
    if (!instrutor || senha !== SENHA_PROTOTIPO) return { erro: 'E-mail ou senha incorretos.' };
    if (instrutor.status === 'inativo') return { erro: 'Seu acesso está inativo. Fale com a coordenação.' };
    return { instrutor };
  }

  const instrutorLogado = () => {
    const s = sessao();
    return s ? Instrutores.porId(Instrutores.carregar(), s.instrutorId) : null;
  };

  const iniciais = (nome) => Instrutores.iniciais(nome);
  // Avatar do chip/cabeçalho: foto do cadastro (`instrutor.foto`, enviada em meus-dados.html ou pela coordenação) ou iniciais.
  const escHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const avatarHtml = (i) => (i?.foto ? `<img src="${escHtml(i.foto)}" alt="" class="h-full w-full object-cover rounded-full">` : escHtml(iniciais(i?.nome)));
  const primeiroNome = (i) => (i?.apelido || String(i?.nome ?? '').split(/\s+/)[0] || '');
  // Avatar do ALUNO nas listas do portal (aba Alunos/Frequência da turma, chamada do dia): círculo completo com a
  // foto do cadastro (`aluno.foto`, enviada em portal-aluno/meus-dados.html) ou as iniciais do nome social/nome.
  // `tamanho` = classes de dimensão do círculo (ex.: 'h-9 w-9', 'h-7 w-7'); a fonte das iniciais acompanha o tamanho.
  const avatarAlunoHtml = (aluno, tamanho = 'h-9 w-9') => {
    const nome = aluno?.nomeSocial || aluno?.nome;
    const fonte = /h-(5|6|7)\b/.test(tamanho) ? 'text-[10px]' : 'text-xs';
    const miolo = aluno?.foto ? `<img src="${escHtml(aluno.foto)}" alt="" class="h-full w-full object-cover">` : escHtml(iniciais(nome));
    return `<div class="${tamanho} shrink-0 rounded-full bg-petrol-800 dark:bg-sky-600 text-white grid place-items-center ${fonte} font-semibold overflow-hidden" aria-hidden="true">${miolo}</div>`;
  };

  // ---------- Datas ----------

  const fmtData = (iso) => (iso ? Instrutores.fmtData(iso) : '');
  const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const diaSemana = (iso) => DIAS[new Date(`${iso}T12:00:00`).getDay()];
  const fmtDataLonga = (iso) => {
    const d = new Date(`${iso}T12:00:00`);
    return `${diaSemana(iso)}, ${d.getDate()} de ${['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][d.getMonth()]}`;
  };
  const somarDias = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const rotuloDia = (iso, ref = hoje()) => {
    if (iso === ref) return 'Hoje';
    if (iso === somarDias(ref, 1)) return 'Amanhã';
    if (iso === somarDias(ref, -1)) return 'Ontem';
    return fmtDataLonga(iso);
  };

  // ---------- Turmas do instrutor ----------

  // Turmas (não canceladas) em que o instrutor é o responsável, enriquecidas com curso, formação,
  // sala, aulas (agendadas ou prévia da agenda), realizadas, progresso, situação e alunos matriculados.
  function turmas(instrutorId, ref = hoje()) {
    const cursos = Cursos.carregar();
    const formacoes = typeof Formacoes !== 'undefined' ? Formacoes.carregar() : [];
    const salas = typeof Salas !== 'undefined' ? Salas.carregar() : [];
    const alunosCadastro = typeof Clientes !== 'undefined' ? Clientes.carregar().alunos : [];
    const linhas = Turmas.carregar()
      .filter((t) => t.instrutorId === instrutorId && t.status !== 'cancelada')
      .map((turma) => {
        const aulas = Turmas.aulas(turma);
        const realizadas = aulas.filter((a) => a.data < ref).length;
        const ms = Turmas.matriculas(turma);
        const alunos = (ms?.linhas ?? [])
          .filter((l) => l.matricula.status === 'matriculado' || l.matricula.status === 'concluido')
          .map((l) => Clientes.porId(alunosCadastro, l.alunoId))
          .filter(Boolean)
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        return {
          turma,
          curso: Cursos.porId(cursos, turma.cursoId),
          formacao: turma.formacaoId ? Formacoes.porId(formacoes, turma.formacaoId) : null,
          sala: turma.salaId ? Salas.porId(salas, turma.salaId) : null,
          aulas, realizadas,
          progresso: aulas.length ? Math.round((realizadas / aulas.length) * 100) : 0,
          situacao: Turmas.situacao(turma, ref), // em_andamento | planejada | confirmada | concluida
          alunos,
          gravacoes: Turmas.gravacoes(turma),
        };
      });
    const ordem = { em_andamento: 0, confirmada: 1, planejada: 1, concluida: 2 };
    return linhas.sort((a, b) => (ordem[a.situacao] ?? 9) - (ordem[b.situacao] ?? 9) || a.turma.inicio.localeCompare(b.turma.inicio) || a.turma.codigo.localeCompare(b.turma.codigo, 'pt-BR'));
  }

  const ativas = (ts) => ts.filter((t) => t.situacao !== 'concluida');

  // Próximas aulas (hoje em diante) das turmas não concluídas, em ordem cronológica.
  function proximasAulas(ts, ref = hoje(), limite = 5) {
    const lista = [];
    ativas(ts).forEach((t) => t.aulas.filter((a) => a.data >= ref).forEach((a) => lista.push({ ...a, turma: t })));
    return lista.sort((a, b) => a.data.localeCompare(b.data) || a.inicio.localeCompare(b.inicio)).slice(0, limite);
  }

  // Primeira aula de hoje (ou null).
  const aulaDeHoje = (ts, ref = hoje()) => proximasAulas(ts, ref, 100).find((a) => a.data === ref) ?? null;

  // Gravações do Meet mais recentes entre as turmas do instrutor.
  function gravacoesRecentes(ts, limite = 4) {
    const lista = [];
    ts.forEach((t) => t.gravacoes.forEach((g) => lista.push({ ...g, turma: t })));
    return lista.sort((a, b) => b.data.localeCompare(a.data)).slice(0, limite);
  }

  // ---------- Pendências ----------
  // O que a base permite derivar hoje:
  //  - aulas já agendadas (aba Aulas de turma.html), realizadas até hoje, sem conteúdo nem módulo registrado → "diário de aula";
  //  - turma online/híbrida não concluída sem link do Meet;
  //  - aulas passadas de turma com Meet sem gravação registrada naquela data (últimos 14 dias);
  //  - dossiês dos alunos do período atual ainda sem o registro do professor (quando o motor de dossiês está carregado);
  //  - contrato de instrutor no Clicksign aguardando a assinatura dele;
  //  - pagamentos aguardando a nota fiscal do instrutor.
  function pendencias(instrutor, ts, ref = hoje()) {
    const p = [];
    const desde = somarDias(ref, -14);
    ts.forEach((t) => {
      const agendadas = Turmas.temAgendamento(t.turma);
      if (agendadas) {
        const semConteudo = t.aulas.filter((a) => a.data <= ref && !String(a.conteudo ?? '').trim() && !(a.moduloIds ?? []).length);
        if (semConteudo.length) p.push({ tipo: 'diario', turma: t, qtd: semConteudo.length, texto: `${semConteudo.length} ${semConteudo.length === 1 ? 'aula sem conteúdo registrado' : 'aulas sem conteúdo registrado'} em ${t.turma.codigo}`, href: `turma.html?id=${encodeURIComponent(t.turma.id)}&aba=aulas` });
      }
      const online = t.turma.formato === 'online' || t.turma.formato === 'hibrido';
      if (online && t.situacao !== 'concluida' && !t.turma.meetLink) p.push({ tipo: 'meet', turma: t, qtd: 1, texto: `${t.turma.codigo} é ${t.turma.formato === 'online' ? 'online' : 'híbrida'} e não tem link do Meet`, href: `turma.html?id=${encodeURIComponent(t.turma.id)}` });
      if (t.turma.meetLink) {
        const datasGravadas = new Set(t.gravacoes.map((g) => g.data));
        const semGravacao = t.aulas.filter((a) => a.data < ref && a.data >= desde && !datasGravadas.has(a.data));
        if (semGravacao.length) p.push({ tipo: 'gravacao', turma: t, qtd: semGravacao.length, texto: `${semGravacao.length} ${semGravacao.length === 1 ? 'aula sem gravação registrada' : 'aulas sem gravação registrada'} em ${t.turma.codigo}`, href: `turma.html?id=${encodeURIComponent(t.turma.id)}&aba=gravacoes` });
      }
    });
    // Dossiês dos alunos (js/dossies-motor.js, opcional): alunos do período atual das turmas em andamento sem o registro deste professor.
    if (typeof Dossies !== 'undefined') {
      const ctxDossies = Dossies.contexto(ref);
      Dossies.pendentesDoInstrutor(ctxDossies, instrutor.id, ref).filter((x) => x.pendentes > 0).forEach((x) => {
        const t = ts.find((y) => y.turma.id === x.turma.id) ?? null;
        p.push({ tipo: 'dossie', turma: t, qtd: x.pendentes, texto: `${x.pendentes} ${x.pendentes === 1 ? 'dossiê a preencher' : 'dossiês a preencher'} em ${x.turma.codigo} (${x.periodo.rotulo})`, href: 'dossies.html' });
      });
    }
    (instrutor.contratos ?? []).filter((c) => c.status === 'assinatura' && !c.clicksign?.instrutorAssinouEm).forEach((c) => p.push({ tipo: 'contrato', qtd: 1, texto: `Contrato ${c.codigo} aguarda sua assinatura`, href: `contrato.html?id=${encodeURIComponent(c.id)}` }));
    const aguardandoNf = (instrutor.pagamentos ?? []).filter((pg) => Instrutores.statusPagamento(pg) === 'aguardando_nf');
    if (aguardandoNf.length) p.push({ tipo: 'nf', qtd: aguardandoNf.length, texto: `${aguardandoNf.length} ${aguardandoNf.length === 1 ? 'pagamento aguarda' : 'pagamentos aguardam'} sua nota fiscal`, href: `pagamentos.html` });
    return p;
  }

  // ---------- Pagamentos ----------
  // Resumo a partir de `instrutor.pagamentos` (status derivado: aguardando NF → liberado → pago).
  function pagamentos(instrutor, ref = hoje()) {
    const lista = (instrutor.pagamentos ?? []).map((p) => ({ ...p, status: Instrutores.statusPagamento(p) }));
    const abertos = lista.filter((p) => p.status !== 'pago').sort((a, b) => a.previsto.localeCompare(b.previsto));
    const pagos = lista.filter((p) => p.status === 'pago').sort((a, b) => b.pagoEm.localeCompare(a.pagoEm));
    return {
      total: lista.length,
      abertos,
      aguardandoNf: abertos.filter((p) => p.status === 'aguardando_nf'),
      liberados: abertos.filter((p) => p.status === 'liberado'),
      proximo: abertos[0] ?? null,
      ultimoPago: pagos[0] ?? null,
      totalAberto: abertos.reduce((s, p) => s + p.valor, 0),
      totalPagoAno: pagos.filter((p) => p.pagoEm.startsWith(ref.slice(0, 4))).reduce((s, p) => s + p.valor, 0),
    };
  }

  // ---------- Avaliações dos alunos (anônimas para o professor) ----------
  // Semente em js/avaliacoes-data.js (AVALIACOES; TURMAS_AVALIACAO[].cadastroId liga à turma do cadastro)
  // + cálculos de js/avaliacoes-motor.js (Avaliacoes). Os dois são opcionais: sem eles, tudo devolve vazio.
  // REGRA: o professor nunca vê quem respondeu — `anonimizar` tira nome, matrícula e telefone antes
  // de qualquer coisa sair do motor; só médias, distribuição e o texto dos comentários chegam à tela.
  const temAvaliacoes = () => typeof AVALIACOES !== 'undefined' && typeof Avaliacoes !== 'undefined';
  // O professor só vê o que é sobre ele: grupos "Aula de hoje" e "Instrutor". O grupo "Estrutura" (sala,
  // equipamentos, recepção) é assunto da coordenação e nunca sai deste motor (08/09/2026).
  const GRUPOS_PROFESSOR = typeof GRUPOS !== 'undefined' ? GRUPOS.filter((g) => g.id === 'aula' || g.id === 'instrutor') : [];
  const INDICADORES_PROFESSOR = new Set(GRUPOS_PROFESSOR.flatMap((g) => g.indicadores.map((i) => i.id)));
  const soDoProfessor = (respostas) => Object.fromEntries(Object.entries(respostas ?? {}).filter(([id]) => INDICADORES_PROFESSOR.has(id)));
  const anonimizar = (a) => ({ id: a.id, data: a.data, turmaId: a.turmaId, respostas: soDoProfessor(a.respostas), abertas: a.abertas ?? {}, enviadaEm: a.enviadaEm ?? null });
  const turmaAvaliacaoDe = (turmaId) => (typeof TURMAS_AVALIACAO !== 'undefined' ? TURMAS_AVALIACAO.find((x) => x.cadastroId === turmaId) ?? null : null);

  // Turmas do instrutor que têm avaliação na semente (mapa id da semente → turma do portal).
  function mapaTurmasAvaliadas(ts) {
    const mapa = new Map();
    if (!temAvaliacoes()) return mapa;
    ts.forEach((t) => { const tAval = turmaAvaliacaoDe(t.turma.id); if (tAval) mapa.set(tAval.id, t); });
    return mapa;
  }

  // Avaliações (anônimas) de uma aula = turma do cadastro + data.
  function avaliacoesDaAula(turmaId, data) {
    if (!temAvaliacoes()) return [];
    const tAval = turmaAvaliacaoDe(turmaId);
    return tAval ? AVALIACOES.filter((a) => a.turmaId === tAval.id && a.data === data).map(anonimizar) : [];
  }

  // Avaliações (anônimas) das turmas do instrutor no intervalo [de, ate]; cada uma leva a turma do portal.
  function avaliacoesDoInstrutor(ts, de, ate) {
    const mapa = mapaTurmasAvaliadas(ts);
    if (!mapa.size) return [];
    return AVALIACOES.filter((a) => mapa.has(a.turmaId) && a.data >= de && a.data <= ate).map((a) => ({ ...anonimizar(a), turma: mapa.get(a.turmaId) }));
  }

  // Resumo agregado (médias por indicador/grupo, distribuição, comentários sem autor, melhor/pior indicador).
  function resumoAvaliacoes(avaliacoes) {
    const r = Avaliacoes.resumoConjunto(avaliacoes);
    r.comentarios = r.comentarios.map(({ aluno, ...c }) => c); // garantia extra: comentário sem autor
    return r;
  }

  // (08/09/2026) `referenciaEscola` — média de todas as turmas da escola — foi removida: o professor só vê
  // dados das próprias turmas; a comparação passou a ser com o período anterior dele mesmo.

  // Aulas avaliadas (turma × dia) do instrutor no intervalo, da mais recente para a mais antiga.
  function aulasAvaliadas(ts, de, ate) {
    const grupos = new Map();
    avaliacoesDoInstrutor(ts, de, ate).forEach((a) => {
      const chave = `${a.turma.turma.id}|${a.data}`;
      if (!grupos.has(chave)) grupos.set(chave, { turma: a.turma, data: a.data, avaliacoes: [] });
      grupos.get(chave).avaliacoes.push(a);
    });
    return [...grupos.values()]
      .map((g) => {
        const r = resumoAvaliacoes(g.avaliacoes);
        // Base da adesão: matriculados no cadastro; nunca menor que as respostas (a semente de avaliações
        // tem mais respondentes que a matrícula real em algumas turmas) [sup.].
        const alunos = Math.max(g.turma.alunos.length || turmaAvaliacaoDe(g.turma.turma.id)?.alunos || 0, r.respostas);
        return { ...g, ...r, alunos, adesao: alunos ? r.respostas / alunos : null, pontosAtencao: INDICADORES.filter((i) => r.indicadores[i.id] != null && r.indicadores[i.id] < Avaliacoes.LIMIAR_ATENCAO).map((i) => ({ indicador: i, media: r.indicadores[i.id] })) };
      })
      .sort((a, b) => b.data.localeCompare(a.data) || a.turma.turma.codigo.localeCompare(b.turma.turma.codigo, 'pt-BR'));
  }

  // Última aula avaliada até a data de referência (destaque da home).
  const ultimaAulaAvaliada = (ts, ref = hoje(), dias = 60) => aulasAvaliadas(ts, somarDias(ref, -dias), ref)[0] ?? null;

  return {
    CHAVE_SESSAO, SENHA_PROTOTIPO, hoje,
    sessao, entrar, sair, autenticar, instrutorLogado, iniciais, primeiroNome, avatarHtml, avatarAlunoHtml,
    fmtData, fmtDataLonga, rotuloDia, diaSemana, somarDias,
    turmas, proximasAulas, aulaDeHoje, gravacoesRecentes, pendencias, pagamentos,
    temAvaliacoes, GRUPOS_PROFESSOR, mapaTurmasAvaliadas, avaliacoesDaAula, avaliacoesDoInstrutor, resumoAvaliacoes, aulasAvaliadas, ultimaAulaAvaliada,
  };
})();
