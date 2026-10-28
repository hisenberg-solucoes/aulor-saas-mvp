// ============================================================
// Convidado (convite.html?id=): onde o link do e-mail do convite de cadastro
// leva (AULOR-007). A pessoa entra com o e-mail convidado, por Microsoft ou por
// e-mail e senha (AULOR-002); o aceite cria ou reaproveita a conta, e o Aulor
// abre "Complete seu cadastro". Pelo convite da ficha, a mesma entrada só liga
// a pessoa ao acesso, sem formulário. Só demonstra: na V1 real, o Auth0
// autentica e a API confere o convite e o CPF.
// ============================================================

(function () {
  const id = new URLSearchParams(location.search).get('id');
  const tela = document.getElementById('tela');
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)] p-6';
  const TITULO = 'text-xl font-semibold tracking-tight text-slate-900 dark:text-neutral-100';
  const APOIO = 'mt-1 text-sm text-slate-500 dark:text-neutral-400';
  const ROTULO = 'block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1';
  const CAMPO = 'w-full h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 text-sm text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400 focus:ring-2 focus:ring-petrol-800/20 aria-[invalid=true]:border-red-500';
  const BOTAO_PRI = 'w-full inline-flex justify-center items-center h-9 px-3.5 rounded-lg text-sm font-semibold bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800 text-white transition';
  const BOTAO_SEC = 'w-full inline-flex justify-center items-center gap-2 h-9 px-3.5 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-700 dark:text-neutral-200 hover:border-petrol-800 dark:hover:border-sky-400 transition';
  const LINK = 'text-sm font-medium text-petrol-800 dark:text-sky-300 hover:underline';
  const OPCIONAL = '<span class="font-normal">(opcional)</span>';
  const ICONE_ERRO = '<svg class="h-3.5 w-3.5 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>';
  const MICROSOFT = '<svg class="h-4 w-4" viewBox="0 0 21 21" aria-hidden="true"><path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#7fba00" d="M11 1h9v9h-9z"/><path fill="#00a4ef" d="M1 11h9v9H1z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/></svg>';
  const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  const primeiroNome = (n) => String(n ?? '').trim().split(/\s+/)[0];

  function campo(nome, rotulo, { tipo = 'text', valor = '', extra = '', opcional = false, ajuda = '' } = {}) {
    return `
      <div>
        <label for="${nome}" class="${ROTULO}">${rotulo} ${opcional ? OPCIONAL : ''}</label>
        <input id="${nome}" name="${nome}" type="${tipo}" value="${esc(valor)}" class="${CAMPO}" aria-describedby="${nome}-erro" ${extra}>
        ${ajuda ? `<p class="mt-1 text-xs text-slate-500 dark:text-neutral-400">${ajuda}</p>` : ''}
        <p id="${nome}-erro" class="mt-1 hidden items-center gap-1 text-xs text-red-700 dark:text-red-400"></p>
      </div>`;
  }
  function erro(form, nome, msg) {
    const input = form.querySelector(`[name="${nome}"]`);
    const p = form.querySelector(`#${nome}-erro`);
    input?.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (p) {
      p.innerHTML = msg ? `${ICONE_ERRO}<span>${esc(msg)}</span>` : '';
      p.classList.toggle('hidden', !msg);
      p.classList.toggle('flex', !!msg);
    }
    return !msg;
  }
  function cartao(titulo, apoio, corpo) {
    tela.innerHTML = `
      <section class="${CARTAO}">
        <h1 class="${TITULO}">${titulo}</h1>
        ${apoio ? `<p class="${APOIO}">${apoio}</p>` : ''}
        <div class="mt-5">${corpo}</div>
      </section>`;
  }

  // Depois do cadastro, segue para o que o perfil permite (D16): a administração ou o portal do professor.
  function irParaOAulor(email) {
    const contas = Entrada.contas(email);
    const conta = contas.find((c) => c.portal === 'equipe') ?? contas.find((c) => c.portal === 'professor');
    location.href = conta ? Entrada.entrar(conta, email) : 'entrar.html';
  }
  const botaoAulor = `<button type="button" data-ir class="${BOTAO_PRI}">Entrar no Aulor</button>`;
  const ligarAulor = (email) => tela.querySelector('[data-ir]')?.addEventListener('click', () => irParaOAulor(email));

  // ---------- Entrar com o e-mail do convite ----------

  function renderEntrar(cv) {
    cartao(`A ${esc(UNIDADE)} convidou você para o Aulor`, 'Entre com o e-mail que recebeu o convite. Na primeira vez, a sua conta nasce agora.', `
      <button type="button" data-microsoft class="${BOTAO_SEC}">${MICROSOFT} Entrar com a Microsoft</button>
      <p class="my-4 flex items-center gap-3 text-xs text-slate-500 dark:text-neutral-400"><span class="h-px flex-1 bg-slate-200 dark:bg-neutral-800"></span>ou<span class="h-px flex-1 bg-slate-200 dark:bg-neutral-800"></span></p>
      <form novalidate class="space-y-4" data-form>
        ${campo('email', 'E-mail', { tipo: 'email', extra: 'autocomplete="username"' })}
        ${campo('senha', 'Senha', { tipo: 'password', extra: 'autocomplete="current-password"', ajuda: `Protótipo: quem já tem conta usa a senha dela (${Entrada.SENHA_PROTOTIPO}); quem é novo cria uma com 8 caracteres ou mais.` })}
        <button type="submit" class="${BOTAO_PRI}">Entrar</button>
      </form>`);
    const form = tela.querySelector('[data-form]');
    form.email.focus();
    // Protótipo: a Microsoft devolve a conta do e-mail convidado, como numa escola que entra pelo Entra.
    tela.querySelector('[data-microsoft]').addEventListener('click', () => { Convites.marcarEntrada(cv.id, cv.email); render(); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      const senha = form.senha.value;
      const ok = [erro(form, 'email', !email ? 'Informe o e-mail.' : emailValido(email) ? '' : 'Confira o e-mail.'), erro(form, 'senha', senha ? '' : 'Informe a senha.')];
      if (ok.includes(false)) return form.querySelector('[aria-invalid="true"]').focus();
      // Como em AULOR-002: o aceite exige o e-mail do convite.
      if (email.toLowerCase() !== cv.email.toLowerCase()) { erro(form, 'email', 'Este convite é para outro e-mail. Entre com o e-mail que recebeu o convite.'); return form.email.focus(); }
      if (!Entrada.senhaConfere(email, senha)) {
        if (Entrada.contas(email).length || senha.length < 8) { erro(form, 'senha', 'E-mail ou senha incorretos.'); return form.senha.focus(); }
        Entrada.gravarSenha(email, senha);
      }
      Convites.marcarEntrada(cv.id, email);
      render();
    });
  }

  // ---------- Complete seu cadastro ----------

  function renderFormulario(cv) {
    const instrutor = cv.papel === 'instrutor';
    const d = cv.dados;
    const daEscola = instrutor
      ? [['Papel', 'Instrutor'], ['Remuneração', REMUNERACOES_INSTRUTOR.find((r) => r.id === d.remuneracao)?.nome], ['Especialidade', d.especialidade]]
      : [['Papel', 'Colaborador'], ['Cargo', d.cargo], ['Departamento', DEPARTAMENTOS.find((x) => x.id === d.departamentoId)?.nome], ['Admissão', Instrutores.fmtData(d.admissao)], ['E-mail corporativo', d.emailCorporativo]];
    cartao('Complete seu cadastro', `Confira o que a ${esc(UNIDADE)} já informou e complete os seus dados. Depois é só entrar no Aulor.`, `
      <dl class="mb-5 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 dark:bg-neutral-900 px-4 py-3 text-sm">
        ${daEscola.filter(([, v]) => v).map(([r, v]) => `<div><dt class="text-xs text-slate-500 dark:text-neutral-400">${r}</dt><dd class="text-slate-800 dark:text-neutral-100">${esc(v)}</dd></div>`).join('')}
        <p class="col-span-2 text-xs text-slate-500 dark:text-neutral-400">Informado pela escola. Se algo estiver errado, fale com ela.</p>
      </dl>
      <form novalidate class="space-y-4" data-form>
        ${campo('nome', 'Nome completo', { valor: cv.nome, extra: 'autocomplete="name"', ajuda: 'Muda o seu nome na escola, não o da sua conta.' })}
        <div class="grid grid-cols-2 gap-3">
          ${campo('cpf', 'CPF', { extra: 'inputmode="numeric" data-mascara="cpf" maxlength="14" placeholder="000.000.000-00"' })}
          ${campo('nascimento', 'Nascimento', { tipo: 'date', opcional: true })}
        </div>
        ${campo('nomeSocial', 'Nome social', { opcional: true, ajuda: 'Aparece no lugar do nome nas listas e fichas.' })}
        ${instrutor ? `
        <div class="grid grid-cols-2 gap-3">
          ${campo('apelido', 'Como gosta de ser chamado', { opcional: true })}
          ${campo('whatsapp', 'WhatsApp', { valor: Instrutores.fmtTelefone(d.whatsapp), extra: 'inputmode="tel" placeholder="(47) 99999-9999"', opcional: true })}
        </div>
        ${campo('email', 'E-mail de contato', { tipo: 'email', valor: cv.email, ajuda: 'Vem com o e-mail do convite; pode ser outro.' })}
        <div>
          <label for="bio" class="${ROTULO}">Sobre ${OPCIONAL}</label>
          <textarea id="bio" name="bio" rows="3" maxlength="600" class="${CAMPO.replace('h-9 ', '')} py-2" placeholder="Resumo profissional que aparece para a equipe."></textarea>
        </div>` : campo('celular', 'Celular', { extra: 'inputmode="tel" placeholder="(47) 99999-9999"', opcional: true })}
        <button type="submit" class="${BOTAO_PRI}">Enviar cadastro</button>
      </form>`);
    const form = tela.querySelector('[data-form]');
    form.cpf.focus();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const dados = Object.fromEntries(new FormData(form));
      const r = Convites.concluir(cv.id, dados);
      form.querySelectorAll('[aria-invalid="true"]').forEach((i) => erro(form, i.name, ''));
      if (r.erros) { r.erros.forEach((x) => erro(form, x.campo, x.mensagem)); form.querySelector(`[name="${r.erros[0].campo}"]`)?.focus(); return; }
      render();
    });
  }

  // ---------- Os outros estados ----------

  function render() {
    const cv = Convites.porId(id);
    const motivo = Convites.bloqueio(cv);
    if (motivo === 'expirado') return cartao('Este convite expirou', `Os convites valem por ${Convites.PRAZO_DIAS} dias. Peça à escola para reenviar.`, '');
    if (motivo) return cartao('Convite indisponível', 'Este convite não vale mais. Fale com a escola que convidou você.', '');
    const email = Convites.entrada(id);
    if (!email) return renderEntrar(cv);
    const atual = Convites.aceitar(id, email).convite;
    // Recusa final do envio (GAC-5): a mesma mensagem a cada entrada, sem formulário e sem dados de ninguém.
    if (atual.estado === 'coordenacao') return cartao('A escola vai concluir o seu cadastro', `A coordenação da ${esc(UNIDADE)} vai concluir o seu cadastro. Não é preciso enviar de novo.`, `<a href="entrar.html" class="${LINK}">Sair</a>`);
    if (atual.estado === 'aceito') return renderFormulario(atual);
    if (atual.pessoaId) {
      cartao(atual.estado === 'concluido' ? 'Tudo pronto' : 'Acesso liberado', atual.estado === 'concluido' ? `Seu acesso está ligado ao seu cadastro na ${esc(UNIDADE)}.` : 'Você já pode entrar no Aulor com este e-mail.', botaoAulor);
    } else {
      const papel = atual.papel === 'instrutor' ? 'instrutor' : 'colaborador';
      cartao('Cadastro concluído', `Pronto, ${esc(primeiroNome(atual.nome))}! Seu cadastro de ${papel} na ${esc(UNIDADE)} já está ligado ao seu acesso.`, botaoAulor);
    }
    return ligarAulor(email);
  }

  render();
})();
