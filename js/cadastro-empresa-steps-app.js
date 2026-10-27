// Página pública (variante passo a passo): a própria empresa completa o cadastro em etapas, com revisão no final.
// Mesmo token e mesma gravação de cadastro-empresa.html (Clientes.preencherPelaEmpresa). Rascunho fica no sessionStorage.

const BOTAO_SEC = 'inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30';
const BOTAO_LINK = 'text-xs font-medium text-petrol-800 dark:text-sky-300 hover:underline';

const PASSOS = [
  { id: 'empresa', titulo: 'Empresa', campos: ['cnpj', 'inscricaoEstadual', 'razaoSocial', 'nomeFantasia', 'segmento', 'porte'] },
  { id: 'contato', titulo: 'Contato', campos: ['email', 'telefone', 'site'] },
  { id: 'endereco', titulo: 'Endereço', campos: ['cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf'] },
  { id: 'cobranca', titulo: 'Cobrança', campos: ['emailCobranca', 'formaPreferida', 'diaVencimento', 'exigePedidoCompra', 'observacoesCobranca'] },
  { id: 'pessoas', titulo: 'Pessoas', campos: ['rh.nome', 'rh.cargo', 'rh.papel', 'rh.email', 'rh.celular', 'mesmoFinanceiro', 'fin.nome', 'fin.cargo', 'fin.email', 'fin.celular'] },
  { id: 'revisao', titulo: 'Revisão', campos: ['aceite'] },
];

const estado = { empresa: null, token: '', passo: 0, d: null };

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

// ---------- Estado inicial (a partir do que a escola já digitou) ----------

function dadosIniciais(e) {
  const rh = e.contatos.find((c) => c.principal) ?? e.contatos.find((c) => c.papel !== 'financeiro') ?? { nome: '', cargo: '', papel: 'rh', email: '', celular: '' };
  const fin = e.contatos.find((c) => c.papel === 'financeiro' && c !== rh) ?? { nome: '', cargo: '', email: '', celular: '' };
  return {
    cnpj: Clientes.fmtCnpj(e.cnpj), inscricaoEstadual: e.inscricaoEstadual, razaoSocial: e.razaoSocial, nomeFantasia: e.nomeFantasia, segmento: e.segmento ?? '', porte: e.porte ?? '',
    email: e.email, telefone: Clientes.fmtTelefone(e.telefone), site: e.site,
    cep: Clientes.fmtCep(e.endereco.cep), logradouro: e.endereco.logradouro, numero: e.endereco.numero, complemento: e.endereco.complemento, bairro: e.endereco.bairro, cidade: e.endereco.cidade, uf: e.endereco.uf,
    emailCobranca: e.cobranca.emailCobranca, formaPreferida: e.cobranca.formaPreferida ?? '', diaVencimento: e.cobranca.diaVencimento ?? '', exigePedidoCompra: e.cobranca.exigePedidoCompra, observacoesCobranca: e.cobranca.observacoes,
    'rh.nome': rh.nome, 'rh.cargo': rh.cargo, 'rh.papel': rh.papel === 'financeiro' ? 'rh' : rh.papel || 'rh', 'rh.email': rh.email, 'rh.celular': Clientes.fmtTelefone(rh.celular),
    mesmoFinanceiro: !fin.nome, 'fin.nome': fin.nome, 'fin.cargo': fin.cargo, 'fin.email': fin.email, 'fin.celular': Clientes.fmtTelefone(fin.celular),
    aceite: false,
  };
}

const chaveRascunho = () => `cadastro-empresa-passos:${estado.token}`;
function salvarRascunho() { sessionStorage.setItem(chaveRascunho(), JSON.stringify({ passo: estado.passo, d: estado.d })); }
function lerRascunho() { try { return JSON.parse(sessionStorage.getItem(chaveRascunho())); } catch (_) { return null; } }

// Estado plano → objeto que o motor entende.
function montar(d) {
  const contato = (p) => ({ nome: d[`${p}.nome`], cargo: d[`${p}.cargo`], papel: d[`${p}.papel`], email: d[`${p}.email`], celular: d[`${p}.celular`] });
  return {
    razaoSocial: d.razaoSocial, nomeFantasia: d.nomeFantasia, cnpj: d.cnpj, inscricaoEstadual: d.inscricaoEstadual, segmento: d.segmento, porte: d.porte, site: d.site, observacoes: estado.empresa.observacoes,
    email: d.email, telefone: d.telefone,
    endereco: { cep: d.cep, logradouro: d.logradouro, numero: d.numero, complemento: d.complemento, bairro: d.bairro, cidade: d.cidade, uf: d.uf },
    cobranca: { emailCobranca: d.emailCobranca, formaPreferida: d.formaPreferida, diaVencimento: d.diaVencimento, exigePedidoCompra: d.exigePedidoCompra, observacoes: d.observacoesCobranca },
    contatoRh: contato('rh'), contatoFinanceiro: contato('fin'), mesmoFinanceiro: d.mesmoFinanceiro,
    aceite: d.aceite,
  };
}

function errosDoPasso(i) {
  const todos = Clientes.validarPreenchimentoEmpresa(montar(estado.d), Clientes.carregar().empresas, estado.empresa.id);
  return todos.filter((x) => PASSOS[i].campos.includes(x.campo));
}

// ---------- Render ----------

function cabecalhoPassos() {
  const atual = estado.passo;
  return `
    <ol class="flex flex-wrap items-center gap-1.5 mb-6" aria-label="Etapas">
      ${PASSOS.map((p, i) => {
        const feito = i < atual; const ativo = i === atual;
        return `
        <li class="flex items-center gap-1.5">
          <button type="button" data-ir="${i}" ${i > atual ? 'disabled' : ''} title="${esc(p.titulo)}" class="flex items-center gap-1.5 rounded-full pl-1 ${ativo ? 'pr-3' : 'pr-1 sm:pr-2.5'} py-1 text-xs font-medium transition ${ativo ? 'bg-petrol-800 text-white dark:bg-sky-400 dark:text-black' : feito ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 dark:bg-neutral-900 dark:text-neutral-500'} disabled:cursor-default">
            <span class="h-5 w-5 rounded-full grid place-items-center text-[11px] ${ativo ? 'bg-white/20' : feito ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-neutral-800'}">${feito ? '✓' : i + 1}</span><span class="${ativo ? '' : 'hidden sm:inline'}">${p.titulo}</span>
          </button>
          ${i < PASSOS.length - 1 ? '<span class="hidden md:block h-px w-3 bg-slate-300 dark:bg-neutral-700"></span>' : ''}
        </li>`;
      }).join('')}
    </ol>`;
}

function corpoPasso(i) {
  const d = estado.d;
  switch (PASSOS[i].id) {
    case 'empresa': return secao('Dados da empresa', 'Como devem sair no contrato e na nota fiscal.', `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${campoTexto('cnpj', 'CNPJ', d.cnpj, { placeholder: '00.000.000/0000-00', max: 18, mascara: 'cnpj' })}
        ${campoTexto('inscricaoEstadual', 'Inscrição estadual', d.inscricaoEstadual, { opcional: true, placeholder: 'ou "Isento"', max: 20 })}
      </div>
      ${campoTexto('razaoSocial', 'Razão social', d.razaoSocial, { placeholder: 'Como consta no CNPJ', max: 150 })}
      ${campoTexto('nomeFantasia', 'Nome fantasia', d.nomeFantasia, { opcional: true, placeholder: 'Como todo mundo chama', max: 80 })}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${campoSelect('segmento', 'Segmento', SEGMENTOS, d.segmento, { opcional: true })}
        ${campoSelect('porte', 'Porte', PORTES, d.porte, { opcional: true })}
      </div>`);
    case 'contato': return secao('Contato geral', 'Canal institucional da empresa.', `
      ${campoTexto('email', 'E-mail', d.email, { tipo: 'email', max: 120 })}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${campoTexto('telefone', 'Telefone', d.telefone, { placeholder: '(47) 0000-0000', extra: 'inputmode="tel"' })}
        ${campoTexto('site', 'Site', d.site, { opcional: true, placeholder: 'empresa.com.br', max: 80 })}
      </div>`);
    case 'endereco': return secao('Endereço fiscal', 'Sai no contrato e na nota fiscal.', `
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
    case 'cobranca': return secao('Cobrança e nota fiscal', 'Para onde vão boleto e NF e como a empresa prefere pagar.', `
      ${campoTexto('emailCobranca', 'E-mail de cobrança / NF', d.emailCobranca, { tipo: 'email', placeholder: 'financeiro@empresa.com.br', max: 120 })}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${campoSelect('formaPreferida', 'Forma preferida', FORMAS_COBRANCA, d.formaPreferida, { opcional: true })}
        ${campoTexto('diaVencimento', 'Melhor dia de vencimento', d.diaVencimento, { tipo: 'number', opcional: true, extra: 'min="1" max="31" step="1"' })}
      </div>
      ${campoSwitch('exigePedidoCompra', 'Exigimos pedido de compra (PO)', 'A nota fiscal só pode ser emitida com o número do pedido.', d.exigePedidoCompra)}
      ${campoArea('observacoesCobranca', 'Observações de faturamento', d.observacoesCobranca, { rows: 2, max: 300, opcional: true, placeholder: 'Ex.: pagamento em 45 dias; NF citar o PO; portal de fornecedores' })}`);
    case 'pessoas': return `
      ${secao('Responsável pelo treinamento', 'Quem organiza turmas e alunos e recebe as comunicações (RH, T&D ou gestor).', camposContato('rh', { nome: d['rh.nome'], cargo: d['rh.cargo'], papel: d['rh.papel'], email: d['rh.email'], celular: d['rh.celular'] }, { comPapel: true }))}
      <div class="h-4"></div>
      ${secao('Contato financeiro', 'Quem recebe boleto, NF e cobra pendências.', `
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="mesmoFinanceiro" class="check" ${d.mesmoFinanceiro ? 'checked' : ''}>
          <span class="text-sm text-slate-800 dark:text-neutral-100">É a mesma pessoa do responsável pelo treinamento</span>
        </label>
        <div id="bloco-fin" class="space-y-3 ${d.mesmoFinanceiro ? 'hidden' : ''}">${camposContato('fin', { nome: d['fin.nome'], cargo: d['fin.cargo'], email: d['fin.email'], celular: d['fin.celular'] })}</div>`)}`;
    case 'revisao': return telaRevisao();
  }
  return '';
}

function telaRevisao() {
  const d = estado.d;
  const v = (x, vazioTxt = '—') => (x === '' || x == null ? `<span class="text-slate-400">${vazioTxt}</span>` : esc(String(x)));
  const nomeDe = (lista, id) => lista.find((o) => o.id === id)?.nome ?? '';
  const bloco = (i, titulo, linhas) => `
    <section class="${CARTAO}">
      <div class="px-5 py-3 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
        <h2 class="font-display font-semibold text-slate-800 dark:text-neutral-100">${titulo}</h2>
        <button type="button" data-ir="${i}" class="${BOTAO_LINK}">Editar</button>
      </div>
      <dl class="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        ${linhas.map(([k, val]) => `<div><dt class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">${k}</dt><dd class="text-slate-800 dark:text-neutral-100 break-words">${val}</dd></div>`).join('')}
      </dl>
    </section>`;
  const pessoa = (p) => `${v(d[`${p}.nome`])}${d[`${p}.cargo`] ? ` · ${esc(d[`${p}.cargo`])}` : ''}<br><span class="text-xs text-slate-500">${v(d[`${p}.email`])}${d[`${p}.celular`] ? ` · ${esc(d[`${p}.celular`])}` : ''}</span>`;
  return `
    <div class="space-y-4">
      <p class="text-sm text-slate-500 dark:text-neutral-400">Confira tudo antes de enviar. Depois do envio, correções só pela ProWay.</p>
      ${bloco(0, 'Empresa', [['Razão social', v(d.razaoSocial)], ['Nome fantasia', v(d.nomeFantasia)], ['CNPJ', v(d.cnpj)], ['Inscrição estadual', v(d.inscricaoEstadual)], ['Segmento', v(nomeDe(SEGMENTOS, d.segmento))], ['Porte', v(nomeDe(PORTES, d.porte))]])}
      ${bloco(1, 'Contato geral', [['E-mail', v(d.email)], ['Telefone', v(d.telefone)], ['Site', v(d.site)]])}
      ${bloco(2, 'Endereço fiscal', [['Endereço', `${v(d.logradouro)}, ${v(d.numero)}${d.complemento ? ` · ${esc(d.complemento)}` : ''}`], ['Bairro / cidade', `${v(d.bairro)} · ${v(d.cidade)}/${v(d.uf)}`], ['CEP', v(d.cep)]])}
      ${bloco(3, 'Cobrança e NF', [['E-mail de cobrança', v(d.emailCobranca)], ['Forma / vencimento', `${v(nomeDe(FORMAS_COBRANCA, d.formaPreferida))}${d.diaVencimento ? ` · dia ${esc(String(d.diaVencimento))}` : ''}`], ['Pedido de compra', d.exigePedidoCompra ? 'Exige PO' : 'Não exige'], ['Observações', v(d.observacoesCobranca)]])}
      ${bloco(4, 'Pessoas de contato', [['Responsável pelo treinamento', pessoa('rh')], ['Contato financeiro', d.mesmoFinanceiro ? '<span class="text-slate-500">Mesma pessoa</span>' : pessoa('fin')]])}
      ${secao('Privacidade (LGPD)', '', `
        <label class="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="aceite" class="check mt-0.5" ${d.aceite ? 'checked' : ''}>
          <span class="text-sm text-slate-800 dark:text-neutral-100">Declaro que tenho autorização para fornecer estes dados em nome da empresa e aceito o <a href="#" class="text-petrol-800 dark:text-sky-300 hover:underline">termo de uso e política de privacidade</a> da ProWay.</span>
        </label>
        ${ERRO('aceite')}`)}
    </div>`;
}

function render() {
  const e = estado.empresa;
  const i = estado.passo;
  const ultimo = i === PASSOS.length - 1;
  document.getElementById('tela').innerHTML = `
    <div class="mb-5">
      <h1 class="font-display text-2xl font-semibold text-slate-900 dark:text-neutral-100">Cadastro da ${esc(e.nomeFantasia || e.razaoSocial)} na ProWay</h1>
      <p class="text-sm text-slate-500 dark:text-neutral-400 mt-1">Etapa ${i + 1} de ${PASSOS.length} · ${esc(PASSOS[i].titulo)}. Seu progresso fica salvo neste navegador até você enviar.</p>
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
  form.querySelector('[name="mesmoFinanceiro"]')?.addEventListener('change', (ev) => form.querySelector('#bloco-fin').classList.toggle('hidden', ev.target.checked));
  document.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => { coletar(form); ir(Number(b.dataset.ir)); }));
  form.querySelector('#btn-voltar')?.addEventListener('click', () => { coletar(form); ir(i - 1); });
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    coletar(form);
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
  PASSOS[estado.passo].campos.forEach((c) => {
    const el = form.querySelector(`[name="${c}"]`);
    if (!el) return;
    estado.d[c] = el.type === 'checkbox' ? fd.has(c) : (fd.get(c) ?? '');
  });
  salvarRascunho();
}

function ir(passo) {
  estado.passo = Math.max(0, Math.min(PASSOS.length - 1, passo));
  salvarRascunho();
  render();
}

function enviar(form) {
  const atuais = Clientes.carregar();
  const erros = Clientes.validarPreenchimentoEmpresa(montar(estado.d), atuais.empresas, estado.empresa.id);
  if (erros.length) {
    const noPasso = erros.filter((x) => PASSOS[estado.passo].campos.includes(x.campo));
    if (noPasso.length) { mostrarErros(form, noPasso); toast('Confira os campos destacados.'); return; }
    const idx = PASSOS.findIndex((p) => erros.some((x) => p.campos.includes(x.campo)));
    ir(idx);
    mostrarErros(document.getElementById('form'), erros);
    toast(`Falta ajustar algo na etapa "${PASSOS[idx].titulo}".`);
    return;
  }
  Clientes.salvar(Clientes.preencherPelaEmpresa(atuais, estado.token, montar(estado.d)));
  sessionStorage.removeItem(chaveRascunho());
  window.scrollTo({ top: 0 });
  telaAviso('Cadastro enviado. Obrigado!', 'A ProWay já recebeu os dados da empresa. Em seguida enviamos a proposta/contrato e o link para os colaboradores se cadastrarem.', 'ok');
}

(function iniciar() {
  const token = new URLSearchParams(location.search).get('token');
  const dados = Clientes.carregar();
  const e = Clientes.empresaPorTokenCadastro(dados, token);
  if (!e) { telaAviso('Link inválido ou expirado', 'Peça um novo link para a ProWay pelo WhatsApp ou e-mail.'); return; }
  if (e.cadastro.preenchidoEm) { telaAviso('Cadastro já enviado', `Recebemos os dados em ${esc(Clientes.fmtData(e.cadastro.preenchidoEm.slice(0, 10)))}. Se precisar corrigir algo, fale com a ProWay.`, 'ok'); return; }
  estado.empresa = e; estado.token = token;
  const rascunho = lerRascunho();
  estado.d = rascunho?.d ? { ...dadosIniciais(e), ...rascunho.d } : dadosIniciais(e);
  estado.passo = rascunho?.passo ?? 0;
  render();
})();
