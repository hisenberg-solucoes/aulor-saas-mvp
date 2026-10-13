// Regras do motor e coerência da semente. Rodar: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../', import.meta.url);
const ARQUIVOS = ['js/documento.js', 'js/agenda.js', 'js/planos.js', 'js/permissoes-data.js', 'js/permissoes-motor.js', 'js/aulor.js', 'js/semente.js'];

function contexto(hoje) {
  const armazenado = new Map();
  const ctx = vm.createContext({
    console,
    localStorage: { getItem: (k) => armazenado.get(k) ?? null, setItem: (k, v) => armazenado.set(k, String(v)), removeItem: (k) => armazenado.delete(k) },
  });
  const codigo = ARQUIVOS.map((f) => readFileSync(new URL(f, raiz), 'utf8')).join('\n;\n');
  vm.runInContext(`${codigo}\n;globalThis.__ = { Aulor, Semente, Planos, Permissoes, PERFIS, USUARIOS };`, ctx);
  const { Aulor, Semente } = ctx.__;
  Aulor.usar(Semente.gerar(hoje), hoje);
  return ctx.__;
}

const soma = (xs) => Math.round(xs.reduce((s, x) => s + x, 0) * 100) / 100;

test('parcelas: centavos na 1ª e vencimento limitado ao fim do mês', () => {
  const { Aulor } = contexto('2026-10-09');
  const p = Aulor.gerarParcelas(1000, 3, '2026-01-31');
  assert.deepEqual(Array.from(p, (x) => x.valor), [333.34, 333.33, 333.33]);
  assert.deepEqual(Array.from(p, (x) => x.vencimento), ['2026-01-31', '2026-02-28', '2026-03-31']);
});

for (const hoje of ['2026-10-09', '2026-10-11', '2026-10-12', '2027-01-02', '2026-03-31']) {
  test(`semente coerente em ${hoje}`, () => {
    const { Aulor } = contexto(hoje);
    Aulor.matriculas().forEach((m) => {
      const parcelas = Aulor.parcelasDaMatricula(m.id);
      assert.equal(soma(parcelas.map((l) => l.valor)), m.valorFinal, `parcelas de ${m.codigo}`);
      if (m.status === 'cancelada') assert.ok(parcelas.every((l) => l.status !== 'aberto'), 'cancelada sem parcela em aberto');
      parcelas.filter((l) => l.status === 'pago').forEach((l) => assert.ok(l.pagoEm <= hoje, 'pagamento no futuro'));
    });
    Aulor.turmas().forEach((t) => assert.ok(Aulor.ocupacao(t).ocupadas <= t.capacidade, `${t.codigo} acima da capacidade`));
    assert.equal(Aulor.situacaoTurma(Aulor.turma('tu2')), 'a_concluir');
    assert.equal(Aulor.situacaoTurma(Aulor.turma('tu6')), 'planejada');
    assert.equal(Aulor.chamadasPendentes().length, 1);
    assert.ok(Aulor.inadimplentes().length >= 4);
    assert.ok(Aulor.alunosEmRisco().length >= 1);
    const t1 = Aulor.matriculasDaTurma('tu1');
    assert.equal(Aulor.certificados().length, t1.filter((m) => m.resultado === 'aprovado').length);
    assert.ok(t1.some((m) => m.resultado === 'reprovado_frequencia'));
    const r = Aulor.resumoMes(hoje.slice(0, 7));
    assert.ok(r.receberPrevisto > 0 && r.pagarPrevisto > 0);
    assert.ok(new Set(Aulor.alunos().map((a) => a.cpf)).size === Aulor.alunos().length, 'CPFs únicos');
  });
}

test('matrícula gera parcelas no financeiro e entra na lista da turma', () => {
  const { Aulor } = contexto('2026-10-09');
  const { aluno } = Aulor.criarAluno({ nome: 'Teste Silva', cpf: '529.982.247-25', telefone: '43999990000' });
  const antes = Aulor.ocupacao(Aulor.turma('tu6')).ocupadas;
  const r = Aulor.matricular({ alunoId: aluno.id, turmaId: 'tu6', valorCurso: 1790, descontoTipo: 'percentual', desconto: '10', parcelas: 5, primeiroVencimento: '2026-11-10', formaPagamento: 'boleto' }, 'Paula');
  assert.ok(!r.erros, JSON.stringify(r.erros));
  const parcelas = Aulor.parcelasDaMatricula(r.matricula.id);
  assert.equal(parcelas.length, 5);
  assert.equal(soma(parcelas.map((l) => l.valor)), 1611);
  assert.ok(parcelas.every((l) => l.tipo === 'receber' && l.alunoId === aluno.id));
  assert.equal(Aulor.ocupacao(Aulor.turma('tu6')).ocupadas, antes + 1);
  assert.ok(Aulor.matriculasDaTurma('tu6').some((m) => m.id === r.matricula.id));
  // Recebimento muda o status em todas as telas que leem o mesmo lançamento.
  const b = Aulor.registrarBaixa(parcelas[0].id, { data: '2026-10-09', valor: parcelas[0].valor, forma: 'pix' }, 'Renato');
  assert.ok(!b.erros);
  assert.equal(Aulor.situacaoLancamento(Aulor.lancamento(parcelas[0].id)), 'pago');
  // Duplicidade e desconto acima do limite são barrados.
  assert.equal(Aulor.matricular({ alunoId: aluno.id, turmaId: 'tu6', valorCurso: 1790, parcelas: 1, primeiroVencimento: '2026-11-10', formaPagamento: 'pix' }).erros[0].campo, 'turmaId');
  const outro = Aulor.criarAluno({ nome: 'Outra Pessoa', cpf: '111.444.777-35', telefone: '43999990001' }).aluno;
  assert.equal(Aulor.matricular({ alunoId: outro.id, turmaId: 'tu6', valorCurso: 1790, descontoTipo: 'percentual', desconto: '50', parcelas: 1, primeiroVencimento: '2026-11-10', formaPagamento: 'pix' }).erros[0].campo, 'desconto');
  // Cancelar a matrícula cancela só o que está em aberto.
  const c = Aulor.cancelarMatricula(r.matricula.id, 'Desistiu', 'Paula');
  assert.equal(c.canceladas, 4);
  assert.equal(Aulor.situacaoLancamento(Aulor.lancamento(parcelas[0].id)), 'pago');
});

test('chamada, conclusão e certificado respeitam a frequência mínima', () => {
  const { Aulor } = contexto('2026-10-09');
  const futura = Aulor.aulasDaTurma('tu3').find((a) => a.data > '2026-10-09');
  assert.ok(Aulor.registrarChamada(futura.id, { presencas: {} }).erros);
  const pendente = Aulor.chamadasPendentes()[0];
  const presencas = Object.fromEntries(Aulor.participantes(pendente).map((m) => [m.id, 'P']));
  assert.ok(Aulor.registrarChamada(pendente.id, { presencas: {} }).erros, 'exige todos marcados');
  assert.ok(!Aulor.registrarChamada(pendente.id, { presencas, conteudo: 'Revisão' }, 'Sérgio').erros);
  assert.equal(Aulor.chamadasPendentes().length, 0);

  assert.ok(Aulor.concluirTurma('tu3').erros, 'turma com aulas futuras não conclui');
  const previa = Aulor.previaConclusao('tu2');
  const r = Aulor.concluirTurma('tu2', 'Camila');
  assert.ok(!r.erros, JSON.stringify(r.erros));
  assert.ok(r.reprovados >= 1 && r.aprovados >= 1);
  const reprovado = previa.alunos.find((x) => x.resultado === 'reprovado_frequencia').m;
  const aprovado = previa.alunos.find((x) => x.resultado === 'aprovado').m;
  assert.equal(Aulor.elegibilidade(reprovado).id, 'bloqueado');
  assert.ok(Aulor.emitirCertificado(reprovado.id).erros);
  assert.equal(Aulor.elegibilidade(aprovado).id, 'elegivel');
  const { certificado } = Aulor.emitirCertificado(aprovado.id, 'Paula');
  assert.match(certificado.codigo, /^ATL-\d{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
  assert.equal(Aulor.certificadoPorCodigo(certificado.codigo.toLowerCase()).id, certificado.id);
  assert.equal(Aulor.elegibilidade(aprovado).id, 'emitido');
  assert.ok(Aulor.emitirCertificado(aprovado.id).erros, 'não emite duas vezes');

  // Configuração de bloqueio por inadimplência vale na emissão.
  Aulor.config().financeiro.bloquearCertificadoInadimplente = true;
  const devedor = Aulor.matriculasDaTurma('tu2').find((m) => m.resultado === 'aprovado' && !Aulor.certificadoDaMatricula(m.id) && Aulor.parcelasDaMatricula(m.id).some((l) => Aulor.situacaoLancamento(l) === 'vencido'));
  if (devedor) assert.equal(Aulor.elegibilidade(devedor).id, 'bloqueado');
});

test('modelos de certificado: padrão, escolha do curso e cópia na emissão', () => {
  const { Aulor } = contexto('2026-10-09');
  const padrao = Aulor.modeloPadrao();
  assert.equal(Aulor.modelosCertificado().filter((m) => m.padrao).length, 1);
  assert.equal(Aulor.modeloDoCurso(Aulor.curso('cu1')).id, padrao.id, 'sem escolha usa o padrão');
  assert.equal(Aulor.modeloDoCurso(Aulor.curso('cu3')).id, 'mc2');
  Aulor.certificados().forEach((c) => assert.ok(c.modelo?.aparencia, 'emitido da semente guarda o modelo'));

  // Novo nasce rascunho: o curso que o escolher continua no padrão até ativar.
  const { modelo } = Aulor.criarModelo({ nome: 'Noturno', copiarDe: 'mc2' });
  assert.equal(modelo.status, 'rascunho');
  assert.ok(Aulor.criarModelo({ nome: ' noturno ' }).erros, 'nome repetido');
  Aulor.curso('cu1').modeloCertificadoId = modelo.id;
  assert.equal(Aulor.modeloDoCurso(Aulor.curso('cu1')).id, padrao.id);
  assert.ok(Aulor.definirModeloPadrao(modelo.id).erros, 'rascunho não vira padrão');
  assert.ok(!Aulor.atualizarDadosModelo(modelo.id, { nome: 'Noturno', status: 'ativo' }).erros);
  assert.equal(Aulor.modeloDoCurso(Aulor.curso('cu1')).id, modelo.id);

  const invalido = { ...modelo, frente: { ...modelo.frente, corpo: 'concluiu {{cursoo}}' } };
  assert.equal(Aulor.salvarConteudoModelo(modelo.id, invalido).erros[0].campo, 'frente.corpo');
  assert.ok(Aulor.salvarConteudoModelo(modelo.id, { ...modelo, aparencia: { ...modelo.aparencia, moldura: 'xadrez' } }).erros);

  // Emitido guarda a cópia: editar o modelo depois não muda o certificado.
  Aulor.chamadasPendentes().forEach((a) => Aulor.registrarChamada(a.id, { presencas: Object.fromEntries(Aulor.participantes(a).map((x) => [x.id, 'P'])) }));
  assert.ok(!Aulor.concluirTurma('tu2', 'Camila').erros);
  const m = Aulor.matriculasDaTurma('tu2').find((x) => Aulor.elegibilidade(x).id === 'elegivel');
  Aulor.curso(Aulor.turma('tu2').cursoId).modeloCertificadoId = modelo.id;
  const { certificado } = Aulor.emitirCertificado(m.id, 'Paula');
  assert.equal(certificado.modelo.id, modelo.id);
  Aulor.salvarConteudoModelo(modelo.id, { ...modelo, frente: { ...modelo.frente, titulo: 'Outro título' } });
  assert.notEqual(certificado.modelo.frente.titulo, 'Outro título');
  assert.equal(Aulor.emitidosComModelo(modelo.id).length, 1);

  assert.ok(Aulor.excluirModelo(padrao.id).erros, 'padrão não se exclui');
  assert.ok(!Aulor.definirModeloPadrao(modelo.id).erros);
  assert.ok(!Aulor.excluirModelo('mc2').erros);
  assert.equal(Aulor.curso('cu3').modeloCertificadoId, null, 'curso volta para o padrão');
  assert.equal(Aulor.duplicarModelo(modelo.id).modelo.nome, 'Noturno (cópia)');
});

test('turma nova gera aulas até a carga horária do curso', () => {
  const { Aulor } = contexto('2026-10-09');
  const r = Aulor.criarTurma({ cursoId: 'cu1', professorId: 'pr1', capacidade: 10, inicio: '2026-11-03', local: 'Sala 1', agenda: { formato: 'presencial', recorrencia: 'semanal', periodos: [{ dias: ['ter', 'qui'], inicio: '19:00', fim: '21:00' }] } });
  assert.ok(!r.erros, JSON.stringify(r.erros));
  const aulas = Aulor.aulasDaTurma(r.turma.id);
  assert.equal(aulas.length, 12); // 24 h ÷ 2 h
  assert.equal(r.turma.fim, aulas[11].data);
  assert.match(r.turma.codigo, /^EXC-2026-\d$/);
  assert.equal(r.turma.minimoAlunos, null);
  const agenda = r.turma.agenda;
  const erro = Aulor.criarTurma({ cursoId: 'cu1', professorId: 'pr1', capacidade: 10, minimoAlunos: '11', inicio: '2026-11-03', agenda });
  assert.equal(erro.erros?.[0]?.campo, 'minimoAlunos');
});

test('plano institucional: faixas graduadas e condição especial por cliente', () => {
  const { Planos } = contexto('2026-10-09');
  const inst = { planoId: 'institucional', condicoes: {} };
  assert.equal(Planos.estimar(inst, 250).mensal, 2500);
  assert.equal(Planos.estimar(inst, 400).mensal, 2500 + 100 * 6);
  assert.equal(Planos.estimar(inst, 600).mensal, 2500 + 200 * 6 + 100 * 5);
  assert.equal(Planos.estimar(inst, 1200).foraDasFaixas, true);
  assert.equal(Planos.estimar({ planoId: 'institucional', condicoes: { alunosIncluidos: 500 } }, 500).mensal, 2500);
  assert.equal(Planos.estimar({ planoId: 'gestao' }, 200), null, 'sem preço definido não inventa número');
  assert.equal(Planos.tem({ planoId: 'essencial' }, 'pagar'), false);
  assert.equal(Planos.tem({ planoId: 'gestao' }, 'pagar'), true);
});

test('permissões: perfis padrão e administrador protegido', () => {
  const { Permissoes, USUARIOS, PERFIS } = contexto('2026-10-09');
  const u = (id) => USUARIOS.find((x) => x.id === id);
  assert.ok(Permissoes.pode(u('u2'), 'matriculas', 'criar'));
  assert.ok(!Permissoes.pode(u('u2'), 'pagar', 'visualizar'));
  assert.ok(Permissoes.pode(u('u4'), 'matriculas', 'criar'), 'permissão adicional');
  assert.ok(Permissoes.pode(u('u5'), 'minhas-aulas', 'registrar'));
  assert.ok(!Permissoes.pode(u('u5'), 'alunos', 'visualizar'));
  assert.ok(Permissoes.pode(u('u1'), 'configuracoes', 'editar'));
  assert.equal(Permissoes.alternarPermissao('administrador', 'painel', 'visualizar'), false);
  Permissoes.excluirPerfil('administrador');
  assert.ok(PERFIS.some((p) => p.id === 'administrador'));
});

test('turmas em risco: mínimo da turma ou metade das vagas, nível pelo prazo', () => {
  const { Aulor } = contexto('2026-10-10');
  const porId = Object.fromEntries(Array.from(Aulor.turmasEmRisco(), (r) => [r.turma.id, r]));
  assert.equal(porId.tu6.nivel, 'critico'); // começa em ≤ 15 dias, 8 de 10 (metade de 20 vagas)
  assert.equal(porId.tu6.minimo, 10);
  assert.equal(porId.tu9.nivel, 'alerta'); // ≤ 45 dias, mínimo próprio de 12
  assert.equal(porId.tu9.faltam, 12 - porId.tu9.ocupadas);
  assert.equal(porId.tu3, undefined, 'turma em andamento não entra');
  // Atingiu o mínimo: sai da lista.
  const t = Aulor.turma('tu9');
  t.minimoAlunos = porId.tu9.ocupadas;
  assert.equal(Aulor.riscoTurma(t), null);
  // Longe do início, só entra com menos de 30% das vagas.
  t.minimoAlunos = 12;
  t.inicio = Aulor.somarDias(Aulor.hoje(), 60);
  assert.equal(Aulor.riscoTurma(t).nivel, 'atencao');
  t.capacidade = 12;
  assert.equal(Aulor.riscoTurma(t), null, '4 de 12 vagas = 33%');
});

test('aluno: responsáveis com papéis, endereço e quem paga', () => {
  const { Aulor } = contexto('2026-10-10');
  const base = { nome: 'Teo Lima', cpf: '529.982.247-25', telefone: '43999990000', nascimento: '2011-05-02' };
  assert.equal(Aulor.criarAluno(base).erros?.[0]?.campo, 'respNome', 'menor sem responsável');
  const { aluno: a } = Aulor.criarAluno({ ...base, respNome: 'Rita Lima', respTelefone: '43988880000', respParentesco: 'Mãe' });
  assert.deepEqual(Array.from(a.responsaveis[0].papeis), ['legal', 'financeiro']);
  assert.equal(a.cobranca.pagador, 'responsavel');
  assert.equal(Aulor.contatoCobranca(a).nome, 'Rita Lima');
  // Novo financeiro tira o papel de quem tinha.
  Aulor.salvarResponsavel(a.id, { nome: 'Caio Lima', telefone: '43977770000', papel_financeiro: '1' });
  assert.equal(Aulor.responsavelFinanceiro(a).nome, 'Caio Lima');
  assert.deepEqual(Array.from(a.responsaveis[0].papeis), ['legal']);
  // Único responsável legal de um menor não sai.
  assert.ok(Aulor.removerResponsavel(a.id, 'r1').erro);
  // Quem paga as matrículas também não sai enquanto for ele quem paga.
  assert.ok(Aulor.removerResponsavel(a.id, 'r2').erro);
  assert.equal(Aulor.atualizarEnderecoPagamento(a.id, { pagador: 'aluno', diaVencimento: '30' }).erros?.[0]?.campo, 'diaVencimento');
  assert.ok(!Aulor.atualizarEnderecoPagamento(a.id, { pagador: 'aluno', cep: '86010-190', cidade: 'Londrina', uf: 'pr', diaVencimento: '15' }).erros);
  assert.equal(a.endereco.uf, 'PR');
  assert.equal(Aulor.contatoCobranca(a), a);
  assert.ok(!Aulor.removerResponsavel(a.id, 'r2').erro);
});

test('semente: todo menor tem responsável legal e o modelo antigo sumiu', () => {
  const { Aulor } = contexto('2026-10-10');
  Aulor.alunos().forEach((a) => {
    assert.equal(a.responsavel, undefined);
    assert.ok(Array.isArray(a.responsaveis) && a.endereco && a.cobranca, a.nome);
    if (Aulor.ehMenor(a)) assert.ok(a.responsaveis.some((r) => r.papeis.includes('legal')), `${a.nome} sem responsável legal`);
    assert.ok(a.responsaveis.filter((r) => r.papeis.includes('financeiro')).length <= 1);
    if (a.cobranca.pagador === 'responsavel') assert.ok(Aulor.responsavelFinanceiro(a));
  });
});
