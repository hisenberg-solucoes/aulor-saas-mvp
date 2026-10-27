// ============================================================
// Acesso às telas do portal administrativo. Carregado no <head> de cada
// página, antes de desenhar: sem sessão, vai para a entrada; tela fora das
// permissões da pessoa, volta ao Início dizendo qual. As permissões vêm da
// sessão, gravada em entrar.html a partir dos perfis (js/permissoes-data.js).
// Só demonstra: na V1 real, quem aplica as permissões é o back-end.
// ============================================================

const Acesso = (() => {
  // Página → tela do catálogo de permissões; a lista é a própria tela (contratos.html → contratos).
  const TELA_DA_PAGINA = {
    'contrato.html': 'contratos', 'aluno.html': 'alunos', 'responsavel.html': 'responsaveis', 'empresa.html': 'empresas',
    'curso.html': 'cursos', 'formacao.html': 'formacoes', 'turma.html': 'turmas',
    'conta-bancaria.html': 'contas-bancarias', 'instrutor.html': 'instrutores', 'colaborador.html': 'colaboradores',
    'perfil.html': 'perfis', 'modelo-contrato.html': 'modelos-contrato',
  };
  // Sem sessão: a entrada e os cadastros pelo link (o aluno, a empresa e o instrutor se cadastram sozinhos).
  const LIVRES = ['', 'index.html', 'entrar.html', 'cadastro-aluno.html', 'cadastro-aluno-steps.html', 'cadastro-empresa.html',
    'cadastro-empresa-steps.html', 'cadastro-instrutor.html', 'cadastro-instrutor-steps.html'];

  const pagina = () => location.pathname.split('/').pop().toLowerCase();
  const tela = (p = pagina()) => TELA_DA_PAGINA[p] ?? p.replace(/\.html$/, '');
  function sessao() {
    try { return JSON.parse(localStorage.getItem('aulor-v1-sessao')) || null; } catch (_) { return null; }
  }
  const pode = (telaId, acao = 'visualizar', s = sessao()) => Boolean(s?.acesso?.[telaId]?.includes(acao));

  (function guardar() {
    const p = pagina();
    if (LIVRES.includes(p)) return;
    const s = sessao();
    if (!s?.acesso) { location.replace('entrar.html?portal=equipe'); return; }
    if (p !== 'home.html' && !pode(tela(p), 'visualizar', s)) location.replace(`home.html?sem-acesso=${encodeURIComponent(tela(p))}`);
  })();

  return { tela, pode, sessao };
})();
