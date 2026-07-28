-- ============================================================
-- Aliança com Cristo — Script de banco de dados
-- Rode isto no MySQL (ex.: `mysql -u root -p < banco-de-dados.sql`)
-- Funciona tanto para criar o banco do zero quanto para atualizar
-- uma instalação já existente (usa IF NOT EXISTS / checagens).
-- ============================================================

CREATE DATABASE IF NOT EXISTS alianca_com_cristo
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE alianca_com_cristo;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  usuario VARCHAR(80) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  cargo VARCHAR(80) DEFAULT 'coordenador',
  ativo BOOLEAN DEFAULT TRUE,
  ultimo_login DATETIME NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  acao VARCHAR(50) NOT NULL,
  descricao VARCHAR(255),
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS publicacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT NOT NULL,
  categoria ENUM('retiro', 'sexta_santa', 'momentos', 'saiba_mais') NOT NULL,
  subcategoria VARCHAR(150) NOT NULL,
  tipo ENUM('foto', 'video') NOT NULL,
  arquivo VARCHAR(255) NOT NULL,
  tempo_inicio FLOAT DEFAULT 0,
  tempo_fim FLOAT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  criado_por INT NOT NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (criado_por) REFERENCES usuarios(id)
);

-- Caso a tabela publicacoes já existisse sem estas colunas
-- (instalação anterior), adiciona agora:
-- ALTER TABLE publicacoes ADD COLUMN tempo_inicio FLOAT DEFAULT 0;
-- ALTER TABLE publicacoes ADD COLUMN tempo_fim FLOAT NULL;

-- ------------------------------------------------------------
-- Usuário administrador / coordenador
-- ------------------------------------------------------------
-- 1) Gere o hash da senha rodando:  node gerarHash.js
--    (já está configurado para a senha AlCrist02022)
-- 2) Cole o hash gerado no lugar de 'COLE_O_HASH_AQUI' abaixo.
-- 3) Se já existir um usuário antigo, delete-o antes:
--    DELETE FROM usuarios WHERE usuario = 'nome_do_usuario_antigo';

INSERT INTO usuarios (nome, usuario, senha, cargo, ativo)
VALUES ('Administrador', 'AdminACristo', '$2b$12$bGnwgKRvljp90DZVSAab.OYrDEZGcFqNRot07an./Shz2PDQMm/Ca', 'coordenador', TRUE)
ON DUPLICATE KEY UPDATE
  senha = VALUES(senha),
  ativo = TRUE;
