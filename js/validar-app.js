// ============================================================
// Validação pública de certificado (sem login): ?codigo=ATL-2026-XXXX-XXXX.
// Mostra só o necessário para conferir a autenticidade (CPF mascarado).
// Na demonstração consulta os dados deste navegador; em produção é uma
// rota pública da escola consultando o servidor.
// Página pública, sem shell: fundo da página, a escola no topo e um cartão.
// ============================================================

(function () {
  const escola = Aulor.escola();
  const habilitada = Aulor.temModulo('validacao_publica');
  const mascararCpf = (cpf) => (cpf ? `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**` : '—');

  document.body.classList.add('min-h-full', 'bg-fundo', 'dark:bg-black', 'font-sans', 'antialiased', 'text-slate-800', 'dark:text-neutral-100');
  document.body.insertAdjacentHTML('afterbegin', `
    <main class="min-h-screen flex flex-col items-center px-4 py-10 sm:py-16">
      <div class="w-full max-w-lg">
        <div class="flex items-center gap-3 mb-5">
          ${avatarRegistro(escola.sigla.slice(0, 3), escola.nome)}
          <div class="min-w-0">
            <h1 class="text-xl font-semibold tracking-[-0.01em] ${TITULO}">Validação de certificados</h1>
            <p class="text-sm ${APOIO_FUNDO}">${esc(escola.nome)}</p>
          </div>
        </div>
        <div class="painel p-5">
          ${habilitada ? `
          <form id="form-validar" class="flex flex-col sm:flex-row gap-2">
            <label for="codigo" class="sr-only">Código de validação</label>
            <input id="codigo" name="codigo" class="campo font-mono uppercase" placeholder="${esc(escola.sigla)}-2026-XXXX-XXXX" value="${esc(parametroUrl('codigo') ?? '')}" autocomplete="off">
            <button class="btn-pri">Validar</button>
          </form>
          <p class="text-xs ${APOIO} mt-2">O código fica no rodapé do certificado, abaixo do local e da data.</p>
          <div id="resultado" class="empty:hidden mt-5" aria-live="polite"></div>` : `
          <p class="text-sm text-slate-600 dark:text-neutral-300">A validação pública de certificados não está habilitada no plano desta escola. Para confirmar a autenticidade de um certificado, fale com a secretaria.</p>`}
        </div>
        <p class="text-xs ${APOIO_FUNDO} mt-4">Demonstração: a consulta usa os dados fictícios salvos neste navegador. <a class="link" href="index.html">Voltar ao sistema</a></p>
      </div>
      <div class="mt-auto pt-10 flex items-center gap-2 text-xs ${APOIO_FUNDO}"><img src="img/aulor-simbolo.svg" alt="" class="h-5 w-5">Emitido com Aulor</div>
    </main>`);
  if (!habilitada) return;

  const form = document.getElementById('form-validar');
  const resultado = document.getElementById('resultado');
  function validar() {
    const codigo = form.codigo.value.trim();
    if (!codigo) { resultado.innerHTML = ''; return; }
    const c = Aulor.certificadoPorCodigo(codigo);
    if (!c) {
      // A faixa traz o mb-4 do topo da ficha; aqui ela é a última coisa do cartão.
      resultado.innerHTML = faixa('erro', '<span class="font-medium">Código não encontrado.</span> Confira se foi digitado exatamente como no certificado.').replace('mb-4 ', '');
      return;
    }
    const linha = (r, v) => `<div class="flex justify-between gap-4 py-2 text-sm"><dt class="${APOIO}">${r}</dt><dd class="text-right font-medium ${TITULO}">${v}</dd></div>`;
    resultado.innerHTML = `
      ${c.status === 'valido'
        ? '<p class="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400 mb-3"><span class="h-6 w-6 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black grid place-items-center" aria-hidden="true">✓</span>Certificado válido</p>'
        : `<p class="font-semibold text-red-700 dark:text-red-400 mb-1">Certificado cancelado em ${dataBr(c.canceladoEm)}</p><p class="text-sm text-slate-600 dark:text-neutral-300 mb-3">Este documento não tem mais validade.</p>`}
      <dl class="divide-y divide-slate-100 dark:divide-neutral-900 border-y border-slate-100 dark:border-neutral-900">
        ${linha('Aluno', esc(c.dados.aluno))}
        ${linha('CPF', `<span class="font-mono">${mascararCpf(c.dados.cpf)}</span>`)}
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
