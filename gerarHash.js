const bcrypt = require("bcrypt");

// Gera o hash da senha de login dos coordenadores.
// Rode com: node gerarHash.js
// Copie o hash impresso no terminal e cole no lugar de
// 'COLE_O_HASH_AQUI' no arquivo banco-de-dados.sql.
//
// Usuário: AdminACristo
// Senha:   AlCrist02022
//
// Para trocar a senha no futuro, edite o valor abaixo, rode o
// script de novo e atualize o banco com o novo hash.
bcrypt.hash("AlCrist02022", 12).then((hash) => {
  console.log("\nUsuário: AdminACristo");
  console.log("Hash gerado (copie tudo abaixo):");
  console.log(hash);
  console.log("");
});
