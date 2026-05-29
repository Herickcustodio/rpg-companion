/* ==========================================================================
   1. ESTADO GLOBAL (DADOS)
   ========================================================================== */
let listaDeIniciativa = JSON.parse(localStorage.getItem("iniciativaRPG")) || [];

// heróis são dinâmicos e salvos no navegador
let partyHerois = JSON.parse(localStorage.getItem("partyHeroisRPG")) || [];

const coletaneaMonstros = [
  { nome: "Goblin", vidaMax: 7 },
  { nome: "Orc", vidaMax: 15 },
  { nome: "Dragão Filhote", vidaMax: 50 }
];

/* ==========================================================================
   2. PERSISTÊNCIA E SINCRONIZAÇÃO
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
    atualizarIniciativa();
    renderizarStatusGrupo();
}

function adicionarNovoHeroi() {
    const nome = prompt("Nome do Herói:");
    if (!nome) return; // Cancela se não digitar o nome
    
    const classe = prompt("Classe do Herói (ex: Guerreiro, Mago):") || "Aventureiro";
    const nivel = prompt("Nível do Herói:") || "1";
    const hpMax = prompt("HP Máximo do Herói:") || "10";

    const novoHeroi = {
        id: 'h_' + Date.now(),
        nome: nome,
        classe: classe,
        nivel: nivel,
        hpMax: parseInt(hpMax) || 10,
        imagem: "" // Propriedade já criada para quando você atualizar a interface!
    };

    partyHerois.push(novoHeroi);
    salvarESincronizar();
}

function removerHeroi(idHeroi) {
    if(confirm("Deseja realmente remover este herói da party?")) {
        // Remove da lista de heróis
        partyHerois = partyHerois.filter(h => h.id !== idHeroi);
        // Remove da iniciativa também, caso ele esteja lá
        listaDeIniciativa = listaDeIniciativa.filter(c => c.idHeroi !== idHeroi);
        salvarESincronizar();
    }
}

   function salvarIniciativaNoCofre() {
  localStorage.setItem("iniciativaRPG", JSON.stringify(listaDeIniciativa));
}

function salvarESincronizar() {
    salvarIniciativaNoCofre();
    atualizarIniciativa();
    renderizarStatusGrupo();
}

/* ==========================================================================
   3. LÓGICA DE COMBATE
   ========================================================================== */

function adicionarIniciativaDeMonstro(monstro) {
  const valorIni = prompt(`Qual a iniciativa do ${monstro.nome}?`);
  if (valorIni !== null) {
    const quantidadeExistente = listaDeIniciativa.filter(c => c.nomeBase === monstro.nome).length;
    const letra = String.fromCharCode(65 + quantidadeExistente);

    listaDeIniciativa.push({
      id: Date.now(),
      nomeBase: monstro.nome,
      nome: `${monstro.nome} ${letra}`,
      valor: parseInt(valorIni) || 0,
      hpAtual: monstro.vidaMax,
      hpMax: monstro.vidaMax
    });
    salvarESincronizar();
  }
}

function lancarIniciativaHeroi(idHeroi) {
    const heroiBase = partyHerois.find(h => h.id === idHeroi);
    const valor = prompt(`Digite a iniciativa para ${heroiBase.nome}:`);
    
    if (valor !== null) {
        listaDeIniciativa = listaDeIniciativa.filter(c => c.idHeroi !== idHeroi);
        listaDeIniciativa.push({
            id: Date.now(),
            idHeroi: idHeroi,
            nome: heroiBase.nome,
            valor: parseInt(valor) || 0,
            hpAtual: heroiBase.hpMax,
            hpMax: heroiBase.hpMax
        });
        salvarESincronizar();
    }
}

function sincronizarHP(id, novoValor) {
  const criatura = listaDeIniciativa.find(c => c.id === id);
  if (criatura) {
    criatura.hpAtual = parseInt(novoValor) || 0;
    salvarESincronizar();
  }
}

function sincronizarVidaTudo(idHeroi, novoValor) {
    const itemIni = listaDeIniciativa.find(c => c.idHeroi === idHeroi);
    if (itemIni) {
        itemIni.hpAtual = parseInt(novoValor) || 0;
        salvarESincronizar();
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
      <div style="flex-grow: 1; display: flex; flex-direction: column;">
        <span style="font-weight: bold; color: #fff; font-size: 1.1em;">${personagem.nome}</span> 
        <span style="color: #28a745; font-size: 0.85em; font-weight: bold; margin-top: 4px;">Iniciativa: ${personagem.valor}</span>
      </div>
      <div class="controles-vida">
        <span style="color: #ccc; margin-right: 5px; font-size: 0.9em;">HP:</span>
        <input type="number" value="${personagem.hpAtual}" class="input-vida" 
               oninput="${personagem.idHeroi ? `sincronizarVidaTudo('${personagem.idHeroi}', this.value)` : `sincronizarHP(${personagem.id}, this.value)`}"
               style="width: 60px; background: #1e1e1e; color: white; border: 1px solid #444; text-align: center; border-radius: 3px; padding: 4px;">
      </div>
    `;
    container.appendChild(item);
  });
}

function renderizarStatusGrupo() {
    const container = document.getElementById('conteudo-status-grupo');
    if (!container) return;
    container.innerHTML = ""; 

    // Botão dinâmico para adicionar heróis direto pelo JS
    const btnAdd = document.createElement("button");
    btnAdd.textContent = "+ Criar Novo Herói";
    btnAdd.style = "width: 100%; padding: 8px; margin-bottom: 15px; background: #064D9F; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;";
    btnAdd.onclick = adicionarNovoHeroi;
    container.appendChild(btnAdd);
    
    partyHerois.forEach(heroi => {
        const naIni = listaDeIniciativa.find(c => c.idHeroi === heroi.id);
        const hpAtual = naIni ? naIni.hpAtual : heroi.hpMax;
        const valorIni = naIni ? naIni.valor : "-";

        const card = document.createElement("div");
        card.style = "background: #1e1e1e; padding: 10px; border-radius: 6px; border-left: 4px solid #064D9F; margin-bottom: 8px; position: relative;";
        
        card.innerHTML = `
            <button onclick="removerHeroi('${heroi.id}')" title="Remover Herói" style="position: absolute; top: 5px; right: 5px; background: none; border: none; color: #ff6b6b; cursor: pointer; font-weight: bold; font-size: 12px;">X</button>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; padding-right: 15px;">
                <strong style="color: #fff; font-size: 1.1em;">${heroi.nome}</strong>
                <span style="color: #28a745; font-weight: bold; font-size: 14px;">Ini: ${valorIni}</span>
            </div>
            
            <div style="font-size: 11px; color: #888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                Nvl ${heroi.nivel} | ${heroi.classe}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 5px;">
                    <span style="font-size: 12px; color: #aaa;">HP:</span>
                    <input type="number" value="${hpAtual}" oninput="sincronizarVidaTudo('${heroi.id}', this.value)"
                        style="width: 45px; background: #2a2a2a; color: #fff; border: 1px solid #444; text-align: center; border-radius: 3px;">
                </div>
                <button onclick="lancarIniciativaHeroi('${heroi.id}')" style="background: none; border: 1px solid #28a745; color: #28a745; border-radius: 4px; cursor: pointer; font-size: 10px; padding: 2px 5px;">
                    ${naIni ? 'Atualizar Ini' : '+ Iniciativa'}
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

/* ==========================================================================
   5. DADOS, HISTÓRICO E INICIALIZAÇÃO
   ========================================================================== */
function limparIniciativa() {
  if (confirm("Deseja realmente limpar toda a iniciativa?")) {
    // 1. Esvazia a lista de combate
    listaDeIniciativa = [];
    
    // 2. Salva e sincroniza tudo
    // Isso vai atualizar a lista da esquerda E o painel de status do grupo
    salvarESincronizar();
  }
}

function rolarDado(lados) {
  const modificador = parseInt(document.getElementById("modificador").value) || 0;
  const quantidade = parseInt(document.getElementById("quantidade").value) || 1;
  let somaDados = 0;
  let rolagens = [];

  for (let i = 0; i < quantidade; i++) {
    let rolagem = Math.floor(Math.random() * lados) + 1;
    somaDados += rolagem;
    rolagens.push(rolagem);
  }

  const total = somaDados + modificador;
  document.querySelector("#resultado-dado .valor").textContent = total;
  adicionarHistorico(`Rolou ${quantidade}d${lados}: [${rolagens.join(", ")}] + ${modificador} = ${total}`);
}

function adicionarHistorico(texto) {
  const log = document.getElementById("log-historico");
  const item = document.createElement("div");
  item.style = "padding: 4px 0; border-bottom: 1px solid #333; font-size: 13px; color: #eee;";
  item.textContent = texto;
  log.appendChild(item);
  log.scrollTop = log.scrollHeight;
}

function renderizarColetanea() {
  const painelMonstros = document.querySelector(".monstros");
  painelMonstros.innerHTML = "<h2>Coletânea de Monstros</h2>";
  coletaneaMonstros.forEach(monstro => {
    const item = document.createElement("div");
    item.style = "display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #333;";
    item.innerHTML = `
      <span style="color: #eee;">${monstro.nome} <small style="color: #777;">(HP: ${monstro.vidaMax})</small></span>
      <button onclick='adicionarIniciativaDeMonstro(${JSON.stringify(monstro)})' class="btn-add" style="cursor: pointer; padding: 6px 12px; background: #064D9F; color: white; border: none; border-radius: 4px; font-weight: bold;">+ Adicionar</button>
    `;
    painelMonstros.appendChild(item);
  });
}

/* ==========================================================================
   6. MODAIS E INTERAÇÕES DIVERSAS
   ========================================================================== */

// ===== MODAL SOBRE =====

function configurarModal(btnId, modalId, fecharId) {
    const botao = document.getElementById(btnId);
    const modal = document.getElementById(modalId);
    const fechar = document.getElementById(fecharId);

    botao.addEventListener("click", () => {
        modal.classList.remove("oculto");
    });

    fechar.addEventListener("click", () => {
        modal.classList.add("oculto");
    });

    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.add("oculto");
        }
    });
}

configurarModal("btn-sobre", "modal-sobre", "fechar-sobre");
configurarModal("btn-config", "modal-config", "fechar-config");
configurarModal("btn-ajuda", "modal-ajuda", "fechar-ajuda");

// Inicialização
window.onload = () => {
    renderizarColetanea();
    atualizarIniciativa();
    renderizarStatusGrupo();
    
    const areaAnotacoes = document.getElementById("campo-anotacoes");
    if(areaAnotacoes) {
        areaAnotacoes.value = localStorage.getItem("anotacoesRPG") || "";
        areaAnotacoes.addEventListener("input", () => localStorage.setItem("anotacoesRPG", areaAnotacoes.value));
    }
};

