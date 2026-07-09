require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configuração robusta e segura de sessões
app.use(
  session({
    secret: process.env.SESSION_SECRET || "AliancaComCristo2026@",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 4, // 4 horas
      httpOnly: true,             // Protege contra roubo de sessão via JavaScript (XSS)
      secure: false,              // Deixe 'false' para localhost. Mude para 'true' se usar HTTPS em produção
      sameSite: "strict"          // Protege contra ataques CSRF
    },
  })
);

const conexao = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

conexao.connect((erro) => {
  if (erro) {
    console.error("❌ Erro ao conectar no MySQL:", erro);
    return;
  }
  console.log("✅ MySQL conectado com sucesso!");
});

// Middleware para verificar se o usuário está logado
function verificarLogin(req, res, next) {
  if (!req.session.usuario) {
    // Se for uma requisição de API, retorna JSON. Se for uma navegação de página, pode redirecionar.
    if (req.headers["accept"] && req.headers["accept"].includes("application/json")) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Não autorizado. Sessão inválida ou expirada.",
      });
    } else {
      return res.redirect("/index.html?erro=nao_autorizado");
    }
  }
  next();
}

// --- ROTAS PROTEGIDAS DO PAINEL (Devem vir ANTES do express.static) ---
app.get("/indexCoordenadores.html", verificarLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "indexCoordenadores.html"));
});

// Serve o restante dos arquivos estáticos públicos (CSS, imagens, etc.)
app.use(express.static(__dirname));

// Rota de Login Corrigida com Registro de Logs
app.post("/login", (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.json({ sucesso: false, mensagem: "Preencha todos os campos." });
  }

  const sql = "SELECT * FROM usuarios WHERE usuario = ? AND ativo = TRUE";

  conexao.query(sql, [usuario], async (erro, resultados) => {
    if (erro) {
      console.error(erro);
      return res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor" });
    }

    if (resultados.length === 0) {
      return res.json({ sucesso: false, mensagem: "Usuário não encontrado ou inativo" });
    }

    const usuarioBanco = resultados[0];

    try {
      // Compara a senha informada com o hash criptografado no banco
      const senhaCorreta = await bcrypt.compare(senha, usuarioBanco.senha);

      if (!senhaCorreta) {
        // Grava log de tentativa falha
        conexao.query(
          "INSERT INTO logs (usuario_id, acao, descricao) VALUES (?, 'LOGIN_FALHA', 'Tentativa de login com senha incorreta')",
          [usuarioBanco.id]
        );
        return res.json({ sucesso: false, mensagem: "Usuário ou senha incorreta" });
      }

      // Salva os dados na sessão
      req.session.usuario = {
        id: usuarioBanco.id,
        nome: usuarioBanco.nome,
        usuario: usuarioBanco.usuario,
        cargo: usuarioBanco.cargo
      };

      // Atualiza o timestamp do último login e registra o log de sucesso
      conexao.query("UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?", [usuarioBanco.id]);
      conexao.query(
        "INSERT INTO logs (usuario_id, acao, descricao) VALUES (?, 'LOGIN_SUCESSO', 'Usuário realizou login no painel')",
        [usuarioBanco.id]
      );

      return res.json({ 
        sucesso: true, 
        mensagem: "Login realizado com sucesso!",
        redirecionar: "/indexCoordenadores.html"
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ sucesso: false, mensagem: "Erro ao processar autenticação" });
    }
  });
});

// Retorna dados do perfil logado
app.get("/perfil", verificarLogin, (req, res) => {
  res.json(req.session.usuario);
});

// Encerra a sessão de forma segura
app.post("/logout", verificarLogin, (req, res) => {
  const usuarioId = req.session.usuario.id;
  
  conexao.query(
    "INSERT INTO logs (usuario_id, acao, descricao) VALUES (?, 'LOGOUT', 'Usuário saiu do sistema')",
    [usuarioId],
    () => {
      req.session.destroy((erro) => {
        if (erro) return res.status(500).json({ sucesso: false });
        res.clearCookie("connect.sid"); // Limpa o cookie do navegador
        res.json({ sucesso: true });
      });
    }
  );
});

// Rota de listagem de publicações para alimentar o site de forma dinâmica
app.get("/publicacoes", (req, res) => {
  conexao.query(
    "SELECT id, titulo, descricao, tipo, arquivo, criado_em FROM publicacoes WHERE ativo = TRUE ORDER BY criado_em DESC",
    (erro, resultados) => {
      if (erro) {
        console.error(erro);
        return res.status(500).json({ sucesso: false });
      }
      res.json(resultados);
    }
  );
});

// Rota padrão do servidor
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando com máxima segurança em http://localhost:${PORT}`);
});