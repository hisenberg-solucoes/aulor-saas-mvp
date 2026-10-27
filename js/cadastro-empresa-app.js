// Página pública: a própria empresa (RH/financeiro) completa o cadastro a partir do link (token) gerado pela escola.
// Protótipo: lê/grava o mesmo localStorage da tela de clientes — em produção é um endpoint com token de uso único.

const campoSwitch = (name, rotulo, descricao, marcado) => `
  <label class="flex items-center justify-between gap-3 cursor-pointer">
    <span><span class="text-sm font-medium text-slate-800 dark:text-neutral-100">${rotulo}</span><br><span class="text-xs text-slate-500 dark:text-neutral-400">${descricao}</span></span>
    <input type="checkbox" name="${name}" class="check" ${marcado ? 'checked' : ''}>
  </label>`;

const camposContato = (prefixo, c, { comPapel = false } = {}) => `
  ${campoTexto(`${prefixo}.nome`, 'Nome', c.nome, { max: 120 })}
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    ${campoTexto(`${prefixo}.cargo`, 'Cargo', c.cargo, { opcional: true, max: 80 })}
    ${comPapel ? campoSelect(`${prefixo}.papel`, 'Papel', PAPEIS_CONTATO.filter((p) => p.id !== 'financeiro'), c.papel || 'rh') : ''}
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    ${campoTexto(`${prefixo}.email`, 'E-mail', c.email, { tipo: 'email', max: 120 })}
    ${campoTexto(`${prefixo}.celular`, 'Celular / WhatsApp', Clientes.fmtTelefone(c.celular), { placeholder: '(47) 90000-0000', extra: 'inputmode="tel"' })}
  </div>`;

function render(dados, e, token) {
  const k = e.cobranca;
  const rh = e.contatos.find((c) => c.principal) ?? e.contatos.find((c) => c.papel !== 'financeiro') ?? { nome: '', cargo: '', papel: 'rh', email: '', celular: '' };
  const fin = e.contatos.find((c) => c.papel === 'financeiro' && c !== rh) ?? { nome: '', cargo: '', email: '', celular: '' };
  const nome = e.nomeFantasia || e.razaoSocial;
  document.getElementById('tela').innerHTML = `
    <div class="mb-6">
      <h1 class="font-display text-2xl font-semibold text-slate-900 dark:text-neutral-100">Cadastro da ${esc(nome)} na ProWay</h1>
      <p class="text-sm text-slate-500 dark:text-neutral-400 mt-1">Confira o que já foi preenchido e complete o restante — precisamos disso para emitir contrato, boleto e nota fiscal. Leva uns 5 minutos.</p>
    </div>
    <form id="form" novalidate class="space-y-5">
      ${secao('Dados da empresa', 'Como devem sair no contrato e na nota fiscal.', `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${campoTexto('cnpj', 'CNPJ', Clientes.fmtCnpj(e.cnpj), { placeholder: '00.000.000/0000-00', max: 18, mascara: 'cnpj' })}
          ${campoTexto('inscricaoEstadual', 'Inscrição estadual', e.inscricaoEstadual, { opcional: true, placeholder: 'ou "Isento"', max: 20 })}
        </div>
        ${campoTexto('razaoSocial', 'Razão social', e.razaoSocial, { placeholder: 'Como consta no CNPJ', max: 150 })}
        ${campoTexto('nomeFantasia', 'Nome fantasia', e.nomeFantasia, { opcional: true, placeholder: 'Como todo mundo chama', max: 80 })}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${campoSelect('segmento', 'Segmento', SEGMENTOS, e.segmento, { opcional: true })}
          ${campoSelect('porte', 'Porte', PORTES, e.porte, { opcional: true })}
        </div>`)}
      ${secao('Contato geral', 'Canal institucional da empresa.', `
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          ${campoTexto('email', 'E-mail', e.email, { tipo: 'email', max: 120 })}
          ${campoTexto('telefone', 'Telefone', Clientes.fmtTelefone(e.telefone), { placeholder: '(47) 0000-0000', extra: 'inputmode="tel"' })}
          ${campoTexto('site', 'Site', e.site, { opcional: true, placeholder: 'empresa.com.br', max: 80 })}
        </div>`)}
      ${secao('Endereço fiscal', 'Sai no contrato e na nota fiscal.', `
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          ${campoTexto('cep', 'CEP', Clientes.fmtCep(e.endereco.cep), { placeholder: '00000-000', extra: 'inputmode="numeric"' })}
          <div class="sm:col-span-2">${campoTexto('logradouro', 'Logradouro', e.endereco.logradouro, { placeholder: 'Rua, avenida…', max: 120 })}</div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          ${campoTexto('numero', 'Número', e.endereco.numero, { max: 10 })}
          ${campoTexto('complemento', 'Complemento', e.endereco.complemento, { opcional: true, max: 60 })}
          ${campoTexto('bairro', 'Bairro', e.endereco.bairro, { max: 60 })}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="sm:col-span-2">${campoTexto('cidade', 'Cidade', e.endereco.cidade, { max: 80 })}</div>
          ${campoSelect('uf', 'UF', UFS.map((u) => ({ id: u, nome: u })), e.endereco.uf)}
        </div>`)}
      ${secao('Cobrança e nota fiscal', 'Para onde vão boleto e NF e como a empresa prefere pagar.', `
        ${campoTexto('emailCobranca', 'E-mail de cobrança / NF', k.emailCobranca, { tipo: 'email', placeholder: 'financeiro@empresa.com.br', max: 120 })}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${campoSelect('formaPreferida', 'Forma preferida', FORMAS_COBRANCA, k.formaPreferida, { opcional: true })}
          ${campoTexto('diaVencimento', 'Melhor dia de vencimento', k.diaVencimento, { tipo: 'number', opcional: true, extra: 'min="1" max="31" step="1"' })}
        </div>
        ${campoSwitch('exigePedidoCompra', 'Exigimos pedido de compra (PO)', 'A nota fiscal só pode ser emitida com o número do pedido.', k.exigePedidoCompra)}
        ${campoArea('observacoesCobranca', 'Observações de faturamento', k.observacoes, { rows: 2, max: 300, opcional: true, placeholder: 'Ex.: pagamento em 45 dias; NF citar o PO; portal de fornecedores' })}`)}
      ${secao('Responsável pelo treinamento', 'Quem organiza turmas e alunos e recebe as comunicações (RH, T&D ou gestor).', camposContato('rh', rh, { comPapel: true }))}
      ${secao('Contato financeiro', 'Quem recebe boleto, NF e cobra pendências.', `
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="mesmoFinanceiro" class="check" ${!fin.nome ? 'checked' : ''}>
          <span class="text-sm text-slate-800 dark:text-neutral-100">É a mesma pessoa do responsável pelo treinamento</span>
        </label>
        <div id="bloco-fin" class="space-y-3 ${!fin.nome ? 'hidden' : ''}">${camposContato('fin', fin)}</div>`)}
      ${secao('Privacidade (LGPD)', '', `
        <label class="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="aceite" class="check mt-0.5">
          <span class="text-sm text-slate-800 dark:text-neutral-100">Declaro que tenho autorização para fornecer estes dados em nome da empresa e aceito o <a href="#" class="text-petrol-800 dark:text-sky-300 hover:underline">termo de uso e política de privacidade</a> da ProWay.</span>
        </label>
        ${ERRO('aceite')}`)}
      <div class="flex items-center justify-end gap-3 pb-8">
        <button type="submit" class="${BOTAO_PRI}">Enviar cadastro</button>
      </div>
    </form>`;

  const form = document.getElementById('form');
  form.querySelector('[name="mesmoFinanceiro"]').addEventListener('change', (ev) => form.querySelector('#bloco-fin').classList.toggle('hidden', ev.target.checked));
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(form);
    const contato = (p) => ({ nome: fd.get(`${p}.nome`), cargo: fd.get(`${p}.cargo`), papel: fd.get(`${p}.papel`), email: fd.get(`${p}.email`), celular: fd.get(`${p}.celular`) });
    const d = {
      razaoSocial: fd.get('razaoSocial'), nomeFantasia: fd.get('nomeFantasia'), cnpj: fd.get('cnpj'), inscricaoEstadual: fd.get('inscricaoEstadual'), segmento: fd.get('segmento'), porte: fd.get('porte'), site: fd.get('site'), observacoes: e.observacoes,
      email: fd.get('email'), telefone: fd.get('telefone'),
      endereco: { cep: fd.get('cep'), logradouro: fd.get('logradouro'), numero: fd.get('numero'), complemento: fd.get('complemento'), bairro: fd.get('bairro'), cidade: fd.get('cidade'), uf: fd.get('uf') },
      cobranca: { emailCobranca: fd.get('emailCobranca'), formaPreferida: fd.get('formaPreferida'), diaVencimento: fd.get('diaVencimento'), exigePedidoCompra: fd.has('exigePedidoCompra'), observacoes: fd.get('observacoesCobranca') },
      contatoRh: contato('rh'), contatoFinanceiro: contato('fin'), mesmoFinanceiro: fd.has('mesmoFinanceiro'),
      aceite: fd.has('aceite'),
    };
    const atuais = Clientes.carregar();
    const erros = Clientes.validarPreenchimentoEmpresa(d, atuais.empresas, e.id);
    if (mostrarErros(form, erros)) { toast('Confira os campos destacados.'); return; }
    Clientes.salvar(Clientes.preencherPelaEmpresa(atuais, token, d));
    window.scrollTo({ top: 0 });
    telaAviso('Cadastro enviado. Obrigado!', 'A ProWay já recebeu os dados da empresa. Em seguida enviamos a proposta/contrato e o link para os colaboradores se cadastrarem.', 'ok');
  });
}

(function iniciar() {
  const token = new URLSearchParams(location.search).get('token');
  const dados = Clientes.carregar();
  const e = Clientes.empresaPorTokenCadastro(dados, token);
  if (!e) { telaAviso('Link inválido ou expirado', 'Peça um novo link para a ProWay pelo WhatsApp ou e-mail.'); return; }
  if (e.cadastro.preenchidoEm) { telaAviso('Cadastro já enviado', `Recebemos os dados em ${esc(Clientes.fmtData(e.cadastro.preenchidoEm.slice(0, 10)))}. Se precisar corrigir algo, fale com a ProWay.`, 'ok'); return; }
  render(dados, e, token);
})();
