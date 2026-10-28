
let PRODUCTS = [];
let CATEGORIES = [];
const CART_KEY = "qoolbieCart";
const REPO_API = "https://api.github.com/repos/qoolbie/Qoolbie/contents";

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
  const count = getCart().reduce((sum, item) => sum + Number(item.qty || 0), 0);
  document.querySelectorAll(".cart-count").forEach(el => {
    el.textContent = count;
  });
}

function imageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return "https://qoolbie.github.io/Qoolbie/" + path.replace(/^\/+/, "");
}

function parseContent(text) {
  try {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first < 0 || last < first) return null;
    return JSON.parse(text.slice(first, last + 1));
  } catch (error) {
    console.error("Could not read content file:", error);
    return null;
  }
}

async function loadCollection(path) {
  try {
    const response = await fetch(`${REPO_API}/${path}`);
    if (!response.ok) return [];

    const files = await response.json();
    if (!Array.isArray(files)) return [];

    const results = await Promise.all(
      files
        .filter(file => /\.(md|json)$/i.test(file.name))
        .map(async file => {
          try {
            const response = await fetch(file.download_url);
            if (!response.ok) return null;

            const item = parseContent(await response.text());
            if (!item) return null;

            item.id = file.name;
            return item;
          } catch (error) {
            console.error("Could not load", file.name, error);
            return null;
          }
        })
    );

    return results.filter(Boolean);
  } catch (error) {
    console.error("Could not load collection:", path, error);
    return [];
  }
}

function normalise(value) {
  return String(value || "")
    .replace(/\.(md|json)$/i, "")
    .trim()
    .toLowerCase();
}

function productCategory(product) {
  const value = product.category;

  if (value && typeof value === "object") {
    return value.name || value.title || value.value || "";
  }

  const match = CATEGORIES.find(category =>
    normalise(category.name) === normalise(value) ||
    normalise(category.id) === normalise(value) ||
    normalise(category.slug) === normalise(value)
  );

  return match ? match.name : (value || "");
}

function categoryType(category) {
  return normalise(category.type || "physical");
}

function productType(product) {
  return normalise(product.type || "physical");
}

function isAvailable(product) {
  return product.available !== false && product.available !== "false";
}

function productDate(product) {
  const value =
    product.dateAdded ||
    product.createdAt ||
    product.created_at ||
    product.publishedAt ||
    product.date ||
    "";

  const date = Date.parse(value);
  return Number.isNaN(date) ? 0 : date;
}

function productCard(product) {
  const id = encodeURIComponent(product.id || "");
  const image = imageUrl(product.image);

  return `
    <article class="product-card">
      <a class="product-card-link" href="product.html?id=${id}">
        ${image ? `<img src="${image}" alt="${product.name || "Qoolbie product"}" loading="lazy">` : ""}
        <h3>${product.name || "Little treasure"}</h3>
      </a>
      <p class="product-price">£${Number(product.price || 0).toFixed(2)}</p>
      <button type="button" onclick="addToCart('${String(product.id || "").replace(/'/g, "\\'")}')">
        Add to cart
      </button>
    </article>
  `;
}

function categoryLink(categoryName) {
  return `category.html?category=${encodeURIComponent(categoryName)}`;
}

function renderProductGrid(products) {
  if (!products.length) {
    return `<p class="shop-empty">More little treasures coming soon! ☘</p>`;
  }

  return `<div class="products shop-grid">${products.map(productCard).join("")}</div>`;
}

function renderProducts() {
  const container = document.getElementById("products");
  if (!container) return;

  const available = PRODUCTS.filter(isAvailable);
  const newest = [...available]
    .sort((a, b) => productDate(b) - productDate(a))
    .slice(0, 3);

  const categoryParam = new URLSearchParams(location.search).get("category");

  // Individual category page: show every available product in that category.
  if (document.body.dataset.page === "category" || categoryParam) {
    const heading = document.getElementById("category-title");
    const description = document.getElementById("category-description");
    const name = categoryParam || "";

    const category = CATEGORIES.find(item =>
      normalise(item.name) === normalise(name) ||
      normalise(item.id) === normalise(name) ||
      normalise(item.slug) === normalise(name)
    );

    const actualName = category ? category.name : name;
    const matching = available.filter(product =>
      normalise(productCategory(product)) === normalise(actualName)
    );

    if (heading) heading.textContent = actualName || "Little treasures";
    if (description) description.textContent = category?.description || "";

    container.innerHTML = matching.length
      ? renderProductGrid(matching)
      : `<p class="shop-empty">No products here just yet. Check back soon! ☘</p>`;

    return;
  }

  // Newest products at the top of the shop.
  let html = `
    <section class="shop-section newest-section">
      <h2>✨ Newest Products</h2>
      <p class="shop-section-note">Fresh little treasures from the village.</p>
      ${renderProductGrid(newest)}
    </section>
  `;

  const types = [
    { key: "physical", title: "📦 Physical treasures" },
    { key: "digital", title: "💻 Digital goodies" }
  ];

  for (const type of types) {
    const typeCategories = CATEGORIES.filter(category =>
      categoryType(category) === type.key
    );

    const typeProducts = available.filter(product =>
      productType(product) === type.key
    );

    if (!typeProducts.length && !typeCategories.length) continue;

    html += `
      <section class="shop-section">
        <h2>${type.title}</h2>
    `;

    for (const category of typeCategories) {
      const products = typeProducts.filter(product =>
        normalise(productCategory(product)) === normalise(category.name)
      );

      const preview = products.slice(0, 6);
      const hasMore = products.length > 6;

      html += `
        <section class="category-preview">
          <h3>${category.name}</h3>
          ${category.description ? `<p class="category-description">${category.description}</p>` : ""}
          ${renderProductGrid(preview)}
          ${hasMore ? `
            <a class="more-category-link" href="${categoryLink(category.name)}">
              More ${category.name} →
            </a>
          ` : ""}
        </section>
      `;
    }

    const assignedNames = typeCategories.map(category => normalise(category.name));
    const unassigned = typeProducts.filter(product =>
      !assignedNames.includes(normalise(productCategory(product)))
    );

    if (unassigned.length) {
      html += `
        <section class="category-preview">
          <h3>Other treasures</h3>
          ${renderProductGrid(unassigned.slice(0, 6))}
        </section>
      `;
    }

    html += `</section>`;
  }

  container.innerHTML = html;
}

async function loadProducts() {
  const [products, categories] = await Promise.all([
    loadCollection("content/products"),
    loadCollection("content/categories")
  ]);

  PRODUCTS = products;
  CATEGORIES = categories;

  const validIds = new Set(PRODUCTS.map(product => product.id));
  const cart = getCart().filter(item => validIds.has(item.id));
  saveCart(cart);

  renderProducts();
  renderProductDetail();
  renderCart();
  renderSummary();

  document.dispatchEvent(new Event("qoolbie:products-loaded"));
}

function addToCart(id) {
  const product = PRODUCTS.find(item => item.id === id);
  if (!product || !isAvailable(product)) return;

  const cart = getCart();
  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.qty = Number(existing.qty || 0) + 1;
  } else {
    cart.push({ id, qty: 1 });
  }

  saveCart(cart);
  alert(`${product.name || "Your treasure"} added to your cart! ☘`);
}

function removeFromCart(id) {
  saveCart(getCart().filter(item => item.id !== id));
  renderCart();
  renderSummary();
}

function changeQuantity(id, amount) {
  const cart = getCart();
  const item = cart.find(entry => entry.id === id);

  if (!item) return;

  item.qty = Number(item.qty || 0) + amount;

  if (item.qty <= 0) {
    saveCart(cart.filter(entry => entry.id !== id));
  } else {
    saveCart(cart);
  }

  renderCart();
  renderSummary();
}

function cartProducts() {
  return getCart()
    .map(item => {
      const product = PRODUCTS.find(product => product.id === item.id);
      return product ? { ...product, qty: Number(item.qty || 1) } : null;
    })
    .filter(Boolean);
}

function renderCart() {
  const container = document.getElementById("cart-items");
  if (!container) return;

  const items = cartProducts();

  if (!items.length) {
    container.innerHTML = `<p>Your cart is empty for now. ☘</p>`;
    return;
  }

  container.innerHTML = items.map(product => `
    <div class="cart-item">
      ${product.image ? `<img src="${imageUrl(product.image)}" alt="">` : ""}
      <div>
        <h3>${product.name}</h3>
        <p>£${Number(product.price || 0).toFixed(2)}</p>
        <button type="button" onclick="changeQuantity('${product.id}', -1)">−</button>
        <span>${product.qty}</span>
        <button type="button" onclick="changeQuantity('${product.id}', 1)">+</button>
        <button type="button" onclick="removeFromCart('${product.id}')">Remove</button>
      </div>
    </div>
  `).join("");
}

function renderSummary() {
  const container = document.getElementById("order-summary");
  if (!container) return;

  const items = cartProducts();
  const subtotal = items.reduce(
    (sum, product) => sum + Number(product.price || 0) * product.qty,
    0
  );

  container.innerHTML = `
    ${items.map(product => `
      <p>${product.name} × ${product.qty}
      <span>£${(Number(product.price || 0) * product.qty).toFixed(2)}</span></p>
    `).join("")}
    <hr>
    <p><strong>Subtotal</strong>
    <strong>£${subtotal.toFixed(2)}</strong></p>
  `;
}

function renderProductDetail() {
  const container = document.getElementById("product-detail");
  if (!container) return;

  const id = new URLSearchParams(location.search).get("id");
  const product = PRODUCTS.find(item => item.id === id);

  if (!product) {
    container.innerHTML = `<p>Sorry, we couldn't find that little treasure. ☘</p>`;
    return;
  }

  container.innerHTML = `
    ${product.image ? `<img src="${imageUrl(product.image)}" alt="${product.name || ""}">` : ""}
    <h1>${product.name || "Little treasure"}</h1>
    <p class="product-price">£${Number(product.price || 0).toFixed(2)}</p>
    <p>${product.description || ""}</p>
    ${product.details ? `<p>${product.details}</p>` : ""}
    ${isAvailable(product)
      ? `<button type="button" onclick="addToCart('${String(product.id).replace(/'/g, "\\'")}')">Add to cart</button>`
      : `<p>Currently unavailable ☘</p>`}
  `;
}

async function getStories() {
  return loadCollection("content/stories");
}

async function loadStories() {
  const container = document.getElementById("stories");
  if (!container) return;

  const stories = (await getStories()).filter(story => story.published !== false);

  container.innerHTML = stories.map(story => `
    <article class="story-card">
      ${story.image ? `<img src="${imageUrl(story.image)}" alt="">` : ""}
      <h2><a href="story.html?id=${encodeURIComponent(story.id)}">${story.title || story.name || "A village story"}</a></h2>
      <p>${story.description || story.excerpt || ""}</p>
    </article>
  `).join("");
}

async function renderStoryDetail() {
  const container = document.getElementById("story-detail");
  if (!container) return;

  const id = new URLSearchParams(location.search).get("id");
  if (!id) return;

  const stories = await getStories();
  const story = stories.find(item => item.id === id);

  if (!story) {
    container.innerHTML = `<p>Sorry, this story could not be found. ☘</p>`;
    return;
  }

  container.innerHTML = `
    <h1>${story.title || story.name || "A village story"}</h1>
    ${story.image ? `<img src="${imageUrl(story.image)}" alt="">` : ""}
    <div>${story.content || story.body || story.description || ""}</div>
  `;
}

loadProducts();
loadStories();
renderStoryDetail();
updateCartCount();
