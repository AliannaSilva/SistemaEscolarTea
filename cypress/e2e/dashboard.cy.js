describe("Dashboard – fluxo básico", () => {

  before(() => {

    // LOGIN AUTOMÁTICO
    cy.request("POST", "http://localhost:3000/api/auth/login", {
      email: "coordenador@escola.com",
      senha: "123456"
    }).then((res) => {
      localStorage.setItem("token", res.body.token);
    });

    // Agora sim abrir dashboard
    cy.visit("http://localhost:3000/dashboard.html");
  });

  it("abre dashboard e navega entre telas", () => {

    cy.get("#screen-alunos").should("be.visible");

    cy.contains("Atividades").click();
    cy.get("#screen-atividades").should("be.visible");

    cy.contains("Notas").click();
    cy.get("#screen-notas").should("be.visible");

    cy.contains("Observações").click();
    cy.get("#screen-observacoes").should("be.visible");
  });

});

