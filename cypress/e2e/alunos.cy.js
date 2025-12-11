describe("Gestão de Alunos", () => {

  beforeEach(() => {
    cy.visit("http://localhost:3000");

    cy.get("#email").type("coordenador@escola.com");
    cy.get("#senha").type("123456");
    cy.get("#loginBtn").click();

    cy.contains("Alunos").click();
  });

  it("Deve criar aluno", () => {
    cy.get("#novoAlunoBtn").click();

    cy.get("#alunoNome").type("João da Silva");
    cy.get("#alunoTurma").type("3A");
    cy.get("#alunoNascimento").type("2012-06-15");
    cy.get("#alunoTea").select("Não");

    cy.get("#saveAluno").click();

    cy.contains("João da Silva").should("exist");
  });

  it("Deve editar aluno", () => {
    cy.contains("João da Silva").parent().find(".edit-aluno").click();

    cy.get("#alunoNome").clear().type("João da Silva Editado");
    cy.get("#saveAluno").click();

    cy.contains("João da Silva Editado").should("exist");
  });

  it("Deve excluir aluno", () => {
    cy.contains("João da Silva Editado")
      .parent()
      .find(".del-aluno")
      .click();

    cy.on("window:confirm", () => true);

    cy.contains("João da Silva Editado").should("not.exist");
  });

});
