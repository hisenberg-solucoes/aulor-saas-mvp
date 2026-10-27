// ============================================================
// UI da tela "Turmas". Regras no motor (Turmas.*); cursos, formações,
// salas e matrículas vêm das persistências das outras telas.
// Duas páginas com este mesmo script (docs/padrao-tela-detalhe.md):
//   turmas.html (lista) e turma.html?id= (detalhe, body[data-modo="detalhe"]).
// V1 (escopo ProWay): dados da turma, aulas e requisitos de software. Sem indicadores,
// risco, presenças, dossiês, avaliações, gravações e custos.
// ============================================================

const MODO = document.body.dataset.modo === 'detalhe' ? 'detalhe' : 'lista';
const URL_LISTA = 'turmas.html';
const urlDetalhe = (id) => `turma.html?id=${encodeURIComponent(id)}`;

const estado = {
  lista: Turmas.carregar(),
  cursos: Cursos.carregar(),
  formacoes: Formacoes.carregar(),
  salas: Salas.carregar(),
  clientes: Clientes.carregar(),
  selecionado: null,
  aba: 'geral', // geral | calendario | aulas | requisitos (turma aberta; espelhada em ?aba=)
  filtros: { busca: '', formacaoId: '', situacao: '', instrutorId: '', formato: '' },
  agrupar: '', // '' | 'formacao' (lista agrupada por formação, avulsas num grupo próprio)
  gruposFechados: new Set(), // ids de formação (ou '__avulsa') recolhidos na lista agrupada
};

const ICONE = {
  video: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>',
  play: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>',
  copiar: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>',
  lapis: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>',
  lixeira: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>',
  mais: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>',
  lupa: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>',
  fechar: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>',
  relogio: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
  calendario: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>',
  local: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>',
  pessoa: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>',
  pessoas: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>',
  alerta: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>',
  alertaP: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>',
  externo: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>',
  check: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>',
  baixo: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>',
  tag: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" /></svg>',
  chevron: '<svg class="h-4 w-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>',
};

const BOTAO_SEC = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-40 disabled:pointer-events-none';
const BOTAO_PRI = 'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/40';
const BOTAO_CANCELAR = 'px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition';
const BOTAO_LINK = 'inline-flex items-center gap-1 text-xs font-medium text-petrol-800 dark:text-sky-300 hover:underline';
const CAMPO_BUSCA = 'h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 pl-8 pr-3 text-sm text-slate-700 dark:text-neutral-200 placeholder:text-slate-400 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400 focus:ring-2 focus:ring-petrol-800/20';
const SELECT_FILTRO = 'h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2.5 text-sm text-slate-700 dark:text-neutral-200 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400';
const BOTAO_FANTASMA = 'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm font-medium text-slate-500 dark:text-neutral-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-40 disabled:pointer-events-none';
const CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)]';
const TH = 'px-4 py-2.5';
const TD = 'px-4 py-2.5 text-sm text-slate-600 dark:text-neutral-300';
const THEAD = 'text-xs font-medium text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800';
const FOCO_LINHA = 'has-[.link-registro:focus-visible]:bg-slate-50 dark:has-[.link-registro:focus-visible]:bg-neutral-900 has-[.link-registro:focus-visible]:outline-2 has-[.link-registro:focus-visible]:-outline-offset-2 has-[.link-registro:focus-visible]:outline-[color:var(--f-foco)]';
const AVISO = 'text-[color:var(--f-aviso)]';
const FILTRO_ATIVO = 'border-petrol-800 dark:border-sky-400 text-petrol-800 dark:text-sky-300';

// Pílula só de exceção (Regra da Pílula de Exceção): confirmada, em andamento e matriculado são o comum e não se anunciam.
const PILULA = {
  neutra: 'bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-400',
  extra: 'bg-petrol-800/10 text-petrol-900 dark:bg-sky-950/60 dark:text-sky-200',
  falta: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  concluido: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
};
// Situação: ponto na cor da fase + nome em texto. Âmbar espera ação; vazado é cancelada.
const PONTO_SITUACAO = {
  planejada: 'bg-amber-500',
  confirmada: 'bg-sky-600 dark:bg-sky-400',
  em_andamento: 'bg-emerald-500',
  concluida: 'bg-slate-400 dark:bg-neutral-500',
  cancelada: 'ring-1 ring-inset ring-slate-400 dark:ring-neutral-500',
};
const NOME_MATRICULA = { matriculado: 'Matriculado', concluido: 'Concluído', desistiu: 'Desistiu', cancelada: 'Cancelada' };

// ---------- Helpers ----------

function pilula(classe, texto, titulo = '') {
  return `<span title="${esc(titulo)}" class="pilula inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ${classe}">${esc(texto)}</span>`;
}

const ponto = (sit) => `<span class="inline-block h-2 w-2 shrink-0 rounded-full align-middle -mt-px ${PONTO_SITUACAO[sit]}"></span>`;

function situacaoHtml(sit, s) {
  return `<span title="${esc(s.descricao)}" class="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-slate-600 dark:text-neutral-300">${ponto(sit)}${esc(s.nome)}</span>`;
}

function chip(icone, conteudo, titulo = '') {
  return `<span title="${esc(titulo)}" class="inline-flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-neutral-300"><span class="text-slate-400 dark:text-neutral-500">${icone}</span>${conteudo}</span>`;
}

// Cabeçalho padrão dos cartões: título, frase de contexto e a ação do cartão em botão fantasma; sem divisória.
function cabecalhoSecao(titulo, subtitulo, acaoHtml = '') {
  return `
    <div class="px-4 pt-4 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="font-display text-[15px] font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h3>
        ${subtitulo ? `<p class="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">${subtitulo}</p>` : ''}
      </div>
      ${acaoHtml ? `<div class="-mt-1 -mr-1.5 flex shrink-0 items-center gap-1">${acaoHtml}</div>` : ''}
    </div>`;
}

// Faixa do topo do registro: só quando alguém precisa agir (Regra da Faixa que Pede Ação). Sem contorno.
function faixa(tom, html) {
  const cores = {
    erro: 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-200',
    aviso: 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
    petrol: 'bg-petrol-800/10 dark:bg-sky-950/40 text-petrol-900 dark:text-sky-200',
  };
  return `<div class="mb-4 flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${cores[tom]}"><span class="shrink-0">${ICONE.alerta}</span><div class="min-w-0 flex-1">${html}</div></div>`;
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

const cursoDe = (id) => Cursos.porId(estado.cursos, id);
const formacaoDe = (id) => (id ? Formacoes.porId(estado.formacoes, id) : null);
const salaDe = (id) => (id ? Salas.porId(estado.salas, id) : null);
const instrutorDe = (id) => INSTRUTORES.find((i) => i.id === id) ?? null;
const alunoDe = (id) => Clientes.porId(estado.clientes.alunos, id);
const formatoDe = (id) => FORMATOS.find((f) => f.id === id)?.nome ?? id;
// "03/08" no ano corrente; "03/08/27" em outro ano (a semente vai de 2025 a 2027).
const fmtData = (iso) => (!iso ? '—' : iso.slice(0, 4) === Turmas.hoje().slice(0, 4) ? dataCurta(iso) : `${dataCurta(iso)}/${iso.slice(2, 4)}`);

function contexto(t) {
  return { curso: cursoDe(t.cursoId), formacao: formacaoDe(t.formacaoId), sala: salaDe(t.salaId), instrutor: instrutorDe(t.instrutorId) };
}

function rotuloTipo(t) {
  const f = formacaoDe(t.formacaoId);
  return t.tipo === 'formacao' ? (f ? `${f.codigo}` : 'Formação') : TIPOS_TURMA[t.tipo];
}

function persistir() {
  Turmas.salvar(estado.lista);
}

function atual() {
  return Turmas.porId(estado.lista, estado.selecionado);
}

// Navega entre lista e detalhe (páginas separadas): null → lista, id → turma.html?id=.
function selecionar(id) {
  location.href = id ? urlDetalhe(id) : URL_LISTA;
}

function campo(rotulo, valorHtml, largura = '') {
  return `
    <div class="${largura}">
      <p class="text-xs font-medium text-slate-500 dark:text-neutral-400">${rotulo}</p>
      <div class="text-sm text-slate-800 dark:text-neutral-100 mt-0.5 break-words">${valorHtml}</div>
    </div>`;
}

const vazio = (txt = 'a definir') => `<span class="text-slate-500 dark:text-neutral-400">${txt}</span>`;

// Conclusão da turma: aulas realizadas (data anterior a hoje, não canceladas) sobre as previstas.
// Matrículas/vagas ficam no balão da barra.
function barraConclusao(t, m) {
  const aulas = Turmas.aulas(t).filter((a) => a.status !== 'cancelada');
  const hoje = Turmas.hoje();
  const realizadas = aulas.filter((a) => a.data < hoje).length;
  const pct = aulas.length ? Math.round((realizadas / aulas.length) * 100) : 0;
  const sit = Turmas.situacao(t);
  // Medidor: trilho em etiqueta, preenchimento em tinta (DESIGN.md › Medidor); concluir não ganha verde.
  const cor = sit === 'cancelada' ? 'bg-slate-300 dark:bg-neutral-700' : 'bg-petrol-950 dark:bg-areia';
  const dica = `${plural(realizadas, 'aula realizada', 'aulas realizadas')} de ${aulas.length} · ${m ? `${m.ocupadas}/${t.vagas} vagas ocupadas` : `${t.vagas} vagas`}`;
  return `
    <div title="${esc(dica)}">
      <div class="flex items-center justify-between text-xs tabular-nums"><span class="text-slate-700 dark:text-neutral-200">${realizadas}/${aulas.length}</span><span class="text-slate-500 dark:text-neutral-400">${pct}%</span></div>
      <div class="relative h-1.5 rounded-full bg-slate-100 dark:bg-neutral-900 mt-1"><span class="absolute inset-y-0 left-0 rounded-full ${cor}" style="width:${pct}%"></span></div>
    </div>`;
}

// Coluna Matrículas da lista: ocupadas/vagas.
function celulaMatriculas(t, m) {
  return `<span class="tabular-nums text-xs" title="${esc(`${m ? m.ocupadas : 0} matrículas em ${t.vagas} vagas`)}">${m ? m.ocupadas : '—'}<span class="text-slate-500 dark:text-neutral-400">/${t.vagas}</span></span>`;
}

// ---------- Lista ----------

function renderLista() {
  const el = document.getElementById('tela');
  const f = estado.filtros;
  const visiveis = Turmas.filtrar(estado.lista, estado.cursos, f);
  const filtrando = f.busca || f.formacaoId || f.situacao || f.instrutorId || f.formato;
  // O filtro escolhido fica em petróleo; a largura máxima evita que a opção mais longa (nome da formação) estique a barra.
  const select = (id, rotulo, opcoes, valor) => `
    <select id="${id}" class="${SELECT_FILTRO} max-w-32 ${valor ? FILTRO_ATIVO : ''}" title="${rotulo}" aria-label="${rotulo}">
      <option value="">${rotulo}</option>
      ${opcoes.map((o) => `<option value="${o.id}" ${o.id === valor ? 'selected' : ''}>${esc(o.nome)}</option>`).join('')}
    </select>`;
  const formacoesOpc = [{ id: '__avulsa', nome: 'Avulsas (abertas e in company)' }, ...estado.formacoes.filter((x) => estado.lista.some((t) => t.formacaoId === x.id)).sort((a, b) => b.codigo.localeCompare(a.codigo)).map((x) => ({ id: x.id, nome: `${x.codigo} · ${x.nome}` }))];
  const instrutoresOpc = INSTRUTORES.filter((i) => estado.lista.some((t) => t.instrutorId === i.id)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  // Uma linha por turma, cinco colunas fixas para caber em 1280px. Situação em ponto + texto (situacaoHtml);
  // a segunda linha da turma troca a oferta pelas pendências, quando há e alguém ainda pode agir.
  const linha = (t) => {
    const { curso, formacao, sala, instrutor } = contexto(t);
    const m = Turmas.matriculas(t);
    const sit = Turmas.situacao(t);
    const s = Turmas.situacaoDe(sit);
    const encerrada = sit === 'cancelada' || sit === 'concluida';
    const pend = encerrada ? [] : Turmas.pendencias(t, { curso, formacao, sala, instrutor, ocupadas: m?.ocupadas ?? null });
    const oferta = [t.tipo === 'formacao' ? (formacao ? `Formação ${formacao.codigo}` : 'Formação') : TIPOS_TURMA[t.tipo], curso ? `${Number(curso.cargaHoraria).toLocaleString('pt-BR')} h` : ''].filter(Boolean).join(' · ');
    const agenda = `${t.turno} · ${formatoDe(t.formato)}`;
    return `
      <tr data-abrir="${t.id}" class="cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900 transition ${FOCO_LINHA} ${encerrada ? 'linha-apagada' : ''}">
        <td class="${TH}">
          <p class="truncate"><span class="font-mono text-xs text-slate-500 dark:text-neutral-400 mr-1.5">${esc(t.codigo)}</span><a href="${urlDetalhe(t.id)}" class="link-registro text-sm font-medium text-slate-800 dark:text-neutral-100 hover:underline underline-offset-2 focus-visible:outline-none" title="${esc(curso?.nome ?? '')}">${esc(curso?.nome ?? 'Curso removido')}</a></p>
          ${pend.length
            ? `<p class="text-xs ${AVISO} truncate" title="${esc(pend.join(' · '))}">${plural(pend.length, 'pendência')}: ${esc(pend.join(' · '))}</p>`
            : `<p class="text-xs text-slate-500 dark:text-neutral-400 truncate" title="${esc(formacao?.nome ?? '')}">${esc(oferta)}</p>`}
        </td>
        <td class="${TD}"><p class="tabular-nums whitespace-nowrap">${fmtData(t.inicio)} → ${fmtData(t.fim)}</p><p class="text-xs text-slate-500 dark:text-neutral-400 truncate" title="${esc(agenda)}">${esc(agenda)}</p></td>
        <td class="${TD}"><p class="truncate">${instrutor ? esc(instrutor.nome) : vazio('instrutor a definir')}</p><p class="text-xs text-slate-500 dark:text-neutral-400 truncate">${sala ? esc(sala.nome) : t.formato === 'online' ? 'online' : 'sala a definir'}</p></td>
        <td class="${TH}">${celulaMatriculas(t, m)}</td>
        <td class="${TH}">${barraConclusao(t, m)}</td>
        <td class="${TD}"><p>${situacaoHtml(sit, s)}</p></td>
      </tr>`;
  };

  el.innerHTML = `
    <div class="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 class="font-display text-xl font-semibold text-slate-900 dark:text-neutral-100">Turmas</h2>
        <p class="max-w-3xl text-sm text-slate-600 dark:text-neutral-400 mt-0.5">Cada turma é um curso do catálogo acontecendo num período, com agenda, instrutor, sala e vagas. Turmas de formação nascem na linha do curso, em <a href="formacoes.html" class="text-petrol-800 dark:text-sky-300 hover:underline">Formações</a>.</p>
      </div>
      <button type="button" id="btn-nova" class="${BOTAO_PRI} shrink-0">${ICONE.mais} Nova turma</button>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-2">
      ${busca('busca-turma', f.busca, 'Buscar código, curso ou instrutor', 'w-56')}
      <div class="ml-auto flex flex-wrap items-center gap-2">
        ${select('filtro-formacao', 'Formação', formacoesOpc, f.formacaoId)}
        ${select('filtro-formato', 'Formato', Agenda.FORMATOS_AULA, f.formato)}
        ${select('filtro-instrutor', 'Instrutor', instrutoresOpc, f.instrutorId)}
        ${select('filtro-situacao', 'Situação', Turmas.SITUACOES, f.situacao)}
        ${select('agrupar', 'Sem agrupar', [{ id: 'formacao', nome: 'Agrupar por formação' }], estado.agrupar)}
        ${filtrando ? `<button type="button" id="btn-limpar-filtros" class="${BOTAO_LINK}">Limpar</button>` : ''}
      </div>
    </div>

    <div class="${CARTAO} overflow-x-auto">
      <table class="w-full table-fixed text-left">
        <thead class="${THEAD}">
          <tr>
            <th class="${TH}">Turma</th>
            <th class="${TH} w-[168px]">Período e agenda</th>
            <th class="${TH} w-[168px]">Instrutor e sala</th>
            <th class="${TH} w-[104px]" title="Matrículas que ocupam vaga / vagas">Matrículas</th>
            <th class="${TH} w-[96px]" title="Aulas realizadas / previstas">Aulas</th>
            <th class="${TH} w-[132px]">Situação</th>
          </tr>
        </thead>
        ${visiveis.length ? (estado.agrupar === 'formacao' ? gruposPorFormacao(visiveis, linha) : `<tbody class="divide-y divide-slate-100 dark:divide-neutral-900">${visiveis.map(linha).join('')}</tbody>`) : `
        <tbody><tr><td colspan="6" class="px-4 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">
          ${estado.lista.length ? 'Nenhuma turma corresponde aos filtros.' : 'Nenhuma turma cadastrada ainda.'}
          ${estado.lista.length ? '' : `<br><button type="button" id="btn-nova-vazio" class="${BOTAO_PRI} mt-4">${ICONE.mais} Criar a primeira turma</button>`}
        </td></tr></tbody>`}
      </table>
      <div class="px-4 py-2.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-neutral-200 tabular-nums">
        <span>${plural(visiveis.length, 'turma')}${filtrando ? ` de ${estado.lista.length}` : ''}</span>
        ${estado.agrupar && visiveis.length ? `<button type="button" id="btn-grupos" class="${BOTAO_LINK}">${estado.gruposFechados.size ? 'Expandir todos' : 'Minimizar todos'}</button>` : ''}
      </div>
    </div>`;

  const campoBusca = el.querySelector('#busca-turma');
  campoBusca.addEventListener('input', () => { estado.filtros.busca = campoBusca.value; const [ini, fim] = [campoBusca.selectionStart, campoBusca.selectionEnd]; renderLista(); const novo = document.getElementById('busca-turma'); novo.focus(); novo.setSelectionRange(ini, fim); });
  [['filtro-formacao', 'formacaoId'], ['filtro-formato', 'formato'], ['filtro-instrutor', 'instrutorId'], ['filtro-situacao', 'situacao']].forEach(([id, chave]) => {
    el.querySelector(`#${id}`).addEventListener('change', (e) => { estado.filtros[chave] = e.target.value; renderLista(); });
  });
  el.querySelector('#btn-limpar-filtros')?.addEventListener('click', () => { estado.filtros = { busca: '', formacaoId: '', situacao: '', instrutorId: '', formato: '' }; renderLista(); });
  el.querySelector('#agrupar').addEventListener('change', (e) => { estado.agrupar = e.target.value; estado.gruposFechados.clear(); renderLista(); });
  el.querySelector('#btn-grupos')?.addEventListener('click', () => {
    if (estado.gruposFechados.size) estado.gruposFechados.clear();
    else el.querySelectorAll('[data-grupo]').forEach((tr) => estado.gruposFechados.add(tr.dataset.grupo));
    renderLista();
  });
  el.querySelectorAll('[data-grupo]').forEach((tr) => tr.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    const id = tr.dataset.grupo;
    if (estado.gruposFechados.has(id)) estado.gruposFechados.delete(id); else estado.gruposFechados.add(id);
    renderLista();
  }));
  el.querySelector('#btn-nova').addEventListener('click', () => abrirDrawerTurma());
  el.querySelector('#btn-nova-vazio')?.addEventListener('click', () => abrirDrawerTurma());
  // O nome é o link (teclado, ⌘-clique); o resto da linha abre a mesma turma, a não ser que a pessoa esteja selecionando texto.
  el.querySelector('table').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-abrir]');
    if (!tr || e.target.closest('a, button') || getSelection().toString()) return;
    if (e.metaKey || e.ctrlKey) window.open(urlDetalhe(tr.dataset.abrir), '_blank'); else selecionar(tr.dataset.abrir);
  });
}

// Lista agrupada por formação: uma faixa recolhível por formação (código, nome, período, turmas e
// situações) com as turmas em ordem de início; turmas avulsas (abertas e in company) num grupo no fim.
function gruposPorFormacao(visiveis, linha) {
  const porGrupo = new Map();
  visiveis.forEach((t) => {
    const id = t.tipo === 'formacao' && t.formacaoId ? t.formacaoId : '__avulsa';
    if (!porGrupo.has(id)) porGrupo.set(id, []);
    porGrupo.get(id).push(t);
  });
  const grupos = [...porGrupo.entries()]
    .map(([id, turmas]) => ({ id, formacao: id === '__avulsa' ? null : formacaoDe(id), turmas: [...turmas].sort((a, b) => a.inicio.localeCompare(b.inicio) || a.codigo.localeCompare(b.codigo, 'pt-BR')) }))
    .sort((a, b) => (a.id === '__avulsa') - (b.id === '__avulsa') || (b.formacao?.codigo ?? '').localeCompare(a.formacao?.codigo ?? ''));
  return grupos.map((g) => {
    const fechado = estado.gruposFechados.has(g.id);
    const inicio = g.turmas.map((t) => t.inicio).filter(Boolean).sort()[0];
    const fim = g.turmas.map((t) => t.fim).filter(Boolean).sort().at(-1);
    const contagem = Turmas.contagem(g.turmas);
    const situacoes = Turmas.SITUACOES.filter((x) => contagem[x.id]).map((x) => `${contagem[x.id]} ${x.nome.toLowerCase()}`).join(' · ');
    const titulo = g.formacao
      ? `<span class="font-mono text-xs text-slate-500 dark:text-neutral-400 mr-1.5">${esc(g.formacao.codigo)}</span>${esc(g.formacao.nome)}`
      : g.id === '__avulsa' ? 'Turmas avulsas' : 'Formação removida';
    return `
      <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
        <tr data-grupo="${esc(g.id)}" class="cursor-pointer select-none bg-slate-50/70 dark:bg-neutral-925 border-y border-slate-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-900 transition">
          <td colspan="6" class="px-4 py-2">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span class="text-slate-500 dark:text-neutral-400 ${fechado ? '-rotate-90' : ''} transition-transform">${ICONE.chevron}</span>
              <span class="font-semibold text-slate-800 dark:text-neutral-100">${titulo}</span>
              ${g.formacao ? `<a href="formacao.html?id=${esc(g.formacao.id)}" class="${BOTAO_LINK}">abrir formação ${ICONE.externo}</a>` : ''}
              <span class="text-xs text-slate-500 dark:text-neutral-400 tabular-nums">${plural(g.turmas.length, 'turma')}${inicio ? ` · ${fmtData(inicio)} → ${fmtData(fim)}` : ''}${situacoes ? ` · ${situacoes}` : ''}</span>
            </div>
          </td>
        </tr>
        ${fechado ? '' : g.turmas.map(linha).join('')}
      </tbody>`;
  }).join('');
}

// ---------- Turma aberta ----------

// Abas da ficha (Regra da Linha de Abas): Aulas junta Calendário e Lista como partes no controle segmentado.
// Cada parte guarda o id antigo na URL (?aba=calendario | aulas), para os links de outras telas não quebrarem.
const ABAS = [
  { id: 'geral', titulo: 'Acompanhamento' },
  { id: 'aulas', titulo: 'Aulas', partes: [{ id: 'calendario', titulo: 'Calendário' }, { id: 'aulas', titulo: 'Lista' }] },
  { id: 'requisitos', titulo: 'Requisitos' },
];
const abaDe = (id) => ABAS.find((a) => a.id === id || a.partes?.some((p) => p.id === id)) ?? ABAS[0];
const IDS_ABA = ABAS.flatMap((a) => (a.partes ? a.partes.map((p) => p.id) : [a.id]));

function irParaAba(id) {
  estado.aba = id;
  const url = new URL(location.href);
  if (id === 'geral') url.searchParams.delete('aba'); else url.searchParams.set('aba', id);
  history.replaceState(null, '', url);
  renderTurma();
}

function renderTurma() {
  const el = document.getElementById('tela');
  const t = atual();
  const { curso, formacao, sala, instrutor } = contexto(t);
  const m = Turmas.matriculas(t);
  const sit = Turmas.situacao(t);
  const s = Turmas.situacaoDe(sit);
  const encerrada = sit === 'cancelada' || sit === 'concluida';
  // Turma encerrada não tem pendência: ninguém vai agir sobre ela (Regra da Faixa que Pede Ação).
  const pend = encerrada ? [] : Turmas.pendencias(t, { curso, formacao, sala, instrutor, ocupadas: m?.ocupadas ?? null });
  const agenda = Turmas.agendaDe(t);
  const podeExcluir = Turmas.podeExcluir(t);
  const podeEditar = Turmas.podeEditar(t);
  const aba = abaDe(estado.aba);
  // Pílula só de exceção: concluída e cancelada. Planejada vai na faixa com o Confirmar (Dito uma Vez).
  const pilulas = encerrada ? pilula(PILULA.neutra, s.nome, s.descricao) : '';
  const oferta = t.tipo === 'formacao'
    ? (formacao ? `<a href="formacao.html?id=${esc(formacao.id)}" class="hover:underline" title="${esc(formacao.nome)}">formação ${esc(formacao.codigo)}</a>` : 'formação')
    : esc(TIPOS_TURMA[t.tipo]).toLowerCase();
  const tituloEditar = podeEditar ? 'Editar dados da turma' : sit === 'cancelada' ? 'Turma cancelada — reabra pelo menu Mais para editar' : 'Turma concluída — os dados ficam como registro';
  // Uma ação à vista; o resto no "Mais" (o Meet da turma primeiro), com o motivo de cada item travado.
  const itensMais = [
    t.meetLink && !encerrada ? { nome: 'Abrir Meet', detalhe: 'Sala do Google Meet da turma, em outra aba', acao: () => window.open(t.meetLink, '_blank', 'noopener') } : null,
    Turmas.podeConfirmar(t) ? { nome: 'Confirmar turma', detalhe: 'Instrutor, sala e datas fechados', acao: () => alterarSituacao(t, 'confirmada') } : null,
    Turmas.podeReabrir(t) ? { nome: 'Reabrir', detalhe: 'Volta para planejada', acao: () => alterarSituacao(t, 'planejada') } : null,
    'sep',
    Turmas.podeCancelar(t) ? { nome: 'Cancelar turma', perigo: true, detalhe: 'Sai das opções de venda; fica no histórico', acao: () => confirmarCancelamento(t.id) } : null,
    { nome: 'Excluir turma', perigo: true, desabilitado: !podeExcluir, detalhe: podeExcluir ? 'Não tem matrículas' : 'Tem matrículas vinculadas — cancele em vez de excluir', acao: () => confirmarExclusao(t.id) },
  ].filter(Boolean).filter((it, i, arr) => it !== 'sep' || (i > 0 && i < arr.length - 1));

  const abaBotao = (a) => {
    const ativa = a === aba;
    const alvo = a.partes ? (ativa ? estado.aba : a.partes[0].id) : a.id;
    const n = contadorAba(t, a.id);
    return `
      <button type="button" role="tab" data-aba="${alvo}" aria-selected="${ativa}"
        class="px-0.5 pb-2.5 text-sm border-b-2 transition whitespace-nowrap ${ativa ? 'border-[color:var(--f-marca-tinta)] text-slate-900 dark:text-neutral-100 font-medium' : 'border-transparent text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'}">${a.titulo}${n ? (n.atencao
          ? ` <span class="ml-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 text-[11px] font-semibold tabular-nums" title="${esc(n.titulo)}">${n.valor}</span>`
          : ` <span class="ml-1 text-xs text-slate-600 dark:text-neutral-400 tabular-nums" title="${esc(n.titulo)}">${n.valor}</span>`) : ''}</button>`;
  };

  el.innerHTML = `
    <nav aria-label="Breadcrumb" class="mb-3 flex items-center gap-1.5 text-sm text-slate-600 dark:text-neutral-400">
      <a href="${URL_LISTA}" class="hover:text-petrol-800 dark:hover:text-sky-300 transition">Turmas</a>
      <span>/</span>
      <span class="font-medium text-slate-800 dark:text-neutral-100 truncate max-w-md" aria-current="page"><span class="font-mono text-xs text-slate-600 dark:text-neutral-400 mr-1">${esc(t.codigo)}</span>${esc(curso?.nome ?? 'Curso removido')}</span>
    </nav>
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1 basis-80 flex items-start gap-3">
        <div class="h-12 w-12 shrink-0 rounded-xl bg-petrol-800/10 dark:bg-sky-950/60 text-petrol-800 dark:text-sky-300 grid place-items-center px-1 text-center font-mono font-semibold leading-tight break-all ${(curso?.codigo ?? '').length > 5 ? 'text-xs' : 'text-sm'}" title="Código do curso">${esc(curso?.codigo ?? '—')}</div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2 min-w-0">
            <h2 class="font-registro text-[26px] leading-[1.15] font-semibold tracking-[-0.01em] text-slate-900 dark:text-neutral-100">${esc(curso?.nome ?? 'Curso removido')}</h2>
            ${pilulas}
          </div>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
            ${chip(ICONE.tag, `<span class="font-mono">${esc(t.codigo)}</span> · ${oferta}`, 'Código da turma e oferta')}
            ${chip(ICONE.relogio, esc(Agenda.descrever(agenda)), t.formacaoId ? 'Agenda herdada da formação' : 'Agenda da turma')}
            ${chip(ICONE.local, `${esc(formatoDe(t.formato))}${sala ? ` · ${esc(sala.nome)}` : ''}`, 'Formato e sala')}
            ${chip(ICONE.pessoa, instrutor ? esc(instrutor.nome) : 'instrutor a definir', 'Instrutor')}
            ${chip(ICONE.calendario, `<span class="tabular-nums">${fmtData(t.inicio)} → ${fmtData(t.fim)}</span>`, 'Período')}
            ${chip(ICONE.pessoas, `<span class="tabular-nums">${m ? m.ocupadas : '—'} de ${t.vagas} vagas</span>`, 'Matrículas que ocupam vaga / vagas')}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button type="button" id="btn-editar" class="${BOTAO_SEC}" ${podeEditar ? '' : 'disabled'} title="${tituloEditar}">${ICONE.lapis} Editar dados</button>
        <button type="button" id="btn-mais" class="${BOTAO_SEC}" aria-haspopup="menu" aria-expanded="false">Mais ${ICONE.baixo}</button>
      </div>
    </div>

    ${faixaTurma(t, sit, pend)}

    <div role="tablist" aria-label="Seções da turma" class="mb-4 shadow-[inset_0_-1px_0] shadow-slate-200 dark:shadow-neutral-800 flex items-center gap-4 overflow-x-auto [scrollbar-width:thin]">
      ${ABAS.map(abaBotao).join('')}
    </div>

    ${aba.partes ? `<div class="mb-4 flex flex-wrap items-center gap-2">${partesAulas(t)}</div>` : ''}

    ${estado.aba === 'requisitos' ? renderRequisitos(t) : estado.aba === 'calendario' || estado.aba === 'aulas' ? renderAulas(t, estado.aba) : renderAcompanhamento(t, { curso, formacao, sala, instrutor, m, agenda, encerrada, podeEditar })}`;

  el.querySelectorAll('[data-aba]').forEach((btn) => btn.addEventListener('click', () => irParaAba(btn.dataset.aba)));
  el.querySelectorAll('[data-copiar]').forEach((btn) => btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(btn.dataset.copiar); toast('Link copiado.'); } catch (_) { toast('Não foi possível copiar — selecione o link manualmente.'); }
  }));
  if (estado.aba === 'requisitos') ligarRequisitos(el, t);
  el.querySelector('#btn-gerar-aulas')?.addEventListener('click', () => abrirModalGerarAulas(t.id));

  el.querySelector('#btn-editar').addEventListener('click', () => abrirDrawerTurma(t.id));
  el.querySelector('#btn-editar-dados')?.addEventListener('click', () => abrirDrawerTurma(t.id));
  el.querySelector('#btn-mais').addEventListener('click', (e) => abrirMenu(e.currentTarget, itensMais));
  el.querySelector('#btn-confirmar')?.addEventListener('click', () => alterarSituacao(t, 'confirmada'));
}

function alterarSituacao(t, status) {
  estado.lista = Turmas.alterarStatus(estado.lista, t.id, status);
  persistir(); renderTurma();
  toast(status === 'confirmada' ? `Turma ${t.codigo} confirmada.` : `Turma ${t.codigo} reaberta como planejada.`);
}

// Planejada pede uma decisão (confirmar); turma em curso com cadastro incompleto pede o que falta. O resto não tem faixa.
function faixaTurma(t, sit, pend) {
  const lista = pend.map(esc).join(' · ');
  if (sit === 'planejada') {
    return faixa(pend.length ? 'aviso' : 'petrol', `<div class="flex flex-wrap items-center justify-between gap-2"><span><span class="font-medium">Planejada — ainda não confirmada.</span> ${pend.length ? `Falta: ${lista}.` : 'Confirme quando instrutor, sala e datas estiverem fechados.'}</span><button type="button" id="btn-confirmar" class="${BOTAO_PRI} h-8 shrink-0">Confirmar</button></div>`);
  }
  return pend.length ? faixa('aviso', `<span class="font-medium">${plural(pend.length, 'pendência')}:</span> ${lista}`) : '';
}

// Contador ao lado da aba: total em cinza (Aulas, Requisitos). Zero não aparece.
function contadorAba(t, id) {
  if (id === 'aulas') { const n = Turmas.aulas(t).length; return n ? { valor: n, titulo: plural(n, 'aula prevista', 'aulas previstas') } : null; }
  if (id === 'requisitos') { const n = Turmas.requisitos(t, cursoDe(t.cursoId)).softwares.length; return n ? { valor: n, titulo: plural(n, 'software requerido', 'softwares requeridos') } : null; }
  return null;
}

// Partes da aba Aulas no controle segmentado, na mesma linha das ações da parte. A primeira não repete o contador da aba.
function partesAulas(t) {
  const parte = (p) => `
    <button type="button" data-aba="${p.id}" aria-pressed="${estado.aba === p.id}" class="h-7 px-2.5 rounded-md text-[12.5px] font-medium whitespace-nowrap transition ${estado.aba === p.id ? 'bg-[color:var(--f-elevado)] text-[color:var(--f-tinta)] shadow-[0_1px_2px_rgb(7_30_44/0.08)]' : 'text-[color:var(--f-tinta-2)] hover:text-[color:var(--f-tinta)]'}">${p.titulo}</button>`;
  // Materiais das aulas: visão da coordenação (materiais.html). Gerar só antes de gravar as aulas e com agenda.
  const podeGerar = !Turmas.temAgendamento(t) && Turmas.podeEditar(t) && Boolean(Turmas.agendaDe(t)?.periodos?.length);
  const acao = `<a href="materiais.html?turma=${encodeURIComponent(t.id)}" class="${BOTAO_LINK}">Materiais</a>${podeGerar ? `<button type="button" id="btn-gerar-aulas" class="${BOTAO_SEC}">${ICONE.calendario} Gerar aulas</button>` : ''}`;
  return `
    <div class="inline-flex rounded-lg bg-[color:var(--f-etiqueta)] p-0.5">${abaDe('aulas').partes.map(parte).join('')}</div>
    <div class="ml-auto flex items-center gap-2">${acao}</div>`;
}

// Aba Acompanhamento: dados da turma e alunos matriculados.
function renderAcompanhamento(t, { curso, formacao, sala, instrutor, m, agenda, encerrada, podeEditar }) {
  return `
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <section class="${CARTAO} pb-4">
        ${cabecalhoSecao('Dados da turma', 'Curso, agenda, instrutor, sala e vagas desta edição.', podeEditar ? `<button type="button" id="btn-editar-dados" class="${BOTAO_FANTASMA}">${ICONE.lapis} Editar</button>` : '')}
        <div class="px-4 pt-4 grid grid-cols-2 gap-x-4 gap-y-4">
          ${campo('Curso', curso ? `<a href="curso.html?id=${curso.id}" target="_blank" class="hover:underline [&>svg]:inline [&>svg]:ml-0.5 [&>svg]:align-[-2px]">${esc(curso.nome)} ${ICONE.externo}</a><p class="text-xs text-slate-500 dark:text-neutral-400"><span class="font-mono">${esc(curso.codigo)}</span> · ${Number(curso.cargaHoraria).toLocaleString('pt-BR')} h${curso.encontros ? ` · ${plural(curso.encontros, 'encontro')}` : ''}</p>` : vazio('curso removido'), 'col-span-2')}
          ${campo('Oferta', t.tipo === 'formacao' ? (formacao ? `<a href="formacao.html?id=${formacao.id}" target="_blank" class="hover:underline [&>svg]:inline [&>svg]:ml-0.5 [&>svg]:align-[-2px]">${esc(formacao.nome)} ${ICONE.externo}</a><p class="text-xs text-slate-500 dark:text-neutral-400 font-mono">${esc(formacao.codigo)}</p>` : 'Formação') : esc(TIPOS_TURMA[t.tipo]))}
          ${campo('Período', `<span class="tabular-nums">${fmtData(t.inicio)} → ${fmtData(t.fim)}</span>`)}
          ${campo('Agenda das aulas', `${esc(Agenda.descrever(agenda))}<p class="text-xs text-slate-500 dark:text-neutral-400">${t.formacaoId ? 'herdada da formação' : 'própria da turma'}${agenda ? ` · ${Agenda.horasPorSemana(agenda).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h/semana` : ''}</p>`)}
          ${campo('Formato', esc(formatoDe(t.formato)))}
          ${campo('Instrutor', instrutor ? `${esc(instrutor.nome)}<p class="text-xs text-slate-500 dark:text-neutral-400">${esc(instrutor.especialidade)}</p>` : vazio())}
          ${campo('Sala', sala ? `${esc(sala.nome)}<p class="text-xs text-slate-500 dark:text-neutral-400">${esc(TIPOS_SALA.find((x) => x.id === sala.tipo)?.nome ?? '')}${sala.capacidade?.alunos ? ` · ${sala.capacidade.alunos} lugares` : ''}</p>` : vazio(t.formato === 'online' ? 'turma online' : 'a definir'))}
          ${campo('Vagas', `<span class="tabular-nums">${t.vagas}</span>${m ? ` <span class="text-xs text-slate-500 dark:text-neutral-400">· ${m.ocupadas} ocupada${m.ocupadas === 1 ? '' : 's'}</span>` : ''}`)}
          ${campo('Centro de receita', t.centroReceitaId ? esc(CentrosReceita.nome(t.centroReceitaId) || 'centro removido') : vazio('nenhum'))}
          ${campo('Google Meet', t.meetLink ? `<a href="${esc(t.meetLink)}" target="_blank" rel="noopener" class="inline-flex items-center gap-1 font-mono text-xs text-petrol-800 dark:text-sky-300 hover:underline break-all">${esc(t.meetLink)} ${ICONE.externo}</a> <button type="button" data-copiar="${esc(t.meetLink)}" class="${BOTAO_LINK} ml-1" title="Copiar link">${ICONE.copiar} copiar</button><p class="text-xs text-slate-500 dark:text-neutral-400">Sala fixa da turma — instrutor e alunos online.${Turmas.ehMeet(t.meetLink) ? '' : ' Não é um endereço do Google Meet.'}</p>` : vazio(t.formato === 'presencial' ? 'não se aplica (presencial)' : 'a definir'), 'col-span-2')}
          ${campo('Observações', t.observacoes ? `<p class="whitespace-pre-line">${esc(t.observacoes)}</p>` : vazio('nenhuma'), 'col-span-2')}
        </div>
      </section>
      <section id="alunos-matriculados" class="${CARTAO} overflow-hidden">
        ${cabecalhoSecao(`Alunos matriculados${m ? ` <span class="ml-1 text-xs font-normal text-slate-500 dark:text-neutral-400 tabular-nums">${m.ocupadas}</span>` : ''}`, 'Entram pelas vendas: item do curso apontando para esta turma.', encerrada ? '' : `<a href="contratos.html?novo=1" class="${BOTAO_FANTASMA}">${ICONE.mais} Nova venda</a>`)}
        ${renderMatriculas(t, m)}
      </section>
    </div>`;
}

// ---------- Aba Requisitos (RN10) ----------
// O que precisa estar instalado nas máquinas desta turma (V1: só a lista de softwares, sem hardware).
// A turma nasce com a CÓPIA do curso e daí anda sozinha: a coordenação ajusta aqui e o
// instrutor no Portal do Professor.
const AUTOR_REQUISITOS = 'Coordenação';
const ICONE_BOTAO_TURMA = 'inline-flex items-center justify-center h-7 w-7 rounded-md text-slate-500 dark:text-neutral-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30';
const ICONE_BOTAO_TURMA_VERMELHO = `${ICONE_BOTAO_TURMA} hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40`;

const catalogoDe = (item) => (item.softwareId && typeof softwareDoCatalogo === 'function' ? softwareDoCatalogo(item.softwareId) : null);

function renderRequisitos(t) {
  const curso = cursoDe(t.cursoId);
  const r = Turmas.requisitos(t, curso);
  const cmp = Turmas.comparacaoRequisitos(t, curso);
  const itens = r.softwares.map((item) => ({ item, cat: catalogoDe(item), chave: Turmas.chaveSoftware(item) }));
  const listaVazia = (texto) => `<li class="px-4 py-8 text-center text-sm text-slate-500 dark:text-neutral-400">${texto}</li>`;

  // Herdado ou ajustado é contexto do cartão, não faixa: ninguém precisa agir só porque a lista difere do curso.
  const origem = r.herdado
    ? `Com os requisitos do curso${curso ? ` ${esc(curso.nome)}` : ''}, como estão no catálogo; ao mudar qualquer coisa, a lista passa a ser desta turma.`
    : `Lista desta turma${r.atualizadoEm ? `, ajustada em ${fmtData(r.atualizadoEm)}${r.atualizadoPor ? ` por ${esc(r.atualizadoPor)}` : ''}` : ''}. ${!cmp.extras.length && !cmp.faltando.length ? 'Hoje é igual à do curso.' : `Em relação ao curso: ${[cmp.extras.length ? `${plural(cmp.extras.length, 'software só nesta turma', 'softwares só nesta turma')}` : '', cmp.faltando.length ? `${plural(cmp.faltando.length, 'do curso que não está aqui', 'do curso que não estão aqui')}` : ''].filter(Boolean).join(' · ')}. <button type="button" id="btn-recarregar-req" class="font-medium text-petrol-800 dark:text-sky-300 hover:underline">Voltar ao do curso</button>`}`;

  const linha = ({ item, cat, chave }) => `
    <li class="flex items-center gap-3 px-4 py-2">
      <div class="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-2">
        <span class="text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(item.nome)}</span>
        ${cat?.versao ? `<span class="text-xs text-slate-500 dark:text-neutral-400">${esc(cat.versao)}</span>` : ''}
        <span class="text-xs text-slate-500 dark:text-neutral-400 truncate">${cat ? esc(cat.grupo) + (cat.requisitos ? ` · requer ${esc(cat.requisitos)}` : '') : ''}${item.observacao ? ` · <span class="text-slate-700 dark:text-neutral-300">${esc(item.observacao)}</span>` : ''}</span>
      </div>
      ${item.origem === 'turma' ? pilula(PILULA.extra, 'só nesta turma', item.por ? `Adicionado por ${item.por}` : 'Não está no catálogo do curso') : ''}
      ${cat ? '' : pilula(PILULA.neutra, 'fora do catálogo')}
      ${cat?.site || item.site ? `<a href="${esc(cat?.site || item.site)}" target="_blank" rel="noopener" class="${BOTAO_LINK}" title="${esc(cat?.site || item.site)}">Site</a>` : ''}
      <button type="button" data-obs-req="${esc(chave)}" title="Observação (versão, configuração, licença…)" aria-label="Observação de ${esc(item.nome)}" class="${ICONE_BOTAO_TURMA}">${ICONE.lapis}</button>
      <button type="button" data-remover-req="${esc(chave)}" title="Remover software desta turma" aria-label="Remover ${esc(item.nome)}" class="${ICONE_BOTAO_TURMA_VERMELHO}">${ICONE.lixeira}</button>
    </li>`;

  const doCurso = Turmas.requisitosDoCurso(curso);
  const painelCurso = `
    <section class="${CARTAO} pb-4">
      ${cabecalhoSecao(`No catálogo do curso <span class="ml-1 text-xs font-normal text-slate-500 dark:text-neutral-400 tabular-nums">${doCurso.softwares.length}</span>`, 'O que vale para toda turma nova deste curso.', curso ? `<a href="curso.html?id=${curso.id}&aba=requisitos&sub=infra" target="_blank" class="${BOTAO_FANTASMA}">Abrir curso ${ICONE.externo}</a>` : '')}
      <div class="px-4 pt-4 space-y-3 text-sm">
        ${doCurso.softwares.length ? `<div class="flex flex-wrap gap-1.5">${doCurso.softwares.map((x) => {
          const naTurma = r.softwares.some((y) => Turmas.chaveSoftware(y) === Turmas.chaveSoftware(x));
          return pilula(naTurma ? PILULA.neutra : PILULA.falta, x.nome, naTurma ? 'Também está nesta turma' : 'Está no curso, mas não nesta turma');
        }).join('')}</div>` : vazio('Nenhum software definido no curso.')}
        ${cmp.faltando.length ? `<button type="button" id="btn-trazer-curso" class="${BOTAO_LINK}">${ICONE.mais} Trazer ${plural(cmp.faltando.length, 'software do curso', 'softwares do curso')} para a turma</button>` : ''}
      </div>
    </section>`;

  return `
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <section class="${CARTAO} xl:col-span-2 overflow-hidden">
        ${cabecalhoSecao(`Softwares da turma <span class="ml-1 text-xs font-normal text-slate-500 dark:text-neutral-400 tabular-nums">${itens.length}</span>`, 'O que precisa estar instalado nas máquinas.', `<button type="button" id="btn-req-livre" class="${BOTAO_FANTASMA}">Fora do catálogo</button><button type="button" id="btn-req-catalogo" class="${BOTAO_FANTASMA}">${ICONE.mais} Adicionar</button>`)}
        <p class="px-4 mt-2 max-w-2xl text-xs text-slate-500 dark:text-neutral-400">${origem}</p>
        <ul class="mt-3 border-t border-slate-100 dark:border-neutral-900 divide-y divide-slate-100 dark:divide-neutral-900">
          ${itens.length ? itens.map(linha).join('') : listaVazia('Nenhum software requerido nesta turma.')}
        </ul>
      </section>
      <div class="space-y-4">
        ${painelCurso}
      </div>
    </div>`;
}

function ligarRequisitos(el, t) {
  const curso = cursoDe(t.cursoId);
  const opts = { curso, autor: AUTOR_REQUISITOS };
  el.querySelector('#btn-req-catalogo')?.addEventListener('click', () => abrirSeletorSoftwaresTurma(t.id));
  el.querySelector('#btn-req-livre')?.addEventListener('click', () => abrirModalSoftwareLivreTurma(t.id));
  el.querySelector('#btn-trazer-curso')?.addEventListener('click', () => {
    const faltando = Turmas.comparacaoRequisitos(t, curso).faltando;
    const doCatalogo = faltando.filter((s) => s.softwareId).map((s) => s.softwareId);
    let lista = Turmas.adicionarSoftwaresRequisitos(estado.lista, t.id, doCatalogo, opts);
    faltando.filter((s) => !s.softwareId).forEach((s) => { lista = Turmas.adicionarSoftwareLivreRequisito(lista, t.id, s, opts); });
    estado.lista = lista;
    persistir(); renderTurma();
    toast(`${plural(faltando.length, 'software do curso', 'softwares do curso')} ${faltando.length === 1 ? 'trazido' : 'trazidos'} para a turma.`);
  });
  el.querySelector('#btn-recarregar-req')?.addEventListener('click', () => {
    const cmp = Turmas.comparacaoRequisitos(t, curso);
    modalConfirmacao({
      titulo: 'Voltar aos requisitos do curso',
      corpo: `<p>A lista desta turma volta a ser a do catálogo de <strong>${esc(curso?.nome ?? 'curso')}</strong>.</p>
              ${cmp.extras.length ? `<p>Sai da turma: ${cmp.extras.map((s) => `<strong>${esc(s.nome)}</strong>`).join(', ')}.</p>` : ''}
              ${cmp.faltando.length ? `<p>Entra na turma: ${cmp.faltando.map((s) => `<strong>${esc(s.nome)}</strong>`).join(', ')}.</p>` : ''}
              <p class="text-slate-500 dark:text-neutral-400">As observações escritas nesta turma se perdem.</p>`,
      rotulo: 'Voltar ao do curso',
      aoConfirmar: () => {
        estado.lista = Turmas.recarregarRequisitosDoCurso(estado.lista, t.id, curso, AUTOR_REQUISITOS);
        persistir(); renderTurma();
        toast('Requisitos recarregados do curso.');
      },
    });
  });
  el.querySelectorAll('[data-obs-req]').forEach((b) => b.addEventListener('click', () => abrirModalObservacaoRequisito(t.id, b.dataset.obsReq)));
  el.querySelectorAll('[data-remover-req]').forEach((b) => b.addEventListener('click', () => {
    const item = Turmas.requisitos(t, curso).softwares.find((x) => Turmas.chaveSoftware(x) === b.dataset.removerReq);
    estado.lista = Turmas.removerSoftwareRequisito(estado.lista, t.id, b.dataset.removerReq, opts);
    persistir(); renderTurma();
    toast(`"${item?.nome ?? 'Software'}" removido dos requisitos desta turma.`);
  }));
}

// Seletor de vários itens (mesmo componente da tela de cursos).
function abrirSeletorMultiploTurma({ titulo, subtitulo, singular, plural: pluralTxt, itens, aoConfirmar }) {
  const root = abrirModal(`
    <form id="form-seletor" class="flex flex-col max-h-[80vh]">
      <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
        <h3 class="font-display font-semibold text-slate-800 dark:text-neutral-100">${titulo}</h3>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${subtitulo}</p>
      </div>
      <div class="px-5 pt-4">
        <div class="relative">${`<span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">${ICONE.lupa}</span>`}<input id="sel-busca" type="search" placeholder="Filtrar…" class="${CAMPO_BUSCA} w-full"></div>
      </div>
      <div class="flex-1 overflow-y-auto px-5 py-3">
        ${itens.length ? `<ul class="divide-y divide-slate-100 dark:divide-neutral-900">${itens.map((i) => `
          <li data-item data-nome="${esc(Turmas.normalizar(`${i.titulo} ${i.subtitulo ?? ''}`))}">
            <label class="flex items-center gap-3 py-2 cursor-pointer">
              <input type="checkbox" name="ids" value="${esc(i.id)}" class="check">
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(i.titulo)}</span>
                ${i.subtitulo ? `<span class="block text-xs text-slate-500 dark:text-neutral-400">${esc(i.subtitulo)}</span>` : ''}
              </span>
              ${i.lado ? `<span class="text-xs text-slate-500 dark:text-neutral-400 shrink-0">${esc(i.lado)}</span>` : ''}
            </label>
          </li>`).join('')}</ul>` : `<p class="py-8 text-center text-sm text-slate-500 dark:text-neutral-400">Nenhum ${singular} disponível.</p>`}
      </div>
      <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-2">
        <span id="sel-contador" class="text-xs text-slate-500 dark:text-neutral-400">Nenhum ${singular} marcado</span>
        <span class="flex items-center gap-2">
          <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
          <button type="submit" class="${BOTAO_PRI}">Adicionar</button>
        </span>
      </div>
    </form>`, 'max-w-lg');
  const form = root.querySelector('#form-seletor');
  const contador = form.querySelector('#sel-contador');
  const atualizar = () => {
    const n = form.querySelectorAll('[name="ids"]:checked').length;
    contador.textContent = n ? `${n} ${n === 1 ? singular : pluralTxt} ${n === 1 ? 'marcado' : 'marcados'}` : `Nenhum ${singular} marcado`;
  };
  form.querySelectorAll('[name="ids"]').forEach((cb) => cb.addEventListener('change', atualizar));
  const busca = form.querySelector('#sel-busca');
  busca.focus();
  busca.addEventListener('input', () => {
    const termo = Turmas.normalizar(busca.value.trim());
    form.querySelectorAll('[data-item]').forEach((li) => li.classList.toggle('hidden', Boolean(termo) && !li.dataset.nome.includes(termo)));
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ids = [...form.querySelectorAll('[name="ids"]:checked')].map((cb) => cb.value);
    if (!ids.length) { toast(`Marque pelo menos um ${singular}.`); return; }
    fecharModal();
    aoConfirmar(ids);
  });
}

function abrirSeletorSoftwaresTurma(turmaId) {
  const t = Turmas.porId(estado.lista, turmaId);
  const curso = cursoDe(t.cursoId);
  const r = Turmas.requisitos(t, curso);
  const ja = new Set(r.softwares.map((s) => s.softwareId).filter(Boolean));
  const noCurso = new Set(Turmas.requisitosDoCurso(curso).softwares.map((s) => s.softwareId).filter(Boolean));
  const itens = SOFTWARES_CATALOGO
    .filter((s) => !ja.has(s.id))
    .sort((a, b) => a.grupo.localeCompare(b.grupo, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((s) => ({
      id: s.id,
      titulo: s.versao ? `${s.nome} · ${s.versao}` : s.nome,
      subtitulo: `${s.grupo}${s.requisitos ? ` · requer ${s.requisitos}` : ''}`,
      lado: noCurso.has(s.id) ? 'no curso' : '',
    }));
  abrirSeletorMultiploTurma({
    titulo: 'Adicionar softwares do catálogo',
    subtitulo: `Para as aulas da turma <strong>${esc(t.codigo)}</strong>. Vale só nesta turma — o catálogo do curso não muda.`,
    singular: 'software', plural: 'softwares', itens,
    aoConfirmar: (ids) => {
      estado.lista = Turmas.adicionarSoftwaresRequisitos(estado.lista, turmaId, ids, { curso, autor: AUTOR_REQUISITOS });
      persistir(); renderTurma();
      toast(`${plural(ids.length, 'software')} adicionado${ids.length === 1 ? '' : 's'} à turma.`);
    },
  });
}

function abrirModalSoftwareLivreTurma(turmaId) {
  const t = Turmas.porId(estado.lista, turmaId);
  const curso = cursoDe(t.cursoId);
  const root = abrirModal(`
    <form id="form-req-livre" class="flex flex-col">
      <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
        <h3 class="font-display font-semibold text-slate-800 dark:text-neutral-100">Software fora do catálogo</h3>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Na turma <strong>${esc(t.codigo)}</strong> · o suporte não terá roteiro de instalação; descreva onde baixar e como instalar.</p>
      </div>
      <div class="p-5 space-y-4">
        <div>
          <label for="rq-nome" class="rotulo">Nome</label>
          <input id="rq-nome" name="nome" type="text" maxlength="80" placeholder="Ex.: Godot 4.3" class="campo">
          <p data-erro="nome" class="text-xs text-red-600 dark:text-red-400 mt-1 hidden"></p>
        </div>
        <div>
          <label for="rq-site" class="rotulo">Site para baixar <span class="font-normal text-slate-500 dark:text-neutral-400">(opcional)</span></label>
          <input id="rq-site" name="site" type="url" placeholder="https://godotengine.org/download" class="campo">
          <p data-erro="site" class="text-xs text-red-600 dark:text-red-400 mt-1 hidden"></p>
        </div>
        <div>
          <label for="rq-observacao" class="rotulo">Observação <span class="font-normal text-slate-500 dark:text-neutral-400">(opcional)</span></label>
          <textarea id="rq-observacao" name="observacao" rows="3" maxlength="300" placeholder="Ex.: portable, descompactar em C:\\godot" class="campo"></textarea>
        </div>
      </div>
      <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
        <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
        <button type="submit" class="${BOTAO_PRI}">Adicionar</button>
      </div>
    </form>`, 'max-w-md');
  const form = root.querySelector('#form-req-livre');
  form.querySelector('#rq-nome').focus();
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const dados = { nome: form.nome.value, observacao: form.observacao.value, site: form.site.value };
    const erros = Turmas.validarSoftwareLivreRequisito(dados, Turmas.requisitos(t, curso).softwares);
    if (mostrarErros(form, erros)) return;
    estado.lista = Turmas.adicionarSoftwareLivreRequisito(estado.lista, turmaId, dados, { curso, autor: AUTOR_REQUISITOS });
    fecharModal();
    persistir(); renderTurma();
    toast(`"${dados.nome.trim()}" adicionado aos requisitos da turma.`);
  });
}

function abrirModalObservacaoRequisito(turmaId, chave) {
  const t = Turmas.porId(estado.lista, turmaId);
  const curso = cursoDe(t.cursoId);
  const item = Turmas.requisitos(t, curso).softwares.find((s) => Turmas.chaveSoftware(s) === chave);
  if (!item) return;
  const cat = catalogoDe(item);
  const root = abrirModal(`
    <form id="form-req-obs" class="flex flex-col">
      <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
        <h3 class="font-display font-semibold text-slate-800 dark:text-neutral-100">${esc(item.nome)}</h3>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${cat ? `Catálogo: ${esc(cat.grupo)}${cat.versao ? ` · versão ${esc(cat.versao)}` : ''}${cat.observacao ? `<br><span class="text-slate-400">Suporte: ${esc(cat.observacao)}</span>` : ''}` : 'Fora do catálogo.'}</p>
      </div>
      <div class="p-5 space-y-4">
        ${cat ? '' : `<div>
          <label for="rq-obs-site" class="rotulo">Site para baixar <span class="font-normal text-slate-500 dark:text-neutral-400">(opcional)</span></label>
          <input id="rq-obs-site" name="site" type="url" placeholder="https://godotengine.org/download" value="${esc(item.site ?? '')}" class="campo">
          <p data-erro="site" class="text-xs text-red-600 dark:text-red-400 mt-1 hidden"></p>
        </div>`}
        <div>
          <label for="rq-obs" class="rotulo">Observação para esta turma</label>
          <textarea id="rq-obs" name="observacao" rows="3" maxlength="300" placeholder="Ex.: versão específica, extensão, configuração ou licença que a aula precisa" class="campo">${esc(item.observacao)}</textarea>
        </div>
      </div>
      <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
        <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
        <button type="submit" class="${BOTAO_PRI}">Salvar</button>
      </div>
    </form>`, 'max-w-md');
  const form = root.querySelector('#form-req-obs');
  form.querySelector('#rq-obs').focus();
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const site = form.site?.value;
    if (site !== undefined && mostrarErros(form, Cursos.validarSite(site))) return;
    estado.lista = Turmas.atualizarObservacaoRequisito(estado.lista, turmaId, chave, form.observacao.value, { curso, autor: AUTOR_REQUISITOS, ...(site === undefined ? {} : { site }) });
    fecharModal();
    persistir(); renderTurma();
    toast('Observação salva.');
  });
}

function renderAulas(t, visao) {
  const aulas = Turmas.aulas(t);
  const agendado = Turmas.temAgendamento(t);
  const canceladas = agendado ? t.aulas.filter((a) => a.status === 'cancelada').length : 0;
  const hoje = Turmas.hoje();
  const realizadas = aulas.filter((a) => a.data < hoje).length;
  const corpo = !aulas.length && !agendado
    ? '<p class="px-4 py-8 text-center text-sm text-slate-500 dark:text-neutral-400">Nenhuma aula cai nos dias da agenda entre o início e o fim desta turma.</p>'
    : visao === 'calendario'
      ? renderCalendarioAulas(t, agendado ? Turmas.aulasAgendadas(t) : aulas, hoje)
      : tabelaAulas(t, agendado ? Turmas.aulasAgendadas(t) : aulas, hoje, agendado);
  return `
    <section class="${CARTAO} overflow-hidden">
      ${cabecalhoSecao(`${visao === 'calendario' ? 'Calendário das aulas' : `Aulas ${agendado ? 'agendadas' : 'previstas'}`} <span class="ml-1 text-xs font-normal text-slate-500 dark:text-neutral-400 tabular-nums">${aulas.length}</span>`, `${esc(Agenda.descrever(Turmas.agendaDe(t)))} · ${Turmas.horasAulas(aulas).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h${aulas.length ? ` · ${realizadas} realizada${realizadas === 1 ? '' : 's'}` : ''}${canceladas ? ` · ${canceladas} cancelada${canceladas === 1 ? '' : 's'}` : ''}. ${agendado ? 'Aulas gravadas pela agenda; os feriados ficaram de fora.' : 'Prévia pela agenda, ainda não gravada; Gerar aulas grava as datas (sem os feriados) e pode criar o link do Google Meet de cada aula.'}`)}
      <div class="${visao === 'calendario' ? '' : 'mt-3'}">${corpo}</div>
    </section>`;
}

// Tabela da aba Aulas (padrão do Portal do Professor): nº, data, horário, local, conteúdo, situação
// e o link do Google Meet da aula (aula.meetUrl, criado ao gerar as aulas), com botão de copiar.
function tabelaAulas(t, lista, hoje, agendado) {
  if (!lista.length) return '<p class="px-4 py-8 text-center text-sm text-slate-500 dark:text-neutral-400">Todas as aulas desta turma foram canceladas.</p>';
  const curso = cursoDe(t.cursoId);
  const { sala } = contexto(t);
  const moduloTitulo = (id) => curso?.modulos.find((m) => m.id === id)?.titulo ?? id;
  const diaNome = (id) => Agenda.DIAS.find((d) => d.id === id)?.curto?.toLowerCase() ?? id;
  const dataAno = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR');
  const ponto = (cor, txt, cls = 'text-slate-600 dark:text-neutral-300') => `<span class="inline-flex items-center gap-1.5 whitespace-nowrap ${cls}"><span class="h-2 w-2 rounded-full ${cor}"></span>${txt}</span>`;
  const traco = '<span class="text-slate-400 dark:text-neutral-600">—</span>';
  const th = (txt, cls = '') => `<th class="${TH} ${cls}">${txt}</th>`;
  const linha = (a) => {
    const cancelada = a.status === 'cancelada';
    const passada = !cancelada && a.data < hoje;
    const ehHoje = !cancelada && a.data === hoje;
    const salaA = a.salaId ? salaDe(a.salaId) : sala;
    const local = t.formato === 'online'
      ? (t.meetLink ? `<a href="${esc(t.meetLink)}" target="_blank" rel="noopener" class="text-petrol-800 dark:text-sky-300 hover:underline">Google Meet</a>` : 'Online')
      : `${salaA ? esc(salaA.nome) : vazio()}${t.formato === 'hibrido' ? ' <span class="text-xs text-slate-500 dark:text-neutral-400">· Meet</span>' : ''}`;
    const conteudo = [...(a.moduloIds ?? []).map(moduloTitulo), a.conteudo].filter(Boolean).join(' · ');
    // Hoje em petróleo (o "você está aqui"); verde fica para a chamada feita.
    const situacao = cancelada ? ponto('bg-red-500', 'Cancelada', 'text-red-700 dark:text-red-400')
      : ehHoje ? ponto('bg-petrol-800 dark:bg-sky-300', 'Hoje', 'font-medium text-petrol-800 dark:text-sky-300')
      : passada ? ponto('bg-slate-400', 'Realizada')
      : ponto('bg-slate-200 dark:bg-neutral-700', 'Prevista', 'text-slate-500 dark:text-neutral-400');
    const origem = a.origem && a.origem !== 'agenda' ? `<span class="ml-1.5 text-xs text-slate-500 dark:text-neutral-400">${a.origem === 'reposicao' ? 'reposição' : 'extra'}</span>` : '';
    const motivo = cancelada && a.motivo ? `<p class="text-xs text-red-700 dark:text-red-400">${esc(Aulas.motivoDe(a.motivo.tipo))}${a.motivo.texto ? ` — ${esc(a.motivo.texto)}` : ''}</p>` : '';

    const meet = a.meetUrl && !cancelada
      ? `<a href="${esc(a.meetUrl)}" target="_blank" rel="noopener" class="font-mono text-xs text-petrol-800 dark:text-sky-300 hover:underline">${esc(a.meetUrl.replace('https://', ''))}</a> <button type="button" data-copiar="${esc(a.meetUrl)}" class="${BOTAO_LINK} ml-1" title="Copiar link">${ICONE.copiar} copiar</button>`
      : traco;

    return `
      <tr class="${cancelada ? 'linha-apagada' : ''} ${ehHoje ? 'bg-petrol-800/5 dark:bg-sky-950/40' : ''}">
        <td class="${TD} tabular-nums text-xs text-slate-500 dark:text-neutral-400 text-right">${a.n ?? '—'}</td>
        <td class="${TD} whitespace-nowrap"><span class="tabular-nums ${cancelada ? 'line-through' : ''} ${ehHoje ? 'font-semibold text-petrol-800 dark:text-sky-300' : 'text-slate-800 dark:text-neutral-100'}">${dataAno(a.data)}</span> <span class="text-xs text-slate-500 dark:text-neutral-400">${diaNome(a.dia)}</span></td>
        <td class="${TD} tabular-nums whitespace-nowrap">${a.inicio}–${a.fim}<span class="text-xs text-slate-500 dark:text-neutral-400 ml-1.5">${Turmas.horasAula(a).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h</span></td>
        <td class="${TD} whitespace-nowrap">${local}</td>
        <td class="${TD} max-w-md">${conteudo ? `<span class="text-slate-700 dark:text-neutral-200">${esc(conteudo)}</span>` : traco}${motivo}</td>
        <td class="${TD} whitespace-nowrap">${situacao}${origem}</td>
        <td class="${TD} whitespace-nowrap">${meet}</td>
      </tr>`;
  };
  return `
    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead class="${THEAD} border-t">
          <tr>${th('Nº', 'text-right')}${th('Data')}${th('Horário')}${th('Local')}${th('Conteúdo')}${th('Situação')}${th('Google Meet')}</tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">${lista.map(linha).join('')}</tbody>
      </table>
    </div>
    ${agendado ? '' : '<p class="px-4 py-2.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-xs text-slate-500 dark:text-neutral-400">Datas previstas pela agenda, ainda não gravadas; use Gerar aulas para gravá-las.</p>'}`;
}

// Calendário mensal (só leitura) das aulas da turma: um cartão por mês do período,
// aulas por dia com cor por situação; canceladas aparecem quando há agendamento gravado.
function renderCalendarioAulas(t, aulas, hoje) {
  const hora = (h) => h.replace(':', 'h').replace(/h00$/, 'h');
  const fmtH = (h) => `${h.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h`;
  const mesNome = (ym) => { const n = new Date(`${ym}-01T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); return n.charAt(0).toUpperCase() + n.slice(1); };
  const datas = aulas.map((a) => a.data);
  const ini = [t.inicio, ...datas].filter(Boolean).sort()[0];
  const fim = [t.fim, ...datas].filter(Boolean).sort().at(-1);
  if (!ini || !fim) return '<p class="px-4 py-8 text-center text-sm text-slate-500 dark:text-neutral-400">Defina início e fim da turma para ver o calendário.</p>';
  const meses = [];
  for (let m = ini.slice(0, 7); m <= fim.slice(0, 7); ) {
    meses.push(m);
    const [y, mo] = m.split('-').map(Number);
    m = `${mo === 12 ? y + 1 : y}-${String(mo === 12 ? 1 : mo + 1).padStart(2, '0')}`;
  }
  const porDia = new Map();
  aulas.forEach((a) => { if (!porDia.has(a.data)) porDia.set(a.data, []); porDia.get(a.data).push(a); });
  const COR = {
    prevista: 'bg-petrol-800/10 text-petrol-900 border-petrol-800/30 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-800',
    hoje: 'bg-petrol-800 text-white border-petrol-800 dark:bg-areia dark:text-petrol-800 dark:border-areia',
    realizada: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-700',
    cancelada: 'bg-red-50 text-red-700 border-red-200 line-through dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
    reposicao: 'bg-violet-50 text-violet-900 border-violet-300 dark:bg-violet-950/60 dark:text-violet-200 dark:border-violet-800',
    extra: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800',
  };
  const classeDe = (a) => (a.status === 'cancelada' ? COR.cancelada : a.data === hoje ? COR.hoje : a.data < hoje ? COR.realizada : a.origem && a.origem !== 'agenda' ? COR[a.origem] : COR.prevista);
  const curso = cursoDe(t.cursoId);
  const moduloTitulo = (id) => curso?.modulos.find((m) => m.id === id)?.titulo ?? id;
  const bloco = (a) => {
    const conteudo = [...(a.moduloIds ?? []).map(moduloTitulo), a.conteudo].filter(Boolean).join(' · ');
    const titulo = [
      `Aula ${a.n ?? '(cancelada)'} · ${hora(a.inicio)}–${hora(a.fim)} · ${fmtH(Turmas.horasAula(a))}`,
      a.status === 'cancelada' && a.motivo ? `Cancelada: ${Aulas.motivoDe(a.motivo.tipo)}${a.motivo.texto ? ` — ${a.motivo.texto}` : ''}` : '',
      a.origem === 'reposicao' ? 'Reposição' : a.origem === 'extra' ? 'Aula extra' : '',
      conteudo,
    ].filter(Boolean).join('\n');
    return `<span title="${esc(titulo)}" class="block w-full text-left rounded border px-1.5 py-0.5 text-[11px] leading-tight tabular-nums ${classeDe(a)}">${a.n ? `<span class="font-semibold">${a.n}</span> · ` : ''}${hora(a.inicio)}–${hora(a.fim)}</span>`;
  };
  const mes = (ym) => {
    const [y, mo] = ym.split('-').map(Number);
    const nDias = new Date(y, mo, 0).getDate();
    const offset = (new Date(y, mo - 1, 1).getDay() + 6) % 7; // segunda = 0
    const celulas = [];
    for (let i = 0; i < offset; i += 1) celulas.push('<div class="min-h-14 bg-slate-50/60 dark:bg-neutral-925"></div>');
    for (let d = 1; d <= nDias; d += 1) {
      const iso = `${ym}-${String(d).padStart(2, '0')}`;
      const lista = porDia.get(iso) ?? [];
      const fer = Aulas.feriado(iso);
      const dentro = iso >= t.inicio && iso <= t.fim;
      const ehHoje = iso === hoje;
      celulas.push(`
        <div class="min-h-14 p-1 flex flex-col gap-0.5 ${dentro ? 'bg-white dark:bg-neutral-950' : 'bg-slate-50/60 dark:bg-neutral-925'} ${ehHoje ? 'ring-2 ring-inset ring-petrol-800 dark:ring-sky-300' : ''}">
          <div class="flex items-center justify-between gap-1">
            <span class="text-[11px] tabular-nums ${ehHoje ? 'font-bold text-petrol-800 dark:text-sky-300' : dentro ? 'text-slate-700 dark:text-neutral-200' : 'text-slate-500 dark:text-neutral-500'}">${d}</span>
            ${fer ? `<span class="truncate text-[11px] text-slate-500 dark:text-neutral-400" title="Feriado: ${esc(fer)}">feriado</span>` : ''}
          </div>
          ${lista.map(bloco).join('')}
        </div>`);
    }
    const ativas = aulas.filter((a) => a.data.slice(0, 7) === ym && a.status !== 'cancelada');
    return `
      <section class="rounded-lg border border-slate-200 dark:border-neutral-800 overflow-hidden">
        <div class="px-3 py-2 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
          <h4 class="text-sm font-semibold text-slate-800 dark:text-neutral-100">${mesNome(ym)}</h4>
          <span class="text-xs text-slate-500 dark:text-neutral-400 tabular-nums">${plural(ativas.length, 'aula')} · ${fmtH(Turmas.horasAulas(ativas))}</span>
        </div>
        <div class="grid grid-cols-7 text-[11px] font-medium text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800">${Agenda.DIAS.map((d) => `<div class="px-1.5 py-1">${d.curto}</div>`).join('')}</div>
        <div class="grid grid-cols-7 gap-px bg-slate-200 dark:bg-neutral-800">${celulas.join('')}</div>
      </section>`;
  };
  const temCanceladas = aulas.some((a) => a.status === 'cancelada');
  const legenda = [['Prevista', COR.prevista], ['Hoje', COR.hoje], ['Realizada', COR.realizada], ['Reposição', COR.reposicao], ['Extra', COR.extra], ...(temCanceladas ? [['Cancelada', COR.cancelada]] : [])]
    .map(([n, c]) => `<span class="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400"><span class="h-3 w-5 rounded border ${c.replace('line-through', '')}"></span>${n}</span>`).join('');
  return `
    <div class="p-4">
      <div class="mb-3 flex flex-wrap items-center gap-3">${legenda}<span class="ml-auto text-xs text-slate-500 dark:text-neutral-400">Dias fora do período em cinza.</span></div>
      <div class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">${meses.map(mes).join('')}</div>
    </div>`;
}

function renderMatriculas(t, m) {
  if (!m || !m.linhas.length) {
    return `<p class="px-4 py-8 text-center text-sm text-slate-500 dark:text-neutral-400">Nenhum aluno matriculado nesta turma ainda.</p>`;
  }
  const linhas = [...m.linhas].sort((a, b) => (alunoDe(a.alunoId)?.nome ?? '').localeCompare(alunoDe(b.alunoId)?.nome ?? '', 'pt-BR'));
  // Matriculado é o comum e não ganha pílula; concluído é estado bom dentro de tabela (verde); desistiu e cancelada, neutras.
  // Na turma concluída, concluir é o comum e também não se anuncia.
  const turmaConcluida = Turmas.situacao(t) === 'concluida';
  const situacao = (st) => (st === 'matriculado' || (st === 'concluido' && turmaConcluida) ? '' : ` ${pilula(st === 'concluido' ? PILULA.concluido : PILULA.neutra, NOME_MATRICULA[st] ?? st)}`);
  return `
    <div class="mt-3 overflow-x-auto">
      <table class="w-full text-left">
        <thead class="${THEAD} border-t">
          <tr><th class="${TH}">Aluno</th><th class="${TH} text-right">Venda</th></tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
          ${linhas.map((l) => {
            const a = alunoDe(l.alunoId);
            const st = l.matricula.status;
            return `
            <tr class="${st === 'cancelada' || st === 'desistiu' ? 'linha-apagada' : ''}">
              <td class="${TD}"><a href="aluno.html?id=${l.alunoId}" target="_blank" class="font-medium text-slate-800 dark:text-neutral-100 hover:underline">${esc(a?.nomeSocial || a?.nome || 'Aluno removido')}</a>${situacao(st)}${l.matricula.codigo ? `<p class="font-mono text-xs text-slate-500 dark:text-neutral-400">${esc(l.matricula.codigo)}</p>` : ''}</td>
              <td class="${TD} text-right whitespace-nowrap"><a href="contrato.html?id=${l.contrato.id}" target="_blank" class="inline-flex items-center gap-1 font-mono text-xs text-petrol-800 dark:text-sky-300 hover:underline">${esc(l.contrato.codigo)} ${ICONE.externo}</a></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      <div class="px-4 py-2.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-sm text-slate-700 dark:text-neutral-200 tabular-nums">${m.ativos} ativo${m.ativos === 1 ? '' : 's'} · ${m.concluidos} concluído${m.concluidos === 1 ? '' : 's'}${m.desistiu ? ` · ${m.desistiu} desistiu` : ''}${m.canceladas ? ` · ${m.canceladas} cancelada${m.canceladas === 1 ? '' : 's'}` : ''}</div>
    </div>`;
}

// ---------- Gerar aulas (V1: sem a tela de agendamento) ----------
// Grava a prévia da agenda como aulas da turma, sem os dias cadastrados em Feriados, com o conteúdo
// distribuído pelos módulos do curso. Opcional: o link do Google Meet de cada aula (aula.meetUrl).

function abrirModalGerarAulas(turmaId) {
  const t = Turmas.porId(estado.lista, turmaId);
  const curso = cursoDe(t.cursoId);
  const todas = Aulas.gerar(t, Turmas.agendaDe(t));
  const feriados = todas.filter((a) => Aulas.feriado(a.data));
  const aulas = todas.filter((a) => !Aulas.feriado(a.data));
  const root = abrirModal(`
    <form id="form-gerar-aulas">
      <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
        <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Gerar aulas</h3>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5"><span class="font-mono">${esc(t.codigo)}</span> · ${esc(Agenda.descrever(Turmas.agendaDe(t)))} · ${fmtData(t.inicio)} → ${fmtData(t.fim)}</p>
      </div>
      <div class="px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 space-y-3">
        <p>Grava <strong>${plural(aulas.length, 'aula')}</strong> (${Turmas.horasAulas(aulas).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h${curso ? ` de ${Number(curso.cargaHoraria).toLocaleString('pt-BR')} h do curso` : ''}) pelos dias e horários da agenda.</p>
        ${feriados.length ? `<p class="text-slate-500 dark:text-neutral-400">${plural(feriados.length, 'data cai', 'datas caem')} em feriado e ${feriados.length === 1 ? 'fica' : 'ficam'} de fora: ${feriados.map((a) => `${fmtData(a.data)} (${esc(Aulas.feriado(a.data))})`).join(', ')}.</p>` : ''}
        <label class="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" name="meet" class="check mt-0.5" ${t.formato === 'presencial' ? '' : 'checked'}>
          <span>Criar o link do Google Meet de cada aula<span class="block text-xs text-slate-500 dark:text-neutral-400">Uma sala do Meet por aula, para o instrutor e os alunos online.</span></span>
        </label>
      </div>
      <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
        <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
        <button type="submit" class="${BOTAO_PRI}" ${aulas.length ? '' : 'disabled'}>Gerar ${plural(aulas.length, 'aula')}</button>
      </div>
    </form>`);
  const form = root.querySelector('#form-gerar-aulas');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const comMeet = form.meet.checked;
    const gravadas = Aulas.distribuirConteudo(aulas, curso).map((a) => (comMeet ? { ...a, meetUrl: Aulas.meetUrl(t.id, a) } : a));
    estado.lista = Turmas.salvarAulas(estado.lista, t.id, gravadas);
    fecharModal();
    persistir(); renderTurma();
    toast(`${plural(gravadas.length, 'aula gerada', 'aulas geradas')}${comMeet ? ' com link do Google Meet' : ''}.`);
  });
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

function drawerFormulario({ id, titulo, subtitulo, corpo, rotulo, largura = 'max-w-lg', aoSalvar, foco }) {
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

// ---------- Drawer da turma (criar / editar) ----------

function abrirDrawerTurma(id = null) {
  const t = id ? Turmas.porId(estado.lista, id) : null;
  const d = t ?? { cursoId: '', formacaoId: null, tipo: 'aberta', codigo: '', agenda: Agenda.vazia(), inicio: '', fim: '', instrutorId: null, salaId: null, vagas: '', observacoes: '', status: null };
  const ctx = { lista: estado.lista, cursos: estado.cursos, formacoes: estado.formacoes, salas: estado.salas };
  // Na edição, curso e formação não mudam (matrículas e vendas dependem deles).
  const opts = { cursoFixo: Boolean(t), formacaoFixa: Boolean(t), editando: Boolean(t) };
  const { form } = drawerFormulario({
    id: 'form-turma',
    titulo: t ? `Editar turma ${esc(t.codigo)}` : 'Nova turma',
    subtitulo: t ? 'Curso e formação não mudam depois de criada.' : 'Escolha o curso; se ele estiver numa formação ativa, dá para vincular a turma a ela (a agenda vem da formação). Turma avulsa define dias, horários, recorrência e formato. Nasce como <strong>planejada</strong>.',
    rotulo: t ? 'Salvar alterações' : 'Criar turma',
    largura: 'max-w-xl',
    foco: t ? '#tf-codigo' : '#tf-busca-curso',
    corpo: TurmaForm.corpo(ctx, d, opts),
    aoSalvar: (fd, form) => {
      const dados = TurmaForm.ler(fd, form);
      const erros = Turmas.validar(dados, estado.lista, estado.cursos, id);
      if (erros.length) return erros;
      if (t) {
        estado.lista = Turmas.atualizar(estado.lista, id, dados);
        persistir(); renderTurma();
        toast(`Turma ${dados.codigo.trim().toUpperCase()} atualizada.`);
      } else {
        const r = Turmas.incluir(estado.lista, dados);
        estado.lista = r.lista;
        persistir();
        toast(`Turma ${r.turma.codigo} criada como planejada.`);
        selecionar(r.turma.id);
      }
    },
  });
  TurmaForm.ligar(form, ctx, d, { ...opts, idAtual: id });
}

// ---------- Modais ----------

function modalConfirmacao({ titulo, corpo, rotulo, aoConfirmar }) {
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
      <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h3>
    </div>
    <div class="px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 space-y-2">${corpo}</div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Voltar</button>
      <button type="button" id="btn-confirmar-modal" class="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40">${rotulo}</button>
    </div>`);
  root.querySelector('#btn-confirmar-modal').addEventListener('click', () => { aoConfirmar(); fecharModal(); });
}

function confirmarCancelamento(id) {
  const t = Turmas.porId(estado.lista, id);
  const m = Turmas.matriculas(t);
  modalConfirmacao({
    titulo: 'Cancelar turma',
    corpo: `
      <p>Cancelar a turma <strong>${esc(t.codigo)}</strong> (${esc(cursoDe(t.cursoId)?.nome ?? '')}, ${fmtData(t.inicio)} → ${fmtData(t.fim)})?</p>
      ${m?.ocupadas ? `<p class="text-amber-700 dark:text-amber-400">${plural(m.ocupadas, 'aluno')} com matrícula ativa nesta turma — as matrículas precisam ser realocadas ou canceladas nas vendas.</p>` : ''}
      <p class="text-slate-500 dark:text-neutral-400">A turma some das opções de venda, mas fica no histórico e pode ser reaberta.</p>`,
    rotulo: 'Cancelar turma',
    aoConfirmar: () => {
      estado.lista = Turmas.alterarStatus(estado.lista, id, 'cancelada');
      persistir(); renderTurma();
      toast(`Turma ${t.codigo} cancelada.`);
    },
  });
}

function confirmarExclusao(id) {
  const t = Turmas.porId(estado.lista, id);
  modalConfirmacao({
    titulo: 'Excluir turma',
    corpo: `
      <p>Excluir a turma <strong>${esc(t.codigo)}</strong> (${esc(cursoDe(t.cursoId)?.nome ?? '')}, ${fmtData(t.inicio)} → ${fmtData(t.fim)})?</p>
      <p class="text-slate-500 dark:text-neutral-400">Não tem matrículas, por isso pode ser excluída. Se quiser manter o histórico, prefira <em>cancelar</em>.</p>`,
    rotulo: 'Excluir',
    aoConfirmar: () => {
      estado.lista = Turmas.remover(estado.lista, id);
      persistir();
      toast(`Turma ${t.codigo} excluída.`);
      selecionar(null);
    },
  });
}

// ---------- Boot ----------

(function iniciar() {
  if (MODO === 'detalhe') {
    const id = parametroUrl('id');
    if (!id || !Turmas.porId(estado.lista, id)) { location.replace(URL_LISTA); return; }
    estado.selecionado = id;
    if (IDS_ABA.includes(parametroUrl('aba'))) estado.aba = parametroUrl('aba');
    renderTurma();
    return;
  }
  // URL antiga turmas.html?turma=<id> → página de detalhe.
  const antigo = parametroUrl('turma');
  if (antigo) { location.replace(urlDetalhe(antigo)); return; }
  renderLista();
  if (parametroUrl('nova') === '1') abrirDrawerTurma();
})();
