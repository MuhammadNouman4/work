import { firebaseConfig } from "./firebase-config.js";
import { seedProjects } from "./seed-data.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const grid = document.getElementById("reelGrid");
const filtersEl = document.getElementById("filters");
const modal = document.getElementById("projectModal");
const modalBody = document.getElementById("modalBody");
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

let projects = [];
let activeCategory = "All";

function pad(n){ return String(n).padStart(2, "0"); }
function timecode(i){
  const total = i;
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `00:${pad(min)}:${pad(sec)}`;
}

function renderFilters(){
  const cats = ["All", ...new Set(projects.map(p => p.category).filter(Boolean))];
  filtersEl.innerHTML = cats.map(c =>
    `<button class="filter-btn${c === activeCategory ? " active" : ""}" data-cat="${c}">${c}</button>`
  ).join("");
  filtersEl.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      renderFilters();
      renderGrid();
    });
  });
}

function renderGrid(){
  const list = activeCategory === "All" ? projects : projects.filter(p => p.category === activeCategory);
  if (!list.length){
    grid.innerHTML = `<div class="empty-state">No projects in this category yet.</div>`;
    return;
  }
  grid.innerHTML = list.map((p, i) => `
    <div class="card reveal" data-index="${projects.indexOf(p)}">
      <div class="card-media">
        <span class="card-tc">${timecode(i + 1)}</span>
        <img src="assets/img/portfolio/${p.image}" alt="${p.title}" loading="lazy" />
      </div>
      <div class="card-body">
        <div class="card-cat">${p.category || "Project"}</div>
        <h3 class="card-title">${p.title}</h3>
      </div>
    </div>
  `).join("");
  grid.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => openModal(projects[card.dataset.index]));
  });
  observeReveals();
}

function openModal(p){
  modalBody.innerHTML = `
    <img class="modal-img" src="assets/img/portfolio/${p.image}" alt="${p.title}" />
    <div class="modal-content">
      <div class="card-cat">${p.category || "Project"}</div>
      <h3>${p.title}</h3>
      <p>${p.description || ""}</p>
      ${p.link ? `<a class="btn btn-primary modal-link" href="${p.link}" target="_blank" rel="noopener">View project</a>` : ""}
    </div>
  `;
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeModal(){
  modal.classList.remove("open");
  document.body.style.overflow = "";
}
modal?.addEventListener("click", e => { if (e.target === modal) closeModal(); });
document.getElementById("modalCloseBtn")?.addEventListener("click", closeModal);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

async function loadProjects(){
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const q = query(collection(db, "projects"), orderBy("order", "asc"));
    const snap = await getDocs(q);
    if (!snap.empty){
      projects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return;
    }
  } catch (err) {
    console.warn("Firestore not reachable yet, showing local data.", err);
  }
  projects = seedProjects;
}

loadProjects().then(() => {
  renderFilters();
  renderGrid();
});

// Mobile nav toggle
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
navToggle?.addEventListener("click", () => {
  navLinks.style.display = navLinks.style.display === "flex" ? "none" : "flex";
});

// Scroll reveal
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function observeReveals(){
  const targets = document.querySelectorAll(".reveal:not(.in-view)");
  if (!targets.length) return;
  if (prefersReducedMotion){
    targets.forEach(t => t.classList.add("in-view"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting){
        entry.target.style.transitionDelay = `${(i % 6) * 60}ms`;
        entry.target.classList.add("in-view");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  targets.forEach(t => io.observe(t));
}
observeReveals();
