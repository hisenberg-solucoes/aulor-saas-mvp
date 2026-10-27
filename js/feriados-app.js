// ============================================================
// UI da tela "Feriados" (feriados.html). Regras em Feriados.* (js/feriados-motor.js).
// Visões: Calendário (12 meses; todo dia sem aula leva a mesma marca e o tipo vai em
// texto, porque para o agendamento todo tipo quer dizer "não tem aula") e Lista (tabela
// por mês; a linha inteira abre o feriado). Formulário e exclusão em modal.
// As aulas que ainda caem num feriado vêm das turmas (Turmas.aulas) e ganham o cobre do
// "é com você": ponto no dia, coluna na lista e faixa no topo.
// ============================================================

const HOJE = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10); // data local do navegador
const ANO_ATUAL = Number(HOJE.slice(0, 4));

const estado = {
  lista: Feriados.carregar(),
  visao: 'calendario', // calendario | lista
  ano: ANO_ATUAL,
  filtros: { busca: '', tipo: '' },
};

const ICONE = {
  mais: '<svg class="h-4 w-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>',
  lupa: '<svg class="h-4 w-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>',
  fechar: '<svg class="h-5 w-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>',
  esq: '<svg class="h-4 w-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>',
  dir: '<svg class="h-4 w-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>',
  alerta: '<svg class="h-5 w-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>',
  info: '<svg class="h-5 w-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>',
};

// O anel de foco vem da regra da página (--f-foco); os campos usam o próprio contorno.
const BOTAO_SEC = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium whitespace-nowrap border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition disabled:opacity-40 disabled:pointer-events-none';
const BOTAO_PRI = 'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold whitespace-nowrap bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800 text-white shadow-sm transition';
const BOTAO_ICONE = 'inline-grid place-items-center h-9 w-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition';
const BOTAO_FECHAR = 'inline-grid place-items-center h-8 w-8 rounded-md text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-100 hover:bg-slate-100 dark:hover:bg-neutral-900 transition';
const BOTAO_CANCELAR = 'inline-flex items-center h-9 px-3.5 rounded-lg text-sm font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition';
const BOTAO_PERIGO = 'inline-flex items-center h-9 px-3.5 rounded-lg text-sm font-semibold whitespace-nowrap bg-red-600 hover:bg-red-700 text-white shadow-sm transition';
const BOTAO_EXCLUIR = 'inline-flex items-center h-8 px-2.5 -ml-2.5 rounded-md text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition';
const BOTAO_LINK = 'inline-flex items-center gap-1 text-sm font-medium text-petrol-800 dark:text-sky-300 hover:underline underline-offset-2 rounded-sm';
const LINK = 'font-medium text-petrol-800 dark:text-sky-300 hover:underline underline-offset-2';
const CAMPO_BUSCA = 'h-9 w-64 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 pl-8 pr-3 text-sm text-slate-700 dark:text-neutral-200 placeholder:text-slate-500 dark:placeholder:text-neutral-400 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400 focus:ring-2 focus:ring-petrol-800/20 dark:focus:ring-sky-400/20';
const SELECT_FILTRO = 'h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2.5 text-sm text-slate-700 dark:text-neutral-200 focus:border-petrol-800 dark:focus:border-sky-400';
const FILTRO_ATIVO = 'border-petrol-800 dark:border-sky-400 text-petrol-800 dark:text-sky-300';
const CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)]';
const TH = 'px-4 py-2.5 font-medium';
const TD = 'px-4 py-2.5 text-sm text-slate-600 dark:text-neutral-300';
const THEAD = 'text-xs font-medium text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800';
const FOCO_LINHA = 'has-[.link-registro:focus-visible]:bg-slate-50 dark:has-[.link-registro:focus-visible]:bg-neutral-900 has-[.link-registro:focus-visible]:outline-2 has-[.link-registro:focus-visible]:-outline-offset-2 has-[.link-registro:focus-visible]:outline-[color:var(--f-foco)]';
const OPCAO = 'cursor-pointer rounded-lg border border-slate-300 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--f-foco)] transition';
const TINTA = 'text-slate-900 dark:text-neutral-100';
const VALOR = 'text-slate-800 dark:text-neutral-100';
const APOIO = 'text-slate-500 dark:text-neutral-400'; // rótulo, subtítulo e vazio (4,76:1 no cartão)
const APOIO_FUNDO = 'text-slate-600 dark:text-neutral-400'; // o mesmo papel direto sobre o fundo (6,93:1; o slate-500 dá 4,36:1)
const AVISO = 'text-[color:var(--f-aviso)]'; // cobre-tinta: ainda há aula prevista no feriado
// Dia sem aula: tinta sobre etiqueta, a mesma marca para todo tipo. Ponto cobre quando ainda há aula prevista; hoje em petróleo.
const SEM_AULA = 'bg-slate-200 dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 font-semibold';
const PONTO_AULA = 'bg-[color:var(--f-aviso)]';
const HOJE_ANEL = 'ring-2 ring-[color:var(--f-marca-tinta)]';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const fmtData = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const fmtDiaMes = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const dataDoDia = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const diaSemana = (iso) => { const t = new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long' }); return t.charAt(0).toUpperCase() + t.slice(1); };
const plural = (n, s, p = `${s}s`) => `${n} ${n === 1 ? s : p}`;
const juntar = (itens) => (itens.length > 1 ? `${itens.slice(0, -1).join(', ')} e ${itens.at(-1)}` : itens[0] ?? '');
const persistir = () => Feriados.salvar(estado.lista);
const tipoNome = (id) => Feriados.tipoDe(id).nome;
const periodoTexto = (o) => (o.total > 1 ? `${fmtData(o.de)} → ${fmtData(o.ate)}` : fmtData(o.de));
const repeticao = (o) => (o.recorrente ? 'Todo ano' : `Só em ${o.de.slice(0, 4)}${o.ate.slice(0, 4) !== o.de.slice(0, 4) ? `–${o.ate.slice(2, 4)}` : ''}`);
// Quando o cadastro acontece, dito em uma linha: "todo ano em 25/12" ou "24/12/2026 a 03/01/2027".
const quando = (f) => (f.recorrente
  ? `todo ano em ${fmtDiaMes(f.data)}${f.dataFim ? ` a ${fmtDiaMes(f.dataFim)}` : ''}`
  : `${fmtData(f.data)}${f.dataFim ? ` a ${fmtData(f.dataFim)}` : ''}`);

// ---------- Aulas que caem em feriado ----------

// Aulas previstas de hoje em diante, por dia, das turmas que ainda não terminaram (Turmas.aulas já tira as canceladas).
const CURSOS = typeof Cursos === 'undefined' ? [] : Cursos.carregar();
const AULAS_POR_DIA = (() => {
  const m = new Map();
  if (typeof Turmas === 'undefined') return m;
  Cursos.todasTurmas().forEach((t) => {
    if (['cancelada', 'concluida'].includes(Turmas.situacao(t, HOJE))) return;
    Turmas.aulas(t).forEach((a) => { if (a.data >= HOJE) m.set(a.data, [...(m.get(a.data) ?? []), t]); });
  });
  return m;
})();
const ULTIMO_ANO_COM_AULA = Math.max(ANO_ATUAL, ...[...AULAS_POR_DIA.keys()].map((d) => Number(d.slice(0, 4))));

function diasEntre(de, ate) {
  const dias = [];
  for (let d = de; d <= ate; d = Feriados.addDias(d, 1)) dias.push(d);
  return dias;
}

// Aulas e turmas num conjunto de dias, a turma com mais aulas primeiro.
function impacto(dias) {
  const porTurma = new Map();
  let aulas = 0;
  new Set(dias).forEach((d) => (AULAS_POR_DIA.get(d) ?? []).forEach((t) => {
    aulas += 1;
    porTurma.set(t.id, { t, n: (porTurma.get(t.id)?.n ?? 0) + 1 });
  }));
  return { aulas, turmas: [...porTurma.values()].sort((a, b) => b.n - a.n || a.t.codigo.localeCompare(b.t.codigo, 'pt-BR')) };
}
// Todos os dias do cadastro de hoje em diante: o recorrente, em cada ano que ainda tem turma.
function impactoCadastro(f) {
  const dias = [];
  for (let ano = ANO_ATUAL; ano <= ULTIMO_ANO_COM_AULA; ano += 1) dias.push(...Feriados.diasNoAno(f, ano));
  return impacto(dias);
}
const textoImpacto = (imp) => `${plural(imp.aulas, 'aula')} de ${plural(imp.turmas.length, 'turma')}`;
const cursoDe = (t) => CURSOS.find((c) => c.id === t.cursoId)?.nome ?? '';
// Cada turma leva à aba Aulas dela, onde se remarca ou cancela.
function turmasAfetadas(imp, max = 4) {
  const links = imp.turmas.slice(0, max).map(({ t, n }) => `<a href="turma.html?id=${encodeURIComponent(t.id)}&aba=aulas" class="${LINK}" title="${esc(cursoDe(t))}">${esc(t.codigo)}</a> <span class="tabular-nums">(${n})</span>`);
  const resto = imp.turmas.length - max;
  return juntar(resto > 0 ? [...links, `mais ${plural(resto, 'turma')}`] : links);
}

// ---------- URL ----------

function lerUrl() {
  const p = new URLSearchParams(location.search);
  if (['calendario', 'lista'].includes(p.get('visao'))) estado.visao = p.get('visao');
  if (/^\d{4}$/.test(p.get('ano') ?? '')) estado.ano = Number(p.get('ano'));
}
function gravarUrl() {
  const p = new URLSearchParams();
  p.set('visao', estado.visao); p.set('ano', String(estado.ano));
  history.replaceState(null, '', `${location.pathname}?${p}`);
}

// ---------- Topo: título e faixas ----------

// Faixa só quando alguém precisa agir (Regra da Faixa que Pede Ação). Sem contorno.
function faixa(tom, html, acao = '') {
  const cores = {
    aviso: 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
    passo: 'bg-petrol-800/10 dark:bg-sky-950/40 text-petrol-900 dark:text-sky-100',
  };
  return `<div class="mb-4 flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${cores[tom]}"><span class="shrink-0">${tom === 'aviso' ? ICONE.alerta : ICONE.info}</span><div class="min-w-0 flex-1 self-center">${html}</div>${acao}</div>`;
}

function renderTopo(doAno) {
  const imp = impacto(doAno.flatMap((o) => diasEntre(o.inicio, o.fim)));
  const faltam = estado.ano >= ANO_ATUAL ? Feriados.faltando(estado.lista, estado.ano - 1, estado.ano) : [];
  return `
    <div class="mb-4">
      <h2 class="font-display text-xl font-semibold ${TINTA}">Feriados</h2>
      <p class="max-w-3xl text-sm ${APOIO_FUNDO} mt-0.5">Os dias sem aula da escola: feriados, pontos facultativos e recessos. Ao gerar as aulas de uma turma, esses dias ficam de fora.</p>
    </div>
    ${imp.aulas ? faixa('aviso', `<span class="font-medium">${textoImpacto(imp)} ainda ${imp.aulas === 1 ? 'cai' : 'caem'} em feriados de ${estado.ano}.</span> Remarque ou cancele na aba Aulas de cada turma: ${turmasAfetadas(imp)}.`) : ''}
    ${faltam.length ? faixa('passo', `<span class="font-medium">${estado.ano} ainda não tem ${faltam.length === 1 ? 'um feriado' : `${faltam.length} feriados`} que ${estado.ano - 1} teve:</span> ${esc(juntar(faltam.map((f) => f.nome)))}. Os que dependem da Páscoa ganham as datas de ${estado.ano}; os outros vão para o mesmo dia.`,
      `<button type="button" id="btn-copiar" class="${BOTAO_SEC} h-8 shrink-0 self-center">Copiar de ${estado.ano - 1}</button>`) : ''}`;
}

// ---------- Barra: visão, ano e filtros ----------

function renderBarra() {
  const f = estado.filtros;
  const filtrando = f.busca || f.tipo;
  const anos = [...new Set([...Feriados.anos(estado.lista), ANO_ATUAL, estado.ano - 1, estado.ano, estado.ano + 1])].sort();
  const abas = [['calendario', 'Calendário'], ['lista', 'Lista']];
  return `
    <div class="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div role="tablist" aria-label="Visão" class="flex gap-4 shadow-[inset_0_-1px_0] shadow-slate-200 dark:shadow-neutral-800">
        ${abas.map(([id, nome]) => `<button type="button" role="tab" id="visao-${id}" data-visao="${id}" aria-selected="${estado.visao === id}" class="px-0.5 pb-2.5 text-sm border-b-2 transition whitespace-nowrap ${estado.visao === id ? `border-[color:var(--f-marca-tinta)] ${TINTA} font-medium` : `border-transparent ${APOIO_FUNDO} hover:text-slate-800 dark:hover:text-neutral-200`}">${nome}</button>`).join('')}
      </div>
      <div class="flex items-center gap-2">
        <button type="button" id="ano-ant" data-ano="-1" class="${BOTAO_ICONE}" aria-label="Ano anterior" title="Ano anterior">${ICONE.esq}</button>
        <select id="ano" aria-label="Ano" class="${SELECT_FILTRO} tabular-nums font-semibold">${anos.map((a) => `<option value="${a}" ${a === estado.ano ? 'selected' : ''}>${a}</option>`).join('')}</select>
        <button type="button" id="ano-prox" data-ano="1" class="${BOTAO_ICONE}" aria-label="Próximo ano" title="Próximo ano">${ICONE.dir}</button>
        <button type="button" id="ano-atual" data-ano="0" class="${BOTAO_SEC}" ${estado.ano === ANO_ATUAL ? 'disabled' : ''}>Ano atual</button>
      </div>
    </div>
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <label class="relative"><span class="sr-only">Buscar feriado</span><span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-neutral-400">${ICONE.lupa}</span><input type="search" id="busca" value="${esc(f.busca)}" placeholder="Buscar por nome ou observação" class="${CAMPO_BUSCA}"></label>
      <select id="filtro-tipo" aria-label="Tipo" class="${SELECT_FILTRO} ${f.tipo ? FILTRO_ATIVO : ''}"><option value="">Todos os tipos</option>${TIPOS_FERIADO.map((t) => `<option value="${t.id}" ${t.id === f.tipo ? 'selected' : ''}>${t.nome}</option>`).join('')}</select>
      ${filtrando ? `<button type="button" id="btn-limpar" class="${BOTAO_LINK} px-1">Limpar</button>` : ''}
      <button type="button" id="btn-novo" class="${BOTAO_PRI} ml-auto">${ICONE.mais} Novo feriado</button>
    </div>`;
}

// ---------- Calendário (ano) ----------

function renderCalendario(visiveis) {
  const porDia = Feriados.porDia(visiveis, estado.ano);
  const doDia = (d) => porDia.get(d) ?? [];

  // Período é uma faixa contínua: arredonda só onde o mesmo cadastro começa ou termina (ou a semana vira).
  const celula = (iso, col, parada) => {
    if (!iso) return '<span aria-hidden="true"></span>';
    const fs = [...doDia(iso)].sort((a, b) => a.total - b.total); // o mais curto primeiro: o Natal dentro do recesso
    const ehHoje = iso === HOJE;
    const aulas = fs.length ? AULAS_POR_DIA.get(iso)?.length ?? 0 : 0;
    const segue = (outro) => doDia(outro).some((x) => fs.some((y) => y.id === x.id));
    const ini = col === 0 || !segue(Feriados.addDias(iso, -1));
    const fim = col === 6 || !segue(Feriados.addDias(iso, 1));
    const forma = fs.length
      ? `${SEM_AULA} hover:bg-slate-300 dark:hover:bg-neutral-700 ${ini ? 'rounded-l-full ml-0.5' : ''} ${fim ? 'rounded-r-full mr-0.5' : ''}`
      : `rounded-full hover:bg-slate-100 dark:hover:bg-neutral-900 ${ehHoje ? 'font-semibold text-[color:var(--f-marca-tinta)]' : col === 0 ? APOIO : VALOR}`;
    const rotulo = [dataDoDia(iso), ehHoje && 'hoje', ...fs.map((x) => `${x.nome} (${tipoNome(x.tipo).toLowerCase()})`), aulas && `ainda com ${plural(aulas, 'aula prevista', 'aulas previstas')}`].filter(Boolean).join(', ');
    const dica = fs.length ? [...fs.map((x) => `${x.nome} · ${tipoNome(x.tipo)}`), aulas ? `${plural(aulas, 'aula prevista', 'aulas previstas')} neste dia` : ''].filter(Boolean).join('\n') : `Cadastrar feriado em ${fmtData(iso)}`;
    return `<button type="button" id="dia-${iso}" data-dia="${iso}" ${fs.length ? `data-feriado="${fs[0].id}"` : ''} tabindex="${iso === parada ? 0 : -1}" aria-label="${esc(fs.length ? rotulo : `${rotulo}: cadastrar feriado`)}" title="${esc(dica)}" class="relative h-8 text-xs tabular-nums transition ${forma}">${Number(iso.slice(8))}${ehHoje ? `<span aria-hidden="true" class="pointer-events-none absolute inset-y-0.5 left-1/2 w-7 -translate-x-1/2 rounded-full ${HOJE_ANEL}"></span>` : ''}${aulas ? `<span aria-hidden="true" class="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${PONTO_AULA}"></span>` : ''}</button>`;
  };

  const datasCurtas = (o) => (o.total === 1 ? o.de.slice(8)
    : o.de.slice(0, 7) === o.ate.slice(0, 7) ? `${o.de.slice(8)}–${o.ate.slice(8)}` : `${fmtDiaMes(o.de)}–${fmtDiaMes(o.ate)}`);
  const item = (o, m) => `
    <li><button type="button" id="item-${o.id}-${m}" data-editar="${o.id}" class="group w-full flex items-baseline gap-2 rounded-sm text-left text-[13px]">
      <span class="shrink-0 tabular-nums ${APOIO}">${datasCurtas(o)}</span>
      <span class="min-w-0 ${VALOR} group-hover:underline underline-offset-2">${esc(o.nome)}</span>
      ${o.imp.aulas ? `<span class="ml-auto shrink-0 tabular-nums ${AVISO}" title="${esc(`${textoImpacto(o.imp)} ainda neste feriado`)}">${plural(o.imp.aulas, 'aula')}</span>` : ''}
    </button></li>`;

  const mes = (m) => {
    const semanas = Feriados.gradeDoMes(estado.ano, m);
    const dias = semanas.flat().filter(Boolean);
    // Uma parada de Tab por mês (as setas andam entre os dias): hoje, o primeiro feriado ou o dia 1.
    const parada = dias.find((d) => d === HOJE) ?? dias.find((d) => porDia.has(d)) ?? dias[0];
    const doMes = visiveis.filter((o) => Number(o.inicio.slice(5, 7)) <= m && Number(o.fim.slice(5, 7)) >= m);
    return `
      <section class="${CARTAO} p-4" aria-labelledby="mes-${m}">
        <h3 id="mes-${m}" class="text-[15px] font-semibold ${TINTA}">${MESES[m - 1]}</h3>
        <div class="mt-3 grid grid-cols-7 text-center text-xs ${APOIO}" aria-hidden="true">${DIAS.map((d) => `<span>${d}</span>`).join('')}</div>
        <div data-mes="${m}" role="group" aria-label="${MESES[m - 1]} de ${estado.ano}" class="mt-1 grid grid-cols-7 gap-y-0.5">${semanas.flat().map((iso, i) => celula(iso, i % 7, parada)).join('')}</div>
        ${doMes.length ? `<ul class="mt-3 space-y-1">${doMes.map((o) => item(o, m)).join('')}</ul>` : ''}
      </section>`;
  };

  const amostra = (classe, conteudo = '') => `<span aria-hidden="true" class="relative inline-grid place-items-center h-6 w-7 rounded-full text-xs tabular-nums ${classe}">${conteudo}</span>`;
  return `
    <div class="grid gap-4 grid-cols-3 xl:grid-cols-4">${MESES.map((_, i) => mes(i + 1)).join('')}</div>
    <div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs ${APOIO_FUNDO}">
      <span class="tabular-nums">${visiveis.length ? `${plural(visiveis.length, 'feriado')} em ${estado.ano}` : `Nenhum feriado em ${estado.ano}${estado.filtros.busca || estado.filtros.tipo ? ' com esses filtros' : ''}`}</span>
      <span class="inline-flex items-center gap-1.5">${amostra(SEM_AULA, '25')}sem aula</span>
      <span class="inline-flex items-center gap-1.5">${amostra(`${SEM_AULA}`, `8<span class="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${PONTO_AULA}"></span>`)}ainda tem aula prevista</span>
      <span class="inline-flex items-center gap-1.5">${amostra(`${HOJE_ANEL} font-semibold text-[color:var(--f-marca-tinta)]`, Number(HOJE.slice(8)))}hoje</span>
      <span>Clique num dia para cadastrar ou editar; as setas andam entre os dias.</span>
    </div>`;
}

// ---------- Lista ----------

function renderLista(visiveis, totalAno) {
  const filtrando = estado.filtros.busca || estado.filtros.tipo;
  const linha = (o) => `
    <tr data-editar="${o.id}" class="cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-900 transition ${FOCO_LINHA}">
      <td class="${TD} tabular-nums whitespace-nowrap">
        <p class="${VALOR}">${periodoTexto(o)}</p>
        <p class="text-xs ${APOIO}">${o.total > 1 ? plural(o.total, 'dia') : diaSemana(o.de)}</p>
      </td>
      <td class="${TD}">
        <button type="button" id="linha-${o.id}" class="link-registro text-left text-sm font-medium ${VALOR} hover:underline underline-offset-2">${esc(o.nome)}</button>
        ${o.observacao ? `<p class="text-xs ${APOIO} truncate" title="${esc(o.observacao)}">${esc(o.observacao)}</p>` : ''}
      </td>
      <td class="${TD}">${tipoNome(o.tipo)}</td>
      <td class="${TD}">${repeticao(o)}</td>
      <td class="${TD} tabular-nums">${o.imp.aulas
        ? `<span class="${AVISO}" title="${esc(o.imp.turmas.map(({ t, n }) => `${t.codigo} (${n})`).join(', '))}">${plural(o.imp.aulas, 'aula')}</span><span class="block text-xs ${APOIO}">${plural(o.imp.turmas.length, 'turma')}</span>`
        : `<span class="${APOIO}">—</span>`}</td>
    </tr>`;
  // Grupos pelo mês em que a ocorrência começa neste ano.
  const grupos = MESES.map((nome, i) => ({ nome, itens: visiveis.filter((o) => Number(o.inicio.slice(5, 7)) === i + 1) })).filter((g) => g.itens.length);
  const cabecalhoMes = (g) => `
    <tr class="bg-slate-50/60 dark:bg-neutral-900/40">
      <th scope="colgroup" colspan="5" class="px-4 pt-3 pb-1.5 text-left text-xs font-medium ${VALOR}">${g.nome} <span class="font-normal ${APOIO}">· ${plural(g.itens.length, 'feriado')}</span></th>
    </tr>`;
  return `
    <div class="${CARTAO} overflow-hidden">
      <table class="w-full table-fixed text-left">
        <thead class="${THEAD}">
          <tr><th class="${TH} w-[220px]">Data</th><th class="${TH}">Feriado</th><th class="${TH} w-[150px]">Tipo</th><th class="${TH} w-[140px]">Repetição</th><th class="${TH} w-[130px]">Aulas previstas</th></tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-neutral-900">
          ${grupos.length ? grupos.map((g) => cabecalhoMes(g) + g.itens.map(linha).join('')).join('') : `
          <tr><td colspan="5" class="px-4 py-10 text-center text-sm ${APOIO}">
            ${filtrando ? 'Nenhum feriado corresponde aos filtros.' : `Nenhum feriado em ${estado.ano}.`}
            ${filtrando ? '' : `<br><button type="button" id="btn-novo-vazio" class="${BOTAO_PRI} mt-4">${ICONE.mais} Cadastrar feriado</button>`}
          </td></tr>`}
        </tbody>
      </table>
      <div class="px-4 py-2.5 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-sm ${VALOR} tabular-nums">${plural(visiveis.length, 'feriado')} em ${estado.ano}${filtrando ? ` de ${totalAno}` : ''}</div>
    </div>`;
}

// ---------- Render ----------

function render() {
  gravarUrl();
  const el = document.getElementById('tela');
  const doAno = Feriados.ocorrencias(estado.lista, estado.ano).map((o) => ({ ...o, imp: impacto(diasEntre(o.de, o.ate)) }));
  const ids = new Set(Feriados.filtrar(estado.lista, estado.ano, estado.filtros).map((o) => o.id));
  const visiveis = doAno.filter((o) => ids.has(o.id));
  el.innerHTML = renderTopo(doAno) + renderBarra() + (estado.visao === 'calendario' ? renderCalendario(visiveis) : renderLista(visiveis, doAno.length));

  el.querySelectorAll('[data-visao]').forEach((b) => b.addEventListener('click', () => { estado.visao = b.dataset.visao; render(); document.getElementById(b.id)?.focus(); }));
  el.querySelectorAll('[data-ano]').forEach((b) => b.addEventListener('click', () => {
    const n = Number(b.dataset.ano);
    estado.ano = n === 0 ? ANO_ATUAL : estado.ano + n;
    render();
    document.getElementById(n === 0 ? 'ano' : b.id)?.focus();
  }));
  el.querySelector('#ano').addEventListener('change', (e) => { estado.ano = Number(e.target.value); render(); document.getElementById('ano').focus(); });
  const campoBusca = el.querySelector('#busca');
  campoBusca.addEventListener('input', () => { estado.filtros.busca = campoBusca.value; const [ini, fim] = [campoBusca.selectionStart, campoBusca.selectionEnd]; render(); const novo = document.getElementById('busca'); novo.focus(); novo.setSelectionRange(ini, fim); });
  el.querySelector('#filtro-tipo').addEventListener('change', (e) => { estado.filtros.tipo = e.target.value; render(); document.getElementById('filtro-tipo').focus(); });
  el.querySelector('#btn-limpar')?.addEventListener('click', () => { estado.filtros = { busca: '', tipo: '' }; render(); document.getElementById('busca').focus(); });
  el.querySelector('#btn-novo').addEventListener('click', () => abrirModalFeriado());
  el.querySelector('#btn-novo-vazio')?.addEventListener('click', () => abrirModalFeriado());
  el.querySelector('#btn-copiar')?.addEventListener('click', copiarAnoAnterior);

  // Calendário: clique cria ou edita; setas andam ±1 dia e ±1 semana, também de um mês para o outro.
  el.querySelectorAll('[data-dia]').forEach((b) => b.addEventListener('click', () => (b.dataset.feriado ? abrirModalFeriado(b.dataset.feriado) : abrirModalFeriado(null, b.dataset.dia))));
  const passos = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  el.querySelectorAll('[data-mes]').forEach((g) => g.addEventListener('keydown', (e) => {
    const de = e.target.closest('[data-dia]');
    if (!de || !(e.key in passos)) return;
    e.preventDefault();
    const alvo = document.getElementById(`dia-${Feriados.addDias(de.dataset.dia, passos[e.key])}`);
    if (!alvo) return;
    alvo.closest('[data-mes]').querySelector('[tabindex="0"]')?.setAttribute('tabindex', '-1');
    alvo.setAttribute('tabindex', '0');
    alvo.focus();
  }));
  el.querySelectorAll('li [data-editar]').forEach((b) => b.addEventListener('click', () => abrirModalFeriado(b.dataset.editar)));
  // Lista: o nome é o botão (teclado); o resto da linha abre o mesmo feriado, a não ser que a pessoa esteja selecionando texto.
  el.querySelector('tbody')?.addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-editar]');
    if (!tr || getSelection().toString()) return;
    abrirModalFeriado(tr.dataset.editar);
  });
}

// ---------- Modal do feriado (abrirModal/fecharModal vêm de avaliacoes-ui.js) ----------

function mostrarErros(form, erros) {
  form.querySelectorAll('[data-erro]').forEach((p) => { p.classList.add('hidden'); p.textContent = ''; });
  form.querySelectorAll('[aria-invalid]').forEach((c) => { c.classList.remove('campo-erro'); c.removeAttribute('aria-invalid'); });
  if (!erros.length) return false;
  erros.forEach((erro) => {
    const p = form.querySelector(`[data-erro="${erro.campo}"]`);
    if (p) { p.textContent = erro.mensagem; p.classList.remove('hidden'); }
    const campo = form.querySelector(`[name="${erro.campo}"]`);
    if (campo?.type !== 'radio') campo?.classList.add('campo-erro');
    campo?.setAttribute('aria-invalid', 'true');
  });
  form.querySelector(`[name="${erros[0].campo}"]`)?.focus();
  return true;
}
const ERRO = (campo) => `<p id="erro-${campo}" data-erro="${campo}" class="text-xs text-red-700 dark:text-red-400 mt-1 hidden"></p>`;
const OPCIONAL = `<span class="font-normal ${APOIO}">(opcional)</span>`;

function abrirModalFeriado(id = null, dataInicial = null) {
  const f = id ? Feriados.porId(estado.lista, id) : null;
  const d = f ?? { nome: '', tipo: '', data: dataInicial ?? '', dataFim: null, recorrente: false, observacao: '' };
  const imp = f ? impactoCadastro(f) : null;
  const opcaoRepeticao = (valor, titulo, texto) => `
    <label class="${OPCAO} p-3">
      <input type="radio" name="recorrente" value="${valor}" class="sr-only" ${d.recorrente === (valor === '1') ? 'checked' : ''}>
      <span class="block text-sm font-medium ${VALOR}">${titulo}</span>
      <span class="block text-xs mt-0.5 ${APOIO}">${texto}</span>
    </label>`;
  const root = abrirModal(`
    <form id="form-feriado" novalidate class="flex flex-col max-h-full min-h-0">
      <div class="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 id="titulo-feriado" class="font-display text-[15px] font-semibold ${TINTA}">${f ? esc(f.nome) : 'Novo feriado'}</h3>
          <p class="text-xs mt-0.5 ${APOIO}">${f ? `${tipoNome(f.tipo)} · ${quando(f)}` : 'A geração das aulas passa a pular esse dia.'}</p>
        </div>
        <button type="button" data-fechar-modal class="${BOTAO_FECHAR} -mr-1.5 -mt-1" aria-label="Fechar">${ICONE.fechar}</button>
      </div>
      <div class="flex-1 overflow-y-auto px-5 pt-1 pb-5 space-y-4">
        ${imp?.aulas ? `<p class="rounded-lg px-3 py-2.5 text-sm bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200"><span class="font-medium">${textoImpacto(imp)} ainda ${imp.aulas === 1 ? 'cai' : 'caem'} nele:</span> ${turmasAfetadas(imp)}. Remarque ou cancele na aba Aulas da turma.</p>` : ''}
        <div>
          <label class="rotulo" for="ff-nome">Nome</label>
          <input type="text" id="ff-nome" name="nome" value="${esc(d.nome)}" maxlength="80" class="campo" placeholder="Ex.: Corpus Christi" aria-describedby="erro-nome">
          ${ERRO('nome')}
        </div>
        <div>
          <label class="rotulo" for="ff-tipo">Tipo</label>
          <select id="ff-tipo" name="tipo" class="campo" aria-describedby="ff-tipo-desc erro-tipo">
            <option value="" ${d.tipo ? '' : 'selected'} disabled>Escolha o tipo…</option>
            ${TIPOS_FERIADO.map((t) => `<option value="${t.id}" ${t.id === d.tipo ? 'selected' : ''}>${t.nome}</option>`).join('')}
          </select>
          <p id="ff-tipo-desc" class="text-xs mt-1 ${APOIO} empty:hidden">${d.tipo ? esc(Feriados.tipoDe(d.tipo).descricao) : ''}</p>
          ${ERRO('tipo')}
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="rotulo" for="ff-data">Data</label>
            <input type="date" id="ff-data" name="data" value="${esc(d.data)}" class="campo tabular-nums" aria-describedby="erro-data">
            ${ERRO('data')}
          </div>
          <div>
            <label class="rotulo" for="ff-data-fim">Até ${OPCIONAL}</label>
            <input type="date" id="ff-data-fim" name="dataFim" value="${esc(d.dataFim ?? '')}" class="campo tabular-nums" aria-describedby="ff-data-fim-ajuda erro-dataFim">
            <p id="ff-data-fim-ajuda" class="text-xs mt-1 ${APOIO}">Para um período: Carnaval, recesso.</p>
            ${ERRO('dataFim')}
          </div>
        </div>
        <fieldset>
          <legend class="rotulo">Repetição</legend>
          <div class="grid grid-cols-2 gap-2">
            ${opcaoRepeticao('1', 'Todo ano', 'Data fixa: Natal, Tiradentes, aniversário da cidade.')}
            ${opcaoRepeticao('0', 'Só neste ano', 'Data móvel: Carnaval, Páscoa, Corpus Christi, recessos.')}
          </div>
        </fieldset>
        <div>
          <label class="rotulo" for="ff-obs">Observação ${OPCIONAL}</label>
          <textarea id="ff-obs" name="observacao" rows="2" maxlength="200" class="campo resize-y" placeholder="Ex.: expediente só à tarde">${esc(d.observacao)}</textarea>
        </div>
      </div>
      <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-4">
        ${f ? `<button type="button" id="btn-excluir" class="${BOTAO_EXCLUIR}">Excluir feriado</button>` : '<span></span>'}
        <div class="flex shrink-0 items-center gap-2">
          <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
          <button type="submit" class="${BOTAO_PRI}">${f ? 'Salvar alterações' : 'Cadastrar feriado'}</button>
        </div>
      </div>
    </form>`, 'max-w-lg');
  root.querySelector('[role="dialog"]').setAttribute('aria-labelledby', 'titulo-feriado');
  const form = root.querySelector('#form-feriado');
  form.tipo.addEventListener('change', () => { form.querySelector('#ff-tipo-desc').textContent = Feriados.tipoDe(form.tipo.value).descricao; });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const dados = { nome: fd.get('nome') ?? '', tipo: fd.get('tipo'), data: fd.get('data'), dataFim: fd.get('dataFim') || null, recorrente: fd.get('recorrente') === '1', observacao: fd.get('observacao') ?? '' };
    const erros = Feriados.validar(dados, estado.lista, id);
    if (mostrarErros(form, erros)) return;
    if (f) {
      estado.lista = Feriados.atualizar(estado.lista, id, dados);
      persistir(); render(); fecharModal();
      toast(`Feriado "${dados.nome.trim()}" atualizado.`);
    } else {
      const r = Feriados.incluir(estado.lista, dados);
      estado.lista = r.lista;
      estado.ano = Number(r.feriado.data.slice(0, 4));
      persistir(); render(); fecharModal();
      // O fim do cadastro diz o que muda: as aulas que já estavam marcadas nesse dia.
      const depois = impactoCadastro(r.feriado);
      toast(`Feriado "${r.feriado.nome}" cadastrado.${depois.aulas ? ` ${textoImpacto(depois)} ainda ${depois.aulas === 1 ? 'cai' : 'caem'} nele.` : ''}`);
    }
  });
  form.querySelector('#btn-excluir')?.addEventListener('click', () => confirmarExclusao(id));
  form.querySelector('#ff-nome').focus();
}

// ---------- Exclusão / cópia ----------

function confirmarExclusao(id) {
  const f = Feriados.porId(estado.lista, id);
  const imp = impactoCadastro(f);
  const varios = Boolean(f.dataFim);
  const root = abrirModal(`
    <div class="px-5 pt-4 pb-3">
      <h3 id="titulo-excluir" class="font-display text-[15px] font-semibold ${TINTA}">Excluir ${esc(f.nome)}?</h3>
      <p class="text-xs mt-0.5 ${APOIO}">${tipoNome(f.tipo)} · ${quando(f)}</p>
    </div>
    <div class="px-5 pb-5 space-y-2 text-sm text-slate-700 dark:text-neutral-200">
      ${f.recorrente ? '<p>Ele se repete todo ano: sai do calendário de todos os anos, não só deste.</p>' : ''}
      <p>A geração das aulas volta a contar ${varios ? 'esses dias' : 'esse dia'} como dia de aula.${imp.aulas ? ` As ${textoImpacto(imp)} já marcadas ${varios ? 'neles' : 'nele'} ficam como estão e deixam de ser avisadas.` : ''}</p>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Cancelar</button>
      <button type="button" id="btn-confirmar-exclusao" class="${BOTAO_PERIGO}">Excluir feriado</button>
    </div>`);
  root.querySelector('[role="dialog"]').setAttribute('aria-labelledby', 'titulo-excluir');
  root.querySelector('#btn-confirmar-exclusao').addEventListener('click', () => {
    const antes = estado.lista;
    estado.lista = Feriados.remover(estado.lista, id);
    persistir(); render(); fecharModal();
    if (!document.activeElement || document.activeElement === document.body) document.getElementById('btn-novo').focus(); // a linha de origem sumiu
    toastDesfazer(`Feriado "${f.nome}" excluído.`, antes);
  });
}

function copiarAnoAnterior() {
  const de = estado.ano - 1;
  const antes = estado.lista;
  const r = Feriados.copiarAno(estado.lista, de, estado.ano);
  if (!r.novos.length) return;
  estado.lista = r.lista;
  persistir(); render();
  document.getElementById(`visao-${estado.visao}`).focus(); // o botão some com a faixa
  toastDesfazer(`${plural(r.novos.length, 'feriado copiado', 'feriados copiados')} de ${de} para ${estado.ano}.`, antes);
}

// Aviso com Desfazer: volta a lista de antes, se nada mudou depois.
function toastDesfazer(mensagem, antes) {
  const depois = estado.lista;
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.className = 'toast-anim flex items-center gap-3 bg-petrol-900 text-white text-sm pl-4 pr-1.5 py-1.5 rounded-lg shadow-lg';
  el.innerHTML = `<span>${esc(mensagem)}</span><button type="button" class="h-7 px-2.5 rounded-md font-semibold text-areia hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">Desfazer</button>`;
  el.querySelector('button').addEventListener('click', () => {
    el.remove();
    if (estado.lista !== depois) { toast('Não dá para desfazer: a lista mudou depois.'); return; }
    estado.lista = antes; persistir(); render();
    toast('Desfeito.');
  });
  document.getElementById('toast-root').appendChild(el);
  setTimeout(() => el.remove(), 8000);
}

// ---------- Boot ----------

(function iniciar() {
  lerUrl();
  render();
  if (parametroUrl('novo') === '1') abrirModalFeriado();
})();
