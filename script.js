document.addEventListener("DOMContentLoaded", () => {
  const intro = document.createElement("div");
  intro.className = "intro-cinematica";

  intro.innerHTML = `
    <div class="intro-luz"></div>
    <div class="intro-particulas"></div>
    <div class="intro-logo-container">
      <img src="imagend/cruz.webp" alt="Cruz dourada" class="intro-logo">
      <h1 class="intro-titulo">Aliança com Cristo</h1>
    </div>
  `;

  document.body.appendChild(intro);
  document.body.classList.add("site-carregando");

  setTimeout(() => {
    intro.classList.add("expandir");
    document.body.classList.add("site-revelado");
  }, 4200);

  setTimeout(() => {
    intro.remove();
    document.body.classList.remove("site-carregando");
  }, 6200);
});

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