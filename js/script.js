/* ==========================================================================
   1. ESTADO GLOBAL
   ========================================================================== */
let listaDeIniciativa = JSON.parse(localStorage.getItem("iniciativaRPG")) || [];
let partyHerois       = JSON.parse(localStorage.getItem("partyHeroisRPG")) || [];
let turnoAtivo        = parseInt(localStorage.getItem("turnoAtivoRPG"))    || 0;

// coletaneaMonstros é carregada pelo monstros.js

const CONDICOES = [
  { id: "inconsciente", emoji: "😴", label: "Inconsciente" },
  { id: "paralisado",   emoji: "❄️", label: "Paralisado"   },
  { id: "emChamas",     emoji: "🔥", label: "Em chamas"    },
  { id: "morto",        emoji: "☠️", label: "Morto"        },
  { id: "envenenado",   emoji: "🤢", label: "Envenenado"   },
  { id: "amedrontado",  emoji: "😱", label: "Amedrontado"  },
];

/* ==========================================================================
   2. PERSISTÊNCIA
   ========================================================================== */
function salvarIniciativaNoCofre() {
  localStorage.setItem("iniciativaRPG", JSON.stringify(listaDeIniciativa));
}

function salvarHeroisNoCofre() {
  localStorage.setItem("partyHeroisRPG", JSON.stringify(partyHerois));
}

function salvarESincronizar() {
  salvarIniciativaNoCofre();
  salvarHeroisNoCofre();
  localStorage.setItem("turnoAtivoRPG", turnoAtivo);
  atualizarIniciativa();
  renderizarStatusGrupo();
}

/* ==========================================================================
   3. MODAL DE NOVO HERÓI
   ========================================================================== */
function abrirModalHeroi() {
  document.getElementById("heroi-nome").value   = "";
  document.getElementById("heroi-classe").value = "";
  document.getElementById("heroi-nivel").value  = "1";
  document.getElementById("heroi-hp").value     = "10";
  document.getElementById("modal-heroi").classList.remove("oculto");
  document.getElementById("heroi-nome").focus();
}

function fecharModalHeroi() {
  document.getElementById("modal-heroi").classList.add("oculto");
}

function confirmarNovoHeroi() {
  const nome = document.getElementById("heroi-nome").value.trim();
  if (!nome) { document.getElementById("heroi-nome").focus(); return; }

  partyHerois.push({
    id:     "h_" + Date.now(),
    nome:   nome,
    classe: document.getElementById("heroi-classe").value.trim() || "Aventureiro",
    nivel:  document.getElementById("heroi-nivel").value || "1",
    hpMax:  parseInt(document.getElementById("heroi-hp").value) || 10,
    imagem: ""
  });

  fecharModalHeroi();
  salvarESincronizar();
}

/* ==========================================================================
   4. LÓGICA DE COMBATE
   ========================================================================== */
function adicionarIniciativaDeMonstro(monstro) {
  // Monta o nome já com a letra (A, B, C…) antes de abrir o modal
  const quantidadeExistente = listaDeIniciativa.filter(c => c.nomeBase === monstro.nome).length;
  const letra = String.fromCharCode(65 + quantidadeExistente);
  const nomeCompleto = `${monstro.nome} ${letra}`;

  _contextoIniciativa = {
    tipo:        "monstro",
    monstro,
    nomeCompleto
  };

  abrirModalIniciativa(`Combate — ${nomeCompleto}`);
}

let _idHeroiIniciativaAtual = null;
// Contexto completo do modal (herói ou monstro)
let _contextoIniciativa = null;

function lancarIniciativaHeroi(idHeroi) {
  const heroiBase = partyHerois.find(h => h.id === idHeroi);
  if (!heroiBase) return;

  _idHeroiIniciativaAtual = idHeroi;
  _contextoIniciativa = {
    tipo:   "heroi",
    idHeroi
  };

  abrirModalIniciativa(`Combate — ${heroiBase.nome}`);
}

function abrirModalIniciativa(titulo) {
  document.getElementById("modal-iniciativa-titulo").textContent = titulo;
  document.getElementById("ini-modificador").value = "0";
  document.getElementById("ini-valor-manual").value = "";
  document.getElementById("ini-resultado-display").classList.add("oculto");

  const valorDisplay = document.getElementById("ini-dado-valor");
  valorDisplay.textContent = "—";
  valorDisplay.className   = "ini-dado-valor";

  document.getElementById("modal-iniciativa").classList.remove("oculto");
  document.getElementById("ini-modificador").focus();
}

function fecharModalIniciativa() {
  document.getElementById("modal-iniciativa").classList.add("oculto");
  _idHeroiIniciativaAtual = null;
  _contextoIniciativa     = null;
}

function rolarIniciativaModal() {
  const modificador    = parseInt(document.getElementById("ini-modificador").value) || 0;
  const dado           = Math.floor(Math.random() * 20) + 1;
  const total          = dado + modificador;
  const valorDisplay   = document.getElementById("ini-dado-valor");
  const formulaDisplay = document.getElementById("ini-formula");

  valorDisplay.textContent = total;
  valorDisplay.className   = "ini-dado-valor";
  if (dado === 20) valorDisplay.classList.add("critico");
  if (dado === 1)  valorDisplay.classList.add("falha");

  const sinal = modificador >= 0 ? "+" : "";
  formulaDisplay.textContent = `(d20: ${dado} ${sinal}${modificador})`;
  document.getElementById("ini-resultado-display").classList.remove("oculto");
  document.getElementById("ini-valor-manual").value = total;
}

function confirmarIniciativaModal() {
  const valor = parseInt(document.getElementById("ini-valor-manual").value);
  if (isNaN(valor)) { document.getElementById("ini-valor-manual").focus(); return; }

  const ctx = _contextoIniciativa;
  if (!ctx) return;

  if (ctx.tipo === "heroi") {
    const heroiBase = partyHerois.find(h => h.id === ctx.idHeroi);
    if (!heroiBase) return;

    const entradaAnterior = listaDeIniciativa.find(c => c.idHeroi === ctx.idHeroi);
    const condicoes = entradaAnterior ? entradaAnterior.condicoes : [];

    listaDeIniciativa = listaDeIniciativa.filter(c => c.idHeroi !== ctx.idHeroi);
    listaDeIniciativa.push({
      id:       Date.now(),
      idHeroi:  ctx.idHeroi,
      nome:     heroiBase.nome,
      valor,
      hpAtual:  heroiBase.hpMax,
      hpMax:    heroiBase.hpMax,
      condicoes
    });

  } else if (ctx.tipo === "monstro") {
    listaDeIniciativa.push({
      id:        Date.now(),
      nomeBase:  ctx.monstro.nome,
      nome:      ctx.nomeCompleto,
      valor,
      hpAtual:   ctx.monstro.vidaMax,
      hpMax:     ctx.monstro.vidaMax,
      condicoes: []
    });
  }

  fecharModalIniciativa();
  salvarESincronizar();
}

function removerHeroi(idHeroi) {
  if (!confirm("Deseja realmente remover este herói da party?")) return;
  partyHerois       = partyHerois.filter(h => h.id !== idHeroi);
  listaDeIniciativa = listaDeIniciativa.filter(c => c.idHeroi !== idHeroi);
  salvarESincronizar();
}

/** Remove um combatente individual da iniciativa (ex.: monstro morto) */
function removerDaIniciativa(id) {
  const idx = listaDeIniciativa.findIndex(c => c.id === id);
  if (idx === -1) return;
  listaDeIniciativa.splice(idx, 1);
  // Se o turno ativo estava depois do removido, recua um passo
  if (turnoAtivo >= listaDeIniciativa.length) turnoAtivo = 0;
  salvarESincronizar();
}

function sincronizarHP(id, novoValor) {
  const criatura = listaDeIniciativa.find(c => c.id === id);
  if (!criatura) return;
  criatura.hpAtual = parseInt(novoValor) || 0;
  salvarESincronizar();
}

function sincronizarVidaTudo(idHeroi, novoValor) {
  const itemIni = listaDeIniciativa.find(c => c.idHeroi === idHeroi);
  if (itemIni) itemIni.hpAtual = parseInt(novoValor) || 0;
  salvarESincronizar();
}

/** Alterna uma condição em um combatente */
function toggleCondicao(id, condicaoId) {
  const criatura = listaDeIniciativa.find(c => c.id === id);
  if (!criatura) return;
  if (!criatura.condicoes) criatura.condicoes = [];

  const idx = criatura.condicoes.indexOf(condicaoId);
  if (idx === -1) criatura.condicoes.push(condicaoId);
  else            criatura.condicoes.splice(idx, 1);

  salvarESincronizar();
}

/* ==========================================================================
   5. CONTROLE DE TURNO
   ========================================================================== */
function proximoTurno() {
  if (listaDeIniciativa.length === 0) return;
  turnoAtivo = (turnoAtivo + 1) % listaDeIniciativa.length;
  salvarESincronizar();
}

function turnoAnterior() {
  if (listaDeIniciativa.length === 0) return;
  turnoAtivo = (turnoAtivo - 1 + listaDeIniciativa.length) % listaDeIniciativa.length;
  salvarESincronizar();
}

/* ==========================================================================
   6. RENDERIZAÇÃO — INICIATIVA
   ========================================================================== */
function calcularCorHP(hpAtual, hpMax) {
  if (hpMax <= 0) return "#888";
  const pct = hpAtual / hpMax;
  if (pct > 0.5) return "#2ecc71";  // verde
  if (pct > 0.25) return "#f39c12"; // amarelo
  return "#e63946";                  // vermelho
}

function atualizarIniciativa() {
  listaDeIniciativa.sort((a, b) => b.valor - a.valor);
  const container = document.getElementById("lista-iniciativa-conteudo");
  if (!container) return;
  container.innerHTML = "";

  // Garante que turnoAtivo não aponte para fora dos limites
  if (listaDeIniciativa.length > 0 && turnoAtivo >= listaDeIniciativa.length) turnoAtivo = 0;

  listaDeIniciativa.forEach((personagem, index) => {
    const ativo      = index === turnoAtivo && listaDeIniciativa.length > 0;
    const condicoes  = personagem.condicoes || [];
    const pctHP      = personagem.hpMax > 0 ? (personagem.hpAtual / personagem.hpMax) * 100 : 0;
    const corHP      = calcularCorHP(personagem.hpAtual, personagem.hpMax);

    const item = document.createElement("div");
    item.className = "item-iniciativa" + (ativo ? " item-iniciativa--ativo" : "");

    // ── Cabeçalho: nome + botão remover
    const cabecalho = document.createElement("div");
    cabecalho.className = "item-ini-cabecalho";

    const nome = document.createElement("span");
    nome.className = "item-iniciativa-nome";
    nome.textContent = (ativo ? "▶ " : "") + personagem.nome;

    const btnRemover = document.createElement("button");
    btnRemover.textContent = "✕";
    btnRemover.className   = "btn-remover-ini";
    btnRemover.title       = "Remover da iniciativa";
    btnRemover.addEventListener("click", () => removerDaIniciativa(personagem.id));

    cabecalho.appendChild(nome);
    cabecalho.appendChild(btnRemover);

    // ── Iniciativa
    const iniciativaSpan = document.createElement("span");
    iniciativaSpan.className   = "item-iniciativa-valor";
    iniciativaSpan.textContent = `Ini: ${personagem.valor}`;

    // ── Barra de HP
    const barraWrap = document.createElement("div");
    barraWrap.className = "barra-hp-wrap";

    const barraFill = document.createElement("div");
    barraFill.className = "barra-hp-fill";
    barraFill.style.width      = `${Math.max(0, Math.min(100, pctHP))}%`;
    barraFill.style.background = corHP;
    barraWrap.appendChild(barraFill);

    // ── Controles HP (− input +)
    const controles = document.createElement("div");
    controles.className = "item-iniciativa-controles";

    const labelHP = document.createElement("span");
    labelHP.className   = "label-hp";
    labelHP.textContent = "HP:";

    const btnMenos = document.createElement("button");
    btnMenos.textContent = "−";
    btnMenos.className   = "btn-hp-step";
    btnMenos.addEventListener("click", () => {
      inputHP.value = (parseInt(inputHP.value) || 0) - 1;
      dispararSincHP();
    });

    const inputHP = document.createElement("input");
    inputHP.type      = "number";
    inputHP.value     = personagem.hpAtual;
    inputHP.className = "input-vida";

    const dispararSincHP = () => {
      if (personagem.idHeroi) sincronizarVidaTudo(personagem.idHeroi, inputHP.value);
      else                    sincronizarHP(personagem.id, inputHP.value);
    };
    inputHP.addEventListener("input", dispararSincHP);

    const btnMais = document.createElement("button");
    btnMais.textContent = "+";
    btnMais.className   = "btn-hp-step";
    btnMais.addEventListener("click", () => {
      inputHP.value = (parseInt(inputHP.value) || 0) + 1;
      dispararSincHP();
    });

    controles.appendChild(labelHP);
    controles.appendChild(btnMenos);
    controles.appendChild(inputHP);
    controles.appendChild(btnMais);

    // ── Condições
    const divCondicoes = document.createElement("div");
    divCondicoes.className = "item-ini-condicoes";

    CONDICOES.forEach(cond => {
      const ativa = condicoes.includes(cond.id);
      const tag   = document.createElement("button");
      tag.className = "tag-condicao" + (ativa ? " tag-condicao--ativa" : "");
      tag.title     = cond.label;
      tag.textContent = cond.emoji;
      tag.addEventListener("click", () => toggleCondicao(personagem.id, cond.id));
      divCondicoes.appendChild(tag);
    });

    // ── Monta item
    item.appendChild(cabecalho);
    item.appendChild(iniciativaSpan);
    item.appendChild(barraWrap);
    item.appendChild(controles);
    item.appendChild(divCondicoes);
    container.appendChild(item);
  });

  // Rola o painel até o combatente ativo ficar visível
  const itemAtivo = container.querySelector(".item-iniciativa--ativo");
  if (itemAtivo) {
    itemAtivo.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

/* ==========================================================================
   7. RENDERIZAÇÃO — STATUS DO GRUPO
   ========================================================================== */
function renderizarStatusGrupo() {
  const container = document.getElementById("conteudo-status-grupo");
  if (!container) return;
  container.innerHTML = "";

  const btnAdd = document.createElement("button");
  btnAdd.textContent = "+ Criar Novo Herói";
  btnAdd.className   = "btn-novo-heroi";
  btnAdd.addEventListener("click", abrirModalHeroi);
  container.appendChild(btnAdd);

  partyHerois.forEach(heroi => {
    const naIni    = listaDeIniciativa.find(c => c.idHeroi === heroi.id);
    const hpAtual  = naIni ? naIni.hpAtual : heroi.hpMax;
    const valorIni = naIni ? naIni.valor    : "-";
    const pctHP    = heroi.hpMax > 0 ? (hpAtual / heroi.hpMax) * 100 : 0;
    const corHP    = calcularCorHP(hpAtual, heroi.hpMax);

    const card = document.createElement("div");
    card.className = "card-heroi";

    // Topo: nome + iniciativa + botão remover
    const topo = document.createElement("div");
    topo.className = "card-heroi-topo";

    const nomeSpan = document.createElement("span");
    nomeSpan.className   = "card-heroi-nome";
    nomeSpan.textContent = heroi.nome;

    const iniSpan = document.createElement("span");
    iniSpan.className   = "card-heroi-ini";
    iniSpan.textContent = `Ini: ${valorIni}`;

    const btnRemover = document.createElement("button");
    btnRemover.textContent = "✕";
    btnRemover.className   = "btn-remover-heroi";
    btnRemover.title       = "Remover herói";
    btnRemover.addEventListener("click", () => removerHeroi(heroi.id));

    topo.appendChild(nomeSpan);
    topo.appendChild(iniSpan);
    topo.appendChild(btnRemover);

    // Subtítulo
    const sub = document.createElement("div");
    sub.className   = "card-heroi-sub";
    sub.textContent = `Nvl ${heroi.nivel} | ${heroi.classe}`;

    // Barra de HP
    const barraWrap = document.createElement("div");
    barraWrap.className = "barra-hp-wrap";
    const barraFill = document.createElement("div");
    barraFill.className        = "barra-hp-fill";
    barraFill.style.width      = `${Math.max(0, Math.min(100, pctHP))}%`;
    barraFill.style.background = corHP;
    barraWrap.appendChild(barraFill);

    // Rodapé: HP (− input +) + botão iniciativa
    const rodape = document.createElement("div");
    rodape.className = "card-heroi-rodape";

    const divHP = document.createElement("div");
    divHP.className = "card-heroi-hp";

    const labelHP = document.createElement("label");
    labelHP.textContent = "HP:";

    const btnMenos = document.createElement("button");
    btnMenos.textContent = "−";
    btnMenos.className   = "btn-hp-step";
    btnMenos.addEventListener("click", () => {
      inputHP.value = (parseInt(inputHP.value) || 0) - 1;
      sincronizarVidaTudo(heroi.id, inputHP.value);
    });

    const inputHP = document.createElement("input");
    inputHP.type  = "number";
    inputHP.value = hpAtual;
    inputHP.addEventListener("input", () => sincronizarVidaTudo(heroi.id, inputHP.value));

    const btnMais = document.createElement("button");
    btnMais.textContent = "+";
    btnMais.className   = "btn-hp-step";
    btnMais.addEventListener("click", () => {
      inputHP.value = (parseInt(inputHP.value) || 0) + 1;
      sincronizarVidaTudo(heroi.id, inputHP.value);
    });

    divHP.appendChild(labelHP);
    divHP.appendChild(btnMenos);
    divHP.appendChild(inputHP);
    divHP.appendChild(btnMais);

    const btnIni = document.createElement("button");
    btnIni.textContent = naIni ? "Atualizar Ini" : "+ Iniciativa";
    btnIni.className   = "btn-ini-heroi";
    btnIni.addEventListener("click", () => lancarIniciativaHeroi(heroi.id));

    rodape.appendChild(divHP);
    rodape.appendChild(btnIni);

    card.appendChild(topo);
    card.appendChild(sub);
    card.appendChild(barraWrap);
    card.appendChild(rodape);
    container.appendChild(card);
  });
}

/* ==========================================================================
   8. RENDERIZAÇÃO — COLETÂNEA DE MONSTROS
   ========================================================================== */
function renderizarColetanea() {
  const container = document.getElementById("conteudo-monstros");
  if (!container) return;
  container.innerHTML = "";

  coletaneaMonstros.forEach(monstro => {
    const item = document.createElement("div");
    item.className = "item-monstro";

    const infoNome = document.createElement("span");
    infoNome.className = "item-monstro-nome";
    infoNome.innerHTML = `${monstro.nome} <small class="item-monstro-hp">(HP: ${monstro.vidaMax} | ND: ${monstro.nd})</small>`;

    const btnAdd = document.createElement("button");
    btnAdd.textContent = "+ Adicionar";
    btnAdd.className   = "btn-add-monstro";
    btnAdd.addEventListener("click", () => adicionarIniciativaDeMonstro(monstro));

    item.appendChild(infoNome);
    item.appendChild(btnAdd);
    container.appendChild(item);
  });
}

/* ==========================================================================
   9. DADOS E HISTÓRICO
   ========================================================================== */
function limparIniciativa() {
  if (!confirm("Deseja realmente limpar todo o combate?")) return;
  listaDeIniciativa = [];
  turnoAtivo        = 0;
  salvarESincronizar();
}

function rolarDado(lados) {
  const modificador = parseInt(document.getElementById("modificador").value) || 0;
  const quantidade  = parseInt(document.getElementById("quantidade").value)  || 1;
  let somaDados = 0;
  const rolagens = [];

  for (let i = 0; i < quantidade; i++) {
    const rolagem = Math.floor(Math.random() * lados) + 1;
    somaDados += rolagem;
    rolagens.push(rolagem);
  }

  const total     = somaDados + modificador;
  const textoBase = `Rolou ${quantidade}d${lados}: [${rolagens.join(", ")}] + ${modificador} = ${total}`;
  document.querySelector("#resultado-dado .valor").textContent = total;

  if (lados === 20 && quantidade === 1) {
    if (rolagens[0] === 20) adicionarHistorico(`⚔️ SUCESSO CRÍTICO! ${textoBase}`, "sucesso");
    else if (rolagens[0] === 1) adicionarHistorico(`💀 FALHA CRÍTICA! ${textoBase}`, "falha");
    else adicionarHistorico(textoBase);
  } else {
    adicionarHistorico(textoBase);
  }
}

function adicionarHistorico(texto, tipo = "") {
  const historico = JSON.parse(localStorage.getItem("historicoRPG")) || [];
  historico.push({ texto, tipo });
  localStorage.setItem("historicoRPG", JSON.stringify(historico));
  renderizarItemHistorico(texto, tipo);
}

function renderizarItemHistorico(texto, tipo) {
  const log = document.getElementById("log-historico");
  if (!log) return;
  const item       = document.createElement("div");
  item.className   = "log-item" + (tipo ? ` ${tipo}` : "");
  item.textContent = texto;
  log.appendChild(item);
  log.scrollTop = log.scrollHeight;
}

function limparHistorico() {
  if (!confirm("Deseja realmente limpar o histórico da sessão?")) return;
  localStorage.removeItem("historicoRPG");
  document.getElementById("log-historico").innerHTML = "";
}

/* ==========================================================================
   10. MODAIS
   ========================================================================== */
function configurarModal(btnId, modalId, fecharId) {
  const botao = document.getElementById(btnId);
  const modal = document.getElementById(modalId);
  const fechar = document.getElementById(fecharId);
  botao.addEventListener("click",  () => modal.classList.remove("oculto"));
  fechar.addEventListener("click", () => modal.classList.add("oculto"));
  window.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("oculto"); });
}

configurarModal("btn-sobre",  "modal-sobre",  "fechar-sobre");
configurarModal("btn-config", "modal-config", "fechar-config");
configurarModal("btn-ajuda",  "modal-ajuda",  "fechar-ajuda");

// Modal de iniciativa
document.getElementById("fechar-iniciativa").addEventListener("click", fecharModalIniciativa);
document.getElementById("btn-rolar-ini").addEventListener("click", rolarIniciativaModal);
document.getElementById("btn-confirmar-ini").addEventListener("click", confirmarIniciativaModal);
window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-iniciativa")) fecharModalIniciativa(); });
document.getElementById("modal-iniciativa").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarIniciativaModal(); });

// Modal de herói
document.getElementById("fechar-heroi").addEventListener("click", fecharModalHeroi);
document.getElementById("btn-confirmar-heroi").addEventListener("click", confirmarNovoHeroi);
window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-heroi")) fecharModalHeroi(); });
document.getElementById("modal-heroi").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarNovoHeroi(); });

/* ==========================================================================
   11. INICIALIZAÇÃO
   ========================================================================== */
window.onload = () => {
  renderizarColetanea();
  atualizarIniciativa();
  renderizarStatusGrupo();

  const historicoSalvo = JSON.parse(localStorage.getItem("historicoRPG")) || [];
  historicoSalvo.forEach(e => renderizarItemHistorico(e.texto, e.tipo));

  const areaAnotacoes = document.getElementById("campo-anotacoes");
  if (areaAnotacoes) {
    areaAnotacoes.value = localStorage.getItem("anotacoesRPG") || "";
    areaAnotacoes.addEventListener("input", () => localStorage.setItem("anotacoesRPG", areaAnotacoes.value));
  }

  // Botões de controle de turno (painel turno)
  document.getElementById("btn-turno-anterior").addEventListener("click", turnoAnterior);
  document.getElementById("btn-proximo-turno").addEventListener("click", proximoTurno);
};