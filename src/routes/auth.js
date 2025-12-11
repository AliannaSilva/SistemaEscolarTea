const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const db = new sqlite3.Database(__dirname + '/../database/database.db');

/* ============================================================
   REGISTRO DE USUÁRIO
============================================================ */
router.post('/register', (req, res) => {
  const { nome, email, senha, tipo } = req.body;

  // Validação básica
  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
  }

  // Verificar se e-mail já existe
  db.get('SELECT id FROM usuarios WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (row) {
      return res.status(400).json({ error: 'E-mail já está cadastrado.' });
    }

    const hash = bcrypt.hashSync(senha, 10);

    const sql = `
      INSERT INTO usuarios (nome, email, senha_hash, tipo)
      VALUES (?, ?, ?, ?)
    `;

    db.run(
      sql,
      [
        nome,
        email,
        hash,             // SENHA CORRETAMENTE CRIPTOGRAFADA
        tipo || 'professor'
      ],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        res.status(201).json({
          id: this.lastID,
          nome,
          email,
          tipo: tipo || 'professor'
        });
      }
    );
  });
});

/* ============================================================
   LOGIN DE USUÁRIO
============================================================ */
router.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' });
  }

  db.get('SELECT * FROM usuarios WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    // Valida senha
    const senhaValida = bcrypt.compareSync(senha, user.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        tipo: user.tipo,
        nome: user.nome
      },
      process.env.JWT_SECRET || 'segredo123', // SEGREDO SEMPRE DEFINIDO
      { expiresIn: '8h' }
    );

    res.json({
      auth: true,
      token,
      nome: user.nome,
      tipo: user.tipo
    });
  });
});

module.exports = router;
