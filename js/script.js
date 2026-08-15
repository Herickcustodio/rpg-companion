/* ==========================================================================
   1. ESTADO GLOBAL
   ========================================================================== */
function lerLocalStorageJSON(chave, fallback) {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const valor = localStorage.getItem(chave);
    if (valor === null || valor === undefined || valor === "") return fallback;
    const parseado = JSON.parse(valor);
    return parseado ?? fallback;
  } catch (erro) {
    console.warn(`Dados inválidos em ${chave}. Usando fallback.`, erro);
    return fallback;
  }
}

function lerLocalStorageNumero(chave, fallback = 0) {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const valor = localStorage.getItem(chave);
    if (valor === null || valor === undefined || valor === "") return fallback;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : fallback;
  } catch (erro) {
    console.warn(`Valor inválido em ${chave}. Usando fallback.`, erro);
    return fallback;
  }
}

let listaDeIniciativa  = lerLocalStorageJSON("iniciativaRPG", []);
let partyHerois        = lerLocalStorageJSON("partyHeroisRPG", []);
let turnoAtivo         = lerLocalStorageNumero("turnoAtivoRPG", 0);
let rodadaAtual        = lerLocalStorageNumero("rodadaAtualRPG", 1);
let monstrosCustom     = lerLocalStorageJSON("monstrosCustomRPG", []);
let efeitosTemporarios = lerLocalStorageJSON("efeitosRPG", []);
let ultimasRolagens    = lerLocalStorageJSON("ultimasRolagensRPG", []);
let dadoSelecionado    = 20;

function horaAgora() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

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

function renderizarSeletorCores(idEdicao = null) {
  const container = document.getElementById("heroi-cores");
  if (!container) return;
  container.innerHTML = "";

  // Bloqueia cores de outros heróis (não do que está sendo editado)
  const coresUsadas = partyHerois
    .filter(h => h.id !== idEdicao)
    .map(h => h.cor).filter(Boolean);

  CORES_HEROI.forEach(cor => {
    const usada = coresUsadas.includes(cor.id);
    const btn   = document.createElement("button");
    btn.type      = "button";
    btn.title     = usada ? `${cor.label} (em uso)` : cor.label;
    btn.className = "cor-heroi-btn"
      + (usada              ? " cor-heroi-btn--usada"      : "")
      + (_corSelecionada === cor.id ? " cor-heroi-btn--selecionada" : "");
    btn.style.background = cor.hex;
    btn.disabled = usada;
    btn.addEventListener("click", () => {
      _corSelecionada = cor.id;
      renderizarSeletorCores(idEdicao);
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
function abrirModalHeroi(idEdicao = null) {
  // Se idEdicao não for uma string (ex: for o objeto de evento de clique), reseta para null
  if (typeof idEdicao !== "string") idEdicao = null;
  const heroi = idEdicao ? partyHerois.find(h => h.id === idEdicao) : null;

  document.getElementById("modal-heroi-titulo").textContent    = heroi ? "Editar Herói" : "Novo Herói";
  document.getElementById("btn-confirmar-heroi").textContent   = heroi ? "Salvar Alterações" : "Criar Herói";
  document.getElementById("heroi-id-edicao").value             = idEdicao || "";
  document.getElementById("heroi-nome").value   = heroi ? heroi.nome   : "";
  document.getElementById("heroi-classe").value = heroi ? heroi.classe : "";
  document.getElementById("heroi-nivel").value  = heroi ? heroi.nivel  : "1";
  document.getElementById("heroi-hp").value     = heroi ? heroi.hpMax  : "10";
  document.getElementById("heroi-ca").value     = heroi ? heroi.ca     : "10";

  // Seletor de cores — em edição permite trocar, mas bloqueia cores de OUTROS heróis
  const coresUsadas = partyHerois
    .filter(h => h.id !== idEdicao)
    .map(h => h.cor).filter(Boolean);
  const primeiraLivre = CORES_HEROI.find(c => !coresUsadas.includes(c.id));
  _corSelecionada = heroi?.cor || (primeiraLivre ? primeiraLivre.id : null);

  renderizarSeletorCores(idEdicao);
  document.getElementById("modal-heroi").classList.remove("oculto");
  document.getElementById("heroi-nome").focus();
}

function fecharModalHeroi() {
  document.getElementById("modal-heroi").classList.add("oculto");
}

function confirmarNovoHeroi() {
  const nome     = document.getElementById("heroi-nome").value.trim();
  if (!nome) { document.getElementById("heroi-nome").focus(); return; }

  const idEdicao = document.getElementById("heroi-id-edicao").value;

  if (idEdicao) {
    // EDIÇÃO
    const heroi = partyHerois.find(h => h.id === idEdicao);
    if (!heroi) return;

    const hpMaxAnterior = heroi.hpMax;
    heroi.nome   = nome;
    heroi.classe = document.getElementById("heroi-classe").value.trim() || "Aventureiro";
    heroi.nivel  = document.getElementById("heroi-nivel").value || "1";
    heroi.hpMax  = parseInt(document.getElementById("heroi-hp").value) || 10;
    heroi.ca     = parseInt(document.getElementById("heroi-ca").value) || 10;
    heroi.cor    = _corSelecionada;

    // Atualiza hpMax na iniciativa também se mudou
    if (heroi.hpMax !== hpMaxAnterior) {
      const naIni = listaDeIniciativa.find(c => c.idHeroi === idEdicao);
      if (naIni) naIni.hpMax = heroi.hpMax;
    }

    adicionarHistorico(`✏️ ${heroi.nome} foi editado.`);
  } else {
    // CRIAÇÃO
    partyHerois.push({
      id:     "h_" + Date.now(),
      nome,
      classe: document.getElementById("heroi-classe").value.trim() || "Aventureiro",
      nivel:  document.getElementById("heroi-nivel").value || "1",
      hpMax:  parseInt(document.getElementById("heroi-hp").value) || 10,
      ca:     parseInt(document.getElementById("heroi-ca").value) || 10,
      cor:    _corSelecionada,
      imagem: ""
    });
  }

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

function abrirModalMonstrosLista() {
  const modal = document.getElementById("modal-monstros-lista");
  const busca = document.getElementById("busca-monstros");
  if (modal) modal.classList.remove("oculto");
  if (busca) {
    renderizarColetanea(busca.value || "");
    setTimeout(() => busca.focus(), 0);
  }
}

function fecharModalMonstrosLista() {
  const modal = document.getElementById("modal-monstros-lista");
  if (modal) modal.classList.add("oculto");
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
    criatura.morto      = false;
    criatura.nocauteado = false; // limpa nocaute também ao reviver
    adicionarHistorico(`💚 ${criatura.nome} foi revivido!`, "sucesso");
  } else {
    if (!confirm(`Marcar "${criatura.nome}" como morto?`)) return;
    criatura.morto      = true;
    criatura.nocauteado = false;
    adicionarHistorico(`☠️ ${criatura.nome} morreu!`, "falha");
  }

  salvarESincronizar();
}

/* ==========================================================================
   DANO EM ÁREA
   ========================================================================== */
function abrirModalArea() {
  if (listaDeIniciativa.length === 0) {
    alert("Não há combatentes no combate!");
    return;
  }

  // Reseta campos
  document.getElementById("area-qtd").value          = "1";
  document.getElementById("area-tipo").value         = "8";
  document.getElementById("area-modificador").value  = "0";
  document.getElementById("area-valor-manual").value = "";
  document.getElementById("area-resultado").textContent  = "—";
  document.getElementById("area-resultado").className    = "modal-dano-valor modal-dano-valor--dano";
  document.getElementById("area-formula").textContent    = "";

  renderizarAlvosArea();
  document.getElementById("modal-area").classList.remove("oculto");
}

function fecharModalArea() {
  document.getElementById("modal-area").classList.add("oculto");
}

function renderizarAlvosArea() {
  const lista = document.getElementById("area-alvos-lista");
  lista.innerHTML = "";

  listaDeIniciativa.forEach(c => {
    const row = document.createElement("label");
    row.className = "area-alvo-row" + (c.morto ? " area-alvo-morto" : "");

    const cb = document.createElement("input");
    cb.type    = "checkbox";
    cb.value   = c.id;
    cb.checked = !c.morto; // mortos vêm desmarcados por padrão
    cb.className = "area-alvo-cb";

    const corHeroi = (() => {
      if (!c.idHeroi) return null;
      const h   = partyHerois.find(h => h.id === c.idHeroi);
      const cor = h?.cor ? CORES_HEROI.find(x => x.id === h.cor) : null;
      return cor?.hex ?? null;
    })();

    const info = document.createElement("span");
    info.className = "area-alvo-info";
    if (corHeroi) info.style.borderLeftColor = corHeroi;
    info.innerHTML = `<span class="area-alvo-nome">${c.nome}</span><span class="area-alvo-hp">❤️ ${c.hpAtual}/${c.hpMax}</span>`;

    row.appendChild(cb);
    row.appendChild(info);
    lista.appendChild(row);
  });
}

function rolarDadoArea() {
  const qtd  = parseInt(document.getElementById("area-qtd").value)         || 1;
  const lados = parseInt(document.getElementById("area-tipo").value)        || 8;
  const mod   = parseInt(document.getElementById("area-modificador").value) || 0;

  let soma = 0;
  const rolagens = [];
  for (let i = 0; i < qtd; i++) {
    const r = Math.floor(Math.random() * lados) + 1;
    soma += r; rolagens.push(r);
  }
  const total = Math.max(0, soma + mod);

  document.getElementById("area-resultado").textContent = total;
  const sinal = mod >= 0 ? "+" : "";
  document.getElementById("area-formula").textContent = `(${qtd}d${lados}: [${rolagens.join(", ")}] ${sinal}${mod})`;
  document.getElementById("area-valor-manual").value  = total;
}

function selecionarTodosArea(sel) {
  document.querySelectorAll(".area-alvo-cb").forEach(cb => cb.checked = sel);
}

function confirmarDanoArea() {
  const valor = parseInt(document.getElementById("area-valor-manual").value);
  if (isNaN(valor) || valor < 0) {
    document.getElementById("area-valor-manual").focus(); return;
  }

  const selecionados = [...document.querySelectorAll(".area-alvo-cb:checked")].map(cb => cb.value);
  if (selecionados.length === 0) {
    alert("Selecione pelo menos um alvo!"); return;
  }

  const nomes = [];
  selecionados.forEach(id => {
    const c = listaDeIniciativa.find(x => x.id == id);
    if (!c) return;
    const antes = c.hpAtual;
    c.hpAtual = Math.max(0, c.hpAtual - valor);
    nomes.push(`${c.nome} (${antes}→${c.hpAtual})`);
    if (c.hpAtual === 0 && !c.morto) processarHPZero(c);
  });

  adicionarHistorico(`💥 Dano em área (${valor}): ${nomes.join(", ")}`, "falha");
  fecharModalArea();
  salvarESincronizar();
}


/** Processa HP zerado: monstro morre, herói fica nocauteado */
function processarHPZero(criatura) {
  const ehHeroi = !!criatura.idHeroi;
  if (ehHeroi) {
    criatura.nocauteado = true;
    adicionarHistorico(`😵 ${criatura.nome} está nocauteado! (0 HP)`, "falha");
  } else if (config.autoMorte) {
    criatura.morto = true;
    adicionarHistorico(`☠️ ${criatura.nome} morreu!`, "falha");
  } else {
    adicionarHistorico(`💀 ${criatura.nome} chegou a 0 HP!`, "falha");
  }
}

let _modalDanoCuraId   = null;
let _modalDanoCuraTipo = null;

/* ==========================================================================
   MODAL DE ACERTO
   ========================================================================== */
let _acertoAlvoId     = null;
let _acertoAtacanteId = null;

function abrirModalAcerto(alvoId) {
  const alvo = listaDeIniciativa.find(c => c.id === alvoId);
  if (!alvo) return;

  _acertoAlvoId = alvoId;

  document.getElementById("modal-acerto-titulo").textContent = `🎯 Acerto — ${alvo.nome}`;

  // CA do alvo como referência
  const caRef   = document.getElementById("acerto-ca-ref");
  const caValor = (() => {
    if (alvo.idHeroi) {
      const h = partyHerois.find(h => h.id === alvo.idHeroi);
      return h?.ca ?? null;
    }
    if (alvo.idMonstroCustom) {
      const mc = monstrosCustom.find(m => m.id === alvo.idMonstroCustom);
      if (mc) return mc.ca ?? null;
    }
    const m = coletaneaMonstros.find(m => m.nome === alvo.nomeBase);
    return m?.ca ?? null;
  })();

  if (caValor !== null) {
    caRef.style.display = "block";
    caRef.innerHTML     = `🛡️ CA do alvo: <strong>${caValor}</strong>`;
    document.getElementById("acerto-valor-necessario").value = caValor;
  } else {
    caRef.style.display = "none";
    document.getElementById("acerto-valor-necessario").value = "";
  }

  // Atacante — pré-seleciona o ativo do turno
  const sel   = document.getElementById("acerto-atacante");
  sel.innerHTML = "";
  const ativo = listaDeIniciativa[turnoAtivo];
  listaDeIniciativa.filter(c => !c.morto).forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.nome;
    if (ativo && c.id === ativo.id) opt.selected = true;
    sel.appendChild(opt);
  });

  // Reseta campos
  document.getElementById("acerto-qtd").value         = "1";
  document.getElementById("acerto-tipo").value        = "20";
  document.getElementById("acerto-modificador").value = "0";
  document.getElementById("acerto-resultado-wrap").style.display  = "none";
  document.getElementById("acerto-resultado-display").innerHTML   = "";

  document.getElementById("modal-acerto").classList.remove("oculto");
  document.getElementById("acerto-modificador").focus();
}

function fecharModalAcerto() {
  document.getElementById("modal-acerto").classList.add("oculto");
  _acertoAlvoId     = null;
  _acertoAtacanteId = null;
}

function rolarAcerto() {
  const qtd        = parseInt(document.getElementById("acerto-qtd").value)         || 1;
  const lados      = parseInt(document.getElementById("acerto-tipo").value)        || 20;
  const mod        = parseInt(document.getElementById("acerto-modificador").value) || 0;
  const necessario = parseInt(document.getElementById("acerto-valor-necessario").value);

  let soma = 0;
  const rolagens = [];
  for (let i = 0; i < qtd; i++) {
    const r = Math.floor(Math.random() * lados) + 1;
    soma += r; rolagens.push(r);
  }
  const total   = soma + mod;
  const sinal   = mod >= 0 ? "+" : "";
  const formula = `(${qtd}d${lados}: [${rolagens.join(", ")}] ${sinal}${mod})`;

  const wrap    = document.getElementById("acerto-resultado-wrap");
  const display = document.getElementById("acerto-resultado-display");
  wrap.style.display = "block";

  const alvo     = listaDeIniciativa.find(c => c.id === _acertoAlvoId);
  const sel      = document.getElementById("acerto-atacante");
  const atacante = listaDeIniciativa.find(c => c.id == sel.value);
  _acertoAtacanteId = sel.value;

  const acertou      = !isNaN(necessario) ? total >= necessario : null;
  const critico      = lados === 20 && qtd === 1 && rolagens[0] === 20;
  const falhaCritica = lados === 20 && qtd === 1 && rolagens[0] === 1;

  let badge = "";
  if (critico)           badge = `<span class="acerto-badge acerto-badge--critico">⚔️ Crítico!</span>`;
  else if (falhaCritica) badge = `<span class="acerto-badge acerto-badge--falha">💀 Falha Crítica!</span>`;
  else if (acertou === true)  badge = `<span class="acerto-badge acerto-badge--acertou">✅ Acertou!</span>`;
  else if (acertou === false) badge = `<span class="acerto-badge acerto-badge--errou">❌ Errou!</span>`;

  display.innerHTML = `
    <div class="acerto-total ${critico ? "acerto-total--critico" : falhaCritica ? "acerto-total--falha" : ""}">${total}</div>
    <div class="acerto-formula">${formula}</div>
    ${badge}
  `;

  // Log
  const nomeAtacante = atacante?.nome ?? "?";
  const nomeAlvo     = alvo?.nome     ?? "?";
  const sufixo = acertou !== null ? (acertou ? " — Acertou!" : " — Errou!") : "";
  const logTipo = critico ? "sucesso" : falhaCritica ? "falha" : "";
  adicionarHistorico(`🎯 ${nomeAtacante} rolou acerto contra ${nomeAlvo}: ${total} ${formula}${sufixo}`, logTipo);
}

function irParaDano() {
  const sel = document.getElementById("acerto-atacante");
  _acertoAtacanteId = sel ? sel.value : null;
  const alvoId = _acertoAlvoId;
  fecharModalAcerto();
  abrirModalDanoCura(alvoId, "dano", _acertoAtacanteId);
}

function abrirModalDanoCura(id, tipo, atacantePreId = null) {
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

  // Seletor de atacante (só no dano)
  const atacanteWrap = document.getElementById("modal-dano-atacante-wrap");
  if (isDano) {
    atacanteWrap.style.display = "block";
    const sel = document.getElementById("modal-dano-atacante");
    sel.innerHTML = "";
    const ativo = listaDeIniciativa[turnoAtivo];
    listaDeIniciativa.filter(c => !c.morto).forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.nome;
      // Prioriza atacante vindo do modal de acerto, depois o ativo do turno
      const preSelecionar = atacantePreId ? c.id == atacantePreId : (ativo && c.id === ativo.id);
      if (preSelecionar) opt.selected = true;
      sel.appendChild(opt);
    });
  } else {
    atacanteWrap.style.display = "none";
  }

  // Prévia
  const previa = document.getElementById("modal-dano-previa");
  previa.style.display = "none";
  previa.innerHTML = "";

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

function atualizarPrevia() {
  const valor    = parseInt(document.getElementById("modal-dano-manual").value);
  const previa   = document.getElementById("modal-dano-previa");
  const criatura = listaDeIniciativa.find(c => c.id === _modalDanoCuraId);
  if (!criatura || isNaN(valor) || valor < 0) { previa.style.display = "none"; return; }

  const isDano = _modalDanoCuraTipo === "dano";

  if (isDano) {
    const sel       = document.getElementById("modal-dano-atacante");
    const atacanteId = sel ? sel.value : null;
    const atacante  = atacanteId ? listaDeIniciativa.find(c => c.id == atacanteId) : null;
    const hpFinal   = Math.max(0, criatura.hpAtual - valor);
    const prefixo   = atacante ? `${atacante.nome} → ${criatura.nome}` : criatura.nome;
    previa.innerHTML = `<span class="previa-ataque">${prefixo}</span><span class="previa-dano">-${valor}</span><span class="previa-hp">${criatura.hpAtual} → ${hpFinal} HP</span>`;
    previa.className = "modal-dano-previa modal-dano-previa--dano";
  } else {
    const hpFinal = Math.min(criatura.hpMax, criatura.hpAtual + valor);
    previa.innerHTML = `<span class="previa-ataque">${criatura.nome}</span><span class="previa-cura">+${valor}</span><span class="previa-hp">${criatura.hpAtual} → ${hpFinal} HP</span>`;
    previa.className = "modal-dano-previa modal-dano-previa--cura";
  }

  previa.style.display = "flex";
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
  atualizarPrevia();
}

function confirmarDanoCura() {
  const valor = parseInt(document.getElementById("modal-dano-manual").value);
  if (isNaN(valor) || valor < 0) { document.getElementById("modal-dano-manual").focus(); return; }

  const criatura = listaDeIniciativa.find(c => c.id === _modalDanoCuraId);
  if (!criatura) return;

  const hpAntes = criatura.hpAtual;

  if (_modalDanoCuraTipo === "dano") {
    // Pega atacante selecionado
    const sel = document.getElementById("modal-dano-atacante");
    const atacanteId = sel ? sel.value : null;
    const atacante   = atacanteId ? listaDeIniciativa.find(c => c.id == atacanteId) : null;
    const nomeAtacante = atacante ? atacante.nome : null;

    criatura.hpAtual = Math.max(0, criatura.hpAtual - valor);

    const logTxt = nomeAtacante
      ? `⚔️ ${nomeAtacante} causou ${valor} de dano em ${criatura.nome}! (${hpAntes} → ${criatura.hpAtual} HP)`
      : `⚔️ ${criatura.nome} recebeu ${valor} de dano (${hpAntes} → ${criatura.hpAtual} HP)`;
    adicionarHistorico(logTxt, "falha");
    if (criatura.hpAtual === 0 && !criatura.morto) processarHPZero(criatura);
  } else {
    criatura.hpAtual = Math.min(criatura.hpMax, criatura.hpAtual + valor);
    adicionarHistorico(`💊 ${criatura.nome} recuperou ${valor} de HP (${hpAntes} → ${criatura.hpAtual} HP)`, "sucesso");
    // Se estava nocauteado e recuperou HP, remove nocaute
    if (criatura.nocauteado && criatura.hpAtual > 0) {
      criatura.nocauteado = false;
      adicionarHistorico(`💪 ${criatura.nome} se recuperou do nocaute!`, "sucesso");
    }
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

  const vivos = listaDeIniciativa.filter(c => !c.morto);
  if (vivos.length === 0) return;

  // Avança e pula mortos
  let tentativas = 0;
  do {
    turnoAtivo++;
    if (turnoAtivo >= listaDeIniciativa.length) {
      turnoAtivo = 0;
      rodadaAtual++;
      adicionarHistorico(`🔄 Rodada ${rodadaAtual} iniciada!`);
      decrementarCondicoes();
      efeitosTemporarios = efeitosTemporarios.map(e => ({ ...e, rodadas: e.rodadas - 1 }));
      efeitosTemporarios.forEach(e => {
        if (e.rodadas <= 0) adicionarHistorico(`⏰ Efeito expirado: "${e.nome}"`, "falha");
        else if (e.rodadas === 1) adicionarHistorico(`⚠️ "${e.nome}" expira na próxima rodada!`);
      });
      efeitosTemporarios = efeitosTemporarios.filter(e => e.rodadas > 0);
    }
    tentativas++;
  } while (listaDeIniciativa[turnoAtivo]?.morto && tentativas < listaDeIniciativa.length);

  salvarESincronizar();
}

function turnoAnterior() {
  if (listaDeIniciativa.length === 0) return;
  turnoAtivo = (turnoAtivo - 1 + listaDeIniciativa.length) % listaDeIniciativa.length;
  salvarESincronizar();
}

/* ==========================================================================
   BOTÕES DE AÇÃO DO PAINEL DE TURNO
   ========================================================================== */
function abrirTurnoAcaoAtaque() {
  const atual = listaDeIniciativa[turnoAtivo];
  if (!atual) return;
  if (config.etapaAcerto) abrirModalAcerto(atual.id);
  else abrirModalDanoCura(atual.id, "dano");
}

function abrirTurnoAcaoCondicao() {
  const atual = listaDeIniciativa[turnoAtivo];
  if (!atual) return;

  // Remove popover anterior se existir
  const popoverAnterior = document.getElementById("turno-condicoes-popover");
  if (popoverAnterior) popoverAnterior.remove();

  // Cria popover de condições
  const popover = document.createElement("div");
  popover.id = "turno-condicoes-popover";
  popover.className = "condicao-popover";
  popover.style.position = "fixed";
  popover.style.zIndex = "1000";

  CONDICOES.forEach(cond => {
    const ativa = (atual.condicoes || []).some(c => c.id === cond.id);
    const opcao = document.createElement("button");
    opcao.className = "condicao-opcao" + (ativa ? " condicao-opcao--ativa" : "");
    opcao.title     = cond.descricao;
    opcao.innerHTML = `<span class="cond-emoji">${cond.emoji}</span><span class="cond-label">${cond.label}</span>`;
    opcao.addEventListener("click", (e) => {
      e.stopPropagation();
      popover.remove();
      toggleCondicao(atual.id, cond.id);
    });
    popover.appendChild(opcao);
  });

  document.body.appendChild(popover);

  // Posiciona logo acima do botão
  const btnCondicao = document.getElementById("btn-turno-condicao");
  const rect = btnCondicao.getBoundingClientRect();
  popover.style.top  = (rect.top - popover.offsetHeight - 6) + "px";
  popover.style.left = rect.left + "px";

  // Fecha ao clicar fora
  const fecharPopover = (e) => {
    if (!popover.contains(e.target) && e.target !== btnCondicao) {
      popover.remove();
      document.removeEventListener("click", fecharPopover);
    }
  };
  setTimeout(() => document.addEventListener("click", fecharPopover), 0);
}

function abrirTurnoAcaoCura() {
  const atual = listaDeIniciativa[turnoAtivo];
  if (!atual) return;
  abrirModalDanoCura(atual.id, "cura");
}

function abrirTurnoAcaoMorto() {
  const atual = listaDeIniciativa[turnoAtivo];
  if (!atual) return;
  marcarMorto(atual.id);
}

function atualizarPainelTurno() {
  const numEl   = document.getElementById("turno-rodada-num");
  const combateRodadaEl = document.getElementById("combate-rodada-num");
  const cardEl  = document.getElementById("turno-ativo-card");
  const vazioEl = document.getElementById("turno-vazio-msg");

  if (numEl) numEl.textContent = rodadaAtual;
  if (combateRodadaEl) combateRodadaEl.textContent = rodadaAtual;

  if (listaDeIniciativa.length === 0) {
    if (cardEl)  { cardEl.classList.add("oculto"); cardEl.innerHTML = ""; }
    if (vazioEl) vazioEl.style.display = "block";
    renderizarCondicoesAtivas();
    return;
  }

  if (cardEl)  cardEl.classList.remove("oculto");
  if (vazioEl) vazioEl.style.display = "none";

  const atual = listaDeIniciativa[turnoAtivo];
  if (!atual) return;

  // Limpa o card ativo para reconstruí-lo idêntico ao painel de combate
  cardEl.innerHTML = "";

  // Coleta dados visuais (Cor e CA)
  const corHeroi = (() => {
    if (!atual.idHeroi) return null;
    const h = partyHerois.find(h => h.id === atual.idHeroi);
    const cor = h?.cor ? CORES_HEROI.find(c => c.id === h.cor) : null;
    return cor?.hex ?? null;
  })();

  const caValor = (() => {
    if (atual.idHeroi) {
      const h = partyHerois.find(h => h.id === atual.idHeroi);
      return h?.ca ?? null;
    }
    if (atual.idMonstroCustom) {
      const mc = monstrosCustom.find(m => m.id === atual.idMonstroCustom);
      if (mc) return mc.ca ?? null;
    }
    const m = coletaneaMonstros.find(m => m.nome === atual.nomeBase);
    return m?.ca ?? null;
  })();

  // Estilização da borda e classes de estado
  cardEl.className = "turno-ativo-card item-iniciativa item-iniciativa--ativo"
    + (atual.morto ? " item-iniciativa--morto" : "")
    + (atual.nocauteado && !atual.morto ? " item-iniciativa--nocauteado" : "")
    + (!atual.idHeroi ? " item-iniciativa--monstro" : "");

  if (corHeroi) {
    cardEl.style.borderLeft = `4px solid ${corHeroi}`;
    cardEl.style.background = `${corHeroi}22`;
  } else if (!atual.idHeroi) {
    cardEl.style.borderLeft = "4px solid #e63946";
    cardEl.style.background = "";
  } else {
    cardEl.style.borderLeft = "";
    cardEl.style.background = "";
  }

  if (atual.morto) {
    cardEl.style.background = "#2a0a0a";
    cardEl.style.borderLeft = "4px solid #c0392b";
  }

  // ── 1. Cabeçalho (Avatar + Nome + Indicador de Turno/Status)
  const cabecalho = document.createElement("div");
  cabecalho.className = "turno-ativo-cabecalho";

  const topoLinha = document.createElement("div");
  topoLinha.className = "turno-ativo-topo";

  const avatar = document.createElement("div");
  avatar.className = "turno-ativo-avatar";
  avatar.textContent = (atual.nome || "?").trim().charAt(0).toUpperCase() || "?";
  if (corHeroi) avatar.style.borderColor = corHeroi;

  const infoCol = document.createElement("div");
  infoCol.className = "turno-ativo-info-col";

  const badge = document.createElement("span");
  badge.className = "turno-ativo-badge";
  badge.textContent = "TURNO ATUAL";

  const linhaInfo = document.createElement("div");
  linhaInfo.className = "turno-ativo-header";

  const nome = document.createElement("span");
  nome.className = "turno-ativo-nome";
  nome.textContent = (atual.morto ? "☠️ " : "")
    + (atual.nocauteado && !atual.morto ? "😵 " : "")
    + atual.nome;
  if (corHeroi) nome.style.color = corHeroi;
  else if (!atual.idHeroi) nome.style.color = "var(--red)";

  const dadosLado = document.createElement("div");
  dadosLado.className = "turno-ativo-detalhes";
  const caTexto = caValor !== null ? `CA ${caValor}` : "CA ?";
  const iniciativaTexto = `Ini: ${atual.valor}`;
  const detalheCA = document.createElement("span");
  detalheCA.className = "turno-ativo-ini";
  detalheCA.textContent = caTexto;
  const detalheIni = document.createElement("span");
  detalheIni.className = "turno-ativo-ini";
  detalheIni.textContent = iniciativaTexto;
  dadosLado.appendChild(detalheCA);
  dadosLado.appendChild(detalheIni);

  linhaInfo.appendChild(nome);
  linhaInfo.appendChild(dadosLado);

  infoCol.appendChild(badge);
  infoCol.appendChild(linhaInfo);

  topoLinha.appendChild(avatar);
  topoLinha.appendChild(infoCol);
  cabecalho.appendChild(topoLinha);

  // ── 2. HP e condições
  const stats = document.createElement("div");
  stats.className = "turno-ativo-status";

  const hpLinha = document.createElement("div");
  hpLinha.className = "turno-ativo-hp-row";
  const hpLabel = document.createElement("span");
  hpLabel.className = "turno-ativo-hp-label";
  hpLabel.textContent = "HP:";
  const hpValor = document.createElement("span");
  hpValor.className = "turno-ativo-hp-valor";
  hpValor.textContent = `${atual.hpAtual}/${atual.hpMax}`;
  hpLinha.appendChild(hpLabel);
  hpLinha.appendChild(hpValor);

  const pctHP = atual.hpMax > 0 ? (atual.hpAtual / atual.hpMax) * 100 : 0;
  const corHP = calcularCorHP(atual.hpAtual, atual.hpMax);

  const barraWrap = document.createElement("div");
  barraWrap.className = "barra-hp-wrap turno-ativo-barra";
  const barraFill = document.createElement("div");
  barraFill.className = "barra-hp-fill";
  barraFill.style.width = `${Math.max(0, Math.min(100, pctHP))}%`;
  barraFill.style.background = corHP;
  barraWrap.appendChild(barraFill);

  const condLinha = document.createElement("div");
  condLinha.className = "turno-ativo-condicoes";
  const condTexto = document.createElement("span");
  condTexto.className = "turno-ativo-cond-texto";
  const condicoesAtivas = (atual.condicoes || []).map(condObj => {
    const cond = CONDICOES.find(c => c.id === condObj.id);
    return cond ? `${cond.emoji} ${cond.label}` : null;
  }).filter(Boolean);
  condTexto.textContent = `Condições: ${condicoesAtivas.length ? condicoesAtivas.join(", ") : "Nenhuma"}`;
  condLinha.appendChild(condTexto);

  stats.appendChild(hpLinha);
  stats.appendChild(barraWrap);
  stats.appendChild(condLinha);

  // ── 3. Ações do combatente ativo no painel de turno
  const divAcoesTurno = document.createElement("div");
  divAcoesTurno.className = "turno-ativo-acoes";

  const btnAtaque = document.createElement("button");
  btnAtaque.id = "btn-turno-ataque";
  btnAtaque.type = "button";
  btnAtaque.className = "btn-turno-acao btn-turno-acao--ataque";
  btnAtaque.textContent = "⚔️ Ataque";
  btnAtaque.addEventListener("click", abrirTurnoAcaoAtaque);

  const btnCondicao = document.createElement("button");
  btnCondicao.id = "btn-turno-condicao";
  btnCondicao.type = "button";
  btnCondicao.className = "btn-turno-acao btn-turno-acao--condicao";
  btnCondicao.textContent = "🩺 Condição";
  btnCondicao.addEventListener("click", abrirTurnoAcaoCondicao);

  const btnCura = document.createElement("button");
  btnCura.id = "btn-turno-cura";
  btnCura.type = "button";
  btnCura.className = "btn-turno-acao btn-turno-acao--cura";
  btnCura.textContent = "💊 Cura";
  btnCura.addEventListener("click", abrirTurnoAcaoCura);

  divAcoesTurno.appendChild(btnAtaque);
  divAcoesTurno.appendChild(btnCondicao);
  divAcoesTurno.appendChild(btnCura);

  // Montagem final do card de turno ativo
  cardEl.appendChild(cabecalho);
  cardEl.appendChild(stats);
  cardEl.appendChild(divAcoesTurno);

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
      + (ativo                                        ? " item-iniciativa--ativo"      : "")
      + (personagem.morto                             ? " item-iniciativa--morto"      : "")
      + (personagem.nocauteado && !personagem.morto   ? " item-iniciativa--nocauteado" : "")
      + (!personagem.idHeroi                          ? " item-iniciativa--monstro"    : "");

    // Cor do herói na borda esquerda (e fundo suave quando ativo)
    if (personagem.idHeroi) {
      const h   = partyHerois.find(h => h.id === personagem.idHeroi);
      const cor = h?.cor ? CORES_HEROI.find(c => c.id === h.cor) : null;
      if (cor) {
        item.style.borderLeft = `4px solid ${cor.hex}`;
        if (ativo && !personagem.morto) {
          item.style.background = `${cor.hex}22`; // 22 = ~13% opacidade
          item.style.boxShadow  = `0 0 0 1px ${cor.hex}88`;
        }
      }
    }

    // Fundo vermelho quando morto
    if (personagem.morto) {
      item.style.background    = "#2a0a0a";
      item.style.borderLeft    = "4px solid #c0392b";
      item.style.boxShadow     = "0 0 0 1px #8b1a1a";
    }

    const caValor = (() => {
      if (personagem.idHeroi) {
        const h = partyHerois.find(h => h.id === personagem.idHeroi);
        return h?.ca ?? null;
      }
      if (personagem.idMonstroCustom) {
        const mc = monstrosCustom.find(m => m.id === personagem.idMonstroCustom);
        if (mc) return mc.ca ?? null;
      }
      const m = coletaneaMonstros.find(m => m.nome === personagem.nomeBase);
      return m?.ca ?? null;
    })();

    const topo = document.createElement("div");
    topo.className = "item-ini-topo";

    const iniciativaTag = document.createElement("span");
    iniciativaTag.className = "item-ini-iniciativa";
    iniciativaTag.textContent = personagem.valor;

    topo.appendChild(iniciativaTag);

    const corpo = document.createElement("div");
    corpo.className = "item-ini-corpo";

    const avatar = document.createElement("div");
    avatar.className = "item-ini-avatar";
    const inicial = (personagem.nome || "?").trim().charAt(0).toUpperCase() || "?";
    avatar.textContent = inicial;

    const dados = document.createElement("div");
    dados.className = "item-ini-dados";

    const nome = document.createElement("div");
    nome.className = "item-iniciativa-nome";
    nome.textContent = (personagem.morto ? "☠️ " : "")
      + (personagem.nocauteado && !personagem.morto ? "😵 " : "")
      + personagem.nome;

    const caLinha = document.createElement("div");
    caLinha.className = "item-ini-info";
    caLinha.textContent = `CA ${caValor ?? "?"}`;

    const vidaLinha = document.createElement("div");
    vidaLinha.className = "item-ini-vida-row";
    const vidaLabel = document.createElement("span");
    vidaLabel.className = "item-ini-vida-label";
    vidaLabel.textContent = "❤️";
    const vidaValor = document.createElement("span");
    vidaValor.className = "item-ini-vida-valor";
    vidaValor.textContent = `${personagem.hpAtual}/${personagem.hpMax}`;
    vidaLinha.appendChild(vidaLabel);
    vidaLinha.appendChild(vidaValor);

    const barraWrap = document.createElement("div");
    barraWrap.className = "barra-hp-wrap barra-hp-wrap--mini";
    const barraFill = document.createElement("div");
    barraFill.className = "barra-hp-fill";
    barraFill.style.width = `${Math.max(0, Math.min(100, pctHP))}%`;
    barraFill.style.background = corHP;
    barraWrap.appendChild(barraFill);

    dados.appendChild(nome);
    dados.appendChild(caLinha);
    dados.appendChild(vidaLinha);
    dados.appendChild(barraWrap);

    corpo.appendChild(avatar);
    corpo.appendChild(dados);

    const condTags = document.createElement("div");
    condTags.className = "item-ini-condicoes";
    condicoes.forEach(condObj => {
      const cond = CONDICOES.find(c => c.id === condObj.id);
      if (!cond) return;
      const tag = document.createElement("span");
      tag.className = "item-ini-cond-tag";
      tag.textContent = `${cond.emoji} ${cond.label}`;
      condTags.appendChild(tag);
    });

    item.appendChild(topo);
    item.appendChild(corpo);
    if (condicoes.length > 0) item.appendChild(condTags);

    if (ativo) {
      const atualBadge = document.createElement("span");
      atualBadge.className = "item-ini-atual-badge";
      atualBadge.textContent = "ATUAL";
      item.appendChild(atualBadge);
    }

    container.appendChild(item);
  });

  // Rola o painel até o combatente ativo ficar visível
  const itemAtivo = container.querySelector(".item-iniciativa--ativo");
  if (itemAtivo) {
    itemAtivo.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  renderizarOrdemIniciativa();
}

/** Faixa "Ordem da Iniciativa": um chip por combatente, clicável para pular o turno até ele */
function renderizarOrdemIniciativa() {
  const lista = document.getElementById("ordem-iniciativa-lista");
  if (!lista) return;
  lista.innerHTML = "";

  listaDeIniciativa.forEach((personagem, index) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "ordem-iniciativa-chip" + (index === turnoAtivo ? " ordem-iniciativa-chip--ativa" : "");
    chip.textContent = personagem.valor;
    chip.title = personagem.nome;
    chip.addEventListener("click", () => {
      turnoAtivo = index;
      salvarESincronizar();
    });
    lista.appendChild(chip);
  });
}

/* ==========================================================================
   7. RENDERIZAÇÃO — STATUS DO GRUPO
   ========================================================================== */
function renderizarStatusGrupo() {
  const container = document.getElementById("conteudo-status-grupo");
  if (!container) return;
  container.innerHTML = "";

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

    const btnEditar = document.createElement("button");
    btnEditar.textContent = "✏️";
    btnEditar.className   = "btn-editar-heroi";
    btnEditar.title       = "Editar herói";
    btnEditar.addEventListener("click", () => abrirModalHeroi(heroi.id));

    topo.appendChild(nomeSpan);
    topo.appendChild(iniSpan);
    topo.appendChild(btnEditar);
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
    ...[...coletaneaMonstros].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
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

function selecionarDado(lados) {
  dadoSelecionado = lados;
  document.querySelectorAll(".botoes-dados button").forEach(b => {
    b.classList.toggle("selecionado", Number(b.dataset.dado) === lados);
  });
}

function rolarDadoSelecionado() {
  rolarDado(dadoSelecionado);
}

function rolarAcaoRapida(nomeAcao, emoji) {
  const modificador = parseInt(document.getElementById("modificador").value) || 0;
  const rolagem = Math.floor(Math.random() * 20) + 1;
  const total   = rolagem + modificador;
  document.querySelector("#resultado-dado .valor").textContent = total;

  const formulaCurta = `1d20${modificador ? (modificador > 0 ? " + " + modificador : " - " + Math.abs(modificador)) : ""}`;
  registrarUltimaRolagem(formulaCurta, total);

  const textoBase = `1d20: [${rolagem}] + ${modificador} = ${total}`;
  if (rolagem === 20) adicionarHistorico(`${emoji} ${nomeAcao}: SUCESSO CRÍTICO! ${textoBase}`, "sucesso");
  else if (rolagem === 1) adicionarHistorico(`${emoji} ${nomeAcao}: FALHA CRÍTICA! ${textoBase}`, "falha");
  else adicionarHistorico(`${emoji} ${nomeAcao}: ${textoBase}`);
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

  const formulaCurta = `${quantidade}d${lados}${modificador ? (modificador > 0 ? " + " + modificador : " - " + Math.abs(modificador)) : ""}`;
  registrarUltimaRolagem(formulaCurta, total);

  if (lados === 20 && quantidade === 1) {
    if (rolagens[0] === 20) adicionarHistorico(`⚔️ SUCESSO CRÍTICO! ${textoBase}`, "sucesso");
    else if (rolagens[0] === 1) adicionarHistorico(`💀 FALHA CRÍTICA! ${textoBase}`, "falha");
    else adicionarHistorico(textoBase);
  } else {
    adicionarHistorico(textoBase);
  }
}

function registrarUltimaRolagem(formula, total) {
  ultimasRolagens.unshift({ formula, total, hora: horaAgora() });
  ultimasRolagens = ultimasRolagens.slice(0, 4);
  localStorage.setItem("ultimasRolagensRPG", JSON.stringify(ultimasRolagens));
  renderizarUltimasRolagens();
}

function renderizarUltimasRolagens() {
  const lista = document.getElementById("lista-ultimas-rolagens");
  if (!lista) return;
  lista.innerHTML = "";

  if (ultimasRolagens.length === 0) {
    lista.innerHTML = `<p class="efeitos-vazio">Nenhuma rolagem ainda.</p>`;
    return;
  }

  ultimasRolagens.forEach(r => {
    const item = document.createElement("div");
    item.className = "ultima-rolagem-item";
    item.innerHTML = `
      <span class="ultima-rolagem-formula">${r.formula}</span>
      <span class="ultima-rolagem-total">Resultado: ${r.total}</span>
      <span class="ultima-rolagem-hora">${r.hora || ""}</span>
    `;
    lista.appendChild(item);
  });
}

function adicionarHistorico(texto, tipo = "") {
  const historico = lerLocalStorageJSON("historicoRPG", []);
  const hora = horaAgora();
  historico.push({ texto, tipo, hora });
  localStorage.setItem("historicoRPG", JSON.stringify(historico));
  renderizarItemHistorico(texto, tipo, hora);
}

function renderizarItemHistorico(texto, tipo, hora) {
  const log = document.getElementById("log-historico");
  if (!log) return;
  const item       = document.createElement("div");
  item.className   = "log-item" + (tipo ? ` ${tipo}` : "");

  const texto_el = document.createElement("span");
  texto_el.className = "log-item-texto";
  texto_el.textContent = texto;
  item.appendChild(texto_el);

  if (hora) {
    const hora_el = document.createElement("span");
    hora_el.className = "log-item-hora";
    hora_el.textContent = hora;
    item.appendChild(hora_el);
  }

  log.appendChild(item);
  log.scrollTop = log.scrollHeight;
}

function limparHistorico() {
  if (!confirm("Deseja realmente limpar o histórico da sessão?")) return;
  localStorage.removeItem("historicoRPG");
  document.getElementById("log-historico").innerHTML = "";
}

function atualizarBtnTema() {
  const isLight = document.body.classList.contains("tema-light");
  const btn = document.getElementById("btn-tema");
  if (btn) btn.textContent = isLight ? "🌙 Modo Dark" : "☀️ Modo Light";
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

/* ==========================================================================
   CONFIGURAÇÕES
   ========================================================================== */
let config = lerLocalStorageJSON("configRPG", {
  campanhaNome: "",
  mestreNome:   "",
  dadoAcerto:   20,
  etapaAcerto:  true,
  autoMorte:    true,
});

function abrirModalConfig() {
  document.getElementById("config-campanha-nome").value  = config.campanhaNome;
  document.getElementById("config-mestre-nome").value    = config.mestreNome;
  document.getElementById("config-dado-acerto").value    = config.dadoAcerto;
  document.getElementById("config-etapa-acerto").checked = config.etapaAcerto;
  document.getElementById("config-auto-morte").checked   = config.autoMorte;
  document.getElementById("modal-config").classList.remove("oculto");
}

function salvarConfig() {
  config.campanhaNome = document.getElementById("config-campanha-nome").value.trim();
  config.mestreNome   = document.getElementById("config-mestre-nome").value.trim();
  config.dadoAcerto   = parseInt(document.getElementById("config-dado-acerto").value) || 20;
  config.etapaAcerto  = document.getElementById("config-etapa-acerto").checked;
  config.autoMorte    = document.getElementById("config-auto-morte").checked;
  localStorage.setItem("configRPG", JSON.stringify(config));
  aplicarConfig();
  document.getElementById("modal-config").classList.add("oculto");
}

function aplicarConfig() {
  const span = document.getElementById("header-campanha");
  if (span) span.textContent = config.campanhaNome ? `— ${config.campanhaNome}` : "";
  const selAcerto = document.getElementById("acerto-tipo");
  if (selAcerto) selAcerto.value = config.dadoAcerto;
}

function exportarSessao() {
  const dados = {
    versao: "1.0",
    data: new Date().toLocaleString("pt-BR"),
    campanha: config.campanhaNome,
    mestre: config.mestreNome,
    config, listaDeIniciativa, partyHerois, monstrosCustom,
    efeitosTemporarios, rodadaAtual, turnoAtivo,
    historico: lerLocalStorageJSON("historicoRPG", []),
    anotacoes: localStorage.getItem("anotacoesRPG") || "",
  };
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = config.campanhaNome
    ? `rpg-${config.campanhaNome.replace(/\s+/g, "-")}.json`
    : `rpg-sessao-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importarSessao(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const dados = JSON.parse(e.target.result);
      if (!confirm(`Importar sessão "${dados.campanha || "sem nome"}" de ${dados.data}?\nIsso substituirá os dados atuais.`)) return;
      listaDeIniciativa  = dados.listaDeIniciativa  || [];
      partyHerois        = dados.partyHerois        || [];
      monstrosCustom     = dados.monstrosCustom     || [];
      efeitosTemporarios = dados.efeitosTemporarios || [];
      rodadaAtual        = dados.rodadaAtual        || 1;
      turnoAtivo         = dados.turnoAtivo         || 0;
      config             = dados.config             || config;
      localStorage.setItem("historicoRPG", JSON.stringify(dados.historico || []));
      localStorage.setItem("anotacoesRPG", dados.anotacoes || "");
      localStorage.setItem("configRPG",    JSON.stringify(config));
      const area = document.getElementById("campo-anotacoes");
      if (area) area.value = dados.anotacoes || "";
      document.getElementById("log-historico").innerHTML = "";
      (dados.historico || []).forEach(h => renderizarItemHistorico(h.texto, h.tipo, h.hora));
      aplicarConfig();
      salvarESincronizar();
      renderizarColetanea();
      document.getElementById("modal-config").classList.add("oculto");
      alert("Sessão importada com sucesso!");
    } catch {
      alert("Arquivo inválido.");
    }
  };
  reader.readAsText(file);
}

function limparTodosDados() {
  if (!confirm("Isso apagará TODOS os dados. Tem certeza?")) return;
  if (!confirm("Segunda confirmação: não pode ser desfeito!")) return;
  localStorage.clear();
  location.reload();
}

/* ==========================================================================
   11. INICIALIZAÇÃO
   ========================================================================== */
window.onload = () => {
  renderizarColetanea();

  const inputBusca = document.getElementById("busca-monstros");
  if (inputBusca) inputBusca.addEventListener("input", () => renderizarColetanea(inputBusca.value));

  configurarModal("btn-sobre", "modal-sobre", "fechar-sobre");
  configurarModal("btn-ajuda", "modal-ajuda", "fechar-ajuda");

  document.querySelectorAll(".mini-navbar__btn").forEach(botao => {
    botao.addEventListener("click", () => {
      const tab = botao.dataset.tab;
      document.querySelectorAll(".mini-navbar__btn").forEach(btn => {
        const ativo = btn === botao;
        btn.classList.toggle("mini-navbar__btn--active", ativo);
        btn.setAttribute("aria-selected", String(ativo));
      });

      document.querySelectorAll(".tab-panel").forEach(painel => {
        painel.classList.toggle("tab-panel--active", painel.id === `tab-${tab}`);
      });
    });
  });

  const btnNovoHeroiStatus = document.getElementById("btn-novo-heroi-status");
  if (btnNovoHeroiStatus) btnNovoHeroiStatus.addEventListener("click", () => abrirModalHeroi());

  document.getElementById("btn-config").addEventListener("click", abrirModalConfig);
  document.getElementById("fechar-config").addEventListener("click", () => document.getElementById("modal-config").classList.add("oculto"));
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-config")) document.getElementById("modal-config").classList.add("oculto"); });
  document.getElementById("btn-salvar-config").addEventListener("click", salvarConfig);
  document.getElementById("btn-exportar-sessao").addEventListener("click", exportarSessao);
  document.getElementById("btn-limpar-tudo").addEventListener("click", limparTodosDados);
  const fileImportar = document.getElementById("file-importar-sessao");
  if (fileImportar) fileImportar.addEventListener("change", (e) => importarSessao(e.target.files[0]));

  document.getElementById("fechar-iniciativa").addEventListener("click", fecharModalIniciativa);
  document.getElementById("btn-rolar-ini").addEventListener("click", rolarIniciativaModal);
  document.getElementById("btn-confirmar-ini").addEventListener("click", confirmarIniciativaModal);
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-iniciativa")) fecharModalIniciativa(); });
  document.getElementById("modal-iniciativa").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarIniciativaModal(); });

  document.getElementById("fechar-heroi").addEventListener("click", fecharModalHeroi);
  document.getElementById("btn-confirmar-heroi").addEventListener("click", confirmarNovoHeroi);
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-heroi")) fecharModalHeroi(); });
  document.getElementById("modal-heroi").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarNovoHeroi(); });

  document.getElementById("btn-abrir-monstros").addEventListener("click", abrirModalMonstrosLista);
  document.getElementById("fechar-monstros-lista").addEventListener("click", fecharModalMonstrosLista);
  window.addEventListener("click", (e) => {
    const modal = document.getElementById("modal-monstros-lista");
    if (e.target === modal) fecharModalMonstrosLista();
  });

  document.getElementById("btn-novo-monstro").addEventListener("click", abrirModalMonstro);
  document.getElementById("fechar-monstro").addEventListener("click", fecharModalMonstro);
  document.getElementById("btn-confirmar-monstro").addEventListener("click", confirmarNovoMonstro);
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-monstro")) fecharModalMonstro(); });
  document.getElementById("modal-monstro").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarNovoMonstro(); });

  document.getElementById("fechar-dano-cura").addEventListener("click", fecharModalDanoCura);
  document.getElementById("btn-confirmar-dano").addEventListener("click", confirmarDanoCura);
  document.getElementById("btn-morto-modal").addEventListener("click", mortoViaModal);
  document.getElementById("btn-rolar-dano-modal").addEventListener("click", rolarDadoModal);
  document.getElementById("modal-dano-manual").addEventListener("input", atualizarPrevia);
  document.getElementById("modal-dano-atacante").addEventListener("change", atualizarPrevia);
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-dano-cura")) fecharModalDanoCura(); });
  document.getElementById("modal-dano-cura").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarDanoCura(); });

  document.getElementById("btn-abrir-area").addEventListener("click", abrirModalArea);
  document.getElementById("fechar-area").addEventListener("click", fecharModalArea);
  document.getElementById("btn-rolar-area").addEventListener("click", rolarDadoArea);
  document.getElementById("btn-confirmar-area").addEventListener("click", confirmarDanoArea);
  document.getElementById("btn-area-todos").addEventListener("click", () => selecionarTodosArea(true));
  document.getElementById("btn-area-nenhum").addEventListener("click", () => selecionarTodosArea(false));
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-area")) fecharModalArea(); });

  document.getElementById("fechar-condicao-duracao").addEventListener("click", fecharModalCondicaoDuracao);
  document.getElementById("btn-confirmar-condicao").addEventListener("click", confirmarCondicao);
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-condicao-duracao")) fecharModalCondicaoDuracao(); });
  document.getElementById("modal-condicao-duracao").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarCondicao(); });

  document.getElementById("fechar-acerto").addEventListener("click", fecharModalAcerto);
  document.getElementById("btn-rolar-acerto").addEventListener("click", rolarAcerto);
  document.getElementById("btn-acerto-aplicar-dano").addEventListener("click", irParaDano);
  document.getElementById("btn-acerto-pular").addEventListener("click", irParaDano);
  window.addEventListener("click", (e) => { if (e.target === document.getElementById("modal-acerto")) fecharModalAcerto(); });

  document.getElementById("btn-turno-anterior").addEventListener("click", turnoAnterior);
  document.getElementById("btn-proximo-turno").addEventListener("click", proximoTurno);

  document.getElementById("btn-rolar-dado").addEventListener("click", rolarDadoSelecionado);
  selecionarDado(dadoSelecionado);
  renderizarUltimasRolagens();

  document.getElementById("btn-rapido-iniciativa").addEventListener("click", () => rolarAcaoRapida("Iniciativa", "🎲"));
  document.getElementById("btn-rapido-pericia").addEventListener("click", () => rolarAcaoRapida("Teste de Perícia", "🎯"));
  document.getElementById("btn-rapido-resistencia").addEventListener("click", () => rolarAcaoRapida("Teste de Resistência", "🛡️"));

  // Botões de ação do painel de turno
  const btnTurnoAtaque = document.getElementById("btn-turno-ataque");
  const btnTurnoCondicao = document.getElementById("btn-turno-condicao");
  const btnTurnoCura = document.getElementById("btn-turno-cura");

  if (btnTurnoAtaque) btnTurnoAtaque.addEventListener("click", abrirTurnoAcaoAtaque);
  if (btnTurnoCondicao) btnTurnoCondicao.addEventListener("click", abrirTurnoAcaoCondicao);
  if (btnTurnoCura) btnTurnoCura.addEventListener("click", abrirTurnoAcaoCura);

  document.addEventListener("click", (evento) => {
    const cliqueNoBotao = evento.target.closest("#btn-turno-condicao");
    const cliqueNoPopover = evento.target.closest(".condicao-popover");

    if (!cliqueNoBotao && !cliqueNoPopover) {
      document.querySelectorAll(".condicao-popover").forEach(p => p.remove());
    }
  });

  atualizarIniciativa();
  renderizarStatusGrupo();
  atualizarPainelTurno();
  aplicarConfig();

  const historicoSalvo = lerLocalStorageJSON("historicoRPG", []);
  historicoSalvo.forEach(e => renderizarItemHistorico(e.texto, e.tipo, e.hora));

  const areaAnotacoes = document.getElementById("campo-anotacoes");
  if (areaAnotacoes) {
    areaAnotacoes.value = localStorage.getItem("anotacoesRPG") || "";
    areaAnotacoes.addEventListener("input", () => localStorage.setItem("anotacoesRPG", areaAnotacoes.value));
  }

  const temaAtual = localStorage.getItem("temaRPG") || "dark";
  if (temaAtual === "light") document.body.classList.add("tema-light");
  atualizarBtnTema();
  document.getElementById("btn-tema").addEventListener("click", () => {
    document.body.classList.toggle("tema-light");
    const novoTema = document.body.classList.contains("tema-light") ? "light" : "dark";
    localStorage.setItem("temaRPG", novoTema);
    atualizarBtnTema();
  });
};