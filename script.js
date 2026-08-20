let PRODUCTS = [];

async function loadProducts() {
  try {
    const response = await fetch("content/products/2026-08-21-yuyu-egg-memo-pad.md");
    const text = await response.text();

    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      PRODUCTS = [JSON.parse(match[0])];
    }
  } catch (error) {
    console.error("Could not load products:", error);
  }

  renderProducts();
  renderCart();
}

const getCart = () => JSON.parse(localStorage.getItem("qoolbieCart") || "[]");

const saveCart = c => {
  localStorage.setItem("qoolbieCart", JSON.stringify(c));
  updateCount();
};

function updateCount() {
  let n = getCart().reduce((s, x) => s + x.qty, 0);
  document.querySelectorAll(".cart-count").forEach(e => e.textContent = n);
}

function add(id) {
  let c = getCart();
  let x = c.find(i => i.id === id);
  x ? x.qty++ : c.push({id, qty: 1});
  saveCart(c);
  alert("Added to your sleepy basket ☘");
}

function remove(id) {
  saveCart(getCart().filter(x => x.id !== id));
  renderCart();
}

function change(id, d) {
  let c = getCart();
  let x = c.find(i => i.id === id);
  if (!x) return;

  x.qty += d;

  if (x.qty < 1) {
    c = c.filter(i => i.id !== id);
  }

  saveCart(c);
  renderCart();
}

function renderProducts() {
  let el = document.getElementById("products");
  if (!el) return;

  el.innerHTML = PRODUCTS.map((p, index) => `
    <article class="product">
      <div class="product-img">
        ${p.image
          ? `<img src="${p.image}" alt="${p.name}">`
          : "☘️"}
      </div>

      <h2>${p.name}</h2>

      <div class="price">
        £${Number(p.price).toFixed(2)}
      </div>

      <span>${p.description || ""}</span>

      <button onclick="add(${index})">
        add to cart ☘
      </button>
    </article>
  `).join("");
}

function renderCart() {
  let el = document.getElementById("cart");
  if (!el) return;

  let c = getCart();

  if (!c.length) {
    el.innerHTML = `
      <div class="card">
        <h2>Your basket is sleepy... 💤</h2>
        <p>There is nothing here yet.</p>
        <a class="btn" href="shop.html">visit the shop</a>
      </div>`;
    return;
  }

  let total = 0;

  el.innerHTML = c.map(x => {
    let p = PRODUCTS[x.id];
    if (!p) return "";

    let sub = Number(p.price) * x.qty;
    total += sub;

    return `
      <div class="cart-row">
        <div>
          <b>${p.name}</b><br>
          <small>£${Number(p.price).toFixed(2)} each</small>
        </div>

        <div class="qty">
          <button onclick="change(${x.id}, -1)">−</button>
          ${x.qty}
          <button onclick="change(${x.id}, 1)">+</button>
        </div>

        <b>£${sub.toFixed(2)}</b>

        <button onclick="remove(${x.id})"
          style="background:#f6dce5;color:#31563b">
          remove
        </button>
      </div>`;
  }).join("") + `
    <div class="total">
      <h2>Total: £${total.toFixed(2)}</h2>
      <a class="btn" href="checkout.html">go to checkout →</a>
    </div>`;
}

function renderSummary() {
  let el = document.getElementById("summary");
  if (!el) return;

  let c = getCart();
  let total = 0;

  if (!c.length) {
    el.innerHTML =
      '<p>Your cart is empty. <a href="shop.html"><b>Go shopping →</b></a></p>';
    return;
  }

  el.innerHTML = c.map(x => {
    let p = PRODUCTS[x.id];
    if (!p) return "";

    let s = Number(p.price) * x.qty;
    total += s;

    return `
      <p>
        ${p.name} × ${x.qty}<br>
        <b>£${s.toFixed(2)}</b>
      </p>`;
  }).join("") + `<hr><h2>£${total.toFixed(2)}</h2>`;
}

updateCount();
loadProducts();
