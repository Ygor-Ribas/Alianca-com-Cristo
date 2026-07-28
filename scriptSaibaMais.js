const secoes = document.querySelectorAll(".secao[id]");
const linksMenu = document.querySelectorAll(".nav-menu a");

function marcarLinkAtivo() {
  let atual = "";

  secoes.forEach((secao) => {
    const topo = secao.offsetTop - 160;
    if (window.scrollY >= topo) {
      atual = secao.id;
    }
  });

  linksMenu.forEach((link) => {
    link.classList.toggle("ativo", link.getAttribute("href") === `#${atual}`);
  });
}

window.addEventListener("scroll", marcarLinkAtivo);
document.addEventListener("DOMContentLoaded", marcarLinkAtivo);
