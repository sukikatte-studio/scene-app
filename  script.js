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
const priorityInput = document.getElementById("priority");
const statusInput = document.getElementById("status");
const castInput = document.getElementById("cast");
const propsInput = document.getElementById("props");
const gearInput = document.getElementById("gear");
const costumeInput = document.getElementById("costume");
const makeupInput = document.getElementById("makeup");
const emotionInput = document.getElementById("emotion");
const cameraSizeInput = document.getElementById("cameraSize");
const tempoInput = document.getElementById("tempo");
const durationMemoInput = document.getElementById("durationMemo");
const referenceWorksInput = document.getElementById("referenceWorks");
const directionMemoInput = document.getElementById("directionMemo");
const lightingMemoInput = document.getElementById("lightingMemo");
const cautionMemoInput = document.getElementById("cautionMemo");
const memoInput = document.getElementById("memo");
const isShotInput = document.getElementById("isShot");

const sortModeInput = document.getElementById("sortMode");
const projectFilterInput = document.getElementById("projectFilter");
const searchInput = document.getElementById("searchInput");
const priorityFilterInput = document.getElementById("priorityFilter");
const statusFilterInput = document.getElementById("statusFilter");
const showUnshotOnlyInput = document.getElementById("showUnshotOnly");

const sceneList = document.getElementById("sceneList");
const emptyState = document.getElementById("emptyState");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const toggleFormBtn = document.getElementById("toggleFormBtn");
const closeFormBtn = document.getElementById("closeFormBtn");
const formContainer = document.getElementById("formContainer");
const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");
const submitBtn = document.getElementById("submitBtn");

let scenes = loadScenes();
let openSceneIds = new Set();
let isFormOpen = false;
let isEditMode = false;

migrateScenes();
normalizeShootOrders();
updateProjectFilter();
updateFormVisibility();
updateFormModeUI();
renderScenes();

sceneForm.addEventListener("submit", handleSubmit);
sortModeInput.addEventListener("change", renderScenes);
projectFilterInput.addEventListener("change", renderScenes);
searchInput.addEventListener("input", renderScenes);
priorityFilterInput.addEventListener("change", renderScenes);
statusFilterInput.addEventListener("change", renderScenes);
showUnshotOnlyInput.addEventListener("change", renderScenes);
cancelEditBtn.addEventListener("click", handleCancelEdit);
toggleFormBtn.addEventListener("click", toggleForm);
closeFormBtn.addEventListener("click", closeForm);
statusInput.addEventListener("change", syncShotCheckboxFromStatus);
isShotInput.addEventListener("change", syncStatusFromShotCheckbox);

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

function migrateScenes() {
  scenes = scenes.map((scene) => {
    const migrated = { ...scene };

    if (!migrated.priority) {
      migrated.priority = "中";
    }

    if (!migrated.status) {
      migrated.status = migrated.isShot ? "撮影済み" : "未着手";
    }

    if (migrated.status === "撮影済み") {
      migrated.isShot = true;
    } else if (typeof migrated.isShot !== "boolean") {
      migrated.isShot = false;
    }

    migrated.costume = migrated.costume || "";
    migrated.makeup = migrated.makeup || "";
    migrated.emotion = migrated.emotion || "";
    migrated.cameraSize = migrated.cameraSize || "";
    migrated.tempo = migrated.tempo || "";
    migrated.durationMemo = migrated.durationMemo || "";
    migrated.referenceWorks = migrated.referenceWorks || "";
    migrated.directionMemo = migrated.directionMemo || "";
    migrated.lightingMemo = migrated.lightingMemo || "";
    migrated.cautionMemo = migrated.cautionMemo || "";

    return migrated;
  });

  saveScenes();
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
    priority: priorityInput.value,
    status: statusInput.value,
    cast: castInput.value.trim(),
    props: propsInput.value.trim(),
    gear: gearInput.value.trim(),
    costume: costumeInput.value.trim(),
    makeup: makeupInput.value.trim(),
    emotion: emotionInput.value.trim(),
    cameraSize: cameraSizeInput.value.trim(),
    tempo: tempoInput.value.trim(),
    durationMemo: durationMemoInput.value.trim(),
    referenceWorks: referenceWorksInput.value.trim(),
    directionMemo: directionMemoInput.value.trim(),
    lightingMemo: lightingMemoInput.value.trim(),
    cautionMemo: cautionMemoInput.value.trim(),
    memo: memoInput.value.trim(),
    isShot: statusInput.value === "撮影済み" || isShotInput.checked,
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
  closeForm();
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
  const selectedPriority = priorityFilterInput.value;
  const selectedStatus = statusFilterInput.value;
  const showUnshotOnly = showUnshotOnlyInput.checked;

  let filteredScenes = [...scenes];

  if (selectedProject !== "all") {
    filteredScenes = filteredScenes.filter((scene) => scene.projectName === selectedProject);
  }

  if (selectedPriority !== "all") {
    filteredScenes = filteredScenes.filter((scene) => scene.priority === selectedPriority);
  }

  if (selectedStatus !== "all") {
    filteredScenes = filteredScenes.filter((scene) => scene.status === selectedStatus);
  }

  if (keyword) {
    filteredScenes = filteredScenes.filter((scene) =>
      [
        scene.projectName,
        scene.sceneNumber,
        scene.sceneTitle,
        scene.location,
        scene.inOut,
        scene.dayNight,
        scene.priority,
        scene.status,
        scene.cast,
        scene.props,
        scene.gear,
        scene.costume,
        scene.makeup,
        scene.emotion,
        scene.cameraSize,
        scene.tempo,
        scene.durationMemo,
        scene.referenceWorks,
        scene.directionMemo,
        scene.lightingMemo,
        scene.cautionMemo,
        scene.memo,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }

  if (showUnshotOnly) {
    filteredScenes = filteredScenes.filter((scene) => scene.status !== "撮影済み");
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
    const isOpen = openSceneIds.has(scene.id);

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
            ${scene.dayNight ? `<span class="badge">${escapeHtml(scene.dayNight)}</span>` : ""}
            ${scene.inOut ? `<span class="badge">${escapeHtml(scene.inOut)}</span>` : ""}
            <span class="badge ${priorityClass(scene.priority)}">優先度：${escapeHtml(scene.priority || "-")}</span>
            <span class="badge ${statusClass(scene.status)}">${escapeHtml(scene.status || "-")}</span>
            ${scene.isShot ? `<span class="badge done">撮影済みチェック</span>` : ""}
          </div>
        </div>
      </div>

      <div class="scene-summary">
        <div class="summary-line">
          <div class="summary-label">場所</div>
          <div class="summary-value">${escapeHtml(scene.location || "-")}</div>
        </div>
        <div class="summary-line">
          <div class="summary-label">出演者</div>
          <div class="summary-value">${escapeHtml(shortText(scene.cast, 50) || "-")}</div>
        </div>
      </div>

      ${
        isOpen
          ? `
          <div class="scene-meta">
            <div class="meta-box">
              <div class="meta-label">場所</div>
              <div class="meta-value">${escapeHtml(scene.location || "-")}</div>
            </div>
            <div class="meta-box">
              <div class="meta-label">内 / 外</div>
              <div class="meta-value">${escapeHtml(scene.inOut || "-")}</div>
            </div>
            <div class="meta-box">
              <div class="meta-label">昼 / 夜</div>
              <div class="meta-value">${escapeHtml(scene.dayNight || "-")}</div>
            </div>
            <div class="meta-box">
              <div class="meta-label">優先度</div>
              <div class="meta-value">${escapeHtml(scene.priority || "-")}</div>
            </div>
            <div class="meta-box">
              <div class="meta-label">ステータス</div>
              <div class="meta-value">${escapeHtml(scene.status || "-")}</div>
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
            <div class="meta-box">
              <div class="meta-label">衣装</div>
              <div class="meta-value">${escapeHtml(scene.costume || "-")}</div>
            </div>
            <div class="meta-box">
              <div class="meta-label">メイク</div>
              <div class="meta-value">${escapeHtml(scene.makeup || "-")}</div>
            </div>
            <div class="meta-box">
              <div class="meta-label">感情</div>
              <div class="meta-value">${escapeHtml(scene.emotion || "-")}</div>
            </div>
            <div class="meta-box">
              <div class="meta-label">カメラサイズ</div>
              <div class="meta-value">${escapeHtml(scene.cameraSize || "-")}</div>
            </div>
            <div class="meta-box">
              <div class="meta-label">テンポ</div>
              <div class="meta-value">${escapeHtml(scene.tempo || "-")}</div>
            </div>
            <div class="meta-box">
              <div class="meta-label">尺メモ</div>
              <div class="meta-value">${escapeHtml(scene.durationMemo || "-")}</div>
            </div>
            <div class="meta-box full-width">
              <div class="meta-label">参考作品</div>
              <div class="meta-value">${escapeHtml(scene.referenceWorks || "-")}</div>
            </div>
            <div class="meta-box full-width">
              <div class="meta-label">演出メモ</div>
              <div class="meta-value">${escapeHtml(scene.directionMemo || "-")}</div>
            </div>
            <div class="meta-box full-width">
              <div class="meta-label">照明メモ</div>
              <div class="meta-value">${escapeHtml(scene.lightingMemo || "-")}</div>
            </div>
            <div class="meta-box full-width">
              <div class="meta-label">注意点</div>
              <div class="meta-value">${escapeHtml(scene.cautionMemo || "-")}</div>
            </div>
            <div class="meta-box full-width">
              <div class="meta-label">メモ</div>
              <div class="meta-value">${escapeHtml(scene.memo || "-")}</div>
            </div>
          </div>
          `
          : ""
      }

      <div class="scene-actions">
        <button class="action-btn detail-btn" data-id="${scene.id}">
          ${isOpen ? "閉じる" : "詳細を見る"}
        </button>

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

        <button class="action-btn copy-btn" data-id="${scene.id}">複製</button>
        <button class="action-btn edit-btn" data-id="${scene.id}">編集</button>
        <button class="action-btn delete-btn" data-id="${scene.id}">削除</button>
      </div>
    `;

    const detailBtn = item.querySelector(".detail-btn");
    const moveUpBtn = item.querySelector(".move-up-btn");
    const moveDownBtn = item.querySelector(".move-down-btn");
    const copyBtn = item.querySelector(".copy-btn");
    const editBtn = item.querySelector(".edit-btn");
    const deleteBtn = item.querySelector(".delete-btn");

    detailBtn.addEventListener("click", () => toggleDetail(scene.id));

    if (moveUpBtn) {
      moveUpBtn.addEventListener("click", () => moveScene(scene.id, "up", filteredScenes));
    }

    if (moveDownBtn) {
      moveDownBtn.addEventListener("click", () => moveScene(scene.id, "down", filteredScenes));
    }

    copyBtn.addEventListener("click", () => duplicateScene(scene.id));
    editBtn.addEventListener("click", () => startEdit(scene.id));
    deleteBtn.addEventListener("click", () => deleteScene(scene.id));

    sceneList.appendChild(item);
  });
}

function toggleDetail(id) {
  if (openSceneIds.has(id)) {
    openSceneIds.delete(id);
  } else {
    openSceneIds.add(id);
  }
  renderScenes();
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

function duplicateScene(id) {
  const scene = scenes.find((item) => item.id === id);
  if (!scene) return;

  const maxShootOrder = Math.max(0, ...scenes.map((item) => Number(item.shootOrder) || 0));
  const copy = {
    ...scene,
    id: crypto.randomUUID(),
    sceneTitle: `${scene.sceneTitle} コピー`,
    shootOrder: maxShootOrder + 1,
    status: "未着手",
    isShot: false,
    updatedAt: Date.now(),
  };

  scenes.push(copy);
  normalizeShootOrders();
  saveScenes();
  updateProjectFilter();
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

  isEditMode = true;
  openForm();

  sceneIdInput.value = scene.id;
  projectNameInput.value = scene.projectName || "";
  sceneNumberInput.value = scene.sceneNumber || "";
  shootOrderInput.value = scene.shootOrder || "";
  sceneTitleInput.value = scene.sceneTitle || "";
  locationInput.value = scene.location || "";
  inOutInput.value = scene.inOut || "";
  dayNightInput.value = scene.dayNight || "";
  priorityInput.value = scene.priority || "中";
  statusInput.value = scene.status || "未着手";
  castInput.value = scene.cast || "";
  propsInput.value = scene.props || "";
  gearInput.value = scene.gear || "";
  costumeInput.value = scene.costume || "";
  makeupInput.value = scene.makeup || "";
  emotionInput.value = scene.emotion || "";
  cameraSizeInput.value = scene.cameraSize || "";
  tempoInput.value = scene.tempo || "";
  durationMemoInput.value = scene.durationMemo || "";
  referenceWorksInput.value = scene.referenceWorks || "";
  directionMemoInput.value = scene.directionMemo || "";
  lightingMemoInput.value = scene.lightingMemo || "";
  cautionMemoInput.value = scene.cautionMemo || "";
  memoInput.value = scene.memo || "";
  isShotInput.checked = !!scene.isShot;

  updateFormModeUI();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteScene(id) {
  const ok = window.confirm("このシーンを削除しますか？");
  if (!ok) return;

  scenes = scenes.filter((scene) => scene.id !== id);
  openSceneIds.delete(id);

  normalizeShootOrders();
  saveScenes();
  updateProjectFilter();
  renderScenes();

  if (sceneIdInput.value === id) {
    resetForm();
    closeForm();
  }
}

function handleCancelEdit() {
  resetForm();
  closeForm();
}

function resetForm() {
  sceneForm.reset();
  sceneIdInput.value = "";
  priorityInput.value = "中";
  statusInput.value = "未着手";
  isShotInput.checked = false;
  isEditMode = false;
  updateFormModeUI();
}

function toggleForm() {
  if (isFormOpen) {
    closeForm();
  } else {
    isEditMode = false;
    updateFormModeUI();
    openForm();
  }
}

function openForm() {
  isFormOpen = true;
  formContainer.classList.remove("hidden");
  updateFormModeUI();
}

function closeForm() {
  isFormOpen = false;
  formContainer.classList.add("hidden");
  isEditMode = false;
  updateFormModeUI();
}

function updateFormVisibility() {
  if (isFormOpen) {
    formContainer.classList.remove("hidden");
  } else {
    formContainer.classList.add("hidden");
  }
}

function updateFormModeUI() {
  if (isEditMode) {
    formTitle.textContent = "シーン編集中";
    formSubtitle.textContent = "既存のシーン内容を修正しています";
    submitBtn.textContent = "更新する";
    toggleFormBtn.textContent = "編集中...";
  } else {
    formTitle.textContent = "シーン入力";
    formSubtitle.textContent = "追加や編集が必要な時だけ開いて使います";
    submitBtn.textContent = "保存する";
    toggleFormBtn.textContent = isFormOpen ? "フォームを開いています" : "＋ シーンを追加";
  }
}

function syncShotCheckboxFromStatus() {
  isShotInput.checked = statusInput.value === "撮影済み";
}

function syncStatusFromShotCheckbox() {
  if (isShotInput.checked) {
    statusInput.value = "撮影済み";
  } else if (statusInput.value === "撮影済み") {
    statusInput.value = "未着手";
  }
}

function compareSceneNumber(a, b) {
  const aNum = Number(a);
  const bNum = Number(b);

  if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
    return aNum - bNum;
  }

  return String(a).localeCompare(String(b), "ja");
}

function priorityClass(priority) {
  if (priority === "高") return "priority-high";
  if (priority === "中") return "priority-mid";
  if (priority === "低") return "priority-low";
  return "";
}

function statusClass(status) {
  if (status === "準備中") return "status-prep";
  if (status === "撮影済み") return "done";
  return "";
}

function shortText(text, maxLength) {
  const value = String(text || "");
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength) + "…";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}