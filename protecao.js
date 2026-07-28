/*
  Proteções de uso no navegador (dificultam o download casual de
  fotos/vídeos). Isto é uma camada de dificuldade, não uma garantia:
  qualquer conteúdo mostrado na tela de alguém pode, em último caso,
  ser fotografado com outro aparelho ou capturado por gravação de
  tela do sistema operacional — isso nenhum site consegue impedir.
*/

(function () {
  function protegerMidia(elemento) {
    elemento.setAttribute("oncontextmenu", "return false");
    elemento.addEventListener("contextmenu", (e) => e.preventDefault());
    elemento.addEventListener("dragstart", (e) => e.preventDefault());
    elemento.setAttribute("draggable", "false");
    elemento.style.webkitUserSelect = "none";
    elemento.style.userSelect = "none";
    elemento.style.webkitTouchCallout = "none";

    if (elemento.tagName === "VIDEO") {
      elemento.setAttribute(
        "controlsList",
        "nodownload noremoteplayback noplaybackrate",
      );
      elemento.disablePictureInPicture = true;
      elemento.setAttribute("disablePictureInPicture", "true");
    }
  }

  function aplicarProtecaoNaPagina() {
    document.querySelectorAll("img, video").forEach(protegerMidia);
  }

  document.addEventListener("DOMContentLoaded", aplicarProtecaoNaPagina);

  // Reaplica a proteção sempre que novo conteúdo é inserido
  // dinamicamente (ex.: galerias carregadas via fetch).
  const observador = new MutationObserver(() => aplicarProtecaoNaPagina());
  document.addEventListener("DOMContentLoaded", () => {
    observador.observe(document.body, { childList: true, subtree: true });
  });

  // Pausa vídeos quando a aba perde o foco/fica em segundo plano.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      document.querySelectorAll("video").forEach((v) => v.pause());
    }
  });

  // Helper global para obter/enviar o token CSRF em requisições que
  // alteram dados (login, upload, edição, exclusão, logout).
  window.obterTokenCsrf = async function obterTokenCsrf() {
    const resposta = await fetch("/csrf-token", { credentials: "same-origin" });
    const dados = await resposta.json();
    return dados.csrfToken;
  };
})();
