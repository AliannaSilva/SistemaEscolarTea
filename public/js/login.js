document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const msg = document.getElementById("msg");

  msg.textContent = "";
  msg.style.color = "crimson";

  // validação simples
  if (!email || !senha) {
    msg.textContent = "Preencha email e senha.";
    return;
  }

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });

    const data = await response.json();

    // erro no servidor
    if (!response.ok) {
      msg.textContent = data.error || "Erro ao conectar.";
      return;
    }

    // verifica token
    if (!data.token) {
      msg.textContent = "Erro: servidor não retornou token.";
      return;
    }

    // salva token e redireciona
    localStorage.setItem("token", data.token);
    window.location.href = "/dashboard.html";

  } catch (error) {
    console.error(error);
    msg.textContent = "Erro de conexão com o servidor.";
  }
});
