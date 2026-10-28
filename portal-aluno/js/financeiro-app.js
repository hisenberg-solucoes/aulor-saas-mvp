// Portal do Aluno — Financeiro (UI). Só leitura: contratos e parcelas vêm do administrativo.
// Boleto/Pix são simulados (códigos determinísticos); nenhuma ação altera o status das parcelas.
(() => {
  const aluno = PortalAluno.alunoLogado();
  if (!aluno) { PortalAluno.sair(); location.replace('login.html'); return; }

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hoje = PortalAluno.hoje();
  const moeda = (n) => esc(Contratos.fmtMoeda(n));
  const data = (iso) => esc(PortalAluno.fmtData(String(iso ?? '').slice(0, 10)));
  const nomeDe = (lista, id) => lista.find((x) => x.id === id)?.nome ?? '';

  const PONTO = {
    prevista: 'bg-slate-400', emitida: 'bg-sky-500', vencida: 'bg-red-500', paga: 'bg-emerald-500', cancelada: 'bg-slate-300 dark:bg-neutral-600',
  };
  const SITUACAO_CONTRATO = {
    em_dia: { nome: 'Em dia', ponto: 'bg-emerald-500' },
    inadimplente: { nome: 'Parcela vencida', ponto: 'bg-red-500' },
    recuperante: { nome: 'Em acordo', ponto: 'bg-amber-500' },
    quitado: { nome: 'Quitado', ponto: 'bg-slate-400' },
    sem_parcelas: { nome: 'Sem parcelas', ponto: 'bg-slate-400' },
  };
  const SITUACAO_GERAL = {
    em_dia: { nome: 'Em dia', ponto: 'bg-emerald-500', texto: 'Nenhuma parcela vencida.' },
    vencida: { nome: 'Parcela vencida', ponto: 'bg-red-500', texto: 'Pague por Pix ou boleto na parcela vencida.' },
    quitado: { nome: 'Quitado', ponto: 'bg-slate-400', texto: 'Todas as parcelas foram pagas.' },
    sem_cobrancas: { nome: 'Sem cobranças', ponto: 'bg-slate-400', texto: 'Nenhum contrato com parcelas no seu nome.' },
  };
  const ponto = (cor, texto) => `<span class="inline-flex items-center gap-1.5 whitespace-nowrap"><span class="h-2 w-2 rounded-full ${cor} shrink-0"></span>${esc(texto)}</span>`;

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast-anim pointer-events-auto rounded-lg bg-slate-900 dark:bg-neutral-800 text-white text-sm px-4 py-2 shadow-lg';
    el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModal(); });

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
  const linhaDl = (dt, dd) => `<div class="flex justify-between gap-4 py-1.5"><dt class="text-slate-500 dark:text-neutral-400">${esc(dt)}</dt><dd class="text-right text-slate-800 dark:text-neutral-100 font-medium">${dd}</dd></div>`;

  // ---------- Área de transferência ----------
  // Só se copia de dentro da janela de pagamento, onde o código já está à vista: se o navegador negar, copia-se à mão.

  async function copiar(texto, msgOk) {
    try {
      await navigator.clipboard.writeText(texto);
      toast(msgOk);
    } catch (_) {
      toast('Não foi possível copiar. Selecione o código na janela e copie.');
    }
  }

  // ---------- Dados ----------

  const fin = PortalAluno.financeiroDetalhado(aluno.id, hoje);
  const ABAS = [{ id: 'parcelas', titulo: 'Parcelas' }, { id: 'historico', titulo: 'Histórico' }];
  const abaUrl = new URLSearchParams(location.search).get('aba');
  // Abre no que falta pagar; as pagas ficam a um filtro de distância.
  const estado = { aba: ABAS.some((x) => x.id === abaUrl) ? abaUrl : 'parcelas', filtro: fin.abertas.length ? 'abertas' : 'todas' };
  const todasParcelas = () => fin.contratos.flatMap((b) => b.parcelas.map((p) => ({ b, p })));
  const blocoDe = (id) => fin.contratos.find((b) => b.contrato.id === id);
  const parcelaDe = (id, n) => blocoDe(id)?.parcelas.find((p) => p.n === Number(n));

  $('subtitulo').textContent = fin.contratos.length
    ? `${fin.contratos.length === 1 ? '1 contrato' : `${fin.contratos.length} contratos`} · referência ${PortalAluno.fmtData(hoje)}`
    : `Referência ${PortalAluno.fmtData(hoje)}`;

  // ---------- Faixa do pagador ----------

  function renderFaixa() {
    const el = $('faixa-pagador');
    const terceiros = fin.contratos.filter((b) => !b.pagaEste);
    if (fin.pagadorProprio || (!fin.contratos.length && (aluno.pagador ?? 'proprio') === 'proprio')) { el.classList.add('hidden'); return; }
    let quem;
    const r = terceiros[0]?.responsavel;
    if (r?.tipo === 'empresa') quem = `da empresa <strong>${esc(r.nome)}</strong>`;
    else if (r?.tipo === 'terceiro') quem = `do seu responsável financeiro <strong>${esc(r.nome)}</strong>${r.parentesco ? ` (${esc(r.parentesco)})` : ''}`;
    else if (r?.tipo === 'responsavel') quem = `do seu responsável financeiro <strong>${esc(r.nome)}</strong>`;
    else if (r?.tipo === 'aluno' && r.aluno) quem = `de <strong>${esc(r.nome)}</strong>`;
    else if (aluno.pagador === 'empresa') quem = 'da sua empresa';
    else if (aluno.pagador === 'terceiro' && aluno.responsavel?.nome) quem = `do seu responsável financeiro <strong>${esc(aluno.responsavel.nome)}</strong>${aluno.responsavel.parentesco ? ` (${esc(aluno.responsavel.parentesco)})` : ''}`;
    else quem = 'do responsável financeiro do contrato';
    const parcial = terceiros.length && terceiros.length < fin.contratos.length;
    el.innerHTML = `
      <div class="flex items-start gap-3">
        <svg class="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
        <div>
          <p class="font-medium text-slate-900 dark:text-neutral-100">${parcial ? 'Parte das cobranças está' : 'As cobranças estão'} em nome ${quem}.</p>
          <p class="mt-0.5 text-slate-600 dark:text-neutral-300">Os boletos e comprovantes são enviados para ${r?.email ? `<strong>${esc(r.email)}</strong>` : 'o e-mail cadastrado'}. Aqui você acompanha as parcelas apenas para consulta.</p>
        </div>
      </div>`;
    el.classList.remove('hidden');
  }

  // ---------- Resumo ----------

  function cartao(rotulo, valor, texto, tom = 'neutro') {
    const tons = { neutro: 'cartao', vermelho: 'rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 shadow-sm' };
    return `<div class="${tons[tom]} p-5"><p class="rotulo">${esc(rotulo)}</p><p class="font-display font-semibold text-lg text-slate-900 dark:text-neutral-100 mt-1.5 leading-snug">${valor}</p><p class="text-sm text-slate-500 dark:text-neutral-400 mt-1">${texto}</p></div>`;
  }
  function renderResumo() {
    const s = SITUACAO_GERAL[fin.situacao];
    const vencidasTexto = fin.vencidas.length ? `${fin.vencidas.length} ${fin.vencidas.length === 1 ? 'parcela vencida' : 'parcelas vencidas'} · ${moeda(fin.totalVencido)}` : esc(s.texto);
    const nPagas = fin.contratos.reduce((n, b) => n + b.parcelas.filter((p) => p.status === 'paga').length, 0);
    const nAbertas = fin.abertas.length;
    let proximo;
    if (fin.proxima) {
      const p = fin.proxima;
      const forma = nomeDe(FORMAS_COBRANCA, fin.formaPreferida) || nomeDe(FORMAS_COBRANCA, p.bloco.forma);
      proximo = cartao('Próximo vencimento', `${moeda(p.valor)} <span class="text-sm font-sans font-normal text-slate-500 dark:text-neutral-400">em ${data(p.vencimento)}</span>`, `Parcela ${p.n}/${p.bloco.parcelas.length} · ${esc(p.bloco.codigo)}${forma ? ` · ${esc(forma)}` : ''}`);
    } else {
      proximo = cartao('Próximo vencimento', '—', fin.vencidas.length ? 'Só há parcelas vencidas em aberto.' : 'Nenhuma parcela a vencer.');
    }
    // Uma parcela por vez: cada uma tem o seu boleto e o seu Pix. O cartão leva direto à mais antiga.
    const maisAntiga = [...fin.vencidas].sort((x, y) => x.vencimento.localeCompare(y.vencimento))[0];
    const pagarAntiga = maisAntiga && maisAntiga.bloco.pagaEste
      ? `<button type="button" data-acao="pagar" data-contrato="${maisAntiga.bloco.contrato.id}" data-n="${maisAntiga.n}" class="botao-pri mt-3">Pagar a mais antiga</button>` : '';
    $('resumo').innerHTML = [
      cartao('Situação', ponto(s.ponto, s.nome), `${vencidasTexto}${pagarAntiga ? `<br>${pagarAntiga}` : ''}`, fin.situacao === 'vencida' ? 'vermelho' : 'neutro'),
      cartao('Total pago', moeda(fin.totalPago), nPagas ? `${nPagas} ${nPagas === 1 ? 'parcela paga' : 'parcelas pagas'}` : 'Nenhuma parcela paga ainda.'),
      cartao('Em aberto', moeda(fin.totalAberto), nAbertas ? `${nAbertas} ${nAbertas === 1 ? 'parcela' : 'parcelas'} (emitidas e previstas)` : 'Nada em aberto.'),
      proximo,
    ].join('');
  }

  // ---------- Parcelas ----------

  function acaoParcela(b, p) {
    const st = p.situacao.id;
    if (st === 'paga') return `<button type="button" data-acao="comprovante" data-contrato="${b.contrato.id}" data-n="${p.n}" class="link">Ver comprovante</button>`;
    if (st === 'cancelada') return '<span class="text-slate-400">—</span>';
    if (st === 'prevista') {
      if (!b.assinado) return '<span class="text-slate-400 text-xs">Boleto após a assinatura</span>';
      const disp = new Date(`${p.vencimento}T12:00:00`); disp.setDate(disp.getDate() - 10);
      const dispIso = disp.toISOString().slice(0, 10);
      return `<span class="text-slate-400 text-xs">${dispIso <= hoje ? 'Boleto ainda não emitido' : `Boleto disponível em ${data(dispIso)}`}</span>`;
    }
    if (!b.pagaEste) return `<span class="text-slate-400 text-xs">Em nome de ${esc(b.responsavel.nome)}</span>`;
    // Uma ação só; Pix ou boleto se escolhe na janela. A vencida pede mais atenção (primário).
    return `<button type="button" data-acao="pagar" data-contrato="${b.contrato.id}" data-n="${p.n}" class="${p.vencida ? 'botao-pri' : 'botao-sec'}">Pagar</button>`;
  }

  function tabelaParcelas() {
    const f = estado.filtro;
    const varios = fin.contratos.length > 1;
    const linhas = todasParcelas()
      .filter(({ p }) => f === 'todas' || (f === 'abertas' ? p.status === 'emitida' || p.status === 'prevista' : p.status === 'paga'))
      .sort((x, y) => Number(y.p.vencida) - Number(x.p.vencida) || x.p.vencimento.localeCompare(y.p.vencimento) || x.p.n - y.p.n);
    if (!linhas.length) return `<div class="px-5 py-8 text-center text-sm text-slate-500 dark:text-neutral-400">Nenhuma parcela ${f === 'abertas' ? 'em aberto' : f === 'pagas' ? 'paga' : ''}.</div>`;
    return `<div class="overflow-x-auto"><table class="tabela w-full">
      <thead><tr><th class="w-16">Nº</th>${varios ? '<th>Contrato</th>' : ''}<th>Vencimento</th><th>Valor</th><th>Status</th><th>Ação</th></tr></thead>
      <tbody>${linhas.map(({ b, p }) => `<tr class="${p.status === 'cancelada' ? 'opacity-60' : ''}">
        <td class="tabular-nums">${p.n}/${b.parcelas.length}</td>
        ${varios ? `<td><span class="font-mono text-xs text-slate-500 dark:text-neutral-400">${esc(b.codigo)}</span> <span class="text-slate-500 dark:text-neutral-400">${esc(b.descricao)}</span></td>` : ''}
        <td class="tabular-nums ${p.vencida ? 'text-red-600 dark:text-red-400 font-medium' : ''}">${data(p.vencimento)}</td>
        <td class="tabular-nums">${moeda(p.valor)}</td>
        <td>${ponto(PONTO[p.situacao.id], p.situacao.nome)}</td>
        <td>${acaoParcela(b, p)}</td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  }

  const vazio = (msg) => `<div class="cartao p-8 text-center text-sm text-slate-500 dark:text-neutral-400">${msg}</div>`;

  function renderAbas() {
    const n = (id) => (id === 'parcelas' ? todasParcelas().length : fin.contratos.reduce((s, b) => s + b.historico.length, 0));
    $('abas').innerHTML = ABAS.map((x) => `
      <button type="button" data-aba="${x.id}" class="px-1 pb-2.5 -mb-px text-sm border-b-2 transition whitespace-nowrap ${estado.aba === x.id ? 'border-[color:var(--f-marca-tinta)] text-slate-900 dark:text-neutral-100 font-medium' : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'}">${x.titulo} <span class="ml-1 text-xs text-slate-400 tabular-nums">${n(x.id)}</span></button>`).join('');
  }

  function renderParcelas() {
    $('acoes-topo').innerHTML = '';
    if (!fin.contratos.length) { $('conteudo-aba').innerHTML = vazio('Nenhuma parcela: você não tem contratos ativos no seu nome.'); return; }
    $('conteudo-aba').innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
        <p class="text-sm text-slate-500 dark:text-neutral-400">Parcelas de ${fin.contratos.length === 1 ? 'seu contrato' : `seus ${fin.contratos.length} contratos`}, por vencimento${fin.vencidas.length ? ', com as vencidas primeiro' : ''}.</p>
        <label class="flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-300">Mostrar
          <select data-filtro class="select">
            <option value="todas" ${estado.filtro === 'todas' ? 'selected' : ''}>Todas</option>
            <option value="abertas" ${estado.filtro === 'abertas' ? 'selected' : ''}>Em aberto</option>
            <option value="pagas" ${estado.filtro === 'pagas' ? 'selected' : ''}>Pagas</option>
          </select>
        </label>
      </div>
      <div class="cartao overflow-hidden" data-parcelas>${tabelaParcelas()}</div>`;
  }

  function renderHistorico() {
    $('acoes-topo').innerHTML = '';
    const eventos = fin.contratos.flatMap((b) => b.historico.map((e) => ({ ...e, b }))).sort((x, y) => String(y.em).localeCompare(String(x.em)));
    if (!eventos.length) { $('conteudo-aba').innerHTML = vazio('Nenhum evento financeiro registrado ainda.'); return; }
    const varios = fin.contratos.length > 1;
    $('conteudo-aba').innerHTML = `<div class="cartao p-5"><ol class="relative border-l border-slate-200 dark:border-neutral-800 ml-2 space-y-4">${eventos.map((e) => `
      <li class="pl-4">
        <span class="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-neutral-600 ring-2 ring-white dark:ring-neutral-950"></span>
        <p class="text-sm text-slate-800 dark:text-neutral-100">${esc(e.texto)}</p>
        <p class="text-xs text-slate-500 dark:text-neutral-400">${data(e.em)}${varios ? ` · <span class="font-mono">${esc(e.b.codigo)}</span>` : ''}</p>
      </li>`).join('')}</ol></div>`;
  }

  function renderAba() {
    renderAbas();
    const q = new URLSearchParams(location.search); q.set('aba', estado.aba); history.replaceState(null, '', `?${q}`);
    if (estado.aba === 'historico') renderHistorico();
    else renderParcelas();
  }

  // ---------- Modais ----------

  function modalComprovante(b, p) {
    const forma = nomeDe(FORMAS_COBRANCA, b.forma) || 'Boleto bancário';
    const aut = PortalAluno.linhaDigitavel(b.contrato, p).replace(/\D/g, '').slice(0, 20);
    abrirModal(`${cabecalhoModal('Comprovante de pagamento', `Contrato ${esc(b.codigo)} · parcela ${p.n}/${b.parcelas.length}`)}
      <div class="p-5">
        <div class="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-4 py-3 mb-4 text-sm text-emerald-800 dark:text-emerald-300">${ponto('bg-emerald-500', `Pagamento confirmado em ${PortalAluno.fmtData(p.pagoEm)}`)}</div>
        <dl class="text-sm divide-y divide-slate-100 dark:divide-neutral-900">
          ${linhaDl('Pagador', esc(b.responsavel.nome))}
          ${linhaDl('Beneficiário', 'ProWay Informática e Treinamentos')}
          ${linhaDl('Referente a', esc(b.descricao))}
          ${linhaDl('Vencimento', data(p.vencimento))}
          ${linhaDl('Pago em', data(p.pagoEm))}
          ${linhaDl('Forma', esc(forma))}
          ${linhaDl('Valor', moeda(p.valor))}
          ${linhaDl('Autenticação', `<span class="font-mono text-xs">${esc(aut)}</span>`)}
        </dl>
      </div>
      ${rodapeModal(`<button type="button" data-acao="baixar-comprovante" class="botao-pri">Baixar PDF</button>`)}`);
  }

  // Pagar uma parcela: Pix (QR e código) ou boleto (código de barras em linha), lado a lado na mesma janela.
  function modalPagar(b, p) {
    const codigo = PortalAluno.pixCopiaCola(b.contrato, p);
    // QR "fake": grade determinística a partir do código, só para o protótipo.
    const n = 21;
    const semente = codigo.replace(/\D/g, '');
    const celulas = [];
    for (let i = 0; i < n * n; i++) {
      const x = i % n; const y = Math.floor(i / n);
      const canto = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
      let cheio;
      if (canto) { const cx = x < 7 ? x : x - (n - 7); const cy = y < 7 ? y : y - (n - 7); cheio = cx === 0 || cy === 0 || cx === 6 || cy === 6 || (cx >= 2 && cx <= 4 && cy >= 2 && cy <= 4); }
      else cheio = Number(semente[i % semente.length]) + x * y % 3 > 4;
      if (cheio) celulas.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
    }
    const linha = PortalAluno.linhaDigitavel(b.contrato, p);
    const campo = 'w-full rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 p-2.5 font-mono text-[11px] text-slate-700 dark:text-neutral-200 break-all';
    abrirModal(`${cabecalhoModal(`Pagar ${moeda(p.valor)}`, `Parcela ${p.n}/${b.parcelas.length} · ${p.vencida ? '<span class="text-red-600 dark:text-red-400 font-medium">venceu</span>' : 'vence'} ${data(p.vencimento)}`)}
      <div class="p-5 space-y-5">
        <section class="text-center">
          <h3 class="titulo-secao text-left mb-2">Pix</h3>
          <svg viewBox="0 0 ${n} ${n}" class="mx-auto h-40 w-40 rounded-lg bg-white p-2 border border-slate-200 dark:border-neutral-800 fill-slate-900" shape-rendering="crispEdges" role="img" aria-label="QR code do Pix">${celulas.join('')}</svg>
          <p class="text-xs text-slate-500 dark:text-neutral-400 mt-2">No app do banco, escolha Pix e leia o QR code, ou cole o código.</p>
          <textarea readonly rows="3" aria-label="Código Pix" class="mt-2 ${campo}" onfocus="this.select()">${esc(codigo)}</textarea>
          <button type="button" data-acao="pix" data-contrato="${b.contrato.id}" data-n="${p.n}" class="botao-pri mt-2">Copiar código Pix</button>
        </section>
        <section class="border-t border-slate-100 dark:border-neutral-900 pt-4">
          <h3 class="titulo-secao mb-2">Boleto</h3>
          <textarea readonly rows="2" aria-label="Código do boleto" class="${campo}" onfocus="this.select()">${esc(linha)}</textarea>
          <button type="button" data-acao="linha" data-contrato="${b.contrato.id}" data-n="${p.n}" class="botao-sec mt-2">Copiar código do boleto</button>
        </section>
        <p class="text-[11px] text-slate-400">Simulação do protótipo: o pagamento não é processado.</p>
      </div>
      ${rodapeModal()}`);
  }

  // ---------- Eventos ----------

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-acao]');
    if (!btn) return;
    const acao = btn.dataset.acao;
    const b = btn.dataset.contrato ? blocoDe(btn.dataset.contrato) : null;
    const p = b && btn.dataset.n ? parcelaDe(b.contrato.id, btn.dataset.n) : null;
    if (acao === 'nf') { toast(`NF ${b.nf.numero}: o download do PDF fica para a integração com o emissor.`); return; }
    if (acao === 'baixar-comprovante') { toast('O PDF do comprovante fica para a integração com o banco.'); return; }
    if (!p) return;
    if (acao === 'linha') copiar(PortalAluno.linhaDigitavel(b.contrato, p), `Código do boleto da parcela ${p.n} copiado.`);
    else if (acao === 'pix') copiar(PortalAluno.pixCopiaCola(b.contrato, p), `Código Pix da parcela ${p.n} copiado.`);
    else if (acao === 'pagar') modalPagar(b, p);
    else if (acao === 'comprovante') modalComprovante(b, p);
  });

  document.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-filtro]');
    if (!sel) return;
    estado.filtro = sel.value;
    const alvo = document.querySelector('[data-parcelas]');
    if (alvo) alvo.innerHTML = tabelaParcelas();
  });

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-aba], [data-aba-ir]');
    if (!b) return;
    estado.aba = b.dataset.aba ?? b.dataset.abaIr;
    renderAba();
    if (b.dataset.abaIr) document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---------- Render ----------

  renderFaixa();
  renderResumo();
  renderAba();
})();
