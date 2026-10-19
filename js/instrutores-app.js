// ============================================================
// UI da tela "Instrutores". Regras no motor (Instrutores.*); aqui só se
// monta HTML, reage a cliques e persiste.
// Fluxo: lista (instrutores.html) → instrutor em página própria
// (instrutor.html?id=&aba=) com sub-abas petróleo: Dados · Pagamento ·
// Contratos · Pagamentos · Documentos · Calendário. O mesmo arquivo atende as duas
// páginas; o modo vem de <body data-modo>.
// ============================================================

const MODO = document.body.dataset.modo === 'detalhe' ? 'detalhe' : 'lista';
const ABAS = [
  { id: 'dados', nome: 'Dados' },
  { id: 'calendario', nome: 'Calendário' },
  { id: 'pagamento', nome: 'Empresa e valor hora' },
  { id: 'contratos', nome: 'Contratos' },
  { id: 'pagamentos', nome: 'Pagamentos' },
  { id: 'documentos', nome: 'Documentos' },
];

const estado = {
  lista: Instrutores.carregar(),
  selecionado: null,
  aba: 'dados',
  contratoAberto: null,
  filtros: { busca: '', situacao: '', remuneracao: '', visao: '' }, // visao: '' | pendente | inativo (filtro rápido)
};

const ICONE = {
  lapis: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>',
  lixeira: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>',
  mais: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>',
  lupa: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>',
  fechar: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>',
  alerta: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>',
  check: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>',
  doc: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>',
  assinatura: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9" /></svg>',
  dinheiro: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>',
  envelope: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>',
  telefone: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>',
  predio: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>',
  carro: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>',
  camera: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>',
  voltar: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>',
  link: '<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg>',
  copiar: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"/></svg>',
  externo: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>',
  convite: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>',
  baixo: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>',
  maleta: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>',
  pessoa: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>',
  olho: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',
};

const BOTAO_SEC = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-40 disabled:pointer-events-none';
// Primário em petróleo: cobre é "é com você", nunca fundo de botão (Regra do Cobre).
const BOTAO_PRI = 'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/40 disabled:opacity-40 disabled:pointer-events-none';
const BOTAO_CANCELAR = 'px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition';
const BOTAO_LINK = 'inline-flex items-center gap-1 text-xs font-medium text-petrol-800 dark:text-sky-300 hover:underline';
// Botão pequeno com texto, dentro de linha de tabela (Registrar NF, Pagar, Ver).
const BOTAO_MINI = 'inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-40 disabled:pointer-events-none';
// Ação de cartão: sem fundo nem contorno, na cor de rótulo; petróleo no hover.
const BOTAO_FANTASMA = 'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm font-medium text-slate-500 dark:text-neutral-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30';
const ICONE_BOTAO_BASE = 'inline-flex items-center justify-center h-7 w-7 rounded-md text-slate-500 dark:text-neutral-400 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30';
const ICONE_BOTAO = `${ICONE_BOTAO_BASE} hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900`;
const ICONE_BOTAO_VERMELHO = `${ICONE_BOTAO_BASE} hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40`;
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
// Contrato e pagamento são fases de um ciclo: ponto na cor da fase + nome em texto (como a Situação das turmas).
// Âmbar espera alguém; azul anda sozinho; verde fechou bem; cinza encerrou; vazado ainda não existe ou não vale.
const PONTO_CONTRATO = {
  rascunho: 'ring-1 ring-inset ring-sky-600 dark:ring-sky-400',
  gerado: 'bg-sky-600 dark:bg-sky-400',
  assinatura: 'bg-amber-500',
  assinado: 'bg-emerald-500',
  encerrado: 'bg-slate-400 dark:bg-neutral-500',
  cancelado: 'ring-1 ring-inset ring-slate-400 dark:ring-neutral-500',
};
const PONTO_PAGAMENTO = { aguardando_nf: 'bg-amber-500', liberado: 'bg-sky-600 dark:bg-sky-400', pago: 'bg-emerald-500' };

// ---------- Helpers ----------

const nomeDe = (lista, id) => lista.find((x) => x.id === id)?.nome ?? '';
const statusInstrutorDe = (id) => STATUS_INSTRUTOR.find((s) => s.id === id);
const statusContratoDe = (id) => STATUS_CONTRATO_INSTRUTOR.find((s) => s.id === id);
const statusPagamentoDe = (id) => STATUS_PAGAMENTO.find((s) => s.id === id);
const remuneracaoDe = (id) => REMUNERACOES_INSTRUTOR.find((r) => r.id === id);
// RPA paga contra recibo, guardado no mesmo lugar da NF (docs/pessoas-papeis.md).
const COMPROVANTE = {
  nf: { curto: 'NF', coluna: 'Nota fiscal', artigo: 'a nota fiscal', titulo: 'Registrar nota fiscal', registrar: 'Registrar NF', numero: 'da NF', espera: 'aguardando NF', aguardando: 'Aguardando NF', recebido: 'NF recebida', registrada: 'registrada', arquivo: 'nf-1234.pdf' },
  rpa: { curto: 'Recibo', coluna: 'Recibo RPA', artigo: 'o recibo RPA', titulo: 'Registrar recibo RPA', registrar: 'Registrar recibo', numero: 'do recibo', espera: 'aguardando recibo', aguardando: 'Aguardando recibo', recebido: 'recibo recebido', registrada: 'registrado', arquivo: 'rpa-1234.pdf' },
};
const comprovante = (i) => (i.remuneracao === 'rpa' ? COMPROVANTE.rpa : COMPROVANTE.nf);
const semContaPessoal = (i) => !i.contaPessoal?.pix && !i.contaPessoal?.conta;
// Folha não paga por aqui: some a aba de empresa; contratos e pagamentos só se houver histórico.
function abasDe(i) {
  const paga = i.remuneracao !== 'folha';
  const historico = i.contratos.length > 0 || i.pagamentos.length > 0;
  return ABAS
    .filter((a) => (a.id === 'pagamento' ? paga : ['contratos', 'pagamentos'].includes(a.id) ? paga || historico : true))
    .map((a) => (a.id === 'pagamento' && i.remuneracao === 'rpa' ? { ...a, nome: 'Conta e valor hora' } : a));
}
const urlColaborador = (id) => `colaborador.html?id=${encodeURIComponent(id)}`;
const { fmtCpf, fmtCnpj, fmtCep, fmtTelefone, fmtData, fmtMoeda } = Instrutores;

function pilula(classe, texto, titulo = '') {
  return `<span title="${esc(titulo)}" class="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ${classe}">${esc(texto)}</span>`;
}
// Linha de chips do registro: dado de consulta rápida, sem caixa nem fundo.
function chipIcone(icone, conteudo, titulo = '') {
  return `<span title="${esc(titulo)}" class="inline-flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-neutral-300"><span class="text-slate-500 dark:text-neutral-400">${icone}</span>${conteudo}</span>`;
}
const ponto = (cor) => `<span aria-hidden="true" class="inline-block h-2 w-2 shrink-0 rounded-full ${cor}"></span>`;
const fase = (cor, texto, titulo = '') => `<span title="${esc(titulo)}" class="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-slate-600 dark:text-neutral-300">${ponto(cor)}${esc(texto)}</span>`;
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
function indicador(rotulo, valor, sub = '') {
  return `
    <div class="${CARTAO} p-4 min-w-0">
      <p class="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-neutral-400">${rotulo}</p>
      <p class="font-display text-2xl font-semibold tabular-nums leading-none mt-1.5 text-slate-800 dark:text-neutral-100">${valor}</p>
      ${sub ? `<p class="${APOIO} mt-1.5 truncate">${sub}</p>` : ''}
    </div>`;
}

function persistir() { Instrutores.salvar(estado.lista); }
function atual() { return Instrutores.porId(estado.lista, estado.selecionado); }

function selecionar(id, aba = null) {
  if (!id) { location.href = 'instrutores.html'; return; }
  if (MODO === 'detalhe' && id === estado.selecionado) {
    if (aba) estado.aba = aba;
    renderInstrutor();
    document.querySelector('main')?.scrollTo(0, 0);
    return;
  }
  location.href = `instrutor.html?id=${encodeURIComponent(id)}${aba ? `&aba=${aba}` : ''}`;
}
function mudarAba(aba, contratoId = null) {
  estado.aba = aba;
  estado.contratoAberto = contratoId;
  const url = new URL(location.href);
  url.searchParams.set('aba', aba);
  if (contratoId) url.searchParams.set('contrato', contratoId); else url.searchParams.delete('contrato');
  history.replaceState(null, '', url);
  renderInstrutor();
}
const turmaLink = (t) => (t ? `<a href="turma.html?id=${encodeURIComponent(t.id)}" class="${LINK}">${esc(t.codigo)}</a>` : '<span class="text-slate-500 dark:text-neutral-400">turma removida</span>');
const cursoLink = (c) => (c ? `<a href="curso.html?id=${encodeURIComponent(c.id)}" class="${LINK}">${esc(c.codigo)} · ${esc(c.nome)}</a>` : '<span class="text-slate-500 dark:text-neutral-400">—</span>');
const formacaoLink = (f) => (f ? `<a href="formacao.html?id=${encodeURIComponent(f.id)}" class="${LINK}">${esc(f.codigo ?? '')} ${esc(f.nome)}</a>` : '');

// ---------- Lista ----------

// Filtro rápido sobre a busca e a situação: as exceções que a coordenação procura.
const VISOES = [{ id: '', nome: 'Todos' }, { id: 'pendente', nome: 'Com pendência' }, { id: 'inativo', nome: 'Inativos' }];
// Pendência de inativo não conta: ninguém vai agir sobre ele.
const pendenciasDe = (i) => (i.status === 'inativo' ? [] : Instrutores.pendencias(i));
const urlDetalhe = (id) => `instrutor.html?id=${encodeURIComponent(id)}`;

function renderLista() {
  const el = document.getElementById('tela');
  const f = estado.filtros;
  const base = Instrutores.filtrar(estado.lista, { busca: f.busca, situacao: f.situacao, remuneracao: f.remuneracao });
  const porVisao = { '': base, pendente: base.filter((i) => pendenciasDe(i).length), inativo: base.filter((i) => i.status === 'inativo') };
  const visiveis = porVisao[f.visao];
  const filtrando = f.busca || f.situacao || f.remuneracao;
  const SITUACOES = [
    { id: 'sem-empresa', nome: 'Sem empresa para pagamento' },
    { id: 'antecedentes', nome: `Antecedentes ${Instrutores.anoAtual()} pendente` },
    { id: 'aguardando', nome: 'Aguardando o instrutor preencher' },
    { id: 'assinatura', nome: 'Contrato em assinatura' },
    { id: 'aguardando-nf', nome: 'Pagamento aguardando NF ou recibo' },
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

  // Uma linha por instrutor em quatro colunas fixas (cabe em 1280px). Abaixo do nome, a especialidade e, se houver,
  // as pendências em cobre, legíveis sem hover; contratos mostram o que espera alguém.
  const linha = (i) => {
    const pend = pendenciasDe(i);
    const ativos = Instrutores.contratosAtivos(i);
    const emAssinatura = i.contratos.filter((c) => c.status === 'assinatura').length;
    const aguardandoNf = i.pagamentos.filter((p) => Instrutores.statusPagamento(p) === 'aguardando_nf').length;
    const esperando = [emAssinatura ? `${emAssinatura} em assinatura` : '', aguardandoNf ? `${aguardandoNf} ${comprovante(i).espera}` : ''].filter(Boolean).join(' · ');
    const colab = i.colaboradorId ? Instrutores.pessoaDe(i).colaborador : null;
    const marcas = [
      i.status === 'inativo' ? pilula(PILULA.neutra, 'Inativo') : '',
      i.colaboradorId ? `<a href="${urlColaborador(i.colaboradorId)}" title="${esc(colab ? `Também é colaborador: ${colab.cargo}` : 'Também é colaborador')}" class="inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ${PILULA.extra} hover:underline underline-offset-2">Na equipe</a>` : '',
      Instrutores.aguardandoCadastro(i) ? pilula(PILULA.falta, 'Aguardando instrutor', `Link de cadastro gerado em ${fmtData(i.cadastro.criadoEm)}; o instrutor ainda não preencheu`) : '',
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
        <td class="${TD} tabular-nums">
          <p>${ativos.length ? plural(ativos.length, 'ativo') : '<span class="text-slate-500 dark:text-neutral-400">nenhum</span>'}</p>
          ${esperando ? `<p class="text-xs font-medium ${AVISO}">${esperando}</p>` : ''}
        </td>
      </tr>`;
  };

  el.innerHTML = `
    <div class="mb-4 flex items-start justify-between gap-6">
      <div>
        <h2 class="font-display text-xl font-semibold text-slate-900 dark:text-neutral-100">Instrutores <span class="ml-1 text-base font-normal text-slate-600 dark:text-neutral-400 tabular-nums">${estado.lista.length}</span></h2>
        <p class="max-w-3xl text-sm text-slate-600 dark:text-neutral-400 mt-0.5">Quem dá aula, de fora ou da equipe: dados pessoais, remuneração (PJ, RPA ou folha), tabela de valor hora, contratos assinados no Clicksign, pagamentos com nota fiscal ou recibo e documentos anuais.</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button type="button" id="btn-convidar" class="${BOTAO_SEC}" title="Manda um link para o próprio instrutor preencher o cadastro">${ICONE.convite} Convidar instrutor</button>
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
      ${busca('busca-instrutor', f.busca, 'Buscar nome, especialidade, e-mail ou empresa', 'w-96')}
      <div class="ml-auto flex flex-wrap items-center gap-2">
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

    <div class="${CARTAO} overflow-x-auto">
      <table class="w-full table-fixed text-left">
        ${thead([['Instrutor'], ['Contato', 'w-[220px]'], ['Pagamento', 'w-[220px]'], ['Contratos', 'w-[150px]']])}
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
          ${visiveis.length ? visiveis.map(linha).join('') : `
          <tr><td colspan="4" class="px-4 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">
            ${!estado.lista.length ? `Nenhum instrutor cadastrado ainda.<br><button type="button" id="btn-novo-vazio" class="${BOTAO_PRI} mt-4">${ICONE.mais} Cadastrar o primeiro instrutor</button>`
              : `Nenhum instrutor corresponde aos filtros. <button type="button" data-limpar class="${BOTAO_LINK} ml-1">Limpar filtros</button>`}
          </td></tr>`}
        </tbody>
      </table>
      <div class="px-4 py-2 border-t border-slate-100 dark:border-neutral-900 ${APOIO} tabular-nums">
        ${plural(visiveis.length, 'instrutor', 'instrutores')}${visiveis.length !== estado.lista.length ? ` de ${estado.lista.length}` : ''}
      </div>
    </div>`;

  const limpar = () => { estado.filtros = { busca: '', situacao: '', remuneracao: '', visao: '' }; renderLista(); };
  const campoBusca = el.querySelector('#busca-instrutor');
  campoBusca.addEventListener('input', () => { estado.filtros.busca = campoBusca.value; renderLista(); const b = el.querySelector('#busca-instrutor'); b.focus(); b.setSelectionRange(b.value.length, b.value.length); });
  el.querySelector('#filtro-situacao').addEventListener('change', (e) => { estado.filtros.situacao = e.target.value; renderLista(); });
  el.querySelector('#filtro-remuneracao').addEventListener('change', (e) => { estado.filtros.remuneracao = e.target.value; renderLista(); });
  el.querySelectorAll('[data-visao]').forEach((b) => b.addEventListener('click', () => { estado.filtros.visao = b.dataset.visao; renderLista(); el.querySelector(`[data-visao="${estado.filtros.visao}"]`).focus(); }));
  el.querySelector('#btn-limpar-filtros')?.addEventListener('click', limpar);
  el.querySelector('[data-limpar]')?.addEventListener('click', limpar);
  el.querySelector('#btn-novo').addEventListener('click', () => abrirDrawerInstrutor());
  el.querySelector('#btn-convidar').addEventListener('click', () => abrirDrawerConvite());
  el.querySelector('#btn-novo-vazio')?.addEventListener('click', () => abrirDrawerInstrutor());
  // O nome é o link (teclado, ⌘-clique); o resto da linha abre o mesmo registro, a não ser que haja texto selecionado.
  el.querySelector('table').addEventListener('click', (e) => {
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
  const abas = abasDe(i);
  if (!abas.some((a) => a.id === estado.aba)) estado.aba = 'dados';
  const colab = i.colaboradorId ? Instrutores.pessoaDe(i).colaborador : null;
  const rpa = i.remuneracao === 'rpa';

  // Contador ao lado da aba: total em cinza (contratos ativos); destaque só para o que é com você. Zero não aparece.
  const contadores = {
    contratos: { valor: Instrutores.contratosAtivos(i).length, nomes: ['contrato ativo', 'contratos ativos'] },
    pagamentos: { valor: i.pagamentos.filter((p) => Instrutores.statusPagamento(p) !== 'pago').length, nomes: ['pagamento a fazer', 'pagamentos a fazer'], atencao: true },
    documentos: { valor: (Instrutores.antecedentesEmDia(i) ? 0 : 1) + (i.lgpd ? 0 : 1), nomes: ['documento pendente', 'documentos pendentes'], atencao: true },
    pagamento: { valor: i.remuneracao !== 'folha' && ((rpa ? semContaPessoal(i) : !i.empresa) || !i.valoresHora.length) ? 1 : 0, nomes: [`pendência: ${rpa ? 'conta' : 'empresa'} ou valor hora`, ''], atencao: true },
  };

  // Uma ação à vista (e o WhatsApp); link de cadastro, foto, status e exclusão no "Mais".
  // O formulário público pede empresa e dados pessoais: só serve para PJ de fora da equipe.
  const itensMais = [
    i.remuneracao === 'pj' && !i.colaboradorId ? { nome: 'Link para o instrutor', detalhe: i.cadastro?.preenchidoEm ? `Preenchido em ${fmtData(i.cadastro.preenchidoEm.slice(0, 10))}` : 'Ele mesmo completa o cadastro', acao: () => abrirModalLinkInstrutor(i.id) } : null,
    { nome: i.foto ? 'Trocar foto' : 'Adicionar foto', detalhe: 'Aparece na lista e no portal do professor', acao: abrirDrawerFoto },
    'sep',
    i.status === 'ativo'
      ? { nome: 'Inativar', detalhe: 'Não recebe mais turmas; o histórico continua', acao: () => alterarStatus(i.id, 'inativo') }
      : { nome: 'Reativar', detalhe: 'Volta a poder receber turmas e contratos', acao: () => alterarStatus(i.id, 'ativo') },
    'sep',
    { nome: 'Excluir instrutor', perigo: true, desabilitado: !podeExcluir, detalhe: podeExcluir ? 'Só para cadastro errado' : 'Tem contrato gerado ou pagamento feito — inative em vez de excluir', acao: () => confirmarExclusao(i.id) },
  ].filter(Boolean);

  const abaBotao = (a) => {
    const ativa = estado.aba === a.id;
    const n = contadores[a.id];
    return `
      <button type="button" role="tab" data-aba="${a.id}" aria-selected="${ativa}"
        class="px-0.5 pb-2.5 text-[13px] font-medium border-b-2 transition whitespace-nowrap ${ativa ? 'border-[color:var(--f-marca-tinta)] text-slate-900 dark:text-neutral-100' : 'border-transparent text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'}">${esc(a.nome)}${n?.valor ? (n.atencao
          ? ` <span class="ml-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 text-[11px] font-semibold tabular-nums" title="${esc(plural(n.valor, ...n.nomes))}">${n.valor}</span>`
          : ` <span class="ml-1 text-xs text-slate-600 dark:text-neutral-400 tabular-nums" title="${esc(plural(n.valor, ...n.nomes))}">${n.valor}</span>`) : ''}</button>`;
  };

  el.innerHTML = `
    <nav aria-label="Breadcrumb" class="mb-3 flex items-center gap-1.5 text-sm text-slate-600 dark:text-neutral-400">
      <a href="inicio.html" class="hover:text-petrol-800 dark:hover:text-sky-300 transition">Home</a>
      <span>/</span>
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

    ${faixaCadastro(i)}
    ${pend.length ? faixa(`<span class="font-medium">${plural(pend.length, 'pendência')} no cadastro:</span> ${pend.map(esc).join(' · ')}${pendPag.length ? `.<br><span class="font-medium">Bloqueiam o pagamento:</span> ${pendPag.map(esc).join(' · ')}.` : ''}`) : ''}

    <div role="tablist" aria-label="Seções do instrutor" class="mb-4 shadow-[inset_0_-1px_0] shadow-slate-200 dark:shadow-neutral-800 flex items-center gap-4 overflow-x-auto [scrollbar-width:thin]">
      ${abas.map(abaBotao).join('')}
    </div>

    <div id="aba"></div>`;

  el.querySelector('#btn-editar').addEventListener('click', () => abrirDrawerInstrutor(i.id));
  el.querySelector('#btn-mais').addEventListener('click', (e) => abrirMenu(e.currentTarget, itensMais));
  el.querySelector('#btn-faixa-link')?.addEventListener('click', () => abrirModalLinkInstrutor(i.id));
  el.querySelector('#btn-foto').addEventListener('click', () => abrirDrawerFoto());
  el.querySelectorAll('[data-aba]').forEach((b) => b.addEventListener('click', () => mudarAba(b.dataset.aba)));

  ({ dados: renderAbaDados, calendario: renderAbaCalendario, pagamento: renderAbaPagamento, contratos: renderAbaContratos, pagamentos: renderAbaPagamentos, documentos: renderAbaDocumentos }[estado.aba] ?? renderAbaDados)(el.querySelector('#aba'), i);
}

function alterarStatus(id, status) {
  estado.lista = Instrutores.alterarStatus(estado.lista, id, status);
  persistir();
  renderInstrutor();
  toast(`${atual().apelido || atual().nome} ${status === 'ativo' ? 'reativado.' : 'inativado.'}`);
}

// ---------- Aba Calendário ----------
// Mesma grade do Portal do Professor (js/calendario-instrutor-ui.js): aulas de todas as turmas do
// instrutor + eventos que alcançam essas turmas. Só leitura; links levam à turma e ao agendamento.
// As turmas vêm de PortalProfessor.turmas (portal-professor/js/portal-professor-motor.js, carregado
// em instrutor.html só para isso). ?mes=YYYY-MM e ?turma= pré-selecionam.

function renderAbaCalendario(el, i) {
  if (typeof CalendarioInstrutor === 'undefined' || typeof PortalProfessor === 'undefined' || typeof Eventos === 'undefined') {
    el.innerHTML = `<div class="${CARTAO} p-8 text-center text-sm text-slate-500 dark:text-neutral-400">Calendário indisponível nesta página.</div>`;
    return;
  }
  const hoje = Turmas.hoje();
  const ts = PortalProfessor.turmas(i.id, hoje);
  if (!ts.length) {
    el.innerHTML = `<div class="${CARTAO} p-8 text-center text-sm text-slate-500 dark:text-neutral-400">Nenhuma turma atribuída a ${esc(i.apelido || i.nome)}. Quando uma turma tiver este instrutor como responsável, as aulas aparecem aqui.</div>`;
    return;
  }
  CalendarioInstrutor.montar(el, {
    hoje,
    turmas: ts,
    eventos: Eventos.paraTurmas(Eventos.carregar(), ts),
    inscricoes: Eventos.carregarInscricoes(),
    salas: typeof Salas !== 'undefined' ? Salas.carregar() : [],
    mes: parametroUrl('mes'),
    turmaId: parametroUrl('turma'),
    linkTurma: (t) => `turma.html?id=${encodeURIComponent(t.turma.id)}`,
    linkAula: (t, a) => `chamada.html?aula=${encodeURIComponent(a.id)}`,
  });
}

// ---------- Aba Dados ----------

function renderAbaDados(el, i) {
  const e = i.endereco; const c = i.contato; const tag = i.tagEstacionamento;
  const cursosHab = Instrutores.cursosHabilitados(i.id);
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

      <section class="${CARTAO}">
        ${cabecalhoSecao('Endereço', i.remuneracao === 'folha' ? 'Endereço residencial.' : 'Endereço residencial; vai no contrato.', 'btn-editar-endereco')}
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

      <section class="${CARTAO}">
        ${cabecalhoSecao('Cursos habilitados', 'Cursos em que já tem ou vai ter turma.', null)}
        ${cursosHab.length ? `<ul class="border-t border-slate-100 dark:border-neutral-900 divide-y divide-slate-100 dark:divide-neutral-900">${cursosHab.map((cu) => `<li class="px-4 py-2 text-sm">${cursoLink(cu)} <span class="${APOIO} tabular-nums">· ${cu.cargaHoraria} h</span></li>`).join('')}</ul>` : listaVazia('Nenhum curso habilita este instrutor ainda.')}
      </section>

      <section class="${CARTAO} overflow-hidden">
        ${cabecalhoSecao('Turmas', 'Turmas em que está escalado; a escala é feita na turma.', null)}
        ${turmas.length ? `
        <table class="w-full text-left">
          ${thead([['Turma'], ['Curso'], ['Período'], ['Contrato']])}
          <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
            ${turmas.map((t) => {
              const cu = Instrutores.cursoDe(t.cursoId);
              const ct = i.contratos.find((x) => x.status !== 'cancelado' && x.itens.some((it) => it.turmaId === t.id));
              const semCt = i.remuneracao === 'folha' ? `<span class="${APOIO}">na folha</span>` : `<span class="text-xs font-medium ${AVISO}">sem contrato</span>`;
              return `<tr><td class="${TD}">${turmaLink(t)}</td><td class="${TD}">${cu ? `${esc(cu.codigo)} · ${esc(cu.nome)}` : '—'}</td><td class="${TD} whitespace-nowrap tabular-nums">${esc(fmtData(t.inicio))} – ${esc(fmtData(t.fim))}</td><td class="${TD}">${ct ? `<button type="button" data-contrato="${ct.id}" class="${LINK} font-mono text-xs">${esc(ct.codigo)}</button>` : semCt}</td></tr>`;
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
  el.querySelectorAll('[data-contrato]').forEach((b) => b.addEventListener('click', () => mudarAba('contratos', b.dataset.contrato)));
}

// ---------- Aba Empresa e valor hora ----------

// RPA troca a empresa pela conta da própria pessoa.
function cartaoContaPessoal(i) {
  const cp = i.contaPessoal;
  return `
      <section class="${CARTAO}">
        ${cabecalhoSecao('Conta para pagamento', 'Autônomo (RPA): recebe na própria conta, contra recibo. INSS, IRRF e ISS ficam fora do sistema.', cp ? 'btn-editar-conta' : null)}
        ${cp ? `
        <div class="px-4 pb-4 grid grid-cols-2 gap-4">
          ${campo('Titular', esc(i.nome), 'col-span-2')}
          ${campo('Chave PIX', cp.pix ? `<span class="font-mono">${esc(cp.pix)}</span>` : vazio(null))}
          ${campo('Banco', vazio(cp.banco))}
          ${campo('Agência e conta', cp.agencia || cp.conta ? `<span class="tabular-nums">${vazio(cp.agencia, '—')} · ${vazio(cp.conta, '—')}</span>` : vazio(null), 'col-span-2')}
        </div>` : `
        <div class="px-4 pb-4">
          <p class="text-sm text-slate-800 dark:text-neutral-100">Sem conta cadastrada — <span class="font-medium ${AVISO}">nenhum pagamento pode ser feito</span> até informar PIX ou conta em nome do instrutor.</p>
          <button type="button" id="btn-nova-conta" class="${BOTAO_PRI} mt-4">${ICONE.mais} Cadastrar conta</button>
        </div>`}
      </section>`;
}

function renderAbaPagamento(el, i) {
  const emp = i.empresa;
  const faixas = [...i.valoresHora].sort((a, b) => Instrutores.especificidade(a) - Instrutores.especificidade(b) || a.valor - b.valor);
  el.innerHTML = `
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      ${i.remuneracao === 'rpa' ? cartaoContaPessoal(i) : `
      <section class="${CARTAO}">
        ${cabecalhoSecao('Empresa para pagamento', 'Todo instrutor recebe por pessoa jurídica — nota fiscal contra este CNPJ.', emp ? 'btn-editar-empresa' : null)}
        ${emp ? `
        <div class="px-4 pb-4 grid grid-cols-2 gap-4">
          ${campo('Razão social', esc(emp.razaoSocial), 'col-span-2')}
          ${campo('CNPJ', `<span class="font-mono">${esc(fmtCnpj(emp.cnpj))}</span>${Instrutores.cnpjValido(emp.cnpj) ? '' : ' <span class="text-xs font-medium text-red-700 dark:text-red-400">inválido</span>'}`)}
          ${campo('Chave PIX', emp.pix ? `<span class="font-mono">${esc(emp.pix)}</span>` : vazio(null))}
          ${campo('Banco', vazio(emp.banco))}
          ${campo('Agência e conta', emp.agencia || emp.conta ? `<span class="tabular-nums">${vazio(emp.agencia, '—')} · ${vazio(emp.conta, '—')}</span>` : vazio(null))}
        </div>
        <div class="px-4 pb-4"><button type="button" id="btn-remover-empresa" class="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400 hover:underline">Remover empresa</button></div>` : `
        <div class="px-4 pb-4">
          <p class="text-sm text-slate-800 dark:text-neutral-100">Sem empresa cadastrada — <span class="font-medium ${AVISO}">nenhum pagamento pode ser feito</span> até o instrutor abrir a empresa e informar CNPJ, razão social e PIX ou conta.</p>
          <button type="button" id="btn-nova-empresa" class="${BOTAO_PRI} mt-4">${ICONE.mais} Cadastrar empresa</button>
        </div>`}
      </section>`}

      <section class="${CARTAO}">
        ${cabecalhoSecao('Simulador', 'Qual valor hora vale para uma turma com estes números.', null)}
        <div class="px-4 pb-4 grid grid-cols-3 gap-3 items-end">
          <div><label class="rotulo" for="sim-alunos">Alunos na turma</label><input id="sim-alunos" type="number" min="0" class="campo" placeholder="Ex.: 12"></div>
          <div><label class="rotulo" for="sim-horas">Horas do curso</label><input id="sim-horas" type="number" min="0" class="campo" placeholder="Ex.: 24"></div>
          <div id="sim-resultado" aria-live="polite" class="text-sm text-slate-500 dark:text-neutral-400 pb-2">Preencha para simular.</div>
        </div>
      </section>

      <section class="${CARTAO} overflow-hidden xl:col-span-2">
        ${cabecalhoSecao('Tabela de valor hora', 'Faixas por tamanho da turma e carga horária. Vale a faixa mais específica que casar com a turma; a padrão, sem condição, cobre o resto.', faixas.length ? 'btn-nova-faixa' : null, 'Nova faixa', ICONE.mais)}
        ${faixas.length ? `
        <table class="w-full text-left">
          ${thead([['Faixa'], ['Condição'], ['Valor hora', 'text-right'], ['', 'w-24']])}
          <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
            ${faixas.map((f) => `
            <tr>
              <td class="${TD} font-medium text-slate-800 dark:text-neutral-100">${esc(f.nome)} ${Instrutores.especificidade(f) === 0 ? pilula(PILULA.extra, 'padrão', 'Vale quando nenhuma faixa com condição casa') : ''}</td>
              <td class="${TD}">${esc(Instrutores.descricaoFaixa(f))}</td>
              <td class="${TD} text-right tabular-nums font-medium text-slate-800 dark:text-neutral-100">${esc(fmtMoeda(f.valor))}</td>
              <td class="px-4 py-1.5 text-right whitespace-nowrap">
                <button type="button" data-editar-faixa="${f.id}" class="${ICONE_BOTAO}" title="Editar faixa" aria-label="Editar faixa ${esc(f.nome)}">${ICONE.lapis}</button>
                <button type="button" data-remover-faixa="${f.id}" class="${ICONE_BOTAO_VERMELHO}" title="Remover faixa" aria-label="Remover faixa ${esc(f.nome)}">${ICONE.lixeira}</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>` : `
        <div class="px-4 pb-4">
          <p class="text-sm text-slate-800 dark:text-neutral-100">Sem valor hora — <span class="font-medium ${AVISO}">não dá para montar contrato</span>.</p>
          <button type="button" id="btn-nova-faixa-vazio" class="${BOTAO_PRI} mt-4">${ICONE.mais} Cadastrar valor hora padrão</button>
        </div>`}
      </section>
    </div>`;
  el.querySelector('#btn-editar-empresa')?.addEventListener('click', () => abrirDrawerEmpresa());
  el.querySelector('#btn-nova-empresa')?.addEventListener('click', () => abrirDrawerEmpresa());
  el.querySelector('#btn-remover-empresa')?.addEventListener('click', () => confirmarRemoverEmpresa());
  el.querySelector('#btn-editar-conta')?.addEventListener('click', () => abrirDrawerContaPessoal());
  el.querySelector('#btn-nova-conta')?.addEventListener('click', () => abrirDrawerContaPessoal());
  el.querySelector('#btn-nova-faixa')?.addEventListener('click', () => abrirDrawerFaixa());
  el.querySelector('#btn-nova-faixa-vazio')?.addEventListener('click', () => abrirDrawerFaixa());
  el.querySelectorAll('[data-editar-faixa]').forEach((b) => b.addEventListener('click', () => abrirDrawerFaixa(b.dataset.editarFaixa)));
  el.querySelectorAll('[data-remover-faixa]').forEach((b) => b.addEventListener('click', () => {
    const f = i.valoresHora.find((x) => x.id === b.dataset.removerFaixa);
    estado.lista = Instrutores.removerFaixa(estado.lista, i.id, f.id);
    persistir(); renderInstrutor();
    toast(`Faixa "${f.nome}" removida.`);
  }));
  const simular = () => {
    const alunos = Number(el.querySelector('#sim-alunos').value); const horas = Number(el.querySelector('#sim-horas').value);
    const out = el.querySelector('#sim-resultado');
    if (!el.querySelector('#sim-alunos').value && !el.querySelector('#sim-horas').value) { out.innerHTML = 'Preencha para simular.'; return; }
    const f = Instrutores.valorHoraPara(i, { alunos, horas });
    out.innerHTML = f
      ? `<span class="font-semibold text-slate-800 dark:text-neutral-100 tabular-nums">${esc(fmtMoeda(f.valor))}/h</span> <span class="text-xs">· ${esc(f.nome)}</span>${horas ? `<br><span class="text-xs">Total do curso: <strong class="tabular-nums">${esc(fmtMoeda(f.valor * horas))}</strong></span>` : ''}`
      : `<span class="font-medium ${AVISO}">Nenhuma faixa casa — cadastre uma faixa padrão.</span>`;
  };
  ['#sim-alunos', '#sim-horas'].forEach((s) => el.querySelector(s).addEventListener('input', simular));
}

// ---------- Aba Contratos ----------

function renderAbaContratos(el, i) {
  if (estado.contratoAberto && Instrutores.contratoDe(i, estado.contratoAberto)) { renderContrato(el, i, Instrutores.contratoDe(i, estado.contratoAberto)); return; }
  estado.contratoAberto = null;
  const contratos = [...i.contratos].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  const folha = i.remuneracao === 'folha';
  const podeCriar = !folha && i.valoresHora.length > 0;
  const semContrato = folha ? [] : Instrutores.turmasDoInstrutor(i.id).filter((t) => !Instrutores.turmasContratadas(i).has(t.id));
  el.innerHTML = `
    ${semContrato.length ? faixa(`<span class="font-medium">${plural(semContrato.length, 'turma escalada sem contrato', 'turmas escaladas sem contrato')}:</span> ${semContrato.map((t) => esc(t.codigo)).join(' · ')}`, podeCriar ? `<button type="button" id="btn-faixa-contrato" class="${ACAO_FAIXA}">Montar contrato</button>` : '') : ''}
    <section class="${CARTAO} overflow-hidden">
      ${cabecalhoSecao('Contratos', 'Gerados pelo sistema e assinados no Clicksign pelo instrutor e pela escola. Um contrato cobre os cursos de uma formação ou cursos avulsos.', podeCriar && contratos.length ? 'btn-novo-contrato' : null, 'Novo contrato', ICONE.mais)}
      ${folha ? `<p class="px-4 pb-3 ${APOIO}">Agora recebe pela folha: a aula faz parte do salário e não tem contrato novo. Abaixo, os contratos de antes.</p>`
        : !podeCriar ? `<p class="px-4 pb-3 text-sm"><span class="font-medium ${AVISO}">Cadastre a tabela de valor hora antes de montar um contrato.</span> <button type="button" data-ir-aba="pagamento" class="${BOTAO_LINK}">Ir para ${esc(abasDe(i).find((a) => a.id === 'pagamento').nome)}</button></p>` : ''}
      ${contratos.length ? `
      <table class="w-full text-left">
        ${thead([['Contrato'], ['Escopo'], ['Horas', 'text-right'], ['Total', 'text-right'], ['Pago', 'text-right'], ['Assinaturas'], ['Situação']])}
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
          ${contratos.map((c) => {
            const st = statusContratoDe(c.status);
            const f = c.formacaoId ? Instrutores.formacaoDe(c.formacaoId) : null;
            const cs = c.clicksign;
            const assin = cs ? `${cs.instrutorAssinouEm ? '✓' : '·'} instrutor &nbsp; ${cs.escolaAssinouEm ? '✓' : '·'} escola` : '<span class="text-slate-500 dark:text-neutral-400">—</span>';
            return `
            <tr data-abrir-contrato="${c.id}" class="cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900 transition ${FOCO_LINHA} ${c.status === 'cancelado' ? 'opacity-60' : ''}">
              <td class="${TD}"><button type="button" class="link-registro font-mono text-xs font-medium text-slate-800 dark:text-neutral-100 hover:underline underline-offset-2 focus-visible:outline-none">${esc(c.codigo)}</button><p class="${APOIO} tabular-nums">criado ${esc(fmtData(c.criadoEm))}</p></td>
              <td class="${TD}"><p>${c.tipo === 'formacao' ? `Formação ${f ? esc(f.nome) : esc(c.formacaoId ?? '')}` : 'Cursos avulsos'}</p><p class="${APOIO}">${plural(c.itens.length, 'turma')}</p></td>
              <td class="${TD} text-right tabular-nums whitespace-nowrap">${Instrutores.horasContrato(c)} h</td>
              <td class="${TD} text-right tabular-nums whitespace-nowrap font-medium text-slate-800 dark:text-neutral-100">${esc(fmtMoeda(Instrutores.totalContrato(c)))}</td>
              <td class="${TD} text-right tabular-nums whitespace-nowrap">${esc(fmtMoeda(Instrutores.totalPago(i, c.id)))}</td>
              <td class="${TD} text-xs whitespace-nowrap">${assin}</td>
              <td class="${TD}">${fase(PONTO_CONTRATO[c.status], st.nome, st.descricao)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>` : `
      <div class="px-4 pb-4">
        <p class="text-sm text-slate-500 dark:text-neutral-400">Nenhum contrato ainda.</p>
        ${podeCriar ? `<button type="button" id="btn-novo-contrato-vazio" class="${BOTAO_PRI} mt-4">${ICONE.mais} Montar o primeiro contrato</button>` : ''}
      </div>`}
    </section>`;
  el.querySelector('#btn-novo-contrato')?.addEventListener('click', () => abrirDrawerContrato());
  el.querySelector('#btn-novo-contrato-vazio')?.addEventListener('click', () => abrirDrawerContrato());
  el.querySelector('#btn-faixa-contrato')?.addEventListener('click', () => abrirDrawerContrato());
  el.querySelector('[data-ir-aba]')?.addEventListener('click', (e) => mudarAba(e.currentTarget.dataset.irAba));
  el.querySelectorAll('[data-abrir-contrato]').forEach((tr) => tr.addEventListener('click', () => { if (!getSelection().toString()) mudarAba('contratos', tr.dataset.abrirContrato); }));
}

function renderContrato(el, i, c) {
  const st = statusContratoDe(c.status);
  const f = c.formacaoId ? Instrutores.formacaoDe(c.formacaoId) : null;
  const cs = c.clicksign;
  const pags = Instrutores.pagamentosDoContrato(i, c.id);
  const total = Instrutores.totalContrato(c);
  const pendPag = Instrutores.pendenciasPagamento(i);
  const bloqueio = pendPag.length ? `Bloqueado: ${pendPag.join('; ')}` : '';
  const podeEditar = Instrutores.podeEditarContrato(c);

  // O próximo passo do ciclo é o primário; editar (ou ver o documento) fica à vista; o resto vai para o "Mais".
  const proximo = Instrutores.podeGerar(c) ? `<button type="button" id="ct-gerar" class="${BOTAO_PRI}">${ICONE.doc} Gerar documento</button>`
    : Instrutores.podeEnviarClicksign(c) ? `<button type="button" id="ct-clicksign" class="${BOTAO_PRI}">${ICONE.assinatura} Enviar ao Clicksign</button>`
    : Instrutores.podeProgramarPagamento(c) ? `<button type="button" id="ct-pagamento" class="${BOTAO_PRI}" ${bloqueio ? `disabled title="${esc(bloqueio)}"` : ''}>${ICONE.dinheiro} Programar pagamento</button>` : '';
  const verDoc = c.documento ? { nome: `Ver documento v${c.documento.versao}`, detalhe: `Gerado em ${fmtData(c.documento.geradoEm)}`, acao: () => abrirModalDocumento(i, Instrutores.contratoDe(atual(), c.id)) } : null;
  const itensMais = [
    podeEditar && verDoc ? verDoc : null,
    Instrutores.podeReabrir(c) ? { nome: 'Reabrir para edição', detalhe: 'Volta a rascunho; o documento é regerado', acao: () => { estado.lista = Instrutores.reabrirContrato(estado.lista, i.id, c.id); persistir(); renderInstrutor(); toast('Contrato reaberto — o documento será regerado.'); } } : null,
    Instrutores.podeEncerrar(i, c) && pags.length ? { nome: 'Encerrar contrato', detalhe: 'Turmas concluídas e pagamentos quitados', acao: () => { estado.lista = Instrutores.encerrarContrato(estado.lista, i.id, c.id); persistir(); renderInstrutor(); toast('Contrato encerrado.'); } } : null,
    'sep',
    Instrutores.podeCancelarContrato(c) ? { nome: 'Cancelar contrato', perigo: true, detalhe: 'Fica sem efeito; o histórico continua', acao: () => confirmarCancelarContrato(i, c) } : null,
    c.status === 'rascunho' ? { nome: 'Excluir rascunho', perigo: true, detalhe: 'Apaga os itens montados', acao: () => confirmarExcluirContrato(i, c) } : null,
  ].filter(Boolean).filter((it, n, arr) => it !== 'sep' || (n > 0 && n < arr.length - 1));
  const visivel = podeEditar ? `<button type="button" id="ct-editar" class="${BOTAO_SEC}">${ICONE.lapis} Editar itens</button>`
    : verDoc ? `<button type="button" id="ct-ver" class="${BOTAO_SEC}">${ICONE.olho} ${esc(verDoc.nome)}</button>` : '';

  el.innerHTML = `
    <button type="button" id="ct-voltar" class="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-neutral-400 hover:text-petrol-800 dark:hover:text-sky-300 transition mb-3">${ICONE.voltar} Contratos</button>
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 class="font-display text-xl font-semibold text-slate-900 dark:text-neutral-100"><span class="font-mono text-base font-medium text-slate-500 dark:text-neutral-400 mr-2">${esc(c.codigo)}</span>${c.tipo === 'formacao' ? `Formação ${f ? esc(f.nome) : ''}` : 'Cursos avulsos'}</h3>
          ${fase(PONTO_CONTRATO[c.status], st.nome, st.descricao)}
        </div>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
          ${chipIcone(ICONE.doc, `${plural(c.itens.length, 'turma')} · <span class="tabular-nums">${Instrutores.horasContrato(c)} h</span>`, 'Itens')}
          ${chipIcone(ICONE.dinheiro, `<span class="tabular-nums">${esc(fmtMoeda(total))} · pago ${esc(fmtMoeda(Instrutores.totalPago(i, c.id)))}</span>`, 'Total do contrato e total pago')}
          ${c.documento ? chipIcone(ICONE.doc, `Documento v${c.documento.versao} · <span class="tabular-nums">${esc(fmtData(c.documento.geradoEm))}</span>`, 'Documento gerado pelo sistema') : ''}
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2 shrink-0">
        ${visivel}
        ${proximo}
        ${itensMais.length ? `<button type="button" id="ct-mais" class="${BOTAO_SEC}" aria-haspopup="menu" aria-expanded="false">Mais ${ICONE.baixo}</button>` : ''}
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <section class="${CARTAO} overflow-hidden xl:col-span-3">
        ${cabecalhoSecao('Itens', 'Uma linha por turma. O valor hora vem da tabela do instrutor pelo tamanho da turma e pela carga horária; dá para ajustar enquanto é rascunho.', null)}
        <table class="w-full text-left">
          ${thead([['Turma'], ['Curso'], ['Período'], ['Alunos', 'text-right'], ['Horas', 'text-right'], ['Valor hora', 'text-right'], ['Total', 'text-right'], ...(c.status === 'rascunho' ? [['', 'w-12']] : [])])}
          <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
            ${c.itens.map((it) => {
              const t = Instrutores.turmaDe(it.turmaId); const cu = Instrutores.cursoDe(it.cursoId);
              const fx = i.valoresHora.find((x) => x.id === it.valorHoraId);
              return `<tr>
                <td class="${TD} whitespace-nowrap">${turmaLink(t)}</td>
                <td class="${TD}">${cu ? esc(cu.codigo) : '—'} <span class="${APOIO}">${cu ? esc(cu.nome) : ''}</span></td>
                <td class="${TD} whitespace-nowrap text-xs tabular-nums">${t ? `${esc(fmtData(t.inicio))} – ${esc(fmtData(t.fim))}` : '—'}</td>
                <td class="${TD} text-right tabular-nums">${it.alunos}</td>
                <td class="${TD} text-right tabular-nums whitespace-nowrap">${it.horas} h</td>
                <td class="${TD} text-right tabular-nums whitespace-nowrap" title="${esc(fx ? fx.nome : 'ajustado manualmente')}">${esc(fmtMoeda(it.valorHora))}${fx ? '' : ` <span class="${APOIO}">manual</span>`}</td>
                <td class="${TD} text-right tabular-nums whitespace-nowrap font-medium text-slate-800 dark:text-neutral-100">${esc(fmtMoeda(it.total))}</td>
                ${c.status === 'rascunho' ? `<td class="px-4 py-1.5 text-right"><button type="button" data-ajustar="${it.id}" class="${ICONE_BOTAO}" title="Ajustar item" aria-label="Ajustar valor do item">${ICONE.lapis}</button></td>` : ''}
              </tr>`;
            }).join('')}
          </tbody>
          <tfoot class="border-t border-slate-200 dark:border-neutral-800 text-sm font-semibold text-slate-800 dark:text-neutral-100">
            <tr><td class="${TH}" colspan="4">Total</td><td class="${TH} text-right tabular-nums whitespace-nowrap">${Instrutores.horasContrato(c)} h</td><td></td><td class="${TH} text-right tabular-nums whitespace-nowrap">${esc(fmtMoeda(total))}</td>${c.status === 'rascunho' ? '<td></td>' : ''}</tr>
          </tfoot>
        </table>
        ${c.observacoes ? `<p class="px-4 py-3 text-sm text-slate-600 dark:text-neutral-300 border-t border-slate-100 dark:border-neutral-900 whitespace-pre-line">${esc(c.observacoes)}</p>` : ''}
      </section>

      <section class="${CARTAO} overflow-hidden xl:col-span-2 xl:row-span-2 xl:self-start">
        ${cabecalhoSecao('Pagamentos deste contrato', c.status === 'assinado' && bloqueio ? `<span class="font-medium text-red-700 dark:text-red-400">${esc(bloqueio)}.</span>` : `Por curso completo ou parcial. Só é pago com ${comprovante(i).artigo}.`, null)}
        ${pags.length ? tabelaPagamentos(i, pags, false) : listaVazia(c.status === 'assinado' ? 'Nenhum pagamento programado.' : 'Pagamentos só depois do contrato assinado.')}
      </section>

      <section class="${CARTAO}">
        ${cabecalhoSecao('Assinatura (Clicksign)', 'Instrutor e escola assinam o envelope.', null)}
        <div class="px-4 pb-4 space-y-3 text-sm">
          ${cs ? `
          ${campo('Envelope', `<span class="font-mono">${esc(cs.envelopeId)}</span> <span class="${APOIO}">· enviado ${esc(fmtData(cs.enviadoEm))}</span>`)}
          <ul class="border-y border-slate-100 dark:border-neutral-900 divide-y divide-slate-100 dark:divide-neutral-900">
            ${[['instrutor', 'Instrutor', cs.instrutorAssinouEm], ['escola', 'Escola', cs.escolaAssinouEm]].map(([id, rotulo, em]) => `
            <li class="flex items-center justify-between gap-3 py-2.5">
              <div class="min-w-0">
                <p class="flex items-center gap-1.5 font-medium text-slate-800 dark:text-neutral-100">${rotulo}${em ? `<span class="text-emerald-700 dark:text-emerald-400" title="Assinou">${ICONE.check}</span>` : ''}</p>
                <p class="${em ? APOIO : `text-xs font-medium ${AVISO}`} tabular-nums">${em ? `assinou em ${esc(fmtData(em))}` : 'aguardando'}</p>
              </div>
              ${!em && c.status === 'assinatura' ? `<button type="button" data-assinar="${id}" class="${BOTAO_MINI} shrink-0" title="Simula o retorno do Clicksign">Registrar</button>` : ''}
            </li>`).join('')}
          </ul>
          <p class="${APOIO}">No sistema real, as assinaturas chegam pelo webhook do Clicksign; aqui os botões simulam.</p>` : `
          <p class="text-slate-500 dark:text-neutral-400">${c.status === 'rascunho' ? 'Gere o documento e envie ao Clicksign.' : c.status === 'gerado' ? 'Documento pronto — envie ao Clicksign para coletar as assinaturas.' : 'Sem envelope.'}</p>`}
        </div>
      </section>

      <section class="${CARTAO}">
        ${cabecalhoSecao('Histórico', '', null)}
        <ol class="px-4 pb-4 space-y-2">${[...c.historico].reverse().map((h) => `<li class="flex items-baseline gap-3 text-sm"><span class="text-xs text-slate-500 dark:text-neutral-400 tabular-nums w-20 shrink-0">${esc(fmtData(h.em))}</span><span class="text-slate-800 dark:text-neutral-100">${esc(h.texto)}</span></li>`).join('')}</ol>
      </section>
    </div>`;

  el.querySelector('#ct-voltar').addEventListener('click', () => mudarAba('contratos'));
  el.querySelector('#ct-mais')?.addEventListener('click', (e) => abrirMenu(e.currentTarget, itensMais));
  el.querySelector('#ct-editar')?.addEventListener('click', () => abrirDrawerContrato(c.id));
  el.querySelector('#ct-gerar')?.addEventListener('click', () => { estado.lista = Instrutores.gerarDocumento(estado.lista, i.id, c.id); persistir(); renderInstrutor(); toast('Documento do contrato gerado.'); });
  el.querySelector('#ct-ver')?.addEventListener('click', () => verDoc.acao());
  el.querySelector('#ct-clicksign')?.addEventListener('click', () => confirmarClicksign(i, c));
  el.querySelector('#ct-pagamento')?.addEventListener('click', () => abrirDrawerPagamento(c.id));
  el.querySelectorAll('[data-assinar]').forEach((b) => b.addEventListener('click', () => {
    estado.lista = Instrutores.registrarAssinatura(estado.lista, i.id, c.id, b.dataset.assinar);
    persistir(); renderInstrutor();
    const novo = Instrutores.contratoDe(atual(), c.id);
    toast(novo.status === 'assinado' ? 'Contrato assinado pelas duas partes — pagamentos liberados.' : `Assinatura ${b.dataset.assinar === 'instrutor' ? 'do instrutor' : 'da escola'} registrada.`);
  }));
  el.querySelectorAll('[data-ajustar]').forEach((b) => b.addEventListener('click', () => abrirDrawerAjustarItem(c.id, b.dataset.ajustar)));
  ligarAcoesPagamento(el, i);
}

// ---------- Aba Pagamentos ----------

function tabelaPagamentos(i, pags, comContrato = true) {
  const ordenados = [...pags].sort((a, b) => (a.previsto ?? '').localeCompare(b.previsto ?? ''));
  const bloqueio = Instrutores.pendenciasPagamento(i);
  const cv = comprovante(i);
  return `
    <table class="w-full text-left">
      ${thead([...(comContrato ? [['Contrato']] : []), ['Descrição'], ['Previsto'], ['Valor', 'text-right'], [cv.coluna], ['Situação'], ['', 'w-28']])}
      <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
        ${ordenados.map((p) => {
          const s = Instrutores.statusPagamento(p); const sd = statusPagamentoDe(s);
          const ct = Instrutores.contratoDe(i, p.contratoId);
          const atrasado = s !== 'pago' && p.previsto && p.previsto < Instrutores.hoje();
          return `<tr>
            ${comContrato ? `<td class="${TD}"><button type="button" data-contrato="${p.contratoId}" class="${LINK} font-mono text-xs">${esc(ct?.codigo ?? '')}</button></td>` : ''}
            <td class="${TD}"><p class="font-medium text-slate-800 dark:text-neutral-100">${esc(p.descricao)}</p><p class="${APOIO}">${esc(nomeDe(TIPOS_PAGAMENTO, p.tipo))}</p></td>
            <td class="${TD} whitespace-nowrap tabular-nums">${esc(fmtData(p.previsto))}${atrasado ? '<p class="text-xs font-medium text-red-700 dark:text-red-400">atrasado</p>' : ''}</td>
            <td class="${TD} text-right tabular-nums font-medium text-slate-800 dark:text-neutral-100">${esc(fmtMoeda(p.valor))}</td>
            <td class="${TD}">${p.nf ? `<span class="font-mono text-xs">${cv.curto} ${esc(p.nf.numero)}</span> <span class="${APOIO} tabular-nums">· ${esc(fmtData(p.nf.emitidaEm))}</span>` : `<button type="button" data-nf="${p.id}" class="${BOTAO_MINI}">${ICONE.doc} ${cv.registrar}</button>`}</td>
            <td class="${TD}">${fase(PONTO_PAGAMENTO[s], s === 'aguardando_nf' ? cv.aguardando : sd.nome, sd.descricao)}${p.pagoEm ? `<p class="${APOIO} tabular-nums mt-0.5">em ${esc(fmtData(p.pagoEm))}</p>` : ''}</td>
            <td class="px-4 py-1.5 text-right whitespace-nowrap">
              ${s === 'liberado' ? `<button type="button" data-pagar="${p.id}" class="${BOTAO_MINI}" ${bloqueio.length ? `disabled title="${esc(bloqueio.join('; '))}"` : ''}>${ICONE.dinheiro} Pagar</button>` : ''}
              ${s === 'aguardando_nf' ? `<button type="button" class="${BOTAO_MINI}" disabled title="Só paga com ${cv.artigo}">${ICONE.dinheiro} Pagar</button>` : ''}
              ${!p.pagoEm ? `<button type="button" data-remover-pagamento="${p.id}" class="${ICONE_BOTAO_VERMELHO}" title="Remover programação" aria-label="Remover programação de ${esc(p.descricao)}">${ICONE.lixeira}</button>` : ''}
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function ligarAcoesPagamento(el, i) {
  el.querySelectorAll('[data-nf]').forEach((b) => b.addEventListener('click', () => abrirDrawerNf(b.dataset.nf)));
  el.querySelectorAll('[data-pagar]').forEach((b) => b.addEventListener('click', () => abrirDrawerPagar(b.dataset.pagar)));
  el.querySelectorAll('[data-remover-pagamento]').forEach((b) => b.addEventListener('click', () => {
    estado.lista = Instrutores.removerPagamento(estado.lista, i.id, b.dataset.removerPagamento);
    persistir(); renderInstrutor(); toast('Programação de pagamento removida.');
  }));
  el.querySelectorAll('[data-contrato]').forEach((b) => b.addEventListener('click', () => mudarAba('contratos', b.dataset.contrato)));
}

function renderAbaPagamentos(el, i) {
  const pags = i.pagamentos;
  const dos = (s) => pags.filter((p) => Instrutores.statusPagamento(p) === s);
  const soma = (s) => dos(s).reduce((a, p) => a + p.valor, 0);
  const pendPag = Instrutores.pendenciasPagamento(i);
  const cv = comprovante(i);
  // Valor em tinta (Regra do Azul e do Vermelho); a fase vem no ponto antes do rótulo, como na tabela.
  const celula = (s, rotulo) => indicador(`${ponto(PONTO_PAGAMENTO[s])} ${rotulo}`, esc(fmtMoeda(soma(s))), plural(dos(s).length, 'pagamento'));
  el.innerHTML = `
    <div class="grid grid-cols-3 gap-3 mb-4">
      ${celula('aguardando_nf', cv.aguardando)}
      ${celula('liberado', `Liberado (${cv.recebido})`)}
      ${celula('pago', 'Pago')}
    </div>
    <section class="${CARTAO} overflow-hidden">
      ${cabecalhoSecao('Pagamentos', pendPag.length ? `<span class="font-medium text-red-700 dark:text-red-400">Nenhum pagamento pode ser feito: ${esc(pendPag.join('; '))}.</span>` : `Cada pagamento exige ${cv.artigo} do instrutor (do curso ou do parcial). Para programar, abra o contrato assinado.`, null)}
      ${pags.length ? tabelaPagamentos(i, pags, true) : listaVazia('Nenhum pagamento programado.')}
    </section>`;
  ligarAcoesPagamento(el, i);
}

// ---------- Aba Documentos ----------

function renderAbaDocumentos(el, i) {
  const ano = Instrutores.anoAtual();
  const anos = [...i.antecedentes].sort((a, b) => b.ano - a.ano);
  const assinados = i.contratos.filter((c) => ['assinado', 'encerrado'].includes(c.status));
  el.innerHTML = `
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <section class="${CARTAO}">
        ${cabecalhoSecao('Declaração de antecedentes criminais', 'Obrigatória todo ano. Sem a do ano corrente, o pagamento fica bloqueado.', 'btn-nova-declaracao', 'Registrar declaração', ICONE.mais)}
        ${Instrutores.antecedentesEmDia(i) ? '' : `<p class="px-4 pb-3 text-sm font-medium ${AVISO}">Falta a declaração de ${ano}.</p>`}
        ${anos.length ? `<ul class="border-t border-slate-100 dark:border-neutral-900 divide-y divide-slate-100 dark:divide-neutral-900">${anos.map((a) => `
          <li class="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
            <div class="min-w-0"><span class="font-medium text-slate-800 dark:text-neutral-100 tabular-nums">${a.ano}</span> <span class="${APOIO}">· recebida em ${esc(fmtData(a.enviadoEm))}</span><p class="${APOIO} font-mono truncate">${esc(a.arquivo)}</p></div>
            <button type="button" data-remover-declaracao="${a.ano}" class="${ICONE_BOTAO_VERMELHO} shrink-0" title="Remover declaração" aria-label="Remover declaração de ${a.ano}">${ICONE.lixeira}</button>
          </li>`).join('')}</ul>` : listaVazia('Nenhuma declaração registrada.')}
      </section>

      <section class="${CARTAO}">
        ${cabecalhoSecao('Política de privacidade (LGPD)', 'Aceite dos termos do cadastro.', i.lgpd ? null : 'btn-lgpd', 'Registrar aceite', ICONE.check)}
        <div class="px-4 pb-4 space-y-3 text-sm">
          ${i.lgpd ? `<p class="text-slate-800 dark:text-neutral-100">Aceito em <span class="tabular-nums">${esc(fmtData(i.lgpd.aceitoEm))}</span> <span class="${APOIO}">· versão ${esc(i.lgpd.versao)}</span></p>` : `<p class="font-medium ${AVISO}">Aceite pendente.</p>`}
          <ul class="list-disc pl-5 space-y-1 text-slate-600 dark:text-neutral-300">${LGPD_INSTRUTOR.termos.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <p><a href="${LGPD_INSTRUTOR.link}" target="_blank" rel="noopener" class="${LINK}">Política de privacidade e proteção de dados</a></p>
        </div>
      </section>

      <section class="${CARTAO} xl:col-span-2">
        ${cabecalhoSecao('Contratos assinados', 'Documentos gerados pelo sistema com assinatura completa no Clicksign.', null)}
        ${assinados.length ? `<ul class="border-t border-slate-100 dark:border-neutral-900 divide-y divide-slate-100 dark:divide-neutral-900">${assinados.map((c) => `
          <li class="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
            <div><button type="button" data-contrato="${c.id}" class="${LINK} font-mono text-xs">${esc(c.codigo)}</button> <span class="text-slate-600 dark:text-neutral-300">· documento v${c.documento?.versao ?? 1} · assinado em <span class="tabular-nums">${esc(fmtData(c.clicksign?.escolaAssinouEm > c.clicksign?.instrutorAssinouEm ? c.clicksign?.escolaAssinouEm : c.clicksign?.instrutorAssinouEm))}</span></span></div>
            <button type="button" data-ver-documento="${c.id}" class="${BOTAO_MINI}">${ICONE.olho} Ver</button>
          </li>`).join('')}</ul>` : listaVazia('Nenhum contrato assinado ainda.')}
      </section>
    </div>`;
  el.querySelector('#btn-nova-declaracao').addEventListener('click', () => abrirDrawerAntecedentes());
  el.querySelector('#btn-lgpd')?.addEventListener('click', () => abrirModalLgpd());
  el.querySelectorAll('[data-remover-declaracao]').forEach((b) => b.addEventListener('click', () => {
    estado.lista = Instrutores.removerAntecedentes(estado.lista, i.id, Number(b.dataset.removerDeclaracao));
    persistir(); renderInstrutor(); toast(`Declaração ${b.dataset.removerDeclaracao} removida.`);
  }));
  el.querySelectorAll('[data-contrato]').forEach((b) => b.addEventListener('click', () => mudarAba('contratos', b.dataset.contrato)));
  el.querySelectorAll('[data-ver-documento]').forEach((b) => b.addEventListener('click', () => abrirModalDocumento(i, Instrutores.contratoDe(i, b.dataset.verDocumento))));
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
    subtitulo: i ? 'Identificação e especialidade.' : 'Só o essencial. Depois você completa contato, endereço, empresa, valor hora e documentos.',
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
    id: 'form-endereco', titulo: 'Endereço', subtitulo: `De <strong>${esc(i.apelido || i.nome)}</strong> · vai no contrato.`, rotulo: 'Salvar alterações', largura: 'max-w-lg', foco: '#f-cep',
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

function abrirDrawerEmpresa() {
  const i = atual(); const e = i.empresa ?? { cnpj: '', razaoSocial: '', banco: '', agencia: '', conta: '', pix: '' };
  drawerFormulario({
    id: 'form-empresa', titulo: i.empresa ? 'Editar empresa' : 'Cadastrar empresa', subtitulo: 'Pessoa jurídica do instrutor — a nota fiscal e o pagamento saem contra ela.', rotulo: i.empresa ? 'Salvar alterações' : 'Cadastrar', largura: 'max-w-lg', foco: '#f-cnpj',
    corpo: `
      <div class="grid grid-cols-3 gap-3">
        ${campoTexto('cnpj', 'CNPJ', fmtCnpj(e.cnpj), { placeholder: '00.000.000/0000-00', max: 18, mascara: 'cnpj' })}
        <div class="col-span-2">${campoTexto('razaoSocial', 'Razão social', e.razaoSocial, { max: 120 })}</div>
      </div>
      <fieldset class="space-y-3">
        <legend class="rotulo">Conta bancária ${OPCIONAL}</legend>
        <div class="grid grid-cols-3 gap-3">
          ${campoTexto('banco', 'Banco', e.banco, { max: 40, placeholder: 'Ex.: Sicredi' })}
          ${campoTexto('agencia', 'Agência', e.agencia, { max: 10 })}
          ${campoTexto('conta', 'Conta', e.conta, { max: 20 })}
        </div>
      </fieldset>
      ${campoTexto('pix', 'Chave PIX', e.pix, { max: 80, placeholder: 'CNPJ, e-mail, telefone ou chave aleatória' })}
      <p class="text-xs text-slate-500 dark:text-neutral-400">Informe ao menos a chave PIX ou a conta.</p>`,
    aoSalvar: (fd) => {
      const d = Object.fromEntries(fd);
      const erros = Instrutores.validarEmpresa(d, estado.lista, i.id);
      if (erros.length) return erros;
      estado.lista = Instrutores.atualizarEmpresa(estado.lista, i.id, d);
      persistir(); renderInstrutor(); toast(i.empresa ? 'Empresa atualizada.' : 'Empresa cadastrada — pagamentos liberados.');
    },
  });
}

function abrirDrawerContaPessoal() {
  const i = atual(); const cp = i.contaPessoal ?? { banco: '', agencia: '', conta: '', pix: '' };
  drawerFormulario({
    id: 'form-conta', titulo: i.contaPessoal ? 'Editar conta' : 'Cadastrar conta', subtitulo: 'Conta em nome do próprio instrutor — o RPA paga a pessoa física.', rotulo: i.contaPessoal ? 'Salvar alterações' : 'Cadastrar', largura: 'max-w-lg', foco: '#f-pix',
    corpo: `
      ${campoTexto('pix', 'Chave PIX', cp.pix, { max: 80, placeholder: 'CPF, e-mail, telefone ou chave aleatória' })}
      <fieldset class="space-y-3">
        <legend class="rotulo">Conta bancária ${OPCIONAL}</legend>
        <div class="grid grid-cols-3 gap-3">
          ${campoTexto('banco', 'Banco', cp.banco, { max: 40 })}
          ${campoTexto('agencia', 'Agência', cp.agencia, { max: 10 })}
          ${campoTexto('conta', 'Conta', cp.conta, { max: 20 })}
        </div>
      </fieldset>
      <p class="text-xs text-slate-500 dark:text-neutral-400">Informe ao menos a chave PIX ou a conta.</p>`,
    aoSalvar: (fd) => {
      const d = Object.fromEntries(fd);
      const erros = Instrutores.validarContaPessoal(d);
      if (erros.length) return erros;
      estado.lista = Instrutores.atualizarContaPessoal(estado.lista, i.id, d);
      persistir(); renderInstrutor(); toast(i.contaPessoal ? 'Conta atualizada.' : 'Conta cadastrada — pagamentos liberados.');
    },
  });
}

function confirmarRemoverEmpresa() {
  const i = atual();
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800"><h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Remover empresa</h3></div>
    <div class="px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 space-y-2">
      <p>Remover <strong>${esc(i.empresa.razaoSocial)}</strong> (${esc(fmtCnpj(i.empresa.cnpj))})?</p>
      <p class="text-slate-500 dark:text-neutral-400">Nenhum pagamento poderá ser feito até cadastrar outra empresa. Pagamentos já realizados não mudam.</p>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
      <button type="button" id="btn-confirmar" class="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition">Remover</button>
    </div>`);
  root.querySelector('#btn-confirmar').addEventListener('click', () => { estado.lista = Instrutores.removerEmpresa(estado.lista, i.id); persistir(); fecharModal(); renderInstrutor(); toast('Empresa removida.'); });
}

function abrirDrawerFaixa(faixaId = null) {
  const i = atual(); const f = faixaId ? i.valoresHora.find((x) => x.id === faixaId) : null;
  const d = f ?? { nome: i.valoresHora.length ? '' : 'Padrão', valor: '', alunosMin: '', alunosMax: '', horasMin: '', horasMax: '' };
  drawerFormulario({
    id: 'form-faixa', titulo: f ? 'Editar faixa de valor hora' : 'Nova faixa de valor hora', subtitulo: 'Sem condição = faixa padrão. Com condição, vale só para turmas que casem (a mais específica ganha).', rotulo: f ? 'Salvar alterações' : 'Criar faixa', largura: 'max-w-lg', foco: '#f-nome',
    corpo: `
      <div class="grid grid-cols-3 gap-3">
        <div class="col-span-2">${campoTexto('nome', 'Nome da faixa', d.nome, { max: 60, placeholder: 'Ex.: Turma pequena' })}</div>
        ${campoTexto('valor', 'Valor hora', d.valor, { tipo: 'number', extra: 'min="1" step="0.01"', prefixo: 'R$' })}
      </div>
      <fieldset>
        <legend class="rotulo">Quantidade de alunos ${OPCIONAL}</legend>
        <div class="grid grid-cols-2 gap-3">
          ${campoTexto('alunosMin', 'Mínimo', d.alunosMin, { tipo: 'number', extra: 'min="0" step="1"', opcional: true })}
          ${campoTexto('alunosMax', 'Máximo', d.alunosMax, { tipo: 'number', extra: 'min="0" step="1"', opcional: true })}
        </div>
      </fieldset>
      <fieldset>
        <legend class="rotulo">Carga horária do curso ${OPCIONAL}</legend>
        <div class="grid grid-cols-2 gap-3">
          ${campoTexto('horasMin', 'Mínimo', d.horasMin, { tipo: 'number', extra: 'min="0" step="1"', sufixo: 'h', opcional: true })}
          ${campoTexto('horasMax', 'Máximo', d.horasMax, { tipo: 'number', extra: 'min="0" step="1"', sufixo: 'h', opcional: true })}
        </div>
      </fieldset>`,
    aoSalvar: (fd) => {
      const d2 = Object.fromEntries(fd);
      const erros = Instrutores.validarFaixa(d2, i, faixaId);
      if (erros.length) return erros;
      estado.lista = f ? Instrutores.atualizarFaixa(estado.lista, i.id, faixaId, d2) : Instrutores.incluirFaixa(estado.lista, i.id, d2);
      persistir(); renderInstrutor(); toast(f ? 'Faixa atualizada.' : 'Faixa criada.');
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

function abrirDrawerAntecedentes() {
  const i = atual(); const ano = Instrutores.anoAtual();
  drawerFormulario({
    id: 'form-antecedentes', titulo: 'Declaração de antecedentes criminais', subtitulo: 'Registra o recebimento do documento do ano. Uma por ano.', rotulo: 'Registrar', foco: '#f-arquivo',
    corpo: `
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('ano', 'Ano', Instrutores.antecedentesEmDia(i) ? ano + 1 : ano, { tipo: 'number', extra: `min="2000" max="${ano + 1}" step="1"` })}
        ${campoTexto('enviadoEm', 'Recebida em', Instrutores.hoje(), { tipo: 'date' })}
      </div>
      ${campoTexto('arquivo', 'Arquivo', '', { placeholder: 'Ex.: antecedentes-2026.pdf', max: 120, opcional: true })}
      <p class="text-xs text-slate-500 dark:text-neutral-400">No sistema real o PDF é anexado; aqui só o nome.</p>`,
    aoSalvar: (fd) => {
      const d = Object.fromEntries(fd);
      const a = Number(d.ano);
      if (!a || a < 2000 || a > ano + 1) return [{ campo: 'ano', mensagem: 'Ano inválido.' }];
      if (!d.enviadoEm) return [{ campo: 'enviadoEm', mensagem: 'Data de recebimento.' }];
      estado.lista = Instrutores.registrarAntecedentes(estado.lista, i.id, d);
      persistir(); renderInstrutor(); toast(`Declaração ${a} registrada.`);
    },
  });
}

function abrirModalLgpd() {
  const i = atual();
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800"><h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Política de privacidade e proteção de dados</h3></div>
    <div class="px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 space-y-3">
      <p><a href="${LGPD_INSTRUTOR.link}" target="_blank" rel="noopener" class="${LINK}">Política de privacidade e proteção de dados</a></p>
      ${LGPD_INSTRUTOR.termos.map((t, k) => `<label class="flex items-start gap-3 cursor-pointer"><input type="checkbox" data-termo="${k}" class="check mt-0.5"><span>${esc(t)} <span class="text-red-600">*</span></span></label>`).join('')}
      <p class="text-xs text-slate-500 dark:text-neutral-400">Registrado em nome de ${esc(i.nome)} em ${esc(fmtData(Instrutores.hoje()))} · versão ${esc(LGPD_INSTRUTOR.versao)}. No sistema real o instrutor aceita no próprio cadastro.</p>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
      <button type="button" id="btn-confirmar" class="${BOTAO_PRI}" disabled>Registrar aceite</button>
    </div>`);
  const atualizar = () => { root.querySelector('#btn-confirmar').disabled = ![...root.querySelectorAll('[data-termo]')].every((c) => c.checked); };
  root.querySelectorAll('[data-termo]').forEach((c) => c.addEventListener('change', atualizar));
  root.querySelector('#btn-confirmar').addEventListener('click', () => { estado.lista = Instrutores.registrarLgpd(estado.lista, i.id); persistir(); fecharModal(); renderInstrutor(); toast('Aceite registrado.'); });
}

// ---------- Link para o próprio instrutor preencher o cadastro ----------

const linhaLink = (id, titulo, descricao, u) => `
      <div>
        <p class="rotulo mb-1">${titulo} <span class="font-normal text-slate-500 dark:text-neutral-400">— ${descricao}</span></p>
        <div class="flex gap-2">
          <input id="${id}" type="text" readonly value="${esc(u)}" class="campo font-mono text-xs">
          <button type="button" data-copiar="${id}" class="${BOTAO_SEC} shrink-0">${ICONE.copiar} Copiar</button>
          <a href="${esc(u)}" target="_blank" rel="noopener" class="${BOTAO_SEC} shrink-0" title="Abrir como quem recebe o link">${ICONE.externo} Abrir</a>
        </div>
      </div>`;
const linhasLinks = (prefixo, urlForm, urlPassos) => `
      ${linhaLink(`${prefixo}-form`, 'Formulário único', 'tudo numa página, bom para quem já tem os dados à mão', urlForm)}
      ${linhaLink(`${prefixo}-passos`, 'Passo a passo', 'uma etapa por vez, com revisão no final — bom no celular', urlPassos)}`;
function ligarCopiar(root) {
  root.querySelectorAll('[data-copiar]').forEach((b) => b.addEventListener('click', async () => {
    const campo = root.querySelector(`#${b.dataset.copiar}`);
    try { await navigator.clipboard.writeText(campo.value); toast('Link copiado.'); }
    catch (_) { campo.select(); toast('Selecione e copie o link.'); }
  }));
}

function faixaCadastro(i) {
  if (!Instrutores.aguardandoCadastro(i)) return '';
  return faixa(`<span class="font-medium">Aguardando o instrutor preencher o cadastro</span> — link gerado em <span class="tabular-nums">${esc(fmtData(i.cadastro.criadoEm))}</span>.`, `<button type="button" id="btn-faixa-link" class="${ACAO_FAIXA}">Ver link</button>`);
}

function abrirModalLinkInstrutor(id) {
  let i = Instrutores.porId(estado.lista, id);
  if (!i.cadastro) {
    estado.lista = Instrutores.gerarCadastro(estado.lista, id);
    persistir(); i = Instrutores.porId(estado.lista, id);
    renderInstrutor();
  }
  const url = Instrutores.urlCadastro(i, 'formulario');
  const urlPassos = Instrutores.urlCadastro(i, 'passos');
  const preenchido = Boolean(i.cadastro.preenchidoEm);
  const msg = `Olá, ${(i.apelido || i.nome).split(' ')[0]}! Para fecharmos seu cadastro de instrutor na ${Aulor.escola().nome} (contrato e pagamento), preencha seus dados neste link: ${url}`;
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
      <div>
        <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Link para o instrutor preencher o cadastro</h3>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(i.nome)} abre o link, confere o que já foi digitado e completa dados pessoais, endereço, empresa para pagamento, antecedentes e o aceite LGPD.</p>
      </div>
      <button type="button" data-fechar-modal class="p-1 rounded text-slate-500 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${ICONE.fechar}</button>
    </div>
    <div class="px-5 py-4 space-y-4">
      ${preenchido
        ? `<div class="flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-200"><span class="text-emerald-600 dark:text-emerald-400">${ICONE.check}</span> Preenchido pelo instrutor em ${esc(fmtData(i.cadastro.preenchidoEm.slice(0, 10)))}. O link já não aceita novos envios.</div>`
        : `<div class="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">${ICONE.alerta} Aguardando o instrutor — link gerado em ${esc(fmtData(i.cadastro.criadoEm))}.</div>`}
      ${linhasLinks('link-instrutor', url, urlPassos)}
      <div class="flex flex-wrap items-center gap-2">
        ${i.contato.whatsapp ? `<a href="https://wa.me/55${esc(i.contato.whatsapp)}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener" class="${BOTAO_SEC} text-emerald-700 dark:text-emerald-400">${ICONE_WHATSAPP} Enviar por WhatsApp</a>` : ''}
        ${i.contato.email ? `<a href="mailto:${esc(i.contato.email)}?subject=${encodeURIComponent(`Complete seu cadastro de instrutor — ${Aulor.escola().nome}`)}&body=${encodeURIComponent(msg)}" class="${BOTAO_SEC}">${ICONE.envelope} Enviar por e-mail</a>` : ''}
        <span class="text-xs text-slate-500 dark:text-neutral-400 ml-auto">WhatsApp/e-mail mandam o formulário único.</span>
      </div>
      <p class="text-xs text-slate-500 dark:text-neutral-400">Protótipo: o link funciona neste navegador (mesmo localStorage). Em produção o token expira e é de uso único.</p>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-2">
      <button type="button" id="btn-novo-link" class="${BOTAO_LINK}">Gerar novo link (invalida o atual)</button>
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Fechar</button>
    </div>`, 'max-w-3xl');
  ligarCopiar(root);
  root.querySelector('#btn-novo-link').addEventListener('click', () => {
    estado.lista = Instrutores.gerarCadastro(estado.lista, id);
    persistir(); fecharModal(); renderInstrutor();
    toast('Novo link gerado; o anterior deixou de valer.');
    abrirModalLinkInstrutor(id);
  });
}

// Convite: a escola só digita nome e contato; o resto vem do instrutor pelo link.
function abrirDrawerConvite() {
  drawerFormulario({
    id: 'form-convite',
    titulo: 'Convidar instrutor',
    subtitulo: 'Só o nome e como falar com ele. O próprio instrutor preenche CPF, endereço, empresa para pagamento e o aceite LGPD pelo link.',
    rotulo: 'Gerar link',
    largura: 'max-w-lg',
    foco: '#f-nome',
    corpo: `
      ${campoTexto('nome', 'Nome completo', '', { max: 120 })}
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('email', 'E-mail', '', { tipo: 'email', max: 120 })}
        ${campoTexto('whatsapp', 'WhatsApp', '', { placeholder: '(47) 99999-9999', max: 16, extra: 'inputmode="tel"' })}
      </div>
      ${campoTexto('especialidade', 'Especialidade', '', { placeholder: 'Ex.: Java e Spring', max: 80, opcional: true })}`,
    aoSalvar: (fd) => {
      const d = Object.fromEntries(fd);
      const erros = Instrutores.validarConvite(d, estado.lista);
      if (erros.length) return erros;
      const r = Instrutores.convidar(estado.lista, d);
      estado.lista = r.lista; persistir();
      sessionStorage.setItem('instrutores-abrir-link', r.instrutor.id);
      toast(`${r.instrutor.apelido} cadastrado — mande o link.`);
      selecionar(r.instrutor.id);
    },
  });
}

// ---------- Contrato: drawers e modais ----------

function abrirDrawerContrato(contratoId = null) {
  const i = atual(); const c = contratoId ? Instrutores.contratoDe(i, contratoId) : null;
  const d = c ? { tipo: c.tipo, formacaoId: c.formacaoId ?? '', turmaIds: c.itens.map((it) => it.turmaId), observacoes: c.observacoes } : { tipo: null, formacaoId: '', turmaIds: [], observacoes: '' };
  const formacoes = Instrutores.formacoes().map((f) => ({ id: f.id, nome: `${f.codigo ?? ''} ${f.nome}`.trim() }));
  // MVP: sem formações, todo contrato é de cursos avulsos e a escolha do escopo some.
  if (!formacoes.length) d.tipo = 'cursos';
  const contratadas = Instrutores.turmasContratadas(i, contratoId);
  const todas = (typeof Cursos !== 'undefined' ? Cursos.todasTurmas() : []).filter((t) => t.status !== 'cancelada');
  const { form } = drawerFormulario({
    id: 'form-contrato', titulo: c ? `Editar itens · ${esc(c.codigo)}` : 'Novo contrato', subtitulo: `${formacoes.length ? 'Cursos de uma formação ou cursos avulsos. ' : ''}Cada turma vira um item com horas × valor hora da tabela.`, rotulo: c ? 'Salvar itens' : 'Criar rascunho', largura: 'max-w-2xl',
    corpo: `
      <fieldset class="${formacoes.length ? '' : 'hidden'}">
        <legend class="rotulo">Escopo</legend>
        ${cartoesRadio('tipo', [{ id: 'formacao', nome: 'Cursos de uma formação', descricao: 'Turmas da edição escolhida.' }, { id: 'cursos', nome: 'Cursos avulsos', descricao: 'Turmas abertas, in company ou soltas.' }], d.tipo, 'grid-cols-2')}
        ${ERRO('tipo')}
      </fieldset>
      <div id="bloco-formacao" class="${d.tipo === 'formacao' ? '' : 'hidden'}">${campoSelect('formacaoId', 'Formação', formacoes, d.formacaoId, { vazio: 'Escolha a formação' })}</div>
      <div id="bloco-turmas" class="${d.tipo ? '' : 'hidden'}">
        <div class="flex items-center justify-between gap-3 mb-2">
          <span class="rotulo mb-0">Turmas</span>
          ${busca('busca-turma', '', 'Buscar turma ou curso', 'w-56')}
        </div>
        <div id="lista-turmas" class="max-h-80 overflow-y-auto rounded-lg border border-slate-200 dark:border-neutral-800 divide-y divide-slate-100 dark:divide-neutral-900"></div>
        <p id="resumo-turmas" class="text-xs text-slate-500 dark:text-neutral-400 mt-2"></p>
        ${ERRO('turmaIds')}
      </div>
      ${campoArea('observacoes', 'Observações do contrato', d.observacoes, { rows: 2, max: 500, opcional: true, placeholder: 'Condições especiais, combinados…' })}`,
    aoSalvar: (fd) => {
      const dados = { tipo: fd.get('tipo'), formacaoId: fd.get('formacaoId') ?? '', turmaIds: fd.getAll('turmaIds'), observacoes: fd.get('observacoes') };
      const erros = Instrutores.validarContrato(dados, i, contratoId);
      if (erros.length) return erros;
      if (c) {
        estado.lista = Instrutores.atualizarItensContrato(estado.lista, i.id, c.id, dados);
        persistir(); renderInstrutor(); toast('Itens do contrato atualizados.');
      } else {
        const r = Instrutores.incluirContrato(estado.lista, i.id, dados);
        estado.lista = r.lista; persistir();
        toast(`Contrato ${r.contrato.codigo} criado como rascunho.`);
        mudarAba('contratos', r.contrato.id);
      }
    },
  });

  const marcadas = new Set(d.turmaIds);
  const renderTurmas = () => {
    const tipo = form.querySelector('[name="tipo"]:checked')?.value;
    const formacaoId = form.querySelector('[name="formacaoId"]').value;
    const termo = Instrutores.normalizar(form.querySelector('#busca-turma').value);
    let lista = tipo === 'formacao' ? todas.filter((t) => t.formacaoId === formacaoId) : todas.filter((t) => t.tipo !== 'formacao');
    lista = lista.filter((t) => { const cu = Instrutores.cursoDe(t.cursoId); return !termo || Instrutores.normalizar(`${t.codigo} ${cu?.codigo ?? ''} ${cu?.nome ?? ''}`).includes(termo); });
    // Turmas do instrutor primeiro; depois as sem instrutor; por fim as de outros (com aviso).
    const peso = (t) => (t.instrutorId === i.id ? 0 : !t.instrutorId ? 1 : 2);
    lista.sort((a, b) => peso(a) - peso(b) || a.inicio.localeCompare(b.inicio));
    const el = form.querySelector('#lista-turmas');
    if (tipo === 'formacao' && !formacaoId) { el.innerHTML = listaVazia('Escolha a formação para ver as turmas.'); return; }
    el.innerHTML = lista.length ? lista.map((t) => {
      const cu = Instrutores.cursoDe(t.cursoId); const usada = contratadas.has(t.id);
      const item = Instrutores.itemDeTurma(i, t.id);
      const outro = t.instrutorId && t.instrutorId !== i.id ? nomeDe(estado.lista, t.instrutorId) : '';
      return `<label class="flex items-center gap-3 px-3 py-2 text-sm ${usada ? 'opacity-50' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900'}">
        <input type="checkbox" name="turmaIds" value="${t.id}" class="check" ${marcadas.has(t.id) ? 'checked' : ''} ${usada ? 'disabled' : ''}>
        <span class="flex-1 min-w-0">
          <span class="font-medium text-slate-800 dark:text-neutral-100">${esc(t.codigo)}</span> <span class="text-slate-500 dark:text-neutral-400">· ${esc(cu?.nome ?? '')}</span>
          <span class="block text-xs text-slate-500 dark:text-neutral-400">${esc(fmtData(t.inicio))} – ${esc(fmtData(t.fim))} · ${item.alunos} vagas · ${item.horas} h${usada ? ' · já em outro contrato' : outro ? ` · escalado: ${esc(outro)}` : t.instrutorId === i.id ? ' · escalado para este instrutor' : ' · sem instrutor'}</span>
        </span>
        <span class="text-xs tabular-nums text-slate-600 dark:text-neutral-300 whitespace-nowrap">${esc(fmtMoeda(item.valorHora))}/h → <strong>${esc(fmtMoeda(item.total))}</strong></span>
      </label>`;
    }).join('') : listaVazia('Nenhuma turma encontrada.');
    el.querySelectorAll('[name="turmaIds"]').forEach((cb) => cb.addEventListener('change', () => { if (cb.checked) marcadas.add(cb.value); else marcadas.delete(cb.value); resumo(); }));
    resumo();
  };
  const resumo = () => {
    const itens = [...marcadas].map((t) => Instrutores.itemDeTurma(i, t));
    form.querySelector('#resumo-turmas').textContent = itens.length ? `${plural(itens.length, 'turma')} · ${itens.reduce((s, it) => s + it.horas, 0)} h · ${fmtMoeda(itens.reduce((s, it) => s + it.total, 0))}` : 'Nenhuma turma marcada.';
  };
  form.querySelectorAll('[name="tipo"]').forEach((r) => r.addEventListener('change', () => {
    form.querySelector('#bloco-formacao').classList.toggle('hidden', r.value !== 'formacao');
    form.querySelector('#bloco-turmas').classList.remove('hidden');
    marcadas.clear(); renderTurmas();
  }));
  form.querySelector('[name="formacaoId"]').addEventListener('change', () => { marcadas.clear(); renderTurmas(); });
  form.querySelector('#busca-turma').addEventListener('input', renderTurmas);
  // Marcações fora da lista filtrada precisam ir no submit: injeta hidden.
  form.addEventListener('submit', () => {
    form.querySelectorAll('[data-hidden-turma]').forEach((h) => h.remove());
    marcadas.forEach((t) => { if (!form.querySelector(`[name="turmaIds"][value="${t}"]:checked`)) { const h = document.createElement('input'); h.type = 'hidden'; h.name = 'turmaIds'; h.value = t; h.dataset.hiddenTurma = '1'; form.appendChild(h); } });
  }, true);
  if (d.tipo) renderTurmas();
}

function abrirDrawerAjustarItem(contratoId, itemId) {
  const i = atual(); const c = Instrutores.contratoDe(i, contratoId); const it = c.itens.find((x) => x.id === itemId);
  const t = Instrutores.turmaDe(it.turmaId);
  drawerFormulario({
    id: 'form-item', titulo: `Ajustar item · ${esc(t?.codigo ?? '')}`, subtitulo: 'Valor negociado para esta turma ou horas diferentes da carga do curso.', rotulo: 'Salvar', foco: '#f-valorHora',
    corpo: `
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('valorHora', 'Valor hora', it.valorHora, { tipo: 'number', extra: 'min="0" step="0.01"', prefixo: 'R$' })}
        ${campoTexto('horas', 'Horas', it.horas, { tipo: 'number', extra: 'min="1" step="1"', sufixo: 'h' })}
      </div>
      <p class="text-xs text-slate-500 dark:text-neutral-400">Tabela do instrutor sugere ${esc(fmtMoeda(Instrutores.valorHoraPara(i, { alunos: it.alunos, horas: it.horas })?.valor ?? 0))}/h para ${it.alunos} alunos e ${it.horas} h.</p>`,
    aoSalvar: (fd) => {
      const vh = Number(fd.get('valorHora')); const h = Number(fd.get('horas'));
      if (!(vh > 0)) return [{ campo: 'valorHora', mensagem: 'Valor maior que zero.' }];
      if (!(h > 0)) return [{ campo: 'horas', mensagem: 'Horas maior que zero.' }];
      estado.lista = Instrutores.ajustarItem(estado.lista, i.id, contratoId, itemId, { valorHora: vh, horas: h });
      persistir(); renderInstrutor(); toast('Item ajustado.');
    },
  });
}

function confirmarClicksign(i, c) {
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800"><h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Enviar ao Clicksign</h3></div>
    <div class="px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 space-y-2">
      <p>Cria o envelope do contrato <strong>${esc(c.codigo)}</strong> (documento v${c.documento?.versao}) com dois signatários:</p>
      <ul class="list-disc pl-5 text-slate-600 dark:text-neutral-300"><li><strong>${esc(i.nome)}</strong> · ${esc(i.contato.email || 'sem e-mail!')}</li><li><strong>${esc(Aulor.escola().nome)}</strong> (escola)</li></ul>
      <p class="text-slate-500 dark:text-neutral-400">Depois de enviado, os itens não mudam mais — para alterar, cancele e crie outro.</p>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
      <button type="button" id="btn-confirmar" class="${BOTAO_PRI}" ${i.contato.email ? '' : 'disabled title="Instrutor sem e-mail"'}>Enviar</button>
    </div>`);
  root.querySelector('#btn-confirmar').addEventListener('click', () => { estado.lista = Instrutores.enviarClicksign(estado.lista, i.id, c.id); persistir(); fecharModal(); renderInstrutor(); toast('Envelope enviado ao Clicksign.'); });
}

function confirmarCancelarContrato(i, c) {
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800"><h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Cancelar contrato</h3></div>
    <div class="px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 space-y-3">
      <p>Cancelar <strong>${esc(c.codigo)}</strong>? Pagamentos já feitos ficam; os pendentes deixam de valer.</p>
      <div><label class="rotulo" for="motivo">Motivo ${OPCIONAL}</label><input id="motivo" class="campo" maxlength="200"></div>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Voltar</button>
      <button type="button" id="btn-confirmar" class="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition">Cancelar contrato</button>
    </div>`);
  root.querySelector('#btn-confirmar').addEventListener('click', () => { estado.lista = Instrutores.cancelarContrato(estado.lista, i.id, c.id, root.querySelector('#motivo').value); persistir(); fecharModal(); renderInstrutor(); toast('Contrato cancelado.'); });
}

function confirmarExcluirContrato(i, c) {
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800"><h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Excluir rascunho</h3></div>
    <div class="px-5 py-4 text-sm text-slate-700 dark:text-neutral-200"><p>Excluir o rascunho <strong>${esc(c.codigo)}</strong>? Nada foi gerado nem assinado.</p></div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
      <button type="button" id="btn-confirmar" class="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition">Excluir</button>
    </div>`);
  root.querySelector('#btn-confirmar').addEventListener('click', () => { estado.lista = Instrutores.removerContrato(estado.lista, i.id, c.id); persistir(); fecharModal(); mudarAba('contratos'); toast('Rascunho excluído.'); });
}

// Prévia do documento gerado pelo sistema (texto do contrato montado a partir dos dados).
function abrirModalDocumento(i, c) {
  const f = c.formacaoId ? Instrutores.formacaoDe(c.formacaoId) : null;
  const e = i.endereco; const emp = i.empresa;
  const rpa = i.remuneracao === 'rpa'; const conta = rpa ? i.contaPessoal : emp; const cpf = Instrutores.pessoaDe(i).cpf;
  const endereco = esc([e.logradouro, e.numero, e.complemento, e.bairro, `${e.cidade}/${e.uf}`, fmtCep(e.cep)].filter(Boolean).join(', '));
  const linhas = c.itens.map((it) => { const t = Instrutores.turmaDe(it.turmaId); const cu = Instrutores.cursoDe(it.cursoId); return `<tr><td class="py-1 pr-3">${esc(t?.codigo ?? '')}</td><td class="py-1 pr-3">${esc(cu?.nome ?? '')}</td><td class="py-1 pr-3 whitespace-nowrap">${t ? `${esc(fmtData(t.inicio))} a ${esc(fmtData(t.fim))}` : ''}</td><td class="py-1 pr-3 text-right">${it.horas} h</td><td class="py-1 pr-3 text-right">${esc(fmtMoeda(it.valorHora))}</td><td class="py-1 text-right">${esc(fmtMoeda(it.total))}</td></tr>`; }).join('');
  abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3">
      <div><h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Contrato ${esc(c.codigo)} · documento v${c.documento?.versao ?? 1}</h3><p class="text-xs text-slate-500 dark:text-neutral-400">Gerado pelo sistema em ${esc(fmtData(c.documento?.geradoEm))}. ${c.clicksign ? `Envelope Clicksign ${esc(c.clicksign.envelopeId)}.` : ''}</p></div>
      <button type="button" data-fechar-modal class="p-1 rounded text-slate-500 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${ICONE.fechar}</button>
    </div>
    <div class="px-5 py-4 overflow-y-auto text-sm text-slate-800 dark:text-neutral-100 space-y-4 leading-relaxed">
      <h4 class="font-display font-semibold text-center uppercase tracking-wide">Contrato de prestação de serviços de instrutoria</h4>
      <p><strong>CONTRATANTE:</strong> ${esc(Aulor.escola().nome)}, CNPJ ${esc(Documento.fmtCnpj(Aulor.escola().cnpj))}, ${esc(Aulor.escola().cidade)}/${esc(Aulor.escola().uf)} ("Escola").</p>
      <p><strong>CONTRATADA:</strong> ${rpa ? `<strong>${esc(i.nome)}</strong>, autônomo, CPF ${esc(fmtCpf(cpf))}, RG ${esc(i.rg)}, residente em ${endereco} ("Instrutor").` : `${emp ? `${esc(emp.razaoSocial)}, CNPJ ${esc(fmtCnpj(emp.cnpj))}` : '<span class="text-red-600 dark:text-red-400">[empresa do instrutor não cadastrada]</span>'}, representada por <strong>${esc(i.nome)}</strong>, CPF ${esc(fmtCpf(cpf))}, RG ${esc(i.rg)}, residente em ${endereco} ("Instrutor").`}</p>
      <p><strong>OBJETO:</strong> ministração das aulas ${c.tipo === 'formacao' ? `da formação <strong>${esc(f?.nome ?? c.formacaoId)}</strong>` : 'dos cursos avulsos'} listadas abaixo, nas datas e cargas horárias indicadas.</p>
      <table class="w-full text-xs">
        <thead class="text-[11px] uppercase tracking-wider text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-800"><tr><th class="text-left py-1 pr-3">Turma</th><th class="text-left py-1 pr-3">Curso</th><th class="text-left py-1 pr-3">Período</th><th class="text-right py-1 pr-3">Horas</th><th class="text-right py-1 pr-3">Valor hora</th><th class="text-right py-1">Total</th></tr></thead>
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">${linhas}</tbody>
        <tfoot class="border-t border-slate-200 dark:border-neutral-800 font-semibold"><tr><td class="py-1" colspan="3">Total</td><td class="py-1 pr-3 text-right">${Instrutores.horasContrato(c)} h</td><td></td><td class="py-1 text-right">${esc(fmtMoeda(Instrutores.totalContrato(c)))}</td></tr></tfoot>
      </table>
      <p><strong>PAGAMENTO:</strong> por curso concluído ou parcial acordado, mediante ${rpa ? 'recibo de pagamento a autônomo (RPA) assinado pelo Instrutor' : 'emissão de nota fiscal pela Contratada'}${conta?.pix ? `, via PIX ${esc(conta.pix)}` : conta?.conta ? `, em conta ${esc(conta.banco)} ag. ${esc(conta.agencia)} c/c ${esc(conta.conta)}` : ''}.</p>
      <p><strong>DOCUMENTOS:</strong> a Contratada mantém atualizada, anualmente, a declaração de ausência de antecedentes criminais do Instrutor.</p>
      ${c.observacoes ? `<p><strong>CONDIÇÕES ESPECIAIS:</strong> ${esc(c.observacoes)}</p>` : ''}
      <p class="text-xs text-slate-500 dark:text-neutral-400">Assinaturas eletrônicas via Clicksign: Instrutor ${c.clicksign?.instrutorAssinouEm ? `em ${esc(fmtData(c.clicksign.instrutorAssinouEm))}` : 'pendente'} · Escola ${c.clicksign?.escolaAssinouEm ? `em ${esc(fmtData(c.clicksign.escolaAssinouEm))}` : 'pendente'}.</p>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Fechar</button>
    </div>`, 'max-w-3xl');
}

// ---------- Pagamentos: drawers ----------

function abrirDrawerPagamento(contratoId) {
  const i = atual(); const c = Instrutores.contratoDe(i, contratoId);
  const itens = c.itens.map((it) => { const t = Instrutores.turmaDe(it.turmaId); const cu = Instrutores.cursoDe(it.cursoId); const prog = Instrutores.pagamentosDoContrato(i, c.id).filter((p) => p.itemId === it.id).reduce((s, p) => s + p.valor, 0); return { id: it.id, nome: `${t?.codigo ?? ''} · ${cu?.nome ?? ''} — ${fmtMoeda(it.total)}${prog ? ` (programado ${fmtMoeda(prog)})` : ''}`, total: it.total, prog, fim: t?.fim ?? '' }; });
  const { form } = drawerFormulario({
    id: 'form-pagamento', titulo: `Programar pagamento · ${esc(c.codigo)}`, subtitulo: `Curso completo ou parcial. Fica "${comprovante(i).espera}" até registrar ${comprovante(i).artigo}.`, rotulo: 'Programar', largura: 'max-w-lg',
    corpo: `
      <fieldset><legend class="rotulo">Tipo</legend>${cartoesRadio('tipo', TIPOS_PAGAMENTO.filter((t) => ['curso', 'parcial'].includes(t.id)), null, 'grid-cols-2')}${ERRO('tipo')}</fieldset>
      ${campoSelect('itemId', 'Turma do contrato', itens, '', { vazio: 'Escolha a turma' })}
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('valor', 'Valor', '', { tipo: 'number', extra: 'min="0.01" step="0.01"', prefixo: 'R$' })}
        ${campoTexto('previsto', 'Previsto para', '', { tipo: 'date' })}
      </div>
      <div id="bloco-descricao" class="hidden">${campoTexto('descricao', 'O que cobre', '', { max: 80, placeholder: 'Ex.: 1ª metade das aulas' })}</div>`,
    aoSalvar: (fd) => {
      const d = Object.fromEntries(fd);
      const erros = Instrutores.validarPagamento(d, i, c);
      if (erros.length) return erros;
      const r = Instrutores.incluirPagamento(estado.lista, i.id, c.id, d);
      estado.lista = r.lista; persistir(); renderInstrutor();
      toast(`Pagamento de ${fmtMoeda(r.pagamento.valor)} programado — ${comprovante(i).espera}.`);
    },
  });
  const sugerir = () => {
    const tipo = form.querySelector('[name="tipo"]:checked')?.value; const it = itens.find((x) => x.id === form.querySelector('[name="itemId"]').value);
    form.querySelector('#bloco-descricao').classList.toggle('hidden', tipo !== 'parcial');
    if (!it) return;
    const valor = form.querySelector('[name="valor"]');
    if (tipo === 'curso') valor.value = Math.max(it.total - it.prog, 0).toFixed(2);
    const prev = form.querySelector('[name="previsto"]');
    if (!prev.value && it.fim) prev.value = it.fim;
  };
  form.querySelectorAll('[name="tipo"]').forEach((r) => r.addEventListener('change', sugerir));
  form.querySelector('[name="itemId"]').addEventListener('change', sugerir);
}

function abrirDrawerNf(pagamentoId) {
  const i = atual(); const p = i.pagamentos.find((x) => x.id === pagamentoId); const cv = comprovante(i);
  const emissor = i.remuneracao === 'rpa' ? `Em nome de ${esc(i.nome)}` : `Emitida por ${esc(i.empresa?.razaoSocial ?? 'empresa não cadastrada')}`;
  drawerFormulario({
    id: 'form-nf', titulo: cv.titulo, subtitulo: `${esc(p.descricao)} · ${esc(fmtMoeda(p.valor))}. ${emissor}.`, rotulo: cv.registrar, foco: '#f-numero',
    corpo: `
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('numero', `Número ${cv.numero}`, '', { max: 20 })}
        ${campoTexto('emitidaEm', 'Emitido em', Instrutores.hoje(), { tipo: 'date' })}
      </div>
      ${campoTexto('arquivo', 'Arquivo', '', { placeholder: `Ex.: ${cv.arquivo}`, max: 120, opcional: true })}
      <p class="text-xs text-slate-500 dark:text-neutral-400">No sistema real o XML/PDF é anexado; aqui só o nome.</p>`,
    aoSalvar: (fd) => {
      const d = Object.fromEntries(fd);
      const erros = Instrutores.validarNf(d, cv.numero);
      if (erros.length) return erros;
      estado.lista = Instrutores.registrarNf(estado.lista, i.id, pagamentoId, d);
      persistir(); renderInstrutor(); toast(`${cv.curto} ${d.numero} ${cv.registrada} — pagamento liberado.`);
    },
  });
}

function abrirDrawerPagar(pagamentoId) {
  const i = atual(); const p = i.pagamentos.find((x) => x.id === pagamentoId);
  const rpa = i.remuneracao === 'rpa'; const conta = (rpa ? i.contaPessoal : i.empresa) ?? {};
  drawerFormulario({
    id: 'form-pagar', titulo: 'Registrar pagamento', subtitulo: `${esc(p.descricao)} · ${comprovante(i).curto} ${esc(p.nf?.numero ?? '')}.`, rotulo: 'Confirmar pagamento', foco: '#f-pagoEm',
    corpo: `
      <div class="rounded-lg border border-slate-200 dark:border-neutral-800 p-3 text-sm space-y-1">
        <p><span class="text-slate-500 dark:text-neutral-400">Valor:</span> <strong>${esc(fmtMoeda(p.valor))}</strong></p>
        <p><span class="text-slate-500 dark:text-neutral-400">Para:</span> ${rpa ? `${esc(i.nome)} · CPF ${esc(fmtCpf(Instrutores.pessoaDe(i).cpf))}` : `${esc(i.empresa?.razaoSocial ?? '')} · ${esc(fmtCnpj(i.empresa?.cnpj ?? ''))}`}</p>
        <p><span class="text-slate-500 dark:text-neutral-400">Via:</span> ${conta.pix ? `PIX ${esc(conta.pix)}` : `${esc(conta.banco ?? '')} ag. ${esc(conta.agencia ?? '')} c/c ${esc(conta.conta ?? '')}`}</p>
      </div>
      ${campoTexto('pagoEm', 'Pago em', Instrutores.hoje(), { tipo: 'date' })}`,
    aoSalvar: (fd) => {
      if (!fd.get('pagoEm')) return [{ campo: 'pagoEm', mensagem: 'Data do pagamento.' }];
      estado.lista = Instrutores.registrarPagamento(estado.lista, i.id, pagamentoId, fd.get('pagoEm'));
      persistir(); renderInstrutor(); toast(`Pagamento de ${fmtMoeda(p.valor)} registrado.`);
    },
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
  const aba = parametroUrl('aba');
  if (ABAS.some((a) => a.id === aba)) estado.aba = aba;
  estado.contratoAberto = parametroUrl('contrato');
  if (estado.contratoAberto) estado.aba = 'contratos';
  renderInstrutor();
  // Recém-convidado: já oferece o link para o instrutor completar o cadastro.
  if (sessionStorage.getItem('instrutores-abrir-link') === id) {
    sessionStorage.removeItem('instrutores-abrir-link');
    abrirModalLinkInstrutor(id);
  }
})();
