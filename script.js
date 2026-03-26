const POSTS_URL = "posts.json";

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

function createCard(post) {
  return `
    <a class="post-card" href="article.html?id=${encodeURIComponent(post.id)}">
      <div>
        <div class="card-meta">${escapeHtml(categoryText(post.categories))}</div>
        <h3 class="card-title">${escapeHtml(post.title)}</h3>
        <p class="card-intro">${escapeHtml(post.intro)}</p>
      </div>
      <div class="card-bottom">
        <span>${formatDate(post.date)}</span>
        <span>${post.sources.length} SOURCES</span>
      </div>
    </a>
  `;
}

function createFeatured(post) {
  return `
    <a class="featured-card" href="article.html?id=${encodeURIComponent(post.id)}">
      <div class="featured-left">
        <div class="featured-meta">FEATURED / ${escapeHtml(categoryText(post.categories))}</div>
        <h2 class="featured-title">${escapeHtml(post.title)}</h2>
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

function renderHome(posts) {
  const featuredEl = document.getElementById("featured-post");
  const gridEl = document.getElementById("post-grid");
  if (!featuredEl || !gridEl) return;

  if (!posts.length) {
    featuredEl.innerHTML = "";
    gridEl.innerHTML = `<div class="empty-state">No posts yet.</div>`;
    return;
  }

  const [first, ...rest] = posts;
  featuredEl.innerHTML = createFeatured(first);
  gridEl.innerHTML = rest.length
    ? rest.map(createCard).join("")
    : `<div class="empty-state">More posts coming soon.</div>`;
}

function renderArchive(posts) {
  const gridEl = document.getElementById("archive-grid");
  const searchEl = document.getElementById("search-input");
  const filtersEl = document.getElementById("category-filters");
  if (!gridEl || !searchEl || !filtersEl) return;

  const categories = ["ALL", ...new Set(posts.flatMap((post) => post.categories))];
  let activeCategory = "ALL";
  let searchValue = "";

  filtersEl.innerHTML = categories
    .map(
      (cat) => `
        <button class="filter-btn ${cat === "ALL" ? "active" : ""}" data-category="${escapeHtml(cat)}">
          ${escapeHtml(cat)}
        </button>
      `
    )
    .join("");

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
      : `<div class="empty-state">No posts found.</div>`;
  }

  filtersEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;

    activeCategory = btn.dataset.category;

    [...filtersEl.querySelectorAll(".filter-btn")].forEach((b) => {
      b.classList.toggle("active", b.dataset.category === activeCategory);
    });

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

  bodyEl.innerHTML = (post.body || [])
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");

  sourcesEl.innerHTML = (post.sources || [])
    .map(
      (source) => `
        <li>
          <a href="${source.url}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(source.name)}
          </a>
        </li>
      `
    )
    .join("");
}

async function init() {
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
      homeGrid.innerHTML = `<div class="empty-state">Failed to load posts.</div>`;
    }

    if (archiveGrid) {
      archiveGrid.innerHTML = `<div class="empty-state">Failed to load posts.</div>`;
    }

    if (titleEl && introEl) {
      titleEl.textContent = "Failed to load article";
      introEl.textContent = "posts.json could not be loaded.";
    }
  }
}

init();
