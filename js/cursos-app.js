// ============================================================
// UI da tela "Cursos". Regras no motor (Cursos.*); aqui só se monta
// HTML, reage a cliques e persiste.
// Fluxo: lista (cursos.html, busca + filtros) → curso aberto em página própria
// (curso.html?id=&aba=) com abas Dados gerais | Conteúdo programático | Material didático | Requisitos | Onde é oferecido.
// ============================================================

// Modo da página: `cursos.html` (lista) ou `curso.html?id=` (detalhe). Mesmo JS nas duas.
const MODO = document.body.dataset.modo === 'detalhe' ? 'detalhe' : 'lista';

const estado = {
  lista: Cursos.carregar(),
  areas: Areas.carregar(),
  selecionado: null, // id do curso aberto | null = lista
  aba: 'dados',
  filtros: { busca: '', areaId: parametroUrl('area') ?? '', eixoId: '', status: '', formato: '', nivel: '' }, // ?area= vem da contagem em Áreas
  fechados: new Set(), // módulos minimizados (abertos por padrão)
};

const ABAS = [
  { id: 'dados', titulo: 'Dados gerais' },
  { id: 'conteudo', titulo: 'Conteúdo programático' },
  { id: 'material', titulo: 'Material didático' },
  { id: 'requisitos', titulo: 'Requisitos' },
  { id: 'oferta', titulo: 'Onde é oferecido' },
];

const ICONE = {
  lapis: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>',
  lixeira: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>',
  copiar: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>',
  cima: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>',
  baixo: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>',
  mais: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>',
  lupa: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>',
  fechar: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>',
  chevron: '<svg class="h-4 w-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>',
  relogio: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
  pessoa: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>',
  lista: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>',
  local: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>',
  turmas: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>',
  alerta: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>',
  check: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>',
  video: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-2.36a.75.75 0 011.03.67v6.38a.75.75 0 01-1.03.67L15.75 13.5m-13.5-4.5A2.25 2.25 0 014.5 6.75h9a2.25 2.25 0 012.25 2.25v6a2.25 2.25 0 01-2.25 2.25h-9A2.25 2.25 0 012.25 15V9z"/></svg>',
  arquivo: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>',
  link: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg>',
  dinheiro: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>',
};

const BOTAO_SEC = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-40 disabled:pointer-events-none';
const BOTAO_PRI = 'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/40';
const BOTAO_FANTASMA = 'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm font-medium text-slate-500 dark:text-neutral-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-40 disabled:pointer-events-none';
const BOTAO_CANCELAR = 'px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition';
const BOTAO_LINK = 'inline-flex items-center gap-1 text-xs font-medium text-petrol-800 dark:text-sky-300 hover:underline';
const ICONE_BOTAO = 'inline-flex items-center justify-center h-7 w-7 rounded-md text-slate-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-30 disabled:pointer-events-none';
const ICONE_BOTAO_VERMELHO = `${ICONE_BOTAO} hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40`;
const CAMPO_BUSCA = 'h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 pl-8 pr-3 text-sm text-slate-700 dark:text-neutral-200 placeholder:text-slate-400 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400 focus:ring-2 focus:ring-petrol-800/20';
const SELECT_FILTRO = 'h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2.5 text-sm text-slate-700 dark:text-neutral-200 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400';
const CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)]';
const TH = 'px-4 py-2.5';
const TD = 'px-4 py-2.5 text-sm text-slate-600 dark:text-neutral-300';
const THEAD = 'text-xs font-medium text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800';
const FOCO_LINHA = 'has-[.link-registro:focus-visible]:bg-slate-50 dark:has-[.link-registro:focus-visible]:bg-neutral-900 has-[.link-registro:focus-visible]:outline-2 has-[.link-registro:focus-visible]:-outline-offset-2 has-[.link-registro:focus-visible]:outline-[color:var(--f-foco)]';
const AVISO = 'text-[color:var(--f-aviso)]';
const CARTAO_OPCAO = 'cursor-pointer rounded-lg border p-3 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 border-slate-300 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500 transition';
const CHECK = 'check';

// Pílula só de exceção (Regra da Pílula de Exceção): ativo e "no site" são o comum e não se anunciam.
const PILULA = {
  ativo: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  rascunho: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  inativo: 'bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-400',
  neutra: 'bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-400',
};

// ---------- Helpers ----------

function pilula(classe, texto, titulo = '') {
  return `<span title="${esc(titulo)}" class="pilula inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ${classe}">${esc(texto)}</span>`;
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

function plural(n, singular, pluralTxt = `${singular}s`) {
  return `${n} ${n === 1 ? singular : pluralTxt}`;
}

// Sugestões de requisitos vindas dos instrutores (docs/cursos.md RN9): quem decide é a coordenação.
const AUTOR_SUGESTOES = 'Coordenação';
// Requisitos de máquina não entram na V1: só as sugestões de software aparecem.
const sugestoesSoftware = (c) => Cursos.sugestoesRequisitos(c).filter((x) => x.tipo !== 'maquina');

// "03/09/2026 · 19h40" a partir de "2026-09-03T19:40".
function fmtDataHora(iso) {
  const [d, h] = String(iso ?? '').split('T');
  if (!d) return '';
  const data = d.split('-').reverse().join('/');
  return h ? `${data} · ${h.slice(0, 5).replace(':', 'h')}` : data;
}

function fmtHoras(h) {
  if (h == null) return '—';
  return `${Number(h).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h`;
}

function fmtMoeda(v) {
  return v == null ? '—' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function nomeDe(lista, id, campo = 'nome') {
  return lista.find((x) => x.id === id)?.[campo] ?? '';
}

const eixoDe = (id) => nomeDe(EIXOS, id);
const areaObj = (id) => Areas.porId(estado.areas, id);
// Área: marca quadrada na cor dela + nome em texto (vazada quando a área foi removida). Quadrada para não se passar por ponto de eixo ou de ciclo de vida.
function pilulaArea(id) {
  const a = areaObj(id);
  return `<span title="Área" class="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-slate-600 dark:text-neutral-300"><span class="h-2 w-2 shrink-0 rounded-[2px] ${Areas.cor(a).ponto}"></span>${esc(a?.nome ?? 'Área removida')}</span>`;
}
const nivelDe = (id) => NIVEIS.find((n) => n.id === id);
const statusDe = (id) => STATUS_CURSO.find((s) => s.id === id);
const formatoDe = (id) => nomeDe(FORMATOS, id);
const instrutorDe = (id) => INSTRUTORES.find((i) => i.id === id);

function valorOuVazio(v, fallback = '<span class="text-slate-500 dark:text-neutral-400">não informado</span>') {
  return v == null || v === '' ? fallback : esc(v);
}

function persistir() {
  Cursos.salvar(estado.lista);
}

function atual() {
  return Cursos.porId(estado.lista, estado.selecionado);
}

function urlCurso(id, aba = 'dados', sub = '') {
  return `curso.html?id=${encodeURIComponent(id)}${aba && aba !== 'dados' ? `&aba=${encodeURIComponent(aba)}` : ''}${sub ? `&sub=${encodeURIComponent(sub)}` : ''}`;
}

// Só no detalhe: mantém `id` e atualiza o parâmetro secundário `aba`.
function atualizarUrl() {
  if (MODO !== 'detalhe' || !estado.selecionado) return;
  // Cada parte de Requisitos guarda o próprio id na URL (Regra da Linha de Abas); a primeira é o padrão.
  const sub = estado.aba === 'requisitos' && estado.subRequisitos && estado.subRequisitos !== 'pre' ? estado.subRequisitos : '';
  history.replaceState(null, '', urlCurso(estado.selecionado, estado.aba, sub));
}

// Navega entre páginas: null → lista; id → página de detalhe (curso.html?id=).
function selecionar(id, aba = 'dados') {
  location.href = id ? urlCurso(id, aba) : 'cursos.html';
}

// Cabeçalho padrão dos cartões: título, frase de contexto e a ação do cartão em botão fantasma; sem divisória.
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

// Faixa do topo do registro: só quando alguém precisa agir (Regra da Faixa que Pede Ação). Sem contorno.
function faixa(tom, html) {
  const cores = {
    aviso: 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
    petrol: 'bg-petrol-800/10 dark:bg-sky-950/40 text-petrol-900 dark:text-sky-200',
  };
  return `<div class="mb-4 flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${cores[tom]}"><span class="shrink-0">${ICONE.alerta}</span><div class="min-w-0 flex-1">${html}</div></div>`;
}

// Par rótulo/valor das fichas de leitura.
function campo(rotulo, valorHtml, largura = '') {
  return `
    <div class="${largura}">
      <p class="text-xs font-medium text-slate-500 dark:text-neutral-400">${rotulo}</p>
      <div class="text-sm text-slate-800 dark:text-neutral-100 mt-0.5 break-words">${valorHtml}</div>
    </div>`;
}

// ---------- Lista ----------

function renderLista() {
  const el = document.getElementById('tela');
  const f = estado.filtros;
  const visiveis = Cursos.filtrar(estado.lista, f);
  const filtrando = f.areaId || f.eixoId || f.status || f.formato || f.nivel || f.busca;
  const select = (id, rotulo, opcoes, valor) => campoCombo(id, opcoes, valor, { id, vazio: rotulo, filtro: true, classe: valor ? 'border-petrol-800 dark:border-sky-400 text-petrol-800 dark:text-sky-300' : '' });

  // Ativo é o comum: só rascunho e inativo ganham pílula; a segunda linha troca o resumo pelo que falta, quando falta.
  // Formatos ficam no filtro e na ficha: a coluna quebrava em três linhas e empurrava a tabela para fora de 1280px.
  const linha = (c) => {
    const pend = c.status === 'inativo' ? [] : Cursos.pendencias(c);
    const nivel = nivelDe(c.nivel);
    return `
      <tr data-abrir="${c.id}" class="cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900 transition ${FOCO_LINHA} ${c.status === 'inativo' ? 'linha-apagada' : ''}">
        <td class="${TH}">
          <p><span class="font-mono text-xs text-slate-500 dark:text-neutral-400 mr-1.5">${esc(c.codigo)}</span><a href="${urlCurso(c.id)}" class="link-registro text-sm font-medium text-slate-800 dark:text-neutral-100 hover:underline underline-offset-2 focus-visible:outline-none">${esc(c.nome)}</a>${c.status === 'ativo' ? '' : ` ${pilula(PILULA[c.status], statusDe(c.status).nome, statusDe(c.status).descricao)}`}</p>
          ${pend.length
            ? `<p class="text-xs ${AVISO} truncate" title="${esc(pend.join(' · '))}">${plural(pend.length, 'pendência')}: ${esc(pend.join(' · '))}</p>`
            : `<p class="text-xs text-slate-500 dark:text-neutral-400 truncate" title="${esc(c.resumo)}">${esc(c.resumo) || 'sem resumo'}</p>`}
        </td>
        <td class="${TD}">${pilulaArea(c.areaId)}</td>
        <td class="${TD}">${eixoDe(c.eixoId) ? `${esc(eixoDe(c.eixoId))}<span class="block text-xs text-slate-500 dark:text-neutral-400">${esc(nivel?.nome ?? '')}</span>` : esc(nivel?.nome ?? '')}</td>
        <td class="${TD} text-right tabular-nums whitespace-nowrap">${fmtHoras(c.cargaHoraria)}</td>
        <td class="${TD} text-right tabular-nums whitespace-nowrap">${fmtMoeda(c.comercial.precoReferencia)}</td>
      </tr>`;
  };

  el.innerHTML = `
    <div class="mb-4">
      <h2 class="font-display text-xl font-semibold text-slate-900 dark:text-neutral-100">Cursos</h2>
      <p class="max-w-3xl text-sm text-slate-600 dark:text-neutral-400 mt-0.5">Catálogo pedagógico da escola. Cada curso tem carga horária, conteúdo programático, requisitos e valores de referência; depois vira turma aberta ou entra numa formação.</p>
    </div>

    ${cartoesResumoCursos()}
    <div class="mb-4 flex flex-wrap items-center gap-2">
      ${busca('busca-curso', f.busca, 'Buscar por código, nome ou resumo', 'w-64')}
      <div class="ml-auto flex flex-wrap items-center gap-2">
        ${select('filtro-area', 'Área', Areas.opcoes(estado.areas, f.areaId), f.areaId)}
        ${select('filtro-eixo', 'Eixo', EIXOS, f.eixoId)}
        ${select('filtro-nivel', 'Nível', NIVEIS, f.nivel)}
        ${select('filtro-formato', 'Formato', FORMATOS, f.formato)}
        ${select('filtro-status', 'Status', STATUS_CURSO, f.status)}
        ${filtrando ? `<button type="button" id="btn-limpar-filtros" class="${BOTAO_LINK}">Limpar</button>` : ''}
        <button type="button" id="btn-novo" class="${BOTAO_PRI}">${ICONE.mais} Novo curso</button>
      </div>
    </div>

    <div class="${CARTAO} overflow-x-auto">
      <table class="w-full table-fixed text-left">
        <thead class="${THEAD}">
          <tr>
            <th class="${TH}">Curso</th>
            <th class="${TH} w-[150px]">Área</th>
            <th class="${TH} w-[140px]">Eixo e nível</th>
            <th class="${TH} w-[76px] text-right" title="Carga horária">Carga</th>
            <th class="${TH} w-[112px] text-right" title="Preço de referência">Preço ref.</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
          ${visiveis.length ? visiveis.map(linha).join('') : `
          <tr><td colspan="5" class="px-4 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">
            ${estado.lista.length ? 'Nenhum curso corresponde aos filtros.' : 'Nenhum curso cadastrado ainda.'}
            ${estado.lista.length ? '' : `<br><button type="button" id="btn-novo-vazio" class="${BOTAO_PRI} mt-4">${ICONE.mais} Criar o primeiro curso</button>`}
          </td></tr>`}
        </tbody>
      </table>
      <div class="px-4 py-2.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-sm text-slate-700 dark:text-neutral-200 tabular-nums">${plural(visiveis.length, 'curso')}${filtrando ? ` de ${estado.lista.length}` : ''}</div>
    </div>`;

  const campoBusca = el.querySelector('#busca-curso');
  campoBusca.addEventListener('input', () => { estado.filtros.busca = campoBusca.value; const [ini, fim] = [campoBusca.selectionStart, campoBusca.selectionEnd]; renderLista(); const novo = document.getElementById('busca-curso'); novo.focus(); novo.setSelectionRange(ini, fim); });
  [['filtro-area', 'areaId'], ['filtro-eixo', 'eixoId'], ['filtro-nivel', 'nivel'], ['filtro-formato', 'formato'], ['filtro-status', 'status']].forEach(([id, chave]) => {
    el.querySelector(`[data-name="${id}"] input[type="hidden"]`).addEventListener('change', (e) => { estado.filtros[chave] = e.target.value; renderLista(); });
  });
  ativarCombos(el);
  el.querySelector('#btn-limpar-filtros')?.addEventListener('click', () => { estado.filtros = { busca: '', areaId: '', eixoId: '', status: '', formato: '', nivel: '' }; renderLista(); });
  el.querySelector('#btn-novo').addEventListener('click', () => abrirModalCurso());
  el.querySelector('#btn-novo-vazio')?.addEventListener('click', () => abrirModalCurso());
  // O nome é o link (teclado, ⌘-clique); o resto da linha abre o mesmo curso, a não ser que a pessoa esteja selecionando texto.
  el.querySelector('tbody').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-abrir]');
    if (!tr || e.target.closest('a, button') || getSelection().toString()) return;
    if (e.metaKey || e.ctrlKey) window.open(urlCurso(tr.dataset.abrir), '_blank'); else selecionar(tr.dataset.abrir);
  });
}

// ---------- Curso aberto: cabeçalho + sub-abas ----------

function renderCurso() {
  const el = document.getElementById('tela');
  const c = atual();
  const pend = c.status === 'inativo' ? [] : Cursos.pendencias(c);
  const turmas = Cursos.turmasDoCurso(c.id);
  const formacoes = Cursos.formacoesDoCurso(c.id);
  const podeExcluir = Cursos.podeExcluir(c.id);
  const sugestoes = sugestoesSoftware(c).filter((x) => x.status === 'pendente').length;
  const subAba = (a) => {
    const n = a.id === 'conteudo' ? c.modulos.length : a.id === 'material' ? c.materiais.length : a.id === 'oferta' ? turmas.length + formacoes.length : null;
    return `
    <button type="button" data-aba="${a.id}"
      class="px-0.5 pb-2.5 text-sm border-b-2 transition whitespace-nowrap ${estado.aba === a.id ? 'border-[color:var(--f-marca-tinta)] text-slate-900 dark:text-neutral-100 font-medium' : 'border-transparent text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'}">${a.titulo}${n != null ? ` <span class="ml-1 text-xs text-slate-600 dark:text-neutral-400 tabular-nums">${n}</span>` : ''}${a.id === 'requisitos' && sugestoes ? ` <span class="ml-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 text-[11px] tabular-nums" title="${esc(plural(sugestoes, 'sugestão de instrutor esperando resposta', 'sugestões de instrutores esperando resposta'))}">${sugestoes}</span>` : ''}</button>`;
  };
  // Pílula só de exceção: inativo, e ativo fora do site (o comum é estar publicado). Rascunho fica na faixa.
  const pilulas = c.status === 'inativo' ? pilula(PILULA.inativo, 'Inativo', statusDe('inativo').descricao)
    : c.status === 'ativo' && !c.comercial.publicadoSite ? pilula(PILULA.neutra, 'Fora do site', 'Ativo, mas não publicado no site da ProWay') : '';
  // Uma ação à vista; o resto no "Mais", com o motivo de cada item travado.
  const itensMais = [
    { nome: 'Duplicar', detalhe: 'Cópia em rascunho com tudo igual', acao: () => abrirModalDuplicar(c.id) },
    c.status === 'ativo'
      ? { nome: 'Inativar', detalhe: 'Sai do catálogo e do site; turmas e histórico continuam', acao: () => alterarStatus(c.id, 'inativo') }
      : { nome: 'Ativar', detalhe: pend.length ? `Libera para o comercial mesmo com ${plural(pend.length, 'pendência')}` : 'Libera para o comercial', acao: () => alterarStatus(c.id, 'ativo') },
    'sep',
    { nome: 'Excluir curso', perigo: true, desabilitado: !podeExcluir, detalhe: podeExcluir ? '' : 'Tem turmas ou formações vinculadas — inative em vez de excluir', acao: () => confirmarExclusao(c.id) },
  ];

  el.innerHTML = `
    <nav aria-label="Breadcrumb" class="mb-3 flex items-center gap-1.5 text-sm text-slate-600 dark:text-neutral-400">
      <a href="cursos.html" class="hover:text-petrol-800 dark:hover:text-sky-300 transition">Cursos</a>
      <span>/</span>
      <span class="font-medium text-slate-800 dark:text-neutral-100 truncate max-w-xs" aria-current="page">${esc(c.nome)}</span>
    </nav>
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1 basis-80 flex items-start gap-3">
        <div class="h-12 w-12 shrink-0 rounded-xl bg-petrol-800/10 dark:bg-sky-950/60 text-petrol-800 dark:text-sky-300 grid place-items-center px-1 text-center font-mono font-semibold leading-tight break-all ${c.codigo.length > 5 ? 'text-xs' : 'text-sm'}" title="Código do curso">${esc(c.codigo)}</div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2 min-w-0">
            <h2 class="font-registro text-[26px] leading-[1.15] font-semibold tracking-[-0.01em] text-slate-900 dark:text-neutral-100">${esc(c.nome)}</h2>
            ${pilulas}
          </div>
          ${c.resumo ? `<p class="text-sm text-slate-600 dark:text-neutral-300 mt-1">${esc(c.resumo)}</p>` : ''}
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
            ${pilulaArea(c.areaId).replace('text-sm', 'text-[13px]')}
            ${chip(ICONE.lista, [eixoDe(c.eixoId), nivelDe(c.nivel)?.nome].filter(Boolean).map(esc).join(' · '), 'Eixo na matriz · nível')}
            ${chip(ICONE.relogio, `${fmtHoras(c.cargaHoraria)}${c.encontros ? ` · ${plural(c.encontros, 'encontro')}` : ''}`, 'Carga horária')}
            ${chip(ICONE.local, c.formatos.map(formatoDe).join(' · ') || 'sem formato', 'Formatos')}
            ${chip(ICONE.pessoa, c.instrutorIds.length ? plural(c.instrutorIds.length, 'instrutor', 'instrutores') : 'sem instrutor', 'Instrutores habilitados')}
            ${chip(ICONE.turmas, `${plural(formacoes.length, 'formação', 'formações')} · ${plural(turmas.length, 'turma')}`, 'Onde é oferecido')}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button type="button" id="btn-editar" class="${BOTAO_SEC}">${ICONE.lapis} Editar dados</button>
        <button type="button" id="btn-mais" class="${BOTAO_SEC}" aria-haspopup="menu" aria-expanded="false">Mais ${ICONE.baixo}</button>
      </div>
    </div>

    ${faixaCurso(c, pend)}

    <div class="mb-4 shadow-[inset_0_-1px_0] shadow-slate-200 dark:shadow-neutral-800 flex items-center gap-4 overflow-x-auto [scrollbar-width:thin]">
      ${ABAS.map(subAba).join('')}
    </div>

    <div id="acoes-aba" class="mb-4 flex flex-wrap items-center gap-2 empty:hidden"></div>
    <div id="conteudo-aba"></div>`;

  el.querySelector('#btn-editar').addEventListener('click', () => abrirModalCurso(c.id));
  el.querySelector('#btn-mais').addEventListener('click', (e) => abrirMenu(e.currentTarget, itensMais));
  el.querySelector('#btn-ativar')?.addEventListener('click', () => alterarStatus(c.id, 'ativo'));
  el.querySelectorAll('[data-aba]').forEach((b) => b.addEventListener('click', () => { estado.aba = b.dataset.aba; atualizarUrl(); renderCurso(); }));

  ({ dados: renderAbaDados, conteudo: renderAbaConteudo, material: renderAbaMaterial, requisitos: renderAbaRequisitos, oferta: renderAbaOferta })[estado.aba]();
}

// Rascunho pede uma decisão (ativar); curso ativo incompleto pede o que falta. Inativo e completo não têm faixa.
function faixaCurso(c, pend) {
  const lista = pend.map(esc).join(' · ');
  const ativar = `<button type="button" id="btn-ativar" class="${BOTAO_PRI} h-8 shrink-0">Ativar</button>`;
  if (c.status === 'rascunho') {
    return faixa(pend.length ? 'aviso' : 'petrol', `<div class="flex flex-wrap items-center justify-between gap-2"><span><span class="font-medium">Rascunho — não aparece para o comercial.</span> ${pend.length ? `Falta: ${lista}.` : 'Está completo; ative para liberar.'}</span>${ativar}</div>`);
  }
  return pend.length ? faixa('aviso', `<span class="font-medium">${plural(pend.length, 'pendência')} para o curso ficar completo:</span> ${lista}`) : '';
}

// Remoção unitária sem modal: aplica na hora e oferece Desfazer por 6 s. Só desfaz se nada mudou no catálogo depois,
// para não apagar junto uma edição feita nesse meio-tempo.
function removerComDesfazer(novaLista, mensagem) {
  const antes = estado.lista;
  estado.lista = novaLista;
  persistir(); renderCurso();
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.className = 'toast-anim flex items-center gap-3 bg-petrol-900 text-white text-sm pl-4 pr-1.5 py-1.5 rounded-lg shadow-lg';
  el.innerHTML = `<span>${esc(mensagem)}</span><button type="button" class="h-7 px-2.5 rounded-md font-semibold text-areia hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">Desfazer</button>`;
  el.querySelector('button').addEventListener('click', () => {
    el.remove();
    if (estado.lista !== novaLista) { toast('Não dá para desfazer: o curso mudou depois da remoção.'); return; }
    estado.lista = antes;
    persistir(); renderCurso();
    toast('Remoção desfeita.');
  });
  document.getElementById('toast-root').appendChild(el);
  setTimeout(() => el.remove(), 6000);
}

function alterarStatus(id, status) {
  estado.lista = Cursos.alterarStatus(estado.lista, id, status);
  persistir();
  renderCurso();
  toast(`"${atual().nome}" ${status === 'ativo' ? 'ativado.' : 'inativado — sai do catálogo e do site.'}`);
}

// ---------- Aba Dados gerais ----------

function renderAbaDados() {
  const c = atual();
  document.getElementById('acoes-aba').innerHTML = '';
  const k = c.comercial;
  const canais = [k.turmaAberta ? 'Turma aberta' : null, k.inCompany ? 'In company' : null].filter(Boolean);
  const precoHora = k.precoReferencia != null && c.cargaHoraria ? k.precoReferencia / c.cargaHoraria : null;
  document.getElementById('conteudo-aba').innerHTML = `
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <section class="${CARTAO}">
        ${cabecalhoSecao('Identificação e carga horária', 'Como o curso aparece no catálogo e quanto tempo dura.', 'btn-editar-dados')}
        <div class="p-4 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
          ${campo('Código', `<span class="font-mono">${esc(c.codigo)}</span>`)}
          ${campo('Nome', esc(c.nome), 'col-span-2')}
          ${campo('Área', pilulaArea(c.areaId))}
          ${campo('Eixo na matriz', esc(eixoDe(c.eixoId)))}
          ${campo('Nível', `${esc(nivelDe(c.nivel)?.nome ?? '')} <span class="text-xs text-slate-500 dark:text-neutral-400">· ${esc(nivelDe(c.nivel)?.descricao ?? '')}</span>`)}
          ${campo('Carga horária', fmtHoras(c.cargaHoraria))}
          ${campo('Encontros sugeridos', c.encontros ? plural(c.encontros, 'aula') : valorOuVazio(null))}
          ${campo('Duração da aula', c.duracaoAula ? fmtHoras(c.duracaoAula) : valorOuVazio(null))}
          ${campo('Formatos', c.formatos.map((x) => `<span title="${esc(FORMATOS.find((f) => f.id === x)?.descricao ?? '')}">${esc(formatoDe(x))}</span>`).join(' · ') || valorOuVazio(null), 'col-span-3')}
        </div>
      </section>

      <section class="${CARTAO}">
        ${cabecalhoSecao('Descrição', 'Textos usados no site e na proposta comercial.', 'btn-editar-descricao')}
        <div class="p-4 space-y-4">
          ${campo('Resumo (uma linha)', valorOuVazio(c.resumo))}
          ${campo('Descrição / objetivo', `<p class="whitespace-pre-line">${valorOuVazio(c.descricao)}</p>`)}
          ${campo('Público-alvo', valorOuVazio(c.publicoAlvo))}
          ${campo('Pré-requisitos (texto livre)', valorOuVazio(c.preRequisitosTexto, '<span class="text-slate-500 dark:text-neutral-400">nenhum</span>'))}
        </div>
      </section>

      <section class="${CARTAO}">
        ${cabecalhoSecao('Comercial', 'Valores de referência do catálogo; o preço praticado é o da turma ou da proposta.', 'btn-editar-comercial')}
        <div class="p-4 grid grid-cols-2 gap-4">
          ${campo('Preço de referência', k.precoReferencia == null ? valorOuVazio(null) : `<span class="tabular-nums">${fmtMoeda(k.precoReferencia)}</span>${precoHora == null ? '' : ` <span class="text-xs text-slate-500 dark:text-neutral-400 tabular-nums">· ${fmtMoeda(precoHora)} por hora</span>`}`)}
          ${campo('Parcelamento máximo', k.parcelasMax ? `<span class="tabular-nums">${k.parcelasMax}×${k.precoReferencia != null ? ` de ${fmtMoeda(k.precoReferencia / k.parcelasMax)}` : ''}</span>` : valorOuVazio(null))}
          ${campo('Vagas para abrir · máximo', k.vagasMin == null && k.vagasMax == null ? valorOuVazio(null) : `<span class="tabular-nums">${k.vagasMin ?? '—'} · ${k.vagasMax ?? '—'}</span>`)}
          ${campo('Como é vendido', canais.length ? canais.join(' · ') : valorOuVazio(null))}
          ${campo('Site da ProWay', k.publicadoSite ? 'Publicado' : `<span class="text-slate-500 dark:text-neutral-400">${c.status === 'ativo' ? 'não publicado' : 'só curso ativo é publicado'}</span>`)}
        </div>
      </section>
    </div>`;
  document.getElementById('btn-editar-dados').addEventListener('click', () => abrirModalCurso(c.id));
  document.getElementById('btn-editar-descricao').addEventListener('click', () => abrirModalDescricao());
  document.getElementById('btn-editar-comercial').addEventListener('click', () => abrirModalComercial());
}

// ---------- Aba Conteúdo programático ----------

function renderAbaConteudo() {
  const c = atual();
  const acoes = document.getElementById('acoes-aba');
  const todosAbertos = estado.fechados.size === 0;
  const h = Cursos.situacaoHoras(c);
  // Horas que batem não se anunciam em verde; falta é pendência (cobre), excesso é erro.
  const corHoras = { ok: 'text-slate-600 dark:text-neutral-400 font-normal', faltam: AVISO, excede: 'text-red-700 dark:text-red-400', vazio: 'text-slate-600 dark:text-neutral-400 font-normal' }[h.situacao];
  const txtHoras = {
    ok: `${fmtHoras(h.distribuidas)} distribuídas em ${plural(c.modulos.length, 'módulo')}`,
    faltam: `${fmtHoras(h.distribuidas)} de ${fmtHoras(c.cargaHoraria)} distribuídas · faltam ${fmtHoras(h.diferenca)}`,
    excede: `${fmtHoras(h.distribuidas)} distribuídas · excede a carga horária em ${fmtHoras(h.diferenca)}`,
    vazio: `Nenhum módulo — ${fmtHoras(c.cargaHoraria)} a distribuir`,
  }[h.situacao];

  acoes.innerHTML = `
    <span class="text-sm font-medium tabular-nums ${corHoras}">${txtHoras}</span>
    <div class="ml-auto flex items-center gap-2">
      <button type="button" id="btn-expandir" class="${BOTAO_SEC}" ${c.modulos.length ? '' : 'disabled'}>${todosAbertos ? 'Minimizar todos' : 'Expandir todos'}</button>
      <button type="button" id="btn-novo-modulo" class="${BOTAO_PRI}">${ICONE.mais} Novo módulo</button>
    </div>`;
  acoes.querySelector('#btn-expandir').addEventListener('click', () => {
    estado.fechados = todosAbertos ? new Set(c.modulos.map((m) => m.id)) : new Set();
    renderAbaConteudo();
  });
  acoes.querySelector('#btn-novo-modulo').addEventListener('click', () => abrirModalModulo());

  const el = document.getElementById('conteudo-aba');
  if (!c.modulos.length) {
    el.innerHTML = `
      <div class="${CARTAO} border-dashed p-10 text-center">
        <p class="text-sm text-slate-500 dark:text-neutral-400">Sem conteúdo programático. Divida as ${fmtHoras(c.cargaHoraria)} em módulos com seus tópicos — é o que vai para o site e a proposta.</p>
        <button type="button" id="btn-novo-modulo-vazio" class="${BOTAO_PRI} mt-4">${ICONE.mais} Criar o primeiro módulo</button>
      </div>`;
    el.querySelector('#btn-novo-modulo-vazio').addEventListener('click', () => abrirModalModulo());
    return;
  }

  el.innerHTML = `<section class="space-y-3">${c.modulos.map((m, i) => {
    const aberto = !estado.fechados.has(m.id);
    return `
    <div class="${CARTAO}">
      <div class="flex items-center gap-2 px-3 py-2.5">
        <div class="flex flex-col -my-1">
          <button type="button" data-mover="-1" data-id="${m.id}" title="Subir" class="${ICONE_BOTAO} h-5" ${i > 0 ? '' : 'disabled'}>${ICONE.cima}</button>
          <button type="button" data-mover="1" data-id="${m.id}" title="Descer" class="${ICONE_BOTAO} h-5" ${i < c.modulos.length - 1 ? '' : 'disabled'}>${ICONE.baixo}</button>
        </div>
        <button type="button" data-acordeao="${m.id}" aria-expanded="${aberto}" class="flex-1 flex items-center gap-3 min-w-0 text-left px-1 py-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30">
          <span class="text-slate-400 ${aberto ? '' : '-rotate-90'}">${ICONE.chevron}</span>
          <span class="h-8 w-8 shrink-0 rounded-lg bg-petrol-800/10 dark:bg-sky-950/60 text-petrol-800 dark:text-sky-300 grid place-items-center text-sm font-semibold tabular-nums">${i + 1}</span>
          <span class="min-w-0 flex-1">
            <span class="block font-display text-[15px] font-semibold text-slate-900 dark:text-neutral-100 truncate">${esc(m.titulo)}</span>
            <span class="block text-xs text-slate-500 dark:text-neutral-400">${fmtHoras(m.cargaHoraria)} · ${plural(m.topicos.length, 'tópico')}</span>
          </span>
        </button>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" data-editar-modulo="${m.id}" title="Editar" class="${ICONE_BOTAO}">${ICONE.lapis}</button>
          <button type="button" data-excluir-modulo="${m.id}" title="Excluir" class="${ICONE_BOTAO_VERMELHO}">${ICONE.lixeira}</button>
        </div>
      </div>
      ${aberto ? `
      <div class="pl-[124px] pr-4 pb-4">
        ${m.topicos.length ? `<ol class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-700 dark:text-neutral-200 list-decimal list-inside marker:text-slate-500 dark:marker:text-neutral-400 marker:tabular-nums">${m.topicos.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>` : `<p class="text-sm text-slate-500 dark:text-neutral-400">Sem tópicos. <button type="button" data-editar-modulo="${m.id}" class="${BOTAO_LINK}">Adicionar</button></p>`}
      </div>` : ''}
    </div>`;
  }).join('')}</section>`;

  el.querySelectorAll('[data-acordeao]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.acordeao;
    estado.fechados.has(id) ? estado.fechados.delete(id) : estado.fechados.add(id);
    renderAbaConteudo();
  }));
  el.querySelectorAll('[data-mover]').forEach((b) => b.addEventListener('click', () => {
    estado.lista = Cursos.moverModulo(estado.lista, c.id, b.dataset.id, Number(b.dataset.mover));
    persistir();
    renderAbaConteudo();
  }));
  el.querySelectorAll('[data-editar-modulo]').forEach((b) => b.addEventListener('click', () => abrirModalModulo(b.dataset.editarModulo)));
  el.querySelectorAll('[data-excluir-modulo]').forEach((b) => b.addEventListener('click', () => confirmarExclusaoModulo(b.dataset.excluirModulo)));
}

function confirmarExclusaoModulo(moduloId) {
  const c = atual();
  const m = c.modulos.find((x) => x.id === moduloId);
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
      <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Excluir módulo</h3>
    </div>
    <div class="px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 space-y-2">
      <p>Excluir <strong>"${esc(m.titulo)}"</strong> (${fmtHoras(m.cargaHoraria)}, ${plural(m.topicos.length, 'tópico')}) de <strong>${esc(c.nome)}</strong>?</p>
      <p class="text-slate-500 dark:text-neutral-400">Os tópicos vão junto. Turmas já abertas não mudam.</p>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
      <button type="button" id="btn-confirmar" class="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40">Excluir</button>
    </div>`);
  root.querySelector('#btn-confirmar').addEventListener('click', () => {
    estado.lista = Cursos.removerModulo(estado.lista, c.id, moduloId);
    persistir();
    fecharModal();
    renderCurso();
    toast(`"${m.titulo}" excluído.`);
  });
}

// ---------- Aba Requisitos ----------

// ---------- Aba Material didático ----------

function fmtTamanho(bytes) {
  if (bytes == null) return '';
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1).replace('.', ',')} MB`;
  return `${Math.max(1, Math.round(bytes / 1000))} KB`;
}

function dominioDe(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch (_) { return url; }
}

function renderAbaMaterial() {
  const c = atual();
  const acoes = document.getElementById('acoes-aba');
  const termo = Cursos.normalizar(estado.buscaMaterial ?? '');
  const tipoFiltro = estado.tipoMaterial ?? '';
  const moduloDe = (id) => c.modulos.find((m) => m.id === id);
  const itens = c.materiais
    .filter((m) => (!tipoFiltro || m.tipo === tipoFiltro) && (!termo || Cursos.normalizar(`${m.nome} ${m.descricao} ${m.url} ${m.arquivo?.nome ?? ''}`).includes(termo)))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const pendentes = c.materiais.filter(Cursos.materialPendente).length;
  const totais = TIPOS_MATERIAL.map((t) => `${c.materiais.filter((m) => m.tipo === t.id).length} ${t.nome.toLowerCase()}${c.materiais.filter((m) => m.tipo === t.id).length === 1 ? '' : 's'}`).join(' · ');

  acoes.innerHTML = `
    <span class="text-sm text-slate-600 dark:text-neutral-400 tabular-nums">${c.materiais.length ? totais : 'Nenhum material'}${pendentes ? ` · <span class="${AVISO}">${plural(pendentes, 'pendente')}</span>` : ''}</span>
    <div class="ml-auto flex items-center gap-2">
      ${busca('busca-material', estado.buscaMaterial ?? '', 'Buscar material', 'w-56')}
      ${campoCombo('filtro-tipo-material', TIPOS_MATERIAL.map((t) => ({ id: t.id, nome: t.nome })), tipoFiltro, { id: 'filtro-tipo-material', vazio: 'Todos os tipos', filtro: true })}
      <button type="button" id="btn-novo-material" class="${BOTAO_PRI}">${ICONE.mais} Novo material</button>
    </div>`;

  const meta = (m) => {
    const p = Cursos.materialPendente(m);
    if (p) return `<span class="${AVISO}">${p}</span>`;
    if (m.tipo === 'arquivo') return `${esc(m.arquivo.nome)} · ${fmtTamanho(m.arquivo.tamanho)}`;
    if (m.tipo === 'video') return `${esc(dominioDe(m.url))}${m.duracaoMin ? ` · ${m.duracaoMin} min` : ''}`;
    return esc(dominioDe(m.url));
  };

  document.getElementById('conteudo-aba').innerHTML = `
    <section class="${CARTAO}">
      <ul class="divide-y divide-slate-100 dark:divide-neutral-900">
        ${itens.length ? itens.map((m) => {
          const mod = moduloDe(m.moduloId);
          const abrir = m.tipo === 'arquivo' ? (m.arquivo ? `<button type="button" data-baixar-material="${m.id}" class="${BOTAO_LINK}">Baixar</button>` : '') : (m.url ? `<a href="${esc(m.url)}" target="_blank" rel="noopener" class="${BOTAO_LINK}">Abrir</a>` : '');
          return `
          <li class="flex items-center gap-3 px-4 py-2.5">
            <span class="h-8 w-8 rounded-lg grid place-items-center shrink-0 bg-slate-100 dark:bg-neutral-900 text-slate-500 dark:text-neutral-400">${ICONE[m.tipo]}</span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-slate-800 dark:text-neutral-100 truncate">${esc(m.nome)}</p>
              <p class="text-xs text-slate-500 dark:text-neutral-400 truncate">${meta(m)}${mod ? ` · <span title="Módulo">${esc(mod.titulo)}</span>` : ''}${m.descricao ? ` · ${esc(m.descricao)}` : ''}</p>
            </div>
            ${pilula(PILULA.neutra, nomeDe(TIPOS_MATERIAL, m.tipo))}
            ${abrir}
            <button type="button" data-editar-material="${m.id}" title="Editar" class="${ICONE_BOTAO}">${ICONE.lapis}</button>
            <button type="button" data-remover-material="${m.id}" title="Remover material" class="${ICONE_BOTAO_VERMELHO}">${ICONE.lixeira}</button>
          </li>`;
        }).join('') : `<li class="px-4 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">${c.materiais.length ? 'Nenhum material com esse filtro.' : 'Nenhum material — adicione vídeos, arquivos e links que o aluno recebe.'}</li>`}
      </ul>
    </section>`;

  acoes.querySelector('#busca-material').addEventListener('input', (e) => { estado.buscaMaterial = e.target.value; renderAbaMaterial(); acoes.querySelector('#busca-material').focus(); acoes.querySelector('#busca-material').setSelectionRange(e.target.value.length, e.target.value.length); });
  acoes.querySelector('[data-name="filtro-tipo-material"] input[type="hidden"]').addEventListener('change', (e) => { estado.tipoMaterial = e.target.value; renderAbaMaterial(); });
  ativarCombos(acoes);
  acoes.querySelector('#btn-novo-material').addEventListener('click', () => abrirModalMaterial());
  const el = document.getElementById('conteudo-aba');
  el.querySelectorAll('[data-editar-material]').forEach((b) => b.addEventListener('click', () => abrirModalMaterial(b.dataset.editarMaterial)));
  el.querySelectorAll('[data-baixar-material]').forEach((b) => b.addEventListener('click', () => {
    const m = c.materiais.find((x) => x.id === b.dataset.baixarMaterial);
    toast(`Download de "${m.arquivo.nome}" simulado — o protótipo não guarda o conteúdo do arquivo.`);
  }));
  el.querySelectorAll('[data-remover-material]').forEach((b) => b.addEventListener('click', () => {
    const m = c.materiais.find((x) => x.id === b.dataset.removerMaterial);
    removerComDesfazer(Cursos.removerMaterial(estado.lista, c.id, m.id), `"${m.nome}" removido.`);
  }));
}

const SUB_REQUISITOS = [
  { id: 'pre', titulo: 'Pré-requisitos' },
  { id: 'instrutores', titulo: 'Instrutores' },
  { id: 'infra', titulo: 'Softwares' }, // id antigo mantido: links ?sub=infra continuam abrindo aqui
];

// Requisitos é dividido em partes (controle segmentado) para cada lista crescer sem empurrar as outras.
function renderAbaRequisitos() {
  const c = atual();
  const sub = SUB_REQUISITOS.some((x) => x.id === estado.subRequisitos) ? estado.subRequisitos : 'pre';
  estado.subRequisitos = sub;
  const pre = c.preRequisitoCursoIds.map((id) => Cursos.porId(estado.lista, id)).filter(Boolean).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const instrutores = c.instrutorIds.map(instrutorDe).filter(Boolean).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const infra = c.infraestrutura;
  const softwares = infra.softwares
    .map((item) => ({ item, cat: item.softwareId ? softwareDoCatalogo(item.softwareId) : null, chave: Cursos.chaveSoftware(item) }))
    .sort((a, b) => a.item.nome.localeCompare(b.item.nome, 'pt-BR'));
  const sugestoes = sugestoesSoftware(c);
  const pendentes = sugestoes.filter((x) => x.status === 'pendente');
  const respondidas = sugestoes.filter((x) => x.status !== 'pendente');
  const contagem = { pre: pre.length, instrutores: instrutores.length, infra: softwares.length };
  const listaVazia = (texto) => `<li class="px-4 py-8 text-center text-sm text-slate-500 dark:text-neutral-400">${texto}</li>`;
  const LISTA = 'mt-3 border-t border-slate-100 dark:border-neutral-900 divide-y divide-slate-100 dark:divide-neutral-900';

  const acoesSub = {
    pre: `<button type="button" id="btn-add-pre" class="${BOTAO_PRI}">${ICONE.mais} Adicionar cursos</button>`,
    instrutores: `<button type="button" id="btn-add-instrutor" class="${BOTAO_PRI}">${ICONE.mais} Adicionar instrutores</button>`,
    infra: `<button type="button" id="btn-add-software-livre" class="${BOTAO_SEC}">Fora do catálogo</button>
            <button type="button" id="btn-add-software" class="${BOTAO_PRI}">${ICONE.mais} Adicionar do catálogo</button>`,
  };
  const acoes = document.getElementById('acoes-aba');
  const parte = (x) => `
      <button type="button" data-sub="${x.id}" aria-pressed="${sub === x.id}" class="h-7 px-2.5 rounded-md text-[12.5px] font-medium whitespace-nowrap transition ${sub === x.id ? 'bg-[color:var(--f-elevado)] text-[color:var(--f-tinta)] shadow-[0_1px_2px_rgb(7_30_44/0.08)]' : 'text-[color:var(--f-tinta-2)] hover:text-[color:var(--f-tinta)]'}">${x.titulo}<span class="ml-1 text-xs tabular-nums text-[color:var(--f-tinta-3)]">${contagem[x.id]}</span>${x.id === 'infra' && pendentes.length ? `<span class="ml-1.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 text-[11px] font-semibold tabular-nums" title="${esc(plural(pendentes.length, 'sugestão de instrutor esperando resposta', 'sugestões de instrutores esperando resposta'))}">${pendentes.length}</span>` : ''}</button>`;
  acoes.innerHTML = `
    <div class="inline-flex rounded-lg bg-[color:var(--f-etiqueta)] p-0.5">${SUB_REQUISITOS.map(parte).join('')}</div>
    <div class="ml-auto flex items-center gap-2">${acoesSub[sub]}</div>`;
  acoes.querySelectorAll('[data-sub]').forEach((b) => b.addEventListener('click', () => { estado.subRequisitos = b.dataset.sub; atualizarUrl(); renderAbaRequisitos(); }));

  const conteudo = {
    pre: `
      <section class="${CARTAO}">
        ${cabecalhoSecao('Cursos exigidos', 'O aluno precisa ter concluído estes cursos antes. O texto livre de pré-requisitos fica em Dados gerais › Descrição.')}
        <ul class="${LISTA}">
          ${pre.length ? pre.map((p) => `
          <li class="flex items-center gap-3 px-4 py-2.5">
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-slate-800 dark:text-neutral-100"><span class="font-mono text-xs text-slate-500 dark:text-neutral-400 mr-1.5">${esc(p.codigo)}</span>${esc(p.nome)}</p>
              <p class="text-xs text-slate-500 dark:text-neutral-400">${esc(eixoDe(p.eixoId))} · ${fmtHoras(p.cargaHoraria)} · ${esc(nivelDe(p.nivel)?.nome ?? '')}</p>
            </div>
            <button type="button" data-abrir-curso="${p.id}" class="${BOTAO_LINK}">Abrir</button>
            <button type="button" data-remover-pre="${p.id}" title="Remover pré-requisito" class="${ICONE_BOTAO_VERMELHO}">${ICONE.lixeira}</button>
          </li>`).join('') : listaVazia('Nenhum curso como pré-requisito.')}
        </ul>
      </section>`,
    instrutores: `
      <section class="${CARTAO}">
        ${cabecalhoSecao('Instrutores habilitados', 'Quem pode ser alocado nas turmas deste curso.')}
        <ul class="${LISTA}">
          ${instrutores.length ? instrutores.map((i) => `
          <li class="flex items-center gap-3 px-4 py-2.5">
            <div class="h-8 w-8 rounded-full bg-petrol-800 text-white grid place-items-center text-xs font-semibold shrink-0">${esc(i.nome.split(' ').map((p) => p[0]).slice(0, 2).join(''))}</div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(i.nome)}</p>
              <p class="text-xs text-slate-500 dark:text-neutral-400">${esc(i.especialidade)}</p>
            </div>
            <button type="button" data-remover-instrutor="${i.id}" title="Remover habilitação" class="${ICONE_BOTAO_VERMELHO}">${ICONE.lixeira}</button>
          </li>`).join('') : listaVazia('Nenhum instrutor habilitado — sem isso não dá para abrir turma.')}
        </ul>
      </section>`,
    infra: `
      ${sugestoes.length ? `
      <section class="${CARTAO} mb-4">
        ${cabecalhoSecao(`Sugestões dos instrutores${pendentes.length ? ` <span class="ml-1 text-sm font-medium ${AVISO} tabular-nums">${pendentes.length}</span>` : ''}`, 'Vieram das turmas, pelo Portal do Professor. O instrutor já ajustou a turma dele; aceitar leva a mudança para o catálogo do curso — e para as próximas turmas.')}
        <ul class="${LISTA}">
          ${pendentes.length ? pendentes.map((sg) => `
          <li class="flex items-start gap-3 px-4 py-3">
            <div class="min-w-0 flex-1">
              <p class="text-sm text-slate-800 dark:text-neutral-100">${esc(Cursos.textoSugestao(sg))}</p>
              ${sg.observacao ? `<p class="text-xs text-slate-700 dark:text-neutral-300 mt-0.5">${esc(sg.observacao)}</p>` : ''}
              ${sg.site ? `<p class="text-xs mt-0.5"><a href="${esc(sg.site)}" target="_blank" rel="noopener" class="${BOTAO_LINK}">${esc(sg.site.replace(/^https?:\/\//, ''))}</a></p>` : ''}
              <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(sg.instrutorNome || 'Instrutor')}${sg.turmaCodigo ? ` · turma ${esc(sg.turmaCodigo)}` : ''} · ${esc(fmtDataHora(sg.em))}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button type="button" data-recusar-sug="${esc(sg.id)}" class="${BOTAO_FANTASMA}">Recusar</button>
              <button type="button" data-aceitar-sug="${esc(sg.id)}" class="${BOTAO_SEC}">Aceitar</button>
            </div>
          </li>`).join('') : `<li class="px-4 py-3 text-sm text-slate-500 dark:text-neutral-400">Nenhuma sugestão esperando resposta.</li>`}
        </ul>
        ${respondidas.length ? `
        <details class="px-4 py-2.5 border-t border-slate-100 dark:border-neutral-900">
          <summary class="cursor-pointer text-xs text-slate-500 dark:text-neutral-400">${plural(respondidas.length, 'sugestão já respondida', 'sugestões já respondidas')}</summary>
          <ul class="mt-2 space-y-1.5">
            ${respondidas.map((sg) => `<li class="text-xs text-slate-500 dark:text-neutral-400">${pilula(sg.status === 'aceita' ? PILULA.ativo : PILULA.neutra, sg.status === 'aceita' ? 'aceita' : 'recusada')} ${esc(Cursos.textoSugestao(sg))} — ${esc(sg.instrutorNome || 'Instrutor')}${sg.turmaCodigo ? ` · ${esc(sg.turmaCodigo)}` : ''}${sg.motivo ? ` · ${esc(sg.motivo)}` : ''}</li>`).join('')}
          </ul>
        </details>` : ''}
      </section>` : ''}
      <section class="${CARTAO}">
        ${cabecalhoSecao('Softwares', 'O aluno vê esta lista para instalar os programas no computador antes das aulas.')}
        <ul class="${LISTA}">
          ${softwares.length ? softwares.map(({ item, cat, chave }) => `
          <li class="flex items-center gap-3 px-4 py-2">
            <div class="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-2">
              <span class="text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(item.nome)}</span>
              ${cat?.versao ? `<span class="text-xs text-slate-500 dark:text-neutral-400">${esc(cat.versao)}</span>` : ''}
              <span class="text-xs text-slate-500 dark:text-neutral-400 truncate">${cat ? esc(cat.grupo) + (cat.requisitos ? ` · requer ${esc(cat.requisitos)}` : '') : 'sem roteiro de instalação no suporte'}${item.observacao ? ` · <span class="text-slate-700 dark:text-neutral-300">${esc(item.observacao)}</span>` : ''}</span>
            </div>
            ${cat ? '' : pilula(PILULA.neutra, 'fora do catálogo')}
            ${cat?.site || item.site ? `<a href="${esc(cat?.site || item.site)}" target="_blank" rel="noopener" class="${BOTAO_LINK}" title="${esc(cat?.site || item.site)}">Site</a>` : ''}
            <button type="button" data-obs-software="${esc(chave)}" title="Observação (versão, configuração, licença…)" class="${ICONE_BOTAO}">${ICONE.lapis}</button>
            <button type="button" data-remover-software="${esc(chave)}" title="Remover software" class="${ICONE_BOTAO_VERMELHO}">${ICONE.lixeira}</button>
          </li>`).join('') : listaVazia('Nenhum software requerido.')}
        </ul>
      </section>`,
  };
  const el = document.getElementById('conteudo-aba');
  el.innerHTML = conteudo[sub];

  acoes.querySelector('#btn-add-pre')?.addEventListener('click', () => abrirSeletorPreRequisitos());
  acoes.querySelector('#btn-add-instrutor')?.addEventListener('click', () => abrirSeletorInstrutores());
  acoes.querySelector('#btn-add-software')?.addEventListener('click', () => abrirSeletorSoftwares());
  acoes.querySelector('#btn-add-software-livre')?.addEventListener('click', () => abrirModalSoftwareLivre());
  el.querySelectorAll('[data-aceitar-sug]').forEach((b) => b.addEventListener('click', () => {
    const sg = Cursos.sugestoesRequisitos(c).find((x) => x.id === b.dataset.aceitarSug);
    estado.lista = Cursos.aceitarSugestao(estado.lista, c.id, b.dataset.aceitarSug, AUTOR_SUGESTOES);
    persistir(); renderCurso();
    toast(`Sugestão aceita — ${sg ? Cursos.textoSugestao(sg).toLowerCase() : 'curso atualizado'}.`);
  }));
  el.querySelectorAll('[data-recusar-sug]').forEach((b) => b.addEventListener('click', () => abrirModalRecusarSugestao(b.dataset.recusarSug)));
  el.querySelectorAll('[data-obs-software]').forEach((b) => b.addEventListener('click', () => abrirModalObservacaoSoftware(b.dataset.obsSoftware)));
  el.querySelectorAll('[data-remover-software]').forEach((b) => b.addEventListener('click', () => {
    const item = c.infraestrutura.softwares.find((x) => Cursos.chaveSoftware(x) === b.dataset.removerSoftware);
    removerComDesfazer(Cursos.removerSoftware(estado.lista, c.id, b.dataset.removerSoftware), `"${item.nome}" removido dos softwares requeridos.`);
  }));
  el.querySelectorAll('[data-abrir-curso]').forEach((b) => b.addEventListener('click', () => selecionar(b.dataset.abrirCurso)));
  el.querySelectorAll('[data-remover-pre]').forEach((b) => b.addEventListener('click', () => {
    const p = Cursos.porId(estado.lista, b.dataset.removerPre);
    removerComDesfazer(Cursos.definirPreRequisitos(estado.lista, c.id, c.preRequisitoCursoIds.filter((x) => x !== p.id)), `"${p.nome}" removido dos pré-requisitos.`);
  }));
  el.querySelectorAll('[data-remover-instrutor]').forEach((b) => b.addEventListener('click', () => {
    const i = instrutorDe(b.dataset.removerInstrutor);
    removerComDesfazer(Cursos.definirInstrutores(estado.lista, c.id, c.instrutorIds.filter((x) => x !== i.id)), `${i.nome} não está mais habilitado para este curso.`);
  }));
}

// ---------- Aba Onde é oferecido (só leitura) ----------

function renderAbaOferta() {
  const c = atual();
  document.getElementById('acoes-aba').innerHTML = '';
  const formacoes = Cursos.formacoesDoCurso(c.id);
  const turmas = Cursos.turmasDoCurso(c.id);
  const tabela = (titulo, sub, colunas, linhas, vazio) => `
    <section class="${CARTAO} overflow-x-auto">
      ${cabecalhoSecao(titulo, sub)}
      <table class="mt-3 w-full text-left">
        <thead class="${THEAD} border-t">
          <tr>${colunas.map((x) => `<th class="${TH}">${x}</th>`).join('')}</tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
          ${linhas.length ? linhas.join('') : `<tr><td colspan="${colunas.length}" class="px-4 py-6 text-center text-sm text-slate-500 dark:text-neutral-400">${vazio}</td></tr>`}
        </tbody>
      </table>
    </section>`;
  const td = (x, extra = '') => `<td class="px-4 py-2.5 text-sm text-slate-600 dark:text-neutral-300 ${extra}">${x}</td>`;

  document.getElementById('conteudo-aba').innerHTML = `
    <div class="space-y-4">
        ${tabela(`Formações <span class="ml-1 text-sm font-normal text-slate-500 dark:text-neutral-400 tabular-nums">${formacoes.length}</span>`, 'Formações que incluem este curso. Cadastro e grade ficam em <a href="formacoes.html" class="text-petrol-800 dark:text-sky-300 hover:underline">Formações</a>.', ['Sigla', 'Formação'], [...formacoes].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map((f) => `
          <tr>
            ${td(`<a href="formacao.html?id=${encodeURIComponent(f.id)}" class="font-mono font-medium text-slate-800 dark:text-neutral-100 hover:underline">${esc(f.codigo || '—')}</a>`, 'whitespace-nowrap w-px')}
            ${td(`<a href="formacao.html?id=${encodeURIComponent(f.id)}" class="font-medium text-slate-800 dark:text-neutral-100 hover:underline">${esc(f.nome)}</a>`)}
          </tr>`), 'Este curso não faz parte de nenhuma formação.')}
        ${tabela(`Turmas <span class="ml-1 text-sm font-normal text-slate-500 dark:text-neutral-400 tabular-nums">${turmas.length}</span>`, 'Turmas abertas deste curso. São cadastradas em <a href="turmas.html" class="text-petrol-800 dark:text-sky-300 hover:underline">Turmas</a>.', ['Turma', 'Tipo', 'Instrutor', 'Turno · formato', 'Período', 'Vagas'], turmas.map((t) => `
          <tr>
            ${td(`<a href="turma.html?id=${t.id}" target="_blank" class="font-medium text-slate-800 dark:text-neutral-100 hover:underline">${esc(t.codigo)}</a>`)}
            ${td(pilula(PILULA.neutra, TIPOS_TURMA[t.tipo]))}
            ${td(esc(instrutorDe(t.instrutorId)?.nome ?? ''))}
            ${td(`${esc(t.turno)} · ${esc(formatoDe(t.formato))}`, 'whitespace-nowrap')}
            ${td(`${dataCurta(t.inicio)} → ${dataCurta(t.fim)}`, 'tabular-nums whitespace-nowrap text-xs')}
            ${td(String(t.vagas), 'tabular-nums')}
          </tr>`), 'Nenhuma turma deste curso.')}
    </div>`;
}

// ---------- Formulários ----------
// Modal-formulário, combobox com busca, mostrarErros e pontoStatus vêm de js/ui-form.js.

const ERRO = (campo) => `<p data-erro="${campo}" class="text-xs text-red-600 dark:text-red-400 mt-1 hidden"></p>`;
const OPCIONAL = '<span class="font-normal text-slate-500 dark:text-neutral-400">(opcional)</span>';

const campoTexto = (name, rotulo, valor, { tipo = 'text', placeholder = '', max = '', extra = '', opcional = false, sufixo = '' } = {}) => `
  <div>
    <label class="rotulo" for="f-${name}">${rotulo} ${opcional ? OPCIONAL : ''}</label>
    <div class="relative">
      <input id="f-${name}" name="${name}" type="${tipo}" ${max ? `maxlength="${max}"` : ''} ${extra} class="campo ${sufixo ? 'pr-10' : ''}" placeholder="${esc(placeholder)}" value="${esc(valor ?? '')}">
      ${sufixo ? `<span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">${sufixo}</span>` : ''}
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

const campoSwitch = (name, rotulo, descricao, marcado, extra = '') => `
  <label class="flex items-center justify-between gap-3 cursor-pointer">
    <span><span class="text-sm font-medium text-slate-800 dark:text-neutral-100">${rotulo}</span><br><span class="text-xs text-slate-500 dark:text-neutral-400">${descricao}</span></span>
    <input type="checkbox" name="${name}" class="${CHECK}" ${marcado ? 'checked' : ''} ${extra}>
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

// ---------- Modal do curso (dados gerais) ----------

function abrirModalCurso(id = null) {
  const c = id ? Cursos.porId(estado.lista, id) : null;
  const d = c ?? { codigo: '', nome: '', areaId: '', eixoId: '', nivel: null, cargaHoraria: '', encontros: '', duracaoAula: '', formatos: [], resumo: '', status: null };
  modalFormulario({
    id: 'form-curso',
    titulo: c ? 'Editar dados do curso' : 'Novo curso',
    subtitulo: c ? 'Identificação, carga horária e formatos.' : 'Só o essencial. Depois de criar, você completa descrição, conteúdo e requisitos. O curso nasce como <strong>rascunho</strong>.',
    rotulo: c ? 'Salvar alterações' : 'Criar curso',
    largura: 'xl',
    foco: '#f-codigo',
    corpo: `
      <div class="grid grid-cols-3 gap-3">
        ${campoTexto('codigo', 'Código', d.codigo, { placeholder: 'Ex.: HT5', max: 10, extra: 'autocapitalize="characters"' })}
        <div class="col-span-2">${campoTexto('nome', 'Nome', d.nome, { placeholder: 'Ex.: HTML5, CSS3 e JavaScript', max: 100 })}</div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="rotulo" for="f-areaId">Área</label>
          ${campoCombo('areaId', Areas.opcoes(estado.areas, d.areaId), d.areaId, { vazio: 'Escolha a área' })}
          ${ERRO('areaId')}
        </div>
        <div>
          <label class="rotulo" for="f-eixoId">Eixo na matriz</label>
          ${campoCombo('eixoId', EIXOS, d.eixoId, { vazio: 'Escolha o eixo' })}
          ${ERRO('eixoId')}
        </div>
      </div>
      <fieldset>
        <legend class="rotulo">Nível</legend>
        ${cartoesRadio('nivel', NIVEIS, d.nivel)}
        ${ERRO('nivel')}
      </fieldset>
      <div class="grid grid-cols-3 gap-3">
        ${campoTexto('cargaHoraria', 'Carga horária', d.cargaHoraria, { tipo: 'number', extra: 'min="1" step="0.5"', sufixo: 'h' })}
        ${campoTexto('encontros', 'Encontros', d.encontros, { tipo: 'number', extra: 'min="1" step="1"', opcional: true, sufixo: 'aulas' })}
        ${campoTexto('duracaoAula', 'Duração da aula', d.duracaoAula, { tipo: 'number', extra: 'min="0.5" step="0.5"', opcional: true, sufixo: 'h' })}
      </div>
      <fieldset>
        <legend class="rotulo">Formatos em que pode ser oferecido</legend>
        <div class="grid grid-cols-2 gap-2">
          ${FORMATOS.map((f) => `
          <label class="${CARTAO_OPCAO} flex items-start gap-2.5">
            <input type="checkbox" name="formatos" value="${f.id}" class="${CHECK} mt-0.5" ${d.formatos.includes(f.id) ? 'checked' : ''}>
            <span><span class="block text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(f.nome)}</span><span class="block text-xs text-slate-500 dark:text-neutral-400">${esc(f.descricao)}</span></span>
          </label>`).join('')}
        </div>
        ${ERRO('formatos')}
      </fieldset>
      ${campoTexto('resumo', 'Resumo (uma linha)', d.resumo, { placeholder: 'Ex.: Construa páginas web do zero.', max: 140, opcional: true })}
      ${c ? `
      <fieldset>
        <legend class="rotulo">Status</legend>
        ${cartoesRadio('status', STATUS_CURSO, d.status)}
        ${ERRO('status')}
      </fieldset>` : ''}`,
    aoSalvar: (fd) => {
      const novo = {
        codigo: fd.get('codigo') ?? '', nome: fd.get('nome') ?? '', areaId: fd.get('areaId') ?? '', eixoId: fd.get('eixoId') ?? '', nivel: fd.get('nivel'),
        cargaHoraria: fd.get('cargaHoraria'), encontros: fd.get('encontros'), duracaoAula: fd.get('duracaoAula'),
        formatos: fd.getAll('formatos'), resumo: fd.get('resumo') ?? '', status: c ? fd.get('status') : null,
      };
      const erros = Cursos.validarDados(novo, estado.lista, id);
      if (erros.length) return erros;
      if (c) {
        estado.lista = Cursos.atualizarDados(estado.lista, id, novo);
        persistir();
        renderCurso();
        toast(`"${novo.nome.trim()}" atualizado.`);
      } else {
        const r = Cursos.incluir(estado.lista, novo);
        estado.lista = r.lista;
        persistir();
        toast(`"${r.curso.nome}" criado como rascunho.`);
        selecionar(r.curso.id);
      }
    },
  });
}

// Duplicar pede código e nome antes de criar.
function abrirModalDuplicar(origemId) {
  const origem = Cursos.porId(estado.lista, origemId);
  const { form } = modalFormulario({
    id: 'form-duplicar',
    titulo: 'Duplicar curso',
    subtitulo: `Cópia de <strong>${esc(origem.nome)}</strong> com tudo igual (${plural(origem.modulos.length, 'módulo')}, requisitos, comercial), em <strong>rascunho</strong> e fora do site.`,
    rotulo: 'Criar cópia',
    foco: '#f-nome',
    corpo: `
      ${campoTexto('codigo', 'Código', Cursos.codigoDeCopia(estado.lista, origem.codigo), { max: 10 })}
      ${campoTexto('nome', 'Nome', Cursos.nomeDeCopia(estado.lista, origem.nome), { max: 100 })}`,
    aoSalvar: (fd) => {
      const dados = { ...origem, codigo: fd.get('codigo') ?? '', nome: fd.get('nome') ?? '' };
      const erros = Cursos.validarDados(dados, estado.lista, null).filter((e) => ['codigo', 'nome'].includes(e.campo));
      if (erros.length) return erros;
      const r = Cursos.duplicar(estado.lista, origemId, dados);
      estado.lista = r.lista;
      persistir();
      toast(`"${r.curso.nome}" criado a partir de "${origem.nome}".`);
      selecionar(r.curso.id);
    },
  });
  form.querySelector('#f-nome').select();
}

function confirmarExclusao(id) {
  const c = Cursos.porId(estado.lista, id);
  const dep = Cursos.dependentes(estado.lista, id);
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
      <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Excluir curso</h3>
    </div>
    <div class="px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 space-y-2">
      <p>Excluir <strong>${esc(c.codigo)} · ${esc(c.nome)}</strong> com ${plural(c.modulos.length, 'módulo')} e ${plural(c.materiais.length, 'material', 'materiais')}?</p>
      ${dep.length ? `<p class="text-slate-500 dark:text-neutral-400">Deixa de ser pré-requisito de: ${dep.map((d) => esc(d.nome)).join(', ')}.</p>` : ''}
      <p class="text-slate-500 dark:text-neutral-400">Não tem turmas nem formações vinculadas, por isso pode ser excluído. Se quiser só tirar do catálogo, prefira <em>inativar</em>.</p>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
      <button type="button" id="btn-confirmar" class="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40">Excluir</button>
    </div>`);
  root.querySelector('#btn-confirmar').addEventListener('click', () => {
    estado.lista = Cursos.remover(estado.lista, id);
    persistir();
    fecharModal();
    toast(`"${c.nome}" excluído.`);
    selecionar(null);
  });
}

// ---------- Modais de seção ----------

function abrirModalDescricao() {
  const c = atual();
  modalFormulario({
    id: 'form-descricao',
    titulo: 'Descrição do curso',
    subtitulo: `Em <strong>${esc(c.nome)}</strong> · textos do site e da proposta.`,
    rotulo: 'Salvar alterações',
    largura: 'xl',
    foco: '#f-resumo',
    corpo: `
      ${campoTexto('resumo', 'Resumo (uma linha)', c.resumo, { max: 140, opcional: true, placeholder: 'Chamada curta para o catálogo' })}
      ${campoArea('descricao', 'Descrição / objetivo', c.descricao, { rows: 6, max: 2000, placeholder: 'O que o aluno vai ser capaz de fazer ao final' })}
      ${campoArea('publicoAlvo', 'Público-alvo', c.publicoAlvo, { rows: 2, max: 300, opcional: true })}
      ${campoArea('preRequisitosTexto', 'Pré-requisitos (texto livre)', c.preRequisitosTexto, { rows: 2, max: 300, opcional: true, ajuda: 'Cursos da ProWay como pré-requisito ficam na aba Requisitos.' })}`,
    aoSalvar: (fd) => {
      estado.lista = Cursos.atualizarDescricao(estado.lista, c.id, Object.fromEntries(fd));
      persistir(); renderCurso();
      toast('Descrição atualizada.');
    },
  });
}

function abrirModalMaterial(materialId = null) {
  const c = atual();
  const m = materialId ? c.materiais.find((x) => x.id === materialId) : null;
  let arquivoNovo = null;
  const { form } = modalFormulario({
    id: 'form-material',
    titulo: m ? 'Editar material' : 'Novo material',
    subtitulo: `Em <strong>${esc(c.nome)}</strong> · o que o aluno recebe.`,
    rotulo: m ? 'Salvar alterações' : 'Adicionar',
    largura: 'xl',
    foco: m ? '#f-nome' : null,
    corpo: `
      <fieldset>
        <legend class="rotulo">Tipo</legend>
        ${cartoesRadio('tipo', TIPOS_MATERIAL, m?.tipo ?? null)}
        ${ERRO('tipo')}
      </fieldset>
      <div id="mat-campos" class="space-y-5 ${m ? '' : 'hidden'}">
        ${campoTexto('nome', 'Nome', m?.nome ?? '', { max: 100, placeholder: 'Como o aluno vai ver' })}
        <div data-tipo="video">
          ${campoTexto('url', 'Link do vídeo', m?.tipo === 'video' ? m.url : '', { tipo: 'url', placeholder: 'https://www.youtube.com/watch?v=…' })}
        </div>
        <div data-tipo="video">
          ${campoTexto('duracaoMin', 'Duração', m?.duracaoMin ?? '', { tipo: 'number', extra: 'min="1" step="1"', opcional: true, sufixo: 'min' })}
        </div>
        <div data-tipo="link">
          ${campoTexto('url-link', 'Endereço', m?.tipo === 'link' ? m.url : '', { tipo: 'url', placeholder: 'https://…' })}
        </div>
        <div data-tipo="arquivo">
          <label class="rotulo" for="f-arquivo">Arquivo</label>
          <div id="mat-arquivo-atual" class="${m?.arquivo ? '' : 'hidden'} flex items-center gap-2 text-sm text-slate-700 dark:text-neutral-200 mb-2">
            ${ICONE.arquivo}<span id="mat-arquivo-nome">${m?.arquivo ? `${esc(m.arquivo.nome)} · ${fmtTamanho(m.arquivo.tamanho)}` : ''}</span>
          </div>
          <input id="f-arquivo" type="file" class="block w-full text-sm text-slate-600 dark:text-neutral-300 file:mr-3 file:h-9 file:px-3 file:rounded-lg file:border file:border-slate-300 dark:file:border-neutral-700 file:bg-white dark:file:bg-neutral-950 file:text-sm file:font-medium file:text-slate-600 dark:file:text-neutral-300 hover:file:border-petrol-800 cursor-pointer">
          <p class="text-xs text-slate-500 dark:text-neutral-400 mt-1">${m?.arquivo ? 'Escolha outro arquivo para substituir.' : 'PDF, zip, planilha… O protótipo guarda só nome e tamanho.'}</p>
          ${ERRO('arquivo')}
        </div>
        <div>
          <label class="rotulo" for="f-moduloId">Módulo ${OPCIONAL}</label>
          ${campoCombo('moduloId', c.modulos.map((x, i) => ({ id: x.id, nome: `${i + 1}. ${x.titulo}`, descricao: fmtHoras(x.cargaHoraria) })), m?.moduloId ?? '', { vazio: 'Curso inteiro', opcional: true })}
        </div>
        ${campoArea('descricao', 'Descrição', m?.descricao ?? '', { rows: 2, max: 200, opcional: true, placeholder: 'Ex.: usar a partir do módulo 2; versão 2026.' })}
      </div>`,
    aoSalvar: (fd) => {
      const tipo = fd.get('tipo');
      const dados = {
        nome: fd.get('nome') ?? '', tipo,
        url: tipo === 'link' ? fd.get('url-link') : fd.get('url'),
        duracaoMin: fd.get('duracaoMin'), descricao: fd.get('descricao'), moduloId: fd.get('moduloId'),
        arquivo: arquivoNovo,
      };
      const erros = Cursos.validarMaterial(dados, m).map((e) => (e.campo === 'url' && tipo === 'link' ? { ...e, campo: 'url-link' } : e));
      if (erros.length) return erros;
      estado.lista = m ? Cursos.atualizarMaterial(estado.lista, c.id, m.id, dados) : Cursos.incluirMaterial(estado.lista, c.id, dados);
      persistir(); renderCurso();
      toast(m ? 'Material atualizado.' : `"${dados.nome.trim()}" adicionado.`);
    },
  });
  const mostrarTipo = (tipo) => {
    form.querySelector('#mat-campos').classList.toggle('hidden', !tipo);
    form.querySelectorAll('[data-tipo]').forEach((d) => d.classList.toggle('hidden', d.dataset.tipo !== tipo));
    if (tipo) form.querySelector('#f-nome').focus();
  };
  mostrarTipo(m?.tipo ?? null);
  form.querySelectorAll('[name="tipo"]').forEach((r) => r.addEventListener('change', () => mostrarTipo(r.value)));
  form.querySelector('#f-arquivo').addEventListener('change', (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    arquivoNovo = { nome: f.name, tamanho: f.size, mime: f.type || 'application/octet-stream' };
    form.querySelector('#mat-arquivo-atual').classList.remove('hidden');
    form.querySelector('#mat-arquivo-nome').textContent = `${f.name} · ${fmtTamanho(f.size)}`;
    if (!form.querySelector('#f-nome').value.trim()) form.querySelector('#f-nome').value = f.name.replace(/\.[^.]+$/, '');
  });
}

function abrirModalComercial() {
  const c = atual();
  const k = c.comercial;
  modalFormulario({
    id: 'form-comercial',
    titulo: 'Comercial',
    subtitulo: `Em <strong>${esc(c.nome)}</strong> · valores de referência do catálogo.`,
    rotulo: 'Salvar alterações',
    largura: 'xl',
    foco: '#f-precoReferencia',
    corpo: `
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('precoReferencia', 'Preço de referência', k.precoReferencia, { tipo: 'number', extra: 'min="0" step="10"', opcional: true, sufixo: 'R$' })}
        ${campoTexto('parcelasMax', 'Parcelamento máximo', k.parcelasMax, { tipo: 'number', extra: 'min="1" step="1"', opcional: true, sufixo: '×' })}
        ${campoTexto('vagasMin', 'Vagas mínimas para abrir', k.vagasMin, { tipo: 'number', extra: 'min="1" step="1"', opcional: true })}
        ${campoTexto('vagasMax', 'Vagas máximas', k.vagasMax, { tipo: 'number', extra: 'min="1" step="1"', opcional: true })}
      </div>
      <fieldset class="space-y-4">
        <legend class="rotulo">Como é vendido</legend>
        ${campoSwitch('turmaAberta', 'Turma aberta', 'Vendido por vaga, com calendário da ProWay.', k.turmaAberta)}
        ${campoSwitch('inCompany', 'In company', 'Turma fechada para uma empresa, por proposta.', k.inCompany)}
      </fieldset>
      ${campoSwitch('publicadoSite', 'Publicado no site', c.status === 'ativo' ? 'Aparece no catálogo público da ProWay.' : 'Só cursos ativos podem ser publicados no site.', k.publicadoSite, c.status === 'ativo' ? '' : 'disabled')}`,
    aoSalvar: (fd) => {
      const dados = { precoReferencia: fd.get('precoReferencia'), parcelasMax: fd.get('parcelasMax'), vagasMin: fd.get('vagasMin'), vagasMax: fd.get('vagasMax'), turmaAberta: fd.has('turmaAberta'), inCompany: fd.has('inCompany'), publicadoSite: c.status === 'ativo' && fd.has('publicadoSite') };
      const erros = Cursos.validarComercial(dados);
      if (erros.length) return erros;
      estado.lista = Cursos.atualizarComercial(estado.lista, c.id, dados);
      persistir(); renderCurso();
      toast('Dados comerciais atualizados.');
    },
  });
}

// ---------- Modal de módulo ----------

function abrirModalModulo(moduloId = null) {
  const c = atual();
  const m = moduloId ? c.modulos.find((x) => x.id === moduloId) : null;
  const d = m ?? { titulo: '', cargaHoraria: '', topicos: [] };
  const h = Cursos.situacaoHoras(c);
  const sugestao = !m && h.situacao !== 'excede' && h.situacao !== 'ok' ? h.diferenca : '';
  modalFormulario({
    id: 'form-modulo',
    titulo: m ? 'Editar módulo' : 'Novo módulo',
    subtitulo: `Em <strong>${esc(c.nome)}</strong> · ${m ? 'a alteração vale para o catálogo; turmas abertas não mudam.' : `entra no fim da lista; depois dá para reordenar. ${h.situacao === 'faltam' || h.situacao === 'vazio' ? `Faltam ${fmtHoras(h.diferenca)} a distribuir.` : ''}`}`,
    rotulo: m ? 'Salvar alterações' : 'Criar módulo',
    largura: 'xl',
    foco: '#f-titulo',
    corpo: `
      <div class="grid grid-cols-3 gap-3">
        <div class="col-span-2">${campoTexto('titulo', 'Título', d.titulo, { max: 100, placeholder: 'Ex.: Fundamentos de HTML5' })}</div>
        ${campoTexto('cargaHoraria', 'Carga horária', d.cargaHoraria || sugestao, { tipo: 'number', extra: 'min="0.5" step="0.5"', sufixo: 'h' })}
      </div>
      ${campoArea('topicos', 'Tópicos', d.topicos.join('\n'), { rows: 8, opcional: true, placeholder: 'Um tópico por linha', ajuda: 'Um por linha, na ordem em que são ensinados.' })}`,
    aoSalvar: (fd) => {
      const dados = { titulo: fd.get('titulo') ?? '', cargaHoraria: fd.get('cargaHoraria'), topicos: fd.get('topicos') ?? '' };
      const erros = Cursos.validarModulo(dados, c.modulos, moduloId);
      if (erros.length) return erros;
      estado.lista = m ? Cursos.atualizarModulo(estado.lista, c.id, moduloId, dados) : Cursos.incluirModulo(estado.lista, c.id, dados);
      persistir(); renderCurso();
      toast(`"${dados.titulo.trim()}" ${m ? 'atualizado.' : 'criado.'}`);
    },
  });
}

// ---------- Seletor múltiplo (modal com busca) ----------

function abrirSeletorMultiplo({ titulo, subtitulo, singular, plural: pluralTxt, itens, aoConfirmar }) {
  const marcados = new Set();
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
      <div>
        <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h3>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${subtitulo}</p>
      </div>
      <button type="button" data-fechar-modal class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${ICONE.fechar}</button>
    </div>
    <div class="px-5 pt-4 pb-2 flex items-center gap-2">
      ${busca('busca-sel', '', `Buscar ${singular}`, 'flex-1')}
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

  const atualizarRodape = () => {
    const n = marcados.size;
    btnConfirmar.disabled = n === 0;
    btnConfirmar.textContent = n ? `Adicionar ${plural(n, singular, pluralTxt)}` : 'Adicionar';
    resumo.textContent = n ? `${n} de ${itens.length} selecionados` : `${plural(itens.length, singular, pluralTxt)} disponíve${itens.length === 1 ? 'l' : 'is'}`;
    const todos = visiveis.length > 0 && visiveis.every((i) => marcados.has(i.id));
    btnMarcar.disabled = visiveis.length === 0;
    btnMarcar.textContent = todos ? 'Desmarcar todos' : `Marcar ${campoBusca.value ? 'encontrados' : 'todos'}`;
  };

  const render = () => {
    const termo = Cursos.normalizar(campoBusca.value);
    visiveis = itens.filter((i) => !termo || Cursos.normalizar(`${i.titulo} ${i.subtitulo}`).includes(termo));
    lista.innerHTML = visiveis.length ? visiveis.map((i) => {
      const on = marcados.has(i.id);
      return `
        <label class="flex items-center gap-3 rounded-lg px-2 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-neutral-900 ${on ? 'bg-petrol-800/5 dark:bg-sky-950/40' : ''}">
          <input type="checkbox" data-marcar="${i.id}" class="${CHECK}" ${on ? 'checked' : ''}>
          <span class="min-w-0 flex-1">
            <span class="block text-sm text-slate-800 dark:text-neutral-100 truncate">${esc(i.titulo)}</span>
            <span class="block text-xs text-slate-500 dark:text-neutral-400 truncate">${esc(i.subtitulo)}</span>
          </span>
          ${i.lado ? `<span class="shrink-0 text-xs text-slate-500 dark:text-neutral-400 truncate max-w-[40%]">${i.lado}</span>` : ''}
        </label>`;
    }).join('') : `<p class="px-2 py-4 text-sm text-slate-500 dark:text-neutral-400">${campoBusca.value ? 'Nenhum resultado.' : `Todos os ${pluralTxt} já estão neste curso.`}</p>`;
    lista.querySelectorAll('[data-marcar]').forEach((ch) => ch.addEventListener('change', () => {
      ch.checked ? marcados.add(ch.dataset.marcar) : marcados.delete(ch.dataset.marcar);
      ch.closest('label').classList.toggle('bg-petrol-800/5', ch.checked);
      ch.closest('label').classList.toggle('dark:bg-sky-950/40', ch.checked);
      atualizarRodape();
    }));
    atualizarRodape();
  };

  btnMarcar.addEventListener('click', () => {
    const todos = visiveis.every((i) => marcados.has(i.id));
    visiveis.forEach((i) => (todos ? marcados.delete(i.id) : marcados.add(i.id)));
    render();
  });
  btnConfirmar.addEventListener('click', () => { aoConfirmar([...marcados]); fecharModal(); });
  campoBusca.addEventListener('input', render);
  render();
  campoBusca.focus();
}

function abrirSeletorPreRequisitos() {
  const c = atual();
  const itens = estado.lista
    .filter((x) => x.id !== c.id && !c.preRequisitoCursoIds.includes(x.id) && x.status !== 'inativo')
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((x) => ({ id: x.id, titulo: `${x.codigo} · ${x.nome}`, subtitulo: `${eixoDe(x.eixoId)} · ${fmtHoras(x.cargaHoraria)} · ${nivelDe(x.nivel)?.nome ?? ''}`, lado: x.preRequisitoCursoIds.includes(c.id) ? `<span class="${AVISO}">tem este curso como pré-requisito</span>` : '' }));
  abrirSeletorMultiplo({
    titulo: 'Adicionar pré-requisitos', subtitulo: `Cursos que o aluno deve concluir antes de <strong>${esc(c.nome)}</strong>.`,
    singular: 'curso', plural: 'cursos', itens,
    aoConfirmar: (ids) => {
      estado.lista = Cursos.definirPreRequisitos(estado.lista, c.id, [...c.preRequisitoCursoIds, ...ids]);
      persistir(); renderCurso();
      toast(`${plural(ids.length, 'pré-requisito')} adicionado${ids.length === 1 ? '' : 's'}.`);
    },
  });
}

function abrirSeletorInstrutores() {
  const c = atual();
  const itens = INSTRUTORES
    .filter((i) => !c.instrutorIds.includes(i.id))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((i) => ({ id: i.id, titulo: i.nome, subtitulo: i.especialidade, lado: `${plural(estado.lista.filter((x) => x.instrutorIds.includes(i.id)).length, 'curso')} habilitado${estado.lista.filter((x) => x.instrutorIds.includes(i.id)).length === 1 ? '' : 's'}` }));
  abrirSeletorMultiplo({
    titulo: 'Habilitar instrutores', subtitulo: `Quem pode dar aula de <strong>${esc(c.nome)}</strong>.`,
    singular: 'instrutor', plural: 'instrutores', itens,
    aoConfirmar: (ids) => {
      estado.lista = Cursos.definirInstrutores(estado.lista, c.id, [...c.instrutorIds, ...ids]);
      persistir(); renderCurso();
      toast(`${plural(ids.length, 'instrutor', 'instrutores')} habilitado${ids.length === 1 ? '' : 's'}.`);
    },
  });
}

function abrirSeletorSoftwares() {
  const c = atual();
  const ja = new Set(c.infraestrutura.softwares.map((s) => s.softwareId).filter(Boolean));
  const usoDe = (id) => estado.lista.filter((x) => x.infraestrutura.softwares.some((s) => s.softwareId === id)).length;
  const itens = SOFTWARES_CATALOGO
    .filter((s) => !ja.has(s.id))
    .sort((a, b) => a.grupo.localeCompare(b.grupo, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((s) => ({
      id: s.id,
      titulo: s.versao ? `${s.nome} · ${s.versao}` : s.nome,
      subtitulo: `${s.grupo}${s.requisitos ? ` · requer ${s.requisitos}` : ''}`,
      lado: usoDe(s.id) ? `em ${plural(usoDe(s.id), 'curso')}` : '',
    }));
  abrirSeletorMultiplo({
    titulo: 'Adicionar softwares do catálogo', subtitulo: `Para as aulas de <strong>${esc(c.nome)}</strong>. Não achou? Use "Fora do catálogo".`,
    singular: 'software', plural: 'softwares', itens,
    aoConfirmar: (ids) => {
      estado.lista = Cursos.adicionarSoftwaresDoCatalogo(estado.lista, c.id, ids);
      persistir(); renderCurso();
      toast(`${plural(ids.length, 'software')} adicionado${ids.length === 1 ? '' : 's'}.`);
    },
  });
}

function abrirModalSoftwareLivre() {
  const c = atual();
  modalFormulario({
    id: 'form-software-livre',
    titulo: 'Software fora do catálogo',
    subtitulo: `Em <strong>${esc(c.nome)}</strong> · o suporte não terá roteiro de instalação para este item; descreva onde baixar e como instalar.`,
    rotulo: 'Adicionar',
    foco: '#f-nome',
    corpo: `
      ${campoTexto('nome', 'Nome', '', { max: 80, placeholder: 'Ex.: Godot 4.3' })}
      ${campoTexto('site', 'Site para baixar', '', { tipo: 'url', opcional: true, placeholder: 'https://godotengine.org/download' })}
      ${campoArea('observacao', 'Observação', '', { rows: 3, max: 300, opcional: true, placeholder: 'Ex.: portable, descompactar em C:\\godot' })}`,
    aoSalvar: (fd) => {
      const dados = { nome: fd.get('nome') ?? '', observacao: fd.get('observacao') ?? '', site: fd.get('site') ?? '' };
      const erros = Cursos.validarSoftwareLivre(dados, c);
      if (erros.length) return erros;
      estado.lista = Cursos.adicionarSoftwareLivre(estado.lista, c.id, dados);
      persistir(); renderCurso();
      toast(`"${dados.nome.trim()}" adicionado.`);
    },
  });
}

function abrirModalRecusarSugestao(sugId) {
  const c = atual();
  const sg = Cursos.sugestoesRequisitos(c).find((x) => x.id === sugId);
  if (!sg) return;
  modalFormulario({
    id: 'form-recusar-sug',
    titulo: 'Recusar sugestão',
    subtitulo: `${esc(Cursos.textoSugestao(sg))} · ${esc(sg.instrutorNome || 'Instrutor')}${sg.turmaCodigo ? ` · turma ${esc(sg.turmaCodigo)}` : ''}. A turma dele continua como está — só o catálogo do curso não muda.`,
    rotulo: 'Recusar',
    foco: '#f-motivo',
    corpo: campoArea('motivo', 'Motivo', '', { rows: 3, max: 300, opcional: true, placeholder: 'Ex.: só faz sentido nesta turma; o laboratório não roda' }),
    aoSalvar: (fd) => {
      estado.lista = Cursos.recusarSugestao(estado.lista, c.id, sugId, AUTOR_SUGESTOES, fd.get('motivo'));
      persistir(); renderCurso();
      toast('Sugestão recusada.');
    },
  });
}

function abrirModalObservacaoSoftware(chave) {
  const c = atual();
  const item = c.infraestrutura.softwares.find((s) => Cursos.chaveSoftware(s) === chave);
  if (!item) return;
  const cat = item.softwareId ? softwareDoCatalogo(item.softwareId) : null;
  modalFormulario({
    id: 'form-obs-software',
    titulo: item.nome,
    subtitulo: cat ? `Catálogo: ${esc(cat.grupo)}${cat.versao ? ` · versão ${esc(cat.versao)}` : ''}${cat.observacao ? `<br><span class="text-slate-500 dark:text-neutral-400">Suporte: ${esc(cat.observacao)}</span>` : ''}` : 'Fora do catálogo.',
    rotulo: 'Salvar alterações',
    foco: '#f-observacao',
    corpo: `${cat ? '' : campoTexto('site', 'Site para baixar', item.site ?? '', { tipo: 'url', opcional: true, placeholder: 'https://godotengine.org/download' })}
      ${campoArea('observacao', 'Observação para este curso', item.observacao, { rows: 3, max: 300, opcional: true, placeholder: 'Ex.: versão específica, extensão, configuração ou licença que a aula precisa' })}`,
    aoSalvar: (fd) => {
      const site = cat ? undefined : String(fd.get('site') ?? '');
      if (site !== undefined) { const erros = Cursos.validarSite(site); if (erros.length) return erros; }
      estado.lista = Cursos.atualizarObservacaoSoftware(estado.lista, c.id, chave, fd.get('observacao'), site);
      persistir(); renderCurso();
      toast('Observação salva.');
    },
  });
}

// ---------- Boot ----------

(function iniciar() {
  const aba = parametroUrl('aba');
  const abaValida = ABAS.some((a) => a.id === aba) ? aba : 'dados';

  if (MODO === 'lista') {
    // URL antiga `cursos.html?curso=X` → redireciona para a página de detalhe.
    const antigo = parametroUrl('curso');
    if (antigo) { location.replace(urlCurso(antigo, abaValida)); return; }
    renderLista();
    if (parametroUrl('erro') === 'nao-encontrado') {
      history.replaceState(null, '', location.pathname);
      toast('Curso não encontrado.');
    }
    return;
  }

  const id = parametroUrl('id');
  if (!id || !Cursos.porId(estado.lista, id)) { location.replace('cursos.html?erro=nao-encontrado'); return; }
  estado.selecionado = id;
  estado.aba = abaValida;
  // `?aba=requisitos&sub=infra` abre direto em Softwares (link vindo da turma).
  const sub = parametroUrl('sub');
  if (SUB_REQUISITOS.some((x) => x.id === sub)) estado.subRequisitos = sub;
  renderCurso();
})();

// ---------- Cards de resumo da lista (catálogo e turmas) ----------

function cartoesResumoCursos() {
  const ativos = estado.lista.filter((c) => c.status === 'ativo').length;
  const turmas = Cursos.todasTurmas().filter((t) => t.status !== 'cancelada');
  const hoje = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10); // data local do navegador
  const andamento = turmas.filter((t) => t.inicio <= hoje && t.fim >= hoje).length;
  const futuras = turmas.filter((t) => t.inicio > hoje).length;
  const cartao = (rotulo, valor, sub) => `
    <div class="${CARTAO} p-4 min-w-0">
      <p class="text-xs font-medium text-slate-500 dark:text-neutral-400">${rotulo}</p>
      <p class="font-display text-2xl font-semibold tabular-nums leading-none mt-1 text-slate-800 dark:text-neutral-100">${valor}</p>
      <p class="text-xs text-slate-500 dark:text-neutral-400 mt-1.5 truncate">${sub}</p>
    </div>`;
  return `
    <div class="grid grid-cols-3 xl:grid-cols-5 gap-3 mb-4">
      ${cartao('Cursos ativos', String(ativos), `${estado.lista.length} no catálogo`)}
      ${cartao('Turmas', String(turmas.length), `${andamento} em andamento · ${futuras} a começar`)}
    </div>`;
}
