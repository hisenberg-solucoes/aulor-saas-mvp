// ============================================================
// Gráficos em SVG puro para a tela de KPIs do suporte (sem biblioteca).
// Regras seguidas: uma escala por gráfico; marcas finas; cor por papel
// (1 tom para magnitude, azul/laranja fixos para 2 séries, status reservado
// para bom/crítico); legenda só com 2+ séries; tooltip por marca; valores em
// texto de ink, nunca na cor da série; tabela de dados por baixo (<details>).
// ============================================================

const GRAF = {
  // Paleta de referência validada (validate_palette.js) — claro / escuro via classes dark:.
  serie1: 'fill-[#2a78d6] dark:fill-[#3987e5]',
  serie2: 'fill-[#eb6834] dark:fill-[#d95926]',
  linha1: 'stroke-[#2a78d6] dark:stroke-[#3987e5]',
  linha2: 'stroke-[#eb6834] dark:stroke-[#d95926]',
  bom: 'fill-[#0ca30c]',
  critico: 'fill-[#d03b3b]',
  alerta: 'fill-[#fab219]',
  neutro: 'fill-slate-300 dark:fill-neutral-700',
  grade: 'stroke-slate-200 dark:stroke-neutral-800',
  eixo: 'stroke-slate-300 dark:stroke-neutral-700',
  inkSec: 'fill-slate-500 dark:fill-neutral-400',
  ink: 'fill-slate-800 dark:fill-neutral-100',
  // Categórica (até 9 séries) para gráficos com uma fatia por categoria (polar, rosca de motivos).
  cat: ['fill-[#2a78d6] dark:fill-[#3987e5]', 'fill-[#eb6834] dark:fill-[#d95926]', 'fill-[#0ca30c]', 'fill-[#fab219]', 'fill-[#7c3aed] dark:fill-[#8b5cf6]', 'fill-[#0d9488] dark:fill-[#14b8a6]', 'fill-[#d03b3b]', 'fill-[#c026d3] dark:fill-[#d946ef]', 'fill-slate-400 dark:fill-neutral-500'],
  seq: ['fill-[#cde2fb] dark:fill-[#104281]', 'fill-[#9ec5f4] dark:fill-[#1c5cab]', 'fill-[#5598e7] dark:fill-[#2a78d6]', 'fill-[#256abf] dark:fill-[#5598e7]', 'fill-[#104281] dark:fill-[#9ec5f4]'],
};

const _escG = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const _fmtG = (n, casas = 0) => (n == null ? '—' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: casas, minimumFractionDigits: casas }));

// Tooltip único da página; os gráficos anexam data-tip nas marcas.
function ligarTooltips(raiz) {
  // tooltip.js (global) já mostra `data-tip` em qualquer elemento; com ele ativo não liga um segundo balão.
  // (tooltip.js carrega com `defer`, depois dos apps — por isso a checagem é pela tag do script, não pela marca.)
  if (document.documentElement.dataset.tooltipGlobal || document.querySelector('script[src$="tooltip.js"]')) return;
  let tip = document.getElementById('graf-tip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'graf-tip';
    tip.className = 'pointer-events-none fixed z-50 hidden rounded-md bg-slate-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs px-2.5 py-1.5 shadow-lg whitespace-pre-line';
    document.body.appendChild(tip);
  }
  raiz.querySelectorAll('[data-tip]').forEach((el) => {
    el.addEventListener('mouseenter', () => { tip.textContent = el.dataset.tip; tip.classList.remove('hidden'); });
    el.addEventListener('mousemove', (e) => { tip.style.left = `${e.clientX + 12}px`; tip.style.top = `${e.clientY + 12}px`; });
    el.addEventListener('mouseleave', () => tip.classList.add('hidden'));
  });
}

// Tabela alternativa (acessibilidade) dobrada num <details>.
function tabelaDados(colunas, linhas) {
  return `
    <details class="mt-2 text-xs">
      <summary class="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300">Ver como tabela</summary>
      <table class="mt-1 w-full text-left tabular-nums">
        <thead><tr>${colunas.map((c) => `<th class="py-1 pr-3 font-semibold text-slate-500 dark:text-neutral-400">${_escG(c)}</th>`).join('')}</tr></thead>
        <tbody>${linhas.map((l) => `<tr class="border-t border-slate-100 dark:border-neutral-900">${l.map((v) => `<td class="py-1 pr-3 text-slate-700 dark:text-neutral-200">${_escG(v)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </details>`;
}

function legenda(series) {
  if (series.length < 2) return '';
  return `<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-neutral-300 mb-2">${series.map((s) => `<span class="inline-flex items-center gap-1.5"><svg width="10" height="10" class="${s.cor}"><rect width="10" height="10" rx="2"/></svg>${_escG(s.nome)}</span>`).join('')}</div>`;
}

// ---------- Barras horizontais (magnitude por categoria; 1 tom) ----------
// itens: [{ nome, valor, tip?, cor? , sufixo? }]
function barrasHorizontais(itens, { max = null, formato = (v) => _fmtG(v), largura = 560, alturaBarra = 22, cor = GRAF.serie1, rotuloLargura = 190 } = {}) {
  const m = max ?? Math.max(1, ...itens.map((i) => i.valor ?? 0));
  const h = itens.length * (alturaBarra + 6) + 4;
  const wBar = largura - rotuloLargura - 56;
  const linhas = itens.map((it, i) => {
    const y = i * (alturaBarra + 6) + 2;
    const w = Math.max(0, ((it.valor ?? 0) / m) * wBar);
    return `
      <g data-tip="${_escG(it.tip ?? `${it.nome}: ${formato(it.valor)}`)}">
        <rect x="0" y="${y}" width="${largura}" height="${alturaBarra}" fill="transparent"/>
        <text x="${rotuloLargura - 8}" y="${y + alturaBarra / 2 + 4}" text-anchor="end" class="${GRAF.inkSec} text-[11px]">${_escG(it.nome.length > 28 ? `${it.nome.slice(0, 27)}…` : it.nome)}</text>
        <rect x="${rotuloLargura}" y="${y + 3}" width="${w}" height="${alturaBarra - 6}" rx="3" class="${it.cor ?? cor}"/>
        <text x="${rotuloLargura + w + 6}" y="${y + alturaBarra / 2 + 4}" class="${GRAF.ink} text-[11px] font-medium">${_escG(formato(it.valor))}</text>
      </g>`;
  });
  return `<svg viewBox="0 0 ${largura} ${h}" class="w-full" style="max-height:${h}px" role="img">${linhas.join('')}</svg>${tabelaDados(['Item', 'Valor'], itens.map((i) => [i.nome, formato(i.valor)]))}`;
}

// ---------- Barras empilhadas 100% (parte-para-todo por linha) ----------
// linhas: [{ nome, partes: [{ nome, valor, cor }], tip? }]
function empilhadas(linhas, { largura = 560, alturaBarra = 22, rotuloLargura = 190, legendaSeries = [] } = {}) {
  const wBar = largura - rotuloLargura - 60;
  const h = linhas.length * (alturaBarra + 6) + 4;
  const svg = linhas.map((l, i) => {
    const y = i * (alturaBarra + 6) + 2;
    const total = l.partes.reduce((s, p) => s + p.valor, 0) || 1;
    let x = rotuloLargura;
    const segs = l.partes.filter((p) => p.valor > 0).map((p) => {
      const w = (p.valor / total) * wBar;
      const s = `<rect x="${x}" y="${y + 3}" width="${Math.max(0, w - 2)}" height="${alturaBarra - 6}" rx="3" class="${p.cor}" data-tip="${_escG(`${l.nome}\n${p.nome}: ${p.valor} (${Math.round((p.valor / total) * 100)}%)`)}"/>`;
      x += w; return s;
    }).join('');
    return `
      <g>
        <text x="${rotuloLargura - 8}" y="${y + alturaBarra / 2 + 4}" text-anchor="end" class="${GRAF.inkSec} text-[11px]">${_escG(l.nome)}</text>
        ${segs}
        <text x="${rotuloLargura + wBar + 6}" y="${y + alturaBarra / 2 + 4}" class="${GRAF.ink} text-[11px] font-medium">${_escG(String(total))}</text>
      </g>`;
  });
  return `${legenda(legendaSeries)}<svg viewBox="0 0 ${largura} ${h}" class="w-full" style="max-height:${h}px" role="img">${svg.join('')}</svg>${tabelaDados(['Linha', ...(legendaSeries.map((s) => s.nome))], linhas.map((l) => [l.nome, ...l.partes.map((p) => String(p.valor))]))}`;
}

// ---------- Colunas por período com 2 séries (linhas) ----------
// pontos: [{ rotulo, a, b }]; series: [{ nome, cor(linha), corFill }]
function linhasTempo(pontos, series, { largura = 560, altura = 200 } = {}) {
  const mL = 36; const mR = 12; const mT = 12; const mB = 28;
  const w = largura - mL - mR; const h = altura - mT - mB;
  const max = Math.max(1, ...pontos.flatMap((p) => [p.a, p.b ?? 0]));
  const passo = max <= 5 ? 1 : max <= 12 ? 2 : max <= 30 ? 5 : 10;
  const topo = Math.ceil(max / passo) * passo;
  const x = (i) => mL + (pontos.length === 1 ? w / 2 : (i / (pontos.length - 1)) * w);
  const y = (v) => mT + h - (v / topo) * h;
  const grade = []; for (let v = 0; v <= topo; v += passo) grade.push(`<line x1="${mL}" x2="${mL + w}" y1="${y(v)}" y2="${y(v)}" class="${GRAF.grade}" stroke-width="1"/><text x="${mL - 6}" y="${y(v) + 4}" text-anchor="end" class="${GRAF.inkSec} text-[10px] tabular-nums">${v}</text>`);
  const caminho = (chave) => pontos.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p[chave] ?? 0)}`).join(' ');
  const marcas = (chave, cor, nome) => pontos.map((p, i) => `<circle cx="${x(i)}" cy="${y(p[chave] ?? 0)}" r="4" class="${cor} stroke-white dark:stroke-neutral-950" stroke-width="2" data-tip="${_escG(`${p.rotulo}\n${nome}: ${p[chave] ?? 0}`)}"/>`).join('');
  const rotulos = pontos.map((p, i) => (pontos.length > 8 && i % 2 ? '' : `<text x="${x(i)}" y="${altura - 8}" text-anchor="middle" class="${GRAF.inkSec} text-[10px]">${_escG(p.rotulo)}</text>`)).join('');
  const ultimo = pontos.at(-1);
  return `${legenda(series.map((s) => ({ nome: s.nome, cor: s.corFill })))}
    <svg viewBox="0 0 ${largura} ${altura}" class="w-full" role="img">
      ${grade.join('')}
      <line x1="${mL}" x2="${mL + w}" y1="${y(0)}" y2="${y(0)}" class="${GRAF.eixo}" stroke-width="1"/>
      <path d="${caminho('a')}" fill="none" class="${series[0].cor}" stroke-width="2" stroke-linejoin="round"/>
      ${series[1] ? `<path d="${caminho('b')}" fill="none" class="${series[1].cor}" stroke-width="2" stroke-linejoin="round"/>` : ''}
      ${marcas('a', series[0].corFill, series[0].nome)}
      ${series[1] ? marcas('b', series[1].corFill, series[1].nome) : ''}
      ${ultimo ? `<text x="${x(pontos.length - 1) - 8}" y="${y(ultimo.a) - 8}" text-anchor="end" class="${GRAF.ink} text-[11px] font-medium">${ultimo.a}</text>` : ''}
      ${rotulos}
    </svg>${tabelaDados(['Período', ...series.map((s) => s.nome)], pontos.map((p) => [p.rotulo, p.a, ...(series[1] ? [p.b] : [])]))}`;
}

// ---------- Polar area (Chart.js-like): fatias de ângulo igual, raio proporcional ao valor ----------
// itens: [{ nome, valor, cor?, tip? }]. Rótulo do item ao lado de cada fatia (quebra em 2 linhas quando longo),
// anéis de grade, tooltip por fatia e legenda com n e %. Uma fatia por item, na ordem recebida (começa no topo, sentido horário).
function polar(itens, { tamanho = 240, formato = (v) => _fmtG(v), rotulos = true } = {}) {
  const dados = itens.filter((i) => (i.valor ?? 0) > 0);
  const total = dados.reduce((s, i) => s + i.valor, 0);
  if (!total) return '<p class="text-sm text-slate-400 py-6 text-center">Sem valores.</p>';
  const pad = rotulos ? 118 : 8; const padV = rotulos ? 30 : 8;
  const W = tamanho + pad * 2; const H = tamanho + padV * 2;
  const cx = W / 2; const cy = H / 2; const R = tamanho / 2;
  const max = Math.max(...dados.map((i) => i.valor));
  const passo = max <= 4 ? 1 : max <= 10 ? 2 : max <= 25 ? 5 : 10;
  const topo = Math.ceil(max / passo) * passo;
  const n = dados.length; const ang = (2 * Math.PI) / n;
  const pt = (rad, a) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  const grade = []; for (let v = passo; v <= topo; v += passo) grade.push(`<circle cx="${cx}" cy="${cy}" r="${(v / topo) * R}" fill="none" class="${GRAF.grade}" stroke-width="1"/><text x="${cx + 3}" y="${cy - (v / topo) * R - 2}" class="${GRAF.inkSec} text-[9px] tabular-nums">${v}</text>`);
  const quebrar = (t) => { const s = String(t); if (s.length <= 16) return [s]; const ps = s.split(' '); const l1 = []; while (ps.length && (l1.join(' ') + ' ' + ps[0]).trim().length <= 16) l1.push(ps.shift()); if (!l1.length) l1.push(ps.shift()); return [l1.join(' '), ps.join(' ')].filter(Boolean); };
  const fatias = dados.map((i, k) => {
    const a0 = -Math.PI / 2 + k * ang; const a1 = a0 + ang; const r = (i.valor / topo) * R;
    const [x0, y0] = pt(r, a0); const [x1, y1] = pt(r, a1);
    const pct = Math.round((i.valor / total) * 1000) / 10;
    const cor = i.cor ?? GRAF.cat[k % GRAF.cat.length];
    const tip = i.tip ?? `${i.nome}: ${formato(i.valor)} (${pct.toLocaleString('pt-BR')}%)`;
    const am = (a0 + a1) / 2; const [lx, ly] = pt(R + 10, am); const direita = Math.cos(am) > 0.05; const topoBaixo = Math.abs(Math.cos(am)) <= 0.05;
    const linhas = quebrar(i.nome);
    const rotulo = rotulos ? `<text x="${lx}" y="${ly + (topoBaixo ? (Math.sin(am) < 0 ? -4 : 12) : 4) - (linhas.length - 1) * 5}" text-anchor="${topoBaixo ? 'middle' : direita ? 'start' : 'end'}" class="${GRAF.ink} text-[10px]">${linhas.map((l, j) => `<tspan x="${lx}" dy="${j ? 11 : 0}">${_escG(l)}</tspan>`).join('')}</text>` : '';
    const [vx, vy] = pt(Math.max(r * 0.62, 14), am);
    return `<path d="M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z" class="${cor} stroke-white dark:stroke-neutral-950" stroke-width="1.5" fill-opacity="0.85" data-tip="${_escG(tip)}"/>${r > 22 ? `<text x="${vx}" y="${vy + 4}" text-anchor="middle" class="fill-white text-[11px] font-semibold pointer-events-none">${formato(i.valor)}</text>` : ''}${rotulo}`;
  }).join('');
  const raios = dados.map((_, k) => { const [x, y] = pt(R, -Math.PI / 2 + k * ang); return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="${GRAF.grade}" stroke-width="1"/>`; }).join('');
  const legenda = dados.map((i, k) => { const pct = Math.round((i.valor / total) * 1000) / 10; return `<li class="flex items-center gap-2 text-sm"><svg width="10" height="10" class="shrink-0"><rect width="10" height="10" rx="2" class="${i.cor ?? GRAF.cat[k % GRAF.cat.length]}"/></svg><span class="flex-1 min-w-0 truncate text-slate-700 dark:text-neutral-200">${_escG(i.nome)}</span><span class="tabular-nums text-slate-500 dark:text-neutral-400">${_escG(formato(i.valor))}</span><span class="w-12 text-right tabular-nums font-medium text-slate-800 dark:text-neutral-100">${pct.toLocaleString('pt-BR')}%</span></li>`; }).join('');
  return `
    <svg viewBox="0 0 ${W} ${H}" class="w-full" style="max-height:${H + 40}px" role="img">${grade.join('')}${raios}${fatias}</svg>
    <ul class="mt-2 space-y-1 columns-1 sm:columns-2 [&>li]:break-inside-avoid">${legenda}</ul>`;
}

// ---------- Colunas agrupadas por período (1 ou 2 séries), eixo fixo opcional ----------
// pontos: [{ rotulo, a, b }]; series: [{ nome, cor(fill) }]. `topo` fixa o eixo (ex.: 5 para notas 1–5); sem ele, segue o máximo.
function colunasTempo(pontos, series, { largura = 560, altura = 200, topo = null, formato = (v) => _fmtG(v, 1), minimo = 0 } = {}) {
  const mL = 36; const mR = 12; const mT = 14; const mB = 28;
  const w = largura - mL - mR; const h = altura - mT - mB;
  const chaves = series.length > 1 ? ['a', 'b'] : ['a'];
  const max = Math.max(1, ...pontos.flatMap((p) => chaves.map((k) => p[k] ?? 0)));
  const passo = topo ? (topo <= 5 ? 1 : topo <= 12 ? 2 : topo <= 30 ? 5 : 10) : max <= 5 ? 1 : max <= 12 ? 2 : max <= 30 ? 5 : 10;
  const fim = topo ?? Math.ceil(max / passo) * passo;
  const y = (v) => mT + h - ((Math.max(minimo, v) - minimo) / (fim - minimo)) * h;
  const grade = []; for (let v = minimo; v <= fim + 1e-9; v += passo) grade.push(`<line x1="${mL}" x2="${mL + w}" y1="${y(v)}" y2="${y(v)}" class="${GRAF.grade}" stroke-width="1"/><text x="${mL - 6}" y="${y(v) + 4}" text-anchor="end" class="${GRAF.inkSec} text-[10px] tabular-nums">${v}</text>`);
  const slot = w / Math.max(1, pontos.length); const gap = Math.min(10, slot * 0.25); const wBar = Math.max(3, (slot - gap) / chaves.length);
  const cols = pontos.map((p, i) => chaves.map((k, j) => {
    const v = p[k]; if (v == null) return '';
    const x = mL + i * slot + gap / 2 + j * wBar; const yy = y(v);
    return `<rect x="${x}" y="${yy}" width="${Math.max(1, wBar - 1)}" height="${Math.max(0, mT + h - yy)}" rx="2" class="${series[j].cor}" data-tip="${_escG(`${p.rotulo}\n${series[j].nome}: ${formato(v)}`)}"/>${wBar >= 18 ? `<text x="${x + (wBar - 1) / 2}" y="${yy - 3}" text-anchor="middle" class="${GRAF.ink} text-[9px] tabular-nums">${_escG(formato(v))}</text>` : ''}`;
  }).join('')).join('');
  const rotulos = pontos.map((p, i) => (pontos.length > 8 && i % 2 ? '' : `<text x="${mL + i * slot + slot / 2}" y="${altura - 8}" text-anchor="middle" class="${GRAF.inkSec} text-[10px]">${_escG(p.rotulo)}</text>`)).join('');
  return `${legenda(series)}
    <svg viewBox="0 0 ${largura} ${altura}" class="w-full" role="img">
      ${grade.join('')}
      <line x1="${mL}" x2="${mL + w}" y1="${y(minimo)}" y2="${y(minimo)}" class="${GRAF.eixo}" stroke-width="1"/>
      ${cols}${rotulos}
    </svg>${tabelaDados(['Período', ...series.map((s) => s.nome)], pontos.map((p) => [p.rotulo, ...chaves.map((k) => (p[k] == null ? '—' : formato(p[k])))]))}`;
}

// ---------- Colunas simples (distribuição, ex.: notas 1–5) ----------
function colunas(itens, { largura = 320, altura = 150, cor = GRAF.serie1 } = {}) {
  const mB = 22; const mT = 18; const h = altura - mT - mB; const gap = 10;
  const wCol = (largura - gap * (itens.length + 1)) / itens.length;
  const max = Math.max(1, ...itens.map((i) => i.valor));
  const cols = itens.map((it, i) => {
    const x = gap + i * (wCol + gap); const hh = (it.valor / max) * h; const y = mT + h - hh;
    return `<g data-tip="${_escG(it.tip ?? `${it.nome}: ${it.valor}`)}"><rect x="${x}" y="${mT}" width="${wCol}" height="${h}" fill="transparent"/><rect x="${x}" y="${y}" width="${wCol}" height="${hh}" rx="3" class="${it.cor ?? cor}"/><text x="${x + wCol / 2}" y="${y - 4}" text-anchor="middle" class="${GRAF.ink} text-[11px] font-medium">${it.valor}</text><text x="${x + wCol / 2}" y="${altura - 6}" text-anchor="middle" class="${GRAF.inkSec} text-[11px]">${_escG(it.nome)}</text></g>`;
  });
  return `<svg viewBox="0 0 ${largura} ${altura}" class="w-full" style="max-height:${altura}px" role="img"><line x1="0" x2="${largura}" y1="${mT + h}" y2="${mT + h}" class="${GRAF.eixo}"/>${cols.join('')}</svg>${tabelaDados(['Item', 'Total'], itens.map((i) => [i.nome, i.valor]))}`;
}

// ---------- Medidor (ratio contra meta) ----------
function medidor(pct, { meta = null, rotulo = '' } = {}) {
  const v = pct == null ? 0 : Math.max(0, Math.min(100, pct));
  const cor = pct == null ? GRAF.neutro : (meta != null && pct < meta ? GRAF.critico : GRAF.bom);
  return `
    <div>
      <svg viewBox="0 0 200 14" class="w-full" style="max-height:14px" role="img" data-tip="${_escG(`${rotulo}: ${pct == null ? '—' : `${pct}%`}${meta != null ? ` (meta ${meta}%)` : ''}`)}">
        <rect x="0" y="3" width="200" height="8" rx="4" class="bg-slate-100 fill-slate-100 dark:fill-neutral-900"/>
        <rect x="0" y="3" width="${v * 2}" height="8" rx="4" class="${cor}"/>
        ${meta != null ? `<line x1="${meta * 2}" x2="${meta * 2}" y1="0" y2="14" class="stroke-slate-500 dark:stroke-neutral-400" stroke-width="2"/>` : ''}
      </svg>
      ${meta != null ? `<p class="text-[11px] text-slate-400 mt-0.5">meta ${meta}%</p>` : ''}
    </div>`;
}

// ---------- Tile de indicador ----------
// `fundo: true` pinta o cartão com a cor do tom (ênfase nos painéis financeiros); `tom: 'info'` = azul petróleo, 'neutro' = cinza.
// `icone`: nome em TILE_ICONES (svg de traço, 20px) mostrado no canto superior direito.
const TILE_ICONES = {
  banco: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />',
  entrada: '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />',
  saida: '<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />',
  resultado: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />',
  alerta: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />',
  relogio: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />',
  percentual: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />',
  calendario: '<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />',
};
function tile({ rotulo, valor, sufixo = '', ajuda = '', tom = 'neutro', extraHtml = '', fundo = false, icone = '' }) {
  const cores = { neutro: 'text-slate-900 dark:text-neutral-100', info: 'text-petrol-800 dark:text-sky-300', bom: 'text-emerald-700 dark:text-emerald-400', ruim: 'text-red-700 dark:text-red-400', alerta: 'text-amber-700 dark:text-amber-400' };
  const fundos = {
    neutro: 'bg-slate-50 border-slate-200 dark:bg-neutral-900 dark:border-neutral-800',
    info: 'bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-900',
    bom: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900',
    ruim: 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900',
    alerta: 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900',
  };
  const rotuloCor = { neutro: 'text-slate-500 dark:text-neutral-400', info: 'text-sky-800/80 dark:text-sky-300/80', bom: 'text-emerald-800/80 dark:text-emerald-300/80', ruim: 'text-red-800/80 dark:text-red-300/80', alerta: 'text-amber-800/80 dark:text-amber-300/80' };
  const ajudaCor = fundo && tom !== 'neutro' ? rotuloCor[tom] : 'text-slate-400';
  const classe = fundo ? `rounded-xl border shadow-sm ${fundos[tom] ?? fundos.neutro}` : CARTAO;
  return `
    <div class="${classe} px-4 py-3 relative">
      ${TILE_ICONES[icone] ? `<span class="absolute top-3 right-3 h-8 w-8 rounded-lg grid place-items-center ${fundo ? 'bg-white/70 dark:bg-black/30' : 'bg-slate-100 dark:bg-neutral-900'} ${cores[tom] ?? cores.neutro}"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.7" stroke="currentColor">${TILE_ICONES[icone]}</svg></span>` : ''}
      <p class="text-[11px] font-semibold uppercase tracking-wider ${fundo ? rotuloCor[tom] ?? rotuloCor.neutro : 'text-slate-500 dark:text-neutral-400'} ${TILE_ICONES[icone] ? 'pr-10' : ''}">${_escG(rotulo)}</p>
      <p class="mt-1 font-display text-3xl font-semibold ${cores[tom] ?? cores.neutro} leading-none">${_escG(valor)}<span class="text-base font-normal ${ajudaCor} ml-1">${_escG(sufixo)}</span></p>
      ${ajuda ? `<p class="text-xs ${ajudaCor} mt-1.5">${ajuda}</p>` : ''}
      ${extraHtml ? `<div class="mt-2">${extraHtml}</div>` : ''}
    </div>`;
}

// ---------- Rosca / pizza (participação % por categoria) ----------
// itens: [{ nome, valor, cor (classe fill-*), tip? }]. Uma fatia por item; rótulo de % dentro da fatia quando cabe (≥ 6%).
function rosca(itens, { tamanho = 220, espessura = 0.42, formato = (v) => _fmtG(v), centro = '', legenda: comLegenda = true } = {}) {
  const total = itens.reduce((s, i) => s + (i.valor ?? 0), 0);
  if (!total) return '<p class="text-sm text-slate-400 py-6 text-center">Sem valores.</p>';
  const cx = tamanho / 2; const cy = tamanho / 2; const R = tamanho / 2 - 4; const r = R * (1 - espessura);
  let ang = -Math.PI / 2;
  const pt = (rad, a) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  const fatias = itens.map((i) => {
    const frac = (i.valor ?? 0) / total; const a0 = ang; const a1 = ang + frac * 2 * Math.PI; ang = a1;
    const grande = frac > 0.5 ? 1 : 0;
    const [x0, y0] = pt(R, a0); const [x1, y1] = pt(R, a1); const [xi0, yi0] = pt(r, a0); const [xi1, yi1] = pt(r, a1);
    const d = frac >= 0.9999
      ? `M ${cx} ${cy - R} A ${R} ${R} 0 1 1 ${cx - 0.01} ${cy - R} L ${cx - 0.01} ${cy - r} A ${r} ${r} 0 1 0 ${cx} ${cy - r} Z`
      : `M ${x0} ${y0} A ${R} ${R} 0 ${grande} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${r} ${r} 0 ${grande} 0 ${xi0} ${yi0} Z`;
    const [tx, ty] = pt((R + r) / 2, (a0 + a1) / 2);
    const pct = Math.round(frac * 1000) / 10;
    const tip = i.tip ?? `${i.nome}: ${formato(i.valor)} (${pct.toLocaleString('pt-BR')}%)`;
    return `<path d="${d}" class="${i.cor ?? GRAF.serie1} stroke-white dark:stroke-neutral-950" stroke-width="2" data-tip="${_escG(tip)}"/>${frac >= 0.06 ? `<text x="${tx}" y="${ty + 4}" text-anchor="middle" class="fill-white text-[11px] font-semibold pointer-events-none">${pct.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%</text>` : ''}`;
  }).join('');
  const legenda = itens.map((i) => { const pct = Math.round(((i.valor ?? 0) / total) * 1000) / 10; return `<li class="flex items-center gap-2 text-sm"><svg width="10" height="10" class="shrink-0"><rect width="10" height="10" rx="2" class="${i.cor ?? GRAF.serie1}"/></svg><span class="flex-1 min-w-0 truncate text-slate-700 dark:text-neutral-200">${_escG(i.nome)}</span><span class="tabular-nums text-slate-500 dark:text-neutral-400">${_escG(formato(i.valor))}</span><span class="w-12 text-right tabular-nums font-medium text-slate-800 dark:text-neutral-100">${pct.toLocaleString('pt-BR')}%</span></li>`; }).join('');
  return `
    <div class="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 ${tamanho} ${tamanho}" width="${tamanho}" height="${tamanho}" role="img" class="shrink-0">${fatias}${centro ? `<text x="${cx}" y="${cy - 4}" text-anchor="middle" class="${GRAF.inkSec} text-[10px] uppercase">Total</text><text x="${cx}" y="${cy + 14}" text-anchor="middle" class="${GRAF.ink} text-[14px] font-semibold">${_escG(centro)}</text>` : ''}</svg>
      ${comLegenda ? `<ul class="flex-1 min-w-[220px] space-y-1.5">${legenda}</ul>` : ''}
    </div>`;
}
