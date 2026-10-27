// ============================================================
// Menu do Portal do Aluno: Início fixo e os grupos da V1, na mesma ordem em
// todas as telas. Quem desenha a sidebar e a barra de contexto é o shell
// comum dos portais (../js/menu-portal.js, carregado depois deste). Páginas de
// detalhe (aula, curso, contrato) herdam o item da lista via MENU_ALIAS.
// ============================================================

const MENU_FIXOS = [
  {
    href: 'home.html', nome: 'Início',
    icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />',
  },
];

const MENU_GRUPOS = [
  {
    id: 'estudos', nome: 'Estudos',
    itens: [
      {
        href: 'cursos.html', nome: 'Meus cursos',
        icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.55 50.55 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />',
      },
      {
        href: 'aulas.html', nome: 'Aulas',
        icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />',
      },
      {
        href: 'calendario.html', nome: 'Calendário',
        icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5M8.25 12.75h.008v.008H8.25v-.008zm3.75 0h.008v.008H12v-.008zm3.75 0h.008v.008h-.008v-.008zM8.25 16.5h.008v.008H8.25V16.5zm3.75 0h.008v.008H12V16.5z" />',
      },
      {
        href: 'materiais.html', nome: 'Materiais',
        icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />',
      },
      {
        // Os cursos EAD ficam na Toolzz (plataforma externa): abre em nova aba.
        href: 'https://www.toolzz.com.br', nome: 'Cursos EAD', externo: 'na Toolzz',
        icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />',
      },
    ],
  },
  {
    id: 'secretaria', nome: 'Secretaria',
    itens: [
      {
        href: 'financeiro.html', nome: 'Financeiro',
        icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />',
      },
      {
        href: 'contratos.html', nome: 'Contratos',
        icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />',
      },
    ],
  },
  {
    id: 'conta', nome: 'Conta',
    itens: [
      {
        href: 'meus-dados.html', nome: 'Meus dados',
        icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />',
      },
    ],
  },
];

// Página de detalhe → item da lista que fica destacado.
const MENU_ALIAS = {
  'aula.html': 'aulas.html',
  'curso.html': 'cursos.html',
  'contrato.html': 'contratos.html',
};

// Quem está no portal (lida depois que a página carregou o motor) e para onde Sair leva.
const MENU_PORTAL = {
  id: 'aluno', nome: 'Portal do Aluno', papel: 'Aluno',
  pessoa: () => { const a = PortalAluno.alunoLogado(); return a && { nome: a.nomeSocial || a.nome, email: a.email }; },
  sair: () => { PortalAluno.sair(); location.href = '../entrar.html?portal=aluno&saiu=1'; },
};
