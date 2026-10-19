// ============================================================
// Curso (ficha em cartões): Dados gerais, Conteúdo programático (módulos)
// e Turmas. Aba na URL: ?aba=.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const id = parametroUrl('id');

  function abaDados(c, editar) {
    const cfg = Aulor.config();
    const modelo = Aulor.modeloDoCurso(c);
    const acaoEditar = editar ? `<button type="button" data-editar class="btn-fantasma">${ICONE.editar}Editar</button>` : '';
    const porHora = c.cargaHoraria ? c.valor / c.cargaHoraria : null;
    return `
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        ${cartao({ titulo: 'Identificação e carga horária', contexto: 'Como o curso aparece no catálogo e no certificado.', acao: acaoEditar, corpo: gradeCampos([
          campoValor('Nome', esc(c.nome), 'sm:col-span-2'),
          campoValor('Código', `<span class="font-mono">${esc(c.codigo)}</span>`),
          campoValor('Área', esc(c.area)),
          campoValor('Modalidade', esc(nomeModalidade(c.modalidade))),
          campoValor('Carga horária', `<span class="tabular-nums">${c.cargaHoraria} h</span>${c.modulos.length ? `<span class="text-xs ${APOIO}"> · ${plural(c.modulos.length, 'módulo')}</span>` : ''}`),
        ]) })}
        ${cartao({ titulo: 'Descrição', contexto: 'O que o aluno aprende no curso.', acao: acaoEditar, corpo: `<div class="p-4">${c.descricao ? `<p class="text-sm text-slate-700 dark:text-neutral-300 whitespace-pre-line max-w-prose">${esc(c.descricao)}</p>` : `<p class="text-sm ${APOIO}">Sem descrição.</p>`}</div>` })}
        ${cartao({ titulo: 'Aprovação e certificado', contexto: 'A frequência mínima é da escola; a nota mínima é deste curso.', acao: acaoEditar, corpo: gradeCampos([
          campoValor('Frequência mínima', `<span class="tabular-nums">${cfg.academico.frequenciaMinima}%</span><span class="text-xs ${APOIO}"> das aulas com chamada</span>`),
          campoValor('Nota mínima', Aulor.temNota(c)
            ? `<span class="tabular-nums">${Aulor.fmtNota(c.notaMinima)}</span><span class="text-xs ${APOIO}"> de 10, na nota final</span>`
            : `Sem nota<p class="text-xs ${APOIO}">Aprova pela frequência.</p>`),
          campoValor('Modelo de certificado', `${Shell.pode('configuracoes') ? `<a href="modelo-certificado.html?id=${modelo.id}" class="link">${esc(modelo.nome)}</a>` : esc(modelo.nome)}${c.modeloCertificadoId === modelo.id ? '' : `<p class="text-xs ${APOIO}">${c.modeloCertificadoId ? 'Padrão da escola: o modelo escolhido não está ativo' : 'Padrão da escola'}</p>`}`),
          campoValor('Verso', modelo.verso.mostrar && c.modulos.length ? `Lista os ${c.modulos.length} módulos` : 'Sem verso'),
          campoValor('Com parcela vencida', cfg.financeiro.bloquearCertificadoInadimplente ? 'Bloqueia a emissão' : 'Emite normalmente', 'sm:col-span-2'),
        ]) })}
        ${cartao({ titulo: 'Valores', contexto: 'Referência para a matrícula; o desconto é dado caso a caso.', acao: acaoEditar, corpo: gradeCampos([
          campoValor('Valor de referência', `<span class="tabular-nums">${moeda(c.valor)}</span>${porHora ? `<span class="text-xs ${APOIO} tabular-nums"> · ${moeda(porHora)} por hora</span>` : ''}`),
          campoValor('Parcelamento sugerido', `<span class="tabular-nums">até ${c.parcelasSugeridas}× de ${moeda(c.valor / c.parcelasSugeridas)}</span>`),
        ]) })}
      </div>`;
  }

  function abaConteudo(c, editar) {
    if (!c.modulos.length) return `<section class="painel">${vazio('Curso sem módulos', `Divida as ${c.cargaHoraria} h em módulos: eles orientam o diário das aulas e vão para o verso do certificado.`, editar ? `<button type="button" data-editar class="btn-sec">${ICONE.editar}Cadastrar módulos</button>` : '')}</section>`;
    const soma = c.modulos.reduce((s, m) => s + m.cargaHoraria, 0);
    const dif = Math.round((soma - c.cargaHoraria) * 10) / 10;
    // Horas que batem não se anunciam em verde; falta é pendência (cobre), excesso é erro.
    const horas = dif === 0 ? `<span class="${APOIO_FUNDO}">${soma} h distribuídas em ${plural(c.modulos.length, 'módulo')}</span>`
      : dif < 0 ? `<span class="${AVISO}">${soma} de ${c.cargaHoraria} h distribuídas · faltam ${-dif} h</span>`
        : `<span class="text-red-700 dark:text-red-400">${soma} h distribuídas · excede a carga horária em ${dif} h</span>`;
    const ultimo = c.modulos.length - 1;
    const seta = (i, dir, desab) => `<button type="button" data-mover="${dir}" data-i="${i}" ${desab ? 'disabled' : ''} aria-label="Mover ${esc(c.modulos[i].nome)} para ${dir}" class="h-6 w-6 grid place-items-center rounded-md text-slate-400 dark:text-neutral-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none">${ICONE[dir]}</button>`;
    return `
      <div class="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p class="text-sm font-medium tabular-nums">${horas}</p>
        ${editar ? `<div class="ml-auto flex items-center gap-2">${c.modulos.length > 1 ? `<span class="text-xs ${APOIO_FUNDO}">As setas mudam a ordem das aulas e do certificado.</span>` : ''}<button type="button" data-editar class="btn-sec">${ICONE.editar}Editar módulos</button></div>` : ''}
      </div>
      <ol class="space-y-3">
        ${c.modulos.map((m, i) => {
          const parte = soma ? Math.round((m.cargaHoraria / soma) * 100) : 0;
          return `
          <li class="painel px-3 py-3 flex items-center gap-3">
            ${editar && ultimo ? `<div class="flex flex-col shrink-0 -my-1">${seta(i, 'cima', i === 0)}${seta(i, 'baixo', i === ultimo)}</div>` : ''}
            <span class="h-8 w-8 shrink-0 rounded-lg grid place-items-center text-sm font-semibold tabular-nums bg-petrol-800/10 text-petrol-800 dark:bg-sky-950/60 dark:text-sky-300">${i + 1}</span>
            <div class="min-w-0 flex-1">
              <p class="text-[15px] font-semibold ${TITULO} truncate">${esc(m.nome)}</p>
              <div class="mt-1.5 flex items-center gap-3">${medidor(parte, { largura: 'w-40' })}<span class="text-xs ${APOIO} tabular-nums">${parte}% do curso</span></div>
            </div>
            <span class="text-sm font-semibold tabular-nums ${TITULO} whitespace-nowrap">${m.cargaHoraria} h</span>
          </li>`;
        }).join('')}
      </ol>`;
  }

  function abaTurmas(c, turmas) {
    const nova = Shell.pode('turmas', 'criar') ? `<button type="button" data-nova-turma class="btn-fantasma">${ICONE.mais}Nova turma</button>` : '';
    return cartao({
      titulo: 'Turmas deste curso',
      contexto: 'Cada turma tem professor, agenda e vagas próprias. A mais recente primeiro.',
      acao: nova,
      corpo: turmas.length ? `
        <div class="mt-3 overflow-x-auto border-t border-slate-200 dark:border-neutral-800">
          <table class="tabela">
            <thead><tr><th>Turma</th><th>Professor</th><th>Período</th><th>Alunos</th><th>Situação</th></tr></thead>
            <tbody>${turmas.map((t) => {
              const s = Aulor.situacaoTurma(t);
              return `<tr data-href="turma.html?id=${t.id}" class="${FOCO_LINHA} ${['concluida', 'cancelada'].includes(s) ? 'linha-apagada' : ''}">
                <td><a href="turma.html?id=${t.id}" class="${LINK_REGISTRO} font-mono">${esc(t.codigo)}</a><p class="text-xs ${APOIO}">${esc(Agenda.descrever(t.agenda))}</p></td>
                <td>${esc(Aulor.professor(t.professorId).nome)}</td>
                <td class="tabular-nums whitespace-nowrap">${dataCurta(t.inicio)} → ${dataCurta(t.fim)}</td>
                <td>${ocupacaoHtml(t)}</td>
                <td>${status(Aulor.SITUACAO_TURMA[s].tom, Aulor.SITUACAO_TURMA[s].nome)}</td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>` : vazio('Nenhuma turma ainda', 'Crie a primeira turma para abrir matrículas neste curso.'),
    });
  }

  function render() {
    const c = Aulor.curso(id);
    if (!c) { tela.innerHTML = vazio('Curso não encontrado', '', '<a class="btn-sec" href="cursos.html">Voltar</a>'); return; }
    const turmas = Aulor.turmas().filter((t) => t.cursoId === c.id).sort((a, b) => b.inicio.localeCompare(a.inicio));
    const abertas = turmas.filter((t) => ['planejada', 'em_andamento', 'a_concluir'].includes(Aulor.situacaoTurma(t))).length;
    const editar = Shell.pode('cursos', 'editar');
    const abas = [
      { id: 'dados', nome: 'Dados gerais' },
      { id: 'conteudo', nome: 'Conteúdo programático', n: c.modulos.length },
      { id: 'turmas', nome: 'Turmas', n: turmas.length },
    ];
    const aba = abas.some((x) => x.id === parametroUrl('aba')) ? parametroUrl('aba') : 'dados';
    const corpo = { dados: () => abaDados(c, editar), conteudo: () => abaConteudo(c, editar), turmas: () => abaTurmas(c, turmas) }[aba]();
    const mais = Shell.pode('turmas', 'criar') ? [{ nome: 'Nova turma', detalhe: 'Professor, agenda e vagas; as aulas saem da carga horária', acao: novaTurma }] : null;
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoFicha({
          trilha: [{ rotulo: 'Cursos', href: 'cursos.html' }, { rotulo: esc(c.nome) }],
          avatar: avatarRegistro(c.codigo, 'Código do curso'),
          nome: esc(c.nome),
          chips: [
            chip(ICONE.tag, esc(c.area || 'sem área'), 'Área'),
            chip(ICONE.relogio, `<span class="tabular-nums">${c.cargaHoraria} h</span>${c.modulos.length ? ` · ${plural(c.modulos.length, 'módulo')}` : ''}`, 'Carga horária'),
            chip(ICONE.local, esc(nomeModalidade(c.modalidade)), 'Modalidade'),
            chip(ICONE.check.replace('h-4 w-4', 'h-3.5 w-3.5'), Aulor.temNota(c) ? `nota mínima ${Aulor.fmtNota(c.notaMinima)}` : 'aprova pela frequência', 'Aprovação'),
            chip(ICONE.pessoas, `${plural(turmas.length, 'turma')}${abertas ? ` · ${abertas} ${abertas === 1 ? 'aberta' : 'abertas'}` : ''}`, 'Turmas do curso'),
          ],
          acoes: editar ? `<button type="button" data-editar class="btn-sec">${ICONE.editar}Editar dados</button>` : '',
          mais,
        })}
        ${abasHtml(abas, aba)}
        ${corpo}
      </div>`;
    ligarLinhasLink(tela);
    tela.querySelectorAll('[data-editar]').forEach((b) => b.addEventListener('click', () => abrirFormCurso({ curso: c, aoSalvar: () => { toast('Curso atualizado'); render(); } })));
    tela.querySelectorAll('[data-mover]').forEach((b) => b.addEventListener('click', () => moverModulo(c, Number(b.dataset.i), b.dataset.mover)));
    tela.querySelector('[data-nova-turma]')?.addEventListener('click', novaTurma);
    tela.querySelector('[data-mais]')?.addEventListener('click', (e) => abrirMenu(e.currentTarget, mais));
  }

  function novaTurma() {
    abrirFormTurma({ cursoId: id, aoSalvar: (t) => { location.href = `turma.html?id=${t.id}&nova=1`; } });
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
