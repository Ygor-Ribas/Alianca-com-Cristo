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