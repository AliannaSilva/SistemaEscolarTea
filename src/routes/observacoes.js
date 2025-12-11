// routes/observacoes.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const auth = require('../middlewares/auth');
const { permitirTipos } = require('../middlewares/roles');

const db = new sqlite3.Database(__dirname + '/../database/database.db');

// listar observações
router.get('/', auth, (req, res) => {
  const sql = `
    SELECT o.*, a.nome AS aluno_nome, a.turma AS aluno_turma
    FROM observacoes o
    JOIN alunos a ON a.id = o.id_aluno
    ORDER BY datetime(o.data_registro) DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// criar observação
router.post('/', auth, permitirTipos('coordenador','professor'), (req, res) => {
  const { id_aluno, texto, data_registro } = req.body;
  if (!id_aluno || !texto) return res.status(400).json({ error: 'Campos obrigatórios faltando.' });

  const sql = `INSERT INTO observacoes (id_aluno, texto, data_registro) VALUES (?, ?, ?)`;
  db.run(sql, [id_aluno, texto, data_registro || new Date().toISOString()], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, id_aluno, texto, data_registro });
  });
});

// deletar observação
router.delete('/:id', auth, permitirTipos('coordenador'), (req, res) => {
  db.run('DELETE FROM observacoes WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Observação removida com sucesso' });
  });
});

module.exports = router;
