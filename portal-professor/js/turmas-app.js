// Portal do Professor — Minhas turmas (UI). Turmas, aulas e matrículas vêm do administrativo; aqui o professor
// cadastra os materiais das aulas (js/materiais-motor.js) e mexe nos requisitos da turma.
// Lista (turmas.html) + detalhe em página separada (turma.html?id=<turmaId>&aba=), MODO lido de <body data-modo>.
// Consultas extras ficam aqui (o motor portal-professor-motor.js não muda).
(() => {
  const instrutor = PortalProfessor.instrutorLogado();
  if (!instrutor) { PortalProfessor.sair(); location.replace('login.html'); return; }

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hoje = PortalProfessor.hoje();
  const data = (iso) => esc(PortalProfessor.fmtData(String(iso ?? '').slice(0, 10)));
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
  // Busca sem acento/caixa (mesmo helper das outras telas do portal) — usado no filtro do catálogo de softwares.
  const normalizar = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const SITUACAO = {
    em_andamento: { nome: 'Em andamento', ponto: 'bg-emerald-500' },
    confirmada: { nome: 'Confirmada', ponto: 'bg-sky-500' },
    planejada: { nome: 'Planejada', ponto: 'bg-slate-400' },
    concluida: { nome: 'Concluída', ponto: 'bg-slate-400' },
    cancelada: { nome: 'Cancelada', ponto: 'bg-red-500' },
  };
  const FORMATO = { presencial: 'Presencial', online: 'Online ao vivo', hibrido: 'Híbrido', ead: 'EAD' };
  const AULA = {
    realizada: { nome: 'Realizada', ponto: 'bg-slate-400' },
    hoje: { nome: 'Hoje', ponto: 'bg-petrol-800 dark:bg-sky-300' },
    futura: { nome: 'Futura', ponto: 'bg-sky-500' },
    cancelada: { nome: 'Cancelada', ponto: 'bg-red-500' },
  };
  const MATRICULA = {
    matriculado: { nome: 'Matriculado', ponto: 'bg-emerald-500' },
    congelada: { nome: 'Congelada', ponto: 'bg-violet-500' },
    concluido: { nome: 'Concluído', ponto: 'bg-slate-400' },
    desistiu: { nome: 'Desistiu', ponto: 'bg-amber-500' },
    cancelada: { nome: 'Cancelada', ponto: 'bg-red-500' },
  };

  const ponto = (cor, texto) => `<span class="inline-flex items-center gap-1.5 whitespace-nowrap"><span class="h-2 w-2 rounded-full ${cor} shrink-0"></span>${esc(texto)}</span>`;
  const situacaoTurma = (id) => { const s = SITUACAO[id] ?? SITUACAO.planejada; return ponto(s.ponto, s.nome); };
  const barra = (pct, concluido = false) => `<div class="barra-progresso"><div class="h-full rounded-full ${concluido ? 'bg-slate-400 dark:bg-neutral-600' : 'bg-petrol-800 dark:bg-sky-400'}" style="width:${Math.max(0, Math.min(100, pct))}%"></div></div>`;
  const vazio = (msg) => `<div class="cartao p-8 text-center text-sm text-slate-500 dark:text-neutral-400">${msg}</div>`;
  const meetOnline = (t) => Boolean(t.turma.meetLink && (t.turma.formato === 'online' || t.turma.formato === 'hibrido'));
  const linkTurma = (t) => `turma.html?id=${encodeURIComponent(t.turma.id)}`;
  // Motivo do cancelamento da aula: { tipo, texto } (ou string antiga).
  const motivoTexto = (m) => (m && typeof m === 'object' ? [typeof Aulas !== 'undefined' && Aulas.motivoDe ? Aulas.motivoDe(m.tipo) : m.tipo, m.texto].filter(Boolean).join(': ') : String(m ?? ''));

  const salas = typeof Salas !== 'undefined' ? Salas.carregar() : [];
  const localDe = (a, t) => {
    if (a?.salaId) return Salas.porId(salas, a.salaId)?.nome ?? t.sala?.nome ?? '';
    if (t.sala) return t.sala.nome;
    if (t.turma.meetLink) return 'Google Meet';
    return FORMATO[t.turma.formato] ?? '';
  };

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast-anim pointer-events-auto rounded-lg bg-slate-900 dark:bg-neutral-800 text-white text-sm px-4 py-2 shadow-lg';
    el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  // ---------- Modal centralizado (requisitos) ----------

  function abrirModal(html, largura = 'max-w-lg') {
    const caixa = $('modal-caixa');
    caixa.className = `cartao modal-anim w-full ${largura} max-h-[90vh] overflow-y-auto`;
    caixa.innerHTML = html;
    $('modal').classList.remove('hidden');
    return caixa;
  }
  function fecharModal() { const m = $('modal'); if (!m) return; m.classList.add('hidden'); $('modal-caixa').innerHTML = ''; }
  $('modal')?.addEventListener('click', (e) => { if (e.target === $('modal')) fecharModal(); });
  $('modal-caixa')?.addEventListener('click', (e) => { if (e.target.closest('[data-fechar]')) fecharModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModal(); });

  const cabecalhoModal = (titulo, sub = '') => `
    <div class="px-5 py-4 border-b border-slate-100 dark:border-neutral-900 flex items-start justify-between gap-3">
      <div class="min-w-0"><p class="titulo-secao">${titulo}</p>${sub ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${sub}</p>` : ''}</div>
      <button type="button" data-fechar title="Fechar" class="-mr-1 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-900"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
    </div>`;
  const rodapeModal = (confirmar) => `
    <div class="px-5 py-3 border-t border-slate-100 dark:border-neutral-900 flex justify-end gap-2">
      <button type="button" data-fechar class="botao-sec">Cancelar</button>
      <button type="submit" class="botao-pri">${confirmar}</button>
    </div>`;
  const erroDe = (campo) => `<p id="erro-${campo}" data-erro="${campo}" class="hidden mt-1 text-xs text-red-600 dark:text-red-400"></p>`;
  const ICONE_ERRO = '<svg class="inline h-3.5 w-3.5 -mt-0.5 mr-1" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>';
  function limparErro(root, campo) {
    const p = root.querySelector(`[data-erro="${campo}"]`);
    if (p) { p.classList.add('hidden'); p.textContent = ''; }
    root.querySelectorAll(`[name="${campo}"]`).forEach((el) => { el.classList.remove('campo-erro'); el.removeAttribute('aria-invalid'); });
  }
  function mostrarErros(root, erros) {
    root.querySelectorAll('[data-erro]').forEach((p) => limparErro(root, p.dataset.erro));
    erros.forEach((e) => {
      const p = root.querySelector(`[data-erro="${e.campo}"]`);
      if (p) { p.innerHTML = `${ICONE_ERRO}${esc(e.mensagem)}`; p.classList.remove('hidden'); }
      root.querySelectorAll(`[name="${e.campo}"]`).forEach((el) => { el.classList.add('campo-erro'); el.setAttribute('aria-invalid', 'true'); });
    });
    root.querySelector('.campo-erro')?.focus();
    return erros.length > 0;
  }

  // Caixa "sugerir para o curso": o que o professor mexe vale na turma dele na hora;
  // marcado, o pedido também vai para a coordenação decidir se entra no catálogo do curso.
  const caixaSugerir = (texto, marcado) => `
    <label class="flex items-start gap-2.5 rounded-lg border border-slate-200 dark:border-neutral-800 p-3 cursor-pointer">
      <input type="checkbox" name="sugerir" class="mt-0.5 accent-petrol-800 dark:accent-sky-500" ${marcado ? 'checked' : ''}>
      <span class="text-sm text-slate-700 dark:text-neutral-200">${texto}
        <span class="block text-xs text-slate-500 dark:text-neutral-400 mt-0.5">A coordenação decide. Na sua turma, a mudança vale de qualquer jeito.</span>
      </span>
    </label>`;


  // ---------- Dados / modo ----------

  const params = new URLSearchParams(location.search);
  const turmaId = params.get('id');
  const MODO = document.body.dataset.modo === 'detalhe' ? 'detalhe' : 'lista';
  if (MODO === 'lista' && turmaId) { location.replace(`turma.html?id=${encodeURIComponent(turmaId)}${params.get('aba') ? `&aba=${params.get('aba')}` : ''}`); return; }
  if (MODO === 'detalhe' && !turmaId) { location.replace('turmas.html'); return; }

  const ts = PortalProfessor.turmas(instrutor.id, hoje);
  const grupoDe = (t) => (t.situacao === 'em_andamento' ? 'em_andamento' : t.situacao === 'concluida' ? 'concluida' : 'proximas');

  // ============================================================
  // LISTA
  // ============================================================

  function renderLista() {
    $('tela-lista').classList.remove('hidden');
    $('subtitulo').textContent = `Referência ${PortalProfessor.fmtData(hoje)}`;
    const estado = { busca: '', situacao: '' };

    const andamento = ts.filter((t) => grupoDe(t) === 'em_andamento').length;
    const futuras = ts.filter((t) => grupoDe(t) === 'proximas').length;
    const concluidas = ts.filter((t) => grupoDe(t) === 'concluida').length;
    $('turmas-resumo').textContent = ts.length
      ? [andamento && `${andamento} em andamento`, futuras && `${futuras} ${futuras === 1 ? 'próxima' : 'próximas'}`, concluidas && `${concluidas} ${concluidas === 1 ? 'concluída' : 'concluídas'}`].filter(Boolean).join(' · ')
      : '';

    const normal = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const passa = (t) => {
      if (estado.situacao && grupoDe(t) !== estado.situacao) return false;
      if (!estado.busca) return true;
      const alvo = normal(`${t.turma.codigo} ${t.curso?.nome ?? ''} ${t.curso?.codigo ?? ''} ${t.formacao?.nome ?? 'avulsa'} ${t.formacao?.codigo ?? ''}`);
      return normal(estado.busca).split(/\s+/).filter(Boolean).every((p) => alvo.includes(p));
    };

    function linha(t) {
      const concluida = t.situacao === 'concluida';
      const total = t.aulas.length;
      const feitas = concluida ? total : t.realizadas;
      return `
        <tr class="hover:bg-slate-100/70 dark:hover:bg-neutral-900 cursor-pointer transition" data-href="${linkTurma(t)}" tabindex="0">
          <td class="font-medium text-slate-900 dark:text-neutral-100 whitespace-nowrap"><span class="font-mono">${esc(t.turma.codigo)}</span></td>
          <td>${esc(t.curso?.nome ?? '—')}</td>
          <td class="whitespace-nowrap tabular-nums">${data(t.turma.inicio)} – ${data(t.turma.fim)}</td>
          <td class="whitespace-nowrap">${esc(t.turma.turno || '—')}</td>
          <td class="whitespace-nowrap">${esc(FORMATO[t.turma.formato] ?? t.turma.formato ?? '—')}</td>
          <td class="text-right tabular-nums">${t.alunos.length}<span class="text-slate-400">/${t.turma.vagas ?? '—'}</span></td>
          <td class="min-w-40"><div class="flex items-center gap-2"><div class="flex-1">${barra(total ? (feitas / total) * 100 : 0, concluida)}</div><span class="text-xs tabular-nums text-slate-500 dark:text-neutral-400 shrink-0">${feitas}/${total}</span></div></td>
          <td>${situacaoTurma(t.situacao)}</td>
        </tr>`;
    }

    // Agrupa por formação (ordem alfabética; turmas avulsas por último). Cada grupo é um cartão recolhível
    // no padrão dos pacotes do contrato: cabeçalho com resumo, corpo com a tabela das turmas.
    function grupos(itens) {
      const mapa = new Map();
      itens.forEach((t) => {
        const chave = t.formacao?.id ?? '__avulsas';
        if (!mapa.has(chave)) mapa.set(chave, { chave, nome: t.formacao?.nome ?? 'Turmas avulsas', codigo: t.formacao?.codigo ?? '', avulsas: !t.formacao, itens: [] });
        mapa.get(chave).itens.push(t);
      });
      return [...mapa.values()].sort((a, b) => (a.avulsas - b.avulsas) || a.nome.localeCompare(b.nome, 'pt-BR'));
    }
    // Abertos por padrão: grupos com alguma turma em andamento ou próxima; só concluídas começam recolhidos.
    const abertos = new Set(grupos(ts).filter((g) => g.itens.some((t) => grupoDe(t) !== 'concluida')).map((g) => g.chave));
    const CHEVRON = (aberto) => `<svg class="h-4 w-4 shrink-0 text-slate-400 transition ${aberto ? 'rotate-90' : ''}" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>`;
    const pilula = (cls, texto) => `<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}">${esc(texto)}</span>`;
    const PIL_FORMACAO = 'bg-petrol-800/10 text-petrol-900 border-petrol-800/20 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-800';
    const PIL_NEUTRA = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700';
    // Dado compacto do cabeçalho: rótulo em caixa alta ao lado do valor, numa linha só.
    const mini = (rotulo, valor, sub = '') => `<div class="flex items-baseline gap-1.5 whitespace-nowrap"><span class="rotulo">${rotulo}</span><span class="text-sm font-medium text-slate-900 dark:text-neutral-100 tabular-nums">${valor}</span>${sub ? `<span class="text-xs text-slate-500 dark:text-neutral-400">${sub}</span>` : ''}</div>`;

    function cartaoGrupo(g) {
      const aberto = Boolean(estado.busca) || abertos.has(g.chave);
      const n = g.itens.length;
      const andamento = g.itens.filter((t) => grupoDe(t) === 'em_andamento').length;
      const proximas = g.itens.filter((t) => grupoDe(t) === 'proximas').length;
      const concluidas = g.itens.filter((t) => grupoDe(t) === 'concluida').length;
      const alunos = g.itens.reduce((s, t) => s + t.alunos.length, 0);
      const total = g.itens.reduce((s, t) => s + t.aulas.length, 0);
      const feitas = g.itens.reduce((s, t) => s + (t.situacao === 'concluida' ? t.aulas.length : t.realizadas), 0);
      const inicio = g.itens.map((t) => t.turma.inicio).sort()[0];
      const fim = g.itens.map((t) => t.turma.fim).sort().reverse()[0];
      const detalhe = [proximas && `${proximas} ${proximas === 1 ? 'próxima' : 'próximas'}`, concluidas && `${concluidas} ${concluidas === 1 ? 'concluída' : 'concluídas'}`].filter(Boolean).join(' · ');
      // Cabeçalho numa linha só: identificação à esquerda, totais à direita. Recolhido, o cartão é só o cabeçalho.
      return `
        <section class="cartao overflow-hidden" data-grupo="${esc(g.chave)}">
          <div data-toggle-grupo="${esc(g.chave)}" class="px-4 py-2 min-h-12 flex flex-wrap items-center gap-x-6 gap-y-1.5 ${aberto ? 'border-b border-slate-200 dark:border-neutral-800' : ''} cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-neutral-900/60 transition" title="${aberto ? 'Recolher' : 'Expandir'}">
            <div class="flex flex-wrap items-center gap-2 min-w-0">
              <button type="button" aria-expanded="${aberto}" class="-ml-1 flex items-center gap-1.5 rounded px-1 py-0.5 font-display font-semibold text-slate-800 dark:text-neutral-100">${CHEVRON(aberto)}${esc(g.nome)}</button>
              ${g.codigo ? `<span class="font-mono text-xs text-slate-500 dark:text-neutral-400">${esc(g.codigo)}</span>` : ''}
              ${pilula(g.avulsas ? PIL_NEUTRA : PIL_FORMACAO, g.avulsas ? 'Avulsas' : 'Formação')}
              ${andamento ? pilula('bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800', `${andamento} em andamento`) : ''}
            </div>
            <div class="ml-auto flex flex-wrap items-center gap-x-6 gap-y-1.5">
              ${mini('Turmas', n, detalhe ? `· ${detalhe}` : '')}
              ${mini('Período', `${data(inicio)} – ${data(fim)}`)}
              ${mini('Alunos', alunos)}
              <div class="flex items-center gap-2 whitespace-nowrap"><span class="rotulo">Aulas</span><div class="w-32">${barra(total ? (feitas / total) * 100 : 0, !andamento && !proximas)}</div><span class="text-xs tabular-nums text-slate-500 dark:text-neutral-400 shrink-0">${feitas}/${total}</span></div>
            </div>
          </div>
          ${aberto ? `
          <div class="overflow-x-auto"><table class="tabela w-full">
            <thead><tr><th>Código</th><th>Curso</th><th>Período</th><th>Horário</th><th>Formato</th><th class="text-right">Alunos</th><th>Aulas</th><th>Situação</th></tr></thead>
            <tbody>${g.itens.map(linha).join('')}</tbody>
          </table></div>` : ''}
        </section>`;
    }

    function estadoBotaoExpandir(gs) {
      const b = $('btn-expandir');
      const todos = gs.length > 0 && gs.every((g) => Boolean(estado.busca) || abertos.has(g.chave));
      b.textContent = todos ? 'Recolher todos' : 'Expandir todos';
      b.disabled = !gs.length || Boolean(estado.busca);
      b.title = estado.busca ? 'Com busca, todos os grupos ficam abertos' : '';
    }

    function renderTabela() {
      const itens = ts.filter(passa);
      const gs = grupos(itens);
      const vazioHtml = (msg) => `<div class="cartao px-4 py-8 text-center text-sm text-slate-500 dark:text-neutral-400">${msg}</div>`;
      $('grupos-turmas').classList.replace('space-y-4', 'space-y-2');
      $('grupos-turmas').innerHTML = !ts.length ? vazioHtml('Nenhuma turma atribuída a você.') : !itens.length ? vazioHtml('Nenhuma turma encontrada com esse filtro.') : gs.map(cartaoGrupo).join('');
      estadoBotaoExpandir(gs);
      $('grupos-turmas').querySelectorAll('tr[data-href]').forEach((tr) => {
        tr.addEventListener('click', () => { location.href = tr.dataset.href; });
        tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') location.href = tr.dataset.href; });
      });
    }

    $('grupos-turmas').addEventListener('click', (e) => {
      const t = e.target.closest('[data-toggle-grupo]');
      if (!t || estado.busca) return;
      const chave = t.dataset.toggleGrupo;
      if (abertos.has(chave)) abertos.delete(chave); else abertos.add(chave);
      renderTabela();
    });
    $('btn-expandir').addEventListener('click', () => {
      const gs = grupos(ts.filter(passa));
      const todos = gs.every((g) => abertos.has(g.chave));
      gs.forEach((g) => { if (todos) abertos.delete(g.chave); else abertos.add(g.chave); });
      renderTabela();
    });

    $('busca').addEventListener('input', (e) => { estado.busca = e.target.value.trim(); renderTabela(); });
    $('filtro-situacao').addEventListener('change', (e) => { estado.situacao = e.target.value; renderTabela(); });
    renderTabela();
  }

  // ============================================================
  // DETALHE DA TURMA
  // ============================================================

  // Consultas locais (não estão no motor do portal).
  // Todas as aulas agendadas (inclusive canceladas) ou a prévia da agenda.
  const aulasDaTurma = (t) => (Turmas.aulasAgendadas(t.turma) ?? t.aulas).map((a) => {
    const situacaoAula = a.status === 'cancelada' ? 'cancelada' : a.data < hoje ? 'realizada' : a.data === hoje ? 'hoje' : 'futura';
    const modulos = (a.moduloIds ?? []).map((id) => (t.curso?.modulos ?? []).find((m) => m.id === id)?.titulo).filter(Boolean);
    return { ...a, situacaoAula, modulos, local: localDe(a, t) };
  });

  function montarDetalhe(t) {
    const concluida = t.situacao === 'concluida';
    const todas = aulasDaTurma(t);
    const proximas = todas.filter((a) => a.situacaoAula === 'hoje' || a.situacaoAula === 'futura');
    const alunosCadastro = typeof Clientes !== 'undefined' ? Clientes.carregar().alunos : [];
    const alunos = (Turmas.matriculas(t.turma)?.linhas ?? [])
      .map((l) => ({ aluno: Clientes.porId(alunosCadastro, l.alunoId), alunoId: l.alunoId, matricula: l.matricula, contrato: l.contrato }))
      .filter((x) => x.aluno)
      .sort((a, b) => a.aluno.nome.localeCompare(b.aluno.nome, 'pt-BR'));
    const pendencias = PortalProfessor.pendencias(instrutor, [t], hoje).filter((p) => p.turma === t);
    return { ...t, concluida, todas, proximas, alunos, pendencias };
  }

  function renderDetalhe(d) {
    const ABAS = [
      { id: 'visao', titulo: 'Visão geral' },
      { id: 'alunos', titulo: 'Alunos', n: d.alunos.length },
      { id: 'aulas', titulo: 'Aulas', n: d.todas.length },
      { id: 'requisitos', titulo: 'Requisitos', n: Turmas.requisitos(d.turma, d.curso).softwares.length },
    ];
    const abaUrl = params.get('aba');
    const estado = { aba: ABAS.some((x) => x.id === abaUrl) ? abaUrl : 'visao' };
    const nomeCurso = d.curso?.nome ?? d.turma.codigo;
    const tid = encodeURIComponent(d.turma.id);
    $('tela-detalhe').classList.remove('hidden');
    document.title = `Aulor · Portal do Professor · ${d.turma.codigo}`;
    $('titulo').innerHTML = `${esc(nomeCurso)} <span class="text-base font-sans font-normal text-slate-500 dark:text-neutral-400">· <span class="font-mono">${esc(d.turma.codigo)}</span></span>`;
    $('subtitulo').innerHTML = `${d.formacao ? `${esc(d.formacao.nome)} · ` : 'Turma avulsa · '}${data(d.turma.inicio)} – ${data(d.turma.fim)}`;
    const bc = $('breadcrumb');
    bc.classList.remove('hidden');
    bc.classList.add('flex');
    bc.innerHTML = `<a href="turmas.html" class="hover:underline">Minhas turmas</a><svg class="h-3.5 w-3.5 text-slate-300 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg><span class="text-slate-800 dark:text-neutral-100 font-medium font-mono" aria-current="page">${esc(d.turma.codigo)}</span>`;

    // Ação do topo: o Meet da turma online/híbrida.
    const proxima = d.proximas[0] ?? null;
    $('acoes-topo').innerHTML = meetOnline(d) ? `<a href="${esc(d.turma.meetLink)}" target="_blank" rel="noopener" class="botao-sec">Abrir o Meet</a>` : '';

    // Cabeçalho fixo acima das abas.
    const total = d.aulas.length;
    const feitas = d.concluida ? total : d.realizadas;
    const dadoCab = (r, v) => `<div><p class="rotulo">${esc(r)}</p><div class="text-sm text-slate-800 dark:text-neutral-100 mt-0.5">${v}</div></div>`;
    // Situação como pílula (cores por situação) e dois blocos numéricos: alunos e aulas.
    const PILULA_SIT = {
      em_andamento: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      confirmada: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
      planejada: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700',
      concluida: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700',
      cancelada: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
    };
    const sit = SITUACAO[d.situacao] ?? SITUACAO.planejada;
    const pilulaSit = `<span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${PILULA_SIT[d.situacao] ?? PILULA_SIT.planejada}"><span class="h-1.5 w-1.5 rounded-full ${sit.ponto}"></span>${esc(sit.nome)}</span>`;
    const ocupando = d.alunos.filter((x) => x.matricula.status === 'matriculado' || x.matricula.status === 'concluido').length;
    const vagas = d.turma.vagas ?? null;
    const horasTotal = Math.round(Turmas.horasAulas(d.aulas));
    const horasDadas = d.concluida ? horasTotal : Math.round(Turmas.horasAulas(d.aulas.filter((a) => a.data < hoje)));
    const numero = (n, de) => `<p class="font-display text-2xl font-semibold text-slate-900 dark:text-neutral-100 leading-none mt-1 tabular-nums">${n}${de != null ? `<span class="text-base font-normal text-slate-400">/${de}</span>` : ''}</p>`;
    const linhaInfo = (icone, html) => `<p class="flex items-start gap-2 text-sm text-slate-700 dark:text-neutral-200"><span class="mt-0.5 shrink-0 text-slate-400">${icone}</span><span class="min-w-0">${html}</span></p>`;
    const ICO = {
      calendario: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>',
      relogio: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
      local: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>',
    };
    const localTexto = `${d.sala ? esc(d.sala.nome) : d.turma.meetLink ? 'Google Meet' : '<span class="text-slate-400">Sala a definir</span>'}${d.turma.meetLink ? ` · <a href="${esc(d.turma.meetLink)}" target="_blank" rel="noopener" class="link">${esc(d.turma.meetLink.replace(/^https?:\/\//, ''))}</a>` : ''}`;
    $('cabecalho-turma').innerHTML = `
      <div class="cartao p-5 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr] gap-x-6 gap-y-5 lg:divide-x lg:divide-slate-200/70 dark:lg:divide-neutral-800">
        <div class="space-y-2.5 min-w-0">
          <div class="flex flex-wrap items-center gap-2">${pilulaSit}<span class="text-xs text-slate-500 dark:text-neutral-400">${esc(FORMATO[d.turma.formato] ?? d.turma.formato ?? '')}${d.turma.tipo === 'incompany' ? ' · In company' : ''}</span></div>
          ${linhaInfo(ICO.calendario, `<span class="tabular-nums">${data(d.turma.inicio)} – ${data(d.turma.fim)}</span>`)}
          ${linhaInfo(ICO.relogio, esc(d.turma.turno || '—'))}
          ${linhaInfo(ICO.local, localTexto)}
        </div>
        <div class="lg:pl-6">
          <p class="rotulo">Alunos</p>
          ${numero(ocupando, vagas ?? '—')}
          <div class="mt-2">${barra(vagas ? (ocupando / vagas) * 100 : 0)}</div>
          <p class="text-xs mt-1.5 text-slate-500 dark:text-neutral-400">${vagas ? `${plural(Math.max(0, vagas - ocupando), 'vaga livre', 'vagas livres')}` : 'Sem limite de vagas'}</p>
        </div>
        <div class="lg:pl-6">
          <p class="rotulo">Aulas</p>
          ${numero(feitas, total)}
          <div class="mt-2">${barra(total ? (feitas / total) * 100 : 0, d.concluida)}</div>
          <p class="text-xs text-slate-500 dark:text-neutral-400 mt-1.5">${horasDadas} de ${horasTotal} h${proxima ? ` · próxima ${esc(PortalProfessor.rotuloDia(proxima.data, hoje).toLowerCase())} ${esc(proxima.inicio)}` : d.concluida ? ' · concluída' : ''}</p>
        </div>
      </div>`;

    const dado = (r, v) => `<div><p class="rotulo">${esc(r)}</p><div class="text-sm text-slate-800 dark:text-neutral-100 mt-0.5">${v}</div></div>`;
    const linhaAulaCurta = (a) => `
      <a href="${linkTurma(d)}&aba=aulas" data-aba-link="aulas" class="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-neutral-900/60 transition">
        <div class="shrink-0 w-12 text-center rounded-lg ${a.situacaoAula === 'hoje' ? 'bg-petrol-800 text-white dark:bg-areia dark:text-petrol-800' : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-300'} py-1.5">
          <p class="text-lg font-display font-semibold leading-none tabular-nums">${new Date(`${a.data}T12:00:00`).getDate()}</p>
          <p class="text-[11px] mt-0.5">${esc(PortalProfessor.diaSemana(a.data).slice(0, 3))}</p>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-slate-900 dark:text-neutral-100 truncate">${esc(PortalProfessor.rotuloDia(a.data, hoje))} · ${esc(a.inicio)}–${esc(a.fim)}${a.n ? ` · aula ${a.n} de ${total}` : ''}</p>
          <p class="text-xs text-slate-500 dark:text-neutral-400 truncate">${esc(a.local || '—')}${a.conteudo || a.modulos.length ? ` · ${esc(a.conteudo || a.modulos.join(' · '))}` : ''}</p>
        </div>
      </a>`;

    function abaVisao() {
      const proximasCinco = d.proximas.slice(0, 5);
      const semConteudo = d.todas.filter((a) => a.situacaoAula !== 'cancelada' && !a.conteudo && !a.modulos.length).length;
      const horas = Turmas.horasAulas(d.aulas);
      const pend = d.pendencias.length
        ? `<ul class="space-y-1.5">${d.pendencias.map((p) => `<li class="flex items-start gap-2 text-sm"><span class="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0"></span><a href="${esc(p.href)}" class="hover:underline">${esc(p.texto)}</a></li>`).join('')}</ul>`
        : `<p class="text-sm text-slate-500 dark:text-neutral-400">${ponto('bg-emerald-500', 'Tudo em dia')}</p>`;
      return `
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div class="cartao p-5 xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            ${dado('Curso', `<p class="font-medium">${esc(nomeCurso)}</p><p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(d.curso?.codigo ?? '')}${d.curso?.cargaHoraria ? ` · ${esc(String(d.curso.cargaHoraria))} h` : ''}</p>`)}
            ${dado('Formação', d.formacao ? `${esc(d.formacao.nome)}<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(d.formacao.codigo ?? '')}</p>` : '<span class="text-slate-500 dark:text-neutral-400">Turma avulsa</span>')}
            ${dado('Turma', `<span class="font-mono">${esc(d.turma.codigo)}</span>${d.turma.tipo === 'incompany' ? '<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">In company</p>' : ''}`)}
            ${dado('Carga horária', `${esc(String(Math.round(horas)))} h em ${plural(d.aulas.length, 'aula', 'aulas')}${semConteudo && !d.concluida ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${plural(semConteudo, 'aula sem conteúdo definido', 'aulas sem conteúdo definido')}</p>` : ''}`)}
            ${dado('Próxima aula', proxima ? `${esc(PortalProfessor.rotuloDia(proxima.data, hoje))} · ${esc(proxima.inicio)}–${esc(proxima.fim)}<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(proxima.local || '—')}</p>` : d.concluida ? 'Turma concluída' : '—')}
            ${d.turma.observacoes ? `<div class="sm:col-span-2 lg:col-span-3">${dado('Observações', esc(d.turma.observacoes))}</div>` : ''}
          </div>
          <div class="space-y-5">
            <div class="cartao p-5"><p class="rotulo mb-2">Pendências</p>${pend}</div>
            <div>
              <div class="flex items-center justify-between mb-2"><p class="rotulo">Próximas aulas</p><a href="${linkTurma(d)}&aba=aulas" data-aba-link="aulas" class="link !text-xs">Todas as aulas</a></div>
              <div class="cartao divide-y divide-slate-100 dark:divide-neutral-900">${proximasCinco.length ? proximasCinco.map(linhaAulaCurta).join('') : `<div class="p-5 text-center text-sm text-slate-500 dark:text-neutral-400">${d.concluida ? 'Turma concluída.' : 'Nenhuma aula prevista.'}</div>`}</div>
            </div>
          </div>
        </div>`;
    }

    function abaAlunos() {
      if (!d.alunos.length) return vazio('Nenhum aluno matriculado nesta turma ainda.');
      const ativos = d.alunos.filter((x) => x.matricula.status === 'matriculado' || x.matricula.status === 'concluido').length;
      return `
        <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p class="text-sm text-slate-500 dark:text-neutral-400">${plural(ativos, 'aluno ocupando vaga', 'alunos ocupando vagas')} de ${d.turma.vagas ?? '—'}.</p>
        </div>
        <div class="cartao overflow-hidden"><div class="overflow-x-auto"><table class="tabela w-full">
          <thead><tr><th>Nº</th><th>Aluno</th><th>Matrícula</th></tr></thead>
          <tbody>${d.alunos.map((x, i) => {
            const m = MATRICULA[x.matricula.status] ?? { nome: x.matricula.status, ponto: 'bg-slate-400' };
            const encerrada = x.matricula.status === 'desistiu' || x.matricula.status === 'cancelada' || x.matricula.status === 'congelada';
            return `<tr class="${encerrada ? 'opacity-60' : ''}">
              <td class="tabular-nums text-slate-500 dark:text-neutral-400 w-10">${i + 1}</td>
              <td class="font-medium text-slate-900 dark:text-neutral-100"><div class="flex items-center gap-2.5">${PortalProfessor.avatarAlunoHtml(x.aluno, 'h-9 w-9')}<div class="min-w-0">${esc(x.aluno.nome)}${x.aluno.apelido ? ` <span class="text-xs font-normal text-slate-500 dark:text-neutral-400">(${esc(x.aluno.apelido)})</span>` : ''}</div></div></td>
              <td>${ponto(m.ponto, m.nome)}${x.matricula.codigo ? `<p class="text-xs font-mono text-slate-400">${esc(x.matricula.codigo)}</p>` : ''}</td>
            </tr>`;
          }).join('')}</tbody>
        </table></div></div>`;
    }

    // ---------- Aba Aulas: os materiais de cada aula ----------
    // O professor cadastra os materiais da aula e escolhe quando liberar (js/materiais-motor.js);
    // o aluno vê no portal só o que já está liberado; a coordenação acompanha tudo na tela de materiais dela.

    const chaveAula = (a) => a.id ?? `${a.data}|${a.inicio}`;
    const svg = (path, cls = 'h-4 w-4') => `<svg class="${cls} shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">${path}</svg>`;
    const ICO_ARQUIVO = '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />';
    const ICO_LINK = '<path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />';
    const ICO_MAIS = '<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />';
    // Pílula do DESIGN.md: liberado é o estado bom; programado é informação (neutra); não liberado espera o professor (aviso).
    const PILULA_MATERIAL = {
      liberado: { cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', ponto: 'bg-emerald-500' },
      programado: { cls: 'bg-slate-100 text-slate-700 dark:bg-neutral-900 dark:text-neutral-300', ponto: 'bg-slate-500 dark:bg-neutral-400' },
      bloqueado: { cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300', ponto: 'bg-amber-500' },
    };
    const diaMes = (iso) => data(iso).slice(0, 5);
    function pilulaMaterial(m) {
      const sit = Materiais.situacao(m, hoje);
      const texto = sit === 'programado' ? `Programado para ${diaMes(m.liberarEm)}` : Materiais.SITUACOES[sit].nome;
      return `<span title="${esc(Materiais.SITUACOES[sit].descricao)}" class="pilula inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium ${PILULA_MATERIAL[sit].cls}"><span class="h-1.5 w-1.5 rounded-full ${PILULA_MATERIAL[sit].ponto}"></span>${esc(texto)}</span>`;
    }
    const descricaoAula = (a) => `${a.n ? `Aula ${a.n} · ` : ''}${data(a.data)} · ${esc(a.inicio)}–${esc(a.fim)}`;

    const linhaMaterial = (m) => `
      <li class="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 px-3 py-2">
        <span class="text-slate-400">${svg(m.tipo === 'link' ? ICO_LINK : ICO_ARQUIVO)}</span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-slate-900 dark:text-neutral-100 truncate">${esc(m.titulo)}</p>
          <p class="text-xs text-slate-500 dark:text-neutral-400 truncate">${m.tipo === 'link' ? `<a href="${esc(m.url)}" target="_blank" rel="noopener" class="link !text-xs">${esc(m.url.replace(/^https?:\/\//, ''))}</a>` : esc(m.arquivo)}${m.descricao ? ` · ${esc(m.descricao)}` : ''}</p>
        </div>
        ${pilulaMaterial(m)}
        <div class="flex items-center">
          ${Materiais.situacao(m, hoje) !== 'liberado' ? `<button type="button" data-liberar-material="${esc(m.id)}" aria-label="Liberar agora: ${esc(m.titulo)}" class="botao-fantasma">Liberar agora</button>` : ''}
          <button type="button" data-editar-material="${esc(m.id)}" aria-label="Editar ${esc(m.titulo)}" class="botao-fantasma">Editar</button>
          <button type="button" data-remover-material="${esc(m.id)}" aria-label="Remover ${esc(m.titulo)}" class="botao-fantasma">Remover</button>
        </div>
      </li>`;

    function abaAulas() {
      if (!d.todas.length) return vazio('As aulas desta turma ainda não foram agendadas.');
      const estimadas = !Turmas.temAgendamento(d.turma);
      const mats = Materiais.daTurma(d.turma.id);
      const liberados = mats.filter((m) => Materiais.situacao(m, hoje) === 'liberado').length;
      return `
        <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p class="text-sm text-slate-500 dark:text-neutral-400">${estimadas ? 'Datas previstas pela agenda da turma; o conteúdo aparece quando a secretaria confirmar o agendamento.' : `${plural(d.aulas.length, 'aula', 'aulas')} agendadas.`} ${mats.length ? `${plural(mats.length, 'material', 'materiais')}, ${plural(liberados, 'liberado', 'liberados')}. ` : ''}O aluno vê no portal só o material liberado.</p>
        </div>
        <div class="cartao divide-y divide-slate-100 dark:divide-neutral-900">${d.todas.map((a) => {
          const s = AULA[a.situacaoAula];
          const cancelada = a.situacaoAula === 'cancelada';
          const conteudo = a.conteudo || a.modulos.join(' · ');
          const ms = a.id ? Materiais.daAula(d.turma.id, a.id) : [];
          return `
          <div data-aula="${esc(chaveAula(a))}" class="px-5 py-4 ${cancelada ? 'linha-apagada' : ''}">
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div class="shrink-0 w-12 text-center rounded-lg ${a.situacaoAula === 'hoje' ? 'bg-petrol-800 text-white dark:bg-areia dark:text-petrol-800' : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-300'} py-1.5">
                <p class="text-lg font-display font-semibold leading-none tabular-nums">${new Date(`${a.data}T12:00:00`).getDate()}</p>
                <p class="text-[11px] mt-0.5">${esc(PortalProfessor.diaSemana(a.data).slice(0, 3))}</p>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-slate-900 dark:text-neutral-100 tabular-nums ${cancelada ? 'line-through' : ''}">${descricaoAula(a)}${a.local ? ` · ${esc(a.local)}` : ''}</p>
                <p class="text-xs text-slate-500 dark:text-neutral-400">${conteudo ? esc(conteudo) : 'Sem conteúdo definido'}${cancelada && a.motivo ? ` · <span class="text-red-600 dark:text-red-400">${esc(motivoTexto(a.motivo))}</span>` : ''}${a.origem === 'reposicao' ? ' · Reposição' : a.origem === 'extra' ? ' · Aula extra' : ''}</p>
              </div>
              <div class="flex items-center gap-3 shrink-0 text-sm">
                ${ponto(s.ponto, s.nome)}
                ${cancelada ? '' : `<button type="button" data-add-material="${esc(chaveAula(a))}" class="botao-fantasma">${svg(ICO_MAIS)}Adicionar material</button>`}
              </div>
            </div>
            ${ms.length ? `<ul class="mt-3 sm:ml-16 space-y-2">${ms.map(linhaMaterial).join('')}</ul>` : ''}
          </div>`;
        }).join('')}</div>`;
    }

    // Aulas ainda na prévia da agenda (sem id): gera e grava as aulas da turma antes do primeiro material,
    // como a semente faz (turmas-motor.js, semearAulas). Devolve o id da aula de mesma data e horário.
    function materializarAulas(aula) {
      const lista = Turmas.carregar();
      const t = Turmas.porId(lista, d.turma.id);
      if (!Turmas.temAgendamento(t)) {
        t.aulas = Aulas.distribuirConteudo(Aulas.gerar(t, Turmas.agendaDe(t)), d.curso);
        Turmas.salvar(lista);
      }
      d.turma = t;
      d.todas = aulasDaTurma(d);
      return d.todas.find((a) => a.data === aula.data && a.inicio === aula.inicio)?.id ?? null;
    }

    // Diálogo nativo (DESIGN.md do aulor-web): título, contexto, corpo e as ações à direita.
    const dialogo = $('dialogo');
    dialogo.addEventListener('click', (e) => { if (e.target.closest('[data-fechar-dialogo]')) dialogo.close(); });
    // O evento close chega depois (tarefa na fila): se o diálogo já reabriu com outro conteúdo, não limpa.
    dialogo.addEventListener('close', () => { if (!dialogo.open) dialogo.innerHTML = ''; });
    function abrirDialogo(html, largura) {
      dialogo.className = `dialogo modal-anim ${largura}`;
      dialogo.innerHTML = html;
      dialogo.showModal();
    }
    const topoDialogo = (titulo, contexto) => `
      <h3 id="dialogo-titulo" class="titulo-secao">${titulo}</h3>
      <p id="dialogo-contexto" class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${contexto}</p>`;
    const acoesDialogo = (confirmar, cls = 'botao-pri') => `
      <div class="mt-5 flex justify-end gap-2">
        <button type="button" data-fechar-dialogo class="botao-sec">Cancelar</button>
        <button type="submit" class="${cls}">${confirmar}</button>
      </div>`;
    // Volta o foco para a aula depois de gravar (o botão que abriu o diálogo foi redesenhado).
    const focarAula = (aulaId) => $('conteudo-aba').querySelector(`[data-aula="${CSS.escape(String(aulaId))}"] [data-add-material]`)?.focus();

    function dialogoMaterial(aula, m = null) {
      const modo = !m ? 'agora' : Materiais.situacao(m, hoje) === 'liberado' ? 'agora' : m.liberarEm ? 'data' : 'depois';
      const tipo = m?.tipo ?? 'arquivo';
      const opcao = (nome, valor, rotulo, apoio = '') => `
        <label class="flex items-start gap-2 cursor-pointer">
          <input type="radio" name="${nome}" value="${valor}" ${(nome === 'tipo' ? tipo : modo) === valor ? 'checked' : ''} class="mt-0.5 h-4 w-4 shrink-0 accent-petrol-800 dark:accent-sky-500">
          <span class="text-sm text-slate-800 dark:text-neutral-100">${rotulo}${apoio ? `<span class="block text-xs text-slate-500 dark:text-neutral-400">${apoio}</span>` : ''}</span>
        </label>`;
      abrirDialogo(`
        ${topoDialogo(m ? 'Editar material' : 'Adicionar material', `${descricaoAula(aula)}. O aluno vê no portal quando o material for liberado.`)}
        <form id="form-material" novalidate class="mt-4 space-y-4">
          <div>
            <label class="rotulo" for="m-titulo">Título</label>
            <input id="m-titulo" name="titulo" type="text" maxlength="120" autofocus value="${esc(m?.titulo ?? '')}" placeholder="Ex.: Apostila do módulo 1" aria-required="true" aria-describedby="erro-titulo" class="campo mt-1">
            ${erroDe('titulo')}
          </div>
          <fieldset>
            <legend class="rotulo">Tipo</legend>
            <div class="mt-1.5 flex flex-wrap gap-x-6 gap-y-2">${opcao('tipo', 'arquivo', 'Arquivo')}${opcao('tipo', 'link', 'Link')}</div>
            ${erroDe('tipo')}
          </fieldset>
          <div data-bloco="arquivo" ${tipo === 'arquivo' ? '' : 'hidden'}>
            <label class="rotulo" for="m-arquivo">Arquivo</label>
            <input id="m-arquivo" name="arquivo" type="file" aria-describedby="erro-arquivo m-arquivo-apoio" class="campo mt-1 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 dark:file:bg-neutral-900 file:px-2.5 file:py-1 file:text-sm file:font-medium file:text-slate-700 dark:file:text-neutral-200">
            <p id="m-arquivo-apoio" class="mt-1 text-xs text-slate-500 dark:text-neutral-400">${m?.arquivo ? `Atual: <span class="font-medium text-slate-700 dark:text-neutral-200">${esc(m.arquivo)}</span>. Escolha outro só para trocar.` : 'No protótipo, fica guardado só o nome do arquivo.'}</p>
            ${erroDe('arquivo')}
          </div>
          <div data-bloco="link" ${tipo === 'link' ? '' : 'hidden'}>
            <label class="rotulo" for="m-url">Link</label>
            <input id="m-url" name="url" type="url" value="${esc(m?.url ?? '')}" placeholder="https://" aria-describedby="erro-url" class="campo mt-1">
            ${erroDe('url')}
          </div>
          <div>
            <label class="rotulo" for="m-descricao">Descrição <span class="normal-case font-normal tracking-normal text-slate-400">(opcional)</span></label>
            <textarea id="m-descricao" name="descricao" rows="2" maxlength="300" class="campo mt-1 resize-y">${esc(m?.descricao ?? '')}</textarea>
          </div>
          <fieldset>
            <legend class="rotulo">Quando liberar</legend>
            <div class="mt-1.5 space-y-2.5">
              ${opcao('liberar', 'agora', 'Agora', esc(Materiais.SITUACOES.liberado.descricao))}
              ${opcao('liberar', 'data', 'Em uma data', esc(Materiais.SITUACOES.programado.descricao))}
              <div data-bloco="data" class="pl-6" ${modo === 'data' ? '' : 'hidden'}>
                <input name="liberarEm" type="date" value="${esc(modo === 'data' ? m.liberarEm : '')}" aria-label="Data de liberação" aria-describedby="erro-liberarEm" class="campo !w-auto">
                ${erroDe('liberarEm')}
              </div>
              ${opcao('liberar', 'depois', 'Depois (não liberar ainda)', `${esc(Materiais.SITUACOES.bloqueado.descricao)} Você libera quando quiser.`)}
            </div>
          </fieldset>
          ${erroDe('aulaId')}
          ${acoesDialogo(m ? 'Salvar' : 'Adicionar')}
        </form>`, 'max-w-[560px]');
      const form = $('form-material');
      const f = form.elements;
      form.addEventListener('change', (e) => {
        form.querySelector('[data-bloco="arquivo"]').hidden = f.tipo.value !== 'arquivo';
        form.querySelector('[data-bloco="link"]').hidden = f.tipo.value !== 'link';
        form.querySelector('[data-bloco="data"]').hidden = f.liberar.value !== 'data';
        if (e.target.name === 'liberar' && e.target.value === 'data') f.liberarEm.focus();
        limparErro(form, e.target.name);
      });
      form.addEventListener('input', (e) => limparErro(form, e.target.name));
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const liberar = f.liberar.value;
        const dados = {
          id: m?.id, turmaId: d.turma.id, aulaId: m?.aulaId ?? aula.id ?? chaveAula(aula),
          titulo: f.titulo.value, descricao: f.descricao.value, tipo: f.tipo.value,
          arquivo: f.arquivo.files[0]?.name ?? m?.arquivo ?? '', url: f.url.value,
          // "Agora" mantém a data de quem já estava liberado.
          liberarEm: liberar === 'agora' ? (m && Materiais.situacao(m, hoje) === 'liberado' ? m.liberarEm : hoje) : liberar === 'data' ? f.liberarEm.value : null,
          autor: { nome: instrutor.nome, papel: 'professor' },
        };
        const erros = Materiais.validar(dados);
        if (liberar === 'data' && !dados.liberarEm) erros.liberarEm = 'Informe a data.';
        const comoLista = (es) => Object.entries(es).map(([campo, mensagem]) => ({ campo, mensagem }));
        if (mostrarErros(form, comoLista(erros))) return;
        if (!m && !aula.id) dados.aulaId = materializarAulas(aula);
        const r = Materiais.salvar(dados);
        if (r.erros) { mostrarErros(form, comoLista(r.erros)); return; }
        dialogo.close();
        renderAba();
        focarAula(r.material.aulaId);
        const quando = { liberado: 'o aluno já vê', programado: `libera em ${diaMes(r.material.liberarEm)}`, bloqueado: 'ainda não liberado' }[Materiais.situacao(r.material, hoje)];
        toast(`${m ? 'Material salvo' : 'Material adicionado'}: ${quando}.`);
      });
    }

    function dialogoRemover(m) {
      const aula = d.todas.find((a) => a.id === m.aulaId);
      abrirDialogo(`
        ${topoDialogo('Remover material', `"${esc(m.titulo)}" sai da ${aula?.n ? `aula ${aula.n}` : 'aula'} e o aluno deixa de ver. Não dá para desfazer.`)}
        <form id="form-remover">${acoesDialogo('Remover', 'botao-perigo')}</form>`, 'max-w-[400px]');
      $('form-remover').addEventListener('submit', (e) => {
        e.preventDefault();
        Materiais.remover(m.id);
        dialogo.close();
        renderAba();
        focarAula(m.aulaId);
        toast('Material removido.');
      });
    }

    $('conteudo-aba').addEventListener('click', (e) => {
      const b = e.target.closest('[data-add-material], [data-editar-material], [data-liberar-material], [data-remover-material]');
      if (!b) return;
      if (b.dataset.addMaterial) { const a = d.todas.find((x) => chaveAula(x) === b.dataset.addMaterial); if (a) dialogoMaterial(a); return; }
      const m = Materiais.daTurma(d.turma.id).find((x) => x.id === (b.dataset.editarMaterial ?? b.dataset.liberarMaterial ?? b.dataset.removerMaterial));
      if (!m) return;
      if (b.dataset.editarMaterial) dialogoMaterial(d.todas.find((a) => a.id === m.aulaId) ?? {}, m);
      else if (b.dataset.removerMaterial) dialogoRemover(m);
      else {
        Materiais.liberar(m.id, hoje);
        renderAba();
        focarAula(m.aulaId);
        toast(`"${m.titulo}" liberado: o aluno já vê.`);
      }
    });

    // ---------- Aba Requisitos ----------
    // Softwares da SUA turma (V1: sem máquina nem sala, como no curso e na turma do administrativo):
    // nasceram do catálogo do curso e daqui em diante são desta turma. O que você mexe vale para a sua turma na hora; marcando "sugerir para o
    // curso", a coordenação decide se entra no catálogo (e vale para as próximas turmas).

    const catalogoDe = (item) => (item.softwareId && typeof softwareDoCatalogo === 'function' ? softwareDoCatalogo(item.softwareId) : null);
    const reqDaTurma = () => Turmas.requisitos(d.turma, d.curso);
    const agoraIso = () => `${hoje}T${new Date().toTimeString().slice(0, 5)}`;

    // Grava na turma e, quando pedido, manda a sugestão para o curso.
    function salvarRequisitos(fn, msg, sugestao = null) {
      const lista = fn(Turmas.carregar());
      Turmas.salvar(lista);
      d.turma = Turmas.porId(lista, d.turma.id) ?? d.turma;
      if (sugestao && d.curso) {
        Cursos.salvar(Cursos.sugerirRequisito(Cursos.carregar(), d.curso.id, {
          ...sugestao,
          turmaId: d.turma.id, turmaCodigo: d.turma.codigo,
          instrutorId: instrutor.id, instrutorNome: instrutor.nome,
          em: agoraIso(),
        }));
      }
      renderAba();
      toast(`${msg}${sugestao ? ' Sugestão enviada à coordenação.' : ''}`);
    }

    function abaRequisitos() {
      const r = reqDaTurma();
      const cmp = Turmas.comparacaoRequisitos(d.turma, d.curso);
      const doCurso = Turmas.requisitosDoCurso(d.curso);
      const itens = r.softwares.map((item) => ({ item, cat: catalogoDe(item), chave: Turmas.chaveSoftware(item) }));
      // Sugestões de máquina, de antes da V1, não aparecem (o administrativo também as ignora).
      const minhas = d.curso ? Cursos.sugestoesRequisitos(d.curso).filter((sg) => sg.instrutorId === instrutor.id && sg.tipo !== 'maquina') : [];
      const pendentes = minhas.filter((sg) => sg.status === 'pendente');
      const respondidas = minhas.filter((sg) => sg.status !== 'pendente');

      const linha = ({ item, cat, chave }) => `
        <li class="flex items-center gap-3 px-5 py-2.5">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-slate-900 dark:text-neutral-100">${esc(item.nome)}${cat?.versao ? ` <span class="font-normal text-xs text-slate-400">${esc(cat.versao)}</span>` : ''}${item.origem === 'turma' ? ' <span class="ml-1 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 px-2 py-0.5 text-[11px] font-medium">só nesta turma</span>' : ''}</p>
            <p class="text-xs text-slate-500 dark:text-neutral-400 truncate">${cat ? esc(cat.grupo) + (cat.requisitos ? ` · requer ${esc(cat.requisitos)}` : '') : 'fora do catálogo do suporte'}${item.observacao ? ` · <span class="text-slate-700 dark:text-neutral-300">${esc(item.observacao)}</span>` : ''}</p>
          </div>
          ${cat?.site || item.site ? `<a href="${esc(cat?.site || item.site)}" target="_blank" rel="noopener" class="link shrink-0" title="${esc(cat?.site || item.site)}">Site</a>` : ''}
          <button type="button" data-obs-req="${esc(chave)}" title="Observação (versão, extensão, configuração)" class="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg></button>
          <button type="button" data-remover-req="${esc(chave)}" title="Tirar da lista desta turma" class="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-neutral-900"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166M18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
        </li>`;

      return `
        <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p class="text-sm text-slate-500 dark:text-neutral-400">O que precisa estar instalado nas máquinas para as suas aulas${r.herdado ? ` — hoje, o que está no catálogo de <strong>${esc(d.curso?.nome ?? 'curso')}</strong>` : ''}. O suporte instala por esta lista; peça com antecedência.</p>
          ${pendentes.length ? `<p class="text-xs text-amber-700 dark:text-amber-400">${plural(pendentes.length, 'sugestão sua esperando a coordenação', 'sugestões suas esperando a coordenação')}</p>` : ''}
        </div>
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <section class="cartao xl:col-span-2 overflow-hidden">
            <div class="px-5 py-3.5 border-b border-slate-100 dark:border-neutral-900 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="titulo-secao">Softwares da turma <span class="text-sm font-normal text-slate-400 tabular-nums">${itens.length}</span></p>
                <p class="text-xs text-slate-500 dark:text-neutral-400">Vale para a ${esc(d.turma.codigo)}. Mudar aqui não mexe no catálogo do curso.</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button type="button" id="btn-req-livre" class="botao-sec">Fora do catálogo</button>
                <button type="button" id="btn-req-catalogo" class="botao-pri">Adicionar</button>
              </div>
            </div>
            <ul class="divide-y divide-slate-100 dark:divide-neutral-900">
              ${itens.length ? itens.map(linha).join('') : '<li class="px-5 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">Nenhum software na lista desta turma. Adicione o que você vai usar nas aulas.</li>'}
            </ul>
          </section>
          <div class="space-y-5">
            <section class="cartao">
              <div class="px-5 py-3.5 border-b border-slate-100 dark:border-neutral-900">
                <p class="titulo-secao">No catálogo do curso <span class="text-sm font-normal text-slate-400 tabular-nums">${doCurso.softwares.length}</span></p>
                <p class="text-xs text-slate-500 dark:text-neutral-400">O que a coordenação definiu para toda turma deste curso.</p>
              </div>
              <div class="p-5 text-sm">
                ${doCurso.softwares.length ? `<div class="flex flex-wrap gap-1.5">${doCurso.softwares.map((sw) => {
                  const naTurma = r.softwares.some((x) => Turmas.chaveSoftware(x) === Turmas.chaveSoftware(sw));
                  return `<span title="${naTurma ? 'Também está na sua turma' : 'Está no curso, mas não na sua turma'}" class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${naTurma ? 'border-slate-200 dark:border-neutral-700 bg-slate-100 dark:bg-neutral-900 text-slate-500 dark:text-neutral-400' : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'}">${esc(sw.nome)}</span>`;
                }).join('')}</div>` : '<p class="text-slate-400">Nenhum software definido no curso.</p>'}
                ${cmp.faltando.length ? `<button type="button" id="btn-trazer-curso" class="link mt-3">Trazer ${plural(cmp.faltando.length, 'software do curso', 'softwares do curso')} para a turma</button>` : ''}
              </div>
            </section>
            ${pendentes.length || respondidas.length ? `
            <section class="cartao">
              <div class="px-5 py-3.5 border-b border-slate-100 dark:border-neutral-900"><p class="titulo-secao">Suas sugestões ao curso</p></div>
              <ul class="divide-y divide-slate-100 dark:divide-neutral-900">
                ${[...pendentes, ...respondidas].map((sg) => `
                <li class="px-5 py-2.5">
                  <p class="text-sm text-slate-800 dark:text-neutral-100">${esc(Cursos.textoSugestao(sg))}</p>
                  <p class="text-xs mt-0.5 ${sg.status === 'pendente' ? 'text-amber-700 dark:text-amber-400' : sg.status === 'aceita' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-neutral-400'}">${sg.status === 'pendente' ? 'Esperando a coordenação' : sg.status === 'aceita' ? 'Aceita — entrou no catálogo do curso' : `Recusada${sg.motivo ? ` · ${esc(sg.motivo)}` : ''}`}</p>
                </li>`).join('')}
              </ul>
            </section>` : ''}
          </div>
        </div>`;
    }

    function ligarRequisitos() {
      const el = $('conteudo-aba');
      const opts = () => ({ curso: d.curso, autor: instrutor.nome });
      el.querySelector('#btn-req-catalogo')?.addEventListener('click', modalAdicionarSoftwares);
      el.querySelector('#btn-req-livre')?.addEventListener('click', modalSoftwareLivre);
      el.querySelector('#btn-trazer-curso')?.addEventListener('click', () => {
        const faltando = Turmas.comparacaoRequisitos(d.turma, d.curso).faltando;
        salvarRequisitos((lista) => {
          let nova = Turmas.adicionarSoftwaresRequisitos(lista, d.turma.id, faltando.filter((s) => s.softwareId).map((s) => s.softwareId), opts());
          faltando.filter((s) => !s.softwareId).forEach((s) => { nova = Turmas.adicionarSoftwareLivreRequisito(nova, d.turma.id, s, opts()); });
          return nova;
        }, `${plural(faltando.length, 'software do curso', 'softwares do curso')} na sua turma.`);
      });
      el.querySelectorAll('[data-obs-req]').forEach((b) => b.addEventListener('click', () => modalObservacao(b.dataset.obsReq)));
      el.querySelectorAll('[data-remover-req]').forEach((b) => b.addEventListener('click', () => modalRemover(b.dataset.removerReq)));
    }

    function modalAdicionarSoftwares() {
      const r = reqDaTurma();
      const ja = new Set(r.softwares.map((s) => s.softwareId).filter(Boolean));
      const noCurso = new Set(Turmas.requisitosDoCurso(d.curso).softwares.map((s) => s.softwareId).filter(Boolean));
      const disponiveis = (typeof SOFTWARES_CATALOGO !== 'undefined' ? SOFTWARES_CATALOGO : []).filter((s) => !ja.has(s.id));
      const grupos = [...new Set(disponiveis.map((s) => s.grupo))];
      abrirModal(`${cabecalhoModal('Adicionar softwares', `Para as aulas da <strong>${esc(d.turma.codigo)}</strong>. O suporte já tem o roteiro de instalação de cada um.`)}
        <form id="form-req-add" novalidate>
          <div class="p-5 space-y-4">
            <input id="busca-sw" type="search" placeholder="Filtrar por nome ou grupo…" class="campo">
            <div class="max-h-72 overflow-y-auto space-y-4">
              ${grupos.map((g) => `
              <div data-grupo>
                <p class="rotulo mb-1">${esc(g)}</p>
                <div class="space-y-0.5">
                  ${disponiveis.filter((s) => s.grupo === g).map((sw) => `
                  <label data-sw data-nome="${esc(normalizar(`${sw.nome} ${sw.grupo}`))}" title="${esc(sw.observacao || '')}" class="flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900">
                    <input type="checkbox" name="softwares" value="${esc(sw.id)}" class="accent-petrol-800 dark:accent-sky-500">
                    <span class="text-sm text-slate-800 dark:text-neutral-100">${esc(sw.nome)}${sw.versao ? ` <span class="text-xs text-slate-400">${esc(sw.versao)}</span>` : ''}</span>
                    ${noCurso.has(sw.id) ? '<span class="ml-auto text-xs text-slate-400">no curso</span>' : ''}
                  </label>`).join('')}
                </div>
              </div>`).join('')}
              ${disponiveis.length ? '' : '<p class="text-sm text-slate-500 dark:text-neutral-400">Todo o catálogo já está na sua turma.</p>'}
            </div>
            ${erroDe('softwares')}
            ${caixaSugerir('Sugerir também para o curso — vale para as próximas turmas.', true)}
          </div>
          ${rodapeModal('Adicionar')}
        </form>`, 'max-w-lg');
      const form = $('form-req-add');
      const busca = $('busca-sw');
      busca.focus();
      busca.addEventListener('input', () => {
        const termo = normalizar(busca.value.trim());
        form.querySelectorAll('[data-sw]').forEach((l) => l.classList.toggle('hidden', Boolean(termo) && !l.dataset.nome.includes(termo)));
        form.querySelectorAll('[data-grupo]').forEach((g) => g.classList.toggle('hidden', !g.querySelector('[data-sw]:not(.hidden)')));
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const ids = [...form.querySelectorAll('[name="softwares"]:checked')].map((cb) => cb.value);
        if (mostrarErros(form, ids.length ? [] : [{ campo: 'softwares', mensagem: 'Marque pelo menos um software.' }])) return;
        const sugerir = form.querySelector('[name="sugerir"]').checked;
        const nomes = ids.map((id) => softwareDoCatalogo(id)?.nome).filter(Boolean);
        fecharModal();
        salvarRequisitos(
          (lista) => Turmas.adicionarSoftwaresRequisitos(lista, d.turma.id, ids, { curso: d.curso, autor: instrutor.nome }),
          `${plural(ids.length, 'software', 'softwares')} na lista da sua turma.${sugerir ? ` ${plural(ids.length, 'sugestão enviada', 'sugestões enviadas')} à coordenação.` : ''}`,
        );
        // Uma sugestão por software: a coordenação decide um a um.
        if (sugerir && d.curso) {
          let cursos = Cursos.carregar();
          ids.forEach((id, i) => { cursos = Cursos.sugerirRequisito(cursos, d.curso.id, { tipo: 'incluir', softwareId: id, nome: nomes[i], turmaId: d.turma.id, turmaCodigo: d.turma.codigo, instrutorId: instrutor.id, instrutorNome: instrutor.nome, em: agoraIso() }); });
          Cursos.salvar(cursos);
          renderAba();
        }
      });
    }

    function modalSoftwareLivre() {
      abrirModal(`${cabecalhoModal('Software fora do catálogo', 'O suporte não tem roteiro para este — diga onde baixar e como instalar.')}
        <form id="form-req-livre" novalidate>
          <div class="p-5 space-y-4">
            <div>
              <label class="rotulo" for="f-nome">Nome</label>
              <input id="f-nome" name="nome" type="text" maxlength="80" placeholder="Ex.: Godot 4.3" class="campo mt-1">
              ${erroDe('nome')}
            </div>
            <div>
              <label class="rotulo" for="f-site">Site para baixar <span class="normal-case font-normal tracking-normal text-slate-400">(opcional)</span></label>
              <input id="f-site" name="site" type="url" placeholder="https://godotengine.org/download" class="campo mt-1">
              ${erroDe('site')}
            </div>
            <div>
              <label class="rotulo" for="f-observacao">Como instalar <span class="normal-case font-normal tracking-normal text-slate-400">(opcional)</span></label>
              <textarea id="f-observacao" name="observacao" rows="3" maxlength="300" placeholder="Ex.: portable, descompactar em C:\\godot" class="campo mt-1"></textarea>
            </div>
            ${caixaSugerir('Sugerir também para o curso — vale para as próximas turmas.', true)}
          </div>
          ${rodapeModal('Adicionar')}
        </form>`, 'max-w-md');
      const form = $('form-req-livre');
      $('f-nome').focus();
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const dados = { nome: form.nome.value, observacao: form.observacao.value, site: form.site.value };
        if (mostrarErros(form, Turmas.validarSoftwareLivreRequisito(dados, reqDaTurma().softwares))) return;
        const sugerir = form.querySelector('[name="sugerir"]').checked;
        fecharModal();
        salvarRequisitos(
          (lista) => Turmas.adicionarSoftwareLivreRequisito(lista, d.turma.id, dados, { curso: d.curso, autor: instrutor.nome }),
          `"${dados.nome.trim()}" na lista da sua turma.`,
          sugerir ? { tipo: 'incluir', softwareId: null, nome: dados.nome.trim(), observacao: dados.observacao, site: dados.site } : null,
        );
      });
    }

    function modalObservacao(chave) {
      const item = reqDaTurma().softwares.find((s) => Turmas.chaveSoftware(s) === chave);
      if (!item) return;
      const cat = catalogoDe(item);
      abrirModal(`${cabecalhoModal(esc(item.nome), cat ? `${esc(cat.grupo)}${cat.versao ? ` · versão ${esc(cat.versao)}` : ''}${cat.observacao ? `<br><span class="text-slate-400">Suporte: ${esc(cat.observacao)}</span>` : ''}` : 'Fora do catálogo.')}
        <form id="form-req-obs" novalidate>
          <div class="p-5 space-y-4">
            ${cat ? '' : `<div>
              <label class="rotulo" for="f-site">Site para baixar <span class="normal-case font-normal tracking-normal text-slate-400">(opcional)</span></label>
              <input id="f-site" name="site" type="url" placeholder="https://godotengine.org/download" value="${esc(item.site ?? '')}" class="campo mt-1">
              ${erroDe('site')}
            </div>`}
            <div>
              <label class="rotulo" for="f-observacao">Observação para esta turma</label>
              <textarea id="f-observacao" name="observacao" rows="3" maxlength="300" placeholder="Ex.: versão, extensão ou configuração que a aula precisa" class="campo mt-1">${esc(item.observacao)}</textarea>
            </div>
          </div>
          ${rodapeModal('Salvar')}
        </form>`, 'max-w-md');
      const form = $('form-req-obs');
      $('f-observacao').focus();
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const obs = form.observacao.value;
        const site = form.site?.value;
        if (site !== undefined && mostrarErros(form, Cursos.validarSite(site))) return;
        fecharModal();
        salvarRequisitos((lista) => Turmas.atualizarObservacaoRequisito(lista, d.turma.id, chave, obs, { curso: d.curso, autor: instrutor.nome, ...(site === undefined ? {} : { site }) }), 'Observação salva.');
      });
    }

    function modalRemover(chave) {
      const item = reqDaTurma().softwares.find((s) => Turmas.chaveSoftware(s) === chave);
      if (!item) return;
      const doCurso = item.origem === 'curso';
      abrirModal(`${cabecalhoModal(`Tirar ${esc(item.nome)} da turma`, `Sai da lista da <strong>${esc(d.turma.codigo)}</strong> — o suporte não vai mais instalar para esta turma.`)}
        <form id="form-req-remover" novalidate>
          <div class="p-5 space-y-4">
            <p class="text-sm text-slate-600 dark:text-neutral-300">${doCurso ? 'Este software veio do catálogo do curso. Tirar aqui vale só para a sua turma.' : 'Este software foi adicionado nesta turma.'}</p>
            ${doCurso ? caixaSugerir('Sugerir tirar do curso também — vale para as próximas turmas.', false) : ''}
          </div>
          ${rodapeModal('Tirar da turma')}
        </form>`, 'max-w-md');
      const form = $('form-req-remover');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const sugerir = Boolean(form.querySelector('[name="sugerir"]')?.checked);
        fecharModal();
        salvarRequisitos(
          (lista) => Turmas.removerSoftwareRequisito(lista, d.turma.id, chave, { curso: d.curso, autor: instrutor.nome }),
          `"${item.nome}" fora da lista da sua turma.`,
          sugerir ? { tipo: 'remover', softwareId: item.softwareId, nome: item.nome } : null,
        );
      });
    }

    function renderAbas() {
      $('abas').innerHTML = ABAS.map((x) => (x.id === 'requisitos' ? { ...x, n: Turmas.requisitos(d.turma, d.curso).softwares.length } : x)).map((x) => `
        <button type="button" data-aba="${x.id}" class="px-1 pb-2.5 -mb-px text-sm border-b-2 transition whitespace-nowrap ${estado.aba === x.id ? 'border-[color:var(--f-marca-tinta)] text-slate-900 dark:text-neutral-100 font-medium' : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'}">${x.titulo}${x.n != null ? ` <span class="ml-1 text-xs text-slate-400 tabular-nums">${x.n}</span>` : ''}</button>`).join('');
    }
    function renderAba() {
      renderAbas();
      const q = new URLSearchParams(location.search); q.set('aba', estado.aba);
      history.replaceState(null, '', `?${q}`);
      $('conteudo-aba').innerHTML = { visao: abaVisao, alunos: abaAlunos, aulas: abaAulas, requisitos: abaRequisitos }[estado.aba]();
      if (estado.aba === 'requisitos') ligarRequisitos();
    }

    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-aba]');
      if (b) { estado.aba = b.dataset.aba; renderAba(); return; }
      const l = e.target.closest('[data-aba-link]');
      if (l) { e.preventDefault(); estado.aba = l.dataset.abaLink; renderAba(); }
    });

    renderAba();
  }

  // ---------- Render ----------

  if (MODO === 'detalhe') {
    const t = ts.find((x) => x.turma.id === turmaId) ?? null;
    if (!t) {
      $('titulo').textContent = 'Turma';
      $('tela-erro').classList.remove('hidden');
    } else {
      renderDetalhe(montarDetalhe(t));
    }
  } else {
    renderLista();
  }
})();
