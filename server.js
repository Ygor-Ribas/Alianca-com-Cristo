require("dotenv").config();

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "AliancaComCristo2026@",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 4,
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    },
  }),
);

const pastaUploads = path.join(__dirname, "uploads");

if (!fs.existsSync(pastaUploads)) {
  fs.mkdirSync(pastaUploads);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pastaUploads);
  },

  filename: (req, file, cb) => {
    const nomeArquivo =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_");

    cb(null, nomeArquivo);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 100 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/webm",
    ];

    if (!tiposPermitidos.includes(file.mimetype)) {
      return cb(new Error("Arquivo não permitido"));
    }

    cb(null, true);
  },
});

const conexao = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

conexao.connect((erro) => {
  if (erro) {
    console.error("Erro ao conectar no MySQL:", erro);
    return;
  }

  console.log("MySQL conectado!");
});

function verificarLogin(req, res, next) {
  if (!req.session.usuario) {
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Sessão inválida ou expirada",
      });
    }

    return res.redirect("/index.html?erro=nao_autorizado");
  }

  next();
}

app.get("/indexCoordenadores.html", verificarLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "indexCoordenadores.html"));
});

app.use(express.static(__dirname));

app.use("/uploads", express.static(pastaUploads));

app.post("/login", (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.json({
      sucesso: false,
      mensagem: "Preencha todos os campos",
    });
  }

  const sql = "SELECT * FROM usuarios WHERE usuario = ? AND ativo = TRUE";

  conexao.query(sql, [usuario], async (erro, resultados) => {
    if (erro) {
      return res.status(500).json({
        sucesso: false,
        mensagem: "Erro interno",
      });
    }

    if (resultados.length === 0) {
      return res.json({
        sucesso: false,
        mensagem: "Usuário não encontrado",
      });
    }

    const usuarioBanco = resultados[0];

    const senhaValida = await bcrypt.compare(senha, usuarioBanco.senha);

    if (!senhaValida) {
      conexao.query(
        `
        INSERT INTO logs 
        (usuario_id, acao, descricao)
        VALUES (?, 'LOGIN_FALHA', 'Senha incorreta')
        `,
        [usuarioBanco.id],
      );

      return res.json({
        sucesso: false,
        mensagem: "Usuário ou senha incorreta",
      });
    }

    req.session.usuario = {
      id: usuarioBanco.id,
      nome: usuarioBanco.nome,
      usuario: usuarioBanco.usuario,
      cargo: usuarioBanco.cargo,
    };

    conexao.query("UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?", [
      usuarioBanco.id,
    ]);

    conexao.query(
      `
      INSERT INTO logs
      (usuario_id, acao, descricao)
      VALUES (?, 'LOGIN_SUCESSO', 'Login realizado')
      `,
      [usuarioBanco.id],
    );

    res.json({
      sucesso: true,
      mensagem: "Login realizado",
      redirecionar: "/indexCoordenadores.html",
    });
  });
});

app.get("/perfil", verificarLogin, (req, res) => {
  res.json(req.session.usuario);
});

app.post("/logout", verificarLogin, (req, res) => {
  const id = req.session.usuario.id;

  conexao.query(
    `
    INSERT INTO logs
    (usuario_id, acao, descricao)
    VALUES (?, 'LOGOUT', 'Usuário saiu')
    `,
    [id],
  );

  req.session.destroy((erro) => {
    if (erro) {
      return res.status(500).json({
        sucesso: false,
      });
    }

    res.clearCookie("connect.sid");

    res.json({
      sucesso: true,
    });
  });
});

app.post(
  "/upload",
  verificarLogin,
  upload.single("arquivo"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Nenhum arquivo foi enviado.",
      });
    }

    const {
      titulo,
      descricao,
      categoria,
      subcategoria,
      tipo,
    } = req.body;

    if (
      !titulo ||
      !descricao ||
      !categoria ||
      !subcategoria ||
      !tipo
    ) {
      fs.unlinkSync(req.file.path);

      return res.status(400).json({
        sucesso: false,
        mensagem: "Preencha todos os campos.",
      });
    }

    const sql = `
      INSERT INTO publicacoes
      (
        titulo,
        descricao,
        categoria,
        subcategoria,
        tipo,
        arquivo,
        criado_por
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const caminhoArquivo = `/uploads/${req.file.filename}`;

    conexao.query(
      sql,
      [
        titulo,
        descricao,
        categoria,
        subcategoria,
        tipo,
        caminhoArquivo,
        req.session.usuario.id,
      ],
      (erro, resultado) => {
        if (erro) {
          console.error("Erro ao salvar publicação:", erro);

          fs.unlinkSync(req.file.path);

          return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao salvar publicação.",
          });
        }

        res.json({
          sucesso: true,
          mensagem: "Publicação criada com sucesso!",
          id: resultado.insertId,
        });
      },
    );
  },
);

app.get("/publicacoes", (req, res) => {
  conexao.query(
    `
    SELECT 
    id,
    titulo,
    descricao,
    categoria,
    subcategoria,
    tipo,
    arquivo,
    criado_em

    FROM publicacoes

    WHERE ativo = TRUE

    ORDER BY criado_em DESC
    `,

    (erro, resultados) => {
      if (erro) {
        return res.status(500).json({
          sucesso: false,
        });
      }

      res.json(resultados);
    },
  );
});

app.put(
  "/publicacoes/:id",
  verificarLogin,
  upload.single("arquivo"),
  (req, res) => {
    const { id } = req.params;

    const { titulo, descricao, categoria, subcategoria, tipo } = req.body;

    if (!titulo || !descricao || !categoria || !subcategoria || !tipo) {
      if (req.file) fs.unlinkSync(req.file.path);

      return res.status(400).json({
        sucesso: false,
        mensagem: "Preencha todos os campos.",
      });
    }

    conexao.query(
      "SELECT arquivo FROM publicacoes WHERE id = ? AND ativo = TRUE",
      [id],
      (erro, resultados) => {
        if (erro) {
          if (req.file) fs.unlinkSync(req.file.path);

          return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno.",
          });
        }

        if (resultados.length === 0) {
          if (req.file) fs.unlinkSync(req.file.path);

          return res.status(404).json({
            sucesso: false,
            mensagem: "Publicação não encontrada.",
          });
        }

        const arquivoAntigo = resultados[0].arquivo;

        const novoCaminhoArquivo = req.file
          ? `/uploads/${req.file.filename}`
          : arquivoAntigo;

        const sql = `
          UPDATE publicacoes
          SET titulo = ?, descricao = ?, categoria = ?, subcategoria = ?, tipo = ?, arquivo = ?
          WHERE id = ?
        `;

        conexao.query(
          sql,
          [
            titulo,
            descricao,
            categoria,
            subcategoria,
            tipo,
            novoCaminhoArquivo,
            id,
          ],
          (erro) => {
            if (erro) {
              if (req.file) fs.unlinkSync(req.file.path);

              return res.status(500).json({
                sucesso: false,
                mensagem: "Erro ao atualizar publicação.",
              });
            }

            if (req.file && arquivoAntigo) {
              const caminhoAntigo = path.join(
                __dirname,
                arquivoAntigo.replace(/^\//, ""),
              );

              fs.unlink(caminhoAntigo, () => {});
            }

            res.json({
              sucesso: true,
              mensagem: "Publicação atualizada com sucesso!",
            });
          },
        );
      },
    );
  },
);

app.delete("/publicacoes/:id", verificarLogin, (req, res) => {
  const { id } = req.params;

  conexao.query(
    "UPDATE publicacoes SET ativo = FALSE WHERE id = ?",
    [id],
    (erro, resultado) => {
      if (erro) {
        return res.status(500).json({
          sucesso: false,
          mensagem: "Erro ao excluir publicação.",
        });
      }

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          sucesso: false,
          mensagem: "Publicação não encontrada.",
        });
      }

      res.json({
        sucesso: true,
        mensagem: "Publicação excluída com sucesso!",
      });
    },
  );
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
