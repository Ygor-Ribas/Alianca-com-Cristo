document.addEventListener("DOMContentLoaded", () => {
const intro = document.createElement("div");
intro.className = "intro-cinematica";

intro.innerHTML = `     <div class="intro-luz"></div>     <div class="intro-particulas"></div>     <div class="intro-logo-container">       <img src="imagend/cruz.webp" alt="Cruz dourada" class="intro-logo">       <h1 class="intro-titulo">Aliança com Cristo</h1>     </div>
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

if (menuToggle && navPrincipal) {
menuToggle.addEventListener("click", () => {
navPrincipal.classList.toggle("active");
});

document.addEventListener("click", (event) => {
const clicouNoMenu = navPrincipal.contains(event.target);
const clicouNoBotao = menuToggle.contains(event.target);

```
if (!clicouNoMenu && !clicouNoBotao) {
  navPrincipal.classList.remove("active");
}
```

});

document.addEventListener("keydown", (event) => {
if (event.key === "Escape") {
navPrincipal.classList.remove("active");
}
});

document.querySelectorAll(".nav-principal a").forEach((link) => {
link.addEventListener("click", () => {
navPrincipal.classList.remove("active");
});
});
}

const btnPublicar = document.getElementById("btn-publicar");
const loginOverlay = document.getElementById("login-overlay");
const entrarLogin = document.getElementById("entrar-login");
const cancelarLogin = document.getElementById("cancelar-login");

if (btnPublicar && loginOverlay) {
btnPublicar.addEventListener("click", (e) => {
e.preventDefault();
loginOverlay.classList.add("active");
});
}

if (cancelarLogin) {
cancelarLogin.addEventListener("click", () => {
loginOverlay.classList.remove("active");
});
}

if (entrarLogin) {
entrarLogin.addEventListener("click", () => {
const usuario = document.getElementById("usuario").value.trim();
const senha = document.getElementById("senha").value.trim();

```
if (usuario === "coordenador" && senha === "123456") {
  window.location.href = "indexCoordenadores.html";
} else {
  alert("Usuário ou senha incorretos.");
}
```

});
}

document.addEventListener("keydown", (event) => {
if (event.key === "Escape" && loginOverlay) {
loginOverlay.classList.remove("active");
}
});
