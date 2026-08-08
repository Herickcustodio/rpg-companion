/* ==========================================================================
   1. ESTADO GLOBAL
   ========================================================================== */
let listaDeIniciativa  = JSON.parse(localStorage.getItem("iniciativaRPG"))      || [];
let partyHerois        = JSON.parse(localStorage.getItem("partyHeroisRPG"))     || [];
let turnoAtivo         = parseInt(localStorage.getItem("turnoAtivoRPG"))        || 0;
let rodadaAtual        = parseInt(localStorage.getItem("rodadaAtualRPG"))       || 1;
let monstrosCustom     = JSON.parse(localStorage.getItem("monstrosCustomRPG"))  || [];
let efeitosTemporarios = JSON.parse(localStorage.getItem("efeitosRPG"))         || [];

// coletaneaMonstros é carregada pelo monstros.js

const CORES_HEROI = [
  { id: "azul",     hex: "#3b82f6", label: "Azul"     },
  { id: "verde",    hex: "#22c55e", label: "Verde"     },
  { id: "amarelo",  hex: "#eab308", label: "Amarelo"   },
  { id: "laranja",  hex: "#f97316", label: "Laranja"   },
  { id: "vermelho", hex: "#ef4444", label: "Vermelho"  },
  { id: "roxo",     hex: "#a855f7", label: "Roxo"      },
  { id: "rosa",     hex: "#ec4899", label: "Rosa"      },
  { id: "ciano",    hex: "#06b6d4", label: "Ciano"     },
  { id: "branco",   hex: "#e5e7eb", label: "Branco"    },
  { id: "ouro",     hex: "#d97706", label: "Ouro"      },
];

let _corSelecionada = null;

function renderizarSeletorCores() {
  const container = document.getElementById("heroi-cores");
  if (!container) return;
  container.innerHTML = "";

  const coresUsadas = partyHerois.map(h => h.cor).filter(Boolean);

  CORES_HEROI.forEach(cor => {
    const usada = coresUsadas.includes(cor.id);
    const btn   = document.createElement("button");
    btn.type      = "button";
    btn.title     = usada ? `${cor.label} (em uso)` : cor.label;
    btn.className = "cor-heroi-btn" + (usada ? " cor-heroi-btn--usada" : "") + (_corSelecionada === cor.id ? " cor-heroi-btn--selecionada" : "");
    btn.style.background = cor.hex;
    btn.disabled = usada;
    btn.addEventListener("click", () => {
      _corSelecionada = cor.id;
      renderizarSeletorCores();
    });
    container.appendChild(btn);
  });
}

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
  localStorage.setItem("turnoAtivoRPG",  turnoAtivo);
  localStorage.setItem("rodadaAtualRPG", rodadaAtual);
  localStorage.setItem("efeitosRPG",     JSON.stringify(efeitosTemporarios));
  atualizarIniciativa();
  renderizarStatusGrupo();
  atualizarPainelTurno();
}

/* ==========================================================================
   3. MODAL DE NOVO HERÓI
   ========================================================================== */
function abrirModalHeroi() {
  document.getElementById("heroi-nome").value   = "";
  document.getElementById("heroi-classe").value = "";
  document.getElementById("heroi-nivel").value  = "1";
  document.getElementById("heroi-hp").value     = "10";
  document.getElementById("heroi-ca").value     = "10";
  // Seleciona automaticamente a primeira cor disponível
  const coresUsadas = partyHerois.map(h => h.cor).filter(Boolean);
  const primeiraLivre = CORES_HEROI.find(c => !coresUsadas.includes(c.id));
  _corSelecionada = primeiraLivre ? primeiraLivre.id : null;
  renderizarSeletorCores();
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
    ca:     parseInt(document.getElementById("heroi-ca").value) || 10,
    cor:    _corSelecionada,
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
    ca:      document.getElementById("monstro-nd").value.trim() || "?",
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
    const jaEstava  = !!entradaAnterior;

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

    const caTxt = heroiBase.ca ? ` | CA: ${heroiBase.ca}` : "";
    if (jaEstava) adicionarHistorico(`🔄 ${heroiBase.nome} atualizou iniciativa para ${valor}`);
    else          adicionarHistorico(`🦸 ${heroiBase.nome} entrou no combate! (Ini: ${valor} | HP: ${heroiBase.hpMax}${caTxt})`);

  } else if (ctx.tipo === "monstro") {
    const entradaMonstro = {
      id:        Date.now(),
      nomeBase:  ctx.monstro.nome,
      nome:      ctx.nomeCompleto,
      valor,
      hpAtual:   ctx.monstro.vidaMax,
      hpMax:     ctx.monstro.vidaMax,
      condicoes: []
    };
    if (ctx.monstro.custom && ctx.monstro.id) {
      entradaMonstro.idMonstroCustom = ctx.monstro.id;
    }
    listaDeIniciativa.push(entradaMonstro);

    const caTxt = ctx.monstro.ca ? ` | CA: ${ctx.monstro.ca}` : "";
    adicionarHistorico(`⚔️ ${ctx.nomeCompleto} entrou no combate! (Ini: ${valor} | HP: ${ctx.monstro.vidaMax}${caTxt})`);
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

/* ==========================================================================
   MODAL DE DURAÇÃO DE CONDIÇÃO
   ========================================================================== */
let _condicaoCtx = null; // { criaturaId, condicaoId }

function abrirModalCondicaoDuracao(criaturaId, condicaoId) {
  const criatura = listaDeIniciativa.find(c => c.id === criaturaId);
  if (!criatura) return;

  const cond     = CONDICOES.find(c => c.id === condicaoId);
  const jaAtiva  = (criatura.condicoes || []).find(c => c.id === condicaoId);

  // Se já está ativa, remove direto sem abrir modal
  if (jaAtiva) {
    removerCondicao(criaturaId, condicaoId);
    return;
  }

  _condicaoCtx = { criaturaId, condicaoId };
  document.getElementById("modal-condicao-titulo").textContent = `${cond.emoji} ${cond.label} — ${criatura.nome}`;
  document.getElementById("condicao-rodadas").value = "1";
  document.getElementById("modal-condicao-duracao").classList.remove("oculto");
  document.getElementById("condicao-rodadas").focus();
}

function fecharModalCondicaoDuracao() {
  document.getElementById("modal-condicao-duracao").classList.add("oculto");
  _condicaoCtx = null;
}

function confirmarCondicao() {
  if (!_condicaoCtx) return;
  const { criaturaId, condicaoId } = _condicaoCtx;
  const criatura = listaDeIniciativa.find(c => c.id === criaturaId);
  if (!criatura) return;
  if (!criatura.condicoes) criatura.condicoes = [];

  const rodadasVal = document.getElementById("condicao-rodadas").value.trim();
  const rodadas    = rodadasVal !== "" ? parseInt(rodadasVal) || 1 : null; // null = indefinido
  const cond       = CONDICOES.find(c => c.id === condicaoId);

  criatura.condicoes.push({ id: condicaoId, rodadas });

  const duracaoTxt = rodadas ? `${rodadas} rodada${rodadas > 1 ? "s" : ""}` : "indefinido";
  adicionarHistorico(`${cond.emoji} ${criatura.nome} recebeu: ${cond.label} (${duracaoTxt})`);

  fecharModalCondicaoDuracao();
  salvarESincronizar();
}

function removerCondicao(criaturaId, condicaoId) {
  const criatura = listaDeIniciativa.find(c => c.id === criaturaId);
  if (!criatura) return;
  const cond = CONDICOES.find(c => c.id === condicaoId);
  criatura.condicoes = (criatura.condicoes || []).filter(c => c.id !== condicaoId);
  adicionarHistorico(`✅ ${criatura.nome} se recuperou de: ${cond.label}`);
  salvarESincronizar();
}

/** Decrementa rodadas de condições ao virar rodada */
function decrementarCondicoes() {
  listaDeIniciativa.forEach(criatura => {
    if (!criatura.condicoes) return;
    const expiradas = [];
    criatura.condicoes = criatura.condicoes.map(c => {
      if (c.rodadas === null) return c; // indefinido, não decrementa
      const novas = c.rodadas - 1;
      if (novas <= 0) { expiradas.push(c.id); return null; }
      if (novas === 1) {
        const cond = CONDICOES.find(x => x.id === c.id);
        adicionarHistorico(`⚠️ ${criatura.nome}: "${cond?.label}" expira na próxima rodada!`);
      }
      return { ...c, rodadas: novas };
    }).filter(Boolean);

    expiradas.forEach(id => {
      const cond = CONDICOES.find(x => x.id === id);
      adicionarHistorico(`⏰ ${criatura.nome}: condição "${cond?.label}" expirou!`, "falha");
    });
  });
}

/** Alterna uma condição — agora abre modal para definir duração */
function toggleCondicao(id, condicaoId) {
  abrirModalCondicaoDuracao(id, condicaoId);
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
   5b. MODAL DE DANO / CURA
   ========================================================================== */
let _modalDanoCuraId   = null;
let _modalDanoCuraTipo = null;

function abrirModalDanoCura(id, tipo) {
  const criatura = listaDeIniciativa.find(c => c.id === id);
  if (!criatura) return;

  _modalDanoCuraId   = id;
  _modalDanoCuraTipo = tipo;
  const isDano = tipo === "dano";

  document.getElementById("modal-dano-titulo").textContent    = isDano ? `⚔️ Dano — ${criatura.nome}` : `💊 Cura — ${criatura.nome}`;
  document.getElementById("modal-dano-hp-atual").textContent  = `HP atual: ${criatura.hpAtual} / ${criatura.hpMax}`;
  document.getElementById("modal-dano-resultado").textContent = "—";
  document.getElementById("modal-dano-resultado").className   = "modal-dano-valor";
  document.getElementById("modal-dano-formula-txt").textContent = "";
  document.getElementById("modal-dano-modificador").value     = "0";
  document.getElementById("modal-dano-manual").value          = "";
  document.getElementById("modal-dano-qtd").value             = "1";
  document.getElementById("modal-dano-tipo").value            = "20";
  document.getElementById("btn-confirmar-dano").textContent   = isDano ? "⚔️ Aplicar Dano" : "💊 Aplicar Cura";
  document.getElementById("btn-confirmar-dano").className     = isDano ? "btn-confirmar btn-confirmar-dano" : "btn-confirmar btn-confirmar-cura";

  const btnMortoModal = document.getElementById("btn-morto-modal");
  btnMortoModal.style.display = isDano ? "block" : "none";
  btnMortoModal.textContent   = criatura.morto ? "💚 Reviver" : "☠️ Marcar como Morto";
  btnMortoModal.className     = criatura.morto ? "btn-morto-modal btn-morto-modal--reviver" : "btn-morto-modal";

  const aviso = document.getElementById("modal-dano-aviso");
  if (aviso) aviso.style.display = isDano ? "none" : "block";

  document.getElementById("modal-dano-cura").classList.remove("oculto");
  document.getElementById("modal-dano-modificador").focus();
}

function fecharModalDanoCura() {
  document.getElementById("modal-dano-cura").classList.add("oculto");
  _modalDanoCuraId   = null;
  _modalDanoCuraTipo = null;
}

function rolarDadoModal() {
  const quantidade  = parseInt(document.getElementById("modal-dano-qtd").value)  || 1;
  const lados       = parseInt(document.getElementById("modal-dano-tipo").value)  || 20;
  const modificador = parseInt(document.getElementById("modal-dano-modificador").value) || 0;

  let soma = 0;
  const rolagens = [];
  for (let i = 0; i < quantidade; i++) {
    const r = Math.floor(Math.random() * lados) + 1;
    soma += r;
    rolagens.push(r);
  }
  const total = Math.max(0, soma + modificador);

  const display = document.getElementById("modal-dano-resultado");
  display.textContent = total;
  display.className   = "modal-dano-valor " + (_modalDanoCuraTipo === "dano" ? "modal-dano-valor--dano" : "modal-dano-valor--cura");

  const sinal = modificador >= 0 ? "+" : "";
  document.getElementById("modal-dano-formula-txt").textContent = `(${quantidade}d${lados}: [${rolagens.join(", ")}] ${sinal}${modificador})`;
  document.getElementById("modal-dano-manual").value = total;
}

function confirmarDanoCura() {
  const valor = parseInt(document.getElementById("modal-dano-manual").value);
  if (isNaN(valor) || valor < 0) { document.getElementById("modal-dano-manual").focus(); return; }

  const criatura = listaDeIniciativa.find(c => c.id === _modalDanoCuraId);
  if (!criatura) return;

  const hpAntes = criatura.hpAtual;

  if (_modalDanoCuraTipo === "dano") {
    criatura.hpAtual = Math.max(0, criatura.hpAtual - valor);
    adicionarHistorico(`⚔️ ${criatura.nome} recebeu ${valor} de dano (${hpAntes} → ${criatura.hpAtual} HP)`, "falha");
    if (criatura.hpAtual === 0 && !criatura.morto) {
      adicionarHistorico(`💀 ${criatura.nome} chegou a 0 HP!`, "falha");
    }
  } else {
    criatura.hpAtual = Math.min(criatura.hpMax, criatura.hpAtual + valor);
    adicionarHistorico(`💊 ${criatura.nome} recuperou ${valor} de HP (${hpAntes} → ${criatura.hpAtual} HP)`, "sucesso");
  }

  fecharModalDanoCura();
  salvarESincronizar();
}

function mortoViaModal() {
  const id = _modalDanoCuraId;
  fecharModalDanoCura();
  marcarMorto(id);
}

/* ==========================================================================
   5b. RASTREADOR DE EFEITOS TEMPORÁRIOS
   ========================================================================== */
function abrirFormEfeito() {
  document.getElementById("turno-efeito-form").classList.remove("oculto");
  document.getElementById("efeito-nome").value    = "";
  document.getElementById("efeito-rodadas").value = "1";
  document.getElementById("efeito-nome").focus();
}

function fecharFormEfeito() {
  document.getElementById("turno-efeito-form").classList.add("oculto");
}

function confirmarEfeito() {
  const nome    = document.getElementById("efeito-nome").value.trim();
  const rodadas = parseInt(document.getElementById("efeito-rodadas").value) || 1;
  if (!nome) { document.getElementById("efeito-nome").focus(); return; }

  efeitosTemporarios.push({ id: "ef_" + Date.now(), nome, rodadas });
  adicionarHistorico(`⏳ Efeito adicionado: "${nome}" (${rodadas} rodada${rodadas > 1 ? "s" : ""})`);
  fecharFormEfeito();
  salvarESincronizar();
}

function removerEfeito(id) {
  const ef = efeitosTemporarios.find(e => e.id === id);
  if (ef) adicionarHistorico(`🗑️ Efeito removido: "${ef.nome}"`);
  efeitosTemporarios = efeitosTemporarios.filter(e => e.id !== id);
  salvarESincronizar();
}

function renderizarEfeitos() {
  const lista = document.getElementById("turno-efeitos-lista");
  if (!lista) return;
  lista.innerHTML = "";

  if (efeitosTemporarios.length === 0) {
    lista.innerHTML = `<p class="efeitos-vazio">Nenhum efeito ativo.</p>`;
    return;
  }

  efeitosTemporarios.forEach(ef => {
    const urgente = ef.rodadas === 1;
    const item = document.createElement("div");
    item.className = "efeito-item" + (urgente ? " efeito-item--urgente" : "");

    const info = document.createElement("div");
    info.className = "efeito-info";

    const nome = document.createElement("span");
    nome.className   = "efeito-nome";
    nome.textContent = ef.nome;

    const rodadas = document.createElement("span");
    rodadas.className   = "efeito-rodadas";
    rodadas.textContent = `${ef.rodadas} rodada${ef.rodadas > 1 ? "s" : ""}`;

    info.appendChild(nome);
    info.appendChild(rodadas);

    const btnDel = document.createElement("button");
    btnDel.textContent = "✕";
    btnDel.className   = "efeito-btn-del";
    btnDel.title       = "Remover efeito";
    btnDel.addEventListener("click", () => removerEfeito(ef.id));

    item.appendChild(info);
    item.appendChild(btnDel);
    lista.appendChild(item);
  });
}


function proximoTurno() {
  if (listaDeIniciativa.length === 0) return;
  turnoAtivo++;
  if (turnoAtivo >= listaDeIniciativa.length) {
    turnoAtivo = 0;
    rodadaAtual++;
    adicionarHistorico(`🔄 Rodada ${rodadaAtual} iniciada!`);
    decrementarCondicoes();
    // Decrementa efeitos temporários avulsos
    efeitosTemporarios = efeitosTemporarios.map(e => ({ ...e, rodadas: e.rodadas - 1 }));
    efeitosTemporarios.forEach(e => {
      if (e.rodadas <= 0) adicionarHistorico(`⏰ Efeito expirado: "${e.nome}"`, "falha");
      else if (e.rodadas === 1) adicionarHistorico(`⚠️ "${e.nome}" expira na próxima rodada!`);
    });
    efeitosTemporarios = efeitosTemporarios.filter(e => e.rodadas > 0);
  }
  salvarESincronizar();
}

function turnoAnterior() {
  if (listaDeIniciativa.length === 0) return;
  turnoAtivo = (turnoAtivo - 1 + listaDeIniciativa.length) % listaDeIniciativa.length;
  salvarESincronizar();
}

function atualizarPainelTurno() {
  const numEl   = document.getElementById("turno-rodada-num");
  const cardEl  = document.getElementById("turno-ativo-card");
  const vazioEl = document.getElementById("turno-vazio-msg");
  const nomeEl  = document.getElementById("turno-ativo-nome");
  const detEl   = document.getElementById("turno-ativo-detalhes");
  const barraEl = document.getElementById("turno-ativo-barra");

  if (numEl) numEl.textContent = rodadaAtual;

  if (listaDeIniciativa.length === 0) {
    if (cardEl)  cardEl.classList.add("oculto");
    if (vazioEl) vazioEl.style.display = "block";
    renderizarCondicoesAtivas();
    return;
  }

  if (cardEl)  cardEl.classList.remove("oculto");
  if (vazioEl) vazioEl.style.display = "none";

  const atual = listaDeIniciativa[turnoAtivo];
  if (!atual) return;

  // Aplica cor do herói na borda do card
  if (atual.idHeroi) {
    const h   = partyHerois.find(h => h.id === atual.idHeroi);
    const cor = h?.cor ? CORES_HEROI.find(c => c.id === h.cor) : null;
    cardEl.style.borderLeftColor = cor ? cor.hex : "#5aabff";
    if (nomeEl) nomeEl.style.color = cor ? cor.hex : "#5aabff";
  } else {
    cardEl.style.borderLeftColor = "#5aabff";
    if (nomeEl) nomeEl.style.color = "#5aabff";
  }

  if (nomeEl) nomeEl.textContent = `▶ ${atual.nome}`;

  const pct = atual.hpMax > 0 ? Math.max(0, Math.min(100, (atual.hpAtual / atual.hpMax) * 100)) : 0;
  const cor  = calcularCorHP(atual.hpAtual, atual.hpMax);
  if (barraEl) { barraEl.style.width = pct + "%"; barraEl.style.background = cor; }

  // Condições do combatente ativo no card
  const condicoesTags = (atual.condicoes || [])
    .map(c => CONDICOES.find(x => x.id === c.id))
    .filter(Boolean)
    .map(c => `<span class="turno-ativo-cond-tag" title="${c.descricao}">${c.emoji} ${c.label}</span>`)
    .join("");

  if (detEl) detEl.innerHTML = `
    <span class="turno-ativo-hp">❤️ ${atual.hpAtual} / ${atual.hpMax} HP</span>
    <span class="turno-ativo-ini">⚡ Ini: ${atual.valor}</span>
    ${condicoesTags ? `<div class="turno-ativo-condicoes">${condicoesTags}</div>` : ""}
  `;

  renderizarCondicoesAtivas();
}

/** Lista todas as condições ativas de todos os combatentes no painel de turno */
function renderizarCondicoesAtivas() {
  const lista = document.getElementById("turno-efeitos-lista");
  if (!lista) return;
  lista.innerHTML = "";

  // Coleta todas as condições com rodadas definidas de todos os combatentes
  const todasCondicoes = [];
  listaDeIniciativa.forEach(criatura => {
    (criatura.condicoes || []).forEach(condObj => {
      const cond = CONDICOES.find(c => c.id === condObj.id);
      if (cond) todasCondicoes.push({ criatura, condObj, cond });
    });
  });

  if (todasCondicoes.length === 0) {
    lista.innerHTML = `<p class="efeitos-vazio">Nenhuma condição ativa.</p>`;
    return;
  }

  todasCondicoes.forEach(({ criatura, condObj, cond }) => {
    const urgente = condObj.rodadas === 1;
    const item    = document.createElement("div");
    item.className = "efeito-item" + (urgente ? " efeito-item--urgente" : "");

    const info = document.createElement("div");
    info.className = "efeito-info";

    const nomeCond = document.createElement("span");
    nomeCond.className   = "efeito-nome";
    nomeCond.textContent = `${cond.emoji} ${cond.label}`;

    const sub = document.createElement("span");
    sub.className = "efeito-rodadas";
    sub.textContent = condObj.rodadas !== null
      ? `${criatura.nome} · ${condObj.rodadas} rodada${condObj.rodadas > 1 ? "s" : ""}`
      : `${criatura.nome} · indefinido`;

    info.appendChild(nomeCond);
    info.appendChild(sub);

    const btnDel = document.createElement("button");
    btnDel.textContent = "✕";
    btnDel.className   = "efeito-btn-del";
    btnDel.title       = "Remover condição";
    btnDel.addEventListener("click", () => removerCondicao(criatura.id, cond.id));

    item.appendChild(info);
    item.appendChild(btnDel);
    lista.appendChild(item);
  });
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
      + (ativo           ? " item-iniciativa--ativo" : "")
      + (personagem.morto ? " item-iniciativa--morto" : "");

    // Cor do herói na borda esquerda
    if (personagem.idHeroi) {
      const h   = partyHerois.find(h => h.id === personagem.idHeroi);
      const cor = h?.cor ? CORES_HEROI.find(c => c.id === h.cor) : null;
      if (cor) item.style.borderLeft = `4px solid ${cor.hex}`;
    }

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
    // Busca CA — herói tem no partyHerois, monstro tem no próprio objeto da lista
    const caValor = (() => {
      if (personagem.idHeroi) {
        const h = partyHerois.find(h => h.id === personagem.idHeroi);
        return h?.ca ?? null;
      }
      // Monstro custom: busca pelo id salvo no objeto
      if (personagem.idMonstroCustom) {
        const mc = monstrosCustom.find(m => m.id === personagem.idMonstroCustom);
        if (mc) return mc.ca ?? null;
      }
      // Monstro oficial: busca pelo nomeBase
      const m = coletaneaMonstros.find(m => m.nome === personagem.nomeBase);
      return m?.ca ?? null;
    })();

    const iniciativaSpan = document.createElement("span");
    iniciativaSpan.className = "item-iniciativa-valor";
    iniciativaSpan.innerHTML = `Ini: ${personagem.valor}${caValor !== null ? ` &nbsp;·&nbsp; <span class="item-ini-ca">🛡️ CA ${caValor}</span>` : ""}`;

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

    condicoes.forEach(condObj => {
      const cond = CONDICOES.find(c => c.id === condObj.id);
      if (!cond) return;
      const tag = document.createElement("button");
      tag.className = "tag-ativa";
      const duracaoTxt = condObj.rodadas !== null ? ` (${condObj.rodadas}🔄)` : "";
      tag.textContent  = `${cond.emoji} ${cond.label}${duracaoTxt}`;
      tag.title        = `${cond.descricao}\nClique para remover.`;
      tag.addEventListener("click", () => removerCondicao(personagem.id, cond.id));
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
      const ativa = condicoes.some(c => c.id === cond.id);
      const opcao = document.createElement("button");
      opcao.className = "condicao-opcao" + (ativa ? " condicao-opcao--ativa" : "");
      opcao.title     = cond.descricao;
      opcao.innerHTML = `<span class="cond-emoji">${cond.emoji}</span><span class="cond-label">${cond.label}</span>`;
      opcao.addEventListener("click", (e) => {
        e.stopPropagation();
        popover.classList.add("oculto");
        toggleCondicao(personagem.id, cond.id);
      });
      popover.appendChild(opcao);
    });

    btnAbrirCond.addEventListener("click", (e) => {
      e.stopPropagation();
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

    // ── Rodapé: "+ Condição" | "⚔️ Dano" | "💊 Cura" | "☠️"
    const divRodape = document.createElement("div");
    divRodape.className = "item-ini-rodape";

    divCondicaoWrap.appendChild(btnAbrirCond);
    divRodape.appendChild(divCondicaoWrap);

    const divAcoes = document.createElement("div");
    divAcoes.className = "item-ini-acoes";

    const btnDano = document.createElement("button");
    btnDano.textContent = "⚔️ Dano";
    btnDano.className   = "btn-acao-ini btn-acao-dano";
    btnDano.title       = "Aplicar dano";
    btnDano.addEventListener("click", () => abrirModalDanoCura(personagem.id, "dano"));

    const btnCura = document.createElement("button");
    btnCura.textContent = "💊 Cura";
    btnCura.className   = "btn-acao-ini btn-acao-cura";
    btnCura.title       = "Aplicar cura";
    btnCura.addEventListener("click", () => abrirModalDanoCura(personagem.id, "cura"));

    const btnMorte = document.createElement("button");
    btnMorte.textContent = personagem.morto ? "💚" : "☠️";
    btnMorte.className   = personagem.morto ? "btn-morte-ini btn-morte-ini--reviver" : "btn-morte-ini";
    btnMorte.title       = personagem.morto ? "Reviver combatente" : "Marcar como morto";
    btnMorte.addEventListener("click", () => marcarMorto(personagem.id));

    divAcoes.appendChild(btnDano);
    divAcoes.appendChild(btnCura);
    divAcoes.appendChild(btnMorte);
    divRodape.appendChild(divAcoes);

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
    if (heroi.cor) {
      const cor = CORES_HEROI.find(c => c.id === heroi.cor);
      if (cor) card.style.borderLeftColor = cor.hex;
    }

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
    sub.textContent = `Nvl ${heroi.nivel} | ${heroi.classe}${heroi.ca ? ` | CA ${heroi.ca}` : ""}`;

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

    // ── Info: nome + stats em badges
    const info = document.createElement("div");
    info.className = "item-monstro-info";

    const nomeLinha = document.createElement("div");
    nomeLinha.className = "item-monstro-nome";
    nomeLinha.textContent = monstro.nome;
    if (monstro.custom) {
      const badge = document.createElement("span");
      badge.className   = "badge-custom";
      badge.textContent = "custom";
      nomeLinha.appendChild(badge);
    }

    const stats = document.createElement("div");
    stats.className = "item-monstro-stats";
    stats.innerHTML = `
      <span class="item-monstro-stat">
        <span class="item-monstro-stat-label">HP</span>
        <span class="item-monstro-stat-valor">${monstro.vidaMax}</span>
      </span>
      <span class="item-monstro-stat">
        <span class="item-monstro-stat-label">CA</span>
        <span class="item-monstro-stat-valor">${monstro.ca ?? monstro.nd ?? "?"}</span>
      </span>
    `;

    info.appendChild(nomeLinha);
    info.appendChild(stats);

    // ── Ações: adicionar + deletar (custom)
    const acoes = document.createElement("div");
    acoes.className = "item-monstro-acoes";

    const btnAdd = document.createElement("button");
    btnAdd.textContent = "+ Adicionar";
    btnAdd.className   = "btn-add-monstro";
    btnAdd.addEventListener("click", () => adicionarIniciativaDeMonstro(monstro));
    acoes.appendChild(btnAdd);

    if (monstro.custom) {
      const btnDel = document.createElement("button");
      btnDel.textContent = "✕";
      btnDel.className   = "btn-deletar-monstro";
      btnDel.title       = "Remover da coletânea";
      btnDel.addEventListener("click", () => deletarMonstroCustom(monstro.id));
      acoes.appendChild(btnDel);
    }

    item.appendChild(info);
    item.appendChild(acoes);
    container.appendChild(item);
  });
}

/* ==========================================================================
   9. DADOS E HISTÓRICO
   ========================================================================== */
function limparIniciativa() {
  if (!confirm("Deseja realmente limpar todo o combate?")) return;
  listaDeIniciativa  = [];
  turnoAtivo         = 0;
  rodadaAtual        = 1;
  efeitosTemporarios = [];
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
  atualizarPainelTurno();

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

  // Modal de condição/duração
  document.getElementById("fechar-condicao-duracao").addEventListener("click", fecharModalCondicaoDuracao);
  document.getElementById("btn-confirmar-condicao").addEventListener("click", confirmarCondicao);
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-condicao-duracao")) fecharModalCondicaoDuracao(); });
  document.getElementById("modal-condicao-duracao").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarCondicao(); });

  // Modal de dano/cura
  document.getElementById("fechar-dano-cura").addEventListener("click", fecharModalDanoCura);
  document.getElementById("btn-confirmar-dano").addEventListener("click", confirmarDanoCura);
  document.getElementById("btn-morto-modal").addEventListener("click", mortoViaModal);
  document.getElementById("btn-rolar-dano-modal").addEventListener("click", rolarDadoModal);
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-dano-cura")) fecharModalDanoCura(); });
  document.getElementById("modal-dano-cura").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarDanoCura(); });

  // Botões de controle de turno
  document.getElementById("btn-turno-anterior").addEventListener("click", turnoAnterior);
  document.getElementById("btn-proximo-turno").addEventListener("click", proximoTurno);
};