// Portal do Aluno — Aulas (UI). Só leitura: as aulas vêm das turmas das matrículas ativas do aluno
// (agendadas em turma.aulas ou prévia da agenda); no detalhe, os materiais que o professor liberou (Materiais).
// Lista (aulas.html) com abas Próximas / Realizadas / Todas + detalhe em página separada
// (aula.html?turma=<turmaId>&data=<iso>[&inicio=HH:MM]). A URL antiga aulas.html?turma=&data= redireciona.
(() => {
  const aluno = PortalAluno.alunoLogado();
  if (!aluno) { PortalAluno.sair(); location.replace('login.html'); return; }

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hoje = PortalAluno.hoje();
  const data = (iso) => esc(PortalAluno.fmtData(String(iso ?? '').slice(0, 10)));
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
  const diaCurto = (iso) => PortalAluno.diaSemana(iso).slice(0, 3);
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const nomeMes = (ym) => { const [y, m] = ym.split('-').map(Number); return `${MESES[m - 1]} de ${y}`; };

  const SITUACAO = {
    realizada: { nome: 'Realizada', ponto: 'bg-slate-400' },
    hoje: { nome: 'Hoje', ponto: 'bg-petrol-800 dark:bg-sky-300' },
    prevista: { nome: 'Prevista', ponto: 'bg-sky-500' },
    cancelada: { nome: 'Cancelada', ponto: 'bg-red-500' },
  };
  const FORMATO = { presencial: 'Presencial', online: 'Online ao vivo', hibrido: 'Híbrido', ead: 'EAD' };
  const TIPO_MATERIAL = { video: 'Vídeo', arquivo: 'Arquivo', link: 'Link' };
  const ICONE_CAMERA = '<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>';
  const ponto = (cor, texto) => `<span class="inline-flex items-center gap-1.5 whitespace-nowrap"><span class="h-2 w-2 rounded-full ${cor} shrink-0"></span>${esc(texto)}</span>`;
  const traco = '<span class="text-slate-400">—</span>';
  const vazio = (msg) => `<div class="cartao p-8 text-center text-sm text-slate-500 dark:text-neutral-400">${msg}</div>`;
  const dado = (r, v) => `<div><p class="rotulo">${esc(r)}</p><div class="text-sm text-slate-800 dark:text-neutral-100 mt-0.5">${v}</div></div>`;
  const motivoTexto = (motivo) => {
    if (!motivo) return '';
    if (typeof motivo === 'string') return Aulas.motivoDe(motivo);
    const nome = Aulas.motivoDe(motivo.tipo);
    return motivo.texto ? `${nome} — ${motivo.texto}` : nome;
  };

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast-anim pointer-events-auto rounded-lg bg-slate-900 dark:bg-neutral-800 text-white text-sm px-4 py-2 shadow-lg';
    el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }


  // ---------- Modo / URL ----------

  const params = new URLSearchParams(location.search);
  const MODO = document.body.dataset.modo === 'detalhe' ? 'detalhe' : 'lista';
  const pTurma = params.get('turma');
  const pData = params.get('data');
  const pInicio = params.get('inicio');
  const urlAula = (a) => `aula.html?turma=${encodeURIComponent(a.turma.id)}&data=${encodeURIComponent(a.data)}${a.ambigua ? `&inicio=${encodeURIComponent(a.inicio)}` : ''}`;
  // Lista com ?turma=&data= (URL antiga) → detalhe; detalhe sem parâmetros → lista.
  if (MODO === 'lista' && pTurma && pData) { location.replace(`aula.html?turma=${encodeURIComponent(pTurma)}&data=${encodeURIComponent(pData)}${pInicio ? `&inicio=${encodeURIComponent(pInicio)}` : ''}`); return; }
  if (MODO === 'detalhe' && (!pTurma || !pData)) { location.replace('aulas.html'); return; }

  // ---------- Consulta (local desta tela; não mexe no portal-aluno-motor.js) ----------
  // Todas as aulas das matrículas ativas (em andamento, a iniciar, concluídas), inclusive canceladas
  // quando a turma já tem agendamento. Cada aula: { ...aula, matricula, turma, curso, situacaoAula,
  // reposicao, sala, instrutor, modulos, horas, ambigua, chave }.
  function montarAulas() {
    const ms = PortalAluno.todasMatriculas(aluno.id, hoje).filter((m) => ['em_andamento', 'a_iniciar', 'concluida'].includes(m.situacaoAluno));
    const salas = typeof Salas !== 'undefined' ? Salas.carregar() : [];
    const instrutores = typeof Instrutores !== 'undefined' ? Instrutores.carregar() : [];
    const todas = [];
    ms.forEach((m) => {
      const agendadas = Turmas.aulasAgendadas(m.turma);
      const base = agendadas ?? m.aulas;
      base.forEach((a) => {
        const situacaoAula = a.status === 'cancelada' ? 'cancelada' : a.data < hoje ? 'realizada' : a.data === hoje ? 'hoje' : 'prevista';
        todas.push({
          ...a,
          matricula: m, turma: m.turma, curso: m.curso,
          situacaoAula,
          reposicao: a.origem === 'reposicao',
          sala: (a.salaId ? salas.find((s) => s.id === a.salaId) : null) ?? m.sala,
          instrutor: (a.instrutorId ? instrutores.find((i) => i.id === a.instrutorId) : null) ?? m.instrutor,
          modulos: (a.moduloIds ?? []).map((id) => (m.curso?.modulos ?? []).find((mod) => mod.id === id)).filter(Boolean),
          horas: Turmas.horasAula(a),
          ambigua: base.filter((b) => b.data === a.data).length > 1,
          chave: `${m.turma.id}|${a.data}|${a.inicio}`,
        });
      });
    });
    todas.sort((a, b) => a.data.localeCompare(b.data) || a.inicio.localeCompare(b.inicio) || a.turma.codigo.localeCompare(b.turma.codigo));
    return { matriculas: ms, aulas: todas };
  }

  // Uma aula cancelada é "reposta" quando a mesma turma tem uma aula de origem reposição depois dela [sup.].
  const reposicaoDe = (a, todas) => (a.situacaoAula === 'cancelada' ? todas.find((b) => b.turma.id === a.turma.id && b.reposicao && b.data >= a.data && b.situacaoAula !== 'cancelada') ?? null : null);

  const localTexto = (a) => (a.sala ? a.sala.nome : a.turma.meetLink ? 'Google Meet' : 'Sala a definir');
  const linkMeet = (a, cls = 'link inline-flex items-center gap-1 !text-xs') => (a.turma.meetLink
    ? `<a href="${esc(a.turma.meetLink)}" target="_blank" rel="noopener" data-parar class="${cls}" title="Abrir a sala da turma no Google Meet">${ICONE_CAMERA}Meet</a>`
    : '');
  const situacaoTexto = (a) => {
    if (a.situacaoAula === 'realizada') return ponto(SITUACAO.realizada.ponto, 'Realizada');
    if (a.situacaoAula === 'cancelada') return ponto(SITUACAO.cancelada.ponto, 'Cancelada');
    if (a.reposicao) return ponto('bg-violet-500', a.situacaoAula === 'hoje' ? 'Hoje · Reposição' : 'Reposição');
    const s = SITUACAO[a.situacaoAula];
    return ponto(s.ponto, s.nome);
  };

  // ============================================================
  // LISTA
  // ============================================================

  function renderLista() {
    const { matriculas, aulas } = montarAulas();
    $('tela-lista').classList.remove('hidden');
    $('subtitulo').textContent = `Referência ${PortalAluno.fmtData(hoje)}`;
    if (params.get('erro') === 'nao-encontrada') { toast('Aula não encontrada entre as suas turmas.'); history.replaceState(null, '', location.pathname); }

    // ----- Cartões-resumo -----
    const proxima = aulas.find((a) => (a.situacaoAula === 'hoje' || a.situacaoAula === 'prevista'));
    const validas = aulas.filter((a) => a.situacaoAula !== 'cancelada');
    const realizadas = validas.filter((a) => a.situacaoAula === 'realizada');
    const cartao = (rotulo, corpo) => `<div class="cartao p-5"><p class="rotulo">${esc(rotulo)}</p>${corpo}</div>`;
    const cartaoProxima = proxima
      ? `<div class="mt-1.5 flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-display font-semibold text-lg leading-snug ${proxima.situacaoAula === 'hoje' ? 'text-petrol-800 dark:text-sky-300' : 'text-slate-900 dark:text-neutral-100'}">${esc(PortalAluno.rotuloDia(proxima.data, hoje))} · ${esc(proxima.inicio)}–${esc(proxima.fim)}</p>
            <p class="text-sm text-slate-700 dark:text-neutral-200 mt-1 truncate"><a href="${urlAula(proxima)}" class="hover:underline">${esc(proxima.curso?.nome ?? proxima.turma.codigo)}</a> <span class="font-mono text-xs text-slate-400">${esc(proxima.turma.codigo)}</span></p>
            <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(localTexto(proxima))}${proxima.instrutor ? ` · ${esc(proxima.instrutor.nome)}` : ''}</p>
          </div>
          ${proxima.turma.meetLink ? `<a href="${esc(proxima.turma.meetLink)}" target="_blank" rel="noopener" class="botao-pri shrink-0">${ICONE_CAMERA}Entrar no Meet</a>` : ''}
        </div>`
      : `<p class="font-display font-semibold text-lg text-slate-900 dark:text-neutral-100 mt-1.5">${aulas.length ? 'Nenhuma aula prevista' : '—'}</p><p class="text-sm text-slate-500 dark:text-neutral-400 mt-1">${aulas.length ? 'Todas as aulas das suas turmas já aconteceram.' : 'Você ainda não tem aulas.'}</p>`;
    const pct = validas.length ? Math.round((realizadas.length / validas.length) * 100) : 0;
    const cartaoRealizadas = `
      <p class="font-display font-semibold text-lg text-slate-900 dark:text-neutral-100 mt-1.5 tabular-nums">${realizadas.length} <span class="text-sm font-sans font-normal text-slate-500 dark:text-neutral-400">de ${validas.length}</span></p>
      <div class="barra-progresso mt-2"><div class="h-full rounded-full bg-petrol-800 dark:bg-sky-400" style="width:${pct}%"></div></div>
      <p class="text-sm text-slate-500 dark:text-neutral-400 mt-1">${validas.length ? `${pct}% das aulas · ${plural(matriculas.length, 'curso', 'cursos')}` : 'Nenhuma aula agendada'}</p>`;
    $('totais').innerHTML = [cartao('Próxima aula', cartaoProxima), cartao('Aulas realizadas', cartaoRealizadas)].join('');

    if (!aulas.length) {
      $('abas').innerHTML = '';
      $('conteudo-aba').innerHTML = vazio(matriculas.length
        ? 'As aulas das suas turmas ainda não foram agendadas. Assim que a secretaria confirmar a agenda, elas aparecem aqui.'
        : 'Você ainda não tem aulas porque não está matriculado em nenhum curso. Dúvidas? Fale com a secretaria.');
      return;
    }

    // ----- Abas + barra + tabela -----
    const proximas = aulas.filter((a) => a.situacaoAula === 'hoje' || a.situacaoAula === 'prevista');
    const feitas = aulas.filter((a) => a.situacaoAula === 'realizada');
    const ABAS = [
      { id: 'proximas', titulo: 'Próximas', n: proximas.length },
      { id: 'realizadas', titulo: 'Realizadas', n: feitas.length },
      { id: 'todas', titulo: 'Todas', n: aulas.length },
    ];
    const abaUrl = params.get('aba');
    const estado = { aba: ABAS.some((x) => x.id === abaUrl) ? abaUrl : 'proximas', busca: '', turma: '', mes: '' };
    const turmasOpcoes = matriculas.map((m) => ({ id: m.turma.id, nome: `${m.curso?.nome ?? m.turma.codigo} · ${m.turma.codigo}` })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    const mesesOpcoes = [...new Set(aulas.map((a) => a.data.slice(0, 7)))].sort();

    const daAba = (a) => (estado.aba === 'proximas' ? (a.situacaoAula === 'hoje' || a.situacaoAula === 'prevista')
      : estado.aba === 'realizadas' ? a.situacaoAula === 'realizada' : true);
    const passaFiltro = (a) => {
      if (estado.turma && a.turma.id !== estado.turma) return false;
      if (estado.mes && a.data.slice(0, 7) !== estado.mes) return false;
      if (estado.busca) {
        const alvo = [a.curso?.nome, a.turma.codigo, a.conteudo, ...a.modulos.map((m) => m.titulo), a.instrutor?.nome, a.sala?.nome].filter(Boolean).join(' ').toLowerCase();
        if (!alvo.includes(estado.busca.toLowerCase())) return false;
      }
      return true;
    };

    function linha(a) {
      const cancelada = a.situacaoAula === 'cancelada';
      const rep = reposicaoDe(a, aulas);
      const conteudo = a.conteudo || a.modulos.map((m) => m.titulo).join(' · ');
      const classe = cancelada ? 'text-slate-400 dark:text-neutral-500' : '';
      return `<tr data-abrir="${urlAula(a)}" class="cursor-pointer hover:bg-petrol-800/5 dark:hover:bg-sky-400/10 transition ${classe}">
        <td class="whitespace-nowrap tabular-nums ${cancelada ? 'line-through' : ''}"><span class="${a.situacaoAula === 'hoje' ? 'font-semibold text-petrol-800 dark:text-sky-300' : ''}">${a.situacaoAula === 'hoje' || (estado.aba !== 'realizadas' && PortalAluno.rotuloDia(a.data, hoje) === 'Amanhã') ? esc(PortalAluno.rotuloDia(a.data, hoje)) : data(a.data)}</span> <span class="text-xs text-slate-500 dark:text-neutral-400">${esc(diaCurto(a.data))}</span></td>
        <td class="whitespace-nowrap tabular-nums ${cancelada ? 'line-through' : ''}">${esc(a.inicio)}–${esc(a.fim)}</td>
        <td><p class="font-medium ${cancelada ? '' : 'text-slate-900 dark:text-neutral-100'}">${esc(a.curso?.nome ?? a.turma.codigo)}</p><p class="text-xs text-slate-500 dark:text-neutral-400"><span class="font-mono">${esc(a.turma.codigo)}</span>${a.n ? ` · aula ${a.n}` : ''}</p></td>
        <td class="max-w-xs">${conteudo ? `<span class="${cancelada ? 'line-through' : ''}">${esc(conteudo)}</span>` : traco}${a.conteudo && a.modulos.length ? `<p class="text-xs text-slate-500 dark:text-neutral-400">${esc(a.modulos.map((m) => m.titulo).join(' · '))}</p>` : ''}${cancelada ? `<p class="text-xs text-red-600 dark:text-red-400">${esc(motivoTexto(a.motivo) || 'Aula cancelada')}${rep ? ` · reposição em ${data(rep.data)}` : ''}</p>` : ''}</td>
        <td class="whitespace-nowrap">${esc(localTexto(a))}${!cancelada && a.turma.meetLink ? ` <span class="ml-1">${linkMeet(a)}</span>` : ''}</td>
        <td>${a.instrutor ? esc(a.instrutor.nome) : traco}</td>
        <td>${situacaoTexto(a)}</td>
      </tr>`;
    }

    function renderAbas() {
      $('abas').innerHTML = ABAS.map((x) => `
        <button type="button" data-aba="${x.id}" class="px-1 pb-2.5 -mb-px text-sm border-b-2 transition whitespace-nowrap ${estado.aba === x.id ? 'border-[color:var(--f-marca-tinta)] text-slate-900 dark:text-neutral-100 font-medium' : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'}">${x.titulo}<span class="ml-1 text-xs text-slate-400 tabular-nums">${x.n}</span></button>`).join('');
    }

    function renderTabela() {
      const itens = aulas.filter(daAba).filter(passaFiltro);
      const ordenadas = estado.aba === 'realizadas' ? [...itens].reverse() : itens;
      const semFiltro = !estado.busca && !estado.turma && !estado.mes;
      const msgVazia = semFiltro
        ? { proximas: 'Nenhuma aula prevista — todas as aulas das suas turmas já aconteceram.', realizadas: 'Nenhuma aula realizada ainda.', todas: 'Nenhuma aula.' }[estado.aba]
        : 'Nenhuma aula com esses filtros.';
      $('tabela').innerHTML = ordenadas.length
        ? `<div class="cartao overflow-hidden"><div class="overflow-x-auto"><table class="tabela w-full">
            <thead><tr><th>Data</th><th>Horário</th><th>Curso</th><th>Conteúdo</th><th>Local</th><th>Instrutor</th><th>Situação</th></tr></thead>
            <tbody>${ordenadas.map(linha).join('')}</tbody>
          </table></div></div>
          <p class="text-xs text-slate-500 dark:text-neutral-400 mt-2">${plural(ordenadas.length, 'aula', 'aulas')}${estado.aba === 'realizadas' ? ', da mais recente para a mais antiga' : ', em ordem cronológica'}. Clique na linha para ver a aula.</p>`
        : vazio(msgVazia);
    }

    function renderAba() {
      renderAbas();
      const q = new URLSearchParams(location.search); q.set('aba', estado.aba); history.replaceState(null, '', `?${q}`);
      $('conteudo-aba').innerHTML = `
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <label class="relative">
            <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input type="search" data-busca value="${esc(estado.busca)}" placeholder="Buscar por curso, conteúdo ou instrutor" class="select !pl-8 w-72 max-w-full">
          </label>
          <select data-turma class="select">
            <option value="">Todos os cursos</option>
            ${turmasOpcoes.map((t) => `<option value="${esc(t.id)}" ${estado.turma === t.id ? 'selected' : ''}>${esc(t.nome)}</option>`).join('')}
          </select>
          <select data-mes class="select">
            <option value="">Todos os meses</option>
            ${mesesOpcoes.map((m) => `<option value="${m}" ${estado.mes === m ? 'selected' : ''}>${esc(nomeMes(m))}</option>`).join('')}
          </select>
        </div>
        <div id="tabela"></div>`;
      renderTabela();
    }

    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-parar]')) { e.stopPropagation(); return; }
      const b = e.target.closest('[data-aba]');
      if (b) { estado.aba = b.dataset.aba; renderAba(); return; }
      const tr = e.target.closest('tr[data-abrir]');
      if (tr) location.href = tr.dataset.abrir;
    });
    document.addEventListener('input', (e) => {
      const inp = e.target.closest('[data-busca]');
      if (!inp) return;
      estado.busca = inp.value.trim();
      renderTabela();
    });
    document.addEventListener('change', (e) => {
      if (e.target.closest('[data-turma]')) { estado.turma = e.target.value; renderTabela(); }
      else if (e.target.closest('[data-mes]')) { estado.mes = e.target.value; renderTabela(); }
    });
    renderAba();
  }

  // ============================================================
  // DETALHE DA AULA
  // ============================================================

  function renderDetalhe() {
    const { aulas } = montarAulas();
    const candidatas = aulas.filter((a) => a.turma.id === pTurma && a.data === pData);
    const a = (pInicio ? candidatas.find((x) => x.inicio === pInicio) : null) ?? candidatas[0] ?? null;
    if (!a) { location.replace('aulas.html?erro=nao-encontrada'); return; }
    const m = a.matricula;
    const daTurma = aulas.filter((x) => x.turma.id === a.turma.id);
    const idx = daTurma.findIndex((x) => x.chave === a.chave);
    const anterior = daTurma[idx - 1] ?? null;
    const proxima = daTurma[idx + 1] ?? null;
    const nomeCurso = a.curso?.nome ?? a.turma.codigo;
    const cancelada = a.situacaoAula === 'cancelada';
    const rep = reposicaoDe(a, aulas);
    const podeEntrar = a.turma.meetLink && !cancelada && (a.situacaoAula === 'hoje' || a.situacaoAula === 'prevista');

    $('tela-detalhe').classList.remove('hidden');
    $('titulo').textContent = `${nomeCurso} · ${PortalAluno.fmtData(a.data)}`;
    $('subtitulo').innerHTML = `<span class="font-mono">${esc(a.turma.codigo)}</span>${a.n ? ` · aula ${a.n} de ${daTurma.filter((x) => x.situacaoAula !== 'cancelada').length}` : ''} · ${esc(PortalAluno.fmtDataLonga(a.data))}`;
    const bc = $('breadcrumb');
    bc.classList.remove('hidden');
    const sep = '<svg class="h-3.5 w-3.5 text-slate-300 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>';
    bc.innerHTML = `<a href="aulas.html" class="hover:underline">Aulas</a>${sep}<span class="text-slate-800 dark:text-neutral-100 font-medium">${esc(nomeCurso)} · ${data(a.data)}</span>`;

    const setaEsq = '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>';
    const setaDir = '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>';
    const navBtn = (x, texto, icone, antes) => (x
      ? `<a href="${urlAula(x)}" class="botao-sec" title="${esc(`${texto}: ${PortalAluno.fmtData(x.data)} · ${x.inicio}–${x.fim}`)}">${antes ? icone : ''}${texto}${antes ? '' : icone}</a>`
      : `<span class="botao-sec opacity-50 cursor-not-allowed" aria-disabled="true">${antes ? icone : ''}${texto}${antes ? '' : icone}</span>`);
    $('acoes-topo').innerHTML = `${navBtn(anterior, 'Anterior', setaEsq, true)}${navBtn(proxima, 'Próxima', setaDir, false)}<a href="curso.html?turma=${encodeURIComponent(a.turma.id)}" class="botao-sec">Ver curso</a>${podeEntrar ? `<a href="${esc(a.turma.meetLink)}" target="_blank" rel="noopener" class="botao-pri">${ICONE_CAMERA}Entrar no Meet</a>` : ''}`;

    // ----- Cabeçalho -----
    const avisoCancelada = cancelada
      ? `<div class="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-5 py-3 text-sm text-red-700 dark:text-red-300 mb-4">${ponto('bg-red-500', 'Aula cancelada')}${a.motivo ? ` — ${esc(motivoTexto(a.motivo))}` : ''}${rep ? `. Reposição em <a href="${urlAula(rep)}" class="font-medium underline">${data(rep.data)} · ${esc(rep.inicio)}–${esc(rep.fim)}</a>.` : '. A secretaria ainda não marcou a reposição.'}</div>`
      : '';
    const avisoHoje = a.situacaoAula === 'hoje'
      ? `<div class="rounded-lg bg-[var(--f-selecao)] px-4 py-3 text-sm text-petrol-800 dark:text-sky-300 mb-4">${ponto('bg-petrol-800 dark:bg-sky-300', 'É hoje')} · ${esc(a.inicio)}–${esc(a.fim)}${a.turma.meetLink ? ` · <a href="${esc(a.turma.meetLink)}" target="_blank" rel="noopener" class="font-medium underline">Entrar no Meet</a>` : a.sala ? ` · ${esc(a.sala.nome)}` : ''}</div>`
      : '';
    const local = a.sala
      ? `${esc(a.sala.nome)}${a.turma.meetLink ? `<p class="text-xs mt-0.5">${linkMeet(a)} <span class="text-slate-400">· também transmitida</span></p>` : ''}`
      : a.turma.meetLink ? `Google Meet<p class="text-xs mt-0.5">${linkMeet(a)}</p>` : '<span class="text-slate-500 dark:text-neutral-400">Sala a definir</span>';
    $('cabecalho-aula').innerHTML = `${avisoCancelada}${avisoHoje}
      <div class="cartao p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
        ${dado('Curso', `<a href="curso.html?turma=${encodeURIComponent(a.turma.id)}" class="link">${esc(nomeCurso)}</a><p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${m.formacao ? esc(m.formacao.nome) : 'Curso avulso'}</p>`)}
        ${dado('Turma', `<span class="font-mono">${esc(a.turma.codigo)}</span><p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(FORMATO[a.turma.formato] ?? a.turma.formato ?? '')}${a.turma.turno ? ` · ${esc(a.turma.turno)}` : ''}</p>`)}
        ${dado('Data e horário', `${esc(PortalAluno.rotuloDia(a.data, hoje))}${['Hoje', 'Amanhã'].includes(PortalAluno.rotuloDia(a.data, hoje)) ? ` <span class="text-xs text-slate-500 dark:text-neutral-400">${data(a.data)}</span>` : ''}<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 tabular-nums">${esc(a.inicio)}–${esc(a.fim)} · ${esc(String(Math.round(a.horas * 10) / 10).replace('.', ','))} h</p>`)}
        ${dado(a.sala ? 'Local' : 'Local / Meet', local)}
        ${dado('Instrutor', a.instrutor ? `${esc(a.instrutor.nome)}${a.instrutor.especialidade ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(a.instrutor.especialidade)}</p>` : ''}` : traco)}
        ${dado('Situação', `${situacaoTexto(a)}${a.reposicao ? '<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Aula de reposição</p>' : a.origem === 'extra' ? '<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Aula extra, fora da agenda</p>' : ''}`)}
        ${dado('Matrícula', `<span class="font-mono">${esc(m.codigoMatricula || '—')}</span>`)}
      </div>`;

    // ----- Corpo: conteúdo, materiais do curso, materiais da aula -----
    const temAgendamento = Turmas.temAgendamento(a.turma);
    const conteudoHtml = (() => {
      if (!a.modulos.length && !a.conteudo) {
        return `<p class="text-sm text-slate-500 dark:text-neutral-400">${temAgendamento
          ? 'A secretaria ainda não distribuiu o conteúdo desta aula.'
          : 'Data prevista pela agenda da turma; o conteúdo de cada aula aparece quando a secretaria confirmar o agendamento.'}</p>
          ${m.curso?.modulos?.length ? `<p class="text-sm text-slate-500 dark:text-neutral-400 mt-2">Veja o programa completo em <a href="curso.html?turma=${encodeURIComponent(a.turma.id)}&aba=conteudo" class="link">Conteúdo do curso</a>.</p>` : ''}`;
      }
      return `${a.conteudo ? `<p class="text-sm text-slate-800 dark:text-neutral-100">${esc(a.conteudo)}</p>` : ''}
        ${a.modulos.length ? `<div class="${a.conteudo ? 'mt-4 ' : ''}divide-y divide-slate-100 dark:divide-neutral-900">${a.modulos.map((mod) => {
          const pos = (m.curso?.modulos ?? []).findIndex((x) => x.id === mod.id) + 1;
          return `<div class="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
            <div class="shrink-0 h-7 w-7 rounded-full grid place-items-center text-xs font-semibold bg-petrol-800/10 dark:bg-petrol-700/40 text-petrol-800 dark:text-sky-300">${pos || '·'}</div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center justify-between gap-2"><p class="font-medium text-slate-900 dark:text-neutral-100">${esc(mod.titulo)}</p>${mod.cargaHoraria ? `<p class="text-xs text-slate-500 dark:text-neutral-400 tabular-nums">${esc(String(mod.cargaHoraria).replace('.', ','))} h no programa</p>` : ''}</div>
              ${(mod.topicos ?? []).length ? `<ol class="mt-1.5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0.5 text-sm text-slate-600 dark:text-neutral-300 list-decimal list-inside">${mod.topicos.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}
            </div>
          </div>`;
        }).join('')}</div>` : ''}
        ${a.observacoes ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-3">${esc(a.observacoes)}</p>` : ''}`;
    })();

    // Materiais desta aula (js/materiais-motor.js): só os liberados abrem; antes disso a aula fica bloqueada.
    const daAula = typeof Materiais !== 'undefined' && a.id != null ? Materiais.daAula(a.turma.id, a.id).filter((x) => Materiais.liberado(x, hoje)) : [];
    const daAulaHtml = daAula.length
      ? `<div class="divide-y divide-slate-100 dark:divide-neutral-900">${daAula.map((mt) => `
          <div class="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
            <div class="min-w-0 flex-1"><p class="text-sm font-medium text-slate-900 dark:text-neutral-100 truncate">${esc(mt.titulo)}</p>${mt.descricao ? `<p class="text-xs text-slate-500 dark:text-neutral-400">${esc(mt.descricao)}</p>` : ''}</div>
            ${mt.tipo === 'link' ? `<a href="${esc(mt.url)}" target="_blank" rel="noopener" class="link shrink-0">Abrir</a>` : `<button type="button" data-acao="baixar-material" data-nome="${esc(mt.arquivo || mt.titulo)}" class="link shrink-0">Baixar</button>`}
          </div>`).join('')}</div>`
      : `<p class="text-sm text-slate-500 dark:text-neutral-400">${cancelada ? 'Aula cancelada.' : 'O professor ainda não liberou materiais para esta aula.'}</p>`;

    const todosMateriais = (m.curso?.materiais ?? []).filter((x) => !Cursos.materialPendente(x));
    const idsModulos = new Set(a.modulos.map((x) => x.id));
    const relacionados = todosMateriais.filter((x) => x.moduloId && idsModulos.has(x.moduloId));
    const materiaisLista = relacionados.length ? relacionados : todosMateriais;
    const iconeMaterial = { video: 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z', arquivo: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', link: 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244' };
    const tamanho = (b) => (b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1).replace('.', ',')} MB` : `${Math.round(b / 1000)} KB`);
    const materiaisHtml = materiaisLista.length
      ? `<div class="divide-y divide-slate-100 dark:divide-neutral-900">${materiaisLista.map((mt) => {
          const mod = mt.moduloId ? (m.curso?.modulos ?? []).find((x) => x.id === mt.moduloId) : null;
          const sub = [TIPO_MATERIAL[mt.tipo], mt.arquivo ? tamanho(mt.arquivo.tamanho) : '', mt.duracaoMin ? Turmas.duracaoTexto(mt.duracaoMin) : '', mod ? mod.titulo : ''].filter(Boolean).join(' · ');
          return `<div class="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
            <div class="shrink-0 h-9 w-9 rounded-lg bg-petrol-800/10 dark:bg-petrol-700/40 text-petrol-800 dark:text-sky-300 grid place-items-center"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="${iconeMaterial[mt.tipo] ?? iconeMaterial.link}" /></svg></div>
            <div class="min-w-0 flex-1"><p class="text-sm font-medium text-slate-900 dark:text-neutral-100 truncate">${esc(mt.nome)}</p><p class="text-xs text-slate-500 dark:text-neutral-400">${esc(sub)}</p></div>
            ${mt.url ? `<a href="${esc(mt.url)}" target="_blank" rel="noopener" class="link shrink-0">Abrir</a>` : `<button type="button" data-acao="baixar-material" data-nome="${esc(mt.nome)}" class="link shrink-0">Baixar</button>`}
          </div>`;
        }).join('')}</div>`
      : '<p class="text-sm text-slate-500 dark:text-neutral-400">Nenhum material publicado para este curso ainda.</p>';
    const notaMateriais = relacionados.length
      ? `${plural(relacionados.length, 'material do módulo', 'materiais dos módulos')} desta aula.`
      : todosMateriais.length ? 'Os materiais não são separados por aula; estes são os do curso inteiro.' : '';

    const secao = (titulo, corpo, rodape = '') => `<section class="cartao p-5"><h3 class="titulo-secao mb-3">${titulo}</h3>${corpo}${rodape ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-3">${rodape}</p>` : ''}</section>`;
    $('corpo-aula').innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="lg:col-span-2 space-y-5">
          ${secao(`Conteúdo da aula${a.modulos.length ? ` <span class="text-xs font-sans font-normal text-slate-400 tabular-nums ml-1">${plural(a.modulos.length, 'módulo', 'módulos')}</span>` : ''}`, conteudoHtml)}
          ${secao(`Materiais <span class="text-xs font-sans font-normal text-slate-400 tabular-nums ml-1">${materiaisLista.length}</span>`, materiaisHtml, `${notaMateriais}${notaMateriais ? ' ' : ''}<a href="materiais.html" class="link !text-xs">Todos os materiais</a>`)}
        </div>
        <div class="space-y-5">
          ${secao(`Materiais da aula <span class="text-xs font-sans font-normal text-slate-400 tabular-nums ml-1">${daAula.length}</span>`, daAulaHtml)}
          ${secao('Nesta turma', `
            <div class="space-y-3 text-sm">
              ${anterior ? `<a href="${urlAula(anterior)}" class="block rounded-lg border border-slate-200 dark:border-neutral-800 px-3 py-2 hover:bg-slate-50 dark:hover:bg-neutral-900 transition"><p class="rotulo">Aula anterior</p><p class="text-slate-800 dark:text-neutral-100 mt-0.5">${data(anterior.data)} <span class="text-xs text-slate-500 dark:text-neutral-400">${esc(diaCurto(anterior.data))} · ${esc(anterior.inicio)}–${esc(anterior.fim)}</span></p>${anterior.conteudo || anterior.modulos.length ? `<p class="text-xs text-slate-500 dark:text-neutral-400 truncate">${esc(anterior.conteudo || anterior.modulos.map((x) => x.titulo).join(' · '))}</p>` : ''}</a>` : '<p class="text-xs text-slate-500 dark:text-neutral-400">Esta é a primeira aula da turma.</p>'}
              ${proxima ? `<a href="${urlAula(proxima)}" class="block rounded-lg border border-slate-200 dark:border-neutral-800 px-3 py-2 hover:bg-slate-50 dark:hover:bg-neutral-900 transition"><p class="rotulo">Próxima aula</p><p class="text-slate-800 dark:text-neutral-100 mt-0.5">${esc(PortalAluno.rotuloDia(proxima.data, hoje) === 'Hoje' || PortalAluno.rotuloDia(proxima.data, hoje) === 'Amanhã' ? PortalAluno.rotuloDia(proxima.data, hoje) : PortalAluno.fmtData(proxima.data))} <span class="text-xs text-slate-500 dark:text-neutral-400">${esc(diaCurto(proxima.data))} · ${esc(proxima.inicio)}–${esc(proxima.fim)}</span></p>${proxima.conteudo || proxima.modulos.length ? `<p class="text-xs text-slate-500 dark:text-neutral-400 truncate">${esc(proxima.conteudo || proxima.modulos.map((x) => x.titulo).join(' · '))}</p>` : ''}</a>` : '<p class="text-xs text-slate-500 dark:text-neutral-400">Esta é a última aula da turma.</p>'}
              <p class="text-xs text-slate-500 dark:text-neutral-400"><a href="curso.html?turma=${encodeURIComponent(a.turma.id)}&aba=aulas" class="link !text-xs">Todas as aulas do curso</a> · <a href="aulas.html?aba=todas" class="link !text-xs">Minhas aulas</a></p>
            </div>`)}
        </div>
      </div>`;

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-acao="baixar-material"]');
      if (btn) toast(`"${btn.dataset.nome}": o download do arquivo fica para a integração com o armazenamento.`);
    });
  }

  // ---------- Render ----------

  if (MODO === 'detalhe') renderDetalhe();
  else renderLista();
})();
