const express = require("express");
const app = express();
app.use(express.json());

// ================================================
// Config
// ================================================
const MAX_MESSAGES = 100;  // máximo de mensagens guardadas
const MAX_CONTENT  = 200;  // máximo de caracteres por mensagem
const SECRET_KEY   = "davidhub2025"; // chave secreta pra evitar spam externo

// ================================================
// Banco de mensagens em memória
// ================================================
let messages = [];
let nextId   = 1;

// ================================================
// Middleware de autenticação simples
// ================================================
function auth(req, res, next) {
    const key = req.headers["x-secret-key"];
    if (key !== SECRET_KEY) {
        return res.status(401).json({ error: "Chave inválida" });
    }
    next();
}

// ================================================
// GET /messages?after=ID
// Retorna mensagens novas depois de um ID
// ================================================
app.get("/messages", auth, (req, res) => {
    const after = parseInt(req.query.after) || 0;
    const result = messages.filter(m => m.id > after);
    res.json(result);
});

// ================================================
// POST /messages
// Envia uma mensagem nova
// ================================================
app.post("/messages", auth, (req, res) => {
    const { author, content } = req.body;

    if (!author || !content) {
        return res.status(400).json({ error: "author e content são obrigatórios" });
    }

    if (content.length > MAX_CONTENT) {
        return res.status(400).json({ error: "Mensagem muito longa" });
    }

    // Sanitiza strings
    const safeAuthor  = String(author).slice(0, 50).replace(/[<>]/g, "");
    const safeContent = String(content).slice(0, MAX_CONTENT).replace(/[<>]/g, "");

    const msg = {
        id:      nextId++,
        author:  safeAuthor,
        content: safeContent,
        time:    new Date().toISOString(),
    };

    messages.push(msg);

    // Limpa mensagens antigas se passar do limite
    if (messages.length > MAX_MESSAGES) {
        messages = messages.slice(-MAX_MESSAGES);
    }

    res.status(201).json(msg);
});

// ================================================
// GET /ping — pra checar se tá online
// ================================================
app.get("/ping", (req, res) => {
    res.json({ status: "ok", messages: messages.length });
});

// ================================================
// Start
// ================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Chat API rodando na porta ${PORT}`);
});
