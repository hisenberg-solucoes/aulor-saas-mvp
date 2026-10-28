// ============================================================
// Entrada (entrar.html): login, escolha do portal, primeiro acesso e
// recuperação de senha para a equipe, os professores e os alunos.
// Quem é quem vem dos cadastros (js/entrada.js). A pessoa escolhe
// primeiro o portal (administrativo, aluno ou professor) e entra só nele:
// ?portal=equipe|aluno|professor (as páginas de login dos portais trazem para
// cá); sem ele, a entrada abre na escolha. ?saiu=1 diz que a pessoa saiu.
// Senha: a do protótipo (123456) até a pessoa criar a dela no primeiro acesso
// ou na recuperação; as criadas ficam neste navegador. Só demonstra: na V1
// real, autenticação e permissões são do back-end.
// ============================================================

(function () {
  const params = new URLSearchParams(location.search);
  const PORTAIS = {
    equipe: { nome: 'Portal administrativo', apoio: 'Equipe da escola' },
    aluno: { nome: 'Portal do Aluno', apoio: 'Seus cursos, aulas e materiais' },
    professor: { nome: 'Portal do Professor', apoio: 'Suas turmas e os materiais das aulas' },
  };
  const PORTAL = Object.hasOwn(PORTAIS, params.get('portal') ?? '') ? params.get('portal') : null;
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

  let estado = { modo: PORTAL ? 'entrar' : 'portal', email: '', contas: [], aviso: params.get('saiu') ? 'Você saiu.' : '' };

  const contasDoPortal = (email) => Entrada.contas(email).filter((c) => c.portal === PORTAL);
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
    // Professor da demonstração: o da turma que já tem as aulas geradas e materiais (AULAS_GRAVADAS_SEED).
    const professores = Instrutores.carregar().filter((i) => i.status !== 'inativo' && i.contato?.email);
    const comAulas = TURMAS_CURSO.find((t) => AULAS_GRAVADAS_SEED.includes(t.id))?.instrutorId;
    const ins = professores.find((i) => i.id === comAulas) ?? professores[0];
    const alu = Clientes.carregar().alunos.find((a) => a.status !== 'inativo' && a.email);
    return [...porPerfil, ins && { nome: ins.nome, email: ins.contato.email, papel: 'Professor', portal: 'professor' }, alu && { nome: alu.nome, email: alu.email, papel: 'Aluno', portal: 'aluno' }]
      .filter((x) => x && x.portal === PORTAL);
  }

  // Primeiro passo: para qual portal a pessoa vai (lista contornada, uma linha-botão por portal, como a escolha de unidade).
  function renderPortal() {
    tela.innerHTML = cartao('Para onde você quer ir?', 'Escolha o portal e entre com o e-mail que a escola cadastrou.', `
      <ul class="divide-y divide-slate-200 dark:divide-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-800">
        ${Object.entries(PORTAIS).map(([id, p]) => `
        <li><a href="?portal=${id}" class="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-neutral-900">
          <span><span class="block font-medium text-slate-900 dark:text-neutral-100">${p.nome}</span><span class="block text-xs text-slate-500 dark:text-neutral-400">${p.apoio}</span></span>${SETA}
        </a></li>`).join('')}
      </ul>`);
  }

  function renderEntrar() {
    tela.innerHTML = cartao(`Entrar no ${PORTAIS[PORTAL].nome}`, 'Use o e-mail que a escola cadastrou.', `
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
      <a href="entrar.html" class="mt-4 inline-block ${LINK}">Trocar de portal</a>
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
      // Quem aceitou um convite de cadastro e ainda não enviou: a entrada abre o formulário dele (GAC-4 de AULOR-007).
      const convite = Convites.aguardando(email);
      if (convite && Entrada.senhaConfere(email, senha)) {
        Convites.marcarEntrada(convite.id, email);
        location.href = `convite.html?id=${encodeURIComponent(convite.id)}`;
        return;
      }
      const contas = contasDoPortal(email);
      const falha = form.querySelector('[data-falha]');
      if (!contas.length || !Entrada.senhaConfere(email, senha)) {
        falha.textContent = 'E-mail ou senha incorretos.'; falha.classList.remove('hidden');
        return;
      }
      // Um acesso por portal (Entrada.contas), e o portal já foi escolhido.
      location.href = Entrada.entrar(contas[0], email);
    });
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
      location.href = Entrada.entrar(estado.contas[0], estado.email);
    });
  }

  function render() {
    ({
      portal: renderPortal,
      entrar: renderEntrar,
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
