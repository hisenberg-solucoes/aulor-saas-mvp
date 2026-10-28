// Materiais das aulas: validação, liberação por data e o que o aluno vê.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const mem = {};
globalThis.localStorage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; }, removeItem: (k) => { delete mem[k]; } };
const Materiais = new Function(readFileSync(new URL('../js/materiais-motor.js', import.meta.url), 'utf8') + '; return Materiais;')();

test('valida título, tipo e link', () => {
  const r = Materiais.salvar({ turmaId: 't1', aulaId: 1, titulo: ' ', tipo: 'link', url: 'ftp://x' });
  assert.deepEqual(Object.keys(r.erros).sort(), ['titulo', 'url']);
});

test('libera por data: sem data bloqueia, futura programa, até hoje libera', () => {
  const base = { turmaId: 't1', aulaId: 1, tipo: 'arquivo', arquivo: 'apostila.pdf' };
  Materiais.salvar({ ...base, titulo: 'Sem data' });
  Materiais.salvar({ ...base, titulo: 'Futuro', liberarEm: '2999-01-01' });
  const { material } = Materiais.salvar({ ...base, titulo: 'Hoje', liberarEm: '2026-10-27' });
  assert.equal(Materiais.situacao(material, '2026-10-27'), 'liberado');
  assert.equal(Materiais.situacao({ liberarEm: '2999-01-01' }, '2026-10-27'), 'programado');
  assert.equal(Materiais.situacao({ liberarEm: null }, '2026-10-27'), 'bloqueado');
  assert.deepEqual(Materiais.doAluno('t1', '2026-10-27').map((m) => m.titulo), ['Hoje']);
});

test('editar mantém o id e o autor; liberar grava a data', () => {
  const { material } = Materiais.salvar({ turmaId: 't2', aulaId: 3, titulo: 'Slides', tipo: 'link', url: 'https://ex.com/s', autor: { nome: 'Prof', papel: 'professor' } });
  Materiais.salvar({ ...material, titulo: 'Slides v2' });
  Materiais.liberar(material.id, '2026-10-01');
  const [m] = Materiais.daAula('t2', 3);
  assert.equal(m.titulo, 'Slides v2');
  assert.equal(m.autor.nome, 'Prof');
  assert.equal(m.liberarEm, '2026-10-01');
  // O Desfazer do portal do professor devolve a data anterior (null = não liberado).
  Materiais.liberar(material.id, null);
  assert.equal(Materiais.situacao(Materiais.daAula('t2', 3)[0], '2026-10-27'), 'bloqueado');
});

test('rótulo da pílula: o mesmo nos dois portais, com a data de quem está programado', () => {
  assert.equal(Materiais.rotulo({ liberarEm: '2026-10-28' }, '2026-10-27'), 'Libera em 28/10');
  assert.equal(Materiais.rotulo({ liberarEm: '2026-10-27' }, '2026-10-27'), 'Liberado');
  assert.equal(Materiais.rotulo({ liberarEm: null }, '2026-10-27'), 'Não liberado');
  assert.match(Materiais.pilula({ liberarEm: null }, '2026-10-27'), /bg-amber-50.*Não liberado/);
});

test('semente: cada material cai numa aula gravada da PY1 N, com uma aula de cada situação', () => {
  const guardado = {};
  const ctx = vm.createContext({ console, localStorage: { getItem: (k) => guardado[k] ?? null, setItem: (k, v) => { guardado[k] = String(v); }, removeItem: (k) => { delete guardado[k]; } } });
  ['js/agenda.js', 'js/softwares-data.js', 'js/cursos-data.js', 'js/cursos-motor.js', 'js/formacoes-data.js', 'js/formacoes-motor.js', 'js/aulas-motor.js', 'js/turmas-motor.js', 'js/materiais-motor.js']
    .forEach((f) => vm.runInContext(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), ctx, { filename: f }));
  const { aulas, ms } = JSON.parse(vm.runInContext(`JSON.stringify((() => {
    const t = Turmas.porId(Turmas.carregar(), 'fpsa-py1');
    return { aulas: Turmas.aulasAgendadas(t).map((a) => a.id + ' ' + a.data), ms: Materiais.carregar().map((m) => [m.aulaId, Materiais.situacao(m, '2026-10-27')]) };
  })())`, ctx));
  assert.ok(!aulas.some((a) => a.endsWith('2026-11-02')), 'Finados fica de fora');
  const ids = aulas.map((a) => a.split(' ')[0]);
  ms.forEach(([aulaId]) => assert.ok(ids.includes(aulaId), `aula ${aulaId} existe`));
  assert.deepEqual([...new Set(ms.map(([, s]) => s))].sort(), ['bloqueado', 'liberado', 'programado']);
});
