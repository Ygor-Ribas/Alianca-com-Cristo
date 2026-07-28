const formulario = document.querySelector(".form-publicacao");
const listaPublicacoes = document.getElementById("lista-publicacoes");
const inputArquivo = document.getElementById("arquivo");
const inputTipo = document.getElementById("tipo");
const tituloCard = document.querySelector(".card-publicacao h2");
const btnSair = document.getElementById("btn-sair");

const painelRecorte = document.getElementById("painel-recorte");
const videoPreview = document.getElementById("video-preview");
const sliderInicio = document.getElementById("tempo-inicio");
const sliderFim = document.getElementById("tempo-fim");
const valorInicio = document.getElementById("valor-inicio");
const valorFim = document.getElementById("valor-fim");

let idEmEdicao = null;
let botaoCancelarEdicao = null;

function mostrarToast(mensagem, tipo = "sucesso") {
  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  toast.innerText = mensagem;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.innerText = texto ?? "";
  return div.innerHTML;
}

function irParaLogin() {
  setTimeout(() => {
    window.location.href = "index.html";
  }, 1200);
}

async function requisicaoComCsrf(url, opcoes = {}) {
  const token = await window.obterTokenCsrf();
  const cabecalhos = Object.assign({}, opcoes.headers, { "x-csrf-token": token });

  return fetch(url, {
    ...opcoes,
    headers: cabecalhos,
    credentials: "same-origin",
  });
}

// ------------------------------------------------------------------
// Painel de recorte de vídeo
// ------------------------------------------------------------------
function formatarSegundos(segundos) {
  const s = Math.round(segundos || 0);
  const min = Math.floor(s / 60);
  const seg = s % 60;
  return `${min}:${String(seg).padStart(2, "0")}`;
}

function atualizarLabelsRecorte() {
  valorInicio.innerText = `Início: ${formatarSegundos(sliderInicio.value)}`;
  valorFim.innerText = `Fim: ${formatarSegundos(sliderFim.value)}`;
}

function configurarRecortePorDuracao(duracao) {
  sliderInicio.max = duracao;
  sliderFim.max = duracao;
  sliderInicio.value = 0;
  sliderFim.value = duracao;
  atualizarLabelsRecorte();
}

function esconderPainelRecorte() {
  painelRecorte.classList.remove("ativo");
  if (videoPreview.src) {
    URL.revokeObjectURL(videoPreview.src);
    videoPreview.removeAttribute("src");
  }
}

inputArquivo.addEventListener("change", () => {
  const arquivo = inputArquivo.files[0];

  if (inputTipo.value !== "video" || !arquivo) {
    esconderPainelRecorte();
    return;
  }

  const url = URL.createObjectURL(arquivo);
  videoPreview.src = url;
  painelRecorte.classList.add("ativo");

  videoPreview.addEventListener(
    "loadedmetadata",
    () => configurarRecortePorDuracao(videoPreview.duration),
    { once: true },
  );
});

inputTipo.addEventListener("change", () => {
  if (inputTipo.value !== "video") {
    esconderPainelRecorte();
  } else if (inputArquivo.files[0]) {
    inputArquivo.dispatchEvent(new Event("change"));
  }
});

sliderInicio.addEventListener("input", () => {
  if (Number(sliderInicio.value) >= Number(sliderFim.value)) {
    sliderInicio.value = Math.max(0, Number(sliderFim.value) - 1);
  }
  videoPreview.currentTime = Number(sliderInicio.value);
  atualizarLabelsRecorte();
});

sliderFim.addEventListener("input", () => {
  if (Number(sliderFim.value) <= Number(sliderInicio.value)) {
    sliderFim.value = Number(sliderInicio.value) + 1;
  }
  videoPreview.currentTime = Number(sliderFim.value);
  atualizarLabelsRecorte();
});

// ------------------------------------------------------------------
// Listagem / cards
// ------------------------------------------------------------------
function criarCardPublicacao(pub) {
  const card = document.createElement("div");
  card.className = "card-conteudo";

  const midia =
    pub.tipo === "video"
      ? `<video src="${pub.arquivo}" controls controlsList="nodownload noremoteplayback noplaybackrate" disablePictureInPicture></video>`
      : `<img src="${pub.arquivo}" alt="${escapeHtml(pub.titulo)}">`;

  card.innerHTML = `
    ${midia}
    <div class="conteudo-info">
      <h3>${escapeHtml(pub.titulo)}</h3>
      <p><strong>${escapeHtml(pub.categoria)} — ${escapeHtml(pub.subcategoria)}</strong></p>
      <p>${escapeHtml(pub.descricao)}</p>
      <div class="acoes">
        <button type="button" class="btn-editar">Editar</button>
        <button type="button" class="btn-excluir">Excluir</button>
      </div>
    </div>
  `;

  card.querySelector(".btn-editar").addEventListener("click", () => entrarModoEdicao(pub));
  card.querySelector(".btn-excluir").addEventListener("click", () => excluirPublicacao(pub.id));

  return card;
}

async function carregarPublicacoesPainel() {
  if (!listaPublicacoes) return;

  try {
    const resposta = await fetch("/publicacoes", { credentials: "same-origin" });
    if (!resposta.ok) throw new Error("Falha ao buscar publicações");

    const publicacoes = await resposta.json();
    listaPublicacoes.innerHTML = "";

    if (!Array.isArray(publicacoes) || publicacoes.length === 0) {
      listaPublicacoes.innerHTML = "<p>Nenhuma publicação cadastrada ainda.</p>";
      return;
    }

    const grid = document.createElement("div");
    grid.className = "grid-publicacoes";
    publicacoes.forEach((pub) => grid.appendChild(criarCardPublicacao(pub)));
    listaPublicacoes.appendChild(grid);
  } catch (erro) {
    console.error("Erro ao carregar publicações:", erro);
    listaPublicacoes.innerHTML = "<p>Não foi possível carregar as publicações.</p>";
  }
}

function entrarModoEdicao(pub) {
  idEmEdicao = pub.id;

  formulario.titulo.value = pub.titulo;
  formulario.descricao.value = pub.descricao;
  formulario.categoria.value = pub.categoria;
  formulario.subcategoria.value = pub.subcategoria;
  formulario.tipo.value = pub.tipo;

  inputArquivo.removeAttribute("required");

  if (pub.tipo === "video") {
    videoPreview.src = pub.arquivo;
    painelRecorte.classList.add("ativo");
    videoPreview.addEventListener(
      "loadedmetadata",
      () => {
        configurarRecortePorDuracao(videoPreview.duration);
        sliderInicio.value = pub.tempo_inicio || 0;
        sliderFim.value = pub.tempo_fim || videoPreview.duration;
        atualizarLabelsRecorte();
      },
      { once: true },
    );
  } else {
    esconderPainelRecorte();
  }

  if (tituloCard) tituloCard.innerText = "Editar Publicação";

  const botaoSubmit = formulario.querySelector("button[type='submit']");
  if (botaoSubmit) botaoSubmit.innerText = "Salvar Alterações";

  if (!botaoCancelarEdicao) {
    botaoCancelarEdicao = document.createElement("button");
    botaoCancelarEdicao.type = "button";
    botaoCancelarEdicao.innerText = "Cancelar Edição";
    botaoCancelarEdicao.className = "btn-excluir";
    botaoCancelarEdicao.addEventListener("click", sairModoEdicao);
    formulario.appendChild(botaoCancelarEdicao);
  }

  formulario.scrollIntoView({ behavior: "smooth" });
}

function sairModoEdicao() {
  idEmEdicao = null;
  formulario.reset();
  inputArquivo.setAttribute("required", "required");
  esconderPainelRecorte();

  if (tituloCard) tituloCard.innerText = "Nova Publicação";

  const botaoSubmit = formulario.querySelector("button[type='submit']");
  if (botaoSubmit) botaoSubmit.innerText = "Publicar Conteúdo";

  if (botaoCancelarEdicao) {
    botaoCancelarEdicao.remove();
    botaoCancelarEdicao = null;
  }
}

async function excluirPublicacao(id) {
  const confirmar = window.confirm("Tem certeza que deseja excluir esta publicação?");
  if (!confirmar) return;

  try {
    const resposta = await requisicaoComCsrf(`/publicacoes/${id}`, { method: "DELETE" });

    if (resposta.status === 401) {
      mostrarToast("Sessão expirada. Faça login novamente.", "erro");
      irParaLogin();
      return;
    }

    const dados = await resposta.json();

    if (dados.sucesso) {
      mostrarToast("Publicação excluída com sucesso!", "sucesso");
      carregarPublicacoesPainel();
    } else {
      mostrarToast(dados.mensagem || "Erro ao excluir.", "erro");
    }
  } catch (erro) {
    console.error("Erro:", erro);
    mostrarToast("Erro ao conectar com o servidor.", "erro");
  }
}

if (formulario) {
  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(formulario);

    if (inputTipo.value === "video" && painelRecorte.classList.contains("ativo")) {
      formData.set("tempoInicio", sliderInicio.value);
      formData.set("tempoFim", sliderFim.value);
    }

    const emEdicao = idEmEdicao !== null;
    const url = emEdicao ? `/publicacoes/${idEmEdicao}` : "/upload";
    const metodo = emEdicao ? "PUT" : "POST";

    try {
      const resposta = await requisicaoComCsrf(url, { method: metodo, body: formData });

      if (resposta.status === 401) {
        mostrarToast("Sessão expirada. Faça login novamente.", "erro");
        irParaLogin();
        return;
      }

      const dados = await resposta.json();

      if (dados.sucesso) {
        mostrarToast(
          emEdicao ? "Publicação atualizada com sucesso!" : "Publicação criada com sucesso!",
          "sucesso",
        );
        sairModoEdicao();
        carregarPublicacoesPainel();
      } else {
        mostrarToast(dados.mensagem || "Erro ao publicar.", "erro");
      }
    } catch (erro) {
      console.error("Erro:", erro);
      mostrarToast("Erro ao conectar com o servidor.", "erro");
    }
  });
}

if (btnSair) {
  btnSair.addEventListener("click", async () => {
    try {
      await requisicaoComCsrf("/logout", { method: "POST" });
    } catch (erro) {
      console.error("Erro ao sair:", erro);
    } finally {
      window.location.href = "index.html";
    }
  });
}

document.addEventListener("DOMContentLoaded", carregarPublicacoesPainel);
