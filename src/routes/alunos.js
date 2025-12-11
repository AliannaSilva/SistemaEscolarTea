const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const auth = require('../middlewares/auth');
const { permitirTipos } = require('../middlewares/roles');

const db = new sqlite3.Database(__dirname + '/../database/database.db');

/* ============================================
   LISTAR TODOS OS ALUNOS  (professor + coordenador)
============================================ */
router.get('/', auth, (req, res) => {
  db.all(
    'SELECT * FROM alunos ORDER BY turma ASC, nome ASC',
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});

/* ============================================
   BUSCAR ALUNO POR ID  (professor + coordenador)
============================================ */
router.get('/:id', auth, (req, res) => {
  db.get(
    'SELECT * FROM alunos WHERE id = ?',
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Aluno não encontrado' });

      res.json(row);
    }
  );
});

/* ============================================
   CADASTRAR ALUNO  (SOMENTE COORDENADOR)
============================================ */
router.post('/', auth, permitirTipos('coordenador'), (req, res) => {

  let {
    nome,
    turma,
    data_nascimento,
    possui_tea,
    laudo_entregue,
    nivel_tea,
    status_atualizacao
  } = req.body;

  if (!possui_tea || possui_tea == 0) {
    laudo_entregue = "Não";
    nivel_tea = "";
  }

  const sql = `
    INSERT INTO alunos 
      (nome, turma, data_nascimento, possui_tea, laudo_entregue, nivel_tea, status_atualizacao)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [
      nome,
      turma,
      data_nascimento,
      possui_tea,
      laudo_entregue,
      nivel_tea,
      status_atualizacao
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      return res.status(201).json({
        id: this.lastID,
        nome,
        turma,
        data_nascimento,
        possui_tea,
        laudo_entregue,
        nivel_tea,
        status_atualizacao
      });
    }
  );
});

/* ============================================
   EDITAR ALUNO  (SOMENTE COORDENADOR)
============================================ */
router.put('/:id', auth, permitirTipos('coordenador'), (req, res) => {

  const { id } = req.params;
  
  let {
    nome,
    turma,
    data_nascimento,
    possui_tea,
    laudo_entregue,
    nivel_tea,
    status_atualizacao
  } = req.body;

  if (!possui_tea || possui_tea == 0) {
    laudo_entregue = "Não";
    nivel_tea = "";
  }

  const sql = `
    UPDATE alunos
    SET nome = ?, turma = ?, data_nascimento = ?, possui_tea = ?, 
        laudo_entregue = ?, nivel_tea = ?, status_atualizacao = ?
    WHERE id = ?
  `;

  db.run(
    sql,
    [
      nome,
      turma,
      data_nascimento,
      possui_tea,
      laudo_entregue,
      nivel_tea,
      status_atualizacao,
      id
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      return res.json({
        message: "Aluno atualizado",
        changes: this.changes
      });
    }
  );
});

/* ============================================
   DELETAR ALUNO  (SOMENTE COORDENADOR)
============================================ */
router.delete('/:id', auth, permitirTipos('coordenador'), (req, res) => {
  db.run(
    'DELETE FROM alunos WHERE id = ?',
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.json({ message: "Aluno removido com sucesso" });
    }
  );
});

module.exports = router;
