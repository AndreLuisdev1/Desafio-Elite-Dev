# Elite Dev - Plataforma de Eventos e Ingressos

Plataforma de sessoes de cinema com tres perfis de acesso:

- **Cliente**: consulta sessoes, escolhe um assento, realiza o checkout simulado e consulta seus ingressos.
- **Organizador**: importa filmes do TMDb e publica sessoes com data, local, preco, capacidade e mapa de assentos.
- **Portaria**: responsavel por validar ingressos na entrada. A interface de scanner ainda esta em desenvolvimento.

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

Configure o arquivo `backend/.env` com o acesso ao MySQL e a chave do TMDb.

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
6. A validacao pela portaria possui endpoint no backend, mas a tela de leitura ainda precisa ser finalizada.

## Estado atual e proximos passos

O projeto ja possui autenticacao com tres papeis, catalogo TMDb, criacao de sessoes, geracao de assentos, vitrine, selecao de poltrona, checkout basico e carteira de ingressos.

Ainda faltam para fechar o escopo completo do desafio:

- tela de portaria com leitura de QR pela camera e digitacao manual;
- pagamento simulado com cenarios de aprovacao e recusa;
- reserva temporaria com proprietario e expiracao;
- protecao transacional contra compra concorrente do mesmo assento;
- compartilhamento de ingresso por link;
- dados semeados para avaliacao;
- testes automatizados dos fluxos criticos.

## Decisoes de projeto e uso de IA

Este projeto utilizou IA como apoio para exploracao do repositorio, diagnostico de erros, implementacao incremental e revisao de configuracao. As decisoes de escopo, escolha do fluxo de assentos, organizacao visual e priorizacao dos requisitos devem ser registradas aqui pelo autor, junto com os artefatos de analise produzidos durante o desenvolvimento.

## Licenca

Projeto desenvolvido para fins de avaliacao tecnica.
