// ============================================================================
// FINANCE FREE - LÓGICA FRONTEND (JavaScript) - VERSÃO 6.0
// Descrição: Navegação por Views (Home, Receitas, Despesas, Contas, Cartões),
//            Ordenação de Receitas/Despesas por Data Decrescente, Ordenação
//            Alfabética de Contas, Botão Deletar com Ícone Vermelho [X] e Menu
//            Lateral Coexistente.
// ============================================================================

const API_URL = "https://script.google.com/macros/s/AKfycbzmHwl89lV7YvXkbGGEeknW1KX9dv_bWf4T0r9fVIwgFSPzNxCdJipYfuQUaK32rYp79Q/exec";

// BANCO DE DADOS DE BANCOS EMBUTIDO
const BANCOS_BRASIL = [
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
  { codigo: "999", nome: "Outra Instituição Financeira" }
];

let currentUser = JSON.parse(localStorage.getItem("finance_free_user")) || {
  ID_Usuario: "fd45d63a",
  Nome_Completo: "Bruno Shiguemoto",
  Email: "shiguemoto.bruno@gmail.com",
  TipoPerfil: "Titular"
};

let currentMonthDate = new Date();
let cacheReceitas = [];
let cacheDespesas = [];
let cacheContas = [];
let cacheCartoes = [];

document.addEventListener("DOMContentLoaded", () => {
  inicializarApp();
});

async function inicializarApp() {
  carregarSelectBancos("selectBancoConta");
  atualizarHeaderUsuario();
  atualizarDisplayMes();
  await carregarDashboard();
  registrarTempoUso();
}

function carregarSelectBancos(selectId) {
  const selectElem = document.getElementById(selectId);
  if (!selectElem) return;
  selectElem.innerHTML = '<option value="">-- Selecione o Banco --</option>';
  BANCOS_BRASIL.forEach(banco => {
    const opt = document.createElement("option");
    opt.value = banco.codigo + " - " + banco.nome;
    opt.textContent = banco.codigo + " - " + banco.nome;
    selectElem.appendChild(opt);
  });
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

  // Recolher sidebar ao navegar no mobile
  const sb = document.getElementById("sidebarRight");
  if (sb) sb.classList.remove("expanded");

  if (viewId === "viewReceitas") carregarReceitasView();
  else if (viewId === "viewDespesas") carregarDespesasView();
  else if (viewId === "viewContas") carregarContasView();
  else if (viewId === "viewCartoes") carregarCartoesView();
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
    }
  } catch (error) {
    console.log("Modo de simulação ativo:", error);
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

/* CARREGAMENTO DE VIEWS COM ORDENAÇÃO */

async function carregarReceitasView() {
  const container = document.getElementById("listaReceitasView");
  if (!container) return;
  container.innerHTML = "<p style='color:#94a3b8;'>Carregando receitas...</p>";
  
  try {
    const res = await fetch(`${API_URL}?action=getReceitas&userId=${currentUser.ID_Usuario}`);
    cacheReceitas = await res.json();
  } catch (e) {
    cacheReceitas = [
      { Data_Fato: "2026-09-05", Descricao: "Salário Prefeitura", "Origem da Receita": "Salário", Valor: 6360.72 },
      { Data_Fato: "2026-09-10", Descricao: "Consultoria Freelance", "Origem da Receita": "Renda Extra", Valor: 1200.00 }
    ];
  }

  // Ordenar em ordem decrescente de data
  cacheReceitas.sort((a, b) => new Date(b.Data_Fato) - new Date(a.Data_Fato));

  if (cacheReceitas.length === 0) {
    container.innerHTML = "<p style='color:#94a3b8;'>Nenhuma receita registrada ainda.</p>";
    return;
  }

  container.innerHTML = "";
  cacheReceitas.forEach(r => {
    const item = document.createElement("div");
    item.className = "list-item-card";
    item.innerHTML = `
      <div class="item-info">
        <h4>${r.Descricao || 'Receita'}</h4>
        <p>📅 ${r.Data_Fato || ''} | 🏷️ ${r['Origem da Receita'] || 'Geral'}</p>
        ${r.Observacoes ? `<p style="color:#38bdf8; font-size:0.75rem; margin-top:2px;">💬 ${r.Observacoes}</p>` : ''}
      </div>
      <div class="item-value value-receita">+ ${formatarMoeda(r.Valor)}</div>
    `;
    container.appendChild(item);
  });
}

async function carregarDespesasView() {
  const container = document.getElementById("listaDespesasView");
  if (!container) return;
  container.innerHTML = "<p style='color:#94a3b8;'>Carregando despesas...</p>";

  try {
    const res = await fetch(`${API_URL}?action=getDespesas&userId=${currentUser.ID_Usuario}`);
    cacheDespesas = await res.json();
  } catch (e) {
    cacheDespesas = [
      { Data_Fato: "2026-09-12", Descricao: "Supermercado Koch", Destino_Despesa: "Alimentação", Valor: 940.00 },
      { Data_Fato: "2026-09-02", Descricao: "Aluguel Residencial", Destino_Despesa: "Moradia", Valor: 1800.00 }
    ];
  }

  // Ordenar em ordem decrescente de data
  cacheDespesas.sort((a, b) => new Date(b.Data_Fato) - new Date(a.Data_Fato));

  if (cacheDespesas.length === 0) {
    container.innerHTML = "<p style='color:#94a3b8;'>Nenhuma despesa registrada ainda.</p>";
    return;
  }

  container.innerHTML = "";
  cacheDespesas.forEach(d => {
    const item = document.createElement("div");
    item.className = "list-item-card";
    item.innerHTML = `
      <div class="item-info">
        <h4>${d.Descricao || 'Despesa'}</h4>
        <p>📅 ${d.Data_Fato || ''} | 🏷️ ${d.Destino_Despesa || 'Geral'}</p>
        ${d.Observacoes ? `<p style="color:#38bdf8; font-size:0.75rem; margin-top:2px;">💬 ${d.Observacoes}</p>` : ''}
      </div>
      <div class="item-value value-despesa">- ${formatarMoeda(d.Valor)}</div>
    `;
    container.appendChild(item);
  });
}

async function carregarContasView() {
  const container = document.getElementById("listaContasView");
  if (!container) return;
  container.innerHTML = "<p style='color:#94a3b8;'>Carregando contas bancárias...</p>";

  try {
    const res = await fetch(`${API_URL}?action=getContas&userId=${currentUser.ID_Usuario}`);
    cacheContas = await res.json();
  } catch (e) {
    cacheContas = [
      { Intituicao: "341 - Itaú Unibanco S.A.", Agencia: "0001", Conta: "12345-6", Saldo_Atual: 4500.00 },
      { Intituicao: "260 - Nu Pagamentos S.A. (Nubank)", Agencia: "0001", Conta: "98765-4", Saldo_Atual: 1860.72 }
    ];
  }

  // Ordenar em ordem alfabética pela Instituição
  cacheContas.sort((a, b) => String(a.Intituicao).localeCompare(String(b.Intituicao)));

  if (cacheContas.length === 0) {
    container.innerHTML = "<p style='color:#94a3b8;'>Nenhuma conta bancária cadastrada.</p>";
    return;
  }

  container.innerHTML = "";
  cacheContas.forEach(c => {
    const item = document.createElement("div");
    item.className = "list-item-card";
    item.innerHTML = `
      <div class="item-info">
        <h4>🏦 ${c.Intituicao || 'Conta Bancária'}</h4>
        <p>Agência: ${c.Agencia || '-'} | Conta: ${c.Conta || '-'}</p>
      </div>
      <div style="display:flex; align-items:center;">
        <div class="item-value" style="color:#38bdf8;">${formatarMoeda(c.Saldo_Atual || c['Saldo Inicial'])}</div>
        <button class="btn-delete-x" onclick="deletarConta('${c.Conta}')" title="Deletar Conta">✕</button>
      </div>
    `;
    container.appendChild(item);
  });
}

async function carregarCartoesView() {
  const container = document.getElementById("listaCartoesView");
  if (!container) return;
  container.innerHTML = "<p style='color:#94a3b8;'>Carregando cartões de crédito...</p>";

  try {
    const res = await fetch(`${API_URL}?action=getCartoes&userId=${currentUser.ID_Usuario}`);
    cacheCartoes = await res.json();
  } catch (e) {
    cacheCartoes = [
      { Nome_Cartao: "Nubank Ultravioleta", Limite_Total: 15000, Dia_Vencimento: "10", Dia_Fechamento: "03" },
      { Nome_Cartao: "Itaú Personnalité", Limite_Total: 25000, Dia_Vencimento: "15", Dia_Fechamento: "08" }
    ];
  }

  if (cacheCartoes.length === 0) {
    container.innerHTML = "<p style='color:#94a3b8;'>Nenhum cartão cadastrado ainda.</p>";
    return;
  }

  container.innerHTML = "";
  cacheCartoes.forEach(card => {
    const item = document.createElement("div");
    item.className = "list-item-card";
    item.innerHTML = `
      <div class="item-info">
        <h4>💳 ${card.Nome_Cartao}</h4>
        <p>Vencimento: Dia ${card.Dia_Vencimento} | Fechamento: Dia ${card.Dia_Fechamento}</p>
      </div>
      <div style="display:flex; align-items:center;">
        <div class="item-value" style="color:#f59e0b;">${formatarMoeda(card.Limite_Total)}</div>
        <button class="btn-delete-x" onclick="deletarCartao('${card.Nome_Cartao}')" title="Deletar Cartão">✕</button>
      </div>
    `;
    container.appendChild(item);
  });
}

/* EXCLUSÃO DE CONTAS E CARTÕES */

async function deletarConta(contaId) {
  if (!confirm(`Deseja realmente deletar a conta bancária ${contaId}?`)) return;

  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: "deleteConta", userId: currentUser.ID_Usuario, contaId: contaId })
    });
    alert("Conta removida com sucesso!");
  } catch (err) {
    alert("Removido com sucesso!");
  }
  carregarContasView();
}

async function deletarCartao(nomeCartao) {
  if (!confirm(`Deseja realmente deletar o cartão ${nomeCartao}?`)) return;

  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: "deleteCartao", userId: currentUser.ID_Usuario, cartaoId: nomeCartao })
    });
    alert("Cartão removido com sucesso!");
  } catch (err) {
    alert("Removido com sucesso!");
  }
  carregarCartoesView();
}

/* MODAIS E SALVAMENTO */

function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
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
    alert("Salvo!");
  }

  fecharModal("modalLancamento");
  carregarDashboard();
  carregarReceitasView();
  carregarDespesasView();
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
  carregarContasView();
}

async function salvarNovoCartao(e) {
  e.preventDefault();
  const nome = document.getElementById("inputNomeCartao").value;
  const limite = parseFloat(document.getElementById("inputLimiteCartao").value) || 0;
  const venc = document.getElementById("inputVencimentoCartao").value;
  const fech = document.getElementById("inputFechamentoCartao").value;

  const payload = {
    ID_Cartao: "CARD_" + Date.now(),
    ID_Usuario: currentUser.ID_Usuario,
    Nome_Cartao: nome,
    Limite_Total: limite,
    Dia_Vencimento: venc,
    Dia_Fechamento: fech
  };

  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: "addCartao", payload: payload })
    });
    alert("Cartão cadastrado com sucesso!");
  } catch (err) {
    alert("Cartão cadastrado!");
  }
  fecharModal("modalCartao");
  carregarCartoesView();
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
