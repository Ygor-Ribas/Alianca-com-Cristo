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

if (cancelarLogin && loginOverlay) {
  cancelarLogin.addEventListener("click", () => {
    loginOverlay.classList.remove("active");
  });
}

if (entrarLogin && loginOverlay) {
  const fazerLogin = async () => {
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value;

    if (!usuario || !senha) {
      mostrarToast("Preencha usuário e senha.", "erro");
      return;
    }

    try {
      const token = await window.obterTokenCsrf();

      const resposta = await fetch("/login", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify({ usuario, senha }),
      });

      const dados = await resposta.json();

      if (dados.sucesso) {
        mostrarToast("Login realizado com sucesso!", "sucesso");

        setTimeout(() => {
          window.location.href = "indexCoordenadores.html";
        }, 800);
      } else {
        mostrarToast(dados.mensagem, "erro");
      }
    } catch (erro) {
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
  }, 2500);
}
