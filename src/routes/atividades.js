// routes/atividades.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const auth = require('../middlewares/auth');
const { permitirTipos } = require('../middlewares/roles');

const db = new sqlite3.Database(__dirname + '/../database/database.db');

// listar atividades (inclui nome do aluno TEA se houver)
router.get('/', auth, permitirTipos('coordenador','professor'), (req, res) => {
  const sql = `
    SELECT a.*, al.nome AS aluno_nome
    FROM atividades a
    LEFT JOIN alunos al ON al.id = a.id_aluno_tea
    ORDER BY a.id DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// buscar por id
router.get('/:id', auth, permitirTipos('coordenador','professor'), (req, res) => {
  const sql = `
    SELECT a.*, al.nome AS aluno_nome
    FROM atividades a
    LEFT JOIN alunos al ON al.id = a.id_aluno_tea
    WHERE a.id = ?
  `;
  db.get(sql, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Atividade não encontrada' });
    res.json(row);
  });
});

// criar
router.post('/', auth, permitirTipos('coordenador','professor'), (req, res) => {
  const { titulo, descricao, data_entrega, adaptada, id_aluno_tea, turma } = req.body;
  if (!titulo || !turma) return res.status(400).json({ error: 'Título e turma são obrigatórios.' });

  const isAdaptada = adaptada ? 1 : 0;
  const idAlunoTea = isAdaptada && id_aluno_tea ? id_aluno_tea : null;

  const sql = `INSERT INTO atividades (titulo, descricao, data_entrega, adaptada, id_aluno_tea, turma) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(sql, [titulo, descricao || null, data_entrega || null, isAdaptada, idAlunoTea, turma], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// atualizar
router.put('/:id', auth, permitirTipos('coordenador','professor'), (req, res) => {
  const { titulo, descricao, data_entrega, adaptada, id_aluno_tea, turma } = req.body;
  if (!titulo || !turma) return res.status(400).json({ error: 'Título e turma são obrigatórios.' });

  const isAdaptada = adaptada ? 1 : 0;
  const idAlunoTea = isAdaptada && id_aluno_tea ? id_aluno_tea : null;

  const sql = `UPDATE atividades SET titulo = ?, descricao = ?, data_entrega = ?, adaptada = ?, id_aluno_tea = ?, turma = ? WHERE id = ?`;
  db.run(sql, [titulo, descricao || null, data_entrega || null, isAdaptada, idAlunoTea, turma, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

// deletar
router.delete('/:id', auth, permitirTipos('coordenador'), (req, res) => {
  db.run('DELETE FROM atividades WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Atividade removida' });
  });
});

module.exports = router;
