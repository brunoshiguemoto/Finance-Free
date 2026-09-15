// ============================================================================
// FINANCE FREE - LÓGICA DO FRONTEND (JavaScript)
// Arquivo: app.js.txt
// Descrição: Gerenciamento de estado, chamadas de API, Gráfico e Gamificação
// ============================================================================

const API_URL = "https://script.google.com/macros/s/AKfycbzmHwl89lV7YvXkbGGEeknW1KX9dv_bWf4T0r9fVIwgFSPzNxCdJipYfuQUaK32rYp79Q/exec"; // Inserir Web App URL
const CURRENT_USER_ID = "fd45d63a"; // ID do usuário titular (ou convidado)

let currentMonthDate = new Date();

document.addEventListener("DOMContentLoaded", () => {
  inicializarApp();
});

async function inicializarApp() {
  atualizarDisplayMes();
  carregarSelectBancos("selectBanco");
  await carregarDashboard();
  registrarTempoUso();
}

function atualizarDisplayMes() {
  const options = { year: 'numeric', month: 'long' };
  const mesStr = currentMonthDate.toLocaleDateString('pt-BR', options);
  document.getElementById("displayMes").textContent = mesStr.charAt(0).toUpperCase() + mesStr.slice(1);
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
    const res = await fetch(`${API_URL}?action=getDashboard&userId=${CURRENT_USER_ID}&mesAno=${mesAno}`);
    const data = await res.json();
    
    if (data.status === "success") {
      document.getElementById("totalReceitas").textContent = formatarMoeda(data.totalReceitas);
      document.getElementById("totalDespesas").textContent = formatarMoeda(data.totalDespesas);
      document.getElementById("pontosTotal").textContent = `${data.gamificacao.Pontos_Total} pts`;
      
      renderizarGraficoPizza(data.graficoPizza);
    }
  } catch (error) {
    console.log("Modo offline / Simulação ativada:", error);
    // Dados de fallback para demonstração
    document.getElementById("totalReceitas").textContent = "R$ 6.360,72";
    document.getElementById("totalDespesas").textContent = "R$ 3.840,00";
    document.getElementById("pontosTotal").textContent = "120 pts";
    renderizarGraficoPizza({ "Moradia": 1800, "Alimentação": 940, "Transporte": 600, "Lazer": 500 });
  }
}

function renderizarGraficoPizza(categoriasMap) {
  const ctx = document.getElementById('despesasChart');
  if (!ctx) return;
  
  const labels = Object.keys(categoriasMap);
  const values = Object.values(categoriasMap);
  
  if (window.myPieChart) {
    window.myPieChart.destroy();
  }

  window.myPieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6', '#ec4899'],
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
          labels: { color: '#f8fafc', font: { size: 12 } }
        }
      }
    }
  });
}

async function registrarTempoUso() {
  // A cada 1 minuto de aplicativo aberto, registra presença para subir pontos
  setInterval(async () => {
    try {
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'registrarAcesso', userId: CURRENT_USER_ID })
      });
    } catch (e) {
      console.log("Registrado acesso local");
    }
  }, 60000);
}

function formatarMoeda(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}
