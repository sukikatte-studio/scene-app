const STORAGE_KEY = "scene_app_black_stable_v1";

function $(id) {
  return document.getElementById(id);
}

const els = {
  form: $("sceneForm"),
  formTitle: $("formTitle"),
  submitBtn: $("submitBtn"),
  cancelEditBtn: $("cancelEditBtn"),

  sceneId: $("sceneId"),
  projectName: $("projectName"),
  sceneNumber: $("sceneNumber"),
  shootOrder: $("shootOrder"),
  sceneTitle: $("sceneTitle"),
  location: $("location"),
  memo: $("memo"),

  searchInput: $("searchInput"),
  sortMode: $("sortMode"),

  emptyState: $("emptyState"),
  sceneList: $("sceneList")
};

let scenes = loadScenes();
let isEditMode = false;

init();

function init() {
  scenes = Array.isArray(scenes) ? scenes.map(normalizeScene) : [];
  saveScenes();
  renderScenes();

  els.form.addEventListener("submit", handleSubmit);
  els.cancelEditBtn.addEventListener("click", handleCancelEdit);
  els.searchInput.addEventListener("input", renderScenes);
  els.sortMode.addEventListener("change", renderScenes);
}

function createId() {
  return "scene-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
}

function normalizeScene(scene) {
  return {
    id: scene.id || createId(),
    projectName: String(scene.projectName || ""),
    sceneNumber: String(scene.sceneNumber || ""),
    shootOrder: Number(scene.shootOrder || 0),
    sceneTitle: String(scene.sceneTitle || ""),
    location: String(scene.location || ""),
    memo: String(scene.memo || "")
  };
}

function loadScenes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("loadScenes error:", error);
    return [];
  }
}

function saveScenes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes));
}

function getFormData() {
  return normalizeScene({
    id: els.sceneId.value || createId(),
    projectName: els.projectName.value.trim(),
    sceneNumber: els.sceneNumber.value.trim(),
    shootOrder: Number(els.shootOrder.value),
    sceneTitle: els.sceneTitle.value.trim(),
    location: els.location.value.trim(),
    memo: els.memo.value.trim()
  });
}

function handleSubmit(event) {
  event.preventDefault();

  const newScene = getFormData();

  if (!newScene.projectName || !newScene.sceneNumber || !newScene.shootOrder || !newScene.sceneTitle) {
    alert("プロジェクト名・シーン番号・撮影順・シーン名を入れてください");
    return;
  }

  const existingIndex = scenes.findIndex((item) => item.id === newScene.id);

  if (existingIndex >= 0) {
    scenes[existingIndex] = newScene;
  } else {
    scenes.push(newScene);
  }

  scenes.sort((a, b) => Number(a.shootOrder) - Number(b.shootOrder));
  saveScenes();
  renderScenes();
  resetForm();
}

function handleCancelEdit() {
  resetForm();
}

function resetForm() {
  els.form.reset();
  els.sceneId.value = "";
  isEditMode = false;
  els.formTitle.textContent = "シーン入力";
  els.submitBtn.textContent = "保存する";
}

function startEdit(id) {
  const scene = scenes.find((item) => item.id === id);
  if (!scene) return;

  els.sceneId.value = scene.id;
  els.projectName.value = scene.projectName;
  els.sceneNumber.value = scene.sceneNumber;
  els.shootOrder.value = String(scene.shootOrder);
  els.sceneTitle.value = scene.sceneTitle;
  els.location.value = scene.location;
  els.memo.value = scene.memo;

  isEditMode = true;
  els.formTitle.textContent = "シーン編集中";
  els.submitBtn.textContent = "更新する";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteScene(id) {
  const scene = scenes.find((item) => item.id === id);
  if (!scene) return;

  const ok = window.confirm("このシーンを削除しますか？\n\n" + scene.sceneTitle);
  if (!ok) return;

  scenes = scenes.filter((item) => item.id !== id);
  saveScenes();
  renderScenes();

  if (els.sceneId.value === id) {
    resetForm();
  }
}

function renderScenes() {
  els.sceneList.innerHTML = "";

  let filteredScenes = [...scenes];
  const keyword = els.searchInput.value.trim().toLowerCase();
  const currentSort = els.sortMode.value;

  if (keyword) {
    filteredScenes = filteredScenes.filter((scene) => {
      const text = [
        scene.projectName,
        scene.sceneNumber,
        scene.sceneTitle,
        scene.location,
        scene.memo
      ].join(" ").toLowerCase();

      return text.includes(keyword);
    });
  }

  filteredScenes.sort((a, b) => {
    if (currentSort === "sceneNumber") {
      const aNum = Number(a.sceneNumber);
      const bNum = Number(b.sceneNumber);

      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
        return aNum - bNum;
      }

      return String(a.sceneNumber).localeCompare(String(b.sceneNumber), "ja");
    }

    if (currentSort === "sceneTitle") {
      return String(a.sceneTitle).localeCompare(String(b.sceneTitle), "ja");
    }

    return Number(a.shootOrder) - Number(b.shootOrder);
  });

  if (filteredScenes.length === 0) {
    els.emptyState.style.display = "block";
    return;
  }

  els.emptyState.style.display = "none";

  filteredScenes.forEach((scene) => {
    const item = document.createElement("article");
    item.className = "scene-item";

    item.innerHTML = `
      <h3 class="scene-title">${escapeHtml(scene.sceneTitle)}</h3>

      <div class="scene-meta">
        <div class="meta-box">
          <div class="meta-label">プロジェクト</div>
          <div class="meta-value">${escapeHtml(scene.projectName)}</div>
        </div>

        <div class="meta-box">
          <div class="meta-label">シーン番号</div>
          <div class="meta-value">${escapeHtml(scene.sceneNumber)}</div>
        </div>

        <div class="meta-box">
          <div class="meta-label">撮影順</div>
          <div class="meta-value">${escapeHtml(String(scene.shootOrder))}</div>
        </div>

        <div class="meta-box">
          <div class="meta-label">場所</div>
          <div class="meta-value">${escapeHtml(scene.location || "-")}</div>
        </div>

        <div class="meta-box">
          <div class="meta-label">メモ</div>
          <div class="meta-value">${escapeHtml(scene.memo || "-")}</div>
        </div>
      </div>

      <div class="scene-actions">
        <button type="button" class="edit-btn edit-btn-js">編集</button>
        <button type="button" class="danger-btn delete-btn-js">削除</button>
      </div>
    `;

    item.querySelector(".edit-btn-js").addEventListener("click", () => {
      startEdit(scene.id);
    });

    item.querySelector(".delete-btn-js").addEventListener("click", () => {
      deleteScene(scene.id);
    });

    els.sceneList.appendChild(item);
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}