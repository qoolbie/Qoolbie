const PRODUCTS = [
  {
    id: "yuyu-egg-memo-pad",
    name: "Yuyu egg memo pad",
    price: 8,
    image: "https://raw.githubusercontent.com/qoolbie/Qoolbie/main/media/IMG_1082.jpeg",
    tag: "50 pages memo pad of yuyuhoon and its egg design"
  }
];

const getCart = () =>
  JSON.parse(localStorage.getItem("qoolbieCart") || "[]");

const saveCart = c => {
  localStorage.setItem("qoolbieCart", JSON.stringify(c));
  updateCount();
};

function updateCount() {
  const n = getCart().reduce((s, x) => s + x.qty, 0);
  document.querySelectorAll(".cart-count")
    .forEach(e => e.textContent = n);
}

function add(id) {
  let c = getCart();
  let x = c.find(i => i.id === id);
  x ? x.qty++ : c.push({ id, qty: 1 });
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
  if (x.qty < 1) c = c.filter(i => i.id !== id);

  saveCart(c);
  renderCart();
}

function renderProducts() {
  const el = document.getElementById("products");
  if (!el) return;

  el.innerHTML = PRODUCTS.map(p => `
    <article class="product">
      <div class="product-img">
        <img
          src="${p.image}"
          alt="${p.name}"
          style="width:100%;height:190px;object-fit:contain;"
        >
      </div>

      <h2>${p.name}</h2>
      <div class="price">£${p.price.toFixed(2)}</div>
      <span>${p.tag}</span>

      <button onclick="add('${p.id}')">
        add to cart ☘
      </button>
    </article>
  `).join("");
}

function renderCart() {
  const el = document.getElementById("cart");
  if (!el) return;

  const c = getCart();

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
    const p = PRODUCTS.find(p => p.id === x.id);
    if (!p) return "";

    const sub = p.price * x.qty;
    total += sub;

    return `
      <div class="cart-row">
        <div>
          <b>${p.name}</b><br>
          <small>£${p.price.toFixed(2)} each</small>
        </div>

        <div class="qty">
          <button onclick="change('${p.id}',-1)">−</button>
          ${x.qty}
          <button onclick="change('${p.id}',1)">+</button>
        </div>

        <b>£${sub.toFixed(2)}</b>

        <button onclick="remove('${p.id}')">remove</button>
      </div>`;
  }).join("") + `
    <div class="total">
      <h2>Total: £${total.toFixed(2)}</h2>
      <a class="btn" href="checkout.html">go to checkout →</a>
    </div>`;
}

function renderSummary() {
  const el = document.getElementById("summary");
  if (!el) return;

  const c = getCart();

  if (!c.length) {
    el.innerHTML = '<p>Your cart is empty.</p>';
    return;
  }

  let total = 0;

  el.innerHTML = c.map(x => {
    const p = PRODUCTS.find(p => p.id === x.id);
    if (!p) return "";

    const s = p.price * x.qty;
    total += s;

    return `
      <p>
        ${p.name} × ${x.qty}<br>
        <b>£${s.toFixed(2)}</b>
      </p>`;
  }).join("") + `<hr><h2>£${total.toFixed(2)}</h2>`;
}

updateCount();
renderProducts();
renderCart();
renderSummary();
