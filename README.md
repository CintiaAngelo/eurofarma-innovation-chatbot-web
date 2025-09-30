# Eurofarma Innovation Chatbot

Este repositório contém o **Chatbot de Inovação da Eurofarma**, uma aplicação completa dividida em dois projetos:

- **Backend**: [`eurofarma-chatbot-api`](./eurofarma-chatbot-api) — API construída em **Node.js (Express)** responsável pela lógica, persistência e integração.
- **Frontend**: [`eurofarma-chatbot-web`](./eurofarma-chatbot-web) — Aplicação em **Angular** responsável pela interface de usuário.

---

## 🚀 Tecnologias Principais

- **Backend**
  - Node.js
  - Express.js
  - Banco de dados relacional (configurado em `db.js`)
  - Dotenv para variáveis de ambiente
- **Frontend**
  - Angular
  - TypeScript
  - RxJS
  - HTML/CSS

---

## 📂 Estrutura do Repositório

```bash
.
├── eurofarma-chatbot-api/   # Backend (Node.js / Express)
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   └── ...
├── eurofarma-chatbot-web/   # Frontend (Angular)
│   ├── src/
│   ├── angular.json
│   ├── package.json
│   └── ...
└── README.md                # Este documento
```

---

## ⚙️ Arquitetura

A arquitetura do sistema é baseada em duas camadas principais:

1. **API Backend (Node.js)**  
   Responsável por expor endpoints REST para o chatbot e manipulação de dados.

2. **Frontend (Angular)**  
   Interface que consome a API, apresentando chatbot, formulários e recursos administrativos.

---

## ▶️ Como Rodar o Projeto

### Pré-requisitos
- Node.js (>= 18.x)
- npm (>= 9.x)
- Angular CLI (>= 17.x)
- Banco de dados configurado (ver instruções no backend)

### Passos

Clone o repositório:
```bash
git clone https://github.com/CintiaAngelo/eurofarma-innovation-chatbot-web.git
cd eurofarma-innovation-chatbot-web
```

#### Rodar o Backend
```bash
cd eurofarma-chatbot-api
npm install
npm start
```

#### Rodar o Frontend
```bash
cd eurofarma-chatbot-web
npm install
ng serve
```

Acesse em: `http://localhost:4200`

---

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch com sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📜 Licença

Projeto desenvolvido para fins educacionais e internos. Direitos reservados à **Eurofarma**.
