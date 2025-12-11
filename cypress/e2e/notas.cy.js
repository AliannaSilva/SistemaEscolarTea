describe("Gestão de Notas", () => {

  beforeEach(() => {
    cy.visit("http://localhost:3000");

    cy.get("#email").type("coordenador@escola.com");
    cy.get("#senha").type("123456");
    cy.get("#loginBtn").click();

    cy.contains("Notas").click();
  });

  it("Deve lançar nota para um aluno", () => {
    cy.get("#novaNotaBtn").click();

    cy.get("#notaAlunoSelect").select(1);
    cy.get("#notaAtividadeSelect").select(1);

    cy.get("#notaValor").type("9.5");
    cy.get("#notaObservacao").type("Bom desempenho");

    cy.get("#saveNota").click();

    cy.contains("9.5").should("exist");
  });

  it("Deve editar a nota lançada", () => {
    cy.contains("9.5").parent().find(".editNota").click();

    cy.get("#notaValor").clear().type("10");

    cy.get("#saveNota").click();

    cy.contains("10").should("exist");
  });

});
