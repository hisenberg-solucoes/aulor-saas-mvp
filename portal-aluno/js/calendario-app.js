// Portal do Aluno — calendário (UI): as aulas das matrículas e os feriados, mês a mês. Só leitura.
// Os eventos (palestras, workshops, inscrições) do protótipo original ficaram fora da V1.
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

  // Semanas do mês (segunda a domingo), com os dias dos meses vizinhos para completar a grade.
  const pad = (n) => String(n).padStart(2, '0');
  const addDias = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  function gradeDoMes(ano, mes) {
    const ym = `${ano}-${pad(mes)}`;
    const primeiro = `${ym}-01`;
    const offset = (new Date(`${primeiro}T12:00:00`).getDay() + 6) % 7; // segunda = 0
    const dias = [];
    for (let i = offset; i > 0; i -= 1) dias.push({ iso: addDias(primeiro, -i), doMes: false });
    for (let d = 1; d <= new Date(ano, mes, 0).getDate(); d += 1) dias.push({ iso: `${ym}-${pad(d)}`, doMes: true });
    let prox = addDias(dias.at(-1).iso, 1);
    while (dias.length % 7) { dias.push({ iso: prox, doMes: false }); prox = addDias(prox, 1); }
    const semanas = [];
    for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7));
    return semanas;
  }

  // ---------- Dados ----------

  const ms = PortalAluno.matriculas(aluno.id, hoje);
  const salas = typeof Salas !== 'undefined' ? Salas.carregar() : [];

  const estado = { ano: Number(hoje.slice(0, 4)), mes: Number(hoje.slice(5, 7)), turmaId: '' };

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

  function aulasDoDia(iso) {
    return aulas.filter((a) => a.data === iso && (!estado.turmaId || a.matricula.turma.id === estado.turmaId)).sort((a, b) => a.inicio.localeCompare(b.inicio));
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

  $('mes-anterior').addEventListener('click', () => { estado.mes -= 1; if (estado.mes < 1) { estado.mes = 12; estado.ano -= 1; } render(); });
  $('mes-seguinte').addEventListener('click', () => { estado.mes += 1; if (estado.mes > 12) { estado.mes = 1; estado.ano += 1; } render(); });
  $('hoje').addEventListener('click', () => { estado.ano = Number(hoje.slice(0, 4)); estado.mes = Number(hoje.slice(5, 7)); render(); });

  $('cabecalho-dias').innerHTML = DIAS_CURTOS.map((d) => `<span class="py-2">${d}</span>`).join('');

  // ---------- Grade ----------

  const chipAula = (a) => `
    <button type="button" data-dia="${a.data}" title="${esc(`${a.inicio}–${a.fim} · ${a.matricula.curso?.nome ?? a.matricula.turma.codigo}`)}" aria-label="${esc(`${a.inicio}–${a.fim} · ${a.matricula.curso?.nome ?? a.matricula.turma.codigo}`)}"
      class="w-full flex items-center gap-1 rounded px-1.5 py-0.5 text-left text-[11px] leading-tight bg-petrol-800/10 text-petrol-900 dark:bg-sky-500/20 dark:text-sky-200 hover:bg-petrol-800/20 dark:hover:bg-sky-500/30 transition">
      <span class="tabular-nums shrink-0">${esc(a.inicio)}</span><span class="font-medium truncate">${esc(a.matricula.curso?.nome ?? a.matricula.turma.codigo)}</span>
    </button>${a.data === hoje && meetDe(a.matricula) ? `<a href="${esc(meetDe(a.matricula))}" target="_blank" rel="noopener" data-meet class="block rounded px-1.5 py-0.5 text-[11px] font-medium text-white bg-petrol-800 dark:bg-sky-600 hover:bg-petrol-900 dark:hover:bg-sky-500 transition">Entrar no Meet</a>` : ''}`;

  function renderGrade() {
    const semanas = gradeDoMes(estado.ano, estado.mes);
    let totalAulas = 0;
    $('grade').innerHTML = semanas.flat().map((d, i) => {
      const itens = aulasDoDia(d.iso).map(chipAula);
      if (d.doMes) totalAulas += itens.length;
      const visiveis = itens.length > MAX_ITENS_CELULA ? itens.slice(0, MAX_ITENS_CELULA - 1) : itens;
      const extra = itens.length - visiveis.length;
      const ehHoje = d.iso === hoje;
      const feriado = typeof Feriados !== 'undefined' ? Feriados.nome(d.iso) : null;
      const fimSemana = i % 7 >= 5;
      const borda = `${i % 7 ? 'border-l' : ''} ${i >= 7 ? 'border-t' : ''} border-slate-100 dark:border-neutral-900`;
      const fundo = !d.doMes ? 'bg-slate-50/70 dark:bg-neutral-925' : fimSemana ? 'bg-slate-50/40 dark:bg-neutral-950' : 'bg-white dark:bg-neutral-950';
      const numero = ehHoje
        ? 'h-6 w-6 rounded-full bg-petrol-800 text-white dark:bg-areia dark:text-petrol-800 font-semibold grid place-items-center'
        : `${d.doMes ? 'text-slate-700 dark:text-neutral-200' : 'text-slate-400 dark:text-neutral-600'} ${feriado ? 'font-semibold' : ''}`;
      return `
        <div data-celula="${d.iso}" class="${borda} ${fundo} min-h-[6.5rem] p-1.5 flex flex-col gap-1 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-neutral-900/70 transition ${d.doMes ? '' : 'opacity-70'}">
          <div class="flex items-start justify-between gap-1 min-w-0">
            <span class="text-xs tabular-nums ${numero}">${Number(d.iso.slice(8))}</span>
            ${feriado ? `<span class="text-[10px] text-slate-400 dark:text-neutral-500 truncate" title="${esc(feriado)}">${esc(feriado)}</span>` : ''}
          </div>
          ${visiveis.join('')}
          ${extra ? `<button type="button" data-dia="${d.iso}" class="text-left text-[11px] font-medium text-slate-500 dark:text-neutral-400 hover:text-petrol-800 dark:hover:text-sky-300 px-1.5">+${extra} ${extra === 1 ? 'aula' : 'aulas'}</button>` : ''}
        </div>`;
    }).join('');
    $('grade').querySelectorAll('[data-celula]').forEach((c) => c.addEventListener('click', () => abrirDia(c.dataset.celula)));
    $('grade').querySelectorAll('[data-meet]').forEach((a) => a.addEventListener('click', (e) => e.stopPropagation()));

    $('legenda').innerHTML = `<span class="tabular-nums text-slate-600 dark:text-neutral-300">${totalAulas} ${totalAulas === 1 ? 'aula' : 'aulas'} em ${MESES[estado.mes - 1]}</span>`;
  }

  // ---------- Modal do dia ----------

  function fecharModal() { $('modal-root').innerHTML = ''; }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('modal-root').firstChild) fecharModal(); });

  const ponto = (cor, texto) => `<span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-full ${cor} shrink-0"></span>${esc(texto)}</span>`;
  const horasTexto = (h) => (Number.isInteger(h) ? `${h} h` : `${String(h.toFixed(1)).replace('.', ',')} h`);

  // Situação da aula para o aluno: futura / hoje / realizada.
  function situacaoAulaHtml(a) {
    if (a.data > hoje) return ponto('bg-sky-500', 'Prevista');
    if (a.data === hoje) return ponto('bg-petrol-800 dark:bg-sky-300', 'Hoje');
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

  function abrirDia(iso) {
    const as = aulasDoDia(iso);
    const feriado = typeof Feriados !== 'undefined' ? Feriados.nome(iso) : null;
    const titulo = new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase());
    $('modal-root').innerHTML = `
      <div class="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4" data-fundo>
        <div role="dialog" aria-modal="true" aria-labelledby="modal-titulo" class="cartao modal-anim w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 dark:border-neutral-900 flex items-start justify-between gap-3">
            <div>
              <p id="modal-titulo" class="font-display font-semibold text-slate-900 dark:text-neutral-100">${esc(titulo)}${iso === hoje ? ' <span class="text-petrol-800 dark:text-sky-300 text-sm">· hoje</span>' : ''}</p>
              <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(PortalAluno.fmtData(iso))}${feriado ? ` · ${esc(feriado)}` : ''}</p>
            </div>
            <button type="button" data-fechar title="Fechar" class="p-1.5 -mr-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-900 transition">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="overflow-y-auto">
            ${as.length ? `<div class="divide-y divide-slate-100 dark:divide-neutral-900">${as.map(linhaAula).join('')}</div>` : '<p class="px-5 py-8 text-center text-sm text-slate-500 dark:text-neutral-400">Nenhuma aula neste dia.</p>'}
          </div>
        </div>
      </div>`;
    const root = $('modal-root');
    root.querySelector('[data-fechar]').addEventListener('click', fecharModal);
    root.querySelector('[data-fundo]').addEventListener('click', (e) => { if (e.target === e.currentTarget) fecharModal(); });
  }

  // ---------- Render ----------

  function render() {
    $('titulo-mes').textContent = `${MESES[estado.mes - 1]} ${estado.ano}`;
    renderGrade();
  }
  render();
})();
