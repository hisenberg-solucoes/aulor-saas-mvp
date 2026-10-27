// Página pública: o próprio aluno completa o cadastro a partir do link (token) gerado pela escola.
// Protótipo: lê/grava o mesmo localStorage da tela de clientes — em produção é um endpoint com token de uso único.

// modo 'aluno': link individual (a = aluno já criado pela escola). modo 'empresa': link reutilizável (a = aluno em branco, emp = empresa).
// modo 'pacote': link de um pacote do contrato (a = aluno em branco; emp = empresa contratante, se houver) — o aluno digita nome e CPF
// e entra no pacote como "aguardando conferência"; CPF já cadastrado é reaproveitado (RN-20).
function render(dados, a, { modo = 'aluno', empresa = null, token, contrato = null, pacote = null } = {}) {
  const r = a.responsavel;
  const emp = modo === 'aluno' ? Clientes.porId(dados.empresas, a.empresaId) : empresa;
  const pagaEmpresa = modo === 'empresa' || (modo === 'pacote' && Boolean(emp));
  const tituloContrato = contrato ? `Venda ${contrato.codigo} · ${pacote.nome}` : '';
  const descricaoContrato = contrato ? Contratos.descricao(contextoContrato(dados), contrato) : '';
  const n = a.necessidades;
  const nomeEmp = emp ? emp.nomeFantasia || emp.razaoSocial : '';
  const pagadores = PAGADORES.filter((p) => p.id !== 'empresa' || emp).map((p) => (p.id === 'empresa' ? { ...p, nome: `${nomeEmp} paga`, descricao: 'Você é colaborador e a empresa contratou o curso.' } : p));
  document.getElementById('tela').innerHTML = `
    <div class="mb-6">
      ${modo === 'pacote' ? `
      <h1 class="font-display text-2xl font-semibold text-slate-900 dark:text-neutral-100">Cadastro para a sua matrícula</h1>
      <p class="text-sm text-slate-500 dark:text-neutral-400 mt-1">A ProWay enviou este link para incluir você em <strong>${esc(tituloContrato)}</strong> (${esc(descricaoContrato)})${emp ? `, contratado pela <strong>${esc(nomeEmp)}</strong>` : ''}. Preencha seus dados — leva uns 3 minutos. Eles são usados só para contrato, certificado e comunicação do curso.</p>` : modo === 'empresa' ? `
      <h1 class="font-display text-2xl font-semibold text-slate-900 dark:text-neutral-100">Cadastro de colaborador · ${esc(nomeEmp)}</h1>
      <p class="text-sm text-slate-500 dark:text-neutral-400 mt-1">Você vai participar de um treinamento da ProWay contratado pela ${esc(nomeEmp)}. Preencha seus dados — leva uns 3 minutos. Eles são usados só para contrato, certificado e comunicação do curso.</p>` : `
      <h1 class="font-display text-2xl font-semibold text-slate-900 dark:text-neutral-100">Olá, ${esc(a.nome.split(' ')[0])}! Complete seu cadastro</h1>
      <p class="text-sm text-slate-500 dark:text-neutral-400 mt-1">Confira o que a ProWay já preencheu e complete o restante. Leva uns 3 minutos. Seus dados são usados só para contrato, certificado e comunicação do curso.</p>`}
    </div>
    <form id="form" novalidate class="space-y-5">
      ${secao('Seus dados', 'Como devem sair no contrato e no certificado.', `
        ${campoTexto('nome', 'Nome completo', a.nome, { placeholder: 'Como consta no documento', max: 120 })}
        ${campoTexto('nomeSocial', 'Nome social', a.nomeSocial, { opcional: true, placeholder: 'Como prefere ser chamado(a)', max: 80 })}
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          ${campoTexto('cpf', 'CPF', Clientes.fmtCpf(a.cpf), { placeholder: '000.000.000-00', max: 14, mascara: 'cpf' })}
          ${campoTexto('rg', 'RG', a.rg, { opcional: true, max: 20 })}
          ${campoTexto('nascimento', 'Data de nascimento', a.nascimento, { tipo: 'date' })}
        </div>
        ${modo === 'pacote' ? '<div id="bloco-cpf"></div>' : ''}
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          ${campoSelect('genero', 'Gênero', [{ id: 'feminino', nome: 'Feminino' }, { id: 'masculino', nome: 'Masculino' }, { id: 'outro', nome: 'Outro / prefiro não informar' }], a.genero, { opcional: true })}
          ${campoSelect('escolaridade', 'Escolaridade', ESCOLARIDADES, a.escolaridade, { opcional: true })}
          ${pagaEmpresa ? campoTexto('cargo', `Cargo na ${esc(nomeEmp)}`, a.cargo, { opcional: true, max: 80 }) : campoTexto('profissao', 'Profissão', a.profissao, { opcional: true, max: 80 })}
        </div>`)}
      ${secao('Contato', 'Por aqui você recebe avisos da turma, avaliações e boletos.', `
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          ${campoTexto('email', 'E-mail', a.email, { tipo: 'email', max: 120 })}
          ${campoTexto('celular', 'Celular / WhatsApp', Clientes.fmtTelefone(a.celular), { placeholder: '(47) 90000-0000', extra: 'inputmode="tel"' })}
          ${campoTexto('telefone', 'Outro telefone', Clientes.fmtTelefone(a.telefone), { opcional: true, extra: 'inputmode="tel"' })}
        </div>`)}
      ${secao('Endereço', 'Endereço residencial — sai no contrato e no boleto.', `
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          ${campoTexto('cep', 'CEP', Clientes.fmtCep(a.endereco.cep), { placeholder: '00000-000', extra: 'inputmode="numeric"' })}
          <div class="sm:col-span-2">${campoTexto('logradouro', 'Logradouro', a.endereco.logradouro, { placeholder: 'Rua, avenida…', max: 120 })}</div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          ${campoTexto('numero', 'Número', a.endereco.numero, { max: 10 })}
          ${campoTexto('complemento', 'Complemento', a.endereco.complemento, { opcional: true, max: 60 })}
          ${campoTexto('bairro', 'Bairro', a.endereco.bairro, { max: 60 })}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="sm:col-span-2">${campoTexto('cidade', 'Cidade', a.endereco.cidade, { max: 80 })}</div>
          ${campoSelect('uf', 'UF', UFS.map((u) => ({ id: u, nome: u })), a.endereco.uf)}
        </div>`)}
      ${modo === 'pacote' ? '' : pagaEmpresa ? `<input type="hidden" name="pagador" value="empresa">` : secao('Quem paga o curso', 'Define em nome de quem saem o contrato e o boleto.', `
        ${cartoesRadio('pagador', pagadores, a.pagador)}
        ${ERRO('pagador')}
        <fieldset id="bloco-responsavel" class="space-y-3 pt-2 ${a.pagador === 'terceiro' ? '' : 'hidden'}">
          <legend class="rotulo">Responsável financeiro</legend>
          ${campoTexto('responsavel.nome', 'Nome', r.nome, { max: 120 })}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${campoTexto('responsavel.cpf', 'CPF', Clientes.fmtCpf(r.cpf), { placeholder: '000.000.000-00', max: 14, mascara: 'cpf' })}
            ${campoTexto('responsavel.parentesco', 'Parentesco', r.parentesco, { opcional: true, placeholder: 'Mãe, pai, cônjuge…', max: 40 })}
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${campoTexto('responsavel.email', 'E-mail', r.email, { tipo: 'email', max: 120 })}
            ${campoTexto('responsavel.celular', 'Celular', Clientes.fmtTelefone(r.celular), { opcional: true, extra: 'inputmode="tel"' })}
          </div>
        </fieldset>
        <fieldset id="bloco-cobranca" class="pt-2 ${a.pagador === 'empresa' ? 'hidden' : ''}">
          <legend class="rotulo">Como prefere pagar</legend>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${campoSelect('cobranca.formaPreferida', 'Forma', FORMAS_COBRANCA, a.cobranca.formaPreferida, { opcional: true })}
            ${campoTexto('cobranca.diaVencimento', 'Melhor dia de vencimento', a.cobranca.diaVencimento, { tipo: 'number', opcional: true, extra: 'min="1" max="31" step="1"' })}
          </div>
        </fieldset>`)}
      ${secao('Necessidades e acessibilidade', 'Opcional. Nos ajuda a preparar sala, material e avaliações para você. Só a coordenação e o instrutor da turma veem.', `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          ${TIPOS_NECESSIDADE.map((t) => `
          <label class="${CARTAO_OPCAO} flex items-start gap-3 py-2">
            <input type="checkbox" name="tipos" value="${t.id}" class="check mt-0.5" ${n.tipos.includes(t.id) ? 'checked' : ''}>
            <span><span class="text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(t.nome)}</span><br><span class="text-xs text-slate-500 dark:text-neutral-400">${esc(t.descricao)}</span></span>
          </label>`).join('')}
        </div>
        ${campoArea('necessidades.detalhes', 'Conte mais', n.detalhes, { rows: 2, max: 500, opcional: true, placeholder: 'Diagnóstico, medicação, o que fazer em emergência…' })}
        ${campoArea('necessidades.atendimento', 'O que ajudaria você em aula', n.atendimento, { rows: 2, max: 500, opcional: true, placeholder: 'Sentar na frente, tempo extra, intérprete, sala acessível…' })}`)}
      ${secao('Privacidade (LGPD)', '', `
        <label class="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="aceite" class="check mt-0.5">
          <span class="text-sm text-slate-800 dark:text-neutral-100">Li e aceito o <a href="#" class="text-petrol-800 dark:text-sky-300 hover:underline">termo de uso e política de privacidade</a> da ProWay. <span class="text-xs text-slate-500 dark:text-neutral-400">Obrigatório — seus dados são usados para contrato, certificado e comunicação do curso.</span></span>
        </label>
        ${ERRO('aceite')}
        <label class="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="comunicacoes" class="check mt-0.5" ${a.consentimentos.comunicacoes ? 'checked' : ''}>
          <span class="text-sm text-slate-800 dark:text-neutral-100">Quero receber novidades e ofertas de cursos por e-mail e WhatsApp. <span class="text-xs text-slate-500 dark:text-neutral-400">Opcional.</span></span>
        </label>
        <label class="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="imagem" class="check mt-0.5" ${a.consentimentos.imagem ? 'checked' : ''}>
          <span class="text-sm text-slate-800 dark:text-neutral-100">Autorizo o uso da minha imagem e depoimento no site e redes da ProWay. <span class="text-xs text-slate-500 dark:text-neutral-400">Opcional.</span></span>
        </label>`)}
      <div class="flex items-center justify-end gap-3 pb-8">
        <button type="submit" class="${BOTAO_PRI}">Enviar cadastro</button>
      </div>
    </form>`;

  const form = document.getElementById('form');
  form.querySelectorAll('input[type="radio"][name="pagador"]').forEach((rd) => rd.addEventListener('change', () => {
    form.querySelector('#bloco-responsavel').classList.toggle('hidden', rd.value !== 'terceiro');
    form.querySelector('#bloco-cobranca').classList.toggle('hidden', rd.value === 'empresa');
  }));
  if (modo === 'pacote') {
    const cpf = form.querySelector('[name="cpf"]');
    let ultimo = '';
    const consultar = () => {
      const dig = Clientes.digitos(cpf.value);
      if (dig === ultimo) return;
      ultimo = dig;
      const r = dig.length === 11 ? Contratos.consultarCpfPacote(Contratos.carregar(), Clientes.carregar(), token, dig) : null;
      renderBlocoCpf(form, r);
    };
    cpf.addEventListener('blur', consultar);
    cpf.addEventListener('change', consultar);
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const d = {
      nome: fd.get('nome'), nomeSocial: fd.get('nomeSocial'), cpf: fd.get('cpf'), rg: fd.get('rg'), nascimento: fd.get('nascimento'), genero: fd.get('genero'), escolaridade: fd.get('escolaridade'), profissao: fd.get('profissao') ?? a.profissao, cargo: fd.get('cargo') ?? a.cargo, observacoes: a.observacoes,
      email: fd.get('email'), celular: fd.get('celular'), telefone: fd.get('telefone'),
      endereco: { cep: fd.get('cep'), logradouro: fd.get('logradouro'), numero: fd.get('numero'), complemento: fd.get('complemento'), bairro: fd.get('bairro'), cidade: fd.get('cidade'), uf: fd.get('uf') },
      pagador: fd.get('pagador') ?? '', empresaId: a.empresaId,
      responsavel: { nome: fd.get('responsavel.nome') ?? '', cpf: fd.get('responsavel.cpf') ?? '', parentesco: fd.get('responsavel.parentesco') ?? '', email: fd.get('responsavel.email') ?? '', celular: fd.get('responsavel.celular') ?? '' },
      cobranca: { formaPreferida: fd.get('cobranca.formaPreferida') ?? null, diaVencimento: fd.get('cobranca.diaVencimento') ?? null },
      necessidades: { tipos: fd.getAll('tipos'), detalhes: fd.get('necessidades.detalhes'), atendimento: fd.get('necessidades.atendimento') },
      aceite: fd.has('aceite'), comunicacoes: fd.has('comunicacoes'), imagem: fd.has('imagem'),
    };
    const atuais = Clientes.carregar();
    const ajustar = (erros) => erros.map((x) => (x.campo === 'detalhes' ? { ...x, campo: 'necessidades.detalhes' } : x));
    if (modo === 'pacote') {
      const r = Contratos.cadastrarPeloLinkPacote(Contratos.carregar(), atuais, token, { ...d, pagador: '', responsavel: { nome: '', cpf: '', parentesco: '', email: '', celular: '' } });
      if (r.erros.some((x) => x.mensagem.startsWith('Este link'))) { telaAviso('Link encerrado', 'Este link não está mais aceitando cadastros. Fale com a ProWay.'); return; }
      if (mostrarErros(form, ajustar(r.erros))) { toast('Confira os campos destacados.'); return; }
      Clientes.salvar(r.dados); Contratos.salvar(r.lista);
    } else if (modo === 'empresa') {
      const r = Clientes.cadastrarPeloLinkEmpresa(atuais, token, d);
      if (r.erros.some((x) => x.mensagem.startsWith('Este link'))) { telaAviso('Link encerrado', 'Este link não está mais aceitando cadastros. Fale com o RH ou com a ProWay.'); return; }
      if (mostrarErros(form, ajustar(r.erros))) { toast('Confira os campos destacados.'); return; }
      Clientes.salvar(r.dados);
    } else {
      const erros = ajustar(Clientes.validarPreenchimentoAluno(d, atuais.alunos, a.id));
      if (mostrarErros(form, erros)) { toast('Confira os campos destacados.'); return; }
      Clientes.salvar(Clientes.preencherPeloAluno(atuais, token, d));
    }
    window.scrollTo({ top: 0 });
    telaAviso(`Obrigado, ${esc(d.nome.trim().split(' ')[0])}!`, modo === 'pacote' ? 'Seu cadastro foi enviado e está em conferência pela ProWay. Assim que for aprovado, você recebe as informações da turma por e-mail e WhatsApp.' : modo === 'empresa' ? `Seu cadastro foi enviado. A ProWay e a ${esc(nomeEmp)} confirmam sua participação e você recebe as informações da turma por e-mail e WhatsApp.` : 'Seu cadastro foi enviado para a ProWay. Em breve você recebe o contrato e as informações da turma por e-mail e WhatsApp.', 'ok');
  });
}

// Bloco abaixo do CPF (RN-20): cadastro existente mascarado com "Sou eu" / "Não sou eu", ou aviso de que já está no contrato.
function renderBlocoCpf(form, r) {
  const alvo = form.querySelector('#bloco-cpf');
  if (!alvo) return;
  if (!r || !r.existe) { alvo.innerHTML = ''; return; }
  if (r.jaNoContrato) {
    alvo.innerHTML = `<div class="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"><strong>Você já está nesta venda.</strong> Não é preciso se cadastrar de novo — se algo precisar de correção, fale com a ProWay.</div>`;
    return;
  }
  const m = r.mascarado;
  alvo.innerHTML = `
    <div class="rounded-lg border border-petrol-800/20 dark:border-sky-800 bg-petrol-800/5 dark:bg-sky-950/40 px-4 py-3 space-y-2">
      <p class="text-sm font-semibold text-slate-800 dark:text-neutral-100">Encontramos seu cadastro</p>
      <p class="text-sm text-slate-600 dark:text-neutral-300">${esc(m.nome)}${m.email ? ` · ${esc(m.email)}` : ''}${m.celular ? ` · ${esc(m.celular)}` : ''}</p>
      <div class="flex flex-wrap gap-2 pt-1">
        <button type="button" data-cpf="sou-eu" class="${BOTAO_PRI} h-9 px-4">Sou eu — atualizar meus dados</button>
        <button type="button" data-cpf="nao-sou" class="inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition">Não sou eu</button>
      </div>
    </div>`;
  alvo.querySelector('[data-cpf="sou-eu"]').addEventListener('click', () => { aplicarPreenchimento(form, r.preencher); alvo.innerHTML = ''; toast('Confira e atualize seus dados'); });
  alvo.querySelector('[data-cpf="nao-sou"]').addEventListener('click', () => {
    alvo.innerHTML = `<div class="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">Fale com a ProWay pelo WhatsApp ou e-mail para regularizar o CPF.</div>`;
  });
}

// Preenche os campos não sensíveis do formulário com o cadastro existente (nome, e-mail e celular ficam como o aluno digitou).
function aplicarPreenchimento(form, p) {
  if (!p) return;
  const set = (name, v) => { const el = form.querySelector(`[name="${name}"]`); if (el) el.value = v ?? ''; };
  const chk = (name, v) => { const el = form.querySelector(`[name="${name}"]`); if (el) el.checked = Boolean(v); };
  set('nomeSocial', p.nomeSocial); set('rg', p.rg); set('nascimento', p.nascimento); set('genero', p.genero); set('escolaridade', p.escolaridade);
  set('profissao', p.profissao); set('cargo', p.cargo); set('telefone', Clientes.fmtTelefone(p.telefone));
  const e = p.endereco ?? {};
  set('cep', Clientes.fmtCep(e.cep)); set('logradouro', e.logradouro); set('numero', e.numero); set('complemento', e.complemento); set('bairro', e.bairro); set('cidade', e.cidade); set('uf', e.uf);
  form.querySelectorAll('input[name="tipos"]').forEach((c) => { c.checked = (p.necessidades?.tipos ?? []).includes(c.value); });
  set('necessidades.detalhes', p.necessidades?.detalhes); set('necessidades.atendimento', p.necessidades?.atendimento);
  chk('comunicacoes', p.comunicacoes); chk('imagem', p.imagem);
}

// Contexto mínimo para Contratos.descricao (nomes de formações/cursos) na página pública.
const contextoContrato = (dados) => ({ empresas: dados.empresas, alunos: dados.alunos, responsaveis: dados.responsaveis ?? [], cursos: Cursos.carregar(), formacoes: Formacoes.carregar() });

(function iniciar() {
  const params = new URLSearchParams(location.search);
  const dados = Clientes.carregar();
  const tokenPacote = params.get('pacote');
  if (tokenPacote) {
    const alvo = Contratos.pacotePorConvite(Contratos.carregar(), tokenPacote);
    if (!alvo) { telaAviso('Link inválido ou expirado', 'Peça um novo link para a ProWay pelo WhatsApp ou e-mail.'); return; }
    if (!Contratos.conviteAberto(alvo.contrato, alvo.pacote)) { const av = Contratos.avisoConvitePublico(alvo.contrato, alvo.pacote); telaAviso(av.titulo, av.texto); return; }
    const e = Contratos.empresaDe(contextoContrato(dados), alvo.contrato);
    render(dados, alunoSeed({ id: '', nome: '', cpf: '', empresaId: e ? e.id : null, pagador: '' }), { modo: 'pacote', empresa: e, token: tokenPacote, contrato: alvo.contrato, pacote: alvo.pacote });
    return;
  }
  const tokenEmpresa = params.get('empresa');
  if (tokenEmpresa) {
    const e = Clientes.empresaPorToken(dados, tokenEmpresa);
    if (!e) { telaAviso('Link inválido ou expirado', 'Peça um novo link ao RH da sua empresa ou à ProWay.'); return; }
    if (!Clientes.conviteEmpresaAberto(e)) { telaAviso('Link encerrado', `O link de cadastro da ${esc(e.nomeFantasia || e.razaoSocial)} não está mais aceitando cadastros. Fale com o RH ou com a ProWay.`); return; }
    render(dados, alunoSeed({ id: '', nome: '', cpf: '', empresaId: e.id, pagador: 'empresa' }), { modo: 'empresa', empresa: e, token: tokenEmpresa });
    return;
  }
  const token = params.get('token');
  const a = Clientes.alunoPorToken(dados, token);
  if (!a) { telaAviso('Link inválido ou expirado', 'Peça um novo link para a ProWay pelo WhatsApp ou e-mail.'); return; }
  if (a.convite.preenchidoEm) { telaAviso('Cadastro já enviado', `Recebemos seus dados em ${esc(Clientes.fmtData(a.convite.preenchidoEm.slice(0, 10)))}. Se precisar corrigir algo, fale com a ProWay.`, 'ok'); return; }
  render(dados, a, { modo: 'aluno', token });
})();
