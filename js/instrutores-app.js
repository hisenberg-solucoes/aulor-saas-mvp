// ============================================================
// UI da tela "Instrutores". Regras no motor (Instrutores.*); aqui só se
// monta HTML, reage a cliques e persiste.
// Fluxo: lista (instrutores.html) → instrutor em página própria
// (instrutor.html?id=), só com os dados do cadastro: na V1 não há abas (calendário,
// empresa e valor hora, contratos, pagamentos e documentos saíram; o pagamento do
// instrutor fica como conta a pagar no Financeiro). O mesmo arquivo atende as duas
// páginas; o modo vem de <body data-modo>. O convite de cadastro (AULOR-007) é de
// js/convites-ui.js: o filtro "Convidados" da lista e o convite pela ficha.
// ============================================================

const MODO = document.body.dataset.modo === 'detalhe' ? 'detalhe' : 'lista';

const estado = {
  lista: Instrutores.carregar(),
  selecionado: null,
  filtros: { busca: '', situacao: '', remuneracao: '', visao: '' }, // visao: '' | pendente | inativo | convidados (filtro rápido)
};

const ICONE = {
  lapis: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>',
  mais: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>',
  lupa: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>',
  fechar: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>',
  alerta: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>',
  check: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>',
  doc: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>',
  dinheiro: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>',
  envelope: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>',
  telefone: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>',
  predio: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>',
  camera: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>',
  externo: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>',
  convite: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>',
  baixo: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>',
  maleta: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>',
  pessoa: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>',
};

const BOTAO_SEC = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-40 disabled:pointer-events-none';
// Primário em petróleo: cobre é "é com você", nunca fundo de botão (Regra do Cobre).
const BOTAO_PRI = 'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/40 disabled:opacity-40 disabled:pointer-events-none';
const BOTAO_CANCELAR = 'px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition';
const BOTAO_LINK = 'inline-flex items-center gap-1 text-xs font-medium text-petrol-800 dark:text-sky-300 hover:underline';
// Botão pequeno com texto, dentro de linha de tabela (Registrar NF, Pagar, Ver).
// Ação de cartão: sem fundo nem contorno, na cor de rótulo; petróleo no hover.
const BOTAO_FANTASMA = 'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm font-medium text-slate-500 dark:text-neutral-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30';
const FOCO_CAMPO = 'focus:outline-none focus:border-[color:var(--f-foco)] focus:ring-2 focus:ring-[color:var(--f-foco)]/25';
const CAMPO_BUSCA = `h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 pl-8 pr-3 text-sm text-slate-700 dark:text-neutral-200 placeholder:text-slate-500 dark:placeholder:text-neutral-400 ${FOCO_CAMPO}`;
const SELECT_FILTRO = `h-9 max-w-56 truncate rounded-lg border bg-white dark:bg-neutral-950 px-2.5 text-sm ${FOCO_CAMPO}`;
const CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)]';
const CARTAO_OPCAO = 'cursor-pointer rounded-lg border p-3 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 border-slate-300 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500 transition';
const TH = 'px-4 py-2.5';
const TD = 'px-4 py-2.5 text-sm text-slate-600 dark:text-neutral-300';
const THEAD = 'text-xs font-medium text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800';
const APOIO = 'text-xs text-slate-500 dark:text-neutral-400';
const AVISO = 'text-[color:var(--f-cobre-tinta)]';
const LINK = 'text-petrol-800 dark:text-sky-300 hover:underline';
// Foco do teclado no link do registro acende a linha inteira, com o anel por dentro do cartão.
const FOCO_LINHA = 'has-[.link-registro:focus-visible]:bg-slate-50 dark:has-[.link-registro:focus-visible]:bg-neutral-900 has-[.link-registro:focus-visible]:outline-2 has-[.link-registro:focus-visible]:-outline-offset-2 has-[.link-registro:focus-visible]:outline-[color:var(--f-foco)]';

// Pílula só de exceção (Regra da Pílula de Exceção): ativo, empresa cadastrada e antecedentes em dia não se anunciam.
const PILULA = {
  falta: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  neutra: 'bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-400',
  extra: 'bg-petrol-800/10 text-petrol-900 dark:bg-sky-950/60 dark:text-sky-200',
};

// ---------- Helpers ----------

const statusInstrutorDe = (id) => STATUS_INSTRUTOR.find((s) => s.id === id);
const remuneracaoDe = (id) => REMUNERACOES_INSTRUTOR.find((r) => r.id === id);
const semContaPessoal = (i) => !i.contaPessoal?.pix && !i.contaPessoal?.conta;
const urlColaborador = (id) => `colaborador.html?id=${encodeURIComponent(id)}`;
const { fmtCpf, fmtCnpj, fmtCep, fmtTelefone, fmtData, fmtMoeda } = Instrutores;

function pilula(classe, texto, titulo = '') {
  return `<span title="${esc(titulo)}" class="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ${classe}">${esc(texto)}</span>`;
}
// Linha de chips do registro: dado de consulta rápida, sem caixa nem fundo.
function chipIcone(icone, conteudo, titulo = '') {
  return `<span title="${esc(titulo)}" class="inline-flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-neutral-300"><span class="text-slate-500 dark:text-neutral-400">${icone}</span>${conteudo}</span>`;
}
function busca(id, valor, placeholder, largura = 'w-56') {
  return `
    <label class="relative">
      <span class="sr-only">${esc(placeholder)}</span>
      <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-neutral-400">${ICONE.lupa}</span>
      <input type="search" id="${id}" value="${esc(valor)}" placeholder="${esc(placeholder)}" class="${CAMPO_BUSCA} ${largura}">
    </label>`;
}
const plural = (n, s, p = `${s}s`) => `${n} ${n === 1 ? s : p}`;
const SEM_VALOR = '<span class="text-slate-500 dark:text-neutral-400">não informado</span>';
const vazio = (v, fb = SEM_VALOR) => (v == null || v === '' ? fb : esc(v));
function campo(rotulo, valorHtml, largura = '') {
  return `
    <div class="${largura}">
      <p class="text-xs font-medium text-slate-500 dark:text-neutral-400">${rotulo}</p>
      <div class="text-sm text-slate-800 dark:text-neutral-100 mt-0.5 break-words">${valorHtml}</div>
    </div>`;
}
// Cabeçalho padrão dos cartões: título, frase de contexto e a ação do cartão em botão fantasma; sem divisória.
function cabecalhoSecao(titulo, subtitulo, idBotao, rotulo = 'Editar', icone = ICONE.lapis) {
  return `
    <div class="px-4 pt-4 pb-4 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="font-display text-[15px] font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h3>
        ${subtitulo ? `<p class="mt-0.5 ${APOIO}">${subtitulo}</p>` : ''}
      </div>
      ${idBotao ? `<button type="button" id="${idBotao}" class="${BOTAO_FANTASMA} -mt-1 -mr-1.5 shrink-0">${icone} ${rotulo}</button>` : ''}
    </div>`;
}
function avatar(i, tamanho = 'h-9 w-9 text-xs') {
  return i.foto
    ? `<img src="${i.foto}" alt="" class="${tamanho} rounded-full object-cover shrink-0">`
    : `<div class="${tamanho} rounded-full bg-petrol-800 text-white grid place-items-center font-display font-semibold shrink-0">${esc(Instrutores.iniciais(i.nome))}</div>`;
}
const listaVazia = (texto) => `<p class="px-4 pb-4 text-sm text-slate-500 dark:text-neutral-400">${texto}</p>`;
// Faixa do topo: só quando alguém precisa agir (Regra da Faixa que Pede Ação). Sem contorno.
function faixa(html, acaoHtml = '') {
  return `
    <div class="mb-4 flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
      <span class="shrink-0 text-amber-600 dark:text-amber-400">${ICONE.alerta}</span>
      <div class="min-w-0 flex-1">${html}</div>
      ${acaoHtml}
    </div>`;
}
const ACAO_FAIXA = 'shrink-0 font-medium underline-offset-2 hover:underline';
// WhatsApp: o atalho de contato do cabeçalho (Regra da Ação à Vista).
const linkWhats = (numero) => (numero ? `<a href="https://wa.me/55${esc(Instrutores.digitos(numero))}" target="_blank" rel="noopener" title="WhatsApp ${esc(fmtTelefone(numero))}" aria-label="Abrir conversa no WhatsApp" class="inline-flex items-center justify-center h-9 w-9 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30">${ICONE_WHATSAPP}</a>` : '');
const thead = (colunas) => `<thead class="${THEAD}"><tr>${colunas.map(([rotulo, classe = '']) => `<th class="${TH} ${classe}">${rotulo}</th>`).join('')}</tr></thead>`;

function persistir() { Instrutores.salvar(estado.lista); }
function atual() { return Instrutores.porId(estado.lista, estado.selecionado); }

function selecionar(id) {
  location.href = id ? `instrutor.html?id=${encodeURIComponent(id)}` : 'instrutores.html';
}
const turmaLink = (t) => (t ? `<a href="turma.html?id=${encodeURIComponent(t.id)}" class="${LINK}">${esc(t.codigo)}</a>` : '<span class="text-slate-500 dark:text-neutral-400">turma removida</span>');

// ---------- Lista ----------

// Filtro rápido sobre a busca e a situação: as exceções que a coordenação procura. Os convidados
// ainda não são instrutores: só aparecem no próprio filtro e não contam nos outros (GAC-3 de AULOR-007).
const VISOES = [{ id: '', nome: 'Todos' }, { id: 'pendente', nome: 'Com pendência' }, { id: 'inativo', nome: 'Inativos' }, { id: 'convidados', nome: 'Convidados' }];
// Pendência de inativo não conta: ninguém vai agir sobre ele.
const pendenciasDe = (i) => (i.status === 'inativo' ? [] : Instrutores.pendencias(i));
const urlDetalhe = (id) => `instrutor.html?id=${encodeURIComponent(id)}`;

function renderLista() {
  const el = document.getElementById('tela');
  const f = estado.filtros;
  const base = Instrutores.filtrar(estado.lista, { busca: f.busca, situacao: f.situacao, remuneracao: f.remuneracao });
  const convites = Convites.daLista('instrutor', f.busca);
  const porVisao = { '': base, pendente: base.filter((i) => pendenciasDe(i).length), inativo: base.filter((i) => i.status === 'inativo'), convidados: convites };
  const visiveis = porVisao[f.visao];
  const deConvidados = f.visao === 'convidados';
  const filtrando = f.busca || f.situacao || f.remuneracao;
  const SITUACOES = [
    { id: 'sem-empresa', nome: 'Sem empresa para pagamento' },
    { id: 'antecedentes', nome: `Antecedentes ${Instrutores.anoAtual()} pendente` },
  ];
  const corSelect = (ativo) => (ativo ? 'border-[color:var(--f-foco)] text-slate-900 dark:text-neutral-100' : 'border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-200');
  // PJ é o comum e mostra só a empresa; RPA e folha dizem o que são (Regra da Pílula de Exceção).
  const celulaPagamento = (i) => {
    if (i.remuneracao === 'folha') return `<p>Folha</p><p class="${APOIO}">aula dentro do salário</p>`;
    if (i.remuneracao === 'rpa') {
      const cp = i.contaPessoal;
      return semContaPessoal(i)
        ? `<p>RPA</p><p class="text-xs font-medium ${AVISO}" title="Não pode receber pagamento">sem PIX nem conta</p>`
        : `<p>RPA</p><p class="${APOIO} truncate" title="Conta da própria pessoa">${esc(cp.pix ? `PIX ${cp.pix}` : `${cp.banco} · ${cp.conta}`)}</p>`;
    }
    return i.empresa
      ? `<p class="truncate" title="${esc(i.empresa.razaoSocial)}">${esc(i.empresa.razaoSocial)}</p><p class="${APOIO} font-mono">${esc(fmtCnpj(i.empresa.cnpj))}</p>`
      : `<p class="text-xs font-medium ${AVISO}" title="Não pode receber pagamento">sem empresa</p>`;
  };

  // Uma linha por instrutor em três colunas fixas (cabe em 1280px). Abaixo do nome, a especialidade e, se houver,
  // as pendências em cobre, legíveis sem hover.
  const linha = (i) => {
    const pend = pendenciasDe(i);
    const colab = i.colaboradorId ? Instrutores.pessoaDe(i).colaborador : null;
    const marcas = [
      i.status === 'inativo' ? pilula(PILULA.neutra, 'Inativo') : '',
      i.colaboradorId ? `<a href="${urlColaborador(i.colaboradorId)}" title="${esc(colab ? `Também é colaborador: ${colab.cargo}` : 'Também é colaborador')}" class="inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ${PILULA.extra} hover:underline underline-offset-2">Na equipe</a>` : '',
    ].join('');
    return `
      <tr data-abrir="${i.id}" class="cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900 transition ${FOCO_LINHA} ${i.status === 'inativo' ? 'opacity-60' : ''}">
        <td class="${TH}">
          <div class="flex items-center gap-3 min-w-0">
            ${avatar(i)}
            <div class="min-w-0">
              <p class="flex items-center gap-1.5 min-w-0 text-sm font-medium text-slate-800 dark:text-neutral-100"><a href="${urlDetalhe(i.id)}" class="link-registro min-w-0 truncate hover:underline underline-offset-2 focus-visible:outline-none">${esc(i.nome)}</a>${i.apelido && i.apelido !== i.nome ? `<span class="shrink-0 text-xs font-normal text-slate-500 dark:text-neutral-400">· ${esc(i.apelido)}</span>` : ''}${marcas}</p>
              <p class="${APOIO} truncate">${vazio(i.especialidade, 'sem especialidade')}</p>
              ${pend.length ? `<p class="mt-0.5 flex items-center gap-1.5 text-xs font-medium ${AVISO}" title="${esc(pend.join(' · '))}"><span aria-hidden="true" class="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--f-cobre)]"></span><span class="truncate">${plural(pend.length, 'pendência')}: ${esc(pend.join(' · '))}</span></p>` : ''}
            </div>
          </div>
        </td>
        <td class="${TD}">
          <p class="truncate" title="${esc(i.contato.email ?? '')}">${vazio(i.contato.email, '<span class="text-slate-500 dark:text-neutral-400">—</span>')}</p>
          <p class="${APOIO} tabular-nums">${esc(fmtTelefone(i.contato.whatsapp))}</p>
        </td>
        <td class="${TD}">${celulaPagamento(i)}</td>
      </tr>`;
  };

  el.innerHTML = `
    <div class="mb-4 flex items-start justify-between gap-6">
      <div>
        <h2 class="font-display text-xl font-semibold text-slate-900 dark:text-neutral-100">Instrutores <span class="ml-1 text-base font-normal text-slate-600 dark:text-neutral-400 tabular-nums">${estado.lista.length}</span></h2>
        <p class="max-w-3xl text-sm text-slate-600 dark:text-neutral-400 mt-0.5">Quem dá aula, de fora ou da equipe: dados pessoais, contato, endereço e remuneração (PJ, RPA ou folha). O pagamento do instrutor é uma conta a pagar no Financeiro.</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        ${ConvitesUI.pode('instrutor', 'criar') ? `<button type="button" id="btn-convidar" class="${BOTAO_SEC}" title="O instrutor recebe o convite por e-mail, entra com ele e completa o próprio cadastro">${ICONE.convite} Convidar instrutor</button>` : ''}
        <button type="button" id="btn-novo" class="${BOTAO_PRI}">${ICONE.mais} Novo instrutor</button>
      </div>
    </div>

    <div role="group" aria-label="Filtro rápido" class="mb-4 shadow-[inset_0_-1px_0] shadow-slate-200 dark:shadow-neutral-800 flex items-center gap-4">
      ${VISOES.map((v) => {
        const ativa = v.id === f.visao;
        const n = porVisao[v.id].length;
        return `<button type="button" data-visao="${v.id}" aria-pressed="${ativa}" class="px-0.5 pb-2.5 text-[13px] font-medium border-b-2 transition whitespace-nowrap ${ativa ? 'border-[color:var(--f-marca-tinta)] text-[color:var(--f-tinta)]' : 'border-transparent text-[color:var(--f-tinta-3)] hover:text-[color:var(--f-tinta-2)]'}">${v.nome} <span class="ml-0.5 text-xs tabular-nums ${v.id === 'pendente' && n ? 'text-[color:var(--f-cobre-tinta)]' : 'text-[color:var(--f-tinta-3)]'}">${n}</span></button>`;
      }).join('')}
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-2">
      ${busca('busca-instrutor', f.busca, deConvidados ? 'Buscar convidado pelo nome ou e-mail' : 'Buscar nome, especialidade, e-mail ou empresa', 'w-96')}
      <div class="ml-auto flex flex-wrap items-center gap-2 ${deConvidados ? 'hidden' : ''}">
        <select id="filtro-remuneracao" class="${SELECT_FILTRO} ${corSelect(f.remuneracao)}" aria-label="Remuneração">
          <option value="">Todas as remunerações</option>
          ${REMUNERACOES_INSTRUTOR.map((o) => `<option value="${o.id}" ${o.id === f.remuneracao ? 'selected' : ''}>${esc(o.nome)}</option>`).join('')}
        </select>
        <select id="filtro-situacao" class="${SELECT_FILTRO} ${corSelect(f.situacao)}" aria-label="Situação">
          <option value="">Todas as situações</option>
          ${SITUACOES.map((o) => `<option value="${o.id}" ${o.id === f.situacao ? 'selected' : ''}>${esc(o.nome)}</option>`).join('')}
        </select>
        ${filtrando ? `<button type="button" id="btn-limpar-filtros" class="${BOTAO_LINK}">Limpar</button>` : ''}
      </div>
    </div>

    ${deConvidados ? ConvitesUI.tabela(convites, 'instrutor', f.busca) : `
    <div class="${CARTAO} overflow-x-auto">
      <table data-tabela-instrutores class="w-full table-fixed text-left">
        ${thead([['Instrutor'], ['Contato', 'w-[220px]'], ['Pagamento', 'w-[220px]']])}
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
          ${visiveis.length ? visiveis.map(linha).join('') : `
          <tr><td colspan="3" class="px-4 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">
            ${!estado.lista.length ? `Nenhum instrutor cadastrado ainda.<br><button type="button" id="btn-novo-vazio" class="${BOTAO_PRI} mt-4">${ICONE.mais} Cadastrar o primeiro instrutor</button>`
              : `Nenhum instrutor corresponde aos filtros. <button type="button" data-limpar class="${BOTAO_LINK} ml-1">Limpar filtros</button>`}
          </td></tr>`}
        </tbody>
      </table>
      <div class="px-4 py-2 border-t border-slate-100 dark:border-neutral-900 ${APOIO} tabular-nums">
        ${plural(visiveis.length, 'instrutor', 'instrutores')}${visiveis.length !== estado.lista.length ? ` de ${estado.lista.length}` : ''}
      </div>
    </div>`}`;

  const limpar = () => { estado.filtros = { busca: '', situacao: '', remuneracao: '', visao: '' }; renderLista(); };
  const campoBusca = el.querySelector('#busca-instrutor');
  campoBusca.addEventListener('input', () => { estado.filtros.busca = campoBusca.value; renderLista(); const b = el.querySelector('#busca-instrutor'); b.focus(); b.setSelectionRange(b.value.length, b.value.length); });
  el.querySelector('#filtro-situacao').addEventListener('change', (e) => { estado.filtros.situacao = e.target.value; renderLista(); });
  el.querySelector('#filtro-remuneracao').addEventListener('change', (e) => { estado.filtros.remuneracao = e.target.value; renderLista(); });
  const aoMudarConvite = () => { estado.filtros.visao = 'convidados'; renderLista(); };
  el.querySelectorAll('[data-visao]').forEach((b) => b.addEventListener('click', () => { estado.filtros.visao = b.dataset.visao; renderLista(); el.querySelector(`[data-visao="${estado.filtros.visao}"]`).focus(); }));
  el.querySelector('#btn-limpar-filtros')?.addEventListener('click', limpar);
  el.querySelector('[data-limpar]')?.addEventListener('click', limpar);
  el.querySelector('#btn-novo').addEventListener('click', () => abrirDrawerInstrutor());
  el.querySelector('#btn-convidar')?.addEventListener('click', () => ConvitesUI.abrirFormulario({ papel: 'instrutor', aoMudar: aoMudarConvite }));
  el.querySelector('#btn-novo-vazio')?.addEventListener('click', () => abrirDrawerInstrutor());
  ConvitesUI.ligarTabela(el, aoMudarConvite);
  // O nome é o link (teclado, ⌘-clique); o resto da linha abre o mesmo registro, a não ser que haja texto selecionado.
  el.querySelector('[data-tabela-instrutores]')?.addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-abrir]');
    if (!tr || e.target.closest('a, button') || getSelection().toString()) return;
    if (e.metaKey || e.ctrlKey) window.open(urlDetalhe(tr.dataset.abrir), '_blank'); else selecionar(tr.dataset.abrir);
  });
}

// ---------- Instrutor aberto ----------

function renderInstrutor() {
  const el = document.getElementById('tela');
  const i = atual();
  const pend = pendenciasDe(i);
  const pendPag = Instrutores.pendenciasPagamento(i);
  const podeExcluir = Instrutores.podeExcluir(i);
  const colab = i.colaboradorId ? Instrutores.pessoaDe(i).colaborador : null;

  // Uma ação à vista (e o WhatsApp); foto, status e exclusão no "Mais".
  const itensMais = [
    { nome: i.foto ? 'Trocar foto' : 'Adicionar foto', detalhe: 'Aparece na lista e no portal do professor', acao: abrirDrawerFoto },
    'sep',
    i.status === 'ativo'
      ? { nome: 'Inativar', detalhe: 'Não recebe mais turmas; o histórico continua', acao: () => alterarStatus(i.id, 'inativo') }
      : { nome: 'Reativar', detalhe: 'Volta a poder receber turmas', acao: () => alterarStatus(i.id, 'ativo') },
    'sep',
    { nome: 'Excluir instrutor', perigo: true, desabilitado: !podeExcluir, detalhe: podeExcluir ? 'Só para cadastro errado' : 'Tem contrato gerado ou pagamento feito — inative em vez de excluir', acao: () => confirmarExclusao(i.id) },
  ].filter(Boolean);

  el.innerHTML = `
    <nav aria-label="Breadcrumb" class="mb-3 flex items-center gap-1.5 text-sm text-slate-600 dark:text-neutral-400">
      <a href="instrutores.html" class="hover:text-petrol-800 dark:hover:text-sky-300 transition">Instrutores</a>
      <span>/</span>
      <span class="font-medium text-slate-800 dark:text-neutral-100 truncate max-w-xs" aria-current="page">${esc(i.nome)}</span>
    </nav>
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1 basis-80 flex items-start gap-3">
        <button type="button" id="btn-foto" title="${i.foto ? 'Trocar foto' : 'Adicionar foto'}" aria-label="${i.foto ? 'Trocar foto' : 'Adicionar foto'}" class="relative group shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--f-foco)]">
          ${avatar(i, 'h-12 w-12 text-base')}
          <span class="absolute inset-0 rounded-full bg-petrol-950/60 text-white grid place-items-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition">${ICONE.camera}</span>
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2 min-w-0">
            <h2 class="font-registro text-[26px] leading-[1.15] font-semibold tracking-[-0.01em] text-slate-900 dark:text-neutral-100 truncate">${esc(i.nome)}</h2>
            ${i.status === 'inativo' ? pilula(PILULA.neutra, 'Inativo', statusInstrutorDe(i.status).descricao) : ''}
          </div>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
            ${i.apelido && i.apelido !== i.nome ? chipIcone(ICONE.pessoa, `chamado de ${esc(i.apelido)}`, 'Como gosta de ser chamado') : ''}
            ${i.especialidade ? chipIcone(ICONE.doc, esc(i.especialidade), 'Especialidade') : ''}
            ${i.contato.email ? chipIcone(ICONE.envelope, `<a href="mailto:${esc(i.contato.email)}" class="hover:underline">${esc(i.contato.email)}</a>`, 'E-mail') : ''}
            ${i.contato.whatsapp ? chipIcone(ICONE.telefone, `<span class="tabular-nums">${esc(fmtTelefone(i.contato.whatsapp))}</span>`, 'WhatsApp') : ''}
            ${i.remuneracao === 'pj' && i.empresa ? chipIcone(ICONE.predio, esc(i.empresa.razaoSocial), `CNPJ ${fmtCnpj(i.empresa.cnpj)}`) : ''}
            ${i.remuneracao !== 'pj' ? chipIcone(ICONE.dinheiro.replace('h-4 w-4', 'h-3.5 w-3.5'), esc(remuneracaoDe(i.remuneracao).nome), remuneracaoDe(i.remuneracao).descricao) : ''}
            ${i.colaboradorId ? chipIcone(ICONE.maleta, `<a href="${urlColaborador(i.colaboradorId)}" class="hover:underline">${colab ? `Na equipe · ${esc(colab.cargo)}` : 'Na equipe'}</a>`, 'Também é colaborador; abre o cadastro na equipe') : ''}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        ${i.status === 'ativo' ? linkWhats(i.contato.whatsapp) : ''}
        <button type="button" id="btn-editar" class="${BOTAO_SEC}">${ICONE.lapis} Editar dados</button>
        <button type="button" id="btn-mais" class="${BOTAO_SEC}" aria-haspopup="menu" aria-expanded="false">Mais ${ICONE.baixo}</button>
      </div>
    </div>

    ${pend.length ? faixa(`<span class="font-medium">${plural(pend.length, 'pendência')} no cadastro:</span> ${pend.map(esc).join(' · ')}${pendPag.length ? `.<br><span class="font-medium">Bloqueiam o pagamento:</span> ${pendPag.map(esc).join(' · ')}.` : ''}`) : ''}

    <div id="aba"></div>`;

  el.querySelector('#btn-editar').addEventListener('click', () => abrirDrawerInstrutor(i.id));
  el.querySelector('#btn-mais').addEventListener('click', (e) => abrirMenu(e.currentTarget, itensMais));
  el.querySelector('#btn-foto').addEventListener('click', () => abrirDrawerFoto());

  renderAbaDados(el.querySelector('#aba'), i);
}

function alterarStatus(id, status) {
  estado.lista = Instrutores.alterarStatus(estado.lista, id, status);
  persistir();
  renderInstrutor();
  toast(`${atual().apelido || atual().nome} ${status === 'ativo' ? 'reativado.' : 'inativado.'}`);
}

// ---------- Aba Dados ----------

function renderAbaDados(el, i) {
  const e = i.endereco; const c = i.contato; const tag = i.tagEstacionamento;
  const turmas = Instrutores.turmasDoInstrutor(i.id);
  const pessoa = Instrutores.pessoaDe(i);
  const idade = Instrutores.idade(pessoa.nascimento);
  const rem = remuneracaoDe(i.remuneracao);
  el.innerHTML = `
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <section class="${CARTAO}">
        ${cabecalhoSecao('Identificação', i.colaboradorId ? `Nascimento e CPF vêm do cadastro na equipe: <a href="${urlColaborador(i.colaboradorId)}" class="${LINK}">abrir colaborador</a>.` : 'Dados pessoais — os mesmos do formulário de cadastro.', 'btn-editar-dados')}
        <div class="px-4 pb-4 grid grid-cols-2 gap-4">
          ${campo('Nome completo', esc(i.nome), 'col-span-2')}
          ${i.nomeSocial ? campo('Nome social', esc(i.nomeSocial), 'col-span-2') : ''}
          ${campo('Como gosta de ser chamado', vazio(i.apelido))}
          ${campo('Data de nascimento', pessoa.nascimento ? `<span class="tabular-nums">${esc(fmtData(pessoa.nascimento))}</span> <span class="${APOIO}">· ${idade} anos</span>` : vazio(null))}
          ${campo('CPF', pessoa.cpf ? `<span class="font-mono">${esc(fmtCpf(pessoa.cpf))}</span>${Instrutores.cpfValido(pessoa.cpf) ? '' : ' <span class="text-xs font-medium text-red-700 dark:text-red-400">inválido</span>'}` : vazio(null))}
          ${campo('RG', vazio(i.rg))}
          ${campo('Remuneração', `${esc(rem.nome)} <span class="${APOIO}">· ${esc(rem.descricao)}</span>`, 'col-span-2')}
          ${i.remuneracao === 'folha' ? campo('Custo-hora de referência', i.custoHoraReferencia ? `<span class="tabular-nums">${esc(fmtMoeda(i.custoHoraReferencia))}/h</span> <span class="${APOIO}">· usado só no resultado da turma</span>` : `${vazio(null)} <span class="${APOIO}">· a turma mostra “custo de folha não informado”</span>`, 'col-span-2') : ''}
          ${campo('Especialidade', vazio(i.especialidade), 'col-span-2')}
          ${campo('Sobre', vazio(i.bio, '<span class="text-slate-500 dark:text-neutral-400">Nenhuma descrição.</span>'), 'col-span-2')}
        </div>
      </section>

      <section class="${CARTAO}">
        ${cabecalhoSecao('Contato', 'E-mail, WhatsApp e quem avisar numa emergência.', 'btn-editar-contato')}
        <div class="px-4 pb-4 grid grid-cols-2 gap-4">
          ${campo('E-mail', c.email ? `<a href="mailto:${esc(c.email)}" class="${LINK}">${esc(c.email)}</a>` : vazio(null))}
          ${campo('WhatsApp', c.whatsapp ? `<a href="https://wa.me/55${esc(Instrutores.digitos(c.whatsapp))}" target="_blank" rel="noopener" class="${LINK} tabular-nums">${esc(fmtTelefone(c.whatsapp))}</a>` : vazio(null))}
          ${campo('Contato de emergência', c.emergencia?.nome ? `${esc(c.emergencia.nome)} <span class="text-slate-500 dark:text-neutral-400 tabular-nums">· ${esc(fmtTelefone(c.emergencia.telefone))}</span>` : vazio(null), 'col-span-2')}
        </div>
      </section>

      <section class="${CARTAO}" data-cartao-acesso>
        ${cabecalhoSecao('Acesso ao sistema', 'O usuário com que a pessoa entra no Aulor e no portal do professor.', null)}
        ${cartaoAcesso(i)}
      </section>

      <section class="${CARTAO}">
        ${cabecalhoSecao('Endereço', 'Endereço residencial.', 'btn-editar-endereco')}
        <div class="px-4 pb-4 grid grid-cols-2 gap-4">
          ${campo('Endereço', e.logradouro ? `${esc(e.logradouro)}${e.numero ? `, ${esc(e.numero)}` : ''}${e.complemento ? ` <span class="text-slate-500 dark:text-neutral-400">· ${esc(e.complemento)}</span>` : ''}` : vazio(null), 'col-span-2')}
          ${campo('Bairro', vazio(e.bairro))}
          ${campo('CEP', e.cep ? `<span class="font-mono">${esc(fmtCep(e.cep))}</span>` : vazio(null))}
          ${campo('Cidade / UF', e.cidade ? `${esc(e.cidade)} / ${esc(e.uf)}` : vazio(null), 'col-span-2')}
        </div>
      </section>

      <section class="${CARTAO}">
        ${cabecalhoSecao('Acesso ao prédio', 'Tag de estacionamento cedida pela empresa.', 'btn-editar-tag')}
        <div class="px-4 pb-4 grid grid-cols-2 gap-4">
          ${campo('Tag de estacionamento', tag.possui ? 'Possui' : 'Não possui')}
          ${tag.possui ? campo('Identificação', vazio(tag.identificacao)) : ''}
          ${tag.possui ? campo('Cedida em', tag.cedidaEm ? `<span class="tabular-nums">${esc(fmtData(tag.cedidaEm))}</span>` : vazio(null)) : (tag.devolvidaEm ? campo('Devolvida em', `<span class="tabular-nums">${esc(fmtData(tag.devolvidaEm))}</span>`) : '')}
        </div>
      </section>

      <section class="${CARTAO} overflow-hidden">
        ${cabecalhoSecao('Turmas', 'Turmas em que está escalado; a escala é feita na turma.', null)}
        ${turmas.length ? `
        <table class="w-full text-left">
          ${thead([['Turma'], ['Curso'], ['Período']])}
          <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
            ${turmas.map((t) => {
              const cu = Instrutores.cursoDe(t.cursoId);
              return `<tr><td class="${TD}">${turmaLink(t)}</td><td class="${TD}">${cu ? `${esc(cu.codigo)} · ${esc(cu.nome)}` : '—'}</td><td class="${TD} whitespace-nowrap tabular-nums">${esc(fmtData(t.inicio))} – ${esc(fmtData(t.fim))}</td></tr>`;
            }).join('')}
          </tbody>
        </table>` : listaVazia('Nenhuma turma escalada para este instrutor.')}
      </section>

      <section class="${CARTAO}">
        ${cabecalhoSecao('Observações', 'Avisos internos.', 'btn-editar-obs')}
        <div class="px-4 pb-4 text-sm text-slate-800 dark:text-neutral-100 whitespace-pre-line">${vazio(i.observacoes, '<span class="text-slate-500 dark:text-neutral-400">Nenhuma.</span>')}</div>
      </section>

      <section class="${CARTAO}">
        ${cabecalhoSecao('Histórico', 'Eventos do cadastro.', null)}
        ${i.historico.length ? `<ol class="px-4 pb-4 space-y-2">${[...i.historico].reverse().map((h) => `<li class="flex items-baseline gap-3 text-sm"><span class="text-xs text-slate-500 dark:text-neutral-400 tabular-nums w-20 shrink-0">${esc(fmtData(h.em))}</span><span class="text-slate-800 dark:text-neutral-100">${esc(h.texto)}</span></li>`).join('')}</ol>` : listaVazia('Sem eventos.')}
      </section>
    </div>`;
  el.querySelector('#btn-editar-dados').addEventListener('click', () => abrirDrawerInstrutor(i.id));
  el.querySelector('#btn-editar-contato').addEventListener('click', () => abrirDrawerContato());
  el.querySelector('#btn-editar-endereco').addEventListener('click', () => abrirDrawerEndereco());
  el.querySelector('#btn-editar-tag').addEventListener('click', () => abrirDrawerTag());
  el.querySelector('#btn-editar-obs').addEventListener('click', () => abrirDrawerObservacoes());
  el.querySelector('#btn-vincular-acesso')?.addEventListener('click', () => abrirDrawerVincularAcesso());
  el.querySelector('#btn-desvincular-acesso')?.addEventListener('click', () => desvincularAcesso());
  if (!Instrutores.usuarioDe(i)) ConvitesUI.ligarFicha(el.querySelector('[data-cartao-acesso]'), 'instrutor', pessoaDoConvite(i), () => renderInstrutor());
}

// ---------- Acesso ao sistema ----------

const TAG = 'inline-flex items-center h-6 rounded px-2 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-neutral-900 dark:text-neutral-300';
const pessoaDoConvite = (i) => ({ id: i.id, nome: i.nomeSocial || i.nome, email: i.contato.email });

// O usuário é da pessoa: quem é da equipe usa o do colaborador. Sem usuário, o convite pela ficha (GAC-6 de AULOR-007).
function cartaoAcesso(i) {
  const usuarioId = Instrutores.usuarioDe(i);
  if (!usuarioId) {
    if (i.colaboradorId) return `<p class="px-4 pb-4 text-sm text-slate-800 dark:text-neutral-100">Ainda não tem usuário. O acesso de quem é da equipe fica na <a href="${urlColaborador(i.colaboradorId)}" class="${LINK}">ficha de colaborador</a>.</p>`;
    return ConvitesUI.ficha('instrutor', pessoaDoConvite(i), `<button type="button" id="btn-vincular-acesso" class="${BOTAO_SEC}">Vincular usuário existente</button>`, 'px-4 pb-4');
  }
  const a = Colaboradores.Acesso.de(usuarioId);
  if (!a.usuario) return `<p class="px-4 pb-4 text-sm text-red-700 dark:text-red-400">O usuário <span class="font-mono">${esc(usuarioId)}</span> não existe mais em Perfis de acesso.</p>`;
  return `
    <div class="px-4 pb-4 grid grid-cols-2 gap-4">
      ${campo('Usuário', `${esc(a.usuario.nome)} <span class="font-mono text-xs text-slate-500 dark:text-neutral-400">· ${esc(a.usuario.id)}</span>`)}
      ${campo('Perfis de acesso', a.perfis.length ? `<span class="flex flex-wrap gap-1 mt-1">${a.perfis.map((p) => `<span class="${TAG}">${esc(p.nome)}</span>`).join('')}</span>` : `<span class="font-medium ${AVISO}">Nenhum perfil — o usuário existe mas não acessa nada.</span>`)}
    </div>
    <div class="px-4 pb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      ${i.colaboradorId ? `<a href="${urlColaborador(i.colaboradorId)}" class="${BOTAO_LINK}">Gerido na ficha de colaborador</a>` : `<button type="button" id="btn-desvincular-acesso" class="${BOTAO_LINK}">Desvincular</button>`}
      <a href="perfis.html" target="_blank" class="${BOTAO_LINK} ml-auto">Abrir Perfis de acesso ${ICONE.externo}</a>
    </div>`;
}

// Usuários sem pessoa ligada: nem colaborador, nem outro instrutor de fora da equipe.
function abrirDrawerVincularAcesso() {
  const i = atual();
  const ocupados = estado.lista.filter((x) => x.id !== i.id && !x.colaboradorId).map((x) => x.acesso?.usuarioId);
  const livres = Colaboradores.Acesso.livres(Colaboradores.carregar(), null, ocupados);
  drawerFormulario({
    id: 'form-vincular-acesso', titulo: 'Vincular usuário existente', subtitulo: 'Usuários de <strong>Perfis de acesso</strong> que ainda não são de outra pessoa da unidade.', rotulo: 'Vincular', largura: 'max-w-lg',
    corpo: livres.length ? `
      <div class="space-y-2">
        ${livres.map((u) => `
        <label class="${CARTAO_OPCAO} flex items-start gap-2.5">
          <input type="radio" name="usuarioId" value="${esc(u.id)}" class="sr-only">
          <span class="block text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(u.nome)} <span class="font-mono text-xs font-normal text-slate-500 dark:text-neutral-400">· ${esc(u.id)}</span></span>
        </label>`).join('')}
      </div>
      ${ERRO('usuarioId')}` : '<p class="text-sm text-slate-500 dark:text-neutral-400">Todos os usuários já estão ligados a alguém. Para dar acesso, use "Enviar convite".</p>',
    aoSalvar: (fd) => {
      const usuarioId = fd.get('usuarioId');
      if (!usuarioId) return livres.length ? [{ campo: 'usuarioId', mensagem: 'Escolha um usuário.' }] : [];
      estado.lista = Instrutores.vincularUsuario(estado.lista, i.id, usuarioId);
      persistir(); renderInstrutor();
      toast(`Usuário "${livres.find((u) => u.id === usuarioId).nome}" vinculado.`);
    },
  });
}

function desvincularAcesso() {
  estado.lista = Instrutores.vincularUsuario(estado.lista, estado.selecionado, null);
  persistir(); renderInstrutor();
  toast('Usuário desvinculado — ele continua existindo em Perfis de acesso.');
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
const OPCIONAL = '<span class="font-normal text-slate-500 dark:text-neutral-400">(opcional)</span>';

function drawerFormulario({ id, titulo, subtitulo, corpo, rotulo, largura = 'max-w-md', aoSalvar, foco }) {
  const { fechar, root } = abrirDrawer(`
    <form id="${id}" novalidate role="dialog" aria-modal="true" class="drawer-anim relative h-full w-full ${largura} bg-white dark:bg-neutral-950 border-l border-slate-200 dark:border-neutral-800 shadow-xl flex flex-col">
      <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
        <div>
          <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h3>
          <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${subtitulo}</p>
        </div>
        <button type="button" data-fechar-drawer class="p-1 rounded text-slate-500 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${ICONE.fechar}</button>
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
  if (foco) form.querySelector(foco)?.focus();
  return { form, fechar };
}

const campoTexto = (name, rotulo, valor, { tipo = 'text', placeholder = '', max = '', extra = '', opcional = false, sufixo = '', prefixo = '', mascara = '' } = {}) => `
  <div>
    <label class="rotulo" for="f-${name}">${rotulo} ${opcional ? OPCIONAL : ''}</label>
    <div class="relative">
      ${prefixo ? `<span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-neutral-400">${prefixo}</span>` : ''}
      <input id="f-${name}" name="${name}" type="${tipo}" ${max ? `maxlength="${max}"` : ''} ${extra} ${mascara ? `data-mascara="${mascara}"` : ''} class="campo ${sufixo ? '!pr-14' : ''} ${prefixo ? '!pl-9' : ''}" placeholder="${esc(placeholder)}" value="${esc(valor ?? '')}">
      ${sufixo ? `<span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-neutral-400">${sufixo}</span>` : ''}
    </div>
    ${ERRO(name)}
  </div>`;
const campoArea = (name, rotulo, valor, { rows = 3, placeholder = '', max = '', opcional = false, ajuda = '' } = {}) => `
  <div>
    <label class="rotulo" for="f-${name}">${rotulo} ${opcional ? OPCIONAL : ''}</label>
    <textarea id="f-${name}" name="${name}" rows="${rows}" ${max ? `maxlength="${max}"` : ''} class="campo resize-y" placeholder="${esc(placeholder)}">${esc(valor ?? '')}</textarea>
    ${ajuda ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-1">${ajuda}</p>` : ''}
    ${ERRO(name)}
  </div>`;
const campoSelect = (name, rotulo, opcoes, valor, { vazio: v = 'Escolha', opcional = false } = {}) => `
  <div>
    <label class="rotulo" for="f-${name}">${rotulo} ${opcional ? OPCIONAL : ''}</label>
    <select id="f-${name}" name="${name}" class="campo">
      <option value="" ${valor ? '' : 'selected'} ${opcional ? '' : 'disabled'}>${esc(v)}</option>
      ${opcoes.map((o) => `<option value="${o.id}" ${valor === o.id ? 'selected' : ''}>${esc(o.nome)}</option>`).join('')}
    </select>
    ${ERRO(name)}
  </div>`;
const cartoesRadio = (name, opcoes, valor, colunas = 'grid-cols-3') => `
  <div class="grid ${colunas} gap-2">
    ${opcoes.map((o) => `
    <label class="${CARTAO_OPCAO}">
      <input type="radio" name="${name}" value="${o.id}" class="sr-only" ${valor === o.id ? 'checked' : ''}>
      <p class="text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(o.nome)}</p>
      ${o.descricao ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(o.descricao)}</p>` : ''}
    </label>`).join('')}
  </div>`;

// ---------- Drawers do instrutor ----------

function abrirDrawerInstrutor(id = null) {
  const i = id ? Instrutores.porId(estado.lista, id) : null;
  const d = i ?? { nome: '', apelido: '', nascimento: '', cpf: '', rg: '', especialidade: '', bio: '', status: null, remuneracao: 'pj', custoHoraReferencia: null };
  const vinculado = Boolean(i?.colaboradorId);
  const { form } = drawerFormulario({
    id: 'form-instrutor',
    titulo: i ? 'Editar dados do instrutor' : 'Novo instrutor',
    subtitulo: i ? 'Identificação e especialidade.' : 'Só o essencial. Depois você completa contato e endereço.',
    rotulo: i ? 'Salvar alterações' : 'Criar instrutor',
    largura: 'max-w-lg',
    foco: '#f-nome',
    corpo: `
      ${campoTexto('nome', 'Nome completo', d.nome, { max: 120 })}
      ${vinculado ? `
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('apelido', 'Como gosta de ser chamado', d.apelido, { max: 40 })}
        ${campoTexto('rg', 'RG', d.rg, { max: 20, opcional: true })}
      </div>
      <p class="${APOIO}">Nascimento e CPF ficam no cadastro na equipe — <a href="${urlColaborador(i.colaboradorId)}" class="${LINK}">editar no colaborador</a>.</p>` : `
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('apelido', 'Como gosta de ser chamado', d.apelido, { max: 40 })}
        ${campoTexto('nascimento', 'Data de nascimento', d.nascimento, { tipo: 'date' })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('cpf', 'CPF', i ? fmtCpf(d.cpf) : '', { placeholder: '000.000.000-00', max: 14, mascara: 'cpf' })}
        ${campoTexto('rg', 'RG', d.rg, { max: 20 })}
      </div>
      <div id="aviso-colaborador" aria-live="polite"></div>`}
      ${campoTexto('especialidade', 'Especialidade', d.especialidade, { placeholder: 'Ex.: Java e Spring', max: 80, opcional: true })}
      ${campoArea('bio', 'Sobre', d.bio, { rows: 3, max: 600, opcional: true, placeholder: 'Resumo profissional que aparece para a equipe.' })}
      <fieldset><legend class="rotulo">Remuneração</legend>${cartoesRadio('remuneracao', REMUNERACOES_INSTRUTOR, d.remuneracao)}${ERRO('remuneracao')}</fieldset>
      <div id="campo-custo-hora" class="${d.remuneracao === 'folha' ? '' : 'hidden'}">
        ${campoTexto('custoHoraReferencia', 'Custo-hora de referência', d.custoHoraReferencia ?? '', { tipo: 'number', extra: 'min="0.01" step="0.01"', prefixo: 'R$', sufixo: '/h', opcional: true })}
        <p class="${APOIO} mt-1">Salário com encargos dividido pelas horas do mês. Entra só no resultado da turma.</p>
      </div>
      ${i ? `<fieldset><legend class="rotulo">Status</legend>${cartoesRadio('status', STATUS_INSTRUTOR, d.status, 'grid-cols-2')}${ERRO('status')}</fieldset>` : ''}`,
    aoSalvar: (fd) => {
      const novo = Object.fromEntries(fd);
      if (!i) delete novo.status;
      const erros = Instrutores.validarDados(novo, estado.lista, id);
      if (erros.length) return erros;
      if (i) {
        estado.lista = Instrutores.atualizarDados(estado.lista, id, novo);
        persistir(); renderInstrutor();
        toast('Dados atualizados.');
      } else {
        const r = Instrutores.incluir(estado.lista, novo);
        estado.lista = r.lista; persistir();
        toast(`${r.instrutor.apelido || r.instrutor.nome} cadastrado.`);
        selecionar(r.instrutor.id);
      }
    },
  });
  form.querySelectorAll('[name="remuneracao"]').forEach((r) => r.addEventListener('change', () => {
    form.querySelector('#campo-custo-hora').classList.toggle('hidden', form.querySelector('[name="remuneracao"]:checked')?.value !== 'folha');
  }));
  if (i) return;
  // CPF de quem já é da equipe: oferece o papel de instrutor no lugar de um segundo cadastro.
  const aviso = form.querySelector('#aviso-colaborador');
  form.querySelector('[name="cpf"]').addEventListener('input', (e) => {
    const cpf = Instrutores.digitos(e.target.value);
    const c = cpf.length === 11 && typeof Colaboradores !== 'undefined' ? Colaboradores.carregar().find((x) => Instrutores.digitos(x.cpf) === cpf) : null;
    const ja = c ? Instrutores.instrutorDoColaborador(estado.lista, c.id) : null;
    aviso.innerHTML = !c ? '' : `
      <div class="rounded-lg bg-petrol-800/5 dark:bg-sky-950/40 px-3 py-2.5 text-sm text-slate-800 dark:text-neutral-100">
        <p><strong>${esc(c.nome)}</strong> já é da equipe (${esc(c.cargo)}).</p>
        ${ja ? `<a href="${urlDetalhe(ja.id)}" class="${BOTAO_LINK} mt-1">Abrir o cadastro de instrutor</a>`
          : `<button type="button" id="btn-papel-colaborador" class="${BOTAO_LINK} mt-1">Adicionar o papel de instrutor com a remuneração escolhida abaixo</button>`}
      </div>`;
    aviso.querySelector('#btn-papel-colaborador')?.addEventListener('click', () => {
      const remuneracao = form.querySelector('[name="remuneracao"]:checked')?.value ?? 'pj';
      const r = Instrutores.incluirDeColaborador(estado.lista, c, { remuneracao });
      estado.lista = r.lista; persistir();
      toast(`${c.nome} agora também é instrutor.`);
      selecionar(r.instrutor.id);
    });
  });
}

function abrirDrawerFoto() {
  const i = atual();
  let fotoNova = i.foto;
  const { form } = drawerFormulario({
    id: 'form-foto',
    titulo: 'Foto do instrutor',
    subtitulo: 'Aparece na lista, nas turmas e no material da escola. Guardada reduzida (256 px).',
    rotulo: 'Salvar foto',
    corpo: `
      <div class="flex items-center gap-4">
        <div id="foto-previa">${avatar(i, 'h-24 w-24 text-3xl')}</div>
        <div class="space-y-2">
          <label class="${BOTAO_SEC} cursor-pointer">${ICONE.camera} Escolher imagem<input type="file" id="f-arquivo" accept="image/*" class="sr-only"></label>
          ${i.foto ? `<button type="button" id="btn-remover-foto" class="${BOTAO_LINK} text-red-700 dark:text-red-400 block">Remover foto</button>` : ''}
          <p class="text-xs text-slate-500 dark:text-neutral-400">JPG ou PNG, de preferência quadrada.</p>
        </div>
      </div>`,
    aoSalvar: () => {
      estado.lista = Instrutores.atualizarFoto(estado.lista, i.id, fotoNova);
      persistir(); renderInstrutor();
      toast(fotoNova ? 'Foto atualizada.' : 'Foto removida.');
    },
  });
  form.querySelector('#f-arquivo').addEventListener('change', (e) => {
    const arq = e.target.files?.[0];
    if (!arq) return;
    const img = new Image();
    img.onload = () => {
      const lado = 256; const canvas = document.createElement('canvas'); canvas.width = lado; canvas.height = lado;
      const ctx = canvas.getContext('2d'); const m = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, lado, lado);
      fotoNova = canvas.toDataURL('image/jpeg', 0.85);
      form.querySelector('#foto-previa').innerHTML = `<img src="${fotoNova}" class="h-24 w-24 rounded-full object-cover border border-slate-200 dark:border-neutral-800">`;
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(arq);
  });
  form.querySelector('#btn-remover-foto')?.addEventListener('click', () => { fotoNova = null; form.querySelector('#foto-previa').innerHTML = avatar({ ...i, foto: null }, 'h-24 w-24 text-3xl'); });
}

function abrirDrawerContato() {
  const i = atual(); const c = i.contato;
  drawerFormulario({
    id: 'form-contato', titulo: 'Contato', subtitulo: `De <strong>${esc(i.apelido || i.nome)}</strong>.`, rotulo: 'Salvar alterações', foco: '#f-email',
    corpo: `
      ${campoTexto('email', 'E-mail', c.email, { tipo: 'email', max: 120 })}
      ${campoTexto('whatsapp', 'WhatsApp', fmtTelefone(c.whatsapp), { placeholder: '(47) 99999-9999', max: 16, extra: 'inputmode="tel"' })}
      <fieldset class="space-y-3">
        <legend class="rotulo">Contato para emergência</legend>
        ${campoTexto('emergenciaNome', 'Nome', c.emergencia?.nome, { max: 80, opcional: true })}
        ${campoTexto('emergenciaTelefone', 'Telefone', fmtTelefone(c.emergencia?.telefone), { placeholder: '(47) 99999-9999', max: 16, opcional: true })}
      </fieldset>`,
    aoSalvar: (fd) => {
      const d = Object.fromEntries(fd);
      const erros = Instrutores.validarContato(d);
      if (erros.length) return erros;
      estado.lista = Instrutores.atualizarContato(estado.lista, i.id, d);
      persistir(); renderInstrutor(); toast('Contato atualizado.');
    },
  });
}

function abrirDrawerEndereco() {
  const i = atual(); const e = i.endereco;
  drawerFormulario({
    id: 'form-endereco', titulo: 'Endereço', subtitulo: `De <strong>${esc(i.apelido || i.nome)}</strong>.`, rotulo: 'Salvar alterações', largura: 'max-w-lg', foco: '#f-cep',
    corpo: `
      <div class="grid grid-cols-3 gap-3">
        ${campoTexto('cep', 'CEP', fmtCep(e.cep), { placeholder: '00000-000', max: 9, extra: 'inputmode="numeric"' })}
        <div class="col-span-2">${campoTexto('logradouro', 'Endereço', e.logradouro, { max: 120 })}</div>
      </div>
      <div class="grid grid-cols-3 gap-3">
        ${campoTexto('numero', 'Número', e.numero, { max: 10, opcional: true })}
        <div class="col-span-2">${campoTexto('complemento', 'Complemento', e.complemento, { max: 60, opcional: true })}</div>
      </div>
      <div class="grid grid-cols-3 gap-3">
        ${campoTexto('bairro', 'Bairro', e.bairro, { max: 60, opcional: true })}
        ${campoTexto('cidade', 'Cidade', e.cidade, { max: 60 })}
        ${campoSelect('uf', 'UF', UFS.map((u) => ({ id: u, nome: u })), e.uf, { vazio: 'UF' })}
      </div>`,
    aoSalvar: (fd) => {
      const d = Object.fromEntries(fd);
      const erros = Instrutores.validarEndereco(d);
      if (erros.length) return erros;
      estado.lista = Instrutores.atualizarEndereco(estado.lista, i.id, d);
      persistir(); renderInstrutor(); toast('Endereço atualizado.');
    },
  });
}

function abrirDrawerTag() {
  const i = atual(); const t = i.tagEstacionamento;
  const { form } = drawerFormulario({
    id: 'form-tag', titulo: 'Tag de estacionamento', subtitulo: 'Tag do prédio cedida pela empresa para o instrutor estacionar.', rotulo: 'Salvar alterações',
    corpo: `
      <fieldset>
        <legend class="rotulo">Possui tag?</legend>
        ${cartoesRadio('possui', [{ id: 'sim', nome: 'Sim', descricao: 'Tag cedida pela empresa.' }, { id: 'nao', nome: 'Não', descricao: 'Não tem ou devolveu.' }], t.possui ? 'sim' : 'nao', 'grid-cols-2')}
      </fieldset>
      <div id="tag-sim" class="space-y-4 ${t.possui ? '' : 'hidden'}">
        ${campoTexto('identificacao', 'Identificação da tag', t.identificacao, { max: 30, placeholder: 'Ex.: TAG-0142' })}
        ${campoTexto('cedidaEm', 'Cedida em', t.cedidaEm, { tipo: 'date', opcional: true })}
      </div>
      <div id="tag-nao" class="${t.possui ? 'hidden' : ''}">
        ${campoTexto('devolvidaEm', 'Devolvida em', t.devolvidaEm, { tipo: 'date', opcional: true })}
      </div>`,
    aoSalvar: (fd) => {
      const d = Object.fromEntries(fd);
      if (d.possui === 'sim' && !String(d.identificacao).trim()) return [{ campo: 'identificacao', mensagem: 'Identificação da tag.' }];
      estado.lista = Instrutores.atualizarTag(estado.lista, i.id, d);
      persistir(); renderInstrutor(); toast('Tag atualizada.');
    },
  });
  form.querySelectorAll('[name="possui"]').forEach((r) => r.addEventListener('change', () => {
    form.querySelector('#tag-sim').classList.toggle('hidden', r.value !== 'sim');
    form.querySelector('#tag-nao').classList.toggle('hidden', r.value === 'sim');
  }));
}

function abrirDrawerObservacoes() {
  const i = atual();
  drawerFormulario({
    id: 'form-obs', titulo: 'Observações', subtitulo: 'Avisos internos.', rotulo: 'Salvar alterações', foco: '#f-observacoes',
    corpo: campoArea('observacoes', 'Observações', i.observacoes, { rows: 6, max: 1000, opcional: true }),
    aoSalvar: (fd) => { estado.lista = Instrutores.atualizarObservacoes(estado.lista, i.id, fd.get('observacoes')); persistir(); renderInstrutor(); toast('Observações atualizadas.'); },
  });
}

// ---------- Exclusão do instrutor ----------

function confirmarExclusao(id) {
  const i = Instrutores.porId(estado.lista, id);
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800"><h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Excluir instrutor</h3></div>
    <div class="px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 space-y-2">
      <p>Excluir <strong>${esc(i.nome)}</strong>?</p>
      <p class="text-slate-500 dark:text-neutral-400">Empresa, valores hora, rascunhos e documentos vão junto. Turmas que apontam para ele ficam sem instrutor. Se ele só parou de dar aula, prefira <em>inativar</em>.</p>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
      <button type="button" id="btn-confirmar" class="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition">Excluir</button>
    </div>`);
  root.querySelector('#btn-confirmar').addEventListener('click', () => { estado.lista = Instrutores.remover(estado.lista, id); persistir(); fecharModal(); toast(`${i.nome} excluído.`); selecionar(null); });
}

// ---------- Boot ----------

(function iniciar() {
  if (MODO === 'lista') {
    const antigo = parametroUrl('instrutor');
    if (antigo) { location.replace(`instrutor.html?id=${encodeURIComponent(antigo)}`); return; }
    if (parametroUrl('erro') === 'nao-encontrado') toast('Instrutor não encontrado.');
    renderLista();
    return;
  }
  const id = parametroUrl('id');
  if (!id || !Instrutores.porId(estado.lista, id)) { location.replace('instrutores.html?erro=nao-encontrado'); return; }
  estado.selecionado = id;
  renderInstrutor(); // ?aba= de links antigos é ignorado: só há Dados.
})();
