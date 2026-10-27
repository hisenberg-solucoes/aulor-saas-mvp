// Centros de custo: o código dos centros ligados a um departamento não muda (folha e regras padrão acham o centro
// por ele), e o "Pago em 12 meses" da lista é o mesmo total que o Financeiro mostra com o filtro do link
// (situacao=pago, periodo=pagoEm, de/ate dos 12 meses, centro). Montagem num vm com localStorage falso.
// Rode: node --test tests/centros-custo.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ARQUIVOS = ['js/agenda.js', 'js/cursos-data.js', 'js/feriados-data.js', 'js/feriados-motor.js', 'js/colaboradores-data.js', 'js/centros-receita.js', 'js/lancamentos-data.js', 'js/lancamentos-motor.js'];
const store = {};
const ctx = vm.createContext({ localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } } });
ARQUIVOS.forEach((f) => vm.runInContext(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), ctx, { filename: f }));
const run = (expr) => JSON.parse(JSON.stringify(vm.runInContext(expr, ctx)) ?? 'null');
const erros = (dados, id = null) => run(`Lancamentos.validarPlano(Lancamentos.plano(), 'centrosCusto', ${JSON.stringify({ nome: 'X', ...dados })}, ${JSON.stringify(id)})`);

test('centro ligado a departamento não troca de código; o nome e a descrição mudam', () => {
  assert.equal(erros({ codigo: '210' }, 'cc-200')[0]?.campo, 'codigo');
  assert.deepEqual(erros({ codigo: '200', nome: 'Pedagógico e eventos' }, 'cc-200'), []);
});

test('centro novo pede 3 dígitos livres e diz de quem é o código repetido', () => {
  assert.deepEqual(erros({ codigo: '800' }), []);
  assert.equal(erros({ codigo: '300' })[0]?.mensagem, 'O código 300 já é de "Comercial".');
  assert.match(erros({ codigo: '8' })[0]?.mensagem, /ex\.: 800/);
});

test('pago em 12 meses de cada centro = total do Financeiro filtrado pelo link', () => {
  const r = run(`(() => {
    const L = Lancamentos; const lista = L.carregar(); const per = L.periodoPadrao();
    return L.porCentroCusto(lista, per).filter((g) => g.despesa > 0 && g.centro.codigo).map((g) => ({
      id: g.centro.id, despesa: g.despesa,
      financeiro: L.arred(L.filtrar(lista, { tipo: 'despesa', situacao: 'pago', campoPeriodo: 'pagoEm', de: per.de, ate: per.ate, centroCustoId: g.centro.id }).reduce((s, l) => s + L.valorFinal(l), 0)),
    }));
  })()`);
  assert.ok(r.length >= 7, 'a semente tem despesa paga nos 7 departamentos');
  r.forEach((g) => assert.equal(g.financeiro, g.despesa, g.id));
});
