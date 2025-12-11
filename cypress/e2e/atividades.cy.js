describe("Gestão de Atividades", () => {

  beforeEach(() => {
    cy.visit("http://localhost:3000");

    cy.get("#email").type("coordenador@escola.com");
    cy.get("#senha").type("123456");
    cy.get("#loginBtn").click();

    // ➜ AGUARDAR o MENU carregar
    cy.intercept("GET", "/api/alunos").as("loadAlunos");
    cy.wait("@loadAlunos");

    // ➜ CLICAR no menu
    cy.contains("Atividades").click();

    // ➜ AGUARDAR que ATIVIDADES carregue do backend
    cy.intercept("GET", "/api/atividades").as("loadAtividades");
    cy.wait("@loadAtividades");

    // ➜ GARANTIR que a tela está visível
    cy.get("#screen-atividades", { timeout: 6000 })
      .should("be.visible")
      .and("not.have.class", "hidden");
  });

  it("Deve criar atividade normal", () => {

    cy.get("#novaAtividadeBtn", { timeout: 6000 })
      .should("be.visible")
      .click({ force: true });

    cy.get("#atvTitulo").type("Atividade de Matemática");
    cy.get("#atvDataEntrega").type("2025-03-10");

    cy.get("#atvTurma").select("3A");

    cy.get("#atvDescricao").type("Resolver exercícios da página 20.");

    cy.get("#saveAtividade").click();

    cy.contains("Atividade de Matemática", { timeout: 7000 }).should("exist");
  });

  it("Deve criar atividade adaptada para aluno TEA", () => {

    cy.get("#novaAtividadeBtn", { timeout: 6000 })
      .should("be.visible")
      .click({ force: true });

    cy.get("#atvTitulo").type("Atividade Adaptada");
    cy.get("#atvDataEntrega").type("2025-04-01");

    cy.get("#atvAdaptada").check({ force: true });
    cy.get("#selectAlunoTea_modal").should("be.visible");

    cy.get("#atvAlunoTea").select(1);

    cy.get("#atvDescricao").type("Versão reduzida da atividade.");

    cy.get("#saveAtividade").click();

    cy.contains("Atividade Adaptada", { timeout: 7000 }).should("exist");
  });

});

