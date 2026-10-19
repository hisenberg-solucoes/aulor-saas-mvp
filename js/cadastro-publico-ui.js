// Helpers das páginas públicas de cadastro (cadastro-aluno.html, cadastro-empresa.html): campos, seções, erros, aviso.

const CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm';
const CARTAO_OPCAO = 'cursor-pointer rounded-lg border p-3 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 border-slate-300 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500 transition';
const BOTAO_PRI = 'inline-flex items-center gap-1.5 h-10 px-5 rounded-lg text-sm font-semibold bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/40';
const OPCIONAL = '<span class="normal-case font-normal tracking-normal text-slate-400">(opcional)</span>';
const ERRO = (campo) => `<p data-erro="${campo}" class="text-xs text-red-600 dark:text-red-400 mt-1 hidden"></p>`;
const idDe = (name) => `f-${name.replace('.', '-')}`;

const campoTexto = (name, rotulo, valor, { tipo = 'text', placeholder = '', max = '', extra = '', opcional = false, mascara = '' } = {}) => `
  <div>
    <label class="rotulo" for="${idDe(name)}">${rotulo} ${opcional ? OPCIONAL : ''}</label>
    <input id="${idDe(name)}" name="${name}" type="${tipo}" ${max ? `maxlength="${max}"` : ''} ${extra} ${mascara ? `data-mascara="${mascara}"` : ''} class="campo" placeholder="${esc(placeholder)}" value="${esc(valor ?? '')}">
    ${ERRO(name)}
  </div>`;
const campoArea = (name, rotulo, valor, { rows = 3, placeholder = '', max = '', opcional = false } = {}) => `
  <div>
    <label class="rotulo" for="${idDe(name)}">${rotulo} ${opcional ? OPCIONAL : ''}</label>
    <textarea id="${idDe(name)}" name="${name}" rows="${rows}" ${max ? `maxlength="${max}"` : ''} class="campo resize-y" placeholder="${esc(placeholder)}">${esc(valor ?? '')}</textarea>
    ${ERRO(name)}
  </div>`;
const campoSelect = (name, rotulo, opcoes, valor, { opcional = false, placeholder = 'Escolha' } = {}) => `
  <div>
    <label class="rotulo" for="${idDe(name)}">${rotulo} ${opcional ? OPCIONAL : ''}</label>
    <select id="${idDe(name)}" name="${name}" class="campo">
      <option value="">${esc(placeholder)}</option>
      ${opcoes.map((o) => `<option value="${esc(o.id)}" ${valor === o.id ? 'selected' : ''}>${esc(o.nome)}</option>`).join('')}
    </select>
    ${ERRO(name)}
  </div>`;
const cartoesRadio = (name, opcoes, valor) => `
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
    ${opcoes.map((o) => `
    <label class="${CARTAO_OPCAO}">
      <input type="radio" name="${name}" value="${o.id}" class="sr-only" ${valor === o.id ? 'checked' : ''}>
      <p class="text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(o.nome)}</p>
      ${o.descricao ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(o.descricao)}</p>` : ''}
    </label>`).join('')}
  </div>`;
const secao = (titulo, subtitulo, corpo) => `
  <section class="${CARTAO}">
    <div class="px-5 py-3 border-b border-slate-200 dark:border-neutral-800">
      <h2 class="font-display font-semibold text-slate-800 dark:text-neutral-100">${titulo}</h2>
      ${subtitulo ? `<p class="text-xs text-slate-500 dark:text-neutral-400">${subtitulo}</p>` : ''}
    </div>
    <div class="p-5 space-y-4">${corpo}</div>
  </section>`;

function mostrarErros(form, erros) {
  form.querySelectorAll('[data-erro]').forEach((p) => { p.classList.add('hidden'); p.textContent = ''; });
  form.querySelectorAll('.campo-erro').forEach((c) => c.classList.remove('campo-erro'));
  if (!erros.length) return false;
  erros.forEach((erro) => {
    const p = form.querySelector(`[data-erro="${erro.campo}"]`);
    if (p) { p.textContent = erro.mensagem; p.classList.remove('hidden'); }
    form.querySelector(`[name="${erro.campo}"]`)?.classList.add('campo-erro');
  });
  const primeiro = form.querySelector(`[data-erro="${erros[0].campo}"]`);
  (form.querySelector(`[name="${erros[0].campo}"]`) ?? primeiro)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  form.querySelector(`[name="${erros[0].campo}"]`)?.focus({ preventScroll: true });
  return true;
}

function telaAviso(titulo, texto, icone = 'alerta') {
  const cor = icone === 'ok' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400';
  const svg = icone === 'ok'
    ? '<svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    : '<svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>';
  document.getElementById('tela').innerHTML = `
    <div class="${CARTAO} p-8 text-center max-w-lg mx-auto mt-10">
      <div class="${cor} mx-auto w-fit">${svg}</div>
      <h1 class="font-display text-xl font-semibold mt-3 text-slate-900 dark:text-neutral-100">${titulo}</h1>
      <p class="text-sm text-slate-500 dark:text-neutral-400 mt-2">${texto}</p>
    </div>`;
}

