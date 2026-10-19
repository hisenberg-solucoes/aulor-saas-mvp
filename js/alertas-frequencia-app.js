// ============================================================
// Alertas de frequência (grupo Pedagógico): alunos cursando que estão
// abaixo da frequência mínima ou perto dela, para a escola contatar antes
// de reprovar. Calculado de Aulor.frequencia; o contato é a mensagem pronta
// no WhatsApp (registrar o contato ficou fora do MVP, com as ocorrências).
// Filtros na URL: ?nivel=sem_chance|abaixo|perto e ?turma=ID.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const hoje = Aulor.hoje();
  const min = Aulor.config().academico.frequenciaMinima;
  const NIVEIS = {
    sem_chance: { rotulo: 'Não alcança mais', ajuda: 'mesmo indo a todas as aulas restantes', tom: 'perigo', tomValor: 'text-red-700 dark:text-red-400' },
    abaixo: { rotulo: 'Abaixo do mínimo', ajuda: `menos de ${min}% hoje, ainda recupera`, tom: 'atencao', tomValor: AVISO },
    perto: { rotulo: 'Perto do limite', ajuda: `até 10 pontos acima de ${min}%`, tom: 'neutro', tomValor: '' },
  };
  const nivelDe = (f) => (f.semChance ? 'sem_chance' : f.abaixo ? 'abaixo' : f.percentual < min + 10 ? 'perto' : null);

  const alertas = Aulor.matriculas()
    .filter((m) => m.status === 'ativa' && ['em_andamento', 'a_concluir'].includes(Aulor.situacaoTurma(Aulor.turma(m.turmaId))))
    .map((m) => ({ m, f: Aulor.frequencia(m) }))
    .filter(({ f }) => f.total >= 1)
    .map((x) => ({ ...x, nivel: nivelDe(x.f), proxima: Aulor.aulasDaTurma(x.m.turmaId).find((a) => a.status === 'prevista' && a.data >= hoje) }))
    .filter((x) => x.nivel)
    .sort((a, b) => Object.keys(NIVEIS).indexOf(a.nivel) - Object.keys(NIVEIS).indexOf(b.nivel) || a.f.percentual - b.f.percentual);
  const turmaUrl = parametroUrl('turma');
  const filtro = {
    nivel: NIVEIS[parametroUrl('nivel')] ? parametroUrl('nivel') : '',
    turmaId: alertas.some((x) => x.m.turmaId === turmaUrl) ? turmaUrl : '',
    q: '',
  };

  // Para menor de idade, a mensagem vai ao responsável.
  function contato({ m, f }) {
    const a = Aulor.aluno(m.alunoId);
    const resp = Aulor.ehMenor(a) ? Aulor.responsavelPrincipal(a) : null;
    const quem = resp ?? a;
    const curso = Aulor.curso(Aulor.turma(m.turmaId).cursoId).nome;
    const texto = `Olá, ${quem.nome.split(' ')[0]}! Aqui é da ${Aulor.escola().nome}. Sentimos falta ${resp ? `de ${a.nome.split(' ')[0]}` : 'de você'} nas aulas de ${curso}: a frequência está em ${f.percentual}% e o mínimo para o certificado é ${min}%. Podemos ajudar em algo?`;
    return { quem, texto, menor: !!resp, fone: String(quem.telefone ?? '').replace(/\D/g, '') };
  }

  function linha(x) {
    const a = Aulor.aluno(x.m.alunoId);
    const t = Aulor.turma(x.m.turmaId);
    const n = NIVEIS[x.nivel];
    const c = contato(x);
    const href = Shell.pode('alunos') ? `aluno.html?id=${a.id}&aba=matriculas` : Shell.pode('matriculas') ? `matricula.html?id=${x.m.id}` : '';
    const faltas = x.f.faltas + (Aulor.config().academico.justificadaContaPresenca ? 0 : x.f.justificadas);
    return `<tr ${href ? `data-href="${href}"` : ''} class="${href ? FOCO_LINHA : ''}">
      <td>
        ${href ? `<a href="${href}" class="${LINK_REGISTRO} block truncate" title="${esc(a.nome)}">${esc(a.nome)}</a>` : `<p class="truncate text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(a.nome)}</p>`}
        <p class="text-xs ${APOIO} tabular-nums truncate">${c.menor ? `Resp.: ${esc(c.quem.nome)} · ` : ''}${telefoneFmt(c.quem.telefone)}</p>
      </td>
      <td><a class="link font-mono text-sm" href="turma.html?id=${t.id}" title="Abrir a turma">${esc(t.codigo)}</a><p class="text-xs ${APOIO} truncate" title="${esc(Aulor.curso(t.cursoId).nome)}">${esc(Aulor.curso(t.cursoId).nome)}</p></td>
      <td>${status(n.tom, n.rotulo)}<p class="text-xs ${APOIO} tabular-nums">${plural(faltas, 'falta')} em ${plural(x.f.total, 'aula')}${x.f.restantes ? ` · ${x.f.restantes} pela frente` : ''}</p></td>
      <td>${barraFrequencia(x.f)}</td>
      <td class="whitespace-nowrap tabular-nums">${x.proxima ? `${dataCurta(x.proxima.data)}<p class="text-xs ${['hoje', 'amanhã'].includes(quando(x.proxima.data)) ? 'font-medium text-slate-800 dark:text-neutral-100' : APOIO}">${quando(x.proxima.data)}</p>` : `<span class="${APOIO}" title="Não há mais aulas previstas nesta turma">—</span>`}</td>
      <td class="text-right">${c.fone
        ? `<a class="btn-sec btn-pequeno" target="_blank" rel="noopener" href="https://wa.me/55${c.fone}?text=${encodeURIComponent(c.texto)}" title="Abre o WhatsApp com a mensagem pronta${c.menor ? ' para o responsável' : ''}">${ICONE.whatsapp}Mensagem</a>`
        : `<button type="button" class="btn-sec btn-pequeno" disabled title="Sem telefone no cadastro">${ICONE.whatsapp}Mensagem</button><p class="text-xs ${APOIO} mt-0.5">sem telefone</p>`}</td>
    </tr>`;
  }

  function render() {
    const termo = normalizarTexto(filtro.q);
    const lista = alertas.filter((x) => (!filtro.nivel || x.nivel === filtro.nivel) && (!filtro.turmaId || x.m.turmaId === filtro.turmaId)
      && (!termo || normalizarTexto(`${Aulor.aluno(x.m.alunoId).nome} ${Aulor.turma(x.m.turmaId).codigo} ${Aulor.curso(Aulor.turma(x.m.turmaId).cursoId).nome}`).includes(termo)));
    const turmas = [...new Set(alertas.map((x) => x.m.turmaId))].map((id) => Aulor.turma(id));
    const filtrando = !!(filtro.nivel || filtro.turmaId || filtro.q);
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoPagina({
          titulo: 'Alunos para contatar',
          subtitulo: `Quem está abaixo ou perto do mínimo de ${min}% nas turmas em andamento, pela chamada até ${dataBr(hoje)}. ${alertas.length ? `${plural(alertas.length, 'alerta')} em ${plural(turmas.length, 'turma')}.` : 'Nenhum alerta no momento.'}`,
        })}

        ${alertas.length ? `
        <div class="grid grid-cols-3 gap-3 mb-4" role="group" aria-label="Filtrar por nível">
          ${Object.entries(NIVEIS).map(([id, n]) => {
            const total = alertas.filter((x) => x.nivel === id).length;
            return cartaoNumero({ rotulo: n.rotulo, valor: total, ajuda: n.ajuda, cor: TOM[n.tom].ponto, filtro: id, ativo: filtro.nivel === id, tomValor: total ? n.tomValor : '' });
          }).join('')}
        </div>

        <div class="flex flex-wrap items-center gap-2 mb-4">
          ${campoBusca('busca', filtro.q, 'Buscar por aluno, turma ou curso')}
          ${selectFiltro('f-turma', [{ id: '', nome: 'Todas as turmas' }, ...turmas.map((t) => ({ id: t.id, nome: `${t.codigo} · ${Aulor.curso(t.cursoId).nome} (${alertas.filter((x) => x.m.turmaId === t.id).length})` }))], filtro.turmaId, 'Turma')}
          ${filtrando ? '<button type="button" data-limpar class="text-sm font-medium link">Limpar</button>' : ''}
        </div>

        <div class="painel overflow-hidden">
          ${lista.length ? `<div class="overflow-x-auto">
            <table class="tabela table-fixed">
              <thead><tr><th>Aluno</th><th class="w-[150px]">Turma</th><th class="w-[176px]">Motivo</th><th class="w-[150px]">Frequência</th><th class="w-[104px]">Próxima aula</th><th class="w-[140px] text-right">Contato</th></tr></thead>
              <tbody>${lista.map(linha).join('')}</tbody>
            </table>
          </div>` : vazio('Nenhum alerta com esses filtros', '', '<button type="button" data-limpar class="btn-sec">Limpar filtros</button>')}
          <p class="px-4 py-2.5 text-xs ${APOIO} border-t border-slate-100 dark:border-neutral-900 tabular-nums">${filtrando ? `${lista.length} de ${plural(alertas.length, 'alerta')}` : plural(lista.length, 'alerta')}</p>
        </div>` : `
        <div class="painel">${vazio('Ninguém para contatar hoje', 'Nenhum aluno das turmas em andamento está abaixo ou perto do mínimo. Os alertas aparecem aqui assim que a chamada registrar faltas.', '<a href="turmas.html" class="btn-sec">Ver turmas</a>')}</div>`}

        <details class="mt-4 max-w-3xl text-sm ${APOIO_FUNDO}">
          <summary class="cursor-pointer w-fit link">Como calculamos</summary>
          <ul class="mt-2 space-y-1 list-disc pl-5">
            <li>Entram as matrículas cursando em turmas em andamento ou aguardando conclusão, com pelo menos uma chamada registrada. Aula sem chamada não conta.</li>
            <li><strong>Não alcança mais</strong>: mesmo indo a todas as aulas que faltam, não chega a ${min}%. <strong>Abaixo do mínimo</strong>: menos de ${min}% hoje, mas ainda recupera. <strong>Perto do limite</strong>: até 10 pontos acima do mínimo.</li>
            <li>${Aulor.config().academico.justificadaContaPresenca ? 'Falta justificada conta como presença.' : 'Falta justificada conta como falta.'} Depois de uma troca de turma, conta só a turma atual.</li>
            <li>"Mensagem" abre o WhatsApp com o texto pronto; para menor de idade, vai ao responsável principal.</li>
          </ul>
        </details>
      </div>`;
    ligar();
  }

  function definir(chave, valor) {
    filtro[chave] = valor;
    const url = new URL(location.href);
    [['nivel', filtro.nivel], ['turma', filtro.turmaId]].forEach(([k, v]) => { if (v) url.searchParams.set(k, v); else url.searchParams.delete(k); });
    history.replaceState(null, '', url);
    render();
  }

  function ligar() {
    ligarLinhasLink(tela);
    const busca = tela.querySelector('#busca');
    busca?.addEventListener('input', () => { filtro.q = busca.value; const pos = busca.selectionStart; render(); const n = tela.querySelector('#busca'); n.focus(); n.setSelectionRange(pos, pos); });
    tela.querySelector('#f-turma')?.addEventListener('change', (e) => definir('turmaId', e.target.value));
    tela.querySelectorAll('[data-limpar]').forEach((b) => b.addEventListener('click', () => { filtro.q = ''; filtro.turmaId = ''; definir('nivel', ''); }));
    tela.querySelectorAll('[data-cartao]').forEach((b) => b.addEventListener('click', () => definir('nivel', filtro.nivel === b.dataset.cartao ? '' : b.dataset.cartao)));
  }

  render();
})();
