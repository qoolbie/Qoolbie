
let PRODUCTS = [];
let CATEGORIES = [];

const CART_KEY = "qoolbieCart";
const REPO_API = "https://api.github.com/repos/qoolbie/Qoolbie/contents";

/* ---------- CART ---------- */

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const count = getCart().reduce(
    (total, item) => total + (Number(item.qty) || 0),
    0
  );

  document.querySelectorAll(".cart-count").forEach(el => {
    el.textContent = count;
  });
}

/* ---------- IMAGES ---------- */

function imageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/")) {
    return "https://qoolbie.github.io/Qoolbie" + path;
  }
  return "https://qoolbie.github.io/Qoolbie/" + path;
}

/* ---------- FILE PARSING ---------- */

function parseContent(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) return null;

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch (error) {
    console.error("Could not parse content:", error);
    return null;
  }
}

async function loadCollection(path) {
  const response = await fetch(`${REPO_API}/${path}`);

  if (!response.ok) {
    throw new Error(`Could not load ${path}: ${response.status}`);
  }

  const files = await response.json();

  if (!Array.isArray(files)) return [];

  const results = [];

  for (const file of files) {
    if (!file.name || !/\.(md|json)$/i.test(file.name)) continue;

    try {
      const fileResponse = await fetch(file.download_url);
      if (!fileResponse.ok) continue;

      const text = await fileResponse.text();
      const item = parseContent(text);

      if (item) {
        item.id = file.name;
        results.push(item);
      }
    } catch (error) {
      console.error("Could not load file:", file.name, error);
    }
  }

  return results;
}

/* ---------- PRODUCTS AND CATEGORIES ---------- */

async function loadProducts() {
  try {
    PRODUCTS = await loadCollection("content/products");
  } catch (error) {
    console.error("Could not load products:", error);
    PRODUCTS = [];
  }

  try {
    CATEGORIES = await loadCollection("content/categories");
  } catch (error) {
    console.error("Could not load categories:", error);
    CATEGORIES = [];
  }

  const validIds = new Set(PRODUCTS.map(product => product.id));

  saveCart(getCart().filter(item => validIds.has(item.id)));

  renderProducts();
  renderProductDetail();
  renderCart();
  renderSummary();
  updateCartCount();

  document.dispatchEvent(new Event("qoolbie:products-loaded"));
}

function productCategory(product) {
  const value = product.category;

  if (!value) return null;

  const reference = typeof value === "object"
    ? value.name || value.value || value.id || value.path || ""
    : String(value);

  const normalise = value =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\.(md|json)$/i, "");

  return CATEGORIES.find(category => {
    return [
      category.name,
      category.id,
      category.slug
    ].some(candidate => normalise(candidate) === normalise(reference));
  }) || null;
}

function renderProducts() {
  const el = document.getElementById("products");
  if (!el) return;

  const available = PRODUCTS.filter(product => product.available !== false);
  const output = [];

  function card(product) {
    return `
      <article class="product">
        <a href="product.html?id=${encodeURIComponent(product.id)}">
          <div class="product-img">
            <img
              src="${imageUrl(product.image)}"
              alt="${product.name || "Qoolbie product"}"
              style="max-width:100%;max-height:190px;width:auto;height:auto;object-fit:contain;"
            >
          </div>
          <h2>${product.name || "Little treasure"}</h2>
        </a>
        <div class="price">£${(Number(product.price) || 0).toFixed(2)}</div>
        <span>${product.description || ""}</span>
        <button onclick="addToCart('${product.id}')">
          add to cart ☘
        </button>
      </article>
    `;
  }

  for (const type of ["physical", "digital"]) {
    const products = available.filter(product =>
      (product.type || "physical").toLowerCase() === type
    );

    const categories = CATEGORIES.filter(category =>
      String(category.type || "physical").toLowerCase() === type
    );

    if (!products.length && !categories.length) continue;

    output.push(`
      <h2 class="shop-type-heading">
        ${type === "physical" ? "📦 Physical treasures" : "💻 Digital goodies"}
      </h2>
    `);

    const displayedIds = new Set();

    for (const category of categories) {
      const matches = products.filter(product =>
        productCategory(product) === category
      );

      output.push(`
        <section class="shop-category">
          <h2>${category.name || "Little treasures"}</h2>
          ${category.description ? `<p class="subtitle">${category.description}</p>` : ""}
          ${category.image ? `<img src="${imageUrl(category.image)}" alt="${category.name}" style="width:100%;max-height:220px;object-fit:contain;">` : ""}
          <div class="products">
            ${matches.length
              ? matches.map(card).join("")
              : "<p>More little treasures coming soon! ☘</p>"}
          </div>
        </section>
      `);

      matches.forEach(product => displayedIds.add(product.id));
    }

    const otherProducts = products.filter(
      product => !displayedIds.has(product.id)
    );

    if (otherProducts.length) {
      output.push(`
        <section class="shop-category">
          <h2>Other treasures</h2>
          <div class="products">${otherProducts.map(card).join("")}</div>
        </section>
      `);
    }
  }

  if (!output.length) {
    el.innerHTML = "<p>No products available just yet. ☘</p>";
  } else {
    el.innerHTML = output.join("");
  }
}

/* ---------- PRODUCT DETAILS ---------- */

function renderProductDetail() {
  const el = document.getElementById("product-detail");
  if (!el) return;

  const id = new URLSearchParams(window.location.search).get("id");
  const product = PRODUCTS.find(item => item.id === id);

  if (!product) {
    el.innerHTML = `
      <h1>product not found</h1>
      <a class="btn" href="shop.html">back to shop</a>
    `;
    return;
  }

  el.innerHTML = `
    <span class="pill">☘ from the clover shop</span>
    <h1>${product.name}</h1>
    <div class="two">
      <div class="big-mascot">
        <img src="${imageUrl(product.image)}" alt="${product.name}"
          style="max-width:100%;max-height:380px;width:auto;height:auto;object-fit:contain;">
      </div>
      <div>
        <h2>£${(Number(product.price) || 0).toFixed(2)}</h2>
        <p>${product.description || ""}</p>
        ${product.details ? `<h2>More details</h2><p>${product.details}</p>` : ""}
        <button onclick="addToCart('${product.id}')">add to cart ☘</button>
        <br>
        <a class="btn soft" href="shop.html">← back to shop</a>
      </div>
    </div>
  `;
}

/* ---------- CART ACTIONS ---------- */

function addToCart(id) {
  const product = PRODUCTS.find(item => item.id === id);
  if (!product) return;

  const cart = getCart();
  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.qty = (Number(existing.qty) || 0) + 1;
  } else {
    cart.push({ id, qty: 1 });
  }

  saveCart(cart);
  renderCart();
  renderSummary();
  alert(`${product.name} added to your sleepy basket ☘`);
}

function removeFromCart(id) {
  saveCart(getCart().filter(item => item.id !== id));
  renderCart();
  renderSummary();
}

function changeQuantity(id, amount) {
  const cart = getCart();
  const item = cart.find(item => item.id === id);
  if (!item) return;

  item.qty = (Number(item.qty) || 0) + amount;

  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }

  saveCart(cart);
  renderCart();
  renderSummary();
}

function renderCart() {
  const el = document.getElementById("cart");
  if (!el) return;

  const cart = getCart();

  if (!cart.length) {
    el.innerHTML = `
      <div class="card">
        <h2>Your basket is sleepy... 💤</h2>
        <p>There is nothing here yet.</p>
        <a class="btn" href="shop.html">visit the shop</a>
      </div>
    `;
    return;
  }

  let total = 0;

  el.innerHTML = cart.map(item => {
    const product = PRODUCTS.find(p => p.id === item.id);
    if (!product) return "";

    const quantity = Number(item.qty) || 0;
    const subtotal = (Number(product.price) || 0) * quantity;
    total += subtotal;

    return `
      <div class="cart-row">
        <div>
          <b>${product.name}</b><br>
          <small>£${(Number(product.price) || 0).toFixed(2)} each</small>
        </div>
        <div class="qty">
          <button onclick="changeQuantity('${item.id}', -1)">−</button>
          ${quantity}
          <button onclick="changeQuantity('${item.id}', 1)">+</button>
        </div>
        <b>£${subtotal.toFixed(2)}</b>
        <button onclick="removeFromCart('${item.id}')">remove</button>
      </div>
    `;
  }).join("") + `
    <div class="total"><h2>Total: £${total.toFixed(2)}</h2></div>
  `;
}

function renderSummary() {
  const el = document.getElementById("summary");
  if (!el) return;

  const cart = getCart();

  if (!cart.length) {
    el.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  let total = 0;

  el.innerHTML = cart.map(item => {
    const product = PRODUCTS.find(p => p.id === item.id);
    if (!product) return "";

    const subtotal = (Number(product.price) || 0) * (Number(item.qty) || 0);
    total += subtotal;

    return `<p>${product.name} × ${item.qty}<br><b>£${subtotal.toFixed(2)}</b></p>`;
  }).join("") + `<hr><h2>£${total.toFixed(2)}</h2>`;
}

/* ---------- STORIES ---------- */

async function getStories() {
  const stories = await loadCollection("content/stories");
  return stories.filter(story => story.published !== false);
}

async function loadStories() {
  const el = document.getElementById("stories");
  if (!el) return;

  try {
    const stories = await getStories();

    el.innerHTML = stories.map(story => {
      const preview = story.content
        ? story.content.substring(0, 120) + "..."
        : "";

      return `
        <a href="story.html?id=${encodeURIComponent(story.id)}"
          style="text-decoration:none;color:inherit;display:block;">
          <article class="card" style="margin:25px 0;">
            ${story.image ? `<img src="${imageUrl(story.image)}" alt="${story.title}" style="width:100%;max-height:400px;object-fit:contain;border-radius:20px;">` : ""}
            <h2>${story.title}</h2>
            <p class="subtitle">${story.date || ""}</p>
            <p>${preview}</p>
            <strong>Read story →</strong>
          </article>
        </a>
      `;
    }).join("");
  } catch (error) {
    console.error("Could not load stories:", error);
  }
}

/* ---------- STORY DETAILS ---------- */

async function renderStoryDetail() {
  const el = document.getElementById("story-detail");
  if (!el) return;

  const id = new URLSearchParams(window.location.search).get("id");

  if (!id) {
    el.innerHTML = `<h1>story not found</h1><a class="btn" href="stories.html">back to stories</a>`;
    return;
  }

  try {
    const stories = await getStories();
    const story = stories.find(item => item.id === id);

    if (!story) {
      el.innerHTML = `<h1>story not found</h1><a class="btn" href="stories.html">back to stories</a>`;
      return;
    }

    const extras = Array.isArray(story.images) ? story.images : [];
    const images = [...new Set([
      story.image,
      ...extras.map(item => typeof item === "string" ? item : item?.image)
    ].filter(Boolean))];

    const gallery = images.map((image, index) => `
      <img src="${imageUrl(image)}" alt="${story.title} — picture ${index + 1}"
        style="width:100%;max-height:500px;object-fit:contain;border-radius:20px;margin:12px 0;">
    `).join("");

    el.innerHTML = `
      <span class="pill">☘ little village story</span>
      <h1>${story.title}</h1>
      <p class="subtitle">${story.date || ""}</p>
      ${gallery}
      <div class="card" style="margin-top:30px;">
        <p style="white-space:pre-line;">${story.content || ""}</p>
      </div>
      <br>
      <a class="btn soft" href="stories.html">← back to stories</a>
    `;
  } catch (error) {
    console.error("Could not load story:", error);
    el.innerHTML = `<h1>Could not load story</h1><a class="btn" href="stories.html">back to stories</a>`;
  }
}

/* ---------- START ---------- */

loadProducts();
loadStories();
renderStoryDetail();
updateCartCount();
