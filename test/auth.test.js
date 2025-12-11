const request = require("supertest");
const { execSync } = require("child_process");
const app = require("../src/app");

beforeAll(() => {
  execSync("node src/database/setup.js");
});

describe("TESTES DE AUTENTICAÇÃO", () => {
  it("Deve registrar e fazer login", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        nome: "Admin",
        email: "admin@test.com",
        senha: "123456",
        tipo: "coordenador"
      });

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@test.com",
        senha: "123456"
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});


