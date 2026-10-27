// Página pública (variante passo a passo) do cadastro do aluno. Mesmos tokens e mesma gravação de cadastro-aluno.html:
// ?token= (link individual: o aluno já existe), ?empresa= (link reutilizável: cria colaborador vinculado à empresa)
// ou ?pacote= (link de um pacote do contrato: o aluno digita nome e CPF e entra no pacote como "aguardando conferência";
// CPF já cadastrado é reaproveitado — RN-20). No modo pacote não há etapa "Pagamento": quem paga é o contratante.
// Rascunho fica no sessionStorage.

const BOTAO_SEC = 'inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30';
const BOTAO_LINK = 'text-xs font-medium text-petrol-800 dark:text-sky-300 hover:underline';

const GENEROS = [{ id: 'feminino', nome: 'Feminino' }, { id: 'masculino', nome: 'Masculino' }, { id: 'outro', nome: 'Outro / prefiro não informar' }];

const estado = { modo: 'aluno', aluno: null, empresa: null, contrato: null, pacote: null, pagaEmpresa: false, token: '', passo: 0, d: null, passos: [], cpfConsulta: null, cpfConsultado: '' };

function montarPassos(semPagamento) {
  return [
    { id: 'dados', titulo: 'Seus dados', campos: ['nome', 'nomeSocial', 'cpf', 'rg', 'nascimento', 'genero', 'escolaridade', 'profissao', 'cargo'] },
    { id: 'contato', titulo: 'Contato', campos: ['email', 'celular', 'telefone'] },
    { id: 'endereco', titulo: 'Endereço', campos: ['cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf'] },
    ...(semPagamento ? [] : [{ id: 'pagamento', titulo: 'Pagamento', campos: ['pagador', 'responsavel.nome', 'responsavel.cpf', 'responsavel.parentesco', 'responsavel.email', 'responsavel.celular', 'cobranca.formaPreferida', 'cobranca.diaVencimento'] }]),
    { id: 'necessidades', titulo: 'Acessibilidade', campos: ['tipos', 'necessidades.detalhes', 'necessidades.atendimento', 'detalhes'] },
    { id: 'revisao', titulo: 'Revisão', campos: ['aceite', 'comunicacoes', 'imagem'] },
  ];
}

// ---------- Estado inicial ----------

function dadosIniciais(a) {
  const r = a.responsavel;
  return {
    nome: a.nome, nomeSocial: a.nomeSocial, cpf: Clientes.fmtCpf(a.cpf), rg: a.rg, nascimento: a.nascimento, genero: a.genero ?? '', escolaridade: a.escolaridade ?? '', profissao: a.profissao, cargo: a.cargo,
    email: a.email, celular: Clientes.fmtTelefone(a.celular), telefone: Clientes.fmtTelefone(a.telefone),
    cep: Clientes.fmtCep(a.endereco.cep), logradouro: a.endereco.logradouro, numero: a.endereco.numero, complemento: a.endereco.complemento, bairro: a.endereco.bairro, cidade: a.endereco.cidade, uf: a.endereco.uf,
    pagador: a.pagador,
    'responsavel.nome': r.nome, 'responsavel.cpf': Clientes.fmtCpf(r.cpf), 'responsavel.parentesco': r.parentesco, 'responsavel.email': r.email, 'responsavel.celular': Clientes.fmtTelefone(r.celular),
    'cobranca.formaPreferida': a.cobranca.formaPreferida ?? '', 'cobranca.diaVencimento': a.cobranca.diaVencimento ?? '',
    tipos: [...a.necessidades.tipos], 'necessidades.detalhes': a.necessidades.detalhes, 'necessidades.atendimento': a.necessidades.atendimento,
    aceite: false, comunicacoes: a.consentimentos.comunicacoes, imagem: a.consentimentos.imagem,
  };
}

const chaveRascunho = () => `cadastro-aluno-passos:${estado.modo}:${estado.token}`;
function salvarRascunho() { sessionStorage.setItem(chaveRascunho(), JSON.stringify({ passo: estado.passo, d: estado.d })); }
function lerRascunho() { try { return JSON.parse(sessionStorage.getItem(chaveRascunho())); } catch (_) { return null; } }

// Estado plano → objeto que o motor entende (mesmo formato de cadastro-aluno-app.js).
function montar(d) {
  const a = estado.aluno;
  return {
    nome: d.nome, nomeSocial: d.nomeSocial, cpf: d.cpf, rg: d.rg, nascimento: d.nascimento, genero: d.genero, escolaridade: d.escolaridade, profissao: d.profissao, cargo: d.cargo, observacoes: a.observacoes,
    email: d.email, celular: d.celular, telefone: d.telefone,
    endereco: { cep: d.cep, logradouro: d.logradouro, numero: d.numero, complemento: d.complemento, bairro: d.bairro, cidade: d.cidade, uf: d.uf },
    pagador: estado.modo === 'pacote' ? '' : estado.pagaEmpresa ? 'empresa' : d.pagador, empresaId: a.empresaId,
    responsavel: estado.modo === 'pacote' ? { nome: '', cpf: '', parentesco: '', email: '', celular: '' } : { nome: d['responsavel.nome'], cpf: d['responsavel.cpf'], parentesco: d['responsavel.parentesco'], email: d['responsavel.email'], celular: d['responsavel.celular'] },
    cobranca: { formaPreferida: d['cobranca.formaPreferida'] || null, diaVencimento: d['cobranca.diaVencimento'] },
    necessidades: { tipos: d.tipos, detalhes: d['necessidades.detalhes'], atendimento: d['necessidades.atendimento'] },
    aceite: d.aceite, comunicacoes: d.comunicacoes, imagem: d.imagem,
  };
}

const ajustar = (erros) => erros.map((x) => (x.campo === 'detalhes' ? { ...x, campo: 'necessidades.detalhes' } : x));

function errosTodos() {
  const atuais = Clientes.carregar();
  const m = montar(estado.d);
  if (estado.modo === 'pacote') return ajustar(Contratos.validarCadastroPeloPacote(atuais, estado.contrato, estado.pacote, m).erros);
  if (estado.modo === 'empresa') {
    // Mesmas regras de cadastrarPeloLinkEmpresa, sem gravar: CPF de colaborador pré-cadastrado é reaproveitado.
    const cpf = Clientes.digitos(m.cpf);
    const existente = atuais.alunos.find((x) => x.cpf === cpf);
    const reaproveita = existente && existente.empresaId === estado.empresa.id && !existente.convite?.preenchidoEm;
    return ajustar(Clientes.validarPreenchimentoAluno({ ...m, pagador: 'empresa', empresaId: estado.empresa.id }, atuais.alunos, reaproveita ? existente.id : null));
  }
  return ajustar(Clientes.validarPreenchimentoAluno(m, atuais.alunos, estado.aluno.id));
}
const errosDoPasso = (i) => errosTodos().filter((x) => estado.passos[i].campos.includes(x.campo));

// ---------- Render ----------

function cabecalhoPassos() {
  const atual = estado.passo;
  return `
    <ol class="flex flex-wrap items-center gap-1.5 mb-6" aria-label="Etapas">
      ${estado.passos.map((p, i) => {
        const feito = i < atual; const ativo = i === atual;
        return `
        <li class="flex items-center gap-1.5">
          <button type="button" data-ir="${i}" ${i > atual ? 'disabled' : ''} title="${esc(p.titulo)}" class="flex items-center gap-1.5 rounded-full pl-1 ${ativo ? 'pr-3' : 'pr-1 sm:pr-2.5'} py-1 text-xs font-medium transition ${ativo ? 'bg-petrol-800 text-white dark:bg-sky-400 dark:text-black' : feito ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 dark:bg-neutral-900 dark:text-neutral-500'} disabled:cursor-default">
            <span class="h-5 w-5 rounded-full grid place-items-center text-[11px] ${ativo ? 'bg-white/20' : feito ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-neutral-800'}">${feito ? '✓' : i + 1}</span><span class="${ativo ? '' : 'hidden sm:inline'}">${p.titulo}</span>
          </button>
          ${i < estado.passos.length - 1 ? '<span class="hidden md:block h-px w-3 bg-slate-300 dark:bg-neutral-700"></span>' : ''}
        </li>`;
      }).join('')}
    </ol>`;
}

function corpoPasso(i) {
  const d = estado.d;
  const emp = estado.empresa;
  const nomeEmp = emp ? emp.nomeFantasia || emp.razaoSocial : '';
  switch (estado.passos[i].id) {
    case 'dados': return secao('Seus dados', 'Como devem sair no contrato e no certificado.', `
      ${campoTexto('nome', 'Nome completo', d.nome, { placeholder: 'Como consta no documento', max: 120 })}
      ${campoTexto('nomeSocial', 'Nome social', d.nomeSocial, { opcional: true, placeholder: 'Como prefere ser chamado(a)', max: 80 })}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        ${campoTexto('cpf', 'CPF', d.cpf, { placeholder: '000.000.000-00', max: 14, mascara: 'cpf' })}
        ${campoTexto('rg', 'RG', d.rg, { opcional: true, max: 20 })}
        ${campoTexto('nascimento', 'Data de nascimento', d.nascimento, { tipo: 'date' })}
      </div>
      ${estado.modo === 'pacote' ? `<div id="bloco-cpf">${blocoCpf()}</div>` : ''}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        ${campoSelect('genero', 'Gênero', GENEROS, d.genero, { opcional: true })}
        ${campoSelect('escolaridade', 'Escolaridade', ESCOLARIDADES, d.escolaridade, { opcional: true })}
        ${estado.pagaEmpresa ? campoTexto('cargo', `Cargo na ${esc(nomeEmp)}`, d.cargo, { opcional: true, max: 80 }) : campoTexto('profissao', 'Profissão', d.profissao, { opcional: true, max: 80 })}
      </div>`);
    case 'contato': return secao('Contato', 'Por aqui você recebe avisos da turma, avaliações e boletos.', `
      ${campoTexto('email', 'E-mail', d.email, { tipo: 'email', max: 120 })}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${campoTexto('celular', 'Celular / WhatsApp', d.celular, { placeholder: '(47) 90000-0000', extra: 'inputmode="tel"' })}
        ${campoTexto('telefone', 'Outro telefone', d.telefone, { opcional: true, extra: 'inputmode="tel"' })}
      </div>`);
    case 'endereco': return secao('Endereço', 'Endereço residencial — sai no contrato e no boleto.', `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        ${campoTexto('cep', 'CEP', d.cep, { placeholder: '00000-000', extra: 'inputmode="numeric"' })}
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
    case 'pagamento': {
      const pagadores = PAGADORES.filter((p) => p.id !== 'empresa' || emp).map((p) => (p.id === 'empresa' ? { ...p, nome: `${nomeEmp} paga`, descricao: 'Você é colaborador e a empresa contratou o curso.' } : p));
      return secao('Quem paga o curso', 'Define em nome de quem saem o contrato e o boleto.', `
      ${cartoesRadio('pagador', pagadores, d.pagador)}
      ${ERRO('pagador')}
      <fieldset id="bloco-responsavel" class="space-y-3 pt-2 ${d.pagador === 'terceiro' ? '' : 'hidden'}">
        <legend class="rotulo">Responsável financeiro</legend>
        ${campoTexto('responsavel.nome', 'Nome', d['responsavel.nome'], { max: 120 })}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${campoTexto('responsavel.cpf', 'CPF', d['responsavel.cpf'], { placeholder: '000.000.000-00', max: 14, mascara: 'cpf' })}
          ${campoTexto('responsavel.parentesco', 'Parentesco', d['responsavel.parentesco'], { opcional: true, placeholder: 'Mãe, pai, cônjuge…', max: 40 })}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${campoTexto('responsavel.email', 'E-mail', d['responsavel.email'], { tipo: 'email', max: 120 })}
          ${campoTexto('responsavel.celular', 'Celular', d['responsavel.celular'], { opcional: true, extra: 'inputmode="tel"' })}
        </div>
      </fieldset>
      <fieldset id="bloco-cobranca" class="pt-2 ${d.pagador === 'empresa' ? 'hidden' : ''}">
        <legend class="rotulo">Como prefere pagar</legend>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${campoSelect('cobranca.formaPreferida', 'Forma', FORMAS_COBRANCA, d['cobranca.formaPreferida'], { opcional: true })}
          ${campoTexto('cobranca.diaVencimento', 'Melhor dia de vencimento', d['cobranca.diaVencimento'], { tipo: 'number', opcional: true, extra: 'min="1" max="31" step="1"' })}
        </div>
      </fieldset>`);
    }
    case 'necessidades': return secao('Necessidades e acessibilidade', 'Opcional. Nos ajuda a preparar sala, material e avaliações para você. Só a coordenação e o instrutor da turma veem.', `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        ${TIPOS_NECESSIDADE.map((t) => `
        <label class="${CARTAO_OPCAO} flex items-start gap-3 py-2">
          <input type="checkbox" name="tipos" value="${t.id}" class="check mt-0.5" ${d.tipos.includes(t.id) ? 'checked' : ''}>
          <span><span class="text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(t.nome)}</span><br><span class="text-xs text-slate-500 dark:text-neutral-400">${esc(t.descricao)}</span></span>
        </label>`).join('')}
      </div>
      ${campoArea('necessidades.detalhes', 'Conte mais', d['necessidades.detalhes'], { rows: 2, max: 500, opcional: true, placeholder: 'Diagnóstico, medicação, o que fazer em emergência…' })}
      ${campoArea('necessidades.atendimento', 'O que ajudaria você em aula', d['necessidades.atendimento'], { rows: 2, max: 500, opcional: true, placeholder: 'Sentar na frente, tempo extra, intérprete, sala acessível…' })}`);
    case 'revisao': return telaRevisao();
  }
  return '';
}

// ---------- CPF existente no link do pacote (RN-20) ----------

const BLOCO_AMBAR = 'rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-200';

function blocoCpf() {
  const r = estado.cpfConsulta;
  if (!r || !r.existe) return '';
  if (r.jaNoContrato) return `<div class="${BLOCO_AMBAR}"><strong>Você já está nesta venda.</strong> Não é preciso se cadastrar de novo — se algo precisar de correção, fale com a ProWay.</div>`;
  if (r.resposta === 'nao-sou') return `<div class="${BLOCO_AMBAR}">Fale com a ProWay pelo WhatsApp ou e-mail para regularizar o CPF.</div>`;
  if (r.resposta === 'sou-eu') return '';
  const m = r.mascarado;
  return `
    <div class="rounded-lg border border-petrol-800/20 dark:border-sky-800 bg-petrol-800/5 dark:bg-sky-950/40 px-4 py-3 space-y-2">
      <p class="text-sm font-semibold text-slate-800 dark:text-neutral-100">Encontramos seu cadastro</p>
      <p class="text-sm text-slate-600 dark:text-neutral-300">${esc(m.nome)}${m.email ? ` · ${esc(m.email)}` : ''}${m.celular ? ` · ${esc(m.celular)}` : ''}</p>
      <div class="flex flex-wrap gap-2 pt-1">
        <button type="button" data-cpf="sou-eu" class="${BOTAO_PRI} h-9 px-4">Sou eu — atualizar meus dados</button>
        <button type="button" data-cpf="nao-sou" class="${BOTAO_SEC} h-9">Não sou eu</button>
      </div>
    </div>`;
}

// Consulta o CPF digitado (ao sair do campo) e guarda o resultado no estado; só re-renderiza quando o CPF mudou.
function consultarCpf(form) {
  const dig = Clientes.digitos(form.querySelector('[name="cpf"]')?.value ?? '');
  if (dig === estado.cpfConsultado) return;
  estado.cpfConsultado = dig;
  estado.cpfConsulta = dig.length === 11 ? Contratos.consultarCpfPacote(Contratos.carregar(), Clientes.carregar(), estado.token, dig) : null;
  const alvo = form.querySelector('#bloco-cpf');
  if (alvo) { alvo.innerHTML = blocoCpf(); ligarBlocoCpf(form); }
}

function ligarBlocoCpf(form) {
  form.querySelector('[data-cpf="sou-eu"]')?.addEventListener('click', () => {
    coletar(form);
    aplicarPreenchimento(estado.cpfConsulta.preencher);
    estado.cpfConsulta = { ...estado.cpfConsulta, resposta: 'sou-eu' };
    salvarRascunho();
    render();
    toast('Confira e atualize seus dados');
  });
  form.querySelector('[data-cpf="nao-sou"]')?.addEventListener('click', () => {
    estado.cpfConsulta = { ...estado.cpfConsulta, resposta: 'nao-sou' };
    const alvo = form.querySelector('#bloco-cpf');
    if (alvo) alvo.innerHTML = blocoCpf();
  });
}

// Copia para o estado os campos não sensíveis do cadastro existente (nome, e-mail e celular ficam como o aluno digitou).
function aplicarPreenchimento(p) {
  if (!p) return;
  const e = p.endereco ?? {};
  Object.assign(estado.d, {
    nomeSocial: p.nomeSocial ?? '', rg: p.rg ?? '', nascimento: p.nascimento ?? '', genero: p.genero ?? '', escolaridade: p.escolaridade ?? '', profissao: p.profissao ?? '', cargo: p.cargo ?? '', telefone: Clientes.fmtTelefone(p.telefone),
    cep: Clientes.fmtCep(e.cep), logradouro: e.logradouro ?? '', numero: e.numero ?? '', complemento: e.complemento ?? '', bairro: e.bairro ?? '', cidade: e.cidade ?? '', uf: e.uf ?? '',
    tipos: [...(p.necessidades?.tipos ?? [])], 'necessidades.detalhes': p.necessidades?.detalhes ?? '', 'necessidades.atendimento': p.necessidades?.atendimento ?? '',
    comunicacoes: Boolean(p.comunicacoes), imagem: Boolean(p.imagem),
  });
}

function telaRevisao() {
  const d = estado.d;
  const v = (x, vazioTxt = '—') => (x === '' || x == null ? `<span class="text-slate-400">${vazioTxt}</span>` : esc(String(x)));
  const nomeDe = (lista, id) => lista.find((o) => o.id === id)?.nome ?? '';
  const idx = (id) => estado.passos.findIndex((p) => p.id === id);
  const bloco = (id, titulo, linhas) => `
    <section class="${CARTAO}">
      <div class="px-5 py-3 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
        <h2 class="font-display font-semibold text-slate-800 dark:text-neutral-100">${titulo}</h2>
        <button type="button" data-ir="${idx(id)}" class="${BOTAO_LINK}">Editar</button>
      </div>
      <dl class="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        ${linhas.map(([k, val]) => `<div><dt class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">${k}</dt><dd class="text-slate-800 dark:text-neutral-100 break-words">${val}</dd></div>`).join('')}
      </dl>
    </section>`;
  const emp = estado.empresa;
  const nomeEmp = emp ? emp.nomeFantasia || emp.razaoSocial : '';
  const pagamento = () => {
    if (estado.pagaEmpresa) return [['Quem paga', `${esc(nomeEmp)} (empresa)`]];
    const l = [['Quem paga', v(d.pagador === 'empresa' ? `${nomeEmp} (empresa)` : nomeDe(PAGADORES, d.pagador))]];
    if (d.pagador === 'terceiro') l.push(['Responsável financeiro', `${v(d['responsavel.nome'])}${d['responsavel.parentesco'] ? ` · ${esc(d['responsavel.parentesco'])}` : ''}<br><span class="text-xs text-slate-500">${v(d['responsavel.cpf'])} · ${v(d['responsavel.email'])}</span>`]);
    if (d.pagador !== 'empresa') l.push(['Forma / vencimento', `${v(nomeDe(FORMAS_COBRANCA, d['cobranca.formaPreferida']))}${d['cobranca.diaVencimento'] ? ` · dia ${esc(String(d['cobranca.diaVencimento']))}` : ''}`]);
    return l;
  };
  return `
    <div class="space-y-4">
      <p class="text-sm text-slate-500 dark:text-neutral-400">Confira tudo antes de enviar. Depois do envio, correções só pela ProWay.</p>
      ${bloco('dados', 'Seus dados', [['Nome', `${v(d.nome)}${d.nomeSocial ? ` <span class="text-xs text-slate-500">(${esc(d.nomeSocial)})</span>` : ''}`], ['CPF / RG', `${v(d.cpf)}${d.rg ? ` · ${esc(d.rg)}` : ''}`], ['Nascimento', d.nascimento ? esc(Clientes.fmtData(d.nascimento)) : v('')], ['Gênero / escolaridade', `${v(nomeDe(GENEROS, d.genero))} · ${v(nomeDe(ESCOLARIDADES, d.escolaridade))}`], [estado.pagaEmpresa ? 'Cargo' : 'Profissão', v(estado.pagaEmpresa ? d.cargo : d.profissao)]])}
      ${bloco('contato', 'Contato', [['E-mail', v(d.email)], ['Celular / outro', `${v(d.celular)}${d.telefone ? ` · ${esc(d.telefone)}` : ''}`]])}
      ${bloco('endereco', 'Endereço', [['Endereço', `${v(d.logradouro)}, ${v(d.numero)}${d.complemento ? ` · ${esc(d.complemento)}` : ''}`], ['Bairro / cidade', `${v(d.bairro)} · ${v(d.cidade)}/${v(d.uf)}`], ['CEP', v(d.cep)]])}
      ${estado.pagaEmpresa || estado.modo === 'pacote' ? '' : bloco('pagamento', 'Pagamento', pagamento())}
      ${bloco('necessidades', 'Necessidades e acessibilidade', [['Tipos', d.tipos.length ? d.tipos.map((t) => esc(nomeDe(TIPOS_NECESSIDADE, t))).join(' · ') : '<span class="text-slate-400">nenhuma informada</span>'], ['Detalhes / como ajudar', `${v(d['necessidades.detalhes'])}${d['necessidades.atendimento'] ? `<br><span class="text-xs text-slate-500">${esc(d['necessidades.atendimento'])}</span>` : ''}`]])}
      ${secao('Privacidade (LGPD)', '', `
        <label class="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="aceite" class="check mt-0.5" ${d.aceite ? 'checked' : ''}>
          <span class="text-sm text-slate-800 dark:text-neutral-100">Li e aceito o <a href="#" class="text-petrol-800 dark:text-sky-300 hover:underline">termo de uso e política de privacidade</a> da ProWay. <span class="text-xs text-slate-500 dark:text-neutral-400">Obrigatório — seus dados são usados para contrato, certificado e comunicação do curso.</span></span>
        </label>
        ${ERRO('aceite')}
        <label class="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="comunicacoes" class="check mt-0.5" ${d.comunicacoes ? 'checked' : ''}>
          <span class="text-sm text-slate-800 dark:text-neutral-100">Quero receber novidades e ofertas de cursos por e-mail e WhatsApp. <span class="text-xs text-slate-500 dark:text-neutral-400">Opcional.</span></span>
        </label>
        <label class="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="imagem" class="check mt-0.5" ${d.imagem ? 'checked' : ''}>
          <span class="text-sm text-slate-800 dark:text-neutral-100">Autorizo o uso da minha imagem e depoimento no site e redes da ProWay. <span class="text-xs text-slate-500 dark:text-neutral-400">Opcional.</span></span>
        </label>`)}
    </div>`;
}

function render() {
  const i = estado.passo;
  const ultimo = i === estado.passos.length - 1;
  const emp = estado.empresa;
  const nomeEmp = emp ? emp.nomeFantasia || emp.razaoSocial : '';
  document.getElementById('tela').innerHTML = `
    <div class="mb-5">
      <h1 class="font-display text-2xl font-semibold text-slate-900 dark:text-neutral-100">${estado.modo === 'pacote' ? 'Cadastro para a sua matrícula' : estado.modo === 'empresa' ? `Cadastro de colaborador · ${esc(nomeEmp)}` : `Olá, ${esc(estado.aluno.nome.split(' ')[0])}! Complete seu cadastro`}</h1>
      ${estado.modo === 'pacote' ? `<p class="text-sm text-slate-500 dark:text-neutral-400 mt-1">A ProWay enviou este link para incluir você em <strong>${esc(tituloContrato())}</strong> (${esc(descricaoContrato())})${emp ? `, contratado pela <strong>${esc(nomeEmp)}</strong>` : ''}.</p>` : ''}
      <p class="text-sm text-slate-500 dark:text-neutral-400 mt-1">Etapa ${i + 1} de ${estado.passos.length} · ${esc(estado.passos[i].titulo)}. Seu progresso fica salvo neste navegador até você enviar.</p>
    </div>
    ${cabecalhoPassos()}
    <form id="form" novalidate class="space-y-5">
      ${corpoPasso(i)}
      <div class="flex items-center justify-between gap-3 pb-8">
        ${i > 0 ? `<button type="button" id="btn-voltar" class="${BOTAO_SEC}">← Voltar</button>` : '<span></span>'}
        <button type="submit" class="${BOTAO_PRI}">${ultimo ? 'Enviar cadastro' : 'Continuar →'}</button>
      </div>
    </form>`;
  const form = document.getElementById('form');
  form.querySelectorAll('input[type="radio"][name="pagador"]').forEach((rd) => rd.addEventListener('change', () => {
    form.querySelector('#bloco-responsavel').classList.toggle('hidden', rd.value !== 'terceiro');
    form.querySelector('#bloco-cobranca').classList.toggle('hidden', rd.value === 'empresa');
  }));
  if (estado.modo === 'pacote') {
    const cpf = form.querySelector('[name="cpf"]');
    if (cpf) { cpf.addEventListener('blur', () => consultarCpf(form)); cpf.addEventListener('change', () => consultarCpf(form)); }
    ligarBlocoCpf(form);
  }
  document.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => { coletar(form); ir(Number(b.dataset.ir)); }));
  form.querySelector('#btn-voltar')?.addEventListener('click', () => { coletar(form); ir(i - 1); });
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    coletar(form);
    if (estado.modo === 'pacote' && estado.passos[i].id === 'dados') consultarCpf(form);
    if (ultimo) { enviar(form); return; }
    const erros = errosDoPasso(i);
    if (mostrarErros(form, erros)) { toast('Confira os campos destacados.'); return; }
    ir(i + 1);
  });
  window.scrollTo({ top: 0 });
}

// Copia os valores do formulário atual para o estado (só os campos presentes neste passo).
function coletar(form) {
  const fd = new FormData(form);
  estado.passos[estado.passo].campos.forEach((c) => {
    const el = form.querySelector(`[name="${c}"]`);
    if (!el) return;
    if (c === 'tipos') estado.d.tipos = fd.getAll('tipos');
    else if (el.type === 'checkbox') estado.d[c] = fd.has(c);
    else estado.d[c] = fd.get(c) ?? '';
  });
  salvarRascunho();
}

function ir(passo) {
  estado.passo = Math.max(0, Math.min(estado.passos.length - 1, passo));
  salvarRascunho();
  render();
}

function enviar(form) {
  const erros = errosTodos();
  if (erros.length) {
    const noPasso = erros.filter((x) => estado.passos[estado.passo].campos.includes(x.campo));
    if (noPasso.length) { mostrarErros(form, noPasso); toast('Confira os campos destacados.'); return; }
    const idx = estado.passos.findIndex((p) => erros.some((x) => p.campos.includes(x.campo)));
    ir(idx);
    mostrarErros(document.getElementById('form'), erros);
    toast(`Falta ajustar algo na etapa "${estado.passos[idx].titulo}".`);
    return;
  }
  const atuais = Clientes.carregar();
  const m = montar(estado.d);
  if (estado.modo === 'pacote') {
    const r = Contratos.cadastrarPeloLinkPacote(Contratos.carregar(), atuais, estado.token, m);
    if (r.erros.some((x) => x.mensagem.startsWith('Este link'))) { telaAviso('Link encerrado', 'Este link não está mais aceitando cadastros. Fale com a ProWay.'); return; }
    if (mostrarErros(form, ajustar(r.erros))) { toast('Confira os campos destacados.'); return; }
    Clientes.salvar(r.dados); Contratos.salvar(r.lista);
  } else if (estado.modo === 'empresa') {
    const r = Clientes.cadastrarPeloLinkEmpresa(atuais, estado.token, m);
    if (r.erros.some((x) => x.mensagem.startsWith('Este link'))) { telaAviso('Link encerrado', 'Este link não está mais aceitando cadastros. Fale com o RH ou com a ProWay.'); return; }
    if (mostrarErros(form, ajustar(r.erros))) { toast('Confira os campos destacados.'); return; }
    Clientes.salvar(r.dados);
  } else {
    Clientes.salvar(Clientes.preencherPeloAluno(atuais, estado.token, m));
  }
  sessionStorage.removeItem(chaveRascunho());
  window.scrollTo({ top: 0 });
  const nomeEmp = estado.empresa ? estado.empresa.nomeFantasia || estado.empresa.razaoSocial : '';
  telaAviso(`Obrigado, ${esc(m.nome.trim().split(' ')[0])}!`, estado.modo === 'pacote' ? 'Seu cadastro foi enviado e está em conferência pela ProWay. Assim que for aprovado, você recebe as informações da turma por e-mail e WhatsApp.' : estado.modo === 'empresa' ? `Seu cadastro foi enviado. A ProWay e a ${esc(nomeEmp)} confirmam sua participação e você recebe as informações da turma por e-mail e WhatsApp.` : 'Seu cadastro foi enviado para a ProWay. Em breve você recebe o contrato e as informações da turma por e-mail e WhatsApp.', 'ok');
}

const contextoContrato = (dados) => ({ empresas: dados.empresas, alunos: dados.alunos, responsaveis: dados.responsaveis ?? [], cursos: Cursos.carregar(), formacoes: Formacoes.carregar() });
const tituloContrato = () => (estado.contrato ? `Venda ${estado.contrato.codigo} · ${estado.pacote.nome}` : '');
const descricaoContrato = () => (estado.contrato ? Contratos.descricao(contextoContrato(Clientes.carregar()), estado.contrato) : '');

(function iniciar() {
  const params = new URLSearchParams(location.search);
  const dados = Clientes.carregar();
  const tokenPacote = params.get('pacote');
  const tokenEmpresa = params.get('empresa');
  if (tokenPacote) {
    const alvo = Contratos.pacotePorConvite(Contratos.carregar(), tokenPacote);
    if (!alvo) { telaAviso('Link inválido ou expirado', 'Peça um novo link para a ProWay pelo WhatsApp ou e-mail.'); return; }
    if (!Contratos.conviteAberto(alvo.contrato, alvo.pacote)) { const av = Contratos.avisoConvitePublico(alvo.contrato, alvo.pacote); telaAviso(av.titulo, av.texto); return; }
    const e = Contratos.empresaDe(contextoContrato(dados), alvo.contrato);
    estado.modo = 'pacote'; estado.contrato = alvo.contrato; estado.pacote = alvo.pacote; estado.empresa = e; estado.token = tokenPacote;
    estado.aluno = alunoSeed({ id: '', nome: '', cpf: '', empresaId: e ? e.id : null, pagador: '' });
  } else if (tokenEmpresa) {
    const e = Clientes.empresaPorToken(dados, tokenEmpresa);
    if (!e) { telaAviso('Link inválido ou expirado', 'Peça um novo link ao RH da sua empresa ou à ProWay.'); return; }
    if (!Clientes.conviteEmpresaAberto(e)) { telaAviso('Link encerrado', `O link de cadastro da ${esc(e.nomeFantasia || e.razaoSocial)} não está mais aceitando cadastros. Fale com o RH ou com a ProWay.`); return; }
    estado.modo = 'empresa'; estado.empresa = e; estado.token = tokenEmpresa;
    estado.aluno = alunoSeed({ id: '', nome: '', cpf: '', empresaId: e.id, pagador: 'empresa' });
  } else {
    const token = params.get('token');
    const a = Clientes.alunoPorToken(dados, token);
    if (!a) { telaAviso('Link inválido ou expirado', 'Peça um novo link para a ProWay pelo WhatsApp ou e-mail.'); return; }
    if (a.convite.preenchidoEm) { telaAviso('Cadastro já enviado', `Recebemos seus dados em ${esc(Clientes.fmtData(a.convite.preenchidoEm.slice(0, 10)))}. Se precisar corrigir algo, fale com a ProWay.`, 'ok'); return; }
    estado.modo = 'aluno'; estado.aluno = a; estado.token = token;
    estado.empresa = Clientes.porId(dados.empresas, a.empresaId);
  }
  estado.pagaEmpresa = estado.modo === 'empresa' || (estado.modo === 'pacote' && Boolean(estado.empresa));
  estado.passos = montarPassos(estado.pagaEmpresa || estado.modo === 'pacote');
  const rascunho = lerRascunho();
  estado.d = rascunho?.d ? { ...dadosIniciais(estado.aluno), ...rascunho.d } : dadosIniciais(estado.aluno);
  estado.passo = Math.min(rascunho?.passo ?? 0, estado.passos.length - 1);
  render();
})();
