const bcrypt = require("bcrypt");

// Gera o hash da nova senha do login dos coordenadores.
// Rode com: node gerarHash.js
// Copie o hash impresso no terminal e use no comando SQL (veja INSTRUCOES.md).
bcrypt.hash("AlCrist02022", 10).then((hash) => {
  console.log(hash);
});