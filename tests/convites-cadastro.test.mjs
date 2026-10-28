// Convite de cadastro de instrutores e colaboradores (AULOR-007): quem convida, o aceite pelo e-mail
// convidado e o envio que só liga o que o próprio acesso prova (D13).
// Scripts das regras num vm com localStorage e sessionStorage falsos.
// Rode: node --test tests/convites-cadastro.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const armazem = () => { const s = {}; return { getItem: (k) => s[k] ?? null, setItem: (k, v) => { s[k] = String(v); }, removeItem: (k) => { delete s[k]; } }; };
const ctx = vm.createContext({ localStorage: armazem(), sessionStorage: armazem() });
['js/agenda.js', 'js/cursos-data.js', 'js/instrutores-data.js', 'js/instrutores-motor.js', 'js/colaboradores-data.js', 'js/colaboradores-motor.js', 'js/permissoes-data.js', 'js/convites-cadastro.js']
  .forEach((f) => vm.runInContext(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), ctx, { filename: f }));
const rodar = (expr) => JSON.parse(JSON.stringify(vm.runInContext(expr, ctx)) ?? 'null');

// CPF com dígitos verificadores válidos a partir de 9 dígitos.
function cpf(base) {
  const dv = (b) => { let s = 0; for (let i = 0; i < b.length; i += 1) s += Number(b[i]) * (b.length + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
  const d1 = dv(base);
  return `${base}${d1}${dv(base + d1)}`;
}
const nInstrutores = () => rodar('Instrutores.carregar().length');

test('convidar aponta o campo e recusa o e-mail que já tem convite pendente', () => {
  const campos = rodar(`Convites.validar({ nome: 'Ana', email: 'x', perfilId: '' }, { papel: 'instrutor' })`).map((e) => e.campo);
  assert.deepEqual(campos, ['nome', 'email', 'perfilId', 'remuneracao']);
  const repetido = rodar(`Convites.validar({ nome: 'Outra Pessoa', email: 'MARINA.kowalski@exemplo.com.br', perfilId: 'professor', remuneracao: 'pj' }, { papel: 'instrutor' })`);
  assert.deepEqual(repetido.map((e) => [e.campo, e.conviteId]), [['email', 'cv1']]);
  const corp = rodar(`Colaboradores.carregar().find((c) => c.contato.email).contato.email`);
  const colab = rodar(`Convites.validar({ nome: 'Nova Pessoa', email: 'nova@gmail.com', perfilId: 'comercial', cargo: 'Vendas', departamentoId: 'comercial', admissao: '2026-11-01', emailCorporativo: '${corp}' }, { papel: 'colaborador' })`);
  assert.deepEqual(colab.map((e) => e.campo), ['emailCorporativo']);
  // Pela ficha, a escola só informa e-mail e perfil.
  assert.deepEqual(rodar(`Convites.validar({ email: 'ok@exemplo.com.br', perfilId: 'professor' }, { papel: 'instrutor', pessoaId: 'i5' })`), []);
});

test('o convite expira em sete dias e reenviar renova o prazo', () => {
  assert.equal(rodar(`Convites.situacao(Convites.porId('cv2'))`), 'expirado');
  assert.equal(rodar(`Convites.bloqueio(Convites.porId('cv2'))`), 'expirado');
  rodar(`Convites.reenviar('cv2', { nome: 'Caio Henrique Lenz', email: 'caio.lenz@exemplo.com.br', perfilId: 'professor', remuneracao: 'rpa' })`);
  assert.equal(rodar(`Convites.situacao(Convites.porId('cv2'))`), 'enviado');
  assert.equal(rodar(`Convites.reenviar('cv3', {})`), null); // aceito: não reenvia
});

test('ninguém vira instrutor antes do envio; o envio cria a pessoa já ligada ao acesso', () => {
  const antes = nInstrutores();
  const cv = rodar(`Convites.emitir({ nome: 'Júlia Prado Nunes', email: 'julia.nunes@gmail.com', perfilId: 'professor', remuneracao: 'pj', whatsapp: '(47) 98888-1111', especialidade: 'Python' }, { papel: 'instrutor' })`);
  assert.equal(nInstrutores(), antes);
  assert.ok(rodar(`Convites.daLista('instrutor', 'julia').map((c) => c.id)`).includes(cv.id));
  assert.equal(rodar(`Convites.aceitar('${cv.id}', 'outra@gmail.com').erro`), 'email');
  const aceito = rodar(`Convites.aceitar('${cv.id}', 'Julia.Nunes@gmail.com').convite`);
  assert.equal(aceito.estado, 'aceito');
  assert.deepEqual(rodar(`Colaboradores.Acesso.de('${aceito.usuarioId}').usuario.perfis`), ['professor']);
  assert.equal(nInstrutores(), antes, 'aceitar não cria papel');
  assert.deepEqual(rodar(`Convites.concluir('${cv.id}', { nome: 'Júlia Prado Nunes', cpf: '111.111.111-11' }).erros`).map((e) => e.campo), ['cpf']);
  const menor = rodar(`Convites.concluir('${cv.id}', { nome: 'Júlia Prado Nunes', cpf: '${cpf('905113270')}', nascimento: '2012-01-01' }).erros`);
  assert.deepEqual(menor.map((e) => e.campo), ['nascimento']);
  const r = rodar(`Convites.concluir('${cv.id}', { nome: 'Júlia Prado Nunes', cpf: '${cpf('905113270')}', whatsapp: '47988881111', email: 'julia@pessoal.com' })`);
  assert.equal(r.convite.estado, 'concluido');
  const i = rodar(`Instrutores.carregar().find((x) => x.nome === 'Júlia Prado Nunes')`);
  assert.equal(rodar(`Instrutores.usuarioDe(Instrutores.carregar().find((x) => x.nome === 'Júlia Prado Nunes'))`), aceito.usuarioId);
  assert.deepEqual([i.remuneracao, i.especialidade, i.contato.email], ['pj', 'Python', 'julia@pessoal.com']);
  assert.ok(!rodar(`Convites.daLista('instrutor', 'julia').length`));
});

test('CPF que o acesso não prova é recusado de vez, sem gravar e sem revelar a pessoa', () => {
  const cv = rodar(`Convites.emitir({ nome: 'Rogério Trindade', email: 'rogerio.t@gmail.com', perfilId: 'professor', remuneracao: 'pj' }, { papel: 'instrutor' })`);
  rodar(`Convites.aceitar('${cv.id}', 'rogerio.t@gmail.com')`);
  const antes = rodar('Instrutores.carregar()');
  const cpfI5 = rodar(`Instrutores.porId(Instrutores.carregar(), 'i5').cpf`);
  const r = rodar(`Convites.concluir('${cv.id}', { nome: 'Rogério Trindade', cpf: '${cpfI5}' })`);
  assert.deepEqual(Object.keys(r), ['recusado']);
  assert.deepEqual(rodar('Instrutores.carregar()'), antes);
  assert.deepEqual(rodar(`Convites.porId('${cv.id}')`).envolvido, { papel: 'instrutor', id: 'i5' });
  assert.equal(rodar(`Convites.concluir('${cv.id}', { nome: 'Rogério Trindade', cpf: '${cpf('905113271')}' }).recusado`), true, 'a recusa é final');
});

test('a pessoa já ligada ao acesso ganha o papel e mantém a identificação', () => {
  // Elisa é colaboradora com usuário (elisa) e é convidada a dar aula pelo e-mail corporativo.
  const elisa = rodar(`Colaboradores.carregar().find((c) => c.acesso.usuarioId === 'elisa')`);
  const cv = rodar(`Convites.emitir({ nome: 'Elisa M.', email: '${elisa.contato.email}', perfilId: 'professor', remuneracao: 'folha' }, { papel: 'instrutor' })`);
  assert.equal(rodar(`Convites.aceitar('${cv.id}', '${elisa.contato.email}').convite.usuarioId`), 'elisa');
  const r = rodar(`Convites.concluir('${cv.id}', { nome: 'Outro Nome Qualquer', cpf: '${elisa.cpf}', whatsapp: '47999990000' })`);
  assert.equal(r.convite.estado, 'concluido');
  const i = rodar(`Instrutores.carregar().find((x) => x.colaboradorId === '${elisa.id}')`);
  assert.deepEqual([i.nome, i.remuneracao, i.contato.whatsapp], [elisa.nome, 'folha', '47999990000']);
});

test('o convite pela ficha liga quem já está cadastrado, ou termina como não ligado', () => {
  const cv = rodar(`Convites.emitir({ email: 'bruna.salgado@exemplo.com.br', perfilId: 'professor' }, { papel: 'instrutor', pessoaId: 'i6', nome: 'Bruna Cordeiro Salgado' })`);
  assert.ok(!rodar(`Convites.daLista('instrutor').some((c) => c.id === '${cv.id}')`), 'convite pela ficha não entra na lista');
  const fim = rodar(`Convites.aceitar('${cv.id}', 'bruna.salgado@exemplo.com.br').convite`);
  assert.equal(fim.estado, 'concluido');
  assert.equal(rodar(`Instrutores.usuarioDe(Instrutores.porId(Instrutores.carregar(), 'i6'))`), fim.usuarioId);
  // O e-mail de André já é de um acesso ligado a ele (i1): a ficha de Sílvio (i7) não liga.
  const outro = rodar(`Convites.emitir({ email: 'andre.bastos@exemplo.com.br', perfilId: 'professor' }, { papel: 'instrutor', pessoaId: 'i7', nome: 'Sílvio' })`);
  assert.equal(rodar(`Convites.aceitar('${outro.id}', 'andre.bastos@exemplo.com.br').convite.estado`), 'nao-ligado');
  assert.equal(rodar(`Instrutores.usuarioDe(Instrutores.porId(Instrutores.carregar(), 'i7'))`), null);
});

test('colaborador pelo convite nasce com matrícula, os dados da escola e o acesso', () => {
  const n = rodar('Colaboradores.carregar().length');
  const cv = rodar(`Convites.emitir({ nome: 'Tiago Moura Lins', email: 'tiago.lins@gmail.com', perfilId: 'financeiro', cargo: 'Analista financeiro', departamentoId: 'financeiro', admissao: '2026-11-03', emailCorporativo: 'tiago.lins@proway.com.br' }, { papel: 'colaborador' })`);
  const { usuarioId } = rodar(`Convites.aceitar('${cv.id}', 'tiago.lins@gmail.com').convite`);
  rodar(`Convites.concluir('${cv.id}', { nome: 'Tiago Moura Lins', cpf: '${cpf('905113272')}', nascimento: '1995-03-10', celular: '(47) 99111-2222' })`);
  const c = rodar(`Colaboradores.carregar().find((x) => x.nome === 'Tiago Moura Lins')`);
  assert.equal(rodar('Colaboradores.carregar().length'), n + 1);
  assert.deepEqual([c.cargo, c.contato.email, c.contato.celular, c.nascimento, c.acesso.usuarioId], ['Analista financeiro', 'tiago.lins@proway.com.br', '47991112222', '1995-03-10', usuarioId]);
  assert.ok(/^\d{4}$/.test(c.matricula));
});
