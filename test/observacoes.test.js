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
      nome: "Aluno Observação",
      turma: "2A",
      data_nascimento: "2011-02-10",
      possui_tea: 0
    });

  alunoId = aluno.body.id;
});

describe("TESTES OBSERVAÇÕES", () => {
  it("POST /api/observacoes deve criar observação", async () => {
    const res = await request(app)
      .post("/api/observacoes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id_aluno: alunoId,
        texto: "Aluno apresentou bom comportamento",
        data_registro: "2025-01-01 10:00:00"
      });

    expect([200, 201]).toContain(res.status);
  });

  it("GET /api/observacoes deve listar observações", async () => {
    const res = await request(app)
      .get("/api/observacoes")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
