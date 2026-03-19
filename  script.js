const STORAGE_KEY = "sceneAppData";

const sceneForm = document.getElementById("sceneForm");
const sceneIdInput = document.getElementById("sceneId");
const projectNameInput = document.getElementById("projectName");
const sceneNumberInput = document.getElementById("sceneNumber");
const shootOrderInput = document.getElementById("shootOrder");
const sceneTitleInput = document.getElementById("sceneTitle");
const locationInput = document.getElementById("location");
const inOutInput = document.getElementById("inOut");
const dayNightInput = document.getElementById("dayNight");
const castInput = document.getElementById("cast");
const propsInput = document.getElementById("props");
const gearInput = document.getElementById("gear");
const memoInput = document.getElementById("memo");
const isShotInput = document.getElementById("isShot");

const sortModeInput = document.getElementById("sortMode");
const projectFilterInput = document.getElementById("projectFilter");
const searchInput = document.getElementById("searchInput");
const showUnshotOnlyInput = document.getElementById("showUnshotOnly");

const sceneList = document.getElementById("sceneList");
const emptyState = document.getElementById("emptyState");
const cancelEditBtn = document.getElementById("cancelEditBtn");

let scenes = loadScenes();

normalizeShootOrders();
updateProjectFilter();
renderScenes();

sceneForm.addEventListener("submit", handleSubmit);
sortModeInput.addEventListener("change", renderScenes);
projectFilterInput.addEventListener("change", renderScenes);
searchInput.addEventListener("input", renderScenes);
showUnshotOnlyInput.addEventListener("change", renderScenes);
cancelEditBtn.addEventListener("click", resetForm);

function loadScenes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("データ読み込み失敗", error);
    return [];
  }
}

function saveScenes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes));
}

function handleSubmit(event) {
  event.preventDefault();

  const id = sceneIdInput.value || crypto.randomUUID();

  const sceneData = {
    id,
    projectName: projectNameInput.value.trim(),
    sceneNumber: sceneNumberInput.value.trim(),
    shootOrder: Number(shootOrderInput.value),
    sceneTitle: sceneTitleInput.value.trim(),
    location: locationInput.value.trim(),
    inOut: inOutInput.value,
    dayNight: dayNightInput.value,
    cast: castInput.value.trim(),
    props: propsInput.value.trim(),
    gear: gearInput.value.trim(),
    memo: memoInput.value.trim(),
    isShot: isShotInput.checked,
    updatedAt: Date.now(),
  };

  if (!sceneData.projectName || !sceneData.sceneNumber || !sceneData.sceneTitle || !sceneData.shootOrder) {
    alert("プロジェクト名 シーン番号 撮影順 シーン名は必須です");
    return;
  }

  const existingIndex = scenes.findIndex((scene) => scene.id === id);

  if (existingIndex >= 0) {
    scenes[existingIndex] = sceneData;
  } else {
    scenes.push(sceneData);
  }

  normalizeShootOrders();
  saveScenes();
  updateProjectFilter();
  renderScenes();
  resetForm();
}

function updateProjectFilter() {
  const currentValue = projectFilterInput.value || "all";
  const projects = [...new Set(scenes.map((scene) => scene.projectName).filter(Boolean))];

  projectFilterInput.innerHTML =
    `<option value="all">すべてのプロジェクト</option>` +
    projects
      .map((projectName) => `<option value="${escapeHtml(projectName)}">${escapeHtml(projectName)}</option>`)
      .join("");

  const exists = projects.includes(currentValue);
  projectFilterInput.value = exists ? currentValue : "all";
}

function renderScenes() {
  const sortMode = sortModeInput.value;
  const selectedProject = projectFilterInput.value;
  const keyword = searchInput.value.trim().toLowerCase();
  const showUnshotOnly = showUnshotOnlyInput.checked;

  let filteredScenes = [...scenes];

  if (selectedProject !== "all") {
    filteredScenes = filteredScenes.filter((scene) => scene.projectName === selectedProject);
  }

  if (keyword) {
    filteredScenes = filteredScenes.filter((scene) =>
      (scene.projectName || "").toLowerCase().includes(keyword) ||
      (scene.sceneNumber || "").toLowerCase().includes(keyword) ||
      (scene.sceneTitle || "").toLowerCase().includes(keyword) ||
      (scene.location || "").toLowerCase().includes(keyword) ||
      (scene.inOut || "").toLowerCase().includes(keyword) ||
      (scene.dayNight || "").toLowerCase().includes(keyword) ||
      (scene.cast || "").toLowerCase().includes(keyword) ||
      (scene.props || "").toLowerCase().includes(keyword) ||
      (scene.gear || "").toLowerCase().includes(keyword) ||
      (scene.memo || "").toLowerCase().includes(keyword)
    );
  }

  if (showUnshotOnly) {
    filteredScenes = filteredScenes.filter((scene) => !scene.isShot);
  }

  filteredScenes.sort((a, b) => {
    if (sortMode === "sceneNumber") {
      return compareSceneNumber(a.sceneNumber, b.sceneNumber);
    }
    return a.shootOrder - b.shootOrder;
  });

  sceneList.innerHTML = "";

  if (filteredScenes.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  filteredScenes.forEach((scene, index) => {
    const canMoveUp = sortMode === "shootOrder" && index > 0;
    const canMoveDown = sortMode === "shootOrder" && index < filteredScenes.length - 1;

    const item = document.createElement("article");
    item.className = "scene-item";

    item.innerHTML = `
      <div class="scene-top">
        <div>
          <h3 class="scene-title">${escapeHtml(scene.sceneTitle)}</h3>
          <div class="scene-badges">
            <span class="badge">作品：${escapeHtml(scene.projectName || "-")}</span>
            <span class="badge">シーン：${escapeHtml(scene.sceneNumber || "-")}</span>
            <span class="badge">撮影順：${escapeHtml(String(scene.shootOrder || "-"))}</span>
            ${scene.inOut ? `<span class="badge">${escapeHtml(scene.inOut)}</span>` : ""}
            ${scene.dayNight ? `<span class="badge">${escapeHtml(scene.dayNight)}</span>` : ""}
            ${scene.isShot ? `<span class="badge done">撮影済み</span>` : ""}
          </div>
        </div>
      </div>

      <div class="scene-meta">
        <div class="meta-box">
          <div class="meta-label">場所</div>
          <div class="meta-value">${escapeHtml(scene.location || "-")}</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">出演者</div>
          <div class="meta-value">${escapeHtml(scene.cast || "-")}</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">小道具</div>
          <div class="meta-value">${escapeHtml(scene.props || "-")}</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">機材</div>
          <div class="meta-value">${escapeHtml(scene.gear || "-")}</div>
        </div>
        <div class="meta-box" style="grid-column: 1 / -1;">
          <div class="meta-label">メモ</div>
          <div class="meta-value">${escapeHtml(scene.memo || "-")}</div>
        </div>
      </div>

      <div class="scene-actions">
        ${
          canMoveUp
            ? `<button class="action-btn move-up-btn" data-id="${scene.id}">上へ</button>`
            : ""
        }
        ${
          canMoveDown
            ? `<button class="action-btn move-down-btn" data-id="${scene.id}">下へ</button>`
            : ""
        }
        <button class="action-btn edit-btn" data-id="${scene.id}">編集</button>
        <button class="action-btn delete-btn" data-id="${scene.id}">削除</button>
      </div>
    `;

    const moveUpBtn = item.querySelector(".move-up-btn");
    const moveDownBtn = item.querySelector(".move-down-btn");
    const editBtn = item.querySelector(".edit-btn");
    const deleteBtn = item.querySelector(".delete-btn");

    if (moveUpBtn) {
      moveUpBtn.addEventListener("click", () => moveScene(scene.id, "up", filteredScenes));
    }

    if (moveDownBtn) {
      moveDownBtn.addEventListener("click", () => moveScene(scene.id, "down", filteredScenes));
    }

    editBtn.addEventListener("click", () => startEdit(scene.id));
    deleteBtn.addEventListener("click", () => deleteScene(scene.id));

    sceneList.appendChild(item);
  });
}

function moveScene(id, direction, visibleScenes) {
  const currentIndex = visibleScenes.findIndex((scene) => scene.id === id);
  if (currentIndex < 0) return;

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= visibleScenes.length) return;

  const currentScene = visibleScenes[currentIndex];
  const targetScene = visibleScenes[targetIndex];

  const currentReal = scenes.find((scene) => scene.id === currentScene.id);
  const targetReal = scenes.find((scene) => scene.id === targetScene.id);

  if (!currentReal || !targetReal) return;

  const tempOrder = currentReal.shootOrder;
  currentReal.shootOrder = targetReal.shootOrder;
  targetReal.shootOrder = tempOrder;

  normalizeShootOrders();
  saveScenes();
  renderScenes();
}

function normalizeShootOrders() {
  scenes.sort((a, b) => a.shootOrder - b.shootOrder);

  scenes.forEach((scene, index) => {
    scene.shootOrder = index + 1;
  });
}

function startEdit(id) {
  const scene = scenes.find((item) => item.id === id);
  if (!scene) return;

  sceneIdInput.value = scene.id;
  projectNameInput.value = scene.projectName || "";
  sceneNumberInput.value = scene.sceneNumber || "";
  shootOrderInput.value = scene.shootOrder || "";
  sceneTitleInput.value = scene.sceneTitle || "";
  locationInput.value = scene.location || "";
  inOutInput.value = scene.inOut || "";
  dayNightInput.value = scene.dayNight || "";
  castInput.value = scene.cast || "";
  propsInput.value = scene.props || "";
  gearInput.value = scene.gear || "";
  memoInput.value = scene.memo || "";
  isShotInput.checked = !!scene.isShot;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteScene(id) {
  const ok = window.confirm("このシーンを削除しますか？");
  if (!ok) return;

  scenes = scenes.filter((scene) => scene.id !== id);
  normalizeShootOrders();
  saveScenes();
  updateProjectFilter();
  renderScenes();

  if (sceneIdInput.value === id) {
    resetForm();
  }
}

function resetForm() {
  sceneForm.reset();
  sceneIdInput.value = "";
}

function compareSceneNumber(a, b) {
  const aNum = Number(a);
  const bNum = Number(b);

  if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
    return aNum - bNum;
  }

  return String(a).localeCompare(String(b), "ja");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}