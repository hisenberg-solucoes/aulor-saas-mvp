// Implementação da V1: os dados do mapa se sustentam (situações válidas, ids únicos, ligações e
// integrações que existem), porque um id errado some do mapa em silêncio.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const D = new Function(readFileSync(new URL('../js/implementacao-data.js', import.meta.url), 'utf8') + '; return IMPLEMENTACAO;')();
const telas = [D.entrada, ...D.raias.flatMap((r) => r.grupos.flatMap((g) => g.telas))];
const SITUACOES = ['ok', 'parcial', 'falta', 'na'];

// O id vai para o endereço (#id ou #int-id) sem decode: só minúsculas, dígitos e hífen, e tela não começa com int-.
test('ids das telas e das integrações são únicos e cabem no endereço', () => {
  for (const ids of [telas.map((t) => t.id), D.integracoes.map((i) => i.id)]) {
    assert.deepEqual(ids.filter((id, i) => ids.indexOf(id) !== i), []);
    assert.deepEqual(ids.filter((id) => !/^[a-z0-9-]+$/.test(id)), []);
  }
  assert.deepEqual(telas.map((t) => t.id).filter((id) => id.startsWith('int-')), []);
});

// O disco do Mac não distingue maiúsculas; o GitHub Pages sim.
test('os arquivos do protótipo existem com a grafia exata', () => {
  const faltando = telas.flatMap((t) => t.prototipo).filter((p) => {
    const i = p.lastIndexOf('/');
    return !readdirSync(new URL(`../${p.slice(0, i + 1)}`, import.meta.url)).includes(p.slice(i + 1));
  });
  assert.deepEqual(faltando, []);
});

test('a Entrada desce para pelo menos uma raia de portal', () => {
  assert.ok(D.raias.some((r) => r.portal));
});

test('toda feature diz a situação nos dois lados', () => {
  const ruins = telas.flatMap((t) => (t.features.length ? t.features : [{}]).filter((f) => !SITUACOES.includes(f.web) || !SITUACOES.includes(f.api) || !f.parte || !f.nome).map(() => t.id));
  assert.deepEqual(ruins, []);
});

test('ligações e integrações apontam para o que existe', () => {
  const ids = new Set(telas.map((t) => t.id));
  const ints = new Set(D.integracoes.map((i) => i.id));
  const quebradas = telas.flatMap((t) => [
    ...(t.liga ?? []).filter((id) => !ids.has(id) || id === t.id).map((id) => `${t.id} → ${id}`),
    ...(t.integracoes ?? []).filter((id) => !ints.has(id)).map((id) => `${t.id} → ${id}`),
  ]);
  assert.deepEqual(quebradas, []);
});
