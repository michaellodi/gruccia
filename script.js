/*
Copyright 2026 Michael Lodi

This file is part of Trova il più pesante.

Trova il più pesante is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Trova il più pesante is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with Trova il più pesante. If not, see <https://www.gnu.org/licenses/>.
*/

const INSTRUCTIONS = [
  {
    id: "pick",
    title: "Prendi",
    text: "PRENDI IN MANO UN SACCHETTO DAI SACCHETTI DA PESARE",
  },
  {
    id: "hang",
    title: "Appendi",
    text: "APPENDI IL SACCHETTO CHE HAI IN MANO ALLA GRUCCIA",
  },
  {
    id: "pickLighter",
    title: "Più leggero",
    text: "PRENDI IN MANO IL SACCHETTO PIÙ LEGGERO TRA I DUE SULLA GRUCCIA",
  },
  {
    id: "eliminate",
    title: "Elimina",
    text: "METTI IL SACCHETTO CHE HAI IN MANO NEI SACCHETTI ELIMINATI",
  },
  {
    id: "repeatUntil",
    title: "Ripeti finché",
    text: "RIPETI FINCHÉ CI SONO ANCORA SACCHETTI DA PESARE",
    programOnly: true,
  },
];

const SPEED_MAP = {
  1: 1100,
  2: 760,
  3: 460,
};

const ui = {
  workspace: document.getElementById("workspace"),
  freeModeBtn: document.getElementById("freeModeBtn"),
  programModeBtn: document.getElementById("programModeBtn"),
  bagCountWrap: document.getElementById("bagCountWrap"),
  bagCountSelect: document.getElementById("bagCountSelect"),
  speedWrap: document.getElementById("speedWrap"),
  speedRange: document.getElementById("speedRange"),
  resetBtn: document.getElementById("resetBtn"),
  messageBar: document.getElementById("messageBar"),
  objectiveBadge: document.getElementById("objectiveBadge"),
  missionTitle: document.getElementById("missionTitle"),
  missionText: document.getElementById("missionText"),
  manualHint: document.getElementById("manualHint"),
  manualList: document.getElementById("manualList"),
  programmerCard: document.getElementById("programmerCard"),
  stepsHint: document.getElementById("stepsHint"),
  runBtn: document.getElementById("runBtn"),
  stopBtn: document.getElementById("stopBtn"),
  clearBtn: document.getElementById("clearBtn"),
  programArea: document.getElementById("programArea"),
  scene: document.getElementById("scene"),
  scaleRig: document.getElementById("scaleRig"),
  scaleHook: document.querySelector(".scale-hook"),
  centerString: document.querySelector(".scale-string--center"),
  scaleBeam: document.getElementById("scaleBeam"),
  leftPeg: document.getElementById("leftPeg"),
  rightPeg: document.getElementById("rightPeg"),
  leftString: document.getElementById("leftString"),
  rightString: document.getElementById("rightString"),
  zoneWeigh: document.getElementById("zoneWeigh"),
  zoneHand: document.getElementById("zoneHand"),
  zoneEliminated: document.getElementById("zoneEliminated"),
  zoneHangerLeft: document.getElementById("zoneHangerLeft"),
  zoneHangerRight: document.getElementById("zoneHangerRight"),
  weighCount: document.getElementById("weighCount"),
  eliminatedCount: document.getElementById("eliminatedCount"),
  bagsLayer: document.getElementById("bagsLayer"),
  successBubble: document.getElementById("successBubble"),
};

const state = {
  mode: "free",
  settings: {
    freeBagCount: 4,
    programBagCount: Number(ui.bagCountSelect.value),
    speedLevel: Number(ui.speedRange.value),
  },
  bags: [],
  handSource: null,
  message: "",
  program: [],
  activeProgramIndex: -1,
  placeholderIndex: null,
  execution: {
    running: false,
    stopRequested: false,
  },
  drag: null,
};

let layout = null;
let resizeObserver = null;

function createInstructionSvg(id) {
  const bag = `
    <path d="M34 20c0-6 22-6 22 0" fill="none" stroke="#a08d56" stroke-width="3" stroke-linecap="round"/>
    <rect x="28" y="20" width="34" height="38" rx="4" fill="#f7e58a" stroke="#a08d56" stroke-width="3"/>
    <circle cx="41" cy="34" r="1.8" fill="#6c6934"/>
    <circle cx="49" cy="34" r="1.8" fill="#6c6934"/>
    <path d="M40 42c3 3 7 3 10 0" fill="none" stroke="#6c6934" stroke-width="2.6" stroke-linecap="round"/>
  `;
  const bagSad = `
    <path d="M34 20c0-6 22-6 22 0" fill="none" stroke="#a08d56" stroke-width="3" stroke-linecap="round"/>
    <rect x="28" y="20" width="34" height="38" rx="4" fill="#f7e58a" stroke="#a08d56" stroke-width="3"/>
    <circle cx="41" cy="34" r="1.8" fill="#6c6934"/>
    <circle cx="49" cy="34" r="1.8" fill="#6c6934"/>
    <path d="M39 46c3-3 8-3 12 0" fill="none" stroke="#6c6934" stroke-width="2.6" stroke-linecap="round"/>
  `;
  const arrowUp = `
    <path d="M45 16V3" fill="none" stroke="#ef5f68" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M39 9l6-6 6 6" fill="none" stroke="#ef5f68" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
  `;
  const arrowDown = `
    <path d="M45 60v13" fill="none" stroke="#ef5f68" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M39 67l6 6 6-6" fill="none" stroke="#ef5f68" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
  `;
  const loopArrows = `
    <path d="M24 42c0-10 8-18 18-18h8" fill="none" stroke="#1d4d70" stroke-width="4.2" stroke-linecap="round"/>
    <path d="M46 18h12l-5-6" fill="none" stroke="#1d4d70" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M68 34c0 10-8 18-18 18h-8" fill="none" stroke="#1d4d70" stroke-width="4.2" stroke-linecap="round"/>
    <path d="M46 58H34l5 6" fill="none" stroke="#1d4d70" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
  `;

  if (id === "repeatUntil") {
    return `
      <svg class="instruction-svg" viewBox="0 0 92 76" aria-hidden="true">
        ${loopArrows}
        <circle cx="46" cy="38" r="6" fill="#f89d26" opacity="0.24"/>
        <circle cx="34" cy="38" r="3" fill="#f89d26"/>
        <circle cx="46" cy="38" r="3" fill="#f89d26"/>
        <circle cx="58" cy="38" r="3" fill="#f89d26"/>
      </svg>
    `;
  }

  if (id === "pick") {
    return `
      <svg class="instruction-svg" viewBox="0 0 92 76" aria-hidden="true">
        <path d="M18 62V45M74 62V45M18 62H74" fill="none" stroke="#1d4d70" stroke-width="4.2" stroke-linecap="round"/>
        ${bag}
        ${arrowUp}
      </svg>
    `;
  }

  if (id === "hang") {
    return `
      <svg class="instruction-svg" viewBox="0 0 92 76" aria-hidden="true">
        <path d="M18 18H74" fill="none" stroke="#1d4d70" stroke-width="4.2" stroke-linecap="round"/>
        <path d="M46 18V7" fill="none" stroke="#1d4d70" stroke-width="4.2" stroke-linecap="round"/>
        ${bag}
        ${arrowUp}
      </svg>
    `;
  }

  if (id === "pickLighter") {
    return `
      <svg class="instruction-svg" viewBox="0 0 92 76" aria-hidden="true">
        <path d="M20 22L72 16" fill="none" stroke="#1d4d70" stroke-width="4.2" stroke-linecap="round"/>
        <path d="M46 8v12" fill="none" stroke="#1d4d70" stroke-width="4.2" stroke-linecap="round"/>
        <g transform="translate(-8,10)">
          ${bag}
        </g>
        <g transform="translate(18,0)">
          ${bagSad}
        </g>
        <path d="M63 58v12" fill="none" stroke="#ef5f68" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M57 64l6 6 6-6" fill="none" stroke="#ef5f68" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  return `
    <svg class="instruction-svg" viewBox="0 0 92 76" aria-hidden="true">
      <path d="M18 63V46M74 63V46M18 63H74" fill="none" stroke="#c4741d" stroke-width="4.2" stroke-linecap="round"/>
      ${bagSad}
      ${arrowDown}
    </svg>
  `;
}

function shuffle(array) {
  const copy = [...array];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getBagCount() {
  return state.mode === "free" ? state.settings.freeBagCount : state.settings.programBagCount;
}

function getWeights(count) {
  return shuffle(Array.from({ length: count }, (_, index) => index + 1));
}

function createScenario() {
  const count = getBagCount();
  const weights = getWeights(count);
  state.bags = weights.map((weight, index) => ({
    id: `bag-${index + 1}`,
    weight,
    location: "weigh",
  }));
  state.handSource = null;
  state.activeProgramIndex = -1;
  state.placeholderIndex = null;
  ui.successBubble.classList.add("is-hidden");

  if (state.mode === "free") {
    setMessage("Trascina un sacchetto dalla scatola “da pesare” direttamente sulla gruccia.");
  } else {
    setMessage("Costruisci un programma e poi premi Run per vederlo in azione.");
  }
}

function setMessage(message) {
  state.message = message;
  ui.messageBar.textContent = message;
}

function getBagsByLocation(location) {
  return state.bags.filter((bag) => bag.location === location);
}

function getBagInHand() {
  return state.bags.find((bag) => bag.location === "hand") || null;
}

function getHangerBags() {
  return {
    left: state.bags.find((bag) => bag.location === "hanger-left") || null,
    right: state.bags.find((bag) => bag.location === "hanger-right") || null,
  };
}

function getLighterBag() {
  const { left, right } = getHangerBags();
  if (!left || !right) {
    return null;
  }
  return left.weight < right.weight ? left : right;
}

function getHeavierBag() {
  const { left, right } = getHangerBags();
  if (!left || !right) {
    return null;
  }
  return left.weight > right.weight ? left : right;
}

function getEmptyHangerSide(preferredSide = null) {
  const { left, right } = getHangerBags();
  if (preferredSide === "hanger-left" && !left) {
    return "hanger-left";
  }
  if (preferredSide === "hanger-right" && !right) {
    return "hanger-right";
  }
  if (!left) {
    return "hanger-left";
  }
  if (!right) {
    return "hanger-right";
  }
  return null;
}

function performPickFromWeigh(options = {}) {
  const hand = getBagInHand();
  if (hand) {
    return { ok: false, message: "Puoi avere in mano un solo sacchetto alla volta." };
  }

  const weighBags = getBagsByLocation("weigh");
  if (!weighBags.length) {
    return { ok: false, message: "Non ci sono più sacchetti da pesare." };
  }

  const bag = options.bagId ? state.bags.find((item) => item.id === options.bagId) : weighBags[0];
  if (!bag || bag.location !== "weigh") {
    return { ok: false, message: "Quel sacchetto non si trova tra quelli da pesare." };
  }

  bag.location = "hand";
  state.handSource = "weigh";
  return { ok: true, message: "Hai preso un sacchetto dalla scatola “da pesare”." };
}

function performFreeHangFromWeigh(options = {}) {
  const weighBags = getBagsByLocation("weigh");
  if (!weighBags.length) {
    return { ok: false, message: "Non ci sono più sacchetti da pesare." };
  }

  const bag = options.bagId ? state.bags.find((item) => item.id === options.bagId) : weighBags[0];
  if (!bag || bag.location !== "weigh") {
    return { ok: false, message: "Quel sacchetto non si trova tra quelli da pesare." };
  }

  const side = getEmptyHangerSide(options.side);
  if (!side) {
    return { ok: false, message: "Sulla gruccia ci sono già due sacchetti." };
  }

  bag.location = side;
  return { ok: true, message: "Hai appeso un sacchetto alla gruccia." };
}

function performHang(options = {}) {
  const hand = getBagInHand();
  if (!hand) {
    return { ok: false, message: "Prima devi avere un sacchetto in mano." };
  }

  if (state.handSource !== "weigh") {
    return { ok: false, message: "Questo sacchetto va messo tra quelli eliminati, non di nuovo sulla gruccia." };
  }

  const side = getEmptyHangerSide(options.side);
  if (!side) {
    return { ok: false, message: "Sulla gruccia ci sono già due sacchetti." };
  }

  hand.location = side;
  state.handSource = null;
  return { ok: true, message: "Il sacchetto è stato appeso alla gruccia." };
}

function performPickLighter(options = {}) {
  const hand = getBagInHand();
  if (hand) {
    return { ok: false, message: "Prima libera la tua mano." };
  }

  const lighter = getLighterBag();
  if (!lighter) {
    return { ok: false, message: "Per prendere il più leggero servono due sacchetti sulla gruccia." };
  }

  if (options.bagId && options.bagId !== lighter.id) {
    return { ok: false, message: "Sulla gruccia puoi prendere solo il sacchetto più leggero." };
  }

  lighter.location = "hand";
  state.handSource = "hanger";
  return { ok: true, message: "Hai preso in mano il sacchetto più leggero." };
}

function performFreeEliminateFromHanger(options = {}) {
  const { left, right } = getHangerBags();
  if (!left || !right) {
    return { ok: false, message: "Per togliere un sacchetto dalla gruccia devono essercene due." };
  }

  const bag = state.bags.find((item) => item.id === options.bagId);
  if (!bag || (bag.location !== "hanger-left" && bag.location !== "hanger-right")) {
    return { ok: false, message: "Quel sacchetto non è sulla gruccia." };
  }

  const lighter = getLighterBag();
  const removedCorrectBag = lighter && lighter.id === bag.id;
  bag.location = "eliminated";

  if (removedCorrectBag) {
    return { ok: true, message: "Hai tolto il sacchetto più leggero e lo hai eliminato." };
  }

  return {
    ok: true,
    message: "Hai tolto il sacchetto più pesante tra i due.",
  };
}

function performEliminate() {
  const hand = getBagInHand();
  if (!hand) {
    return { ok: false, message: "Prima devi avere in mano un sacchetto." };
  }

  if (state.handSource !== "hanger") {
    return { ok: false, message: "Prima confronta il sacchetto sulla gruccia: si elimina solo il più leggero." };
  }

  hand.location = "eliminated";
  state.handSource = null;
  return { ok: true, message: "Il sacchetto più leggero è stato eliminato." };
}

function getCompletion() {
  const weigh = getBagsByLocation("weigh");
  const eliminated = getBagsByLocation("eliminated");
  const hand = getBagInHand();
  const { left, right } = getHangerBags();
  const total = state.bags.length;
  const remainingHanger = [left, right].filter(Boolean);
  const candidate = remainingHanger[0] || null;

  const isFinished =
    weigh.length === 0 &&
    !hand &&
    eliminated.length === total - 1 &&
    remainingHanger.length === 1;

  if (!isFinished || !candidate) {
    return { isFinished: false, isComplete: false };
  }

  const heaviestWeight = Math.max(...state.bags.map((bag) => bag.weight));
  return {
    isFinished: true,
    isComplete: candidate.weight === heaviestWeight,
    bagId: candidate.id,
  };
}

function evaluateAfterAction(successMessage) {
  const completion = getCompletion();
  if (completion.isComplete) {
    ui.successBubble.classList.remove("is-hidden");
    setMessage("Ottimo! Sulla gruccia è rimasto proprio il sacchetto più pesante.");
  } else if (completion.isFinished) {
    ui.successBubble.classList.add("is-hidden");
    setMessage("È rimasto un solo sacchetto, ma non è il più pesante. Riprova.");
  } else {
    ui.successBubble.classList.add("is-hidden");
    setMessage(successMessage);
  }
}

function renderManual() {
  ui.manualList.innerHTML = "";
  const visibleInstructions = INSTRUCTIONS.filter((instruction) => state.mode === "program" || !instruction.programOnly);

  for (const instruction of visibleInstructions) {
    const row = document.createElement("div");
    row.className = "manual-row";
    row.dataset.action = instruction.id;
    if (state.mode === "program" && !state.execution.running) {
      row.classList.add("is-draggable");
    }

    const icon = document.createElement("div");
    icon.className = "manual-row__icon";
    icon.innerHTML = createInstructionSvg(instruction.id);
    icon.title = instruction.title;

    const copy = document.createElement("div");
    copy.className = "manual-row__copy";
    copy.innerHTML = `
      <div class="manual-row__title">${instruction.title}</div>
      <div class="manual-row__text">${instruction.text}</div>
    `;

    if (state.mode === "program" && !state.execution.running) {
      icon.addEventListener("pointerdown", (event) => startBlockDrag(event, instruction.id, "palette", null));
      row.addEventListener("click", (event) => {
        if (state.drag || event.target.closest(".manual-row__icon")) {
          return;
        }
        addBlockToProgram(instruction.id);
      });
    }

    row.append(icon, copy);
    ui.manualList.appendChild(row);
  }
}

function renderProgram() {
  ui.programArea.innerHTML = "";
  const repeatIndex = getRepeatIndex();

  if (!state.program.length && state.placeholderIndex === null) {
    const empty = document.createElement("div");
    empty.className = "program-empty";
    empty.textContent = "Trascina qui le icone delle istruzioni per costruire la sequenza. Puoi usare anche “Ripeti finché”.";
    ui.programArea.appendChild(empty);
    return;
  }

  const sequence = document.createElement("div");
  sequence.className = "program-sequence";

  if (repeatIndex === -1) {
    appendProgramRange(sequence, 0, state.program.length);
    if (state.placeholderIndex === state.program.length) {
      sequence.appendChild(createProgramPlaceholder());
    }
  } else {
    appendProgramRange(sequence, 0, repeatIndex);
    if (state.placeholderIndex === repeatIndex) {
      sequence.appendChild(createProgramPlaceholder());
    }
    sequence.appendChild(createProgramBlock(state.program[repeatIndex], repeatIndex));

    const loopShell = document.createElement("div");
    loopShell.className = "program-loop-shell";
    const loopBody = document.createElement("div");
    loopBody.className = "program-loop-body";
    loopBody.dataset.repeatIndex = String(repeatIndex);

    appendProgramRange(loopBody, repeatIndex + 1, state.program.length);

    if (
      state.placeholderIndex === state.program.length ||
      (state.placeholderIndex === repeatIndex + 1 && state.program.length === repeatIndex + 1)
    ) {
      loopBody.appendChild(createProgramPlaceholder());
    }

    if (repeatIndex === state.program.length - 1 && state.placeholderIndex === null) {
      const emptyLoop = document.createElement("div");
      emptyLoop.className = "program-loop-empty";
      emptyLoop.textContent = "Metti qui i blocchi da ripetere.";
      loopBody.appendChild(emptyLoop);
    }

    loopShell.appendChild(loopBody);
    sequence.appendChild(loopShell);
  }

  ui.programArea.appendChild(sequence);
}

function appendProgramRange(container, startIndex, endIndex) {
  for (let index = startIndex; index < endIndex; index += 1) {
    if (index === state.placeholderIndex) {
      container.appendChild(createProgramPlaceholder());
    }
    container.appendChild(createProgramBlock(state.program[index], index));
  }
}

function createProgramPlaceholder() {
  const block = document.createElement("div");
  block.className = "program-block is-placeholder";
  block.innerHTML = `<div class="program-block__icon"></div><div class="program-block__index">qui</div>`;
  return block;
}

function createProgramBlock(actionId, index) {
  const instruction = getInstruction(actionId);
  const block = document.createElement("div");
  block.className = "program-block";
  if (actionId === "repeatUntil") {
    block.classList.add("program-block--repeat");
  }
  if (state.activeProgramIndex === index) {
    block.classList.add("is-active");
  }
  block.dataset.index = String(index);
  block.dataset.action = actionId;
  if (actionId === "repeatUntil") {
    block.innerHTML = `
      <button class="program-block__remove" type="button" aria-label="Rimuovi blocco">×</button>
      <div class="program-block__icon">${createInstructionSvg(actionId)}</div>
      <div class="program-block__copy">
        <div class="program-block__name">${instruction.title}</div>
        <div class="program-block__index">finché restano sacchetti da pesare</div>
      </div>
    `;
  } else {
    block.innerHTML = `
      <button class="program-block__remove" type="button" aria-label="Rimuovi blocco">×</button>
      <div class="program-block__icon">${createInstructionSvg(actionId)}</div>
      <div class="program-block__index">${index + 1}</div>
    `;
  }

  if (!state.execution.running) {
    block.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".program-block__remove")) {
        return;
      }
      startBlockDrag(event, actionId, "program", index);
    });
  } else {
    block.classList.add("is-disabled");
  }

  block.querySelector(".program-block__remove").addEventListener("click", (event) => {
    event.stopPropagation();
    if (state.execution.running) {
      return;
    }
    state.program.splice(index, 1);
    renderProgram();
    updateRunButtons();
  });

  return block;
}

function addBlockToProgram(actionId, index = state.program.length) {
  if (actionId === "repeatUntil" && getRepeatIndex() !== -1) {
    setMessage("Puoi usare un solo blocco “Ripeti finché” per volta.");
    return;
  }
  state.program.splice(index, 0, actionId);
  renderProgram();
  updateRunButtons();
}

function moveProgramBlock(fromIndex, toIndex) {
  if (fromIndex === toIndex) {
    return;
  }
  const [item] = state.program.splice(fromIndex, 1);
  const targetIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
  state.program.splice(targetIndex, 0, item);
}

function updateMission() {
  if (state.mode === "free") {
    ui.missionTitle.textContent = "Gioca con i 4 sacchetti del quaderno";
    ui.missionText.textContent =
      "Trascina direttamente i sacchetti sulla gruccia e poi, dopo il confronto, trascinane via uno tra quelli eliminati.";
    ui.manualHint.textContent = "Nel gioco libero usa queste azioni come guida.";
    ui.objectiveBadge.textContent =
      "Alla fine, sulla gruccia deve restare solo il sacchetto più pesante.";
  } else {
    const bagCount = state.settings.programBagCount;
    const explicitSteps = 2 + (bagCount - 1) * 4;
    ui.missionTitle.textContent = "Programma";
    ui.missionText.textContent =
      "Costruisci una sequenza di istruzioni: puoi usare anche “Ripeti finché” per scrivere un programma più corto.";
    ui.manualHint.textContent =
      "Ogni riga mostra l’icona del blocco e la sua spiegazione, come nel libretto delle istruzioni.";
    ui.objectiveBadge.textContent =
      "Qui puoi usare più sacchetti: l’esecutore segue il programma automaticamente.";
    ui.stepsHint.textContent =
      `Con ${bagCount} sacchetti puoi usare ${explicitSteps} blocchi espliciti oppure 7 con “Ripeti finché”.`;
  }
}

function updateModeButtons() {
  ui.workspace.classList.toggle("workspace--free", state.mode === "free");
  ui.workspace.classList.toggle("workspace--program", state.mode === "program");
  ui.freeModeBtn.classList.toggle("is-active", state.mode === "free");
  ui.programModeBtn.classList.toggle("is-active", state.mode === "program");
  ui.freeModeBtn.setAttribute("aria-selected", String(state.mode === "free"));
  ui.programModeBtn.setAttribute("aria-selected", String(state.mode === "program"));
  ui.programmerCard.classList.toggle("is-hidden", state.mode !== "program");
  ui.bagCountWrap.classList.toggle("is-hidden", state.mode !== "program");
  ui.speedWrap.classList.toggle("is-hidden", state.mode !== "program");
  ui.zoneHand.classList.toggle("is-hidden", state.mode === "free");
}

function updateCounts() {
  ui.weighCount.textContent = `${getBagsByLocation("weigh").length} sacchetti`;
  ui.eliminatedCount.textContent = `${getBagsByLocation("eliminated").length} sacchetti`;
}

function computeLayout() {
  const sceneRect = ui.scene.getBoundingClientRect();
  const width = sceneRect.width;
  const height = sceneRect.height;
  const unit = Math.min(width / 1000, height / 700);
  const bagWidth = window.innerWidth <= 720 ? 74 : 88;
  const bagHeight = window.innerWidth <= 720 ? 102 : 118;

  const weighBox = { x: 60 * unit, y: 450 * unit, width: 280 * unit, height: 170 * unit };
  const handBox = { x: 412 * unit, y: 454 * unit, width: 176 * unit, height: 160 * unit };
  const eliminatedBox = { x: 660 * unit, y: 450 * unit, width: 280 * unit, height: 170 * unit };

  const beamTop = 145 * unit;
  const beamLength = 360 * unit;
  const beamThickness = 12 * unit;
  const pegInset = 18 * unit;
  const pegWidth = 8 * unit;
  const pegHeight = 24 * unit;
  const pegTop = 7 * unit;
  const sideStringLength = 36 * unit;
  const centerStringLength = 44 * unit;
  const centerStringTop = beamTop - centerStringLength;
  const hookWidth = 48 * unit;
  const hookHeight = 62 * unit;
  const hookTop = centerStringTop - hookHeight + 6 * unit;
  const beamPivot = {
    x: width / 2,
    y: beamTop + beamThickness / 2,
  };
  const pegBottomFromPivot = pegTop + pegHeight - beamThickness / 2;

  layout = {
    width,
    height,
    unit,
    bagWidth,
    bagHeight,
    weighBox,
    handBox,
    eliminatedBox,
    beamTop,
    beamPivot,
    beamLength,
    beamThickness,
    pegInset,
    pegWidth,
    pegHeight,
    pegTop,
    pegBottomFromPivot,
    sideStringLength,
    centerStringLength,
    centerStringTop,
    hookWidth,
    hookHeight,
    hookTop,
  };
}

function applyZoneLayout() {
  const boxes = [
    [ui.zoneWeigh, layout.weighBox],
    [ui.zoneEliminated, layout.eliminatedBox],
  ];

  if (state.mode === "program") {
    boxes.splice(1, 0, [ui.zoneHand, layout.handBox]);
  }

  for (const [element, box] of boxes) {
    element.style.left = `${box.x}px`;
    element.style.top = `${box.y}px`;
    element.style.width = `${box.width}px`;
    element.style.height = `${box.height}px`;
  }
}

function getBeamAngle() {
  const { left, right } = getHangerBags();
  if (left && !right) {
    return -12;
  }
  if (!left && right) {
    return 12;
  }
  if (!left && !right) {
    return 0;
  }

  const maxWeight = Math.max(...state.bags.map((bag) => bag.weight));
  const difference = right.weight - left.weight;
  return Math.max(-18, Math.min(18, (difference / maxWeight) * 18));
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function getAnchorPosition(side) {
  const angle = degreesToRadians(getBeamAngle());
  const halfBeamToPegCenter = layout.beamLength / 2 - (layout.pegInset + layout.pegWidth / 2);
  const direction = side === "left" ? -1 : 1;
  const baseX = direction * halfBeamToPegCenter;
  const rotatedX = baseX * Math.cos(angle);
  const rotatedY = baseX * Math.sin(angle);

  return {
    x: layout.beamPivot.x + rotatedX,
    y: layout.beamPivot.y + rotatedY + layout.pegBottomFromPivot,
  };
}

function updateScale() {
  const angle = getBeamAngle();
  ui.scaleRig.style.inset = "0";
  ui.scaleHook.style.left = `${layout.beamPivot.x}px`;
  ui.scaleHook.style.top = `${layout.hookTop}px`;
  ui.scaleHook.style.width = `${layout.hookWidth}px`;
  ui.scaleHook.style.height = `${layout.hookHeight}px`;
  ui.scaleHook.style.transform = "translateX(-50%)";

  ui.centerString.style.left = `${layout.beamPivot.x}px`;
  ui.centerString.style.top = `${layout.centerStringTop}px`;
  ui.centerString.style.width = `${Math.max(2, 4 * layout.unit)}px`;
  ui.centerString.style.height = `${layout.centerStringLength}px`;

  ui.scaleBeam.style.width = `${layout.beamLength}px`;
  ui.scaleBeam.style.height = `${layout.beamThickness}px`;
  ui.scaleBeam.style.left = `${layout.beamPivot.x - layout.beamLength / 2}px`;
  ui.scaleBeam.style.top = `${layout.beamTop}px`;
  ui.scaleBeam.style.transform = `rotate(${angle}deg)`;
  ui.leftPeg.style.left = `${layout.pegInset}px`;
  ui.leftPeg.style.top = `${layout.pegTop}px`;
  ui.leftPeg.style.width = `${layout.pegWidth}px`;
  ui.leftPeg.style.height = `${layout.pegHeight}px`;
  ui.rightPeg.style.right = `${layout.pegInset}px`;
  ui.rightPeg.style.top = `${layout.pegTop}px`;
  ui.rightPeg.style.width = `${layout.pegWidth}px`;
  ui.rightPeg.style.height = `${layout.pegHeight}px`;

  const left = getHangerBags().left;
  const right = getHangerBags().right;
  const leftAnchor = getAnchorPosition("left");
  const rightAnchor = getAnchorPosition("right");

  positionSideString(ui.leftString, leftAnchor, left);
  positionSideString(ui.rightString, rightAnchor, right);
  positionHangerZones(leftAnchor, rightAnchor);
}

function positionSideString(element, anchor, bag) {
  if (!bag) {
    element.style.display = "none";
    return;
  }

  element.style.display = "block";
  element.style.left = `${anchor.x}px`;
  element.style.top = `${anchor.y}px`;
  element.style.width = `${Math.max(2, 3 * layout.unit)}px`;
  element.style.height = `${layout.sideStringLength}px`;
  element.style.transform = "translateX(-50%)";
}

function positionHangerZones(leftAnchor, rightAnchor) {
  const zoneSize = 110 * layout.unit;
  ui.zoneHangerLeft.style.left = `${leftAnchor.x - zoneSize / 2}px`;
  ui.zoneHangerLeft.style.top = `${leftAnchor.y + layout.sideStringLength - 10 * layout.unit}px`;
  ui.zoneHangerLeft.style.width = `${zoneSize}px`;
  ui.zoneHangerLeft.style.height = `${layout.bagHeight + 34 * layout.unit}px`;

  ui.zoneHangerRight.style.left = `${rightAnchor.x - zoneSize / 2}px`;
  ui.zoneHangerRight.style.top = `${rightAnchor.y + layout.sideStringLength - 10 * layout.unit}px`;
  ui.zoneHangerRight.style.width = `${zoneSize}px`;
  ui.zoneHangerRight.style.height = `${layout.bagHeight + 34 * layout.unit}px`;
}

function getBagPose(bag) {
  const weighBags = getBagsByLocation("weigh");
  const eliminatedBags = getBagsByLocation("eliminated");
  const handBag = getBagInHand();
  const weightBadgeOffset = { x: 0, y: 0 };

  if (bag.location === "weigh") {
    const index = weighBags.findIndex((item) => item.id === bag.id);
    return {
      x: layout.weighBox.x + 24 + (index % 3) * (layout.bagWidth * 0.35),
      y: layout.weighBox.y + layout.weighBox.height - layout.bagHeight - 18 - Math.floor(index / 3) * 12,
      z: index + 1,
      weightBadgeOffset,
    };
  }

  if (bag.location === "eliminated") {
    const index = eliminatedBags.findIndex((item) => item.id === bag.id);
    return {
      x: layout.eliminatedBox.x + 26 + (index % 3) * (layout.bagWidth * 0.35),
      y:
        layout.eliminatedBox.y +
        layout.eliminatedBox.height -
        layout.bagHeight -
        18 -
        Math.floor(index / 3) * 12,
      z: 10 + index,
      weightBadgeOffset,
    };
  }

  if (bag.location === "hand" && handBag) {
    return {
      x: layout.handBox.x + layout.handBox.width / 2 - layout.bagWidth / 2,
      y: layout.handBox.y + layout.handBox.height - layout.bagHeight - 14,
      z: 40,
      weightBadgeOffset,
    };
  }

  if (bag.location === "hanger-left") {
    const anchor = getAnchorPosition("left");
    return {
      x: anchor.x - layout.bagWidth / 2,
      y: anchor.y + layout.sideStringLength,
      z: 30,
      weightBadgeOffset,
    };
  }

  if (bag.location === "hanger-right") {
    const anchor = getAnchorPosition("right");
    return {
      x: anchor.x - layout.bagWidth / 2,
      y: anchor.y + layout.sideStringLength,
      z: 30,
      weightBadgeOffset,
    };
  }

  return { x: 0, y: 0, z: 1, weightBadgeOffset };
}

function ensureBagElement(bag) {
  let element = ui.bagsLayer.querySelector(`[data-bag-id="${bag.id}"]`);
  if (!element) {
    element = document.createElement("div");
    element.className = "bag";
    element.dataset.bagId = bag.id;
    element.innerHTML = `
      <div class="bag__shadow"></div>
      <div class="bag__handle"></div>
      <div class="bag__body"></div>
      <div class="bag__weight">${bag.weight}</div>
    `;
    element.addEventListener("pointerdown", startBagDrag);
    ui.bagsLayer.appendChild(element);
  }
  return element;
}

function isBagDraggable(bag) {
  if (state.mode !== "free" || state.execution.running) {
    return false;
  }

  if (bag.location === "weigh") {
    return Boolean(getEmptyHangerSide());
  }

  if (bag.location === "hanger-left" || bag.location === "hanger-right") {
    const { left, right } = getHangerBags();
    return Boolean(left && right);
  }

  return false;
}

function renderBags() {
  const activeIds = new Set(state.bags.map((bag) => bag.id));
  ui.bagsLayer.querySelectorAll(".bag").forEach((element) => {
    if (!activeIds.has(element.dataset.bagId)) {
      element.remove();
    }
  });

  const completion = getCompletion();
  for (const bag of state.bags) {
    const element = ensureBagElement(bag);
    const pose = getBagPose(bag);
    element.style.width = `${layout.bagWidth}px`;
    element.style.height = `${layout.bagHeight}px`;
    element.style.transform = `translate(${pose.x}px, ${pose.y}px)`;
    element.style.zIndex = String(pose.z);
    element.classList.toggle("is-disabled", !isBagDraggable(bag));
    element.classList.toggle("is-champion", completion.isComplete && completion.bagId === bag.id);
  }
}

function renderScene() {
  ui.scene.classList.toggle("is-readonly", state.mode === "program");
  computeLayout();
  applyZoneLayout();
  updateScale();
  updateCounts();
  renderBags();
}

function renderAll() {
  updateModeButtons();
  updateMission();
  renderManual();
  renderProgram();
  renderScene();
  updateRunButtons();
}

function setMode(mode) {
  if (state.execution.running) {
    return;
  }
  state.mode = mode;
  createScenario();
  renderAll();
}

function updateRunButtons() {
  const canRun = state.mode === "program" && state.program.length > 0 && !state.execution.running;
  ui.runBtn.disabled = !canRun;
  ui.clearBtn.disabled = state.execution.running || state.program.length === 0;
  ui.stopBtn.disabled = !state.execution.running;
}

function getInstruction(actionId) {
  return INSTRUCTIONS.find((instruction) => instruction.id === actionId);
}

function getRepeatIndex() {
  return state.program.indexOf("repeatUntil");
}

function getInstructionAction(actionId) {
  if (actionId === "pick") {
    return () => performPickFromWeigh();
  }
  if (actionId === "hang") {
    return () => performHang();
  }
  if (actionId === "pickLighter") {
    return () => performPickLighter();
  }
  return () => performEliminate();
}

async function runProgram() {
  if (state.execution.running || !state.program.length) {
    return;
  }

  state.execution.running = true;
  state.execution.stopRequested = false;
  state.activeProgramIndex = -1;
  let failed = false;
  let completed = false;
  createScenario();
  renderAll();
  updateRunButtons();

  const repeatIndex = getRepeatIndex();
  if (repeatIndex === -1) {
    const outcome = await runProgramRange(0, state.program.length);
    failed = outcome.failed;
    completed = outcome.completed;
  } else if (repeatIndex === state.program.length - 1) {
    failed = true;
    setMessage("Il blocco “Ripeti finché” deve avere sotto almeno un’istruzione da ripetere.");
  } else {
    let outcome = await runProgramRange(0, repeatIndex);
    failed = outcome.failed;
    completed = outcome.completed;

    if (!failed && !completed && !state.execution.stopRequested) {
      state.activeProgramIndex = repeatIndex;
      renderProgram();
      setMessage("Ripeto i blocchi qui sotto finché ci sono ancora sacchetti da pesare.");
      await sleep(SPEED_MAP[state.settings.speedLevel]);
    }

    while (!failed && !completed && !state.execution.stopRequested && getBagsByLocation("weigh").length > 0) {
      const weighBeforeLoop = getBagsByLocation("weigh").length;
      outcome = await runProgramRange(repeatIndex + 1, state.program.length);
      failed = outcome.failed;
      completed = outcome.completed;

      if (!failed && !completed && getBagsByLocation("weigh").length >= weighBeforeLoop) {
        failed = true;
        setMessage("Il blocco “Ripeti finché” non sta facendo andare avanti il programma: serve eliminare un sacchetto a ogni giro.");
      }
    }
  }

  if (state.execution.stopRequested) {
    setMessage("Esecuzione interrotta.");
  } else if (!failed && !completed && !getCompletion().isComplete) {
    setMessage("Il programma è finito, ma la gruccia non ha ancora un solo campione vincente.");
  }

  state.execution.running = false;
  state.execution.stopRequested = false;
  state.activeProgramIndex = -1;
  renderProgram();
  renderScene();
  updateRunButtons();
}

async function runProgramRange(startIndex, endIndex) {
  let failed = false;
  let completed = false;

  for (let index = startIndex; index < endIndex; index += 1) {
    if (state.execution.stopRequested) {
      break;
    }

    state.activeProgramIndex = index;
    renderProgram();

    const action = getInstructionAction(state.program[index]);
    const result = action();
    renderScene();

    if (!result.ok) {
      failed = true;
      setMessage(`Il programma si ferma al blocco ${index + 1}: ${result.message}`);
      break;
    }

    evaluateAfterAction(`Blocco ${index + 1}: ${result.message}`);

    const completion = getCompletion();
    if (completion.isComplete) {
      completed = true;
      break;
    }

    await sleep(SPEED_MAP[state.settings.speedLevel]);
  }

  return { failed, completed };
}

function stopProgram() {
  if (!state.execution.running) {
    return;
  }
  state.execution.stopRequested = true;
}

function startBlockDrag(event, actionId, source, sourceIndex) {
  if (state.mode !== "program" || state.execution.running) {
    return;
  }

  event.preventDefault();
  const ghost = document.createElement("div");
  ghost.className = "drag-ghost drag-ghost--block";
  ghost.innerHTML = createInstructionSvg(actionId);
  document.body.appendChild(ghost);
  const sourceRect = event.currentTarget.getBoundingClientRect();

  const drag = {
    type: "block",
    pointerId: event.pointerId,
    actionId,
    source,
    sourceIndex,
    ghost,
    offsetX: event.clientX - sourceRect.left,
    offsetY: event.clientY - sourceRect.top,
    moved: false,
  };

  state.drag = drag;
  moveGhost(drag, event.clientX, event.clientY);
  updateProgramPlaceholder(event.clientX, event.clientY, source, sourceIndex);

  window.addEventListener("pointermove", onGlobalPointerMove);
  window.addEventListener("pointerup", onGlobalPointerUp);
}

function startBagDrag(event) {
  const bagId = event.currentTarget.dataset.bagId;
  const bag = state.bags.find((item) => item.id === bagId);
  if (!bag || !isBagDraggable(bag)) {
    return;
  }

  event.preventDefault();
  const sourceRect = event.currentTarget.getBoundingClientRect();
  const ghost = event.currentTarget.cloneNode(true);
  ghost.className = "drag-ghost drag-ghost--bag";
  ghost.style.width = `${sourceRect.width}px`;
  ghost.style.height = `${sourceRect.height}px`;
  ghost.style.transform = "rotate(-3deg)";
  ghost.style.zIndex = "30";
  document.body.appendChild(ghost);

  event.currentTarget.classList.add("is-dragging");

  const validZones = getValidDropZonesForBag(bag);
  highlightZones(validZones);

  state.drag = {
    type: "bag",
    pointerId: event.pointerId,
    bagId,
    ghost,
    sourceLocation: bag.location,
    validZones,
    element: event.currentTarget,
    offsetX: event.clientX - sourceRect.left,
    offsetY: event.clientY - sourceRect.top,
  };

  moveGhost(state.drag, event.clientX, event.clientY);
  window.addEventListener("pointermove", onGlobalPointerMove);
  window.addEventListener("pointerup", onGlobalPointerUp);
}

function moveGhost(drag, x, y) {
  drag.ghost.style.left = `${x - drag.offsetX}px`;
  drag.ghost.style.top = `${y - drag.offsetY}px`;
}

function onGlobalPointerMove(event) {
  if (!state.drag) {
    return;
  }
  state.drag.moved = true;
  moveGhost(state.drag, event.clientX, event.clientY);

  if (state.drag.type === "block") {
    updateProgramPlaceholder(event.clientX, event.clientY, state.drag.source, state.drag.sourceIndex);
  } else {
    updateBagTargetHighlight(event.clientX, event.clientY);
  }
}

function onGlobalPointerUp(event) {
  if (!state.drag) {
    return;
  }

  const drag = state.drag;
  if (drag.type === "block") {
    finishBlockDrag(event.clientX, event.clientY);
  } else {
    finishBagDrag(event.clientX, event.clientY);
  }

  drag.ghost.remove();
  cleanupDrag();
}

function cleanupDrag() {
  if (state.drag?.element) {
    state.drag.element.classList.remove("is-dragging");
  }
  clearZoneHighlights();
  state.drag = null;
  state.placeholderIndex = null;
  window.removeEventListener("pointermove", onGlobalPointerMove);
  window.removeEventListener("pointerup", onGlobalPointerUp);
  renderProgram();
}

function updateProgramPlaceholder(clientX, clientY, source, sourceIndex) {
  const areaRect = ui.programArea.getBoundingClientRect();
  if (
    clientX < areaRect.left ||
    clientX > areaRect.right ||
    clientY < areaRect.top ||
    clientY > areaRect.bottom
  ) {
    state.placeholderIndex = source === "program" ? sourceIndex : null;
    renderProgram();
    return;
  }

  const blockUnderPointer = document
    .elementsFromPoint(clientX, clientY)
    .find((element) => element.classList?.contains("program-block") && !element.classList.contains("is-placeholder"));

  if (!blockUnderPointer) {
    const loopBody = document
      .elementsFromPoint(clientX, clientY)
      .find((element) => element.classList?.contains("program-loop-body"));

    if (loopBody) {
      const repeatIndex = Number(loopBody.dataset.repeatIndex);
      const hasLoopChildren = state.program.length > repeatIndex + 1;
      state.placeholderIndex = hasLoopChildren ? state.program.length : repeatIndex + 1;
      renderProgram();
      return;
    }

    state.placeholderIndex = state.program.length;
    renderProgram();
    return;
  }

  const rect = blockUnderPointer.getBoundingClientRect();
  const index = Number(blockUnderPointer.dataset.index);
  state.placeholderIndex = clientY < rect.top + rect.height / 2 ? index : index + 1;
  renderProgram();
}

function finishBlockDrag(clientX, clientY) {
  const drag = state.drag;
  if (!drag) {
    return;
  }

  if (!drag.moved) {
    if (drag.source === "palette") {
      addBlockToProgram(drag.actionId);
    }
    return;
  }

  const areaRect = ui.programArea.getBoundingClientRect();
  const inside =
    clientX >= areaRect.left &&
    clientX <= areaRect.right &&
    clientY >= areaRect.top &&
    clientY <= areaRect.bottom;

  if (!inside || state.placeholderIndex === null) {
    return;
  }

  if (drag.source === "palette") {
    addBlockToProgram(drag.actionId, state.placeholderIndex);
    return;
  }

  moveProgramBlock(drag.sourceIndex, state.placeholderIndex);
  renderProgram();
  updateRunButtons();
}

function getValidDropZonesForBag(bag) {
  if (state.mode === "free") {
    if (bag.location === "weigh") {
      const zones = [];
      if (!getHangerBags().left) {
        zones.push("hanger-left");
      }
      if (!getHangerBags().right) {
        zones.push("hanger-right");
      }
      return zones;
    }

    if (bag.location === "hanger-left" || bag.location === "hanger-right") {
      const { left, right } = getHangerBags();
      return left && right ? ["eliminated"] : [];
    }

    return [];
  }

  if (bag.location === "weigh") {
    return getBagInHand() ? [] : ["hand"];
  }

  if (bag.location === "hand") {
    if (state.handSource === "weigh") {
      const zones = [];
      if (!getHangerBags().left) {
        zones.push("hanger-left");
      }
      if (!getHangerBags().right) {
        zones.push("hanger-right");
      }
      return zones;
    }
    if (state.handSource === "hanger") {
      return ["eliminated"];
    }
  }

  if (bag.location === "hanger-left" || bag.location === "hanger-right") {
    const lighter = getLighterBag();
    return lighter && lighter.id === bag.id && !getBagInHand() ? ["hand"] : [];
  }

  return [];
}

function getZoneElement(zoneId) {
  return {
    weigh: ui.zoneWeigh,
    hand: ui.zoneHand,
    eliminated: ui.zoneEliminated,
    "hanger-left": ui.zoneHangerLeft,
    "hanger-right": ui.zoneHangerRight,
  }[zoneId];
}

function highlightZones(zoneIds) {
  clearZoneHighlights();
  for (const zoneId of zoneIds) {
    const element = getZoneElement(zoneId);
    if (element) {
      element.classList.add("is-target");
    }
  }
}

function clearZoneHighlights() {
  [ui.zoneWeigh, ui.zoneHand, ui.zoneEliminated, ui.zoneHangerLeft, ui.zoneHangerRight].forEach((element) =>
    element.classList.remove("is-target")
  );
}

function updateBagTargetHighlight(clientX, clientY) {
  clearZoneHighlights();
  const zone = document
    .elementsFromPoint(clientX, clientY)
    .find((element) => element.dataset?.zone && state.drag.validZones.includes(element.dataset.zone));

  if (zone) {
    zone.classList.add("is-target");
  } else {
    highlightZones(state.drag.validZones);
  }
}

function finishBagDrag(clientX, clientY) {
  const drag = state.drag;
  const zone = document
    .elementsFromPoint(clientX, clientY)
    .find((element) => element.dataset?.zone && drag.validZones.includes(element.dataset.zone));

  if (!zone) {
    renderScene();
    return;
  }

  const bag = state.bags.find((item) => item.id === drag.bagId);
  let result = null;

  if (state.mode === "free" && bag.location === "weigh" && zone.dataset.zone.startsWith("hanger")) {
    result = performFreeHangFromWeigh({ bagId: bag.id, side: zone.dataset.zone });
  } else if (state.mode === "free" && bag.location.startsWith("hanger") && zone.dataset.zone === "eliminated") {
    result = performFreeEliminateFromHanger({ bagId: bag.id });
  } else if (bag.location === "weigh" && zone.dataset.zone === "hand") {
    result = performPickFromWeigh({ bagId: bag.id });
  } else if (bag.location === "hand" && zone.dataset.zone.startsWith("hanger")) {
    result = performHang({ side: zone.dataset.zone });
  } else if (bag.location === "hand" && zone.dataset.zone === "eliminated") {
    result = performEliminate();
  } else if (bag.location.startsWith("hanger") && zone.dataset.zone === "hand") {
    result = performPickLighter({ bagId: bag.id });
  }

  if (!result) {
    renderScene();
    return;
  }

  renderScene();
  if (result.ok) {
    evaluateAfterAction(result.message);
  } else {
    setMessage(result.message);
  }
}

function bindEvents() {
  ui.freeModeBtn.addEventListener("click", () => setMode("free"));
  ui.programModeBtn.addEventListener("click", () => setMode("program"));
  ui.resetBtn.addEventListener("click", () => {
    if (state.execution.running) {
      return;
    }
    createScenario();
    renderAll();
  });

  ui.bagCountSelect.addEventListener("change", () => {
    state.settings.programBagCount = Number(ui.bagCountSelect.value);
    if (state.mode === "program" && !state.execution.running) {
      createScenario();
      renderAll();
    } else {
      updateMission();
    }
  });

  ui.speedRange.addEventListener("input", () => {
    state.settings.speedLevel = Number(ui.speedRange.value);
  });

  ui.runBtn.addEventListener("click", runProgram);
  ui.stopBtn.addEventListener("click", stopProgram);
  ui.clearBtn.addEventListener("click", () => {
    if (state.execution.running) {
      return;
    }
    state.program = [];
    renderProgram();
    updateRunButtons();
  });

  resizeObserver = new ResizeObserver(() => renderScene());
  resizeObserver.observe(ui.scene);
  window.addEventListener("resize", renderScene);
}

function init() {
  createScenario();
  bindEvents();
  renderAll();
}

init();
