// Blocos compartilhados pelas duas variantes da página pública do instrutor
// (cadastro-instrutor.html e cadastro-instrutor-steps.html): estado plano,
// montagem do objeto que o motor entende, seções do formulário e a foto.
// Depende de js/cadastro-publico-ui.js (campos, seção, erros) e do motor Instrutores.

const campoSwitch = (name, rotulo, descricao, marcado) => `
  <label class="flex items-center justify-between gap-3 cursor-pointer">
    <span><span class="text-sm font-medium text-slate-800 dark:text-neutral-100">${rotulo}</span><br><span class="text-xs text-slate-500 dark:text-neutral-400">${descricao}</span></span>
    <input type="checkbox" name="${name}" class="check" ${marcado ? 'checked' : ''}>
  </label>`;

// Estado plano (um campo por input) a partir do que a escola já digitou.
function dadosIniciais(i) {
  const e = i.empresa ?? { cnpj: '', razaoSocial: '', banco: '', agencia: '', conta: '', pix: '' };
  return {
    nome: i.nome, apelido: i.apelido, nascimento: i.nascimento, cpf: Instrutores.fmtCpf(i.cpf), rg: i.rg, especialidade: i.especialidade, bio: i.bio,
    email: i.contato.email, whatsapp: Instrutores.fmtTelefone(i.contato.whatsapp),
    emergenciaNome: i.contato.emergencia?.nome ?? '', emergenciaTelefone: Instrutores.fmtTelefone(i.contato.emergencia?.telefone),
    cep: Instrutores.fmtCep(i.endereco.cep), logradouro: i.endereco.logradouro, numero: i.endereco.numero, complemento: i.endereco.complemento,
    bairro: i.endereco.bairro, cidade: i.endereco.cidade, uf: i.endereco.uf || Aulor.escola().uf,
    cnpj: Instrutores.fmtCnpj(e.cnpj), razaoSocial: e.razaoSocial, banco: e.banco, agencia: e.agencia, conta: e.conta, pix: e.pix,
    antecedentesArquivo: Instrutores.antecedentesDoAno(i)?.arquivo ?? '',
    foto: i.foto ?? null,
    aceite: false, aceiteDados: false,
  };
}

// Estado plano → objeto que o motor entende (Instrutores.validarPreenchimento / preencherPeloInstrutor).
function montar(d) {
  return {
    nome: d.nome, apelido: d.apelido, nascimento: d.nascimento, cpf: d.cpf, rg: d.rg, especialidade: d.especialidade, bio: d.bio, foto: d.foto,
    contato: { email: d.email, whatsapp: d.whatsapp, emergenciaNome: d.emergenciaNome, emergenciaTelefone: d.emergenciaTelefone },
    endereco: { cep: d.cep, logradouro: d.logradouro, numero: d.numero, complemento: d.complemento, bairro: d.bairro, cidade: d.cidade, uf: d.uf },
    empresa: { cnpj: d.cnpj, razaoSocial: d.razaoSocial, banco: d.banco, agencia: d.agencia, conta: d.conta, pix: d.pix },
    antecedentes: { arquivo: d.antecedentesArquivo },
    aceite: d.aceite, aceiteDados: d.aceiteDados,
  };
}

// ---------- Seções (as mesmas nas duas variantes) ----------

const iniciaisDe = (nome) => String(nome ?? '').split(/\s+/).filter(Boolean).filter((p, i, arr) => i === 0 || i === arr.length - 1).map((p) => p[0].toUpperCase()).join('');
const previaFoto = (d) => (d.foto
  ? `<img src="${d.foto}" alt="" class="h-20 w-20 rounded-full object-cover border border-slate-200 dark:border-neutral-800">`
  : `<span class="h-20 w-20 rounded-full grid place-items-center bg-petrol-800/10 dark:bg-sky-950 text-petrol-800 dark:text-sky-300 font-semibold text-2xl">${esc(iniciaisDe(d.nome))}</span>`);

const secaoFoto = (d) => secao('Sua foto', 'Aparece para a equipe e nas turmas. Opcional, mas ajuda os alunos a te reconhecerem.', `
  <div class="flex items-center gap-4">
    <div id="foto-previa">${previaFoto(d)}</div>
    <div class="space-y-2">
      <label class="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition cursor-pointer">
        Escolher imagem<input type="file" id="f-foto" accept="image/*" class="sr-only">
      </label>
      ${d.foto ? '<button type="button" id="btn-remover-foto" class="block text-xs font-medium text-red-700 dark:text-red-400 hover:underline">Remover foto</button>' : ''}
      <p class="text-xs text-slate-400">JPG ou PNG, de preferência quadrada. Fica só no seu navegador neste protótipo.</p>
    </div>
  </div>`);

const secaoDados = (d) => secao('Seus dados', 'Como saem no contrato e no certificado dos alunos.', `
  ${campoTexto('nome', 'Nome completo', d.nome, { max: 120 })}
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    ${campoTexto('apelido', 'Como gosta de ser chamado', d.apelido, { max: 40, placeholder: 'Aparece na agenda e para a turma' })}
    ${campoTexto('nascimento', 'Data de nascimento', d.nascimento, { tipo: 'date' })}
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    ${campoTexto('cpf', 'CPF', d.cpf, { placeholder: '000.000.000-00', max: 14, mascara: 'cpf' })}
    ${campoTexto('rg', 'RG', d.rg, { max: 20 })}
  </div>
  ${campoTexto('especialidade', 'Especialidade', d.especialidade, { placeholder: 'Ex.: Java e Spring', max: 80, opcional: true })}
  ${campoArea('bio', 'Sobre você', d.bio, { rows: 3, max: 600, opcional: true, placeholder: 'Resumo profissional — a escola usa na divulgação da turma.' })}`);

const secaoContato = (d) => secao('Contato', 'Como a coordenação fala com você no dia a dia.', `
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    ${campoTexto('email', 'E-mail', d.email, { tipo: 'email', max: 120 })}
    ${campoTexto('whatsapp', 'WhatsApp', d.whatsapp, { placeholder: '(47) 99999-9999', max: 16, extra: 'inputmode="tel"' })}
  </div>
  <fieldset class="space-y-3">
    <legend class="rotulo">Em caso de emergência</legend>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      ${campoTexto('emergenciaNome', 'Quem avisamos', d.emergenciaNome, { max: 120 })}
      ${campoTexto('emergenciaTelefone', 'Telefone', d.emergenciaTelefone, { placeholder: '(47) 99999-9999', max: 16, extra: 'inputmode="tel"' })}
    </div>
  </fieldset>`);

const secaoEndereco = (d) => secao('Endereço', 'Vai no contrato de prestação de serviço.', `
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
    ${campoTexto('cep', 'CEP', d.cep, { placeholder: '00000-000', max: 9, extra: 'inputmode="numeric"' })}
    <div class="sm:col-span-2">${campoTexto('logradouro', 'Logradouro', d.logradouro, { placeholder: 'Rua, avenida…', max: 120 })}</div>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
    ${campoTexto('numero', 'Número', d.numero, { max: 10 })}
    ${campoTexto('complemento', 'Complemento', d.complemento, { opcional: true, max: 60 })}
    ${campoTexto('bairro', 'Bairro', d.bairro, { max: 60 })}
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
    <div class="sm:col-span-2">${campoTexto('cidade', 'Cidade', d.cidade, { max: 80 })}</div>
    ${campoSelect('uf', 'UF', UFS.map((u) => ({ id: u, nome: u })), d.uf)}
  </div>`);

const secaoEmpresa = (d) => secao('Empresa para pagamento', `A ${Aulor.escola().nome} paga instrutor por nota fiscal — informe o CNPJ pelo qual você emite e a conta que recebe.`, `
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    ${campoTexto('cnpj', 'CNPJ', d.cnpj, { placeholder: '00.000.000/0000-00', max: 18, mascara: 'cnpj' })}
    ${campoTexto('razaoSocial', 'Razão social', d.razaoSocial, { placeholder: 'Como consta no CNPJ', max: 150 })}
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
    ${campoTexto('banco', 'Banco', d.banco, { opcional: true, max: 40 })}
    ${campoTexto('agencia', 'Agência', d.agencia, { opcional: true, max: 10 })}
    ${campoTexto('conta', 'Conta', d.conta, { opcional: true, max: 20 })}
  </div>
  ${campoTexto('pix', 'Chave PIX', d.pix, { placeholder: 'CNPJ, e-mail, celular ou chave aleatória', max: 80 })}
  <p class="text-xs text-slate-500 dark:text-neutral-400">Informe a chave PIX <strong>ou</strong> a conta bancária — sem uma das duas não conseguimos pagar.</p>`);

const secaoDocumentos = (d) => secao('Declaração de antecedentes criminais', `Exigida uma vez por ano de quem dá aula. Ano ${Instrutores.anoAtual()}.`, `
  <div class="flex flex-wrap items-center gap-3">
    <label class="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition cursor-pointer">
      Anexar declaração<input type="file" id="f-antecedentes" accept=".pdf,image/*" class="sr-only">
    </label>
    <span id="nome-antecedentes" class="text-sm ${d.antecedentesArquivo ? 'text-slate-700 dark:text-neutral-200' : 'text-slate-400'}">${d.antecedentesArquivo ? esc(d.antecedentesArquivo) : 'Nenhum arquivo escolhido'}</span>
    <input type="hidden" name="antecedentesArquivo" value="${esc(d.antecedentesArquivo)}">
  </div>
  <p class="text-xs text-slate-500 dark:text-neutral-400">Emitida em <a href="https://www.gov.br/pt-br/servicos/emitir-certidao-de-antecedentes-criminais" target="_blank" rel="noopener" class="text-petrol-800 dark:text-sky-300 hover:underline">gov.br</a>. Se ainda não tiver em mãos, pode enviar depois para a coordenação — o protótipo guarda só o nome do arquivo.</p>`);

const secaoLgpd = (d) => secao('Privacidade (LGPD)', `Versão ${LGPD_INSTRUTOR.versao} da política.`, `
  <p class="text-sm"><a href="${LGPD_INSTRUTOR.link}" target="_blank" rel="noopener" class="text-petrol-800 dark:text-sky-300 hover:underline">Ler a política de privacidade e proteção de dados</a></p>
  <label class="flex items-start gap-3 cursor-pointer">
    <input type="checkbox" name="aceite" class="check mt-0.5" ${d.aceite ? 'checked' : ''}>
    <span class="text-sm text-slate-800 dark:text-neutral-100">${esc(LGPD_INSTRUTOR.termos[0])}</span>
  </label>
  ${ERRO('aceite')}
  <label class="flex items-start gap-3 cursor-pointer">
    <input type="checkbox" name="aceiteDados" class="check mt-0.5" ${d.aceiteDados ? 'checked' : ''}>
    <span class="text-sm text-slate-800 dark:text-neutral-100">${esc(LGPD_INSTRUTOR.termos[1])}</span>
  </label>
  ${ERRO('aceiteDados')}`);

// ---------- Foto e anexo (mesmo comportamento nas duas variantes) ----------

// Redimensiona para 256 px quadrados e devolve o dataURL — igual ao drawer da escola.
function ligarFoto(form, aoTrocar) {
  form.querySelector('#f-foto')?.addEventListener('change', (ev) => {
    const arq = ev.target.files?.[0];
    if (!arq) return;
    const img = new Image();
    img.onload = () => {
      const lado = 256; const canvas = document.createElement('canvas');
      canvas.width = lado; canvas.height = lado;
      const ctx = canvas.getContext('2d'); const m = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, lado, lado);
      aoTrocar(canvas.toDataURL('image/jpeg', 0.85));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(arq);
  });
  form.querySelector('#btn-remover-foto')?.addEventListener('click', () => aoTrocar(null));
}

function ligarAntecedentes(form, aoEscolher) {
  form.querySelector('#f-antecedentes')?.addEventListener('change', (ev) => {
    const arq = ev.target.files?.[0];
    if (!arq) return;
    form.querySelector('[name="antecedentesArquivo"]').value = arq.name;
    const rotulo = form.querySelector('#nome-antecedentes');
    rotulo.textContent = arq.name;
    rotulo.className = 'text-sm text-slate-700 dark:text-neutral-200';
    aoEscolher?.(arq.name);
  });
}
