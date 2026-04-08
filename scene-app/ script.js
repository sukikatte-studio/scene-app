function $(id){
  return document.getElementById(id);
}

window.addEventListener("DOMContentLoaded", () => {
  const prepBtn = $("prepBtn");
  const fieldBtn = $("fieldBtn");
  const modeLabel = $("modeLabel");
  const saveProjectBtn = $("saveProjectBtn");
  const projectTitle = $("projectTitle");
  const projectList = $("projectList");

  let projects = [];

  prepBtn.addEventListener("click", () => {
    modeLabel.textContent = "準備モード";
  });

  fieldBtn.addEventListener("click", () => {
    modeLabel.textContent = "現場モード";
  });

  saveProjectBtn.addEventListener("click", () => {
    const title = projectTitle.value.trim();

    if(!title){
      alert("プロジェクト名を入れてください");
      return;
    }

    projects.push(title);
    projectTitle.value = "";

    projectList.innerHTML = projects
      .map((name, index) => `<div>${index + 1}. ${name}</div>`)
      .join("");
  });
});