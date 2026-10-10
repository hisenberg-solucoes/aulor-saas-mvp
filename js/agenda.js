// ============================================================
// Agenda de aulas: QUANDO e COMO as aulas acontecem — dias da semana,
// períodos (horário de início/fim), recorrência e formato. Definida pelo
// usuário na FORMAÇÃO (as turmas da formação herdam) ou na própria turma
// quando ela é avulsa. Substitui os turnos fixos (N, M, TQ…).
// Carregado antes de cursos-data.js (a semente usa Agenda.descrever).
// Estrutura: { formato, recorrencia, periodos: [{ dias: ['seg','qua'], inicio: '18:15', fim: '22:15' }] }
// ============================================================

const Agenda = (() => {
  const DIAS = [
    { id: 'seg', nome: 'Segunda', curto: 'Seg' },
    { id: 'ter', nome: 'Terça', curto: 'Ter' },
    { id: 'qua', nome: 'Quarta', curto: 'Qua' },
    { id: 'qui', nome: 'Quinta', curto: 'Qui' },
    { id: 'sex', nome: 'Sexta', curto: 'Sex' },
    { id: 'sab', nome: 'Sábado', curto: 'Sáb' },
    { id: 'dom', nome: 'Domingo', curto: 'Dom' },
  ];
  const RECORRENCIAS = [
    { id: 'semanal', nome: 'Semanal', descricao: 'Toda semana, nos dias marcados.' },
    { id: 'quinzenal', nome: 'Quinzenal', descricao: 'Semana sim, semana não.' },
    { id: 'mensal', nome: 'Mensal', descricao: 'Uma vez por mês, nos dias marcados.' },
  ];
  const FORMATOS_AULA = [
    { id: 'presencial', nome: 'Presencial', descricao: 'Na sala, todo mundo junto.' },
    { id: 'online', nome: 'Online', descricao: 'Ao vivo, pela sala virtual.' },
    { id: 'hibrido', nome: 'Híbrido', descricao: 'Presencial com transmissão.' },
  ];

  const ordemDia = (id) => DIAS.findIndex((d) => d.id === id);
  const vazia = () => ({ formato: null, recorrencia: 'semanal', periodos: [] });
  const periodo = (dias, inicio, fim) => ({ dias, inicio, fim });
  const criar = (formato, periodos, recorrencia = 'semanal') => ({ formato, recorrencia, periodos });

  const hora = (h) => {
    if (!h) return '';
    const [hh, mm] = h.split(':');
    return `${Number(hh)}h${mm && mm !== '00' ? mm : ''}`;
  };
  const diasTexto = (dias) => [...dias].sort((a, b) => ordemDia(a) - ordemDia(b)).map((d) => DIAS.find((x) => x.id === d)?.curto ?? d).join('/');

  // "Seg/Qua/Sex 18h15–22h15 · Sáb 8h–12h · quinzenal"
  function descrever(agenda, { comRecorrencia = true } = {}) {
    if (!agenda || !agenda.periodos?.length) return 'Agenda a definir';
    const partes = agenda.periodos.map((p) => `${diasTexto(p.dias)} ${hora(p.inicio)}–${hora(p.fim)}`);
    if (comRecorrencia && agenda.recorrencia && agenda.recorrencia !== 'semanal') partes.push(RECORRENCIAS.find((r) => r.id === agenda.recorrencia)?.nome.toLowerCase() ?? agenda.recorrencia);
    return partes.join(' · ');
  }

  // Sufixo para código de turma: M (manhã), T (tarde), N (noite) pelo primeiro período.
  function sufixoCodigo(agenda) {
    const p = agenda?.periodos?.[0];
    if (!p?.inicio) return '';
    const h = Number(p.inicio.split(':')[0]);
    return h < 12 ? 'M' : h < 18 ? 'T' : 'N';
  }

  // Horas de aula por semana (soma dos períodos), ignorando a recorrência.
  function horasPorSemana(agenda) {
    return (agenda?.periodos ?? []).reduce((s, p) => {
      const [hi, mi] = (p.inicio || '0:0').split(':').map(Number);
      const [hf, mf] = (p.fim || '0:0').split(':').map(Number);
      return s + Math.max(0, (hf * 60 + mf - hi * 60 - mi) / 60) * (p.dias?.length ?? 0);
    }, 0);
  }

  // Datas de aula entre `inicio` e `fim` (ISO), pela agenda: uma ocorrência por período × dia.
  // Recorrência: semanal = toda semana; quinzenal = semanas alternadas a partir da semana de início;
  // mensal = só a primeira ocorrência de cada dia da semana no mês.
  function datasAulas(agenda, inicio, fim) {
    if (!agenda?.periodos?.length || !inicio || !fim || fim < inicio) return [];
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const idDia = (d) => DIAS[(d.getDay() + 6) % 7].id; // getDay: 0 = domingo → índice 6
    const semanaDe = (d) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
    const primeiraSemana = semanaDe(new Date(`${inicio}T12:00:00`));
    const vistosNoMes = new Set();
    const aulas = [];
    for (let d = new Date(`${inicio}T12:00:00`); iso(d) <= fim; d.setDate(d.getDate() + 1)) {
      const dia = idDia(d);
      const periodos = agenda.periodos.filter((p) => p.dias.includes(dia));
      if (!periodos.length) continue;
      if (agenda.recorrencia === 'quinzenal') {
        const semanas = Math.round((semanaDe(d) - primeiraSemana) / (7 * 24 * 3600 * 1000));
        if (semanas % 2 !== 0) continue;
      } else if (agenda.recorrencia === 'mensal') {
        const chave = `${d.getFullYear()}-${d.getMonth()}-${dia}`;
        if (vistosNoMes.has(chave)) continue;
        vistosNoMes.add(chave);
      }
      periodos.forEach((p) => aulas.push({ data: iso(d), dia, inicio: p.inicio, fim: p.fim }));
    }
    return aulas.map((a, i) => ({ ...a, n: i + 1 }));
  }

  const ehHora = (v) => /^\d{2}:\d{2}$/.test(String(v ?? ''));

  function validar(agenda) {
    const erros = [];
    if (!agenda.formato || !FORMATOS_AULA.some((f) => f.id === agenda.formato)) erros.push({ campo: 'ag-formato', mensagem: 'Escolha o formato das aulas.' });
    if (!RECORRENCIAS.some((r) => r.id === agenda.recorrencia)) erros.push({ campo: 'ag-recorrencia', mensagem: 'Escolha a recorrência.' });
    if (!agenda.periodos.length) erros.push({ campo: 'ag-periodos', mensagem: 'Adicione pelo menos um período (dias + horário).' });
    agenda.periodos.forEach((p, i) => {
      if (!p.dias.length) erros.push({ campo: `ag-dias-${i}`, mensagem: 'Marque pelo menos um dia.' });
      if (!ehHora(p.inicio) || !ehHora(p.fim)) erros.push({ campo: `ag-horario-${i}`, mensagem: 'Informe início e fim.' });
      else if (p.fim <= p.inicio) erros.push({ campo: `ag-horario-${i}`, mensagem: 'O fim precisa ser depois do início.' });
    });
    return erros;
  }

  function normalizar(agenda) {
    return {
      formato: agenda.formato || null,
      recorrencia: agenda.recorrencia || 'semanal',
      periodos: (agenda.periodos ?? []).map((p) => ({ dias: [...new Set(p.dias)].sort((a, b) => ordemDia(a) - ordemDia(b)), inicio: p.inicio, fim: p.fim })),
    };
  }

  // ---------- Editor (usado dentro dos drawers das telas) ----------

  const OPCAO = 'cursor-pointer rounded-lg border p-3 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 border-slate-300 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500 transition';
  const DIA = 'cursor-pointer select-none rounded-md border px-2 py-1 text-xs font-medium has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800 dark:has-[:checked]:bg-sky-400 has-[:checked]:text-white dark:has-[:checked]:text-black border-slate-300 dark:border-neutral-700 text-slate-600 dark:text-neutral-300 hover:border-slate-400 dark:hover:border-neutral-500 transition';
  const ERRO = (campo) => `<p data-erro="${campo}" class="text-xs text-red-600 dark:text-red-400 mt-1 hidden"></p>`;
  const LIXEIRA = '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>';

  const cartoes = (name, opcoes, valor, colunas) => `
    <div class="grid ${colunas} gap-2">
      ${opcoes.map((o) => `
      <label class="${OPCAO}">
        <input type="radio" name="${name}" value="${o.id}" class="sr-only" ${valor === o.id ? 'checked' : ''}>
        <p class="text-sm font-medium text-slate-800 dark:text-neutral-100">${o.nome}</p>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${o.descricao}</p>
      </label>`).join('')}
    </div>`;

  const linhaPeriodo = (p, i) => `
    <div data-periodo="${i}" class="rounded-lg border border-slate-200 dark:border-neutral-800 p-3 space-y-2">
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-wrap gap-1">
          ${DIAS.map((d) => `<label class="${DIA}"><input type="checkbox" name="ag-dia-${i}" value="${d.id}" class="sr-only" ${p.dias.includes(d.id) ? 'checked' : ''}>${d.curto}</label>`).join('')}
        </div>
        <button type="button" data-remover-periodo="${i}" title="Remover período" class="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-md text-slate-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition">${LIXEIRA}</button>
      </div>
      ${ERRO(`ag-dias-${i}`)}
      <div class="flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-300">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">das</span>
        <input type="time" name="ag-inicio-${i}" value="${p.inicio ?? ''}" step="300" class="campo w-32">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">às</span>
        <input type="time" name="ag-fim-${i}" value="${p.fim ?? ''}" step="300" class="campo w-32">
      </div>
      ${ERRO(`ag-horario-${i}`)}
    </div>`;

  // Corpo do editor. Os erros usam data-erro compatível com o mostrarErros das telas.
  function corpo(agenda = vazia()) {
    return `
      <fieldset>
        <legend class="rotulo">Formato das aulas</legend>
        ${cartoes('ag-formato', FORMATOS_AULA, agenda.formato, 'grid-cols-3')}
        ${ERRO('ag-formato')}
      </fieldset>
      <div>
        <div class="flex items-center justify-between mb-1">
          <p class="rotulo mb-0">Dias e horários</p>
          <button type="button" data-add-periodo class="inline-flex items-center gap-1 text-xs font-medium text-petrol-800 dark:text-sky-300 hover:underline">+ Adicionar período</button>
        </div>
        <div data-periodos class="space-y-2">${agenda.periodos.map(linhaPeriodo).join('')}</div>
        <p data-periodos-vazio class="text-xs text-slate-400 ${agenda.periodos.length ? 'hidden' : ''}">Nenhum período. Ex.: Seg/Qua/Sex das 18:15 às 22:15; ou Sáb das 8:00 às 12:00 e das 13:00 às 19:00.</p>
        ${ERRO('ag-periodos')}
        <p data-agenda-resumo class="text-xs text-slate-500 dark:text-neutral-400 mt-2"></p>
      </div>
      <fieldset>
        <legend class="rotulo">Recorrência</legend>
        ${cartoes('ag-recorrencia', RECORRENCIAS, agenda.recorrencia ?? 'semanal', 'grid-cols-3')}
        ${ERRO('ag-recorrencia')}
      </fieldset>`;
  }

  // Lê a agenda direto do DOM (as linhas são dinâmicas).
  function ler(form) {
    const periodos = [...form.querySelectorAll('[data-periodo]')].map((el) => ({
      dias: [...el.querySelectorAll('input[type="checkbox"]:checked')].map((c) => c.value),
      inicio: el.querySelector('input[name^="ag-inicio-"]')?.value ?? '',
      fim: el.querySelector('input[name^="ag-fim-"]')?.value ?? '',
    }));
    return {
      formato: form.querySelector('[name="ag-formato"]:checked')?.value ?? null,
      recorrencia: form.querySelector('[name="ag-recorrencia"]:checked')?.value ?? 'semanal',
      periodos,
    };
  }

  // Liga adicionar/remover período e o resumo ao vivo. `aoMudar` é opcional.
  function ligar(form, aoMudar = null) {
    const lista = form.querySelector('[data-periodos]');
    const vazioEl = form.querySelector('[data-periodos-vazio]');
    const resumo = form.querySelector('[data-agenda-resumo]');
    const atualizar = () => {
      const ag = ler(form);
      vazioEl.classList.toggle('hidden', ag.periodos.length > 0);
      const h = horasPorSemana(ag);
      resumo.textContent = ag.periodos.length ? `${descrever(ag)}${h ? ` · ${h.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h por semana` : ''}` : '';
      aoMudar?.(ag);
    };
    const ligarLinhas = () => {
      lista.querySelectorAll('[data-remover-periodo]').forEach((b) => b.addEventListener('click', () => { b.closest('[data-periodo]').remove(); reindexar(); atualizar(); }));
    };
    const reindexar = () => {
      lista.querySelectorAll('[data-periodo]').forEach((el, i) => {
        el.dataset.periodo = i;
        el.querySelectorAll('input[type="checkbox"]').forEach((c) => { c.name = `ag-dia-${i}`; });
        el.querySelector('input[name^="ag-inicio-"]').name = `ag-inicio-${i}`;
        el.querySelector('input[name^="ag-fim-"]').name = `ag-fim-${i}`;
        el.querySelector('[data-erro^="ag-dias-"]').dataset.erro = `ag-dias-${i}`;
        el.querySelector('[data-erro^="ag-horario-"]').dataset.erro = `ag-horario-${i}`;
      });
    };
    form.querySelector('[data-add-periodo]').addEventListener('click', () => {
      const i = lista.querySelectorAll('[data-periodo]').length;
      const anterior = ler(form).periodos[i - 1];
      lista.insertAdjacentHTML('beforeend', linhaPeriodo({ dias: [], inicio: anterior?.inicio ?? '', fim: anterior?.fim ?? '' }, i));
      ligarLinhas();
      atualizar();
      lista.querySelector(`[data-periodo="${i}"] input[type="checkbox"]`)?.focus();
    });
    form.addEventListener('change', atualizar);
    form.addEventListener('input', atualizar);
    ligarLinhas();
    atualizar();
  }

  return { DIAS, RECORRENCIAS, FORMATOS_AULA, vazia, criar, periodo, descrever, sufixoCodigo, horasPorSemana, datasAulas, validar, normalizar, corpo, ler, ligar };
})();
