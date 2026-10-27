// Portal do Professor — tela de login (UI).
(() => {
  // Já logado: vai direto para a home.
  if (PortalProfessor.sessao()) { location.replace('home.html'); return; }

  const $ = (id) => document.getElementById(id);
  const form = $('form-login');
  const email = $('email');
  const senha = $('senha');
  const erro = $('erro');
  const botao = $('entrar');

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast-anim pointer-events-auto rounded-lg bg-slate-900 dark:bg-neutral-800 text-white text-sm px-4 py-2 shadow-lg';
    el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function mostrarErro(msg) {
    erro.textContent = msg;
    erro.classList.remove('hidden');
    [email, senha].forEach((c) => c.classList.add('campo-erro'));
    form.classList.remove('tremer'); void form.offsetWidth; form.classList.add('tremer');
  }
  function limparErro() {
    erro.classList.add('hidden');
    [email, senha].forEach((c) => c.classList.remove('campo-erro'));
  }
  [email, senha].forEach((c) => c.addEventListener('input', limparErro));

  $('ver-senha').addEventListener('click', (e) => {
    const mostrar = senha.type === 'password';
    senha.type = mostrar ? 'text' : 'password';
    e.currentTarget.setAttribute('aria-pressed', String(mostrar));
    e.currentTarget.title = mostrar ? 'Ocultar senha' : 'Mostrar senha';
    e.currentTarget.querySelector('[data-olho-aberto]').classList.toggle('hidden', mostrar);
    e.currentTarget.querySelector('[data-olho-fechado]').classList.toggle('hidden', !mostrar);
    senha.focus();
  });

  $('esqueci').addEventListener('click', () => {
    const e = email.value.trim();
    toast(e ? `Se ${e} estiver cadastrado, enviamos o link para redefinir a senha.` : 'Informe seu e-mail para receber o link de redefinição.');
    if (!e) email.focus();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    limparErro();
    const r = PortalProfessor.autenticar(email.value, senha.value);
    if (r.erro) { mostrarErro(r.erro); (email.value.trim() ? senha : email).focus(); return; }
    botao.disabled = true;
    botao.textContent = 'Entrando…';
    PortalProfessor.entrar(r.instrutor.id);
    // Pequena espera só para o feedback do botão aparecer.
    setTimeout(() => location.replace('home.html'), 350);
  });
})();
