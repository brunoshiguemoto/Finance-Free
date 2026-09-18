// ============================================================================
// FINANCE FREE - BANCO DE DADOS DE BANCOS BRASILEIROS - VERSÃO 37.0
// Arquivo: bancos_brasil.js
// ============================================================================
const BANCOS_BRASIL = [
  { codigo: "000", nome: "Wallet (Dinheiro Físico / Carteira)" },
  { codigo: "001", nome: "Banco do Brasil S.A." },
  { codigo: "033", nome: "Banco Santander (Brasil) S.A." },
  { codigo: "104", nome: "Caixa Econômica Federal" },
  { codigo: "237", nome: "Banco Bradesco S.A." },
  { codigo: "341", nome: "Itaú Unibanco S.A." },
  { codigo: "077", nome: "Banco Inter S.A." },
  { codigo: "260", nome: "Nu Pagamentos S.A. (Nubank)" },
  { codigo: "336", nome: "Banco C6 S.A." },
  { codigo: "212", nome: "Banco Original S.A." },
  { codigo: "422", nome: "Banco Safra S.A." },
  { codigo: "655", nome: "Banco Neon S.A." },
  { codigo: "041", nome: "Banco Banrisul S.A." },
  { codigo: "756", nome: "SICOOB" },
  { codigo: "748", nome: "SICREDI S.A." },
  { codigo: "637", nome: "Banco BTG Pactual S.A." },
  { codigo: "389", nome: "Banco Mercantil do Brasil S.A." },
  { codigo: "070", nome: "BRB - Banco de Brasília S.A." },
  { codigo: "136", nome: "Unicred Cooperativa" },
  { codigo: "999", nome: "Outra Instituição Financeira" }
];

function carregarSelectBancos(selectId) {
  const selectElem = document.getElementById(selectId);
  if (!selectElem) return;
  if (selectElem.options.length <= 1) {
    selectElem.innerHTML = '<option value="">-- Selecione o Banco --</option>';
    BANCOS_BRASIL.forEach(banco => {
      const opt = document.createElement("option");
      opt.value = `${banco.codigo} - ${banco.nome}`;
      opt.textContent = `${banco.codigo} - ${banco.nome}`;
      selectElem.appendChild(opt);
    });
  }
}
