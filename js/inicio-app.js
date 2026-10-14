// ============================================================
// Visão geral: como a escola está e o que precisa de atenção hoje.
// Tudo é calculado na hora a partir dos registros (nada fixo na tela) e
// filtrado pelas permissões de quem está logado.
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

  const saudacao = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

  // Linha de indicadores (DESIGN.md, Painéis): valor sempre em tinta; pendência é ponto cobre no rótulo.
  function indicador(rotulo, valor, detalhe, href, extra = '', pendente = false) {
    return `
      <a href="${href}" class="block p-4 bg-elevado hover:bg-realce transition">
        <p class="flex items-center gap-1.5 text-xs font-medium text-tinta-3">${pendente ? '<span class="h-[7px] w-[7px] rounded-full bg-cobre"></span>' : ''}${esc(rotulo)}</p>
        <p class="mt-1 text-2xl leading-7 font-semibold tracking-[-0.02em] text-tinta">${valor}</p>
        ${extra}
        <p class="mt-1 text-xs text-tinta-2">${detalhe}</p>
      </a>`;
  }

  function indicadores() {
    const ativos = Aulor.alunosAtivos().length;
    const recentes = Aulor.matriculas().filter((m) => m.status !== 'cancelada' && Aulor.diasEntre(m.data, hoje) <= 30).length;
    const turmas = Aulor.turmas();
    const andamento = turmas.filter((t) => ['em_andamento', 'a_concluir'].includes(Aulor.situacaoTurma(t))).length;
    const aIniciar = turmas.filter((t) => Aulor.situacaoTurma(t) === 'planejada').length;
    const blocos = [indicador('Alunos ativos', numero(ativos), `${recentes} matrículas nos últimos 30 dias`, 'alunos.html?situacao=ativo')];
    if (verFin) {
      const r = Aulor.resumoMes(mes);
      const inad = Aulor.inadimplentes();
      const p = r.receberPrevisto ? Math.min(100, Math.round((r.recebido / r.receberPrevisto) * 100)) : 0;
      blocos.push(indicador(`Recebido em ${nomeMes}`, moeda(r.recebido), `de ${moeda(r.receberPrevisto)} previstos para o mês`, 'financeiro.html',
        `<div class="mt-2 h-1.5 rounded-full bg-etiqueta overflow-hidden"><div class="h-full rounded-full bg-tinta" style="width:${p}%"></div></div>`));
      blocos.push(indicador('Em atraso', moeda(r.vencido), `${inad.length} ${inad.length === 1 ? 'aluno' : 'alunos'} com parcela vencida`, 'cobrancas.html', '', r.vencido > 0));
    }
    blocos.push(indicador('Turmas em andamento', numero(andamento), `${aIniciar} ${aIniciar === 1 ? 'começa' : 'começam'} nas próximas semanas`, 'turmas.html'));
    return `<div class="grid grid-cols-2 ${blocos.length === 4 ? 'lg:grid-cols-4' : ''} gap-px bg-linha border border-linha rounded-xl overflow-hidden">${blocos.join('')}</div>`;
  }

  // Fila "precisa de atenção": cada item leva para onde a pessoa resolve.
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
        itens.push({ tom: 'perigo', titulo: `${inad.length} ${inad.length === 1 ? 'aluno' : 'alunos'} com parcelas vencidas`, detalhe: `${moeda(total)} em atraso · maior atraso de ${Math.max(...inad.map((i) => i.maiorAtraso))} dias`, href: 'cobrancas.html', acao: 'Cobrar' });
      }
      const semana = Aulor.lancamentos().filter((l) => l.tipo === 'receber' && Aulor.situacaoLancamento(l) === 'a_vencer' && Aulor.diasEntre(hoje, l.vencimento) <= 7);
      if (semana.length) itens.push({ tom: 'info', titulo: `${semana.length} parcelas vencem nos próximos 7 dias`, detalhe: `${moeda(semana.reduce((s, l) => s + l.valor, 0))} a receber`, href: 'financeiro.html?situacao=a_vencer', acao: 'Ver' });
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
    return `
      <section class="painel">
        <div class="px-5 py-4 border-b border-linha flex items-center justify-between">
          <h2 class="font-display font-semibold text-tinta">Precisa de atenção</h2>
          <span class="text-xs text-tinta-2">${itens.length ? `${itens.length} ${itens.length === 1 ? 'item' : 'itens'}` : ''}</span>
        </div>
        ${itens.length ? `<ul class="divide-y divide-linha">${itens.map((i) => `
          <li>
            <a href="${i.href}" class="flex items-center gap-3 px-5 py-3.5 hover:bg-realce transition group">
              <span class="h-2 w-2 rounded-full shrink-0 ${TOM[i.tom].ponto}"></span>
              <span class="flex-1 min-w-0">
                <span class="block text-sm font-medium text-tinta">${esc(i.titulo)}</span>
                <span class="block text-xs text-tinta-2 truncate">${esc(i.detalhe)}</span>
              </span>
              <span class="text-xs font-semibold text-marca-tinta shrink-0 group-hover:underline">${esc(i.acao)}</span>
            </a>
          </li>`).join('')}</ul>` : vazio('Tudo em dia', 'Nenhuma pendência para hoje.')}
      </section>`;
  }

  function aulasDeHoje() {
    if (!verAcad) return '';
    const aulas = Aulor.aulasDoDia(hoje);
    return `
      <section class="painel">
        <div class="px-5 py-4 border-b border-linha flex items-center justify-between">
          <h2 class="font-display font-semibold text-tinta">Aulas de hoje</h2>
          <a href="aulas.html" class="text-xs font-semibold link">Agenda</a>
        </div>
        ${aulas.length ? `<ul class="divide-y divide-linha">${aulas.map((a) => {
          const t = Aulor.turma(a.turmaId);
          const feita = a.status === 'realizada';
          return `<li><a href="chamada.html?aula=${a.id}" class="flex items-center gap-3 px-5 py-3 hover:bg-realce transition">
            <span class="text-sm font-semibold tabular-nums text-tinta w-12">${a.inicio}</span>
            <span class="flex-1 min-w-0">
              <span class="block text-sm text-tinta truncate">${esc(Aulor.curso(t.cursoId).nome)}</span>
              <span class="block text-xs text-tinta-2 truncate">${esc(t.codigo)} · ${esc(Aulor.professor(t.professorId).nome)} · ${esc(t.local)}</span>
            </span>
            ${feita ? status('ok', 'Chamada feita') : status('neutro', 'A fazer')}
          </a></li>`;
        }).join('')}</ul>` : '<p class="px-5 py-6 text-sm text-tinta-2">Nenhuma aula hoje.</p>'}
      </section>`;
  }

  function matriculasRecentes() {
    if (!pode('matriculas')) return '';
    const lista = [...Aulor.matriculas()].sort((a, b) => b.data.localeCompare(a.data) || b.codigo.localeCompare(a.codigo)).slice(0, 5);
    return `
      <section class="painel">
        <div class="px-5 py-4 border-b border-linha flex items-center justify-between">
          <h2 class="font-display font-semibold text-tinta">Matrículas recentes</h2>
          <a href="matriculas.html" class="text-xs font-semibold link">Todas</a>
        </div>
        <ul class="divide-y divide-linha">${lista.map((m) => {
          const t = Aulor.turma(m.turmaId);
          return `<li><a href="matricula.html?id=${m.id}" class="flex items-center gap-3 px-5 py-3 hover:bg-realce transition">
            ${avatar(Aulor.aluno(m.alunoId).nome)}
            <span class="flex-1 min-w-0">
              <span class="block text-sm text-tinta truncate">${esc(Aulor.aluno(m.alunoId).nome)}</span>
              <span class="block text-xs text-tinta-2 truncate">${esc(Aulor.curso(t.cursoId).nome)} · ${t.codigo}</span>
            </span>
            <span class="text-xs text-tinta-2 shrink-0">${quando(m.data)}</span>
          </a></li>`;
        }).join('')}</ul>
      </section>`;
  }

  const acoes = [
    pode('matriculas', 'criar') ? `<a href="matricula-nova.html" class="btn-pri">${ICONE.mais}Nova matrícula</a>` : '',
    pode('alunos', 'criar') ? '<a href="alunos.html?novo=1" class="btn-sec">Cadastrar aluno</a>' : '',
  ].join('');

  tela.innerHTML = `
    <div class="max-w-6xl mx-auto space-y-5">
      ${cabecalhoPagina({ titulo: `${saudacao()}, ${esc(Shell.nome().split(' ')[0])}`, subtitulo: `${dataLonga(hoje)} · ${esc(Aulor.escola().nome)}`, acoes })}
      ${indicadores()}
      <div class="grid lg:grid-cols-3 gap-5 items-start">
        <div class="lg:col-span-2">${pendencias()}</div>
        <div class="space-y-5">${aulasDeHoje()}${matriculasRecentes()}</div>
      </div>
    </div>`;
})();
