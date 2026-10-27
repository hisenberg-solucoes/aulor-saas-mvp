// Saque automático da conta Asaas (Lancamentos.processarSaques & cia.).
// Carrega só o mínimo: feriados (para dia útil) + dados e motor de lançamentos; plano e movimentos
// são construídos aqui, sem passar por carregar(). Rode: node --test tests/saques-asaas.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function contexto() {
  const store = {};
  const ctx = vm.createContext({
    localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
  });
  ['js/feriados-data.js', 'js/feriados-motor.js', 'js/centros-receita.js', 'js/lancamentos-data.js', 'js/lancamentos-motor.js']
    .forEach((f) => vm.runInContext(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), ctx, { filename: f }));
  // JSON de ida e volta: objetos do vm têm protótipos de outro realm e quebram deepEqual.
  const run = (expr) => JSON.parse(JSON.stringify(vm.runInContext(expr, ctx)) ?? 'null');
  return { ctx, store, run };
}

// Semana de referência: 31/08/2026 (seg) a 08/09/2026 (ter). Na semente de feriados 02/09 (Aniversário
// de Blumenau) e 07/09 (Independência) são feriados; 05 e 06/09 são fim de semana.
const PLANO = {
  categorias: [], centrosCusto: [], fornecedores: [],
  contasBancarias: [
    { id: 'cb-asaas', nome: 'Asaas — conta digital', banco: 'Asaas', tipo: 'gateway', agencia: '0001', conta: '4402913-7', saldoInicial: 12000, saldoInicialEm: '2026-08-01', padraoRecebimento: true, padraoPagamento: false, status: 'ativo' },
    { id: 'cb-bb', nome: 'Banco do Brasil — c/c', banco: 'Banco do Brasil', tipo: 'corrente', agencia: '1234-5', conta: '58.213-0', saldoInicial: 100000, saldoInicialEm: '2026-08-01', padraoRecebimento: false, padraoPagamento: true, status: 'ativo' },
    { id: 'cb-caixa', nome: 'Caixa interno', banco: 'Caixa', tipo: 'caixa', agencia: '', conta: '', saldoInicial: 0, saldoInicialEm: '2026-08-01', padraoRecebimento: false, padraoPagamento: false, status: 'ativo' },
  ],
};
const MOVS = [
  { id: 'm1', contaId: 'cb-asaas', data: '2026-08-31', tipo: 'credito', valor: 3000, descricao: 'Boleto – A', referencia: null, categoriaSugerida: null },
  { id: 'm2', contaId: 'cb-asaas', data: '2026-09-01', tipo: 'credito', valor: 50, descricao: 'Pix – B', referencia: null, categoriaSugerida: null },
  { id: 'm3', contaId: 'cb-asaas', data: '2026-09-03', tipo: 'credito', valor: 2000, descricao: 'Boleto – C', referencia: null, categoriaSugerida: null },
  { id: 'm4', contaId: 'cb-asaas', data: '2026-09-04', tipo: 'debito', valor: 300, descricao: 'Taxa mensal', referencia: null, categoriaSugerida: null },
  { id: 'm5', contaId: 'cb-asaas', data: '2026-09-08', tipo: 'credito', valor: 400, descricao: 'Pix – D', referencia: null, categoriaSugerida: null },
];
const CONFIG = { ativo: true, diasUteis: true, horario: '17:00', contaDestinoId: 'cb-bb', saldoMinimo: 5000, valorMinimo: 100, criadoEm: '2026-08-31T09:00:00', atualizadoEm: '2026-08-31T09:00:00', ultimaExecucaoEm: null };
const DADOS = { config: CONFIG, saques: [] };
const j = (x) => JSON.stringify(x);
// `agora` local: 08/09/2026 às 18:00 (já passou das 17:00).
const AGORA = 'new Date(2026, 8, 8, 18, 0, 0)';
const ANTES_DO_HORARIO = 'new Date(2026, 8, 8, 16, 59, 0)';

test('processar: só dias úteis, respeita o horário, mantém o saldo mínimo e pula com motivo', () => {
  const { run } = contexto();
  const r = run(`Lancamentos.processarSaques(${j(DADOS)}, ${j(MOVS)}, ${j(PLANO)}, ${AGORA})`);
  assert.deepEqual(r.dados.saques.map((s) => s.data), ['2026-08-31', '2026-09-01', '2026-09-03', '2026-09-04', '2026-09-08'], 'sem sáb/dom nem feriados (02/09 e 07/09)');
  assert.deepEqual(r.dados.saques.map((s) => s.status), ['concluido', 'pulado', 'concluido', 'pulado', 'concluido']);
  const [s1, s2, s3, s4, s5] = r.dados.saques;
  assert.equal(s1.valor, 10000); assert.equal(s1.saldoAntes, 15000); assert.equal(s1.saldoDepois, 5000);
  assert.match(s2.motivo, /Valor de R\$\s50,00 abaixo do mínimo de R\$\s100,00/);
  assert.equal(s3.valor, 2050, 'saldo do dia inclui o saque anterior'); assert.equal(s3.saldoDepois, 5000);
  assert.match(s4.motivo, /Saldo de R\$\s4\.700,00 abaixo do mínimo de R\$\s5\.000,00/);
  assert.equal(s5.valor, 100, 'valor igual ao mínimo ainda saca'); assert.equal(s5.saldoDepois, 5000);
  assert.equal(s1.id, 'saq-20260831-1');
  assert.equal(s1.origem, 'automatico'); assert.equal(s1.horario, '17:00'); assert.equal(s1.contaOrigemId, 'cb-asaas'); assert.equal(s1.contaDestinoId, 'cb-bb');
  assert.equal(r.novos.length, 3);
  assert.equal(r.dados.config.ultimaExecucaoEm, '2026-09-08');
  // Dois movimentos por saque concluído.
  const gerados = r.movimentos.filter((m) => m.referencia === 'saque');
  assert.equal(gerados.length, 6);
  const deb = gerados.find((m) => m.id === 'mov-saq-20260831-1-d'); const cred = gerados.find((m) => m.id === 'mov-saq-20260831-1-c');
  assert.deepEqual([deb.contaId, deb.tipo, deb.valor, deb.categoriaSugerida, deb.saqueId], ['cb-asaas', 'debito', 10000, 'transferencia', 'saq-20260831-1']);
  assert.equal(deb.descricao, 'Saque automático → Banco do Brasil ag. 1234-5 c/c 58.213-0');
  assert.deepEqual([cred.contaId, cred.tipo, cred.valor, cred.categoriaSugerida], ['cb-bb', 'credito', 10000, 'transferencia']);
  assert.equal(cred.descricao, 'TED recebida — Asaas Gestão Financeira (saque automático)');
  assert.equal(r.movimentos.length, MOVS.length + 6, 'movimentos originais preservados');
  // Antes das 17:00 o dia de hoje ainda não entra.
  const r2 = run(`Lancamentos.processarSaques(${j(DADOS)}, ${j(MOVS)}, ${j(PLANO)}, ${ANTES_DO_HORARIO})`);
  assert.equal(r2.dados.saques.length, 4);
  assert.equal(r2.dados.config.ultimaExecucaoEm, '2026-09-07');
});

test('processar é idempotente, não muta as entradas e não faz nada com a config pausada', () => {
  const { run } = contexto();
  const r = run(`(() => {
    const dados = ${j(DADOS)}; const movs = ${j(MOVS)};
    const a = Lancamentos.processarSaques(dados, movs, ${j(PLANO)}, ${AGORA});
    const b = Lancamentos.processarSaques(a.dados, a.movimentos, ${j(PLANO)}, ${AGORA});
    return { entradaIntacta: dados.saques.length === 0 && dados.config.ultimaExecucaoEm === null && movs.length === ${MOVS.length}, a, b };
  })()`);
  assert.ok(r.entradaIntacta);
  assert.equal(r.b.novos.length, 0);
  assert.equal(r.b.dados.saques.length, r.a.dados.saques.length);
  assert.equal(r.b.movimentos.length, r.a.movimentos.length);
  // Continua de onde parou: no dia seguinte (quarta 09/09) gera só o dia novo.
  const c = run(`Lancamentos.processarSaques(${j(r.a.dados)}, ${j(r.a.movimentos)}, ${j(PLANO)}, new Date(2026, 8, 9, 17, 0, 0))`);
  assert.equal(c.dados.saques.length, r.a.dados.saques.length + 1);
  assert.equal(c.dados.saques.at(-1).data, '2026-09-09');
  const pausada = run(`Lancamentos.processarSaques(${j({ ...DADOS, config: { ...CONFIG, ativo: false } })}, ${j(MOVS)}, ${j(PLANO)}, ${AGORA})`);
  assert.equal(pausada.dados.saques.length, 0); assert.equal(pausada.novos.length, 0); assert.equal(pausada.movimentos.length, MOVS.length);
  // diasUteis false: sábado, domingo e feriado também sacam.
  const todos = run(`Lancamentos.processarSaques(${j({ ...DADOS, config: { ...CONFIG, diasUteis: false } })}, ${j(MOVS)}, ${j(PLANO)}, ${AGORA})`);
  assert.equal(todos.dados.saques.length, 9);
});

test('movimentos do saque são transferência na conciliação e entram no balanço do destino', () => {
  const { run } = contexto();
  const r = run(`(() => {
    const a = Lancamentos.processarSaques(${j(DADOS)}, ${j(MOVS)}, ${j(PLANO)}, ${AGORA});
    const conc = Lancamentos.conciliacao([], a.movimentos, { contaId: 'cb-asaas', de: '2026-08-01', ate: '2026-09-30' });
    const bal = Lancamentos.balanco([], ${j(PLANO)}, a.movimentos, '2026-09-08');
    return { conc, bal, saldoAsaas: Lancamentos.saldoAsaas(a.movimentos, ${j(PLANO)}, '2026-09-08') };
  })()`);
  const saques = r.conc.itens.filter((i) => i.movimento.referencia === 'saque');
  assert.equal(saques.length, 3);
  assert.ok(saques.every((i) => i.situacao === 'transferencia'));
  assert.equal(r.conc.resumo.transferencias, 3);
  const bb = r.bal.saldoContas.find((x) => x.conta.id === 'cb-bb');
  assert.equal(bb.transferencias, 12150);
  assert.equal(bb.saldo, 112150);
  const asaas = r.bal.saldoContas.find((x) => x.conta.id === 'cb-asaas');
  assert.equal(asaas.transferencias, -12150);
  assert.equal(r.saldoAsaas, 5000);
});

test('sacarAgora: recusa valor acima do saldo e destino inválido; concluído não mexe em ultimaExecucaoEm', () => {
  const { run } = contexto();
  const base = `Lancamentos.processarSaques(${j(DADOS)}, ${j(MOVS)}, ${j(PLANO)}, ${AGORA})`;
  const acima = run(`(() => { const a = ${base}; return Lancamentos.sacarAgora(a.dados, a.movimentos, ${j(PLANO)}, { valor: 5000.01, data: '2026-09-08', agora: ${AGORA} }); })()`);
  assert.match(acima.erro, /acima do saldo/);
  assert.match(run(`Lancamentos.sacarAgora(${j(DADOS)}, ${j(MOVS)}, ${j(PLANO)}, { valor: 0, data: '2026-09-08' })`).erro, /maior que zero/);
  assert.match(run(`Lancamentos.sacarAgora(${j(DADOS)}, ${j(MOVS)}, ${j(PLANO)}, { valor: 10, contaDestinoId: 'cb-asaas', data: '2026-09-08' })`).erro, /diferente da conta Asaas/);
  assert.match(run(`Lancamentos.sacarAgora(${j(DADOS)}, ${j(MOVS)}, ${j(PLANO)}, { valor: 10, contaDestinoId: 'nao-existe', data: '2026-09-08' })`).erro, /destino/);
  const ok = run(`(() => { const a = ${base}; return Lancamentos.sacarAgora(a.dados, a.movimentos, ${j(PLANO)}, { valor: '1.500,00', data: '2026-09-08', agora: new Date(2026, 8, 8, 18, 30, 0) }); })()`);
  assert.equal(ok.erro, undefined);
  assert.equal(ok.saque.valor, 1500); assert.equal(ok.saque.origem, 'manual'); assert.equal(ok.saque.status, 'concluido');
  assert.equal(ok.saque.id, 'saq-20260908-2', 'segundo saque do dia'); assert.equal(ok.saque.horario, '18:30');
  assert.equal(ok.saque.saldoAntes, 5000); assert.equal(ok.saque.saldoDepois, 3500);
  assert.equal(ok.dados.config.ultimaExecucaoEm, '2026-09-08');
  const d = ok.movimentos.find((m) => m.id === 'mov-saq-20260908-2-d');
  assert.equal(d.descricao, 'Saque manual → Banco do Brasil ag. 1234-5 c/c 58.213-0');
  assert.equal(ok.movimentos.filter((m) => m.saqueId === 'saq-20260908-2').length, 2);
  assert.equal(run(`Lancamentos.ultimoSaque(${j(ok.dados)})`).id, 'saq-20260908-2');
  assert.equal(run('Lancamentos.ultimoSaque({ saques: [] })'), null);
});

test('previsaoSaque: pausada, hoje antes do horário, próximo dia útil depois do horário', () => {
  const { run } = contexto();
  const pausada = run(`Lancamentos.previsaoSaque(${j({ ...DADOS, config: { ...CONFIG, ativo: false } })}, ${j(MOVS)}, ${j(PLANO)}, ${AGORA})`);
  assert.equal(pausada.data, null); assert.equal(pausada.valor, 0); assert.equal(pausada.motivo, 'Saque automático pausado');
  // Sem saques processados, o saldo em 08/09 é 12000 + 3000 + 50 + 2000 − 300 + 400 = 17150.
  const antes = run(`Lancamentos.previsaoSaque(${j(DADOS)}, ${j(MOVS)}, ${j(PLANO)}, ${ANTES_DO_HORARIO})`);
  assert.equal(antes.data, '2026-09-08'); assert.equal(antes.valor, 12150); assert.equal(antes.saldoAtual, 17150); assert.equal(antes.saldoMinimo, 5000); assert.equal(antes.motivo, null);
  const depois = run(`Lancamentos.previsaoSaque(${j(DADOS)}, ${j(MOVS)}, ${j(PLANO)}, ${AGORA})`);
  assert.equal(depois.data, '2026-09-09');
  // Sexta 04/09 às 18:00 → próximo dia de saque é terça 08/09 (pula fim de semana e o feriado de 07/09).
  const sexta = run(`Lancamentos.previsaoSaque(${j(DADOS)}, ${j(MOVS)}, ${j(PLANO)}, new Date(2026, 8, 4, 18, 0, 0))`);
  assert.equal(sexta.data, '2026-09-08');
  // Depois de processar, o saldo fica no mínimo e a previsão explica.
  const semValor = run(`(() => { const a = Lancamentos.processarSaques(${j(DADOS)}, ${j(MOVS)}, ${j(PLANO)}, ${AGORA}); return Lancamentos.previsaoSaque(a.dados, a.movimentos, ${j(PLANO)}, ${AGORA}); })()`);
  assert.equal(semValor.valor, 0); assert.match(semValor.motivo, /Valor de R\$\s0,00 abaixo do mínimo/);
});

test('validarSaques, ehDiaDeSaque e semente de carregarSaques', () => {
  const { run, store } = contexto();
  assert.deepEqual(run(`Lancamentos.validarSaques(${j(CONFIG)}, ${j(PLANO)})`), []);
  const erros = run(`Lancamentos.validarSaques(${j({ ...CONFIG, contaDestinoId: 'cb-asaas', horario: '25:00', saldoMinimo: -1, valorMinimo: 0 })}, ${j(PLANO)})`);
  assert.deepEqual(erros.map((e) => e.campo), ['contaDestinoId', 'horario', 'saldoMinimo', 'valorMinimo']);
  assert.equal(run(`Lancamentos.validarSaques(${j({ ...CONFIG, contaDestinoId: null })}, ${j(PLANO)})`)[0].campo, 'contaDestinoId');
  assert.equal(run(`Lancamentos.ehDiaDeSaque(${j(CONFIG)}, '2026-09-07')`), false, 'feriado');
  assert.equal(run(`Lancamentos.ehDiaDeSaque(${j(CONFIG)}, '2026-09-05')`), false, 'sábado');
  assert.equal(run(`Lancamentos.ehDiaDeSaque(${j(CONFIG)}, '2026-09-08')`), true);
  assert.equal(run(`Lancamentos.ehDiaDeSaque(${j({ ...CONFIG, diasUteis: false })}, '2026-09-07')`), true);
  assert.equal(run(`Lancamentos.ehDiaDeSaque(${j({ ...CONFIG, ativo: false })}, '2026-09-08')`), false);
  // Semente: config do Asaas real, destino = conta de pagamento (cb-bb), criadoEm = hoje − 14 dias às 09:00; grava na chave.
  const s = run('Lancamentos.carregarSaques()');
  assert.equal(s.config.contaDestinoId, 'cb-bb');
  assert.deepEqual([s.config.ativo, s.config.diasUteis, s.config.horario, s.config.saldoMinimo, s.config.valorMinimo, s.config.ultimaExecucaoEm], [true, true, '17:00', 5000, 100, null]);
  assert.equal(s.config.criadoEm, `${run('Lancamentos.somarDias(Lancamentos.hoje(), -14)')}T09:00:00`);
  assert.deepEqual(s.saques, []);
  assert.ok(store[run('Lancamentos.CHAVE_SAQUES')]);
  assert.equal(run('Lancamentos.CHAVE_SAQUES'), 'aulor-v1-financeiro-saques-v1');
  run(`Lancamentos.salvarSaques(${j({ config: { ...CONFIG, ultimaExecucaoEm: '2026-09-01' }, saques: [{ id: 'x' }] })})`);
  assert.equal(run('Lancamentos.carregarSaques()').config.ultimaExecucaoEm, '2026-09-01');
  assert.equal(run('Lancamentos.carregarSaques()').saques.length, 1);
});

test('extrato que começa antes da abertura da conta bate com o saldo da Asaas', () => {
  const { run } = contexto();
  const anterior = { id: 'm0', contaId: 'cb-asaas', data: '2026-07-25', tipo: 'credito', valor: 999, descricao: 'Antes da abertura', referencia: null, categoriaSugerida: null };
  const r = run(`(() => {
    const movs = ${j([anterior, ...MOVS])};
    return { x: Lancamentos.extrato('cb-asaas', { de: '2026-07-21', ate: '2026-09-08' }, movs, ${j(PLANO)}), saldo: Lancamentos.saldoAsaas(movs, ${j(PLANO)}, '2026-09-08') };
  })()`);
  assert.equal(r.x.de, '2026-08-01');
  assert.equal(r.x.saldoInicial, 12000);
  assert.ok(r.x.movimentos.every((m) => m.id !== 'm0'));
  assert.equal(r.x.saldoFinal, r.saldo);
});

test('conciliarPeloId liga o crédito à cobrança Asaas e não religa o que foi desfeito', () => {
  const { run } = contexto();
  const pago = { id: 'l1', tipo: 'receita', status: 'pago', pagoEm: '2026-09-01', valor: 50, desconto: 0, contaBancariaId: 'cb-asaas', asaas: { id: 'pay_1' }, conciliado: null, historico: [] };
  const mov = { id: 'mx', contaId: 'cb-asaas', data: '2026-09-02', tipo: 'credito', valor: 50, descricao: 'Pix', referencia: 'pay_1', categoriaSugerida: null };
  const r = run(`(() => {
    const a = Lancamentos.conciliarPeloId(${j([pago])}, ${j([mov])});
    const desfeito = Lancamentos.desconciliar(a.lista, 'l1');
    const b = Lancamentos.conciliarPeloId(desfeito, ${j([mov])});
    const c = Lancamentos.conciliacao(b.lista, ${j([mov])}, { de: '2026-08-01', ate: '2026-09-30' });
    return { n: a.n, auto: a.lista[0].conciliado, nDepois: b.n, sugestao: c.itens[0].situacao, motivo: c.itens[0].motivo };
  })()`);
  assert.equal(r.n, 1);
  assert.equal(r.auto.movimentoId, 'mx');
  assert.equal(r.auto.automatico, true);
  assert.equal(r.nDepois, 0);
  assert.equal(r.sugestao, 'sugestao');
  assert.deepEqual(r.motivo, { porId: true, dias: 1 });
});

test('sugestão por valor prefere o lançamento com o nome no movimento', () => {
  const { run } = contexto();
  const base = { tipo: 'receita', status: 'pago', valor: 1096.66, desconto: 0, contaBancariaId: 'cb-asaas', asaas: null, conciliado: null, historico: [] };
  const lista = [{ ...base, id: 'pedro', pagoEm: '2026-07-31', pessoa: { nome: 'Pedro Henrique Souza' } }, { ...base, id: 'samuel', pagoEm: '2026-08-02', pessoa: { nome: 'Samuel Fontana' } }];
  const movs = [
    { id: 'mp', contaId: 'cb-asaas', data: '2026-07-31', tipo: 'credito', valor: 1096.66, descricao: 'Boleto – Pedro Henrique Souza', referencia: null, categoriaSugerida: null },
    { id: 'ms', contaId: 'cb-asaas', data: '2026-08-02', tipo: 'credito', valor: 1096.66, descricao: 'Boleto – Samuel Fontana', referencia: null, categoriaSugerida: null },
  ];
  const r = run(`Lancamentos.conciliacao(${j(lista)}, ${j(movs)}, { de: '2026-07-01', ate: '2026-08-31' }).itens.map((i) => [i.movimento.id, i.lancamento?.id])`);
  assert.deepEqual(Object.fromEntries(r), { mp: 'pedro', ms: 'samuel' });
});

// Semente do extrato da conta de pagamento (BB): um movimento por lançamento pago nela, para o extrato fechar com o balanço.
const PAGOS_BB = [
  { id: 'd1', tipo: 'despesa', status: 'pago', pagoEm: '2026-09-10', valor: 640, desconto: 0, forma: 'boleto', contaBancariaId: 'cb-bb', categoriaId: 'cat-703', pessoa: { nome: 'Unifique Telecom' }, conciliado: null, historico: [] },
  { id: 'd2', tipo: 'despesa', status: 'pago', pagoEm: '2026-09-10', valor: 640, desconto: 0, forma: 'pix', contaBancariaId: 'cb-bb', categoriaId: 'cat-330', pessoa: { nome: 'Buffet Sabor' }, conciliado: null, historico: [] },
  { id: 'r1', tipo: 'receita', status: 'pago', pagoEm: '2026-09-12', valor: 500, desconto: 20, forma: 'pix', contaBancariaId: 'cb-bb', categoriaId: null, pessoa: null, conciliado: null, historico: [] },
  { id: 'prev', tipo: 'despesa', status: 'previsto', pagoEm: null, valor: 99, desconto: 0, forma: 'boleto', contaBancariaId: 'cb-bb', conciliado: null, historico: [] },
  { id: 'antigo', tipo: 'despesa', status: 'pago', pagoEm: '2026-07-01', valor: 77, desconto: 0, forma: 'boleto', contaBancariaId: 'cb-bb', conciliado: null, historico: [] },
  { id: 'asaas', tipo: 'despesa', status: 'pago', pagoEm: '2026-09-10', valor: 55, desconto: 0, forma: 'debito_automatico', contaBancariaId: 'cb-asaas', conciliado: null, historico: [] },
];

test('semente da conta de pagamento: extrato fecha com o balanço e a conciliação acha cada pagamento', () => {
  const { run } = contexto();
  const r = run(`(() => {
    const movs = gerarExtratoPagamentosSeed(${j(PAGOS_BB)}, ${j(PLANO)}, '2026-10-19');
    const conc = Lancamentos.conciliacao(${j(PAGOS_BB)}, movs, { contaId: 'cb-bb', de: '2026-07-21', ate: '2026-10-19' });
    return {
      movs: movs.map((m) => [m.id, m.contaId, m.data, m.tipo, m.valor, m.descricao]),
      extrato: Lancamentos.extrato('cb-bb', { ate: '2026-10-19' }, movs, ${j(PLANO)}).saldoFinal,
      balanco: Lancamentos.balanco(${j(PAGOS_BB)}, ${j(PLANO)}, movs, '2026-10-19').saldoContas.find((s) => s.conta.id === 'cb-bb').saldo,
      pares: conc.itens.map((i) => [i.movimento.id, i.situacao, i.lancamento?.id]), semMovimento: conc.semMovimento.length,
    };
  })()`);
  assert.deepEqual(r.movs, [
    ['mov-d1', 'cb-bb', '2026-09-10', 'debito', 640, 'PAG BOLETO – Unifique Telecom'],
    ['mov-d2', 'cb-bb', '2026-09-10', 'debito', 640, 'PIX ENVIADO – Buffet Sabor'],
    ['mov-r1', 'cb-bb', '2026-09-12', 'credito', 480, 'PIX RECEBIDO'],
  ], 'só pagos na conta, dentro da janela; previsto, anterior à janela e de outra conta ficam de fora');
  assert.equal(r.extrato, 100000 - 640 - 640 + 480);
  assert.equal(r.extrato, r.balanco);
  assert.deepEqual(Object.fromEntries(r.pares.map(([m, s, l]) => [m, [s, l]])), { 'mov-d1': ['sugestao', 'd1'], 'mov-d2': ['sugestao', 'd2'], 'mov-r1': ['sugestao', 'r1'] }, 'mesmo valor no mesmo dia: o nome desempata');
  assert.equal(r.semMovimento, 0);
});

test('extrato salvo v2 vira v3 sem perder movimentos: só entram os pagamentos da conta de pagamento', () => {
  const { run, store } = contexto();
  const saque = { id: 'mov-saq-20260901-1-c', contaId: 'cb-bb', data: '2026-09-01', tipo: 'credito', valor: 9000, descricao: 'TED recebida', referencia: 'saque', categoriaSugerida: 'transferencia' };
  store['aulor-v1-financeiro-plano-v1'] = j(PLANO);
  store['aulor-v1-financeiro-extrato-v2'] = j([...MOVS, saque]);
  const ids = run(`Lancamentos.carregarExtrato(${j(PAGOS_BB)}).map((m) => m.id)`);
  assert.deepEqual(ids, [...MOVS.map((m) => m.id), saque.id, 'mov-d1', 'mov-d2', 'mov-r1']);
  assert.deepEqual(JSON.parse(store['aulor-v1-financeiro-extrato-v3']).map((m) => m.id), ids, 'gravado na chave nova');
  assert.deepEqual(run(`Lancamentos.carregarExtrato([]).map((m) => m.id)`), ids, 'depois lê da v3, sem migrar de novo');
});
