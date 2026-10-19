// ============================================================
// Semente da demonstração: uma escola fictícia de cursos livres
// ("Atlas Cursos Profissionalizantes", Londrina-PR) gerada A PARTIR DA DATA
// DE HOJE, para a demo nunca ficar velha: turmas em andamento, uma turma
// recém-terminada aguardando conclusão, parcelas pagas e vencidas, chamadas
// registradas, uma chamada pendente e certificados já emitidos.
//
// Gerador determinístico (mesma data → mesmos dados). Tudo é derivado dos
// próprios registros: os números do painel saem daqui, não de constantes.
// Pessoas, CPFs, telefones e e-mails são fictícios.
// ============================================================

const Semente = (() => {
  function prng(semente) {
    let a = semente >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const NOMES_F = ['Ana', 'Beatriz', 'Camila', 'Daniela', 'Eduarda', 'Fernanda', 'Gabriela', 'Helena', 'Isabela', 'Juliana', 'Larissa', 'Letícia', 'Luana', 'Mariana', 'Natália', 'Patrícia', 'Rafaela', 'Renata', 'Sabrina', 'Tatiane', 'Vanessa', 'Vitória', 'Yasmin', 'Aline', 'Bruna', 'Carolina', 'Débora', 'Elaine', 'Giovana', 'Jéssica', 'Lívia', 'Manuela', 'Priscila', 'Sofia', 'Thaís', 'Kelly', 'Adriana', 'Cláudia', 'Simone', 'Lorena'];
  const NOMES_M = ['André', 'Bruno', 'Caio', 'Daniel', 'Eduardo', 'Felipe', 'Gabriel', 'Gustavo', 'Henrique', 'Igor', 'João', 'Leonardo', 'Lucas', 'Marcelo', 'Mateus', 'Nicolas', 'Otávio', 'Paulo', 'Rafael', 'Rodrigo', 'Samuel', 'Thiago', 'Vinícius', 'Wesley', 'Alexandre', 'Diego', 'Fábio', 'Guilherme', 'Júlio', 'Luiz', 'Murilo', 'Pedro', 'Ricardo', 'Sérgio', 'Vitor', 'Arthur', 'Enzo', 'Heitor', 'Davi', 'Renan'];
  const SOBRENOMES = ['Almeida', 'Andrade', 'Barbosa', 'Barros', 'Cardoso', 'Carvalho', 'Castro', 'Correia', 'Costa', 'Dias', 'Farias', 'Fernandes', 'Freitas', 'Gomes', 'Lima', 'Machado', 'Martins', 'Melo', 'Moraes', 'Moreira', 'Nascimento', 'Oliveira', 'Pereira', 'Pinto', 'Ramos', 'Rezende', 'Rocha', 'Santana', 'Santos', 'Silva', 'Soares', 'Souza', 'Teixeira', 'Vieira', 'Batista', 'Campos', 'Cunha', 'Mendonça', 'Pacheco', 'Tavares'];
  const DOMINIOS = ['gmail.com', 'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.br'];
  const PARENTESCOS = ['Mãe', 'Pai', 'Mãe', 'Avó', 'Tio'];
  const RUAS = ['Rua das Acácias', 'Rua dos Ipês', 'Rua Santa Catarina', 'Avenida Brasil', 'Rua Piauí', 'Rua Sergipe', 'Rua Maranhão', 'Rua Belo Horizonte', 'Rua Espírito Santo', 'Rua das Orquídeas', 'Avenida das Flores', 'Rua Pernambuco'];
  const BAIRROS = ['Centro', 'Gleba Palhano', 'Jardim Higienópolis', 'Vila Nova', 'Jardim Bandeirantes', 'Cinco Conjuntos', 'Jardim Igapó', 'Vila Casoni', 'Aeroporto', 'Jardim Ouro Branco'];

  const sem = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function cpfComDv(base9) {
    const d = base9.split('').map(Number);
    const dv = (n) => { let s = 0; for (let i = 0; i < n; i += 1) s += d[i] * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
    d.push(dv(9));
    d.push(dv(10));
    return d.join('');
  }
  function cnpjComDv(base12) {
    const d = base12.split('').map(Number);
    const dv = (pesos) => { const s = pesos.reduce((acc, p, i) => acc + d[i] * p, 0); const r = s % 11; return r < 2 ? 0 : 11 - r; };
    d.push(dv([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]));
    d.push(dv([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]));
    return d.join('');
  }

  const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
  const diaDe = (iso) => DIAS[(new Date(`${iso}T12:00:00`).getDay() + 6) % 7];
  // Dia da semana k dias depois, pulando domingo.
  function maisDias(dia, k) {
    let i = (DIAS.indexOf(dia) + k) % 7;
    if (DIAS[i] === 'dom') i = 0;
    return DIAS[i];
  }

  const PROFESSORES = [
    { id: 'pr1', nome: 'Carlos Mendes', email: 'carlos.mendes@escolaatlas.com.br', telefone: '43991234501', especialidade: 'Excel e planilhas', valorHora: 45 },
    { id: 'pr2', nome: 'Juliana Prado', email: 'juliana.prado@escolaatlas.com.br', telefone: '43991234502', especialidade: 'Programação', valorHora: 55 },
    { id: 'pr3', nome: 'Rafael Teixeira', email: 'rafael.teixeira@escolaatlas.com.br', telefone: '43991234503', especialidade: 'Desenvolvimento web', valorHora: 55 },
    { id: 'pr4', nome: 'Beatriz Nogueira', email: 'beatriz.nogueira@escolaatlas.com.br', telefone: '43991234504', especialidade: 'Design gráfico', valorHora: 50 },
    { id: 'pr5', nome: 'Sérgio Albuquerque', email: 'sergio.albuquerque@escolaatlas.com.br', telefone: '43991234505', especialidade: 'Administração e rotinas de escritório', valorHora: 45 },
  ];

  const CURSOS = [
    { id: 'cu1', codigo: 'EXC', nome: 'Excel Essencial', area: 'Informática', modalidade: 'presencial', cargaHoraria: 24, valor: 690, parcelasSugeridas: 3, notaMinima: 7,
      descricao: 'Do zero às planilhas do dia a dia: fórmulas, formatação, gráficos e tabelas dinâmicas.',
      modulos: [{ nome: 'Interface e primeiras planilhas', cargaHoraria: 6 }, { nome: 'Fórmulas e funções', cargaHoraria: 10 }, { nome: 'Gráficos e tabelas dinâmicas', cargaHoraria: 8 }] },
    { id: 'cu2', codigo: 'EXA', nome: 'Excel Avançado', area: 'Informática', modalidade: 'hibrido', cargaHoraria: 32, valor: 890, parcelasSugeridas: 4,
      descricao: 'Funções de busca, Power Query e painéis para quem já usa Excel no trabalho.',
      modulos: [{ nome: 'Funções lógicas e de busca', cargaHoraria: 10 }, { nome: 'Tabelas dinâmicas e Power Query', cargaHoraria: 12 }, { nome: 'Dashboards', cargaHoraria: 10 }] },
    { id: 'cu3', modeloCertificadoId: 'mc2', codigo: 'PY', nome: 'Lógica de Programação com Python', area: 'Programação', modalidade: 'presencial', cargaHoraria: 40, valor: 1290, parcelasSugeridas: 5,
      descricao: 'Primeiro contato com programação: lógica, Python e um projeto final.',
      modulos: [{ nome: 'Lógica e algoritmos', cargaHoraria: 8 }, { nome: 'Python básico', cargaHoraria: 12 }, { nome: 'Listas, dicionários e funções', cargaHoraria: 10 }, { nome: 'Projeto final', cargaHoraria: 10 }] },
    { id: 'cu4', modeloCertificadoId: 'mc2', codigo: 'WEB', nome: 'Desenvolvimento Web: HTML, CSS e JavaScript', area: 'Programação', modalidade: 'online', cargaHoraria: 60, valor: 1790, parcelasSugeridas: 6,
      descricao: 'Construção de sites responsivos, do HTML ao JavaScript, com portfólio publicado.',
      modulos: [{ nome: 'HTML semântico', cargaHoraria: 12 }, { nome: 'CSS e layout responsivo', cargaHoraria: 18 }, { nome: 'JavaScript', cargaHoraria: 22 }, { nome: 'Projeto de portfólio', cargaHoraria: 8 }] },
    { id: 'cu5', codigo: 'DSG', nome: 'Design Gráfico com Photoshop e Canva', area: 'Design', modalidade: 'presencial', cargaHoraria: 36, valor: 1090, parcelasSugeridas: 4,
      descricao: 'Fundamentos de design e produção de peças para redes sociais e impressos.',
      modulos: [{ nome: 'Fundamentos de design', cargaHoraria: 8 }, { nome: 'Photoshop', cargaHoraria: 16 }, { nome: 'Canva para redes sociais', cargaHoraria: 8 }, { nome: 'Portfólio', cargaHoraria: 4 }] },
    { id: 'cu6', modeloCertificadoId: 'mc3', codigo: 'ADM', nome: 'Assistente Administrativo', area: 'Administração', modalidade: 'presencial', cargaHoraria: 60, valor: 1350, parcelasSugeridas: 6,
      descricao: 'Rotinas de escritório, departamento pessoal, financeiro básico e atendimento.',
      modulos: [{ nome: 'Rotinas administrativas', cargaHoraria: 16 }, { nome: 'Departamento pessoal', cargaHoraria: 12 }, { nome: 'Financeiro básico', cargaHoraria: 14 }, { nome: 'Atendimento e comunicação', cargaHoraria: 10 }, { nome: 'Informática aplicada', cargaHoraria: 8 }] },
    { id: 'cu7', codigo: 'ATV', nome: 'Atendimento e Vendas', area: 'Administração', modalidade: 'presencial', cargaHoraria: 20, valor: 490, parcelasSugeridas: 2,
      descricao: 'Técnicas de atendimento, negociação e pós-venda. Sem turma aberta no momento.',
      modulos: [] },
  ];

  // Responsáveis com papéis, endereço e preferências de pagamento. Sorteio próprio,
  // no fim, para não mudar os demais dados da escola (o roteiro depende deles).
  function complementarAlunos(db, hoje) {
    const rnd = prng(20261010);
    const r = (min, max) => min + Math.floor(rnd() * (max - min + 1));
    const escolher = (lista) => lista[Math.floor(rnd() * lista.length)];
    const chance = (p) => rnd() < p;
    const pessoa = (sobrenome, parentesco, papeis) => ({ nome: `${escolher(parentesco === 'Pai' || parentesco === 'Tio' ? NOMES_M : NOMES_F)} ${sobrenome}`, cpf: cpfComDv(String(r(100000000, 999999999))), telefone: `439${r(80000000, 99999999)}`, email: '', parentesco, papeis });
    db.alunos.forEach((a) => {
      const sobrenome = a.nome.split(' ').pop();
      const ms = db.matriculas.filter((m) => m.alunoId === a.id);
      const resp = [];
      if (a.responsavel) {
        resp.push({ ...a.responsavel, email: `${a.responsavel.nome.split(' ')[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()}.${sobrenome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()}@gmail.com`, papeis: ['legal', 'financeiro'] });
        if (chance(0.5)) resp.push(pessoa(sobrenome, resp[0].parentesco === 'Pai' ? 'Mãe' : 'Pai', ['legal', 'emergencia']));
      } else if (chance(0.25)) resp.push(pessoa(escolher(SOBRENOMES), escolher(['Mãe', 'Cônjuge', 'Irmã', 'Pai']), ['emergencia']));
      a.responsaveis = resp.map((x, i) => ({ id: `r${i + 1}`, ...x }));
      a.rg = chance(0.85) ? `${r(4, 15)}.${r(100, 999)}.${r(100, 999)}-${r(0, 9)}` : '';
      a.origem = chance(0.9) ? escolher(['Indicação', 'Indicação', 'Instagram', 'Instagram', 'Google', 'WhatsApp', 'Passou na frente', 'Empresa ou parceria']) : '';
      a.endereco = ms.length || chance(0.3)
        ? { cep: `860${r(10, 99)}${r(100, 999)}`, logradouro: escolher(RUAS), numero: String(r(12, 2400)), complemento: chance(0.3) ? `Apto ${r(11, 1204)}` : '', bairro: escolher(BAIRROS), cidade: 'Londrina', uf: 'PR' }
        : { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' };
      const ultima = ms[ms.length - 1];
      a.cobranca = { pagador: a.responsavel ? 'responsavel' : 'aluno', formaPreferida: ultima?.formaPagamento ?? '', diaVencimento: ultima && ultima.parcelas > 1 ? Number(ultima.primeiroVencimento.slice(8)) : null };
      delete a.responsavel;
    });
  }

  // Quatro modelos para a demo mostrar a escolha por curso: o padrão, um de
  // programação, um clássico em retrato e um rascunho. Datas relativas a hoje.
  function modelosCertificado(hoje) {
    const dia = (n) => Aulor.somarDias(hoje, n);
    const LEI = 'Certificado de curso livre, de formação inicial e continuada, nos termos da Lei nº 9.394/96 (art. 42).';
    const verso = (extra = {}) => ({ mostrar: true, titulo: 'Conteúdo programático', mostrarCargaPorItem: true, mostrarRequisitos: true, textoLivre: LEI, ...extra });
    const direcao = { nome: 'Marina Azevedo', cargo: 'Diretora' };
    return [
      {
        id: 'mc1', nome: 'Padrão Atlas', descricao: 'Paisagem com moldura dupla nas cores da escola.', padrao: true, status: 'ativo', atualizadoEm: dia(-48),
        aparencia: { orientacao: 'paisagem', fonte: 'moderna', moldura: 'dupla', corPrimaria: '#0F3D4E', corDestaque: '#C47A3A' },
        frente: {
          rotuloTopo: 'Certificado de conclusão', titulo: 'Certificado', introducao: 'Certificamos que', mostrarCpf: true,
          corpo: 'concluiu o curso livre **{{curso}}**, na modalidade {{modalidade}}, realizado de {{inicio}} a {{fim}}, com carga horária de **{{cargaHoraria}}** e frequência de {{frequencia}}.',
          localData: '{{cidade}}, {{dataEmissao}}.', assinaturas: [direcao, { nome: '{{professor}}', cargo: 'Professor(a) do curso' }],
        },
        verso: verso(),
      },
      {
        id: 'mc2', nome: 'Programação', descricao: 'Faixa lateral e verso com os módulos e o projeto final.', padrao: false, status: 'ativo', atualizadoEm: dia(-12),
        aparencia: { orientacao: 'paisagem', fonte: 'moderna', moldura: 'lateral', corPrimaria: '#1E293B', corDestaque: '#0E7490' },
        frente: {
          rotuloTopo: 'Trilha de programação', titulo: 'Certificado', introducao: 'Certificamos que', mostrarCpf: true,
          corpo: 'concluiu **{{curso}}** na turma {{turma}}, de {{inicio}} a {{fim}}, somando **{{cargaHoraria}}** de aulas práticas e projeto final orientado por {{professor}}.',
          localData: '{{cidade}}, {{dataEmissao}}.', assinaturas: [direcao, { nome: '{{professor}}', cargo: 'Instrutor(a)' }],
        },
        verso: verso({ titulo: 'O que foi estudado' }),
      },
      {
        id: 'mc3', nome: 'Clássico em retrato', descricao: 'Serifado, filete fino, para cursos de gestão e administração.', padrao: false, status: 'ativo', atualizadoEm: dia(-30),
        aparencia: { orientacao: 'retrato', fonte: 'classica', moldura: 'simples', corPrimaria: '#5B2333', corDestaque: '#A8844A' },
        frente: {
          rotuloTopo: '', titulo: 'Certificado', introducao: 'A Atlas Cursos Profissionalizantes certifica que', mostrarCpf: true,
          corpo: 'concluiu com aproveitamento o curso livre de **{{curso}}**, com carga horária de **{{cargaHoraria}}**, realizado de {{inicio}} a {{fim}}.',
          localData: '{{cidade}}, {{dataEmissao}}.', assinaturas: [direcao, { nome: 'Coordenação pedagógica', cargo: 'Atlas Cursos' }],
        },
        verso: verso({ mostrarCargaPorItem: false }),
      },
      {
        id: 'mc4', nome: 'Workshop de curta duração', descricao: 'Sem verso, para cursos de até 20 horas.', padrao: false, status: 'rascunho', atualizadoEm: dia(-2),
        aparencia: { orientacao: 'paisagem', fonte: 'moderna', moldura: 'simples', corPrimaria: '#8A4F20', corDestaque: '#C47A3A' },
        frente: {
          rotuloTopo: 'Certificado de participação', titulo: 'Participação', introducao: 'Certificamos que', mostrarCpf: false,
          corpo: 'participou de **{{curso}}**, com {{cargaHoraria}}, em {{fim}}.', localData: '{{cidade}}, {{dataEmissao}}.', assinaturas: [direcao],
        },
        verso: verso({ mostrar: false }),
      },
    ];
  }

  function gerar(hoje) {
    const rnd = prng(20261009);
    const r = (min, max) => min + Math.floor(rnd() * (max - min + 1));
    const escolher = (lista) => lista[Math.floor(rnd() * lista.length)];
    const chance = (p) => rnd() < p;
    const { somarDias, somarMeses, gerarDatasAulas, gerarParcelas, arred } = Aulor;

    const db = {
      versao: 1,
      geradoEm: hoje,
      escola: {
        nome: 'Atlas Cursos Profissionalizantes', sigla: 'ATL', cnpj: cnpjComDv('412387650001'),
        telefone: '4333221100', email: 'contato@escolaatlas.com.br', endereco: 'Rua Pernambuco, 1280 — Centro',
        cidade: 'Londrina', uf: 'PR', site: 'escolaatlas.com.br', diretor: 'Marina Azevedo', cargoDiretor: 'Diretora',
      },
      config: {
        academico: { frequenciaMinima: 75, justificadaContaPresenca: true },
        financeiro: { diaVencimentoPadrao: 10, parcelasMaximas: 12, multaPercentual: 2, jurosMensalPercentual: 1, descontoMaximoPercentual: 30, bloquearCertificadoInadimplente: false },
      },
      assinatura: { planoId: 'gestao', condicoes: {} },
      modelosCertificado: modelosCertificado(hoje),
      professores: PROFESSORES.map((p) => ({ ...p, ativo: true })),
      cursos: CURSOS.map((c) => ({ modeloCertificadoId: null, notaMinima: null, ...c, modulos: c.modulos.map((m) => ({ ...m })), ativo: true })),
      turmas: [], aulas: [], alunos: [], matriculas: [], lancamentos: [], certificados: [],
    };
    const curso = (id) => db.cursos.find((c) => c.id === id);
    const prof = (id) => db.professores.find((p) => p.id === id);

    // ---------- Turmas (datas relativas a hoje) ----------

    const diaHoje = diaDe(hoje) === 'dom' ? 'seg' : diaDe(hoje);
    const proximoDia = (desde, dias) => { let d = desde; while (!dias.includes(diaDe(d))) d = somarDias(d, 1); return d; };
    const periodo = (dias, inicio, fim) => ({ dias, inicio, fim });

    // `fimAntesDeHoje`: recua o início de semana em semana até a última aula cair antes de hoje.
    const SPECS = [
      { id: 'tu1', curso: 'cu1', prof: 'pr1', dias: ['seg', 'qua'], h: ['19:00', '21:00'], inicio: somarDias(hoje, -150), cap: 14, local: 'Laboratório 1', alunos: 10, concluida: true },
      { id: 'tu2', curso: 'cu1', prof: 'pr1', dias: ['ter', 'qui'], h: ['19:00', '21:00'], inicio: somarDias(hoje, -46), cap: 14, local: 'Laboratório 1', alunos: 11, fimAntesDeHoje: true },
      { id: 'tu3', curso: 'cu3', prof: 'pr2', dias: ['sab'], h: ['08:00', '12:00'], inicio: somarDias(hoje, -40), cap: 16, local: 'Laboratório 2', alunos: 14 },
      { id: 'tu4', curso: 'cu5', prof: 'pr4', dias: [diaHoje, maisDias(diaHoje, 2)], h: ['14:00', '17:00'], inicio: somarDias(hoje, -20), cap: 12, local: 'Laboratório 2', alunos: 10 },
      { id: 'tu5', curso: 'cu6', prof: 'pr5', dias: [diaHoje, maisDias(diaHoje, 2)], h: ['19:00', '22:00'], inicio: somarDias(hoje, -34), cap: 20, local: 'Sala 3', alunos: 16 },
      { id: 'tu6', curso: 'cu4', prof: 'pr3', dias: ['ter', 'qui'], h: ['19:30', '22:00'], inicio: somarDias(hoje, 10), cap: 20, local: 'Online (link enviado por e-mail)', alunos: 8 },
      { id: 'tu7', curso: 'cu2', prof: 'pr1', dias: ['sab'], h: ['13:30', '17:30'], inicio: somarDias(hoje, 5), cap: 15, local: 'Laboratório 1 + transmissão', alunos: 6 },
      { id: 'tu8', curso: 'cu1', prof: 'pr1', dias: ['ter', 'qui'], h: ['08:00', '10:00'], inicio: somarDias(hoje, -15), cap: 15, local: 'Laboratório 1', alunos: 12 },
      // Turma em "alerta" de não fechar. Os alunos dela entram no fim da geração (ver `tardia`),
      // para não deslocar o sorteio das demais turmas.
      { id: 'tu9', curso: 'cu6', prof: 'pr5', dias: ['seg', 'qua'], h: ['19:00', '22:00'], inicio: somarDias(hoje, 34), cap: 20, min: 12, local: 'Sala 3', alunos: 4, tardia: true },
    ];

    SPECS.forEach((s) => {
      const c = curso(s.curso);
      const agenda = { formato: c.modalidade, recorrencia: 'semanal', periodos: [periodo([...new Set(s.dias)], s.h[0], s.h[1])] };
      let inicio = proximoDia(s.inicio, agenda.periodos[0].dias);
      let datas = gerarDatasAulas(agenda, inicio, c.cargaHoraria);
      while (s.fimAntesDeHoje && datas[datas.length - 1].data >= hoje) {
        inicio = proximoDia(somarDias(inicio, -7), agenda.periodos[0].dias);
        datas = gerarDatasAulas(agenda, inicio, c.cargaHoraria);
      }
      const ano = inicio.slice(0, 4);
      const n = db.turmas.filter((t) => t.cursoId === c.id && t.inicio.startsWith(ano)).length + 1;
      const fim = datas[datas.length - 1].data;
      db.turmas.push({
        id: s.id, codigo: `${c.codigo}-${ano}-${n}`, cursoId: c.id, professorId: s.prof, agenda, inicio, fim,
        capacidade: s.cap, minimoAlunos: s.min ?? null, local: s.local, status: s.concluida ? 'concluida' : 'ativa',
        concluidaEm: s.concluida ? somarDias(fim, 2) : null, concluidaPor: s.concluida ? 'Camila Duarte' : null,
      });
      datas.forEach((d) => db.aulas.push({ id: `${s.id}-a${d.n}`, turmaId: s.id, n: d.n, data: d.data, inicio: d.inicio, fim: d.fim, status: 'prevista', conteudo: '', presencas: {}, registradaEm: null, registradaPor: null }));
    });
    // Códigos de turma em ordem cronológica (EXC-2026-1 é a mais antiga).
    db.cursos.forEach((c) => {
      const doCurso = db.turmas.filter((t) => t.cursoId === c.id).sort((a, b) => a.inicio.localeCompare(b.inicio));
      const porAno = {};
      doCurso.forEach((t) => { const ano = t.inicio.slice(0, 4); porAno[ano] = (porAno[ano] ?? 0) + 1; t.codigo = `${c.codigo}-${ano}-${porAno[ano]}`; });
    });

    // ---------- Alunos ----------

    const usados = new Set();
    function novoAluno({ menor = false } = {}) {
      let nome;
      do {
        const fem = chance(0.55);
        nome = `${escolher(fem ? NOMES_F : NOMES_M)} ${escolher(SOBRENOMES)}${chance(0.45) ? ` ${escolher(SOBRENOMES)}` : ''}`;
      } while (usados.has(nome));
      usados.add(nome);
      const partes = nome.split(' ');
      const idade = menor ? r(15, 17) : (chance(0.7) ? r(18, 32) : r(33, 55));
      const nascimento = `${Number(hoje.slice(0, 4)) - idade - 1}-${String(r(1, 12)).padStart(2, '0')}-${String(r(1, 28)).padStart(2, '0')}`;
      const sobrenome = partes[partes.length - 1];
      const aluno = {
        id: `al${db.alunos.length + 1}`,
        nome,
        cpf: cpfComDv(String(r(100000000, 999999999))),
        nascimento,
        email: `${sem(partes[0])}.${sem(sobrenome)}${r(1, 99)}@${escolher(DOMINIOS)}`,
        telefone: `439${r(80000000, 99999999)}`,
        responsavel: menor ? { nome: `${escolher(NOMES_F)} ${sobrenome}`, cpf: cpfComDv(String(r(100000000, 999999999))), telefone: `439${r(80000000, 99999999)}`, parentesco: escolher(PARENTESCOS) } : null,
        observacoes: '',
        criadoEm: null,
        criadoPor: 'Paula Ribeiro',
      };
      db.alunos.push(aluno);
      return aluno;
    }

    // ---------- Matrículas + parcelas ----------

    const lanc = [];
    const novoLanc = (l) => { const x = { id: `lc${lanc.length + 1}`, pagoEm: null, valorPago: null, matriculaId: null, alunoId: null, parcela: null, fornecedor: '', observacao: '', cobranca: null, criadoPor: 'Paula Ribeiro', baixadoPor: null, ...l }; lanc.push(x); return x; };

    function matricular(aluno, t, data) {
      const c = curso(t.cursoId);
      const aVista = chance(0.18);
      const desconto = aVista ? arred(c.valor * 0.1) : (chance(0.15) ? arred(c.valor * 0.15) : 0);
      const valorFinal = arred(c.valor - desconto);
      const parcelas = aVista ? 1 : Math.max(1, c.parcelasSugeridas - (chance(0.25) ? 1 : 0));
      const forma = aVista ? escolher(['pix', 'cartao_credito']) : escolher(['pix', 'pix', 'boleto', 'boleto', 'cartao_credito']);
      const primeiro = aVista ? data : somarMeses(`${data.slice(0, 8)}10`, Number(data.slice(8)) > 5 ? 1 : 0, 10);
      const m = {
        id: `ma${db.matriculas.length + 1}`, codigo: '', alunoId: aluno.id, turmaId: t.id, data,
        valorCurso: c.valor, desconto, valorFinal, parcelas, primeiroVencimento: primeiro, formaPagamento: forma, pagador: aluno.responsavel ? 'responsavel' : 'aluno',
        status: 'ativa', resultado: null, frequenciaFinal: null, notaFinal: null, concluidaEm: null, canceladaEm: null, motivoCancelamento: '', criadaPor: 'Paula Ribeiro',
      };
      db.matriculas.push(m);
      if (!aluno.criadoEm || data < aluno.criadoEm) aluno.criadoEm = data;
      gerarParcelas(valorFinal, parcelas, primeiro).forEach((p) => {
        novoLanc({ tipo: 'receber', descricao: `${c.nome} · parcela ${p.n}/${p.de}`, categoria: 'Mensalidades de cursos', valor: p.valor, vencimento: p.vencimento, status: 'aberto', forma, matriculaId: m.id, alunoId: aluno.id, parcela: { n: p.n, de: p.de }, criadoEm: data });
      });
      return m;
    }

    const turma = (id) => db.turmas.find((t) => t.id === id);
    const dataMatricula = (t) => {
      if (t.inicio > hoje) return somarDias(hoje, -r(1, 25));
      if (t.id === 'tu8' && chance(0.2)) return somarDias(t.inicio, r(1, 4)); // entrou depois do início
      return somarDias(t.inicio, -r(3, 28));
    };

    const alunosPorTurma = {};
    const menoresEm = new Set(['tu4', 'tu8', 'tu3']);
    SPECS.filter((s) => !s.tardia).forEach((s) => {
      const t = turma(s.id);
      alunosPorTurma[s.id] = [];
      for (let i = 0; i < s.alunos; i += 1) {
        let a;
        // Progressão: quem fez Excel Essencial (tu1) volta para o Avançado (tu7); alguns de Python fazem Web.
        if (s.id === 'tu7' && i < 4) a = alunosPorTurma.tu1[i + 1];
        else if (s.id === 'tu6' && i < 2) a = alunosPorTurma.tu3[i + 3];
        else a = novoAluno({ menor: menoresEm.has(s.id) && chance(0.22) });
        alunosPorTurma[s.id].push(a);
        matricular(a, t, dataMatricula(t));
      }
    });
    // Cadastros recentes ainda sem matrícula (interessados).
    for (let i = 0; i < 3; i += 1) { const a = novoAluno(); a.criadoEm = somarDias(hoje, -r(0, 6)); }

    // ---------- Cancelamentos (desistências) ----------

    const cancelar = (turmaId, idx, diasAtras, motivo) => {
      const m = db.matriculas.filter((x) => x.turmaId === turmaId)[idx];
      m.status = 'cancelada';
      m.canceladaEm = somarDias(hoje, -diasAtras);
      m.motivoCancelamento = motivo;
      return m;
    };
    const cancelamentos = [cancelar('tu5', 14, 12, 'Mudou de cidade'), cancelar('tu3', 12, 20, 'Conflito de horário com o trabalho')];

    // ---------- Chamadas e diário ----------

    const assiduidade = {};
    db.matriculas.forEach((m) => { assiduidade[m.id] = 0.93; });
    const faltoso = (turmaId, idx, p) => { const m = db.matriculas.filter((x) => x.turmaId === turmaId)[idx]; if (m) assiduidade[m.id] = p; };
    faltoso('tu1', 6, 0.5);
    faltoso('tu2', 3, 0.5);
    faltoso('tu3', 8, 0.62);
    faltoso('tu5', 2, 0.6);
    faltoso('tu5', 11, 0.66);
    faltoso('tu4', 5, 0.7);

    const duracao = (a) => (Number(a.fim.slice(0, 2)) * 60 + Number(a.fim.slice(3)) - Number(a.inicio.slice(0, 2)) * 60 - Number(a.inicio.slice(3))) / 60;
    const pendenteTu5 = db.aulas.filter((a) => a.turmaId === 'tu5' && a.data < hoje).pop();
    db.aulas.forEach((a) => {
      if (a.data >= hoje || a === pendenteTu5) return;
      const t = turma(a.turmaId);
      const c = curso(t.cursoId);
      // Módulo da aula pela carga acumulada.
      let acumulado = 0;
      const horasAntes = db.aulas.filter((x) => x.turmaId === a.turmaId && x.n < a.n).reduce((soma, x) => soma + duracao(x), 0);
      const mod = c.modulos.find((m) => (acumulado += m.cargaHoraria) > horasAntes) ?? c.modulos[c.modulos.length - 1];
      a.status = 'realizada';
      a.conteudo = mod ? `${mod.nome}${a.n > 1 ? ' — exercícios práticos' : ' — apresentação do curso'}` : 'Aula prática';
      a.registradaEm = a.data;
      a.registradaPor = prof(t.professorId).nome;
      db.matriculas.filter((m) => m.turmaId === a.turmaId && m.data <= a.data && (m.status !== 'cancelada' || a.data < m.canceladaEm)).forEach((m) => {
        a.presencas[m.id] = rnd() < assiduidade[m.id] ? 'P' : (chance(0.15) ? 'J' : 'F');
      });
    });

    // ---------- Pagamentos ----------

    const inadimplentes = new Set();
    [['tu5', 4], ['tu5', 9], ['tu3', 2], ['tu3', 6], ['tu8', 7], ['tu4', 1], ['tu1', 3]].forEach(([t, i]) => { const m = db.matriculas.filter((x) => x.turmaId === t)[i]; if (m) inadimplentes.add(m.id); });

    lanc.filter((l) => l.tipo === 'receber').forEach((l) => {
      const m = db.matriculas.find((x) => x.id === l.matriculaId);
      const cancelada = m.status === 'cancelada';
      if (l.vencimento < hoje) {
        const atrasada = inadimplentes.has(m.id) && lanc.filter((x) => x.matriculaId === m.id && x.vencimento < hoje).slice(-2).includes(l);
        if (cancelada && l.vencimento >= m.canceladaEm) { l.status = 'cancelado'; return; }
        if (atrasada && !cancelada) return; // fica vencida
        const pago = chance(0.85) ? somarDias(l.vencimento, -r(0, 4)) : somarDias(l.vencimento, r(1, 12));
        l.status = 'pago';
        l.pagoEm = pago < l.criadoEm ? l.criadoEm : (pago >= hoje ? somarDias(hoje, -1) : pago);
        l.valorPago = l.valor;
        l.baixadoPor = 'Renato Siqueira';
      } else if (cancelada) {
        l.status = 'cancelado';
      } else if (Aulor.diasEntre(hoje, l.vencimento) <= 5 && chance(0.25)) {
        const pago = somarDias(hoje, -r(0, 2));
        l.status = 'pago';
        l.pagoEm = pago < l.criadoEm ? l.criadoEm : pago;
        l.valorPago = l.valor;
        l.baixadoPor = 'Renato Siqueira';
      }
    });
    cancelamentos.forEach((m) => lanc.filter((l) => l.matriculaId === m.id && l.status === 'aberto').forEach((l) => { l.status = 'cancelado'; }));

    // ---------- Conclusão da turma antiga + certificados emitidos ----------

    const t1 = turma('tu1');
    const copiaModelo = (c) => {
      const m = db.modelosCertificado.find((x) => x.id === c.modeloCertificadoId) ?? db.modelosCertificado.find((x) => x.padrao);
      return JSON.parse(JSON.stringify({ id: m.id, nome: m.nome, aparencia: m.aparencia, frente: m.frente, verso: m.verso }));
    };
    db.matriculas.filter((m) => m.turmaId === 'tu1').forEach((m, i) => {
      const realizadas = db.aulas.filter((a) => a.turmaId === 'tu1' && a.status === 'realizada' && a.data >= m.data);
      const validas = realizadas.filter((a) => ['P', 'J'].includes(a.presencas[m.id])).length;
      const freq = Math.round((validas / realizadas.length) * 100);
      // Nota final de 5,5 a 10 tirada do id (sem sortear: não desloca os sorteios seguintes da semente).
      let hn = 0;
      for (const ch of m.id) hn = (hn * 31 + ch.charCodeAt(0)) % 1000;
      const nota = Math.round((5.5 + (hn % 46) / 10) * 10) / 10;
      const minimaNota = curso(t1.cursoId).notaMinima;
      const resultado = freq < 75 ? 'reprovado_frequencia' : minimaNota != null && nota < minimaNota ? 'reprovado_nota' : 'aprovado';
      Object.assign(m, { status: 'concluida', frequenciaFinal: freq, notaFinal: nota, resultado, concluidaEm: t1.concluidaEm });
      if (m.resultado !== 'aprovado') return;
      const a = db.alunos.find((x) => x.id === m.alunoId);
      const c = curso(t1.cursoId);
      let h = 5381;
      for (const ch of `${m.id}|${m.alunoId}|${i + 1}`) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
      const base = h.toString(36).toUpperCase().padStart(8, '0').slice(-8);
      db.certificados.push({
        id: `ce${db.certificados.length + 1}`, codigo: `ATL-${t1.concluidaEm.slice(0, 4)}-${base.slice(0, 4)}-${base.slice(4)}`,
        matriculaId: m.id, alunoId: a.id, turmaId: t1.id, emitidoEm: somarDias(t1.concluidaEm, r(1, 4)), emitidoPor: 'Paula Ribeiro',
        status: 'valido', canceladoEm: null, motivoCancelamento: '',
        dados: { aluno: a.nome, cpf: a.cpf, curso: c.nome, modalidade: 'Presencial', cargaHoraria: c.cargaHoraria, inicio: t1.inicio, fim: t1.fim, turma: t1.codigo, professor: prof(t1.professorId).nome, frequencia: freq, matricula: '', modulos: c.modulos },
        modelo: copiaModelo(c),
      });
    });

    // ---------- Contas a pagar (3 meses para trás até o próximo mês) ----------

    const mesAtual = `${hoje.slice(0, 7)}-01`;
    const FIXAS = [
      { descricao: 'Aluguel da sala comercial', categoria: 'Aluguel e condomínio', fornecedor: 'Imobiliária Central', dia: 5, valor: () => 3200 },
      { descricao: 'Folha — secretaria e auxiliar', categoria: 'Salários e encargos', fornecedor: 'Folha de pagamento', dia: 5, valor: () => 4200 },
      { descricao: 'Honorários contábeis', categoria: 'Serviços (contabilidade, sistemas)', fornecedor: 'Contabilidade Exata', dia: 10, valor: () => 650 },
      { descricao: 'Energia elétrica', categoria: 'Energia, água e internet', fornecedor: 'Companhia de energia', dia: 12, valor: () => r(430, 560) + r(0, 99) / 100 },
      { descricao: 'Internet fibra 500 Mb', categoria: 'Energia, água e internet', fornecedor: 'NetSul Provedor', dia: 15, valor: () => 149.9 },
      { descricao: 'Anúncios em redes sociais', categoria: 'Marketing', fornecedor: 'Meios de pagamento de anúncios', dia: 20, valor: () => 800 },
      { descricao: 'Simples Nacional (DAS)', categoria: 'Impostos e taxas', fornecedor: 'Receita Federal', dia: 20, valor: () => r(820, 980) },
    ];
    for (let k = -3; k <= 1; k += 1) {
      const mes = somarMeses(mesAtual, k, 1);
      FIXAS.forEach((f) => novoLanc({ tipo: 'pagar', descricao: f.descricao, categoria: f.categoria, fornecedor: f.fornecedor, valor: arred(f.valor()), vencimento: `${mes.slice(0, 8)}${String(f.dia).padStart(2, '0')}`, status: 'aberto', forma: 'boleto', criadoEm: somarDias(mes, -10), criadoPor: 'Renato Siqueira' }));
      // Professores: horas de aula do mês anterior × valor-hora, pagas no dia 5.
      const anterior = somarMeses(mes, -1, 1).slice(0, 7);
      db.professores.forEach((p) => {
        const h = db.aulas.filter((a) => a.data.startsWith(anterior) && db.turmas.find((t) => t.id === a.turmaId).professorId === p.id)
          .reduce((soma, a) => soma + duracao(a), 0);
        if (h > 0) novoLanc({ tipo: 'pagar', descricao: `Aulas de ${p.nome} (${String(h).replace('.', ',')} h)`, categoria: 'Professores', fornecedor: p.nome, valor: arred(h * p.valorHora), vencimento: `${mes.slice(0, 8)}05`, status: 'aberto', forma: 'pix', criadoEm: mes, criadoPor: 'Renato Siqueira' });
      });
    }
    novoLanc({ tipo: 'pagar', descricao: 'Apostilas impressas — turmas do semestre', categoria: 'Material e insumos', fornecedor: 'Gráfica Rápida Norte', valor: 1150, vencimento: somarDias(hoje, -26), status: 'aberto', forma: 'pix', criadoEm: somarDias(hoje, -30), criadoPor: 'Renato Siqueira' });
    novoLanc({ tipo: 'pagar', descricao: 'Manutenção dos computadores do laboratório', categoria: 'Outras despesas', fornecedor: 'TecnoAssist', valor: 480, vencimento: somarDias(hoje, 6), status: 'aberto', forma: 'pix', criadoEm: somarDias(hoje, -3), criadoPor: 'Renato Siqueira' });

    // Turmas tardias: alunos que já fizeram outro curso da escola (sem cadastro novo).
    SPECS.filter((s) => s.tardia).forEach((s) => {
      const ex = db.matriculas.filter((m) => m.resultado === 'aprovado').map((m) => db.alunos.find((a) => a.id === m.alunoId));
      ex.slice(0, s.alunos).forEach((a) => {
        const m = matricular(a, turma(s.id), dataMatricula(turma(s.id)));
        // Em dia: o que já venceu foi pago no vencimento (ou na matrícula, se à vista).
        lanc.filter((l) => l.matriculaId === m.id && l.vencimento < hoje).forEach((l) => {
          Object.assign(l, { status: 'pago', pagoEm: l.vencimento < l.criadoEm ? l.criadoEm : l.vencimento, valorPago: l.valor, baixadoPor: 'Renato Siqueira' });
        });
      });
    });

    // ---------- Códigos de matrícula em ordem cronológica ----------

    const porAno = {};
    [...db.matriculas].sort((a, b) => a.data.localeCompare(b.data) || a.id.localeCompare(b.id)).forEach((m) => {
      const ano = m.data.slice(0, 4);
      porAno[ano] = (porAno[ano] ?? 0) + 1;
      m.codigo = `${ano}-${String(porAno[ano]).padStart(4, '0')}`;
    });
    db.certificados.forEach((c) => { c.dados.matricula = db.matriculas.find((m) => m.id === c.matriculaId).codigo; });

    // Pagas no vencimento; a conta vencida mais recente fica em aberto (aparece como pendência).
    const pagarVencidas = lanc.filter((l) => l.tipo === 'pagar' && l.vencimento < hoje).sort((a, b) => a.vencimento.localeCompare(b.vencimento));
    const esquecida = [...pagarVencidas].reverse().find((l) => l.categoria === 'Energia, água e internet');
    pagarVencidas.forEach((l) => {
      if (l === esquecida) return;
      Object.assign(l, { status: 'pago', pagoEm: l.vencimento, valorPago: l.valor, baixadoPor: 'Renato Siqueira' });
    });

    db.lancamentos = lanc;
    complementarAlunos(db, hoje);
    return db;
  }

  return { gerar };
})();
