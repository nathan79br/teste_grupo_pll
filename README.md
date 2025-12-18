# API Estados e Cidades do Brasil
API REST para gerir Estados e Cidades do Brasil, com autenticação por token fixo e banco relacional. Implementa CRUD de Cidades e leitura de Estados, seguindo o enunciado do teste técnico.

## Objetivo do Desafio
### Validar, de ponta a ponta:
* Lógica de programação
* Modelagem e uso de banco relacional
* Construção de APIs REST
* Organização e qualidade de código
* Boas práticas de versionamento com Git
* Entrega: uma API simples com CRUD integrada a um banco relacional, com histórico Git limpo e README claro.

## Stack
* Node.js + Express
* MySQL (pode ser PostgreSQL/MariaDB, mas este projeto usa MySQL)
* mysql2/promise
* Dotenv (configuração por variáveis de ambiente)
* cURL/Postman/Insomnia para testes

## Autenticação
### A API exige token fixo em todos os endpoints de negócio:
* Header: Authorization: Bearer TOKEN_FIXO
No projeto, o token é lido da variável de ambiente API_TOKEN.

## Arquitetura e Pastas
* routes/index.js
  * Define as rotas REST e mapeia para os controllers
*controllers/estadosController.js
  *Lógica de “Estados” (listagem e consulta)
* controllers/cidadesController.js
  * Lógica de “Cidades” (CRUD)
* database/connection.js
  * Pool de conexões MySQL e utilitário de health-check (ping)
* middlewares/auth.js (se aplicável)
  * Validação do token Bearer
* server/index.js ou app.js (entrypoint)
  * Sobe o Express, configura middlewares, monta /api e rota /health
* scripts/sql/ (opcional)
  * DDL e seeds, se você optar por versionar os scripts

## Banco de Dados
Modelagem mínima exigida:
* Estado
  * id (PK)
  * nome (ex.: “São Paulo”)
  * uf (CHAR(2), único, ex.: “SP”)

* cidade
  * id (PK)
  * nome
  * estado_uf (FK → estado.uf)

* Regras:
  * FK válida de cidade.estado_uf para estado.uf
  * uf único
  * Incluir script SQL ou migrations

# Instalação e Execução
Pré-requisitos:
* Node 18+
* MySQL em execução (ou Docker)

## 1. Clone e instale
git clone https://github.com/nathan79br/teste_grupo_pll.git

cd teste_grupo_pll

npm install


## 2. Configure o .env:
DB_HOST=127.0.0.1

DB_USER=root

DB_PASS=senha

DB_NAME=teste_pll

DB_PORT=3306

PORT=3000

API_TOKEN=TOKEN_FIXO


## 3. Crie o schema e (opcional) popule “estado”
Rode os scripts em scripts/sql.

## 4. Suba o servidor
npm run dev

## 5.Health-check
curl -v http://127.0.0.1:3000/health

# Endpoints
## Base URL: http://127.0.0.1:3000/api
### Autenticação: Authorization: Bearer TOKEN_FIXO

### Estados
* GET /estados → lista todos os estados
* GET /estados/{uf} → retorna um estado pela UF (ex.: SP)

### Cidades
* GET /cidades → listagem (com paginação simples: ?page=1&limit=100)
* GET /cidades/{id} → retorna uma cidade
* POST /cidades → cria uma cidade
* PUT /cidades/{id} → edita uma cidade
* DELETE /cidades/{id} → remove uma cidade

### Códigos de status (exemplos):
* 200 OK, 201 Created, 204 No Content
* 400 Bad Request (validações)
* 401 Unauthorized (token ausente/incorreto)
* 404 Not Found
* 409 Conflict (duplicidade)
* 500 Internal Server Error

## Testes Rápidos (cURL)
### Windows PowerShell
$env:TOKEN = "TOKEN_FIXO"

iwr "http://127.0.0.1:3000/api/estados" -Headers @{Authorization = "Bearer $env:TOKEN"}

iwr "http://127.0.0.1:3000/api/estados/SP" -Headers @{Authorization = "Bearer $env:TOKEN"}

irm "http://127.0.0.1:3000/api/cidades" -Method Post `

  -Headers @{ Authorization = "Bearer $env:TOKEN" } `
  
  -ContentType "application/json" `
  
  -Body '{"nome":"Campinas","estado_uf":"SP"}'
