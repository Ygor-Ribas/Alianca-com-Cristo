/*
  Carrega dinamicamente, a partir do banco de dados, as fotos e
  vídeos publicados pelos coordenadores para uma categoria
  específica (retiro, sexta_santa, momentos, saiba_mais) e monta os
  cartões na página.

  Uso no HTML:
  <script src="publicacoesPublicas.js"
          data-categoria="retiro"
          data-alvo="grid-publicacoes-retiro"></script>
*/

(function () {
  const scriptAtual = document.currentScript;
  const categoria = scriptAtual.dataset.categoria;
  const idAlvo = scriptAtual.dataset.alvo;

  function escapeHtml(texto) {
    const div = document.createElement("div");
    div.innerText = texto ?? "";
    return div.innerHTML;
  }

  function montarMidia(pub) {
    if (pub.tipo === "video") {
      const inicio = Number(pub.tempo_inicio) || 0;
      const fim = pub.tempo_fim !== null ? Number(pub.tempo_fim) : null;

      const video = document.createElement("video");
      video.src = pub.arquivo;
      video.controls = true;
      video.preload = "metadata";
      video.controlsList = "nodownload noremoteplayback noplaybackrate";
      video.disablePictureInPicture = true;
      video.setAttribute("playsinline", "");

      // Aplica o recorte de tempo definido pelo coordenador: o
      // vídeo começa no ponto marcado e para (voltando ao início)
      // no ponto final marcado.
      video.addEventListener("loadedmetadata", () => {
        if (inicio > 0 && inicio < video.duration) {
          video.currentTime = inicio;
        }
      });

      video.addEventListener("timeupdate", () => {
        if (fim && video.currentTime >= fim) {
          video.pause();
          video.currentTime = inicio;
        }
      });

      return video;
    }

    const img = document.createElement("img");
    img.src = pub.arquivo;
    img.alt = pub.titulo || "";
    img.loading = "lazy";
    return img;
  }

  function criarCard(pub) {
    const card = document.createElement("div");
    card.className = "card-video";

    const midia = montarMidia(pub);
    card.appendChild(midia);

    const info = document.createElement("p");
    info.innerHTML = `<strong>${escapeHtml(pub.subcategoria)}</strong><br>${escapeHtml(pub.descricao)}`;
    card.appendChild(info);

    return card;
  }

  async function carregar() {
    const alvo = document.getElementById(idAlvo);
    if (!alvo) return;

    alvo.innerHTML = "<p>Carregando...</p>";

    try {
      const resposta = await fetch(`/publicacoes?categoria=${encodeURIComponent(categoria)}`);
      if (!resposta.ok) throw new Error("Falha ao buscar publicações");

      const publicacoes = await resposta.json();
      alvo.innerHTML = "";

      if (!Array.isArray(publicacoes) || publicacoes.length === 0) {
        alvo.innerHTML = "<p>Nenhuma publicação disponível ainda. Em breve, novidades por aqui!</p>";
        return;
      }

      publicacoes.forEach((pub) => alvo.appendChild(criarCard(pub)));
    } catch (erro) {
      console.error("Erro ao carregar publicações:", erro);
      alvo.innerHTML = "<p>Não foi possível carregar o conteúdo agora. Tente novamente mais tarde.</p>";
    }
  }

  document.addEventListener("DOMContentLoaded", carregar);
})();
