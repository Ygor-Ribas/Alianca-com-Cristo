const formulario = document.querySelector(".form-publicacao");

formulario.addEventListener("submit", (e) => {
  e.preventDefault();

  const titulo = document.getElementById("titulo").value;
  const descricao = document.getElementById("descricao").value;
  const tipo = document.getElementById("tipo").value;
  const arquivo = document.getElementById("arquivo").files[0];

  if (!arquivo) {
    alert("Selecione um arquivo.");
    return;
  }

  console.log("Título:", titulo);
  console.log("Descrição:", descricao);
  console.log("Tipo:", tipo);
  console.log("Arquivo:", arquivo);

  alert("Publicação enviada com sucesso!");
  
  formulario.reset();
});