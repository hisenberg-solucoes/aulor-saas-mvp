// ============================================================
// Menu lateral compartilhado. A sidebar é IDÊNTICA em todas as telas: item
// "Meu dia" e "Todos os módulos" fixos no topo + grupos na mesma ordem,
// colapsáveis (estado em localStorage['prototipo-home-menus']); só muda o
// destaque do item ativo — o grupo dele abre nesta visita, sem gravar estado.
// Páginas de detalhe (turma.html, curso.html…) herdam o item da lista via
// MENU_ALIAS. Para incluir um módulo novo: acrescente em MENU_GRUPOS (uma
// vez) — todas as páginas passam a exibi-lo. Carregar com `defer` depois de
// tooltip.js.
// ============================================================

const MENU_GRUPOS = [
  {
    "id": "diretoria",
    "nome": "Diretoria",
    "itens": [
      {
        "href": "diretoria.html",
        "nome": "Visão executiva",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941\" />"
      },
      {
        "href": "metas.html",
        "nome": "Metas",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M12 21a9 9 0 100-18 9 9 0 000 18z\" /><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9z\" /><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M12 12h.008v.008H12V12z\" />"
      },
      {
        "href": "resultados.html",
        "nome": "Resultados",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605\" />"
      },
      {
        "href": "faturamento.html",
        "nome": "Faturamento por curso",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" />"
      },
      {
        "href": "receitas-despesas.html",
        "nome": "Receitas × Despesas",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z\" />"
      }
    ]
  },
  {
    "id": "comercial",
    "nome": "Comercial",
    "itens": [
      {
        "href": "contratos.html",
        "nome": "Vendas",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z\" />"
      },
      {
        "href": "turmas-risco.html",
        "nome": "Turmas em risco",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z\" />"
      },
      {
        "href": "empresas.html",
        "nome": "Empresas",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21\" />"
      },
      {
        "href": "alunos.html",
        "nome": "Alunos",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z\" />"
      },
      {
        "href": "ocorrencias.html",
        "nome": "Ocorrências",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z\" />"
      },
      {
        "href": "responsaveis.html",
        "nome": "Responsáveis",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z\" />"
      },
      {
        "href": "spc.html",
        "nome": "Consulta SPC",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z\" />"
      }
    ]
  },
  {
    "id": "pedagogico",
    "nome": "Pedagógico",
    "itens": [
      {
        "href": "cursos.html",
        "nome": "Cursos",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.55 50.55 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5\" />"
      },
      {
        "href": "formacoes.html",
        "nome": "Formações",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122\" />"
      },
      {
        "href": "areas.html",
        "nome": "Áreas",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z\" />"
      },
      {
        "href": "turmas.html",
        "nome": "Turmas",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z\" />"
      },
      {
        "href": "alertas-frequencia.html",
        "nome": "Alertas de frequência",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z\" />"
      },
      {
        "href": "avaliacoes.html",
        "nome": "Feedback diário",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z\" />"
      },
      {
        "href": "questionarios.html",
        "nome": "Questionários de avaliação",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z\" />"
      },
      {
        "href": "templates-certificado.html",
        "nome": "Modelos de certificado",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5\" />"
      },
      {
        "href": "dossies.html",
        "nome": "Dossiês dos alunos",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z\" />"
      },
      {
        "href": "templates-dossie.html",
        "nome": "Modelos de dossiê",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z\" />"
      }
    ]
  },
  {
    "id": "secretaria-e-operacao",
    "nome": "Secretaria e operação",
    "itens": [
      {
        "href": "salas.html",
        "nome": "Salas",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21\" />"
      },
      {
        "href": "agenda-salas.html",
        "nome": "Agenda de salas",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5\" />"
      },
      {
        "href": "feriados.html",
        "nome": "Feriados",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5\" />"
      },
      {
        "href": "aniversariantes.html",
        "nome": "Aniversariantes",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z\" />"
      }
    ]
  },
  {
    "id": "financeiro",
    "nome": "Financeiro",
    "itens": [
      {
        "href": "financeiro.html",
        "nome": "Financeiro",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" />"
      },
      {
        "href": "cobrancas.html",
        "nome": "Cobranças",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z\" />"
      },
      {
        "href": "pagamentos-instrutores.html",
        "nome": "Pagamentos de instrutores",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25h-15a2.25 2.25 0 00-2.25 2.25v10.5a2.25 2.25 0 002.25 2.25z\" />"
      },
      {
        "href": "compras.html",
        "nome": "Compras",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z\" />"
      },
      {
        "href": "categorias-financeiras.html",
        "nome": "Categorias/Produtos",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z\" /><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M6 6h.008v.008H6V6z\" />"
      },
      {
        "href": "contas-bancarias.html",
        "nome": "Contas bancárias",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z\" />"
      },
      {
        "href": "centros-custo.html",
        "nome": "Centros de custo",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6\" />"
      },
      {
        "href": "fornecedores.html",
        "nome": "Fornecedores",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12\" />"
      }
    ]
  },
  {
    "id": "pessoas",
    "nome": "Pessoas",
    "itens": [
      {
        "href": "colaboradores.html",
        "nome": "Colaboradores",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z\" />"
      },
      {
        "href": "instrutores.html",
        "nome": "Instrutores",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.55 50.55 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5\" />"
      }
    ]
  },
  {
    "id": "suporte-e-ti",
    "nome": "Suporte e TI",
    "itens": [
      {
        "href": "meus-chamados.html",
        "nome": "Meus chamados",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z\" />"
      },
      {
        "href": "chamados.html",
        "nome": "Chamados (suporte)",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z\" />"
      }
    ]
  },
  {
    "id": "configuracoes",
    "nome": "Configurações",
    "itens": [
      {
        "href": "perfis.html",
        "nome": "Perfis de acesso",
        "icone": "<path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z\" />"
      }
    ]
  }
];

// Página de detalhe/apoio → item de menu que ela representa.
const MENU_ALIAS = {
  'turma.html': 'turmas.html', 'turma-historico.html': 'turmas.html', 'agendamento.html': 'turmas.html', 'aulas.html': 'turmas.html',
  'curso.html': 'cursos.html', 'formacao.html': 'formacoes.html', 'sala.html': 'salas.html', 'fornecedor.html': 'fornecedores.html', 'conta-bancaria.html': 'contas-bancarias.html', 'contrato.html': 'contratos.html',
  'empresa.html': 'empresas.html', 'aluno.html': 'alunos.html', 'responsavel.html': 'responsaveis.html', 'instrutor.html': 'instrutores.html',
  'colaborador.html': 'colaboradores.html', 'chamado.html': 'chamados.html', 'meu-chamado.html': 'meus-chamados.html',
  'perfil.html': 'perfis.html', 'permissoes.html': 'perfis.html', 'questionario.html': 'questionarios.html',
  'template-certificado.html': 'templates-certificado.html',
  'dossie.html': 'dossies.html', 'template-dossie.html': 'templates-dossie.html',
  'avaliacao-turma.html': 'avaliacoes.html', 'avaliacoes-instrutor.html': 'avaliacoes.html',
  'ceo.html': 'diretoria.html', 'comercial.html': 'contratos.html', 'pedagogico.html': 'turmas.html',
  'jornada-pedagogica.html': 'turmas.html', 'jornada-comercial.html': 'contratos.html', 'jornada-financeira.html': 'financeiro.html',
  'financeiro-indicadores.html': 'financeiro.html', 'suporte.html': 'chamados.html', 'compra.html': 'compras.html',
  'jornada-suporte.html': 'chamados.html',
};

const MENU_FIXOS = [
  {
    href: 'home.html', nome: 'Meu dia',
    icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />',
  },
  {
    href: 'home.html?visao=modulos', nome: 'Todos os módulos',
    icone: '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25V15.75z" />',
  },
];

(function () {
  const SETA = '<svg data-seta aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>';
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pagina = () => {
    const base = (location.pathname.split('/').pop() || 'home.html').toLowerCase();
    return base === 'home.html' && new URLSearchParams(location.search).get('visao') === 'modulos' ? 'home.html?visao=modulos' : base;
  };

  const item = (it, ativo) => `
        <a href="${it.href}" class="nav-item${ativo ? ' nav-item-ativo' : ''}"${ativo ? ' aria-current="page"' : ''}>
          <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">${it.icone}</svg>
          <span>${esc(it.nome)}</span>
        </a>`;

  // Mesma sidebar em todas as telas: Home + todos os grupos colapsáveis (estado
  // guardado). O grupo do item ativo abre nesta visita, sem alterar o estado salvo.
  function render(nav, atual) {
    const CHAVE = 'prototipo-home-menus';
    let estado = {};
    try { estado = JSON.parse(localStorage.getItem(CHAVE) || '{}'); } catch (_) { estado = {}; }
    let html = `
        <label class="shell-busca">
          <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input data-busca-menu type="search" placeholder="Buscar no menu" aria-label="Buscar no menu" autocomplete="off" />
        </label>`;
    html += MENU_FIXOS.map((it) => item(it, it.href === atual)).join('');
    html += MENU_GRUPOS.map((g) => `
        <div class="menu-grupo" data-grupo="${g.id}">
          <button type="button" data-toggle-grupo aria-expanded="true" aria-controls="grupo-${g.id}" class="menu-grupo-botao">
            <span>${esc(g.nome)}</span>${SETA}
          </button>
          <div id="grupo-${g.id}">${g.itens.map((it) => item(it, it.href === atual)).join('')}</div>
        </div>`).join('');
    nav.innerHTML = html;
    const aplicar = (grupo, aberto) => {
      const btn = grupo.querySelector('[data-toggle-grupo]');
      btn.setAttribute('aria-expanded', String(aberto));
      grupo.querySelector('#' + btn.getAttribute('aria-controls')).hidden = !aberto;
    };
    nav.querySelectorAll('.menu-grupo').forEach((grupo) => {
      const id = grupo.dataset.grupo;
      const temAtivo = !!grupo.querySelector('.nav-item-ativo');
      aplicar(grupo, temAtivo || estado[id] !== false);
      grupo.querySelector('[data-toggle-grupo]').addEventListener('click', () => {
        const aberto = grupo.querySelector('[data-toggle-grupo]').getAttribute('aria-expanded') !== 'true';
        estado[id] = aberto; localStorage.setItem(CHAVE, JSON.stringify(estado)); aplicar(grupo, aberto);
      });
    });
    const busca = nav.querySelector('[data-busca-menu]');
    const normalizar = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const filtrar = () => {
      const termo = normalizar(busca.value.trim());
      // style.display inline: a classe .hidden perde para o display:flex de .nav-item
      nav.querySelectorAll(':scope > .nav-item').forEach((a) => {
        a.style.display = !termo || normalizar(a.textContent).includes(termo) ? '' : 'none';
      });
      nav.querySelectorAll('.menu-grupo').forEach((grupo) => {
        let visiveis = 0;
        grupo.querySelectorAll('.nav-item').forEach((a) => {
          const mostra = !termo || normalizar(a.textContent).includes(termo);
          a.style.display = mostra ? '' : 'none';
          if (mostra) visiveis += 1;
        });
        grupo.hidden = !!termo && !visiveis;
        aplicar(grupo, termo ? true : !!grupo.querySelector('.nav-item-ativo') || estado[grupo.dataset.grupo] !== false);
      });
    };
    busca.addEventListener('input', filtrar);
    busca.addEventListener('keydown', (e) => { if (e.key === 'Escape') { busca.value = ''; filtrar(); busca.blur(); } });
    // A sidebar não muda de posição ao trocar de página: restaura o scroll da
    // visita anterior; o scrollIntoView('nearest') só age se o item ativo ficou
    // fora da área visível (ex.: chegada por link no conteúdo ou favorito).
    nav.scrollTop = Number(sessionStorage.getItem('prototipo-menu-scroll') || 0);
    nav.addEventListener('scroll', () => sessionStorage.setItem('prototipo-menu-scroll', String(nav.scrollTop)));
    nav.querySelector('.nav-item-ativo')?.scrollIntoView({ block: 'nearest' });
  }

  // `pagina.html#id`: rola até o elemento com aquele id depois que a tela renderizar (os apps montam o
  // conteúdo via JS) e o destaca por alguns segundos. Usado pelos atalhos de roteiro-mvp.html.
  function irParaHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    if (!document.getElementById('estilo-destaque-hash')) {
      const st = document.createElement('style'); st.id = 'estilo-destaque-hash';
      st.textContent = '.destaque-hash{box-shadow:0 0 0 3px #C47A3A,0 0 0 8px rgba(196,122,58,.25)!important;transition:box-shadow .3s ease}';
      document.head.appendChild(st);
    }
    let tentativas = 0;
    const tentar = () => {
      const el = document.getElementById(id);
      if (!el) { if (tentativas++ < 40) setTimeout(tentar, 100); return; }
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('destaque-hash');
      setTimeout(() => el.classList.remove('destaque-hash'), 3000);
    };
    tentar();
  }

  function iniciar() {
    irParaHash();
    window.addEventListener('hashchange', irParaHash);
    const nav = document.querySelector('aside[data-sidebar] nav');
    if (!nav) return;
    const p = pagina();
    render(nav, MENU_ALIAS[p] ?? p);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
