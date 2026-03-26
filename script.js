const POSTS_URL = "posts.json";

const CATEGORY_ORDER = ["MUSIC", "ART", "GRAFFITI", "FILM", "SKATE", "EVENTS", "SNEAKERS"];

async function getPosts() {
  const res = await fetch(POSTS_URL);
  if (!res.ok) throw new Error("posts.json could not be loaded.");
  const posts = await res.json();
  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

function categoryText(categories = []) {
  return categories.join(" / ");
}

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getPrimaryCategory(post) {
  return (post.categories && post.categories[0]) ? post.categories[0] : "MUSIC";
}

function getCategoryClass(category = "") {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function getVisualCategoryClass(category = "") {
  const map = {
    MUSIC: "visual-music",
    ART: "visual-art",
    GRAFFITI: "visual-graffiti",
    FILM: "visual-film",
    SKATE: "visual-skate",
    EVENTS: "visual-events",
    SNEAKERS: "visual-sneakers"
  };
  return map[category] || "visual-music";
}

function createVisual(category, label) {
  const safeLabel = escapeHtml(label || category);
  const visualClass = getVisualCategoryClass(category);

  return `
    <div class="card-visual visual-corner">
      <div class="visual-inner ${visualClass}"></div>
      <div class="visual-frame"></div>
      <div class="visual-label">${safeLabel}</div>
    </div>
  `;
}

function createFeaturedVisual(category, label) {
  const safeLabel = escapeHtml(label || category);
  const visualClass = getVisualCategoryClass(category);

  return `
    <div class="featured-visual visual-corner">
      <div class="visual-inner ${visualClass}"></div>
      <div class="visual-frame"></div>
      <div class="visual-label">${safeLabel}</div>
    </div>
  `;
}

function createCard(post) {
  const primaryCategory = getPrimaryCategory(post);
  const categoryClass = getCategoryClass(primaryCategory);

  return `
    <a class="post-card ${categoryClass} reveal" href="article.html?id=${encodeURIComponent(post.id)}">
      ${createVisual(primaryCategory, primaryCategory)}
      <div class="card-main">
        <div>
          <div class="card-meta">${escapeHtml(categoryText(post.categories))}</div>
          <h3 class="card-title">${escapeHtml(post.title)}</h3>
          <p class="card-intro">${escapeHtml(post.intro)}</p>
        </div>
        <div class="card-bottom">
          <span>${formatDate(post.date)}</span>
          <span>${post.sources.length} SOURCES</span>
        </div>
      </div>
    </a>
  `;
}

function createFeatured(post) {
  const primaryCategory = getPrimaryCategory(post);

  return `
    <a class="featured-card reveal" href="article.html?id=${encodeURIComponent(post.id)}">
      <div class="featured-left">
        <div>
          <div class="featured-meta">FEATURED / ${escapeHtml(categoryText(post.categories))}</div>
          <h2 class="featured-title">${escapeHtml(post.title)}</h2>
        </div>
        ${createFeaturedVisual(primaryCategory, primaryCategory)}
      </div>
      <div class="featured-right">
        <p class="featured-intro">${escapeHtml(post.intro)}</p>
        <div class="card-bottom">
          <span>${formatDate(post.date)}</span>
          <span>${post.sources.length} SOURCES</span>
        </div>
      </div>
    </a>
  `;
}

function renderHeroCategories(posts) {
  const el = document.getElementById("hero-categories");
  if (!el) return;

  const existing = new Set(posts.flatMap((post) => post.categories || []));
  const ordered = CATEGORY_ORDER.filter((cat) => existing.has(cat));

  el.innerHTML = ordered
    .map((cat) => {
      const slug = getCategoryClass(cat);
      return `
        <a class="category-chip ${slug} reveal" href="archive.html?category=${encodeURIComponent(cat)}">
          <span>${escapeHtml(cat)}</span>
        </a>
      `;
    })
    .join("");
}

function applyReveal() {
  const targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach((target) => observer.observe(target));
}

function createBackToTop() {
  if (document.querySelector(".back-to-top")) return;

  const btn = document.createElement("button");
  btn.className = "back-to-top";
  btn.setAttribute("aria-label", "Back to top");
  btn.innerHTML = "↑";
  document.body.appendChild(btn);

  window.addEventListener("scroll", () => {
    if (window.scrollY > 500) {
      btn.classList.add("show");
    } else {
      btn.classList.remove("show");
    }
  });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function createProgressBar() {
  if (document.querySelector(".progress-bar")) return;

  const bar = document.createElement("div");
  bar.className = "progress-bar";
  document.body.appendChild(bar);

  const updateBar = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${progress}%`;
  };

  window.addEventListener("scroll", updateBar);
  window.addEventListener("resize", updateBar);
  updateBar();
}

function setupArchiveViewToggle(gridEl) {
  const controls = document.querySelector(".archive-controls");
  if (!controls || !gridEl || document.querySelector(".archive-toolbar")) return;

  const toolbar = document.createElement("div");
  toolbar.className = "archive-toolbar";

  const label = document.createElement("div");
  label.className = "card-meta";
  label.textContent = "VIEW MODE";

  const switchWrap = document.createElement("div");
  switchWrap.className = "view-switch";

  const savedView = localStorage.getItem("worlddig-view") || "grid";

  switchWrap.innerHTML = `
    <button class="view-btn ${savedView === "grid" ? "active" : ""}" data-view="grid">Grid</button>
    <button class="view-btn ${savedView === "list" ? "active" : ""}" data-view="list">List</button>
  `;

  toolbar.appendChild(label);
  toolbar.appendChild(switchWrap);
  controls.appendChild(toolbar);

  const applyView = (mode) => {
    gridEl.classList.toggle("list-view", mode === "list");
    switchWrap.querySelectorAll(".view-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === mode);
    });
    localStorage.setItem("worlddig-view", mode);
  };

  switchWrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".view-btn");
    if (!btn) return;
    applyView(btn.dataset.view);
  });

  applyView(savedView);
}

function renderHome(posts) {
  const featuredEl = document.getElementById("featured-post");
  const gridEl = document.getElementById("post-grid");
  if (!featuredEl || !gridEl) return;

  renderHeroCategories(posts);

  if (!posts.length) {
    featuredEl.innerHTML = "";
    gridEl.innerHTML = `<div class="empty-state reveal">No posts yet.</div>`;
    applyReveal();
    return;
  }

  const [first, ...rest] = posts;
  featuredEl.innerHTML = createFeatured(first);
  gridEl.innerHTML = rest.length
    ? rest.map(createCard).join("")
    : `<div class="empty-state reveal">More posts coming soon.</div>`;

  applyReveal();
}

function renderArchive(posts) {
  const gridEl = document.getElementById("archive-grid");
  const searchEl = document.getElementById("search-input");
  const filtersEl = document.getElementById("category-filters");
  if (!gridEl || !searchEl || !filtersEl) return;

  const params = new URLSearchParams(window.location.search);
  const initialCategory = params.get("category");

  const categories = ["ALL", ...new Set(posts.flatMap((post) => post.categories))];
  let activeCategory = categories.includes(initialCategory) ? initialCategory : "ALL";
  let searchValue = "";

  filtersEl.innerHTML = categories
    .map(
      (cat) => `
        <button class="filter-btn ${cat === activeCategory ? "active" : ""}" data-category="${escapeHtml(cat)}">
          ${escapeHtml(cat)}
        </button>
      `
    )
    .join("");

  setupArchiveViewToggle(gridEl);

  function draw() {
    const filtered = posts.filter((post) => {
      const matchesCategory =
        activeCategory === "ALL" || post.categories.includes(activeCategory);

      const haystack = [
        post.title,
        post.intro,
        ...(post.body || []),
        ...(post.categories || [])
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = haystack.includes(searchValue.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    gridEl.innerHTML = filtered.length
      ? filtered.map(createCard).join("")
      : `<div class="empty-state reveal">No posts found.</div>`;

    applyReveal();
  }

  filtersEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;

    activeCategory = btn.dataset.category;

    [...filtersEl.querySelectorAll(".filter-btn")].forEach((b) => {
      b.classList.toggle("active", b.dataset.category === activeCategory);
    });

    const url = new URL(window.location.href);
    if (activeCategory === "ALL") {
      url.searchParams.delete("category");
    } else {
      url.searchParams.set("category", activeCategory);
    }
    window.history.replaceState({}, "", url);

    draw();
  });

  searchEl.addEventListener("input", (e) => {
    searchValue = e.target.value.trim();
    draw();
  });

  draw();
}

function renderArticle(posts) {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const dateEl = document.getElementById("article-date");
  const titleEl = document.getElementById("article-title");
  const categoriesEl = document.getElementById("article-categories");
  const introEl = document.getElementById("article-intro");
  const bodyEl = document.getElementById("article-body");
  const sourcesEl = document.getElementById("article-sources");

  if (!dateEl || !titleEl || !categoriesEl || !introEl || !bodyEl || !sourcesEl) return;

  if (!id) {
    titleEl.textContent = "Article not found";
    introEl.textContent = "No article ID was provided.";
    return;
  }

  const post = posts.find((item) => item.id === id);

  if (!post) {
    titleEl.textContent = "Article not found";
    introEl.textContent = "The requested article does not exist.";
    return;
  }

  document.title = `${post.title} | WORLD DIG`;
  dateEl.textContent = formatDate(post.date);
  titleEl.textContent = post.title;
  categoriesEl.textContent = categoryText(post.categories);
  introEl.textContent = post.intro;

  bodyEl.classList.add("reveal");
  bodyEl.innerHTML = (post.body || [])
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");

  sourcesEl.innerHTML = (post.sources || [])
    .map(
      (source) => `
        <li class="reveal">
          <a href="${source.url}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(source.name)}
          </a>
        </li>
      `
    )
    .join("");

  applyReveal();
}

async function init() {
  createBackToTop();
  createProgressBar();

  try {
    const posts = await getPosts();
    const page = document.body.dataset.page;

    if (page === "home") renderHome(posts);
    if (page === "archive") renderArchive(posts);
    if (page === "article") renderArticle(posts);
  } catch (error) {
    console.error(error);

    const homeGrid = document.getElementById("post-grid");
    const archiveGrid = document.getElementById("archive-grid");
    const titleEl = document.getElementById("article-title");
    const introEl = document.getElementById("article-intro");

    if (homeGrid) {
      homeGrid.innerHTML = `<div class="empty-state reveal">Failed to load posts.</div>`;
      applyReveal();
    }

    if (archiveGrid) {
      archiveGrid.innerHTML = `<div class="empty-state reveal">Failed to load posts.</div>`;
      applyReveal();
    }

    if (titleEl && introEl) {
      titleEl.textContent = "Failed to load article";
      introEl.textContent = "posts.json could not be loaded.";
    }
  }
}

init();
