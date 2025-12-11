// routes/notas.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const auth = require('../middlewares/auth');
const { permitirTipos } = require('../middlewares/roles');

const db = new sqlite3.Database(__dirname + '/../database/database.db');

// listar todas as notas (inclui nome do aluno, turma do aluno e titulo da atividade)
router.get('/', auth, (req, res) => {
  const sql = `
    SELECT n.*, a.nome AS aluno_nome, a.turma AS aluno_turma, t.titulo AS atividade_titulo
    FROM notas n
    JOIN alunos a ON a.id = n.id_aluno
    JOIN atividades t ON t.id = n.id_atividade
    ORDER BY datetime(n.data_registro) DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// criar nota
router.post('/', auth, permitirTipos('coordenador','professor'), (req, res) => {
  const { id_aluno, id_atividade, valor, observacao } = req.body;
  if (!id_aluno || !id_atividade || valor === undefined) return res.status(400).json({ error: 'Campos obrigatórios faltando.' });

  const sql = `INSERT INTO notas (id_aluno, id_atividade, valor, observacao, data_registro) VALUES (?, ?, ?, ?, datetime('now'))`;
  db.run(sql, [id_aluno, id_atividade, valor, observacao || null], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, id_aluno, id_atividade, valor, observacao });
  });
});

// buscar nota por id
router.get('/:id', auth, (req, res) => {
  const sql = `
    SELECT n.*, a.nome AS aluno_nome, a.turma AS aluno_turma, t.titulo AS atividade_titulo
    FROM notas n
    JOIN alunos a ON a.id = n.id_aluno
    JOIN atividades t ON t.id = n.id_atividade
    WHERE n.id = ?
  `;
  db.get(sql, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Nota não encontrada' });
    res.json(row);
  });
});

// atualizar nota
router.put('/:id', auth, permitirTipos('coordenador','professor'), (req, res) => {
  const { valor, observacao } = req.body;
  if (valor === undefined) return res.status(400).json({ error: 'O campo valor é obrigatório.' });

  const sql = `UPDATE notas SET valor = ?, observacao = ? WHERE id = ?`;
  db.run(sql, [valor, observacao || null, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Nota atualizada com sucesso', changes: this.changes });
  });
});

// deletar nota
router.delete('/:id', auth, permitirTipos('coordenador'), (req, res) => {
  db.run('DELETE FROM notas WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Nota removida com sucesso' });
  });
});

module.exports = router;
