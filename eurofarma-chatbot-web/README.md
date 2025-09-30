# Eurofarma Chatbot Web

Este diretório contém o **frontend** do Eurofarma Innovation Chatbot, desenvolvido em **Angular**.

---

## 🚀 Tecnologias Utilizadas

- Angular
- TypeScript
- RxJS
- HTML5, CSS3
- Angular CLI

---

## 📂 Estrutura

```bash
eurofarma-chatbot-web/
├── src/
│   ├── app/
│   │   ├── component/
│   │   │   ├── chatbot/         # Componente do chatbot
│   │   │   ├── header/          # Cabeçalho
│   │   │   └── idea-form/       # Formulário de ideias
│   │   ├── admin/               # Módulo de administração
│   │   ├── app.ts               # App principal
│   │   └── ...
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── angular.json
├── package.json
└── ...
```

---

## ▶️ Executando o Frontend

### Pré-requisitos
- Node.js (>= 18.x)
- npm (>= 9.x)
- Angular CLI (>= 17.x)

### Instalação
```bash
npm install
```

### Executar
```bash
ng serve
```

O projeto ficará disponível em `http://localhost:4200`.

---

## 🔗 Integração com o Backend

Certifique-se de que o [backend](../eurofarma-chatbot-api) está rodando (`http://localhost:3000` por padrão).  
As chamadas HTTP do frontend utilizam esse endpoint para obter dados do chatbot e interagir com a API.

---

## 🤝 Contribuição

Siga as instruções no [README da raiz](../README.md).
