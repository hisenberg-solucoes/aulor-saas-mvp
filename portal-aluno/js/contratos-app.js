// Portal do Aluno — Contratos (UI). Consulta dos contratos em que o aluno está, evolução das matrículas
// e solicitações (cancelamento com simulação da rescisão, 2ª via, trancamento, transferência) + simulação avulsa
// "Quanto custaria cancelar hoje" (Resumo e Solicitações), que não grava nada.
// Só a assinatura no Clicksign (simulada) altera o contrato; as solicitações ficam em chave própria do portal.
(() => {
  const aluno = PortalAluno.alunoLogado();
  if (!aluno) { PortalAluno.sair(); location.replace('login.html'); return; }

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hoje = PortalAluno.hoje();
  const moeda = (n) => esc(Contratos.fmtMoeda(n));
  const data = (iso) => esc(PortalAluno.fmtData(String(iso ?? '').slice(0, 10)));
  const dataHora = (iso) => esc(Contratos.fmtDataHora(iso));
  const nomeDe = (lista, id) => lista.find((x) => x.id === id)?.nome ?? '';
  const plural = (n, um, varios = `${um}s`) => `${n} ${n === 1 ? um : varios}`;
  const ponto = (cor, texto) => `<span class="inline-flex items-center gap-1.5 whitespace-nowrap"><span class="h-2 w-2 rounded-full ${cor} shrink-0"></span>${esc(texto)}</span>`;

  const SITUACAO_MATRICULA = {
    concluido: { nome: 'Concluído', ponto: 'bg-sky-500' },
    em_andamento: { nome: 'Em andamento', ponto: 'bg-emerald-500' },
    a_iniciar: { nome: 'A iniciar', ponto: 'bg-slate-400' },
    sem_turma: { nome: 'Turma a definir', ponto: 'bg-slate-400' },
    congelada: { nome: 'Congelada', ponto: 'bg-violet-500' },
    desistiu: { nome: 'Desistiu', ponto: 'bg-amber-500' },
    cancelada: { nome: 'Cancelada', ponto: 'bg-red-500' },
  };
  const SITUACAO_RESCISAO = {
    concluido: { nome: 'Concluído', ponto: 'bg-sky-500' },
    em_andamento: { nome: 'Em andamento', ponto: 'bg-emerald-500' },
    nao_iniciado: { nome: 'Não iniciado', ponto: 'bg-slate-400' },
    arrependimento: { nome: 'Arrependimento', ponto: 'bg-emerald-500' },
  };
  const MOTIVOS_CANCELAMENTO = ['Questões financeiras', 'Horário incompatível com trabalho/estudo', 'Mudança de cidade', 'Conteúdo diferente do esperado', 'Motivo de saúde', 'Outro'];
  const MOTIVOS_TRANCAMENTO = ['Motivo de saúde', 'Trabalho ou viagem', 'Questões financeiras', 'Questões familiares', 'Outro'];
  const RETORNOS_TRANCAMENTO = ['Em 1 mês', 'Em 2 meses', 'Em 3 meses', 'Na próxima turma do curso', 'Ainda não sei'];
  const PEDIDOS_SEGUNDA_VIA = ['Segunda via do contrato assinado (PDF)', 'Atualizar endereço no contrato', 'Atualizar e-mail ou telefone', 'Corrigir nome ou documento', 'Outro'];

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
  $('sair').addEventListener('click', () => { PortalAluno.sair(); location.replace('login.html'); });

  // ---------- Modal centralizado ----------

  function abrirModal(html, largura = 'max-w-md') {
    const caixa = $('modal-caixa');
    caixa.className = `cartao modal-anim w-full ${largura} max-h-[90vh] overflow-y-auto`;
    caixa.innerHTML = html;
    $('modal').classList.remove('hidden');
    caixa.querySelector('[data-fechar]')?.focus();
    return caixa;
  }
  function fecharModal() { $('modal').classList.add('hidden'); $('modal-caixa').innerHTML = ''; }
  $('modal').addEventListener('click', (e) => { if (e.target === $('modal')) fecharModal(); });
  $('modal-caixa').addEventListener('click', (e) => { if (e.target.closest('[data-fechar]')) fecharModal(); });

  const cabecalhoModal = (titulo, sub = '') => `
    <div class="px-5 py-4 border-b border-slate-100 dark:border-neutral-900 flex items-start justify-between gap-3">
      <div><p class="titulo-secao">${esc(titulo)}</p>${sub ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${sub}</p>` : ''}</div>
      <button type="button" data-fechar title="Fechar" class="-mr-1 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-900"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
    </div>`;
  const rodapeModal = (extra = '', fechar = 'Fechar') => `<div class="px-5 py-3 border-t border-slate-100 dark:border-neutral-900 flex justify-end gap-2"><button type="button" data-fechar class="botao-sec">${esc(fechar)}</button>${extra}</div>`;
  const linhaDl = (dt, dd) => `<div class="flex justify-between gap-4 py-1.5"><dt class="text-slate-500 dark:text-neutral-400">${esc(dt)}</dt><dd class="text-right text-slate-800 dark:text-neutral-100">${dd}</dd></div>`;
  const campo = 'w-full rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-slate-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-petrol-800/40';
  const selectDe = (id, opcoes, vazio = 'Selecione…') => `<select id="${id}" class="${campo}"><option value="">${esc(vazio)}</option>${opcoes.map((o) => (typeof o === 'string' ? `<option value="${esc(o)}">${esc(o)}</option>` : `<option value="${esc(o.id)}">${esc(o.nome)}</option>`)).join('')}</select>`;
  const erroCampo = (el, msg) => { el.classList.add('ring-2', 'ring-red-400'); const p = el.parentElement.querySelector('[data-erro]'); if (p) { p.textContent = msg; p.classList.remove('hidden'); } };
  const limparErros = (root) => root.querySelectorAll('.ring-red-400').forEach((el) => { el.classList.remove('ring-2', 'ring-red-400'); el.parentElement.querySelector('[data-erro]')?.classList.add('hidden'); });
  const grupoCampo = (rotulo, controle, ajuda = '') => `<div><label class="rotulo block mb-1">${rotulo}</label>${controle}<p data-erro class="hidden text-xs text-red-600 dark:text-red-400 mt-1"></p>${ajuda ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-1">${ajuda}</p>` : ''}</div>`;

  // ---------- Dados ----------

  let blocos = PortalAluno.contratosDetalhados(aluno.id, hoje);
  const recarregar = () => { blocos = PortalAluno.contratosDetalhados(aluno.id, hoje); };
  const blocoDe = (id) => blocos.find((b) => b.contrato.id === id) ?? null;
  const ABAS = [{ id: 'resumo', titulo: 'Resumo' }, { id: 'evolucao', titulo: 'Evolução' }, { id: 'solicitacoes', titulo: 'Solicitações' }];
  const url = new URLSearchParams(location.search);
  const MODO = document.body.dataset.modo === 'detalhe' ? 'detalhe' : 'lista';
  const estado = { id: url.get('id'), aba: ABAS.some((x) => x.id === url.get('aba')) ? url.get('aba') : 'resumo' };
  const atualizarUrl = () => {
    const q = new URLSearchParams();
    if (estado.id) { q.set('id', estado.id); q.set('aba', estado.aba); }
    history.replaceState(null, '', q.toString() ? `?${q}` : location.pathname);
  };

  // ---------- Lista / estado vazio ----------

  const vazio = (msg) => `<div class="cartao p-8 text-center text-sm text-slate-500 dark:text-neutral-400">${msg}</div>`;

  function cartaoLista(b) {
    const periodo = b.inicio ? `${data(b.inicio)} – ${b.fim ? data(b.fim) : '…'}` : 'Turmas a definir';
    return `
      <article class="cartao p-5 flex flex-col gap-3">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="rotulo">Contrato <span class="font-mono normal-case tracking-normal">${esc(b.codigo)}</span></p>
            <p class="font-display font-semibold text-slate-900 dark:text-neutral-100 mt-0.5">${esc(b.descricao)}</p>
          </div>
          <p class="text-sm text-slate-600 dark:text-neutral-300 shrink-0">${ponto(b.situacao.ponto, b.situacao.nome)}</p>
        </div>
        <dl class="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
          <div><dt class="rotulo">Período</dt><dd class="text-slate-800 dark:text-neutral-100">${periodo}</dd></div>
          <div><dt class="rotulo">Suas matrículas</dt><dd class="text-slate-800 dark:text-neutral-100">${plural(b.itens.length, 'curso')} · ${moeda(b.valorAluno)}</dd></div>
          <div><dt class="rotulo">Contratante</dt><dd class="text-slate-800 dark:text-neutral-100 truncate">${b.ehContratante ? 'Você' : esc(b.responsavel.nome)}</dd></div>
          <div><dt class="rotulo">Criado em</dt><dd class="text-slate-800 dark:text-neutral-100">${data(b.contrato.criadoEm)}</dd></div>
        </dl>
        <div class="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-neutral-900">
          <p class="text-xs text-slate-500 dark:text-neutral-400">${b.assinaturaPendente ? ponto('bg-amber-500', 'Falta a sua assinatura') : b.assinado ? `Assinado em ${data(b.assinadoEm)}` : b.situacao.id === 'cancelado' ? 'Cancelado' : 'Assinatura pendente'}</p>
          <a href="contrato.html?id=${encodeURIComponent(b.contrato.id)}" data-abrir="${b.contrato.id}" class="botao-pri">Abrir</a>
        </div>
      </article>`;
  }

  function renderLista() {
    $('detalhe').classList.add('hidden');
    $('faixa').classList.add('hidden');
    $('trilha').classList.add('hidden');
    $('acoes-topo').innerHTML = '';
    $('titulo').textContent = 'Contratos';
    const el = $('lista');
    el.classList.remove('hidden');
    if (!blocos.length) {
      $('subtitulo').textContent = `Referência ${PortalAluno.fmtData(hoje)}`;
      el.innerHTML = `<div class="cartao p-10 text-center">
        <div class="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-neutral-900 grid place-items-center text-slate-400"><svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg></div>
        <p class="font-display font-semibold text-slate-900 dark:text-neutral-100 mt-3">Você ainda não tem contratos</p>
        <p class="text-sm text-slate-500 dark:text-neutral-400 mt-1 max-w-md mx-auto">Quando a secretaria registrar a sua matrícula, o contrato aparece aqui com o documento, a evolução dos cursos e o canal para pedidos.</p>
        <a href="home.html" class="botao-sec mt-4">Voltar ao início</a>
      </div>`;
      return;
    }
    $('subtitulo').textContent = `${plural(blocos.length, 'contrato')} · referência ${PortalAluno.fmtData(hoje)}`;
    el.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">${blocos.map(cartaoLista).join('')}</div>`;
  }

  // ---------- Detalhe ----------

  function cartao(rotulo, valor, texto, tom = 'neutro') {
    const tons = { neutro: 'cartao', ambar: 'rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 shadow-sm', vermelho: 'rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 shadow-sm' };
    return `<div class="${tons[tom]} p-5"><p class="rotulo">${esc(rotulo)}</p><p class="font-display font-semibold text-lg text-slate-900 dark:text-neutral-100 mt-1.5 leading-snug">${valor}</p><p class="text-sm text-slate-500 dark:text-neutral-400 mt-1">${texto}</p></div>`;
  }

  function textoContratante(b) {
    const r = b.responsavel;
    if (b.ehContratante) return 'Você (o próprio aluno)';
    if (r.tipo === 'empresa') return `${r.nome} (empresa)`;
    if (r.tipo === 'terceiro') return `${r.nome}${r.parentesco ? ` (${r.parentesco.toLowerCase()})` : ' (responsável)'}`;
    if (r.tipo === 'responsavel') return `${r.nome} (responsável financeiro)`;
    if (r.tipo === 'aluno') return `${r.nome} (aluno responsável pelo contrato)`;
    return r.nome;
  }

  function renderFaixa(b) {
    const el = $('faixa');
    const c = b.contrato;
    const a = b.arrependimento;
    const pedidoAberto = PortalAluno.solicitacaoAberta(aluno.id, b.contrato.id, 'cancelamento');
    if (b.situacao.id !== 'cancelado' && a.online && a.dentro) {
      el.className = 'surgir rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 px-5 py-4 text-sm text-slate-700 dark:text-neutral-200';
      el.innerHTML = `<p class="font-medium text-slate-900 dark:text-neutral-100">Prazo de arrependimento: até ${data(a.ate)} você pode desistir sem multa.</p>
        <p class="mt-0.5">Contratação feita pela internet há ${plural(a.dias, 'dia')}: pelo item 13 dos Termos Gerais, o cancelamento em até ${a.limite} dias da inscrição devolve tudo o que foi pago. ${pedidoAberto ? 'Seu pedido de cancelamento já está em análise.' : '<button type="button" data-acao="nova-solicitacao" data-tipo="cancelamento" class="link">Pedir cancelamento</button>'}</p>`;
      el.classList.remove('hidden');
      return;
    }
    if (b.assinaturaPendente) {
      el.className = 'surgir rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 flex flex-wrap items-center justify-between gap-3';
      el.innerHTML = `<div><p class="font-medium text-slate-900 dark:text-neutral-100">Falta a sua assinatura no contrato ${esc(b.codigo)}.</p><p class="mt-0.5">O envelope ${esc(b.envelope.envelopeId)} foi enviado pelo Clicksign para <strong>${esc(b.assinaturaPendente.email)}</strong>${b.envelope.prazoDias ? ` com prazo de ${b.envelope.prazoDias} dias` : ''}. Você também pode assinar por aqui.</p></div>
        <button type="button" data-acao="assinar" data-contrato="${b.contrato.id}" class="botao-pri">Assinar agora</button>`;
      el.classList.remove('hidden');
      return;
    }
    if (c.status === 'aguardando' && !b.ehContratante && !b.assinaturas.contratante) {
      el.className = 'surgir rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/40 px-5 py-4 text-sm text-slate-700 dark:text-neutral-200';
      el.innerHTML = `<p class="font-medium text-slate-900 dark:text-neutral-100">O contrato aguarda a assinatura de ${esc(b.responsavel.nome)}.</p><p class="mt-0.5">O link de assinatura foi enviado para ${b.responsavel.email ? `<strong>${esc(b.responsavel.email)}</strong>` : 'o e-mail cadastrado'}. Enquanto isso, os boletos não são emitidos.</p>`;
      el.classList.remove('hidden');
      return;
    }
    el.classList.add('hidden');
  }

  function renderCabecalho(b) {
    const c = b.contrato;
    const nParc = c.parcelas.length;
    const ass = b.assinado ? ponto('bg-emerald-500', `Assinado em ${PortalAluno.fmtData(b.assinadoEm)}`) : b.situacao.id === 'cancelado' ? ponto('bg-red-500', 'Cancelado') : ponto('bg-amber-500', b.assinaturaPendente ? 'Falta a sua assinatura' : 'Aguardando assinatura');
    const assTexto = b.assinado ? `Contratante e ProWay${b.assinaturas.contratante?.envelopeId ? ` · Clicksign ${esc(b.assinaturas.contratante.envelopeId)}` : ''}` : [b.assinaturas.contratante ? 'Contratante assinou' : 'Contratante pendente', b.assinaturas.escola ? 'ProWay assinou' : 'ProWay pendente'].join(' · ');
    const prog = b.totalAtivos ? `${b.concluidos} de ${b.totalAtivos} cursos concluídos` : 'Nenhuma matrícula ativa';
    const pctGeral = b.totalAtivos ? Math.round(b.matriculas.filter((m) => Contratos.matriculaAtiva(m.item)).reduce((s, m) => s + m.pct, 0) / b.totalAtivos) : 0;
    $('cabecalho').innerHTML = [
      cartao('Situação', ponto(b.situacao.ponto, b.situacao.nome), c.status === 'cancelado' && c.cancelamento ? `Cancelado em ${data(c.cancelamento.em)}` : `Criado em ${data(c.criadoEm)}${b.vendedor ? ` · ${esc(b.vendedor)}` : ''}`, b.situacao.id === 'cancelado' ? 'vermelho' : 'neutro'),
      cartao('Valor das suas matrículas', moeda(b.valorAluno), `Contrato ${moeda(b.totais.final)}${nParc ? ` em ${nParc}× de ${moeda(c.parcelas[nParc - 1].valor)}` : ''}${c.cobranca?.forma ? ` · ${esc(nomeDe(FORMAS_COBRANCA, c.cobranca.forma))}` : ''}`),
      cartao('Assinatura', ass, assTexto, b.assinaturaPendente ? 'ambar' : 'neutro'),
      cartao('Progresso', `${pctGeral}% <span class="text-sm font-sans font-normal text-slate-500 dark:text-neutral-400">das aulas</span>`, esc(prog)),
    ].join('');
  }

  function renderAbas(b) {
    const n = (id) => (id === 'evolucao' ? b.matriculas.length : id === 'solicitacoes' ? PortalAluno.solicitacoesDoAluno(aluno.id, b.contrato.id).length : null);
    $('abas').innerHTML = ABAS.map((x) => `
      <button type="button" data-aba="${x.id}" class="px-1 pb-2.5 -mb-px text-sm border-b-2 transition whitespace-nowrap ${estado.aba === x.id ? 'border-[color:var(--f-marca-tinta)] text-slate-900 dark:text-neutral-100 font-medium' : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'}">${x.titulo}${n(x.id) != null ? ` <span class="ml-1 text-xs text-slate-400 tabular-nums">${n(x.id)}</span>` : ''}</button>`).join('');
  }

  // ----- Aba Resumo -----

  function renderResumo(b) {
    const c = b.contrato;
    const dado = (r, v) => `<div><p class="rotulo">${esc(r)}</p><div class="text-sm text-slate-800 dark:text-neutral-100 mt-0.5">${v}</div></div>`;
    const venda = [...b.venda.formacoes.map((f) => `Formação ${f.nome}`), ...b.venda.cursosAvulsos.map((x) => `${x.nome} (avulso)`)].map(esc).join('<br>') || '—';
    const nParc = c.parcelas.length;
    const parcelas = nParc ? `${nParc}× de ${moeda(c.parcelas[nParc - 1].valor)}${c.cobranca?.forma ? ` · ${esc(nomeDe(FORMAS_COBRANCA, c.cobranca.forma))}` : ''}${c.cobranca?.primeiroVencimento ? ` · 1ª em ${data(c.cobranca.primeiroVencimento)}` : ''}` : 'A definir';
    const assinaturaDe = (parte, rotulo, nomePadrao) => {
      const a = b.assinaturas[parte];
      return `<div class="rounded-lg border ${a ? 'border-emerald-200 dark:border-emerald-800' : 'border-dashed border-slate-300 dark:border-neutral-700'} px-3 py-2"><p class="rotulo">${esc(rotulo)}</p><p class="text-sm font-medium text-slate-800 dark:text-neutral-100 mt-0.5">${esc(a ? a.por : nomePadrao)}</p><p class="text-xs mt-0.5">${a ? ponto('bg-emerald-500', `${PortalAluno.fmtData(a.assinadoEm)} · ${nomeDe(MEIOS_ASSINATURA, a.meio).toLowerCase()}`) : ponto('bg-amber-500', 'assinatura pendente')}</p></div>`;
    };
    const nf = b.nf ? `NF ${esc(b.nf.numero)} · ${data(b.nf.emitidaEm)} <button type="button" data-acao="baixar-nf" data-contrato="${c.id}" class="link ml-1">Baixar NF</button>` : `<span class="text-slate-400">${b.situacao.id === 'cancelado' ? '—' : 'Ainda não emitida'}</span>`;
    const cancel = c.status === 'cancelado' && c.cancelamento ? `<div class="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 mb-4"><p class="font-medium text-slate-900 dark:text-neutral-100">Contrato cancelado em ${data(c.cancelamento.em)}${c.cancelamento.motivo ? `: ${esc(c.cancelamento.motivo)}` : '.'}</p>${c.cancelamento.rescisao ? `<p class="mt-0.5">Acerto da rescisão: devido ${moeda(c.cancelamento.rescisao.devido)} · pago ${moeda(c.cancelamento.rescisao.pago)} · saldo ${moeda(Math.abs(c.cancelamento.rescisao.saldo))} ${c.cancelamento.rescisao.saldo > 0 ? 'a pagar' : c.cancelamento.rescisao.saldo < 0 ? 'a seu favor' : '(quitado)'}.</p>` : ''}</div>` : '';
    const linhaItem = (m) => {
      const s = SITUACAO_MATRICULA[m.situacao];
      return `<tr class="${Contratos.matriculaAtiva(m.item) ? '' : 'opacity-60'}"><td>${esc(m.curso?.nome ?? m.item.cursoId)}${m.turma ? ` <span class="font-mono text-xs text-slate-400 ml-1">${esc(m.turma.codigo)}</span>` : ''}</td><td class="text-slate-500 dark:text-neutral-400">${esc(m.item.formacaoId ? Clientes.porId(b.ctx.formacoes, m.item.formacaoId)?.nome ?? '' : 'Curso avulso')}</td><td class="text-slate-500 dark:text-neutral-400 tabular-nums">${m.turma ? `${data(m.turma.inicio)} – ${data(m.turma.fim)}` : '—'}</td><td>${ponto(s.ponto, s.nome)}</td></tr>`;
    };
    $('conteudo-aba').innerHTML = `
      ${cancel}
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section class="cartao xl:col-span-2">
          <div class="px-5 py-4 border-b border-slate-100 dark:border-neutral-900"><p class="titulo-secao">Dados do contrato</p></div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4 px-5 py-4">
            ${dado('Código', `<span class="font-mono">${esc(c.codigo)}</span>`)}
            ${dado('Descrição', esc(b.descricao))}
            ${dado('O que foi contratado', venda)}
            ${dado('Contratante / pagador', esc(textoContratante(b)))}
            ${dado('Valor total do contrato', `${moeda(b.totais.final)}${b.totais.desconto > 0 ? ` <span class="text-xs text-slate-500 dark:text-neutral-400">(tabela ${moeda(b.totais.base)}, desconto ${moeda(b.totais.desconto)})</span>` : ''}`)}
            ${dado('Valor das suas matrículas', moeda(b.valorAluno))}
            ${dado('Parcelas', parcelas)}
            ${dado('Atendente', esc(b.vendedor || '—'))}
            ${dado('Criado em', dataHora(c.criadoEm))}
            ${dado('Sua matrícula', `<span class="font-mono">${esc(b.vinculo?.codigo ?? '—')}</span>`)}
            ${dado('Nota fiscal', nf)}
            ${c.cobranca?.pedidoCompra ? dado('Pedido de compra', esc(c.cobranca.pedidoCompra)) : ''}
          </div>
          <div class="px-5 pb-5">
            <p class="rotulo mb-2">Suas matrículas neste contrato</p>
            <div class="rounded-lg border border-slate-200 dark:border-neutral-800 overflow-x-auto"><table class="tabela w-full">
              <thead><tr><th>Curso</th><th>Formação</th><th>Período</th><th>Situação</th></tr></thead>
              <tbody>${b.matriculas.length ? b.matriculas.map(linhaItem).join('') : '<tr><td colspan="4" class="text-center text-slate-500 dark:text-neutral-400">Nenhuma matrícula.</td></tr>'}</tbody>
            </table></div>
            <p class="text-xs text-slate-500 dark:text-neutral-400 mt-2">Parcelas e boletos ficam em <a href="financeiro.html" class="link">Financeiro</a>.</p>
          </div>
        </section>
        <div class="space-y-4">
          <section class="cartao">
            <div class="px-5 py-4 border-b border-slate-100 dark:border-neutral-900"><p class="titulo-secao">Documento</p><p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${c.documento ? `Versão ${c.documento.versao} · gerada em ${dataHora(c.documento.geradoEm)}` : 'Ainda não gerado pela secretaria.'}</p></div>
            <div class="p-5 space-y-3">
              <div class="grid grid-cols-1 gap-2">
                ${assinaturaDe('contratante', 'Contratante', b.responsavel.nome)}
                ${assinaturaDe('escola', 'ProWay', ESCOLA_SIGNATARIA.nome)}
              </div>
              <div class="flex flex-wrap gap-2 pt-1">
                <button type="button" data-acao="ver-contrato" data-contrato="${c.id}" class="botao-sec">Ver contrato</button>
                <button type="button" data-acao="baixar-pdf" data-contrato="${c.id}" class="botao-sec" ${c.documento ? '' : 'disabled'}>Baixar PDF</button>
                ${b.assinaturaPendente ? `<button type="button" data-acao="assinar" data-contrato="${c.id}" class="botao-pri">Assinar agora</button>` : ''}
              </div>
              ${b.envelope && b.envelope.status === 'enviado' && !b.assinaturaPendente ? `<p class="text-xs text-slate-500 dark:text-neutral-400">Envelope ${esc(b.envelope.envelopeId)} no Clicksign aguardando: ${esc(Contratos.signatariosPendentes(b.envelope).map((s) => s.nome).join(', ') || '—')}.</p>` : ''}
            </div>
          </section>
          <section class="cartao">
            <div class="px-5 py-4 border-b border-slate-100 dark:border-neutral-900"><p class="titulo-secao">Precisa de algo?</p></div>
            <div class="p-5 text-sm text-slate-600 dark:text-neutral-300 space-y-2">
              <p>Cancelamento, segunda via, trancamento ou troca de turma são pedidos feitos na aba <button type="button" data-aba-ir="solicitacoes" class="link">Solicitações</button>; a secretaria responde por lá.</p>
              <p class="text-xs text-slate-500 dark:text-neutral-400">Dúvidas sobre cobrança: <a href="financeiro.html" class="link">Financeiro</a>.</p>
            </div>
          </section>
          ${b.situacao.id !== 'cancelado' ? `
          <section class="cartao">
            <div class="px-5 py-4 border-b border-slate-100 dark:border-neutral-900"><p class="titulo-secao">Cancelamento</p></div>
            <div class="p-5 text-sm text-slate-600 dark:text-neutral-300 space-y-3">
              <p>Veja quanto custaria encerrar o contrato hoje, pelos Termos Gerais, sem fazer o pedido.</p>
              <button type="button" data-acao="simular" data-contrato="${c.id}" class="botao-sec">Simular cancelamento</button>
            </div>
          </section>` : ''}
        </div>
      </div>`;
  }

  // ----- Aba Evolução -----

  function renderEvolucao(b) {
    const c = b.contrato;
    const ativas = b.matriculas.filter((m) => Contratos.matriculaAtiva(m.item));
    const pctCursos = b.totalAtivos ? Math.round((b.concluidos / b.totalAtivos) * 100) : 0;
    const linha = (m) => {
      const s = SITUACAO_MATRICULA[m.situacao];
      const barra = `<div class="flex items-center gap-2 min-w-[140px]"><div class="flex-1 h-2 rounded-full bg-slate-200 dark:bg-neutral-800 overflow-hidden"><div class="h-full rounded-full ${m.situacao === 'concluido' ? 'bg-sky-500' : m.situacao === 'desistiu' || m.situacao === 'cancelada' ? 'bg-slate-400' : 'bg-emerald-500'}" style="width:${m.pct}%"></div></div><span class="text-xs tabular-nums text-slate-500 dark:text-neutral-400 w-10 text-right">${m.pct}%</span></div>`;
      const detalhe = m.aulas ? `${m.realizadas}/${m.aulas} aulas` : m.turma ? 'Sem aulas agendadas' : 'Turma a definir';
      return `<tr class="${Contratos.matriculaAtiva(m.item) ? '' : 'opacity-60'}">
        <td>${esc(m.curso?.nome ?? m.item.cursoId)}${m.turma ? ` <span class="font-mono text-xs text-slate-400 ml-1">${esc(m.turma.codigo)}</span>` : ''}</td>
        <td>${ponto(s.ponto, s.nome)}</td>
        <td class="tabular-nums text-slate-500 dark:text-neutral-400">${m.turma ? `${data(m.turma.inicio)} – ${data(m.turma.fim)}` : '—'}</td>
        <td class="text-slate-500 dark:text-neutral-400">${esc(m.instrutor?.nome ?? '—')}</td>
        <td>${barra}<p class="text-xs text-slate-400 mt-0.5">${esc(detalhe)}</p></td>
        <td>${m.turma ? `<a href="curso.html?turma=${encodeURIComponent(m.turma.id)}" class="link">Ver curso</a>` : ''}</td>
      </tr>`;
    };
    const COR_EVENTO = { assinatura: 'bg-emerald-500', cancelamento: 'bg-red-500', nf: 'bg-sky-500', cobranca: 'bg-slate-400', geral: 'bg-slate-300 dark:bg-neutral-600' };
    const eventos = b.linhaDoTempo;
    $('conteudo-aba').innerHTML = `
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section class="cartao xl:col-span-2 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 dark:border-neutral-900 flex flex-wrap items-center justify-between gap-3">
            <div><p class="titulo-secao">Progresso das matrículas</p><p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Aulas realizadas até ${PortalAluno.fmtData(hoje)} em cada turma.</p></div>
            <p class="text-sm text-slate-600 dark:text-neutral-300">${b.totalAtivos ? `${b.concluidos} de ${b.totalAtivos} cursos concluídos` : 'Nenhuma matrícula ativa'}</p>
          </div>
          <div class="px-5 pt-4">
            <div class="h-2.5 rounded-full bg-slate-200 dark:bg-neutral-800 overflow-hidden"><div class="h-full rounded-full bg-laranja" style="width:${pctCursos}%"></div></div>
            <p class="text-xs text-slate-500 dark:text-neutral-400 mt-1.5">${pctCursos}% dos cursos concluídos${ativas.some((m) => m.situacao === 'em_andamento') ? ` · ${plural(ativas.filter((m) => m.situacao === 'em_andamento').length, 'curso')} em andamento` : ''}${ativas.some((m) => m.situacao === 'a_iniciar') ? ` · ${ativas.filter((m) => m.situacao === 'a_iniciar').length} a iniciar` : ''}</p>
          </div>
          <div class="p-5 overflow-x-auto"><table class="tabela w-full">
            <thead><tr><th>Curso</th><th>Situação</th><th>Período</th><th>Instrutor</th><th>Aulas</th><th></th></tr></thead>
            <tbody>${b.matriculas.length ? b.matriculas.map(linha).join('') : '<tr><td colspan="6" class="text-center text-slate-500 dark:text-neutral-400">Nenhuma matrícula.</td></tr>'}</tbody>
          </table></div>
        </section>
        <section class="cartao">
          <div class="px-5 py-4 border-b border-slate-100 dark:border-neutral-900"><p class="titulo-secao">Linha do tempo</p><p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${plural(eventos.length, 'evento')} · situação atual: ${ponto(b.situacao.ponto, b.situacao.nome)}</p></div>
          <div class="p-5">${eventos.length ? `<ol class="relative border-l border-slate-200 dark:border-neutral-800 ml-2 space-y-4">${eventos.map((e) => `
            <li class="pl-4">
              <span class="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full ${COR_EVENTO[e.tipo] ?? COR_EVENTO.geral} ring-2 ring-white dark:ring-neutral-950"></span>
              <p class="text-sm text-slate-800 dark:text-neutral-100">${esc(e.texto)}</p>
              <p class="text-xs text-slate-500 dark:text-neutral-400">${dataHora(e.em)}</p>
            </li>`).join('')}</ol>` : '<p class="text-sm text-slate-500 dark:text-neutral-400">Nenhum evento registrado.</p>'}</div>
        </section>
      </div>`;
  }

  // ----- Aba Solicitações -----

  function descricaoSolicitacao(s) {
    const d = s.dados ?? {};
    if (s.tipo === 'cancelamento') return `${d.motivo ?? ''}${d.observacao ? ` — ${d.observacao}` : ''}${d.simulacao ? ` · saldo ${d.simulacao.saldo > 0 ? `a pagar ${Contratos.fmtMoeda(d.simulacao.saldo)}` : d.simulacao.saldo < 0 ? `a seu favor ${Contratos.fmtMoeda(-d.simulacao.saldo)} (${nomeDe(Contratos.DESTINOS_SALDO, d.destino).toLowerCase()})` : 'zero'}` : ''}`;
    if (s.tipo === 'segunda_via') return `${d.pedido ?? ''}${d.observacao ? ` — ${d.observacao}` : ''}`;
    if (s.tipo === 'trancamento') return `${d.motivo ?? ''}${d.retorno ? ` · retorno ${d.retorno.toLowerCase()}` : ''}${d.observacao ? ` — ${d.observacao}` : ''}`;
    if (s.tipo === 'transferencia') return `${d.curso ?? ''}: ${d.turmaAtual ?? '—'} → ${d.turmaNova ?? ''}${d.observacao ? ` — ${d.observacao}` : ''}`;
    return '';
  }

  function renderSolicitacoes(b) {
    const c = b.contrato;
    const lista = PortalAluno.solicitacoesDoAluno(aluno.id, c.id);
    const podePedir = b.situacao.id !== 'cancelado';
    const linha = (s) => {
      const st = PortalAluno.STATUS_SOLICITACAO.find((x) => x.id === s.status);
      return `<tr>
        <td class="tabular-nums whitespace-nowrap">${dataHora(s.em)}</td>
        <td><span class="font-medium text-slate-800 dark:text-neutral-100">${esc(nomeDe(PortalAluno.TIPOS_SOLICITACAO, s.tipo))}</span><p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(descricaoSolicitacao(s))}</p></td>
        <td>${ponto(st.ponto, st.nome)}</td>
        <td class="text-slate-500 dark:text-neutral-400">${s.resposta ? esc(s.resposta) : s.status === 'em_analise' ? '<span class="text-slate-400">Aguardando a secretaria</span>' : '—'}</td>
        <td class="text-right">${s.status === 'em_analise' ? `<button type="button" data-acao="desistir" data-solicitacao="${s.id}" class="link">Desistir do pedido</button>` : ''}</td>
      </tr>`;
    };
    $('conteudo-aba').innerHTML = `
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section class="cartao">
          <div class="px-5 py-4 border-b border-slate-100 dark:border-neutral-900"><p class="titulo-secao">Nova solicitação</p><p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Escolha o tipo; a secretaria analisa e responde aqui.</p></div>
          <div class="p-5 space-y-3">
            ${podePedir ? `
              <div><label class="rotulo block mb-1" for="tipo-solicitacao">Tipo de pedido</label>
                <select id="tipo-solicitacao" class="${campo}"><option value="">Selecione…</option>${PortalAluno.TIPOS_SOLICITACAO.map((t) => `<option value="${t.id}">${esc(t.nome)}</option>`).join('')}</select>
                <p data-erro class="hidden text-xs text-red-600 dark:text-red-400 mt-1"></p>
                <p id="descricao-tipo" class="text-xs text-slate-500 dark:text-neutral-400 mt-1"></p>
              </div>
              <div class="flex flex-wrap items-center gap-3"><button type="button" data-acao="continuar-solicitacao" data-contrato="${c.id}" class="botao-pri">Continuar</button><button type="button" data-acao="simular" data-contrato="${c.id}" class="link">Simular cancelamento antes</button></div>` : '<p class="text-sm text-slate-500 dark:text-neutral-400">Este contrato está cancelado; novos pedidos não se aplicam.</p>'}
            <ul class="text-xs text-slate-500 dark:text-neutral-400 space-y-1 pt-2 border-t border-slate-100 dark:border-neutral-900">
              ${PortalAluno.TIPOS_SOLICITACAO.map((t) => `<li><span class="font-medium text-slate-700 dark:text-neutral-200">${esc(t.nome)}:</span> ${esc(t.descricao)}</li>`).join('')}
            </ul>
          </div>
        </section>
        <section class="cartao xl:col-span-2 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 dark:border-neutral-900"><p class="titulo-secao">Suas solicitações</p><p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${plural(lista.length, 'pedido')} neste contrato.</p></div>
          ${lista.length ? `<div class="overflow-x-auto"><table class="tabela w-full"><thead><tr><th>Quando</th><th>Pedido</th><th>Status</th><th>Resposta</th><th></th></tr></thead><tbody>${lista.map(linha).join('')}</tbody></table></div>` : '<div class="px-5 py-8 text-center text-sm text-slate-500 dark:text-neutral-400">Nenhum pedido feito ainda.</div>'}
        </section>
      </div>`;
    $('tipo-solicitacao')?.addEventListener('change', (e) => { $('descricao-tipo').textContent = PortalAluno.TIPOS_SOLICITACAO.find((t) => t.id === e.target.value)?.descricao ?? ''; });
  }

  // ---------- Modais: documento ----------

  function modalContrato(b) {
    const c = b.contrato;
    const t = b.totais;
    const r = b.responsavel;
    const contratanteTxt = `${esc(r.nome)}${r.documento ? `, ${r.tipo === 'empresa' ? 'CNPJ' : 'CPF'} ${esc(r.documento)}` : ''}${r.tipo === 'terceiro' ? `, responsável por ${esc(r.aluno.nome)}` : r.tipo === 'responsavel' ? ' (responsável financeiro)' : ''}`;
    const linhaPacote = (pp) => `<tr><td class="py-1.5 pr-3 align-top"><strong>${esc(pp.pacote.nome)}</strong><br><span class="text-xs">${pp.pacote.itens.map((it) => esc(Contratos.rotuloItem(b.ctx, it))).join('; ') || '<em>sem itens</em>'}</span></td><td class="py-1.5 px-3 text-right align-top tabular-nums whitespace-nowrap">${moeda(pp.valorPacote)}</td><td class="py-1.5 px-3 text-right align-top tabular-nums">${pp.vagas}</td><td class="py-1.5 pl-3 text-right align-top tabular-nums whitespace-nowrap">${moeda(pp.final)}</td></tr>`;
    const partes = PARTES_ASSINATURA.map((p) => { const a = b.assinaturas[p.id]; return `<div class="rounded-lg border ${a ? 'border-emerald-200 dark:border-emerald-800' : 'border-dashed border-slate-300 dark:border-neutral-700'} px-3 py-2 font-sans"><p class="rotulo">${esc(p.nome)}</p>${a ? `<p class="font-medium text-slate-800 dark:text-neutral-100">${esc(a.por)}</p><p class="text-xs text-slate-500 dark:text-neutral-400">${data(a.assinadoEm)} · ${esc(nomeDe(MEIOS_ASSINATURA, a.meio)).toLowerCase()}${a.envelopeId ? ` · ${esc(a.envelopeId)}` : ''}</p>` : '<p class="text-sm text-slate-400">assinatura pendente</p>'}</div>`; }).join('');
    abrirModal(`${cabecalhoModal(`Contrato ${c.codigo}`, c.documento ? `Documento v${c.documento.versao} · gerado em ${dataHora(c.documento.geradoEm)}${b.assinado ? ' · assinado' : ''}` : 'Documento ainda não gerado — resumo do contrato')}
      <div class="p-6 font-serif text-sm leading-relaxed text-slate-800 dark:text-neutral-200 space-y-3">
        <p class="font-display font-semibold text-base text-center uppercase tracking-wide">Contrato de prestação de serviços educacionais · ${esc(c.codigo)}</p>
        <p><strong>Contratada:</strong> ProWay Informática e Treinamentos Ltda.</p>
        <p><strong>Contratante / responsável financeiro:</strong> ${contratanteTxt}.</p>
        <p><strong>Objeto:</strong> ${esc(b.descricao)}, conforme os pacotes e vagas abaixo:</p>
        <table class="w-full text-sm">
          <thead class="text-left text-[11px] uppercase tracking-wider text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-800"><tr><th class="py-1 pr-3 font-semibold">Pacote e itens</th><th class="py-1 px-3 text-right font-semibold">Valor unitário</th><th class="py-1 px-3 text-right font-semibold">Vagas</th><th class="py-1 pl-3 text-right font-semibold">Subtotal</th></tr></thead>
          <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">${t.porPacote.length ? t.porPacote.map(linhaPacote).join('') : '<tr><td colspan="4" class="py-2 text-slate-400">—</td></tr>'}</tbody>
        </table>
        <p><strong>Valor total:</strong> ${moeda(t.final)}${t.desconto > 0 ? ` (valor de tabela ${moeda(t.base)}, desconto de ${moeda(t.desconto)})` : ''}, em ${c.cobranca.parcelas} parcela(s) via ${esc(nomeDe(FORMAS_COBRANCA, c.cobranca.forma)).toLowerCase()}${c.cobranca.primeiroVencimento ? `, a primeira em ${data(c.cobranca.primeiroVencimento)}` : ''}.</p>
        <p><strong>Rescisão (Termos Gerais):</strong> cursos concluídos são devidos integralmente; curso em andamento é devido em 50% até 1/3 da duração e 100% depois; cursos não iniciados têm multa de 10%; descontos perdem eficácia. Contratação online pode ser desfeita sem multa em até 7 dias.</p>
        <p class="text-xs text-slate-500 dark:text-neutral-400">Cláusulas padrão (reposição, certificado, LGPD) entram aqui no documento real.</p>
        <div class="pt-3 border-t border-slate-200 dark:border-neutral-800">
          <p><strong>Anexo — sua matrícula</strong> <span class="text-xs text-slate-500 dark:text-neutral-400">(${esc(b.vinculo?.codigo ?? '')})</span></p>
          <ul class="list-disc pl-6 mt-1">${b.itens.filter(Contratos.matriculaAtiva).map((it) => `<li>${esc(Contratos.rotuloItem(b.ctx, it))}</li>`).join('') || '<li class="text-slate-400">sem itens ativos</li>'}</ul>
        </div>
        <div class="pt-3 border-t border-slate-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-3">${partes}</div>
      </div>
      ${rodapeModal(`<button type="button" data-acao="baixar-pdf" data-contrato="${c.id}" class="botao-pri" ${c.documento ? '' : 'disabled'}>Baixar PDF</button>`)}`, 'max-w-3xl');
  }

  function assinar(b) {
    const s = b.assinaturaPendente;
    if (!s) return;
    Contratos.salvar(Contratos.assinarNoClicksign(Contratos.carregar(), b.contrato.id, s.id));
    recarregar();
    const novo = blocoDe(b.contrato.id);
    toast(novo.assinado ? 'Contrato assinado pelas duas partes. Boa jornada!' : 'Sua assinatura foi registrada no Clicksign.');
    renderDetalhe(novo);
  }

  // ---------- Modais: solicitações ----------

  function abrirSolicitacao(b, tipo) {
    if (PortalAluno.solicitacaoAberta(aluno.id, b.contrato.id, tipo)) { toast(`Já existe um pedido de ${nomeDe(PortalAluno.TIPOS_SOLICITACAO, tipo).toLowerCase()} em análise.`); return; }
    if (tipo === 'cancelamento') modalCancelamento(b);
    else if (tipo === 'segunda_via') modalSegundaVia(b);
    else if (tipo === 'trancamento') modalTrancamento(b);
    else if (tipo === 'transferencia') modalTransferencia(b);
  }

  function concluirSolicitacao(b, tipo, dados, msg) {
    PortalAluno.registrarSolicitacao({ alunoId: aluno.id, contratoId: b.contrato.id, tipo, dados });
    fecharModal();
    toast(msg);
    estado.aba = 'solicitacoes';
    renderDetalhe(b);
  }

  const passos = (atual, nomes) => `<ol class="flex items-center gap-2 text-xs px-5 pt-4">${nomes.map((n, i) => `<li class="flex items-center gap-1.5 ${i + 1 === atual ? 'text-slate-900 dark:text-neutral-100 font-medium' : 'text-slate-400'}"><span class="h-5 w-5 rounded-full grid place-items-center text-[11px] ${i + 1 < atual ? 'bg-emerald-500 text-white' : i + 1 === atual ? 'bg-laranja text-white' : 'bg-slate-200 dark:bg-neutral-800'}">${i + 1 < atual ? '✓' : i + 1}</span>${esc(n)}</li>${i < nomes.length - 1 ? '<li class="w-6 h-px bg-slate-200 dark:bg-neutral-800"></li>' : ''}`).join('')}</ol>`;

  // Corpo da simulação da rescisão (regras, tabela, totais e faixa de saldo). Usado no passo 2 do pedido de
  // cancelamento (com o select de destino do saldo) e no modal avulso "Quanto custaria cancelar hoje" (sem ele).
  function corpoSimulacaoHtml(b, sim, { comDestino = false, nota = '' } = {}) {
    const linhaSim = (l) => {
      const s = SITUACAO_RESCISAO[l.situacao] ?? { nome: l.situacao, ponto: 'bg-slate-400' };
      const rotulo = l.alunoId === null ? `${plural(l.vagas ?? 0, 'vaga livre', 'vagas livres')} · ${esc(l.pacote?.nome ?? '')}` : esc(Contratos.rotuloItem(b.ctx, l.item));
      const outro = l.alunoId && l.alunoId !== aluno.id ? ` <span class="text-xs text-slate-400">(${esc(Clientes.porId(b.ctx.alunos, l.alunoId)?.nome ?? 'outro aluno')})</span>` : '';
      return `<tr><td>${rotulo}${outro}<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(l.regra)}</p></td><td>${ponto(s.ponto, s.nome)}</td><td class="text-right tabular-nums">${moeda(l.base)}</td><td class="text-right tabular-nums">${Math.round(l.pct * 100)}%</td><td class="text-right tabular-nums font-medium text-slate-800 dark:text-neutral-100">${moeda(l.devido)}</td></tr>`;
    };
    const tot = (rot, val, classe = '') => `<div class="flex justify-between gap-4 py-1 ${classe}"><span>${rot}</span><span class="tabular-nums">${val}</span></div>`;
    const outros = sim.linhas.some((l) => l.alunoId && l.alunoId !== aluno.id);
    const faixaSaldo = sim.saldo > 0
        ? `<div class="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-slate-800 dark:text-neutral-100"><strong>Saldo a pagar: ${moeda(sim.saldo)}</strong> — vence em ${data(sim.prazo)} (5 dias após a notificação, item 15).</div>`
        : sim.saldo < 0
          ? `<div class="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-slate-800 dark:text-neutral-100"><strong>Saldo a seu favor: ${moeda(-sim.saldo)}</strong> — devolução em 5 dias (item 15) ou carta de crédito válida até ${data(sim.validadeCarta)} (item 16).</div>`
          : `<div class="rounded-lg bg-slate-50 dark:bg-neutral-900 px-4 py-3 text-sm text-slate-800 dark:text-neutral-100"><strong>Sem saldo:</strong> o que foi pago cobre exatamente o devido.</div>`;
    return `
        <div class="p-5 space-y-4 text-sm text-slate-700 dark:text-neutral-200">
          <p class="text-xs text-slate-500 dark:text-neutral-400">Pelos Termos Gerais: cursos concluídos são devidos em 100%; curso em andamento, 50% até 1/3 da duração e 100% depois (item 14); não iniciados, multa de 10% (item 11); o desconto perde eficácia e o cálculo usa o valor de tabela (item 22).${sim.arrependimento ? ' <strong>Você está no prazo de arrependimento (item 13): nada é devido.</strong>' : ''}${outros ? ' O contrato inclui outros alunos — o acerto é do contrato inteiro.' : ''}</p>
          <div class="rounded-lg border border-slate-200 dark:border-neutral-800 overflow-x-auto"><table class="tabela w-full">
            <thead><tr><th>Curso / turma</th><th>Situação</th><th class="text-right">Valor</th><th class="text-right">%</th><th class="text-right">Devido</th></tr></thead>
            <tbody>${sim.linhas.length ? sim.linhas.map(linhaSim).join('') : '<tr><td colspan="5" class="text-center text-slate-500 dark:text-neutral-400">Nenhuma matrícula ativa — nada a calcular.</td></tr>'}</tbody>
          </table></div>
          <div class="grid md:grid-cols-2 gap-4">
            <div class="divide-y divide-slate-100 dark:divide-neutral-900">
              ${tot('Devido pela rescisão', moeda(sim.devido))}
              ${tot('Já pago', `− ${moeda(sim.pago)}`)}
              ${sim.encargos > 0 ? tot(`Encargos de ${plural(sim.vencidas.length, 'parcela vencida', 'parcelas vencidas')} (2% + 1% a.m.)`, `+ ${moeda(sim.encargos)}`) : ''}
              ${tot('<strong>Saldo</strong>', `<strong>${moeda(Math.abs(sim.saldo))}${sim.saldo > 0 ? ' a pagar' : sim.saldo < 0 ? ' a seu favor' : ''}</strong>`, 'text-slate-900 dark:text-neutral-100')}
            </div>
            <div class="space-y-3">
              ${faixaSaldo}
              ${comDestino && sim.saldo < 0 ? grupoCampo('Como prefere receber o saldo', selectDe('c-destino', Contratos.DESTINOS_SALDO.filter((d) => d.id === 'devolver' || d.id === 'carta_credito').map((d) => ({ id: d.id, nome: `${d.nome} — ${d.descricao}` })))) : ''}
            </div>
          </div>
          ${nota ? `<p class="text-xs text-slate-500 dark:text-neutral-400">${nota}</p>` : ''}
        </div>`;
  }

  // Simulação avulsa: o aluno vê quanto custaria cancelar hoje sem abrir pedido; nada é gravado.
  function modalSimulacao(b) {
    if (b.situacao.id === 'cancelado') { toast('Este contrato já está cancelado.'); return; }
    const c = b.contrato;
    const sim = PortalAluno.simularRescisaoPortal(b, hoje);
    const root = abrirModal(`${cabecalhoModal('Quanto custaria cancelar hoje', `Contrato ${esc(c.codigo)} · simulação em ${PortalAluno.fmtData(hoje)} · 1/3 da duração medido por aulas realizadas`)}
      ${corpoSimulacaoHtml(b, sim, { nota: 'Simulação sem compromisso: nada é registrado. O valor final é confirmado pela secretaria se você fizer o pedido.' })}
      <div class="px-5 py-3 border-t border-slate-100 dark:border-neutral-900 flex justify-end gap-2">
        <button type="button" data-fechar class="botao-sec">Fechar</button>
        <button type="button" id="sim-pedir" class="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-sm font-medium text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40">Solicitar cancelamento</button>
      </div>`, 'max-w-4xl');
    root.querySelector('#sim-pedir').addEventListener('click', () => { fecharModal(); abrirSolicitacao(b, 'cancelamento'); });
  }

  // Cancelamento em passos: motivo → simulação da rescisão → confirmação. Só registra a solicitação.
  function modalCancelamento(b) {
    const c = b.contrato;
    const NOMES = ['Motivo', 'Simulação', 'Confirmação'];
    const pedido = { motivo: '', observacao: '', destino: '' };
    let sim = null;

    const passo1 = () => {
      const root = abrirModal(`${cabecalhoModal('Solicitar cancelamento do contrato', `Contrato ${esc(c.codigo)} · ${esc(b.descricao)}`)}
        ${passos(1, NOMES)}
        <div class="p-5 space-y-4 text-sm text-slate-700 dark:text-neutral-200">
          <div class="rounded-lg bg-slate-50 dark:bg-neutral-900 px-4 py-3 text-xs text-slate-600 dark:text-neutral-300">O cancelamento é sempre do <strong>contrato inteiro</strong>: todas as suas matrículas neste contrato são encerradas. No próximo passo você vê o cálculo do acerto pelos Termos Gerais antes de confirmar.</div>
          ${grupoCampo('Motivo', selectDe('c-motivo', MOTIVOS_CANCELAMENTO))}
          ${grupoCampo('Conte um pouco mais <span class="normal-case font-normal tracking-normal text-slate-400">(opcional)</span>', `<textarea id="c-obs" rows="3" class="${campo}" placeholder="O que aconteceu? Isso ajuda a secretaria a analisar o pedido.">${esc(pedido.observacao)}</textarea>`)}
        </div>
        ${rodapeModal(`<button type="button" id="c-avancar" class="botao-pri">Ver simulação</button>`, 'Cancelar')}`, 'max-w-lg');
      if (pedido.motivo) root.querySelector('#c-motivo').value = pedido.motivo;
      root.querySelector('#c-avancar').addEventListener('click', () => {
        limparErros(root);
        const sel = root.querySelector('#c-motivo');
        if (!sel.value) { erroCampo(sel, 'Escolha o motivo.'); sel.focus(); return; }
        pedido.motivo = sel.value;
        pedido.observacao = root.querySelector('#c-obs').value.trim();
        passo2();
      });
    };

    const passo2 = () => {
      sim = PortalAluno.simularRescisaoPortal(b, hoje);
      const root = abrirModal(`${cabecalhoModal('Simulação da rescisão', `Contrato ${esc(c.codigo)} · pedido em ${PortalAluno.fmtData(hoje)} · 1/3 da duração medido por aulas realizadas`)}
        ${passos(2, NOMES)}
        ${corpoSimulacaoHtml(b, sim, { comDestino: true, nota: 'Simulação com os dados de hoje; o valor final é confirmado pela secretaria na análise do pedido.' })}
        <div class="px-5 py-3 border-t border-slate-100 dark:border-neutral-900 flex justify-between gap-2">
          <button type="button" id="c-voltar" class="botao-sec">Voltar</button>
          <div class="flex gap-2"><button type="button" data-fechar class="botao-sec">Cancelar</button><button type="button" id="c-avancar" class="botao-pri">Continuar</button></div>
        </div>`, 'max-w-4xl');
      if (pedido.destino) { const d = root.querySelector('#c-destino'); if (d) d.value = pedido.destino; }
      root.querySelector('#c-voltar').addEventListener('click', passo1);
      root.querySelector('#c-avancar').addEventListener('click', () => {
        limparErros(root);
        const d = root.querySelector('#c-destino');
        if (d && !d.value) { erroCampo(d, 'Escolha como quer receber o saldo.'); d.focus(); return; }
        pedido.destino = d ? d.value : sim.destino;
        passo3();
      });
    };

    const passo3 = () => {
      const cursos = b.matriculas.filter((m) => Contratos.matriculaAtiva(m.item));
      const saldoTxt = sim.saldo > 0 ? `saldo de <strong>${moeda(sim.saldo)} a pagar</strong> até ${data(sim.prazo)}` : sim.saldo < 0 ? `saldo de <strong>${moeda(-sim.saldo)} a seu favor</strong> (${esc(nomeDe(Contratos.DESTINOS_SALDO, pedido.destino).toLowerCase())})` : '<strong>sem saldo</strong> a pagar ou receber';
      const root = abrirModal(`
        <div class="px-5 py-4 border-b border-red-100 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 flex items-start justify-between gap-3 rounded-t-xl">
          <div><p class="titulo-secao text-red-800 dark:text-red-300">Solicitar cancelamento</p><p class="text-xs text-red-700/80 dark:text-red-300/80 mt-0.5">Contrato ${esc(c.codigo)} · ${esc(b.descricao)}</p></div>
          <button type="button" data-fechar title="Fechar" class="-mr-1 p-1 rounded-lg text-red-400 hover:text-red-700 dark:hover:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/40"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        ${passos(3, NOMES)}
        <div class="p-5 space-y-3 text-sm text-slate-700 dark:text-neutral-200">
          <p>Você está pedindo o cancelamento do <strong>contrato inteiro</strong>. Se a secretaria aprovar:</p>
          <ul class="list-disc pl-5 space-y-1">
            <li>${cursos.length ? `${plural(cursos.length, 'matrícula ativa é encerrada', 'matrículas ativas são encerradas')}: ${cursos.slice(0, 3).map((m) => `<strong>${esc(m.curso?.nome ?? m.item.cursoId)}</strong>`).join(', ')}${cursos.length > 3 ? ` e mais ${cursos.length - 3}` : ''}.` : 'Não há matrículas ativas para encerrar.'}</li>
            <li>Parcelas em aberto são canceladas e o acerto fica com ${saldoTxt}.</li>
            <li>Motivo informado: <strong>${esc(pedido.motivo)}</strong>${pedido.observacao ? ` — ${esc(pedido.observacao)}` : ''}.</li>
          </ul>
          <p class="text-xs text-slate-500 dark:text-neutral-400">Nada muda até a análise: o pedido fica "Em análise" e você pode desistir dele enquanto isso.</p>
        </div>
        <div class="px-5 py-3 border-t border-slate-100 dark:border-neutral-900 flex justify-between gap-2">
          <button type="button" id="c-voltar" class="botao-sec">Voltar</button>
          <div class="flex gap-2"><button type="button" data-fechar class="botao-sec">Manter contrato</button><button type="button" id="c-confirmar" class="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-sm font-medium text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40">Solicitar cancelamento</button></div>
        </div>`, 'max-w-lg');
      root.querySelector('#c-voltar').addEventListener('click', passo2);
      root.querySelector('#c-confirmar').addEventListener('click', () => {
        const memoria = { data: sim.data, criterio: sim.criterio, perdeDesconto: sim.perdeDesconto, arrependimento: sim.arrependimento, devido: sim.devido, pago: sim.pago, encargos: sim.encargos, saldo: sim.saldo, prazo: sim.prazo, validadeCarta: sim.validadeCarta, linhas: sim.linhas.map((l) => ({ itemId: l.item?.id ?? null, alunoId: l.alunoId, pacoteId: l.pacoteId ?? null, vagas: l.vagas ?? null, situacao: l.situacao, pct: l.pct, regra: l.regra, base: l.base, devido: l.devido })) };
        concluirSolicitacao(b, 'cancelamento', { motivo: pedido.motivo, observacao: pedido.observacao, destino: pedido.destino, simulacao: memoria }, 'Pedido de cancelamento enviado para análise.');
      });
    };

    passo1();
  }

  function modalSegundaVia(b) {
    const c = b.contrato;
    const root = abrirModal(`${cabecalhoModal('Segunda via / atualização de dados', `Contrato ${esc(c.codigo)}`)}
      <div class="p-5 space-y-4 text-sm text-slate-700 dark:text-neutral-200">
        ${grupoCampo('O que você precisa', selectDe('s-pedido', PEDIDOS_SEGUNDA_VIA))}
        ${grupoCampo('Detalhes <span class="normal-case font-normal tracking-normal text-slate-400">(novos dados, se for atualização)</span>', `<textarea id="s-obs" rows="3" class="${campo}" placeholder="Ex.: novo endereço completo, e-mail correto…"></textarea>`)}
        <p class="text-xs text-slate-500 dark:text-neutral-400">Dados cadastrais também podem ser conferidos em <a href="../aluno.html?id=${encodeURIComponent(aluno.id)}" class="link">Meus dados</a>.</p>
      </div>
      ${rodapeModal(`<button type="button" id="s-enviar" class="botao-pri">Enviar pedido</button>`, 'Cancelar')}`, 'max-w-lg');
    root.querySelector('#s-enviar').addEventListener('click', () => {
      limparErros(root);
      const sel = root.querySelector('#s-pedido');
      const obs = root.querySelector('#s-obs');
      if (!sel.value) { erroCampo(sel, 'Escolha o que precisa.'); sel.focus(); return; }
      if (/Atualizar|Corrigir|Outro/.test(sel.value) && !obs.value.trim()) { erroCampo(obs, 'Informe os dados novos ou o que precisa.'); obs.focus(); return; }
      concluirSolicitacao(b, 'segunda_via', { pedido: sel.value, observacao: obs.value.trim() }, 'Pedido enviado para a secretaria.');
    });
  }

  function modalTrancamento(b) {
    const c = b.contrato;
    const emAndamento = b.matriculas.filter((m) => m.situacao === 'em_andamento' || m.situacao === 'a_iniciar');
    const root = abrirModal(`${cabecalhoModal('Solicitar trancamento', `Contrato ${esc(c.codigo)} · ${esc(b.descricao)}`)}
      <div class="p-5 space-y-4 text-sm text-slate-700 dark:text-neutral-200">
        <div class="rounded-lg bg-slate-50 dark:bg-neutral-900 px-4 py-3 text-xs text-slate-600 dark:text-neutral-300">O trancamento pausa as aulas ${emAndamento.length ? `de ${emAndamento.map((m) => `<strong>${esc(m.curso?.nome ?? '')}</strong>`).join(', ')} ` : ''}mantendo o contrato; as parcelas continuam conforme o contrato até a secretaria responder. Este pedido apenas registra a solicitação.</div>
        ${grupoCampo('Motivo', selectDe('t-motivo', MOTIVOS_TRANCAMENTO))}
        ${grupoCampo('Previsão de retorno', selectDe('t-retorno', RETORNOS_TRANCAMENTO))}
        ${grupoCampo('Observações <span class="normal-case font-normal tracking-normal text-slate-400">(opcional)</span>', `<textarea id="t-obs" rows="3" class="${campo}"></textarea>`)}
      </div>
      ${rodapeModal(`<button type="button" id="t-enviar" class="botao-pri">Enviar pedido</button>`, 'Cancelar')}`, 'max-w-lg');
    root.querySelector('#t-enviar').addEventListener('click', () => {
      limparErros(root);
      const m = root.querySelector('#t-motivo'); const r = root.querySelector('#t-retorno');
      let ok = true;
      if (!m.value) { erroCampo(m, 'Escolha o motivo.'); ok = false; }
      if (!r.value) { erroCampo(r, 'Escolha a previsão de retorno.'); ok = false; }
      if (!ok) return;
      concluirSolicitacao(b, 'trancamento', { motivo: m.value, retorno: r.value, observacao: root.querySelector('#t-obs').value.trim() }, 'Pedido de trancamento enviado para análise.');
    });
  }

  function modalTransferencia(b) {
    const c = b.contrato;
    const opcoes = b.matriculas.filter((m) => Contratos.matriculaAtiva(m.item) && m.situacao !== 'concluido').map((m) => ({ m, turmas: PortalAluno.turmasParaTransferencia(m.item, hoje) }));
    const comTurma = opcoes.filter((o) => o.turmas.length);
    if (!comTurma.length) {
      abrirModal(`${cabecalhoModal('Transferência de turma', `Contrato ${esc(c.codigo)}`)}
        <div class="p-5 text-sm text-slate-700 dark:text-neutral-200 space-y-2">
          <p>${opcoes.length ? 'Nenhuma turma futura aberta para os seus cursos no momento.' : 'Você não tem matrículas em andamento ou a iniciar neste contrato.'}</p>
          <p class="text-xs text-slate-500 dark:text-neutral-400">Quando uma nova turma for planejada, ela aparece aqui. Se precisar, use "Segunda via / atualização de dados" para falar com a secretaria.</p>
        </div>${rodapeModal()}`, 'max-w-md');
      return;
    }
    const fmtTurma = (t) => `${t.codigo} · ${PortalAluno.fmtData(t.inicio)} a ${PortalAluno.fmtData(t.fim)}${t.turno ? ` · ${t.turno}` : ''}`;
    const root = abrirModal(`${cabecalhoModal('Solicitar transferência de turma', `Contrato ${esc(c.codigo)} · ${esc(b.descricao)}`)}
      <div class="p-5 space-y-4 text-sm text-slate-700 dark:text-neutral-200">
        ${grupoCampo('Matrícula', selectDe('tr-item', comTurma.map((o) => ({ id: o.m.item.id, nome: `${o.m.curso?.nome ?? o.m.item.cursoId}${o.m.turma ? ` — turma atual ${o.m.turma.codigo}` : ' — sem turma'}` }))))}
        <div id="tr-turma-caixa">${grupoCampo('Nova turma', `<select id="tr-turma" class="${campo}" disabled><option value="">Escolha a matrícula primeiro</option></select>`)}</div>
        ${grupoCampo('Motivo <span class="normal-case font-normal tracking-normal text-slate-400">(opcional)</span>', `<textarea id="tr-obs" rows="2" class="${campo}"></textarea>`)}
        <p class="text-xs text-slate-500 dark:text-neutral-400">A troca depende de vaga na turma nova; a secretaria confirma por aqui.</p>
      </div>
      ${rodapeModal(`<button type="button" id="tr-enviar" class="botao-pri">Enviar pedido</button>`, 'Cancelar')}`, 'max-w-lg');
    root.querySelector('#tr-item').addEventListener('change', (e) => {
      const o = comTurma.find((x) => x.m.item.id === e.target.value);
      root.querySelector('#tr-turma-caixa').innerHTML = grupoCampo('Nova turma', o ? selectDe('tr-turma', o.turmas.map((t) => ({ id: t.id, nome: fmtTurma(t) }))) : `<select id="tr-turma" class="${campo}" disabled><option value="">Escolha a matrícula primeiro</option></select>`);
    });
    root.querySelector('#tr-enviar').addEventListener('click', () => {
      limparErros(root);
      const si = root.querySelector('#tr-item'); const st = root.querySelector('#tr-turma');
      if (!si.value) { erroCampo(si, 'Escolha a matrícula.'); si.focus(); return; }
      if (!st.value) { erroCampo(st, 'Escolha a nova turma.'); st.focus(); return; }
      const o = comTurma.find((x) => x.m.item.id === si.value);
      const t = o.turmas.find((x) => x.id === st.value);
      concluirSolicitacao(b, 'transferencia', { itemId: o.m.item.id, curso: o.m.curso?.nome ?? o.m.item.cursoId, turmaAtualId: o.m.turma?.id ?? null, turmaAtual: o.m.turma?.codigo ?? null, turmaNovaId: t.id, turmaNova: fmtTurma(t), observacao: root.querySelector('#tr-obs').value.trim() }, 'Pedido de transferência enviado para análise.');
    });
  }

  // ---------- Eventos ----------

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-acao]');
    if (!btn) return;
    const acao = btn.dataset.acao;
    const b = btn.dataset.contrato ? blocoDe(btn.dataset.contrato) : blocoDe(estado.id);
    if (acao === 'desistir') {
      PortalAluno.desistirSolicitacao(btn.dataset.solicitacao);
      toast('Você desistiu do pedido.');
      renderDetalhe(b);
      return;
    }
    if (!b) return;
    if (acao === 'ver-contrato') modalContrato(b);
    else if (acao === 'simular') modalSimulacao(b);
    else if (acao === 'baixar-pdf') toast(`O PDF do contrato ${b.codigo}${b.assinado ? ' assinado (com o certificado do Clicksign)' : ''} fica para a integração.`);
    else if (acao === 'baixar-nf') toast(`NF ${b.nf?.numero}: o download do PDF fica para a integração com o emissor.`);
    else if (acao === 'assinar') assinar(b);
    else if (acao === 'nova-solicitacao') abrirSolicitacao(b, btn.dataset.tipo);
    else if (acao === 'continuar-solicitacao') {
      const sel = $('tipo-solicitacao');
      limparErros(document);
      if (!sel.value) { erroCampo(sel, 'Escolha o tipo de pedido.'); sel.focus(); return; }
      abrirSolicitacao(b, sel.value);
    }
  });

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-aba], [data-aba-ir]');
    if (!b) return;
    estado.aba = b.dataset.aba ?? b.dataset.abaIr;
    const bloco = blocoDe(estado.id);
    if (bloco) renderDetalhe(bloco);
    if (b.dataset.abaIr) document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-abrir], [data-voltar-lista]');
    if (!a) return;
    e.preventDefault();
    location.href = a.dataset.abrir ? `contrato.html?id=${encodeURIComponent(a.dataset.abrir)}` : 'contratos.html';
  });

  // ---------- Render ----------

  function renderDetalhe(b) {
    estado.id = b.contrato.id;
    $('lista').classList.add('hidden');
    $('detalhe').classList.remove('hidden');
    const varios = blocos.length > 1;
    $('trilha').classList.toggle('hidden', !varios);
    $('trilha').innerHTML = varios ? `<a href="contratos.html" data-voltar-lista class="link text-xs">Contratos</a> <span class="mx-1">›</span> <span class="font-mono">${esc(b.codigo)}</span>` : '';
    $('titulo').textContent = varios ? `Contrato ${b.codigo}` : 'Contrato';
    $('subtitulo').textContent = `${b.descricao} · referência ${PortalAluno.fmtData(hoje)}`;
    $('acoes-topo').innerHTML = varios ? `<a href="contratos.html" data-voltar-lista class="botao-sec">Todos os contratos</a>` : '';
    renderFaixa(b);
    renderCabecalho(b);
    renderAbas(b);
    atualizarUrl();
    if (estado.aba === 'evolucao') renderEvolucao(b);
    else if (estado.aba === 'solicitacoes') renderSolicitacoes(b);
    else renderResumo(b);
  }

  function render() {
    const b = estado.id ? blocoDe(estado.id) : null;
    if (MODO === 'lista') {
      // URL antiga contratos.html?id= → página de detalhe. A lista aparece sempre, mesmo com um único contrato.
      if (b) { location.replace(`contrato.html?id=${encodeURIComponent(b.contrato.id)}${estado.aba !== 'resumo' ? `&aba=${estado.aba}` : ''}`); return; }
      estado.id = null;
      atualizarUrl();
      renderLista();
      return;
    }
    if (!b) { location.replace('contratos.html'); return; }
    renderDetalhe(b);
  }

  render();
})();
