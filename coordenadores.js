const formulario = document.querySelector(".form-publicacao");

formulario.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(formulario);

  try {
    const resposta = await fetch("http://localhost:3000/upload", {
      method: "POST",
      body: formData,
    });

    const dados = await resposta.json();

    if (dados.sucesso) {
      alert("Arquivo enviado com sucesso!");
      formulario.reset();
    } else {
      alert("Erro ao enviar arquivo.");
    }
  } catch (erro) {
    console.error("Erro:", erro);
    alert("Erro ao conectar com o servidor.");
  }
});