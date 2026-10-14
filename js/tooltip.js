// ============================================================
// Tooltip global. Substitui o `title` nativo (pequeno, ~1 s de atraso, sem tema)
// por um balão próprio: abre em ~120 ms, fonte legível, segue o tema dark,
// quebra linha em textos longos e nunca sai da tela.
// Funciona em qualquer elemento com `title` — inclusive os criados depois via
// innerHTML — sem alterar as telas: o title vira `data-tip` no primeiro hover
// (assim o balão nativo não aparece por cima).
// `data-tip-html` (03/09/2026): balão rico, com HTML já montado pela tela
// (título, linhas com amostra de cor, rodapé) — usado pelos gráficos de
// resultados.html. Quem monta o HTML é responsável por escapar os textos.
// Carregar em todas as páginas depois de tema.js.
// ============================================================

(function () {
  const ATRASO = 120;
  const MARGEM = 8;
  let balao = null;
  let alvo = null;
  let timer = null;

  function criarBalao() {
    balao = document.createElement('div');
    balao.setAttribute('role', 'tooltip');
    balao.className = 'tooltip-global';
    balao.style.cssText = [
      'position:fixed', 'z-index:9999', 'max-width:320px', 'padding:6px 10px', 'border-radius:8px',
      'font:500 13px/1.4 "Atkinson Hyperlegible Next", system-ui, sans-serif', 'pointer-events:none', 'white-space:pre-line',
      'opacity:0', 'transform:translateY(2px)', 'transition:opacity .12s ease, transform .12s ease',
      'box-shadow:0 6px 20px rgba(15,23,42,.18)',
    ].join(';');
    document.body.appendChild(balao);
    aplicarTema();
  }

  function aplicarTema() {
    if (!balao) return;
    const dark = document.documentElement.classList.contains('dark');
    balao.style.background = dark ? '#F5F0E8' : '#071E2C';
    balao.style.color = dark ? '#071E2C' : '#F5F0E8';
  }

  function textoDe(el) {
    if (el.hasAttribute('title')) {
      el.dataset.tip = el.getAttribute('title');
      el.removeAttribute('title');
    }
    return el.dataset.tipHtml ?? el.dataset.tip;
  }

  function posicionar() {
    const r = alvo.getBoundingClientRect();
    const b = balao.getBoundingClientRect();
    let top = r.bottom + MARGEM;
    if (top + b.height > window.innerHeight - MARGEM) top = r.top - b.height - MARGEM;
    let left = r.left + r.width / 2 - b.width / 2;
    left = Math.max(MARGEM, Math.min(left, window.innerWidth - b.width - MARGEM));
    balao.style.top = `${Math.max(MARGEM, top)}px`;
    balao.style.left = `${left}px`;
  }

  function mostrar(el) {
    const texto = textoDe(el);
    if (!texto) return;
    if (!balao) criarBalao();
    alvo = el;
    const rico = el.dataset.tipHtml != null;
    if (rico) balao.innerHTML = texto; else balao.textContent = texto;
    balao.classList.toggle('tooltip-global-rico', rico);
    balao.style.whiteSpace = rico ? 'normal' : 'pre-line';
    balao.style.maxWidth = rico ? '380px' : '320px';
    balao.style.padding = rico ? '8px 12px' : '6px 10px';
    balao.style.display = 'block';
    posicionar();
    requestAnimationFrame(() => { balao.style.opacity = '1'; balao.style.transform = 'translateY(0)'; });
  }

  function esconder() {
    clearTimeout(timer);
    alvo = null;
    if (!balao) return;
    balao.style.opacity = '0';
    balao.style.transform = 'translateY(2px)';
    balao.style.display = 'none';
  }

  function alvoDe(no) {
    if (!(no instanceof Element)) return null;
    return no.closest('[title], [data-tip], [data-tip-html]');
  }

  document.addEventListener('mouseover', (e) => {
    const el = alvoDe(e.target);
    if (!el || el === alvo) return;
    clearTimeout(timer);
    // Se já tem um balão aberto, troca na hora; senão espera o atraso curto.
    timer = setTimeout(() => mostrar(el), alvo ? 0 : ATRASO);
    if (!el.hasAttribute('data-tip') && !el.hasAttribute('data-tip-html')) textoDe(el); // tira o title já, para o nativo não aparecer
  });
  document.addEventListener('mouseout', (e) => {
    const el = alvoDe(e.target);
    if (!el) return;
    if (e.relatedTarget && el.contains(e.relatedTarget)) return;
    esconder();
  });
  document.addEventListener('focusin', (e) => { const el = alvoDe(e.target); if (el) mostrar(el); });
  document.addEventListener('focusout', esconder);
  document.addEventListener('mousedown', esconder, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') esconder(); });
  window.addEventListener('scroll', () => { if (alvo) posicionar(); }, true);
  window.addEventListener('resize', () => { if (alvo) posicionar(); });
  new MutationObserver(aplicarTema).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  // Marca para outros módulos (ex.: chamados-graficos.ligarTooltips) não criarem um segundo balão para `data-tip`.
  document.documentElement.dataset.tooltipGlobal = '1';
})();
