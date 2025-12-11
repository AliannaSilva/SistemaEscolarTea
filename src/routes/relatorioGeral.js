// routes/relatorio.js
const express = require('express');
const PDFDocument = require('pdfkit');
const sqlite3 = require('sqlite3').verbose();
const auth = require('../middlewares/auth');
const { permitirTipos } = require('../middlewares/roles');

const router = express.Router();
const db = new sqlite3.Database(__dirname + '/../database/database.db');

router.get('/geral', auth, permitirTipos('coordenador'), (req, res) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="relatorio-geral.pdf"');
  doc.pipe(res);

  doc.fontSize(18).text('Relatório Geral - Sistema Escolar', { align: 'center' });
  doc.moveDown();

  // Alunos
  doc.fontSize(14).text('Alunos', { underline: true });
  doc.moveDown(0.5);
  db.all('SELECT * FROM alunos ORDER BY nome', [], (err, alunos) => {
    if (err) {
      doc.text('Erro ao carregar alunos.');
      doc.end();
      return;
    }
    alunos.forEach(a => doc.fontSize(11).text(`${a.nome} | Turma: ${a.turma || '-'} | TEA: ${a.possui_tea ? 'Sim' : 'Não'}`));
    doc.moveDown();

    // Atividades
    doc.fontSize(14).text('Atividades', { underline: true });
    doc.moveDown(0.5);
    db.all('SELECT * FROM atividades ORDER BY data_entrega DESC', [], (err2, atividades) => {
      if (err2) { doc.text('Erro ao carregar atividades.'); doc.end(); return; }
      atividades.forEach(atv => doc.fontSize(11).text(`${atv.titulo} | Turma: ${atv.turma || '-'} | Entrega: ${atv.data_entrega || '-' } | ${atv.adaptada ? 'Adaptada' : 'Normal'}`));
      doc.moveDown();

      // Notas
      doc.fontSize(14).text('Notas', { underline: true });
      doc.moveDown(0.5);
      const sqlNotas = `
        SELECT n.*, a.nome AS aluno_nome, a.turma AS aluno_turma, t.titulo AS atividade_titulo
        FROM notas n
        JOIN alunos a ON a.id = n.id_aluno
        JOIN atividades t ON t.id = n.id_atividade
        ORDER BY datetime(n.data_registro) DESC
      `;
      db.all(sqlNotas, [], (err3, notas) => {
        if (err3) { doc.text('Erro ao carregar notas.'); doc.end(); return; }
        if (!notas || notas.length === 0) {
          doc.fontSize(11).text('Nenhuma nota registrada.');
        } else {
          notas.forEach(n => {
            doc.fontSize(11).text(`${formatDate(n.data_registro)} | ${n.aluno_nome} (Turma ${n.aluno_turma}) — ${n.atividade_titulo} → Nota: ${n.valor} ${n.observacao ? '| ' + n.observacao : ''}`);
          });
        }

        doc.moveDown(2);
        doc.fontSize(10).text('Relatório gerado automaticamente pelo Sistema Escolar.');
        doc.end();
      });
    });
  });

  function formatDate(d) {
    if (!d) return '-';
    const di = new Date(d);
    if (isNaN(di)) return d;
    return di.toLocaleDateString('pt-BR');
  }
});

module.exports = router;
