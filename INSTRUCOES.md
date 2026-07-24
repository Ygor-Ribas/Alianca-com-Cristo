# O que foi feito

## 1. Login e senha novos (adminACristo / AlCrist02022)
O login não fica no código — fica no banco MySQL, na tabela `usuarios`, com a senha
criptografada (bcrypt). Por isso eu **não consigo trocar isso sozinho** (não tenho
acesso ao seu banco). Faça assim:

1. Substitua o `gerarHash.js` do seu projeto pelo que estou te enviando (já vem
   configurado para gerar o hash de `AlCrist02022`).
2. No terminal, dentro da pasta do projeto, rode:
   ```
   node gerarHash.js
   ```
3. Vai aparecer um hash tipo `$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx...`.
   Copie esse valor.
4. No seu banco (MySQL Workbench, phpMyAdmin, ou terminal `mysql`), rode:

   **Se já existe um usuário coordenador e você quer só trocar o login/senha dele:**
   ```sql
   UPDATE usuarios
   SET usuario = 'adminACristo', senha = 'COLE_O_HASH_AQUI'
   WHERE id = 1; -- troque pelo id certo se houver mais de um usuário
   ```

   **Se ainda não existe nenhum usuário (tabela vazia):**
   ```sql
   INSERT INTO usuarios (nome, usuario, senha, cargo, ativo)
   VALUES ('Coordenação', 'adminACristo', 'COLE_O_HASH_AQUI', 'coordenador', TRUE);
   ```

Depois disso, o login em `index.html` → botão "Publicar" passa a aceitar
usuário `adminACristo` e senha `AlCrist02022`.

## 2. Coordenadores não conseguiam ver o que adicionavam/excluíam
Achei a causa: as páginas `indexRetiro.html`, `indexSextaSanta.html`,
`indexMomentos.html` e `indexSaibaMais.html` já chamavam um script chamado
`publicacoesPublicas.js` para mostrar as fotos/vídeos publicados — só que esse
arquivo nunca existiu no projeto. Ou seja, o painel dos coordenadores até
salvava as publicações no banco (upload, edição e exclusão já funcionavam por trás),
mas elas nunca apareciam em nenhuma página pública.

Criei o arquivo `publicacoesPublicas.js` — coloque ele na raiz do projeto,
junto dos outros `.js`. Ele lê a categoria de cada página, busca em `/publicacoes`
e mostra as fotos/vídeos correspondentes automaticamente. Assim que subir esse
arquivo, tudo que os coordenadores adicionarem ou excluírem no painel
(`indexCoordenadores.html`) passa a refletir nas páginas Retiro, Sexta Santa,
Momentos e Saiba Mais.

Nenhuma mudança foi necessária no `server.js` — as rotas de upload, edição e
exclusão já estavam certas.

## 3. Fundo responsivo em todas as telas
Mantive a mesma imagem (`imagend/fundogrupo.webp`), só ajustei o CSS em
`style.css`, `styleEventos.css`, `coordenadores.css` e `loja.css`:

- Adicionei uma cor de fundo sólida (`#0d0d0d`) atrás da imagem, pra não dar
  aquele "flash" branco enquanto ela carrega, e pra cobrir bordas em telas
  muito largas ou muito estreitas.
- Troquei `100vh` por `100dvh` (com fallback), que resolve o problema clássico
  do fundo "cortando" embaixo em celulares por causa da barra de endereço do
  navegador.
- O fundo `fixed` (efeito parallax) agora só é usado em telas com mouse
  (desktop/notebook). Qualquer tela de toque — celular, tablet, notebook
  2 em 1, **independente do tamanho** — usa `scroll`, porque `fixed` trava e
  pisca em telas de toque (isso já existia parcialmente, mas só pra telas
  pequenas; agora cobre tablets grandes também, e o `loja.html` nem tinha
  essa correção).

# Arquivos nesta entrega
- `publicacoesPublicas.js` → **novo**, colocar na raiz do projeto
- `gerarHash.js` → atualizado (gera hash da nova senha)
- `style.css`, `styleEventos.css`, `coordenadores.css`, `loja.css` → fundo responsivo

# O que eu NÃO mudei (e por quê)
- Não toquei no `server.js`: as rotas de login, upload, edição e exclusão
  já estavam implementadas corretamente.
- Não troquei a imagem de fundo em si (você pediu pra manter a mesma) — só a
  forma como o CSS a exibe.
