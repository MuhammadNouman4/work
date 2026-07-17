import { firebaseConfig } from "./firebase-config.js";
import { seedProjects } from "./seed-data.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import {
  getFirestore, collection, getDocs, query, orderBy, doc, addDoc,
  updateDoc, deleteDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginView = document.getElementById("loginView");
const dashView = document.getElementById("dashView");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");
const projectForm = document.getElementById("projectForm");
const projectList = document.getElementById("projectList");
const formTitle = document.getElementById("formTitle");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const importBtn = document.getElementById("importBtn");
const statusMsg = document.getElementById("statusMsg");

let projects = [];
let editingId = null;

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    loginError.textContent = "Could not sign in. Check your email and password.";
  }
});

logoutBtn.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginView.style.display = "none";
    dashView.style.display = "block";
    loadProjects();
  } else {
    loginView.style.display = "block";
    dashView.style.display = "none";
  }
});

async function loadProjects(){
  const q = query(collection(db, "projects"), orderBy("order", "asc"));
  const snap = await getDocs(q);
  projects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  importBtn.style.display = projects.length ? "none" : "inline-flex";
  renderList();
}

function renderList(){
  if (!projects.length){
    projectList.innerHTML = `<p class="hint">No projects yet. Add one below, or import the starter set.</p>`;
    return;
  }
  projectList.innerHTML = projects.map((p, i) => `
    <div class="row" data-id="${p.id}">
      <img src="assets/img/portfolio/${p.image}" alt="" />
      <div class="row-info">
        <strong>${p.title}</strong>
        <span>${p.category || "—"} ${p.featured ? "&middot; Featured" : ""}</span>
      </div>
      <div class="row-actions">
        <button class="icon-btn" data-action="up" ${i === 0 ? "disabled" : ""} title="Move up">&uarr;</button>
        <button class="icon-btn" data-action="down" ${i === projects.length - 1 ? "disabled" : ""} title="Move down">&darr;</button>
        <button class="icon-btn" data-action="edit" title="Edit">Edit</button>
        <button class="icon-btn danger" data-action="delete" title="Delete">Delete</button>
      </div>
    </div>
  `).join("");

  projectList.querySelectorAll(".row").forEach(row => {
    const id = row.dataset.id;
    row.querySelector('[data-action="edit"]').addEventListener("click", () => startEdit(id));
    row.querySelector('[data-action="delete"]').addEventListener("click", () => deleteProject(id));
    row.querySelector('[data-action="up"]')?.addEventListener("click", () => move(id, -1));
    row.querySelector('[data-action="down"]')?.addEventListener("click", () => move(id, 1));
  });
}

function startEdit(id){
  const p = projects.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  formTitle.textContent = "Edit project";
  document.getElementById("title").value = p.title || "";
  document.getElementById("category").value = p.category || "";
  document.getElementById("description").value = p.description || "";
  document.getElementById("image").value = p.image || "";
  document.getElementById("link").value = p.link || "";
  document.getElementById("featured").checked = !!p.featured;
  cancelEditBtn.style.display = "inline-flex";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

cancelEditBtn.addEventListener("click", () => {
  editingId = null;
  projectForm.reset();
  formTitle.textContent = "Add a project";
  cancelEditBtn.style.display = "none";
});

async function deleteProject(id){
  if (!confirm("Delete this project? This can't be undone.")) return;
  await deleteDoc(doc(db, "projects", id));
  showStatus("Project deleted.");
  loadProjects();
}

async function move(id, dir){
  const idx = projects.findIndex(p => p.id === id);
  const swapIdx = idx + dir;
  if (swapIdx < 0 || swapIdx >= projects.length) return;
  const a = projects[idx], b = projects[swapIdx];
  const batch = writeBatch(db);
  batch.update(doc(db, "projects", a.id), { order: b.order });
  batch.update(doc(db, "projects", b.id), { order: a.order });
  await batch.commit();
  loadProjects();
}

projectForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    title: document.getElementById("title").value.trim(),
    category: document.getElementById("category").value.trim(),
    description: document.getElementById("description").value.trim(),
    image: document.getElementById("image").value.trim(),
    link: document.getElementById("link").value.trim(),
    featured: document.getElementById("featured").checked,
  };
  if (!data.title || !data.image){
    showStatus("Title and image filename are required.", true);
    return;
  }
  if (editingId){
    await updateDoc(doc(db, "projects", editingId), data);
    showStatus("Project updated.");
  } else {
    data.order = projects.length ? Math.max(...projects.map(p => p.order || 0)) + 1 : 0;
    await addDoc(collection(db, "projects"), data);
    showStatus("Project added.");
  }
  editingId = null;
  projectForm.reset();
  formTitle.textContent = "Add a project";
  cancelEditBtn.style.display = "none";
  loadProjects();
});

importBtn.addEventListener("click", async () => {
  if (!confirm(`Import ${seedProjects.length} starter projects from the original site?`)) return;
  const batch = writeBatch(db);
  seedProjects.forEach(p => {
    const ref = doc(collection(db, "projects"));
    batch.set(ref, p);
  });
  await batch.commit();
  showStatus("Starter projects imported.");
  loadProjects();
});

function showStatus(msg, isError){
  statusMsg.textContent = msg;
  statusMsg.style.color = isError ? "#a32d2d" : "#0f6e56";
  setTimeout(() => { statusMsg.textContent = ""; }, 3500);
}
