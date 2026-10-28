// Área do curso é texto livre e opcional, como na API (sem cadastro de áreas, sem eixo):
// as sugestões e o filtro saem dos nomes já usados, sem repetir por caixa ou acento.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = vm.createContext({ console, localStorage: { getItem: () => null, setItem() {} } });
['js/agenda.js', 'js/softwares-data.js', 'js/cursos-data.js', 'js/cursos-motor.js']
  .forEach((f) => vm.runInContext(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), ctx, { filename: f }));
const rodar = (expressao) => JSON.parse(vm.runInContext(`JSON.stringify((() => { ${expressao} })())`, ctx));

test('sugestões de área: nomes já usados, sem vazio e sem repetir por caixa ou acento', () => {
  const areas = rodar(`return Cursos.areasUsadas([{ area: 'Gestão' }, { area: ' gestao ' }, { area: '' }, {}], [{ area: 'Design' }]);`);
  assert.deepEqual(areas, ['Design', 'Gestão']);
});

test('curso sem área é válido e o filtro casa a área ignorando caixa e acento', () => {
  const r = rodar(`
    const dados = { codigo: 'TST', nome: 'Teste de área', area: '', nivel: 'basico', cargaHoraria: 10, formatos: ['presencial'] };
    const lista = [...Cursos.carregar(), { id: 'x', ...dados, area: 'Gestão', resumo: '' }];
    return { erros: Cursos.validarDados(dados, Cursos.carregar()), filtrados: Cursos.filtrar(lista, { area: 'GESTAO' }).map((c) => c.area) };
  `);
  assert.deepEqual(r.erros, []);
  assert.ok(r.filtrados.length > 1 && r.filtrados.every((a) => a === 'Gestão'));
});
