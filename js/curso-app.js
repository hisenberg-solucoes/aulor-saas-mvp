// ============================================================
// Curso em abas: Dados gerais, Conteúdo programático (módulos) e
// Turmas. Aba na URL: ?aba=.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const id = parametroUrl('id');

  function dado(rotulo, valor, classe = '') {
    return `<div class="${classe}"><dt class="text-xs font-medium text-tinta-2">${rotulo}</dt><dd class="text-sm text-tinta mt-1 break-words">${valor || '<span class="text-tinta-3">—</span>'}</dd></div>`;
  }

  // Bloco do painel único: título e explicação numa coluna fixa, campos ao lado,
  // para todos os blocos alinharem pela mesma grade.
  const bloco = (titulo, descricao, corpo, acao = '') => `
    <div class="grid md:grid-cols-[13rem_1fr] gap-x-8 gap-y-3 px-5 py-5">
      <div><h3 class="font-display font-semibold text-sm text-tinta">${titulo}</h3><p class="text-xs text-tinta-2 mt-0.5">${descricao}</p>${acao}</div>
      ${corpo}
    </div>`;
  const campos = (html) => `<dl class="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">${html}</dl>`;

  function abaDados(c, modalidade) {
    const cfg = Aulor.config();
    const modelo = Aulor.modeloDoCurso(c);
    return `
      <section class="painel divide-y divide-linha">
        ${bloco('Identificação', 'Como o curso aparece no catálogo e no certificado.', campos(`
          ${dado('Nome', esc(c.nome), 'col-span-2')}
          ${dado('Código', `<span class="font-mono">${esc(c.codigo)}</span>`)}
          ${dado('Área', esc(c.area))}
          ${dado('Modalidade', modalidade)}
          ${dado('Carga horária', `<span class="tabular-nums">${c.cargaHoraria} h</span>`)}`))}
        ${bloco('Descrição', 'O que o aluno aprende no curso.', c.descricao ? `<p class="text-sm text-tinta whitespace-pre-line max-w-prose">${esc(c.descricao)}</p>` : '<p class="text-sm text-tinta-3">Sem descrição.</p>')}
        ${bloco('Valores', 'Referência para a matrícula; o desconto é dado caso a caso.', campos(`
          ${dado('Valor de referência', `<span class="tabular-nums">${moeda(c.valor)}</span>`)}
          ${dado('Parcelamento sugerido', `<span class="tabular-nums">até ${c.parcelasSugeridas}× de ${moeda(c.valor / c.parcelasSugeridas)}</span>`)}`))}
      </section>
      <section class="painel mt-5">
        ${bloco('Certificado', 'O modelo é escolhido em Editar; as regras de emissão são da escola.', campos(`
          ${dado('Modelo', `${Shell.pode('configuracoes') ? `<a href="modelo-certificado.html?id=${modelo.id}" class="link">${esc(modelo.nome)}</a>` : esc(modelo.nome)}${c.modeloCertificadoId === modelo.id ? '' : `<span class="block text-xs text-tinta-2">${c.modeloCertificadoId ? 'Padrão da escola: o modelo escolhido não está ativo' : 'Padrão da escola'}</span>`}`)}
          ${dado('Frequência mínima', `<span class="tabular-nums">${cfg.academico.frequenciaMinima}%</span>`)}
          ${dado('Aprovação', 'Só frequência')}
          ${dado('Com parcela vencida', cfg.financeiro.bloquearCertificadoInadimplente ? 'Bloqueia a emissão' : 'Emite normalmente')}
          ${dado('Verso', modelo.verso.mostrar && c.modulos.length ? `Lista os ${c.modulos.length} módulos` : 'Sem verso')}`))}
      </section>`;
  }

  function abaConteudo(c, editar) {
    if (!c.modulos.length) return `<section class="painel">${vazio('Curso sem módulos', 'O certificado mostra só o curso e a carga horária.', editar ? `<button type="button" data-editar class="btn-sec">${ICONE.editar}Cadastrar módulos</button>` : '')}</section>`;
    const soma = c.modulos.reduce((s, m) => s + m.cargaHoraria, 0);
    const bate = Math.abs(soma - c.cargaHoraria) < 0.01;
    const ultimo = c.modulos.length - 1;
    const seta = (i, dir, desab) => `<button type="button" data-mover="${dir}" data-i="${i}" ${desab ? 'disabled' : ''} aria-label="Mover ${esc(c.modulos[i].nome)} para ${dir === 'cima' ? 'cima' : 'baixo'}" class="h-6 w-6 grid place-items-center rounded-md text-tinta-3 hover:text-tinta hover:bg-realce disabled:opacity-30 disabled:pointer-events-none">${ICONE[dir]}</button>`;
    return `
      <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-4">
        <p class="text-sm ${bate ? 'text-bom' : 'text-aviso'}">${soma} h distribuídas em ${c.modulos.length} módulo${c.modulos.length > 1 ? 's' : ''} — ${bate ? 'bate com a carga horária' : `a carga horária do curso é ${c.cargaHoraria} h`}</p>
        ${editar && c.modulos.length > 1 ? '<p class="text-xs text-tinta-2">Use as setas para mudar a ordem; ela vale para as aulas e para o certificado.</p>' : ''}
      </div>
      <ol class="space-y-3">
        ${c.modulos.map((m, i) => {
          const parte = soma ? Math.round((m.cargaHoraria / soma) * 100) : 0;
          return `
          <li class="painel pl-3 pr-5 py-4 flex items-center gap-3">
            ${editar && ultimo ? `<div class="flex flex-col shrink-0">${seta(i, 'cima', i === 0)}${seta(i, 'baixo', i === ultimo)}</div>` : ''}
            <span class="h-9 w-9 shrink-0 rounded-lg grid place-items-center font-display font-semibold tabular-nums bg-selecao text-marca-tinta ${editar && ultimo ? '' : 'ml-2'}">${i + 1}</span>
            <div class="min-w-0 flex-1 ml-1">
              <p class="font-medium text-tinta">${esc(m.nome)}</p>
              <div class="mt-2 flex items-center gap-3">
                <div class="h-1.5 flex-1 max-w-xs rounded-full bg-etiqueta overflow-hidden"><div class="h-full rounded-full bg-marca" style="width:${parte}%"></div></div>
                <span class="text-xs text-tinta-2 tabular-nums">${parte}% do curso</span>
              </div>
            </div>
            <span class="font-display text-lg font-semibold tabular-nums text-tinta whitespace-nowrap">${m.cargaHoraria} h</span>
          </li>`;
        }).join('')}
      </ol>`;
  }

  function abaTurmas(turmas) {
    return `
      <section class="painel">
        ${turmas.length ? `<ul class="divide-y divide-linha">${turmas.map((t) => {
          const s = Aulor.situacaoTurma(t);
          const o = Aulor.ocupacao(t);
          return `<li><a href="turma.html?id=${t.id}" class="block px-5 py-3 hover:bg-realce">
            <div class="flex items-center justify-between gap-2"><span class="font-medium text-sm">${esc(t.codigo)}</span>${status(Aulor.SITUACAO_TURMA[s].tom, Aulor.SITUACAO_TURMA[s].nome)}</div>
            <p class="text-xs text-tinta-2 mt-0.5">${esc(Agenda.descrever(t.agenda))} · ${dataCurta(t.inicio)} a ${dataCurta(t.fim)} · ${o.ocupadas}/${o.capacidade} alunos</p>
          </a></li>`;
        }).join('')}</ul>` : vazio('Nenhuma turma ainda')}
      </section>`;
  }

  function render() {
    const c = Aulor.curso(id);
    if (!c) { tela.innerHTML = vazio('Curso não encontrado', '', '<a class="btn-sec" href="cursos.html">Voltar</a>'); return; }
    const turmas = Aulor.turmas().filter((t) => t.cursoId === c.id).sort((a, b) => b.inicio.localeCompare(a.inicio));
    const modalidade = Aulor.MODALIDADES.find((m) => m.id === c.modalidade)?.nome;
    const editar = Shell.pode('cursos', 'editar');
    const acoes = [
      editar ? `<button type="button" data-editar class="btn-sec">${ICONE.editar}Editar</button>` : '',
      Shell.pode('turmas', 'criar') ? `<button type="button" data-nova-turma class="btn-pri">${ICONE.mais}Nova turma</button>` : '',
    ].join('');
    const abas = [
      { id: 'dados', nome: 'Dados gerais' },
      { id: 'conteudo', nome: 'Conteúdo programático', n: c.modulos.length },
      { id: 'turmas', nome: 'Turmas', n: turmas.length },
    ];
    const aba = abas.some((x) => x.id === parametroUrl('aba')) ? parametroUrl('aba') : 'dados';
    const corpo = { dados: () => abaDados(c, modalidade), conteudo: () => abaConteudo(c, editar), turmas: () => abaTurmas(turmas) }[aba]();
    tela.innerHTML = `
      <div class="max-w-5xl mx-auto">
        ${cabecalhoPagina({ titulo: `<span class="font-mono text-base text-tinta-2 mr-1">${esc(c.codigo)}</span>${esc(c.nome)}`, subtitulo: `${esc(c.area || 'sem área')} · ${c.cargaHoraria} h · ${esc(modalidade)}`, voltar: { href: 'cursos.html', rotulo: 'Cursos' }, acoes , registro: true})}
        ${abasHtml(abas, aba)}
        ${corpo}
      </div>`;
    tela.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => abrirFormCurso({ curso: c, aoSalvar: () => { toast('Curso atualizado'); render(); } })));
    tela.querySelectorAll('[data-mover]').forEach((b) => b.addEventListener('click', () => moverModulo(c, Number(b.dataset.i), b.dataset.mover)));
    tela.querySelector('[data-nova-turma]')?.addEventListener('click', () => abrirFormTurma({ cursoId: c.id, aoSalvar: (t) => { location.href = `turma.html?id=${t.id}&nova=1`; } }));
  }

  // Troca o módulo com o vizinho e salva; o foco segue o módulo movido.
  function moverModulo(c, i, dir) {
    const j = dir === 'cima' ? i - 1 : i + 1;
    const modulos = [...c.modulos];
    [modulos[i], modulos[j]] = [modulos[j], modulos[i]];
    const r = Aulor.atualizarCurso(c.id, { ...c, modulos });
    if (r.erros) { toast(r.erros[0].mensagem, 'erro'); return; }
    render();
    const alvo = tela.querySelector(`[data-mover="${dir}"][data-i="${j}"]`);
    (alvo?.disabled ? tela.querySelector(`[data-mover="${dir === 'cima' ? 'baixo' : 'cima'}"][data-i="${j}"]`) : alvo)?.focus();
  }

  render();
})();
