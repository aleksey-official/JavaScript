# Task Manager (Node.js + Express + PostgreSQL)

Backend web application built with Node.js, Express.js, and PostgreSQL, featuring JWT authentication, password hashing with `bcrypt`, task CRUD operations with owner/role checks, a simple frontend (`HTML`, `CSS`, `JS`), and integration tests (`node:test` + `supertest`).

## Project Structure

```text
my-backend/
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── src/
│   ├── app.js
│   ├── db.js
│   ├── middleware/
│   │   └── auth.js
│   └── routes/
│       ├── auth.js
│       └── tasks.js
├── tests/
│   └── api.test.js
├── .env.example
├── .gitignore
├── package.json
└── server.js