// Copiar de <ano> (js/feriados-motor.js): datas móveis seguem a Páscoa do ano novo, o recesso que vira o ano
// mantém a duração, e o que já existe no destino não é copiado de novo.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const store = {};
const ctx = vm.createContext({ localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } } });
['js/feriados-data.js', 'js/feriados-motor.js'].forEach((f) => vm.runInContext(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), ctx, { filename: f }));
const rodar = (expr) => JSON.parse(JSON.stringify(vm.runInContext(expr, ctx)));

assert.equal(rodar(`Feriados.pascoa(2026)`), '2026-04-05');
assert.equal(rodar(`Feriados.pascoa(2027)`), '2027-03-28');
assert.equal(rodar(`Feriados.pascoa(2028)`), '2028-04-16');

// 2027 já tem Carnaval, Sexta-feira Santa e Corpus Christi; falta o que só existia em 2026.
assert.deepEqual(rodar(`Feriados.faltando(Feriados.carregar(), 2026, 2027).map((f) => f.nome)`), ['Quarta-feira de Cinzas', 'Recesso de fim de ano']);

const copia = rodar(`Feriados.copiarAno(Feriados.carregar(), 2027, 2028).novos.map((f) => [f.nome, f.data, f.dataFim])`);
assert.deepEqual(copia, [
  ['Carnaval', '2028-02-28', '2028-02-29'],
  ['Sexta-feira Santa', '2028-04-14', null],
  ['Corpus Christi', '2028-06-15', null],
]);

const recesso = rodar(`Feriados.copiarAno(Feriados.carregar(), 2026, 2027).novos.find((f) => f.nome === 'Recesso de fim de ano')`);
assert.equal(recesso.data, '2027-12-24');
assert.equal(recesso.dataFim, '2028-01-03');

// Ocorrência guarda o período inteiro, mesmo vista do ano seguinte.
const jan = rodar(`Feriados.ocorrencias(Feriados.carregar(), 2027).find((o) => o.nome === 'Recesso de fim de ano')`);
assert.deepEqual([jan.inicio, jan.fim, jan.de, jan.ate, jan.total], ['2027-01-01', '2027-01-03', '2026-12-24', '2027-01-03', 11]);
