let PRODUCTS = [];

async function loadProducts() {
  try {
    const response = await fetch(
      "content/products/2026-08-21-yuyu-egg-memo-pad.md"
    );

    const text = await response.text();

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start !== -1 && end !== -1) {
      const product = JSON.parse(text.slice(start, end + 1));
      PRODUCTS = [product];
    }
  } catch (error) {
    console.error("Product loading failed:", error);
  }

  renderProducts();
}

function renderProducts() {
  const products = document.getElementById("products");

  if (!products) return;

  products.innerHTML = PRODUCTS.map((product, index) => `
    <article class="product">
      <div class="product-img">
        <img src="${product.image}" alt="${product.name}">
      </div>

      <h2>${product.name}</h2>

      <div class="price">
        £${Number(product.price).toFixed(2)}
      </div>

      <p>${product.description}</p>

      <button onclick="add(${index})">
        add to cart ☘
      </button>
    </article>
  `).join("");
}

function add(id) {
  alert("Added to your sleepy basket ☘");
}

loadProducts();
