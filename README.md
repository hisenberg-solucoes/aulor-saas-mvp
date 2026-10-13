# Aulor SaaS — protótipo do MVP comercial

Protótipo navegável de um ERP para escolas de cursos livres. Usa uma escola fictícia, a Atlas Cursos Profissionalizantes. É um clone independente do protótipo `snorlax-jornada`, que continua intacto.

- [MVP_SCOPE.md](MVP_SCOPE.md): o que foi reaproveitado, simplificado e adiado, o escopo do MVP e as decisões.
- [ROTEIRO_DEMO.md](ROTEIRO_DEMO.md): demonstração comercial de 10 minutos.
- [BACKLOG.md](BACKLOG.md): backlog até o SaaS real, riscos e decisões pendentes.

**Demonstração online:** https://hisenberg-solucoes.github.io/aulor-saas-mvp/ (os dados ficam no navegador de quem abre; use *Demonstração › Restaurar dados iniciais* para recomeçar).

## Rodar localmente

Na raiz deste diretório:

```bash
python3 -m http.server 8770
```

Abra `http://localhost:8770/` e escolha com quem entrar. Não há build nem dependências: HTML estático, Tailwind v4 pelo CDN e JavaScript sem framework, no mesmo padrão do original.

## Testes

```bash
node --test tests/aulor.test.mjs
```

Os testes cobrem as regras do motor (parcelas, matrícula → financeiro → turma, chamada, conclusão, certificado, planos e permissões) e a coerência da semente em várias datas.

## Estrutura

| Arquivo | Papel |
|---|---|
| `js/aulor.js` | Base única da escola e todas as regras de negócio |
| `js/semente.js` | Escola fictícia gerada a partir da data de hoje (determinística) |
| `js/planos.js` | Catálogo comercial: módulos por plano, alunos incluídos, faixas (hipótese) |
| `js/permissoes-data.js` | Catálogo de permissões `tela.ação` e perfis padrão |
| `js/permissoes-motor.js`, `js/permissoes-app.js` | Motor e telas de perfis, reaproveitados do original |
| `js/shell.js` | Menu por módulos (os mesmos grupos do original), cabeçalho, sessão de demonstração e controle de acesso (permissão + plano) |
| `js/base.js`, `js/ui-form.js`, `js/formularios.js` | Componentes de tela e formulários compartilhados |
| `js/certificado.js` | Render e impressão do certificado a partir de um modelo (CSS do original) |
| `js/modelos-certificado-ui.js` | Peças comuns da lista e do editor de modelos de certificado |
| `js/*-app.js` | Uma por página |
| `_tools/gerar_paginas.py` | Gera os `.html` (mesmo esqueleto; o layout vem do `shell.js`). Para criar uma tela, acrescente-a em `PAGINAS` e em `Shell.MENU` |

Os dados ficam no `localStorage` deste navegador (`aulor-mvp-dados-v3` e `aulor-mvp-acessos-v1`). Em **Demonstração › Restaurar dados iniciais**, a escola é gerada de novo. Isso existe só para demonstrar: não é isolamento entre escolas nem segurança.
