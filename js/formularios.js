// ============================================================
// Formulários e blocos de domínio usados em mais de uma tela:
// cadastro rápido de aluno, recebimento/estorno de parcela, tabela de
// parcelas e barra de frequência. Depende de base.js, ui-form.js e Aulor.
// ============================================================

// ---------- Aluno (cadastro rápido) ----------

function campo(nome, rotulo, valor = '', { tipo = 'text', obrigatorio = false, extra = '', dica = '', classe = '' } = {}) {
  return `
    <div class="${classe}">
      <label for="f-${nome}" class="rotulo">${rotulo}${obrigatorio ? ' <span class="text-red-600">*</span>' : ''}</label>
      <input id="f-${nome}" name="${nome}" type="${tipo}" value="${esc(valor ?? '')}" class="campo" ${extra}>
      ${dica ? `<p class="text-xs text-slate-400 mt-1">${dica}</p>` : ''}
      ${ERRO(nome)}
    </div>`;
}

// Sem `aluno`: cadastro rápido (o responsável informado vira legal e financeiro).
// Com `aluno`: edição da aba Dados; responsáveis e endereço têm formulários próprios.
function abrirFormAluno({ aluno = null, aoSalvar }) {
  const origens = Aulor.ORIGENS.map((o) => ({ id: o, nome: o }));
  const { form } = modalFormulario({
    id: 'form-aluno',
    titulo: aluno ? 'Editar dados do aluno' : 'Cadastrar aluno',
    subtitulo: aluno ? aluno.nome : 'Só o essencial para matricular. Endereço e outros responsáveis podem ser completados depois, na ficha.',
    rotulo: aluno ? 'Salvar' : 'Cadastrar',
    largura: 'xl',
    foco: '#f-nome',
    corpo: `
      <div class="grid sm:grid-cols-2 gap-4">
        ${campo('nome', 'Nome completo', aluno?.nome, { obrigatorio: true, classe: 'sm:col-span-2', extra: 'autocomplete="off"' })}
        ${campo('cpf', 'CPF', aluno ? Documento.fmtCpf(aluno.cpf) : '', { obrigatorio: true, extra: 'data-mascara="cpf" placeholder="000.000.000-00"' })}
        ${campo('rg', 'RG', aluno?.rg)}
        ${campo('nascimento', 'Data de nascimento', aluno?.nascimento, { tipo: 'date', dica: 'Menor de 18 anos exige responsável legal.' })}
        <div>
          <label class="rotulo" for="f-origem">Como conheceu a escola</label>
          ${campoCombo('origem', origens, aluno?.origem ?? '', { vazio: 'Não informado', opcional: true })}
          ${ERRO('origem')}
        </div>
        ${campo('telefone', 'Celular (WhatsApp)', aluno?.telefone ? telefoneFmt(aluno.telefone) : '', { obrigatorio: true, tipo: 'tel', extra: 'placeholder="(43) 99999-0000"' })}
        ${campo('email', 'E-mail', aluno?.email, { tipo: 'email' })}
      </div>
      ${aluno ? '' : `
      <details data-responsavel class="rounded-lg border border-slate-200 dark:border-neutral-800">
        <summary class="cursor-pointer select-none px-4 py-3 text-sm font-medium text-slate-700 dark:text-neutral-200">Responsável <span class="font-normal text-slate-400">— obrigatório para menores de idade; entra como legal e quem paga</span></summary>
        <div class="grid sm:grid-cols-2 gap-4 px-4 pb-4">
          ${campo('respNome', 'Nome do responsável', '', { classe: 'sm:col-span-2' })}
          ${campo('respCpf', 'CPF do responsável', '', { extra: 'data-mascara="cpf"' })}
          ${campo('respTelefone', 'Celular do responsável', '', { tipo: 'tel' })}
          ${campo('respParentesco', 'Parentesco', '', { extra: 'placeholder="Mãe, pai, avó…"' })}
        </div>
      </details>`}
      <div>
        <label for="f-observacoes" class="rotulo">Observações</label>
        <textarea id="f-observacoes" name="observacoes" rows="2" class="campo" placeholder="Ex.: prefere contato à tarde">${esc(aluno?.observacoes ?? '')}</textarea>
      </div>`,
    aoSalvar: (fd) => {
      const d = Object.fromEntries(fd.entries());
      const r = aluno ? Aulor.atualizarAluno(aluno.id, d) : Aulor.criarAluno(d, Shell.nome());
      if (r.erros) {
        if (r.erros.some((e) => e.campo.startsWith('resp'))) document.querySelector('[data-responsavel]').open = true;
        return r.erros;
      }
      aoSalvar(r.aluno);
      return [];
    },
  });
  // Ao informar nascimento de menor, abre o bloco do responsável.
  form.querySelector('#f-nascimento').addEventListener('change', (e) => {
    const idade = Aulor.idade(e.target.value);
    if (idade != null && idade < 18) form.querySelector('[data-responsavel]')?.setAttribute('open', '');
  });
}

function abrirFormResponsavel({ aluno, responsavel = null, aoSalvar }) {
  const r = responsavel ?? { papeis: Aulor.ehMenor(aluno) && !(aluno.responsaveis ?? []).length ? ['legal', 'financeiro'] : [] };
  modalFormulario({
    id: 'form-responsavel',
    titulo: responsavel ? 'Editar responsável' : 'Novo responsável',
    subtitulo: `Responsável por ${aluno.nome}`,
    rotulo: responsavel ? 'Salvar' : 'Incluir',
    largura: 'lg',
    foco: '#f-nome',
    corpo: `
      <div class="grid sm:grid-cols-2 gap-4">
        ${campo('nome', 'Nome completo', r.nome, { obrigatorio: true, classe: 'sm:col-span-2', extra: 'autocomplete="off"' })}
        ${campo('parentesco', 'Parentesco', r.parentesco, { extra: 'placeholder="Mãe, pai, avó, cônjuge…"' })}
        ${campo('cpf', 'CPF', r.cpf ? Documento.fmtCpf(r.cpf) : '', { extra: 'data-mascara="cpf"', dica: 'Obrigatório na prática para quem paga (sai no boleto).' })}
        ${campo('telefone', 'Celular (WhatsApp)', r.telefone ? telefoneFmt(r.telefone) : '', { obrigatorio: true, tipo: 'tel' })}
        ${campo('email', 'E-mail', r.email, { tipo: 'email' })}
      </div>
      <fieldset>
        <legend class="rotulo">Papéis <span class="text-red-600">*</span></legend>
        <div class="space-y-2 pt-1">
          ${Aulor.PAPEIS_RESPONSAVEL.map((p) => `
          <label class="flex items-start gap-3 text-sm cursor-pointer">
            <input type="checkbox" name="papel_${p.id}" value="1" class="check mt-0.5" ${r.papeis.includes(p.id) ? 'checked' : ''}>
            <span><b class="font-medium">${p.nome}</b> <span class="text-slate-500 dark:text-neutral-400">— ${p.descricao}${p.id === 'financeiro' ? ' Marcar aqui tira o papel de quem tinha.' : ''}</span></span>
          </label>`).join('')}
        </div>
        ${ERRO('papeis')}
      </fieldset>`,
    aoSalvar: (fd) => {
      const res = Aulor.salvarResponsavel(aluno.id, Object.fromEntries(fd.entries()), responsavel?.id ?? null);
      if (res.erros) return res.erros;
      aoSalvar();
      return [];
    },
  });
}

function abrirFormEnderecoPagamento({ aluno, aoSalvar }) {
  const e = aluno.endereco ?? {};
  const c = aluno.cobranca ?? {};
  const fin = Aulor.responsavelFinanceiro(aluno);
  modalFormulario({
    id: 'form-endereco',
    titulo: 'Endereço e pagamento',
    subtitulo: aluno.nome,
    rotulo: 'Salvar',
    largura: 'xl',
    foco: '#f-cep',
    corpo: `
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        ${campo('cep', 'CEP', e.cep ? e.cep.replace(/(\d{5})(\d{3})/, '$1-$2') : '', { extra: 'inputmode="numeric" placeholder="00000-000"' })}
        ${campo('logradouro', 'Logradouro', e.logradouro, { classe: 'col-span-2 sm:col-span-3' })}
        ${campo('numero', 'Número', e.numero)}
        ${campo('complemento', 'Complemento', e.complemento)}
        ${campo('bairro', 'Bairro', e.bairro, { classe: 'col-span-2' })}
        ${campo('cidade', 'Cidade', e.cidade, { classe: 'col-span-2 sm:col-span-3' })}
        ${campo('uf', 'UF', e.uf, { extra: 'maxlength="2" style="text-transform:uppercase"' })}
      </div>
      <div class="pt-4 border-t border-slate-200 dark:border-neutral-800 grid sm:grid-cols-2 gap-4">
        <fieldset class="sm:col-span-2">
          <legend class="rotulo">Quem paga <span class="text-red-600">*</span></legend>
          <div class="flex flex-wrap gap-x-5 gap-y-2 text-sm pt-1">
            <label class="flex items-center gap-2"><input type="radio" name="pagador" value="aluno" ${c.pagador !== 'responsavel' ? 'checked' : ''}>O próprio aluno</label>
            <label class="flex items-center gap-2 ${fin ? '' : 'opacity-50'}"><input type="radio" name="pagador" value="responsavel" ${c.pagador === 'responsavel' ? 'checked' : ''} ${fin ? '' : 'disabled'}>${fin ? `${esc(fin.nome)} (responsável financeiro)` : 'Responsável financeiro (cadastre na aba Responsáveis)'}</label>
          </div>
          ${ERRO('pagador')}
        </fieldset>
        <div>
          <label class="rotulo" for="f-formaPreferida">Forma de pagamento preferida</label>
          ${campoCombo('formaPreferida', Aulor.FORMAS_PAGAMENTO, c.formaPreferida ?? '', { vazio: 'Sem preferência', opcional: true })}
          ${ERRO('formaPreferida')}
        </div>
        ${campo('diaVencimento', 'Dia de vencimento preferido', c.diaVencimento ?? '', { tipo: 'number', extra: `min="1" max="28" placeholder="Padrão da escola: ${Aulor.config().financeiro.diaVencimentoPadrao}"`, dica: 'Usado como sugestão na próxima matrícula.' })}
      </div>`,
    aoSalvar: (fd) => {
      const res = Aulor.atualizarEnderecoPagamento(aluno.id, Object.fromEntries(fd.entries()));
      if (res.erros) return res.erros;
      aoSalvar();
      return [];
    },
  });
}

// ---------- Parcelas ----------

const NOME_SITUACAO_RECEBER = { a_vencer: 'A vencer', vencido: 'Vencida', pago: 'Recebida', cancelado: 'Cancelada' };
const NOME_SITUACAO_PAGAR = { a_vencer: 'A vencer', vencido: 'Vencida', pago: 'Paga', cancelado: 'Cancelada' };

function situacaoLancHtml(l) {
  const s = Aulor.situacaoLancamento(l);
  const nomes = l.tipo === 'receber' ? NOME_SITUACAO_RECEBER : NOME_SITUACAO_PAGAR;
  const atraso = s === 'vencido' ? ` · ${Aulor.diasAtraso(l)} d` : '';
  return status(Aulor.SITUACAO_LANCAMENTO[s].tom, nomes[s] + atraso);
}

const nomeForma = (id) => Aulor.FORMAS_PAGAMENTO.find((f) => f.id === id)?.nome ?? '—';

function acaoParcela(l) {
  if (l.pagamentoInstrutorId && l.status !== 'cancelado') { // a baixa e o estorno são da ficha do instrutor, para não haver duas fontes
    const i = Aulor.professores().find((x) => x.pagamentos.some((p) => p.id === l.pagamentoInstrutorId));
    if (i && Shell.pode('instrutores')) return `<a class="link text-xs" href="instrutor.html?id=${encodeURIComponent(i.id)}&aba=pagamentos">Na ficha do instrutor</a>`;
    return '<span class="text-xs text-slate-500 dark:text-neutral-400">Pela ficha do instrutor</span>';
  }
  const s = Aulor.situacaoLancamento(l);
  const feature = l.tipo === 'receber' ? 'receber' : 'pagar';
  const podeBaixar = Shell.pode(feature, l.tipo === 'receber' ? 'registrar' : 'pagar');
  if (s === 'a_vencer' || s === 'vencido') {
    return podeBaixar ? `<button type="button" data-baixar="${l.id}" class="btn-sec btn-pequeno" title="${l.tipo === 'receber' ? 'Registrar recebimento' : 'Registrar pagamento'}">${l.tipo === 'receber' ? 'Receber' : 'Pagar'}</button>` : '';
  }
  if (s === 'pago' && Shell.pode(feature, l.tipo === 'receber' ? 'estornar' : 'pagar')) {
    return `<button type="button" data-estornar="${l.id}" class="text-xs font-medium text-slate-500 hover:text-red-700 dark:text-neutral-400 dark:hover:text-red-400">Estornar</button>`;
  }
  return '';
}

function tabelaParcelas(lista, { mostrarAluno = false, mostrarCurso = false } = {}) {
  if (!lista.length) return '<p class="px-5 py-6 text-sm text-slate-500 dark:text-neutral-400">Nenhuma parcela.</p>';
  return `
    <div class="overflow-x-auto">
      <table class="tabela">
        <thead><tr>
          <th>Vencimento</th>
          ${mostrarAluno ? '<th>Aluno</th>' : ''}
          <th>${mostrarCurso ? 'Descrição' : 'Parcela'}</th>
          <th class="num">Valor</th>
          <th>Situação</th>
          <th></th>
        </tr></thead>
        <tbody>${lista.map((l) => `
          <tr>
            <td class="tabular-nums whitespace-nowrap">${dataBr(l.vencimento)}</td>
            ${mostrarAluno ? `<td>${l.alunoId ? `<a class="link" href="aluno.html?id=${l.alunoId}">${esc(Aulor.aluno(l.alunoId).nome)}</a>` : '—'}</td>` : ''}
            <td>${mostrarCurso ? esc(l.descricao) : (l.parcela ? `${l.parcela.n} de ${l.parcela.de}` : esc(l.descricao))}</td>
            <td class="num">${moeda(l.valor)}</td>
            <td>${situacaoLancHtml(l)}${l.status === 'pago' ? `<p class="text-xs text-slate-500 dark:text-neutral-400">${dataBr(l.pagoEm)} · ${esc(nomeForma(l.forma))}${l.valorPago !== l.valor ? ` · ${moeda(l.valorPago)}` : ''}</p>` : ''}</td>
            <td class="text-right whitespace-nowrap">${acaoParcela(l)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// Liga os botões de baixa/estorno dentro de `raiz`; `aoMudar` re-renderiza a tela.
function ligarAcoesParcelas(raiz, aoMudar) {
  raiz.querySelectorAll('[data-baixar]').forEach((b) => b.addEventListener('click', () => abrirBaixa(b.dataset.baixar, aoMudar)));
  raiz.querySelectorAll('[data-estornar]').forEach((b) => b.addEventListener('click', () => {
    const l = Aulor.lancamento(b.dataset.estornar);
    confirmar({
      titulo: 'Estornar pagamento?',
      mensagem: `${l.descricao} volta a ficar em aberto (${moeda(l.valor)}, vencimento ${dataBr(l.vencimento)}).`,
      rotulo: 'Estornar',
      tom: 'perigo',
      aoConfirmar: () => {
        const r = Aulor.estornar(l.id);
        if (r.erros) toast(r.erros[0].mensagem, 'erro'); else { toast('Pagamento estornado'); aoMudar(); }
      },
    });
  }));
}

// Registro manual de recebimento/pagamento. Sugere multa e juros pela configuração da escola.
function abrirBaixa(id, aoMudar) {
  const l = Aulor.lancamento(id);
  const receber = l.tipo === 'receber';
  const hoje = Aulor.hoje();
  const enc = Aulor.encargos(l, hoje);
  const temEncargos = receber && enc.total > l.valor;
  const formas = Aulor.FORMAS_PAGAMENTO.map((f) => ({ id: f.id, nome: f.nome }));
  const { form } = modalFormulario({
    id: 'form-baixa',
    titulo: receber ? 'Registrar recebimento' : 'Registrar pagamento',
    subtitulo: `${l.alunoId ? `${Aulor.aluno(l.alunoId).nome} · ` : ''}${l.descricao}`,
    rotulo: receber ? 'Confirmar recebimento' : 'Confirmar pagamento',
    largura: 'md',
    corpo: `
      <dl class="grid grid-cols-2 gap-3 text-sm">
        <div><dt class="text-xs text-slate-500 dark:text-neutral-400">Vencimento</dt><dd class="font-medium">${dataBr(l.vencimento)}</dd></div>
        <div><dt class="text-xs text-slate-500 dark:text-neutral-400">Valor original</dt><dd class="font-medium tabular-nums">${moeda(l.valor)}</dd></div>
      </dl>
      ${temEncargos ? `
        <label class="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-3 py-2.5 text-sm cursor-pointer">
          <input type="checkbox" class="check mt-0.5" data-encargos checked>
          <span>Cobrar multa (${moeda(enc.multa)}) e juros de ${enc.dias} dias (${moeda(enc.juros)}) <span class="block text-xs text-slate-500 dark:text-neutral-400">Pela regra da escola em Configurações › Financeiro.</span></span>
        </label>` : ''}
      <div class="grid grid-cols-2 gap-4">
        ${campo('data', receber ? 'Recebido em' : 'Pago em', hoje, { tipo: 'date', obrigatorio: true, extra: `max="${hoje}"` })}
        ${campo('valor', 'Valor', (temEncargos ? enc.total : l.valor).toFixed(2), { tipo: 'number', obrigatorio: true, extra: 'step="0.01" min="0.01"' })}
      </div>
      <div>
        <label class="rotulo" for="f-forma">Forma</label>
        ${campoCombo('forma', formas, l.forma && l.forma !== 'boleto' ? l.forma : 'pix')}
        ${ERRO('forma')}
      </div>
      <p class="text-xs text-slate-500 dark:text-neutral-400">Registro manual nesta versão. Com a integração de cobrança (boleto/Pix por um provedor como Asaas ou Stripe), a baixa passa a ser automática.</p>`,
    aoSalvar: (fd) => {
      const r = Aulor.registrarBaixa(id, Object.fromEntries(fd.entries()), Shell.nome());
      if (r.erros) return r.erros;
      toast(receber ? 'Recebimento registrado' : 'Pagamento registrado');
      aoMudar();
      return [];
    },
  });
  form.querySelector('[data-encargos]')?.addEventListener('change', (e) => {
    form.querySelector('#f-valor').value = (e.target.checked ? enc.total : l.valor).toFixed(2);
  });
}

// Texto de cobrança pronto para WhatsApp/e-mail. `item`: { aluno, parcelas, total } de Aulor.inadimplentes().
function lembreteCobranca(item) {
  const a = item.aluno;
  const destinatario = Aulor.contatoCobranca(a);
  const cursos = [...new Set(item.parcelas.map((l) => Aulor.curso(Aulor.turma(Aulor.matricula(l.matriculaId).turmaId).cursoId).nome))].join(' e ');
  const texto = `Olá, ${destinatario.nome.split(' ')[0]}! Aqui é da ${Aulor.escola().nome}. Consta em aberto ${item.parcelas.length === 1 ? 'a parcela' : `${item.parcelas.length} parcelas`} do curso ${cursos}${destinatario !== a ? ` de ${a.nome.split(' ')[0]}` : ''}, com vencimento em ${item.parcelas.map((l) => dataBr(l.vencimento)).join(', ')}, no total de ${moeda(item.total)}. Se já pagou, por favor desconsidere. Quer que a gente envie a segunda via?`;
  return { texto, telefone: destinatario.telefone };
}

// ---------- Frequência ----------

function barraFrequencia(f, { compacta = false } = {}) {
  if (f.percentual == null) return '<span class="text-xs text-slate-400">Sem chamadas</span>';
  const cor = f.abaixo ? 'bg-red-500' : f.percentual < f.minimo + 10 ? 'bg-amber-500' : 'bg-emerald-500';
  const texto = f.abaixo ? 'text-red-700 dark:text-red-400' : 'text-slate-700 dark:text-neutral-200';
  return `
    <span class="inline-flex items-center gap-2" title="${f.validas} de ${f.total} aulas · mínimo ${f.minimo}%${f.semChance ? ' · não alcança mais o mínimo' : ''}">
      <span class="relative ${compacta ? 'w-14' : 'w-20'} h-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 overflow-hidden">
        <span class="absolute inset-y-0 left-0 ${cor}" style="width:${f.percentual}%"></span>
        <span class="absolute inset-y-0 w-px bg-slate-500/60" style="left:${f.minimo}%"></span>
      </span>
      <span class="text-sm font-medium tabular-nums ${texto}">${f.percentual}%</span>
    </span>`;
}

const descricaoTurma = (t) => `${t.codigo} · ${Agenda.descrever(t.agenda)}`;
const nomeModalidade = (id) => Aulor.MODALIDADES.find((m) => m.id === id)?.nome ?? '—';

// Vagas ocupadas: barra + "8/20". Com `minimo`, marca onde a turma "fecha".
function ocupacaoHtml(t, { minimo = false } = {}) {
  const o = Aulor.ocupacao(t);
  const p = Math.round((o.ocupadas / o.capacidade) * 100);
  const m = minimo ? Math.round((Aulor.minimoAlunos(t) / o.capacidade) * 100) : null;
  return `<span class="inline-flex items-center gap-2"><span class="relative w-16 h-1.5 rounded-full bg-slate-100 dark:bg-neutral-800 overflow-hidden"><span class="block h-full ${o.lotada ? 'bg-laranja' : 'bg-petrol-700 dark:bg-sky-400'}" style="width:${p}%"></span>${m != null ? `<span class="absolute top-0 h-full w-0.5 bg-slate-500" style="left:${m}%"></span>` : ''}</span><span class="text-sm tabular-nums">${o.ocupadas}/${o.capacidade}</span></span>`;
}

// ---------- Curso ----------

function linhaModulo(m = {}, i = 0) {
  return `
    <div data-modulo class="flex items-center gap-2">
      <input type="text" name="modNome" value="${esc(m.nome ?? '')}" placeholder="Módulo ${i + 1}" class="campo flex-1" aria-label="Nome do módulo">
      <input type="number" name="modHoras" value="${esc(m.cargaHoraria ?? '')}" min="0" step="0.5" placeholder="h" class="campo w-20" aria-label="Horas do módulo">
      <button type="button" data-remover-modulo class="p-2 rounded-md text-slate-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40" aria-label="Remover módulo">${UI_ICONE.fechar}</button>
    </div>`;
}

function abrirFormCurso({ curso = null, aoSalvar }) {
  const areas = [...new Set(Aulor.cursos().map((c) => c.area).filter(Boolean))];
  const { form } = modalFormulario({
    id: 'form-curso',
    titulo: curso ? 'Editar curso' : 'Novo curso',
    subtitulo: curso ? curso.nome : 'O curso é o produto do catálogo; as turmas são as ofertas com data, horário e professor.',
    rotulo: curso ? 'Salvar' : 'Criar curso',
    largura: 'xl',
    foco: '#f-nome',
    corpo: `
      <div class="grid sm:grid-cols-3 gap-4">
        ${campo('nome', 'Nome do curso', curso?.nome, { obrigatorio: true, classe: 'sm:col-span-2' })}
        ${campo('codigo', 'Sigla', curso?.codigo, { obrigatorio: true, extra: 'maxlength="10" style="text-transform:uppercase" placeholder="EXC"', dica: 'Prefixo do código das turmas.' })}
        ${campo('area', 'Área', curso?.area, { extra: 'list="areas-curso" placeholder="Informática, Idiomas…"' })}
        <div>
          <label class="rotulo" for="f-modalidade">Modalidade <span class="text-red-600">*</span></label>
          ${campoCombo('modalidade', Aulor.MODALIDADES, curso?.modalidade ?? 'presencial')}
          ${ERRO('modalidade')}
        </div>
        ${campo('cargaHoraria', 'Carga horária (h)', curso?.cargaHoraria, { tipo: 'number', obrigatorio: true, extra: 'min="1" step="0.5"' })}
        ${campo('valor', 'Valor de referência (R$)', curso?.valor, { tipo: 'number', extra: 'min="0" step="0.01"', dica: 'Sugerido na matrícula; pode ser negociado.' })}
        ${campo('parcelasSugeridas', 'Parcelas sugeridas', curso?.parcelasSugeridas ?? 1, { tipo: 'number', extra: `min="1" max="${Aulor.config().financeiro.parcelasMaximas}"` })}
        <div>
          <label class="rotulo" for="f-modeloCertificadoId">Modelo do certificado</label>
          ${campoCombo('modeloCertificadoId', Aulor.modelosCertificado().filter((m) => !m.padrao && (m.status === 'ativo' || m.id === curso?.modeloCertificadoId)).map((m) => ({ id: m.id, nome: m.nome, descricao: m.status === 'ativo' ? m.descricao : `${Aulor.STATUS_MODELO[m.status].nome}: emite com o padrão` })), curso?.modeloCertificadoId ?? '', { opcional: true, vazio: 'Padrão da escola' })}
          ${ERRO('modeloCertificadoId')}
        </div>
      </div>
      <datalist id="areas-curso">${areas.map((a) => `<option value="${esc(a)}">`).join('')}</datalist>
      <div>
        <label for="f-descricao" class="rotulo">Descrição</label>
        <textarea id="f-descricao" name="descricao" rows="2" class="campo">${esc(curso?.descricao ?? '')}</textarea>
      </div>
      <div>
        <div class="flex items-center justify-between mb-1">
          <p class="rotulo mb-0">Módulos <span class="normal-case font-normal tracking-normal text-slate-400">— opcional</span></p>
          <button type="button" data-add-modulo class="text-xs font-medium link">+ Adicionar módulo</button>
        </div>
        <div data-modulos class="space-y-2">${(curso?.modulos ?? []).map(linhaModulo).join('')}</div>
        <p data-soma-modulos class="text-xs text-slate-500 dark:text-neutral-400 mt-1.5"></p>
        ${ERRO('modulos')}
      </div>`,
    aoSalvar: (fd, f) => {
      const d = Object.fromEntries(fd.entries());
      d.modulos = [...f.querySelectorAll('[data-modulo]')].map((el) => ({ nome: el.querySelector('[name="modNome"]').value, cargaHoraria: el.querySelector('[name="modHoras"]').value }));
      const r = curso ? Aulor.atualizarCurso(curso.id, d) : Aulor.criarCurso(d);
      if (r.erros) return r.erros;
      aoSalvar(r.curso);
      return [];
    },
  });
  const lista = form.querySelector('[data-modulos]');
  const soma = () => {
    const horas = [...lista.querySelectorAll('[name="modHoras"]')].reduce((s, i) => s + (Number(i.value) || 0), 0);
    const carga = Number(form.querySelector('#f-cargaHoraria').value) || 0;
    form.querySelector('[data-soma-modulos]').textContent = lista.children.length ? `Soma dos módulos: ${horas} h${carga ? ` de ${carga} h` : ''}` : 'Sem módulos: o certificado lista só o curso.';
  };
  const ligarRemover = () => lista.querySelectorAll('[data-remover-modulo]').forEach((b) => { b.onclick = () => { b.closest('[data-modulo]').remove(); soma(); }; });
  form.querySelector('[data-add-modulo]').addEventListener('click', () => {
    lista.insertAdjacentHTML('beforeend', linhaModulo({}, lista.children.length));
    ligarRemover();
    soma();
    lista.lastElementChild.querySelector('input').focus();
  });
  form.addEventListener('input', soma);
  ligarRemover();
  soma();
}

// ---------- Turma ----------

function abrirFormTurma({ turma = null, cursoId = null, aoSalvar }) {
  const travada = turma && Aulor.turmaTemChamada(turma.id);
  const cursos = Aulor.cursos().filter((c) => c.ativo || c.id === turma?.cursoId).map((c) => ({ id: c.id, nome: c.nome, descricao: `${c.cargaHoraria} h · ${Aulor.MODALIDADES.find((m) => m.id === c.modalidade)?.nome}` }));
  const professores = Aulor.professores().filter((p) => p.status === 'ativo').map((p) => ({ id: p.id, nome: p.nome, descricao: p.especialidade }));
  const agenda = turma?.agenda ?? Agenda.vazia();
  const { form } = modalFormulario({
    id: 'form-turma',
    titulo: turma ? `Editar turma ${turma.codigo}` : 'Nova turma',
    subtitulo: turma ? Aulor.curso(turma.cursoId).nome : 'As aulas são geradas pela agenda até completar a carga horária do curso.',
    rotulo: turma ? 'Salvar' : 'Criar turma',
    largura: 'xl',
    corpo: `
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="rotulo" for="f-cursoId">Curso <span class="text-red-600">*</span></label>
          ${turma ? `<p class="campo bg-slate-50 dark:bg-neutral-900">${esc(Aulor.curso(turma.cursoId).nome)}</p><input type="hidden" name="cursoId" value="${turma.cursoId}">` : campoCombo('cursoId', cursos, cursoId ?? '', { vazio: 'Escolha o curso' })}
          ${ERRO('cursoId')}
        </div>
        <div>
          <label class="rotulo" for="f-professorId">Professor <span class="text-red-600">*</span></label>
          ${campoCombo('professorId', professores, turma?.professorId ?? '', { vazio: 'Escolha o professor' })}
          ${ERRO('professorId')}
        </div>
        ${campo('inicio', 'Primeira aula', turma?.inicio ?? '', { tipo: 'date', obrigatorio: true, extra: travada ? 'disabled' : '' })}
        <div class="grid grid-cols-2 gap-4">
          ${campo('capacidade', 'Vagas', turma?.capacidade ?? 15, { tipo: 'number', obrigatorio: true, extra: 'min="1" max="200"' })}
          ${campo('minimoAlunos', 'Mínimo para abrir', turma?.minimoAlunos ?? '', { tipo: 'number', extra: 'min="1" placeholder="½ das vagas" title="Opcional. Sem valor, vale metade das vagas."' })}
        </div>
        ${campo('local', 'Sala / local', turma?.local, { extra: 'placeholder="Sala 2, online…"' })}
      </div>
      ${travada ? '<p class="rounded-lg bg-slate-50 dark:bg-neutral-900 px-3 py-2 text-xs text-slate-600 dark:text-neutral-300">A turma já tem chamadas registradas: datas e horários ficam travados para não perder o histórico de frequência.</p>' : `<div data-agenda class="space-y-4">${Agenda.corpo(agenda)}</div><p data-previa class="text-sm font-medium text-petrol-800 dark:text-sky-300"></p>`}`,
    aoSalvar: (fd, f) => {
      const d = Object.fromEntries(fd.entries());
      d.agenda = travada ? turma.agenda : Agenda.ler(f);
      if (travada) d.inicio = turma.inicio;
      const r = turma ? Aulor.atualizarTurma(turma.id, d) : Aulor.criarTurma(d);
      if (r.erros) return r.erros;
      aoSalvar(r.turma);
      return [];
    },
  });
  if (travada) return;
  const previa = () => {
    const c = Aulor.curso(form.querySelector('[name="cursoId"]').value);
    const ag = Agenda.ler(form);
    const inicio = form.querySelector('#f-inicio').value;
    const el = form.querySelector('[data-previa]');
    if (!c || !inicio || Agenda.validar(ag).length) { el.textContent = ''; return; }
    const aulas = Aulor.gerarDatasAulas(Agenda.normalizar(ag), inicio, c.cargaHoraria);
    el.textContent = aulas.length ? `${aulas.length} aulas · de ${dataBr(aulas[0].data)} a ${dataBr(aulas[aulas.length - 1].data)} (${c.cargaHoraria} h)` : 'Nenhuma aula cai nos dias escolhidos.';
  };
  Agenda.ligar(form, previa);
  form.addEventListener('change', previa);
  form.addEventListener('input', previa);
  previa();
}
