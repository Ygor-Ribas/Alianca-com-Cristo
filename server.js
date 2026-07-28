require("dotenv").config();

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const crypto = require("crypto");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const { fileTypeFromFile } = require("file-type");
const sharp = require("sharp");

// ------------------------------------------------------------------
// Verificações de configuração obrigatórias (falha rápido e visível
// em vez de rodar com valores fracos/hardcoded em produção).
// ------------------------------------------------------------------
["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "SESSION_SECRET"].forEach(
  (chave) => {
    if (!process.env[chave]) {
      console.error(
        `Variável de ambiente obrigatória ausente: ${chave}. Configure o arquivo .env antes de iniciar o servidor.`,
      );
      process.exit(1);
    }
  },
);

const producao = process.env.NODE_ENV === "production";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

// ------------------------------------------------------------------
// Cabeçalhos de segurança
// ------------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        mediaSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    referrerPolicy: { policy: "no-referrer" },
    crossOriginResourcePolicy: { policy: "same-origin" },
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 4,
      httpOnly: true,
      secure: producao,
      sameSite: "strict",
    },
  }),
);

// ------------------------------------------------------------------
// Limitação de tentativas (força bruta) no login
// ------------------------------------------------------------------
const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    sucesso: false,
    mensagem: "Muitas tentativas. Tente novamente em alguns minutos.",
  },
});

const limitadorGeral = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limitadorGeral);

// ------------------------------------------------------------------
// Proteção CSRF (token por sessão, exigido em toda requisição que
// altera dados: login, upload, edição, exclusão, logout)
// ------------------------------------------------------------------
app.get("/csrf-token", (req, res) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  res.json({ csrfToken: req.session.csrfToken });
});

function exigirCsrf(req, res, next) {
  const tokenEnviado = req.headers["x-csrf-token"];

  if (
    !req.session.csrfToken ||
    !tokenEnviado ||
    tokenEnviado !== req.session.csrfToken
  ) {
    return res.status(403).json({
      sucesso: false,
      mensagem: "Token de segurança inválido. Atualize a página e tente novamente.",
    });
  }

  next();
}

// ------------------------------------------------------------------
// Uploads
// ------------------------------------------------------------------
const pastaUploads = path.join(__dirname, "uploads");

if (!fs.existsSync(pastaUploads)) {
  fs.mkdirSync(pastaUploads);
}

const extensoesPermitidas = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, pastaUploads),
  filename: (req, file, cb) => {
    const nomeAleatorio = crypto.randomBytes(16).toString("hex");
    const extensao = extensoesPermitidas[file.mimetype] || "";
    cb(null, `${Date.now()}-${nomeAleatorio}${extensao}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!extosPermitido(file.mimetype)) {
      return cb(new Error("Arquivo não permitido"));
    }
    cb(null, true);
  },
});

function extosPermitido(mimetype) {
  return Object.prototype.hasOwnProperty.call(extensoesPermitidas, mimetype);
}

// Confere a "assinatura" real do arquivo (magic bytes), não apenas o
// cabeçalho enviado pelo navegador, que pode ser falsificado. Se o
// conteúdo real não bater com o mimetype declarado, o arquivo é
// removido e a publicação é rejeitada.
async function validarArquivoReal(caminho, mimetypeDeclarado) {
  const tipoReal = await fileTypeFromFile(caminho);

  if (!tipoReal) return false;

  const gruposEquivalentes = {
    "image/jpeg": ["image/jpeg"],
    "image/png": ["image/png"],
    "image/webp": ["image/webp"],
    "video/mp4": ["video/mp4"],
    "video/webm": ["video/webm"],
  };

  const validos = gruposEquivalentes[mimetypeDeclarado] || [];
  return validos.includes(tipoReal.mime);
}

// Reprocessa imagens (remove metadados/EXIF, recomprime, limita
// dimensão máxima) para reduzir risco de arquivos maliciosos
// disfarçados de imagem e padronizar o tamanho exibido no site.
async function reprocessarImagemSeNecessario(caminho, mimetype) {
  if (!mimetype.startsWith("image/")) return;

  const buffer = await sharp(caminho)
    .rotate()
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
    .toBuffer();

  await sharp(buffer).toFile(caminho + ".tmp");
  fs.renameSync(caminho + ".tmp", caminho);
}

// ------------------------------------------------------------------
// Banco de dados
// ------------------------------------------------------------------
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

// ------------------------------------------------------------------
// Arquivos estáticos do site (HTML/CSS/JS)
// ------------------------------------------------------------------
app.use(express.static(__dirname, { index: false, dotfiles: "deny" }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ------------------------------------------------------------------
// Entrega protegida de mídia (fotos e vídeos enviados pelos
// coordenadores). Usa express.static apenas para esta pasta, com
// cabeçalhos que impedem cache em disco do navegador e forçam a
// exibição inline (não como anexo para "salvar como").
// Importante: nada disso impede fisicamente que alguém baixe o
// arquivo ou grave a tela — ver observação de segurança no README.
// ------------------------------------------------------------------
app.use(
  "/uploads",
  express.static(pastaUploads, {
    setHeaders: (res) => {
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "private, max-age=0, no-store");
      res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    },
  }),
);

// ------------------------------------------------------------------
// Login
// ------------------------------------------------------------------
app.post(
  "/login",
  limitadorLogin,
  exigirCsrf,
  body("usuario").trim().isLength({ min: 1, max: 80 }).escape(),
  body("senha").isLength({ min: 1, max: 200 }),
  (req, res) => {
    const erros = validationResult(req);
    if (!erros.isEmpty()) {
      return res.json({ sucesso: false, mensagem: "Preencha todos os campos" });
    }

    const { usuario, senha } = req.body;

    const sql = "SELECT * FROM usuarios WHERE usuario = ? AND ativo = TRUE";

    conexao.query(sql, [usuario], async (erro, resultados) => {
      if (erro) {
        return res.status(500).json({ sucesso: false, mensagem: "Erro interno" });
      }

      // Resposta genérica em caso de usuário inexistente ou senha
      // errada, para não revelar quais usuários existem.
      if (resultados.length === 0) {
        return res.json({
          sucesso: false,
          mensagem: "Usuário ou senha incorreta",
        });
      }

      const usuarioBanco = resultados[0];
      const senhaValida = await bcrypt.compare(senha, usuarioBanco.senha);

      if (!senhaValida) {
        conexao.query(
          `INSERT INTO logs (usuario_id, acao, descricao) VALUES (?, 'LOGIN_FALHA', 'Senha incorreta')`,
          [usuarioBanco.id],
        );

        return res.json({
          sucesso: false,
          mensagem: "Usuário ou senha incorreta",
        });
      }

      req.session.regenerate((erroRegen) => {
        if (erroRegen) {
          return res.status(500).json({ sucesso: false, mensagem: "Erro interno" });
        }

        req.session.usuario = {
          id: usuarioBanco.id,
          nome: usuarioBanco.nome,
          usuario: usuarioBanco.usuario,
          cargo: usuarioBanco.cargo,
        };
        req.session.csrfToken = crypto.randomBytes(32).toString("hex");

        conexao.query("UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?", [
          usuarioBanco.id,
        ]);

        conexao.query(
          `INSERT INTO logs (usuario_id, acao, descricao) VALUES (?, 'LOGIN_SUCESSO', 'Login realizado')`,
          [usuarioBanco.id],
        );

        res.json({
          sucesso: true,
          mensagem: "Login realizado",
          redirecionar: "/indexCoordenadores.html",
          csrfToken: req.session.csrfToken,
        });
      });
    });
  },
);

app.get("/perfil", verificarLogin, (req, res) => {
  res.json(req.session.usuario);
});

app.post("/logout", verificarLogin, exigirCsrf, (req, res) => {
  const id = req.session.usuario.id;

  conexao.query(
    `INSERT INTO logs (usuario_id, acao, descricao) VALUES (?, 'LOGOUT', 'Usuário saiu')`,
    [id],
  );

  req.session.destroy((erro) => {
    if (erro) return res.status(500).json({ sucesso: false });
    res.clearCookie("sid");
    res.json({ sucesso: true });
  });
});

// ------------------------------------------------------------------
// Publicações
// ------------------------------------------------------------------
async function tratarUploadValido(req) {
  if (!req.file) return { ok: true };

  const arquivoOk = await validarArquivoReal(req.file.path, req.file.mimetype);

  if (!arquivoOk) {
    fs.unlinkSync(req.file.path);
    return { ok: false, mensagem: "Arquivo inválido ou corrompido." };
  }

  await reprocessarImagemSeNecessario(req.file.path, req.file.mimetype);
  return { ok: true };
}

app.post(
  "/upload",
  verificarLogin,
  exigirCsrf,
  upload.single("arquivo"),
  body("titulo").trim().isLength({ min: 1, max: 150 }).escape(),
  body("descricao").trim().isLength({ min: 1, max: 2000 }).escape(),
  body("categoria").isIn(["retiro", "sexta_santa", "momentos", "saiba_mais"]),
  body("subcategoria").trim().isLength({ min: 1, max: 150 }).escape(),
  body("tipo").isIn(["foto", "video"]),
  body("tempoInicio").optional({ checkFalsy: true }).isFloat({ min: 0 }),
  body("tempoFim").optional({ checkFalsy: true }).isFloat({ min: 0 }),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ sucesso: false, mensagem: "Nenhum arquivo foi enviado." });
    }

    const erros = validationResult(req);
    if (!erros.isEmpty()) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ sucesso: false, mensagem: "Dados inválidos." });
    }

    const validacao = await tratarUploadValido(req);
    if (!validacao.ok) {
      return res.status(400).json({ sucesso: false, mensagem: validacao.mensagem });
    }

    const { titulo, descricao, categoria, subcategoria, tipo } = req.body;
    const tempoInicio = req.body.tempoInicio ? Number(req.body.tempoInicio) : 0;
    const tempoFim = req.body.tempoFim ? Number(req.body.tempoFim) : null;
    const caminhoArquivo = `/uploads/${req.file.filename}`;

    const sql = `
      INSERT INTO publicacoes
        (titulo, descricao, categoria, subcategoria, tipo, arquivo, tempo_inicio, tempo_fim, criado_por)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    conexao.query(
      sql,
      [
        titulo,
        descricao,
        categoria,
        subcategoria,
        tipo,
        caminhoArquivo,
        tempoInicio,
        tempoFim,
        req.session.usuario.id,
      ],
      (erro, resultado) => {
        if (erro) {
          console.error("Erro ao salvar publicação:", erro);
          fs.unlinkSync(req.file.path);
          return res.status(500).json({ sucesso: false, mensagem: "Erro ao salvar publicação." });
        }

        res.json({ sucesso: true, mensagem: "Publicação criada com sucesso!", id: resultado.insertId });
      },
    );
  },
);

app.get("/publicacoes", (req, res) => {
  const categoriasValidas = ["retiro", "sexta_santa", "momentos", "saiba_mais"];
  const { categoria } = req.query;

  let sql = `
    SELECT id, titulo, descricao, categoria, subcategoria, tipo, arquivo,
           tempo_inicio, tempo_fim, criado_em
    FROM publicacoes
    WHERE ativo = TRUE
  `;
  const parametros = [];

  if (categoria && categoriasValidas.includes(categoria)) {
    sql += " AND categoria = ?";
    parametros.push(categoria);
  }

  sql += " ORDER BY criado_em DESC";

  conexao.query(sql, parametros, (erro, resultados) => {
    if (erro) return res.status(500).json({ sucesso: false });
    res.json(resultados);
  });
});

app.put(
  "/publicacoes/:id",
  verificarLogin,
  exigirCsrf,
  upload.single("arquivo"),
  body("titulo").trim().isLength({ min: 1, max: 150 }).escape(),
  body("descricao").trim().isLength({ min: 1, max: 2000 }).escape(),
  body("categoria").isIn(["retiro", "sexta_santa", "momentos", "saiba_mais"]),
  body("subcategoria").trim().isLength({ min: 1, max: 150 }).escape(),
  body("tipo").isIn(["foto", "video"]),
  async (req, res) => {
    const { id } = req.params;

    const erros = validationResult(req);
    if (!erros.isEmpty()) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ sucesso: false, mensagem: "Dados inválidos." });
    }

    if (req.file) {
      const validacao = await tratarUploadValido(req);
      if (!validacao.ok) {
        return res.status(400).json({ sucesso: false, mensagem: validacao.mensagem });
      }
    }

    const { titulo, descricao, categoria, subcategoria, tipo } = req.body;
    const tempoInicio = req.body.tempoInicio ? Number(req.body.tempoInicio) : 0;
    const tempoFim = req.body.tempoFim ? Number(req.body.tempoFim) : null;

    conexao.query(
      "SELECT arquivo FROM publicacoes WHERE id = ? AND ativo = TRUE",
      [id],
      (erro, resultados) => {
        if (erro) {
          if (req.file) fs.unlinkSync(req.file.path);
          return res.status(500).json({ sucesso: false, mensagem: "Erro interno." });
        }

        if (resultados.length === 0) {
          if (req.file) fs.unlinkSync(req.file.path);
          return res.status(404).json({ sucesso: false, mensagem: "Publicação não encontrada." });
        }

        const arquivoAntigo = resultados[0].arquivo;
        const novoCaminhoArquivo = req.file ? `/uploads/${req.file.filename}` : arquivoAntigo;

        const sql = `
          UPDATE publicacoes
          SET titulo = ?, descricao = ?, categoria = ?, subcategoria = ?, tipo = ?,
              arquivo = ?, tempo_inicio = ?, tempo_fim = ?
          WHERE id = ?
        `;

        conexao.query(
          sql,
          [titulo, descricao, categoria, subcategoria, tipo, novoCaminhoArquivo, tempoInicio, tempoFim, id],
          (erro2) => {
            if (erro2) {
              if (req.file) fs.unlinkSync(req.file.path);
              return res.status(500).json({ sucesso: false, mensagem: "Erro ao atualizar publicação." });
            }

            if (req.file && arquivoAntigo) {
              const caminhoAntigo = path.join(__dirname, arquivoAntigo.replace(/^\//, ""));
              fs.unlink(caminhoAntigo, () => {});
            }

            res.json({ sucesso: true, mensagem: "Publicação atualizada com sucesso!" });
          },
        );
      },
    );
  },
);

app.delete("/publicacoes/:id", verificarLogin, exigirCsrf, (req, res) => {
  const { id } = req.params;

  conexao.query(
    "UPDATE publicacoes SET ativo = FALSE WHERE id = ?",
    [id],
    (erro, resultado) => {
      if (erro) {
        return res.status(500).json({ sucesso: false, mensagem: "Erro ao excluir publicação." });
      }
      if (resultado.affectedRows === 0) {
        return res.status(404).json({ sucesso: false, mensagem: "Publicação não encontrada." });
      }
      res.json({ sucesso: true, mensagem: "Publicação excluída com sucesso!" });
    },
  );
});

// Tratamento de erros do multer (ex.: arquivo grande demais / tipo não permitido)
app.use((erro, req, res, next) => {
  if (erro instanceof multer.MulterError || erro.message === "Arquivo não permitido") {
    return res.status(400).json({ sucesso: false, mensagem: erro.message });
  }
  next(erro);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
