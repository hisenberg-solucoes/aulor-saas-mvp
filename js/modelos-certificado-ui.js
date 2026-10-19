// ============================================================
// Peças comuns à lista (templates-certificado.html) e ao editor
// (modelo-certificado.html) dos modelos de certificado, na direção Ficha em
// cartões: pílulas de exceção, uso pelos cursos, miniatura real da frente e os
// diálogos de criar, dados, padrão e exclusão. Regras em Aulor.*Modelo;
// desenho da folha em Certificado.
// ============================================================

const urlModelo = (id, aba = '') => `modelo-certificado.html?id=${encodeURIComponent(id)}${aba ? `&aba=${aba}` : ''}`;

// Pílula só de exceção: ativo é o comum. O padrão é um só, então também se anuncia (informativa, sem cobre).
const pilulaPadrao = () => pilula('info', 'Padrão da escola', 'Vale para todo curso que não escolheu outro modelo');
const pilulasModelo = (m, { status = true } = {}) => [
  m.padrao ? pilulaPadrao() : '',
  status && m.status !== 'ativo' ? pilula(Aulor.STATUS_MODELO[m.status].tom, Aulor.STATUS_MODELO[m.status].nome, Aulor.STATUS_MODELO[m.status].descricao) : '',
].join('');

function aparenciaTexto(m) {
  const nome = (campo) => Aulor.OPCOES_MODELO[campo].find((o) => o.id === m.aparencia[campo])?.nome ?? '—';
  return `${nome('orientacao')} · fonte ${nome('fonte').toLowerCase()} · moldura ${nome('moldura').toLowerCase()}`;
}

// Cursos sem modelo próprio (ou com um modelo fora de uso) emitem com o padrão.
const cursosNoPadrao = () => Aulor.cursos().filter((c) => Aulor.modeloDoCurso(c).padrao && !(Aulor.modeloCertificado(c.modeloCertificadoId)?.padrao));

// Coluna "Usado por" da lista: o padrão vale para quem não escolheu outro (o número que importa).
function usoDoModelo(m) {
  const escolheram = Aulor.cursosDoModelo(m.id).length;
  if (m.padrao) {
    return `<span class="tabular-nums">${plural(cursosNoPadrao().length, 'curso', 'cursos')} pelo padrão</span>${escolheram ? `<span class="block text-xs tabular-nums ${APOIO}">e ${plural(escolheram, 'curso', 'cursos')} por escolha</span>` : ''}`;
  }
  if (!escolheram) return `<span class="${APOIO}">—</span>`;
  const n = `<span class="tabular-nums">${plural(escolheram, 'curso', 'cursos')}</span>`;
  return m.status === 'ativo' ? n : `${n}<span class="block text-xs ${AVISO}">emitem com o padrão enquanto ${m.status === 'rascunho' ? 'for rascunho' : 'estiver inativo'}</span>`;
}

// Chip do cabeçalho do editor: a mesma leitura em uma frase.
function usoResumo(m) {
  const escolheram = Aulor.cursosDoModelo(m.id).length;
  if (m.padrao) return `Emite para ${plural(cursosNoPadrao().length, 'curso', 'cursos')} pelo padrão${escolheram ? ` e ${plural(escolheram, 'curso', 'cursos')} por escolha` : ''}`;
  return escolheram ? `Escolhido por ${plural(escolheram, 'curso', 'cursos')}` : 'Nenhum curso escolheu ainda';
}

// Por que o modelo não pode ser excluído ('' = pode). Dito no item do menu, não só no title.
const motivoNaoExcluir = (m) => (m.padrao ? 'É o padrão da escola: defina outro padrão antes' : '');

const OPCIONAL = `<span class="font-normal ${APOIO}">(opcional)</span>`;

function abrirNovoModelo() {
  const padrao = Aulor.modeloPadrao();
  modalFormulario({
    id: 'form-novo-modelo',
    titulo: 'Novo modelo de certificado',
    subtitulo: 'Nasce como rascunho: os cursos só podem escolhê-lo depois de ativado.',
    rotulo: 'Criar e abrir o editor',
    largura: 'md',
    foco: '#f-nome',
    corpo: `
      ${campo('nome', 'Nome', '', { obrigatorio: true, extra: 'maxlength="60" placeholder="Ex.: Idiomas, Workshop, Parceria SENAC"' })}
      <div><label class="rotulo" for="f-descricao">Descrição ${OPCIONAL}</label><input id="f-descricao" name="descricao" maxlength="120" class="campo" placeholder="Para que cursos ele serve">${ERRO('descricao')}</div>
      <div>
        <label class="rotulo" for="f-copiarDe">Começar a partir de</label>
        ${campoCombo('copiarDe', Aulor.modelosCertificado().map((m) => ({ id: m.id, nome: m.nome, descricao: m.padrao ? 'Padrão da escola' : Aulor.STATUS_MODELO[m.status].nome })), padrao.id, { opcional: true, vazio: 'Modelo em branco' })}
        <p class="text-xs ${APOIO} mt-1">A cópia leva aparência, textos e assinaturas. Dá para mudar tudo depois.</p>
        ${ERRO('copiarDe')}
      </div>`,
    aoSalvar: (fd) => {
      const r = Aulor.criarModelo(Object.fromEntries(fd.entries()));
      if (r.erros) return r.erros;
      location.href = urlModelo(r.modelo.id, 'aparencia');
      return [];
    },
  });
}

function abrirDadosModelo(m, aoSalvar) {
  const opcoes = Object.entries(Aulor.STATUS_MODELO).map(([id, s]) => `
    <label class="relative cursor-pointer rounded-lg border px-3 py-2.5 transition border-slate-300 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-petrol-800/30 dark:has-[:focus-visible]:ring-sky-400/40 has-[:disabled]:opacity-50 has-[:disabled]:cursor-not-allowed">
      <input type="radio" name="status" value="${id}" class="sr-only" ${m.status === id ? 'checked' : ''} ${m.padrao && id !== 'ativo' ? 'disabled' : ''}>
      <span class="block text-sm font-medium ${TITULO}">${esc(s.nome)}</span>
      <span class="block text-xs ${APOIO} mt-0.5">${esc(s.descricao)}</span>
    </label>`).join('');
  modalFormulario({
    id: 'form-dados-modelo',
    titulo: 'Dados do modelo',
    subtitulo: m.nome,
    rotulo: 'Salvar',
    largura: 'md',
    foco: '#f-nome',
    corpo: `
      ${campo('nome', 'Nome', m.nome, { obrigatorio: true, extra: 'maxlength="60"' })}
      <div><label class="rotulo" for="f-descricao">Descrição ${OPCIONAL}</label><input id="f-descricao" name="descricao" maxlength="120" value="${esc(m.descricao)}" class="campo">${ERRO('descricao')}</div>
      <fieldset>
        <legend class="rotulo">Situação</legend>
        <div class="grid gap-2">${opcoes}</div>
        ${m.padrao ? `<p class="text-xs ${APOIO} mt-1.5">É o padrão da escola: fica sempre ativo. Defina outro como padrão para mudar a situação deste.</p>` : ''}
        ${ERRO('status')}
      </fieldset>`,
    aoSalvar: (fd) => {
      const r = Aulor.atualizarDadosModelo(m.id, { nome: fd.get('nome'), descricao: fd.get('descricao'), status: fd.get('status') ?? m.status });
      if (r.erros) return r.erros;
      aoSalvar(r.modelo);
      return [];
    },
  });
}

function confirmarPadrao(m, aoConfirmar) {
  const anterior = Aulor.modeloPadrao();
  confirmar({
    titulo: 'Definir como padrão',
    mensagem: `Todo curso sem modelo próprio passa a emitir com "${m.nome}" no lugar de "${anterior.nome}". Certificados já emitidos não mudam.`,
    detalhe: `<p class="text-sm ${APOIO} mt-2">${plural(cursosNoPadrao().length, 'curso será afetado', 'cursos serão afetados')}.</p>`,
    rotulo: 'Definir como padrão',
    aoConfirmar: () => {
      const r = Aulor.definirModeloPadrao(m.id);
      if (r.erros) { toast(r.erros[0].mensagem, 'erro'); return; }
      toast(`"${m.nome}" agora é o padrão da escola`);
      aoConfirmar();
    },
  });
}

function confirmarExclusaoModelo(m, aoConfirmar) {
  const cursos = Aulor.cursosDoModelo(m.id);
  const emitidos = Aulor.emitidosComModelo(m.id).length;
  const itens = [
    cursos.length ? `${plural(cursos.length, 'curso volta', 'cursos voltam')} para o padrão (${esc(Aulor.modeloPadrao().nome)}): ${cursos.map((c) => esc(c.nome)).join(', ')}.` : '',
    emitidos ? `${plural(emitidos, 'certificado emitido continua', 'certificados emitidos continuam')} igual, com a cópia guardada na emissão.` : '',
  ].filter(Boolean);
  confirmar({
    titulo: 'Excluir modelo',
    mensagem: `"${m.nome}" será excluído. Não dá para desfazer.`,
    detalhe: itens.length ? `<ul class="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-neutral-300 list-disc pl-5">${itens.map((x) => `<li>${x}</li>`).join('')}</ul>` : '',
    rotulo: 'Excluir modelo',
    tom: 'perigo',
    aoConfirmar: () => {
      const r = Aulor.excluirModelo(m.id);
      if (r.erros) { toast(r.erros[0].mensagem, 'erro'); return; }
      toast(`Modelo "${m.nome}" excluído`);
      aoConfirmar();
    },
  });
}
