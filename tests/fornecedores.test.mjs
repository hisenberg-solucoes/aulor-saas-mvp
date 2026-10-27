// Fornecedor: CNPJ/CPF repetido é barrado em Lancamentos.validarPlano (compara só os dígitos; a própria edição passa).
// Rode: node --test tests/fornecedores.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const store = {};
const ctx = vm.createContext({ localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } } });
['js/documento.js', 'js/feriados-data.js', 'js/feriados-motor.js', 'js/centros-receita.js', 'js/lancamentos-data.js', 'js/lancamentos-motor.js']
  .forEach((f) => vm.runInContext(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), ctx, { filename: f }));
const run = (expr) => JSON.parse(JSON.stringify(vm.runInContext(expr, ctx)) ?? 'null');
const erros = (dados, exceto = null) => run(`Lancamentos.validarPlano(Lancamentos.plano(), 'fornecedores', ${JSON.stringify({ nome: 'Teste', ...dados })}, ${JSON.stringify(exceto)})`);

test('CNPJ de outro fornecedor é erro com o nome de quem já tem', () => {
  assert.deepEqual(erros({ documento: '79.379.491/0001-83' }), [{ campo: 'documento', mensagem: 'Já cadastrado como "Havan".' }]);
  assert.equal(erros({ documento: '79379491000183' })[0]?.mensagem, 'Já cadastrado como "Havan".');
});

test('o próprio cadastro, documento vazio e documento novo passam', () => {
  assert.deepEqual(erros({ documento: '79.379.491/0001-83' }, 'for-havan'), []);
  assert.deepEqual(erros({ documento: '' }), []);
  assert.deepEqual(erros({ documento: '11.222.333/0001-81' }), []);
});
