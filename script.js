const menuToggle = document.getElementById("menu-toggle");
const navPrincipal = document.getElementById("nav-principal");

menuToggle.addEventListener("click", () => {
  navPrincipal.classList.toggle("active");
});

document.addEventListener("click", (event) => {
  const clicouNoMenu = navPrincipal.contains(event.target);
  const clicouNoBotao = menuToggle.contains(event.target);

  if (!clicouNoMenu && !clicouNoBotao) {
    navPrincipal.classList.remove("active");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    navPrincipal.classList.remove("active");
  }
});

// Fecha o menu ao clicar em um link
document.querySelectorAll(".nav-principal a").forEach((link) => {
  link.addEventListener("click", () => {
    navPrincipal.classList.remove("active");
  });
});
