const PRODUCTS = [
  {
    id: "yuyu-egg-memo-pad",
    name: "Yuyu egg memo pad",
    price: 8,
    image: "https://qoolbie.github.io/Qoolbie/media/IMG_1082.jpeg",
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
  document.querySelectorAll(".cart-count").forEach(e => e.textContent = n);
}

function add(id) {
  let c = getCart();
  let x = c.find(i => i.id === id);
  x ? x.qty++ : c.push({ id, qty: 1 });
  saveCart(c);
  alert("Added to your sleepy basket ☘");
}

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
      <button onclick="add('${p.id}')">add to cart ☘</button>
    </article>
  `).join("");
}

updateCount();
renderProducts();
