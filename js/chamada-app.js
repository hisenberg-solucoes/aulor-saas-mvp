// ============================================================
// Chamada + diário de uma aula (?aula=ID). Feita para o celular do
// professor durante a aula: todos começam como presentes (como no
// protótipo original), um toque marca falta, botões grandes e o
// "Salvar" fica sempre visível no rodapé.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const aulaId = parametroUrl('aula');
  let salvo = false;

  const OPCOES = [
    { id: 'P', nome: 'Presente', curto: 'Presente', cor: 'has-[:checked]:bg-bom/15 has-[:checked]:border-bom has-[:checked]:text-bom' },
    { id: 'F', nome: 'Falta', curto: 'Falta', cor: 'has-[:checked]:bg-ruim/15 has-[:checked]:border-ruim has-[:checked]:text-ruim' },
    { id: 'J', nome: 'Falta justificada', curto: 'Justif.', cor: 'has-[:checked]:bg-cobre/15 has-[:checked]:border-cobre has-[:checked]:text-cobre-tinta' },
  ];

  function sugestaoConteudo(a, t) {
    const c = Aulor.curso(t.cursoId);
    let acumulado = 0;
    const antes = Aulor.aulasDaTurma(t.id).filter((x) => x.n < a.n).reduce((s, x) => s + (Number(x.fim.slice(0, 2)) * 60 + Number(x.fim.slice(3)) - Number(x.inicio.slice(0, 2)) * 60 - Number(x.inicio.slice(3))) / 60, 0);
    return c.modulos.find((m) => (acumulado += m.cargaHoraria) > antes)?.nome ?? '';
  }

  function render() {
    const a = Aulor.aula(aulaId);
    const t = a && Aulor.turma(a.turmaId);
    if (!a || !Shell.podeVerTurma(t)) { tela.innerHTML = vazio('Aula não encontrada', '', '<a class="btn-sec" href="aulas.html">Voltar</a>'); return; }
    const c = Aulor.curso(t.cursoId);
    const hoje = Aulor.hoje();
    const lista = a.status === 'realizada' ? Aulor.matriculasDaTurma(t.id, { incluirCanceladas: true }).filter((m) => a.presencas[m.id]) : Aulor.participantes(a);
    const encerrada = ['concluida', 'cancelada'].includes(t.status);
    const futura = a.data > hoje;
    const editavel = Shell.podeChamada(t) && !encerrada && !futura && a.status !== 'cancelada';
    const marcas = a.status === 'realizada' ? a.presencas : Object.fromEntries(lista.map((m) => [m.id, 'P']));
    const total = Aulor.progressoTurma(t).total;
    const aviso = futura ? 'A chamada abre no dia da aula.'
      : encerrada ? 'Turma concluída: a chamada não pode mais ser alterada.'
        : !Shell.podeChamada(t) ? 'Seu perfil pode ver, mas não registrar esta chamada.' : '';

    tela.innerHTML = `
      <form id="form-chamada" novalidate class="max-w-2xl mx-auto">
        <a href="${Shell.pode('turmas') && !Shell.ehSoProfessor() ? `turma.html?id=${t.id}&aba=aulas` : 'aulas.html'}" class="inline-flex items-center gap-1 text-xs font-medium text-tinta-2 hover:text-marca-tinta mb-2">${ICONE.voltar}${Shell.ehSoProfessor() ? 'Minhas aulas' : `Turma ${esc(t.codigo)}`}</a>
        <div class="mb-4">
          <h2 class="font-display text-xl font-semibold text-tinta">${esc(c.nome)}</h2>
          <p class="text-sm text-tinta-2">${esc(t.codigo)} · ${dataLonga(a.data)}, ${a.inicio}–${a.fim} · aula ${a.n} de ${total}</p>
        </div>
        ${salvo ? `<div class="mb-4 rounded-xl border border-bom/30 bg-bom/10 px-4 py-3 text-sm text-tinta flex items-center justify-between gap-2">Chamada salva. A frequência dos alunos já foi atualizada. <a href="aulas.html" class="font-semibold underline shrink-0">Voltar</a></div>` : ''}
        ${a.status === 'realizada' && !salvo ? `<p class="mb-4 text-xs text-tinta-2">Registrada em ${dataBr(a.registradaEm)}${a.registradaPor ? ` por ${esc(a.registradaPor)}` : ''}.${editavel ? ' Você pode corrigir e salvar de novo.' : ''}</p>` : ''}
        ${aviso ? `<p class="mb-4 rounded-xl bg-etiqueta px-4 py-3 text-sm text-tinta">${aviso}</p>` : ''}

        <div class="flex items-center justify-between gap-2 mb-2">
          <p data-contagem class="text-sm font-medium text-tinta"></p>
          ${editavel ? '<button type="button" data-todos class="text-sm font-semibold link">Todos presentes</button>' : ''}
        </div>
        <ul class="painel divide-y divide-linha">
          ${lista.map((m) => {
            const al = Aulor.aluno(m.alunoId);
            const f = Aulor.frequencia(m);
            return `<li class="px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                ${avatar(al.nome, 'h-9 w-9 text-xs')}
                <div class="min-w-0">
                  <p class="text-sm font-medium text-tinta truncate">${esc(al.nome)}</p>
                  <p class="text-xs ${f.abaixo ? 'text-ruim' : 'text-tinta-2'}">${f.percentual == null ? 'primeira chamada' : `frequência ${f.percentual}%${f.abaixo ? ' · abaixo do mínimo' : ''}`}</p>
                </div>
              </div>
              <div role="radiogroup" aria-label="Presença de ${esc(al.nome)}" class="grid grid-cols-3 gap-1.5 sm:w-72 shrink-0">
                ${OPCOES.map((o) => `
                  <label class="cursor-pointer select-none rounded-lg border border-linha-forte text-center text-sm font-semibold py-2.5 min-h-11 text-tinta-2 transition ${o.cor} has-[:checked]:ring-1 has-[:checked]:ring-inset has-[:checked]:ring-current has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-marca-tinta/40 ${editavel ? '' : 'opacity-70 cursor-default'}" title="${o.nome}">
                    <input type="radio" name="p-${m.id}" value="${o.id}" class="sr-only" ${marcas[m.id] === o.id ? 'checked' : ''} ${editavel ? '' : 'disabled'}>${o.curto}
                  </label>`).join('')}
              </div>
            </li>`;
          }).join('') || '<li class="px-4 py-6 text-sm text-tinta-2">Nenhum aluno matriculado nesta data.</li>'}
        </ul>
        ${ERRO('presencas')}

        <div class="mt-5">
          <label for="f-conteudo" class="rotulo">Diário: o que foi trabalhado</label>
          <textarea id="f-conteudo" name="conteudo" rows="3" class="campo" ${editavel ? '' : 'disabled'} placeholder="${esc(sugestaoConteudo(a, t))}">${esc(a.conteudo)}</textarea>
        </div>

        ${editavel ? `
        <div class="sticky -bottom-4 md:-bottom-6 z-20 mt-5 -mx-4 sm:mx-0 sm:rounded-xl bg-elevado/95 backdrop-blur border-t sm:border border-linha px-4 py-3 shadow-[0_-4px_12px_rgba(15,23,42,.06)]">
          <div class="flex items-center justify-between gap-3">
            <p data-contagem-rodape class="text-sm text-tinta-2 hidden sm:block"></p>
            <button type="submit" class="btn-pri w-full sm:w-auto py-3 sm:py-2">Salvar chamada</button>
          </div>
        </div>` : ''}
      </form>`;

    const form = tela.querySelector('#form-chamada');
    const contar = () => {
      const fd = new FormData(form);
      const n = { P: 0, F: 0, J: 0 };
      lista.forEach((m) => { const v = fd.get(`p-${m.id}`); if (v) n[v] += 1; });
      const txt = `${n.P} presentes · ${n.F} faltas${n.J ? ` · ${n.J} justificadas` : ''}`;
      form.querySelector('[data-contagem]').textContent = txt;
      const r = form.querySelector('[data-contagem-rodape]');
      if (r) r.textContent = txt;
    };
    form.addEventListener('change', contar);
    contar();
    form.querySelector('[data-todos]')?.addEventListener('click', () => {
      form.querySelectorAll('input[type="radio"][value="P"]').forEach((i) => { i.checked = true; });
      contar();
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const presencas = Object.fromEntries(lista.map((m) => [m.id, fd.get(`p-${m.id}`)]));
      const r = Aulor.registrarChamada(a.id, { presencas, conteudo: fd.get('conteudo') }, Shell.nome());
      if (r.erros) { mostrarErros(form, r.erros); toast(r.erros[0].mensagem, 'erro'); return; }
      salvo = true;
      toast('Chamada salva');
      render();
      tela.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  render();
})();
