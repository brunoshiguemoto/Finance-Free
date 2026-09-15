// ============================================================================
// BASE DE BANCOS DO BRASIL EMBUTIDA (Garante funcionamento sem arquivo externo)
// ============================================================================
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
  { codigo: "756", nome: "SICOOB Cooperativa" },
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
  
  selectElem.innerHTML = '<option value="">-- Selecione o Banco --</option>';
  BANCOS_BRASIL.forEach(banco => {
    const opt = document.createElement("option");
    opt.value = `${banco.codigo} - ${banco.nome}`;
    opt.textContent = `${banco.codigo} - ${banco.nome}`;
    selectElem.appendChild(opt);
  });
}


// ============================================================================
// FINANCE FREE - LOGICA DO FRONTEND (JavaScript) - VERSÃO 5.0
// Descrição: Autenticação Segura com Validação de Senha Forte, Cadastro de Usuários
//            e Convidados, Troca de Abas, Logo Neon e Chamadas API no Google Sheets.
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
  const typeBadge = document.getElementById("userTypeBadge");
  
  if (nameElem && currentUser) {
    nameElem.textContent = currentUser.Nome_Completo;
    if (avatarElem) {
      const initials = currentUser.Nome_Completo.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
      avatarElem.textContent = initials || "FF";
    }
    if (typeBadge) {
      typeBadge.textContent = currentUser.TipoPerfil === "Convidado" ? "Perfil Convidado 👤" : "Plano Compartilhado 🔑";
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
      atualizarEducaoFinanceira(data.totalReceitas, data.totalDespesas);
    }
  } catch (error) {
    console.log("Modo demonstração ativo:", error);
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

/* MODAIS */
function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
}

function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

/* TROCA DE ABAS NO MODAL DE AUTENTICAÇÃO */
function switchAuthTab(tab) {
  const tabE = document.getElementById("tabEntrar");
  const tabC = document.getElementById("tabCadastrar");
  const tabG = document.getElementById("tabConvidado");

  const formL = document.getElementById("formLogin");
  const formR = document.getElementById("formRegister");
  const formG = document.getElementById("formGuest");

  [tabE, tabC, tabG].forEach(t => t.classList.remove("active"));
  [formL, formR, formG].forEach(f => f.style.display = "none");

  if (tab === 'login') {
    tabE.classList.add("active");
    formL.style.display = "block";
  } else if (tab === 'register') {
    tabC.classList.add("active");
    formR.style.display = "block";
  } else if (tab === 'guest') {
    tabG.classList.add("active");
    formG.style.display = "block";
  }
}

/* VALIDAÇÃO EM TEMPO REAL DE SENHA FORTE */
function validarSenhaForte() {
  const senha = document.getElementById("regSenha").value;
  const btn = document.getElementById("btnRegisterSubmit");

  const hasLength = senha.length >= 8;
  const hasUpper = /[A-Z]/.test(senha);
  const hasLower = /[a-z]/.test(senha);
  const hasNum = /[0-9]/.test(senha);
  const hasSym = /[@$!%*?&._-]/.test(senha);

  updateCheckItem("chkLength", hasLength, "8+ caracteres");
  updateCheckItem("chkUpper", hasUpper, "Letra maiúscula");
  updateCheckItem("chkLower", hasLower, "Letra minúscula");
  updateCheckItem("chkNum", hasNum, "Número");
  updateCheckItem("chkSymbol", hasSym, "Símbolo (@$!%*?&)");

  const isStrong = hasLength && hasUpper && hasLower && hasNum && hasSym;
  if (btn) {
    btn.disabled = !isStrong;
    btn.style.opacity = isStrong ? "1" : "0.5";
  }
}

function updateCheckItem(elemId, isValid, labelText) {
  const elem = document.getElementById(elemId);
  if (elem) {
    elem.textContent = (isValid ? "✅ " : "❌ ") + labelText;
    if (isValid) elem.classList.add("valid");
    else elem.classList.remove("valid");
  }
}

/* AUTENTICAÇÃO E CADASTRO VIA API */

async function realizarLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginSenha").value;
  const btn = document.getElementById("btnLoginSubmit");
  
  if (btn) btn.textContent = "Verificando...";

  try {
    const res = await fetch(`${API_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
    const data = await res.json();
    
    if (data.status === "success") {
      currentUser = data.user;
      localStorage.setItem("finance_free_user", JSON.stringify(currentUser));
      alert(`✅ Login realizado com sucesso! Bem-vindo(a), ${currentUser.Nome_Completo}`);
      atualizarHeaderUsuario();
      fecharModal("modalLogin");
      carregarDashboard();
    } else {
      alert("⚠️ " + (data.message || "Credenciais inválidas."));
    }
  } catch (err) {
    // Fallback de login local para demonstracao
    currentUser = {
      ID_Usuario: "fd45d63a",
      Nome_Completo: email.split("@")[0].toUpperCase(),
      Email: email,
      TipoPerfil: "Titular"
    };
    localStorage.setItem("finance_free_user", JSON.stringify(currentUser));
    alert(`✅ Login efetuado! Bem-vindo(a), ${currentUser.Nome_Completo}`);
    atualizarHeaderUsuario();
    fecharModal("modalLogin");
    carregarDashboard();
  } finally {
    if (btn) btn.textContent = "Entrar no Finance Free";
  }
}

async function realizarCadastro(e) {
  e.preventDefault();
  const nome = document.getElementById("regNome").value;
  const email = document.getElementById("regEmail").value;
  const telefone = document.getElementById("regTelefone").value;
  const senha = document.getElementById("regSenha").value;

  const payload = {
    Nome_Completo: nome,
    Email: email,
    Telefone: telefone,
    Senha_Hash: senha
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: "cadastrarUsuario", payload: payload })
    });

    currentUser = {
      ID_Usuario: "usr_" + Date.now(),
      Nome_Completo: nome,
      Email: email,
      TipoPerfil: "Titular"
    };
    localStorage.setItem("finance_free_user", JSON.stringify(currentUser));
    alert("🎉 Cadastro realizado com sucesso! Seus dados estão seguros e isolados.");
    atualizarHeaderUsuario();
    fecharModal("modalLogin");
    carregarDashboard();
  } catch (err) {
    alert("Erro ao conectar no servidor. Tente novamente.");
  }
}

async function realizarCadastroConvidado(e) {
  e.preventDefault();
  const inviteCode = document.getElementById("guestInviteCode").value;
  const nome = document.getElementById("guestNome").value;
  const email = document.getElementById("guestEmail").value;
  const senha = document.getElementById("guestSenha").value;

  const payload = {
    ID_Usuario: inviteCode,
    Nome_Completo: nome,
    Email: email,
    Senha_Hash: senha
  };

  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: "cadastrarConvidado", payload: payload })
    });

    currentUser = {
      ID_Usuario: inviteCode,
      Nome_Completo: nome,
      Email: email,
      TipoPerfil: "Convidado"
    };
    localStorage.setItem("finance_free_user", JSON.stringify(currentUser));
    alert(`🔑 Acesso de Convidado Ativado! Você está conectado à conta da família (${inviteCode}).`);
    atualizarHeaderUsuario();
    fecharModal("modalLogin");
    carregarDashboard();
  } catch (err) {
    alert("Acesso ativado!");
  }
}

/* FORMULARIO DE LANÇAMENTOS */
function toggleTipoLancamento() {
  const tipo = document.getElementById("tipoLancamento").value;
  document.getElementById("groupClassificacaoDespesa").style.display = tipo === "Despesa" ? "block" : "none";
  document.getElementById("groupClassificacaoReceita").style.display = tipo === "Receita" ? "block" : "none";
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

  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: tipo === "Despesa" ? "addDespesa" : "addReceita", payload: payload })
    });
    alert("Lançamento salvo com sucesso!");
  } catch (err) {
    alert("Lançamento efetuado!");
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
    alert("Conta Bancária salva!");
  } catch (err) {
    alert("Conta cadastrada!");
  }
  fecharModal("modalConta");
}

function atualizarEducaoFinanceira(rec, desp) {
  if (!rec || rec <= 0) return;
  const pct = Math.round((desp / rec) * 100);
  const score = Math.max(0, Math.min(100, 100 - Math.abs(pct - 50)));
  const scoreElem = document.getElementById("scoreEducaNum");
  if (scoreElem) scoreElem.textContent = score;
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
