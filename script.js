const PRODUCTS = [
  {
    id: "yuyu-egg-memo-pad",
    name: "Yuyu egg memo pad",
    price: 8,
    image: "https://raw.githubusercontent.com/qoolbie/Qoolbie/main/media/IMG_1082.jpeg",
    tag: "50 pages memo pad of yuyuhoon and its egg design"
  }
];

function renderProducts() {
  const el = document.getElementById("products");
  if (!el) return;

  el.innerHTML = PRODUCTS.map(p => `
    <article class="product">
      <div class="product-img">
        <img src="${p.image}" alt="${p.name}">
      </div>
      <h2>${p.name}</h2>
      <div class="price">£${p.price.toFixed(2)}</div>
      <span>${p.tag}</span>
      <button onclick="alert('Added to your sleepy basket ☘')">
        add to cart ☘
      </button>
    </article>
  `).join("");
}

renderProducts();
