// ============================================================
// Formulário de turma compartilhado entre turmas.html (criar/editar) e
// formacoes.html (criar a partir da linha do curso). Só monta o corpo do
// drawer e liga os comportamentos dinâmicos; quem abre o drawer, valida e
// salva é a tela (cada app tem o próprio `drawerFormulario`).
// Depende de: esc (avaliacoes-ui), Agenda, Turmas, Cursos, INSTRUTORES,
// STATUS_TURMA e, opcionalmente, Salas/Formacoes. Turma de formação herda a
// agenda da formação; avulsa define a própria (editor de Agenda).
// ============================================================

const TurmaForm = (() => {
  const OPCAO = 'cursor-pointer rounded-lg border p-3 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 border-slate-300 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500 transition';
  const OPCIONAL = '<span class="normal-case font-normal tracking-normal text-slate-400">(opcional)</span>';
  const ERRO = (campo) => `<p data-erro="${campo}" class="text-xs text-red-600 dark:text-red-400 mt-1 hidden"></p>`;
  const LUPA = '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>';

  const texto = (name, rotulo, valor, { tipo = 'text', placeholder = '', max = '', extra = '', opcional = false, sufixo = '' } = {}) => `
    <div>
      <label class="rotulo" for="tf-${name}">${rotulo} ${opcional ? OPCIONAL : ''}</label>
      <div class="relative">
        <input id="tf-${name}" name="${name}" type="${tipo}" ${max ? `maxlength="${max}"` : ''} ${extra} class="campo ${sufixo ? 'pr-16' : ''}" placeholder="${esc(placeholder)}" value="${esc(valor ?? '')}">
        ${sufixo ? `<span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">${sufixo}</span>` : ''}
      </div>
      ${ERRO(name)}
    </div>`;

  const cartoes = (name, opcoes, valor, colunas = 'grid-cols-2', rotuloDe = (o) => o.nome, detalheDe = (o) => o.descricao) => `
    <div class="grid ${colunas} gap-2">
      ${opcoes.map((o) => `
      <label class="${OPCAO}">
        <input type="radio" name="${name}" value="${o.id}" class="sr-only" ${valor === o.id ? 'checked' : ''}>
        <p class="text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(rotuloDe(o))}</p>
        ${detalheDe(o) ? `<p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(detalheDe(o))}</p>` : ''}
      </label>`).join('')}
    </div>`;

  const descreverFormacao = (f) => (f?.agenda?.periodos?.length ? `${Agenda.descrever(f.agenda)} · ${Agenda.FORMATOS_AULA.find((x) => x.id === f.agenda.formato)?.nome ?? ''}` : 'Formação sem agenda definida — defina em Dados gerais da formação.');

  const linhaCurso = (c) => `<span class="font-mono text-xs text-slate-400 mr-1.5">${esc(c.codigo)}</span>${esc(c.nome)} <span class="text-xs text-slate-400">· ${Number(c.cargaHoraria).toLocaleString('pt-BR')} h</span>`;

  // Formações (ativas, ou a já escolhida) que contêm o curso.
  function formacoesDoCurso(ctx, cursoId, atualId = null) {
    return (ctx.formacoes ?? [])
      .filter((f) => f.itens.some((i) => i.cursoId === cursoId) && (f.status === 'ativo' || f.id === atualId))
      .sort((a, b) => a.codigo.localeCompare(b.codigo, 'pt-BR'));
  }

  function opcoesFormacao(ctx, cursoId, valor) {
    const fs = cursoId ? formacoesDoCurso(ctx, cursoId, valor) : [];
    return `<option value="" ${!valor ? 'selected' : ''}>Avulsa — turma aberta ou in company</option>${fs.map((f) => `<option value="${f.id}" ${f.id === valor ? 'selected' : ''}>${esc(f.codigo)} · ${esc(f.nome)}${f.status !== 'ativo' ? ' (não ativa)' : ''}</option>`).join('')}`;
  }

  function opcoesInstrutor(ctx, cursoId, valor) {
    const curso = cursoId ? Cursos.porId(ctx.cursos, cursoId) : null;
    const ordenar = (xs) => [...xs].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    const habilitados = ordenar(INSTRUTORES.filter((i) => curso?.instrutorIds.includes(i.id)));
    const outros = ordenar(INSTRUTORES.filter((i) => !habilitados.includes(i)));
    const opt = (i) => `<option value="${i.id}" ${i.id === valor ? 'selected' : ''}>${esc(i.nome)} — ${esc(i.especialidade)}</option>`;
    return `<option value="" ${!valor ? 'selected' : ''}>A definir</option>
      ${habilitados.length ? `<optgroup label="Habilitados no curso">${habilitados.map(opt).join('')}</optgroup>` : ''}
      ${outros.length ? `<optgroup label="${habilitados.length ? 'Outros instrutores' : 'Instrutores'}">${outros.map(opt).join('')}</optgroup>` : ''}`;
  }

  // Template de certificado da turma avulsa (js/templates-certificado-*). Vazio = herda do curso (ou o padrão).
  function opcoesTemplate(ctx, valor) {
    if (typeof TemplatesCertificado === 'undefined') return null;
    const lista = TemplatesCertificado.lista();
    const ativos = TemplatesCertificado.ativosPara(lista, 'curso');
    const atual = valor && !ativos.some((t) => t.id === valor) ? TemplatesCertificado.porId(lista, valor) : null;
    const opt = (t, extra = '') => `<option value="${t.id}" ${t.id === valor ? 'selected' : ''}>${esc(t.nome)}${t.padrao ? ' — padrão de curso' : ''}${extra}</option>`;
    return `<option value="" ${valor ? '' : 'selected'}>Padrão (herdado do curso)</option>${ativos.map((t) => opt(t)).join('')}${atual ? opt(atual, ` — ${TemplatesCertificado.statusDe(atual.status).nome.toLowerCase()}, não emite`) : ''}`;
  }

  function opcoesSala(ctx, valor) {
    const salas = (ctx.salas ?? []).filter((s) => s.status !== 'inativa' || s.id === valor).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    const opt = (s) => `<option value="${s.id}" data-capacidade="${s.capacidade?.alunos ?? ''}" ${s.id === valor ? 'selected' : ''}>${esc(s.nome)}${s.capacidade?.alunos ? ` · ${s.capacidade.alunos} lugares` : ''}${s.status === 'manutencao' ? ' · em manutenção' : s.status === 'inativa' ? ' · inativa' : ''}</option>`;
    const fisicas = salas.filter((s) => s.tipo !== 'virtual');
    const virtuais = salas.filter((s) => s.tipo === 'virtual');
    return `<option value="" ${!valor ? 'selected' : ''}>A definir</option>
      ${fisicas.length ? `<optgroup label="Físicas">${fisicas.map(opt).join('')}</optgroup>` : ''}
      ${virtuais.length ? `<optgroup label="Virtuais">${virtuais.map(opt).join('')}</optgroup>` : ''}`;
  }

  // ctx = { lista, cursos, formacoes, salas }; d = dados iniciais; opts = { cursoFixo, formacaoFixa, editando }.
  function corpo(ctx, d, { cursoFixo = false, formacaoFixa = false, editando = false } = {}) {
    const curso = d.cursoId ? Cursos.porId(ctx.cursos, d.cursoId) : null;
    const formacao = d.formacaoId && ctx.formacoes ? ctx.formacoes.find((f) => f.id === d.formacaoId) : null;
    const blocoCurso = cursoFixo && curso
      ? `<div>
           <p class="rotulo">Curso</p>
           <p class="text-sm text-slate-800 dark:text-neutral-100">${linhaCurso(curso)}</p>
           <input type="hidden" name="cursoId" value="${esc(curso.id)}">
         </div>`
      : `<div>
           <label class="rotulo" for="tf-busca-curso">Curso</label>
           <div class="relative mb-2">
             <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">${LUPA}</span>
             <input type="search" id="tf-busca-curso" class="campo pl-8" placeholder="Buscar curso por código ou nome" autocomplete="off">
           </div>
           <div id="tf-lista-curso" class="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-neutral-800 divide-y divide-slate-100 dark:divide-neutral-900"></div>
           ${ERRO('cursoId')}
         </div>`;
    const blocoFormacao = formacaoFixa && formacao
      ? `<div>
           <p class="rotulo">Formação</p>
           <p class="text-sm text-slate-800 dark:text-neutral-100"><span class="font-mono text-xs text-slate-400 mr-1.5">${esc(formacao.codigo)}</span>${esc(formacao.nome)}</p>
           <input type="hidden" name="formacaoId" value="${esc(formacao.id)}">
         </div>`
      : `<div>
           <label class="rotulo" for="tf-formacaoId">Formação ${OPCIONAL}</label>
           <select id="tf-formacaoId" name="formacaoId" class="campo">${opcoesFormacao(ctx, d.cursoId, d.formacaoId)}</select>
           ${ERRO('formacaoId')}
         </div>
         <fieldset id="tf-bloco-tipo" class="${d.formacaoId ? 'hidden' : ''}">
           <legend class="rotulo">Tipo da turma avulsa</legend>
           ${cartoes('tipo', [{ id: 'aberta', nome: 'Turma aberta', descricao: 'Vendida por vaga, no calendário da ProWay.' }, { id: 'incompany', nome: 'In company', descricao: 'Fechada para uma empresa, por proposta.' }], d.tipo === 'incompany' ? 'incompany' : 'aberta')}
         </fieldset>`;

    const opcoesTpl = opcoesTemplate(ctx, d.certificado?.templateId ?? null);
    const blocoTemplate = opcoesTpl === null ? '' : `
      <div id="tf-bloco-template" class="${d.formacaoId ? 'hidden' : ''}">
        <label class="rotulo" for="tf-templateId">Modelo de certificado <span class="normal-case font-normal tracking-normal text-slate-400">(turma avulsa)</span></label>
        <select id="tf-templateId" name="templateId" class="campo">${opcoesTpl}</select>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-1">Frente e verso do certificado desta turma. Vazio = o modelo definido no curso (ou o padrão). Turma de formação usa o certificado da formação.</p>
        ${ERRO('templateId')}
      </div>`;

    return `
      ${blocoCurso}
      ${blocoFormacao}
      ${blocoTemplate}
      ${texto('codigo', 'Código da turma', d.codigo, { max: 20, placeholder: 'Ex.: HT5 N', extra: 'autocapitalize="characters"' })}
      <div id="tf-agenda-formacao" class="${d.formacaoId ? '' : 'hidden'} rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 px-3 py-2">
        <p class="rotulo mb-0.5">Agenda das aulas <span class="normal-case font-normal tracking-normal text-slate-400">(herdada da formação)</span></p>
        <p data-agenda-formacao-texto class="text-sm text-slate-800 dark:text-neutral-100">${esc(formacao ? descreverFormacao(formacao) : '')}</p>
      </div>
      <div id="tf-bloco-agenda" class="${d.formacaoId ? 'hidden' : ''} space-y-5">
        ${Agenda.corpo(d.agenda ?? Agenda.vazia())}
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${texto('inicio', 'Início', d.inicio, { tipo: 'date' })}
        ${texto('fim', 'Fim', d.fim, { tipo: 'date' })}
      </div>
      <div>
        <label class="rotulo" for="tf-instrutorId">Instrutor ${OPCIONAL}</label>
        <select id="tf-instrutorId" name="instrutorId" class="campo">${opcoesInstrutor(ctx, d.cursoId, d.instrutorId)}</select>
        ${ERRO('instrutorId')}
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div class="col-span-2">
          <label class="rotulo" for="tf-salaId">Sala ${OPCIONAL}</label>
          <select id="tf-salaId" name="salaId" class="campo">${opcoesSala(ctx, d.salaId)}</select>
          ${ERRO('salaId')}
        </div>
        ${texto('vagas', 'Vagas', d.vagas, { tipo: 'number', extra: 'min="1" step="1"' })}
      </div>
      ${texto('meetLink', 'Link do Google Meet', d.meetLink, { tipo: 'url', max: 200, opcional: true, placeholder: 'https://meet.google.com/abc-defg-hij', extra: 'autocomplete="off" spellcheck="false"' })}
      <p class="-mt-4 text-xs text-slate-500 dark:text-neutral-400">Sala de reunião fixa da turma — o instrutor e os alunos online entram por aqui. As gravações ficam na aba Gravações da turma.</p>
      <div>
        <label class="rotulo" for="tf-observacoes">Observações ${OPCIONAL}</label>
        <textarea id="tf-observacoes" name="observacoes" rows="2" maxlength="500" class="campo resize-y" placeholder="Combinados com o instrutor, restrições de sala, etc.">${esc(d.observacoes ?? '')}</textarea>
      </div>
      ${editando ? `
      <fieldset>
        <legend class="rotulo">Status</legend>
        ${cartoes('status', STATUS_TURMA.filter((s) => s.id !== 'cancelada' && s.id !== 'concluida'), d.status)}
        ${ERRO('status')}
      </fieldset>` : ''}`;
  }

  // Comportamentos: busca de curso, formações/instrutores por curso, sugestão de código, vagas pela sala.
  function ligar(form, ctx, d, { cursoFixo = false, formacaoFixa = false, idAtual = null } = {}) {
    const campo = (name) => form.querySelector(`[name="${name}"]`);
    const cursoAtual = () => campo('cursoId')?.value || '';
    const formacaoAtual = () => campo('formacaoId')?.value || '';
    const formacaoObj = () => (ctx.formacoes ?? []).find((f) => f.id === formacaoAtual()) ?? null;
    const agendaAtual = () => (formacaoAtual() ? formacaoObj()?.agenda ?? null : Agenda.ler(form));
    let codigoTocado = Boolean(d.codigo);
    let vagasTocadas = Boolean(d.vagas);

    const sugerirCodigo = () => {
      if (codigoTocado) return;
      const curso = Cursos.porId(ctx.cursos, cursoAtual());
      campo('codigo').value = Turmas.sugerirCodigo(ctx.lista, curso, agendaAtual(), formacaoAtual() || null, idAtual);
    };
    campo('codigo').addEventListener('input', () => { codigoTocado = campo('codigo').value.trim() !== ''; });
    Agenda.ligar(form, () => { if (!formacaoAtual()) sugerirCodigo(); });

    const aoMudarFormacao = () => {
      const temFormacao = Boolean(formacaoAtual());
      form.querySelector('#tf-bloco-tipo')?.classList.toggle('hidden', temFormacao);
      form.querySelector('#tf-bloco-template')?.classList.toggle('hidden', temFormacao);
      form.querySelector('#tf-bloco-agenda').classList.toggle('hidden', temFormacao);
      form.querySelector('#tf-agenda-formacao').classList.toggle('hidden', !temFormacao);
      const txt = form.querySelector('[data-agenda-formacao-texto]');
      if (txt && temFormacao) txt.textContent = descreverFormacao(formacaoObj());
      sugerirCodigo();
    };
    if (!formacaoFixa) campo('formacaoId').addEventListener('change', aoMudarFormacao);

    const aoMudarCurso = () => {
      const cursoId = cursoAtual();
      const inst = campo('instrutorId');
      inst.innerHTML = opcoesInstrutor(ctx, cursoId, inst.value);
      if (!formacaoFixa) {
        const sel = campo('formacaoId');
        sel.innerHTML = opcoesFormacao(ctx, cursoId, sel.value);
        aoMudarFormacao();
      } else {
        sugerirCodigo();
      }
    };

    if (!cursoFixo) {
      const busca = form.querySelector('#tf-busca-curso');
      const lista = form.querySelector('#tf-lista-curso');
      const candidatos = ctx.cursos.filter((c) => c.status !== 'inativo' || c.id === d.cursoId).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      let escolhido = d.cursoId || '';
      const render = () => {
        const termo = Turmas.normalizar(busca.value);
        const visiveis = candidatos.filter((c) => !termo || Turmas.normalizar(`${c.codigo} ${c.nome}`).includes(termo));
        lista.innerHTML = visiveis.length ? visiveis.map((c) => `
          <label class="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900 ${c.id === escolhido ? 'bg-petrol-800/5 dark:bg-sky-950/40' : ''}">
            <input type="radio" name="cursoId" value="${c.id}" class="sr-only" ${c.id === escolhido ? 'checked' : ''}>
            <span class="h-2 w-2 rounded-full shrink-0 ${c.id === escolhido ? 'bg-petrol-800 dark:bg-sky-400' : 'bg-slate-300 dark:bg-neutral-700'}"></span>
            <span class="min-w-0 flex-1 text-sm text-slate-800 dark:text-neutral-100 truncate">${linhaCurso(c)}${c.status !== 'ativo' ? ` <span class="text-xs text-amber-600 dark:text-amber-400">· ${c.status}</span>` : ''}</span>
          </label>`).join('') : '<p class="px-3 py-3 text-sm text-slate-500 dark:text-neutral-400">Nenhum curso encontrado.</p>';
        lista.querySelectorAll('[name="cursoId"]').forEach((r) => r.addEventListener('change', () => { escolhido = r.value; render(); aoMudarCurso(); }));
      };
      busca.addEventListener('input', render);
      render();
    }

    campo('salaId').addEventListener('change', () => {
      const cap = campo('salaId').selectedOptions[0]?.dataset.capacidade;
      if (cap && (!vagasTocadas || !campo('vagas').value)) campo('vagas').value = cap;
    });
    campo('vagas').addEventListener('input', () => { vagasTocadas = campo('vagas').value.trim() !== ''; });

    if (!d.codigo) sugerirCodigo();
  }

  function ler(fd, form) {
    return {
      cursoId: fd.get('cursoId') ?? '',
      formacaoId: fd.get('formacaoId') || null,
      tipo: fd.get('tipo') ?? 'aberta',
      codigo: fd.get('codigo') ?? '',
      agenda: fd.get('formacaoId') ? null : Agenda.ler(form),
      inicio: fd.get('inicio') ?? '',
      fim: fd.get('fim') ?? '',
      instrutorId: fd.get('instrutorId') || null,
      salaId: fd.get('salaId') || null,
      vagas: fd.get('vagas'),
      observacoes: fd.get('observacoes') ?? '',
      meetLink: fd.get('meetLink') ?? '',
      ...(fd.has('templateId') ? { templateId: fd.get('formacaoId') ? null : (fd.get('templateId') || null) } : {}),
      ...(fd.has('status') ? { status: fd.get('status') } : {}),
    };
  }

  return { corpo, ligar, ler, formacoesDoCurso };
})();
