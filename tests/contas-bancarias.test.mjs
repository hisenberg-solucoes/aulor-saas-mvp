// Conta bancária: a data do saldo inicial não pode ser futura (Lancamentos.validarPlano).
// Rode: node --test tests/contas-bancarias.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const store = {};
const ctx = vm.createContext({ localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } } });
['js/documento.js', 'js/feriados-data.js', 'js/feriados-motor.js', 'js/centros-receita.js', 'js/lancamentos-data.js', 'js/lancamentos-motor.js']
  .forEach((f) => vm.runInContext(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), ctx, { filename: f }));
const run = (expr) => JSON.parse(JSON.stringify(vm.runInContext(expr, ctx)) ?? 'null');
const hoje = run('Lancamentos.hoje()');
const amanha = run(`Lancamentos.somarDias(${JSON.stringify(hoje)}, 1)`);
const erros = (dados) => run(`Lancamentos.validarPlano(Lancamentos.plano(), 'contasBancarias', ${JSON.stringify({ nome: 'Sicredi', tipo: 'corrente', saldoInicial: 100, ...dados })}, null)`);

test('saldo inicial com data futura é erro no campo da data', () => {
  assert.deepEqual(erros({ saldoInicialEm: amanha }).map((e) => e.campo), ['saldoInicialEm']);
});

test('hoje e datas passadas passam; sem data continua pedindo a data', () => {
  assert.deepEqual(erros({ saldoInicialEm: hoje }), []);
  assert.deepEqual(erros({ saldoInicialEm: '2026-08-01' }), []);
  assert.equal(erros({ saldoInicialEm: '' })[0]?.mensagem, 'Informe a data do saldo inicial.');
});
