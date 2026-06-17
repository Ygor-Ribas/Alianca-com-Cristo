const session = require("express-session");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");



require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
      cb(null, "uploads/fotos");
    } else if (file.mimetype.startsWith("video")) {
      cb(null, "uploads/videos");
    } else {
      cb(new Error("Tipo de arquivo não permitido"));
    }
  },

  filename: (req, file, cb) => {
    const nomeArquivo = Date.now() + path.extname(file.originalname);
    cb(null, nomeArquivo);
  },
});

const upload = multer({ storage });

app.use(express.static(__dirname));

app.post("/upload", upload.single("arquivo"), (req, res) => {
  const { titulo, descricao, tipo } = req.body;
  const arquivo = req.file.filename;

  const sql = `
    INSERT INTO publicacoes
    (titulo, descricao, tipo, arquivo)
    VALUES (?, ?, ?, ?)
  `;

  conexao.query(
    sql,
    [titulo, descricao, tipo, arquivo],
    (erro, resultado) => {
      if (erro) {
        console.error("Erro ao salvar publicação:", erro);

        return res.status(500).json({
          sucesso: false,
          mensagem: "Erro ao salvar no banco.",
        });
      }

      console.log("Publicação salva!");

      res.json({
        sucesso: true,
        mensagem: "Publicação salva com sucesso!",
      });
    }
  );
});

app.get("/publicacoes", (req, res) => {
  const sql = `
    SELECT *
    FROM publicacoes
    ORDER BY criado_em DESC
  `;

  conexao.query(sql, (erro, resultados) => {
    if (erro) {
      return res.status(500).json({
        erro: "Erro ao buscar publicações",
      });
    }

    res.json(resultados);
  });
});

app.get("/", (req, res) => {
  res.send("Servidor funcionando!");
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${process.env.PORT}`);
});