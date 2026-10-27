// ============================================================
// Helpers visuais compartilhados pelas quatro telas de avaliações
// (macro, detalhe do dia, histórico da turma, instrutor).
// ============================================================

// ---------- Helpers ----------

function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function fmt(n, casas = 2) {
  return n == null ? '—' : n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

function pct(x) {
  return x == null ? '—' : `${Math.round(x * 100)}%`;
}

function dataLonga(iso) {
  const d = new Date(`${iso}T12:00:00`);
  const txt = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

function dataCurta(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// Cores por faixa. `celula` (= `pilula`): fundo tingido com texto escuro da mesma cor, sem contorno, que passa
// AA nos dois temas (o texto branco sobre o verde e o vermelho cheios dava 2,47:1 e 3,81:1). `ponto`: cor cheia,
// só para pontos e segmentos da barra de distribuição. `texto`: número solto dentro do cartão.
const COR_FAIXA = {
  otimo: { celula: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300', ponto: 'bg-emerald-500', texto: 'text-emerald-700 dark:text-emerald-400' },
  bom: { celula: 'bg-lime-100 text-lime-800 dark:bg-lime-950/60 dark:text-lime-300', ponto: 'bg-lime-400', texto: 'text-lime-700 dark:text-lime-400' },
  regular: { celula: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300', ponto: 'bg-amber-400', texto: 'text-amber-700 dark:text-amber-400' },
  ruim: { celula: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300', ponto: 'bg-red-500', texto: 'text-red-700 dark:text-red-400' },
  vazio: { celula: 'bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-400', ponto: 'bg-slate-300', texto: 'text-slate-500 dark:text-neutral-400' },
};
Object.values(COR_FAIXA).forEach((c) => { c.pilula = c.celula; });

// `borda` só serve ao Portal do Professor, que ainda desenha os comentários com faixa lateral; o admin não usa.
const COR_TOM = {
  positivo: { borda: 'border-l-emerald-500', pilula: COR_FAIXA.otimo.pilula, rotulo: 'Elogio' },
  sugestao: { borda: 'border-l-sky-500', pilula: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300', rotulo: 'Sugestão' },
  atencao: { borda: 'border-l-amber-500', pilula: COR_FAIXA.regular.pilula, rotulo: 'Atenção' },
};

// Cartão e cores de dado das telas em cartões (prefixo AV_: este arquivo é carregado em quase todas as páginas).
const AV_CARTAO = 'bg-white dark:bg-neutral-950 rounded-xl border border-slate-200/80 dark:border-neutral-800 shadow-[0_1px_2px_rgb(7_30_44/0.05)]';
const AV_DADO = 'bg-[color:var(--f-tinta)]'; // série em tinta (Regra da Tinta nos Dados)
const AV_DADO_PENDENTE = 'bg-[color:var(--f-cobre-tinta)] dark:bg-[color:var(--f-cobre)]'; // abaixo do limiar de atenção
const AV_PONTO_AVISO = '<span aria-hidden="true" class="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--f-cobre)] mr-1.5 align-middle"></span>'; // pendência: ponto cobre antes do rótulo
const AV_FOCO = 'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--f-foco)]';

function corDe(media) {
  return COR_FAIXA[Avaliacoes.faixa(media)?.id ?? 'vazio'];
}

// Célula do heatmap: número + cor da faixa. Tooltip nativo com contexto.
function celula(media, titulo, extra = '') {
  const cor = corDe(media);
  return `<span title="${esc(titulo)}: ${media == null ? 'sem respostas' : fmt(media)}"
    class="inline-flex items-center justify-center min-w-[3.25rem] px-2 py-1 rounded-md text-xs font-semibold tabular-nums whitespace-nowrap ${cor.celula} ${extra}">${fmt(media)}</span>`;
}

function pilulaFaixa(media, tamanho = 'text-xs') {
  const f = Avaliacoes.faixa(media);
  return `<span class="inline-flex items-center rounded-md px-2 py-0.5 ${tamanho} font-medium whitespace-nowrap ${corDe(media).pilula}">${f ? esc(f.rotulo) : 'Sem respostas'} · ${fmt(media)}</span>`;
}

// Legenda das faixas: cada uma como amostra da própria célula, com o corte escrito.
function legendaFaixas() {
  return `<div class="flex flex-wrap items-center gap-1.5 text-xs font-medium">
    ${Avaliacoes.FAIXAS.map((f) => `<span class="rounded-md px-2 py-0.5 whitespace-nowrap ${COR_FAIXA[f.id].celula}">${esc(f.rotulo)}${f.min > 0 ? ` ≥ ${fmt(f.min, 1)}` : ` < ${fmt(Avaliacoes.FAIXAS.at(-2).min, 1)}`}</span>`).join('')}
  </div>`;
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

function telefoneParaWa(telefone) {
  return `55${String(telefone).replace(/\D/g, '')}`;
}

// Botão pequeno de WhatsApp. `destaque` (ex.: aluno com nota baixa) usa verde cheio.
function botaoWhatsapp(avaliacaoId, telefone, destaque = false) {
  const base = 'inline-flex items-center justify-center h-7 w-7 rounded-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';
  if (!telefone) {
    return `<button type="button" data-whatsapp="${avaliacaoId}" title="Sem telefone cadastrado" class="${base} text-slate-300 dark:text-neutral-700 hover:text-slate-400">${ICONE_WHATSAPP}</button>`;
  }
  const cor = destaque
    ? 'bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500' // branco sobre o 500 dava 2,47:1
    : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60';
  return `<button type="button" data-whatsapp="${avaliacaoId}" title="Conversar no WhatsApp · ${esc(telefone)}" class="${base} ${cor}">${ICONE_WHATSAPP}</button>`;
}

// Modal de contato: mensagem pré-preenchida com o contexto da avaliação, editável antes de abrir o WhatsApp.
function abrirModalWhatsapp(avaliacao, turma, remetente = 'Ana') {
  if (!avaliacao.aluno.telefone) {
    toast(`${avaliacao.aluno.nome} não tem telefone cadastrado.`);
    return;
  }
  const baixos = INDICADORES.filter((i) => {
    const v = Avaliacoes.valorDe(avaliacao.respostas[i.id]);
    return v != null && v < 4;
  });
  const primeiroNome = avaliacao.aluno.nome.split(' ')[0];
  const dataTxt = new Date(`${avaliacao.data}T12:00:00`).toLocaleDateString('pt-BR');
  const motivo = baixos.length
    ? ` Notei que você avaliou ${baixos.length === 1 ? 'o item' : 'os itens'} *${baixos.map((i) => i.nome).join('*, *')}* abaixo do esperado e queria entender melhor o que aconteceu, para a gente resolver.`
    : ' Queria trocar uma ideia rápida sobre como foi a aula pra você.';
  const mensagem = `Olá, ${primeiroNome}! Aqui é ${remetente}, da ProWay. Vi sua avaliação da aula de ${turma.codigo} (${dataTxt}).${motivo} Pode falar agora?`;

  const root = abrirModal(`
    <div class="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-start justify-between gap-3">
      <div>
        <h3 class="font-display font-semibold text-slate-900 dark:text-neutral-100">Conversar com ${esc(avaliacao.aluno.nome)}</h3>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(turma.codigo)} · ${dataTxt} · ${esc(avaliacao.aluno.telefone)}</p>
      </div>
      <button type="button" data-fechar-modal class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200" aria-label="Fechar">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
    <div class="px-5 py-4 space-y-3">
      ${baixos.length ? `
        <div class="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
          <span class="font-medium">Avaliou abaixo de Bom</span>
          ${baixos.map((i) => { const r = avaliacao.respostas[i.id]; return `<span class="inline-flex items-center rounded-md px-2 py-0.5 font-medium ${COR_FAIXA[r].pilula}">${esc(i.nome)}</span>`; }).join('')}
        </div>` : ''}
      <label class="block">
        <span class="text-xs font-medium text-slate-500 dark:text-neutral-400">Mensagem</span>
        <textarea id="whatsapp-mensagem" rows="6" class="mt-1 w-full rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-slate-700 dark:text-neutral-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20">${esc(mensagem)}</textarea>
      </label>
    </div>
    <div class="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-2">
      <button type="button" data-fechar-modal class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition">Cancelar</button>
      <a id="whatsapp-abrir" target="_blank" rel="noopener" href="#"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40">
        ${ICONE_WHATSAPP} Abrir WhatsApp
      </a>
    </div>`);

  const campo = root.querySelector('#whatsapp-mensagem');
  const link = root.querySelector('#whatsapp-abrir');
  const atualizar = () => { link.href = `https://wa.me/${telefoneParaWa(avaliacao.aluno.telefone)}?text=${encodeURIComponent(campo.value)}`; };
  campo.addEventListener('input', atualizar);
  atualizar();
  link.addEventListener('click', () => { fecharModal(); toast(`WhatsApp aberto para ${avaliacao.aluno.nome}.`); });
  campo.focus();
}

// ---------- Componentes compartilhados pelas telas de período ----------

const PERIODOS = [7, 15, 30, 60];

// `tom`: texto sobre o fundo frio, em slate-600 (6,93:1; o slate-500 dá 4,36:1).
function seletorPeriodo(dias, tom = 'text-slate-600 dark:text-neutral-400') {
  return `
    <label class="flex items-center gap-2 text-xs ${tom}">
      <span class="font-medium">Período</span>
      <select id="seletor-periodo" class="h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2.5 text-sm text-slate-700 dark:text-neutral-200 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400">
        ${PERIODOS.map((p) => `<option value="${p}" ${p === dias ? 'selected' : ''}>Últimos ${p} dias</option>`).join('')}
      </select>
    </label>`;
}

// Cartão de indicador: rótulo, número em 24px e uma linha de apoio. Sem faixa lateral; a cor, quando há, vai no número.
// `borda` ficou na assinatura só para os chamadores antigos e é ignorada. `pendente`: ponto cobre antes do rótulo.
function cartaoKpi({ rotulo, valor, sufixo = '', corValor = 'text-slate-800 dark:text-neutral-100', rodape = '', pendente = false }) {
  return `
    <div class="${AV_CARTAO} p-4 flex flex-col gap-1 min-w-0">
      <p class="text-xs font-medium text-slate-500 dark:text-neutral-400">${pendente ? AV_PONTO_AVISO : ''}${rotulo}</p>
      <p class="flex items-baseline gap-1.5"><span class="font-display text-2xl font-semibold tabular-nums leading-7 ${corValor}">${valor}</span>${sufixo ? `<span class="text-xs text-slate-500 dark:text-neutral-400">${sufixo}</span>` : ''}</p>
      ${rodape ? `<p class="text-xs text-slate-500 dark:text-neutral-400">${rodape}</p>` : ''}
    </div>`;
}

// Variação em tinta 2, com sinal e o período nomeado (Regra do Azul e do Vermelho: subir ou descer não ganha cor).
// "período anterior" = mesmo tamanho de período, imediatamente antes.
function textoVariacao(variacao, referencia, rotuloRef = 'período anterior') {
  if (variacao == null) return 'sem base de comparação';
  return `<span class="font-medium tabular-nums text-slate-700 dark:text-neutral-200">${variacao >= 0 ? '+' : '−'}${fmt(Math.abs(variacao))}</span> vs. ${rotuloRef} (${fmt(referencia)})`;
}

// Barra de distribuição Ótimo/Bom/Regular/Ruim + legenda.
function barraDistribuicao(dist) {
  const barra = ESCALA.map((e) => {
    const n = dist.contagem[e.id];
    return n ? `<span title="${esc(e.rotulo)}: ${n} (${pct(n / dist.total)})" class="${COR_FAIXA[e.id].ponto} h-full" style="width:${(n / dist.total) * 100}%"></span>` : '';
  }).join('');
  const legenda = ESCALA.map((e) => `<span class="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-neutral-400"><span class="h-2 w-2 rounded-full ${COR_FAIXA[e.id].ponto}"></span>${esc(e.rotulo)} <span class="font-medium text-slate-700 dark:text-neutral-200 tabular-nums">${dist.contagem[e.id]}</span></span>`).join('');
  return `<div class="flex h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-900 gap-px mt-1">${barra}</div><div class="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">${legenda}</div>`;
}

// Colunas de uma série por dia, em tinta; o dia abaixo do limiar de atenção vai em cobre e um traço marca o limiar.
// `item(p)` → { tag: 'a' | 'button', attrs, rotulo, ativo }.
function colunasSerie(serie, altura, item) {
  const limiar = Math.round(((Avaliacoes.LIMIAR_ATENCAO - 1) / 4) * altura);
  return `
    <div class="relative">
      <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 border-t border-dashed border-slate-400 dark:border-neutral-500" style="top:${altura - limiar}px"></div>
      <div class="flex gap-1.5">
        ${serie.map((p) => {
          const { tag, attrs, rotulo, ativo = false } = item(p);
          const h = p.media == null ? 3 : Math.max(4, Math.round(((p.media - 1) / 4) * altura));
          const cor = p.media == null ? 'bg-slate-200 dark:bg-neutral-800' : p.media < Avaliacoes.LIMIAR_ATENCAO ? AV_DADO_PENDENTE : AV_DADO;
          const dica = `${dataCurta(p.data)}: ${p.media == null ? 'sem avaliações' : `média ${fmt(p.media)}, ${p.respostas} resposta${p.respostas === 1 ? '' : 's'}`}`;
          return `
          <${tag} ${attrs} title="${dica}" aria-label="${dica}" ${ativo ? 'aria-current="date"' : ''} class="group flex-1 min-w-[18px] flex flex-col items-center gap-1 rounded ${AV_FOCO}">
            <span class="w-full flex items-end justify-center" style="height:${altura}px"><span class="w-full max-w-[24px] rounded-t-sm ${cor} group-hover:opacity-75 transition-opacity" style="height:${h}px"></span></span>
            <span class="text-xs tabular-nums ${ativo ? 'font-semibold text-slate-900 dark:text-neutral-100' : 'text-slate-500 dark:text-neutral-400'}">${rotulo}</span>
          </${tag}>`;
        }).join('')}
      </div>
    </div>`;
}

function legendaSerie() {
  return `<div class="flex items-center gap-3 text-xs text-slate-500 dark:text-neutral-400">
    <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm ${AV_DADO_PENDENTE}"></span>abaixo de ${fmt(Avaliacoes.LIMIAR_ATENCAO, 1)}</span>
    <span class="inline-flex items-center gap-1.5"><span class="w-4 border-t border-dashed border-slate-400 dark:border-neutral-500"></span>limiar de atenção</span>
  </div>`;
}

// Cartão do gráfico de barras da média por dia (uma série). `linkDia(data)` → href de cada barra.
function graficoSerie(serie, titulo, linkDia) {
  if (!serie.length) return '';
  return `
    <div class="${AV_CARTAO} p-4">
      <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h3 class="font-display text-[15px] font-semibold text-slate-900 dark:text-neutral-100">${titulo}</h3>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">Clique num dia para abrir as respostas daquele dia.</p>
        </div>
        ${legendaSerie()}
      </div>
      <div class="mt-3 overflow-x-auto">${colunasSerie(serie, 80, (p) => ({ tag: 'a', attrs: `href="${linkDia(p.data)}"`, rotulo: dataCurta(p.data) }))}</div>
    </div>`;
}

// Cartão "Médias por indicador" (um bloco por grupo): medidor em tinta, cobre abaixo do limiar, traço de referência.
function painelIndicadores(resumo, referencia, legendaRef, grupos = GRUPOS, legendaBarra = 'média no período') {
  return `
    <div class="${AV_CARTAO}">
      <div class="px-4 pt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="font-display text-[15px] font-semibold text-slate-900 dark:text-neutral-100">Médias por indicador</h3>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">Barra = ${legendaBarra}, em cobre abaixo de ${fmt(Avaliacoes.LIMIAR_ATENCAO, 1)}; traço = ${legendaRef}.</p>
        </div>
        ${legendaFaixas()}
      </div>
      <div class="mt-1 grid grid-cols-1 md:grid-cols-2 ${grupos.length >= 3 ? 'xl:grid-cols-3' : ''} divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-neutral-800">
        ${grupos.map((g) => `
          <div class="p-4">
            <div class="flex items-center justify-between mb-3">
              <p class="text-xs font-medium text-slate-500 dark:text-neutral-400">${esc(g.nome)}</p>
              ${celula(resumo.grupos[g.id], `Média do grupo ${g.nome}`)}
            </div>
            <ul class="space-y-3">
              ${g.indicadores.map((i) => {
                const m = resumo.indicadores[i.id];
                const ref = referencia.indicadores[i.id];
                return `
                <li title="${esc(i.descricao ?? i.nome)}">
                  <div class="flex items-center justify-between text-sm mb-1.5">
                    <span class="text-slate-700 dark:text-neutral-200 truncate">${esc(i.nome)}</span>
                    <span class="font-semibold tabular-nums ${corDe(m).texto} ml-2">${fmt(m)}</span>
                  </div>
                  <div class="relative h-1.5 rounded-full bg-slate-100 dark:bg-neutral-800">
                    <span class="absolute inset-y-0 left-0 rounded-full ${m != null && m < Avaliacoes.LIMIAR_ATENCAO ? AV_DADO_PENDENTE : AV_DADO}" style="width:${m == null ? 0 : ((m - 1) / 4) * 100}%"></span>
                    ${ref == null ? '' : `<span title="${legendaRef}: ${fmt(ref)}" class="absolute -top-1 h-3.5 w-0.5 bg-slate-500 dark:bg-neutral-400 ring-2 ring-white dark:ring-neutral-950" style="left:${((ref - 1) / 4) * 100}%"></span>`}
                  </div>
                </li>`;
              }).join('')}
            </ul>
          </div>`).join('')}
      </div>
    </div>`;
}

// Lista de comentários (atenção primeiro) com turma/data e botão de WhatsApp. Sem faixa lateral: o tom vai na pílula.
const COMENTARIOS_POR_PAGINA = 6;

function pilulaTom(tom) {
  return `<span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ${COR_TOM[tom].pilula}">${COR_TOM[tom].rotulo}</span>`;
}

function listaComentarios(comentarios, avaliacoesPorId, filtroTom, mostrarTurma = true, limite = COMENTARIOS_POR_PAGINA) {
  const filtrados = comentarios.filter((c) => filtroTom === 'todos' || c.tom === filtroTom);
  if (!filtrados.length) {
    return `<p class="px-4 py-6 text-sm text-slate-500 dark:text-neutral-400">${comentarios.length ? 'Nenhum comentário com esse filtro.' : 'Nenhum depoimento no período.'}</p>`;
  }
  const ordem = { atencao: 0, sugestao: 1, positivo: 2 };
  const lista = [...filtrados].sort((a, b) => ordem[a.tom] - ordem[b.tom] || avaliacoesPorId.get(b.avaliacaoId).data.localeCompare(avaliacoesPorId.get(a.avaliacaoId).data));
  const visiveis = lista.slice(0, limite);
  const restantes = lista.length - visiveis.length;
  return `
    <ul class="p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
      ${visiveis.map((c) => {
        const tom = COR_TOM[c.tom];
        const av = avaliacoesPorId.get(c.avaliacaoId);
        const turma = TURMAS_AVALIACAO.find((t) => t.id === av.turmaId);
        const baixa = Object.values(av.respostas).some((r) => Avaliacoes.valorDe(r) < 4);
        return `
        <li class="rounded-lg bg-slate-50 dark:bg-neutral-900 p-3">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-800 dark:text-neutral-100 truncate">${esc(c.aluno.nome)}</p>
              <p class="text-xs text-slate-500 dark:text-neutral-400">${mostrarTurma ? `${esc(turma.codigo)} · ` : ''}<a class="hover:underline underline-offset-2" href="avaliacao-turma.html?turma=${turma.id}&data=${av.data}">${dataCurta(av.data)}</a></p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              ${pilulaTom(c.tom)}
              ${pilulaFaixa(c.mediaAluno)}
              ${botaoWhatsapp(av.id, av.aluno.telefone, c.tom === 'atencao' || baixa)}
            </div>
          </div>
          <p class="text-sm text-slate-700 dark:text-neutral-200">${esc(c.texto)}</p>
        </li>`;
      }).join('')}
    </ul>
    ${restantes > 0 ? `
    <div class="px-4 pb-4 flex items-center justify-center gap-3 text-xs text-slate-500 dark:text-neutral-400">
      <span>Mostrando ${visiveis.length} de ${lista.length}</span>
      <button type="button" data-mais-comentarios="${Math.min(restantes, COMENTARIOS_POR_PAGINA * 2)}" class="h-8 px-3 rounded-lg text-sm font-medium border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-slate-600 dark:text-neutral-300 hover:border-petrol-800 dark:hover:border-sky-400 hover:text-petrol-800 dark:hover:text-sky-300 transition">Mostrar mais ${Math.min(restantes, COMENTARIOS_POR_PAGINA * 2)}</button>
      <button type="button" data-mais-comentarios="${restantes}" class="text-petrol-800 dark:text-sky-300 hover:underline">Mostrar todos</button>
    </div>` : ''}`;
}

function seletorTom(filtroTom) {
  return `
    <label class="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400">
      <span class="font-medium">Tom</span>
      <select id="filtro-tom" class="h-9 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2.5 text-sm text-slate-700 dark:text-neutral-200 focus:outline-none focus:border-petrol-800 dark:focus:border-sky-400">
        <option value="todos" ${filtroTom === 'todos' ? 'selected' : ''}>Todos</option>
        <option value="atencao" ${filtroTom === 'atencao' ? 'selected' : ''}>Só atenção</option>
        <option value="sugestao" ${filtroTom === 'sugestao' ? 'selected' : ''}>Só sugestões</option>
        <option value="positivo" ${filtroTom === 'positivo' ? 'selected' : ''}>Só elogios</option>
      </select>
    </label>`;
}

// `tom`: sobre o fundo frio, slate-600 (o slate-500 dá 4,36:1).
function linkVoltar(href, texto, tom = 'text-slate-600 dark:text-neutral-400') {
  return `
    <a href="${href}" class="inline-flex items-center gap-1.5 text-sm ${tom} hover:text-petrol-800 dark:hover:text-sky-300 transition mb-3 rounded ${AV_FOCO}">
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
      ${texto}
    </a>`;
}

// ---------- Cabeçalho de turma (detalhe do dia e histórico) ----------

const ICONES = {
  pessoa: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>',
  relogio: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
  local: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>',
  prancheta: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>',
  alunos: '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>',
};

// Chip do registro: dado de consulta rápida, sem caixa nem fundo (texto sobre o fundo frio em slate-600).
function chip(icone, conteudo, titulo = '') {
  return `<span title="${esc(titulo)}" class="inline-flex items-center gap-1.5 text-[13px] text-slate-600 dark:text-neutral-300"><span class="text-slate-500 dark:text-neutral-400">${ICONES[icone]}</span>${conteudo}</span>`;
}

// Título + pílula + chips de contexto. `opcoes.linkInstrutor` = href; `opcoes.extras` = chips adicionais (HTML);
// `opcoes.tom` = cor do nome do curso (sobre o fundo frio, slate-600, como em linkVoltar).
function cabecalhoTurma(turma, media, opcoes = {}) {
  const instrutor = opcoes.linkInstrutor
    ? `<a href="${opcoes.linkInstrutor}" class="font-medium text-petrol-800 dark:text-sky-300 hover:underline underline-offset-2 rounded ${AV_FOCO}">${esc(turma.instrutor)}</a>`
    : `<span class="font-medium text-slate-700 dark:text-neutral-200">${esc(turma.instrutor)}</span>`;
  return `
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-3 min-w-0">
        <h2 class="font-display text-xl font-semibold text-slate-900 dark:text-neutral-100 truncate">${esc(turma.codigo)} <span class="font-sans font-normal ${opcoes.tom ?? 'text-slate-600 dark:text-neutral-400'}">${esc(turma.nome)}</span></h2>
        ${pilulaFaixa(media, 'text-sm')}
      </div>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
        ${chip('pessoa', instrutor, 'Instrutor')}
        ${chip('relogio', esc(turma.periodo), 'Dias e turno')}
        ${chip('local', `${esc(turma.modalidade)} · ${esc(turma.sala)}`, 'Modalidade e local')}
        ${opcoes.extras ?? ''}
      </div>
    </div>`;
}
