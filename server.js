require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");

const app = express();

const conexao = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

conexao.connect((erro) => {
  if (erro) {
    console.error("Erro ao conectar ao MySQL:", erro);
    return;
  }

  console.log("✅ MySQL conectado com sucesso!");
});

app.get("/", (req, res) => {
  res.send("Servidor funcionando!");
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${process.env.PORT}`);
});