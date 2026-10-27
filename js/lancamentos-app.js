// ============================================================
// Financeiro (financeiro.html) — abas Contas (A receber · A pagar · Pagar × Receber, receitas e despesas na
// mesma tabela com ícone por tipo) · Conciliação Asaas · Extrato · Saque automático. Na V1 não há página de indicadores.
// Lê o motor `Lancamentos` (js/lancamentos-motor.js); nunca recalcula o que o motor consolida.
// Depende de: avaliacoes-ui (esc, toast, abrirModal, fecharModal, parametroUrl),
// ui-form (modalFormulario, campoCombo, ativarCombos, mostrarErros).
// ============================================================

const L = Lancamentos;

// ---------- Estilo (direção "Ficha em cartões": mesmas constantes de salas-app e contratos-app; ui-form lê BOTAO_PRI etc.) ----------
const CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)]';
const CARTAO_OPCAO = 'cursor-pointer rounded-lg border p-3 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 border-slate-300 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500 transition';
const BOTAO_PRI = 'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold whitespace-nowrap bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/40 disabled:opacity-40 disabled:pointer-events-none';
const BOTAO_PETROL = BOTAO_PRI;
const BOTAO_SEC = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium whitespace-nowrap border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-40 disabled:pointer-events-none';
const BOTAO_FANTASMA = 'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm font-medium whitespace-nowrap text-slate-500 dark:text-neutral-400 hover:text-petrol-800 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 disabled:opacity-40 disabled:pointer-events-none';
const BOTAO_PERIGO = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium whitespace-nowrap border border-red-200 dark:border-red-900 bg-white dark:bg-neutral-950 text-red-700 dark:text-red-400 hover:border-red-500 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30';
const BOTAO_CANCELAR = 'px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition';
const BOTAO_LINK = 'inline-flex items-center gap-1 text-xs font-medium text-petrol-800 dark:text-sky-300 hover:underline disabled:opacity-40 disabled:no-underline';
const LINK = 'font-medium text-petrol-800 dark:text-sky-300 hover:underline underline-offset-2';
const CAMPO_BUSCA = 'h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 pl-8 pr-3 text-sm text-slate-700 dark:text-neutral-200 placeholder:text-slate-500 dark:placeholder:text-neutral-400 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400 focus:ring-2 focus:ring-petrol-800/20';
const SELECT_FILTRO = 'h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2.5 text-sm text-slate-700 dark:text-neutral-200 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400';
const CAMPO_DATA = `${SELECT_FILTRO} tabular-nums`;
const TH = 'px-4 py-2.5';
// Cabeçalho preso ao rolar (-top-6 desconta o p-6 do <main>, senão as linhas aparecem acima dele); a linha de baixo é sombra porque a borda de tabela colapsada não acompanha o sticky.
const THEAD = 'text-xs font-medium text-slate-500 dark:text-neutral-400 [&_th]:sticky [&_th]:-top-6 [&_th]:z-10 [&_th]:bg-slate-50 dark:[&_th]:bg-neutral-900 [&_th]:shadow-[inset_0_-1px_0_rgb(226_232_240)] dark:[&_th]:shadow-[inset_0_-1px_0_rgb(38_38_38)]';
const THM = `${TH} ${THEAD} whitespace-nowrap text-left font-medium`;
const TD = 'px-4 py-2.5 text-sm text-slate-600 dark:text-neutral-300 align-top';
const TDN = `${TD} tabular-nums whitespace-nowrap text-right`;
const LINHA = 'hover:bg-slate-50 dark:hover:bg-neutral-900 transition';
const CORPO_TABELA = 'divide-y divide-slate-100 dark:divide-neutral-900';
// A linha inteira abre o lançamento; o nome é o botão focável, e o foco dele contorna a linha.
const FOCO_LINHA = 'has-[.link-registro:focus-visible]:bg-slate-50 dark:has-[.link-registro:focus-visible]:bg-neutral-900 has-[.link-registro:focus-visible]:outline-2 has-[.link-registro:focus-visible]:-outline-offset-2 has-[.link-registro:focus-visible]:outline-[color:var(--f-foco)]';
const APOIO = 'text-slate-500 dark:text-neutral-400'; // rótulo, subtítulo e vazio (4,76:1 no cartão)
const APOIO_FUNDO = 'text-slate-600 dark:text-neutral-400'; // o mesmo papel direto sobre o fundo (6,93:1; o slate-500 dá 4,36:1)
const AVISO = 'text-[color:var(--f-aviso)]'; // "é com você": cobre-tinta, sem âmbar paralelo
const RUIM = 'text-red-700 dark:text-red-400'; // só vencido e saldo negativo (Regra do Azul e do Vermelho)
const FAIXA_INFO = 'rounded-lg bg-petrol-800/10 dark:bg-sky-950/40 text-petrol-900 dark:text-sky-200 px-3 py-2 text-xs'; // próximo passo, sem contorno
const ERRO = (campo) => `<p data-erro="${campo}" class="text-xs text-red-600 dark:text-red-400 mt-1 hidden"></p>`;
const OPCIONAL = `<span class="font-normal ${APOIO}">(opcional)</span>`;
const ICONE_LUPA = '<svg class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>';
const ICONE_ASAAS = '<svg class="h-3.5 w-3.5 inline-block -mt-0.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l9 5v10l-9 5-9-5V7l9-5zm0 2.3L5 8.2v7.6l7 3.9 7-3.9V8.2l-7-3.9zM8 10h8v1.6H8V10zm0 3h8v1.6H8V13z"/></svg>';
const ICONE = {
  mais: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>',
  reticencias: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>',
  abaixo: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>',
  acima: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/></svg>',
  info: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>',
  alerta: '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>',
};

// Fase do lançamento (ciclo de vida): ponto na cor da fase + texto. Cancelado vira pílula neutra e apaga a linha.
const PONTO_SITUACAO = { previsto: 'bg-slate-400 dark:bg-neutral-500', emitido: 'bg-sky-600 dark:bg-sky-400', vencido: 'bg-red-500', pago: 'bg-emerald-500', cancelado: 'border border-slate-400 dark:border-neutral-500' };
const PONTO_CONCILIACAO = { conciliado: ['bg-emerald-500', 'Conciliado'], sugestao: ['border-2 border-laranja', 'Com sugestão'], sem_lancamento: ['bg-laranja', 'Sem lançamento'], transferencia: ['bg-slate-400 dark:bg-neutral-500', 'Transferência'], taxa: ['border border-slate-400 dark:border-neutral-500', 'Taxa do gateway'] };
const PILULA = { neutra: 'bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-400' };
// Ícone do tipo (heroicons arrow-up/down-circle), em tinta: entrada e saída não levam cor, só sinal e posição.
const CAMINHO_TIPO = { receita: 'm15 11.25-3-3m0 0-3 3m3-3v7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', despesa: 'm9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' };
const iconeTipo = (tipo, tamanho = 'h-5 w-5') => (CAMINHO_TIPO[tipo] ? `<span class="inline-flex shrink-0 text-slate-500 dark:text-neutral-400"><svg class="${tamanho}" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="${CAMINHO_TIPO[tipo]}"/></svg></span>` : '');
// Abas da tela (Regra da Linha de Abas): Receber, Pagar e Pagar × Receber são partes de Contas, no controle segmentado.
// estado.aba guarda a parte ('receber' | 'pagar' | 'ambas') ou a aba; ?aba=receber|pagar|ambas continuam valendo.
const ABAS = [['contas', 'Contas'], ['conciliacao', 'Conciliação Asaas'], ['extrato', 'Extrato'], ['saques', 'Saque automático']];
const PARTES_CONTAS = [['receber', 'A receber'], ['pagar', 'A pagar'], ['ambas', 'Pagar × Receber']];
const ehParteContas = (aba) => PARTES_CONTAS.some(([id]) => id === aba);
const abaDaTela = () => (ehParteContas(estado.aba) ? 'contas' : estado.aba);
// 'ambas' é o pseudo-tipo da parte combinada: indexa estado.contas/ROTULO_TIPO e vira tipo '' (todos) no L.filtrar.
const TIPO_DA_ABA = { receber: 'receita', pagar: 'despesa', ambas: 'ambas' };
const ABA_PADRAO = 'receber';
const ROTULO_TIPO = { receita: { titulo: 'Contas a receber', novo: 'Nova receita', pessoa: 'cliente' }, despesa: { titulo: 'Contas a pagar', novo: 'Nova despesa', pessoa: 'favorecido' }, ambas: { titulo: 'Pagar × Receber', novo: 'Novo lançamento', pessoa: 'cliente ou favorecido' } };

// ---------- Helpers ----------
const moeda = (n) => L.fmtMoedaCentavos(n);
const dataBr = (iso) => (iso ? L.fmtData(iso) : '—');
const mesRotulo = (ym) => (ym && /^\d{4}-\d{2}$/.test(ym) ? L.rotuloMes(ym) : ym || '—');
const plural = (n, um, varios = `${um}s`) => `${n} ${n === 1 ? um : varios}`;
const nomeCat = (id) => { const c = L.categoriaDe(estado.plano, id); return c ? `${c.codigo} ${c.nome}` : '—'; };
const nomeCentro = (id) => L.centroDe(estado.plano, id)?.nome ?? '—';
const nomeConta = (id) => L.contaDe(estado.plano, id)?.nome ?? '—';
const nomeForma = (id) => L.nomeDe(L.FORMAS, id);
const mesAtual = () => L.mesDe(L.hoje());
const inicioMes = () => `${mesAtual()}-01`;
const fimMes = () => L.periodoDe({ de: mesAtual(), ate: mesAtual() }).ate;
// Fase em ponto + texto; o vencido diz o atraso em vermelho, o cancelado é pílula neutra (a linha apaga).
const pontoSituacao = (l) => {
  const s = L.situacao(l);
  if (s === 'cancelado') return pilula(PILULA.neutra, 'Cancelado');
  return `<span class="inline-flex items-center gap-1.5 whitespace-nowrap ${s === 'vencido' ? `${RUIM} font-medium` : 'text-slate-700 dark:text-neutral-300'}"><span class="h-2 w-2 rounded-full shrink-0 ${PONTO_SITUACAO[s]}" aria-hidden="true"></span>${esc(L.situacaoDe(l).nome)}</span>`;
};
function pilula(classe, texto, titulo = '') {
  return `<span ${titulo ? `title="${esc(titulo)}"` : ''} class="pilula inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ${classe}">${esc(texto)}</span>`;
}
// Segmento (B2C/B2B) e natureza (PF/PJ) em texto de apoio, sem caixa nem contorno: dado de consulta, não controle.
const chipSegmento = (seg) => (seg ? `<span title="${esc(L.nomeDe(L.SEGMENTOS, seg))}">${esc(seg.toUpperCase())}</span>` : '');
const chipNatureza = (pessoa) => { const nat = L.naturezaPessoa(pessoa); const n = nat ? L.porId(L.NATUREZAS_PESSOA, nat) : null; return n ? `<span title="${esc(n.nome)}">${esc(n.curto)}</span>` : ''; };
// Valor com sinal (+ entrada, − saída) em tinta; a cor fica para o que a tela sabe que é ruim.
const valorComSinal = (tipo, v) => `${tipo === 'despesa' || tipo === 'debito' ? '−' : '+'}\u2009${moeda(v)}`;
const selectHtml = (id, opcoes, valor, { vazio = 'Selecione…', classe = 'campo', name = '', title = '' } = {}) => `
  <select id="${id}" ${name ? `name="${name}"` : ''} class="${classe}" ${title ? `title="${esc(title)}"` : ''}>
    <option value="">${esc(vazio)}</option>
    ${opcoes.map((o) => `<option value="${esc(o.id)}" ${String(o.id) === String(valor ?? '') ? 'selected' : ''}>${esc(o.nome)}</option>`).join('')}
  </select>`;
const campoHtml = (rotulo, corpo, { name = '', opcional = false, ajuda = '' } = {}) => `
  <div>
    <label class="rotulo" ${name ? `for="f-${name}"` : ''}>${rotulo} ${opcional ? OPCIONAL : ''}</label>
    ${corpo}
    ${ajuda ? `<p class="text-xs ${APOIO} mt-1">${ajuda}</p>` : ''}
    ${name ? ERRO(name) : ''}
  </div>`;

function baixarArquivo(nome, conteudo, tipo = 'text/csv;charset=utf-8') {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const csvLinhas = (cab, linhas) => { const e = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`; return `﻿${cab.map(e).join(';')}\n${linhas.map((l) => l.map(e).join(';')).join('\n')}`; };

// ---------- Estado ----------

const filtrosPadrao = () => ({ de: inicioMes(), ate: fimMes(), campoPeriodo: 'vencimento', situacao: 'aberto', forma: '', origem: '', centroCustoId: '', categoriaId: '', contaBancariaId: '', turmaId: '', pessoaTipo: '', natureza: '', busca: '' });
const abaContasPadrao = () => ({ filtros: filtrosPadrao(), ordem: { campo: 'vencimento', dir: 'asc' }, selecao: new Set() });
const estado = {
  lista: [], plano: null, movimentos: [], pessoas: {}, turmas: [],
  aba: ABA_PADRAO,
  parteContas: ABA_PADRAO, // última parte aberta de Contas, para a aba voltar nela
  // 'ambas' = aba combinada Pagar × Receber (mesma estrutura; sem seleção em massa na prática, pois a tabela não tem checkboxes).
  contas: { receita: abaContasPadrao(), despesa: abaContasPadrao(), ambas: abaContasPadrao() },
  // filtro: 'pendentes' (fila do que precisa de você) | 'conciliado' | 'outros' (taxas e transferências) | 'todos'.
  conciliacao: { contaId: '', dias: 90, filtro: 'pendentes' },
  extrato: { contaId: '', de: L.somarDias(L.hoje(), -90), ate: L.hoje() },
  // Saque automático da Asaas para o banco: { config, saques } (L.carregarSaques); config null = motor ausente.
  saques: { config: null, saques: [] },
};

function carregarTudo() {
  estado.plano = L.plano();
  estado.lista = L.carregar();
  estado.movimentos = L.carregarExtrato(estado.lista);
  const auto = L.conciliarPeloId(estado.lista, estado.movimentos);
  if (auto.n) { estado.lista = auto.lista; persistir(); }
  carregarSaques();
  const ctx = L.contexto();
  estado.turmas = ctx.turmas.map((t) => { const c = ctx.cursos.find((x) => x.id === t.cursoId); return { id: t.id, nome: `${t.codigo} · ${c?.nome ?? t.cursoId}`, descricao: `${dataBr(t.inicio)} – ${dataBr(t.fim)}` }; }).sort((a, b) => b.nome.localeCompare(a.nome, 'pt-BR'));
  const fmtCpf = (v) => (typeof Clientes !== 'undefined' ? Clientes.fmtCpf(v) : v);
  const fmtCnpj = (v) => (typeof Clientes !== 'undefined' ? Clientes.fmtCnpj(v) : v);
  const ord = (xs) => xs.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  estado.pessoas = {
    aluno: ord(ctx.clientes.alunos.map((a) => ({ id: a.id, nome: a.nome, documento: fmtCpf(a.cpf) }))),
    empresa: ord(ctx.clientes.empresas.map((e) => ({ id: e.id, nome: e.nomeFantasia ? `${e.nomeFantasia} (${e.razaoSocial})` : e.razaoSocial, documento: fmtCnpj(e.cnpj) }))),
    responsavel: ord((ctx.clientes.responsaveis ?? []).map((r) => ({ id: r.id, nome: r.nome, documento: fmtCpf(r.cpf) }))),
    fornecedor: ord(estado.plano.fornecedores.filter((f) => f.status === 'ativo').map((f) => ({ id: f.id, nome: f.nome, documento: f.documento ?? '', categoriaId: f.categoriaId, centroCustoId: f.centroCustoId }))),
    instrutor: ord(ctx.instrutores.map((i) => ({ id: i.id, nome: i.empresa?.razaoSocial ? `${i.nome} (${i.empresa.razaoSocial})` : i.nome, documento: i.empresa?.cnpj ? fmtCnpj(i.empresa.cnpj) : fmtCpf(i.cpf) }))),
    colaborador: ord(ctx.colaboradores.map((c) => ({ id: c.id, nome: c.nome, documento: fmtCpf(c.cpf) }))),
  };
  if (!estado.conciliacao.contaId) estado.conciliacao.contaId = L.contaAsaas(estado.plano)?.id ?? '';
  if (!estado.extrato.contaId) estado.extrato.contaId = L.contaAsaas(estado.plano)?.id ?? '';
}
function persistir() { L.salvar(estado.lista); }
function alterar(fn) { estado.lista = fn(estado.lista); persistir(); }
// Baixa/estorno/cobrança de venda e instrutor tocam outros domínios: recarrega para refletir a sincronização.
function recarregar() { estado.lista = L.carregar(); }
const lanc = (id) => L.porId(estado.lista, id);

function atualizarUrl() {
  const q = new URLSearchParams();
  if (estado.aba !== ABA_PADRAO) q.set('aba', estado.aba);
  const tipo = TIPO_DA_ABA[estado.aba];
  const filtros = tipo ? estado.contas[tipo].filtros : null;
  const hoje = L.hoje();
  if (filtros?.situacao === 'aberto' && filtros.de === hoje && filtros.ate === hoje) q.set('vencimento', 'hoje');
  else if (filtros?.situacao === 'aberto' && filtros.de === hoje && filtros.ate === L.somarDias(hoje, 7)) q.set('vencimento', '7-dias');
  else if (filtros?.situacao && !filtros.de && !filtros.ate) q.set('situacao', filtros.situacao);
  if (filtros?.natureza) q.set('natureza', filtros.natureza); // ?natureza=pf|pj, independente dos demais parâmetros
  if (filtros?.centroCustoId) q.set('centro', filtros.centroCustoId);
  const qs = q.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

// Cartões do topo: cada um é o recorte exato que aplica na lista (mesmos filtros), para o número bater com o total.
function filtrosOperacionais(chave) {
  const hoje = L.hoje();
  if (chave === 'receberHoje') return { aba: 'receber', filtros: { ...filtrosPadrao(), de: hoje, ate: hoje, situacao: 'aberto' } };
  if (chave === 'vencido') return { aba: 'receber', filtros: { ...filtrosPadrao(), de: '', ate: '', situacao: 'vencido' } };
  if (chave === 'pagarSeteDias') return { aba: 'pagar', filtros: { ...filtrosPadrao(), de: hoje, ate: L.somarDias(hoje, 7), situacao: 'aberto' } };
  return null;
}
function cartaoOperacionalAtivo() {
  return ['receberHoje', 'vencido', 'pagarSeteDias'].find((chave) => {
    const alvo = filtrosOperacionais(chave);
    return alvo.aba === estado.aba && JSON.stringify(estado.contas[TIPO_DA_ABA[alvo.aba]].filtros) === JSON.stringify(alvo.filtros);
  }) ?? null;
}

function dadosOperacionais() {
  const totaisDe = (chave) => { const { aba, filtros } = filtrosOperacionais(chave); return L.totais(L.filtrar(estado.lista, { ...filtros, tipo: TIPO_DA_ABA[aba] })); };
  return { receberHoje: totaisDe('receberHoje'), vencido: totaisDe('vencido'), pagarSeteDias: totaisDe('pagarSeteDias') };
}
// Pendências da conciliação: o contador da aba (a fila em si mora na aba).
const pendentesConciliacao = () => { const r = dadosConciliacao().resumo; return r.comSugestao + r.semLancamento + r.semMovimento; };

function aplicarOperacional(chave) {
  const ativo = cartaoOperacionalAtivo() === chave;
  const { aba, filtros } = filtrosOperacionais(chave);
  estado.aba = aba;
  // Clicar no cartão já marcado devolve a parte ao recorte padrão (mês corrente, em aberto).
  estado.contas[TIPO_DA_ABA[aba]].filtros = ativo ? filtrosPadrao() : filtros;
  atualizarUrl();
  render();
}

function cartoesOperacionais() {
  const d = dadosOperacionais();
  const ativo = cartaoOperacionalAtivo();
  const cartao = (chave, rotulo, valor, sub, cor = 'text-slate-900 dark:text-neutral-100') => `
    <button type="button" data-operacional="${chave}" aria-pressed="${ativo === chave}" class="${CARTAO} p-4 text-left hover:border-petrol-800 dark:hover:border-sky-400 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 ${ativo === chave ? 'border-petrol-800! dark:border-sky-400! ring-2 ring-petrol-800/30 dark:ring-sky-400/30' : ''}">
      <p class="text-xs font-medium ${APOIO}">${rotulo}</p>
      <p class="font-display text-2xl font-semibold tabular-nums leading-none mt-1.5 ${cor}">${valor}</p>
      <p class="text-xs ${APOIO} mt-1.5">${sub}</p>
    </button>`;
  return `
    <div class="mb-4 grid grid-cols-3 gap-3">
      ${cartao('receberHoje', 'A receber hoje', moeda(d.receberHoje.final), d.receberHoje.n ? `${plural(d.receberHoje.n, 'lançamento vence', 'lançamentos vencem')} hoje` : 'nada vence hoje')}
      ${cartao('vencido', 'Vencido a receber', moeda(d.vencido.final), d.vencido.n ? `${plural(d.vencido.n, 'lançamento')}, de todo o período` : 'nenhum lançamento vencido', d.vencido.n ? RUIM : undefined)}
      ${cartao('pagarSeteDias', 'A pagar nos próximos 7 dias', moeda(d.pagarSeteDias.final), d.pagarSeteDias.n ? `${plural(d.pagarSeteDias.n, 'lançamento')} até ${dataBr(L.somarDias(L.hoje(), 7))}` : 'nada a pagar até lá')}
    </div>`;
}

// ---------- Render raiz ----------

// innerHTML de render() apaga o elemento focado: guarda uma chave estável (id ou primeiro data-*) e a posição na
// tabela, para focar o mesmo controle de novo ou, se a linha saiu do filtro (baixa, conciliação), o da linha que entrou no lugar.
function lembrarFoco() {
  const modalAberto = Boolean(document.getElementById('modal-root')?.innerHTML.trim());
  let el = modalAberto ? origemDoModal : document.activeElement;
  if (painelAberto?.el.contains(el)) el = painelAberto.gatilho;
  if (!el || !document.getElementById('tela')?.contains(el)) return null;
  const attr = el.id ? null : [...el.attributes].find((a) => a.name.startsWith('data-'));
  const tr = el.closest('tbody tr');
  const tabelas = [...document.querySelectorAll('#conteudo table')];
  return {
    modalAberto,
    seletor: el.id ? `#${CSS.escape(el.id)}` : attr ? `[${attr.name}="${CSS.escape(attr.value)}"]` : null,
    atributo: attr?.name,
    tabela: tr ? tabelas.indexOf(tr.closest('table')) : -1,
    linha: tr ? tr.sectionRowIndex : -1,
  };
}
function devolverFocoDaTela(f) {
  if (!f) return;
  let alvo = f.seletor && document.querySelector(f.seletor);
  if (!alvo && f.tabela >= 0) {
    const linhas = document.querySelectorAll('#conteudo table')[f.tabela]?.tBodies[0]?.rows;
    const tr = linhas?.[Math.min(f.linha, linhas.length - 1)];
    alvo = tr && (tr.querySelector(`[${f.atributo}]`) ?? tr.querySelector('button'));
  }
  alvo ??= document.querySelector('[role="tab"][aria-selected="true"]');
  if (f.modalAberto) origemDoModal = alvo; // o modal devolve o foco ao fechar
  else alvo?.focus();
}

// Listas longas mostram 50 linhas por vez; mudar filtro, ordem ou conta volta às 50 primeiras.
const PASSO_LISTA = 50;
const limites = {};
function fatia(lista, itens, assinatura) {
  if (limites[lista]?.assinatura !== assinatura) limites[lista] = { assinatura, n: PASSO_LISTA };
  return itens.slice(0, limites[lista].n);
}
function botaoMais(lista, total) {
  const n = limites[lista]?.n ?? total;
  if (total <= n) return '';
  return `<div class="mt-3 flex items-center justify-center gap-3 text-sm ${APOIO_FUNDO}"><span class="tabular-nums">Mostrando ${n} de ${total}</span><button type="button" data-mais="${lista}" class="${BOTAO_SEC} h-8">Mostrar mais ${Math.min(PASSO_LISTA, total - n)}</button></div>`;
}

function render() {
  const foco = lembrarFoco();
  fecharMenu();
  fecharPainel();
  if (ehParteContas(estado.aba)) estado.parteContas = estado.aba;
  const el = document.getElementById('tela');
  const atual = abaDaTela();
  const pendentes = pendentesConciliacao();
  const aba = ([id, nome]) => `
    <button type="button" role="tab" id="aba-${id}" data-aba="${id}" aria-selected="${atual === id}" aria-controls="conteudo" class="px-0.5 pb-2.5 text-sm border-b-2 transition whitespace-nowrap ${atual === id ? 'border-[color:var(--f-marca-tinta)] text-slate-900 dark:text-neutral-100 font-medium' : `border-transparent ${APOIO_FUNDO} hover:text-slate-800 dark:hover:text-neutral-200`}">${nome}${id === 'conciliacao' && pendentes ? ` <span class="ml-1 rounded-full bg-laranja/10 dark:bg-laranja/15 ${AVISO} px-1.5 text-xs font-semibold tabular-nums" title="Movimentos e pagamentos à espera de conciliação">${pendentes}</span>` : ''}</button>`;
  el.innerHTML = `
    <div class="mb-4">
      <h2 class="font-display text-xl font-semibold text-slate-900 dark:text-neutral-100">Financeiro</h2>
      <p class="text-sm ${APOIO_FUNDO} mt-0.5">Cobrar, dar baixa e conciliar. Parcelas nascem na venda; pagamentos de instrutor, no contrato. Referência: ${esc(dataBr(L.hoje()))}.</p>
    </div>
    <div role="tablist" aria-label="Seções do Financeiro" class="mb-4 shadow-[inset_0_-1px_0] shadow-slate-200 dark:shadow-neutral-800 flex items-center gap-4">${ABAS.map(aba).join('')}</div>
    <div id="conteudo" role="tabpanel" aria-labelledby="aba-${atual}">${conteudoAba()}</div>`;
  el.querySelectorAll('[data-operacional]').forEach((b) => b.addEventListener('click', () => aplicarOperacional(b.dataset.operacional)));
  el.querySelectorAll('[data-aba]').forEach((b) => b.addEventListener('click', () => { estado.aba = b.dataset.aba === 'contas' ? estado.parteContas : b.dataset.aba; atualizarUrl(); render(); }));
  ligarAba(el);
  devolverFocoDaTela(foco);
  el.querySelectorAll('[data-mais]').forEach((b) => b.addEventListener('click', () => {
    const lista = b.dataset.mais; const antes = limites[lista].n;
    limites[lista].n += PASSO_LISTA; render();
    // Foco na primeira linha nova, para o teclado seguir de onde parou.
    const tr = document.querySelector(`[data-lista="${lista}"] tbody`)?.rows[antes];
    tr?.querySelector('button, a, input')?.focus();
  }));
}

function conteudoAba() {
  if (estado.aba === 'conciliacao') return htmlConciliacao();
  if (estado.aba === 'extrato') return htmlExtrato();
  if (estado.aba === 'saques') return htmlSaques();
  return htmlContas(TIPO_DA_ABA[estado.aba] ?? 'receita');
}
function ligarAba(el) {
  if (estado.aba === 'conciliacao') ligarConciliacao(el);
  else if (estado.aba === 'extrato') ligarExtrato(el);
  else if (estado.aba === 'saques') ligarSaques(el);
  else ligarContas(el, TIPO_DA_ABA[estado.aba] ?? 'receita');
}

// ============================================================
// Contas a receber / a pagar
// ============================================================

// ---------- Barra de filtros das contas ----------
// Uma barra só: busca, período (popover com atalhos + datas + data considerada), status e o botão "Filtros",
// que abre um painel com os demais campos rotulados. O que estiver aplicado no painel aparece em texto abaixo da barra.
const ICONE_CALENDARIO = '<svg class="h-4 w-4 text-slate-500 dark:text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>';
const ICONE_FUNIL = '<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"/></svg>';
const ICONE_SETA = (dir) => `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="${dir < 0 ? 'M15.75 19.5L8.25 12l7.5-7.5' : 'M8.25 4.5l7.5 7.5-7.5 7.5'}"/></svg>`;
const BOTAO_SETA = BOTAO_SEC.replace('px-3', 'px-1.5').replace('rounded-lg', '');
const BOTAO_PERIODO = BOTAO_SEC.replace('rounded-lg', 'rounded-none');
// Filtros que moram no painel "Filtros" (fora da barra) — contados no badge e listados na linha de resumo.
const CHAVES_PAINEL = ['natureza', 'forma', 'origem', 'pessoaTipo', 'centroCustoId', 'categoriaId', 'contaBancariaId', 'turmaId'];
const CAMPOS_PERIODO = [{ id: 'vencimento', nome: 'Vencimento', curto: 'por vencimento' }, { id: 'pagoEm', nome: 'Pagamento', curto: 'por pagamento' }, { id: 'competencia', nome: 'Competência', curto: 'por competência' }];

const somarMesesYm = (ym, n) => { const [a, m] = ym.split('-').map(Number); const t = a * 12 + (m - 1) + n; return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`; };
const periodoDoMes = (ym) => L.periodoDe({ de: ym, ate: ym });
// 'YYYY-MM' quando de/até cobrem exatamente um mês civil; senão null.
const mesInteiro = ({ de, ate }) => (de && ate && de.endsWith('-01') && ate === periodoDoMes(de.slice(0, 7)).ate ? de.slice(0, 7) : null);
const nomeMes = (ym) => { const s = new Date(`${ym}-01T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1); };
const diasDe = (de, ate) => Math.round((new Date(`${ate}T12:00:00`) - new Date(`${de}T12:00:00`)) / 86400000) + 1;
const presetsPeriodo = () => {
  const h = L.hoje(); const m = mesAtual(); const ano = h.slice(0, 4);
  return [
    { id: 'hoje', nome: 'Hoje', de: h, ate: h },
    { id: '7-dias', nome: 'Próximos 7 dias', de: h, ate: L.somarDias(h, 7) },
    { id: 'mes', nome: 'Este mês', ...periodoDoMes(m) },
    { id: 'mes-anterior', nome: 'Mês passado', ...periodoDoMes(somarMesesYm(m, -1)) },
    { id: 'mes-seguinte', nome: 'Próximo mês', ...periodoDoMes(somarMesesYm(m, 1)) },
    { id: 'ano', nome: 'Este ano', de: `${ano}-01-01`, ate: `${ano}-12-31` },
    { id: 'tudo', nome: 'Todo o período', de: '', ate: '' },
  ];
};
const presetAtivo = (f) => presetsPeriodo().find((p) => p.de === f.de && p.ate === f.ate) ?? null;
function rotuloPeriodo(f) {
  const ym = mesInteiro(f);
  if (ym) return nomeMes(ym);
  const p = presetAtivo(f);
  if (p) return p.nome;
  if (f.de && f.ate) return `${dataBr(f.de)} – ${dataBr(f.ate)}`;
  if (f.de) return `A partir de ${dataBr(f.de)}`;
  return `Até ${dataBr(f.ate)}`;
}
// Setas ‹ ›: um mês quando o período é um mês inteiro; senão, o tamanho do intervalo. Sem intervalo fechado não há setas.
function deslocarPeriodo(f, sentido) {
  const ym = mesInteiro(f);
  if (ym) return periodoDoMes(somarMesesYm(ym, sentido));
  if (!f.de || !f.ate) return null;
  const n = diasDe(f.de, f.ate) * sentido;
  return { de: L.somarDias(f.de, n), ate: L.somarDias(f.ate, n) };
}
// Texto da linha "Filtrando por …" (só os filtros do painel).
function resumoFiltrosPainel(f) {
  return [
    f.natureza && L.porId(L.NATUREZAS_PESSOA, f.natureza)?.nome,
    f.forma && nomeForma(f.forma),
    f.origem && `Origem ${L.nomeDe(L.ORIGENS, f.origem).toLowerCase()}`,
    f.pessoaTipo && L.nomeDe(L.TIPOS_PESSOA, f.pessoaTipo),
    f.centroCustoId && `Centro de ${L.tipoCentro(L.centroDe(estado.plano, f.centroCustoId))} ${nomeCentro(f.centroCustoId)}`,
    f.categoriaId && `Categoria ${nomeCat(f.categoriaId)}`,
    f.contaBancariaId && `Conta ${nomeConta(f.contaBancariaId)}`,
    f.turmaId && `Turma ${estado.turmas.find((t) => t.id === f.turmaId)?.nome ?? f.turmaId}`,
  ].filter(Boolean);
}

// Painel flutuante ancorado num botão (período e filtros). Fecha ao clicar fora, Esc e em qualquer render().
// Cliques na lista de um combobox aberto (fica fora do painel, no body) não fecham o painel.
let painelAberto = null;
function fecharPainel() {
  if (!painelAberto) return;
  fecharCombo();
  painelAberto.el.remove();
  painelAberto.gatilho.setAttribute('aria-expanded', 'false');
  document.removeEventListener('mousedown', painelAberto.fora, true);
  document.removeEventListener('keydown', painelAberto.tecla, true);
  window.removeEventListener('resize', painelAberto.posicionar);
  window.removeEventListener('scroll', painelAberto.posicionar, true);
  painelAberto = null;
}
function abrirPainel(gatilho, html, { largura = 'w-[36rem]', rotulo = '' } = {}) {
  if (painelAberto?.gatilho === gatilho) { fecharPainel(); return null; }
  fecharPainel(); fecharMenu();
  const el = document.createElement('div');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', rotulo);
  el.className = `fixed z-50 ${largura} max-w-[calc(100vw-1rem)] rounded-[10px] border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.28)] p-4`;
  el.style.width = largura.match(/\[(.+)\]/)?.[1] ?? ''; // o Tailwind do CDN só gera a classe depois da medida abaixo
  el.innerHTML = html;
  document.body.appendChild(el);
  const posicionar = () => {
    const r = gatilho.getBoundingClientRect(); const w = el.offsetWidth; const h = el.offsetHeight;
    el.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - w - 8))}px`;
    // Abaixo do gatilho; acima se não couber; se não couber em nenhum dos dois, encosta no pé da janela.
    const top = r.bottom + h + 8 <= window.innerHeight ? r.bottom + 4 : r.top > h + 8 ? r.top - h - 4 : window.innerHeight - h - 8;
    el.style.top = `${Math.max(8, top)}px`;
  };
  const fora = (e) => { if (el.contains(e.target) || gatilho.contains(e.target) || e.target.closest?.('[role="listbox"]')) return; fecharPainel(); };
  const tecla = (e) => { if (e.key === 'Escape' && !comboAberto) { e.stopPropagation(); fecharPainel(); gatilho.focus(); } };
  document.addEventListener('mousedown', fora, true);
  document.addEventListener('keydown', tecla, true);
  window.addEventListener('resize', posicionar);
  window.addEventListener('scroll', posicionar, true);
  gatilho.setAttribute('aria-expanded', 'true');
  painelAberto = { el, gatilho, fora, tecla, posicionar };
  posicionar();
  return el;
}

function painelPeriodo(tipo, gatilho) {
  const f = estado.contas[tipo].filtros;
  const ativo = presetAtivo(f);
  const el = abrirPainel(gatilho, `
    <div class="flex gap-4">
      <div class="w-40 shrink-0 border-r border-slate-100 dark:border-neutral-900 pr-3 space-y-0.5">
        ${presetsPeriodo().map((p) => `<button type="button" data-preset="${p.id}" class="w-full text-left px-2.5 py-1.5 rounded-lg text-sm transition ${ativo?.id === p.id ? 'bg-petrol-800/10 text-petrol-800 dark:bg-sky-950/60 dark:text-sky-300 font-medium' : 'text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-900'}">${esc(p.nome)}</button>`).join('')}
      </div>
      <form id="pp-form" class="flex-1 min-w-0 space-y-3">
        <div class="grid grid-cols-2 gap-3">
          ${campoHtml('De', `<input id="pp-de" type="date" value="${esc(f.de)}" class="campo tabular-nums">`)}
          ${campoHtml('Até', `<input id="pp-ate" type="date" value="${esc(f.ate)}" class="campo tabular-nums">`)}
        </div>
        ${campoHtml('Data considerada', `<select id="pp-campo" class="campo">${CAMPOS_PERIODO.map((o) => `<option value="${o.id}" ${o.id === f.campoPeriodo ? 'selected' : ''}>${esc(o.nome)}</option>`).join('')}</select>`)}
        <div class="flex justify-end pt-1"><button type="submit" class="${BOTAO_PRI}">Aplicar</button></div>
      </form>
    </div>`, { largura: 'w-[31rem]', rotulo: 'Período' });
  if (!el) return;
  el.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => { const p = presetsPeriodo().find((x) => x.id === b.dataset.preset); f.de = p.de; f.ate = p.ate; render(); }));
  el.querySelector('#pp-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const de = el.querySelector('#pp-de').value; const ate = el.querySelector('#pp-ate').value;
    if (de && ate && de > ate) { toast('A data inicial não pode ser depois da final.'); return; }
    f.de = de; f.ate = ate; f.campoPeriodo = el.querySelector('#pp-campo').value; render();
  });
  el.querySelector('#pp-de').focus();
}

function painelFiltros(tipo, gatilho) {
  const f = estado.contas[tipo].filtros;
  const combinada = tipo === 'ambas';
  const categorias = combinada ? [] : L.categoriasDoTipo(estado.plano, tipo).map((x) => ({ id: x.id, nome: `${x.codigo} ${x.nome}` }));
  const centros = L.centrosDoTipo(estado.plano, tipo === 'receita' ? 'receita' : 'custo').map((x) => ({ id: x.id, nome: `${x.codigo} ${x.nome}` }));
  const contas = estado.plano.contasBancarias.filter((x) => x.status === 'ativo');
  const tiposPessoa = combinada ? L.TIPOS_PESSOA : L.TIPOS_PESSOA.filter((t) => (tipo === 'receita' ? ['aluno', 'empresa', 'responsavel'].includes(t.id) : ['fornecedor', 'instrutor', 'colaborador', 'empresa'].includes(t.id)));
  const origens = combinada ? [] : L.ORIGENS.filter((o) => (tipo === 'receita' ? o.id !== 'instrutor' && o.id !== 'folha' : o.id !== 'contrato'));
  const sel = (chave, opcoes, vazio) => selectHtml(`pf-${chave}`, opcoes, f[chave], { vazio, classe: 'campo', name: chave });
  // Na combinada ficam de fora origem e categoria (as listas diferem por tipo).
  const campos = [
    ['Natureza', sel('natureza', L.NATUREZAS_PESSOA.map((n) => ({ id: n.id, nome: n.nome })), 'PF e PJ')],
    ['Forma de pagamento', sel('forma', L.FORMAS, 'Todas')],
    combinada ? null : ['Origem', sel('origem', origens, 'Todas')],
    ['Tipo de pessoa', sel('pessoaTipo', tiposPessoa, 'Todos')],
    [tipo === 'receita' ? 'Centro de receita' : 'Centro de custo', sel('centroCustoId', centros, 'Todos')],
    combinada ? null : ['Categoria', sel('categoriaId', categorias, 'Todas')],
    ['Conta bancária', sel('contaBancariaId', contas, 'Todas')],
    ['Turma', campoCombo('turmaId', estado.turmas, f.turmaId, { id: 'pf-turmaId', vazio: 'Todas', opcional: true })],
  ].filter(Boolean);
  const el = abrirPainel(gatilho, `
    <form id="pf-form">
      <div class="grid grid-cols-3 gap-x-4 gap-y-3">
        ${campos.map(([rotulo, corpo]) => `<div><label class="rotulo" for="${corpo.match(/id="(pf-[^"]+)"/)?.[1] ?? ''}">${rotulo}</label>${corpo}</div>`).join('')}
      </div>
      <div class="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-neutral-900 pt-3">
        <button type="button" id="pf-limpar" class="${BOTAO_LINK}" ${CHAVES_PAINEL.some((k) => f[k]) ? '' : 'disabled'}>Limpar estes filtros</button>
        <div class="flex items-center gap-2">
          <button type="button" id="pf-cancelar" class="${BOTAO_CANCELAR}">Cancelar</button>
          <button type="submit" class="${BOTAO_PRI}">Aplicar</button>
        </div>
      </div>
    </form>`, { rotulo: 'Filtros', largura: 'w-[46rem]' });
  if (!el) return;
  ativarCombos(el);
  el.querySelector('#pf-limpar').addEventListener('click', () => { CHAVES_PAINEL.forEach((k) => { f[k] = ''; }); render(); });
  el.querySelector('#pf-cancelar').addEventListener('click', () => { fecharPainel(); gatilho.focus(); });
  el.querySelector('#pf-form').addEventListener('submit', (e) => {
    e.preventDefault();
    CHAVES_PAINEL.forEach((k) => { const campo = el.querySelector(`[name="${k}"]`); if (campo) f[k] = campo.value; });
    render();
  });
  el.querySelector('select, button')?.focus();
}

function linhasContas(tipo) {
  const c = estado.contas[tipo];
  const f = c.filtros;
  const filtradas = L.filtrar(estado.lista, { tipo: tipo === 'ambas' ? '' : tipo, de: f.de, ate: f.ate, campoPeriodo: f.campoPeriodo, situacao: f.situacao, forma: f.forma, origem: f.origem, centroCustoId: f.centroCustoId, categoriaId: f.categoriaId, contaBancariaId: f.contaBancariaId, turmaId: f.turmaId, pessoaTipo: f.pessoaTipo, natureza: f.natureza, busca: f.busca });
  return L.ordenar(filtradas, c.ordem.campo, c.ordem.dir);
}

function htmlContas(tipo) {
  const c = estado.contas[tipo];
  const f = c.filtros;
  const rot = ROTULO_TIPO[tipo];
  const combinada = tipo === 'ambas';
  const linhas = linhasContas(tipo);
  const tot = L.totais(linhas);
  // Resumo da combinada: soma do valor final das linhas filtradas por tipo — com o filtro padrão "Em aberto" é o que falta receber/pagar.
  // Na combinada ficam ocultos os filtros que dependem do tipo (origem e categoria — as listas diferem por tipo).
  const totReceber = combinada ? L.totais(linhas.filter((l) => l.tipo === 'receita')) : null;
  const totPagar = combinada ? L.totais(linhas.filter((l) => l.tipo === 'despesa')) : null;
  const saldo = combinada ? L.arred(totReceber.final - totPagar.final) : 0;
  const ids = new Set(linhas.map((l) => l.id));
  c.selecao.forEach((id) => { if (!ids.has(id)) c.selecao.delete(id); });
  const selecionadas = linhas.filter((l) => c.selecao.has(l.id));
  const totalSel = L.arred(selecionadas.reduce((s, l) => s + L.valorFinal(l), 0));
  const filtrando = JSON.stringify(f) !== JSON.stringify(filtrosPadrao());
  const nPainel = CHAVES_PAINEL.filter((k) => f[k]).length;
  const resumo = resumoFiltrosPainel(f);
  const temSetas = !!deslocarPeriodo(f, 1);
  const selecionaveis = linhas.filter((l) => l.status !== 'cancelado');
  const ordCol = (campo, nome, alinha = '') => {
    const ativa = c.ordem.campo === campo;
    return `<th scope="col" class="${TH} font-medium ${alinha}" ${ativa ? `aria-sort="${c.ordem.dir === 'desc' ? 'descending' : 'ascending'}"` : ''}><button type="button" data-ordenar="${campo}" class="inline-flex items-center gap-1 rounded hover:text-slate-800 dark:hover:text-neutral-100 transition ${ativa ? 'text-slate-800 dark:text-neutral-100' : ''}">${nome}${ativa ? (c.ordem.dir === 'desc' ? ICONE.abaixo : ICONE.acima) : ''}</button></th>`;
  };
  const situacoes = [{ id: 'aberto', nome: 'Em aberto' }, ...L.SITUACOES.map((s) => ({ id: s.id, nome: s.nome }))];
  const parte = ([id, nome]) => `<button type="button" data-parte="${id}" aria-pressed="${estado.aba === id}" class="h-7 px-2.5 rounded-md text-[12.5px] font-medium whitespace-nowrap transition ${estado.aba === id ? 'bg-[color:var(--f-elevado)] text-[color:var(--f-tinta)] shadow-[0_1px_2px_rgb(7_30_44/0.08)]' : 'text-[color:var(--f-tinta-2)] hover:text-[color:var(--f-tinta)]'}">${nome}</button>`;
  const forte = (v, cor = 'text-slate-900 dark:text-neutral-100') => `<span class="font-semibold tabular-nums ${cor}">${v}</span>`;
  const totais = combinada
    ? [
      `A receber ${forte(moeda(totReceber.final))}`,
      `A pagar ${forte(moeda(totPagar.final))}`,
      `Saldo ${forte(saldo < 0 ? `− ${moeda(-saldo)}` : moeda(saldo), saldo < 0 ? RUIM : undefined)}`,
    ]
    : [
      `Total ${forte(moeda(tot.final))}${tot.desconto ? ` <span class="text-xs">(${moeda(tot.desconto)} de desconto)</span>` : ''}`,
      tot.pago ? `Pago ${forte(moeda(tot.pago))}` : '',
      tot.aberto && tot.aberto !== tot.final ? `Em aberto ${forte(moeda(tot.aberto))}` : '',
      tot.vencido ? `Vencido ${forte(moeda(tot.vencido), RUIM)} <span class="text-xs">em ${plural(tot.nVencidos, 'lançamento')}</span>` : '',
    ];

  return `
    ${cartoesOperacionais()}
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <div class="inline-flex rounded-lg bg-[color:var(--f-etiqueta)] p-0.5" role="group" aria-label="Contas">${PARTES_CONTAS.map(parte).join('')}</div>
      <div class="ml-auto flex items-center gap-2">
        <button type="button" id="ct-csv" class="${BOTAO_SEC}" title="Baixa um CSV com as linhas filtradas" ${linhas.length ? '' : 'disabled'}>Exportar CSV</button>
        <button type="button" id="ct-novo" class="${BOTAO_PRI}">${ICONE.mais}${rot.novo}</button>
      </div>
    </div>
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <label class="relative">
        <span class="sr-only">Buscar</span>
        ${ICONE_LUPA}
        <input id="ct-busca" type="search" value="${esc(f.busca)}" placeholder="Buscar ${combinada ? 'nome' : rot.pessoa}, documento, venda ou NF" class="${CAMPO_BUSCA} w-80">
      </label>
      <div class="inline-flex items-stretch rounded-lg">
        <button type="button" id="ct-periodo-ant" class="${BOTAO_SETA} rounded-l-lg relative hover:z-10" aria-label="Período anterior" ${temSetas ? '' : 'disabled'}>${ICONE_SETA(-1)}</button>
        <button type="button" id="ct-periodo" class="${BOTAO_PERIODO} -ml-px relative hover:z-10" aria-haspopup="dialog" aria-expanded="false" title="Período e data considerada">${ICONE_CALENDARIO}<span class="text-slate-800 dark:text-neutral-100">${esc(rotuloPeriodo(f))}</span><span class="text-xs font-normal ${APOIO}">${esc(CAMPOS_PERIODO.find((o) => o.id === f.campoPeriodo)?.curto ?? '')}</span></button>
        <button type="button" id="ct-periodo-prox" class="${BOTAO_SETA} rounded-r-lg -ml-px relative hover:z-10" aria-label="Próximo período" ${temSetas ? '' : 'disabled'}>${ICONE_SETA(1)}</button>
      </div>
      ${selectHtml('ct-situacao', situacoes, f.situacao, { vazio: 'Todas as situações', classe: SELECT_FILTRO, title: 'Situação · Em aberto = previsto, emitido e vencido' }).replace('<select', '<select aria-label="Situação"')}
      <button type="button" id="ct-filtros" class="${BOTAO_SEC} ${nPainel ? 'border-petrol-800 text-petrol-800 dark:border-sky-400 dark:text-sky-300' : ''}" aria-haspopup="dialog" aria-expanded="false" title="Natureza, forma, origem, tipo de pessoa, centros, categoria, conta e turma">${ICONE_FUNIL}Filtros${nPainel ? `<span class="ml-0.5 rounded-full bg-[color:var(--f-selecao)] text-[color:var(--f-marca-tinta)] px-1.5 text-xs font-semibold tabular-nums">${nPainel}</span>` : ''}</button>
      ${filtrando ? `<button type="button" id="ct-limpar" class="${BOTAO_LINK}">Limpar</button>` : ''}
    </div>
    ${resumo.length ? `<p class="mb-3 -mt-1 text-xs ${APOIO_FUNDO}"><span class="font-medium">Filtrando por</span> ${resumo.map(esc).join(' · ')}</p>` : ''}
    <p class="mb-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm ${APOIO_FUNDO}">
      <span>${forte(tot.n)} ${tot.n === 1 ? 'lançamento' : 'lançamentos'}</span>
      ${totais.filter(Boolean).map((t) => `<span>${t}</span>`).join('')}
    </p>

    <div class="${CARTAO} overflow-clip">
      <table class="w-full table-fixed text-left" data-lista="contas">
        <colgroup>
          ${combinada ? '' : '<col class="w-11">'}
          <col class="w-[7rem]"><col><col class="w-[9.5rem]"><col class="w-[10rem]"><col class="w-[8.5rem]">
        </colgroup>
        <thead class="${THEAD}">
          <tr>
            ${combinada ? '' : `<th scope="col" class="pl-4 pr-1 py-2.5"><input type="checkbox" id="ct-todos" class="check align-middle" aria-label="Selecionar todos os ${plural(selecionaveis.length, 'lançamento visível', 'lançamentos visíveis')}" ${selecionaveis.length && selecionadas.length === selecionaveis.length ? 'checked' : ''} ${selecionaveis.length ? '' : 'disabled'}></th>`}
            ${ordCol('vencimento', 'Vencimento')}
            ${ordCol('pessoa', combinada ? 'Cliente ou favorecido' : tipo === 'receita' ? 'Cliente' : 'Favorecido')}
            ${ordCol('valor', 'Valor', 'text-right')}
            ${ordCol('status', 'Situação')}
            <th scope="col" class="${TH}"><span class="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody class="${CORPO_TABELA}">
          ${linhas.length ? fatia('contas', linhas, JSON.stringify([tipo, f, c.ordem])).map((l) => linhaConta(l, c.selecao.has(l.id), combinada)).join('') : `<tr><td colspan="${combinada ? 5 : 6}" class="px-4 py-10 text-center text-sm ${APOIO}">Nenhum lançamento com esses filtros.${filtrando ? ` <button type="button" id="ct-limpar-vazio" class="${LINK}">Limpar filtros</button>` : ''}</td></tr>`}
        </tbody>
      </table>
    </div>
    ${botaoMais('contas', linhas.length)}
    ${selecionadas.length ? `
    <div class="sticky bottom-0 z-20 mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 dark:border-neutral-800 bg-[color:var(--f-selecao)] text-petrol-900 dark:text-sky-100 px-4 py-2 text-sm shadow-[0_-6px_20px_-12px_rgb(7_30_44/0.35)]">
      <span class="font-medium mr-2">${selecionadas.length} ${selecionadas.length === 1 ? 'selecionado' : 'selecionados'} · <span class="tabular-nums">${moeda(totalSel)}</span></span>
      <button type="button" data-massa="baixa" class="${BOTAO_SEC} h-8">Dar baixa</button>
      ${tipo === 'receita' ? `<button type="button" data-massa="cobranca" class="${BOTAO_SEC} h-8">Gerar cobranças Asaas</button>` : ''}
      <button type="button" data-massa="cancelar" class="${BOTAO_PERIGO} h-8">Cancelar</button>
      <button type="button" data-massa="limpar" class="${BOTAO_LINK} ml-auto">Limpar seleção</button>
    </div>` : ''}`;
}

// Linha: quem e o quê na mesma célula (categoria e centros ficam no detalhe); a fase diz a forma e o pagamento;
// o próximo passo do lançamento em aberto fica à vista ("Dar baixa" ou, sem NF do instrutor, "Registrar NF").
function linhaConta(l, marcada, combinada = false) {
  const link = L.linkOrigem(l);
  const origem = L.descricaoOrigem(l);
  const s = L.situacao(l);
  const doc = [l.pessoa?.documento ? `<span class="tabular-nums">${esc(l.pessoa.documento)}</span>` : '', chipNatureza(l.pessoa), chipSegmento(l.segmento)].filter(Boolean).join(' · ');
  const competenciaDiferente = l.competencia && l.competencia !== L.mesDe(l.vencimento);
  const vf = L.valorFinal(l);
  const pagoDiferente = l.valorPago != null && Math.abs(l.valorPago - vf) > 0.005;
  const detalheValor = pagoDiferente ? `<span class="block text-xs ${AVISO}" title="Valor efetivamente pago">pago ${moeda(l.valorPago)}</span>`
    : l.desconto ? `<span class="block text-xs ${APOIO}">${moeda(l.desconto)} de desconto</span>` : '';
  const fatura = l.asaas ? `<button type="button" data-fatura="${esc(l.id)}" class="${LINK} text-xs" title="Cobrança ${esc(l.asaas.id)} · ${esc(L.nomeDe(L.STATUS_ASAAS, l.asaas.status))}">fatura</button>` : '';
  const detalheSituacao = s === 'pago' ? `${dataBr(l.pagoEm)} · ${esc(nomeConta(l.contaBancariaId))}`
    : s === 'cancelado' ? ''
      : [s === 'vencido' ? `há ${plural(L.diasAtraso(l), 'dia', 'dias')}` : '', esc(nomeForma(l.forma)), fatura].filter(Boolean).join(' · ');
  const baixa = L.podeBaixar(l);
  const quem = esc(`${l.pessoa?.nome ?? l.descricao}, ${moeda(vf)}`);
  const acao = baixa.ok ? `<button type="button" data-baixa="${esc(l.id)}" class="${BOTAO_FANTASMA} px-2" aria-label="Dar baixa: ${quem}">Dar baixa</button>`
    : L.emAberto(l) && !l.nf ? `<button type="button" data-nf="${esc(l.id)}" class="${BOTAO_FANTASMA} px-2" title="${esc(baixa.motivo)}" aria-label="Registrar NF: ${quem}">Registrar NF</button>` : '';
  return `
    <tr class="${LINHA} ${FOCO_LINHA} cursor-pointer ${s === 'cancelado' ? 'linha-apagada' : ''}" data-id="${esc(l.id)}">
      ${combinada ? '' : `<td class="pl-4 pr-1 py-2.5 align-top"><input type="checkbox" class="check mt-0.5" data-sel="${esc(l.id)}" aria-label="Selecionar ${esc(l.pessoa?.nome ?? '')}: ${esc(l.descricao)}" ${marcada ? 'checked' : ''} ${s === 'cancelado' ? 'disabled' : ''}></td>`}
      <td class="${TD} tabular-nums whitespace-nowrap">${dataBr(l.vencimento)}${competenciaDiferente ? `<span class="block text-xs ${APOIO}">comp. ${esc(mesRotulo(l.competencia))}</span>` : ''}</td>
      <td class="${TD} min-w-0">
        <p class="truncate"><button type="button" data-detalhe="${esc(l.id)}" class="link-registro font-medium text-slate-800 dark:text-neutral-100 hover:underline underline-offset-2 focus-visible:outline-none">${esc(l.pessoa?.nome ?? '—')}</button>${doc ? ` <span class="text-xs ${APOIO}">${doc}</span>` : ''}</p>
        <p class="truncate" title="${esc(l.descricao)} · ${esc(origem)}">${esc(l.descricao)} <span class="text-xs ${APOIO}">· ${link ? `<a href="${link}" class="hover:underline hover:text-petrol-800 dark:hover:text-sky-300">${esc(origem)}</a>` : esc(origem)}${l.nf ? ` · NF ${esc(l.nf.numero)}` : ''}</span></p>
      </td>
      <td class="${TDN}"><span class="font-medium text-slate-800 dark:text-neutral-100">${combinada ? valorComSinal(l.tipo, vf) : moeda(vf)}</span>${detalheValor}</td>
      <td class="${TD}">${pontoSituacao(l)}${detalheSituacao ? `<span class="block text-xs ${s === 'vencido' ? RUIM : APOIO} truncate pl-3.5">${detalheSituacao}</span>` : ''}</td>
      <td class="pl-2 pr-3 py-2 text-right whitespace-nowrap align-top">${acao}<button type="button" data-menu="${esc(l.id)}" class="${BOTAO_FANTASMA} px-1.5" aria-label="Mais ações: ${quem}" aria-haspopup="menu" aria-expanded="false">${ICONE.reticencias}</button></td>
    </tr>`;
}

function ligarContas(el, tipo) {
  const c = estado.contas[tipo];
  const f = c.filtros;
  const aoMudar = (id, chave, { render: r = true } = {}) => el.querySelector(`#${id}`)?.addEventListener('change', (e) => { f[chave] = e.target.value; if (r) render(); });
  let timer = null;
  el.querySelector('#ct-busca')?.addEventListener('input', (e) => { f.busca = e.target.value; clearTimeout(timer); timer = setTimeout(() => { const pos = e.target.selectionStart; render(); const b = document.getElementById('ct-busca'); if (b) { b.focus(); b.setSelectionRange(pos, pos); } }, 250); });
  aoMudar('ct-situacao', 'situacao');
  el.querySelectorAll('[data-parte]').forEach((b) => b.addEventListener('click', () => { estado.aba = b.dataset.parte; atualizarUrl(); render(); }));
  el.querySelector('#ct-periodo')?.addEventListener('click', (e) => painelPeriodo(tipo, e.currentTarget));
  el.querySelector('#ct-periodo-ant')?.addEventListener('click', () => { Object.assign(f, deslocarPeriodo(f, -1)); render(); });
  el.querySelector('#ct-periodo-prox')?.addEventListener('click', () => { Object.assign(f, deslocarPeriodo(f, 1)); render(); });
  el.querySelector('#ct-filtros')?.addEventListener('click', (e) => painelFiltros(tipo, e.currentTarget));
  const limpar = () => { c.filtros = filtrosPadrao(); atualizarUrl(); render(); };
  el.querySelector('#ct-limpar')?.addEventListener('click', limpar);
  el.querySelector('#ct-limpar-vazio')?.addEventListener('click', limpar);
  el.querySelector('#ct-novo')?.addEventListener('click', () => modalLancamento(tipo === 'ambas' ? {} : { tipo })); // na combinada o modal abre sem tipo (cartões-rádio Receita/Despesa)
  el.querySelector('#ct-csv')?.addEventListener('click', () => { baixarArquivo(`${tipo === 'receita' ? 'contas-a-receber' : tipo === 'despesa' ? 'contas-a-pagar' : 'pagar-x-receber'}-${L.hoje()}.csv`, L.csv(linhasContas(tipo), estado.plano)); toast('CSV gerado.'); }); // L.csv já traz a coluna Tipo — serve para a combinada
  el.querySelectorAll('[data-ordenar]').forEach((b) => b.addEventListener('click', () => { const campo = b.dataset.ordenar; c.ordem = { campo, dir: c.ordem.campo === campo && c.ordem.dir === 'asc' ? 'desc' : 'asc' }; render(); document.querySelector(`[data-ordenar="${campo}"]`)?.focus(); }));
  el.querySelector('#ct-todos')?.addEventListener('change', (e) => { const ls = linhasContas(tipo).filter((l) => l.status !== 'cancelado'); if (e.target.checked) ls.forEach((l) => c.selecao.add(l.id)); else c.selecao.clear(); render(); });
  el.querySelectorAll('[data-sel]').forEach((cb) => cb.addEventListener('change', () => { if (cb.checked) c.selecao.add(cb.dataset.sel); else c.selecao.delete(cb.dataset.sel); render(); document.querySelector(`[data-sel="${cb.dataset.sel}"]`)?.focus(); }));
  el.querySelectorAll('[data-massa]').forEach((b) => b.addEventListener('click', () => acaoMassa(tipo, b.dataset.massa)));
  el.querySelectorAll('[data-fatura]').forEach((a) => a.addEventListener('click', () => modalFatura(a.dataset.fatura)));
  el.querySelectorAll('[data-baixa]').forEach((b) => b.addEventListener('click', () => modalBaixa(b.dataset.baixa)));
  el.querySelectorAll('[data-nf]').forEach((b) => b.addEventListener('click', () => modalNf(b.dataset.nf)));
  el.querySelectorAll('[data-detalhe]').forEach((b) => b.addEventListener('click', () => modalDetalhes(b.dataset.detalhe)));
  el.querySelectorAll('[data-menu]').forEach((b) => b.addEventListener('click', () => abrirMenu(b, itensMenu(lanc(b.dataset.menu)))));
  // Clique em qualquer ponto "vazio" da linha abre os detalhes; botões, links e checkbox mantêm a ação própria.
  el.querySelectorAll('tbody tr[data-id]').forEach((tr) => tr.addEventListener('click', (e) => { if (e.target.closest('button, a, input, label, [data-combo]')) return; modalDetalhes(tr.dataset.id); }));
}

// ---------- Menu da linha (js/menu-mais.js: setas, Esc, motivo do item travado na 2ª linha) ----------

function itensMenu(l) {
  const baixa = L.podeBaixar(l);
  const link = L.linkOrigem(l);
  const itens = [];
  if (L.emAberto(l)) itens.push({ nome: 'Dar baixa', desabilitado: !baixa.ok, detalhe: baixa.ok ? '' : baixa.motivo, acao: () => modalBaixa(l.id) });
  if (L.podeEstornar(l)) itens.push({ nome: 'Estornar pagamento', detalhe: 'Volta a ficar em aberto', acao: () => confirmarEstorno(l.id) });
  if (l.tipo === 'receita' && L.podeGerarCobranca(l)) itens.push({ nome: 'Gerar cobrança Asaas', detalhe: 'Boleto ou Pix', acao: () => modalCobranca([l.id]) });
  if (l.asaas) itens.push({ nome: 'Fatura Asaas', detalhe: `${l.asaas.id} · ${L.nomeDe(L.STATUS_ASAAS, l.asaas.status)}`, acao: () => modalFatura(l.id) });
  if (l.asaas && L.emAberto(l)) itens.push({ nome: 'Simular pagamento', detalhe: 'Sandbox: o Asaas avisa que a cobrança foi paga', acao: () => simularPagamento(l.id) });
  if (l.status !== 'cancelado') itens.push({ nome: l.nf ? `Alterar NF ${l.nf.numero}` : 'Registrar NF', acao: () => modalNf(l.id) });
  itens.push('sep');
  if (L.podeEditar(l)) itens.push({ nome: 'Editar', acao: () => modalLancamento({ id: l.id }) });
  if (link) itens.push({ nome: 'Abrir origem', detalhe: L.descricaoOrigem(l), acao: () => { location.href = link; } });
  if (L.podeCancelar(l)) itens.push({ nome: 'Cancelar lançamento', perigo: true, acao: () => confirmarCancelar([l.id]) });
  else if (L.emAberto(l)) itens.push({ nome: 'Cancelar lançamento', desabilitado: true, detalhe: 'Parcela de venda e pagamento de instrutor se cancelam na origem', acao: () => {} });
  if (L.podeRemover(l) && l.status === 'cancelado') itens.push({ nome: 'Excluir', perigo: true, acao: () => confirmarExcluir(l.id) });
  if (itens.at(-1) === 'sep') itens.pop();
  if (itens[0] === 'sep') itens.shift();
  return itens;
}

// ---------- Estorno (confirma dizendo o que muda na origem) e simulação do webhook ----------

function confirmarEstorno(id) {
  const l = lanc(id);
  if (!l || !L.podeEstornar(l)) { toast('Só lançamentos pagos podem ser estornados.'); return; }
  const volta = l.asaas || l.nf ? 'emitido' : 'previsto';
  const efeitos = [
    `O lançamento volta a ficar em aberto (${l.vencimento < L.hoje() ? 'vencido' : volta}), sem data nem conta de pagamento.`,
    l.origem?.tipo === 'contrato' ? `A parcela ${l.origem.parcelaN}${l.origem.totalParcelas ? `/${l.origem.totalParcelas}` : ''} da venda ${esc(l.origem.codigo ?? '')} volta a ficar em aberto em Vendas e Cobranças.` : '',
    l.origem?.tipo === 'instrutor' ? 'O pagamento volta a ficar em aberto no contrato do instrutor.' : '',
    l.conciliado ? `A conciliação de ${dataBr(l.conciliado.em)} é desfeita; o movimento volta para a fila da conciliação.` : '',
    l.asaas ? `A cobrança ${esc(l.asaas.id)} volta a ${l.vencimento < L.hoje() ? 'vencida' : 'pendente'} no Asaas.` : '',
  ].filter(Boolean);
  modalConfirmacao({
    titulo: 'Estornar pagamento', tom: 'vermelho', rotulo: 'Estornar pagamento',
    corpo: `<p><span class="font-medium">${esc(l.descricao)}</span>, pago em ${dataBr(l.pagoEm)} · <span class="tabular-nums">${moeda(l.valorPago ?? L.valorFinal(l))}</span>.</p><ul class="list-disc pl-5 space-y-1">${efeitos.map((e) => `<li>${e}</li>`).join('')}</ul>`,
    aoConfirmar: () => {
      const r = L.estornar(estado.lista, id);
      if (r.erro) { toast(r.erro); return; }
      estado.lista = r.lista; persistir(); recarregar(); render();
      toast('Pagamento estornado: o lançamento voltou a ficar em aberto.');
    },
  });
}
function simularPagamento(id) {
  const r = L.simularPagamentoAsaas(estado.lista, id, L.hoje());
  if (r.erro) { toast(r.erro); return; }
  estado.lista = r.lista; persistir(); recarregar(); render();
  toast(`Webhook recebido: cobrança paga e baixa registrada em ${dataBr(L.hoje())}.`);
}

// ---------- Modal: novo / editar ----------

function opcoesPessoa(tipoPessoa) {
  return (estado.pessoas[tipoPessoa] ?? []).map((p) => ({ id: p.id, nome: p.nome, descricao: p.documento }));
}
function tiposPessoaDo(tipo) {
  return L.TIPOS_PESSOA.filter((t) => (tipo === 'receita' ? ['aluno', 'empresa', 'responsavel', 'fornecedor'].includes(t.id) : ['fornecedor', 'instrutor', 'colaborador', 'empresa', 'aluno'].includes(t.id)));
}
// Contas bancárias ativas para o combo com busca: logo da instituição e banco/agência/conta na descrição.
function opcoesConta() {
  return estado.plano.contasBancarias.filter((c) => c.status === 'ativo').map((c) => {
    const inst = L.instituicaoDaConta(c);
    return {
      id: c.id, nome: c.nome,
      descricao: [inst?.nome ?? c.banco, c.agencia ? `ag ${c.agencia}` : '', c.conta ? `c/c ${c.conta}` : ''].filter(Boolean).join(' · '),
      logo: inst?.logo ?? null,
    };
  });
}

function modalLancamento({ tipo = null, id = null } = {}) {
  const atual = id ? lanc(id) : null;
  const editando = !!atual;
  const editaveis = editando ? L.camposEditaveis(atual) : null;
  const pode = (campo) => !editando || editaveis.includes(campo);
  let tipoAtual = atual?.tipo ?? tipo ?? 'despesa';
  const categorias = (t) => L.categoriasDoTipo(estado.plano, t).map((x) => ({ id: x.id, nome: `${x.codigo} ${x.nome}` }));
  const centros = L.centrosDoTipo(estado.plano, 'custo').map((x) => ({ id: x.id, nome: `${x.codigo} ${x.nome}` }));
  const trava = (campo) => (pode(campo) ? '' : 'disabled');
  // Receita não tem centro de custo: o campo some (o segmento B2C/B2B vem do CPF/CNPJ do cliente).
  const blocoCentro = campoHtml('Centro de custo', selectHtml('f-centroCustoId', centros, atual?.centroCustoId ?? '', { name: 'centroCustoId' }), { name: 'centroCustoId' });
  const blocoPessoa = (tipoPessoa, pessoaId) => `
    <div class="grid sm:grid-cols-[11rem_1fr] gap-3">
      ${campoHtml(editando && !pode('pessoa') ? 'Tipo' : 'Tipo de pessoa', selectHtml('f-pessoaTipo', tiposPessoaDo(tipoAtual), tipoPessoa, { name: 'pessoaTipo' }).replace('<select', `<select ${trava('pessoa')}`), { name: 'pessoaTipo' })}
      <div>
        <label class="rotulo" for="f-pessoaId">${tipoAtual === 'receita' ? 'Cliente' : 'Favorecido'}</label>
        <div id="combo-pessoa">${pode('pessoa') ? campoCombo('pessoaId', opcoesPessoa(tipoPessoa), pessoaId, { id: 'f-pessoaId', vazio: tipoPessoa ? 'Buscar pelo nome ou documento…' : 'Escolha o tipo primeiro' }) : `<input type="text" class="campo" disabled value="${esc(atual?.pessoa?.nome ?? '')}">`}</div>
        ${ERRO('pessoa')}
      </div>
    </div>`;
  const corpo = `
    ${editando ? `<div class="rounded-lg bg-slate-50 dark:bg-neutral-900 px-3 py-2 text-xs text-slate-600 dark:text-neutral-300">${esc(L.descricaoOrigem(atual))}${editaveis.length < 10 ? ' — valor, datas e pessoa vêm da origem; aqui só categoria, centros, conta, NF e observação.' : ''}</div>` : `
    <div>
      <p class="rotulo">Tipo</p>
      <div class="grid grid-cols-2 gap-3">
        ${L.TIPOS.map((t) => `<label class="${CARTAO_OPCAO} flex items-center gap-3"><input type="radio" name="tipo" value="${t.id}" class="sr-only" ${t.id === tipoAtual ? 'checked' : ''}><span class="grid place-items-center h-10 w-10 rounded-full shrink-0 bg-slate-100 dark:bg-neutral-900">${iconeTipo(t.id, 'h-6 w-6')}</span><span class="min-w-0"><span class="block text-sm font-semibold text-slate-800 dark:text-neutral-100">${t.nome}</span><span class="block text-xs ${APOIO}">${t.descricao}</span></span></label>`).join('')}
      </div>
      ${ERRO('tipo')}
    </div>`}
    ${campoHtml('Descrição', `<input id="f-descricao" name="descricao" type="text" class="campo" value="${esc(atual?.descricao ?? '')}" ${trava('descricao')} placeholder="Ex.: Aluguel da sede — setembro/2026">`, { name: 'descricao' })}
    <div id="bloco-pessoa">${blocoPessoa(atual?.pessoa?.tipo ?? '', atual?.pessoa?.id ?? '')}</div>
    <div class="grid sm:grid-cols-2 gap-3">
      ${campoHtml('Valor (R$)', `<input id="f-valor" name="valor" type="number" min="0" step="0.01" class="campo tabular-nums" value="${atual ? Number(atual.valor).toFixed(2) : ''}" ${trava('valor')} placeholder="0,00">`, { name: 'valor' })}
      ${campoHtml('Desconto (R$)', `<input id="f-desconto" name="desconto" type="number" min="0" step="0.01" class="campo tabular-nums" value="${atual && atual.desconto ? atual.desconto : ''}" ${trava('desconto')} placeholder="0,00">`, { name: 'desconto', opcional: true })}
    </div>
    <div class="grid sm:grid-cols-3 gap-3">
      ${campoHtml('Competência', `<input id="f-competencia" name="competencia" type="month" class="campo tabular-nums" value="${esc(atual?.competencia ?? '')}" ${trava('competencia')}>`, { name: 'competencia', opcional: true, ajuda: 'Vazio = mês do vencimento.' })}
      ${campoHtml('Vencimento', `<input id="f-vencimento" name="vencimento" type="date" class="campo tabular-nums" value="${esc(atual?.vencimento ?? '')}" ${trava('vencimento')}>`, { name: 'vencimento' })}
      ${campoHtml('Forma', selectHtml('f-forma', L.FORMAS, atual?.forma ?? '', { name: 'forma' }).replace('<select', `<select ${trava('forma')}`), { name: 'forma' })}
    </div>
    <div class="grid sm:grid-cols-3 gap-3">
      <div id="bloco-categoria">${campoHtml('Categoria', selectHtml('f-categoriaId', categorias(tipoAtual), atual?.categoriaId ?? '', { name: 'categoriaId' }), { name: 'categoriaId' })}</div>
      <div id="bloco-centro" ${tipoAtual === 'receita' ? 'hidden' : ''}>${blocoCentro}</div>
      ${campoHtml('Conta bancária', campoCombo('contaBancariaId', opcoesConta(), atual?.contaBancariaId ?? '', { id: 'f-contaBancariaId', vazio: 'Buscar conta…' }), { name: 'contaBancariaId' })}
    </div>
    <div class="grid sm:grid-cols-2 gap-3">
      ${campoHtml('Turma', pode('turmaId') ? campoCombo('turmaId', estado.turmas, atual?.turmaId ?? '', { id: 'f-turmaId', vazio: 'Buscar turma…', opcional: true }) : `<input type="text" class="campo" disabled value="${esc(estado.turmas.find((t) => t.id === atual?.turmaId)?.nome ?? '—')}">`, { name: 'turmaId', opcional: true })}
    </div>
    ${campoHtml('Observação', `<textarea id="f-observacao" name="observacao" rows="2" class="campo">${esc(atual?.observacao ?? '')}</textarea>`, { name: 'observacao', opcional: true })}`;

  const { form } = modalFormulario({
    id: 'form-lancamento', largura: 'xl',
    titulo: editando ? 'Editar lançamento' : ROTULO_TIPO[tipo]?.novo ?? 'Novo lançamento',
    subtitulo: editando ? `${L.nomeDe(L.TIPOS, atual.tipo)} · ${esc(atual.descricao)}` : 'Receita avulsa ou despesa lançada à mão. Parcelas de venda nascem na venda; pagamentos de instrutor, no contrato do instrutor.',
    corpo, rotulo: editando ? 'Salvar' : 'Criar lançamento', foco: editando ? '#f-categoriaId' : '#f-descricao',
    aoSalvar: (fd) => {
      const pessoaTipo = fd.get('pessoaTipo') ?? atual?.pessoa?.tipo;
      const pessoaId = fd.get('pessoaId') ?? atual?.pessoa?.id;
      const p = (estado.pessoas[pessoaTipo] ?? []).find((x) => String(x.id) === String(pessoaId));
      const tipoSalvo = editando ? atual.tipo : fd.get('tipo');
      const dados = {
        tipo: tipoSalvo, descricao: fd.get('descricao') ?? atual?.descricao,
        pessoa: pode('pessoa') ? (p ? { tipo: pessoaTipo, id: p.id, nome: p.nome, documento: p.documento } : null) : atual.pessoa,
        valor: numeroForm(fd.get('valor')) ?? atual?.valor, desconto: numeroForm(fd.get('desconto')) ?? atual?.desconto ?? 0,
        competencia: fd.get('competencia') ?? atual?.competencia, vencimento: fd.get('vencimento') ?? atual?.vencimento, forma: fd.get('forma') ?? atual?.forma,
        categoriaId: fd.get('categoriaId'), centroCustoId: tipoSalvo === 'receita' ? null : fd.get('centroCustoId'), contaBancariaId: fd.get('contaBancariaId'),
        turmaId: fd.get('turmaId') ?? atual?.turmaId ?? null, observacao: fd.get('observacao') ?? '',
      };
      if (dados.turmaId) { const t = L.contexto().turmas.find((x) => x.id === dados.turmaId); dados.cursoId = t?.cursoId ?? null; }
      const erros = L.validar(dados, estado.plano, atual);
      if (erros.length) return erros;
      if (editando) { alterar((ls) => L.atualizar(ls, atual.id, dados)); toast('Lançamento atualizado.'); }
      else { const r = L.incluir(estado.lista, dados); estado.lista = r.lista; persistir(); toast(`${L.nomeDe(L.TIPOS, dados.tipo)} criada — ${moeda(L.valorFinal(r.lancamento))} com vencimento em ${dataBr(dados.vencimento)}.`); }
      render();
    },
  });

  // Tipo (novo): refiltra categorias e tipos de pessoa; centro de custo só em despesa.
  form.querySelectorAll('input[name="tipo"]').forEach((r) => r.addEventListener('change', () => {
    tipoAtual = r.value;
    form.querySelector('#bloco-categoria').innerHTML = campoHtml('Categoria', selectHtml('f-categoriaId', categorias(tipoAtual), '', { name: 'categoriaId' }), { name: 'categoriaId' });
    form.querySelector('#bloco-centro').hidden = tipoAtual === 'receita';
    form.querySelector('#bloco-pessoa').innerHTML = blocoPessoa('', '');
    ativarCombos(form.querySelector('#bloco-pessoa'));
    ligarTipoPessoa();
  }));
  // Tipo de pessoa: troca as opções do combobox; fornecedor preenche categoria/centro padrão quando vazios.
  const ligarTipoPessoa = () => {
    form.querySelector('#f-pessoaTipo')?.addEventListener('change', (e) => {
      const alvo = form.querySelector('#combo-pessoa');
      alvo.innerHTML = campoCombo('pessoaId', opcoesPessoa(e.target.value), '', { id: 'f-pessoaId', vazio: e.target.value ? 'Buscar pelo nome ou documento…' : 'Escolha o tipo primeiro' });
      ativarCombos(alvo);
      alvo.querySelector('input[type="hidden"]').addEventListener('change', (ev) => {
        const f = estado.pessoas.fornecedor.find((x) => x.id === ev.target.value);
        if (e.target.value !== 'fornecedor' || !f) return;
        const cat = form.querySelector('#f-categoriaId'); const cc = form.querySelector('#f-centroCustoId');
        if (cat && !cat.value && f.categoriaId) cat.value = f.categoriaId;
        if (cc && !cc.value && f.centroCustoId) cc.value = f.centroCustoId;
      });
    });
  };
  ligarTipoPessoa();
}

// ---------- Modal: baixa ----------

function modalBaixa(id) {
  const l = lanc(id);
  const ok = L.podeBaixar(l);
  if (!ok.ok) { toast(ok.motivo); return; }
  const vf = L.valorFinal(l);
  const aviso = l.origem?.tipo === 'contrato' ? `<div class="${FAIXA_INFO}">Baixa refletida na parcela ${l.origem.parcelaN}/${l.origem.totalParcelas} da venda ${esc(l.origem.codigo)} — a tela de Vendas e Cobranças passa a mostrar a parcela como paga.</div>`
    : l.origem?.tipo === 'instrutor' ? `<div class="${FAIXA_INFO}">Baixa refletida no pagamento ${esc(l.origem.pagamentoId)} do contrato do instrutor (NF ${esc(l.nf?.numero ?? '')}).</div>` : '';
  const corpo = `
    <div class="rounded-lg bg-slate-50 dark:bg-neutral-900 px-3 py-2 text-sm">
      <p class="font-medium text-slate-800 dark:text-neutral-100">${esc(l.descricao)}</p>
      <p class="text-xs text-slate-500 dark:text-neutral-400">${esc(l.pessoa?.nome ?? '')} · vencimento ${dataBr(l.vencimento)} · valor final <span class="tabular-nums font-medium">${moeda(vf)}</span></p>
    </div>
    ${aviso}
    <div class="grid sm:grid-cols-2 gap-3">
      ${campoHtml('Data do pagamento', `<input id="f-pagoEm" name="pagoEm" type="date" class="campo tabular-nums" value="${L.hoje()}">`, { name: 'pagoEm' })}
      ${campoHtml('Conta', campoCombo('contaBancariaId', opcoesConta(), l.contaBancariaId ?? '', { id: 'f-contaBancariaId', vazio: 'Buscar conta…' }), { name: 'contaBancariaId' })}
    </div>
    <div class="grid sm:grid-cols-2 gap-3">
      ${campoHtml('Valor pago (R$)', `<input id="f-valorPago" name="valorPago" type="number" min="0" step="0.01" class="campo tabular-nums" value="${vf.toFixed(2)}">`, { name: 'valorPago', ajuda: 'Se for diferente do valor final, explique na observação.' })}
      ${campoHtml('Forma', selectHtml('f-forma', L.FORMAS, l.forma ?? '', { name: 'forma' }), { name: 'forma' })}
    </div>
    ${campoHtml('Observação', `<textarea id="f-observacao" name="observacao" rows="2" class="campo"></textarea>`, { name: 'observacao', opcional: true })}`;
  modalFormulario({
    id: 'form-baixa', titulo: 'Dar baixa', subtitulo: `${L.nomeDe(L.TIPOS, l.tipo)} · ${L.descricaoOrigem(l)}`, corpo, rotulo: 'Confirmar baixa', foco: '#f-pagoEm',
    aoSalvar: (fd) => {
      const erros = [];
      const pagoEm = fd.get('pagoEm'); const vp = numeroForm(fd.get('valorPago')); const obs = String(fd.get('observacao') ?? '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(pagoEm ?? '')) erros.push({ campo: 'pagoEm', mensagem: 'Informe a data do pagamento.' });
      else if (pagoEm > L.hoje()) erros.push({ campo: 'pagoEm', mensagem: 'Data no futuro.' });
      if (!fd.get('contaBancariaId')) erros.push({ campo: 'contaBancariaId', mensagem: 'Escolha a conta.' });
      if (!fd.get('forma')) erros.push({ campo: 'forma', mensagem: 'Escolha a forma.' });
      if (vp == null || Number.isNaN(vp) || vp <= 0) erros.push({ campo: 'valorPago', mensagem: 'Informe o valor pago.' });
      else if (Math.abs(vp - vf) > 0.005 && !obs) erros.push({ campo: 'observacao', mensagem: 'Valor diferente do previsto: informe o motivo.' });
      if (erros.length) return erros;
      const r = L.baixar(estado.lista, id, { pagoEm, contaBancariaId: fd.get('contaBancariaId'), valorPago: vp, forma: fd.get('forma'), observacao: obs });
      if (r.erro) return [{ campo: 'pagoEm', mensagem: r.erro }];
      estado.lista = r.lista; persistir(); recarregar(); render();
      toast(r.aviso ?? `Baixa registrada em ${dataBr(pagoEm)}.`);
    },
  });
}

// ---------- Modal: cobrança Asaas (unitária ou em massa) ----------

function modalCobranca(ids) {
  const validos = ids.map(lanc).filter((l) => l && L.podeGerarCobranca(l));
  if (!validos.length) { toast('Nenhum lançamento em aberto sem cobrança na seleção.'); return; }
  const total = L.arred(validos.reduce((s, l) => s + L.valorFinal(l), 0));
  const corpo = `
    <p class="text-sm text-slate-700 dark:text-neutral-200">${validos.length === 1 ? `Cobrança de <span class="font-medium">${moeda(total)}</span> para ${esc(validos[0].pessoa?.nome ?? '')} (vencimento ${dataBr(validos[0].vencimento)}).` : `${validos.length} cobranças, total <span class="font-medium">${moeda(total)}</span>.`}${ids.length > validos.length ? ` <span class="${APOIO}">${ids.length - validos.length} da seleção já têm cobrança ou não estão em aberto e ficam de fora.</span>` : ''}</p>
    ${campoHtml('Tipo de cobrança', selectHtml('f-tipoCobranca', [{ id: 'BOLETO', nome: `Boleto bancário (taxa ${moeda(LANC_TAXAS_ASAAS.BOLETO)})` }, { id: 'PIX', nome: `Pix (taxa ${moeda(LANC_TAXAS_ASAAS.PIX)})` }], '', { name: 'tipoCobranca' }), { name: 'tipoCobranca', ajuda: 'Sandbox do Asaas: a fatura é fictícia, mas o fluxo (emitido → webhook → pago) é o mesmo.' })}`;
  modalFormulario({
    id: 'form-cobranca', largura: 'md', titulo: validos.length === 1 ? 'Gerar cobrança Asaas' : `Gerar ${validos.length} cobranças Asaas`, subtitulo: 'O lançamento (e a parcela da venda) passam a "emitido".', corpo, rotulo: validos.length === 1 ? 'Gerar cobrança' : 'Gerar cobranças', foco: '#f-tipoCobranca',
    aoSalvar: (fd) => {
      const tipo = fd.get('tipoCobranca');
      if (!tipo) return [{ campo: 'tipoCobranca', mensagem: 'Escolha boleto ou Pix.' }];
      let n = 0; let ultimo = null;
      validos.forEach((l) => { const r = L.gerarCobranca(estado.lista, l.id, { tipo }); if (!r.erro) { estado.lista = r.lista; n += 1; ultimo = l.id; } });
      persistir(); recarregar();
      estado.contas[validos[0].tipo].selecao.clear();
      render();
      toast(n === 1 ? 'Cobrança gerada no Asaas (sandbox).' : `${n} cobranças geradas no Asaas (sandbox).`);
      if (n === 1 && ultimo) modalFatura(ultimo);
    },
  });
}

// ---------- Modal: fatura Asaas ----------

function modalFatura(id) {
  const l = lanc(id);
  if (!l?.asaas) { toast('Lançamento sem cobrança Asaas.'); return; }
  const a = l.asaas;
  const st = L.nomeDe(L.STATUS_ASAAS, a.status);
  const corSt = { PENDING: 'bg-sky-600 dark:bg-sky-400', RECEIVED: 'bg-emerald-500', OVERDUE: 'bg-red-500', REFUNDED: 'bg-slate-400' }[a.status] ?? 'bg-slate-400';
  const copiar = (rot, valor, chave) => `
    <div>
      <p class="rotulo">${rot}</p>
      <div class="flex items-stretch gap-2">
        <code class="flex-1 min-w-0 break-all rounded-lg bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 px-3 py-2 text-xs text-slate-700 dark:text-neutral-200 tabular-nums">${esc(valor)}</code>
        <button type="button" data-copiar="${chave}" class="${BOTAO_SEC} shrink-0">Copiar</button>
      </div>
    </div>`;
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
      <div>
        <h3 id="fatura-titulo" class="font-display font-semibold text-slate-900 dark:text-neutral-100">Fatura Asaas · ${a.tipo === 'PIX' ? 'Pix' : 'Boleto'}</h3>
        <p class="text-xs ${APOIO} mt-0.5">${esc(a.id)} · sandbox · criada em ${dataBr(a.criadoEm)}</p>
      </div>
      <button type="button" data-fechar-modal class="p-1 rounded ${APOIO} hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">${UI_ICONE.fechar}</button>
    </div>
    <div class="px-5 py-4 space-y-4 text-sm overflow-y-auto">
      <div class="rounded-xl border border-dashed border-slate-300 dark:border-neutral-700 p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="font-display font-semibold text-slate-900 dark:text-neutral-100">ProWay Treinamentos</p>
            <p class="text-xs ${APOIO}">Beneficiário · Blumenau/SC</p>
          </div>
          <span class="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-neutral-300"><span class="h-2 w-2 rounded-full ${corSt}"></span>${st}</span>
        </div>
        <dl class="mt-3 grid grid-cols-2 gap-y-1.5 text-xs">
          <dt class="${APOIO}">Pagador</dt><dd class="text-slate-800 dark:text-neutral-100">${esc(l.pessoa?.nome ?? '')}<span class="block ${APOIO} tabular-nums">${esc(l.pessoa?.documento ?? '')}</span></dd>
          <dt class="${APOIO}">Referente a</dt><dd class="text-slate-800 dark:text-neutral-100">${esc(l.descricao)}</dd>
          <dt class="${APOIO}">Vencimento</dt><dd class="text-slate-800 dark:text-neutral-100 tabular-nums">${dataBr(l.vencimento)}</dd>
          <dt class="${APOIO}">Valor</dt><dd class="text-slate-800 dark:text-neutral-100 tabular-nums font-semibold text-base">${moeda(L.valorFinal(l))}</dd>
          <dt class="${APOIO}">Taxa Asaas</dt><dd class="text-slate-800 dark:text-neutral-100 tabular-nums">${moeda(a.taxa)} <span class="${APOIO}">· líquido ${moeda(a.valorLiquido)}</span></dd>
          ${l.pagoEm ? `<dt class="${APOIO}">Pago em</dt><dd class="text-slate-800 dark:text-neutral-100 tabular-nums">${dataBr(l.pagoEm)}</dd>` : ''}
        </dl>
      </div>
      ${a.tipo === 'BOLETO' && a.linhaDigitavel ? copiar('Linha digitável', a.linhaDigitavel, 'linha') : ''}
      ${copiar('Pix copia e cola', a.pixCopiaCola, 'pix')}
      <div class="flex items-center justify-between gap-3">
        <a href="${esc(a.url)}" target="_blank" rel="noopener" class="${BOTAO_LINK}">Abrir fatura no sandbox do Asaas ↗</a>
        ${L.emAberto(l) ? `<button type="button" id="btn-webhook" class="${BOTAO_SEC}" title="Sandbox: o Asaas avisa que a cobrança foi paga">Simular pagamento</button>` : ''}
      </div>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex justify-end"><button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Fechar</button></div>`, 'max-w-xl');
  root.querySelectorAll('[data-copiar]').forEach((b) => b.addEventListener('click', async () => {
    const texto = b.dataset.copiar === 'linha' ? a.linhaDigitavel : a.pixCopiaCola;
    try { await navigator.clipboard.writeText(texto); toast('Copiado.'); } catch (_) { toast('Não foi possível copiar automaticamente.'); }
  }));
  root.querySelector('#btn-webhook')?.addEventListener('click', () => { fecharModal(); simularPagamento(id); });
  root.querySelector('[role="dialog"]').setAttribute('aria-labelledby', 'fatura-titulo');
  root.querySelector('[data-copiar]')?.focus();
}

// ---------- Modal: detalhes do lançamento (só leitura; ações = as mesmas do menu ⋯) ----------

const fmtDataHora = (iso) => (iso ? `${dataBr(iso)} ${String(iso).length > 10 ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}`.trim() : '—');

function modalDetalhes(id) {
  const l = lanc(id);
  if (!l) { toast('Lançamento não encontrado.'); return; }
  const link = L.linkOrigem(l);
  const origem = L.descricaoOrigem(l);
  const turma = estado.turmas.find((t) => t.id === l.turmaId);
  const DD = 'text-slate-800 dark:text-neutral-100 min-w-0';
  const item = (rot, valor, { num = false } = {}) => `<dt class="${APOIO}">${rot}</dt><dd class="${DD} ${num ? 'tabular-nums' : ''}">${valor}</dd>`;
  const bloco = (titulo, itens) => `
    <section>
      <h4 class="text-sm font-semibold text-slate-900 dark:text-neutral-100 mb-2">${titulo}</h4>
      <dl class="grid grid-cols-[9rem_1fr] gap-x-3 gap-y-1.5 text-sm">${itens.join('')}</dl>
    </section>`;
  const valorPagoDiff = l.valorPago != null && Math.abs(l.valorPago - L.valorFinal(l)) > 0.005;
  // Uma ação à vista (o próximo passo do lançamento); o resto no "Mais", com o motivo do que está travado.
  const baixa = L.podeBaixar(l);
  const principal = baixa.ok ? { nome: 'Dar baixa', acao: () => modalBaixa(l.id) }
    : L.emAberto(l) && !l.nf ? { nome: 'Registrar NF', acao: () => modalNf(l.id) } : null;
  const mais = itensMenu(l).filter((it) => it === 'sep' || it.nome !== principal?.nome);
  while (mais[0] === 'sep') mais.shift();
  const historico = [...(l.historico ?? [])].reverse();
  const doc = [l.pessoa?.documento ? `<span class="tabular-nums">${esc(l.pessoa.documento)}</span>` : '', chipNatureza(l.pessoa), chipSegmento(l.segmento)].filter(Boolean).join(' · ');

  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
      <div class="flex items-start gap-3 min-w-0">
        <span class="grid place-items-center h-10 w-10 rounded-full shrink-0 bg-slate-100 dark:bg-neutral-900">${iconeTipo(l.tipo, 'h-6 w-6')}</span>
        <div class="min-w-0">
          <h3 id="detalhe-titulo" class="font-display font-semibold text-slate-900 dark:text-neutral-100 leading-snug">${esc(l.descricao)}</h3>
          <p class="text-xs ${APOIO} mt-0.5">${l.tipo === 'receita' ? 'Receita' : 'Despesa'} · ${link ? `<a href="${link}" class="hover:underline hover:text-petrol-800 dark:hover:text-sky-300">${esc(origem)}</a>` : esc(origem)}</p>
          <div class="mt-1.5 text-sm">${pontoSituacao(l)}${L.situacao(l) === 'vencido' ? ` <span class="text-xs ${RUIM}">há ${plural(L.diasAtraso(l), 'dia', 'dias')}</span>` : ''}</div>
        </div>
      </div>
      <button type="button" data-fechar-modal class="p-1 rounded ${APOIO} hover:text-slate-700 dark:hover:text-neutral-200 shrink-0" aria-label="Fechar">${UI_ICONE.fechar}</button>
    </div>
    <div class="px-5 py-4 space-y-5 overflow-y-auto">
      <div class="grid sm:grid-cols-3 gap-3">
        <div><p class="text-xs ${APOIO}">Valor</p><p class="text-base font-semibold tabular-nums text-slate-800 dark:text-neutral-100">${moeda(l.valor)}</p></div>
        <div><p class="text-xs ${APOIO}">Desconto</p><p class="text-base font-semibold tabular-nums ${l.desconto ? 'text-slate-800 dark:text-neutral-100' : APOIO}">${l.desconto ? moeda(l.desconto) : '—'}</p></div>
        <div><p class="text-xs ${APOIO}">Valor final</p><p class="text-base font-semibold tabular-nums text-slate-800 dark:text-neutral-100">${moeda(L.valorFinal(l))}</p>${valorPagoDiff ? `<p class="text-xs ${AVISO}" title="Valor efetivamente pago">pago ${moeda(l.valorPago)}</p>` : ''}</div>
      </div>
      ${bloco('Pessoa', [
        item(l.tipo === 'receita' ? 'Cliente' : 'Favorecido', `${esc(l.pessoa?.nome ?? '—')}${doc ? `<span class="block text-xs ${APOIO}">${doc}</span>` : ''}`),
        item('Tipo de pessoa', esc(l.pessoa?.tipo ? L.nomeDe(L.TIPOS_PESSOA, l.pessoa.tipo) : '—')),
      ])}
      ${bloco('Datas e forma', [
        item('Vencimento', dataBr(l.vencimento), { num: true }),
        item('Competência', esc(mesRotulo(l.competencia))),
        item('Forma', esc(nomeForma(l.forma))),
        item('Pago em', l.pagoEm ? `${dataBr(l.pagoEm)}${l.contaBancariaId ? `<span class="block text-xs ${APOIO}">${esc(nomeConta(l.contaBancariaId))}</span>` : ''}` : '—', { num: true }),
      ])}
      ${bloco('Classificação', [
        item('Categoria', esc(nomeCat(l.categoriaId))),
        l.tipo === 'receita' ? item('Segmento', l.segmento === 'b2b' ? 'B2B — pessoa jurídica' : 'B2C — pessoa física') : item('Centro de custo', esc(nomeCentro(l.centroCustoId))),
        l.tipo === 'receita' && l.centroCustoId ? item('Centro de receita', esc(nomeCentro(l.centroCustoId))) : '',
        item('Conta bancária', esc(nomeConta(l.contaBancariaId))),
        l.turmaId ? item('Turma', `<a href="turma.html?id=${esc(l.turmaId)}" class="hover:underline hover:text-petrol-800 dark:hover:text-sky-300">${esc(turma?.nome ?? l.turmaId)}</a>`) : '',
      ])}
      ${bloco('Documentos', [
        item('Nota fiscal', l.nf ? `NF ${esc(l.nf.numero)}${l.nf.emitidaEm ? ` <span class="${APOIO}">· emitida em ${dataBr(l.nf.emitidaEm)}</span>` : ''}` : '—'),
        item('Cobrança Asaas', l.asaas ? `<button type="button" data-fatura="${esc(l.id)}" class="inline-flex items-center gap-1 ${LINK}">${ICONE_ASAAS} ${esc(l.asaas.id)}</button> <span class="${APOIO}">· ${esc(L.nomeDe(L.STATUS_ASAAS, l.asaas.status))}</span>` : '—'),
        item('Conciliação', l.conciliado ? `Conciliado em ${dataBr(l.conciliado.em)}` : '—'),
      ])}
      ${l.observacao ? bloco('Observação', [`<dd class="col-span-2 ${DD} whitespace-pre-line">${esc(l.observacao)}</dd>`]) : ''}
      <section>
        <h4 class="text-sm font-semibold text-slate-900 dark:text-neutral-100 mb-2">Histórico</h4>
        ${historico.length ? `<ol class="space-y-1.5 text-sm">${historico.map((h) => `<li class="flex gap-3"><span class="shrink-0 w-[8.5rem] text-xs ${APOIO} tabular-nums pt-0.5">${fmtDataHora(h.em)}</span><span class="text-slate-700 dark:text-neutral-200">${esc(h.texto)}</span></li>`).join('')}</ol>` : `<p class="text-sm ${APOIO}">Sem eventos registrados.</p>`}
        <p class="mt-2 text-xs ${APOIO}">Criado em ${fmtDataHora(l.criadoEm)}${l.atualizadoEm && l.atualizadoEm !== l.criadoEm ? ` · atualizado em ${fmtDataHora(l.atualizadoEm)}` : ''} · ${esc(l.id)}</p>
      </section>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Fechar</button>
      ${mais.length ? `<button type="button" id="dt-mais" class="${BOTAO_SEC}" aria-haspopup="menu" aria-expanded="false">Mais ${ICONE.abaixo}</button>` : ''}
      ${principal ? `<button type="button" id="dt-principal" class="${BOTAO_PRI}">${principal.nome}</button>` : ''}
    </div>`, 'max-w-2xl');
  root.querySelector('[role="dialog"]').setAttribute('aria-labelledby', 'detalhe-titulo');
  // Fecha o detalhe antes de abrir o que vem dele (outro modal, confirmação ou origem).
  const executar = (it) => () => { fecharModal(); it.acao(); };
  root.querySelector('#dt-principal')?.addEventListener('click', executar(principal));
  root.querySelector('#dt-mais')?.addEventListener('click', (e) => abrirMenu(e.currentTarget, mais.map((it) => (it === 'sep' || it.desabilitado ? it : { ...it, acao: executar(it) }))));
  root.querySelector('[data-fatura]')?.addEventListener('click', () => { fecharModal(); modalFatura(l.id); });
  (root.querySelector('#dt-principal') ?? root.querySelector('#dt-mais') ?? root.querySelector('[data-fechar-modal]'))?.focus();
}

// ---------- Modal: NF ----------

function modalNf(id) {
  const l = lanc(id);
  const corpo = `
    <p class="text-sm text-slate-600 dark:text-neutral-300">${esc(l.descricao)}${l.origem?.tipo === 'instrutor' ? ' — a NF do instrutor libera a baixa do pagamento.' : l.tipo === 'despesa' ? ' — com a NF do fornecedor o lançamento passa a "emitido".' : ' — NF de saída para o cliente.'}</p>
    <div class="grid sm:grid-cols-2 gap-3">
      ${campoHtml('Número da NF', `<input id="f-numero" name="numero" type="text" class="campo" value="${esc(l.nf?.numero ?? '')}">`, { name: 'numero' })}
      ${campoHtml('Emitida em', `<input id="f-emitidaEm" name="emitidaEm" type="date" class="campo tabular-nums" value="${esc(l.nf?.emitidaEm ?? '')}">`, { name: 'emitidaEm' })}
    </div>`;
  modalFormulario({
    id: 'form-nf', largura: 'md', titulo: l.nf ? 'Alterar NF' : 'Registrar NF', subtitulo: L.descricaoOrigem(l), corpo, rotulo: 'Salvar', foco: '#f-numero',
    aoSalvar: (fd) => {
      const erros = [];
      if (!String(fd.get('numero') ?? '').trim()) erros.push({ campo: 'numero', mensagem: 'Informe o número.' });
      if (!fd.get('emitidaEm')) erros.push({ campo: 'emitidaEm', mensagem: 'Informe a data de emissão.' });
      if (erros.length) return erros;
      alterar((ls) => L.registrarNf(ls, id, { numero: fd.get('numero'), emitidaEm: fd.get('emitidaEm') }));
      recarregar(); render(); toast(`NF ${String(fd.get('numero')).trim()} registrada.`);
    },
  });
}

// ---------- Confirmações (destrutivas / em massa) ----------

function modalConfirmacao({ titulo, corpo, rotulo, tom = 'vermelho', aoConfirmar, comMotivo = false, rotuloMotivo = 'Motivo' }) {
  const cor = tom === 'vermelho' ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400 dark:text-red-950' : 'bg-petrol-800 hover:bg-petrol-900 dark:bg-areia dark:hover:bg-white dark:text-petrol-800';
  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800"><h3 id="confirmacao-titulo" class="font-display font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h3></div>
    <div class="px-5 py-4 text-sm text-slate-700 dark:text-neutral-200 space-y-3">${corpo}${comMotivo ? `<div><label class="rotulo" for="motivo">${rotuloMotivo} ${OPCIONAL}</label><textarea id="motivo" rows="2" class="campo"></textarea></div>` : ''}</div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" id="btn-voltar" data-fechar-modal class="${BOTAO_CANCELAR}">Voltar</button>
      <button type="button" id="btn-confirmar" class="px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition ${cor}">${rotulo}</button>
    </div>`);
  root.querySelector('#btn-confirmar').addEventListener('click', () => { const motivo = root.querySelector('#motivo')?.value ?? ''; fecharModal(); aoConfirmar(motivo); });
  root.querySelector('[role="dialog"]').setAttribute('aria-labelledby', 'confirmacao-titulo');
  root.querySelector('#btn-voltar').focus(); // Enter por engano não confirma o irreversível
}

function confirmarCancelar(ids) {
  const ls = ids.map(lanc).filter((l) => l && L.podeCancelar(l));
  const fora = ids.length - ls.length;
  if (!ls.length) { toast('Nada a cancelar: parcelas de venda e pagamentos de instrutor são cancelados na origem; pagos não cancelam.'); return; }
  modalConfirmacao({
    titulo: ls.length === 1 ? 'Cancelar lançamento' : `Cancelar ${ls.length} lançamentos`, rotulo: ls.length === 1 ? 'Cancelar lançamento' : `Cancelar ${ls.length}`, comMotivo: true,
    corpo: `<p>${ls.length === 1 ? `<span class="font-medium">${esc(ls[0].descricao)}</span> (${moeda(L.valorFinal(ls[0]))}) fica como cancelado no histórico; a cobrança Asaas, se houver, é estornada.` : `Os lançamentos ficam como cancelados no histórico (total ${moeda(L.arred(ls.reduce((s, l) => s + L.valorFinal(l), 0)))}).`}</p>${fora ? `<p class="text-xs ${APOIO}">${fora} da seleção não podem ser cancelados aqui (pagos, ou de venda ou instrutor — cancele na origem).</p>` : ''}`,
    aoConfirmar: (motivo) => { alterar((lista) => ls.reduce((acc, l) => L.cancelar(acc, l.id, motivo), lista)); ls.forEach((l) => estado.contas[l.tipo].selecao.delete(l.id)); render(); toast(ls.length === 1 ? 'Lançamento cancelado.' : `${ls.length} lançamentos cancelados.`); },
  });
}
function confirmarExcluir(id) {
  const l = lanc(id);
  modalConfirmacao({
    titulo: 'Excluir lançamento', rotulo: 'Excluir',
    corpo: `<p><span class="font-medium">${esc(l.descricao)}</span> some do histórico. Só lançamentos manuais não pagos podem ser excluídos.</p>`,
    aoConfirmar: () => { alterar((ls) => L.remover(ls, id)); render(); toast('Lançamento excluído.'); },
  });
}

function acaoMassa(tipo, acao) {
  const c = estado.contas[tipo];
  const ids = [...c.selecao];
  if (acao === 'limpar') { c.selecao.clear(); render(); return; }
  if (acao === 'cancelar') { confirmarCancelar(ids); return; }
  if (acao === 'cobranca') { modalCobranca(ids); return; }
  if (acao === 'baixa') {
    const ls = ids.map(lanc).filter((l) => l && L.podeBaixar(l).ok);
    const fora = ids.length - ls.length;
    if (!ls.length) { toast('Nenhum lançamento da seleção pode receber baixa (já pagos, cancelados ou aguardando NF).'); return; }
    const total = L.arred(ls.reduce((s, l) => s + L.valorFinal(l), 0));
    const contas = new Set(ls.map((l) => l.contaBancariaId ?? ''));
    const nomes = ls.slice(0, 4).map((l) => esc(l.pessoa?.nome ?? l.descricao)).join(', ') + (ls.length > 4 ? ` e mais ${ls.length - 4}` : '');
    const corpo = `
      <p class="text-sm text-slate-700 dark:text-neutral-200">Baixa de <span class="font-medium">${ls.length} ${ls.length === 1 ? 'lançamento' : 'lançamentos'}</span>, total <span class="font-medium tabular-nums">${moeda(total)}</span>, cada um pelo seu valor final.${fora ? ` <span class="${APOIO}">${fora} da seleção ficam de fora (pagos, cancelados ou sem NF).</span>` : ''}</p>
      <p class="text-xs ${APOIO}">${nomes}</p>
      <div class="grid sm:grid-cols-2 gap-3">
        ${campoHtml('Data do pagamento', `<input id="f-pagoEm" name="pagoEm" type="date" class="campo tabular-nums" value="${L.hoje()}">`, { name: 'pagoEm' })}
        ${campoHtml('Conta', campoCombo('contaBancariaId', opcoesConta(), contas.size === 1 ? [...contas][0] : '', { id: 'f-contaBancariaId', vazio: 'Buscar conta…' }), { name: 'contaBancariaId' })}
      </div>`;
    const root = abrirModal(`
      <form id="form-baixa-massa" novalidate>
        <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800"><h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Dar baixa em ${plural(ls.length, 'lançamento')}</h3></div>
        <div class="px-5 py-4 space-y-4">${corpo}</div>
        <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
          <button type="button" data-fechar-modal class="${BOTAO_CANCELAR}">Voltar</button>
          <button type="submit" class="${BOTAO_PETROL}">Confirmar ${ls.length === 1 ? 'baixa' : `${ls.length} baixas`}</button>
        </div>
      </form>`);
    const form = root.querySelector('#form-baixa-massa');
    ativarCombos(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const erros = [];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fd.get('pagoEm') ?? '')) erros.push({ campo: 'pagoEm', mensagem: 'Informe a data.' });
      else if (fd.get('pagoEm') > L.hoje()) erros.push({ campo: 'pagoEm', mensagem: 'Data no futuro.' });
      if (!fd.get('contaBancariaId')) erros.push({ campo: 'contaBancariaId', mensagem: 'Escolha a conta.' });
      if (mostrarErros(form, erros)) return;
      const r = L.baixarEmMassa(estado.lista, ls.map((l) => l.id), { pagoEm: fd.get('pagoEm'), contaBancariaId: fd.get('contaBancariaId') });
      estado.lista = r.lista; persistir(); recarregar(); c.selecao.clear(); fecharModal(); render();
      toast(`${r.n} ${r.n === 1 ? 'baixa registrada' : 'baixas registradas'}${r.erros.length ? ` · ${r.erros.length} com erro` : ''}.`);
    });
    form.querySelector('#f-pagoEm').focus();
  }
}

// ============================================================
// Conciliação Asaas
// ============================================================

// Cartão de número (rótulo, valor em 24px, uma linha de apoio). Com `filtro`, é botão com aria-pressed, como em Vendas.
function cartaoNumero({ rotulo, valor, sub = '', cor = 'text-slate-900 dark:text-neutral-100', filtro = null }) {
  const corpo = `
      <p class="text-xs font-medium ${APOIO}">${rotulo}</p>
      <p class="font-display text-2xl font-semibold tabular-nums leading-none mt-1.5 ${cor}">${valor}</p>
      ${sub ? `<p class="text-xs ${APOIO} mt-1.5">${sub}</p>` : ''}`;
  if (!filtro) return `<div class="${CARTAO} p-4">${corpo}</div>`;
  return `<button type="button" ${filtro.atributo}="${filtro.valor}" aria-pressed="${filtro.ativo}" class="${CARTAO} p-4 text-left hover:border-petrol-800 dark:hover:border-sky-400 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-petrol-800/30 ${filtro.ativo ? 'border-petrol-800! dark:border-sky-400! ring-2 ring-petrol-800/30 dark:ring-sky-400/30' : ''}">${corpo}</button>`;
}

// Por que o movimento foi sugerido para este lançamento.
function motivoSugestao({ porId, dias }) {
  if (porId) return 'mesma cobrança Asaas';
  if (!dias) return 'mesmo valor e data';
  return `mesmo valor, ${plural(Math.abs(dias), 'dia')} ${dias > 0 ? 'depois' : 'antes'} da baixa`;
}

function dadosConciliacao() {
  const c = estado.conciliacao;
  return L.conciliacao(estado.lista, estado.movimentos, { contaId: c.contaId || null, de: L.somarDias(L.hoje(), -c.dias), ate: L.hoje() });
}

// Fila de exceções: abre no que precisa de você (sugestões e movimentos sem lançamento, mais os pagos que não
// caíram no extrato); conciliados, taxas e transferências ficam a um clique, nos cartões que filtram.
const FILTROS_CONCILIACAO = {
  pendentes: (it) => it.situacao === 'sugestao' || it.situacao === 'sem_lancamento',
  conciliado: (it) => it.situacao === 'conciliado',
  outros: (it) => it.situacao === 'taxa' || it.situacao === 'transferencia',
  todos: () => true,
};
const ORDEM_CONCILIACAO = { sem_lancamento: 0, sugestao: 1, conciliado: 2, transferencia: 3, taxa: 4 };

function htmlConciliacao() {
  const c = estado.conciliacao;
  const contas = estado.plano.contasBancarias.filter((x) => x.status === 'ativo');
  const r = dadosConciliacao();
  const res = r.resumo;
  const pendentes = res.comSugestao + res.semLancamento + res.semMovimento;
  const itens = r.itens.filter(FILTROS_CONCILIACAO[c.filtro] ?? FILTROS_CONCILIACAO.todos);
  if (c.filtro === 'pendentes') itens.sort((a, b) => ORDEM_CONCILIACAO[a.situacao] - ORDEM_CONCILIACAO[b.situacao] || a.movimento.data.localeCompare(b.movimento.data));
  const situacao = (s) => { const [cor, nome] = PONTO_CONCILIACAO[s] ?? ['bg-slate-300', s]; return `<span class="inline-flex items-center gap-1.5 whitespace-nowrap text-slate-700 dark:text-neutral-300"><span class="h-2 w-2 rounded-full shrink-0 ${cor}" aria-hidden="true"></span>${nome}</span>`; };
  const linha = (it) => {
    const m = it.movimento; const l = it.lancamento;
    const divergente = l && Math.abs(L.valorFinal(l) - m.valor) > 0.01;
    let col = `<span class="${APOIO}">—</span>`;
    if (it.situacao === 'sugestao') col = `<span class="block truncate">${esc(l.descricao)}</span><span class="block text-xs ${APOIO} truncate">${esc(l.pessoa?.nome ?? '')} · ${motivoSugestao(it.motivo)} · <span class="tabular-nums ${divergente ? `${AVISO} font-medium` : ''}">${moeda(L.valorFinal(l))}</span>${divergente ? ` (diferença ${moeda(L.arred(m.valor - L.valorFinal(l)))})` : ''}</span>`;
    else if (it.situacao === 'conciliado') col = `<span class="block truncate">${esc(l.descricao)}</span><span class="block text-xs ${APOIO} truncate">${esc(l.pessoa?.nome ?? '')} · ${l.conciliado?.automatico ? 'conciliado sozinho pelo id da cobrança' : `conciliado em ${dataBr(l.conciliado?.em)}`}</span>`;
    else if (it.situacao === 'sem_lancamento') col = `<span class="${APOIO}">Nenhum lançamento pago com esse valor e data.</span>`;
    else if (it.situacao === 'taxa') col = `<span class="${APOIO}">Taxa por cobrança, consolidada no lançamento mensal 740.</span>`;
    else if (it.situacao === 'transferencia') col = `<span class="${APOIO}">${m.referencia === 'saque' ? `Saque ${origemDoSaque(m)} para o banco; não gera lançamento.` : 'Transferência entre contas; não gera lançamento.'}</span>`;
    const acao = it.situacao === 'sugestao' ? `<button type="button" data-conciliar="${esc(l.id)}:${esc(m.id)}" class="${BOTAO_FANTASMA} px-2">Conciliar</button>`
      : it.situacao === 'conciliado' ? `<button type="button" data-desconciliar="${esc(l.id)}" class="${BOTAO_FANTASMA} px-2">Desfazer</button>`
        : it.situacao === 'sem_lancamento' ? `<button type="button" data-criar="${esc(m.id)}" class="${BOTAO_FANTASMA} px-2">Criar lançamento</button>` : '';
    return `
      <tr class="${LINHA}">
        <td class="${TD} tabular-nums whitespace-nowrap">${dataBr(m.data)}</td>
        <td class="${TD} min-w-0"><span class="block truncate" title="${esc(m.descricao)}">${esc(m.descricao)}</span>${referenciaVisivel(m) !== '—' ? `<span class="block text-xs ${APOIO} tabular-nums truncate">${esc(referenciaVisivel(m))}</span>` : ''}</td>
        <td class="${TDN} font-medium text-slate-800 dark:text-neutral-100">${valorComSinal(m.tipo, m.valor)}</td>
        <td class="${TD} min-w-0">${situacao(it.situacao)}<span class="block pl-3.5 text-sm">${col}</span></td>
        <td class="pl-2 pr-3 py-2 text-right whitespace-nowrap align-top">${acao}</td>
      </tr>`;
  };
  const vazio = { pendentes: 'Nada a conciliar no período: todo movimento tem lançamento ou é taxa ou transferência.', conciliado: 'Nenhum movimento conciliado no período.', outros: 'Nenhuma taxa ou transferência no período.', todos: 'Nenhum movimento no período.' }[c.filtro];
  const cartao = (filtro, rotulo, valor, sub, cor) => cartaoNumero({ rotulo, valor, sub, cor, filtro: { atributo: 'data-filtro-conc', valor: filtro, ativo: c.filtro === filtro } });
  return `
    <div class="mb-4 flex flex-wrap items-center gap-2">
      ${selectHtml('cc-conta', contas, c.contaId, { vazio: 'Todas as contas', classe: SELECT_FILTRO, title: 'Conta do extrato' }).replace('<select', '<select aria-label="Conta"')}
      ${selectHtml('cc-dias', [{ id: 30, nome: 'Últimos 30 dias' }, { id: 60, nome: 'Últimos 60 dias' }, { id: 90, nome: 'Últimos 90 dias' }], c.dias, { vazio: 'Período', classe: SELECT_FILTRO, title: 'Período' }).replace('<select', '<select aria-label="Período"')}
      <span class="text-xs ${APOIO_FUNDO} tabular-nums">${dataBr(L.somarDias(L.hoje(), -c.dias))} a ${dataBr(L.hoje())}</span>
      ${res.comSugestao ? `<div class="ml-auto"><button type="button" id="cc-todas" class="${BOTAO_PRI}">Conciliar ${plural(res.comSugestao, 'sugestão', 'sugestões')}</button></div>` : ''}
    </div>
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
      ${cartao('pendentes', 'Precisa de você', pendentes, pendentes ? [res.comSugestao && `${plural(res.comSugestao, 'sugestão', 'sugestões')} para confirmar`, res.semLancamento && `${res.semLancamento} sem lançamento`, res.semMovimento && `${res.semMovimento} pagos sem movimento`].filter(Boolean).join(' · ') : 'nada a conciliar', pendentes ? AVISO : undefined)}
      ${cartao('conciliado', 'Conciliados', res.conciliados, res.automaticos ? `${res.automaticos} sozinhos, pelo id da cobrança Asaas` : 'movimento ligado ao lançamento')}
      ${cartao('outros', 'Taxas e transferências', res.taxas + res.transferencias, `${plural(res.taxas, 'taxa')} · ${plural(res.transferencias, 'transferência', 'transferências')}; não geram lançamento`)}
      ${cartao('todos', 'Todos os movimentos', res.movimentos, 'do extrato no período')}
    </div>
    ${(c.filtro === 'pendentes' || c.filtro === 'todos') && r.semMovimento.length ? `
    <section class="${CARTAO} overflow-clip mb-4">
      <div class="p-4 pb-3">
        <h3 class="text-[15px] leading-[22px] font-semibold text-slate-900 dark:text-neutral-100">Pagos sem movimento no extrato</h3>
        <p class="text-xs ${APOIO} mt-0.5">Baixa registrada na conta, mas o extrato não tem o crédito ou débito. Confira se o pagamento caiu em outra conta ou se a baixa foi indevida; abra o lançamento para estornar.</p>
      </div>
      <table class="w-full table-fixed text-left">
        <colgroup><col class="w-[7rem]"><col><col class="w-[22%]"><col class="w-[18%]"><col class="w-[9.5rem]"></colgroup>
        <thead class="${THEAD}"><tr><th scope="col" class="${TH} font-medium">Pago em</th><th scope="col" class="${TH} font-medium">Lançamento</th><th scope="col" class="${TH} font-medium">Pessoa</th><th scope="col" class="${TH} font-medium">Conta</th><th scope="col" class="${TH} font-medium text-right">Valor</th></tr></thead>
        <tbody class="${CORPO_TABELA}">${r.semMovimento.map((l) => `<tr class="${LINHA} ${FOCO_LINHA} cursor-pointer" data-id="${esc(l.id)}"><td class="${TD} tabular-nums whitespace-nowrap">${dataBr(l.pagoEm)}</td><td class="${TD} min-w-0"><button type="button" data-detalhe="${esc(l.id)}" class="link-registro block max-w-full truncate text-left font-medium text-slate-800 dark:text-neutral-100 hover:underline underline-offset-2 focus-visible:outline-none">${esc(l.descricao)}</button><span class="block text-xs ${APOIO} truncate">${esc(L.descricaoOrigem(l))}</span></td><td class="${TD} truncate">${esc(l.pessoa?.nome ?? '—')}</td><td class="${TD} truncate">${esc(nomeConta(l.contaBancariaId))}</td><td class="${TDN} font-medium text-slate-800 dark:text-neutral-100">${valorComSinal(l.tipo, l.valorPago ?? L.valorFinal(l))}</td></tr>`).join('')}</tbody>
      </table>
    </section>` : ''}
    ${c.filtro !== 'pendentes' || itens.length || !r.semMovimento.length ? `
    <div class="${CARTAO} overflow-clip">
      ${(c.filtro === 'pendentes' || c.filtro === 'todos') && r.semMovimento.length ? `<div class="p-4 pb-3"><h3 class="text-[15px] leading-[22px] font-semibold text-slate-900 dark:text-neutral-100">Movimentos do extrato</h3></div>` : ''}
      <table class="w-full table-fixed text-left" data-lista="conciliacao">
        <colgroup><col class="w-[6.5rem]"><col><col class="w-[8rem]"><col class="w-[34%]"><col class="w-[9.5rem]"></colgroup>
        <thead class="${THEAD}"><tr>
          <th scope="col" class="${TH} font-medium">Data</th><th scope="col" class="${TH} font-medium">Movimento</th><th scope="col" class="${TH} font-medium text-right">Valor</th><th scope="col" class="${TH} font-medium">Situação e lançamento</th><th scope="col" class="${TH}"><span class="sr-only">Ações</span></th>
        </tr></thead>
        <tbody class="${CORPO_TABELA}">${itens.length ? fatia('conciliacao', itens, JSON.stringify([c])).map(linha).join('') : `<tr><td colspan="5" class="px-4 py-10 text-center text-sm ${APOIO}">${vazio}</td></tr>`}</tbody>
      </table>
    </div>
    ${botaoMais('conciliacao', itens.length)}` : ''}`;
}

function ligarConciliacao(el) {
  const c = estado.conciliacao;
  el.querySelector('#cc-conta')?.addEventListener('change', (e) => { c.contaId = e.target.value; render(); });
  el.querySelector('#cc-dias')?.addEventListener('change', (e) => { c.dias = Number(e.target.value) || 90; render(); });
  el.querySelectorAll('[data-filtro-conc]').forEach((b) => b.addEventListener('click', () => { c.filtro = b.dataset.filtroConc; render(); }));
  el.querySelectorAll('[data-conciliar]').forEach((b) => b.addEventListener('click', () => {
    const [lancId, movId] = b.dataset.conciliar.split(':');
    alterar((ls) => L.conciliar(ls, lancId, movId)); render(); toast('Conciliado.');
  }));
  el.querySelectorAll('[data-desconciliar]').forEach((b) => b.addEventListener('click', () => { alterar((ls) => L.desconciliar(ls, b.dataset.desconciliar)); render(); toast('Conciliação desfeita.'); }));
  el.querySelectorAll('[data-criar]').forEach((b) => b.addEventListener('click', () => modalCriarDoMovimento(b.dataset.criar)));
  el.querySelectorAll('[data-detalhe]').forEach((b) => b.addEventListener('click', () => modalDetalhes(b.dataset.detalhe)));
  el.querySelectorAll('tbody tr[data-id]').forEach((tr) => tr.addEventListener('click', (e) => { if (e.target.closest('button, a')) return; modalDetalhes(tr.dataset.id); }));
  el.querySelector('#cc-todas')?.addEventListener('click', () => {
    const n = dadosConciliacao().resumo.comSugestao;
    modalConfirmacao({
      titulo: `Conciliar ${plural(n, 'sugestão', 'sugestões')}`, tom: 'petrol', rotulo: `Conciliar ${n}`,
      corpo: `<p>${n} ${n === 1 ? 'movimento será ligado' : 'movimentos serão ligados'} ao lançamento sugerido: mesmo valor, com até 3 dias entre a baixa e o movimento. Confira antes os que têm o nome de outra pessoa; dá para desfazer um a um no cartão Conciliados.</p>`,
      aoConfirmar: () => { const r = L.conciliarSugestoes(estado.lista, estado.movimentos, { contaId: c.contaId || null, de: L.somarDias(L.hoje(), -c.dias), ate: L.hoje() }); estado.lista = r.lista; persistir(); render(); toast(`${r.n} ${r.n === 1 ? 'movimento conciliado' : 'movimentos conciliados'}.`); },
    });
  });
}

function modalCriarDoMovimento(movId) {
  const m = estado.movimentos.find((x) => x.id === movId);
  if (!m) return;
  const tipo = m.tipo === 'credito' ? 'receita' : 'despesa';
  const categorias = L.categoriasDoTipo(estado.plano, tipo).map((x) => ({ id: x.id, nome: `${x.codigo} ${x.nome}` }));
  const centros = L.centrosDoTipo(estado.plano, 'custo').map((x) => ({ id: x.id, nome: `${x.codigo} ${x.nome}` }));
  const catSug = L.categoriaDe(estado.plano, m.categoriaSugerida)?.id ?? '';
  const nomeSugerido = m.descricao.replace(/^.*?[–-]\s*/, '').replace(/\s*\(.*\)\s*$/, '').trim() || m.descricao;
  const corpo = `
    <div class="rounded-lg bg-slate-50 dark:bg-neutral-900 px-3 py-2 text-sm">
      <p class="font-medium text-slate-800 dark:text-neutral-100">${esc(m.descricao)}</p>
      <p class="text-xs text-slate-500 dark:text-neutral-400">${dataBr(m.data)} · ${m.tipo === 'credito' ? 'crédito' : 'débito'} de <span class="tabular-nums font-medium">${moeda(m.valor)}</span> em ${esc(nomeConta(m.contaId))} — o lançamento nasce pago nessa data e já conciliado.</p>
    </div>
    ${campoHtml('Descrição', `<input id="f-descricao" name="descricao" type="text" class="campo" value="${esc(m.descricao)}">`, { name: 'descricao' })}
    <div class="grid sm:grid-cols-[11rem_1fr] gap-3">
      ${campoHtml('Tipo de pessoa', selectHtml('f-pessoaTipo', tiposPessoaDo(tipo), '', { name: 'pessoaTipo' }), { name: 'pessoaTipo' })}
      ${campoHtml('Nome', `<input id="f-pessoaNome" name="pessoaNome" type="text" class="campo" value="${esc(nomeSugerido)}">`, { name: 'pessoa', ajuda: 'Como veio no extrato; sem vínculo com cadastro.' })}
    </div>
    <div class="grid sm:grid-cols-2 gap-3">
      ${campoHtml('Categoria', selectHtml('f-categoriaId', categorias, catSug, { name: 'categoriaId' }), { name: 'categoriaId' })}
      ${tipo === 'receita' ? '' : campoHtml('Centro de custo', selectHtml('f-centroCustoId', centros, '', { name: 'centroCustoId' }), { name: 'centroCustoId' })}
    </div>
    <div class="grid sm:grid-cols-2 gap-3">
      ${campoHtml('Forma', selectHtml('f-forma', L.FORMAS, '', { name: 'forma' }), { name: 'forma' })}
    </div>`;
  modalFormulario({
    id: 'form-criar-mov', titulo: `Criar ${tipo} a partir do extrato`, subtitulo: `Movimento ${m.id}`, corpo, rotulo: 'Criar e conciliar', foco: '#f-descricao',
    aoSalvar: (fd) => {
      const erros = [];
      if (!String(fd.get('descricao') ?? '').trim()) erros.push({ campo: 'descricao', mensagem: 'Informe a descrição.' });
      if (!fd.get('pessoaTipo')) erros.push({ campo: 'pessoaTipo', mensagem: 'Escolha o tipo.' });
      if (!String(fd.get('pessoaNome') ?? '').trim()) erros.push({ campo: 'pessoa', mensagem: 'Informe o nome.' });
      if (!fd.get('categoriaId')) erros.push({ campo: 'categoriaId', mensagem: 'Escolha a categoria.' });
      if (tipo === 'despesa' && !fd.get('centroCustoId')) erros.push({ campo: 'centroCustoId', mensagem: 'Escolha o centro de custo.' });
      if (!fd.get('forma')) erros.push({ campo: 'forma', mensagem: 'Escolha a forma.' });
      if (erros.length) return erros;
      const r = L.criarDoMovimento(estado.lista, m, { descricao: String(fd.get('descricao')).trim(), categoriaId: fd.get('categoriaId'), centroCustoId: tipo === 'despesa' ? fd.get('centroCustoId') : null, forma: fd.get('forma'), pessoa: { tipo: fd.get('pessoaTipo'), id: null, nome: String(fd.get('pessoaNome')).trim(), documento: '' } });
      estado.lista = r.lista; persistir(); render(); toast(`${L.nomeDe(L.TIPOS, tipo)} criada e conciliada.`);
    },
  });
}

// ============================================================
// Aba Saque automático (?aba=saques, 09/09/2026 — era um cartão no topo da Conciliação): saque diário da Asaas
// para o banco, equivalente à "Transferência automática" do Asaas.
// Motor: L.carregarSaques/salvarSaques/validarSaques/saldoAsaas/processarSaques/sacarAgora/previsaoSaque/ultimoSaque.
// Tudo protegido por `typeof`: se o motor ainda não tiver as funções, o cartão simplesmente não aparece.
// ============================================================

const saquesDisponiveis = () => !!estado.saques?.config && typeof L.saldoAsaas === 'function';
// Referência do movimento na tabela: transferência, taxa e saque não têm id de cobrança para mostrar.
const referenciaVisivel = (m) => (m.referencia && !['transf', 'taxa', 'saque'].includes(m.referencia) ? m.referencia : '—');
const origemDoSaque = (m) => ((estado.saques.saques ?? []).find((s) => s.id === m.saqueId)?.origem === 'manual' ? 'manual' : 'automático');
const rotuloOrigemSaque = (s) => (s.origem === 'manual' ? 'Manual' : 'Automático');
const saqueAgoraIso = () => new Date().toISOString();
// "Hoje" / "Amanhã" / "ter., 9 de set." — usado no tile do próximo saque.
const dataRelativa = (iso) => {
  if (!iso) return '—';
  if (iso === L.hoje()) return 'Hoje';
  if (iso === L.somarDias(L.hoje(), 1)) return 'Amanhã';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
};

// Carrega { config, saques } e executa os saques automáticos dos dias que passaram desde a última visita.
function carregarSaques() {
  estado.saques = typeof L.carregarSaques === 'function' ? (L.carregarSaques() ?? { config: null, saques: [] }) : { config: null, saques: [] };
  if (!estado.saques.config || typeof L.processarSaques !== 'function') return;
  const r = L.processarSaques(estado.saques, estado.movimentos, estado.plano);
  if (!r?.dados || r.dados === estado.saques) return; // nada pendente (o motor devolve o mesmo objeto)
  // Grava sempre que houve processamento (dias pulados e ultimaExecucaoEm também contam); extrato só com saques concluídos.
  estado.saques = r.dados;
  L.salvarSaques(estado.saques);
  const novos = r.novos?.length ?? 0;
  if (!novos) return;
  estado.movimentos = r.movimentos;
  L.salvarExtrato(estado.movimentos);
  toast(novos === 1 ? '1 saque automático executado desde a última visita.' : `${novos} saques automáticos executados desde a última visita.`);
}
function salvarSaques() { L.salvarSaques(estado.saques); }

function resumoConfigSaques(cfg) {
  const partes = [`${cfg.diasUteis ? 'Todo dia útil' : 'Todo dia'} às ${esc(cfg.horario || '—')}`, `vai para ${esc(nomeConta(cfg.contaDestinoId))}`, `mantém ${moeda(cfg.saldoMinimo ?? 0)} na Asaas`];
  if (cfg.valorMinimo > 0) partes.push(`só quando o valor for ≥ ${moeda(cfg.valorMinimo)}`);
  return partes.join(' · ');
}

function htmlSaques() {
  if (!saquesDisponiveis()) return `<div class="${CARTAO} p-10 text-center text-sm ${APOIO}">Saque automático indisponível neste protótipo (motor não carregado).</div>`;
  const cfg = estado.saques.config;
  const saldo = L.saldoAsaas(estado.movimentos, estado.plano);
  const disponivel = Math.max(0, L.arred(saldo - (cfg.saldoMinimo ?? 0)));
  const previsao = typeof L.previsaoSaque === 'function' ? L.previsaoSaque(estado.saques, estado.movimentos, estado.plano) : null;
  const ultimo = typeof L.ultimoSaque === 'function' ? L.ultimoSaque(estado.saques) : null;
  const proximo = !previsao || !previsao.data
    ? cartaoNumero({ rotulo: 'Próximo saque', valor: '—', sub: esc(previsao?.motivo ?? 'Saque automático pausado') })
    : cartaoNumero({ rotulo: 'Próximo saque', valor: previsao.valor > 0 ? moeda(previsao.valor) : 'Nenhum', sub: `${esc(dataRelativa(previsao.data))} às ${esc(cfg.horario || '—')}${previsao.valor > 0 ? '' : ` · ${esc(previsao.motivo ?? 'nada a sacar')}`}` });
  const ultimoCartao = ultimo
    ? cartaoNumero({ rotulo: 'Último saque', valor: moeda(ultimo.valor), sub: `${dataBr(ultimo.data)} às ${esc(ultimo.horario ?? '—')} · ${rotuloOrigemSaque(ultimo).toLowerCase()} · ${esc(nomeConta(ultimo.contaDestinoId))}` })
    : cartaoNumero({ rotulo: 'Último saque', valor: '—', sub: 'nenhum ainda' });
  // Ativo é o comum e não se anuncia; pausado vira faixa neutra com o caminho de volta.
  return `
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-[15px] leading-[22px] font-semibold text-slate-900 dark:text-neutral-100">Saque automático para o banco</h3>
        <p class="text-sm ${APOIO_FUNDO} mt-0.5">${resumoConfigSaques(cfg)}</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button type="button" id="sq-configurar" class="${BOTAO_SEC}">Configurar</button>
        <button type="button" id="sq-mais" class="${BOTAO_SEC}" aria-haspopup="menu" aria-expanded="false">Mais ${ICONE.abaixo}</button>
      </div>
    </div>
    ${cfg.ativo ? '' : `
    <div class="mb-4 flex items-start gap-3 rounded-lg px-4 py-3 text-sm bg-slate-200/70 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300">
      <span class="shrink-0">${ICONE.info}</span>
      <p class="min-w-0 flex-1"><span class="font-medium">Saque automático pausado.</span> Nada sai da Asaas até retomar; o saldo acumula na conta.</p>
      <button type="button" id="sq-retomar" class="${BOTAO_LINK} text-sm shrink-0">Retomar</button>
    </div>`}
    <div class="grid grid-cols-3 gap-3 mb-4">
      ${cartaoNumero({ rotulo: 'Saldo na Asaas agora', valor: saldo < 0 ? `− ${moeda(-saldo)}` : moeda(saldo), cor: saldo < 0 ? RUIM : undefined, sub: `mantém ${moeda(cfg.saldoMinimo ?? 0)} · ${moeda(disponivel)} disponível para saque` })}
      ${proximo}
      ${ultimoCartao}
    </div>
    ${htmlHistoricoSaques()}`;
}

// Histórico completo (concluídos e pulados), do mais recente para o mais antigo.
function htmlHistoricoSaques() {
  const lista = [...(estado.saques.saques ?? [])].sort((a, b) => (b.data + (b.horario ?? '')).localeCompare(a.data + (a.horario ?? '')) || String(b.criadoEm ?? '').localeCompare(String(a.criadoEm ?? '')));
  const situacao = (s) => (s.status === 'pulado'
    ? `<span class="inline-flex items-center gap-1.5 whitespace-nowrap text-slate-700 dark:text-neutral-300"><span class="h-2 w-2 rounded-full border border-slate-400 dark:border-neutral-500" aria-hidden="true"></span>Pulado</span>${s.motivo ? `<span class="block text-xs ${APOIO} pl-3.5">${esc(s.motivo)}</span>` : ''}`
    : '<span class="inline-flex items-center gap-1.5 whitespace-nowrap text-slate-700 dark:text-neutral-300"><span class="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true"></span>Concluído</span>');
  return `
    <section class="${CARTAO} overflow-clip">
      <div class="p-4 pb-3">
        <h3 class="text-[15px] leading-[22px] font-semibold text-slate-900 dark:text-neutral-100">Histórico de saques</h3>
        <p class="text-xs ${APOIO} mt-0.5">${plural(lista.length, 'registro')}; cada saque concluído entra no extrato como transferência.</p>
      </div>
      <table class="w-full text-left">
        <thead class="${THEAD}"><tr>
          <th scope="col" class="${TH} font-medium">Data</th><th scope="col" class="${TH} font-medium">Origem</th><th scope="col" class="${TH} font-medium">Situação</th><th scope="col" class="${TH} font-medium text-right">Saldo antes</th><th scope="col" class="${TH} font-medium text-right">Valor</th><th scope="col" class="${TH} font-medium text-right">Saldo depois</th><th scope="col" class="${TH} font-medium">Destino</th>
        </tr></thead>
        <tbody class="${CORPO_TABELA}">${lista.length ? lista.map((s) => `
          <tr class="${LINHA}">
            <td class="${TD} tabular-nums whitespace-nowrap">${dataBr(s.data)}<span class="block text-xs ${APOIO}">${esc(s.horario ?? '—')}</span></td>
            <td class="${TD}">${rotuloOrigemSaque(s)}</td>
            <td class="${TD}">${situacao(s)}</td>
            <td class="${TDN}">${moeda(s.saldoAntes)}</td>
            <td class="${TDN}">${s.status === 'pulado' ? `<span class="${APOIO}">—</span>` : `<span class="font-medium text-slate-800 dark:text-neutral-100">${moeda(s.valor)}</span>`}</td>
            <td class="${TDN}">${moeda(s.saldoDepois)}</td>
            <td class="${TD} whitespace-nowrap">${esc(nomeConta(s.contaDestinoId))}</td>
          </tr>`).join('') : `<tr><td colspan="7" class="px-4 py-10 text-center text-sm ${APOIO}">Nenhum saque registrado.</td></tr>`}</tbody>
      </table>
    </section>`;
}

function ligarSaques(el) {
  if (!saquesDisponiveis()) return;
  const cfg = estado.saques.config;
  const saldo = L.saldoAsaas(estado.movimentos, estado.plano);
  el.querySelector('#sq-configurar')?.addEventListener('click', modalConfigurarSaques);
  el.querySelector('#sq-retomar')?.addEventListener('click', alternarSaques);
  el.querySelector('#sq-mais')?.addEventListener('click', (e) => abrirMenu(e.currentTarget, [
    { nome: 'Sacar agora', detalhe: saldo > 0 ? 'Transfere fora do horário automático' : 'A Asaas está sem saldo', desabilitado: saldo <= 0, acao: modalSacarAgora },
    { nome: cfg.ativo ? 'Pausar saque automático' : 'Retomar saque automático', detalhe: cfg.ativo ? 'Nada sai da Asaas até retomar' : `Volta a sacar ${cfg.diasUteis ? 'todo dia útil' : 'todo dia'} às ${cfg.horario || '—'}`, acao: alternarSaques },
  ]));
}

// Pausar/Retomar: alterna config.ativo sem modal.
function alternarSaques() {
  const cfg = estado.saques.config;
  const ativo = !cfg.ativo;
  estado.saques = { ...estado.saques, config: { ...cfg, ativo, atualizadoEm: saqueAgoraIso() } };
  salvarSaques(); render();
  toast(ativo ? 'Saque automático retomado.' : 'Saque automático pausado — nada sai da Asaas até retomar.');
}

// Contas que podem receber o saque: ativas, menos a própria Asaas (gateway).
function opcoesContaDestino() {
  const asaasId = L.contaAsaas(estado.plano)?.id;
  return opcoesConta().filter((c) => c.id !== asaasId);
}
const linhaCheck = (name, rotulo, descricao, marcado) => `
  <label class="flex items-center justify-between gap-3 cursor-pointer">
    <span><span class="text-sm font-medium text-slate-800 dark:text-neutral-100">${rotulo}</span><br><span class="text-xs text-slate-500 dark:text-neutral-400">${descricao}</span></span>
    <input type="checkbox" name="${name}" id="f-${name}" class="check" ${marcado ? 'checked' : ''}>
  </label>`;
// Inputs type="number" chegam com ponto decimal; L.numero() espera formato pt-BR, então aqui é parseFloat.
const numeroForm = (v) => (v === '' || v == null ? null : Number.parseFloat(String(v).replace(',', '.')));

function modalConfigurarSaques() {
  const cfg = estado.saques.config;
  const corpo = `
    ${campoHtml('Conta de destino', campoCombo('contaDestinoId', opcoesContaDestino(), cfg.contaDestinoId ?? '', { id: 'f-contaDestinoId', vazio: 'Buscar conta…' }), { name: 'contaDestinoId', ajuda: 'Conta bancária que recebe o dinheiro; a própria Asaas fica de fora.' })}
    <div class="grid sm:grid-cols-3 gap-3">
      ${campoHtml('Horário', `<input id="f-horario" name="horario" type="time" class="campo tabular-nums" value="${esc(cfg.horario ?? '')}">`, { name: 'horario', ajuda: 'Hora do saque no dia.' })}
      ${campoHtml('Manter na Asaas (R$)', `<input id="f-saldoMinimo" name="saldoMinimo" type="number" min="0" step="0.01" class="campo tabular-nums" value="${cfg.saldoMinimo ?? 0}" placeholder="0,00">`, { name: 'saldoMinimo', ajuda: 'Saldo que sempre fica na conta.' })}
      ${campoHtml('Valor mínimo do saque (R$)', `<input id="f-valorMinimo" name="valorMinimo" type="number" min="0" step="0.01" class="campo tabular-nums" value="${cfg.valorMinimo ?? 0}" placeholder="0,00">`, { name: 'valorMinimo', ajuda: 'Abaixo disso o dia é pulado.' })}
    </div>
    <div class="space-y-3">
      ${linhaCheck('diasUteis', 'Só em dias úteis', 'Pula fins de semana e feriados; o saldo acumula para o próximo dia útil.', !!cfg.diasUteis)}
      ${linhaCheck('ativo', 'Ativo', 'Desmarcado = pausado: nada sai da Asaas até retomar.', !!cfg.ativo)}
    </div>`;
  modalFormulario({
    id: 'form-saques', titulo: 'Configurar saque automático', subtitulo: 'Todo dia, no horário, o que passar do saldo mínimo vai da Asaas para a conta de destino.', corpo, rotulo: 'Salvar', foco: '#f-horario',
    aoSalvar: (fd) => {
      const novo = {
        ...cfg,
        contaDestinoId: fd.get('contaDestinoId') || '',
        horario: fd.get('horario') || '',
        saldoMinimo: numeroForm(fd.get('saldoMinimo')) ?? 0,
        valorMinimo: numeroForm(fd.get('valorMinimo')) ?? 0,
        diasUteis: fd.has('diasUteis'),
        ativo: fd.has('ativo'),
      };
      const erros = typeof L.validarSaques === 'function' ? L.validarSaques(novo, estado.plano) : [];
      if (erros.length) return erros;
      novo.atualizadoEm = saqueAgoraIso();
      estado.saques = { ...estado.saques, config: novo };
      salvarSaques(); render(); toast('Saque automático atualizado.');
    },
  });
}

// Saque manual, fora do horário: sai da Asaas na hora (irreversível na vida real — tom petróleo, texto claro).
function modalSacarAgora() {
  const cfg = estado.saques.config;
  const saldo = L.arred(L.saldoAsaas(estado.movimentos, estado.plano));
  if (saldo <= 0) { toast('A conta Asaas está sem saldo para sacar.'); return; }
  const sugerido = Math.max(0, L.arred(saldo - (cfg.saldoMinimo ?? 0)));
  const corpo = `
    <div class="rounded-lg bg-slate-50 dark:bg-neutral-900 px-3 py-2 text-sm">
      <p class="font-medium text-slate-800 dark:text-neutral-100">Saldo na Asaas agora: <span class="tabular-nums">${moeda(saldo)}</span></p>
      <p class="text-xs ${APOIO}">${sugerido > 0 ? `A configuração mantém ${moeda(cfg.saldoMinimo ?? 0)} na conta; por isso o valor sugerido é <span class="tabular-nums font-medium">${moeda(sugerido)}</span>.` : `O saldo não passa dos ${moeda(cfg.saldoMinimo ?? 0)} que a configuração mantém na conta.`} Dá para sacar até o saldo inteiro.</p>
    </div>
    <div class="${FAIXA_INFO}">O saque sai da Asaas na hora e entra no extrato como transferência; não dá para desfazer daqui — na vida real é uma transferência bancária.</div>
    <div class="grid sm:grid-cols-2 gap-3">
      ${campoHtml('Valor (R$)', `<input id="f-valor" name="valor" type="number" min="0.01" max="${saldo}" step="0.01" class="campo tabular-nums" value="${sugerido > 0 ? sugerido.toFixed(2) : ''}" placeholder="0,00">`, { name: 'valor' })}
      ${campoHtml('Destino', campoCombo('contaDestinoId', opcoesContaDestino(), cfg.contaDestinoId ?? '', { id: 'f-contaDestinoId', vazio: 'Buscar conta…' }), { name: 'contaDestinoId' })}
    </div>`;
  const { form } = modalFormulario({
    id: 'form-sacar', titulo: 'Sacar agora', subtitulo: 'Transferência manual da Asaas para o banco, fora do horário automático.', corpo, rotulo: sugerido > 0 ? `Sacar ${moeda(sugerido)}` : 'Sacar', foco: '#f-valor',
    aoSalvar: (fd) => {
      const valor = numeroForm(fd.get('valor'));
      const contaDestinoId = fd.get('contaDestinoId');
      const erros = [];
      if (valor == null || Number.isNaN(valor) || valor <= 0) erros.push({ campo: 'valor', mensagem: 'Informe o valor.' });
      else if (valor > saldo + 0.005) erros.push({ campo: 'valor', mensagem: `Maior que o saldo da Asaas (${moeda(saldo)}).` });
      if (!contaDestinoId) erros.push({ campo: 'contaDestinoId', mensagem: 'Escolha a conta de destino.' });
      if (erros.length) return erros;
      const r = L.sacarAgora(estado.saques, estado.movimentos, estado.plano, { valor: L.arred(valor), contaDestinoId });
      if (r.erro) { toast(r.erro); return [{ campo: 'valor', mensagem: r.erro }]; }
      estado.saques = r.dados; estado.movimentos = r.movimentos;
      salvarSaques(); L.salvarExtrato(estado.movimentos); render();
      toast(`Saque de ${moeda(r.saque.valor)} enviado para ${nomeConta(r.saque.contaDestinoId)}.`);
    },
  });
  // A transferência não se desfaz: só o botão envia, Enter num campo não.
  form.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.preventDefault(); });
  // O rótulo do botão acompanha o valor digitado.
  const botao = form.querySelector('button[type="submit"]');
  form.querySelector('#f-valor')?.addEventListener('input', (e) => { const v = numeroForm(e.target.value); botao.textContent = `Sacar ${v > 0 ? moeda(v) : ''}`.trim(); });
}

// ============================================================
// Extrato
// ============================================================

function dadosExtrato() {
  const e = estado.extrato;
  return L.extrato(e.contaId, { de: e.de || null, ate: e.ate || null }, estado.movimentos, estado.plano);
}

function htmlExtrato() {
  const e = estado.extrato;
  const contas = estado.plano.contasBancarias.filter((x) => x.status === 'ativo');
  const x = dadosExtrato();
  const sinal = (v) => (v < 0 ? `− ${moeda(-v)}` : moeda(v));
  const nCred = x.conta ? x.movimentos.filter((m) => m.tipo === 'credito').length : 0;
  const nDeb = x.conta ? x.movimentos.length - nCred : 0;
  const inicioEm = x.conta ? (x.de === '0000-01-01' ? x.conta.saldoInicialEm : x.de) : '';
  return `
    <div class="mb-4 flex flex-wrap items-center gap-2">
      ${selectHtml('ex-conta', contas, e.contaId, { vazio: 'Selecione a conta', classe: SELECT_FILTRO, title: 'Conta' }).replace('<select', '<select aria-label="Conta"')}
      <input id="ex-de" type="date" value="${esc(e.de)}" class="${CAMPO_DATA}" aria-label="Data inicial"><span class="${APOIO_FUNDO} text-sm">a</span><input id="ex-ate" type="date" value="${esc(e.ate)}" class="${CAMPO_DATA}" aria-label="Data final">
      <div class="ml-auto"><button type="button" id="ex-csv" class="${BOTAO_SEC}" ${x.movimentos.length ? '' : 'disabled'}>Exportar CSV</button></div>
    </div>
    ${x.conta ? `
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
      ${cartaoNumero({ rotulo: 'Saldo inicial', valor: sinal(x.saldoInicial), cor: x.saldoInicial < 0 ? RUIM : undefined, sub: `em ${dataBr(inicioEm)}` })}
      ${cartaoNumero({ rotulo: 'Créditos', valor: moeda(x.creditos), sub: plural(nCred, 'movimento') })}
      ${cartaoNumero({ rotulo: 'Débitos', valor: moeda(x.debitos), sub: plural(nDeb, 'movimento') })}
      ${cartaoNumero({ rotulo: 'Saldo final', valor: sinal(x.saldoFinal), cor: x.saldoFinal < 0 ? RUIM : undefined, sub: `em ${dataBr(x.ate === '9999-12-31' ? L.hoje() : x.ate)}` })}
    </div>
    <div class="${CARTAO} overflow-clip">
      <table class="w-full table-fixed text-left" data-lista="extrato">
        <colgroup><col class="w-[7rem]"><col><col class="w-[11rem]"><col class="w-[9rem]"><col class="w-[9rem]"><col class="w-[9.5rem]"></colgroup>
        <thead class="${THEAD}"><tr><th scope="col" class="${TH} font-medium">Data</th><th scope="col" class="${TH} font-medium">Descrição</th><th scope="col" class="${TH} font-medium">Referência</th><th scope="col" class="${TH} font-medium text-right">Crédito</th><th scope="col" class="${TH} font-medium text-right">Débito</th><th scope="col" class="${TH} font-medium text-right">Saldo</th></tr></thead>
        <tbody class="${CORPO_TABELA}">
          <tr class="bg-slate-50/70 dark:bg-neutral-900/50"><td class="${TD} tabular-nums whitespace-nowrap">${dataBr(inicioEm)}</td><td class="${TD} ${APOIO}" colspan="4">Saldo inicial</td><td class="${TDN} font-medium text-slate-800 dark:text-neutral-100">${sinal(x.saldoInicial)}</td></tr>
          ${fatia('extrato', x.movimentos, JSON.stringify([e])).map((m) => `<tr class="${LINHA}"><td class="${TD} tabular-nums whitespace-nowrap">${dataBr(m.data)}</td><td class="${TD} truncate" title="${esc(m.descricao)}">${esc(m.descricao)}</td><td class="${TD} text-xs ${APOIO} tabular-nums truncate">${esc(referenciaVisivel(m))}</td><td class="${TDN}">${m.tipo === 'credito' ? `+ ${moeda(m.valor)}` : ''}</td><td class="${TDN}">${m.tipo === 'debito' ? `− ${moeda(m.valor)}` : ''}</td><td class="${TDN} ${m.saldo < 0 ? RUIM : ''}">${sinal(m.saldo)}</td></tr>`).join('')}
          ${x.movimentos.length ? '' : `<tr><td colspan="6" class="px-4 py-8 text-center text-sm ${APOIO}">Nenhum movimento no período.</td></tr>`}
          <tr class="border-t border-slate-200 dark:border-neutral-800 font-semibold text-slate-800 dark:text-neutral-100"><td class="${TD} text-slate-800 dark:text-neutral-100" colspan="3">Totais do período</td><td class="${TDN} text-slate-800 dark:text-neutral-100">+ ${moeda(x.creditos)}</td><td class="${TDN} text-slate-800 dark:text-neutral-100">− ${moeda(x.debitos)}</td><td class="${TDN} ${x.saldoFinal < 0 ? RUIM : 'text-slate-800 dark:text-neutral-100'}">${sinal(x.saldoFinal)}</td></tr>
        </tbody>
      </table>
    </div>
    ${botaoMais('extrato', x.movimentos.length)}` : `<p class="text-sm ${APOIO_FUNDO} py-10 text-center">Escolha uma conta para ver o extrato.</p>`}`;
}

function ligarExtrato(el) {
  const e = estado.extrato;
  el.querySelector('#ex-conta')?.addEventListener('change', (ev) => { e.contaId = ev.target.value; render(); });
  el.querySelector('#ex-de')?.addEventListener('change', (ev) => { e.de = ev.target.value; render(); });
  el.querySelector('#ex-ate')?.addEventListener('change', (ev) => { e.ate = ev.target.value; render(); });
  el.querySelector('#ex-csv')?.addEventListener('click', () => {
    const x = dadosExtrato();
    const num = (v) => String(v).replace('.', ',');
    const linhas = [[dataBr(x.de === '0000-01-01' ? x.conta.saldoInicialEm : x.de), 'Saldo inicial', '', '', '', num(x.saldoInicial)], ...x.movimentos.map((m) => [dataBr(m.data), m.descricao, m.referencia ?? '', m.tipo === 'credito' ? num(m.valor) : '', m.tipo === 'debito' ? num(m.valor) : '', num(m.saldo)])];
    baixarArquivo(`extrato-${L.normalizar(x.conta.nome).replace(/[^a-z0-9]+/g, '-')}-${x.de.slice(0, 10)}-a-${x.ate.slice(0, 10)}.csv`, csvLinhas(['Data', 'Descrição', 'Referência', 'Crédito', 'Débito', 'Saldo'], linhas));
    toast('CSV gerado.');
  });
}

// ============================================================
// Início
// ============================================================

function iniciar() {
  carregarTudo();
  const aba = parametroUrl('aba');
  if (aba === 'visao') { location.replace('financeiro.html'); return; } // aba antiga → tela operacional
  if (aba === 'contas') estado.aba = ABA_PADRAO;
  else if (ehParteContas(aba) || ABAS.some(([id]) => id === aba)) estado.aba = aba;
  // ?situacao=vencido|aberto|… (links "Ver vencidos" dos indicadores): abre a aba já filtrada, sem período.
  // Vale também para ?aba=ambas — TIPO_DA_ABA aponta para o pseudo-tipo 'ambas', que indexa estado.contas normalmente.
  const situacao = parametroUrl('situacao');
  const vencimento = parametroUrl('vencimento');
  const tipo = TIPO_DA_ABA[estado.aba];
  if (vencimento === 'hoje' && tipo) estado.contas[tipo].filtros = { ...filtrosPadrao(), de: L.hoje(), ate: L.hoje(), situacao: 'aberto' };
  else if (vencimento === '7-dias' && tipo) estado.contas[tipo].filtros = { ...filtrosPadrao(), de: L.hoje(), ate: L.somarDias(L.hoje(), 7), situacao: 'aberto' };
  else if (situacao && tipo && (situacao === 'aberto' || L.SITUACOES.some((x) => x.id === situacao))) estado.contas[tipo].filtros = { ...filtrosPadrao(), de: '', ate: '', situacao };
  // ?natureza=pf|pj soma-se ao que vencimento/situacao já configuraram (ex.: ?vencimento=hoje&natureza=pj).
  const natureza = parametroUrl('natureza');
  if (tipo && L.NATUREZAS_PESSOA.some((n) => n.id === natureza)) estado.contas[tipo].filtros.natureza = natureza;
  // ?busca=<texto>: abre a aba com a busca preenchida, sem período nem situação.
  const busca = parametroUrl('busca');
  if (tipo && busca) estado.contas[tipo].filtros = { ...estado.contas[tipo].filtros, de: '', ate: '', situacao: '', busca };
  // ?conta=cb-bb (ficha da conta bancária, 19/10/2026): Extrato e Conciliação abrem nessa conta.
  const conta = parametroUrl('conta');
  if (conta && L.contaDe(estado.plano, conta)?.status === 'ativo') { estado.extrato.contaId = conta; estado.conciliacao.contaId = conta; }
  // ?categoria=cat-701 (contagem de Categorias/Produtos, 19/10/2026): Receber ou Pagar pelo tipo da categoria, em qualquer data e situação.
  const categoria = L.categoriaDe(estado.plano, parametroUrl('categoria'));
  if (categoria) { estado.aba = categoria.tipo === 'receita' ? 'receber' : 'pagar'; estado.contas[categoria.tipo].filtros = { ...filtrosPadrao(), de: '', ate: '', situacao: '', categoriaId: categoria.id }; }
  // ?centro=cc-200 | cr-b2b (valores da tela Centros de custo): soma-se a situacao, como natureza; o centro é do tipo da aba.
  const centro = L.centroDe(estado.plano, parametroUrl('centro'));
  if (tipo && centro && (tipo === 'receita') === (L.tipoCentro(centro) === 'receita')) estado.contas[tipo].filtros.centroCustoId = centro.id;
  // ?de=&ate=&periodo=pagoEm: o período exato do número que trouxe a pessoa (o pago em 12 meses de Centros de custo).
  const de = parametroUrl('de'); const ate = parametroUrl('ate'); const periodo = parametroUrl('periodo');
  const ehData = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d ?? '');
  if (tipo && ehData(de) && ehData(ate) && de <= ate) Object.assign(estado.contas[tipo].filtros, { de, ate, campoPeriodo: CAMPOS_PERIODO.some((o) => o.id === periodo) ? periodo : 'vencimento' });
  atualizarUrl();
  render();
}

if (typeof document !== 'undefined' && document.getElementById('tela')) iniciar();
