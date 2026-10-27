// Documento — máscara e validação compartilhadas de CPF e CNPJ (inclusive o CNPJ alfanumérico).
// Carregar ANTES de js/ui-form.js e dos motores (clientes, instrutores, colaboradores, spc). Não depende de nada.
//
// CPF: 11 dígitos numéricos, DV clássico (módulo 11).
// CNPJ alfanumérico (Nota Técnica COCAD/SUARA/RFB 49/2024, emissão a partir de jul/2026): 12 posições
// alfanuméricas (raiz 8 + ordem 4, letras A–Z maiúsculas) + 2 dígitos verificadores numéricos. No cálculo do
// DV cada caractere vale (código ASCII − 48): '0'–'9' → 0–9, 'A' → 17 … 'Z' → 42; pesos e módulo 11 iguais
// ao CNPJ numérico, então os CNPJs atuais continuam válidos. Exemplo válido: 12.ABC.345/01DE-35.
//
// Uso nos formulários: basta `<input data-mascara="cpf|cnpj|documento">` — a máscara é delegada no `document`
// (listener único de `input`), então funciona em drawers/modais renderizados depois, sem ligar nada.
// `documento` decide o tipo pelo conteúdo (letra ou mais de 11 caracteres → CNPJ).
const Documento = (() => {
  // Só A–Z/0–9, em maiúsculas (letras só fazem sentido no CNPJ; no CPF são descartadas pela máscara).
  const limpar = (v) => String(v ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  const digitos = (v) => String(v ?? '').replace(/\D/g, '');
  // Decide o tipo pelo conteúdo: letra ou mais de 11 caracteres → CNPJ; senão CPF.
  const tipoDe = (v) => { const c = limpar(v); return /[A-Z]/.test(c) || c.length > 11 ? 'cnpj' : 'cpf'; };

  function mascararCpf(v) {
    const c = digitos(v).slice(0, 11);
    return c.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
  }
  function mascararCnpj(v) {
    // 12 alfanuméricos + 2 dígitos.
    const c = limpar(v);
    const corpo = c.slice(0, 12); const dv = c.slice(12, 14).replace(/[^0-9]/g, '');
    let out = corpo.slice(0, 2);
    if (corpo.length > 2) out += `.${corpo.slice(2, 5)}`;
    if (corpo.length > 5) out += `.${corpo.slice(5, 8)}`;
    if (corpo.length > 8) out += `/${corpo.slice(8, 12)}`;
    if (dv) out += `-${dv}`;
    return out;
  }
  const mascarar = (v) => (tipoDe(v) === 'cpf' ? mascararCpf(v) : mascararCnpj(v));

  const valorChar = (ch) => ch.charCodeAt(0) - 48;
  function cpfValido(v) {
    const d = digitos(v);
    if (!/^\d{11}$/.test(d) || /^(\d)\1+$/.test(d)) return false;
    const calc = (n) => { let s = 0; for (let i = 0; i < n; i += 1) s += Number(d[i]) * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
    return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
  }
  function cnpjValido(v) {
    const d = limpar(v);
    if (!/^[0-9A-Z]{12}\d{2}$/.test(d) || /^(.)\1+$/.test(d)) return false;
    const calc = (n) => { const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; let s = 0; for (let i = 0; i < n; i += 1) s += valorChar(d[i]) * pesos[i]; const r = s % 11; return r < 2 ? 0 : 11 - r; };
    return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
  }
  const valido = (v) => (tipoDe(v) === 'cpf' ? cpfValido(v) : cnpjValido(v));

  // Mensagens prontas para formulários; '' quando ok ou vazio (campo opcional valida só se preenchido).
  function erroCpf(v) {
    const c = digitos(v);
    if (!c) return '';
    if (c.length < 11) return 'CPF incompleto (11 dígitos).';
    return cpfValido(c) ? '' : 'CPF inválido (dígitos verificadores não conferem).';
  }
  function erroCnpj(v) {
    const c = limpar(v);
    if (!c) return '';
    if (c.length < 14) return 'CNPJ incompleto (14 caracteres).';
    return cnpjValido(c) ? '' : 'CNPJ inválido (dígitos verificadores não conferem).';
  }
  const erro = (v) => (tipoDe(v) === 'cpf' ? erroCpf(v) : erroCnpj(v));

  // Formatação para exibição: devolve mascarado quando completo; senão o valor como veio.
  const fmtCpf = (v) => (digitos(v).length === 11 ? mascararCpf(v) : v || '');
  const fmtCnpj = (v) => (limpar(v).length === 14 ? mascararCnpj(v) : v || '');

  // ---------- Máscara nos inputs ----------
  const TIPOS = { cpf: mascararCpf, cnpj: mascararCnpj, documento: mascarar };
  function aplicar(input) {
    const fn = TIPOS[input.dataset.mascara];
    if (!fn) return;
    const novo = fn(input.value);
    if (novo !== input.value) input.value = novo;
  }
  // Atributos de teclado/limite coerentes com o tipo (só se a tela não definiu).
  function preparar(input) {
    const tipo = input.dataset.mascara;
    if (!TIPOS[tipo] || input.dataset.mascaraLigada) return;
    input.dataset.mascaraLigada = '1';
    if (tipo === 'cpf') { if (!input.hasAttribute('inputmode')) input.setAttribute('inputmode', 'numeric'); if (!input.maxLength || input.maxLength < 0) input.setAttribute('maxlength', '14'); }
    else { if (input.getAttribute('inputmode') === 'numeric') input.removeAttribute('inputmode'); input.setAttribute('autocapitalize', 'characters'); if (!input.maxLength || input.maxLength < 0 || input.maxLength < 18) input.setAttribute('maxlength', '18'); }
    if (input.value) aplicar(input);
  }
  // Delegado: um listener só para toda a página, inclusive inputs criados depois.
  if (typeof document !== 'undefined') {
    document.addEventListener('input', (ev) => {
      const input = ev.target;
      if (!input || input.tagName !== 'INPUT' || !TIPOS[input.dataset.mascara]) return;
      preparar(input); aplicar(input);
    }, true);
    document.addEventListener('focusin', (ev) => { const i = ev.target; if (i && i.tagName === 'INPUT' && TIPOS[i.dataset.mascara]) preparar(i); }, true);
  }
  // Compatibilidade: ligar explicitamente (formata o valor inicial e ajusta atributos).
  function ligar(input) { if (!input) return; if (!input.dataset.mascara) input.dataset.mascara = 'documento'; preparar(input); aplicar(input); }
  function ativarMascaras(raiz) { (raiz ?? document).querySelectorAll('input[data-mascara]').forEach(ligar); }

  return { limpar, digitos, tipoDe, mascarar, mascararCpf, mascararCnpj, cpfValido, cnpjValido, valido, erro, erroCpf, erroCnpj, fmtCpf, fmtCnpj, ligar, ativarMascaras };
})();
