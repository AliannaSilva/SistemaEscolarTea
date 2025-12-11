-- src/database/init.sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  email TEXT UNIQUE,
  senha TEXT,
  tipo TEXT
);

CREATE TABLE IF NOT EXISTS alunos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  turma TEXT,
  data_nascimento TEXT,
  possui_tea INTEGER DEFAULT 0,
  laudo_entregue TEXT,
  nivel_tea TEXT,
  status_atualizacao TEXT DEFAULT 'Ativo'
);

CREATE TABLE IF NOT EXISTS atividades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_entrega TEXT,
  adaptada INTEGER DEFAULT 0,
  id_aluno_tea INTEGER,
  turma TEXT,
  FOREIGN KEY (id_aluno_tea) REFERENCES alunos(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_aluno INTEGER NOT NULL,
  id_atividade INTEGER NOT NULL,
  valor REAL,
  observacao TEXT,
  data_registro TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (id_aluno) REFERENCES alunos(id) ON DELETE CASCADE,
  FOREIGN KEY (id_atividade) REFERENCES atividades(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS observacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_aluno INTEGER NOT NULL,
  texto TEXT,
  data_registro TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (id_aluno) REFERENCES alunos(id) ON DELETE CASCADE
);
