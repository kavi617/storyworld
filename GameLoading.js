const WORLD_UI = {
  nature: { icon: "🌲", title: "இயற்கை உலகம்" },
  architecture: { icon: "🛕", title: "கட்டிடக்கலை உலகம்" },
  water: { icon: "💧", title: "நீர் மேலாண்மை உலகம்" },
};

const REQUIRED_TASKS = ["characters", "player", "world"];
const completedTasks = new Set();
let readyCallback = null;
let currentWorld = "nature";
let loadingRevealed = false;

function getElements() {
  return {
    screen: document.getElementById("loadingScreen"),
    progress: document.getElementById("loadingProgress"),
    percent: document.getElementById("loadingPercent"),
    status: document.getElementById("loadingStatus"),
    title: document.getElementById("loadingTitle"),
    icon: document.getElementById("loadingIcon"),
  };
}

function updateUI(value) {
  const pct = document.getElementById("loadingPercent");
  const bar = document.getElementById("loadingProgress");
  const sts = document.getElementById("loadingStatus");
  if (pct) pct.textContent = `${value}%`;
  if (bar) bar.style.width = `${value}%`;
}

function updateBar() {
  const done = completedTasks.size;
  const total = REQUIRED_TASKS.length;
  const percent = Math.round((done / total) * 100);

  updateUI(percent);

  const sts = document.getElementById("loadingStatus");
  if (sts) {
    if (!completedTasks.has("characters")) sts.textContent = "Loading models...";
    else if (!completedTasks.has("world")) sts.textContent = "Loading world...";
    else if (!completedTasks.has("player")) sts.textContent = "Loading player...";
    else sts.textContent = "Ready!";
  }

  if (done >= total) reveal();
}

function reveal() {
  if (loadingRevealed) return;
  loadingRevealed = true;

  const { screen } = getElements();
  window.gameLoaded = true;
  if (readyCallback) { const cb = readyCallback; readyCallback = null; cb(); }
  if (!screen) return;
  requestAnimationFrame(() => {
    screen.classList.add("hidden");
    setTimeout(() => screen.classList.remove("active"), 500);
  });
}

const gameLoading = {
  init(world) {
    currentWorld = world || "nature";
    completedTasks.clear();
    readyCallback = null;
    loadingRevealed = false;
    window.gameLoaded = false;
    const ui = WORLD_UI[currentWorld] || WORLD_UI.nature;
    const t = document.getElementById("loadingTitle");
    const i = document.getElementById("loadingIcon");
    if (t) t.textContent = ui.title;
    if (i) i.textContent = ui.icon;
    updateUI(0);
  },

  activate() {
    const s = document.getElementById("loadingScreen");
    if (s) { s.classList.add("active"); s.classList.remove("hidden"); }
    updateUI(0);
  },

  setStatus(text) {
    const el = document.getElementById("loadingStatus");
    if (el) el.textContent = text;
  },

  setCharacterProgress(ratio) {
    const pct = Math.round(ratio * 33);
    updateUI(pct);
  },

  completeTask(task) {
    if (!REQUIRED_TASKS.includes(task)) return;
    completedTasks.add(task);
    updateBar();
  },

  onReady(callback) {
    if (completedTasks.size >= REQUIRED_TASKS.length) { callback(); return; }
    readyCallback = callback;
  },

  isReady() { return completedTasks.size >= REQUIRED_TASKS.length; },
  reset() {
    completedTasks.clear();
    readyCallback = null;
    loadingRevealed = false;
    window.gameLoaded = false;
  },
};

export { gameLoading };
window.gameLoading = gameLoading;
