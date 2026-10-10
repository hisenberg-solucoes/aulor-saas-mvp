// ============================================================
// Validação pública de certificado (sem login): ?codigo=ATL-2026-XXXX-XXXX.
// Mostra só o necessário para conferir a autenticidade (CPF mascarado).
// Na demonstração consulta os dados deste navegador; em produção é uma
// rota pública da escola consultando o servidor.
// ============================================================

(function () {
  const escola = Aulor.escola();
  const habilitada = Aulor.temModulo('validacao_publica');
  const mascararCpf = (cpf) => (cpf ? `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**` : '—');

  document.body.classList.add('min-h-full', 'bg-areia', 'dark:bg-black', 'font-sans', 'antialiased', 'text-slate-800', 'dark:text-neutral-100');
  document.body.insertAdjacentHTML('afterbegin', `
    <main class="min-h-screen flex flex-col items-center px-4 py-10 sm:py-16">
      <div class="w-full max-w-lg">
        <div class="flex items-center gap-3 mb-6">
          <span class="h-10 w-10 rounded-lg bg-laranja-escuro text-white grid place-items-center font-semibold">${esc(escola.sigla.slice(0, 2))}</span>
          <div><p class="font-display font-semibold text-slate-900 dark:text-neutral-100">${esc(escola.nome)}</p><p class="text-xs text-slate-500 dark:text-neutral-400">Validação de certificados</p></div>
        </div>
        <div class="painel p-5 sm:p-6">
          ${habilitada ? `
          <form id="form-validar" class="flex flex-col sm:flex-row gap-2">
            <label for="codigo" class="sr-only">Código de validação</label>
            <input id="codigo" name="codigo" class="campo font-mono uppercase" placeholder="${esc(escola.sigla)}-2026-XXXX-XXXX" value="${esc(parametroUrl('codigo') ?? '')}" autocomplete="off">
            <button class="btn-pri">Validar</button>
          </form>
          <div id="resultado" class="mt-5" aria-live="polite"></div>` : `
          <p class="text-sm text-slate-600 dark:text-neutral-300">A validação pública de certificados não está habilitada no plano desta escola. Para confirmar a autenticidade de um certificado, fale com a secretaria.</p>`}
        </div>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-4">Demonstração: a consulta usa os dados fictícios salvos neste navegador. <a class="link" href="index.html">Voltar ao sistema</a></p>
      </div>
      <div class="mt-auto pt-10 flex items-center gap-2 text-xs text-slate-400"><img src="img/aulor-simbolo.svg" alt="" class="h-5 w-5">Emitido com Aulor</div>
    </main>`);
  if (!habilitada) return;

  const form = document.getElementById('form-validar');
  const resultado = document.getElementById('resultado');
  function validar() {
    const codigo = form.codigo.value.trim();
    if (!codigo) { resultado.innerHTML = ''; return; }
    const c = Aulor.certificadoPorCodigo(codigo);
    if (!c) {
      resultado.innerHTML = '<div class="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-900 dark:text-red-200"><b>Código não encontrado.</b> Confira se foi digitado exatamente como no certificado.</div>';
      return;
    }
    const linha = (r, v) => `<div class="flex justify-between gap-4 py-2 text-sm"><dt class="text-slate-500 dark:text-neutral-400">${r}</dt><dd class="text-right font-medium">${v}</dd></div>`;
    resultado.innerHTML = `
      ${c.status === 'valido'
        ? '<p class="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold mb-3"><span class="h-6 w-6 rounded-full bg-emerald-600 text-white grid place-items-center">✓</span>Certificado válido</p>'
        : `<p class="text-red-700 dark:text-red-400 font-semibold mb-1">Certificado cancelado em ${dataBr(c.canceladoEm)}</p><p class="text-sm text-slate-600 dark:text-neutral-300 mb-3">Este documento não tem mais validade.</p>`}
      <dl class="divide-y divide-slate-100 dark:divide-neutral-900 border-y border-slate-100 dark:border-neutral-900">
        ${linha('Aluno', esc(c.dados.aluno))}
        ${linha('CPF', mascararCpf(c.dados.cpf))}
        ${linha('Curso', esc(c.dados.curso))}
        ${linha('Carga horária', `${c.dados.cargaHoraria} h`)}
        ${linha('Período', `${dataBr(c.dados.inicio)} a ${dataBr(c.dados.fim)}`)}
        ${linha('Emitido em', dataBr(c.emitidoEm))}
        ${linha('Código', `<span class="font-mono">${esc(c.codigo)}</span>`)}
      </dl>`;
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = new URL(location.href);
    url.searchParams.set('codigo', form.codigo.value.trim());
    history.replaceState(null, '', url);
    validar();
  });
  validar();
})();
