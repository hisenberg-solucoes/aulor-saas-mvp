// ============================================================
// Implementação da V1: o mapa das telas (raias, grupos e cartões) com arrasto e zoom, os
// indicadores que destacam o que falta e a ficha de cada tela. Dados em js/implementacao-data.js.
// ============================================================

(function () {
  const D = IMPLEMENTACAO;
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LADOS = [['web', 'Web'], ['api', 'API']];
  const SITUACAO = { ok: 'Feito', parcial: 'Parcial', falta: 'Falta', na: '—' };
  const ICONE = {
    fechar: '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />',
    tomada: '<path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />',
    pagina: '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />',
    raia: '<path stroke-linecap="round" stroke-linejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />',
    rota: '<path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />',
  };
  const svg = (nome) => `<svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">${ICONE[nome]}</svg>`;

  // ---------- Índices e contagens ----------
  const telas = [];
  const porId = {};
  const contar = (features) => Object.fromEntries(LADOS.map(([lado]) => {
    const fs = features.filter((f) => f[lado] !== 'na');
    return [lado, { total: fs.length, feitas: fs.filter((f) => f[lado] === 'ok').length, parciais: fs.filter((f) => f[lado] === 'parcial').length }];
  }));
  function registrar(tela, raia, grupo) {
    const item = { ...tela, raia, grupo, c: contar(tela.features) };
    telas.push(item);
    porId[tela.id] = item;
  }
  registrar(D.entrada, { id: 'entrada', nome: 'Acesso' }, null);
  D.raias.forEach((r) => r.grupos.forEach((g) => g.telas.forEach((t) => registrar(t, r, g))));
  const integracoes = Object.fromEntries(D.integracoes.map((i) => [i.id, i]));
  const somar = (ts) => contar(ts.flatMap((t) => t.features));

  // Ligações nos dois sentidos: quem aponta para a tela também aparece ligado a ela.
  const ligadas = (t) => [...new Set([...(t.liga ?? []), ...telas.filter((u) => u.liga?.includes(t.id)).map((u) => u.id)])];
  const usam = (idInt) => telas.filter((t) => t.integracoes?.includes(idInt));

  const completo = (c) => c.feitas === c.total;
  const comecada = (c) => c.feitas + c.parciais > 0;
  // Os filtros são sobre as features das telas; as integrações só ficam em destaque em "todas".
  const FILTROS = {
    todas: () => true,
    web: (t) => comecada(t.c.web),
    api: (t) => comecada(t.c.api),
    'so-web': (t) => t.c.api.total > 0 && completo(t.c.api) && !completo(t.c.web),
  };
  const soFaltaWeb = FILTROS['so-web'];

  // ---------- Peças ----------
  function medidor(c) {
    const pct = (n) => (c.total ? (n / c.total) * 100 : 0);
    return `<span class="medidor" aria-hidden="true"><span class="medidor-feito" style="width:${pct(c.feitas)}%"></span><span class="medidor-parcial" style="width:${pct(c.parciais)}%"></span></span>`;
  }
  const resumo = (c) => (c.total ? `${c.feitas} de ${c.total} feitas${c.parciais ? `, ${c.parciais} ${c.parciais > 1 ? 'parciais' : 'parcial'}` : ''}` : 'nada a fazer');
  const ladoLinha = (c, nome) => `<span class="no-lado"><span class="no-lado-nome">${nome}</span>${medidor(c)}<span class="no-conta">${c.feitas}/${c.total}</span></span>`;
  const fase = (s, texto = SITUACAO[s]) => `<span class="fase fase-${s}">${esc(texto)}</span>`;

  function cartao(t) {
    const so = soFaltaWeb(t);
    const ints = (t.integracoes ?? []).map((id) => integracoes[id].nome);
    const rotulo = `${t.nome}. Web: ${resumo(t.c.web)}. API: ${resumo(t.c.api)}.${so ? ' Só falta o web.' : ''}`;
    return `<button type="button" class="no${so ? ' so-web' : ''}" data-id="${esc(t.id)}" aria-controls="ficha" aria-expanded="false" aria-label="${esc(rotulo)}">
      <span class="no-nome">${esc(t.nome)}</span>
      <span class="no-sub">${esc(t.prototipo.join(' · '))}</span>
      <span class="no-lados">${LADOS.map(([lado, nome]) => ladoLinha(t.c[lado], nome)).join('')}</span>
      ${so || ints.length ? `<span class="no-pe">${so ? '<span class="pilula pilula-aviso">Só falta o web</span>' : ''}${ints.length ? `${svg('tomada')}<span>${esc(ints.join(' · '))}</span>` : ''}</span>` : ''}
    </button>`;
  }

  function cartaoIntegracao(i) {
    const n = usam(i.id).length;
    const situacao = i.situacao === 'ok' ? fase('ok', 'Integrada') : fase('falta', 'Falta');
    return `<button type="button" class="no" data-int="${esc(i.id)}" aria-controls="ficha" aria-expanded="false" aria-label="${esc(`${i.nome}. ${i.situacao === 'ok' ? 'Integrada' : 'Falta'}. Usada em ${n} ${n === 1 ? 'tela' : 'telas'}.`)}">
      <span class="no-nome">${esc(i.nome)}</span>
      <span class="no-uso">${esc(i.uso)}</span>
      <span class="no-situacao">${situacao}</span>
      <span class="no-pe">${i.prazo ? '<span class="pilula pilula-aviso">Prazo externo</span>' : ''}<span>Usada em ${n} ${n === 1 ? 'tela' : 'telas'}</span></span>
    </button>`;
  }

  function cabecaRaia(id, nome, descricao, c) {
    const rotulo = `Aproximar ${nome}: ${descricao}.${c ? ` Web: ${resumo(c.web)}. API: ${resumo(c.api)}.` : ''}`;
    return `<button type="button" class="raia-cabeca" data-aproximar="${esc(id)}" aria-label="${esc(rotulo)}">
      <span class="raia-nome">${esc(nome)}</span>
      <span class="raia-desc">${esc(descricao)}</span>
      ${c ? `<span class="raia-lados">${LADOS.map(([lado, n]) => ladoLinha(c[lado], n)).join('')}</span>` : ''}
    </button>`;
  }

  function raia(r, coluna) {
    const ts = telas.filter((t) => t.raia === r);
    const unica = r.grupos.length === 1;
    return `<section class="raia${unica ? ' raia-unica' : ''}" data-raia="${esc(r.id)}" style="grid-column:${coluna};grid-row:2" aria-label="${esc(r.nome)}">
      ${cabecaRaia(r.id, r.nome, `${r.descricao} · ${ts.length} ${ts.length === 1 ? 'tela' : 'telas'}`, somar(ts))}
      <div class="raia-grupos">${r.grupos.map((g) => `
        <div class="grupo">
          ${unica ? '' : `<div class="grupo-cabeca"><span>${esc(g.nome)}</span><span class="grupo-conta">${g.telas.length}</span></div>`}
          <ol class="grupo-telas">${g.telas.map((t) => `<li>${cartao(porId[t.id])}</li>`).join('')}</ol>
        </div>`).join('')}
      </div>
    </section>`;
  }

  function raiaIntegracoes(coluna) {
    const feitas = D.integracoes.filter((i) => i.situacao === 'ok').length;
    return `<section class="raia raia-unica" data-raia="integracoes" style="grid-column:${coluna};grid-row:2" aria-label="Integrações">
      ${cabecaRaia('integracoes', 'Integrações', `Serviços de fora da V1 · ${feitas} de ${D.integracoes.length} integradas`)}
      <div class="raia-grupos"><div class="grupo"><ol class="grupo-telas">${D.integracoes.map((i) => `<li>${cartaoIntegracao(i)}</li>`).join('')}</ol></div></div>
    </section>`;
  }

  // ---------- Montagem ----------
  const area = document.getElementById('area');
  const mapa = document.getElementById('mapa');
  const mundo = document.getElementById('mundo');
  const ficha = document.getElementById('ficha');
  const zoomValor = document.getElementById('zoom-valor');
  const anuncio = document.getElementById('anuncio');

  // As colunas saem dos dados: uma por raia e a das integrações; a Entrada fica sobre os portais.
  const PORTAIS = D.raias.filter((r) => r.portal).map((r) => r.id);
  const colunaDe = (id) => D.raias.findIndex((r) => r.id === id) + 1;
  mundo.style.gridTemplateColumns = `repeat(${D.raias.length + 1}, max-content)`;
  mundo.innerHTML = `
    <svg class="arestas" aria-hidden="true"><g class="arestas-fixas"></g><g class="arestas-ligacoes"></g></svg>
    <div class="entrada" style="grid-column:${colunaDe(PORTAIS[0])} / ${colunaDe(PORTAIS.at(-1)) + 1}">${cartao(porId.entrada)}</div>
    ${D.raias.map((r, i) => raia(r, i + 1)).join('')}
    ${raiaIntegracoes(D.raias.length + 1)}`;
  const fixas = mundo.querySelector('.arestas-fixas');
  let ligacoes = mundo.querySelector('.arestas-ligacoes');

  const { data, web, api } = D.retrato;
  const repo = (r) => `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(`${r.repo} ${r.commit}`)}</a>`;
  document.getElementById('retrato').innerHTML = `Retrato de ${new Date(`${data}T12:00`).toLocaleDateString('pt-BR')}<span class="topo-repos"> · ${repo(web)} · ${repo(api)}</span>`;

  // ---------- Indicadores que destacam ----------
  let filtro = 'todas';
  function indicadores() {
    const t = somar(telas);
    const n = (f) => telas.filter(FILTROS[f]).length;
    const telasTxt = (k) => `${k}<small>${k === 1 ? 'tela' : 'telas'}</small>`;
    const comecadas = (k) => `${k} ${k === 1 ? 'tela começada' : 'telas começadas'}`;
    const celulas = [
      { f: 'todas', rotulo: 'Telas no mapa', valor: telasTxt(telas.length), ctx: 'Entrada, cadastro pelo link, administrativo e os dois portais' },
      { f: 'web', rotulo: 'Feito no web', valor: `${t.web.feitas}<small>de ${t.web.total} features</small>`, ctx: `${medidor(t.web)}${comecadas(n('web'))}` },
      { f: 'api', rotulo: 'Feito na API', valor: `${t.api.feitas}<small>de ${t.api.total} features</small>`, ctx: `${medidor(t.api)}${comecadas(n('api'))}` },
      { f: 'so-web', rotulo: 'Só falta o web', valor: telasTxt(n('so-web')), ctx: 'A API já cobre a tela inteira', pendencia: true },
    ];
    document.getElementById('indicadores').innerHTML = celulas.map((c) => `
      <button type="button" class="indicador${c.pendencia ? ' indicador-pendencia' : ''}${c.f === filtro ? ' ativo' : ''}" data-filtro="${c.f}"${c.f === 'todas' ? '' : ` aria-pressed="${c.f === filtro}"`}>
        <span class="indicador-rotulo">${c.rotulo}</span>
        <span class="indicador-valor">${c.valor}</span>
        <span class="indicador-contexto">${c.ctx}</span>
      </button>`).join('');
  }

  function filtrar(f) {
    filtro = f;
    // "Telas no mapa" não é um filtro que liga e desliga: é a volta a todas, sem aria-pressed.
    document.querySelectorAll('[data-filtro]').forEach((b) => {
      b.classList.toggle('ativo', b.dataset.filtro === f);
      if (b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', String(b.dataset.filtro === f));
    });
    let n = 0;
    mundo.querySelectorAll('.no').forEach((el) => {
      const ok = el.dataset.id ? FILTROS[f](porId[el.dataset.id]) : f === 'todas';
      el.classList.toggle('apagado', !ok);
      if (ok && el.dataset.id) n += 1;
    });
    anuncio.textContent = f === 'todas' ? 'Todas as telas em destaque.' : `${n} ${n === 1 ? 'tela em destaque' : 'telas em destaque'}.`;
  }

  document.getElementById('indicadores').addEventListener('click', (e) => {
    const b = e.target.closest('[data-filtro]');
    if (b) filtrar(b.dataset.filtro === filtro ? 'todas' : b.dataset.filtro);
  });

  // ---------- Câmera: arrasto, roda, pinça e teclas ----------
  const v = { x: 0, y: 0, s: 1 };
  const LIMITE = [0.15, 2];
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)');
  const telaMovel = matchMedia('(max-width: 767px)');
  const movel = () => telaMovel.matches;
  const limitar = (s) => Math.min(LIMITE[1], Math.max(LIMITE[0], s));
  let animacao = 0;

  function aplicar() {
    mundo.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.s})`;
    mundo.style.setProperty('--s', v.s);
    mapa.classList.toggle('longe', v.s < 0.6);
    let passo = 24 * v.s;
    while (passo < 12) passo *= 2;
    mapa.style.backgroundSize = `${passo}px ${passo}px`;
    mapa.style.backgroundPosition = `${v.x}px ${v.y}px`;
    zoomValor.value = `${Math.round(v.s * 100)}%`;
  }

  function irPara(alvo, ms = 320) {
    cancelAnimationFrame(animacao);
    if (!ms || reduzido.matches) { Object.assign(v, alvo); aplicar(); return; }
    const de = { ...v };
    const t0 = performance.now();
    const quadro = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      for (const p of ['x', 'y', 's']) v[p] = de[p] + (alvo[p] - de[p]) * e;
      aplicar();
      if (k < 1) animacao = requestAnimationFrame(quadro);
    };
    animacao = requestAnimationFrame(quadro);
  }

  function zoomEm(fator, px, py) {
    cancelAnimationFrame(animacao);
    const s = limitar(v.s * fator);
    v.x = px - (px - v.x) * (s / v.s);
    v.y = py - (py - v.y) * (s / v.s);
    v.s = s;
    aplicar();
  }

  // A parte do mapa que a ficha não cobre.
  function visivel() {
    const w = mapa.clientWidth;
    const h = mapa.clientHeight;
    if (ficha.hidden) return { x: 0, y: 0, w, h };
    return movel() ? { x: 0, y: 0, w, h: h - ficha.offsetHeight } : { x: 0, y: 0, w: w - ficha.offsetWidth, h };
  }

  // Caixa de um elemento no mundo, sem o zoom.
  function caixa(el) {
    const m = mundo.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: (r.left - m.left) / v.s, y: (r.top - m.top) / v.s, w: r.width / v.s, h: r.height / v.s };
  }

  function enquadrar(b, { ms = 320, max = 1, min = LIMITE[0] } = {}) {
    const vis = visivel();
    const folga = movel() ? 16 : 40;
    const s = Math.max(min, limitar(Math.min((vis.w - folga * 2) / b.w, (vis.h - folga * 2) / b.h, max)));
    // Se não cabe, começa do canto de cima à esquerda, como uma folha; se cabe, centraliza.
    const cabe = b.w * s <= vis.w - folga * 2 && b.h * s <= vis.h - folga * 2;
    const x = cabe ? vis.x + (vis.w - b.w * s) / 2 - b.x * s : vis.x + folga - b.x * s;
    const y = cabe ? vis.y + (vis.h - b.h * s) / 2 - b.y * s : vis.y + folga - b.y * s;
    irPara({ x, y, s }, ms);
  }
  const tudo = () => ({ x: 0, y: 0, w: mundo.offsetWidth, h: mundo.offsetHeight });

  // Traz o cartão para a parte visível, sem mudar o zoom, só quando ele está fora dela.
  function mostrar(el) {
    const vis = visivel();
    const b = caixa(el);
    const sx = v.x + b.x * v.s;
    const sy = v.y + b.y * v.s;
    const m = 24;
    if (sx >= vis.x + m && sy >= vis.y + m && sx + b.w * v.s <= vis.x + vis.w - m && sy + b.h * v.s <= vis.y + vis.h - m) return;
    irPara({ s: v.s, x: vis.x + (vis.w - b.w * v.s) / 2 - b.x * v.s, y: vis.y + (vis.h - b.h * v.s) / 2 - b.y * v.s });
  }

  const ponteiros = new Map();
  let arrasto = null;
  let pinca = null;
  let moveu = false;
  const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  mapa.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    cancelAnimationFrame(animacao);
    ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ponteiros.size === 1) {
      arrasto = { x: e.clientX, y: e.clientY, vx: v.x, vy: v.y };
      moveu = false;
    } else if (ponteiros.size === 2) {
      const [a, b] = [...ponteiros.values()];
      pinca = { d: distancia(a, b), s: v.s };
      arrasto = null;
    }
  });

  mapa.addEventListener('pointermove', (e) => {
    if (!ponteiros.has(e.pointerId)) return;
    ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinca && ponteiros.size === 2) {
      const [a, b] = [...ponteiros.values()];
      const r = mapa.getBoundingClientRect();
      zoomEm((pinca.s * distancia(a, b)) / pinca.d / v.s, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      moveu = true;
      return;
    }
    if (!arrasto) return;
    const dx = e.clientX - arrasto.x;
    const dy = e.clientY - arrasto.y;
    if (!moveu && Math.hypot(dx, dy) < 4) return;
    if (!moveu) {
      moveu = true;
      mapa.setPointerCapture(e.pointerId);
      mapa.classList.add('arrastando');
    }
    v.x = arrasto.vx + dx;
    v.y = arrasto.vy + dy;
    aplicar();
  });

  function soltar(e) {
    ponteiros.delete(e.pointerId);
    if (ponteiros.size === 1) {
      // Da pinça para um dedo: o arrasto continua de onde ele está.
      const [p] = [...ponteiros.values()];
      pinca = null;
      arrasto = { x: p.x, y: p.y, vx: v.x, vy: v.y };
    }
    if (!ponteiros.size) {
      arrasto = null;
      pinca = null;
      mapa.classList.remove('arrastando');
    }
  }
  mapa.addEventListener('pointerup', soltar);
  mapa.addEventListener('pointercancel', soltar);

  mapa.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = mapa.getBoundingClientRect();
    const k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? r.height : 1;
    if (e.ctrlKey || e.metaKey) {
      // A pinça do trackpad chega como roda com Ctrl, em passos pequenos.
      const ritmo = Math.abs(e.deltaY * k) < 50 ? 0.01 : 0.0025;
      zoomEm(Math.exp(-e.deltaY * k * ritmo), e.clientX - r.left, e.clientY - r.top);
    } else {
      cancelAnimationFrame(animacao);
      v.x -= (e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX) * k;
      v.y -= (e.shiftKey && !e.deltaX ? 0 : e.deltaY) * k;
      aplicar();
    }
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest('input, textarea, select')) return;
    if (e.key === 'Escape') {
      if (!ficha.hidden) fechar(true);
      return;
    }
    const centro = [mapa.clientWidth / 2, mapa.clientHeight / 2];
    if (e.key === '+' || e.key === '=') zoomEm(1.25, ...centro);
    else if (e.key === '-' || e.key === '_') zoomEm(0.8, ...centro);
    else if (e.key === '0') enquadrar(tudo());
    else if (document.activeElement === mapa && e.key.startsWith('Arrow')) {
      const passo = e.shiftKey ? 240 : 80;
      const d = { ArrowLeft: [passo, 0], ArrowRight: [-passo, 0], ArrowUp: [0, passo], ArrowDown: [0, -passo] }[e.key];
      if (!d) return;
      irPara({ s: v.s, x: v.x + d[0], y: v.y + d[1] }, 120);
    } else return;
    e.preventDefault();
  });

  // Quem anda pelo Tab também vê o cartão que recebe o foco.
  mapa.addEventListener('focusin', (e) => {
    const el = e.target.closest('.no, .raia-cabeca');
    if (el && !ponteiros.size) mostrar(el);
  });

  document.querySelector('.zoom').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-ajustar')) enquadrar(tudo());
    else zoomEm(Number(b.dataset.zoom), mapa.clientWidth / 2, mapa.clientHeight / 2);
  });

  // ---------- Arestas ----------
  // Da Entrada aos três portais: desce até o meio, anda na horizontal e desce no cabeçalho, com cantos de 8px.
  function cotovelo(x1, y1, x2, y2) {
    const meio = (y1 + y2) / 2;
    const dir = Math.sign(x2 - x1);
    const r = Math.min(8, Math.abs(x2 - x1) / 2, (y2 - y1) / 4);
    if (!dir) return `M${x1} ${y1}V${y2}`;
    return `M${x1} ${y1}V${meio - r}Q${x1} ${meio} ${x1 + dir * r} ${meio}H${x2 - dir * r}Q${x2} ${meio} ${x2} ${meio + r}V${y2}`;
  }

  function desenharFixas() {
    const e = caixa(mundo.querySelector('.entrada .no'));
    fixas.innerHTML = PORTAIS.map((id) => {
      const a = caixa(mundo.querySelector(`[data-raia="${id}"] .raia-cabeca`));
      return `<path d="${cotovelo(e.x + e.w / 2, e.y + e.h, a.x + a.w / 2, a.y)}"/>`;
    }).join('');
  }

  // O caminho até a tela aberta, inteiro em petróleo: da Entrada ao portal e do portal ao grupo (o resto é CSS).
  function caminho(el) {
    const t = el.dataset.id && porId[el.dataset.id];
    if (!t) return '';
    const e = caixa(mundo.querySelector('.entrada .no'));
    const desce = (id) => {
      const a = caixa(mundo.querySelector(`[data-raia="${id}"] .raia-cabeca`));
      return cotovelo(e.x + e.w / 2, e.y + e.h, a.x + a.w / 2, a.y);
    };
    if (t.id === 'entrada') return `<path class="caminho" d="${PORTAIS.map(desce).join('')}"/>`;
    let d = PORTAIS.includes(t.raia.id) ? desce(t.raia.id) : '';
    if (t.raia.grupos.length > 1) {
      const a = caixa(mundo.querySelector(`[data-raia="${t.raia.id}"] .raia-cabeca`));
      const g = caixa(el.closest('.grupo').querySelector('.grupo-cabeca'));
      d += cotovelo(a.x + a.w / 2, a.y + a.h, g.x + g.w / 2, g.y);
    }
    return d ? `<path class="caminho" d="${d}"/>` : '';
  }

  // Da tela aberta às telas e integrações ligadas: curva que sai pelo lado mais perto do alvo.
  function desenharLigacoes(origem, alvos) {
    const a = caixa(origem);
    const novo = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    novo.setAttribute('class', 'arestas-ligacoes');
    novo.innerHTML = caminho(origem) + alvos.map((el) => {
      const b = caixa(el);
      let x1 = a.x + a.w;
      let x2 = b.x;
      let c1 = 1;
      let c2 = -1;
      if (b.x + b.w <= a.x) { x1 = a.x; x2 = b.x + b.w; c1 = -1; c2 = 1; } else if (b.x < a.x + a.w) { x2 = b.x + b.w; c2 = 1; }
      const y1 = a.y + a.h / 2;
      const y2 = b.y + b.h / 2;
      const d = Math.max(64, Math.abs(x2 - x1) / 2);
      return `<path d="M${x1} ${y1}C${x1 + c1 * d} ${y1} ${x2 + c2 * d} ${y2} ${x2} ${y2}"/><circle cx="${x1}" cy="${y1}" r="3"/><circle cx="${x2}" cy="${y2}" r="3"/>`;
    }).join('');
    ligacoes.replaceWith(novo); // um grupo novo, para o fade de entrada correr de novo
    ligacoes = novo;
  }

  // ---------- Ficha ----------
  let aberto = null;

  function secao(titulo, corpo) {
    return corpo ? `<section class="ficha-secao"><h3>${esc(titulo)}</h3>${corpo}</section>` : '';
  }

  function tabelaFeatures(t) {
    const partes = [];
    for (const f of t.features) {
      const ultima = partes[partes.length - 1];
      if (ultima?.nome === f.parte) ultima.itens.push(f);
      else partes.push({ nome: f.parte, itens: [f] });
    }
    return `<table class="tabela">
      <colgroup><col><col style="width:84px"><col style="width:84px"></colgroup>
      <thead><tr><th scope="col">Feature</th><th scope="col">Web</th><th scope="col">API</th></tr></thead>
      ${partes.map((p) => `<tbody>
        <tr class="tabela-parte"><th scope="colgroup" colspan="3">${esc(p.nome)}</th></tr>
        ${p.itens.map((f) => `<tr>
          <td>${esc(f.nome)}${f.nota ? `<span class="tabela-nota">${esc(f.nota)}</span>` : ''}</td>
          <td>${fase(f.web)}</td>
          <td>${fase(f.api)}</td>
        </tr>`).join('')}
      </tbody>`).join('')}
    </table>`;
  }

  // A raia vai junto: há telas de mesmo nome em portais diferentes (Financeiro, Início).
  const linhaTela = (u) => `<li><span><button type="button" class="link" data-ir="${esc(u.id)}">${esc(u.nome)}</button><small>${esc(u.raia.nome)}</small></span><span class="no-conta">Web ${u.c.web.feitas}/${u.c.web.total} · API ${u.c.api.feitas}/${u.c.api.total}</span></li>`;

  function fichaTela(t) {
    const trilha = [t.raia.nome, t.grupo && t.grupo.nome !== t.raia.nome && t.grupo.nome !== t.nome ? t.grupo.nome : null].filter(Boolean).join(' › ');
    const webTxt = t.web ? `${t.web}${t.webSituacao ? ` · ${t.webSituacao}` : ''}` : t.webSituacao ?? 'Sem rota no web';
    const arquivos = (t.webArquivos ?? []).map((a) => `<li><a class="link" href="${esc(`https://github.com/hisenberg-solucoes/aulor-web/blob/${D.retrato.web.commit}/src/app/${a}`)}" target="_blank" rel="noopener">${esc(a)}</a></li>`).join('');
    const ints = (t.integracoes ?? []).map((id) => integracoes[id]);
    const rel = ligadas(t).map((id) => porId[id]);
    return `
      <div class="ficha-cabeca">
        <button type="button" class="ficha-fechar" data-fechar aria-label="Fechar a ficha">${svg('fechar')}</button>
        <h2 id="ficha-titulo" class="ficha-titulo" tabindex="-1">${esc(t.nome)}</h2>
        <p class="ficha-chips">
          <span>${svg('raia')}${esc(trilha)}</span>
          <span>${svg('pagina')}<span>${t.prototipo.map((p) => `<a class="link" href="${esc(p)}" target="_blank" rel="noopener">${esc(p)}</a>`).join(', ')}</span></span>
          <span>${svg('rota')}${esc(webTxt)}</span>
        </p>
      </div>
      <div class="ficha-corpo">
        <div class="ficha-medidores">${LADOS.map(([lado, nome]) => `
          <div class="ficha-medidor">
            <span class="ficha-medidor-rotulo">${nome}</span>
            <span class="ficha-medidor-valor">${t.c[lado].feitas} de ${t.c[lado].total}<small>${t.c[lado].parciais ? `${t.c[lado].parciais} ${t.c[lado].parciais > 1 ? 'parciais' : 'parcial'}` : 'feitas'}</small></span>
            ${medidor(t.c[lado])}
          </div>`).join('')}
        </div>
        ${secao('Features da V1', tabelaFeatures(t))}
        ${secao('Depende de', ints.length ? `<ul class="lista-simples">${ints.map((i) => `<li><button type="button" class="link" data-ir-int="${i.id}">${esc(i.nome)}</button>${i.situacao === 'ok' ? fase('ok', 'Integrada') : fase('falta', 'Falta')}</li>`).join('')}</ul>` : '')}
        ${secao('Ligada a', rel.length ? `<ul class="lista-simples">${rel.map(linhaTela).join('')}</ul>` : '')}
        ${secao('No web', arquivos ? `<ul class="lista-codigo">${arquivos}</ul>` : '')}
        ${secao('Na API', t.endpoints?.length ? `<ul class="lista-codigo">${t.endpoints.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : '')}
        ${secao('Fora da V1', t.fora?.length ? `<p class="lista-fora">${t.fora.map((f) => `<span>${esc(f)}</span>`).join('')}</p>` : '')}
      </div>`;
  }

  function fichaIntegracao(i) {
    const ts = usam(i.id);
    return `
      <div class="ficha-cabeca">
        <button type="button" class="ficha-fechar" data-fechar aria-label="Fechar a ficha">${svg('fechar')}</button>
        <h2 id="ficha-titulo" class="ficha-titulo" tabindex="-1">${esc(i.nome)}</h2>
        <p class="ficha-chips"><span>${i.situacao === 'ok' ? fase('ok', 'Integrada') : fase('falta', 'Falta')}</span>${i.prazo ? '<span class="pilula pilula-aviso">Prazo externo</span>' : ''}</p>
      </div>
      <div class="ficha-corpo">
        ${secao('Para quê', `<p>${esc(i.uso)}. ${esc(i.nota)}</p>`)}
        ${secao(`Usada em ${ts.length} ${ts.length === 1 ? 'tela' : 'telas'}`, `<ul class="lista-simples">${ts.map(linhaTela).join('')}</ul>`)}
      </div>`;
  }

  function limparSelecao() {
    mundo.querySelectorAll('.no.ativo, .no.ligado').forEach((el) => {
      el.classList.remove('ativo', 'ligado');
      el.setAttribute('aria-expanded', 'false');
    });
    ligacoes.innerHTML = '';
  }

  function abrir(el, { focar = true } = {}) {
    limparSelecao();
    aberto = el;
    el.classList.add('ativo');
    el.setAttribute('aria-expanded', 'true');
    const t = el.dataset.id ? porId[el.dataset.id] : null;
    const i = t ? null : integracoes[el.dataset.int];
    const alvos = t
      ? [...ligadas(t).map((id) => mundo.querySelector(`[data-id="${id}"]`)), ...(t.integracoes ?? []).map((id) => mundo.querySelector(`[data-int="${id}"]`))]
      : usam(i.id).map((u) => mundo.querySelector(`[data-id="${u.id}"]`));
    alvos.forEach((a) => a.classList.add('ligado'));
    desenharLigacoes(el, alvos);
    ficha.innerHTML = t ? fichaTela(t) : fichaIntegracao(i);
    ficha.hidden = false;
    ficha.scrollTop = 0;
    area.classList.add('com-ficha');
    history.replaceState(null, '', `#${t ? t.id : `int-${i.id}`}`);
    if (focar) ficha.querySelector('#ficha-titulo').focus({ preventScroll: true });
    mostrar(el);
  }

  function fechar(devolverFoco) {
    const el = aberto;
    aberto = null;
    limparSelecao();
    ficha.hidden = true;
    area.classList.remove('com-ficha');
    history.replaceState(null, '', location.pathname + location.search);
    if (devolverFoco && el) el.focus({ preventScroll: true });
  }

  // O clique que termina um arrasto não abre nada; Enter e Espaço (detail 0) abrem mesmo depois de uma pinça,
  // que não termina em clique.
  mapa.addEventListener('click', (e) => {
    if (moveu) {
      moveu = false;
      if (e.detail) return;
    }
    const no = e.target.closest('.no');
    if (no) {
      if (no === aberto) fechar(true);
      else abrir(no);
      return;
    }
    const cabeca = e.target.closest('[data-aproximar]');
    if (cabeca) enquadrar(caixa(cabeca.closest('.raia')), { max: 1, min: 0.3 });
  });

  ficha.addEventListener('click', (e) => {
    if (e.target.closest('[data-fechar]')) return fechar(true);
    const ir = e.target.closest('[data-ir], [data-ir-int]');
    if (!ir) return;
    const el = ir.dataset.ir ? mundo.querySelector(`[data-id="${ir.dataset.ir}"]`) : mundo.querySelector(`[data-int="${ir.dataset.irInt}"]`);
    abrir(el);
  });

  // ---------- Início ----------
  indicadores();
  aplicar();
  // O endereço com #id (ou #int-id) abre a ficha: o link de uma tela pode ser compartilhado.
  // Os ids são ASCII, então o hash não precisa de decode (que lança erro num hash malformado).
  function abrirDoEndereco() {
    const hash = location.hash.slice(1);
    const el = hash && (hash.startsWith('int-') ? mundo.querySelector(`[data-int="${CSS.escape(hash.slice(4))}"]`) : mundo.querySelector(`[data-id="${CSS.escape(hash)}"]`));
    if (el) {
      if (el !== aberto) abrir(el, { focar: false });
    } else if (aberto) fechar(false);
  }
  const enquadrarTudo = () => enquadrar(tudo(), { ms: 0, min: movel() ? 0.36 : 0.2 });
  function iniciar() {
    desenharFixas();
    enquadrarTudo();
    abrirDoEndereco();
  }
  window.addEventListener('hashchange', abrirDoEndereco);
  // Ao passar de computador para celular (ou girar a tela), o enquadramento e a ficha mudam de forma.
  telaMovel.addEventListener('change', () => {
    enquadrarTudo();
    if (aberto) mostrar(aberto);
  });
  // As medidas dependem da fonte; redesenha só as arestas se ela chegar depois, sem refazer a ficha nem mexer no foco.
  iniciar();
  document.fonts?.ready.then(() => {
    desenharFixas();
    if (aberto) desenharLigacoes(aberto, [...mundo.querySelectorAll('.no.ligado')]);
  });
})();
