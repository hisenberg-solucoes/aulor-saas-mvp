// ============================================================
// Visão geral: como a escola está e o que precisa de atenção hoje.
// Tudo é calculado na hora a partir dos registros (nada fixo na tela) e
// filtrado pelas permissões de quem está logado. Segue a seção Painéis do
// DESIGN.md do original: linha de indicadores sobre o fundo, tinta nos
// dados, cobre só como ponto de pendência e vermelho só em número com sinal.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const hoje = Aulor.hoje();
  const mes = hoje.slice(0, 7);
  const nomeMes = dataObj(`${mes}-15`).toLocaleDateString('pt-BR', { month: 'long' });
  const pode = Shell.pode;
  const verFin = pode('receber');
  const verAcad = pode('turmas') || pode('frequencia');
  const COBRE = 'bg-[color:var(--f-cobre)]';
  const pontoPendencia = `<span class="h-2 w-2 shrink-0 rounded-full ${COBRE}" aria-hidden="true"></span>`;

  const saudacao = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

  // Regra da Linha de Indicadores: células lado a lado sobre o fundo, divisórias de 1px, sem fundo nem sombra.
  // A célula inteira leva à lista que explica o número; pendência é ponto cobre antes do rótulo, valor em tinta.
  function celula({ rotulo, valor, contexto, href = '', extra = '', pendente = false }, i) {
    const borda = ['border-slate-200 dark:border-neutral-800', i % 2 ? 'border-l' : '', i >= 2 ? 'border-t xl:border-t-0' : '', i && i % 2 === 0 ? 'xl:border-l' : ''].join(' ');
    const tag = href ? 'a' : 'div';
    return `
      <${tag} ${href ? `href="${href}"` : ''} class="${borda} block min-w-0 px-4 py-3 ${href ? 'transition hover:bg-white dark:hover:bg-neutral-950 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[color:var(--f-foco)]' : ''}">
        <p class="text-xs font-medium ${APOIO_FUNDO} flex items-center gap-1.5">${pendente ? pontoPendencia : ''}${esc(rotulo)}</p>
        <p class="mt-1 text-2xl leading-7 font-semibold tracking-[-0.02em] ${TITULO}">${valor}</p>
        ${extra}
        <p class="mt-1 text-xs text-slate-700 dark:text-neutral-300">${contexto}</p>
      </${tag}>`;
  }

  function indicadores() {
    const ativos = Aulor.alunosAtivos().length;
    const recentes = Aulor.matriculas().filter((m) => m.status !== 'cancelada' && Aulor.diasEntre(m.data, hoje) <= 30).length;
    const turmas = Aulor.turmas();
    const andamento = turmas.filter((t) => ['em_andamento', 'a_concluir'].includes(Aulor.situacaoTurma(t))).length;
    const aIniciar = turmas.filter((t) => Aulor.situacaoTurma(t) === 'planejada').length;
    const celulas = [{ rotulo: 'Alunos ativos', valor: numero(ativos), contexto: `${plural(recentes, 'matrícula', 'matrículas')} nos últimos 30 dias`, href: pode('alunos') ? 'alunos.html?situacao=ativo' : '' }];
    if (verFin) {
      const r = Aulor.resumoMes(mes);
      const inad = Aulor.inadimplentes();
      const atraso = inad.reduce((s, i) => s + i.total, 0);
      const p = r.receberPrevisto ? Math.round((r.recebido / r.receberPrevisto) * 100) : 0;
      celulas.push({ rotulo: `Recebido em ${nomeMes}`, valor: moeda(r.recebido), contexto: `de ${moeda(r.receberPrevisto)} previstos para o mês`, href: 'financeiro.html', extra: `<span class="mt-2 flex" title="${p}% do previsto">${medidor(p, { largura: 'w-full' })}</span>` });
      celulas.push({ rotulo: 'Em atraso', valor: moeda(atraso), contexto: inad.length ? `${plural(inad.length, 'aluno', 'alunos')} com parcela vencida` : 'ninguém em atraso', href: 'financeiro.html?aba=atraso', pendente: atraso > 0 });
    }
    celulas.push({ rotulo: 'Turmas em andamento', valor: numero(andamento), contexto: `${numero(aIniciar)} ${aIniciar === 1 ? 'começa' : 'começam'} nas próximas semanas`, href: pode('turmas') ? 'turmas.html' : '' });
    return `<section aria-label="Indicadores" class="mb-6 grid grid-cols-2 xl:grid-cols-${celulas.length}">${celulas.map(celula).join('')}</section>`;
  }

  // Fila "Precisa de atenção": cada item leva para onde a pessoa resolve. Urgente primeiro.
  function pendencias() {
    const itens = [];
    if (verAcad) {
      const pend = Aulor.chamadasPendentes();
      if (pend.length) {
        const a = pend[0];
        const t = Aulor.turma(a.turmaId);
        itens.push({ tom: 'atencao', titulo: `${pend.length} ${pend.length === 1 ? 'chamada pendente' : 'chamadas pendentes'}`, detalhe: pend.length === 1 ? `${t.codigo} · aula de ${dataLonga(a.data).toLowerCase()} sem registro de presença` : 'Aulas que já aconteceram sem registro de presença', href: pend.length === 1 ? `chamada.html?aula=${a.id}` : 'aulas.html', acao: 'Registrar' });
      }
      Aulor.turmas().filter((t) => Aulor.situacaoTurma(t) === 'a_concluir').forEach((t) => {
        itens.push({ tom: 'atencao', titulo: `${t.codigo} terminou e aguarda conclusão`, detalhe: `${Aulor.curso(t.cursoId).nome} · última aula em ${dataBr(t.fim)}. Concluir libera os certificados.`, href: `turma.html?id=${t.id}`, acao: 'Concluir' });
      });
      const risco = Aulor.alunosEmRisco();
      if (risco.length) itens.push({ tom: 'perigo', titulo: `${risco.length} ${risco.length === 1 ? 'aluno abaixo' : 'alunos abaixo'} da frequência mínima (${Aulor.config().academico.frequenciaMinima}%)`, detalhe: `${risco.filter((x) => x.f.semChance).length} já não alcançam o mínimo até o fim do curso`, href: 'alertas-frequencia.html', acao: 'Ver alunos' });
    }
    if (pode('certificados')) {
      const prontos = Aulor.prontosParaEmitir().length;
      if (prontos) itens.push({ tom: 'info', titulo: `${prontos} ${prontos === 1 ? 'certificado pronto' : 'certificados prontos'} para emitir`, detalhe: 'Alunos aprovados em turmas concluídas', href: 'certificados.html', acao: 'Emitir' });
    }
    if (verFin) {
      const inad = Aulor.inadimplentes();
      if (inad.length) {
        const total = inad.reduce((s, i) => s + i.total, 0);
        itens.push({ tom: 'perigo', titulo: `${inad.length} ${inad.length === 1 ? 'aluno' : 'alunos'} com parcelas vencidas`, detalhe: `${moeda(total)} em atraso · maior atraso de ${Math.max(...inad.map((i) => i.maiorAtraso))} dias`, href: 'financeiro.html?aba=atraso', acao: 'Cobrar' });
      }
      const semana = Aulor.lancamentos().filter((l) => l.tipo === 'receber' && Aulor.situacaoLancamento(l) === 'a_vencer' && Aulor.diasEntre(hoje, l.vencimento) <= 7);
      if (semana.length) itens.push({ tom: 'info', titulo: `${semana.length} parcelas vencem nos próximos 7 dias`, detalhe: `${moeda(semana.reduce((s, l) => s + l.valor, 0))} a receber`, href: 'financeiro.html?aba=receber&situacao=a_vencer', acao: 'Ver' });
    }
    if (pode('pagar')) {
      const vencidas = Aulor.lancamentos().filter((l) => l.tipo === 'pagar' && Aulor.situacaoLancamento(l) === 'vencido');
      if (vencidas.length) itens.push({ tom: 'perigo', titulo: `${vencidas.length} ${vencidas.length === 1 ? 'conta a pagar vencida' : 'contas a pagar vencidas'}`, detalhe: vencidas.map((l) => `${l.descricao} (${dataCurta(l.vencimento)})`).join(', '), href: 'financeiro.html?aba=pagar&situacao=vencido', acao: 'Pagar' });
    }
    if (pode('turmas')) {
      const risco = Aulor.turmasEmRisco().filter((r) => r.nivel !== 'atencao');
      if (risco.length) itens.push({ tom: risco.some((r) => r.nivel === 'critico') ? 'perigo' : 'atencao', titulo: `${risco.length} ${risco.length === 1 ? 'turma ainda não atingiu' : 'turmas ainda não atingiram'} o mínimo de alunos para abrir`, detalhe: risco.map((r) => `${r.turma.codigo}: ${r.ocupadas} de ${r.minimo}, começa ${quando(r.turma.inicio)}`).join(' · '), href: 'turmas-risco.html', acao: 'Ver turmas' });
    }
    if (pode('matriculas', 'criar')) {
      const sem = Aulor.alunos().filter((a) => Aulor.situacaoAluno(a).id === 'sem_matricula').length;
      if (sem) itens.push({ tom: 'info', titulo: `${sem} ${sem === 1 ? 'aluno cadastrado' : 'alunos cadastrados'} sem matrícula`, detalhe: 'Interessados que ainda não foram matriculados em uma turma', href: 'alunos.html?situacao=sem_matricula', acao: 'Matricular' });
    }
    const ordem = { perigo: 0, atencao: 1, info: 2 };
    itens.sort((a, b) => ordem[a.tom] - ordem[b.tom]);
    // Painel não pinta ponto de vermelho (Regra do Azul e do Vermelho): o que é com você é cobre; o próximo passo, neutro.
    const ponto = (tom) => (tom === 'info' ? '<span class="h-2 w-2 shrink-0 rounded-full bg-slate-400 dark:bg-neutral-500" aria-hidden="true"></span>' : pontoPendencia);
    return cartao({
      titulo: 'Precisa de atenção',
      contexto: itens.length ? `${plural(itens.length, 'item', 'itens')}, o mais urgente primeiro` : '',
      classe: 'overflow-hidden',
      corpo: itens.length ? `<ul class="mt-2 divide-y divide-slate-100 dark:divide-neutral-900 border-t border-slate-100 dark:border-neutral-900">${itens.map((i) => `
          <li>
            <a href="${i.href}" class="group flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-neutral-900 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[color:var(--f-foco)]">
              ${ponto(i.tom)}
              <span class="flex-1 min-w-0">
                <span class="block text-sm font-medium text-slate-800 dark:text-neutral-100">${esc(i.titulo)}</span>
                <span class="block text-xs ${APOIO} truncate">${esc(i.detalhe)}</span>
              </span>
              <span class="text-xs font-semibold text-petrol-800 dark:text-sky-300 shrink-0 group-hover:underline underline-offset-2">${esc(i.acao)}</span>
            </a>
          </li>`).join('')}</ul>` : vazio('Tudo em dia', 'Nenhuma pendência para hoje.'),
    });
  }

  function aulasDeHoje() {
    if (!verAcad) return '';
    const aulas = Aulor.aulasDoDia(hoje);
    const agora = new Date().toTimeString().slice(0, 5);
    // Só a exceção se anuncia: chamada feita, ou a aula já começou e a chamada ainda não foi feita.
    const situacao = (a) => (a.status === 'realizada' ? status('ok', 'Chamada feita')
      : a.inicio <= agora ? `<span class="inline-flex items-center gap-1.5 text-sm whitespace-nowrap ${AVISO}">${pontoPendencia}Chamada a fazer</span>` : '');
    return cartao({
      titulo: 'Aulas de hoje',
      contexto: aulas.length ? plural(aulas.length, 'aula', 'aulas') : 'Nenhuma aula hoje',
      acao: '<a href="aulas.html" class="btn-fantasma">Agenda</a>',
      classe: 'overflow-hidden',
      corpo: aulas.length ? `<ul class="mt-2 divide-y divide-slate-100 dark:divide-neutral-900 border-t border-slate-100 dark:border-neutral-900">${aulas.map((a) => {
        const t = Aulor.turma(a.turmaId);
        return `<li><a href="chamada.html?aula=${a.id}" class="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-neutral-900 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[color:var(--f-foco)]">
            <span class="text-sm font-semibold tabular-nums ${TITULO} w-12 shrink-0">${a.inicio}</span>
            <span class="flex-1 min-w-0">
              <span class="block text-sm text-slate-800 dark:text-neutral-100 truncate">${esc(Aulor.curso(t.cursoId).nome)}</span>
              <span class="block text-xs ${APOIO} truncate">${esc(t.codigo)} · ${esc(Aulor.professor(t.professorId).nome)} · ${esc(t.local)}</span>
            </span>
            ${situacao(a)}
          </a></li>`;
      }).join('')}</ul>` : '<div class="pb-4"></div>',
    });
  }

  function matriculasRecentes() {
    if (!pode('matriculas')) return '';
    const lista = [...Aulor.matriculas()].sort((a, b) => b.data.localeCompare(a.data) || b.codigo.localeCompare(a.codigo)).slice(0, 5);
    return cartao({
      titulo: 'Matrículas recentes',
      contexto: 'As cinco últimas',
      acao: '<a href="matriculas.html" class="btn-fantasma">Todas</a>',
      classe: 'overflow-hidden',
      corpo: `<ul class="mt-2 divide-y divide-slate-100 dark:divide-neutral-900 border-t border-slate-100 dark:border-neutral-900">${lista.map((m) => {
        const t = Aulor.turma(m.turmaId);
        return `<li><a href="matricula.html?id=${m.id}" class="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-neutral-900 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[color:var(--f-foco)]">
            ${avatar(Aulor.aluno(m.alunoId).nome)}
            <span class="flex-1 min-w-0">
              <span class="block text-sm text-slate-800 dark:text-neutral-100 truncate">${esc(Aulor.aluno(m.alunoId).nome)}</span>
              <span class="block text-xs ${APOIO} truncate">${esc(Aulor.curso(t.cursoId).nome)} · ${esc(t.codigo)}</span>
            </span>
            <span class="text-xs ${APOIO} shrink-0">${quando(m.data)}</span>
          </a></li>`;
      }).join('')}</ul>`,
    });
  }

  const acoes = [
    pode('matriculas', 'criar') ? `<a href="matricula-nova.html" class="btn-pri">${ICONE.mais}Nova matrícula</a>` : '',
    pode('alunos', 'criar') ? '<a href="alunos.html?novo=1" class="btn-sec">Cadastrar aluno</a>' : '',
  ].join('');

  const lateral = aulasDeHoje() + matriculasRecentes();
  tela.innerHTML = `
    <div>
      ${cabecalhoPagina({ titulo: `${saudacao()}, ${esc(Shell.nome().split(' ')[0])}`, subtitulo: `${dataLonga(hoje)} · ${esc(Aulor.escola().nome)}`, acoes })}
      ${indicadores()}
      <div class="grid grid-cols-1 ${lateral ? 'xl:grid-cols-3' : ''} gap-4 items-start">
        <div class="${lateral ? 'xl:col-span-2' : ''}">${pendencias()}</div>
        ${lateral ? `<div class="space-y-4">${lateral}</div>` : ''}
      </div>
    </div>`;
})();
