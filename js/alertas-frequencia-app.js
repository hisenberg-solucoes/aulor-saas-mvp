// ============================================================
// Alertas de frequência (grupo Pedagógico): alunos cursando que estão
// abaixo da frequência mínima ou perto dela, para a escola contatar antes
// de reprovar. Calculado de Aulor.frequencia; filtro por nível na URL
// (?nivel=sem_chance|abaixo|perto).
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const min = Aulor.config().academico.frequenciaMinima;
  const NIVEIS = {
    sem_chance: { rotulo: 'Não alcança mais', ajuda: 'mesmo indo a todas as aulas restantes', cor: 'bg-red-500', tom: 'perigo' },
    abaixo: { rotulo: 'Abaixo do mínimo', ajuda: `menos de ${min}% hoje, ainda recupera`, cor: 'bg-amber-500', tom: 'atencao' },
    perto: { rotulo: 'Perto do limite', ajuda: `até 10 pontos acima de ${min}%`, cor: 'bg-slate-400', tom: 'neutro' },
  };
  const filtro = { nivel: NIVEIS[parametroUrl('nivel')] ? parametroUrl('nivel') : '', turmaId: '', q: '' };
  const nivelDe = (f) => (f.semChance ? 'sem_chance' : f.abaixo ? 'abaixo' : f.percentual < min + 10 ? 'perto' : null);

  const alertas = Aulor.matriculas()
    .filter((m) => m.status === 'ativa' && ['em_andamento', 'a_concluir'].includes(Aulor.situacaoTurma(Aulor.turma(m.turmaId))))
    .map((m) => ({ m, f: Aulor.frequencia(m) }))
    .filter(({ f }) => f.total >= 1)
    .map((x) => ({ ...x, nivel: nivelDe(x.f) }))
    .filter((x) => x.nivel)
    .sort((a, b) => Object.keys(NIVEIS).indexOf(a.nivel) - Object.keys(NIVEIS).indexOf(b.nivel) || a.f.percentual - b.f.percentual);

  function contato({ m, f }) {
    const a = Aulor.aluno(m.alunoId);
    const menor = a.responsavel && (Aulor.idade(a.nascimento) ?? 99) < 18;
    const quem = menor ? a.responsavel : a;
    const curso = Aulor.curso(Aulor.turma(m.turmaId).cursoId).nome;
    const texto = `Olá, ${quem.nome.split(' ')[0]}! Aqui é da ${Aulor.escola().nome}. Sentimos falta ${menor ? `de ${a.nome.split(' ')[0]}` : 'de você'} nas aulas de ${curso}: a frequência está em ${f.percentual}% e o mínimo para o certificado é ${min}%. Podemos ajudar em algo?`;
    return { quem, texto, menor };
  }

  function render() {
    const termo = normalizarTexto(filtro.q);
    const lista = alertas.filter((x) => (!filtro.nivel || x.nivel === filtro.nivel) && (!filtro.turmaId || x.m.turmaId === filtro.turmaId) && (!termo || normalizarTexto(Aulor.aluno(x.m.alunoId).nome).includes(termo)));
    const turmas = [...new Set(alertas.map((x) => x.m.turmaId))].map((id) => Aulor.turma(id));
    const filtrando = !!(filtro.nivel || filtro.turmaId || filtro.q);
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoPagina({ titulo: 'Alertas de frequência', subtitulo: `Alunos cursando com frequência abaixo ou perto do mínimo de ${min}%. Calculado pelas chamadas registradas; aula sem chamada não conta.` })}

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          ${Object.entries(NIVEIS).map(([id, n]) => cartaoNumero({ rotulo: n.rotulo, valor: alertas.filter((x) => x.nivel === id).length, ajuda: n.ajuda, cor: n.cor, filtro: id, ativo: filtro.nivel === id })).join('')}
        </div>

        <div class="flex flex-wrap items-center gap-2 mb-4">
          ${campoBusca('busca', filtro.q, 'Buscar aluno')}
          ${selectFiltro('f-turma', [{ id: '', nome: 'Todas as turmas' }, ...turmas.map((t) => ({ id: t.id, nome: `${t.codigo} · ${Aulor.curso(t.cursoId).nome}` }))], filtro.turmaId, 'Turma')}
          ${filtrando ? '<button type="button" data-limpar class="text-sm font-medium link">Limpar</button>' : ''}
        </div>

        <div class="painel overflow-hidden">
          ${lista.length ? `<div class="overflow-x-auto">
            <table class="tabela">
              <thead><tr><th>Aluno</th><th>Turma</th><th>Frequência</th><th class="num">Faltas</th><th class="num">Aulas restantes</th><th>Nível</th><th></th></tr></thead>
              <tbody>${lista.map((x) => {
                const a = Aulor.aluno(x.m.alunoId);
                const t = Aulor.turma(x.m.turmaId);
                const c = contato(x);
                return `<tr>
                  <td>${Shell.pode('alunos') ? `<a class="font-medium text-slate-900 dark:text-neutral-100 hover:underline" href="aluno.html?id=${a.id}">${esc(a.nome)}</a>` : `<span class="font-medium">${esc(a.nome)}</span>`}<p class="text-xs text-slate-500 dark:text-neutral-400 tabular-nums">${c.menor ? `Resp.: ${esc(c.quem.nome)} · ` : ''}${telefoneFmt(c.quem.telefone)}</p></td>
                  <td><a class="link whitespace-nowrap" href="turma.html?id=${t.id}">${esc(t.codigo)}</a><p class="text-xs text-slate-500 dark:text-neutral-400 truncate max-w-[12rem]">${esc(Aulor.curso(t.cursoId).nome)}</p></td>
                  <td>${barraFrequencia(x.f)}</td>
                  <td class="num">${x.f.faltas}${x.f.justificadas ? `<p class="text-xs text-slate-400">+ ${x.f.justificadas} just.</p>` : ''}</td>
                  <td class="num">${x.f.restantes}</td>
                  <td>${status(NIVEIS[x.nivel].tom, NIVEIS[x.nivel].rotulo)}</td>
                  <td class="text-right"><a class="btn-sec btn-pequeno" target="_blank" rel="noopener" href="https://wa.me/55${c.quem.telefone}?text=${encodeURIComponent(c.texto)}" title="Abre o WhatsApp com a mensagem pronta">Contatar</a></td>
                </tr>`;
              }).join('')}</tbody>
            </table>
          </div>` : vazio(alertas.length ? 'Nenhum aluno neste filtro' : 'Ninguém com frequência baixa', 'Todos os alunos cursando estão com frequência confortável.')}
          <p class="px-4 py-2.5 text-xs text-slate-500 dark:text-neutral-400 border-t border-slate-100 dark:border-neutral-900 tabular-nums">${lista.length} ${lista.length === 1 ? 'aluno' : 'alunos'}${filtrando ? ` de ${alertas.length}` : ''}</p>
        </div>
      </div>`;
    const busca = tela.querySelector('#busca');
    busca.addEventListener('input', () => { filtro.q = busca.value; const pos = busca.selectionStart; render(); const n = tela.querySelector('#busca'); n.focus(); n.setSelectionRange(pos, pos); });
    tela.querySelector('#f-turma').addEventListener('change', (e) => { filtro.turmaId = e.target.value; render(); });
    tela.querySelector('[data-limpar]')?.addEventListener('click', () => { filtro.q = ''; filtro.turmaId = ''; definirNivel(''); });
    tela.querySelectorAll('[data-cartao]').forEach((b) => b.addEventListener('click', () => definirNivel(filtro.nivel === b.dataset.cartao ? '' : b.dataset.cartao)));
  }

  function definirNivel(valor) {
    filtro.nivel = valor;
    const url = new URL(location.href);
    if (valor) url.searchParams.set('nivel', valor); else url.searchParams.delete('nivel');
    history.replaceState(null, '', url);
    render();
  }

  render();
})();
