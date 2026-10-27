// Portal do Aluno — Meus cursos (UI). Só leitura: matrículas, turmas, aulas e conteúdo vêm do administrativo.
// Lista (cursos.html) agrupada por formação + detalhe do curso em página separada (curso.html?turma=<id>) com abas.
// A URL antiga cursos.html?turma= redireciona para curso.html.
(() => {
  const aluno = PortalAluno.alunoLogado();
  if (!aluno) { PortalAluno.sair(); location.replace('login.html'); return; }

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hoje = PortalAluno.hoje();
  const data = (iso) => esc(PortalAluno.fmtData(String(iso ?? '').slice(0, 10)));
  const horas = (h) => `${Number.isInteger(h) ? h : String(h).replace('.', ',')} h`;
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

  const PONTO = { concluida: 'bg-slate-400', em_andamento: 'bg-emerald-500', a_iniciar: 'bg-sky-500', desistiu: 'bg-amber-500', cancelada: 'bg-red-500' };
  const SIT = PortalAluno.SITUACOES_MATRICULA;
  const FORMATO = { presencial: 'Presencial', online: 'Online ao vivo', hibrido: 'Híbrido', ead: 'EAD' };
  const AULA = {
    realizada: { nome: 'Realizada', ponto: 'bg-slate-400' },
    hoje: { nome: 'Hoje', ponto: 'bg-laranja' },
    prevista: { nome: 'Prevista', ponto: 'bg-sky-500' },
    cancelada: { nome: 'Cancelada', ponto: 'bg-red-500' },
  };
  const TIPO_MATERIAL = { video: 'Vídeo', arquivo: 'Arquivo', link: 'Link' };
  const ponto = (cor, texto) => `<span class="inline-flex items-center gap-1.5 whitespace-nowrap"><span class="h-2 w-2 rounded-full ${cor} shrink-0"></span>${esc(texto)}</span>`;
  const situacao = (id) => ponto(PONTO[id] ?? 'bg-slate-400', SIT[id]?.nome ?? id);
  // Presença: "92% · Em dia" com ponto colorido (STATUS_FREQUENCIA / STATUS_PRESENCA vêm de js/presencas-data.js).
  const temPresencas = typeof Presencas !== 'undefined';
  const freqStatus = (f) => (temPresencas ? Presencas.statusFrequenciaDe(f?.status ?? 'sem_aulas') : null);
  const presencaTexto = (f, { curto = false } = {}) => {
    if (!f || !temPresencas) return '<span class="text-slate-400">—</span>';
    const s = freqStatus(f);
    if (f.status === 'sem_aulas') return ponto(s.ponto, curto ? '—' : 'Sem aulas dadas');
    return `<span class="inline-flex items-center gap-1.5 whitespace-nowrap"><span class="h-2 w-2 rounded-full ${s.ponto} shrink-0"></span><span class="tabular-nums">${f.percentual}%</span><span class="text-slate-400">·</span>${esc(s.nome)}</span>`;
  };
  const barraPresenca = (f) => {
    const cor = { ok: 'bg-emerald-500', atencao: 'bg-amber-500', risco: 'bg-red-500', reprovado_frequencia: 'bg-red-500', sem_aulas: 'bg-slate-300' }[f?.status] ?? 'bg-slate-300';
    return `<div class="barra-progresso"><div class="h-full rounded-full ${cor}" style="width:${Math.max(0, Math.min(100, f?.percentual ?? 0))}%"></div></div>`;
  };
  const presencaAula = (a) => {
    if (!temPresencas || a.situacaoAula !== 'realizada') return '<span class="text-slate-400">—</span>';
    if (!a.presenca) return ponto('bg-slate-300', 'Sem registro');
    const s = Presencas.statusDe(a.presenca.status);
    const extra = a.presenca.status === 'atraso' && a.presenca.minutos ? ` (${a.presenca.minutos} min)` : '';
    const hor = Presencas.horarioTexto(a.presenca);
    return `${ponto(s?.ponto ?? 'bg-slate-400', `${s?.nome ?? a.presenca.status}${extra}`)}${hor ? `<p class="text-xs text-slate-500 dark:text-neutral-400">${esc(hor)}</p>` : ''}${a.presenca.observacao ? `<p class="text-xs text-slate-500 dark:text-neutral-400">${esc(a.presenca.observacao)}</p>` : ''}`;
  };
  const barra = (pct, concluido = false) => `<div class="barra-progresso"><div class="h-full rounded-full ${concluido ? 'bg-slate-400 dark:bg-neutral-600' : 'bg-petrol-800 dark:bg-sky-400'}" style="width:${Math.max(0, Math.min(100, pct))}%"></div></div>`;
  const chipArea = (area) => {
    if (!area) return '';
    const cor = Areas.cor(area);
    return `<span class="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cor.pilula}"><span class="h-1.5 w-1.5 rounded-full ${cor.ponto}"></span>${esc(area.nome)}</span>`;
  };
  const meetOnline = (m) => Boolean(m.turma.meetLink && (m.turma.formato === 'online' || m.turma.formato === 'hibrido'));
  const meetOuSala = (m) => {
    const online = meetOnline(m);
    const sala = m.sala ? esc(m.sala.nome) : '';
    if (online) return `${sala ? `${sala} · ` : ''}<a href="${esc(m.turma.meetLink)}" target="_blank" rel="noopener" class="botao-pri !py-1 !px-2.5 text-xs">Entrar no Meet</a>`;
    return sala || '<span class="text-slate-400">Sala a definir</span>';
  };

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast-anim pointer-events-auto rounded-lg bg-slate-900 dark:bg-neutral-800 text-white text-sm px-4 py-2 shadow-lg';
    el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  // ---------- Cabeçalho (igual à home) ----------

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
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { fecharMenu(); fecharModal(); } });
  document.querySelectorAll('[data-em-breve]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); toast(`"${el.textContent.trim()}" ainda não foi desenhada no protótipo.`); }));
  $('sair').addEventListener('click', () => { PortalAluno.sair(); location.replace('login.html'); });

  // ---------- Modal centralizado ----------

  function abrirModal(html) {
    $('modal-caixa').innerHTML = html;
    $('modal').classList.remove('hidden');
    $('modal-caixa').querySelector('[data-fechar]')?.focus();
  }
  function fecharModal() { $('modal').classList.add('hidden'); $('modal-caixa').innerHTML = ''; }
  $('modal').addEventListener('click', (e) => { if (e.target === $('modal')) fecharModal(); });
  $('modal-caixa').addEventListener('click', (e) => { if (e.target.closest('[data-fechar]')) fecharModal(); });
  const cabecalhoModal = (titulo, sub = '') => `
    <div class="px-5 py-4 border-b border-slate-100 dark:border-neutral-900 flex items-start justify-between gap-3">
      <div><p class="titulo-secao">${esc(titulo)}</p>${sub ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${sub}</p>` : ''}</div>
      <button type="button" data-fechar title="Fechar" class="-mr-1 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-900"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
    </div>`;
  const rodapeModal = (extra = '') => `<div class="px-5 py-3 border-t border-slate-100 dark:border-neutral-900 flex justify-end gap-2">${extra}<button type="button" data-fechar class="botao-sec">Fechar</button></div>`;

  // ---------- Dados / estado ----------

  const params = new URLSearchParams(location.search);
  const turmaId = params.get('turma');
  const MODO = document.body.dataset.modo === 'detalhe' ? 'detalhe' : 'lista';
  // Lista com ?turma= (URL antiga) → página de detalhe; detalhe sem turma → lista.
  if (MODO === 'lista' && turmaId) { location.replace(`curso.html?turma=${encodeURIComponent(turmaId)}${params.get('aba') ? `&aba=${params.get('aba')}` : ''}`); return; }
  if (MODO === 'detalhe' && !turmaId) { location.replace('cursos.html'); return; }
  const vazio = (msg) => `<div class="cartao p-8 text-center text-sm text-slate-500 dark:text-neutral-400">${msg}</div>`;
  const cartaoTotal = (rotulo, valor, texto = '') => `<div class="cartao p-5"><p class="rotulo">${esc(rotulo)}</p><p class="font-display font-semibold text-lg text-slate-900 dark:text-neutral-100 mt-1.5 leading-snug tabular-nums">${valor}</p>${texto ? `<p class="text-sm text-slate-500 dark:text-neutral-400 mt-1">${texto}</p>` : ''}</div>`;

  // ============================================================
  // LISTA
  // ============================================================

  function renderLista() {
    const dados = PortalAluno.cursosAgrupados(aluno.id, hoje);
    const estado = { filtro: 'todos', aberto: {} };
    dados.grupos.forEach((g) => { estado.aberto[g.chave] = true; });
    $('tela-lista').classList.remove('hidden');
    $('subtitulo').textContent = `Referência ${PortalAluno.fmtData(hoje)}`;

    const t = dados.totais;
    $('totais').innerHTML = [
      cartaoTotal('Formações', t.formacoes, t.formacoes ? plural(dados.grupos.filter((g) => g.formacao && g.situacao === 'em_andamento').length, 'em andamento', 'em andamento') : 'Nenhuma formação'),
      cartaoTotal('Cursos', t.cursos, !t.cursos ? 'Nenhuma matrícula' : dados.grupos.some((g) => !g.formacao) ? plural(dados.grupos.find((g) => !g.formacao).itens.length, 'avulso', 'avulsos') : 'Todos em formações'),
      cartaoTotal('Concluídos', t.concluidos, t.cursos ? `${Math.round((t.concluidos / t.cursos) * 100)}% do total` : ''),
      cartaoTotal('Em andamento', t.emAndamento, t.aIniciar ? `${plural(t.aIniciar, 'curso a iniciar', 'cursos a iniciar')}` : 'Nenhum a iniciar'),
      cartaoTotal('Horas concluídas', `${esc(horas(t.horasConcluidas))} <span class="text-sm font-sans font-normal text-slate-500 dark:text-neutral-400">de ${esc(horas(t.horas))}</span>`, t.horas ? `${Math.round((t.horasConcluidas / t.horas) * 100)}% da carga horária` : ''),
    ].join('');

    const passaFiltro = (m) => estado.filtro === 'todos'
      || (estado.filtro === 'em_andamento' && m.situacaoAluno === 'em_andamento')
      || (estado.filtro === 'a_iniciar' && m.situacaoAluno === 'a_iniciar')
      || (estado.filtro === 'concluidos' && m.situacaoAluno === 'concluida');

    function linha(m, i, mostrarContrato) {
      const encerrada = m.situacaoAluno === 'desistiu' || m.situacaoAluno === 'cancelada';
      const concluido = m.situacaoAluno === 'concluida';
      const total = m.aulas.length;
      const feitas = concluido ? total : m.realizadas;
      return `<tr class="${encerrada ? 'opacity-60' : ''} hover:bg-slate-100/70 dark:hover:bg-neutral-900 cursor-pointer transition" data-href="curso.html?turma=${encodeURIComponent(m.turma.id)}" tabindex="0">
        <td class="tabular-nums text-slate-500 dark:text-neutral-400 w-10">${i + 1}</td>
        <td><p class="font-medium text-slate-900 dark:text-neutral-100">${esc(m.curso?.nome ?? m.turma.codigo)}</p><p class="text-xs text-slate-500 dark:text-neutral-400"><span class="font-mono">${esc(m.turma.codigo)}</span> · ${esc(horas(m.horas))}${mostrarContrato ? ` · <a href="contrato.html?id=${encodeURIComponent(m.contrato.id)}" class="link !text-xs">Contrato ${esc(m.contrato.codigo)}</a>` : ''}</p></td>
        <td class="tabular-nums whitespace-nowrap">${data(m.turma.inicio)} – ${data(m.turma.fim)}</td>
        <td class="whitespace-nowrap">${esc(m.turma.turno || '—')}</td>
        <td class="whitespace-nowrap">${esc(FORMATO[m.turma.formato] ?? m.turma.formato ?? '—')}</td>
        <td>${esc(m.instrutor?.nome ?? '—')}</td>
        <td class="min-w-36"><div class="flex items-center gap-2"><div class="flex-1">${barra(total ? (feitas / total) * 100 : 0, concluido)}</div><span class="text-xs tabular-nums text-slate-500 dark:text-neutral-400 shrink-0">${feitas}/${total}</span></div></td>
        <td>${presencaTexto(m.frequencia)}</td>
        <td>${situacao(m.situacaoAluno)}</td>
        <td class="text-right"><a href="curso.html?turma=${encodeURIComponent(m.turma.id)}" class="botao-sec !py-1">Abrir</a></td>
      </tr>`;
    }

    const tabela = (itens, mostrarContrato) => `<div class="overflow-x-auto"><table class="tabela w-full">
      <thead><tr><th>Nº</th><th>Curso</th><th>Período</th><th>Horário</th><th>Formato</th><th>Instrutor</th><th>Aulas</th><th>Presença</th><th>Situação</th><th></th></tr></thead>
      <tbody>${itens.map((m, i) => linha(m, i, mostrarContrato)).join('')}</tbody>
    </table></div>`;

    function grupo(g) {
      const itens = g.itens.filter(passaFiltro);
      if (!itens.length) return '';
      const aberto = estado.aberto[g.chave];
      const f = g.formacao;
      const titulo = f ? esc(f.nome) : 'Cursos avulsos';
      const sub = f
        ? `${esc(f.codigo)}${g.turno ? ` · ${esc(g.turno)}` : ''} · ${data(g.inicio)} – ${data(g.fim)}`
        : `${plural(g.itens.length, 'curso contratado à parte', 'cursos contratados à parte')} · ${data(g.inicio)} – ${data(g.fim)}`;
      const nAtivos = g.itens.filter((m) => m.situacaoAluno !== 'desistiu' && m.situacaoAluno !== 'cancelada').length;
      const progresso = `${g.concluidos} de ${nAtivos} cursos · ${esc(horas(g.horasConcluidas))} de ${esc(horas(g.horas))}`;
      return `
        <article class="cartao overflow-hidden" data-grupo="${esc(g.chave)}">
          <div class="flex items-stretch">
            <button type="button" data-acao="alternar" data-grupo="${esc(g.chave)}" aria-expanded="${aberto}" class="flex-1 min-w-0 text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-neutral-900/60 transition">
              <p class="rotulo">${f ? 'Formação' : 'Avulsos'}</p>
              <p class="font-display font-semibold text-slate-900 dark:text-neutral-100 mt-0.5 truncate">${titulo}</p>
              <p class="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">${sub}</p>
              <div class="mt-3 flex items-center gap-3 max-w-xl"><div class="flex-1">${barra(g.horas ? (g.horasConcluidas / g.horas) * 100 : 0, g.situacao === 'concluida')}</div><p class="text-xs tabular-nums text-slate-500 dark:text-neutral-400 shrink-0">${progresso}</p></div>
            </button>
            <div class="flex items-center gap-4 shrink-0 pr-5 py-4">
              <div class="text-right hidden sm:block">
                <p class="text-sm text-slate-600 dark:text-neutral-300">${situacao(g.situacao)}</p>
                ${g.frequencia && g.frequencia.dadas ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-1">Presença ${presencaTexto(g.frequencia)}</p>` : ''}
                ${f ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-1">${esc(g.contratante)} · <a href="contrato.html?id=${encodeURIComponent(g.contrato.id)}" class="link !text-xs">Ver contrato</a></p>` : ''}
              </div>
              <button type="button" data-acao="alternar" data-grupo="${esc(g.chave)}" title="${aberto ? 'Minimizar' : 'Expandir'}" class="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-900"><svg class="h-5 w-5 transition ${aberto ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg></button>
            </div>
          </div>
          <div class="${aberto ? '' : 'hidden'} border-t border-slate-100 dark:border-neutral-900">${tabela(itens, !f)}</div>
        </article>`;
    }

    function renderGrupos() {
      if (!dados.grupos.length) {
        $('grupos').innerHTML = vazio('Você ainda não está matriculado em nenhum curso. Dúvidas? Fale com a secretaria.');
        $('acoes-topo').innerHTML = '';
        return;
      }
      const html = dados.grupos.map(grupo).join('');
      const nomeFiltro = { em_andamento: 'em andamento', a_iniciar: 'a iniciar', concluidos: 'concluído' }[estado.filtro];
      $('grupos').innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-slate-500 dark:text-neutral-400">${plural(dados.totais.cursos, 'curso', 'cursos')} em ${plural(dados.grupos.length, 'grupo', 'grupos')}, na ordem da formação.</p>
          <label class="flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-300">Mostrar
            <select data-filtro class="select">
              <option value="todos" ${estado.filtro === 'todos' ? 'selected' : ''}>Todos</option>
              <option value="em_andamento" ${estado.filtro === 'em_andamento' ? 'selected' : ''}>Em andamento</option>
              <option value="a_iniciar" ${estado.filtro === 'a_iniciar' ? 'selected' : ''}>A iniciar</option>
              <option value="concluidos" ${estado.filtro === 'concluidos' ? 'selected' : ''}>Concluídos</option>
            </select>
          </label>
        </div>
        ${html || vazio(`Nenhum curso ${nomeFiltro}.`)}`;
      const todosAbertos = dados.grupos.every((g) => estado.aberto[g.chave]);
      $('acoes-topo').innerHTML = dados.grupos.length > 1 ? `<button type="button" id="alternar-todos" class="botao-sec">${todosAbertos ? 'Minimizar todos' : 'Expandir todos'}</button>` : '';
      $('alternar-todos')?.addEventListener('click', () => {
        dados.grupos.forEach((g) => { estado.aberto[g.chave] = !todosAbertos; });
        renderGrupos();
      });
    }

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-acao="alternar"]');
      if (btn) { estado.aberto[btn.dataset.grupo] = !estado.aberto[btn.dataset.grupo]; renderGrupos(); return; }
      // Linha inteira abre o curso; links dentro da linha (Abrir, Contrato) seguem o próprio href.
      if (e.target.closest('a, button')) return;
      const tr = e.target.closest('tr[data-href]');
      if (tr) location.href = tr.dataset.href;
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.target.closest('a, button, input, select')) return;
      const tr = e.target.closest('tr[data-href]');
      if (tr) location.href = tr.dataset.href;
    });
    document.addEventListener('change', (e) => {
      const sel = e.target.closest('[data-filtro]');
      if (!sel) return;
      estado.filtro = sel.value;
      renderGrupos();
    });
    renderGrupos();
  }

  // ============================================================
  // DETALHE DO CURSO
  // ============================================================

  function renderDetalhe(d) {
    const ABAS = [
      { id: 'visao', titulo: 'Visão geral' },
      { id: 'aulas', titulo: 'Aulas', n: d.aulas.length },
      { id: 'conteudo', titulo: 'Conteúdo', n: d.modulos.length },
      { id: 'materiais', titulo: 'Materiais e requisitos', n: d.materiais.length + d.softwares.length },
      { id: 'certificado', titulo: 'Certificado' },
    ];
    const abaUrl = params.get('aba');
    const estado = { aba: ABAS.some((x) => x.id === abaUrl) ? abaUrl : 'visao' };
    const nomeCurso = d.curso?.nome ?? d.turma.codigo;
    $('tela-detalhe').classList.remove('hidden');
    $('titulo').textContent = nomeCurso;
    $('subtitulo').innerHTML = `<span class="font-mono">${esc(d.turma.codigo)}</span> · ${d.formacao ? `${esc(d.formacao.nome)} · ` : 'Curso avulso · '}${data(d.turma.inicio)} – ${data(d.turma.fim)}`;
    const bc = $('breadcrumb');
    bc.classList.remove('hidden');
    const sep = '<svg class="h-3.5 w-3.5 text-slate-300 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>';
    bc.innerHTML = `<a href="cursos.html" class="hover:underline">Meus cursos</a>${d.formacao ? `${sep}<span>${esc(d.formacao.nome)}</span>` : `${sep}<span>Cursos avulsos</span>`}${sep}<span class="text-slate-800 dark:text-neutral-100 font-medium">${esc(nomeCurso)}</span>`;

    // Avaliações que este aluno respondeu em avaliacao-aluno.html, nesta turma.
    const envios = PortalAluno.enviosAvaliacao(aluno.id).filter((e) => e.turmaId === d.turma.id);
    const envioFinal = envios.find((e) => e.modalidade === 'final') ?? null;
    const envioDiaria = (iso) => envios.find((e) => e.modalidade === 'diaria' && e.data === iso) ?? null;
    const linkAvaliar = (modalidade, texto, cls = 'botao-pri') => `<a href="../avaliacao-aluno.html?turma=${encodeURIComponent(d.turma.id)}&modalidade=${modalidade}" class="${cls}">${texto}</a>`;

    // Ações do topo: contrato + avaliação (final quando concluído; diária quando há aula hoje); respondida vira texto.
    const acoes = [`<a href="contrato.html?id=${encodeURIComponent(d.contrato.id)}" class="botao-sec">Ver contrato</a>`];
    if (d.situacaoAluno === 'concluida') acoes.push(envioFinal ? `<span class="text-sm text-slate-600 dark:text-neutral-300">${ponto('bg-emerald-500', `Avaliação do curso respondida em ${PortalAluno.fmtData(envioFinal.data)}`)}</span>` : linkAvaliar('final', 'Avaliar o curso'));
    else if (d.situacaoAluno === 'em_andamento' && d.aulaHoje) acoes.push(envioDiaria(hoje) ? `<span class="text-sm text-slate-600 dark:text-neutral-300">${ponto('bg-emerald-500', 'Avaliação de hoje respondida')}</span>` : linkAvaliar('diaria', 'Avaliar a aula de hoje'));
    $('acoes-topo').innerHTML = acoes.join('');

    // Situação das avaliações para a visão geral.
    function avaliacoesTexto() {
      const aulasDadas = d.aulas.filter((a) => a.situacaoAula === 'realizada' || a.situacaoAula === 'hoje');
      const diarias = aulasDadas.filter((a) => envioDiaria(a.data)).length;
      const linhas = [];
      if (aulasDadas.length) linhas.push(`<p>${ponto(diarias === aulasDadas.length ? 'bg-emerald-500' : diarias ? 'bg-amber-500' : 'bg-slate-400', `Diárias: ${diarias} de ${aulasDadas.length} ${aulasDadas.length === 1 ? 'aula avaliada' : 'aulas avaliadas'}`)}</p>`);
      if (d.situacaoAluno === 'concluida') linhas.push(envioFinal
        ? `<p>${ponto('bg-emerald-500', `Final: respondida em ${PortalAluno.fmtData(envioFinal.data)}`)}</p>`
        : `<p>${ponto('bg-amber-500', 'Final: pendente')} · ${linkAvaliar('final', 'Responder agora', 'link')}</p>`);
      else linhas.push(`<p class="text-xs text-slate-500 dark:text-neutral-400">A avaliação final abre quando o curso terminar.</p>`);
      return linhas.join('');
    }

    // Resumo fixo acima das abas.
    const concluido = d.situacaoAluno === 'concluida';
    const total = d.aulas.filter((a) => a.situacaoAula !== 'cancelada').length;
    const feitas = concluido ? total : d.realizadasLista.length;
    $('resumo-curso').innerHTML = `
      <div class="cartao p-5 flex flex-wrap items-center gap-x-8 gap-y-3">
        <div class="flex items-center gap-3">${chipArea(d.area)}<p class="text-sm text-slate-600 dark:text-neutral-300">${situacao(d.situacaoAluno)}</p></div>
        <div class="flex-1 min-w-56 flex items-center gap-3"><div class="flex-1">${barra(total ? (feitas / total) * 100 : 0, concluido)}</div><p class="text-xs tabular-nums text-slate-500 dark:text-neutral-400 shrink-0">${feitas}/${total} aulas · ${esc(horas(d.horasConcluidas))} de ${esc(horas(d.horas))}</p></div>
        ${d.frequencia && d.frequencia.dadas ? `<div class="min-w-48 flex items-center gap-3"><div class="flex-1">${barraPresenca(d.frequencia)}</div><p class="text-xs text-slate-500 dark:text-neutral-400 shrink-0">Presença ${presencaTexto(d.frequencia)}</p></div>` : ''}
        <p class="text-sm text-slate-500 dark:text-neutral-400">Matrícula <span class="font-mono text-slate-800 dark:text-neutral-100">${esc(d.codigoMatricula || '—')}</span></p>
      </div>`;

    // Presença na visão geral: percentual + situação + contagens + mínimo.
    function presencaDetalhe() {
      const f = d.frequencia;
      if (!f) return '<span class="text-slate-500 dark:text-neutral-400">Não disponível.</span>';
      if (!f.dadas) return `<span class="text-slate-500 dark:text-neutral-400">Nenhuma aula dada ainda.</span><p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Frequência mínima de ${f.minimo}%.</p>`;
      const partes = [`${plural(f.presentes, 'presença', 'presenças')}`];
      if (f.atrasos) partes.push(`${plural(f.atrasos, 'atraso', 'atrasos')}`);
      if (f.justificadas) partes.push(`${plural(f.justificadas, 'falta justificada', 'faltas justificadas')}`);
      partes.push(`${plural(f.ausentes, 'falta', 'faltas')}`);
      if (f.semRegistro) partes.push(`${f.semRegistro} sem registro`);
      const nota = f.status === 'risco' ? `Abaixo do mínimo de ${f.minimo}% — ainda dá para recuperar nas próximas aulas.`
        : f.status === 'reprovado_frequencia' ? `Abaixo do mínimo de ${f.minimo}% — o certificado não é emitido.`
          : f.status === 'atencao' ? `Perto do mínimo de ${f.minimo}%.` : `Mínimo de ${f.minimo}% para o certificado.`;
      return `<p class="font-medium">${presencaTexto(f)}</p><p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(partes.join(' · '))} em ${plural(f.dadas, 'aula dada', 'aulas dadas')}</p><p class="text-xs text-slate-500 dark:text-neutral-400">${esc(nota)}</p>`;
    }

    const dado = (r, v) => `<div><p class="rotulo">${esc(r)}</p><div class="text-sm text-slate-800 dark:text-neutral-100 mt-0.5">${v}</div></div>`;

    function abaVisao() {
      const proxima = d.aulas.find((a) => a.situacaoAula === 'hoje' || a.situacaoAula === 'prevista');
      const posicao = d.formacao && d.ordem >= 0 ? `${d.ordem + 1}º de ${d.formacaoItens.length} cursos da formação` : 'Curso avulso';
      return `
        <div class="cartao p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
          ${dado('Curso', `<p class="font-medium">${esc(nomeCurso)}</p><p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(d.curso?.codigo ?? '')} · ${esc(horas(d.horas))}${d.curso?.nivel ? ` · ${esc(NIVEIS.find((n) => n.id === d.curso.nivel)?.nome ?? '')}` : ''}</p>`)}
          ${dado('Formação', d.formacao ? `<a href="cursos.html" class="link">${esc(d.formacao.nome)}</a><p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(posicao)}</p>` : '<span class="text-slate-500 dark:text-neutral-400">Curso avulso</span>')}
          ${dado('Turma', `<span class="font-mono">${esc(d.turma.codigo)}</span>`)}
          ${dado('Período', `${data(d.turma.inicio)} – ${data(d.turma.fim)}`)}
          ${dado('Horário', esc(d.turma.turno || '—'))}
          ${dado('Formato', esc(FORMATO[d.turma.formato] ?? d.turma.formato ?? '—'))}
          ${dado(d.turma.meetLink ? 'Local / Meet' : 'Sala', meetOuSala(d))}
          ${dado('Instrutor', d.instrutor ? `${esc(d.instrutor.nome)}${d.instrutor.especialidade ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(d.instrutor.especialidade)}</p>` : ''}` : '—')}
          ${dado('Próxima aula', proxima ? `${esc(PortalAluno.rotuloDia(proxima.data, hoje))} · ${esc(proxima.inicio)}–${esc(proxima.fim)}${proxima.situacaoAula === 'hoje' && meetOnline(d) ? `<p class="mt-1.5"><a href="${esc(d.turma.meetLink)}" target="_blank" rel="noopener" class="botao-pri !py-1 !px-2.5 text-xs">Entrar no Meet</a></p>` : ''}` : concluido ? 'Curso concluído' : '—')}
          ${dado('Progresso', `${feitas} de ${total} aulas · ${esc(horas(d.horasConcluidas))} de ${esc(horas(d.horas))}`)}
          ${dado('Matrícula', `<span class="font-mono">${esc(d.codigoMatricula || '—')}</span>`)}
          ${dado('Contrato', `<a href="contrato.html?id=${encodeURIComponent(d.contrato.id)}" class="link">${esc(d.contrato.codigo)}</a><p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(d.contratante)}</p>`)}
          ${dado('Situação', situacao(d.situacaoAluno))}
          ${dado('Presença', presencaDetalhe())}
          ${dado('Avaliações', avaliacoesTexto())}
        </div>
        ${d.curso?.resumo ? `<div class="cartao p-5 mt-5"><p class="rotulo mb-1.5">Sobre o curso</p><p class="text-sm text-slate-700 dark:text-neutral-200">${esc(d.curso.descricao || d.curso.resumo)}</p></div>` : ''}`;
    }

    function abaAulas() {
      if (!d.aulas.length) return vazio('As aulas desta turma ainda não foram agendadas.');
      const nomeModulos = (a) => (a.moduloIds ?? []).map((id) => d.modulos.find((m) => m.id === id)?.titulo).filter(Boolean);
      const estimadas = !Turmas.temAgendamento(d.turma) && d.situacaoAluno !== 'concluida';
      return `
        ${estimadas ? '<p class="text-sm text-slate-500 dark:text-neutral-400 mb-3">Datas previstas pela agenda da turma; o conteúdo de cada aula aparece quando a secretaria confirmar o agendamento.</p>' : ''}
        <div class="cartao overflow-hidden"><div class="overflow-x-auto"><table class="tabela w-full">
          <thead><tr><th>Nº</th><th>Data</th><th>Horário</th><th>Conteúdo</th><th>Sala</th><th>Status</th><th>Presença</th><th>Avaliação</th><th>Gravação</th></tr></thead>
          <tbody>${d.aulas.map((a) => {
            const s = AULA[a.situacaoAula];
            const mods = nomeModulos(a);
            const conteudo = a.conteudo || mods.join(' · ');
            return `<tr class="${a.situacaoAula === 'cancelada' ? 'opacity-60' : a.situacaoAula === 'hoje' ? 'bg-laranja/10 dark:bg-laranja/10' : ''}">
              <td class="tabular-nums text-slate-500 dark:text-neutral-400">${a.n ?? '—'}</td>
              <td class="whitespace-nowrap tabular-nums">${data(a.data)} <span class="text-xs text-slate-500 dark:text-neutral-400">${esc(PortalAluno.diaSemana(a.data).slice(0, 3))}</span></td>
              <td class="whitespace-nowrap tabular-nums">${esc(a.inicio)}–${esc(a.fim)}</td>
              <td>${conteudo ? esc(conteudo) : '<span class="text-slate-400">—</span>'}${a.conteudo && mods.length ? `<p class="text-xs text-slate-500 dark:text-neutral-400">${esc(mods.join(' · '))}</p>` : ''}${a.status === 'cancelada' && a.motivo ? `<p class="text-xs text-red-600 dark:text-red-400">${esc(Aulas.MOTIVOS?.find((x) => x.id === a.motivo)?.nome ?? a.motivo)}</p>` : ''}</td>
              <td>${a.sala ? esc(a.sala.nome) : d.turma.meetLink ? 'Google Meet' : '—'}${a.situacaoAula === 'hoje' && meetOnline(d) ? ` <a href="${esc(d.turma.meetLink)}" target="_blank" rel="noopener" class="link text-xs whitespace-nowrap ml-1">Entrar no Meet</a>` : ''}</td>
              <td>${ponto(s.ponto, s.nome)}</td>
              <td>${presencaAula(a)}</td>
              <td>${a.situacaoAula === 'realizada' || a.situacaoAula === 'hoje' ? (envioDiaria(a.data) ? ponto('bg-emerald-500', 'Respondida') : a.situacaoAula === 'hoje' ? linkAvaliar('diaria', 'Avaliar agora', 'link') : ponto('bg-slate-400', 'Não respondida')) : '<span class="text-slate-400">—</span>'}</td>
              <td>${a.gravacoes.length ? a.gravacoes.map((g) => `<a href="${esc(g.url)}" target="_blank" rel="noopener" class="link block">${esc(g.titulo)}${g.duracaoMin ? ` <span class="text-xs text-slate-400">· ${esc(Turmas.duracaoTexto(g.duracaoMin))}</span>` : ''}</a>`).join('') : '<span class="text-slate-400">—</span>'}</td>
            </tr>`;
          }).join('')}</tbody>
        </table></div></div>`;
    }

    function abaConteudo() {
      if (!d.modulos.length) return vazio('O conteúdo programático deste curso ainda não foi cadastrado.');
      const dados = d.modulos.filter((m) => m.dado).length;
      const estimado = d.modulos.some((m) => m.estimado);
      const horasMod = d.modulos.reduce((s, m) => s + (Number(m.cargaHoraria) || 0), 0);
      return `
        <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p class="text-sm text-slate-500 dark:text-neutral-400">${plural(d.modulos.length, 'módulo', 'módulos')} · ${esc(horas(horasMod))} · ${dados} ${dados === 1 ? 'já dado' : 'já dados'}${estimado ? ' (estimativa pelas horas de aula)' : ''}.</p>
        </div>
        <div class="cartao divide-y divide-slate-100 dark:divide-neutral-900">${d.modulos.map((m, i) => `
          <div class="px-5 py-4 flex items-start gap-4 ${m.dado ? '' : ''}">
            <div class="shrink-0 h-7 w-7 rounded-full grid place-items-center text-xs font-semibold ${m.dado ? 'bg-emerald-500 text-white' : m.emAndamento ? 'bg-laranja text-white' : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400'}">${m.dado ? '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>' : i + 1}</div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="font-medium text-slate-900 dark:text-neutral-100">${esc(m.titulo)}</p>
                <p class="text-xs text-slate-500 dark:text-neutral-400 tabular-nums">${esc(horas(Number(m.cargaHoraria) || 0))} · ${m.dado ? ponto('bg-emerald-500', 'Dado') : m.emAndamento ? ponto('bg-laranja', 'Em andamento') : ponto('bg-slate-400', 'A dar')}</p>
              </div>
              ${(m.topicos ?? []).length ? `<ol class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-600 dark:text-neutral-300 list-decimal list-inside">${m.topicos.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}
            </div>
          </div>`).join('')}</div>`;
    }

    function abaMateriais() {
      const iconeMaterial = { video: 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z', arquivo: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', link: 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244' };
      const tamanho = (b) => (b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1).replace('.', ',')} MB` : `${Math.round(b / 1000)} KB`);
      const materiais = d.materiais.length
        ? `<div class="cartao divide-y divide-slate-100 dark:divide-neutral-900">${d.materiais.map((mt) => {
            const mod = mt.moduloId ? d.modulos.find((m) => m.id === mt.moduloId) : null;
            const sub = [TIPO_MATERIAL[mt.tipo], mt.arquivo ? tamanho(mt.arquivo.tamanho) : '', mt.duracaoMin ? Turmas.duracaoTexto(mt.duracaoMin) : '', mod ? mod.titulo : ''].filter(Boolean).join(' · ');
            return `<div class="px-5 py-3 flex items-center gap-4">
              <div class="shrink-0 h-9 w-9 rounded-lg bg-petrol-800/10 dark:bg-petrol-700/40 text-petrol-800 dark:text-sky-300 grid place-items-center"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="${iconeMaterial[mt.tipo] ?? iconeMaterial.link}" /></svg></div>
              <div class="min-w-0 flex-1"><p class="text-sm font-medium text-slate-900 dark:text-neutral-100 truncate">${esc(mt.nome)}</p><p class="text-xs text-slate-500 dark:text-neutral-400">${esc(sub)}${mt.descricao ? ` · ${esc(mt.descricao)}` : ''}</p></div>
              ${mt.url ? `<a href="${esc(mt.url)}" target="_blank" rel="noopener" class="link shrink-0">Abrir</a>` : `<button type="button" data-acao="baixar-material" data-nome="${esc(mt.nome)}" class="link shrink-0">Baixar</button>`}
            </div>`;
          }).join('')}</div>`
        : vazio('Nenhum material publicado para este curso ainda.');
      const softwares = d.softwares.length
        ? `<div class="cartao overflow-hidden"><div class="overflow-x-auto"><table class="tabela w-full">
            <thead><tr><th>Software</th><th>Versão</th><th>Onde baixar</th><th>Observação</th></tr></thead>
            <tbody>${d.softwares.map((s) => `<tr>
              <td class="font-medium text-slate-900 dark:text-neutral-100">${esc(s.nome)}</td>
              <td class="tabular-nums">${esc(s.catalogo?.versao || '—')}</td>
              <td>${s.catalogo?.site ? `<a href="${esc(s.catalogo.site)}" target="_blank" rel="noopener" class="link">${esc(s.catalogo.site.replace(/^https?:\/\//, '').replace(/\/.*$/, ''))}</a>` : '<span class="text-slate-400">—</span>'}</td>
              <td class="text-slate-500 dark:text-neutral-400">${esc(s.observacao || (s.catalogo?.requisitos ? `Requer ${s.catalogo.requisitos}` : '') || '—')}</td>
            </tr>`).join('')}</tbody>
          </table></div></div>`
        : vazio('Este curso não exige instalação de softwares.');
      const req = d.curso;
      const preReq = d.preRequisitos.length || req?.preRequisitosTexto;
      const requisitos = `
        <div class="cartao p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          ${dado('Pré-requisitos', preReq ? `${d.preRequisitos.length ? `<ol class="list-decimal list-inside space-y-0.5">${d.preRequisitos.map((c) => `<li>${esc(c.nome)} <span class="font-mono text-xs text-slate-400">${esc(c.codigo)}</span></li>`).join('')}</ol>` : ''}${req?.preRequisitosTexto ? `<p class="${d.preRequisitos.length ? 'mt-1.5 ' : ''}text-slate-600 dark:text-neutral-300">${esc(req.preRequisitosTexto)}</p>` : ''}` : '<span class="text-slate-500 dark:text-neutral-400">Nenhum — o curso não exige conhecimento prévio.</span>')}
          ${dado('Máquina', req?.infraestrutura?.requisitosMaquina ? esc(req.infraestrutura.requisitosMaquina) : '<span class="text-slate-500 dark:text-neutral-400">Sem requisito específico.</span>')}
          ${dado('Público-alvo', req?.publicoAlvo ? esc(req.publicoAlvo) : '—')}
          ${dado('Sala', req?.infraestrutura?.sala ? esc(SALAS.find((s) => s.id === req.infraestrutura.sala)?.nome ?? req.infraestrutura.sala) : '—')}
        </div>`;
      return `
        <div class="space-y-6">
          <section><h3 class="titulo-secao mb-3">Softwares requeridos <span class="text-xs font-sans font-normal text-slate-400 tabular-nums ml-1">${d.softwares.length}</span></h3>${softwares}<p class="text-xs text-slate-500 dark:text-neutral-400 mt-2">Nos laboratórios da ProWay tudo já vem instalado; a lista é para quem quer praticar em casa ou assiste online.</p></section>
          <section><h3 class="titulo-secao mb-3">Materiais do curso <span class="text-xs font-sans font-normal text-slate-400 tabular-nums ml-1">${d.materiais.length}</span></h3>${materiais}</section>
          <section><h3 class="titulo-secao mb-3">Pré-requisitos e infraestrutura</h3>${requisitos}</section>
        </div>`;
    }

    function abaCertificado() {
      const c = d.certificado;
      const cc = c.curso;
      const cf = c.formacao;
      const TOM = {
        disponivel: { cartao: 'rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 shadow-sm', ponto: 'bg-emerald-500', nome: 'Disponível' },
        em_curso: { cartao: 'cartao', ponto: 'bg-emerald-500', nome: 'Em andamento' },
        a_iniciar: { cartao: 'cartao', ponto: 'bg-sky-500', nome: 'A iniciar' },
        nao_emite: { cartao: 'cartao', ponto: 'bg-slate-400', nome: 'Não se aplica' },
        indisponivel: { cartao: 'cartao', ponto: 'bg-red-500', nome: 'Indisponível' },
      };
      const tom = TOM[c.situacao];
      const regrasCurso = cc?.emite
        ? `<ul class="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-neutral-300">
            <li>Frequência mínima de <strong>${esc(cc.frequenciaMinima ?? 75)}%</strong> das aulas.</li>
            ${cc.exigeAprovacao ? `<li>Aprovação na avaliação do curso com nota mínima <strong>${esc(String(cc.notaMinima ?? 7).replace('.', ','))}</strong>.</li>` : '<li>Sem prova: o certificado é de participação.</li>'}
            <li>Emitido pela ProWay em PDF, com código de verificação.</li>
          </ul>`
        : '<p class="text-sm text-slate-500 dark:text-neutral-400">Este curso não emite certificado próprio.</p>';
      const regrasFormacao = cf
        ? (cf.emite
          ? `<ul class="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-neutral-300">
              <li>${cf.exigeTodosObrigatorios ? 'Concluir <strong>todos os cursos obrigatórios</strong> da formação.' : 'Concluir os cursos da formação.'}</li>
              ${cf.minimoOptativos ? `<li>Concluir pelo menos <strong>${cf.minimoOptativos}</strong> ${cf.minimoOptativos === 1 ? 'curso optativo' : 'cursos optativos'}.</li>` : ''}
              <li>Cada curso da formação também tem o próprio certificado.</li>
            </ul>`
          : '<p class="text-sm text-slate-500 dark:text-neutral-400">A formação não emite certificado próprio.</p>')
        : '';
      const pend = d.aulas.filter((a) => a.situacaoAula !== 'realizada' && a.situacaoAula !== 'cancelada');
      const oQueFalta = c.situacao === 'em_curso' || c.situacao === 'a_iniciar'
        ? `<div class="mt-4"><p class="rotulo mb-1.5">O que falta</p><ul class="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-neutral-300">
            <li>${plural(pend.length, 'aula', 'aulas')} ${c.situacao === 'a_iniciar' ? 'a partir de' : 'até'} ${data(c.situacao === 'a_iniciar' ? d.turma.inicio : d.turma.fim)}.</li>
            ${cc?.exigeAprovacao ? '<li>Avaliação final com nota mínima.</li>' : ''}
            <li>${d.frequencia && d.frequencia.dadas ? `Frequência mínima de ${d.frequencia.minimo}% — hoje ${presencaTexto(d.frequencia)}.` : 'Frequência mínima confirmada pela secretaria.'}</li>
          </ul></div>`
        : c.motivo === 'frequencia'
          ? `<div class="mt-4"><p class="rotulo mb-1.5">Sua frequência</p><div class="flex items-center gap-3"><div class="flex-1">${barraPresenca(d.frequencia)}</div><p class="text-xs text-slate-500 dark:text-neutral-400 shrink-0">${presencaTexto(d.frequencia)}</p></div><p class="text-xs text-slate-500 dark:text-neutral-400 mt-1.5">${plural(d.frequencia.faltas, 'falta', 'faltas')} em ${plural(d.frequencia.dadas, 'aula', 'aulas')}. Veja a aba Aulas.</p></div>`
          : '';
      return `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div class="${tom.cartao} p-5 lg:col-span-1">
            <p class="rotulo">Situação</p>
            <p class="font-display font-semibold text-lg text-slate-900 dark:text-neutral-100 mt-1.5">${ponto(tom.ponto, tom.nome)}</p>
            <p class="text-sm text-slate-600 dark:text-neutral-300 mt-1">${esc(c.texto)}</p>
            ${c.situacao === 'disponivel' ? `<div class="mt-4 flex flex-wrap gap-2"><button type="button" data-acao="baixar-certificado" class="botao-pri">Baixar certificado</button><button type="button" data-acao="validar-certificado" class="botao-sec">Código de verificação</button></div>` : ''}
            ${oQueFalta}
          </div>
          <div class="cartao p-5 lg:col-span-2 space-y-5">
            <div><p class="rotulo mb-2">Regras do certificado do curso</p>${regrasCurso}</div>
            ${cf ? `<div><p class="rotulo mb-2">Certificado da formação ${esc(d.formacao.codigo)}</p>${regrasFormacao}</div>` : ''}
            <p class="text-xs text-slate-500 dark:text-neutral-400">Todos os certificados emitidos também ficam em Secretaria → Certificados.</p>
          </div>
        </div>`;
    }

    function renderAbas() {
      $('abas').innerHTML = ABAS.map((x) => `
        <button type="button" data-aba="${x.id}" class="px-1 pb-2.5 -mb-px text-sm border-b-2 transition whitespace-nowrap ${estado.aba === x.id ? 'border-[color:var(--f-marca-tinta)] text-slate-900 dark:text-neutral-100 font-medium' : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'}">${x.titulo}${x.n != null ? ` <span class="ml-1 text-xs text-slate-400 tabular-nums">${x.n}</span>` : ''}</button>`).join('');
    }
    function renderAba() {
      renderAbas();
      const q = new URLSearchParams(location.search); q.set('aba', estado.aba); history.replaceState(null, '', `?${q}`);
      $('conteudo-aba').innerHTML = { visao: abaVisao, aulas: abaAulas, conteudo: abaConteudo, materiais: abaMateriais, certificado: abaCertificado }[estado.aba]();
    }

    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-aba]');
      if (b) { estado.aba = b.dataset.aba; renderAba(); return; }
      const btn = e.target.closest('[data-acao]');
      if (!btn) return;
      if (btn.dataset.acao === 'baixar-certificado') toast(`Certificado de ${nomeCurso}: o PDF fica para a integração com o emissor.`);
      else if (btn.dataset.acao === 'validar-certificado') abrirModal(`${cabecalhoModal('Código de verificação', esc(nomeCurso))}<div class="p-5 text-sm text-slate-700 dark:text-neutral-200"><p>Quem receber o seu certificado pode conferir a autenticidade em <span class="font-mono">proway.com.br/verificar</span> com o código:</p><p class="mt-3 font-mono text-lg text-center text-slate-900 dark:text-neutral-100">${esc(`${d.codigoMatricula || 'MAT'}-${d.turma.codigo.replace(/\s+/g, '')}`)}</p><p class="text-[11px] text-slate-400 mt-3">Simulação do protótipo: a emissão real fica para a integração.</p></div>${rodapeModal()}`);
      else if (btn.dataset.acao === 'baixar-material') toast(`"${btn.dataset.nome}": o download do arquivo fica para a integração com o armazenamento.`);
    });

    renderAba();
  }

  // ---------- Render ----------

  if (turmaId) {
    const d = PortalAluno.detalheCurso(aluno.id, turmaId, hoje);
    if (!d) {
      toast('Curso não encontrado entre as suas matrículas.');
      location.replace('cursos.html');
      return;
    }
    renderDetalhe(d);
  } else {
    renderLista();
  }
})();
