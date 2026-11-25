/* ==========================================================
   Página inicial: intro, menu e login com animação.
   A lógica de acesso (rotas, CSRF, redirecionamento) é a mesma de antes.
   ========================================================== */

/* ---------- Intro ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const intro = document.createElement("div");
  intro.className = "intro-cinematica";

  intro.innerHTML = `
    <div class="intro-luz"></div>
    <div class="intro-particulas"></div>
    <div class="intro-logo-container">
      <span class="intro-anel"></span>
      <img src="imagend/cruz.webp" alt="Cruz dourada" class="intro-logo">
      <h1 class="intro-titulo">Aliança com Cristo</h1>
      <div class="intro-barra"><i></i></div>
    </div>
    <span class="intro-pular">Toque para pular</span>
  `;

  document.body.appendChild(intro);
  document.body.classList.add("site-carregando");

  let encerrada = false;
  let timerExpandir = null;
  let timerRemover = null;

  const encerrarIntro = () => {
    if (encerrada) return;
    encerrada = true;
    clearTimeout(timerExpandir);
    intro.classList.add("expandir");
    document.body.classList.add("site-revelado");

    timerRemover = setTimeout(() => {
      intro.remove();
      document.body.classList.remove("site-carregando");
    }, 1700);
  };

  timerExpandir = setTimeout(encerrarIntro, 3900);

  intro.addEventListener("click", encerrarIntro);
  document.addEventListener(
    "keydown",
    () => {
      if (!encerrada) encerrarIntro();
    },
    { once: true },
  );
});

/* ---------- Menu ---------- */
const menuToggle = document.getElementById("menu-toggle");
const navPrincipal = document.getElementById("nav-principal");

if (menuToggle && navPrincipal) {
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

  document.querySelectorAll(".nav-principal a").forEach((link) => {
    link.addEventListener("click", () => {
      navPrincipal.classList.remove("active");
    });
  });
}

/* ---------- Login ---------- */
const btnPublicar = document.getElementById("btn-publicar");
const loginOverlay = document.getElementById("login-overlay");
const loginModal = document.getElementById("login-modal");
const entrarLogin = document.getElementById("entrar-login");
const cancelarLogin = document.getElementById("cancelar-login");
const campoUsuario = document.getElementById("usuario");
const campoSenha = document.getElementById("senha");
const verSenha = document.getElementById("ver-senha");

let loginEmAndamento = false;

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function abrirLogin() {
  if (!loginOverlay) return;
  loginOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
  setTimeout(() => {
    if (campoUsuario) campoUsuario.focus();
  }, 500);
}

function fecharLogin() {
  if (!loginOverlay || loginEmAndamento) return;
  loginOverlay.classList.remove("active");
  document.body.style.overflow = "";
  if (loginModal) loginModal.classList.remove("erro", "carregando");
}

function sacudirLogin() {
  if (!loginModal) return;
  loginModal.classList.remove("erro");
  // força o navegador a reiniciar a animação
  void loginModal.offsetWidth;
  loginModal.classList.add("erro");
  setTimeout(() => loginModal.classList.remove("erro"), 650);
}

function animarSucessoELiberar() {
  loginModal.classList.remove("carregando");
  loginModal.classList.add("sucesso");

  setTimeout(() => {
    const portal = document.createElement("div");
    portal.className = "portal-login";
    portal.innerHTML = `<img src="imagend/cruz.webp" alt="">`;
    document.body.appendChild(portal);

    // reflow para a transição de clip-path funcionar
    void portal.offsetWidth;
    portal.classList.add("abrir");

    setTimeout(() => {
      window.location.href = "indexCoordenadores.html";
    }, 1100);
  }, 1700);
}

if (btnPublicar && loginOverlay) {
  btnPublicar.addEventListener("click", (e) => {
    e.preventDefault();
    if (navPrincipal) navPrincipal.classList.remove("active");
    abrirLogin();
  });

  loginOverlay.addEventListener("click", (e) => {
    if (e.target === loginOverlay) fecharLogin();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && loginOverlay.classList.contains("active")) {
      fecharLogin();
    }
  });
}

if (cancelarLogin && loginOverlay) {
  cancelarLogin.addEventListener("click", fecharLogin);
}

if (verSenha && campoSenha) {
  verSenha.addEventListener("click", () => {
    const mostrando = campoSenha.type === "text";
    campoSenha.type = mostrando ? "password" : "text";
    verSenha.classList.toggle("ativo", !mostrando);
    verSenha.setAttribute("aria-label", mostrando ? "Mostrar senha" : "Ocultar senha");
    campoSenha.focus();
  });
}

if (entrarLogin && loginOverlay) {
  const fazerLogin = async () => {
    if (loginEmAndamento) return;

    const usuario = campoUsuario.value.trim();
    const senha = campoSenha.value;

    if (!usuario || !senha) {
      sacudirLogin();
      mostrarToast("Preencha usuário e senha.", "erro");
      return;
    }

    loginEmAndamento = true;
    loginModal.classList.add("carregando");

    try {
      const token = await window.obterTokenCsrf();

      // espera pelo menos um instante para a animação de "verificando" ser percebida
      const [resposta] = await Promise.all([
        fetch("/login", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": token,
          },
          body: JSON.stringify({ usuario, senha }),
        }),
        esperar(900),
      ]);

      const dados = await resposta.json();

      if (dados.sucesso) {
        mostrarToast("Login realizado com sucesso!", "sucesso");
        animarSucessoELiberar();
        return;
      }

      loginEmAndamento = false;
      loginModal.classList.remove("carregando");
      sacudirLogin();
      campoSenha.value = "";
      campoSenha.focus();
      mostrarToast(dados.mensagem || "Não foi possível entrar.", "erro");
    } catch (erro) {
      loginEmAndamento = false;
      loginModal.classList.remove("carregando");
      sacudirLogin();
      mostrarToast("Erro ao conectar ao servidor.", "erro");
    }
  };

  entrarLogin.addEventListener("click", fazerLogin);

  document.addEventListener("keydown", (event) => {
    if (loginOverlay.classList.contains("active") && event.key === "Enter") {
      fazerLogin();
    }
  });
}

function mostrarToast(mensagem, tipo = "sucesso") {
  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  toast.innerText = mensagem;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 2800);
}
