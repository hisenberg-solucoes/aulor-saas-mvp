// ============================================================
// Motor de PRESENÇAS (chamada por aula): regras puras (sem DOM).
// Lê/grava os registros de js/presencas-data.js e calcula a frequência
// do aluno por turma. Usado pelo Portal do Aluno (só leitura) e, no futuro,
// pela tela de chamada do professor (registrar/registrarLote).
// Depende de Turmas (aulas/matrículas) só para gerar a semente.
// Persistência em localStorage — trocar o sufixo da chave força reset.
// ============================================================

const Presencas = (() => {
  const CHAVE = 'aulor-v1-presencas-v3'; // v3 (07/09/2026): só as diferenças da semente são gravadas; v2: faltas variam por mês
  let cache = null;

  const hoje = () => (typeof Turmas !== 'undefined' ? Turmas.hoje() : new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10));

  // A semente (milhares de registros gerados) NÃO vai para o localStorage: só o que o professor gravou e difere dela
  // (v3, 07/09/2026 — antes a lista inteira era gravada e, com o catálogo completo, estourava a cota do navegador).
  let semente = null;
  const chaveDe = (r) => `${r.turmaId}|${r.alunoId}|${r.data}`;
  function sementeAtual() {
    if (!semente) semente = typeof Turmas !== 'undefined' ? gerarSementePresencas(Turmas.carregar(), hoje()) : [];
    return semente;
  }
  function carregar() {
    if (cache) return cache;
    let salvos = [];
    try { salvos = JSON.parse(localStorage.getItem(CHAVE) ?? '[]'); } catch (_) { salvos = []; }
    const porChave = new Map(salvos.map((r) => [chaveDe(r), r]));
    const base = sementeAtual().map((r) => porChave.get(chaveDe(r)) ?? r);
    const vistos = new Set(base.map(chaveDe));
    cache = [...base, ...salvos.filter((r) => !vistos.has(chaveDe(r)))];
    return cache;
  }
  function salvar(lista) {
    const daSemente = new Map(sementeAtual().map((r) => [chaveDe(r), r]));
    const igual = (a, b) => b && a.status === b.status && (a.minutos ?? null) === (b.minutos ?? null) && (a.chegada ?? null) === (b.chegada ?? null) && (a.saida ?? null) === (b.saida ?? null) && (a.observacao ?? '') === (b.observacao ?? '');
    const diferentes = lista.filter((r) => !igual(r, daSemente.get(chaveDe(r))));
    localStorage.setItem(CHAVE, JSON.stringify(diferentes));
    cache = lista;
  }
  const invalidar = () => { cache = null; semente = null; };

  const statusDe = (id) => STATUS_PRESENCA.find((s) => s.id === id) ?? null;
  const statusFrequenciaDe = (id) => STATUS_FREQUENCIA.find((s) => s.id === id) ?? null;
  const conta = (status) => statusDe(status)?.conta === true;

  // Texto curto dos horários informados na chamada: "chegou 19:20 · saiu 21:40" (vazio se não há nenhum).
  function horarioTexto(r) {
    if (!r) return '';
    return [r.chegada && `chegou ${r.chegada}`, r.saida && `saiu ${r.saida}`].filter(Boolean).join(' · ');
  }

  // Registro casa com a aula pelo id (quando ambos têm) ou pela data.
  const daAula = (r, aula) => (typeof aula === 'string' ? r.data === aula : (r.aulaId && aula.id ? r.aulaId === aula.id : r.data === aula.data));

  const registrosDe = (turmaId, alunoId, lista = carregar()) => lista.filter((r) => r.turmaId === turmaId && r.alunoId === alunoId);
  const porAula = (turmaId, aula, lista = carregar()) => lista.filter((r) => r.turmaId === turmaId && daAula(r, aula));
  const registroDe = (turmaId, alunoId, aula, lista = carregar()) => registrosDe(turmaId, alunoId, lista).find((r) => daAula(r, aula)) ?? null;

  // Aulas já dadas: não canceladas e com data anterior à referência ("hoje" só conta amanhã, como no portal).
  const aulasDadas = (aulas, ref = hoje()) => (aulas ?? []).filter((a) => a.status !== 'cancelada' && a.data < ref);

  // Frequência do aluno na turma. `aulas` = Turmas.aulas(t) ou as agendadas; `opts`:
  //   concluido — curso encerrado para o aluno (abaixo do mínimo vira "reprovado por frequência" em vez de "em risco")
  //   minimo — frequência mínima do curso (padrão FREQUENCIA_MINIMA)
  // percentual = (presentes + atrasos + justificadas) / aulas dadas. Aula dada sem registro conta como falta [sup.].
  function frequencia(turmaId, alunoId, aulas, ref = hoje(), { concluido = false, minimo = FREQUENCIA_MINIMA, lista = carregar() } = {}) {
    const dadas = aulasDadas(aulas, ref);
    const regs = registrosDe(turmaId, alunoId, lista);
    const n = { presentes: 0, ausentes: 0, justificadas: 0, atrasos: 0, semRegistro: 0 };
    dadas.forEach((a) => {
      const r = regs.find((x) => daAula(x, a));
      if (!r) n.semRegistro += 1;
      else if (r.status === 'presente') n.presentes += 1;
      else if (r.status === 'atraso') n.atrasos += 1;
      else if (r.status === 'justificada') n.justificadas += 1;
      else n.ausentes += 1;
    });
    const validas = n.presentes + n.atrasos + n.justificadas;
    const percentual = dadas.length ? Math.round((validas / dadas.length) * 100) : null;
    let status = 'sem_aulas';
    if (dadas.length) {
      if (percentual >= minimo + 10) status = 'ok';
      else if (percentual >= minimo) status = 'atencao';
      else status = concluido ? 'reprovado_frequencia' : 'risco';
    }
    return { dadas: dadas.length, validas, ...n, faltas: n.ausentes + n.semRegistro, percentual, minimo, status, abaixoDoMinimo: percentual != null && percentual < minimo };
  }

  // Faltas SEGUIDAS do aluno na turma: conta pelas últimas aulas dadas, do fim para o início, até achar
  // uma presença (presente, atraso ou justificada — tudo o que `conta`). Falta = ausente ou sem registro [sup.].
  // Devolve { n, ultimaFalta, inicioSequencia }: `ultimaFalta` é a falta mais recente MESMO quando a sequência
  // já foi quebrada (n = 0) — serve para saber se um contato feito depois dela ainda vale. Usado pelos
  // alertas de frequência (js/alertas-frequencia-motor.js): "começou a faltar" = 2 seguidas, "faltando demais" = 3+.
  function faltasSeguidas(turmaId, alunoId, aulas, ref = hoje(), { lista = carregar() } = {}) {
    const dadas = aulasDadas(aulas, ref).slice().sort((a, b) => a.data.localeCompare(b.data));
    const regs = registrosDe(turmaId, alunoId, lista);
    const faltou = (a) => { const r = regs.find((x) => daAula(x, a)); return !r || !conta(r.status); };
    let n = 0; let inicioSequencia = null; let quebrou = false; let ultimaFalta = null;
    for (let i = dadas.length - 1; i >= 0; i -= 1) {
      const a = dadas[i];
      if (!faltou(a)) { quebrou = true; continue; }
      if (!ultimaFalta) ultimaFalta = a.data;
      if (quebrou) break;
      n += 1; inicioSequencia = a.data;
    }
    return { n, ultimaFalta, inicioSequencia };
  }

  // Soma de várias frequências (formação / aluno inteiro): percentual global e pior situação.
  function consolidar(fs, { concluido = false, minimo = FREQUENCIA_MINIMA } = {}) {
    const com = fs.filter((f) => f && f.dadas > 0);
    const soma = (k) => com.reduce((s, f) => s + f[k], 0);
    const dadas = soma('dadas');
    const validas = soma('validas');
    const percentual = dadas ? Math.round((validas / dadas) * 100) : null;
    let status = 'sem_aulas';
    if (dadas) {
      if (percentual >= minimo + 10) status = 'ok';
      else if (percentual >= minimo) status = 'atencao';
      else status = concluido ? 'reprovado_frequencia' : 'risco';
    }
    return { dadas, validas, presentes: soma('presentes'), ausentes: soma('ausentes'), justificadas: soma('justificadas'), atrasos: soma('atrasos'), faltas: soma('faltas'), percentual, minimo, status, cursos: com.length, emRisco: com.filter((f) => f.status === 'risco').length, reprovados: com.filter((f) => f.status === 'reprovado_frequencia').length };
  }

  // ---------- Registro (chamada do professor — uso futuro) ----------

  const ehData = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v ?? ''));
  const ehHora = (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v ?? ''));
  // Chegada/saída só fazem sentido para quem esteve na aula (presente ou atraso).
  const temHorario = (status) => status === 'presente' || status === 'atraso';
  const minutosDe = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + m; };
  // Atraso em minutos a partir da chegada e do início da aula (null se não dá para calcular ou se chegou antes).
  function atrasoDe(chegada, inicio) {
    if (!ehHora(chegada) || !ehHora(inicio)) return null;
    const d = minutosDe(chegada) - minutosDe(inicio);
    return d > 0 ? d : null;
  }

  function validar(d) {
    const erros = [];
    if (!d.turmaId) erros.push({ campo: 'turmaId', mensagem: 'Informe a turma.' });
    if (!d.alunoId) erros.push({ campo: 'alunoId', mensagem: 'Informe o aluno.' });
    if (!ehData(d.data)) erros.push({ campo: 'data', mensagem: 'Informe a data da aula.' });
    if (!statusDe(d.status)) erros.push({ campo: 'status', mensagem: 'Escolha presente, atraso, falta justificada ou falta.' });
    if (d.status === 'atraso' && d.minutos != null && (!Number.isInteger(Number(d.minutos)) || Number(d.minutos) < 1)) erros.push({ campo: 'minutos', mensagem: 'Minutos de atraso em número inteiro (≥ 1).' });
    if (temHorario(d.status)) {
      if (d.chegada && !ehHora(d.chegada)) erros.push({ campo: 'chegada', mensagem: 'Horário de chegada no formato HH:MM.' });
      if (d.saida && !ehHora(d.saida)) erros.push({ campo: 'saida', mensagem: 'Horário de saída no formato HH:MM.' });
      if (ehHora(d.chegada) && ehHora(d.saida) && minutosDe(d.saida) <= minutosDe(d.chegada)) erros.push({ campo: 'saida', mensagem: 'A saída precisa ser depois da chegada.' });
    }
    return erros;
  }

  function limpar(d) {
    return {
      turmaId: d.turmaId, aulaId: d.aulaId ?? null, data: d.data, alunoId: d.alunoId, status: d.status,
      minutos: d.status === 'atraso' && d.minutos != null ? Number(d.minutos) : null,
      chegada: temHorario(d.status) && ehHora(d.chegada) ? d.chegada : null,
      saida: temHorario(d.status) && ehHora(d.saida) ? d.saida : null,
      observacao: String(d.observacao ?? '').trim(),
      registradoEm: d.registradoEm ?? new Date().toISOString().slice(0, 19),
    };
  }

  // Grava (ou substitui) o registro do aluno naquela aula. Retorna a lista nova.
  function registrar(lista, d) {
    const novo = limpar(d);
    const resto = lista.filter((r) => !(r.turmaId === novo.turmaId && r.alunoId === novo.alunoId && daAula(r, novo)));
    return [...resto, novo];
  }
  // Chamada inteira de uma aula: `itens` = [{ alunoId, status, minutos?, chegada?, saida?, observacao? }].
  const registrarLote = (lista, { turmaId, aulaId = null, data }, itens) => itens.reduce((l, it) => registrar(l, { turmaId, aulaId, data, ...it }), lista);

  return {
    CHAVE, carregar, salvar, invalidar,
    statusDe, statusFrequenciaDe, conta, aulasDadas, temHorario, atrasoDe,
    registrosDe, porAula, registroDe, frequencia, faltasSeguidas, consolidar, horarioTexto,
    validar, registrar, registrarLote,
  };
})();
