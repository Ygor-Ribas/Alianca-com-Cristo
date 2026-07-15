const formulario = document.querySelector(".form-publicacao");

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

if (formulario) {
  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(formulario);

    try {
      const resposta = await fetch("/upload", {
        method: "POST",
        body: formData,
      });

      if (resposta.status === 401) {
        mostrarToast(
          "Sessão expirada. Faça login novamente.",
          "erro",
        );

        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);

        return;
      }

      const dados = await resposta.json();

      if (dados.sucesso) {
        mostrarToast(
          "Publicação criada com sucesso!",
          "sucesso",
        );

        formulario.reset();

        if (typeof carregarPublicacoesPainel === "function") {
          carregarPublicacoesPainel();
        }
      } else {
        mostrarToast(
          dados.mensagem || "Erro ao publicar.",
          "erro",
        );
      }
    } catch (erro) {
      console.error("Erro:", erro);

      mostrarToast(
        "Erro ao conectar com o servidor.",
        "erro",
      );
    }
  });
}