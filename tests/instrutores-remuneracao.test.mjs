// Instrutor como papel docente (docs/pessoas-papeis.md): remuneração folha/PJ/RPA e vínculo com colaborador.
// Scripts das regras de instrutor.html num vm com localStorage falso.
// Aniversariantes, chamados e o custo do instrutor na turma ficaram fora da V1: os testes deles não vieram do protótipo.
// Rode: node --test tests/instrutores-remuneracao.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const store = {};
const ctx = vm.createContext({ localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } } });
['js/agenda.js', 'js/cursos-data.js', 'js/instrutores-data.js', 'js/instrutores-motor.js', 'js/colaboradores-data.js', 'js/colaboradores-motor.js', 'js/clientes-data.js', 'js/clientes-motor.js', 'js/softwares-data.js']
  .forEach((f) => vm.runInContext(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), ctx, { filename: f }));
const rodar = (expr) => JSON.parse(JSON.stringify(vm.runInContext(expr, ctx)));
const instrutor = (id, extra = '') => `({ ...Instrutores.porId(Instrutores.carregar(), '${id}')${extra} })`;

test('folha: sem empresa, valor hora, contrato nem bloqueio de pagamento', () => {
  const pend = rodar(`Instrutores.pendencias(${instrutor('i0')})`);
  assert.ok(!pend.some((p) => /empresa|valor hora|PIX/.test(p)), pend.join(' · '));
  assert.deepEqual(rodar(`Instrutores.pendenciasPagamento(${instrutor('i0')})`), []);
  const erros = rodar(`Instrutores.validarContrato({ tipo: 'cursos', turmaIds: ['x'] }, ${instrutor('i0')})`);
  assert.ok(erros.some((e) => /folha/.test(e.mensagem)));
  assert.ok(!rodar(`Instrutores.filtrar(Instrutores.carregar(), { situacao: 'sem-empresa' }).map((i) => i.id)`).includes('i0'));
});

test('RPA: troca a empresa pela conta da própria pessoa', () => {
  const semConta = instrutor('i1', ", remuneracao: 'rpa', empresa: null");
  assert.ok(rodar(`Instrutores.pendencias(${semConta})`).includes('Sem PIX nem conta bancária'));
  assert.deepEqual(rodar(`Instrutores.pendenciasPagamento(${semConta})`).filter((p) => !/antecedentes/.test(p)), ['sem PIX nem conta']);
  const comPix = instrutor('i1', ", remuneracao: 'rpa', empresa: null, contaPessoal: { pix: 'andre@exemplo.com.br' }");
  assert.ok(!rodar(`Instrutores.pendencias(${comPix})`).some((p) => /empresa|PIX/.test(p)));
  assert.deepEqual(rodar(`Instrutores.pendenciasPagamento(${comPix})`).filter((p) => !/antecedentes/.test(p)), []);
});

test('instrutor da equipe: CPF e nascimento ficam no colaborador', () => {
  const i3 = rodar(instrutor('i3'));
  assert.equal(i3.colaboradorId, 'c10');
  assert.equal(i3.cpf, '');
  assert.ok(!rodar(`Instrutores.pendencias(${instrutor('i3')})`).some((p) => /CPF|Endereço|emergência/.test(p)));
  // Editar dados sem CPF/nascimento/RG passa; o mesmo formulário num instrutor externo não.
  const dados = "{ nome: 'Otávio Rangel Delgado', apelido: 'Otávio' }";
  assert.deepEqual(rodar(`Instrutores.validarDados(${dados}, Instrutores.carregar(), 'i3')`), []);
  assert.ok(rodar(`Instrutores.validarDados(${dados}, Instrutores.carregar(), 'i1')`).some((e) => e.campo === 'cpf'));
});

test('CPF de colaborador não vira um segundo cadastro de instrutor', () => {
  const cpfBruno = rodar(`COLABORADORES_SEED.find((c) => c.id === 'c2').cpf`);
  const erros = rodar(`Instrutores.validarDados({ nome: 'Bruno Lima', apelido: 'Bruno', nascimento: '1987-09-23', cpf: '${cpfBruno}', rg: '1' }, Instrutores.carregar())`);
  assert.ok(erros.some((e) => e.campo === 'cpf' && /Bruno Lima/.test(e.mensagem)));
});

test('não passa para folha com contrato ativo', () => {
  assert.ok(rodar(`Instrutores.contratosAtivos(${instrutor('i3')}).length`) > 0);
  const erros = rodar(`Instrutores.validarDados({ nome: 'Otávio Rangel Delgado', apelido: 'Otávio', remuneracao: 'folha' }, Instrutores.carregar(), 'i3')`);
  assert.ok(erros.some((e) => e.campo === 'remuneracao'));
});

test('colaborador ganha o papel de instrutor sem repetir CPF, uma vez só', () => {
  const r = rodar(`(() => {
    const c = COLABORADORES_SEED.find((x) => x.id === 'c1');
    const a = Instrutores.incluirDeColaborador(Instrutores.carregar(), c, { remuneracao: 'folha' });
    const b = Instrutores.incluirDeColaborador(a.lista, c, { remuneracao: 'pj' });
    return { novo: a.instrutor, total: [a.lista.length, b.lista.length], mesmo: a.instrutor.id === b.instrutor.id, pessoa: Instrutores.pessoaDe(a.instrutor), cpf: c.cpf };
  })()`);
  assert.equal(r.novo.colaboradorId, 'c1');
  assert.equal(r.novo.remuneracao, 'folha');
  assert.equal(r.novo.cpf, '');
  assert.equal(r.total[0], r.total[1]);
  assert.ok(r.mesmo);
  assert.equal(r.pessoa.cpf, r.cpf);
});

test('conta pessoal do RPA e filtro por remuneração', () => {
  assert.deepEqual(rodar(`Instrutores.validarContaPessoal({ pix: '', conta: '' })`).map((e) => e.campo), ['pix']);
  const conta = rodar(`Instrutores.porId(Instrutores.atualizarContaPessoal(Instrutores.carregar(), 'i1', { pix: ' andre@exemplo.com.br ' }), 'i1').contaPessoal`);
  assert.equal(conta.pix, 'andre@exemplo.com.br');
  assert.deepEqual(rodar(`Instrutores.filtrar(Instrutores.carregar(), { remuneracao: 'folha' }).map((i) => i.id)`), ['i0']);
});

test('custo-hora de referência: só para folha, maior que zero ou em branco', () => {
  const dados = (rem, ch) => `{ nome: 'Bruno Lima', apelido: 'Bruno', remuneracao: '${rem}', custoHoraReferencia: '${ch}' }`;
  assert.deepEqual(rodar(`Instrutores.validarDados(${dados('folha', '')}, Instrutores.carregar(), 'i0')`), []);
  assert.ok(rodar(`Instrutores.validarDados(${dados('folha', '-5')}, Instrutores.carregar(), 'i0')`).some((e) => e.campo === 'custoHoraReferencia'));
  assert.equal(rodar(`Instrutores.porId(Instrutores.atualizarDados(Instrutores.carregar(), 'i0', ${dados('folha', '92.5')}), 'i0').custoHoraReferencia`), 92.5);
  assert.equal(rodar(`Instrutores.porId(Instrutores.atualizarDados(Instrutores.carregar(), 'i0', ${dados('folha', '')}), 'i0').custoHoraReferencia`), null);
  // Saiu da folha: o custo-hora deixa de valer.
  assert.equal(rodar(`Instrutores.porId(Instrutores.atualizarDados(Instrutores.carregar(), 'i0', ${dados('pj', '92.5')}), 'i0').custoHoraReferencia`), null);
});
