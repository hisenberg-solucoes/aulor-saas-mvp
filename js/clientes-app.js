// ============================================================
// UI das telas de Empresas e Alunos (antigo "Clientes"). Regras no motor (Clientes.*).
// Listas separadas por página: empresas.html | alunos.html.
// Registro aberto: sub-abas petróleo com fichas de leitura + drawer por seção.
// ============================================================

// Lista (empresas.html / alunos.html) e detalhe (empresa.html / aluno.html) compartilham este arquivo.
// O tipo vem de <body data-tipo="empresa|aluno|responsavel"> nas seis páginas.
const MODO = document.body.dataset.modo === 'detalhe' ? 'detalhe' : 'lista';
const TIPO_PAGINA = ['aluno', 'responsavel'].includes(document.body.dataset.tipo) ? document.body.dataset.tipo : 'empresa';
const LISTA_DE = { empresa: 'empresas', aluno: 'alunos', responsavel: 'responsaveis' };

const estado = {
  dados: Clientes.carregar(),
  tipo: LISTA_DE[TIPO_PAGINA], // lista desta página
  selecionado: null, // { tipo: 'empresa'|'aluno'|'responsavel', id }
  aba: 'dados',
  filtros: { empresas: { busca: '', visao: '', segmento: '', financeiro: '' }, alunos: { busca: '', visao: '', empresaId: '', pagador: '', financeiro: '' }, responsaveis: { busca: '', visao: '', papel: '', vinculo: '' } },
};

// Endereço e cobrança viraram cartões de Dados (?aba=cobranca cai em Dados).
const ABAS_EMPRESA = [
  { id: 'dados', titulo: 'Dados' },
  { id: 'contatos', titulo: 'Contatos' },
  { id: 'alunos', titulo: 'Alunos' },
  { id: 'historico', titulo: 'Vendas' },
];
// Endereço, pagamento, empresa e LGPD viraram cartões de Dados (?aba=cobranca|vinculo cai em Dados).
// Fora da V1: Acompanhamento, Ocorrências e SPC (?aba= delas cai em Dados).
const ABAS_ALUNO = [
  { id: 'dados', titulo: 'Dados' },
  { id: 'responsaveis', titulo: 'Responsáveis' },
  { id: 'contratos', titulo: 'Vendas' },
];
const ABAS_RESPONSAVEL = [
  { id: 'dados', titulo: 'Dados' },
  { id: 'alunos', titulo: 'Alunos' },
];

const ICONE = {
  lapis: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>',
  lixeira: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>',
  mais: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>',
  abaixo: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>',
  lupa: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>',
  fechar: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>',
  predio: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>',
  pessoa: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>',
  local: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>',
  email: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>',
  telefone: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>',
  dinheiro: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>',
  alerta: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>',
  check: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
  estrela: '<svg class="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" /></svg>',
  externo: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>',
  documento: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>',
  alertaMini: '<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>',
  linkBotao: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg>',
  link: '<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg>',
  copiar: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"/></svg>',
  acessibilidade: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="4.5" r="1.75"/><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 9.25c5 1.2 10 1.2 15 0M12 9.75v4.5m0 0l-3 6.5m3-6.5l3 6.5"/></svg>',
  whatsapp: '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>',
};

const BOTAO_SEC = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-40 disabled:pointer-events-none';
// Primário em petróleo: cobre é "é com você", nunca fundo de botão (Regra do Cobre).
const BOTAO_PRI = 'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/40';
const BOTAO_CANCELAR = 'px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition';
const BOTAO_LINK = 'inline-flex items-center gap-1 text-xs font-medium text-petrol-800 dark:text-sky-300 hover:underline';
const ICONE_BOTAO = 'inline-flex items-center justify-center h-7 w-7 rounded-md text-slate-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-30 disabled:pointer-events-none';
const ICONE_BOTAO_VERMELHO = `${ICONE_BOTAO} hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40`;
// Foco dos campos: contorno e anel na cor de foco da marca (petróleo no claro, petróleo luz no escuro).
const FOCO_CAMPO = 'focus:outline-none focus:border-[color:var(--f-foco)] focus:ring-2 focus:ring-[color:var(--f-foco)]/25';
const CAMPO_BUSCA = `h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 pl-8 pr-3 text-sm text-slate-700 dark:text-neutral-200 placeholder:text-slate-400 ${FOCO_CAMPO}`;
const SELECT_FILTRO = `h-9 max-w-40 truncate rounded-lg border bg-white dark:bg-neutral-950 px-2.5 text-sm ${FOCO_CAMPO}`;
const BOTAO_FANTASMA = 'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm font-medium text-slate-500 dark:text-neutral-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30';
const CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)]';
const CARTAO_DEVEDOR = CARTAO.replace('border-slate-200/80 dark:border-neutral-800', 'border-red-300 dark:border-red-800');
const CARTAO_OPCAO = 'cursor-pointer rounded-lg border p-3 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 border-slate-300 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500 transition';
const CHECK = 'check';
const TH = 'px-4 py-2.5';
const TD = 'px-4 py-2.5 text-sm text-slate-600 dark:text-neutral-300';
// Coluna dispensável: some quando o cartão da lista fica estreito (janela em meia tela).
const SO_LARGO = '@max-3xl:hidden';
// Foco do teclado no link do registro acende a linha inteira, com o anel por dentro do cartão.
const FOCO_LINHA = 'has-[.link-registro:focus-visible]:bg-slate-50 dark:has-[.link-registro:focus-visible]:bg-neutral-900 has-[.link-registro:focus-visible]:outline-2 has-[.link-registro:focus-visible]:-outline-offset-2 has-[.link-registro:focus-visible]:outline-[color:var(--f-foco)]';
const LINHA_LISTA = `cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900 transition ${FOCO_LINHA}`;

const PILULA = {
  ativo: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  inativo: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-700',
  petrol: 'bg-petrol-800/10 text-petrol-800 border-petrol-800/20 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
  violeta: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
  ambar: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  neutra: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-700',
  laranja: 'bg-laranja/10 text-laranja-escuro border-laranja/30 dark:bg-laranja/15 dark:text-laranja dark:border-laranja/40',
  vermelha: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
  rosa: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 dark:border-fuchsia-800',
};
const FINANCEIRO_FILTRO = [{ id: 'devedor', nome: 'Devedores' }, { id: 'em-dia', nome: 'Em dia' }];
const fmtMoeda = (v) => (v == null ? '' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
const nomeMotivoInad = (id) => nomeDe(MOTIVOS_INADIMPLENCIA, id);
const nomeNecessidade = (id) => nomeDe(TIPOS_NECESSIDADE, id);
const resumoNecessidades = (a) => a.necessidades.tipos.map(nomeNecessidade).concat(a.necessidades.detalhes ? [a.necessidades.detalhes] : []).join(' · ');
const tituloDevedor = (x) => { const i = x.inadimplencia; return `${nomeMotivoInad(i.motivo) || 'Devedor'}${i.desde ? ` desde ${Clientes.fmtData(i.desde)}` : ''}${i.valor != null ? ` · ${fmtMoeda(i.valor)}` : ''}${i.observacoes ? ` — ${i.observacoes}` : ''}`; };
// Situação financeira do aluno numa leitura só (faixa, cartão, pílula da lista e filtro "Devedores"):
// a marcação do financeiro no cadastro + parcelas vencidas nos contratos, separadas por quem paga.
// Devedor é só a dívida DELE; parcela vencida da empresa/responsável aparece à parte (`outros`).
function financeiroDoAluno(a, cc) {
  const debito = Clientes.debitoDoAluno(estado.dados, a.id, cc);
  const proprio = debito?.proprio.n ? debito.proprio : null;
  const outros = debito?.outros.n ? debito.outros : null;
  return { debito, proprio, outros, manual: a.inadimplencia.devedor, devedor: a.inadimplencia.devedor || Boolean(proprio) };
}
// Empresa e responsável: marcação do financeiro (só empresa tem) + parcelas vencidas dos contratos que pagam.
function financeiroDoPagador(tipo, x, porPagador) {
  const proprio = porPagador?.get(`${tipo}:${x.id}`) ?? null;
  const manual = Boolean(x.inadimplencia?.devedor);
  return { debito: porPagador, proprio, outros: null, manual, devedor: manual || Boolean(proprio) };
}
const parcelas = (d) => `${plural(d.n, 'parcela vencida', 'parcelas vencidas')} · ${fmtMoeda(d.valor)}`;
const pilulaFinanceira = (x, f) => (f.devedor ? pilula(PILULA.vermelha, 'Devedor', [f.manual ? tituloDevedor(x) : '', f.proprio ? `${parcelas(f.proprio)} em ${f.proprio.codigos.join(', ')}` : ''].filter(Boolean).join(' — ')) : '');
// De quem é a parcela, no texto da faixa e do cartão.
const DE_QUEM = { aluno: 'no nome dele', empresa: 'nas vendas que ela paga', responsavel: 'nas vendas que ele paga' };
// Aba de contratos de cada ficha (os atalhos "Ver contratos" apontam para ela).
const ABA_CONTRATOS = { aluno: 'contratos', empresa: 'historico' };
const convitePendente = (a) => Boolean(a.convite && !a.convite.preenchidoEm);
const pilulaConvite = (a) => (convitePendente(a) ? pilula(PILULA.ambar, 'Aguardando aluno', `Link enviado em ${Clientes.fmtData(a.convite.criadoEm)} — o aluno ainda não preencheu`, ICONE.link) : '');
const cadastroEmpresaPendente = (e) => Boolean(e.cadastro && !e.cadastro.preenchidoEm);
const pilulaCadastroEmpresa = (e) => (cadastroEmpresaPendente(e) ? pilula(PILULA.ambar, 'Aguardando empresa', `Link enviado em ${Clientes.fmtData(e.cadastro.criadoEm)} — a empresa ainda não preencheu`, ICONE.link) : '');
const pilulaNecessidades = (a, texto = 'Necessidades') => (Clientes.temNecessidades(a) ? pilula(PILULA.rosa, texto, resumoNecessidades(a)) : '');

// Etiqueta de categoria (.etiqueta-* em styles.css, DESIGN.md › Chips e tags): cor e ícone fixos, sempre com o texto.
const ICONE_ETIQUETA = {
  legal: 'M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z',
  financeiro: 'M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3',
  emergencia: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z',
  menor: 'M4.5 20.25h15v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 13.5v6.75ZM4.5 16c2.5 1.5 5 1.5 7.5 0s5-1.5 7.5 0M12 11.25V7.5M12 3.75c.75.9.75 1.6 0 2.1-.75-.5-.75-1.2 0-2.1Z',
};
const etiqueta = (categoria, texto, titulo = '') => `<span title="${esc(titulo)}" class="etiqueta etiqueta-${categoria}"><svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="${ICONE_ETIQUETA[categoria]}"/></svg>${esc(texto)}</span>`;
const etiquetaMenor = (idade) => etiqueta('menor', 'Menor de idade', `${idade} anos`);

// ---------- Helpers ----------

function pilula(classe, texto, titulo = '', icone = '') {
  return `<span title="${esc(titulo)}" class="pilula inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ${classe}">${icone}${esc(texto)}</span>`;
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

const plural = (n, s, p = `${s}s`) => `${n} ${n === 1 ? s : p}`;
const nomeDe = (lista, id) => lista.find((x) => x.id === id)?.nome ?? '';
const vazio = (v, txt = 'não informado') => (v == null || v === '' ? `<span class="text-slate-500 dark:text-neutral-400">${txt}</span>` : esc(v));
const iniciais = (nome) => nome.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
const nomeEmpresa = (e) => e.nomeFantasia || e.razaoSocial;
const empresaDe = (id) => Clientes.porId(estado.dados.empresas, id);
const linkWhats = (celular) => (celular ? `<a href="https://wa.me/55${celular}" target="_blank" rel="noopener" title="WhatsApp ${esc(Clientes.fmtTelefone(celular))}" class="inline-flex items-center justify-center h-7 w-7 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition">${ICONE.whatsapp}</a>` : '');

// Cabeçalho do registro: uma ação à vista + "Mais" (DESIGN.md › Layout); o WhatsApp vai para o "Mais".
const itemWhats = (celular) => (celular ? [{ nome: 'WhatsApp', detalhe: Clientes.fmtTelefone(celular), acao: () => window.open(`https://wa.me/55${celular}`, '_blank', 'noopener') }] : []);

function persistir() {
  Clientes.salvar(estado.dados);
}

function atual() {
  if (!estado.selecionado) return null;
  return Clientes.porId(estado.dados[LISTA_DE[estado.selecionado.tipo]], estado.selecionado.id);
}

function urlLista(tipoLista) { return `${tipoLista}.html`; }
function urlDetalhe(tipo, id, aba) { return `${tipo}.html?id=${encodeURIComponent(id)}${aba && aba !== 'dados' ? `&aba=${aba}` : ''}`; }

function atualizarUrl() {
  const q = new URLSearchParams();
  if (MODO === 'detalhe') { q.set('id', estado.selecionado.id); if (estado.aba !== 'dados') q.set('aba', estado.aba); }
  const qs = q.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

// Navega entre lista e detalhe (páginas separadas). abrir('empresa'|'aluno', id, aba) vai ao detalhe;
// abrir('empresas'|'alunos', null) vai à página de lista correspondente.
function abrir(tipo, id, aba = 'dados') {
  if (id) {
    if (MODO === 'detalhe' && estado.selecionado && estado.selecionado.tipo === tipo && estado.selecionado.id === id) {
      estado.aba = aba; atualizarUrl(); renderTudo(); document.querySelector('main')?.scrollTo(0, 0);
      return;
    }
    location.href = urlDetalhe(tipo, id, aba);
    return;
  }
  if (MODO === 'detalhe' || tipo !== estado.tipo) { location.href = urlLista(tipo); return; }
  renderTudo();
  document.querySelector('main')?.scrollTo(0, 0);
}

function cabecalhoSecao(titulo, subtitulo, idBotao, rotulo = 'Editar') {
  return `
    <div class="px-4 pt-4 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="font-display text-[15px] font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h3>
        ${subtitulo ? `<p class="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">${subtitulo}</p>` : ''}
      </div>
      ${idBotao ? `<button type="button" id="${idBotao}" class="${BOTAO_FANTASMA} -mt-1 -mr-1.5 shrink-0">${rotulo === 'Editar' ? ICONE.lapis : ICONE.mais} ${rotulo}</button>` : ''}
    </div>`;
}

function campo(rotulo, valorHtml, largura = '') {
  return `
    <div class="${largura}">
      <p class="text-xs font-medium text-slate-500 dark:text-neutral-400">${rotulo}</p>
      <div class="text-sm text-slate-800 dark:text-neutral-100 mt-0.5 break-words">${valorHtml}</div>
    </div>`;
}

function faixaPendencias(pend, contexto, acaoHtml = '') {
  if (!pend.length) return ''; // cadastro completo não precisa de faixa: só o que falta aparece
  return `
    <div class="mb-4 flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
      <span class="shrink-0 text-amber-600 dark:text-amber-400">${ICONE.alerta}</span>
      <div class="flex-1"><span class="font-medium">Falta para ${contexto}:</span> ${pend.map(esc).join(' · ')}</div>
      ${acaoHtml}
    </div>`;
}

function faixaFinanceira(tipo, x, f) {
  const i = x.inadimplencia ?? {};
  const dosOutros = f.outros ? `${esc(f.outros.nomes.join(', '))} com ${esc(parcelas(f.outros))} em ${esc(f.outros.codigos.join(', '))} — não é dívida do aluno, mas nova matrícula paga por ${f.outros.tipos.every((t) => t === 'empresa') ? 'ela' : 'quem paga'} depende do financeiro.` : '';
  if (f.devedor) {
    const partes = [
      f.manual ? `${esc(nomeMotivoInad(i.motivo) || 'marcado pelo financeiro')}${i.desde ? ` desde ${esc(Clientes.fmtData(i.desde))}` : ''}${i.valor != null ? ` · <span class="tabular-nums">${esc(fmtMoeda(i.valor))}</span>` : ''}` : '',
      f.proprio ? `${esc(parcelas(f.proprio))} ${DE_QUEM[tipo]}${f.proprio.emAcordo ? ', com acordo de recuperação' : ''}` : '',
    ].filter(Boolean);
    return `
    <div class="mb-4 flex items-start gap-3 rounded-lg bg-red-100 dark:bg-red-950/40 px-4 py-3 text-sm text-red-800 dark:text-red-200">
      <span class="shrink-0 text-red-600 dark:text-red-400">${ICONE.alerta}</span>
      <div><span class="font-medium">Devedor com a ProWay</span> — ${partes.join('; ')}.${f.manual && i.observacoes ? ` <span class="opacity-80">${esc(i.observacoes)}</span>` : ''} Não matricular em turma nova sem alinhar com o financeiro.${dosOutros ? ` ${dosOutros}` : ''}</div>
    </div>`;
  }
  if (!f.outros) return '';
  return `
    <div class="mb-4 flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
      <span class="shrink-0 text-amber-600 dark:text-amber-400">${ICONE.alerta}</span>
      <div class="flex-1">${dosOutros}</div>
      <button type="button" data-ir-aba="${ABA_CONTRATOS[tipo]}" class="${BOTAO_LINK} shrink-0 mt-0.5">Ver vendas</button>
    </div>`;
}

// Cartão de aluno e empresa: as duas fontes lado a lado — nenhuma "em dia" sozinha esconde a outra.
// V1: marcar devedor só na empresa; no aluno a marcação é só leitura (SPC e "marcar devedor" do aluno saíram).
function cartaoFinanceiro(tipo, x, f) {
  const i = x.inadimplencia;
  const marca = tipo === 'empresa';
  const ruim = (t) => `<span class="font-medium text-red-700 dark:text-red-300">${t}</span>`;
  const atencao = (t) => `<span class="font-medium text-amber-800 dark:text-amber-300">${t}</span>`;
  const ir = (aba, rotulo) => ` <button type="button" data-ir-aba="${aba}" class="${BOTAO_LINK} ml-1">${rotulo}</button>`;
  const contratos = [
    f.proprio ? `<p>${(f.proprio.emAcordo ? atencao : ruim)(esc(parcelas(f.proprio)))} ${tipo === 'aluno' ? 'no nome do aluno' : DE_QUEM[tipo]}${f.proprio.emAcordo ? ', com acordo de recuperação' : ''} — ${esc(f.proprio.codigos.join(', '))}</p>` : '',
    f.outros ? `<p>${atencao(`${esc(f.outros.nomes.join(', '))}: ${esc(parcelas(f.outros))}`)} — ${esc(f.outros.codigos.join(', '))}. Não é dívida do aluno.</p>` : '',
  ].join('');
  return `
      <section class="${f.devedor ? CARTAO_DEVEDOR : CARTAO}">
        ${cabecalhoSecao('Situação financeira com a ProWay', 'Marcação do financeiro e parcelas vencidas nas vendas.', marca ? (i.devedor ? 'btn-editar-devedor' : 'btn-marcar-devedor') : '', i.devedor ? 'Editar' : 'Marcar devedor')}
        <div class="p-4 grid grid-cols-2 gap-4">
          ${i.devedor ? `
          ${campo('Marcação do financeiro', ruim(`${esc(nomeMotivoInad(i.motivo) || 'Devedor')}${i.desde ? ` desde ${esc(Clientes.fmtData(i.desde))}` : ''}`))}
          ${campo('Valor marcado', i.valor != null ? `<span class="tabular-nums">${esc(fmtMoeda(i.valor))}</span>` : vazio('', '—'))}
          ${i.observacoes ? campo('Observações', `<p class="whitespace-pre-line">${esc(i.observacoes)}</p>`, 'col-span-2') : ''}` : campo('Marcação do financeiro', 'Sem marcação.', 'col-span-2')}
          ${f.debito ? campo('Vendas', `${contratos || 'Nenhuma parcela vencida.'}${contratos ? ir(ABA_CONTRATOS[tipo], 'Ver vendas') : ''}`, 'col-span-2') : ''}
        </div>
        ${marca && i.devedor ? `<div class="px-4 pb-4"><div class="pt-3 border-t border-slate-200 dark:border-neutral-800"><button type="button" id="btn-regularizar" class="${BOTAO_SEC}">${ICONE.check} Regularizar marcação</button></div></div>` : ''}
      </section>`;
}

function ligarSituacaoFinanceira(tipo, x, rerender) {
  document.getElementById('btn-marcar-devedor')?.addEventListener('click', () => abrirDrawerDevedor(tipo, x.id, rerender));
  document.getElementById('btn-editar-devedor')?.addEventListener('click', () => abrirDrawerDevedor(tipo, x.id, rerender));
  document.getElementById('btn-regularizar')?.addEventListener('click', () => {
    estado.dados = Clientes.regularizar(estado.dados, tipo, x.id);
    persistir(); rerender();
    toast('Situação regularizada — marcação de devedor removida.');
  });
}

function fichaEndereco(e) {
  return `
    <div class="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
      ${campo('CEP', vazio(Clientes.fmtCep(e.cep)))}
      ${campo('Logradouro', vazio(e.logradouro), 'col-span-2')}
      ${campo('Número', vazio(e.numero))}
      ${campo('Complemento', vazio(e.complemento, '—'))}
      ${campo('Bairro', vazio(e.bairro))}
      ${campo('Cidade', vazio(e.cidade))}
      ${campo('UF', vazio(e.uf))}
    </div>`;
}

// ---------- Lista (uma página por tipo: empresas.html | alunos.html) ----------

function renderLista() {
  const el = document.getElementById('tela');
  const cab = {
    alunos: { titulo: 'Alunos', descricao: 'Pessoas físicas: quem se matricula. É daqui que saem os dados do contrato e do boleto — por isso cada cadastro mostra o que ainda falta.', render: renderListaAlunos, novo: ['Novo aluno', () => abrirDrawerAluno()] },
    empresas: { titulo: 'Empresas', descricao: 'Pessoas jurídicas: clientes corporativos e seus colaboradores. É daqui que saem os dados do contrato, do boleto e da nota fiscal — por isso cada cadastro mostra o que ainda falta.', render: renderListaEmpresas, novo: ['Nova empresa', () => abrirDrawerEmpresa()] },
    responsaveis: { titulo: 'Responsáveis', descricao: 'Pais, mães, tutores e contatos de emergência dos alunos. Um responsável pode responder por vários alunos; por aluno, ele é responsável legal, financeiro (quem paga) e/ou contato de emergência.', render: renderListaResponsaveis, novo: ['Novo responsável', () => abrirDrawerResponsavel()] },
  }[estado.tipo];
  el.innerHTML = `
    <div class="mb-4 flex items-start justify-between gap-6">
      <div>
        <h2 class="font-display text-xl font-semibold text-slate-900 dark:text-neutral-100">${cab.titulo} <span class="ml-1 text-base font-sans font-normal text-slate-600 dark:text-neutral-400 tabular-nums">${estado.dados[estado.tipo].length}</span></h2>
        <p class="max-w-3xl text-sm text-slate-600 dark:text-neutral-400 mt-0.5">${cab.descricao}</p>
      </div>
      <button type="button" id="btn-novo-registro" class="${BOTAO_PRI} shrink-0">${ICONE.mais} ${cab.novo[0]}</button>
    </div>
    <div id="lista"></div>`;
  el.querySelector('#btn-novo-registro').addEventListener('click', cab.novo[1]);
  // O nome de cada linha é o link da ficha (teclado, ⌘-clique, copiar endereço); o resto da linha abre a mesma ficha,
  // a não ser que a pessoa esteja selecionando texto (CPF, e-mail).
  el.querySelector('#lista').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-abrir]');
    if (!tr || e.target.closest('a, button') || getSelection().toString()) return;
    const href = tr.querySelector('.link-registro').href;
    if (e.metaKey || e.ctrlKey) window.open(href, '_blank'); else location.href = href;
  });
  cab.render();
}

// Filtro em select: o nome do critério fica no rótulo acessível e volta a aparecer junto do valor escolhido.
function select(id, rotulo, opcoes, valor, criterio) {
  const cor = valor ? 'border-[color:var(--f-foco)] text-slate-900 dark:text-neutral-100' : 'border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-200';
  return `
    <select id="${id}" class="${SELECT_FILTRO} ${cor}" aria-label="${criterio}">
      <option value="">${rotulo}</option>
      ${opcoes.map((o) => `<option value="${o.id}" ${o.id === valor ? 'selected' : ''}>${o.id === valor ? `${criterio}: ` : ''}${esc(o.nome)}</option>`).join('')}
    </select>`;
}

// Célula principal das listas: avatar, nome (link da ficha) com as exceções ao lado, linha de apoio e,
// se houver, o que falta para contrato/boleto, em cobre e legível sem hover.
function celulaRegistro(tipo, id, { avatar, nome, marcas = '', apoio, pend = [] }) {
  return `
    <td class="${TH}">
      <div class="flex items-center gap-3">
        ${avatar}
        <div class="min-w-0">
          <p class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm font-medium text-slate-800 dark:text-neutral-100"><a href="${urlDetalhe(tipo, id)}" class="link-registro min-w-0 truncate hover:underline underline-offset-2 focus-visible:outline-none">${esc(nome)}</a>${marcas}</p>
          <p class="text-xs text-slate-500 dark:text-neutral-400 truncate">${apoio}</p>
          ${pend.length ? `<p class="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-[color:var(--f-cobre-tinta)]" title="Falta para contrato/boleto: ${esc(pend.join(' · '))}"><span aria-hidden="true" class="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--f-cobre)]"></span><span class="truncate">Falta ${plural(pend.length, 'item', 'itens')}: ${esc(pend.join(' · '))}</span></p>` : ''}
        </div>
      </div>
    </td>`;
}

// colunas: rótulo, ou [rótulo, classes da coluna] para listas com largura fixa (table-fixed, cabeçalho preso ao rolar).
// O cabeçalho prende na borda do <main> (-top-6 desconta o p-6 dele), sem deixar uma faixa de linhas por cima.
function tabela(colunas, linhas, vazioTxt, rodape = '') {
  const fixa = colunas.some(Array.isArray);
  return `
    <div class="${CARTAO} @container ${fixa ? 'overflow-clip' : 'overflow-x-auto'}">
      <table class="w-full text-left ${fixa ? 'table-fixed' : ''}">
        <thead class="text-xs font-medium text-slate-500 dark:text-neutral-400">
          <tr>${colunas.map((c) => { const [rotulo, classe = ''] = [].concat(c); return `<th class="${TH} ${classe} ${fixa ? 'sticky -top-6 z-10' : ''} bg-slate-50 dark:bg-neutral-900 shadow-[inset_0_-1px_0_var(--color-slate-200)] dark:shadow-[inset_0_-1px_0_var(--color-neutral-800)]">${rotulo}</th>`; }).join('')}</tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
          ${linhas.length ? linhas.join('') : `<tr><td colspan="${colunas.length}" class="px-4 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">${vazioTxt}</td></tr>`}
        </tbody>
      </table>
      ${rodape ? `<div class="px-4 py-2 border-t border-slate-100 dark:border-neutral-900 text-xs text-slate-500 dark:text-neutral-400 tabular-nums">${rodape}</div>` : ''}
    </div>`;
}

// Lista vazia por causa dos filtros oferece o caminho de volta.
const vazioLista = (filtrando, semResultado, vazio) => (filtrando ? `${semResultado} <button type="button" data-limpar class="${BOTAO_LINK} ml-1">Limpar filtros</button>` : vazio);
// Abas (da ficha e do filtro rápido): 13px/500 em tinta 3; a ativa em tinta, sublinhada na tinta da marca.
const classeAba = (ativa) => `px-0.5 pb-2.5 text-[13px] font-medium border-b-2 transition whitespace-nowrap ${ativa ? 'border-[color:var(--f-marca-tinta)] text-[color:var(--f-tinta)]' : 'border-transparent text-[color:var(--f-tinta-3)] hover:text-[color:var(--f-tinta-2)]'}`;
const CONTA_ABA = 'text-xs tabular-nums text-[color:var(--f-tinta-3)]';

// Filtro rápido: a lista já filtrada pela barra, recortada pelas exceções. "Com pendência" são exatamente as linhas
// que mostram o que falta (pendDe devolve a mesma lista que a célula do registro exibe).
function porVisao(lista, visao, pendDe) {
  const grupos = { '': lista, pendente: lista.filter((x) => pendDe(x).length), inativo: lista.filter((x) => x.status === 'inativo') };
  return { visiveis: grupos[visao], contagem: Object.fromEntries(Object.entries(grupos).map(([k, v]) => [k, v.length])) };
}
function abasVisao({ contagem }, atual, feminino = false) {
  const visoes = [['', feminino ? 'Todas' : 'Todos'], ['pendente', 'Com pendência'], ['inativo', feminino ? 'Inativas' : 'Inativos']];
  return `
    <div role="group" aria-label="Filtro rápido" class="mb-4 shadow-[inset_0_-1px_0] shadow-slate-200 dark:shadow-neutral-800 flex items-center gap-4">
      ${visoes.map(([id, nome]) => `<button type="button" data-visao="${id}" aria-pressed="${id === atual}" class="${classeAba(id === atual)}">${nome} <span class="ml-0.5 ${id === 'pendente' && contagem[id] ? 'text-xs tabular-nums text-[color:var(--f-cobre-tinta)]' : CONTA_ABA}">${contagem[id]}</span></button>`).join('')}
    </div>`;
}
const ligarVisao = (el, f, render) => el.querySelectorAll('[data-visao]').forEach((b) => b.addEventListener('click', () => { f.visao = b.dataset.visao; render(); document.querySelector(`[data-visao="${f.visao}"]`).focus(); }));
const pilulaInativo = (x) => (x.status === 'inativo' ? pilula(PILULA.inativo, 'Inativo') : '');

function renderListaEmpresas() {
  const el = document.getElementById('lista');
  const f = estado.filtros.empresas;
  const pendDe = (e) => (e.status === 'ativo' ? Clientes.pendenciasEmpresa(e) : []);
  const porPagador = Clientes.debitosPorPagador(estado.dados);
  const fin = new Map(estado.dados.empresas.map((e) => [e.id, financeiroDoPagador('empresa', e, porPagador)]));
  const visao = porVisao(Clientes.filtrarEmpresas(estado.dados.empresas, estado.dados.alunos, f, (e) => fin.get(e.id).devedor), f.visao, pendDe);
  const { visiveis } = visao;
  const filtrando = f.busca || f.segmento || f.financeiro;
  const linha = (e) => {
    const ct = Clientes.contatoPrincipal(e);
    const alunos = Clientes.alunosDaEmpresa(estado.dados.alunos, e.id).length;
    return `
      <tr data-abrir="${e.id}" class="${LINHA_LISTA} ${e.status === 'inativo' ? 'linha-apagada' : ''}">
        ${celulaRegistro('empresa', e.id, {
          avatar: `<div class="h-9 w-9 shrink-0 rounded-lg bg-petrol-800/10 dark:bg-sky-950/60 text-petrol-800 dark:text-sky-300 grid place-items-center text-xs font-semibold">${esc(iniciais(nomeEmpresa(e)))}</div>`,
          nome: nomeEmpresa(e),
          marcas: [pilulaInativo(e), pilulaFinanceira(e, fin.get(e.id)), pilulaCadastroEmpresa(e)].join(''),
          apoio: `${esc(e.razaoSocial)} · <span class="font-mono">${esc(Clientes.fmtCnpj(e.cnpj))}</span>`,
          pend: pendDe(e),
        })}
        <td class="${TD}"><span class="block truncate">${e.segmento ? esc(nomeDe(SEGMENTOS, e.segmento)) : '<span class="text-slate-400">—</span>'}</span>${e.porte ? `<span class="block truncate text-xs text-slate-400">${esc(nomeDe(PORTES, e.porte))}</span>` : ''}</td>
        <td class="${TD} ${SO_LARGO} truncate">${e.endereco.cidade ? `${esc(e.endereco.cidade)}/${esc(e.endereco.uf)}` : '<span class="text-slate-400">—</span>'}</td>
        <td class="${TD}">${ct ? `<span class="block truncate">${esc(ct.nome)}</span><span class="block truncate text-xs text-slate-400">${esc(nomeDe(PAPEIS_CONTATO, ct.papel))}${ct.celular ? ` · ${esc(Clientes.fmtTelefone(ct.celular))}` : ''}</span>` : '<span class="text-slate-400">sem contato</span>'}</td>
        <td class="${TD} text-right tabular-nums">${alunos}</td>
      </tr>`;
  };
  el.innerHTML = `
    ${abasVisao(visao, f.visao, true)}
    <div class="mb-4 flex flex-wrap items-center gap-2">
      ${busca('busca-empresa', f.busca, 'Buscar por nome, CNPJ, cidade ou contato', 'w-72')}
      <div class="ml-auto flex flex-wrap items-center gap-2">
        ${select('filtro-segmento', 'Todos os segmentos', SEGMENTOS, f.segmento, 'Segmento')}
        ${select('filtro-financeiro', 'Situação financeira', FINANCEIRO_FILTRO, f.financeiro, 'Situação')}
        ${filtrando ? `<button type="button" data-limpar class="${BOTAO_LINK} ml-1">Limpar</button>` : ''}
      </div>
    </div>
    ${tabela(['Empresa', ['Segmento', 'w-[17%]'], ['Cidade', `w-[14%] ${SO_LARGO}`], ['Contato principal', 'w-[27%]'], ['Alunos', 'w-20 text-right']], visiveis.map(linha), vazioLista(filtrando, 'Nenhuma empresa corresponde aos filtros.', { pendente: 'Nenhuma empresa ativa com pendência no cadastro.', inativo: 'Nenhuma empresa inativa.' }[f.visao] || 'Nenhuma empresa cadastrada.'), `${plural(visiveis.length, 'empresa')}${filtrando || f.visao ? ` de ${estado.dados.empresas.length}` : ''}`)}`;
  const campoBusca = el.querySelector('#busca-empresa');
  campoBusca.addEventListener('input', () => { f.busca = campoBusca.value; const [ini, fim] = [campoBusca.selectionStart, campoBusca.selectionEnd]; renderListaEmpresas(); const novo = document.getElementById('busca-empresa'); novo.focus(); novo.setSelectionRange(ini, fim); });
  el.querySelector('#filtro-segmento').addEventListener('change', (e) => { f.segmento = e.target.value; renderListaEmpresas(); document.getElementById('filtro-segmento').focus(); });
  el.querySelector('#filtro-financeiro').addEventListener('change', (e) => { f.financeiro = e.target.value; renderListaEmpresas(); document.getElementById('filtro-financeiro').focus(); });
  el.querySelectorAll('[data-limpar]').forEach((b) => b.addEventListener('click', () => { estado.filtros.empresas = { busca: '', visao: f.visao, segmento: '', financeiro: '' }; renderListaEmpresas(); document.getElementById('busca-empresa').focus(); }));
  ligarVisao(el, f, renderListaEmpresas);
}

function renderListaAlunos() {
  const el = document.getElementById('lista');
  const f = estado.filtros.alunos;
  const pendDe = (a) => (a.status === 'ativo' ? Clientes.pendenciasAluno(a, estado.dados.empresas) : []);
  const cc = Clientes.contextoContratos(estado.dados);
  const fin = new Map(estado.dados.alunos.map((a) => [a.id, financeiroDoAluno(a, cc)]));
  const visao = porVisao(Clientes.filtrarAlunos(estado.dados.alunos, estado.dados.empresas, f, (a) => fin.get(a.id).devedor), f.visao, pendDe);
  const { visiveis } = visao;
  const filtrando = f.busca || f.empresaId || f.pagador || f.financeiro;
  const opcoesEmpresa = [{ id: 'sem', nome: 'Sem empresa (particular)' }, ...estado.dados.empresas.map((e) => ({ id: e.id, nome: nomeEmpresa(e) })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))];
  const linha = (a) => {
    const emp = empresaDe(a.empresaId);
    const idade = Clientes.idade(a.nascimento);
    // "O próprio aluno" é o caso comum e não se anuncia; só aparece quem paga quando é outro.
    const paga = a.pagador === 'empresa' ? 'paga a empresa' : a.pagador === 'terceiro' ? `paga ${a.responsavel?.nome || 'outra pessoa'}` : '';
    const apoioEmpresa = [a.cargo && emp ? a.cargo : '', paga].filter(Boolean).map(esc).join(' · ');
    return `
      <tr data-abrir="${a.id}" class="${LINHA_LISTA} ${a.status === 'inativo' ? 'linha-apagada' : ''}">
        ${celulaRegistro('aluno', a.id, {
          avatar: `<div class="h-9 w-9 shrink-0 rounded-full bg-petrol-800 text-white grid place-items-center text-xs font-semibold overflow-hidden">${a.foto ? `<img src="${esc(a.foto)}" alt="" class="h-full w-full object-cover">` : esc(iniciais(a.nome))}</div>`,
          nome: a.nomeSocial || a.nome,
          marcas: [
            pilulaInativo(a),
            idade != null && idade < 18 ? etiquetaMenor(idade) : '',
            pilulaFinanceira(a, fin.get(a.id)),
            pilulaConvite(a),
            Clientes.temNecessidades(a) ? pilulaNecessidades(a, a.necessidades.tipos.length === 1 ? nomeNecessidade(a.necessidades.tipos[0]).split(' /')[0].split(' (')[0] : 'Necessidades') : '',
          ].join(''),
          apoio: `<span class="font-mono">${esc(Clientes.fmtCpf(a.cpf))}</span>${idade != null ? ` · ${idade} anos` : ''}`,
          pend: pendDe(a),
        })}
        <td class="${TD}"><span class="block truncate">${a.email ? esc(a.email) : '<span class="text-slate-400">sem e-mail</span>'}</span><span class="block truncate text-xs text-slate-400">${a.celular ? esc(Clientes.fmtTelefone(a.celular)) : 'sem celular'}</span></td>
        <td class="${TD} ${SO_LARGO} truncate">${a.endereco.cidade ? `${esc(a.endereco.cidade)}/${esc(a.endereco.uf)}` : '<span class="text-slate-400">—</span>'}</td>
        <td class="${TD}"><span class="block truncate">${emp ? esc(nomeEmpresa(emp)) : '<span class="text-slate-400">particular</span>'}</span>${apoioEmpresa ? `<span class="block truncate text-xs text-slate-400">${apoioEmpresa}</span>` : ''}</td>
      </tr>`;
  };
  el.innerHTML = `
    ${abasVisao(visao, f.visao)}
    <div class="mb-4 flex flex-wrap items-center gap-2">
      ${busca('busca-aluno', f.busca, 'Buscar por nome, CPF, e-mail, celular ou empresa', 'w-72')}
      <div class="ml-auto flex flex-wrap items-center gap-2">
        ${select('filtro-empresa', 'Todas as empresas', opcoesEmpresa, f.empresaId, 'Empresa')}
        ${select('filtro-pagador', 'Quem paga', PAGADORES, f.pagador, 'Quem paga')}
        ${select('filtro-financeiro', 'Situação financeira', FINANCEIRO_FILTRO, f.financeiro, 'Situação')}
        ${filtrando ? `<button type="button" data-limpar class="${BOTAO_LINK} ml-1">Limpar</button>` : ''}
      </div>
    </div>
    ${tabela(['Aluno', ['Contato', 'w-[28%]'], ['Cidade', `w-[15%] ${SO_LARGO}`], ['Empresa · quem paga', 'w-[24%]']], visiveis.map(linha), vazioLista(filtrando, 'Nenhum aluno corresponde aos filtros.', { pendente: 'Nenhum aluno ativo com pendência no cadastro.', inativo: 'Nenhum aluno inativo.' }[f.visao] || 'Nenhum aluno cadastrado.'), `${plural(visiveis.length, 'aluno')}${filtrando || f.visao ? ` de ${estado.dados.alunos.length}` : ''}`)}`;
  const campoBusca = el.querySelector('#busca-aluno');
  campoBusca.addEventListener('input', () => { f.busca = campoBusca.value; const [ini, fim] = [campoBusca.selectionStart, campoBusca.selectionEnd]; renderListaAlunos(); const novo = document.getElementById('busca-aluno'); novo.focus(); novo.setSelectionRange(ini, fim); });
  [['filtro-empresa', 'empresaId'], ['filtro-pagador', 'pagador'], ['filtro-financeiro', 'financeiro']].forEach(([id, k]) => el.querySelector(`#${id}`).addEventListener('change', (e) => { f[k] = e.target.value; renderListaAlunos(); document.getElementById(id).focus(); }));
  el.querySelectorAll('[data-limpar]').forEach((b) => b.addEventListener('click', () => { estado.filtros.alunos = { busca: '', visao: f.visao, empresaId: '', pagador: '', financeiro: '' }; renderListaAlunos(); document.getElementById('busca-aluno').focus(); }));
  ligarVisao(el, f, renderListaAlunos);
}

// ---------- Cabeçalho comum do registro aberto ----------

function cabecalhoRegistro({ voltar, tipoLista, avatar, titulo, pilulas, chips, acoes, abas, contadores }) {
  const el = document.getElementById('tela');
  const ativa = abas.find((a) => a.id === estado.aba || a.partes?.some((p) => p.id === estado.aba));
  const subAba = (a) => `
    <button type="button" data-aba="${a.id}"
      class="${classeAba(a === ativa)}">${a.titulo}${contadores[a.id] != null ? ` <span class="ml-1 ${CONTA_ABA}">${contadores[a.id]}</span>` : ''}</button>`;
  // Partes da aba ativa: segmentado na mesma linha das ações da parte (a 1ª parte herda o contador da aba).
  const parte = (p) => `
    <button type="button" data-aba="${p.id}"
      class="h-7 px-2.5 rounded-md text-[12.5px] font-medium whitespace-nowrap transition ${p.id === estado.aba ? 'bg-[color:var(--f-elevado)] text-[color:var(--f-tinta)] shadow-[0_1px_2px_rgb(7_30_44/0.08)]' : 'text-[color:var(--f-tinta-2)] hover:text-[color:var(--f-tinta)]'}">${p.titulo}${p.id !== ativa.id && contadores[p.id] != null ? ` <span class="ml-1 ${CONTA_ABA}">${contadores[p.id]}</span>` : ''}</button>`;
  el.innerHTML = `
    <nav aria-label="Breadcrumb" class="mb-3 flex items-center gap-1.5 text-sm text-slate-600 dark:text-neutral-400">
      <a href="${urlLista(tipoLista)}" class="hover:text-petrol-800 dark:hover:text-sky-300 transition">${voltar}</a>
      <span>/</span>
      <span class="font-medium text-slate-800 dark:text-neutral-100 truncate max-w-xs" aria-current="page">${titulo}</span>
    </nav>
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1 basis-80 flex items-start gap-3">
        ${avatar}
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2 min-w-0">
            <h2 class="font-registro text-[26px] leading-[1.15] font-semibold tracking-[-0.01em] text-slate-900 dark:text-neutral-100 truncate">${titulo}</h2>
            ${pilulas}
          </div>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">${chips}</div>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">${acoes}</div>
    </div>
    <div id="faixa"></div>
    <div class="mb-4 shadow-[inset_0_-1px_0] shadow-slate-200 dark:shadow-neutral-800 flex flex-wrap items-center gap-x-4 gap-y-2">${abas.map(subAba).join('')}</div>
    ${ativa?.partes ? `
    <div class="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div class="inline-flex rounded-lg bg-[color:var(--f-etiqueta)] p-0.5">${ativa.partes.map(parte).join('')}</div>
      <div id="acoes-aba" class="flex flex-1 flex-wrap items-center gap-2"></div>
    </div>` : '<div id="acoes-aba" class="mb-4 flex flex-wrap items-center gap-2 empty:hidden"></div>'}
    <div id="conteudo-aba"></div>`;
  el.querySelectorAll('[data-aba]').forEach((b) => b.addEventListener('click', () => { estado.aba = b.dataset.aba; atualizarUrl(); renderTudo(); }));
  return el;
}

// Atalhos das faixas e do cartão financeiro para outras abas do mesmo registro (#faixa e #conteudo-aba nascem a cada render).
const ligarIrAba = (el, tipo, id) => ['#faixa', '#conteudo-aba'].forEach((sel) => el.querySelector(sel).addEventListener('click', (ev) => { const b = ev.target.closest('[data-ir-aba]'); if (b) abrir(tipo, id, b.dataset.irAba); }));

// ---------- Empresa aberta ----------

function renderEmpresa() {
  const e = atual();
  const pend = Clientes.pendenciasEmpresa(e);
  const alunos = Clientes.alunosDaEmpresa(estado.dados.alunos, e.id);
  const ct = Clientes.contatoPrincipal(e);
  const hist = Clientes.contratosDaEmpresa(estado.dados, e.id);
  const el = cabecalhoRegistro({
    voltar: 'Empresas', tipoLista: 'empresas',
    avatar: `<div class="h-12 w-12 shrink-0 rounded-xl bg-petrol-800/10 dark:bg-sky-950/60 text-petrol-800 dark:text-sky-300 grid place-items-center font-display font-semibold">${esc(iniciais(nomeEmpresa(e)))}</div>`,
    titulo: esc(nomeEmpresa(e)),
    // Só exceções: "Ativa" e o segmento (está em Dados) não se anunciam.
    pilulas: `${pilulaInativo(e)}${e.cobranca.exigePedidoCompra ? pilula(PILULA.ambar, 'Exige PO', 'Exige pedido de compra para faturar') : ''}${e.convite ? pilula(Clientes.conviteEmpresaAberto(e) ? PILULA.petrol : PILULA.neutra, `Link: ${e.convite.usos.length}${e.convite.limite ? `/${e.convite.limite}` : ''} cadastro${e.convite.usos.length === 1 ? '' : 's'}`, Clientes.conviteEmpresaAberto(e) ? 'Link de cadastro aberto para colaboradores' : 'Link de cadastro desativado ou esgotado', ICONE.link) : ''}`,
    chips: `
      ${e.nomeFantasia ? `<span class="text-sm text-slate-600 dark:text-neutral-400 mr-1">${esc(e.razaoSocial)}</span>` : ''}
      ${chip(ICONE.predio, `<span class="font-mono">${esc(Clientes.fmtCnpj(e.cnpj))}</span>`, 'CNPJ')}
      ${e.endereco.cidade ? chip(ICONE.local, `${esc(e.endereco.cidade)}/${esc(e.endereco.uf)}`, 'Cidade') : ''}
      ${ct ? chip(ICONE.pessoa, `${esc(ct.nome)} · ${esc(nomeDe(PAPEIS_CONTATO, ct.papel))}`, 'Contato principal') : ''}
      ${chip(ICONE.pessoa, plural(alunos.length, 'aluno'), 'Alunos vinculados')}`,
    acoes: `
      <button type="button" id="btn-editar" class="${BOTAO_SEC}">${ICONE.lapis} Editar dados</button>
      <button type="button" id="btn-mais" class="${BOTAO_SEC}" aria-haspopup="menu" aria-expanded="false">Mais ${ICONE.abaixo}</button>`,
    abas: ABAS_EMPRESA, contadores: { contatos: e.contatos.length, alunos: alunos.length, historico: hist.length },
  });
  el.querySelector('#faixa').innerHTML = faixaFinanceira('empresa', e, financeiroDoPagador('empresa', e, Clientes.debitosPorPagador(estado.dados))) + faixaCadastroEmpresa(e) + (e.status === 'ativo' ? faixaPendencias(pend, 'contrato, boleto e nota fiscal', cadastroEmpresaPendente(e) ? '' : `<button type="button" id="btn-faixa-link-cadastro" class="${BOTAO_LINK} shrink-0">Pedir para a empresa preencher</button>`) : '');
  el.querySelector('#btn-editar').addEventListener('click', () => abrirDrawerEmpresa(e.id));
  el.querySelector('#btn-faixa-link-cadastro')?.addEventListener('click', () => abrirModalLinkCadastroEmpresa(e.id));
  el.querySelector('#btn-mais').addEventListener('click', (ev) => abrirMenu(ev.currentTarget, [
    { nome: 'Link para a empresa', detalhe: 'RH ou financeiro completa o cadastro', acao: () => abrirModalLinkCadastroEmpresa(e.id) },
    { nome: 'Link para alunos', detalhe: 'Colaboradores se cadastram sozinhos', acao: () => abrirModalLinkEmpresa(e.id) },
    'sep',
    { nome: e.status === 'ativo' ? 'Inativar empresa' : 'Ativar empresa', acao: () => {
      const novo = e.status === 'ativo' ? 'inativo' : 'ativo';
      estado.dados = Clientes.alterarStatus(estado.dados, 'empresa', e.id, novo);
      persistir(); renderEmpresa();
      toast(`"${nomeEmpresa(e)}" ${novo === 'ativo' ? 'ativada.' : 'inativada.'}`);
    } },
    { nome: 'Excluir empresa', perigo: true, desabilitado: hist.length > 0, detalhe: hist.length ? 'Tem histórico de turmas — inative em vez de excluir' : '', acao: () => confirmarExclusaoEmpresa(e.id) },
  ]));
  ligarIrAba(el, 'empresa', e.id);
  ({ dados: renderEmpresaDados, contatos: renderEmpresaContatos, alunos: renderEmpresaAlunos, historico: renderEmpresaHistorico })[estado.aba]();
}

function renderEmpresaDados() {
  const e = atual();
  const cob = cartoesCobrancaEmpresa(e);
  document.getElementById('acoes-aba').innerHTML = '';
  document.getElementById('conteudo-aba').innerHTML = `
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <section class="${CARTAO}">
        ${cabecalhoSecao('Identificação', 'Como sai no contrato e na nota fiscal.', 'btn-editar-dados')}
        <div class="p-4 grid grid-cols-2 gap-4">
          ${campo('Razão social', esc(e.razaoSocial), 'col-span-2')}
          ${campo('Nome fantasia', vazio(e.nomeFantasia, '—'))}
          ${campo('CNPJ', `<span class="font-mono">${esc(Clientes.fmtCnpj(e.cnpj))}</span>`)}
          ${campo('Inscrição estadual', vazio(e.inscricaoEstadual, '—'))}
          ${campo('Porte', vazio(nomeDe(PORTES, e.porte), '—'))}
          ${campo('Segmento', vazio(nomeDe(SEGMENTOS, e.segmento), '—'))}
          ${campo('Como chegou', vazio(nomeDe(ORIGENS, e.origem), '—'))}
        </div>
      </section>
      <section class="${CARTAO}">
        ${cabecalhoSecao('Contato geral', 'Canal institucional; as pessoas ficam na aba Contatos.', 'btn-editar-dados-2')}
        <div class="p-4 grid grid-cols-2 gap-4">
          ${campo('E-mail', vazio(e.email))}
          ${campo('Telefone', vazio(Clientes.fmtTelefone(e.telefone)))}
          ${campo('Site', e.site ? `<a href="https://${esc(e.site)}" target="_blank" rel="noopener" class="text-petrol-800 dark:text-sky-300 hover:underline">${esc(e.site)}</a>` : vazio('', '—'))}
          ${campo('Observações', `<p class="whitespace-pre-line">${vazio(e.observacoes, '—')}</p>`, 'col-span-2')}
        </div>
      </section>
      ${cartaoFinanceiro('empresa', e, financeiroDoPagador('empresa', e, Clientes.debitosPorPagador(estado.dados)))}
      ${cob.cobranca}
      ${cob.endereco}
    </div>`;
  document.getElementById('btn-editar-dados').addEventListener('click', () => abrirDrawerEmpresa(e.id));
  document.getElementById('btn-editar-dados-2').addEventListener('click', () => abrirDrawerEmpresa(e.id));
  ligarSituacaoFinanceira('empresa', e, renderEmpresa);
  cob.ligar();
}

function renderEmpresaContatos() {
  const e = atual();
  const acoes = document.getElementById('acoes-aba');
  acoes.innerHTML = `
    <p class="text-sm text-slate-600 dark:text-neutral-400">Pessoas com quem a ProWay fala: quem aprova, quem organiza as turmas e quem recebe boleto e nota.</p>
    <div class="ml-auto"><button type="button" id="btn-novo-contato" class="${BOTAO_PRI}">${ICONE.mais} Novo contato</button></div>`;
  acoes.querySelector('#btn-novo-contato').addEventListener('click', () => abrirDrawerContato());
  const el = document.getElementById('conteudo-aba');
  const ordem = { gestor: 0, rh: 1, financeiro: 2, outro: 3 };
  const contatos = [...e.contatos].sort((a, b) => Number(b.principal) - Number(a.principal) || ordem[a.papel] - ordem[b.papel] || a.nome.localeCompare(b.nome, 'pt-BR'));
  el.innerHTML = contatos.length ? `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">${contatos.map((c) => `
    <div class="${CARTAO} p-4 ${c.principal ? 'border-petrol-800/40 dark:border-sky-400/40' : ''}">
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-3 min-w-0">
          <div class="h-10 w-10 shrink-0 rounded-full bg-petrol-800 text-white grid place-items-center text-xs font-semibold">${esc(iniciais(c.nome))}</div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-slate-800 dark:text-neutral-100 truncate">${esc(c.nome)}</p>
            <p class="text-xs text-slate-500 dark:text-neutral-400 truncate">${esc(c.cargo || '—')}</p>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          ${linkWhats(c.celular)}
          <button type="button" data-editar-contato="${c.id}" title="Editar" class="${ICONE_BOTAO}">${ICONE.lapis}</button>
          <button type="button" data-excluir-contato="${c.id}" title="Remover" class="${ICONE_BOTAO_VERMELHO}">${ICONE.lixeira}</button>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-1.5 mt-3">
        ${pilula(c.papel === 'financeiro' ? PILULA.violeta : c.papel === 'gestor' ? PILULA.petrol : PILULA.neutra, nomeDe(PAPEIS_CONTATO, c.papel), PAPEIS_CONTATO.find((p) => p.id === c.papel)?.descricao ?? '')}
        ${c.principal ? pilula(PILULA.laranja, 'Principal', 'Contato principal da empresa', ICONE.estrela) : ''}
      </div>
      <div class="mt-3 space-y-1 text-xs text-slate-600 dark:text-neutral-300">
        <p class="flex items-center gap-1.5"><span class="text-slate-400">${ICONE.email}</span>${c.email ? `<a href="mailto:${esc(c.email)}" class="hover:underline truncate">${esc(c.email)}</a>` : '<span class="text-slate-400">sem e-mail</span>'}</p>
        <p class="flex items-center gap-1.5"><span class="text-slate-400">${ICONE.telefone}</span>${c.celular ? esc(Clientes.fmtTelefone(c.celular)) : '<span class="text-slate-400">sem celular</span>'}</p>
      </div>
    </div>`).join('')}</div>` : `
    <div class="${CARTAO} border-dashed p-10 text-center">
      <p class="text-sm text-slate-500 dark:text-neutral-400">Nenhuma pessoa de contato. Sem isso não dá para fechar venda nem enviar boleto.</p>
      <button type="button" id="btn-novo-contato-vazio" class="${BOTAO_PRI} mt-4">${ICONE.mais} Adicionar contato</button>
    </div>`;
  el.querySelector('#btn-novo-contato-vazio')?.addEventListener('click', () => abrirDrawerContato());
  el.querySelectorAll('[data-editar-contato]').forEach((b) => b.addEventListener('click', () => abrirDrawerContato(b.dataset.editarContato)));
  el.querySelectorAll('[data-excluir-contato]').forEach((b) => b.addEventListener('click', () => {
    const c = e.contatos.find((x) => x.id === b.dataset.excluirContato);
    estado.dados = Clientes.removerContato(estado.dados, e.id, c.id);
    persistir(); renderEmpresa();
    toast(`${c.nome} removido dos contatos.`);
  }));
}

function cartoesCobrancaEmpresa(e) {
  const k = e.cobranca;
  const fin = Clientes.contatoFinanceiro(e);
  return {
    endereco: `
      <section class="${CARTAO} xl:col-span-2">
        ${cabecalhoSecao('Endereço', 'Endereço fiscal — vai para contrato, boleto e NF.', 'btn-editar-cobranca')}
        ${fichaEndereco(e.endereco)}
      </section>`,
    cobranca: `
      <section class="${CARTAO}">
        ${cabecalhoSecao('Cobrança e faturamento', 'Como a empresa quer receber a cobrança.', 'btn-editar-cobranca-2')}
        <div class="p-4 grid grid-cols-2 gap-4">
          ${campo('E-mail de cobrança / NF', vazio(k.emailCobranca || e.email), 'col-span-2')}
          ${campo('Contato financeiro', fin ? `${esc(fin.nome)} <span class="text-xs text-slate-400">· ${esc(fin.email || Clientes.fmtTelefone(fin.celular))}</span>` : '<span class="text-amber-700 dark:text-amber-400">nenhum na aba Contatos</span>', 'col-span-2')}
          ${campo('Forma preferida', vazio(nomeDe(FORMAS_COBRANCA, k.formaPreferida)))}
          ${campo('Dia de vencimento', k.diaVencimento ? `Dia ${k.diaVencimento}` : vazio(''))}
          ${campo('Pedido de compra (PO)', k.exigePedidoCompra ? 'Exige PO antes de faturar' : 'Não exige')}
          ${campo('Observações de faturamento', `<p class="whitespace-pre-line">${vazio(k.observacoes, '—')}</p>`, 'col-span-2')}
        </div>
      </section>`,
    ligar: () => {
      document.getElementById('btn-editar-cobranca').addEventListener('click', () => abrirDrawerEnderecoCobrancaEmpresa());
      document.getElementById('btn-editar-cobranca-2').addEventListener('click', () => abrirDrawerEnderecoCobrancaEmpresa());
    },
  };
}

function renderEmpresaAlunos() {
  const e = atual();
  const alunos = Clientes.alunosDaEmpresa(estado.dados.alunos, e.id);
  const cc = Clientes.contextoContratos(estado.dados);
  const acoes = document.getElementById('acoes-aba');
  acoes.innerHTML = `
    <p class="text-sm text-slate-600 dark:text-neutral-400">Colaboradores vinculados. Com "quem paga = empresa", o contrato e o boleto saem contra a empresa.</p>
    <div class="ml-auto flex items-center gap-2">
      <button type="button" id="btn-link-empresa-aba" class="${BOTAO_SEC}">${ICONE.link} Link para alunos</button>
      <button type="button" id="btn-vincular" class="${BOTAO_SEC}">${ICONE.mais} Vincular alunos já cadastrados</button>
      <button type="button" id="btn-novo-aluno-empresa" class="${BOTAO_PRI}">${ICONE.mais} Novo aluno</button>
    </div>`;
  acoes.querySelector('#btn-vincular').addEventListener('click', () => abrirSeletorAlunos());
  acoes.querySelector('#btn-link-empresa-aba').addEventListener('click', () => abrirModalLinkEmpresa(e.id));
  acoes.querySelector('#btn-novo-aluno-empresa').addEventListener('click', () => abrirDrawerAluno(null, e.id));
  const aguardandoEm = (a) => (typeof Contratos === 'undefined' ? [] : Clientes.contratosDetalhadosDoAluno(estado.dados, a.id).filter((x) => x.vinculo.situacao === 'aguardando').map((x) => x.contrato.codigo));
  const linha = (a) => {
    const aguardando = aguardandoEm(a);
    return `
      <tr class="${FOCO_LINHA} ${a.status === 'inativo' ? 'linha-apagada' : ''}">
        ${celulaRegistro('aluno', a.id, {
          avatar: `<div class="h-8 w-8 shrink-0 rounded-full bg-petrol-800 text-white grid place-items-center text-[11px] font-semibold">${esc(iniciais(a.nome))}</div>`,
          nome: a.nome,
          marcas: [
            pilulaInativo(a),
            pilulaFinanceira(a, financeiroDoAluno(a, cc)),
            pilulaNecessidades(a),
            aguardando.length ? pilula(PILULA.ambar, 'Aguardando conferência', `Entrou pelo link do pacote na venda ${aguardando.join(', ')} — aprove ou recuse lá`) : '',
            pilulaConvite(a),
            a.convite?.via === 'empresa' ? pilula(PILULA.neutra, 'Via link', `Cadastrou-se pelo link da empresa em ${Clientes.fmtData(a.convite.preenchidoEm.slice(0, 10))}`) : '',
          ].join(''),
          apoio: `<span class="font-mono">${esc(Clientes.fmtCpf(a.cpf))}</span>`,
          pend: convitePendente(a) || a.status !== 'ativo' ? [] : Clientes.pendenciasAluno(a, estado.dados.empresas),
        })}
        <td class="${TD}"><span class="block truncate">${vazio(a.cargo, '—')}</span><span class="block truncate text-xs text-slate-400">paga ${a.pagador === 'empresa' ? 'a empresa' : a.pagador === 'terceiro' ? (esc(a.responsavel?.nome) || 'outra pessoa') : 'o próprio aluno'}</span></td>
        <td class="${TD}"><span class="block truncate">${a.email ? esc(a.email) : '<span class="text-slate-400">—</span>'}</span><span class="block truncate text-xs text-slate-400">${a.celular ? esc(Clientes.fmtTelefone(a.celular)) : ''}</span></td>
        <td class="${TH}">
          <div class="flex items-center gap-1 justify-end">
            ${linkWhats(a.celular)}
            <button type="button" data-link-aluno="${a.id}" title="${convitePendente(a) ? 'Link enviado — aguardando o aluno' : 'Link para o aluno completar o cadastro'}" class="${ICONE_BOTAO} ${convitePendente(a) ? 'text-amber-600 dark:text-amber-400' : ''}">${ICONE.linkBotao}</button>
            <button type="button" data-abrir-aluno="${a.id}" title="Abrir aluno" class="${ICONE_BOTAO}">${ICONE.externo}</button>
            <button type="button" data-desvincular="${a.id}" title="Desvincular da empresa" class="${ICONE_BOTAO_VERMELHO}">${ICONE.lixeira}</button>
          </div>
        </td>
      </tr>`;
  };
  const el = document.getElementById('conteudo-aba');
  el.innerHTML = tabela(['Aluno', ['Cargo · quem paga', 'w-[22%]'], ['Contato', 'w-[26%]'], ['', 'w-36']], alunos.map(linha), 'Nenhum aluno vinculado a esta empresa.', plural(alunos.length, 'aluno'));
  el.querySelectorAll('[data-abrir-aluno]').forEach((b) => b.addEventListener('click', () => abrir('aluno', b.dataset.abrirAluno)));
  el.querySelectorAll('[data-link-aluno]').forEach((b) => b.addEventListener('click', () => abrirModalLinkAluno(b.dataset.linkAluno, renderEmpresa)));
  el.querySelectorAll('[data-desvincular]').forEach((b) => b.addEventListener('click', () => {
    const a = Clientes.porId(estado.dados.alunos, b.dataset.desvincular);
    estado.dados = Clientes.vincularEmpresa(estado.dados, a.id, null);
    persistir(); renderEmpresa();
    toast(`${a.nome} desvinculado — passa a pagar como particular.`);
  }));
}

function renderEmpresaHistorico() {
  const e = atual();
  const hist = Clientes.contratosDaEmpresa(estado.dados, e.id);
  document.getElementById('acoes-aba').innerHTML = `<a href="contratos.html?novo=1" class="${BOTAO_PRI}">${ICONE.mais} Nova venda</a>`;
  const linha = ({ contrato: c, ctx }) => {
    const t = Contratos.totais(c);
    const st = Contratos.statusDe(c);
    const sit = Contratos.situacaoCobranca(c);
    const alunos = Contratos.alunosDe(ctx, c);
    return `
      <tr>
        <td class="${TD}"><a href="contrato.html?id=${c.id}" class="font-mono text-sm font-medium text-petrol-800 dark:text-sky-300 hover:underline">${esc(c.codigo)}</a><br><span class="text-xs text-slate-400">${esc(Clientes.fmtData(c.criadoEm.slice(0, 10)))}</span></td>
        <td class="${TD}">${esc(Contratos.descricao(ctx, c))}<br><span class="text-xs text-slate-400">${esc(Contratos.resumoVagasTexto(c))}${c.pacotes.length ? ` · ${c.pacotes.map((p) => esc(p.nome)).join(' · ')}` : ''}</span></td>
        <td class="${TD}">${alunos.map((x) => esc(x.nomeSocial || x.nome)).join(', ') || '<span class="text-slate-400">—</span>'}${Contratos.alunosAguardando(c).length ? `<br>${pilula(PILULA.ambar, `${Contratos.alunosAguardando(c).length} aguardando conferência`, 'Entraram pelo link do pacote e ainda não foram aprovados')}` : ''}</td>
        <td class="${TD} text-right tabular-nums whitespace-nowrap">${Contratos.fmtMoeda(t.final)}</td>
        <td class="${TH}"><div class="flex flex-wrap gap-1.5">${pilula(c.status === 'adm_ok' ? PILULA.ativo : c.status === 'cancelado' ? PILULA.inativo : c.status === 'rascunho' ? PILULA.neutra : c.status === 'aguardando' ? PILULA.ambar : PILULA.petrol, st?.curto ?? st?.nome ?? c.status, st?.descricao)}${sit === 'inadimplente' ? pilula('bg-red-50 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800', 'Inadimplente') : sit === 'recuperante' ? pilula(PILULA.laranja, 'Recuperante') : ''}</div></td>
      </tr>`;
  };
  document.getElementById('conteudo-aba').innerHTML = `
    <p class="text-sm text-slate-600 dark:text-neutral-400 mb-3">Vendas em que esta empresa é a contratante. Abra a venda para ver itens, matrículas, boletos e NF.</p>
    ${tabela(['Venda', 'O que foi vendido', 'Alunos', 'Valor final', 'Status'], hist.map(linha), 'Nenhuma venda com esta empresa ainda.')}`;
}

// ---------- Aluno aberto ----------

function renderAluno() {
  const a = atual();
  const pend = Clientes.pendenciasAluno(a, estado.dados.empresas);
  const emp = empresaDe(a.empresaId);
  const idade = Clientes.idade(a.nascimento);
  const hist = Clientes.contratosDoAluno(estado.dados, a.id);
  const el = cabecalhoRegistro({
    voltar: 'Alunos', tipoLista: 'alunos',
    avatar: `<div class="h-12 w-12 shrink-0 rounded-full bg-petrol-800 text-white grid place-items-center font-display font-semibold overflow-hidden">${a.foto ? `<img src="${esc(a.foto)}" alt="" class="h-full w-full object-cover">` : esc(iniciais(a.nome))}</div>`,
    titulo: esc(a.nomeSocial || a.nome),
    // Só exceções: "Ativo" e "paga: o próprio aluno" são o caso comum e não se anunciam.
    pilulas: `${pilulaInativo(a)}${a.pagador !== 'proprio' ? pilula(a.pagador === 'empresa' ? PILULA.petrol : PILULA.violeta, `Paga: ${nomeDe(PAGADORES, a.pagador).toLowerCase()}`) : ''}${idade != null && idade < 18 ? etiquetaMenor(idade) : ''}`,
    chips: `
      ${a.nomeSocial ? `<span class="text-sm text-slate-600 dark:text-neutral-400 mr-1">${esc(a.nome)}</span>` : ''}
      ${chip(ICONE.pessoa, `<span class="font-mono">${esc(Clientes.fmtCpf(a.cpf))}</span>${idade != null ? ` · ${idade} anos` : ''}`, 'CPF · idade')}
      ${a.email ? chip(ICONE.email, esc(a.email), 'E-mail') : ''}
      ${a.celular ? chip(ICONE.telefone, esc(Clientes.fmtTelefone(a.celular)), 'Celular') : ''}
      ${a.endereco.cidade ? chip(ICONE.local, `${esc(a.endereco.cidade)}/${esc(a.endereco.uf)}`, 'Cidade') : ''}
      ${emp ? chip(ICONE.predio, `${esc(nomeEmpresa(emp))}${a.cargo ? ` · ${esc(a.cargo)}` : ''}`, 'Empresa') : ''}`,
    acoes: `
      <button type="button" id="btn-editar" class="${BOTAO_SEC}">${ICONE.lapis} Editar dados</button>
      <button type="button" id="btn-mais" class="${BOTAO_SEC}" aria-haspopup="menu" aria-expanded="false">Mais ${ICONE.abaixo}</button>`,
    abas: ABAS_ALUNO, contadores: { responsaveis: a.responsaveis.length || null, contratos: hist.length },
  });
  el.querySelector('#faixa').innerHTML = faixaFinanceira('aluno', a, financeiroDoAluno(a)) + faixaConvite(a) + faixaNecessidades(a) + (a.status === 'ativo' ? faixaPendencias(pend, 'contrato e boleto') : '');
  el.querySelector('#btn-faixa-link')?.addEventListener('click', () => abrirModalLinkAluno(a.id));
  el.querySelector('#btn-editar').addEventListener('click', () => abrirDrawerAluno(a.id));
  el.querySelector('#btn-mais').addEventListener('click', (ev) => abrirMenu(ev.currentTarget, [
    ...itemWhats(a.celular),
    { nome: 'Link para o aluno', detalhe: 'Ele mesmo completa o cadastro', acao: () => abrirModalLinkAluno(a.id) },
    { nome: 'Declaração de matrícula', detalhe: 'Carteirinha de estudante, meia-entrada', acao: () => abrirModalDeclaracao(a.id) },
    'sep',
    { nome: a.status === 'ativo' ? 'Inativar aluno' : 'Ativar aluno', acao: () => {
      const novo = a.status === 'ativo' ? 'inativo' : 'ativo';
      estado.dados = Clientes.alterarStatus(estado.dados, 'aluno', a.id, novo);
      persistir(); renderAluno();
      toast(`${a.nome} ${novo === 'ativo' ? 'ativado.' : 'inativado.'}`);
    } },
    { nome: 'Excluir aluno', perigo: true, desabilitado: hist.length > 0, detalhe: hist.length ? 'Tem histórico de matrículas — inative em vez de excluir' : '', acao: () => confirmarExclusaoAluno(a.id) },
  ]));
  ligarIrAba(el, 'aluno', a.id);
  ({ dados: renderAlunoDados, responsaveis: renderAlunoResponsaveis, contratos: renderAlunoContratos })[estado.aba]();
}

function renderAlunoDados() {
  const a = atual();
  const cob = cartoesCobrancaAluno(a);
  const vin = cartoesVinculoAluno(a);
  document.getElementById('acoes-aba').innerHTML = '';
  document.getElementById('conteudo-aba').innerHTML = `
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <section class="${CARTAO}">
        ${cabecalhoSecao('Identificação', 'Como sai no contrato e no certificado.', 'btn-editar-dados')}
        <div class="p-4 grid grid-cols-2 gap-4">
          ${campo('Nome completo', esc(a.nome), 'col-span-2')}
          ${campo('Nome social', vazio(a.nomeSocial, '—'))}
          ${campo('CPF', `<span class="font-mono">${esc(Clientes.fmtCpf(a.cpf))}</span>`)}
          ${campo('RG', vazio(a.rg, '—'))}
          ${campo('Nascimento', a.nascimento ? `${esc(Clientes.fmtData(a.nascimento))} <span class="text-xs text-slate-400">· ${Clientes.idade(a.nascimento)} anos</span>` : vazio(''))}
          ${campo('Gênero', vazio(a.genero, '—'))}
          ${campo('Escolaridade', vazio(nomeDe(ESCOLARIDADES, a.escolaridade), '—'))}
          ${campo('Profissão', vazio(a.profissao, '—'))}
          ${campo('Como chegou', vazio(nomeDe(ORIGENS, a.origem), '—'))}
        </div>
      </section>
      <section class="${CARTAO}">
        ${cabecalhoSecao('Contato', 'Por onde a escola fala com o aluno (avaliações, boletos, avisos).', 'btn-editar-dados-2')}
        <div class="p-4 grid grid-cols-2 gap-4">
          ${campo('E-mail', vazio(a.email))}
          ${campo('Celular / WhatsApp', vazio(Clientes.fmtTelefone(a.celular)))}
          ${campo('Outro telefone', vazio(Clientes.fmtTelefone(a.telefone), '—'))}
          ${campo('Observações', `<p class="whitespace-pre-line">${vazio(a.observacoes, '—')}</p>`, 'col-span-2')}
        </div>
      </section>
      ${cartaoFinanceiro('aluno', a, financeiroDoAluno(a))}
      ${cob.quemPaga}
      ${cob.endereco}
      ${vin.empresa}
      ${vin.lgpd}
      ${cartaoNecessidades(a)}
    </div>`;
  document.getElementById('btn-editar-dados').addEventListener('click', () => abrirDrawerAluno(a.id));
  document.getElementById('btn-editar-dados-2').addEventListener('click', () => abrirDrawerAluno(a.id));
  document.getElementById('btn-editar-necessidades').addEventListener('click', () => abrirDrawerNecessidades());
  cob.ligar(); vin.ligar();
}

function faixaNecessidades(a) {
  if (!Clientes.temNecessidades(a)) return '';
  const n = a.necessidades;
  return `
    <div class="mb-4 flex items-start gap-3 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-950/40 px-4 py-3 text-sm text-fuchsia-900 dark:text-fuchsia-200">
      <span class="shrink-0 text-fuchsia-600 dark:text-fuchsia-400">${ICONE.acessibilidade}</span>
      <div><span class="font-medium">Necessidades específicas:</span> ${n.tipos.map((t) => esc(nomeNecessidade(t))).join(' · ') || esc(n.detalhes)}${n.atendimento ? ` — <span class="opacity-80">${esc(n.atendimento)}</span>` : ''}</div>
    </div>`;
}

function cartaoNecessidades(a) {
  const n = a.necessidades;
  const tem = Clientes.temNecessidades(a);
  return `
      <section class="${CARTAO}">
        ${cabecalhoSecao('Necessidades e acessibilidade', 'PCD, saúde, aprendizagem — o que a turma e o instrutor precisam saber. Dado sensível (LGPD).', 'btn-editar-necessidades', tem ? 'Editar' : 'Informar')}
        <div class="p-4">
          ${tem ? `
          <div class="flex flex-wrap gap-1.5 mb-4">${n.tipos.map((t) => pilula(PILULA.rosa, nomeNecessidade(t), TIPOS_NECESSIDADE.find((x) => x.id === t)?.descricao ?? '')).join('')}</div>
          <div class="grid grid-cols-1 gap-4">
            ${campo('Detalhes', `<p class="whitespace-pre-line">${vazio(n.detalhes, '—')}</p>`)}
            ${campo('Como atender (sala, material, avaliação)', `<p class="whitespace-pre-line">${vazio(n.atendimento, '—')}</p>`)}
          </div>` : '<p class="text-sm text-slate-500 dark:text-neutral-400">Nenhuma necessidade específica informada.</p>'}
        </div>
      </section>`;
}

function cartoesCobrancaAluno(a) {
  const emp = empresaDe(a.empresaId);
  const r = a.responsavel;
  const fin = Clientes.responsavelFinanceiroDoAluno(estado.dados, a.id);
  const pagadorHtml = {
    proprio: `<p class="text-sm text-slate-700 dark:text-neutral-200">Contrato e boleto em nome de <strong>${esc(a.nome)}</strong>, CPF ${esc(Clientes.fmtCpf(a.cpf))}, no endereço ao lado.</p>${Clientes.menorDeIdade(a.nascimento) ? '<p class="text-sm text-amber-700 dark:text-amber-400 mt-2">Aluno menor de idade — o contrato precisa de um responsável.</p>' : ''}`,
    terceiro: `
      <div class="grid grid-cols-2 gap-4">
        ${campo('Responsável financeiro', `${vazio(r.nome)}${fin ? ` <button type="button" id="btn-ir-responsavel" class="${BOTAO_LINK} ml-1">Abrir</button>` : ''}`, 'col-span-2')}
        ${campo('CPF', `<span class="font-mono">${vazio(Clientes.fmtCpf(r.cpf))}</span>`)}
        ${campo('Parentesco', vazio(r.parentesco, '—'))}
        ${campo('E-mail', vazio(r.email))}
        ${campo('Celular', vazio(Clientes.fmtTelefone(r.celular)))}
      </div>
      ${fin ? '' : `<p class="text-sm text-amber-700 dark:text-amber-400 mt-3">Nenhum responsável vinculado com papel financeiro — vincule na aba <button type="button" id="btn-ir-responsaveis" class="${BOTAO_LINK}">Responsáveis</button>.</p>`}`,
    empresa: emp
      ? `<p class="text-sm text-slate-700 dark:text-neutral-200">Contrato e boleto contra <strong>${esc(nomeEmpresa(emp))}</strong> (${esc(Clientes.fmtCnpj(emp.cnpj))}). <button type="button" data-ir-empresa class="${BOTAO_LINK}">Abrir empresa</button></p><p class="text-xs text-slate-500 dark:text-neutral-400 mt-2">Cobrança: ${esc(emp.cobranca.emailCobranca || emp.email || 'sem e-mail')}${emp.cobranca.diaVencimento ? ` · vence dia ${emp.cobranca.diaVencimento}` : ''}${emp.cobranca.exigePedidoCompra ? ' · exige PO' : ''}</p>`
      : '<p class="text-sm text-amber-700 dark:text-amber-400">Quem paga é a empresa, mas o aluno não está vinculado a nenhuma. Vincule no cartão "Empresa" desta aba.</p>',
  }[a.pagador];
  return {
    endereco: `
      <section class="${CARTAO}">
        ${cabecalhoSecao('Endereço', 'Endereço do aluno — vai para o contrato e para o boleto quando ele mesmo paga.', 'btn-editar-cobranca')}
        ${fichaEndereco(a.endereco)}
      </section>`,
    quemPaga: `
      <section class="${CARTAO}">
        ${cabecalhoSecao('Quem paga', 'Define contra quem saem contrato e boleto.', 'btn-editar-cobranca-2')}
        <div class="p-4 space-y-4">
          <div>${pilula(a.pagador === 'empresa' ? PILULA.petrol : a.pagador === 'terceiro' ? PILULA.violeta : PILULA.neutra, nomeDe(PAGADORES, a.pagador), PAGADORES.find((p) => p.id === a.pagador)?.descricao ?? '')}</div>
          ${pagadorHtml}
          ${a.pagador !== 'empresa' ? `
          <div class="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-neutral-900">
            ${campo('Forma preferida', vazio(nomeDe(FORMAS_COBRANCA, a.cobranca.formaPreferida)))}
            ${campo('Dia de vencimento', a.cobranca.diaVencimento ? `Dia ${a.cobranca.diaVencimento}` : vazio(''))}
          </div>` : ''}
        </div>
      </section>`,
    ligar: () => {
      document.getElementById('btn-editar-cobranca').addEventListener('click', () => abrirDrawerEnderecoPagamentoAluno());
      document.getElementById('btn-editar-cobranca-2').addEventListener('click', () => abrirDrawerEnderecoPagamentoAluno());
      document.querySelectorAll('[data-ir-empresa]').forEach((b) => b.addEventListener('click', () => abrir('empresa', a.empresaId)));
      document.getElementById('btn-ir-responsavel')?.addEventListener('click', () => abrir('responsavel', fin.responsavel.id));
      document.getElementById('btn-ir-responsaveis')?.addEventListener('click', () => abrir('aluno', a.id, 'responsaveis'));
    },
  };
}

function cartoesVinculoAluno(a) {
  const emp = empresaDe(a.empresaId);
  const c = a.consentimentos;
  return {
    empresa: `
      <section class="${CARTAO}">
        ${cabecalhoSecao('Empresa', 'Colaborador de uma empresa cliente (in company ou pago pela empresa).', 'btn-editar-vinculo')}
        <div class="p-4">
          ${emp ? `
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 shrink-0 rounded-lg bg-petrol-800/10 dark:bg-sky-950/60 text-petrol-800 dark:text-sky-300 grid place-items-center text-xs font-semibold">${esc(iniciais(nomeEmpresa(emp)))}</div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(nomeEmpresa(emp))} ${pilula(PILULA[emp.status], nomeDe(STATUS_CLIENTE, emp.status))}</p>
              <p class="text-xs text-slate-500 dark:text-neutral-400">${esc(emp.razaoSocial)} · ${esc(Clientes.fmtCnpj(emp.cnpj))}</p>
            </div>
            <button type="button" data-ir-empresa class="${BOTAO_LINK}">Abrir</button>
          </div>
          <div class="mt-4">${campo('Cargo / função', vazio(a.cargo, '—'))}</div>` : '<p class="text-sm text-slate-500 dark:text-neutral-400">Aluno particular — sem empresa vinculada.</p>'}
        </div>
      </section>`,
    lgpd: `
      <section class="${CARTAO}">
        ${cabecalhoSecao('LGPD e consentimentos', 'Registro do aceite do termo e das autorizações.', 'btn-editar-lgpd')}
        <div class="p-4 grid grid-cols-2 gap-4">
          ${campo('Termo de uso e privacidade', c.termoAceiteEm ? `Aceito em ${esc(Clientes.fmtData(c.termoAceiteEm))}` : '<span class="text-amber-700 dark:text-amber-400">ainda não aceito</span>', 'col-span-2')}
          ${campo('Comunicações comerciais', c.comunicacoes ? 'Autorizadas (e-mail/WhatsApp)' : 'Não autorizadas')}
          ${campo('Uso de imagem e depoimento', c.imagem ? 'Autorizado' : 'Não autorizado')}
        </div>
      </section>`,
    // [data-ir-empresa] é ligado por cartoesCobrancaAluno (os dois cartões estão na mesma aba).
    ligar: () => {
      document.getElementById('btn-editar-vinculo').addEventListener('click', () => abrirDrawerVinculoAluno());
      document.getElementById('btn-editar-lgpd').addEventListener('click', () => abrirDrawerConsentimentos());
    },
  };
}

// ---------- Aba Contratos (aluno) ----------
function renderAlunoContratos() {
  const a = atual();
  const lista = Clientes.contratosDetalhadosDoAluno(estado.dados, a.id);
  document.getElementById('acoes-aba').innerHTML = `<a href="contratos.html?novo=1" class="${BOTAO_PRI}">${ICONE.mais} Nova venda</a>`;
  const corVinculo = { aguardando: PILULA.ambar, aprovado: PILULA.ativo, recusado: PILULA.inativo, desistente: PILULA.neutra };
  const linha = ({ contrato: c, ctx, itens, valorAluno, vinculo, pacote }) => {
    const st = Contratos.statusDe(c);
    const sit = Contratos.situacaoCobranca(c);
    const resp = Contratos.responsavelFinanceiro(ctx, c);
    const outros = Contratos.alunoIdsDe(c).filter((id) => id !== a.id).length;
    return `
      <tr>
        <td class="${TD}"><a href="contrato.html?id=${c.id}" class="font-mono text-sm font-medium text-petrol-800 dark:text-sky-300 hover:underline">${esc(c.codigo)}</a><br><span class="text-xs text-slate-400">${esc(Clientes.fmtData(c.criadoEm.slice(0, 10)))}</span></td>
        <td class="${TD}"><span class="font-medium text-slate-800 dark:text-neutral-100">${esc(pacote?.nome ?? 'Pacote removido')}</span><br><span class="text-xs text-slate-400">${[...new Set(itens.map((it) => (it.formacaoId ? `Formação ${Contratos.formacaoDe(ctx, it.formacaoId)?.nome ?? ''}` : Contratos.cursoDe(ctx, it.cursoId)?.nome ?? 'Curso removido')))].map(esc).join(' · ') || 'Sem itens para este aluno'}${vinculo.ajustado ? ' · difere do pacote' : ''}</span></td>
        <td class="${TH}">${pilula(corVinculo[vinculo.situacao] ?? PILULA.neutra, nomeDe(SITUACOES_VINCULO, vinculo.situacao), vinculo.situacao === 'recusado' && vinculo.recusa?.motivo ? `Motivo: ${vinculo.recusa.motivo}` : vinculo.origem === 'link' ? 'Entrou pelo link do pacote' : 'Adicionado pela escola')}</td>
        <td class="${TD}">${c.contratante === 'empresa' ? 'Empresa' : c.contratante === 'particular' ? 'Particular' : '<span class="text-amber-700 dark:text-amber-300">Sem contratante</span>'}${outros > 0 ? `<br><span class="text-xs text-slate-400">+ ${plural(outros, 'outro aluno', 'outros alunos')}</span>` : ''}</td>
        <td class="${TD}">${esc(resp.nome)}<br><span class="text-xs text-slate-400">${resp.tipo === 'terceiro' || resp.tipo === 'responsavel' ? 'responsável financeiro' : resp.tipo === 'empresa' ? 'empresa' : resp.tipo === 'aluno' ? (resp.aluno?.id === a.id ? 'o próprio aluno' : 'outro aluno da venda') : '—'}</span></td>
        <td class="${TD} text-right tabular-nums whitespace-nowrap">${Contratos.fmtMoeda(valorAluno)}<br><span class="text-xs text-slate-400">${plural(itens.length, 'matrícula')}</span></td>
        <td class="${TH}"><div class="flex flex-wrap gap-1.5">${pilula(c.status === 'adm_ok' ? PILULA.ativo : c.status === 'cancelado' ? PILULA.inativo : c.status === 'rascunho' ? PILULA.neutra : c.status === 'aguardando' ? PILULA.ambar : PILULA.petrol, st?.curto ?? st?.nome ?? c.status, st?.descricao)}${sit === 'inadimplente' ? pilula('bg-red-50 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800', 'Inadimplente') : sit === 'recuperante' ? pilula(PILULA.laranja, 'Recuperante') : ''}</div></td>
      </tr>`;
  };
  document.getElementById('conteudo-aba').innerHTML = `
    <p class="text-sm text-slate-600 dark:text-neutral-400 mb-3">Vendas em que este aluno está, seja ele o contratante ou incluído por uma empresa. O valor é só da parte dele; abra a venda para itens, boletos e NF.</p>
    ${tabela(['Venda', 'Pacote', 'Situação na venda', 'Contratante', 'Quem paga', 'Valor do aluno', 'Status'], lista.map(linha), 'Nenhuma venda com este aluno ainda.')}`;
}

// ---------- Drawer genérico ----------

function abrirDrawer(html) {
  const root = document.getElementById('drawer-root');
  root.innerHTML = `
    <div class="fixed inset-0 z-40 flex justify-end">
      <div data-fechar-drawer class="absolute inset-0 bg-slate-900/50 dark:bg-black/70"></div>
      ${html}
    </div>`;
  const origem = document.activeElement;
  const fechar = () => { root.innerHTML = ''; document.removeEventListener('keydown', aoTeclar); devolverFoco(origem); };
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

function drawerFormulario({ id, titulo, subtitulo, corpo, rotulo, largura = 'max-w-md', aoSalvar, foco }) {
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
  if (foco) form.querySelector(foco)?.focus();
  return { form, fechar };
}

// Mesma API do drawerFormulario, mas centralizado (cadastro principal de aluno/empresa).
function modalFormulario({ id, titulo, subtitulo, corpo, rotulo, largura = 'max-w-2xl', aoSalvar, foco }) {
  const root = abrirModal(`
    <form id="${id}" novalidate class="flex flex-col max-h-[calc(100vh-2rem)]">
      <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
        <div>
          <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h3>
          <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${subtitulo}</p>
        </div>
        <button type="button" data-fechar-modal class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${ICONE.fechar}</button>
      </div>
      <div class="flex-1 overflow-y-auto px-5 py-4 space-y-5">${corpo}</div>
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
  if (foco) form.querySelector(foco)?.focus();
  return { form, fechar: fecharModal };
}

const campoTexto = (name, rotulo, valor, { tipo = 'text', placeholder = '', max = '', extra = '', opcional = false, mascara = '' } = {}) => `
  <div>
    <label class="rotulo" for="f-${name.replace('.', '-')}">${rotulo} ${opcional ? OPCIONAL : ''}</label>
    <input id="f-${name.replace('.', '-')}" name="${name}" type="${tipo}" ${max ? `maxlength="${max}"` : ''} ${extra} ${mascara ? `data-mascara="${mascara}"` : ''} class="campo" placeholder="${esc(placeholder)}" value="${esc(valor ?? '')}">
    ${ERRO(name)}
  </div>`;

const campoArea = (name, rotulo, valor, { rows = 3, placeholder = '', max = '', opcional = false } = {}) => `
  <div>
    <label class="rotulo" for="f-${name}">${rotulo} ${opcional ? OPCIONAL : ''}</label>
    <textarea id="f-${name}" name="${name}" rows="${rows}" ${max ? `maxlength="${max}"` : ''} class="campo resize-y" placeholder="${esc(placeholder)}">${esc(valor ?? '')}</textarea>
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

const campoSwitch = (name, rotulo, descricao, marcado) => `
  <label class="flex items-center justify-between gap-3 cursor-pointer">
    <span><span class="text-sm font-medium text-slate-800 dark:text-neutral-100">${rotulo}</span><br><span class="text-xs text-slate-500 dark:text-neutral-400">${descricao}</span></span>
    <input type="checkbox" name="${name}" class="${CHECK}" ${marcado ? 'checked' : ''}>
  </label>`;

const cartoesRadio = (name, opcoes, valor, colunas = 'grid-cols-3') => `
  <div class="grid ${colunas} gap-2">
    ${opcoes.map((o) => `
    <label class="${CARTAO_OPCAO}">
      <input type="radio" name="${name}" value="${o.id}" class="sr-only" ${valor === o.id ? 'checked' : ''}>
      <p class="text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(o.nome)}</p>
      ${o.descricao ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(o.descricao)}</p>` : ''}
    </label>`).join('')}
  </div>`;

// Bloco de endereço (mesmo para empresa e aluno).
const camposEndereco = (e) => `
  <fieldset class="space-y-3">
    <legend class="rotulo">Endereço</legend>
    <div class="grid grid-cols-3 gap-3">
      ${campoTexto('cep', 'CEP', Clientes.fmtCep(e.cep), { placeholder: '00000-000', extra: 'inputmode="numeric"' })}
      <div class="col-span-2">${campoSelect('uf', 'UF', UFS.map((u) => ({ id: u, nome: u })), e.uf)}</div>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div class="col-span-2">${campoTexto('logradouro', 'Logradouro', e.logradouro, { placeholder: 'Rua, avenida…', max: 120 })}</div>
      ${campoTexto('numero', 'Número', e.numero, { max: 10 })}
    </div>
    <div class="grid grid-cols-2 gap-3">
      ${campoTexto('complemento', 'Complemento', e.complemento, { opcional: true, max: 60 })}
      ${campoTexto('bairro', 'Bairro', e.bairro, { max: 60 })}
    </div>
    ${campoTexto('cidade', 'Cidade', e.cidade, { max: 80 })}
  </fieldset>`;

const enderecoDe = (fd) => ({ cep: fd.get('cep'), logradouro: fd.get('logradouro'), numero: fd.get('numero'), complemento: fd.get('complemento'), bairro: fd.get('bairro'), cidade: fd.get('cidade'), uf: fd.get('uf') });

// ---------- Drawers de empresa ----------

function abrirDrawerEmpresa(id = null) {
  const e = id ? Clientes.porId(estado.dados.empresas, id) : null;
  const d = e ?? { razaoSocial: '', nomeFantasia: '', cnpj: '', inscricaoEstadual: '', site: '', porte: null, segmento: null, origem: null, email: '', telefone: '', observacoes: '', status: null };
  modalFormulario({
    id: 'form-empresa',
    titulo: e ? 'Editar empresa' : 'Nova empresa',
    subtitulo: e ? 'Identificação e contato geral.' : 'Só o essencial. Endereço, cobrança, pessoas de contato e alunos você completa depois.',
    rotulo: e ? 'Salvar alterações' : 'Criar empresa',
    largura: 'max-w-2xl',
    foco: '#f-cnpj',
    corpo: `
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('cnpj', 'CNPJ', Clientes.fmtCnpj(d.cnpj), { placeholder: '00.000.000/0000-00', max: 18, mascara: 'cnpj' })}
        ${campoTexto('inscricaoEstadual', 'Inscrição estadual', d.inscricaoEstadual, { opcional: true, placeholder: 'ou "Isento"', max: 20 })}
      </div>
      ${campoTexto('razaoSocial', 'Razão social', d.razaoSocial, { placeholder: 'Como consta no CNPJ', max: 150 })}
      ${campoTexto('nomeFantasia', 'Nome fantasia', d.nomeFantasia, { opcional: true, placeholder: 'Como todo mundo chama', max: 80 })}
      <div class="grid grid-cols-2 gap-3">
        ${campoSelect('segmento', 'Segmento', SEGMENTOS, d.segmento, { opcional: true })}
        ${campoSelect('porte', 'Porte', PORTES, d.porte, { opcional: true })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('email', 'E-mail geral', d.email, { tipo: 'email', opcional: true, max: 120 })}
        ${campoTexto('telefone', 'Telefone', Clientes.fmtTelefone(d.telefone), { opcional: true, placeholder: '(47) 0000-0000', extra: 'inputmode="tel"' })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('site', 'Site', d.site, { opcional: true, placeholder: 'empresa.com.br', max: 80 })}
        ${campoSelect('origem', 'Como chegou', ORIGENS, d.origem, { opcional: true })}
      </div>
      ${campoArea('observacoes', 'Observações', d.observacoes, { rows: 2, max: 500, opcional: true })}
      ${e ? `<fieldset><legend class="rotulo">Status</legend>${cartoesRadio('status', STATUS_CLIENTE, d.status, 'grid-cols-2')}${ERRO('status')}</fieldset>` : ''}`,
    aoSalvar: (fd) => {
      const novo = Object.fromEntries(fd);
      if (!e) delete novo.status;
      const erros = Clientes.validarEmpresa(novo, estado.dados.empresas, id);
      if (erros.length) return erros;
      if (e) {
        estado.dados = Clientes.atualizarDadosEmpresa(estado.dados, id, novo);
        persistir(); renderEmpresa();
        toast(`"${novo.nomeFantasia || novo.razaoSocial}" atualizada.`);
      } else {
        const r = Clientes.incluirEmpresa(estado.dados, novo);
        estado.dados = r.dados;
        persistir();
        toast(`"${nomeEmpresa(r.empresa)}" criada.`);
        sessionStorage.setItem('clientes-abrir-link', r.empresa.id);
        abrir('empresa', r.empresa.id, 'dados');
      }
    },
  });
}

function abrirDrawerEnderecoCobrancaEmpresa() {
  const e = atual();
  const k = e.cobranca;
  drawerFormulario({
    id: 'form-cobranca-empresa',
    titulo: 'Endereço e cobrança',
    subtitulo: `Em <strong>${esc(nomeEmpresa(e))}</strong> · dados fiscais para contrato, boleto e NF.`,
    rotulo: 'Salvar alterações',
    largura: 'max-w-lg',
    foco: '#f-cep',
    corpo: `
      ${camposEndereco(e.endereco)}
      <fieldset class="space-y-4">
        <legend class="rotulo">Cobrança e faturamento</legend>
        ${campoTexto('emailCobranca', 'E-mail de cobrança / NF', k.emailCobranca, { tipo: 'email', placeholder: e.email || 'financeiro@empresa.com.br', max: 120 })}
        <div class="grid grid-cols-2 gap-3">
          ${campoSelect('formaPreferida', 'Forma preferida', FORMAS_COBRANCA, k.formaPreferida, { opcional: true })}
          ${campoTexto('diaVencimento', 'Dia de vencimento', k.diaVencimento, { tipo: 'number', opcional: true, extra: 'min="1" max="31" step="1"' })}
        </div>
        ${campoSwitch('exigePedidoCompra', 'Exige pedido de compra (PO)', 'A NF só pode ser emitida com o número do pedido.', k.exigePedidoCompra)}
        ${campoArea('observacoes', 'Observações de faturamento', k.observacoes, { rows: 2, max: 300, opcional: true, placeholder: 'Ex.: pagamento em 45 dias; NF citar o PO' })}
      </fieldset>`,
    aoSalvar: (fd) => {
      const endereco = enderecoDe(fd);
      const cobranca = { emailCobranca: fd.get('emailCobranca'), formaPreferida: fd.get('formaPreferida'), diaVencimento: fd.get('diaVencimento'), exigePedidoCompra: fd.has('exigePedidoCompra'), observacoes: fd.get('observacoes') };
      const erros = [...Clientes.validarEndereco(endereco), ...Clientes.validarCobrancaEmpresa(cobranca)];
      if (erros.length) return erros;
      estado.dados = Clientes.atualizarEnderecoCobrancaEmpresa(estado.dados, e.id, { endereco, cobranca });
      persistir(); renderEmpresa();
      toast('Endereço e cobrança atualizados.');
    },
  });
}

function abrirDrawerContato(contatoId = null) {
  const e = atual();
  const c = contatoId ? e.contatos.find((x) => x.id === contatoId) : null;
  const d = c ?? { nome: '', papel: null, cargo: '', email: '', celular: '', principal: e.contatos.length === 0 };
  drawerFormulario({
    id: 'form-contato',
    titulo: c ? 'Editar contato' : 'Novo contato',
    subtitulo: `Em <strong>${esc(nomeEmpresa(e))}</strong> · pessoa com quem a ProWay fala.`,
    rotulo: c ? 'Salvar alterações' : 'Adicionar contato',
    foco: '#f-nome',
    corpo: `
      ${campoTexto('nome', 'Nome', d.nome, { max: 100 })}
      ${campoTexto('cargo', 'Cargo', d.cargo, { opcional: true, max: 80 })}
      <fieldset><legend class="rotulo">Papel</legend>${cartoesRadio('papel', PAPEIS_CONTATO, d.papel, 'grid-cols-2')}${ERRO('papel')}</fieldset>
      ${campoTexto('email', 'E-mail', d.email, { tipo: 'email', max: 120 })}
      ${campoTexto('celular', 'Celular / WhatsApp', Clientes.fmtTelefone(d.celular), { opcional: true, placeholder: '(47) 90000-0000', extra: 'inputmode="tel"' })}
      ${campoSwitch('principal', 'Contato principal', 'Aparece na lista e recebe as comunicações da turma.', d.principal)}`,
    aoSalvar: (fd) => {
      const novo = { nome: fd.get('nome'), cargo: fd.get('cargo'), papel: fd.get('papel'), email: fd.get('email'), celular: fd.get('celular'), principal: fd.has('principal') };
      const erros = Clientes.validarContato(novo);
      if (erros.length) return erros;
      estado.dados = Clientes.salvarContato(estado.dados, e.id, contatoId, novo);
      persistir(); renderEmpresa();
      toast(`${novo.nome.trim()} ${c ? 'atualizado.' : 'adicionado aos contatos.'}`);
    },
  });
}

function confirmarExclusaoEmpresa(id) {
  const e = Clientes.porId(estado.dados.empresas, id);
  const alunos = Clientes.alunosDaEmpresa(estado.dados.alunos, id);
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800"><h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Excluir empresa</h3></div>
    <div class="px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 space-y-2">
      <p>Excluir <strong>${esc(nomeEmpresa(e))}</strong> (${esc(Clientes.fmtCnpj(e.cnpj))}) com ${plural(e.contatos.length, 'contato')}?</p>
      ${alunos.length ? `<p class="text-slate-500 dark:text-neutral-400">${plural(alunos.length, 'aluno')} vinculado${alunos.length === 1 ? '' : 's'} (${alunos.map((a) => esc(a.nome)).join(', ')}) continua${alunos.length === 1 ? '' : 'm'} cadastrado${alunos.length === 1 ? '' : 's'}, como particulares.</p>` : ''}
      <p class="text-slate-500 dark:text-neutral-400">Sem histórico de turmas, por isso pode ser excluída. Para só parar de vender, prefira <em>inativar</em>.</p>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
      <button type="button" id="btn-confirmar" class="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition">Excluir</button>
    </div>`);
  root.querySelector('#btn-confirmar').addEventListener('click', () => {
    estado.dados = Clientes.removerEmpresa(estado.dados, id);
    persistir(); fecharModal();
    toast(`"${nomeEmpresa(e)}" excluída.`);
    abrir('empresas', null);
  });
}

// Modal: vincular alunos já cadastrados (sem empresa) a esta empresa.
function abrirSeletorAlunos() {
  const e = atual();
  const disponiveis = estado.dados.alunos.filter((a) => !a.empresaId && a.status === 'ativo').sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR'));
  const marcados = new Set();
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
      <div>
        <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Vincular alunos</h3>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Alunos já cadastrados, sem empresa, que passam a ser colaboradores de <strong>${esc(nomeEmpresa(e))}</strong>. Quem paga não muda — ajuste no aluno se a empresa for pagar.</p>
      </div>
      <button type="button" data-fechar-modal class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${ICONE.fechar}</button>
    </div>
    <div class="px-5 pt-4 pb-2 flex items-center gap-2">
      ${busca('busca-sel', '', 'Buscar aluno', 'flex-1')}
      <button type="button" id="btn-marcar" class="${BOTAO_SEC} shrink-0"></button>
    </div>
    <div id="lista-sel" class="max-h-96 overflow-y-auto px-3 pb-2"></div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-2">
      <span id="resumo-sel" class="text-xs text-slate-500 dark:text-neutral-400 tabular-nums"></span>
      <div class="flex items-center gap-2">
        <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
        <button type="button" id="btn-confirmar-sel" class="${BOTAO_PRI}" disabled></button>
      </div>
    </div>`, 'max-w-2xl');
  const lista = root.querySelector('#lista-sel');
  const campoBusca = root.querySelector('#busca-sel');
  const btnMarcar = root.querySelector('#btn-marcar');
  const btnConfirmar = root.querySelector('#btn-confirmar-sel');
  const resumo = root.querySelector('#resumo-sel');
  let visiveis = [];
  const rodape = () => {
    const n = marcados.size;
    btnConfirmar.disabled = n === 0;
    btnConfirmar.textContent = n ? `Vincular ${plural(n, 'aluno')}` : 'Vincular';
    resumo.textContent = n ? `${n} de ${disponiveis.length} selecionados` : `${plural(disponiveis.length, 'aluno')} sem empresa`;
    const todos = visiveis.length > 0 && visiveis.every((a) => marcados.has(a.id));
    btnMarcar.disabled = visiveis.length === 0;
    btnMarcar.textContent = todos ? 'Desmarcar todos' : `Marcar ${campoBusca.value ? 'encontrados' : 'todos'}`;
  };
  const render = () => {
    const termo = Clientes.normalizar(campoBusca.value);
    visiveis = disponiveis.filter((a) => !termo || Clientes.normalizar(`${a.nome} ${a.email} ${a.cpf}`).includes(termo));
    lista.innerHTML = visiveis.length ? visiveis.map((a) => `
      <label class="flex items-center gap-3 rounded-lg px-2 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-neutral-900 ${marcados.has(a.id) ? 'bg-petrol-800/5 dark:bg-sky-950/40' : ''}">
        <input type="checkbox" data-marcar="${a.id}" class="${CHECK}" ${marcados.has(a.id) ? 'checked' : ''}>
        <span class="min-w-0 flex-1">
          <span class="block text-sm text-slate-800 dark:text-neutral-100 truncate">${esc(a.nome)}</span>
          <span class="block text-xs text-slate-500 dark:text-neutral-400 truncate">${esc(Clientes.fmtCpf(a.cpf))} · ${esc(a.email || 'sem e-mail')}${a.profissao ? ` · ${esc(a.profissao)}` : ''}</span>
        </span>
      </label>`).join('') : `<p class="px-2 py-4 text-sm text-slate-500 dark:text-neutral-400">${campoBusca.value ? 'Nenhum resultado.' : 'Todos os alunos ativos já têm empresa. Use "Novo aluno".'}</p>`;
    lista.querySelectorAll('[data-marcar]').forEach((ch) => ch.addEventListener('change', () => { ch.checked ? marcados.add(ch.dataset.marcar) : marcados.delete(ch.dataset.marcar); ch.closest('label').classList.toggle('bg-petrol-800/5', ch.checked); ch.closest('label').classList.toggle('dark:bg-sky-950/40', ch.checked); rodape(); }));
    rodape();
  };
  btnMarcar.addEventListener('click', () => { const todos = visiveis.every((a) => marcados.has(a.id)); visiveis.forEach((a) => (todos ? marcados.delete(a.id) : marcados.add(a.id))); render(); });
  btnConfirmar.addEventListener('click', () => {
    const ids = [...marcados];
    estado.dados = Clientes.vincularAlunos(estado.dados, e.id, ids);
    persistir(); fecharModal(); renderEmpresa();
    toast(`${plural(ids.length, 'aluno')} vinculado${ids.length === 1 ? '' : 's'} a ${nomeEmpresa(e)}.`);
  });
  campoBusca.addEventListener('input', render);
  render();
  campoBusca.focus();
}

// ---------- Drawers de aluno ----------

function abrirDrawerAluno(id = null, empresaId = null) {
  const a = id ? Clientes.porId(estado.dados.alunos, id) : null;
  const emp = empresaId ? empresaDe(empresaId) : null;
  const d = a ?? { nome: '', nomeSocial: '', cpf: '', rg: '', nascimento: '', genero: '', profissao: '', escolaridade: null, origem: emp ? 'empresa' : null, email: '', celular: '', telefone: '', observacoes: '', status: null };
  modalFormulario({
    id: 'form-aluno',
    titulo: a ? 'Editar aluno' : emp ? `Novo aluno de ${esc(nomeEmpresa(emp))}` : 'Novo aluno',
    subtitulo: a ? 'Identificação e contato.' : emp ? 'Entra vinculado à empresa, com "quem paga = empresa". Endereço e LGPD você completa depois.' : 'Só o essencial. Endereço, quem paga e LGPD você completa depois.',
    rotulo: a ? 'Salvar alterações' : 'Criar aluno',
    largura: 'max-w-2xl',
    foco: '#f-nome',
    corpo: `
      ${campoTexto('nome', 'Nome completo', d.nome, { placeholder: 'Como consta no documento', max: 120 })}
      ${campoTexto('nomeSocial', 'Nome social', d.nomeSocial, { opcional: true, placeholder: 'Como prefere ser chamado(a)', max: 80 })}
      <div class="grid grid-cols-3 gap-3">
        ${campoTexto('cpf', 'CPF', Clientes.fmtCpf(d.cpf), { placeholder: '000.000.000-00', max: 14, mascara: 'cpf' })}
        ${campoTexto('rg', 'RG', d.rg, { opcional: true, max: 20 })}
        ${campoTexto('nascimento', 'Nascimento', d.nascimento, { tipo: 'date' })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('email', 'E-mail', d.email, { tipo: 'email', max: 120 })}
        ${campoTexto('celular', 'Celular / WhatsApp', Clientes.fmtTelefone(d.celular), { placeholder: '(47) 90000-0000', extra: 'inputmode="tel"' })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('telefone', 'Outro telefone', Clientes.fmtTelefone(d.telefone), { opcional: true, extra: 'inputmode="tel"' })}
        ${campoSelect('genero', 'Gênero', [{ id: 'feminino', nome: 'Feminino' }, { id: 'masculino', nome: 'Masculino' }, { id: 'outro', nome: 'Outro / prefiro não informar' }], d.genero, { opcional: true })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('profissao', 'Profissão', d.profissao, { opcional: true, max: 80 })}
        ${campoSelect('escolaridade', 'Escolaridade', ESCOLARIDADES, d.escolaridade, { opcional: true })}
      </div>
      ${emp ? `${campoTexto('cargo', 'Cargo na empresa', '', { opcional: true, max: 80 })}<input type="hidden" name="empresaId" value="${emp.id}">` : campoSelect('origem', 'Como chegou', ORIGENS, d.origem, { opcional: true })}
      ${campoArea('observacoes', 'Observações', d.observacoes, { rows: 2, max: 500, opcional: true })}
      ${a ? `<fieldset><legend class="rotulo">Status</legend>${cartoesRadio('status', STATUS_CLIENTE, d.status, 'grid-cols-2')}${ERRO('status')}</fieldset>` : ''}`,
    aoSalvar: (fd) => {
      const novo = Object.fromEntries(fd);
      if (!a) delete novo.status;
      if (emp) novo.origem = 'empresa';
      const erros = Clientes.validarAluno(novo, estado.dados.alunos, id);
      if (erros.length) return erros;
      if (a) {
        estado.dados = Clientes.atualizarDadosAluno(estado.dados, id, novo);
        persistir(); renderAluno();
        toast(`${novo.nome.trim()} atualizado.`);
      } else {
        const r = Clientes.incluirAluno(estado.dados, novo);
        estado.dados = r.dados;
        persistir();
        toast(`${r.aluno.nome} criado${emp ? ` e vinculado a ${nomeEmpresa(emp)}` : ''}.`);
        sessionStorage.setItem('clientes-abrir-link', r.aluno.id);
        abrir('aluno', r.aluno.id, 'dados');
      }
    },
  });
}

function abrirDrawerEnderecoPagamentoAluno() {
  const a = atual();
  const emp = empresaDe(a.empresaId);
  const vinculados = Clientes.responsaveisDoAluno(estado.dados, a.id);
  const fin = Clientes.responsavelFinanceiroDoAluno(estado.dados, a.id);
  const { form } = drawerFormulario({
    id: 'form-pagamento-aluno',
    titulo: 'Endereço e quem paga',
    subtitulo: `Em <strong>${esc(a.nome)}</strong> · define contra quem saem contrato e boleto.`,
    rotulo: 'Salvar alterações',
    largura: 'max-w-lg',
    foco: '#f-cep',
    corpo: `
      ${camposEndereco(a.endereco)}
      <fieldset>
        <legend class="rotulo">Quem paga</legend>
        ${cartoesRadio('pagador', PAGADORES.map((p) => (p.id === 'empresa' && !emp ? { ...p, descricao: 'Vincule a uma empresa antes (aba Empresa e LGPD).' } : p)), a.pagador, 'grid-cols-1')}
        ${ERRO('pagador')}
      </fieldset>
      <fieldset id="bloco-responsavel" class="space-y-3 ${a.pagador === 'terceiro' ? '' : 'hidden'}">
        <legend class="rotulo">Responsável financeiro</legend>
        ${vinculados.length
          ? `${campoSelect('responsavelId', 'Quem paga', vinculados.map(({ responsavel: x, vinculo: v }) => ({ id: x.id, nome: `${x.nome} · ${nomeDe(PARENTESCOS, v.parentesco) || 'responsável'} · ${Clientes.fmtCpf(x.cpf)}` })), fin?.responsavel.id ?? null)}
             <p class="text-xs text-slate-500 dark:text-neutral-400">Contrato e boleto saem no nome dele. Para cadastrar outra pessoa, use a aba Responsáveis.</p>`
          : `<p class="text-sm text-amber-700 dark:text-amber-400">O aluno ainda não tem responsáveis vinculados. Cadastre/vincule na aba <strong>Responsáveis</strong> e volte aqui.</p><input type="hidden" name="responsavelId" value="">${ERRO('responsavelId')}`}
      </fieldset>
      <fieldset id="bloco-cobranca" class="${a.pagador === 'empresa' ? 'hidden' : ''}">
        <legend class="rotulo">Cobrança</legend>
        <div class="grid grid-cols-2 gap-3">
          ${campoSelect('cobranca.formaPreferida', 'Forma preferida', FORMAS_COBRANCA, a.cobranca.formaPreferida, { opcional: true })}
          ${campoTexto('cobranca.diaVencimento', 'Dia de vencimento', a.cobranca.diaVencimento, { tipo: 'number', opcional: true, extra: 'min="1" max="31" step="1"' })}
        </div>
      </fieldset>`,
    aoSalvar: (fd) => {
      const dados = {
        endereco: enderecoDe(fd), pagador: fd.get('pagador'), empresaId: a.empresaId,
        responsavelId: fd.get('responsavelId') ?? '',
        cobranca: { formaPreferida: fd.get('cobranca.formaPreferida'), diaVencimento: fd.get('cobranca.diaVencimento') },
      };
      const erros = [...Clientes.validarEndereco(dados.endereco), ...Clientes.validarPagamentoAluno(dados)];
      if (erros.length) return erros;
      estado.dados = Clientes.atualizarEnderecoCobrancaAluno(estado.dados, a.id, dados);
      persistir(); renderAluno();
      toast('Endereço e pagamento atualizados.');
    },
  });
  form.querySelectorAll('[name="pagador"]').forEach((rd) => rd.addEventListener('change', () => {
    form.querySelector('#bloco-responsavel').classList.toggle('hidden', rd.value !== 'terceiro');
    form.querySelector('#bloco-cobranca').classList.toggle('hidden', rd.value === 'empresa');
  }));
}

function abrirDrawerVinculoAluno() {
  const a = atual();
  const empresas = [...estado.dados.empresas].sort((x, y) => nomeEmpresa(x).localeCompare(nomeEmpresa(y), 'pt-BR')).map((e) => ({ id: e.id, nome: `${nomeEmpresa(e)} · ${Clientes.fmtCnpj(e.cnpj)}` }));
  drawerFormulario({
    id: 'form-vinculo',
    titulo: 'Empresa do aluno',
    subtitulo: `Em <strong>${esc(a.nome)}</strong> · deixe em branco para aluno particular.`,
    rotulo: 'Salvar alterações',
    foco: '#f-empresaId',
    corpo: `
      ${campoSelect('empresaId', 'Empresa', empresas, a.empresaId, { opcional: true })}
      ${campoTexto('cargo', 'Cargo / função', a.cargo, { opcional: true, max: 80 })}
      <p class="text-xs text-slate-500 dark:text-neutral-400">Ao desvincular, se quem pagava era a empresa, o aluno passa a pagar como particular. Quem paga é ajustado em "Endereço e pagamento".</p>`,
    aoSalvar: (fd) => {
      const empresaId = fd.get('empresaId') || null;
      estado.dados = Clientes.vincularEmpresa(estado.dados, a.id, empresaId, fd.get('cargo'));
      persistir(); renderAluno();
      toast(empresaId ? `${a.nome} vinculado a ${nomeEmpresa(empresaDe(empresaId))}.` : `${a.nome} agora é aluno particular.`);
    },
  });
}

function abrirDrawerConsentimentos() {
  const a = atual();
  const c = a.consentimentos;
  drawerFormulario({
    id: 'form-lgpd',
    titulo: 'LGPD e consentimentos',
    subtitulo: `Em <strong>${esc(a.nome)}</strong> · em produção isso vem do aceite do próprio aluno (link/app).`,
    rotulo: 'Salvar alterações',
    corpo: `
      ${campoTexto('termoAceiteEm', 'Termo aceito em', c.termoAceiteEm, { tipo: 'date', opcional: true })}
      ${campoSwitch('comunicacoes', 'Comunicações comerciais', 'Autoriza e-mail e WhatsApp com novidades e ofertas.', c.comunicacoes)}
      ${campoSwitch('imagem', 'Uso de imagem e depoimento', 'Autoriza usar foto/depoimento no site e redes.', c.imagem)}`,
    aoSalvar: (fd) => {
      estado.dados = Clientes.atualizarConsentimentos(estado.dados, a.id, { termoAceiteEm: fd.get('termoAceiteEm'), comunicacoes: fd.has('comunicacoes'), imagem: fd.has('imagem') });
      persistir(); renderAluno();
      toast('Consentimentos atualizados.');
    },
  });
}

function abrirDrawerDevedor(tipo, id, rerender) {
  const x = tipo === 'empresa' ? empresaDe(id) : Clientes.porId(estado.dados.alunos, id);
  const i = x.inadimplencia;
  const nome = tipo === 'empresa' ? nomeEmpresa(x) : x.nome;
  drawerFormulario({
    id: 'form-devedor',
    titulo: i.devedor ? 'Editar situação de devedor' : 'Marcar como devedor',
    subtitulo: `<strong>${esc(nome)}</strong> passa a aparecer com o selo <span class="font-medium text-red-700 dark:text-red-400">Devedor</span> na lista e no cadastro.`,
    rotulo: i.devedor ? 'Salvar alterações' : 'Marcar devedor',
    foco: '#f-motivo',
    corpo: `
      ${campoSelect('motivo', 'Motivo', MOTIVOS_INADIMPLENCIA, i.motivo)}
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('desde', 'Devedor desde', i.desde, { tipo: 'date' })}
        ${campoTexto('valor', 'Valor em aberto (R$)', i.valor ?? '', { tipo: 'number', opcional: true, placeholder: '0,00', extra: 'min="0" step="0.01"' })}
      </div>
      ${campoArea('observacoes', 'Observações', i.observacoes, { rows: 3, max: 500, opcional: true, placeholder: 'Boletos, acordos, contato com o financeiro…' })}`,
    aoSalvar: (fd) => {
      const novo = Object.fromEntries(fd);
      const erros = Clientes.validarInadimplencia(novo);
      if (erros.length) return erros;
      estado.dados = Clientes.marcarDevedor(estado.dados, tipo, id, novo);
      persistir(); rerender();
      toast(`${nome} marcado como devedor.`);
    },
  });
}

function abrirDrawerNecessidades() {
  const a = atual();
  const n = a.necessidades;
  drawerFormulario({
    id: 'form-necessidades',
    titulo: 'Necessidades e acessibilidade',
    subtitulo: `De <strong>${esc(a.nome)}</strong> · dado sensível: só quem monta turma e o instrutor veem.`,
    rotulo: 'Salvar',
    largura: 'max-w-lg',
    corpo: `
      <fieldset>
        <legend class="rotulo">Tipo</legend>
        <div class="grid grid-cols-1 gap-1.5">
          ${TIPOS_NECESSIDADE.map((t) => `
          <label class="${CARTAO_OPCAO} flex items-start gap-3 py-2">
            <input type="checkbox" name="tipos" value="${t.id}" class="${CHECK} mt-0.5" ${n.tipos.includes(t.id) ? 'checked' : ''}>
            <span><span class="text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(t.nome)}</span><br><span class="text-xs text-slate-500 dark:text-neutral-400">${esc(t.descricao)}</span></span>
          </label>`).join('')}
        </div>
      </fieldset>
      ${campoArea('detalhes', 'Detalhes', n.detalhes, { rows: 2, max: 500, opcional: true, placeholder: 'Diagnóstico, laudo, medicação, o que fazer em emergência…' })}
      ${campoArea('atendimento', 'Como atender', n.atendimento, { rows: 2, max: 500, opcional: true, placeholder: 'Sala acessível, tempo extra, intérprete, sentar na frente…' })}`,
    aoSalvar: (fd) => {
      const novo = { tipos: fd.getAll('tipos'), detalhes: fd.get('detalhes'), atendimento: fd.get('atendimento') };
      const erros = Clientes.validarNecessidades(novo);
      if (erros.length) return erros;
      estado.dados = Clientes.atualizarNecessidades(estado.dados, a.id, novo);
      persistir(); renderAluno();
      toast('Necessidades atualizadas.');
    },
  });
}

// ---------- Links públicos (aluno / empresa) ----------

const linhaLink = (id, rotulo, descricao, u) => `
      <div>
        <label class="rotulo" for="${id}">${rotulo} <span class="normal-case font-normal tracking-normal text-slate-400">· ${descricao}</span></label>
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

// ---------- Link para o aluno preencher o cadastro ----------

function faixaConvite(a) {
  if (!a.convite) return '';
  if (a.convite.preenchidoEm) return '';
  return `
    <div class="mb-4 flex items-center gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-4 py-2.5 text-sm text-amber-900 dark:text-amber-200">
      <span class="shrink-0 text-amber-600 dark:text-amber-400">${ICONE.alerta}</span>
      <div class="flex-1"><span class="font-medium">Aguardando o aluno preencher o cadastro</span> — link gerado em ${esc(Clientes.fmtData(a.convite.criadoEm))}.</div>
      <button type="button" id="btn-faixa-link" class="${BOTAO_LINK}">Ver link</button>
    </div>`;
}

function abrirModalLinkAluno(alunoId, rerender = renderAluno) {
  let a = Clientes.porId(estado.dados.alunos, alunoId);
  if (!a.convite) {
    estado.dados = Clientes.gerarConvite(estado.dados, alunoId);
    persistir(); a = Clientes.porId(estado.dados.alunos, alunoId);
    rerender();
  }
  const url = Clientes.urlConvite(a, 'formulario');
  const urlPassos = Clientes.urlConvite(a, 'passos');
  const preenchido = Boolean(a.convite.preenchidoEm);
  const msg = `Olá, ${a.nome.split(' ')[0]}! Para concluir sua matrícula na ProWay, preencha seus dados neste link: ${url}`;
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
      <div>
        <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Link para o aluno preencher o cadastro</h3>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(a.nome)} abre o link, confere o que já foi digitado e completa endereço, quem paga, necessidades e aceite LGPD.</p>
      </div>
      <button type="button" data-fechar-modal class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${ICONE.fechar}</button>
    </div>
    <div class="px-5 py-4 space-y-4">
      ${preenchido
        ? `<div class="flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-200"><span class="text-emerald-600 dark:text-emerald-400">${ICONE.check}</span> Preenchido pelo aluno em ${esc(Clientes.fmtData(a.convite.preenchidoEm.slice(0, 10)))}. O link já não aceita novos envios.</div>`
        : `<div class="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">${ICONE.alerta} Aguardando o aluno — link gerado em ${esc(Clientes.fmtData(a.convite.criadoEm))}.</div>`}
      ${linhasLinks('link-aluno', url, urlPassos)}
      <div class="flex flex-wrap items-center gap-2">
        ${a.celular ? `<a href="https://wa.me/55${esc(a.celular)}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener" class="${BOTAO_SEC} text-emerald-700 dark:text-emerald-400">${ICONE.whatsapp} Enviar por WhatsApp</a>` : ''}
        ${a.email ? `<a href="mailto:${esc(a.email)}?subject=${encodeURIComponent('Complete seu cadastro na ProWay')}&body=${encodeURIComponent(msg)}" class="${BOTAO_SEC}">${ICONE.email} Enviar por e-mail</a>` : ''}
        <span class="text-xs text-slate-400 ml-auto">WhatsApp/e-mail mandam o formulário único.</span>
      </div>
      <p class="text-xs text-slate-500 dark:text-neutral-400">Protótipo: o link funciona neste navegador (mesmo localStorage). Em produção o token expira e é de uso único.</p>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-2">
      <button type="button" id="btn-novo-link" class="${BOTAO_LINK}">Gerar novo link (invalida o atual)</button>
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Fechar</button>
    </div>`, 'max-w-3xl');
  ligarCopiar(root);
  root.querySelector('#btn-novo-link').addEventListener('click', () => {
    estado.dados = Clientes.gerarConvite(estado.dados, alunoId);
    persistir(); fecharModal(); rerender();
    toast('Novo link gerado; o anterior deixou de valer.');
    abrirModalLinkAluno(alunoId, rerender);
  });
}

function faixaCadastroEmpresa(e) {
  if (!cadastroEmpresaPendente(e)) return '';
  return `
    <div class="mb-4 flex items-center gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-4 py-2.5 text-sm text-amber-900 dark:text-amber-200">
      <span class="shrink-0 text-amber-600 dark:text-amber-400">${ICONE.alerta}</span>
      <div class="flex-1"><span class="font-medium">Aguardando a empresa completar o cadastro</span> — link gerado em ${esc(Clientes.fmtData(e.cadastro.criadoEm))}.</div>
      <button type="button" id="btn-faixa-link-cadastro" class="${BOTAO_LINK}">Ver link</button>
    </div>`;
}

function abrirModalLinkCadastroEmpresa(empresaId) {
  let e = empresaDe(empresaId);
  if (!e.cadastro) {
    estado.dados = Clientes.gerarCadastroEmpresa(estado.dados, empresaId);
    persistir(); e = empresaDe(empresaId); renderEmpresa();
  }
  const url = Clientes.urlCadastroEmpresa(e, 'formulario');
  const urlPassos = Clientes.urlCadastroEmpresa(e, 'passos');
  const preenchido = Boolean(e.cadastro.preenchidoEm);
  const ct = Clientes.contatoPrincipal(e);
  const msg = `Olá! Para formalizarmos o treinamento da ProWay com a ${nomeEmpresa(e)}, preencha os dados da empresa neste link: ${url}`;

  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
      <div>
        <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Link para a ${esc(nomeEmpresa(e))} completar o cadastro</h3>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">O RH ou financeiro abre o link, confere o que já foi digitado e completa razão social, endereço fiscal, cobrança/NF e pessoas de contato.</p>
      </div>
      <button type="button" data-fechar-modal class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${ICONE.fechar}</button>
    </div>
    <div class="px-5 py-4 space-y-4">
      ${preenchido
        ? `<div class="flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-200"><span class="text-emerald-600 dark:text-emerald-400">${ICONE.check}</span> Preenchido pela empresa em ${esc(Clientes.fmtData(e.cadastro.preenchidoEm.slice(0, 10)))}. O link já não aceita novos envios.</div>`
        : `<div class="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">${ICONE.alerta} Aguardando a empresa — link gerado em ${esc(Clientes.fmtData(e.cadastro.criadoEm))}.</div>`}
      ${linhasLinks('link-cadastro', url, urlPassos)}
      <div class="flex flex-wrap items-center gap-2">
        ${ct?.celular ? `<a href="https://wa.me/55${esc(ct.celular)}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener" class="${BOTAO_SEC} text-emerald-700 dark:text-emerald-400">${ICONE.whatsapp} WhatsApp para ${esc(ct.nome.split(' ')[0])}</a>` : ''}
        ${ct?.email || e.email ? `<a href="mailto:${esc(ct?.email || e.email)}?subject=${encodeURIComponent('Complete o cadastro da empresa — ProWay')}&body=${encodeURIComponent(msg)}" class="${BOTAO_SEC}">${ICONE.email} Enviar por e-mail</a>` : ''}
        <span class="text-xs text-slate-400 ml-auto">WhatsApp/e-mail mandam o formulário único.</span>
      </div>
      <p class="text-xs text-slate-500 dark:text-neutral-400">Protótipo: o link funciona neste navegador (mesmo localStorage). Em produção o token expira e é de uso único.</p>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-2">
      <button type="button" id="btn-novo-link" class="${BOTAO_LINK}">Gerar novo link (invalida o atual)</button>
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Fechar</button>
    </div>`, 'max-w-3xl');
  ligarCopiar(root);
  root.querySelector('#btn-novo-link').addEventListener('click', () => {
    estado.dados = Clientes.gerarCadastroEmpresa(estado.dados, empresaId);
    persistir(); fecharModal(); renderEmpresa();
    toast('Novo link gerado; o anterior deixou de valer.');
    abrirModalLinkCadastroEmpresa(empresaId);
  });
}

function abrirModalLinkEmpresa(empresaId) {
  let e = empresaDe(empresaId);
  if (!e.convite) {
    estado.dados = Clientes.gerarConviteEmpresa(estado.dados, empresaId);
    persistir(); e = empresaDe(empresaId); renderEmpresa();
  }
  const c = e.convite;
  const url = Clientes.urlConviteEmpresa(e, 'formulario');
  const urlPassos = Clientes.urlConviteEmpresa(e, 'passos');
  const aberto = Clientes.conviteEmpresaAberto(e);
  const restantes = Clientes.usosRestantes(e);
  const ct = Clientes.contatoPrincipal(e);
  const msg = `Olá! Para participar do treinamento da ProWay, cada colaborador da ${nomeEmpresa(e)} deve preencher o cadastro neste link: ${url}`;
  const usos = [...c.usos].reverse();
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
      <div>
        <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Link para os alunos da ${esc(nomeEmpresa(e))}</h3>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Um único link, reutilizável: cada colaborador abre, preenche seus dados e já entra vinculado à empresa, com "quem paga = empresa".</p>
      </div>
      <button type="button" data-fechar-modal class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${ICONE.fechar}</button>
    </div>
    <div class="px-5 py-4 space-y-4">
      <div class="flex items-center gap-2 text-sm ${aberto ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}">
        ${aberto ? ICONE.check : ICONE.alerta}
        ${!c.ativo ? 'Link desativado — ninguém consegue se cadastrar por ele.' : e.status !== 'ativo' ? 'Empresa inativa — o link não aceita cadastros.' : restantes === 0 ? 'Limite de usos atingido.' : `Aberto · ${c.usos.length} cadastro${c.usos.length === 1 ? '' : 's'} feito${c.usos.length === 1 ? '' : 's'}${c.limite ? ` · ${restantes} restante${restantes === 1 ? '' : 's'} de ${c.limite}` : ' · sem limite de usos'} · gerado em ${esc(Clientes.fmtData(c.criadoEm))}.`}
      </div>
      ${linhasLinks('link-empresa', url, urlPassos)}
      <div class="flex flex-wrap items-center gap-2">
        ${ct?.celular ? `<a href="https://wa.me/55${esc(ct.celular)}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener" class="${BOTAO_SEC} text-emerald-700 dark:text-emerald-400">${ICONE.whatsapp} WhatsApp para ${esc(ct.nome.split(' ')[0])}</a>` : ''}
        ${ct?.email || e.email ? `<a href="mailto:${esc(ct?.email || e.email)}?subject=${encodeURIComponent('Cadastro dos colaboradores — ProWay')}&body=${encodeURIComponent(msg)}" class="${BOTAO_SEC}">${ICONE.email} Enviar por e-mail</a>` : ''}
        <span class="text-xs text-slate-400 ml-auto">WhatsApp/e-mail mandam o formulário único.</span>
      </div>
      <div class="grid grid-cols-2 gap-3 items-end">
        <div>
          <label class="rotulo" for="limite-usos">Limite de usos ${OPCIONAL}</label>
          <div class="flex gap-2">
            <input id="limite-usos" type="number" min="1" step="1" value="${c.limite ?? ''}" placeholder="Sem limite" class="campo">
            <button type="button" id="btn-limite" class="${BOTAO_SEC} shrink-0">Aplicar</button>
          </div>
        </div>
        <label class="flex items-center justify-between gap-3 cursor-pointer rounded-lg border border-slate-300 dark:border-neutral-700 px-3 h-[42px]">
          <span class="text-sm font-medium text-slate-800 dark:text-neutral-100">Link ativo</span>
          <input type="checkbox" id="chk-ativo" class="${CHECK}" ${c.ativo ? 'checked' : ''}>
        </label>
      </div>
      ${usos.length ? `
      <div>
        <p class="rotulo">Quem se cadastrou por este link</p>
        <ul class="divide-y divide-slate-100 dark:divide-neutral-900 rounded-lg border border-slate-200 dark:border-neutral-800 max-h-40 overflow-y-auto">
          ${usos.map((u) => { const a = Clientes.porId(estado.dados.alunos, u.alunoId); return `<li class="flex items-center justify-between gap-2 px-3 py-1.5 text-sm"><span class="truncate">${a ? esc(a.nome) : '<span class="text-slate-400">aluno excluído</span>'}</span><span class="text-xs text-slate-400 whitespace-nowrap">${esc(Clientes.fmtData(u.em.slice(0, 10)))}${a ? ` · <button type="button" data-abrir-aluno="${a.id}" class="${BOTAO_LINK}">abrir</button>` : ''}</span></li>`; }).join('')}
        </ul>
      </div>` : ''}
      <p class="text-xs text-slate-500 dark:text-neutral-400">Protótipo: o link funciona neste navegador (mesmo localStorage). Em produção o token tem validade e o cadastro cai numa fila de conferência.</p>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-2">
      <button type="button" id="btn-novo-link" class="${BOTAO_LINK}">Gerar novo link (invalida o atual)</button>
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Fechar</button>
    </div>`, 'max-w-3xl');
  const reabrir = () => { persistir(); fecharModal(); renderEmpresa(); abrirModalLinkEmpresa(empresaId); };
  ligarCopiar(root);
  root.querySelector('#btn-limite').addEventListener('click', () => {
    estado.dados = Clientes.alterarConviteEmpresa(estado.dados, empresaId, { limite: root.querySelector('#limite-usos').value });
    toast('Limite atualizado.'); reabrir();
  });
  root.querySelector('#chk-ativo').addEventListener('change', (ev) => {
    estado.dados = Clientes.alterarConviteEmpresa(estado.dados, empresaId, { ativo: ev.target.checked });
    toast(ev.target.checked ? 'Link ativado.' : 'Link desativado.'); reabrir();
  });
  root.querySelector('#btn-novo-link').addEventListener('click', () => {
    estado.dados = Clientes.gerarConviteEmpresa(estado.dados, empresaId, { limite: c.limite });
    toast('Novo link gerado; o anterior deixou de valer.'); reabrir();
  });
  root.querySelectorAll('[data-abrir-aluno]').forEach((b) => b.addEventListener('click', () => abrir('aluno', b.dataset.abrirAluno)));
}

// ---------- Declaração de estudante ----------
// Documento simples de "está matriculado" — carteirinha de estudante, meia-entrada, comprovante para a empresa.
// Só matrículas com status "matriculado" entram; a mais recente vem selecionada.
const ESCOLA = { nome: 'ProWay Informática e Treinamentos', cidade: 'Blumenau', uf: 'SC' };
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const dataExtenso = (d = new Date()) => `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;

function matriculasAtivas(alunoId) {
  return Clientes.matriculasDoAluno(estado.dados, alunoId).filter((m) => m.matricula.status === 'matriculado');
}

function textoDeclaracao(a, m) {
  const o = a.genero === 'feminino' ? 'a' : 'o';
  const periodo = m.turma?.inicio ? `, no período de ${Clientes.fmtData(m.turma.inicio)}${m.turma.fim ? ` a ${Clientes.fmtData(m.turma.fim)}` : ''}` : '';
  const carga = m.curso?.cargaHoraria ? `, com carga horária de ${m.curso.cargaHoraria} horas` : '';
  const rg = a.rg ? ` e do RG ${a.rg}` : '';
  const nasc = a.nascimento ? `, nascid${o} em ${Clientes.fmtData(a.nascimento)}` : '';
  return `Declaramos, para os devidos fins, que ${a.nome}, portador${o} do CPF ${Clientes.fmtCpf(a.cpf)}${rg}${nasc}, está regularmente matriculad${o} nesta instituição no curso ${m.rotulo} (${m.tipo})${carga}${periodo}, sob a matrícula nº ${m.matricula.codigo}.`;
}

function htmlDeclaracao(a, m) {
  return `
    <div class="decl-topo"><strong>${esc(ESCOLA.nome)}</strong><br><span>${esc(ESCOLA.cidade)}/${esc(ESCOLA.uf)}</span></div>
    <h1>Declaração de matrícula</h1>
    <p class="decl-corpo">${esc(textoDeclaracao(a, m))}</p>
    <p class="decl-corpo">Por ser expressão da verdade, firmamos a presente declaração.</p>
    <p class="decl-data">${esc(ESCOLA.cidade)}, ${dataExtenso()}.</p>
    <div class="decl-assinatura"><div class="decl-linha"></div>${esc(ESCOLA.nome)}<br><span>Secretaria</span></div>`;
}

const CSS_DECLARACAO = `
  .decl { font-family: Georgia, 'Times New Roman', serif; color: #111; line-height: 1.6; }
  .decl .decl-topo { text-align: center; font-size: 13px; margin-bottom: 28px; } .decl .decl-topo span { color: #555; }
  .decl h1 { font-size: 20px; text-align: center; letter-spacing: .04em; text-transform: uppercase; margin: 0 0 28px; }
  .decl .decl-corpo { font-size: 15px; text-align: justify; text-indent: 3em; margin: 0 0 14px; }
  .decl .decl-data { margin-top: 32px; text-align: right; font-size: 15px; }
  .decl .decl-assinatura { margin: 64px auto 0; width: 60%; text-align: center; font-size: 13px; } .decl .decl-assinatura span { color: #555; }
  .decl .decl-linha { border-top: 1px solid #111; margin-bottom: 6px; }`;

function imprimirDeclaracao(a, m) {
  const w = window.open('', '_blank');
  if (!w) { toast('O navegador bloqueou a janela de impressão.'); return; }
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Declaração de matrícula · ${esc(a.nome)}</title>
    <style>@page { size: A4; margin: 25mm; } body { margin: 0; } ${CSS_DECLARACAO}</style></head>
    <body><div class="decl">${htmlDeclaracao(a, m)}</div><script>window.onload = () => { window.print(); };<\/script></body></html>`);
  w.document.close();
}

function abrirModalDeclaracao(alunoId) {
  const a = Clientes.porId(estado.dados.alunos, alunoId);
  const ativas = matriculasAtivas(alunoId);
  let escolhida = ativas[0] ?? null;
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3">
      <div><h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Declaração de estudante</h3>
      <p class="text-xs text-slate-500 dark:text-neutral-400">Comprova que o aluno está matriculado — serve para carteirinha de estudante, meia-entrada, empresa.</p></div>
      <button type="button" data-fechar-modal class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${ICONE.fechar}</button>
    </div>
    <div class="px-5 py-4 overflow-y-auto space-y-4">
      ${ativas.length ? `
        <fieldset>
          <legend class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400 mb-2">Matrícula ${ativas.length > 1 ? 'a declarar' : 'ativa'}</legend>
          <div class="space-y-1.5">${ativas.map((m, i) => `
            <label class="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-neutral-800 hover:border-petrol-800 dark:hover:border-sky-400 cursor-pointer has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 transition">
              <input type="radio" name="decl-mat" value="${i}" ${i === 0 ? 'checked' : ''} class="mt-1">
              <span class="text-sm"><span class="font-medium text-slate-800 dark:text-neutral-100">${esc(m.rotulo)}</span>
              <span class="block text-xs text-slate-500 dark:text-neutral-400">${esc(m.tipo)} · início ${esc(Clientes.fmtData(m.inicio))}${m.turma?.fim ? ` · fim ${esc(Clientes.fmtData(m.turma.fim))}` : ''} · <span class="font-mono">${esc(m.matricula.codigo)}</span></span></span>
            </label>`).join('')}</div>
        </fieldset>
        <div id="decl-previa" class="decl rounded-lg border border-slate-200 dark:border-neutral-800 bg-white p-6 shadow-inner"></div>`
      : `<div class="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 text-sm text-amber-900 dark:text-amber-200 flex gap-3">${ICONE.alerta}<div><p class="font-medium">Sem matrícula ativa.</p><p class="mt-1 text-amber-800/80 dark:text-amber-300/80">A declaração só sai para quem está com status <em>Matriculado</em> em alguma turma. Veja a aba Histórico ou crie uma venda.</p></div></div>`}
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Fechar</button>
      <button type="button" id="btn-imprimir" class="${BOTAO_PRI} disabled:opacity-40 disabled:pointer-events-none" ${ativas.length ? '' : 'disabled'}>${ICONE.documento} Imprimir / salvar PDF</button>
    </div>`, 'max-w-2xl');
  const previa = root.querySelector('#decl-previa');
  const renderPrevia = () => { if (previa && escolhida) previa.innerHTML = `<style>${CSS_DECLARACAO}</style>${htmlDeclaracao(a, escolhida)}`; };
  root.querySelectorAll('input[name="decl-mat"]').forEach((r) => r.addEventListener('change', () => { escolhida = ativas[Number(r.value)]; renderPrevia(); }));
  renderPrevia();
  root.querySelector('#btn-imprimir').addEventListener('click', () => { imprimirDeclaracao(a, escolhida); toast(`Declaração de ${a.nome} aberta para impressão.`); });
}

function confirmarExclusaoAluno(id) {
  const a = Clientes.porId(estado.dados.alunos, id);
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800"><h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Excluir aluno</h3></div>
    <div class="px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 space-y-2">
      <p>Excluir <strong>${esc(a.nome)}</strong> (${esc(Clientes.fmtCpf(a.cpf))})?</p>
      <p class="text-slate-500 dark:text-neutral-400">Sem matrículas, por isso pode ser excluído. Com histórico, o caminho é <em>inativar</em>.</p>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
      <button type="button" id="btn-confirmar" class="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition">Excluir</button>
    </div>`);
  root.querySelector('#btn-confirmar').addEventListener('click', () => {
    estado.dados = Clientes.removerAluno(estado.dados, id);
    persistir(); fecharModal();
    toast(`${a.nome} excluído.`);
    abrir('alunos', null);
  });
}

// ---------- Responsáveis: lista, detalhe, aba do aluno e vínculos ----------

const nomeParentesco = (id) => nomeDe(PARENTESCOS, id);
const CATEGORIA_PAPEL = { legal: 'legal', financeiro: 'financeiro', contato: 'emergencia' };
const ROTULO_PAPEL = { legal: 'Legal', financeiro: 'Financeiro', contato: 'Emergência' };
const pilulasPapeis = (papeis) => PAPEIS_RESPONSAVEL.filter((p) => papeis.includes(p.id)).map((p) => etiqueta(CATEGORIA_PAPEL[p.id], ROTULO_PAPEL[p.id], p.nome)).join('');
const avatarResponsavel = (r, tam = 'h-9 w-9 text-xs') => `<div class="${tam} shrink-0 rounded-full bg-violet-700 dark:bg-violet-600 text-white grid place-items-center font-semibold">${esc(iniciais(r.nome))}</div>`;

function renderListaResponsaveis() {
  const el = document.getElementById('lista');
  const f = estado.filtros.responsaveis;
  const papeisDe = (alunos) => [...new Set(alunos.flatMap((x) => x.vinculo.papeis))];
  // Só cobra cadastro completo de quem paga por algum aluno.
  const pendDe = (r) => (r.status === 'ativo' && papeisDe(Clientes.alunosDoResponsavel(estado.dados, r.id)).includes('financeiro') ? Clientes.pendenciasResponsavel(r) : []);
  const porPagador = Clientes.debitosPorPagador(estado.dados);
  const visao = porVisao(Clientes.filtrarResponsaveis(estado.dados.responsaveis, estado.dados.alunos, f), f.visao, pendDe);
  const { visiveis } = visao;
  const filtrando = f.busca || f.papel || f.vinculo;
  const linha = (r) => {
    const alunos = Clientes.alunosDoResponsavel(estado.dados, r.id);
    const papeis = papeisDe(alunos);
    return `
      <tr data-abrir="${r.id}" class="${LINHA_LISTA} ${r.status === 'inativo' ? 'linha-apagada' : ''}">
        ${celulaRegistro('responsavel', r.id, {
          avatar: avatarResponsavel(r),
          nome: r.nome,
          marcas: pilulaInativo(r) + pilulaFinanceira(r, financeiroDoPagador('responsavel', r, porPagador)),
          apoio: `<span class="font-mono">${esc(Clientes.fmtCpf(r.cpf))}</span>${r.profissao ? ` · ${esc(r.profissao)}` : ''}`,
          pend: pendDe(r),
        })}
        <td class="${TD}"><span class="block truncate">${r.email ? esc(r.email) : '<span class="text-slate-400">sem e-mail</span>'}</span><span class="block truncate text-xs text-slate-400">${r.celular ? esc(Clientes.fmtTelefone(r.celular)) : 'sem celular'}</span></td>
        <td class="${TD} ${SO_LARGO} truncate">${r.endereco.cidade ? `${esc(r.endereco.cidade)}/${esc(r.endereco.uf)}` : '<span class="text-slate-400">—</span>'}</td>
        <td class="${TD}">${alunos.length ? alunos.map((x) => `<span class="block truncate">${esc(x.aluno.nomeSocial || x.aluno.nome)} <span class="text-xs text-slate-400">· ${esc(nomeParentesco(x.vinculo.parentesco) || 'responsável')}</span></span>`).join('') : '<span class="text-slate-400">nenhum aluno</span>'}</td>
        <td class="${TH}"><div class="flex flex-wrap items-center gap-1.5">${pilulasPapeis(papeis) || '<span class="text-xs text-slate-400">—</span>'}</div></td>
      </tr>`;
  };
  el.innerHTML = `
    ${abasVisao(visao, f.visao)}
    <div class="mb-4 flex flex-wrap items-center gap-2">
      ${busca('busca-responsavel', f.busca, 'Buscar por nome, CPF, e-mail, celular ou aluno', 'w-72')}
      <div class="ml-auto flex flex-wrap items-center gap-2">
        ${select('filtro-papel', 'Todos os papéis', PAPEIS_RESPONSAVEL, f.papel, 'Papel')}
        ${select('filtro-vinculo', 'Com ou sem aluno', [{ id: 'com', nome: 'Com aluno vinculado' }, { id: 'sem', nome: 'Sem aluno vinculado' }], f.vinculo, 'Vínculo')}
        ${filtrando ? `<button type="button" data-limpar class="${BOTAO_LINK} ml-1">Limpar</button>` : ''}
      </div>
    </div>
    ${tabela(['Responsável', ['Contato', 'w-[23%]'], ['Cidade', `w-[13%] ${SO_LARGO}`], ['Alunos', 'w-[20%]'], ['Papéis', 'w-44']], visiveis.map(linha), vazioLista(filtrando, 'Nenhum responsável corresponde aos filtros.', { pendente: 'Nenhum responsável financeiro com pendência no cadastro.', inativo: 'Nenhum responsável inativo.' }[f.visao] || 'Nenhum responsável cadastrado.'), `${plural(visiveis.length, 'responsável', 'responsáveis')}${filtrando || f.visao ? ` de ${estado.dados.responsaveis.length}` : ''}`)}`;
  const campoBusca = el.querySelector('#busca-responsavel');
  campoBusca.addEventListener('input', () => { f.busca = campoBusca.value; const [ini, fim] = [campoBusca.selectionStart, campoBusca.selectionEnd]; renderListaResponsaveis(); const novo = document.getElementById('busca-responsavel'); novo.focus(); novo.setSelectionRange(ini, fim); });
  [['filtro-papel', 'papel'], ['filtro-vinculo', 'vinculo']].forEach(([id, k]) => el.querySelector(`#${id}`).addEventListener('change', (e) => { f[k] = e.target.value; renderListaResponsaveis(); document.getElementById(id).focus(); }));
  el.querySelectorAll('[data-limpar]').forEach((b) => b.addEventListener('click', () => { estado.filtros.responsaveis = { busca: '', visao: f.visao, papel: '', vinculo: '' }; renderListaResponsaveis(); document.getElementById('busca-responsavel').focus(); }));
  ligarVisao(el, f, renderListaResponsaveis);
}

// Tabela de vínculos usada dos dois lados: no aluno (linhas = responsáveis) e no responsável (linhas = alunos).
// Editar vínculo e desvincular ficam disponíveis nos dois lados.
function tabelaVinculos(lado, itens, vazioTxt) {
  const linha = (x) => {
    const pessoa = lado === 'aluno' ? x.responsavel : x.aluno;
    const v = x.vinculo;
    const idade = lado === 'responsavel' ? Clientes.idade(pessoa.nascimento) : null;
    const avatar = lado === 'aluno' ? avatarResponsavel(pessoa) : `<div class="h-9 w-9 shrink-0 rounded-full bg-petrol-800 text-white grid place-items-center text-xs font-semibold">${esc(iniciais(pessoa.nome))}</div>`;
    return `
      <tr class="${pessoa.status === 'inativo' ? 'linha-apagada' : ''}">
        <td class="${TH}">
          <div class="flex items-center gap-3">
            ${avatar}
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-800 dark:text-neutral-100 truncate">${esc(pessoa.nomeSocial || pessoa.nome)}${v.principal ? ` <span class="inline-flex items-center text-laranja" title="Responsável principal">${ICONE.estrela}</span>` : ''}${pessoa.status === 'inativo' ? ` ${pilula(PILULA.inativo, 'Inativo')}` : ''}${idade != null && idade < 18 ? ` ${etiquetaMenor(idade)}` : ''}</p>
              <p class="text-xs text-slate-500 dark:text-neutral-400 truncate"><span class="font-mono">${esc(Clientes.fmtCpf(pessoa.cpf))}</span>${idade != null ? ` · ${idade} anos` : ''}${lado === 'aluno' && pessoa.profissao ? ` · ${esc(pessoa.profissao)}` : ''}</p>
            </div>
          </div>
        </td>
        <td class="${TD} whitespace-nowrap">${esc(nomeParentesco(v.parentesco)) || '<span class="text-slate-400">—</span>'}${lado === 'aluno' ? '' : '<br><span class="text-xs text-slate-400">do aluno</span>'}</td>
        <td class="${TH}"><div class="flex flex-wrap items-center gap-1.5">${pilulasPapeis(v.papeis)}</div></td>
        <td class="${TD}">${pessoa.email ? esc(pessoa.email) : '<span class="text-slate-400">sem e-mail</span>'}<br><span class="text-xs text-slate-400">${pessoa.celular ? esc(Clientes.fmtTelefone(pessoa.celular)) : 'sem celular'}</span></td>
        <td class="${TH}">
          <div class="flex items-center justify-end gap-1">
            ${linkWhats(pessoa.celular)}
            <button type="button" data-abrir-pessoa="${pessoa.id}" class="${ICONE_BOTAO}" title="Abrir cadastro">${ICONE.externo}</button>
            <button type="button" data-editar-vinculo="${pessoa.id}" class="${ICONE_BOTAO}" title="Editar parentesco e papéis">${ICONE.lapis}</button>
            <button type="button" data-desvincular="${pessoa.id}" class="${ICONE_BOTAO_VERMELHO}" title="Desvincular">${ICONE.lixeira}</button>
          </div>
        </td>
      </tr>`;
  };
  return tabela([lado === 'aluno' ? 'Responsável' : 'Aluno', 'Parentesco', 'Papéis', 'Contato', ''], itens.map(linha), vazioTxt);
}

function ligarTabelaVinculos(el, lado, idFixo) {
  const alunoDe = (idPessoa) => (lado === 'aluno' ? idFixo : idPessoa);
  const responsavelDe = (idPessoa) => (lado === 'aluno' ? idPessoa : idFixo);
  el.querySelectorAll('[data-abrir-pessoa]').forEach((b) => b.addEventListener('click', () => abrir(lado === 'aluno' ? 'responsavel' : 'aluno', b.dataset.abrirPessoa)));
  el.querySelectorAll('[data-editar-vinculo]').forEach((b) => b.addEventListener('click', () => abrirDrawerVinculo(alunoDe(b.dataset.editarVinculo), responsavelDe(b.dataset.editarVinculo))));
  el.querySelectorAll('[data-desvincular]').forEach((b) => b.addEventListener('click', () => {
    const alunoId = alunoDe(b.dataset.desvincular); const responsavelId = responsavelDe(b.dataset.desvincular);
    const a = Clientes.porId(estado.dados.alunos, alunoId); const r = Clientes.porId(estado.dados.responsaveis, responsavelId);
    const eraFinanceiro = a.responsaveis.find((v) => v.responsavelId === responsavelId)?.papeis.includes('financeiro');
    estado.dados = Clientes.desvincularResponsavel(estado.dados, alunoId, responsavelId);
    persistir(); renderTudo();
    toast(`${r.nome} desvinculado de ${a.nome}.${eraFinanceiro ? ' Quem paga voltou a ser o próprio aluno.' : ''}`);
  }));
}

function renderAlunoResponsaveis() {
  const a = atual();
  const itens = Clientes.responsaveisDoAluno(estado.dados, a.id);
  const menor = Clientes.menorDeIdade(a.nascimento);
  const semLegal = menor && !itens.some((x) => x.vinculo.papeis.includes('legal'));
  document.getElementById('acoes-aba').innerHTML = `
    <button type="button" id="btn-vincular-responsavel" class="${BOTAO_SEC}">${ICONE.linkBotao} Vincular responsável já cadastrado</button>
    <button type="button" id="btn-novo-responsavel" class="${BOTAO_PRI}">${ICONE.mais} Novo responsável</button>`;
  document.getElementById('conteudo-aba').innerHTML = `
    ${semLegal ? `
    <div class="mb-4 flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
      <span class="shrink-0 text-amber-600 dark:text-amber-400">${ICONE.alerta}</span>
      <div><span class="font-medium">Aluno menor de idade sem responsável legal.</span> O contrato precisa ser assinado por um responsável legal — vincule pai, mãe ou tutor com o papel <em>Responsável legal</em>.</div>
    </div>` : ''}
    ${tabelaVinculos('aluno', itens, menor ? 'Nenhum responsável vinculado — aluno menor de idade precisa de pelo menos um responsável legal.' : 'Nenhum responsável vinculado. Para maiores de idade é opcional (contato de emergência, quem paga).')}
    <p class="mt-3 text-xs text-slate-600 dark:text-neutral-400">Papéis por aluno: <strong>Legal</strong> responde e assina pelo menor · <strong>Financeiro</strong> é quem paga (contrato e boleto no nome dele; só um por aluno) · <strong>Emergência</strong> recebe avisos de falta e ocorrências. ${ICONE.estrela.replace('h-3 w-3', 'h-3 w-3 inline text-laranja')} marca o principal.</p>`;
  const el = document.getElementById('conteudo-aba');
  document.getElementById('btn-vincular-responsavel').addEventListener('click', () => abrirModalVincular({ alunoId: a.id }));
  document.getElementById('btn-novo-responsavel').addEventListener('click', () => abrirDrawerResponsavel(null, a.id));
  ligarTabelaVinculos(el, 'aluno', a.id);
}

// ----- Detalhe do responsável (responsavel.html) -----

function renderResponsavel() {
  const r = atual();
  const alunos = Clientes.alunosDoResponsavel(estado.dados, r.id);
  const papeis = [...new Set(alunos.flatMap((x) => x.vinculo.papeis))];
  const pend = Clientes.pendenciasResponsavel(r);
  const idade = Clientes.idade(r.nascimento);
  const el = cabecalhoRegistro({
    voltar: 'Responsáveis', tipoLista: 'responsaveis',
    avatar: avatarResponsavel(r, 'h-12 w-12 font-display'),
    titulo: esc(r.nome),
    pilulas: `${pilulaInativo(r)}${pilulasPapeis(papeis)}`,
    chips: `
      ${chip(ICONE.pessoa, `<span class="font-mono">${esc(Clientes.fmtCpf(r.cpf))}</span>${idade != null ? ` · ${idade} anos` : ''}`, 'CPF · idade')}
      ${r.email ? chip(ICONE.email, esc(r.email), 'E-mail') : ''}
      ${r.celular ? chip(ICONE.telefone, esc(Clientes.fmtTelefone(r.celular)), 'Celular') : ''}
      ${r.endereco.cidade ? chip(ICONE.local, `${esc(r.endereco.cidade)}/${esc(r.endereco.uf)}`, 'Cidade') : ''}
      ${alunos.length ? chip(ICONE.pessoa, alunos.map((x) => `${esc(x.aluno.nomeSocial || x.aluno.nome)} (${esc(nomeParentesco(x.vinculo.parentesco) || 'responsável')})`).join(' · '), 'Alunos') : ''}`,
    acoes: `
      <button type="button" id="btn-editar" class="${BOTAO_SEC}">${ICONE.lapis} Editar dados</button>
      <button type="button" id="btn-mais" class="${BOTAO_SEC}" aria-haspopup="menu" aria-expanded="false">Mais ${ICONE.abaixo}</button>`,
    abas: ABAS_RESPONSAVEL, contadores: { alunos: alunos.length },
  });
  el.querySelector('#faixa').innerHTML = faixaFinanceira('responsavel', r, financeiroDoPagador('responsavel', r, Clientes.debitosPorPagador(estado.dados)))
    + (r.status === 'ativo' && papeis.includes('financeiro') ? faixaPendencias(pend, 'contrato e boleto no nome do responsável') : '');
  el.querySelector('#btn-editar').addEventListener('click', () => abrirDrawerResponsavel(r.id));
  el.querySelector('#btn-mais').addEventListener('click', (ev) => abrirMenu(ev.currentTarget, [
    ...itemWhats(r.celular),
    { nome: r.status === 'ativo' ? 'Inativar responsável' : 'Ativar responsável', acao: () => {
      const novo = r.status === 'ativo' ? 'inativo' : 'ativo';
      estado.dados = Clientes.alterarStatus(estado.dados, 'responsavel', r.id, novo);
      persistir(); renderResponsavel();
      toast(`${r.nome} ${novo === 'ativo' ? 'ativado.' : 'inativado.'}`);
    } },
    { nome: 'Excluir responsável', perigo: true, desabilitado: alunos.length > 0, detalhe: alunos.length ? 'Tem alunos vinculados — desvincule antes ou inative' : '', acao: () => confirmarExclusaoResponsavel(r.id) },
  ]));
  ({ dados: renderResponsavelDados, alunos: renderResponsavelAlunos })[estado.aba]();
}

function renderResponsavelDados() {
  const r = atual();
  document.getElementById('acoes-aba').innerHTML = '';
  document.getElementById('conteudo-aba').innerHTML = `
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <section class="${CARTAO}">
        ${cabecalhoSecao('Identificação', 'Como sai no contrato quando ele é quem paga.', 'btn-editar-dados')}
        <div class="p-4 grid grid-cols-2 gap-4">
          ${campo('Nome completo', esc(r.nome), 'col-span-2')}
          ${campo('CPF', `<span class="font-mono">${esc(Clientes.fmtCpf(r.cpf))}</span>`)}
          ${campo('RG', vazio(r.rg, '—'))}
          ${campo('Nascimento', r.nascimento ? `${esc(Clientes.fmtData(r.nascimento))} <span class="text-xs text-slate-400">· ${Clientes.idade(r.nascimento)} anos</span>` : vazio(r.nascimento, '—'))}
          ${campo('Profissão', vazio(r.profissao, '—'))}
        </div>
      </section>
      <section class="${CARTAO}">
        ${cabecalhoSecao('Contato', 'Por onde a escola fala com o responsável (avisos, boletos, emergências).', 'btn-editar-dados-2')}
        <div class="p-4 grid grid-cols-2 gap-4">
          ${campo('E-mail', vazio(r.email))}
          ${campo('Celular / WhatsApp', vazio(Clientes.fmtTelefone(r.celular)))}
          ${campo('Outro telefone', vazio(Clientes.fmtTelefone(r.telefone), '—'))}
          ${campo('Observações', `<p class="whitespace-pre-line">${vazio(r.observacoes, '—')}</p>`, 'col-span-2')}
        </div>
      </section>
      <section class="${CARTAO} xl:col-span-2">
        ${cabecalhoSecao('Endereço', 'Vai para o contrato e para o boleto quando ele é o responsável financeiro.', 'btn-editar-endereco')}
        ${fichaEndereco(r.endereco)}
      </section>
    </div>`;
  document.getElementById('btn-editar-dados').addEventListener('click', () => abrirDrawerResponsavel(r.id));
  document.getElementById('btn-editar-dados-2').addEventListener('click', () => abrirDrawerResponsavel(r.id));
  document.getElementById('btn-editar-endereco').addEventListener('click', () => abrirDrawerEnderecoResponsavel());
}

function renderResponsavelAlunos() {
  const r = atual();
  const itens = Clientes.alunosDoResponsavel(estado.dados, r.id);
  document.getElementById('acoes-aba').innerHTML = `
    <button type="button" id="btn-vincular-aluno" class="${BOTAO_PRI}">${ICONE.linkBotao} Vincular aluno</button>`;
  document.getElementById('conteudo-aba').innerHTML = tabelaVinculos('responsavel', itens, 'Nenhum aluno vinculado a este responsável.');
  document.getElementById('btn-vincular-aluno').addEventListener('click', () => abrirModalVincular({ responsavelId: r.id }));
  ligarTabelaVinculos(document.getElementById('conteudo-aba'), 'responsavel', r.id);
}

// ----- Formulários -----

// Campos do vínculo (parentesco em select, papéis em cartões-checkbox, principal em switch).
const camposVinculo = (v) => `
  <fieldset class="space-y-3">
    <legend class="rotulo">Vínculo com o aluno</legend>
    ${campoSelect('parentesco', 'Parentesco', PARENTESCOS, v.parentesco)}
    <div>
      <p class="rotulo">Papéis</p>
      <div class="grid grid-cols-1 gap-2">
        ${PAPEIS_RESPONSAVEL.map((p) => `
        <label class="${CARTAO_OPCAO} flex items-start gap-3">
          <input type="checkbox" name="papeis" value="${p.id}" class="${CHECK} mt-0.5" ${v.papeis.includes(p.id) ? 'checked' : ''}>
          <span><span class="block text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(p.nome)}</span><span class="block text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(p.descricao)}</span></span>
        </label>`).join('')}
      </div>
      ${ERRO('papeis')}
    </div>
    ${campoSwitch('principal', 'Responsável principal', 'Primeiro a ser procurado; aparece em destaque.', v.principal)}
  </fieldset>`;
const vinculoDe = (fd) => ({ parentesco: fd.get('parentesco'), papeis: fd.getAll('papeis'), principal: fd.has('principal') });

// Cadastro do responsável (criar/editar). Com `alunoId`, o novo responsável já sai vinculado ao aluno.
function abrirDrawerResponsavel(id = null, alunoId = null) {
  const r = id ? Clientes.porId(estado.dados.responsaveis, id) : null;
  const aluno = alunoId ? Clientes.porId(estado.dados.alunos, alunoId) : null;
  const d = r ?? { nome: '', cpf: '', rg: '', nascimento: '', profissao: '', email: '', celular: '', telefone: '', observacoes: '', status: null };
  const vinculoInicial = { parentesco: null, papeis: aluno && Clientes.menorDeIdade(aluno.nascimento) ? ['legal'] : [], principal: aluno ? aluno.responsaveis.length === 0 : false };
  modalFormulario({
    id: 'form-responsavel',
    titulo: r ? 'Editar responsável' : aluno ? `Novo responsável de ${esc(aluno.nomeSocial || aluno.nome)}` : 'Novo responsável',
    subtitulo: r ? 'Identificação e contato. O endereço é editado na ficha.' : aluno ? 'Cadastro da pessoa + vínculo com o aluno. Endereço você completa depois.' : 'Só o essencial. Endereço e alunos você vincula depois.',
    rotulo: r ? 'Salvar alterações' : aluno ? 'Criar e vincular' : 'Criar responsável',
    largura: 'max-w-2xl',
    foco: '#f-nome',
    corpo: `
      ${campoTexto('nome', 'Nome completo', d.nome, { placeholder: 'Como consta no documento', max: 120 })}
      <div class="grid grid-cols-3 gap-3">
        ${campoTexto('cpf', 'CPF', Clientes.fmtCpf(d.cpf), { placeholder: '000.000.000-00', max: 14, mascara: 'cpf' })}
        ${campoTexto('rg', 'RG', d.rg, { opcional: true, max: 20 })}
        ${campoTexto('nascimento', 'Nascimento', d.nascimento, { tipo: 'date', opcional: true })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('email', 'E-mail', d.email, { tipo: 'email', max: 120 })}
        ${campoTexto('celular', 'Celular / WhatsApp', Clientes.fmtTelefone(d.celular), { placeholder: '(47) 90000-0000', extra: 'inputmode="tel"' })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('telefone', 'Outro telefone', Clientes.fmtTelefone(d.telefone), { opcional: true, extra: 'inputmode="tel"' })}
        ${campoTexto('profissao', 'Profissão', d.profissao, { opcional: true, max: 80 })}
      </div>
      ${campoArea('observacoes', 'Observações', d.observacoes, { rows: 2, max: 500, opcional: true })}
      ${r ? `<fieldset><legend class="rotulo">Status</legend>${cartoesRadio('status', STATUS_CLIENTE, d.status, 'grid-cols-2')}${ERRO('status')}</fieldset>` : ''}
      ${aluno ? camposVinculo(vinculoInicial) : ''}`,
    aoSalvar: (fd) => {
      const novo = { nome: fd.get('nome'), cpf: fd.get('cpf'), rg: fd.get('rg'), nascimento: fd.get('nascimento'), profissao: fd.get('profissao'), email: fd.get('email'), celular: fd.get('celular'), telefone: fd.get('telefone'), observacoes: fd.get('observacoes'), status: fd.get('status') };
      if (!r) delete novo.status;
      const erros = Clientes.validarResponsavel(novo, estado.dados.responsaveis, id);
      const vinculo = aluno ? vinculoDe(fd) : null;
      if (aluno) erros.push(...Clientes.validarVinculo({ responsavelId: 'novo', ...vinculo }, aluno).filter((e) => e.campo !== 'responsavelId'));
      if (erros.length) return erros;
      if (r) {
        estado.dados = Clientes.atualizarDadosResponsavel(estado.dados, id, novo);
        persistir(); renderTudo();
        toast(`${novo.nome.trim()} atualizado.`);
        return;
      }
      const res = Clientes.incluirResponsavel(estado.dados, novo);
      estado.dados = res.dados;
      if (aluno) {
        estado.dados = Clientes.vincularResponsavel(estado.dados, aluno.id, { responsavelId: res.responsavel.id, ...vinculo });
        persistir(); renderTudo();
        toast(`${res.responsavel.nome} criado e vinculado a ${aluno.nome}.${vinculo.papeis.includes('financeiro') ? ' Quem paga agora é o responsável.' : ''}`);
      } else {
        persistir();
        toast(`${res.responsavel.nome} criado.`);
        abrir('responsavel', res.responsavel.id, 'dados');
      }
    },
  });
}

// Vincular um cadastro existente: fixa um lado (aluno ou responsável) e escolhe o outro numa lista com busca.
function abrirModalVincular({ alunoId = null, responsavelId = null }) {
  const ladoAluno = Boolean(alunoId);
  const fixo = ladoAluno ? Clientes.porId(estado.dados.alunos, alunoId) : Clientes.porId(estado.dados.responsaveis, responsavelId);
  const jaVinculados = new Set(ladoAluno ? fixo.responsaveis.map((v) => v.responsavelId) : Clientes.alunosDoResponsavel(estado.dados, responsavelId).map((x) => x.aluno.id));
  const candidatos = (ladoAluno ? estado.dados.responsaveis : estado.dados.alunos).filter((x) => !jaVinculados.has(x.id) && x.status === 'ativo').sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR'));
  let escolhido = null;
  const { form } = modalFormulario({
    id: 'form-vincular',
    titulo: ladoAluno ? 'Vincular responsável' : 'Vincular aluno',
    subtitulo: ladoAluno ? `Responsável já cadastrado que passa a responder por <strong>${esc(fixo.nomeSocial || fixo.nome)}</strong>.` : `Aluno que passa a ter <strong>${esc(fixo.nome)}</strong> como responsável.`,
    rotulo: 'Vincular',
    largura: 'max-w-2xl',
    corpo: `
      <div>
        <div class="flex items-center gap-2">${busca('busca-vinc', '', ladoAluno ? 'Buscar responsável por nome ou CPF' : 'Buscar aluno por nome ou CPF', 'flex-1')}</div>
        <div id="lista-vinc" class="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-neutral-800 p-1"></div>
        <input type="hidden" name="responsavelId" value="">
        ${ERRO('responsavelId')}
      </div>
      ${camposVinculo({ parentesco: null, papeis: [], principal: ladoAluno ? fixo.responsaveis.length === 0 : false })}`,
    aoSalvar: (fd) => {
      const vinculo = vinculoDe(fd);
      const aId = ladoAluno ? alunoId : escolhido;
      const rId = ladoAluno ? escolhido : responsavelId;
      const aluno = aId ? Clientes.porId(estado.dados.alunos, aId) : null;
      const erros = Clientes.validarVinculo({ responsavelId: escolhido ? rId : '', ...vinculo }, aluno);
      if (erros.length) return erros;
      estado.dados = Clientes.vincularResponsavel(estado.dados, aId, { responsavelId: rId, ...vinculo });
      persistir(); renderTudo();
      const r = Clientes.porId(estado.dados.responsaveis, rId);
      toast(`${r.nome} vinculado a ${aluno.nome}.${vinculo.papeis.includes('financeiro') ? ' Quem paga agora é o responsável.' : ''}`);
    },
  });
  const lista = form.querySelector('#lista-vinc');
  const campoBusca = form.querySelector('#busca-vinc');
  const render = () => {
    const termo = Clientes.normalizar(campoBusca.value);
    const dig = Clientes.digitos(campoBusca.value);
    const visiveis = candidatos.filter((x) => !termo || Clientes.normalizar(`${x.nome} ${x.email}`).includes(termo) || (dig && x.cpf.includes(dig)));
    lista.innerHTML = visiveis.length ? visiveis.map((x) => `
      <label class="flex items-center gap-3 rounded-lg px-2 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-neutral-900 ${escolhido === x.id ? 'bg-petrol-800/5 dark:bg-sky-950/40' : ''}">
        <input type="radio" name="escolha" value="${x.id}" class="accent-petrol-800" ${escolhido === x.id ? 'checked' : ''}>
        <span class="min-w-0 flex-1">
          <span class="block text-sm text-slate-800 dark:text-neutral-100 truncate">${esc(x.nome)}</span>
          <span class="block text-xs text-slate-500 dark:text-neutral-400 truncate">${esc(Clientes.fmtCpf(x.cpf))} · ${esc(x.email || 'sem e-mail')}${!ladoAluno && x.nascimento ? ` · ${Clientes.idade(x.nascimento)} anos` : ''}</span>
        </span>
      </label>`).join('') : `<p class="px-2 py-4 text-sm text-slate-500 dark:text-neutral-400">${campoBusca.value ? 'Nenhum resultado.' : ladoAluno ? 'Nenhum responsável disponível — use "Novo responsável".' : 'Todos os alunos ativos já estão vinculados.'}</p>`;
    lista.querySelectorAll('input[name="escolha"]').forEach((rd) => rd.addEventListener('change', () => { escolhido = rd.value; form.querySelector('[name="responsavelId"]').value = escolhido; render(); }));
  };
  campoBusca.addEventListener('input', render);
  render();
  campoBusca.focus();
}

// Editar parentesco, papéis e principal de um vínculo existente.
function abrirDrawerVinculo(alunoId, responsavelId) {
  const a = Clientes.porId(estado.dados.alunos, alunoId);
  const r = Clientes.porId(estado.dados.responsaveis, responsavelId);
  const v = a.responsaveis.find((x) => x.responsavelId === responsavelId);
  drawerFormulario({
    id: 'form-vinculo-resp',
    titulo: 'Editar vínculo',
    subtitulo: `<strong>${esc(r.nome)}</strong> × <strong>${esc(a.nomeSocial || a.nome)}</strong>`,
    rotulo: 'Salvar alterações',
    foco: '#f-parentesco',
    corpo: camposVinculo(v),
    aoSalvar: (fd) => {
      const vinculo = vinculoDe(fd);
      const erros = Clientes.validarVinculo({ responsavelId, ...vinculo }, a);
      if (erros.length) return erros;
      const perdeuFinanceiro = v.papeis.includes('financeiro') && !vinculo.papeis.includes('financeiro');
      estado.dados = Clientes.vincularResponsavel(estado.dados, alunoId, { responsavelId, ...vinculo });
      persistir(); renderTudo();
      toast(`Vínculo atualizado.${perdeuFinanceiro ? ' Quem paga voltou a ser o próprio aluno.' : vinculo.papeis.includes('financeiro') && !v.papeis.includes('financeiro') ? ' Quem paga agora é o responsável.' : ''}`);
    },
  });
}

function abrirDrawerEnderecoResponsavel() {
  const r = atual();
  drawerFormulario({
    id: 'form-endereco-responsavel',
    titulo: 'Endereço do responsável',
    subtitulo: `Em <strong>${esc(r.nome)}</strong> · vai para contrato e boleto quando ele paga.`,
    rotulo: 'Salvar alterações',
    largura: 'max-w-lg',
    foco: '#f-cep',
    corpo: camposEndereco(r.endereco),
    aoSalvar: (fd) => {
      const endereco = enderecoDe(fd);
      const erros = Clientes.validarEndereco(endereco);
      if (erros.length) return erros;
      estado.dados = Clientes.atualizarEnderecoResponsavel(estado.dados, r.id, endereco);
      persistir(); renderResponsavel();
      toast('Endereço atualizado.');
    },
  });
}

function confirmarExclusaoResponsavel(id) {
  const r = Clientes.porId(estado.dados.responsaveis, id);
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800"><h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Excluir responsável</h3></div>
    <div class="px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 space-y-2">
      <p>Excluir <strong>${esc(r.nome)}</strong> (${esc(Clientes.fmtCpf(r.cpf))})?</p>
      <p class="text-slate-500 dark:text-neutral-400">Sem alunos vinculados, por isso pode ser excluído. Para manter o histórico, prefira <em>inativar</em>.</p>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
      <button type="button" id="btn-confirmar" class="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition">Excluir</button>
    </div>`);
  root.querySelector('#btn-confirmar').addEventListener('click', () => {
    estado.dados = Clientes.removerResponsavel(estado.dados, id);
    persistir(); fecharModal();
    toast(`${r.nome} excluído.`);
    abrir('responsaveis', null);
  });
}

// ---------- Boot ----------

function renderTudo() {
  if (MODO === 'detalhe') {
    if (!atual()) { location.replace(urlLista(LISTA_DE[TIPO_PAGINA])); return; }
    ({ empresa: renderEmpresa, aluno: renderAluno, responsavel: renderResponsavel })[estado.selecionado.tipo]();
  } else renderLista();
}

(function iniciar() {
  const aba = parametroUrl('aba');
  if (MODO === 'lista') { renderTudo(); return; }
  const id = parametroUrl('id');
  const abas = { aluno: ABAS_ALUNO, empresa: ABAS_EMPRESA, responsavel: ABAS_RESPONSAVEL }[TIPO_PAGINA];
  estado.selecionado = { tipo: TIPO_PAGINA, id: id || '' };
  estado.aba = abas.flatMap((x) => [x.id, ...(x.partes ?? []).map((p) => p.id)]).includes(aba) ? aba : 'dados';
  renderTudo();
  // Recém-criado: já oferece o link para o aluno completar o cadastro.
  if (sessionStorage.getItem('clientes-abrir-link') === id) {
    sessionStorage.removeItem('clientes-abrir-link');
    if (atual()) (TIPO_PAGINA === 'aluno' ? abrirModalLinkAluno : abrirModalLinkCadastroEmpresa)(id);
  }
})();
