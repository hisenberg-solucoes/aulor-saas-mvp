// ============================================================
// UI da tela "Colaboradores". Regras no motor (Colaboradores.*); aqui só
// se monta HTML, reage a cliques e persiste.
// Fluxo: lista (colaboradores.html, busca + filtros) → colaborador aberto em
// página própria (colaborador.html?id=) com cartões por seção, cada um com
// seu drawer. O mesmo arquivo atende as duas páginas; o modo vem de
// <body data-modo>. O cartão "Acesso ao sistema" lê/grava o protótipo de
// permissões (Colaboradores.Acesso).
// O sistema não faz folha de pagamento: o cadastro guarda só identificação,
// cargo/departamento, admissão/status, contato de trabalho e acesso.
// Quem também dá aula tem um instrutor com `colaboradorId` (docs/pessoas-papeis.md);
// por isso as páginas carregam instrutores-data/motor (e cursos-data, que a semente usa).
// ============================================================

const MODO = document.body.dataset.modo === 'detalhe' ? 'detalhe' : 'lista';

const estado = {
  lista: Colaboradores.carregar(),
  instrutores: Instrutores.carregar(),
  selecionado: null,
  filtros: { busca: '', departamentoId: '', visao: '' }, // visao: '' | pendente | afastado | desligado (filtro rápido)
};

const ICONE = {
  lapis: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>',
  lixeira: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>',
  mais: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>',
  lupa: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>',
  fechar: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>',
  alerta: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>',
  check: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>',
  escudo: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>',
  capelo: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>',
  maleta: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>',
  calendario: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>',
  email: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>',
  celular: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>',
  externo: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>',
  baixo: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>',
};

const BOTAO_SEC = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-40 disabled:pointer-events-none';
// Primário em petróleo: cobre é "é com você", nunca fundo de botão (Regra do Cobre).
const BOTAO_PRI = 'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/40';
const BOTAO_CANCELAR = 'px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition';
const BOTAO_LINK = 'inline-flex items-center gap-1 text-xs font-medium text-petrol-800 dark:text-sky-300 hover:underline';
const BOTAO_PERIGO = 'px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40';
// Ação de cartão: sem fundo nem contorno, na cor de rótulo; petróleo no hover.
const BOTAO_FANTASMA = 'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm font-medium text-slate-500 dark:text-neutral-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30';
const FOCO_CAMPO = 'focus:outline-none focus:border-[color:var(--f-foco)] focus:ring-2 focus:ring-[color:var(--f-foco)]/25';
const CAMPO_BUSCA = `h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 pl-8 pr-3 text-sm text-slate-700 dark:text-neutral-200 placeholder:text-slate-500 dark:placeholder:text-neutral-400 ${FOCO_CAMPO}`;
const SELECT_FILTRO = `h-9 max-w-60 truncate rounded-lg border bg-white dark:bg-neutral-950 px-2.5 text-sm ${FOCO_CAMPO}`;
const CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)]';
const CARTAO_OPCAO = 'cursor-pointer rounded-lg border p-3 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 border-slate-300 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500 transition';
const TH = 'px-4 py-2.5';
const TD = 'px-4 py-2.5 text-sm text-slate-600 dark:text-neutral-300';
const APOIO = 'text-xs text-slate-500 dark:text-neutral-400';
const AVISO = 'text-[color:var(--f-cobre-tinta)]';
// Foco do teclado no link do registro acende a linha inteira, com o anel por dentro do cartão.
const FOCO_LINHA = 'has-[.link-registro:focus-visible]:bg-slate-50 dark:has-[.link-registro:focus-visible]:bg-neutral-900 has-[.link-registro:focus-visible]:outline-2 has-[.link-registro:focus-visible]:-outline-offset-2 has-[.link-registro:focus-visible]:outline-[color:var(--f-foco)]';

// Pílula só de exceção (Regra da Pílula de Exceção): ativo é o comum e não se anuncia.
const PILULA = {
  afastado: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  desligado: 'bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-400',
  docente: 'bg-petrol-800/10 text-petrol-900 dark:bg-sky-950/60 dark:text-sky-200',
};
// Perfil de acesso é dado, não estado: tag em etiqueta; o desativado aparece riscado.
const TAG = 'inline-flex items-center h-6 rounded px-2 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-neutral-900 dark:text-neutral-300';
const TAG_INATIVA = 'inline-flex items-center h-6 rounded px-2 text-xs font-medium bg-slate-50 text-slate-500 line-through dark:bg-neutral-900/60 dark:text-neutral-500';

// ---------- Helpers ----------

const C = Colaboradores;

function pilula(classe, texto, titulo = '') {
  return `<span title="${esc(titulo)}" class="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ${classe}">${esc(texto)}</span>`;
}

// Linha de chips do registro: dado de consulta rápida, sem caixa nem fundo.
function chip(icone, conteudo, titulo = '') {
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

const plural = (n, singular, pluralTxt = `${singular}s`) => `${n} ${n === 1 ? singular : pluralTxt}`;
const nomeDe = (lista, id) => lista.find((x) => x.id === id)?.nome ?? '';
const statusDe = (id) => STATUS_COLABORADOR.find((s) => s.id === id);
const nomeExibido = (c) => c.nomeSocial || c.nome;

function iniciais(nome) {
  const p = String(nome).trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

// Desligado sai do petróleo para um cinza com texto escuro (o branco sobre slate-400 não passa no contraste).
const avatar = (c, tamanho = 'h-9 w-9 text-xs') => `<div class="${tamanho} shrink-0 rounded-full ${c.status === 'desligado' ? 'bg-slate-200 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300' : 'bg-petrol-800 text-white'} grid place-items-center font-display font-semibold">${esc(iniciais(nomeExibido(c)))}</div>`;

function valorOuVazio(v, fallback = `<span class="text-slate-500 dark:text-neutral-400">não informado</span>`) {
  return v == null || v === '' ? fallback : esc(v);
}

// WhatsApp do celular de trabalho: o atalho de contato do cabeçalho (Regra da Ação à Vista).
const linkWhats = (celular) => (celular ? `<a href="https://wa.me/55${esc(C.digitos(celular))}" target="_blank" rel="noopener" title="WhatsApp ${esc(C.fmtTelefone(celular))}" aria-label="Abrir conversa no WhatsApp" class="inline-flex items-center justify-center h-9 w-9 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30">${ICONE_WHATSAPP}</a>` : '');

function persistir() { C.salvar(estado.lista); }
function atual() { return C.porId(estado.lista, estado.selecionado); }
const acessoAtual = (c) => C.Acesso.de(c.acesso.usuarioId);
const urlDetalhe = (id) => `colaborador.html?id=${encodeURIComponent(id)}`;
// Papel docente: o instrutor que aponta para este colaborador, se houver.
const instrutorDe = (c) => Instrutores.instrutorDoColaborador(estado.instrutores, c.id);
const urlInstrutor = (i) => `instrutor.html?id=${encodeURIComponent(i.id)}`;
const nomeRemuneracao = (i) => REMUNERACOES_INSTRUTOR.find((r) => r.id === i.remuneracao)?.nome ?? '';

function selecionar(id) {
  if (!id) { location.href = 'colaboradores.html'; return; }
  if (MODO === 'detalhe' && id === estado.selecionado) {
    renderColaborador();
    document.querySelector('main')?.scrollTo(0, 0);
    return;
  }
  location.href = urlDetalhe(id);
}

// Cabeçalho padrão dos cartões: título, frase de contexto e a ação do cartão em botão fantasma; sem divisória.
function cabecalhoSecao(titulo, subtitulo, idBotao, rotulo = 'Editar', icone = ICONE.lapis) {
  return `
    <div class="px-4 pt-4 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="font-display text-[15px] font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h3>
        ${subtitulo ? `<p class="mt-0.5 ${APOIO}">${subtitulo}</p>` : ''}
      </div>
      ${idBotao ? `<button type="button" id="${idBotao}" class="${BOTAO_FANTASMA} -mt-1 -mr-1.5 shrink-0">${icone} ${rotulo}</button>` : ''}
    </div>`;
}

function campo(rotulo, valorHtml, largura = '') {
  return `
    <div class="${largura}">
      <p class="text-xs font-medium text-slate-500 dark:text-neutral-400">${rotulo}</p>
      <div class="text-sm text-slate-800 dark:text-neutral-100 mt-0.5 break-words">${valorHtml}</div>
    </div>`;
}

// Faixa do topo do registro: só quando alguém precisa agir (Regra da Faixa que Pede Ação). Sem contorno.
function faixa(html, acaoHtml = '') {
  return `
    <div class="mb-4 flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
      <span class="shrink-0 text-amber-600 dark:text-amber-400">${ICONE.alerta}</span>
      <div class="min-w-0 flex-1">${html}</div>
      ${acaoHtml}
    </div>`;
}
const ACAO_FAIXA = 'shrink-0 font-medium underline-offset-2 hover:underline';

// Acesso na lista: os perfis em texto; o que falta, em cobre (é com você); usuário apagado, em vermelho.
function textoAcesso(c, acesso) {
  const fora = c.status === 'desligado';
  if (!c.acesso.usuarioId) return `<span class="${fora ? APOIO : `text-xs font-medium ${AVISO}`}">sem usuário</span>`;
  if (!acesso.usuario) return '<span class="text-xs font-medium text-red-700 dark:text-red-400">usuário não existe mais</span>';
  if (!acesso.perfis.length) return `<span class="${fora ? APOIO : `text-xs font-medium ${AVISO}`}">${fora ? 'bloqueado' : 'sem perfil'}</span>`;
  const nomes = acesso.perfis.map((p) => p.nome).join(' · ');
  return `<span class="block truncate" title="${esc(nomes)}">${esc(nomes)}</span>`;
}

// Pílula de exceção no nome: afastado e desligado. O motivo e a data ficam no title.
function pilulaStatus(c) {
  if (c.status === 'ativo') return '';
  const st = statusDe(c.status);
  const detalhe = c.status === 'afastado' && c.afastamento
    ? `${nomeDe(MOTIVOS_AFASTAMENTO, c.afastamento.motivo)} desde ${C.fmtData(c.afastamento.inicio)}`
    : c.status === 'desligado' && c.desligamento ? `Desligado em ${C.fmtData(c.desligamento.data)} · ${nomeDe(MOTIVOS_DESLIGAMENTO, c.desligamento.motivo)}` : st.descricao;
  return pilula(PILULA[c.status], st.nome, detalhe);
}

// Selo de quem também dá aula; leva ao cadastro de instrutor.
function seloDocente(c) {
  const i = instrutorDe(c);
  return i ? `<a href="${urlInstrutor(i)}" title="Também é instrutor (${esc(nomeRemuneracao(i))})" class="inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ${PILULA.docente} hover:underline underline-offset-2">Dá aula</a>` : '';
}

// ---------- Lista ----------

// Filtro rápido sobre a busca e o departamento: as exceções que a secretaria procura.
const VISOES = [
  { id: '', nome: 'Todos' },
  { id: 'pendente', nome: 'Com pendência' },
  { id: 'afastado', nome: 'Afastados' },
  { id: 'desligado', nome: 'Desligados' },
];

function renderLista() {
  const el = document.getElementById('tela');
  const f = estado.filtros;
  const base = C.filtrar(estado.lista, { ...f, status: '' });
  const pendDe = (c) => C.pendencias(c, acessoAtual(c));
  const porVisao = { '': base, pendente: base.filter((c) => pendDe(c).length), afastado: base.filter((c) => c.status === 'afastado'), desligado: base.filter((c) => c.status === 'desligado') };
  const visiveis = porVisao[f.visao];
  const filtrando = f.departamentoId || f.busca;
  const corSelect = f.departamentoId ? 'border-[color:var(--f-foco)] text-slate-900 dark:text-neutral-100' : 'border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-200';

  const linha = (c) => {
    const acesso = acessoAtual(c);
    const pend = pendDe(c);
    return `
      <tr data-abrir="${c.id}" class="cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900 transition ${FOCO_LINHA} ${c.status === 'desligado' ? 'opacity-60' : ''}">
        <td class="${TH}">
          <div class="flex items-center gap-3 min-w-0">
            ${avatar(c)}
            <div class="min-w-0">
              <p class="flex items-center gap-1.5 min-w-0 text-sm font-medium text-slate-800 dark:text-neutral-100"><span class="font-mono text-xs font-normal text-slate-500 dark:text-neutral-400">${esc(c.matricula)}</span><a href="${urlDetalhe(c.id)}" class="link-registro min-w-0 truncate hover:underline underline-offset-2 focus-visible:outline-none">${esc(nomeExibido(c))}</a>${pilulaStatus(c)}${seloDocente(c)}</p>
              <p class="${APOIO} truncate">${esc(c.cargo)}</p>
              ${pend.length ? `<p class="mt-0.5 flex items-center gap-1.5 text-xs font-medium ${AVISO}" title="${esc(pend.join(' · '))}"><span aria-hidden="true" class="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--f-cobre)]"></span><span class="truncate">${plural(pend.length, 'pendência')}: ${esc(pend.join(' · '))}</span></p>` : ''}
            </div>
          </div>
        </td>
        <td class="${TD}"><p class="truncate">${esc(nomeDe(DEPARTAMENTOS, c.departamentoId))}</p></td>
        <td class="${TD} tabular-nums"><p class="whitespace-nowrap">${C.fmtData(c.admissao)}</p><p class="${APOIO} truncate">${esc(C.tempoDeCasa(c))}</p></td>
        <td class="${TD}"><p class="truncate" title="${esc(c.contato.email ?? '')}">${c.contato.email ? esc(c.contato.email) : `<span class="text-slate-500 dark:text-neutral-400">—</span>`}</p></td>
        <td class="${TD}">${textoAcesso(c, acesso)}</td>
      </tr>`;
  };

  el.innerHTML = `
    <div class="mb-4 flex items-start justify-between gap-6">
      <div>
        <h2 class="font-display text-xl font-semibold text-slate-900 dark:text-neutral-100">Colaboradores <span class="ml-1 text-base font-normal text-slate-600 dark:text-neutral-400 tabular-nums">${estado.lista.length}</span></h2>
        <p class="max-w-3xl text-sm text-slate-600 dark:text-neutral-400 mt-0.5">Equipe da escola: identificação, cargo, contato e o usuário de acesso ao sistema. Quem também dá aula leva o selo <em>Dá aula</em> e aparece em <a href="instrutores.html" class="text-petrol-800 dark:text-sky-300 hover:underline">Instrutores</a>, com o mesmo CPF.</p>
      </div>
      <button type="button" id="btn-novo" class="${BOTAO_PRI} shrink-0">${ICONE.mais} Novo colaborador</button>
    </div>

    <div role="group" aria-label="Filtro rápido" class="mb-4 shadow-[inset_0_-1px_0] shadow-slate-200 dark:shadow-neutral-800 flex items-center gap-4">
      ${VISOES.map((v) => {
        const ativa = v.id === f.visao;
        const n = porVisao[v.id].length;
        return `<button type="button" data-visao="${v.id}" aria-pressed="${ativa}" class="px-0.5 pb-2.5 text-[13px] font-medium border-b-2 transition whitespace-nowrap ${ativa ? 'border-[color:var(--f-marca-tinta)] text-[color:var(--f-tinta)]' : 'border-transparent text-[color:var(--f-tinta-3)] hover:text-[color:var(--f-tinta-2)]'}">${v.nome} <span class="ml-0.5 text-xs tabular-nums ${v.id === 'pendente' && n ? 'text-[color:var(--f-cobre-tinta)]' : 'text-[color:var(--f-tinta-3)]'}">${n}</span></button>`;
      }).join('')}
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-2">
      ${busca('busca-colab', f.busca, 'Buscar nome, matrícula, cargo, CPF ou e-mail', 'w-96')}
      <div class="ml-auto flex flex-wrap items-center gap-2">
        <select id="filtro-departamento" class="${SELECT_FILTRO} ${corSelect}" aria-label="Departamento">
          <option value="">Todos os departamentos</option>
          ${DEPARTAMENTOS.map((o) => `<option value="${o.id}" ${o.id === f.departamentoId ? 'selected' : ''}>${esc(o.nome)}</option>`).join('')}
        </select>
        ${filtrando ? `<button type="button" id="btn-limpar-filtros" class="${BOTAO_LINK}">Limpar</button>` : ''}
      </div>
    </div>

    <div class="${CARTAO} overflow-x-auto">
      <table class="w-full table-fixed text-left">
        <thead class="text-xs font-medium text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800">
          <tr>
            <th class="${TH}">Colaborador</th>
            <th class="${TH} w-[150px]">Departamento</th>
            <th class="${TH} w-[120px]">Admissão</th>
            <th class="${TH} w-[220px]">E-mail</th>
            <th class="${TH} w-[180px]">Acesso</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
          ${visiveis.length ? visiveis.map(linha).join('') : `
          <tr><td colspan="5" class="px-4 py-10 text-center text-sm text-slate-500 dark:text-neutral-400">
            ${!estado.lista.length ? `Nenhum colaborador cadastrado ainda.<br><button type="button" id="btn-novo-vazio" class="${BOTAO_PRI} mt-4">${ICONE.mais} Cadastrar o primeiro colaborador</button>`
              : filtrando || f.visao ? `Nenhum colaborador corresponde aos filtros. <button type="button" data-limpar class="${BOTAO_LINK} ml-1">Limpar filtros</button>` : ''}
          </td></tr>`}
        </tbody>
      </table>
      <div class="px-4 py-2 border-t border-slate-100 dark:border-neutral-900 ${APOIO} tabular-nums">
        ${plural(visiveis.length, 'colaborador', 'colaboradores')}${visiveis.length !== estado.lista.length ? ` de ${estado.lista.length}` : ''}
      </div>
    </div>`;

  const limpar = () => { estado.filtros = { busca: '', departamentoId: '', visao: '' }; renderLista(); };
  const campoBusca = el.querySelector('#busca-colab');
  campoBusca.addEventListener('input', () => { estado.filtros.busca = campoBusca.value; renderLista(); const b = el.querySelector('#busca-colab'); b.focus(); b.setSelectionRange(b.value.length, b.value.length); });
  el.querySelector('#filtro-departamento').addEventListener('change', (e) => { estado.filtros.departamentoId = e.target.value; renderLista(); });
  el.querySelectorAll('[data-visao]').forEach((b) => b.addEventListener('click', () => { estado.filtros.visao = b.dataset.visao; renderLista(); el.querySelector(`[data-visao="${estado.filtros.visao}"]`).focus(); }));
  el.querySelector('#btn-limpar-filtros')?.addEventListener('click', limpar);
  el.querySelector('[data-limpar]')?.addEventListener('click', limpar);
  el.querySelector('#btn-novo').addEventListener('click', () => abrirDrawerColaborador());
  el.querySelector('#btn-novo-vazio')?.addEventListener('click', () => abrirDrawerColaborador());
  // O nome é o link (teclado, ⌘-clique); o resto da linha abre o mesmo registro, a não ser que haja texto selecionado.
  el.querySelector('table').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-abrir]');
    if (!tr || e.target.closest('a, button') || getSelection().toString()) return;
    if (e.metaKey || e.ctrlKey) window.open(urlDetalhe(tr.dataset.abrir), '_blank'); else selecionar(tr.dataset.abrir);
  });
}

// ---------- Colaborador aberto ----------

function renderColaborador() {
  const el = document.getElementById('tela');
  const c = atual();
  const acesso = acessoAtual(c);
  const pend = C.pendencias(c, acesso);
  const idade = C.idade(c.nascimento);
  const temAcessoAtivo = Boolean(acesso?.usuario && (acesso.perfis.length || acesso.extras));
  const docente = instrutorDe(c);

  // Uma ação à vista (e o WhatsApp); a troca de situação e a exclusão vão para o "Mais".
  const itensMais = [
    c.status === 'ativo' ? { nome: 'Afastar', detalhe: 'Licença ou férias longas; o acesso não muda', acao: abrirDrawerAfastar } : null,
    c.status === 'afastado' ? { nome: 'Encerrar afastamento', detalhe: 'Volta a ativo hoje', acao: encerrarAfastamento } : null,
    c.status === 'desligado' ? { nome: 'Readmitir', detalhe: 'Volta a ativo com nova admissão', acao: abrirDrawerReadmitir } : null,
    !docente && c.status !== 'desligado' ? { nome: 'Também dá aula', detalhe: 'Cria o cadastro de instrutor com o CPF deste colaborador', acao: abrirDrawerDocente } : null,
    'sep',
    c.status !== 'desligado' ? { nome: 'Desligar', perigo: true, detalhe: 'Encerra o vínculo; pode bloquear o acesso junto', acao: abrirModalDesligar } : null,
    { nome: 'Excluir colaborador', perigo: true, desabilitado: Boolean(docente), detalhe: docente ? 'Também é instrutor — o CPF dele mora aqui; desligue em vez de excluir' : 'Só para cadastro errado — quem trabalhou aqui é desligado', acao: () => confirmarExclusao(c.id) },
  ].filter(Boolean);

  // Afastamento pede o retorno; acesso ativo de quem saiu pede o bloqueio. As pendências vão junto, numa faixa só.
  const afastado = c.status === 'afastado' && c.afastamento;
  const linhasFaixa = [
    afastado ? `<span class="font-medium">Afastado — ${esc(nomeDe(MOTIVOS_AFASTAMENTO, c.afastamento.motivo))}</span> desde ${C.fmtData(c.afastamento.inicio)}${c.afastamento.previsaoRetorno ? `, retorno previsto em ${C.fmtData(c.afastamento.previsaoRetorno)}` : ''}.` : '',
    pend.length ? `<span class="font-medium">${plural(pend.length, 'pendência')}${c.status === 'desligado' ? '' : ' de cadastro e acesso'}:</span> ${pend.map(esc).join(' · ')}` : '',
  ].filter(Boolean);
  const acaoFaixa = afastado ? `<button type="button" id="btn-faixa-retorno" class="${ACAO_FAIXA}">Encerrar afastamento</button>`
    : c.status === 'desligado' && temAcessoAtivo ? `<button type="button" id="btn-faixa-bloquear" class="${ACAO_FAIXA}">Bloquear acesso</button>` : '';

  const cartaoAcesso = () => {
    if (!c.acesso.usuarioId) {
      return `
        <div class="p-4 text-sm text-slate-800 dark:text-neutral-100 space-y-4">
          <p>${c.status === 'desligado' ? 'Sem usuário de acesso.' : 'Ainda não tem usuário no sistema — não entra em nenhum portal.'}</p>
          ${c.status === 'desligado' ? '' : `
          <div class="flex flex-wrap gap-2">
            <button type="button" id="btn-criar-acesso" class="${BOTAO_PRI}">${ICONE.escudo} Criar usuário de acesso</button>
            <button type="button" id="btn-vincular-acesso" class="${BOTAO_SEC}">Vincular usuário existente</button>
          </div>`}
        </div>`;
    }
    if (!acesso.usuario) {
      return `
        <div class="p-4 text-sm space-y-4">
          <p class="text-red-700 dark:text-red-400">O usuário <span class="font-mono">${esc(c.acesso.usuarioId)}</span> não existe mais em Perfis de acesso.</p>
          <div class="flex flex-wrap gap-2">
            <button type="button" id="btn-vincular-acesso" class="${BOTAO_SEC}">Vincular outro usuário</button>
            <button type="button" id="btn-desvincular-acesso" class="${BOTAO_SEC}">Desvincular</button>
          </div>
        </div>`;
    }
    const u = acesso.usuario;
    return `
      <div class="p-4 grid grid-cols-2 gap-4">
        ${campo('Usuário', `${esc(u.nome)} <span class="font-mono text-xs text-slate-500 dark:text-neutral-400">· ${esc(u.id)}</span>`)}
        ${campo('Permissões extras', acesso.extras ? `${plural(acesso.extras, 'ação', 'ações')} <span class="${APOIO}">· fora dos perfis</span>` : '<span class="text-slate-500 dark:text-neutral-400">nenhuma</span>')}
        ${campo('Perfis de acesso', acesso.perfis.length || acesso.inativos.length
          ? `<div class="flex flex-wrap gap-1 mt-1">${acesso.perfis.map((p) => `<span class="${TAG}" title="${esc(p.descricao ?? '')}">${esc(p.nome)}</span>`).join('')}${acesso.inativos.map((p) => `<span class="${TAG_INATIVA}" title="Perfil desativado — não concede nada">${esc(p.nome)}</span>`).join('')}</div>`
          : `<span class="${c.status === 'desligado' ? 'text-slate-500 dark:text-neutral-400' : `font-medium ${AVISO}`}">${c.status === 'desligado' ? 'Bloqueado — sem perfis.' : 'Nenhum perfil — o usuário existe mas não acessa nada.'}</span>`, 'col-span-2')}
      </div>
      <div class="px-4 pb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" id="btn-vincular-acesso" class="${BOTAO_LINK}">Trocar usuário</button>
        <button type="button" id="btn-desvincular-acesso" class="${BOTAO_LINK}">Desvincular</button>
        ${temAcessoAtivo ? '<button type="button" id="btn-bloquear-acesso" class="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400 hover:underline">Bloquear acesso</button>' : ''}
        <a href="perfis.html" target="_blank" class="${BOTAO_LINK} ml-auto">Abrir Perfis de acesso ${ICONE.externo}</a>
      </div>`;
  };

  el.innerHTML = `
    <nav aria-label="Breadcrumb" class="mb-3 flex items-center gap-1.5 text-sm text-slate-600 dark:text-neutral-400">
      <a href="home.html" class="hover:text-petrol-800 dark:hover:text-sky-300 transition">Home</a>
      <span>/</span>
      <a href="colaboradores.html" class="hover:text-petrol-800 dark:hover:text-sky-300 transition">Colaboradores</a>
      <span>/</span>
      <span class="font-medium text-slate-800 dark:text-neutral-100 truncate max-w-xs" aria-current="page">${esc(nomeExibido(c))}</span>
    </nav>
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1 basis-80 flex items-start gap-3">
        ${avatar(c, 'h-12 w-12 text-base')}
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2 min-w-0">
            <h2 class="font-registro text-[26px] leading-[1.15] font-semibold tracking-[-0.01em] text-slate-900 dark:text-neutral-100 truncate">${esc(nomeExibido(c))}</h2>
            ${c.status === 'desligado' ? pilulaStatus(c) : ''}
          </div>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
            ${chip(ICONE.maleta, `<span class="font-mono">${esc(c.matricula)}</span> · ${esc(c.cargo)} · ${esc(nomeDe(DEPARTAMENTOS, c.departamentoId))}`, 'Matrícula, cargo e departamento')}
            ${chip(ICONE.calendario, `<span class="tabular-nums">desde ${C.fmtData(c.admissao)}</span> · ${esc(C.tempoDeCasa(c))}`, 'Admissão')}
            ${c.contato.email ? chip(ICONE.email, `<a href="mailto:${esc(c.contato.email)}" class="hover:underline">${esc(c.contato.email)}</a>`, 'E-mail corporativo') : ''}
            ${c.contato.celular ? chip(ICONE.celular, `<span class="tabular-nums">${esc(C.fmtTelefone(c.contato.celular))}</span>`, 'Celular de trabalho') : ''}
            ${docente ? chip(ICONE.capelo, `<a href="${urlInstrutor(docente)}" class="hover:underline">Dá aula · ${esc(nomeRemuneracao(docente))}</a>`, 'Também é instrutor; abre o cadastro de instrutor') : ''}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        ${c.status === 'desligado' ? '' : linkWhats(c.contato.celular)}
        <button type="button" id="btn-editar" class="${BOTAO_SEC}">${ICONE.lapis} Editar dados</button>
        <button type="button" id="btn-mais" class="${BOTAO_SEC}" aria-haspopup="menu" aria-expanded="false">Mais ${ICONE.baixo}</button>
      </div>
    </div>

    ${linhasFaixa.length ? faixa(linhasFaixa.join('<br>'), acaoFaixa) : ''}

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <section class="${CARTAO}">
        ${cabecalhoSecao('Cargo e admissão', 'Como aparece nas listas e nos relatórios.', 'btn-editar-dados')}
        <div class="p-4 grid grid-cols-2 gap-4">
          ${campo('Nome completo', esc(c.nome), 'col-span-2')}
          ${campo('Cargo', esc(c.cargo))}
          ${campo('Departamento', esc(nomeDe(DEPARTAMENTOS, c.departamentoId)))}
          ${campo('Matrícula', `<span class="font-mono">${esc(c.matricula)}</span>`)}
          ${campo('Admissão', `<span class="tabular-nums">${C.fmtData(c.admissao)}</span> <span class="${APOIO}">· ${esc(C.tempoDeCasa(c))}</span>`)}
          ${c.desligamento ? campo('Desligamento', `<span class="tabular-nums">${C.fmtData(c.desligamento.data)}</span> <span class="${APOIO}">· ${esc(nomeDe(MOTIVOS_DESLIGAMENTO, c.desligamento.motivo))}</span>`, 'col-span-2') : ''}
        </div>
      </section>

      <section class="${CARTAO}">
        ${cabecalhoSecao('Dados pessoais', docente ? 'Identificação da pessoa; vale também para o cadastro de instrutor.' : 'Identificação da pessoa.', 'btn-editar-pessoais')}
        <div class="p-4 grid grid-cols-2 gap-4">
          ${campo('CPF', c.cpf ? `<span class="font-mono">${esc(C.fmtCpf(c.cpf))}</span>${C.cpfValido(c.cpf) ? '' : ' <span class="text-xs font-medium text-red-700 dark:text-red-400">inválido</span>'}` : valorOuVazio(null))}
          ${campo('Nascimento', c.nascimento ? `<span class="tabular-nums">${C.fmtData(c.nascimento)}</span> <span class="${APOIO}">· ${idade} anos</span>` : valorOuVazio(null))}
          ${campo('Nome social', valorOuVazio(c.nomeSocial, '<span class="text-slate-500 dark:text-neutral-400">—</span>'), 'col-span-2')}
        </div>
      </section>

      <section class="${CARTAO}">
        ${cabecalhoSecao('Contato', 'E-mail corporativo e celular de trabalho.', 'btn-editar-contato')}
        <div class="p-4 grid grid-cols-2 gap-4">
          ${campo('E-mail corporativo', c.contato.email ? `<a href="mailto:${esc(c.contato.email)}" class="text-petrol-800 dark:text-sky-300 hover:underline">${esc(c.contato.email)}</a>` : valorOuVazio(null))}
          ${campo('Celular', c.contato.celular ? `<span class="tabular-nums">${esc(C.fmtTelefone(c.contato.celular))}</span>` : valorOuVazio(null))}
        </div>
      </section>

      <section class="${CARTAO}">
        ${cabecalhoSecao('Acesso ao sistema', 'Usuário em Perfis de acesso e o que ele pode fazer.', acesso?.usuario ? 'btn-perfis-acesso' : null, 'Perfis', ICONE.escudo)}
        ${cartaoAcesso()}
      </section>

      <section class="${CARTAO}">
        ${cabecalhoSecao('Observações', 'Avisos internos sobre a pessoa.', 'btn-editar-obs')}
        <div class="p-4 text-sm text-slate-800 dark:text-neutral-100 whitespace-pre-line">${valorOuVazio(c.observacoes, '<span class="text-slate-500 dark:text-neutral-400">Nenhuma.</span>')}</div>
      </section>

      <section class="${CARTAO}">
        ${cabecalhoSecao('Histórico', 'Admissão, afastamentos, desligamento e readmissão.', null)}
        ${c.historico.length ? `
        <ol class="p-4 space-y-2">
          ${[...c.historico].sort((x, y) => y.em.localeCompare(x.em)).map((h) => `
          <li class="flex items-baseline gap-3 text-sm">
            <span class="text-xs text-slate-500 dark:text-neutral-400 tabular-nums w-20 shrink-0">${C.fmtData(h.em)}</span>
            <span class="text-slate-800 dark:text-neutral-100">${esc(h.texto)}</span>
          </li>`).join('')}
        </ol>` : '<p class="p-4 text-sm text-slate-500 dark:text-neutral-400">Nada registrado.</p>'}
      </section>
    </div>`;

  el.querySelector('#btn-editar').addEventListener('click', () => abrirDrawerColaborador(c.id));
  el.querySelector('#btn-mais').addEventListener('click', (e) => abrirMenu(e.currentTarget, itensMais));
  el.querySelector('#btn-faixa-retorno')?.addEventListener('click', () => encerrarAfastamento());
  el.querySelector('#btn-faixa-bloquear')?.addEventListener('click', () => confirmarBloqueio());
  el.querySelector('#btn-editar-dados').addEventListener('click', () => abrirDrawerColaborador(c.id));
  el.querySelector('#btn-editar-pessoais').addEventListener('click', () => abrirDrawerPessoais());
  el.querySelector('#btn-editar-contato').addEventListener('click', () => abrirDrawerContato());
  el.querySelector('#btn-editar-obs').addEventListener('click', () => abrirDrawerObservacoes());
  el.querySelector('#btn-criar-acesso')?.addEventListener('click', () => abrirDrawerCriarAcesso());
  el.querySelector('#btn-vincular-acesso')?.addEventListener('click', () => abrirDrawerVincularAcesso());
  el.querySelector('#btn-perfis-acesso')?.addEventListener('click', () => abrirDrawerPerfisAcesso());
  el.querySelector('#btn-bloquear-acesso')?.addEventListener('click', () => confirmarBloqueio());
  el.querySelector('#btn-desvincular-acesso')?.addEventListener('click', () => desvincularAcesso());
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

function cabecalhoDrawer(titulo, subtitulo) {
  return `
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
      <div>
        <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h3>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${subtitulo}</p>
      </div>
      <button type="button" data-fechar-drawer class="p-1 rounded text-slate-500 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${ICONE.fechar}</button>
    </div>`;
}

function rodapeDrawer(rotulo, perigo = false) {
  return `
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-drawer class="${BOTAO_CANCELAR}">Cancelar</button>
      <button type="submit" class="${perigo ? BOTAO_PERIGO : BOTAO_PRI}">${rotulo}</button>
    </div>`;
}

function drawerFormulario({ id, titulo, subtitulo, corpo, rotulo, largura = 'max-w-md', aoSalvar, foco, perigo = false }) {
  const { fechar, root } = abrirDrawer(`
    <form id="${id}" novalidate role="dialog" aria-modal="true" class="drawer-anim relative h-full w-full ${largura} bg-white dark:bg-neutral-950 border-l border-slate-200 dark:border-neutral-800 shadow-xl flex flex-col">
      ${cabecalhoDrawer(titulo, subtitulo)}
      <div class="flex-1 overflow-y-auto px-5 py-4 space-y-5">${corpo}</div>
      ${rodapeDrawer(rotulo, perigo)}
    </form>`);
  const form = root.querySelector(`#${id}`);
  aplicarMascaras(form);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const erros = aoSalvar(new FormData(form), form) ?? [];
    if (mostrarErros(form, erros)) return;
    fechar();
  });
  if (foco) form.querySelector(foco)?.focus();
  return { form, fechar };
}

// Máscaras leves enquanto digita: data-mascara="cpf|telefone".
function aplicarMascaras(form) {
  // CPF: máscara delegada de js/documento.js; aqui só telefone.
  const fmts = { telefone: C.fmtTelefone };
  form.querySelectorAll('[data-mascara]').forEach((input) => {
    const f = fmts[input.dataset.mascara];
    if (!f) return;
    input.addEventListener('input', () => { const d = C.digitos(input.value); input.value = f(d) || d; });
  });
}

const campoTexto = (name, rotulo, valor, { tipo = 'text', placeholder = '', max = '', extra = '', opcional = false, sufixo = '', prefixo = '', mascara = '' } = {}) => `
  <div>
    <label class="rotulo" for="f-${name}">${rotulo} ${opcional ? OPCIONAL : ''}</label>
    <div class="relative">
      ${prefixo ? `<span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-neutral-400">${prefixo}</span>` : ''}
      <input id="f-${name}" name="${name}" type="${tipo}" ${max ? `maxlength="${max}"` : ''} ${extra} ${mascara ? `data-mascara="${mascara}" inputmode="numeric"` : ''} class="campo ${sufixo ? 'pr-14' : ''} ${prefixo ? 'pl-9' : ''}" placeholder="${esc(placeholder)}" value="${esc(valor ?? '')}">
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

const campoSelect = (name, rotulo, opcoes, valor, { vazio = 'Escolha', opcional = false } = {}) => `
  <div>
    <label class="rotulo" for="f-${name}">${rotulo} ${opcional ? OPCIONAL : ''}</label>
    <select id="f-${name}" name="${name}" class="campo">
      <option value="" ${valor ? '' : 'selected'} ${opcional ? '' : 'disabled'}>${esc(vazio)}</option>
      ${opcoes.map((o) => `<option value="${o.id}" ${valor === o.id ? 'selected' : ''}>${esc(o.nome)}</option>`).join('')}
    </select>
    ${ERRO(name)}
  </div>`;

const campoCheck = (name, rotulo, marcado, descricao = '') => `
  <label class="${CARTAO_OPCAO} flex items-start gap-2.5">
    <input type="checkbox" name="${name}" class="check mt-0.5" ${marcado ? 'checked' : ''}>
    <span>
      <span class="block text-sm font-medium text-slate-800 dark:text-neutral-100">${rotulo}</span>
      ${descricao ? `<span class="block text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${descricao}</span>` : ''}
    </span>
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

// ---------- Drawer do colaborador (dados principais) ----------

function abrirDrawerColaborador(id = null) {
  const c = id ? C.porId(estado.lista, id) : null;
  const d = c ? { ...c, email: c.contato.email } : { nome: '', cpf: '', cargo: '', departamentoId: '', admissao: COLAB_HOJE, email: '' };
  drawerFormulario({
    id: 'form-colab',
    titulo: c ? 'Editar dados' : 'Novo colaborador',
    subtitulo: c ? 'Identificação, cargo e admissão.' : `Só o essencial — matrícula <span class="font-mono">${esc(C.proximaMatricula(estado.lista))}</span> automática. Depois você completa contato e acesso.`,
    rotulo: c ? 'Salvar alterações' : 'Cadastrar',
    largura: 'max-w-lg',
    foco: '#f-nome',
    corpo: `
      ${c ? `<div class="grid grid-cols-3 gap-3">${campoTexto('matricula', 'Matrícula', d.matricula, { max: 8 })}<div class="col-span-2">${campoTexto('nome', 'Nome completo', d.nome, { max: 80 })}</div></div>` : campoTexto('nome', 'Nome completo', d.nome, { placeholder: 'Como está no documento', max: 80 })}
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('cpf', 'CPF', C.fmtCpf(d.cpf), { placeholder: '000.000.000-00', max: 14, mascara: 'cpf' })}
        ${campoTexto('admissao', 'Admissão', d.admissao, { tipo: 'date' })}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('cargo', 'Cargo', d.cargo, { placeholder: 'Ex.: Analista financeiro', max: 60 })}
        ${campoSelect('departamentoId', 'Departamento', DEPARTAMENTOS, d.departamentoId, { vazio: 'Escolha o departamento' })}
      </div>
      ${campoTexto('email', 'E-mail corporativo', d.email, { tipo: 'email', placeholder: 'nome.sobrenome@proway.com.br', max: 120, opcional: true })}`,
    aoSalvar: (fd) => {
      const novo = { matricula: c ? fd.get('matricula') : null, nome: fd.get('nome') ?? '', cpf: fd.get('cpf') ?? '', cargo: fd.get('cargo') ?? '', departamentoId: fd.get('departamentoId') ?? '', admissao: fd.get('admissao') ?? '', email: fd.get('email') ?? '' };
      const erros = C.validarDados(novo, estado.lista, id);
      if (erros.length) return erros;
      if (c) {
        estado.lista = C.atualizarDados(estado.lista, id, novo);
        persistir(); renderColaborador();
        toast(`"${novo.nome.trim()}" atualizado.`);
      } else {
        const r = C.incluir(estado.lista, novo);
        estado.lista = r.lista;
        persistir();
        toast(`"${r.colaborador.nome}" cadastrado — matrícula ${r.colaborador.matricula}.`);
        selecionar(r.colaborador.id);
      }
    },
  });
}

function abrirDrawerDocente() {
  const c = atual();
  drawerFormulario({
    id: 'form-docente', titulo: 'Também dá aula', subtitulo: `Cria o cadastro de instrutor de <strong>${esc(nomeExibido(c))}</strong>. O CPF e o nascimento continuam aqui; nome e contato de trabalho vão junto.`, rotulo: 'Criar cadastro de instrutor', largura: 'max-w-lg',
    corpo: `<fieldset><legend class="rotulo">Como a aula é paga</legend>${cartoesRadio('remuneracao', REMUNERACOES_INSTRUTOR, null)}${ERRO('remuneracao')}</fieldset>`,
    aoSalvar: (fd) => {
      const remuneracao = fd.get('remuneracao');
      if (!remuneracao) return [{ campo: 'remuneracao', mensagem: 'Escolha como a aula é paga.' }];
      const r = Instrutores.incluirDeColaborador(Instrutores.carregar(), c, { remuneracao });
      Instrutores.salvar(r.lista);
      location.href = urlInstrutor(r.instrutor);
    },
  });
}

function confirmarExclusao(id) {
  const c = C.porId(estado.lista, id);
  const acesso = acessoAtual(c);
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
      <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Excluir colaborador</h3>
    </div>
    <div class="px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 space-y-2">
      <p>Excluir <strong>${esc(c.matricula)} · ${esc(c.nome)}</strong> (${esc(c.cargo)})?</p>
      <p class="text-slate-500 dark:text-neutral-400">Dados, contato e histórico vão junto. Quem já trabalhou na escola deve ser <em>desligado</em>, não excluído — a exclusão serve para cadastros errados.</p>
      ${acesso?.usuario ? `<p class="text-slate-500 dark:text-neutral-400">O usuário de acesso <strong>${esc(acesso.usuario.nome)}</strong> continua existindo em Perfis de acesso${acesso.perfis.length ? ' <span class="font-medium text-[color:var(--f-cobre-tinta)]">com perfis ativos</span>' : ''}.</p>` : ''}
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
      <button type="button" id="btn-confirmar" class="${BOTAO_PERIGO}">Excluir</button>
    </div>`);
  root.querySelector('#btn-confirmar').addEventListener('click', () => {
    estado.lista = C.remover(estado.lista, id);
    persistir();
    fecharModal();
    toast(`"${c.nome}" excluído.`);
    selecionar(null);
  });
}

// ---------- Status ----------

function abrirDrawerAfastar() {
  const c = atual();
  drawerFormulario({
    id: 'form-afastar',
    titulo: 'Afastar colaborador',
    subtitulo: `<strong>${esc(nomeExibido(c))}</strong> fica como <em>afastado</em>; o acesso ao sistema não muda.`,
    rotulo: 'Afastar',
    foco: '#f-inicio',
    corpo: `
      <fieldset>
        <legend class="rotulo">Motivo</legend>
        ${cartoesRadio('motivo', MOTIVOS_AFASTAMENTO, null, 'grid-cols-1')}
        ${ERRO('motivo')}
      </fieldset>
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('inicio', 'Início', COLAB_HOJE, { tipo: 'date' })}
        ${campoTexto('previsaoRetorno', 'Retorno previsto', '', { tipo: 'date', opcional: true })}
      </div>`,
    aoSalvar: (fd) => {
      const dados = Object.fromEntries(fd);
      const erros = C.validarAfastamento(dados);
      if (erros.length) return erros;
      estado.lista = C.afastar(estado.lista, c.id, dados);
      persistir(); renderColaborador();
      toast(`"${nomeExibido(c)}" afastado.`);
    },
  });
}

function encerrarAfastamento() {
  const c = atual();
  estado.lista = C.encerrarAfastamento(estado.lista, c.id);
  persistir(); renderColaborador();
  toast(`"${nomeExibido(c)}" de volta — ativo.`);
}

function abrirModalDesligar() {
  const c = atual();
  const acesso = acessoAtual(c);
  const temAcesso = Boolean(acesso?.usuario && (acesso.perfis.length || acesso.extras));
  const root = abrirModal(`
    <form id="form-desligar" novalidate>
      <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
        <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Desligar colaborador</h3>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5"><strong>${esc(nomeExibido(c))}</strong> · ${esc(c.cargo)} · ${esc(C.tempoDeCasa(c))} de casa.</p>
      </div>
      <div class="px-5 py-4 space-y-5">
        <fieldset>
          <legend class="rotulo">Motivo</legend>
          ${cartoesRadio('motivo', MOTIVOS_DESLIGAMENTO, null, 'grid-cols-1')}
          ${ERRO('motivo')}
        </fieldset>
        <div class="grid grid-cols-2 gap-3">
          ${campoTexto('data', 'Data do desligamento', COLAB_HOJE, { tipo: 'date' })}
        </div>
        ${temAcesso ? campoCheck('bloquear', 'Bloquear o acesso ao sistema agora', true, `Remove os perfis e permissões extras do usuário <strong>${esc(acesso.usuario.nome)}</strong>. O usuário continua existindo para histórico.`) : ''}
      </div>
      <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
        <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
        <button type="submit" class="${BOTAO_PERIGO}">Desligar</button>
      </div>
    </form>`);
  const form = root.querySelector('#form-desligar');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const dados = Object.fromEntries(fd);
    if (mostrarErros(form, C.validarDesligamento(dados, c))) return;
    estado.lista = C.desligar(estado.lista, c.id, dados);
    let msg = `"${nomeExibido(c)}" desligado.`;
    if (temAcesso && fd.get('bloquear') === 'on') { C.Acesso.bloquear(c.acesso.usuarioId); msg += ' Acesso bloqueado.'; }
    persistir(); fecharModal(); renderColaborador();
    toast(msg);
  });
}

function abrirDrawerReadmitir() {
  const c = atual();
  drawerFormulario({
    id: 'form-readmitir',
    titulo: 'Readmitir colaborador',
    subtitulo: `<strong>${esc(nomeExibido(c))}</strong> volta a <em>ativo</em> com nova admissão; o histórico anterior fica. Confira cargo e acesso depois.`,
    rotulo: 'Readmitir',
    foco: '#f-admissao',
    corpo: `<div class="grid grid-cols-2 gap-3">${campoTexto('admissao', 'Nova admissão', COLAB_HOJE, { tipo: 'date' })}</div>`,
    aoSalvar: (fd) => {
      const admissao = fd.get('admissao');
      if (!admissao) return [{ campo: 'admissao', mensagem: 'Informe a data.' }];
      estado.lista = C.readmitir(estado.lista, c.id, admissao);
      persistir(); renderColaborador();
      toast(`"${nomeExibido(c)}" readmitido.`);
    },
  });
}

// ---------- Drawers de seção ----------

function abrirDrawerPessoais() {
  const c = atual();
  drawerFormulario({
    id: 'form-pessoais',
    titulo: 'Dados pessoais',
    subtitulo: `De <strong>${esc(c.nome)}</strong>. CPF e nome completo ficam em "Editar dados".`,
    rotulo: 'Salvar alterações',
    largura: 'max-w-lg',
    foco: '#f-nomeSocial',
    corpo: `
      ${campoTexto('nomeSocial', 'Nome social', c.nomeSocial, { max: 80, opcional: true, placeholder: 'Como prefere ser chamado(a); aparece no lugar do nome' })}
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('nascimento', 'Nascimento', c.nascimento, { tipo: 'date', opcional: true })}
      </div>`,
    aoSalvar: (fd) => {
      const dados = Object.fromEntries(fd);
      const erros = C.validarPessoais(dados);
      if (erros.length) return erros;
      estado.lista = C.atualizarPessoais(estado.lista, c.id, dados);
      persistir(); renderColaborador();
      toast('Dados pessoais atualizados.');
    },
  });
}

function abrirDrawerContato() {
  const c = atual();
  const k = c.contato;
  drawerFormulario({
    id: 'form-contato',
    titulo: 'Contato',
    subtitulo: `De <strong>${esc(nomeExibido(c))}</strong>. O e-mail corporativo fica em "Editar dados".`,
    rotulo: 'Salvar alterações',
    largura: 'max-w-lg',
    foco: '#f-celular',
    corpo: `
      <div class="grid grid-cols-2 gap-3">
        ${campoTexto('celular', 'Celular', C.fmtTelefone(k.celular), { placeholder: '(47) 99999-0000', max: 15, mascara: 'telefone' })}
      </div>`,
    aoSalvar: (fd) => {
      const dados = Object.fromEntries(fd);
      const erros = C.validarContato(dados);
      if (erros.length) return erros;
      estado.lista = C.atualizarContato(estado.lista, c.id, dados);
      persistir(); renderColaborador();
      toast('Contato atualizado.');
    },
  });
}

function abrirDrawerObservacoes() {
  const c = atual();
  drawerFormulario({
    id: 'form-obs',
    titulo: 'Observações',
    subtitulo: `Sobre <strong>${esc(nomeExibido(c))}</strong> · avisos internos.`,
    rotulo: 'Salvar alterações',
    foco: '#f-observacoes',
    corpo: campoArea('observacoes', 'Observações', c.observacoes, { rows: 6, max: 1000, opcional: true, placeholder: 'Ex.: férias combinadas para janeiro; também dá aula…' }),
    aoSalvar: (fd) => {
      estado.lista = C.atualizarObservacoes(estado.lista, c.id, fd.get('observacoes'));
      persistir(); renderColaborador();
      toast('Observações atualizadas.');
    },
  });
}

// ---------- Acesso ao sistema ----------

// Lista de perfis como checkboxes (com busca), reaproveitada em criar e editar.
function listaPerfis(marcados) {
  const perfis = C.Acesso.perfis();
  return `
    <fieldset>
      <legend class="rotulo">Perfis de acesso</legend>
      ${busca('busca-perfil', '', 'Buscar perfil', 'w-full mb-2')}
      <div data-lista-perfis class="space-y-2 max-h-80 overflow-y-auto pr-1">
        ${perfis.map((p) => `
        <label data-perfil-item data-nome="${esc(C.normalizar(p.nome))}" class="${CARTAO_OPCAO} flex items-start gap-2.5 ${p.ativo === false ? 'opacity-60' : ''}">
          <input type="checkbox" name="perfis" value="${p.id}" class="check mt-0.5" ${marcados.includes(p.id) ? 'checked' : ''}>
          <span>
            <span class="block text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(p.nome)}${p.ativo === false ? ' <span class="text-xs font-normal text-slate-500 dark:text-neutral-400">(desativado)</span>' : ''}</span>
            ${p.descricao ? `<span class="block text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(p.descricao)}</span>` : ''}
          </span>
        </label>`).join('')}
      </div>
      <p data-sem-perfil class="hidden text-xs text-slate-500 dark:text-neutral-400 mt-2">Nenhum perfil com esse nome.</p>
      ${ERRO('perfis')}
    </fieldset>`;
}

function ligarBuscaPerfis(form) {
  const campoB = form.querySelector('#busca-perfil');
  campoB?.addEventListener('input', () => {
    const termo = C.normalizar(campoB.value);
    let n = 0;
    form.querySelectorAll('[data-perfil-item]').forEach((li) => { const ok = !termo || li.dataset.nome.includes(termo); li.classList.toggle('hidden', !ok); if (ok) n += 1; });
    form.querySelector('[data-sem-perfil]').classList.toggle('hidden', n > 0);
  });
}

function abrirDrawerCriarAcesso() {
  const c = atual();
  const { form } = drawerFormulario({
    id: 'form-criar-acesso',
    titulo: 'Criar usuário de acesso',
    subtitulo: `Cria o usuário em <strong>Perfis de acesso</strong> e vincula a <strong>${esc(nomeExibido(c))}</strong>. Escolha ao menos um perfil, senão a pessoa não acessa nada.`,
    rotulo: 'Criar e vincular',
    largura: 'max-w-lg',
    foco: '#f-nomeUsuario',
    corpo: `
      ${campoTexto('nomeUsuario', 'Nome do usuário', nomeExibido(c), { max: 80 })}
      ${listaPerfis([])}`,
    aoSalvar: (fd) => {
      const nome = String(fd.get('nomeUsuario') ?? '').trim();
      const perfis = fd.getAll('perfis');
      const erros = [];
      if (nome.length < 3) erros.push({ campo: 'nomeUsuario', mensagem: 'Informe o nome.' });
      if (!perfis.length) erros.push({ campo: 'perfis', mensagem: 'Escolha ao menos um perfil.' });
      if (erros.length) return erros;
      const u = C.Acesso.criar(nome, perfis);
      estado.lista = C.vincularUsuario(estado.lista, c.id, u.id);
      persistir(); renderColaborador();
      toast(`Usuário "${u.nome}" criado com ${plural(perfis.length, 'perfil', 'perfis')}.`);
    },
  });
  ligarBuscaPerfis(form);
}

function abrirDrawerVincularAcesso() {
  const c = atual();
  const livres = C.Acesso.livres(estado.lista, c.id);
  const { form } = drawerFormulario({
    id: 'form-vincular-acesso',
    titulo: c.acesso.usuarioId ? 'Trocar usuário de acesso' : 'Vincular usuário existente',
    subtitulo: `Usuários de <strong>Perfis de acesso</strong> que ainda não pertencem a outro colaborador.`,
    rotulo: 'Vincular',
    largura: 'max-w-lg',
    foco: '#busca-usuario',
    corpo: livres.length ? `
      ${busca('busca-usuario', '', 'Buscar usuário', 'w-full')}
      <div data-lista-usuarios class="space-y-2">
        ${livres.map((u) => {
          const a = C.Acesso.de(u.id);
          return `
          <label data-usuario-item data-nome="${esc(C.normalizar(`${u.nome} ${u.id}`))}" class="${CARTAO_OPCAO} flex items-start gap-2.5">
            <input type="radio" name="usuarioId" value="${u.id}" class="sr-only" ${u.id === c.acesso.usuarioId ? 'checked' : ''}>
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(u.nome)} <span class="font-mono text-xs font-normal text-slate-500 dark:text-neutral-400">· ${esc(u.id)}</span></span>
              <span class="flex flex-wrap gap-1 mt-1">${a.perfis.length ? a.perfis.map((p) => `<span class="${TAG}">${esc(p.nome)}</span>`).join('') : '<span class="text-xs text-slate-500 dark:text-neutral-400">sem perfil</span>'}</span>
            </span>
          </label>`;
        }).join('')}
      </div>
      <p data-sem-usuario class="hidden text-xs text-slate-500 dark:text-neutral-400">Nenhum usuário com esse nome.</p>
      ${ERRO('usuarioId')}` : `
      <div class="text-center py-6 text-sm text-slate-500 dark:text-neutral-400">
        <p>Todos os usuários já estão vinculados a colaboradores.</p>
        <button type="button" id="btn-ir-criar" class="${BOTAO_PRI} mt-4">${ICONE.escudo} Criar usuário de acesso</button>
      </div>`,
    aoSalvar: (fd) => {
      const usuarioId = fd.get('usuarioId');
      if (!usuarioId) return [{ campo: 'usuarioId', mensagem: 'Escolha um usuário.' }];
      estado.lista = C.vincularUsuario(estado.lista, c.id, usuarioId);
      persistir(); renderColaborador();
      toast(`Usuário "${nomeDe(livres, usuarioId)}" vinculado.`);
    },
  });
  const campoB = form.querySelector('#busca-usuario');
  campoB?.addEventListener('input', () => {
    const termo = C.normalizar(campoB.value);
    let n = 0;
    form.querySelectorAll('[data-usuario-item]').forEach((li) => { const ok = !termo || li.dataset.nome.includes(termo); li.classList.toggle('hidden', !ok); if (ok) n += 1; });
    form.querySelector('[data-sem-usuario]').classList.toggle('hidden', n > 0);
  });
  form.querySelector('#btn-ir-criar')?.addEventListener('click', () => { form.querySelector('[data-fechar-drawer]').click(); abrirDrawerCriarAcesso(); });
}

function abrirDrawerPerfisAcesso() {
  const c = atual();
  const acesso = acessoAtual(c);
  const { form } = drawerFormulario({
    id: 'form-perfis-acesso',
    titulo: 'Perfis do usuário',
    subtitulo: `<strong>${esc(acesso.usuario.nome)}</strong> · a permissão efetiva é a união dos perfis ativos${acesso.extras ? ` + ${plural(acesso.extras, 'ação extra', 'ações extras')} (só em Perfis de acesso)` : ''}.`,
    rotulo: 'Salvar perfis',
    largura: 'max-w-lg',
    corpo: listaPerfis(acesso.usuario.perfis),
    aoSalvar: (fd) => {
      const perfis = fd.getAll('perfis');
      C.Acesso.definirPerfis(c.acesso.usuarioId, perfis);
      renderColaborador();
      toast(perfis.length ? `${plural(perfis.length, 'perfil', 'perfis')} no usuário.` : 'Usuário sem perfis — não acessa nada.');
    },
  });
  ligarBuscaPerfis(form);
}

function confirmarBloqueio() {
  const c = atual();
  const acesso = acessoAtual(c);
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800">
      <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Bloquear acesso</h3>
    </div>
    <div class="px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 space-y-2">
      <p>Remover todos os perfis${acesso.extras ? ' e permissões extras' : ''} de <strong>${esc(acesso.usuario.nome)}</strong>?</p>
      <p class="text-slate-500 dark:text-neutral-400">O usuário continua existindo, sem acesso a nenhum portal. Para liberar de novo, use "Perfis do usuário".</p>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
      <button type="button" id="btn-confirmar" class="${BOTAO_PERIGO}">Bloquear</button>
    </div>`);
  root.querySelector('#btn-confirmar').addEventListener('click', () => {
    C.Acesso.bloquear(c.acesso.usuarioId);
    fecharModal(); renderColaborador();
    toast(`Acesso de "${acesso.usuario.nome}" bloqueado.`);
  });
}

function desvincularAcesso() {
  const c = atual();
  estado.lista = C.vincularUsuario(estado.lista, c.id, null);
  persistir(); renderColaborador();
  toast('Usuário desvinculado — ele continua existindo em Perfis de acesso.');
}

// ---------- Boot ----------

(function iniciar() {
  if (MODO === 'lista') {
    const antigo = parametroUrl('colaborador');
    if (antigo) { location.replace(`colaborador.html?id=${encodeURIComponent(antigo)}`); return; }
    renderLista();
    return;
  }
  const id = parametroUrl('id');
  if (!id || !C.porId(estado.lista, id)) { location.replace('colaboradores.html'); return; }
  estado.selecionado = id;
  renderColaborador();
})();
