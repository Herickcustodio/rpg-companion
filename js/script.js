/* ==========================================================================
   1. ESTADO GLOBAL (DADOS)
   ========================================================================== */

// Lista principal que controla o combate
let listaDeIniciativa = JSON.parse(localStorage.getItem("iniciativaRPG")) || [];

// Biblioteca de monstros
const coletaneaMonstros = [
  { nome: "Goblin", vidaMax: 7 },
  { nome: "Orc", vidaMax: 15 },
  { nome: "Dragão Filhote", vidaMax: 50 }
];

/* ==========================================================================
   2. UTILITÁRIOS E PERSISTÊNCIA (LOCALSTORAGE)
   ========================================================================== */

function salvarIniciativaNoCofre() {
  localStorage.setItem("iniciativaRPG", JSON.stringify(listaDeIniciativa));
}

function limparIniciativa() {
  if (confirm("Deseja realmente limpar toda a iniciativa?")) {
    listaDeIniciativa = [];
    salvarIniciativaNoCofre();
    atualizarIniciativa();
    document.querySelector('.status').innerHTML = "<h2>Vida e Status de Personagens</h2>";
  }
}

/* ==========================================================================
   3. LÓGICA DE COMBATE E SINCRONIZAÇÃO
   ========================================================================== */

function adicionarIniciativaDeMonstro(monstro) {
  const valorIni = prompt(`Qual a iniciativa do ${monstro.nome}?`);
  
  if (valorIni !== null) {
    // Conta quantos monstros com o mesmo nome já existem na lista
    const quantidadeExistente = listaDeIniciativa.filter(c => 
      c.nomeBase === monstro.nome
    ).length;

    const letra = String.fromCharCode(65 + quantidadeExistente);

    const novoCombatente = {
      id: Date.now(),
      nomeBase: monstro.nome, // Nome fixo para a contagem
      nome: `${monstro.nome} ${letra}`, // Nome final: "Goblin A"
      valor: parseInt(valorIni) || 0,
      hpAtual: monstro.vidaMax,
      hpMax: monstro.vidaMax
    };

    listaDeIniciativa.push(novoCombatente);
    salvarIniciativaNoCofre();
    atualizarIniciativa();
  }
}

// Sincroniza o HP entre os painéis de Iniciativa e Status
function sincronizarHP(id, novoValor) {
  const criatura = listaDeIniciativa.find(c => c.id === id);
  
  if (criatura) {
    criatura.hpAtual = parseInt(novoValor) || 0;
    salvarIniciativaNoCofre();

    // Atualiza o input na Iniciativa
    const inputIni = document.querySelector(`.input-vida[data-id="${id}"]`);
    if (inputIni) inputIni.value = criatura.hpAtual;

    // Atualiza o input no Status Detalhado
    const inputStatus = document.querySelector(`.input-status[data-id="${id}"]`);
    if (inputStatus) inputStatus.value = criatura.hpAtual;
  }
}

/* ==========================================================================
   4. RENDERIZAÇÃO DE INTERFACE (UI)
   ========================================================================== */

function atualizarIniciativa() {
  listaDeIniciativa.sort((a, b) => b.valor - a.valor);

  const container = document.getElementById("lista-iniciativa-conteudo");
  if (!container) return; 

  container.innerHTML = "";
  
  listaDeIniciativa.forEach(personagem => {
    const item = document.createElement("div");
    item.className = "item-iniciativa";
    item.style = "display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #444; border-radius: 4px; margin-bottom: 8px; background: #2a2a2a;";
    
    item.innerHTML = `
      <div onclick="abrirStatus(${personagem.id})" style="flex-grow: 1; cursor: pointer; display: flex; flex-direction: column;">
        <span style="font-weight: bold; color: #fff; font-size: 1.1em;">${personagem.nome}</span> 
        <span style="color: #28a745; font-size: 0.85em; font-weight: bold; margin-top: 4px;">Iniciativa: ${personagem.valor}</span>
      </div>
      <div class="controles-vida">
        <span style="color: #ccc; margin-right: 5px; font-size: 0.9em;">HP:</span>
        <input type="number" 
                   data-id="${personagem.id}"
                   value="${personagem.hpAtual}" 
                   class="input-vida" 
                   oninput="sincronizarHP(${personagem.id}, this.value)"
                   style="width: 60px; background: #1e1e1e; color: white; border: 1px solid #444; text-align: center; border-radius: 3px; padding: 4px;">
      </div>
    `;
    container.appendChild(item);
  });
}

function abrirStatus(id) {
  const criatura = listaDeIniciativa.find(c => c.id === id);
  const painelStatus = document.querySelector('.status');

  painelStatus.innerHTML = `
    <h2>Status Detalhado</h2>
    <div style="background: #2a2a2a; padding: 20px; border-radius: 8px; border-left: 5px solid #064D9F;">
      <h3 style="margin-top: 0; color: #fff; letter-spacing: 1px;">${criatura.nome}</h3>
      <div class="controle-hp" style="display: flex; align-items: center; gap: 10px;">
        <label style="color: #ccc;">HP Atual:</label>
        <input type="number" 
               class="input-status"
               data-id="${id}"
               value="${criatura.hpAtual}" 
               oninput="sincronizarHP(${id}, this.value)"
               style="width: 90px; font-size: 24px; text-align: center; background: #1e1e1e; color: white; border: 2px solid #064D9F; border-radius: 5px; outline: none;"> 
        <span style="font-size: 20px; color: #888;"> / ${criatura.hpMax}</span>
      </div>
      <p style="color: #555; font-size: 10px; margin-top: 20px;">REF: ${id}</p>
    </div>
  `;
}

function renderizarColetanea() {
  const painelMonstros = document.querySelector(".monstros");
  painelMonstros.innerHTML = "<h2>Coletânea de Monstros</h2>";

  coletaneaMonstros.forEach(monstro => {
    const item = document.createElement("div");
    item.style = "display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #333;";

    item.innerHTML = `
      <span style="color: #eee;">${monstro.nome} <small style="color: #777;">(HP: ${monstro.vidaMax})</small></span>
      <button class="btn-add" style="cursor: pointer; padding: 6px 12px; background: #064D9F; color: white; border: none; border-radius: 4px; font-weight: bold; transition: 0.2s;">+ Adicionar</button>
    `;

    item.querySelector(".btn-add").addEventListener("click", () => {
      adicionarIniciativaDeMonstro(monstro);
    });

    painelMonstros.appendChild(item);
  });
}

/* ==========================================================================
   5. SISTEMA DE DADOS E HISTÓRICO
   ========================================================================== */

function rolarDado(lados) {
  const modificador = parseInt(document.getElementById("modificador").value) || 0;
  const quantidade = parseInt(document.getElementById("quantidade").value) || 1;
  const qtdReal = quantidade > 0 ? quantidade : 1;

  let somaDados = 0;
  let rolagens = [];
  let critico = false;
  let falha = false;

  for (let i = 0; i < qtdReal; i++) {
    let rolagem = Math.floor(Math.random() * lados) + 1;
    somaDados += rolagem;
    rolagens.push(rolagem);

    if (lados === 20 && rolagem === 20) critico = true;
    if (lados === 20 && rolagem === 1) falha = true;
  }

  const total = somaDados + modificador;
  document.querySelector("#resultado-dado .valor").textContent = total;

  let txtMod = modificador !== 0 ? ` ${(modificador > 0 ? '+' : '')}${modificador}` : "";
  let txtHistorico = `Rolou ${qtdReal}d${lados}: [${rolagens.join(", ")}]${txtMod} = ${total}`;
  
  let tipo = "";
  if (falha) { txtHistorico += " (Falha!)"; tipo = "falha"; }
  else if (critico) { txtHistorico += " (Crítico!)"; tipo = "sucesso"; }

  adicionarHistorico(txtHistorico, tipo);
}

function adicionarHistorico(texto, tipo) {
  const log = document.getElementById("log-historico");
  const item = document.createElement("div");
  item.className = `log-item ${tipo || ""}`;
  item.style = "padding: 4px 0; border-bottom: 1px solid #333; font-size: 13px;";
  item.textContent = texto;
  log.appendChild(item);
  log.scrollTop = log.scrollHeight;
}

/* ==========================================================================
   6. INICIALIZAÇÃO E EVENTOS
   ========================================================================== */

const areaAnotacoes = document.getElementById("campo-anotacoes");
if(areaAnotacoes) {
    areaAnotacoes.value = localStorage.getItem("anotacoesRPG") || "";
    areaAnotacoes.addEventListener("input", () => {
        localStorage.setItem("anotacoesRPG", areaAnotacoes.value);
    });
}

// Inicializa a interface
renderizarColetanea();
atualizarIniciativa();