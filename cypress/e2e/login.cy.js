describe("Teste de Login", () => {

  beforeEach(() => {
    cy.visit("http://localhost:3000/");
  });

  it("deve exibir erro ao tentar login inválido", () => {
    cy.get("#email").type("teste@teste.com");
    cy.get("#senha").type("errado");

    cy.get("#loginBtn").click();

    cy.get("#msg")
      .should("be.visible")
      .and("contain", "Senha incorreta");
  });

  it("deve realizar login com sucesso", () => {
    cy.get("#email").type("coordenador@escola.com");
    cy.get("#senha").type("123456");

    cy.get("#loginBtn").click();

    // deve redirecionar para dashboard
    cy.url().should("include", "/dashboard.html");
  });

});

