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

  // ---------- Saudação ----------

  const hora = new Date().getHours();
  const periodo = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  $('saudacao').textContent = `${periodo}, ${PortalAluno.primeiroNome(aluno.nome)}`;
  $('data-hoje').textContent = PortalAluno.fmtDataLonga(hoje).replace(/^./, (c) => c.toUpperCase());


  // ---------- Dados ----------

  const ms = PortalAluno.matriculas(aluno.id, hoje);
  const proximas = PortalAluno.proximasAulas(ms, hoje, 5);
  const fin = PortalAluno.financeiro(aluno.id, hoje);
  const pagadorProprio = (aluno.pagador ?? 'proprio') === 'proprio';

  const ICONE_CAMERA = '<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>';
  const urlAula = (turmaId, a) => `aula.html?turma=${encodeURIComponent(turmaId)}&data=${encodeURIComponent(a.data)}&inicio=${encodeURIComponent(a.inicio)}`;

  const localDe = (a, m) => {
    if (a.salaId && typeof Salas !== 'undefined') return Salas.porId(Salas.carregar(), a.salaId)?.nome ?? m.sala?.nome ?? '';
    if (m.turma.meetLink) return 'Google Meet';
    return m.sala?.nome ?? FORMATO[m.turma.formato] ?? '';
  };

  // ---------- Destaques ----------

  function cartaoDestaque({ rotulo, titulo, texto, acao, tom = 'neutro' }) {
    const tons = {
      neutro: 'cartao',
      hoje: 'rounded-xl bg-[var(--f-selecao)]',
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
    // Turmas presenciais também transmitem pelo Meet; o botão só aparece no dia, que é quando ele serve.
    const meet = hojeMesmo && Boolean(m.turma.meetLink);
    return cartaoDestaque({
      rotulo: hojeMesmo ? 'Aula de hoje' : 'Próxima aula',
      titulo: `${esc(m.curso?.nome ?? m.turma.codigo)}`,
      texto: `${esc(PortalAluno.rotuloDia(a.data, hoje))} · ${esc(a.inicio)}–${esc(a.fim)}${local ? ` · ${esc(local)}` : ''}${m.instrutor ? `<br>com ${esc(m.instrutor.nome)}` : ''}`,
      acao: `${meet ? `<a href="${esc(m.turma.meetLink)}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800 text-white shadow-sm transition">${ICONE_CAMERA}Entrar no Meet</a> ` : ''}<a href="${urlAula(m.turma.id, a)}" class="link${meet ? ' ml-2' : ''}">Ver aula</a>`,
      tom: hojeMesmo ? 'hoje' : 'neutro',
    });
  }

  function destaqueFinanceiro() {
    if (!pagadorProprio) {
      const quem = aluno.pagador === 'empresa' ? 'sua empresa' : 'seu responsável financeiro';
      return cartaoDestaque({ rotulo: 'Financeiro', titulo: 'Sem cobranças para você', texto: `As parcelas do seu curso ficam com ${quem}.` });
    }
    // Parcela vencida fica em Pendências; aqui, o próximo vencimento.
    if (fin.proxima) {
      return cartaoDestaque({
        rotulo: 'Financeiro',
        titulo: `Próximo vencimento ${esc(PortalAluno.fmtData(fin.proxima.vencimento))}`,
        texto: `${esc(Contratos.fmtMoeda(fin.proxima.valor))} · parcela ${fin.proxima.n} de ${fin.proxima.contrato.parcelas.length}`,
        acao: fin.proxima.status === 'emitida' ? `<a href="financeiro.html" class="link">Ver parcelas</a>` : '',
      });
    }
    if (fin.vencidas.length) return cartaoDestaque({ rotulo: 'Financeiro', titulo: 'Nenhum vencimento futuro', texto: 'Só restam as parcelas vencidas.', acao: '<a href="financeiro.html" class="link">Ver parcelas</a>' });
    return cartaoDestaque({ rotulo: 'Financeiro', titulo: fin.contratos ? 'Tudo quitado' : 'Sem contratos', texto: fin.contratos ? 'Nenhuma parcela em aberto.' : 'Nenhum contrato ativo no seu nome.' });
  }

  $('destaques').innerHTML = destaqueProximaAula() + destaqueFinanceiro();

  // ---------- Pendências ----------
  // O que espera o aluno (cobre, como no DESIGN.md): contrato a assinar, parcela vencida e material novo das aulas.
  // Só aparece quando há alguma.

  function renderPendencias() {
    const itens = [];
    PortalAluno.contratosDetalhados(aluno.id, hoje).filter((b) => b.assinaturaPendente).forEach((b) => itens.push({
      titulo: `Contrato ${esc(b.codigo)} para assinar`,
      texto: 'Falta a sua assinatura.',
      acao: 'Assinar', href: `contrato.html?id=${encodeURIComponent(b.contrato.id)}`,
    }));
    if (pagadorProprio && fin.vencidas.length) {
      const total = fin.vencidas.reduce((s, p) => s + p.valor, 0);
      itens.push({
        titulo: `${fin.vencidas.length} ${fin.vencidas.length === 1 ? 'parcela vencida' : 'parcelas vencidas'}`,
        texto: `${esc(Contratos.fmtMoeda(total))} em aberto, por Pix ou boleto.`,
        acao: 'Pagar', href: 'financeiro.html?aba=parcelas',
      });
    }
    // shortcut: "novo" é o liberado nos últimos 7 dias, sem registro de leitura; trocar por "ainda não aberto pelo aluno" quando houver.
    if (typeof Materiais !== 'undefined') {
      const desde = (() => { const d = new Date(`${hoje}T12:00:00`); d.setDate(d.getDate() - 6); return d.toISOString().slice(0, 10); })();
      ms.filter((m) => m.situacao !== 'concluida' && m.situacao !== 'cancelada').forEach((m) => {
        const novos = Materiais.doAluno(m.turma.id, hoje).filter((x) => x.liberarEm >= desde);
        m.aulas.filter((a) => a.id != null).forEach((a) => {
          const daAula = novos.filter((x) => x.aulaId === a.id);
          if (!daAula.length) return;
          itens.push({
            titulo: `${daAula.length === 1 ? 'Material novo' : `${daAula.length} materiais novos`} · ${esc(m.curso?.nome ?? m.turma.codigo)}`,
            texto: `Aula de ${a.data === hoje ? 'hoje' : esc(PortalAluno.fmtData(a.data))}: ${esc(daAula.map((x) => x.titulo).join(', '))}`,
            acao: 'Ver aula', href: urlAula(m.turma.id, a),
          });
        });
      });
    }
    const el = $('pendencias');
    el.classList.toggle('hidden', !itens.length);
    if (!itens.length) return;
    el.innerHTML = `
      <h2 class="titulo-secao mb-3">Pendências <span class="text-xs font-sans font-normal text-slate-400 tabular-nums ml-1">${itens.length}</span></h2>
      <div class="cartao divide-y divide-slate-100 dark:divide-neutral-900">${itens.map((p) => `
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
          <span class="h-2 w-2 rounded-full bg-[var(--f-cobre)] shrink-0" aria-hidden="true"></span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-slate-900 dark:text-neutral-100">${p.titulo}</p>
            <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${p.texto}</p>
          </div>
          <a href="${p.href}" class="shrink-0 inline-flex items-center rounded-lg border border-slate-200 dark:border-neutral-700 text-sm font-medium text-slate-800 dark:text-neutral-100 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-neutral-900 transition">${p.acao}</a>
        </div>`).join('')}
      </div>`;
  }
  renderPendencias();

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
            <p class="font-medium text-slate-900 dark:text-neutral-100 truncate"><a href="curso.html?turma=${encodeURIComponent(m.turma.id)}" class="after:absolute after:inset-0">${esc(m.curso?.nome ?? m.turma.codigo)}</a> <span class="font-mono text-xs text-slate-400 ml-1">${esc(m.turma.codigo)}</span></p>
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
        <a href="${urlAula(m.turma.id, a)}" class="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-neutral-900/60 transition">
          <div class="shrink-0 w-12 text-center rounded-lg ${a.data === hoje ? 'bg-petrol-800 text-white dark:bg-areia dark:text-petrol-800' : 'bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-300'} py-1.5">
            <p class="text-lg font-display font-semibold leading-none tabular-nums">${d.getDate()}</p>
            <p class="text-[11px] mt-0.5">${esc(PortalAluno.diaSemana(a.data).slice(0, 3))}</p>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-slate-900 dark:text-neutral-100 truncate">${esc(m.curso?.nome ?? m.turma.codigo)}</p>
            <p class="text-xs text-slate-500 dark:text-neutral-400">${esc(a.inicio)}–${esc(a.fim)}${local ? ` · ${esc(local)}` : ''}${a.conteudo ? ` · ${esc(a.conteudo)}` : ''}</p>
          </div>
        </a>`;
    }).join('');
  }
  renderProximas();

})();
