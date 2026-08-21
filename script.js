let PRODUCTS = [];

const CART_KEY = "qoolbieCart";

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

function imageUrl(path) {
  if (!path) return "";

  if (path.startsWith("http")) return path;

  return "https://raw.githubusercontent.com/qoolbie/Qoolbie/main" + path;
}

async function loadProducts() {
  try {
    const response = await fetch(
      "https://api.github.com/repos/qoolbie/Qoolbie/contents/content/products"
    );

    const files = await response.json();

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

  /* Remove old/invalid basket items */
  const validIds = new Set(PRODUCTS.map(product => product.id));

  const cleanCart = getCart().filter(item =>
    validIds.has(item.id)
  );

  saveCart(cleanCart);

  renderProducts();
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

        <div class="product-img">
          <img
            src="${imageUrl(p.image)}"
            alt="${p.name}"
            style="max-width:100%;max-height:190px;width:auto;height:auto;object-fit:contain;"
          >
        </div>

        <h2>${p.name}</h2>

        <div class="price">
          £${Number(p.price).toFixed(2)}
        </div>

        <span>${p.description || ""}</span>

        <button onclick="addToCart('${p.id}')">
          add to cart ☘
        </button>

      </article>
    `)
    .join("");
}

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

loadProducts();
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
          stories.push(story);
        }
      }
    }

    el.innerHTML = stories.map(story => `
      <article class="card" style="margin:25px 0;">
        ${
          story.image
            ? `<img
                src="${imageUrl(story.image)}"
                alt="${story.title}"
                style="width:100%;max-height:400px;object-fit:contain;border-radius:20px;"
              >`
            : ""
        }

        <h2>${story.title}</h2>

        <p class="subtitle">${story.date || ""}</p>

        <p>${story.content || ""}</p>
      </article>
    `).join("");

  } catch (error) {
    console.error("Could not load stories:", error);
  }
}

loadStories();
