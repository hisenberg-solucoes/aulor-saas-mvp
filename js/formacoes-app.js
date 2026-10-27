// ============================================================
// UI da tela "Formações". Regras no motor (Formacoes.*); cursos vêm
// de Cursos.carregar() (mesma persistência da tela de cursos).
// Páginas: formacoes.html (lista) e formacao.html?id= (detalhe com sub-abas
// Cursos (carga por eixo + sequência + turmas por curso) | Alunos | Dados gerais (com Comercial)),
// ambas com este mesmo script — MODO vem de <body data-modo> (docs/padrao-tela-detalhe.md).
// Turmas são criadas na linha do curso (TurmaForm, js/turmas-drawer.js) e
// persistidas por Turmas.* (js/turmas-motor.js); a lista completa fica em turmas.html.
// ============================================================

const MODO = document.body.dataset.modo === 'detalhe' ? 'detalhe' : 'lista';
const PAGINA_LISTA = 'formacoes.html';
const PAGINA_DETALHE = 'formacao.html';

function urlDetalhe(id, aba = 'cursos') {
  return `${PAGINA_DETALHE}?id=${encodeURIComponent(id)}${aba && aba !== 'cursos' ? `&aba=${aba}` : ''}`;
}

const estado = {
  lista: Formacoes.carregar(),
  cursos: Cursos.carregar(),
  areas: Areas.carregar(),
  turmas: Turmas.carregar(),
  salas: Salas.carregar(),
  selecionado: null,
  aba: 'cursos',
  agruparPorEixo: false,
  filtros: { busca: '', status: '', areaId: parametroUrl('area') ?? '', eixoId: '' }, // ?area= vem da contagem em Áreas
  filtrosAlunos: { busca: '', edicaoId: '', situacaoAluno: '' },
};

const ABAS = [
  { id: 'cursos', titulo: 'Cursos' },
  { id: 'alunos', titulo: 'Alunos' },
  { id: 'dados', titulo: 'Dados gerais' },
];
// Comercial virou cartão de Dados gerais (Regra da Linha de Abas); o endereço antigo abre a aba que o absorveu.
const ABAS_ABSORVIDAS = { comercial: 'dados' };

const SITUACOES_ALUNO = [
  { id: 'cursando', nome: 'Cursando' },
  { id: 'congelada', nome: 'Congelada' },
  { id: 'concluido', nome: 'Concluído' },
  { id: 'desistiu', nome: 'Desistiu' },
  { id: 'cancelada', nome: 'Cancelada' },
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
  relogio: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
  lista: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>',
  local: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>',
  areas: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>',
  alerta: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>',
  cadeado: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>',
  alertaMini: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>',
  externo: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>',
  pessoas: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>',
};

const BOTAO_SEC = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-40 disabled:pointer-events-none';
const BOTAO_PRI = 'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/40 disabled:opacity-40 disabled:pointer-events-none';
const BOTAO_FANTASMA = 'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm font-medium text-slate-500 dark:text-neutral-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-40 disabled:pointer-events-none';
const BOTAO_CANCELAR = 'px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition';
const BOTAO_LINK = 'inline-flex items-center gap-1 text-xs font-medium text-petrol-800 dark:text-sky-300 hover:underline';
const ICONE_BOTAO = 'inline-flex items-center justify-center h-7 w-7 rounded-md text-slate-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-30 disabled:pointer-events-none';
const ICONE_BOTAO_VERMELHO = `${ICONE_BOTAO} hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40`;
const CAMPO_BUSCA = 'h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 pl-8 pr-3 text-sm text-slate-700 dark:text-neutral-200 placeholder:text-slate-400 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400 focus:ring-2 focus:ring-petrol-800/20';
const SELECT_FILTRO = 'h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2.5 text-sm text-slate-700 dark:text-neutral-200 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400'; // lida pelo campoCombo de js/ui-form.js
const CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)]';
const CARTAO_OPCAO = 'cursor-pointer rounded-lg border p-3 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 border-slate-300 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500 transition';
const CHECK = 'check';
const TH = 'px-4 py-2.5';
const TD = 'px-4 py-2.5 text-sm text-slate-600 dark:text-neutral-300';
const THEAD = 'text-xs font-medium text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800';
const FOCO_LINHA = 'has-[.link-registro:focus-visible]:bg-slate-50 dark:has-[.link-registro:focus-visible]:bg-neutral-900 has-[.link-registro:focus-visible]:outline-2 has-[.link-registro:focus-visible]:-outline-offset-2 has-[.link-registro:focus-visible]:outline-[color:var(--f-foco)]';
const AVISO = 'text-[color:var(--f-aviso)]';
const FILTRO_ATIVO = 'border-petrol-800 dark:border-sky-400 text-petrol-800 dark:text-sky-300';
// Faixa de grupo dentro da tabela (edição, eixo): rótulo em caixa normal, sem caixa alta espaçada.
const LINHA_GRUPO = 'bg-slate-50 dark:bg-neutral-900 border-y border-slate-200 dark:border-neutral-800';

// Pílula só de exceção (Regra da Pílula de Exceção): ativa, no site, obrigatório e contrato conferido são o comum e não se anunciam.
const PILULA = {
  rascunho: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  inativo: 'bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-400',
  neutra: 'bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-400',
  falta: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  divida: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
};
// Contrato: Adm OK é o fim do caminho e não se anuncia; o que ainda espera alguém é âmbar.
const PILULA_CONTRATO = { rascunho: PILULA.neutra, aguardando: PILULA.falta, comercial_ok: PILULA.falta, cancelado: PILULA.neutra };
// Cobrança: só a dívida aparece; vermelho é dívida do próprio contrato, âmbar o acordo de recuperação (Regra das Fontes Juntas).
const PILULA_COBRANCA = { inadimplente: PILULA.divida, recuperante: PILULA.falta };
// Fases de ciclo de vida: ponto na cor + texto, como a Situação das turmas. Âmbar espera ação; vazado saiu.
const PONTO_TURMA = {
  planejada: 'bg-amber-500',
  confirmada: 'bg-sky-600 dark:bg-sky-400',
  em_andamento: 'bg-emerald-500',
  concluida: 'bg-slate-400 dark:bg-neutral-500',
  cancelada: 'ring-1 ring-inset ring-slate-400 dark:ring-neutral-500',
};
const PONTO_ALUNO = {
  cursando: 'bg-emerald-500',
  congelada: 'bg-amber-500',
  concluido: 'bg-slate-400 dark:bg-neutral-500',
  desistiu: 'ring-1 ring-inset ring-slate-400 dark:ring-neutral-500',
  cancelada: 'ring-1 ring-inset ring-slate-400 dark:ring-neutral-500',
};

// Cor fixa por eixo: só identifica o eixo (ponto ao lado do nome), não vira série de gráfico.
const COR_EIXO = {
  frontend: 'bg-sky-500', backend: 'bg-violet-500', ia: 'bg-fuchsia-500', cross: 'bg-slate-500',
  carreira: 'bg-emerald-500', tcc: 'bg-amber-500', complementar: 'bg-teal-500',
};

// ---------- Helpers ----------

function pilula(classe, texto, titulo = '') {
  return `<span title="${esc(titulo)}" class="pilula inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ${classe}">${esc(texto)}</span>`;
}

const ponto = (classe) => `<span class="inline-block h-2 w-2 shrink-0 rounded-full align-middle -mt-px ${classe}"></span>`;
// Sem eixo é vazado: o ponto diz "não classificado", não uma cor a mais.
const pontoEixo = (id) => ponto(COR_EIXO[id] ?? 'ring-1 ring-inset ring-slate-400 dark:ring-neutral-500');

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

function fmtHoras(h) {
  return h == null ? '—' : `${Number(h).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h`;
}

function fmtMoeda(v) {
  return v == null ? '—' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const nomeDe = (lista, id) => lista.find((x) => x.id === id)?.nome ?? '';
const eixoDe = (id) => nomeDe(EIXOS, id);
// Área: marca quadrada na cor dela + nome em texto (vazada quando a área foi removida). Quadrada para não se passar por ponto de eixo ou de ciclo de vida.
function pilulaArea(id, tamanho = 'text-sm') {
  const a = Areas.porId(estado.areas, id);
  return `<span title="Área" class="inline-flex items-center gap-1.5 whitespace-nowrap ${tamanho} text-slate-600 dark:text-neutral-300"><span class="h-2 w-2 shrink-0 rounded-[2px] ${Areas.cor(a).ponto}"></span>${esc(a?.nome ?? 'Área removida')}</span>`;
}
const formatoDe = (id) => nomeDe(FORMATOS, id);
const nivelDe = (id) => nomeDe(NIVEIS, id);
const statusFormacao = (id) => STATUS_FORMACAO.find((s) => s.id === id);
const statusCurso = (id) => STATUS_CURSO.find((s) => s.id === id);

function valorOuVazio(v, fallback = '<span class="text-slate-500 dark:text-neutral-400">não informado</span>') {
  return v == null || v === '' ? fallback : esc(v);
}

function persistir() {
  Formacoes.salvar(estado.lista);
}

function atual() {
  return Formacoes.porId(estado.lista, estado.selecionado);
}

// Só no detalhe: mantém o id e reflete a aba (parâmetro secundário) na URL.
function atualizarUrl() {
  if (MODO !== 'detalhe' || !estado.selecionado) return;
  const q = new URLSearchParams(location.search);
  q.set('id', estado.selecionado);
  if (estado.aba !== 'cursos') q.set('aba', estado.aba); else q.delete('aba');
  history.replaceState(null, '', `?${q.toString()}`);
}

// Navegação lista ⇄ detalhe: são páginas separadas.
// - id null → volta para a lista;
// - outra formação (ou estamos na lista) → abre formacao.html?id=;
// - mesma formação no detalhe → só troca a aba e re-renderiza.
function selecionar(id, aba = 'cursos') {
  if (!id) { location.href = PAGINA_LISTA; return; }
  if (MODO !== 'detalhe' || id !== estado.selecionado) { location.href = urlDetalhe(id, aba); return; }
  estado.aba = aba;
  atualizarUrl();
  renderFormacao();
  document.querySelector('main')?.scrollTo(0, 0);
}

// Cabeçalho padrão dos cartões: título, frase de contexto e a ação do cartão em botão fantasma; sem divisória.
function cabecalhoSecao(titulo, subtitulo, idBotao, rotulo = 'Editar') {
  return `
    <div class="px-4 pt-4 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="font-display text-[15px] font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h3>
        ${subtitulo ? `<p class="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">${subtitulo}</p>` : ''}
      </div>
      ${idBotao ? `<button type="button" id="${idBotao}" class="${BOTAO_FANTASMA} -mt-1 -mr-1.5 shrink-0">${rotulo === 'Definir' ? ICONE.mais : ICONE.lapis} ${rotulo}</button>` : ''}
    </div>`;
}

// Par rótulo/valor dos cartões de leitura.
function campo(rotulo, valorHtml, largura = '') {
  return `
    <div class="${largura}">
      <p class="text-xs font-medium text-slate-500 dark:text-neutral-400">${rotulo}</p>
      <div class="text-sm text-slate-800 dark:text-neutral-100 mt-0.5 break-words">${valorHtml}</div>
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

// Controle segmentado: partes de uma aba ou modos de ver a mesma lista, na linha das ações.
function segmentado(itens, ativo, atributo) {
  return `<div class="inline-flex rounded-lg bg-[color:var(--f-etiqueta)] p-0.5">${itens.map((x) => `
    <button type="button" ${atributo}="${x.id}" aria-pressed="${ativo === x.id}" class="h-7 px-2.5 rounded-md text-[12.5px] font-medium whitespace-nowrap transition ${ativo === x.id ? 'bg-[color:var(--f-elevado)] text-[color:var(--f-tinta)] shadow-[0_1px_2px_rgb(7_30_44/0.08)]' : 'text-[color:var(--f-tinta-2)] hover:text-[color:var(--f-tinta)]'}">${x.titulo}</button>`).join('')}</div>`;
}

// ---------- Lista ----------

function renderLista() {
  const el = document.getElementById('tela');
  const f = estado.filtros;
  const visiveis = Formacoes.filtrar(estado.lista, estado.cursos, f);
  const filtrando = f.busca || f.status || f.areaId;
  const select = (id, rotulo, opcoes, valor) => campoCombo(id, opcoes, valor, { id, vazio: rotulo, filtro: true, classe: valor ? FILTRO_ATIVO : '' });

  // Ativa é o comum: só rascunho e inativa ganham pílula; a segunda linha troca o resumo pelo que falta, quando falta.
  const linha = (x) => {
    const t = Formacoes.totais(x, estado.cursos);
    const pend = x.status === 'inativo' ? [] : Formacoes.pendencias(x, estado.cursos);
    const s = statusFormacao(x.status);
    return `
      <tr data-abrir="${x.id}" class="cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900 transition ${FOCO_LINHA} ${x.status === 'inativo' ? 'linha-apagada' : ''}">
        <td class="${TH}">
          <p class="truncate"><span class="font-mono text-xs text-slate-500 dark:text-neutral-400 mr-1.5">${esc(x.codigo)}</span><a href="${urlDetalhe(x.id)}" title="${esc(x.nome)}" class="link-registro text-sm font-medium text-slate-800 dark:text-neutral-100 hover:underline underline-offset-2 focus-visible:outline-none">${esc(x.nome)}</a>${x.status === 'ativo' ? '' : ` ${pilula(PILULA[x.status], s.nome, s.descricao)}`}</p>
          ${pend.length
            ? `<p class="text-xs ${AVISO} truncate" title="${esc(pend.join(' · '))}">${plural(pend.length, 'pendência')}: ${esc(pend.join(' · '))}</p>`
            : `<p class="text-xs text-slate-500 dark:text-neutral-400 truncate" title="${esc(x.resumo)}">${esc(x.resumo) || 'sem resumo'}</p>`}
        </td>
        <td class="${TD}">${pilulaArea(x.areaId)}</td>
        <td class="${TD} text-right tabular-nums whitespace-nowrap">${t.n}${t.optativos ? `<span class="block text-xs text-slate-500 dark:text-neutral-400">${t.optativos} optativo${t.optativos === 1 ? '' : 's'}</span>` : ''}</td>
        <td class="${TD} text-right tabular-nums whitespace-nowrap">${fmtHoras(t.horas)}</td>
        <td class="${TD} text-right tabular-nums whitespace-nowrap">${fmtMoeda(x.comercial.precoReferencia)}</td>
      </tr>`;
  };

  el.innerHTML = `
    <div class="mb-4">
      <h2 class="font-display text-xl font-semibold text-slate-900 dark:text-neutral-100">Formações</h2>
      <p class="max-w-3xl text-sm text-slate-600 dark:text-neutral-400 mt-0.5">Conjuntos de cursos do catálogo, em sequência, que podem misturar eixos (Front-end, Back-end, IA, carreira…). A carga horária e os eixos vêm dos cursos; a área de negócio é da própria formação; a formação define ordem, obrigatoriedade e preço.</p>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-2">
      ${busca('busca-formacao', f.busca, 'Buscar por código, nome ou resumo', 'w-64')}
      <div class="ml-auto flex flex-wrap items-center gap-2">
        ${select('filtro-area', 'Área', Areas.opcoes(estado.areas, f.areaId), f.areaId)}
        ${select('filtro-status', 'Status', STATUS_FORMACAO, f.status)}
        ${filtrando ? `<button type="button" id="btn-limpar-filtros" class="${BOTAO_LINK}">Limpar</button>` : ''}
        <button type="button" id="btn-nova" class="${BOTAO_PRI}">${ICONE.mais} Nova formação</button>
      </div>
    </div>

    <div class="${CARTAO} overflow-x-auto">
      <table class="w-full table-fixed text-left">
        <thead class="${THEAD}">
          <tr>
            <th class="${TH}">Formação</th>
            <th class="${TH} w-[190px]">Área</th>
            <th class="${TH} w-[96px] text-right">Cursos</th>
            <th class="${TH} w-[76px] text-right" title="Carga horária">Carga</th>
            <th class="${TH} w-[120px] text-right" title="Preço de referência">Preço ref.</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
          ${visiveis.length ? visiveis.map(linha).join('') : `
          <tr><td colspan="5" class="px-4 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">
            ${estado.lista.length ? 'Nenhuma formação corresponde aos filtros.' : 'Nenhuma formação cadastrada ainda.'}
            ${estado.lista.length ? '' : `<br><button type="button" id="btn-nova-vazio" class="${BOTAO_PRI} mt-4">${ICONE.mais} Criar a primeira formação</button>`}
          </td></tr>`}
        </tbody>
      </table>
      <div class="px-4 py-2.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-sm text-slate-700 dark:text-neutral-200 tabular-nums">${plural(visiveis.length, 'formação', 'formações')}${filtrando ? ` de ${estado.lista.length}` : ''}</div>
    </div>`;

  const campoBusca = el.querySelector('#busca-formacao');
  campoBusca.addEventListener('input', () => { estado.filtros.busca = campoBusca.value; const [ini, fim] = [campoBusca.selectionStart, campoBusca.selectionEnd]; renderLista(); const novo = document.getElementById('busca-formacao'); novo.focus(); novo.setSelectionRange(ini, fim); });
  [['filtro-area', 'areaId'], ['filtro-status', 'status']].forEach(([id, chave]) => {
    el.querySelector(`[data-name="${id}"] input[type="hidden"]`).addEventListener('change', (e) => { estado.filtros[chave] = e.target.value; renderLista(); });
  });
  ativarCombos(el);
  el.querySelector('#btn-limpar-filtros')?.addEventListener('click', () => { estado.filtros = { busca: '', status: '', areaId: '', eixoId: '' }; renderLista(); });
  el.querySelector('#btn-nova').addEventListener('click', () => abrirModalFormacao());
  el.querySelector('#btn-nova-vazio')?.addEventListener('click', () => abrirModalFormacao());
  // O nome é o link (teclado, ⌘-clique); o resto da linha abre a mesma formação, a não ser que a pessoa esteja selecionando texto.
  el.querySelector('tbody').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-abrir]');
    if (!tr || e.target.closest('a, button') || getSelection().toString()) return;
    if (e.metaKey || e.ctrlKey) window.open(urlDetalhe(tr.dataset.abrir), '_blank'); else selecionar(tr.dataset.abrir);
  });
}

// ---------- Formação aberta ----------

function renderFormacao() {
  const el = document.getElementById('tela');
  const f = atual();
  const t = Formacoes.totais(f, estado.cursos);
  const pend = f.status === 'inativo' ? [] : Formacoes.pendencias(f, estado.cursos);
  const nAlunos = Formacoes.alunosDaFormacao(f.id, estado.cursos).length;
  const turmasDaFormacao = Turmas.turmasDaFormacao(estado.turmas, f.id);
  const nTurmas = turmasDaFormacao.filter((x) => x.status !== 'cancelada').length;
  // Turmas e alunos apontam para a formação: excluir deixaria os dois órfãos (mesma regra do curso, docs/cursos.md RN5).
  const podeExcluir = !turmasDaFormacao.length && !nAlunos;
  const contagemAba = { cursos: t.n, alunos: nAlunos };
  const subAba = (a) => `
    <button type="button" data-aba="${a.id}"
      class="px-0.5 pb-2.5 text-sm border-b-2 transition whitespace-nowrap ${estado.aba === a.id ? 'border-[color:var(--f-marca-tinta)] text-slate-900 dark:text-neutral-100 font-medium' : 'border-transparent text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'}">${a.titulo}${contagemAba[a.id] != null ? ` <span class="ml-1 text-xs text-slate-600 dark:text-neutral-400 tabular-nums">${contagemAba[a.id]}</span>` : ''}</button>`;
  // Pílula só de exceção: inativa, e ativa fora do site (o comum é estar publicada). Rascunho fica na faixa.
  const pilulas = f.status === 'inativo' ? pilula(PILULA.inativo, 'Inativa', statusFormacao('inativo').descricao)
    : f.status === 'ativo' && !f.comercial.publicadoSite ? pilula(PILULA.neutra, 'Fora do site', 'Ativa, mas não publicada no site da ProWay') : '';
  // Uma ação à vista; o resto no "Mais", com o motivo de cada item travado.
  const itensMais = [
    { nome: 'Duplicar', detalhe: 'Cópia em rascunho com os mesmos cursos e preço', acao: () => abrirModalDuplicar(f.id) },
    f.status === 'ativo'
      ? { nome: 'Inativar', detalhe: 'Sai do catálogo e do site; turmas e alunos continuam', acao: () => alterarStatus(f.id, 'inativo') }
      : { nome: 'Ativar', detalhe: pend.length ? `Libera para o comercial mesmo com ${plural(pend.length, 'pendência')}` : 'Libera para o comercial', acao: () => alterarStatus(f.id, 'ativo') },
    'sep',
    { nome: 'Excluir formação', perigo: true, desabilitado: !podeExcluir, detalhe: podeExcluir ? 'Os cursos continuam no catálogo' : 'Tem turmas ou alunos vinculados — inative em vez de excluir', acao: () => confirmarExclusao(f.id) },
  ];
  const optativas = t.horasOptativas ? ` · ${fmtHoras(t.horasOptativas)} optativas` : '';

  el.innerHTML = `
    <nav aria-label="Breadcrumb" class="mb-3 flex items-center gap-1.5 text-sm text-slate-600 dark:text-neutral-400">
      <a href="${PAGINA_LISTA}" class="hover:text-petrol-800 dark:hover:text-sky-300 transition">Formações</a>
      <span>/</span>
      <span class="font-medium text-slate-800 dark:text-neutral-100 truncate max-w-xs" aria-current="page">${esc(f.nome)}</span>
    </nav>
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1 basis-80 flex items-start gap-3">
        <div class="h-12 w-12 shrink-0 rounded-xl bg-petrol-800/10 dark:bg-sky-950/60 text-petrol-800 dark:text-sky-300 grid place-items-center px-1 text-center font-mono font-semibold leading-tight break-all ${f.codigo.length > 5 ? 'text-[10.5px]' : f.codigo.length > 4 ? 'text-xs' : 'text-sm'}" title="Código da formação">${esc(f.codigo)}</div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2 min-w-0">
            <h2 class="font-registro text-[26px] leading-[1.15] font-semibold tracking-[-0.01em] text-slate-900 dark:text-neutral-100">${esc(f.nome)}</h2>
            ${pilulas}
          </div>
          ${f.resumo ? `<p class="max-w-3xl text-sm text-slate-600 dark:text-neutral-300 mt-1">${esc(f.resumo)}</p>` : ''}
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
            ${pilulaArea(f.areaId, 'text-[13px]')}
            ${chip(ICONE.lista, `${plural(t.n, 'curso')}${t.optativos ? ` · ${t.optativos} optativo${t.optativos === 1 ? '' : 's'}` : ''}`, 'Cursos da formação')}
            ${chip(ICONE.relogio, `${fmtHoras(t.horas)}${optativas}`, 'Carga horária total')}
            ${t.porEixo.some((x) => x.area.id) ? chip(ICONE.areas, plural(t.porEixo.filter((x) => x.area.id).length, 'eixo'), 'Eixos dos cursos (Front-end, Back-end, IA…)') : ''}
            ${chip(ICONE.pessoas, `${plural(nTurmas, 'turma')} · ${plural(nAlunos, 'aluno')}`, 'Turmas (não canceladas) e alunos matriculados')}
            ${chip(ICONE.local, Formacoes.temAgenda(f) ? `${esc(Agenda.descrever(f.agenda))} · ${esc(formatoDe(f.agenda.formato))}` : 'Agenda a definir', 'Agenda das aulas (dias, horários, recorrência, formato)')}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button type="button" id="btn-editar" class="${BOTAO_SEC}">${ICONE.lapis} Editar dados</button>
        <button type="button" id="btn-mais" class="${BOTAO_SEC}" aria-haspopup="menu" aria-expanded="false">Mais ${ICONE.baixo}</button>
      </div>
    </div>

    ${faixaFormacao(f, pend)}

    <div class="mb-4 shadow-[inset_0_-1px_0] shadow-slate-200 dark:shadow-neutral-800 flex items-center gap-4 overflow-x-auto [scrollbar-width:thin]">
      ${ABAS.map(subAba).join('')}
    </div>

    <div id="acoes-aba" class="mb-4 flex flex-wrap items-center gap-2 empty:hidden"></div>
    <div id="conteudo-aba"></div>`;

  el.querySelector('#btn-editar').addEventListener('click', () => abrirModalFormacao(f.id));
  el.querySelector('#btn-mais').addEventListener('click', (e) => abrirMenu(e.currentTarget, itensMais));
  el.querySelector('#btn-ativar')?.addEventListener('click', () => alterarStatus(f.id, 'ativo'));
  el.querySelectorAll('[data-aba]').forEach((b) => b.addEventListener('click', () => { estado.aba = b.dataset.aba; atualizarUrl(); renderFormacao(); }));

  ({ cursos: renderAbaCursos, alunos: renderAbaAlunos, dados: renderAbaDados })[estado.aba]();
}

// Rascunho pede uma decisão (ativar); formação ativa incompleta pede o que falta. Inativa e completa não têm faixa.
function faixaFormacao(f, pend) {
  const lista = pend.map(esc).join(' · ');
  const ativar = `<button type="button" id="btn-ativar" class="${BOTAO_PRI} h-8 shrink-0">Ativar</button>`;
  if (f.status === 'rascunho') {
    return faixa(pend.length ? 'aviso' : 'petrol', `<div class="flex flex-wrap items-center justify-between gap-2"><span><span class="font-medium">Rascunho — não aparece para o comercial nem abre turmas.</span> ${pend.length ? `Falta: ${lista}.` : 'Está completa; ative para liberar.'}</span>${ativar}</div>`);
  }
  return pend.length ? faixa('aviso', `<span class="font-medium">${plural(pend.length, 'pendência')} para a formação ficar completa:</span> ${lista}`) : '';
}

function alterarStatus(id, status) {
  estado.lista = Formacoes.alterarStatus(estado.lista, id, status);
  persistir();
  renderFormacao();
  toast(`"${atual().nome}" ${status === 'ativo' ? 'ativada.' : 'inativada — sai do catálogo e do site.'}`);
}

// ---------- Aba Alunos: quem está matriculado na formação, por edição, com o contrato ----------

function renderAbaAlunos() {
  const f = atual();
  const acoes = document.getElementById('acoes-aba');
  const el = document.getElementById('conteudo-aba');
  const todas = Formacoes.alunosDaFormacao(f.id, estado.cursos);
  const edicoes = Formacoes.edicoesDe(todas);
  const fl = estado.filtrosAlunos;
  const visiveis = Formacoes.filtrarAlunos(todas, fl);
  const filtrando = fl.busca || fl.edicaoId || fl.situacaoAluno;
  const moeda = (v) => Contratos.fmtMoeda(v);
  const data = (v) => Contratos.fmtData(v);
  const select = (id, rotulo, opcoes, valor) => campoCombo(id, opcoes, valor, { id, vazio: rotulo, filtro: true, classe: valor ? FILTRO_ATIVO : '' });

  acoes.innerHTML = `
    ${busca('busca-aluno', fl.busca, 'Buscar aluno, matrícula, venda ou responsável', 'w-80')}
    <div class="ml-auto flex flex-wrap items-center gap-2">
      ${select('filtro-edicao', 'Edição', edicoes, fl.edicaoId)}
      ${select('filtro-situacao-aluno', 'Situação', SITUACOES_ALUNO, fl.situacaoAluno)}
      ${filtrando ? `<button type="button" id="btn-limpar-alunos" class="${BOTAO_LINK}">Limpar</button>` : ''}
      <a href="contratos.html?novo=1" class="${BOTAO_PRI}" title="Abre a tela de vendas com uma nova venda">${ICONE.mais} Nova venda</a>
    </div>`;
  const campoBusca = acoes.querySelector('#busca-aluno');
  campoBusca.addEventListener('input', () => { fl.busca = campoBusca.value; const [ini, fim] = [campoBusca.selectionStart, campoBusca.selectionEnd]; renderAbaAlunos(); const novo = document.getElementById('busca-aluno'); novo.focus(); novo.setSelectionRange(ini, fim); });
  acoes.querySelector('[data-name="filtro-edicao"] input[type="hidden"]').addEventListener('change', (e) => { fl.edicaoId = e.target.value; renderAbaAlunos(); });
  acoes.querySelector('[data-name="filtro-situacao-aluno"] input[type="hidden"]').addEventListener('change', (e) => { fl.situacaoAluno = e.target.value; renderAbaAlunos(); });
  ativarCombos(acoes);
  acoes.querySelector('#btn-limpar-alunos')?.addEventListener('click', () => { estado.filtrosAlunos = { busca: '', edicaoId: '', situacaoAluno: '' }; renderAbaAlunos(); });

  if (!todas.length) {
    el.innerHTML = `
      <div class="${CARTAO} border-dashed p-10 text-center">
        <p class="text-sm text-slate-500 dark:text-neutral-400">Nenhum aluno matriculado nesta formação. Os alunos entram por uma <strong class="font-medium text-slate-700 dark:text-neutral-200">venda</strong> da formação (individual, pelo responsável ou pela empresa).</p>
        <a href="contratos.html?novo=1" class="${BOTAO_PRI} mt-4">${ICONE.mais} Nova venda</a>
      </div>`;
    return;
  }

  // Indicadores da formação (sobre todas as linhas, não só as filtradas). Número primeiro, contexto embaixo.
  const n = (s) => todas.filter((l) => l.situacaoAluno === s).length;
  const empresas = new Set(todas.filter((l) => l.contrato.contratante === 'empresa').map((l) => l.contrato.empresaId)).size;
  const faturamento = todas.reduce((s, l) => s + l.valor, 0);
  const cobrancaRuim = todas.filter((l) => l.situacao === 'inadimplente' || l.situacao === 'recuperante').length;
  const cartao = (rotulo, valor, sub, titulo = '') => `
    <div class="${CARTAO} p-4 min-w-0">
      <p class="text-xs font-medium text-slate-500 dark:text-neutral-400">${rotulo}</p>
      <p title="${esc(titulo)}" class="font-display text-2xl font-semibold tabular-nums leading-none mt-1 text-slate-800 dark:text-neutral-100 truncate">${valor}</p>
      <p class="text-xs text-slate-500 dark:text-neutral-400 mt-1.5 truncate">${sub}</p>
    </div>`;
  // No tamanho do indicador o valor cheio não cabe na quinta coluna; o exato fica no title e no rodapé de cada edição.
  const compacto = (v) => (v >= 1000 ? `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : moeda(v));
  const cartoes = `
    <div class="grid grid-cols-5 gap-3 mb-4">
      ${cartao('Alunos', todas.length, `${plural(edicoes.filter((e) => e.id !== '__sem').length, 'edição', 'edições')} · ${plural(new Set(todas.map((l) => l.contrato.id)).size, 'contrato')}`)}
      ${cartao('Cursando', n('cursando'), `${n('concluido')} concluíram${n('congelada') ? ` · ${n('congelada')} congelada${n('congelada') === 1 ? '' : 's'}` : ''}`)}
      ${cartao('Desistências', n('desistiu') + n('cancelada'), n('cancelada') ? `${n('cancelada')} por venda cancelada` : 'matrículas encerradas')}
      ${cartao('Por empresa', todas.filter((l) => l.contrato.contratante === 'empresa').length, plural(empresas, 'empresa contratante', 'empresas contratantes'))}
      ${cartao('Faturamento', compacto(faturamento), cobrancaRuim ? `<span class="text-red-700 dark:text-red-400">${cobrancaRuim} com cobrança atrasada</span>` : 'soma das matrículas ativas', moeda(faturamento))}
    </div>`;

  // Quem paga + o contrato: tudo que é financeiro numa coluna. O contrato só ganha pílula quando foge do comum.
  const quemPagaHtml = (l) => {
    const r = l.responsavel;
    const st = STATUS_CONTRATO.find((s) => s.id === l.contrato.status);
    const sit = SITUACOES_COBRANCA.find((s) => s.id === l.situacao);
    const pilulas = [
      PILULA_CONTRATO[l.contrato.status] ? pilula(PILULA_CONTRATO[l.contrato.status], st?.curto ?? st?.nome ?? l.contrato.status, st?.descricao ?? '') : '',
      PILULA_COBRANCA[l.situacao] && sit ? pilula(PILULA_COBRANCA[l.situacao], sit.nome) : '',
    ].join('');
    const contrato = `<a href="contrato.html?id=${l.contrato.id}" target="_blank" class="font-mono text-petrol-800 dark:text-sky-300 hover:underline">${esc(l.contrato.codigo)}</a>`;
    let quem = '<span class="text-sm text-slate-500 dark:text-neutral-400">—</span>';
    let tipo = '';
    // Tipos de Contratos.responsavelFinanceiro: empresa, responsavel (cadastro), terceiro (no cadastro do aluno), aluno, ou null.
    if (['empresa', 'responsavel', 'terceiro'].includes(r?.tipo)) {
      const link = r.tipo === 'empresa' ? (r.empresa ? `empresa.html?id=${r.empresa.id}` : '')
        : r.tipo === 'responsavel' ? (r.responsavel ? `responsavel.html?id=${r.responsavel.id}` : '')
        : `aluno.html?id=${l.alunoId}&aba=pagamento`;
      quem = link
        ? `<a href="${link}" target="_blank" title="${esc(r.documento ?? '')}" class="block truncate text-sm text-slate-800 dark:text-neutral-100 hover:underline">${esc(r.nome)}</a>`
        : `<span class="block truncate text-sm ${AVISO}">${esc(r.nome)}</span>`;
      tipo = r.tipo === 'empresa' ? 'Empresa' : `Responsável${r.parentesco ? ` (${esc(r.parentesco.toLowerCase())})` : ''}`;
    } else if (r?.tipo === 'aluno' && r.aluno) {
      quem = `<span class="block text-sm text-slate-600 dark:text-neutral-300">O próprio aluno</span>`;
    } else if (r) {
      quem = `<span class="block truncate text-sm ${AVISO}">${esc(r.nome)}</span>`;
    }
    return `${quem}${tipo ? `<p class="text-xs text-slate-500 dark:text-neutral-400 truncate">${tipo}</p>` : ''}<div class="flex flex-wrap items-center gap-1 mt-0.5 text-xs">${contrato}${pilulas}</div>`;
  };
  // Situação é fase de ciclo de vida: ponto + texto, com o progresso nos cursos logo abaixo.
  const situacaoHtml = (l) => {
    const p = l.progresso;
    const pct = p.total ? Math.round((p.concluidas / p.total) * 100) : 0;
    const saiu = l.situacaoAluno === 'desistiu' || l.situacaoAluno === 'cancelada';
    const sa = SITUACOES_ALUNO.find((s) => s.id === l.situacaoAluno);
    return `
      <div class="flex items-center justify-between gap-2"><span class="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-slate-600 dark:text-neutral-300">${ponto(PONTO_ALUNO[l.situacaoAluno] ?? PONTO_ALUNO.cursando)}${esc(sa?.nome ?? l.situacaoAluno)}</span><span class="text-xs tabular-nums text-slate-500 dark:text-neutral-400" title="${pct}% dos cursos">${p.concluidas}/${p.total}</span></div>
      <div class="relative h-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 mt-1.5"><span class="absolute inset-y-0 left-0 rounded-full ${saiu ? 'bg-slate-400 dark:bg-neutral-600' : 'bg-slate-700 dark:bg-neutral-300'}" style="width:${pct}%"></span></div>
      ${p.desistiu ? `<p class="text-xs ${AVISO} mt-1">${plural(p.desistiu, 'curso')} não cursado${p.desistiu === 1 ? '' : 's'}</p>` : ''}`;
  };
  const cursoAtualHtml = (l) => {
    if (!l.cursoAtual) return `<span class="text-sm text-slate-500 dark:text-neutral-400">${l.situacaoAluno === 'concluido' ? 'Formação concluída' : '—'}</span>`;
    const { curso, turma, futuro } = l.cursoAtual;
    return `<p class="truncate text-sm text-slate-800 dark:text-neutral-100" title="${esc(curso?.nome ?? '')}"><span class="font-mono text-xs text-slate-500 dark:text-neutral-400 mr-1">${esc(curso?.codigo ?? '')}</span>${esc(curso?.nome ?? '')}</p><p class="text-xs text-slate-500 dark:text-neutral-400">${futuro ? 'começa em' : 'até'} ${esc(data(futuro ? turma.inicio : turma.fim))}</p>`;
  };
  const linha = (l) => {
    const menor = l.aluno ? Clientes.menorDeIdade(l.aluno.nascimento) : false;
    const nome = l.aluno?.nomeSocial || l.aluno?.nome || 'Aluno removido';
    return `
      <tr class="align-top ${l.situacaoAluno === 'cancelada' ? 'linha-apagada' : ''}">
        <td class="${TH}">
          <a href="aluno.html?id=${l.alunoId}" target="_blank" title="${esc(nome)}" class="block truncate text-sm font-medium text-slate-800 dark:text-neutral-100 hover:underline underline-offset-2">${esc(nome)}</a>
          <p class="text-xs text-slate-500 dark:text-neutral-400"><span class="font-mono">${esc(l.codigoMatricula)}</span>${menor ? ' · menor de idade' : ''}${l.aluno?.empresaId && l.contrato.contratante !== 'empresa' ? ' · colaborador (paga o próprio)' : ''}</p>
        </td>
        <td class="${TH}">${situacaoHtml(l)}</td>
        <td class="${TH}">${cursoAtualHtml(l)}</td>
        <td class="${TH}">${quemPagaHtml(l)}</td>
        <td class="${TD} tabular-nums whitespace-nowrap text-right font-medium text-slate-800 dark:text-neutral-100">${moeda(l.valor)}</td>
      </tr>`;
  };

  const cabecalho = `
    <thead class="${THEAD}">
      <tr>
        <th class="${TH}">Aluno</th>
        <th class="${TH} w-[150px]">Situação e cursos</th>
        <th class="${TH} w-[176px]">Curso atual</th>
        <th class="${TH} w-[184px]">Quem paga e venda</th>
        <th class="${TH} w-[124px] text-right">Valor</th>
      </tr>
    </thead>`;
  const grupos = Formacoes.edicoesDe(visiveis).map((e) => ({ edicao: e, linhas: visiveis.filter((l) => (l.edicaoId ?? '__sem') === e.id) }));
  const corpo = grupos.map((g) => {
    const e = g.edicao;
    const total = g.linhas.reduce((s, l) => s + l.valor, 0);
    return `
      <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
        <tr class="${LINHA_GRUPO}">
          <td colspan="5" class="px-4 py-2 text-sm">
            <span class="font-medium text-slate-700 dark:text-neutral-200">${esc(e.nome)}</span>
            <span class="text-xs text-slate-500 dark:text-neutral-400"> · ${e.periodo ? `${esc(e.periodo)} · ` : ''}${e.inicio ? `${data(e.inicio)} a ${data(e.fim)} · ` : ''}${plural(g.linhas.length, 'aluno')}</span>
          </td>
          <td class="pl-2 pr-4 py-2 text-sm font-semibold tabular-nums whitespace-nowrap text-right text-slate-800 dark:text-neutral-100">${moeda(total)}</td>
        </tr>
        ${g.linhas.map(linha).join('')}
      </tbody>`;
  }).join('');

  el.innerHTML = `
    ${cartoes}
    <div class="${CARTAO} overflow-x-auto">
      <table class="w-full table-fixed text-left">
        ${cabecalho}
        ${visiveis.length ? corpo : `<tbody><tr><td colspan="6" class="px-4 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">Nenhum aluno corresponde aos filtros.</td></tr></tbody>`}
      </table>
      <div class="px-4 py-2.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-sm text-slate-700 dark:text-neutral-200 tabular-nums">${plural(visiveis.length, 'aluno')}${filtrando ? ` de ${todas.length}` : ''} <span class="text-xs text-slate-500 dark:text-neutral-400">· valores = soma das matrículas ativas de cada aluno na venda</span></div>
    </div>`;
}

// ---------- Aba Cursos: totalizadores + tabela ----------

function renderAbaCursos() {
  const f = atual();
  const t = Formacoes.totais(f, estado.cursos);
  const itens = Formacoes.cursosDe(f, estado.cursos);
  const avisos = Formacoes.preRequisitosForaDeOrdem(f, estado.cursos);
  const acoes = document.getElementById('acoes-aba');
  const el = document.getElementById('conteudo-aba');
  // RN10: sequência só editável em rascunho. Fora disso a aba é somente leitura.
  const editavel = Formacoes.podeEditarCursos(f);
  const motivoTrava = f.status === 'ativo'
    ? 'Sequência travada: a formação está ativa, com turmas e alunos. Para mudar, duplique (nasce em rascunho) ou volte para rascunho em Editar dados.'
    : 'Sequência travada: a formação está inativa. Para mudar, duplique (nasce em rascunho) ou volte para rascunho em Editar dados.';
  // RN11: turma só em formação ativa (rascunho ainda muda a sequência; inativa está encerrada).
  const podeCriarTurma = f.status === 'ativo';
  const motivoTurma = f.status === 'rascunho' ? 'Ative a formação para abrir turmas' : 'Formação inativa não abre turmas novas';
  const porEixo = estado.agruparPorEixo;
  // Rascunho não abre turma: sem nenhuma turma ainda, a coluna só diria "sem turma" em todas as linhas.
  const comTurmas = podeCriarTurma || Turmas.turmasDaFormacao(estado.turmas, f.id).length > 0;

  acoes.innerHTML = `
    ${itens.length ? segmentado([{ id: 'sequencia', titulo: 'Em sequência' }, { id: 'eixo', titulo: 'Por eixo' }], porEixo ? 'eixo' : 'sequencia', 'data-visao') : ''}
    ${editavel ? `<button type="button" id="btn-adicionar" class="${BOTAO_PRI} ml-auto">${ICONE.mais} Adicionar cursos</button>` : ''}`;
  acoes.querySelectorAll('[data-visao]').forEach((b) => b.addEventListener('click', () => { estado.agruparPorEixo = b.dataset.visao === 'eixo'; renderAbaCursos(); }));
  acoes.querySelector('#btn-adicionar')?.addEventListener('click', () => abrirSeletorCursos());

  if (!itens.length) {
    el.innerHTML = `
      <div class="${CARTAO} border-dashed p-10 text-center">
        <p class="text-sm text-slate-500 dark:text-neutral-400">${editavel ? 'Esta formação ainda não tem cursos. Adicione cursos do catálogo — de qualquer eixo — e a carga horária aparece aqui.' : `Esta formação não tem cursos. ${esc(motivoTrava)}`}</p>
        ${editavel ? `<button type="button" id="btn-adicionar-vazio" class="${BOTAO_PRI} mt-4">${ICONE.mais} Adicionar cursos</button>` : ''}
      </div>`;
    el.querySelector('#btn-adicionar-vazio')?.addEventListener('click', () => abrirSeletorCursos());
    return;
  }

  // Carga por eixo: um cartão, com medidores em tinta (Regra da Tinta nos Dados); o ponto só identifica o eixo.
  const ajustadas = itens.filter((i) => i.cargaHoraria != null && Number(i.cargaHoraria) !== Number(i.curso.cargaHoraria)).length;
  const eixoLinha = (x) => `
    <li class="flex items-center gap-3 text-sm" title="${esc(`${x.area.nome}: ${fmtHoras(x.horas)} em ${plural(x.n, 'curso')}${x.obrigatorias !== x.horas ? ` (${fmtHoras(x.obrigatorias)} obrigatórias)` : ''}`)}">
      <span class="w-40 shrink-0 min-w-0 flex items-center gap-1.5 text-slate-600 dark:text-neutral-300">${pontoEixo(x.area.id)}<span class="truncate">${esc(x.area.nome)}</span></span>
      <span class="relative h-1.5 min-w-0 flex-1 rounded-full bg-slate-100 dark:bg-neutral-800"><span class="absolute inset-y-0 left-0 rounded-full bg-slate-700 dark:bg-neutral-300" style="width:${x.pct * 100}%"></span></span>
      <span class="w-12 shrink-0 text-right tabular-nums text-slate-800 dark:text-neutral-100">${fmtHoras(x.horas)}</span>
      <span class="w-9 shrink-0 text-right tabular-nums text-xs text-slate-500 dark:text-neutral-400">${Math.round(x.pct * 100)}%</span>
    </li>`;
  const resumo = `
    <section class="${CARTAO} mb-4">
      ${cabecalhoSecao('Carga horária por eixo', `Vem dos cursos${ajustadas ? `; ${plural(ajustadas, 'curso ajustado', 'cursos ajustados')} só nesta formação` : ''}.`)}
      <div class="p-4 pt-3 flex items-start gap-8">
        <div class="w-44 shrink-0">
          <p class="font-display text-2xl font-semibold tabular-nums leading-none text-slate-800 dark:text-neutral-100">${fmtHoras(t.horas)}</p>
          <p class="text-xs text-slate-500 dark:text-neutral-400 mt-1.5 tabular-nums">${plural(t.n, 'curso')} · ${fmtHoras(t.horasObrigatorias)} obrigatórias${t.horasOptativas ? ` · ${fmtHoras(t.horasOptativas)} optativas` : ''}</p>
        </div>
        <ul class="min-w-0 flex-1 grid grid-cols-2 gap-x-8 gap-y-2.5">${t.porEixo.map(eixoLinha).join('')}</ul>
      </div>
    </section>`;

  const celulaTurmas = (c) => {
    const turmas = Turmas.turmasDoCursoNaFormacao(estado.turmas, c.id, f.id);
    const turma = (x) => {
      const sit = Turmas.situacao(x);
      const s = Turmas.situacaoDe(sit);
      return `<button type="button" data-ver-turma="${x.id}" title="${esc(`${s.nome} · ${x.turno} · ${Contratos.fmtData(x.inicio)} a ${Contratos.fmtData(x.fim)} — clique para ver alunos e aulas`)}" class="flex items-center gap-1.5 whitespace-nowrap rounded text-xs text-slate-700 dark:text-neutral-200 hover:text-petrol-800 dark:hover:text-sky-300 hover:underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30">${ponto(PONTO_TURMA[sit])}<span class="font-mono">${esc(x.codigo)}</span><span class="tabular-nums text-slate-500 dark:text-neutral-400">${Contratos.fmtData(x.inicio).slice(0, 5)}–${Contratos.fmtData(x.fim).slice(0, 5)}</span></button>`;
    };
    return `
      <div class="flex items-start justify-between gap-1">
        <div class="min-w-0 space-y-1 pt-0.5">${turmas.length ? turmas.map(turma).join('') : `<span class="text-xs text-slate-500 dark:text-neutral-400">sem turma</span>`}</div>
        <button type="button" data-nova-turma="${c.id}" ${podeCriarTurma ? '' : 'disabled'} aria-label="${podeCriarTurma ? `Nova turma de ${esc(c.nome)}` : esc(motivoTurma)}" title="${podeCriarTurma ? `Nova turma de ${esc(c.nome)} nesta formação` : esc(motivoTurma)}" class="${ICONE_BOTAO} -my-1 shrink-0">${ICONE.mais}</button>
      </div>`;
  };

  const linha = (i, idx, podeMover) => {
    const c = i.curso;
    const sc = statusCurso(c.status);
    const aviso = avisos.get(c.id);
    const arrasta = editavel && podeMover;
    const ajustada = i.cargaHoraria != null && Number(i.cargaHoraria) !== Number(c.cargaHoraria);
    return `
      <tr data-curso="${c.id}" data-posicao="${idx}" ${arrasta ? 'draggable="true"' : ''} class="align-top ${c.status === 'inativo' ? 'linha-apagada' : ''} ${arrasta ? 'linha-arrastavel' : ''}">
        <td class="pl-3 pr-1 py-2.5">
          <div class="flex items-center gap-1">
            ${arrasta ? `<span class="alca-arrastar cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 dark:text-neutral-600 dark:hover:text-neutral-300" title="Arraste para reposicionar"><svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><circle cx="7" cy="5" r="1.5"/><circle cx="13" cy="5" r="1.5"/><circle cx="7" cy="10" r="1.5"/><circle cx="13" cy="10" r="1.5"/><circle cx="7" cy="15" r="1.5"/><circle cx="13" cy="15" r="1.5"/></svg></span>` : ''}
            <span class="text-xs tabular-nums text-slate-500 dark:text-neutral-400 w-5 text-right">${idx + 1}</span>
            ${editavel ? `<div class="flex flex-col -my-1">
              <button type="button" data-mover="-1" data-id="${c.id}" aria-label="Subir ${esc(c.nome)}" title="Subir" class="${ICONE_BOTAO} h-5" ${podeMover && idx > 0 ? '' : 'disabled'}>${ICONE.cima}</button>
              <button type="button" data-mover="1" data-id="${c.id}" aria-label="Descer ${esc(c.nome)}" title="Descer" class="${ICONE_BOTAO} h-5" ${podeMover && idx < itens.length - 1 ? '' : 'disabled'}>${ICONE.baixo}</button>
            </div>` : ''}
          </div>
        </td>
        <td class="${TH}">
          <p class="truncate"><span class="font-mono text-xs text-slate-500 dark:text-neutral-400 mr-1.5">${esc(c.codigo)}</span><a href="curso.html?id=${c.id}" title="${esc(c.nome)}" class="text-sm font-medium text-slate-800 dark:text-neutral-100 hover:underline underline-offset-2">${esc(c.nome)}</a>${c.status === 'ativo' ? '' : ` ${pilula(PILULA[c.status], sc.nome, `Curso ${sc.nome.toLowerCase()} — ${sc.descricao}`)}`}${!editavel && !i.obrigatorio ? ` ${pilula(PILULA.neutra, 'Optativo', 'Não é obrigatório para concluir a formação')}` : ''}</p>
          ${aviso
            ? `<p class="text-xs ${AVISO} truncate" title="${esc(aviso.map((p) => p.nome).join(', '))}">Pré-requisito fora da sequência: ${esc(aviso.map((p) => p.codigo || p.nome).join(', '))}</p>`
            : `<p class="text-xs text-slate-500 dark:text-neutral-400 truncate" title="${esc(c.resumo)}">${esc(c.resumo)}</p>`}
        </td>
        ${comTurmas ? `<td class="${TH}">${celulaTurmas(c)}</td>` : ''}
        <td class="${TD}">${eixoDe(c.eixoId) ? `<span class="flex items-center gap-1.5 min-w-0">${pontoEixo(c.eixoId)}<span class="truncate">${esc(eixoDe(c.eixoId))}</span></span><span class="block text-xs text-slate-500 dark:text-neutral-400">${esc(nivelDe(c.nivel))}</span>` : esc(nivelDe(c.nivel))}</td>
        <td class="${TD} text-right tabular-nums whitespace-nowrap">
          ${editavel ? `<button type="button" data-carga="${c.id}" title="Editar a carga horária deste curso só nesta formação (catálogo: ${fmtHoras(c.cargaHoraria)})" class="inline-flex items-center gap-1 rounded text-slate-800 dark:text-neutral-100 hover:text-petrol-800 dark:hover:text-sky-300 hover:underline decoration-dotted underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30"><span class="text-slate-400">${ICONE.lapis}</span>${fmtHoras(i.horas)}</button>` : `<span class="text-slate-800 dark:text-neutral-100">${fmtHoras(i.horas)}</span>`}
          ${ajustada ? `<span class="block text-xs ${AVISO}" title="Carga horária ajustada nesta formação">catálogo: ${fmtHoras(c.cargaHoraria)}</span>` : ''}
        </td>
        ${editavel ? `<td class="${TH}">
          <button type="button" role="switch" aria-checked="${i.obrigatorio}" data-obrigatorio="${c.id}" aria-label="Obrigatório: ${esc(c.nome)}" title="${i.obrigatorio ? 'Obrigatório — clique para tornar optativo' : 'Optativo — clique para tornar obrigatório'}"
            class="inline-flex items-center gap-2 rounded-full text-sm text-slate-600 dark:text-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30">
            <span class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${i.obrigatorio ? 'bg-petrol-800 dark:bg-areia' : 'bg-white dark:bg-neutral-950 ring-1 ring-inset ring-slate-300 dark:ring-neutral-700'}"><span class="inline-block h-4 w-4 rounded-full shadow transition ${i.obrigatorio ? 'translate-x-[18px] bg-areia dark:bg-petrol-800' : 'translate-x-0.5 bg-slate-400 dark:bg-neutral-500'}"></span></span>
            ${i.obrigatorio ? 'Obrigatório' : 'Optativo'}
          </button>
        </td>` : ''}
        <td class="pl-1 pr-3 py-2.5">
          <div class="flex items-center gap-1 justify-end">
            <a href="curso.html?id=${c.id}" target="_blank" aria-label="Abrir ${esc(c.nome)} em nova aba" title="Abrir o curso em nova aba" class="${ICONE_BOTAO}">${ICONE.externo}</a>
            ${editavel ? `<button type="button" data-remover="${c.id}" aria-label="Remover ${esc(c.nome)} da formação" title="Remover da formação" class="${ICONE_BOTAO_VERMELHO}">${ICONE.lixeira}</button>` : ''}
          </div>
        </td>
      </tr>`;
  };

  // Antes da carga: #, curso, turmas (quando há), eixo. Depois: "na formação" (só em rascunho) e as ações.
  const antes = comTurmas ? 4 : 3;
  const depois = editavel ? 2 : 1;
  const cabecalho = `
    <thead class="${THEAD}">
      <tr>
        <th class="pl-3 pr-1 py-2.5 ${editavel ? 'w-[84px]' : 'w-[48px]'}"><span class="sr-only">Posição</span>#</th>
        <th class="${TH}">Curso</th>
        ${comTurmas ? `<th class="${TH} w-[200px]">Turmas</th>` : ''}
        <th class="${TH} w-[136px]">Eixo e nível</th>
        <th class="${TH} w-[88px] text-right" title="Carga horária nesta formação">Carga</th>
        ${editavel ? `<th class="${TH} w-[136px]">Na formação</th>` : ''}
        <th class="pl-1 pr-3 py-2.5 ${editavel ? 'w-[76px]' : 'w-[48px]'}"><span class="sr-only">Ações</span></th>
      </tr>
    </thead>`;
  const rodape = `
    <tfoot class="border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900">
      <tr>
        <td colspan="${antes}" class="${TH} text-sm font-medium text-slate-800 dark:text-neutral-100">Total · ${plural(t.n, 'curso')} <span class="font-normal text-xs text-slate-500 dark:text-neutral-400 tabular-nums">${t.optativos ? `(${t.obrigatorios} obrigatórios + ${plural(t.optativos, 'optativo')}, ${fmtHoras(t.horasOptativas)} optativas)` : '(todos obrigatórios)'}</span></td>
        <td class="${TH} text-right text-sm font-semibold tabular-nums whitespace-nowrap text-slate-800 dark:text-neutral-100">${fmtHoras(t.horas)}</td>
        <td colspan="${depois}"></td>
      </tr>
    </tfoot>`;

  let corpo;
  if (porEixo) {
    corpo = Formacoes.porEixo(f, estado.cursos).map((g) => {
      const horas = Formacoes.somaHoras(g.itens);
      return `
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
          <tr class="${LINHA_GRUPO}">
            <td colspan="${antes}" class="px-4 py-2 text-sm"><span class="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-neutral-200">${pontoEixo(g.area.id)}${esc(g.area.nome)}</span> <span class="text-xs text-slate-500 dark:text-neutral-400 tabular-nums">· ${plural(g.itens.length, 'curso')} · ${Math.round((horas / t.horas) * 100)}% da formação</span></td>
            <td class="px-4 py-2 text-right text-sm font-semibold tabular-nums whitespace-nowrap text-slate-800 dark:text-neutral-100">${fmtHoras(horas)}</td>
            <td colspan="${depois}"></td>
          </tr>
          ${g.itens.map((i) => linha(i, itens.findIndex((x) => x.cursoId === i.cursoId), false)).join('')}
        </tbody>`;
    }).join('');
  } else {
    corpo = `<tbody class="divide-y divide-slate-100 dark:divide-neutral-900">${itens.map((i, idx) => linha(i, idx, true)).join('')}</tbody>`;
  }

  // O motivo da trava é a frase de contexto do cartão: sem ela, ▲▼ e o interruptor sumiriam sem explicação.
  const semTurma = podeCriarTurma ? itens.filter((i) => !Turmas.turmasDoCursoNaFormacao(estado.turmas, i.curso.id, f.id).length).length : 0;
  const contexto = editavel
    ? (porEixo ? 'Agrupado por eixo, com subtotal. A ordem e o arrasto ficam em Em sequência.' : 'A ordem é a sequência sugerida ao aluno: arraste pela alça ou use as setas. Turmas nascem na linha de cada curso, com a formação ativa.')
    : `${esc(motivoTrava)}${semTurma ? ` ${plural(semTurma, 'curso')} ainda sem turma: abra pelo + da linha.` : ''}`;

  el.innerHTML = `
    ${resumo}
    <section class="${CARTAO} overflow-hidden">
      <div class="px-4 pt-4 flex items-start gap-2">
        ${editavel ? '' : `<span class="mt-0.5 shrink-0 text-slate-400 dark:text-neutral-500">${ICONE.cadeado}</span>`}
        <div class="min-w-0">
          <h3 class="font-display text-[15px] font-semibold text-slate-900 dark:text-neutral-100">Sequência dos cursos</h3>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">${contexto}</p>
        </div>
      </div>
      <div class="mt-3 overflow-x-auto">
        <table class="w-full table-fixed text-left">
          ${cabecalho}
          ${corpo}
          ${rodape}
        </table>
      </div>
    </section>`;

  el.querySelectorAll('[data-mover]').forEach((b) => b.addEventListener('click', () => {
    estado.lista = Formacoes.moverCurso(estado.lista, f.id, b.dataset.id, Number(b.dataset.mover));
    persistir(); renderAbaCursos();
  }));

  // Arrastar e soltar (só em rascunho e na visão em sequência — agrupado por eixo a ordem é da formação, não do grupo).
  // Solta acima da metade da linha alvo = fica antes dela; abaixo = depois. Indicador é uma borda petróleo na linha alvo.
  if (editavel && !estado.agruparPorEixo) {
    let arrastando = null;
    const limpar = () => el.querySelectorAll('.solta-antes, .solta-depois').forEach((tr) => tr.classList.remove('solta-antes', 'solta-depois'));
    el.querySelectorAll('tr.linha-arrastavel').forEach((tr) => {
      tr.addEventListener('dragstart', (e) => {
        arrastando = tr.dataset.curso;
        tr.classList.add('opacity-40');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', arrastando);
      });
      tr.addEventListener('dragend', () => { arrastando = null; tr.classList.remove('opacity-40'); limpar(); });
      tr.addEventListener('dragover', (e) => {
        if (!arrastando || arrastando === tr.dataset.curso) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const r = tr.getBoundingClientRect();
        const antes = e.clientY < r.top + r.height / 2;
        limpar();
        tr.classList.add(antes ? 'solta-antes' : 'solta-depois');
      });
      tr.addEventListener('dragleave', (e) => { if (!tr.contains(e.relatedTarget)) tr.classList.remove('solta-antes', 'solta-depois'); });
      tr.addEventListener('drop', (e) => {
        if (!arrastando || arrastando === tr.dataset.curso) return;
        e.preventDefault();
        const r = tr.getBoundingClientRect();
        const antes = e.clientY < r.top + r.height / 2;
        const origem = Number(el.querySelector(`tr[data-curso="${arrastando}"]`)?.dataset.posicao);
        let destino = Number(tr.dataset.posicao) + (antes ? 0 : 1);
        if (origem < destino) destino -= 1; // removendo a origem, os índices depois dela recuam um
        const nome = Cursos.porId(estado.cursos, arrastando)?.nome ?? '';
        estado.lista = Formacoes.reordenarCurso(estado.lista, f.id, arrastando, destino);
        persistir(); renderAbaCursos();
        toast(`"${nome}" agora é o ${destino + 1}º curso.`);
      });
    });
  }
  el.querySelectorAll('[data-obrigatorio]').forEach((b) => b.addEventListener('click', () => {
    estado.lista = Formacoes.alternarObrigatorio(estado.lista, f.id, b.dataset.obrigatorio);
    persistir(); renderFormacao();
    const i = atual().itens.find((x) => x.cursoId === b.dataset.obrigatorio);
    toast(`"${Cursos.porId(estado.cursos, b.dataset.obrigatorio).nome}" agora é ${i.obrigatorio ? 'obrigatório' : 'optativo'}.`);
  }));
  el.querySelectorAll('[data-carga]').forEach((b) => b.addEventListener('click', () => abrirModalCargaHoraria(b.dataset.carga)));
  el.querySelectorAll('[data-nova-turma]').forEach((b) => b.addEventListener('click', () => abrirModalNovaTurma(b.dataset.novaTurma)));
  el.querySelectorAll('[data-ver-turma]').forEach((b) => b.addEventListener('click', () => abrirModalVerTurma(b.dataset.verTurma)));
  el.querySelectorAll('[data-remover]').forEach((b) => b.addEventListener('click', () => {
    const c = Cursos.porId(estado.cursos, b.dataset.remover);
    const horas = Formacoes.horasItem(f.itens.find((x) => x.cursoId === c.id) ?? {}, c);
    estado.lista = Formacoes.removerCurso(estado.lista, f.id, c.id);
    persistir(); renderFormacao();
    toast(`"${c.nome}" removido da formação (−${fmtHoras(horas)}).`);
  }));
}

// Carga horária do curso dentro da formação (sobrescreve só aqui; vazio = usa a do catálogo).
function abrirModalCargaHoraria(cursoId) {
  const f = atual();
  const c = Cursos.porId(estado.cursos, cursoId);
  const item = f.itens.find((x) => x.cursoId === cursoId);
  if (!c || !item) return;
  modalFormulario({
    id: 'form-carga',
    titulo: 'Carga horária na formação',
    subtitulo: `<strong>${esc(c.codigo)} · ${esc(c.nome)}</strong> tem ${fmtHoras(c.cargaHoraria)} no catálogo. O valor abaixo vale só nesta formação — o curso não muda.`,
    rotulo: 'Salvar',
    largura: 'md',
    foco: '#f-cargaHoraria',
    corpo: `
      ${campoTexto('cargaHoraria', 'Carga horária nesta formação', item.cargaHoraria ?? '', { tipo: 'number', extra: 'min="0.5" step="0.5"', placeholder: String(c.cargaHoraria), opcional: true, sufixo: 'h' })}
      <p class="text-xs text-slate-500 dark:text-neutral-400 -mt-3">Deixe vazio para voltar a usar a carga horária do catálogo (${fmtHoras(c.cargaHoraria)}).</p>`,
    aoSalvar: (fd) => {
      const valor = fd.get('cargaHoraria');
      const erros = Formacoes.validarCargaHoraria(valor);
      if (erros.length) return erros;
      estado.lista = Formacoes.definirCargaHoraria(estado.lista, f.id, cursoId, valor);
      persistir(); renderFormacao();
      const novo = Formacoes.horasItem(atual().itens.find((x) => x.cursoId === cursoId), c);
      toast(`"${c.nome}": ${fmtHoras(novo)} nesta formação${String(valor ?? '').trim() === '' ? ' (carga do catálogo)' : ''}.`);
    },
  });
}

// ---------- Aba Dados gerais (com o cartão Comercial, que já foi aba) ----------

function renderAbaDados() {
  const f = atual();
  const c = f.comercial;
  const t = Formacoes.totais(f, estado.cursos);
  const economia = c.precoReferencia != null && t.somaPrecos ? 1 - c.precoReferencia / t.somaPrecos : null;
  const aDefinir = '<span class="text-slate-500 dark:text-neutral-400">a definir</span>';
  document.getElementById('acoes-aba').innerHTML = '';
  document.getElementById('conteudo-aba').innerHTML = `
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <section class="${CARTAO}">
        ${cabecalhoSecao('Identificação', 'Como a formação aparece no catálogo e no site.', 'btn-editar-dados')}
        <div class="p-4 grid grid-cols-3 gap-4">
          ${campo('Código', `<span class="font-mono">${esc(f.codigo)}</span>`)}
          ${campo('Nome', esc(f.nome), 'col-span-2')}
          ${campo('Área', pilulaArea(f.areaId), 'col-span-3')}
          ${campo('Resumo (uma linha)', valorOuVazio(f.resumo), 'col-span-3')}
          ${campo('Descrição', `<p class="whitespace-pre-line">${valorOuVazio(f.descricao)}</p>`, 'col-span-3')}
          ${campo('Público-alvo', valorOuVazio(f.publicoAlvo), 'col-span-3')}
        </div>
      </section>
      <section class="${CARTAO}">
        ${cabecalhoSecao('Agenda das aulas', 'Dias da semana, horários, recorrência e formato. As turmas desta formação herdam.', 'btn-editar-agenda', Formacoes.temAgenda(f) ? 'Editar' : 'Definir')}
        <div class="p-4 grid grid-cols-2 gap-4">
          ${campo('Dias e horários', f.agenda?.periodos?.length ? f.agenda.periodos.map((p) => `<p>${esc(Agenda.descrever({ periodos: [p] }, { comRecorrencia: false }))}</p>`).join('') : aDefinir, 'col-span-2')}
          ${campo('Formato', f.agenda?.formato ? esc(formatoDe(f.agenda.formato)) : aDefinir)}
          ${campo('Recorrência', esc(Agenda.RECORRENCIAS.find((r) => r.id === f.agenda?.recorrencia)?.nome ?? 'Semanal'))}
          ${campo('Horas por semana', f.agenda?.periodos?.length ? `<span class="tabular-nums">${Agenda.horasPorSemana(f.agenda).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h</span>` : '—')}
          ${campo('Turmas que herdam', `<span class="tabular-nums">${Turmas.turmasDaFormacao(estado.turmas, f.id).filter((x) => x.status !== 'cancelada').length}</span>`)}
        </div>
      </section>
      <section class="${CARTAO}">
        ${cabecalhoSecao('Comercial', 'Valor de referência da formação fechada; as condições reais ficam na proposta e na matrícula.', 'btn-editar-comercial')}
        <div class="p-4 grid grid-cols-2 gap-4">
          ${campo('Preço de referência', c.precoReferencia == null ? valorOuVazio(null) : `<span class="tabular-nums">${fmtMoeda(c.precoReferencia)}</span>${t.horas ? ` <span class="text-xs text-slate-500 dark:text-neutral-400 tabular-nums">· ${fmtMoeda(c.precoReferencia / t.horas)} por hora</span>` : ''}`)}
          ${campo('Parcelamento máximo', c.parcelasMax ? `<span class="tabular-nums">${c.parcelasMax}×${c.precoReferencia != null ? ` de ${fmtMoeda(c.precoReferencia / c.parcelasMax)}` : ''}</span>` : valorOuVazio(null))}
          ${campo('Soma dos cursos avulsos', `<span class="tabular-nums">${fmtMoeda(t.somaPrecos)}</span>${t.semPreco ? ` <span class="text-xs ${AVISO}">· ${plural(t.semPreco, 'curso')} sem preço</span>` : ''}`)}
          ${campo('Economia na formação', economia == null ? '—' : economia >= 0
            ? `<span class="tabular-nums">${Math.round(economia * 100)}%</span> <span class="text-xs text-slate-500 dark:text-neutral-400 tabular-nums">· ${fmtMoeda(t.somaPrecos - c.precoReferencia)} a menos que os avulsos</span>`
            : `<span class="tabular-nums text-red-700 dark:text-red-400">−${Math.round(-economia * 100)}%</span> <span class="text-xs text-slate-500 dark:text-neutral-400 tabular-nums">· ${fmtMoeda(c.precoReferencia - t.somaPrecos)} a mais que os avulsos</span>`)}
          ${campo('Site da ProWay', c.publicadoSite ? 'Publicada' : `<span class="text-slate-500 dark:text-neutral-400">${f.status === 'ativo' ? 'não publicada' : 'só formação ativa é publicada'}</span>`)}
        </div>
      </section>
    </div>`;
  document.getElementById('btn-editar-dados').addEventListener('click', () => abrirModalFormacao(f.id));
  document.getElementById('btn-editar-agenda').addEventListener('click', () => abrirModalAgenda());
  document.getElementById('btn-editar-comercial').addEventListener('click', () => abrirModalComercial());
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
      ${sufixo ? `<span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-neutral-400">${sufixo}</span>` : ''}
    </div>
    ${ERRO(name)}
  </div>`;

const campoArea = (name, rotulo, valor, { rows = 3, placeholder = '', max = '', opcional = false } = {}) => `
  <div>
    <label class="rotulo" for="f-${name}">${rotulo} ${opcional ? OPCIONAL : ''}</label>
    <textarea id="f-${name}" name="${name}" rows="${rows}" ${max ? `maxlength="${max}"` : ''} class="campo resize-y" placeholder="${esc(placeholder)}">${esc(valor ?? '')}</textarea>
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

// ---------- Modais ----------

function abrirModalFormacao(id = null) {
  const f = id ? Formacoes.porId(estado.lista, id) : null;
  const d = f ?? { codigo: '', nome: '', areaId: '', resumo: '', descricao: '', publicoAlvo: '', status: null };
  modalFormulario({
    id: 'form-formacao',
    titulo: f ? 'Editar dados da formação' : 'Nova formação',
    subtitulo: f ? 'Identificação e textos.' : 'Depois de criar, você adiciona os cursos. A formação nasce como <strong>rascunho</strong>.',
    rotulo: f ? 'Salvar alterações' : 'Criar formação',
    largura: 'xl',
    foco: '#f-codigo',
    corpo: `
      <div class="grid grid-cols-3 gap-3">
        ${campoTexto('codigo', 'Código', d.codigo, { placeholder: 'Ex.: FULL', max: 10, extra: 'autocapitalize="characters"' })}
        <div class="col-span-2">${campoTexto('nome', 'Nome', d.nome, { placeholder: 'Ex.: Desenvolvedor Full Stack', max: 100 })}</div>
      </div>
      <div>
        <label class="rotulo" for="f-areaId">Área</label>
        ${campoCombo('areaId', Areas.opcoes(estado.areas, d.areaId), d.areaId, { vazio: 'Escolha a área' })}
        ${ERRO('areaId')}
      </div>
      ${campoTexto('resumo', 'Resumo (uma linha)', d.resumo, { max: 160, opcional: true, placeholder: 'Chamada curta para o catálogo' })}
      ${campoArea('descricao', 'Descrição', d.descricao, { rows: 5, max: 2000, opcional: true, placeholder: 'Para quem é, o que o aluno sai sabendo fazer' })}
      ${campoArea('publicoAlvo', 'Público-alvo', d.publicoAlvo, { rows: 2, max: 300, opcional: true })}
      ${f ? `
      <fieldset>
        <legend class="rotulo">Status</legend>
        ${cartoesRadio('status', STATUS_FORMACAO, d.status)}
        ${ERRO('status')}
      </fieldset>` : ''}`,
    aoSalvar: (fd) => {
      const novo = { codigo: fd.get('codigo') ?? '', nome: fd.get('nome') ?? '', areaId: fd.get('areaId') ?? '', resumo: fd.get('resumo') ?? '', descricao: fd.get('descricao') ?? '', publicoAlvo: fd.get('publicoAlvo') ?? '', status: f ? fd.get('status') : null };
      const erros = Formacoes.validarDados(novo, estado.lista, id);
      if (erros.length) return erros;
      if (f) {
        estado.lista = Formacoes.atualizarDados(estado.lista, id, novo);
        persistir(); renderFormacao();
        toast(`"${novo.nome.trim()}" atualizada.`);
      } else {
        const r = Formacoes.incluir(estado.lista, novo);
        estado.lista = r.lista;
        persistir();
        toast(`"${r.formacao.nome}" criada como rascunho — agora adicione os cursos.`);
        selecionar(r.formacao.id);
      }
    },
  });
}

function abrirModalDuplicar(origemId) {
  const origem = Formacoes.porId(estado.lista, origemId);
  const { form } = modalFormulario({
    id: 'form-duplicar',
    titulo: 'Duplicar formação',
    subtitulo: `Cópia de <strong>${esc(origem.nome)}</strong> com os mesmos ${plural(origem.itens.length, 'curso')} e preço, em <strong>rascunho</strong> e fora do site.`,
    rotulo: 'Criar cópia',
    foco: '#f-nome',
    corpo: `
      ${campoTexto('codigo', 'Código', Formacoes.codigoDeCopia(estado.lista, origem.codigo), { max: 10 })}
      ${campoTexto('nome', 'Nome', Formacoes.nomeDeCopia(estado.lista, origem.nome), { max: 100 })}`,
    aoSalvar: (fd) => {
      const dados = { codigo: fd.get('codigo') ?? '', nome: fd.get('nome') ?? '' };
      const erros = Formacoes.validarDados(dados, estado.lista, null);
      if (erros.length) return erros;
      const r = Formacoes.duplicar(estado.lista, origemId, dados);
      estado.lista = r.lista;
      persistir();
      toast(`"${r.formacao.nome}" criada a partir de "${origem.nome}".`);
      selecionar(r.formacao.id);
    },
  });
  form.querySelector('#f-nome').select();
}

function abrirModalAgenda() {
  const f = atual();
  const nTurmas = Turmas.turmasDaFormacao(estado.turmas, f.id).filter((x) => x.status !== 'cancelada').length;
  const { form } = modalFormulario({
    id: 'form-agenda',
    titulo: 'Agenda das aulas',
    subtitulo: `Em <strong>${esc(f.nome)}</strong>. Vale para ${nTurmas ? `as ${plural(nTurmas, 'turma')} desta formação` : 'as turmas que forem abertas nesta formação'}.`,
    rotulo: 'Salvar agenda',
    largura: 'max-w-2xl',
    corpo: Agenda.corpo(f.agenda ?? Agenda.vazia()),
    aoSalvar: (fd, formEl) => {
      const agenda = Agenda.ler(formEl);
      const erros = Formacoes.validarAgenda(agenda);
      if (erros.length) return erros;
      estado.lista = Formacoes.atualizarAgenda(estado.lista, f.id, agenda);
      persistir();
      // As turmas guardam só o texto/formato derivados (lidos por contratos e cursos) — sincroniza.
      const ag = Agenda.normalizar(agenda);
      estado.turmas = estado.turmas.map((t) => (t.formacaoId === f.id ? { ...t, turno: Agenda.descrever(ag), formato: ag.formato } : t));
      Turmas.salvar(estado.turmas);
      renderFormacao();
      toast(`Agenda salva: ${Agenda.descrever(ag)}.`);
    },
  });
  Agenda.ligar(form);
}

function abrirModalComercial() {
  const f = atual();
  const k = f.comercial;
  const t = Formacoes.totais(f, estado.cursos);
  modalFormulario({
    id: 'form-comercial',
    titulo: 'Comercial',
    subtitulo: `Em <strong>${esc(f.nome)}</strong> · a soma dos cursos avulsos é ${fmtMoeda(t.somaPrecos)}.`,
    rotulo: 'Salvar alterações',
    foco: '#f-precoReferencia',
    corpo: `
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('precoReferencia', 'Preço de referência', k.precoReferencia, { tipo: 'number', extra: 'min="0" step="10"', opcional: true, sufixo: 'R$' })}
        ${campoTexto('parcelasMax', 'Parcelamento máximo', k.parcelasMax, { tipo: 'number', extra: 'min="1" step="1"', opcional: true, sufixo: '×' })}
      </div>
      ${campoSwitch('publicadoSite', 'Publicada no site', 'Aparece no catálogo público da ProWay.', k.publicadoSite, f.status === 'ativo' ? '' : 'disabled')}
      ${f.status === 'ativo' ? '' : '<p class="text-xs text-slate-500 dark:text-neutral-400 -mt-3">Só formações ativas podem ser publicadas no site.</p>'}`,
    aoSalvar: (fd) => {
      const dados = { precoReferencia: fd.get('precoReferencia'), parcelasMax: fd.get('parcelasMax'), publicadoSite: f.status === 'ativo' && fd.has('publicadoSite') };
      const erros = Formacoes.validarComercial(dados);
      if (erros.length) return erros;
      estado.lista = Formacoes.atualizarComercial(estado.lista, f.id, dados);
      persistir(); renderFormacao();
      toast('Dados comerciais atualizados.');
    },
  });
}

// ---------- Detalhe da turma (modal): alunos matriculados × alunos da formação, e aulas previstas ----------

function abrirModalVerTurma(turmaId) {
  const f = atual();
  const t = Turmas.porId(estado.turmas, turmaId);
  const curso = Cursos.porId(estado.cursos, t.cursoId);
  const sit = Turmas.situacao(t);
  const s = Turmas.situacaoDe(sit);
  const m = Turmas.matriculas(t);
  const sala = Salas.porId(estado.salas, t.salaId);
  const instrutor = INSTRUTORES.find((i) => i.id === t.instrutorId) ?? null;
  const aulas = Turmas.aulas(t);
  const hoje = Turmas.hoje();
  const clientes = Clientes.carregar();
  const alunoDe = (id) => Clientes.porId(clientes.alunos, id);
  const nomeAluno = (id) => esc(alunoDe(id)?.nomeSocial || alunoDe(id)?.nome || 'Aluno removido');
  const data = (v) => Contratos.fmtData(v);

  // Quem está na formação (via contratos) × quem está nesta turma.
  const daFormacao = Formacoes.alunosDaFormacao(f.id, estado.cursos);
  const idsFormacao = new Set(daFormacao.map((l) => l.alunoId));
  const naTurma = m?.linhas ?? [];
  const idsTurma = new Set(naTurma.map((l) => l.alunoId));
  const foraDaTurma = daFormacao.filter((l) => !idsTurma.has(l.alunoId));
  const extras = naTurma.filter((l) => !idsFormacao.has(l.alunoId));
  const NOME_MAT = { matriculado: 'Matriculado', concluido: 'Concluído', desistiu: 'Desistiu', cancelada: 'Cancelada' };

  const NOME_SIT = (id) => SITUACOES_ALUNO.find((x) => x.id === id)?.nome ?? id;
  const THM = 'px-4 py-2 text-xs font-medium text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 sticky top-0';
  const TDM = 'px-4 py-2 text-sm';
  const linhaAluno = (l) => `
    <tr class="${l.matricula.status === 'cancelada' || l.matricula.status === 'desistiu' ? 'opacity-60' : ''}">
      <td class="${TDM}"><a href="aluno.html?id=${l.alunoId}" target="_blank" class="text-slate-800 dark:text-neutral-100 hover:underline">${nomeAluno(l.alunoId)}</a></td>
      <td class="${TDM} text-slate-600 dark:text-neutral-300">${esc(NOME_MAT[l.matricula.status] ?? l.matricula.status)}</td>
      <td class="${TDM} font-mono text-xs text-slate-500 dark:text-neutral-400">${esc(l.matricula.codigo ?? '')}</td>
      <td class="${TDM}"><a href="contrato.html?id=${l.contrato.id}" target="_blank" class="font-mono text-xs text-petrol-800 dark:text-sky-300 hover:underline">${esc(l.contrato.codigo)}</a></td>
    </tr>`;
  const linhaFora = (l) => `
    <tr class="opacity-70">
      <td class="${TDM}"><a href="aluno.html?id=${l.alunoId}" target="_blank" class="text-slate-800 dark:text-neutral-100 hover:underline">${nomeAluno(l.alunoId)}</a></td>
      <td class="${TDM} text-slate-600 dark:text-neutral-300" colspan="2">Sem matrícula nesta turma<span class="ml-1.5 text-xs text-slate-500 dark:text-neutral-400">· ${esc(NOME_SIT(l.situacaoAluno).toLowerCase())} na formação</span></td>
      <td class="${TDM}"><a href="contrato.html?id=${l.contrato.id}" target="_blank" class="font-mono text-xs text-petrol-800 dark:text-sky-300 hover:underline">${esc(l.contrato.codigo)}</a></td>
    </tr>`;
  const diaNome = (id) => (Agenda.DIAS.find((d) => d.id === id)?.nome ?? id).slice(0, 3).toLowerCase();
  const hora = (h) => h.replace(':', 'h').replace(/h00$/, 'h');
  const linhaAula = (a) => {
    const passada = a.data < hoje;
    const ehHoje = a.data === hoje;
    return `
    <tr class="${ehHoje ? 'bg-petrol-800/5 dark:bg-sky-950/40' : ''} ${passada ? 'text-slate-500 dark:text-neutral-400' : 'text-slate-800 dark:text-neutral-100'}">
      <td class="${TDM} tabular-nums text-xs text-slate-500 dark:text-neutral-400 text-right">${a.n}</td>
      <td class="${TDM} tabular-nums whitespace-nowrap ${ehHoje ? 'font-semibold text-petrol-800 dark:text-sky-300' : ''}">${data(a.data)} <span class="text-xs font-normal text-slate-500 dark:text-neutral-400">${diaNome(a.dia)}</span></td>
      <td class="${TDM} tabular-nums whitespace-nowrap text-slate-500 dark:text-neutral-400">${hora(a.inicio)}–${hora(a.fim)} · ${Turmas.horasAula(a).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h</td>
      <td class="${TDM} whitespace-nowrap ${ehHoje ? 'font-medium text-petrol-800 dark:text-sky-300' : 'text-slate-600 dark:text-neutral-300'}">${ehHoje ? 'Hoje' : passada ? 'Realizada' : 'Prevista'}</td>
    </tr>`;
  };
  const cartaoNum = (rotulo, valor, sub = '') => `
    <div class="rounded-lg border border-slate-200 dark:border-neutral-800 px-4 py-3">
      <p class="text-xs font-medium text-slate-500 dark:text-neutral-400">${rotulo}</p>
      <p class="font-display text-2xl font-semibold tabular-nums leading-tight text-slate-800 dark:text-neutral-100">${valor}</p>
      ${sub ? `<p class="text-xs text-slate-500 dark:text-neutral-400">${sub}</p>` : ''}
    </div>`;
  const realizadas = aulas.filter((a) => a.data < hoje).length;
  const saidas = (m?.desistiu ?? 0) + (m?.canceladas ?? 0);
  const alunosOrdenados = [...naTurma].sort((a, b) => nomeAluno(a.alunoId).localeCompare(nomeAluno(b.alunoId), 'pt-BR'));

  const root = abrirModal(`
    <div class="flex flex-col h-[90vh]">
      <div class="px-6 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-4 shrink-0">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 id="titulo-modal-turma" class="font-display text-xl font-semibold text-slate-900 dark:text-neutral-100"><span class="font-mono text-base text-slate-500 dark:text-neutral-400 mr-1.5">${esc(t.codigo)}</span>${esc(curso?.nome ?? '')}</h3>
            <span title="${esc(s.descricao)}" class="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-slate-600 dark:text-neutral-300">${ponto(PONTO_TURMA[sit])}${esc(s.nome)}</span>
          </div>
          <p class="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">Turma de <span class="font-mono text-xs">${esc(f.codigo)}</span> ${esc(f.nome)}</p>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            ${chip(ICONE.relogio, esc(t.turno), 'Agenda herdada da formação')}
            ${chip(ICONE.local, `${esc(formatoDe(t.formato))}${sala ? ` · ${esc(sala.nome)}` : ''}`, 'Formato e sala')}
            ${chip(ICONE.lista, `${data(t.inicio)} → ${data(t.fim)}`, 'Período')}
            ${chip(ICONE.pessoas, instrutor ? esc(instrutor.nome) : 'Instrutor a definir', 'Instrutor')}
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <a href="turma.html?id=${t.id}&aba=requisitos" target="_blank" class="${BOTAO_SEC}" title="Softwares e requisitos de máquina desta turma">Requisitos${Turmas.requisitos(t, curso).softwares.length ? ` · ${Turmas.requisitos(t, curso).softwares.length}` : ''} ${ICONE.externo}</a>
          <a href="turma.html?id=${t.id}" target="_blank" class="${BOTAO_SEC}">Abrir turma ${ICONE.externo}</a>
          <button type="button" data-fechar-modal class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${ICONE.fechar}</button>
        </div>
      </div>

      <div class="flex-1 min-h-0 flex flex-col px-6 py-4 gap-4">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          ${cartaoNum('Alunos na turma', m ? m.ocupadas : '—', `de ${plural(t.vagas, 'vaga')}${saidas ? ` · ${saidas} saíram` : ''}`, )}
          ${cartaoNum('Alunos da formação', daFormacao.length, foraDaTurma.length ? `<span class="${AVISO}">${foraDaTurma.length} fora desta turma</span>` : 'todos nesta turma')}
          ${cartaoNum('Aulas previstas', aulas.length, `${Turmas.horasAulas(aulas).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h${curso ? ` · curso ${fmtHoras(curso.cargaHoraria)}` : ''}`)}
          ${cartaoNum('Realizadas', realizadas, aulas.length ? `${Math.round((realizadas / aulas.length) * 100)}% das aulas` : '')}
        </div>

        <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 gap-4">
          <section class="lg:col-span-3 min-h-0 flex flex-col rounded-lg border border-slate-200 dark:border-neutral-800 overflow-hidden">
            <div class="px-4 py-2.5 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3 shrink-0">
              <h4 class="font-display font-semibold text-slate-800 dark:text-neutral-100">Alunos <span class="text-sm font-normal text-slate-500 dark:text-neutral-400 tabular-nums">${naTurma.length}</span></h4>
              <a href="contratos.html?novo=1" class="${BOTAO_LINK}">${ICONE.mais} Nova venda</a>
            </div>
            <div class="flex-1 min-h-0 overflow-y-auto">
              ${naTurma.length || foraDaTurma.length ? `
              <table class="w-full text-left">
                <thead><tr><th class="${THM}">Aluno</th><th class="${THM}">Matrícula</th><th class="${THM}">Código</th><th class="${THM}">Venda</th></tr></thead>
                <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">${alunosOrdenados.map(linhaAluno).join('')}</tbody>
                ${foraDaTurma.length ? `
                <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
                  <tr class="${LINHA_GRUPO}"><td colspan="4" class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-neutral-200">Na formação, fora desta turma <span class="text-xs font-normal text-slate-500 dark:text-neutral-400">· ${plural(foraDaTurma.length, 'aluno')} — entrou depois, desistiu ou cancelou</span></td></tr>
                  ${foraDaTurma.map(linhaFora).join('')}
                </tbody>` : ''}
              </table>` : '<p class="px-4 py-6 text-sm text-slate-500 dark:text-neutral-400">Nenhuma matrícula nesta turma. Os alunos entram pelo item da venda apontando para ela.</p>'}
            </div>
            <div class="px-4 py-2 border-t border-slate-200 dark:border-neutral-800 text-xs text-slate-500 dark:text-neutral-400 tabular-nums shrink-0">${m ? `${m.ativos} ativo${m.ativos === 1 ? '' : 's'} · ${m.concluidos} concluído${m.concluidos === 1 ? '' : 's'}${m.desistiu ? ` · ${m.desistiu} desistiu` : ''}${m.canceladas ? ` · ${m.canceladas} cancelada${m.canceladas === 1 ? '' : 's'}` : ''}` : ''}${extras.length ? ` · ${plural(extras.length, 'aluno')} sem venda da formação (avulso)` : ''}</div>
          </section>

          <section class="lg:col-span-2 min-h-0 flex flex-col rounded-lg border border-slate-200 dark:border-neutral-800 overflow-hidden">
            <div class="px-4 py-2.5 border-b border-slate-200 dark:border-neutral-800 shrink-0">
              <h4 class="font-display font-semibold text-slate-800 dark:text-neutral-100">Aulas agendadas <span class="text-sm font-normal text-slate-500 dark:text-neutral-400 tabular-nums">${aulas.length}</span></h4>
              <p class="text-xs text-slate-500 dark:text-neutral-400">${esc(Agenda.descrever(f.agenda))}</p>
            </div>
            <div class="flex-1 min-h-0 overflow-y-auto">
              ${aulas.length ? `
              <table class="w-full text-left">
                <thead><tr><th class="${THM} text-right">#</th><th class="${THM}">Data</th><th class="${THM}">Horário</th><th class="${THM}">Situação</th></tr></thead>
                <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">${aulas.map(linhaAula).join('')}</tbody>
              </table>` : '<p class="px-4 py-6 text-sm text-slate-500 dark:text-neutral-400">Nenhuma aula cai nos dias da agenda entre o início e o fim desta turma.</p>'}
            </div>
            <div class="px-4 py-2 border-t border-slate-200 dark:border-neutral-800 text-xs text-slate-500 dark:text-neutral-400 shrink-0">${Turmas.temAgendamento(t) ? 'Aulas agendadas na tela de agendamento (remarcações, cancelamentos e reposições já aplicados).' : 'Prévia calculada pela agenda da formação e pelo período da turma — ainda não agendada.'} Cada aula terá a própria tela (conteúdo, presenças, avaliação).</div>
          </section>
        </div>
      </div>

      <div class="px-6 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2 shrink-0">
        <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Fechar</button>
      </div>
    </div>`, 'max-w-7xl');
  // Leitor de tela anuncia a turma; o foco entra no diálogo em vez de ficar na página atrás.
  root.querySelector('[role="dialog"]').setAttribute('aria-labelledby', 'titulo-modal-turma');
  root.querySelector('[data-fechar-modal][aria-label="Fechar"]')?.focus();
  return root;
}

// ---------- Nova turma na linha do curso (RN11) ----------

// A turma nasce com a cópia dos softwares do curso (docs/turmas.md RN10; V1 sem requisitos de máquina);
// depois cada turma anda sozinha (coordenação na turma, instrutor no Portal do Professor).
function textoRequisitosDoCurso(curso) {
  const r = Turmas.requisitosDoCurso(curso);
  if (!r.softwares.length) return 'a lista de softwares do curso — que ainda está vazia (o instrutor pode definir no portal dele)';
  return `<strong>${plural(r.softwares.length, 'software')}</strong> do curso`;
}

function abrirModalNovaTurma(cursoId) {
  const f = atual();
  const curso = Cursos.porId(estado.cursos, cursoId);
  if (!Formacoes.temAgenda(f)) { toast('Defina a agenda das aulas da formação (Dados gerais) antes de abrir turmas.'); selecionar(f.id, 'dados'); return; }
  // Sugestão: turno, formato, sala e vagas da turma mais recente desta formação (as turmas de uma edição andam juntas).
  const referencia = Turmas.turmasDaFormacao(estado.turmas, f.id).filter((x) => x.status !== 'cancelada').sort((a, b) => b.inicio.localeCompare(a.inicio))[0] ?? null;
  const d = {
    cursoId, formacaoId: f.id, tipo: 'formacao', codigo: '', agenda: null,
    salaId: referencia?.salaId ?? null,
    instrutorId: curso.instrutorIds.length === 1 ? curso.instrutorIds[0] : null,
    inicio: '', fim: '', vagas: referencia?.vagas ?? '', observacoes: '', status: null,
  };
  const ctx = { lista: estado.turmas, cursos: estado.cursos, formacoes: estado.lista, salas: estado.salas };
  const opts = { cursoFixo: true, formacaoFixa: true, editando: false };
  const { form } = modalFormulario({
    id: 'form-turma',
    titulo: 'Nova turma',
    subtitulo: `<strong>${esc(curso.codigo)} · ${esc(curso.nome)}</strong> em <strong>${esc(f.codigo)}</strong>. Agenda: ${esc(Agenda.descrever(f.agenda))}.${referencia ? ` Sala e vagas sugeridas pela turma ${esc(referencia.codigo)}.` : ''} Nasce como <strong>planejada</strong>, com ${textoRequisitosDoCurso(curso)}.`,
    rotulo: 'Criar turma',
    largura: 'max-w-2xl',
    foco: '#tf-codigo',
    corpo: TurmaForm.corpo(ctx, d, opts),
    aoSalvar: (fd, form) => {
      const dados = TurmaForm.ler(fd, form);
      const erros = Turmas.validar(dados, estado.turmas, estado.cursos, null);
      if (erros.length) return erros;
      const r = Turmas.incluir(estado.turmas, dados);
      estado.turmas = r.lista;
      Turmas.salvar(estado.turmas);
      renderFormacao();
      toast(`Turma ${r.turma.codigo} criada como planejada — veja em Turmas.`);
    },
  });
  TurmaForm.ligar(form, ctx, d, { ...opts, idAtual: null });
}

function confirmarExclusao(id) {
  const f = Formacoes.porId(estado.lista, id);
  const t = Formacoes.totais(f, estado.cursos);
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
      <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Excluir formação</h3>
    </div>
    <div class="px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 space-y-2">
      <p>Excluir <strong>${esc(f.codigo)} · ${esc(f.nome)}</strong> com ${plural(t.n, 'curso')} (${fmtHoras(t.horas)})?</p>
      <p class="text-slate-500 dark:text-neutral-400">Os cursos continuam no catálogo — só a formação some. Se quiser só tirar do catálogo, prefira <em>inativar</em>.</p>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
      <button type="button" id="btn-confirmar" class="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40">Excluir</button>
    </div>`);
  root.querySelector('#btn-confirmar').addEventListener('click', () => {
    estado.lista = Formacoes.remover(estado.lista, id);
    persistir();
    fecharModal();
    toast(`"${f.nome}" excluída.`);
    selecionar(null);
  });
}

// ---------- Seletor de cursos (modal, seleção múltipla, filtro por eixo) ----------

function abrirSeletorCursos() {
  const f = atual();
  const jaTem = new Set(f.itens.map((i) => i.cursoId));
  const disponiveis = estado.cursos
    .filter((c) => !jaTem.has(c.id) && c.status !== 'inativo')
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const marcados = new Set();
  let filtroArea = '';
  let obrigatorio = true;

  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
      <div>
        <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Adicionar cursos</h3>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Em <strong>${esc(f.nome)}</strong> · marque um ou mais cursos do catálogo; entram no fim da sequência.</p>
      </div>
      <button type="button" data-fechar-modal class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${ICONE.fechar}</button>
    </div>
    <div class="px-5 pt-4 pb-2 flex flex-wrap items-center gap-2">
      ${busca('busca-sel', '', 'Buscar curso', 'flex-1 min-w-48')}
      ${campoCombo('filtro-eixo-sel', EIXOS, '', { id: 'filtro-eixo-sel', vazio: 'Eixo', filtro: true })}
      <button type="button" id="btn-marcar" class="${BOTAO_SEC} shrink-0"></button>
    </div>
    <div id="lista-sel" class="max-h-96 overflow-y-auto px-3 pb-2"></div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-4">
        <span id="resumo-sel" class="text-xs text-slate-500 dark:text-neutral-400 tabular-nums"></span>
        <label class="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-neutral-300 cursor-pointer"><input type="checkbox" id="sel-obrigatorio" class="${CHECK}" checked> Entram como obrigatórios</label>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
        <button type="button" id="btn-confirmar-sel" class="${BOTAO_PRI}" disabled></button>
      </div>
    </div>`, 'max-w-3xl');

  const lista = root.querySelector('#lista-sel');
  const campoBusca = root.querySelector('#busca-sel');
  const selEixo = root.querySelector('[data-name="filtro-eixo-sel"] input[type="hidden"]');
  ativarCombos(root);
  const btnMarcar = root.querySelector('#btn-marcar');
  const btnConfirmar = root.querySelector('#btn-confirmar-sel');
  const resumo = root.querySelector('#resumo-sel');
  let visiveis = [];

  const horasMarcadas = () => disponiveis.filter((c) => marcados.has(c.id)).reduce((s, c) => s + (Number(c.cargaHoraria) || 0), 0);
  const atualizarRodape = () => {
    const n = marcados.size;
    btnConfirmar.disabled = n === 0;
    btnConfirmar.textContent = n ? `Adicionar ${plural(n, 'curso')} · ${fmtHoras(horasMarcadas())}` : 'Adicionar';
    resumo.textContent = n ? `${n} de ${disponiveis.length} selecionados` : `${plural(disponiveis.length, 'curso')} disponíve${disponiveis.length === 1 ? 'l' : 'is'}`;
    const todos = visiveis.length > 0 && visiveis.every((c) => marcados.has(c.id));
    btnMarcar.disabled = visiveis.length === 0;
    btnMarcar.textContent = todos ? 'Desmarcar todos' : `Marcar ${campoBusca.value || filtroArea ? 'encontrados' : 'todos'}`;
  };

  const render = () => {
    const termo = Formacoes.normalizar(campoBusca.value);
    visiveis = disponiveis.filter((c) => (!termo || Formacoes.normalizar(`${c.codigo} ${c.nome} ${c.resumo}`).includes(termo)) && (!filtroArea || c.eixoId === filtroArea));
    // Agrupa por eixo para o usuário enxergar a mistura (técnicas, humanas, idiomas…).
    const grupos = EIXOS.map((a) => ({ a, cursos: visiveis.filter((c) => c.eixoId === a.id) })).filter((g) => g.cursos.length);
    lista.innerHTML = grupos.length ? grupos.map((g) => `
      <p class="px-2 pt-3 pb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-neutral-400">${pontoEixo(g.a.id)}${esc(g.a.nome)}</p>
      ${g.cursos.map((c) => {
        const on = marcados.has(c.id);
        return `
        <label class="flex items-center gap-3 rounded-lg px-2 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-neutral-900 ${on ? 'bg-petrol-800/5 dark:bg-sky-950/40' : ''}">
          <input type="checkbox" data-marcar="${c.id}" class="${CHECK}" ${on ? 'checked' : ''}>
          <span class="min-w-0 flex-1">
            <span class="block text-sm text-slate-800 dark:text-neutral-100 truncate"><span class="font-mono text-xs text-slate-500 dark:text-neutral-400 mr-1.5">${esc(c.codigo)}</span>${esc(c.nome)}${c.status !== 'ativo' ? ` ${pilula(PILULA[c.status], statusCurso(c.status).nome)}` : ''}</span>
            <span class="block text-xs text-slate-500 dark:text-neutral-400 truncate">${esc(nivelDe(c.nivel))} · ${c.formatos.map(formatoDe).join(', ')}${c.resumo ? ` · ${esc(c.resumo)}` : ''}</span>
          </span>
          <span class="shrink-0 text-sm font-medium tabular-nums text-slate-700 dark:text-neutral-200">${fmtHoras(c.cargaHoraria)}</span>
        </label>`;
      }).join('')}`).join('') : `<p class="px-2 py-4 text-sm text-slate-500 dark:text-neutral-400">${campoBusca.value || filtroArea ? 'Nenhum resultado.' : 'Todos os cursos do catálogo já estão nesta formação.'}</p>`;
    lista.querySelectorAll('[data-marcar]').forEach((ch) => ch.addEventListener('change', () => {
      ch.checked ? marcados.add(ch.dataset.marcar) : marcados.delete(ch.dataset.marcar);
      ch.closest('label').classList.toggle('bg-petrol-800/5', ch.checked);
      ch.closest('label').classList.toggle('dark:bg-sky-950/40', ch.checked);
      atualizarRodape();
    }));
    atualizarRodape();
  };

  btnMarcar.addEventListener('click', () => {
    const todos = visiveis.every((c) => marcados.has(c.id));
    visiveis.forEach((c) => (todos ? marcados.delete(c.id) : marcados.add(c.id)));
    render();
  });
  root.querySelector('#sel-obrigatorio').addEventListener('change', (e) => { obrigatorio = e.target.checked; });
  btnConfirmar.addEventListener('click', () => {
    const ids = disponiveis.filter((c) => marcados.has(c.id)).map((c) => c.id);
    const horas = horasMarcadas();
    estado.lista = Formacoes.adicionarCursos(estado.lista, f.id, ids, obrigatorio);
    persistir();
    fecharModal();
    renderFormacao();
    toast(`${plural(ids.length, 'curso')} adicionado${ids.length === 1 ? '' : 's'} (+${fmtHoras(horas)}) — total ${fmtHoras(Formacoes.totais(atual(), estado.cursos).horas)}.`);
  });
  campoBusca.addEventListener('input', render);
  selEixo.addEventListener('change', () => { filtroArea = selEixo.value; render(); });
  render();
  campoBusca.focus();
}

// ---------- Boot ----------

(function iniciar() {
  const aba = parametroUrl('aba');
  if (MODO === 'lista') {
    // URL antiga (formacoes.html?formacao=X) → redireciona para o detalhe, preservando a aba.
    const antigo = parametroUrl('formacao');
    if (antigo) { location.replace(urlDetalhe(antigo, aba)); return; }
    renderLista();
    if (parametroUrl('erro') === 'nao-encontrado') { toast('Formação não encontrada.'); history.replaceState(null, '', location.pathname); }
    return;
  }
  const id = parametroUrl('id');
  if (!id || !Formacoes.porId(estado.lista, id)) { location.replace(`${PAGINA_LISTA}?erro=nao-encontrado`); return; }
  estado.selecionado = id;
  const abaReal = ABAS_ABSORVIDAS[aba] ?? aba;
  estado.aba = ABAS.some((a) => a.id === abaReal) ? abaReal : 'cursos';
  if (aba && aba !== estado.aba) atualizarUrl();
  renderFormacao();
})();
