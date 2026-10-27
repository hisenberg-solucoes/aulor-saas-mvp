// ============================================================
// UI da tela "Centros de custo" (centros-custo.html), na direção Ficha em cartões.
// Centro de custo = departamento que responde pela despesa; receita não tem centro.
// Cadastro simples, como Áreas: lista + modal (criar/editar); status e exclusão moram no modal.
// Cadastro e regras em Lancamentos.* (plano.centrosCusto, validarPlano; chave prototipo-financeiro-plano-v2).
// O dinheiro de cada centro vem dos lançamentos, só leitura: pago nos últimos 12 meses (Lancamentos.porCentroCusto,
// regime de caixa) e a pagar (previstos, emitidos e vencidos). Cada valor leva ao Financeiro já filtrado (?centro=).
// O link antigo centros-custo.html?id= (plano-financeiro.html?aba=centros&id=) abre o modal do centro.
// ============================================================

const L = Lancamentos;

const estado = {
  plano: null,
  lancamentos: [],
  compras: [],
  periodo: null,
  pago: {},   // id → { despesa, pctDespesa, n } nos últimos 12 meses
  aPagar: {}, // id → { valor, n, vencidos }
  uso: {},
};

const ICONE = {
  mais: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>',
  fechar: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>',
};

const BOTAO_PRI = 'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold whitespace-nowrap bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800 text-white shadow-sm transition';
const BOTAO_PERIGO = 'inline-flex items-center h-9 px-3.5 rounded-lg text-sm font-semibold whitespace-nowrap bg-red-600 hover:bg-red-700 text-white shadow-sm transition';
const BOTAO_CANCELAR = 'inline-flex items-center h-9 px-3.5 rounded-lg text-sm font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition';
const BOTAO_EXCLUIR = 'inline-flex items-center h-8 px-2.5 -ml-2.5 rounded-md text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition';
const BOTAO_EXCLUIR_TRAVADO = 'inline-flex items-center h-8 px-2.5 -ml-2.5 rounded-md text-sm font-medium text-slate-500 dark:text-neutral-400 opacity-60 cursor-not-allowed';
const BOTAO_ICONE = 'inline-grid place-items-center h-8 w-8 rounded-md text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-900 transition';
const CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)]';
const OPCAO = 'cursor-pointer rounded-lg border border-slate-300 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--f-foco)] transition';
const TH = 'px-4 py-2.5';
const TD = 'px-4 py-3 text-sm text-slate-600 dark:text-neutral-300 align-top';
const THEAD = 'text-xs font-medium text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800';
const FOCO_LINHA = 'has-[.link-registro:focus-visible]:bg-slate-50 dark:has-[.link-registro:focus-visible]:bg-neutral-900 has-[.link-registro:focus-visible]:outline-2 has-[.link-registro:focus-visible]:-outline-offset-2 has-[.link-registro:focus-visible]:outline-[color:var(--f-foco)]';
const LINK = 'font-medium text-petrol-800 dark:text-sky-300 hover:underline underline-offset-2';
const LINK_VALOR = 'hover:underline underline-offset-2'; // valor que leva ao Financeiro: tinta, sublinha no hover
const APOIO = 'text-slate-500 dark:text-neutral-400'; // rótulo, subtítulo e vazio (4,76:1 no cartão)
const APOIO_FUNDO = 'text-slate-600 dark:text-neutral-400'; // o mesmo papel direto sobre o fundo (6,93:1; o slate-500 dá 4,36:1)
const AVISO = 'text-[color:var(--f-aviso)]';
const TITULO = 'text-slate-900 dark:text-neutral-100';
const VALOR = 'text-slate-800 dark:text-neutral-100';
const PILULA_INATIVA = 'bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-400';

// ---------- Helpers ----------

const pilula = (classe, texto, titulo = '') => `<span title="${esc(titulo)}" class="pilula inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ${classe}">${esc(texto)}</span>`;
const plural = (n, s, p = `${s}s`) => `${n.toLocaleString('pt-BR')} ${n === 1 ? s : p}`;
const moeda = (n) => L.fmtMoedaCentavos(n);
const ativo = (c) => (c.status ?? 'ativo') === 'ativo';
const persistir = () => L.salvarPlano(estado.plano);
const centroDe = (id) => L.centroDe(estado.plano, id);
const mesAno = (data) => new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace(' de ', '/').replace('.', '');
const lista = (partes) => partes.filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' e $1');

// Financeiro em A pagar, já filtrado pelo centro; o pago em 12 meses leva também o período e a data de pagamento.
const urlPagar = (id, situacao) => `financeiro.html?aba=pagar&situacao=${situacao}&centro=${encodeURIComponent(id)}`;
const urlPago = (id) => `${urlPagar(id, 'pago')}&periodo=pagoEm&de=${estado.periodo.de}&ate=${estado.periodo.ate}`;

// Lançamentos e compras mudam em outras telas; os valores e a trava de exclusão não podem ficar velhos.
function recarregar() {
  estado.plano = L.plano();
  estado.lancamentos = L.carregar();
  estado.compras = typeof Compras !== 'undefined' ? Compras.carregar() : [];
  estado.periodo = L.periodoPadrao();
  estado.pago = Object.fromEntries(L.porCentroCusto(estado.lancamentos, estado.periodo, estado.plano).map((g) => [g.centro.id, g]));
  estado.aPagar = {};
  estado.lancamentos.filter((l) => l.tipo === 'despesa' && l.centroCustoId && L.emAberto(l)).forEach((l) => {
    const a = (estado.aPagar[l.centroCustoId] ??= { valor: 0, n: 0, vencidos: 0 });
    a.valor = L.arred(a.valor + L.valorFinal(l)); a.n += 1;
    if (L.situacao(l) === 'vencido') a.vencidos += 1;
  });
  estado.uso = L.usoDoPlano(estado.lancamentos).centrosCusto;
}

// Departamento ligado pelo código (folha e regras padrão acham o centro por ele; ver CENTRO_POR_DEPARTAMENTO).
function departamentoDe(c) {
  const id = Object.entries(L.CENTRO_POR_DEPARTAMENTO).find(([, codigo]) => codigo === c.codigo)?.[0];
  return id ? (typeof DEPARTAMENTOS !== 'undefined' ? DEPARTAMENTOS.find((d) => d.id === id)?.nome : null) ?? id : null;
}

// O que prende o centro: lançamentos, fornecedores que o trazem como padrão, compras e o departamento.
function vinculos(c) {
  const n = estado.uso[c.id] ?? 0;
  const f = estado.plano.fornecedores.filter((x) => x.centroCustoId === c.id).length;
  const k = estado.compras.filter((x) => x.centroCustoId === c.id).length;
  const dep = departamentoDe(c);
  const partes = [n && plural(n, 'lançamento'), f && plural(f, 'fornecedor', 'fornecedores'), k && plural(k, 'compra')];
  return { total: n + f + k + (dep ? 1 : 0), lancamentos: n, dep, texto: lista(partes) };
}

// Próxima centena livre: o plano numera um centro por centena, como no sistema atual.
function proximoCodigo() {
  const maior = Math.max(0, ...estado.plano.centrosCusto.map((c) => Number(c.codigo) || 0));
  const prox = (Math.floor(maior / 100) + 1) * 100;
  return prox <= 900 ? String(prox) : '';
}

// ---------- Lista ----------

// Pago em 12 meses, com a fatia da despesa total num medidor em tinta (Regra da Tinta nos Dados).
function celulaPago(c) {
  const g = estado.pago[c.id];
  if (!g?.despesa) return `<span class="${APOIO}">—</span>`;
  const pct = Math.round(g.pctDespesa ?? 0);
  return `
    <a href="${urlPago(c.id)}" class="${VALOR} ${LINK_VALOR}">${moeda(g.despesa)}</a>
    <span class="mt-1 flex items-center justify-end gap-2">
      <span class="relative h-1.5 w-24 rounded-full bg-slate-100 dark:bg-neutral-800" aria-hidden="true"><span class="absolute inset-y-0 left-0 rounded-full bg-slate-700 dark:bg-neutral-300" style="width:${Math.max(pct, 1)}%"></span></span>
      <span class="w-20 whitespace-nowrap text-xs ${APOIO}">${pct}% do total</span>
    </span>`;
}

// A pagar: o que está aberto em qualquer data; vencido é o que pede alguém (cobre-tinta), o resto não se anuncia.
function celulaAPagar(c) {
  const a = estado.aPagar[c.id];
  if (!a) return `<span class="${APOIO}">—</span>`;
  return `
    <a href="${urlPagar(c.id, 'aberto')}" class="${VALOR} ${LINK_VALOR}">${moeda(a.valor)}</a>
    ${a.vencidos ? `<a href="${urlPagar(c.id, 'vencido')}" class="block text-xs ${AVISO} ${LINK_VALOR}">${a.vencidos === 1 ? '1 vencido' : `${a.vencidos} vencidos`}</a>` : ''}`;
}

// Ativo é o comum e não se anuncia; inativo vira pílula e a linha apaga (menos a pílula).
function linhaCentro(c) {
  return `
    <tr data-editar="${c.id}" class="cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900 transition ${FOCO_LINHA} ${ativo(c) ? '' : 'linha-apagada'}">
      <td class="${TH} align-top">
        <p class="flex items-center gap-2 min-w-0">
          <span class="w-7 shrink-0 text-xs tabular-nums ${APOIO}">${esc(c.codigo)}</span>
          <button type="button" id="centro-${c.id}" class="link-registro truncate text-sm font-medium ${VALOR} hover:underline underline-offset-2 focus-visible:outline-none">${esc(c.nome)}</button>
          ${ativo(c) ? '' : pilula(PILULA_INATIVA, 'Inativo', 'Fora das opções de despesas e compras novas')}
        </p>
        <p class="pl-9 text-xs truncate ${APOIO}" title="${esc(c.descricao ?? '')}">${esc(c.descricao ?? '') || 'Sem descrição'}</p>
      </td>
      <td class="${TD} text-right tabular-nums">${celulaPago(c)}</td>
      <td class="${TD} text-right tabular-nums">${celulaAPagar(c)}</td>
    </tr>`;
}

function renderLista() {
  const el = document.getElementById('tela');
  const centros = estado.plano.centrosCusto;
  // Pela numeração do plano; os inativos no fim, apagados.
  const ordem = [...centros].sort((a, b) => (ativo(a) ? 0 : 1) - (ativo(b) ? 0 : 1) || String(a.codigo).localeCompare(String(b.codigo)));
  const ativos = centros.filter(ativo).length;
  const totalPago = centros.reduce((s, c) => s + (estado.pago[c.id]?.despesa ?? 0), 0);
  const totalAPagar = centros.reduce((s, c) => s + (estado.aPagar[c.id]?.valor ?? 0), 0);
  const vazioHtml = `<p class="font-display text-[15px] font-semibold ${TITULO}">Nenhum centro de custo cadastrado</p>
       <p class="mt-1">Toda despesa precisa de um centro. Comece por um departamento.</p>
       <button type="button" data-novo class="${BOTAO_PRI} mt-4">${ICONE.mais} Criar o primeiro</button>`;
  el.innerHTML = `
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1 basis-96">
        <h2 class="font-display text-xl font-semibold ${TITULO}">Centros de custo</h2>
        <p class="max-w-3xl text-sm mt-0.5 ${APOIO_FUNDO}">De quem é cada despesa: um centro por departamento. A categoria diz o quê; o centro, quem gastou. Receita não tem centro. Os valores vêm do <a href="financeiro.html" class="${LINK}">Financeiro</a> e levam a ele já filtrado.</p>
      </div>
      <button type="button" id="btn-novo" class="${BOTAO_PRI}">${ICONE.mais} Novo centro de custo</button>
    </div>
    <div class="${CARTAO} overflow-hidden">
      <table class="w-full table-fixed text-left">
        <thead class="${THEAD}">
          <tr>
            <th scope="col" class="${TH}">Centro</th>
            <th scope="col" class="${TH} w-[260px] text-right">Pago em 12 meses</th>
            <th scope="col" class="${TH} w-[180px] text-right">A pagar</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
          ${ordem.length ? ordem.map(linhaCentro).join('') : `<tr><td colspan="3" class="px-4 py-10 text-center text-sm ${APOIO}">${vazioHtml}</td></tr>`}
        </tbody>
      </table>
      ${centros.length ? `
      <div class="px-4 py-2.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-sm text-slate-700 dark:text-neutral-200 tabular-nums flex flex-wrap justify-between gap-x-4 gap-y-1">
        <span>${plural(ativos, 'centro ativo', 'centros ativos')}${centros.length > ativos ? ` · ${plural(centros.length - ativos, 'inativo')}` : ''}</span>
        <span>${moeda(totalPago)} pagos de ${mesAno(estado.periodo.de)} a ${mesAno(estado.periodo.ate)} · ${moeda(totalAPagar)} a pagar</span>
      </div>` : ''}
    </div>`;

  el.querySelector('#btn-novo').addEventListener('click', () => abrirModalCentro());
  // O nome é o botão (teclado); o resto da linha abre o mesmo centro, menos os valores (links) e a seleção de texto.
  el.querySelector('tbody').addEventListener('click', (e) => {
    if (e.target.closest('[data-novo]')) { abrirModalCentro(); return; }
    const tr = e.target.closest('tr[data-editar]');
    if (!tr || e.target.closest('a') || getSelection().toString()) return;
    abrirModalCentro(tr.dataset.editar);
  });
}

// ---------- Modal do centro (abrirModal/fecharModal vêm de avaliacoes-ui.js; mostrarErros de ui-form.js) ----------

const ERRO = (campo) => `<p id="erro-${campo}" data-erro="${campo}" class="text-xs text-red-700 dark:text-red-400 mt-1 hidden"></p>`;
const OPCIONAL = `<span class="font-normal ${APOIO}">(opcional)</span>`;

// Excluir só sem vínculo. Com vínculo, o botão fica no lugar, apagado e focável, com o motivo escrito embaixo.
function rodapeExcluir(c, v) {
  if (!c) return '<span></span>';
  if (!v.total) return `<button type="button" id="btn-excluir" class="${BOTAO_EXCLUIR}">Excluir centro</button>`;
  const motivo = [v.texto && `Em uso por ${v.texto}`, v.dep && `ligado ao departamento ${v.dep}`].filter(Boolean).join('; ');
  return `
    <div class="min-w-0">
      <button type="button" class="${BOTAO_EXCLUIR_TRAVADO}" aria-disabled="true" aria-describedby="motivo-excluir">Excluir centro</button>
      <p id="motivo-excluir" class="text-xs ${APOIO}">${esc(motivo.charAt(0).toUpperCase() + motivo.slice(1))}. Para tirar das opções, marque Inativo.</p>
    </div>`;
}

function abrirModalCentro(id = null) {
  const c = id ? centroDe(id) : null;
  if (id && !c) { toast('Esse centro de custo não existe mais.'); return; }
  const d = c ?? { codigo: proximoCodigo(), nome: '', descricao: '', status: 'ativo' };
  const v = c ? vinculos(c) : null;
  const g = c ? estado.pago[c.id] : null;
  const subtitulo = !c
    ? 'Nasce ativo e já aparece nas opções de despesa do Financeiro e de Compras.'
    : g?.despesa ? `Pagou ${moeda(g.despesa)} em 12 meses. Mudar o nome reflete em ${plural(v.lancamentos, 'lançamento')}.` : v.lancamentos ? `Mudar o nome reflete em ${plural(v.lancamentos, 'lançamento')}.` : 'Ainda sem lançamentos.';
  const STATUS = [
    { id: 'ativo', nome: 'Ativo', descricao: 'Aparece nas opções de despesas e compras novas.' },
    { id: 'inativo', nome: 'Inativo', descricao: v?.lancamentos ? `Sai das opções; os ${plural(v.lancamentos, 'lançamento')} já classificados continuam nele.` : 'Sai das opções de despesas e compras novas.' },
  ];
  const root = abrirModal(`
    <form id="form-centro" novalidate class="flex flex-col max-h-full min-h-0">
      <div class="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div>
          <h3 id="titulo-centro" class="font-display text-[15px] font-semibold ${TITULO}">${c ? 'Editar centro de custo' : 'Novo centro de custo'}</h3>
          <p class="text-xs mt-0.5 ${APOIO}">${subtitulo}</p>
        </div>
        <button type="button" data-fechar-modal class="${BOTAO_ICONE} -mr-1.5 -mt-1" aria-label="Fechar">${ICONE.fechar}</button>
      </div>
      <div class="flex-1 overflow-y-auto px-5 pt-1 pb-5 space-y-4">
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="rotulo" for="fc-codigo">Código</label>
            <input type="text" id="fc-codigo" name="codigo" value="${esc(d.codigo)}" maxlength="3" inputmode="numeric" class="campo tabular-nums ${v?.dep ? '!bg-slate-50 dark:!bg-neutral-900 cursor-default' : ''}" placeholder="Ex.: ${esc(proximoCodigo() || '800')}" aria-describedby="erro-codigo dica-codigo" ${v?.dep ? 'readonly' : ''}>
            ${ERRO('codigo')}
          </div>
          <div class="col-span-2">
            <label class="rotulo" for="fc-nome">Nome</label>
            <input type="text" id="fc-nome" name="nome" value="${esc(d.nome)}" maxlength="80" class="campo" placeholder="Ex.: Eventos" aria-describedby="erro-nome">
            ${ERRO('nome')}
          </div>
          <p id="dica-codigo" class="col-span-3 -mt-1 text-xs ${APOIO}">${v?.dep ? `O código ${esc(d.codigo)} liga este centro ao departamento ${esc(v.dep)}: a folha e as regras padrão acham o centro por ele, então não muda.` : 'Um centro por centena, como no sistema atual.'}</p>
        </div>
        <div>
          <label class="rotulo" for="fc-descricao">Descrição ${OPCIONAL}</label>
          <textarea id="fc-descricao" name="descricao" rows="2" maxlength="300" class="campo resize-y" placeholder="Que gastos este departamento responde">${esc(d.descricao ?? '')}</textarea>
        </div>
        ${c ? `
        <fieldset>
          <legend class="rotulo">Status</legend>
          <div class="grid grid-cols-2 gap-2">
            ${STATUS.map((s) => `
            <label class="${OPCAO} p-3">
              <input type="radio" name="status" value="${s.id}" class="sr-only" ${(d.status ?? 'ativo') === s.id ? 'checked' : ''}>
              <span class="block text-sm font-medium ${VALOR}">${s.nome}</span>
              <span class="block text-xs mt-0.5 ${APOIO}">${esc(s.descricao)}</span>
            </label>`).join('')}
          </div>
        </fieldset>` : ''}
      </div>
      <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-4">
        ${rodapeExcluir(c, v)}
        <div class="flex shrink-0 items-center gap-2">
          <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
          <button type="submit" class="${BOTAO_PRI}">${c ? 'Salvar alterações' : 'Criar centro'}</button>
        </div>
      </div>
    </form>`, 'max-w-lg');
  root.querySelector('[role="dialog"]').setAttribute('aria-labelledby', 'titulo-centro');
  const form = root.querySelector('#form-centro');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const dados = { codigo: String(fd.get('codigo') ?? '').trim(), nome: fd.get('nome') ?? '', descricao: String(fd.get('descricao') ?? '').trim() };
    if (c) dados.status = fd.get('status') ?? c.status ?? 'ativo';
    if (mostrarErros(form, L.validarPlano(estado.plano, 'centrosCusto', dados, c?.id ?? null))) return;
    const nome = dados.nome.trim();
    if (c) {
      estado.plano = L.atualizarNoPlano(estado.plano, 'centrosCusto', c.id, dados);
      const mudou = dados.status !== (c.status ?? 'ativo') ? (dados.status === 'ativo' ? 'reativado' : 'inativado') : 'atualizado';
      persistir(); renderLista(); fecharModal();
      toast(`Centro de custo "${nome}" ${mudou}.`);
    } else {
      estado.plano = L.incluirNoPlano(estado.plano, 'centrosCusto', dados);
      persistir(); renderLista(); fecharModal();
      toast(`Centro de custo "${nome}" criado.`);
    }
  });
  form.querySelector('#btn-excluir')?.addEventListener('click', () => confirmarExclusao(c.id));
  form.querySelector(c ? '#fc-nome' : (d.codigo ? '#fc-nome' : '#fc-codigo')).focus();
}

// ---------- Exclusão ----------

function confirmarExclusao(id) {
  const c = centroDe(id);
  const root = abrirModal(`
      <div class="px-5 pt-4 pb-3"><h3 id="titulo-excluir" class="font-display text-[15px] font-semibold ${TITULO}">Excluir o centro ${esc(c.codigo)} · ${esc(c.nome)}?</h3></div>
      <div class="px-5 pb-5 text-sm text-slate-700 dark:text-neutral-200">
        <p>Nenhum lançamento, fornecedor ou compra aponta para ele, então some de vez. Para só tirar das opções e poder voltar atrás, cancele e marque Inativo.</p>
      </div>
      <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
        <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
        <button type="button" id="btn-confirmar-exclusao" class="${BOTAO_PERIGO}">Excluir</button>
      </div>`);
  root.querySelector('[role="dialog"]').setAttribute('aria-labelledby', 'titulo-excluir');
  root.querySelector('#btn-confirmar-exclusao').addEventListener('click', () => {
    recarregar();
    const atual = centroDe(id);
    if (!atual || vinculos(atual).total) {
      fecharModal(); renderLista();
      toast(`"${c.nome}" passou a ser usado em outra aba e não foi excluído.`);
      return;
    }
    estado.plano = L.removerDoPlano(estado.plano, 'centrosCusto', id);
    persistir(); renderLista(); fecharModal();
    document.getElementById('btn-novo').focus(); // a linha de origem sumiu
    toast(`Centro de custo "${c.nome}" excluído.`);
  });
  root.querySelector('[data-fechar-modal]')?.focus();
}

// ---------- Boot ----------

(function iniciar() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || document.getElementById('modal-root').innerHTML.trim()) return;
    recarregar(); renderLista();
  });
  recarregar();
  renderLista();
  const id = parametroUrl('id');
  if (id) abrirModalCentro(id);
  else if (parametroUrl('nova') === '1') abrirModalCentro();
})();
