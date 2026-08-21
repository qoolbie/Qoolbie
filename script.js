let PRODUCTS = [];

async function loadProducts() {
  try {
    const response = await fetch(
      "https://api.github.com/repos/qoolbie/Qoolbie/contents/content/products"
    );

    const files = await response.json();

    const productFiles = files.filter(
      file => file.name.endsWith(".md")
    );

    for (const file of productFiles) {
      const response = await fetch(file.download_url);
      const text = await response.text();

      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");

      if (start !== -1 && end !== -1) {
        PRODUCTS.push(
          JSON.parse(text.slice(start, end + 1))
        );
      }
    }
  } catch (error) {
    console.error("Could not load products:", error);
  }

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
            src="https://raw.githubusercontent.com/qoolbie/Qoolbie/main${p.image}"
            alt="${p.name}"
            style="max-width:100%;max-height:190px;width:auto;height:auto;object-fit:contain;"
          >
        </div>

        <h2>${p.name}</h2>

        <div class="price">
          £${Number(p.price).toFixed(2)}
        </div>

        <span>${p.description || ""}</span>

        <button onclick="alert('Added to your sleepy basket ☘')">
          add to cart ☘
        </button>
      </article>
    `)
    .join("");
}

loadProducts();
