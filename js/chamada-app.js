// ============================================================
// Chamada + diário de uma aula (?aula=ID). Feita para o celular do
// professor durante a aula: todos começam como presentes (como no
// protótipo original), um toque marca falta, alvos de 44px e o
// "Salvar" fica sempre visível no rodapé.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const aulaId = parametroUrl('aula');

  // Marcado: presente em verde, falta em vermelho, justificada em neutro (sem âmbar paralelo ao cobre).
  const OPCOES = [
    { id: 'P', nome: 'Presente', curto: 'Presente', cor: 'has-[:checked]:bg-emerald-700 has-[:checked]:border-emerald-700 has-[:checked]:text-white dark:has-[:checked]:bg-emerald-700 dark:has-[:checked]:border-emerald-600' },
    { id: 'F', nome: 'Falta', curto: 'Falta', cor: 'has-[:checked]:bg-red-600 has-[:checked]:border-red-600 has-[:checked]:text-white dark:has-[:checked]:bg-red-700 dark:has-[:checked]:border-red-600' },
    { id: 'J', nome: 'Falta justificada', curto: 'Justif.', cor: 'has-[:checked]:bg-slate-600 has-[:checked]:border-slate-600 has-[:checked]:text-white dark:has-[:checked]:bg-neutral-600 dark:has-[:checked]:border-neutral-500' },
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
    const sugestao = sugestaoConteudo(a, t);
    const aviso = a.status === 'cancelada' ? 'Aula cancelada: a chamada fica bloqueada.'
      : futura ? `A chamada abre no dia da aula (${quando(a.data)}). Até lá, confira a lista e a frequência de cada aluno.`
        : encerrada ? 'Turma concluída: a chamada não pode mais ser alterada.'
          : !Shell.podeChamada(t) ? 'Seu perfil pode ver, mas não registrar esta chamada.' : '';
    const volta = Shell.pode('turmas') && !Shell.ehSoProfessor() ? { rotulo: 'Turmas', href: 'turmas.html' } : { rotulo: Shell.ehSoProfessor() ? 'Minhas aulas' : 'Aulas e chamadas', href: 'aulas.html' };

    tela.innerHTML = `
      <form id="form-chamada" novalidate>
        ${cabecalhoFicha({
          trilha: [volta, { rotulo: t.codigo, href: `turma.html?id=${t.id}&aba=aulas` }, { rotulo: `Aula ${a.n}` }],
          avatar: avatarRegistro(c.codigo, 'Código do curso'),
          nome: esc(c.nome),
          pilulas: a.status === 'cancelada' ? pilula('neutro', 'Cancelada') : '',
          chips: [
            chip(ICONE.calendario, esc(dataLonga(a.data)), 'Data'),
            chip(ICONE.relogio, `<span class="tabular-nums">${a.inicio}–${a.fim}</span>`, 'Horário'),
            chip(ICONE.tag, `<span class="font-mono">${esc(t.codigo)}</span> · aula ${a.n} de ${total}`, 'Turma e aula'),
            t.local ? chip(ICONE.local, `<span class="inline-block max-w-56 truncate align-bottom">${esc(t.local)}</span>`, t.local) : '',
          ],
        })}
        ${aviso ? faixa('neutra', esc(aviso)) : ''}

        <section class="painel overflow-hidden">
          ${cabecalhoCartao(`Chamada <span class="ml-1 text-xs font-normal ${APOIO} tabular-nums">${plural(lista.length, 'aluno')}</span>`,
            `<span data-contagem class="tabular-nums"></span>${a.status === 'realizada' ? ` · registrada em ${dataBr(a.registradaEm)}${a.registradaPor ? ` por ${esc(a.registradaPor)}` : ''}` : editavel ? ' · todos vêm como presentes; marque só as exceções' : ''}`,
            editavel && lista.length ? '<button type="button" data-todos class="btn-fantasma max-sm:h-11">Todos presentes</button>' : '')}
          <ul class="mt-3 border-t border-slate-100 dark:border-neutral-900 divide-y divide-slate-100 dark:divide-neutral-900">
            ${lista.map((m) => {
              const al = Aulor.aluno(m.alunoId);
              const f = Aulor.frequencia(m);
              return `<li class="px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  ${avatar(al.nome, 'h-9 w-9 text-xs')}
                  <div class="min-w-0">
                    <p class="text-sm font-medium ${TITULO} truncate">${esc(al.nome)}</p>
                    <p class="text-xs tabular-nums ${f.abaixo ? 'text-red-700 dark:text-red-400' : APOIO}">${f.percentual == null ? 'primeira chamada' : `frequência ${f.percentual}%${f.abaixo ? ' · abaixo do mínimo' : ''}`}</p>
                  </div>
                </div>
                <div role="radiogroup" aria-label="Presença de ${esc(al.nome)}" class="grid grid-cols-3 gap-1.5 sm:w-72 shrink-0">
                  ${OPCOES.map((o) => `
                    <label class="grid place-items-center select-none rounded-lg border border-slate-300 dark:border-neutral-700 text-center text-sm font-semibold min-h-11 sm:min-h-9 text-slate-600 dark:text-neutral-300 transition ${o.cor} has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-petrol-800/40 dark:has-[:focus-visible]:ring-sky-400/50 ${editavel ? 'cursor-pointer hover:border-petrol-800 dark:hover:border-sky-400' : 'opacity-70 cursor-default'}" title="${o.nome}">
                      <input type="radio" name="p-${m.id}" value="${o.id}" class="sr-only" ${marcas[m.id] === o.id ? 'checked' : ''} ${editavel ? '' : 'disabled'}>${o.curto}
                    </label>`).join('')}
                </div>
              </li>`;
            }).join('') || `<li class="px-4 py-6 text-sm ${APOIO}">Nenhum aluno matriculado nesta data.</li>`}
          </ul>
          <div class="px-4">${ERRO('presencas')}</div>
        </section>

        <section class="painel mt-4">
          ${cabecalhoCartao('Diário da aula', sugestao ? `O que foi trabalhado. Pelo andamento da carga horária, o módulo seria "${esc(sugestao)}".` : 'O que foi trabalhado nesta aula.')}
          <div class="p-4">
            <label for="f-conteudo" class="sr-only">Diário: o que foi trabalhado</label>
            <textarea id="f-conteudo" name="conteudo" rows="3" class="campo" ${editavel ? '' : 'disabled'} placeholder="${esc(sugestao)}">${esc(a.conteudo)}</textarea>
          </div>
        </section>

        ${editavel ? `
        <div class="sticky -bottom-4 md:-bottom-6 z-20 mt-4 -mx-4 sm:mx-0 sm:rounded-xl bg-white/95 dark:bg-neutral-950/95 backdrop-blur border-t sm:border border-slate-200 dark:border-neutral-800 px-4 py-3 shadow-[0_-4px_12px_rgb(7_30_44/0.06)]">
          <div class="flex items-center justify-between gap-3">
            <p data-contagem-rodape class="text-sm text-slate-600 dark:text-neutral-300 tabular-nums hidden sm:block"></p>
            <button type="submit" class="btn-pri w-full sm:w-auto max-sm:h-12">Salvar chamada</button>
          </div>
        </div>` : ''}
      </form>`;

    const form = tela.querySelector('#form-chamada');
    const contar = () => {
      const fd = new FormData(form);
      const n = { P: 0, F: 0, J: 0 };
      lista.forEach((m) => { const v = fd.get(`p-${m.id}`); if (v) n[v] += 1; });
      const txt = `${plural(n.P, 'presente')} · ${plural(n.F, 'falta')}${n.J ? ` · ${plural(n.J, 'justificada')}` : ''}`;
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
      toast('Chamada salva. A frequência dos alunos já foi atualizada.');
      render();
      tela.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  render();
})();
