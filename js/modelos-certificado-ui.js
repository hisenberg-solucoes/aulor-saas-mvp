// ============================================================
// Peças comuns à lista (templates-certificado.html) e ao editor
// (modelo-certificado.html) dos modelos de certificado: selo de padrão,
// uso pelos cursos, miniatura real e os diálogos de criar, dados, padrão e
// exclusão. Regras em Aulor.*Modelo; desenho da folha em Certificado.
// ============================================================

const ICONE_MODELO = {
  estrela: '<svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clip-rule="evenodd"/></svg>',
  lixeira: '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>',
};

const urlModelo = (id, aba = '') => `modelo-certificado.html?id=${encodeURIComponent(id)}${aba ? `&aba=${aba}` : ''}`;

const seloPadrao = () => `<span class="inline-flex items-center gap-1 rounded-full bg-laranja/10 dark:bg-laranja/15 px-2 py-0.5 text-xs font-semibold text-laranja-escuro dark:text-laranja whitespace-nowrap">${ICONE_MODELO.estrela}Padrão da escola</span>`;

const statusModelo = (m) => status(Aulor.STATUS_MODELO[m.status].tom, Aulor.STATUS_MODELO[m.status].nome, Aulor.STATUS_MODELO[m.status].descricao);

function aparenciaResumo(m) {
  const nome = (campo) => Aulor.OPCOES_MODELO[campo].find((o) => o.id === m.aparencia[campo])?.nome ?? '—';
  const ponto = (cor) => `<span class="h-3 w-3 rounded-full ring-1 ring-black/10 dark:ring-white/15" style="background:${esc(cor)}"></span>`;
  return `<span class="inline-flex items-center gap-1.5"><span class="inline-flex -space-x-1">${ponto(m.aparencia.corPrimaria)}${ponto(m.aparencia.corDestaque)}</span><span>${nome('orientacao')} · ${nome('fonte')} · ${nome('moldura').toLowerCase()}</span></span>`;
}

// Cursos sem modelo próprio (ou com um modelo fora de uso) emitem com o padrão.
const cursosNoPadrao = () => Aulor.cursos().filter((c) => Aulor.modeloDoCurso(c).padrao && !(Aulor.modeloCertificado(c.modeloCertificadoId)?.padrao));
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

function usoDoModelo(m) {
  const escolheram = Aulor.cursosDoModelo(m.id).length;
  if (m.padrao) {
    const semEscolha = cursosNoPadrao().length;
    return escolheram ? `${plural(escolheram, 'curso', 'cursos')} + ${semEscolha} sem modelo próprio` : `${plural(semEscolha, 'curso', 'cursos')} sem modelo próprio`;
  }
  if (!escolheram) return '<span class="text-slate-500 dark:text-neutral-400">nenhum curso</span>';
  return m.status === 'ativo' ? plural(escolheram, 'curso', 'cursos') : `${plural(escolheram, 'curso', 'cursos')}, emitindo com o padrão`;
}

// Frente do modelo em miniatura, com dados de exemplo. Retrato ocupa metade da largura da caixa paisagem.
function miniaturaModelo(m, classe = '') {
  return `<span class="block aspect-[297/210] rounded-lg bg-slate-100 dark:bg-neutral-900 p-2 ${classe}" aria-hidden="true">
    <span class="grid h-full place-items-center [&_.cert-folha]:rounded-[3px] [&_.cert-folha]:shadow-[0_1px_2px_rgba(15,23,42,.18)]">
      <span class="block" style="width:${m.aparencia.orientacao === 'retrato' ? '50%' : '100%'}">${Certificado.folhas(Certificado.dadosExemplo(), { modelo: m, lados: ['frente'] })}</span>
    </span>
  </span>`;
}

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
      <div><label class="rotulo" for="f-descricao">Descrição</label><input id="f-descricao" name="descricao" maxlength="120" class="campo" placeholder="Para que cursos ele serve">${ERRO('descricao')}</div>
      <div>
        <label class="rotulo" for="f-copiarDe">Começar a partir de</label>
        ${campoCombo('copiarDe', Aulor.modelosCertificado().map((m) => ({ id: m.id, nome: m.nome, descricao: m.padrao ? 'Padrão da escola' : Aulor.STATUS_MODELO[m.status].nome })), padrao.id, { opcional: true, vazio: 'Modelo em branco' })}
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-1">A cópia leva aparência, textos e assinaturas. Dá para mudar tudo depois.</p>
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
    <label class="relative cursor-pointer rounded-lg border px-3 py-2.5 transition border-slate-300 dark:border-neutral-700 hover:border-slate-400 dark:hover:border-neutral-500 has-[:checked]:border-petrol-800 dark:has-[:checked]:border-sky-400 has-[:checked]:bg-petrol-800/5 dark:has-[:checked]:bg-sky-950/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-petrol-800/30 has-[:disabled]:opacity-50 has-[:disabled]:cursor-not-allowed">
      <input type="radio" name="status" value="${id}" class="sr-only" ${m.status === id ? 'checked' : ''} ${m.padrao && id !== 'ativo' ? 'disabled' : ''}>
      <span class="block text-sm font-semibold text-slate-800 dark:text-neutral-100">${esc(s.nome)}</span>
      <span class="block text-xs text-slate-500 dark:text-neutral-400 mt-0.5">${esc(s.descricao)}</span>
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
      <div><label class="rotulo" for="f-descricao">Descrição</label><input id="f-descricao" name="descricao" maxlength="120" value="${esc(m.descricao)}" class="campo">${ERRO('descricao')}</div>
      <fieldset>
        <legend class="rotulo">Situação</legend>
        <div class="grid gap-2">${opcoes}</div>
        ${m.padrao ? '<p class="text-xs text-slate-500 dark:text-neutral-400 mt-1.5">É o padrão da escola: fica sempre ativo. Defina outro como padrão para mudar a situação deste.</p>' : ''}
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
    detalhe: `<p class="text-sm text-slate-500 dark:text-neutral-400 mt-2">${plural(cursosNoPadrao().length, 'curso será afetado', 'cursos serão afetados')}.</p>`,
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
