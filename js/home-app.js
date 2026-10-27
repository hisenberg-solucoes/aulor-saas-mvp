// ============================================================
// Início: a saudação e os módulos da V1 como atalhos, nos mesmos grupos do
// menu (MENU_GRUPOS, js/menu.js). Sem números: os indicadores ficam fora da V1.
// ============================================================

const CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)]';
const escH = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function renderInicio() {
  const nome = (Sessao.atual()?.nome ?? 'Ana Souza').split(' ')[0];
  document.getElementById('home-tela').innerHTML = `
    <div class="mb-6">
      <h2 class="text-xl font-semibold tracking-tight text-slate-900 dark:text-neutral-100">Olá, ${escH(nome)}</h2>
      <p class="mt-0.5 text-sm text-slate-500 dark:text-neutral-400">Escolha por onde começar.</p>
    </div>
    <div class="grid grid-cols-2 xl:grid-cols-3 gap-4">${MENU_GRUPOS.map((g) => `
      <section class="${CARTAO} p-4" aria-labelledby="inicio-${g.id}">
        <h3 id="inicio-${g.id}" class="text-[15px] leading-[22px] font-semibold text-slate-900 dark:text-neutral-100">${escH(g.nome)}</h3>
        <ul class="mt-2 -mx-2">${g.itens.map((i) => `
          <li><a href="${i.href}" class="flex items-center gap-2 h-9 px-2 rounded-md text-sm text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-900 hover:text-petrol-800 dark:hover:text-sky-300 transition">
            <svg class="h-4 w-4 shrink-0 text-slate-500 dark:text-neutral-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">${i.icone}</svg>${escH(i.nome)}
          </a></li>`).join('')}
        </ul>
      </section>`).join('')}
    </div>`;
}

document.addEventListener('DOMContentLoaded', renderInicio);
