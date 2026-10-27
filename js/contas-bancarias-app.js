// ============================================================
// UI da tela "Contas bancárias", na direção Ficha em cartões.
// Fluxo: lista (contas-bancarias.html) → ficha em página própria (conta-bancaria.html?id=).
// O mesmo arquivo atende as duas páginas; o modo vem de <body data-modo>.
// Cadastro e regras em Lancamentos.* (plano.contasBancarias, validarPlano; chave aulor-v1-financeiro-plano-v2).
// Saldo = Lancamentos.balanco; conciliação = Lancamentos.conciliacao (nas contas com extrato: Asaas e a de pagamento);
// saque automático = Lancamentos.carregarSaques (a conta de destino). Tudo só leitura aqui, menos o cadastro.
// contas-bancarias.html?id= abre a ficha.
// ============================================================

const MODO = document.body.dataset.modo === 'detalhe' ? 'detalhe' : 'lista';
const L = Lancamentos;

const estado = {
  plano: null,
  lancamentos: [],
  movimentos: [],
  saques: null,
  saldos: {},
  uso: {},
  selecionado: null, // id da conta aberta (só no detalhe)
};

const ICONE = {
  lapis: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>',
  mais: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>',
  baixo: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>',
  banco: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>',
  tipo: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>',
  numero: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" /></svg>',
  seta: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>',
  alerta: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>',
  info: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>',
};

const BOTAO_SEC = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition';
const BOTAO_PRI = 'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold whitespace-nowrap bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800 text-white shadow-sm transition';
const BOTAO_FANTASMA = 'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm font-medium text-slate-500 dark:text-neutral-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition';
const BOTAO_CANCELAR = 'inline-flex items-center h-9 px-3.5 rounded-lg text-sm font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition';
const BOTAO_PERIGO = 'inline-flex items-center h-9 px-3.5 rounded-lg text-sm font-semibold whitespace-nowrap bg-red-600 hover:bg-red-700 text-white shadow-sm transition';
const LINK = 'font-medium text-petrol-800 dark:text-sky-300 hover:underline underline-offset-2';
const SELECT_FILTRO = 'h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2.5 text-sm text-slate-700 dark:text-neutral-200'; // combos de ui-form.js
const CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)]';
const CARTAO_OPCAO = 'cursor-pointer rounded-lg border p-3 flex items-start gap-2.5 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 border-slate-300 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500 transition';
const TH = 'px-4 py-2.5';
const TD = 'px-4 py-3 text-sm text-slate-600 dark:text-neutral-300 align-top';
const THEAD = 'text-xs font-medium text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800';
const FOCO_LINHA = 'has-[.link-registro:focus-visible]:bg-slate-50 dark:has-[.link-registro:focus-visible]:bg-neutral-900 has-[.link-registro:focus-visible]:outline-2 has-[.link-registro:focus-visible]:-outline-offset-2 has-[.link-registro:focus-visible]:outline-[color:var(--f-foco)]';
const APOIO = 'text-slate-500 dark:text-neutral-400'; // rótulo, subtítulo e vazio (4,76:1 no cartão)
const APOIO_FUNDO = 'text-slate-600 dark:text-neutral-400'; // o mesmo papel direto sobre o fundo (6,93:1; o slate-500 dá 4,36:1)
const AVISO = 'text-[color:var(--f-aviso)]';
const RUIM = 'text-red-700 dark:text-red-400';
const TITULO = 'text-slate-900 dark:text-neutral-100';
const VALOR = 'text-slate-800 dark:text-neutral-100';
const PILULA_INATIVA = 'bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-400';

// ---------- Helpers ----------

const pilula = (classe, texto, titulo = '') => `<span title="${esc(titulo)}" class="pilula inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ${classe}">${esc(texto)}</span>`;
const plural = (n, s, p = `${s}s`) => `${n.toLocaleString('pt-BR')} ${n === 1 ? s : p}`;
const moeda = (n) => L.fmtMoedaCentavos(Math.abs(n)).replace(/^-/, '');
// Saldo com sinal: negativo em vermelho com −; positivo em tinta, "no azul" (Regra do Azul e do Vermelho).
const saldoHtml = (v) => (v < 0 ? `<span class="${RUIM}">− ${moeda(v)}</span>` : moeda(v));
const saldoTexto = (v) => (v < 0 ? `− ${moeda(v)}` : moeda(v));
const comSinal = (v) => (v < 0 ? `− ${moeda(v)}` : `+ ${moeda(v)}`);
const ativa = (c) => (c.status ?? 'ativo') === 'ativo';
const urlConta = (id) => `conta-bancaria.html?id=${encodeURIComponent(id)}`;
const urlExtrato = (c) => `financeiro.html?aba=extrato&conta=${encodeURIComponent(c.id)}`;
const urlConciliacao = (c) => `financeiro.html?aba=conciliacao&conta=${encodeURIComponent(c.id)}`;
const persistir = () => L.salvarPlano(estado.plano);
const atual = () => L.contaDe(estado.plano, estado.selecionado);
const vazio = (txt = 'não informado') => `<span class="${APOIO}">${txt}</span>`;
const tipoDe = (c) => L.TIPOS_CONTA.find((t) => t.id === c.tipo)?.nome ?? c.tipo ?? '';
const instituicaoNome = (c) => L.instituicaoDaConta(c)?.nome ?? c.banco ?? '';
const agenciaConta = (c) => [c.agencia && `ag. ${c.agencia}`, c.conta && `conta ${c.conta}`].filter(Boolean).join(' · ');

// Logo da instituição no quadrado: 32px na linha da lista, 48px no cabeçalho da ficha; iniciais quando não há logo.
function logo(c, grande = false) {
  const i = L.instituicaoDaConta(c);
  const caixa = grande ? 'h-12 w-12 rounded-xl' : 'h-8 w-8 rounded-lg';
  const iniciais = String(i?.nome ?? c.nome).split(/\s+/).filter((p) => /^[\p{L}\d]/u.test(p)).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const fallback = `<span class="${caixa} shrink-0 bg-petrol-800/10 dark:bg-sky-950/60 text-petrol-800 dark:text-sky-300 grid place-items-center font-display font-semibold ${grande ? '' : 'text-xs'}" aria-hidden="true">${esc(iniciais)}</span>`;
  if (!i?.logo) return fallback;
  return `<span class="${caixa} shrink-0 overflow-hidden bg-white border border-slate-200 dark:border-neutral-800 grid place-items-center" aria-hidden="true"><img src="${esc(i.logo)}" alt="" class="h-full w-full object-contain ${grande ? 'p-1.5' : 'p-1'}" onerror="this.parentElement.outerHTML=${esc(JSON.stringify(fallback))}"></span>`;
}

// Lançamentos, extrato e saque mudam no Financeiro; a ficha e as travas não podem ficar velhas.
function recarregar() {
  estado.plano = L.plano();
  const lista = L.carregar();
  const movimentos = L.carregarExtrato(lista);
  // O Financeiro grava, ao abrir, a conciliação pelo id Asaas e os saques automáticos dos dias que passaram.
  // Aqui os dois rodam só em memória, para o saldo e as contagens baterem com os de lá sem esperar alguém abrir o Financeiro
  // (sem os saques, o BB da semente aparece −R$ 227 mil).
  estado.lancamentos = L.conciliarPeloId(lista, movimentos).lista;
  const saques = L.processarSaques(L.carregarSaques(), movimentos, estado.plano);
  estado.saques = saques.dados;
  estado.movimentos = saques.movimentos;
  // Balanço de todas, ativas ou não: a inativa mostra o saldo que sobrou nela, mas fica fora do total.
  const todas = { ...estado.plano, contasBancarias: estado.plano.contasBancarias.map((c) => ({ ...c, status: 'ativo' })) };
  estado.saldos = Object.fromEntries(L.balanco(estado.lancamentos, todas, estado.movimentos).saldoContas.map((s) => [s.conta.id, s]));
  estado.uso = L.usoDoPlano(estado.lancamentos).contasBancarias;
}

const saldoDe = (c) => estado.saldos[c.id] ?? { saldoInicial: c.saldoInicial, entradas: 0, saidas: 0, transferencias: 0, saldo: c.saldoInicial };
// O Extrato do Financeiro só lista contas ativas, e o caixa não tem movimento de banco.
const temExtrato = (c) => ativa(c) && estado.movimentos.some((m) => m.contaId === c.id);
const ehAsaas = (c) => c.tipo === 'gateway' && L.contaAsaas(estado.plano)?.id === c.id;
const destinoSaque = (c) => estado.saques?.config?.contaDestinoId === c.id;

// Só nas contas com extrato (o caixa não tem): mesmo recorte da aba Conciliação do Financeiro, últimos 90 dias,
// sugestões + movimentos sem lançamento + pagos sem movimento. `diferenca` = o que o extrato diz menos o saldo daqui.
function aConciliar(c) {
  if (!temExtrato(c)) return null;
  const r = L.conciliacao(estado.lancamentos, estado.movimentos, { contaId: c.id }).resumo;
  const noExtrato = L.extrato(c.id, {}, estado.movimentos, estado.plano).saldoFinal;
  const n = r.comSugestao + r.semLancamento + r.semMovimento;
  const diferenca = L.arred(noExtrato - saldoDe(c).saldo);
  return n || diferenca ? { n, sugestoes: r.comSugestao, noExtrato, diferenca } : null;
}

// O papel da conta nos lançamentos novos, em frases curtas; a conta sem papel não diz nada.
function papeis(c) {
  return [
    c.padraoRecebimento && 'Recebe as receitas novas',
    ehAsaas(c) && 'Recebe as cobranças Asaas',
    c.padraoPagamento && 'Paga as despesas novas',
    destinoSaque(c) && `Destino do saque automático${estado.saques.config.ativo ? '' : ' (pausado)'}`,
  ].filter(Boolean);
}

// O que prende a conta: lançamentos, movimentos do extrato, saques registrados e o destino do saque automático.
function vinculos(c) {
  const n = estado.uso[c.id] ?? 0;
  const m = estado.movimentos.filter((x) => x.contaId === c.id).length;
  const s = (estado.saques?.saques ?? []).filter((x) => x.contaOrigemId === c.id || x.contaDestinoId === c.id).length;
  const partes = [n && plural(n, 'lançamento'), m && plural(m, 'movimento no extrato', 'movimentos no extrato'), s && plural(s, 'saque')].filter(Boolean);
  return { total: n + m + s + (destinoSaque(c) ? 1 : 0), texto: partes.length ? partes.join(', ').replace(/, ([^,]*)$/, ' e $1') : 'É o destino do saque automático' };
}

// Por que a conta não pode sair das opções agora (null = pode).
function travaInativar(c) {
  if (c.padraoRecebimento) return 'É a conta padrão de recebimento — marque outra antes';
  if (c.padraoPagamento) return 'É a conta padrão de pagamento — marque outra antes';
  if (destinoSaque(c) && estado.saques.config.ativo) return 'Recebe o saque automático — troque o destino no Financeiro antes';
  return null;
}

// Para onde vão as receitas (ou despesas) novas quando nenhuma conta está marcada: a primeira ativa (L.contaPadrao).
function semPadrao(papel) {
  const campo = papel === 'recebimento' ? 'padraoRecebimento' : 'padraoPagamento';
  const ativas = estado.plano.contasBancarias.filter(ativa);
  return ativas.length && !ativas.some((c) => c[campo]) ? L.contaPadrao(estado.plano, papel) : null;
}

// ---------- Faixa (só quando alguém precisa agir; sem contorno) ----------

function faixa(tom, html) {
  const cores = {
    aviso: 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
    neutra: 'bg-slate-200/70 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300',
  };
  return `<div class="mb-4 flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${cores[tom]}"><span class="shrink-0">${tom === 'neutra' ? ICONE.info : ICONE.alerta}</span><div class="min-w-0 flex-1">${html}</div></div>`;
}
const linhaFaixa = (texto, acao = '') => `<div class="flex items-center justify-between gap-4"><span class="min-w-0 flex-1">${texto}</span>${acao}</div>`;
const acaoFaixa = (atributos, texto) => `<button type="button" ${atributos} class="font-medium underline underline-offset-2 hover:no-underline shrink-0">${texto}</button>`;

function faixasSemPadrao() {
  return [['recebimento', 'receitas novas e as parcelas de venda caem', 'padraoRecebimento'], ['pagamento', 'despesas novas, a folha e os instrutores saem', 'padraoPagamento']].map(([papel, efeito, campo]) => {
    const c = semPadrao(papel);
    return c ? faixa('aviso', linhaFaixa(`<span class="font-medium">Nenhuma conta é padrão de ${papel}.</span> Até você marcar uma, as ${efeito} em ${esc(c.nome)}.`, acaoFaixa(`data-padrao="${campo}"`, 'Escolher a conta'))) : '';
  }).join('');
}

// ---------- Lista ----------

function linhaConta(c) {
  const s = saldoDe(c);
  const n = aConciliar(c);
  const p = papeis(c);
  const detalhe = [instituicaoNome(c) !== c.nome && instituicaoNome(c), agenciaConta(c)].filter(Boolean).join(' · ') || tipoDe(c);
  return `
    <tr data-abrir="${c.id}" class="cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900 transition ${FOCO_LINHA} ${ativa(c) ? '' : 'linha-apagada'}">
      <td class="px-4 py-3 align-top">
        <div class="flex items-center gap-3 min-w-0">
          ${logo(c)}
          <div class="min-w-0">
            <p class="flex items-center gap-2 min-w-0">
              <a href="${urlConta(c.id)}" class="link-registro truncate text-sm font-medium ${VALOR} hover:underline underline-offset-2 focus-visible:outline-none">${esc(c.nome)}</a>
              ${ativa(c) ? '' : pilula(PILULA_INATIVA, 'Inativa', 'Fora das opções de lançamentos novos e do saldo total')}
            </p>
            <p class="text-xs truncate ${APOIO} tabular-nums">${esc(detalhe)}</p>
          </div>
        </div>
      </td>
      <td class="${TD}">${p.length ? p.map((x, i) => `<p class="${i ? `text-xs ${APOIO}` : ''}">${esc(x)}</p>`).join('') : vazio('—')}</td>
      <td class="${TD} text-right tabular-nums">
        <span class="font-medium ${VALOR} whitespace-nowrap" title="${ativa(c) ? '' : 'Conta inativa: fora do saldo total'}">${saldoHtml(s.saldo)}</span>
        ${n ? `<a href="${urlConciliacao(c)}" class="block text-xs font-medium ${AVISO} hover:underline underline-offset-2" title="O extrato diz ${saldoTexto(n.noExtrato)}; ${plural(n.n, 'item espera', 'itens esperam')} conciliação">${n.diferenca ? `${moeda(n.diferenca)} a conciliar` : plural(n.n, 'item a conciliar', 'itens a conciliar')}</a>` : ''}
      </td>
    </tr>`;
}

function renderLista() {
  const el = document.getElementById('tela');
  const contas = estado.plano.contasBancarias;
  // Ativas primeiro (padrão de recebimento, de pagamento, depois pelo nome); as inativas no fim, apagadas.
  const peso = (c) => (ativa(c) ? 0 : 10) + (c.padraoRecebimento ? 0 : c.padraoPagamento ? 1 : 2);
  const ordem = [...contas].sort((a, b) => peso(a) - peso(b) || a.nome.localeCompare(b.nome, 'pt-BR'));
  const ativas = contas.filter(ativa);
  const total = ativas.reduce((soma, c) => soma + saldoDe(c).saldo, 0);
  const vazioHtml = `<p class="font-display text-[15px] font-semibold ${TITULO}">Nenhuma conta cadastrada</p>
       <p class="mt-1">Cadastre onde o dinheiro entra e sai para dar baixa nos lançamentos e acompanhar o saldo.</p>
       <button type="button" data-novo class="${BOTAO_PRI} mt-4">${ICONE.mais} Cadastrar a primeira</button>`;
  el.innerHTML = `
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1 basis-96">
        <h2 class="font-display text-xl font-semibold ${TITULO}">Contas bancárias</h2>
        <p class="max-w-3xl text-sm mt-0.5 ${APOIO_FUNDO}">Onde o dinheiro entra e sai: o Asaas, as contas correntes e o caixa. O saldo parte do saldo inicial de cada conta e soma o que foi pago nela no <a href="financeiro.html" class="${LINK}">Financeiro</a>.</p>
      </div>
      <button type="button" id="btn-novo" class="${BOTAO_PRI}">${ICONE.mais} Nova conta bancária</button>
    </div>
    ${faixasSemPadrao()}
    <div class="${CARTAO} overflow-hidden">
      <table class="w-full table-fixed text-left">
        <thead class="${THEAD}">
          <tr>
            <th scope="col" class="${TH}">Conta</th>
            <th scope="col" class="${TH} w-[300px]" title="Para onde vão os lançamentos novos">Papel nos lançamentos</th>
            <th scope="col" class="${TH} w-[220px] text-right" title="Saldo inicial + o que foi pago na conta até hoje">Saldo atual</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
          ${ordem.length ? ordem.map(linhaConta).join('') : `<tr><td colspan="3" class="px-4 py-10 text-center text-sm ${APOIO}">${vazioHtml}</td></tr>`}
        </tbody>
      </table>
      ${contas.length ? `<div class="px-4 py-2.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-sm text-slate-700 dark:text-neutral-200 tabular-nums flex justify-between gap-4"><span>${plural(ativas.length, 'conta ativa', 'contas ativas')}${contas.length > ativas.length ? ` · ${plural(contas.length - ativas.length, 'inativa')}` : ''}</span><span>Saldo das ativas <span class="font-medium">${saldoHtml(total)}</span></span></div>` : ''}
    </div>`;

  el.querySelector('#btn-novo').addEventListener('click', () => abrirFormulario());
  el.querySelectorAll('[data-padrao]').forEach((b) => b.addEventListener('click', () => {
    const papel = b.dataset.padrao === 'padraoRecebimento' ? 'recebimento' : 'pagamento';
    abrirFormulario(semPadrao(papel).id, `[name="${b.dataset.padrao}"]`);
  }));
  // O nome é o link (teclado, ⌘-clique); o resto da linha abre a mesma conta, a não ser que a pessoa esteja selecionando texto.
  el.querySelector('tbody').addEventListener('click', (e) => {
    if (e.target.closest('[data-novo]')) { abrirFormulario(); return; }
    const tr = e.target.closest('tr[data-abrir]');
    if (!tr || e.target.closest('a, button') || getSelection().toString()) return;
    if (e.metaKey || e.ctrlKey) window.open(urlConta(tr.dataset.abrir), '_blank'); else location.href = urlConta(tr.dataset.abrir);
  });
}

// ---------- Ficha ----------

function cabecalhoSecao(titulo, subtitulo, acao = '') {
  return `
    <div class="px-4 pt-4 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="font-display text-[15px] font-semibold ${TITULO}">${titulo}</h3>
        ${subtitulo ? `<p class="mt-0.5 text-xs ${APOIO}">${subtitulo}</p>` : ''}
      </div>
      ${acao}
    </div>`;
}
const acaoEditar = (foco, rotulo) => `<button type="button" data-editar="${esc(foco)}" aria-label="${esc(rotulo)}" class="${BOTAO_FANTASMA} -mt-1 -mr-1.5 shrink-0">${ICONE.lapis} Editar</button>`;

function campo(rotulo, valorHtml, largura = '') {
  return `
    <div class="${largura} min-w-0">
      <p class="text-xs font-medium ${APOIO}">${rotulo}</p>
      <div class="text-sm ${VALOR} mt-0.5 break-words">${valorHtml}</div>
    </div>`;
}

function chip(icone, conteudo, titulo) {
  return `<span title="${esc(titulo)}" class="inline-flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-neutral-300"><span class="${APOIO}">${icone}</span>${conteudo}</span>`;
}

function faixasConta(c, s, n) {
  return [
    ativa(c) ? '' : faixa('neutra', linhaFaixa('<span class="font-medium">Conta inativa.</span> Não aparece nas opções de lançamentos novos e fica fora do saldo total; o histórico continua.', `<button type="button" data-reativar class="${BOTAO_PRI} h-8 shrink-0">Reativar</button>`)),
    n ? faixa('aviso', linhaFaixa(`<span class="font-medium">${n.diferenca ? `O extrato diz ${saldoHtml(n.noExtrato)}, ${moeda(n.diferenca)} ${n.diferenca > 0 ? 'a mais' : 'a menos'} que o saldo daqui.` : 'O saldo bate com o do extrato.'}</span> ${plural(n.n, 'item dos últimos 90 dias espera', 'itens dos últimos 90 dias esperam')} conciliação${n.sugestoes ? `, ${n.sugestoes.toLocaleString('pt-BR')} já com sugestão` : ''}.`, `<a href="${urlConciliacao(c)}" class="font-medium underline underline-offset-2 hover:no-underline shrink-0">Conciliar no Financeiro</a>`)) : '',
    ativa(c) && s.saldo < 0 ? faixa('aviso', linhaFaixa(`<span class="font-medium">Saldo negativo: − ${moeda(s.saldo)}.</span> Confira no extrato se falta registrar uma entrada ou a transferência que cobre a conta.`, `<a href="${urlExtrato(c)}" class="font-medium underline underline-offset-2 hover:no-underline shrink-0">Ver extrato</a>`)) : '',
  ].join('');
}

function cartaoSaldo(c, s) {
  const ref = L.hoje();
  return `<section class="${CARTAO}">
    ${cabecalhoSecao('Saldo', `Saldo inicial mais o que foi pago na conta até ${L.fmtData(ref)}.`, temExtrato(c) ? `<a href="${urlExtrato(c)}" class="${BOTAO_FANTASMA} -mt-1 -mr-1.5 shrink-0">${ICONE.seta} Ver extrato</a>` : '')}
    <div class="p-4 grid grid-cols-2 gap-x-4 gap-y-4">
      <div class="col-span-2">
        <p class="text-xs font-medium ${APOIO}">Saldo atual</p>
        <p class="mt-0.5 text-2xl font-semibold tracking-[-0.02em] ${VALOR}">${saldoHtml(s.saldo)}</p>
        ${ativa(c) ? '' : `<p class="text-xs ${APOIO}">Conta inativa: fica fora do saldo total.</p>`}
      </div>
      ${campo('Saldo inicial', `<span class="tabular-nums">${saldoHtml(s.saldoInicial)}</span><span class="block text-xs ${APOIO}">em ${L.fmtData(c.saldoInicialEm)}</span>`)}
      ${campo('Transferências', s.transferencias ? `<span class="tabular-nums">${comSinal(s.transferencias)}</span><span class="block text-xs ${APOIO}">saques e TEDs do extrato</span>` : vazio('nenhuma'))}
      ${campo('Entradas pagas', s.entradas ? `<span class="tabular-nums">+ ${moeda(s.entradas)}</span>` : vazio('nenhuma'))}
      ${campo('Saídas pagas', s.saidas ? `<span class="tabular-nums">− ${moeda(s.saidas)}</span>` : vazio('nenhuma'))}
    </div>
  </section>`;
}

function cartaoPagamentos(c) {
  // Mesmo corte do saldo: do saldo inicial até hoje (a semente tem baixas com data futura e anteriores à abertura).
  const ref = L.hoje();
  const desde = c.saldoInicialEm ?? '0000-01-01';
  const pagos = estado.lancamentos.filter((l) => l.status === 'pago' && l.contaBancariaId === c.id && l.pagoEm && l.pagoEm >= desde && l.pagoEm <= ref).sort((a, b) => b.pagoEm.localeCompare(a.pagoEm) || String(b.id).localeCompare(String(a.id)));
  const lista = pagos.slice(0, 6);
  return `<section class="${CARTAO}">
    ${cabecalhoSecao('Últimos pagamentos', `Receitas e despesas pagas nesta conta desde ${L.fmtData(desde)}${pagos.length ? `; ${plural(pagos.length, 'no total')}` : ''}.`)}
    ${lista.length ? `
    <ul class="mt-2 pb-2 divide-y divide-slate-100 dark:divide-neutral-900">
      ${lista.map((l) => {
        const v = l.valorPago ?? L.valorFinal(l);
        const quem = l.pessoa?.nome;
        return `
      <li class="px-4 py-2 flex items-baseline gap-3 text-sm">
        <span class="w-[84px] shrink-0 tabular-nums text-slate-600 dark:text-neutral-300">${L.fmtData(l.pagoEm)}</span>
        <span class="min-w-0 flex-1 truncate ${VALOR}" title="${esc([quem, l.descricao].filter(Boolean).join(' · '))}">${esc(quem || l.descricao)}${quem && l.descricao ? `<span class="${APOIO}"> · ${esc(l.descricao)}</span>` : ''}</span>
        <span class="shrink-0 tabular-nums ${VALOR}">${l.tipo === 'receita' ? '+' : '−'} ${moeda(v)}</span>
      </li>`;
      }).join('')}
    </ul>` : `<p class="px-4 py-4 text-sm ${APOIO}">Nenhum pagamento nesta conta desde o saldo inicial.</p>`}
  </section>`;
}

function cartaoPapel(c) {
  const outra = (papel) => {
    const x = L.contaPadrao(estado.plano, papel);
    return x && x.id !== c.id ? `Não. Hoje é <a href="${urlConta(x.id)}" class="${LINK}">${esc(x.nome)}</a>.` : vazio('Não');
  };
  const n = estado.uso[c.id] ?? 0;
  const cfg = estado.saques?.config;
  return `<section class="${CARTAO}">
    ${cabecalhoSecao('Papel nos lançamentos', 'Para onde vão as receitas e as despesas novas.', acaoEditar('[name="padraoRecebimento"]', 'Editar papel nos lançamentos'))}
    <div class="p-4 space-y-4">
      ${campo('Padrão de recebimento', c.padraoRecebimento ? 'Sim: receitas novas e parcelas de venda caem aqui.' : outra('recebimento'))}
      ${campo('Padrão de pagamento', c.padraoPagamento ? 'Sim: despesas novas, a folha e os instrutores saem daqui.' : outra('pagamento'))}
      ${ehAsaas(c) ? campo('Cobranças Asaas', 'Os boletos e Pix gerados pelo Asaas caem aqui.') : ''}
      ${destinoSaque(c) ? campo('Saque automático', `${cfg.ativo ? 'Recebe' : 'Recebeu, até ser pausado,'} o que passa de ${moeda(cfg.saldoMinimo ?? 0)} na conta do Asaas${cfg.horario ? `, às ${esc(cfg.horario)}` : ''}${cfg.diasUteis ? ' dos dias úteis' : ''}.`) : ''}
      ${campo('Em uso', n ? `${plural(n, 'lançamento aponta', 'lançamentos apontam')} para esta conta.` : vazio('Nenhum lançamento ainda.'))}
    </div>
  </section>`;
}

function renderFicha() {
  const el = document.getElementById('tela');
  const c = atual();
  const s = saldoDe(c);
  const n = aConciliar(c);
  const v = vinculos(c);
  const trava = travaInativar(c);

  // Uma ação à vista; o resto no "Mais", com o motivo do item travado.
  const itensMais = [
    ativa(c)
      ? { nome: 'Inativar', desabilitado: Boolean(trava), detalhe: trava ?? `Sai das opções de lançamentos novos${s.saldo ? ` e os ${saldoTexto(s.saldo)} saem do saldo total` : ''}; o histórico continua`, acao: () => alterarStatus('inativo') }
      : { nome: 'Reativar', detalhe: 'Volta às opções de lançamentos e ao saldo total', acao: () => alterarStatus('ativo') },
    'sep',
    { nome: 'Excluir conta', perigo: true, desabilitado: v.total > 0, detalhe: v.total ? `${v.texto.startsWith('É') ? v.texto : `Tem ${v.texto}`} — inative em vez de excluir` : 'Ainda sem lançamentos nem movimentos', acao: () => confirmarExclusao() },
  ];

  el.innerHTML = `
    <nav aria-label="Breadcrumb" class="mb-3 flex items-center gap-1.5 text-sm ${APOIO_FUNDO}">
      <a href="contas-bancarias.html" class="hover:text-petrol-800 dark:hover:text-sky-300 transition">Contas bancárias</a>
      <span aria-hidden="true">/</span>
      <span class="font-medium text-slate-800 dark:text-neutral-100 truncate max-w-xs" aria-current="page">${esc(c.nome)}</span>
    </nav>
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1 basis-80 flex items-start gap-3">
        ${logo(c, true)}
        <div class="min-w-0 flex-1">
          <h2 class="font-registro text-[26px] leading-[1.15] font-semibold tracking-[-0.01em] ${TITULO}">${esc(c.nome)}</h2>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
            ${instituicaoNome(c) ? chip(ICONE.banco, esc(instituicaoNome(c)), 'Instituição financeira') : ''}
            ${chip(ICONE.tipo, esc(tipoDe(c)), 'Tipo')}
            ${agenciaConta(c) ? chip(ICONE.numero, `<span class="tabular-nums">${esc(agenciaConta(c))}</span>`, 'Agência e conta') : ''}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button type="button" data-editar="#f-nome" class="${BOTAO_SEC}">${ICONE.lapis} Editar dados</button>
        <button type="button" id="btn-mais" class="${BOTAO_SEC}" aria-haspopup="menu" aria-expanded="false">Mais ${ICONE.baixo}</button>
      </div>
    </div>

    ${faixasConta(c, s, n)}

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      ${cartaoSaldo(c, s)}
      ${cartaoPagamentos(c)}
      <section class="${CARTAO}">
        ${cabecalhoSecao('Dados', 'Como a conta aparece na baixa e no extrato.', acaoEditar('#f-nome', 'Editar dados'))}
        <div class="p-4 grid grid-cols-2 gap-x-4 gap-y-4">
          ${campo('Nome da conta', esc(c.nome), 'col-span-2')}
          ${campo('Instituição', instituicaoNome(c) ? esc(instituicaoNome(c)) : vazio())}
          ${campo('Tipo', esc(tipoDe(c)))}
          ${campo('Agência', c.agencia ? `<span class="tabular-nums">${esc(c.agencia)}</span>` : vazio())}
          ${campo('Conta', c.conta ? `<span class="tabular-nums">${esc(c.conta)}</span>` : vazio())}
        </div>
      </section>
      ${cartaoPapel(c)}
    </div>`;

  el.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => abrirFormulario(c.id, b.dataset.editar)));
  el.querySelector('#btn-mais').addEventListener('click', (e) => abrirMenu(e.currentTarget, itensMais));
  el.querySelector('[data-reativar]')?.addEventListener('click', () => alterarStatus('ativo'));
}

// O caminho de volta é a faixa (Reativar) ou o "Mais"; a trava confere de novo com o que mudou em outra aba.
function alterarStatus(status) {
  recarregar();
  const c = atual();
  const trava = status === 'inativo' ? travaInativar(c) : null;
  if (trava) { renderFicha(); toast(`"${c.nome}" não foi inativada: ${trava.toLowerCase()}.`); return; }
  estado.plano = L.alterarStatusPlano(estado.plano, 'contasBancarias', c.id, status);
  persistir();
  recarregar();
  renderFicha();
  toast(status === 'inativo' ? `"${c.nome}" inativada. Os lançamentos existentes continuam nela.` : `"${c.nome}" reativada.`);
}

// ---------- Formulário (modalFormulario, campoCombo e mostrarErros vêm de js/ui-form.js) ----------

const ERRO = (nome) => `<p data-erro="${nome}" class="text-xs text-red-700 dark:text-red-400 mt-1 hidden"></p>`;
const OPCIONAL = `<span class="font-normal ${APOIO}">(opcional)</span>`;

const campoTexto = (name, rotulo, valor, { tipo = 'text', placeholder = '', max = '', opcional = false, extra = '', prefixo = '' } = {}) => `
  <div>
    <label class="rotulo" for="f-${name}">${rotulo} ${opcional ? OPCIONAL : ''}</label>
    <div class="relative">
      ${prefixo ? `<span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm ${APOIO} pointer-events-none">${prefixo}</span>` : ''}
      <input id="f-${name}" name="${name}" type="${tipo}" ${max ? `maxlength="${max}"` : ''} ${extra} class="campo ${prefixo ? '!pl-10' : ''}" placeholder="${esc(placeholder)}" value="${esc(valor ?? '')}">
    </div>
    ${ERRO(name)}
  </div>`;

// Instituições do catálogo (js/instituicoes-data.js), com logo; bandeiras de cartão ficam fora.
function opcoesInstituicoes(c) {
  const lista = buscarInstituicoes('');
  const fora = c?.instituicaoId && !lista.some((i) => i.id === c.instituicaoId) ? instituicaoDe(c.instituicaoId) : null;
  return [...(fora ? [fora] : []), ...lista].map((i) => ({ id: i.id, nome: i.nome, descricao: TIPOS_INSTITUICAO[i.tipo] ?? '', logo: i.logo }));
}

function opcaoPadrao(c, campoNome, titulo, efeito, papel) {
  const x = L.contaPadrao(estado.plano, papel);
  const hoje = x && x.id !== c?.id && x[campoNome] ? `Hoje é ${esc(x.nome)}; marcar aqui tira de lá.` : '';
  return `
    <label class="${CARTAO_OPCAO}">
      <input type="checkbox" name="${campoNome}" class="check mt-0.5" ${c?.[campoNome] ? 'checked' : ''}>
      <span><span class="block text-sm font-medium ${VALOR}">${titulo}</span><span class="block text-xs ${APOIO} mt-0.5">${efeito}${hoje ? ` ${hoje}` : ''}</span></span>
    </label>`;
}

function abrirFormulario(id = null, foco = '#f-nome') {
  const c = id ? L.contaDe(estado.plano, id) : null;
  const n = c ? (estado.uso[c.id] ?? 0) : 0;
  const titulo = c ? 'Editar conta bancária' : 'Nova conta bancária';
  const { form } = modalFormulario({
    id: 'form-conta',
    titulo,
    subtitulo: c
      ? (n ? `Tem ${plural(n, 'lançamento')}. Mudar o saldo inicial ou a data dele recalcula o saldo atual; os lançamentos não mudam.` : 'Ainda sem lançamentos.')
      : 'Onde o dinheiro entra ou sai. O saldo atual parte do saldo inicial na data informada e soma o que for pago na conta desde então. Nasce <strong>ativa</strong>.',
    rotulo: c ? 'Salvar alterações' : 'Criar conta',
    largura: 'xl',
    foco,
    corpo: `
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('nome', 'Nome da conta', c?.nome, { placeholder: 'Ex.: Banco do Brasil — c/c', max: 80 })}
        <div>
          <label class="rotulo" for="f-instituicaoId">Instituição financeira ${OPCIONAL}</label>
          ${campoCombo('instituicaoId', opcoesInstituicoes(c), c?.instituicaoId ?? '', { vazio: 'Selecione…', opcional: true })}
          ${ERRO('instituicaoId')}
        </div>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div>
          <label class="rotulo" for="f-tipo">Tipo</label>
          ${campoCombo('tipo', L.TIPOS_CONTA.map((t) => ({ id: t.id, nome: t.nome })), c?.tipo ?? '', { vazio: 'Selecione…' })}
          ${ERRO('tipo')}
        </div>
        ${campoTexto('agencia', 'Agência', c?.agencia, { placeholder: 'Ex.: 1234-5', max: 20, opcional: true })}
        ${campoTexto('conta', 'Conta', c?.conta, { placeholder: 'Ex.: 58.213-0', max: 30, opcional: true })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('saldoInicial', 'Saldo inicial', c ? c.saldoInicial : '', { tipo: 'number', extra: 'step="0.01" inputmode="decimal"', placeholder: '0,00', prefixo: 'R$' })}
        ${campoTexto('saldoInicialEm', 'Saldo inicial em', c?.saldoInicialEm ?? L.hoje(), { tipo: 'date' })}
      </div>
      <fieldset>
        <legend class="rotulo">Conta padrão ${OPCIONAL}</legend>
        <div class="grid grid-cols-2 gap-2">
          ${opcaoPadrao(c, 'padraoRecebimento', 'Padrão de recebimento', 'Receitas novas e parcelas de venda caem aqui.', 'recebimento')}
          ${opcaoPadrao(c, 'padraoPagamento', 'Padrão de pagamento', 'Despesas novas, folha e instrutores saem daqui.', 'pagamento')}
        </div>
        ${ERRO('padraoRecebimento')}${ERRO('padraoPagamento')}
      </fieldset>`,
    aoSalvar: (fd) => {
      const dados = {
        nome: fd.get('nome') ?? '', instituicaoId: fd.get('instituicaoId') || null, tipo: fd.get('tipo') || '',
        agencia: String(fd.get('agencia') ?? '').trim(), conta: String(fd.get('conta') ?? '').trim(),
        saldoInicial: fd.get('saldoInicial') === '' ? 0 : fd.get('saldoInicial'), saldoInicialEm: fd.get('saldoInicialEm') || '',
        padraoRecebimento: fd.get('padraoRecebimento') === 'on', padraoPagamento: fd.get('padraoPagamento') === 'on',
      };
      const erros = L.validarPlano(estado.plano, 'contasBancarias', dados, c?.id ?? null);
      // Inativa não pode ser padrão: os lançamentos novos cairiam numa conta que não aparece nas opções.
      if (c && !ativa(c) && (dados.padraoRecebimento || dados.padraoPagamento)) erros.push({ campo: dados.padraoRecebimento ? 'padraoRecebimento' : 'padraoPagamento', mensagem: 'Reative a conta antes de torná-la padrão.' });
      // O padrão só troca de conta, nunca some: desmarcar aqui deixaria os lançamentos novos caindo na primeira conta ativa.
      [['padraoRecebimento', 'recebimento'], ['padraoPagamento', 'pagamento']].forEach(([campo, papel]) => {
        if (c?.[campo] && !dados[campo]) erros.push({ campo, mensagem: `Para tirar daqui, marque outra conta como padrão de ${papel} na ficha dela.` });
      });
      if (erros.length) return erros;
      if (c) {
        estado.plano = L.atualizarNoPlano(estado.plano, 'contasBancarias', c.id, dados);
        persistir();
        recarregar();
        if (MODO === 'detalhe') renderFicha(); else renderLista();
        toast(`"${dados.nome.trim()}" atualizada.`);
      } else {
        estado.plano = L.incluirNoPlano(estado.plano, 'contasBancarias', dados);
        persistir();
        location.href = urlConta(estado.plano.contasBancarias.at(-1).id);
      }
      return [];
    },
  });
  form.closest('[role="dialog"]').setAttribute('aria-label', titulo);
}

// ---------- Exclusão (só sem vínculo; o item fica travado no "Mais" quando há) ----------

function confirmarExclusao() {
  const c = atual();
  const root = abrirModal(`
    <div class="px-5 pt-4 pb-3"><h3 id="titulo-excluir" class="font-display text-[15px] font-semibold ${TITULO}">Excluir ${esc(c.nome)}?</h3></div>
    <div class="px-5 pb-5 text-sm text-slate-700 dark:text-neutral-200">
      <p>Nenhum lançamento, movimento ou saque aponta para ela, então some de vez. Para só tirar das opções e poder voltar atrás, cancele e use Inativar.</p>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
      <button type="button" id="btn-confirmar-exclusao" class="${BOTAO_PERIGO}">Excluir</button>
    </div>`);
  root.querySelector('[role="dialog"]').setAttribute('aria-labelledby', 'titulo-excluir');
  root.querySelector('#btn-confirmar-exclusao').addEventListener('click', () => {
    recarregar();
    if (vinculos(c).total) {
      fecharModal(); renderFicha();
      toast(`"${c.nome}" passou a ser usada em outra aba e não foi excluída.`);
      return;
    }
    estado.plano = L.removerDoPlano(estado.plano, 'contasBancarias', c.id);
    persistir();
    location.href = `contas-bancarias.html?excluida=${encodeURIComponent(c.nome)}`;
  });
  root.querySelector('button[data-fechar-modal]')?.focus(); // o primeiro [data-fechar-modal] é o véu
}

// ---------- Boot ----------

(function iniciar() {
  const id = parametroUrl('id');
  if (MODO === 'lista') {
    if (id) { location.replace(urlConta(id)); return; } // ?id= na lista abre a ficha
    recarregar();
    renderLista();
    if (parametroUrl('nova') === '1') abrirFormulario();
    const excluida = parametroUrl('excluida');
    if (excluida) toast(`"${excluida}" excluída.`);
    if (parametroUrl('erro') === 'nao-encontrada') toast('Conta bancária não encontrada.');
    if (excluida || parametroUrl('erro') || parametroUrl('nova')) history.replaceState({}, '', 'contas-bancarias.html');
    return;
  }
  recarregar();
  if (!id || !L.contaDe(estado.plano, id)) { location.replace('contas-bancarias.html?erro=nao-encontrada'); return; }
  estado.selecionado = id;
  renderFicha();
  document.title = `Aulor · ${atual().nome}`;
})();
