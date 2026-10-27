// Portal do Professor — Aula (detalhe): cabeçalho + abas Chamada e Diário.
// URL: aula.html?turma=<turmaId>&data=<YYYY-MM-DD>[&inicio=HH:MM][#chamada|#diario]
// A aula é casada pela DATA (as aulas da prévia da agenda não têm id); `aula.id`, quando
// existe, vai junto no registro (aulaId) só para referência.
(() => {
  const instrutor = PortalProfessor.instrutorLogado();
  if (!instrutor) { PortalProfessor.sair(); location.replace('login.html'); return; }

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hoje = PortalProfessor.hoje();
  const FORMATO = { presencial: 'Presencial', online: 'Online ao vivo', hibrido: 'Híbrido', ead: 'EAD' };
  const ICONE_CAMERA = '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>';

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast-anim pointer-events-auto rounded-lg bg-slate-900 dark:bg-neutral-800 text-white text-sm px-4 py-2 shadow-lg';
    el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  // ---------- Cabeçalho do shell (igual à home) ----------

  $('avatar').innerHTML = PortalProfessor.avatarHtml(instrutor);
  $('nome-usuario').textContent = instrutor.nome;
  const menu = $('menu-usuario');
  const listaMenu = $('menu-usuario-lista');
  const fecharMenu = () => { listaMenu.classList.add('hidden'); menu.setAttribute('aria-expanded', 'false'); };
  menu.addEventListener('click', (e) => {
    e.stopPropagation();
    const abrir = listaMenu.classList.contains('hidden');
    listaMenu.classList.toggle('hidden', !abrir);
    menu.setAttribute('aria-expanded', String(abrir));
  });
  document.addEventListener('click', fecharMenu);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { fecharMenu(); fecharModal(); } });
  document.querySelectorAll('[data-em-breve]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); toast(`"${el.textContent.trim()}" ainda não foi desenhada no protótipo.`); }));
  $('sair').addEventListener('click', () => { PortalProfessor.sair(); location.replace('login.html'); });

  // ---------- Modal de confirmação ----------

  let aoConfirmar = null;
  function abrirModal({ titulo, texto, botao, tom = 'perigo' }, fn) {
    $('modal-titulo').textContent = titulo;
    $('modal-texto').innerHTML = texto;
    $('modal-confirmar').textContent = botao;
    $('modal-confirmar').className = tom === 'perigo' ? 'botao-perigo' : 'botao-pri';
    aoConfirmar = fn;
    $('modal').classList.remove('hidden');
    $('modal-confirmar').focus();
  }
  function fecharModal() { $('modal').classList.add('hidden'); aoConfirmar = null; }
  $('modal-cancelar').addEventListener('click', fecharModal);
  $('modal').addEventListener('click', (e) => { if (e.target === $('modal')) fecharModal(); });
  $('modal-confirmar').addEventListener('click', () => { const fn = aoConfirmar; fecharModal(); if (fn) fn(); });

  // ---------- Localizar a aula ----------

  const params = new URLSearchParams(location.search);
  const turmaId = params.get('turma');
  const data = params.get('data');
  const inicioUrl = params.get('inicio');
  const ts = PortalProfessor.turmas(instrutor.id, hoje);
  const t = ts.find((x) => x.turma.id === turmaId) ?? null;
  const candidatas = t ? (Turmas.aulasAgendadas(t.turma) ?? t.aulas).filter((a) => a.data === data) : [];
  const aula = candidatas.find((a) => a.inicio === inicioUrl) ?? candidatas.find((a) => a.status !== 'cancelada') ?? candidatas[0] ?? null;
  if (!t || !aula) { location.replace(t ? `turma.html?id=${encodeURIComponent(t.turma.id)}&aba=aulas` : 'turmas.html'); return; }

  const salas = typeof Salas !== 'undefined' ? Salas.carregar() : [];
  const cancelada = aula.status === 'cancelada';
  const situacao = cancelada ? 'cancelada' : aula.data < hoje ? 'realizada' : aula.data === hoje ? 'hoje' : 'prevista';
  const liberada = situacao === 'hoje' || situacao === 'realizada';
  const local = aula.salaId ? (Salas.porId(salas, aula.salaId)?.nome ?? t.sala?.nome ?? '') : t.sala ? t.sala.nome : t.turma.meetLink ? 'Google Meet' : (FORMATO[t.turma.formato] ?? 'Local a definir');
  const motivoTexto = aula.motivo ? [Aulas.motivoDe(aula.motivo.tipo), aula.motivo.texto].filter(Boolean).join(": ") : "";
  const meet = t.turma.meetLink && (t.turma.formato === 'online' || t.turma.formato === 'hibrido') ? t.turma.meetLink : null;
  const modulosCurso = t.curso?.modulos ?? [];
  const modulosPrevistos = (aula.moduloIds ?? []).map((id) => modulosCurso.find((m) => m.id === id)).filter(Boolean);
  const fmtDataHora = (iso) => (iso ? `${PortalProfessor.fmtData(iso.slice(0, 10))} às ${iso.slice(11, 16)}` : '');
  const ponto = (cls, texto) => `<span class="inline-flex items-center gap-1.5 whitespace-nowrap"><span class="h-2 w-2 rounded-full ${cls}"></span>${esc(texto)}</span>`;

  // ---------- Breadcrumb + cabeçalho ----------

  const tituloTurma = `${t.curso?.nome ?? t.turma.codigo} · ${t.turma.codigo}`;
  document.title = `Aulor · Portal do Professor · Aula ${PortalProfessor.fmtData(aula.data)} · ${t.turma.codigo}`;
  $('breadcrumb').innerHTML = `
    <a href="turmas.html" class="hover:text-petrol-800 dark:hover:text-sky-300 transition">Minhas turmas</a>
    <span class="text-slate-300 dark:text-neutral-700">/</span>
    <a href="turma.html?id=${encodeURIComponent(t.turma.id)}&aba=aulas" class="hover:text-petrol-800 dark:hover:text-sky-300 transition truncate max-w-xs">${esc(tituloTurma)}</a>
    <span class="text-slate-300 dark:text-neutral-700">/</span>
    <span class="font-medium text-slate-800 dark:text-neutral-100" aria-current="page">${esc(PortalProfessor.fmtData(aula.data))}</span>`;

  // Mesmos três status da lista de aulas da turma (turmas-app: Situação · Chamada · Diário), como pílulas.
  const PILULA = {
    ok: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    hoje: 'bg-laranja/15 text-laranja-escuro border-laranja/40 dark:bg-laranja/15 dark:text-laranja dark:border-laranja/40',
    pendente: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
    neutro: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700',
    futura: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    cancelada: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
    vazio: 'bg-transparent text-slate-400 border-slate-200 border-dashed dark:text-neutral-500 dark:border-neutral-700',
  };
  const PONTO = { ok: 'bg-emerald-500', hoje: 'bg-laranja', pendente: 'bg-red-500', neutro: 'bg-slate-400', futura: 'bg-sky-500', cancelada: 'bg-red-500', vazio: 'bg-slate-300 dark:bg-neutral-600' };
  const pilula = (tom, rotulo, valor) => `<span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${PILULA[tom]}"><span class="h-1.5 w-1.5 rounded-full ${PONTO[tom]}"></span>${rotulo ? `<span class="font-normal opacity-70">${rotulo}</span>` : ''}${esc(valor)}</span>`;
  const SIT = { realizada: ['neutro', 'Realizada'], hoje: ['hoje', 'Hoje'], prevista: ['futura', 'Futura'], cancelada: ['cancelada', 'Cancelada'] };
  function statusAulaHtml() {
    const tomPendente = situacao === 'hoje' ? 'hoje' : 'pendente';
    const chamadaFeita = liberada && Presencas.porAula(t.turma.id, aula).length > 0;
    const diarioFeito = liberada && !!Diario.porAula(t.turma.id, aula.data);
    return [
      pilula(SIT[situacao][0], '', SIT[situacao][1]),
      liberada ? pilula(chamadaFeita ? 'ok' : tomPendente, 'Chamada', chamadaFeita ? 'feita' : 'não feita') : pilula('vazio', 'Chamada', '—'),
      liberada ? pilula(diarioFeito ? 'ok' : tomPendente, 'Diário', diarioFeito ? 'preenchido' : 'pendente') : pilula('vazio', 'Diário', '—'),
      cancelada && motivoTexto ? `<span class="text-xs text-slate-500 dark:text-neutral-400">${esc(motivoTexto)}</span>` : '',
    ].filter(Boolean).join('');
  }
  const atualizarStatusAula = () => { const el = $('status-aula'); if (el) el.innerHTML = statusAulaHtml(); };
  const dado = (rotulo, valor) => `<div><p class="rotulo">${esc(rotulo)}</p><div class="text-sm text-slate-800 dark:text-neutral-100 mt-0.5">${valor}</div></div>`;
  $('cabecalho').innerHTML = `
    <div class="${situacao === 'hoje' ? 'rounded-xl border border-laranja/40 bg-laranja/10 shadow-sm' : 'cartao'} p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="rotulo">${esc(t.turma.codigo)}${aula.n ? ` · aula ${aula.n} de ${t.aulas.length}` : ''}${aula.origem === 'reposicao' ? ' · reposição' : ''}</p>
          <h2 class="font-display text-xl font-semibold text-slate-900 dark:text-neutral-100 mt-0.5">${esc(t.curso?.nome ?? t.turma.codigo)}</h2>
          <p class="text-sm text-slate-600 dark:text-neutral-300 mt-1 ${cancelada ? 'line-through' : ''}">${esc(PortalProfessor.fmtDataLonga(aula.data).replace(/^./, (c) => c.toUpperCase()))} de ${aula.data.slice(0, 4)} · ${esc(aula.inicio)}–${esc(aula.fim)} · ${esc(local)}</p>
          <div id="status-aula" class="mt-2.5 flex flex-wrap items-center gap-2">${statusAulaHtml()}</div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <a href="turma.html?id=${encodeURIComponent(t.turma.id)}" class="botao-sec">Ver turma</a>
          ${meet && !cancelada ? `<a href="${esc(meet)}" target="_blank" rel="noopener" class="botao-pri">${ICONE_CAMERA}Abrir o Meet</a>` : ''}
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200/70 dark:border-neutral-800">
        ${dado('Conteúdo previsto', aula.conteudo ? esc(aula.conteudo) : '<span class="text-slate-500 dark:text-neutral-400">Sem conteúdo previsto no agendamento.</span>')}
        ${dado(modulosPrevistos.length === 1 ? 'Módulo previsto' : 'Módulos previstos', modulosPrevistos.length ? modulosPrevistos.map((m) => esc(m.titulo)).join('<br>') : '<span class="text-slate-500 dark:text-neutral-400">—</span>')}
        ${dado('Alunos matriculados', `${t.alunos.length} ${t.alunos.length === 1 ? 'aluno' : 'alunos'} · <a href="turma.html?id=${encodeURIComponent(t.turma.id)}&aba=frequencia" class="link">Frequência da turma</a>`)}
      </div>
    </div>`;

  // ---------- Abas ----------

  const ABAS = ['chamada', 'diario', 'avaliacao'];
  function mostrarAba(id) {
    // Com o modo de compartilhamento de tela ligado, a avaliação fica oculta: cai na chamada.
    const privado = typeof Privacidade !== 'undefined' && Privacidade.ativa();
    const aba = ABAS.includes(id) && !(privado && id === 'avaliacao') ? id : 'chamada';
    document.querySelectorAll('[data-aba]').forEach((b) => b.classList.toggle('aba-ativa', b.dataset.aba === aba));
    ABAS.forEach((x) => $(`aba-${x}`).classList.toggle('hidden', x !== aba));
    if (location.hash !== `#${aba}`) history.replaceState(null, '', `${location.pathname}${location.search}#${aba}`);
  }
  document.querySelectorAll('[data-aba]').forEach((b) => b.addEventListener('click', () => mostrarAba(b.dataset.aba)));
  window.addEventListener('hashchange', () => mostrarAba(location.hash.slice(1)));

  // ============================================================
  // CHAMADA
  // ============================================================

  // Alunos da chamada: matriculados; numa turma concluída, também os concluídos [sup.].
  const alunosCadastro = typeof Clientes !== 'undefined' ? Clientes.carregar().alunos : [];
  const statusAceitos = t.situacao === 'concluida' ? ['matriculado', 'concluido'] : ['matriculado'];
  const alunos = (Turmas.matriculas(t.turma)?.linhas ?? [])
    .filter((l) => statusAceitos.includes(l.matricula.status))
    .map((l) => Clientes.porId(alunosCadastro, l.alunoId))
    .filter(Boolean)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const minimo = t.curso?.certificado?.frequenciaMinima ?? FREQUENCIA_MINIMA;

  // Estado por aluno: { status: null | id, chegada, saida, observacao } — minutos de atraso são derivados na gravação
  let marcacoes = {};
  let antesDeMarcarTodos = null;
  let preMarcada = false; // a tela abriu com todo mundo em "Presente"

  // REGRA: numa chamada que NUNCA foi registrada (e já liberada para edição) todos os
  // alunos abrem como **Presente** — o professor só marca as exceções. Se a aula já tem
  // chamada salva, o aluno sem registro continua sem marcação: reabrir para editar não
  // pode transformar em presente quem o professor deixou de fora. Também não pré-marca
  // aula cancelada nem aula ainda prevista (`liberada` já cobre os dois).
  // É só pré-preenchimento de tela: nada vai para o storage antes de "Salvar chamada".
  function carregarMarcacoes() {
    const regs = Presencas.porAula(t.turma.id, aula);
    preMarcada = liberada && regs.length === 0;
    marcacoes = {};
    alunos.forEach((al) => {
      const r = regs.find((x) => x.alunoId === al.id);
      marcacoes[al.id] = r
        ? { status: r.status, chegada: r.chegada ?? '', saida: r.saida ?? '', observacao: r.observacao ?? '' }
        : { status: preMarcada ? 'presente' : null, chegada: '', saida: '', observacao: '' };
    });
    return regs;
  }
  const registradoEm = () => Presencas.porAula(t.turma.id, aula).map((r) => r.registradoEm).sort().pop() ?? null;

  function contadores() {
    const n = { presente: 0, atraso: 0, justificada: 0, ausente: 0, nenhum: 0 };
    Object.values(marcacoes).forEach((m) => { n[m.status ?? 'nenhum'] += 1; });
    return n;
  }
  const semMarcacao = () => alunos.filter((al) => !marcacoes[al.id]?.status);

  function textoResumo() {
    const n = contadores();
    return [
      n.presente && `${n.presente} ${n.presente === 1 ? 'presente' : 'presentes'}`,
      n.atraso && `${n.atraso} ${n.atraso === 1 ? 'atraso' : 'atrasos'}`,
      n.justificada && `${n.justificada} ${n.justificada === 1 ? 'justificada' : 'justificadas'}`,
      n.ausente && `${n.ausente} ${n.ausente === 1 ? 'falta' : 'faltas'}`,
      n.nenhum && `${n.nenhum} sem marcação`,
    ].filter(Boolean).join(' · ');
  }

  // Texto discreto à direita da barra: avisa que a lista já veio toda presente.
  function textoEstado(em) {
    if (em) return `Chamada registrada em ${fmtDataHora(em)}`;
    if (!liberada) return '';
    return preMarcada ? 'Chamada ainda não registrada · todos vêm como presentes, marque só as exceções' : 'Chamada ainda não registrada';
  }

  // "Marcar todos presentes" só tem o que fazer se alguém está fora do presente
  // (ou se há um "todos presentes" a desfazer).
  function estadoMarcarTodos() {
    const b = $('marcar-todos');
    if (!b) return;
    b.textContent = antesDeMarcarTodos ? 'Desfazer "todos presentes"' : 'Marcar todos presentes';
    b.disabled = !liberada || (!antesDeMarcarTodos && contadores().presente === alunos.length);
  }

  // Chegada/saída só para quem esteve na aula (presente ou atraso). Os placeholders mostram o horário da aula.
  const campoHora = (nome, valor, placeholder, rotulo) => `<label class="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-neutral-400">${rotulo} <input type="time" data-${nome} value="${esc(valor)}" placeholder="${esc(placeholder ?? '')}" class="campo !w-[5.5rem] !py-0.5 !px-2 !text-xs tabular-nums" ${liberada ? '' : 'disabled'}></label>`;
  function celulaHorario(m) {
    if (!Presencas.temHorario(m.status)) return '<span class="text-slate-400">—</span>';
    return `<div class="flex flex-wrap items-center gap-2">${campoHora('chegada', m.chegada, aula.inicio, 'Chegada')}${campoHora('saida', m.saida, aula.fim, 'Saída')}</div>`;
  }

  function linhaAluno(al, i) {
    const m = marcacoes[al.id];
    const f = Presencas.frequencia(t.turma.id, al.id, t.aulas, hoje, { concluido: t.situacao === 'concluida', minimo });
    const sf = Presencas.statusFrequenciaDe(f.status);
    return `
      <tr data-aluno="${esc(al.id)}">
        <td class="text-slate-500 dark:text-neutral-400 tabular-nums w-10">${i + 1}</td>
        <td class="min-w-[14rem]">
          <div class="flex items-center gap-2.5">
            ${PortalProfessor.avatarAlunoHtml(al, 'h-9 w-9')}
            <p class="font-medium text-slate-900 dark:text-neutral-100 min-w-0">${esc(al.nome)}${al.apelido ? ` <span class="text-xs font-normal text-slate-500 dark:text-neutral-400">(${esc(al.apelido)})</span>` : ''}</p>
          </div>
        </td>
        <td class="whitespace-nowrap">
          <div class="seg" role="radiogroup" aria-label="Presença de ${esc(al.nome)}">
            ${STATUS_PRESENCA.map((s) => `<button type="button" role="radio" data-status="${s.id}" aria-checked="${m.status === s.id}" title="${esc(s.descricao)}" ${liberada ? '' : 'disabled'}>${esc(s.id === 'justificada' ? 'Justificada' : s.nome)}</button>`).join('')}
          </div>
        </td>
        <td class="whitespace-nowrap" data-horario>${celulaHorario(m)}</td>
        <td class="min-w-[12rem]"><input type="text" data-observacao value="${esc(m.observacao)}" placeholder="Observação (opcional)" class="campo !py-1 !text-xs" ${liberada ? '' : 'disabled'}></td>
        <td class="whitespace-nowrap">
          ${f.dadas ? `<span class="tabular-nums font-medium">${f.percentual}%</span> <span class="text-xs">${ponto(sf?.ponto ?? 'bg-slate-400', sf?.nome ?? '')}</span><p class="text-xs text-slate-500 dark:text-neutral-400">${f.faltas} ${f.faltas === 1 ? 'falta' : 'faltas'} em ${f.dadas} ${f.dadas === 1 ? 'aula' : 'aulas'}</p>` : `<span class="text-xs">${ponto('bg-slate-400', 'Sem aulas dadas')}</span>`}
        </td>
      </tr>`;
  }

  function avisoChamada() {
    if (cancelada) return `<div class="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-5 py-3 text-sm text-slate-800 dark:text-neutral-100">Aula cancelada — a chamada fica bloqueada.${motivoTexto ? ` Motivo: ${esc(motivoTexto)}.` : ''}</div>`;
    if (situacao === 'prevista') return `<div class="rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/40 px-5 py-3 text-sm text-slate-800 dark:text-neutral-100">A chamada abre no dia da aula (${esc(PortalProfessor.rotuloDia(aula.data, hoje))}). Enquanto isso você pode conferir a lista de alunos e a frequência de cada um.</div>`;
    return '';
  }

  function renderChamada() {
    const regs = carregarMarcacoes();
    const em = registradoEm();
    $('aba-chamada').innerHTML = `
      ${avisoChamada()}
      ${!alunos.length ? `<div class="cartao p-6 text-center text-sm text-slate-500 dark:text-neutral-400">Nenhum aluno matriculado nesta turma.</div>` : `
      <div class="cartao overflow-hidden">
        <div class="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-neutral-800">
          <button type="button" id="marcar-todos" class="botao-sec">${antesDeMarcarTodos ? 'Desfazer "todos presentes"' : 'Marcar todos presentes'}</button>
          <p id="contadores" class="text-sm text-slate-500 dark:text-neutral-400">${esc(textoResumo())}</p>
          <p class="text-xs text-slate-500 dark:text-neutral-400 sm:ml-auto">${esc(textoEstado(em))}</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm zebra">
            <thead class="bg-slate-50 dark:bg-neutral-900 text-left text-[11px] uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              <tr>
                <th class="px-4 py-2.5 font-semibold">#</th>
                <th class="px-4 py-2.5 font-semibold">Aluno</th>
                <th class="px-4 py-2.5 font-semibold">Presença</th>
                <th class="px-4 py-2.5 font-semibold">Horário <span class="normal-case tracking-normal font-normal">(opcional)</span></th>
                <th class="px-4 py-2.5 font-semibold">Observação</th>
                <th class="px-4 py-2.5 font-semibold">Frequência na turma</th>
              </tr>
            </thead>
            <tbody id="alunos">${alunos.map(linhaAluno).join('')}</tbody>
          </table>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-slate-200 dark:border-neutral-800">
          <p class="text-xs text-slate-500 dark:text-neutral-400">Atraso e falta justificada contam como presença na frequência. Chegada e saída são opcionais${aula.inicio ? `; a aula vai das ${esc(aula.inicio)}${aula.fim ? ` às ${esc(aula.fim)}` : ''} e, no atraso, os minutos são contados da chegada` : ''}.</p>
          <button type="button" id="salvar-chamada" class="botao-pri" ${liberada ? '' : 'disabled'}>${regs.length ? 'Salvar alterações' : 'Salvar chamada'}</button>
        </div>
      </div>`}`;
    if (!alunos.length) return;

    $('alunos').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-status]');
      if (!b || b.disabled) return;
      const tr = b.closest('tr');
      const m = marcacoes[tr.dataset.aluno];
      m.status = m.status === b.dataset.status ? null : b.dataset.status; // clicar de novo desmarca
      if (!Presencas.temHorario(m.status)) { m.chegada = ''; m.saida = ''; }
      antesDeMarcarTodos = null;
      atualizarLinha(tr);
    });
    $('alunos').addEventListener('input', (e) => {
      const tr = e.target.closest('tr');
      const m = marcacoes[tr.dataset.aluno];
      if (e.target.matches('[data-observacao]')) m.observacao = e.target.value;
      if (e.target.matches('[data-saida]')) m.saida = e.target.value;
      if (e.target.matches('[data-chegada]')) m.chegada = e.target.value;
    });
    $('marcar-todos').addEventListener('click', () => {
      if (antesDeMarcarTodos) {
        marcacoes = antesDeMarcarTodos;
        antesDeMarcarTodos = null;
      } else {
        antesDeMarcarTodos = JSON.parse(JSON.stringify(marcacoes));
        alunos.forEach((al) => { marcacoes[al.id] = { ...marcacoes[al.id], status: 'presente' }; });
      }
      renderChamadaMantendo();
    });
    $('salvar-chamada').addEventListener('click', salvarChamada);
    estadoMarcarTodos();
  }

  // Re-render sem recarregar as marcações do storage (mantém o que o professor já mexeu).
  function renderChamadaMantendo() {
    const guardadas = marcacoes;
    const antes = antesDeMarcarTodos;
    renderChamada();
    marcacoes = guardadas;
    antesDeMarcarTodos = antes;
    $('alunos').querySelectorAll('tr').forEach(atualizarLinha);
    estadoMarcarTodos();
  }

  function atualizarLinha(tr) {
    const m = marcacoes[tr.dataset.aluno];
    tr.querySelectorAll('button[data-status]').forEach((b) => b.setAttribute('aria-checked', String(m.status === b.dataset.status)));
    const obs = tr.querySelector('[data-observacao]');
    if (obs && obs.value !== m.observacao) obs.value = m.observacao;
    const hor = tr.querySelector('[data-horario]');
    const mostra = Presencas.temHorario(m.status);
    if (mostra !== !!hor.querySelector('[data-chegada]')) {
      hor.innerHTML = celulaHorario(m);
      if (m.status === 'atraso') hor.querySelector('[data-chegada]').focus(); // no atraso a chegada é o que interessa
    } else if (mostra) { const c = hor.querySelector('[data-chegada]'); const sd = hor.querySelector('[data-saida]'); if (c.value !== m.chegada) c.value = m.chegada; if (sd.value !== m.saida) sd.value = m.saida; }
    $('contadores').textContent = textoResumo();
    estadoMarcarTodos();
  }

  function salvarChamada() {
    if (!liberada) return;
    const faltantes = semMarcacao();
    if (faltantes.length) {
      const nomes = faltantes.slice(0, 5).map((al) => `<li>${esc(al.nome)}</li>`).join('');
      abrirModal({
        titulo: `${faltantes.length} ${faltantes.length === 1 ? 'aluno sem marcação' : 'alunos sem marcação'}`,
        texto: `<p>Marcar como <strong>falta</strong> e salvar a chamada?</p><ul class="list-disc pl-5 mt-2 space-y-0.5">${nomes}${faltantes.length > 5 ? `<li>e mais ${faltantes.length - 5}</li>` : ''}</ul><p class="mt-2 text-xs text-slate-500 dark:text-neutral-400">Se preferir, cancele e marque cada um na lista.</p>`,
        botao: `Marcar ${faltantes.length === 1 ? 'como falta' : 'os demais como falta'} e salvar`,
      }, () => {
        faltantes.forEach((al) => { marcacoes[al.id].status = 'ausente'; marcacoes[al.id].chegada = ''; marcacoes[al.id].saida = ''; });
        gravarChamada();
      });
      return;
    }
    gravarChamada();
  }

  function gravarChamada() {
    const ref = { turmaId: t.turma.id, aulaId: aula.id ?? null, data: aula.data };
    const itens = alunos.map((al) => {
      const m = marcacoes[al.id];
      // Minutos de atraso derivados da chegada × início da aula (não há mais campo próprio).
      return { alunoId: al.id, status: m.status, minutos: m.status === 'atraso' ? Presencas.atrasoDe(m.chegada, aula.inicio) : null, chegada: m.chegada || null, saida: m.saida || null, observacao: m.observacao };
    });
    const erros = itens.flatMap((it) => Presencas.validar({ ...ref, ...it }).map((e) => ({ ...e, alunoId: it.alunoId })));
    if (erros.length) {
      const e = erros[0];
      const al = alunos.find((x) => x.id === e.alunoId);
      toast(`${al ? `${al.nome.split(/\s+/)[0]}: ` : ''}${e.mensagem}`);
      const campo = $('alunos').querySelector(`tr[data-aluno="${CSS.escape(e.alunoId)}"] [data-${e.campo === 'saida' ? 'saida' : 'chegada'}]`);
      if (campo) campo.focus();
      return;
    }
    Presencas.salvar(Presencas.registrarLote(Presencas.carregar(), ref, itens));
    antesDeMarcarTodos = null;
    renderChamada();
    atualizarStatusAula();
    const n = contadores();
    toast(`Chamada salva: ${n.presente + n.atraso + n.justificada} ${n.presente + n.atraso + n.justificada === 1 ? 'presença' : 'presenças'} e ${n.ausente} ${n.ausente === 1 ? 'falta' : 'faltas'}.`);
  }

  // ============================================================
  // DIÁRIO
  // ============================================================

  function renderDiario() {
    const reg = Diario.porAula(t.turma.id, aula.data);
    const conteudo = reg ? reg.conteudo : (aula.conteudo ?? '');
    const marcados = new Set(reg ? reg.moduloIds : (aula.moduloIds ?? []));
    const aviso = cancelada
      ? `<div class="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-5 py-3 text-sm text-slate-800 dark:text-neutral-100">Aula cancelada — não há diário a preencher.</div>`
      : situacao === 'prevista'
        ? `<div class="rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/40 px-5 py-3 text-sm text-slate-800 dark:text-neutral-100">O diário abre no dia da aula (${esc(PortalProfessor.rotuloDia(aula.data, hoje))}). O conteúdo previsto já vem preenchido para você ajustar depois.</div>`
        : '';
    $('aba-diario').innerHTML = `
      ${aviso}
      <form id="form-diario" class="cartao p-5 space-y-4" novalidate>
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 class="titulo-secao">Diário da aula</h3>
            <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${reg ? `${ponto('bg-emerald-500', 'Preenchido')} · registrado em ${esc(fmtDataHora(reg.registradoEm))}` : liberada ? ponto('bg-laranja', 'Pendente') : ''}</p>
          </div>
          <a href="turma.html?id=${encodeURIComponent(t.turma.id)}&aba=aulas" class="link">Aulas da turma</a>
        </div>
        <div>
          <label for="diario-conteudo" class="rotulo">Conteúdo ministrado</label>
          <textarea id="diario-conteudo" rows="4" class="campo mt-1" placeholder="O que foi trabalhado nesta aula" ${liberada ? '' : 'disabled'}>${esc(conteudo)}</textarea>
          ${!reg && aula.conteudo ? '<p class="text-xs text-slate-500 dark:text-neutral-400 mt-1">Pré-preenchido com o conteúdo previsto no agendamento.</p>' : ''}
        </div>
        ${modulosCurso.length ? `
        <fieldset>
          <legend class="rotulo">Módulos do curso trabalhados</legend>
          <div class="mt-1.5 grid grid-cols-1 md:grid-cols-2 gap-1.5">
            ${modulosCurso.map((m) => `
              <label class="flex items-start gap-2 text-sm rounded-lg border border-slate-200 dark:border-neutral-800 px-3 py-2 ${liberada ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900' : 'opacity-60'}">
                <input type="checkbox" name="modulo" value="${esc(m.id)}" ${marcados.has(m.id) ? 'checked' : ''} ${liberada ? '' : 'disabled'} class="mt-0.5 accent-petrol-800 dark:accent-sky-500">
                <span><span class="text-slate-900 dark:text-neutral-100">${esc(m.titulo)}</span>${m.cargaHoraria ? ` <span class="text-xs text-slate-500 dark:text-neutral-400">· ${esc(m.cargaHoraria)}h</span>` : ''}</span>
              </label>`).join('')}
          </div>
        </fieldset>` : '<p class="text-xs text-slate-500 dark:text-neutral-400">Este curso não tem módulos cadastrados.</p>'}
        <div>
          <label for="diario-observacoes" class="rotulo">Observações</label>
          <textarea id="diario-observacoes" rows="2" class="campo mt-1" placeholder="Ocorrências, dúvidas recorrentes, o que ficou para a próxima aula…" ${liberada ? '' : 'disabled'}>${esc(reg?.observacoes ?? '')}</textarea>
        </div>
        <div class="flex items-center justify-end gap-2 pt-1">
          <button type="submit" class="botao-pri" ${liberada ? '' : 'disabled'}>${reg ? 'Salvar alterações' : 'Salvar diário'}</button>
        </div>
      </form>`;

    $('form-diario').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!liberada) return;
      const d = {
        turmaId: t.turma.id, aulaId: aula.id ?? null, data: aula.data,
        conteudo: $('diario-conteudo').value,
        moduloIds: Array.from(document.querySelectorAll('input[name="modulo"]:checked')).map((c) => c.value),
        observacoes: $('diario-observacoes').value,
      };
      const erros = Diario.validar(d);
      if (erros.length) { toast(erros[0].mensagem); $('diario-conteudo').focus(); return; }
      Diario.salvar(Diario.registrar(Diario.carregar(), d));
      renderDiario();
      atualizarStatusAula();
      toast('Diário salvo.');
    });
  }

  // ============================================================
  // AVALIAÇÃO DO DIA — respostas anônimas dos alunos a esta aula.
  // Tudo chega sem identificação do aluno (PortalProfessor.avaliacoesDaAula); componentes de avaliacoes-ui.js.
  // ============================================================

  function renderAvaliacao() {
    const avs = PortalProfessor.avaliacoesDaAula(t.turma.id, aula.data);
    const badge = $('aba-avaliacao-badge');
    badge.textContent = String(avs.length);
    badge.classList.toggle('hidden', !avs.length);

    const aviso = cancelada
      ? `<div class="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-5 py-3 text-sm text-slate-800 dark:text-neutral-100">Aula cancelada — não há avaliação dos alunos.</div>`
      : situacao === 'prevista'
        ? `<div class="rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/40 px-5 py-3 text-sm text-slate-800 dark:text-neutral-100">Os alunos avaliam a aula ao fim dela (${esc(PortalProfessor.rotuloDia(aula.data, hoje))}). As respostas aparecem aqui sem identificar quem respondeu.</div>`
        : '';
    const vazio = (titulo, texto) => `<div class="cartao px-6 py-10 text-center"><p class="font-display font-semibold text-slate-900 dark:text-neutral-100">${titulo}</p><p class="text-sm text-slate-500 dark:text-neutral-400 mt-1 max-w-md mx-auto">${texto}</p></div>`;

    if (!avs.length) {
      $('aba-avaliacao').innerHTML = aviso || (!PortalProfessor.temAvaliacoes()
        ? vazio('Avaliações indisponíveis', 'A avaliação diária dos alunos não está carregada neste protótipo.')
        : situacao === 'hoje'
          ? vazio('Nenhum aluno respondeu ainda', 'A avaliação diária abre para os alunos ao fim da aula. Assim que responderem, a média, a distribuição e os comentários — sem identificar quem respondeu — aparecem aqui.')
          : vazio('Nenhuma avaliação registrada para esta aula', 'Os alunos não responderam a avaliação diária deste dia. Veja o histórico da turma em <a href="avaliacoes.html?turma=' + encodeURIComponent(t.turma.id) + '" class="link">Avaliações</a>.'));
      return;
    }

    const dia = PortalProfessor.resumoAvaliacoes(avs);
    // Referências: a própria turma e todas as turmas do instrutor nos últimos 30 dias (até esta aula).
    // Nada da escola inteira: o professor só vê o que é dele.
    const de30 = PortalProfessor.somarDias(aula.data, -29);
    const turma30 = PortalProfessor.resumoAvaliacoes(PortalProfessor.avaliacoesDoInstrutor([t], de30, aula.data));
    const minhas30 = PortalProfessor.resumoAvaliacoes(PortalProfessor.avaliacoesDoInstrutor(ts, de30, aula.data));
    const matriculados = Math.max(t.alunos.length || alunos.length, avs.length); // nunca menor que as respostas [sup.]
    const adesao = matriculados ? avs.length / matriculados : null;
    const pontos = INDICADORES.filter((i) => dia.indicadores[i.id] != null && dia.indicadores[i.id] < Avaliacoes.LIMIAR_ATENCAO).map((i) => ({ indicador: i, media: dia.indicadores[i.id] })).sort((a, b) => a.media - b.media);
    const cor = corDe(dia.media);
    const faixa = Avaliacoes.faixa(dia.media);
    const comparacao = (rotulo, ref) => (ref == null ? '' : `<p>${rotulo}: <span class="font-medium text-slate-700 dark:text-neutral-200 tabular-nums">${fmt(ref)}</span>${dia.media != null ? ` <span class="${dia.media >= ref ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'} font-medium">${dia.media >= ref ? '▲' : '▼'} ${fmt(Math.abs(dia.media - ref))}</span>` : ''}</p>`);

    const cabecalho = `
      <div class="cartao p-5 border-l-4 ${cor.ponto.replace('bg-', 'border-l-')}">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex items-center gap-4">
            <span class="font-display text-4xl font-semibold tabular-nums leading-none ${cor.texto}">${fmt(dia.media)}</span>
            <div>
              <p class="titulo-secao">${faixa ? esc(faixa.rotulo) : 'Sem respostas'} <span class="text-sm font-sans font-normal text-slate-500 dark:text-neutral-400">· média da aula (1 a 5)</span></p>
              <p class="text-sm text-slate-600 dark:text-neutral-300 mt-0.5">${avs.length} ${avs.length === 1 ? 'resposta' : 'respostas'}${matriculados ? ` de ${matriculados} ${matriculados === 1 ? 'aluno' : 'alunos'} (adesão ${pct(adesao)})` : ''} · ${dia.comentarios.length} ${dia.comentarios.length === 1 ? 'comentário' : 'comentários'}</p>
            </div>
          </div>
          <div class="text-xs text-slate-500 dark:text-neutral-400 space-y-0.5 text-right">
            ${comparacao('Sua turma nos últimos 30 dias', turma30.media)}
            ${ts.length > 1 ? comparacao('Suas turmas nos últimos 30 dias', minhas30.media) : ''}
          </div>
        </div>
        <div class="mt-4">${barraDistribuicao(dia.distribuicao)}</div>
        ${pontos.length ? `<div class="mt-4 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-slate-800 dark:text-neutral-100"><p class="font-medium">${pontos.length === 1 ? 'Ponto de atenção' : `${pontos.length} pontos de atenção`} (média abaixo de ${fmt(Avaliacoes.LIMIAR_ATENCAO, 1)})</p><p class="mt-0.5 text-slate-600 dark:text-neutral-300">${pontos.map((p) => `${esc(p.indicador.nome)} <span class="font-medium tabular-nums ${corDe(p.media).texto}">${fmt(p.media)}</span>`).join(' · ')}</p></div>` : ''}
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-4">As respostas são anônimas: você vê médias, distribuição e comentários, nunca quem respondeu. <a href="avaliacoes.html?turma=${encodeURIComponent(t.turma.id)}" class="link">Histórico da turma</a></p>
      </div>`;

    const indicadores = painelIndicadores(dia, turma30, 'sua turma nos últimos 30 dias', PortalProfessor.GRUPOS_PROFESSOR);

    const ordem = { atencao: 0, sugestao: 1, positivo: 2 };
    const comentarios = [...dia.comentarios].sort((a, b) => ordem[a.tom] - ordem[b.tom]);
    const listaComentarios = `
      <div class="cartao">
        <div class="px-4 py-3 border-b border-slate-200 dark:border-neutral-800">
          <h3 class="titulo-secao">Comentários dos alunos</h3>
          <p class="text-xs text-slate-500 dark:text-neutral-400">${comentarios.length ? `${comentarios.length} ${comentarios.length === 1 ? 'comentário' : 'comentários'}, sem identificação de quem escreveu.` : 'Nenhum aluno deixou comentário nesta aula.'}</p>
        </div>
        ${comentarios.length ? `<ul class="p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">${comentarios.map((c) => {
          const tom = COR_TOM[c.tom];
          return `<li class="rounded-lg border border-slate-200 dark:border-neutral-800 border-l-4 ${tom.borda} bg-white dark:bg-neutral-950 p-3">
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <p class="text-[11px] text-slate-500 dark:text-neutral-400">Aluno da turma</p>
              <div class="flex items-center gap-1.5 shrink-0"><span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tom.pilula}">${tom.rotulo}</span>${pilulaFaixa(c.mediaAluno, 'text-[11px]')}</div>
            </div>
            <p class="text-sm text-slate-700 dark:text-neutral-200">${esc(c.texto)}</p>
          </li>`;
        }).join('')}</ul>` : ''}
      </div>`;

    $('aba-avaliacao').innerHTML = cabecalho + indicadores + listaComentarios;
  }

  renderChamada();
  renderDiario();
  renderAvaliacao();
  mostrarAba(location.hash.slice(1));
})();
