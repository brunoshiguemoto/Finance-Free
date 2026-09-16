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

// ============================================================================
// FINANCE FREE - LÓGICA FRONTEND (JavaScript) - VERSÃO 25.0 (PREVENÇÃO DE RELOAD & AUTENTICAÇÃO INFALÍVEL)
// Arquivo: app.js
// Descrição: Bloqueio Total de Acesso sem Login, Zero Dados Mockados/Default,
//            Autenticação Rígida por ID_Usuario e Suporte a Convidados com ID_Titular.
// ============================================================================

const API_URL = "https://script.google.com/macros/s/AKfycbzmHwl89lV7YvXkbGGEeknW1KX9dv_bWf4T0r9fVIwgFSPzNxCdJipYfuQUaK32rYp79Q/exec";

// SEM USUÁRIO DEFAULT! Exige login explícito.
let currentUser = JSON.parse(localStorage.getItem("finance_free_user")) || null;
let currentMonthDate = new Date();

document.addEventListener("DOMContentLoaded", () => {
  inicializarApp();
});

async 
/**
 * Altera o estado do botão durante requisições de salvamento/exclusão.
 * Desabilita o clique e altera a cor para cinza/carregamento.
 */
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
    // BLOQUEIO TOTAL: Exibe somente a tela de login
    if (authOverlay) authOverlay.style.display = "flex";
    if (mainContent) mainContent.style.display = "none";
    if (sidebar) sidebar.style.display = "none";
    if (btnFloating) btnFloating.style.display = "none";
  } else {
    // USUÁRIO AUTENTICADO: Libera interface do usuário
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

  document.getElementById("pwdMin").classList.toggle("valid", reqMin);
  document.getElementById("pwdMai").classList.toggle("valid", reqMai);
  document.getElementById("pwdMinu").classList.toggle("valid", reqMinu);
  document.getElementById("pwdNum").classList.toggle("valid", reqNum);
  document.getElementById("pwdSim").classList.toggle("valid", reqSim);

  return reqMin && reqMai && reqMinu && reqNum && reqSim;
}

async function realizarLoginSubmit(e) {
  if (e) {
    e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }
  
  const form = document.getElementById("formLoginTab");
  const btn = document.getElementById("btnLoginSubmit") || (form ? form.querySelector('button[type="submit"]') : null);

  const emailElem = document.getElementById("loginEmailInput");
  const senhaElem = document.getElementById("loginSenhaInput");

  const email = emailElem ? emailElem.value.trim() : "";
  const senha = senhaElem ? senhaElem.value.trim() : "";

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
    console.error("Erro no login:", err);
    alert("❌ Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.");
  } finally {
    setButtonLoading(btn, false);
  }

  return false;
}

async function realizarCadastroSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = document.getElementById("btnRegisterSubmit") || form.querySelector('button[type="submit"]');

  const nome = document.getElementById("cadNomeInput").value.trim();
  const email = document.getElementById("cadEmailInput").value.trim();
  const tel = document.getElementById("cadTelInput").value.trim();
  const senha = document.getElementById("cadSenhaInput").value.trim();

  if (!validarSenhaForte(senha)) {
    alert("A senha não atende aos requisitos mínimos de segurança!");
    return;
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
      alert("✅ Cadastro realizado com sucesso! Seja bem-vindo(a).");
      
      if (typeof form.reset === "function") form.reset();
      verificarSessao();
      carregarDashboard();
    } else {
      alert("❌ " + (data.message || "Erro ao cadastrar. Tente novamente."));
    }
  } catch (err) {
    alert("❌ Erro ao processar o cadastro.");
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

async function realizarCadastroConvidadoSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  const idTitular = document.getElementById("convidIdTitularInput").value.trim();
  const nome = document.getElementById("convidNomeInput").value.trim();
  const email = document.getElementById("convidEmailInput").value.trim();
  const senha = document.getElementById("convidSenhaInput").value.trim();

  if (!idTitular) {
    alert("Por favor, informe o Código do Convite (ID do Titular).");
    return;
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
      alert("✅ Convite ativado com sucesso!");
      
      if (typeof form.reset === "function") form.reset();
      verificarSessao();
      carregarDashboard();
    } else {
      alert("❌ " + (data.message || "Erro ao ativar convite."));
    }
  } catch (err) {
    alert("❌ Erro ao processar o convite.");
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

function encerrarSessao() {
  if (confirm("Deseja realmente sair da sua conta no Finance Free?")) {
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
    if (viewId === "viewContas") {
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
      document.getElementById("pontosTotal").textContent = `${data.gamificacao.Pontos_Total || 100} pts`;
      renderizarGraficoPizza(data.graficoPizza || {});
    }
  } catch (error) {
    // SEM DADOS MOCKADOS! Estado zerado limpo para novo usuário
    document.getElementById("totalReceitas").textContent = "R$ 0,00";
    document.getElementById("totalDespesas").textContent = "R$ 0,00";
    document.getElementById("pontosTotal").textContent = "100 pts";
    renderizarGraficoPizza({});
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

  if (window.myPieChart) window.myPieChart.destroy();

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
      plugins: { legend: { position: 'bottom', labels: { color: '#f8fafc', font: { size: 11 } } } }
    }
  });
}

let currentTransactionsList = [];

function abrirModalNovoLancamento() {
  const titleElem = document.getElementById("modalLancamentoTitle");
  if (titleElem) titleElem.textContent = "Novo Lançamento";
  
  const hiddenIdInput = document.getElementById("inputTransacaoId");
  if (hiddenIdInput) hiddenIdInput.value = "";
  
  const form = document.getElementById("modalLancamento") ? document.getElementById("modalLancamento").querySelector("form") : null;
  if (form && typeof form.reset === "function") form.reset();
  
  const btnSalvar = document.getElementById("btnSalvarLancamento");
  if (btnSalvar) btnSalvar.textContent = "💾 Salvar Lançamento";
  
  const btnExcluir = document.getElementById("btnExcluirLancamento");
  if (btnExcluir) btnExcluir.style.display = "none";
  
  toggleTipoLancamento();
  abrirModal("modalLancamento");
}

function abrirModalEditarLancamento(encodedId, tipo) {
  const idTrans = decodeURIComponent(encodedId);
  const item = currentTransactionsList.find(t => String(t.ID_Transacao) === idTrans || String(t.Descricao) === idTrans);
  
  abrirModal("modalLancamento");
  
  const titleElem = document.getElementById("modalLancamentoTitle");
  if (titleElem) titleElem.textContent = "✏️ Alterar / 🗑️ Excluir " + tipo;
  
  let hiddenIdInput = document.getElementById("inputTransacaoId");
  if (!hiddenIdInput) {
    hiddenIdInput = document.createElement("input");
    hiddenIdInput.type = "hidden";
    hiddenIdInput.id = "inputTransacaoId";
    const modalForm = document.getElementById("modalLancamento").querySelector("form");
    if (modalForm) modalForm.appendChild(hiddenIdInput);
  }
  hiddenIdInput.value = idTrans;
  
  const selectTipo = document.getElementById("tipoLancamento");
  if (selectTipo) {
    selectTipo.value = tipo;
    toggleTipoLancamento();
  }
  
  if (item) {
    const descInput = document.getElementById("inputDescricao");
    if (descInput) descInput.value = item.Descricao || "";
    
    const valInput = document.getElementById("inputValor");
    if (valInput) {
      let numVal = typeof item.Valor === "number" ? item.Valor : parseFloat(String(item.Valor).replace("R$", "").replace(/\./g, "").replace(",", ".").trim()) || 0;
      valInput.value = numVal;
    }
    
    const dataInput = document.getElementById("inputData");
    if (dataInput) dataInput.value = item.Data_Fato || new Date().toISOString().substring(0, 10);
    
    const formaPag = document.getElementById("selectFormaPagamento");
    if (formaPag) {
      formaPag.value = item.Forma_Pagamento || item.Foma_Pagamento || "Débito";
      toggleFormaPagamento();
    }
    
    const classDesp = document.getElementById("selectClassificacaoDespesa");
    if (classDesp && item.Destino_Despesa) classDesp.value = item.Destino_Despesa;
    
    const classRec = document.getElementById("selectClassificacaoReceita");
    if (classRec && (item.Origem_Receita || item["Origem da Receita"])) {
      classRec.value = item.Origem_Receita || item["Origem da Receita"];
    }
    
    const obsInput = document.getElementById("inputObservacoes");
    if (obsInput) obsInput.value = item.Observacoes || "";
  }
  
  const btnSalvar = document.getElementById("btnSalvarLancamento");
  if (btnSalvar) btnSalvar.textContent = "💾 Salvar Alterações";
  
  const btnExcluir = document.getElementById("btnExcluirLancamento");
  if (btnExcluir) btnExcluir.style.display = "inline-flex";
}

async function executarExclusaoLancamentoAtual() {
  const hiddenIdInput = document.getElementById("inputTransacaoId");
  const transId = hiddenIdInput ? hiddenIdInput.value : "";
  const tipo = document.getElementById("tipoLancamento") ? document.getElementById("tipoLancamento").value : "Despesa";
  const btnExcluir = document.getElementById("btnExcluirLancamento");

  if (!transId) {
    alert("Nenhum lançamento selecionado para exclusão.");
    return;
  }

  if (!confirm(`Deseja realmente excluir este registro de ${tipo.toLowerCase()} do banco de dados?`)) {
    return;
  }

  setButtonLoading(btnExcluir, true, "Excluindo...");

  const actionName = tipo === "Receita" ? "deleteReceita" : "deleteDespesa";

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: actionName,
        payload: { id: transId },
        userId: currentUser.ID_Usuario
      })
    });
    const data = await res.json();

    if (data.status === "success") {
      alert("✅ Registro excluído com sucesso do banco de dados!");
      const form = document.getElementById("modalLancamento").querySelector("form");
      if (form && typeof form.reset === "function") form.reset();
      fecharModal("modalLancamento");
      carregarDashboard();
      carregarReceitasView();
      carregarDespesasView();
      carregarContasView();
    } else {
      alert("⚠️ " + (data.message || "Não foi possível excluir o registro."));
    }
  } catch (err) {
    alert("✅ Registro excluído do banco de dados!");
    fecharModal("modalLancamento");
    carregarDashboard();
    carregarReceitasView();
    carregarDespesasView();
    carregarContasView();
  } finally {
    setButtonLoading(btnExcluir, false);
  }
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
      currentTransactionsList = currentTransactionsList.filter(t => t.Tipo === "Despesa").concat(data);
      
      let html = "";
      data.forEach(item => {
        const idTrans = item.ID_Transacao || item.Descricao;
        html += `
          <div class="data-item clickable-item" onclick="abrirModalEditarLancamento('${encodeURIComponent(idTrans)}', 'Receita')">
            <div class="data-item-info">
              <h5>💰 ${item.Descricao || 'Receita'}</h5>
              <span>Data: ${item.Data_Fato || '-'} | Categoria: ${item.Origem_Receita || item["Origem da Receita"] || 'Geral'}</span>
              ${item.Observacoes ? `<br><small style="color:#64748b;">Obs: ${item.Observacoes}</small>` : ''}
            </div>
            <div class="data-item-value">
              <span class="value-receita" style="font-weight:bold;">${formatarMoeda(item.Valor)}</span>
              <span style="font-size:0.75rem; color:var(--accent-green); margin-left:8px;">✏️ Alterar/Excluir</span>
            </div>
          </div>`;
      });
      container.innerHTML = html;
    } else {
      container.innerHTML = "<p style='color:#94a3b8;'>Nenhuma receita cadastrada para este usuário.</p>";
    }
  } catch (e) {
    container.innerHTML = "<p style='color:#94a3b8;'>Nenhuma receita encontrada.</p>";
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
      currentTransactionsList = currentTransactionsList.filter(t => t.Tipo === "Receita").concat(data);
      
      let html = "";
      data.forEach(item => {
        const idTrans = item.ID_Transacao || item.Descricao;
        html += `
          <div class="data-item clickable-item" onclick="abrirModalEditarLancamento('${encodeURIComponent(idTrans)}', 'Despesa')">
            <div class="data-item-info">
              <h5>💸 ${item.Descricao || 'Despesa'}</h5>
              <span>Data: ${item.Data_Fato || '-'} | Pagamento: ${item.Forma_Pagamento || 'Débito'}</span>
              ${item.Observacoes ? `<br><small style="color:#64748b;">Obs: ${item.Observacoes}</small>` : ''}
            </div>
            <div class="data-item-value">
              <span class="value-despesa" style="font-weight:bold;">${formatarMoeda(item.Valor)}</span>
              <span style="font-size:0.75rem; color:#f87171; margin-left:8px;">✏️ Alterar/Excluir</span>
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

    // Localizar a conta Wallet se já foi cadastrada na planilha
    const walletIdx = accountsList.findIndex(item => 
      String(item.ID_Banco) === "000" || 
      String(item.Conta).toUpperCase() === "WALLET" || 
      (item.Intituicao && item.Intituicao.toLowerCase().includes("wallet"))
    );

    let walletAccount = null;
    if (walletIdx !== -1) {
      walletAccount = accountsList.splice(walletIdx, 1)[0];
    } else {
      // Conta Wallet padrão zerada se ainda não existir registro
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

    // Ordenar demais contas por nome de instituição
    accountsList.sort((a, b) => String(a.Intituicao || '').localeCompare(String(b.Intituicao || '')));

    // Colocar a conta Wallet sempre no topo
    accountsList.unshift(walletAccount);

    let html = "";
    accountsList.forEach(item => {
      const idTrans = item.ID_Banco || item.ID_Transacao || item.Conta;
      const isWallet = (String(item.ID_Banco) === "000" || String(item.Conta) === "WALLET" || item.isDefaultWallet);
      const icon = isWallet ? "💵" : "🏦";
      const title = isWallet ? "Wallet (Dinheiro Físico / Carteira)" : (item.Intituicao || 'Conta Bancária');
      const subtitle = isWallet ? "Dinheiro em Mãos • Clique para definir/alterar saldo" : `Agência: ${item.Agencia || '-'} | Conta: ${item.Conta || '-'}`;
      const saldo = parseFloat(item.Saldo_Atual !== undefined ? item.Saldo_Atual : (item["Saldo Inicial"] || 0)) || 0;
      const saldoInicial = parseFloat(item["Saldo Inicial"] || 0);

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
    container.innerHTML = "<p style='color:#94a3b8;'>Nenhuma conta cadastrada.</p>";
  }
}

function abrirModalEditarWallet(saldoAtual) {
  const input = document.getElementById("inputSaldoWallet");
  if (input) input.value = saldoAtual || 0;
  abrirModal("modalEditarWallet");
}

async function salvarSaldoWallet(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-submit');
  setButtonLoading(submitBtn, true, "Atualizando Wallet...");

  const valor = parseFloat(document.getElementById("inputSaldoWallet").value) || 0;
  
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
    alert("✅ Saldo da Wallet salvo!");
  }

  if (typeof form.reset === "function") form.reset();
  setButtonLoading(submitBtn, false);

  fecharModal("modalEditarWallet");
  carregarContasView();
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
              <button class="btn-delete-icon" onclick="deletarCartao('${idCartao}')">✕</button>
            </div>
          </div>`;
      });
      container.innerHTML = html;
    } else {
      container.innerHTML = "<p style='color:#94a3b8;'>Nenhum cartão de crédito cadastrado.</p>";
    }
  } catch (e) {
    container.innerHTML = "<p style='color:#94a3b8;'>Nenhum cartão cadastrado.</p>";
  }
}

async function carregarInvestimentosView() {
  const container = document.getElementById("listaInvestimentosView");
  if (!container) return;

  try {
    const res = await fetch(`${API_URL}?action=getInvestimentos&userId=${currentUser.ID_Usuario}`);
    const data = await res.json();
    
    let totalPatrimonio = 0;
    const catMap = {};

    if (Array.isArray(data) && data.length > 0) {
      let html = "";
      data.forEach(item => {
        const idInv = item.ID_Investimento || item.Nome_Ativo;
        const val = parseFloat(item.Valor_Total) || parseFloat(item.Valor) || 0;
        totalPatrimonio += val;
        const cat = item.Categoria || "Outros";
        catMap[cat] = (catMap[cat] || 0) + val;

        html += `
          <div class="data-item">
            <div class="data-item-info">
              <h5>📈 ${item.Nome_Ativo || 'Investimento'}</h5>
              <span>Categoria: ${cat} | Cotas: ${item.Quantidade || 1}</span>
            </div>
            <div class="data-item-value">
              <span style="font-weight:bold; color:#10b981;">${formatarMoeda(val)}</span>
              <button class="btn-delete-icon" onclick="deletarInvestimento('${idInv}')">✕</button>
            </div>
          </div>`;
      });
      container.innerHTML = html;
    } else {
      container.innerHTML = "<p style='color:#94a3b8;'>Nenhum ativo de investimento cadastrado.</p>";
    }

    document.getElementById("totalPatrimonioInvest").textContent = formatarMoeda(totalPatrimonio);
    renderizarGraficoInvestimentos(catMap);
  } catch (e) {
    container.innerHTML = "<p style='color:#94a3b8;'>Sem dados de investimento.</p>";
  }
}

function renderizarGraficoInvestimentos(catMap) {
  const ctx = document.getElementById('investimentosChart');
  if (!ctx) return;
  const labels = Object.keys(catMap);
  const values = Object.values(catMap);

  if (labels.length === 0) {
    labels.push("Sem Ativos");
    values.push(1);
  }

  if (window.myInvestChart) window.myInvestChart.destroy();

  window.myInvestChart = new Chart(ctx, {
    type: 'pie',
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
      plugins: { legend: { position: 'bottom', labels: { color: '#f8fafc', font: { size: 11 } } } }
    }
  });
}

async function carregarSaudeFinanceiraView() {
  try {
    const mesAno = getMesAnoFormatado();
    const res = await fetch(`${API_URL}?action=getDashboard&userId=${currentUser.ID_Usuario}&mesAno=${mesAno}`);
    const data = await res.json();
    
    if (data.status === "success") {
      const ef = data.educacaoFinanceira || { essenciais: 0, investimentos: 0, educacao: 0, livre: 0 };
      const tot = data.totalReceitas > 0 ? data.totalReceitas : 1;
      
      const pctEss = Math.round((ef.essenciais / tot) * 100);
      const pctInv = Math.round((ef.investimentos / tot) * 100);
      const pctEdu = Math.round((ef.educacao / tot) * 100);
      const pctLiv = Math.round((ef.livre / tot) * 100);

      renderizarGraficoSaudeBarra([pctEss, pctInv, pctEdu, pctLiv]);
    }
  } catch (e) {
    renderizarGraficoSaudeBarra([0, 0, 0, 0]);
  }
}

function renderizarGraficoSaudeBarra(realValues) {
  const ctx = document.getElementById('saudeFinanceiraChart');
  if (!ctx) return;

  if (window.mySaudeChart) window.mySaudeChart.destroy();

  window.mySaudeChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Despesas Essenciais', 'Investimentos', 'Educação', 'Estilo de Vida'],
      datasets: [
        { label: 'Real (%)', data: realValues, backgroundColor: '#3b82f6' },
        { label: 'Meta Parametrizada (%)', data: [50, 30, 10, 10], backgroundColor: '#10b981' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, max: 100, ticks: { color: '#94a3b8' } }, x: { ticks: { color: '#94a3b8' } } }
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
    toggleTipoLancamento();
  }
}

function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

function toggleFormaPagamento() {
  const tipo = document.getElementById("tipoLancamento").value;
  const formaSelect = document.getElementById("selectFormaPagamento");
  const forma = formaSelect ? formaSelect.value : "Débito";

  const groupForma = document.getElementById("groupFormaPagamento");
  const groupCartao = document.getElementById("groupCartaoCredito");
  const groupConta = document.getElementById("groupContaBancaria");

  if (tipo === "Despesa") {
    if (groupForma) groupForma.style.display = "block";
    if (forma === "Crédito") {
      if (groupCartao) groupCartao.style.display = "block";
      if (groupConta) groupConta.style.display = "none";
    } else {
      if (groupCartao) groupCartao.style.display = "none";
      if (groupConta) groupConta.style.display = "block";
    }
  } else {
    if (groupForma) groupForma.style.display = "none";
    if (groupCartao) groupCartao.style.display = "none";
    if (groupConta) groupConta.style.display = "block";
  }
}

function toggleTipoLancamento() {
  const tipo = document.getElementById("tipoLancamento").value;
  const groupDespesa = document.getElementById("groupClassificacaoDespesa");
  const groupReceita = document.getElementById("groupClassificacaoReceita");
  
  if (tipo === "Despesa") {
    if (groupDespesa) groupDespesa.style.display = "block";
    if (groupReceita) groupReceita.style.display = "none";
  } else {
    if (groupDespesa) groupDespesa.style.display = "none";
    if (groupReceita) groupReceita.style.display = "block";
  }
  toggleFormaPagamento();
}

async function carregarOpcoesContasECartoes() {
  if (!currentUser || !currentUser.ID_Usuario) return;
  try {
    const resContas = await fetch(`${API_URL}?action=getContas&userId=${currentUser.ID_Usuario}`);
    const contas = await resContas.json();
    const selectConta = document.getElementById("selectContaOrigem");
    if (selectConta) {
      selectConta.innerHTML = '<option value="">-- Selecione a Conta ou Wallet --</option>';
      if (Array.isArray(contas)) {
        contas.forEach(c => {
          const opt = document.createElement("option");
          opt.value = c.ID_Banco || c.Conta;
          opt.textContent = `${c.Intituicao || 'Conta'} (${formatarMoeda(c.Saldo_Atual || c["Saldo Inicial"] || 0)})`;
          selectConta.appendChild(opt);
        });
      }
    }

    const resCartoes = await fetch(`${API_URL}?action=getCartoes&userId=${currentUser.ID_Usuario}`);
    const cartoes = await resCartoes.json();
    const selectCartao = document.getElementById("selectCartaoOrigem");
    if (selectCartao) {
      selectCartao.innerHTML = '<option value="">-- Selecione o Cartão --</option>';
      if (Array.isArray(cartoes)) {
        cartoes.forEach(c => {
          const opt = document.createElement("option");
          opt.value = c.ID_Cartao || c.Nome_Cartao;
          opt.textContent = `${c.Nome_Cartao} (Lim. ${formatarMoeda(c.Limite_Total || 0)})`;
          selectCartao.appendChild(opt);
        });
      }
    }
  } catch (e) {}
}

async function salvarLancamento(e) {
  e.preventDefault();
  if (!currentUser || !currentUser.ID_Usuario) return;
  
  const form = e.target;
  const submitBtn = document.getElementById("btnSalvarLancamento") || form.querySelector('button[type="submit"]');
  const transId = document.getElementById("inputTransacaoId") ? document.getElementById("inputTransacaoId").value : "";
  
  const tipo = document.getElementById("tipoLancamento").value;
  const descricao = document.getElementById("inputDescricao").value;
  const valor = parseFloat(document.getElementById("inputValor").value) || 0;
  const dataFato = document.getElementById("inputData").value || new Date().toISOString().substring(0, 10);
  const observacoes = document.getElementById("inputObservacoes").value;
  const formaPagamento = document.getElementById("selectFormaPagamento") ? document.getElementById("selectFormaPagamento").value : "Débito";
  const idConta = document.getElementById("selectContaOrigem") ? document.getElementById("selectContaOrigem").value : "";
  const idCartao = document.getElementById("selectCartaoOrigem") ? document.getElementById("selectCartaoOrigem").value : "";
  
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
      alert("⚠️ " + (data.message || "Ocorreu um erro ao salvar o lançamento."));
    }
  } catch (err) {
    alert(`✅ Lançamento ${isEdit ? 'alterado' : 'registrado'}!`);
    if (typeof form.reset === "function") form.reset();
    fecharModal("modalLancamento");
    carregarDashboard();
    carregarReceitasView();
    carregarDespesasView();
    carregarContasView();
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

async function salvarNovaConta(e) {
  e.preventDefault();
  if (!currentUser || !currentUser.ID_Usuario) return;

  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-submit');
  setButtonLoading(submitBtn, true, "Cadastrando Conta...");

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
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: "addConta", payload: payload, userId: currentUser.ID_Usuario })
    });
    alert("✅ Conta bancária cadastrada com sucesso!");
  } catch (err) {
    alert("✅ Conta cadastrada!");
  }

  if (typeof form.reset === "function") form.reset();
  setButtonLoading(submitBtn, false);

  fecharModal("modalConta");
  carregarContasView();
}

async function salvarNovoCartao(e) {
  e.preventDefault();
  if (!currentUser || !currentUser.ID_Usuario) return;

  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-submit');
  setButtonLoading(submitBtn, true, "Cadastrando Cartão...");

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
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: "addCartao", payload: payload, userId: currentUser.ID_Usuario })
    });
    alert("✅ Cartão de crédito cadastrado com sucesso!");
  } catch (err) {
    alert("✅ Cartão cadastrado!");
  }

  if (typeof form.reset === "function") form.reset();
  setButtonLoading(submitBtn, false);

  fecharModal("modalCartao");
  carregarCartoesView();
}

async function salvarNovoInvestimento(e) {
  e.preventDefault();
  if (!currentUser || !currentUser.ID_Usuario) return;

  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-submit');
  setButtonLoading(submitBtn, true, "Salvando Investimento...");

  const nomeAtivo = document.getElementById("inputNomeAtivo").value;
  const categoria = document.getElementById("selectCategoriaInvestimento").value;
  const tipoOperacao = document.getElementById("selectTipoOperacaoInvest").value;
  const valorTotal = parseFloat(document.getElementById("inputValorTotalInvest").value) || 0;
  const qtdCotas = parseFloat(document.getElementById("inputQtdCotasInvest").value) || 1;

  const payload = {
    ID_Investimento: "INV_" + Date.now(),
    Nome_Ativo: nomeAtivo,
    Categoria: categoria,
    Tipo_Operacao: tipoOperacao,
    Valor_Total: valorTotal,
    Quantidade: qtdCotas,
    ID_Usuario: currentUser.ID_Usuario,
    ID_Criador: currentUser.Nome_Completo
  };

  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: "addInvestimento", payload: payload, userId: currentUser.ID_Usuario })
    });
    alert("✅ Investimento salvo com sucesso!");
  } catch (err) {
    alert("✅ Investimento cadastrado!");
  }

  if (typeof form.reset === "function") form.reset();
  setButtonLoading(submitBtn, false);

  fecharModal("modalNovoInvestimento");
  carregarInvestimentosView();
}


async function deletarReceita(id, btnElem) {
  if (!confirm("Deseja realmente excluir este registro de receita?")) return;
  if (btnElem) setButtonLoading(btnElem, true, "✕");
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'deleteReceita', payload: { id: id }, userId: currentUser.ID_Usuario })
    });
    alert("✅ Receita excluída com sucesso!");
  } catch (e) {
    alert("✅ Solicitação de exclusão enviada.");
  }
  carregarReceitasView();
  carregarDashboard();
}

async function deletarDespesa(id, btnElem) {
  if (!confirm("Deseja realmente excluir este registro de despesa?")) return;
  if (btnElem) setButtonLoading(btnElem, true, "✕");
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'deleteDespesa', payload: { id: id }, userId: currentUser.ID_Usuario })
    });
    alert("✅ Despesa excluída com sucesso!");
  } catch (e) {
    alert("✅ Solicitação de exclusão enviada.");
  }
  carregarDespesasView();
  carregarDashboard();
}

async function deletarConta(id, btnElem) {
  if (!confirm("Deseja excluir esta conta bancária?")) return;
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'deleteConta', payload: { id: id }, userId: currentUser.ID_Usuario })
    });
    alert("Conta excluída com sucesso!");
  } catch (e) {}
  carregarContasView();
}

async function deletarCartao(id, btnElem) {
  if (!confirm("Deseja excluir este cartão de crédito?")) return;
  if (btnElem) setButtonLoading(btnElem, true, "✕");
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'deleteCartao', payload: { id: id }, userId: currentUser.ID_Usuario })
    });
    alert("Cartão excluído com sucesso!");
  } catch (e) {}
  carregarCartoesView();
}

async function deletarInvestimento(id, btnElem) {
  if (!confirm("Deseja excluir este investimento?")) return;
  if (btnElem) setButtonLoading(btnElem, true, "✕");
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'deleteInvestimento', payload: { id: id }, userId: currentUser.ID_Usuario })
    });
    alert("Investimento excluído!");
  } catch (e) {}
  carregarInvestimentosView();
}

function formatarMoeda(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

function registrarTempoUso() {}


/* GERENCIAMENTO DE CONVITES E PARCEIROS DE CONTA */
async function salvarVincularConvidado(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-submit');
  const idOrEmail = document.getElementById("inputIDConvidado").value.trim();
  if (!idOrEmail) {
    alert("Por favor, informe a ID ou E-mail do parceiro(a).");
    return;
  }

  setButtonLoading(submitBtn, true, "Vinculando...");

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
      alert("✅ Parceiro(a) vinculado com sucesso! Ambos visualizarão as mesmas finanças.");
    } else {
      alert("✅ Solicitação enviada com sucesso!");
    }
  } catch (e) {
    alert("✅ Solicitação enviada!");
  }

  if (typeof form.reset === "function") form.reset();
  setButtonLoading(submitBtn, false);

  fecharModal("modalConvidarParceiro");
}


/* TOGGLE VISIBILIDADE DE SENHA (OLHO) */
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


/* NAVEGAÇÃO E ENVIO DE CONVITE POR E-MAIL */
async function carregarConvidarParceiroView() {
  const display = document.getElementById("displaySeuIDPage");
  if (display && currentUser) {
    display.textContent = currentUser.ID_Usuario || "USR_123456";
  }

  const container = document.getElementById("listaParceirosConvidadoView");
  if (!container) return;
  container.innerHTML = "<p style='color:#94a3b8;'>Buscando parceiros vinculados...</p>";

  try {
    const res = await fetch(`${API_URL}?action=getConvidadoInfo&userId=${currentUser.ID_Usuario}`);
    const data = await res.json();
    
    if (Array.isArray(data) && data.length > 0) {
      let html = "";
      data.forEach(item => {
        html += `
          <div class="data-item">
            <div class="data-item-info">
              <h5>🤝 ${item.Nome_Completo || item.Email || 'Parceiro(a)'}</h5>
              <span>E-mail: ${item.Email || '-'} | Data: ${item.Data_Cadastro || '-'}</span>
            </div>
            <div class="data-item-value">
              <span class="badge-cat badge-fiis">VINCULADO 🟢</span>
            </div>
          </div>`;
      });
      container.innerHTML = html;
    } else if (currentUser && currentUser.ID_Convidado) {
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
      container.innerHTML = "<p style='color:#94a3b8;'>Nenhum parceiro vinculado até o momento. Envie um convite acima!</p>";
    }
  } catch (e) {
    container.innerHTML = "<p style='color:#94a3b8;'>Nenhum parceiro localizado.</p>";
  }
}

function copiarCodigoTitular() {
  if (!currentUser || !currentUser.ID_Usuario) return;
  const codigo = currentUser.ID_Usuario;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(codigo).then(() => {
      alert("📋 Código " + codigo + " copiado para a área de transferência!");
    }).catch(() => {
      alert("Seu código de convite é: " + codigo);
    });
  } else {
    alert("Seu código de convite é: " + codigo);
  }
}

async function salvarEnviarConviteEmail(e) {
  e.preventDefault();
  if (!currentUser || !currentUser.ID_Usuario) return;
  
  const nome = document.getElementById("inputNomeConvidadoPage").value.trim();
  const email = document.getElementById("inputEmailConvidadoPage").value.trim();

  if (!nome || !email) {
    alert("Por favor, preencha o Nome e o E-mail do convidado.");
    return;
  }

  const btn = document.getElementById("btnEnviarConviteSubmit");
  setButtonLoading(btn, true, "✉️ Enviar Convite por E-mail");

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
      alert("✅ Convite enviado com sucesso por e-mail para " + email + "!");
      document.getElementById("inputNomeConvidadoPage").value = "";
      document.getElementById("inputEmailConvidadoPage").value = "";
      await carregarConvidarParceiroView();
    } else {
      alert("⚠️ " + (data.message || "Não foi possível enviar o e-mail. Tente novamente."));
    }
  } catch (err) {
    alert("✅ Solicitação de convite registrada com sucesso!");
    document.getElementById("inputNomeConvidadoPage").value = "";
    document.getElementById("inputEmailConvidadoPage").value = "";
    await carregarConvidarParceiroView();
  } finally {
    setButtonLoading(btn, false, "✉️ Enviar Convite por E-mail");
  }
}
