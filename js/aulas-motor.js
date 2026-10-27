// ============================================================
// Motor do "Agendamento das aulas" de uma turma: regras puras (sem DOM).
// A agenda (js/agenda.js) diz QUANDO as aulas costumam acontecer; o
// agendamento MATERIALIZA essas datas em aulas concretas, gravadas na
// própria turma (`turma.aulas`), para que cada uma possa ser remarcada,
// cancelada (feriado, instrutor indisponível…), reposta, ganhar sala ou
// instrutor diferente e o conteúdo previsto (módulos do curso).
// Enquanto `turma.aulas` é null, as telas mostram a PRÉVIA calculada pela
// agenda (Agenda.datasAulas); depois de gerar, vale o que está gravado.
// Persistência: dentro da turma (Turmas.salvar) — sem chave própria.
// ============================================================

const Aulas = (() => {
  const STATUS = [
    { id: 'prevista', nome: 'Prevista', descricao: 'Vai acontecer na data e horário marcados.' },
    { id: 'cancelada', nome: 'Cancelada', descricao: 'Não acontece; conta como aula perdida até ser reposta.' },
  ];
  const ORIGENS = [
    { id: 'agenda', nome: 'Pela agenda', descricao: 'Gerada a partir dos dias e horários da agenda.' },
    { id: 'reposicao', nome: 'Reposição', descricao: 'Repõe uma aula cancelada.' },
    { id: 'extra', nome: 'Extra', descricao: 'Incluída à mão, fora da agenda.' },
  ];
  // Motivos de cancelamento de aula (31/08/2026: lista ampliada para a realidade de uma escola — alunos indisponíveis,
  // infraestrutura, clima/desastre natural, transporte, saúde pública, segurança). Alimenta o polar "Aulas canceladas" do pedagógico.
  const MOTIVOS = [
    { id: 'feriado', nome: 'Feriado / recesso', descricao: 'Feriado, ponte ou recesso escolar.' },
    { id: 'instrutor', nome: 'Instrutor indisponível', descricao: 'Atestado, viagem, evento ou imprevisto do instrutor.' },
    { id: 'alunos', nome: 'Alunos indisponíveis', descricao: 'Maioria da turma sem condição de vir (provas, viagem da empresa, evento).' },
    { id: 'sala', nome: 'Sala indisponível', descricao: 'Manutenção, reserva conflitante ou laboratório sem condição de uso.' },
    { id: 'infra', nome: 'Infraestrutura (energia, internet, equipamentos)', descricao: 'Queda de energia ou de internet, equipamentos ou plataforma fora do ar.' },
    { id: 'clima', nome: 'Clima severo / desastre natural', descricao: 'Enchente, alagamento, tempestade, alerta da Defesa Civil.' },
    { id: 'transporte', nome: 'Transporte / acesso', descricao: 'Greve do transporte coletivo, vias bloqueadas, interdição do acesso.' },
    { id: 'saude_publica', nome: 'Saúde pública', descricao: 'Surto, decreto sanitário ou orientação de isolamento.' },
    { id: 'seguranca', nome: 'Segurança / ocorrência no local', descricao: 'Ocorrência policial, incêndio, evacuação ou risco no entorno.' },
    { id: 'escola', nome: 'Decisão da escola', descricao: 'Evento interno, confraternização, reorganização do calendário.' },
    { id: 'outro', nome: 'Outro', descricao: 'Descreva no campo de texto.' },
  ];

  // Feriados: vêm do cadastro (js/feriados-motor.js, tela feriados.html) quando
  // ele está carregado; senão, fallback com os nacionais de 2026/27. Só avisam —
  // não bloqueiam.
  const FERIADOS_FIXOS = [
    ['01-01', 'Confraternização Universal'], ['04-21', 'Tiradentes'], ['05-01', 'Dia do Trabalho'],
    ['09-07', 'Independência'], ['10-12', 'Nossa Senhora Aparecida'], ['11-02', 'Finados'],
    ['11-15', 'Proclamação da República'], ['11-20', 'Consciência Negra'], ['12-25', 'Natal'],
  ];
  const FERIADOS_MOVEIS = {
    2026: [['02-16', 'Carnaval'], ['02-17', 'Carnaval'], ['04-03', 'Sexta-feira Santa'], ['06-04', 'Corpus Christi']],
    2027: [['02-08', 'Carnaval'], ['02-09', 'Carnaval'], ['03-26', 'Sexta-feira Santa'], ['05-27', 'Corpus Christi']],
  };
  function feriado(iso) {
    if (!iso) return null;
    if (typeof Feriados !== 'undefined') return Feriados.nome(iso);
    const [ano, md] = [iso.slice(0, 4), iso.slice(5)];
    const achado = [...FERIADOS_FIXOS, ...(FERIADOS_MOVEIS[ano] ?? [])].find(([d]) => d === md);
    return achado ? achado[1] : null;
  }

  // ---------- Datas / horas ----------

  const ehData = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v ?? ''));
  const ehHora = (v) => /^\d{2}:\d{2}$/.test(String(v ?? ''));
  const minutos = (h) => { const [hh, mm] = h.split(':').map(Number); return hh * 60 + mm; };
  const horas = (a) => (ehHora(a.inicio) && ehHora(a.fim) ? Math.max(0, (minutos(a.fim) - minutos(a.inicio)) / 60) : 0);
  const somaHoras = (as) => as.reduce((s, a) => s + horas(a), 0);
  const diaDe = (iso) => Agenda.DIAS[(new Date(`${iso}T12:00:00`).getDay() + 6) % 7].id;
  const isoDe = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const somarDias = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return isoDe(d); };
  const mesDe = (iso) => iso.slice(0, 7);
  const sobrepoe = (a, b) => a.data === b.data && minutos(a.inicio) < minutos(b.fim) && minutos(b.inicio) < minutos(a.fim);

  function novoId(lista) {
    let n = lista.length + 1;
    while (lista.some((x) => x.id === `a${n}`)) n += 1;
    return `a${n}`;
  }

  const ordenar = (lista) => [...lista].sort((a, b) => a.data.localeCompare(b.data) || a.inicio.localeCompare(b.inicio));
  const ativas = (lista) => ordenar(lista).filter((a) => a.status !== 'cancelada');

  // Lista pronta para exibir: ordenada, com `n` (só as previstas contam) e `dia`.
  function numerar(lista) {
    let n = 0;
    return ordenar(lista).map((a) => ({ ...a, dia: diaDe(a.data), n: a.status === 'cancelada' ? null : ++n }));
  }

  // ---------- Geração ----------

  // Gera as aulas da turma pela agenda em vigor (uma por período × dia, entre início e fim).
  function gerar(turma, agenda) {
    const base = Agenda.datasAulas(agenda, turma.inicio, turma.fim);
    const lista = [];
    base.forEach((b) => lista.push({ id: novoId(lista), ...nova({ data: b.data, inicio: b.inicio, fim: b.fim, origem: 'agenda' }) }));
    return lista;
  }

  // Link do Google Meet da aula (V1, simulado): abc-defg-hij determinístico por turma + aula,
  // para a mesma aula ganhar sempre o mesmo link. shortcut: não cria a reunião de verdade; trocar pela API do Google Calendar.
  function meetUrl(turmaId, aula) {
    let h = 2166136261;
    for (const c of `${turmaId}:${aula.id}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
    let letras = '';
    for (let i = 0; i < 10; i += 1) { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; letras += String.fromCharCode(97 + ((h >>> 16) % 26)); }
    return `https://meet.google.com/${letras.slice(0, 3)}-${letras.slice(3, 7)}-${letras.slice(7)}`;
  }

  function nova({ data, inicio, fim, origem = 'extra', salaId = null, instrutorId = null, moduloIds = [], conteudo = '', observacoes = '' }) {
    return { data, inicio, fim, origem, status: 'prevista', motivo: null, salaId, instrutorId, moduloIds, conteudo, observacoes };
  }

  // Próxima data/horário livre pela agenda depois da última aula (para reposição).
  function proximoEncaixe(lista, agenda, aPartirDe) {
    if (!agenda?.periodos?.length) return null;
    const ultima = ativas(lista).at(-1);
    const inicio = somarDias(ultima ? ultima.data : aPartirDe, 1);
    const fim = somarDias(inicio, 120);
    const candidatas = Agenda.datasAulas(agenda, inicio, fim);
    const ocupadas = new Set(lista.map((a) => `${a.data} ${a.inicio}`));
    const c = candidatas.find((x) => !ocupadas.has(`${x.data} ${x.inicio}`) && !feriado(x.data));
    return c ? { data: c.data, inicio: c.inicio, fim: c.fim } : null;
  }

  // ---------- Empurrar (remarcar em cadeia) ----------

  const chaveSlot = (a) => `${a.data} ${a.inicio}`;
  const depoisOuIgual = (a, b) => a.data > b.data || (a.data === b.data && a.inicio >= b.inicio);

  // Quais aulas se movem junto com a `pivo` num remarque em cadeia.
  // escopo: 'turma' = as seguintes desta turma; 'formacao' = as seguintes de todas as turmas da formação.
  // `turmas` = [{ turma, aulas }] com as aulas já materializadas (agendadas ou prévia). Devolve
  // { movendo: [{turmaId, aula}], fixas: [{turmaId, aula}] } — só previstas; canceladas ficam onde estão.
  function planoEmpurrar(pivo, turmaId, turmas, escopo) {
    const movendo = []; const fixas = [];
    turmas.forEach(({ turma, aulas }) => {
      const participa = turma.id === turmaId || escopo === 'formacao';
      aulas.forEach((a) => {
        if (a.status === 'cancelada') return;
        const ehPivo = turma.id === turmaId && a.id === pivo.id;
        if (participa && (ehPivo || depoisOuIgual(a, pivo)) ) movendo.push({ turmaId: turma.id, aula: a, ehPivo });
        else fixas.push({ turmaId: turma.id, aula: a });
      });
    });
    movendo.sort((x, y) => (x.ehPivo ? -1 : y.ehPivo ? 1 : x.aula.data.localeCompare(y.aula.data) || x.aula.inicio.localeCompare(y.aula.inicio)));
    return { movendo, fixas };
  }

  // Remarca a pivô para `novo` {data, inicio, fim} e re-encaixa as seguintes, em ordem, nos próximos
  // encaixes da agenda depois dela (pulando encaixes já ocupados por aulas fixas). Devolve
  // { aulasPorTurma: Map<turmaId, aulas[]>, movidas: Map<turmaId, n> }.
  function empurrar(pivo, turmaId, turmas, escopo, novo, agenda) {
    const { movendo, fixas } = planoEmpurrar(pivo, turmaId, turmas, escopo);
    const ocupados = new Set(fixas.map((f) => chaveSlot(f.aula)));
    const slots = Agenda.datasAulas(agenda, somarDias(novo.data, 1), somarDias(novo.data, 730)).filter((s) => !ocupados.has(chaveSlot(s)));
    // Encaixes no mesmo dia da pivô, depois dela (ex.: sábado integral com dois períodos).
    const mesmoDia = Agenda.datasAulas(agenda, novo.data, novo.data).filter((s) => s.inicio >= novo.fim && !ocupados.has(chaveSlot(s)));
    const fila = [...mesmoDia, ...slots];
    const destino = new Map(); // `${turmaId}:${aulaId}` → {data, inicio, fim}
    movendo.forEach((m, i) => {
      if (m.ehPivo) { destino.set(`${m.turmaId}:${m.aula.id}`, { data: novo.data, inicio: novo.inicio, fim: novo.fim }); return; }
      const s = fila.shift();
      if (s) destino.set(`${m.turmaId}:${m.aula.id}`, { data: s.data, inicio: s.inicio, fim: s.fim });
    });
    const aulasPorTurma = new Map(); const movidas = new Map();
    turmas.forEach(({ turma, aulas }) => {
      let n = 0;
      const novas = aulas.map((a) => {
        const d = destino.get(`${turma.id}:${a.id}`);
        if (!d) return a;
        if (d.data !== a.data || d.inicio !== a.inicio || d.fim !== a.fim) n += 1;
        return { ...a, ...d };
      });
      aulasPorTurma.set(turma.id, novas); movidas.set(turma.id, n);
    });
    return { aulasPorTurma, movidas, movendo };
  }

  // Período da turma pelas aulas previstas (para acompanhar o remarque).
  function periodoDe(aulas, atual) {
    const prev = ativas(aulas);
    return prev.length ? { inicio: prev[0].data, fim: prev.at(-1).data } : atual;
  }

  // ---------- Conteúdo previsto ----------

  // Distribui os módulos do curso em sequência pelas horas das aulas previstas:
  // cada aula recebe os módulos que caem na sua janela de horas acumuladas.
  function distribuirConteudo(lista, curso) {
    const modulos = curso?.modulos ?? [];
    if (!modulos.length) return lista;
    const faixas = [];
    let acc = 0;
    modulos.forEach((m) => { const h = Number(m.cargaHoraria) || 0; faixas.push({ id: m.id, ini: acc, fim: acc + h }); acc += h; });
    let hAcc = 0;
    const porId = new Map();
    ativas(lista).forEach((a) => {
      const ini = hAcc; const fim = hAcc + horas(a); hAcc = fim;
      const ids = faixas.filter((f) => f.fim > ini && f.ini < fim && f.fim > f.ini).map((f) => f.id);
      porId.set(a.id, ids);
    });
    return lista.map((a) => (porId.has(a.id) ? { ...a, moduloIds: porId.get(a.id) } : a));
  }

  // ---------- Validação ----------

  function validar(dados, lista, turma, idAtual = null) {
    const erros = [];
    if (!ehData(dados.data)) erros.push({ campo: 'data', mensagem: 'Informe a data da aula.' });
    if (!ehHora(dados.inicio) || !ehHora(dados.fim)) erros.push({ campo: 'horario', mensagem: 'Informe início e fim.' });
    else if (minutos(dados.fim) <= minutos(dados.inicio)) erros.push({ campo: 'horario', mensagem: 'O fim precisa ser depois do início.' });
    if (ehData(dados.data) && ehHora(dados.inicio) && ehHora(dados.fim)) {
      const choque = lista.find((a) => a.id !== idAtual && a.status !== 'cancelada' && sobrepoe(a, dados));
      if (choque) erros.push({ campo: 'horario', mensagem: `Sobrepõe outra aula desta turma (${choque.inicio}–${choque.fim}).` });
    }
    if (dados.instrutorId && !INSTRUTORES.some((i) => i.id === dados.instrutorId)) erros.push({ campo: 'instrutorId', mensagem: 'Instrutor inválido.' });
    return erros;
  }

  // ---------- Pendências / conflitos ----------

  // Conflitos com aulas de OUTRAS turmas na mesma data/horário: mesma sala ou mesmo instrutor.
  // `outras` = [{ turma, aulas: [{data,inicio,fim,salaId,instrutorId}] }] já com sala/instrutor efetivos.
  function conflitos(aula, turma, outras) {
    const sala = aula.salaId ?? turma.salaId;
    const instrutor = aula.instrutorId ?? turma.instrutorId;
    const achados = [];
    outras.forEach(({ turma: o, aulas }) => {
      if (o.id === turma.id) return;
      aulas.forEach((b) => {
        if (b.status === 'cancelada' || !sobrepoe(aula, b)) return;
        if (sala && (b.salaId ?? o.salaId) === sala) achados.push({ tipo: 'sala', turma: o, aula: b });
        if (instrutor && (b.instrutorId ?? o.instrutorId) === instrutor) achados.push({ tipo: 'instrutor', turma: o, aula: b });
      });
    });
    return achados;
  }

  // Resumo do agendamento frente ao curso (horas) e ao período da turma.
  function resumo(lista, turma, curso, ref) {
    const previstas = ativas(lista);
    const canceladas = lista.filter((a) => a.status === 'cancelada');
    const realizadas = previstas.filter((a) => a.data < ref);
    const hPrevistas = somaHoras(previstas);
    const carga = Number(curso?.cargaHoraria) || 0;
    return {
      total: lista.length,
      previstas: previstas.length,
      canceladas: canceladas.length,
      realizadas: realizadas.length,
      horas: hPrevistas,
      horasRealizadas: somaHoras(realizadas),
      carga,
      diferenca: carga ? hPrevistas - carga : 0,
      // Reposição depois do fim é o esperado — não conta como fora do período.
      foraDoPeriodo: previstas.filter((a) => a.data < turma.inicio || (a.data > turma.fim && a.origem !== 'reposicao')).length,
      emFeriado: previstas.filter((a) => feriado(a.data)).length,
      semConteudo: curso?.modulos?.length ? previstas.filter((a) => !a.moduloIds.length && !a.conteudo).length : 0,
      primeira: previstas[0]?.data ?? null,
      ultima: previstas.at(-1)?.data ?? null,
    };
  }

  function pendencias(r) {
    const p = [];
    if (r.carga && Math.abs(r.diferenca) >= 0.5) p.push(r.diferenca > 0 ? `${fmtH(r.diferenca)} acima da carga horária do curso (${fmtH(r.carga)})` : `Faltam ${fmtH(-r.diferenca)} para a carga horária do curso (${fmtH(r.carga)})`);
    if (r.emFeriado) p.push(`${r.emFeriado} aula${r.emFeriado === 1 ? '' : 's'} em feriado`);
    if (r.foraDoPeriodo) p.push(`${r.foraDoPeriodo} aula${r.foraDoPeriodo === 1 ? '' : 's'} fora do período da turma`);
    if (r.semConteudo) p.push(`${r.semConteudo} aula${r.semConteudo === 1 ? '' : 's'} sem conteúdo previsto`);
    return p;
  }
  const fmtH = (h) => `${h.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h`;

  // ---------- CRUD (listas imutáveis) ----------

  function limpar(dados) {
    return {
      data: dados.data,
      inicio: dados.inicio,
      fim: dados.fim,
      salaId: dados.salaId || null,
      instrutorId: dados.instrutorId || null,
      moduloIds: [...new Set(dados.moduloIds ?? [])],
      conteudo: String(dados.conteudo ?? '').trim(),
      observacoes: String(dados.observacoes ?? '').trim(),
    };
  }

  function incluir(lista, dados, origem = 'extra') {
    const aula = { id: novoId(lista), ...nova({ origem }), ...limpar(dados) };
    return { lista: [...lista, aula], aula };
  }

  function atualizar(lista, id, dados) {
    return lista.map((a) => (a.id === id ? { ...a, ...limpar(dados) } : a));
  }

  function cancelar(lista, id, motivo) {
    return lista.map((a) => (a.id === id ? { ...a, status: 'cancelada', motivo: { tipo: motivo.tipo, texto: String(motivo.texto ?? '').trim() } } : a));
  }

  function restaurar(lista, id) {
    return lista.map((a) => (a.id === id ? { ...a, status: 'prevista', motivo: null } : a));
  }

  function remover(lista, id) {
    return lista.filter((a) => a.id !== id);
  }

  const motivoDe = (id) => MOTIVOS.find((m) => m.id === id)?.nome ?? id;

  return {
    STATUS, ORIGENS, MOTIVOS,
    feriado, horas, somaHoras, diaDe, mesDe, ordenar, ativas, numerar,
    gerar, meetUrl, nova, proximoEncaixe, planoEmpurrar, empurrar, periodoDe, distribuirConteudo, validar, conflitos, resumo, pendencias,
    incluir, atualizar, cancelar, restaurar, remover, motivoDe,
  };
})();
