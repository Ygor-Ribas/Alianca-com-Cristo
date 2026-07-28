# Aliança com Cristo — Guia de instalação e segurança

## 1. O que mudou nesta versão

- **Login novo:** usuário `AdminACristo`, senha `AlCrist02022`.
- **Retiro e Sexta-Feira Santa foram esvaziados.** As páginas não têm mais
  nenhuma foto/vídeo fixo no código — agora funcionam exatamente como
  "Momentos" e "Saiba Mais": tudo o que aparece vem do que o coordenador
  publicar no painel. Para colocar conteúdo nelas, publique no painel
  escolhendo a categoria "Retiro" ou "Sexta Santa".
- **Painel do coordenador** ganhou um controle de **recorte de vídeo**
  (início/fim) para escolher qual trecho do vídeo aparece no site.
- **Segurança do servidor reforçada** (detalhado abaixo).
- **Proteções contra download fácil** de fotos e vídeos (com uma ressalva
  importante — leia a seção 4).

## 2. Instalação

```bash
npm install
cp .env.example .env
```

Edite o `.env` com os dados reais do seu banco MySQL e gere um segredo de
sessão novo:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Cole o valor gerado em `SESSION_SECRET` no `.env`.

### Banco de dados

```bash
node gerarHash.js
```

Copie o hash impresso no terminal e cole no arquivo `banco-de-dados.sql`,
no lugar de `COLE_O_HASH_AQUI`. Depois rode:

```bash
mysql -u root -p < banco-de-dados.sql
```

> **Windows / PowerShell:** o operador `<` não funciona no PowerShell.
> Use um destes lugares:
> ```powershell
> Get-Content banco-de-dados.sql | mysql -u root -p
> ```
> ou rode o comando original (`mysql -u root -p < banco-de-dados.sql`) no
> **cmd.exe** (Prompt de Comando), não no PowerShell.

Isso cria as tabelas (se não existirem) e cria/atualiza o usuário
`AdminACristo` com a senha `AlCrist02022`. **Se já existia um usuário de
login antigo, apague-o** com:

```sql
DELETE FROM usuarios WHERE usuario = 'usuario_antigo_aqui';
```

### Rodar o site

```bash
npm start
```

## 3. O que foi reforçado na segurança

- **Sem segredo padrão no código:** o servidor agora recusa iniciar se
  `SESSION_SECRET`, dados do banco etc. não estiverem no `.env` — antes
  havia uma senha de sessão fixa no código-fonte, visível a qualquer um
  com acesso ao repositório.
- **Limite de tentativas de login** (proteção contra força bruta): 8
  tentativas a cada 15 minutos por IP.
- **Token de segurança (CSRF)** exigido em login, upload, edição, exclusão
  e logout — impede que outro site force seu navegador a executar essas
  ações sem você saber.
- **Verificação real do arquivo enviado:** o servidor confere a
  "assinatura" do arquivo (magic bytes), não só o tipo informado pelo
  navegador, que pode ser falsificado.
- **Imagens são reprocessadas no servidor** (remove metadados/EXIF,
  redimensiona para no máximo 1920px), o que também impede que uma foto
  de celular gigantesca "estoure" o layout do site.
- **Nomes de arquivo aleatórios** no servidor (em vez de usar o nome
  original do upload), reduzindo a chance de sobrescrita ou de adivinhar
  nomes de arquivos.
- **Cookies de sessão**: `httpOnly`, `SameSite=Strict` e `Secure` em
  produção (exige HTTPS).
- **Cabeçalhos de segurança (Helmet)**: Content-Security-Policy,
  `X-Content-Type-Options`, `Referrer-Policy: no-referrer`,
  `frame-ancestors: none` (impede que o site seja carregado dentro de um
  `<iframe>` em outro domínio).
- **Mensagens de erro de login genéricas**, para não revelar se o usuário
  digitado existe ou não.
- **Sessão regenerada a cada login**, evitando fixação de sessão.

## 4. Sobre "impedir download e gravação de tela" — leitura importante

Fiz tudo o que é tecnicamente possível para **dificultar** o download
casual e o uso indevido do conteúdo:

- Botão de download desativado no player de vídeo (`controlsList="nodownload"`).
- Menu de clique direito desativado em fotos e vídeos.
- Arraste (drag) de imagens/vídeos desativado.
- "Salvar imagem"/"Copiar" via toque longo desativado no celular.
- Vídeo pausa automaticamente se a aba perder o foco.
- Nenhum link direto de download é exposto — a mídia é sempre exibida
  dentro do player/imagem da página.

**Preciso ser honesto:** nenhum site — nem os grandes serviços de
streaming como Netflix ou YouTube — consegue impedir 100% o download ou
a gravação de tela de um conteúdo. Qualquer coisa que aparece na tela de
alguém pode, em última instância, ser capturada pelo sistema operacional
(gravador de tela nativo) ou até fotografada com outro aparelho. Isso não
é uma limitação deste site: é uma limitação de qualquer conteúdo exibido
em um navegador. As proteções acima aumentam bastante a dificuldade e
afastam o usuário casual, mas não é possível prometer bloqueio total —
e eu não quero te dar uma falsa sensação de segurança nesse ponto.

## 5. Como funciona o recorte de vídeo

Cortar fisicamente um vídeo (gerar um novo arquivo menor) exige um
processo de recodificação (ex.: FFmpeg) rodando no servidor, o que nem
todo ambiente de hospedagem tem instalado. Por isso, implementei uma
solução que funciona em qualquer lugar: o coordenador marca o **ponto de
início e fim** do trecho desejado ao publicar um vídeo, e o player no
site público automaticamente pula para esse início e para nesse fim —
sem precisar reenviar o arquivo cortado. O arquivo original fica
guardado, mas o público só vê o trecho selecionado.

Se no futuro vocês tiverem um servidor com FFmpeg instalado, dá para
evoluir isso para um corte real do arquivo — é só avisar.

## 6. Tamanho de exibição das fotos/vídeos

As publicações aparecem em cartões com tamanho controlado (largura
máxima e altura máxima definidas no CSS), então uma foto enviada em alta
resolução ou um vídeo em qualquer proporção sempre aparece em um
tamanho equilibrado — nunca "gigante" — e se adapta a celular, tablet e
desktop.

## 7. Antes de colocar no ar (checklist)

- [ ] Trocar a senha do banco de dados (`0010` é fraca).
- [ ] Gerar um `SESSION_SECRET` novo e aleatório (não usar o de exemplo).
- [ ] Rodar o site com HTTPS e `NODE_ENV=production`.
- [ ] Rodar `banco-de-dados.sql` e apagar qualquer usuário de login antigo.
- [ ] Conferir que a pasta `uploads/` e o arquivo `.env` **não** vão para o
      GitHub (já protegidos pelo `.gitignore`).
- [ ] Se o terminal mostrar alguma mensagem estranha ao rodar `npm install`
      ou `npm start` (links para sites desconhecidos, textos que parecem
      "instruções" em vez de logs normais), rode `npm ls dotenv` e confira
      se o pacote instalado é mesmo o oficial (`registry.npmjs.org`) antes
      de continuar.
