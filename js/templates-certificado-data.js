// ============================================================
// Templates de certificado — semente e catálogos fixos.
// Um template tem aparência comum (cores, fonte, moldura, orientação) e dois
// lados: FRENTE (título, textos com variáveis, assinaturas) e VERSO (conteúdo
// programático / cursos da formação, requisitos, texto livre, rodapé).
// Os textos aceitam variáveis {{nome}} (ver VARIAVEIS_CERTIFICADO) e **negrito**.
// ============================================================

const VARIAVEIS_CERTIFICADO = [
  { id: 'aluno', nome: 'Nome do aluno', descricao: 'Nome social, quando houver; senão o nome civil.', lados: ['curso', 'formacao'] },
  { id: 'cpf', nome: 'CPF do aluno', descricao: 'Com máscara (000.000.000-00).', lados: ['curso', 'formacao'] },
  { id: 'curso', nome: 'Nome do curso', descricao: 'Nome do curso concluído.', lados: ['curso'] },
  { id: 'codigoCurso', nome: 'Código do curso', descricao: 'Código do curso no catálogo.', lados: ['curso'] },
  { id: 'turma', nome: 'Código da turma', descricao: 'Ex.: PY-2026-03.', lados: ['curso'] },
  { id: 'formato', nome: 'Formato da turma', descricao: 'presencial, online ao vivo, híbrido ou EAD.', lados: ['curso'] },
  { id: 'instrutor', nome: 'Instrutor', descricao: 'Instrutor da turma.', lados: ['curso'] },
  { id: 'formacao', nome: 'Nome da formação', descricao: 'No certificado de curso, a formação da qual ele faz parte (vazio se avulso).', lados: ['curso', 'formacao'] },
  { id: 'codigoFormacao', nome: 'Código da formação', descricao: 'Código da formação no catálogo.', lados: ['formacao'] },
  { id: 'qtdCursos', nome: 'Quantidade de cursos', descricao: 'Ex.: "6 cursos".', lados: ['formacao'] },
  { id: 'inicio', nome: 'Data de início', descricao: 'dd/mm/aaaa.', lados: ['curso', 'formacao'] },
  { id: 'fim', nome: 'Data de término', descricao: 'dd/mm/aaaa.', lados: ['curso', 'formacao'] },
  { id: 'periodo', nome: 'Período', descricao: 'início a término.', lados: ['curso', 'formacao'] },
  { id: 'cargaHoraria', nome: 'Carga horária', descricao: 'Ex.: "40 h".', lados: ['curso', 'formacao'] },
  { id: 'dataEmissao', nome: 'Data de emissão', descricao: 'Por extenso (12 de setembro de 2026).', lados: ['curso', 'formacao'] },
  { id: 'cidade', nome: 'Cidade da escola', descricao: 'Blumenau.', lados: ['curso', 'formacao'] },
  { id: 'codigoValidacao', nome: 'Código de validação', descricao: 'Ex.: PW-PY202603-1A2B-3C4D.', lados: ['curso', 'formacao'] },
  { id: 'matricula', nome: 'Código da matrícula', descricao: 'Número da matrícula do aluno na turma.', lados: ['curso'] },
];

const ORIENTACOES_CERTIFICADO = [
  { id: 'paisagem', nome: 'Paisagem', descricao: 'A4 deitado (297 × 210 mm) — o formato clássico de certificado.' },
  { id: 'retrato', nome: 'Retrato', descricao: 'A4 em pé (210 × 297 mm) — bom para verso com muito conteúdo.' },
];

const FONTES_CERTIFICADO = [
  { id: 'sans', nome: 'Moderna', descricao: 'Plus Jakarta Sans — sem serifa, de linhas limpas.', css: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" },
  { id: 'serif', nome: 'Clássica', descricao: 'Georgia / Times — ar tradicional de diploma.', css: "Georgia, 'Times New Roman', Times, serif" },
];

const MOLDURAS_CERTIFICADO = [
  { id: 'dupla', nome: 'Dupla', descricao: 'Borda grossa na cor primária com filete interno na cor de destaque.' },
  { id: 'simples', nome: 'Simples', descricao: 'Só um filete fino na cor primária.' },
  { id: 'lateral', nome: 'Faixa lateral', descricao: 'Sem borda; uma faixa vertical na cor de destaque à esquerda.' },
  { id: 'nenhuma', nome: 'Nenhuma', descricao: 'Sem moldura — use quando o fundo já é uma arte pronta.' },
];

const STATUS_TEMPLATE_CERTIFICADO = [
  { id: 'ativo', nome: 'Ativo', descricao: 'Pode ser escolhido nos cursos/formações e emite certificados.' },
  { id: 'rascunho', nome: 'Rascunho', descricao: 'Em construção — ainda não aparece para escolha.' },
  { id: 'inativo', nome: 'Inativo', descricao: 'Guardado no histórico; quem o usava volta para o padrão.' },
];

const APLICA_A_CERTIFICADO = [
  { id: 'curso', nome: 'Curso', descricao: 'Certificado de conclusão de um curso (uma turma).' },
  { id: 'formacao', nome: 'Formação', descricao: 'Certificado único da formação inteira, com a carga horária total.' },
];

const TEMPLATES_CERTIFICADO_SEED = [
  {
    id: 'tc1', nome: 'ProWay — curso', descricao: 'Modelo institucional em paisagem, moldura dupla petróleo e laranja.',
    aplicaA: 'curso', padrao: true, status: 'ativo',
    aparencia: { orientacao: 'paisagem', fonte: 'sans', moldura: 'dupla', corPrimaria: '#0B2D3C', corDestaque: '#C47A3A', corTexto: '#1E293B' },
    frente: {
      fundoImagem: null, fundoOpacidade: 100,
      mostrarLogo: true, logoImagem: null, instituicao: 'ProWay', subInstituicao: 'Informática e Treinamentos',
      rotuloTopo: 'Certificado de conclusão',
      titulo: 'Certificado',
      introducao: 'Certificamos que',
      mostrarCpf: true,
      corpo: 'concluiu o curso **{{curso}}**, realizado na turma **{{turma}}** ({{formato}}) no período de {{periodo}}, com carga horária de **{{cargaHoraria}}**.',
      localData: '{{cidade}}, {{dataEmissao}}.',
      mostrarCodigo: true, textoValidacao: 'Valide em proway.com.br/certificados',
      assinaturas: [
        { nome: 'Direção ProWay', cargo: 'Coordenação pedagógica', imagem: null },
        { nome: '{{instrutor}}', cargo: 'Instrutor', imagem: null },
      ],
    },
    verso: {
      fundoImagem: null, fundoOpacidade: 100,
      titulo: 'Conteúdo programático',
      mostrarConteudo: true, mostrarTopicos: true, mostrarCargaPorItem: true,
      mostrarRequisitos: true, tituloRequisitos: 'Requisitos cumpridos',
      textoLivre: '',
      rodape: 'ProWay Informática e Treinamentos · {{cidade}} · Código de validação {{codigoValidacao}}',
    },
    criadoEm: '2026-08-01', atualizadoEm: '2026-08-01',
  },
  {
    id: 'tc2', nome: 'ProWay — formação', descricao: 'Mesma identidade do curso, texto voltado à formação e verso com a lista de cursos.',
    aplicaA: 'formacao', padrao: true, status: 'ativo',
    aparencia: { orientacao: 'paisagem', fonte: 'sans', moldura: 'dupla', corPrimaria: '#0B2D3C', corDestaque: '#C47A3A', corTexto: '#1E293B' },
    frente: {
      fundoImagem: null, fundoOpacidade: 100,
      mostrarLogo: true, logoImagem: null, instituicao: 'ProWay', subInstituicao: 'Informática e Treinamentos',
      rotuloTopo: 'Certificado de formação',
      titulo: 'Certificado',
      introducao: 'Certificamos que',
      mostrarCpf: true,
      corpo: 'concluiu a formação **{{formacao}}** ({{codigoFormacao}}), composta por {{qtdCursos}}, no período de {{periodo}}, com carga horária total de **{{cargaHoraria}}**.',
      localData: '{{cidade}}, {{dataEmissao}}.',
      mostrarCodigo: true, textoValidacao: 'Valide em proway.com.br/certificados',
      assinaturas: [
        { nome: 'Direção ProWay', cargo: 'Coordenação pedagógica', imagem: null },
        { nome: 'Coordenação da formação', cargo: '{{codigoFormacao}}', imagem: null },
      ],
    },
    verso: {
      fundoImagem: null, fundoOpacidade: 100,
      titulo: 'Cursos da formação',
      mostrarConteudo: true, mostrarTopicos: false, mostrarCargaPorItem: true,
      mostrarRequisitos: true, tituloRequisitos: 'Requisitos cumpridos',
      textoLivre: '',
      rodape: 'ProWay Informática e Treinamentos · {{cidade}} · Código de validação {{codigoValidacao}}',
    },
    criadoEm: '2026-08-01', atualizadoEm: '2026-08-01',
  },
  {
    id: 'tc3', nome: 'Clássico — retrato', descricao: 'Versão em pé com fonte serifada e filete simples, para cursos de gestão e carreira.',
    aplicaA: 'curso', padrao: false, status: 'ativo',
    aparencia: { orientacao: 'retrato', fonte: 'serif', moldura: 'simples', corPrimaria: '#1F2937', corDestaque: '#B45309', corTexto: '#1F2937' },
    frente: {
      fundoImagem: null, fundoOpacidade: 100,
      mostrarLogo: true, logoImagem: null, instituicao: 'ProWay', subInstituicao: 'Informática e Treinamentos',
      rotuloTopo: 'Certificado de conclusão',
      titulo: 'Certificado',
      introducao: 'Conferimos o presente certificado a',
      mostrarCpf: true,
      corpo: 'por ter concluído com aproveitamento o curso **{{curso}}**, ministrado por {{instrutor}} entre {{inicio}} e {{fim}}, com carga horária de **{{cargaHoraria}}**.',
      localData: '{{cidade}}, {{dataEmissao}}.',
      mostrarCodigo: true, textoValidacao: 'Autenticidade em proway.com.br/certificados',
      assinaturas: [
        { nome: 'Direção ProWay', cargo: 'Coordenação pedagógica', imagem: null },
      ],
    },
    verso: {
      fundoImagem: null, fundoOpacidade: 100,
      titulo: 'Programa do curso',
      mostrarConteudo: true, mostrarTopicos: true, mostrarCargaPorItem: true,
      mostrarRequisitos: false, tituloRequisitos: 'Requisitos cumpridos',
      textoLivre: 'Este certificado é um documento de participação em curso livre, nos termos da Lei nº 9.394/96 (art. 42) e do Decreto nº 5.154/04.',
      rodape: 'ProWay Informática e Treinamentos · {{cidade}}',
    },
    criadoEm: '2026-08-15', atualizadoEm: '2026-08-20',
  },
  {
    id: 'tc4', nome: 'Bootcamp — dark', descricao: 'Experimento para as formações intensivas: sem moldura, cores escuras. Ainda em rascunho.',
    aplicaA: 'formacao', padrao: false, status: 'rascunho',
    aparencia: { orientacao: 'paisagem', fonte: 'sans', moldura: 'lateral', corPrimaria: '#111827', corDestaque: '#10B981', corTexto: '#111827' },
    frente: {
      fundoImagem: null, fundoOpacidade: 100,
      mostrarLogo: true, logoImagem: null, instituicao: 'ProWay', subInstituicao: 'Bootcamps',
      rotuloTopo: 'Bootcamp concluído',
      titulo: 'Certificado',
      introducao: 'Este certificado reconhece que',
      mostrarCpf: false,
      corpo: 'completou o bootcamp **{{formacao}}** — {{qtdCursos}}, {{cargaHoraria}} de prática intensiva entre {{inicio}} e {{fim}}.',
      localData: '{{cidade}}, {{dataEmissao}}.',
      mostrarCodigo: true, textoValidacao: 'proway.com.br/certificados',
      assinaturas: [
        { nome: 'Direção ProWay', cargo: 'Coordenação pedagógica', imagem: null },
      ],
    },
    verso: {
      fundoImagem: null, fundoOpacidade: 100,
      titulo: 'Trilha do bootcamp',
      mostrarConteudo: true, mostrarTopicos: false, mostrarCargaPorItem: true,
      mostrarRequisitos: true, tituloRequisitos: 'Entregas',
      textoLivre: '',
      rodape: '{{codigoValidacao}}',
    },
    criadoEm: '2026-09-01', atualizadoEm: '2026-09-05',
  },
];
