require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const session = require("express-session");
const cookieParser = require("cookie-parser");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 4,
      httpOnly: true,
    },
  })
);

app.use(express.static(__dirname));

const conexao = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

conexao.connect((erro) => {
  if (erro) {
    console.log(erro);
    return;
  }

  console.log("✅ MySQL conectado");
});

function verificarLogin(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).json({
      sucesso: false,
      mensagem: "Não autorizado",
    });
  }

  next();
}

app.post("/login", (req, res) => {
  const { usuario, senha } = req.body;

  const sql = "SELECT * FROM usuarios WHERE usuario = ?";

  conexao.query(sql, [usuario], (erro, resultados) => {
    if (erro) {
      return res.status(500).json({
        sucesso: false,
        mensagem: "Erro no servidor"
      });
    }

    if (resultados.length === 0) {
      return res.json({
        sucesso: false,
        mensagem: "Usuário não encontrado"
      });
    }

    const usuarioBanco = resultados[0];

    if (senha !== usuarioBanco.senha) {
      return res.json({
        sucesso: false,
        mensagem: "Senha incorreta"
      });
    }

    res.json({
      sucesso: true
    });
  });
});
app.get("/perfil", verificarLogin, (req, res) => {
  res.json(req.session.usuario);
});

app.post("/logout", verificarLogin, (req, res) => {
  req.session.destroy(() => {
    res.json({
      sucesso: true,
    });
  });
});

app.get("/publicacoes", (req, res) => {
  conexao.query(
    "SELECT * FROM publicacoes ORDER BY criado_em DESC",
    (erro, resultado) => {
      if (erro) {
        return res.status(500).json({
          sucesso: false,
        });
      }

      res.json(resultado);
    }
  );
});

app.get("/", (req, res) => {
  res.send("Servidor funcionando");
});

app.listen(process.env.PORT, () => {
  console.log(
    `🚀 Servidor rodando em http://localhost:${process.env.PORT}`
  );
});