// Link do Google Meet de cada aula (Aulas.meetUrl, js/aulas-motor.js): formato do Meet,
// o mesmo para a mesma aula da mesma turma e diferente entre aulas.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = vm.createContext({});
['js/agenda.js', 'js/aulas-motor.js'].forEach((f) => vm.runInContext(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), ctx, { filename: f }));
const rodar = (expr) => JSON.parse(JSON.stringify(vm.runInContext(expr, ctx)));

const a1 = rodar(`Aulas.meetUrl('sup10-stc', { id: 'a1' })`);
assert.match(a1, /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/);
assert.equal(rodar(`Aulas.meetUrl('sup10-stc', { id: 'a1' })`), a1);
const varios = rodar(`Array.from({ length: 50 }, (_, i) => Aulas.meetUrl('sup10-stc', { id: 'a' + (i + 1) }))`);
assert.equal(new Set(varios).size, 50);
assert.notEqual(rodar(`Aulas.meetUrl('sup10-css', { id: 'a1' })`), a1);
