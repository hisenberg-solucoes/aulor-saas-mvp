// Modelos de contrato: validação dos campos, modelo da venda pelo centro de receita e preenchimento.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const mem = {};
globalThis.localStorage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; }, removeItem: (k) => { delete mem[k]; } };
const M = new Function(readFileSync(new URL('../js/modelos-contrato.js', import.meta.url), 'utf8') + '; return ModelosContrato;')();

test('recusa campo desconhecido e nome repetido', () => {
  const r = M.salvar({ nome: 'Contrato corporativo', texto: 'Olá {{aluno.nome}} e {{aluno.apelido}}' });
  assert.match(r.erros.nome, /Já existe/);
  assert.match(r.erros.texto, /aluno\.apelido/);
});

test('a venda usa o modelo do centro de receita e, sem ele, o padrão', () => {
  assert.equal(M.daVenda({ centroReceitaId: 'cr-b2b' }).id, 'mc-corporativo');
  assert.equal(M.daVenda({ centroReceitaId: 'cr-x' }).id, 'mc-servicos');
  assert.equal(M.daVenda({}).id, 'mc-servicos');
});

test('marcar outro como padrão desmarca o anterior; o padrão não se exclui', () => {
  const corp = M.porId('mc-corporativo');
  M.salvar({ ...corp, padrao: true });
  assert.deepEqual(M.carregar().filter((m) => m.padrao).map((m) => m.id), ['mc-corporativo']);
  assert.ok(M.remover('mc-corporativo').erro);
});

test('preenche o que a venda tem e marca o que falta', () => {
  const esc = (s) => String(s).replace(/</g, '&lt;');
  const html = M.preencherHtml('Contratante: {{contratante.nome}}\nCPF {{contratante.documento}}', { 'contratante.nome': 'Ana <b>' }, esc);
  assert.match(html, /Ana &lt;b>/);
  assert.match(html, /data-faltando="contratante.documento"/);
  assert.deepEqual(M.faltando('{{contratante.nome}} {{turma.codigo}}', { 'contratante.nome': 'x' }), ['turma.codigo']);
});
