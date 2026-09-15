// ============================================================================
// FINANCE FREE - LÓGICA DO FRONTEND (JavaScript)
// Arquivo: app.js
// Descrição: Gerenciamento de Estado, Modais Interativos, API e Fallback Local
// ============================================================================

const API_URL = "https://script.google.com/macros/s/AKfycbzmHwl89lV7YvXkbGGEeknW1KX9dv_bWf4T0r9fVIwgFSPzNxCdJipYfuQUaK32rYp79Q/exec"; // Inserir Web App URL
const CURRENT_USER_ID = "fd45d63a";

let currentMonthDate = new Date();
let currentTipoLancamento = "DESPESA";

// Base de Dados em Memória (Fallback / Simulação Local)
let localLancamentos = [
  { id: "TX_1", tipo: "RECEITA", descricao: "Salário Prefeitura", categoria: "Salário", valor: 6360.72, data: "2026-09-05" },
  { id: "TX_2", tipo: "DESPESA", descricao: "Aluguel", categoria: "Moradia", valor: 1800.00, data: "2026-09-10" },
  { id: "TX_3", tipo: "DESPESA", descricao: "Supermercado", categoria: "Alimentação", valor: 940.00, data: "2026-09-12" },
  { id: "TX_4", tipo: "DESPESA", descricao: "Gasolina", categoria: "Transporte", valor: 600.00, data: "2026-09-14" },
  { id: "TX_5", tipo: "DESPESA", descricao: "Cinema e Rest.", categoria: "Lazer", valor: 500.00, data: "2026-09-14" }
];

let localContas = [];
let localCartoes = [];
let pontosGamificacao = 100;

document.addEventListener("DOMContentLoaded", () => {
  inicializarApp();
});

async function inicializarApp() {
  atualizarDisplayMes();
  carregarSelectBancos("selectBanco");
  document.getElementById("inputDataFato").value = new Date().toISOString().split('T')[0];
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
  
  if (API_URL && !API_URL.includes("SUA_URL")) {
    try {
      const res = await fetch(`${API_URL}?action=getDashboard&userId=${CURRENT_USER_ID}&mesAno=${mesAno}`);
      const data = await res.json();
      
      if (data.status === "success") {
        document.getElementById("totalReceitas").textContent = formatarMoeda(data.totalReceitas);
        document.getElementById("totalDespesas").textContent = formatarMoeda(data.totalDespesas);
        document.getElementById("saldoMesText").textContent = `Saldo: ${formatarMoeda(data.saldoMes)}`;
        document.getElementById("pontosTotal").textContent = `${data.gamificacao.Pontos_Total} pts`;
        
        renderizarGraficoPizza(data.graficoPizza);
        return;
      }
    } catch (error) {
      console.log("Erro API. Utilizando dados locais:", error);
    }
  }

  // FALLBACK LOCAL: Filtra array local pelo mês atual
  const lancamentosDoMes = localLancamentos.filter(l => l.data.startsWith(mesAno));
  
  let totReceitas = 0;
  let totDespesas = 0;
  const categoriasMap = {};

  lancamentosDoMes.forEach(item => {
    if (item.tipo === "RECEITA") {
      totReceitas += item.valor;
    } else {
      totDespesas += item.valor;
      categoriasMap[item.categoria] = (categoriasMap[item.categoria] || 0) + item.valor;
    }
  });

  document.getElementById("totalReceitas").textContent = formatarMoeda(totReceitas);
  document.getElementById("totalDespesas").textContent = formatarMoeda(totDespesas);
  document.getElementById("saldoMesText").textContent = `Saldo: ${formatarMoeda(totReceitas - totDespesas)}`;
  document.getElementById("pontosTotal").textContent = `${pontosGamificacao} pts`;

  renderizarGraficoPizza(categoriasMap);
  renderizarListaLancamentos(lancamentosDoMes);
}

function renderizarListaLancamentos(lista) {
  const container = document.getElementById("listaLancamentos");
  if (!container) return;
  
  if (lista.length === 0) {
    container.innerHTML = `<p style="color: #64748b; font-size: 0.85rem; text-align: center; padding: 12px;">Nenhum lançamento neste mês.</p>`;
    return;
  }

  container.innerHTML = lista.map(item => `
    <div class="tx-item">
      <div class="tx-info">
        <span class="tx-title">${item.descricao}</span>
        <span class="tx-sub">${item.categoria} • ${formatarData(item.data)}</span>
      </div>
      <span class="tx-val ${item.tipo === 'RECEITA' ? 'value-receita' : 'value-despesa'}">
        ${item.tipo === 'RECEITA' ? '+' : '-'} ${formatarMoeda(item.valor)}
      </span>
    </div>
  `).join("");
}

function renderizarGraficoPizza(categoriasMap) {
  const ctx = document.getElementById('despesasChart');
  if (!ctx) return;
  
  const labels = Object.keys(categoriasMap);
  const values = Object.values(categoriasMap);
  
  if (labels.length === 0) {
    labels.push("Sem Gastos");
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
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6', '#ec4899', '#64748b'],
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

/* ============================================================================
   LÓGICA DOS MODAIS E FORMULÁRIOS
   ============================================================================ */

function abrirModalLancamento() {
  setTipoLancamento("DESPESA");
  document.getElementById("modalLancamento").classList.remove("hidden");
}

function fecharModalLancamento() {
  document.getElementById("modalLancamento").classList.add("hidden");
}

function setTipoLancamento(tipo) {
  currentTipoLancamento = tipo;
  const btnDespesa = document.getElementById("btnTipoDespesa");
  const btnReceita = document.getElementById("btnTipoReceita");
  const labelCat = document.getElementById("labelCategoria");
  const selectCat = document.getElementById("selectCategoria");

  if (tipo === "DESPESA") {
    btnDespesa.className = "toggle-btn active-despesa";
    btnReceita.className = "toggle-btn";
    labelCat.textContent = "Destino da Despesa";
    selectCat.innerHTML = `
      <option value="Alimentação">Alimentação / Mercado</option>
      <option value="Moradia">Moradia / Aluguel / Contas</option>
      <option value="Transporte">Transporte / Combustível</option>
      <option value="Lazer">Lazer / Restas / Passeios</option>
      <option value="Saúde">Saúde / Farmácia</option>
      <option value="Educação">Educação / Cursos</option>
      <option value="Outros">Outros Gastos</option>
    `;
  } else {
    btnReceita.className = "toggle-btn active-receita";
    btnDespesa.className = "toggle-btn";
    labelCat.textContent = "Origem da Receita";
    selectCat.innerHTML = `
      <option value="Salário">Salário / Prolabore</option>
      <option value="Rendimentos">Rendimentos / Investimentos</option>
      <option value="Venda">Venda de Item</option>
      <option value="Presente">Presente / Bônus</option>
      <option value="Extra">Renda Extra</option>
      <option value="Outros">Outras Entradas</option>
    `;
  }
}

async function salvarLancamento(event) {
  event.preventDefault();

  const descricao = document.getElementById("inputDescricao").value;
  const valor = parseFloat(document.getElementById("inputValor").value);
  const categoria = document.getElementById("selectCategoria").value;
  const dataFato = document.getElementById("inputDataFato").value;

  if (!descricao || !valor || !dataFato) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  const novoLancamento = {
    id: "TX_" + Date.now(),
    tipo: currentTipoLancamento,
    descricao: descricao,
    categoria: categoria,
    valor: valor,
    data: dataFato
  };

  // Enviar para API se configurada
  if (API_URL && !API_URL.includes("SUA_URL")) {
    try {
      const payload = {
        Data_Fato: dataFato,
        Tipo: currentTipoLancamento,
        Descricao: descricao,
        Valor: valor,
        ID_Transacao: novoLancamento.id,
        ID_Usuario: CURRENT_USER_ID
      };
      if (currentTipoLancamento === "RECEITA") payload["Origem da Receita"] = categoria;
      else payload["Destino_Despesa"] = categoria;

      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: currentTipoLancamento === "RECEITA" ? "addReceita" : "addDespesa",
          payload: payload
        })
      });
    } catch (e) {
      console.log("Erro ao enviar para API Apps Script:", e);
    }
  }

  // Atualizar Estado Local Instantaneamente
  localLancamentos.unshift(novoLancamento);
  pontosGamificacao += 10; // Ganha 10 pontos por lançamento

  fecharModalLancamento();
  document.getElementById("formLancamento").reset();
  
  await carregarDashboard();
  alert(`✨ ${currentTipoLancamento === 'RECEITA' ? 'Receita' : 'Despesa'} lançada com sucesso! +10 pts acumulados.`);
}

/* MODAL CONTAS */
function abrirModalContas() {
  document.getElementById("modalContas").classList.remove("hidden");
}
function fecharModalContas() {
  document.getElementById("modalContas").classList.add("hidden");
}
function salvarConta(event) {
  event.preventDefault();
  const banco = document.getElementById("selectBanco").value;
  const ag = document.getElementById("inputAgencia").value;
  const conta = document.getElementById("inputConta").value;
  const saldo = document.getElementById("inputSaldoInicial").value;

  localContas.push({ banco, ag, conta, saldo });
  renderizarContas();
  document.getElementById("formConta").reset();
  alert("Conta bancária cadastrada!");
}
function renderizarContas() {
  const container = document.getElementById("listaContas");
  if (!container) return;
  container.innerHTML = localContas.map(c => `
    <div class="tx-item">
      <div><strong>${c.banco}</strong><br><small style="color:#94a3b8">Ag: ${c.ag} | Cc: ${c.conta}</small></div>
      <span class="value-receita">R$ ${parseFloat(c.saldo).toFixed(2)}</span>
    </div>
  `).join("");
}

/* MODAL CARTÕES */
function abrirModalCartoes() {
  document.getElementById("modalCartoes").classList.remove("hidden");
}
function fecharModalCartoes() {
  document.getElementById("modalCartoes").classList.add("hidden");
}
function salvarCartao(event) {
  event.preventDefault();
  const nome = document.getElementById("inputNomeCartao").value;
  const limite = document.getElementById("inputLimiteTotal").value;
  const fechamento = document.getElementById("inputFechamento").value;
  const vencimento = document.getElementById("inputVencimento").value;

  localCartoes.push({ nome, limite, fechamento, vencimento });
  renderizarCartoes();
  document.getElementById("formCartao").reset();
  alert("Cartão cadastrado!");
}
function renderizarCartoes() {
  const container = document.getElementById("listaCartoes");
  if (!container) return;
  container.innerHTML = localCartoes.map(c => `
    <div class="tx-item">
      <div><strong>💳 ${c.nome}</strong><br><small style="color:#94a3b8">Fecha dia ${c.fechamento} | Vence dia ${c.vencimento}</small></div>
      <span style="color:#38bdf8">R$ ${parseFloat(c.limite).toFixed(2)}</span>
    </div>
  `).join("");
}

/* MODAL MEDALHAS */
function abrirModalMedalhas() {
  document.getElementById("modalPontos").textContent = `${pontosGamificacao} pts`;
  document.getElementById("modalMedalhas").classList.remove("hidden");
}
function fecharModalMedalhas() {
  document.getElementById("modalMedalhas").classList.add("hidden");
}

function registrarTempoUso() {
  setInterval(() => {
    pontosGamificacao += 5;
    document.getElementById("pontosTotal").textContent = `${pontosGamificacao} pts`;
  }, 60000);
}

function formatarMoeda(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function formatarData(dataStr) {
  if (!dataStr) return "";
  const partes = dataStr.split("-");
  if (partes.length === 3) return `${partes[2]}/${partes[1]}`;
  return dataStr;
}
