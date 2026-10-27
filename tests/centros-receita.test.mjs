// Centros de receita no plano: tipo 'receita' na mesma lista dos de custo, grupo do mesmo tipo e de primeiro nível,
// e as duas leituras (Lancamentos e js/centros-receita.js) vendo os mesmos centros. Rode: node --test tests/centros-receita.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const store = {};
const ctx = vm.createContext({ localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } } });
['js/feriados-data.js', 'js/feriados-motor.js', 'js/centros-receita.js', 'js/lancamentos-data.js', 'js/lancamentos-motor.js']
  .forEach((f) => vm.runInContext(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), ctx, { filename: f }));
const run = (expr) => JSON.parse(JSON.stringify(vm.runInContext(expr, ctx)) ?? 'null');
const campos = (dados, id = null, plano = 'Lancamentos.plano()') => run(`Lancamentos.validarPlano(${plano}, 'centrosCusto', ${JSON.stringify({ nome: 'X', ...dados })}, ${JSON.stringify(id)})`).map((e) => e.campo);

test('a semente traz os departamentos como custo e B2B, B2C e Orion como receita; as duas leituras concordam', () => {
  assert.deepEqual(run(`Lancamentos.centrosDoTipo(Lancamentos.plano(), 'custo').map((c) => c.codigo)`), ['100', '200', '300', '400', '500', '600', '700']);
  const receita = run(`Lancamentos.centrosDoTipo(Lancamentos.plano(), 'receita').map((c) => c.id)`);
  assert.deepEqual(receita, ['cr-b2b', 'cr-b2c', 'cr-orion']);
  run('Lancamentos.salvarPlano(Lancamentos.plano())');
  assert.deepEqual(run('CentrosReceita.todos().map((c) => c.id)'), receita);
});

test('plano salvo sem centros de receita recebe a semente', () => {
  const p = run('Lancamentos.plano()');
  store['aulor-v1-financeiro-plano-v2'] = JSON.stringify({ ...p, centrosCusto: p.centrosCusto.filter((c) => c.tipo !== 'receita') });
  assert.deepEqual(run(`Lancamentos.centrosDoTipo(Lancamentos.plano(), 'receita').map((c) => c.id)`), ['cr-b2b', 'cr-b2c', 'cr-orion']);
  assert.deepEqual(run('CentrosReceita.todos().map((c) => c.id)'), ['cr-b2b', 'cr-b2c', 'cr-orion'], 'gravado para Vendas e Turmas');
});

test('tipo e código: receita numera em R + dezena; departamento continua de custo', () => {
  assert.deepEqual(campos({ tipo: 'receita', codigo: 'R40' }), []);
  assert.deepEqual(campos({ tipo: 'receita', codigo: '800' }), ['codigo']);
  assert.deepEqual(campos({ tipo: 'custo', codigo: 'R40' }), ['codigo']);
  assert.deepEqual(campos({ tipo: 'receita', codigo: 'R10' }), ['codigo'], 'R10 já é do B2B');
  assert.deepEqual(campos({ tipo: 'outro', codigo: '800' })[0], 'tipo');
  assert.deepEqual(campos({ tipo: 'receita', codigo: '200' }, 'cc-200')[0], 'tipo');
});

test('grupo: do mesmo tipo, de primeiro nível, e um grupo não entra em outro', () => {
  assert.deepEqual(campos({ tipo: 'receita', codigo: 'R40', grupoId: 'cr-b2b' }), []);
  assert.deepEqual(campos({ tipo: 'custo', codigo: '800', grupoId: 'cr-b2b' }), ['grupoId']);
  assert.deepEqual(campos({ tipo: 'receita', codigo: 'R10', grupoId: 'cr-b2b' }, 'cr-b2b'), ['grupoId'], 'não é grupo de si mesmo');
  const comGrupo = `Lancamentos.atualizarNoPlano(Lancamentos.plano(), 'centrosCusto', 'cr-orion', { grupoId: 'cr-b2b' })`;
  assert.deepEqual(campos({ tipo: 'receita', codigo: 'R40', grupoId: 'cr-orion' }, null, comGrupo), ['grupoId'], 'Orion já está dentro do B2B');
  assert.deepEqual(campos({ tipo: 'receita', codigo: 'R10', grupoId: 'cr-b2c' }, 'cr-b2b', comGrupo), ['grupoId'], 'B2B agrupa o Orion');
  assert.deepEqual(campos({ tipo: 'custo', codigo: '850' }, 'cr-b2b', comGrupo)[0], 'tipo', 'trocar o tipo do grupo deixaria o Orion no outro tipo');
});

test('despesa não aceita centro de receita', () => {
  const erros = run(`Lancamentos.validar({ tipo: 'despesa', descricao: 'Coffee', valor: 100, vencimento: '2026-09-10', forma: 'pix', categoriaId: 'cat-330', contaBancariaId: 'cb-bb', centroCustoId: 'cr-b2b', pessoa: { tipo: 'fornecedor', nome: 'Buffet' } })`);
  assert.deepEqual(erros.map((e) => e.campo), ['centroCustoId']);
});
