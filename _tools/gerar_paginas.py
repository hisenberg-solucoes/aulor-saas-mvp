# Gera os HTML do Aulor MVP (todas as páginas têm o mesmo esqueleto; o
# layout vem de js/shell.js). Uso, na raiz do projeto:
#   python3 _tools/gerar_paginas.py
import os
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = ['documento', 'agenda', 'planos', 'permissoes-data', 'permissoes-motor', 'aulor', 'semente', 'shell']
UI = ['base', 'ui-form', 'formularios']
PAGINAS = [
  # arquivo, título, acesso (features), scripts extras, app, atributos extras do <body>
  ('inicio', 'Visão geral', 'painel', [], 'inicio-app', ''),
  ('alunos', 'Alunos', 'alunos', [], 'alunos-app', ''),
  ('aluno', 'Aluno', 'alunos', [], 'aluno-app', ''),
  ('matriculas', 'Matrículas', 'matriculas', [], 'matriculas-app', ''),
  ('matricula', 'Matrícula', 'matriculas', [], 'matricula-app', ''),
  ('matricula-nova', 'Nova matrícula', 'matriculas', [], 'matricula-nova-app', ''),
  ('turmas-risco', 'Turmas em risco', 'turmas', [], 'turmas-risco-app', ''),
  ('cursos', 'Cursos', 'cursos', [], 'cursos-app', ''),
  ('curso', 'Curso', 'cursos', [], 'curso-app', ''),
  ('turmas', 'Turmas', 'turmas', [], 'turmas-app', ''),
  ('turma', 'Turma', 'turmas,frequencia,minhas-aulas', [], 'turma-app', ''),
  ('aulas', 'Aulas e chamadas', 'frequencia,minhas-aulas', [], 'aulas-app', ''),
  ('chamada', 'Chamada', 'frequencia,minhas-aulas', [], 'chamada-app', ''),
  ('alertas-frequencia', 'Alertas de frequência', 'frequencia', [], 'alertas-frequencia-app', ''),
  ('certificados', 'Certificados', 'certificados', ['certificado'], 'certificados-app', ''),
  ('certificado', 'Certificado', 'certificados', ['certificado'], 'certificado-app', ''),
  ('templates-certificado', 'Layout do certificado', 'configuracoes', ['certificado'], 'configuracoes-app', 'data-pagina="modelo-certificado"'),
  ('financeiro', 'Financeiro', 'receber,pagar', [], 'financeiro-app', ''),
  ('cobrancas', 'Cobranças', 'receber', [], 'cobrancas-app', ''),
  ('professores', 'Professores', 'professores', [], 'professores-app', ''),
  ('usuarios', 'Usuários', 'usuarios', [], 'usuarios-app', ''),
  ('configuracoes', 'Escola e regras', 'configuracoes', [], 'configuracoes-app', ''),
]

def pagina(titulo, acesso, extras, app, attrs_extra='', ui=True, sem_layout=False):
    scripts = BASE + (UI if ui else []) + extras + [app]
    attrs = f'data-titulo="{titulo}"' + (f' data-acesso="{acesso}"' if acesso else '') + (f' {attrs_extra}' if attrs_extra else '') + (' data-sem-layout' if sem_layout else '')
    linhas = '\n'.join(f'  <script src="js/{s}.js"></script>' for s in scripts)
    return f'''<!DOCTYPE html>
<html lang="pt-BR" class="h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aulor · {titulo}</title>
  <script src="js/tema.js"></script>
  <script src="js/estilo.js"></script>
  <script src="js/tooltip.js" defer></script>
  <!-- Tailwind v4 (browser build) — em produção, usar o build via PostCSS/Vite -->
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
</head>
<body {attrs}>
{linhas}
</body>
</html>
'''

def gravar(arquivo, html):
    open(os.path.join(raiz, arquivo + '.html'), 'w').write(html)

for arq, titulo, acesso, extras, app, attrs in PAGINAS:
    gravar(arq, pagina(titulo, acesso, extras, app, attrs))
gravar('entrar', pagina('Entrar', '', [], 'entrar-app', sem_layout=True))
gravar('validar', pagina('Validar certificado', '', [], 'validar-app', sem_layout=True))
# Perfis: app de permissões reaproveitado do protótipo original (helpers próprios, sem base.js/ui-form.js).
for arq, titulo, modo in [('perfis', 'Perfis de acesso', 'lista'), ('perfil', 'Perfil de acesso', 'detalhe')]:
    gravar(arq, pagina(titulo, 'perfis-acesso', ['perfis-pagina'], 'permissoes-app', f'data-modo="{modo}"', ui=False))
print('ok')
