// Portal do Aluno — Meus dados (UI). O aluno vê o próprio cadastro e edita só o que é dele
// (contato, endereço, necessidades, consentimentos); identificação é só leitura e pede correção
// à secretaria. Tudo grava pelo motor Clientes, na mesma chave do administrativo
// (../aluno.html?id= enxerga a alteração). Senha e preferências são simulação do protótipo.
(() => {
  const aluno0 = PortalAluno.alunoLogado();
  if (!aluno0) { PortalAluno.sair(); location.replace('login.html'); return; }

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const C = Clientes;
  const nomeDe = (lista, id) => lista.find((x) => x.id === id)?.nome ?? '';
  const vazio = (v, alt = '—') => (v ? esc(v) : `<span class="text-slate-400 dark:text-neutral-500">${alt}</span>`);
  const GENEROS = [{ id: 'feminino', nome: 'Feminino' }, { id: 'masculino', nome: 'Masculino' }, { id: 'outro', nome: 'Outro / prefiro não informar' }];

  // Chaves próprias do portal (não existem no modelo do aluno do administrativo).
  const CHAVE_PREFERENCIAS = 'aulor-v1-portal-aluno-preferencias-v1';
  const CHAVE_PRIVACIDADE = 'aulor-v1-portal-aluno-privacidade-v1';

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast-anim pointer-events-auto rounded-lg bg-slate-900 dark:bg-neutral-800 text-white text-sm px-4 py-2 shadow-lg';
    el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  // ---------- Estado / persistência (motor Clientes, chave do administrativo) ----------

  const estado = { dados: C.carregar(), aba: 'pessoais' };
  const aluno = () => C.porId(estado.dados.alunos, aluno0.id);
  function persistir(dados) { estado.dados = dados; C.salvar(dados); }

  const lerJson = (chave, padrao) => { try { const v = JSON.parse(localStorage.getItem(chave) ?? 'null'); return v ?? padrao; } catch (_) { return padrao; } };
  const preferencias = () => ({ email: true, whatsapp: true, ...(lerJson(CHAVE_PREFERENCIAS, {})[aluno0.id] ?? {}) });
  function salvarPreferencias(p) { const todas = lerJson(CHAVE_PREFERENCIAS, {}); todas[aluno0.id] = p; localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(todas)); }
  const solicitacoesPrivacidade = () => lerJson(CHAVE_PRIVACIDADE, []).filter((s) => s.alunoId === aluno0.id).sort((a, b) => b.em.localeCompare(a.em));
  const solicitacaoPrivacidadeAberta = (tipo) => solicitacoesPrivacidade().find((s) => s.tipo === tipo && s.status === 'em_analise') ?? null;
  function registrarPrivacidade(tipo, dados = {}) {
    const l = lerJson(CHAVE_PRIVACIDADE, []);
    const s = { id: `priv${Date.now().toString(36)}`, alunoId: aluno0.id, tipo, em: new Date().toISOString().slice(0, 19), status: 'em_analise', dados };
    localStorage.setItem(CHAVE_PRIVACIDADE, JSON.stringify([...l, s]));
    return s;
  }
  const TIPOS_PRIVACIDADE = { exportacao: 'Exportação dos meus dados', exclusao: 'Exclusão do cadastro' };

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModal(); });

  // ---------- Modal centralizado ----------

  function abrirModal(html, largura = 'max-w-2xl') {
    const caixa = $('modal-caixa');
    caixa.className = `cartao modal-anim w-full ${largura} max-h-[90vh] overflow-y-auto`;
    caixa.innerHTML = html;
    $('modal').classList.remove('hidden');
    return caixa;
  }
  function fecharModal() { $('modal').classList.add('hidden'); $('modal-caixa').innerHTML = ''; }
  $('modal').addEventListener('click', (e) => { if (e.target === $('modal')) fecharModal(); });
  $('modal-caixa').addEventListener('click', (e) => { if (e.target.closest('[data-fechar]')) fecharModal(); });

  const cabecalhoModal = (titulo, sub = '') => `
    <div class="px-5 py-4 border-b border-slate-100 dark:border-neutral-900 flex items-start justify-between gap-3">
      <div class="min-w-0"><p class="titulo-secao">${titulo}</p>${sub ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${sub}</p>` : ''}</div>
      <button type="button" data-fechar title="Fechar" class="-mr-1 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-900"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
    </div>`;
  const rodapeModal = (confirmar, classe = 'botao-pri') => `
    <div class="px-5 py-3 border-t border-slate-100 dark:border-neutral-900 flex justify-end gap-2">
      <button type="button" data-fechar class="botao-sec">Cancelar</button>
      <button type="submit" class="${classe}">${confirmar}</button>
    </div>`;
  const BOTAO_PERIGO = 'inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40';
  const erroDe = (campo) => `<p data-erro="${campo}" class="hidden mt-1 text-xs text-red-600 dark:text-red-400"></p>`;
  function mostrarErros(root, erros) {
    root.querySelectorAll('[data-erro]').forEach((p) => { p.classList.add('hidden'); p.textContent = ''; });
    root.querySelectorAll('.campo-erro').forEach((el) => el.classList.remove('campo-erro'));
    erros.forEach((e) => {
      const p = root.querySelector(`[data-erro="${e.campo}"]`);
      if (p) { p.textContent = e.mensagem; p.classList.remove('hidden'); }
      root.querySelector(`[name="${e.campo}"]`)?.classList.add('campo-erro');
    });
    root.querySelector('.campo-erro')?.focus();
    return erros.length > 0;
  }
  const campoTexto = (nome, rotulo, valor, extra = {}) => `
    <div class="${extra.classe ?? ''}">
      <label class="rotulo" for="f-${nome}">${rotulo}${extra.opcional ? ' <span class="normal-case font-normal tracking-normal text-slate-400">(opcional)</span>' : ''}</label>
      <input id="f-${nome}" name="${nome}" type="${extra.tipo ?? 'text'}" class="campo mt-1" value="${esc(valor)}" ${extra.attrs ?? ''}>
      ${erroDe(nome)}
    </div>`;

  // Máscaras leves (o motor guarda só dígitos; aqui só a exibição enquanto digita).
  function mascarar(input, fn) {
    input.addEventListener('input', () => { const p = input.selectionStart === input.value.length; input.value = fn(input.value); if (p) input.setSelectionRange(input.value.length, input.value.length); });
  }
  const mascaraTelefone = (v) => { const d = C.digitos(v).slice(0, 11); if (d.length <= 2) return d; if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`; if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`; return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`; };
  const mascaraCep = (v) => { const d = C.digitos(v).slice(0, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d; };

  // ---------- Cabeçalho da página ----------

  function situacaoCadastro(a) {
    const pend = C.pendenciasAluno(a, estado.dados.empresas);
    if (a.status === 'inativo') return { cor: 'bg-slate-400', texto: 'Cadastro inativo' };
    if (a.inadimplencia?.devedor) return { cor: 'bg-red-500', texto: 'Pendência financeira — veja em Financeiro' };
    if (pend.length) return { cor: 'bg-amber-500', texto: `Cadastro incompleto: ${pend.join(', ').toLowerCase()}` };
    return null; // o que está certo não se anuncia (DESIGN.md)
  }

  function renderCabecalho() {
    const a = aluno();
    const nome = a.nomeSocial || a.nome;
    // O nome na barra de contexto (js/menu-portal.js) acompanha a edição; na primeira carga a barra ainda não existe.
    document.querySelector('.shell-usuario-nome')?.replaceChildren(nome);
    $('avatar-grande').innerHTML = avatarHtml(a, nome);
    $('cab-nome').textContent = nome;
    $('cab-email').textContent = a.email || 'Sem e-mail cadastrado';
    const s = situacaoCadastro(a);
    $('cab-situacao').innerHTML = s ? `<span class="inline-flex items-center gap-1.5 text-slate-700 dark:text-neutral-200"><span class="h-2 w-2 rounded-full ${s.cor}"></span>${esc(s.texto)}</span>` : '';
    $('cab-acoes').innerHTML = `<button type="button" data-acao="editar-contato" class="botao-sec">Editar contato</button><button type="button" data-acao="senha" class="botao-pri">Alterar senha</button>`;
  }

  // ---------- Abas ----------

  const ABAS = [
    { id: 'pessoais', titulo: 'Dados pessoais' },
    { id: 'contato', titulo: 'Contato e endereço' },
    { id: 'necessidades', titulo: 'Necessidades e acessibilidade' },
    { id: 'responsaveis', titulo: 'Responsáveis' },
    { id: 'acesso', titulo: 'Acesso' },
    { id: 'privacidade', titulo: 'Privacidade' },
  ];
  const abaUrl = new URLSearchParams(location.search).get('aba');
  if (ABAS.some((x) => x.id === abaUrl)) estado.aba = abaUrl;

  function renderAbas() {
    const a = aluno();
    const n = (id) => (id === 'responsaveis' ? C.responsaveisDoAluno(estado.dados, a.id).length || null : id === 'necessidades' ? a.necessidades.tipos.length || null : null);
    $('abas').innerHTML = ABAS.map((x) => `
      <button type="button" data-aba="${x.id}" class="px-1 pb-2.5 -mb-px text-sm border-b-2 transition whitespace-nowrap ${estado.aba === x.id ? 'border-[color:var(--f-marca-tinta)] text-slate-900 dark:text-neutral-100 font-medium' : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'}">${x.titulo}${n(x.id) ? ` <span class="ml-1 text-xs text-slate-400 tabular-nums">${n(x.id)}</span>` : ''}</button>`).join('');
  }

  function render() {
    renderCabecalho();
    renderAbas();
    const q = new URLSearchParams(location.search); q.set('aba', estado.aba); history.replaceState(null, '', `?${q}`);
    ({ pessoais: renderPessoais, contato: renderContato, necessidades: renderNecessidades, responsaveis: renderResponsaveis, acesso: renderAcesso, privacidade: renderPrivacidade })[estado.aba]();
  }

  // Ficha em duas colunas (rótulo + valor).
  const item = (rotulo, valor) => `<div><dt class="rotulo">${rotulo}</dt><dd class="mt-0.5 text-sm text-slate-800 dark:text-neutral-100">${valor}</dd></div>`;
  const cartaoSecao = (titulo, corpo, acoes = '') => `
    <div class="cartao">
      <div class="px-5 py-4 border-b border-slate-100 dark:border-neutral-900 flex flex-wrap items-center justify-between gap-3"><p class="titulo-secao">${titulo}</p><div class="flex gap-2">${acoes}</div></div>
      <div class="p-5">${corpo}</div>
    </div>`;

  // ---------- Foto do aluno ----------
  // Guardada em `aluno.foto` (data URL JPEG, redimensionada para 320px no navegador) na mesma chave de Clientes — o administrativo mostra a mesma foto.
  const FOTO_LADO = 320;
  const FOTO_MAX_MB = 5;
  const avatarHtml = (a, nome) => (a.foto ? `<img src="${esc(a.foto)}" alt="" class="h-full w-full object-cover rounded-full">` : esc(PortalAluno.iniciais(nome)));
  function salvarFoto(foto) {
    const a = aluno0;
    persistir({ ...estado.dados, alunos: estado.dados.alunos.map((x) => (x.id === a.id ? { ...x, foto: foto || '' } : x)) });
    renderCabecalho();
    render();
  }
  // Lê o arquivo, recorta ao quadrado central e reduz — evita estourar o localStorage com fotos de celular.
  function processarFoto(arquivo) {
    return new Promise((resolver, rejeitar) => {
      if (!arquivo.type.startsWith('image/')) { rejeitar(new Error('Escolha um arquivo de imagem (JPG, PNG, HEIC…).')); return; }
      if (arquivo.size > FOTO_MAX_MB * 1024 * 1024) { rejeitar(new Error(`A imagem tem mais de ${FOTO_MAX_MB} MB. Escolha uma menor.`)); return; }
      const img = new Image();
      const url = URL.createObjectURL(arquivo);
      img.onload = () => {
        const lado = Math.min(img.naturalWidth, img.naturalHeight);
        const c = document.createElement('canvas');
        c.width = c.height = FOTO_LADO;
        c.getContext('2d').drawImage(img, (img.naturalWidth - lado) / 2, (img.naturalHeight - lado) / 2, lado, lado, 0, 0, FOTO_LADO, FOTO_LADO);
        URL.revokeObjectURL(url);
        resolver(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => { URL.revokeObjectURL(url); rejeitar(new Error('Não foi possível abrir essa imagem.')); };
      img.src = url;
    });
  }
  function modalFoto() {
    const a = aluno();
    let nova = null;
    const caixa = abrirModal(`${cabecalhoModal(a.foto ? 'Trocar foto' : 'Enviar foto', 'Aparece no portal, na chamada do instrutor e no seu cadastro na secretaria.')}
      <form id="form-foto" novalidate>
        <div class="p-5 flex flex-col sm:flex-row items-center gap-5">
          <div id="foto-previa" class="h-32 w-32 shrink-0 rounded-full bg-petrol-800 dark:bg-sky-600 text-white grid place-items-center text-3xl font-display font-semibold overflow-hidden">${avatarHtml(a, a.nomeSocial || a.nome)}</div>
          <div class="flex-1 min-w-0 w-full">
            <label for="foto-arquivo" class="block rounded-xl border-2 border-dashed border-slate-300 dark:border-neutral-700 hover:border-petrol-800 dark:hover:border-sky-400 p-5 text-center cursor-pointer transition">
              <p class="text-sm font-medium text-slate-800 dark:text-neutral-100">Escolher imagem</p>
              <p class="text-xs text-slate-500 dark:text-neutral-400 mt-1">JPG ou PNG, até ${FOTO_MAX_MB} MB. A foto é recortada ao quadrado central.</p>
              <input id="foto-arquivo" type="file" accept="image/*" class="sr-only">
            </label>
            ${erroDe('foto')}
          </div>
        </div>
        <div class="px-5 py-3 border-t border-slate-100 dark:border-neutral-900 flex flex-wrap justify-between gap-2">
          <div>${a.foto ? '<button type="button" data-remover-foto class="botao-sec text-red-600 dark:text-red-400">Remover foto</button>' : ''}</div>
          <div class="flex gap-2"><button type="button" data-fechar class="botao-sec">Cancelar</button><button type="submit" class="botao-pri" disabled>Salvar foto</button></div>
        </div>
      </form>`, 'max-w-lg');
    const form = caixa.querySelector('#form-foto');
    const salvar = form.querySelector('button[type="submit"]');
    form.querySelector('#foto-arquivo').addEventListener('change', async (e) => {
      const arquivo = e.target.files?.[0];
      if (!arquivo) return;
      try {
        nova = await processarFoto(arquivo);
        mostrarErros(form, []);
        form.querySelector('#foto-previa').innerHTML = `<img src="${nova}" alt="" class="h-full w-full object-cover">`;
        salvar.disabled = false;
      } catch (err) { nova = null; salvar.disabled = true; mostrarErros(form, [{ campo: 'foto', mensagem: err.message }]); }
    });
    form.querySelector('[data-remover-foto]')?.addEventListener('click', () => { salvarFoto(''); fecharModal(); toast('Foto removida.'); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!nova) return;
      salvarFoto(nova);
      fecharModal();
      toast('Foto atualizada.');
    });
  }

  // ---------- Dados pessoais (só leitura) ----------

  function renderPessoais() {
    const a = aluno();
    const idade = C.idade(a.nascimento);
    const empresa = a.empresaId ? C.porId(estado.dados.empresas, a.empresaId) : null;
    $('conteudo-aba').innerHTML = `
      <div class="space-y-5">
        ${cartaoSecao('Foto', `
          <div class="flex items-center gap-5">
            <div class="h-20 w-20 shrink-0 rounded-full bg-petrol-800 dark:bg-sky-600 text-white grid place-items-center text-2xl font-display font-semibold overflow-hidden">${avatarHtml(a, a.nomeSocial || a.nome)}</div>
            <div class="text-sm text-slate-600 dark:text-neutral-300">${a.foto ? 'Sua foto aparece no portal, na chamada do instrutor e no seu cadastro na secretaria.' : 'Você ainda não enviou uma foto — o instrutor a usa para reconhecer a turma na chamada.'}</div>
          </div>`,
          `<button type="button" data-acao="foto" class="${a.foto ? 'botao-sec' : 'botao-pri'}">${a.foto ? 'Trocar foto' : 'Enviar foto'}</button>`)}
        ${cartaoSecao('Identificação', `
          <dl class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
            ${item('Nome completo', vazio(a.nome))}
            ${item('Nome social', vazio(a.nomeSocial, 'Não informado'))}
            ${item('CPF', vazio(C.fmtCpf(a.cpf)))}
            ${item('RG', vazio(a.rg, 'Não informado'))}
            ${item('Data de nascimento', a.nascimento ? `${esc(C.fmtData(a.nascimento))}${idade != null ? ` <span class="text-slate-500 dark:text-neutral-400">· ${idade} anos</span>` : ''}` : vazio('', 'Não informada'))}
            ${item('Gênero', vazio(nomeDe(GENEROS, a.genero), 'Não informado'))}
            ${item('Escolaridade', vazio(nomeDe(ESCOLARIDADES, a.escolaridade), 'Não informada'))}
            ${item('Profissão', vazio(a.profissao, 'Não informada'))}
            ${empresa ? item('Empresa', `${esc(empresa.nomeFantasia || empresa.razaoSocial)}${a.cargo ? ` <span class="text-slate-500 dark:text-neutral-400">· ${esc(a.cargo)}</span>` : ''}`) : ''}
          </dl>
          <p class="text-sm text-slate-500 dark:text-neutral-400 mt-5">Nome, CPF e data de nascimento saem no contrato. Para alterar, fale com a secretaria.</p>`,
          '<button type="button" data-acao="corrigir" class="botao-sec">Solicitar correção</button>')}
      </div>`;
  }

  // ---------- Contato e endereço (editáveis) ----------

  function renderContato() {
    const a = aluno();
    const e = a.endereco;
    const completo = C.enderecoCompleto(e);
    $('conteudo-aba').innerHTML = `
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        ${cartaoSecao('Contato', `
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            ${item('E-mail (login do portal)', vazio(a.email, 'Não informado'))}
            ${item('Celular / WhatsApp', vazio(C.fmtTelefone(a.celular), 'Não informado'))}
            ${item('Outro telefone', vazio(C.fmtTelefone(a.telefone), 'Não informado'))}
          </dl>`, '<button type="button" data-acao="editar-contato" class="botao-sec">Editar contato</button>')}
        ${cartaoSecao('Endereço', completo || e.logradouro ? `
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            ${item('Logradouro', `${esc(e.logradouro)}${e.numero ? `, ${esc(e.numero)}` : ''}${e.complemento ? ` <span class="text-slate-500 dark:text-neutral-400">· ${esc(e.complemento)}</span>` : ''}`)}
            ${item('Bairro', vazio(e.bairro))}
            ${item('Cidade / UF', vazio([e.cidade, e.uf].filter(Boolean).join(' / ')))}
            ${item('CEP', vazio(C.fmtCep(e.cep)))}
          </dl>
          ${!completo ? '<p class="text-sm text-amber-700 dark:text-amber-400 mt-4">Endereço incompleto — necessário para emitir boleto e contrato.</p>' : ''}`
          : '<p class="text-sm text-slate-500 dark:text-neutral-400">Nenhum endereço cadastrado. Ele é necessário para contrato e boleto.</p>',
          '<button type="button" data-acao="editar-endereco" class="botao-sec">Editar endereço</button>')}
      </div>`;
  }

  function modalContato() {
    const a = aluno();
    abrirModal(`${cabecalhoModal('Editar contato', 'E-mail, celular e telefone do seu cadastro.')}
      <form id="form-contato" novalidate>
        <div class="p-5 space-y-4">
          ${campoTexto('email', 'E-mail', a.email, { tipo: 'email', attrs: 'autocomplete="email"' })}
          <p id="aviso-email" class="hidden text-sm text-amber-700 dark:text-amber-400 -mt-2">Este e-mail é o seu login: depois de salvar, o acesso ao portal passa a ser pelo novo e-mail.</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            ${campoTexto('celular', 'Celular / WhatsApp', C.fmtTelefone(a.celular), { attrs: 'inputmode="tel" autocomplete="tel"' })}
            ${campoTexto('telefone', 'Outro telefone', C.fmtTelefone(a.telefone), { opcional: true, attrs: 'inputmode="tel"' })}
          </div>
        </div>
        ${rodapeModal('Salvar')}
      </form>`, 'max-w-lg');
    const form = $('form-contato');
    mascarar($('f-celular'), mascaraTelefone);
    mascarar($('f-telefone'), mascaraTelefone);
    $('f-email').addEventListener('input', (e) => $('aviso-email').classList.toggle('hidden', e.target.value.trim().toLowerCase() === String(a.email).trim().toLowerCase()));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const d = { ...a, email: String(fd.get('email') ?? '').trim(), celular: String(fd.get('celular') ?? ''), telefone: String(fd.get('telefone') ?? '') };
      const erros = C.validarAluno(d, estado.dados.alunos, a.id).filter((x) => ['email', 'celular', 'telefone'].includes(x.campo));
      if (!d.email) erros.push({ campo: 'email', mensagem: 'O e-mail é o seu login — não pode ficar vazio.' });
      else if (estado.dados.alunos.some((x) => x.id !== a.id && String(x.email).trim().toLowerCase() === d.email.toLowerCase())) erros.push({ campo: 'email', mensagem: 'Este e-mail já está em uso em outro cadastro.' });
      if (!C.digitos(d.celular)) erros.push({ campo: 'celular', mensagem: 'Informe o celular.' });
      if (mostrarErros(form, erros)) return;
      const trocouEmail = d.email.toLowerCase() !== String(a.email).trim().toLowerCase();
      persistir(C.atualizarDadosAluno(estado.dados, a.id, d));
      fecharModal(); render();
      toast(trocouEmail ? `Contato atualizado. Seu login agora é ${d.email}.` : 'Contato atualizado.');
    });
    $('f-email').focus();
  }

  function modalEndereco() {
    const a = aluno();
    const e = a.endereco;
    abrirModal(`${cabecalhoModal('Editar endereço', 'Endereço usado no contrato e no boleto.')}
      <form id="form-endereco" novalidate>
        <div class="p-5 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            ${campoTexto('cep', 'CEP', C.fmtCep(e.cep), { attrs: 'inputmode="numeric" autocomplete="postal-code"' })}
            ${campoTexto('logradouro', 'Logradouro', e.logradouro, { classe: 'sm:col-span-2', attrs: 'autocomplete="address-line1"' })}
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            ${campoTexto('numero', 'Número', e.numero)}
            ${campoTexto('complemento', 'Complemento', e.complemento, { opcional: true, classe: 'sm:col-span-2' })}
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            ${campoTexto('bairro', 'Bairro', e.bairro)}
            ${campoTexto('cidade', 'Cidade', e.cidade, { attrs: 'autocomplete="address-level2"' })}
            <div>
              <label class="rotulo" for="f-uf">UF</label>
              <select id="f-uf" name="uf" class="select w-full mt-1"><option value="">—</option>${UFS.map((u) => `<option value="${u}" ${e.uf === u ? 'selected' : ''}>${u}</option>`).join('')}</select>
              ${erroDe('uf')}
            </div>
          </div>
        </div>
        ${rodapeModal('Salvar')}
      </form>`);
    const form = $('form-endereco');
    mascarar($('f-cep'), mascaraCep);
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const end = Object.fromEntries(['cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf'].map((k) => [k, String(fd.get(k) ?? '')]));
      const erros = C.validarEndereco(end);
      ['logradouro', 'numero', 'bairro', 'cidade'].forEach((k) => { if (!end[k].trim()) erros.push({ campo: k, mensagem: 'Obrigatório.' }); });
      if (!C.digitos(end.cep)) erros.push({ campo: 'cep', mensagem: 'Informe o CEP.' });
      if (!end.uf) erros.push({ campo: 'uf', mensagem: 'Escolha a UF.' });
      if (mostrarErros(form, erros)) return;
      // Mantém pagador, responsável financeiro e cobrança como estão: só o endereço muda.
      const fin = C.responsavelFinanceiroDoAluno(estado.dados, a.id);
      persistir(C.atualizarEnderecoCobrancaAluno(estado.dados, a.id, { endereco: end, pagador: a.pagador, responsavelId: fin?.vinculo.responsavelId ?? '', cobranca: a.cobranca }));
      fecharModal(); render();
      toast('Endereço atualizado.');
    });
    $('f-cep').focus();
  }

  // ---------- Necessidades e acessibilidade (editável) ----------

  function renderNecessidades() {
    const a = aluno();
    const n = a.necessidades;
    const tem = C.temNecessidades(a);
    $('conteudo-aba').innerHTML = cartaoSecao('Necessidades e acessibilidade', tem ? `
        <ul class="space-y-2">
          ${n.tipos.map((t) => { const tipo = TIPOS_NECESSIDADE.find((x) => x.id === t); return `<li class="text-sm"><span class="font-medium text-slate-800 dark:text-neutral-100">${esc(tipo?.nome ?? t)}</span>${tipo?.descricao ? ` <span class="text-slate-500 dark:text-neutral-400">— ${esc(tipo.descricao)}</span>` : ''}</li>`; }).join('')}
        </ul>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-5">
          ${item('Detalhes', vazio(n.detalhes, 'Não informado'))}
          ${item('Como a escola deve atender', vazio(n.atendimento, 'Não informado'))}
        </dl>
        <p class="text-sm text-slate-500 dark:text-neutral-400 mt-5">Dado sensível: só a secretaria e o instrutor da sua turma têm acesso.</p>`
      : '<p class="text-sm text-slate-500 dark:text-neutral-400">Nenhuma necessidade informada. Se você precisa de algum atendimento diferenciado (acessibilidade, saúde, aprendizagem), informe aqui para a escola se preparar. Só a secretaria e o instrutor da sua turma têm acesso.</p>',
      `<button type="button" data-acao="editar-necessidades" class="botao-sec">${tem ? 'Editar' : 'Informar necessidade'}</button>`);
  }

  function modalNecessidades() {
    const a = aluno();
    const n = a.necessidades;
    abrirModal(`${cabecalhoModal('Necessidades e acessibilidade', 'Marque o que se aplica e diga como a escola pode atender.')}
      <form id="form-necessidades" novalidate>
        <div class="p-5 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            ${TIPOS_NECESSIDADE.map((t) => `<label class="cartao-radio">
              <input type="checkbox" name="tipos" value="${t.id}" class="mt-1 accent-petrol-800" ${n.tipos.includes(t.id) ? 'checked' : ''}>
              <span><span class="block text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(t.nome)}</span><span class="block text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(t.descricao)}</span></span>
            </label>`).join('')}
          </div>
          <div>
            <label class="rotulo" for="f-detalhes">Detalhes <span class="normal-case font-normal tracking-normal text-slate-400">(diagnóstico, medicação, o que fazer em emergência)</span></label>
            <textarea id="f-detalhes" name="detalhes" rows="3" class="campo mt-1">${esc(n.detalhes)}</textarea>
            ${erroDe('detalhes')}
          </div>
          <div>
            <label class="rotulo" for="f-atendimento">Como a escola deve atender</label>
            <textarea id="f-atendimento" name="atendimento" rows="3" class="campo mt-1">${esc(n.atendimento)}</textarea>
          </div>
        </div>
        ${rodapeModal('Salvar')}
      </form>`);
    const form = $('form-necessidades');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const d = { tipos: fd.getAll('tipos'), detalhes: String(fd.get('detalhes') ?? ''), atendimento: String(fd.get('atendimento') ?? '') };
      if (mostrarErros(form, C.validarNecessidades(d))) return;
      persistir(C.atualizarNecessidades(estado.dados, a.id, d));
      fecharModal(); render();
      toast('Necessidades atualizadas.');
    });
  }

  // ---------- Responsáveis (só leitura) ----------

  function renderResponsaveis() {
    const a = aluno();
    const lista = C.responsaveisDoAluno(estado.dados, a.id);
    const menor = C.menorDeIdade(a.nascimento);
    const corpo = lista.length ? `
      <div class="overflow-x-auto -m-5"><table class="tabela w-full">
        <thead><tr><th>Nome</th><th>Parentesco</th><th>Papel</th><th>Celular</th><th>E-mail</th></tr></thead>
        <tbody>${lista.map(({ responsavel: r, vinculo: v }) => `<tr>
          <td class="font-medium text-slate-800 dark:text-neutral-100">${esc(r.nome)}${v.principal ? ' <span class="text-slate-400" title="Responsável principal">★</span>' : ''}</td>
          <td>${vazio(nomeDe(PARENTESCOS, v.parentesco))}</td>
          <td>${esc(v.papeis.map((p) => nomeDe(PAPEIS_RESPONSAVEL, p)).join(', '))}</td>
          <td class="whitespace-nowrap">${vazio(C.fmtTelefone(r.celular))}</td>
          <td>${vazio(r.email)}</td>
        </tr>`).join('')}</tbody>
      </table></div>`
      : `<p class="text-sm text-slate-500 dark:text-neutral-400">${menor ? 'Você é menor de idade e ainda não tem responsável legal cadastrado — a secretaria precisa cadastrar antes da matrícula.' : 'Nenhum responsável vinculado ao seu cadastro.'}</p>`;
    $('conteudo-aba').innerHTML = `
      <div class="space-y-5">
        ${cartaoSecao('Responsáveis', corpo)}
        <p class="text-sm text-slate-500 dark:text-neutral-400">Responsável legal assina por você quando menor de idade; responsável financeiro recebe contrato e boleto; contato de emergência recebe avisos de falta e ocorrências. Para incluir, trocar ou corrigir um responsável, fale com a secretaria.</p>
      </div>`;
  }

  // ---------- Acesso: senha (simulada) e preferências de notificação ----------

  function toggle(nome, rotulo, descricao, ligado) {
    return `<label class="flex items-start justify-between gap-4 py-3">
      <span><span class="block text-sm font-medium text-slate-800 dark:text-neutral-100">${rotulo}</span><span class="block text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${descricao}</span></span>
      <span class="relative inline-flex shrink-0 mt-0.5"><input type="checkbox" data-pref="${nome}" class="peer sr-only" ${ligado ? 'checked' : ''}><span class="h-6 w-11 rounded-full bg-slate-300 dark:bg-neutral-700 peer-checked:bg-petrol-800 dark:peer-checked:bg-sky-600 transition peer-focus-visible:ring-2 peer-focus-visible:ring-petrol-800/40"></span><span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5"></span></span>
    </label>`;
  }

  function renderAcesso() {
    const a = aluno();
    const p = preferencias();
    $('conteudo-aba').innerHTML = `
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        ${cartaoSecao('Senha de acesso', `
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            ${item('Login', vazio(a.email))}
            ${item('Senha', '••••••')}
          </dl>`, '<button type="button" data-acao="senha" class="botao-sec">Alterar senha</button>')}
        ${cartaoSecao('Avisos', `
          <div class="divide-y divide-slate-100 dark:divide-neutral-900 -my-3">
            ${toggle('email', 'Avisos por e-mail', 'Boletos, materiais liberados e lembretes de aula.', p.email)}
            ${toggle('whatsapp', 'Avisos por WhatsApp', `Lembrete da aula no dia e boleto perto do vencimento${a.celular ? ` — ${esc(C.fmtTelefone(a.celular))}` : ''}.`, p.whatsapp)}
          </div>`)}
      </div>`;
    document.querySelectorAll('[data-pref]').forEach((el) => el.addEventListener('change', () => {
      const novo = { ...preferencias(), [el.dataset.pref]: el.checked };
      salvarPreferencias(novo);
      toast(`Avisos por ${el.dataset.pref === 'email' ? 'e-mail' : 'WhatsApp'} ${el.checked ? 'ativados' : 'desativados'}.`);
    }));
  }

  function modalSenha() {
    abrirModal(`${cabecalhoModal('Alterar senha')}
      <form id="form-senha" novalidate>
        <div class="p-5 space-y-4">
          ${campoTexto('atual', 'Senha atual', '', { tipo: 'password', attrs: 'autocomplete="current-password"' })}
          ${campoTexto('nova', 'Nova senha', '', { tipo: 'password', attrs: 'autocomplete="new-password"' })}
          ${campoTexto('confirmar', 'Confirmar nova senha', '', { tipo: 'password', attrs: 'autocomplete="new-password"' })}
        </div>
        ${rodapeModal('Alterar senha')}
      </form>`, 'max-w-md');
    const form = $('form-senha');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const atual = String(fd.get('atual') ?? ''), nova = String(fd.get('nova') ?? ''), conf = String(fd.get('confirmar') ?? '');
      const erros = [];
      if (!atual) erros.push({ campo: 'atual', mensagem: 'Informe a senha atual.' });
      else if (atual !== PortalAluno.SENHA_PROTOTIPO) erros.push({ campo: 'atual', mensagem: 'Senha atual incorreta.' });
      if (nova.length < 6) erros.push({ campo: 'nova', mensagem: 'Mínimo de 6 caracteres.' });
      else if (nova === atual) erros.push({ campo: 'nova', mensagem: 'A nova senha precisa ser diferente da atual.' });
      if (conf !== nova) erros.push({ campo: 'confirmar', mensagem: 'As senhas não conferem.' });
      if (mostrarErros(form, erros)) return;
      fecharModal();
      toast('Senha alterada (simulação — no protótipo a senha continua 123456).');
    });
    $('f-atual').focus();
  }

  // ---------- Privacidade (LGPD): consentimentos + solicitações ----------

  function renderPrivacidade() {
    const a = aluno();
    const c = a.consentimentos;
    const sols = solicitacoesPrivacidade();
    const STATUS = { em_analise: { nome: 'Em análise', cor: 'bg-amber-500' }, atendida: { nome: 'Atendida', cor: 'bg-emerald-500' }, cancelada_pelo_aluno: { nome: 'Desistiu do pedido', cor: 'bg-slate-400' } };
    $('conteudo-aba').innerHTML = `
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        ${cartaoSecao('Uso dos seus dados', `
          <div class="text-sm text-slate-600 dark:text-neutral-300 space-y-2">
            <p>A ProWay usa seus dados para matrícula, contrato, cobrança e comunicação sobre as aulas. Necessidades e informações de saúde são tratadas como dado sensível e ficam restritas à secretaria e ao instrutor da sua turma.</p>
            <p>Você pode pedir uma cópia de tudo o que temos sobre você ou a exclusão do cadastro. Dados exigidos por lei (contratos e notas fiscais) são mantidos pelo prazo legal mesmo após a exclusão.</p>
          </div>
          <dl class="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 mt-5">
            ${item('Termo aceito em', vazio(c.termoAceiteEm ? C.fmtData(c.termoAceiteEm) : '', 'Ainda não aceito'))}
            ${item('Comunicações comerciais', c.comunicacoes ? 'Autorizadas' : 'Não autorizadas')}
            ${item('Uso de imagem', c.imagem ? 'Autorizado' : 'Não autorizado')}
          </dl>`, '<button type="button" data-acao="consentimentos" class="botao-sec">Editar consentimentos</button>')}
        ${cartaoSecao('Solicitações', `
          <div class="flex flex-wrap gap-2 mb-4">
            <button type="button" data-acao="exportacao" class="botao-sec">Solicitar exportação dos meus dados</button>
            <button type="button" data-acao="exclusao" class="botao-sec text-red-600 dark:text-red-400">Solicitar exclusão do cadastro</button>
          </div>
          ${sols.length ? `<ul class="divide-y divide-slate-100 dark:divide-neutral-900">${sols.map((s) => { const st = STATUS[s.status] ?? { nome: s.status, cor: 'bg-slate-400' }; return `
            <li class="py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
              <div><p class="font-medium text-slate-800 dark:text-neutral-100">${esc(TIPOS_PRIVACIDADE[s.tipo] ?? s.tipo)}</p><p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Pedido em ${esc(C.fmtData(s.em.slice(0, 10)))}${s.dados?.motivo ? ` · ${esc(s.dados.motivo)}` : ''}</p></div>
              <div class="flex items-center gap-3"><span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-full ${st.cor}"></span>${st.nome}</span>${s.status === 'em_analise' ? `<button type="button" data-desistir="${s.id}" class="link">Desistir</button>` : ''}</div>
            </li>`; }).join('')}</ul>`
            : '<p class="text-sm text-slate-500 dark:text-neutral-400">Nenhuma solicitação feita. A secretaria responde em até 15 dias.</p>'}`)}
      </div>`;
  }

  function modalConsentimentos() {
    const a = aluno();
    const c = a.consentimentos;
    const opcao = (nome, rotulo, descricao, marcado) => `<label class="cartao-radio"><input type="checkbox" name="${nome}" class="mt-1 accent-petrol-800" ${marcado ? 'checked' : ''}><span><span class="block text-sm font-medium text-slate-800 dark:text-neutral-100">${rotulo}</span><span class="block text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${descricao}</span></span></label>`;
    abrirModal(`${cabecalhoModal('Consentimentos', 'Você pode mudar quando quiser.')}
      <form id="form-consentimentos" novalidate>
        <div class="p-5 space-y-2">
          ${opcao('comunicacoes', 'Comunicações comerciais', 'Receber novidades de cursos, promoções e eventos da ProWay.', c.comunicacoes)}
          ${opcao('imagem', 'Uso de imagem', 'Autorizar fotos e gravações das aulas em que você aparece na divulgação da escola.', c.imagem)}
        </div>
        ${rodapeModal('Salvar')}
      </form>`, 'max-w-md');
    $('form-consentimentos').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      persistir(C.atualizarConsentimentos(estado.dados, a.id, { termoAceiteEm: c.termoAceiteEm, comunicacoes: fd.get('comunicacoes') === 'on', imagem: fd.get('imagem') === 'on' }));
      fecharModal(); render();
      toast('Consentimentos atualizados.');
    });
  }

  function modalExportacao() {
    if (solicitacaoPrivacidadeAberta('exportacao')) { toast('Já existe um pedido de exportação em análise.'); return; }
    abrirModal(`${cabecalhoModal('Exportar meus dados')}
      <form id="form-exportacao" novalidate>
        <div class="p-5 text-sm text-slate-600 dark:text-neutral-300 space-y-2">
          <p>Você receberá em <strong class="text-slate-800 dark:text-neutral-100">${esc(aluno().email)}</strong> um arquivo com os dados do seu cadastro, matrículas e contratos.</p>
          <p>Prazo: até 15 dias.</p>
        </div>
        ${rodapeModal('Solicitar exportação')}
      </form>`, 'max-w-md');
    $('form-exportacao').addEventListener('submit', (e) => {
      e.preventDefault();
      registrarPrivacidade('exportacao');
      fecharModal(); render();
      toast('Pedido de exportação registrado. Você recebe por e-mail em até 15 dias.');
    });
  }

  function modalExclusao() {
    if (solicitacaoPrivacidadeAberta('exclusao')) { toast('Já existe um pedido de exclusão em análise.'); return; }
    const ativos = PortalAluno.matriculas(aluno0.id).filter((m) => m.situacao !== 'concluida' && m.situacao !== 'cancelada').length;
    abrirModal(`
      <div class="px-5 py-4 border-b border-red-100 dark:border-red-950 bg-red-50 dark:bg-red-950/40 rounded-t-xl">
        <p class="font-display font-semibold text-red-700 dark:text-red-300">Solicitar exclusão do cadastro</p>
      </div>
      <form id="form-exclusao" novalidate>
        <div class="p-5 space-y-4 text-sm text-slate-600 dark:text-neutral-300">
          <p>A secretaria vai analisar o pedido e confirmar com você antes de excluir. Você perde o acesso ao portal e aos materiais dos cursos.</p>
          ${ativos ? `<p class="text-red-700 dark:text-red-300">Você tem ${ativos === 1 ? '1 matrícula ativa' : `${ativos} matrículas ativas`}. A exclusão só é concluída depois do encerramento ou cancelamento dos contratos.</p>` : ''}
          <p>Contratos e notas fiscais já emitidos são mantidos pelo prazo legal.</p>
          <div>
            <label class="rotulo" for="f-motivo">Motivo <span class="normal-case font-normal tracking-normal text-slate-400">(opcional)</span></label>
            <textarea id="f-motivo" name="motivo" rows="2" class="campo mt-1"></textarea>
          </div>
          <label class="flex items-start gap-2"><input type="checkbox" name="confirmo" class="mt-1 accent-red-600"><span>Entendo que a exclusão é definitiva e quero seguir com o pedido.</span></label>
          ${erroDe('confirmo')}
        </div>
        ${rodapeModal('Solicitar exclusão', BOTAO_PERIGO)}
      </form>`, 'max-w-md');
    const form = $('form-exclusao');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      if (mostrarErros(form, fd.get('confirmo') === 'on' ? [] : [{ campo: 'confirmo', mensagem: 'Marque a confirmação para continuar.' }])) return;
      registrarPrivacidade('exclusao', { motivo: String(fd.get('motivo') ?? '').trim() });
      fecharModal(); render();
      toast('Pedido de exclusão registrado. A secretaria entra em contato para confirmar.');
    });
  }

  function desistirPrivacidade(id) {
    const l = lerJson(CHAVE_PRIVACIDADE, []).map((s) => (s.id === id && s.status === 'em_analise' ? { ...s, status: 'cancelada_pelo_aluno' } : s));
    localStorage.setItem(CHAVE_PRIVACIDADE, JSON.stringify(l));
    render();
    toast('Pedido cancelado.');
  }

  // ---------- Solicitar correção de dados pessoais → pedido à secretaria (simulação) ----------

  function modalCorrecao() {
    abrirModal(`${cabecalhoModal('Solicitar correção', 'O pedido vai para a secretaria.')}
      <form id="form-correcao" novalidate>
        <div class="p-5 space-y-4">
          <div>
            <label class="rotulo" for="f-campo">O que está errado?</label>
            <select id="f-campo" name="campo" class="select w-full mt-1">
              <option value="">Escolha…</option>
              ${['Nome completo', 'Nome social', 'CPF', 'RG', 'Data de nascimento', 'Gênero', 'Escolaridade', 'Profissão', 'Outro'].map((x) => `<option value="${x}">${x}</option>`).join('')}
            </select>
            ${erroDe('campo')}
          </div>
          <div>
            <label class="rotulo" for="f-descricao">Como deve ficar</label>
            <textarea id="f-descricao" name="descricao" rows="3" class="campo mt-1" placeholder="Ex.: meu nome está sem o sobrenome Silva; o correto é…"></textarea>
            ${erroDe('descricao')}
          </div>
          <p class="text-sm text-slate-500 dark:text-neutral-400">A secretaria pode pedir um documento para confirmar a alteração.</p>
        </div>
        ${rodapeModal('Enviar pedido')}
      </form>`, 'max-w-lg');
    const form = $('form-correcao');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const campo = String(fd.get('campo') ?? ''), descricao = String(fd.get('descricao') ?? '').trim();
      const erros = [];
      if (!campo) erros.push({ campo: 'campo', mensagem: 'Escolha o dado a corrigir.' });
      if (!descricao) erros.push({ campo: 'descricao', mensagem: 'Diga como deve ficar.' });
      if (mostrarErros(form, erros)) return;
      fecharModal();
      toast('Pedido enviado à secretaria (simulação).');
    });
  }

  // ---------- Eventos ----------

  document.addEventListener('click', (e) => {
    const aba = e.target.closest('[data-aba]');
    if (aba) { estado.aba = aba.dataset.aba; render(); return; }
    const des = e.target.closest('[data-desistir]');
    if (des) { desistirPrivacidade(des.dataset.desistir); return; }
    const btn = e.target.closest('[data-acao]');
    if (!btn) return;
    ({ 'editar-contato': modalContato, 'editar-endereco': modalEndereco, 'editar-necessidades': modalNecessidades, senha: modalSenha, consentimentos: modalConsentimentos, exportacao: modalExportacao, exclusao: modalExclusao, corrigir: modalCorrecao, foto: modalFoto })[btn.dataset.acao]?.();
  });

  render();
})();
