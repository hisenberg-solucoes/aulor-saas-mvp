// ============================================================
// Cobranças (grupo Financeiro): quem está com parcela vencida, quanto e
// há quantos dias, com o lembrete pronto para enviar. Sem envio
// automático nesta versão: a régua de cobrança fica para a integração
// com o provedor de pagamento.
// ============================================================

(function () {
  if (!Shell.permitido) return;
  const tela = document.getElementById('tela');
  const hoje = Aulor.hoje();

  function lembrete(item) {
    const a = item.aluno;
    const destinatario = Aulor.contatoCobranca(a);
    const cursos = [...new Set(item.parcelas.map((l) => Aulor.curso(Aulor.turma(Aulor.matricula(l.matriculaId).turmaId).cursoId).nome))].join(' e ');
    const texto = `Olá, ${destinatario.nome.split(' ')[0]}! Aqui é da ${Aulor.escola().nome}. Consta em aberto ${item.parcelas.length === 1 ? 'a parcela' : `${item.parcelas.length} parcelas`} do curso ${cursos}${destinatario !== a ? ` de ${a.nome.split(' ')[0]}` : ''}, com vencimento em ${item.parcelas.map((l) => dataBr(l.vencimento)).join(', ')}, no total de ${moeda(item.total)}. Se já pagou, por favor desconsidere. Quer que a gente envie a segunda via?`;
    return { texto, telefone: destinatario.telefone };
  }

  function render() {
    const lista = Aulor.inadimplentes();
    const total = lista.reduce((s, i) => s + i.total, 0);
    const vencidoAteHoje = Aulor.lancamentos().filter((l) => l.tipo === 'receber' && l.status !== 'cancelado' && l.vencimento < hoje).reduce((s, l) => s + l.valor, 0);
    const taxa = vencidoAteHoje ? ((total / vencidoAteHoje) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '0';
    tela.innerHTML = `
      <div class="max-w-6xl mx-auto">
        ${cabecalhoPagina({ titulo: 'Cobranças', subtitulo: 'Alunos com parcela vencida e não paga, do maior atraso para o menor, com a mensagem de cobrança pronta.' })}
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          ${cartaoNumero({ rotulo: 'Em atraso', valor: moeda(total), ajuda: 'parcelas vencidas em aberto', cor: total ? 'bg-red-500' : '' })}
          ${cartaoNumero({ rotulo: 'Alunos', valor: lista.length, ajuda: 'com ao menos uma parcela vencida' })}
          ${cartaoNumero({ rotulo: 'Inadimplência', valor: `${taxa}%`, ajuda: 'vencido em aberto ÷ tudo o que já venceu' })}
        </div>
        <div class="painel overflow-hidden">
          ${lista.length ? `<div class="overflow-x-auto"><table class="tabela">
            <thead><tr><th>Aluno</th><th>Contato</th><th class="num">Parcelas</th><th class="num">Maior atraso</th><th class="num">Total vencido</th><th></th></tr></thead>
            <tbody>${lista.map((i, k) => {
              const l = lembrete(i);
              return `<tr>
                <td><a class="font-medium text-slate-900 dark:text-neutral-100 hover:underline" href="aluno.html?id=${i.aluno.id}">${esc(i.aluno.nome)}</a>${Aulor.contatoCobranca(i.aluno) !== i.aluno ? `<p class="text-xs text-slate-500 dark:text-neutral-400">Quem paga: ${esc(Aulor.contatoCobranca(i.aluno).nome)}</p>` : ''}</td>
                <td class="whitespace-nowrap tabular-nums">${telefoneFmt(l.telefone)}</td>
                <td class="num">${i.parcelas.length}</td>
                <td class="num">${i.maiorAtraso} dias</td>
                <td class="num font-medium text-red-700 dark:text-red-400">${moeda(i.total)}</td>
                <td class="text-right whitespace-nowrap space-x-1">
                  <button type="button" data-copiar="${k}" class="btn-sec btn-pequeno">${ICONE.copiar}Copiar lembrete</button>
                  <a class="btn-sec btn-pequeno" target="_blank" rel="noopener" href="https://wa.me/55${l.telefone}?text=${encodeURIComponent(l.texto)}">WhatsApp</a>
                </td>
              </tr>`;
            }).join('')}</tbody>
          </table></div>` : vazio('Ninguém em atraso', 'Todas as parcelas vencidas foram recebidas.')}
        </div>
        <p class="text-xs text-slate-500 dark:text-neutral-400 mt-3">O lembrete é um texto pronto para enviar pelo WhatsApp ou e-mail da escola. Para registrar o pagamento, abra o aluno ou <a class="link" href="financeiro.html?situacao=vencido">as parcelas vencidas</a>. Envio automático e régua de cobrança ficam para a integração com o provedor de pagamento.</p>
      </div>`;
    tela.querySelectorAll('[data-copiar]').forEach((b) => b.addEventListener('click', () => copiarTexto(lembrete(lista[Number(b.dataset.copiar)]).texto, 'Lembrete copiado')));
  }

  render();
})();
