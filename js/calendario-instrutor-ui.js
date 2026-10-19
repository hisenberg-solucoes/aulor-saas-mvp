// ============================================================
// Calendário mensal de UM instrutor (aulas das turmas dele + eventos que
// alcançam essas turmas). Componente de UI compartilhado entre o Portal do
// Professor (portal-professor/calendario.html) e a aba Calendário da tela
// administrativa do instrutor (instrutor.html?aba=calendario).
//
// Espelho da grade do calendário do aluno (portal-aluno/js/calendario-app.js).
// Só leitura: nada grava. O que muda entre as duas telas vem por opções:
// links (aula/turma), atalho na célula de hoje e ações do modal.
//
// Uso:
//   CalendarioInstrutor.montar(container, {
//     hoje, turmas,        // linhas de PortalProfessor.turmas (turma, curso, formacao, sala, aulas, alunos, gravacoes)
//     eventos,             // Eventos.paraTurmas(Eventos.carregar(), turmas)
//     inscricoes, salas,   // opcionais (contagem de inscritos; nome da sala da aula)
//     mes: 'YYYY-MM', turmaId,               // estado inicial (opcionais)
//     linkTurma: (t) => url,
//     linkAula: (t, a) => url | null,        // "Ver aula" (null = sem link)
//     atalhoHoje: (t, a) => html | '',       // botão abaixo do chip na célula de hoje
//     acoesAula: (t, a, ctx) => [html],      // botões/links do modal (ctx: realizada, hojeMesmo, meet, gravacoes)
//     fmtDataLonga, fmtData,                 // formatadores (default: pt-BR)
//     modalRoot,                             // elemento onde o modal do dia é montado (default: cria dentro do container)
//   });
// Depende de: Eventos (gradeDoMes/porDia/proximos/tipoDe/…), Turmas.horasAula/duracaoTexto,
// TIPOS_EVENTO; Feriados, Presencas e Diario são opcionais.
// ============================================================

const CalendarioInstrutor = (() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const DIAS_CURTOS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
  const MAX_ITENS_CELULA = 3;
  const FORMATO = { presencial: 'Presencial', online: 'Online ao vivo', hibrido: 'Híbrido', ead: 'EAD' };
  const plural = (n, um, varios = `${um}s`) => `${n} ${n === 1 ? um : varios}`;
  const horasTexto = (h) => (Number.isInteger(h) ? `${h} h` : `${String(h.toFixed(1)).replace('.', ',')} h`);
  const ponto = (cor, texto) => `<span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-full ${cor} shrink-0"></span>${esc(texto)}</span>`;
  const fmtDataPadrao = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR');
  const fmtDataLongaPadrao = (iso) => { const d = new Date(`${iso}T12:00:00`); return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()].slice(0, 3)}`; };

  // Classes locais (o componente não depende das classes utilitárias de cada página).
  const CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm';
  const SELECT = 'rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-1.5 text-sm text-slate-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-petrol-800/40';
  const ROTULO = 'text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400';
  const LINK = 'text-sm font-medium text-petrol-800 dark:text-sky-300 hover:underline';
  const BOTAO_NAV = 'p-2 rounded-lg text-slate-500 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/40';
  const ICONE_CAMERA = '<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>';
  const BOTAO_PRI = 'inline-flex items-center gap-1.5 rounded-lg bg-petrol-800 dark:bg-areia hover:bg-petrol-900 dark:hover:bg-white dark:text-petrol-800 text-white text-sm font-medium px-3 py-1.5 transition';
  const BOTAO_SEC = 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-900 transition';
  const BOTAO_LARANJA = 'inline-flex items-center gap-1.5 rounded-lg bg-laranja hover:bg-laranja-escuro text-white text-sm font-medium px-3 py-1.5 transition';

  // Presencial: sala. Online: Google Meet. Híbrido: sala e Meet (mesma regra da home do professor).
  const meetDe = (t) => (t.turma.meetLink && (t.turma.formato === 'online' || t.turma.formato === 'hibrido') ? t.turma.meetLink : null);

  function montar(container, op) {
    const hoje = op.hoje;
    const ts = op.turmas ?? [];
    const eventos = op.eventos ?? [];
    const inscricoes = op.inscricoes ?? [];
    const salas = op.salas ?? [];
    const fmtData = op.fmtData ?? fmtDataPadrao;
    const fmtDataLonga = op.fmtDataLonga ?? fmtDataLongaPadrao;
    const linkTurma = op.linkTurma ?? (() => null);
    const linkAula = op.linkAula ?? (() => null);
    const atalhoHoje = op.atalhoHoje ?? (() => '');
    const acoesAula = op.acoesAula ?? null;
    const temPresencas = typeof Presencas !== 'undefined';
    const temDiario = typeof Diario !== 'undefined';

    const mesInicial = /^\d{4}-\d{2}$/.test(op.mes ?? '') ? op.mes : hoje.slice(0, 7);
    const estado = { ano: Number(mesInicial.slice(0, 4)), mes: Number(mesInicial.slice(5, 7)), filtro: 'tudo', turmaId: ts.some((t) => t.turma.id === op.turmaId) ? op.turmaId : '' };

    // Aulas do instrutor (Turmas.aulas já tira as canceladas), com a linha da turma anexada.
    const aulas = [];
    ts.forEach((t) => t.aulas.forEach((a) => aulas.push({ ...a, turma: t })));
    const salaDe = (a, t) => (a.salaId ? salas.find((s) => s.id === a.salaId)?.nome : null) ?? t.sala?.nome ?? '';
    const turmaBate = (turmaId, ev) => !turmaId || ev.publico.tipo === 'todos' || ev.turmas.some((t) => t.turma.id === turmaId);

    function aulasDoDia(iso) {
      if (estado.filtro === 'eventos') return [];
      return aulas.filter((a) => a.data === iso && (!estado.turmaId || a.turma.turma.id === estado.turmaId)).sort((a, b) => a.inicio.localeCompare(b.inicio));
    }
    function eventosDoDia(iso) {
      if (estado.filtro === 'aulas') return [];
      return Eventos.porDia(eventos, iso).filter((e) => turmaBate(estado.turmaId, e));
    }

    // ---------- Esqueleto ----------

    container.innerHTML = `
      <div class="space-y-6">
        <div class="${CARTAO} px-4 py-3 flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-1">
            <button type="button" data-cal-anterior title="Mês anterior" class="${BOTAO_NAV}">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            <h3 data-cal-titulo class="font-display font-semibold text-lg text-slate-900 dark:text-neutral-100 w-44 text-center capitalize tabular-nums"></h3>
            <button type="button" data-cal-seguinte title="Mês seguinte" class="${BOTAO_NAV}">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
            <button type="button" data-cal-hoje class="ml-1 rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-900 transition">Hoje</button>
          </div>
          <div class="ml-auto flex flex-wrap items-center gap-2">
            <select data-cal-filtro-tipo class="${SELECT}" title="Mostrar">
              <option value="tudo">Tudo</option>
              <option value="aulas">Só aulas</option>
              <option value="eventos">Só eventos</option>
            </select>
            <select data-cal-filtro-turma class="${SELECT} max-w-xs" title="Turma">
              <option value="">Todas as turmas</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_20rem] gap-6">
          <section class="${CARTAO} overflow-hidden min-w-0">
            <div data-cal-cabecalho class="grid grid-cols-7 border-b border-slate-200 dark:border-neutral-800 text-center ${ROTULO}"></div>
            <div data-cal-grade class="grid grid-cols-7"></div>
            <div data-cal-legenda class="px-4 py-2.5 border-t border-slate-200 dark:border-neutral-800 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-neutral-400"></div>
          </section>
          <section class="min-w-0">
            <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100 mb-3">Próximos eventos</h3>
            <div data-cal-proximos class="${CARTAO} divide-y divide-slate-100 dark:divide-neutral-900"></div>
          </section>
        </div>
      </div>`;
    const q = (sel) => container.querySelector(sel);
    const modalRoot = op.modalRoot ?? (() => { const d = document.createElement('div'); container.appendChild(d); return d; })();

    // ---------- Filtros ----------

    const selTurma = q('[data-cal-filtro-turma]');
    [...ts].sort((a, b) => a.turma.inicio.localeCompare(b.turma.inicio)).forEach((t) => {
      const o = document.createElement('option');
      o.value = t.turma.id;
      o.textContent = `${t.curso?.nome ?? t.turma.codigo} (${t.turma.codigo})`;
      selTurma.appendChild(o);
    });
    selTurma.value = estado.turmaId;
    selTurma.addEventListener('change', () => { estado.turmaId = selTurma.value; render(); });
    q('[data-cal-filtro-tipo]').addEventListener('change', (e) => { estado.filtro = e.target.value; render(); });
    q('[data-cal-anterior]').addEventListener('click', () => { estado.mes -= 1; if (estado.mes < 1) { estado.mes = 12; estado.ano -= 1; } render(); });
    q('[data-cal-seguinte]').addEventListener('click', () => { estado.mes += 1; if (estado.mes > 12) { estado.mes = 1; estado.ano += 1; } render(); });
    q('[data-cal-hoje]').addEventListener('click', () => { estado.ano = Number(hoje.slice(0, 4)); estado.mes = Number(hoje.slice(5, 7)); render(); });
    q('[data-cal-cabecalho]').innerHTML = DIAS_CURTOS.map((d) => `<span class="py-2">${d}</span>`).join('');

    // ---------- Grade ----------

    const chipAula = (a) => `
      <button type="button" data-dia="${a.data}" title="${esc(`${a.inicio}–${a.fim} · ${a.turma.curso?.nome ?? a.turma.turma.codigo}`)}"
        class="w-full flex items-center gap-1 rounded px-1.5 py-0.5 text-left text-[11px] leading-tight bg-petrol-800/10 text-petrol-900 dark:bg-sky-500/20 dark:text-sky-200 hover:bg-petrol-800/20 dark:hover:bg-sky-500/30 transition">
        <span class="tabular-nums shrink-0">${esc(a.inicio)}</span><span class="font-mono font-medium truncate">${esc(a.turma.turma.codigo.split(' ')[0])}</span>
      </button>${a.data === hoje ? (atalhoHoje(a.turma, a) || '') : ''}`;
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
      let totalAulas = 0; let totalEventos = 0; let horas = 0;
      const grade = q('[data-cal-grade]');
      grade.innerHTML = semanas.flat().map((d, i) => {
        const as = aulasDoDia(d.iso);
        const es = eventosDoDia(d.iso);
        if (d.doMes) { totalAulas += as.length; totalEventos += es.length; horas += as.reduce((s, a) => s + Turmas.horasAula(a), 0); }
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
            ${visiveis.map((x) => x.html).join('')}
            ${extra ? `<button type="button" data-dia="${d.iso}" class="text-left text-[11px] font-medium text-slate-500 dark:text-neutral-400 hover:text-petrol-800 dark:hover:text-sky-300 px-1.5">+${extra} ${extra === 1 ? 'item' : 'itens'}</button>` : ''}
          </div>`;
      }).join('');
      grade.querySelectorAll('[data-celula]').forEach((c) => c.addEventListener('click', () => abrirDia(c.dataset.celula)));
      grade.querySelectorAll('[data-acao]').forEach((a) => a.addEventListener('click', (e) => e.stopPropagation()));

      const resumo = [];
      if (estado.filtro !== 'eventos') resumo.push(`${plural(totalAulas, 'aula')}${totalAulas ? ` (${horasTexto(horas)})` : ''}`);
      if (estado.filtro !== 'aulas') resumo.push(plural(totalEventos, 'evento'));
      const tiposUsados = TIPOS_EVENTO.filter((t) => eventos.some((e) => e.tipo === t.id));
      q('[data-cal-legenda]').innerHTML = `
        <span class="tabular-nums text-slate-600 dark:text-neutral-300">${resumo.join(' · ')} em ${MESES[estado.mes - 1]}</span>
        <span class="ml-auto inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-petrol-800 dark:bg-sky-400"></span>Aula</span>
        ${tiposUsados.map((t) => `<span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm ${t.ponto}"></span>${esc(t.nome)}</span>`).join('')}
        <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm border border-dashed border-slate-400"></span>A confirmar</span>`;
    }

    // ---------- Próximos eventos ----------

    // Sem inscrição para quem olha: o estado mostra participação obrigatória / quantos alunos já se inscreveram.
    function estadoEvento(e) {
      const partes = [];
      if (e.obrigatorio) partes.push('Presença obrigatória');
      if (e.inscricao.necessaria) {
        const n = Eventos.inscritos(inscricoes, e.id).length;
        partes.push(`${plural(n, 'inscrito')}${e.inscricao.vagas ? ` de ${e.inscricao.vagas} vagas` : ''}`);
      } else if (!e.obrigatorio) partes.push('Sem inscrição');
      return { texto: partes.join(' · '), classe: e.obrigatorio ? 'text-laranja-escuro dark:text-laranja' : 'text-slate-500 dark:text-neutral-400' };
    }

    function renderProximos() {
      const lista = Eventos.proximos(eventos, hoje).filter((e) => turmaBate(estado.turmaId, e));
      const el = q('[data-cal-proximos]');
      if (!lista.length) {
        el.innerHTML = `<div class="p-6 text-center text-sm text-slate-500 dark:text-neutral-400">Nenhum evento previsto para as turmas.</div>`;
        return;
      }
      el.innerHTML = lista.map((e) => {
        const t = Eventos.tipoDe(e.tipo);
        const d = new Date(`${e.data}T12:00:00`);
        const st = estadoEvento(e);
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
      el.querySelectorAll('[data-dia]').forEach((b) => b.addEventListener('click', () => abrirDia(b.dataset.dia)));
    }

    // ---------- Modal do dia ----------

    function fecharModal() { modalRoot.innerHTML = ''; }
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalRoot.isConnected && modalRoot.firstChild) fecharModal(); });

    // Situação da aula: futura / hoje / realizada, e o que já foi feito nela (chamada, diário).
    function situacaoAulaHtml(a, t) {
      if (a.data > hoje) return ponto('bg-sky-500', 'Prevista');
      const base = a.data === hoje ? ponto('bg-laranja', 'Hoje') : ponto('bg-emerald-500', 'Realizada');
      const chamada = temPresencas ? Presencas.porAula(t.turma.id, a) : [];
      const diario = temDiario ? Diario.porAula(t.turma.id, a.data) : null;
      const pend = a.data === hoje ? 'bg-laranja' : 'bg-red-500';
      const linhas = [];
      if (temPresencas) linhas.push(chamada.length ? ponto('bg-emerald-500', `Chamada feita (${plural(chamada.filter((r) => Presencas.conta(r.status)).length, 'presente')})`) : ponto(pend, 'Chamada não feita'));
      if (temDiario) linhas.push(diario ? ponto('bg-emerald-500', 'Diário preenchido') : ponto(pend, 'Diário pendente'));
      return `${base}${linhas.map((l) => `<p class="text-xs mt-0.5">${l}</p>`).join('')}`;
    }

    // Ações padrão do modal: Meet (futura/hoje), gravação (realizada), Ver aula, Ver turma.
    function acoesPadrao(t, a, ctx) {
      const acoes = [];
      if (ctx.meet && !ctx.realizada) acoes.push(`<a href="${esc(ctx.meet)}" target="_blank" rel="noopener" class="${BOTAO_PRI}">${ICONE_CAMERA}Abrir o Meet</a>`);
      if (ctx.realizada && ctx.gravacoes.length) acoes.push(`<a href="${esc(ctx.gravacoes[0].url)}" target="_blank" rel="noopener" class="${BOTAO_SEC}">${ICONE_CAMERA}Assistir gravação</a>`);
      const la = linkAula(t, a);
      if (la) acoes.push(`<a href="${esc(la)}" class="${LINK}">Ver aula</a>`);
      const lt = linkTurma(t);
      if (lt) acoes.push(`<a href="${esc(lt)}" class="${LINK}">Ver turma</a>`);
      return acoes;
    }

    function linhaAula(a) {
      const t = a.turma;
      const meet = meetDe(t);
      const sala = salaDe(a, t);
      const formato = FORMATO[t.turma.formato] ?? t.turma.formato ?? '';
      const local = [sala, meet ? 'Google Meet' : ''].filter(Boolean).join(' · ') || 'Sala a definir';
      const total = t.aulas.length;
      const n = a.n ?? (t.aulas.findIndex((x) => x.data === a.data && x.inicio === a.inicio) + 1);
      const modulos = (a.moduloIds ?? []).map((id) => (t.curso?.modulos ?? []).find((mod) => mod.id === id)).filter(Boolean);
      const gravacoes = (t.gravacoes ?? []).filter((g) => g.data === a.data);
      const realizada = a.data < hoje;
      const hojeMesmo = a.data === hoje;
      const celula = (rotulo, valor, cls = '') => `<div class="${cls}"><p class="${ROTULO}">${rotulo}</p><div class="text-sm text-slate-800 dark:text-neutral-100 mt-0.5">${valor}</div></div>`;
      const conteudo = a.conteudo || modulos.length
        ? `${a.conteudo ? esc(a.conteudo) : esc(modulos.map((x) => x.titulo).join(' · '))}${a.conteudo && modulos.length ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(modulos.map((x) => x.titulo).join(' · '))}</p>` : ''}`
        : '<span class="text-slate-400">a definir</span>';
      const gravacaoHtml = gravacoes.length
        ? gravacoes.map((g) => `<a href="${esc(g.url)}" target="_blank" rel="noopener" class="${LINK} inline-flex items-center gap-1">${ICONE_CAMERA}${esc(g.titulo || 'Gravação')}${g.duracaoMin ? ` <span class="text-xs font-normal text-slate-400">· ${esc(Turmas.duracaoTexto(g.duracaoMin))}</span>` : ''}</a>`).join('<br>')
        : realizada ? '<span class="text-slate-400">sem gravação registrada</span>' : '<span class="text-slate-400">disponível após a aula</span>';
      const alunos = (t.alunos ?? []).length ? plural(t.alunos.length, 'aluno matriculado', 'alunos matriculados') : '<span class="text-slate-400">nenhum aluno matriculado</span>';
      const ctx = { realizada, hojeMesmo, meet, gravacoes };
      const acoes = acoesAula ? acoesAula(t, a, { ...ctx, padrao: () => acoesPadrao(t, a, ctx) }) : acoesPadrao(t, a, ctx);
      return `
        <div class="flex gap-3 px-5 py-4">
          <div class="shrink-0 w-1 rounded-full bg-petrol-800 dark:bg-sky-400"></div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-slate-900 dark:text-neutral-100">${esc(t.curso?.nome ?? t.turma.codigo)} <span class="font-mono text-xs text-slate-400 ml-1">${esc(t.turma.codigo)}</span></p>
            <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${n ? `Aula ${n} de ${total}` : `${total} aulas`}${t.formacao ? ` · ${esc(t.formacao.nome)}` : ''}</p>
            <div class="grid grid-cols-2 gap-x-6 gap-y-3 mt-3">
              ${celula('Horário', `<span class="tabular-nums">${esc(a.inicio)}–${esc(a.fim)}</span> <span class="text-xs text-slate-500 dark:text-neutral-400">· ${esc(horasTexto(Turmas.horasAula(a)))}</span>`)}
              ${celula('Local', `${esc(local)}${formato ? ` <span class="text-xs text-slate-500 dark:text-neutral-400">(${esc(formato)})</span>` : ''}`)}
              ${celula('Alunos', alunos)}
              ${celula('Situação', situacaoAulaHtml(a, t))}
              ${celula('Conteúdo', conteudo, 'col-span-2')}
              ${celula('Gravação', gravacaoHtml, 'col-span-2')}
            </div>
            ${acoes.length ? `<div class="mt-3 flex flex-wrap items-center gap-3">${acoes.join('')}</div>` : ''}
          </div>
        </div>`;
    }

    function linhaEvento(e) {
      const t = Eventos.tipoDe(e.tipo);
      const insc = e.inscricao;
      const inscritos = insc.necessaria ? Eventos.inscritos(inscricoes, e.id).length : null;
      const detalhes = [
        ['Horário', Eventos.horarioTexto(e)],
        ['Local', e.local?.nome ? `${esc(e.local.nome)}${e.local.endereco ? `<br><span class="text-slate-500 dark:text-neutral-400">${esc(e.local.endereco)}</span>` : ''}` : ''],
        ['Custo', e.custo ? Eventos.fmtMoeda(e.custo) : 'Gratuito'],
        ['Participação', e.obrigatorio ? 'Obrigatória' : 'Opcional'],
        insc.necessaria ? ['Inscrições', `${plural(inscritos, 'aluno inscrito', 'alunos inscritos')}${insc.vagas ? ` de ${insc.vagas} vagas` : ''}${insc.prazo ? ` · até ${Eventos.fmtData(insc.prazo)}` : ''}`] : null,
        ['Público', e.publico.tipo === 'todos' ? 'Todos os alunos' : e.publico.tipo === 'turmas' ? [...new Set(e.turmas.map((x) => esc(x.turma.codigo)))].join(', ') : [...new Set(e.turmas.map((x) => esc(x.formacao?.nome ?? x.turma.formacaoId)))].join(', ')],
        e.restricao ? ['Restrição', Eventos.restricaoTexto(e)] : null,
      ].filter((x) => x && x[1]);
      return `
        <div class="flex gap-3 px-5 py-3">
          <div class="shrink-0 w-1 rounded-full ${t.ponto}"></div>
          <div class="min-w-0 flex-1">
            <p class="text-[11px] text-slate-500 dark:text-neutral-400">${esc(t.nome)}${e.status === 'previsto' ? ' · <span class="text-amber-600 dark:text-amber-400">a confirmar</span>' : ''}</p>
            <p class="text-sm font-medium text-slate-900 dark:text-neutral-100">${esc(e.titulo)}</p>
            ${e.descricao ? `<p class="text-sm text-slate-600 dark:text-neutral-300 mt-1">${esc(e.descricao)}</p>` : ''}
            <dl class="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              ${detalhes.map(([k, v]) => `<dt class="text-slate-500 dark:text-neutral-400">${k}</dt><dd class="text-slate-700 dark:text-neutral-200">${v}</dd>`).join('')}
            </dl>
          </div>
        </div>`;
    }

    function abrirDia(iso) {
      const as = aulasDoDia(iso);
      const es = eventosDoDia(iso);
      const feriado = typeof Feriados !== 'undefined' ? Feriados.nome(iso) : null;
      const titulo = fmtDataLonga(iso).replace(/^./, (c) => c.toUpperCase());
      const vazio = !as.length && !es.length;
      modalRoot.innerHTML = `
        <div class="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4" data-fundo>
          <div role="dialog" aria-modal="true" aria-labelledby="cal-modal-titulo" class="${CARTAO} modal-anim w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100 dark:border-neutral-900 flex items-start justify-between gap-3">
              <div>
                <p id="cal-modal-titulo" class="font-display font-semibold text-slate-900 dark:text-neutral-100">${esc(titulo)}${iso === hoje ? ' <span class="text-laranja text-sm">· hoje</span>' : ''}</p>
                <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(fmtData(iso))}${feriado ? ` · ${esc(feriado)}` : ''}</p>
              </div>
              <button type="button" data-fechar title="Fechar" class="p-1.5 -mr-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-900 transition">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div class="overflow-y-auto">
              ${vazio ? `<p class="px-5 py-8 text-center text-sm text-slate-500 dark:text-neutral-400">Nada agendado neste dia.</p>` : ''}
              ${as.length ? `<p class="${ROTULO} px-5 pt-4 pb-1">Aulas</p><div class="divide-y divide-slate-100 dark:divide-neutral-900">${as.map(linhaAula).join('')}</div>` : ''}
              ${es.length ? `<p class="${ROTULO} px-5 pt-4 pb-1">Eventos</p><div class="divide-y divide-slate-100 dark:divide-neutral-900">${es.map(linhaEvento).join('')}</div>` : ''}
            </div>
          </div>
        </div>`;
      modalRoot.querySelector('[data-fechar]').addEventListener('click', fecharModal);
      modalRoot.querySelector('[data-fundo]').addEventListener('click', (e) => { if (e.target === e.currentTarget) fecharModal(); });
    }

    // ---------- Render ----------

    function render() {
      q('[data-cal-titulo]').textContent = `${MESES[estado.mes - 1]} ${estado.ano}`;
      renderGrade();
      renderProximos();
    }
    render();
    return { render, abrirDia, estado };
  }

  return { montar, BOTAO_PRI, BOTAO_SEC, BOTAO_LARANJA, LINK };
})();
