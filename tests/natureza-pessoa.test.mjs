// Natureza da pessoa (PF / PJ) nos lançamentos: Lancamentos.naturezaPessoa, o filtro `natureza` de filtrar()
// e o segmento B2C/B2B da receita, que deriva dela (Lancamentos.segmentoDe).
// Mesma montagem de tests/saques-asaas.test.mjs: só feriados + dados/motor de lançamentos num vm com localStorage falso.
// Rode: node --test tests/natureza-pessoa.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function contexto() {
  const store = {};
  const ctx = vm.createContext({
    localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
  });
  ['js/feriados-data.js', 'js/feriados-motor.js', 'js/centros-receita.js', 'js/lancamentos-data.js', 'js/lancamentos-motor.js']
    .forEach((f) => vm.runInContext(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), ctx, { filename: f }));
  const run = (expr) => JSON.parse(JSON.stringify(vm.runInContext(expr, ctx)) ?? 'null');
  return { ctx, store, run };
}

const j = (x) => JSON.stringify(x);
const natureza = (run, pessoa) => run(`Lancamentos.naturezaPessoa(${j(pessoa)})`);

test('naturezaPessoa: documento formatado manda (CPF → pf, CNPJ → pj)', () => {
  const { run } = contexto();
  assert.equal(natureza(run, { tipo: 'aluno', id: 'a1', nome: 'Ana', documento: '123.456.789-09' }), 'pf');
  assert.equal(natureza(run, { tipo: 'empresa', id: 'e1', nome: 'Acme', documento: '12.345.678/0001-90' }), 'pj');
  // documento vence o tipo: fornecedor com CPF (MEI/autônomo) é PF; aluno com CNPJ é PJ
  assert.equal(natureza(run, { tipo: 'fornecedor', id: 'f1', nome: 'João', documento: '123.456.789-09' }), 'pf');
  assert.equal(natureza(run, { tipo: 'aluno', id: 'a2', nome: 'Ltda', documento: '12345678000190' }), 'pj');
});

test('naturezaPessoa: sem documento cai no tipo da pessoa; sem pessoa é null', () => {
  const { run } = contexto();
  for (const tipo of ['empresa', 'fornecedor']) assert.equal(natureza(run, { tipo, id: 'x', nome: 'X', documento: '' }), 'pj', tipo);
  for (const tipo of ['aluno', 'responsavel', 'colaborador', 'instrutor']) assert.equal(natureza(run, { tipo, id: 'x', nome: 'X' }), 'pf', tipo);
  assert.equal(natureza(run, { tipo: 'outro', id: 'x', nome: 'X', documento: '' }), null, 'tipo desconhecido sem documento');
  assert.equal(natureza(run, { tipo: 'aluno', id: 'x', nome: 'X', documento: '123' }), 'pf', 'documento com tamanho inválido ignora e cai no tipo');
  assert.equal(natureza(run, null), null);
  assert.equal(natureza(run, undefined), null);
});

test('NATUREZAS_PESSOA exportada com id/nome/curto', () => {
  const { run } = contexto();
  assert.deepEqual(run('Lancamentos.NATUREZAS_PESSOA'), [{ id: 'pf', nome: 'Pessoa física', curto: 'PF' }, { id: 'pj', nome: 'Pessoa jurídica', curto: 'PJ' }]);
});

const LISTA = [
  { id: 'l1', tipo: 'receita', status: 'previsto', vencimento: '2026-09-10', competencia: '2026-09', valor: 100, desconto: 0, forma: 'boleto', descricao: 'Mensalidade', pessoa: { tipo: 'aluno', id: 'a1', nome: 'Ana', documento: '123.456.789-09' } },
  { id: 'l2', tipo: 'receita', status: 'previsto', vencimento: '2026-09-10', competencia: '2026-09', valor: 200, desconto: 0, forma: 'boleto', descricao: 'Turma fechada', pessoa: { tipo: 'empresa', id: 'e1', nome: 'Acme', documento: '12.345.678/0001-90' } },
  { id: 'l3', tipo: 'despesa', status: 'previsto', vencimento: '2026-09-10', competencia: '2026-09', valor: 300, desconto: 0, forma: 'pix', descricao: 'Aluguel', pessoa: { tipo: 'fornecedor', id: 'f1', nome: 'Imobiliária', documento: '' } },
  { id: 'l4', tipo: 'despesa', status: 'previsto', vencimento: '2026-09-10', competencia: '2026-09', valor: 400, desconto: 0, forma: 'pix', descricao: 'Hora-aula', pessoa: { tipo: 'instrutor', id: 'i1', nome: 'Carlos' } },
  { id: 'l5', tipo: 'despesa', status: 'previsto', vencimento: '2026-09-10', competencia: '2026-09', valor: 500, desconto: 0, forma: 'pix', descricao: 'Ajuste', pessoa: null },
];

test('filtrar: natureza pj devolve só PJ, pf só PF e vazio devolve tudo', () => {
  const { run } = contexto();
  const ids = (f) => run(`Lancamentos.filtrar(${j(LISTA)}, ${j(f)}).map((l) => l.id)`);
  assert.deepEqual(ids({ natureza: 'pj' }), ['l2', 'l3']);
  assert.deepEqual(ids({ natureza: 'pf' }), ['l1', 'l4']);
  assert.deepEqual(ids({ natureza: '' }), ['l1', 'l2', 'l3', 'l4', 'l5']);
  assert.deepEqual(ids({}), ['l1', 'l2', 'l3', 'l4', 'l5'], 'sem o parâmetro também devolve tudo');
  // combina com os outros filtros (tipo e período), como em ?vencimento=hoje&natureza=pj
  assert.deepEqual(ids({ tipo: 'despesa', natureza: 'pj' }), ['l3']);
  assert.deepEqual(ids({ de: '2026-09-10', ate: '2026-09-10', natureza: 'pj' }), ['l2', 'l3']);
});

test('csv: coluna PF/PJ depois do documento', () => {
  const { run } = contexto();
  const linhas = run(`Lancamentos.csv(${j(LISTA)}, { categorias: [], centrosCusto: [], fornecedores: [], contasBancarias: [] }).split('\\n')`);
  const cab = linhas[0].replace(/^﻿/, '').split(';');
  assert.equal(cab[cab.indexOf('"Documento"') + 1], '"PF/PJ"');
  const col = (i) => linhas[i].split(';')[cab.indexOf('"PF/PJ"')];
  assert.equal(col(1), '"PF"'); assert.equal(col(2), '"PJ"'); assert.equal(col(3), '"PJ"'); assert.equal(col(4), '"PF"'); assert.equal(col(5), '""');
});

test('segmentoDe: receita de PJ é B2B, de PF ou sem pessoa é B2C; despesa não tem segmento', () => {
  const { run } = contexto();
  const seg = (l) => run(`Lancamentos.segmentoDe(${j(l)})`);
  assert.equal(seg({ tipo: 'receita', pessoa: { tipo: 'empresa', documento: '12.345.678/0001-90' } }), 'b2b');
  assert.equal(seg({ tipo: 'receita', pessoa: { tipo: 'responsavel', documento: '123.456.789-09' } }), 'b2c');
  assert.equal(seg({ tipo: 'receita', pessoa: { tipo: 'empresa', documento: '' } }), 'b2b', 'empresa sem documento cai no tipo');
  assert.equal(seg({ tipo: 'receita', pessoa: null }), 'b2c');
  assert.equal(seg({ tipo: 'despesa', pessoa: { tipo: 'fornecedor', documento: '12.345.678/0001-90' } }), null);
  // incluir grava o segmento derivado; atualizar acompanha a troca de pessoa
  const r = run(`(() => { const p = Lancamentos.plano(); const base = { tipo: 'receita', descricao: 'X', valor: 100, vencimento: '2026-09-10', forma: 'pix', categoriaId: p.categorias.find((c) => c.tipo === 'receita').id, contaBancariaId: p.contasBancarias[0].id };
    const a = Lancamentos.incluir([], { ...base, pessoa: { tipo: 'aluno', nome: 'Ana', documento: '123.456.789-09' } });
    const b = Lancamentos.atualizar(a.lista, a.lancamento.id, { pessoa: { tipo: 'empresa', nome: 'Acme', documento: '12.345.678/0001-90' } });
    return [a.lancamento.segmento, b[0].segmento, b[0].centroCustoId]; })()`);
  assert.deepEqual(r, ['b2c', 'b2b', null]);
});
