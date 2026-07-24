(() => {
  const scriptAtual = document.currentScript;

  const categoria = scriptAtual?.dataset?.categoria;
  const idAlvo = scriptAtual?.dataset?.alvo;

  if (!categoria || !idAlvo) return;

  const alvo = document.getElementById(idAlvo);

  if (!alvo) return;

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
        ? `<video src="${pub.arquivo}" controls playsinline></video>`
        : `<img src="${pub.arquivo}" alt="${escapeHtml(pub.titulo)}" loading="lazy">`;

    card.innerHTML = `
      ${midia}
      <p><strong>${escapeHtml(pub.titulo)}</strong></p>
      <p>${escapeHtml(pub.descricao)}</p>
    `;

    return card;
  }

  async function carregar() {
    alvo.innerHTML = "<p>Carregando publicações...</p>";

    try {
      const resposta = await fetch("/publicacoes");

      if (!resposta.ok) {
        throw new Error("Falha ao buscar publicações");
      }

      const publicacoes = await resposta.json();

      const filtradas = Array.isArray(publicacoes)
        ? publicacoes.filter((pub) => pub.categoria === categoria)
        : [];

      alvo.innerHTML = "";

      if (filtradas.length === 0) {
        alvo.innerHTML = "<p>Nenhuma publicação disponível no momento.</p>";
        return;
      }

      filtradas.forEach((pub) => {
        alvo.appendChild(criarCard(pub));
      });
    } catch (erro) {
      console.error("Erro ao carregar publicações públicas:", erro);
      alvo.innerHTML = "<p>Não foi possível carregar as publicações.</p>";
    }
  }

  document.addEventListener("DOMContentLoaded", carregar);
})();
