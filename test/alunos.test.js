const request = require('supertest');
const { execSync } = require('child_process');
const app = require('../src/app');  // CAMINHO CORRETO

let token = "";

beforeAll(async () => {
  execSync('node src/database/setup.js');

  await request(app)
    .post('/api/auth/register')
    .send({
      nome: "Usuário Teste",
      email: "teste@teste.com",
      senha: "123456",
      tipo: "coordenador"
    });

  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: "teste@teste.com",
      senha: "123456"
    });

  token = res.body.token;
});

describe("TESTES API ALUNOS", () => {

  it('GET /api/alunos deve retornar lista', async () => {
    const res = await request(app)
      .get('/api/alunos')
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('POST /api/alunos deve criar aluno', async () => {
    const res = await request(app)
      .post('/api/alunos')
      .set("Authorization", `Bearer ${token}`)
      .send({
        nome: "Aluno Teste",
        turma: "1A",
        data_nascimento: "2010-01-01",
        possui_tea: 0
      });

    expect([200,201]).toContain(res.status);  // ACEITA CRIAÇÃO COM 201
    expect(res.body.id).toBeDefined();
  });

});
