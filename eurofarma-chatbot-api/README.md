# Eurofarma Chatbot API

Este diretório contém o **backend** do Eurofarma Innovation Chatbot, desenvolvido em **Node.js** com **Express.js**.

---

## 🚀 Tecnologias Utilizadas

- Node.js
- Express.js
- Body-parser
- Dotenv
- Banco de dados relacional (conexão definida em `db.js`)
- JSON para árvore de decisão (`decisionTree.json`)

---

## 📂 Estrutura

```bash
eurofarma-chatbot-api/
├── server.js            # Ponto de entrada da aplicação
├── db.js                # Conexão com banco de dados
├── decisionTree.json    # Regras do chatbot
├── package.json         # Dependências
├── .env                 # Variáveis de ambiente
└── ...
```

---

## ▶️ Executando o Backend

### Pré-requisitos
- Node.js (>= 18.x)
- npm (>= 9.x)
- Banco de dados (ver `db.js` para detalhes de configuração)

### Instalação
```bash
npm install
```

### Executar
```bash
npm start
```

O servidor será iniciado em `http://localhost:3000` (porta padrão, pode variar conforme `.env`).

---

## 🔑 Variáveis de Ambiente

Defina um arquivo `.env` com as seguintes variáveis (exemplo):

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=senha
DB_NAME=eurofarma_chatbot
```

---

## 📡 Endpoints Principais

Alguns exemplos de endpoints expostos pela API (ajustar conforme implementação):

- `POST /chat` → Processa mensagens enviadas pelo usuário e retorna resposta do chatbot.
- `GET /ideas` → Lista ideias cadastradas.
- `POST /ideas` → Submete uma nova ideia.

---

## 🤝 Contribuição

Siga as instruções no [README da raiz](../README.md).
