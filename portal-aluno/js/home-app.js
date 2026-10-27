// Portal do Aluno — home (UI). Só leitura: tudo vem dos cadastros do administrativo.
(() => {
  const aluno = PortalAluno.alunoLogado();
  if (!aluno) { PortalAluno.sair(); location.replace('login.html'); return; }

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hoje = PortalAluno.hoje();

  const SITUACAO = {
    em_andamento: { nome: 'Em andamento', ponto: 'bg-emerald-500' },
    confirmada: { nome: 'Começa em breve', ponto: 'bg-sky-500' },
    planejada: { nome: 'Prevista', ponto: 'bg-slate-400' },
    concluida: { nome: 'Concluído', ponto: 'bg-slate-400' },
    cancelada: { nome: 'Cancelada', ponto: 'bg-red-500' },
  };
  const FORMATO = { presencial: 'Presencial', online: 'Online ao vivo', hibrido: 'Híbrido', ead: 'EAD' };

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast-anim pointer-events-auto rounded-lg bg-slate-900 dark:bg-neutral-800 text-white text-sm px-4 py-2 shadow-lg';
    el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  // ---------- Cabeçalho ----------

  $('avatar').innerHTML = PortalAluno.avatarHtml(aluno);
  $('nome-usuario').textContent = aluno.nome;
  const hora = new Date().getHours();
  const periodo = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  $('saudacao').textContent = `${periodo}, ${PortalAluno.primeiroNome(aluno.nome)}`;
  $('data-hoje').textContent = PortalAluno.fmtDataLonga(hoje).replace(/^./, (c) => c.toUpperCase());

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
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharMenu(); });
  document.querySelectorAll('[data-em-breve]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); toast(`"${el.textContent.trim()}" ainda não foi desenhada no protótipo.`); }));
  $('sair').addEventListener('click', () => { PortalAluno.sair(); location.replace('login.html'); });

  // ---------- Dados ----------

  const ms = PortalAluno.matriculas(aluno.id, hoje);
  const proximas = PortalAluno.proximasAulas(ms, hoje, 5);
  const pendentes = PortalAluno.avaliacoesPendentes(ms, hoje, aluno.id);
  const gravacoes = PortalAluno.gravacoesRecentes(ms, 4);
  const fin = PortalAluno.financeiro(aluno.id, hoje);
  const pagadorProprio = (aluno.pagador ?? 'proprio') === 'proprio';

  const ICONE_CAMERA = '<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>';
  // Link discreto "Meet" (ícone + texto) para a sala da turma; abre em nova aba e não propaga o clique
  // (usado dentro de linhas que também são links).
  const linkMeet = (m, extra = '') => m.turma.meetLink
    ? `<a href="${esc(m.turma.meetLink)}" target="_blank" rel="noopener" data-meet class="inline-flex items-center gap-1 text-xs font-medium text-petrol-800 dark:text-sky-300 hover:underline ${extra}" title="Abrir a sala da turma no Google Meet">${ICONE_CAMERA}Meet</a>`
    : '';
  document.addEventListener('click', (e) => { if (e.target.closest('[data-meet]')) e.stopPropagation(); }, true);

  const localDe = (a, m) => {
    if (a.salaId && typeof Salas !== 'undefined') return Salas.porId(Salas.carregar(), a.salaId)?.nome ?? m.sala?.nome ?? '';
    if (m.turma.meetLink) return 'Google Meet';
    return m.sala?.nome ?? FORMATO[m.turma.formato] ?? '';
  };

  // ---------- Destaques ----------

  function cartaoDestaque({ rotulo, titulo, texto, acao, tom = 'neutro' }) {
    const tons = {
      neutro: 'cartao',
      laranja: 'rounded-xl border border-laranja/40 bg-laranja/10 dark:bg-laranja/10 shadow-sm',
      vermelho: 'rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 shadow-sm',
    };
    return `
      <div class="${tons[tom]} p-5 flex flex-col">
        <p class="rotulo">${esc(rotulo)}</p>
        <p class="font-display font-semibold text-lg text-slate-900 dark:text-neutral-100 mt-1.5 leading-snug">${titulo}</p>
        <p class="text-sm text-slate-500 dark:text-neutral-400 mt-1 flex-1">${texto}</p>
        ${acao ? `<div class="mt-3">${acao}</div>` : ''}
      </div>`;
  }

  function destaqueProximaAula() {
    const a = proximas[0];
    if (!a) return cartaoDestaque({ rotulo: 'Próxima aula', titulo: 'Nenhuma aula agendada', texto: 'Quando sua próxima turma for confirmada, ela aparece aqui.' });
    const m = a.matricula;
    const hojeMesmo = a.data === hoje;
    const local = localDe(a, m);
    const meet = Boolean(m.turma.meetLink); // turmas presenciais também transmitem/gravam pelo Meet
    return cartaoDestaque({
      rotulo: hojeMesmo ? 'Aula de hoje' : 'Próxima aula',
      titulo: `${esc(m.curso?.nome ?? m.turma.codigo)}`,
      texto: `${esc(PortalAluno.rotuloDia(a.data, hoje))} · ${esc(a.inicio)}–${esc(a.fim)}${local ? ` · ${esc(local)}` : ''}${m.instrutor ? `<br>com ${esc(m.instrutor.nome)}` : ''}`,
      acao: `${meet ? `<a href="${esc(m.turma.meetLink)}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 rounded-lg bg-petrol-800 dark:bg-sky-600 text-white text-sm font-medium px-3 py-1.5 hover:bg-petrol-900 dark:hover:bg-sky-500 transition">${ICONE_CAMERA}Entrar no Meet</a> ` : ''}<a href="aula.html?turma=${encodeURIComponent(m.turma.id)}&data=${encodeURIComponent(a.data)}" class="link${meet ? ' ml-2' : ''}">Ver aula</a>`,
      tom: hojeMesmo ? 'laranja' : 'neutro',
    });
  }

  function destaqueAvaliacoes() {
    if (!pendentes.length) return cartaoDestaque({ rotulo: 'Avaliações', titulo: 'Tudo em dia', texto: 'Nenhuma avaliação pendente. Sua opinião ajuda a melhorar as aulas.' });
    const p = pendentes[0];
    const nome = p.modalidade === 'diaria' ? 'Avaliação da aula de hoje' : 'Avaliação final do curso';
    const outras = pendentes.length - 1;
    return cartaoDestaque({
      rotulo: 'Avaliações',
      titulo: esc(nome),
      texto: `${esc(p.matricula.curso?.nome ?? p.matricula.turma.codigo)}${outras ? ` · e mais ${outras}` : ''}`,
      acao: `<a href="../avaliacao-aluno.html?turma=${encodeURIComponent(p.matricula.turma.id)}&modalidade=${p.modalidade}" class="inline-flex items-center gap-1.5 rounded-lg bg-laranja hover:bg-laranja-escuro text-white text-sm font-medium px-3 py-1.5 transition">Responder agora</a>`,
      tom: 'neutro',
    });
  }

  function destaqueFinanceiro() {
    if (!pagadorProprio) {
      const quem = aluno.pagador === 'empresa' ? 'sua empresa' : 'seu responsável financeiro';
      return cartaoDestaque({ rotulo: 'Financeiro', titulo: 'Sem cobranças para você', texto: `As parcelas do seu curso ficam com ${quem}.` });
    }
    if (fin.vencidas.length) {
      const total = fin.vencidas.reduce((s, p) => s + p.valor, 0);
      return cartaoDestaque({
        rotulo: 'Financeiro',
        titulo: `${fin.vencidas.length} ${fin.vencidas.length === 1 ? 'parcela vencida' : 'parcelas vencidas'}`,
        texto: `${esc(Contratos.fmtMoeda(total))} em aberto. Regularize para manter o acesso às aulas.`,
        acao: `<a href="financeiro.html" class="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-1.5 transition">Ver boletos</a>`,
        tom: 'vermelho',
      });
    }
    if (fin.proxima) {
      return cartaoDestaque({
        rotulo: 'Financeiro',
        titulo: `Próximo vencimento ${esc(PortalAluno.fmtData(fin.proxima.vencimento))}`,
        texto: `${esc(Contratos.fmtMoeda(fin.proxima.valor))} · parcela ${fin.proxima.n} de ${fin.proxima.contrato.parcelas.length}`,
        acao: fin.proxima.status === 'emitida' ? `<a href="financeiro.html" class="link">Ver parcelas</a>` : '',
      });
    }
    return cartaoDestaque({ rotulo: 'Financeiro', titulo: fin.contratos ? 'Tudo quitado' : 'Sem contratos', texto: fin.contratos ? 'Nenhuma parcela em aberto.' : 'Nenhum contrato ativo no seu nome.' });
  }

  $('destaques').innerHTML = destaqueProximaAula() + destaqueAvaliacoes() + destaqueFinanceiro();

  // ---------- Sala da turma no Google Meet ----------
  // Turma em andamento com link; se nenhuma, a turma da próxima aula (começa em breve). Só aparece quando existir.

  function renderSalaMeet() {
    const m = ms.find((x) => x.situacao === 'em_andamento' && x.turma.meetLink) ?? (proximas[0]?.matricula.turma.meetLink ? proximas[0].matricula : null);
    const el = $('sala-meet');
    if (!m) { el.classList.add('hidden'); return; }
    const url = m.turma.meetLink;
    el.classList.remove('hidden');
    el.innerHTML = `
      <div class="cartao p-4 flex flex-wrap items-center gap-3">
        <div class="shrink-0 h-10 w-10 rounded-lg bg-petrol-800/10 dark:bg-petrol-700/40 text-petrol-800 dark:text-sky-300 grid place-items-center">${ICONE_CAMERA.replace('h-4 w-4', 'h-5 w-5')}</div>
        <div class="min-w-0 flex-1">
          <p class="rotulo">Sala da turma no Google Meet</p>
          <p class="text-sm text-slate-900 dark:text-neutral-100 truncate">${esc(m.curso?.nome ?? m.turma.codigo)} <span class="font-mono text-xs text-slate-400 ml-1">${esc(m.turma.codigo)}</span> · <a href="${esc(url)}" target="_blank" rel="noopener" class="link font-mono text-xs break-all">${esc(url.replace(/^https?:\/\//, ''))}</a></p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button type="button" id="copiar-meet" class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 text-sm text-slate-700 dark:text-neutral-200 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-neutral-900 transition">Copiar link</button>
          <a href="${esc(url)}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 rounded-lg bg-petrol-800 dark:bg-sky-600 text-white text-sm font-medium px-3 py-1.5 hover:bg-petrol-900 dark:hover:bg-sky-500 transition">${ICONE_CAMERA}Abrir</a>
        </div>
      </div>`;
    $('copiar-meet').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(url); toast('Link do Meet copiado.'); }
      catch { toast('Não foi possível copiar. Selecione o link e copie manualmente.'); }
    });
  }
  renderSalaMeet();

  // ---------- Meus cursos ----------

  function linhaCurso(m) {
    const s = SITUACAO[m.situacao] ?? SITUACAO.planejada;
    const concluido = m.situacao === 'concluida';
    const barra = concluido ? 100 : m.progresso;
    const periodo = `${PortalAluno.fmtData(m.turma.inicio)} – ${PortalAluno.fmtData(m.turma.fim)}`;
    const detalhe = [m.turma.turno, FORMATO[m.turma.formato], m.instrutor?.nome].filter(Boolean).map(esc).join(' · ');
    return `
      <div class="relative px-5 py-4 hover:bg-slate-50 dark:hover:bg-neutral-900/60 transition ${concluido ? 'opacity-70' : ''}">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="font-medium text-slate-900 dark:text-neutral-100 truncate"><a href="curso.html?turma=${encodeURIComponent(m.turma.id)}" class="after:absolute after:inset-0">${esc(m.curso?.nome ?? m.turma.codigo)}</a> <span class="font-mono text-xs text-slate-400 ml-1">${esc(m.turma.codigo)}</span>${(m.situacao === 'em_andamento' || m.situacao === 'confirmada') && m.turma.meetLink ? linkMeet(m, 'relative ml-2') : ''}</p>
            <p class="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">${periodo}${detalhe ? ` · ${detalhe}` : ''}</p>
          </div>
          <p class="shrink-0 inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-neutral-300"><span class="h-2 w-2 rounded-full ${s.ponto}"></span>${s.nome}</p>
        </div>
        <div class="mt-3 flex items-center gap-3">
          <div class="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 overflow-hidden"><div class="h-full rounded-full ${concluido ? 'bg-slate-400 dark:bg-neutral-600' : 'bg-petrol-800 dark:bg-sky-400'}" style="width:${barra}%"></div></div>
          <p class="text-xs tabular-nums text-slate-500 dark:text-neutral-400 shrink-0">${concluido ? m.aulas.length : m.realizadas}/${m.aulas.length} aulas</p>
        </div>
      </div>`;
  }

  // A home mostra só o que está em andamento; a lista completa fica em cursos.html.
  function renderCursos() {
    const andamento = ms.filter((m) => m.situacao === 'em_andamento').length;
    const proximos = ms.filter((m) => m.situacao === 'confirmada' || m.situacao === 'planejada').length;
    const concluidos = ms.filter((m) => m.situacao === 'concluida').length;
    $('cursos-resumo').textContent = [andamento && `${andamento} em andamento`, proximos && `${proximos} ${proximos === 1 ? 'próximo' : 'próximos'}`, concluidos && `${concluidos} ${concluidos === 1 ? 'concluído' : 'concluídos'}`].filter(Boolean).join(' · ');
    if (!ms.length) {
      $('cursos').innerHTML = `<div class="cartao p-8 text-center text-sm text-slate-500 dark:text-neutral-400">Você ainda não está matriculado em nenhuma turma.</div>`;
      return;
    }
    const emAndamento = ms.filter((m) => m.situacao === 'em_andamento');
    if (!emAndamento.length) {
      const proximo = ms.filter((m) => (m.situacao === 'confirmada' || m.situacao === 'planejada') && m.turma.inicio >= hoje).sort((a, b) => a.turma.inicio.localeCompare(b.turma.inicio))[0];
      $('cursos').innerHTML = `<div class="cartao p-8 text-center text-sm text-slate-500 dark:text-neutral-400">
        <p class="font-medium text-slate-900 dark:text-neutral-100">Nenhum curso em andamento agora.</p>
        ${proximo ? `<p class="mt-1">Próximo a começar: <a href="curso.html?turma=${encodeURIComponent(proximo.turma.id)}" class="link">${esc(proximo.curso?.nome ?? proximo.turma.codigo)}</a> em ${esc(PortalAluno.fmtData(proximo.turma.inicio))}.</p>` : ''}
        <p class="mt-2"><a href="cursos.html" class="link">Ver todos os cursos</a></p>
      </div>`;
      return;
    }
    // Agrupa por formação (cursos avulsos ficam num grupo próprio). O subtítulo da formação conta o total dela
    // (concluídos de todos), mesmo listando só as turmas em andamento.
    const grupos = new Map();
    emAndamento.forEach((m) => {
      const chave = m.formacao?.id ?? '_avulso';
      if (!grupos.has(chave)) grupos.set(chave, { formacao: m.formacao, itens: [], total: ms.filter((x) => (x.formacao?.id ?? '_avulso') === chave) });
      grupos.get(chave).itens.push(m);
    });
    $('cursos').innerHTML = [...grupos.values()].map((g) => {
      const concluidosG = g.total.filter((m) => m.situacao === 'concluida').length;
      const titulo = g.formacao ? esc(g.formacao.nome) : 'Cursos avulsos';
      const sub = g.formacao ? `${concluidosG} de ${g.total.length} cursos concluídos` : `${g.itens.length} ${g.itens.length === 1 ? 'curso em andamento' : 'cursos em andamento'}`;
      return `
        <div class="cartao overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-100 dark:border-neutral-900 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="rotulo">${g.formacao ? 'Formação' : 'Avulsos'}</p>
              <p class="font-display font-semibold text-slate-900 dark:text-neutral-100 truncate">${titulo}</p>
            </div>
            <p class="text-sm text-slate-500 dark:text-neutral-400 shrink-0">${sub}</p>
          </div>
          <div class="divide-y divide-slate-100 dark:divide-neutral-900">${g.itens.map(linhaCurso).join('')}</div>
        </div>`;
    }).join('');
  }
  renderCursos();

  // ---------- Próximas aulas ----------

  function renderProximas() {
    if (!proximas.length) {
      $('proximas-aulas').innerHTML = `<div class="p-6 text-center text-sm text-slate-500 dark:text-neutral-400">Nenhuma aula agendada.</div>`;
      return;
    }
    $('proximas-aulas').innerHTML = proximas.map((a) => {
      const m = a.matricula;
      const d = new Date(`${a.data}T12:00:00`);
      const local = localDe(a, m);
      return `
        <div class="flex items-center gap-4 px-5 py-3">
          <div class="shrink-0 w-12 text-center rounded-lg ${a.data === hoje ? 'bg-laranja/15 text-laranja-escuro dark:text-laranja' : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-300'} py-1.5">
            <p class="text-lg font-display font-semibold leading-none tabular-nums">${d.getDate()}</p>
            <p class="text-[10px] uppercase tracking-wider mt-0.5">${esc(PortalAluno.diaSemana(a.data).slice(0, 3))}</p>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-slate-900 dark:text-neutral-100 truncate">${esc(m.curso?.nome ?? m.turma.codigo)}</p>
            <p class="text-xs text-slate-500 dark:text-neutral-400">${esc(a.inicio)}–${esc(a.fim)}${local ? ` · ${esc(local)}` : ''}${a.conteudo ? ` · ${esc(a.conteudo)}` : ''}</p>
          </div>
          ${linkMeet(m, 'shrink-0')}
        </div>`;
    }).join('');
  }
  renderProximas();

  // ---------- Gravações ----------

  function renderGravacoes() {
    if (!gravacoes.length) {
      $('gravacoes').innerHTML = `<div class="p-6 text-center text-sm text-slate-500 dark:text-neutral-400">Nenhuma gravação disponível ainda.</div>`;
      return;
    }
    $('gravacoes').innerHTML = gravacoes.map((g) => `
      <a href="${esc(g.url)}" target="_blank" rel="noopener" class="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-neutral-900/60 transition">
        <div class="shrink-0 h-9 w-9 rounded-lg bg-petrol-800/10 dark:bg-petrol-700/40 text-petrol-800 dark:text-sky-300 grid place-items-center">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-slate-900 dark:text-neutral-100 truncate">${esc(g.titulo || g.matricula.curso?.nome || g.matricula.turma.codigo)}</p>
          <p class="text-xs text-slate-500 dark:text-neutral-400">${esc(g.matricula.curso?.nome ?? '')} · ${esc(PortalAluno.fmtData(g.data))}${g.duracaoMin ? ` · ${esc(Turmas.duracaoTexto(g.duracaoMin))}` : ''}</p>
        </div>
      </a>`).join('');
  }
  renderGravacoes();
})();
