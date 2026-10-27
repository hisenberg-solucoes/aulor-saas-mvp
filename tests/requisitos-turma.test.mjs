// Requisitos de software/máquina por turma (docs/turmas.md RN10) e as sugestões que o
// instrutor manda para o catálogo do curso (docs/cursos.md RN9). Só motor, sem DOM.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function carregarMotores() {
  const guardado = {};
  const contexto = vm.createContext({
    console,
    localStorage: {
      getItem: (k) => guardado[k] ?? null,
      setItem: (k, v) => { guardado[k] = String(v); },
      removeItem: (k) => { delete guardado[k]; },
    },
  });
  ['js/agenda.js', 'js/softwares-data.js', 'js/cursos-data.js', 'js/cursos-motor.js', 'js/turmas-motor.js']
    .forEach((f) => vm.runInContext(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'), contexto, { filename: f }));
  return (expressao) => JSON.parse(vm.runInContext(`JSON.stringify((() => { ${expressao} })())`, contexto));
}

const rodar = carregarMotores();

// A turma da semente que ninguém tocou mostra a lista do curso (herdada, sem cópia gravada).
const herdada = rodar(`
  const t = Turmas.porId(Turmas.carregar(), 'sup10-css');
  const r = Turmas.requisitos(t, Cursos.porId(Cursos.carregar(), 'css'));
  return { gravado: t.requisitos, herdado: r.herdado, nomes: r.softwares.map((s) => s.nome) };
`);
assert.equal(herdada.gravado, null);
assert.equal(herdada.herdado, true);
assert.deepEqual(herdada.nomes, ['Git', 'Google Chrome', 'Node.js LTS', 'VS Code']);

// A primeira mexida materializa a cópia da turma (e não toca no curso).
const ajustada = rodar(`
  const cursos = Cursos.carregar();
  const curso = Cursos.porId(cursos, 'css');
  const lista = Turmas.adicionarSoftwaresRequisitos(Turmas.carregar(), 'sup10-css', ['figma'], { curso, autor: 'Coordenação' });
  const r = Turmas.requisitos(Turmas.porId(lista, 'sup10-css'), curso);
  const cmp = Turmas.comparacaoRequisitos(Turmas.porId(lista, 'sup10-css'), curso);
  return {
    herdado: r.herdado, por: r.atualizadoPor,
    soNaTurma: r.softwares.filter((s) => s.origem === 'turma').map((s) => s.nome),
    extras: cmp.extras.map((s) => s.nome), faltando: cmp.faltando.map((s) => s.nome),
    cursoIntacto: curso.infraestrutura.softwares.map((s) => s.nome),
  };
`);
assert.equal(ajustada.herdado, false);
assert.equal(ajustada.por, 'Coordenação');
assert.deepEqual(ajustada.soNaTurma, ['Figma Desktop']);
assert.deepEqual(ajustada.extras, ['Figma Desktop']);
assert.deepEqual(ajustada.faltando, []);
assert.equal(ajustada.cursoIntacto.includes('Figma Desktop'), false);

// Turma nova nasce com a cópia do curso; "voltar ao do curso" descarta os ajustes.
const nascimento = rodar(`
  const turmas = Turmas.carregar();
  const curso = Cursos.porId(Cursos.carregar(), 'jvo');
  const { turma, lista } = Turmas.incluir(turmas, { cursoId: 'jvo', formacaoId: null, codigo: 'JVO T', agenda: Agenda.vazia(), inicio: '2026-10-01', fim: '2026-10-20', vagas: 10 });
  const comExtra = Turmas.adicionarSoftwareLivreRequisito(lista, turma.id, { nome: 'Godot 4.3', observacao: '' }, { curso, autor: 'Otávio' });
  const voltou = Turmas.recarregarRequisitosDoCurso(comExtra, turma.id, curso, 'Coordenação');
  return {
    aoNascer: turma.requisitos.softwares.map((s) => s.nome), maquina: turma.requisitos.requisitosMaquina,
    origens: [...new Set(turma.requisitos.softwares.map((s) => s.origem))],
    comExtra: Turmas.requisitos(Turmas.porId(comExtra, turma.id), curso).softwares.map((s) => s.nome),
    depoisDeVoltar: Turmas.requisitos(Turmas.porId(voltou, turma.id), curso).softwares.map((s) => s.nome),
  };
`);
assert.deepEqual(nascimento.aoNascer, ['IntelliJ IDEA Community', 'JDK (Temurin)', 'Git', 'DBeaver Community', 'PostgreSQL']);
assert.equal(nascimento.maquina, '16 GB de RAM.');
assert.deepEqual(nascimento.origens, ['curso']);
assert.equal(nascimento.comExtra.includes('Godot 4.3'), true);
assert.equal(nascimento.depoisDeVoltar.includes('Godot 4.3'), false);

// Editar a turma (drawer) não pode apagar os requisitos já gravados.
const aposEditar = rodar(`
  const t = Turmas.porId(Turmas.carregar(), 'sup09-pya');
  const lista = Turmas.atualizar(Turmas.carregar(), t.id, { ...t, vagas: 12 });
  return Turmas.porId(lista, t.id).requisitos.softwares.map((s) => s.nome);
`);
assert.equal(aposEditar.includes('Jupyter (notebook)'), true);

// Sugestão do instrutor: aceitar aplica no catálogo do curso; recusar guarda o motivo.
const sugestoes = rodar(`
  const cursos = Cursos.carregar();
  const comSugestao = Cursos.sugerirRequisito(cursos, 'css', { tipo: 'incluir', softwareId: 'figma', nome: 'Figma Desktop', turmaId: 'sup10-css', turmaCodigo: 'CSS N', instrutorId: 'i1', instrutorNome: 'André', em: '2026-09-03T10:00' });
  const nova = Cursos.sugestoesPendentes(Cursos.porId(comSugestao, 'css'))[0];
  const aceita = Cursos.aceitarSugestao(comSugestao, 'css', nova.id, 'Coordenação');
  const recusada = Cursos.recusarSugestao(comSugestao, 'css', nova.id, 'Coordenação', 'Só nesta turma.');
  const jvoRemover = Cursos.aceitarSugestao(cursos, 'jvo', 'sg1', 'Coordenação');
  return {
    texto: Cursos.textoSugestao(nova),
    aceitaNoCurso: Cursos.porId(aceita, 'css').infraestrutura.softwares.map((s) => s.nome),
    statusAceita: Cursos.sugestoesRequisitos(Cursos.porId(aceita, 'css'))[0].status,
    recusada: Cursos.sugestoesRequisitos(Cursos.porId(recusada, 'css'))[0],
    naoAplicouRecusada: Cursos.porId(recusada, 'css').infraestrutura.softwares.map((s) => s.nome),
    jvoDepois: Cursos.porId(jvoRemover, 'jvo').infraestrutura.softwares.map((s) => s.nome),
  };
`);
assert.equal(sugestoes.texto, 'Incluir "Figma Desktop" nos softwares do curso');
assert.equal(sugestoes.aceitaNoCurso.includes('Figma Desktop'), true);
assert.equal(sugestoes.statusAceita, 'aceita');
assert.equal(sugestoes.recusada.status, 'recusada');
assert.equal(sugestoes.recusada.motivo, 'Só nesta turma.');
assert.equal(sugestoes.naoAplicouRecusada.includes('Figma Desktop'), false);
assert.equal(sugestoes.jvoDepois.includes('PostgreSQL'), false);

// Software fora do catálogo guarda o site de onde baixar (o do catálogo usa o do próprio catálogo).
const site = rodar(`
  const curso = Cursos.porId(Cursos.carregar(), 'css');
  const t = Turmas.porId(Turmas.carregar(), 'sup10-css');
  const lista = Turmas.adicionarSoftwareLivreRequisito(Turmas.carregar(), t.id, { nome: 'Godot 4.3', observacao: 'portable', site: 'https://godotengine.org/download' }, { curso, autor: 'Coordenação' });
  const item = Turmas.requisitos(Turmas.porId(lista, t.id), curso).softwares.find((s) => s.nome === 'Godot 4.3');
  const trocado = Turmas.atualizarObservacaoRequisito(lista, t.id, Turmas.chaveSoftware(item), 'portable', { curso, site: 'https://godotengine.org/pt-br/download' });
  // A sugestão ao curso leva o site junto e a aceitação grava no catálogo do curso.
  const cursos = Cursos.sugerirRequisito(Cursos.carregar(), 'css', { tipo: 'incluir', softwareId: null, nome: 'Godot 4.3', observacao: 'portable', site: 'https://godotengine.org/download', turmaId: t.id, turmaCodigo: 'CSS N', instrutorId: 'i1', instrutorNome: 'André', em: '2026-09-03T10:00' });
  const sg = Cursos.sugestoesPendentes(Cursos.porId(cursos, 'css'))[0];
  const aceito = Cursos.aceitarSugestao(cursos, 'css', sg.id, 'Coordenação');
  return {
    salvo: item.site,
    editado: Turmas.requisitos(Turmas.porId(trocado, t.id), curso).softwares.find((s) => s.nome === 'Godot 4.3').site,
    torto: Turmas.validarSoftwareLivreRequisito({ nome: 'Blender', site: 'godotengine.org' }, []),
    vazioPassa: Turmas.validarSoftwareLivreRequisito({ nome: 'Blender', site: '' }, []).length,
    noCurso: Cursos.porId(aceito, 'css').infraestrutura.softwares.find((s) => s.nome === 'Godot 4.3').site,
  };
`);
assert.equal(site.salvo, 'https://godotengine.org/download');
assert.equal(site.editado, 'https://godotengine.org/pt-br/download');
assert.equal(site.torto[0].campo, 'site', 'endereço sem http(s) é recusado');
assert.equal(site.vazioPassa, 0, 'site é opcional');
assert.equal(site.noCurso, 'https://godotengine.org/download', 'a sugestão aceita leva o site para o catálogo do curso');

// Software repetido não entra duas vezes na turma.
const repetido = rodar(`
  const curso = Cursos.porId(Cursos.carregar(), 'css');
  const t = Turmas.porId(Turmas.carregar(), 'sup10-css');
  const lista = Turmas.adicionarSoftwaresRequisitos(Turmas.carregar(), t.id, ['git', 'git'], { curso, autor: 'Coordenação' });
  const r = Turmas.requisitos(Turmas.porId(lista, t.id), curso);
  return { git: r.softwares.filter((s) => s.nome === 'Git').length, erroLivre: Turmas.validarSoftwareLivreRequisito({ nome: 'git' }, r.softwares).length };
`);
assert.equal(repetido.git, 1);
assert.equal(repetido.erroLivre, 1);

console.log('requisitos-turma: ok');
