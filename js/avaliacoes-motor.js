// ============================================================
// Motor do feedback diário (avaliacoes.html e filhas): cálculos puros, sem DOM.
// Recebe as avaliações e devolve médias, distribuições, faixas e
// pontos de atenção. Tudo o que a UI mostra sai daqui.
// ============================================================

const Avaliacoes = (() => {
  const valorDe = (respostaId) => ESCALA.find((e) => e.id === respostaId)?.valor ?? null;

  // Faixas de cor por média (escala 1–5). Ordem importa: primeira que casar vence.
  const FAIXAS = [
    { id: 'otimo', rotulo: 'Ótimo', min: 4.5 },
    { id: 'bom', rotulo: 'Bom', min: 4.0 },
    { id: 'regular', rotulo: 'Regular', min: 2.5 },
    { id: 'ruim', rotulo: 'Ruim', min: -Infinity },
  ];

  // Abaixo disso um indicador vira "ponto de atenção": é o início de Bom, então atenção = Regular ou Ruim.
  const LIMIAR_ATENCAO = FAIXAS.find((f) => f.id === 'bom').min;

  function faixa(media) {
    if (media == null) return null;
    return FAIXAS.find((f) => media >= f.min);
  }

  function media(valores) {
    const v = valores.filter((x) => x != null);
    return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
  }

  // Média de um indicador dentro de um conjunto de avaliações.
  function mediaIndicador(avaliacoes, indicadorId) {
    return media(avaliacoes.map((a) => valorDe(a.respostas[indicadorId])));
  }

  // Média geral: média de todas as respostas fechadas (cada resposta pesa igual).
  function mediaGeral(avaliacoes) {
    return media(avaliacoes.flatMap((a) => Object.values(a.respostas).map(valorDe)));
  }

  // Média de um grupo (Curso, Instrutor…) = média dos seus indicadores.
  function mediaGrupo(avaliacoes, grupo) {
    return media(grupo.indicadores.map((i) => mediaIndicador(avaliacoes, i.id)));
  }

  // Quantidade de respostas por nível da escala (Ótimo/Bom/Regular/Ruim).
  function distribuicao(avaliacoes) {
    const contagem = Object.fromEntries(ESCALA.map((e) => [e.id, 0]));
    avaliacoes.forEach((a) => Object.values(a.respostas).forEach((r) => { contagem[r]++; }));
    const total = Object.values(contagem).reduce((s, n) => s + n, 0);
    return { contagem, total };
  }

  // Avaliações de um dia, opcionalmente só das turmas de um turno.
  function avaliacoesDoDia(data, turno = null) {
    return AVALIACOES.filter((a) => a.data === data && pertenceAoTurno(a, turno));
  }

  function pertenceAoTurno(avaliacao, turno) {
    if (!turno) return true;
    return TURMAS_AVALIACAO.find((t) => t.id === avaliacao.turmaId)?.turno === turno;
  }

  // Resumo de cada turma que recebeu avaliações no dia.
  function resumoTurmas(data, turno = null) {
    const doDia = avaliacoesDoDia(data, turno);
    const porTurma = new Map();
    doDia.forEach((a) => {
      if (!porTurma.has(a.turmaId)) porTurma.set(a.turmaId, []);
      porTurma.get(a.turmaId).push(a);
    });
    return [...porTurma.entries()]
      .map(([turmaId, avaliacoes]) => {
        const turma = TURMAS_AVALIACAO.find((t) => t.id === turmaId);
        const indicadores = Object.fromEntries(INDICADORES.map((i) => [i.id, mediaIndicador(avaliacoes, i.id)]));
        const grupos = Object.fromEntries(GRUPOS.map((g) => [g.id, mediaGrupo(avaliacoes, g)]));
        return {
          turma,
          avaliacoes: [...avaliacoes].sort((a, b) => a.aluno.nome.localeCompare(b.aluno.nome, 'pt-BR')),
          respondentes: avaliacoes.length,
          media: mediaGeral(avaliacoes),
          indicadores,
          grupos,
          comentarios: comentariosDe(avaliacoes),
          pontosAtencao: INDICADORES.filter((i) => indicadores[i.id] != null && indicadores[i.id] < LIMIAR_ATENCAO)
            .map((i) => ({ indicador: i, media: indicadores[i.id] })),
        };
      })
      .sort((a, b) => a.turma.codigo.localeCompare(b.turma.codigo, 'pt-BR'));
  }

  // Classificação simples do comentário: pela nota média do aluno + palavras-chave.
  const PALAVRAS_ATENCAO = /\b(falta|faltou|melhorar|frio|quente|travam?|caiu|desfocado|rápido|rapido|pouco|não|nao|dif[ií]cil|ruim|barulho)\b/i;
  const PALAVRAS_SUGESTAO = /\b(sugiro|seria|poderiam?|gostaria)\b/i;

  function classificarComentario(texto, mediaAluno) {
    if (mediaAluno != null && mediaAluno < LIMIAR_ATENCAO) return 'atencao';
    if (PALAVRAS_SUGESTAO.test(texto)) return 'sugestao';
    if (PALAVRAS_ATENCAO.test(texto)) return 'atencao';
    return 'positivo';
  }

  function comentariosDe(avaliacoes) {
    return avaliacoes
      .filter((a) => a.abertas.comentario)
      .map((a) => {
        const mediaAluno = media(Object.values(a.respostas).map(valorDe));
        return {
          avaliacaoId: a.id,
          turmaId: a.turmaId,
          aluno: a.aluno,
          texto: a.abertas.comentario,
          mediaAluno,
          tom: classificarComentario(a.abertas.comentario, mediaAluno),
        };
      });
  }

  // KPIs do dia + comparação com a média dos 7 dias anteriores.
  function kpis(data, turno = null) {
    const doDia = avaliacoesDoDia(data, turno);
    const turmas = resumoTurmas(data, turno);
    const anteriores = AVALIACOES.filter((a) => a.data < data && diasEntre(a.data, data) <= 7 && pertenceAoTurno(a, turno));
    const mediaDia = mediaGeral(doDia);
    const mediaAnterior = mediaGeral(anteriores);
    const alunosEsperados = turmas.reduce((s, t) => s + t.turma.alunos, 0);
    const dist = distribuicao(doDia);
    const comentarios = turmas.flatMap((t) => t.comentarios);
    // Turma com algum indicador abaixo do limiar, da mais grave para a menos: mais indicadores abaixo, depois o pior mais baixo.
    const turmasAtencao = turmas.filter((t) => t.pontosAtencao.length).map((t) => {
      const pontos = [...t.pontosAtencao].sort((a, b) => a.media - b.media);
      return {
        turma: t.turma,
        pontos,
        pior: pontos[0],
        avaliados: Object.values(t.indicadores).filter((m) => m != null).length,
        comentariosAtencao: t.comentarios.filter((c) => c.tom === 'atencao').length,
      };
    }).sort((a, b) => b.pontos.length - a.pontos.length || a.pior.media - b.pior.media);
    return {
      mediaDia,
      mediaAnterior,
      variacao: mediaDia != null && mediaAnterior != null ? mediaDia - mediaAnterior : null,
      respostas: doDia.length,
      alunosEsperados,
      adesao: alunosEsperados ? doDia.length / alunosEsperados : null,
      turmas: turmas.length,
      distribuicao: dist,
      comentarios: comentarios.length,
      comentariosAtencao: comentarios.filter((c) => c.tom === 'atencao').length,
      turmasAtencao,
    };
  }

  // Médias por indicador considerando todas as turmas do dia (linha "Todas as turmas").
  function mediasDoDia(data, turno = null) {
    const doDia = avaliacoesDoDia(data, turno);
    return {
      indicadores: Object.fromEntries(INDICADORES.map((i) => [i.id, mediaIndicador(doDia, i.id)])),
      grupos: Object.fromEntries(GRUPOS.map((g) => [g.id, mediaGrupo(doDia, g)])),
      media: mediaGeral(doDia),
    };
  }

  // Série dos últimos N dias para a tendência (só dias com avaliação).
  function tendencia(data, dias = 14, turno = null) {
    const serie = [];
    for (let i = dias - 1; i >= 0; i--) {
      const d = somarDias(data, -i);
      const doDia = avaliacoesDoDia(d, turno);
      serie.push({ data: d, media: mediaGeral(doDia), respostas: doDia.length });
    }
    return serie;
  }

  function diasEntre(a, b) {
    return Math.round((new Date(b) - new Date(a)) / 86400000);
  }

  function somarDias(data, n) {
    const d = new Date(`${data}T12:00:00`);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  // Quantas turmas avaliadas no dia em cada turno (para as abas de período).
  function contagemPorTurno(data) {
    const turmas = resumoTurmas(data);
    return Object.fromEntries(TURNOS.map((t) => [t.id, turmas.filter((r) => r.turma.turno === t.id).length]));
  }

  function datasComAvaliacao() {
    return [...new Set(AVALIACOES.map((a) => a.data))].sort();
  }

  // ---------- Período (últimos N dias até uma data) ----------

  function avaliacoesNoPeriodo(ate, dias, filtro = () => true) {
    const inicio = somarDias(ate, -(dias - 1));
    return AVALIACOES.filter((a) => a.data >= inicio && a.data <= ate && filtro(a));
  }

  // Resumo agregado de um conjunto de avaliações (usado por turma e por instrutor).
  function resumoConjunto(avaliacoes) {
    const indicadores = Object.fromEntries(INDICADORES.map((i) => [i.id, mediaIndicador(avaliacoes, i.id)]));
    const grupos = Object.fromEntries(GRUPOS.map((g) => [g.id, mediaGrupo(avaliacoes, g)]));
    const dist = distribuicao(avaliacoes);
    const comentarios = comentariosDe(avaliacoes);
    return {
      avaliacoes,
      respostas: avaliacoes.length,
      media: mediaGeral(avaliacoes),
      indicadores,
      grupos,
      distribuicao: dist,
      pctOtimoBom: dist.total ? (dist.contagem.otimo + dist.contagem.bom) / dist.total : null,
      comentarios,
      comentariosAtencao: comentarios.filter((c) => c.tom === 'atencao').length,
      melhorIndicador: melhorPior(indicadores, 'melhor'),
      piorIndicador: melhorPior(indicadores, 'pior'),
    };
  }

  function melhorPior(indicadores, qual) {
    const lista = INDICADORES.filter((i) => indicadores[i.id] != null)
      .map((i) => ({ indicador: i, media: indicadores[i.id] }))
      .sort((a, b) => a.media - b.media);
    if (!lista.length) return null;
    return qual === 'pior' ? lista[0] : lista[lista.length - 1];
  }

  // Série diária de um conjunto (só dias com avaliação).
  function serieDiaria(avaliacoes) {
    const porDia = new Map();
    avaliacoes.forEach((a) => {
      if (!porDia.has(a.data)) porDia.set(a.data, []);
      porDia.get(a.data).push(a);
    });
    return [...porDia.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([data, lista]) => ({
      data,
      respostas: lista.length,
      media: mediaGeral(lista),
      indicadores: Object.fromEntries(INDICADORES.map((i) => [i.id, mediaIndicador(lista, i.id)])),
      pontosAtencao: INDICADORES.filter((i) => {
        const m = mediaIndicador(lista, i.id);
        return m != null && m < LIMIAR_ATENCAO;
      }).map((i) => ({ indicador: i, media: mediaIndicador(lista, i.id) })),
    }));
  }

  // Histórico de UMA turma nos últimos N dias (+ período anterior para variação).
  // `filtro` restringe as avaliações da turma (ex.: só dias de aula da turma do cadastro).
  function historicoTurma(turmaId, ate, dias, filtro = () => true) {
    const turma = TURMAS_AVALIACAO.find((t) => t.id === turmaId);
    if (!turma) return null;
    const daTurma = (a) => a.turmaId === turmaId && filtro(a);
    const atual = resumoConjunto(avaliacoesNoPeriodo(ate, dias, daTurma));
    const anterior = resumoConjunto(avaliacoesNoPeriodo(somarDias(ate, -dias), dias, daTurma));
    const escola = resumoConjunto(avaliacoesNoPeriodo(ate, dias));
    const serie = serieDiaria(atual.avaliacoes);
    return {
      turma,
      instrutor: INSTRUTORES_AVALIACAO.find((i) => i.id === turma.instrutorId),
      atual, anterior, escola, serie,
      diasAvaliados: serie.length,
      adesaoMedia: serie.length ? media(serie.map((d) => d.respostas / turma.alunos)) : null,
      variacao: atual.media != null && anterior.media != null ? atual.media - anterior.media : null,
      pontosAtencao: serie.flatMap((d) => d.pontosAtencao.map((p) => ({ ...p, data: d.data }))).sort((a, b) => a.media - b.media),
    };
  }

  // Métricas de UM instrutor nos últimos N dias, comparadas com todos os instrutores.
  function resumoInstrutor(instrutorId, ate, dias) {
    const instrutor = INSTRUTORES_AVALIACAO.find((i) => i.id === instrutorId);
    if (!instrutor) return null;
    const turmasDele = TURMAS_AVALIACAO.filter((t) => t.instrutorId === instrutorId);
    const ids = new Set(turmasDele.map((t) => t.id));
    const atual = resumoConjunto(avaliacoesNoPeriodo(ate, dias, (a) => ids.has(a.turmaId)));
    const anterior = resumoConjunto(avaliacoesNoPeriodo(somarDias(ate, -dias), dias, (a) => ids.has(a.turmaId)));
    const escola = resumoConjunto(avaliacoesNoPeriodo(ate, dias));
    const grupoInstrutor = GRUPOS.find((g) => g.id === 'instrutor');
    const turmas = turmasDele.map((t) => {
      const r = resumoConjunto(atual.avaliacoes.filter((a) => a.turmaId === t.id));
      return { turma: t, ...r, diasAvaliados: new Set(r.avaliacoes.map((a) => a.data)).size };
    }).filter((t) => t.respostas > 0).sort((a, b) => a.turma.codigo.localeCompare(b.turma.codigo, 'pt-BR'));
    // Posição entre os instrutores com avaliação no período (pela média do grupo Instrutor).
    const ranking = INSTRUTORES_AVALIACAO.map((i) => {
      const idsI = new Set(TURMAS_AVALIACAO.filter((t) => t.instrutorId === i.id).map((t) => t.id));
      const lista = avaliacoesNoPeriodo(ate, dias, (a) => idsI.has(a.turmaId));
      return { instrutor: i, media: mediaGrupo(lista, grupoInstrutor), respostas: lista.length };
    }).filter((r) => r.media != null).sort((a, b) => b.media - a.media);
    return {
      instrutor, turmas, atual, anterior, escola, ranking,
      posicao: ranking.findIndex((r) => r.instrutor.id === instrutorId) + 1,
      serie: serieDiaria(atual.avaliacoes),
      mediaInstrutor: atual.grupos.instrutor,
      mediaInstrutorAnterior: anterior.grupos.instrutor,
      mediaInstrutorEscola: escola.grupos.instrutor,
      variacao: atual.grupos.instrutor != null && anterior.grupos.instrutor != null ? atual.grupos.instrutor - anterior.grupos.instrutor : null,
    };
  }

  // Instrutores com avaliação no período (para o seletor da tela de instrutor).
  function instrutoresNoPeriodo(ate, dias) {
    return INSTRUTORES_AVALIACAO.map((i) => {
      const ids = new Set(TURMAS_AVALIACAO.filter((t) => t.instrutorId === i.id).map((t) => t.id));
      const lista = avaliacoesNoPeriodo(ate, dias, (a) => ids.has(a.turmaId));
      return { instrutor: i, respostas: lista.length, media: mediaGeral(lista), mediaInstrutor: mediaGrupo(lista, GRUPOS.find((g) => g.id === 'instrutor')) };
    }).sort((a, b) => a.instrutor.nome.localeCompare(b.instrutor.nome, 'pt-BR'));
  }

  return {
    FAIXAS, LIMIAR_ATENCAO, faixa, valorDe, media, mediaIndicador, mediaGeral, mediaGrupo,
    distribuicao, resumoTurmas, kpis, mediasDoDia, tendencia, somarDias, datasComAvaliacao, contagemPorTurno,
    historicoTurma, resumoInstrutor, instrutoresNoPeriodo, serieDiaria,
    resumoConjunto, comentariosDe, // usados pelo Portal do Professor (agregados anônimos)
    classificarComentario,
  };
})();
