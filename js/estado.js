// ============================================================
// Chip de estado dos portais. Substitui o ponto de 8px na cor da fase, que não
// deixava ler qual cor era qual. Recebe a classe do ponto antigo (bg-emerald-500,
// bg-red-500, bg-amber-500, bg-sky-500, bg-slate-400…) e devolve o chip da família:
// verde é bom, vermelho é ruim, âmbar e cobre esperam alguém, sky é a marca,
// petrol é "hoje", violeta é exceção, slate é neutro; contorno vazado é cancelado.
// ============================================================

const CHIP_ESTADO = {
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  laranja: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  sky: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200',
  petrol: 'bg-petrol-800 text-white dark:bg-sky-300 dark:text-petrol-950',
  violet: 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300',
  slate: 'bg-slate-200 text-slate-600 dark:bg-neutral-900 dark:text-neutral-400',
  vazada: 'ring-1 ring-inset ring-slate-300 text-slate-500 dark:ring-neutral-600 dark:text-neutral-400',
};

function chipEstado(cor, texto) {
  const tom = /ring|border/.test(cor) ? 'vazada' : (String(cor).match(/(emerald|red|amber|laranja|sky|petrol|violet|slate)/) || [])[1];
  const classe = CHIP_ESTADO[tom] ?? CHIP_ESTADO.slate;
  const t = String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  return `<span class="pilula inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ${classe}">${t}</span>`;
}
