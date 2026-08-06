/* ==========================================================================
   1. ESTADO GLOBAL
   ========================================================================== */
let listaDeIniciativa = JSON.parse(localStorage.getItem("iniciativaRPG")) || [];
let partyHerois       = JSON.parse(localStorage.getItem("partyHeroisRPG")) || [];
let turnoAtivo        = parseInt(localStorage.getItem("turnoAtivoRPG"))    || 0;
let monstrosCustom    = JSON.parse(localStorage.getItem("monstrosCustomRPG")) || [];

// coletaneaMonstros é carregada pelo monstros.js

const CONDICOES = [
  { id: "agarrado",      emoji: "🤝", label: "Agarrado",      descricao: "Deslocamento vira 0. O efeito termina se quem agarrou ficar incapacitado ou o alvo escapar mecanicamente."        },
  { id: "amedrontado",   emoji: "😱", label: "Amedrontado",    descricao: "Desvantagem em ataques e testes enquanto a fonte do medo estiver visível. Não pode se aproximar dela."             },
  { id: "atordoado",     emoji: "💫", label: "Atordoado",      descricao: "Incapacitado, não pode se mover, fala balbuciante. Ataques contra ele têm vantagem."                              },
  { id: "caido",         emoji: "🛡️", label: "Caído",          descricao: "Só pode rastejar. Ataques próprios com desvantagem. Ataques corpo a corpo contra si com vantagem, distância com desvantagem." },
  { id: "cego",          emoji: "🙈", label: "Cego",           descricao: "Falha em testes que dependem de visão. Ataques próprios com desvantagem, ataques contra si com vantagem."          },
  { id: "enfeiticado",   emoji: "💜", label: "Enfeitiçado",    descricao: "Não pode atacar o encantador. O encantador tem vantagem em interações sociais com o alvo."                         },
  { id: "envenenado",    emoji: "🤢", label: "Envenenado",     descricao: "Desvantagem em jogadas de ataque e testes de habilidade."                                                          },
  { id: "impedido",      emoji: "⛓️", label: "Impedido",       descricao: "Deslocamento vira 0. Ataques contra si com vantagem, próprios com desvantagem. Desvantagem em saves de Destreza."  },
  { id: "incapacitado",  emoji: "🚫", label: "Incapacitado",   descricao: "Não pode realizar ações, ações bônus ou reações."                                                                  },
  { id: "invisivel",     emoji: "👻", label: "Invisível",      descricao: "Impossível de ver sem sentidos especiais. Ataques próprios com vantagem, ataques contra si com desvantagem."       },
  { id: "paralisado",    emoji: "❄️", label: "Paralisado",     descricao: "Incapacitado, não se move nem fala. Falha automática em saves de For/Des. Acertos adjacentes são críticos."        },
  { id: "petrificado",   emoji: "🗿", label: "Petrificado",    descricao: "Transformado em pedra. Incapacitado, peso ×10, resistente a todo dano."                                            },
  { id: "surdo",         emoji: "🔇", label: "Surdo",          descricao: "Não pode ouvir. Falha automática em testes baseados em audição."                                                   },
  { id: "exaustao",      emoji: "😮‍💨", label: "Exaustão",      descricao: "Condição cumulativa. Níveis crescentes afetam testes e velocidade, podendo levar à morte no nível máximo."        },
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
   3b. MODAL DE NOVO MONSTRO CUSTOMIZADO
   ========================================================================== */
function abrirModalMonstro() {
  document.getElementById("monstro-nome").value = "";
  document.getElementById("monstro-hp").value   = "10";
  document.getElementById("monstro-nd").value   = "";
  document.getElementById("modal-monstro").classList.remove("oculto");
  document.getElementById("monstro-nome").focus();
}

function fecharModalMonstro() {
  document.getElementById("modal-monstro").classList.add("oculto");
}

function confirmarNovoMonstro() {
  const nome = document.getElementById("monstro-nome").value.trim();
  if (!nome) { document.getElementById("monstro-nome").focus(); return; }

  const novoMonstro = {
    id:      "mc_" + Date.now(),
    nome,
    vidaMax: parseInt(document.getElementById("monstro-hp").value) || 10,
    nd:      document.getElementById("monstro-nd").value.trim() || "?",
    custom:  true
  };

  monstrosCustom.push(novoMonstro);
  localStorage.setItem("monstrosCustomRPG", JSON.stringify(monstrosCustom));
  fecharModalMonstro();

  const inputBusca = document.getElementById("busca-monstros");
  renderizarColetanea(inputBusca ? inputBusca.value : "");
}

function deletarMonstroCustom(id) {
  if (!confirm("Deseja remover este monstro da coletânea?")) return;
  monstrosCustom = monstrosCustom.filter(m => m.id !== id);
  localStorage.setItem("monstrosCustomRPG", JSON.stringify(monstrosCustom));

  const inputBusca = document.getElementById("busca-monstros");
  renderizarColetanea(inputBusca ? inputBusca.value : "");
}


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

  const cond = CONDICOES.find(c => c.id === condicaoId);
  const idx  = criatura.condicoes.indexOf(condicaoId);

  if (idx === -1) {
    criatura.condicoes.push(condicaoId);
    adicionarHistorico(`${cond.emoji} ${criatura.nome} recebeu a condição: ${cond.label}`);
  } else {
    criatura.condicoes.splice(idx, 1);
    adicionarHistorico(`✅ ${criatura.nome} se recuperou de: ${cond.label}`);
  }

  salvarESincronizar();
}

/** Alterna o estado de morte do combatente sem removê-lo da lista */
function marcarMorto(id) {
  const criatura = listaDeIniciativa.find(c => c.id === id);
  if (!criatura) return;

  if (criatura.morto) {
    criatura.morto = false;
    adicionarHistorico(`💚 ${criatura.nome} foi revivido!`, "sucesso");
  } else {
    if (!confirm(`Marcar "${criatura.nome}" como morto?`)) return;
    criatura.morto = true;
    adicionarHistorico(`☠️ ${criatura.nome} morreu!`, "falha");
  }

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
    item.className = "item-iniciativa"
      + (ativo          ? " item-iniciativa--ativo" : "")
      + (personagem.morto ? " item-iniciativa--morto" : "");

    // ── Cabeçalho: nome + botão remover
    const cabecalho = document.createElement("div");
    cabecalho.className = "item-ini-cabecalho";

    const nome = document.createElement("span");
    nome.className = "item-iniciativa-nome";
    nome.textContent = (ativo ? "▶ " : "") + (personagem.morto ? "☠️ " : "") + personagem.nome;

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

    // ── Condições ativas (tags visíveis no card)
    const divTagsAtivas = document.createElement("div");
    divTagsAtivas.className = "item-ini-tags-ativas";

    condicoes.forEach(condId => {
      const cond = CONDICOES.find(c => c.id === condId);
      if (!cond) return;
      const tag = document.createElement("button");
      tag.className   = "tag-ativa";
      tag.textContent = `${cond.emoji} ${cond.label}`;
      tag.title       = cond.descricao;
      tag.addEventListener("click", () => toggleCondicao(personagem.id, cond.id));
      divTagsAtivas.appendChild(tag);
    });

    // ── Botão "+ Condição" + popover
    const divCondicaoWrap = document.createElement("div");
    divCondicaoWrap.className = "condicao-wrap";

    const btnAbrirCond = document.createElement("button");
    btnAbrirCond.className   = "btn-abrir-condicao";
    btnAbrirCond.textContent = "+ Condição";

    const popover = document.createElement("div");
    popover.className = "condicao-popover oculto";
    document.body.appendChild(popover);

    CONDICOES.forEach(cond => {
      const ativa = condicoes.includes(cond.id);
      const opcao = document.createElement("button");
      opcao.className   = "condicao-opcao" + (ativa ? " condicao-opcao--ativa" : "");
      opcao.title       = cond.descricao;
      opcao.innerHTML   = `<span class="cond-emoji">${cond.emoji}</span><span class="cond-label">${cond.label}</span>`;
      opcao.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleCondicao(personagem.id, cond.id);
      });
      popover.appendChild(opcao);
    });

    btnAbrirCond.addEventListener("click", (e) => {
      e.stopPropagation();
      // Fecha todos os outros popovers abertos
      document.querySelectorAll(".condicao-popover:not(.oculto)").forEach(p => {
        if (p !== popover) p.classList.add("oculto");
      });
      if (popover.classList.contains("oculto")) {
        const rect = btnAbrirCond.getBoundingClientRect();
        popover.style.top  = (rect.bottom + 6) + "px";
        popover.style.left = rect.left + "px";
      }
      popover.classList.toggle("oculto");
    });

    // ── Rodapé: "+ Condição" + "☠️"
    const divRodape = document.createElement("div");
    divRodape.className = "item-ini-rodape";

    divCondicaoWrap.appendChild(btnAbrirCond);
    divRodape.appendChild(divCondicaoWrap);

    const btnMorte = document.createElement("button");
    btnMorte.textContent = personagem.morto ? "💚 Reviver" : "☠️";
    btnMorte.className   = personagem.morto ? "btn-morte-ini btn-morte-ini--reviver" : "btn-morte-ini";
    btnMorte.title       = personagem.morto ? "Reviver combatente" : "Marcar como morto";
    btnMorte.addEventListener("click", () => marcarMorto(personagem.id));
    divRodape.appendChild(btnMorte);

    // ── Monta item
    item.appendChild(cabecalho);
    item.appendChild(iniciativaSpan);
    item.appendChild(barraWrap);
    item.appendChild(controles);
    if (divTagsAtivas.children.length > 0) item.appendChild(divTagsAtivas);
    item.appendChild(divRodape);
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
function renderizarColetanea(filtro = "") {
  const container = document.getElementById("conteudo-monstros");
  if (!container) return;
  container.innerHTML = "";

  const termo = filtro.toLowerCase().trim();

  // Mescla customizados (primeiro) com os oficiais
  const listaCompleta = [
    ...monstrosCustom,
    ...coletaneaMonstros
  ];

  const lista = termo
    ? listaCompleta.filter(m => m.nome.toLowerCase().includes(termo))
    : listaCompleta;

  lista.forEach(monstro => {
    const item = document.createElement("div");
    item.className = "item-monstro" + (monstro.custom ? " item-monstro-custom" : "");

    const infoNome = document.createElement("span");
    infoNome.className = "item-monstro-nome";
    infoNome.innerHTML = `${monstro.nome}${monstro.custom ? '<span class="badge-custom">custom</span>' : ''} <small class="item-monstro-hp">(HP: ${monstro.vidaMax} | ND: ${monstro.nd})</small>`;

    const controles = document.createElement("div");
    controles.style.display = "flex";
    controles.style.alignItems = "center";

    const btnAdd = document.createElement("button");
    btnAdd.textContent = "+ Adicionar";
    btnAdd.className   = "btn-add-monstro";
    btnAdd.addEventListener("click", () => adicionarIniciativaDeMonstro(monstro));
    controles.appendChild(btnAdd);

    if (monstro.custom) {
      const btnDel = document.createElement("button");
      btnDel.textContent = "✕";
      btnDel.className   = "btn-deletar-monstro";
      btnDel.title       = "Remover da coletânea";
      btnDel.addEventListener("click", () => deletarMonstroCustom(monstro.id));
      controles.appendChild(btnDel);
    }

    item.appendChild(infoNome);
    item.appendChild(controles);
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

  const inputBusca = document.getElementById("busca-monstros");
  if (inputBusca) {
    inputBusca.addEventListener("input", () => renderizarColetanea(inputBusca.value));
  }

  // Modal de monstro customizado
  document.getElementById("btn-novo-monstro").addEventListener("click", abrirModalMonstro);
  document.getElementById("fechar-monstro").addEventListener("click", fecharModalMonstro);
  document.getElementById("btn-confirmar-monstro").addEventListener("click", confirmarNovoMonstro);
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-monstro")) fecharModalMonstro(); });
  document.getElementById("modal-monstro").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarNovoMonstro(); });

  atualizarIniciativa();
  renderizarStatusGrupo();

  const historicoSalvo = JSON.parse(localStorage.getItem("historicoRPG")) || [];
  historicoSalvo.forEach(e => renderizarItemHistorico(e.texto, e.tipo));

  const areaAnotacoes = document.getElementById("campo-anotacoes");
  if (areaAnotacoes) {
    areaAnotacoes.value = localStorage.getItem("anotacoesRPG") || "";
    areaAnotacoes.addEventListener("input", () => localStorage.setItem("anotacoesRPG", areaAnotacoes.value));
  }

  // Fecha qualquer popover de condição ao clicar fora
  document.addEventListener("click", () => {
    document.querySelectorAll(".condicao-popover:not(.oculto)")
      .forEach(p => p.classList.add("oculto"));
  });

  // Botões de controle de turno
  document.getElementById("btn-turno-anterior").addEventListener("click", turnoAnterior);
  document.getElementById("btn-proximo-turno").addEventListener("click", proximoTurno);
};