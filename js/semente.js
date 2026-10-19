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
    { id: 'pr6', nome: 'Henrique Bastos', email: 'henrique.bastos@exemplo.com.br', telefone: '43991234506', especialidade: 'Marketing digital', valorHora: 50 },
  ];

  const CURSOS = [
    { id: 'cu1', codigo: 'EXC', nome: 'Excel Essencial', area: 'Informática', modalidade: 'presencial', cargaHoraria: 24, valor: 690, parcelasSugeridas: 3,
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

  // ---------- Pessoas: equipe (colaboradores) e instrutores ----------
  // Mesmo modelo das telas de Pessoas do protótipo original (js/colaboradores-*.js,
  // js/instrutores-*.js). Cada instrutor mostra um caso: PJ em dia com contrato
  // assinado e turma ainda sem contrato (Carlos), contrato em assinatura e
  // antecedentes do ano pendentes (Juliana), sem empresa e contrato em rascunho
  // (Rafael), RPA com recibo (Beatriz), professor CLT da equipe, de folha (Sérgio),
  // e um convidado que ainda não preencheu o cadastro pelo link (Henrique).

  const LGPD_VERSAO = '2026-01'; // mesma versão de LGPD_INSTRUTOR (js/instrutores-data.js)

  const DOCENTES = {
    pr1: { remuneracao: 'pj', apelido: 'Carlos', cpf: '305218447', rg: '8.214.330-1', nascimento: '1984-03-14', bio: 'Analista de BI; ensina Excel do básico aos dashboards desde 2017.', cep: '86020-080', rua: 'Rua Sergipe', numero: '512', bairro: 'Centro', emergencia: 'Lúcia Mendes', empresa: ['C. Mendes Treinamentos ME', '483120570001', 'Sicredi'], desde: -1460, tag: 'TAG-0031' },
    pr2: { remuneracao: 'pj', apelido: 'Ju', cpf: '418036925', rg: '9.120.447-3', nascimento: '1991-08-22', bio: 'Desenvolvedora Python; leva a lógica de programação para quem nunca programou.', cep: '86050-460', rua: 'Rua das Orquídeas', numero: '88', bairro: 'Gleba Palhano', emergencia: 'Marcos Prado', empresa: ['Juliana Prado Tecnologia Ltda', '520417380001', 'Banco do Brasil'], desde: -820, antecedentesAtrasados: true },
    pr3: { remuneracao: 'pj', apelido: 'Rafa', cpf: '527149036', rg: '10.338.512-0', nascimento: '1995-11-02', bio: 'Front-end; turmas online de desenvolvimento web.', cep: '86060-210', rua: 'Rua Maranhão', numero: '1420', bairro: 'Vila Nova', emergencia: 'Clara Teixeira', empresa: null, desde: -95, semLgpd: true },
    pr4: { remuneracao: 'rpa', apelido: 'Bia', cpf: '639250147', rg: '7.905.118-6', nascimento: '1988-05-30', bio: 'Designer gráfica autônoma; Photoshop e Canva para pequenos negócios.', cep: '86039-150', rua: 'Rua Belo Horizonte', numero: '76', bairro: 'Jardim Higienópolis', emergencia: 'Pedro Nogueira', contaPessoal: { banco: 'Nubank', agencia: '0001', conta: '4471820-3', pix: 'beatriz.nogueira@escolaatlas.com.br' }, desde: -400 },
    pr5: { remuneracao: 'folha', colaboradorId: 'c5', apelido: 'Sérgio', bio: 'Técnico em administração; é da equipe (CLT) e dá as turmas de Assistente Administrativo.', custoHoraReferencia: 38, desde: -2190, tag: 'TAG-0012' },
    pr6: { remuneracao: 'pj', apelido: 'Henrique', convidado: true, desde: -2 },
  };

  const EQUIPE = [
    { id: 'c1', nome: 'Marina Azevedo', cpf: '214587390', nascimento: '1978-09-12', cargo: 'Diretora', departamentoId: 'direcao', anos: 9, usuarioId: 'u1', email: 'marina@escolaatlas.com.br', celular: '43999120034', observacoes: 'Responsável legal pela escola.' },
    { id: 'c2', nome: 'Paula Ribeiro', cpf: '318745902', nascimento: '1990-02-27', cargo: 'Secretária', departamentoId: 'administrativo', anos: 4, usuarioId: 'u2', email: 'paula@escolaatlas.com.br', celular: '43988745512' },
    { id: 'c3', nome: 'Renato Siqueira', cpf: '427519863', nascimento: '1986-06-08', cargo: 'Analista financeiro', departamentoId: 'financeiro', anos: 3, usuarioId: 'u3', email: 'renato@escolaatlas.com.br', celular: '43996671120' },
    { id: 'c4', nome: 'Camila Duarte', cpf: '536028174', nascimento: '1983-12-01', cargo: 'Coordenadora pedagógica', departamentoId: 'pedagogico', anos: 6, usuarioId: 'u4', email: 'camila@escolaatlas.com.br', celular: '43984410098' },
    { id: 'c5', nome: 'Sérgio Albuquerque', cpf: '645193728', nascimento: '1975-04-19', cargo: 'Instrutor e assistente de coordenação', departamentoId: 'pedagogico', anos: 6, usuarioId: 'u9', email: 'sergio.albuquerque@escolaatlas.com.br', celular: '43991234505', observacoes: 'CLT. Também dá aula (instrutor de folha).' },
    { id: 'c6', nome: 'Lucas Fernandes', cpf: '754306281', nascimento: '', cargo: 'Auxiliar administrativo', departamentoId: 'administrativo', dias: -12, usuarioId: 'u10', email: 'lucas@escolaatlas.com.br', celular: '' },
    { id: 'c7', nome: 'Tatiane Moura', cpf: '863417592', nascimento: '1994-07-15', cargo: 'Recepcionista', departamentoId: 'administrativo', anos: 2, email: '', celular: '43995540021', afastamento: { inicio: -60, retorno: 60, motivo: 'maternidade' } },
    { id: 'c8', nome: 'Bianca Lopes', cpf: '972530418', nascimento: '2004-01-23', cargo: 'Estagiária de marketing', departamentoId: 'marketing', dias: -140, email: 'bianca.lopes@escolaatlas.com.br', celular: '43992234410' },
    { id: 'c9', nome: 'Diego Barros', cpf: '081624937', nascimento: '1992-10-05', cargo: 'Consultor comercial', departamentoId: 'comercial', anos: 2, email: '', celular: '43991876650', desligamento: { dias: -120, motivo: 'pedido' } },
  ];

  function pessoas(db, hoje) {
    const { somarDias, arred } = Aulor;
    const ate = (d) => (d < hoje ? d : hoje);
    const ano = Number(hoje.slice(0, 4));
    const ev = (em, texto) => ({ em, texto });
    const turma = (id) => db.turmas.find((t) => t.id === id);
    const curso = (id) => db.cursos.find((c) => c.id === id);

    // ---------- Colaboradores ----------
    db.colaboradores = EQUIPE.map((e, n) => {
      const admissao = e.anos ? somarDias(hoje, -365 * e.anos - 40 * n) : somarDias(hoje, e.dias);
      const historico = [ev(admissao, `Admitido(a) como ${e.cargo.toLowerCase()}`)];
      const afastamento = e.afastamento ? { inicio: somarDias(hoje, e.afastamento.inicio), previsaoRetorno: somarDias(hoje, e.afastamento.retorno), motivo: e.afastamento.motivo } : null;
      if (afastamento) historico.push(ev(afastamento.inicio, 'Afastado(a) — licença-maternidade/paternidade'));
      const desligamento = e.desligamento ? { data: somarDias(hoje, e.desligamento.dias), motivo: e.desligamento.motivo } : null;
      if (desligamento) historico.push(ev(desligamento.data, 'Desligado(a) — pedido de desligamento'));
      return {
        id: e.id, matricula: String(n + 1).padStart(4, '0'), nome: e.nome, nomeSocial: '', cpf: cpfComDv(e.cpf), nascimento: e.nascimento,
        cargo: e.cargo, departamentoId: e.departamentoId, admissao,
        status: desligamento ? 'desligado' : afastamento ? 'afastado' : 'ativo', desligamento, afastamento,
        contato: { email: e.email, celular: e.celular }, acesso: { usuarioId: e.usuarioId ?? null },
        observacoes: e.observacoes ?? '', historico,
      };
    });

    // ---------- Instrutores ----------
    // Tabela padrão: valor base + degraus por tamanho de turma e por curso longo (como no original).
    const tabela = (id, base) => [
      { id: `${id}-vh1`, nome: 'Padrão', valor: base, alunosMin: null, alunosMax: null, horasMin: null, horasMax: null },
      { id: `${id}-vh2`, nome: 'Turma pequena (até 8 alunos)', valor: Math.round(base * 0.85), alunosMin: null, alunosMax: 8, horasMin: null, horasMax: null },
      { id: `${id}-vh3`, nome: 'Turma grande (16+ alunos)', valor: Math.round(base * 1.15), alunosMin: 16, alunosMax: null, horasMin: null, horasMax: null },
      { id: `${id}-vh4`, nome: 'Curso longo (40 h ou mais)', valor: Math.round(base * 0.95), alunosMin: null, alunosMax: null, horasMin: 40, horasMax: null },
    ];
    // Mesma regra do motor (Instrutores.valorHoraPara): a faixa mais específica que casa; empate → maior valor.
    function itemDe(t, valoresHora) {
      const horas = curso(t.cursoId).cargaHoraria;
      const alunos = t.capacidade;
      const casa = (f) => (f.alunosMin == null || alunos >= f.alunosMin) && (f.alunosMax == null || alunos <= f.alunosMax) && (f.horasMin == null || horas >= f.horasMin) && (f.horasMax == null || horas <= f.horasMax);
      const esp = (f) => [f.alunosMin, f.alunosMax, f.horasMin, f.horasMax].filter((x) => x != null).length;
      const f = valoresHora.filter(casa).sort((a, b) => esp(b) - esp(a) || b.valor - a.valor)[0];
      return { id: `it-${t.id}`, turmaId: t.id, cursoId: t.cursoId, horas, alunos, valorHoraId: f.id, valorHora: f.valor, total: horas * f.valor };
    }
    const codigos = {};
    function contrato(id, turmaIds, valoresHora, status, criadoEm, rem) {
      const a = criadoEm.slice(0, 4);
      codigos[a] = (codigos[a] ?? 0) + 1;
      const c = { id, codigo: `CI-${a}-${String(codigos[a]).padStart(3, '0')}`, tipo: 'cursos', formacaoId: null, itens: turmaIds.map((t) => itemDe(turma(t), valoresHora)), status, criadoEm, documento: null, clicksign: null, observacoes: '', historico: [ev(criadoEm, 'Contrato criado')] };
      if (status === 'rascunho') return c;
      const gerado = somarDias(criadoEm, 1);
      c.documento = { versao: 1, geradoEm: gerado };
      c.historico.push(ev(gerado, 'Documento gerado (v1)'));
      const enviado = somarDias(criadoEm, 1);
      c.clicksign = { envelopeId: `cs-${id}`, enviadoEm: enviado, instrutorAssinouEm: ate(somarDias(criadoEm, 2)), escolaAssinouEm: status === 'assinatura' ? null : ate(somarDias(criadoEm, 3)) };
      c.historico.push(ev(enviado, 'Enviado ao Clicksign'), ev(c.clicksign.instrutorAssinouEm, `Assinado pelo instrutor (Clicksign)${rem === 'rpa' ? ' — RPA' : ''}`));
      if (c.clicksign.escolaAssinouEm) c.historico.push(ev(c.clicksign.escolaAssinouEm, 'Assinado pela escola (Clicksign)'));
      return c;
    }
    const pagamento = (id, c, itemTurma, tipo, descricao, fracao, previsto, { nf = null, pagoEm = null } = {}) => {
      const it = c.itens.find((x) => x.turmaId === itemTurma);
      return { id, contratoId: c.id, itemId: it.id, tipo, descricao, valor: arred(it.total * fracao), previsto, nf, pagoEm };
    };
    const nf = (numero, emitidaEm, recibo = false) => ({ numero, emitidaEm, arquivo: `${recibo ? 'recibo' : 'nf'}-${numero}.pdf` });

    db.professores = PROFESSORES.map((p, n) => {
      const d = DOCENTES[p.id];
      const desde = somarDias(hoje, d.desde);
      const vh = d.remuneracao === 'folha' ? [] : tabela(p.id, p.valorHora);
      const i = {
        id: p.id, nome: p.nome, apelido: d.apelido, status: 'ativo', remuneracao: d.remuneracao, colaboradorId: d.colaboradorId ?? null, foto: null,
        nascimento: d.colaboradorId ? '' : (d.nascimento ?? ''), cpf: d.colaboradorId || !d.cpf ? '' : cpfComDv(d.cpf), rg: d.rg ?? '',
        especialidade: p.especialidade, bio: d.bio ?? '',
        endereco: d.cep ? { cep: d.cep, logradouro: d.rua, numero: d.numero, complemento: '', bairro: d.bairro, cidade: 'Londrina', uf: 'PR' } : { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: 'Londrina', uf: 'PR' },
        contato: { email: p.email, whatsapp: p.telefone, emergencia: { nome: d.emergencia ?? '', telefone: d.emergencia ? `4398${String(8120000 + n * 1111)}` : '' } },
        empresa: d.empresa ? { cnpj: cnpjComDv(d.empresa[1]), razaoSocial: d.empresa[0], banco: d.empresa[2], agencia: '0730', conta: `${41208 + n * 913}-${n}`, pix: cnpjComDv(d.empresa[1]) } : null,
        contaPessoal: d.contaPessoal ?? null,
        custoHoraReferencia: d.custoHoraReferencia ?? null,
        valoresHora: vh, contratos: [], pagamentos: [],
        antecedentes: d.convidado ? [] : d.antecedentesAtrasados ? [{ id: `ant-${ano - 1}`, ano: ano - 1, enviadoEm: `${ano - 1}-02-10`, arquivo: `antecedentes-${ano - 1}.pdf` }] : [{ id: `ant-${ano}`, ano, enviadoEm: ate(`${ano}-01-${String(12 + n).padStart(2, '0')}`), arquivo: `antecedentes-${ano}.pdf` }],
        lgpd: d.convidado || d.semLgpd ? null : { aceitoEm: desde, versao: LGPD_VERSAO },
        tagEstacionamento: d.tag ? { possui: true, identificacao: d.tag, cedidaEm: desde, devolvidaEm: '' } : { possui: false, identificacao: '', cedidaEm: '', devolvidaEm: '' },
        cadastro: d.convidado ? { token: `convite-${p.id}-${hoje.replaceAll('-', '')}`, criadoEm: desde, preenchidoEm: '' } : null,
        observacoes: '', historico: [ev(desde, d.convidado ? 'Convite enviado para completar o cadastro' : 'Cadastro criado')],
      };
      return i;
    });

    const prof = (id) => db.professores.find((p) => p.id === id);
    const criadoAntes = (ids, dias) => somarDias(ids.map((t) => turma(t).inicio).sort()[0], -dias);

    // Carlos (PJ): turma concluída paga e encerrada; duas turmas em andamento num contrato assinado; tu7 sem contrato.
    const carlos = prof('pr1');
    const c1 = contrato('ci-pr1-1', ['tu1'], carlos.valoresHora, 'encerrado', criadoAntes(['tu1'], 12), 'pj');
    const t1 = turma('tu1');
    carlos.pagamentos.push(pagamento('pg-pr1-1', c1, 'tu1', 'curso', 'Curso completo', 1, somarDias(t1.fim, 10), { nf: nf('1187', somarDias(t1.fim, 3)), pagoEm: somarDias(t1.fim, 10) }));
    c1.historico.push(ev(somarDias(t1.fim, 10), 'Pagamento registrado'), ev(somarDias(t1.fim, 11), 'Contrato encerrado'));
    const c2 = contrato('ci-pr1-2', ['tu2', 'tu8'], carlos.valoresHora, 'assinado', criadoAntes(['tu2', 'tu8'], 9), 'pj');
    const t2 = turma('tu2');
    carlos.pagamentos.push(pagamento('pg-pr1-2', c2, 'tu2', 'curso', 'Curso completo', 1, somarDias(hoje, 3), { nf: nf('1203', ate(somarDias(t2.fim, 2))) }));
    carlos.pagamentos.push(pagamento('pg-pr1-3', c2, 'tu8', 'parcial', 'Primeira metade das aulas', 0.5, somarDias(hoje, 12)));
    carlos.contratos.push(c1, c2);

    // Juliana (PJ): contrato enviado ao Clicksign, falta a escola assinar; antecedentes do ano não chegaram.
    const juliana = prof('pr2');
    juliana.contratos.push(contrato('ci-pr2-1', ['tu3'], juliana.valoresHora, 'assinatura', ate(somarDias(hoje, -4)), 'pj'));

    // Rafael (PJ, sem empresa ainda): rascunho para a turma online que começa em breve.
    const rafael = prof('pr3');
    rafael.contratos.push(contrato('ci-pr3-1', ['tu6'], rafael.valoresHora, 'rascunho', somarDias(hoje, -1), 'pj'));

    // Beatriz (RPA): contrato assinado, primeira parte com recibo, aguardando o pagamento.
    const beatriz = prof('pr4');
    const c5 = contrato('ci-pr4-1', ['tu4'], beatriz.valoresHora, 'assinado', criadoAntes(['tu4'], 6), 'rpa');
    beatriz.pagamentos.push(pagamento('pg-pr4-1', c5, 'tu4', 'parcial', 'Primeira metade das aulas', 0.5, somarDias(hoje, 5), { nf: nf('RPA-0042', ate(somarDias(hoje, -1)), true) }));
    beatriz.contratos.push(c5);

    db.professores.forEach((i) => {
      i.contratos.forEach((c) => i.historico.push(ev(c.criadoEm, `Contrato ${c.codigo} criado`)));
      i.historico.sort((a, b) => a.em.localeCompare(b.em));
    });
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
      professores: PROFESSORES.map((p) => ({ id: p.id, nome: p.nome })), // registro completo em pessoas()
      colaboradores: [],
      cursos: CURSOS.map((c) => ({ modeloCertificadoId: null, ...c, modulos: c.modulos.map((m) => ({ ...m })), ativo: true })),
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
        status: 'ativa', resultado: null, frequenciaFinal: null, concluidaEm: null, canceladaEm: null, motivoCancelamento: '', criadaPor: 'Paula Ribeiro',
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
      Object.assign(m, { status: 'concluida', frequenciaFinal: freq, resultado: freq >= 75 ? 'aprovado' : 'reprovado_frequencia', concluidaEm: t1.concluidaEm });
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
      PROFESSORES.filter((p) => DOCENTES[p.id].remuneracao !== 'folha').forEach((p) => { // folha: a aula já está no salário
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
    pessoas(db, hoje);
    return db;
  }

  return { gerar };
})();
