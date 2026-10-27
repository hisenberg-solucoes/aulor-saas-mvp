// ============================================================
// UI da tela "Contratos" — modelo v7 (pacotes × vagas). Regras no motor (Contratos.*).
// Navegação principal: Contratos | Por turma, com sinais operacionais acionáveis.
// Cobranças (parcelas em aberto) fica numa página própria: cobrancas.html.
// Contrato aberto: sub-abas petróleo (Resumo · Pacotes e alunos · Cobrança ·
// Documentos · Histórico). O contrato vende PACOTES (molde de itens × vagas,
// cobradas mesmo vazias); os alunos entram em UM pacote pela escola (aprovado)
// ou pelo link do pacote (aguardando conferência) e recebem uma cópia dos
// itens, ajustável por aluno. O contratante (empresa, ou particular com um
// responsável financeiro único) pode ficar vazio em rascunho. Novo contrato e
// "+ Pacote" são modais; "Duplicar" cria um rascunho escolhendo o que copiar.
// A assinatura tem duas partes (contratante e ProWay), Clicksign simulado.
// Lista (contratos.html) e detalhe (contrato.html?id=) são páginas separadas
// que compartilham este arquivo; o modo vem de <body data-modo>
// ('lista' | 'detalhe' | 'cobrancas').
// ============================================================

const MODO = ['detalhe', 'cobrancas', 'indicadores'].includes(document.body.dataset.modo) ? document.body.dataset.modo : 'lista';

const clientesCarregados = Clientes.carregar();
const estado = {
  lista: Contratos.carregar(),
  clientes: clientesCarregados, // dados de Clientes (atualizados ao vincular alunos / definir contratante)
  ctx: { empresas: clientesCarregados.empresas, alunos: clientesCarregados.alunos, responsaveis: clientesCarregados.responsaveis, cursos: Cursos.carregar(), formacoes: Formacoes.carregar() },
  tipo: 'contratos', // aba padrão da lista (Contratos | Por turma); os indicadores comerciais têm página própria (comercial.html)
  selecionado: null,
  aba: 'resumo',
  expandidos: new Set(), // alunos com os itens abertos na aba Pacotes
  pacotesRecolhidos: new Set(), // pacotes com o corpo (molde + alunos) fechado na aba Pacotes
  pacotesInit: null, // contrato em que o padrão de recolhimento já foi aplicado
  turmasAbertas: new Set(), // cartões abertos na aba Por turma (fechados por padrão)
  filtros: { contratos: { busca: '', status: '', contratante: '', situacao: '', vendedor: '', aguardando: '', foco: '' }, turmas: { busca: '' }, indicadores: { periodo: 'mes', vendedor: '' }, cobrancas: { busca: '', so: '' } },
};

const ABAS = [
  { id: 'resumo', titulo: 'Resumo' },
  { id: 'pacotes', titulo: 'Pacotes e alunos' },
  { id: 'cobranca', titulo: 'Cobrança' },
  { id: 'documentos', titulo: 'Documentos' },
  { id: 'historico', titulo: 'Histórico' },
];

const ICONE = {
  lapis: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>',
  lixeira: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>',
  mais: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>',
  lupa: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>',
  fechar: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>',
  predio: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>',
  pessoa: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>',
  dinheiro: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>',
  doc: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>',
  calendario: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>',
  alerta: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>',
  check: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
  externo: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>',
  seta: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>',
  assinatura: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>',
  enviar: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>',
  sino: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>',
  abaixo: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>',
  checkMini: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>',
};
const BOTAO_MINI = 'inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-xs font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-40 disabled:pointer-events-none';
const PILULA_ENVELOPE = { enviado: 'ambar', assinado: 'verde', recusado: 'vermelha', cancelado: 'neutra' };
const PILULA_SIGNATARIO = { pendente: 'ambar', assinado: 'verde', recusado: 'vermelha' };

const BOTAO_SEC = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-40 disabled:pointer-events-none';
// Primário em petróleo: cobre é "é com você", nunca fundo de botão (Regra do Cobre).
const BOTAO_PRI = 'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/40 disabled:opacity-40 disabled:pointer-events-none';
const BOTAO_CANCELAR = 'px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition';
const BOTAO_FANTASMA = 'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm font-medium text-slate-500 dark:text-neutral-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-40 disabled:pointer-events-none';
const BOTAO_LINK = 'inline-flex items-center gap-1 text-xs font-medium text-petrol-800 dark:text-sky-300 hover:underline';
const ICONE_BOTAO = 'inline-flex items-center justify-center h-7 w-7 rounded-md text-slate-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-30 disabled:pointer-events-none';
const ICONE_BOTAO_VERMELHO = `${ICONE_BOTAO} hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40`;
const CAMPO_BUSCA = 'h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 pl-8 pr-3 text-sm text-slate-700 dark:text-neutral-200 placeholder:text-slate-400 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400 focus:ring-2 focus:ring-petrol-800/20';
const SELECT_FILTRO = 'h-9 max-w-40 truncate rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2.5 text-sm text-slate-700 dark:text-neutral-200 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400';
const CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)]';
const CARTAO_OPCAO = 'cursor-pointer rounded-lg border p-3 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 border-slate-300 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500 transition';
const CHECK = 'check';
const TH = 'px-4 py-2.5';
const TD = 'px-4 py-2.5 text-sm text-slate-600 dark:text-neutral-300';
// Foco do teclado no link do registro acende a linha inteira, com o anel por dentro do cartão.
const FOCO_LINHA = 'has-[.link-registro:focus-visible]:bg-slate-50 dark:has-[.link-registro:focus-visible]:bg-neutral-900 has-[.link-registro:focus-visible]:outline-2 has-[.link-registro:focus-visible]:-outline-offset-2 has-[.link-registro:focus-visible]:outline-[color:var(--f-foco)]';

const PILULA = {
  verde: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  petrol: 'bg-petrol-800/10 text-petrol-800 border-petrol-800/20 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
  violeta: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
  ambar: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  vermelha: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
  neutra: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-700',
  laranja: 'bg-laranja/10 text-laranja-escuro border-laranja/30 dark:bg-laranja/15 dark:text-laranja dark:border-laranja/40',
};
const PILULA_STATUS = { rascunho: PILULA.neutra, aguardando: PILULA.ambar, comercial_ok: PILULA.petrol, adm_ok: PILULA.verde, cancelado: PILULA.neutra };
const PILULA_SITUACAO = { em_dia: PILULA.verde, inadimplente: PILULA.vermelha, recuperante: PILULA.laranja, quitado: PILULA.petrol, sem_parcelas: PILULA.neutra };
const PILULA_MATRICULA = { matriculado: PILULA.petrol, congelada: PILULA.violeta, concluido: PILULA.verde, desistiu: PILULA.ambar, cancelada: PILULA.neutra };
const PILULA_PARCELA = { prevista: PILULA.neutra, emitida: PILULA.petrol, paga: PILULA.verde, cancelada: PILULA.neutra };

// ---------- Helpers ----------

const ctx = () => estado.ctx;
const moeda = (n) => Contratos.fmtMoeda(n);
const plural = (n, s, p = `${s}s`) => `${n} ${n === 1 ? s : p}`;
const nomeDe = (lista, id) => lista.find((x) => x.id === id)?.nome ?? '';
const vazio = (v, txt = 'não informado') => (v == null || v === '' ? `<span class="text-slate-500 dark:text-neutral-400">${txt}</span>` : esc(v));
const iniciais = (nome) => String(nome ?? '').split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
const alunoDe = (id) => Clientes.porId(ctx().alunos, id);
const statusNome = (c) => Contratos.statusDe(c)?.nome ?? c.status;
const statusCurto = (c) => Contratos.statusDe(c)?.curto ?? statusNome(c);

function pilula(classe, texto, titulo = '') {
  return `<span title="${esc(titulo)}" class="pilula inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ${classe}">${esc(texto)}</span>`;
}
const pilulaStatus = (c) => pilula(PILULA_STATUS[c.status], statusCurto(c), Contratos.statusDe(c)?.descricao);
function pilulaSituacao(c) {
  const s = Contratos.situacaoCobranca(c);
  if (!['inadimplente', 'recuperante'].includes(s)) return '';
  const venc = Contratos.parcelasVencidas(c);
  return pilula(PILULA_SITUACAO[s], nomeDe(SITUACOES_COBRANCA, s), venc.length ? `${plural(venc.length, 'parcela vencida', 'parcelas vencidas')}` : '');
}

function chip(icone, conteudo, titulo = '') {
  return `<span title="${esc(titulo)}" class="inline-flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-neutral-300"><span class="text-slate-400 dark:text-neutral-500">${icone}</span>${conteudo}</span>`;
}

function busca(id, valor, placeholder, largura = 'w-56') {
  return `
    <label class="relative">
      <span class="sr-only">${esc(placeholder)}</span>
      <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">${ICONE.lupa}</span>
      <input type="search" id="${id}" value="${esc(valor)}" placeholder="${esc(placeholder)}" class="${CAMPO_BUSCA} ${largura}">
    </label>`;
}

function select(id, rotulo, opcoes, valor) {
  return `
    <select id="${id}" class="${SELECT_FILTRO}" title="${rotulo}">
      <option value="">${rotulo}</option>
      ${opcoes.map((o) => `<option value="${o.id}" ${o.id === valor ? 'selected' : ''}>${esc(o.nome)}</option>`).join('')}
    </select>`;
}

// colunas: rótulo, ou [rótulo, classes da coluna] para largura fixa (table-fixed). "R$ " no rótulo alinha à direita.
function tabela(colunas, linhas, vazioTxt, rodape = '') {
  const fixa = colunas.some(Array.isArray);
  return `
    <div class="${CARTAO} overflow-x-auto">
      <table class="w-full text-left ${fixa ? 'table-fixed' : ''}">
        <thead class="text-xs font-medium text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800">
          <tr>${colunas.map((c) => { const [rotulo, classe = ''] = [].concat(c); return `<th class="${TH} ${classe} ${rotulo.startsWith('R$') ? 'text-right' : ''}">${rotulo.replace(/^R\$ /, '')}</th>`; }).join('')}</tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
          ${linhas.length ? linhas.join('') : `<tr><td colspan="${colunas.length}" class="px-4 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">${vazioTxt}</td></tr>`}
        </tbody>
      </table>
      ${rodape ? `<div class="px-4 py-2.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-sm text-slate-700 dark:text-neutral-200 tabular-nums flex flex-wrap items-center justify-between gap-2">${rodape}</div>` : ''}
    </div>`;
}

const TD_VALOR = `${TD} text-right tabular-nums whitespace-nowrap`;

function cabecalhoSecao(titulo, subtitulo, idBotao, rotulo = 'Editar', desabilitado = false) {
  return `
    <div class="px-4 pt-4 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="font-display text-[15px] font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h3>
        ${subtitulo ? `<p class="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">${subtitulo}</p>` : ''}
      </div>
      ${idBotao ? `<button type="button" id="${idBotao}" class="${BOTAO_FANTASMA} -mt-1 -mr-1.5 shrink-0" ${desabilitado ? 'disabled' : ''}>${rotulo === 'Editar' ? ICONE.lapis : rotulo.startsWith('+') ? ICONE.mais : ''} ${rotulo.replace(/^\+ /, '')}</button>` : ''}
    </div>`;
}

function campo(rotulo, valorHtml, largura = '') {
  return `
    <div class="${largura}">
      <p class="text-xs font-medium text-slate-500 dark:text-neutral-400">${rotulo}</p>
      <div class="text-sm text-slate-800 dark:text-neutral-100 mt-0.5 break-words">${valorHtml}</div>
    </div>`;
}

function faixa(tom, html) {
  const cores = {
    verde: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200',
    ambar: 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
    vermelha: 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-200',
    petrol: 'bg-petrol-800/10 dark:bg-sky-950/40 text-petrol-900 dark:text-sky-200',
    neutra: 'bg-slate-200/70 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300',
  };
  const icone = { verde: ICONE.check, ambar: ICONE.alerta, vermelha: ICONE.alerta, petrol: ICONE.seta, neutra: '' }[tom];
  return `<div class="mb-4 flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${cores[tom]}"><span class="shrink-0 mt-0.5">${icone}</span><div class="min-w-0 flex-1">${html}</div></div>`;
}

function persistir() { Contratos.salvar(estado.lista); }
const atual = () => (estado.selecionado ? Contratos.porId(estado.lista, estado.selecionado) : null);
function alterar(fn) { estado.lista = fn(estado.lista); persistir(); }

const urlDetalhe = (id, aba = 'resumo') => `contrato.html?id=${encodeURIComponent(id)}${aba && aba !== 'resumo' ? `&aba=${aba}` : ''}`;
const urlLista = (tipo = 'contratos') => `contratos.html${tipo !== 'contratos' ? `?tipo=${tipo}` : ''}`;

function atualizarUrl() {
  const q = new URLSearchParams();
  if (MODO === 'detalhe') { q.set('id', estado.selecionado); if (estado.aba !== 'resumo') q.set('aba', estado.aba); }
  else { if (estado.tipo !== 'contratos') q.set('tipo', estado.tipo); if (estado.filtros.contratos.foco) q.set('filtro', estado.filtros.contratos.foco); }
  const qs = q.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

// Na lista (ou ao trocar de contrato) navega para a página de detalhe; no detalhe do mesmo contrato só troca a sub-aba.
function abrir(id, aba = 'resumo') {
  if (MODO === 'lista' || id !== estado.selecionado) { location.href = urlDetalhe(id, aba); return; }
  estado.aba = aba;
  atualizarUrl();
  renderTudo();
  document.querySelector('main')?.scrollTo(0, 0);
}

function irParaLista(tipo = 'contratos') {
  if (MODO === 'detalhe') { location.href = urlLista(tipo); return; }
  estado.selecionado = null; estado.tipo = tipo; atualizarUrl(); renderTudo();
}

// Lado Clientes: empresa/pagador e vínculo com o responsável financeiro dos alunos que entram no contrato
// (Contratos.sincronizarAlunosComContrato). Mantém estado.clientes e o ctx apontando para os dados novos.
function sincronizarClientes(alunoIds, c = atual()) {
  if (!c || !alunoIds.length) return;
  estado.clientes = Contratos.sincronizarAlunosComContrato(estado.clientes, c, alunoIds);
  Clientes.salvar(estado.clientes);
  estado.ctx.alunos = estado.clientes.alunos;
  estado.ctx.empresas = estado.clientes.empresas;
  estado.ctx.responsaveis = estado.clientes.responsaveis;
}

const linkCliente = (tipo, id, texto) => `<a href="${tipo}.html?id=${id}" class="inline-flex items-center gap-1 text-petrol-800 dark:text-sky-300 hover:underline" title="Abrir o cadastro">${esc(texto)} ${ICONE.externo}</a>`;
const ROTULO_MINI = 'text-xs font-medium text-slate-500 dark:text-neutral-400';

// Pílula do contratante: Empresa (petróleo) · Particular (violeta) · Sem contratante (âmbar).
const pilulaContratante = (c) => (c.contratante === 'empresa' ? pilula(PILULA.petrol, 'Empresa', 'Contrato, boleto e NF contra o CNPJ') : c.contratante === 'particular' ? pilula(PILULA.violeta, 'Particular', 'Um responsável financeiro único paga por todos os alunos') : pilula(PILULA.ambar, 'Sem contratante', 'Defina quem contrata para gerar o documento e abrir os links'));

// Link para o cadastro do responsável financeiro (empresa / responsável / aluno), quando há.
function linkResponsavel(r) {
  if (r.tipo === 'empresa' && r.empresa) return linkCliente('empresa', r.empresa.id, r.nome);
  if (r.tipo === 'responsavel' && r.responsavel) return linkCliente('responsavel', r.responsavel.id, r.nome);
  if ((r.tipo === 'aluno' || r.tipo === 'terceiro') && r.aluno) return linkCliente('aluno', r.aluno.id, r.nome);
  return esc(r.nome);
}

// ---------- Lista (abas) ----------

function renderLista() {
  const el = document.getElementById('tela');
  const abaPrincipal = (id, titulo, n) => `
    <button type="button" data-tipo="${id}"
      class="px-1 pb-2.5 -mb-px text-sm border-b-2 transition ${estado.tipo === id ? 'border-[color:var(--f-marca-tinta)] text-slate-900 dark:text-neutral-100 font-semibold' : 'border-transparent text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'}">${titulo}${n == null ? '' : ` <span class="ml-1 text-xs text-slate-600 dark:text-neutral-400 tabular-nums">${n}</span>`}</button>`;
  el.innerHTML = `
    <div class="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 class="font-display text-xl font-semibold text-slate-900 dark:text-neutral-100">Vendas</h2>
        <p class="max-w-3xl text-sm text-slate-600 dark:text-neutral-400 mt-0.5">Uma venda leva pacotes (formação ou cursos avulsos × vagas) a uma empresa ou a um particular; os alunos entram depois, pela escola ou pelo link do pacote. Dela saem o contrato, as matrículas por turma, os boletos e a nota fiscal.</p>
      </div>
      <button type="button" id="btn-novo" class="${BOTAO_PRI} shrink-0">${ICONE.mais} Nova venda</button>
    </div>
    <div class="mb-4 border-b border-slate-200 dark:border-neutral-800 flex items-center gap-6">
      ${abaPrincipal('contratos', 'Vendas', estado.lista.length)}
      ${abaPrincipal('turmas', 'Por turma', Contratos.porTurma(estado.lista, ctx()).length)}
    </div>
    <div id="lista"></div>`;
  el.querySelectorAll('[data-tipo]').forEach((b) => b.addEventListener('click', () => { estado.tipo = b.dataset.tipo; atualizarUrl(); renderLista(); }));
  el.querySelector('#btn-novo').addEventListener('click', abrirModalNovo);
  ({ contratos: renderListaContratos, turmas: renderListaTurmas })[estado.tipo]();
}

// Re-renderizar a lista recria o <input> de busca; sem isto o cursor volta ao início a cada tecla.
function rerenderMantendoCursor(campo, render) {
  const { id, selectionStart, selectionEnd } = campo;
  render();
  const novo = document.getElementById(id);
  if (!novo) return;
  novo.focus();
  novo.setSelectionRange(selectionStart, selectionEnd);
}

function renderListaContratos() {
  const el = document.getElementById('lista');
  const f = estado.filtros.contratos;
  const noFoco = (c) => !f.foco
    || (f.foco === 'assinatura' && c.status === 'aguardando' && !Contratos.assinado(c))
    || (f.foco === 'documentos' && c.status !== 'cancelado' && Contratos.pendenciasDocumento(ctx(), c).length > 0)
    || (f.foco === 'sem-turma' && c.status !== 'cancelado' && Contratos.itensMatriculados(c).some((m) => Contratos.matriculaAtiva(m) && !m.turmaId))
    || (f.foco === 'vagas' && c.status !== 'cancelado' && Contratos.totais(c).livres > 0)
    || (f.foco === 'vencidas' && Contratos.parcelasVencidas(c).length > 0);
  const visiveis = Contratos.filtrar(estado.lista, ctx(), f).filter(noFoco);
  // Quem abre "Parcelas vencidas" vai cobrar: o atraso mais antigo primeiro.
  if (f.foco === 'vencidas') visiveis.sort((a, b) => Contratos.resumoVencido(b).dias - Contratos.resumoVencido(a).dias);
  const filtrando = f.busca || f.status || f.contratante || f.situacao || f.vendedor || f.aguardando || f.foco;
  const total = visiveis.reduce((s, c) => s + (c.status === 'cancelado' ? 0 : Contratos.totais(c).final), 0);
  const linha = (c) => {
    const r = Contratos.responsavelFinanceiro(ctx(), c);
    const t = Contratos.totais(c);
    const prox = Contratos.proximaAcao(ctx(), c);
    const sub = r.tipo === null ? '' : r.tipo === 'terceiro' ? `responsável por ${esc(r.aluno.nome)}` : r.tipo === 'responsavel' ? `responsável financeiro · <span class="font-mono">${esc(r.documento)}</span>` : r.tipo === 'empresa' && c.contratante === 'particular' ? `paga por ${esc(r.aluno?.nome ?? '')}` : `<span class="font-mono">${esc(r.documento)}</span>`;
    const d = prox.divida;
    // Próximo passo: a dívida primeiro (quanto e há quanto tempo), depois a etapa do fluxo; nada quando não há o que fazer.
    const passo = d ? `
          <p class="font-medium ${d.situacao === 'inadimplente' ? 'text-red-700 dark:text-red-400' : 'text-[color:var(--f-cobre-tinta)]'}">${d.situacao === 'inadimplente' ? plural(d.n, 'parcela vencida', 'parcelas vencidas') : 'Em recuperação'} · ${moeda(d.valor)}</p>
          <p class="text-xs text-slate-500 dark:text-neutral-400 line-clamp-2" title="${esc(prox.etapa?.texto ?? '')}">há ${plural(d.dias, 'dia')}${prox.etapa ? ` · ${esc(prox.etapa.texto)}` : ''}</p>`
      : c.status === 'adm_ok' || c.status === 'cancelado' ? '' : `<p class="line-clamp-2" title="${esc(prox.texto)}">${esc(prox.texto)}</p>`;
    const apoio = [t.livres ? `<span>${plural(t.livres, 'vaga livre', 'vagas livres')}</span>` : '', t.nAguardando ? pilula(PILULA.ambar, `${t.nAguardando} aguardando`, 'Alunos que entraram pelo link e aguardam conferência') : ''].join('');
    return `
      <tr data-abrir="${c.id}" class="cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900 transition ${FOCO_LINHA} ${c.status === 'cancelado' ? 'linha-apagada' : ''}">
        <td class="${TH}">
          <p class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5"><a href="${urlDetalhe(c.id)}" class="link-registro font-mono text-sm font-medium text-slate-800 dark:text-neutral-100 hover:underline underline-offset-2 focus-visible:outline-none">${esc(c.codigo)}</a>${c.status === 'adm_ok' ? '' : pilulaStatus(c)}</p>
          <p class="text-xs text-slate-500 dark:text-neutral-400 truncate">${esc(Contratos.fmtData(c.criadoEm))} · ${esc(nomeDe(VENDEDORES, c.vendedorId))}</p>
        </td>
        <td class="${TD}">
          ${r.tipo === null ? `<div class="flex items-center gap-2.5"><div class="h-8 w-8 shrink-0 rounded-full border-2 border-dashed border-amber-400 dark:border-amber-600 grid place-items-center text-amber-600 dark:text-amber-400 text-sm">?</div><div>${pilula(PILULA.ambar, 'Sem contratante')}<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">definir na venda</p></div></div>` : `
          <div class="flex items-center gap-2.5">
            <div class="h-8 w-8 shrink-0 ${r.tipo === 'empresa' ? 'rounded-lg bg-petrol-800/10 dark:bg-sky-950/60 text-petrol-800 dark:text-sky-300' : 'rounded-full bg-petrol-800 text-white'} grid place-items-center text-[11px] font-semibold">${esc(iniciais(r.nome))}</div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-800 dark:text-neutral-100 truncate">${esc(r.nome)}</p>
              <p class="text-xs text-slate-500 dark:text-neutral-400 truncate">${sub}</p>
            </div>
          </div>`}
        </td>
        <td class="${TD}"><p class="truncate">${esc(Contratos.descricao(ctx(), c))}</p>${apoio ? `<p class="text-xs text-slate-500 dark:text-neutral-400 flex flex-wrap items-center gap-1.5">${apoio}</p>` : ''}</td>
        <td class="${TD_VALOR}">${moeda(t.final)}${t.desconto > 0 ? `<br><span class="text-xs text-slate-500 dark:text-neutral-400 line-through">${moeda(t.base)}</span>` : ''}</td>
        <td class="${TD}">${passo}</td>
      </tr>`;
  };
  el.innerHTML = `
    ${cartoesResumoContratos()}
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <div class="flex-1 min-w-44 max-w-xs">${busca('busca-contrato', f.busca, 'Buscar venda ou aluno', 'w-full')}</div>
      <div class="ml-auto flex flex-wrap items-center gap-2">
        ${select('filtro-contratante', 'Contratante', [...TIPOS_CONTRATANTE.map((x) => ({ id: x.id, nome: x.nome })), { id: 'sem', nome: 'Sem contratante' }], f.contratante)}
        ${select('filtro-status', 'Status', STATUS_CONTRATO.map((s) => ({ id: s.id, nome: s.curto ?? s.nome })), f.status)}
        ${select('filtro-situacao', 'Cobrança', SITUACOES_COBRANCA, f.situacao)}
        ${select('filtro-vendedor', 'Vendedor', VENDEDORES, f.vendedor)}
        ${select('filtro-aguardando', 'Conferência', [{ id: '1', nome: 'Alunos aguardando' }], f.aguardando)}
        ${filtrando ? `<button type="button" id="btn-limpar" class="${BOTAO_LINK}">Limpar</button>` : ''}
      </div>
    </div>
    ${tabela([['Código', 'w-[170px]'], ['Contratante / responsável financeiro', 'w-[24%]'], ['O que foi vendido', 'w-[17%]'], ['R$ Valor final', 'w-[116px]'], 'Próximo passo'], visiveis.map(linha), estado.lista.length ? 'Nenhuma venda corresponde aos filtros.' : 'Nenhuma venda ainda.', `<span>${plural(visiveis.length, 'venda')}${filtrando ? ` de ${estado.lista.length}` : ''}</span><span>Soma (sem cancelados): <strong>${moeda(total)}</strong></span>`)}`;
  const campoBusca = el.querySelector('#busca-contrato');
  campoBusca.addEventListener('input', () => { f.busca = campoBusca.value; rerenderMantendoCursor(campoBusca, renderListaContratos); });
  [['filtro-contratante', 'contratante'], ['filtro-status', 'status'], ['filtro-situacao', 'situacao'], ['filtro-vendedor', 'vendedor'], ['filtro-aguardando', 'aguardando']].forEach(([id, k]) => el.querySelector(`#${id}`).addEventListener('change', (e) => { f[k] = e.target.value; renderListaContratos(); }));
  el.querySelector('#btn-limpar')?.addEventListener('click', () => { estado.filtros.contratos = { busca: '', status: '', contratante: '', situacao: '', vendedor: '', aguardando: '', foco: '' }; atualizarUrl(); renderListaContratos(); });
  el.querySelectorAll('[data-foco]').forEach((b) => b.addEventListener('click', () => { f.foco = f.foco === b.dataset.foco ? '' : b.dataset.foco; atualizarUrl(); renderListaContratos(); }));
  // O código é o link (teclado, ⌘-clique); o resto da linha abre o mesmo contrato, a não ser que a pessoa esteja selecionando texto.
  el.querySelector('tbody').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-abrir]');
    if (!tr || e.target.closest('a, button') || getSelection().toString()) return;
    if (e.metaKey || e.ctrlKey) window.open(urlDetalhe(tr.dataset.abrir), '_blank'); else abrir(tr.dataset.abrir);
  });
}

// Visão da turma: quem está matriculado via contrato e quanto a turma fatura.
function renderListaTurmas() {
  const el = document.getElementById('lista');
  const f = estado.filtros.turmas;
  const termo = Contratos.normalizar(f.busca);
  const grupos = Contratos.porTurma(estado.lista, ctx()).filter((g) => !termo || Contratos.normalizar(`${g.rotulo} ${g.linhas.map((l) => `${l.aluno?.nome ?? ''} ${l.matricula.codigo} ${l.contrato.codigo}`).join(' ')}`).includes(termo));
  // Cartões fechados por padrão; com termo de busca os que casam abrem sozinhos.
  const aberto = (g) => Boolean(termo) || estado.turmasAbertas.has(g.chave);
  const todosAbertos = grupos.length > 0 && grupos.every(aberto);
  const bloco = (g) => `
    <section class="${CARTAO} overflow-hidden">
      <div data-toggle-turma="${esc(g.chave)}" class="px-4 py-3 flex flex-wrap items-center justify-between gap-2 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-neutral-900 transition" title="${aberto(g) ? 'Minimizar' : 'Expandir'}">
        <div class="flex items-center gap-2 min-w-0">
        <svg class="h-4 w-4 shrink-0 text-slate-400 transition-transform ${aberto(g) ? 'rotate-90' : ''}" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        <div>
          <h3 class="font-display text-[15px] font-semibold text-slate-900 dark:text-neutral-100">${esc(g.rotulo)}</h3>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">${g.turma ? `${esc(TIPOS_TURMA[g.turma.tipo])} · ${esc(g.turma.turno)} · ${esc(Contratos.fmtData(g.turma.inicio))} a ${esc(Contratos.fmtData(g.turma.fim))}` : 'Turma ainda não definida nas vendas'} · ${plural(g.ativos, 'aluno ativo', 'alunos ativos')} · ${plural(g.linhas.length, 'matrícula')}</p>
        </div>
        </div>
        <div class="text-right"><p class="text-xs font-medium text-slate-500 dark:text-neutral-400">Faturamento da turma</p><p class="font-display text-lg font-semibold text-slate-900 dark:text-neutral-100 tabular-nums">${moeda(g.faturamento)}</p></div>
      </div>
      ${aberto(g) ? `<table class="w-full text-left">
        <thead class="text-xs font-medium text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800">
          <tr><th class="${TH}">Matrícula</th><th class="${TH}">Aluno</th><th class="${TH}">Status na turma</th><th class="${TH}">Venda</th><th class="${TH}">Status da venda</th><th class="${TH} text-right">Valor final</th></tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
          ${g.linhas.map((l) => `
            <tr class="hover:bg-slate-50 dark:hover:bg-neutral-900 transition">
              <td class="${TD} font-mono text-xs">${esc(l.matricula.codigo)}</td>
              <td class="${TD} font-medium text-slate-800 dark:text-neutral-100">${l.aluno ? linkCliente('aluno', l.aluno.id, l.aluno.nomeSocial || l.aluno.nome) : '<span class="text-slate-400">aluno removido</span>'}</td>
              <td class="${TH}">${pilula(PILULA_MATRICULA[l.matricula.status], nomeDe(STATUS_MATRICULA, l.matricula.status))}</td>
              <td class="${TD}"><button type="button" data-abrir="${l.contrato.id}" class="font-mono text-xs text-petrol-800 dark:text-sky-300 hover:underline">${esc(l.contrato.codigo)}</button></td>
              <td class="${TH}"><div class="flex gap-1.5">${pilulaStatus(l.contrato)}${pilulaSituacao(l.contrato)}</div></td>
              <td class="${TD_VALOR}">${moeda(l.valor)}</td>
            </tr>`).join('')}
        </tbody>
      </table>` : ''}
    </section>`;
  el.innerHTML = `
    <div class="mb-4 flex flex-wrap items-center gap-2">
      ${busca('busca-turma', f.busca, 'Buscar turma, curso, aluno ou venda', 'w-80')}
      <div class="ml-auto flex items-center gap-3">
        <span class="text-xs text-slate-500 dark:text-neutral-400">Vendas canceladas ficam de fora; desistentes aparecem com R$ 0,00.</span>
        <button type="button" id="btn-turmas-todos" class="${BOTAO_SEC}" ${grupos.length ? '' : 'disabled'}>${todosAbertos ? 'Minimizar todos' : 'Expandir todos'}</button>
      </div>
    </div>
    <div class="space-y-4">${grupos.length ? grupos.map(bloco).join('') : `<div class="${CARTAO} px-4 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">Nenhuma turma com matrículas.</div>`}</div>`;
  const campoBusca = el.querySelector('#busca-turma');
  campoBusca.addEventListener('input', () => { f.busca = campoBusca.value; rerenderMantendoCursor(campoBusca, renderListaTurmas); });
  el.querySelector('#btn-turmas-todos').addEventListener('click', () => { if (todosAbertos) estado.turmasAbertas.clear(); else grupos.forEach((g) => estado.turmasAbertas.add(g.chave)); renderListaTurmas(); });
  el.querySelectorAll('[data-toggle-turma]').forEach((h) => h.addEventListener('click', (e) => { if (e.target.closest('a, button')) return; const k = h.dataset.toggleTurma; if (estado.turmasAbertas.has(k)) estado.turmasAbertas.delete(k); else estado.turmasAbertas.add(k); renderListaTurmas(); }));
  el.querySelectorAll('[data-abrir]').forEach((b) => b.addEventListener('click', () => abrir(b.dataset.abrir, 'pacotes')));
}

// ---------- Indicadores comerciais (aba Indicadores) ----------
// KPIs de vendas calculados dos contratos (Contratos.indicadoresComerciais); gráficos de js/chamados-graficos.js.
// Vendas/criados/cancelados seguem o período; pipeline, inadimplência, vagas e ocupação são foto de hoje.
// ---------- Indicadores comerciais (comercial.html) ----------
// Página própria (1º item do grupo Comercial), mesmo app com MODO 'indicadores' — como cobrancas.html.
function renderPaginaIndicadores() {
  const el = document.getElementById('tela');
  el.innerHTML = `
    <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="font-display text-xl font-semibold text-slate-900 dark:text-neutral-100">Indicadores comerciais</h2>
        <p class="text-sm text-slate-600 dark:text-neutral-400 mt-0.5">KPIs calculados das <a href="${urlLista()}" class="text-petrol-800 dark:text-sky-300 hover:underline">vendas</a>: vendas fechadas, funil, ticket, ciclo, pipeline, inadimplência e ocupação das turmas. Referência das regras em docs/contratos-indicadores.md.</p>
      </div>
      <a href="jornada-comercial.html" class="${BOTAO_SEC}" title="Leitura executiva da venda em 6 etapas, com topo de funil, CAC e previsibilidade (dados demonstrativos)">Jornada comercial</a>
    </div>
    <div id="lista"></div>`;
  renderIndicadores();
}

function renderIndicadores() {
  const el = document.getElementById('lista');
  const f = estado.filtros.indicadores;
  const periodos = Contratos.periodosIndicadores(estado.lista);
  const per = periodos.find((p) => p.id === f.periodo) ?? periodos.find((p) => p.id === 'mes');
  const k = Contratos.indicadoresComerciais(estado.lista, ctx(), { de: per.de, ate: per.ate, vendedorId: f.vendedor });
  const v = k.vendas;
  const compacto = (n) => (n == null ? '—' : Contratos.fmtCompacto(n));
  const pctTxt = (p) => (p == null ? '—' : `${p.toLocaleString('pt-BR')}%`);
  const dias = (d) => (d == null ? '—' : `${d.toLocaleString('pt-BR')} ${d === 1 ? 'dia' : 'dias'}`);
  const variacao = (atualV, ant) => {
    if (!ant) return 'sem base no período anterior';
    const d = Math.round(((atualV - ant) / ant) * 100);
    const cor = d > 0 ? 'text-emerald-700 dark:text-emerald-400' : d < 0 ? 'text-red-700 dark:text-red-400' : '';
    return `<span class="${cor} font-medium">${d > 0 ? '+' : ''}${d}%</span> vs. período anterior (${compacto(ant)})`;
  };
  const barraMeta = (pct) => {
    const p = Math.max(0, Math.min(100, pct ?? 0));
    const cor = pct == null ? 'bg-slate-300 dark:bg-neutral-700' : pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-400' : 'bg-red-500';
    return `<div class="h-2 rounded-full bg-white/80 dark:bg-black/40 overflow-hidden" title="${esc(`${pctTxt(pct)} da meta do período`)}"><div class="h-2 rounded-full ${cor}" style="width:${p}%"></div></div>`;
  };
  const secao = (titulo, sub, html) => `
    <section class="${CARTAO} p-4 min-w-0">
      <div class="mb-3"><h3 class="font-display text-[15px] font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h3>${sub ? `<p class="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">${sub}</p>` : ''}</div>
      ${html}
    </section>`;
  const vazioGraf = (txt) => `<p class="text-sm text-slate-400 py-8 text-center">${txt}</p>`;
  const nomePeriodo = `${Contratos.fmtData(per.de)} a ${Contratos.fmtData(per.ate)}`;
  const p = k.pipeline;
  const barraPct = (pct, tom = 'bg-petrol-800 dark:bg-sky-400') => `<div class="h-1.5 w-24 rounded-full bg-slate-100 dark:bg-neutral-900 overflow-hidden"><div class="h-1.5 ${tom}" style="width:${Math.max(0, Math.min(100, pct ?? 0))}%"></div></div>`;

  const linhaVendedor = (x) => `
    <tr class="hover:bg-slate-50 dark:hover:bg-neutral-900 transition">
      <td class="${TD} font-medium text-slate-800 dark:text-neutral-100">${esc(x.nome)}</td>
      <td class="${TD} text-right tabular-nums">${x.n}</td>
      <td class="${TD_VALOR}">${moeda(x.valor)}<br><span class="text-xs text-slate-400">${pctTxt(x.participacao)} do total</span></td>
      <td class="${TD_VALOR}">${x.ticket == null ? '—' : moeda(x.ticket)}</td>
      <td class="${TD} text-right tabular-nums">${pctTxt(x.desconto)}</td>
      <td class="${TD} text-right tabular-nums">${x.ciclo == null ? '—' : dias(Math.round(x.ciclo))}</td>
      <td class="${TD} text-right tabular-nums ${x.cancelados ? 'text-red-700 dark:text-red-400' : ''}">${x.cancelados}</td>
      <td class="${TD_VALOR}">${x.nPipeline ? `${moeda(x.pipeline)}<br><span class="text-xs text-slate-400">${plural(x.nPipeline, 'venda')}</span>` : '<span class="text-slate-400">—</span>'}</td>
    </tr>`;
  const linhaOcupacao = (g) => `
    <tr class="hover:bg-slate-50 dark:hover:bg-neutral-900 transition">
      <td class="${TD}"><span class="font-medium text-slate-800 dark:text-neutral-100">${esc(g.nome)}</span><br><span class="text-xs text-slate-400">${g.tipo === 'formacao' ? plural(g.turmas, 'turma') : 'avulsa'} · início ${esc(Contratos.fmtData(g.inicio))}</span></td>
      <td class="${TD} text-right tabular-nums whitespace-nowrap">${g.ocupadas} / ${g.vagas}</td>
      <td class="${TD}"><div class="flex items-center gap-2">${barraPct(g.pct, g.pct == null ? '' : g.pct >= 80 ? 'bg-emerald-500' : g.pct >= 50 ? 'bg-amber-400' : 'bg-red-500')}<span class="tabular-nums text-xs">${pctTxt(g.pct)}</span></div></td>
    </tr>`;
  const linhaCancel = (c) => `
    <tr class="hover:bg-slate-50 dark:hover:bg-neutral-900 transition">
      <td class="${TD} whitespace-nowrap"><button type="button" data-abrir="${c.id}" class="font-mono text-xs text-petrol-800 dark:text-sky-300 hover:underline">${esc(c.codigo)}</button><br><span class="text-xs text-slate-400">${esc(Contratos.fmtData(c.em))}</span></td>
      <td class="${TD}">${esc(c.motivo) || '<span class="text-slate-400">sem motivo registrado</span>'}</td>
      <td class="${TD_VALOR}">${moeda(c.valor)}</td>
    </tr>`;
  const tabelaSimples = (colunas, linhas, vazioTxt) => `
    <div class="overflow-x-auto -mx-4 -mb-4 border-t border-slate-200 dark:border-neutral-800">
      <table class="w-full text-left">
        <thead class="text-xs font-medium text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800"><tr>${colunas.map((c) => `<th class="${TH} ${c.startsWith('R$ ') || c.startsWith('# ') ? 'text-right' : ''}">${c.replace(/^(R\$|#) /, '')}</th>`).join('')}</tr></thead>
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">${linhas.length ? linhas.join('') : `<tr><td colspan="${colunas.length}" class="px-4 py-8 text-center text-sm text-slate-500 dark:text-neutral-400">${vazioTxt}</td></tr>`}</tbody>
      </table>
    </div>`;

  el.innerHTML = `
    <div class="mb-4 flex flex-wrap items-center gap-2">
      ${select('ind-periodo', 'Período', periodos, per.id).replace('<option value="">Período</option>', '')}
      ${select('ind-vendedor', 'Todos os vendedores', VENDEDORES, f.vendedor)}
      <span class="text-xs text-slate-600 dark:text-neutral-400">${esc(nomePeriodo)} · ${plural(k.periodo.nMeses, 'mês', 'meses')}</span>
      <div class="ml-auto flex items-center gap-2">
        <button type="button" id="ind-meta" class="${BOTAO_SEC}" title="Meta mensal de vendas fechadas para a escola; a meta do período é a mensal × meses do período">Meta mensal: ${compacto(k.meta.mensal)}</button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-3">
      ${tile({ rotulo: 'Vendas fechadas', valor: compacto(v.valor), ajuda: variacao(v.valor, k.anterior.valor), tom: 'info', fundo: true, icone: 'entrada', extraHtml: k.meta.periodo ? `${barraMeta(k.meta.pct)}<p class="text-[11px] text-sky-800/80 dark:text-sky-300/80 mt-1">${pctTxt(k.meta.pct)} da meta de ${compacto(k.meta.periodo)}</p>` : '' })}
      ${tile({ rotulo: 'Vendas fechadas', valor: String(v.n), ajuda: `${v.b2c} particular${v.b2c === 1 ? '' : 'es'} · ${v.b2b} empresa${v.b2b === 1 ? '' : 's'} · ${plural(v.alunos, 'aluno')}`, tom: 'info', fundo: true, icone: 'resultado' })}
      ${tile({ rotulo: 'Ticket médio', valor: compacto(v.ticket), ajuda: v.n ? `valor final ÷ ${plural(v.n, 'venda')}` : 'nenhuma venda fechada no período', tom: 'info', fundo: true })}
      ${tile({ rotulo: 'Desconto médio', valor: pctTxt(v.descontoPct), ajuda: v.desconto ? `${compacto(v.desconto)} abaixo da tabela` : 'vendido pela tabela', tom: v.descontoPct == null ? 'neutro' : v.descontoPct > 10 ? 'alerta' : 'bom', fundo: true, icone: 'percentual' })}
      ${tile({ rotulo: 'Ciclo de venda', valor: v.ciclo == null ? '—' : v.ciclo.toLocaleString('pt-BR'), sufixo: v.ciclo == null ? '' : 'dias', ajuda: 'da criação ao fechamento (assinatura)', tom: v.ciclo == null ? 'neutro' : v.ciclo <= 7 ? 'bom' : v.ciclo <= 30 ? 'alerta' : 'ruim', fundo: true, icone: 'relogio' })}
      ${tile({ rotulo: 'Conversão', valor: pctTxt(k.conversao), ajuda: `${v.n} fechados · ${k.cancelamentos.n} cancelados`, tom: k.conversao == null ? 'neutro' : k.conversao >= 80 ? 'bom' : k.conversao >= 50 ? 'alerta' : 'ruim', fundo: true })}
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
      ${tile({ rotulo: 'Pipeline aberto', valor: compacto(p.valor), ajuda: `${plural(p.rascunho, 'rascunho')} · ${p.aguardando} aguardando assinatura`, tom: 'info', fundo: true, icone: 'calendario', extraHtml: `<p class="text-xs text-sky-800/80 dark:text-sky-300/80" title="${esc(`Rascunho × ${Math.round(p.pesos.rascunho * 100)}% + Aguardando × ${Math.round(p.pesos.aguardando * 100)}%`)}">Previsão ponderada: <strong class="text-petrol-800 dark:text-sky-300">${compacto(p.ponderado)}</strong></p>` })}
      ${tile({ rotulo: 'Cancelamentos', valor: String(k.cancelamentos.n), ajuda: k.cancelamentos.n ? `${compacto(k.cancelamentos.valor)} · ${pctTxt(k.cancelamentos.taxa)} dos fechados + cancelados` : 'nenhum no período', tom: k.cancelamentos.n ? 'ruim' : 'bom', fundo: true })}
      ${tile({ rotulo: 'Inadimplência', valor: pctTxt(k.inadimplencia.taxa), ajuda: `${k.inadimplencia.n} de ${plural(k.inadimplencia.ativos, 'venda ativa', 'vendas ativas')} · ${compacto(k.inadimplencia.valor)} vencido`, tom: k.inadimplencia.taxa == null ? 'neutro' : k.inadimplencia.taxa > 5 ? 'ruim' : k.inadimplencia.taxa > 0 ? 'alerta' : 'bom', fundo: true, icone: 'alerta' })}
      ${tile({ rotulo: 'Ocupação das turmas', valor: pctTxt(k.ocupacaoGeral.taxa), ajuda: `${k.ocupacaoGeral.ocupadas} matrículas em ${k.ocupacaoGeral.vagas} vagas das turmas ativas`, tom: k.ocupacaoGeral.taxa == null ? 'neutro' : k.ocupacaoGeral.taxa >= 80 ? 'bom' : k.ocupacaoGeral.taxa >= 50 ? 'alerta' : 'ruim', fundo: true })}
      ${tile({ rotulo: 'Vagas vendidas sem aluno', valor: String(k.vagas.livres), ajuda: k.vagas.livres ? `${compacto(k.vagas.valorLivres)} já vendidos · ${k.vagas.aguardando} aguardando conferência` : 'todas as vagas vendidas têm aluno', tom: k.vagas.livres ? 'alerta' : 'bom', fundo: true })}
      ${tile({ rotulo: 'Recompra', valor: pctTxt(k.recompra.taxa), ajuda: `${k.recompra.recorrentes} de ${plural(k.recompra.contratantes, 'contratante')} voltaram a comprar`, tom: 'info', fundo: true })}
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      ${secao('Vendas por mês', 'Valor final das vendas fechadas, pela data de fechamento; o número em cima da coluna é a quantidade.', k.serie.some((x) => x.valor) ? colunasMoeda(k.serie) : vazioGraf('Nenhuma venda fechada no período.'))}
      ${secao('Vendas criadas × fechadas por mês', 'Criadas (pela data de criação) × fechadas (pela data de fechamento).', linhasTempo(k.serie.map((x) => ({ rotulo: x.rotulo, a: x.criados, b: x.fechados })), [{ nome: 'Criados', cor: GRAF.linha1, corFill: GRAF.serie1 }, { nome: 'Fechados', cor: GRAF.linha2, corFill: GRAF.serie2 }]))}
      ${secao('Funil do período', `Vendas criadas no período (${k.criados}) e até onde chegaram — canceladas ficam de fora das etapas.`, k.criados ? `${barrasHorizontais(k.funilAcumulado.map((e) => ({ nome: e.nome, valor: e.n, tip: `${e.nome}: ${e.n} de ${k.criados} (${pctTxt(e.pct)})`, sufixo: ` (${pctTxt(e.pct)})` })), { max: k.criados, rotuloLargura: 150 })}<p class="text-xs text-slate-500 dark:text-neutral-400 mt-2">${k.funil.find((x) => x.status === 'cancelado')?.n ?? 0} cancelado(s) entre os criados no período · ${k.funil.find((x) => x.status === 'rascunho')?.n ?? 0} ainda em rascunho · ${k.funil.find((x) => x.status === 'aguardando')?.n ?? 0} aguardando assinatura/pagamento.</p>` : vazioGraf('Nenhuma venda criada no período.'))}
      ${secao('Particular × Empresa', 'Valor fechado por tipo de contratante (B2C × B2B).', v.valor ? `<div class="flex flex-wrap items-center justify-center gap-8 py-2"><div class="w-48 shrink-0">${rosca([{ nome: 'Particular', valor: v.valorB2c, cor: GRAF.serie1 }, { nome: 'Empresa', valor: v.valorB2b, cor: GRAF.serie2 }], { tamanho: 190, formato: compacto, legenda: false })}</div><div class="text-sm space-y-2 min-w-0"><p><span class="inline-block h-2.5 w-2.5 rounded-sm bg-[#2a78d6] mr-1.5"></span>Particular: <strong class="tabular-nums">${moeda(v.valorB2c)}</strong> · ${plural(v.b2c, 'venda')}</p><p><span class="inline-block h-2.5 w-2.5 rounded-sm bg-[#eb6834] mr-1.5"></span>Empresa: <strong class="tabular-nums">${moeda(v.valorB2b)}</strong> · ${plural(v.b2b, 'venda')}</p><p class="text-xs text-slate-500 dark:text-neutral-400 pt-1">Alunos aprovados: ${k.origens.escola} pela escola · ${k.origens.link} pelo link do pacote.</p></div></div>` : vazioGraf('Nenhuma venda fechada no período.'))}
      ${secao('Por vendedor', 'Vendas fechadas no período; pipeline é o que cada um tem em aberto hoje.', `${barrasHorizontais(k.porVendedor.map((x) => ({ nome: x.nome, valor: x.valor, tip: `${x.nome}\n${moeda(x.valor)} · ${plural(x.n, 'venda')}` })), { formato: compacto, rotuloLargura: 130 })}<div class="mt-3">${tabelaSimples(['Vendedor', '# Fechados', 'R$ Valor', 'R$ Ticket', '# Desconto', '# Ciclo', '# Cancel.', 'R$ Pipeline'], k.porVendedor.map(linhaVendedor), 'Sem vendedores.')}</div>`)}
      ${secao('Mix de produto', 'Valor fechado por formação ou curso avulso (avulsos rateados pelo valor dos itens).', k.mixProduto.length ? barrasHorizontais(k.mixProduto.slice(0, 10).map((x) => ({ nome: x.nome, valor: x.valor, tip: `${x.nome}\n${moeda(x.valor)} · ${plural(x.n, 'pacote')} · ${plural(x.alunos, 'aluno')}` })), { formato: compacto, rotuloLargura: 230 }) : vazioGraf('Nenhuma venda fechada no período.'))}
      ${secao('Ocupação das turmas ativas', 'Matrículas ativas ÷ vagas, turmas planejadas, confirmadas ou em andamento; as turmas de uma edição de formação contam uma vez. Menor ocupação primeiro.', tabelaSimples(['Turma / formação', '# Matrículas / vagas', 'Ocupação'], k.ocupacao.map(linhaOcupacao), 'Nenhuma turma ativa.'))}
      ${secao('Cancelamentos do período', 'Motivos registrados ao cancelar — o que fez a venda cair.', tabelaSimples(['Venda', 'Motivo', 'R$ Valor'], k.cancelamentos.motivos.map(linhaCancel), 'Nenhum cancelamento no período.'))}
    </div>

    <details class="mt-4 text-xs text-slate-600 dark:text-neutral-400">
      <summary class="cursor-pointer hover:text-slate-700 dark:hover:text-neutral-200">Como calculamos</summary>
      <ul class="mt-2 space-y-1 list-disc pl-5">
        <li><strong>Fechado</strong> = Comercial OK ou Adm OK. <strong>Data de fechamento</strong> = assinatura das duas partes; sem ela, 1ª parcela paga, documento gerado ou criação.</li>
        <li><strong>Vendas fechadas</strong>, <strong>criados</strong> e <strong>cancelados</strong> obedecem ao período. <strong>Pipeline, inadimplência, vagas, recompra e ocupação</strong> são a foto de hoje.</li>
        <li><strong>Conversão</strong> = fechados ÷ (fechados + cancelados) no período. <strong>Desconto médio</strong> = (tabela − final) ÷ tabela. <strong>Ticket</strong> = valor final ÷ vendas.</li>
        <li><strong>Previsão ponderada</strong> = rascunhos × ${Math.round(p.pesos.rascunho * 100)}% + aguardando × ${Math.round(p.pesos.aguardando * 100)}%. <strong>Meta do período</strong> = meta mensal × ${plural(k.periodo.nMeses, 'mês', 'meses')}.</li>
        <li><strong>Recompra</strong> = contratantes (empresa ou responsável financeiro) com 2+ vendas fechadas no histórico inteiro.</li>
      </ul>
    </details>`;
  el.querySelector('#ind-periodo').addEventListener('change', (e) => { f.periodo = e.target.value; renderIndicadores(); });
  el.querySelector('#ind-vendedor').addEventListener('change', (e) => { f.vendedor = e.target.value; renderIndicadores(); });
  el.querySelector('#ind-meta').addEventListener('click', abrirModalMeta);
  el.querySelectorAll('[data-abrir]').forEach((b) => b.addEventListener('click', () => abrir(b.dataset.abrir)));
  ligarTooltips(el);
}

// Colunas por mês com escala em R$ (uma escala por gráfico, passos "redondos"); quantidade de contratos em cima da coluna.
function colunasMoeda(pontos, { largura = 640, altura = 220 } = {}) {
  const mL = 56; const mR = 12; const mT = 16; const mB = 28;
  const w = largura - mL - mR; const h = altura - mT - mB;
  const max = Math.max(1, ...pontos.map((x) => x.valor));
  const bruto = max / 4; const pot = 10 ** Math.floor(Math.log10(bruto)); const passo = [1, 2, 2.5, 5, 10].map((m) => m * pot).find((x) => x >= bruto) ?? pot * 10;
  const topo = Math.ceil(max / passo) * passo;
  const y = (val) => mT + h - (val / topo) * h;
  const gap = Math.min(14, (w / pontos.length) * 0.3); const wCol = (w - gap * (pontos.length + 1)) / pontos.length;
  const xDe = (i) => mL + gap + i * (wCol + gap);
  const rotEixo = (val) => (val >= 1000 ? `${(val / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : String(val));
  const grade = []; for (let val = 0; val <= topo + 0.001; val += passo) grade.push(`<line x1="${mL}" x2="${mL + w}" y1="${y(val)}" y2="${y(val)}" class="${GRAF.grade}" stroke-width="1"/><text x="${mL - 6}" y="${y(val) + 4}" text-anchor="end" class="${GRAF.inkSec} text-[10px] tabular-nums">${rotEixo(val)}</text>`);
  const cols = pontos.map((x, i) => { const yv = y(x.valor); return `<rect x="${xDe(i)}" y="${yv}" width="${wCol}" height="${Math.max(0, mT + h - yv)}" rx="3" class="${x.valor ? GRAF.serie1 : GRAF.neutro}" data-tip="${esc(`${x.rotulo}\n${moeda(x.valor)} · ${plural(x.fechados, 'venda fechada', 'vendas fechadas')}`)}"/>${x.fechados ? `<text x="${xDe(i) + wCol / 2}" y="${yv - 4}" text-anchor="middle" class="${GRAF.ink} text-[10px] tabular-nums">${x.fechados}</text>` : ''}`; });
  const rotulos = pontos.map((x, i) => (pontos.length > 14 && i % 2 ? '' : `<text x="${xDe(i) + wCol / 2}" y="${altura - 8}" text-anchor="middle" class="${GRAF.inkSec} text-[10px]">${esc(x.rotulo)}</text>`));
  return `<svg viewBox="0 0 ${largura} ${altura}" class="w-full" role="img">${grade.join('')}<line x1="${mL}" x2="${mL + w}" y1="${y(0)}" y2="${y(0)}" class="${GRAF.eixo}" stroke-width="1"/>${cols.join('')}${rotulos.join('')}</svg>${tabelaDados(['Mês', 'Vendas (R$)', 'Fechados', 'Criados', 'Cancelados'], pontos.map((x) => [x.rotulo, moeda(x.valor), x.fechados, x.criados, x.cancelados]))}`;
}

// Meta mensal de vendas fechadas [sup.]: uma para a escola inteira (Contratos.metaComercial).
function abrirModalMeta() {
  const meta = Contratos.metaComercial();
  modalFormulario({
    id: 'form-meta', titulo: 'Meta mensal de vendas', subtitulo: 'Valor de vendas fechadas por mês, para a escola inteira. A meta do período é a mensal × meses do período.', largura: 'max-w-md', rotulo: 'Salvar meta',
    corpo: campoTexto('mensal', 'Meta mensal (R$)', meta.mensal == null ? '' : meta.mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), { placeholder: '80.000,00', extra: 'inputmode="decimal"' }),
    aoSalvar: (fd) => { const erros = Contratos.salvarMetaComercial(fd.get('mensal')); if (erros.length) return erros; toast('Meta salva.'); renderIndicadores(); },
    foco: '[name="mensal"]',
  });
}

// ---------- Cobranças (cobrancas.html) ----------
// Página própria: todas as parcelas em aberto, com as vencidas primeiro.
// Provisória — deve ser remodelada (ou apagada) quando o financeiro ganhar tela definitiva.
function renderPaginaCobrancas() {
  const el = document.getElementById('tela');
  el.innerHTML = `
    <div class="mb-4">
      <h2 class="font-display text-xl font-semibold text-slate-900 dark:text-neutral-100">Cobranças</h2>
      <p class="text-sm text-slate-600 dark:text-neutral-400 mt-0.5">Parcelas em aberto de todas as vendas, vencidas primeiro. Emita boletos e dê baixa aqui; a condição de pagamento se define em <a href="${urlLista()}" class="text-petrol-800 dark:text-sky-300 hover:underline">Vendas</a>.</p>
    </div>
    <div id="lista"></div>`;
  renderListaCobrancas();
}

function renderListaCobrancas() {
  const el = document.getElementById('lista');
  const f = estado.filtros.cobrancas;
  const termo = Contratos.normalizar(f.busca);
  const todas = Contratos.cobrancas(estado.lista, ctx());
  const visiveis = todas
    .filter((l) => !termo || Contratos.normalizar(`${l.contrato.codigo} ${l.responsavel.nome}`).includes(termo))
    .filter((l) => !f.so || (f.so === 'vencidas' ? l.vencida : f.so === 'emitir' ? l.parcela.status === 'prevista' : l.parcela.status === 'emitida' && !l.vencida))
    .sort((a, b) => Number(b.vencida) - Number(a.vencida) || a.parcela.vencimento.localeCompare(b.parcela.vencimento));
  const soma = visiveis.reduce((s, l) => s + l.parcela.valor, 0);
  const vencidas = todas.filter((l) => l.vencida).reduce((s, l) => s + l.parcela.valor, 0);
  const linha = (l) => `
    <tr class="hover:bg-slate-50 dark:hover:bg-neutral-900 transition ${l.vencida ? 'bg-red-50/40 dark:bg-red-950/20' : ''}">
      <td class="${TD} tabular-nums whitespace-nowrap ${l.vencida ? 'text-red-700 dark:text-red-400 font-medium' : ''}">${esc(Contratos.fmtData(l.parcela.vencimento))}</td>
      <td class="${TD}"><span class="font-medium text-slate-800 dark:text-neutral-100">${esc(l.responsavel.nome)}</span><br><span class="text-xs text-slate-400">${esc(l.responsavel.email || l.responsavel.documento)}</span></td>
      <td class="${TD}"><button type="button" data-abrir="${l.contrato.id}" class="font-mono text-xs text-petrol-800 dark:text-sky-300 hover:underline">${esc(l.contrato.codigo)}</button><br><span class="text-xs text-slate-400">${esc(Contratos.descricao(ctx(), l.contrato))}</span></td>
      <td class="${TD} tabular-nums whitespace-nowrap">${l.parcela.n}/${l.contrato.parcelas.length}</td>
      <td class="${TD_VALOR}">${moeda(l.parcela.valor)}</td>
      <td class="${TH}"><div class="flex flex-wrap gap-1.5">${pilula(l.vencida ? PILULA.vermelha : PILULA_PARCELA[l.parcela.status], l.vencida ? 'Vencida' : nomeDe(STATUS_PARCELA, l.parcela.status))}${l.situacao === 'recuperante' ? pilula(PILULA.laranja, 'Recuperante') : ''}${l.bloqueios.length ? `<span title="Boleto travado: ${esc(l.bloqueios.join(' · '))}" class="text-amber-600 dark:text-amber-400">${ICONE.alerta}</span>` : ''}</div></td>
      <td class="${TH} text-right whitespace-nowrap">
        ${l.parcela.status === 'prevista' ? `<button type="button" data-emitir="${l.contrato.id}:${l.parcela.n}" class="${BOTAO_LINK}" ${l.bloqueios.length ? 'disabled title="' + esc(l.bloqueios.join(' · ')) + '"' : ''}>Emitir boleto</button>` : `<button type="button" data-pagar="${l.contrato.id}:${l.parcela.n}" class="${BOTAO_LINK}">Marcar paga</button>`}
      </td>
    </tr>`;
  el.innerHTML = `
    <div class="mb-4 flex flex-wrap items-center gap-2">
      ${busca('busca-cobranca', f.busca, 'Buscar por responsável ou código', 'w-80')}
      <div class="ml-auto flex flex-wrap items-center gap-2">
        ${select('filtro-so', 'Todas em aberto', [{ id: 'vencidas', nome: 'Só vencidas' }, { id: 'emitir', nome: 'Só a emitir' }, { id: 'aberto', nome: 'Emitidas, a vencer' }], f.so)}
      </div>
    </div>
    ${vencidas > 0 ? faixa('vermelha', `<strong>${moeda(vencidas)}</strong> em ${plural(todas.filter((l) => l.vencida).length, 'parcela vencida', 'parcelas vencidas')}. Abra a venda para cobrar ou registrar um acordo de recuperação.`) : ''}
    ${tabela(['Vencimento', 'Responsável financeiro', 'Venda', 'Parcela', 'R$ Valor', 'Situação', ''], visiveis.map(linha), 'Nenhuma parcela em aberto.', `<span>${plural(visiveis.length, 'parcela')}</span><span>Total: <strong>${moeda(soma)}</strong></span>`)}`;
  const campoBusca = el.querySelector('#busca-cobranca');
  campoBusca.addEventListener('input', () => { f.busca = campoBusca.value; rerenderMantendoCursor(campoBusca, renderListaCobrancas); });
  el.querySelector('#filtro-so').addEventListener('change', (e) => { f.so = e.target.value; renderListaCobrancas(); });
  el.querySelectorAll('[data-abrir]').forEach((b) => b.addEventListener('click', () => abrir(b.dataset.abrir, 'cobranca')));
  el.querySelectorAll('[data-emitir]').forEach((b) => b.addEventListener('click', () => { const [id, n] = b.dataset.emitir.split(':'); alterar((l) => Contratos.emitirBoletos(l, ctx(), id, [Number(n)])); toast(`Boleto ${n} emitido.`); renderListaCobrancas(); }));
  el.querySelectorAll('[data-pagar]').forEach((b) => b.addEventListener('click', () => { const [id, n] = b.dataset.pagar.split(':'); abrirDrawerPagamento(id, Number(n), renderListaCobrancas); }));
}

// ---------- Contrato aberto ----------

function renderContrato() {
  const c = atual();
  const r = Contratos.responsavelFinanceiro(ctx(), c);
  const t = Contratos.totais(c);
  const editavel = Contratos.editavel(c);
  const el = document.getElementById('tela');
  const contagens = { pacotes: t.nAlunos, cobranca: c.parcelas.length, historico: c.historico.length };
  const subAba = (a) => `
    <button type="button" data-aba="${a.id}"
      class="px-0.5 pb-2.5 text-sm border-b-2 transition whitespace-nowrap ${estado.aba === a.id ? 'border-[color:var(--f-marca-tinta)] text-slate-900 dark:text-neutral-100 font-medium' : 'border-transparent text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'}">${a.titulo}${contagens[a.id] != null ? ` <span class="ml-1 text-xs text-slate-600 dark:text-neutral-400 tabular-nums">${contagens[a.id]}</span>` : ''}${a.id === 'pacotes' && t.nAguardando ? ` <span class="ml-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 text-[11px] tabular-nums" title="Alunos aguardando conferência">${t.nAguardando}</span>` : ''}</button>`;
  const ativo = c.status !== 'cancelado';
  // Pílulas só de exceção: Adm OK, empresa/particular (está no chip) e assinatura completa não se anunciam; dívida e
  // assinatura pendente estão na faixa. Uma ação à vista; o resto no "Mais", com o motivo de cada item travado.
  const itensMais = [
    { nome: c.contratante ? 'Trocar contratante' : 'Definir contratante', detalhe: editavel ? '' : 'Só em rascunho — reabra a venda para trocar', desabilitado: !editavel, acao: abrirModalContratante },
    { nome: 'Duplicar', detalhe: 'Rascunho novo, escolhendo o que copiar', acao: abrirModalDuplicar },
    'sep',
    ...(ativo ? [{ nome: 'Cancelar venda', perigo: true, acao: confirmarCancelamento }] : []),
    { nome: 'Excluir rascunho', perigo: true, desabilitado: !Contratos.podeExcluir(c), detalhe: Contratos.podeExcluir(c) ? '' : 'Só rascunhos — este se cancela', acao: confirmarExclusao },
  ];
  el.innerHTML = `
    <nav aria-label="Breadcrumb" class="mb-3 flex items-center gap-1.5 text-sm text-slate-600 dark:text-neutral-400">
      <a href="home.html" class="hover:text-petrol-800 dark:hover:text-sky-300 transition">Home</a>
      <span>/</span>
      <a href="${urlLista()}" class="hover:text-petrol-800 dark:hover:text-sky-300 transition">Vendas</a>
      <span>/</span>
      <span class="font-medium text-slate-800 dark:text-neutral-100 truncate max-w-xs font-mono" aria-current="page">${esc(c.codigo)}</span>
    </nav>
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1 flex items-start gap-3">
        <div class="h-12 w-12 shrink-0 rounded-xl bg-petrol-800/10 dark:bg-sky-950/60 text-petrol-800 dark:text-sky-300 grid place-items-center">${ICONE.doc.replace('h-3.5 w-3.5', 'h-6 w-6')}</div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2 min-w-0">
            <h2 class="font-registro text-[26px] leading-[1.15] font-semibold tracking-[-0.01em] tabular-nums text-slate-900 dark:text-neutral-100 truncate">Venda ${esc(c.codigo)}</h2>
            ${c.status === 'adm_ok' ? '' : pilulaStatus(c)}
            ${!c.contratante && c.status !== 'rascunho' ? pilulaContratante(c) : ''}
          </div>
          <p class="text-sm text-slate-600 dark:text-neutral-300 mt-1">${esc(Contratos.descricao(ctx(), c))}${c.duplicadoDe ? ` <span class="text-xs text-slate-400">· duplicado de <button type="button" data-abrir-origem="${c.duplicadoDe}" class="font-mono hover:underline">${esc(Contratos.porId(estado.lista, c.duplicadoDe)?.codigo ?? c.duplicadoDe)}</button></span>` : ''}</p>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
            ${r.tipo === null ? chip(ICONE.pessoa, 'Contratante não definido', 'Responsável financeiro') : chip(r.tipo === 'empresa' ? ICONE.predio : ICONE.pessoa, `${esc(r.nome)}${r.documento ? ` · <span class="font-mono">${esc(r.documento)}</span>` : ''}`, 'Responsável financeiro')}
            ${chip(ICONE.pessoa, `${plural(t.nAlunos, 'aluno')}${t.nAguardando ? ` (${t.nAguardando} aguardando)` : ''} · ${plural(t.livres, 'vaga livre', 'vagas livres')}`, 'Alunos ocupando vaga · vagas livres')}
            ${chip(ICONE.dinheiro, moeda(t.final), 'Valor final')}
            ${chip(ICONE.calendario, `${esc(Contratos.fmtData(c.criadoEm))} · ${esc(nomeDe(VENDEDORES, c.vendedorId))}`, 'Criado em · vendedor')}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button type="button" id="btn-editar" class="${BOTAO_SEC}">${ICONE.lapis} Editar dados</button>
        <button type="button" id="btn-mais" class="${BOTAO_SEC}" aria-haspopup="menu" aria-expanded="false">Mais ${ICONE.abaixo}</button>
      </div>
    </div>
    <div id="faixa"></div>
    <div class="mb-4 shadow-[inset_0_-1px_0] shadow-slate-200 dark:shadow-neutral-800 flex items-center gap-4 overflow-x-auto [scrollbar-width:thin]">${ABAS.map(subAba).join('')}</div>
    <div id="acoes-aba" class="mb-4 flex flex-wrap items-center gap-2 empty:hidden"></div>
    <div id="conteudo-aba"></div>`;
  el.querySelectorAll('[data-aba]').forEach((b) => b.addEventListener('click', () => { estado.aba = b.dataset.aba; atualizarUrl(); renderTudo(); }));
  el.querySelector('#btn-editar').addEventListener('click', abrirDrawerDados);
  el.querySelector('#btn-mais').addEventListener('click', (e) => abrirMenu(e.currentTarget, itensMais));
  el.querySelector('[data-abrir-origem]')?.addEventListener('click', (e) => abrir(e.currentTarget.dataset.abrirOrigem));
  const faixaEl = el.querySelector('#faixa');
  faixaEl.innerHTML = faixaContrato(c);
  faixaEl.querySelectorAll('[data-acao]').forEach((b) => b.addEventListener('click', () => executarAcao(b.dataset.acao)));
  faixaEl.querySelector('[data-ir-aba]')?.addEventListener('click', (e) => abrir(c.id, e.currentTarget.dataset.irAba));
  faixaEl.querySelector('[data-conferir]')?.addEventListener('click', () => { expandirPacotesAguardando(c); abrir(c.id, 'pacotes'); document.querySelector('[data-aguardando-primeiro]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  ({ resumo: renderResumo, pacotes: renderPacotes, cobranca: renderCobranca, documentos: renderDocumentos, historico: renderHistorico })[estado.aba]();
}

// Faixa do topo: parcela vencida primeiro (quanto, há quanto tempo, quem paga), depois a etapa do fluxo que ainda
// falta, com botão quando há ação direta. Última faixa (âmbar) quando há alunos aguardando conferência.
function faixaContrato(c) {
  if (c.status === 'cancelado') {
    const r = c.cancelamento?.rescisao;
    const saldoTxt = !r ? '' : r.saldo > 0 ? ` · <strong>Saldo a cobrar ${moeda(r.saldo)}</strong> até ${esc(Contratos.fmtData(r.prazo))}` : r.saldo < 0 ? ` · <strong>${r.destino === 'carta_credito' ? `Carta de crédito de ${moeda(-r.saldo)}` : `Devolver ${moeda(-r.saldo)}`}</strong>${r.destino === 'carta_credito' ? ` válida até ${esc(Contratos.fmtData(r.validadeCarta))}` : ''}` : ' · Sem saldo a cobrar ou devolver';
    return faixa(r && r.saldo > 0 ? 'vermelha' : 'neutra', `<strong>Cancelado em ${esc(Contratos.fmtDataHora(c.cancelamento?.em))}.</strong> ${esc(c.cancelamento?.motivo ?? '')}${saldoTxt}`);
  }
  const prox = Contratos.proximaAcao(ctx(), c);
  const rotulos = { contratante: 'Definir contratante', documento: 'Gerar documento', comercial_ok: 'Marcar Comercial OK', adm_ok: 'Marcar Adm OK', boletos: 'Emitir boletos', nf: 'Emitir NF', assinatura: 'Registrar assinatura', clicksign: 'Enviar para assinatura', recuperacao: 'Registrar acordo' };
  const linha = (tom, texto, acoes) => faixa(tom, `<div class="flex flex-wrap items-center justify-between gap-2"><span>${texto}</span>${acoes ? `<span class="flex items-center gap-2">${acoes}</span>` : ''}</div>`);
  const botao = (acao) => (acao ? `<button type="button" data-acao="${acao}" class="${BOTAO_PRI} h-8">${rotulos[acao]}</button>` : '');
  const passo = (x) => linha(x.acao ? 'petrol' : 'ambar', esc(x.texto), botao(x.acao));
  const d = prox.divida;
  let principal;
  if (d) {
    const quem = Contratos.responsavelFinanceiro(ctx(), c).nome;
    const verCobranca = estado.aba === 'cobranca' ? '' : `<button type="button" data-ir-aba="cobranca" class="${BOTAO_SEC} h-8">Ver cobrança</button>`;
    principal = d.situacao === 'inadimplente'
      ? linha('vermelha', `<strong>${plural(d.n, 'parcela vencida', 'parcelas vencidas')} · ${moeda(d.valor)}</strong>, há ${plural(d.dias, 'dia')}${d.encargos ? ` (+ ${moeda(d.encargos)} de multa e juros)` : ''}${quem ? `. Paga: ${esc(quem)}.` : '.'}`, verCobranca + botao('recuperacao'))
      : linha('ambar', `<strong>Em recuperação desde ${esc(Contratos.fmtData(c.recuperacao?.desde))}</strong> · ${plural(d.n, 'parcela vencida', 'parcelas vencidas')}, ${moeda(d.valor)}${c.recuperacao?.acordo ? ` · ${esc(c.recuperacao.acordo)}` : ''}`, verCobranca);
    if (prox.etapa) principal += passo(prox.etapa);
  } else principal = c.status === 'adm_ok' ? '' : passo(prox);
  const conferencia = prox.aguardando ? faixa('ambar', `<div class="flex flex-wrap items-center justify-between gap-2"><span><strong>${prox.aguardando === 1 ? '1 aluno aguardando' : `${prox.aguardando} alunos aguardando`} conferência</strong> — entraram pelo link do pacote e ainda não contam em turma, faturamento por aluno nem no anexo do documento.</span><button type="button" data-conferir class="${BOTAO_PRI} h-8">Conferir</button></div>`) : '';
  return principal + conferencia;
}

function executarAcao(acao) {
  const c = atual();
  if (acao === 'contratante') abrirModalContratante();
  else if (acao === 'documento') { alterar((l) => Contratos.gerarDocumento(l, ctx(), c.id)); toast(`Documento v${atual().documento.versao} gerado.`); abrir(c.id, 'documentos'); }
  else if (acao === 'comercial_ok') { alterar((l) => Contratos.avancar(l, c.id, 'comercial_ok')); toast('Comercial OK.'); renderContrato(); }
  else if (acao === 'adm_ok') { alterar((l) => Contratos.avancar(l, c.id, 'adm_ok')); toast('Adm OK.'); renderContrato(); }
  else if (acao === 'boletos') confirmarEmissaoBoletos();
  else if (acao === 'nf') abrirDrawerNf();
  else if (acao === 'assinatura') abrirDrawerAssinatura();
  else if (acao === 'clicksign') abrirModalClicksign();
  else if (acao === 'recuperacao') abrirDrawerRecuperacao();
}

// ---- Resumo ----

function renderResumo() {
  const c = atual();
  const r = Contratos.responsavelFinanceiro(ctx(), c);
  const t = Contratos.totais(c);
  const emp = Contratos.empresaDe(ctx(), c);
  const editavel = Contratos.editavel(c);
  const pendEmissao = Contratos.pendenciasEmissao(ctx(), c);
  const assinaturaHtml = (parte) => { const a = Contratos.assinaturaDe(c, parte.id); return a ? `<span class="text-emerald-700 dark:text-emerald-400">✓</span> ${esc(Contratos.fmtData(a.assinadoEm))} · ${esc(a.por)}${a.envelopeId ? ` <span class="font-mono text-slate-500 dark:text-neutral-400">${esc(a.envelopeId)}</span>` : ` <span class="text-slate-500 dark:text-neutral-400">${esc(nomeDe(MEIOS_ASSINATURA, a.meio)).toLowerCase()}</span>`}` : c.documento && c.status !== 'cancelado' ? '<span class="text-amber-700 dark:text-amber-300">pendente</span>' : '—'; };
  const etapa = (s) => {
    const feito = Contratos.statusDe(c).ordem >= s.ordem && c.status !== 'cancelado';
    const atualEtapa = c.status === s.id;
    return `<li class="flex items-center gap-2 ${feito ? 'text-slate-800 dark:text-neutral-100' : 'text-slate-400'}">
      <span class="h-5 w-5 shrink-0 rounded-full grid place-items-center text-[10px] font-semibold ${feito ? 'bg-petrol-800 dark:bg-sky-500 text-white' : 'border border-slate-300 dark:border-neutral-700'}">${feito ? '✓' : s.ordem + 1}</span>
      <span class="${atualEtapa ? 'font-semibold' : ''}">${esc(s.nome)}</span></li>`;
  };
  const tipoResp = { empresa: 'Empresa', responsavel: 'Responsável cadastrado', aluno: 'O próprio aluno', terceiro: r.tipo === 'terceiro' ? `Responsável (${r.parentesco || 'terceiro'}) por ${r.aluno?.nome ?? ''}` : '' }[r.tipo] ?? '';
  const cartaoContratante = !c.contratante ? `
        <div class="p-4 space-y-3">
          <div class="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2.5 text-sm text-amber-900 dark:text-amber-200">
            <p><strong>Contratante não definido.</strong> Sem ele não dá para gerar o documento nem abrir os links dos pacotes; os alunos já podem ser vinculados.</p>
            ${editavel ? `<button type="button" id="btn-definir-contratante" class="${BOTAO_PRI} h-8 mt-2">Definir contratante</button>` : '<p class="text-xs mt-1">Reabra a venda para definir.</p>'}
          </div>
        </div>` : `
        <div class="p-4 space-y-4">
          ${campo('Contratante', c.contratante === 'empresa' ? (emp ? linkCliente('empresa', emp.id, Contratos.nomeEmpresa(emp)) : vazio('', 'empresa não encontrada')) : `Particular · ${plural(t.nAlunos, 'aluno')}`)}
          ${campo('Responsável financeiro', `<p class="font-medium">${linkResponsavel(r)}</p><p class="text-xs text-slate-500 dark:text-neutral-400">${esc(tipoResp)}${r.documento ? ` · <span class="font-mono">${esc(r.documento)}</span>` : ''}${r.email ? ` · ${esc(r.email)}` : ''}</p>`)}
          ${emp?.cobranca.exigePedidoCompra ? campo('Pedido de compra (PO)', c.cobranca.pedidoCompra ? `<span class="font-mono">${esc(c.cobranca.pedidoCompra)}</span>` : '<span class="text-amber-700 dark:text-amber-300">exigido pela empresa — informe na aba Cobrança</span>') : ''}
          ${pendEmissao.length && c.status !== 'cancelado' ? `<div class="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-900 dark:text-amber-200"><strong>Trava boleto/NF:</strong> ${pendEmissao.map(esc).join(' · ')}${r.pendencias.length && (r.empresa || r.responsavel || r.aluno) ? ` — ${linkResponsavel({ ...r, nome: 'completar cadastro' })}` : ''}${c.contratante === 'empresa' && emp ? `<div class="mt-1.5"><button type="button" id="btn-link-empresa" class="${BOTAO_LINK}">${ICONE.externo} ${emp.cadastro && !emp.cadastro.preenchidoEm ? `Ver o link enviado à empresa (gerado em ${esc(Contratos.fmtData(emp.cadastro.criadoEm))})` : 'Pedir para a própria empresa preencher'}</button></div>` : ''}</div>` : ''}
        </div>`;
  const linhaPacote = (pp) => `
    <tr>
      <td class="py-1.5 pr-2"><span class="block text-slate-800 dark:text-neutral-100 truncate">${esc(pp.pacote.nome)}</span><span class="block text-[11px] text-slate-500 dark:text-neutral-400">${pp.ocupadas}/${pp.vagas} ocupadas${pp.aguardando ? ` · ${pp.aguardando} aguardando` : ''}</span></td>
      <td class="py-1.5 px-2 text-right tabular-nums">${pp.vagas}</td>
      <td class="py-1.5 px-2 text-right tabular-nums">${moeda(pp.valorPacote)}${pp.basePacote > pp.valorPacote ? `<br><span class="text-[11px] text-slate-500 dark:text-neutral-400 line-through">${moeda(pp.basePacote)}</span>` : ''}</td>
      <td class="py-1.5 pl-2 text-right tabular-nums font-medium text-slate-800 dark:text-neutral-100">${moeda(pp.final)}${pp.alunosFinal !== pp.ocupadas * pp.valorPacote && pp.ocupadas ? `<br><span class="text-[11px] text-slate-500 dark:text-neutral-400" title="Alunos com ajustes individuais">c/ ajustes</span>` : ''}</td>
    </tr>`;
  document.getElementById('acoes-aba').innerHTML = '';
  document.getElementById('conteudo-aba').innerHTML = `
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <section class="${CARTAO}">
        ${cabecalhoSecao('Contratante e responsável financeiro', 'Contra quem saem o contrato, o boleto e a NF.', c.contratante && editavel ? 'btn-trocar-contratante' : null, 'Trocar contratante')}
        ${cartaoContratante}
      </section>
      <section class="${CARTAO}">
        ${cabecalhoSecao('Valores por pacote', 'Vagas livres × valor do pacote + alunos ocupando vaga pelo valor individual.')}
        <div class="p-4 space-y-4">
          ${c.pacotes.length ? `
          <table class="w-full text-xs table-fixed">
            <thead class="text-left text-xs font-medium text-slate-500 dark:text-neutral-400"><tr><th class="py-1 pr-2">Pacote</th><th class="py-1 px-2 text-right w-14">Vagas</th><th class="py-1 px-2 text-right w-24">Valor</th><th class="py-1 pl-2 text-right w-24">Subtotal</th></tr></thead>
            <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">${t.porPacote.map(linhaPacote).join('')}</tbody>
          </table>` : '<p class="text-sm text-slate-400">Nenhum pacote ainda.</p>'}
          <div class="grid grid-cols-2 gap-4">
            ${campo('Total base', `<span class="tabular-nums">${moeda(t.base)}</span>`)}
            ${campo('Desconto', `<span class="tabular-nums ${t.desconto > 0 ? 'text-emerald-700 dark:text-emerald-400' : ''}">${t.desconto > 0 ? `− ${moeda(t.desconto)} (${Math.round(t.desconto / t.base * 100)}%)` : '—'}</span>`)}
            ${campo('Total final', `<span class="font-display text-xl font-semibold tabular-nums">${moeda(t.final)}</span>`, 'col-span-2')}
            ${c.parcelas.length ? campo('Cobrança', `${c.cobranca.parcelas}× de ${moeda(c.parcelas[0]?.valor)} · ${esc(nomeDe(FORMAS_COBRANCA, c.cobranca.forma))} · 1º venc. ${esc(Contratos.fmtData(c.cobranca.primeiroVencimento))}<br><span class="text-xs text-slate-500 dark:text-neutral-400">Pago ${moeda(t.pago)} · em aberto ${moeda(t.aberto)}</span>`, 'col-span-2') : campo('Cobrança', vazio('', 'parcelas ainda não definidas'), 'col-span-2')}
          </div>
        </div>
      </section>
      <section class="${CARTAO}">
        ${cabecalhoSecao('Andamento', 'Fluxo comercial → administrativo.')}
        <div class="p-4">
          <ol class="space-y-2 text-sm">${STATUS_CONTRATO.filter((s) => !s.terminal).map(etapa).join('')}</ol>
          <dl class="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div><dt class="text-slate-500 dark:text-neutral-400">Documento</dt><dd class="text-slate-800 dark:text-neutral-100">${c.documento ? `v${c.documento.versao} · ${esc(Contratos.fmtData(c.documento.geradoEm))}` : '—'}</dd></div>
            <div><dt class="text-slate-500 dark:text-neutral-400">Conferência de alunos</dt><dd class="${t.nAguardando ? 'text-amber-700 dark:text-amber-300' : 'text-slate-800 dark:text-neutral-100'}">${t.nAguardando ? `${t.nAguardando} aguardando · ` : ''}${t.aprovados} aprovado${t.aprovados === 1 ? '' : 's'}${t.nAguardando ? ` — <button type="button" data-ir-pacotes class="underline">conferir</button>` : ''}</dd></div>
            <div><dt class="text-slate-500 dark:text-neutral-400">Assinatura · contratante</dt><dd class="text-slate-800 dark:text-neutral-100">${assinaturaHtml(PARTES_ASSINATURA[0])}</dd></div>
            <div><dt class="text-slate-500 dark:text-neutral-400">Assinatura · ProWay</dt><dd class="text-slate-800 dark:text-neutral-100">${assinaturaHtml(PARTES_ASSINATURA[1])}</dd></div>
            ${Contratos.envelopePendente(c) && !Contratos.assinado(c) ? `<div class="col-span-2 text-amber-700 dark:text-amber-300">${Contratos.envelopePendente(c).status === 'recusado' ? 'Envelope recusado no Clicksign — envie um novo.' : `Clicksign: aguardando ${esc(Contratos.signatariosPendentes(Contratos.envelopePendente(c)).map((x) => x.nome).join(', '))}.`}</div>` : ''}
            <div><dt class="text-slate-500 dark:text-neutral-400">1ª parcela</dt><dd class="text-slate-800 dark:text-neutral-100">${c.parcelas[0] ? `${esc(nomeDe(STATUS_PARCELA, c.parcelas[0].status))}${c.parcelas[0].pagoEm ? ` em ${esc(Contratos.fmtData(c.parcelas[0].pagoEm))}` : ''}` : '—'}</dd></div>
            <div><dt class="text-slate-500 dark:text-neutral-400">Nota fiscal</dt><dd class="text-slate-800 dark:text-neutral-100">${c.nf ? `${esc(c.nf.numero)} · ${esc(Contratos.fmtData(c.nf.emitidaEm))}` : '—'}</dd></div>
          </dl>
          ${c.observacoes ? `<p class="mt-4 text-xs text-slate-500 dark:text-neutral-400 whitespace-pre-line"><span class="font-medium">Obs.</span> ${esc(c.observacoes)}</p>` : ''}
        </div>
      </section>
      ${c.cancelamento?.rescisao ? `<section class="${CARTAO} xl:col-span-2">${cabecalhoSecao('Rescisão', `Pedido em ${esc(Contratos.fmtData(c.cancelamento.rescisao.data))} · 1/3 por ${esc(nomeDe(Contratos.CRITERIOS_TERCO, c.cancelamento.rescisao.criterio)).toLowerCase()} · ${c.cancelamento.rescisao.perdeDesconto ? 'valor base (desconto perdeu eficácia)' : 'valor com desconto'}${c.cancelamento.rescisao.arrependimento ? ' · arrependimento em 7 dias' : ''} · destino: ${esc(nomeDe(Contratos.DESTINOS_SALDO, c.cancelamento.rescisao.destino))}`)}<div class="p-4">${memoriaRescisaoHtml(c, c.cancelamento.rescisao)}</div></section>` : ''}
    </div>`;
  document.getElementById('btn-definir-contratante')?.addEventListener('click', abrirModalContratante);
  document.getElementById('btn-trocar-contratante')?.addEventListener('click', abrirModalContratante);
  document.getElementById('btn-link-empresa')?.addEventListener('click', abrirModalCadastroEmpresa);
  document.querySelector('[data-ir-pacotes]')?.addEventListener('click', () => abrir(c.id, 'pacotes'));
}

// ---- Pacotes e alunos ----
// Um cartão por pacote: molde (itens × vagas), alunos que ocupam vaga (com os itens
// individuais expandíveis), vagas livres tracejadas e o acordeão de recusados.

const NOME_TURMA = (turmaId) => { const tu = Contratos.turmaDe(turmaId); return tu ? `${tu.codigo} · ${Contratos.fmtData(tu.inicio)} a ${Contratos.fmtData(tu.fim)}` : ''; };

// Contrato com mais de um pacote abre com todos recolhidos — só o cabeçalho de cada um.
function sincronizarRecolhidos(c) {
  if (estado.pacotesInit === c.id) return;
  estado.pacotesInit = c.id;
  estado.pacotesRecolhidos = new Set(c.pacotes.length > 1 ? c.pacotes.map((p) => p.id) : []);
}

// Pacotes criados depois (novo/duplicado) nascem abertos: não entram no conjunto acima.
function expandirPacotesAguardando(c) {
  sincronizarRecolhidos(c);
  c.pacotes.forEach((p) => { if (Contratos.vagasDoPacote(c, p).aguardando) estado.pacotesRecolhidos.delete(p.id); });
}

function renderPacotes() {
  const c = atual();
  sincronizarRecolhidos(c);
  const t = Contratos.totais(c);
  const editavel = Contratos.editavel(c);
  const emp = Contratos.empresaDe(ctx(), c);
  const ativo = c.status !== 'cancelado';
  const todosRecolhidos = c.pacotes.length > 0 && c.pacotes.every((p) => estado.pacotesRecolhidos.has(p.id));
  document.getElementById('acoes-aba').innerHTML = ativo ? `
    <button type="button" id="btn-add-pacote" class="${BOTAO_PRI}" ${editavel ? '' : 'disabled'} title="${editavel ? 'Formação ou cursos avulsos, com um número de vagas' : 'Só em rascunho — reabra a venda para incluir pacotes'}">${ICONE.mais} Pacote</button>
    <button type="button" id="btn-desconto" class="${BOTAO_SEC}" ${editavel && c.pacotes.length ? '' : 'disabled'} title="${editavel ? 'Percentual sobre o valor base de todos os pacotes e dos alunos sem ajustes' : 'Só em rascunho'}">Desconto geral</button>
    <button type="button" id="btn-novo-aluno" class="${BOTAO_SEC}" title="Cadastra aqui mesmo, sem sair da venda — depois é só colocá-lo numa vaga">${ICONE.mais} ${emp ? `Cadastrar novo aluno na ${esc(Contratos.nomeEmpresa(emp))}` : 'Cadastrar novo aluno'}</button>
    ${c.pacotes.length > 1 ? `<button type="button" id="btn-recolher-pacotes" class="${BOTAO_SEC}" title="${todosRecolhidos ? 'Abrir o molde e os alunos de todos os pacotes' : 'Deixar só os cabeçalhos dos pacotes'}">${todosRecolhidos ? 'Expandir todos' : 'Recolher todos'}</button>` : ''}
    ${!editavel ? `<span class="text-xs text-slate-600 dark:text-neutral-400">Moldes e valores travam depois de gerar o documento (vagas só aumentam; turmas mudam)${Contratos.podeReabrir(c) ? ' — <button type="button" id="btn-reabrir" class="text-petrol-800 dark:text-sky-300 hover:underline">reabrir para edição</button>' : '.'}</span>` : ''}` : '';

  // Itens (matrículas) de um aluno — linhas como na versão anterior, dentro do cartão do pacote.
  const linhaItem = (it, grupo) => {
    const turmas = Cursos.turmasDoCurso(it.cursoId);
    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-neutral-900 transition ${it.status === 'desistiu' || it.status === 'cancelada' ? 'linha-apagada' : ''}">
        <td class="${TD} pl-10">${esc(Contratos.rotuloItem(ctx(), it))}${!it.turmaId ? ` ${pilula(PILULA.ambar, 'turma a definir', turmas.length ? `${turmas.length} turma(s) disponível(is)` : 'Sem turma cadastrada para este curso')}` : ''}</td>
        <td class="${TH}">${editavel
          ? '<span class="text-slate-400" title="Em rascunho ninguém está cursando ainda: a matrícula começa quando a venda for fechada.">—</span>'
          : pilula(PILULA_MATRICULA[it.status], nomeDe(STATUS_MATRICULA, it.status), STATUS_MATRICULA.find((s) => s.id === it.status)?.descricao ?? '')}${(it.status === 'desistiu' || it.status === 'cancelada') && it.cancelamento ? `<span class="block text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5" title="${esc(it.cancelamento.texto ?? '')}">${esc(Contratos.motivoCancelamentoDe(it.cancelamento.tipo))}${it.cancelamento.em ? ` · ${Contratos.fmtData(it.cancelamento.em.slice(0, 10))}` : ''}</span>` : ''}${it.status === 'congelada' && it.congelamento ? `<span class="block text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5" title="${esc(it.congelamento.texto ?? '')}">desde ${esc(Contratos.fmtData(it.congelamento.em))}${it.congelamento.texto ? ` · ${esc(it.congelamento.texto)}` : ''}</span>` : ''}</td>
        <td class="${TD_VALOR} text-slate-400">${moeda(it.valorBase)}</td>
        <td class="${TD_VALOR} font-medium text-slate-800 dark:text-neutral-100">${moeda(it.valorFinal)}${it.valorFinal < it.valorBase ? `<br><span class="text-[11px] text-emerald-700 dark:text-emerald-400">−${Math.round((1 - it.valorFinal / it.valorBase) * 100)}%</span>` : ''}</td>
        <td class="${TH} text-right whitespace-nowrap">
          ${ativo ? `<button type="button" data-editar-item="${it.id}" class="${ICONE_BOTAO}" title="${editavel ? 'Turma e valores' : 'Definir turma'}">${ICONE.lapis}</button>` : ''}
          ${editavel && !grupo.formacaoId ? `<button type="button" data-remover-item="${it.id}" class="${ICONE_BOTAO_VERMELHO}" title="Remover curso deste aluno">${ICONE.lixeira}</button>` : ''}
        </td>
      </tr>`;
  };
  const linhaGrupo = (g, alunoId) => `
      <tr class="bg-slate-50/60 dark:bg-neutral-900/60">
        <td class="${TD} pl-6 font-medium text-slate-800 dark:text-neutral-100">${g.formacao ? `${pilula(PILULA.petrol, 'Formação')} ${esc(g.formacao.codigo)} · ${esc(g.formacao.nome)}` : `${pilula(PILULA.neutra, 'Avulsos')} ${plural(g.itens.length, 'curso avulso', 'cursos avulsos')}`}${g.formacaoId && !g.formacao ? ' <span class="text-slate-400">(formação removida)</span>' : ''}</td>
        <td class="${TD} text-xs text-slate-500 dark:text-neutral-400">${g.ativos}/${g.itens.length} ativas</td>
        <td class="${TD_VALOR} text-slate-400">${moeda(g.base)}</td>
        <td class="${TD_VALOR} font-medium">${moeda(g.final)}</td>
        <td class="${TH} text-right whitespace-nowrap">${editavel && g.formacaoId ? `<button type="button" data-remover-formacao="${alunoId}:${g.formacaoId}" class="${ICONE_BOTAO_VERMELHO}" title="Remover a formação inteira deste aluno">${ICONE.lixeira}</button>` : ''}</td>
      </tr>`;

  const blocoItensAluno = (v, p) => {
    const grupos = Contratos.gruposDoAluno(ctx(), c, v.alunoId);
    const outros = Contratos.vinculosDoPacote(c, p.id).filter((x) => x.alunoId !== v.alunoId && Contratos.ocupaVaga(x) && x.itens.some(Contratos.matriculaAtiva));
    return `
      <div class="border-t border-dashed border-slate-200 dark:border-neutral-800 bg-slate-50/40 dark:bg-neutral-900/40">
        <div class="px-4 py-2 flex flex-wrap items-center gap-2">
          <span class="${ROTULO_MINI}">Itens de ${esc(alunoDe(v.alunoId)?.nomeSocial || alunoDe(v.alunoId)?.nome || v.alunoId)}</span>
          <span class="text-xs text-slate-400">— cópia do molde; ajustes valem só para este aluno.</span>
          <div class="ml-auto flex flex-wrap items-center gap-1.5">
            ${editavel ? `
              <button type="button" data-add-formacao="${v.alunoId}" class="${BOTAO_MINI}">${ICONE.mais} Formação</button>
              <button type="button" data-add-cursos="${v.alunoId}" class="${BOTAO_MINI}">${ICONE.mais} Cursos avulsos</button>
              ${outros.length ? `<button type="button" data-copiar="${v.alunoId}" class="${BOTAO_MINI}" title="Copiar os itens de outro aluno deste pacote">Copiar de…</button>` : ''}
              ${v.itens.length ? `<button type="button" data-desconto-aluno="${v.alunoId}" class="${BOTAO_MINI}" title="Desconto só nos itens deste aluno">% Desconto</button>` : ''}` : ''}
            ${ativo && v.ajustado ? `<button type="button" data-restaurar="${v.alunoId}" class="${BOTAO_MINI}" title="Desfaz os ajustes e copia de novo o molde do pacote">Voltar ao molde</button>` : ''}
          </div>
        </div>
        ${grupos.length ? `
        <table class="w-full text-left">
          <thead class="text-xs font-medium text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 border-y border-slate-200 dark:border-neutral-800">
            <tr><th class="${TH} pl-6">Item</th><th class="${TH}">Matrícula</th><th class="${TH} text-right">Valor base</th><th class="${TH} text-right">Valor final</th><th class="${TH}"></th></tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">${grupos.map((g) => linhaGrupo(g, v.alunoId) + g.itens.map((it) => linhaItem(it, g)).join('')).join('')}</tbody>
        </table>` : `<div class="px-4 pb-3 text-sm text-slate-500 dark:text-neutral-400">Nenhum item para este aluno${editavel ? ' — adicione uma formação ou cursos avulsos, ou volte ao molde.' : '.'}</div>`}
      </div>`;
  };

  const linhaVinculo = (v, p, primeiroAguardando) => {
    const a = alunoDe(v.alunoId);
    const pa = t.porAluno.find((x) => x.alunoId === v.alunoId) ?? { base: 0, final: 0 };
    const pend = a ? Clientes.pendenciasAluno(a, ctx().empresas) : [];
    const dif = v.ajustado ? Contratos.diferencasDoMolde(ctx(), c, v) : [];
    const expandido = estado.expandidos.has(v.alunoId);
    const aguard = v.situacao === 'aguardando';
    const desist = v.situacao === 'desistente';
    const congeladas = Contratos.itensCongelados(v);
    const responsavel = c.contratante === 'particular' && c.responsavel?.tipo === 'aluno' && c.responsavel.id === v.alunoId;
    return `
      <li class="${desist ? 'linha-apagada' : ''}" ${aguard && primeiroAguardando ? 'data-aguardando-primeiro' : ''}>
        <div class="px-4 py-2.5 flex flex-wrap items-center gap-3 ${aguard ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''}">
          <div class="h-9 w-9 shrink-0 rounded-full ${aguard ? 'bg-amber-500' : 'bg-petrol-800'} text-white grid place-items-center text-xs font-semibold">${esc(iniciais(a?.nome ?? '?'))}</div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-slate-800 dark:text-neutral-100 flex flex-wrap items-center gap-1.5">${a ? linkCliente('aluno', a.id, a.nomeSocial || a.nome) : '<span class="text-slate-400">aluno removido</span>'}
              ${aguard ? pilula(PILULA.ambar, 'Aguardando conferência', `Entrou pelo link em ${Contratos.fmtDataHora(v.entrouEm)}`) : ''}
              ${desist ? pilula(PILULA.neutra, 'Desistente', 'Saiu depois do documento; a vaga foi liberada') : ''}
              ${congeladas.length ? pilula(PILULA.violeta, congeladas.length === v.itens.length ? 'Matrícula congelada' : `${congeladas.length} de ${v.itens.length} congeladas`, `Pausada desde ${Contratos.fmtData(congeladas[0].congelamento?.em ?? '')}${congeladas[0].congelamento?.texto ? ` · ${congeladas[0].congelamento.texto}` : ''} — fora das aulas e das contas de frequência, mas ocupando a vaga`) : ''}
              ${v.ajustado ? pilula(PILULA.neutra, 'difere do pacote', dif.join(' · ') || 'Itens diferentes do molde') : ''}
              ${responsavel ? pilula(PILULA.laranja, 'Responsável financeiro') : ''}
              ${a && Clientes.menorDeIdade(a.nascimento) ? pilula(PILULA.ambar, 'Menor') : ''}
              ${pend.length ? `<span title="${esc(pend.join(' · '))}" class="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">${ICONE.alerta} ${plural(pend.length, 'pendência')}</span>` : ''}
            </p>
            <p class="text-xs text-slate-500 dark:text-neutral-400"><span class="font-mono">Matrícula ${esc(v.codigo)}</span>${a ? ` · <span class="font-mono">${esc(Clientes.fmtCpf(a.cpf))}</span>` : ''} · ${esc(nomeDe(ORIGENS_VINCULO, v.origem).toLowerCase())} em ${esc(Contratos.fmtData(v.entrouEm))}${v.conferidoEm && v.situacao === 'aprovado' && v.origem === 'link' ? ` · aprovado em ${esc(Contratos.fmtData(v.conferidoEm))}` : ''}</p>
          </div>
          <div class="text-right"><p class="${ROTULO_MINI}">Valor do aluno</p><p class="font-display text-base font-semibold tabular-nums text-slate-900 dark:text-neutral-100">${moeda(pa.final)}${pa.base > pa.final ? ` <span class="text-xs font-normal text-slate-400 line-through">${moeda(pa.base)}</span>` : ''}</p></div>
          <div class="flex flex-wrap items-center gap-1.5">
            ${aguard && ativo ? `<button type="button" data-aprovar="${v.alunoId}" class="${BOTAO_SEC} h-8 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:border-emerald-600 hover:text-emerald-900 dark:hover:text-emerald-200">${ICONE.checkMini} Aprovar</button><button type="button" data-recusar-aluno="${v.alunoId}" class="${BOTAO_SEC} h-8 hover:border-red-500 hover:text-red-700 dark:hover:border-red-500 dark:hover:text-red-400">Recusar</button>` : ''}
            <button type="button" data-itens="${v.alunoId}" class="${BOTAO_SEC} h-8" aria-expanded="${expandido}">${expandido ? 'Ocultar itens' : `${ativo ? 'Ver/editar' : 'Ver'} itens (${v.itens.length})`}</button>
            ${!aguard && !desist && Contratos.podeRetomar(c, v.alunoId) ? `<button type="button" data-retomar="${v.alunoId}" class="${BOTAO_SEC} h-8" title="Volta às aulas e às contas de frequência">Retomar matrícula</button>` : ''}
            ${!aguard && !desist && Contratos.podeCongelar(c, v.alunoId) ? `<button type="button" data-congelar="${v.alunoId}" class="${BOTAO_SEC} h-8" title="Pausa a matrícula: sai das aulas e das contas de frequência, mas segue ocupando a vaga">Congelar matrícula</button>` : ''}
            ${ativo && !desist ? `<button type="button" data-remover-aluno="${v.alunoId}" class="${ICONE_BOTAO_VERMELHO}" title="${editavel || aguard ? 'Remover da venda (libera a vaga)' : 'Marcar como desistente (libera a vaga)'}">${ICONE.lixeira}</button>` : ''}
          </div>
        </div>
        ${expandido ? blocoItensAluno(v, p) : ''}
      </li>`;
  };

  const linhaVagaLivre = (p, vp) => `
      <li class="px-4 py-2.5 flex items-center gap-3">
        <div class="h-9 w-9 shrink-0 rounded-full border-2 border-dashed border-slate-300 dark:border-neutral-700 text-slate-400 grid place-items-center text-sm">+</div>
        <p class="flex-1 text-sm text-slate-500 dark:text-neutral-400 border-b border-dashed border-slate-300 dark:border-neutral-700 pb-0.5">Vaga livre — entra pelo link ou por <button type="button" data-add-alunos="${p.id}" class="text-petrol-800 dark:text-sky-300 hover:underline">Adicionar alunos</button></p>
        <span class="text-sm tabular-nums text-slate-400" title="Vaga vazia é cobrada pelo valor do pacote">${moeda(vp)}</span>
      </li>`;

  const linhaMolde = (it) => {
    const curso = Contratos.cursoDe(ctx(), it.cursoId);
    const turma = Contratos.turmaDe(it.turmaId);
    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-neutral-900 transition">
        <td class="${TD} pl-6">${esc(curso ? `${curso.codigo} · ${curso.nome}` : 'Curso removido')}${it.formacaoId ? ` <span class="text-xs text-slate-400">· ${esc(Contratos.formacaoDe(ctx(), it.formacaoId)?.nome ?? 'formação')}</span>` : ''}</td>
        <td class="${TD}">${turma ? `<span class="text-xs">${esc(NOME_TURMA(it.turmaId))}</span>` : pilula(PILULA.ambar, 'turma a definir', 'Defina em Editar pacote (vale para as vagas livres e novos alunos) ou item a item no aluno')}</td>
        <td class="${TD_VALOR} text-slate-400">${moeda(it.valorBase)}${it.avisoTabela ? `<br>${pilula(PILULA.ambar, 'tabela mudou', `era ${moeda(it.avisoTabela.original)}, hoje ${moeda(it.avisoTabela.atual)}`)}` : ''}</td>
        <td class="${TD_VALOR} font-medium text-slate-800 dark:text-neutral-100">${moeda(it.valorFinal)}${it.valorFinal < it.valorBase ? `<br><span class="text-[11px] text-emerald-700 dark:text-emerald-400">−${Math.round((1 - it.valorFinal / it.valorBase) * 100)}%</span>` : ''}</td>
      </tr>`;
  };

  const cartaoPacote = (p) => {
    const recolhido = estado.pacotesRecolhidos.has(p.id);
    const vg = Contratos.vagasDoPacote(c, p);
    const vp = Contratos.valorPacote(p); const bp = Contratos.valorBasePacote(p);
    const vinculos = Contratos.vinculosDoPacote(c, p.id).filter((v) => v.situacao !== 'recusado');
    const recusados = Contratos.recusadosDoPacote(c, p.id);
    const temVinculos = vinculos.length + recusados.length > 0;
    const sitLink = Contratos.situacaoConvite(c, p);
    const pct = vg.vagas ? Math.min(100, Math.round(vg.ocupadas / vg.vagas * 100)) : 0;
    const pp = t.porPacote.find((x) => x.pacoteId === p.id);
    let marcouAguardando = false;
    const linhas = vinculos.map((v) => { const primeiro = v.situacao === 'aguardando' && !marcouAguardando; if (primeiro) marcouAguardando = true; return linhaVinculo(v, p, primeiro); }).join('') + Array.from({ length: vg.livres }, () => linhaVagaLivre(p, vp)).join('');
    return `
    <section class="${CARTAO} overflow-hidden ${recolhido ? 'cursor-pointer hover:border-slate-300 dark:hover:border-neutral-700' : ''}" data-pacote="${p.id}">
      <div class="px-4 pt-4 pb-3 flex flex-wrap items-start justify-between gap-3 cursor-pointer" data-cab-pacote="${p.id}">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="font-display text-[15px] font-semibold text-slate-900 dark:text-neutral-100">
              <button type="button" data-toggle-pacote="${p.id}" aria-expanded="${!recolhido}" class="-ml-1 flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-slate-100 dark:hover:bg-neutral-800 transition" title="${recolhido ? 'Mostrar o molde e os alunos' : 'Recolher: deixar só o cabeçalho'}">
                <svg class="h-4 w-4 shrink-0 text-slate-400 transition ${recolhido ? '' : 'rotate-90'}" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                ${esc(p.nome)}
              </button>
            </h3>
            ${pilula(p.formacaoId ? PILULA.petrol : PILULA.neutra, p.formacaoId ? 'Formação' : 'Avulsos', p.formacaoId ? 'Cursos da formação com o preço rateado por carga horária' : 'Cursos avulsos, cada um com seu preço')}
            ${vg.aguardando ? pilula(PILULA.ambar, `${vg.aguardando} aguardando`, 'Alunos que entraram pelo link e aguardam conferência') : ''}
            ${sitLink === 'aberto' ? pilula(PILULA.verde, 'link aberto', `${p.convite.usos.length} entraram · ${vg.livres} vagas livres`) : ''}
          </div>
          <div class="mt-2 flex flex-wrap items-end gap-5">
            <div><p class="${ROTULO_MINI}">Valor do pacote</p><p class="font-display text-lg font-semibold tabular-nums text-slate-900 dark:text-neutral-100">${moeda(vp)}${bp > vp ? ` <span class="text-xs font-normal text-slate-400 line-through">${moeda(bp)}</span>` : ''}</p></div>
            <div class="min-w-48"><p class="${ROTULO_MINI}">Vagas</p><p class="text-sm tabular-nums text-slate-800 dark:text-neutral-100"><strong>${vg.ocupadas}/${vg.vagas}</strong> ocupadas · ${vg.livres} livre${vg.livres === 1 ? '' : 's'}</p><div class="mt-1 h-1.5 rounded-full bg-slate-200 dark:bg-neutral-800 overflow-hidden" title="${vg.aprovados} aprovados · ${vg.aguardando} aguardando"><div class="h-full ${vg.livres ? 'bg-petrol-800 dark:bg-sky-500' : 'bg-emerald-600 dark:bg-emerald-500'}" style="width:${pct}%"></div></div></div>
            <div><p class="${ROTULO_MINI}">Subtotal</p><p class="text-sm tabular-nums text-slate-800 dark:text-neutral-100">${moeda(pp?.final ?? 0)}</p></div>
          </div>
        </div>
        ${ativo ? `
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" data-editar-pacote="${p.id}" class="${BOTAO_SEC}">${ICONE.lapis} Editar pacote</button>
          <button type="button" data-link-pacote="${p.id}" class="${BOTAO_SEC}" title="Link reutilizável: cada aluno preenche o próprio cadastro e entra neste pacote aguardando conferência">${ICONE.externo} Link do pacote</button>
          <button type="button" data-add-alunos="${p.id}" class="${BOTAO_PRI}">${ICONE.mais} Adicionar alunos</button>
          ${editavel ? `<button type="button" data-desconto-pacote="${p.id}" class="${BOTAO_SEC}" title="Desconto sobre o molde e os alunos sem ajustes deste pacote">% Desconto</button>` : ''}
          ${editavel ? `<button type="button" data-duplicar-pacote="${p.id}" class="${BOTAO_SEC}" title="Mesmo molde e vagas, sem alunos nem link">Duplicar pacote</button>` : ''}
          <button type="button" data-remover-pacote="${p.id}" class="${ICONE_BOTAO_VERMELHO}" ${Contratos.podeRemoverPacote(c, p.id) ? '' : 'disabled'} title="${!editavel ? 'Só em rascunho' : temVinculos ? 'Há alunos vinculados a este pacote (inclusive recusados) — remova-os antes' : 'Remover pacote'}">${ICONE.lixeira}</button>
        </div>` : ''}
      </div>
      ${recolhido ? `<p class="px-4 py-2 text-xs text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 border-t border-slate-200 dark:border-neutral-800">${plural(p.itens.length, 'curso no molde', 'cursos no molde')} · ${plural(vinculos.length, 'aluno')}${recusados.length ? ` · ${plural(recusados.length, 'recusado')}` : ''} — <button type="button" data-toggle-pacote="${p.id}" class="text-petrol-800 dark:text-sky-300 hover:underline">mostrar</button></p>` : `
      <table class="w-full text-left">
        <thead class="text-xs font-medium text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800">
          <tr><th class="${TH} pl-6">Molde do pacote</th><th class="${TH}">Turma</th><th class="${TH} text-right">Valor base</th><th class="${TH} text-right">Valor final</th></tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">${p.itens.length ? p.itens.map(linhaMolde).join('') : `<tr><td colspan="4" class="${TD} pl-6 text-slate-400">Pacote sem itens.</td></tr>`}</tbody>
      </table>
      <div class="border-t border-slate-200 dark:border-neutral-800">
        <p class="px-4 py-2 bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 ${ROTULO_MINI}">Alunos do pacote <span class="normal-case font-normal tracking-normal text-slate-400">· ${plural(vg.ocupadas, 'vaga ocupada', 'vagas ocupadas')}${vg.desistentes ? ` · ${plural(vg.desistentes, 'desistente')}` : ''}</span></p>
        <ul class="divide-y divide-slate-100 dark:divide-neutral-900">${linhas || `<li class="px-4 py-4 text-sm text-slate-500 dark:text-neutral-400">Sem vagas e sem alunos — edite o pacote para definir as vagas.</li>`}</ul>
        ${recusados.length ? `
        <details class="group border-t border-slate-200 dark:border-neutral-800">
          <summary class="cursor-pointer list-none px-4 py-2 flex items-center gap-2 text-xs text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-900/60">
            <svg class="h-3.5 w-3.5 text-slate-400 transition group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            <span class="font-semibold">Recusados (${recusados.length})</span><span class="text-slate-400">— não ocupam vaga; o cadastro continua em Clientes</span>
          </summary>
          <ul class="divide-y divide-slate-100 dark:divide-neutral-900 border-t border-slate-100 dark:border-neutral-900">
            ${recusados.map((v) => { const a = alunoDe(v.alunoId); return `
            <li class="px-4 py-2 flex flex-wrap items-center gap-3 text-sm">
              <span class="font-medium text-slate-700 dark:text-neutral-200">${a ? linkCliente('aluno', a.id, a.nomeSocial || a.nome) : '<span class="text-slate-400">aluno removido</span>'}</span>
              <span class="text-xs text-slate-400 whitespace-nowrap">recusado em ${esc(Contratos.fmtDataHora(v.recusa?.em ?? v.conferidoEm))}</span>
              <span class="flex-1 text-xs text-slate-500 dark:text-neutral-400 italic">${esc(v.recusa?.motivo ?? '')}</span>
              ${ativo ? `<button type="button" data-revincular="${p.id}:${v.alunoId}" class="${BOTAO_MINI}">Vincular de novo</button>` : ''}
            </li>`; }).join('')}
          </ul>
        </details>` : ''}
      </div>
`}
    </section>`;
  };

  document.getElementById('conteudo-aba').innerHTML = `
    <p class="text-sm text-slate-600 dark:text-neutral-400 mb-3">${emp ? `Colaboradores de <strong>${esc(Contratos.nomeEmpresa(emp))}</strong> entram nos pacotes desta venda.` : c.contratante === 'particular' ? 'Alunos particulares desta venda; o responsável financeiro definido no contratante paga por todos.' : 'Os alunos podem ser vinculados antes de definir o contratante.'} Cada pacote é um molde (formação ou cursos avulsos × vagas); o aluno entra em um pacote com uma cópia dos itens, ajustável só para ele. Vaga vazia é cobrada.</p>
    <div class="space-y-4">${c.pacotes.length ? c.pacotes.map(cartaoPacote).join('') : `<div class="${CARTAO} px-4 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">Nenhum pacote ainda${editavel ? ' — use "+ Pacote".' : '.'}</div>`}</div>
    ${c.pacotes.length ? `<div class="mt-4 ${CARTAO} px-4 py-2.5 text-sm text-slate-700 dark:text-neutral-200 tabular-nums flex flex-wrap items-center justify-between gap-2"><span>${plural(t.nPacotes, 'pacote')} · ${plural(t.vagas, 'vaga')} · ${t.ocupadas} ocupada${t.ocupadas === 1 ? '' : 's'}${t.aguardando ? ` (${t.aguardando} aguardando)` : ''} · ${t.livres} livre${t.livres === 1 ? '' : 's'}</span><span>Base ${t.desconto > 0 ? `<span class="line-through text-slate-400">${moeda(t.base)}</span> · desconto − ${moeda(t.desconto)}` : moeda(t.base)} · <strong>Total final ${moeda(t.final)}</strong></span></div>` : ''}`;

  const reg = (fn) => { alterar((l) => Contratos.regerarParcelas(fn(l), c.id)); };
  const dado = (b, k) => b.dataset[k];
  document.getElementById('btn-add-pacote')?.addEventListener('click', abrirModalPacote);
  document.getElementById('btn-recolher-pacotes')?.addEventListener('click', () => { estado.pacotesRecolhidos = new Set(todosRecolhidos ? [] : c.pacotes.map((p) => p.id)); renderPacotes(); });
  const alternarPacote = (id) => { estado.pacotesRecolhidos.has(id) ? estado.pacotesRecolhidos.delete(id) : estado.pacotesRecolhidos.add(id); renderPacotes(); };
  document.querySelectorAll('[data-toggle-pacote]').forEach((b) => b.addEventListener('click', () => alternarPacote(dado(b, 'togglePacote'))));
  // Clicar no cartão recolhido abre; com ele aberto, só o cabeçalho fecha. Botões, links e seleção de texto passam batido.
  document.querySelectorAll('section[data-pacote]').forEach((el) => el.addEventListener('click', (e) => {
    if (e.target.closest('button, a, input, label, summary')) return;
    if (window.getSelection()?.toString()) return;
    const id = dado(el, 'pacote');
    if (estado.pacotesRecolhidos.has(id)) { estado.pacotesRecolhidos.delete(id); renderPacotes(); }
    else if (e.target.closest('[data-cab-pacote]')) { estado.pacotesRecolhidos.add(id); renderPacotes(); }
  }));
  document.getElementById('btn-novo-aluno')?.addEventListener('click', () => abrirModalAlunoNovo());
  document.getElementById('btn-desconto')?.addEventListener('click', () => abrirDrawerDesconto({}));
  document.getElementById('btn-reabrir')?.addEventListener('click', () => { alterar((l) => Contratos.reabrir(l, c.id)); toast('Venda reaberta como rascunho.'); renderContrato(); });
  document.querySelectorAll('[data-editar-pacote]').forEach((b) => b.addEventListener('click', () => abrirDrawerPacote(dado(b, 'editarPacote'))));
  document.querySelectorAll('[data-link-pacote]').forEach((b) => b.addEventListener('click', () => abrirModalLinkPacote(dado(b, 'linkPacote'))));
  document.querySelectorAll('[data-add-alunos]').forEach((b) => b.addEventListener('click', () => abrirSeletorAlunos(dado(b, 'addAlunos'))));
  document.querySelectorAll('[data-desconto-pacote]').forEach((b) => b.addEventListener('click', () => abrirDrawerDesconto({ pacoteId: dado(b, 'descontoPacote') })));
  document.querySelectorAll('[data-duplicar-pacote]').forEach((b) => b.addEventListener('click', () => { reg((l) => Contratos.duplicarPacote(l, c.id, dado(b, 'duplicarPacote'))); toast('Pacote duplicado.'); renderContrato(); }));
  document.querySelectorAll('[data-remover-pacote]').forEach((b) => b.addEventListener('click', () => { reg((l) => Contratos.removerPacote(l, c.id, dado(b, 'removerPacote'))); toast('Pacote removido.'); renderContrato(); }));
  document.querySelectorAll('[data-aprovar]').forEach((b) => b.addEventListener('click', () => { reg((l) => Contratos.aprovarAluno(l, c.id, dado(b, 'aprovar'))); toast('Aluno aprovado.'); renderContrato(); }));
  document.querySelectorAll('[data-recusar-aluno]').forEach((b) => b.addEventListener('click', () => confirmarRecusaAluno(dado(b, 'recusarAluno'))));
  document.querySelectorAll('[data-itens]').forEach((b) => b.addEventListener('click', () => { const id = dado(b, 'itens'); estado.expandidos.has(id) ? estado.expandidos.delete(id) : estado.expandidos.add(id); renderPacotes(); }));
  document.querySelectorAll('[data-revincular]').forEach((b) => b.addEventListener('click', () => {
    const [pacoteId, alunoId] = dado(b, 'revincular').split(':');
    const erros = Contratos.validarVinculoAlunos(c, pacoteId, [alunoId]);
    if (erros.length) { toast(erros[0]); return; }
    reg((l) => Contratos.vincularAlunos(l, c.id, pacoteId, [alunoId]));
    sincronizarClientes([alunoId]);
    toast('Aluno vinculado de novo ao pacote.'); renderContrato();
  }));
  document.querySelectorAll('[data-add-formacao]').forEach((b) => b.addEventListener('click', () => abrirSeletorFormacao(dado(b, 'addFormacao'))));
  document.querySelectorAll('[data-add-cursos]').forEach((b) => b.addEventListener('click', () => abrirSeletorCursos(dado(b, 'addCursos'))));
  document.querySelectorAll('[data-copiar]').forEach((b) => b.addEventListener('click', () => abrirDrawerCopiar(dado(b, 'copiar'))));
  document.querySelectorAll('[data-desconto-aluno]').forEach((b) => b.addEventListener('click', () => abrirDrawerDesconto({ alunoId: dado(b, 'descontoAluno') })));
  document.querySelectorAll('[data-restaurar]').forEach((b) => b.addEventListener('click', () => { reg((l) => Contratos.restaurarMolde(l, c.id, dado(b, 'restaurar'))); toast('Itens do aluno voltaram ao molde do pacote.'); renderContrato(); }));
  document.querySelectorAll('[data-editar-item]').forEach((b) => b.addEventListener('click', () => abrirDrawerItem(dado(b, 'editarItem'))));
  document.querySelectorAll('[data-remover-item]').forEach((b) => b.addEventListener('click', () => { reg((l) => Contratos.removerItem(l, c.id, dado(b, 'removerItem'))); toast('Curso removido.'); renderContrato(); }));
  document.querySelectorAll('[data-remover-formacao]').forEach((b) => b.addEventListener('click', () => { const [alunoId, formacaoId] = dado(b, 'removerFormacao').split(':'); reg((l) => Contratos.removerFormacao(l, c.id, alunoId, formacaoId)); toast('Formação removida do aluno.'); renderContrato(); }));
  document.querySelectorAll('[data-congelar]').forEach((b) => b.addEventListener('click', () => confirmarCongelamento(dado(b, 'congelar'))));
  document.querySelectorAll('[data-retomar]').forEach((b) => b.addEventListener('click', () => {
    const alunoId = dado(b, 'retomar');
    reg((l) => Contratos.retomarAluno(l, c.id, alunoId));
    toast(`${alunoDe(alunoId)?.nomeSocial || alunoDe(alunoId)?.nome || 'Aluno'} voltou às aulas.`); renderContrato();
  }));
  document.querySelectorAll('[data-remover-aluno]').forEach((b) => b.addEventListener('click', () => {
    const a = alunoDe(dado(b, 'removerAluno'));
    const v = Contratos.vinculoDe(c, dado(b, 'removerAluno'));
    if (Contratos.editavel(c) || v?.situacao === 'aguardando') { reg((l) => Contratos.removerAluno(l, c.id, v.alunoId)); estado.expandidos.delete(v.alunoId); toast(`${a?.nome ?? 'Aluno'} removido da venda — vaga liberada.`); renderContrato(); }
    else confirmarDesistencia(a ?? { id: v.alunoId, nome: v.alunoId });
  }));
}

// ---- Cobrança ----

const numeroCobranca = (rotulo, valor, sub = '', cor = 'text-slate-900 dark:text-neutral-100') => `
  <div><p class="text-xs font-medium text-slate-500 dark:text-neutral-400">${rotulo}</p><p class="font-display text-lg font-semibold tabular-nums whitespace-nowrap ${cor}">${valor}</p>${sub ? `<p class="text-xs text-slate-500 dark:text-neutral-400">${sub}</p>` : ''}</div>`;

function renderCobranca() {
  const c = atual();
  const t = Contratos.totais(c);
  const pend = Contratos.pendenciasEmissao(ctx(), c);
  const ativo = c.status !== 'cancelado';
  const previstas = c.parcelas.filter((p) => p.status === 'prevista');
  const emp = Contratos.empresaDe(ctx(), c) ?? Contratos.responsavelFinanceiro(ctx(), c).empresa;
  document.getElementById('acoes-aba').innerHTML = ativo ? `
    <button type="button" id="btn-cobranca" class="${BOTAO_SEC}">${ICONE.lapis} ${c.parcelas.length ? 'Condição de pagamento' : 'Definir parcelas'}</button>
    ${c.pacotes.length ? `<button type="button" id="btn-simular-rescisao" class="${BOTAO_SEC}">Simular rescisão</button>` : ''}
    ${previstas.length && c.status !== 'rascunho' ? `<button type="button" id="btn-emitir" class="${BOTAO_PRI}" ${pend.length ? 'disabled' : ''} title="${pend.length ? `Travado: ${esc(pend.join(' · '))}` : ''}">Emitir ${plural(previstas.length, 'boleto')}</button>` : ''}` : '';
  const hoje = Contratos.hoje();
  const atrasos = Contratos.vencidasComEncargos(c, hoje);
  const v = Contratos.resumoVencido(c, hoje);
  const linha = (p) => {
    const vencida = Contratos.parcelaVencida(p, hoje);
    const atraso = atrasos.find((x) => x.parcela.n === p.n);
    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-neutral-900 transition ${vencida ? 'bg-red-50/40 dark:bg-red-950/20' : ''}">
        <td class="${TD} tabular-nums">${p.n}/${c.parcelas.length}</td>
        <td class="${TD} tabular-nums whitespace-nowrap ${vencida ? 'text-red-700 dark:text-red-400 font-medium' : ''}">${esc(Contratos.fmtData(p.vencimento))}</td>
        <td class="${TD_VALOR}">${moeda(p.valor)}</td>
        <td class="${TH}">${pilula(vencida ? PILULA.vermelha : PILULA_PARCELA[p.status], vencida ? 'Vencida' : nomeDe(STATUS_PARCELA, p.status))}</td>
        <td class="${TD} text-xs text-slate-500 dark:text-neutral-400">${p.status === 'paga' ? `paga em ${esc(Contratos.fmtData(p.pagoEm))}${p.valorPago != null && Math.abs(p.valorPago - p.valor) > 0.005 ? ` · ${moeda(p.valorPago)}` : ''}` : atraso ? `<span class="text-red-700 dark:text-red-400">há ${plural(atraso.dias, 'dia')}</span> · + ${moeda(atraso.encargos)} de multa e juros` : p.emitidaEm ? `boleto emitido em ${esc(Contratos.fmtData(p.emitidaEm))}` : '—'}</td>
        <td class="${TH} text-right whitespace-nowrap">
          ${ativo && p.status === 'prevista' && c.status !== 'rascunho' ? `<button type="button" data-emitir="${p.n}" class="${BOTAO_LINK}" ${pend.length ? 'disabled' : ''}>Emitir boleto</button>` : ''}
          ${ativo && p.status === 'emitida' ? `<button type="button" data-pagar="${p.n}" class="${BOTAO_LINK}">Marcar paga</button>` : ''}
          ${ativo && p.status === 'paga' ? `<button type="button" data-estornar="${p.n}" class="${BOTAO_LINK} text-slate-500 dark:text-neutral-400">Estornar</button>` : ''}
        </td>
      </tr>`;
  };
  document.getElementById('conteudo-aba').innerHTML = `
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
      <section class="${CARTAO} p-4 grid grid-cols-2 gap-x-4 gap-y-3">
        ${numeroCobranca('Vencido', moeda(v.valor), v.n ? `${plural(v.n, 'parcela')} · há ${plural(v.dias, 'dia')}${v.encargos ? ` · + ${moeda(v.encargos)} de multa e juros` : ''}` : 'nada em atraso', v.n ? 'text-red-700 dark:text-red-400' : undefined)}
        ${numeroCobranca('A vencer', moeda(Contratos.arred(t.aberto - v.valor)))}
        ${numeroCobranca('Pago', moeda(t.pago))}
        ${numeroCobranca('Total', moeda(t.final))}
      </section>
      <section class="${CARTAO} p-4">
        <p class="text-xs font-medium text-slate-500 dark:text-neutral-400">Condição</p>
        <p class="text-sm text-slate-800 dark:text-neutral-100 mt-1">${c.parcelas.length ? `${c.cobranca.parcelas}× · ${esc(nomeDe(FORMAS_COBRANCA, c.cobranca.forma))} · 1º vencimento ${esc(Contratos.fmtData(c.cobranca.primeiroVencimento))}` : '<span class="text-slate-500 dark:text-neutral-400">não definida</span>'}</p>
        ${emp?.cobranca.exigePedidoCompra ? `<p class="text-xs mt-1 ${c.cobranca.pedidoCompra ? 'text-slate-500 dark:text-neutral-400' : 'text-amber-700 dark:text-amber-300'}">PO: ${c.cobranca.pedidoCompra ? `<span class="font-mono">${esc(c.cobranca.pedidoCompra)}</span>` : 'exigido pela empresa, não informado'}</p>` : ''}
        ${emp && emp.cobranca.diaVencimento ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-1">Empresa prefere vencimento dia ${emp.cobranca.diaVencimento}${emp.cobranca.emailCobranca ? ` · ${esc(emp.cobranca.emailCobranca)}` : ''}</p>` : ''}
        ${pend.length ? `<p class="text-sm text-amber-800 dark:text-amber-300 mt-2">Emissão de boleto e NF travada: ${pend.map(esc).join(' · ')}</p>` : ''}
        ${c.recuperacao ? `<p class="text-xs text-slate-600 dark:text-neutral-300 mt-2"><strong>Recuperação desde ${esc(Contratos.fmtData(c.recuperacao.desde))}:</strong> ${esc(c.recuperacao.acordo || 'sem detalhes')} · <button type="button" id="btn-encerrar-rec" class="text-petrol-800 dark:text-sky-300 hover:underline">encerrar</button></p>` : ''}
      </section>
    </div>
    ${tabela(['Parcela', 'Vencimento', 'R$ Valor', 'Situação', 'Detalhe', ''], c.parcelas.map(linha), c.status === 'rascunho' ? 'Defina a condição de pagamento para gerar as parcelas.' : 'Sem parcelas.')}
    ${c.parcelas.length && Math.abs(c.parcelas.reduce((s, p) => s + (p.status === 'cancelada' ? 0 : p.valor), 0) - t.final) > 0.01 && !Contratos.parcelasTravadas(c) && c.status !== 'cancelado' ? `<p class="mt-3 text-xs text-amber-700 dark:text-amber-300">As parcelas somam ${moeda(c.parcelas.reduce((s, p) => s + p.valor, 0))}, mas a venda vale ${moeda(t.final)}. <button type="button" id="btn-regerar" class="underline">Regerar parcelas</button>.</p>` : ''}`;
  document.getElementById('btn-cobranca')?.addEventListener('click', abrirDrawerCobranca);
  document.getElementById('btn-simular-rescisao')?.addEventListener('click', () => abrirModalRescisao({ somenteSimular: true }));
  document.getElementById('btn-emitir')?.addEventListener('click', confirmarEmissaoBoletos);
  document.getElementById('btn-encerrar-rec')?.addEventListener('click', () => { alterar((l) => Contratos.encerrarRecuperacao(l, c.id)); toast('Recuperação encerrada.'); renderContrato(); });
  document.getElementById('btn-regerar')?.addEventListener('click', () => { alterar((l) => Contratos.regerarParcelas(l, c.id)); toast('Parcelas regeradas.'); renderContrato(); });
  document.querySelectorAll('[data-emitir]').forEach((b) => b.addEventListener('click', () => { alterar((l) => Contratos.emitirBoletos(l, ctx(), c.id, [Number(b.dataset.emitir)])); toast(`Boleto ${b.dataset.emitir}/${c.parcelas.length} emitido.`); renderContrato(); }));
  document.querySelectorAll('[data-pagar]').forEach((b) => b.addEventListener('click', () => abrirDrawerPagamento(c.id, Number(b.dataset.pagar), renderContrato)));
  document.querySelectorAll('[data-estornar]').forEach((b) => b.addEventListener('click', () => { alterar((l) => Contratos.estornarPagamento(l, c.id, Number(b.dataset.estornar))); toast(`Pagamento da parcela ${b.dataset.estornar} estornado.`); renderContrato(); }));
}

// ---- Documentos (contrato, assinatura, NF) ----

function renderDocumentos() {
  const c = atual();
  const r = Contratos.responsavelFinanceiro(ctx(), c);
  const t = Contratos.totais(c);
  const pendDoc = Contratos.pendenciasDocumento(ctx(), c);
  const pendEmissao = Contratos.pendenciasEmissao(ctx(), c);
  const ativo = c.status !== 'cancelado';
  const emAndamento = Contratos.envelopeEmAndamento(c);
  const tituloGerar = pendDoc.length ? `Falta: ${pendDoc.join(' · ')}` : emAndamento ? `Envelope ${emAndamento.envelopeId} em andamento — cancele-o antes de gerar outra versão` : '';
  document.getElementById('acoes-aba').innerHTML = ativo ? `
    <button type="button" id="btn-gerar" class="${c.documento ? BOTAO_SEC : BOTAO_PRI}" ${Contratos.podeGerarDocumento(ctx(), c) ? '' : 'disabled'} title="${esc(tituloGerar)}">${ICONE.doc} ${c.documento ? `Gerar nova versão (v${c.documento.versao + 1})` : 'Gerar documento'}</button>
    ${Contratos.podeEnviarClicksign(c) ? `<button type="button" id="btn-clicksign" class="${BOTAO_PRI}">${ICONE.enviar} Enviar para assinatura (Clicksign)</button>` : ''}
    ${Contratos.podeRegistrarAssinaturaManual(c) ? `<button type="button" id="btn-assinatura" class="${BOTAO_SEC}" title="Papel ou aceite por e-mail, fora do Clicksign">${ICONE.assinatura} Registrar assinatura manual</button>` : ''}
    ${!c.nf && (c.status === 'comercial_ok' || c.status === 'adm_ok') ? `<button type="button" id="btn-nf" class="${BOTAO_SEC}" ${pendEmissao.length ? 'disabled' : ''} title="${pendEmissao.length ? `Travado: ${esc(pendEmissao.join(' · '))}` : ''}">Emitir nota fiscal</button>` : ''}` : '';
  const env = Contratos.envelopeAtual(c);
  const assinadoEnv = Contratos.assinado(c) && Contratos.assinaturaDe(c, 'contratante').envelopeId ? c.envelopes.find((e) => e.envelopeId === Contratos.assinaturaDe(c, 'contratante').envelopeId) ?? null : null;
  const anexo = Contratos.anexoAlunos(c);
  const contratanteTxt = !c.contratante ? '<span class="text-amber-700 dark:text-amber-300">a definir</span>' : `${esc(r.nome)}${r.documento ? `, ${r.tipo === 'empresa' ? 'CNPJ' : 'CPF'} ${esc(r.documento)}` : ''}${r.tipo === 'terceiro' ? `, responsável por ${esc(r.aluno.nome)}` : r.tipo === 'responsavel' ? ' (responsável financeiro)' : ''}`;
  const linhaPacoteDoc = (pp) => `
            <tr>
              <td class="py-1.5 pr-3 align-top"><strong>${esc(pp.pacote.nome)}</strong><br><span class="text-xs">${pp.pacote.itens.map((it) => esc(Contratos.rotuloItem(ctx(), it))).join('; ') || '<em>sem itens</em>'}</span></td>
              <td class="py-1.5 px-3 text-right align-top tabular-nums whitespace-nowrap">${moeda(pp.valorPacote)}</td>
              <td class="py-1.5 px-3 text-right align-top tabular-nums">${pp.vagas}</td>
              <td class="py-1.5 pl-3 text-right align-top tabular-nums whitespace-nowrap">${moeda(pp.final)}</td>
            </tr>`;
  const linhaAnexo = (v) => { const a = alunoDe(v.alunoId); const p = Contratos.pacoteDe(c, v.pacoteId); return `<li><strong>${esc(a?.nome ?? v.alunoId)}</strong> (matrícula ${esc(v.codigo)}) · ${esc(p?.nome ?? 'pacote')}: ${v.itens.filter(Contratos.matriculaAtiva).map((it) => esc(Contratos.rotuloItem(ctx(), it))).join('; ') || '<em>sem itens ativos</em>'}</li>`; };
  document.getElementById('conteudo-aba').innerHTML = `
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <section class="${CARTAO} xl:col-span-2">
        ${cabecalhoSecao('Contrato', c.documento ? `Versão ${c.documento.versao}, gerada em ${esc(Contratos.fmtDataHora(c.documento.geradoEm))}.${assinadoEnv ? ` Assinado no Clicksign (${esc(assinadoEnv.envelopeId)}).` : ''}` : 'Ainda não gerado. Prévia do que sairá no documento:', c.documento ? 'btn-baixar' : null, 'Baixar PDF')}
        <div class="p-6 font-serif text-sm leading-relaxed text-slate-800 dark:text-neutral-200 space-y-3 ${c.documento ? '' : 'opacity-70'}">
          <p class="font-display font-semibold text-base text-center uppercase tracking-wide">Contrato de prestação de serviços educacionais · ${esc(c.codigo)}</p>
          <p><strong>Contratada:</strong> ProWay Informática e Treinamentos Ltda.</p>
          <p><strong>Contratante / responsável financeiro:</strong> ${contratanteTxt}.</p>
          <p><strong>Objeto:</strong> ${esc(Contratos.descricao(ctx(), c))}, conforme os pacotes e vagas abaixo:</p>
          <table class="w-full text-sm">
            <thead class="text-left text-xs font-medium text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-800"><tr><th class="py-1 pr-3">Pacote e itens</th><th class="py-1 px-3 text-right">Valor unitário</th><th class="py-1 px-3 text-right">Vagas</th><th class="py-1 pl-3 text-right">Subtotal</th></tr></thead>
            <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">${t.porPacote.length ? t.porPacote.map(linhaPacoteDoc).join('') : '<tr><td colspan="4" class="py-2 text-slate-400">—</td></tr>'}</tbody>
          </table>
          <p><strong>Valor total:</strong> ${moeda(t.final)}${t.desconto > 0 ? ` (valor de tabela ${moeda(t.base)}, desconto de ${moeda(t.desconto)})` : ''}, em ${c.cobranca.parcelas} parcela(s) via ${esc(nomeDe(FORMAS_COBRANCA, c.cobranca.forma)).toLowerCase()}${c.cobranca.primeiroVencimento ? `, a primeira em ${esc(Contratos.fmtData(c.cobranca.primeiroVencimento))}` : ''}. Vagas não preenchidas são devidas pelo valor do pacote.</p>
          <p class="text-xs text-slate-500 dark:text-neutral-400">Cláusulas padrão (cancelamento, reposição, certificado, LGPD) entram aqui no documento real.</p>
          <div class="pt-3 border-t border-slate-200 dark:border-neutral-800">
            <p class="flex flex-wrap items-center gap-2"><strong>Anexo — alunos</strong> <span class="text-xs text-slate-500 dark:text-neutral-400">lista viva dos alunos aprovados; muda sem nova versão do documento${anexo.atualizadoEm ? ` · <span class="text-amber-700 dark:text-amber-300">anexo atualizado em ${esc(Contratos.fmtDataHora(anexo.atualizadoEm))}</span>` : ''}</span></p>
            ${anexo.aprovados.length ? `<ul class="list-disc pl-6 mt-1">${anexo.aprovados.map(linhaAnexo).join('')}</ul>` : `<p class="text-slate-400 mt-1">Nenhum aluno aprovado ainda${t.nAguardando ? ` (${t.nAguardando} aguardando conferência)` : ''}.</p>`}
          </div>
          ${blocoAssinaturasDocumento(c, assinadoEnv)}
        </div>
      </section>
      <div class="space-y-4">
        <section class="${CARTAO}">
          ${cabecalhoSecao('Assinaturas', 'As duas partes precisam assinar: o contratante (empresa/aluno) e a ProWay.')}
          ${cartaoPartes(c)}
        </section>
        <section class="${CARTAO}">
          ${cabecalhoSecao('Clicksign', env ? `Envelope <span class="font-mono">${esc(env.envelopeId)}</span> · documento v${env.versao}` : 'Contratante, alunos (opcional) e ProWay assinam o envelope.')}
          ${cartaoEnvelope(c, env)}
        </section>
        <section class="${CARTAO}">
          ${cabecalhoSecao('Nota fiscal', 'Emitida contra o responsável financeiro.')}
          <div class="p-4 text-sm">${c.nf ? `<p class="font-medium text-slate-800 dark:text-neutral-100 font-mono">${esc(c.nf.numero)}</p><p class="text-xs text-slate-500 dark:text-neutral-400">${esc(Contratos.fmtData(c.nf.emitidaEm))} · ${moeda(t.final)}${c.cobranca.pedidoCompra ? ` · PO ${esc(c.cobranca.pedidoCompra)}` : ''}</p>` : `<p class="text-slate-400">${c.status === 'comercial_ok' || c.status === 'adm_ok' ? (pendEmissao.length ? `Travada: ${esc(pendEmissao.join(' · '))}` : 'Pronta para emitir.') : 'Disponível após o Comercial OK.'}</p>`}</div>
        </section>
      </div>
      <section class="${CARTAO} xl:col-span-3">
        ${cabecalhoSecao('Histórico de assinaturas', `${plural(c.envelopes.length, 'envelope')} enviado${c.envelopes.length === 1 ? '' : 's'} ao Clicksign${PARTES_ASSINATURA.some((p) => Contratos.assinaturaDe(c, p.id) && !Contratos.assinaturaDe(c, p.id).envelopeId) ? ' · assinatura(s) registrada(s) manualmente' : ''}.`)}
        ${historicoAssinaturasHtml(c)}
      </section>
    </div>`;
  document.getElementById('btn-gerar')?.addEventListener('click', () => executarAcao('documento'));
  document.getElementById('btn-clicksign')?.addEventListener('click', abrirModalClicksign);
  document.getElementById('btn-assinatura')?.addEventListener('click', abrirDrawerAssinatura);
  document.getElementById('btn-nf')?.addEventListener('click', abrirDrawerNf);
  document.getElementById('btn-baixar')?.addEventListener('click', () => toast(`Protótipo: aqui baixaria o PDF ${assinadoEnv ? 'assinado (com o certificado do Clicksign)' : `do documento v${c.documento.versao}`}.`));
  document.querySelectorAll('[data-assinar]').forEach((b) => b.addEventListener('click', () => {
    alterar((l) => Contratos.assinarNoClicksign(l, c.id, b.dataset.assinar));
    const novo = atual();
    toast(Contratos.assinado(novo) ? 'As duas partes assinaram — contrato assinado.' : 'Assinatura registrada no envelope.');
    renderContrato();
  }));
  document.querySelectorAll('[data-recusar]').forEach((b) => b.addEventListener('click', () => confirmarRecusa(b.dataset.recusar)));
  document.querySelectorAll('[data-lembrar]').forEach((b) => b.addEventListener('click', () => {
    alterar((l) => Contratos.lembrarClicksign(l, c.id, b.dataset.lembrar || null));
    toast('Lembrete reenviado.'); renderContrato();
  }));
  document.getElementById('btn-cancelar-envelope')?.addEventListener('click', confirmarCancelarEnvelope);
  document.getElementById('btn-reenviar')?.addEventListener('click', abrirModalClicksign);
}

// Bloco de assinaturas no rodapé da prévia do documento: as duas partes, com o que cada uma já fez.
function blocoAssinaturasDocumento(c, assinadoEnv) {
  if (!c.documento) return '';
  if (!assinadoEnv) return `
    <div class="pt-3 border-t border-slate-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
      ${PARTES_ASSINATURA.map((p) => { const a = Contratos.assinaturaDe(c, p.id); return `<div class="rounded-lg border ${a ? 'border-emerald-200 dark:border-emerald-800' : 'border-dashed border-slate-300 dark:border-neutral-700'} px-3 py-2"><p class="text-xs font-medium text-slate-500 dark:text-neutral-400">${esc(p.nome)}</p>${a ? `<p class="font-medium text-slate-800 dark:text-neutral-100">${esc(a.por)}</p><p class="text-xs text-slate-500 dark:text-neutral-400">${esc(Contratos.fmtData(a.assinadoEm))} · ${esc(nomeDe(MEIOS_ASSINATURA, a.meio)).toLowerCase()}${a.envelopeId ? ` · ${esc(a.envelopeId)}` : ''}</p>` : '<p class="text-sm text-slate-400">assinatura pendente</p>'}</div>`; }).join('')}
    </div>`;
  return `
    <div class="pt-3 border-t border-slate-200 dark:border-neutral-800">
      <p><strong>Assinaturas eletrônicas</strong> · Clicksign ${esc(assinadoEnv.envelopeId)} · concluído em ${esc(Contratos.fmtDataHora(assinadoEnv.concluidoEm))}</p>
      <div class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 font-sans">
        ${assinadoEnv.signatarios.map((sg) => `<div class="rounded-lg border border-slate-200 dark:border-neutral-800 px-3 py-2"><p class="text-xs font-medium text-slate-500 dark:text-neutral-400">${esc(nomeDe(PAPEIS_SIGNATARIO, sg.papel))}</p><p class="font-medium text-slate-800 dark:text-neutral-100">${esc(sg.nome)}</p><p class="text-xs text-slate-500 dark:text-neutral-400">${esc(sg.email)} · ${esc(Contratos.fmtDataHora(sg.assinadoEm))}</p></div>`).join('')}
      </div>
    </div>`;
}

// Cartão das duas partes (contratante e ProWay): quem assinou, quando e por qual meio.
function cartaoPartes(c) {
  if (!c.documento) return `<div class="p-4 text-sm text-slate-500 dark:text-neutral-400">Gere o documento primeiro.</div>`;
  return `
    <ul class="p-4 space-y-2 text-sm">
      ${PARTES_ASSINATURA.map((p) => { const a = Contratos.assinaturaDe(c, p.id); return `
        <li class="rounded-lg border p-3 ${a ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-neutral-800'}">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-xs font-medium text-slate-500 dark:text-neutral-400">${esc(p.nome)}</p>
              <p class="font-medium text-slate-800 dark:text-neutral-100 truncate">${a ? esc(a.por) : (p.id === 'escola' ? esc(ESCOLA_SIGNATARIA.nome) : esc(Contratos.responsavelFinanceiro(ctx(), c).nome))}</p>
              ${a ? `<p class="text-xs text-slate-500 dark:text-neutral-400">${esc(Contratos.fmtData(a.assinadoEm))} · ${esc(nomeDe(MEIOS_ASSINATURA, a.meio)).toLowerCase()}${a.envelopeId ? ` · <span class="font-mono">${esc(a.envelopeId)}</span>` : ''}</p>` : ''}
            </div>
            ${pilula(a ? PILULA.verde : PILULA.ambar, a ? 'assinou' : 'pendente')}
          </div>
        </li>`; }).join('')}
    </ul>`;
}

// Cartão do envelope atual: signatários com status e botões que simulam o retorno do Clicksign.
function cartaoEnvelope(c, env) {
  if (!env) {
    const msg = Contratos.assinado(c) ? 'Assinaturas registradas manualmente — nenhum envelope foi necessário.'
      : !c.documento ? 'Gere o documento primeiro.' : c.status === 'cancelado' ? 'Venda cancelada.' : 'Documento pronto — envie para assinatura.';
    return `<div class="p-4 text-sm text-slate-500 dark:text-neutral-400">${msg}</div>`;
  }
  const andamento = env.status === 'enviado';
  const st = Contratos.statusEnvelopeDe(env);
  return `
    <div class="p-4 space-y-3 text-sm">
      <div class="flex flex-wrap items-center justify-between gap-2">
        ${pilula(PILULA[PILULA_ENVELOPE[env.status]], st.nome, st.descricao)}
        <span class="text-xs text-slate-500 dark:text-neutral-400">enviado ${esc(Contratos.fmtDataHora(env.enviadoEm))} · ${esc(env.enviadoPor)}${env.prazoDias ? ` · prazo ${env.prazoDias} dias` : ''}</span>
      </div>
      <ul class="space-y-2">
        ${env.signatarios.map((sg) => `
          <li class="rounded-lg border p-3 ${sg.status === 'assinado' ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30' : sg.status === 'recusado' ? 'border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-950/30' : 'border-slate-200 dark:border-neutral-800'}">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-xs font-medium text-slate-500 dark:text-neutral-400">${esc(nomeDe(PAPEIS_SIGNATARIO, sg.papel))}</p>
                <p class="font-medium text-slate-800 dark:text-neutral-100 truncate">${esc(sg.nome)}</p>
                <p class="text-xs text-slate-500 dark:text-neutral-400 truncate">${esc(sg.email)}</p>
              </div>
              ${pilula(PILULA[PILULA_SIGNATARIO[sg.status]], sg.status === 'assinado' ? `assinou ${Contratos.fmtDataHora(sg.assinadoEm)}` : sg.status === 'recusado' ? 'recusou' : 'pendente')}
            </div>
            ${sg.status === 'recusado' && sg.motivo ? `<p class="mt-1 text-xs text-red-700 dark:text-red-300">${esc(sg.motivo)}</p>` : ''}
            ${andamento && sg.status === 'pendente' ? `
              <div class="mt-2 flex flex-wrap gap-1.5">
                <button type="button" data-lembrar="${sg.id}" class="${BOTAO_MINI}">${ICONE.sino} Reenviar lembrete</button>
                <button type="button" data-assinar="${sg.id}" class="${BOTAO_MINI}" title="Simula o retorno (webhook) do Clicksign">${ICONE.checkMini} Simular assinatura</button>
                <button type="button" data-recusar="${sg.id}" class="${BOTAO_MINI} hover:border-red-500 hover:text-red-700 dark:hover:border-red-500 dark:hover:text-red-400" title="Simula o retorno (webhook) do Clicksign">Simular recusa</button>
              </div>` : ''}
          </li>`).join('')}
      </ul>
      ${andamento ? `<div class="flex flex-wrap items-center justify-between gap-2 pt-1"><button type="button" data-lembrar="" class="${BOTAO_LINK}">${ICONE.sino} Lembrar todos os pendentes</button><button type="button" id="btn-cancelar-envelope" class="${BOTAO_LINK} text-red-700 dark:text-red-400">Cancelar envelope</button></div>` : ''}
      ${env.status === 'recusado' && c.status !== 'cancelado' ? `<div class="flex flex-wrap items-center gap-2 pt-1"><button type="button" id="btn-reenviar" class="${BOTAO_PRI} h-8">${ICONE.enviar} Enviar novo envelope</button><span class="text-xs text-slate-500 dark:text-neutral-400">Revise o contrato antes; gere nova versão se algo mudou.</span></div>` : ''}
      ${env.status === 'cancelado' && env.cancelamento ? `<p class="text-xs text-slate-500 dark:text-neutral-400">Cancelado em ${esc(Contratos.fmtDataHora(env.cancelamento.em))}${env.cancelamento.motivo ? `: ${esc(env.cancelamento.motivo)}` : ''}.</p>` : ''}
      ${env.status === 'assinado' ? `<p class="text-xs text-slate-500 dark:text-neutral-400">Concluído em ${esc(Contratos.fmtDataHora(env.concluidoEm))}. O documento assinado fica arquivado no Clicksign.</p>` : ''}
    </div>`;
}

// Todos os envelopes do contrato com a linha do tempo de cada um.
function historicoAssinaturasHtml(c) {
  const envs = [...c.envelopes].reverse();
  const manuais = PARTES_ASSINATURA.map((p) => ({ parte: p, a: Contratos.assinaturaDe(c, p.id) })).filter((x) => x.a && !x.a.envelopeId);
  if (!envs.length && !manuais.length) return `<div class="p-4 text-sm text-slate-400">Nenhum envio ainda.</div>`;
  const manual = manuais.map(({ parte, a }) => `
    <div class="px-4 py-3 text-sm flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-neutral-900">
      ${pilula(PILULA.verde, 'Manual')}<span class="text-xs text-slate-500 dark:text-neutral-400">${esc(parte.nome)}</span><span class="text-slate-800 dark:text-neutral-100">${esc(a.por)}</span><span class="text-xs text-slate-500 dark:text-neutral-400">${esc(Contratos.fmtData(a.assinadoEm))} · ${esc(nomeDe(MEIOS_ASSINATURA, a.meio))}</span>
    </div>`).join('');
  return `${manual}<div class="divide-y divide-slate-100 dark:divide-neutral-900">
    ${envs.map((e) => {
      const st = Contratos.statusEnvelopeDe(e);
      return `
      <details class="group" ${e.id === Contratos.envelopeAtual(c)?.id ? 'open' : ''}>
        <summary class="cursor-pointer list-none px-4 py-3 flex flex-wrap items-center gap-2 hover:bg-slate-50 dark:hover:bg-neutral-900/60">
          <svg class="h-4 w-4 text-slate-400 transition group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          <span class="font-mono text-sm text-slate-800 dark:text-neutral-100">${esc(e.envelopeId)}</span>
          <span class="text-xs text-slate-500 dark:text-neutral-400">documento v${e.versao} · enviado ${esc(Contratos.fmtDataHora(e.enviadoEm))} por ${esc(e.enviadoPor)}</span>
          ${pilula(PILULA[PILULA_ENVELOPE[e.status]], st.nome)}
          <span class="ml-auto text-xs text-slate-500 dark:text-neutral-400">${e.signatarios.filter((x) => x.status === 'assinado').length}/${e.signatarios.length} assinaturas</span>
        </summary>
        <div class="px-4 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <table class="w-full text-sm">
            <thead class="text-left text-xs font-medium text-slate-500 dark:text-neutral-400"><tr><th class="py-1.5 pr-3">Signatário</th><th class="py-1.5 pr-3">E-mail</th><th class="py-1.5">Situação</th></tr></thead>
            <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
              ${e.signatarios.map((sg) => `<tr><td class="py-1.5 pr-3"><span class="text-slate-800 dark:text-neutral-100">${esc(sg.nome)}</span> <span class="text-xs text-slate-400">${esc(nomeDe(PAPEIS_SIGNATARIO, sg.papel).toLowerCase())}</span></td><td class="py-1.5 pr-3 text-xs text-slate-500 dark:text-neutral-400">${esc(sg.email)}</td><td class="py-1.5">${pilula(PILULA[PILULA_SIGNATARIO[sg.status]], sg.status === 'assinado' ? `assinou ${Contratos.fmtDataHora(sg.assinadoEm)}` : sg.status === 'recusado' ? `recusou${sg.motivo ? `: ${sg.motivo}` : ''}` : 'pendente')}</td></tr>`).join('')}
            </tbody>
          </table>
          <ol class="relative border-l border-slate-200 dark:border-neutral-800 ml-2 space-y-2.5">
            ${[...e.eventos].sort((a, b) => b.em.localeCompare(a.em)).map((ev) => `<li class="pl-4"><span class="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-petrol-800 dark:bg-sky-400"></span><p class="text-sm text-slate-800 dark:text-neutral-100">${esc(ev.texto)}</p><p class="text-xs text-slate-500 dark:text-neutral-400 tabular-nums">${esc(Contratos.fmtDataHora(ev.em))} · ${esc(ev.por)}</p></li>`).join('')}
          </ol>
        </div>
      </details>`;
    }).join('')}
  </div>`;
}

// ---- Histórico ----

function renderHistorico() {
  const c = atual();
  document.getElementById('acoes-aba').innerHTML = '';
  const eventos = [...c.historico].sort((a, b) => b.em.localeCompare(a.em));
  document.getElementById('conteudo-aba').innerHTML = `
    <section class="${CARTAO} p-4">
      <ol class="relative border-l border-slate-200 dark:border-neutral-800 ml-2 space-y-4">
        ${eventos.map((ev) => `
          <li class="pl-5">
            <span class="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-petrol-800 dark:bg-sky-400"></span>
            <p class="text-sm text-slate-800 dark:text-neutral-100">${esc(ev.texto)}</p>
            <p class="text-xs text-slate-500 dark:text-neutral-400 tabular-nums">${esc(Contratos.fmtDataHora(ev.em))} · ${esc(ev.por)}</p>
          </li>`).join('')}
      </ol>
    </section>`;
}

// ---------- Drawer genérico ----------

function abrirDrawer(html) {
  const root = document.getElementById('drawer-root');
  root.innerHTML = `
    <div class="fixed inset-0 z-40 flex justify-end">
      <div data-fechar-drawer class="absolute inset-0 bg-slate-900/50 dark:bg-black/70"></div>
      ${html}
    </div>`;
  const fechar = () => { root.innerHTML = ''; document.removeEventListener('keydown', aoTeclar); };
  const aoTeclar = (e) => { if (e.key === 'Escape') fechar(); };
  document.addEventListener('keydown', aoTeclar);
  root.querySelectorAll('[data-fechar-drawer]').forEach((b) => b.addEventListener('click', fechar));
  return { root, fechar };
}

function mostrarErros(form, erros) {
  form.querySelectorAll('[data-erro]').forEach((p) => { p.classList.add('hidden'); p.textContent = ''; });
  form.querySelectorAll('.campo-erro').forEach((c) => c.classList.remove('campo-erro'));
  if (!erros.length) return false;
  erros.forEach((erro) => {
    const p = form.querySelector(`[data-erro="${erro.campo}"]`);
    if (p) { p.textContent = erro.mensagem; p.classList.remove('hidden'); }
    form.querySelector(`[name="${erro.campo}"]`)?.classList.add('campo-erro');
  });
  form.querySelector(`[name="${erros[0].campo}"]`)?.focus();
  return true;
}

const ERRO = (campo) => `<p data-erro="${campo}" class="text-xs text-red-600 dark:text-red-400 mt-1 hidden"></p>`;
const OPCIONAL = '<span class="normal-case font-normal tracking-normal text-slate-400">(opcional)</span>';

function drawerFormulario({ id, titulo, subtitulo, corpo, rotulo, largura = 'max-w-md', aoSalvar, foco, aoMontar }) {
  const { fechar, root } = abrirDrawer(`
    <form id="${id}" novalidate role="dialog" aria-modal="true" class="drawer-anim relative h-full w-full ${largura} bg-white dark:bg-neutral-950 border-l border-slate-200 dark:border-neutral-800 shadow-xl flex flex-col">
      <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
        <div>
          <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h3>
          <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${subtitulo}</p>
        </div>
        <button type="button" data-fechar-drawer class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${ICONE.fechar}</button>
      </div>
      <div class="flex-1 overflow-y-auto px-5 py-4 space-y-5">${corpo}</div>
      <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
        <button type="button" data-fechar-drawer class="${BOTAO_CANCELAR}">Cancelar</button>
        <button type="submit" class="${BOTAO_PRI}">${rotulo}</button>
      </div>
    </form>`);
  const form = root.querySelector(`#${id}`);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const erros = aoSalvar(new FormData(form), form) ?? [];
    if (mostrarErros(form, erros)) return;
    fechar();
  });
  if (aoMontar) aoMontar(form);
  if (foco) form.querySelector(foco)?.focus();
  return { form, fechar };
}

const campoTexto = (name, rotulo, valor, { tipo = 'text', placeholder = '', max = '', extra = '', opcional = false } = {}) => `
  <div>
    <label class="rotulo" for="f-${name}">${rotulo} ${opcional ? OPCIONAL : ''}</label>
    <input id="f-${name}" name="${name}" type="${tipo}" ${max ? `maxlength="${max}"` : ''} ${extra} class="campo" placeholder="${esc(placeholder)}" value="${esc(valor ?? '')}">
    ${ERRO(name)}
  </div>`;

const campoArea = (name, rotulo, valor, { rows = 3, placeholder = '', opcional = false } = {}) => `
  <div>
    <label class="rotulo" for="f-${name}">${rotulo} ${opcional ? OPCIONAL : ''}</label>
    <textarea id="f-${name}" name="${name}" rows="${rows}" class="campo resize-y" placeholder="${esc(placeholder)}">${esc(valor ?? '')}</textarea>
    ${ERRO(name)}
  </div>`;

const campoSelect = (name, rotulo, opcoes, valor, { opcional = false, placeholder = 'Escolha' } = {}) => `
  <div>
    <label class="rotulo" for="f-${name}">${rotulo} ${opcional ? OPCIONAL : ''}</label>
    <select id="f-${name}" name="${name}" class="campo">
      <option value="" ${valor ? '' : 'selected'} ${opcional ? '' : 'disabled'}>${opcional ? '—' : placeholder}</option>
      ${opcoes.map((o) => `<option value="${o.id}" ${valor === o.id ? 'selected' : ''}>${esc(o.nome)}</option>`).join('')}
    </select>
    ${ERRO(name)}
  </div>`;

const cartoesRadio = (name, opcoes, valor, colunas = 'grid-cols-2') => `
  <div class="grid ${colunas} gap-2">
    ${opcoes.map((o) => `
    <label class="${CARTAO_OPCAO}">
      <input type="radio" name="${name}" value="${o.id}" class="sr-only" ${valor === o.id ? 'checked' : ''}>
      <p class="text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(o.nome)}</p>
      ${o.descricao ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(o.descricao)}</p>` : ''}
    </label>`).join('')}
  </div>
  ${ERRO(name)}`;

// Lista com busca para escolher um (radio) ou vários (checkbox) registros dentro de um drawer.
function listaSelecionavel(name, itens, { multiplo = false, placeholder = 'Buscar', vazioTxt = 'Nenhum resultado.', selecionados = [] } = {}) {
  return `
    <div data-lista-sel="${name}" data-multiplo="${multiplo}">
      ${busca(`busca-${name}`, '', placeholder, 'w-full')}
      <div class="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-neutral-800 divide-y divide-slate-100 dark:divide-neutral-900">
        ${itens.map((i) => `
          <label data-item="${esc(Contratos.normalizar(i.busca ?? i.nome))}" class="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 ${i.desabilitado ? 'opacity-50' : ''}">
            <input type="${multiplo ? 'checkbox' : 'radio'}" name="${name}" value="${i.id}" class="${multiplo ? CHECK : 'accent-petrol-800'}" ${selecionados.includes(i.id) ? 'checked' : ''} ${i.desabilitado ? 'disabled' : ''}>
            <span class="min-w-0 flex-1">
              <span class="block text-sm text-slate-800 dark:text-neutral-100 truncate">${esc(i.nome)}</span>
              ${i.detalhe ? `<span class="block text-xs text-slate-500 dark:text-neutral-400 truncate">${i.detalhe}</span>` : ''}
            </span>
            ${i.direita ? `<span class="text-xs text-slate-500 dark:text-neutral-400 tabular-nums shrink-0">${i.direita}</span>` : ''}
          </label>`).join('')}
        <p data-vazio class="hidden px-3 py-4 text-sm text-slate-500 dark:text-neutral-400">${vazioTxt}</p>
        ${itens.length ? '' : `<p class="px-3 py-4 text-sm text-slate-500 dark:text-neutral-400">${vazioTxt}</p>`}
      </div>
      ${ERRO(name)}
    </div>`;
}

function ligarListas(form) {
  form.querySelectorAll('[data-lista-sel]').forEach((bloco) => {
    const campoBusca = bloco.querySelector('input[type="search"]');
    campoBusca.addEventListener('input', () => {
      const termo = Contratos.normalizar(campoBusca.value);
      let n = 0;
      bloco.querySelectorAll('[data-item]').forEach((l) => { const ok = !termo || l.dataset.item.includes(termo); l.classList.toggle('hidden', !ok); if (ok) n += 1; });
      bloco.querySelector('[data-vazio]').classList.toggle('hidden', n > 0 || !bloco.querySelectorAll('[data-item]').length);
    });
  });
}

// ---------- Drawers ----------

// Formulário dentro de um modal (mesma validação/erros do drawer). Fecha ao salvar sem erros.
function modalFormulario({ id, titulo, subtitulo, corpo, rotulo, largura = 'max-w-2xl', aoSalvar, aoMontar, foco }) {
  const root = abrirModal(`
    <form id="${id}" novalidate class="flex flex-col min-h-0">
      <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
        <div>
          <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h3>
          <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${subtitulo}</p>
        </div>
        <button type="button" data-fechar-modal class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${ICONE.fechar}</button>
      </div>
      <div class="px-5 py-4 space-y-5 overflow-y-auto min-h-0">${corpo}</div>
      <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
        <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
        <button type="submit" class="${BOTAO_PRI}">${rotulo}</button>
      </div>
    </form>`, largura);
  const form = root.querySelector(`#${id}`);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const erros = aoSalvar(new FormData(form), form) ?? [];
    if (mostrarErros(form, erros)) return;
    fecharModal();
  });
  if (aoMontar) aoMontar(form);
  if (foco) form.querySelector(foco)?.focus();
  return { form, root };
}

// Seletor de pacote (nova venda e "+ Pacote"): cartões Formação | Cursos avulsos → lista com busca + vagas.
function corpoPacote() {
  const formacoes = ctx().formacoes.filter((f) => f.status === 'ativo').sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const cursos = ctx().cursos.filter((x) => x.status === 'ativo').sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  return `
      <fieldset class="space-y-3">
        <legend class="rotulo">O que o pacote vende</legend>
        ${cartoesRadio('venda', TIPOS_VENDA, null)}
        <div data-bloco="formacao" class="hidden">${listaSelecionavel('formacaoId', formacoes.map((f) => { const tot = Formacoes.totais(f, ctx().cursos); return { id: f.id, nome: `${f.codigo} · ${f.nome}`, detalhe: `${plural(tot.n, 'curso')} · ${tot.horas}h · rateado por carga horária`, busca: `${f.codigo} ${f.nome}`, direita: moeda(f.comercial.precoReferencia) }; }), { placeholder: 'Buscar formação', vazioTxt: 'Nenhuma formação ativa.' })}</div>
        <div data-bloco="cursos" class="hidden">${listaSelecionavel('cursoIds', cursos.map((x) => ({ id: x.id, nome: `${x.codigo} · ${x.nome}`, detalhe: `${esc(nomeDe(EIXOS, x.eixoId))} · ${x.cargaHoraria}h · ${plural(Cursos.turmasDoCurso(x.id).length, 'turma')}`, busca: `${x.codigo} ${x.nome} ${nomeDe(EIXOS, x.eixoId)}`, direita: moeda(x.comercial.precoReferencia) })), { multiplo: true, placeholder: 'Buscar curso', vazioTxt: 'Nenhum curso ativo.' })}</div>
      </fieldset>
      <div data-vagas class="grid grid-cols-2 gap-3 items-start">
        ${campoTexto('vagas', 'Vagas', 1, { tipo: 'number', extra: 'min="1" step="1"' })}
        <p class="text-xs text-slate-500 dark:text-neutral-400 pt-6">Vagas são cobradas mesmo vazias; os alunos entram depois, pela escola ou pelo link do pacote.</p>
      </div>`;
}
const montarPacote = (f) => {
  ligarListas(f);
  f.querySelectorAll('input[name="venda"]').forEach((r) => r.addEventListener('change', () => f.querySelectorAll('[data-bloco]').forEach((b) => b.classList.toggle('hidden', b.dataset.bloco !== r.value))));
};
const lerPacote = (fd) => ({ venda: fd.get('venda'), formacaoId: fd.get('formacaoId'), cursoIds: fd.getAll('cursoIds'), vagas: fd.get('vagas') });

// Nova venda (RF-01, 16/10/2026): vendedor + "Para quem?" + 1º pacote. Particular já entra com o aluno numa vaga
// e o pagador do cadastro dele; Empresa já entra com a empresa; "Definir depois" é o rascunho sem contratante de antes.
const PARA_QUEM = [
  { id: 'particular', nome: 'Particular', descricao: 'Um aluno; irmãos entram depois, na mesma venda. Paga o responsável financeiro do cadastro ou o próprio aluno.' },
  { id: 'empresa', nome: 'Empresa', descricao: 'Vagas para colaboradores; os alunos entram depois, pela escola ou pelo link do pacote.' },
  { id: 'depois', nome: 'Definir depois', descricao: 'Ainda não se sabe quem paga: a venda nasce como rascunho, sem contratante.' },
];
function abrirModalNovo() {
  const empresas = ctx().empresas.filter((e) => e.status === 'ativo').sort((a, b) => Contratos.nomeEmpresa(a).localeCompare(Contratos.nomeEmpresa(b), 'pt-BR'));
  const alunos = ctx().alunos.filter((a) => a.status === 'ativo').sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const pendTxt = (n) => (n ? `⚠ ${plural(n, 'pendência')}` : '');
  modalFormulario({
    id: 'form-novo', titulo: 'Nova venda', subtitulo: 'Para quem é e o primeiro pacote (formação ou cursos avulsos). Turmas e parcelas ficam para a venda aberta, que nasce como rascunho.', rotulo: 'Criar venda',
    corpo: `
      ${campoSelect('vendedorId', 'Vendedor', VENDEDORES, '')}
      <fieldset class="space-y-3 min-w-0">
        <legend class="rotulo">Para quem?</legend>
        ${cartoesRadio('para', PARA_QUEM, null, 'grid-cols-3')}
        <div data-para="particular" class="hidden space-y-3">
          ${cartoesRadio('alunoModo', [{ id: 'existente', nome: 'Aluno já cadastrado', descricao: 'Buscar por nome, CPF ou e-mail.' }, { id: 'novo', nome: 'Aluno novo', descricao: 'Só o essencial; o resto fica para o cadastro em Clientes.' }], 'existente')}
          <div data-sub-aluno="existente">${listaSelecionavel('alunoId', alunos.map((a) => ({ id: a.id, nome: a.nomeSocial || a.nome, detalhe: `<span class="font-mono">${esc(Clientes.fmtCpf(a.cpf))}</span> · ${esc(a.email || 'sem e-mail')} · ${esc(nomeDe(PAGADORES, a.pagador))}`, busca: `${a.nome} ${a.nomeSocial} ${a.cpf} ${a.email}`, direita: `${financeiroDoAluno(a).tag}${pendTxt(Clientes.pendenciasAluno(a, ctx().empresas).length)}` })), { placeholder: 'Buscar aluno por nome, CPF ou e-mail', vazioTxt: 'Nenhum aluno encontrado — use "Aluno novo" acima.' })}</div>
          <div data-sub-aluno="novo" class="hidden space-y-3">
            ${campoTexto('nome', 'Nome completo', '', { placeholder: 'Como consta no documento', max: 120 })}
            <div class="grid grid-cols-2 gap-3">
              ${campoTexto('cpf', 'CPF', '', { placeholder: '000.000.000-00', max: 14, extra: 'data-mascara="cpf" inputmode="numeric"' })}
              ${campoTexto('nascimento', 'Nascimento', '', { tipo: 'date', opcional: true })}
            </div>
            <div class="grid grid-cols-2 gap-3">
              ${campoTexto('email', 'E-mail', '', { tipo: 'email', max: 120 })}
              ${campoTexto('celular', 'Celular / WhatsApp', '', { placeholder: '(47) 90000-0000', extra: 'inputmode="tel"' })}
            </div>
          </div>
        </div>
        <div data-para="empresa" class="hidden">
          ${listaSelecionavel('empresaId', empresas.map((e) => ({ id: e.id, nome: Contratos.nomeEmpresa(e), detalhe: `${esc(e.razaoSocial)} · <span class="font-mono">${esc(Clientes.fmtCnpj(e.cnpj))}</span>`, busca: `${e.nomeFantasia} ${e.razaoSocial} ${e.cnpj}`, direita: pendTxt(Clientes.pendenciasEmpresa(e).length) })), { placeholder: 'Buscar empresa por nome ou CNPJ', vazioTxt: 'Nenhuma empresa ativa encontrada.' })}
          <p class="text-xs text-slate-500 dark:text-neutral-400 mt-1">Empresa nova? Escolha "Definir depois" e cadastre em "Definir contratante", dentro da venda — lá ela mesma preenche pelo link.</p>
        </div>
      </fieldset>
      ${corpoPacote()}`,
    aoMontar: (f) => {
      montarPacote(f);
      const mostrar = (sel, chave, valor) => f.querySelectorAll(sel).forEach((b) => b.classList.toggle('hidden', b.dataset[chave] !== valor));
      f.querySelectorAll('input[name="para"]').forEach((r) => r.addEventListener('change', () => { mostrar('[data-para]', 'para', r.value); f.querySelector('[data-vagas]').classList.toggle('hidden', r.value === 'particular'); }));
      f.querySelectorAll('input[name="alunoModo"]').forEach((r) => r.addEventListener('change', () => mostrar('[data-sub-aluno]', 'subAluno', r.value)));
      f.querySelector('[name="celular"]').addEventListener('blur', (e) => { e.target.value = Clientes.fmtTelefone(e.target.value); });
    },
    aoSalvar: (fd) => {
      const para = fd.get('para');
      const d = { ...lerPacote(fd), vendedorId: fd.get('vendedorId'), vagas: para === 'particular' ? 1 : fd.get('vagas') };
      const erros = PARA_QUEM.some((p) => p.id === para) ? [] : [{ campo: 'para', mensagem: 'Escolha para quem é a venda.' }];
      const alunoNovo = para === 'particular' && fd.get('alunoModo') === 'novo' ? { nome: fd.get('nome'), cpf: fd.get('cpf'), nascimento: fd.get('nascimento'), email: fd.get('email'), celular: fd.get('celular') } : null;
      if (alunoNovo) erros.push(...Clientes.validarAluno(alunoNovo, ctx().alunos));
      else if (para === 'particular' && !fd.get('alunoId')) erros.push({ campo: 'alunoId', mensagem: 'Escolha o aluno.' });
      if (para === 'empresa') erros.push(...Contratos.validarContratante(ctx(), { contratante: 'empresa', empresaId: fd.get('empresaId') }));
      erros.push(...Contratos.validarNovo(ctx(), d));
      if (erros.length) return erros;
      let alunoId = fd.get('alunoId');
      if (alunoNovo) {
        const r = Clientes.incluirAluno(estado.clientes, alunoNovo);
        estado.clientes = r.dados; Clientes.salvar(estado.clientes); estado.ctx.alunos = estado.clientes.alunos;
        alunoId = r.aluno.id;
      }
      let { lista, contrato } = Contratos.incluir(estado.lista, ctx(), d);
      if (para === 'empresa') lista = Contratos.definirContratante(lista, ctx(), contrato.id, { contratante: 'empresa', empresaId: fd.get('empresaId') });
      if (para === 'particular') {
        const fin = Clientes.responsavelFinanceiroDoAluno(estado.clientes, alunoId);
        lista = Contratos.definirContratante(lista, ctx(), contrato.id, { contratante: 'particular', responsavel: fin ? { tipo: 'responsavel', id: fin.responsavel.id } : { tipo: 'aluno', id: alunoId } });
        lista = Contratos.regerarParcelas(Contratos.vincularAlunos(lista, contrato.id, contrato.pacotes[0].id, [alunoId]), contrato.id);
        sincronizarClientes([alunoId], Contratos.porId(lista, contrato.id));
      }
      estado.lista = lista; persistir();
      toast(`Venda ${contrato.codigo} criada como rascunho.`);
      abrir(contrato.id, 'pacotes');
    },
  });
}

// "+ Pacote" no contrato aberto (mesmo seletor, sem vendedor).
function abrirModalPacote() {
  const c = atual();
  modalFormulario({
    id: 'form-pacote-novo', titulo: `Novo pacote na venda ${c.codigo}`, subtitulo: 'Formação (cursos rateados) ou cursos avulsos, com um número de vagas. O nome sugerido e os valores podem ser ajustados depois em "Editar pacote".', rotulo: 'Adicionar pacote',
    corpo: corpoPacote(),
    aoMontar: montarPacote,
    aoSalvar: (fd) => {
      const d = lerPacote(fd);
      const erros = Contratos.validarPacoteNovo(ctx(), d);
      if (erros.length) return erros;
      alterar((l) => Contratos.regerarParcelas(Contratos.adicionarPacote(l, ctx(), c.id, d), c.id));
      toast('Pacote adicionado.'); renderContrato();
    },
  });
}

function abrirDrawerDados() {
  const c = atual();
  drawerFormulario({
    id: 'form-dados', titulo: `Venda ${c.codigo}`, subtitulo: 'Descrição livre (sai na lista e no documento), vendedor e observações internas.', rotulo: 'Salvar',
    corpo: `
      ${campoTexto('descricao', 'Descrição', c.descricao, { placeholder: Contratos.descricao(ctx(), { ...c, descricao: '' }), opcional: true, max: 120 })}
      <p class="text-xs text-slate-500 dark:text-neutral-400 -mt-3">Vazio = descrição automática pelo que foi vendido. Use para casos como "50% da venda 2026-05-003".</p>
      ${campoSelect('vendedorId', 'Vendedor', VENDEDORES, c.vendedorId)}
      ${campoArea('observacoes', 'Observações internas', c.observacoes, { opcional: true })}`,
    foco: '[name="descricao"]',
    aoSalvar: (fd) => { alterar((l) => Contratos.atualizarDados(l, c.id, { descricao: fd.get('descricao'), vendedorId: fd.get('vendedorId'), observacoes: fd.get('observacoes') })); toast('Dados salvos.'); renderContrato(); },
  });
}

// Definir / trocar contratante (RF-06): Empresa com busca, ou Particular → Responsável cadastrado ou um aluno. Só em rascunho.
function abrirModalContratante() {
  const c = atual();
  if (!Contratos.editavel(c)) { toast('Só em rascunho — reabra a venda para trocar o contratante.'); return; }
  const empresas = ctx().empresas.filter((e) => e.status === 'ativo').sort((a, b) => Contratos.nomeEmpresa(a).localeCompare(Contratos.nomeEmpresa(b), 'pt-BR'));
  const responsaveis = (ctx().responsaveis ?? []).filter((x) => x.status === 'ativo').sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const alunos = ctx().alunos.filter((a) => a.status === 'ativo').sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const tipoAtual = c.responsavel?.tipo ?? null;
  const pendTxt = (n) => (n ? `⚠ ${plural(n, 'pendência')}` : '');
  const nAlunos = Contratos.alunoIdsDe(c).length;
  modalFormulario({
    id: 'form-contratante', titulo: c.contratante ? 'Trocar contratante' : 'Definir contratante', subtitulo: `Venda ${c.codigo}. Contra quem saem o documento, os boletos e a NF.${nAlunos ? ` Os ${plural(nAlunos, 'aluno já vinculado', 'alunos já vinculados')} ${nAlunos === 1 ? 'passa' : 'passam'} a seguir o contratante novo.` : ''}`, rotulo: 'Salvar',
    corpo: `
      <fieldset class="space-y-3">
        <legend class="rotulo">Quem contrata</legend>
        ${cartoesRadio('contratante', TIPOS_CONTRATANTE, c.contratante)}
        <div data-bloco="empresa" class="${c.contratante === 'empresa' ? '' : 'hidden'} space-y-3">
          ${cartoesRadio('empresaModo', [{ id: 'existente', nome: 'Empresa já cadastrada', descricao: 'Escolher um cadastro existente.' }, { id: 'nova', nome: 'Empresa nova — preenche pelo link', descricao: 'Você informa só razão social e CNPJ; ao salvar, abre o link para a própria empresa completar o cadastro.' }], empresas.length ? 'existente' : 'nova')}
          <div data-sub-emp="existente" class="${empresas.length ? '' : 'hidden'}">${listaSelecionavel('empresaId', empresas.map((e) => ({ id: e.id, nome: Contratos.nomeEmpresa(e), detalhe: `${esc(e.razaoSocial)} · <span class="font-mono">${esc(Clientes.fmtCnpj(e.cnpj))}</span>`, busca: `${e.nomeFantasia} ${e.razaoSocial} ${e.cnpj}`, direita: pendTxt(Clientes.pendenciasEmpresa(e).length) })), { selecionados: [c.empresaId].filter(Boolean), placeholder: 'Buscar empresa por nome ou CNPJ', vazioTxt: 'Nenhuma empresa ativa — use "Empresa nova" acima.' })}</div>
          <div data-sub-emp="nova" class="${empresas.length ? 'hidden' : ''} space-y-3">
            <div class="grid grid-cols-2 gap-3">
              ${campoTexto('novaRazaoSocial', 'Razão social', '', { placeholder: 'Como consta no CNPJ', max: 150 })}
              ${campoTexto('novaCnpj', 'CNPJ', '', { placeholder: '00.000.000/0000-00', max: 18 })}
            </div>
            <div class="grid grid-cols-2 gap-3">
              ${campoTexto('novaNomeFantasia', 'Nome fantasia', '', { opcional: true, placeholder: 'Como todo mundo chama', max: 80 })}
              ${campoTexto('novaEmail', 'E-mail (para enviar o link)', '', { tipo: 'email', opcional: true, max: 120 })}
            </div>
            <p class="text-xs text-slate-500 dark:text-neutral-400">Endereço, cobrança/NF e pessoas de contato quem preenche é o RH/financeiro da empresa, pelo link.</p>
          </div>
        </div>
        <div data-bloco="particular" class="${c.contratante === 'particular' ? '' : 'hidden'} space-y-3">
          <p class="rotulo">Responsável financeiro (único, paga por todos os alunos)</p>
          ${cartoesRadio('responsavelTipo', TIPOS_RESPONSAVEL_CONTRATO, tipoAtual)}
          <div data-sub="responsavel" class="${tipoAtual === 'responsavel' ? '' : 'hidden'}">
            ${listaSelecionavel('responsavelId', responsaveis.map((x) => ({ id: x.id, nome: x.nome, detalhe: `<span class="font-mono">${esc(Clientes.fmtCpf(x.cpf))}</span> · ${esc(x.email || 'sem e-mail')}`, busca: `${x.nome} ${x.cpf} ${x.email}`, direita: pendTxt(Clientes.pendenciasResponsavel(x).length) })), { selecionados: tipoAtual === 'responsavel' ? [c.responsavel.id] : [], placeholder: 'Buscar responsável por nome, CPF ou e-mail', vazioTxt: 'Nenhum responsável ativo.' })}
            <p class="text-xs text-slate-500 dark:text-neutral-400 mt-1">Não achou? <a href="responsaveis.html" class="text-petrol-800 dark:text-sky-300 hover:underline">Cadastre em Responsáveis</a>. Os alunos da venda ficam vinculados a ele com o papel financeiro.</p>
          </div>
          <div data-sub="aluno" class="${tipoAtual === 'aluno' ? '' : 'hidden'}">
            ${listaSelecionavel('alunoRespId', alunos.map((a) => ({ id: a.id, nome: a.nomeSocial || a.nome, detalhe: `<span class="font-mono">${esc(Clientes.fmtCpf(a.cpf))}</span> · ${esc(nomeDe(PAGADORES, a.pagador))}${a.pagador === 'terceiro' && a.responsavel?.nome ? ` (${esc(a.responsavel.nome)})` : ''}`, busca: `${a.nome} ${a.nomeSocial} ${a.cpf} ${a.email}`, direita: pendTxt(Clientes.pendenciasAluno(a, ctx().empresas).length) })), { selecionados: tipoAtual === 'aluno' ? [c.responsavel.id] : [], placeholder: 'Buscar aluno por nome, CPF ou e-mail', vazioTxt: 'Nenhum aluno ativo.' })}
            <p class="text-xs text-slate-500 dark:text-neutral-400 mt-1">Se o aluno tiver "quem paga = outra pessoa", o responsável cadastrado nele é quem assina e paga.</p>
          </div>
        </div>
      </fieldset>`,
    aoMontar: (f) => {
      ligarListas(f);
      f.querySelectorAll('input[name="contratante"]').forEach((r) => r.addEventListener('change', () => f.querySelectorAll('[data-bloco]').forEach((b) => b.classList.toggle('hidden', b.dataset.bloco !== r.value))));
      f.querySelectorAll('input[name="responsavelTipo"]').forEach((r) => r.addEventListener('change', () => f.querySelectorAll('[data-sub]').forEach((b) => b.classList.toggle('hidden', b.dataset.sub !== r.value))));
      f.querySelectorAll('input[name="empresaModo"]').forEach((r) => r.addEventListener('change', () => f.querySelectorAll('[data-sub-emp]').forEach((b) => b.classList.toggle('hidden', b.dataset.subEmp !== r.value))));
    },
    aoSalvar: (fd) => {
      const contratante = fd.get('contratante');
      const tipo = fd.get('responsavelTipo');
      let novaEmpresaId = null;
      if (contratante === 'empresa' && fd.get('empresaModo') === 'nova') {
        const nova = { razaoSocial: fd.get('novaRazaoSocial'), cnpj: fd.get('novaCnpj'), nomeFantasia: fd.get('novaNomeFantasia'), email: fd.get('novaEmail') };
        const errosNova = Clientes.validarEmpresa(nova, estado.clientes.empresas).map((e2) => ({ ...e2, campo: { razaoSocial: 'novaRazaoSocial', cnpj: 'novaCnpj', email: 'novaEmail' }[e2.campo] ?? e2.campo }));
        if (errosNova.length) return errosNova;
        const r2 = Clientes.incluirEmpresa(estado.clientes, nova);
        estado.clientes = Clientes.gerarCadastroEmpresa(r2.dados, r2.empresa.id);
        Clientes.salvar(estado.clientes);
        estado.ctx.empresas = estado.clientes.empresas;
        novaEmpresaId = r2.empresa.id;
      }
      const d = { contratante, empresaId: novaEmpresaId ?? fd.get('empresaId'), responsavel: contratante === 'particular' ? { tipo, id: tipo === 'responsavel' ? fd.get('responsavelId') : fd.get('alunoRespId') } : null };
      const erros = Contratos.validarContratante(ctx(), d).map((e) => (e.campo === 'responsavelId' && tipo === 'aluno' ? { ...e, campo: 'alunoRespId' } : e));
      if (erros.length) return erros;
      alterar((l) => Contratos.definirContratante(l, ctx(), c.id, d));
      sincronizarClientes(Contratos.alunoIdsDe(atual()));
      if (novaEmpresaId) {
        toast(`"${Contratos.nomeEmpresa(Clientes.porId(ctx().empresas, novaEmpresaId))}" criada — envie o link para ela preencher o cadastro.`);
        renderContrato();
        setTimeout(abrirModalCadastroEmpresa, 0); // depois que o modal do formulário fechar
        return;
      }
      const empSalva = contratante === 'empresa' ? Clientes.porId(ctx().empresas, d.empresaId) : null;
      const pendSalva = empSalva ? Clientes.pendenciasEmpresa(empSalva).length : 0;
      toast(`${c.contratante ? 'Contratante trocado.' : 'Contratante definido.'}${pendSalva ? ` Cadastro da empresa com ${plural(pendSalva, 'pendência')} — use "Pedir para a própria empresa preencher", no Resumo.` : ''}`); renderContrato();
    },
  });
}

// Editar pacote (RF-08): nome, vagas e o molde (turma sempre; valores só em rascunho). Opção de aplicar o molde
// novo aos alunos sem ajustes (RN-05 [sup.]).
function abrirDrawerPacote(pacoteId) {
  const c = atual();
  const p = Contratos.pacoteDe(c, pacoteId);
  if (!p) return;
  const editavel = Contratos.editavel(c);
  const vg = Contratos.vagasDoPacote(c, p);
  const vinculos = Contratos.vinculosDoPacote(c, p.id).filter((v) => v.situacao !== 'recusado');
  const naoAjustados = vinculos.filter((v) => !v.ajustado).length;
  const dec = (n) => String(n).replace('.', ',');
  const linha = (it, idx) => {
    const curso = Contratos.cursoDe(ctx(), it.cursoId);
    const turmas = Cursos.turmasDoCurso(it.cursoId);
    return `
      <tr class="align-top">
        <td class="py-2 pr-2 text-sm text-slate-800 dark:text-neutral-100">${esc(curso ? `${curso.codigo} · ${curso.nome}` : 'Curso removido')}${it.formacaoId ? '<br><span class="text-[11px] text-slate-400">rateio da formação</span>' : ''}${it.avisoTabela ? `<br>${pilula(PILULA.ambar, 'tabela mudou', `era ${moeda(it.avisoTabela.original)}, hoje ${moeda(it.avisoTabela.atual)}`)}` : ''}</td>
        <td class="py-2 px-1"><select name="itens.${idx}.turmaId" class="campo h-9 text-xs py-0"><option value="">A definir</option>${turmas.map((tu) => `<option value="${tu.id}" ${it.turmaId === tu.id ? 'selected' : ''}>${esc(`${tu.codigo} · ${Contratos.fmtData(tu.inicio)} · ${tu.turno}`)}</option>`).join('')}</select></td>
        <td class="py-2 px-1 w-28"><input name="itens.${idx}.valorBase" inputmode="decimal" class="campo h-9 text-xs text-right" value="${esc(dec(it.valorBase))}" ${editavel ? '' : 'disabled'}>${ERRO(`itens.${idx}.valorBase`)}</td>
        <td class="py-2 pl-1 w-28"><input name="itens.${idx}.valorFinal" inputmode="decimal" class="campo h-9 text-xs text-right" value="${esc(dec(it.valorFinal))}" ${editavel ? '' : 'disabled'}>${ERRO(`itens.${idx}.valorFinal`)}</td>
      </tr>`;
  };
  drawerFormulario({
    id: 'form-pacote', titulo: `Pacote "${esc(p.nome)}"`, subtitulo: editavel ? 'Nome, vagas e o molde (turma e valores de cada item). Vale para as vagas livres e para quem entrar daqui em diante.' : 'Depois do documento as vagas só aumentam e só a turma dos itens pode mudar.', rotulo: 'Salvar', largura: 'max-w-2xl',
    corpo: `
      <div class="grid grid-cols-3 gap-3">
        <div class="col-span-2">${campoTexto('nome', 'Nome do pacote', p.nome, { max: 80 })}</div>
        ${campoTexto('vagas', 'Vagas', p.vagas, { tipo: 'number', extra: `min="${Math.max(1, vg.ocupadas)}" step="1"` })}
      </div>
      <p class="text-xs text-slate-500 dark:text-neutral-400 -mt-3">${vg.ocupadas ? `${plural(vg.ocupadas, 'vaga ocupada', 'vagas ocupadas')} — não dá para reduzir abaixo disso.` : 'Nenhuma vaga ocupada ainda.'} Vaga vazia é cobrada pelo valor do pacote.</p>
      <div>
        <p class="rotulo">Molde do pacote</p>
        <table class="w-full">
          <thead class="text-left text-xs font-medium text-slate-500 dark:text-neutral-400"><tr><th class="py-1 pr-2">Item</th><th class="py-1 px-1">Turma</th><th class="py-1 px-1 text-right">Base</th><th class="py-1 pl-1 text-right">Final</th></tr></thead>
          <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">${p.itens.map(linha).join('')}</tbody>
        </table>
        ${ERRO('itens')}
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-1">Valor do pacote = soma dos valores finais. Para pôr ou tirar cursos, crie outro pacote (ou ajuste item a item no aluno).</p>
      </div>
      ${vinculos.length && editavel ? `
      <label class="flex items-start gap-3 rounded-lg border border-slate-300 dark:border-neutral-700 p-3 cursor-pointer">
        <input type="checkbox" name="aplicar" class="${CHECK} mt-0.5">
        <span><span class="block text-sm font-medium text-slate-800 dark:text-neutral-100">Aplicar o molde novo aos alunos que não têm ajustes</span><span class="block text-xs text-slate-500 dark:text-neutral-400">${naoAjustados} de ${plural(vinculos.length, 'aluno')} deste pacote. Alunos com ajustes individuais nunca são sobrescritos; sem marcar, o molde novo vale só para vagas livres e novos alunos.</span></span>
      </label>` : ''}`,
    foco: '[name="nome"]',
    aoSalvar: (fd) => {
      const itens = p.itens.map((it, idx) => ({ formacaoId: it.formacaoId ?? null, cursoId: it.cursoId, turmaId: fd.get(`itens.${idx}.turmaId`) || null, valorBase: editavel ? fd.get(`itens.${idx}.valorBase`) : it.valorBase, valorFinal: editavel ? fd.get(`itens.${idx}.valorFinal`) : it.valorFinal, ...(it.avisoTabela ? { avisoTabela: it.avisoTabela } : {}) }));
      const d = { nome: fd.get('nome'), vagas: fd.get('vagas'), itens };
      const erros = Contratos.validarPacoteEdicao(c, pacoteId, d);
      if (erros.length) return erros;
      alterar((l) => Contratos.regerarParcelas(Contratos.atualizarPacote(l, c.id, pacoteId, d, { aplicarAosAlunos: fd.get('aplicar') === 'on' }), c.id));
      toast('Pacote atualizado.'); renderContrato();
    },
  });
}

// Duplicar contrato (RF-23/24): o usuário escolhe o que copiar; a cópia nasce rascunho.
function abrirModalDuplicar() {
  const c = atual();
  const o = Contratos.OPCOES_DUPLICAR_PADRAO;
  const r = Contratos.responsavelFinanceiro(ctx(), c);
  const chk = (k, rot, desc, { desabilitado = false } = {}) => `
      <label class="flex items-start gap-3 rounded-lg border border-slate-300 dark:border-neutral-700 p-3 ${desabilitado ? 'opacity-50' : 'cursor-pointer hover:border-slate-400 dark:hover:border-neutral-500'}">
        <input type="checkbox" name="${k}" class="${CHECK} mt-0.5" ${o[k] && !desabilitado ? 'checked' : ''} ${desabilitado ? 'disabled' : ''}>
        <span><span class="block text-sm font-medium text-slate-800 dark:text-neutral-100">${rot}</span><span class="block text-xs text-slate-500 dark:text-neutral-400">${desc}</span></span>
      </label>`;
  const ocupantes = c.alunos.filter(Contratos.ocupaVaga).length;
  const previa0 = Contratos.previaDuplicar(ctx(), c, {});
  const root = abrirModal(`
    <form id="form-dup" novalidate class="flex flex-col min-h-0">
      <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
        <div>
          <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Duplicar venda <span class="font-mono">${esc(c.codigo)}</span></h3>
          <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Os pacotes (itens e valores) sempre vão junto. Documento, assinaturas, envelopes, parcelas emitidas, NF, histórico e links dos pacotes nunca são copiados.</p>
        </div>
        <button type="button" data-fechar-modal class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${ICONE.fechar}</button>
      </div>
      <div class="px-5 py-4 space-y-4 overflow-y-auto text-sm text-slate-700 dark:text-neutral-200">
        <div class="grid sm:grid-cols-2 gap-2">
          ${chk('vagas', 'Vagas de cada pacote', 'Desmarcado: 1 vaga por pacote (ou o nº de alunos copiados).')}
          ${chk('condicao', 'Condição de pagamento', `${c.cobranca.parcelas}× · ${esc(nomeDe(FORMAS_COBRANCA, c.cobranca.forma))}${c.cobranca.primeiroVencimento ? ` · 1º venc. ${esc(Contratos.fmtData(c.cobranca.primeiroVencimento))}` : ''}${c.cobranca.pedidoCompra ? ` · PO ${esc(c.cobranca.pedidoCompra)}` : ''}`)}
          ${chk('descricao', 'Descrição e observações', c.descricao || c.observacoes ? esc([c.descricao, c.observacoes].filter(Boolean).join(' · ')).slice(0, 90) : 'Sem descrição/observações no original.')}
          ${chk('vendedor', 'Vendedor', `${esc(nomeDe(VENDEDORES, c.vendedorId))}; desmarcado → Ana Souza (usuária atual).`)}
          ${chk('alunos', 'Alunos vinculados', ocupantes ? `${plural(ocupantes, 'aluno')} entram como aprovados, com os itens individuais.` : 'Nenhum aluno ocupando vaga no original.', { desabilitado: !ocupantes })}
          ${chk('contratante', 'Contratante', c.contratante ? `${esc(r.nome)} (${c.contratante === 'empresa' ? 'empresa' : 'particular'}); desmarcado → definir depois.` : 'O original não tem contratante.', { desabilitado: !c.contratante })}
        </div>
        <div class="grid sm:grid-cols-2 gap-4">
          <div><p class="rotulo">Turmas dos itens</p>${cartoesRadio('turmas', [{ id: 'definir', nome: 'Turma a definir', descricao: 'Os itens nascem sem turma; define-se depois.' }, { id: 'manter', nome: 'Manter as mesmas turmas', descricao: 'Copia a turma de cada item do original.' }], o.turmas, 'grid-cols-1')}</div>
          <div><p class="rotulo">Valores</p>${cartoesRadio('valores', [{ id: 'negociado', nome: 'Negociado', descricao: 'Mantém base e final do original.' }, { id: 'tabela', nome: 'Tabela atual', descricao: 'Base e final viram o preço de catálogo de hoje (o desconto se perde).' }], o.valores, 'grid-cols-1')}</div>
        </div>
        <div id="dup-resumo" class="rounded-lg border border-petrol-800/20 dark:border-sky-800 bg-petrol-800/5 dark:bg-sky-950/40 px-3 py-2 text-sm text-petrol-900 dark:text-sky-200"></div>
        ${previa0.avisos.length ? `
        <div class="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
          <p class="font-semibold">Tabela mudou em ${plural(previa0.avisos.length, 'item', 'itens')} — a cópia recebe a pílula "tabela mudou":</p>
          <ul class="list-disc pl-5 mt-1 space-y-0.5">${previa0.avisos.map((a) => `<li>${esc(a.pacote)} · ${esc(a.rotulo)}: era ${moeda(a.original)}, hoje ${moeda(a.atual)}</li>`).join('')}</ul>
        </div>` : '<p class="text-xs text-slate-500 dark:text-neutral-400">Preços de catálogo iguais aos do original — sem avisos de tabela.</p>'}
      </div>
      <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
        <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
        <button type="submit" class="${BOTAO_PRI}">Duplicar</button>
      </div>
    </form>`, 'max-w-2xl');
  const form = root.querySelector('#form-dup');
  const ler = () => ({ vagas: form.vagas.checked, condicao: form.condicao.checked, descricao: form.descricao.checked, vendedor: form.vendedor.checked, alunos: form.alunos.checked, contratante: form.contratante.checked, turmas: form.turmas.value, valores: form.valores.value });
  const atualizarResumo = () => {
    const pv = Contratos.previaDuplicar(ctx(), c, ler());
    form.querySelector('#dup-resumo').innerHTML = `Será criado um rascunho com <strong>${plural(pv.nPacotes, 'pacote')} · ${plural(pv.vagas, 'vaga')} · ${plural(pv.nAlunos, 'aluno')}</strong>${pv.opcoes.contratante ? '' : ' · sem contratante (definir depois)'}${pv.opcoes.valores === 'tabela' ? ' · valores pela tabela atual' : ''}.`;
  };
  form.querySelectorAll('input').forEach((i) => i.addEventListener('change', atualizarResumo));
  atualizarResumo();
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { lista, contrato } = Contratos.duplicar(estado.lista, ctx(), c.id, ler(), { vendedorAtual: 'ana' });
    if (!contrato) { toast('Não foi possível duplicar.'); return; }
    estado.lista = lista; persistir();
    if (contrato.contratante) { estado.selecionado = contrato.id; sincronizarClientes(Contratos.alunoIdsDe(contrato)); estado.selecionado = c.id; }
    fecharModal();
    toast(`Venda ${contrato.codigo} criada a partir de ${c.codigo}.`);
    abrir(contrato.id, 'pacotes');
  });
}

// ---- Link do pacote (RF-15 a RF-17) ----
// Um link reutilizável por pacote: o aluno preenche o próprio cadastro e entra aguardando conferência.

function abrirModalLinkPacote(pacoteId) {
  let c = atual();
  let p = Contratos.pacoteDe(c, pacoteId);
  if (!p) return;
  if (!p.convite) {
    if (c.status === 'cancelado') { toast('Venda cancelada — sem link de cadastro.'); return; }
    alterar((l) => Contratos.gerarConvitePacote(l, c.id, pacoteId)); c = atual(); p = Contratos.pacoteDe(c, pacoteId); renderContrato();
  }
  const v = p.convite;
  const vg = Contratos.vagasDoPacote(c, p);
  const sit = Contratos.situacaoConvite(c, p);
  const aberto = sit === 'aberto';
  const emp = Contratos.empresaDe(ctx(), c);
  const url = Contratos.urlConvitePacote(p, 'formulario');
  const urlPassos = Contratos.urlConvitePacote(p, 'passos');
  const msg = Contratos.mensagemConvite(ctx(), c, p, url);
  const usos = [...v.usos].reverse();
  const motivo = { desativado: 'ninguém consegue se cadastrar até reativar.', sem_vaga: 'aumente as vagas do pacote para voltar a aceitar.', sem_contratante: 'defina o contratante da venda para abrir o link.', cancelado: 'venda cancelada.', sem_link: '' }[sit] ?? '';
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
      <div>
        <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Link do pacote "${esc(p.nome)}"</h3>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Venda <span class="font-mono">${esc(c.codigo)}</span>${emp ? ` · ${esc(Contratos.nomeEmpresa(emp))}` : ''}. Reutilizável: cada aluno abre, preenche nome, CPF, contato, endereço, necessidades e aceite LGPD, e entra neste pacote <strong>aguardando conferência</strong>. CPF já cadastrado é reconhecido e reaproveitado.</p>
      </div>
      <button type="button" data-fechar-modal class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${ICONE.fechar}</button>
    </div>
    <div class="px-5 py-4 space-y-4 overflow-y-auto">
      <div class="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm ${aberto ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'}">
        ${aberto ? ICONE.check : ICONE.alerta}
        <span class="flex-1"><strong>${esc(Contratos.SITUACOES_CONVITE[sit])}</strong> · ${usos.length} ${usos.length === 1 ? 'entrou' : 'entraram'} · ${plural(vg.livres, 'vaga livre', 'vagas livres')} de ${vg.vagas}${aberto ? '' : ` — ${esc(motivo)}`} <span class="opacity-70">· gerado em ${esc(Contratos.fmtDataHora(v.criadoEm))}</span></span>
        ${sit === 'sem_contratante' && Contratos.editavel(c) ? `<button type="button" id="btn-link-contratante" class="${BOTAO_PRI} h-8">Definir contratante</button>` : ''}
        ${sit === 'sem_vaga' && c.status !== 'cancelado' ? `<button type="button" id="btn-link-vagas" class="${BOTAO_SEC} h-8">Aumentar vagas</button>` : ''}
      </div>
      ${linhaLinkContrato('lk-pacote-form', 'Formulário único', 'tudo numa página, bom para quem já tem os dados à mão', url)}
      ${linhaLinkContrato('lk-pacote-passos', 'Passo a passo', 'uma etapa por vez, com revisão no final — bom no celular', urlPassos)}
      <div class="flex flex-wrap items-center gap-2">
        <a href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener" class="${BOTAO_SEC} text-emerald-700 dark:text-emerald-400">Enviar por WhatsApp</a>
        <a href="mailto:?subject=${encodeURIComponent('Seu cadastro na ProWay')}&body=${encodeURIComponent(msg)}" class="${BOTAO_SEC}">Enviar por e-mail</a>
        <label class="ml-auto flex items-center justify-between gap-3 cursor-pointer rounded-lg border border-slate-300 dark:border-neutral-700 px-3 h-9">
          <span class="text-sm font-medium text-slate-800 dark:text-neutral-100">Link ativo</span>
          <input type="checkbox" id="chk-ativo" class="${CHECK}" ${v.ativo ? 'checked' : ''} ${c.status === 'cancelado' ? 'disabled' : ''}>
        </label>
      </div>
      <p class="text-xs text-slate-500 dark:text-neutral-400 -mt-2">Mensagem padrão: <span class="italic">${esc(msg.replace(url, '<link>'))}</span></p>
      <div>
        <p class="rotulo">Quem entrou por este link</p>
        ${usos.length ? `
        <ul class="divide-y divide-slate-100 dark:divide-neutral-900 rounded-lg border border-slate-200 dark:border-neutral-800 max-h-48 overflow-y-auto">
          ${usos.map((u) => { const a = alunoDe(u.alunoId); const vin = Contratos.vinculoDe(c, u.alunoId); const s = vin ? Contratos.situacaoVinculoDe(vin) : null; return `<li class="flex flex-wrap items-center gap-2 px-3 py-1.5 text-sm"><span class="flex-1 truncate">${a ? linkCliente('aluno', a.id, a.nomeSocial || a.nome) : '<span class="text-slate-400">aluno excluído</span>'}</span>${s ? pilula({ aguardando: PILULA.ambar, aprovado: PILULA.verde, recusado: PILULA.vermelha, desistente: PILULA.neutra }[vin.situacao], s.nome, s.descricao) : pilula(PILULA.neutra, 'fora da venda')}<span class="text-xs text-slate-400 whitespace-nowrap">${esc(Contratos.fmtDataHora(u.em))}</span></li>`; }).join('')}
        </ul>` : '<p class="text-sm text-slate-400">Ninguém ainda.</p>'}
      </div>
      <p class="text-xs text-slate-500 dark:text-neutral-400">Protótipo: o link funciona neste navegador (mesmo localStorage) — depois que um aluno enviar, recarregue esta página. Em produção o token tem validade.</p>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-2">
      <button type="button" id="btn-novo-link" class="${BOTAO_LINK}" ${c.status === 'cancelado' ? 'disabled' : ''}>Gerar novo link (invalida o atual)</button>
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Fechar</button>
    </div>`, 'max-w-3xl');

  const reabrir = () => { fecharModal(); renderContrato(); abrirModalLinkPacote(pacoteId); };
  root.querySelectorAll('[data-copiar]').forEach((b) => b.addEventListener('click', async () => {
    const campo = root.querySelector(`#${b.dataset.copiar}`);
    try { await navigator.clipboard.writeText(campo.value); toast('Link copiado.'); }
    catch (_) { campo.select(); toast('Selecione e copie o link.'); }
  }));
  root.querySelector('#chk-ativo').addEventListener('change', (e) => { alterar((l) => Contratos.alterarConvitePacote(l, c.id, pacoteId, { ativo: e.target.checked })); toast(e.target.checked ? 'Link ativado.' : 'Link desativado.'); reabrir(); });
  root.querySelector('#btn-link-contratante')?.addEventListener('click', () => { fecharModal(); abrirModalContratante(); });
  root.querySelector('#btn-link-vagas')?.addEventListener('click', () => { fecharModal(); abrirDrawerPacote(pacoteId); });
  root.querySelector('#btn-novo-link').addEventListener('click', () => modalConfirmacao({
    titulo: 'Gerar novo link', rotulo: 'Gerar novo link', tom: 'petrol',
    corpo: `<p>O link atual do pacote <strong>${esc(p.nome)}</strong> deixa de valer: quem ainda tiver o endereço antigo verá "link inválido ou expirado". Os ${usos.length} ${usos.length === 1 ? 'aluno que já entrou continua' : 'alunos que já entraram continuam'} na venda.</p>`,
    aoConfirmar: () => { alterar((l) => Contratos.gerarConvitePacote(l, c.id, pacoteId)); toast('Novo link gerado; o anterior deixou de valer.'); renderContrato(); abrirModalLinkPacote(pacoteId); },
  }));
}

// Link para a própria empresa contratante (RH/financeiro) completar o cadastro — mesmo token
// da tela de Clientes (Clientes.gerarCadastroEmpresa): abre cadastro-empresa.html?token=.
function abrirModalCadastroEmpresa() {
  const c = atual();
  let emp = Contratos.empresaDe(ctx(), c);
  if (!emp) return;
  if (!emp.cadastro) {
    estado.clientes = Clientes.gerarCadastroEmpresa(estado.clientes, emp.id);
    Clientes.salvar(estado.clientes);
    estado.ctx.empresas = estado.clientes.empresas;
    emp = Contratos.empresaDe(ctx(), c);
    renderContrato();
  }
  const url = Clientes.urlCadastroEmpresa(emp, 'formulario');
  const urlPassos = Clientes.urlCadastroEmpresa(emp, 'passos');
  const preenchido = Boolean(emp.cadastro.preenchidoEm);
  const pend = Clientes.pendenciasEmpresa(emp);
  const ct = Clientes.contatoPrincipal(emp);
  const msg = `Olá! Para formalizarmos o contrato ${c.codigo} da ProWay com a ${Contratos.nomeEmpresa(emp)}, preencha os dados da empresa neste link: ${url}`;
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
      <div>
        <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Link para a ${esc(Contratos.nomeEmpresa(emp))} completar o cadastro</h3>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Venda <span class="font-mono">${esc(c.codigo)}</span>. O RH ou financeiro abre o link, confere o que já foi digitado e completa razão social, endereço fiscal, cobrança/NF e pessoas de contato — o que destrava documento, boleto e nota fiscal.</p>
      </div>
      <button type="button" data-fechar-modal class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${ICONE.fechar}</button>
    </div>
    <div class="px-5 py-4 space-y-4 overflow-y-auto">
      ${preenchido
        ? `<div class="flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">${ICONE.check} <span class="flex-1">Preenchido pela empresa em ${esc(Clientes.fmtData(emp.cadastro.preenchidoEm.slice(0, 10)))} — o link já não aceita novos envios.${pend.length ? ` Ainda falta: ${pend.map(esc).join(' · ')}.` : ''}</span></div>`
        : `<div class="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">${ICONE.alerta} <span class="flex-1"><strong>Aguardando a empresa</strong> · link gerado em ${esc(Clientes.fmtData(emp.cadastro.criadoEm))}${pend.length ? ` · falta: ${pend.map(esc).join(' · ')}` : ''}</span></div>`}
      ${linhaLinkContrato('lk-emp-form', 'Formulário único', 'tudo numa página, bom para quem já tem os dados à mão', url)}
      ${linhaLinkContrato('lk-emp-passos', 'Passo a passo', 'uma etapa por vez, com revisão no final — bom no celular', urlPassos)}
      <div class="flex flex-wrap items-center gap-2">
        <a href="https://wa.me/${ct?.celular ? `55${esc(String(ct.celular).replace(/\D/g, ''))}` : ''}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener" class="${BOTAO_SEC} text-emerald-700 dark:text-emerald-400">Enviar por WhatsApp${ct?.celular ? ` para ${esc(ct.nome.split(' ')[0])}` : ''}</a>
        <a href="mailto:${esc(ct?.email || emp.email || '')}?subject=${encodeURIComponent('Complete o cadastro da empresa — ProWay')}&body=${encodeURIComponent(msg)}" class="${BOTAO_SEC}">Enviar por e-mail</a>
      </div>
      <p class="text-xs text-slate-500 dark:text-neutral-400 -mt-2">Mensagem padrão: <span class="italic">${esc(msg.replace(url, '<link>'))}</span></p>
      <p class="text-xs text-slate-500 dark:text-neutral-400">Protótipo: o link funciona neste navegador (mesmo localStorage) — depois que a empresa enviar, recarregue esta página. Em produção o token expira e é de uso único.</p>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-2">
      <button type="button" id="btn-novo-link" class="${BOTAO_LINK}">Gerar novo link (invalida o atual)</button>
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Fechar</button>
    </div>`, 'max-w-3xl');
  root.querySelectorAll('[data-copiar]').forEach((b) => b.addEventListener('click', async () => {
    const campoLk = root.querySelector(`#${b.dataset.copiar}`);
    try { await navigator.clipboard.writeText(campoLk.value); toast('Link copiado.'); }
    catch (_) { campoLk.select(); toast('Selecione e copie o link.'); }
  }));
  root.querySelector('#btn-novo-link').addEventListener('click', () => modalConfirmacao({
    titulo: 'Gerar novo link', rotulo: 'Gerar novo link', tom: 'petrol',
    corpo: `<p>O link atual da <strong>${esc(Contratos.nomeEmpresa(emp))}</strong> deixa de valer: quem ainda tiver o endereço antigo verá "link inválido ou expirado".</p>`,
    aoConfirmar: () => {
      estado.clientes = Clientes.gerarCadastroEmpresa(estado.clientes, emp.id);
      Clientes.salvar(estado.clientes);
      estado.ctx.empresas = estado.clientes.empresas;
      toast('Novo link gerado; o anterior deixou de valer.');
      renderContrato();
      abrirModalCadastroEmpresa();
    },
  }));
}

function abrirDrawerItem(itemId) {
  const c = atual();
  const it = Contratos.itemDe(c, itemId);
  const curso = Contratos.cursoDe(ctx(), it.cursoId);
  const turmas = Cursos.turmasDoCurso(it.cursoId);
  const editavel = Contratos.editavel(c);
  const aluno = alunoDe(it.alunoId);
  drawerFormulario({
    id: 'form-item', titulo: `${curso.codigo} · ${curso.nome}`, subtitulo: `${esc(aluno?.nomeSocial || aluno?.nome || '')} · ${editavel ? 'turma em que o curso será feito e valores deste item.' : 'depois do documento gerado só a turma pode mudar.'}`, rotulo: 'Salvar',
    corpo: `
      ${campoSelect('turmaId', 'Turma', turmas.map((t) => ({ id: t.id, nome: `${t.codigo} · ${Contratos.fmtData(t.inicio)} a ${Contratos.fmtData(t.fim)} · ${TIPOS_TURMA[t.tipo]} · ${t.turno}` })), it.turmaId, { opcional: true, placeholder: 'A definir' })}
      ${turmas.length ? '' : '<p class="text-xs text-slate-500 dark:text-neutral-400 -mt-3">Nenhuma turma cadastrada para este curso — fica "a definir".</p>'}
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('valorBase', 'Valor base', String(it.valorBase).replace('.', ','), { extra: `inputmode="decimal" ${editavel ? '' : 'disabled'}` })}
        ${campoTexto('valorFinal', 'Valor final', String(it.valorFinal).replace('.', ','), { extra: `inputmode="decimal" ${editavel ? '' : 'disabled'}` })}
      </div>
      <p class="text-xs text-slate-500 dark:text-neutral-400 -mt-3">Referência do catálogo: ${moeda(curso.comercial.precoReferencia)}${it.formacaoId ? ' · neste item o valor vem do rateio da formação' : ''}.</p>`,
    foco: '[name="turmaId"]',
    aoSalvar: (fd) => {
      const d = { turmaId: fd.get('turmaId'), valorBase: editavel ? fd.get('valorBase') : it.valorBase, valorFinal: editavel ? fd.get('valorFinal') : it.valorFinal };
      const erros = Contratos.validarItem(d);
      if (erros.length) return erros;
      alterar((l) => Contratos.regerarParcelas(Contratos.atualizarItem(l, c.id, itemId, d), c.id));
      toast('Item atualizado.'); renderContrato();
    },
  });
}

// Desconto (%) sobre o valor base — geral (moldes + alunos sem ajustes), de um pacote, ou só dos itens de um aluno.
function abrirDrawerDesconto({ pacoteId = null, alunoId = null } = {}) {
  const c = atual();
  const a = alunoId ? alunoDe(alunoId) : null;
  const p = pacoteId ? Contratos.pacoteDe(c, pacoteId) : null;
  const titulo = a ? `Desconto para ${a.nomeSocial || a.nome}` : p ? `Desconto no pacote "${p.nome}"` : 'Desconto geral';
  const alvo = a ? 'dos itens deste aluno (fica marcado como "difere do pacote")' : p ? 'do molde deste pacote e dos alunos dele sem ajustes' : 'de todos os pacotes e dos alunos sem ajustes';
  drawerFormulario({
    id: 'form-desc', titulo: esc(titulo), subtitulo: `Percentual aplicado sobre o valor base ${alvo}. Alunos com ajustes individuais não são tocados.`, rotulo: 'Aplicar',
    corpo: campoTexto('percentual', 'Desconto (%)', '', { tipo: 'number', extra: 'min="0" max="100" step="0.5"' }),
    foco: '[name="percentual"]',
    aoSalvar: (fd) => { const pct = Number(fd.get('percentual')); if (fd.get('percentual') === '' || Number.isNaN(pct) || pct < 0 || pct > 100) return [{ campo: 'percentual', mensagem: 'Entre 0 e 100.' }]; alterar((l) => Contratos.regerarParcelas(Contratos.aplicarDesconto(l, c.id, pct, { pacoteId, alunoId }), c.id)); toast(`Desconto de ${pct}% aplicado.`); renderContrato(); },
  });
}

// Copia os itens ativos de outro aluno do mesmo pacote para este.
function abrirDrawerCopiar(paraAlunoId) {
  const c = atual();
  const para = alunoDe(paraAlunoId);
  const v = Contratos.vinculoDe(c, paraAlunoId);
  const outros = Contratos.vinculosDoPacote(c, v.pacoteId).filter((x) => x.alunoId !== paraAlunoId && Contratos.ocupaVaga(x) && x.itens.some(Contratos.matriculaAtiva)).map((x) => alunoDe(x.alunoId)).filter(Boolean);
  drawerFormulario({
    id: 'form-copiar', titulo: `Copiar itens para ${esc(para?.nomeSocial || para?.nome || paraAlunoId)}`, subtitulo: 'Os itens ativos do aluno escolhido (mesmo pacote; formação e cursos, com turma e valores) são copiados; o que ele já tiver não se repete.', rotulo: 'Copiar',
    corpo: listaSelecionavel('deAlunoId', outros.map((x) => ({ id: x.id, nome: x.nomeSocial || x.nome, detalhe: Contratos.gruposDoAluno(ctx(), c, x.id).map((g) => (g.formacao ? esc(g.formacao.nome) : plural(g.itens.length, 'curso avulso', 'cursos avulsos'))).join(' · '), busca: x.nome, direita: moeda(Contratos.totais(c).porAluno.find((pa) => pa.alunoId === x.id)?.final ?? 0) })), { placeholder: 'Buscar aluno', vazioTxt: 'Nenhum outro aluno com itens neste pacote.' }),
    aoMontar: ligarListas,
    aoSalvar: (fd) => { const de = fd.get('deAlunoId'); if (!de) return [{ campo: 'deAlunoId', mensagem: 'Escolha de quem copiar.' }]; alterar((l) => Contratos.regerarParcelas(Contratos.copiarItens(l, c.id, de, paraAlunoId), c.id)); toast('Itens copiados.'); renderContrato(); },
  });
}

function abrirDrawerCobranca() {
  const c = atual();
  const travado = Contratos.parcelasTravadas(c);
  const emp = Contratos.empresaDe(ctx(), c) ?? Contratos.responsavelFinanceiro(ctx(), c).empresa;
  const r = Contratos.responsavelFinanceiro(ctx(), c);
  const sugestaoDia = emp?.cobranca.diaVencimento ?? r.aluno?.cobranca.diaVencimento ?? null;
  const t = Contratos.totais(c);
  drawerFormulario({
    id: 'form-cobranca', titulo: 'Condição de pagamento', subtitulo: travado ? 'Já há boleto emitido ou pago: só forma e PO podem mudar.' : `Gera as parcelas sobre o total final de ${moeda(t.final)}.`, rotulo: travado ? 'Salvar' : 'Gerar parcelas',
    corpo: `
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('parcelas', 'Parcelas', c.cobranca.parcelas, { tipo: 'number', extra: `min="1" max="48" ${travado ? 'readonly' : ''}` })}
        ${campoTexto('primeiroVencimento', '1º vencimento', c.cobranca.primeiroVencimento, { tipo: 'date', extra: travado ? 'readonly' : '' })}
      </div>
      ${sugestaoDia && !c.cobranca.primeiroVencimento ? `<p class="text-xs text-slate-500 dark:text-neutral-400 -mt-3">${r.tipo === 'empresa' ? 'A empresa' : 'O aluno'} prefere vencimento no dia ${sugestaoDia}.</p>` : ''}
      ${campoSelect('forma', 'Forma de cobrança', FORMAS_COBRANCA, c.cobranca.forma)}
      ${campoTexto('pedidoCompra', 'Pedido de compra (PO)', c.cobranca.pedidoCompra, { opcional: !emp?.cobranca.exigePedidoCompra, placeholder: emp?.cobranca.exigePedidoCompra ? 'Exigido pela empresa para emitir boleto/NF' : '' })}`,
    foco: travado ? '[name="forma"]' : '[name="parcelas"]',
    aoSalvar: (fd) => {
      const d = { parcelas: fd.get('parcelas'), primeiroVencimento: fd.get('primeiroVencimento'), forma: fd.get('forma'), pedidoCompra: fd.get('pedidoCompra') };
      const erros = Contratos.validarCobranca(c, d);
      if (erros.length) return erros;
      alterar((l) => Contratos.definirCobranca(l, c.id, d));
      toast(travado ? 'Condição atualizada.' : `${d.parcelas} parcela(s) gerada(s).`); renderContrato();
    },
  });
}

// Assinatura manual de UMA parte (contratante ou ProWay), fora do Clicksign.
function abrirDrawerAssinatura() {
  const c = atual();
  const r = Contratos.responsavelFinanceiro(ctx(), c);
  const pendentes = Contratos.partesPendentes(c);
  const nomePadrao = { contratante: r.nome, escola: 'Administração ProWay' };
  drawerFormulario({
    id: 'form-ass', titulo: 'Registrar assinatura manual', subtitulo: `Assinatura feita fora do Clicksign (papel ou aceite por e-mail). Falta: ${pendentes.map((p) => p.nome).join(' e ')}.`, rotulo: 'Registrar',
    corpo: `
      <div>
        <p class="rotulo">Quem assinou</p>
        ${cartoesRadio('parte', pendentes.map((p) => ({ id: p.id, nome: p.nome, descricao: p.id === 'escola' ? ESCOLA_SIGNATARIA.nome : r.nome })), pendentes.length === 1 ? pendentes[0].id : null)}
      </div>
      ${campoTexto('assinadoEm', 'Data', Contratos.hoje(), { tipo: 'date' })}
      ${campoSelect('meio', 'Meio', MEIOS_ASSINATURA.filter((m) => m.id !== 'eletronica'), '')}
      ${campoTexto('por', 'Assinado por', pendentes.length === 1 ? nomePadrao[pendentes[0].id] : '', { max: 80 })}`,
    foco: pendentes.length === 1 ? '[name="meio"]' : null,
    aoMontar: (f) => f.querySelectorAll('input[name="parte"]').forEach((rd) => rd.addEventListener('change', () => { const campoPor = f.querySelector('[name="por"]'); if (!campoPor.value.trim() || Object.values(nomePadrao).includes(campoPor.value)) campoPor.value = nomePadrao[rd.value]; })),
    aoSalvar: (fd) => {
      const d = { parte: fd.get('parte'), assinadoEm: fd.get('assinadoEm'), meio: fd.get('meio'), por: fd.get('por') };
      const erros = Contratos.validarAssinatura(c, d);
      if (erros.length) return erros;
      alterar((l) => Contratos.registrarAssinatura(l, c.id, d));
      toast(Contratos.assinado(atual()) ? 'As duas partes assinaram — contrato assinado.' : 'Assinatura registrada; falta a outra parte.'); renderContrato();
    },
  });
}

function abrirDrawerNf() {
  const c = atual();
  const r = Contratos.responsavelFinanceiro(ctx(), c);
  const ano = Contratos.hoje().slice(0, 4);
  const usados = estado.lista.map((x) => x.nf?.numero).filter((n) => n && n.startsWith(ano)).map((n) => Number(n.slice(5)) || 0);
  const sugestao = `${ano}-${String((usados.length ? Math.max(...usados) : 0) + 1).padStart(6, '0')}`;
  drawerFormulario({
    id: 'form-nf', titulo: 'Emitir nota fiscal', subtitulo: `Contra ${esc(r.nome)} (${esc(r.documento)}), no valor de ${moeda(Contratos.totais(c).final)}${c.cobranca.pedidoCompra ? `, citando o PO ${esc(c.cobranca.pedidoCompra)}` : ''}.`, rotulo: 'Emitir',
    corpo: `${campoTexto('numero', 'Número da NF', sugestao, { max: 20 })}<p class="text-xs text-slate-500 dark:text-neutral-400 -mt-3">No sistema real o número vem do emissor (prefeitura/SEFAZ).</p>`,
    foco: '[name="numero"]',
    aoSalvar: (fd) => { if (!String(fd.get('numero')).trim()) return [{ campo: 'numero', mensagem: 'Informe o número.' }]; alterar((l) => Contratos.emitirNf(l, ctx(), c.id, fd.get('numero'))); toast('NF emitida.'); renderContrato(); },
  });
}

// Baixa manual de uma parcela: a data e o valor que entraram. Parcela em atraso já vem com multa e juros somados.
function abrirDrawerPagamento(contratoId, n, depois) {
  const c = Contratos.porId(estado.lista, contratoId);
  const p = c.parcelas.find((x) => x.n === n);
  const atraso = Contratos.vencidasComEncargos(c).find((x) => x.parcela.n === n);
  const sugerido = (p.valor + (atraso?.encargos ?? 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  drawerFormulario({
    id: 'form-pagamento', titulo: `Parcela ${n}/${c.parcelas.length} paga`, subtitulo: `Venda ${esc(c.codigo)} · ${moeda(p.valor)} com vencimento em ${esc(Contratos.fmtData(p.vencimento))}.`, rotulo: 'Registrar pagamento',
    corpo: `
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('pagoEm', 'Pago em', Contratos.hoje(), { tipo: 'date', extra: `max="${Contratos.hoje()}"` })}
        ${campoTexto('valorPago', 'Valor pago (R$)', sugerido, { extra: 'inputmode="decimal"' })}
      </div>
      ${atraso ? `<p class="text-xs text-slate-500 dark:text-neutral-400 -mt-3">Inclui ${moeda(atraso.encargos)} de multa e juros por ${plural(atraso.dias, 'dia')} de atraso (item 23). Ajuste se entrou outro valor.</p>` : ''}`,
    foco: '[name="pagoEm"]',
    aoSalvar: (fd) => {
      const d = { pagoEm: fd.get('pagoEm'), valorPago: fd.get('valorPago') };
      const erros = Contratos.validarPagamento(p, d);
      if (erros.length) return erros;
      alterar((l) => Contratos.registrarPagamento(l, c.id, n, d.pagoEm, d.valorPago));
      toast(`Parcela ${n}/${c.parcelas.length} paga em ${Contratos.fmtData(d.pagoEm)}.`); depois();
    },
  });
}

function abrirDrawerRecuperacao() {
  const c = atual();
  const venc = Contratos.parcelasVencidas(c);
  drawerFormulario({
    id: 'form-rec', titulo: 'Acordo de recuperação', subtitulo: `${plural(venc.length, 'parcela vencida', 'parcelas vencidas')} (${moeda(venc.reduce((s, p) => s + p.valor, 0))}). A venda passa de "inadimplente" para "recuperante" enquanto o acordo estiver aberto.`, rotulo: 'Registrar',
    corpo: campoArea('acordo', 'O que foi combinado', c.recuperacao?.acordo ?? '', { placeholder: 'Ex.: juntar as parcelas 2 e 3 no dia 15/09, sem juros.' }),
    foco: '[name="acordo"]',
    aoSalvar: (fd) => { if (!String(fd.get('acordo')).trim()) return [{ campo: 'acordo', mensagem: 'Descreva o acordo.' }]; alterar((l) => Contratos.registrarRecuperacao(l, c.id, fd.get('acordo'))); toast('Acordo registrado.'); renderContrato(); },
  });
}

// ---------- Modais (seleção em massa e confirmações) ----------

// `validarSelecao(ids, root)` devolve a dica que trava o Confirmar (ex.: seleção acima das vagas livres).
// `avisoSelecao(ids, root)` devolve um aviso que só INFORMA (ex.: devedor selecionado) — nunca trava o botão.
// Item: { id, nome, detalhe, busca, direita, tag, link } — `tag` é HTML (pílulas) ao lado do nome e
// `link` é a URL do cadastro, que vira o botão de abrir em outra aba; todos opcionais.
// `vazioAcao = { rotulo, aoClicar(termoBuscado, marcados) }` põe uma saída no estado vazio (ex.: cadastrar aluno novo).
// `marcadosIniciais` reabre o seletor com o que já estava marcado (usado ao voltar do cadastro).
// `alto` fixa o modal em 80% da tela (lista longa, como a de alunos); sem ele a altura acompanha o conteúdo.
// `comMarcarTodos` desliga o botão de marcar em massa onde ele não faz sentido (vaga a vaga, 03/09/2026).
// `dicaBusca` é a linha de ajuda do estado vazio quando a busca não achou nada.
function modalSelecao({ titulo, subtitulo, itens, vazioTxt, rotuloBotao, aoConfirmar, extra = '', validarSelecao = null, avisoSelecao = null, aoMontar = null, vazioAcao = null, marcadosIniciais = [], alto = false, comMarcarTodos = true, dicaBusca = '' }) {
  const marcados = new Set(marcadosIniciais.filter((id) => itens.some((i) => i.id === id)));
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
      <div><h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h3><p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${subtitulo}</p></div>
      <button type="button" data-fechar-modal class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${ICONE.fechar}</button>
    </div>
    <div class="px-5 pt-4 pb-2 flex items-center gap-2 shrink-0">${busca('busca-sel', '', 'Buscar', 'flex-1')}${comMarcarTodos ? `<button type="button" id="btn-marcar" class="${BOTAO_SEC} shrink-0"></button>` : ''}</div>
    ${extra ? `<div class="px-5 pb-2 flex flex-wrap items-center justify-between gap-2 shrink-0">${extra}</div>` : ''}
    <div id="lista-sel" class="${alto ? 'flex-1 min-h-0' : 'max-h-96'} overflow-y-auto px-3 pb-2"></div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-2">
      <span id="resumo-sel" class="text-xs text-slate-500 dark:text-neutral-400 tabular-nums"></span>
      <div class="flex items-center gap-2"><button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button><button type="button" id="btn-confirmar-sel" class="${BOTAO_PRI}" disabled></button></div>
    </div>`, `max-w-2xl${alto ? ' h-[80vh]' : ''}`);
  const lista = root.querySelector('#lista-sel'); const campoBusca = root.querySelector('#busca-sel'); const btnMarcar = root.querySelector('#btn-marcar'); const btnConfirmar = root.querySelector('#btn-confirmar-sel'); const resumo = root.querySelector('#resumo-sel');
  let visiveis = [];
  const rodape = () => {
    const n = marcados.size;
    const dica = n && validarSelecao ? validarSelecao([...marcados], root) || '' : '';
    const aviso = n && avisoSelecao ? avisoSelecao([...marcados], root) || '' : '';
    btnConfirmar.disabled = n === 0 || Boolean(dica); btnConfirmar.textContent = n ? `${rotuloBotao} (${n})` : rotuloBotao; btnConfirmar.title = dica;
    const base = dica ? `<span class="text-amber-700 dark:text-amber-300">${esc(dica)}</span>` : n ? `${n} de ${itens.length} selecionados` : `${itens.length} disponíveis`;
    resumo.innerHTML = `${base}${aviso ? ` <span class="font-medium text-red-700 dark:text-red-400">· ${esc(aviso)}</span>` : ''}`;
    if (!btnMarcar) return;
    const todos = visiveis.length > 0 && visiveis.every((i) => marcados.has(i.id));
    btnMarcar.disabled = visiveis.length === 0; btnMarcar.textContent = todos ? 'Desmarcar todos' : `Marcar ${campoBusca.value ? 'encontrados' : 'todos'}`;
  };
  // Estado vazio: lupa, o que foi buscado e as duas saídas — limpar a busca ou cadastrar na hora.
  // Centralizado na altura da lista (com `alto`, ocupa o miolo do modal em vez de ficar colado no topo).
  const vazioHtml = (termo) => `
    <div class="px-4 py-10 text-center">
      <div class="max-w-sm">
        <div class="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-neutral-900 grid place-items-center text-slate-400 dark:text-neutral-500">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
        </div>
        <p class="mt-3 text-sm font-medium text-slate-800 dark:text-neutral-100">${termo ? `Nenhum resultado para "${esc(termo)}"` : 'Nada para escolher aqui'}</p>
        <p class="mt-1 text-xs text-slate-500 dark:text-neutral-400">${termo ? esc(dicaBusca || 'Confira a escrita ou tente outro termo.') : vazioTxt}</p>
        <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
          ${termo ? `<button type="button" id="btn-limpar-sel" class="${BOTAO_SEC}">Limpar busca</button>` : ''}
          ${vazioAcao ? `<button type="button" id="btn-vazio-sel" class="${BOTAO_PRI}">${ICONE.mais} ${esc(vazioAcao.rotulo)}</button>` : ''}
        </div>
      </div>
    </div>`;

  const render = () => {
    const termo = Contratos.normalizar(campoBusca.value);
    visiveis = itens.filter((i) => !termo || Contratos.normalizar(i.busca ?? i.nome).includes(termo));
    // Lista vazia: o container vira grid para centralizar o aviso na altura toda (vale com `alto`).
    lista.classList.toggle('grid', !visiveis.length);
    lista.classList.toggle('place-items-center', !visiveis.length);
    lista.innerHTML = visiveis.length ? visiveis.map((i) => `
      <label class="flex items-center gap-3 rounded-lg px-2 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-neutral-900 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40">
        <input type="checkbox" data-marcar="${i.id}" class="${CHECK}" ${marcados.has(i.id) ? 'checked' : ''}>
        <span class="min-w-0 flex-1">
          <span class="flex items-center gap-1.5 min-w-0"><span class="min-w-0 truncate text-sm text-slate-800 dark:text-neutral-100">${esc(i.nome)}</span>${i.tag ? `<span class="shrink-0 flex items-center gap-1">${i.tag}</span>` : ''}</span>
          ${i.detalhe ? `<span class="block text-xs text-slate-500 dark:text-neutral-400 truncate">${i.detalhe}</span>` : ''}</span>
        ${i.direita ? `<span class="text-xs text-slate-500 dark:text-neutral-400 tabular-nums shrink-0">${i.direita}</span>` : ''}
        ${i.link ? `<a href="${esc(i.link)}" target="_blank" rel="noopener" data-fora-do-label title="Abrir o cadastro em outra aba, sem perder esta lista" class="shrink-0 p-1.5 rounded-md text-slate-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-200/70 dark:hover:bg-neutral-800 transition">${ICONE.externo}</a>` : ''}
      </label>`).join('') : vazioHtml(campoBusca.value.trim());
    // O link mora dentro do <label>: sem parar o clique aqui, abrir a aba também marcaria o aluno.
    lista.querySelectorAll('[data-fora-do-label]').forEach((el) => el.addEventListener('click', (e) => e.stopPropagation()));
    lista.querySelector('#btn-limpar-sel')?.addEventListener('click', () => { campoBusca.value = ''; render(); campoBusca.focus(); });
    lista.querySelector('#btn-vazio-sel')?.addEventListener('click', () => vazioAcao.aoClicar(campoBusca.value.trim(), [...marcados]));
    lista.querySelectorAll('[data-marcar]').forEach((ch) => ch.addEventListener('change', () => { ch.checked ? marcados.add(ch.dataset.marcar) : marcados.delete(ch.dataset.marcar); rodape(); }));
    rodape();
  };
  btnMarcar?.addEventListener('click', () => { const todos = visiveis.every((i) => marcados.has(i.id)); visiveis.forEach((i) => (todos ? marcados.delete(i.id) : marcados.add(i.id))); render(); });
  btnConfirmar.addEventListener('click', () => { aoConfirmar([...marcados], root); fecharModal(); });
  campoBusca.addEventListener('input', render);
  if (aoMontar) aoMontar(root, rodape);
  render(); campoBusca.focus();
}

// Situação financeira do aluno no seletor de vagas (RF-14) — só informação, não trava nada.
// Fonte 1 (a que o comercial pediu): a marcação manual do cadastro do aluno,
// cartão "Situação financeira com a ProWay" em aluno.html. Texto igual ao de lá.
const tituloDevedorCadastro = (a) => {
  const i = a.inadimplencia ?? {};
  return `Marcado no cadastro do aluno: ${nomeDe(MOTIVOS_INADIMPLENCIA, i.motivo) || 'devedor'}${i.desde ? ` desde ${Clientes.fmtData(i.desde)}` : ''}${i.valor != null ? ` · ${moeda(i.valor)}` : ''}${i.observacoes ? ` — ${i.observacoes}` : ''}`;
};

// Fonte 2: parcelas vencidas dos contratos dele (Contratos.debitoDoAluno), separadas
// por quem paga — dívida da empresa/responsável não é dívida do aluno e ganha outra cor.
function financeiroDoAluno(a) {
  const pilulas = [];
  if (a.inadimplencia?.devedor) pilulas.push(pilula(PILULA.vermelha, 'Devedor', tituloDevedorCadastro(a)));
  const d = Contratos.debitoDoAluno(estado.lista, ctx(), a.id);
  if (d.proprio.n) {
    pilulas.push(pilula(d.proprio.emAcordo ? PILULA.laranja : PILULA.vermelha, `${plural(d.proprio.n, 'parcela vencida', 'parcelas vencidas')} · ${moeda(d.proprio.valor)}`,
      `No nome do próprio aluno, em ${d.proprio.codigos.join(', ')}${d.proprio.emAcordo ? ' — com acordo de recuperação registrado' : ''}.`));
  }
  if (d.outros.n) {
    const tipos = d.outros.tipos;
    const rotulo = tipos.every((t) => t === 'empresa') ? 'Empresa devendo' : tipos.every((t) => t === 'responsavel' || t === 'terceiro') ? 'Responsável devendo' : 'Quem paga devendo';
    pilulas.push(pilula(PILULA.ambar, rotulo,
      `Não é dívida do aluno: ${moeda(d.outros.valor)} em ${plural(d.outros.n, 'parcela vencida', 'parcelas vencidas')} de ${d.outros.codigos.join(', ')}, no nome de ${d.outros.nomes.join(', ')}.`));
  }
  return { tag: pilulas.join(''), devedor: Boolean(a.inadimplencia?.devedor) || d.proprio.n > 0 };
}

// Cadastro rápido de aluno sem sair do contrato (RF-14b, 03/09/2026): só o essencial para
// ele poder ocupar a vaga — endereço, quem paga e LGPD ficam para o cadastro em Clientes.
// `termo` é o que foi digitado na busca do seletor (só dígitos → CPF; senão → nome).
// `voltarAoSeletor` reabre o seletor do pacote depois (com o aluno novo já marcado).
// O modal é um só (`abrirModal` troca o conteúdo de #modal-root): o seletor sai da tela
// enquanto o cadastro está aberto e volta no fim, por isso a seleção viaja de ida e volta.
function abrirModalAlunoNovo({ termo = '', voltarAoSeletor = null } = {}) {
  const c = atual();
  const emp = Contratos.empresaDe(ctx(), c);
  const t = String(termo).trim();
  const soNumeros = t !== '' && /^[\d.\-\s]+$/.test(t);
  const voltar = (marcados) => (voltarAoSeletor ? abrirSeletorAlunos(voltarAoSeletor.pacoteId, { marcados: marcados ?? voltarAoSeletor.marcados }) : null);
  const { root } = modalFormulario({
    id: 'form-aluno-novo',
    titulo: emp ? `Novo aluno de ${esc(Contratos.nomeEmpresa(emp))}` : 'Novo aluno',
    subtitulo: `${emp ? 'Entra como colaborador da empresa, com "empresa paga" (RN-11).' : 'Aluno particular.'} Só o essencial para ocupar a vaga — endereço, quem paga e LGPD ficam para o cadastro em Clientes.`,
    rotulo: voltarAoSeletor ? 'Criar e voltar para a lista' : 'Criar aluno',
    largura: 'max-w-xl',
    foco: soNumeros ? '#f-cpf' : '#f-nome',
    corpo: `
      ${campoTexto('nome', 'Nome completo', soNumeros ? '' : t, { placeholder: 'Como consta no documento', max: 120 })}
      ${campoTexto('nomeSocial', 'Nome social', '', { opcional: true, placeholder: 'Como prefere ser chamado(a)', max: 80 })}
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('cpf', 'CPF', soNumeros ? Clientes.fmtCpf(t.replace(/\D/g, '')) : '', { placeholder: '000.000.000-00', max: 14, extra: 'data-mascara="cpf" inputmode="numeric"' })}
        ${campoTexto('nascimento', 'Nascimento', '', { tipo: 'date', opcional: true })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('email', 'E-mail', '', { tipo: 'email', max: 120 })}
        ${campoTexto('celular', 'Celular / WhatsApp', '', { placeholder: '(47) 90000-0000', extra: 'inputmode="tel"' })}
      </div>
      ${emp ? campoTexto('cargo', 'Cargo na empresa', '', { opcional: true, max: 80 }) : ''}
      <p class="text-xs text-slate-500 dark:text-neutral-400">Mesmas regras do cadastro em Clientes: nome e sobrenome, CPF válido e ainda não usado, e-mail e celular no formato certo. E-mail, celular e nascimento não travam a criação, mas ficam como pendência do cadastro (o ⚠ da lista) e travam boleto e NF depois.</p>`,
    aoMontar: (f) => f.querySelector('[name="celular"]')?.addEventListener('blur', (e) => { e.target.value = Clientes.fmtTelefone(e.target.value); }),
    aoSalvar: (fd) => {
      const d = Object.fromEntries(fd);
      if (emp) { d.empresaId = emp.id; d.origem = 'empresa'; }
      const erros = Clientes.validarAluno(d, ctx().alunos);
      if (erros.length) return erros;
      const r = Clientes.incluirAluno(estado.clientes, d);
      estado.clientes = r.dados;
      Clientes.salvar(estado.clientes);
      estado.ctx.alunos = estado.clientes.alunos;
      toast(`${r.aluno.nomeSocial || r.aluno.nome} criado${emp ? ` como colaborador da ${Contratos.nomeEmpresa(emp)}` : ''}${voltarAoSeletor ? ' e marcado na lista — confirme para ocupar a vaga.' : ' — use "Adicionar alunos" no pacote para dar uma vaga a ele.'}`);
      renderContrato();
      // modalFormulario fecha o modal DEPOIS do aoSalvar; reabrir o seletor agora seria apagado.
      if (voltarAoSeletor) queueMicrotask(() => voltar([...voltarAoSeletor.marcados, r.aluno.id]));
    },
  });
  // Cancelar / X voltam para o seletor como estava; clicar fora fecha tudo (o backdrop não é <button>).
  if (voltarAoSeletor) root.querySelectorAll('button[data-fechar-modal]').forEach((b) => b.addEventListener('click', () => queueMicrotask(() => voltar())));
}

// Adicionar alunos a um pacote (RF-14): colaboradores ativos da empresa (ou alunos ativos) fora do contrato.
// Acima das vagas livres o Confirmar trava, a menos que "aumentar as vagas automaticamente" esteja marcado.
function abrirSeletorAlunos(pacoteId, { marcados = [] } = {}) {
  const c = atual();
  const p = Contratos.pacoteDe(c, pacoteId);
  if (!p) return;
  const emp = Contratos.empresaDe(ctx(), c);
  const vg = Contratos.vagasDoPacote(c, p);
  const noContrato = (a) => { const v = Contratos.vinculoDe(c, a.id); return Boolean(v && v.situacao !== 'recusado'); };
  // Contrato de empresa: colaboradores dela + alunos sem empresa (RN-11: ao entrar, ganham a empresa e "empresa paga"). Alunos de OUTRA empresa ficam de fora.
  const base = ctx().alunos.filter((a) => a.status === 'ativo' && !noContrato(a) && (!emp || a.empresaId === emp.id || !a.empresaId)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const aumentar = (root) => Boolean(root.querySelector('#chk-aumentar')?.checked);
  // Situação financeira calculada uma vez por aluno (a lista é curta e não muda enquanto o modal está aberto).
  const fin = new Map(base.map((a) => [a.id, financeiroDoAluno(a)]));
  modalSelecao({
    marcadosIniciais: marcados, alto: true, comMarcarTodos: false,
    dicaBusca: 'Procure pelo nome, CPF ou e-mail. Se o aluno ainda não existe no sistema, cadastre agora — ele volta para esta lista já selecionado.',
    // Sem resultado (ou sem ninguém disponível) o comercial cadastra o aluno aqui mesmo, sem sair do contrato.
    vazioAcao: { rotulo: emp ? `Cadastrar novo aluno na ${Contratos.nomeEmpresa(emp)}` : 'Cadastrar novo aluno', aoClicar: (termo, jaMarcados) => abrirModalAlunoNovo({ termo, voltarAoSeletor: { pacoteId, marcados: jaMarcados } }) },
    titulo: `Adicionar alunos ao pacote "${esc(p.nome)}"`,
    subtitulo: `${emp ? `Colaboradores ativos de <strong>${esc(Contratos.nomeEmpresa(emp))}</strong> e alunos sem empresa (ao entrar, viram colaboradores dela com "empresa paga") ainda fora desta venda.` : 'Alunos ativos ainda fora desta venda (um pacote por aluno).'} Cada um recebe uma cópia do molde (${moeda(Contratos.valorPacote(p))}) e entra como aprovado.`,
    extra: `<span class="text-xs text-slate-600 dark:text-neutral-300 tabular-nums"><strong>${plural(vg.livres, 'vaga livre', 'vagas livres')}</strong> de ${vg.vagas} neste pacote</span><label class="flex items-center gap-2 text-xs text-slate-600 dark:text-neutral-300 cursor-pointer"><input type="checkbox" id="chk-aumentar" class="${CHECK}"> Aumentar as vagas automaticamente se a seleção passar das livres</label>`,
    itens: base.map((a) => {
      // Pendência é do cadastro do aluno, não impede a vaga — o balão diz o que falta (03/09/2026),
      // senão o comercial vê "1 pendência" e não sabe se é grave nem onde resolver.
      const pend = Clientes.pendenciasAluno(a, ctx().empresas);
      return {
        id: a.id, nome: a.nomeSocial || a.nome,
        detalhe: `<span class="font-mono">${esc(Clientes.fmtCpf(a.cpf))}</span> · ${esc(a.email || 'sem e-mail')} · ${emp && !a.empresaId ? 'sem empresa — entra como colaborador' : esc(nomeDe(PAGADORES, a.pagador))}`,
        busca: `${a.nome} ${a.nomeSocial} ${a.cpf} ${a.email}${fin.get(a.id).devedor ? ' devedor' : ''}${pend.length ? ` pendência ${pend.join(' ')}` : ''}`,
        tag: fin.get(a.id).tag,
        link: `aluno.html?id=${encodeURIComponent(a.id)}`,
        direita: pend.length ? `<span class="cursor-help border-b border-dotted border-slate-300 dark:border-neutral-600" title="${esc(`Falta no cadastro: ${pend.join(' · ')}. Não impede a matrícula — dá para completar depois em Clientes.`)}">⚠ ${plural(pend.length, 'pendência')}</span>` : '',
      };
    }),
    vazioTxt: emp ? 'Nenhum aluno disponível: os colaboradores da empresa e os alunos sem empresa já estão na venda (ou não existem ainda). Cadastre o aluno em Clientes ou envie o link do pacote.' : 'Todos os alunos ativos já estão na venda.', rotuloBotao: 'Adicionar',
    validarSelecao: (ids, root) => (ids.length > vg.livres && !aumentar(root) ? `${ids.length} selecionados para ${plural(vg.livres, 'vaga livre', 'vagas livres')} — aumente as vagas do pacote` : ''),
    // Avisa quem está devendo, mas não trava o Adicionar: quem decide é o comercial.
    avisoSelecao: (ids) => { const n = ids.filter((id) => fin.get(id)?.devedor).length; return n ? `${plural(n, 'devedor selecionado', 'devedores selecionados')}` : ''; },
    aoMontar: (root, rodape) => root.querySelector('#chk-aumentar')?.addEventListener('change', rodape),
    aoConfirmar: (ids, root) => {
      const aumentarVagas = aumentar(root);
      const erros = Contratos.validarVinculoAlunos(c, pacoteId, ids, { aumentarVagas });
      if (erros.length) { toast(erros[0]); return; }
      const extra = Math.max(0, ids.length - vg.livres);
      alterar((l) => Contratos.regerarParcelas(Contratos.vincularAlunos(l, c.id, pacoteId, ids, { aumentarVagas }), c.id));
      sincronizarClientes(ids);
      estado.pacotesRecolhidos.delete(pacoteId); // abre o pacote para o comercial ver quem entrou
      toast(`${plural(ids.length, 'aluno')} adicionado${ids.length === 1 ? '' : 's'} ao pacote${extra ? ` · vagas aumentadas em ${extra}` : ''}.`); renderContrato();
    },
  });
}

const linhaLinkContrato = (id, rotulo, descricao, u) => `
      <div>
        <label class="rotulo" for="${id}">${rotulo} <span class="normal-case font-normal tracking-normal text-slate-400">· ${descricao}</span></label>
        <div class="flex gap-2">
          <input id="${id}" type="text" readonly value="${esc(u)}" class="campo font-mono text-xs">
          <button type="button" data-copiar="${id}" class="${BOTAO_SEC} shrink-0">Copiar</button>
          <a href="${esc(u)}" target="_blank" rel="noopener" class="${BOTAO_SEC} shrink-0" title="Abrir como quem recebe o link">${ICONE.externo} Abrir</a>
        </div>
      </div>`;

// Cursos avulsos para UM aluno.
function abrirSeletorCursos(alunoId) {
  const c = atual();
  const a = alunoDe(alunoId);
  const ja = Contratos.itensDoAluno(c, alunoId).filter((i) => !i.formacaoId).map((i) => i.cursoId);
  const base = ctx().cursos.filter((cu) => cu.status === 'ativo' && !ja.includes(cu.id)).sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR'));
  modalSelecao({
    titulo: `Cursos avulsos para ${a.nomeSocial || a.nome}`, subtitulo: 'Cursos ativos do catálogo, com o preço de referência como valor base. A turma se define depois, item a item.',
    itens: base.map((cu) => ({ id: cu.id, nome: `${cu.codigo} · ${cu.nome}`, detalhe: `${esc(nomeDe(EIXOS, cu.eixoId))} · ${cu.cargaHoraria}h · ${plural(Cursos.turmasDoCurso(cu.id).length, 'turma')}`, busca: `${cu.codigo} ${cu.nome} ${nomeDe(EIXOS, cu.eixoId)}`, direita: moeda(cu.comercial.precoReferencia) })),
    vazioTxt: 'Todos os cursos ativos já estão nos itens deste aluno.', rotuloBotao: 'Adicionar',
    aoConfirmar: (ids) => { alterar((l) => Contratos.regerarParcelas(Contratos.adicionarCursos(l, ctx(), c.id, alunoId, ids), c.id)); toast(`${plural(ids.length, 'curso')} adicionado${ids.length === 1 ? '' : 's'} para ${a.nome}.`); renderContrato(); },
  });
}

// Formação para UM aluno (drawer com lista e busca; uma por vez).
function abrirSeletorFormacao(alunoId) {
  const c = atual();
  const a = alunoDe(alunoId);
  const ja = Contratos.itensDoAluno(c, alunoId).filter((i) => i.formacaoId).map((i) => i.formacaoId);
  const formacoes = ctx().formacoes.filter((f) => f.status === 'ativo' && !ja.includes(f.id)).sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR'));
  drawerFormulario({
    id: 'form-formacao', titulo: `Formação para ${a.nomeSocial || a.nome}`, subtitulo: 'O preço da formação é rateado por carga horária entre os cursos dela; cada curso vira um item (matrícula) deste aluno.', rotulo: 'Adicionar',
    corpo: listaSelecionavel('formacaoId', formacoes.map((f) => { const tot = Formacoes.totais(f, ctx().cursos); return { id: f.id, nome: `${f.codigo} · ${f.nome}`, detalhe: `${plural(tot.n, 'curso')} · ${tot.horas}h`, busca: `${f.codigo} ${f.nome}`, direita: moeda(f.comercial.precoReferencia) }; }), { placeholder: 'Buscar formação', vazioTxt: ja.length ? 'Nenhuma outra formação ativa.' : 'Nenhuma formação ativa.' }),
    aoMontar: ligarListas,
    aoSalvar: (fd) => { const id = fd.get('formacaoId'); if (!id) return [{ campo: 'formacaoId', mensagem: 'Escolha a formação.' }]; alterar((l) => Contratos.regerarParcelas(Contratos.adicionarFormacao(l, ctx(), c.id, alunoId, id), c.id)); toast(`Formação adicionada para ${a.nome}.`); renderContrato(); },
  });
}

// `validarMotivo(texto)` → erros [{ campo: 'motivo', mensagem }] torna o motivo obrigatório (mostra o erro e não fecha).
function modalConfirmacao({ titulo, corpo, rotulo, tom = 'vermelho', aoConfirmar, comMotivo = false, validarMotivo = null, rotuloMotivo = 'Motivo' }) {
  const cor = tom === 'vermelho' ? 'bg-red-600 hover:bg-red-700' : 'bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800';
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800"><h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h3></div>
    <div class="px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 space-y-3">${corpo}${comMotivo ? `<div><label class="rotulo" for="motivo">${rotuloMotivo} ${validarMotivo ? '' : OPCIONAL}</label><textarea id="motivo" name="motivo" rows="2" class="campo"></textarea>${ERRO('motivo')}</div>` : ''}</div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Voltar</button>
      <button type="button" id="btn-confirmar" class="px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition ${cor}">${rotulo}</button>
    </div>`);
  root.querySelector('#btn-confirmar').addEventListener('click', () => {
    const motivo = root.querySelector('#motivo')?.value ?? '';
    if (validarMotivo && mostrarErros(root, validarMotivo(motivo))) return;
    aoConfirmar(motivo); fecharModal();
  });
  if (comMotivo) root.querySelector('#motivo')?.focus();
}

const SITUACAO_RESCISAO = { concluido: ['verde', 'Concluído'], em_andamento: ['petrol', 'Em andamento'], nao_iniciado: ['neutra', 'Não iniciado'], arrependimento: ['ambar', 'Arrependimento'] };

// Memória de cálculo da rescisão (tabela + totais). Usada no modal (simulação
// viva) e no Resumo do contrato cancelado (memória gravada). Um bloco por aluno
// que ocupa vaga + um bloco "Vagas livres" (linhas com alunoId null, uma por pacote).
function memoriaRescisaoHtml(c, sim, { scrollTabela = false } = {}) {
  const nomePacote = (l) => l.pacote?.nome ?? Contratos.pacoteDe(c, l.pacoteId)?.nome ?? 'pacote';
  const linha = (l) => {
    const it = l.alunoId === null ? null : (l.itemId ? Contratos.itemDe(c, l.itemId) : l.item);
    const [tom, nome] = SITUACAO_RESCISAO[l.situacao] ?? ['neutra', l.situacao];
    const rotulo = l.alunoId === null ? `${plural(l.vagas ?? 0, 'vaga livre', 'vagas livres')} · ${nomePacote(l)}` : it ? Contratos.rotuloItem(ctx(), it) : '—';
    return `
      <tr>
        <td class="${TD}"><span class="block">${esc(rotulo)}</span><span class="block text-xs text-slate-500 dark:text-neutral-400">${esc(l.regra)}</span></td>
        <td class="${TH}">${pilula(PILULA[tom], nome)}</td>
        <td class="${TD_VALOR}">${moeda(l.base)}</td>
        <td class="${TD_VALOR}">${Math.round(l.pct * 100)}%</td>
        <td class="${TD_VALOR} font-medium text-slate-800 dark:text-neutral-100">${moeda(l.devido)}</td>
      </tr>`;
  };
  // Acordeão: fechado por padrão quando há mais de um bloco; a faixa mostra o subtotal.
  const chaves = [...new Set(sim.linhas.map((l) => l.alunoId ?? '__livres'))].sort((a, b) => (a === '__livres') - (b === '__livres'));
  const varios = chaves.length > 1;
  const grupo = (chave) => {
    const livres = chave === '__livres';
    const a = livres ? null : alunoDe(chave);
    const ls = sim.linhas.filter((l) => (livres ? l.alunoId === null : l.alunoId === chave));
    const sub = ls.reduce((s, l) => s + l.devido, 0);
    const titulo = livres ? 'Vagas livres' : (a?.nomeSocial || a?.nome || chave);
    const detalhe = livres ? `${ls.reduce((s, l) => s + (l.vagas ?? 0), 0)} vaga(s) em ${plural(ls.length, 'pacote')} · cobradas pelo valor do pacote` : plural(ls.length, 'matrícula');
    return `
      <tr class="bg-slate-50 dark:bg-neutral-900 ${varios ? 'cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-neutral-800' : ''}" ${varios ? `data-toggle-rescisao="${chave}" aria-expanded="false"` : ''}>
        <td colspan="4" class="${TH} text-xs font-medium text-slate-600 dark:text-neutral-300">${varios ? '<span class="inline-block w-4 text-slate-400 transition-transform" data-seta>▸</span>' : ''}${esc(titulo)} <span class="font-normal normal-case tracking-normal text-slate-400">· ${esc(detalhe)}${varios ? ` · <span data-dica-rescisao>clique para ver ${livres ? 'as vagas' : 'as matrículas'}</span>` : ''}</span></td>
        <td class="${TD_VALOR} font-semibold text-xs">${moeda(sub)}</td>
      </tr>
      ${ls.map((l) => linha(l).replace('<tr>', `<tr data-grupo-rescisao="${chave}" class="${varios ? 'hidden' : ''}">`)).join('')}`;
  };
  const barra = varios ? `<div class="flex flex-wrap items-center justify-between gap-2 mb-2"><p class="text-xs text-slate-500 dark:text-neutral-400">Um bloco por aluno (e um para as vagas livres) — clique no título para ver as linhas.</p><div class="flex items-center"><button type="button" data-todos-rescisao="abrir" class="${BOTAO_LINK}">Expandir todos</button><span class="mx-1 text-slate-300">·</span><button type="button" data-todos-rescisao="fechar" class="${BOTAO_LINK}">Minimizar todos</button></div></div>` : '';
  const venc = sim.vencidas.map((v) => ({ n: v.n ?? v.parcela?.n, valor: v.valor ?? v.parcela?.valor, dias: v.dias, encargos: v.encargos }));
  const tot = (rot, val, extra = '') => `<div class="flex justify-between gap-4 ${extra}"><span>${rot}</span><span class="tabular-nums">${val}</span></div>`;
  const faixaSaldo = sim.saldo > 0
    ? faixa('vermelha', `<strong>Cobrar ${moeda(sim.saldo)} do contratante</strong> até ${esc(Contratos.fmtData(sim.prazo))} (5 dias a partir da notificação — item 15).`)
    : sim.saldo < 0
      ? faixa('verde', `<strong>ProWay devolve ${moeda(-sim.saldo)}</strong> em 5 dias (item 15) — ou carta de crédito válida até ${esc(Contratos.fmtData(sim.validadeCarta))} (item 16).`)
      : faixa('neutra', '<strong>Sem saldo:</strong> o que foi pago cobre exatamente o devido.');
  return `
    ${barra}
    ${scrollTabela ? `<div class="max-h-[45vh] overflow-y-auto">${tabela(['Curso / turma', 'Situação', 'R$ Valor', 'R$ %', 'R$ Devido'], chaves.map(grupo), 'Nenhuma matrícula ativa nem vaga livre — nada a calcular.')}</div>` : tabela(['Curso / turma', 'Situação', 'R$ Valor', 'R$ %', 'R$ Devido'], chaves.map(grupo), 'Nenhuma matrícula ativa nem vaga livre — nada a calcular.')}
    <div class="grid md:grid-cols-2 gap-4 mt-4">
      <div class="text-sm space-y-1 text-slate-700 dark:text-neutral-200">
        ${tot('Devido pela rescisão', moeda(sim.devido))}
        ${tot('Já pago', `− ${moeda(sim.pago)}`)}
        ${venc.length ? tot(`Encargos de ${plural(venc.length, 'parcela vencida', 'parcelas vencidas')} <span class="text-xs text-slate-400">(2% + 1% a.m., item 23)</span>`, `+ ${moeda(sim.encargos)}`) : ''}
        ${tot('<strong>Saldo</strong>', `<strong>${moeda(sim.saldo)}</strong>`, 'border-t border-slate-200 dark:border-neutral-800 pt-1 mt-1')}
        ${venc.length ? `<p class="text-xs text-slate-500 dark:text-neutral-400 pt-1">Vencidas: ${venc.map((v) => `${v.n}ª (${moeda(v.valor)}, ${v.dias} d → +${moeda(v.encargos)})`).join(' · ')}. INPC fora do protótipo.</p>` : ''}
      </div>
      <div>${faixaSaldo}</div>
    </div>`;
}

// Abre/fecha os blocos por aluno da memória de rescisão (modal e Resumo) por delegação.
document.addEventListener('click', (e) => {
  const cab = e.target.closest('[data-toggle-rescisao]');
  const todos = e.target.closest('[data-todos-rescisao]');
  if (!cab && !todos) return;
  const alternar = (linhaCab, abrir) => {
    const id = linhaCab.dataset.toggleRescisao;
    const tabela = linhaCab.closest('table');
    const aberto = abrir ?? linhaCab.getAttribute('aria-expanded') !== 'true';
    linhaCab.setAttribute('aria-expanded', String(aberto));
    linhaCab.querySelector('[data-seta]')?.classList.toggle('rotate-90', aberto);
    const dica = linhaCab.querySelector('[data-dica-rescisao]'); if (dica) dica.textContent = aberto ? 'clique para ocultar' : 'clique para ver as matrículas';
    tabela.querySelectorAll(`[data-grupo-rescisao="${id}"]`).forEach((tr) => tr.classList.toggle('hidden', !aberto));
  };
  if (cab) alternar(cab);
  else todos.closest('div').parentElement.nextElementSibling.querySelectorAll('[data-toggle-rescisao]').forEach((tr) => alternar(tr, todos.dataset.todosRescisao === 'abrir'));
});

function abrirModalRescisao({ somenteSimular = false } = {}) {
  const c = atual();
  const params = { data: Contratos.hoje(), criterio: 'aulas', perdeDesconto: true, arrependimento: false };
  const temTurmas = typeof Turmas !== 'undefined';
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
      <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">${somenteSimular ? 'Simular rescisão' : 'Cancelar venda'} ${esc(c.codigo)}</h3>
      <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Rescisão do contrato inteiro, pelos Termos Gerais: 100% do concluído · 50% ou 100% do curso em andamento (regra do 1/3, item 14) · multa de 10% sobre os não iniciados (item 11) · desconto perde eficácia (item 22).</p>
    </div>
    <div class="px-5 py-4 overflow-y-auto space-y-4 text-sm text-slate-700 dark:text-neutral-200">
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div><label class="rotulo" for="r-data">Data do pedido</label><input id="r-data" type="date" class="campo" value="${params.data}"></div>
        <div><label class="rotulo" for="r-criterio">1/3 da duração por</label><select id="r-criterio" class="campo">${Contratos.CRITERIOS_TERCO.map((o) => `<option value="${o.id}" ${!temTurmas && o.id === 'aulas' ? 'disabled' : ''} title="${esc(o.descricao)}">${esc(o.nome)}</option>`).join('')}</select></div>
        <label class="flex items-center gap-2 h-9"><input id="r-desconto" type="checkbox" class="${CHECK}" checked><span>Desconto perde eficácia <span class="text-xs text-slate-400">(item 22)</span></span></label>
        <label class="flex items-center gap-2 h-9"><input id="r-arrependimento" type="checkbox" class="${CHECK}"><span>Contratação online <span class="text-xs text-slate-400">(7 dias, item 13)</span></span></label>
      </div>
      <div id="r-memoria"></div>
      <div id="r-destino" class="hidden"><label class="rotulo" for="r-destino-sel">Saldo a favor do contratante</label><select id="r-destino-sel" class="campo">${Contratos.DESTINOS_SALDO.filter((d) => d.id === 'devolver' || d.id === 'carta_credito').map((d) => `<option value="${d.id}">${esc(d.nome)} — ${esc(d.descricao)}</option>`).join('')}</select></div>
      ${somenteSimular ? '' : `<div><label class="rotulo" for="motivo">Motivo ${OPCIONAL}</label><textarea id="motivo" rows="2" class="campo"></textarea></div>`}
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-2">
      <span id="r-aviso" class="text-xs text-slate-500 dark:text-neutral-400"></span>
      <div class="flex items-center gap-2">
        <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">${somenteSimular ? 'Fechar' : 'Voltar'}</button>
        ${somenteSimular ? '' : `<button type="button" id="btn-confirmar" class="px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition bg-red-600 hover:bg-red-700">Cancelar venda</button>`}
      </div>
    </div>`, 'max-w-4xl');
  root.querySelector('[role="dialog"]').classList.replace('max-h-full', 'max-h-[90vh]'); // pedido: no máximo 90% da tela
  let sim = null;
  const recalcular = () => {
    params.data = root.querySelector('#r-data').value || Contratos.hoje();
    params.criterio = root.querySelector('#r-criterio').value;
    params.perdeDesconto = root.querySelector('#r-desconto').checked;
    params.arrependimento = root.querySelector('#r-arrependimento').checked;
    sim = Contratos.simularRescisao(ctx(), c, params);
    root.querySelector('#r-memoria').innerHTML = memoriaRescisaoHtml(c, sim, { scrollTabela: true });
    root.querySelector('#r-destino').classList.toggle('hidden', sim.saldo >= 0);
    const avisos = [];
    if (params.arrependimento && !sim.arrependimento) avisos.push(`Inscrição em ${Contratos.fmtData(c.criadoEm)}: ${sim.diasDesdeInscricao} dias até o pedido — fora do prazo de 7 dias.`);
    if (params.criterio === 'aulas' && sim.linhas.some((l) => l.progresso?.unidade === 'dias')) avisos.push('Turma sem aulas agendadas: 1/3 contado em dias corridos.');
    root.querySelector('#r-aviso').textContent = avisos.join(' ');
  };
  root.querySelectorAll('#r-data, #r-criterio, #r-desconto, #r-arrependimento').forEach((el) => el.addEventListener('change', recalcular));
  recalcular();
  root.querySelector('#btn-confirmar')?.addEventListener('click', () => {
    const destino = sim.saldo < 0 ? root.querySelector('#r-destino-sel').value : sim.destino;
    const motivo = root.querySelector('#motivo')?.value ?? '';
    alterar((l) => Contratos.cancelar(l, c.id, motivo, { ...sim, destino }));
    fecharModal();
    toast(`Venda ${c.codigo} cancelada.`);
    renderContrato();
  });
}

const confirmarCancelamento = () => abrirModalRescisao();

function confirmarExclusao() {
  const c = atual();
  const t = Contratos.totais(c);
  modalConfirmacao({
    titulo: 'Excluir rascunho', rotulo: 'Excluir',
    corpo: `<p>Excluir o rascunho <strong class="font-mono">${esc(c.codigo)}</strong> com ${plural(c.pacotes.length, 'pacote')} (${plural(t.vagas, 'vaga')}) e ${plural(t.nAlunos, 'aluno')}? Nada foi gerado ainda; o código fica livre e os cadastros dos alunos permanecem em Clientes.</p>`,
    aoConfirmar: () => { alterar((l) => Contratos.remover(l, c.id)); toast('Rascunho excluído.'); irParaLista(); },
  });
}

// Select do motivo do cancelamento (MOTIVOS_CANCELAMENTO, sem "Rescisão do contrato", que é automático). Nada pré-selecionado.
const selectMotivoCancelamento = () => `<div><label class="rotulo" for="motivo-tipo">Motivo da desistência</label><select id="motivo-tipo" class="campo"><option value="">Selecione…</option>${MOTIVOS_CANCELAMENTO.filter((m) => m.id !== 'contrato' && m.id !== 'nao_informado').map((m) => `<option value="${m.id}">${esc(m.nome)}</option>`).join('')}</select>${ERRO('motivo-tipo')}</div>`;
const motivoEscolhido = (texto) => ({ tipo: document.getElementById('motivo-tipo')?.value || 'nao_informado', texto });
const validarMotivoTipo = () => (document.getElementById('motivo-tipo')?.value ? [] : [{ campo: 'motivo-tipo', mensagem: 'Escolha o motivo.' }]);

function confirmarDesistencia(a) {
  const c = atual();
  modalConfirmacao({
    titulo: 'Marcar desistência', rotulo: 'Marcar desistente', comMotivo: true, rotuloMotivo: 'Detalhes', validarMotivo: validarMotivoTipo,
    corpo: `<p><strong>${esc(a.nome)}</strong> passa a "Desistiu" em todos os itens desta venda e libera a vaga do pacote (que volta a ser cobrada como vaga livre); o valor dele sai do faturamento das turmas. As parcelas já geradas não mudam.</p>${selectMotivoCancelamento()}`,
    aoConfirmar: (texto) => { const motivo = motivoEscolhido(texto); alterar((l) => Contratos.regerarParcelas(Contratos.removerAluno(l, c.id, a.id, motivo), c.id)); estado.expandidos.delete(a.id); toast(`${a.nome} marcado como desistente — vaga liberada.`); renderContrato(); },
  });
}

// Congelar a matrícula do aluno neste contrato (03/09/2026): pausa, não desistência —
// ele sai das aulas e das contas de frequência, mas segue ocupando a vaga e valendo no contrato.
function confirmarCongelamento(alunoId) {
  const c = atual();
  const a = alunoDe(alunoId);
  const v = Contratos.vinculoDe(c, alunoId);
  const n = (v?.itens ?? []).filter((m) => m.status === 'matriculado').length;
  modalConfirmacao({
    titulo: 'Congelar matrícula', rotulo: 'Congelar', tom: 'petrol', comMotivo: true, rotuloMotivo: 'Motivo (fica no histórico da venda)',
    corpo: `<p><strong>${esc(a?.nome ?? alunoId)}</strong> pausa ${n === 1 ? 'a matrícula' : `as ${n} matrículas ativas`} desta venda: sai das aulas e das contas de frequência até retomar, mas <strong>segue ocupando a vaga</strong> e valendo na venda — as parcelas não mudam.</p><p class="text-slate-500 dark:text-neutral-400">Para liberar a vaga e tirar o valor do faturamento, o caminho é marcar desistência (lixeira).</p>`,
    aoConfirmar: (texto) => { reg((l) => Contratos.congelarAluno(l, c.id, alunoId, texto)); toast(`Matrícula de ${a?.nome ?? 'aluno'} congelada.`); renderContrato(); },
  });
}

// Recusa na conferência (RN-23): modal vermelho com motivo obrigatório; libera a vaga e mantém o cadastro.
function confirmarRecusaAluno(alunoId) {
  const c = atual();
  const a = alunoDe(alunoId);
  const v = Contratos.vinculoDe(c, alunoId);
  if (!v) return;
  const p = Contratos.pacoteDe(c, v.pacoteId);
  modalConfirmacao({
    titulo: 'Recusar aluno', rotulo: 'Recusar', comMotivo: true, rotuloMotivo: 'Motivo da recusa', validarMotivo: (m) => Contratos.validarRecusa(m),
    corpo: `<p><strong>${esc(a?.nome ?? alunoId)}</strong> não entra no pacote <strong>${esc(p?.nome ?? '')}</strong>: a vaga é liberada, o cadastro continua em Clientes e ele fica listado em "Recusados" (pode ser vinculado de novo pela escola).</p>`,
    aoConfirmar: (motivo) => { alterar((l) => Contratos.regerarParcelas(Contratos.recusarAluno(l, c.id, alunoId, motivo), c.id)); estado.expandidos.delete(alunoId); toast('Aluno recusado — vaga liberada.'); renderContrato(); },
  });
}


// Envio ao Clicksign: escolhe os signatários (contratante e escola obrigatórios; alunos opcionais), prazo e mensagem.
function abrirModalClicksign() {
  const c = atual();
  if (!Contratos.podeEnviarClicksign(c)) { toast('Gere o documento antes de enviar para assinatura.'); return; }
  const sug = Contratos.signatariosSugeridos(ctx(), c);
  const linha = (sg) => `
    <label class="flex items-start gap-3 rounded-lg border p-3 ${sg.obrigatorio ? 'border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/60' : CARTAO_OPCAO} ${!sg.email && !sg.obrigatorio ? 'opacity-60' : ''}">
      <input type="checkbox" name="sig" value="${sg.id}" class="${CHECK} mt-0.5" ${sg.obrigatorio ? 'checked disabled' : ''} ${!sg.email ? 'disabled' : ''}>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2"><span class="font-medium text-slate-800 dark:text-neutral-100">${esc(sg.nome)}</span>${pilula(sg.papel === 'escola' ? PILULA.petrol : sg.papel === 'aluno' ? PILULA.violeta : PILULA.laranja, nomeDe(PAPEIS_SIGNATARIO, sg.papel))}${sg.obrigatorio ? '<span class="text-[11px] text-slate-400">obrigatório</span>' : ''}</div>
        <p class="text-xs text-slate-500 dark:text-neutral-400">${esc(sg.detalhe)}</p>
        <p class="text-xs ${sg.email ? 'text-slate-600 dark:text-neutral-300' : 'text-red-600 dark:text-red-400'}">${sg.email ? esc(sg.email) : 'sem e-mail cadastrado'}${!sg.email && sg.papel !== 'escola' ? ` — <a href="${sg.responsavelId ? `responsavel.html?id=${sg.responsavelId}` : sg.alunoId ? `aluno.html?id=${sg.alunoId}` : `empresa.html?id=${c.empresaId}`}" class="underline">completar cadastro</a>` : ''}</p>
      </div>
    </label>`;
  const bloqueio = Contratos.validarEnvio(ctx(), c, []);
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
      <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Enviar para assinatura no Clicksign</h3>
      <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Venda <span class="font-mono">${esc(c.codigo)}</span> · contrato v${c.documento.versao}. Cada signatário recebe o link por e-mail. Contratante e ProWay são obrigatórios${PARTES_ASSINATURA.some((p) => Contratos.assinaturaDe(c, p.id)) ? ' (quem já assinou manualmente fica de fora)' : ''}.</p>
    </div>
    <form id="form-cs" novalidate class="px-5 py-4 overflow-y-auto text-sm text-slate-700 dark:text-neutral-200 space-y-4">
      <div class="space-y-2">${sug.map(linha).join('')}</div>
      <div class="grid grid-cols-3 gap-3">
        ${campoTexto('prazoDias', 'Prazo (dias)', 7, { tipo: 'number', extra: 'min="1" max="90"' })}
        <div class="col-span-2">${campoArea('mensagem', 'Mensagem do e-mail', '', { rows: 2, placeholder: 'Ex.: Segue o contrato do Super DEV para assinatura.', opcional: true })}</div>
      </div>
      ${bloqueio.length ? faixa('vermelha', `<strong>Não dá para enviar:</strong> ${esc(bloqueio.join(' '))}`) : ''}
      <p class="text-xs text-slate-400">Depois de enviado, o documento não pode ser regerado até o envelope terminar ou ser cancelado.</p>
    </form>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
      <button type="button" id="btn-confirmar" class="${BOTAO_PRI}" ${bloqueio.length ? 'disabled' : ''}>${ICONE.enviar} Enviar</button>
    </div>`, 'max-w-xl');
  root.querySelector('#btn-confirmar').addEventListener('click', () => {
    const form = root.querySelector('#form-cs');
    const ids = [...form.querySelectorAll('[name="sig"]:checked')].map((i) => i.value);
    const erros = Contratos.validarEnvio(ctx(), c, ids);
    if (erros.length) { toast(erros[0]); return; }
    alterar((l) => Contratos.enviarClicksign(l, ctx(), c.id, { ids, prazoDias: form.prazoDias.value, mensagem: form.mensagem.value }));
    fecharModal();
    toast(`Envelope ${Contratos.envelopeAtual(atual()).envelopeId} enviado ao Clicksign.`);
    abrir(c.id, 'documentos');
  });
}

function confirmarRecusa(signatarioId) {
  const c = atual();
  const sg = Contratos.envelopeEmAndamento(c)?.signatarios.find((x) => x.id === signatarioId);
  if (!sg) return;
  modalConfirmacao({
    titulo: 'Simular recusa', rotulo: 'Registrar recusa', comMotivo: true,
    corpo: `<p><strong>${esc(sg.nome)}</strong> recusa a assinatura; o envelope fica como <strong>recusado</strong> e será preciso enviar um novo depois de revisar o contrato.</p>`,
    aoConfirmar: (motivo) => { alterar((l) => Contratos.recusarNoClicksign(l, c.id, signatarioId, motivo)); toast('Recusa registrada.'); renderContrato(); },
  });
}

function confirmarCancelarEnvelope() {
  const c = atual();
  const env = Contratos.envelopePendente(c);
  if (!env) return;
  const assinaram = env.signatarios.filter((x) => x.status === 'assinado');
  modalConfirmacao({
    titulo: `Cancelar envelope ${env.envelopeId}`, rotulo: 'Cancelar envelope', comMotivo: true,
    corpo: `<p>Os links enviados deixam de valer${assinaram.length ? ` e a${assinaram.length === 1 ? '' : 's'} ${plural(assinaram.length, 'assinatura já feita', 'assinaturas já feitas')} (${esc(assinaram.map((x) => x.nome).join(', '))}) ${assinaram.length === 1 ? 'é' : 'são'} descartada${assinaram.length === 1 ? '' : 's'}` : ''}. O documento pode ser regerado e enviado de novo.</p>`,
    aoConfirmar: (motivo) => { alterar((l) => Contratos.cancelarEnvelope(l, c.id, motivo)); toast('Envelope cancelado.'); renderContrato(); },
  });
}

function confirmarEmissaoBoletos() {
  const c = atual();
  const r = Contratos.responsavelFinanceiro(ctx(), c);
  const previstas = c.parcelas.filter((p) => p.status === 'prevista');
  if (!previstas.length) { toast('Não há parcelas a emitir.'); return; }
  const pend = Contratos.pendenciasEmissao(ctx(), c);
  if (pend.length) { toast(`Travado: ${pend.join(' · ')}`); return; }
  modalConfirmacao({
    titulo: `Emitir ${plural(previstas.length, 'boleto')}`, rotulo: 'Emitir', tom: 'petrol',
    corpo: `<p>Boletos de ${moeda(previstas.reduce((s, p) => s + p.valor, 0))} (parcelas ${previstas.map((p) => p.n).join(', ')}) serão emitidos e enviados para <strong>${esc(r.nome)}</strong>${r.email ? ` (${esc(r.email)})` : ''}.</p>`,
    aoConfirmar: () => { alterar((l) => Contratos.emitirBoletos(l, ctx(), c.id)); toast(`${plural(previstas.length, 'boleto')} emitido${previstas.length === 1 ? '' : 's'}.`); renderContrato(); },
  });
}

// ---------- Init ----------

function renderTudo() {
  if (MODO === 'detalhe') {
    if (atual()) renderContrato();
    else location.replace('contratos.html?erro=nao-encontrado');
    return;
  }
  if (MODO === 'cobrancas') { renderPaginaCobrancas(); return; }
  if (MODO === 'indicadores') { renderPaginaIndicadores(); return; }
  renderLista();
}

(function iniciar() {
  const aba = parametroUrl('aba');
  if (MODO === 'detalhe') {
    const id = parametroUrl('id');
    if (!id || !Contratos.porId(estado.lista, id)) { location.replace('contratos.html?erro=nao-encontrado'); return; }
    estado.selecionado = id;
    // URLs antigas (&aba=alunos / &aba=itens) caem na aba Pacotes e alunos.
    estado.aba = ABAS.some((a) => a.id === aba) ? aba : aba === 'alunos' || aba === 'itens' ? 'pacotes' : 'resumo';
    renderTudo();
    return;
  }
  // URL antiga (contratos.html?contrato=X) → página de detalhe.
  const antigo = parametroUrl('contrato');
  if (antigo) { location.replace(urlDetalhe(antigo, aba)); return; }
  if (MODO === 'cobrancas' || MODO === 'indicadores') { renderTudo(); return; }
  const tipo = parametroUrl('tipo');
  // URLs antigas (contratos.html?tipo=cobrancas / ?tipo=indicadores) → páginas próprias.
  if (tipo === 'cobrancas') { location.replace('cobrancas.html'); return; }
  if (tipo === 'indicadores') { location.replace('contratos.html'); return; }
  if (tipo === 'turmas') estado.tipo = tipo;
  const foco = parametroUrl('filtro');
  if (['vencidas', 'assinatura', 'documentos', 'sem-turma', 'vagas'].includes(foco)) estado.filtros.contratos.foco = foco;
  if (parametroUrl('novo') === '1') setTimeout(abrirModalNovo, 0);
  if (parametroUrl('erro') === 'nao-encontrado') { setTimeout(() => toast('Venda não encontrada.'), 0); history.replaceState(null, '', urlLista(estado.tipo)); }
  renderTudo();
})();

// ---------- Sinais operacionais da lista ----------

function cartoesResumoContratos() {
  const ativos = estado.lista.filter((c) => c.status !== 'cancelado');
  const assinatura = ativos.filter((c) => c.status === 'aguardando' && !Contratos.assinado(c)).length;
  const documentos = ativos.filter((c) => Contratos.pendenciasDocumento(ctx(), c).length).length;
  const semTurma = ativos.reduce((n, c) => n + Contratos.itensMatriculados(c).filter((m) => Contratos.matriculaAtiva(m) && !m.turmaId).length, 0);
  const vagas = ativos.reduce((n, c) => n + Contratos.totais(c).livres, 0);
  const vencidos = ativos.filter((c) => Contratos.parcelasVencidas(c).length);
  const valorVencido = vencidos.reduce((s, c) => s + Contratos.resumoVencido(c).valor, 0);
  const cartao = (foco, rotulo, valor, sub, corValor = 'text-slate-800 dark:text-neutral-100') => `
    <button type="button" data-foco="${foco}" aria-pressed="${estado.filtros.contratos.foco === foco}" class="${CARTAO} p-4 text-left hover:border-petrol-800 dark:hover:border-sky-400 transition ${estado.filtros.contratos.foco === foco ? 'ring-2 ring-petrol-800/30 dark:ring-sky-400/30' : ''}">
      <p class="text-xs font-medium text-slate-500 dark:text-neutral-400">${rotulo}</p>
      <p class="font-display text-2xl font-semibold tabular-nums leading-none mt-1 ${corValor}">${valor}</p>
      <p class="text-xs text-slate-500 dark:text-neutral-400 mt-1.5">${sub}</p>
    </button>`;
  return `
    <div class="grid grid-cols-3 xl:grid-cols-5 gap-3 mb-4">
      ${cartao('vencidas', 'Parcelas vencidas', vencidos.length ? Contratos.fmtCompacto(valorVencido) : 0, vencidos.length ? `em ${plural(vencidos.length, 'venda')}` : 'nenhuma parcela em atraso', vencidos.length ? 'text-red-700 dark:text-red-400' : undefined)}
      ${cartao('assinatura', 'Aguardando assinatura', assinatura, assinatura ? 'cobre as partes' : 'nenhuma venda parada', assinatura ? 'text-[color:var(--f-aviso)]' : undefined)}
      ${cartao('documentos', 'Documentação pendente', documentos, documentos ? 'falta cadastro ou condição' : 'nenhuma pendência', documentos ? 'text-[color:var(--f-aviso)]' : undefined)}
      ${cartao('sem-turma', 'Matrículas sem turma', semTurma, semTurma ? 'defina a turma para concluir' : 'todas as matrículas alocadas', semTurma ? 'text-[color:var(--f-aviso)]' : undefined)}
      ${cartao('vagas', 'Vagas disponíveis', vagas, vagas ? 'vendidas e ainda sem aluno' : 'todas as vagas preenchidas')}
    </div>`;
}
