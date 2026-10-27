// Toda página e todo script citados existem: a V1 tirou telas do protótipo, e um link ou <script>
// para o que saiu quebra em silêncio. Os scripts de js/ resolvem a partir da raiz; os de
// portal-*/js/, a partir do portal.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const raiz = resolve(dirname(new URL(import.meta.url).pathname), '..');
const pastas = ['.', 'portal-aluno', 'portal-professor'];
const arquivos = pastas.flatMap((p) => [
  ...readdirSync(join(raiz, p)).filter((f) => f.endsWith('.html')).map((f) => ({ arq: join(p, f), base: p })),
  ...(existsSync(join(raiz, p, 'js')) ? readdirSync(join(raiz, p, 'js')).filter((f) => f.endsWith('.js')).map((f) => ({ arq: join(p, 'js', f), base: p })) : []),
]);

test('scripts e páginas citados existem', () => {
  const faltando = [];
  for (const { arq, base } of arquivos) {
    const texto = readFileSync(join(raiz, arq), 'utf8');
    const html = arq.endsWith('.html');
    const refs = [
      ...(html ? [...texto.matchAll(/src="([^"?#]+\.js)/g)].map((m) => m[1]).filter((s) => !s.startsWith('http')) : []),
      ...[...texto.matchAll(/(?<![\w/.:-])((?:\.\.\/)?(?:[a-z0-9-]+\/)?[a-z0-9-]+\.html)/g)].map((m) => m[1]),
    ];
    for (const ref of new Set(refs)) {
      if (!existsSync(resolve(raiz, base, ref))) faltando.push(`${arq} → ${ref}`);
    }
  }
  assert.deepEqual(faltando, []);
});
