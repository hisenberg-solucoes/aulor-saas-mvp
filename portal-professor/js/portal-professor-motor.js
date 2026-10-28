// ============================================================
// Portal do Professor — motor (sem DOM).
// Sessão do instrutor logado + consultas sobre os cadastros do
// administrativo (Instrutores, Turmas, Cursos, Formações, Salas,
// Contratos/Clientes para as matrículas…). Só leitura.
// ============================================================

const PortalProfessor = (() => {
  const CHAVE_SESSAO = 'aulor-v1-portal-professor-sessao';
  // Senha única do protótipo: no sistema real vem do cadastro de usuário (tipo "professor").
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
  // Avatar do chip/cabeçalho: foto do cadastro (`instrutor.foto`, enviada pela coordenação) ou iniciais.
  const escHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const avatarHtml = (i) => (i?.foto ? `<img src="${escHtml(i.foto)}" alt="" class="h-full w-full object-cover rounded-full">` : escHtml(iniciais(i?.nome)));
  const primeiroNome = (i) => (i?.apelido || String(i?.nome ?? '').split(/\s+/)[0] || '');
  // Avatar do ALUNO nas listas do portal (aba Alunos da turma): círculo completo com a
  // foto do cadastro (`aluno.foto`) ou as iniciais do nome social/nome.
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
        // Prévia sem os feriados, como o Gerar aulas da coordenação vai gravar.
        const aulas = Turmas.temAgendamento(turma) ? Turmas.aulas(turma) : Turmas.aulas(turma).filter((a) => !Aulas.feriado(a.data));
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

  // ---------- Pendências ----------
  // Na V1 (sem diário, gravações, dossiês, contratos nem pagamentos no portal): a turma online/híbrida
  // sem link do Meet, a aula de hoje ou de amanhã ainda sem material e o material não liberado de aula
  // que já aconteceu (estas duas só com as aulas geradas e o motor de materiais carregado).
  function pendencias(instrutor, ts, ref = hoje()) {
    const p = [];
    ts.forEach((t) => {
      const href = `turma.html?id=${encodeURIComponent(t.turma.id)}&aba=aulas`;
      const online = t.turma.formato === 'online' || t.turma.formato === 'hibrido';
      if (online && t.situacao !== 'concluida' && !t.turma.meetLink) p.push({ tipo: 'meet', turma: t, qtd: 1, texto: `${t.turma.codigo} é ${t.turma.formato === 'online' ? 'online' : 'híbrida'} e ainda não tem link do Meet; a coordenação cadastra`, href });
      if (typeof Materiais === 'undefined' || !Turmas.temAgendamento(t.turma)) return;
      const amanha = somarDias(ref, 1);
      t.aulas.filter((a) => (a.data === ref || a.data === amanha) && !Materiais.daAula(t.turma.id, a.id).length).forEach((a) => {
        p.push({ tipo: 'sem_material', turma: t, qtd: 1, texto: `A aula de ${rotuloDia(a.data, ref).toLowerCase()} (${a.inicio}) ainda não tem material`, href });
      });
      const passadas = new Set(t.aulas.filter((a) => a.data <= ref).map((a) => a.id));
      const presos = Materiais.daTurma(t.turma.id).filter((m) => passadas.has(m.aulaId) && Materiais.situacao(m, ref) === 'bloqueado').length;
      if (presos) p.push({ tipo: 'nao_liberado', turma: t, qtd: presos, texto: `${presos} ${presos === 1 ? 'material de aula que já aconteceu ainda não foi liberado' : 'materiais de aulas que já aconteceram ainda não foram liberados'}`, href });
    });
    return p;
  }

  return {
    CHAVE_SESSAO, SENHA_PROTOTIPO, hoje,
    sessao, entrar, sair, autenticar, instrutorLogado, iniciais, primeiroNome, avatarHtml, avatarAlunoHtml,
    fmtData, fmtDataLonga, rotuloDia, diaSemana, somarDias,
    turmas, pendencias,
  };
})();
