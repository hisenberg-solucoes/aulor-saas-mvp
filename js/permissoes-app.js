// ============================================================
// UI de gestão do permissionamento. Toda operação passa pelo
// motor (Permissoes.*) — a UI apenas reflete o resultado.
// Visual: Ficha em cartões (DESIGN.md), como clientes e turmas:
// classes claras com o par dark: ao lado nas constantes abaixo.
// ============================================================

const STORAGE_KEY = 'aulor-v1-permissionamento-v6';

// Páginas: perfis.html (lista + matrizes + validação) e perfil.html?id= (detalhe,
// body[data-modo="detalhe"]). O mesmo app.js atende às duas pelo MODO.
const MODO = document.body.dataset.modo === 'detalhe' ? 'detalhe' : 'lista';
const URL_LISTA = 'perfis.html';
const urlDetalhe = (id) => `perfil.html?id=${encodeURIComponent(id)}`;
const parametroUrl = (nome) => new URLSearchParams(location.search).get(nome);

const estado = {
  perfilSelecionadoId: null, // nenhum perfil pré-selecionado ao entrar na tela
  aba: 'permissoes', // 'permissoes' | 'usuarios'
  portalAtivo: PORTAIS[0]?.id ?? null,
  busca: '',
  modulosAbertos: new Set(MODULOS.map((m) => m.id)), // todos abertos por padrão

  usuarioInspecionadoId: null, // validação abre sem usuário pré-selecionado
  buscaUsuarios: '',
  filtroUsuarios: 'todos', // 'todos' | 'incluidos' | 'fora'
  visao: 'perfis', // 'perfis' | 'matriz-permissoes' | 'matriz-usuarios' | 'validacao' (só na lista)
  buscaLista: '',
  statusLista: 'todos', // 'todos' | 'ativos' | 'inativos'
  buscaMatriz: '',
  buscaMatrizUsuarios: '',
  usuarioExtrasId: null, // usuário com o modal de permissões extras aberto
  buscaExtras: '',
  perfisVisiveis: null, // null = todas as colunas; Set de ids = seleção nas matrizes
  buscaColunas: '',
  buscaPerfilLista: '',
  buscaEscolha: '',
  buscaUsuarioValidacao: '',
};

// Perfis exibidos como colunas nas visões de matriz.
function perfisExibidos() {
  if (!estado.perfisVisiveis) return PERFIS;
  return PERFIS.filter((p) => estado.perfisVisiveis.has(p.id));
}

// ---------- Persistência ----------

function salvar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ perfis: PERFIS, usuarios: USUARIOS }));
}

function carregar() {
  const bruto = localStorage.getItem(STORAGE_KEY);
  if (!bruto) return;
  try {
    const snapshot = JSON.parse(bruto);
    if (Array.isArray(snapshot.perfis)) PERFIS.splice(0, PERFIS.length, ...snapshot.perfis);
    if (Array.isArray(snapshot.usuarios)) USUARIOS.splice(0, USUARIOS.length, ...snapshot.usuarios);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// ---------- Helpers de apresentação ----------

function esc(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

// Traços dos ícones (Heroicons outline).
const D = {
  mais: 'M12 4.5v15m7.5-7.5h-15',
  busca: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
  baixo: 'M19.5 8.25l-7.5 7.5-7.5-7.5',
  cima: 'M4.5 15.75l7.5-7.5 7.5 7.5',
  direita: 'M8.25 4.5l7.5 7.5-7.5 7.5',
  check: 'M4.5 12.75l6 6 9-13.5',
  fechar: 'M6 18L18 6M6 6l12 12',
  expandir: 'M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9',
  recolher: 'M4.5 15.75l7.5-7.5 7.5 7.5',
  copiar: 'M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-7.5a2.25 2.25 0 012.25-2.25h6z',
  lixo: 'M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0',
  tela: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25',
  acao: 'M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59',
  usuarios: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
};

function icone(d, classe = 'h-4 w-4', traco = 1.75) {
  return `<svg class="${classe} shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="${traco}" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="${d}" /></svg>`;
}

const BOTAO_PRI = 'inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold whitespace-nowrap bg-petrol-800 hover:bg-petrol-900 text-white dark:bg-areia dark:hover:bg-white dark:text-petrol-800 shadow-sm transition';
const BOTAO_SEC = 'inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium whitespace-nowrap border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition disabled:opacity-40 disabled:pointer-events-none';
const BOTAO_PERIGO = 'inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold whitespace-nowrap bg-red-600 hover:bg-red-700 text-white shadow-sm transition';
const BOTAO_CANCELAR = 'inline-flex items-center h-9 px-3.5 rounded-lg text-sm font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition';
const BOTAO_FANTASMA = 'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm font-medium whitespace-nowrap text-slate-500 dark:text-neutral-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition disabled:opacity-40 disabled:pointer-events-none';
const BOTAO_FANTASMA_FUNDO = BOTAO_FANTASMA.replace('text-slate-500', 'text-slate-600'); // fantasma direto sobre o fundo (6,93:1)
const BOTAO_ICONE = 'inline-grid place-items-center h-8 w-8 rounded-md text-slate-500 dark:text-neutral-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition';
const CAMPO = 'h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 text-sm text-slate-700 dark:text-neutral-200 placeholder:text-slate-500 dark:placeholder:text-neutral-400 transition focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400 focus:ring-2 focus:ring-petrol-800/20 dark:focus:ring-sky-400/20 aria-[invalid=true]:border-red-500';
const CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)]';
const POPOVER = 'absolute top-full mt-1 rounded-[10px] border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-[0_12px_32px_-12px_rgba(0,0,0,.28)] p-1.5';
const ITEM_POPOVER = 'w-full flex items-center gap-2 px-2 rounded-md text-left text-sm transition hover:bg-slate-100 dark:hover:bg-neutral-900';
const BARRA = 'flex-none mb-4 flex flex-wrap items-center gap-2';
const LINK = 'font-medium text-petrol-800 dark:text-sky-300 hover:underline underline-offset-2';
const APOIO = 'text-slate-500 dark:text-neutral-400'; // rótulo, subtítulo e vazio (4,76:1 no cartão)
const APOIO_FUNDO = 'text-slate-600 dark:text-neutral-400'; // o mesmo papel direto sobre o fundo (6,93:1; o slate-500 dá 4,36:1)
const TITULO = 'text-slate-900 dark:text-neutral-100';
const VALOR = 'text-slate-800 dark:text-neutral-100';
const COBRE_TINTA = 'text-[color:var(--f-cobre-tinta)]'; // "é com você": cobre como texto, nos dois modos
const THEAD = 'text-xs font-medium text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900';
const LINHA_HOVER = 'hover:bg-slate-50 dark:hover:bg-neutral-900';
const PILULA = {
  neutra: 'bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-400',
  extra: 'bg-petrol-800/10 text-petrol-900 dark:bg-sky-950/60 dark:text-sky-200',
};
// Chips de ação: liberada em seleção petróleo com ✓ (Chips do DESIGN), livre em contorno.
const CHIP = 'inline-flex items-center gap-1 h-7 px-2.5 rounded-md border text-[12.5px] font-medium transition';
const CHIP_LIGADO = 'bg-petrol-800/10 border-petrol-800/40 text-petrol-900 hover:border-petrol-800 dark:bg-sky-950/60 dark:border-sky-400/40 dark:text-sky-200 dark:hover:border-sky-400';
const CHIP_LIVRE = 'bg-white border-slate-300 text-slate-600 hover:border-petrol-800 hover:text-petrol-800 dark:bg-neutral-950 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-sky-400 dark:hover:text-sky-300';
const CHECK = icone(D.check, 'h-3.5 w-3.5 text-petrol-800 dark:text-sky-300', 2.5);

function pilula(classe, texto, titulo = '') {
  return `<span ${titulo ? `title="${esc(titulo)}"` : ''} class="pilula inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ${classe}">${esc(texto)}</span>`;
}

const PILULA_INATIVO = pilula(PILULA.neutra, 'Inativo', 'Perfil inativo: não concede nada até ser reativado');

function campoBusca(id, valor, placeholder, largura = 'w-72') {
  return `
    <div class="relative ${largura}">
      ${icone(D.busca, 'h-4 w-4 text-slate-400 dark:text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none', 2)}
      <input id="${id}" type="search" value="${esc(valor)}" placeholder="${esc(placeholder)}" autocomplete="off" aria-label="${esc(placeholder)}" class="${CAMPO} w-full pl-8">
    </div>`;
}

// Controle segmentado (portais, filtros), igual às partes de aba de Turmas: trilho em etiqueta, ativo em elevado.
function segmentado(opcoes, ativo, atributo, rotulo) {
  return `
    <div class="inline-flex shrink-0 rounded-lg bg-[color:var(--f-etiqueta)] p-0.5" role="group" aria-label="${esc(rotulo)}">
      ${opcoes.map((o) => `
        <button type="button" ${atributo}="${o.id}" aria-pressed="${o.id === ativo}"
          class="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[12.5px] font-medium whitespace-nowrap transition
            ${o.id === ativo ? 'bg-[color:var(--f-elevado)] text-[color:var(--f-tinta)] shadow-[0_1px_2px_rgb(7_30_44/0.08)]' : 'text-[color:var(--f-tinta-2)] hover:text-[color:var(--f-tinta)]'}">
          ${esc(o.rotulo)}${o.contagem === undefined ? '' : `<span class="ml-0.5 text-xs tabular-nums text-[color:var(--f-tinta-3)]">${o.contagem}</span>`}
        </button>`).join('')}
    </div>`;
}

// Abas sublinhadas em marca-tinta, como em todas as fichas em cartões.
function abasHtml(abas, ativa, atributo, rotulo) {
  return `
    <div role="tablist" aria-label="${esc(rotulo)}" class="flex-none mb-4 shadow-[inset_0_-1px_0] shadow-slate-200 dark:shadow-neutral-800 flex items-center gap-4">
      ${abas.map((aba) => `
        <button type="button" role="tab" ${atributo}="${aba.id}" aria-selected="${aba.id === ativa}"
          class="px-0.5 pb-2.5 text-sm border-b-2 transition whitespace-nowrap ${aba.id === ativa ? 'border-[color:var(--f-marca-tinta)] text-slate-900 dark:text-neutral-100 font-medium' : 'border-transparent text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'}">
          ${aba.rotulo}${aba.contagem === undefined ? '' : `<span class="ml-1 text-xs text-slate-600 dark:text-neutral-400 tabular-nums">${aba.contagem}</span>`}
        </button>`).join('')}
    </div>`;
}

// Cabeçalho de cartão: título, frase de contexto e ações fantasma à direita; sem divisória.
function cabecalhoCartao(titulo, subtitulo, acoesHtml = '') {
  return `
    <div class="px-4 pt-4 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="font-display text-[15px] leading-[22px] font-semibold ${TITULO}">${titulo}</h3>
        ${subtitulo ? `<p class="mt-0.5 text-xs ${APOIO}">${subtitulo}</p>` : ''}
      </div>
      ${acoesHtml ? `<div class="-mt-1 -mr-1.5 flex shrink-0 items-center gap-1">${acoesHtml}</div>` : ''}
    </div>`;
}

// Cartão de estado vazio (filtro sem resultado, nada selecionado).
function cartaoVazio(html) {
  return `<div class="${CARTAO} px-4 py-10 text-center text-sm ${APOIO}">${html}</div>`;
}

const CORES_AVATAR = [
  'bg-petrol-800/10 text-petrol-800 dark:bg-sky-950/60 dark:text-sky-300',
  'bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-300',
];

function corAvatar(id) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return CORES_AVATAR[hash % CORES_AVATAR.length];
}

function iniciais(nome) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase();
}

function avatarHtml(usuario, tamanho = 'h-6 w-6 text-[10px]') {
  return `<span class="${tamanho} ${corAvatar(usuario.id)} shrink-0 rounded-full grid place-items-center font-semibold" title="${esc(usuario.nome)}" aria-hidden="true">${iniciais(usuario.nome)}</span>`;
}

function membrosDoPerfil(perfilId) {
  return USUARIOS.filter((u) => u.perfis.includes(perfilId));
}

// Cobre = "é com você": usuário que existe mas não acessa nada.
const TAG_SEM_PERFIL = `<span class="shrink-0 rounded px-1.5 text-[11.5px] leading-5 font-semibold ${COBRE_TINTA} bg-laranja/15">sem perfil</span>`;

// ---------- Toasts ----------

// Contraste máximo do modo (ficha-inverso): azul profundo com areia no claro, o contrário no escuro.
function toast(mensagem, tipo = 'ok') {
  const ponto = { ok: 'bg-[color:var(--f-bom)]', alerta: 'bg-[color:var(--f-aviso)]', erro: 'bg-[color:var(--f-ruim)]' };
  const item = document.createElement('div');
  item.className = 'toast-anim ficha-inverso flex items-center gap-2.5 max-w-sm rounded-lg bg-[color:var(--f-papel)] text-[color:var(--f-tinta)] text-sm px-3.5 py-2.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,.35)]';
  item.innerHTML = `<span class="h-2 w-2 shrink-0 rounded-full ${ponto[tipo]}"></span><span></span>`;
  item.lastChild.textContent = mensagem;
  document.getElementById('toast-root').appendChild(item);
  setTimeout(() => item.remove(), 3500);
}

// ---------- Modal ----------

let focoAntesDoModal = null;

// O conteúdo traz as próprias seções (cabeçalho, corpo, rodapé), como os modais de contratos e turmas.
function abrirModal(conteudoHtml, { largura = 'max-w-md', rotulo = '' } = {}) {
  const root = document.getElementById('modal-root');
  if (!root.innerHTML) focoAntesDoModal = document.activeElement;
  root.innerHTML = `
    <div class="fixed inset-0 z-40 flex items-start justify-center p-4 pt-[12vh]">
      <div class="absolute inset-0 bg-slate-900/50 dark:bg-black/70" data-fechar-modal></div>
      <div role="dialog" aria-modal="true" aria-label="${esc(rotulo)}"
        class="modal-anim relative w-full ${largura} flex flex-col max-h-[76vh] overflow-hidden bg-white dark:bg-neutral-950 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-[0_24px_60px_-20px_rgba(0,0,0,.4)] text-sm ${VALOR}">${conteudoHtml}</div>
    </div>`;
  root.querySelector('[data-fechar-modal]').addEventListener('click', fecharModal);
  root.querySelector('input, button')?.focus();
}

function fecharModal() {
  estado.usuarioExtrasId = null;
  const root = document.getElementById('modal-root');
  if (!root.innerHTML) return;
  root.innerHTML = '';
  if (focoAntesDoModal?.isConnected) focoAntesDoModal.focus();
  focoAntesDoModal = null;
}

const POPOVERS = [
  { popover: 'popover-colunas', gatilho: 'seletor-colunas' },
  { popover: 'popover-perfil', gatilho: 'seletor-perfil-atual' },
  { popover: 'popover-usuario-validacao', gatilho: 'seletor-usuario-validacao' },
];

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    fecharModal();
    POPOVERS.forEach(({ popover }) => document.getElementById(popover)?.classList.add('hidden'));
  }
});

// Fecha os popovers ao clicar fora deles.
document.addEventListener('click', (e) => {
  POPOVERS.forEach(({ popover, gatilho }) => {
    const el = document.getElementById(popover);
    if (el && !el.classList.contains('hidden') && !e.target.closest(`#${gatilho}`)) {
      el.classList.add('hidden');
    }
  });
});

function cabecalhoModal(titulo, subtitulo) {
  return `
    <h3 class="font-display text-base font-semibold ${TITULO}">${titulo}</h3>
    ${subtitulo ? `<p class="mt-1 ${APOIO}">${subtitulo}</p>` : ''}`;
}

const MODAL_TOPO = 'px-5 py-4 border-b border-slate-200 dark:border-neutral-800';
const MODAL_RODAPE = 'px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2';

function confirmar({ titulo, mensagem, rotulo, aoConfirmar, tom = 'perigo' }) {
  abrirModal(`
    <div class="px-5 pt-5 pb-4">${cabecalhoModal(esc(titulo), esc(mensagem))}</div>
    <div class="${MODAL_RODAPE}">
      <button type="button" data-cancelar class="${BOTAO_CANCELAR}">Voltar</button>
      <button type="button" data-confirmar class="${tom === 'perigo' ? BOTAO_PERIGO : BOTAO_PRI}">${esc(rotulo)}</button>
    </div>`, { rotulo: titulo });
  const root = document.getElementById('modal-root');
  root.querySelector('[data-cancelar]').addEventListener('click', fecharModal);
  root.querySelector('[data-confirmar]').addEventListener('click', () => {
    fecharModal();
    aoConfirmar();
  });
}

// Modal de um campo de nome (criar e duplicar perfil).
function abrirModalNome({ titulo, subtitulo, rotuloCampo, valor = '', placeholder = '', rotuloBotao, aoSalvar }) {
  abrirModal(`
    <div class="px-5 pt-5 pb-4">
      ${cabecalhoModal(titulo, subtitulo)}
      <label class="block mt-4">
        <span class="block text-xs font-medium ${APOIO} mb-1">${esc(rotuloCampo)}</span>
        <input data-campo-nome type="text" value="${esc(valor)}" placeholder="${esc(placeholder)}" autocomplete="off"
          aria-describedby="erro-modal-nome" class="${CAMPO} w-full">
      </label>
      <p id="erro-modal-nome" class="hidden mt-1.5 text-xs text-red-700 dark:text-red-400" role="alert"></p>
    </div>
    <div class="${MODAL_RODAPE}">
      <button type="button" data-cancelar class="${BOTAO_CANCELAR}">Cancelar</button>
      <button type="button" data-salvar class="${BOTAO_PRI}">${esc(rotuloBotao)}</button>
    </div>`, { rotulo: titulo });

  const root = document.getElementById('modal-root');
  const input = root.querySelector('[data-campo-nome]');
  const erro = root.querySelector('#erro-modal-nome');

  const enviar = () => {
    const resultado = aoSalvar(input.value);
    if (resultado.erro) {
      erro.textContent = resultado.erro;
      erro.classList.remove('hidden');
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    salvar();
    fecharModal();
    location.href = urlDetalhe(resultado.perfil.id);
  };

  root.querySelector('[data-cancelar]').addEventListener('click', fecharModal);
  root.querySelector('[data-salvar]').addEventListener('click', enviar);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') enviar();
  });
  input.focus();
  input.select();
}

function abrirModalNovoPerfil() {
  abrirModalNome({
    titulo: 'Novo perfil de acesso',
    subtitulo: 'O perfil é criado sem nenhuma permissão — ative as ações em seguida.',
    rotuloCampo: 'Nome do perfil',
    placeholder: 'Ex.: Secretaria acadêmica',
    rotuloBotao: 'Criar perfil',
    aoSalvar: (nome) => Permissoes.criarPerfil(nome),
  });
}

function abrirModalDuplicarPerfil(perfilOrigem) {
  abrirModalNome({
    titulo: `Duplicar perfil "${esc(perfilOrigem.nome)}"`,
    subtitulo: `Todas as permissões serão copiadas. Os usuários vinculados <strong class="font-medium ${VALOR}">não</strong> são copiados.`,
    rotuloCampo: 'Nome do novo perfil',
    valor: `Cópia de ${perfilOrigem.nome}`,
    rotuloBotao: 'Duplicar perfil',
    aoSalvar: (nome) => Permissoes.duplicarPerfil(perfilOrigem.id, nome),
  });
}

// ---------- Componentes ----------

// Interruptor: ligado em marca com bolinha sobre-marca (petróleo/areia; areia/petróleo no escuro),
// desligado em branco com contorno e bolinha na cor de rótulo.
function switchHtml(ligado, atributos, titulo, tamanho = 'normal') {
  const [trilho, botao, desloca] = tamanho === 'mini'
    ? ['h-4 w-[26px]', 'h-3 w-3', 'translate-x-2.5']
    : ['h-5 w-9', 'h-4 w-4', 'translate-x-4'];
  return `
    <button type="button" role="switch" aria-checked="${ligado}" ${atributos} title="${esc(titulo)}" aria-label="${esc(titulo)}"
      class="relative inline-flex ${trilho} shrink-0 rounded-full align-middle transition-colors ${ligado ? 'bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white' : 'bg-white dark:bg-neutral-950 ring-1 ring-inset ring-slate-300 dark:ring-neutral-700 hover:ring-slate-500 dark:hover:ring-neutral-500'}">
      <span class="absolute top-0.5 left-0.5 ${botao} rounded-full transition-transform ${ligado ? `${desloca} bg-areia dark:bg-petrol-800` : 'bg-slate-500 dark:bg-neutral-400'}"></span>
    </button>`;
}

function miniSwitchHtml(ligado, atributos, titulo = '') {
  return switchHtml(ligado, atributos, titulo, 'mini');
}

// ---------- Resumo e alternador de visões (perfis.html) ----------

function renderResumo() {
  const el = document.getElementById('resumo-perfis');
  if (!el) return;
  const ativos = PERFIS.filter((p) => p.ativo).length;
  const semPerfil = USUARIOS.filter((u) => !u.perfis.length).length;
  const link = (visao, texto, cor = 'text-slate-700 dark:text-neutral-200') => `<button type="button" data-ir-visao="${visao}" class="font-medium hover:underline underline-offset-2 ${cor}">${texto}</button>`;
  el.innerHTML = `
    <span>${link('perfis', plural(PERFIS.length, 'perfil', 'perfis'))}${PERFIS.length ? `, ${ativos === PERFIS.length ? (ativos === 1 ? 'ativo' : 'todos ativos') : `${ativos} ${ativos === 1 ? 'ativo' : 'ativos'}`}` : ''}</span>
    <span>${link('matriz-usuarios', plural(USUARIOS.length, 'usuário', 'usuários'))}</span>
    ${semPerfil ? `<span>${link('matriz-usuarios', `${semPerfil} sem perfil`, COBRE_TINTA)} não ${semPerfil === 1 ? 'acessa' : 'acessam'} nada</span>` : ''}`;
}

const VISOES = [
  { id: 'perfis', rotulo: 'Perfis' },
  { id: 'matriz-permissoes', rotulo: 'Permissões × perfis' },
  { id: 'matriz-usuarios', rotulo: 'Usuários × perfis' },
  { id: 'validacao', rotulo: 'Validar acesso' },
];

function renderTrocaVisao() {
  const container = document.getElementById('troca-visao');
  const abas = VISOES.map((v) => (v.id === 'perfis' ? { ...v, contagem: PERFIS.length } : v));
  container.innerHTML = abasHtml(abas, estado.visao, 'data-visao', 'Visões');
  container.querySelectorAll('[data-visao]').forEach((el) => {
    el.addEventListener('click', () => irParaVisao(el.dataset.visao));
  });
}

function irParaVisao(visao) {
  estado.visao = visao;
  if (estado.visao !== 'validacao') estado.usuarioInspecionadoId = null; // validação sempre abre sem usuário
  renderTudo();
}

// ---------- Seletor do perfil atual (popover na trilha do detalhe) ----------

function htmlListaPerfilPopover() {
  const termo = estado.buscaPerfilLista.trim().toLowerCase();
  const perfis = PERFIS.filter((p) => !termo || p.nome.toLowerCase().includes(termo));
  if (!perfis.length) {
    return `<p class="text-xs ${APOIO} px-2 py-3 text-center">Nenhum perfil encontrado.</p>`;
  }
  return perfis.map((perfil) => {
    const membros = membrosDoPerfil(perfil.id).length;
    const selecionado = perfil.id === estado.perfilSelecionadoId;
    return `
      <button type="button" data-escolher-perfil="${perfil.id}" class="${ITEM_POPOVER} h-8 ${selecionado ? 'bg-slate-100 dark:bg-neutral-900' : ''}">
        <span class="flex-1 min-w-0 truncate ${perfil.ativo ? VALOR : APOIO}">${esc(perfil.nome)}${perfil.ativo ? '' : ' (inativo)'}</span>
        <span class="text-xs ${APOIO} shrink-0 tabular-nums">${plural(membros, 'usuário', 'usuários')}</span>
        ${selecionado ? CHECK : '<span class="w-3.5"></span>'}
      </button>`;
  }).join('');
}

// ---------- Lista de perfis (perfis.html) ----------

function perfisFiltrados() {
  const termo = estado.buscaLista.trim().toLowerCase();
  return PERFIS.filter((p) => {
    if (termo && !p.nome.toLowerCase().includes(termo)) return false;
    if (estado.statusLista === 'ativos' && !p.ativo) return false;
    if (estado.statusLista === 'inativos' && p.ativo) return false;
    return true;
  });
}

function contagemPermissoes(perfil) {
  const telas = FEATURES.filter((f) => (perfil.permissoes[f.id] || []).includes('visualizar')).length;
  const acoes = Object.values(perfil.permissoes || {}).reduce((n, lista) => n + lista.length, 0);
  return { telas, acoes };
}

function renderListaPerfis() {
  const container = document.getElementById('lista-perfis');

  // Nenhum perfil cadastrado: convite direto para criar o primeiro.
  if (!PERFIS.length) {
    container.innerHTML = cartaoVazio(`
      <p class="font-display text-[15px] font-semibold ${TITULO}">Nenhum perfil de acesso ainda</p>
      <p class="mt-1 max-w-md mx-auto">Os perfis definem o que cada grupo de usuários pode ver e fazer no sistema. Comece criando o primeiro.</p>
      <button type="button" data-criar-primeiro class="${BOTAO_PRI} mt-4">${icone(D.mais, 'h-4 w-4', 2)} Criar primeiro perfil</button>`);
    container.querySelector('[data-criar-primeiro]').addEventListener('click', abrirModalNovoPerfil);
    return;
  }

  const ativos = PERFIS.filter((p) => p.ativo).length;
  const opcoesStatus = [
    { id: 'todos', rotulo: 'Todos', contagem: PERFIS.length },
    { id: 'ativos', rotulo: 'Ativos', contagem: ativos },
    { id: 'inativos', rotulo: 'Inativos', contagem: PERFIS.length - ativos },
  ];

  container.innerHTML = `
    <div class="${BARRA}">
      ${campoBusca('busca-lista', estado.buscaLista, 'Buscar perfil pelo nome…')}
      ${segmentado(opcoesStatus, estado.statusLista, 'data-status-lista', 'Status')}
    </div>
    <div id="tabela-perfis"></div>`;

  const atualizar = () => {
    container.querySelector('#tabela-perfis').innerHTML = htmlTabelaPerfis(perfisFiltrados());
  };
  const busca = container.querySelector('#busca-lista');
  busca.addEventListener('input', () => { estado.buscaLista = busca.value; atualizar(); });
  container.querySelectorAll('[data-status-lista]').forEach((el) => {
    el.addEventListener('click', () => { estado.statusLista = el.dataset.statusLista; renderListaPerfis(); });
  });

  container.querySelector('#tabela-perfis').addEventListener('click', (e) => {
    if (e.target.closest('[data-limpar-filtros]')) {
      estado.buscaLista = '';
      estado.statusLista = 'todos';
      renderListaPerfis();
      return;
    }
    // O nome é o link (teclado, ⌘-clique); o resto da linha abre o mesmo perfil, a não ser que a pessoa esteja selecionando texto.
    if (e.target.closest('a, button') || getSelection().toString()) return;
    const linha = e.target.closest('[data-abrir]');
    if (linha) location.href = urlDetalhe(linha.dataset.abrir);
  });

  atualizar();
}

// Até três avatares dos membros e a contagem.
function htmlPilhaMembros(membros) {
  if (!membros.length) return `<span class="${APOIO}">Ninguém</span>`;
  return `
    <span class="inline-flex items-center gap-2">
      <span class="flex -space-x-1">${membros.slice(0, 3).map((u) => avatarHtml(u, 'h-6 w-6 text-[10px] ring-2 ring-white dark:ring-neutral-950')).join('')}</span>
      <span class="tabular-nums">${membros.length}</span>
    </span>`;
}

function htmlCobertura(n, total) {
  const pct = total ? Math.round((n / total) * 100) : 0;
  return `
    <span class="inline-flex items-center gap-2.5 tabular-nums">
      <span>${n} <span class="${APOIO}">de ${total}</span></span>
      <span class="h-1.5 w-14 rounded-full bg-[color:var(--f-etiqueta)] overflow-hidden" aria-hidden="true"><span class="block h-full rounded-full bg-petrol-950 dark:bg-areia" style="width:${pct}%"></span></span>
    </span>`;
}

// Tabela de borda a borda dentro do cartão; ativo é o comum e não aparece, inativo vira pílula e a linha apaga (menos a pílula).
function htmlTabelaPerfis(perfis) {
  const filtrando = perfis.length !== PERFIS.length;
  const th = 'px-4 py-2.5';
  const td = 'px-4 py-2.5 text-sm text-slate-600 dark:text-neutral-300';
  return `
    <div class="${CARTAO} overflow-hidden">
      <table class="w-full text-left">
        <thead class="${THEAD} border-b border-slate-200 dark:border-neutral-800">
          <tr>
            <th scope="col" class="${th}">Perfil</th>
            <th scope="col" class="${th} w-[180px]">Usuários</th>
            <th scope="col" class="${th} w-[200px]" title="Telas com a ação Visualizar liberada">Telas liberadas</th>
            <th scope="col" class="${th} w-[140px] text-right">Ações liberadas</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
          ${perfis.length ? perfis.map((p) => {
            const { telas, acoes } = contagemPermissoes(p);
            return `
              <tr data-abrir="${p.id}" class="cursor-pointer transition ${LINHA_HOVER} ${p.ativo ? '' : 'linha-apagada'}">
                <td class="${th}">
                  <span class="flex items-center gap-2 min-w-0">
                    <a href="${urlDetalhe(p.id)}" class="truncate text-sm font-medium ${VALOR} hover:underline underline-offset-2">${esc(p.nome)}</a>
                    ${p.ativo ? '' : PILULA_INATIVO}
                  </span>
                </td>
                <td class="${td}">${htmlPilhaMembros(membrosDoPerfil(p.id))}</td>
                <td class="${td}">${htmlCobertura(telas, FEATURES.length)}</td>
                <td class="${td} text-right tabular-nums">${acoes}</td>
              </tr>`;
          }).join('') : `
            <tr><td colspan="4" class="px-4 py-10 text-center text-sm ${APOIO}">
              Nenhum perfil encontrado com esse filtro. <button type="button" data-limpar-filtros class="${LINK} ml-1">Limpar filtros</button>
            </td></tr>`}
        </tbody>
      </table>
      <div class="px-4 py-2.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-sm text-slate-700 dark:text-neutral-200 tabular-nums">
        ${filtrando ? `${perfis.length} de ${plural(PERFIS.length, 'perfil', 'perfis')}` : plural(PERFIS.length, 'perfil', 'perfis')}
      </div>
    </div>`;
}

// ---------- Detalhe do perfil ----------

function navPerfilHtml(perfil, d, rotulo) {
  const classe = 'inline-grid place-items-center h-7 w-7 rounded-md border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-500 dark:text-neutral-400';
  return perfil
    ? `<a href="${urlDetalhe(perfil.id)}" class="${classe} transition hover:border-petrol-800 hover:text-petrol-800 dark:hover:border-sky-400 dark:hover:text-sky-300" title="${rotulo}: ${esc(perfil.nome)}" aria-label="${rotulo}">${icone(d, 'h-3.5 w-3.5', 2)}</a>`
    : `<span class="${classe} opacity-40" aria-hidden="true">${icone(d, 'h-3.5 w-3.5', 2)}</span>`;
}

// Chip do cabeçalho: dado de consulta rápida, sem caixa nem fundo.
function chipHtml(d, conteudo, titulo = '') {
  return `<span ${titulo ? `title="${esc(titulo)}"` : ''} class="inline-flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-neutral-300">${icone(d, 'h-3.5 w-3.5 text-slate-400 dark:text-neutral-500')}<span>${conteudo}</span></span>`;
}

function alternarAtivo(perfil) {
  Permissoes.alternarPerfilAtivo(perfil.id);
  salvar();
  toast(`Perfil "${perfil.nome}" ${perfil.ativo ? 'reativado' : 'inativado'}`, perfil.ativo ? 'ok' : 'alerta');
  renderTudo();
}

function confirmarExclusaoPerfil(perfil, membros) {
  confirmar({
    titulo: `Excluir o perfil "${perfil.nome}"?`,
    mensagem: membros.length
      ? `${membros.length === 1 ? '1 usuário perderá' : `${membros.length} usuários perderão`} as permissões concedidas por este perfil. Esta ação não pode ser desfeita.`
      : 'Nenhum usuário está vinculado a este perfil. Esta ação não pode ser desfeita.',
    rotulo: 'Excluir perfil',
    aoConfirmar: () => {
      Permissoes.excluirPerfil(perfil.id);
      salvar();
      location.href = URL_LISTA;
    },
  });
}

function irParaAbaDetalhe(id) {
  estado.aba = id;
  const url = new URL(location.href);
  if (id === 'permissoes') url.searchParams.delete('aba'); else url.searchParams.set('aba', id);
  history.replaceState(null, '', url);
  renderDetalhe();
}

function renderDetalhe() {
  const container = document.getElementById('detalhe-perfil');
  const perfil = Permissoes.getPerfil(estado.perfilSelecionadoId);

  if (!perfil) {
    location.replace(URL_LISTA);
    return;
  }

  const membros = membrosDoPerfil(perfil.id);
  const { telas: telasLiberadas, acoes: totalAcoes } = contagemPermissoes(perfil);
  const indice = PERFIS.indexOf(perfil);
  const sep = '<span aria-hidden="true">/</span>';
  const linkTrilha = 'hover:text-petrol-800 dark:hover:text-sky-300 transition';

  // Uma ação à vista (Duplicar); inativar e excluir no "Mais", com o efeito de cada um na segunda linha.
  const itensMais = [
    perfil.ativo
      ? { nome: 'Inativar perfil', detalhe: 'Suspende as permissões sem perder a configuração', acao: () => alternarAtivo(perfil) }
      : { nome: 'Reativar perfil', detalhe: 'As permissões voltam a valer para os usuários', acao: () => alternarAtivo(perfil) },
    'sep',
    { nome: 'Excluir perfil', perigo: true, detalhe: membros.length ? `${plural(membros.length, 'usuário perde', 'usuários perdem')} estas permissões` : 'Nenhum usuário vinculado', acao: () => confirmarExclusaoPerfil(perfil, membros) },
  ];

  container.innerHTML = `
    <nav aria-label="Trilha" class="mb-3 flex items-center gap-1.5 text-sm ${APOIO_FUNDO}">
      <a href="home.html" class="${linkTrilha}">Home</a>
      ${sep}
      <a href="${URL_LISTA}" class="${linkTrilha}">Perfis de acesso</a>
      ${sep}
      <div class="relative min-w-0" id="seletor-perfil-atual">
        <button type="button" id="btn-perfil-atual" title="Trocar de perfil" aria-haspopup="true" aria-expanded="false" aria-current="page"
          class="inline-flex items-center gap-1 max-w-xs h-7 -mx-1.5 px-1.5 rounded-md font-medium text-slate-800 dark:text-neutral-100 transition hover:bg-white dark:hover:bg-neutral-900">
          <span class="truncate">${esc(perfil.nome)}</span>${icone(D.baixo, 'h-3.5 w-3.5 text-slate-400 dark:text-neutral-500', 2)}
        </button>
        <div id="popover-perfil" class="hidden ${POPOVER} left-0 w-80 z-40">
          <input id="busca-perfil-lista" type="search" value="${esc(estado.buscaPerfilLista)}" placeholder="Buscar perfil…" autocomplete="off" aria-label="Buscar perfil"
            class="${CAMPO} w-full">
          <div id="lista-perfil-popover" class="max-h-64 overflow-y-auto mt-1.5">${htmlListaPerfilPopover()}</div>
        </div>
      </div>
      <span class="flex-1"></span>
      <span class="tabular-nums">${indice + 1} de ${PERFIS.length}</span>
      <span class="flex gap-1">
        ${navPerfilHtml(PERFIS[indice - 1], D.cima, 'Perfil anterior')}
        ${navPerfilHtml(PERFIS[indice + 1], D.baixo, 'Próximo perfil')}
      </span>
    </nav>

    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1 basis-80 flex items-start gap-3">
        <div class="h-12 w-12 shrink-0 rounded-xl bg-petrol-800/10 dark:bg-sky-950/60 text-petrol-800 dark:text-sky-300 grid place-items-center font-display font-semibold" aria-hidden="true">${esc(iniciais(perfil.nome))}</div>
        <div class="min-w-0 flex-1">
          <h2 class="font-registro text-[26px] leading-[1.15] font-semibold tracking-[-0.01em] ${TITULO}">${esc(perfil.nome)}</h2>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
            ${chipHtml(D.tela, `<span class="tabular-nums">${telasLiberadas} de ${FEATURES.length}</span> telas liberadas`, 'Telas com a ação Visualizar liberada')}
            ${chipHtml(D.acao, `<span class="tabular-nums">${plural(totalAcoes, 'ação liberada', 'ações liberadas')}</span>`)}
            ${chipHtml(D.usuarios, `<span class="tabular-nums">${plural(membros.length, 'usuário', 'usuários')}</span>`)}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button type="button" id="btn-duplicar" title="Copia as permissões para um perfil novo, sem os usuários" class="${BOTAO_SEC}">${icone(D.copiar)} Duplicar</button>
        <button type="button" id="btn-mais" class="${BOTAO_SEC}" aria-haspopup="menu" aria-expanded="false">Mais ${icone(D.baixo, 'h-3.5 w-3.5', 2)}</button>
      </div>
    </div>

    ${perfil.ativo ? '' : `
      <div class="mb-4 flex items-center gap-3 rounded-lg px-4 py-3 text-sm bg-slate-200/70 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300">
        <p class="min-w-0 flex-1"><span class="font-medium">Perfil inativo</span> — as permissões abaixo estão suspensas e voltam a valer quando o perfil for reativado.</p>
        <button type="button" data-reativar class="shrink-0 font-medium hover:underline underline-offset-2">Reativar perfil</button>
      </div>`}

    ${abasHtml([
      { id: 'permissoes', rotulo: 'Permissões' },
      { id: 'usuarios', rotulo: 'Usuários', contagem: membros.length },
    ], estado.aba, 'data-aba', 'Seções do perfil')}

    ${estado.aba === 'permissoes' ? htmlAbaPermissoes() : htmlAbaUsuarios(perfil, membros)}`;

  // --- eventos do detalhe ---

  const popoverPerfil = container.querySelector('#popover-perfil');
  const botaoPerfil = container.querySelector('#btn-perfil-atual');
  botaoPerfil.addEventListener('click', () => {
    popoverPerfil.classList.toggle('hidden');
    const aberto = !popoverPerfil.classList.contains('hidden');
    botaoPerfil.setAttribute('aria-expanded', String(aberto));
    if (aberto) popoverPerfil.querySelector('#busca-perfil-lista').focus();
  });

  const buscaPerfilLista = container.querySelector('#busca-perfil-lista');
  buscaPerfilLista.addEventListener('input', () => {
    estado.buscaPerfilLista = buscaPerfilLista.value;
    container.querySelector('#lista-perfil-popover').innerHTML = htmlListaPerfilPopover();
  });

  container.querySelector('#lista-perfil-popover').addEventListener('click', (e) => {
    const opcao = e.target.closest('[data-escolher-perfil]');
    if (!opcao) return;
    if (opcao.dataset.escolherPerfil !== perfil.id) location.href = urlDetalhe(opcao.dataset.escolherPerfil);
  });

  container.querySelector('#btn-duplicar').addEventListener('click', () => abrirModalDuplicarPerfil(perfil));
  container.querySelector('#btn-mais').addEventListener('click', (e) => abrirMenu(e.currentTarget, itensMais));
  container.querySelector('[data-reativar]')?.addEventListener('click', () => alternarAtivo(perfil));

  container.querySelectorAll('[data-aba]').forEach((el) => {
    el.addEventListener('click', () => irParaAbaDetalhe(el.dataset.aba));
  });

  if (estado.aba === 'permissoes') {
    container.querySelectorAll('[data-portal]').forEach((el) => {
      el.addEventListener('click', () => {
        estado.portalAtivo = el.dataset.portal;
        renderDetalhe();
      });
    });

    const inputBusca = container.querySelector('#busca-permissoes');
    inputBusca.addEventListener('input', () => {
      estado.busca = inputBusca.value;
      document.getElementById('container-modulos').innerHTML = htmlModulos(perfil);
      wireModulos(perfil);
    });

    container.querySelector('#btn-expandir-modulos').addEventListener('click', (e) => {
      const expandir = e.currentTarget.dataset.expandir === 'true';
      Permissoes.modulosDoPortal(estado.portalAtivo).forEach((m) => {
        if (expandir) estado.modulosAbertos.add(m.id);
        else estado.modulosAbertos.delete(m.id);
      });
      renderDetalhe();
    });

    wireModulos(perfil);
  }

  if (estado.aba === 'usuarios') {
    const inputBusca = container.querySelector('#busca-usuarios');
    inputBusca.addEventListener('input', () => {
      estado.buscaUsuarios = inputBusca.value;
      document.getElementById('lista-usuarios-perfil').innerHTML = htmlListaUsuarios(perfil);
      wireListaUsuarios(perfil);
    });

    container.querySelectorAll('[data-filtro-usuarios]').forEach((el) => {
      el.addEventListener('click', () => {
        estado.filtroUsuarios = el.dataset.filtroUsuarios;
        renderDetalhe();
      });
    });

    wireListaUsuarios(perfil);
  }
}

function wireListaUsuarios(perfil) {
  document.querySelectorAll('#lista-usuarios-perfil [data-abrir-extras]').forEach((el) => {
    el.addEventListener('click', () => abrirModalExtras(el.dataset.abrirExtras));
  });
  document.querySelectorAll('#lista-usuarios-perfil [data-usuario]').forEach((el) => {
    el.addEventListener('click', () => {
      const usuario = Permissoes.getUsuario(el.dataset.usuario);
      const resultado = Permissoes.alternarUsuarioNoPerfil(usuario.id, perfil.id);
      if (resultado.erro) {
        toast(resultado.erro, 'erro');
        return;
      }
      salvar();
      toast(`${usuario.nome} ${resultado.incluido ? 'incluído(a) no' : 'removido(a) do'} perfil "${perfil.nome}"`, resultado.incluido ? 'ok' : 'alerta');
      renderTudo();
    });
  });
}

// ---------- Aba Permissões (módulos em grupos recolhíveis) ----------

function htmlAbaPermissoes() {
  const perfil = Permissoes.getPerfil(estado.perfilSelecionadoId);
  const todosAbertos = Permissoes.modulosDoPortal(estado.portalAtivo).every((m) => estado.modulosAbertos.has(m.id));
  const portais = PORTAIS.map((portal) => ({
    id: portal.id,
    rotulo: portal.nome,
    contagem: Permissoes.contagemAcoes(perfil, Permissoes.featuresDoPortal(portal.id)).ativas,
  }));
  return `
    <div class="${BARRA}">
      ${segmentado(portais, estado.portalAtivo, 'data-portal', 'Portal')}
      ${campoBusca('busca-permissoes', estado.busca, 'Buscar tela ou ação — ex.: estornar, certificado, aula…', 'flex-1 min-w-56 max-w-md')}
      <button type="button" id="btn-expandir-modulos" data-expandir="${!todosAbertos}" class="${BOTAO_FANTASMA_FUNDO} ml-auto">
        ${icone(todosAbertos ? D.recolher : D.expandir, 'h-4 w-4', 2)}
        ${todosAbertos ? 'Minimizar todos' : 'Expandir todos'}
      </button>
    </div>
    <div id="container-modulos" class="space-y-4">${htmlModulos(perfil)}</div>`;
}

// Um cartão por módulo: o cabeçalho recolhe o cartão; Liberar tudo e Limpar são as ações fantasma dele.
function htmlModulos(perfil) {
  const termo = estado.busca.trim().toLowerCase();
  const buscando = termo.length > 0;

  const secoes = Permissoes.modulosDoPortal(estado.portalAtivo).map((modulo) => {
    const todasDoModulo = Permissoes.featuresDoModulo(modulo.id);
    let features = todasDoModulo;
    if (buscando && !modulo.nome.toLowerCase().includes(termo)) {
      features = todasDoModulo.filter((f) =>
        f.nome.toLowerCase().includes(termo) ||
        f.acoes.some((a) => a.nome.toLowerCase().includes(termo)));
    }
    if (!features.length) return '';

    const aberto = buscando || estado.modulosAbertos.has(modulo.id);
    const { ativas, total } = Permissoes.contagemAcoes(perfil, todasDoModulo);
    const resumo = ativas === total ? `todas as ${total} ações liberadas` : `${ativas} de ${total} ações liberadas`;

    return `
      <section class="${CARTAO}">
        <div class="px-4 ${aberto ? 'pt-3 pb-1' : 'py-3'} flex items-center gap-3">
          <button type="button" data-toggle-modulo="${modulo.id}" aria-expanded="${aberto}"
            class="flex-1 min-w-0 flex items-start gap-2 -ml-1.5 px-1.5 py-1 rounded-md text-left">
            ${icone(D.direita, `h-4 w-4 mt-[3px] text-slate-400 dark:text-neutral-500 transition-transform ${aberto ? 'rotate-90' : ''}`, 2)}
            <span class="min-w-0">
              <span class="block font-display text-[15px] leading-[22px] font-semibold ${TITULO}">${esc(modulo.nome)}</span>
              <span class="block text-xs tabular-nums ${APOIO}">${resumo}</span>
            </span>
          </button>
          <div class="-mr-1.5 flex shrink-0 items-center gap-1">
            <button type="button" data-modulo-tudo="${modulo.id}" title="Liberar todas as ações do módulo" class="${BOTAO_FANTASMA}">Liberar tudo</button>
            <button type="button" data-modulo-nenhum="${modulo.id}" title="Remover todas as ações do módulo" class="${BOTAO_FANTASMA}">Limpar</button>
          </div>
        </div>
        ${aberto ? `<div class="divide-y divide-slate-100 dark:divide-neutral-900">${features.map((f) => htmlLinhaFeature(perfil, f)).join('')}</div>` : ''}
      </section>`;
  }).filter(Boolean);

  return secoes.join('') || cartaoVazio(`Nenhuma tela ou ação encontrada para "${esc(estado.busca)}".`);
}

// Ações sem Visualizar não servem para nada: o aviso em cobre pede a ação que falta.
function htmlLinhaFeature(perfil, feature) {
  const ativas = perfil.permissoes[feature.id] || [];
  const acessoTela = ativas.includes('visualizar');
  const situacao = acessoTela
    ? `<span class="inline-flex items-center gap-1.5 ${APOIO}"><span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>tela liberada</span>`
    : ativas.length
      ? `<span class="${COBRE_TINTA}">sem acesso à tela — ative "Visualizar"</span>`
      : `<span class="inline-flex items-center gap-1.5 ${APOIO}"><span class="h-1.5 w-1.5 rounded-full ring-1 ring-inset ring-slate-400 dark:ring-neutral-500"></span>sem acesso à tela</span>`;
  return `
    <div class="grid grid-cols-[15rem_minmax(0,1fr)] items-center gap-x-6 gap-y-2 px-4 py-3">
      <div class="min-w-0">
        <p class="text-sm font-medium ${VALOR}">${esc(feature.nome)}</p>
        <p class="text-xs mt-0.5">${situacao}</p>
      </div>
      <div class="flex flex-wrap gap-1.5">
        ${feature.acoes.map((acao) => {
          const ligada = ativas.includes(acao.id);
          return `
            <button type="button" data-feature="${feature.id}" data-acao="${acao.id}" aria-pressed="${ligada}"
              class="${CHIP} ${ligada ? CHIP_LIGADO : CHIP_LIVRE}">
              ${ligada ? icone(D.check, 'h-3 w-3', 2.5) : ''}${esc(acao.nome)}
            </button>`;
        }).join('')}
      </div>
    </div>`;
}

function wireModulos(perfil) {
  const raiz = document.getElementById('container-modulos');

  raiz.querySelectorAll('[data-toggle-modulo]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.toggleModulo;
      if (estado.modulosAbertos.has(id)) estado.modulosAbertos.delete(id);
      else estado.modulosAbertos.add(id);
      raiz.innerHTML = htmlModulos(perfil);
      wireModulos(perfil);
    });
  });

  raiz.querySelectorAll('[data-modulo-tudo]').forEach((el) => {
    el.addEventListener('click', () => {
      const modulo = Permissoes.getModulo(el.dataset.moduloTudo);
      const { ativas, total } = Permissoes.contagemAcoes(perfil, Permissoes.featuresDoModulo(modulo.id));
      if (ativas === total) {
        toast(`Todas as ações de ${modulo.nome} já estão ativas neste perfil.`, 'alerta');
        return;
      }
      confirmar({
        titulo: `Liberar todas as ações de ${modulo.nome}?`,
        mensagem: `O perfil "${perfil.nome}" receberá as ${total} ações do módulo (${total - ativas} serão ativadas agora).`,
        rotulo: 'Liberar tudo',
        tom: 'primario',
        aoConfirmar: () => {
          Permissoes.definirModulo(perfil.id, modulo.id, true);
          estado.modulosAbertos.add(modulo.id);
          salvar();
          toast(`Todas as ações de ${modulo.nome} liberadas para "${perfil.nome}"`);
          renderTudo();
        },
      });
    });
  });

  raiz.querySelectorAll('[data-modulo-nenhum]').forEach((el) => {
    el.addEventListener('click', () => {
      const modulo = Permissoes.getModulo(el.dataset.moduloNenhum);
      const { ativas } = Permissoes.contagemAcoes(perfil, Permissoes.featuresDoModulo(modulo.id));
      if (!ativas) {
        toast(`${modulo.nome} não tem ações ativas neste perfil.`, 'alerta');
        return;
      }
      confirmar({
        titulo: `Limpar as ações de ${modulo.nome}?`,
        mensagem: `O perfil "${perfil.nome}" perderá as ${ativas} ações ativas neste módulo, incluindo o acesso às telas.`,
        rotulo: 'Limpar ações',
        aoConfirmar: () => {
          Permissoes.definirModulo(perfil.id, modulo.id, false);
          salvar();
          toast(`Ações de ${modulo.nome} removidas de "${perfil.nome}"`, 'alerta');
          renderTudo();
        },
      });
    });
  });

  raiz.querySelectorAll('[data-feature][data-acao]').forEach((el) => {
    el.addEventListener('click', () => {
      Permissoes.alternarPermissao(perfil.id, el.dataset.feature, el.dataset.acao);
      salvar();
      renderTudo();
    });
  });
}

// ---------- Aba Usuários ----------

function htmlAbaUsuarios(perfil, membros) {
  const filtros = [
    { id: 'todos', rotulo: 'Todos', contagem: USUARIOS.length },
    { id: 'incluidos', rotulo: 'No perfil', contagem: membros.length },
    { id: 'fora', rotulo: 'Fora do perfil', contagem: USUARIOS.length - membros.length },
  ];
  return `
    <div class="${BARRA}">
      ${campoBusca('busca-usuarios', estado.buscaUsuarios, 'Buscar usuário pelo nome…')}
      ${segmentado(filtros, estado.filtroUsuarios, 'data-filtro-usuarios', 'Filtrar usuários')}
      <span class="ml-auto text-sm ${APOIO_FUNDO}">Use o interruptor para incluir ou remover do perfil.</span>
    </div>
    <div id="lista-usuarios-perfil">${htmlListaUsuarios(perfil)}</div>`;
}

function htmlListaUsuarios(perfil) {
  const termo = estado.buscaUsuarios.trim().toLowerCase();
  const filtrados = USUARIOS.filter((usuario) => {
    const incluido = usuario.perfis.includes(perfil.id);
    if (estado.filtroUsuarios === 'incluidos' && !incluido) return false;
    if (estado.filtroUsuarios === 'fora' && incluido) return false;
    return !termo || usuario.nome.toLowerCase().includes(termo);
  });

  if (!filtrados.length) return cartaoVazio('Nenhum usuário encontrado com esse filtro.');

  return `
    <ul class="${CARTAO} overflow-hidden divide-y divide-slate-100 dark:divide-neutral-900">
      ${filtrados.map((usuario) => {
        const incluido = usuario.perfis.includes(perfil.id);
        const outros = usuario.perfis
          .filter((id) => id !== perfil.id)
          .map((id) => Permissoes.getPerfil(id)?.nome)
          .filter(Boolean);
        return `
          <li class="group flex items-center gap-3 px-4 h-14 transition-colors ${LINHA_HOVER}">
            ${avatarHtml(usuario, 'h-8 w-8 text-[11px]')}
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium ${VALOR} truncate">${esc(usuario.nome)}</p>
              <p class="text-xs ${APOIO} truncate">${outros.length ? `Também em: ${esc(outros.join(', '))}` : 'Sem outros perfis'}</p>
            </div>
            ${botaoExtrasHtml(usuario)}
            ${switchHtml(incluido, `data-usuario="${usuario.id}"`, incluido ? `Remover ${usuario.nome} do perfil` : `Incluir ${usuario.nome} no perfil`)}
          </li>`;
      }).join('')}
    </ul>`;
}

// Botão que abre o modal de permissões extras do usuário. Sem extras,
// só aparece ao passar o mouse na linha (ou com foco do teclado); na matriz,
// sobreposto à direita da célula para não encurtar o nome.
function botaoExtrasHtml(usuario, { sobreposto = false } = {}) {
  const total = Permissoes.totalExtras(usuario);
  return total
    ? `<button type="button" data-abrir-extras="${usuario.id}" title="Permissões extras de ${esc(usuario.nome)}"
        class="ml-auto shrink-0 inline-flex items-center h-6 px-2 rounded-md text-xs font-medium tabular-nums transition ${PILULA.extra} hover:bg-petrol-800/15 dark:hover:bg-sky-950">+${plural(total, 'extra', 'extras')}</button>`
    : `<button type="button" data-abrir-extras="${usuario.id}" title="Conceder permissões extras a ${esc(usuario.nome)}"
        class="${sobreposto ? 'absolute right-2 top-1/2 -translate-y-1/2 bg-slate-100 dark:bg-neutral-900' : ''} shrink-0 inline-flex items-center h-6 px-2 rounded-md text-xs font-medium ${APOIO} opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 hover:text-petrol-800 dark:hover:text-sky-300">+ extras</button>`;
}

// Re-renderiza o miolo da matriz preservando a posição de rolagem.
function atualizarTabelaMatriz(html) {
  const scroll = document.getElementById('scroll-matriz');
  const top = scroll?.scrollTop ?? 0;
  const left = scroll?.scrollLeft ?? 0;
  document.getElementById('tabela-matriz').innerHTML = html;
  aplicarStickyMatriz();
  const novoScroll = document.getElementById('scroll-matriz');
  if (novoScroll) {
    novoScroll.scrollTop = top;
    novoScroll.scrollLeft = left;
  }
}

// Congela módulo e tela abaixo do cabeçalho: calcula os offsets de
// "top" das faixas sticky a partir das alturas reais renderizadas.
// O ResizeObserver recalcula quando o cabeçalho muda de altura
// (ex.: carregamento das fontes web ou redimensionamento da janela).
let stickyObserver = null;

function aplicarStickyMatriz() {
  const scroll = document.getElementById('scroll-matriz');
  if (!scroll) return;
  const thead = scroll.querySelector('thead');
  if (!thead) return;

  const aplicar = () => {
    const alturaCabecalho = thead.getBoundingClientRect().height;
    const modulos = scroll.querySelectorAll('[data-sticky-modulo]');
    modulos.forEach((td) => { td.style.top = `${alturaCabecalho}px`; });
    const alturaModulo = modulos[0]?.getBoundingClientRect().height ?? 0;
    scroll.querySelectorAll('[data-sticky-feature]').forEach((td) => {
      td.style.top = `${alturaCabecalho + alturaModulo}px`;
    });
  };

  aplicar();
  if (stickyObserver) stickyObserver.disconnect();
  stickyObserver = new ResizeObserver(aplicar);
  stickyObserver.observe(thead);
}

// ---------- Seletor de colunas (perfis exibidos nas matrizes) ----------

function htmlSeletorColunas() {
  return `
    <div class="relative shrink-0" id="seletor-colunas">
      <button type="button" id="btn-colunas" aria-haspopup="true" class="${BOTAO_SEC}">
        Perfis exibidos
        <span id="contagem-colunas" class="tabular-nums font-normal ${APOIO}">${perfisExibidos().length} de ${PERFIS.length}</span>
        ${icone(D.baixo, 'h-3.5 w-3.5', 2)}
      </button>
      <div id="popover-colunas" class="hidden ${POPOVER} right-0 w-72 z-40">
        <input id="busca-colunas" type="search" value="${esc(estado.buscaColunas)}" placeholder="Buscar perfil…" autocomplete="off" aria-label="Buscar perfil"
          class="${CAMPO} w-full">
        <div id="lista-colunas" class="max-h-60 overflow-y-auto mt-1.5">${htmlListaColunas()}</div>
        <div class="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-200 dark:border-neutral-800">
          <button type="button" data-colunas-todos class="${BOTAO_FANTASMA}">Marcar todos</button>
          <button type="button" data-colunas-nenhum class="${BOTAO_FANTASMA}">Desmarcar todos</button>
        </div>
      </div>
    </div>`;
}

function htmlListaColunas() {
  const termo = estado.buscaColunas.trim().toLowerCase();
  const perfis = PERFIS.filter((p) => !termo || p.nome.toLowerCase().includes(termo));
  if (!perfis.length) {
    return `<p class="text-xs ${APOIO} px-2 py-3 text-center">Nenhum perfil encontrado.</p>`;
  }
  return perfis.map((perfil) => {
    const marcado = !estado.perfisVisiveis || estado.perfisVisiveis.has(perfil.id);
    return `
      <label class="${ITEM_POPOVER} gap-2.5 h-8 cursor-pointer">
        <input type="checkbox" data-coluna-perfil="${perfil.id}" ${marcado ? 'checked' : ''} class="h-3.5 w-3.5 accent-petrol-800 dark:accent-sky-400">
        <span class="truncate ${perfil.ativo ? VALOR : APOIO}">${esc(perfil.nome)}${perfil.ativo ? '' : ' (inativo)'}</span>
      </label>`;
  }).join('');
}

function wireSeletorColunas(aoMudar) {
  const raiz = document.getElementById('seletor-colunas');
  const popover = raiz.querySelector('#popover-colunas');

  raiz.querySelector('#btn-colunas').addEventListener('click', () => popover.classList.toggle('hidden'));

  const inputBusca = raiz.querySelector('#busca-colunas');
  inputBusca.addEventListener('input', () => {
    estado.buscaColunas = inputBusca.value;
    raiz.querySelector('#lista-colunas').innerHTML = htmlListaColunas();
  });

  const atualizar = () => {
    raiz.querySelector('#contagem-colunas').textContent = `${perfisExibidos().length} de ${PERFIS.length}`;
    aoMudar();
  };

  raiz.querySelector('#lista-colunas').addEventListener('change', (e) => {
    const checkbox = e.target.closest('[data-coluna-perfil]');
    if (!checkbox) return;
    if (!estado.perfisVisiveis) estado.perfisVisiveis = new Set(PERFIS.map((p) => p.id));
    if (checkbox.checked) estado.perfisVisiveis.add(checkbox.dataset.colunaPerfil);
    else estado.perfisVisiveis.delete(checkbox.dataset.colunaPerfil);
    atualizar();
  });

  raiz.querySelector('[data-colunas-todos]').addEventListener('click', () => {
    estado.perfisVisiveis = null;
    raiz.querySelector('#lista-colunas').innerHTML = htmlListaColunas();
    atualizar();
  });

  raiz.querySelector('[data-colunas-nenhum]').addEventListener('click', () => {
    estado.perfisVisiveis = new Set();
    raiz.querySelector('#lista-colunas').innerHTML = htmlListaColunas();
    atualizar();
  });
}

// Matrizes: tabela de borda a borda num cartão que rola por dentro, com cabeçalho e primeira coluna congelados.
const MATRIZ_TH = 'sticky top-0 bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800';
const MATRIZ_TD = 'border-b border-slate-100 dark:border-neutral-900';
const MATRIZ_FIXA = 'sticky left-0 bg-white dark:bg-neutral-950 group-hover:bg-slate-50 dark:group-hover:bg-neutral-900 transition-colors';
const MATRIZ_CELULA = `px-2 text-center border-l ${MATRIZ_TD} transition-colors group-hover:bg-slate-50 dark:group-hover:bg-neutral-900`;

// Cabeçalho de coluna das matrizes: nome do perfil (link para o detalhe) e um dado.
function thPerfilHtml(perfil, detalhe, z = 'z-20') {
  return `
    <th scope="col" class="${MATRIZ_TH} ${z} px-2 pt-2.5 pb-2 border-l text-center align-bottom min-w-[100px] font-normal">
      <a href="${urlDetalhe(perfil.id)}" class="text-[12.5px] font-medium leading-tight ${perfil.ativo ? VALOR : APOIO} hover:underline underline-offset-2">${esc(perfil.nome)}</a>
      <span class="block mt-0.5 text-[11.5px] ${APOIO} tabular-nums">${perfil.ativo ? detalhe : 'inativo'}</span>
    </th>`;
}

const SEM_COLUNAS = cartaoVazio('Nenhum perfil selecionado — escolha as colunas em "Perfis exibidos".');

// ---------- Matriz: Usuários × Perfis ----------

function renderMatrizUsuarios() {
  const container = document.getElementById('visao-matriz');
  container.innerHTML = `
    <div class="${BARRA}">
      ${campoBusca('busca-matriz-usuarios', estado.buscaMatrizUsuarios, 'Buscar usuário pelo nome…')}
      <div class="ml-auto">${htmlSeletorColunas()}</div>
    </div>
    <div id="tabela-matriz" class="flex-1 min-h-0 flex flex-col">${htmlTabelaMatrizUsuarios()}</div>`;

  aplicarStickyMatriz();

  const inputBusca = container.querySelector('#busca-matriz-usuarios');
  inputBusca.addEventListener('input', () => {
    estado.buscaMatrizUsuarios = inputBusca.value;
    atualizarTabelaMatriz(htmlTabelaMatrizUsuarios());
  });

  wireSeletorColunas(() => atualizarTabelaMatriz(htmlTabelaMatrizUsuarios()));

  container.querySelector('#tabela-matriz').addEventListener('click', (e) => {
    const validar = e.target.closest('[data-validar-usuario]');
    if (validar) {
      abrirValidacao(validar.dataset.validarUsuario);
      return;
    }
    const abrirExtras = e.target.closest('[data-abrir-extras]');
    if (abrirExtras) {
      abrirModalExtras(abrirExtras.dataset.abrirExtras);
      return;
    }
    const botao = e.target.closest('[data-mu-usuario]');
    if (!botao) return;
    const usuario = Permissoes.getUsuario(botao.dataset.muUsuario);
    const perfil = Permissoes.getPerfil(botao.dataset.muPerfil);
    const resultado = Permissoes.alternarUsuarioNoPerfil(usuario.id, perfil.id);
    if (resultado.erro) {
      toast(resultado.erro, 'erro');
      return;
    }
    salvar();
    toast(`${usuario.nome} ${resultado.incluido ? 'incluído(a) no' : 'removido(a) do'} perfil "${perfil.nome}"`, resultado.incluido ? 'ok' : 'alerta');
    atualizarTabelaMatriz(htmlTabelaMatrizUsuarios());
    renderResumo();
  });
}

function htmlTabelaMatrizUsuarios() {
  const termo = estado.buscaMatrizUsuarios.trim().toLowerCase();
  const usuarios = USUARIOS.filter((u) => !termo || u.nome.toLowerCase().includes(termo));
  const colunas = perfisExibidos();

  if (!colunas.length) return SEM_COLUNAS;
  if (!usuarios.length) return cartaoVazio('Nenhum usuário encontrado.');

  return `
    <div id="scroll-matriz" class="${CARTAO} flex-1 min-h-0 overflow-auto">
      <table class="min-w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th scope="col" class="${MATRIZ_TH} left-0 z-30 pl-4 pr-3 pb-2 text-left align-bottom text-xs font-medium ${APOIO} min-w-[256px]">Usuário</th>
            ${colunas.map((perfil) => thPerfilHtml(perfil, plural(membrosDoPerfil(perfil.id).length, 'usuário', 'usuários'))).join('')}
          </tr>
        </thead>
        <tbody>
          ${usuarios.map((usuario) => `
            <tr class="group">
              <td class="${MATRIZ_FIXA} ${MATRIZ_TD} z-10 h-11 pl-4 pr-2">
                <div class="relative flex items-center gap-1.5 min-w-0">
                  <button type="button" data-validar-usuario="${usuario.id}" title="Ver o acesso consolidado de ${esc(usuario.nome)}"
                    class="flex items-center gap-2 min-w-0 rounded-md text-left hover:underline underline-offset-2">
                    ${avatarHtml(usuario, 'h-6 w-6 text-[10px]')}
                    <span class="font-medium ${VALOR} truncate">${esc(usuario.nome)}</span>
                  </button>
                  ${usuario.perfis.length ? '' : TAG_SEM_PERFIL}
                  ${botaoExtrasHtml(usuario, { sobreposto: true })}
                </div>
              </td>
              ${colunas.map((perfil) => {
                const incluido = usuario.perfis.includes(perfil.id);
                return `
                  <td class="h-11 ${MATRIZ_CELULA} ${perfil.ativo ? '' : 'opacity-50'}">
                    ${miniSwitchHtml(incluido, `data-mu-usuario="${usuario.id}" data-mu-perfil="${perfil.id}"`, `${incluido ? 'Remover' : 'Incluir'} ${usuario.nome} — ${perfil.nome}`)}
                  </td>`;
              }).join('')}
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// ---------- Matriz: Permissões × Perfis ----------

function renderMatrizPermissoes() {
  const container = document.getElementById('visao-matriz');
  container.innerHTML = `
    <div class="${BARRA}">
      ${segmentado(PORTAIS.map((p) => ({ id: p.id, rotulo: p.nome })), estado.portalAtivo, 'data-portal-matriz', 'Portal')}
      ${campoBusca('busca-matriz', estado.buscaMatriz, 'Buscar tela ou ação…')}
      <div class="ml-auto">${htmlSeletorColunas()}</div>
    </div>
    <div id="tabela-matriz" class="flex-1 min-h-0 flex flex-col">${htmlTabelaMatrizPermissoes()}</div>`;

  aplicarStickyMatriz();
  wireSeletorColunas(() => atualizarTabelaMatriz(htmlTabelaMatrizPermissoes()));

  container.querySelectorAll('[data-portal-matriz]').forEach((el) => {
    el.addEventListener('click', () => {
      estado.portalAtivo = el.dataset.portalMatriz;
      renderMatrizPermissoes();
    });
  });

  const inputBusca = container.querySelector('#busca-matriz');
  inputBusca.addEventListener('input', () => {
    estado.buscaMatriz = inputBusca.value;
    atualizarTabelaMatriz(htmlTabelaMatrizPermissoes());
  });

  container.querySelector('#tabela-matriz').addEventListener('click', (e) => {
    const botao = e.target.closest('[data-mx-acao]');
    if (!botao) return;
    Permissoes.alternarPermissao(botao.dataset.mxPerfil, botao.dataset.mxFeature, botao.dataset.mxAcao);
    salvar();
    atualizarTabelaMatriz(htmlTabelaMatrizPermissoes());
  });
}

function htmlTabelaMatrizPermissoes() {
  const termo = estado.buscaMatriz.trim().toLowerCase();
  const modulos = Permissoes.modulosDoPortal(estado.portalAtivo);
  const colunas = perfisExibidos();
  const totalColunas = colunas.length + 1;

  if (!colunas.length) return SEM_COLUNAS;

  const linhas = modulos.map((modulo) => {
    const features = Permissoes.featuresDoModulo(modulo.id)
      .map((feature) => {
        const featureBate = !termo || feature.nome.toLowerCase().includes(termo) || modulo.nome.toLowerCase().includes(termo);
        const acoes = featureBate
          ? feature.acoes
          : feature.acoes.filter((a) => a.nome.toLowerCase().includes(termo));
        return { feature, acoes };
      })
      .filter((x) => x.acoes.length);

    if (!features.length) return '';

    return `
      <tr>
        <td colspan="${totalColunas}" data-sticky-modulo class="sticky left-0 z-20 h-9 pl-4 bg-slate-100 dark:bg-neutral-900 font-semibold ${TITULO} border-b border-slate-200 dark:border-neutral-800">${esc(modulo.nome)}</td>
      </tr>
      ${features.map(({ feature, acoes }) => `
        <tr>
          <td colspan="${totalColunas}" data-sticky-feature class="sticky left-0 z-[15] h-9 pl-4 bg-white dark:bg-neutral-950 font-medium ${VALOR} ${MATRIZ_TD}">${esc(feature.nome)}</td>
        </tr>
        ${acoes.map((acao) => `
          <tr class="group">
            <td class="${MATRIZ_FIXA} ${MATRIZ_TD} z-10 h-9 pl-8 pr-3 text-slate-600 dark:text-neutral-300 min-w-[256px]">${esc(acao.nome)}</td>
            ${colunas.map((perfil) => {
              const ligada = (perfil.permissoes[feature.id] || []).includes(acao.id);
              return `
                <td class="h-9 ${MATRIZ_CELULA} ${perfil.ativo ? '' : 'opacity-50'}">
                  ${miniSwitchHtml(ligada, `data-mx-perfil="${perfil.id}" data-mx-feature="${feature.id}" data-mx-acao="${acao.id}"`, `${perfil.nome} — ${feature.nome} · ${acao.nome}`)}
                </td>`;
            }).join('')}
          </tr>`).join('')}`).join('')}`;
  }).filter(Boolean);

  if (!linhas.length) return cartaoVazio(`Nenhuma tela ou ação encontrada para "${esc(estado.buscaMatriz)}".`);

  return `
    <div id="scroll-matriz" class="${CARTAO} flex-1 min-h-0 overflow-auto">
      <table class="min-w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th scope="col" class="${MATRIZ_TH} left-0 z-40 pl-4 pr-3 pb-2 text-left align-bottom text-xs font-medium ${APOIO} min-w-[256px]">Tela / Ação</th>
            ${colunas.map((perfil) => thPerfilHtml(perfil, plural(Permissoes.contagemAcoes(perfil, Permissoes.featuresDoPortal(estado.portalAtivo)).ativas, 'ação', 'ações'), 'z-30')).join('')}
          </tr>
        </thead>
        <tbody>${linhas.join('')}</tbody>
      </table>
    </div>`;
}

// ---------- Validação de acesso (aba da lista) ----------

// Sem usuarioId (aba) abre sempre sem usuário escolhido; com usuarioId (clique
// num usuário na matriz) abre direto no acesso daquela pessoa. No detalhe
// navega para a lista com os parâmetros na URL.
function abrirValidacao(usuarioId = null) {
  if (MODO === 'detalhe') {
    location.href = `${URL_LISTA}?aba=validacao${usuarioId ? `&usuario=${encodeURIComponent(usuarioId)}` : ''}`;
    return;
  }
  estado.visao = 'validacao';
  estado.usuarioInspecionadoId = usuarioId;
  estado.buscaUsuarioValidacao = '';
  renderTudo();
}

function renderValidacao() {
  const root = document.getElementById('visao-matriz');
  root.innerHTML = `
    <div class="${BARRA}">
      <div class="relative w-80" id="seletor-usuario-validacao">
        <button type="button" id="btn-usuario-validacao" aria-haspopup="true" aria-expanded="false"
          class="${CAMPO} w-full flex items-center gap-2 text-left">
          <span id="rotulo-usuario-validacao" class="flex-1 flex items-center gap-2 min-w-0 ${APOIO}">Selecione um usuário…</span>
          ${icone(D.baixo, 'h-3.5 w-3.5 text-slate-400 dark:text-neutral-500', 2)}
        </button>
        <div id="popover-usuario-validacao" class="hidden ${POPOVER} left-0 right-0 z-50">
          <input id="busca-usuario-validacao" type="search" placeholder="Buscar usuário pelo nome…" autocomplete="off" aria-label="Buscar usuário"
            class="${CAMPO} w-full">
          <div id="lista-usuario-validacao" class="max-h-72 overflow-y-auto mt-1.5">${htmlListaUsuariosValidacao()}</div>
        </div>
      </div>
      <button type="button" id="btn-extras-validacao" title="Conceder permissões além dos perfis deste usuário" class="${BOTAO_SEC}">
        Permissões extras
      </button>
      <span class="ml-auto text-sm ${APOIO_FUNDO}">União dos perfis ativos mais as permissões extras.</span>
    </div>
    <div id="validacao-conteudo"></div>`;

  const popoverUsuario = root.querySelector('#popover-usuario-validacao');
  const botaoUsuario = root.querySelector('#btn-usuario-validacao');
  botaoUsuario.addEventListener('click', () => {
    popoverUsuario.classList.toggle('hidden');
    const aberto = !popoverUsuario.classList.contains('hidden');
    botaoUsuario.setAttribute('aria-expanded', String(aberto));
    if (aberto) popoverUsuario.querySelector('#busca-usuario-validacao').focus();
  });

  const buscaUsuario = root.querySelector('#busca-usuario-validacao');
  buscaUsuario.addEventListener('input', () => {
    estado.buscaUsuarioValidacao = buscaUsuario.value;
    root.querySelector('#lista-usuario-validacao').innerHTML = htmlListaUsuariosValidacao();
  });

  root.querySelector('#lista-usuario-validacao').addEventListener('click', (e) => {
    const opcao = e.target.closest('[data-usuario-validacao]');
    if (!opcao) return;
    estado.usuarioInspecionadoId = opcao.dataset.usuarioValidacao;
    estado.buscaUsuarioValidacao = '';
    buscaUsuario.value = '';
    popoverUsuario.classList.add('hidden');
    botaoUsuario.setAttribute('aria-expanded', 'false');
    root.querySelector('#lista-usuario-validacao').innerHTML = htmlListaUsuariosValidacao();
    renderConteudoValidacao();
  });

  root.querySelector('#btn-extras-validacao').addEventListener('click', () => {
    if (estado.usuarioInspecionadoId) abrirModalExtras(estado.usuarioInspecionadoId);
  });
  renderConteudoValidacao();
}

function htmlListaUsuariosValidacao() {
  const termo = estado.buscaUsuarioValidacao.trim().toLowerCase();
  const usuarios = USUARIOS.filter((u) => !termo || u.nome.toLowerCase().includes(termo));
  if (!usuarios.length) {
    return `<p class="text-xs ${APOIO} px-2 py-3 text-center">Nenhum usuário encontrado.</p>`;
  }
  return usuarios.map((usuario) => {
    const selecionado = usuario.id === estado.usuarioInspecionadoId;
    const perfis = usuario.perfis.map((id) => Permissoes.getPerfil(id)?.nome).filter(Boolean);
    return `
      <button type="button" data-usuario-validacao="${usuario.id}"
        class="${ITEM_POPOVER} gap-2.5 py-1.5 ${selecionado ? 'bg-slate-100 dark:bg-neutral-900' : ''}">
        ${avatarHtml(usuario, 'h-6 w-6 text-[10px]')}
        <span class="flex-1 min-w-0">
          <span class="block truncate ${VALOR}">${esc(usuario.nome)}</span>
          <span class="block text-xs truncate ${perfis.length ? APOIO : COBRE_TINTA}">${perfis.length ? esc(perfis.join(', ')) : 'sem perfil'}</span>
        </span>
        ${selecionado ? CHECK : ''}
      </button>`;
  }).join('');
}

// Faixa de portal (congelada no modal de extras) e rótulo de módulo, usado também nos cartões da validação.
function faixaPortalHtml(portal) {
  return `<h4 class="sticky top-0 z-10 flex items-center h-9 px-5 bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 text-sm font-semibold ${TITULO}">${esc(portal.nome)}</h4>`;
}

function rotuloModuloHtml(modulo, recuo = 'px-5') {
  return `<p class="${recuo} pt-3 pb-1 text-xs font-medium ${APOIO}">${esc(modulo.nome)}</p>`;
}

// ---------- Permissões extras por usuário (modal centralizado) ----------

function abrirModalExtras(usuarioId) {
  fecharModal();
  estado.usuarioExtrasId = usuarioId;
  estado.buscaExtras = '';

  const usuario = Permissoes.getUsuario(usuarioId);
  const nomesPerfis = usuario.perfis.map((id) => Permissoes.getPerfil(id)?.nome).filter(Boolean);
  const amostra = (classe, texto) => `<span class="inline-flex items-center gap-1.5"><span class="h-3 w-3 rounded-[3px] ${classe}"></span>${texto}</span>`;

  abrirModal(`
    <div class="flex items-start gap-3 ${MODAL_TOPO}">
      ${avatarHtml(usuario, 'h-9 w-9 text-xs')}
      <div class="min-w-0 flex-1">
        <h3 class="font-display text-base font-semibold ${TITULO}">Permissões extras · ${esc(usuario.nome)}</h3>
        <p class="mt-0.5 ${APOIO}">Perfis: ${nomesPerfis.length ? esc(nomesPerfis.join(', ')) : `<span class="font-medium ${COBRE_TINTA}">nenhum</span>`}</p>
      </div>
      <button type="button" data-fechar-modal-extras title="Fechar" aria-label="Fechar" class="${BOTAO_ICONE} -mr-2 -mt-1">${icone(D.fechar)}</button>
    </div>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 border-b border-slate-200 dark:border-neutral-800">
      ${campoBusca('busca-extras', '', 'Buscar tela ou ação…', 'w-56')}
      <span class="ml-auto flex flex-wrap gap-x-3 gap-y-1 text-xs ${APOIO}">
        ${amostra('bg-slate-100 border border-slate-200 dark:bg-neutral-900 dark:border-neutral-700', 'dos perfis')}
        ${amostra('bg-petrol-800/10 border border-petrol-800/40 dark:bg-sky-950/60 dark:border-sky-400/40', 'extra deste usuário')}
        ${amostra('border border-slate-300 dark:border-neutral-700', 'clique para conceder')}
      </span>
    </div>
    <div id="conteudo-extras" class="flex-1 min-h-0 overflow-y-auto pb-3">${htmlConteudoExtras(usuario)}</div>`,
  { largura: 'max-w-2xl', rotulo: `Permissões extras de ${usuario.nome}` });

  const root = document.getElementById('modal-root');
  root.querySelector('[data-fechar-modal-extras]').addEventListener('click', fecharModal);

  const inputBusca = root.querySelector('#busca-extras');
  inputBusca.addEventListener('input', () => {
    estado.buscaExtras = inputBusca.value;
    document.getElementById('conteudo-extras').innerHTML = htmlConteudoExtras(usuario);
  });
  inputBusca.focus();

  root.querySelector('#conteudo-extras').addEventListener('click', (e) => {
    const botao = e.target.closest('[data-ex-acao]');
    if (!botao) return;
    const concedida = Permissoes.alternarPermissaoExtra(usuario.id, botao.dataset.exFeature, botao.dataset.exAcao);
    salvar();
    const feature = Permissoes.getFeature(botao.dataset.exFeature);
    const acao = feature.acoes.find((a) => a.id === botao.dataset.exAcao);
    toast(`Permissão extra ${concedida ? 'concedida' : 'removida'}: ${feature.nome} · ${acao.nome}`, concedida ? 'ok' : 'alerta');
    const conteudo = document.getElementById('conteudo-extras');
    const scrollTop = conteudo.scrollTop;
    conteudo.innerHTML = htmlConteudoExtras(usuario);
    conteudo.scrollTop = scrollTop;
    renderTudo();
  });
}

function htmlConteudoExtras(usuario) {
  const termo = estado.buscaExtras.trim().toLowerCase();

  const secoes = PORTAIS.map((portal) => {
    const modulosHtml = Permissoes.modulosDoPortal(portal.id).map((modulo) => {
      const features = Permissoes.featuresDoModulo(modulo.id)
        .map((feature) => {
          const featureBate = !termo || feature.nome.toLowerCase().includes(termo) || modulo.nome.toLowerCase().includes(termo);
          const acoes = featureBate
            ? feature.acoes
            : feature.acoes.filter((a) => a.nome.toLowerCase().includes(termo));
          return { feature, acoes };
        })
        .filter((x) => x.acoes.length);

      if (!features.length) return '';

      return `
        ${rotuloModuloHtml(modulo)}
        ${features.map(({ feature, acoes }) => `
          <div class="px-5 py-3 border-b border-slate-100 dark:border-neutral-900">
            <p class="text-sm font-medium ${VALOR} mb-1.5">
              ${esc(feature.nome)}
              ${Permissoes.pode(usuario, feature.id, 'visualizar') ? '' : `<span class="ml-1.5 text-xs font-normal ${COBRE_TINTA}">sem acesso à tela — conceda "Visualizar"</span>`}
            </p>
            <div class="flex flex-wrap gap-1.5">
              ${acoes.map((acao) => {
                if (Permissoes.concedidaPorPerfis(usuario, feature.id, acao.id)) {
                  return `<span class="${CHIP} border-transparent ${PILULA.neutra} cursor-default"
                    title="Concedida pelos perfis do usuário — para remover, ajuste o perfil">${icone(D.check, 'h-3 w-3', 2.5)}${esc(acao.nome)}</span>`;
                }
                if (Permissoes.concedidaPorExtra(usuario, feature.id, acao.id)) {
                  return `<button type="button" data-ex-feature="${feature.id}" data-ex-acao="${acao.id}" aria-pressed="true"
                    class="${CHIP} ${CHIP_LIGADO}"
                    title="Permissão extra — clique para remover">${icone(D.check, 'h-3 w-3', 2.5)}${esc(acao.nome)}</button>`;
                }
                return `<button type="button" data-ex-feature="${feature.id}" data-ex-acao="${acao.id}" aria-pressed="false"
                  class="${CHIP} ${CHIP_LIVRE}"
                  title="Clique para conceder como permissão extra">${esc(acao.nome)}</button>`;
              }).join('')}
            </div>
          </div>`).join('')}`;
    }).filter(Boolean);

    if (!modulosHtml.length) return '';

    return `<section>${faixaPortalHtml(portal)}${modulosHtml.join('')}</section>`;
  }).filter(Boolean);

  return secoes.join('') ||
    `<p class="px-5 py-10 text-center ${APOIO}">Nenhuma tela ou ação encontrada para "${esc(estado.buscaExtras)}".</p>`;
}

function renderConteudoValidacao() {
  const container = document.getElementById('validacao-conteudo');
  if (!container) return;
  const usuario = Permissoes.getUsuario(estado.usuarioInspecionadoId);

  // Atualiza o rótulo do combobox de usuário.
  const rotulo = document.getElementById('rotulo-usuario-validacao');
  if (rotulo) {
    rotulo.className = `flex-1 flex items-center gap-2 min-w-0 ${usuario ? VALOR : APOIO}`;
    rotulo.innerHTML = usuario
      ? `${avatarHtml(usuario, 'h-5 w-5 text-[9px]')}<span class="truncate font-medium">${esc(usuario.nome)}</span>`
      : 'Selecione um usuário…';
  }

  // Botão "Permissões extras" só faz sentido com um usuário escolhido.
  const botaoExtras = document.getElementById('btn-extras-validacao');
  if (botaoExtras) botaoExtras.disabled = !usuario;

  if (!usuario) {
    container.innerHTML = cartaoVazio(`
      <p class="font-display text-[15px] font-semibold ${TITULO}">Selecione um usuário</p>
      <p class="mt-1 max-w-md mx-auto">Escolha um usuário acima para ver o acesso consolidado dele — a união dos perfis ativos mais as permissões extras.</p>`);
    return;
  }

  const perfisHtml = usuario.perfis
    .map((id) => {
      const perfil = Permissoes.getPerfil(id);
      return perfil
        ? `<a href="${urlDetalhe(perfil.id)}" class="${LINK}">${esc(perfil.nome)}</a>${perfil.ativo ? '' : ` <span class="${APOIO}">(inativo)</span>`}`
        : null;
    })
    .filter(Boolean);
  const extras = Permissoes.totalExtras(usuario);

  let telas = 0;
  const semAcesso = [];
  // Um cartão por portal: módulos como rótulo, telas em linhas com as ações liberadas em pílulas.
  const secoes = PORTAIS.map((portal) => {
    let telasPortal = 0;
    const modulosComAcesso = Permissoes.modulosDoPortal(portal.id).map((modulo) => {
      const acessiveis = Permissoes.featuresDoModulo(modulo.id)
        .map((feature) => ({
          feature,
          liberadas: Permissoes.acoesResolvidas(usuario, feature.id).filter((a) => a.permitido),
        }))
        .filter((x) => x.liberadas.length);

      if (!acessiveis.length) {
        semAcesso.push(modulo.nome);
        return '';
      }
      telasPortal += acessiveis.length;

      return `
        ${rotuloModuloHtml(modulo, 'px-4')}
        <div class="divide-y divide-slate-100 dark:divide-neutral-900">
          ${acessiveis.map(({ feature, liberadas }) => `
            <div class="grid grid-cols-[15rem_minmax(0,1fr)] items-center gap-x-6 gap-y-1.5 px-4 py-2.5">
              <span class="truncate text-sm font-medium ${VALOR}">${esc(feature.nome)}</span>
              <div class="flex flex-wrap gap-1.5">
                ${liberadas.map((acao) => `
                  <span class="inline-flex items-center h-6 px-2 rounded-md text-xs font-medium ${acao.somenteExtra ? PILULA.extra : PILULA.neutra}"
                    title="Concedida por: ${esc(acao.origens.join(', '))}">${esc(acao.nome)}${acao.somenteExtra ? '<span class="ml-1 font-normal opacity-75">· extra</span>' : ''}</span>`).join('')}
              </div>
            </div>`).join('')}
        </div>`;
    }).filter(Boolean);

    if (!modulosComAcesso.length) return '';
    telas += telasPortal;

    return `
      <section class="${CARTAO} pb-2">
        ${cabecalhoCartao(esc(portal.nome), plural(telasPortal, 'tela liberada', 'telas liberadas'))}
        ${modulosComAcesso.join('')}
      </section>`;
  }).filter(Boolean);

  container.innerHTML = `
    <div class="mb-4 flex items-center gap-3">
      ${avatarHtml(usuario, 'h-10 w-10 text-[13px]')}
      <div class="min-w-0">
        <h3 class="font-registro text-[22px] leading-tight font-semibold tracking-[-0.01em] ${TITULO}">${esc(usuario.nome)}</h3>
        <p class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-600 dark:text-neutral-300">
          <span>Perfis: ${perfisHtml.length ? perfisHtml.join(', ') : `<span class="font-medium ${COBRE_TINTA}">nenhum</span>`}</span>
          ${extras ? `<span class="tabular-nums">${plural(extras, 'permissão extra', 'permissões extras')}</span>` : ''}
          <span class="tabular-nums">${plural(telas, 'tela liberada', 'telas liberadas')}</span>
        </p>
      </div>
    </div>
    ${secoes.length ? `<div class="space-y-4">${secoes.join('')}</div>` : cartaoVazio('Este usuário não tem acesso a nenhuma tela.')}
    ${secoes.length && semAcesso.length ? `<p class="mt-4 text-sm ${APOIO}">Sem acesso: ${esc(semAcesso.join(', '))}</p>` : ''}`;
}

// ---------- Bootstrap ----------

function renderTudo() {
  if (MODO === 'detalhe') {
    renderDetalhe();
    return;
  }

  renderResumo();
  renderTrocaVisao();

  const mostrarPerfis = estado.visao === 'perfis';
  const visaoMatriz = document.getElementById('visao-matriz');
  document.getElementById('visao-perfis').hidden = !mostrarPerfis;
  visaoMatriz.hidden = mostrarPerfis;
  // As matrizes ocupam a altura restante e rolam dentro do cartão (cabeçalho e primeira coluna congelados);
  // a validação cresce com o conteúdo e rola com a página.
  visaoMatriz.className = estado.visao.startsWith('matriz') ? 'flex-1 min-h-[420px] flex flex-col' : '';

  if (mostrarPerfis) {
    renderListaPerfis();
  } else if (estado.visao === 'matriz-usuarios') {
    renderMatrizUsuarios();
  } else if (estado.visao === 'validacao') {
    renderValidacao();
  } else {
    renderMatrizPermissoes();
  }
}

function iniciar() {
  carregar();

  if (MODO === 'detalhe') {
    const id = parametroUrl('id');
    if (!id || !Permissoes.getPerfil(id)) { location.replace(URL_LISTA); return; }
    estado.perfilSelecionadoId = id;
    if (parametroUrl('aba') === 'usuarios') estado.aba = 'usuarios';
  } else {
    // URL antiga (perfis.html?perfil=) → detalhe.
    const antigo = parametroUrl('perfil') || parametroUrl('id');
    if (antigo) { location.replace(urlDetalhe(antigo)); return; }
    const aba = parametroUrl('aba');
    if (VISOES.some((v) => v.id === aba)) estado.visao = aba;
    if (estado.visao === 'validacao') estado.usuarioInspecionadoId = parametroUrl('usuario') || null;

    document.getElementById('resumo-perfis').addEventListener('click', (e) => {
      const link = e.target.closest('[data-ir-visao]');
      if (link) irParaVisao(link.dataset.irVisao);
    });
  }

  document.getElementById('btn-novo-perfil')?.addEventListener('click', abrirModalNovoPerfil);

  renderTudo();
}

iniciar();
