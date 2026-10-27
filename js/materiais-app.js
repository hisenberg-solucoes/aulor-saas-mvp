// ============================================================
// Materiais das aulas pela coordenação (materiais.html, tela nova da V1): tudo
// o que professores e coordenação cadastraram, por turma e aula, com a
// situação de cada material (o aluno vê no portal só o liberado). A
// coordenação também cadastra, edita, libera e remove. ?turma= abre filtrado
// (link do cartão de aulas da turma). Regras em js/materiais-motor.js.
// ============================================================

(function () {
  const params = new URLSearchParams(location.search);
  const tela = document.getElementById('tela');
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtData = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '');
  const dm = (iso) => fmtData(iso).slice(0, 5);

  const CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)]';
  const TITULO_CARTAO = 'text-[15px] leading-[22px] font-semibold text-slate-900 dark:text-neutral-100';
  const APOIO = 'text-xs text-slate-500 dark:text-neutral-400';
  const ROTULO = 'block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1';
  const CAMPO = 'w-full h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 text-sm text-slate-900 dark:text-neutral-100 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400 focus:ring-2 focus:ring-petrol-800/20 aria-[invalid=true]:border-red-500';
  const FILTRO = CAMPO.replace('w-full ', '');
  const BOTAO_PRI = 'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800 text-white shadow-sm transition';
  const BOTAO_SEC = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition';
  const BOTAO_FANTASMA = 'inline-flex items-center h-9 px-2.5 rounded-md text-sm font-medium text-slate-500 dark:text-neutral-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-neutral-900 transition';
  const ICONE_ERRO = '<svg class="h-3.5 w-3.5 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>';
  const TOM = {
    liberado: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', liberadoPonto: 'bg-emerald-600 dark:bg-emerald-400',
    programado: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300', programadoPonto: 'bg-amber-500',
    bloqueado: 'bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-300', bloqueadoPonto: 'bg-slate-500 dark:bg-neutral-400',
  };
  function pilula(m) {
    const s = Materiais.situacao(m);
    const txt = s === 'programado' ? `Libera em ${dm(m.liberarEm)}` : Materiais.SITUACOES[s].nome;
    return `<span class="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ${TOM[s]}" title="${esc(Materiais.SITUACOES[s].descricao)}"><span class="h-1.5 w-1.5 rounded-full ${TOM[`${s}Ponto`]}" aria-hidden="true"></span>${esc(txt)}</span>`;
  }

  const estado = { turma: params.get('turma') ?? '', situacao: '', busca: '' };
  const sessao = () => Sessao.atual() ?? { nome: 'Ana Souza' };
  const turmasAtivas = () => Turmas.carregar().filter((t) => t.status !== 'cancelada').sort((a, b) => a.codigo.localeCompare(b.codigo, 'pt-BR'));
  const cursoDe = (t) => Cursos.carregar().find((c) => c.id === t.cursoId);

  // As aulas da turma: as agendadas; ainda só na prévia da agenda, gera e grava antes de cadastrar material.
  function aulasDa(turmaId, gravar = false) {
    let lista = Turmas.carregar();
    let t = Turmas.porId(lista, turmaId);
    if (!t) return [];
    if (!Turmas.temAgendamento(t) && gravar) {
      const agenda = Turmas.agendaDe(t);
      if (!agenda) return [];
      lista = Turmas.salvarAulas(lista, t.id, Aulas.distribuirConteudo(Aulas.gerar(t, agenda), cursoDe(t)));
      Turmas.salvar(lista);
      t = Turmas.porId(lista, turmaId);
    }
    return Turmas.temAgendamento(t) ? Turmas.aulasAgendadas(t).filter((a) => a.status !== 'cancelada') : Turmas.aulas(t).map((a, i) => ({ ...a, n: i + 1 }));
  }

  function render() {
    const turmas = turmasAtivas();
    const porTurma = Object.fromEntries(turmas.map((t) => [t.id, t]));
    const todos = Materiais.carregar();
    const termo = estado.busca.trim().toLowerCase();
    const linhas = todos
      .filter((m) => (!estado.turma || m.turmaId === estado.turma) && (!estado.situacao || Materiais.situacao(m) === estado.situacao) && (!termo || m.titulo.toLowerCase().includes(termo)))
      .map((m) => {
        const t = porTurma[m.turmaId];
        const aula = t && Turmas.temAgendamento(t) ? Turmas.aulasAgendadas(t).find((a) => a.id === m.aulaId) : null;
        return { m, t, aula };
      })
      .sort((a, b) => (a.t?.codigo ?? '').localeCompare(b.t?.codigo ?? '') || (a.aula?.data ?? '').localeCompare(b.aula?.data ?? ''));
    const filtrando = estado.turma || estado.situacao || termo;

    tela.innerHTML = `
      <div class="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold tracking-tight text-slate-900 dark:text-neutral-100">Materiais das aulas <span class="text-slate-500 dark:text-neutral-400 font-normal tabular-nums">${todos.length}</span></h2>
          <p class="mt-0.5 text-sm text-slate-500 dark:text-neutral-400">O que professores e coordenação cadastraram para cada aula. O aluno vê no portal só o que está liberado, mesmo em aula futura.</p>
        </div>
        <button type="button" class="${BOTAO_PRI}" data-novo>Novo material</button>
      </div>
      <div class="mb-4 flex flex-wrap items-center gap-2">
        <input type="search" data-busca value="${esc(estado.busca)}" placeholder="Buscar pelo título" aria-label="Buscar pelo título" class="${FILTRO} w-64">
        <select data-filtro="turma" aria-label="Turma" class="${FILTRO} max-w-72"><option value="">Todas as turmas</option>${turmas.map((t) => `<option value="${esc(t.id)}" ${t.id === estado.turma ? 'selected' : ''}>${esc(t.codigo)} · ${esc(cursoDe(t)?.nome ?? '')}</option>`).join('')}</select>
        <select data-filtro="situacao" aria-label="Situação" class="${FILTRO}"><option value="">Todas as situações</option>${Object.entries(Materiais.SITUACOES).map(([id, s]) => `<option value="${id}" ${id === estado.situacao ? 'selected' : ''}>${s.nome}</option>`).join('')}</select>
      </div>
      <div class="${CARTAO} overflow-hidden">
        <table class="w-full table-fixed text-sm">
          <thead><tr class="text-left text-xs font-medium text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-800">
            <th class="px-4 py-2.5 w-[34%]">Material</th><th class="px-4 py-2.5">Turma e aula</th><th class="px-4 py-2.5 w-40">Situação</th><th class="px-4 py-2.5 w-52">Cadastrado por</th>
          </tr></thead>
          <tbody class="divide-y divide-slate-200 dark:divide-neutral-800">${linhas.map(({ m, t, aula }) => `
            <tr class="relative hover:bg-slate-50 dark:hover:bg-neutral-900">
              <td class="px-4 py-2.5"><button type="button" data-editar="${esc(m.id)}" class="block max-w-full truncate text-left font-medium text-slate-900 dark:text-neutral-100 hover:text-petrol-800 dark:hover:text-sky-300 after:absolute after:inset-0">${esc(m.titulo)}</button>
                <p class="${APOIO} truncate">${m.tipo === 'link' ? esc(m.url) : esc(m.arquivo)}</p></td>
              <td class="px-4 py-2.5"><p class="text-slate-800 dark:text-neutral-200">${esc(t?.codigo ?? '—')}</p><p class="${APOIO}">${aula ? `Aula ${aula.n ?? '—'} · ${dm(aula.data)} ${esc(aula.inicio ?? '')}` : 'aula não encontrada'}</p></td>
              <td class="px-4 py-2.5">${pilula(m)}</td>
              <td class="px-4 py-2.5"><p class="text-slate-800 dark:text-neutral-200 truncate">${esc(m.autor?.nome ?? '—')}</p><p class="${APOIO}">${m.autor?.papel === 'professor' ? 'Professor' : 'Coordenação'} · ${fmtData(m.criadoEm)}</p></td>
            </tr>`).join('')}
          </tbody>
        </table>
        ${linhas.length ? '' : `<p class="px-4 py-8 text-center text-sm text-slate-500 dark:text-neutral-400">${filtrando ? `Nenhum material com esses filtros. <button type="button" data-limpar class="font-medium text-petrol-800 dark:text-sky-300 hover:underline">Limpar filtros</button>` : 'Nenhum material cadastrado ainda. Os professores cadastram no Portal do Professor; a coordenação, aqui.'}</p>`}
      </div>`;

    tela.querySelector('[data-novo]').addEventListener('click', () => dialogo(null));
    tela.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => dialogo(Materiais.carregar().find((m) => m.id === b.dataset.editar))));
    tela.querySelectorAll('[data-filtro]').forEach((s) => s.addEventListener('change', () => {
      estado[s.dataset.filtro] = s.value;
      history.replaceState(null, '', estado.turma ? `?turma=${encodeURIComponent(estado.turma)}` : location.pathname);
      render();
    }));
    const busca = tela.querySelector('[data-busca]');
    busca.addEventListener('input', () => { estado.busca = busca.value; render(); const b = tela.querySelector('[data-busca]'); b.focus(); b.setSelectionRange(b.value.length, b.value.length); });
    tela.querySelector('[data-limpar]')?.addEventListener('click', () => { Object.assign(estado, { turma: '', situacao: '', busca: '' }); history.replaceState(null, '', location.pathname); render(); });
  }

  // Formulário longo (DESIGN.md, Diálogos): Esc e Cancelar fecham; o clique no véu não.
  function dialogo(m) {
    const turmas = turmasAtivas();
    const novo = !m;
    const v = m ?? { turmaId: estado.turma || turmas[0]?.id, aulaId: null, titulo: '', descricao: '', tipo: 'arquivo', arquivo: '', url: '', liberarEm: null };
    const modo = !v.liberarEm ? 'depois' : v.liberarEm <= Materiais.hojeISO() ? 'agora' : 'data';
    const d = document.createElement('dialog');
    d.setAttribute('closedby', 'closerequest');
    d.className = `${CARTAO} modal-anim p-5 max-w-[calc(100vw-48px)] backdrop:bg-[rgb(7_30_44/0.32)] dark:backdrop:bg-[rgb(2_11_17/0.6)] text-slate-800 dark:text-neutral-100`;
    d.style.width = '560px';
    const campo = (id, rotulo, html) => `<div><label for="${id}" class="${ROTULO}">${rotulo}</label>${html}<p id="${id}-erro" class="mt-1 hidden items-center gap-1 text-xs text-red-700 dark:text-red-400"></p></div>`;
    d.innerHTML = `
      <form novalidate>
        <h2 class="${TITULO_CARTAO}">${novo ? 'Novo material' : 'Editar material'}</h2>
        <p class="mt-0.5 ${APOIO}">${novo ? 'Fica na aula escolhida; o aluno vê quando estiver liberado.' : `Cadastrado por ${esc(m.autor?.nome ?? '—')} em ${fmtData(m.criadoEm)}.`}</p>
        <div class="mt-4 grid grid-cols-2 gap-4">
          ${campo('turmaId', 'Turma', `<select id="turmaId" class="${CAMPO}" aria-describedby="turmaId-erro">${turmas.map((t) => `<option value="${esc(t.id)}" ${t.id === v.turmaId ? 'selected' : ''}>${esc(t.codigo)}</option>`).join('')}</select>`)}
          ${campo('aulaId', 'Aula', `<select id="aulaId" class="${CAMPO}" aria-describedby="aulaId-erro"></select>`)}
          <div class="col-span-2">${campo('titulo', 'Título', `<input id="titulo" class="${CAMPO}" value="${esc(v.titulo)}" aria-describedby="titulo-erro">`)}</div>
          <fieldset class="col-span-2"><legend class="${ROTULO}">Tipo</legend><div class="flex gap-4 text-sm">${Materiais.TIPOS.map((t) => `<label class="flex items-center gap-2"><input type="radio" name="tipo" value="${t.id}" ${t.id === v.tipo ? 'checked' : ''} class="h-4 w-4 accent-[var(--f-marca-tinta)]">${t.nome}</label>`).join('')}</div></fieldset>
          <div class="col-span-2" data-so="arquivo">${campo('arquivo', 'Arquivo', `<input id="arquivo" type="file" class="block w-full text-sm text-slate-600 dark:text-neutral-300 file:mr-3 file:h-9 file:rounded-lg file:border file:border-slate-300 dark:file:border-neutral-700 file:bg-white dark:file:bg-neutral-950 file:px-3 file:text-sm file:font-medium" aria-describedby="arquivo-erro">${v.arquivo ? `<p class="${APOIO} mt-1">Atual: ${esc(v.arquivo)}</p>` : ''}`)}</div>
          <div class="col-span-2" data-so="link">${campo('url', 'Link', `<input id="url" type="url" class="${CAMPO}" value="${esc(v.url)}" placeholder="https://" aria-describedby="url-erro">`)}</div>
          <div class="col-span-2">${campo('descricao', 'Descrição <span class="font-normal">(opcional)</span>', `<textarea id="descricao" rows="2" class="${CAMPO} h-auto py-2 resize-y">${esc(v.descricao)}</textarea>`)}</div>
          <fieldset class="col-span-2"><legend class="${ROTULO}">Quando liberar para o aluno</legend>
            <div class="space-y-1.5 text-sm">
              <label class="flex items-center gap-2"><input type="radio" name="quando" value="agora" ${modo === 'agora' ? 'checked' : ''} class="h-4 w-4 accent-[var(--f-marca-tinta)]">Agora</label>
              <label class="flex items-center gap-2"><input type="radio" name="quando" value="data" ${modo === 'data' ? 'checked' : ''} class="h-4 w-4 accent-[var(--f-marca-tinta)]">Em uma data <input id="liberarEm" type="date" value="${modo === 'data' ? esc(v.liberarEm) : ''}" class="${CAMPO} w-40 ml-1" aria-describedby="liberarEm-erro"></label>
              <label class="flex items-center gap-2"><input type="radio" name="quando" value="depois" ${modo === 'depois' ? 'checked' : ''} class="h-4 w-4 accent-[var(--f-marca-tinta)]">Depois (não liberar ainda)</label>
              <p id="liberarEm-erro" class="hidden items-center gap-1 text-xs text-red-700 dark:text-red-400"></p>
            </div>
          </fieldset>
        </div>
        <div class="mt-5 flex items-center gap-2">
          ${novo ? '' : `<button type="button" data-remover class="${BOTAO_FANTASMA}">Remover</button>`}
          <span class="flex-1"></span>
          <button type="button" data-cancelar class="${BOTAO_SEC}">Cancelar</button>
          <button type="submit" class="${BOTAO_PRI}">${novo ? 'Cadastrar' : 'Salvar'}</button>
        </div>
      </form>`;
    document.body.append(d);
    d.addEventListener('close', () => d.remove());
    const $ = (s) => d.querySelector(s);

    const preencherAulas = () => {
      const aulas = aulasDa($('#turmaId').value);
      const hoje = Materiais.hojeISO();
      $('#aulaId').innerHTML = aulas.length ? aulas.map((a) => `<option value="${esc(a.id ?? `n${a.n}`)}" ${a.id === v.aulaId ? 'selected' : ''}>Aula ${a.n} · ${dm(a.data)} ${esc(a.inicio ?? '')}${a.data > hoje ? ' (futura)' : ''}</option>`).join('') : '<option value="">Turma sem aulas</option>';
    };
    const tipo = () => d.querySelector('[name="tipo"]:checked').value;
    const mostrarTipo = () => d.querySelectorAll('[data-so]').forEach((el) => { el.hidden = el.dataset.so !== tipo(); });
    preencherAulas(); mostrarTipo();
    $('#turmaId').addEventListener('change', () => { v.aulaId = null; preencherAulas(); });
    d.querySelectorAll('[name="tipo"]').forEach((r) => r.addEventListener('change', mostrarTipo));
    $('#liberarEm').addEventListener('focus', () => { d.querySelector('[name="quando"][value="data"]').checked = true; });
    $('[data-cancelar]').addEventListener('click', () => d.close());

    $('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const quando = d.querySelector('[name="quando"]:checked').value;
      const erroData = quando === 'data' && !$('#liberarEm').value ? 'Escolha a data.' : '';
      // A aula da prévia vira aula agendada ao gravar o material (a posição na lista é a mesma).
      let aulaId = $('#aulaId').value;
      if (aulaId.startsWith('n')) aulaId = aulasDa($('#turmaId').value, true)[Number(aulaId.slice(1)) - 1]?.id ?? '';
      const dados = {
        ...v, turmaId: $('#turmaId').value, aulaId: aulaId ? Number(aulaId) || aulaId : null, titulo: $('#titulo').value, descricao: $('#descricao').value, tipo: tipo(),
        arquivo: $('#arquivo').files[0]?.name ?? v.arquivo, url: $('#url').value,
        liberarEm: quando === 'agora' ? (m && modo === 'agora' ? m.liberarEm : Materiais.hojeISO()) : quando === 'data' ? $('#liberarEm').value : null,
        autor: m?.autor ?? { nome: sessao().nome, papel: 'coordenacao' },
      };
      const erros = { ...(erroData ? { liberarEm: erroData } : {}), ...(Materiais.validar(dados)) };
      ['aulaId', 'titulo', 'arquivo', 'url', 'liberarEm'].forEach((id) => {
        const p = $(`#${id}-erro`);
        p.innerHTML = erros[id] ? `${ICONE_ERRO}<span>${esc(erros[id])}</span>` : '';
        p.classList.toggle('hidden', !erros[id]); p.classList.toggle('flex', !!erros[id]);
        $(`#${id}`)?.setAttribute('aria-invalid', erros[id] ? 'true' : 'false');
      });
      if (Object.keys(erros).length) return d.querySelector('[aria-invalid="true"]')?.focus();
      Materiais.salvar(dados);
      d.close();
      render();
    });

    $('[data-remover]')?.addEventListener('click', () => {
      if (!confirm(`Remover "${m.titulo}"? O aluno deixa de ver este material.`)) return;
      Materiais.remover(m.id);
      d.close();
      render();
    });
    d.showModal();
    $('#titulo').focus();
  }

  render();
})();
