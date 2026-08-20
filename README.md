# Elite Dev - Plataforma de Eventos e Ingressos

Plataforma de sessoes de cinema com tres perfis de acesso:

- **Cliente**: consulta sessoes, escolhe um assento, realiza o checkout simulado e consulta seus ingressos.
- **Organizador**: importa filmes do TMDb e publica sessoes com data, local, preco, capacidade e mapa de assentos.
- **Portaria**: responsavel por validar ingressos na entrada por codigo digitado ou leitura de QR Code pela camera.

## Tecnologias

- Frontend: Next.js, React, TypeScript e Tailwind CSS.
- Backend: Python, FastAPI e JWT.
- Banco: MySQL 8.
- Integracao externa: TMDb.
- Execucao recomendada: Docker Compose.

## Pre-requisitos

- Docker Desktop com Docker Compose.
- Uma chave da API do TMDb: https://www.themoviedb.org/settings/api

Nao e necessario instalar Node.js ou Python para executar a versao Docker.

## Configuracao com Docker

1. Copie o arquivo de exemplo:

```powershell
Copy-Item .env.example .env
```

2. Edite `.env` e informe os valores:

```env
JWT_SECRET_KEY=use-uma-chave-longa-e-aleatoria
TMDB_API_KEY=sua-chave-tmdb
NEXT_PUBLIC_TMDB_API_KEY=sua-chave-tmdb
```

3. Suba todos os servicos:

```powershell
docker compose up --build
```

A aplicacao estara disponivel em:

- Frontend: http://localhost:3000
- API: http://localhost:8000
- Documentacao da API: http://localhost:8000/docs
- MySQL: localhost:3306

Para executar em segundo plano:

```powershell
docker compose up --build -d
```

Para parar os servicos:

```powershell
docker compose down
```

### Recriar o banco do zero

O `schema.sql` e executado automaticamente apenas quando o volume do MySQL e criado pela primeira vez. Para recriar as tabelas em um ambiente local:

```powershell
docker compose down -v
docker compose up --build
```

O comando `down -v` apaga os dados locais do banco.

## Execucao sem Docker

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

Configure o arquivo `.env` na raiz do projeto com o acesso ao MySQL, a chave do TMDb e o segredo JWT.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Configure `frontend/.env.local` com:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_TMDB_API_KEY=sua-chave-tmdb
```

## Fluxo manual de teste

1. Cadastre um usuario com perfil `ORGANIZER`.
2. Entre no catalogo e crie uma sessao a partir de um filme do TMDb ou pelo formulario manual.
3. Saia e cadastre um usuario com perfil `CLIENT`.
4. Na vitrine, abra a sessao, escolha uma poltrona e finalize o checkout.
5. Acesse **Meus ingressos** para visualizar o codigo e o QR Code.
6. Na portaria, valide o ingresso digitando o codigo ou lendo o QR Code pela camera.

Para criar dados iniciais de avaliacao depois que os containers estiverem ativos:

```powershell
docker compose exec backend python seed.py
```

O seed cria usuarios de demonstracao, uma sessao no Cinemark de Sao Jose dos Campos, 50 assentos e um ingresso valido.

Credenciais de demonstracao:

- Organizador: `organizer.demo@example.com` / `Demo@123456`
- Cliente: `client.demo@example.com` / `Demo@123456`
- Portaria: `gatekeeper.demo@example.com` / `Demo@123456`
- Ingresso: `TKT-DEMO2026`

## Estado atual

O projeto possui autenticacao com tres papeis, catalogo TMDb paginado, criacao e edicao de sessoes, sala padrao no Cinemark de Sao Jose dos Campos, limite de 50 assentos, bloqueio temporario de lugares, vitrine, compra simulada, carteira de ingressos, compartilhamento por link, QR Code para entrada e leitura por camera na portaria.

O pagamento e propositalmente simulado: cartao terminado em `0000` representa uma recusa; PIX exibe um QR Code ficticio e um codigo copia-e-cola sem cobranca real.

## Historico de desenvolvimento

- Escolha de React/Next.js, FastAPI, MySQL 8, Docker, DBeaver, Git e GitHub.
- Criacao da estrutura Docker, `.gitignore` e modelagem inicial em `schema.sql`.
- Remocao do Prisma por menor familiaridade com a ferramenta.
- Implementacao do pool assincro de conexoes com `aiomysql` e helpers de banco.
- Integracao assincrona com o TMDb usando `httpx`, incluindo catalogo paginado.
- Criacao das rotas de autenticacao, eventos, assentos e ingressos com papeis CLIENT, ORGANIZER e GATEKEEPER.
- Construcao gradual das telas Next.js, com catalogo, vitrine, selecao de assentos, carteira, organizacao de eventos e portaria.
- Correcao do problema de decodificacao do JWT causado pelo tipo do campo `sub`.
- Implementacao da reserva temporaria com expiracao e liberacao automatica de assentos vencidos.
- Adicao de valores padrao, limite de 50 assentos e bloqueio de datas passadas.
- Implementacao do checkout simulado, recusa controlada de cartao e PIX ficticio.
- Adicao de compartilhamento de ingresso por link, seed de avaliacao e leitura de QR Code pela camera.

## Decisoes de projeto e uso de IA

Este projeto utilizou IA como apoio para exploracao do repositorio, diagnostico de erros, implementacao incremental e revisao de configuracao. As decisoes de escopo, escolha do fluxo de assentos, organizacao visual e priorizacao dos requisitos devem ser registradas aqui pelo autor, junto com os artefatos de analise produzidos durante o desenvolvimento.

## Licenca

Projeto desenvolvido para fins de avaliacao tecnica.
