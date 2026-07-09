const formulario = document.querySelector(".form-publicacao");

// Função para exibir alertas visuais (basta garantir que o script.js ou esta função esteja acessível)
function mostrarToast(mensagem, tipo = "sucesso") {
  // Caso você já tenha a estrutura de Toast no CSS do style.css/coordenadores.css
  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  toast.innerText = mensaje || mensagem;
  document.body.appendChild(toast);

  // Remove o toast da tela após 4 segundos
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

if (formulario) {
  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(formulario);

    try {
      // CORREÇÃO: Mudado de 'http://localhost:3000/upload' para '/upload' (URL Relativa)
      // Isso evita erros de CORS e faz o site funcionar tanto localmente quanto na internet
      const resposta = await fetch("/upload", {
        method: "POST",
        body: formData, // O fetch define automaticamente o Content-Type como multipart/form-data
      });

      // Se o servidor retornar um erro de autenticação (ex: 401 Não Autorizado)
      if (resposta.status === 401) {
        mostrarToast("Sessão expirada. Faça login novamente.", "erro");
        setTimeout(() => {
          window.location.href = "index.html"; // Redireciona para a home para logar
        }, 2000);
        return;
      }

      const dados = await resposta.json();

      if (dados.sucesso) {
        mostrarToast("Publicação enviada com sucesso!", "sucesso");
        formulario.reset();
        
        // Opcional: Se você tiver uma função que lista as publicações na tela do coordenador,
        // você pode chamá-la aqui para atualizar a lista automaticamente sem atualizar a página.
        if (typeof carregarPublicacoesPainel === "function") {
          carregarPublicacoesPainel();
        }
      } else {
        mostrarToast(dados.mensagem || "Erro ao enviar arquivo.", "erro");
      }
    } catch (erro) {
      console.error("Erro na requisição:", erro);
      mostrarToast("Erro ao conectar com o servidor.", "erro");
    }
  });
}