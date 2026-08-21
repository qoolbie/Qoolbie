let PRODUCTS = [];

const CART_KEY = "qoolbieCart";

/* ---------- CART ---------- */

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((total, item) => total + item.qty, 0);

  document.querySelectorAll(".cart-count").forEach(el => {
    el.textContent = count;
  });
}

/* ---------- IMAGES ---------- */

function imageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  return "https://raw.githubusercontent.com/qoolbie/Qoolbie/main" + path;
}

/* ---------- PRODUCTS ---------- */

async function loadProducts() {
  try {
    const response = await fetch(
      "https://api.github.com/repos/qoolbie/Qoolbie/contents/content/products"
    );

    const files = await response.json();

    PRODUCTS = [];

    for (const file of files) {
      if (!file.name.endsWith(".md")) continue;

      const response = await fetch(file.download_url);
      const text = await response.text();

      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");

      if (start !== -1 && end !== -1) {
        const product = JSON.parse(text.slice(start, end + 1));
        product.id = file.name;
        PRODUCTS.push(product);
      }
    }
  } catch (error) {
    console.error("Could not load products:", error);
  }

  const validIds = new Set(PRODUCTS.map(product => product.id));

  const cleanCart = getCart().filter(item =>
    validIds.has(item.id)
  );

  saveCart(cleanCart);

  renderProducts();
  renderProductDetail();
  renderCart();
  renderSummary();
  updateCartCount();
}

function renderProducts() {
  const el = document.getElementById("products");
  if (!el) return;

  el.innerHTML = PRODUCTS
    .filter(p => p.available !== false)
    .map(p => `
      <article class="product">

        <a href="product.html?id=${encodeURIComponent(p.id)}">

          <div class="product-img">
            <img
              src="${imageUrl(p.image)}"
              alt="${p.name}"
              style="max-width:100%;max-height:190px;width:auto;height:auto;object-fit:contain;"
            >
          </div>

          <h2>${p.name}</h2>

        </a>

        <div class="price">
          £${Number(p.price).toFixed(2)}
        </div>

        <span>${p.description || ""}</span>

        <button onclick="event.preventDefault(); addToCart('${p.id}')">
          add to cart ☘
        </button>

      </article>
    `)
    .join("");
}

function renderProductDetail() {
  const el = document.getElementById("product-detail");
  if (!el) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const product = PRODUCTS.find(p => p.id === id);

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
        <img
          src="${imageUrl(product.image)}"
          alt="${product.name}"
          style="max-width:100%;max-height:380px;width:auto;height:auto;object-fit:contain;"
        >
      </div>

      <div>

        <h2>£${Number(product.price).toFixed(2)}</h2>

        <p>${product.description || ""}</p>

        ${
          product.details
            ? `
              <h2>More details</h2>
              <p>${product.details}</p>
            `
            : ""
        }

        <button onclick="addToCart('${product.id}')">
          add to cart ☘
        </button>

        <br>

        <a class="btn soft" href="shop.html">
          ← back to shop
        </a>

      </div>

    </div>
  `;
}

/* ---------- CART ---------- */

function addToCart(id) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;

  const cart = getCart();
  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: id,
      qty: 1
    });
  }

  saveCart(cart);
  renderCart();
  renderSummary();

  alert(`${product.name} added to your sleepy basket ☘`);
}

function removeFromCart(id) {
  const cart = getCart().filter(item => item.id !== id);

  saveCart(cart);
  renderCart();
  renderSummary();
}

function changeQuantity(id, amount) {
  const cart = getCart();
  const item = cart.find(item => item.id === id);

  if (!item) return;

  item.qty += amount;

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

  if (cart.length === 0) {
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

    const subtotal = Number(product.price) * item.qty;
    total += subtotal;

    return `
      <div class="cart-row">

        <div>
          <b>${product.name}</b>
          <br>
          <small>£${Number(product.price).toFixed(2)} each</small>
        </div>

        <div class="qty">
          <button onclick="changeQuantity('${item.id}', -1)">−</button>
          ${item.qty}
          <button onclick="changeQuantity('${item.id}', 1)">+</button>
        </div>

        <b>£${subtotal.toFixed(2)}</b>

        <button onclick="removeFromCart('${item.id}')">
          remove
        </button>

      </div>
    `;
  }).join("") + `
    <div class="total">
      <h2>Total: £${total.toFixed(2)}</h2>
    </div>
  `;
}

function renderSummary() {
  const el = document.getElementById("summary");
  if (!el) return;

  const cart = getCart();

  if (cart.length === 0) {
    el.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  let total = 0;

  el.innerHTML = cart.map(item => {
    const product = PRODUCTS.find(p => p.id === item.id);

    if (!product) return "";

    const subtotal = Number(product.price) * item.qty;
    total += subtotal;

    return `
      <p>
        ${product.name} × ${item.qty}
        <br>
        <b>£${subtotal.toFixed(2)}</b>
      </p>
    `;
  }).join("") + `
    <hr>
    <h2>£${total.toFixed(2)}</h2>
  `;
}

/* ---------- STORIES ---------- */

async function loadStories() {
  const el = document.getElementById("stories");
  if (!el) return;

  try {
    const response = await fetch(
      "https://api.github.com/repos/qoolbie/Qoolbie/contents/content/stories"
    );

    const files = await response.json();
    const stories = [];

    for (const file of files) {
      if (!file.name.endsWith(".md")) continue;

      const response = await fetch(file.download_url);
      const text = await response.text();

      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");

      if (start !== -1 && end !== -1) {
        const story = JSON.parse(text.slice(start, end + 1));

        if (story.published !== false) {
          story.id = file.name;
          stories.push(story);
        }
      }
    }

    el.innerHTML = stories.map(story => {

      const preview = story.content
        ? story.content.substring(0, 120) + "..."
        : "";

      return `
        <a
          href="story.html?id=${encodeURIComponent(story.id)}"
          style="text-decoration:none;color:inherit;display:block;"
        >

          <article class="card" style="margin:25px 0;">

            ${
              story.image
                ? `
                  <img
                    src="${imageUrl(story.image)}"
                    alt="${story.title}"
                    style="width:100%;max-height:400px;object-fit:contain;border-radius:20px;"
                  >
                `
                : ""
            }

            <h2>${story.title}</h2>

            <p class="subtitle">
              ${story.date || ""}
            </p>

            <p>
              ${preview}
            </p>

            <strong>Read story →</strong>

          </article>

        </a>
      `;
    }).join("");

  } catch (error) {
    console.error("Could not load stories:", error);
  }
}

/* ---------- STORY DETAIL ---------- */

async function renderStoryDetail() {
  const el = document.getElementById("story-detail");
  if (!el) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    el.innerHTML = `
      <h1>story not found</h1>
      <a class="btn" href="stories.html">back to stories</a>
    `;
    return;
  }

  try {
    const response = await fetch(
      "https://api.github.com/repos/qoolbie/Qoolbie/contents/content/stories"
    );

    const files = await response.json();
    const file = files.find(f => f.name === id);

    if (!file) {
      el.innerHTML = `
        <h1>story not found</h1>
        <a class="btn" href="stories.html">back to stories</a>
      `;
      return;
    }

    const response2 = await fetch(file.download_url);
    const text = await response2.text();

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start === -1 || end === -1) {
      throw new Error("Story data not found");
    }

    const story = JSON.parse(text.slice(start, end + 1));

    el.innerHTML = `
      <span class="pill">☘ little village story</span>

      <h1>${story.title}</h1>

      <p class="subtitle">
        ${story.date || ""}
      </p>

      ${
        story.image
          ? `
            <img
              src="${imageUrl(story.image)}"
              alt="${story.title}"
              style="width:100%;max-height:500px;object-fit:contain;border-radius:20px;"
            >
          `
          : ""
      }

      <div class="card" style="margin-top:30px;">
        <p>${story.content || ""}</p>
      </div>

      <br>

      <a class="btn soft" href="stories.html">
        ← back to stories
      </a>
    `;

  } catch (error) {
    console.error("Could not load story:", error);

    el.innerHTML = `
      <h1>Could not load story</h1>
      <a class="btn" href="stories.html">back to stories</a>
    `;
  }
}

/* ---------- START ---------- */

loadProducts();
loadStories();
renderStoryDetail();
updateCartCount();
