// ============================================================
// UI de gestão do permissionamento. Toda operação passa pelo
// motor (Permissoes.*) — a UI apenas reflete o resultado.
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
  tipoUsuarios: 'todos', // 'todos' | tipoId — filtro por tipo na aba Usuários
  tipoMatrizUsuarios: 'todos', // idem na matriz Usuários × perfis
  visao: 'perfis', // 'perfis' | 'matriz-permissoes' | 'matriz-usuarios' | 'validacao' (só na lista)
  buscaLista: '',
  tipoLista: 'todos', // filtro da lista de perfis por tipo de usuário
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

function iniciais(nome) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] || '') + (partes[1]?.[0] || '')).toUpperCase();
}

function avatarHtml(usuario, tamanho = 'h-7 w-7 text-[10px]') {
  return `<span class="${tamanho} bg-selecao text-tinta rounded-full grid place-items-center font-semibold ring-2 ring-elevado" title="${esc(usuario.nome)}">${iniciais(usuario.nome)}</span>`;
}

function membrosDoPerfil(perfilId) {
  return USUARIOS.filter((u) => u.perfis.includes(perfilId));
}

// ---------- Tipos de usuário (colaborador / professor / aluno) ----------

const COR_TIPO = {
  colaborador: 'bg-selecao text-marca-tinta border-marca-tinta/30',
  instrutor: 'bg-selecao text-marca-tinta border-marca-tinta/30',
  aluno: 'bg-bom/10 text-bom border-bom/30',
};

function chipTipoHtml(tipo, extra = '') {
  return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${COR_TIPO[tipo.id] || 'bg-etiqueta text-tinta-2 border-linha'} ${extra}">${esc(tipo.nome)}</span>`;
}

// Chips dos tipos do usuário; cada um abre o cadastro de origem.
function tiposUsuarioHtml(usuario, { link = true } = {}) {
  const vinculos = usuario.vinculos || [];
  if (!vinculos.length) {
    return '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-cobre/15 text-aviso border-cobre/40" title="Usuário sem cadastro de origem">Sem vínculo</span>';
  }
  return vinculos.map((v) => {
    const tipo = Permissoes.getTipo(v.tipo);
    if (!tipo) return '';
    const chip = chipTipoHtml(tipo, link ? 'hover:underline underline-offset-2' : '');
    return link
      ? `<a href="${tipo.cadastro}${encodeURIComponent(v.id)}" title="Abrir cadastro em ${esc(tipo.lista)}" class="inline-flex">${chip}</a>`
      : chip;
  }).join(' ');
}

function tiposPerfilTexto(perfil) {
  const tipos = Permissoes.tiposDoPerfil(perfil);
  return tipos.length ? tipos.map((t) => t.plural).join(' · ') : 'Ninguém (sem tipo definido)';
}

// Cartões-checkbox "para quem é o perfil" (modal de criação/edição).
function htmlCartoesTipos(selecionados = []) {
  return `
    <div class="grid gap-2 mt-1.5" data-cartoes-tipos>
      ${TIPOS_USUARIO.map((t) => `
        <label class="flex items-start gap-3 px-3.5 py-3 rounded-xl border cursor-pointer transition
          has-[:checked]:border-marca has-[:checked]:bg-selecao
          border-linha hover:border-tinta-3/60">
          <input type="checkbox" name="tipo" value="${t.id}" ${selecionados.includes(t.id) ? 'checked' : ''}
            class="mt-0.5 h-4 w-4 rounded border-linha-forte text-marca-tinta">
          <span class="min-w-0">
            <span class="flex items-center gap-2 text-sm font-medium text-tinta">${esc(t.plural)} ${chipTipoHtml(t)}</span>
            <span class="block text-xs text-tinta-2 mt-0.5">${esc(t.descricao)}</span>
          </span>
        </label>`).join('')}
    </div>`;
}

function tiposMarcados(root) {
  return [...root.querySelectorAll('[data-cartoes-tipos] input:checked')].map((i) => i.value);
}

// <select> de tipo usado como filtro nas listas de usuários.
function selectTipoHtml(id, valor, tiposDisponiveis = TIPOS_USUARIO) {
  return `
    <select id="${id}" class="border border-linha-forte rounded-lg px-3 py-2 text-sm bg-elevado focus:border-marca-tinta">
      <option value="todos" ${valor === 'todos' ? 'selected' : ''}>Todos os tipos</option>
      ${tiposDisponiveis.map((t) => `<option value="${t.id}" ${valor === t.id ? 'selected' : ''}>${esc(t.plural)}</option>`).join('')}
    </select>`;
}

// Usuário que é só aluno (sem vínculo de colaborador/instrutor).
function somenteAluno(usuario) {
  const v = usuario.vinculos || [];
  return v.length > 0 && v.every((x) => x.tipo === 'aluno');
}

const TIPOS_MATRIZ = TIPOS_USUARIO.filter((t) => t.id !== 'aluno');

function usuarioTemTipo(usuario, tipoId) {
  return tipoId === 'todos' || (usuario.vinculos || []).some((v) => v.tipo === tipoId);
}

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

function abrirModal(conteudoHtml, { largura = 'max-w-md', semPadding = false } = {}) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-veu" data-fechar-modal></div>
      <div class="modal-anim relative bg-elevado rounded-xl shadow-[0_24px_60px_-20px_rgba(0,0,0,.4)] w-full ${largura} ${semPadding ? 'flex flex-col max-h-[90vh] overflow-hidden' : 'p-6'}">${conteudoHtml}</div>
    </div>`;
  root.querySelector('[data-fechar-modal]').addEventListener('click', fecharModal);
  root.querySelector('input, button')?.focus();
}

function fecharModal() {
  estado.usuarioExtrasId = null;
  document.getElementById('modal-root').innerHTML = '';
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

function confirmar({ titulo, mensagem, rotulo, aoConfirmar, tom = 'perigo' }) {
  abrirModal(`
    <h3 class="font-display font-semibold text-lg text-tinta">${esc(titulo)}</h3>
    <p class="text-sm text-tinta-2 mt-2">${esc(mensagem)}</p>
    <div class="mt-6 flex justify-end gap-2">
      <button data-cancelar class="btn-sec">Cancelar</button>
      <button data-confirmar class="${tom === 'perigo' ? 'btn-perigo' : 'btn-pri'}">${esc(rotulo)}</button>
    </div>`);
  const root = document.getElementById('modal-root');
  root.querySelector('[data-cancelar]').addEventListener('click', fecharModal);
  root.querySelector('[data-confirmar]').addEventListener('click', () => {
    fecharModal();
    aoConfirmar();
  });
}

function abrirModalNovoPerfil() {
  if (bloqueado()) return;
  abrirModal(`
    <h3 class="font-display font-semibold text-lg text-tinta">Novo perfil de acesso</h3>
    <p class="text-sm text-tinta-2 mt-1">O perfil é criado sem nenhuma permissão — ative as ações em seguida.</p>
    <label class="block mt-4 text-sm font-medium text-tinta">
      Nome do perfil
      <input id="input-novo-perfil" type="text" placeholder="Ex.: Secretaria acadêmica" autocomplete="off"
        class="mt-1.5 w-full border border-linha-forte rounded-lg px-3 py-2.5 text-sm focus:border-marca-tinta bg-elevado text-tinta placeholder:text-tinta-3">
    </label>
    <div class="mt-4">
      <p class="text-sm font-medium text-tinta">Para quem é este perfil</p>
      <p class="text-xs text-tinta-2 mt-0.5">Só usuários desses tipos poderão receber o perfil.</p>
      ${htmlCartoesTipos()}
    </div>
    <p id="erro-novo-perfil" class="hidden mt-2 text-sm text-ruim"></p>
    <div class="mt-6 flex justify-end gap-2">
      <button data-cancelar class="btn-sec">Cancelar</button>
      <button data-criar class="btn-pri">Criar perfil</button>
    </div>`);

  const root = document.getElementById('modal-root');
  const input = root.querySelector('#input-novo-perfil');
  const erro = root.querySelector('#erro-novo-perfil');

  const criar = () => {
    const resultado = Permissoes.criarPerfil(input.value, tiposMarcados(root));
    if (resultado.erro) {
      erro.textContent = resultado.erro;
      erro.classList.remove('hidden');
      input.focus();
      return;
    }
    salvar();
    fecharModal();
    location.href = urlDetalhe(resultado.perfil.id);
  };

  root.querySelector('[data-cancelar]').addEventListener('click', fecharModal);
  root.querySelector('[data-criar]').addEventListener('click', criar);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') criar();
  });
  input.focus();
}

function abrirModalDuplicarPerfil(perfilOrigem) {
  if (bloqueado()) return;
  abrirModal(`
    <h3 class="font-display font-semibold text-lg text-tinta">Duplicar perfil "${esc(perfilOrigem.nome)}"</h3>
    <p class="text-sm text-tinta-2 mt-1">Todas as permissões e o público (${esc(tiposPerfilTexto(perfilOrigem).toLowerCase())}) serão copiados. Os usuários vinculados <strong>não</strong> são copiados.</p>
    <label class="block mt-4 text-sm font-medium text-tinta">
      Nome do novo perfil
      <input id="input-duplicar-perfil" type="text" value="Cópia de ${esc(perfilOrigem.nome)}" autocomplete="off"
        class="mt-1.5 w-full border border-linha-forte rounded-lg px-3 py-2.5 text-sm focus:border-marca-tinta bg-elevado text-tinta placeholder:text-tinta-3">
    </label>
    <p id="erro-duplicar-perfil" class="hidden mt-2 text-sm text-ruim"></p>
    <div class="mt-6 flex justify-end gap-2">
      <button data-cancelar class="btn-sec">Cancelar</button>
      <button data-duplicar class="btn-pri">Duplicar perfil</button>
    </div>`);

  const root = document.getElementById('modal-root');
  const input = root.querySelector('#input-duplicar-perfil');
  const erro = root.querySelector('#erro-duplicar-perfil');

  const duplicar = () => {
    const resultado = Permissoes.duplicarPerfil(perfilOrigem.id, input.value);
    if (resultado.erro) {
      erro.textContent = resultado.erro;
      erro.classList.remove('hidden');
      input.focus();
      return;
    }
    salvar();
    fecharModal();
    location.href = urlDetalhe(resultado.perfil.id);
  };

  root.querySelector('[data-cancelar]').addEventListener('click', fecharModal);
  root.querySelector('[data-duplicar]').addEventListener('click', duplicar);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') duplicar();
  });
  input.focus();
  input.select();
}

function abrirModalTiposPerfil(perfil) {
  if (bloqueado(perfil.id)) return;
  abrirModal(`
    <h3 class="font-display font-semibold text-lg text-tinta">Para quem é o perfil "${esc(perfil.nome)}"</h3>
    <p class="text-sm text-tinta-2 mt-1">Usuários de um tipo que for desmarcado saem do perfil.</p>
    ${htmlCartoesTipos(perfil.tipos || [])}
    <p id="aviso-tipos-perfil" class="hidden mt-3 rounded-lg bg-cobre/15 border border-cobre/40 text-tinta text-sm px-3.5 py-2.5"></p>
    <p id="erro-tipos-perfil" class="hidden mt-2 text-sm text-ruim"></p>
    <div class="mt-6 flex justify-end gap-2">
      <button data-cancelar class="btn-sec">Cancelar</button>
      <button data-salvar class="btn-pri">Salvar</button>
    </div>`);

  const root = document.getElementById('modal-root');
  const aviso = root.querySelector('#aviso-tipos-perfil');
  const erro = root.querySelector('#erro-tipos-perfil');

  const atualizarAviso = () => {
    const sairiam = Permissoes.usuariosQueSairiam(perfil.id, tiposMarcados(root));
    aviso.classList.toggle('hidden', !sairiam.length);
    if (sairiam.length) {
      aviso.textContent = `${sairiam.length === 1 ? '1 usuário sairá' : `${sairiam.length} usuários sairão`} do perfil: ${sairiam.map((u) => u.nome).join(', ')}.`;
    }
  };
  root.querySelectorAll('[data-cartoes-tipos] input').forEach((i) => i.addEventListener('change', atualizarAviso));

  root.querySelector('[data-cancelar]').addEventListener('click', fecharModal);
  root.querySelector('[data-salvar]').addEventListener('click', () => {
    const resultado = Permissoes.definirTiposPerfil(perfil.id, tiposMarcados(root));
    if (resultado.erro) {
      erro.textContent = resultado.erro;
      erro.classList.remove('hidden');
      return;
    }
    salvar();
    fecharModal();
    toast(`Perfil "${perfil.nome}" agora é para ${tiposPerfilTexto(perfil).toLowerCase()}${resultado.removidos ? ` · ${resultado.removidos} usuário(s) removido(s)` : ''}`, resultado.removidos ? 'alerta' : 'ok');
    renderTudo();
  });
}

// ---------- Componentes ----------

function switchHtml(ligado, atributos, titulo) {
  return `
    <button type="button" role="switch" aria-checked="${ligado}" ${atributos} title="${esc(titulo)}"
      class="relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${ligado ? 'bg-bom' : 'bg-linha-forte'}">
      <span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-elevado shadow transition-transform ${ligado ? 'translate-x-5' : ''}"></span>
    </button>`;
}

function badgeStatusHtml(ativo) {
  return ativo
    ? '<span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-bom/10 text-bom border border-bom/30">Ativo</span>'
    : '<span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-etiqueta text-tinta-2 border border-linha">Inativo</span>';
}

// ---------- Seletor do perfil atual (dropdown no cabeçalho do card) ----------

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
        class="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition hover:bg-realce ${selecionado ? 'bg-faixa' : ''}">
        <span class="h-2 w-2 rounded-full shrink-0 ${perfil.ativo ? 'bg-bom' : 'bg-linha-forte'}"></span>
        <span class="flex-1 min-w-0">
          <span class="block text-sm truncate ${perfil.ativo ? 'text-tinta' : 'text-tinta-3'}">${esc(perfil.nome)}${perfil.ativo ? '' : ' (inativo)'}</span>
          <span class="block text-[11px] text-tinta-3 truncate">${esc(tiposPerfilTexto(perfil))}</span>
        </span>
        <span class="text-[11px] text-tinta-3 shrink-0">${membros} usuário(s)</span>
        ${selecionado ? '<svg class="h-4 w-4 text-marca-tinta shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>' : ''}
      </button>`;
  }).join('');
}

// ---------- Lista de perfis (perfis.html) ----------

function perfisFiltrados() {
  const termo = estado.buscaLista.trim().toLowerCase();
  return PERFIS.filter((p) => {
    if (termo && !p.nome.toLowerCase().includes(termo)) return false;
    if (estado.tipoLista !== 'todos' && !(p.tipos || []).includes(estado.tipoLista)) return false;
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
      <div class="bg-elevado rounded-xl border border-linha p-8 md:p-12">
        <div class="max-w-md mx-auto text-center">
          <div class="h-12 w-12 mx-auto rounded-full bg-selecao text-marca-tinta grid place-items-center">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
          </div>
          <h3 class="font-display text-lg font-semibold text-tinta mt-4">Nenhum perfil de acesso ainda</h3>
          <p class="text-sm text-tinta-2 mt-1">Os perfis definem o que cada grupo de usuários pode ver e fazer no sistema. Comece criando o primeiro.</p>
          <button type="button" data-criar-primeiro
            class="btn-pri mt-5">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Criar primeiro perfil
          </button>
        </div>
      </div>`;
    container.querySelector('[data-criar-primeiro]').addEventListener('click', abrirModalNovoPerfil);
    return;
  }

  const opcoesTipo = [{ id: 'todos', nome: 'Todos os tipos' }, ...TIPOS_USUARIO.map((t) => ({ id: t.id, nome: t.plural }))];
  const opcoesStatus = [{ id: 'todos', nome: 'Ativos e inativos' }, { id: 'ativos', nome: 'Somente ativos' }, { id: 'inativos', nome: 'Somente inativos' }];
  const select = (id, valor, opcoes) => `
    <select id="${id}" class="border border-linha-forte rounded-lg px-3 py-2 text-sm bg-elevado focus:border-marca-tinta">
      ${opcoes.map((o) => `<option value="${o.id}" ${o.id === valor ? 'selected' : ''}>${esc(o.nome)}</option>`).join('')}
    </select>`;

  container.innerHTML = `
    <div class="bg-elevado rounded-xl border border-linha">
      <div class="p-4 border-b border-linha flex flex-col sm:flex-row sm:items-center gap-2">
        <div class="relative flex-1 max-w-md">
          <svg class="h-4 w-4 text-tinta-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input id="busca-lista" type="text" value="${esc(estado.buscaLista)}" placeholder="Buscar perfil pelo nome…" autocomplete="off"
            class="w-full border border-linha-forte rounded-lg pl-9 pr-3 py-2 text-sm focus:border-marca-tinta bg-elevado text-tinta placeholder:text-tinta-3">
        </div>
        ${select('tipo-lista', estado.tipoLista, opcoesTipo)}
        ${select('status-lista', estado.statusLista, opcoesStatus)}
      </div>
      <div id="tabela-perfis" class="overflow-auto max-h-[70vh]">${htmlTabelaPerfis()}</div>
    </div>`;

  const atualizar = () => { container.querySelector('#tabela-perfis').innerHTML = htmlTabelaPerfis(); };
  const busca = container.querySelector('#busca-lista');
  busca.addEventListener('input', () => { estado.buscaLista = busca.value; atualizar(); });
  const tipo = container.querySelector('#tipo-lista');
  tipo.addEventListener('change', () => { estado.tipoLista = tipo.value; atualizar(); });
  const status = container.querySelector('#status-lista');
  status.addEventListener('change', () => { estado.statusLista = status.value; atualizar(); });

  container.querySelector('#tabela-perfis').addEventListener('click', (e) => {
    const linha = e.target.closest('[data-abrir]');
    if (linha) location.href = urlDetalhe(linha.dataset.abrir);
  });
}

function htmlTabelaPerfis() {
  const perfis = perfisFiltrados();
  if (!perfis.length) {
    return `<p class="text-sm text-tinta-3 py-10 text-center">Nenhum perfil encontrado com esse filtro.</p>`;
  }
  const th = (texto, extra = '') => `<th class="sticky top-0 z-10 bg-faixa text-left text-xs font-medium text-tinta-2 px-4 py-2.5 border-b border-linha whitespace-nowrap ${extra}">${texto}</th>`;
  return `
    <table class="min-w-full text-sm">
      <thead>
        <tr>
          ${th('Perfil', 'left-0 z-20')}
          ${th('Para')}
          ${th('Usuários', 'text-right')}
          ${th('Telas liberadas', 'text-right')}
          ${th('Ações liberadas', 'text-right')}
          ${th('Status')}
        </tr>
      </thead>
      <tbody>
        ${perfis.map((p) => {
          const membros = membrosDoPerfil(p.id).length;
          const { telas, acoes } = contagemPermissoes(p);
          return `
            <tr data-abrir="${p.id}" class="cursor-pointer odd:bg-elevado even:bg-faixa hover:bg-realce transition">
              <td class="sticky left-0 z-10 bg-inherit px-4 py-3 border-b border-linha">
                <a href="${urlDetalhe(p.id)}" class="font-medium ${p.ativo ? 'text-tinta' : 'text-tinta-3'} hover:text-marca-tinta">${esc(p.nome)}</a>
              </td>
              <td class="px-4 py-3 border-b border-linha text-tinta-2 whitespace-nowrap">${esc(tiposPerfilTexto(p))}</td>
              <td class="px-4 py-3 border-b border-linha text-right tabular-nums">${membros}</td>
              <td class="px-4 py-3 border-b border-linha text-right tabular-nums">${telas} <span class="text-tinta-3">/ ${FEATURES.length}</span></td>
              <td class="px-4 py-3 border-b border-linha text-right tabular-nums">${acoes}</td>
              <td class="px-4 py-3 border-b border-linha whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5 ${p.ativo ? 'text-tinta' : 'text-tinta-3'}">
                  <span class="h-2 w-2 rounded-full ${p.ativo ? 'bg-bom' : 'bg-linha-forte'}"></span>${p.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

// ---------- Detalhe do perfil ----------

function renderDetalhe() {
  const container = document.getElementById('detalhe-perfil');
  const perfil = Permissoes.getPerfil(estado.perfilSelecionadoId);

  if (!perfil) {
    location.replace(URL_LISTA);
    return;
  }

  const membros = membrosDoPerfil(perfil.id);
  const telasLiberadas = FEATURES.filter((f) => (perfil.permissoes[f.id] || []).includes('visualizar')).length;

  const abas = [
    { id: 'permissoes', rotulo: 'Permissões' },
    { id: 'usuarios', rotulo: `Usuários (${membros.length})` },
  ];

  container.innerHTML = `
    <nav aria-label="Breadcrumb" class="mb-3 flex items-center gap-1.5 text-sm text-tinta-2">
      <a href="${URL_LISTA}" class="hover:text-marca-tinta transition">Perfis de acesso</a>
      <span class="text-tinta-3">/</span>
      <span class="font-medium text-tinta truncate max-w-xs" aria-current="page">${esc(perfil.nome)}</span>
    </nav>
    <div class="bg-elevado rounded-xl border border-linha">
      <div class="p-5 flex flex-wrap items-start justify-between gap-4 border-b border-linha">
        <div>
          <div class="relative inline-flex items-center gap-3" id="seletor-perfil-atual">
            <p class="text-xs font-medium text-tinta-3">Perfil</p>
            <button type="button" id="btn-perfil-atual" title="Trocar de perfil"
              class="group flex items-center gap-2.5 rounded-lg -mx-1.5 px-1.5 py-0.5 hover:bg-realce transition">
              <h3 class="font-display text-lg font-semibold text-tinta">${esc(perfil.nome)}</h3>
              ${badgeStatusHtml(perfil.ativo)}
              <svg class="h-4 w-4 text-tinta-3 group-hover:text-tinta-2 transition" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
            <div id="popover-perfil" class="hidden absolute left-0 top-full mt-1.5 w-80 bg-elevado border border-linha rounded-xl shadow-[0_24px_60px_-20px_rgba(0,0,0,.4)] z-40 p-3">
              <input id="busca-perfil-lista" type="text" value="${esc(estado.buscaPerfilLista)}" placeholder="Buscar perfil…" autocomplete="off"
                class="w-full border border-linha-forte rounded-lg px-3 py-2 text-sm focus:border-marca-tinta bg-elevado text-tinta placeholder:text-tinta-3">
              <div id="lista-perfil-popover" class="max-h-64 overflow-y-auto mt-2">${htmlListaPerfilPopover()}</div>
            </div>
          </div>
          <p class="text-sm text-tinta-2 mt-1">${telasLiberadas} de ${FEATURES.length} telas liberadas · ${membros.length === 1 ? '1 usuário' : `${membros.length} usuários`}</p>
          <div class="mt-2 flex flex-wrap items-center gap-1.5">
            <span class="text-xs font-medium text-tinta-3 mr-1">Para</span>
            ${Permissoes.tiposDoPerfil(perfil).map((t) => chipTipoHtml(t)).join('') || '<span class="text-xs text-aviso">ninguém — defina o público</span>'}
            <button type="button" data-editar-tipos title="Alterar para quem é o perfil"
              class="ml-0.5 p-1 rounded-md text-tinta-3 hover:text-marca-tinta hover:bg-realce transition">
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
            </button>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 text-sm text-tinta-2">
            ${perfil.ativo ? 'Ativo' : 'Inativo'}
            ${switchHtml(perfil.ativo, 'data-toggle-ativo', perfil.ativo ? 'Inativar perfil (suspende as permissões sem perder a configuração)' : 'Reativar perfil')}
          </label>
          <button type="button" data-duplicar title="Duplicar perfil (copia as permissões, sem os usuários)"
            class="p-2 rounded-lg text-tinta-3 hover:text-marca-tinta hover:bg-realce transition">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-7.5a2.25 2.25 0 012.25-2.25h6z" /></svg>
          </button>
          <button type="button" data-excluir title="Excluir perfil"
            class="p-2 rounded-lg text-tinta-3 hover:text-ruim hover:bg-ruim/10 transition">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
          </button>
        </div>
      </div>

      <div class="px-5 flex gap-1 border-b border-linha">
        ${abas.map((aba) => `
          <button type="button" data-aba="${aba.id}"
            class="px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition
              ${estado.aba === aba.id
                ? 'border-tinta text-tinta'
                : 'border-transparent text-tinta-3 hover:text-tinta-2'}">
            ${aba.rotulo}
          </button>`).join('')}
      </div>

      <div class="p-5">
        ${perfil.protegido ? `
          <div class="mb-4 rounded-lg bg-selecao border border-marca-tinta/30 text-tinta text-sm px-4 py-2.5">
            Perfil protegido: o Administrador sempre tem acesso a todas as telas, inclusive as que forem criadas depois. Não pode ser editado, inativado nem excluído — duplique-o para criar uma variação.
          </div>` : ''}
        ${SOMENTE_LEITURA ? '<div class="mb-4 rounded-lg bg-etiqueta text-sm px-4 py-2.5">Somente consulta: seu perfil não gerencia perfis de acesso.</div>' : ''}
        ${perfil.ativo ? '' : `
          <div class="mb-4 rounded-lg bg-cobre/15 border border-cobre/40 text-tinta text-sm px-4 py-2.5">
            Perfil inativo — as permissões abaixo estão suspensas e voltam a valer quando o perfil for reativado.
          </div>`}
        ${estado.aba === 'permissoes' ? htmlAbaPermissoes() : htmlAbaUsuarios(perfil, membros)}
      </div>
    </div>`;

  // --- eventos do detalhe ---

  const popoverPerfil = container.querySelector('#popover-perfil');
  container.querySelector('#btn-perfil-atual').addEventListener('click', () => {
    popoverPerfil.classList.toggle('hidden');
    if (!popoverPerfil.classList.contains('hidden')) {
      popoverPerfil.querySelector('#busca-perfil-lista').focus();
    }
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

  container.querySelector('[data-editar-tipos]').addEventListener('click', () => {
    abrirModalTiposPerfil(perfil);
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

    const selectTipo = container.querySelector('#tipo-usuarios');
    selectTipo?.addEventListener('change', () => {
      estado.tipoUsuarios = selectTipo.value;
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

// ---------- Aba Permissões (módulos em acordeão) ----------

function htmlAbaPermissoes() {
  const perfil = Permissoes.getPerfil(estado.perfilSelecionadoId);
  return `
    <div class="mb-4 flex gap-6 border-b border-linha">
      ${PORTAIS.map((portal) => {
        const { ativas } = Permissoes.contagemAcoes(perfil, Permissoes.featuresDoPortal(portal.id));
        const selecionado = estado.portalAtivo === portal.id;
        return `
          <button type="button" data-portal="${portal.id}"
            class="flex items-center gap-2 py-2.5 text-sm font-medium border-b-2 -mb-px transition
              ${selecionado
                ? 'border-marca-tinta text-tinta'
                : 'border-transparent text-tinta-3 hover:text-tinta-2'}">
            ${esc(portal.nome)}
            <span class="text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${ativas ? 'bg-selecao text-marca-tinta' : 'bg-etiqueta text-tinta-2'}">${ativas}</span>
          </button>`;
      }).join('')}
    </div>
    <div class="flex items-center gap-2 mb-4">
      <div class="relative flex-1">
        <svg class="h-4 w-4 text-tinta-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
        <input id="busca-permissoes" type="text" value="${esc(estado.busca)}" placeholder="Buscar tela ou ação — ex.: estornar, certificado, aula…" autocomplete="off"
          class="w-full border border-linha-forte rounded-lg pl-9 pr-3 py-2.5 text-sm focus:border-marca-tinta bg-elevado text-tinta placeholder:text-tinta-3">
      </div>
      ${(() => {
        const modulosDoPortal = Permissoes.modulosDoPortal(estado.portalAtivo);
        const todosAbertos = modulosDoPortal.every((m) => estado.modulosAbertos.has(m.id));
        return `
          <button type="button" id="btn-expandir-modulos" data-expandir="${!todosAbertos}"
            class="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-tinta-2 border border-linha-forte hover:border-marca-tinta hover:text-marca-tinta px-3 py-2.5 rounded-lg transition">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="${todosAbertos ? 'M4.5 15.75l7.5-7.5 7.5 7.5' : 'M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9'}" /></svg>
            ${todosAbertos ? 'Minimizar todos' : 'Expandir todos'}
          </button>`;
      })()}
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
      <div class="border border-linha rounded-lg mb-3 overflow-hidden">
        <div class="flex items-center gap-1 bg-faixa pr-2">
          <button type="button" data-toggle-modulo="${modulo.id}" aria-expanded="${aberto}"
            class="flex-1 flex items-center gap-2.5 px-4 py-3 text-left hover:bg-realce transition">
            <svg class="h-4 w-4 text-tinta-3 transition-transform ${aberto ? 'rotate-90' : ''}" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            <span class="text-sm font-semibold text-tinta">${esc(modulo.nome)}</span>
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full ${ativas ? 'bg-selecao text-marca-tinta' : 'bg-etiqueta text-tinta-2'}">${ativas}/${total} ações</span>
          </button>
          <button type="button" data-modulo-tudo="${modulo.id}" title="Liberar todas as ações do módulo"
            class="text-xs font-medium text-marca-tinta hover:bg-selecao px-2.5 py-1.5 rounded-md transition">Liberar tudo</button>
          <button type="button" data-modulo-nenhum="${modulo.id}" title="Remover todas as ações do módulo"
            class="text-xs font-medium text-tinta-2 hover:bg-realce px-2.5 py-1.5 rounded-md transition">Limpar</button>
        </div>
        ${aberto ? `<div class="px-4">${features.map((f) => htmlLinhaFeature(perfil, f)).join('')}</div>` : ''}
      </div>`;
  }).filter(Boolean);

  return secoes.join('') ||
    `<p class="text-sm text-tinta-3 py-8 text-center">Nenhuma tela ou ação encontrada para "${esc(estado.busca)}".</p>`;
}

function htmlLinhaFeature(perfil, feature) {
  const ativas = perfil.permissoes[feature.id] || [];
  const acessoTela = ativas.includes('visualizar');
  return `
    <div class="py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 border-b border-linha last:border-0">
      <div class="w-52 shrink-0">
        <p class="text-sm font-medium text-tinta">${esc(feature.nome)}</p>
        <p class="text-xs mt-0.5 ${acessoTela ? 'text-bom' : 'text-tinta-3'}">${acessoTela ? 'tela liberada' : 'sem acesso à tela'}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        ${feature.acoes.map((acao) => {
          const ligada = ativas.includes(acao.id);
          return `
            <button type="button" data-feature="${feature.id}" data-acao="${acao.id}" aria-pressed="${ligada}"
              class="px-3 py-1.5 rounded-full text-xs font-medium border transition
                ${ligada
                  ? 'bg-marca border-marca text-sobre-marca'
                  : 'bg-elevado border-linha-forte text-tinta-2 hover:border-marca-tinta hover:text-marca-tinta'}">
              ${ligada ? '✓ ' : ''}${esc(acao.nome)}
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
  const compativeis = Permissoes.usuariosCompativeis(perfil.id);
  const tiposPerfil = Permissoes.tiposDoPerfil(perfil);
  const foraDoPublico = USUARIOS.length - compativeis.length;
  if (!TIPOS_USUARIO.some((t) => t.id === estado.tipoUsuarios) || !tiposPerfil.some((t) => t.id === estado.tipoUsuarios)) estado.tipoUsuarios = 'todos';
  const filtros = [
    { id: 'todos', rotulo: `Todos (${compativeis.length})` },
    { id: 'incluidos', rotulo: `No perfil (${membros.length})` },
    { id: 'fora', rotulo: `Fora do perfil (${compativeis.length - membros.length})` },
  ];
  return `
    <p class="text-sm text-tinta-2 mb-3">
      Use o interruptor para incluir ou remover cada usuário deste perfil.
      ${tiposPerfil.length ? `Perfil para <strong class="font-medium text-tinta">${esc(tiposPerfil.map((t) => t.plural.toLowerCase()).join(' e '))}</strong>${foraDoPublico ? ` — ${foraDoPublico} usuário(s) de outros tipos não aparecem aqui.` : '.'}` : ''}
    </p>
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
      <div class="relative flex-1">
        <svg class="h-4 w-4 text-tinta-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
        <input id="busca-usuarios" type="text" value="${esc(estado.buscaUsuarios)}" placeholder="Buscar usuário pelo nome…" autocomplete="off"
          class="w-full border border-linha-forte rounded-lg pl-9 pr-3 py-2 text-sm focus:border-marca-tinta bg-elevado text-tinta placeholder:text-tinta-3">
      </div>
      ${tiposPerfil.length > 1 ? selectTipoHtml('tipo-usuarios', estado.tipoUsuarios, tiposPerfil) : ''}
      <div class="inline-flex rounded-lg border border-linha bg-etiqueta p-0.5 gap-0.5 shrink-0">
        ${filtros.map((f) => `
          <button type="button" data-filtro-usuarios="${f.id}"
            class="px-2.5 py-1.5 rounded-md text-xs font-medium transition
              ${estado.filtroUsuarios === f.id ? 'bg-elevado text-tinta' : 'text-tinta-2 hover:text-tinta'}">
            ${f.rotulo}
          </button>`).join('')}
      </div>
    </div>
    <div id="lista-usuarios-perfil">${htmlListaUsuarios(perfil)}</div>`;
}

function htmlListaUsuarios(perfil) {
  const termo = estado.buscaUsuarios.trim().toLowerCase();
  const filtrados = Permissoes.usuariosCompativeis(perfil.id).filter((usuario) => {
    const incluido = usuario.perfis.includes(perfil.id);
    if (!usuarioTemTipo(usuario, estado.tipoUsuarios)) return false;
    if (estado.filtroUsuarios === 'incluidos' && !incluido) return false;
    if (estado.filtroUsuarios === 'fora' && incluido) return false;
    return !termo || usuario.nome.toLowerCase().includes(termo);
  });

  if (!filtrados.length) {
    return '<p class="text-sm text-tinta-3 py-6 text-center">Nenhum usuário encontrado com esse filtro.</p>';
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
          <li class="flex items-center justify-between gap-4 py-3 border-b border-linha last:border-0">
            <div class="flex items-center gap-3 min-w-0">
              ${avatarHtml(usuario, 'h-9 w-9 text-xs')}
              <div class="min-w-0">
                <p class="text-sm font-medium text-tinta truncate flex items-center gap-2">${esc(usuario.nome)} ${tiposUsuarioHtml(usuario)}</p>
                <p class="text-xs text-tinta-2 truncate">${outros.length ? `Também em: ${esc(outros.join(', '))}` : 'Sem outros perfis'}</p>
              </div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              ${botaoExtrasHtml(usuario)}
              ${switchHtml(incluido, `data-usuario="${usuario.id}"`, incluido ? `Remover ${usuario.nome} do perfil` : `Incluir ${usuario.nome} no perfil`)}
            </div>
          </li>`;
      }).join('')}
    </ul>`;
}

// ---------- Alternador de visões ----------

const VISOES = [
  { id: 'perfis', rotulo: 'Perfis' },
  { id: 'matriz-permissoes', rotulo: 'Permissões × perfis' },
  { id: 'matriz-usuarios', rotulo: 'Usuários × perfis' },
  { id: 'validacao', rotulo: 'Validar acesso' },
];

function renderTrocaVisao() {
  const container = document.getElementById('troca-visao');
  container.innerHTML = `
    <nav class="flex gap-6 -mb-px">
      ${VISOES.map((visao) => `
        <button type="button" data-visao="${visao.id}"
          class="pb-2.5 text-sm font-medium border-b-2 transition
            ${estado.visao === visao.id
              ? 'border-tinta text-tinta'
              : 'border-transparent text-tinta-3 hover:text-tinta-2'}">
          ${visao.rotulo}
        </button>`).join('')}
    </nav>`;
  container.querySelectorAll('[data-visao]').forEach((el) => {
    el.addEventListener('click', () => {
      estado.visao = el.dataset.visao;
      if (estado.visao !== 'validacao') estado.usuarioInspecionadoId = null; // validação sempre abre sem usuário
      renderTudo();
    });
  });
}

// Botão que abre o modal de permissões extras do usuário.
function botaoExtrasHtml(usuario) {
  const total = Permissoes.totalExtras(usuario);
  return `
    <button type="button" data-abrir-extras="${usuario.id}" title="Permissões extras de ${esc(usuario.nome)}"
      class="ml-auto shrink-0 text-[11px] font-semibold px-2 py-1 rounded-md transition
        ${total ? 'bg-cobre/15 text-cobre-tinta hover:bg-cobre/25' : 'text-tinta-3 hover:text-cobre-tinta hover:bg-cobre/15'}">
      ${total ? `+${total} extras` : '+ extras'}
    </button>`;
}

// ---------- Componente: switch compacto das matrizes ----------

function miniSwitchHtml(ligado, atributos, titulo = '') {
  return `
    <button type="button" role="switch" aria-checked="${ligado}" ${atributos} title="${esc(titulo)}"
      class="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${ligado ? 'bg-bom' : 'bg-etiqueta hover:bg-realce'}">
      <span class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-elevado shadow transition-transform ${ligado ? 'translate-x-4' : ''}"></span>
    </button>`;
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
      <button type="button" id="btn-colunas"
        class="inline-flex items-center gap-2 border border-linha-forte hover:border-marca-tinta hover:text-marca-tinta text-tinta-2 text-sm font-medium px-3 py-2 rounded-lg transition">
        Perfis exibidos
        <span id="contagem-colunas" class="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-etiqueta text-tinta-2">${perfisExibidos().length}/${PERFIS.length}</span>
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
      </button>
      <div id="popover-colunas" class="hidden absolute right-0 top-full mt-1.5 w-72 bg-elevado border border-linha rounded-xl shadow-[0_24px_60px_-20px_rgba(0,0,0,.4)] z-40 p-3">
        <input id="busca-colunas" type="text" value="${esc(estado.buscaColunas)}" placeholder="Buscar perfil…" autocomplete="off"
          class="w-full border border-linha-forte rounded-lg px-3 py-2 text-sm focus:border-marca-tinta bg-elevado text-tinta placeholder:text-tinta-3">
        <div id="lista-colunas" class="max-h-60 overflow-y-auto mt-2">${htmlListaColunas()}</div>
        <div class="flex items-center justify-between mt-2 pt-2 border-t border-linha text-xs font-medium">
          <button type="button" data-colunas-todos class="text-marca-tinta hover:bg-selecao px-2 py-1 rounded transition">Marcar todos</button>
          <button type="button" data-colunas-nenhum class="text-tinta-2 hover:bg-realce px-2 py-1 rounded transition">Desmarcar todos</button>
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
      <label class="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-realce cursor-pointer">
        <input type="checkbox" data-coluna-perfil="${perfil.id}" ${marcado ? 'checked' : ''} class="check">
        <span class="h-1.5 w-1.5 rounded-full shrink-0 ${perfil.ativo ? 'bg-bom' : 'bg-linha-forte'}"></span>
        <span class="text-sm truncate ${perfil.ativo ? 'text-tinta' : 'text-tinta-3'}">${esc(perfil.nome)}</span>
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
    raiz.querySelector('#contagem-colunas').textContent = `${perfisExibidos().length}/${PERFIS.length}`;
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

// ---------- Matriz: Usuários × Perfis ----------

function renderMatrizUsuarios() {
  if (estado.tipoMatrizUsuarios === 'aluno') estado.tipoMatrizUsuarios = 'todos';
  const container = document.getElementById('visao-matriz');
  container.innerHTML = `
    <div class="bg-elevado rounded-xl border border-linha">
      <div class="p-4 border-b border-linha flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="relative flex-1 max-w-md">
          <svg class="h-4 w-4 text-tinta-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input id="busca-matriz-usuarios" type="text" value="${esc(estado.buscaMatrizUsuarios)}" placeholder="Buscar usuário pelo nome…" autocomplete="off"
            class="w-full border border-linha-forte rounded-lg pl-9 pr-3 py-2 text-sm focus:border-marca-tinta bg-elevado text-tinta placeholder:text-tinta-3">
        </div>
        ${selectTipoHtml('tipo-matriz-usuarios', estado.tipoMatrizUsuarios, TIPOS_MATRIZ)}
        <div class="sm:ml-auto">${htmlSeletorColunas()}</div>
      </div>
      <p class="px-4 pt-3 text-xs text-tinta-3">Alunos não aparecem aqui — a matriz é só da equipe (colaboradores) e dos professores.</p>
      <div id="tabela-matriz">${htmlTabelaMatrizUsuarios()}</div>
    </div>`;

  const inputBusca = container.querySelector('#busca-matriz-usuarios');
  inputBusca.addEventListener('input', () => {
    estado.buscaMatrizUsuarios = inputBusca.value;
    atualizarTabelaMatriz(htmlTabelaMatrizUsuarios());
  });

  const selectTipo = container.querySelector('#tipo-matriz-usuarios');
  selectTipo.addEventListener('change', () => {
    estado.tipoMatrizUsuarios = selectTipo.value;
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
  });
}

function htmlTabelaMatrizUsuarios() {
  const termo = estado.buscaMatrizUsuarios.trim().toLowerCase();
  // Alunos ficam fora da matriz: só equipe (colaboradores) e professores.
  const usuarios = USUARIOS.filter((u) => !somenteAluno(u) && usuarioTemTipo(u, estado.tipoMatrizUsuarios) && (!termo || u.nome.toLowerCase().includes(termo)));
  const colunas = perfisExibidos();

  if (!colunas.length) {
    return '<p class="text-sm text-tinta-3 py-10 text-center">Nenhum perfil selecionado — escolha as colunas em "Perfis exibidos".</p>';
  }
  if (!usuarios.length) {
    return '<p class="text-sm text-tinta-3 py-10 text-center">Nenhum usuário encontrado.</p>';
  }

  return `
    <div id="scroll-matriz" class="overflow-auto max-h-[65vh]">
      <table class="min-w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr>
            <th class="sticky top-0 left-0 z-30 bg-faixa text-left px-4 py-3 border-b border-linha text-xs font-medium text-tinta-2 min-w-[220px]">Usuário</th>
            ${colunas.map((perfil) => {
              const membros = membrosDoPerfil(perfil.id).length;
              return `
                <th class="sticky top-0 z-20 bg-faixa border-b border-linha px-3 py-2.5 text-center min-w-[130px]">
                  <span class="flex items-center justify-center gap-1.5 text-xs font-semibold ${perfil.ativo ? 'text-tinta' : 'text-tinta-3'}">
                    <span class="h-1.5 w-1.5 rounded-full ${perfil.ativo ? 'bg-bom' : 'bg-linha-forte'}"></span>${esc(perfil.nome)}
                  </span>
                  <span class="block text-[10px] font-normal text-tinta-3 mt-0.5">${perfil.ativo ? `${membros} usuário(s)` : 'inativo'} · ${esc(tiposPerfilTexto(perfil))}</span>
                </th>`;
            }).join('')}
          </tr>
        </thead>
        <tbody>
          ${usuarios.map((usuario) => `
            <tr class="group">
              <td class="sticky left-0 z-10 bg-elevado group-hover:bg-realce px-4 py-2 border-b border-linha">
                <div class="flex items-center gap-2.5 min-w-0">
                  <button type="button" data-validar-usuario="${usuario.id}" title="Ver o acesso consolidado de ${esc(usuario.nome)}"
                    class="group flex items-center gap-2.5 min-w-0 rounded-lg -ml-1.5 pl-1.5 pr-2 py-0.5 text-left hover:bg-realce transition">
                    ${avatarHtml(usuario, 'h-7 w-7 text-[10px]')}
                    <span class="text-sm font-medium text-tinta truncate group-hover:text-marca-tinta group-hover:underline decoration-marca-tinta/40 underline-offset-2">${esc(usuario.nome)}</span>
                  </button>
                  ${tiposUsuarioHtml(usuario, { link: false })}
                  ${botaoExtrasHtml(usuario)}
                </div>
              </td>
              ${colunas.map((perfil) => {
                const incluido = usuario.perfis.includes(perfil.id);
                if (!Permissoes.perfilAplicaA(perfil, usuario)) {
                  return `
                  <td class="text-center border-b border-linha px-3 py-2 group-hover:bg-realce text-tinta-3 select-none"
                    title="Perfil para ${esc(tiposPerfilTexto(perfil).toLowerCase())} — não se aplica a ${esc(usuario.nome)}">—</td>`;
                }
                return `
                  <td class="text-center border-b border-linha px-3 py-2 group-hover:bg-realce ${perfil.ativo ? '' : 'opacity-50'}">
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
    <div class="bg-elevado rounded-xl border border-linha">
      <div class="px-4 border-b border-linha flex gap-6">
        ${PORTAIS.map((portal) => `
          <button type="button" data-portal-matriz="${portal.id}"
            class="py-3 text-sm font-medium border-b-2 -mb-px transition
              ${estado.portalAtivo === portal.id
                ? 'border-marca-tinta text-tinta'
                : 'border-transparent text-tinta-3 hover:text-tinta-2'}">
            ${esc(portal.nome)}
          </button>`).join('')}
      </div>
      <div class="p-4 border-b border-linha flex flex-col lg:flex-row lg:items-center gap-3">
        <div class="relative flex-1 max-w-md">
          <svg class="h-4 w-4 text-tinta-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input id="busca-matriz" type="text" value="${esc(estado.buscaMatriz)}" placeholder="Buscar tela ou ação…" autocomplete="off"
            class="w-full border border-linha-forte rounded-lg pl-9 pr-3 py-2 text-sm focus:border-marca-tinta bg-elevado text-tinta placeholder:text-tinta-3">
        </div>
        <div class="lg:ml-auto">${htmlSeletorColunas()}</div>
      </div>
      <div id="tabela-matriz">${htmlTabelaMatrizPermissoes()}</div>
    </div>`;

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
    renderConteudoValidacao();
  });
}

function htmlTabelaMatrizPermissoes() {
  const termo = estado.buscaMatriz.trim().toLowerCase();
  const modulos = Permissoes.modulosDoPortal(estado.portalAtivo);
  const colunas = perfisExibidos();
  const totalColunas = colunas.length + 1;

  if (!colunas.length) {
    return '<p class="text-sm text-tinta-3 py-10 text-center">Nenhum perfil selecionado — escolha as colunas em "Perfis exibidos".</p>';
  }

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
        <td colspan="${totalColunas}" data-sticky-modulo class="sticky left-0 z-20 bg-etiqueta px-4 py-2 text-xs font-medium text-tinta-2 border-b border-linha">${esc(modulo.nome)}</td>
      </tr>
      ${features.map(({ feature, acoes }) => `
        <tr>
          <td colspan="${totalColunas}" data-sticky-feature class="sticky left-0 z-[15] bg-faixa px-4 py-1.5 text-xs font-semibold text-tinta border-b border-linha">${esc(feature.nome)}</td>
        </tr>
        ${acoes.map((acao) => `
          <tr class="group">
            <td class="sticky left-0 z-10 bg-elevado group-hover:bg-realce pl-8 pr-4 py-2 border-b border-linha text-sm text-tinta-2 min-w-[240px]">${esc(acao.nome)}</td>
            ${colunas.map((perfil) => {
              const ligada = (perfil.permissoes[feature.id] || []).includes(acao.id);
              return `
                <td class="text-center border-b border-linha px-3 py-2 group-hover:bg-realce ${perfil.ativo ? '' : 'opacity-50'}">
                  ${miniSwitchHtml(ligada, `data-mx-perfil="${perfil.id}" data-mx-feature="${feature.id}" data-mx-acao="${acao.id}"`, `${perfil.nome} — ${feature.nome} · ${acao.nome}`)}
                </td>`;
            }).join('')}
          </tr>`).join('')}`).join('')}`;
  }).filter(Boolean);

  if (!linhas.length) {
    return `<p class="text-sm text-tinta-3 py-10 text-center">Nenhuma tela ou ação encontrada para "${esc(estado.buscaMatriz)}".</p>`;
  }

  return `
    <div id="scroll-matriz" class="overflow-auto max-h-[65vh]">
      <table class="min-w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr>
            <th class="sticky top-0 left-0 z-40 bg-faixa text-left px-4 py-3 border-b border-linha text-xs font-medium text-tinta-2 min-w-[240px]">Tela / Ação</th>
            ${colunas.map((perfil) => {
              const { ativas } = Permissoes.contagemAcoes(perfil, Permissoes.featuresDoPortal(estado.portalAtivo));
              return `
                <th class="sticky top-0 z-30 bg-faixa border-b border-linha px-3 py-2.5 text-center min-w-[130px]">
                  <span class="flex items-center justify-center gap-1.5 text-xs font-semibold ${perfil.ativo ? 'text-tinta' : 'text-tinta-3'}">
                    <span class="h-1.5 w-1.5 rounded-full ${perfil.ativo ? 'bg-bom' : 'bg-linha-forte'}"></span>${esc(perfil.nome)}
                  </span>
                  <span class="block text-[10px] font-normal text-tinta-3 mt-0.5">${perfil.ativo ? `${ativas} ações neste portal` : 'inativo'}</span>
                </th>`;
            }).join('')}
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
    <div class="bg-elevado rounded-xl border border-linha">
      <div class="p-5 border-b border-linha">
        <h3 class="font-display font-semibold text-tinta">Validação de acesso</h3>
        <p class="text-sm text-tinta-2 mt-0.5">Resultado consolidado — união dos perfis ativos do usuário mais as permissões extras.</p>
      </div>
      <div class="px-5 pt-4 flex items-center gap-2">
        <div class="relative flex-1 max-w-xl" id="seletor-usuario-validacao">
          <button type="button" id="btn-usuario-validacao"
            class="w-full flex items-center gap-2.5 border border-linha-forte rounded-lg px-3 py-2 text-sm bg-elevado text-left hover:border-marca-tinta transition">
            <span id="rotulo-usuario-validacao" class="flex-1 flex items-center gap-2.5 min-w-0 text-tinta-3">Selecione um usuário…</span>
            <svg class="h-4 w-4 text-tinta-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </button>
          <div id="popover-usuario-validacao" class="hidden absolute left-0 right-0 top-full mt-1.5 bg-elevado border border-linha rounded-xl shadow-[0_24px_60px_-20px_rgba(0,0,0,.4)] z-50 p-2">
            <input id="busca-usuario-validacao" type="text" placeholder="Buscar usuário pelo nome…" autocomplete="off"
              class="w-full border border-linha-forte rounded-lg px-3 py-2 text-sm focus:border-marca-tinta bg-elevado text-tinta placeholder:text-tinta-3">
            <div id="lista-usuario-validacao" class="max-h-64 overflow-y-auto mt-2">${htmlListaUsuariosValidacao()}</div>
          </div>
        </div>
        <button type="button" id="btn-extras-validacao" title="Conceder permissões além dos perfis deste usuário"
          class="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg bg-cobre/15 text-cobre-tinta hover:bg-cobre/25 transition">
          Permissões extras
        </button>
      </div>
      <div id="validacao-conteudo" class="px-5 py-4"></div>
    </div>`;

  const popoverUsuario = root.querySelector('#popover-usuario-validacao');
  root.querySelector('#btn-usuario-validacao').addEventListener('click', () => {
    popoverUsuario.classList.toggle('hidden');
    if (!popoverUsuario.classList.contains('hidden')) {
      popoverUsuario.querySelector('#busca-usuario-validacao').focus();
    }
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
        class="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition hover:bg-realce ${selecionado ? 'bg-faixa' : ''}">
        ${avatarHtml(usuario, 'h-7 w-7 text-[10px]')}
        <span class="flex-1 min-w-0">
          <span class="flex items-center gap-2 text-sm text-tinta truncate">${esc(usuario.nome)} ${tiposUsuarioHtml(usuario, { link: false })}</span>
          <span class="block text-xs text-tinta-3 truncate">${perfis.length ? esc(perfis.join(', ')) : 'Sem perfis'}</span>
        </span>
        ${selecionado ? '<svg class="h-4 w-4 text-marca-tinta shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>' : ''}
      </button>`;
  }).join('');
}

// ---------- Permissões extras por usuário (modal centralizado) ----------

function abrirModalExtras(usuarioId) {
  fecharModal();
  estado.usuarioExtrasId = usuarioId;
  estado.buscaExtras = '';

  const usuario = Permissoes.getUsuario(usuarioId);
  const nomesPerfis = usuario.perfis.map((id) => Permissoes.getPerfil(id)?.nome).filter(Boolean);

  abrirModal(`
        <div class="p-5 border-b border-linha flex items-start justify-between gap-4">
          <div class="flex items-center gap-3">
            ${avatarHtml(usuario, 'h-10 w-10 text-sm')}
            <div>
              <h3 class="font-display font-semibold text-tinta flex items-center gap-2 flex-wrap">Permissões extras · ${esc(usuario.nome)} ${tiposUsuarioHtml(usuario)}</h3>
              <p class="text-sm text-tinta-2 mt-0.5">Perfis: ${nomesPerfis.length ? esc(nomesPerfis.join(', ')) : 'nenhum'}</p>
            </div>
          </div>
          <button type="button" data-fechar-modal-extras title="Fechar"
            class="p-2 rounded-lg text-tinta-3 hover:text-tinta-2 hover:bg-realce transition">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="px-5 pt-4 space-y-3">
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-tinta-2">
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-bom/10 border border-bom/30"></span>herdada dos perfis (gerencie no perfil)</span>
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-cobre"></span>extra deste usuário</span>
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-elevado border border-linha-forte"></span>clique para conceder</span>
          </div>
          <div class="relative">
            <svg class="h-4 w-4 text-tinta-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input id="busca-extras" type="text" placeholder="Buscar tela ou ação…" autocomplete="off"
              class="w-full border border-linha-forte rounded-lg pl-9 pr-3 py-2 text-sm focus:border-marca-tinta bg-elevado text-tinta placeholder:text-tinta-3">
          </div>
        </div>
        <div id="conteudo-extras" class="flex-1 min-h-0 overflow-y-auto px-5 py-4">${htmlConteudoExtras(usuario)}</div>`,
  { largura: 'max-w-2xl', semPadding: true });

  const root = document.getElementById('modal-root');
  root.querySelector('[data-fechar-modal-extras]').addEventListener('click', fecharModal);

  const inputBusca = root.querySelector('#busca-extras');
  inputBusca.addEventListener('input', () => {
    estado.buscaExtras = inputBusca.value;
    document.getElementById('conteudo-extras').innerHTML = htmlConteudoExtras(usuario);
  });

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
        <div class="pt-3">
          <p class="text-xs font-medium text-tinta-3 pb-1">${esc(modulo.nome)}</p>
          ${features.map(({ feature, acoes }) => `
            <div class="py-2.5 border-t border-linha">
              <p class="text-sm font-medium text-tinta mb-1.5">
                ${esc(feature.nome)}
                ${Permissoes.pode(usuario, feature.id, 'visualizar') ? '' : '<span class="ml-1.5 text-[11px] font-normal text-aviso">sem acesso à tela — conceda "Visualizar"</span>'}
              </p>
              <div class="flex flex-wrap gap-1.5">
                ${acoes.map((acao) => {
                  const doPerfil = Permissoes.concedidaPorPerfis(usuario, feature.id, acao.id);
                  const extra = Permissoes.concedidaPorExtra(usuario, feature.id, acao.id);
                  if (doPerfil) {
                    return `<span class="px-2.5 py-1 rounded-full text-xs bg-bom/10 text-bom border border-bom/30 cursor-default"
                      title="Concedida pelos perfis do usuário — para remover, ajuste o perfil">✓ ${esc(acao.nome)}</span>`;
                  }
                  if (extra) {
                    return `<button type="button" data-ex-feature="${feature.id}" data-ex-acao="${acao.id}"
                      class="px-2.5 py-1 rounded-full text-xs font-medium bg-selecao border border-marca-tinta/40 text-marca-tinta transition hover:border-marca-tinta"
                      title="Permissão extra — clique para remover">✓ ${esc(acao.nome)}</button>`;
                  }
                  return `<button type="button" data-ex-feature="${feature.id}" data-ex-acao="${acao.id}"
                    class="px-2.5 py-1 rounded-full text-xs font-medium bg-elevado border border-linha-forte text-tinta-2 transition hover:border-cobre hover:text-cobre-tinta"
                    title="Clique para conceder como permissão extra">${esc(acao.nome)}</button>`;
                }).join('')}
              </div>
            </div>`).join('')}
        </div>`;
    }).filter(Boolean);

    if (!modulosHtml.length) return '';

    return `
      <div class="pt-5 first:pt-0">
        <p class="text-sm font-semibold text-tinta border-b-2 border-linha-forte inline-block pb-0.5">${esc(portal.nome)}</p>
        ${modulosHtml.join('')}
      </div>`;
  }).filter(Boolean);

  return secoes.join('') ||
    `<p class="text-sm text-tinta-3 py-8 text-center">Nenhuma tela ou ação encontrada para "${esc(estado.buscaExtras)}".</p>`;
}

function renderConteudoValidacao() {
  const container = document.getElementById('validacao-conteudo');
  if (!container) return;
  const usuario = Permissoes.getUsuario(estado.usuarioInspecionadoId);

  // Atualiza o rótulo do combobox de usuário.
  const rotulo = document.getElementById('rotulo-usuario-validacao');
  if (rotulo) {
    rotulo.className = `flex-1 flex items-center gap-2.5 min-w-0 ${usuario ? 'text-tinta' : 'text-tinta-3'}`;
    rotulo.innerHTML = usuario
      ? `${avatarHtml(usuario, 'h-6 w-6 text-[10px]')}<span class="truncate text-sm font-medium">${esc(usuario.nome)}</span>`
      : 'Selecione um usuário…';
  }

  // Botão "Permissões extras" só faz sentido com um usuário escolhido.
  const botaoExtras = document.getElementById('btn-extras-validacao');
  if (botaoExtras) {
    botaoExtras.disabled = !usuario;
    botaoExtras.classList.toggle('opacity-40', !usuario);
    botaoExtras.classList.toggle('cursor-not-allowed', !usuario);
  }

  if (!usuario) {
    container.innerHTML = `
      <div class="text-center pt-10">
        <div class="h-11 w-11 mx-auto rounded-full bg-etiqueta text-tinta-3 grid place-items-center">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
        </div>
        <p class="font-display font-semibold text-tinta mt-3">Selecione um usuário</p>
        <p class="text-sm text-tinta-2 mt-1 max-w-xs mx-auto">Escolha um usuário acima para ver o acesso consolidado dele — a união dos perfis ativos mais as permissões extras.</p>
      </div>
      <div class="pb-6"></div>`;
    return;
  }

  const nomesPerfis = usuario.perfis
    .map((id) => {
      const perfil = Permissoes.getPerfil(id);
      return perfil ? `${perfil.nome}${perfil.ativo ? '' : ' (inativo)'}` : null;
    })
    .filter(Boolean);

  const semAcesso = [];
  const secoes = PORTAIS.map((portal) => {
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

      return `
        <div class="pt-3">
          <p class="text-xs font-medium text-tinta-3 pb-1">${esc(modulo.nome)}</p>
          ${acessiveis.map(({ feature, liberadas }) => `
            <div class="flex flex-col sm:flex-row sm:items-center gap-2 py-2.5 border-t border-linha">
              <div class="w-52 shrink-0 flex items-center gap-2">
                <span class="h-2 w-2 rounded-full bg-bom"></span>
                <span class="text-sm font-medium text-tinta">${esc(feature.nome)}</span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                ${liberadas.map((acao) => `
                  <span class="px-2.5 py-1 rounded-full text-xs border ${acao.somenteExtra ? 'bg-cobre/15 text-aviso border-cobre/40' : 'bg-bom/10 text-bom border-bom/30'}"
                    title="Concedida por: ${esc(acao.origens.join(', '))}">${esc(acao.nome)}${acao.somenteExtra ? ' ★' : ''}</span>`).join('')}
              </div>
            </div>`).join('')}
        </div>`;
    }).filter(Boolean);

    if (!modulosComAcesso.length) return '';

    return `
      <div class="pt-5 first:pt-2">
        <p class="text-sm font-semibold text-tinta border-b-2 border-linha-forte inline-block pb-0.5">${esc(portal.nome)}</p>
        ${modulosComAcesso.join('')}
      </div>`;
  }).filter(Boolean);

  container.innerHTML = `
    <div class="flex flex-wrap items-center gap-1.5 pb-2">${tiposUsuarioHtml(usuario)}</div>
    <p class="text-sm text-tinta-2 pb-1">Perfis de ${esc(usuario.nome.split(' ')[0])}: ${nomesPerfis.length ? esc(nomesPerfis.join(', ')) : '<em>nenhum</em>'}</p>
    ${secoes.join('') || '<p class="text-sm text-tinta-3 py-6 text-center">Este usuário não tem acesso a nenhuma tela.</p>'}
    ${secoes.length && semAcesso.length ? `<p class="text-xs text-tinta-3 pt-4 border-t border-linha mt-4">Sem acesso: ${esc(semAcesso.join(', '))}</p>` : ''}`;
}

// ---------- Bootstrap ----------

function renderTudo() {
  if (MODO === 'detalhe') {
    renderDetalhe();
    return;
  }

  renderTrocaVisao();

  const visaoPerfis = document.getElementById('visao-perfis');
  const visaoMatriz = document.getElementById('visao-matriz');
  const mostrarPerfis = estado.visao === 'perfis';
  visaoPerfis.classList.toggle('hidden', !mostrarPerfis);
  visaoMatriz.classList.toggle('hidden', mostrarPerfis);

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
  }

  document.getElementById('btn-novo-perfil')?.addEventListener('click', abrirModalNovoPerfil);

  renderTudo();
}

iniciar();
