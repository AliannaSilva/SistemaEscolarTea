const request = require("supertest");
const { execSync } = require("child_process");
const app = require("../src/app");

let token = "";
let alunoId = "";

beforeAll(async () => {
  execSync("node src/database/setup.js");

  await request(app).post("/api/auth/register").send({
    nome: "Admin",
    email: "admin@test.com",
    senha: "123456",
    tipo: "coordenador"
  });

  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@test.com", senha: "123456" });

  token = login.body.token;

  const aluno = await request(app)
    .post("/api/alunos")
    .set("Authorization", `Bearer ${token}`)
    .send({
      nome: "Aluno Teste",
      turma: "1A",
      data_nascimento: "2009-01-01",
      possui_tea: 0
    });

  alunoId = aluno.body.id;
});

describe("TESTES ATIVIDADES", () => {
  it("POST /api/atividades deve criar atividade", async () => {
    const res = await request(app)
      .post("/api/atividades")
      .set("Authorization", `Bearer ${token}`)
      .send({
        titulo: "Prova de Matemática",
        descricao: "Capítulo 4",
        data_entrega: "2025-10-20",
        adaptada: 0,
        turma: "1A",
        id_aluno_tea: null
      });

    expect([200, 201]).toContain(res.status);
  });

  it("GET /api/atividades deve listar atividades", async () => {
    const res = await request(app)
      .get("/api/atividades")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
