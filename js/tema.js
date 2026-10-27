// ============================================================
// Tema claro/escuro compartilhado por todas as páginas.
// Carregado de forma síncrona no <head> para aplicar a classe
// `dark` no <html> ANTES do primeiro paint (sem piscar).
// Preferência salva em localStorage ('aulor-v1-tema' = 'light' | 'dark');
// sem valor salvo, segue prefers-color-scheme do sistema.
// ============================================================

(function () {
  const CHAVE = 'aulor-v1-tema';
  const raiz = document.documentElement;
  const midia = window.matchMedia('(prefers-color-scheme: dark)');

  function temaSalvo() {
    const valor = localStorage.getItem(CHAVE);
    return valor === 'light' || valor === 'dark' ? valor : null;
  }

  function temaAtual() {
    return temaSalvo() || (midia.matches ? 'dark' : 'light');
  }

  function aplicar(tema) {
    raiz.classList.toggle('dark', tema === 'dark');
    document.querySelectorAll('[data-toggle-tema]').forEach((botao) => {
      const titulo = tema === 'dark' ? 'Tema claro' : 'Tema escuro';
      botao.title = titulo;
      botao.setAttribute('aria-label', titulo);
      botao.setAttribute('aria-pressed', String(tema === 'dark'));
    });
  }

  function alternar() {
    const novo = temaAtual() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(CHAVE, novo);
    aplicar(novo);
  }

  // Antes do paint.
  aplicar(temaAtual());

  // Sem escolha salva, acompanha mudanças do sistema em tempo real.
  midia.addEventListener('change', () => {
    if (!temaSalvo()) aplicar(temaAtual());
  });

  // Alternância feita em outra aba/página reflete aqui.
  window.addEventListener('storage', (e) => {
    if (e.key === CHAVE) aplicar(temaAtual());
  });

  document.addEventListener('DOMContentLoaded', () => {
    aplicar(temaAtual());
    document.querySelectorAll('[data-toggle-tema]').forEach((botao) => {
      botao.addEventListener('click', alternar);
    });
  });

  window.Tema = { atual: temaAtual, alternar, CHAVE };
})();

// ============================================================
// Sidebar recolhível, compartilhada por todas as páginas.
// Estado salvo em localStorage ('aulor-v1-sidebar' = 'aberta' | 'fechada');
// aplicado como classe `sidebar-fechada` no <html> antes do paint.
// A <aside> precisa ter `data-sidebar`; o botão, `data-toggle-sidebar`.
// ============================================================

(function () {
  const CHAVE = 'aulor-v1-sidebar';
  const raiz = document.documentElement;

  function fechada() {
    return localStorage.getItem(CHAVE) === 'fechada';
  }

  function aplicar() {
    const estaFechada = fechada();
    raiz.classList.toggle('sidebar-fechada', estaFechada);
    document.querySelectorAll('[data-toggle-sidebar]').forEach((botao) => {
      const atalho = navigator.platform.startsWith('Mac') ? '⌘B' : 'Ctrl+B';
      const titulo = (estaFechada ? 'Mostrar menu' : 'Ocultar menu') + ' (' + atalho + ')';
      botao.title = titulo;
      botao.setAttribute('aria-label', titulo);
      botao.setAttribute('aria-expanded', String(!estaFechada));
    });
  }

  function alternar() {
    localStorage.setItem(CHAVE, fechada() ? 'aberta' : 'fechada');
    aplicar();
  }

  aplicar();

  window.addEventListener('storage', (e) => {
    if (e.key === CHAVE) aplicar();
  });

  // Atalho: Ctrl+B (Windows/Linux) ou Cmd+B (Mac). Só age quando há sidebar na página.
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'b') {
      if (!document.querySelector('[data-sidebar]')) return;
      e.preventDefault();
      alternar();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    aplicar();
    document.querySelectorAll('[data-toggle-sidebar]').forEach((botao) => {
      botao.addEventListener('click', alternar);
    });
  });

  window.Sidebar = { fechada, alternar, CHAVE };
})();

// ============================================================
// Limpeza de chaves superadas: cada módulo sobe '<nome>-vN' quando muda o formato
// e a versão anterior ficava para trás, até estourar a cota (~5 MB por origem).
// Apaga '<nome>-vK' quando já existe '<nome>-vN' com N > K. Leituras de legado
// (ex.: extrato-v2 → v3) só acontecem enquanto a versão nova não existe, então seguem a salvo.
// Roda no <head>, antes de qualquer motor gravar.
// shortcut: se a 1ª gravação da vN já estourar, a v(N-1) só sai depois que a vN existir; se isso ocorrer, listar as chaves vigentes por módulo.
// ============================================================

(function () {
  const maior = {};
  const versionadas = Object.keys(localStorage).map((k) => k.match(/^(.+)-v(\d+)$/)).filter(Boolean);
  versionadas.forEach(([, nome, v]) => { maior[nome] = Math.max(maior[nome] ?? 0, Number(v)); });
  versionadas.forEach(([chave, nome, v]) => { if (Number(v) < maior[nome]) localStorage.removeItem(chave); });
})();
