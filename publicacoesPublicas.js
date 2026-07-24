(function () {
  const scriptAtual = document.currentScript;
  const categoria = scriptAtual?.dataset.categoria;
  const idAlvo = scriptAtual?.dataset.alvo;

  if (!categoria || !idAlvo) return;

  function escapeHtml(texto) {
    const div = document.createElement("div");
    div.innerText = texto ?? "";
    return div.innerHTML;
  }

  function criarCard(pub) {
    const card = document.createElement("div");
    card.className = "card-video";

    const midia =
      pub.tipo === "video"
        ? `<video src="${pub.arquivo}" controls></video>`
        : `<img src="${pub.arquivo}" alt="${escapeHtml(pub.titulo)}">`;

    card.innerHTML = `
      ${midia}
      <p><strong>${escapeHtml(pub.titulo)}</strong></p>
      <p>${escapeHtml(pub.descricao)}</p>
    `;

    return card;
  }

  async function carregarPublicacoesPublicas() {
    const alvo = document.getElementById(idAlvo);

    if (!alvo) return;

    try {
      const resposta = await fetch("/publicacoes");

      if (!resposta.ok) throw new Error("Falha ao buscar publicações");

      const publicacoes = await resposta.json();

      const filtradas = publicacoes.filter((pub) => pub.categoria === categoria);

      if (filtradas.length === 0) return;

      const porSubcategoria = {};

      filtradas.forEach((pub) => {
        const chave = pub.subcategoria || "Publicações";
        if (!porSubcategoria[chave]) porSubcategoria[chave] = [];
        porSubcategoria[chave].push(pub);
      });

      alvo.innerHTML = "";

      Object.keys(porSubcategoria).forEach((subcategoria) => {
        const bloco = document.createElement("div");
        bloco.style.gridColumn = "1 / -1";

        const tituloBloco = document.createElement("h2");
        tituloBloco.className = "secao-titulo";
        tituloBloco.style.fontSize = "1.8rem";
        tituloBloco.style.margin = "20px 0";
        tituloBloco.innerText = subcategoria;

        bloco.appendChild(tituloBloco);
        alvo.appendChild(bloco);

        porSubcategoria[subcategoria].forEach((pub) => {
          alvo.appendChild(criarCard(pub));
        });
      });
    } catch (erro) {
      console.error("Erro ao carregar publicações públicas:", erro);
    }
  }

  document.addEventListener("DOMContentLoaded", carregarPublicacoesPublicas);
})();
