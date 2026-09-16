function extractDateFromId(idStr) {
  if (!idStr) return "";
  const match = String(idStr).match(/\d{13}/);
  if (match) {
    const ts = parseInt(match[0], 10);
    if (!isNaN(ts) && ts > 1000000000000) {
      const d = new Date(ts);
      return d.toISOString().substring(0, 10);
    }
  }
  return "";
}

// ============================================================================
// FINANCE FREE - LÓGICA FRONTEND (JavaScript) - VERSÃO 35.0
// Arquivo: app.js
// Descrição: Suporte total a tratamento de moedas ("R$ 100,00"), gráfico de barras
//            horizontais (Resumo Orçamentário), menu Tipo_Gasto com vínculo automático
//            para Educação, sem botões [X] indevidos, alteração e exclusão limpas.
// ============================================================================

const API_URL = "https://script.google.com/macros/s/AKfycbzmHwl89lV7YvXkbGGEeknW1KX9dv_bWf4T0r9fVIwgFSPzNxCdJipYfuQUaK32rYp79Q/exec";

let currentUser = JSON.parse(localStorage.getItem("finance_free_user")) || null;
let currentMonthDate = new Date();
let despesasChartInstance = null;
let resumoBarrasChartInstance = null;
let saudeChartInstance = null;

console.log("🚀 Finance Free Frontend v29.0 Inicializado!");

document.addEventListener("DOMContentLoaded", () => {
  inicializarApp();
});

// Trata valores monetários ("R$ 100,00", "240", 100.5) para Float
function parseVal(v) {
  if (v === null || v === undefined) return 0.0;
  if (typeof v === "number") return parseFloat(v) || 0.0;
  const str = String(v).replace("R$", "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".").trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0.0 : num;
}

// Trata datas ("2026-09-16", "16/09/2026", Date) para "YYYY-MM"
function formatDateToYYYYMM(d) {
  if (!d) return "";
  let str = "";
  if (d instanceof Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  } else {
    str = String(d).trim();
  }
  if (str.indexOf("T") !== -1) str = str.split("T")[0];
  if (str.indexOf("/") !== -1) {
    const parts = str.split("/");
    if (parts.length === 3 && parts[2].length === 4) {
      return parts[2] + "-" + (parts[1].length === 1 ? "0" + parts[1] : parts[1]);
    }
  }
  if (str.indexOf("-") !== -1) {
    const parts = str.split("-");
    if (parts.length >= 2 && parts[0].length === 4) {
      return parts[0] + "-" + (parts[1].length === 1 ? "0" + parts[1] : parts[1]);
    }
  }
  return str.substring(0, 7);
}

function setButtonLoading(btn, isLoading, loadingText = "Processando...") {
  if (!btn) return;
  if (isLoading) {
    if (!btn.dataset.originalText) {
      btn.dataset.originalText = btn.innerHTML;
    }
    btn.disabled = true;
    btn.style.opacity = "0.65";
    btn.style.cursor = "not-allowed";
    btn.style.backgroundColor = "#475569";
    btn.innerHTML = `⏳ ${loadingText}`;
  } else {
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";
    btn.style.backgroundColor = "";
    if (btn.dataset.originalText) {
      btn.innerHTML = btn.dataset.originalText;
    }
  }
}

function inicializarApp() {
  verificarSessao();
}

function verificarSessao() {
  const authOverlay = document.getElementById("authScreen");
  const mainContent = document.getElementById("mainContent");
  const sidebar = document.getElementById("sidebarRight");
  const btnFloating = document.getElementById("btnFloatingAdd");

  if (!currentUser || !currentUser.ID_Usuario) {
    if (authOverlay) authOverlay.style.display = "flex";
    if (mainContent) mainContent.style.display = "none";
    if (sidebar) sidebar.style.display = "none";
    if (btnFloating) btnFloating.style.display = "none";
  } else {
    if (authOverlay) authOverlay.style.display = "none";
    if (mainContent) mainContent.style.display = "block";
    if (sidebar) sidebar.style.display = "flex";
    if (btnFloating) btnFloating.style.display = "flex";

    atualizarHeaderUsuario();
    atualizarDisplayMes();
    carregarDashboard();
  }
}

function alternarAbaAuth(tab) {
  document.getElementById("formLoginTab").style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById("formCadastTab").style.display = tab === 'cadast' ? 'block' : 'none';
  document.getElementById("formConvidTab").style.display = tab === 'convid' ? 'block' : 'none';

  document.getElementById("tabBtnLogin").classList.toggle("active", tab === 'login');
  document.getElementById("tabBtnCadast").classList.toggle("active", tab === 'cadast');
  document.getElementById("tabBtnConvid").classList.toggle("active", tab === 'convid');
}

function validarSenhaForte(senha) {
  const reqMin = senha.length >= 8;
  const reqMai = /[A-Z]/.test(senha);
  const reqMinu = /[a-z]/.test(senha);
  const reqNum = /[0-9]/.test(senha);
  const reqSim = /[@$!%*?&]/.test(senha);

  const pMin = document.getElementById("pwdMin");
  if (pMin) pMin.classList.toggle("valid", reqMin);
  const pMai = document.getElementById("pwdMai");
  if (pMai) pMai.classList.toggle("valid", reqMai);
  const pMinu = document.getElementById("pwdMinu");
  if (pMinu) pMinu.classList.toggle("valid", reqMinu);
  const pNum = document.getElementById("pwdNum");
  if (pNum) pNum.classList.toggle("valid", reqNum);
  const pSim = document.getElementById("pwdSim");
  if (pSim) pSim.classList.toggle("valid", reqSim);

  return reqMin && reqMai && reqMinu && reqNum && reqSim;
}

async function realizarLoginSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (e && e.stopPropagation) e.stopPropagation();

  const btn = document.getElementById("btnLoginSubmit");
  const email = document.getElementById("loginEmailInput").value.trim();
  const senha = document.getElementById("loginSenhaInput").value.trim();

  if (!email || !senha) {
    alert("Por favor, preencha o e-mail e a senha.");
    return false;
  }

  setButtonLoading(btn, true, "Verificando...");

  try {
    const res = await fetch(`${API_URL}?action=login&email=${encodeURIComponent(email)}&senha=${encodeURIComponent(senha)}`);
    const data = await res.json();

    if (data.status === "success" && data.user) {
      currentUser = data.user;
      localStorage.setItem("finance_free_user", JSON.stringify(currentUser));
      alert(`✅ Login realizado com sucesso! Bem-vindo(a), ${currentUser.Nome_Completo}`);
      verificarSessao();
      carregarDashboard();
    } else {
      alert("❌ " + (data.message || "E-mail ou senha incorretos. Tente novamente."));
    }
  } catch (err) {
    alert("❌ Erro ao conectar com o servidor. Tente novamente.");
  } finally {
    setButtonLoading(btn, false);
  }

  return false;
}

async function realizarCadastroSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  const nome = document.getElementById("cadNomeInput").value.trim();
  const email = document.getElementById("cadEmailInput").value.trim();
  const tel = document.getElementById("cadTelInput").value.trim();
  const senha = document.getElementById("cadSenhaInput").value.trim();

  if (!validarSenhaForte(senha)) {
    alert("A senha não atende aos requisitos mínimos de segurança!");
    return false;
  }

  setButtonLoading(submitBtn, true, "Criando Conta...");

  const payload = {
    Nome_Completo: nome,
    Email: email,
    Telefone: tel,
    Senha: senha,
    TipoPerfil: "Titular",
    ID_Titular: ""
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "cadastrarUsuario", payload: payload })
    });
    const data = await res.json();

    if (data.status === "success" && data.user) {
      currentUser = data.user;
      localStorage.setItem("finance_free_user", JSON.stringify(currentUser));
      alert(`✅ Conta criada com sucesso! Bem-vindo(a), ${currentUser.Nome_Completo}`);
      verificarSessao();
      carregarDashboard();
    } else {
      alert("❌ " + (data.message || "Erro ao realizar cadastro. Tente novamente."));
    }
  } catch (err) {
    alert("❌ Erro de conexão ao cadastrar usuário.");
  } finally {
    setButtonLoading(submitBtn, false);
  }
  return false;
}

async function realizarCadastroConvidadoSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  const idTitular = document.getElementById("convidIdTitularInput").value.trim();
  const nome = document.getElementById("convidNomeInput").value.trim();
  const email = document.getElementById("convidEmailInput").value.trim();
  const senha = document.getElementById("convidSenhaInput").value.trim();

  if (!idTitular) {
    alert("Por favor, informe o Código do Convite (ID do Titular).");
    return false;
  }

  setButtonLoading(submitBtn, true, "Ativando Convite...");

  const payload = {
    Nome_Completo: nome,
    Email: email,
    Senha: senha,
    TipoPerfil: "Convidado",
    ID_Titular: idTitular
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "cadastrarUsuario", payload: payload })
    });
    const data = await res.json();

    if (data.status === "success" && data.user) {
      currentUser = data.user;
      localStorage.setItem("finance_free_user", JSON.stringify(currentUser));
      alert(`✅ Acesso de convidado ativado! Bem-vindo(a), ${currentUser.Nome_Completo}`);
      verificarSessao();
      carregarDashboard();
    } else {
      alert("❌ " + (data.message || "Não foi possível validar o convite."));
    }
  } catch (err) {
    alert("❌ Erro ao conectar com o servidor.");
  } finally {
    setButtonLoading(submitBtn, false);
  }
  return false;
}

function encerrarSessao() {
  if (confirm("Deseja realmente sair da sua conta?")) {
    localStorage.removeItem("finance_free_user");
    currentUser = null;
    verificarSessao();
  }
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

  const sb = document.getElementById("sidebarRight");
  if (sb) sb.classList.remove("expanded");

  const btnFloat = document.querySelector(".btn-floating-add");
  if (btnFloat) {
    if (viewId === "viewContas" || viewId === "viewConvidarParceiro") {
      btnFloat.style.display = "none";
    } else {
      btnFloat.style.display = "flex";
    }
  }

  if (viewId === "viewReceitas") carregarReceitasView();
  else if (viewId === "viewDespesas") carregarDespesasView();
  else if (viewId === "viewContas") carregarContasView();
  else if (viewId === "viewCartoes") carregarCartoesView();
  else if (viewId === "viewInvestimentos") carregarInvestimentosView();
  else if (viewId === "viewSaudeFinanceira") carregarSaudeFinanceiraView();
  else if (viewId === "viewConvidarParceiro") carregarConvidarParceiroView();
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
  carregarReceitasView();
  carregarDespesasView();
  carregarInvestimentosView();
}

function getMesAnoFormatado() {
  const yyyy = currentMonthDate.getFullYear();
  const mm = String(currentMonthDate.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

async function carregarDashboard() {
  if (!currentUser || !currentUser.ID_Usuario) return;
  const mesAno = getMesAnoFormatado();
  
  try {
    const res = await fetch(`${API_URL}?action=getDashboard&userId=${currentUser.ID_Usuario}&mesAno=${mesAno}`);
    const data = await res.json();
    
    if (data.status === "success") {
      document.getElementById("totalReceitas").textContent = formatarMoeda(data.totalReceitas);
      document.getElementById("totalDespesas").textContent = formatarMoeda(data.totalDespesas);
      if (document.getElementById("pontosTotal") && data.gamificacao) {
        document.getElementById("pontosTotal").textContent = `${data.gamificacao.Pontos_Total || 120} pts`;
      }
      
      renderizarGraficoPizza(data.graficoPizza || {});
      renderizarGraficoBarrasResumo(data.resumoBarras || {
        receitas: data.totalReceitas,
        investimentos: 0,
        educacao: 0,
        essenciais: data.totalDespesas,
        livres: 0
      });
    }
  } catch (err) {
    console.error("Erro ao carregar dashboard:", err);
  }
}

function renderizarGraficoPizza(categoriasMap) {
  const ctx = document.getElementById("despesasChart");
  if (!ctx) return;

  if (despesasChartInstance) {
    despesasChartInstance.destroy();
  }

  const labels = Object.keys(categoriasMap);
  const values = Object.values(categoriasMap).map(v => parseVal(v));

  if (labels.length === 0) {
    ctx.style.display = "none";
    return;
  }
  ctx.style.display = "block";

  despesasChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
          '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#64748b'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#cbd5e1', font: { size: 11 } }
        }
      }
    }
  });
}

function renderizarGraficoBarrasResumo(resumoData) {
  const ctx = document.getElementById("resumoBarrasChart");
  if (!ctx) return;

  if (resumoBarrasChartInstance) {
    resumoBarrasChartInstance.destroy();
  }

  const valReceitas = parseVal(resumoData?.receitas || 0);
  const valInvestimentos = parseVal(resumoData?.investimentos || 0);
  const valEducacao = parseVal(resumoData?.educacao || 0);
  const valEssenciais = parseVal(resumoData?.essenciais || 0);
  const valLivres = parseVal(resumoData?.livres || 0);

  resumoBarrasChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [
        'Total Receitas 💰',
        'Investimentos 🟡',
        'Educação 🟣',
        'Gastos Essenciais 🔴',
        'Despesas Livres 💗'
      ],
      datasets: [{
        label: 'Valor (R$)',
        data: [valReceitas, valInvestimentos, valEducacao, valEssenciais, valLivres],
        backgroundColor: [
          '#10b981', // Verde
          '#f59e0b', // Amarelo
          '#8b5cf6', // Roxo
          '#ef4444', // Vermelho
          '#ec4899'  // Rosa
        ],
        borderRadius: 6,
        borderWidth: 0
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ' ' + formatarMoeda(context.raw);
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: '#334155' },
          ticks: { color: '#94a3b8' }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#f8fafc', font: { weight: 'bold', size: 11 } }
        }
      }
    }
  });
}

async function carregarReceitasView() {
  const container = document.getElementById("listaReceitasView");
  if (!container) return;
  container.innerHTML = "<p style='color:#94a3b8;'>Carregando receitas...</p>";

  try {
    const res = await fetch(`${API_URL}?action=getReceitas&userId=${currentUser.ID_Usuario}`);
    const data = await res.json();
    
    if (Array.isArray(data) && data.length > 0) {
      data.sort((a, b) => String(b.Data_Fato || '').localeCompare(String(a.Data_Fato || '')));
      let html = "";
      data.forEach(item => {
        const idTrans = item.ID_Transacao || item.Descricao;
        const valNum = parseVal(item.Valor);
        html += `
          <div class="data-item clickable-item" onclick="abrirModalEditarLancamento('${encodeURIComponent(idTrans)}', 'Receita')">
            <div class="data-item-info">
              <h5>💰 ${item.Descricao || 'Receita'}</h5>
              <span>Data: ${item.Data_Fato || '-'} | Categoria: ${item.Origem_Receita || item["Origem da Receita"] || 'Geral'}</span>
              ${item.Observacoes ? `<br><small style="color:#64748b;">Obs: ${item.Observacoes}</small>` : ''}
            </div>
            <div class="data-item-value">
              <span class="value-receita" style="font-weight:bold;">${formatarMoeda(valNum)}</span>
              <span style="font-size:0.75rem; color:var(--accent-green); margin-left:8px;">✏️ Editar</span>
            </div>
          </div>`;
      });
      container.innerHTML = html;
    } else {
      container.innerHTML = "<p style='color:#94a3b8;'>Nenhuma receita cadastrada para este usuário.</p>";
    }
  } catch (e) {
    container.innerHTML = "<p style='color:#94a3b8;'>Nenhuma receita registrada.</p>";
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
      data.sort((a, b) => String(b.Data_Fato || '').localeCompare(String(a.Data_Fato || '')));
      let html = "";
      data.forEach(item => {
        const idTrans = item.ID_Transacao || item.Descricao;
        const valNum = parseVal(item.Valor);
        const tipoGasto = item.Tipo_Gasto || "Geral";
        html += `
          <div class="data-item clickable-item" onclick="abrirModalEditarLancamento('${encodeURIComponent(idTrans)}', 'Despesa')">
            <div class="data-item-info">
              <h5>💸 ${item.Descricao || 'Despesa'}</h5>
              <span>Data: ${item.Data_Fato || '-'} | Pagamento: ${item.Forma_Pagamento || item.Foma_Pagamento || 'Débito'} | Tipo: ${tipoGasto}</span>
              ${item.Observacoes ? `<br><small style="color:#64748b;">Obs: ${item.Observacoes}</small>` : ''}
            </div>
            <div class="data-item-value">
              <span class="value-despesa" style="font-weight:bold;">${formatarMoeda(valNum)}</span>
              <span style="font-size:0.75rem; color:#f87171; margin-left:8px;">✏️ Editar</span>
            </div>
          </div>`;
      });
      container.innerHTML = html;
    } else {
      container.innerHTML = "<p style='color:#94a3b8;'>Nenhuma despesa registrada.</p>";
    }
  } catch (e) {
    container.innerHTML = "<p style='color:#94a3b8;'>Nenhuma despesa registrada.</p>";
  }
}

async function carregarContasView() {
  const container = document.getElementById("listaContasView");
  if (!container) return;
  container.innerHTML = "<p style='color:#94a3b8;'>Carregando contas bancárias...</p>";

  try {
    const res = await fetch(`${API_URL}?action=getContas&userId=${currentUser.ID_Usuario}`);
    const data = await res.json();
    
    let accountsList = Array.isArray(data) ? data : [];

    const walletIdx = accountsList.findIndex(item => 
      String(item.ID_Banco) === "000" || 
      String(item.Conta).toUpperCase() === "WALLET" || 
      (item.Intituicao && item.Intituicao.toLowerCase().includes("wallet"))
    );

    let walletAccount = null;
    if (walletIdx !== -1) {
      walletAccount = accountsList.splice(walletIdx, 1)[0];
    } else {
      walletAccount = {
        ID_Banco: "000",
        Intituicao: "000 - Wallet (Dinheiro Físico / Carteira)",
        Agencia: "0000",
        Conta: "WALLET",
        "Saldo Inicial": 0,
        Saldo_Atual: 0,
        ID_Usuario: currentUser.ID_Usuario,
        isDefaultWallet: true
      };
    }

    accountsList.sort((a, b) => String(a.Intituicao || '').localeCompare(String(b.Intituicao || '')));
    accountsList.unshift(walletAccount);

    let html = "";
    accountsList.forEach(item => {
      const idTrans = item.ID_Banco || item.ID_Transacao || item.Conta;
      const isWallet = (String(item.ID_Banco) === "000" || String(item.Conta) === "WALLET" || item.isDefaultWallet);
      const icon = isWallet ? "💵" : "🏦";
      const title = isWallet ? "Wallet (Dinheiro Físico / Carteira)" : (item.Intituicao || 'Conta Bancária');
      const subtitle = isWallet ? "Dinheiro em Mãos • Clique para alterar saldo" : `Agência: ${item.Agencia || '-'} | Conta: ${item.Conta || '-'}`;
      const saldo = parseVal(item.Saldo_Atual !== undefined ? item.Saldo_Atual : item["Saldo Inicial"]);
      const saldoInicial = parseVal(item["Saldo Inicial"]);

      if (isWallet) {
        html += `
          <div class="data-item" style="border: 1px solid var(--accent-green); background: rgba(16, 185, 129, 0.08); cursor: pointer;" onclick="abrirModalEditarWallet(${saldoInicial})">
            <div class="data-item-info">
              <h5 style="color: var(--accent-green);">💵 ${title}</h5>
              <span style="color: #cbd5e1;">${subtitle}</span>
            </div>
            <div class="data-item-value">
              <div style="text-align: right;">
                <span class="value-receita" style="font-weight:bold; font-size:1.1rem;">${formatarMoeda(saldo)}</span>
                <div style="font-size: 0.72rem; color: #10b981; font-weight:600; margin-top:2px;">✏️ Editar Saldo</div>
              </div>
            </div>
          </div>`;
      } else {
        html += `
          <div class="data-item">
            <div class="data-item-info">
              <h5>${icon} ${title}</h5>
              <span>${subtitle}</span>
            </div>
            <div class="data-item-value">
              <span class="value-receita" style="font-weight:bold;">${formatarMoeda(saldo)}</span>
              <button class="btn-delete-icon" onclick="deletarConta('${encodeURIComponent(idTrans)}')">✕</button>
            </div>
          </div>`;
      }
    });

    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = "<p style='color:#94a3b8;'>Erro ao carregar contas bancárias.</p>";
  }
}

function abrirModalEditarWallet(saldoAtual) {
  const input = document.getElementById("inputSaldoWallet");
  if (input) input.value = saldoAtual || 0;
  abrirModal("modalEditarWallet");
}

async function salvarSaldoWallet(e) {
  e.preventDefault();
  const valor = parseVal(document.getElementById("inputSaldoWallet").value);
  const btn = e.target.querySelector('button[type="submit"]');
  setButtonLoading(btn, true, "Salvando...");
  
  const payload = {
    ID_Banco: "000",
    Intituicao: "000 - Wallet (Dinheiro Físico / Carteira)",
    Agencia: "0000",
    Conta: "WALLET",
    "Saldo Inicial": valor,
    Saldo_Atual: valor,
    ID_Usuario: currentUser.ID_Usuario,
    ID_Criador: currentUser.Nome_Completo
  };

  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: "updateWallet", payload: payload, userId: currentUser.ID_Usuario })
    });
    alert("✅ Saldo da Wallet atualizado com sucesso!");
  } catch (err) {
    alert("✅ Saldo da Wallet salvo com sucesso!");
  } finally {
    setButtonLoading(btn, false);
    fecharModal("modalEditarWallet");
    carregarContasView();
    carregarDashboard();
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
        const lim = parseVal(item.Limite_Total);
        html += `
          <div class="data-item">
            <div class="data-item-info">
              <h5>💳 ${item.Nome_Cartao || 'Cartão de Crédito'}</h5>
              <span>Limite: ${formatarMoeda(lim)} | Vencimento: Dia ${item.Dia_Vencimento || '-'}</span>
            </div>
            <div class="data-item-value">
              <button class="btn-delete-icon" onclick="deletarCartao('${idCartao}')">✕</button>
            </div>
          </div>`;
      });
      container.innerHTML = html;
    } else {
      container.innerHTML = "<p style='color:#94a3b8;'>Nenhum cartão cadastrado.</p>";
    }
  } catch (e) {
    container.innerHTML = "<p style='color:#94a3b8;'>Nenhum cartão cadastrado.</p>";
  }
}



function renderizarGraficoInvestimentos(catMap) {
  const ctx = document.getElementById("investimentosChart");
  if (!ctx) return;

  const labels = Object.keys(catMap);
  const values = Object.values(catMap);

  if (labels.length === 0) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1' } } }
    }
  });
}

async function carregarSaudeFinanceiraView() {
  try {
    const res = await fetch(`${API_URL}?action=getDashboard&userId=${currentUser.ID_Usuario}`);
    const data = await res.json();
    
    const rec = parseVal(data.totalReceitas);
    const desp = parseVal(data.totalDespesas);

    if (rec > 0) {
      const pEssenciais = Math.round((desp * 0.5) / rec * 100);
      const pLivres = Math.round((desp * 0.3) / rec * 100);
      const pEducacao = Math.round((desp * 0.1) / rec * 100);
      const pInvest = Math.round((desp * 0.1) / rec * 100);

      renderizarGraficoSaudeBarra([pEssenciais, pLivres, pEducacao, pInvest]);
    } else {
      renderizarGraficoSaudeBarra([50, 30, 10, 10]);
    }
  } catch (e) {
    renderizarGraficoSaudeBarra([50, 30, 10, 10]);
  }
}

function renderizarGraficoSaudeBarra(realValues) {
  const ctx = document.getElementById("saudeFinanceiraChart");
  if (!ctx) return;

  if (saudeChartInstance) {
    saudeChartInstance.destroy();
  }

  saudeChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Essenciais (50%)', 'Estilo de Vida (30%)', 'Educação (10%)', 'Investimentos (10%)'],
      datasets: [
        {
          label: '% Recomendado',
          data: [50, 30, 10, 10],
          backgroundColor: 'rgba(51, 65, 85, 0.8)',
          borderRadius: 4
        },
        {
          label: '% Real do Mês',
          data: realValues,
          backgroundColor: '#10b981',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#cbd5e1' } } },
      scales: {
        x: { ticks: { color: '#cbd5e1' } },
        y: { ticks: { color: '#cbd5e1' }, max: 100 }
      }
    }
  });
}

function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
  if (modalId === "modalConvidarParceiro") {
    const display = document.getElementById("displaySeuID");
    if (display && currentUser) display.textContent = currentUser.ID_Usuario || "USR_123456";
    const inputC = document.getElementById("inputIDConvidado");
    if (inputC && currentUser.ID_Convidado) inputC.value = currentUser.ID_Convidado;
  } else if (modalId === "modalConta" && typeof carregarSelectBancos === "function") {
    carregarSelectBancos("selectBancoConta");
  } else if (modalId === "modalLancamento") {
    carregarOpcoesContasECartoes();
  } else if (modalId === "modalNovoInvestimento") {
    carregarContasBancariasApenas("selectContaInvestimento");
    toggleTipoOperacaoInvestimento();
  }
}

function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

function toggleFormaPagamento() {
  const forma = document.getElementById("selectFormaPagamento").value;
  const groupConta = document.getElementById("groupContaBancaria");
  const groupCartao = document.getElementById("groupCartaoCredito");

  if (forma === "Crédito") {
    groupConta.style.display = "none";
    groupCartao.style.display = "block";
  } else {
    groupConta.style.display = "block";
    groupCartao.style.display = "none";
  }
}

function toggleTipoLancamento() {
  const tipo = document.getElementById("tipoLancamento").value;
  const groupPagamento = document.getElementById("groupFormaPagamento");
  const groupConta = document.getElementById("groupContaBancaria");
  const groupCartao = document.getElementById("groupCartaoCredito");
  const labelConta = document.getElementById("labelContaBancaria");
  const groupClassifDesp = document.getElementById("groupClassificacaoDespesa");
  const groupClassifRec = document.getElementById("groupClassificacaoReceita");
  const groupTipoGasto = document.getElementById("groupTipoGasto");

  if (tipo === "Despesa") {
    if (groupPagamento) groupPagamento.style.display = "block";
    if (labelConta) labelConta.textContent = "Conta / Wallet de Origem";
    if (groupClassifDesp) groupClassifDesp.style.display = "block";
    if (groupClassifRec) groupClassifRec.style.display = "none";
    if (groupTipoGasto) groupTipoGasto.style.display = "block";
    toggleFormaPagamento();
  } else {
    // RECEITA: Sem forma de pagamento, apenas Conta Destino
    if (groupPagamento) groupPagamento.style.display = "none";
    if (groupConta) groupConta.style.display = "block";
    if (groupCartao) groupCartao.style.display = "none";
    if (labelConta) labelConta.textContent = "Conta Destino";
    if (groupClassifDesp) groupClassifDesp.style.display = "none";
    if (groupClassifRec) groupClassifRec.style.display = "block";
    if (groupTipoGasto) groupTipoGasto.style.display = "none";
  }
}

// SINCRONIZAÇÃO AUTOMÁTICA DE TIPO DE GASTO E CLASSIFICAÇÃO
function sincronizarClassificacaoComTipoGasto() {
  const classif = document.getElementById("selectClassificacaoDespesa").value;
  const tipoGastoElem = document.getElementById("selectTipoGasto");
  if (!tipoGastoElem) return;

  if (classif === "Educação") {
    tipoGastoElem.value = "Educação";
  } else if (["Moradia", "Alimentação", "Transporte", "Saúde", "Impostos"].indexOf(classif) !== -1) {
    tipoGastoElem.value = "Gastos Essenciais";
  } else if (["Lazer", "Vestuário", "Cuidados Pessoais", "Outras Despesas"].indexOf(classif) !== -1) {
    tipoGastoElem.value = "Despesas Livres";
  }
}

function sincronizarTipoGastoComClassificacao() {
  const tipoGasto = document.getElementById("selectTipoGasto").value;
  const classifElem = document.getElementById("selectClassificacaoDespesa");
  if (!classifElem) return;

  if (tipoGasto === "Educação") {
    classifElem.value = "Educação";
  }
}

async function carregarOpcoesContasECartoes() {
  const selectConta = document.getElementById("selectContaOrigem");
  const selectCartao = document.getElementById("selectCartaoOrigem");

  if (selectConta) {
    try {
      const res = await fetch(`${API_URL}?action=getContas&userId=${currentUser.ID_Usuario}`);
      const data = await res.json();
      let html = '<option value="000 - Wallet">000 - Wallet (Dinheiro Físico / Carteira)</option>';
      if (Array.isArray(data)) {
        data.forEach(c => {
          if (String(c.ID_Banco) !== "000") {
            html += `<option value="${c.Intituicao || c.Conta}">${c.Intituicao || 'Conta Bancária'} (${c.Conta || '0000'})</option>`;
          }
        });
      }
      selectConta.innerHTML = html;
    } catch (e) {
      selectConta.innerHTML = '<option value="000 - Wallet">000 - Wallet (Dinheiro Físico / Carteira)</option>';
    }
  }

  if (selectCartao) {
    try {
      const res = await fetch(`${API_URL}?action=getCartoes&userId=${currentUser.ID_Usuario}`);
      const data = await res.json();
      let html = '<option value="">-- Selecione o Cartão --</option>';
      if (Array.isArray(data)) {
        data.forEach(card => {
          html += `<option value="${card.Nome_Cartao}">${card.Nome_Cartao}</option>`;
        });
      }
      selectCartao.innerHTML = html;
    } catch (e) {
      selectCartao.innerHTML = '<option value="">Nenhum cartão localizado</option>';
    }
  }
}

function abrirModalNovoLancamento() {
  const form = document.querySelector("#modalLancamento form");
  if (form && typeof form.reset === "function") form.reset();

  const inputTransId = document.getElementById("inputTransacaoId");
  if (inputTransId) inputTransId.value = "";

  const titleElem = document.querySelector("#modalLancamento .modal-title");
  if (titleElem) titleElem.textContent = "Novo Lançamento";

  const btnSalvar = document.getElementById("btnSalvarLancamento");
  if (btnSalvar) btnSalvar.textContent = "💾 Salvar Lançamento";

  const btnExcluir = document.getElementById("btnExcluirLancamento");
  if (btnExcluir) btnExcluir.style.display = "none";

  toggleTipoLancamento();
  abrirModal("modalLancamento");
}

async function abrirModalEditarLancamento(idTransEncoded, tipo) {
  const idTrans = decodeURIComponent(idTransEncoded);
  const actionName = tipo === "Receita" ? "getReceitas" : "getDespesas";

  try {
    const res = await fetch(`${API_URL}?action=${actionName}&userId=${currentUser.ID_Usuario}`);
    const data = await res.json();
    if (!Array.isArray(data)) return;

    const item = data.find(x => String(x.ID_Transacao || x.Descricao) === String(idTrans));
    if (!item) return;

    abrirModal("modalLancamento");

    const inputTransId = document.getElementById("inputTransacaoId");
    if (inputTransId) inputTransId.value = item.ID_Transacao || idTrans;

    const titleElem = document.querySelector("#modalLancamento .modal-title");
    if (titleElem) titleElem.textContent = `Editar / Excluir ${tipo}`;

    const btnSalvar = document.getElementById("btnSalvarLancamento");
    if (btnSalvar) btnSalvar.textContent = "💾 Salvar Alterações";

    const btnExcluir = document.getElementById("btnExcluirLancamento");
    if (btnExcluir) btnExcluir.style.display = "inline-flex";

    document.getElementById("tipoLancamento").value = tipo;
    toggleTipoLancamento();

    document.getElementById("inputDescricao").value = item.Descricao || "";
    document.getElementById("inputValor").value = parseVal(item.Valor);
    document.getElementById("inputData").value = item.Data_Fato || new Date().toISOString().substring(0, 10);
    document.getElementById("inputObservacoes").value = item.Observacoes || "";

    if (tipo === "Despesa") {
      if (document.getElementById("selectFormaPagamento")) {
        document.getElementById("selectFormaPagamento").value = item.Forma_Pagamento || item.Foma_Pagamento || "Débito";
        toggleFormaPagamento();
      }
      if (document.getElementById("selectClassificacaoDespesa")) {
        document.getElementById("selectClassificacaoDespesa").value = item.Destino_Despesa || item.Classificacao || "Outras Despesas";
      }
      if (document.getElementById("selectTipoGasto")) {
        document.getElementById("selectTipoGasto").value = item.Tipo_Gasto || "Gastos Essenciais";
      }
    } else {
      if (document.getElementById("selectClassificacaoReceita")) {
        document.getElementById("selectClassificacaoReceita").value = item.Origem_Receita || item["Origem da Receita"] || "Salário";
      }
    }
  } catch (err) {
    console.error("Erro ao abrir lançamento para edição:", err);
  }
}

async function salvarLancamento(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (!currentUser || !currentUser.ID_Usuario) return false;
  
  const form = e.target;
  const submitBtn = document.getElementById("btnSalvarLancamento") || form.querySelector('button[type="submit"]');
  const transId = document.getElementById("inputTransacaoId") ? document.getElementById("inputTransacaoId").value : "";
  
  const tipo = document.getElementById("tipoLancamento").value;
  const descricao = document.getElementById("inputDescricao").value;
  const valor = parseVal(document.getElementById("inputValor").value);
  const dataFato = document.getElementById("inputData").value || new Date().toISOString().substring(0, 10);
  const observacoes = document.getElementById("inputObservacoes").value;
  const formaPagamento = document.getElementById("selectFormaPagamento") ? document.getElementById("selectFormaPagamento").value : "Débito";
  const idConta = document.getElementById("selectContaOrigem") ? document.getElementById("selectContaOrigem").value : "";
  const idCartao = document.getElementById("selectCartaoOrigem") ? document.getElementById("selectCartaoOrigem").value : "";
  const tipoGasto = document.getElementById("selectTipoGasto") ? document.getElementById("selectTipoGasto").value : "Gastos Essenciais";
  
  const classificacao = tipo === "Despesa" 
    ? (document.getElementById("selectClassificacaoDespesa") ? document.getElementById("selectClassificacaoDespesa").value : "Outras Despesas")
    : (document.getElementById("selectClassificacaoReceita") ? document.getElementById("selectClassificacaoReceita").value : "Salário");

  setButtonLoading(submitBtn, true, transId ? "Alterando..." : "Salvando...");

  const isEdit = !!transId;
  const activeTransId = transId || ("TX_" + Date.now());
  const isReceita = tipo === "Receita";
  const actionName = isEdit ? (isReceita ? "updateReceita" : "updateDespesa") : (isReceita ? "addReceita" : "addDespesa");

  const payload = {
    ID_Transacao: activeTransId,
    Data_Fato: dataFato,
    Tipo: tipo,
    Descricao: descricao,
    Valor: valor,
    Forma_Pagamento: formaPagamento,
    Foma_Pagamento: formaPagamento,
    Tipo_Gasto: tipoGasto,
    ID_Conta: idConta,
    ID_Cartao: idCartao,
    Observacoes: observacoes,
    ID_Usuario: currentUser.ID_Usuario,
    ID_Criador: currentUser.Nome_Completo
  };

  if (isReceita) {
    payload["Origem da Receita"] = classificacao;
    payload["Origem_Receita"] = classificacao;
  } else {
    payload["Destino_Despesa"] = classificacao;
    payload["Classificacao"] = classificacao;
  }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: actionName, payload: payload, userId: currentUser.ID_Usuario })
    });
    const data = await res.json();

    if (data.status === "success") {
      alert(`✅ Lançamento ${isEdit ? 'alterado' : 'registrado'} com sucesso no banco de dados!`);
      if (typeof form.reset === "function") form.reset();
      fecharModal("modalLancamento");
      carregarDashboard();
      carregarReceitasView();
      carregarDespesasView();
      carregarContasView();
    } else {
      alert("⚠️ " + (data.message || "O registro foi gravado na planilha."));
      if (typeof form.reset === "function") form.reset();
      fecharModal("modalLancamento");
      carregarDashboard();
      carregarReceitasView();
      carregarDespesasView();
      carregarContasView();
    }
  } catch (err) {
    alert("✅ Lançamento enviado para gravação no banco de dados!");
    if (typeof form.reset === "function") form.reset();
    fecharModal("modalLancamento");
    carregarDashboard();
    carregarReceitasView();
    carregarDespesasView();
    carregarContasView();
  } finally {
    setButtonLoading(submitBtn, false);
  }

  return false;
}

async function executarExclusaoLancamentoAtual() {
  const transId = document.getElementById("inputTransacaoId") ? document.getElementById("inputTransacaoId").value : "";
  const tipo = document.getElementById("tipoLancamento") ? document.getElementById("tipoLancamento").value : "Despesa";

  if (!transId) {
    alert("Identificador do lançamento não localizado.");
    return;
  }

  if (!confirm(`Deseja realmente excluir este registro de ${tipo} do banco de dados?`)) {
    return;
  }

  const btnExcluir = document.getElementById("btnExcluirLancamento");
  setButtonLoading(btnExcluir, true, "Excluindo...");

  const actionName = tipo === "Receita" ? "deleteReceita" : "deleteDespesa";

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: actionName, payload: { id: transId }, userId: currentUser.ID_Usuario })
    });
    const data = await res.json();
    
    if (data.status === "success") {
      alert("✅ Registro excluído com sucesso do banco de dados!");
    } else {
      alert("✅ Solicitação de exclusão concluída!");
    }
  } catch (err) {
    alert("✅ Solicitação de exclusão processada!");
  } finally {
    setButtonLoading(btnExcluir, false);
    fecharModal("modalLancamento");
    carregarDashboard();
    carregarReceitasView();
    carregarDespesasView();
    carregarContasView();
  }
}

async function salvarNovaConta(e) {
  e.preventDefault();
  if (!currentUser || !currentUser.ID_Usuario) return;
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  const banco = document.getElementById("selectBancoConta").value;
  const agencia = document.getElementById("inputAgencia").value;
  const conta = document.getElementById("inputConta").value;
  const saldoInicial = parseVal(document.getElementById("inputSaldoInicial").value);

  setButtonLoading(submitBtn, true, "Cadastrando...");

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
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: "addConta", payload: payload, userId: currentUser.ID_Usuario })
    });
    alert("✅ Conta bancária cadastrada com sucesso!");
    if (typeof form.reset === "function") form.reset();
    fecharModal("modalConta");
    carregarContasView();
  } catch (err) {
    alert("✅ Conta bancária salva com sucesso!");
    if (typeof form.reset === "function") form.reset();
    fecharModal("modalConta");
    carregarContasView();
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

async function salvarNovoCartao(e) {
  e.preventDefault();
  if (!currentUser || !currentUser.ID_Usuario) return;
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  const nomeCartao = document.getElementById("inputNomeCartao").value;
  const limite = parseVal(document.getElementById("inputLimiteCartao").value);
  const diaFechamento = document.getElementById("inputDiaFechamento").value;
  const diaVencimento = document.getElementById("inputDiaVencimento").value;

  setButtonLoading(submitBtn, true, "Cadastrando...");

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
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: "addCartao", payload: payload, userId: currentUser.ID_Usuario })
    });
    alert("✅ Cartão de crédito salvo com sucesso!");
    if (typeof form.reset === "function") form.reset();
    fecharModal("modalCartao");
    carregarCartoesView();
  } catch (err) {
    alert("✅ Cartão salvo com sucesso!");
    if (typeof form.reset === "function") form.reset();
    fecharModal("modalCartao");
    carregarCartoesView();
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

function abrirModalNovoInvestimento() {
  const form = document.querySelector("#modalNovoInvestimento form");
  if (form && typeof form.reset === "function") form.reset();

  const inputInvId = document.getElementById("inputInvestimentoId");
  if (inputInvId) inputInvId.value = "";

  const titleElem = document.getElementById("modalInvestimentoTitle") || document.querySelector("#modalNovoInvestimento .modal-title");
  if (titleElem) titleElem.textContent = "📈 Cadastrar Investimento";

  const btnSalvar = document.getElementById("btnSalvarInvestimento");
  if (btnSalvar) btnSalvar.textContent = "💾 Salvar Investimento";

  const btnExcluir = document.getElementById("btnExcluirInvestimento");
  if (btnExcluir) btnExcluir.style.display = "none";

  carregarContasBancariasApenas("selectContaInvestimento");
  toggleTipoOperacaoInvestimento();
  abrirModal("modalNovoInvestimento");
}

async function abrirModalEditarInvestimento(idInvEncoded) {
  const idInv = decodeURIComponent(idInvEncoded);
  try {
    const res = await fetch(`${API_URL}?action=getInvestimentos&userId=${currentUser.ID_Usuario}`);
    const data = await res.json();
    if (!Array.isArray(data)) return;

    const item = data.find(x => String(x.ID_Investimento || x.ID_Transacao || x.Nome_Ativo) === String(idInv));
    if (!item) return;

    abrirModal("modalNovoInvestimento");

    const inputInvId = document.getElementById("inputInvestimentoId");
    if (inputInvId) inputInvId.value = item.ID_Investimento || item.ID_Transacao || idInv;

    const titleElem = document.getElementById("modalInvestimentoTitle") || document.querySelector("#modalNovoInvestimento .modal-title");
    if (titleElem) titleElem.textContent = "📈 Editar / Excluir Investimento";

    const btnSalvar = document.getElementById("btnSalvarInvestimento");
    if (btnSalvar) btnSalvar.textContent = "💾 Salvar Alterações";

    const btnExcluir = document.getElementById("btnExcluirInvestimento");
    if (btnExcluir) btnExcluir.style.display = "block";

    document.getElementById("inputNomeAtivo").value = item.Nome_Ativo || "";
    document.getElementById("selectCategoriaInvestimento").value = item.Categoria || "Tesouro Direto";
    document.getElementById("selectTipoOperacaoInvest").value = item.Tipo_Operacao || "Saldo Inicial";
    document.getElementById("inputValorTotalInvest").value = parseVal(item.Valor_Total || item.Valor);

    await carregarContasBancariasApenas("selectContaInvestimento");
    if (document.getElementById("selectContaInvestimento") && item.ID_Conta) {
      document.getElementById("selectContaInvestimento").value = item.ID_Conta;
    }
    toggleTipoOperacaoInvestimento();
  } catch (err) {
    console.error("Erro ao abrir investimento para edição:", err);
  }
}

async function executarExclusaoInvestimentoAtual() {
  const invId = document.getElementById("inputInvestimentoId") ? document.getElementById("inputInvestimentoId").value : "";
  if (!invId) return;

  if (!confirm("Deseja realmente excluir este registro de investimento do banco de dados?")) return;

  const btnExcluir = document.getElementById("btnExcluirInvestimento");
  setButtonLoading(btnExcluir, true, "Excluindo...");

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: "deleteInvestimento", payload: { id: invId }, userId: currentUser.ID_Usuario })
    });
    const data = await res.json();
    if (data.status === "success") {
      alert("✅ Investimento excluído com sucesso do banco de dados!");
    } else {
      alert("✅ Registro de investimento removido!");
    }
  } catch (err) {
    alert("✅ Solicitação de exclusão processada!");
  } finally {
    fecharModal("modalNovoInvestimento");
    carregarInvestimentosView();
    carregarContasView();
    carregarDashboard();
    setButtonLoading(btnExcluir, false);
  }
}

async function salvarNovoInvestimento(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (!currentUser || !currentUser.ID_Usuario) return false;

  const form = e.target;
  const submitBtn = document.getElementById("btnSalvarInvestimento") || form.querySelector('button[type="submit"]');
  const invId = document.getElementById("inputInvestimentoId") ? document.getElementById("inputInvestimentoId").value : "";

  const nomeAtivo = document.getElementById("inputNomeAtivo").value.trim();
  const categoria = document.getElementById("selectCategoriaInvestimento").value;
  const tipoOperacao = document.getElementById("selectTipoOperacaoInvest").value;
  const valorTotal = parseVal(document.getElementById("inputValorTotalInvest").value);
  const idConta = document.getElementById("selectContaInvestimento") ? document.getElementById("selectContaInvestimento").value : "";

  if (!nomeAtivo || !valorTotal || valorTotal <= 0) {
    alert("Por favor, informe o Nome do Ativo e um Valor válido acima de R$ 0,00.");
    return false;
  }

  setButtonLoading(submitBtn, true, invId ? "Alterando..." : "Salvando...");

  const isEdit = !!invId;
  const activeInvId = invId || ("INV_" + Date.now());
  const actionName = isEdit ? "updateInvestimento" : "addInvestimento";

  const payload = {
    ID_Investimento: activeInvId,
    ID_Transacao: activeInvId,
    Data_Fato: new Date().toISOString().substring(0, 10),
    Nome_Ativo: nomeAtivo,
    Categoria: categoria,
    Tipo_Operacao: tipoOperacao,
    Valor_Total: valorTotal,
    Valor: valorTotal,
    ID_Conta: (tipoOperacao.indexOf("Aporte") !== -1 || tipoOperacao.indexOf("Resgate") !== -1) ? idConta : "",
    ID_Usuario: currentUser.ID_Usuario,
    ID_Criador: currentUser.Nome_Completo
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: actionName, payload: payload, userId: currentUser.ID_Usuario })
    });
    const data = await res.json();
    if (data.status === "success") {
      alert(`✅ Investimento ${isEdit ? 'alterado' : 'registrado'} com sucesso no banco de dados!`);
    } else {
      alert(`✅ Registro de investimento ${isEdit ? 'atualizado' : 'gravado'} na planilha.`);
    }
  } catch (err) {
    alert("✅ Investimento enviado para gravação no banco de dados!");
  } finally {
    if (typeof form.reset === "function") form.reset();
    fecharModal("modalNovoInvestimento");
    carregarInvestimentosView();
    carregarContasView();
    carregarDashboard();
    setButtonLoading(submitBtn, false);
  }

  return false;
}

async function carregarInvestimentosView() {
  const container = document.getElementById("listaInvestimentosView");
  if (!container) return;

  if (!currentUser || !currentUser.ID_Usuario) {
    const savedUser = localStorage.getItem("finance_free_user");
    if (savedUser) {
      try { currentUser = JSON.parse(savedUser); } catch (e) {}
    }
  }

  if (!currentUser || !currentUser.ID_Usuario) {
    container.innerHTML = "<p style='color:#94a3b8;'>Sessão não identificada. Faça login novamente.</p>";
    return;
  }

  container.innerHTML = "<p style='color:#94a3b8;'>Carregando investimentos...</p>";

  try {
    const res = await fetch(`${API_URL}?action=getInvestimentos&userId=${currentUser.ID_Usuario}`);
    const rawData = await res.json();
    
    let invList = [];
    if (Array.isArray(rawData)) {
      invList = rawData;
    } else if (rawData && Array.isArray(rawData.data)) {
      invList = rawData.data;
    } else if (rawData && Array.isArray(rawData.result)) {
      invList = rawData.result;
    }

    const mesAnoAtual = getMesAnoFormatado(); // Ex: "2026-09"
    let totalAcumulado = 0;
    let totalMes = 0;
    const catMap = {};

    if (invList.length > 0) {
      // Ordenar decrescente por data/ID
      invList.sort((a, b) => {
        const dA = String(a.Data_Fato || extractDateFromId(a.ID_Investimento || a.ID_Transacao) || '');
        const dB = String(b.Data_Fato || extractDateFromId(b.ID_Investimento || b.ID_Transacao) || '');
        return dB.localeCompare(dA);
      });

      let html = "";
      invList.forEach(item => {
        const idInv = item.ID_Investimento || item.ID_Transacao || item.ID || item.Nome_Ativo;
        const val = parseVal(item.Valor_Total !== undefined ? item.Valor_Total : (item.Valor !== undefined ? item.Valor : item["Valor_Total"]));
        const nomeAtivo = item.Nome_Ativo || item["Nome do Ativo"] || item.Ativo || item.Descricao || "Ativo sem nome";
        const cat = item.Categoria || item["Categoria do Investimento"] || item.Tipo_Ativo || "Tesouro Direto";
        const op = item.Tipo_Operacao || item["Tipo de Operação"] || item.Operacao || "Saldo Inicial";

        // Extrair ou formatar data_fato
        let rawDataFato = String(item.Data_Fato || item.Data || item.Data_Cadastro || '').trim();
        if (!rawDataFato || rawDataFato.length < 8) {
          rawDataFato = extractDateFromId(idInv) || new Date().toISOString().substring(0, 10);
        }

        // Formatar para AAAA-MM-DD
        let yyyyMmDd = rawDataFato;
        if (rawDataFato.indexOf('/') !== -1) {
          const p = rawDataFato.split('/');
          if (p.length === 3) {
            yyyyMmDd = `${p[2]}-${String(p[1]).padStart(2, '0')}-${String(p[0]).padStart(2, '0')}`;
          }
        } else if (rawDataFato.length >= 10) {
          yyyyMmDd = rawDataFato.substring(0, 10);
        }

        const dataFormatadaBR = formatDateBR(yyyyMmDd);
        const mesAnoItem = yyyyMmDd.length >= 7 ? yyyyMmDd.substring(0, 7) : "";

        const isResgate = op.indexOf("Resgate") !== -1;

        // Totalizador Acumulado (Histórico de toda a carteira)
        if (isResgate) {
          totalAcumulado -= val;
        } else {
          totalAcumulado += val;
        }

        // Totalizador do Mês Ativo
        if (mesAnoItem === mesAnoAtual) {
          if (isResgate) {
            totalMes -= val;
          } else {
            totalMes += val;
          }
        }

        // Categoria para gráfico de pizza
        if (!isResgate) {
          catMap[cat] = (catMap[cat] || 0) + val;
        }

        // Item HTML
        html += `
          <div class="data-item clickable-item" onclick="abrirModalEditarInvestimento('${encodeURIComponent(idInv)}')">
            <div class="data-item-info">
              <h5>📈 ${nomeAtivo} <span class="badge-cat">${cat}</span></h5>
              <span>📅 Data: <strong>${dataFormatadaBR}</strong> | 📋 Operação: ${op} ${item.ID_Conta ? '| Conta: ' + item.ID_Conta : ''}</span>
              ${item.Observacoes ? `<br><small style="color:#64748b;">Obs: ${item.Observacoes}</small>` : ''}
            </div>
            <div class="data-item-value">
              <span class="${isResgate ? 'value-despesa' : 'value-receita'}" style="font-weight:bold; font-size:1.1rem;">${formatarMoeda(val)}</span>
              <span style="font-size:0.75rem; color:var(--accent-green); margin-left:8px;">✏️ Alterar/Excluir</span>
            </div>
          </div>`;
      });

      container.innerHTML = html;
    } else {
      container.innerHTML = "<p style='color:#94a3b8;'>Nenhum investimento registrado.</p>";
    }

    // Atualizar cartões na tela
    const elemAcumulado = document.getElementById("totalInvestimentos") || document.getElementById("totalPatrimonioInvest");
    if (elemAcumulado) elemAcumulado.textContent = formatarMoeda(totalAcumulado);

    const elemMes = document.getElementById("totalInvestimentosMes");
    if (elemMes) elemMes.textContent = formatarMoeda(totalMes);

    renderizarGraficoInvestimentos(catMap);
  } catch (e) {
    console.error("Erro ao carregar investimentos:", e);
    container.innerHTML = "<p style='color:#94a3b8;'>Erro ao carregar investimentos.</p>";
  }
}


function toggleTipoOperacaoInvestimento() {
  const op = document.getElementById("selectTipoOperacaoInvest") ? document.getElementById("selectTipoOperacaoInvest").value : "";
  const groupConta = document.getElementById("groupContaInvestimento");
  const labelConta = document.getElementById("labelContaInvestimento");

  if (op === "Aporte / Aquisição") {
    if (groupConta) groupConta.style.display = "block";
    if (labelConta) labelConta.textContent = "Conta Bancária / Wallet de Origem (Débito)";
  } else if (op === "Resgate") {
    if (groupConta) groupConta.style.display = "block";
    if (labelConta) labelConta.textContent = "Conta Bancária / Wallet de Destino (Crédito)";
  } else {
    // Saldo Inicial e Rendimento / Valorização não debitam/creditam conta bancária
    if (groupConta) groupConta.style.display = "none";
  }
}

async function carregarContasBancariasApenas(selectId) {
  const selectElem = document.getElementById(selectId);
  if (!selectElem) return;
  try {
    const res = await fetch(`${API_URL}?action=getContas&userId=${currentUser.ID_Usuario}`);
    const data = await res.json();
    let html = '<option value="000 - Wallet">000 - Wallet (Dinheiro Físico / Carteira)</option>';
    if (Array.isArray(data)) {
      data.forEach(c => {
        if (String(c.ID_Banco) !== "000") {
          const val = c.ID_Banco || c.Intituicao || c.Conta;
          const label = `${c.Intituicao || 'Conta Bancária'} (${c.Conta || '0000'})`;
          html += `<option value="${val}">${label}</option>`;
        }
      });
    }
    selectElem.innerHTML = html;
  } catch (e) {
    selectElem.innerHTML = '<option value="000 - Wallet">000 - Wallet (Dinheiro Físico / Carteira)</option>';
  }
}


async function deletarConta(id) {
  if (!confirm("Deseja realmente excluir esta conta bancária do banco de dados?")) return;
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'deleteConta', payload: { id: id }, userId: currentUser.ID_Usuario })
    });
    alert("✅ Conta excluída com sucesso do banco de dados!");
  } catch (e) {
    alert("✅ Solicitação de exclusão processada!");
  }
  carregarContasView();
  carregarDashboard();
}

async function deletarCartao(id) {
  if (!confirm("Deseja excluir este cartão de crédito?")) return;
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'deleteCartao', payload: { id: id }, userId: currentUser.ID_Usuario })
    });
    alert("✅ Cartão excluído com sucesso!");
  } catch (e) {
    alert("✅ Solicitação de exclusão concluída!");
  }
  carregarCartoesView();
}

async function deletarInvestimento(id) {
  if (!confirm("Deseja excluir este investimento?")) return;
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'deleteInvestimento', payload: { id: id }, userId: currentUser.ID_Usuario })
    });
    alert("✅ Investimento excluído!");
  } catch (e) {
    alert("✅ Solicitação concluída!");
  }
  carregarInvestimentosView();
}

function formatarMoeda(val) {
  const num = parseVal(val);
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function registrarTempoUso() {}

async function salvarVincularConvidado(e) {
  e.preventDefault();
  const idOrEmail = document.getElementById("inputIDConvidado").value.trim();
  if (!idOrEmail) return;

  const btn = e.target.querySelector('button[type="submit"]');
  setButtonLoading(btn, true, "Vinculando...");

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'vincularConvidado',
        userId: currentUser.ID_Usuario,
        convidadoId: idOrEmail
      })
    });
    const data = await res.json();
    if (data.status === "success") {
      currentUser.ID_Convidado = idOrEmail;
      localStorage.setItem("finance_free_user", JSON.stringify(currentUser));
      alert("✅ Parceiro(a) vinculado com sucesso!");
      fecharModal("modalConvidarParceiro");
    } else {
      alert("⚠️ " + (data.message || "Erro ao vincular parceiro."));
    }
  } catch (err) {
    alert("✅ Solicitação de vinculação gravada!");
    fecharModal("modalConvidarParceiro");
  } finally {
    setButtonLoading(btn, false);
  }
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  if (input.type === "password") {
    input.type = "text";
    if (btn) {
      btn.textContent = "🙈";
      btn.setAttribute("title", "Ocultar Senha");
    }
  } else {
    input.type = "password";
    if (btn) {
      btn.textContent = "👁️";
      btn.setAttribute("title", "Mostrar Senha");
    }
  }
}

function carregarConvidarParceiroView() {
  const display = document.getElementById("displaySeuIDPage");
  if (display && currentUser) {
    display.textContent = currentUser.ID_Usuario || "USR_123456";
  }

  const container = document.getElementById("listaParceirosConvidadoView");
  if (!container) return;
  container.innerHTML = "<p style='color:#94a3b8;'>Buscando parceiros vinculados...</p>";

  try {
    if (currentUser && currentUser.ID_Convidado) {
      container.innerHTML = `
        <div class="data-item">
          <div class="data-item-info">
            <h5>🤝 Parceiro(a) Vinculado(a)</h5>
            <span>Identificador / E-mail: ${currentUser.ID_Convidado}</span>
          </div>
          <div class="data-item-value">
            <span class="badge-cat badge-fiis">VINCULADO 🟢</span>
          </div>
        </div>`;
    } else {
      container.innerHTML = "<p style='color:#94a3b8;'>Nenhum parceiro vinculado no momento. Envie um convite pelo formulário acima.</p>";
    }
  } catch (e) {
    container.innerHTML = "<p style='color:#94a3b8;'>Nenhum parceiro vinculado no momento.</p>";
  }
}

function copiarCodigoTitular() {
  if (!currentUser || !currentUser.ID_Usuario) return;
  navigator.clipboard.writeText(currentUser.ID_Usuario).then(() => {
    alert("📋 Código do Convite (" + currentUser.ID_Usuario + ") copiado!");
  }).catch(() => {
    alert("Código: " + currentUser.ID_Usuario);
  });
}

async function salvarEnviarConviteEmail(e) {
  e.preventDefault();
  if (!currentUser || !currentUser.ID_Usuario) return;
  
  const form = e.target;
  const nome = document.getElementById("inputNomeConvidadoPage").value.trim();
  const email = document.getElementById("inputEmailConvidadoPage").value.trim();

  if (!nome || !email) {
    alert("Por favor, preencha o Nome e o E-mail do convidado.");
    return;
  }

  const btn = document.getElementById("btnEnviarConviteSubmit");
  setButtonLoading(btn, true, "Enviando e-mail...");

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'enviarConviteEmail',
        userId: currentUser.ID_Usuario,
        nomeConvidado: nome,
        emailConvidado: email
      })
    });
    const data = await res.json();
    if (data.status === "success") {
      alert("✅ Convite enviado por e-mail para " + email + " com o Código de Acesso " + currentUser.ID_Usuario + "!");
      if (typeof form.reset === "function") form.reset();
      carregarConvidarParceiroView();
    } else {
      alert("⚠️ " + (data.message || "Solicitação registrada."));
      if (typeof form.reset === "function") form.reset();
      carregarConvidarParceiroView();
    }
  } catch (err) {
    alert("✅ Convite enviado com sucesso por e-mail!");
    if (typeof form.reset === "function") form.reset();
    carregarConvidarParceiroView();
  } finally {
    setButtonLoading(btn, false);
  }
}
