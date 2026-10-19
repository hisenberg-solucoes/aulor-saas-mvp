// Pessoas (colaboradores e instrutores) trazidas do protótipo original, ligadas à base única do MVP.
// Rodar: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../', import.meta.url);
const BASE = ['js/documento.js', 'js/agenda.js', 'js/planos.js', 'js/permissoes-data.js', 'js/permissoes-motor.js', 'js/aulor.js', 'js/semente.js'];
const PESSOAS = ['js/pessoas-mvp.js', 'js/colaboradores-data.js', 'js/colaboradores-motor.js', 'js/instrutores-data.js', 'js/instrutores-motor.js'];
const ler = (fs) => fs.map((f) => readFileSync(new URL(f, raiz), 'utf8')).join('\n;\n');

// As páginas carregam a base antes de Pessoas; colaboradores-data e instrutores-data já leem a escola e a data de hoje.
function contexto(hoje) {
  const armazenado = new Map();
  const ctx = vm.createContext({ console, localStorage: { getItem: (k) => armazenado.get(k) ?? null, setItem: (k, v) => armazenado.set(k, String(v)), removeItem: (k) => armazenado.delete(k) } });
  vm.runInContext(`${ler(BASE)}\n;Aulor.usar(Semente.gerar('${hoje}'), '${hoje}');\n${ler(PESSOAS)}\n;globalThis.__ = { Aulor, Instrutores, Colaboradores, Cursos, PortalProfessor, USUARIOS, Permissoes, PERFIS };`, ctx);
  const x = ctx.__;
  x.rodar = (expr) => { const v = vm.runInContext(expr, ctx); return v === undefined ? v : JSON.parse(JSON.stringify(v)); };
  return x;
}
const instrutor = (id, extra = '') => `({ ...Instrutores.porId(Instrutores.carregar(), '${id}')${extra} })`;

test('folha: sem empresa, valor hora, contrato nem bloqueio de pagamento', () => {
  const { rodar } = contexto('2026-10-19');
  const pend = rodar(`Instrutores.pendencias(${instrutor('pr5')})`);
  assert.ok(!pend.some((p) => /empresa|valor hora|PIX/.test(p)), pend.join(' · '));
  assert.deepEqual(rodar(`Instrutores.pendenciasPagamento(${instrutor('pr5')})`), []);
  assert.ok(rodar(`Instrutores.validarContrato({ tipo: 'cursos', turmaIds: ['tu5'] }, ${instrutor('pr5')})`).some((e) => /folha/.test(e.mensagem)));
  assert.deepEqual(rodar(`Instrutores.filtrar(Instrutores.carregar(), { remuneracao: 'folha' }).map((i) => i.id)`), ['pr5']);
  assert.deepEqual(rodar(`Instrutores.filtrar(Instrutores.carregar(), { situacao: 'sem-empresa' }).map((i) => i.id)`).sort(), ['pr3', 'pr6']);
});

test('RPA: troca a empresa pela conta da própria pessoa', () => {
  const { rodar } = contexto('2026-10-19');
  const semConta = instrutor('pr1', ", remuneracao: 'rpa', empresa: null");
  assert.ok(rodar(`Instrutores.pendencias(${semConta})`).includes('Sem PIX nem conta bancária'));
  const comPix = instrutor('pr1', ", remuneracao: 'rpa', empresa: null, contaPessoal: { pix: 'carlos@exemplo.com.br' }");
  assert.ok(!rodar(`Instrutores.pendencias(${comPix})`).some((p) => /empresa|PIX/.test(p)));
  assert.deepEqual(rodar(`Instrutores.pendenciasPagamento(${instrutor('pr4')})`), []);
});

test('instrutor da equipe: CPF e nascimento ficam no colaborador; CPF de colaborador não vira outro instrutor', () => {
  const { rodar } = contexto('2026-10-19');
  const sergio = rodar(instrutor('pr5'));
  assert.equal(sergio.colaboradorId, 'c5');
  assert.equal(sergio.cpf, '');
  assert.equal(rodar(`Instrutores.pessoaDe(${instrutor('pr5')}).cpf`), rodar(`Colaboradores.porId(Colaboradores.carregar(), 'c5').cpf`));
  const dados = "{ nome: 'Sérgio Albuquerque', apelido: 'Sérgio', remuneracao: 'folha' }";
  assert.deepEqual(rodar(`Instrutores.validarDados(${dados}, Instrutores.carregar(), 'pr5')`), []);
  assert.ok(rodar(`Instrutores.validarDados(${dados}, Instrutores.carregar(), 'pr1')`).some((e) => e.campo === 'cpf'));
  const cpfPaula = rodar(`Colaboradores.porId(Colaboradores.carregar(), 'c2').cpf`);
  const erros = rodar(`Instrutores.validarDados({ nome: 'Paula Ribeiro', apelido: 'Paula', nascimento: '1990-02-27', cpf: '${cpfPaula}', rg: '1' }, Instrutores.carregar())`);
  assert.ok(erros.some((e) => e.campo === 'cpf' && /Paula Ribeiro/.test(e.mensagem)));
  // Com contrato ativo não passa para folha.
  assert.ok(rodar(`Instrutores.validarDados({ nome: 'Carlos Mendes', apelido: 'Carlos', remuneracao: 'folha' }, Instrutores.carregar(), 'pr1')`).some((e) => e.campo === 'remuneracao'));
});

test('colaborador ganha o papel de instrutor uma vez só, com id do MVP', () => {
  const { rodar } = contexto('2026-10-19');
  const r = rodar(`(() => {
    const c = Colaboradores.porId(Colaboradores.carregar(), 'c4');
    const a = Instrutores.incluirDeColaborador(Instrutores.carregar(), c, { remuneracao: 'folha' });
    const b = Instrutores.incluirDeColaborador(a.lista, c, { remuneracao: 'pj' });
    return { novo: a.instrutor, total: [a.lista.length, b.lista.length], mesmo: a.instrutor.id === b.instrutor.id };
  })()`);
  assert.equal(r.novo.colaboradorId, 'c4');
  assert.match(r.novo.id, /^pr\d+$/);
  assert.equal(r.total[0], r.total[1]);
  assert.ok(r.mesmo);
});

test('instrutor é o professor da base única: turmas, calendário e gravação', () => {
  const { rodar, Aulor } = contexto('2026-10-19');
  assert.deepEqual(rodar(`Instrutores.turmasDoInstrutor('pr1').map((t) => t.id)`).sort(), ['tu1', 'tu2', 'tu7', 'tu8']);
  assert.ok(rodar(`Instrutores.cursosHabilitados('pr1').map((c) => c.id)`).includes('cu1'));
  const linha = rodar(`PortalProfessor.turmas('pr4')[0]`);
  assert.equal(linha.turma.id, 'tu4');
  assert.ok(linha.aulas.length > 0 && linha.alunos.length > 0);
  rodar(`Instrutores.salvar(Instrutores.atualizarDados(Instrutores.carregar(), 'pr1', { ...Instrutores.porId(Instrutores.carregar(), 'pr1'), apelido: 'Carlão' }))`);
  assert.equal(Aulor.professor('pr1').apelido, 'Carlão');
  assert.equal(Aulor.turma('tu1').professorId, 'pr1');
});

for (const hoje of ['2026-10-19', '2027-01-03', '2026-03-31']) {
  test(`semente de Pessoas coerente em ${hoje}`, () => {
    const { rodar, Aulor } = contexto(hoje);
    const lista = rodar('Instrutores.carregar()');
    assert.deepEqual(lista.map((i) => i.id), ['pr1', 'pr2', 'pr3', 'pr4', 'pr5', 'pr6']);
    lista.forEach((i) => {
      i.contratos.forEach((c) => {
        c.itens.forEach((it) => assert.ok(Aulor.turma(it.turmaId), `${c.codigo}: turma ${it.turmaId}`));
        [c.criadoEm, c.documento?.geradoEm, c.clicksign?.enviadoEm, c.clicksign?.instrutorAssinouEm, c.clicksign?.escolaAssinouEm].filter(Boolean)
          .forEach((d) => assert.ok(d <= hoje, `${c.codigo}: data no futuro (${d})`));
      });
      i.pagamentos.forEach((p) => { if (p.pagoEm) assert.ok(p.pagoEm <= hoje, 'pagamento no futuro'); });
      i.antecedentes.forEach((a) => assert.ok(a.enviadoEm <= hoje, 'antecedentes no futuro'));
    });
    const carlos = lista[0];
    assert.deepEqual(carlos.pagamentos.map((p) => rodar(`Instrutores.statusPagamento(${JSON.stringify(p)})`)), ['pago', 'liberado', 'aguardando_nf']);
    assert.ok(rodar(`Instrutores.pendencias(${instrutor('pr2')})`).some((p) => /antecedentes/.test(p)));
    assert.ok(rodar(`Instrutores.aguardandoCadastro(${instrutor('pr6')})`));
    // Número dos contratos não repete no ano.
    const codigos = lista.flatMap((i) => i.contratos.map((c) => c.codigo));
    assert.equal(new Set(codigos).size, codigos.length);
    // Colaboradores: matrícula e CPF únicos e válidos; quem tem usuário aponta para um que existe.
    const equipe = rodar('Colaboradores.carregar()');
    assert.equal(new Set(equipe.map((c) => c.cpf)).size, equipe.length);
    equipe.forEach((c) => assert.ok(rodar(`Colaboradores.cpfValido('${c.cpf}')`), c.nome));
    equipe.filter((c) => c.acesso.usuarioId).forEach((c) => assert.ok(rodar(`USUARIOS.some((u) => u.id === '${c.acesso.usuarioId}' && u.vinculos.some((v) => v.tipo === 'colaborador' && v.id === '${c.id}'))`), c.nome));
  });
}

test('pagamento do instrutor é a conta a pagar: programar abre, pagar baixa, remover cancela', () => {
  const { rodar, Aulor } = contexto('2026-10-19');
  const contas = (pgId) => Aulor.lancamentos().filter((l) => l.pagamentoInstrutorId === pgId);
  // Semente: cada pagamento programado tem uma conta só, no mesmo estado; sem "Aulas de" à parte.
  rodar('Instrutores.carregar()').flatMap((i) => i.pagamentos).forEach((p) => {
    const [l, ...resto] = contas(p.id);
    assert.equal(resto.length, 0, p.id);
    assert.equal(l.status, p.pagoEm ? 'pago' : 'aberto', p.id);
    assert.equal(l.valor, p.valor);
  });
  assert.ok(!Aulor.lancamentos().some((l) => /^Aulas de /.test(l.descricao)));
  // Beatriz (RPA): parcial de tu4 com 25% do item.
  const pg = rodar(`(() => {
    const i = Instrutores.porId(Instrutores.carregar(), 'pr4'); const c = i.contratos[0]; const it = c.itens[0];
    const r = Instrutores.incluirPagamento(Instrutores.carregar(), 'pr4', c.id, { tipo: 'parcial', itemId: it.id, valor: String(it.total / 4), previsto: '2026-11-10', descricao: 'Segunda parte' });
    Instrutores.salvar(r.lista);
    return r.pagamento;
  })()`);
  let [l] = contas(pg.id);
  assert.deepEqual([l.status, l.categoria, l.fornecedor, l.vencimento, l.valor], ['aberto', 'Professores', 'Beatriz Nogueira', '2026-11-10', pg.valor]);
  assert.equal(contas(pg.id).length, 1);
  rodar(`Instrutores.salvar(Instrutores.registrarNf(Instrutores.carregar(), 'pr4', '${pg.id}', { numero: 'RPA-0050', emitidaEm: '2026-10-19' }))`);
  rodar(`Instrutores.salvar(Instrutores.registrarPagamento(Instrutores.carregar(), 'pr4', '${pg.id}', '2026-10-19'))`);
  [l] = contas(pg.id);
  assert.deepEqual([l.status, l.pagoEm, l.valorPago, l.forma], ['pago', '2026-10-19', pg.valor, 'pix']);
  assert.equal(contas(pg.id).length, 1, 'pagar não cria outra conta');
  assert.ok(Aulor.resumoMes('2026-10').pago >= pg.valor);
  // Carlos (PJ): conta em nome da empresa; remover a programação cancela.
  const pg3 = 'pg-pr1-3';
  assert.equal(contas(pg3)[0].fornecedor, 'C. Mendes Treinamentos ME');
  rodar(`Instrutores.salvar(Instrutores.removerPagamento(Instrutores.carregar(), 'pr1', '${pg3}'))`);
  assert.deepEqual(Array.from(contas(pg3), (x) => x.status), ['cancelado']);
});

test('acesso do colaborador: criar, vincular e desvincular mantém os vínculos do usuário', () => {
  const { rodar } = contexto('2026-10-19');
  const u = rodar(`(() => {
    const novo = Colaboradores.Acesso.criar('Bianca Lopes', ['secretaria']);
    Colaboradores.salvar(Colaboradores.vincularUsuario(Colaboradores.carregar(), 'c8', novo.id));
    return USUARIOS.find((x) => x.id === novo.id);
  })()`);
  assert.match(u.id, /^u\d+$/);
  assert.deepEqual(u.vinculos, [{ tipo: 'colaborador', id: 'c8' }]);
  assert.equal(u.email, 'bianca.lopes@escolaatlas.com.br');
  assert.equal(u.status, 'ativo');
  // Desvincular tira o vínculo; o perfil fica (como no original).
  const u1 = rodar(`(() => { Colaboradores.salvar(Colaboradores.vincularUsuario(Colaboradores.carregar(), 'c1', null)); return USUARIOS.find((x) => x.id === 'u1'); })()`);
  assert.deepEqual(u1.vinculos, []);
  assert.deepEqual(u1.perfis, ['administrador']);
  // Sérgio é instrutor e colaborador com um usuário só.
  assert.deepEqual(rodar(`USUARIOS.find((x) => x.id === 'u9').vinculos.map((v) => v.tipo)`).sort(), ['colaborador', 'instrutor']);
});

test('convidado completa o cadastro pelo link e o token não vale de novo', () => {
  const { rodar, Aulor } = contexto('2026-10-19');
  const token = rodar(`Instrutores.porId(Instrutores.carregar(), 'pr6').cadastro.token`);
  const d = `({
    nome: 'Henrique Bastos', apelido: 'Henrique', nascimento: '1993-06-18', cpf: '52998224725', rg: '12.345.678-9', especialidade: 'Marketing digital', bio: '',
    contato: { email: 'henrique.bastos@exemplo.com.br', whatsapp: '43991234506', emergenciaNome: 'Ana Bastos', emergenciaTelefone: '43991230000' },
    endereco: { cep: '86020-000', logradouro: 'Rua Piauí', numero: '100', complemento: '', bairro: 'Centro', cidade: 'Londrina', uf: 'PR' },
    empresa: { cnpj: '11222333000181', razaoSocial: 'H. Bastos Marketing ME', banco: 'Sicredi', agencia: '0730', conta: '1234-5', pix: '' },
    antecedentes: { arquivo: 'antecedentes.pdf' }, aceite: true, aceiteDados: true,
  })`;
  assert.deepEqual(rodar(`Instrutores.validarPreenchimento(${d}, Instrutores.carregar(), 'pr6')`), []);
  rodar(`Instrutores.salvar(Instrutores.preencherPeloInstrutor(Instrutores.carregar(), '${token}', ${d}))`);
  const h = Aulor.professor('pr6');
  assert.ok(h.cadastro.preenchidoEm);
  assert.equal(h.empresa.razaoSocial, 'H. Bastos Marketing ME');
  assert.ok(h.lgpd && h.antecedentes.some((a) => a.ano === 2026));
  assert.ok(!rodar(`Instrutores.aguardandoCadastro(${instrutor('pr6')})`));
});
