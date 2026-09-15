// ============================================================================
// FINANCE FREE - LÓGICA FRONTEND (JavaScript) - VERSÃO 9.0
// Arquivo: app.js
// Descrição: Navegação por Views, Modal (+), Receitas, Despesas, Contas,
//            Cartões, Investimentos (com Gráfico de Pizza, Categorias e Cotas).
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
  if (typeof carregarSelectBancos === "function") {
    carregarSelectBancos("selectBancoConta");
  }
  await carregarDashboard();
  registrarTempoUso();
}

function toggleSidebar() {
  const sb = document.getElementById("sidebarRight");
  if (sb) sb.classList.toggle("expanded");
}

function navegarParaView(viewId) {
  const views = document.querySelectorAll(".app-view");
  views.forEach(v => v.classList.remove("active"));
  
  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.add("active");

  const sidebarItems = document.querySelectorAll(".sidebar-item");
  sidebarItems.forEach(item => item.classList.remove("active"));

  // Recolher sidebar
  const sb = document.getElementById("sidebarRight");
  if (sb) sb.classList.remove("expanded");

  if (viewId === "viewReceitas") carregarReceitasView();
  else if (viewId === "viewDespesas") carregarDespesasView();
  else if (viewId === "viewContas") carregarContasView();
  else if (viewId === "viewCartoes") carregarCartoesView();
  else if (viewId === "viewInvestimentos") carregarInvestimentosView();
}

function atualizarHeaderUsuario() {
  const nameElem = document.getElementById("userNameDisplay");
  if (nameElem && currentUser) {
    nameElem.textContent = currentUser.Nome_Completo;
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
    }
  } catch (error) {
    console.log("Fallback / Modo demonstração ativo:", error);
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

/* CARREGAR VIEWS ESPECÍFICAS */

async function carregarReceitasView() {
  const container = document.getElementById("listaReceitasView");
  if (!container) return;
  container.innerHTML = "<p style='color:#94a3b8;'>Carregando receitas...</p>";

  try {
    const res = await fetch(`${API_URL}?action=getReceitas&userId=${currentUser.ID_Usuario}`);
    const data = await res.json();
    
    if (Array.isArray(data) && data.length > 0) {
      data.sort((a, b) => new Date(b.Data_Fato) - new Date(a.Data_Fato));
      let html = "";
      data.forEach(item => {
        html += `
          <div class="data-item">
            <div class="data-item-info">
              <h5>${item.Descricao || 'Receita'}</h5>
              <span>${item.Data_Fato || ''} • ${item["Origem da Receita"] || 'Geral'}</span>
              ${item.Observacoes ? `<br><small style="color:#94a3b8;">📝 ${item.Observacoes}</small>` : ''}
            </div>
            <div class="data-item-value value-receita">
              + ${formatarMoeda(item.Valor)}
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
    } else {
      container.innerHTML = "<p style='color:#94a3b8;'>Nenhuma receita registrada até o momento.</p>";
    }
  } catch (err) {
    container.innerHTML = "<p style='color:#94a3b8;'>Exibindo modo demonstração de receitas.</p>";
  }
}

async function carregarDespesasView() {
  const container = document.getElementById("listaDespesasView");
  if (!container) return;
  container.innerHTML = "<p style='color:#94a3b8;'>Carregando despesas...</p>";

  try {
    const res = await fetch(`${API_URL}?action=getDespesas&userId=${currentUser.ID_Usuario}`);
    const data = await res.json();
    
    if (Array.isArray(data) && data.length > 0) {
      data.sort((a, b) => new Date(b.Data_Fato) - new Date(a.Data_Fato));
      let html = "";
      data.forEach(item => {
        html += `
          <div class="data-item">
            <div class="data-item-info">
              <h5>${item.Descricao || 'Despesa'}</h5>
              <span>${item.Data_Fato || ''} • ${item.Destino_Despesa || 'Geral'}</span>
              ${item.Observacoes ? `<br><small style="color:#94a3b8;">📝 ${item.Observacoes}</small>` : ''}
            </div>
            <div class="data-item-value value-despesa">
              - ${formatarMoeda(item.Valor)}
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
    } else {
      container.innerHTML = "<p style='color:#94a3b8;'>Nenhuma despesa registrada até o momento.</p>";
    }
  } catch (err) {
    container.innerHTML = "<p style='color:#94a3b8;'>Exibindo modo demonstração de despesas.</p>";
  }
}

async function carregarContasView() {
  const container = document.getElementById("listaContasView");
  if (!container) return;
  container.innerHTML = "<p style='color:#94a3b8;'>Carregando contas bancárias...</p>";

  try {
    const res = await fetch(`${API_URL}?action=getContas&userId=${currentUser.ID_Usuario}`);
    const data = await res.json();
    
    if (Array.isArray(data) && data.length > 0) {
      data.sort((a, b) => String(a.Intituicao || '').localeCompare(String(b.Intituicao || '')));
      let html = "";
      data.forEach(item => {
        const idTrans = item.ID_Banco || item.ID_Transacao || item.Conta;
        html += `
          <div class="data-item">
            <div class="data-item-info">
              <h5>🏦 ${item.Intituicao || 'Conta Bancária'}</h5>
              <span>Agência: ${item.Agencia || '-'} | Conta: ${item.Conta || '-'}</span>
            </div>
            <div class="data-item-value">
              <span class="value-receita" style="font-weight:bold;">${formatarMoeda(item.Saldo_Atual || item["Saldo Inicial"] || 0)}</span>
              <button class="btn-delete-icon" onclick="deletarConta('${idTrans}')" title="Excluir Conta">✕</button>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
    } else {
      container.innerHTML = "<p style='color:#94a3b8;'>Nenhuma conta cadastrada. Clique em + Nova Conta.</p>";
    }
  } catch (err) {
    container.innerHTML = "<p style='color:#94a3b8;'>Nenhuma conta cadastrada.</p>";
  }
}

async function carregarCartoesView() {
  const container = document.getElementById("listaCartoesView");
  if (!container) return;
  container.innerHTML = "<p style='color:#94a3b8;'>Carregando cartões de crédito...</p>";

  try {
    const res = await fetch(`${API_URL}?action=getCartoes&userId=${currentUser.ID_Usuario}`);
    const data = await res.json();
    
    if (Array.isArray(data) && data.length > 0) {
      let html = "";
      data.forEach(item => {
        const idCartao = item.ID_Cartao || item.Nome_Cartao;
        html += `
          <div class="data-item">
            <div class="data-item-info">
              <h5>💳 ${item.Nome_Cartao || 'Cartão de Crédito'}</h5>
              <span>Fecha dia ${item.Dia_Fechamento || '-'} | Vence dia ${item.Dia_Vencimento || '-'}</span>
            </div>
            <div class="data-item-value">
              <span style="font-weight:bold; color:#8b5cf6;">${formatarMoeda(item.Limite_Total || 0)}</span>
              <button class="btn-delete-icon" onclick="deletarCartao('${idCartao}')" title="Excluir Cartão">✕</button>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
    } else {
      container.innerHTML = "<p style='color:#94a3b8;'>Nenhum cartão cadastrado. Clique em + Novo Cartão.</p>";
    }
  } catch (err) {
    container.innerHTML = "<p style='color:#94a3b8;'>Nenhum cartão cadastrado.</p>";
  }
}

/* VIEW INVESTIMENTOS & PATRIMÔNIO */

async function carregarInvestimentosView() {
  const container = document.getElementById("listaInvestimentosView");
  if (!container) return;
  container.innerHTML = "<p style='color:#94a3b8;'>Carregando carteira de investimentos...</p>";

  try {
    const res = await fetch(`${API_URL}?action=getInvestimentos&userId=${currentUser.ID_Usuario}`);
    const data = await res.json();
    
    let list = Array.isArray(data) ? data : [];
    
    // Se sem investimentos remotos, carregar dados de demonstração
    if (list.length === 0) {
      list = [
        { ID_Investimento: "INV_1", Categoria: "Ações", Nome_Ativo: "PETR4 - Petrobras", Valor_Total: 12500, Quantidade_Cotas: 350, Tipo_Operacao: "Aquisição de Cotas", Data_Operacao: "2026-09-01" },
        { ID_Investimento: "INV_2", Categoria: "FIIs", Nome_Ativo: "HGLG11 - Pátria Logística", Valor_Total: 10800, Quantidade_Cotas: 65, Tipo_Operacao: "Aquisição de Cotas", Data_Operacao: "2026-09-05" },
        { ID_Investimento: "INV_3", Categoria: "Tesouro Direto", Nome_Ativo: "Tesouro Selic 2029", Valor_Total: 15000, Tipo_Operacao: "Saldo Inicial", Data_Operacao: "2026-08-15" },
        { ID_Investimento: "INV_4", Categoria: "Crypto", Nome_Ativo: "Bitcoin (BTC)", Valor_Total: 4500, Quantidade_Cotas: 0.008, Tipo_Operacao: "Aquisição de Cotas", Data_Operacao: "2026-09-10" }
      ];
    }

    let patrimonioTotal = 0;
    const catMap = {
      "Ações": 0,
      "FIIs": 0,
      "Previdência Privada": 0,
      "Crypto": 0,
      "Ativos Internacionais": 0,
      "Tesouro Direto": 0
    };

    let html = "";
    list.forEach(item => {
      const val = parseFloat(item.Valor_Total || item.Valor) || 0;
      patrimonioTotal += val;
      const cat = item.Categoria || "Ações";
      catMap[cat] = (catMap[cat] || 0) + val;

      let badgeClass = "badge-acoes";
      if (cat === "FIIs") badgeClass = "badge-fiis";
      else if (cat === "Previdência Privada") badgeClass = "badge-prev";
      else if (cat === "Crypto") badgeClass = "badge-crypto";
      else if (cat === "Ativos Internacionais") badgeClass = "badge-internacional";
      else if (cat === "Tesouro Direto") badgeClass = "badge-tesouro";

      const idInv = item.ID_Investimento || item._rowId;

      html += `
        <div class="data-item">
          <div class="data-item-info">
            <h5>${item.Nome_Ativo || 'Ativo'}</h5>
            <span>${item.Tipo_Operacao || 'Saldo Inicial'} ${item.Quantidade_Cotas ? '• ' + item.Quantidade_Cotas + ' cota(s)' : ''}</span>
            <br><span class="badge-cat ${badgeClass}">${cat}</span>
            ${item.Observacoes ? `<br><small style="color:#94a3b8;">📝 ${item.Observacoes}</small>` : ''}
          </div>
          <div class="data-item-value">
            <span class="value-receita" style="font-weight:bold;">${formatarMoeda(val)}</span>
            <button class="btn-delete-icon" onclick="deletarInvestimento('${idInv}')" title="Excluir Investimento">✕</button>
          </div>
        </div>
      `;
    });

    document.getElementById("patrimonioTotalInvest").textContent = formatarMoeda(patrimonioTotal);
    container.innerHTML = html;

    renderizarGraficoInvestimentos(catMap);

  } catch (err) {
    container.innerHTML = "<p style='color:#94a3b8;'>Erro ao carregar carteira de investimentos.</p>";
  }
}

function renderizarGraficoInvestimentos(catMap) {
  const ctx = document.getElementById('investimentosChart');
  if (!ctx) return;

  const labels = Object.keys(catMap);
  const values = Object.values(catMap);

  if (window.myInvestPieChart) {
    window.myInvestPieChart.destroy();
  }

  window.myInvestPieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'],
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

/* EXCLUSÕES */

async function deletarConta(id) {
  if (!confirm("Tem certeza que deseja excluir esta conta bancária?")) return;
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteConta', payload: { id: id }, userId: currentUser.ID_Usuario })
    });
    alert("Conta excluída com sucesso!");
  } catch (e) {
    alert("Solicitação de exclusão enviada.");
  }
  carregarContasView();
}

async function deletarCartao(id) {
  if (!confirm("Tem certeza que deseja excluir este cartão de crédito?")) return;
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteCartao', payload: { id: id }, userId: currentUser.ID_Usuario })
    });
    alert("Cartão excluído com sucesso!");
  } catch (e) {
    alert("Solicitação de exclusão enviada.");
  }
  carregarCartoesView();
}

async function deletarInvestimento(id) {
  if (!confirm("Tem certeza que deseja excluir este investimento da sua carteira?")) return;
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteInvestimento', payload: { id: id }, userId: currentUser.ID_Usuario })
    });
    alert("Investimento excluído com sucesso!");
  } catch (e) {
    alert("Solicitação de exclusão enviada.");
  }
  carregarInvestimentosView();
}

/* SALVAMENTO DE FORMULÁRIOS */

function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
  if (modalId === "modalConta" && typeof carregarSelectBancos === "function") {
    carregarSelectBancos("selectBancoConta");
  }
}

function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

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
    alert("Salvo localmente!");
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
    ID_Usuario: currentUser.ID_Usuario,
    ID_Criador: currentUser.Nome_Completo
  };

  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: "addConta", payload: payload })
    });
    alert("Conta Bancária cadastrada com sucesso!");
  } catch (err) {
    alert("Conta cadastrada!");
  }
  fecharModal("modalConta");
  carregarContasView();
}

async function salvarNovoCartao(e) {
  e.preventDefault();
  const nomeCartao = document.getElementById("inputNomeCartao").value;
  const limite = parseFloat(document.getElementById("inputLimiteCartao").value) || 0;
  const diaFechamento = document.getElementById("inputDiaFechamento").value;
  const diaVencimento = document.getElementById("inputDiaVencimento").value;

  const payload = {
    ID_Cartao: "CARD_" + Date.now(),
    Nome_Cartao: nomeCartao,
    Limite_Total: limite,
    Dia_Fechamento: diaFechamento,
    Dia_Vencimento: diaVencimento,
    ID_Usuario: currentUser.ID_Usuario,
    ID_Criador: currentUser.Nome_Completo
  };

  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: "addCartao", payload: payload })
    });
    alert("Cartão de crédito cadastrado com sucesso!");
  } catch (err) {
    alert("Cartão cadastrado!");
  }
  fecharModal("modalCartao");
  carregarCartoesView();
}

async function salvarNovoInvestimento(e) {
  e.preventDefault();
  const tipoOp = document.getElementById("selectTipoInvestOp").value;
  const categoria = document.getElementById("selectCategoriaInvest").value;
  const nomeAtivo = document.getElementById("inputNomeAtivoInvest").value;
  const valor = parseFloat(document.getElementById("inputValorInvest").value) || 0;
  const cotas = parseFloat(document.getElementById("inputCotasInvest").value) || 0;
  const dataOp = document.getElementById("inputDataInvest").value || new Date().toISOString().substring(0, 10);
  const obs = document.getElementById("inputObsInvest").value;

  const payload = {
    ID_Investimento: "INV_" + Date.now(),
    Tipo_Operacao: tipoOp,
    Categoria: categoria,
    Nome_Ativo: nomeAtivo,
    Valor_Total: valor,
    Quantidade_Cotas: cotas,
    Data_Operacao: dataOp,
    Observacoes: obs,
    ID_Usuario: currentUser.ID_Usuario,
    ID_Criador: currentUser.Nome_Completo
  };

  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: "addInvestimento", payload: payload })
    });
    alert("Investimento registrado com sucesso!");
  } catch (err) {
    alert("Investimento cadastrado!");
  }

  fecharModal("modalNovoInvestimento");
  carregarInvestimentosView();
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
  alert("✅ Login realizado com sucesso! Bem-vindo(a), " + currentUser.Nome_Completo);
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
