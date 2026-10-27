// ============================================================
// Telas de Modelos de contrato (V1, novas): a lista (modelos-contrato.html) e
// a ficha do modelo (modelo-contrato.html?id=), com o texto e os campos na aba
// Texto e o contrato preenchido com uma venda real na aba Pré-visualização.
// Regras e dados em js/modelos-contrato.js.
// ============================================================

(function () {
  const params = new URLSearchParams(location.search);
  const DETALHE = /modelo-contrato\.html$/.test(location.pathname);
  const tela = document.getElementById('tela');
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtData = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');

  const CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)]';
  const TITULO_CARTAO = 'text-[15px] leading-[22px] font-semibold text-slate-900 dark:text-neutral-100';
  const APOIO = 'text-xs text-slate-500 dark:text-neutral-400';
  const ROTULO = 'block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1';
  const CAMPO = 'w-full rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 text-sm text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400 focus:ring-2 focus:ring-petrol-800/20 aria-[invalid=true]:border-red-500';
  const BOTAO_PRI = 'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800 text-white shadow-sm transition disabled:opacity-40';
  const BOTAO_SEC = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition';
  const BOTAO_PERIGO = 'inline-flex items-center h-9 px-3.5 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white dark:text-[#1A0D09] transition';
  const PILULA = 'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-300 whitespace-nowrap';
  const PONTO = '<span class="h-1.5 w-1.5 rounded-full bg-slate-500 dark:bg-neutral-400" aria-hidden="true"></span>';
  const ICONE_ERRO = '<svg class="h-3.5 w-3.5 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>';
  const pilula = (txt) => `<span class="${PILULA}">${PONTO}${esc(txt)}</span>`;
  const nomesCentros = (ids) => (ids ?? []).map((id) => CentrosReceita.nome(id)).filter(Boolean).join(', ');

  function toast(msg) {
    const raiz = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast-anim ficha-inverso flex items-center gap-2.5 max-w-[420px] rounded-lg px-4 py-3 text-[13px] shadow-[0_8px_24px_-8px_rgba(0,0,0,.35)]';
    el.style.background = 'var(--f-papel)'; el.style.color = 'var(--f-tinta)';
    el.innerHTML = `<span class="h-2 w-2 rounded-full" style="background:var(--f-bom)" aria-hidden="true"></span>${esc(msg)}`;
    raiz.append(el);
    setTimeout(() => el.remove(), 7000);
  }

  // Diálogo nativo (DESIGN.md, Diálogos): título, contexto, corpo e ações à direita.
  function dialogo({ titulo, contexto, corpo, acoes, largura = 400, aoAbrir }) {
    const d = document.createElement('dialog');
    d.className = `${CARTAO} modal-anim p-5 w-[${largura}px] max-w-[calc(100vw-48px)] backdrop:bg-[rgb(7_30_44/0.32)] dark:backdrop:bg-[rgb(2_11_17/0.6)] text-slate-800 dark:text-neutral-100`;
    d.style.width = `${largura}px`;
    d.innerHTML = `
      <form method="dialog" novalidate>
        <h2 class="${TITULO_CARTAO}">${titulo}</h2>
        ${contexto ? `<p class="mt-0.5 ${APOIO}">${contexto}</p>` : ''}
        <div class="mt-4">${corpo}</div>
        <div class="mt-5 flex justify-end gap-2">${acoes}</div>
      </form>`;
    document.body.append(d);
    d.addEventListener('close', () => d.remove());
    d.showModal();
    aoAbrir?.(d);
    return d;
  }

  function erroCampo(raiz, id, msg) {
    const el = raiz.querySelector(`#${id}`);
    const p = raiz.querySelector(`#${id}-erro`);
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    p.innerHTML = msg ? `${ICONE_ERRO}<span>${esc(msg)}</span>` : '';
    p.classList.toggle('hidden', !msg); p.classList.toggle('flex', !!msg);
  }
  const msgErro = (id) => `<p id="${id}-erro" class="mt-1 hidden items-center gap-1 text-xs text-red-700 dark:text-red-400"></p>`;

  // ---------- Lista ----------

  function renderLista() {
    const lista = ModelosContrato.carregar().sort((a, b) => (a.status === 'inativo') - (b.status === 'inativo') || a.nome.localeCompare(b.nome, 'pt-BR'));
    tela.innerHTML = `
      <div class="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold tracking-tight text-slate-900 dark:text-neutral-100">Modelos de contrato <span class="text-slate-500 dark:text-neutral-400 font-normal tabular-nums">${lista.length}</span></h2>
          <p class="mt-0.5 text-sm text-slate-500 dark:text-neutral-400">O texto que vai para a assinatura digital, preenchido com os dados reais do aluno, da turma e do pagamento de cada venda.</p>
        </div>
        <button type="button" class="${BOTAO_PRI}" data-novo>Novo modelo</button>
      </div>
      <div class="${CARTAO} overflow-hidden">
        <table class="w-full table-fixed text-sm">
          <thead><tr class="text-left text-xs font-medium text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-800">
            <th class="px-4 py-2.5 w-[55%]">Modelo</th><th class="px-4 py-2.5">Centros de receita</th><th class="px-4 py-2.5 w-36 text-right">Atualizado em</th>
          </tr></thead>
          <tbody class="divide-y divide-slate-200 dark:divide-neutral-800">${lista.map((m) => `
            <tr class="relative hover:bg-slate-50 dark:hover:bg-neutral-900 ${m.status === 'inativo' ? 'linha-apagada' : ''}">
              <td class="px-4 py-2.5">
                <div class="flex items-center gap-2"><a href="modelo-contrato.html?id=${encodeURIComponent(m.id)}" class="font-medium text-slate-900 dark:text-neutral-100 hover:text-petrol-800 dark:hover:text-sky-300 after:absolute after:inset-0">${esc(m.nome)}</a>${m.padrao ? pilula('Padrão') : ''}${m.status === 'inativo' ? `<span class="pilula">${pilula('Inativo')}</span>` : ''}</div>
                <p class="${APOIO} truncate">${esc(m.descricao)}</p>
              </td>
              <td class="px-4 py-2.5 text-slate-600 dark:text-neutral-300">${esc(nomesCentros(m.centrosReceita)) || '<span class="text-slate-500 dark:text-neutral-400">—</span>'}</td>
              <td class="px-4 py-2.5 text-right tabular-nums text-slate-600 dark:text-neutral-300">${fmtData(m.atualizadoEm)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    tela.querySelector('[data-novo]').addEventListener('click', novoModelo);
  }

  function novoModelo() {
    const d = dialogo({
      titulo: 'Novo modelo de contrato',
      contexto: 'Começa com o texto do modelo padrão, para você ajustar.',
      corpo: `<label for="nome" class="${ROTULO}">Nome</label><input id="nome" class="${CAMPO} h-9" autocomplete="off" aria-describedby="nome-erro">${msgErro('nome')}`,
      acoes: `<button value="cancelar" class="${BOTAO_SEC}">Cancelar</button><button value="criar" data-criar class="${BOTAO_PRI}">Criar</button>`,
      aoAbrir: (dl) => dl.querySelector('#nome').focus(),
    });
    d.querySelector('[data-criar]').addEventListener('click', (e) => {
      e.preventDefault();
      const padrao = ModelosContrato.carregar().find((m) => m.padrao);
      const r = ModelosContrato.salvar({ nome: d.querySelector('#nome').value, texto: padrao?.texto ?? 'Contrato nº {{venda.codigo}}', centrosReceita: [], padrao: false });
      if (r.erros) return erroCampo(d, 'nome', r.erros.nome);
      location.href = `modelo-contrato.html?id=${encodeURIComponent(r.modelo.id)}`;
    });
  }

  // ---------- Ficha do modelo ----------

  const estado = { aba: params.get('aba') === 'previa' ? 'previa' : 'texto', rascunho: null, vendaId: null, erros: {} };
  const ctx = () => {
    const cli = Clientes.carregar();
    return { empresas: cli.empresas, alunos: cli.alunos, responsaveis: cli.responsaveis, cursos: Cursos.carregar(), formacoes: Formacoes.carregar() };
  };

  function renderFicha() {
    const salvo = ModelosContrato.porId(params.get('id'));
    if (!salvo) {
      tela.innerHTML = `<p class="text-sm text-slate-500 dark:text-neutral-400">Modelo não encontrado. <a href="modelos-contrato.html" class="text-petrol-800 dark:text-sky-300 hover:underline">Voltar aos modelos</a></p>`;
      return;
    }
    estado.rascunho ??= JSON.parse(JSON.stringify(salvo));
    const m = estado.rascunho;
    const alterado = JSON.stringify(m) !== JSON.stringify(salvo);
    tela.innerHTML = `
      <nav aria-label="Trilha" class="mb-3 text-sm text-slate-500 dark:text-neutral-400"><a href="modelos-contrato.html" class="hover:text-petrol-800 dark:hover:text-sky-300">Modelos de contrato</a> / <span aria-current="page" class="text-slate-900 dark:text-neutral-100">${esc(salvo.nome)}</span></nav>
      <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="font-registro text-[26px] leading-[1.15] font-semibold tracking-[-0.01em] text-slate-900 dark:text-neutral-100">${esc(salvo.nome)}</h2>
            ${salvo.padrao ? pilula('Padrão') : ''}${salvo.status === 'inativo' ? pilula('Inativo') : ''}
          </div>
          <p class="mt-1 text-[13px] text-slate-500 dark:text-neutral-400">${esc(nomesCentros(salvo.centrosReceita) || 'Sem centro de receita')} · atualizado em ${fmtData(salvo.atualizadoEm)}</p>
        </div>
        <div class="flex items-center gap-2">
          ${alterado ? `<span class="text-xs text-amber-700 dark:text-amber-300">Alterações não salvas</span>` : ''}
          <button type="button" class="${BOTAO_PRI}" data-salvar ${alterado ? '' : 'disabled'}>Salvar</button>
          <button type="button" class="${BOTAO_SEC}" popovertarget="mais-modelo" aria-haspopup="menu">Mais <svg class="h-3.5 w-3.5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg></button>
          <div id="mais-modelo" popover role="menu" class="menu-conta">
            <button type="button" role="menuitem" data-acao="duplicar">Duplicar<span class="block ${APOIO}">Cria uma cópia para editar.</span></button>
            <button type="button" role="menuitem" data-acao="padrao" ${salvo.padrao ? 'aria-disabled="true"' : ''}>Definir como padrão<span class="block ${APOIO}">${salvo.padrao ? 'Já é o padrão.' : 'Vale para as vendas sem modelo do centro de receita.'}</span></button>
            <button type="button" role="menuitem" data-acao="status" ${salvo.padrao && salvo.status !== 'inativo' ? 'aria-disabled="true"' : ''}>${salvo.status === 'inativo' ? 'Reativar' : 'Inativar'}<span class="block ${APOIO}">${salvo.padrao && salvo.status !== 'inativo' ? 'O padrão não pode ser inativado.' : salvo.status === 'inativo' ? 'Volta a valer para novas vendas.' : 'Deixa de valer para novas vendas.'}</span></button>
            <hr>
            <button type="button" role="menuitem" data-acao="excluir" class="text-red-700 dark:text-red-400" ${salvo.padrao ? 'aria-disabled="true"' : ''}>Excluir<span class="block ${APOIO}">${salvo.padrao ? 'É o modelo padrão.' : 'Vendas já assinadas guardam o texto delas.'}</span></button>
          </div>
        </div>
      </div>
      <div role="tablist" class="mb-4 flex gap-4 border-b border-slate-200 dark:border-neutral-800 text-[13px] font-medium">
        ${[['texto', 'Texto'], ['previa', 'Pré-visualização']].map(([id, nome]) => `<button type="button" role="tab" data-aba="${id}" aria-selected="${estado.aba === id}" class="-mb-px pb-2 border-b-2 ${estado.aba === id ? 'border-[var(--f-marca-tinta)] text-slate-900 dark:text-neutral-100' : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100'}">${nome}</button>`).join('')}
      </div>
      <div id="conteudo-aba"></div>`;
    tela.querySelectorAll('[data-aba]').forEach((b) => b.addEventListener('click', () => {
      estado.aba = b.dataset.aba;
      history.replaceState(null, '', `?id=${encodeURIComponent(salvo.id)}${estado.aba === 'previa' ? '&aba=previa' : ''}`);
      renderFicha();
    }));
    tela.querySelector('[data-salvar]').addEventListener('click', salvar);
    tela.querySelectorAll('#mais-modelo [data-acao]').forEach((b) => b.addEventListener('click', () => {
      if (b.getAttribute('aria-disabled') === 'true') return;
      document.getElementById('mais-modelo').hidePopover();
      acaoMais(b.dataset.acao, salvo);
    }));
    const mais = document.getElementById('mais-modelo');
    mais.addEventListener('toggle', (e) => {
      if (e.newState !== 'open') return;
      const r = tela.querySelector('[popovertarget="mais-modelo"]').getBoundingClientRect();
      mais.style.top = `${r.bottom + 4}px`; mais.style.right = `${innerWidth - r.right}px`;
    });
    (estado.aba === 'texto' ? renderTexto : renderPrevia)();
  }

  function renderTexto() {
    const m = estado.rascunho;
    const centros = CentrosReceita.ativos();
    document.getElementById('conteudo-aba').innerHTML = `
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section class="${CARTAO} p-4 xl:col-span-2">
          <h3 class="${TITULO_CARTAO}">Texto do contrato</h3>
          <p class="${APOIO}">Os campos entre chaves duplas, como {{contratante.nome}}, saem com os dados de cada venda. Parágrafos separados por uma linha em branco.</p>
          <textarea id="texto" rows="24" spellcheck="true" aria-describedby="texto-erro" class="${CAMPO} mt-3 py-2 leading-6 resize-y">${esc(m.texto)}</textarea>
          ${msgErro('texto')}
        </section>
        <div class="space-y-4">
          <section class="${CARTAO} p-4">
            <h3 class="${TITULO_CARTAO}">Dados do modelo</h3>
            <div class="mt-3 space-y-4">
              <div><label for="nome" class="${ROTULO}">Nome</label><input id="nome" class="${CAMPO} h-9" value="${esc(m.nome)}" aria-describedby="nome-erro">${msgErro('nome')}</div>
              <div><label for="descricao" class="${ROTULO}">Descrição <span class="font-normal">(opcional)</span></label><input id="descricao" class="${CAMPO} h-9" value="${esc(m.descricao)}"></div>
              <fieldset><legend class="${ROTULO}">Vale para as vendas dos centros de receita</legend>
                <div class="mt-1 space-y-1.5">${centros.map((c) => `<label class="flex items-center gap-2 text-sm text-slate-800 dark:text-neutral-200"><input type="checkbox" data-centro="${esc(c.id)}" class="h-4 w-4 accent-[var(--f-marca-tinta)]" ${m.centrosReceita?.includes(c.id) ? 'checked' : ''}>${esc(c.nome)}</label>`).join('')}</div>
              </fieldset>
            </div>
          </section>
          <section class="${CARTAO} p-4">
            <h3 class="${TITULO_CARTAO}">Campos</h3>
            <p class="${APOIO}">Clique para inserir no texto, onde está o cursor.</p>
            <div class="mt-3 space-y-3">${CAMPOS_CONTRATO.map((g) => `
              <div><p class="text-xs font-medium text-slate-500 dark:text-neutral-400">${esc(g.grupo)}</p>
                <ul class="mt-1">${g.campos.map(([id, rotulo]) => `<li><button type="button" data-campo="${id}" class="w-full flex items-baseline justify-between gap-3 rounded-md px-2 py-1 -mx-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-neutral-900"><span class="text-slate-800 dark:text-neutral-200">${esc(rotulo)}</span><code class="font-mono text-[11.5px] text-slate-500 dark:text-neutral-400">{{${id}}}</code></button></li>`).join('')}</ul>
              </div>`).join('')}
            </div>
          </section>
        </div>
      </div>`;
    const raiz = document.getElementById('conteudo-aba');
    Object.entries(estado.erros).forEach(([id, msg]) => erroCampo(raiz, id, msg));
    const atualizar = () => {
      const antes = JSON.stringify(m);
      m.texto = raiz.querySelector('#texto').value;
      m.nome = raiz.querySelector('#nome').value;
      m.descricao = raiz.querySelector('#descricao').value;
      m.centrosReceita = [...raiz.querySelectorAll('[data-centro]:checked')].map((x) => x.dataset.centro);
      if (antes !== JSON.stringify(m)) atualizarCabecalho();
    };
    raiz.querySelectorAll('input, textarea').forEach((el) => el.addEventListener('input', atualizar));
    raiz.querySelectorAll('[data-campo]').forEach((b) => b.addEventListener('click', () => {
      const ta = raiz.querySelector('#texto');
      const [i, f] = [ta.selectionStart, ta.selectionEnd];
      const ins = `{{${b.dataset.campo}}}`;
      ta.value = ta.value.slice(0, i) + ins + ta.value.slice(f);
      ta.focus(); ta.selectionStart = ta.selectionEnd = i + ins.length;
      atualizar();
    }));
  }

  // Só o cabeçalho reage ao digitar (o texto não é redesenhado, para não perder o cursor).
  function atualizarCabecalho() {
    const alterado = JSON.stringify(estado.rascunho) !== JSON.stringify(ModelosContrato.porId(params.get('id')));
    const btn = tela.querySelector('[data-salvar]');
    btn.disabled = !alterado;
    let aviso = btn.previousElementSibling?.matches('span') ? btn.previousElementSibling : null;
    if (alterado && !aviso) btn.insertAdjacentHTML('beforebegin', '<span class="text-xs text-amber-700 dark:text-amber-300">Alterações não salvas</span>');
    if (!alterado && aviso) aviso.remove();
  }

  function renderPrevia() {
    const m = estado.rascunho;
    const vendas = Contratos.carregar().filter((c) => c.status !== 'cancelado');
    const c = vendas.find((v) => v.id === estado.vendaId) ?? vendas.find((v) => ModelosContrato.daVenda(v)?.id === m.id) ?? vendas[0];
    if (!c) { document.getElementById('conteudo-aba').innerHTML = `<p class="${APOIO}">Nenhuma venda para pré-visualizar.</p>`; return; }
    estado.vendaId = c.id;
    const dados = ModelosContrato.dadosDaVenda(c, ctx());
    const faltam = ModelosContrato.faltando(m.texto, dados);
    const rotulo = Object.fromEntries(CAMPOS_CONTRATO.flatMap((g) => g.campos));
    const contratante = (v) => Contratos.responsavelFinanceiro(ctx(), v).nome;
    document.getElementById('conteudo-aba').innerHTML = `
      <div class="mb-4 flex flex-wrap items-end gap-3">
        <div><label for="venda" class="${ROTULO}">Venda usada na pré-visualização</label>
          <select id="venda" class="${CAMPO} h-9 w-96">${vendas.map((v) => `<option value="${esc(v.id)}" ${v.id === c.id ? 'selected' : ''}>${esc(v.codigo)} · ${esc(contratante(v))}</option>`).join('')}</select></div>
        <a href="contrato.html?id=${encodeURIComponent(c.id)}&aba=documentos" class="h-9 inline-flex items-center text-sm font-medium text-petrol-800 dark:text-sky-300 hover:underline">Abrir a venda</a>
      </div>
      ${faltam.length ? `<p role="status" class="mb-4 rounded-lg bg-amber-50 dark:bg-amber-950 px-3 py-2 text-sm text-amber-700 dark:text-amber-300"><span class="font-medium">Faltam dados nesta venda:</span> ${esc(faltam.map((f) => rotulo[f] ?? f).join(', '))}. No contrato, esses campos saem marcados até a venda ser completada.</p>` : ''}
      <article class="${CARTAO} max-w-3xl p-8 font-registro text-[15px] leading-7 text-slate-800 dark:text-neutral-200 space-y-4">${ModelosContrato.preencherHtml(m.texto, dados, esc)}</article>`;
    document.getElementById('venda').addEventListener('change', (e) => { estado.vendaId = e.target.value; renderPrevia(); });
  }

  function salvar() {
    const r = ModelosContrato.salvar(estado.rascunho);
    estado.erros = r.erros ?? {};
    if (r.erros) {
      estado.aba = 'texto';
      renderFicha();
      document.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    estado.rascunho = JSON.parse(JSON.stringify(r.modelo));
    renderFicha();
    toast('Modelo salvo.');
  }

  function acaoMais(acao, salvo) {
    if (acao === 'duplicar') {
      let nome = `${salvo.nome} (cópia)`;
      for (let n = 2; ModelosContrato.carregar().some((m) => m.nome === nome); n++) nome = `${salvo.nome} (cópia ${n})`;
      const r = ModelosContrato.salvar({ ...salvo, id: null, nome, padrao: false });
      location.href = `modelo-contrato.html?id=${encodeURIComponent(r.modelo.id)}`;
    } else if (acao === 'padrao' || acao === 'status') {
      const mudanca = acao === 'padrao' ? { padrao: true, status: 'ativo' } : { status: salvo.status === 'inativo' ? 'ativo' : 'inativo' };
      const r = ModelosContrato.salvar({ ...salvo, ...mudanca });
      estado.rascunho = { ...estado.rascunho, ...mudanca };
      renderFicha();
      toast(acao === 'padrao' ? `${r.modelo.nome} é o novo modelo padrão.` : `Modelo ${r.modelo.status === 'inativo' ? 'inativado' : 'reativado'}.`);
    } else if (acao === 'excluir') {
      const d = dialogo({
        titulo: 'Excluir este modelo?',
        contexto: `${esc(salvo.nome)} deixa de existir. As vendas já assinadas guardam o texto delas.`,
        corpo: '',
        acoes: `<button value="cancelar" class="${BOTAO_SEC}">Cancelar</button><button value="excluir" data-excluir class="${BOTAO_PERIGO}">Excluir</button>`,
      });
      d.querySelector('[data-excluir]').addEventListener('click', () => { ModelosContrato.remover(salvo.id); location.href = 'modelos-contrato.html'; });
    }
  }

  window.addEventListener('beforeunload', (e) => {
    if (DETALHE && estado.rascunho && JSON.stringify(estado.rascunho) !== JSON.stringify(ModelosContrato.porId(params.get('id')))) e.preventDefault();
  });

  (DETALHE ? renderFicha : renderLista)();
})();
