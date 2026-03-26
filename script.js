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

function createCard(post) {
  return `
    <a class="post-card" href="article.html?id=${post.id}">
      <div>
        <div class="card-meta">${formatDate(post.date)}</div>
        <h3 class="card-title">${post.title}</h3>
        <p class="card-intro">${post.intro}</p>
      </div>
      <div class="card-bottom">
        <span>${categoryText(post.categories)}</span>
        <span>${post.sources.length} SOURCES</span>
      </div>
    </a>
  `;
}

function createFeatured(post) {
  return `
    <a class="featured-card" href="article.html?id=${post.id}">
      <div class="featured-left">
        <div class="featured-meta">${formatDate(post.date)} / FEATURED</div>
        <h2 class="featured-title">${post.title}</h2>
      </div>
      <div class="featured-right">
        <p class="featured-intro">${post.intro}</p>
        <div class="card-bottom">
          <span>${categoryText(post.categories)}</span>
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

  const [first, ...rest] = posts;
  if (first) featuredEl.innerHTML = createFeatured(first);
  gridEl.innerHTML = rest.map(createCard).join("");
}

function renderArchive(posts) {
  const gridEl = document.getElementById("archive-grid");
  const searchEl = document.getElementById("search-input");
  const filtersEl = document.getElementById("category-filters");
  if (!gridEl || !searchEl || !filtersEl) return;

  const categories = ["ALL", ...new Set(posts.flatMap(post => post.categories))];
  let activeCategory = "ALL";
  let searchValue = "";

  filtersEl.innerHTML = categories.map(cat => `
    <button class="filter-btn ${cat === "ALL" ? "active" : ""}" data-category="${cat}">
      ${cat}
    </button>
  `).join("");

  function draw() {
    const filtered = posts.filter(post => {
      const matchesCategory =
        activeCategory === "ALL" || post.categories.includes(activeCategory);

      const haystack = [
        post.title,
        post.intro,
        post.body.join(" "),
        post.categories.join(" ")
      ].join(" ").toLowerCase();

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

    [...filtersEl.querySelectorAll(".filter-btn")].forEach(b => {
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
  if (!id) return;

  const post = posts.find(item => item.id === id);
  if (!post) {
    document.getElementById("article-title").textContent = "Article not found";
    return;
  }

  document.title = `${post.title} | WORLD DIG`;
  document.getElementById("article-date").textContent = formatDate(post.date);
  document.getElementById("article-title").textContent = post.title;
  document.getElementById("article-categories").textContent = categoryText(post.categories);
  document.getElementById("article-intro").textContent = post.intro;
  document.getElementById("article-body").innerHTML = post.body
    .map(paragraph => `<p>${paragraph}</p>`)
    .join("");

  document.getElementById("article-sources").innerHTML = post.sources
    .map(source => `
      <li>
        <a href="${source.url}" target="_blank" rel="noopener noreferrer">
          ${source.name}
        </a>
      </li>
    `)
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
  }
}

init();
