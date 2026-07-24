const formulario = document.querySelector(".form-publicacao");
const listaPublicacoes = document.getElementById("lista-publicacoes");
const inputArquivo = document.getElementById("arquivo");
const tituloCard = document.querySelector(".card-publicacao h2");

let idEmEdicao = null;
let botaoCancelarEdicao = null;

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

    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 2500);
}

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.innerText = texto ?? "";
  return div.innerHTML;
}

function criarCardPublicacao(pub) {
  const card = document.createElement("div");
  card.className = "card-conteudo";

  const midia =
    pub.tipo === "video"
      ? `<video src="${pub.arquivo}" controls></video>`
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

  card
    .querySelector(".btn-editar")
    .addEventListener("click", () => entrarModoEdicao(pub));

  card
    .querySelector(".btn-excluir")
    .addEventListener("click", () => excluirPublicacao(pub.id));

  return card;
}

async function carregarPublicacoesPainel() {
  if (!listaPublicacoes) return;

  try {
    const resposta = await fetch("/publicacoes");

    if (!resposta.ok) {
      throw new Error("Falha ao buscar publicações");
    }

    const publicacoes = await resposta.json();

    listaPublicacoes.innerHTML = "";

    if (!Array.isArray(publicacoes) || publicacoes.length === 0) {
      listaPublicacoes.innerHTML =
        "<p>Nenhuma publicação cadastrada ainda.</p>";
      return;
    }

    const grid = document.createElement("div");
    grid.className = "grid-publicacoes";

    publicacoes.forEach((pub) => {
      grid.appendChild(criarCardPublicacao(pub));
    });

    listaPublicacoes.appendChild(grid);
  } catch (erro) {
    console.error("Erro ao carregar publicações:", erro);
    listaPublicacoes.innerHTML =
      "<p>Não foi possível carregar as publicações.</p>";
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

  if (tituloCard) tituloCard.innerText = "Nova Publicação";

  const botaoSubmit = formulario.querySelector("button[type='submit']");
  if (botaoSubmit) botaoSubmit.innerText = "Publicar Conteúdo";

  if (botaoCancelarEdicao) {
    botaoCancelarEdicao.remove();
    botaoCancelarEdicao = null;
  }
}

async function excluirPublicacao(id) {
  const confirmar = window.confirm(
    "Tem certeza que deseja excluir esta publicação?",
  );

  if (!confirmar) return;

  try {
    const resposta = await fetch(`/publicacoes/${id}`, {
      method: "DELETE",
    });

    if (resposta.status === 401) {
      mostrarToast("Sessão expirada. Faça login novamente.", "erro");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);

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

    const emEdicao = idEmEdicao !== null;
    const url = emEdicao ? `/publicacoes/${idEmEdicao}` : "/upload";
    const metodo = emEdicao ? "PUT" : "POST";

    try {
      const resposta = await fetch(url, {
        method: metodo,
        body: formData,
      });

      if (resposta.status === 401) {
        mostrarToast("Sessão expirada. Faça login novamente.", "erro");

        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);

        return;
      }

      const dados = await resposta.json();

      if (dados.sucesso) {
        mostrarToast(
          emEdicao
            ? "Publicação atualizada com sucesso!"
            : "Publicação criada com sucesso!",
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

document.addEventListener("DOMContentLoaded", carregarPublicacoesPainel);
