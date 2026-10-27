// Página pública (variante passo a passo): o instrutor completa o cadastro em etapas, com revisão no final.
// Mesmo token e mesma gravação de cadastro-instrutor.html (Instrutores.preencherPeloInstrutor). Rascunho fica no sessionStorage.

const BOTAO_SEC = 'inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30';
const BOTAO_LINK = 'text-xs font-medium text-petrol-800 dark:text-sky-300 hover:underline';

const PASSOS = [
  { id: 'dados', titulo: 'Você', campos: ['nome', 'apelido', 'nascimento', 'cpf', 'rg', 'especialidade', 'bio'] },
  { id: 'contato', titulo: 'Contato', campos: ['email', 'whatsapp', 'emergenciaNome', 'emergenciaTelefone'] },
  { id: 'endereco', titulo: 'Endereço', campos: ['cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf'] },
  { id: 'empresa', titulo: 'Pagamento', campos: ['cnpj', 'razaoSocial', 'banco', 'agencia', 'conta', 'pix'] },
  { id: 'documentos', titulo: 'Documentos', campos: ['antecedentesArquivo'] },
  { id: 'revisao', titulo: 'Revisão', campos: ['aceite', 'aceiteDados'] },
];

const estado = { instrutor: null, token: '', passo: 0, d: null };

const chaveRascunho = () => `cadastro-instrutor-passos:${estado.token}`;
function salvarRascunho() { try { sessionStorage.setItem(chaveRascunho(), JSON.stringify({ passo: estado.passo, d: estado.d })); } catch (_) { /* rascunho é conveniência */ } }
function lerRascunho() { try { return JSON.parse(sessionStorage.getItem(chaveRascunho())); } catch (_) { return null; } }

function errosDoPasso(i) {
  const todos = Instrutores.validarPreenchimento(montar(estado.d), Instrutores.carregar(), estado.instrutor.id);
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
    case 'dados': return `${secaoFoto(d)}<div class="h-4"></div>${secaoDados(d)}`;
    case 'contato': return secaoContato(d);
    case 'endereco': return secaoEndereco(d);
    case 'empresa': return secaoEmpresa(d);
    case 'documentos': return secaoDocumentos(d);
    case 'revisao': return telaRevisao();
  }
  return '';
}

function telaRevisao() {
  const d = estado.d;
  const v = (x, vazioTxt = '—') => (x === '' || x == null ? `<span class="text-slate-400">${vazioTxt}</span>` : esc(String(x)));
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
  return `
    <div class="space-y-4">
      <p class="text-sm text-slate-500 dark:text-neutral-400">Confira tudo antes de enviar. Depois do envio, correções só pela coordenação.</p>
      ${bloco(0, 'Você', [['Nome', v(d.nome)], ['Chamado de', v(d.apelido)], ['Nascimento', v(Instrutores.fmtData(d.nascimento))], ['CPF', v(d.cpf)], ['RG', v(d.rg)], ['Especialidade', v(d.especialidade)]])}
      ${bloco(1, 'Contato', [['E-mail', v(d.email)], ['WhatsApp', v(d.whatsapp)], ['Emergência', `${v(d.emergenciaNome)}${d.emergenciaTelefone ? ` · ${esc(d.emergenciaTelefone)}` : ''}`]])}
      ${bloco(2, 'Endereço', [['Endereço', `${v(d.logradouro)}, ${v(d.numero)}${d.complemento ? ` · ${esc(d.complemento)}` : ''}`], ['Bairro / cidade', `${v(d.bairro)} · ${v(d.cidade)}/${v(d.uf)}`], ['CEP', v(d.cep)]])}
      ${bloco(3, 'Empresa para pagamento', [['CNPJ', v(d.cnpj)], ['Razão social', v(d.razaoSocial)], ['Banco / agência / conta', `${v(d.banco)} · ${v(d.agencia)} · ${v(d.conta)}`], ['Chave PIX', v(d.pix)]])}
      ${bloco(4, `Antecedentes ${Instrutores.anoAtual()}`, [['Arquivo', v(d.antecedentesArquivo, 'nenhum — pode enviar depois')]])}
      ${secaoLgpd(d)}
    </div>`;
}

function render() {
  const i = estado.passo;
  const ultimo = i === PASSOS.length - 1;
  const quem = estado.instrutor.apelido || estado.instrutor.nome;
  document.getElementById('tela').innerHTML = `
    <div class="mb-5">
      <h1 class="font-display text-2xl font-semibold text-slate-900 dark:text-neutral-100">Cadastro de instrutor da ProWay</h1>
      <p class="text-sm text-slate-500 dark:text-neutral-400 mt-1">Olá, ${esc(quem.split(' ')[0])}! Etapa ${i + 1} de ${PASSOS.length} · ${esc(PASSOS[i].titulo)}. Seu progresso fica salvo neste navegador até você enviar.</p>
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
  ligarFoto(form, (foto) => { coletar(form); estado.d.foto = foto; salvarRascunho(); render(); });
  ligarAntecedentes(form, () => coletar(form));
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
  const atuais = Instrutores.carregar();
  const erros = Instrutores.validarPreenchimento(montar(estado.d), atuais, estado.instrutor.id);
  if (erros.length) {
    const noPasso = erros.filter((x) => PASSOS[estado.passo].campos.includes(x.campo));
    if (noPasso.length) { mostrarErros(form, noPasso); toast('Confira os campos destacados.'); return; }
    const idx = PASSOS.findIndex((p) => erros.some((x) => p.campos.includes(x.campo)));
    ir(idx);
    mostrarErros(document.getElementById('form'), erros);
    toast(`Falta ajustar algo na etapa "${PASSOS[idx].titulo}".`);
    return;
  }
  Instrutores.salvar(Instrutores.preencherPeloInstrutor(atuais, estado.token, montar(estado.d)));
  sessionStorage.removeItem(chaveRascunho());
  window.scrollTo({ top: 0 });
  telaAviso('Cadastro enviado. Obrigado!', 'A ProWay já recebeu seus dados. O próximo passo é o contrato de prestação de serviço, que chega para assinatura no Clicksign.', 'ok');
}

(function iniciar() {
  const token = new URLSearchParams(location.search).get('token');
  const lista = Instrutores.carregar();
  const i = Instrutores.porTokenCadastro(lista, token);
  if (!i) { telaAviso('Link inválido ou expirado', 'Peça um novo link para a ProWay pelo WhatsApp ou e-mail.'); return; }
  if (i.cadastro.preenchidoEm) { telaAviso('Cadastro já enviado', `Recebemos seus dados em ${esc(Instrutores.fmtData(i.cadastro.preenchidoEm.slice(0, 10)))}. Se precisar corrigir algo, fale com a coordenação.`, 'ok'); return; }
  estado.instrutor = i; estado.token = token;
  const rascunho = lerRascunho();
  estado.d = rascunho?.d ? { ...dadosIniciais(i), ...rascunho.d } : dadosIniciais(i);
  estado.passo = rascunho?.passo ?? 0;
  render();
})();
