// ============================================================
// Helpers de tela das páginas de Pessoas (colaboradores, instrutores e o
// cadastro público do instrutor), trazidos do protótipo original
// (js/avaliacoes-ui.js do snorlax-jornada) sem mudança. Estas páginas não
// carregam base.js: os apps reaproveitados declaram os próprios ICONE, BOTAO_*
// e afins, como o app de permissões.
// ============================================================

function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function toast(mensagem) {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = 'toast-anim bg-petrol-900 text-white dark:bg-[#F5F0E8] dark:text-[#071E2C] text-sm px-4 py-2.5 rounded-lg shadow-lg';
  el.textContent = mensagem;
  root.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}


function parametroUrl(nome) {
  return new URLSearchParams(location.search).get(nome);
}

// ---------- Modal genérico ----------

// Ao fechar, o foco volta a quem abriu. Se a tela foi redesenhada nesse meio-tempo, volta pelo id.
function devolverFoco(origem) {
  const alvo = origem?.isConnected ? origem : origem?.id && document.getElementById(origem.id);
  if (alvo && alvo !== document.body) alvo.focus();
}

let origemDoModal = null;

function abrirModal(conteudoHtml, largura = 'max-w-lg') {
  const root = document.getElementById('modal-root');
  if (!root.innerHTML.trim()) origemDoModal = document.activeElement;
  root.innerHTML = `
    <div class="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div data-fechar-modal class="absolute inset-0 bg-slate-900/50 dark:bg-black/70"></div>
      <div role="dialog" aria-modal="true" class="modal-anim relative w-full ${largura} max-h-full flex flex-col bg-white dark:bg-neutral-950 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-xl">
        ${conteudoHtml}
      </div>
    </div>`;
  root.querySelectorAll('[data-fechar-modal]').forEach((b) => b.addEventListener('click', fecharModal));
  // Tab e Shift+Tab giram dentro do diálogo, sem escapar para a página atrás do véu.
  const dialogo = root.querySelector('[role="dialog"]');
  // Nome do diálogo para leitor de tela; quem tem título próprio troca o aria-labelledby depois.
  const titulo = dialogo.querySelector('h2, h3');
  if (titulo) { titulo.id ||= 'modal-titulo'; dialogo.setAttribute('aria-labelledby', titulo.id); }
  dialogo.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focaveis = [...dialogo.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])')];
    if (!focaveis.length) return;
    const primeiro = focaveis[0]; const ultimo = focaveis[focaveis.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); } else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  });
  const aoTeclar = (e) => { if (e.key === 'Escape') { fecharModal(); document.removeEventListener('keydown', aoTeclar); } };
  document.addEventListener('keydown', aoTeclar);
  return root;
}

function fecharModal() {
  const root = document.getElementById('modal-root');
  if (!root.innerHTML.trim()) return;
  root.innerHTML = '';
  devolverFoco(origemDoModal);
  origemDoModal = null;
}

// ---------- WhatsApp ----------

const ICONE_WHATSAPP = '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>';
