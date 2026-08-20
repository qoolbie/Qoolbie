let PRODUCTS = [];

async function loadProducts() {
  try {
    const response = await fetch("https://api.github.com/repos/qoolbie/Qoolbie/contents/content/products");
    const files = await response.json();

    const markdownFiles = files.filter(file => file.name.endsWith(".md"));

    for (const file of markdownFiles) {
      const productResponse = await fetch(file.download_url);
      const text = await productResponse.text();

      const frontmatter = text.match(/^---\s*([\s\S]*?)\s*---/);

      if (!frontmatter) continue;

      const data = {};

      frontmatter[1].split("\n").forEach(line => {
        const index = line.indexOf(":");

        if (index === -1) return;

        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim();

        data[key] = value.replace(/^["']|["']$/g, "");
      });

      PRODUCTS.push(data);
    }
  } catch (error) {
    console.error("Could not load products:", error);
  }

  renderProducts();
  renderCart();
}

const getCart = () =>
  JSON.parse(localStorage.getItem("qoolbieCart") || "[]");

const saveCart = cart => {
  localStorage.setItem("qoolbieCart", JSON.stringify(cart));
  updateCount();
};

function updateCount() {
  const count = getCart().reduce((total, item) => total + item.qty, 0);

  document
    .querySelectorAll(".cart-count")
    .forEach(element => element.textContent = count);
}

function add(id) {
  const cart = getCart();
  const item = cart.find(product => product.id === id);

  if (item) {
    item.qty++;
  } else {
    cart.push({ id, qty: 1 });
  }

  saveCart(cart);
  alert("Added to your sleepy basket ☘");
}

function remove(id) {
  saveCart(getCart().filter(item => item.id !== id));
  renderCart();
}

function change(id, amount) {
  const cart = getCart();
  const item = cart.find(product => product.id === id);

  if (!item) return;

  item.qty += amount;

  if (item.qty <= 0) {
    saveCart(cart.filter(product => product.id !== id));
  } else {
    saveCart(cart);
  }

  renderCart();
}

function renderProducts() {
  const element = document.getElementById("products");

  if (!element) return;

  element.innerHTML = PRODUCTS.map((product, index) => `
    <article class="product">
      <div class="product-img">
        ${product.image
          ? `<img src="${product.image}" alt="${product.name}">`
          : "☘️"}
      </div>

      <h2>${product.name}</h2>

      <div class="price">
        £${Number(product.price).toFixed(2)}
      </div>

      <p>${product.description || ""}</p>

      <button onclick="add(${index})">
        add to cart ☘
      </button>
    </article>
  `).join("");
}

function renderCart() {
  const element = document.getElementById("cart");

  if (!element) return;

  const cart = getCart();

  if (!cart.length) {
    element.innerHTML = `
      <div class="card">
        <h2>Your basket is sleepy... 💤</h2>
        <p>There is nothing here yet.</p>
      </div>
    `;
    return;
  }

  let total = 0;

  element.innerHTML = cart.map(item => {
    const product = PRODUCTS[item.id];

    if (!product) return "";

    const subtotal = Number(product.price) * item.qty;
    total += subtotal;

    return `
      <div class="cart-row">
        <div>
          <b>${product.name}</b><br>
          <small>£${Number(product.price).toFixed(2)} each</small>
        </div>

        <div class="qty">
          <button onclick="change(${item.id}, -1)">−</button>
          ${item.qty}
          <button onclick="change(${item.id}, 1)">+</button>
        </div>

        <b>£${subtotal.toFixed(2)}</b>

        <button onclick="remove(${item.id})">
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

updateCount();
loadProducts();
