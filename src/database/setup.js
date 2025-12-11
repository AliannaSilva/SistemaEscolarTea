// src/database/setup.js
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const DB_PATH = path.join(__dirname, "database.db");
const INIT_SQL_PATH = path.join(__dirname, "init.sql");

let initSQL = "";
try {
  initSQL = fs.readFileSync(INIT_SQL_PATH, "utf8");
} catch (err) {
  console.error("❌ ERRO: Não foi possível ler o arquivo init.sql:", INIT_SQL_PATH);
  console.error(err);
  process.exit(1);
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("❌ Erro ao abrir/criar o banco:", err);
    process.exit(1);
  }
});

db.exec("PRAGMA foreign_keys = ON;", (e) => {
  if (e) console.error("Erro ativando foreign_keys:", e);
  db.exec(initSQL, (err) => {
    if (err) {
      console.error("❌ Erro ao executar init.sql:");
      console.error(err);
      process.exit(1);
    } else {
      console.log("✅ Banco de dados criado/atualizado com sucesso em:", DB_PATH);
      console.log("Se quiser resetar (apagar dados existentes), edite init.sql para incluir DROP TABLE ... antes dos CREATEs.");
    }
    db.close();
  });
});

