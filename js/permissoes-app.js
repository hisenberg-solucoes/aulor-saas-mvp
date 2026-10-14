// ============================================================
// UI de gestão do permissionamento. Toda operação passa pelo
// motor (Permissoes.*) — a UI apenas reflete o resultado.
// Visual: direção Ficha (valores em styles.css; utilitários papel,
// linha, tinta, marca, cobre… mapeados no @theme das páginas).
// Reaproveitado do protótipo original. Ajustes do Aulor MVP: chave de
// armazenamento compartilhada com o shell (Acessos.CHAVE), Administrador
// protegido e modo só leitura sem a permissão "Perfis de acesso › Gerenciar".
// ============================================================

const STORAGE_KEY = 'aulor-mvp-acessos-v1';
const SOMENTE_LEITURA = typeof Shell !== 'undefined' && !Shell.pode('perfis-acesso', 'gerenciar');

// Barra mudanças que o perfil logado não pode fazer ou que tocariam no perfil protegido.
function bloqueado(perfilId = null) {
  if (SOMENTE_LEITURA) { toast('Seu perfil só pode consultar os perfis de acesso.', 'alerta'); return true; }
  if (perfilId && Permissoes.getPerfil(perfilId)?.protegido) { toast('O Administrador é protegido: tem acesso a tudo e não pode ser alterado. Duplique-o para criar uma variação.', 'alerta'); return true; }
  return false;
}

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

const BOTAO_PRI = 'inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-marca text-sobre-marca text-[13px] font-medium whitespace-nowrap transition hover:bg-marca/90';
const BOTAO_SEC = 'inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border border-linha-forte bg-elevado text-tinta text-[13px] font-medium whitespace-nowrap transition hover:bg-realce disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-elevado';
const BOTAO_PERIGO = 'inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-ruim text-sobre-ruim text-[13px] font-medium whitespace-nowrap transition hover:bg-ruim/90';
const BOTAO_FANTASMA = 'inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-[12.5px] font-medium text-tinta-2 whitespace-nowrap transition hover:bg-realce hover:text-tinta';
const BOTAO_ICONE = 'inline-grid place-items-center h-8 w-8 rounded-lg text-tinta-3 transition hover:bg-realce hover:text-tinta';
const CAMPO = 'h-8 rounded-lg border border-linha-forte bg-elevado px-2.5 text-[13px] text-tinta placeholder:text-tinta-3 transition hover:border-tinta-3/60 focus:border-marca-tinta aria-[invalid=true]:border-ruim';
const POPOVER = 'absolute top-full mt-1 bg-elevado border border-linha-forte rounded-[10px] shadow-[0_12px_32px_-12px_rgba(0,0,0,.28)] p-1.5';
const BARRA = 'flex-none flex flex-wrap items-center gap-2 px-6 py-2 border-b border-linha';
const LINK = 'font-medium underline underline-offset-[3px] decoration-linha-forte transition hover:decoration-current';
const CHECK = icone(D.check, 'h-3.5 w-3.5 text-marca-tinta', 2.5);

function campoBusca(id, valor, placeholder, largura = 'w-72') {
  return `
    <div class="relative ${largura}">
      ${icone(D.busca, 'h-3.5 w-3.5 text-tinta-3 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none', 2)}
      <input id="${id}" type="search" value="${esc(valor)}" placeholder="${esc(placeholder)}" autocomplete="off" aria-label="${esc(placeholder)}" class="${CAMPO} w-full pl-8">
    </div>`;
}

// Controle segmentado (portais, filtros): o ativo fica em elevado sobre a etiqueta.
function segmentado(opcoes, ativo, atributo, rotulo) {
  return `
    <div class="inline-flex shrink-0 rounded-lg bg-etiqueta p-0.5" role="group" aria-label="${esc(rotulo)}">
      ${opcoes.map((o) => `
        <button type="button" ${atributo}="${o.id}" aria-pressed="${o.id === ativo}"
          class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12.5px] font-medium whitespace-nowrap transition
            ${o.id === ativo ? 'bg-elevado text-tinta shadow-[0_1px_2px_rgba(0,0,0,.1)]' : 'text-tinta-2 hover:text-tinta'}">
          ${esc(o.rotulo)}${o.contagem === undefined ? '' : `<span class="tabular-nums text-tinta-3">${o.contagem}</span>`}
        </button>`).join('')}
    </div>`;
}

const CORES_AVATAR = ['bg-selecao', 'bg-etiqueta'];

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
  return `<span class="${tamanho} ${corAvatar(usuario.id)} shrink-0 rounded-full grid place-items-center font-semibold text-tinta" title="${esc(usuario.nome)}" aria-hidden="true">${iniciais(usuario.nome)}</span>`;
}

function membrosDoPerfil(perfilId) {
  return USUARIOS.filter((u) => u.perfis.includes(perfilId));
}

// Status como ponto + texto.
function statusHtml(ativo) {
  return `<span class="inline-flex items-center gap-1.5 ${ativo ? 'text-tinta' : 'text-tinta-3'}"><span class="h-[7px] w-[7px] rounded-full ${ativo ? 'bg-bom' : 'bg-tinta-3/60'}"></span>${ativo ? 'Ativo' : 'Inativo'}</span>`;
}

// Cobre = "é com você": usuário que existe mas não acessa nada.
const TAG_SEM_PERFIL = '<span class="shrink-0 rounded px-1.5 text-[11.5px] leading-5 font-semibold text-cobre-tinta bg-cobre/15">sem perfil</span>';

// ---------- Toasts ----------

function toast(mensagem, tipo = 'ok') {
  const ponto = { ok: 'bg-bom', alerta: 'bg-aviso', erro: 'bg-ruim' };
  const item = document.createElement('div');
  item.className = 'toast-anim flex items-center gap-2.5 max-w-sm rounded-lg ficha-inverso bg-papel text-tinta text-[13px] leading-5 px-3.5 py-2.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,.35)]';
  item.innerHTML = `<span class="h-2 w-2 shrink-0 rounded-full ${ponto[tipo]}"></span><span></span>`;
  item.lastChild.textContent = mensagem;
  document.getElementById('toast-root').appendChild(item);
  setTimeout(() => item.remove(), 3500);
}

// ---------- Modal ----------

let focoAntesDoModal = null;

function abrirModal(conteudoHtml, { largura = 'max-w-md', semPadding = false, rotulo = '' } = {}) {
  const root = document.getElementById('modal-root');
  if (!root.innerHTML) focoAntesDoModal = document.activeElement;
  root.innerHTML = `
    <div class="fixed inset-0 z-40 flex items-start justify-center p-4 pt-[12vh]">
      <div class="absolute inset-0 bg-veu" data-fechar-modal></div>
      <div role="dialog" aria-modal="true" aria-label="${esc(rotulo)}"
        class="modal-anim relative w-full ${largura} bg-elevado border border-linha-forte rounded-xl shadow-[0_24px_60px_-20px_rgba(0,0,0,.4)] ${semPadding ? 'flex flex-col max-h-[76vh] overflow-hidden' : 'p-5'}">${conteudoHtml}</div>
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
    <h3 class="text-base font-semibold text-tinta">${titulo}</h3>
    ${subtitulo ? `<p class="text-tinta-2 mt-1">${subtitulo}</p>` : ''}`;
}

function confirmar({ titulo, mensagem, rotulo, aoConfirmar, tom = 'perigo' }) {
  abrirModal(`
    ${cabecalhoModal(esc(titulo), esc(mensagem))}
    <div class="mt-5 flex justify-end gap-2">
      <button type="button" data-cancelar class="${BOTAO_SEC}">Cancelar</button>
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
    ${cabecalhoModal(titulo, subtitulo)}
    <label class="block mt-4">
      <span class="block text-xs font-medium text-tinta-2 mb-1.5">${esc(rotuloCampo)}</span>
      <input data-campo-nome type="text" value="${esc(valor)}" placeholder="${esc(placeholder)}" autocomplete="off"
        aria-describedby="erro-modal-nome" class="${CAMPO} w-full h-9">
    </label>
    <p id="erro-modal-nome" class="hidden mt-2 text-ruim" role="alert"></p>
    <div class="mt-5 flex justify-end gap-2">
      <button type="button" data-cancelar class="${BOTAO_SEC}">Cancelar</button>
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
  if (bloqueado()) return;
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
  if (bloqueado()) return;
  abrirModalNome({
    titulo: `Duplicar perfil "${esc(perfilOrigem.nome)}"`,
    subtitulo: 'Todas as permissões serão copiadas. Os usuários vinculados <strong class="font-medium text-tinta">não</strong> são copiados.',
    rotuloCampo: 'Nome do novo perfil',
    valor: `Cópia de ${perfilOrigem.nome}`,
    rotuloBotao: 'Duplicar perfil',
    aoSalvar: (nome) => Permissoes.duplicarPerfil(perfilOrigem.id, nome),
  });
}

// ---------- Componentes ----------

// Interruptor da Ficha: trilho petróleo quando ligado.
function switchHtml(ligado, atributos, titulo, tamanho = 'normal') {
  const [trilho, botao, desloca] = tamanho === 'mini'
    ? ['h-4 w-[26px]', 'h-3 w-3', 'translate-x-2.5']
    : ['h-5 w-9', 'h-4 w-4', 'translate-x-4'];
  return `
    <button type="button" role="switch" aria-checked="${ligado}" ${atributos} title="${esc(titulo)}" aria-label="${esc(titulo)}"
      class="relative inline-flex ${trilho} shrink-0 rounded-full align-middle transition-colors ${ligado ? 'bg-marca' : 'bg-elevado ring-1 ring-inset ring-linha-forte hover:ring-tinta-3'}">
      <span class="absolute top-0.5 left-0.5 ${botao} rounded-full transition-transform ${ligado ? `${desloca} bg-sobre-marca` : 'bg-tinta-3'}"></span>
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
  const link = (visao, texto, cor = 'text-tinta') => `<button type="button" data-ir-visao="${visao}" class="${LINK} ${cor}">${texto}</button>`;
  el.innerHTML = `
    <span>${link('perfis', plural(PERFIS.length, 'perfil', 'perfis'))}${PERFIS.length ? `, ${ativos === PERFIS.length ? (ativos === 1 ? 'ativo' : 'todos ativos') : `${ativos} ${ativos === 1 ? 'ativo' : 'ativos'}`}` : ''}</span>
    <span>${link('matriz-usuarios', plural(USUARIOS.length, 'usuário', 'usuários'))}</span>
    ${semPerfil ? `<span>${link('matriz-usuarios', `${semPerfil} sem perfil`, 'text-cobre-tinta decoration-cobre/40')} <span class="text-tinta-3">não ${semPerfil === 1 ? 'acessa' : 'acessam'} nada</span></span>` : ''}`;
}

const VISOES = [
  { id: 'perfis', rotulo: 'Perfis' },
  { id: 'matriz-permissoes', rotulo: 'Permissões × perfis' },
  { id: 'matriz-usuarios', rotulo: 'Usuários × perfis' },
  { id: 'validacao', rotulo: 'Validar acesso' },
];

function renderTrocaVisao() {
  const container = document.getElementById('troca-visao');
  container.innerHTML = `
    <nav class="flex gap-5" aria-label="Visões">
      ${VISOES.map((visao) => `
        <button type="button" data-visao="${visao.id}" ${estado.visao === visao.id ? 'aria-current="page"' : ''}
          class="-mb-px py-2.5 text-[13px] font-medium border-b-2 transition
            ${estado.visao === visao.id ? 'border-tinta text-tinta' : 'border-transparent text-tinta-3 hover:text-tinta-2'}">
          ${visao.rotulo}
        </button>`).join('')}
    </nav>`;
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
    return '<p class="text-xs text-tinta-3 px-2 py-3 text-center">Nenhum perfil encontrado.</p>';
  }
  return perfis.map((perfil) => {
    const membros = membrosDoPerfil(perfil.id).length;
    const selecionado = perfil.id === estado.perfilSelecionadoId;
    return `
      <button type="button" data-escolher-perfil="${perfil.id}"
        class="w-full flex items-center gap-2 px-2 h-8 rounded-md text-left transition hover:bg-realce ${selecionado ? 'bg-realce' : ''}">
        <span class="h-[7px] w-[7px] shrink-0 rounded-full ${perfil.ativo ? 'bg-bom' : 'bg-tinta-3/60'}"></span>
        <span class="flex-1 min-w-0 truncate ${perfil.ativo ? 'text-tinta' : 'text-tinta-3'}">${esc(perfil.nome)}${perfil.ativo ? '' : ' (inativo)'}</span>
        <span class="text-xs text-tinta-3 shrink-0 tabular-nums">${plural(membros, 'usuário', 'usuários')}</span>
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
    container.innerHTML = `
      <div class="px-6 py-16 max-w-md">
        ${cabecalhoModal('Nenhum perfil de acesso ainda', 'Os perfis definem o que cada grupo de usuários pode ver e fazer no sistema. Comece criando o primeiro.')}
        <button type="button" data-criar-primeiro class="${BOTAO_PRI} mt-4">${icone(D.mais, 'h-4 w-4', 2)} Criar primeiro perfil</button>
      </div>`;
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
      <span id="contagem-lista" class="ml-auto text-tinta-3 tabular-nums"></span>
    </div>
    <div id="tabela-perfis" class="flex-1 min-h-0 overflow-auto"></div>`;

  const atualizar = () => {
    const perfis = perfisFiltrados();
    container.querySelector('#tabela-perfis').innerHTML = htmlTabelaPerfis(perfis);
    container.querySelector('#contagem-lista').textContent = perfis.length === PERFIS.length
      ? plural(PERFIS.length, 'perfil', 'perfis')
      : `${perfis.length} de ${PERFIS.length} perfis`;
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
    if (e.target.closest('a')) return;
    const linha = e.target.closest('[data-abrir]');
    if (linha) location.href = urlDetalhe(linha.dataset.abrir);
  });

  atualizar();
}

// Até três avatares dos membros e a contagem.
function htmlPilhaMembros(membros) {
  if (!membros.length) return '<span class="text-tinta-3">Ninguém</span>';
  return `
    <span class="inline-flex items-center gap-2">
      <span class="flex gap-1">${membros.slice(0, 3).map((u) => avatarHtml(u, 'h-[22px] w-[22px] text-[9.5px]')).join('')}</span>
      <span class="tabular-nums text-tinta-2">${membros.length}</span>
    </span>`;
}

function htmlCobertura(n, total) {
  const pct = total ? Math.round((n / total) * 100) : 0;
  return `
    <span class="inline-flex items-center gap-2.5 tabular-nums">
      <span><span class="text-tinta">${n}</span> <span class="text-tinta-3">de ${total}</span></span>
      <span class="h-1 w-12 rounded-full bg-linha overflow-hidden" aria-hidden="true"><span class="block h-full rounded-full bg-tinta-3" style="width:${pct}%"></span></span>
    </span>`;
}

function htmlTabelaPerfis(perfis) {
  if (!perfis.length) {
    return `<p class="px-6 py-10 text-tinta-2">Nenhum perfil encontrado com esse filtro. <button type="button" data-limpar-filtros class="${LINK} ml-1 text-tinta">Limpar filtros</button></p>`;
  }
  const th = (texto, extra = '') => `<th scope="col" class="sticky top-0 z-10 h-8 px-3 bg-papel text-left text-xs font-medium text-tinta-3 border-b border-linha whitespace-nowrap ${extra}">${texto}</th>`;
  const td = 'h-9 px-3 border-b border-linha whitespace-nowrap transition-colors group-hover:bg-realce';
  return `
    <table class="min-w-full border-separate border-spacing-0">
      <thead>
        <tr>
          ${th('Perfil', 'pl-6 w-[32%]')}
          ${th('Usuários', 'border-l w-[16%]')}
          ${th('Telas liberadas', 'border-l w-[20%]')}
          ${th('Ações liberadas', 'border-l w-[14%] text-right')}
          ${th('Status', 'border-l')}
        </tr>
      </thead>
      <tbody>
        ${perfis.map((p) => {
          const { telas, acoes } = contagemPermissoes(p);
          return `
            <tr data-abrir="${p.id}" class="group cursor-pointer">
              <td class="${td} pl-6">
                <a href="${urlDetalhe(p.id)}" class="font-medium ${p.ativo ? 'text-tinta' : 'text-tinta-3'} hover:underline decoration-linha-forte underline-offset-[3px]">${esc(p.nome)}</a>
              </td>
              <td class="${td} border-l">${htmlPilhaMembros(membrosDoPerfil(p.id))}</td>
              <td class="${td} border-l">${htmlCobertura(telas, FEATURES.length)}</td>
              <td class="${td} border-l text-right tabular-nums">${acoes}</td>
              <td class="${td} border-l">${statusHtml(p.ativo)}</td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

// ---------- Detalhe do perfil ----------

function navPerfilHtml(perfil, d, rotulo) {
  const classe = 'inline-grid place-items-center h-6 w-6 rounded-md border border-linha-forte text-tinta-2';
  return perfil
    ? `<a href="${urlDetalhe(perfil.id)}" class="${classe} transition hover:bg-realce hover:text-tinta" title="${rotulo}: ${esc(perfil.nome)}" aria-label="${rotulo}">${icone(d, 'h-3.5 w-3.5', 2)}</a>`
    : `<span class="${classe} opacity-40" aria-hidden="true">${icone(d, 'h-3.5 w-3.5', 2)}</span>`;
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
  const propriedade = (d, texto) => `<span class="inline-flex items-center gap-1.5">${icone(d, 'h-3.5 w-3.5 text-tinta-3')}${texto}</span>`;

  const abas = [
    { id: 'permissoes', rotulo: 'Permissões' },
    { id: 'usuarios', rotulo: 'Usuários', contagem: membros.length },
  ];

  container.innerHTML = `
    <div class="h-11 px-6 flex items-center gap-2 border-b border-linha text-tinta-3">
      <a href="${URL_LISTA}" class="transition hover:text-tinta">Perfis de acesso</a>
      <span class="text-linha-forte" aria-hidden="true">/</span>
      <div class="relative min-w-0" id="seletor-perfil-atual">
        <button type="button" id="btn-perfil-atual" title="Trocar de perfil" aria-haspopup="true" aria-expanded="false"
          class="inline-flex items-center gap-1 max-w-xs h-7 -mx-1.5 px-1.5 rounded-md font-medium text-tinta transition hover:bg-realce">
          <span class="truncate">${esc(perfil.nome)}</span>${icone(D.baixo, 'h-3.5 w-3.5 text-tinta-3', 2)}
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
    </div>

    <div class="px-6 pt-5 pb-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div class="min-w-0">
        <h2 class="font-registro text-[26px] leading-[1.15] font-semibold tracking-[-0.01em] text-tinta">${esc(perfil.nome)}</h2>
        <p class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-tinta-2">
          ${statusHtml(perfil.ativo)}
          ${propriedade(D.tela, `<span><span class="tabular-nums">${telasLiberadas} de ${FEATURES.length}</span> telas liberadas</span>`)}
          ${propriedade(D.acao, `<span class="tabular-nums">${plural(totalAcoes, 'ação', 'ações')}</span>`)}
          ${propriedade(D.usuarios, `<span class="tabular-nums">${plural(membros.length, 'usuário', 'usuários')}</span>`)}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <label class="inline-flex items-center gap-2 h-8 pr-2 text-tinta-2 cursor-pointer">
          Perfil ativo
          ${switchHtml(perfil.ativo, 'data-toggle-ativo', perfil.ativo ? 'Inativar perfil (suspende as permissões sem perder a configuração)' : 'Reativar perfil')}
        </label>
        <button type="button" data-duplicar title="Duplicar perfil (copia as permissões, sem os usuários)" class="${BOTAO_SEC}">
          ${icone(D.copiar, 'h-4 w-4 text-tinta-3')} Duplicar
        </button>
        <button type="button" data-excluir title="Excluir perfil" aria-label="Excluir perfil" class="${BOTAO_ICONE} hover:text-ruim! hover:bg-ruim/10!">
          ${icone(D.lixo)}
        </button>
      </div>
    </div>

    ${perfil.protegido ? `
      <div class="mx-6 mb-4 rounded-lg bg-selecao px-3 py-2 text-tinta">
        Perfil protegido: o Administrador sempre tem acesso a todas as telas, inclusive as que forem criadas depois. Não pode ser editado, inativado nem excluído — duplique-o para criar uma variação.
      </div>` : ''}
    ${SOMENTE_LEITURA ? '<div class="mx-6 mb-4 rounded-lg bg-faixa px-3 py-2 text-tinta-2">Somente consulta: seu perfil não gerencia perfis de acesso.</div>' : ''}
    ${perfil.ativo ? '' : `
      <div class="mx-6 mb-4 flex items-center gap-2 rounded-lg bg-aviso/10 px-3 py-2 text-tinta">
        <span class="h-[7px] w-[7px] shrink-0 rounded-full bg-aviso"></span>
        Perfil inativo — as permissões abaixo estão suspensas e voltam a valer quando o perfil for reativado.
      </div>`}

    <div class="px-6 flex gap-5 border-b border-linha">
      ${abas.map((aba) => `
        <button type="button" data-aba="${aba.id}" ${estado.aba === aba.id ? 'aria-current="page"' : ''}
          class="-mb-px inline-flex items-center gap-1.5 py-2.5 text-[13px] font-medium border-b-2 transition
            ${estado.aba === aba.id ? 'border-tinta text-tinta' : 'border-transparent text-tinta-3 hover:text-tinta-2'}">
          ${aba.rotulo}${aba.contagem === undefined ? '' : `<span class="tabular-nums text-tinta-3">${aba.contagem}</span>`}
        </button>`).join('')}
    </div>

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

  container.querySelector('[data-toggle-ativo]').addEventListener('click', () => {
    if (bloqueado(perfil.id)) return;
    Permissoes.alternarPerfilAtivo(perfil.id);
    salvar();
    toast(`Perfil "${perfil.nome}" ${perfil.ativo ? 'reativado' : 'inativado'}`, perfil.ativo ? 'ok' : 'alerta');
    renderTudo();
  });

  container.querySelector('[data-duplicar]').addEventListener('click', () => {
    abrirModalDuplicarPerfil(perfil);
  });

  container.querySelector('[data-excluir]').addEventListener('click', () => {
    if (bloqueado(perfil.id)) return;
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
  });

  container.querySelectorAll('[data-aba]').forEach((el) => {
    el.addEventListener('click', () => {
      estado.aba = el.dataset.aba;
      renderDetalhe();
    });
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
      if (bloqueado()) return;
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
      <button type="button" id="btn-expandir-modulos" data-expandir="${!todosAbertos}" class="${BOTAO_FANTASMA} ml-auto">
        ${icone(todosAbertos ? D.recolher : D.expandir, 'h-3.5 w-3.5', 2)}
        ${todosAbertos ? 'Minimizar todos' : 'Expandir todos'}
      </button>
    </div>
    <div id="container-modulos">${htmlModulos(perfil)}</div>`;
}

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

    return `
      <section>
        <div class="flex items-center gap-1 h-9 pl-4 pr-5 bg-faixa border-b border-linha">
          <button type="button" data-toggle-modulo="${modulo.id}" aria-expanded="${aberto}"
            class="flex-1 flex items-center gap-2 h-7 px-1.5 rounded-md text-left">
            ${icone(D.direita, `h-3.5 w-3.5 text-tinta-3 transition-transform ${aberto ? 'rotate-90' : ''}`, 2)}
            <span class="font-semibold text-tinta">${esc(modulo.nome)}</span>
            <span class="tabular-nums ${ativas ? 'text-tinta-2' : 'text-tinta-3'}">${ativas} de ${total} ações</span>
          </button>
          <button type="button" data-modulo-tudo="${modulo.id}" title="Liberar todas as ações do módulo" class="${BOTAO_FANTASMA}">Liberar tudo</button>
          <button type="button" data-modulo-nenhum="${modulo.id}" title="Remover todas as ações do módulo" class="${BOTAO_FANTASMA}">Limpar</button>
        </div>
        ${aberto ? features.map((f) => htmlLinhaFeature(perfil, f)).join('') : ''}
      </section>`;
  }).filter(Boolean);

  return secoes.join('') ||
    `<p class="px-6 py-10 text-tinta-2">Nenhuma tela ou ação encontrada para "${esc(estado.busca)}".</p>`;
}

function htmlLinhaFeature(perfil, feature) {
  const ativas = perfil.permissoes[feature.id] || [];
  const acessoTela = ativas.includes('visualizar');
  return `
    <div class="grid grid-cols-[14rem_minmax(0,1fr)] items-center gap-x-6 gap-y-2 pl-10 pr-6 py-2.5 border-b border-linha">
      <div class="min-w-0">
        <p class="font-medium text-tinta">${esc(feature.nome)}</p>
        <p class="inline-flex items-center gap-1.5 text-xs ${acessoTela ? 'text-tinta-2' : 'text-tinta-3'}"><span class="h-1.5 w-1.5 rounded-full ${acessoTela ? 'bg-bom' : 'bg-tinta-3/50'}"></span>${acessoTela ? 'tela liberada' : 'sem acesso à tela'}</p>
      </div>
      <div class="flex flex-wrap gap-1.5">
        ${feature.acoes.map((acao) => {
          const ligada = ativas.includes(acao.id);
          return `
            <button type="button" data-feature="${feature.id}" data-acao="${acao.id}" aria-pressed="${ligada}"
              class="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border text-[12.5px] font-medium transition
                ${ligada
                  ? 'bg-marca border-marca text-sobre-marca hover:bg-marca/90'
                  : 'bg-elevado border-linha-forte text-tinta-2 hover:border-tinta-3 hover:text-tinta'}">
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
      if (bloqueado(perfil.id)) return;
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
      if (bloqueado(perfil.id)) return;
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
      if (bloqueado(perfil.id)) return;
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
      <span class="ml-auto text-tinta-3">Use o interruptor para incluir ou remover do perfil.</span>
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

  if (!filtrados.length) {
    return '<p class="px-6 py-10 text-tinta-2">Nenhum usuário encontrado com esse filtro.</p>';
  }

  return `
    <ul>
      ${filtrados.map((usuario) => {
        const incluido = usuario.perfis.includes(perfil.id);
        const outros = usuario.perfis
          .filter((id) => id !== perfil.id)
          .map((id) => Permissoes.getPerfil(id)?.nome)
          .filter(Boolean);
        return `
          <li class="group flex items-center gap-3 px-6 h-12 border-b border-linha transition-colors hover:bg-realce">
            ${avatarHtml(usuario, 'h-7 w-7 text-[10px]')}
            <div class="min-w-0 flex-1">
              <p class="font-medium text-tinta truncate">${esc(usuario.nome)}</p>
              <p class="text-xs text-tinta-3 truncate">${outros.length ? `Também em: ${esc(outros.join(', '))}` : 'Sem outros perfis'}</p>
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
        class="ml-auto shrink-0 inline-flex items-center h-6 px-2 rounded bg-selecao text-marca-tinta text-xs font-medium tabular-nums transition hover:bg-marca/15">+${plural(total, 'extra', 'extras')}</button>`
    : `<button type="button" data-abrir-extras="${usuario.id}" title="Conceder permissões extras a ${esc(usuario.nome)}"
        class="${sobreposto ? 'absolute right-2 top-1/2 -translate-y-1/2 bg-realce' : ''} shrink-0 inline-flex items-center h-6 px-2 rounded text-xs font-medium text-tinta-3 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 hover:bg-etiqueta hover:text-tinta">+ extras</button>`;
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
        <span id="contagem-colunas" class="tabular-nums font-normal text-tinta-3">${perfisExibidos().length} de ${PERFIS.length}</span>
        ${icone(D.baixo, 'h-3.5 w-3.5 text-tinta-3', 2)}
      </button>
      <div id="popover-colunas" class="hidden ${POPOVER} right-0 w-72 z-40">
        <input id="busca-colunas" type="search" value="${esc(estado.buscaColunas)}" placeholder="Buscar perfil…" autocomplete="off" aria-label="Buscar perfil"
          class="${CAMPO} w-full">
        <div id="lista-colunas" class="max-h-60 overflow-y-auto mt-1.5">${htmlListaColunas()}</div>
        <div class="flex items-center justify-between mt-1.5 pt-1.5 border-t border-linha">
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
    return '<p class="text-xs text-tinta-3 px-2 py-3 text-center">Nenhum perfil encontrado.</p>';
  }
  return perfis.map((perfil) => {
    const marcado = !estado.perfisVisiveis || estado.perfisVisiveis.has(perfil.id);
    return `
      <label class="flex items-center gap-2.5 px-2 h-8 rounded-md cursor-pointer transition hover:bg-realce">
        <input type="checkbox" data-coluna-perfil="${perfil.id}" ${marcado ? 'checked' : ''} class="h-3.5 w-3.5 accent-marca-tinta">
        <span class="h-[7px] w-[7px] shrink-0 rounded-full ${perfil.ativo ? 'bg-bom' : 'bg-tinta-3/60'}"></span>
        <span class="truncate ${perfil.ativo ? 'text-tinta' : 'text-tinta-3'}">${esc(perfil.nome)}</span>
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

// Cabeçalho de coluna das matrizes: nome do perfil (link para o detalhe) e um dado.
function thPerfilHtml(perfil, detalhe, z = 'z-20') {
  return `
    <th scope="col" class="sticky top-0 ${z} bg-papel px-2 pt-2.5 pb-2 border-b border-l border-linha text-center align-bottom min-w-[104px]">
      <a href="${urlDetalhe(perfil.id)}" class="inline-flex items-center justify-center gap-1.5 text-[12.5px] font-medium leading-tight ${perfil.ativo ? 'text-tinta' : 'text-tinta-3'} hover:underline decoration-linha-forte underline-offset-[3px]">
        <span class="h-[7px] w-[7px] shrink-0 rounded-full ${perfil.ativo ? 'bg-bom' : 'bg-tinta-3/60'}"></span>${esc(perfil.nome)}
      </a>
      <span class="block mt-0.5 text-[11.5px] font-normal text-tinta-3 tabular-nums">${perfil.ativo ? detalhe : 'inativo'}</span>
    </th>`;
}

const SEM_COLUNAS = '<p class="px-6 py-10 text-tinta-2">Nenhum perfil selecionado — escolha as colunas em "Perfis exibidos".</p>';

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
    if (bloqueado()) return;
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
  if (!usuarios.length) {
    return '<p class="px-6 py-10 text-tinta-2">Nenhum usuário encontrado.</p>';
  }

  return `
    <div id="scroll-matriz" class="flex-1 min-h-0 overflow-auto">
      <table class="min-w-full border-separate border-spacing-0">
        <thead>
          <tr>
            <th scope="col" class="sticky top-0 left-0 z-30 bg-papel pl-6 pr-3 pb-2 border-b border-linha text-left align-bottom text-xs font-medium text-tinta-3 min-w-[280px]">Usuário</th>
            ${colunas.map((perfil) => thPerfilHtml(perfil, plural(membrosDoPerfil(perfil.id).length, 'usuário', 'usuários'))).join('')}
          </tr>
        </thead>
        <tbody>
          ${usuarios.map((usuario) => `
            <tr class="group">
              <td class="sticky left-0 z-10 bg-papel group-hover:bg-realce h-10 pl-6 pr-2 border-b border-linha transition-colors">
                <div class="flex items-center gap-1.5 min-w-0">
                  <button type="button" data-validar-usuario="${usuario.id}" title="Ver o acesso consolidado de ${esc(usuario.nome)}"
                    class="flex items-center gap-2 min-w-0 rounded-md text-left hover:underline decoration-linha-forte underline-offset-[3px]">
                    ${avatarHtml(usuario, 'h-[22px] w-[22px] text-[9.5px]')}
                    <span class="font-medium text-tinta truncate">${esc(usuario.nome)}</span>
                  </button>
                  ${usuario.perfis.length ? '' : TAG_SEM_PERFIL}
                  ${botaoExtrasHtml(usuario, { sobreposto: true })}
                </div>
              </td>
              ${colunas.map((perfil) => {
                const incluido = usuario.perfis.includes(perfil.id);
                return `
                  <td class="h-10 px-2 text-center border-b border-l border-linha transition-colors group-hover:bg-realce ${perfil.ativo ? '' : 'opacity-50'}">
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
    if (!botao || bloqueado(botao.dataset.mxPerfil)) return;
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
        <td colspan="${totalColunas}" data-sticky-modulo class="sticky left-0 z-20 bg-faixa h-8 pl-6 font-semibold text-tinta border-b border-linha">${esc(modulo.nome)}</td>
      </tr>
      ${features.map(({ feature, acoes }) => `
        <tr>
          <td colspan="${totalColunas}" data-sticky-feature class="sticky left-0 z-[15] bg-papel h-8 pl-6 font-medium text-tinta border-b border-linha">${esc(feature.nome)}</td>
        </tr>
        ${acoes.map((acao) => `
          <tr class="group">
            <td class="sticky left-0 z-10 bg-papel group-hover:bg-realce h-9 pl-10 pr-3 border-b border-linha text-tinta-2 min-w-[260px] transition-colors">${esc(acao.nome)}</td>
            ${colunas.map((perfil) => {
              const ligada = (perfil.permissoes[feature.id] || []).includes(acao.id);
              return `
                <td class="h-9 px-2 text-center border-b border-l border-linha transition-colors group-hover:bg-realce ${perfil.ativo ? '' : 'opacity-50'}">
                  ${miniSwitchHtml(ligada, `data-mx-perfil="${perfil.id}" data-mx-feature="${feature.id}" data-mx-acao="${acao.id}"`, `${perfil.nome} — ${feature.nome} · ${acao.nome}`)}
                </td>`;
            }).join('')}
          </tr>`).join('')}`).join('')}`;
  }).filter(Boolean);

  if (!linhas.length) {
    return `<p class="px-6 py-10 text-tinta-2">Nenhuma tela ou ação encontrada para "${esc(estado.buscaMatriz)}".</p>`;
  }

  return `
    <div id="scroll-matriz" class="flex-1 min-h-0 overflow-auto">
      <table class="min-w-full border-separate border-spacing-0">
        <thead>
          <tr>
            <th scope="col" class="sticky top-0 left-0 z-40 bg-papel pl-6 pr-3 pb-2 border-b border-linha text-left align-bottom text-xs font-medium text-tinta-3 min-w-[260px]">Tela / Ação</th>
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
          <span id="rotulo-usuario-validacao" class="flex-1 flex items-center gap-2 min-w-0 text-tinta-3">Selecione um usuário…</span>
          ${icone(D.baixo, 'h-3.5 w-3.5 text-tinta-3', 2)}
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
      <span class="ml-auto text-tinta-3">União dos perfis ativos mais as permissões extras.</span>
    </div>
    <div id="validacao-conteudo" class="flex-1 min-h-0 overflow-auto"></div>`;

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
    return '<p class="text-xs text-tinta-3 px-2 py-3 text-center">Nenhum usuário encontrado.</p>';
  }
  return usuarios.map((usuario) => {
    const selecionado = usuario.id === estado.usuarioInspecionadoId;
    const perfis = usuario.perfis.map((id) => Permissoes.getPerfil(id)?.nome).filter(Boolean);
    return `
      <button type="button" data-usuario-validacao="${usuario.id}"
        class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition hover:bg-realce ${selecionado ? 'bg-realce' : ''}">
        ${avatarHtml(usuario, 'h-6 w-6 text-[10px]')}
        <span class="flex-1 min-w-0">
          <span class="block truncate text-tinta">${esc(usuario.nome)}</span>
          <span class="block text-xs truncate ${perfis.length ? 'text-tinta-3' : 'text-cobre-tinta'}">${perfis.length ? esc(perfis.join(', ')) : 'sem perfil'}</span>
        </span>
        ${selecionado ? CHECK : ''}
      </button>`;
  }).join('');
}

// Cabeçalho de portal (faixa) e rótulo de módulo, usados na validação e nas extras.
function faixaPortalHtml(portal, detalhe = '') {
  return `<h4 class="sticky top-0 z-10 flex items-center gap-2 h-9 px-6 bg-faixa border-b border-linha font-semibold text-tinta">${esc(portal.nome)}${detalhe ? `<span class="font-normal text-tinta-3">${detalhe}</span>` : ''}</h4>`;
}

function rotuloModuloHtml(modulo) {
  return `<p class="px-6 pt-3 pb-1 text-xs font-medium text-tinta-3">${esc(modulo.nome)}</p>`;
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
    <div class="flex items-start gap-3 px-5 pt-4 pb-3 border-b border-linha">
      ${avatarHtml(usuario, 'h-9 w-9 text-xs')}
      <div class="min-w-0 flex-1">
        <h3 class="text-base font-semibold text-tinta">Permissões extras · ${esc(usuario.nome)}</h3>
        <p class="text-tinta-2 mt-0.5">Perfis: ${nomesPerfis.length ? esc(nomesPerfis.join(', ')) : '<span class="text-cobre-tinta">nenhum</span>'}</p>
      </div>
      <button type="button" data-fechar-modal-extras title="Fechar" aria-label="Fechar" class="${BOTAO_ICONE} -mr-2 -mt-1">${icone(D.fechar)}</button>
    </div>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-2.5 border-b border-linha">
      ${campoBusca('busca-extras', '', 'Buscar tela ou ação…', 'w-56')}
      <span class="ml-auto flex flex-wrap gap-x-3 gap-y-1 text-xs text-tinta-3">
        ${amostra('bg-etiqueta border border-linha-forte', 'dos perfis')}
        ${amostra('bg-selecao border border-marca-tinta/40', 'extra deste usuário')}
        ${amostra('border border-linha-forte', 'clique para conceder')}
      </span>
    </div>
    <div id="conteudo-extras" class="flex-1 min-h-0 overflow-y-auto pb-3">${htmlConteudoExtras(usuario)}</div>`,
  { largura: 'max-w-2xl', semPadding: true, rotulo: `Permissões extras de ${usuario.nome}` });

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
    if (!botao || bloqueado()) return;
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
  const chip = 'inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[12.5px] transition';

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
          <div class="px-6 py-2.5 border-b border-linha">
            <p class="font-medium text-tinta mb-1.5">
              ${esc(feature.nome)}
              ${Permissoes.pode(usuario, feature.id, 'visualizar') ? '' : '<span class="ml-1.5 text-xs font-normal text-aviso">sem acesso à tela — conceda "Visualizar"</span>'}
            </p>
            <div class="flex flex-wrap gap-1.5">
              ${acoes.map((acao) => {
                if (Permissoes.concedidaPorPerfis(usuario, feature.id, acao.id)) {
                  return `<span class="${chip} bg-etiqueta text-etiqueta-tinta cursor-default"
                    title="Concedida pelos perfis do usuário — para remover, ajuste o perfil">${icone(D.check, 'h-3 w-3', 2.5)}${esc(acao.nome)}</span>`;
                }
                if (Permissoes.concedidaPorExtra(usuario, feature.id, acao.id)) {
                  return `<button type="button" data-ex-feature="${feature.id}" data-ex-acao="${acao.id}" aria-pressed="true"
                    class="${chip} font-medium border border-marca-tinta/40 bg-selecao text-marca-tinta hover:border-marca-tinta"
                    title="Permissão extra — clique para remover">${icone(D.check, 'h-3 w-3', 2.5)}${esc(acao.nome)}</button>`;
                }
                return `<button type="button" data-ex-feature="${feature.id}" data-ex-acao="${acao.id}" aria-pressed="false"
                  class="${chip} font-medium border border-linha-forte bg-elevado text-tinta-2 hover:border-tinta-3 hover:text-tinta"
                  title="Clique para conceder como permissão extra">${esc(acao.nome)}</button>`;
              }).join('')}
            </div>
          </div>`).join('')}`;
    }).filter(Boolean);

    if (!modulosHtml.length) return '';

    return `<section>${faixaPortalHtml(portal)}${modulosHtml.join('')}</section>`;
  }).filter(Boolean);

  return secoes.join('') ||
    `<p class="px-6 py-10 text-tinta-2">Nenhuma tela ou ação encontrada para "${esc(estado.buscaExtras)}".</p>`;
}

function renderConteudoValidacao() {
  const container = document.getElementById('validacao-conteudo');
  if (!container) return;
  const usuario = Permissoes.getUsuario(estado.usuarioInspecionadoId);

  // Atualiza o rótulo do combobox de usuário.
  const rotulo = document.getElementById('rotulo-usuario-validacao');
  if (rotulo) {
    rotulo.className = `flex-1 flex items-center gap-2 min-w-0 ${usuario ? 'text-tinta' : 'text-tinta-3'}`;
    rotulo.innerHTML = usuario
      ? `${avatarHtml(usuario, 'h-5 w-5 text-[9px]')}<span class="truncate font-medium">${esc(usuario.nome)}</span>`
      : 'Selecione um usuário…';
  }

  // Botão "Permissões extras" só faz sentido com um usuário escolhido.
  const botaoExtras = document.getElementById('btn-extras-validacao');
  if (botaoExtras) botaoExtras.disabled = !usuario;

  if (!usuario) {
    container.innerHTML = `
      <div class="px-6 py-12 max-w-md">
        ${cabecalhoModal('Selecione um usuário', 'Escolha um usuário acima para ver o acesso consolidado dele — a união dos perfis ativos mais as permissões extras.')}
      </div>`;
    return;
  }

  const perfisHtml = usuario.perfis
    .map((id) => {
      const perfil = Permissoes.getPerfil(id);
      return perfil
        ? `<a href="${urlDetalhe(perfil.id)}" class="${LINK} ${perfil.ativo ? 'text-tinta' : 'text-tinta-3'}">${esc(perfil.nome)}</a>${perfil.ativo ? '' : ' <span class="text-tinta-3">(inativo)</span>'}`
        : null;
    })
    .filter(Boolean);
  const extras = Permissoes.totalExtras(usuario);

  let telas = 0;
  const semAcesso = [];
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
        ${rotuloModuloHtml(modulo)}
        ${acessiveis.map(({ feature, liberadas }) => `
          <div class="grid grid-cols-[14rem_minmax(0,1fr)] items-center gap-x-6 gap-y-1.5 px-6 py-2 border-b border-linha">
            <span class="truncate font-medium text-tinta">${esc(feature.nome)}</span>
            <div class="flex flex-wrap gap-1.5">
              ${liberadas.map((acao) => `
                <span class="inline-flex items-center h-6 px-2 rounded text-xs ${acao.somenteExtra ? 'bg-selecao text-marca-tinta font-medium' : 'bg-etiqueta text-etiqueta-tinta'}"
                  title="Concedida por: ${esc(acao.origens.join(', '))}">${esc(acao.nome)}${acao.somenteExtra ? '<span class="ml-1 font-normal opacity-75">· extra</span>' : ''}</span>`).join('')}
            </div>
          </div>`).join('')}`;
    }).filter(Boolean);

    if (!modulosComAcesso.length) return '';
    telas += telasPortal;

    return `<section>${faixaPortalHtml(portal, plural(telasPortal, 'tela', 'telas'))}${modulosComAcesso.join('')}</section>`;
  }).filter(Boolean);

  container.innerHTML = `
    <div class="px-6 pt-5 pb-4 flex items-center gap-3">
      ${avatarHtml(usuario, 'h-10 w-10 text-[13px]')}
      <div class="min-w-0">
        <h3 class="font-registro text-[22px] leading-tight font-semibold tracking-[-0.01em] text-tinta">${esc(usuario.nome)}</h3>
        <p class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-tinta-2">
          <span>Perfis: ${perfisHtml.length ? perfisHtml.join(', ') : '<span class="font-medium text-cobre-tinta">nenhum</span>'}</span>
          ${extras ? `<span class="tabular-nums">${plural(extras, 'permissão extra', 'permissões extras')}</span>` : ''}
          <span class="tabular-nums">${plural(telas, 'tela liberada', 'telas liberadas')}</span>
        </p>
      </div>
    </div>
    ${secoes.length ? `<div class="border-t border-linha">${secoes.join('')}</div>` : '<p class="px-6 py-8 text-tinta-2 border-t border-linha">Este usuário não tem acesso a nenhuma tela.</p>'}
    ${secoes.length && semAcesso.length ? `<p class="px-6 py-4 text-tinta-3">Sem acesso: ${esc(semAcesso.join(', '))}</p>` : ''}`;
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
  document.getElementById('visao-perfis').hidden = !mostrarPerfis;
  document.getElementById('visao-matriz').hidden = mostrarPerfis;

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
    // URL antiga (permissoes.html?perfil=) → detalhe.
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
