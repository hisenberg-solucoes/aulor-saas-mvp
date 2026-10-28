// Implementação da V1: os dados do mapa se sustentam (situações válidas, ids únicos, ligações e
// integrações que existem), porque um id errado some do mapa em silêncio.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const D = new Function(readFileSync(new URL('../js/implementacao-data.js', import.meta.url), 'utf8') + '; return IMPLEMENTACAO;')();
const telas = [D.entrada, ...D.raias.flatMap((r) => r.grupos.flatMap((g) => g.telas))];
const SITUACOES = ['ok', 'parcial', 'falta', 'na'];

test('ids das telas são únicos', () => {
  const ids = telas.map((t) => t.id);
  assert.deepEqual(ids.filter((id, i) => ids.indexOf(id) !== i), []);
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
