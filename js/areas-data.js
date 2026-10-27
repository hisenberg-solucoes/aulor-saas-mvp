// ============================================================
// Dados da tela "Áreas": áreas de negócio da escola em que cursos e
// formações são classificados (Desenvolvimento, Infra, Design, Marketing…).
// É outro conceito do EIXO pedagógico (js/cursos-data.js EIXOS: Front-end,
// Back-end, IA…), que classifica o curso dentro da matriz de uma formação.
// Semente = áreas reais da ProWay (agosto/2026) + Desenvolvimento (onde
// caem os cursos do Super DEV que já estão no protótipo).
// ============================================================

// Paleta das áreas: a marca quadrada ao lado do nome (listas, filtros) e o fill dos gráficos de vendas por área.
// Só o arco ciano→fúcsia + um cinza: verde, vermelho, âmbar e laranja já querem dizer estado ou cobre.
// 600 no claro e 400 no escuro para passar 3:1 sobre o cartão (#FFFFFF e #0A0A0A); medidas em DESIGN.md › Colors.
const CORES_AREA = [
  { id: 'cyan', nome: 'Ciano', ponto: 'bg-cyan-600 dark:bg-cyan-400', fill: 'fill-cyan-600 dark:fill-cyan-400' },
  { id: 'blue', nome: 'Azul', ponto: 'bg-blue-600 dark:bg-blue-400', fill: 'fill-blue-600 dark:fill-blue-400' },
  { id: 'violet', nome: 'Violeta', ponto: 'bg-violet-600 dark:bg-violet-400', fill: 'fill-violet-600 dark:fill-violet-400' },
  { id: 'fuchsia', nome: 'Fúcsia', ponto: 'bg-fuchsia-600 dark:bg-fuchsia-400', fill: 'fill-fuchsia-600 dark:fill-fuchsia-400' },
  { id: 'slate', nome: 'Cinza', ponto: 'bg-slate-600 dark:bg-slate-400', fill: 'fill-slate-600 dark:fill-slate-400' },
];

// Área removida (ou cor que não existe mais): marca vazada, para não se passar por uma cor da paleta.
const COR_AREA_REMOVIDA = { id: '', nome: 'Sem cor', ponto: 'ring-1 ring-inset ring-slate-400 dark:ring-neutral-500' };

// Ids que saíram da paleta em 16/10/2026 → o tom mais perto que ficou; nas áreas da semente, a cor nova delas.
const CORES_AREA_MIGRADAS = { sky: 'blue', indigo: 'blue', pink: 'fuchsia', rose: 'fuchsia', orange: 'violet', amber: 'cyan', emerald: 'cyan', teal: 'cyan' };

const STATUS_AREA = [
  { id: 'ativa', nome: 'Ativa', descricao: 'Pode ser escolhida em cursos e formações.' },
  { id: 'inativa', nome: 'Inativa', descricao: 'Some das opções; o que já está classificado nela continua.' },
];

const AREAS_SEED = [
  { id: 'dev', nome: 'Desenvolvimento', descricao: 'Programação, web, mobile, dados e IA.', cor: 'blue', status: 'ativa' },
  { id: 'infra', nome: 'Infra', descricao: 'Redes, servidores, suporte técnico e cloud.', cor: 'slate', status: 'ativa' },
  { id: 'design', nome: 'Design', descricao: 'Design gráfico, UX/UI, edição de imagem e audiovisual.', cor: 'fuchsia', status: 'ativa' },
  { id: 'marketing', nome: 'Marketing', descricao: 'Marketing digital, tráfego, conteúdo, SEO e branding.', cor: 'violet', status: 'ativa' },
  { id: 'produtividade', nome: 'Ferramentas de produtividade', descricao: 'Office, Google Workspace, Excel e Power BI.', cor: 'cyan', status: 'ativa' },
  { id: 'gestao', nome: 'Gestão', descricao: 'Liderança, metodologias ágeis, comunicação e finanças.', cor: 'cyan', status: 'ativa' },
  { id: 'engenharia', nome: 'Engenharia/Arquitetura', descricao: 'CAD, BIM, SolidWorks, Revit, interiores e impressão 3D.', cor: 'violet', status: 'ativa' },
  { id: 'moda', nome: 'Moda & Têxtil', descricao: 'Design de estampas, ilustração e desenho técnico de moda.', cor: 'fuchsia', status: 'ativa' },
];
