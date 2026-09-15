// ============================================================================
// FINANCE FREE - BANCO DE DADOS DE BANCOS BRASILEIROS
// Arquivo: bancos_brasil.js.txt
// Descrição: Lista com os principais bancos do Brasil e códigos COMPE
// ============================================================================

const BANCOS_BRASIL = [
  { codigo: "001", nome: "Banco do Brasil S.A." },
  { codigo: "237", nome: "Banco Bradesco S.A." },
  { codigo: "341", nome: "Itaú Unibanco S.A." },
  { codigo: "104", nome: "Caixa Econômica Federal" },
  { codigo: "033", nome: "Banco Santander (Brasil) S.A." },
  { codigo: "260", nome: "Nu Pagamentos S.A. (Nubank)" },
  { codigo: "077", nome: "Banco Inter S.A." },
  { codigo: "336", nome: "C6 Bank S.A." },
  { codigo: "212", nome: "Banco Original S.A." },
  { codigo: "655", nome: "Banco Votorantim S.A. (neon)" },
  { codigo: "422", nome: "Banco Safra S.A." },
  { codigo: "756", nome: "Sicoob (Banco Cooperativo do Brasil)" },
  { codigo: "748", nome: "Sicredi (Banco Cooperativo Sicredi S.A.)" },
  { codigo: "637", nome: "Banco BTG Pactual S.A." },
  { codigo: "029", nome: "Banco Itaú Consignado S.A." },
  { codigo: "654", nome: "Banco Digio S.A." },
  { codigo: "380", nome: "PicPay Serviços S.A." },
  { codigo: "290", nome: "PagBank (PagSeguro Internet S.A.)" },
  { codigo: "323", nome: "Mercado Pago Serviços Financeiros" }
];

// Função helper para popular o elemento <select> no formulário de contas
function carregarSelectBancos(selectElementId) {
  const select = document.getElementById(selectElementId);
  if (!select) return;
  
  select.innerHTML = '<option value="">Selecione o Banco...</option>';
  BANCOS_BRASIL.forEach(banco => {
    const opt = document.createElement("option");
    opt.value = banco.codigo;
    opt.textContent = `[${banco.codigo}] ${banco.nome}`;
    select.appendChild(opt);
  });
}
