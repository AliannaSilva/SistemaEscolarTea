require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();

// Middlewares globais
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../public")));

// ROTAS DO SISTEMA
app.use("/api/auth", require("./routes/auth"));
app.use("/api/alunos", require("./routes/alunos"));
app.use("/api/atividades", require("./routes/atividades"));
app.use("/api/notas", require("./routes/notas"));
app.use("/api/observacoes", require("./routes/observacoes"));
app.use("/api/relatorio", require("./routes/relatorioGeral"));

// Exporta para uso no Jest e no servidor
module.exports = app;