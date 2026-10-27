// Portal do Aluno — Materiais (UI). Só leitura: materiais e softwares vêm do cadastro de cursos do administrativo;
// os materiais das aulas, do que o professor já liberou (js/materiais-motor.js).
// Junta os materiais de todos os cursos do aluno (do curso + das aulas) (matrículas ativas, a iniciar e concluídas) numa tabela única
// com busca + filtro por curso e por tipo; a aba "Softwares necessários" lista os programas por curso.
(() => {
  const aluno = PortalAluno.alunoLogado();
  if (!aluno) { PortalAluno.sair(); location.replace('login.html'); return; }

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hoje = PortalAluno.hoje();
  const data = (iso) => esc(PortalAluno.fmtData(String(iso ?? '').slice(0, 10)));
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
  const normalizar = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const SIT = PortalAluno.SITUACOES_MATRICULA;
  const PONTO = { concluida: 'bg-slate-400', em_andamento: 'bg-emerald-500', a_iniciar: 'bg-sky-500', desistiu: 'bg-amber-500', cancelada: 'bg-red-500' };
  const ponto = (cor, texto) => `<span class="inline-flex items-center gap-1.5 whitespace-nowrap"><span class="h-2 w-2 rounded-full ${cor} shrink-0"></span>${esc(texto)}</span>`;
  const situacao = (id) => ponto(PONTO[id] ?? 'bg-slate-400', SIT[id]?.nome ?? id);

  // Tipos do material (js/cursos-motor.js): video | arquivo | link. "Apostila" é arquivo PDF — vira subtipo só de exibição.
  const TIPOS = {
    apostila: { nome: 'Apostila', icone: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
    arquivo: { nome: 'Arquivo', icone: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
    video: { nome: 'Vídeo', icone: 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z' },
    link: { nome: 'Link', icone: 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244' },
  };
  const ORDEM_TIPO = ['apostila', 'arquivo', 'video', 'link'];
  const icone = (tipo) => `<span class="shrink-0 h-8 w-8 rounded-lg bg-petrol-800/10 dark:bg-petrol-700/40 text-petrol-800 dark:text-sky-300 grid place-items-center"><svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="${TIPOS[tipo]?.icone ?? TIPOS.link.icone}" /></svg></span>`;
  const tamanho = (b) => (b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1).replace('.', ',')} MB` : `${Math.round(b / 1000)} KB`);
  const dominio = (url) => String(url).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  const duracao = (min) => (typeof Turmas !== 'undefined' && Turmas.duracaoTexto ? Turmas.duracaoTexto(min) : `${min} min`);

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast-anim pointer-events-auto rounded-lg bg-slate-900 dark:bg-neutral-800 text-white text-sm px-4 py-2 shadow-lg';
    el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModal(); });

  // ---------- Modal centralizado (prévia de vídeo) ----------

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

  // YouTube (watch?v= / youtu.be/) vira embed; outros vídeos abrem em nova aba.
  function embedVideo(url) {
    try {
      const u = new URL(url);
      const id = u.hostname.includes('youtu.be') ? u.pathname.slice(1) : u.hostname.includes('youtube.com') ? u.searchParams.get('v') : null;
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
    } catch (_) { return null; }
  }

  // ---------- Consulta (local a esta tela: o motor do portal não muda) ----------
  // Materiais de todas as matrículas do aluno, menos desistência/cancelamento. Cada linha carrega a matrícula
  // (curso, turma, situação) para o filtro por curso e para a coluna Curso. Materiais pendentes no administrativo
  // (arquivo sem upload / link sem endereço) ficam de fora, como no detalhe do curso.

  function carregar() {
    const catalogo = typeof SOFTWARES_CATALOGO !== 'undefined' ? SOFTWARES_CATALOGO : [];
    const ordemSit = { em_andamento: 0, a_iniciar: 1, concluida: 2 };
    const ms = PortalAluno.todasMatriculas(aluno.id, hoje)
      .filter((m) => m.situacaoAluno !== 'desistiu' && m.situacaoAluno !== 'cancelada')
      .sort((a, b) => (ordemSit[a.situacaoAluno] ?? 9) - (ordemSit[b.situacaoAluno] ?? 9) || a.turma.inicio.localeCompare(b.turma.inicio) || a.ordem - b.ordem);
    const cursos = ms.map((m) => {
      const materiais = (m.curso?.materiais ?? []).filter((x) => !Cursos.materialPendente(x)).map((mt) => {
        const apostila = mt.tipo === 'arquivo' && (mt.arquivo?.mime === 'application/pdf' || /apostila/i.test(mt.nome));
        const tipoTela = apostila ? 'apostila' : mt.tipo;
        const modulo = mt.moduloId ? (m.curso?.modulos ?? []).find((x) => x.id === mt.moduloId) : null;
        const detalhe = mt.tipo === 'video' ? (mt.duracaoMin ? duracao(mt.duracaoMin) : 'Vídeo')
          : mt.tipo === 'arquivo' ? [mt.arquivo?.nome?.split('.').pop()?.toUpperCase(), mt.arquivo?.tamanho ? tamanho(mt.arquivo.tamanho) : ''].filter(Boolean).join(' · ')
            : dominio(mt.url);
        return { ...mt, tipoTela, modulo, detalhe, turmaId: m.turma.id };
      });
      // Materiais das aulas já liberados (só o que Materiais.doAluno devolve), na mesma tabela dos do curso.
      const agendadas = Turmas.aulasAgendadas(m.turma) ?? [];
      const daAulas = (typeof Materiais !== 'undefined' ? Materiais.doAluno(m.turma.id, hoje) : []).map((mt) => {
        const aula = agendadas.find((a) => a.id === mt.aulaId);
        const origem = aula ? `Aula${aula.n ? ` ${aula.n}` : ''} · ${PortalAluno.fmtData(aula.data)}` : 'Material da aula';
        return { id: mt.id, nome: mt.titulo, tipo: mt.tipo, tipoTela: mt.tipo, url: mt.url, descricao: [origem, mt.descricao].filter(Boolean).join(' · '), detalhe: mt.tipo === 'link' ? dominio(mt.url) : mt.arquivo, turmaId: m.turma.id };
      });
      const softwares = (m.curso?.infraestrutura?.softwares ?? []).map((s) => ({ ...s, catalogo: s.softwareId ? catalogo.find((c) => c.id === s.softwareId) ?? null : null }));
      return { matricula: m, nome: m.curso?.nome ?? m.turma.codigo, materiais: [...materiais, ...daAulas], softwares };
    });
    const linhas = cursos.flatMap((c) => c.materiais.map((mt) => ({ ...mt, curso: c })));
    return { cursos, linhas };
  }

  const dados = carregar();
  const vazio = (msg) => `<div class="cartao p-8 text-center text-sm text-slate-500 dark:text-neutral-400">${msg}</div>`;
  const cartaoTotal = (rotulo, valor, texto = '') => `<div class="cartao p-5"><p class="rotulo">${esc(rotulo)}</p><p class="font-display font-semibold text-lg text-slate-900 dark:text-neutral-100 mt-1.5 leading-snug tabular-nums">${valor}</p>${texto ? `<p class="text-sm text-slate-500 dark:text-neutral-400 mt-1">${texto}</p>` : ''}</div>`;

  // ---------- Cartões-resumo ----------

  const porTipo = (t) => dados.linhas.filter((l) => l.tipoTela === t).length;
  const cursosComMaterial = dados.cursos.filter((c) => c.materiais.length).length;
  const cursosComSoftware = dados.cursos.filter((c) => c.softwares.length).length;
  const programas = new Set(dados.cursos.flatMap((c) => c.softwares.map((s) => s.softwareId ?? `livre:${normalizar(s.nome)}`))).size;
  $('totais').innerHTML = [
    cartaoTotal('Materiais', dados.linhas.length, dados.cursos.length ? `em ${plural(cursosComMaterial, 'curso', 'cursos')} de ${dados.cursos.length}` : 'Nenhuma matrícula'),
    cartaoTotal('Apostilas', porTipo('apostila'), 'PDF para estudar'),
    cartaoTotal('Arquivos', porTipo('arquivo'), 'exercícios, projetos, bases'),
    cartaoTotal('Vídeos', porTipo('video'), 'aulas extras e tutoriais'),
    cartaoTotal('Links', porTipo('link'), 'repositórios e referências'),
    cartaoTotal('Programas', programas, cursosComSoftware ? `pedidos por ${plural(cursosComSoftware, 'curso', 'cursos')}` : 'Nenhum curso exige instalação'),
  ].join('');

  // ---------- Abas ----------

  const ABAS = [
    { id: 'materiais', titulo: 'Materiais', n: dados.linhas.length },
    { id: 'softwares', titulo: 'Softwares necessários', n: programas },
  ];
  const params = new URLSearchParams(location.search);
  const estado = {
    aba: ABAS.some((x) => x.id === params.get('aba')) ? params.get('aba') : 'materiais',
    busca: '', curso: 'todos', tipo: 'todos',
    aberto: Object.fromEntries(dados.cursos.map((c) => [c.matricula.turma.id, true])),
  };

  function renderAbas() {
    $('abas').innerHTML = ABAS.map((x) => `
      <button type="button" data-aba="${x.id}" class="px-1 pb-2.5 -mb-px text-sm border-b-2 transition whitespace-nowrap ${estado.aba === x.id ? 'border-[color:var(--f-marca-tinta)] text-slate-900 dark:text-neutral-100 font-medium' : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'}">${x.titulo} <span class="ml-1 text-xs text-slate-400 tabular-nums">${x.n}</span></button>`).join('');
  }

  // ---------- Aba Materiais: barra única + tabela zebrada ----------

  const opcaoCurso = (c) => `<option value="${esc(c.matricula.turma.id)}" ${estado.curso === c.matricula.turma.id ? 'selected' : ''}>${esc(c.nome)} · ${esc(c.matricula.turma.codigo)}</option>`;
  function barraMateriais() {
    return `
      <div class="cartao px-4 py-3 flex flex-wrap items-center gap-3">
        <label class="relative flex-1 min-w-56">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input type="search" data-busca value="${esc(estado.busca)}" placeholder="Buscar por nome do material" class="w-full rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 pl-9 pr-3 py-1.5 text-sm text-slate-700 dark:text-neutral-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-petrol-800/40">
        </label>
        <select data-filtro="curso" class="select max-w-72">
          <option value="todos" ${estado.curso === 'todos' ? 'selected' : ''}>Todos os cursos</option>
          ${dados.cursos.filter((c) => c.materiais.length).map(opcaoCurso).join('')}
        </select>
        <select data-filtro="tipo" class="select">
          <option value="todos" ${estado.tipo === 'todos' ? 'selected' : ''}>Todos os tipos</option>
          ${ORDEM_TIPO.map((t) => `<option value="${t}" ${estado.tipo === t ? 'selected' : ''}>${TIPOS[t].nome}s</option>`).join('')}
        </select>
      </div>`;
  }

  function filtrar() {
    const q = normalizar(estado.busca.trim());
    return dados.linhas.filter((l) => (estado.curso === 'todos' || l.turmaId === estado.curso)
      && (estado.tipo === 'todos' || l.tipoTela === estado.tipo)
      && (!q || normalizar(`${l.nome} ${l.descricao ?? ''} ${l.modulo?.titulo ?? ''} ${l.curso.nome}`).includes(q)));
  }

  function acaoMaterial(l) {
    if (l.tipo === 'video') return `<button type="button" data-acao="video" data-id="${esc(l.id)}" data-turma="${esc(l.turmaId)}" class="botao-sec !py-1">Assistir</button>`;
    if (l.url) return `<a href="${esc(l.url)}" target="_blank" rel="noopener" class="botao-sec !py-1">Abrir</a>`;
    return `<button type="button" data-acao="baixar" data-nome="${esc(l.nome)}" class="botao-sec !py-1">Baixar</button>`;
  }

  function linhaMaterial(l) {
    const m = l.curso.matricula;
    const aIniciar = m.situacaoAluno === 'a_iniciar';
    return `<tr>
      <td><div class="flex items-center gap-3">${icone(l.tipoTela)}<div class="min-w-0"><p class="font-medium text-slate-900 dark:text-neutral-100">${esc(l.nome)}</p>${l.descricao || l.modulo ? `<p class="text-xs text-slate-500 dark:text-neutral-400">${esc([l.modulo?.titulo, l.descricao].filter(Boolean).join(' · '))}</p>` : ''}</div></div></td>
      <td class="whitespace-nowrap">${esc(TIPOS[l.tipoTela]?.nome ?? l.tipo)}</td>
      <td><p class="text-slate-900 dark:text-neutral-100"><a href="curso.html?turma=${encodeURIComponent(m.turma.id)}&aba=materiais" class="hover:underline">${esc(l.curso.nome)}</a></p><p class="text-xs text-slate-500 dark:text-neutral-400"><span class="font-mono">${esc(m.turma.codigo)}</span> · ${aIniciar ? `começa em ${data(m.turma.inicio)}` : (SIT[m.situacaoAluno]?.nome ?? '').toLowerCase()}</p></td>
      <td class="whitespace-nowrap tabular-nums text-slate-500 dark:text-neutral-400">${esc(l.detalhe || '—')}</td>
      <td class="text-right whitespace-nowrap">${acaoMaterial(l)}</td>
    </tr>`;
  }

  function abaMateriais() {
    if (!dados.cursos.length) return vazio('Você ainda não está matriculado em nenhum curso, então não há materiais por aqui. Dúvidas? Fale com a secretaria.');
    if (!dados.linhas.length) return vazio('Os seus cursos ainda não têm materiais publicados. Assim que a secretaria liberar apostilas, arquivos ou vídeos, eles aparecem aqui.');
    const itens = filtrar();
    const filtrando = estado.busca.trim() || estado.curso !== 'todos' || estado.tipo !== 'todos';
    const aIniciar = dados.linhas.filter((l) => l.curso.matricula.situacaoAluno === 'a_iniciar').length;
    return `
      ${barraMateriais()}
      <p class="text-sm text-slate-500 dark:text-neutral-400 mt-3 mb-3">${filtrando ? `${plural(itens.length, 'material', 'materiais')} de ${dados.linhas.length}` : `${plural(dados.linhas.length, 'material', 'materiais')} em ${plural(cursosComMaterial, 'curso', 'cursos')}`}, na ordem dos seus cursos (em andamento, a iniciar, concluídos).${aIniciar ? ` ${plural(aIniciar, 'material já está disponível', 'materiais já estão disponíveis')} para cursos que ainda não começaram.` : ''}</p>
      ${itens.length ? `<div class="cartao overflow-hidden"><div class="overflow-x-auto"><table class="tabela w-full">
        <thead><tr><th>Material</th><th>Tipo</th><th>Curso</th><th>Detalhe</th><th></th></tr></thead>
        <tbody>${itens.map(linhaMaterial).join('')}</tbody>
      </table></div></div>` : vazio('Nenhum material com esses filtros. <button type="button" data-acao="limpar" class="link">Limpar filtros</button>')}`;
  }

  // ---------- Aba Softwares: acordeão por curso (abertos; Expandir/Minimizar todos) ----------

  function cartaoSoftwares(c) {
    const m = c.matricula;
    const id = m.turma.id;
    const aberto = estado.aberto[id];
    return `
      <article class="cartao overflow-hidden">
        <div class="flex items-stretch">
          <button type="button" data-acao="alternar" data-grupo="${esc(id)}" aria-expanded="${aberto}" class="flex-1 min-w-0 text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-neutral-900/60 transition">
            <p class="font-display font-semibold text-slate-900 dark:text-neutral-100 truncate">${esc(c.nome)}</p>
            <p class="text-sm text-slate-500 dark:text-neutral-400 mt-0.5"><span class="font-mono">${esc(m.turma.codigo)}</span> · ${data(m.turma.inicio)} – ${data(m.turma.fim)} · ${plural(c.softwares.length, 'programa', 'programas')}</p>
          </button>
          <div class="flex items-center gap-4 shrink-0 pr-5 py-4">
            <p class="text-sm text-slate-600 dark:text-neutral-300 hidden sm:block">${situacao(m.situacaoAluno)}</p>
            <button type="button" data-acao="alternar" data-grupo="${esc(id)}" title="${aberto ? 'Minimizar' : 'Expandir'}" class="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-900"><svg class="h-5 w-5 transition ${aberto ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg></button>
          </div>
        </div>
        <div class="${aberto ? '' : 'hidden'} border-t border-slate-100 dark:border-neutral-900"><div class="overflow-x-auto"><table class="tabela w-full">
          <thead><tr><th>Software</th><th>Versão</th><th>Requer</th><th>Observação</th><th></th></tr></thead>
          <tbody>${c.softwares.map((s) => `<tr>
            <td class="font-medium text-slate-900 dark:text-neutral-100">${esc(s.nome)}${s.catalogo?.grupo ? `<p class="text-xs font-normal text-slate-500 dark:text-neutral-400">${esc(s.catalogo.grupo)}</p>` : ''}</td>
            <td class="tabular-nums whitespace-nowrap">${esc(s.catalogo?.versao || '—')}</td>
            <td class="text-slate-500 dark:text-neutral-400">${esc(s.catalogo?.requisitos || '—')}</td>
            <td class="text-slate-500 dark:text-neutral-400">${esc(s.observacao || s.catalogo?.observacao || '—')}</td>
            <td class="text-right whitespace-nowrap">${s.catalogo?.site ? `<a href="${esc(s.catalogo.site)}" target="_blank" rel="noopener" class="botao-sec !py-1">Baixar <span class="text-xs text-slate-400 font-normal">${esc(dominio(s.catalogo.site))}</span></a>` : `<button type="button" data-acao="sem-site" data-nome="${esc(s.nome)}" class="botao-sec !py-1">Baixar</button>`}</td>
          </tr>`).join('')}</tbody>
        </table></div></div>
      </article>`;
  }

  function abaSoftwares() {
    if (!dados.cursos.length) return vazio('Você ainda não está matriculado em nenhum curso.');
    const comSoft = dados.cursos.filter((c) => c.softwares.length);
    if (!comSoft.length) return vazio('Nenhum dos seus cursos exige instalação de programas.');
    return `
      <p class="text-sm text-slate-500 dark:text-neutral-400 mb-3">Nos laboratórios da ProWay tudo já vem instalado; a lista é para quem quer praticar em casa ou assiste online. Precisa de ajuda para instalar? Fale com a secretaria.</p>
      <div class="space-y-4">${comSoft.map(cartaoSoftwares).join('')}</div>`;
  }

  // ---------- Render ----------

  function renderAba() {
    renderAbas();
    const q = new URLSearchParams(location.search); q.set('aba', estado.aba); history.replaceState(null, '', `?${q}`);
    $('conteudo-aba').innerHTML = estado.aba === 'materiais' ? abaMateriais() : abaSoftwares();
    const comSoft = dados.cursos.filter((c) => c.softwares.length);
    if (estado.aba === 'softwares' && comSoft.length > 1) {
      const todosAbertos = comSoft.every((c) => estado.aberto[c.matricula.turma.id]);
      $('acoes-topo').innerHTML = `<button type="button" id="alternar-todos" class="botao-sec">${todosAbertos ? 'Minimizar todos' : 'Expandir todos'}</button>`;
      $('alternar-todos').addEventListener('click', () => { comSoft.forEach((c) => { estado.aberto[c.matricula.turma.id] = !todosAbertos; }); renderAba(); });
    } else $('acoes-topo').innerHTML = '';
  }

  // Busca sem re-renderizar a barra (mantém o foco no input).
  function renderTabela() {
    const cont = $('conteudo-aba');
    const barra = cont.firstElementChild;
    const html = abaMateriais();
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    tmp.firstElementChild?.remove();
    cont.replaceChildren(barra, ...tmp.childNodes);
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-aba]');
    if (b) { estado.aba = b.dataset.aba; renderAba(); return; }
    const btn = e.target.closest('[data-acao]');
    if (!btn) return;
    const acao = btn.dataset.acao;
    if (acao === 'alternar') { estado.aberto[btn.dataset.grupo] = !estado.aberto[btn.dataset.grupo]; renderAba(); }
    else if (acao === 'limpar') { estado.busca = ''; estado.curso = 'todos'; estado.tipo = 'todos'; renderAba(); }
    else if (acao === 'baixar') toast(`"${btn.dataset.nome}": download simulado no protótipo — o arquivo fica para a integração com o armazenamento.`);
    else if (acao === 'sem-site') toast(`"${btn.dataset.nome}" não tem site de download cadastrado. Peça o instalador à secretaria.`);
    else if (acao === 'video') {
      const l = dados.linhas.find((x) => x.id === btn.dataset.id && x.turmaId === btn.dataset.turma);
      if (!l) return;
      const embed = embedVideo(l.url);
      if (!embed) { window.open(l.url, '_blank', 'noopener'); return; }
      abrirModal(`${cabecalhoModal(l.nome, `${esc(l.curso.nome)}${l.duracaoMin ? ` · ${esc(duracao(l.duracaoMin))}` : ''}`)}
        <div class="aspect-video bg-black"><iframe src="${esc(embed)}" title="${esc(l.nome)}" class="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>
        ${rodapeModal(`<a href="${esc(l.url)}" target="_blank" rel="noopener" class="botao-sec">Abrir em nova aba</a>`)}`);
    }
  });
  document.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-filtro]');
    if (!sel) return;
    estado[sel.dataset.filtro] = sel.value;
    renderAba();
  });
  document.addEventListener('input', (e) => {
    const inp = e.target.closest('[data-busca]');
    if (!inp) return;
    estado.busca = inp.value;
    renderTabela();
  });

  renderAba();
})();
