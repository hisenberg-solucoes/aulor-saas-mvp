// Portal do Aluno — calendário (UI): aulas das matrículas + eventos disponíveis para o aluno.
// Só a inscrição em eventos grava (aulor-v1-eventos-inscricoes-v1); o resto é leitura.
(() => {
  const aluno = PortalAluno.alunoLogado();
  if (!aluno) { PortalAluno.sair(); location.replace('login.html'); return; }

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hoje = PortalAluno.hoje();
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const DIAS_CURTOS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
  const MAX_ITENS_CELULA = 3;
  const FORMATO = { presencial: 'Presencial', online: 'Online ao vivo', hibrido: 'Híbrido', ead: 'EAD' };

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast-anim pointer-events-auto rounded-lg bg-slate-900 dark:bg-neutral-800 text-white text-sm px-4 py-2 shadow-lg';
    el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  // ---------- Cabeçalho (igual ao home) ----------

  $('avatar').innerHTML = PortalAluno.avatarHtml(aluno);
  $('nome-usuario').textContent = aluno.nome;
  const menu = $('menu-usuario');
  const lista = $('menu-usuario-lista');
  const fecharMenu = () => { lista.classList.add('hidden'); menu.setAttribute('aria-expanded', 'false'); };
  menu.addEventListener('click', (e) => {
    e.stopPropagation();
    const abrir = lista.classList.contains('hidden');
    lista.classList.toggle('hidden', !abrir);
    menu.setAttribute('aria-expanded', String(abrir));
  });
  document.addEventListener('click', fecharMenu);
  document.querySelectorAll('[data-em-breve]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); toast(`"${el.textContent.trim()}" ainda não foi desenhada no protótipo.`); }));
  $('sair').addEventListener('click', () => { PortalAluno.sair(); location.replace('login.html'); });

  // ---------- Dados ----------

  const ms = PortalAluno.matriculas(aluno.id, hoje);
  const eventosTodos = Eventos.carregar();
  const eventos = Eventos.paraAluno(eventosTodos, { aluno, matriculas: ms });
  let inscricoes = Eventos.carregarInscricoes();
  const salas = typeof Salas !== 'undefined' ? Salas.carregar() : [];

  const estado = { ano: Number(hoje.slice(0, 4)), mes: Number(hoje.slice(5, 7)), filtro: 'tudo', turmaId: '' };

  // Aulas do aluno (sem canceladas), com a matrícula anexada.
  const aulas = [];
  ms.filter((m) => m.situacao !== 'cancelada').forEach((m) => m.aulas.filter((a) => a.status !== 'cancelada').forEach((a) => aulas.push({ ...a, matricula: m })));

  const localAula = (a, m) => {
    if (a.salaId) return salas.find((s) => s.id === a.salaId)?.nome ?? m.sala?.nome ?? '';
    if (m.turma.meetLink) return 'Google Meet';
    return m.sala?.nome ?? FORMATO[m.turma.formato] ?? '';
  };
  // Como na home: qualquer turma com link mostra o Meet (presenciais também transmitem por ele).
  const meetDe = (m) => m.turma.meetLink || null;
  const instrutores = typeof Instrutores !== 'undefined' ? Instrutores.carregar() : [];
  const ICONE_CAMERA = '<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>';

  const turmaBate = (turmaId, ev) => !turmaId || ev.publico.tipo === 'todos' || ev.turmas.some((m) => m.turma.id === turmaId);

  function aulasDoDia(iso) {
    if (estado.filtro === 'eventos') return [];
    return aulas.filter((a) => a.data === iso && (!estado.turmaId || a.matricula.turma.id === estado.turmaId)).sort((a, b) => a.inicio.localeCompare(b.inicio));
  }
  function eventosDoDia(iso) {
    if (estado.filtro === 'aulas') return [];
    return Eventos.porDia(eventos, iso).filter((e) => turmaBate(estado.turmaId, e));
  }

  // ---------- Filtros ----------

  const selTurma = $('filtro-turma');
  [...ms].sort((a, b) => a.turma.inicio.localeCompare(b.turma.inicio)).forEach((m) => {
    const o = document.createElement('option');
    o.value = m.turma.id;
    o.textContent = `${m.curso?.nome ?? m.turma.codigo} (${m.turma.codigo})`;
    selTurma.appendChild(o);
  });
  selTurma.addEventListener('change', () => { estado.turmaId = selTurma.value; render(); });
  $('filtro-tipo').addEventListener('change', (e) => { estado.filtro = e.target.value; render(); });

  $('mes-anterior').addEventListener('click', () => { estado.mes -= 1; if (estado.mes < 1) { estado.mes = 12; estado.ano -= 1; } render(); });
  $('mes-seguinte').addEventListener('click', () => { estado.mes += 1; if (estado.mes > 12) { estado.mes = 1; estado.ano += 1; } render(); });
  $('hoje').addEventListener('click', () => { estado.ano = Number(hoje.slice(0, 4)); estado.mes = Number(hoje.slice(5, 7)); render(); });

  $('cabecalho-dias').innerHTML = DIAS_CURTOS.map((d) => `<span class="py-2">${d}</span>`).join('');

  // ---------- Grade ----------

  const chipAula = (a) => `
    <button type="button" data-dia="${a.data}" title="${esc(`${a.inicio}–${a.fim} · ${a.matricula.curso?.nome ?? a.matricula.turma.codigo}`)}"
      class="w-full flex items-center gap-1 rounded px-1.5 py-0.5 text-left text-[11px] leading-tight bg-petrol-800/10 text-petrol-900 dark:bg-sky-500/20 dark:text-sky-200 hover:bg-petrol-800/20 dark:hover:bg-sky-500/30 transition">
      <span class="tabular-nums shrink-0">${esc(a.inicio)}</span><span class="font-mono font-medium truncate">${esc(a.matricula.turma.codigo.split(' ')[0])}</span>
    </button>${a.data === hoje && meetDe(a.matricula) ? `<a href="${esc(meetDe(a.matricula))}" target="_blank" rel="noopener" data-meet class="block rounded px-1.5 py-0.5 text-[11px] font-medium text-white bg-petrol-800 dark:bg-sky-600 hover:bg-petrol-900 dark:hover:bg-sky-500 transition">Entrar no Meet</a>` : ''}`;
  const chipEvento = (e) => {
    const t = Eventos.tipoDe(e.tipo);
    const previsto = e.status === 'previsto';
    return `
    <button type="button" data-dia="${e.data}" title="${esc(`${t.nome}: ${e.titulo}${previsto ? ' (a confirmar)' : ''}`)}"
      class="w-full flex items-center gap-1 rounded px-1.5 py-0.5 text-left text-[11px] leading-tight ${t.chip} ${previsto ? 'border border-dashed border-current/40' : ''} hover:opacity-80 transition">
      ${e.inicio ? `<span class="tabular-nums shrink-0">${esc(e.inicio)}</span>` : ''}<span class="font-medium truncate">${esc(e.titulo)}</span>
    </button>`;
  };

  function renderGrade() {
    const semanas = Eventos.gradeDoMes(estado.ano, estado.mes);
    let totalAulas = 0; let totalEventos = 0;
    $('grade').innerHTML = semanas.flat().map((d, i) => {
      const as = aulasDoDia(d.iso);
      const es = eventosDoDia(d.iso);
      if (d.doMes) { totalAulas += as.length; totalEventos += es.length; }
      const itens = [...as.map((a) => ({ ordem: a.inicio, html: chipAula(a) })), ...es.map((e) => ({ ordem: e.inicio ?? '00:00', html: chipEvento(e) }))].sort((x, y) => x.ordem.localeCompare(y.ordem));
      const visiveis = itens.length > MAX_ITENS_CELULA ? itens.slice(0, MAX_ITENS_CELULA - 1) : itens;
      const extra = itens.length - visiveis.length;
      const ehHoje = d.iso === hoje;
      const feriado = typeof Feriados !== 'undefined' ? Feriados.nome(d.iso) : null;
      const fimSemana = i % 7 >= 5;
      const borda = `${i % 7 ? 'border-l' : ''} ${i >= 7 ? 'border-t' : ''} border-slate-100 dark:border-neutral-900`;
      const fundo = !d.doMes ? 'bg-slate-50/70 dark:bg-neutral-925' : fimSemana ? 'bg-slate-50/40 dark:bg-neutral-950' : 'bg-white dark:bg-neutral-950';
      const numero = ehHoje
        ? 'h-6 w-6 rounded-full bg-laranja text-white font-semibold grid place-items-center'
        : `${d.doMes ? 'text-slate-700 dark:text-neutral-200' : 'text-slate-400 dark:text-neutral-600'} ${feriado ? 'font-semibold' : ''}`;
      return `
        <div data-celula="${d.iso}" class="${borda} ${fundo} min-h-[6.5rem] p-1.5 flex flex-col gap-1 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-neutral-900/70 transition ${d.doMes ? '' : 'opacity-70'}">
          <div class="flex items-start justify-between gap-1 min-w-0">
            <span class="text-xs tabular-nums ${numero}">${Number(d.iso.slice(8))}</span>
            ${feriado ? `<span class="text-[10px] text-slate-400 dark:text-neutral-500 truncate" title="${esc(feriado)}">${esc(feriado)}</span>` : ''}
          </div>
          ${visiveis.map(({ html }) => html).join('')}
          ${extra ? `<button type="button" data-dia="${d.iso}" class="text-left text-[11px] font-medium text-slate-500 dark:text-neutral-400 hover:text-petrol-800 dark:hover:text-sky-300 px-1.5">+${extra} ${extra === 1 ? 'item' : 'itens'}</button>` : ''}
        </div>`;
    }).join('');
    $('grade').querySelectorAll('[data-celula]').forEach((c) => c.addEventListener('click', () => abrirDia(c.dataset.celula)));
    $('grade').querySelectorAll('[data-meet]').forEach((a) => a.addEventListener('click', (e) => e.stopPropagation()));

    const resumo = [];
    if (estado.filtro !== 'eventos') resumo.push(`${totalAulas} ${totalAulas === 1 ? 'aula' : 'aulas'}`);
    if (estado.filtro !== 'aulas') resumo.push(`${totalEventos} ${totalEventos === 1 ? 'evento' : 'eventos'}`);
    const tiposUsados = TIPOS_EVENTO.filter((t) => eventos.some((e) => e.tipo === t.id));
    $('legenda').innerHTML = `
      <span class="tabular-nums text-slate-600 dark:text-neutral-300">${resumo.join(' · ')} em ${MESES[estado.mes - 1]}</span>
      <span class="ml-auto inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-petrol-800 dark:bg-sky-400"></span>Aula</span>
      ${tiposUsados.map((t) => `<span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm ${t.ponto}"></span>${esc(t.nome)}</span>`).join('')}
      <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm border border-dashed border-slate-400"></span>A confirmar</span>`;
  }

  // ---------- Próximos eventos ----------

  function estadoInscricao(e) {
    if (!e.inscricao.necessaria) return { texto: e.obrigatorio ? 'Presença obrigatória' : 'Sem inscrição', classe: e.obrigatorio ? 'text-laranja-escuro dark:text-laranja' : 'text-slate-500 dark:text-neutral-400' };
    if (Eventos.inscrito(inscricoes, aluno.id, e.id)) return { texto: 'Inscrito', classe: 'text-emerald-600 dark:text-emerald-400' };
    const imp = Eventos.impedimento(inscricoes, aluno.id, e, hoje);
    if (imp) return { texto: imp.replace(/\.$/, ''), classe: 'text-slate-500 dark:text-neutral-400' };
    const restantes = Eventos.vagasRestantes(inscricoes, e);
    return { texto: `Inscrições abertas${restantes != null ? ` · ${restantes} ${restantes === 1 ? 'vaga' : 'vagas'}` : ''}${e.inscricao.prazo ? ` até ${Eventos.fmtData(e.inscricao.prazo)}` : ''}`, classe: 'text-petrol-800 dark:text-sky-300' };
  }

  function renderProximos() {
    const lista2 = Eventos.proximos(eventos, hoje).filter((e) => turmaBate(estado.turmaId, e));
    if (!lista2.length) {
      $('proximos').innerHTML = `<div class="p-6 text-center text-sm text-slate-500 dark:text-neutral-400">Nenhum evento previsto para as suas turmas.</div>`;
      return;
    }
    $('proximos').innerHTML = lista2.map((e) => {
      const t = Eventos.tipoDe(e.tipo);
      const d = new Date(`${e.data}T12:00:00`);
      const st = estadoInscricao(e);
      return `
        <button type="button" data-dia="${e.data}" class="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-neutral-900/60 transition">
          <div class="shrink-0 w-12 text-center rounded-lg ${e.data === hoje ? 'bg-laranja/15 text-laranja-escuro dark:text-laranja' : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-300'} py-1.5">
            <p class="text-lg font-display font-semibold leading-none tabular-nums">${d.getDate()}</p>
            <p class="text-[10px] uppercase tracking-wider mt-0.5">${MESES[d.getMonth()].slice(0, 3)}</p>
          </div>
          <div class="min-w-0 flex-1">
            <p class="flex items-center gap-1.5 text-[11px]"><span class="h-2 w-2 rounded-full ${t.ponto}"></span><span class="text-slate-500 dark:text-neutral-400">${esc(t.nome)}${e.status === 'previsto' ? ' · a confirmar' : ''}</span></p>
            <p class="text-sm font-medium text-slate-900 dark:text-neutral-100 truncate">${esc(e.titulo)}</p>
            <p class="text-xs ${st.classe} truncate">${esc(Eventos.horarioTexto(e))} · ${esc(st.texto)}</p>
          </div>
        </button>`;
    }).join('');
    $('proximos').querySelectorAll('[data-dia]').forEach((b) => b.addEventListener('click', () => abrirDia(b.dataset.dia)));
  }

  // ---------- Modal do dia ----------

  let diaAberto = null;

  function fecharModal() { $('modal-root').innerHTML = ''; diaAberto = null; }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { fecharMenu(); if ($('modal-root').firstChild) fecharModal(); } });

  const ponto = (cor, texto) => `<span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-full ${cor} shrink-0"></span>${esc(texto)}</span>`;
  const horasTexto = (h) => (Number.isInteger(h) ? `${h} h` : `${String(h.toFixed(1)).replace('.', ',')} h`);

  // Situação da aula para o aluno: futura / hoje / realizada.
  function situacaoAulaHtml(a) {
    if (a.data > hoje) return ponto('bg-sky-500', 'Prevista');
    if (a.data === hoje) return ponto('bg-laranja', 'Hoje');
    return ponto('bg-emerald-500', 'Realizada');
  }

  function linhaAula(a) {
    const m = a.matricula;
    const meet = meetDe(m);
    const sala = (a.salaId ? salas.find((s) => s.id === a.salaId)?.nome : null) ?? m.sala?.nome ?? '';
    const formato = FORMATO[m.turma.formato] ?? m.turma.formato ?? '';
    const local = [sala, meet ? 'Google Meet' : ''].filter(Boolean).join(' · ') || (meet ? 'Google Meet' : 'Sala a definir');
    const instrutor = (a.instrutorId ? instrutores.find((i) => i.id === a.instrutorId) : null) ?? m.instrutor;
    const ordenadas = m.aulas.filter((x) => x.status !== 'cancelada').sort((x, y) => x.data.localeCompare(y.data) || x.inicio.localeCompare(y.inicio));
    const n = ordenadas.findIndex((x) => x.data === a.data && x.inicio === a.inicio) + 1;
    const total = ordenadas.length;
    const modulos = (a.moduloIds ?? []).map((id) => (m.curso?.modulos ?? []).find((mod) => mod.id === id)).filter(Boolean);
    const realizada = a.data < hoje;
    const linkAula = `aula.html?turma=${encodeURIComponent(m.turma.id)}&data=${encodeURIComponent(a.data)}`;
    const celula = (rotulo, valor, cls = '') => `<div class="${cls}"><p class="rotulo">${rotulo}</p><div class="text-sm text-slate-800 dark:text-neutral-100 mt-0.5">${valor}</div></div>`;
    const conteudo = a.conteudo || modulos.length
      ? `${a.conteudo ? esc(a.conteudo) : esc(modulos.map((x) => x.titulo).join(' · '))}${a.conteudo && modulos.length ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(modulos.map((x) => x.titulo).join(' · '))}</p>` : ''}`
      : '<span class="text-slate-400">a definir</span>';
    const botaoPri = 'inline-flex items-center gap-1.5 rounded-lg bg-petrol-800 dark:bg-sky-600 hover:bg-petrol-900 dark:hover:bg-sky-500 text-white text-sm font-medium px-3 py-1.5 transition';
    const acaoPrincipal = meet && !realizada ? `<a href="${esc(meet)}" target="_blank" rel="noopener" class="${botaoPri}">${ICONE_CAMERA}Entrar no Meet</a>` : '';
    return `
      <div class="flex gap-3 px-5 py-4">
        <div class="shrink-0 w-1 rounded-full bg-petrol-800 dark:bg-sky-400"></div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-slate-900 dark:text-neutral-100">${esc(m.curso?.nome ?? m.turma.codigo)} <span class="font-mono text-xs text-slate-400 ml-1">${esc(m.turma.codigo)}</span></p>
          <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${n ? `Aula ${n} de ${total}` : `${total} aulas`}${m.formacao ? ` · ${esc(m.formacao.nome)}` : ''}</p>
          <div class="grid grid-cols-2 gap-x-6 gap-y-3 mt-3">
            ${celula('Horário', `<span class="tabular-nums">${esc(a.inicio)}–${esc(a.fim)}</span> <span class="text-xs text-slate-500 dark:text-neutral-400">· ${esc(horasTexto(Turmas.horasAula(a)))}</span>`)}
            ${celula('Local', `${esc(local)}${formato ? ` <span class="text-xs text-slate-500 dark:text-neutral-400">(${esc(formato)})</span>` : ''}`)}
            ${celula('Professor', instrutor ? esc(instrutor.nome) : '<span class="text-slate-400">a definir</span>')}
            ${celula('Situação', situacaoAulaHtml(a))}
            ${celula('Conteúdo', conteudo, 'col-span-2')}
          </div>
          <div class="mt-3 flex flex-wrap items-center gap-3">
            ${acaoPrincipal}<a href="${linkAula}" class="link">Ver aula</a>
          </div>
        </div>
      </div>`;
  }

  function linhaEvento(e) {
    const t = Eventos.tipoDe(e.tipo);
    const insc = e.inscricao;
    const inscrito = Eventos.inscrito(inscricoes, aluno.id, e.id);
    const restantes = Eventos.vagasRestantes(inscricoes, e);
    const detalhes = [
      ['Horário', Eventos.horarioTexto(e)],
      ['Local', e.local?.nome ? `${e.local.nome}${e.local.endereco ? `<br><span class="text-slate-500 dark:text-neutral-400">${esc(e.local.endereco)}</span>` : ''}` : ''],
      ['Custo', e.custo ? Eventos.fmtMoeda(e.custo) : 'Gratuito'],
      ['Participação', e.obrigatorio ? 'Obrigatória' : 'Opcional'],
      insc.necessaria ? ['Inscrição', `${restantes != null ? `${restantes} de ${insc.vagas} vagas` : 'Vagas ilimitadas'}${insc.prazo ? ` · até ${Eventos.fmtData(insc.prazo)}` : ''}`] : null,
      e.publico.tipo === 'turmas' && e.turmas.length ? ['Turma', [...new Set(e.turmas.map((m) => esc(m.turma.codigo)))].join(', ')] : null,
      e.publico.tipo === 'formacoes' && e.turmas.length ? ['Formação', [...new Set(e.turmas.map((m) => esc(m.formacao?.nome ?? m.turma.formacaoId)))].join(', ')] : null,
      e.restricao ? ['Público', Eventos.restricaoTexto(e)] : null,
    ].filter((x) => x && x[1]);
    let acao = '';
    if (insc.necessaria) {
      if (inscrito) acao = `<button type="button" data-cancelar="${e.id}" class="rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 transition">Cancelar inscrição</button>`;
      else acao = `<button type="button" data-inscrever="${e.id}" class="rounded-lg bg-laranja hover:bg-laranja-escuro text-white text-sm font-medium px-3 py-1.5 transition">Inscrever-se</button>`;
    }
    return `
      <div class="flex gap-3 px-5 py-3">
        <div class="shrink-0 w-1 rounded-full ${t.ponto}"></div>
        <div class="min-w-0 flex-1">
          <p class="text-[11px] text-slate-500 dark:text-neutral-400">${esc(t.nome)}${e.status === 'previsto' ? ' · <span class="text-amber-600 dark:text-amber-400">a confirmar</span>' : ''}${inscrito ? ' · <span class="text-emerald-600 dark:text-emerald-400">inscrito</span>' : ''}</p>
          <p class="text-sm font-medium text-slate-900 dark:text-neutral-100">${esc(e.titulo)}</p>
          ${e.descricao ? `<p class="text-sm text-slate-600 dark:text-neutral-300 mt-1">${esc(e.descricao)}</p>` : ''}
          <dl class="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            ${detalhes.map(([k, v]) => `<dt class="text-slate-500 dark:text-neutral-400">${k}</dt><dd class="text-slate-700 dark:text-neutral-200">${v}</dd>`).join('')}
          </dl>
          ${acao ? `<div class="mt-3">${acao}</div>` : ''}
        </div>
      </div>`;
  }

  function abrirDia(iso) {
    diaAberto = iso;
    const as = aulasDoDia(iso);
    const es = eventosDoDia(iso);
    const feriado = typeof Feriados !== 'undefined' ? Feriados.nome(iso) : null;
    const titulo = PortalAluno.fmtDataLonga(iso).replace(/^./, (c) => c.toUpperCase());
    const vazio = !as.length && !es.length;
    $('modal-root').innerHTML = `
      <div class="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4" data-fundo>
        <div role="dialog" aria-modal="true" aria-labelledby="modal-titulo" class="cartao modal-anim w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 dark:border-neutral-900 flex items-start justify-between gap-3">
            <div>
              <p id="modal-titulo" class="font-display font-semibold text-slate-900 dark:text-neutral-100">${esc(titulo)}${iso === hoje ? ' <span class="text-laranja text-sm">· hoje</span>' : ''}</p>
              <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(PortalAluno.fmtData(iso))}${feriado ? ` · ${esc(feriado)}` : ''}</p>
            </div>
            <button type="button" data-fechar title="Fechar" class="p-1.5 -mr-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-900 transition">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="overflow-y-auto">
            ${vazio ? `<p class="px-5 py-8 text-center text-sm text-slate-500 dark:text-neutral-400">Nada agendado neste dia.</p>` : ''}
            ${as.length ? `<p class="rotulo px-5 pt-4 pb-1">Aulas</p><div class="divide-y divide-slate-100 dark:divide-neutral-900">${as.map(linhaAula).join('')}</div>` : ''}
            ${es.length ? `<p class="rotulo px-5 pt-4 pb-1">Eventos</p><div class="divide-y divide-slate-100 dark:divide-neutral-900">${es.map(linhaEvento).join('')}</div>` : ''}
          </div>
        </div>
      </div>`;
    const root = $('modal-root');
    root.querySelector('[data-fechar]').addEventListener('click', fecharModal);
    root.querySelector('[data-fundo]').addEventListener('click', (e) => { if (e.target === e.currentTarget) fecharModal(); });
    root.querySelectorAll('[data-inscrever]').forEach((b) => b.addEventListener('click', () => inscrever(b.dataset.inscrever)));
    root.querySelectorAll('[data-cancelar]').forEach((b) => b.addEventListener('click', () => pedirCancelamento(b.dataset.cancelar)));
  }

  function inscrever(eventoId) {
    const e = Eventos.porId(eventos, eventoId);
    const r = Eventos.inscrever(inscricoes, aluno.id, e, hoje);
    if (r.erro) { toast(r.erro); return; }
    inscricoes = r.inscricoes;
    Eventos.salvarInscricoes(inscricoes);
    toast(`Inscrição confirmada: ${e.titulo}.`);
    render();
    abrirDia(diaAberto ?? e.data);
  }

  function cancelar(eventoId) {
    const e = Eventos.porId(eventos, eventoId);
    const r = Eventos.cancelarInscricao(inscricoes, aluno.id, e, hoje);
    if (r.erro) { toast(r.erro); return; }
    inscricoes = r.inscricoes;
    Eventos.salvarInscricoes(inscricoes);
    toast(`Inscrição cancelada: ${e.titulo}.`);
    render();
    abrirDia(diaAberto ?? e.data);
  }

  // Cancelar só pede confirmação quando o evento tem custo (há cobrança/estorno envolvido).
  function pedirCancelamento(eventoId) {
    const e = Eventos.porId(eventos, eventoId);
    if (!e.custo) { cancelar(eventoId); return; }
    const dia = diaAberto;
    $('modal-root').innerHTML = `
      <div class="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4" data-fundo>
        <div role="alertdialog" aria-modal="true" class="cartao modal-anim w-full max-w-md border-red-300 dark:border-red-800">
          <div class="px-5 py-4">
            <p class="font-display font-semibold text-red-700 dark:text-red-400">Cancelar inscrição?</p>
            <p class="text-sm text-slate-600 dark:text-neutral-300 mt-2">Este evento tem custo de <strong>${esc(Eventos.fmtMoeda(e.custo))}</strong>. Se o valor já foi pago, o estorno é tratado pela secretaria. A vaga volta a ficar disponível para outros alunos.</p>
          </div>
          <div class="px-5 py-3 border-t border-slate-100 dark:border-neutral-900 flex justify-end gap-2">
            <button type="button" data-voltar class="rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-900 transition">Manter inscrição</button>
            <button type="button" data-confirmar class="rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-1.5 transition">Cancelar inscrição</button>
          </div>
        </div>
      </div>`;
    const root = $('modal-root');
    root.querySelector('[data-voltar]').addEventListener('click', () => abrirDia(dia));
    root.querySelector('[data-fundo]').addEventListener('click', (ev) => { if (ev.target === ev.currentTarget) abrirDia(dia); });
    root.querySelector('[data-confirmar]').addEventListener('click', () => { diaAberto = dia; cancelar(eventoId); });
  }

  // ---------- Render ----------

  function render() {
    $('titulo-mes').textContent = `${MESES[estado.mes - 1]} ${estado.ano}`;
    renderGrade();
    renderProximos();
  }
  render();
})();
