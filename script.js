let PRODUCTS = [];

async function loadProducts() {
  const response = await fetch("products.json");
  PRODUCTS = await response.json();

  renderProducts();
}

function renderProducts() {
  const el = document.getElementById("products");
  if (!el) return;

  el.innerHTML = PRODUCTS
    .filter(p => p.available !== false)
    .map((p, index) => `
      <article class="product">
        <div class="product-img">
          <img
            src="${p.image}"
            alt="${p.name}"
            style="max-width:100%; max-height:190px; width:auto; height:auto; object-fit:contain;"
          >
        </div>

        <h2>${p.name}</h2>

        <div class="price">
          £${Number(p.price).toFixed(2)}
        </div>

        <span>${p.description || ""}</span>

        <button onclick="addToCart(${index})">
          add to cart ☘
        </button>
      </article>
    `)
    .join("");
}

function addToCart(index) {
  alert("Added to your sleepy basket ☘");
}

loadProducts();
