const menuToggle = document.getElementById("menu-toggle");
const navLoja = document.getElementById("nav-loja");

menuToggle.addEventListener("click", () => {
  navLoja.classList.toggle("active");
});

document.addEventListener("click", (event) => {
  const clicouNoMenu = navLoja.contains(event.target);
  const clicouNoBotao = menuToggle.contains(event.target);

  if (!clicouNoMenu && !clicouNoBotao) {
    navLoja.classList.remove("active");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    navLoja.classList.remove("active");
  }
});