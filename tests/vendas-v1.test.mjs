// Vendas (V1): centro de receita obrigatório na venda nova e venda particular criada pelo link do pacote.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const mem = {};
globalThis.localStorage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; }, removeItem: (k) => { delete mem[k]; } };
const arquivos = ['agenda', 'cursos-data', 'cursos-motor', 'formacoes-data', 'formacoes-motor', 'clientes-data', 'clientes-motor', 'documento', 'centros-receita', 'contratos-data', 'contratos-motor'];
const codigo = arquivos.map((f) => readFileSync(new URL(`../js/${f}.js`, import.meta.url), 'utf8')).join('\n;\n');
const { Contratos, Clientes, Cursos, Formacoes } = new Function(`${codigo}; return { Contratos, Clientes, Cursos, Formacoes };`)();

const dadosClientes = Clientes.carregar();
const ctx = { empresas: dadosClientes.empresas, alunos: dadosClientes.alunos, responsaveis: dadosClientes.responsaveis, cursos: Cursos.carregar(), formacoes: Formacoes.carregar() };
const cursoId = ctx.cursos.find((c) => c.status === 'ativo').id;
const novo = { venda: 'cursos', cursoIds: [cursoId], vagas: 1, vendedorId: 'rafael', contratante: 'particular' };

test('semente: toda venda tem centro de receita e o vendedor externo tem as dele', () => {
  const lista = Contratos.carregar();
  assert.ok(lista.every((c) => ['cr-b2b', 'cr-b2c'].includes(c.centroReceitaId)));
  assert.ok(lista.filter((c) => c.contratante === 'empresa').every((c) => c.centroReceitaId === 'cr-b2b'));
  assert.ok(lista.filter((c) => c.vendedorId === 'rafael').length >= 2);
});

test('venda nova exige centro de receita ativo', () => {
  assert.ok(Contratos.validarNovo(ctx, novo).some((e) => e.campo === 'centroReceitaId'));
  assert.deepEqual(Contratos.validarNovo(ctx, { ...novo, centroReceitaId: 'cr-b2c' }), []);
});

test('particular nasce sem responsável e o 1º aluno do link vira o responsável', () => {
  const { lista, contrato } = Contratos.incluir(Contratos.carregar(), ctx, { ...novo, centroReceitaId: 'cr-b2c' });
  assert.equal(contrato.contratante, 'particular');
  assert.equal(contrato.centroReceitaId, 'cr-b2c');
  assert.equal(contrato.responsavel, null);
  const comLink = Contratos.gerarConvitePacote(lista, contrato.id, contrato.pacotes[0].id);
  const p = Contratos.porId(comLink, contrato.id).pacotes[0];
  assert.equal(Contratos.situacaoConvite(Contratos.porId(comLink, contrato.id), p), 'aberto');
  const d = {
    nome: 'Teste Link Silva', nomeSocial: '', cpf: '529.982.247-25', rg: '', nascimento: '1995-05-10', genero: '', escolaridade: '', profissao: '', cargo: '',
    email: 'teste.link@exemplo.com', celular: '(47) 99999-1234', telefone: '',
    endereco: { cep: '89010-000', logradouro: 'Rua XV', numero: '100', complemento: '', bairro: 'Centro', cidade: 'Blumenau', uf: 'SC' },
    pagador: '', empresaId: null, responsavel: { nome: '', cpf: '', parentesco: '', email: '', celular: '' }, cobranca: { formaPreferida: null, diaVencimento: null },
    necessidades: { tipos: [], detalhes: '', atendimento: '' }, aceite: true, comunicacoes: false, imagem: false,
  };
  const r = Contratos.cadastrarPeloLinkPacote(comLink, dadosClientes, p.convite.token, d);
  assert.deepEqual(r.erros, []);
  assert.deepEqual(Contratos.porId(r.lista, contrato.id).responsavel, { tipo: 'aluno', id: r.alunoId });
});
