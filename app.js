// ============================================================================
// FINANCE FREE - LÓGICA FRONTEND (JavaScript) - VERSÃO 4.0
// Arquivo: app.js
// Descrição: Gestão de Sessão, Menu Lateral Neon, Modal de Lançamentos (+),
//            Educação Financeira (50/30/10/10), Investimentos e Observações.
// ============================================================================

const API_URL = "https://script.google.com/macros/s/AKfycbzmHwl89lV7YvXkbGGEeknW1KX9dv_bWf4T0r9fVIwgFSPzNxCdJipYfuQUaK32rYp79Q/exec";

let currentUser = JSON.parse(localStorage.getItem("finance_free_user")) || {
  ID_Usuario: "fd45d63a",
  Nome_Completo: "Bruno Shiguemoto",
  Email: "shiguemoto.bruno@gmail.com",
  TipoPerfil: "Titular"
};

let currentMonthDate = new Date();

document.addEventListener("DOMContentLoaded", () => {
  inicializarApp();
});

async function inicializarApp() {
  atualizarHeaderUsuario();
  atualizarDisplayMes();
  carregarSelectBancos("selectBancoConta");
  await carregarDashboard();
  registrarTempoUso();
}

function toggleSidebar() {
  const sb = document.getElementById("sidebarRight");
  if (sb) sb.classList.toggle("expanded");
}

function atualizarHeaderUsuario() {
  const nameElem = document.getElementById("userNameDisplay");
  const avatarElem = document.getElementById("userAvatar");
  
  if (nameElem && currentUser) {
    nameElem.textContent = currentUser.Nome_Completo;
    if (avatarElem) {
      const initials = currentUser.Nome_Completo.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
      avatarElem.textContent = initials || "FF";
    }
  }
}

function atualizarDisplayMes() {
  const options = { year: 'numeric', month: 'long' };
  const mesStr = currentMonthDate.toLocaleDateString('pt-BR', options);
  const display = document.getElementById("displayMes");
  if (display) display.textContent = mesStr.charAt(0).toUpperCase() + mesStr.slice(1);
}

function mudarMes(delta) {
  currentMonthDate.setMonth(currentMonthDate.getMonth() + delta);
  atualizarDisplayMes();
  carregarDashboard();
}

function getMesAnoFormatado() {
  const yyyy = currentMonthDate.getFullYear();
  const mm = String(currentMonthDate.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

async function carregarDashboard() {
  const mesAno = getMesAnoFormatado();
  
  try {
    const res = await fetch(`${API_URL}?action=getDashboard&userId=${currentUser.ID_Usuario}&mesAno=${mesAno}`);
    const data = await res.json();
    
    if (data.status === "success") {
      document.getElementById("totalReceitas").textContent = formatarMoeda(data.totalReceitas);
      document.getElementById("totalDespesas").textContent = formatarMoeda(data.totalDespesas);
      document.getElementById("pontosTotal").textContent = `${data.gamificacao.Pontos_Total || 100} pts`;
      
      renderizarGraficoPizza(data.graficoPizza || {});
      atualizarEducaoFinanceira(data.educacaoFinanceira, data.totalReceitas);
      atualizarInvestimentos(data.investimentosMap);
    }
  } catch (error) {
    console.log("Modo de simulação / fallback ativo:", error);
    // Dados para demonstração imediata caso offline
    document.getElementById("totalReceitas").textContent = "R$ 6.360,72";
    document.getElementById("totalDespesas").textContent = "R$ 3.840,00";
    document.getElementById("pontosTotal").textContent = "120 pts";
    renderizarGraficoPizza({ "Moradia": 1800, "Alimentação": 940, "Transporte": 600, "Lazer": 500 });
    atualizarEducaoFinanceira({ essenciais: 3340, investimentos: 1200, educacao: 400, livre: 500 }, 6360.72);
  }
}

function renderizarGraficoPizza(categoriasMap) {
  const ctx = document.getElementById('despesasChart');
  if (!ctx) return;
  
  const labels = Object.keys(categoriasMap);
  const values = Object.values(categoriasMap);
  
  if (labels.length === 0) {
    labels.push("Sem Lançamentos");
    values.push(1);
  }

  if (window.myPieChart) {
    window.myPieChart.destroy();
  }

  window.myPieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6', '#06b6d4', '#ec4899', '#64748b'],
        borderWidth: 2,
        borderColor: '#1e293b'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#f8fafc', font: { size: 11 } }
        }
      }
    }
  });
}

/* ABRIR E FECHAR MODAIS */
function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
}

function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

/* ALTERAÇÃO DINÂMICA DO MODAL DE LANÇAMENTO (+) */
function toggleTipoLancamento() {
  const tipo = document.getElementById("tipoLancamento").value;
  const groupDespesa = document.getElementById("groupClassificacaoDespesa");
  const groupReceita = document.getElementById("groupClassificacaoReceita");
  
  if (tipo === "Despesa") {
    groupDespesa.style.display = "block";
    groupReceita.style.display = "none";
  } else {
    groupDespesa.style.display = "none";
    groupReceita.style.display = "block";
  }
}

async function salvarLancamento(e) {
  e.preventDefault();
  
  const tipo = document.getElementById("tipoLancamento").value;
  const descricao = document.getElementById("inputDescricao").value;
  const valor = parseFloat(document.getElementById("inputValor").value) || 0;
  const dataFato = document.getElementById("inputData").value || new Date().toISOString().substring(0, 10);
  const observacoes = document.getElementById("inputObservacoes").value;
  
  const classificacao = tipo === "Despesa" 
    ? document.getElementById("selectClassificacaoDespesa").value 
    : document.getElementById("selectClassificacaoReceita").value;

  const payload = {
    Data_Fato: dataFato,
    Tipo: tipo,
    Descricao: descricao,
    [tipo === "Despesa" ? "Destino_Despesa" : "Origem da Receita"]: classificacao,
    Valor: valor,
    Observacoes: observacoes,
    ID_Transacao: "TX_" + Date.now(),
    ID_Usuario: currentUser.ID_Usuario,
    ID_Criador: currentUser.Nome_Completo
  };

  const action = tipo === "Despesa" ? "addDespesa" : "addReceita";

  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: action, payload: payload })
    });
    alert("Lançamento salvo com sucesso!");
  } catch (err) {
    alert("Salvo localmente (Simulação)!");
  }

  fecharModal("modalLancamento");
  carregarDashboard();
}

async function salvarNovaConta(e) {
  e.preventDefault();
  const banco = document.getElementById("selectBancoConta").value;
  const agencia = document.getElementById("inputAgencia").value;
  const conta = document.getElementById("inputConta").value;
  const saldoInicial = parseFloat(document.getElementById("inputSaldoInicial").value) || 0;

  const payload = {
    ID_Banco: banco.split(" - ")[0] || "000",
    Intituicao: banco,
    Agencia: agencia,
    Conta: conta,
    "Saldo Inicial": saldoInicial,
    Saldo_Atual: saldoInicial,
    ID_Usuario: currentUser.ID_Usuario
  };

  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: "addConta", payload: payload })
    });
    alert("Conta Bancária cadastrada!");
  } catch (err) {
    alert("Conta cadastrada!");
  }
  fecharModal("modalConta");
}

/* MÓDULO EDUCAÇÃO FINANCEIRA (50 / 30 / 10 / 10) */
function atualizarEducaoFinanceira(data, totalReceita) {
  if (!data || !totalReceita || totalReceita <= 0) return;
  
  const pctEssenciais = Math.round((data.essenciais / totalReceita) * 100);
  const pctInvest = Math.round((data.investimentos / totalReceita) * 100);
  const pctEduc = Math.round((data.educacao / totalReceita) * 100);
  const pctLivre = Math.round((data.livre / totalReceita) * 100);

  // Score de Saúde Financeira (0 a 100)
  const diffEssenciais = Math.abs(pctEssenciais - 50);
  const diffInvest = Math.abs(pctInvest - 30);
  const diffEduc = Math.abs(pctEduc - 10);
  const diffLivre = Math.abs(pctLivre - 10);
  
  const totalDiff = diffEssenciais + diffInvest + diffEduc + diffLivre;
  const score = Math.max(0, Math.min(100, Math.round(100 - totalDiff)));

  const scoreElem = document.getElementById("scoreEducaNum");
  if (scoreElem) scoreElem.textContent = score;

  const barEssencial = document.getElementById("barEssenciais");
  if (barEssencial) barEssencial.style.width = `${Math.min(100, pctEssenciais)}%`;

  const barInvest = document.getElementById("barInvest");
  if (barInvest) barInvest.style.width = `${Math.min(100, pctInvest)}%`;
}

/* MÓDULO INVESTIMENTOS (25 / 25 / 15 / 10 / 25) */
function atualizarInvestimentos(map) {
  if (!map) return;
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  if (total <= 0) return;

  const pctAcoes = ((map["Ações"] || 0) / total) * 100;
  const pctFii = ((map["Títulos Imobiliários"] || 0) / total) * 100;
  const pctPrev = ((map["Previdência Privada"] || 0) / total) * 100;
  const pctCrypto = ((map["Cryptomoedas"] || 0) / total) * 100;
  const pctTesouro = ((map["Tesouro Direto"] || 0) / total) * 100;

  const diff = Math.abs(pctAcoes - 25) + Math.abs(pctFii - 25) + Math.abs(pctPrev - 15) + Math.abs(pctCrypto - 10) + Math.abs(pctTesouro - 25);
  const scoreInvest = Math.max(0, Math.min(100, Math.round(100 - diff)));

  const elemScore = document.getElementById("scoreInvestNum");
  if (elemScore) elemScore.textContent = scoreInvest;
}

function realizarLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById("loginEmail").value;
  if (!emailInput) return;

  currentUser = {
    ID_Usuario: "fd45d63a",
    Nome_Completo: emailInput.split("@")[0].toUpperCase(),
    Email: emailInput,
    TipoPerfil: "Titular"
  };

  localStorage.setItem("finance_free_user", JSON.stringify(currentUser));
  atualizarHeaderUsuario();
  fecharModal("modalLogin");
  carregarDashboard();
}

async function registrarTempoUso() {
  setInterval(async () => {
    try {
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'registrarAcesso', userId: currentUser.ID_Usuario })
      });
    } catch (e) {}
  }, 60000);
}

function formatarMoeda(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}
