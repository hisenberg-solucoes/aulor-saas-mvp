// ============================================================
// Entrada (entrar.html): login, escolha do portal, primeiro acesso e
// recuperação de senha para a equipe, os professores e os alunos.
// Quem é quem vem dos cadastros: colaborador com usuário de acesso (perfis em
// js/permissoes-data.js), instrutor e aluno, pelo e-mail. Quem tem mais de um
// acesso escolhe por onde entrar. ?portal=aluno|professor limita ao portal
// (as páginas de login dos portais trazem para cá); ?saiu=1 diz que a pessoa saiu.
// Senha: a do protótipo (123456) até a pessoa criar a dela no primeiro acesso
// ou na recuperação; as criadas ficam neste navegador. Só demonstra: na V1
// real, autenticação e permissões são do back-end.
// ============================================================

const Entrada = (() => {
  const SENHA_PROTOTIPO = '123456';
  const CODIGO_DEMO = '246810';
  const CHAVE_SENHAS = 'aulor-v1-senhas';
  const CHAVE_PERMISSOES = 'aulor-v1-permissionamento-v6'; // a mesma de js/permissoes-app.js
  const norm = (s) => String(s ?? '').trim().toLowerCase();

  function senhas() {
    try { return JSON.parse(localStorage.getItem(CHAVE_SENHAS)) || {}; } catch (_) { return {}; }
  }
  const senhaConfere = (email, senha) => (senhas()[norm(email)] ?? SENHA_PROTOTIPO) === senha;
  const gravarSenha = (email, senha) => localStorage.setItem(CHAVE_SENHAS, JSON.stringify({ ...senhas(), [norm(email)]: senha }));

  function permissoes() {
    try {
      const s = JSON.parse(localStorage.getItem(CHAVE_PERMISSOES));
      if (Array.isArray(s?.perfis) && Array.isArray(s?.usuarios)) return s;
    } catch (_) { /* semente */ }
    return { perfis: PERFIS, usuarios: USUARIOS };
  }

  // Permissões efetivas no portal administrativo ({ telaId: [ações] }): união dos perfis ativos e das
  // extras do usuário, só nas telas em que ele pode "visualizar".
  function acessoDe(usuarioId, s = permissoes()) {
    const u = s.usuarios.find((x) => x.id === usuarioId);
    if (!u) return { acesso: {}, perfis: [] };
    const perfis = u.perfis.map((id) => s.perfis.find((p) => p.id === id)).filter((p) => p?.ativo);
    const adm = new Set(FEATURES.filter((f) => MODULOS.find((m) => m.id === f.modulo)?.portal === 'administrativo').map((f) => f.id));
    const acesso = {};
    for (const fonte of [...perfis.map((p) => p.permissoes), u.extras ?? {}]) {
      for (const [tela, acoes] of Object.entries(fonte)) if (adm.has(tela)) acesso[tela] = [...new Set([...(acesso[tela] ?? []), ...acoes])];
    }
    return { acesso: Object.fromEntries(Object.entries(acesso).filter(([, a]) => a.includes('visualizar'))), perfis };
  }

  // Os acessos de quem tem este e-mail: [{ portal: 'equipe' | 'professor' | 'aluno', nome, ... }].
  function contas(email) {
    const e = norm(email);
    if (!e) return [];
    const r = [];
    const col = Colaboradores.carregar().find((c) => norm(c.contato?.email) === e && c.status !== 'desligado' && c.acesso?.usuarioId);
    if (col) {
      const { acesso, perfis } = acessoDe(col.acesso.usuarioId);
      if (Object.keys(acesso).length) r.push({ portal: 'equipe', nome: col.nome, usuarioId: col.acesso.usuarioId, acesso, perfis });
    }
    const ins = Instrutores.carregar().find((i) => norm(i.contato?.email) === e && i.status !== 'inativo');
    if (ins) r.push({ portal: 'professor', nome: ins.nome, instrutorId: ins.id });
    const alu = Clientes.carregar().alunos.find((a) => norm(a.email) === e && a.status !== 'inativo');
    if (alu) r.push({ portal: 'aluno', nome: alu.nomeSocial || alu.nome, alunoId: alu.id });
    return r;
  }

  // Grava a sessão do portal e devolve para onde ir.
  function entrar(conta, email) {
    const em = new Date().toISOString();
    if (conta.portal === 'professor') {
      localStorage.setItem('aulor-v1-portal-professor-sessao', JSON.stringify({ instrutorId: conta.instrutorId, em }));
      return 'portal-professor/turmas.html';
    }
    if (conta.portal === 'aluno') {
      localStorage.setItem('aulor-v1-portal-aluno-sessao', JSON.stringify({ alunoId: conta.alunoId, em }));
      return 'portal-aluno/home.html';
    }
    // Vendedor externo: sem "ver todas", a pessoa vê só as vendas em que é a vendedora.
    const externo = conta.perfis.some((p) => p.id === 'vendedor_externo') && !conta.acesso.contratos?.includes('ver-todas');
    Sessao.entrar({
      usuarioId: conta.usuarioId, nome: conta.nome, email: norm(email),
      perfil: externo ? 'vendedor_externo' : conta.perfis[0]?.id ?? null,
      perfilNome: conta.perfis.map((p) => p.nome).join(', '),
      vendedorId: conta.usuarioId, acesso: conta.acesso, em,
    });
    return 'home.html';
  }

  return { SENHA_PROTOTIPO, CODIGO_DEMO, norm, senhaConfere, gravarSenha, acessoDe, contas, entrar };
})();

(function () {
  const params = new URLSearchParams(location.search);
  const PORTAL = ['aluno', 'professor'].includes(params.get('portal')) ? params.get('portal') : null;
  const PORTAIS = { equipe: 'Equipe ProWay', professor: 'Portal do Professor', aluno: 'Portal do Aluno' };
  const tela = document.getElementById('tela');
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)] p-6';
  const TITULO = 'text-xl font-semibold tracking-tight text-slate-900 dark:text-neutral-100';
  const APOIO = 'mt-1 text-sm text-slate-500 dark:text-neutral-400';
  const ROTULO = 'block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1';
  const CAMPO = 'w-full h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 text-sm text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400 focus:ring-2 focus:ring-petrol-800/20 aria-[invalid=true]:border-red-500';
  const BOTAO_PRI = 'w-full inline-flex justify-center items-center h-9 px-3.5 rounded-lg text-sm font-semibold bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800 text-white transition';
  const LINK = 'text-sm font-medium text-petrol-800 dark:text-sky-300 hover:underline';
  const ICONE_ERRO = '<svg class="h-3.5 w-3.5 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>';
  const SETA = '<svg class="h-4 w-4 shrink-0 text-slate-500 dark:text-neutral-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>';

  let estado = { modo: 'entrar', email: '', contas: [], aviso: params.get('saiu') ? 'Você saiu.' : '' };

  const contasDoPortal = (email) => Entrada.contas(email).filter((c) => !PORTAL || c.portal === PORTAL);
  const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  const mascarar = (e) => e.replace(/^(.)[^@]*(@.*)$/, '$1***$2');

  function campo(id, rotulo, tipo, extra = '') {
    return `
      <div>
        <label for="${id}" class="${ROTULO}">${rotulo}</label>
        <input id="${id}" name="${id}" type="${tipo}" class="${CAMPO}" aria-describedby="${id}-erro" ${extra}>
        <p id="${id}-erro" class="mt-1 hidden items-center gap-1 text-xs text-red-700 dark:text-red-400"></p>
      </div>`;
  }

  function erro(form, id, msg) {
    const input = form.querySelector(`#${id}`);
    const p = form.querySelector(`#${id}-erro`);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    p.innerHTML = msg ? `${ICONE_ERRO}<span>${esc(msg)}</span>` : '';
    p.classList.toggle('hidden', !msg);
    p.classList.toggle('flex', !!msg);
    return !msg;
  }

  function cartao(titulo, apoio, corpo, rodape = '') {
    const faixa = estado.aviso ? `<p role="status" class="mb-4 rounded-lg bg-slate-200/70 dark:bg-neutral-900 px-3 py-2 text-sm text-slate-700 dark:text-neutral-300">${esc(estado.aviso)}</p>` : '';
    return `
      <section class="${CARTAO}">
        ${faixa}
        <h1 class="${TITULO}">${titulo}</h1>
        ${apoio ? `<p class="${APOIO}">${apoio}</p>` : ''}
        <div class="mt-5">${corpo}</div>
      </section>
      ${rodape}`;
  }

  function contasDemo() {
    const s = { perfis: PERFIS, usuarios: USUARIOS };
    const cols = Colaboradores.carregar().filter((c) => c.status !== 'desligado' && c.acesso?.usuarioId && c.contato?.email);
    const porPerfil = ['admin', 'comercial', 'vendedor_externo', 'coordenador', 'financeiro'].map((perfilId) => {
      const c = cols.find((x) => s.usuarios.find((u) => u.id === x.acesso.usuarioId)?.perfis[0] === perfilId);
      return c && { nome: c.nome, email: c.contato.email, papel: s.perfis.find((p) => p.id === perfilId).nome, portal: 'equipe' };
    });
    const ins = Instrutores.carregar().find((i) => i.status !== 'inativo' && i.contato?.email);
    const alu = Clientes.carregar().alunos.find((a) => a.status !== 'inativo' && a.email);
    return [...porPerfil, ins && { nome: ins.nome, email: ins.contato.email, papel: 'Professor', portal: 'professor' }, alu && { nome: alu.nome, email: alu.email, papel: 'Aluno', portal: 'aluno' }]
      .filter((x) => x && (!PORTAL || x.portal === PORTAL));
  }

  function renderEntrar() {
    const titulo = PORTAL ? `Entrar no ${PORTAIS[PORTAL]}` : 'Entrar no Aulor';
    tela.innerHTML = cartao(titulo, 'Use o e-mail que a escola cadastrou.', `
      <form novalidate class="space-y-4" data-form>
        ${campo('email', 'E-mail', 'email', `autocomplete="username" value="${esc(estado.email)}"`)}
        ${campo('senha', 'Senha', 'password', 'autocomplete="current-password"')}
        <p data-falha role="alert" class="hidden text-sm text-red-700 dark:text-red-400"></p>
        <button type="submit" class="${BOTAO_PRI}">Entrar</button>
      </form>
      <div class="mt-4 flex items-center justify-between">
        <button type="button" class="${LINK}" data-ir="primeiro">Primeiro acesso</button>
        <button type="button" class="${LINK}" data-ir="recuperar">Esqueci a senha</button>
      </div>`, `
      <details class="mt-4 text-sm text-slate-500 dark:text-neutral-400">
        <summary class="cursor-pointer select-none hover:text-slate-700 dark:hover:text-neutral-200">Contas de demonstração (senha ${Entrada.SENHA_PROTOTIPO})</summary>
        <ul class="mt-2 divide-y divide-slate-200 dark:divide-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          ${contasDemo().map((c) => `
          <li><button type="button" data-demo="${esc(c.email)}" class="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-neutral-900">
            <span class="min-w-0"><span class="block text-slate-900 dark:text-neutral-100">${esc(c.nome)}</span><span class="block truncate text-xs">${esc(c.papel)} · ${esc(c.email)}</span></span>${SETA}
          </button></li>`).join('')}
        </ul>
      </details>`);
    const form = tela.querySelector('[data-form]');
    form.querySelector(estado.email ? '#senha' : '#email').focus();
    tela.querySelectorAll('[data-demo]').forEach((b) => b.addEventListener('click', () => {
      form.email.value = b.dataset.demo; form.senha.value = Entrada.SENHA_PROTOTIPO; form.requestSubmit();
    }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      const senha = form.senha.value;
      const ok = [erro(form, 'email', !email ? 'Informe o e-mail.' : emailValido(email) ? '' : 'Confira o e-mail.'), erro(form, 'senha', senha ? '' : 'Informe a senha.')];
      if (ok.includes(false)) return form.querySelector('[aria-invalid="true"]').focus();
      const contas = contasDoPortal(email);
      const falha = form.querySelector('[data-falha]');
      if (!contas.length || !Entrada.senhaConfere(email, senha)) {
        falha.textContent = 'E-mail ou senha incorretos.'; falha.classList.remove('hidden');
        return;
      }
      estado = { ...estado, email, contas, aviso: '' };
      if (contas.length === 1) location.href = Entrada.entrar(contas[0], email);
      else { estado.modo = 'escolher'; render(); }
    });
  }

  // A pessoa tem mais de um acesso: escolhe por onde entrar (lista com uma linha-botão por portal).
  function renderEscolher() {
    tela.innerHTML = cartao('Por onde você quer entrar?', esc(estado.contas[0].nome), `
      <ul class="divide-y divide-slate-200 dark:divide-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-800">
        ${estado.contas.map((c, i) => `
        <li><button type="button" data-conta="${i}" class="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-neutral-900">
          <span><span class="block font-medium text-slate-900 dark:text-neutral-100">${PORTAIS[c.portal]}</span>${c.perfis ? `<span class="block text-xs text-slate-500 dark:text-neutral-400">${esc(c.perfis.map((p) => p.nome).join(', '))}</span>` : ''}</span>${SETA}
        </button></li>`).join('')}
      </ul>
      <button type="button" class="${LINK} mt-4" data-ir="entrar">Voltar</button>`);
    tela.querySelectorAll('[data-conta]').forEach((b) => b.addEventListener('click', () => {
      location.href = Entrada.entrar(estado.contas[Number(b.dataset.conta)], estado.email);
    }));
  }

  // Primeiro acesso e recuperação: e-mail → código ou link → nova senha.
  function renderPedirEmail(primeiro) {
    tela.innerHTML = cartao(primeiro ? 'Primeiro acesso' : 'Esqueci a senha',
      primeiro ? 'Informe o e-mail que a escola cadastrou. Enviamos um código para você criar a sua senha.' : 'Informe o seu e-mail. Enviamos um link para você criar uma nova senha.', `
      <form novalidate class="space-y-4" data-form>
        ${campo('email', 'E-mail', 'email', `autocomplete="username" value="${esc(estado.email)}"`)}
        <button type="submit" class="${BOTAO_PRI}">${primeiro ? 'Enviar código' : 'Enviar link'}</button>
      </form>
      <button type="button" class="${LINK} mt-4" data-ir="entrar">Voltar para entrar</button>`);
    const form = tela.querySelector('[data-form]');
    form.email.focus();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      if (!erro(form, 'email', !email ? 'Informe o e-mail.' : emailValido(email) ? '' : 'Confira o e-mail.')) return form.email.focus();
      const contas = contasDoPortal(email);
      // O primeiro acesso parte de um cadastro da escola, então diz quando não acha; a recuperação não revela se o e-mail existe.
      if (primeiro && !contas.length) return erro(form, 'email', 'Não encontramos esse e-mail. Confira com a secretaria.');
      estado = { ...estado, email, contas, aviso: '', modo: primeiro ? 'codigo' : 'enviado' };
      render();
    });
  }

  function renderEnviado() {
    const existe = estado.contas.length > 0;
    tela.innerHTML = cartao('Confira o seu e-mail', `Se houver uma conta com ${esc(estado.email)}, enviamos um link para criar uma nova senha. O link vale por 1 hora.`, `
      ${existe ? `<button type="button" class="${BOTAO_PRI}" data-ir="nova">Abrir o link do e-mail (demonstração)</button>` : ''}
      <button type="button" class="${LINK} mt-4" data-ir="entrar">Voltar para entrar</button>`);
  }

  function renderNovaSenha(comCodigo) {
    tela.innerHTML = cartao(comCodigo ? 'Crie a sua senha' : 'Nova senha',
      comCodigo ? `Enviamos um código de 6 dígitos para ${esc(mascarar(estado.email))}. Na demonstração, o código é ${Entrada.CODIGO_DEMO}.` : 'Escolha uma senha com pelo menos 8 caracteres.', `
      <form novalidate class="space-y-4" data-form>
        ${comCodigo ? campo('codigo', 'Código', 'text', 'inputmode="numeric" autocomplete="one-time-code" maxlength="6"') : ''}
        ${campo('nova', 'Nova senha', 'password', 'autocomplete="new-password"')}
        ${campo('confirmar', 'Confirmar a senha', 'password', 'autocomplete="new-password"')}
        <button type="submit" class="${BOTAO_PRI}">${comCodigo ? 'Criar senha e entrar' : 'Salvar senha'}</button>
      </form>
      <button type="button" class="${LINK} mt-4" data-ir="entrar">Voltar para entrar</button>`);
    const form = tela.querySelector('[data-form]');
    form.querySelector('input').focus();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = [
        comCodigo ? erro(form, 'codigo', form.codigo.value.trim() === Entrada.CODIGO_DEMO ? '' : 'Código incorreto.') : true,
        erro(form, 'nova', form.nova.value.length >= 8 ? '' : 'Use pelo menos 8 caracteres.'),
        erro(form, 'confirmar', form.confirmar.value === form.nova.value ? '' : 'As senhas não são iguais.'),
      ];
      if (ok.includes(false)) return form.querySelector('[aria-invalid="true"]').focus();
      Entrada.gravarSenha(estado.email, form.nova.value);
      if (!comCodigo) { estado = { ...estado, modo: 'entrar', aviso: 'Senha alterada. Entre com a nova senha.' }; return render(); }
      if (estado.contas.length === 1) location.href = Entrada.entrar(estado.contas[0], estado.email);
      else { estado.modo = 'escolher'; render(); }
    });
  }

  function render() {
    ({
      entrar: renderEntrar,
      escolher: renderEscolher,
      primeiro: () => renderPedirEmail(true),
      recuperar: () => renderPedirEmail(false),
      enviado: renderEnviado,
      codigo: () => renderNovaSenha(true),
      nova: () => renderNovaSenha(false),
    })[estado.modo]();
    tela.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => {
      estado = { ...estado, modo: b.dataset.ir, aviso: '' };
      render();
    }));
  }

  render();
})();
