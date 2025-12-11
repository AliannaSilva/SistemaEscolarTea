// dashboard.js — Versão final (Modelo A)
console.log("SCRIPT CARREGADO CORRETAMENTE!");

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "/");

  let userData = null;
  try { userData = JSON.parse(atob(token.split(".")[1])); } catch(e){ console.error("Token inválido", e); }
  const tipoUsuario = userData?.tipo || "professor";

  async function apiFetch(path, opts = {}) {
    opts.headers = opts.headers || {};
    if (opts.body && typeof opts.body !== "string") opts.body = JSON.stringify(opts.body);
    opts.headers["Content-Type"] = "application/json";
    opts.headers["Authorization"] = "Bearer " + token;
    const res = await fetch(path, opts);
    if (!res.ok) {
      let txt = await res.text().catch(()=>"");
      try { txt = JSON.parse(txt); } catch {}
      throw { status: res.status, body: txt };
    }
    if (res.status === 204) return null;
    return res.json();
  }

  function formatarData(dataStr) {
    if (!dataStr) return "";
    const d = new Date(dataStr);
    if (isNaN(d)) return dataStr;
    return d.toLocaleDateString("pt-BR");
  }

  const $ = id => document.getElementById(id);

  // elements
  const menu = $("menu");
  const novoAlunoBtn = $("novoAlunoBtn");
  const alunoForm = $("alunoForm");
  const alunoTea = $("alunoTea");
  const rowLaudo = $("rowLaudo");
  const rowNivel = $("rowNivelTEA");
  const atvAdaptada = $("atvAdaptada");
  const textoAdaptada = $("textoAdaptada");
  const selectAlunoTea_modal = $("selectAlunoTea_modal");
  const atvAlunoTea = $("atvAlunoTea");
  const atvTurmaSelect = $("atvTurma");
  const novaAtividadeBtn = $("novaAtividadeBtn");
  const exportSistemaPDF = $("exportSistemaPDF");

  // modal notes
  const novaNotaBtn = $("novaNotaBtn");

  let editingAlunoId = null;
  let editingAtividadeId = null;
  let editingNotaId = null;

  function applyPermissionsToUI(){
    if (tipoUsuario === "coordenador") {
      if (exportSistemaPDF) exportSistemaPDF.style.display = "";
      return;
    }
    if (novoAlunoBtn) novoAlunoBtn.classList.add("hidden");
    if (exportSistemaPDF) exportSistemaPDF.style.display = "none";
    document.querySelectorAll(".del-atv, .delNota, .del-obs, .del-aluno").forEach(b => b.style.display = "none");
    document.querySelectorAll(".edit-aluno").forEach(b => b.style.display = "none");
  }

  async function atualizarFiltrosDeTurmas() {
    try {
      const alunos = await apiFetch("/api/alunos");
      const turmas = [...new Set(alunos.map(a => a.turma).filter(Boolean))];
      const fill = (id) => {
        const sel = $(id);
        if (!sel) return;
        sel.innerHTML = '<option value="">Todas as turmas</option>';
        turmas.forEach(t => sel.innerHTML += `<option value="${t}">${t}</option>`);
      };
      fill("filtroTurmaAtv");
      fill("filtroTurmaNotas");
      fill("filtroTurmaObs");
    } catch (err) { console.error("Erro filtros:", err); }
  }

  // ---------- ALUNOS ----------
  function openAlunoModal(aluno=null){
    editingAlunoId = aluno ? aluno.id : null;
    $("modalTitle").innerText = aluno ? "Editar Aluno" : "Novo Aluno";
    $("alunoNome").value = aluno?.nome || "";
    $("alunoTurma").value = aluno?.turma || "";
    $("alunoNascimento").value = aluno?.data_nascimento || "";
    if (alunoTea) alunoTea.value = aluno?.possui_tea ? "1" : "0";
    if ($("alunoLaudo")) $("alunoLaudo").value = aluno?.laudo_entregue || "Não";
    if ($("alunoNivelTea")) $("alunoNivelTea").value = aluno?.nivel_tea || "";
    if ($("alunoStatus")) $("alunoStatus").value = aluno?.status_atualizacao || "Ativo";
    rowLaudo && (rowLaudo.style.display = (aluno?.possui_tea ? "block":"none"));
    rowNivel && (rowNivel.style.display = (aluno?.possui_tea ? "block":"none"));
    $("alunoModal").classList.remove("hidden");
  }
  function closeAlunoModal(){ $("alunoModal").classList.add("hidden"); editingAlunoId=null; alunoForm.reset(); rowLaudo.style.display="none"; rowNivel.style.display="none"; }

  if (novoAlunoBtn) novoAlunoBtn.addEventListener("click", ()=> openAlunoModal());
  $("closeAlunoX")?.addEventListener("click", closeAlunoModal);
  $("cancelAluno")?.addEventListener("click", e => { e.preventDefault(); closeAlunoModal(); });
  alunoTea?.addEventListener("change", () => {
    const show = alunoTea.value === "1";
    rowLaudo && (rowLaudo.style.display = show ? "block" : "none");
    rowNivel && (rowNivel.style.display = show ? "block" : "none");
  });

  alunoForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      nome: $("alunoNome").value,
      turma: $("alunoTurma").value,
      data_nascimento: $("alunoNascimento").value,
      possui_tea: alunoTea.value === "1" ? 1 : 0,
      laudo_entregue: $("alunoLaudo") ? $("alunoLaudo").value : null,
      nivel_tea: $("alunoNivelTea") ? $("alunoNivelTea").value : null,
      status_atualizacao: $("alunoStatus") ? $("alunoStatus").value : "Ativo"
    };
    try {
      if (editingAlunoId) await apiFetch(`/api/alunos/${editingAlunoId}`, { method: "PUT", body: payload });
      else await apiFetch("/api/alunos", { method: "POST", body: payload });
      closeAlunoModal();
      await loadAlunos();
      await atualizarFiltrosDeTurmas();
    } catch (err) { console.error(err); alert("Erro ao salvar aluno."); }
  });

  async function loadAlunos(){
    const tbody = document.querySelector("#alunosTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='9'>Carregando...</td></tr>";
    try {
      const alunos = await apiFetch("/api/alunos");
      tbody.innerHTML = "";
      // preencher select de turmas do modal atv
      if (atvTurmaSelect) {
        const exist = new Set();
        atvTurmaSelect.innerHTML = '<option value="">Selecione a turma</option>';
        alunos.forEach(a => { if (a.turma && !exist.has(a.turma)) { exist.add(a.turma); atvTurmaSelect.innerHTML += `<option value="${a.turma}">${a.turma}</option>`; }});
      }
      alunos.forEach(a => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${a.id}</td>
                        <td>${a.nome}</td>
                        <td>${a.turma || ""}</td>
                        <td>${formatarData(a.data_nascimento) || "-"}</td>
                        <td>${a.laudo_entregue || "-"}</td>
                        <td>${a.possui_tea ? "Sim" : "Não"}</td>
                        <td>${a.nivel_tea || "-"}</td>
                        <td>${a.status_atualizacao || "-"}</td>
                        <td><button class="edit-aluno" data-id="${a.id}">Editar</button>
                            <button class="del-aluno" data-id="${a.id}">Excluir</button></td>`;
        tbody.appendChild(tr);
      });
      document.querySelectorAll(".edit-aluno").forEach(btn => { btn.onclick = async () => { const aluno = await apiFetch(`/api/alunos/${btn.dataset.id}`); openAlunoModal(aluno); }; });
      document.querySelectorAll(".del-aluno").forEach(btn => { btn.onclick = async () => { if (!confirm("Excluir aluno?")) return; await apiFetch(`/api/alunos/${btn.dataset.id}`, { method: "DELETE" }); await loadAlunos(); await atualizarFiltrosDeTurmas(); }; });
      applyPermissionsToUI();
    } catch (err) {
      console.error("Erro ao carregar alunos:", err);
      tbody.innerHTML = "<tr><td colspan='9'>Erro ao carregar alunos</td></tr>";
    }
  }

  // ---------- ATIVIDADES ----------
  async function loadAlunosTea(){
    if (!atvAlunoTea) return;
    atvAlunoTea.innerHTML = '<option value="">Selecione o aluno</option>';
    try {
      const alunos = await apiFetch("/api/alunos");
      alunos.filter(a=>a.possui_tea).forEach(a => atvAlunoTea.innerHTML += `<option value="${a.id}" data-turma="${a.turma}">${a.nome} (Turma ${a.turma})</option>`);
    } catch (err) { console.error("Erro ao carregar alunos TEA:", err); }
  }

  atvAdaptada?.addEventListener("change", () => {
    const adaptada = atvAdaptada.checked;
    if (textoAdaptada) textoAdaptada.textContent = adaptada ? "Sim" : "Não";
    if (adaptada) { selectAlunoTea_modal && selectAlunoTea_modal.classList.remove("hidden"); atvTurmaSelect && (atvTurmaSelect.disabled = true); loadAlunosTea(); }
    else { selectAlunoTea_modal && selectAlunoTea_modal.classList.add("hidden"); if (atvTurmaSelect) atvTurmaSelect.disabled = false; if (atvAlunoTea) atvAlunoTea.value = ""; }
  });

  atvAlunoTea?.addEventListener("change", () => {
    const turma = atvAlunoTea.selectedOptions[0]?.dataset.turma || "";
    if (atvTurmaSelect) atvTurmaSelect.value = turma;
  });

  function openAtividadeModal(atv = null){
    editingAtividadeId = atv ? atv.id : null;
    $("modalAtividadeTitle").innerText = atv ? "Editar Atividade":"Nova Atividade";
    $("atvTitulo").value = atv?.titulo || "";
    $("atvDescricao").value = atv?.descricao || "";
    $("atvDataEntrega").value = atv?.data_entrega || "";
    if (atvTurmaSelect) atvTurmaSelect.value = atv?.turma || "";
    const adaptada = Number(atv?.adaptada) === 1;
    if (atvAdaptada) atvAdaptada.checked = adaptada;
    if (textoAdaptada) textoAdaptada.textContent = adaptada ? "Sim":"Não";
    if (adaptada) { selectAlunoTea_modal && selectAlunoTea_modal.classList.remove("hidden"); atvTurmaSelect && (atvTurmaSelect.disabled = true); loadAlunosTea().then(()=>{ if (atvAlunoTea) atvAlunoTea.value = atv?.id_aluno_tea || ""; }); }
    else { selectAlunoTea_modal && selectAlunoTea_modal.classList.add("hidden"); if (atvAlunoTea) atvAlunoTea.value = ""; if (atvTurmaSelect) atvTurmaSelect.disabled = false; }
    $("modalAtividade").classList.remove("hidden");
  }
  function closeAtividadeModal(){ $("modalAtividade").classList.add("hidden"); editingAtividadeId=null; $("atvTitulo").value=""; $("atvDescricao").value=""; $("atvDataEntrega").value=""; if (atvTurmaSelect) atvTurmaSelect.value=""; if (atvAdaptada) { atvAdaptada.checked=false; } if (textoAdaptada) textoAdaptada.textContent="Não"; if (atvAlunoTea) atvAlunoTea.value=""; selectAlunoTea_modal && selectAlunoTea_modal.classList.add("hidden"); }

  novaAtividadeBtn?.addEventListener("click", ()=> openAtividadeModal());
  $("closeAtvX")?.addEventListener("click", closeAtividadeModal);
  $("cancelAtividade")?.addEventListener("click", e => { e.preventDefault(); closeAtividadeModal(); });

  $("saveAtividade")?.addEventListener("click", async (e) => {
    e.preventDefault();
    const adaptada = atvAdaptada?.checked;
    const turma = adaptada ? (atvAlunoTea?.selectedOptions[0]?.dataset.turma || "") : (atvTurmaSelect?.value || "");
    if (!turma) return alert("Selecione a turma da atividade.");
    const payload = {
      titulo: $("atvTitulo").value,
      descricao: $("atvDescricao").value,
      data_entrega: $("atvDataEntrega").value,
      adaptada: adaptada ? 1 : 0,
      turma,
      id_aluno_tea: adaptada ? atvAlunoTea.value : null
    };
    try {
      if (editingAtividadeId) await apiFetch(`/api/atividades/${editingAtividadeId}`, { method: "PUT", body: payload });
      else await apiFetch("/api/atividades", { method: "POST", body: payload });
      closeAtividadeModal();
      await loadAtividades();
      await atualizarFiltrosDeTurmas();
    } catch (err) { console.error("Erro ao salvar atividade:", err); alert("Erro ao salvar atividade."); }
  });

  async function loadAtividades(){
    const tbody = document.querySelector("#atividadesTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='8'>Carregando...</td></tr>";
    try {
      const atividades = await apiFetch("/api/atividades");
      tbody.innerHTML = "";
      atividades.forEach(a => {
        const tr = document.createElement("tr");
        tr.dataset.turma = a.turma || "";
        tr.innerHTML = `<td>${a.id}</td>
                        <td>${a.titulo}</td>
                        <td>${a.descricao || "-"}</td>
                        <td>${formatarData(a.data_entrega)}</td>
                        <td>${a.adaptada ? "Adaptada" : "Normal"}</td>
                        <td>${a.turma || "-"}</td>
                        <td>${a.aluno_nome || "-"}</td>
                        <td><button class="edit-atv" data-id="${a.id}">Editar</button>
                            <button class="del-atv" data-id="${a.id}">Excluir</button></td>`;
        tbody.appendChild(tr);
      });

      $("filtroTurmaAtv") && ($("filtroTurmaAtv").onchange = () => {
        const t = $("filtroTurmaAtv").value;
        document.querySelectorAll("#atividadesTable tbody tr").forEach(tr => tr.style.display = (!t || tr.dataset.turma === t) ? "" : "none");
      });

      document.querySelectorAll(".edit-atv").forEach(btn => btn.onclick = async () => { const atv = await apiFetch(`/api/atividades/${btn.dataset.id}`); openAtividadeModal(atv); });
      document.querySelectorAll(".del-atv").forEach(btn => btn.onclick = async () => { if (!confirm("Excluir atividade?")) return; await apiFetch(`/api/atividades/${btn.dataset.id}`, { method: "DELETE" }); await loadAtividades(); });

      applyPermissionsToUI();
    } catch (err) {
      console.error("Erro ao carregar atividades:", err);
      tbody.innerHTML = "<tr><td colspan='8'>Erro ao carregar atividades</td></tr>";
    }
  }

  // ---------- NOTAS ----------
  async function loadDropdownAlunosNotas(){
    const sel = $("notaAlunoSelect"); if (!sel) return;
    sel.innerHTML = '<option value="">Selecione o aluno</option>';
    try {
      const alunos = await apiFetch("/api/alunos");
      alunos.forEach(a => sel.innerHTML += `<option value="${a.id}" data-turma="${a.turma}">${a.nome} — Turma ${a.turma}</option>`);
    } catch (err) { console.error("Erro ao carregar alunos para notas:", err); }
  }
  async function loadDropdownAtividadesNotas(){
    const sel = $("notaAtividadeSelect"); if (!sel) return;
    sel.innerHTML = '<option value="">Selecione a atividade</option>';
    try {
      const atividades = await apiFetch("/api/atividades");
      atividades.forEach(a => sel.innerHTML += `<option value="${a.id}" data-turma="${a.turma}">${a.titulo} — Turma ${a.turma}</option>`);
    } catch (err) { console.error("Erro ao carregar atividades para notas:", err); }
  }

  function openNotaModal(){
    editingNotaId = null;
    $("modalNota").classList.remove("hidden");
    $("modalNota").setAttribute("aria-hidden","false");
    loadDropdownAlunosNotas();
    loadDropdownAtividadesNotas();
    $("notaValor").value = "";
    $("notaObservacao").value = "";
  }
  function closeNotaModal(){ $("modalNota").classList.add("hidden"); $("modalNota").setAttribute("aria-hidden","true"); editingNotaId = null; }

  novaNotaBtn?.addEventListener("click", openNotaModal);
  $("closeNotaX")?.addEventListener("click", closeNotaModal);
  $("cancelNota")?.addEventListener("click", e => { e.preventDefault(); closeNotaModal(); });

  $("saveNota")?.addEventListener("click", async (e) => {
    e.preventDefault();
    const selAluno = $("notaAlunoSelect");
    const selAtv = $("notaAtividadeSelect");
    const payload = { id_aluno: selAluno ? selAluno.value : null, id_atividade: selAtv ? selAtv.value : null, valor: $("notaValor").value, observacao: $("notaObservacao").value };
    if (!payload.id_aluno || !payload.id_atividade || !payload.valor) return alert("Preencha todos os campos obrigatórios!");
    try {
      if (editingNotaId) await apiFetch(`/api/notas/${editingNotaId}`, { method: "PUT", body: payload });
      else await apiFetch("/api/notas", { method: "POST", body: payload });
      closeNotaModal();
      await loadNotas();
    } catch (err) { console.error("Erro ao salvar nota:", err); alert("Erro ao salvar nota."); }
  });

  async function loadNotas(){
    const tbody = document.querySelector("#notasTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='7'>Carregando...</td></tr>";
    try {
      const notas = await apiFetch("/api/notas");
      tbody.innerHTML = "";
      notas.forEach(n => {
        const tr = document.createElement("tr");
        tr.dataset.turma = n.aluno_turma || "";
        tr.innerHTML = `<td>${n.id}</td>
                        <td>${n.aluno_nome}</td>
                        <td>${n.atividade_titulo}</td>
                        <td>${n.valor}</td>
                        <td>${n.observacao || ""}</td>
                        <td>${formatarData(n.data_registro)}</td>
                        <td><button class="editNota" data-id="${n.id}">Editar</button>
                            <button class="delNota" data-id="${n.id}">Excluir</button></td>`;
        tbody.appendChild(tr);
      });

      $("filtroTurmaNotas") && ($("filtroTurmaNotas").onchange = ()=> {
        const turma = $("filtroTurmaNotas").value;
        document.querySelectorAll("#notasTable tbody tr").forEach(tr=> tr.style.display = (!turma || turma === tr.dataset.turma) ? "" : "none");
      });

      document.querySelectorAll(".delNota").forEach(btn => btn.onclick = async ()=>{ if (!confirm("Excluir nota?")) return; await apiFetch(`/api/notas/${btn.dataset.id}`, { method: "DELETE" }); await loadNotas(); });
      document.querySelectorAll(".editNota").forEach(btn => btn.onclick = async ()=>{
        const nota = await apiFetch(`/api/notas/${btn.dataset.id}`);
        editingNotaId = nota.id;
        $("modalNota").classList.remove("hidden");
        await loadDropdownAlunosNotas();
        await loadDropdownAtividadesNotas();
        setTimeout(()=>{ if ($("notaAlunoSelect")) $("notaAlunoSelect").value = nota.id_aluno; if ($("notaAtividadeSelect")) $("notaAtividadeSelect").value = nota.id_atividade; }, 150);
        if ($("notaValor")) $("notaValor").value = nota.valor;
        if ($("notaObservacao")) $("notaObservacao").value = nota.observacao || "";
      });

      applyPermissionsToUI();
    } catch (err) {
      console.error("Erro ao carregar notas:", err);
      tbody.innerHTML = "<tr><td colspan='7'>Erro ao carregar notas</td></tr>";
    }
  }

  // ---------- OBSERVAÇÕES ----------
  async function loadObsDropdownAlunos(){
    const sel = $("obsAlunoSelect"); if (!sel) return; sel.innerHTML = '<option value="">Selecione o aluno</option>';
    try {
      const alunos = await apiFetch("/api/alunos");
      alunos.forEach(a => sel.innerHTML += `<option value="${a.id}" data-turma="${a.turma}">${a.nome} — Turma ${a.turma}</option>`);
    } catch (err) { console.error("Erro ao carregar alunos (obs):", err); }
  }

  function openObsModal(){ $("modalObs").classList.remove("hidden"); $("modalObs").setAttribute("aria-hidden","false"); loadObsDropdownAlunos(); $("obsTexto").value = ""; }
  function closeObsModal(){ $("modalObs").classList.add("hidden"); $("modalObs").setAttribute("aria-hidden","true"); }

  $("novaObsBtn")?.addEventListener("click", openObsModal);
  $("closeObsX")?.addEventListener("click", closeObsModal);
  $("cancelObs")?.addEventListener("click", e => { e.preventDefault(); closeObsModal(); });

  $("saveObs")?.addEventListener("click", async (e)=> {
    e.preventDefault();
    const id_aluno = $("obsAlunoSelect") ? $("obsAlunoSelect").value : null;
    const texto = $("obsTexto") ? $("obsTexto").value.trim() : "";
    if (!id_aluno || !texto) return alert("Preencha todos os campos!");
    try { await apiFetch("/api/observacoes", { method: "POST", body: { id_aluno, texto, data_registro: new Date().toISOString() } }); closeObsModal(); await loadObservacoes(); } catch (err) { console.error("Erro ao salvar observação:", err); alert("Erro ao salvar observação."); }
  });

  async function loadObservacoes(){
    const tbody = document.querySelector("#obsTable tbody"); if (!tbody) return; tbody.innerHTML = "<tr><td colspan='5'>Carregando...</td></tr>";
    try {
      const obs = await apiFetch("/api/observacoes"); tbody.innerHTML = "";
      obs.forEach(o => { const tr = document.createElement("tr"); tr.dataset.turma = o.aluno_turma || ""; tr.innerHTML = `<td>${o.id}</td><td>${o.aluno_nome}</td><td>${o.texto}</td><td>${formatarData(o.data_registro)}</td><td><button class="del-obs" data-id="${o.id}">Excluir</button></td>`; tbody.appendChild(tr); });
      $("filtroTurmaObs") && ($("filtroTurmaObs").onchange = ()=>{ const t = $("filtroTurmaObs").value; document.querySelectorAll("#obsTable tbody tr").forEach(tr=> tr.style.display = (!t || tr.dataset.turma === t) ? "" : "none"); });
      document.querySelectorAll(".del-obs").forEach(btn => btn.onclick = async ()=> { if (!confirm("Excluir observação?")) return; try { await apiFetch(`/api/observacoes/${btn.dataset.id}`, { method: "DELETE" }); await loadObservacoes(); } catch (err) { console.error(err); alert("Erro ao excluir observação."); } });
      applyPermissionsToUI();
    } catch (err) { console.error("Erro ao carregar observações:", err); tbody.innerHTML = "<tr><td colspan='5'>Erro ao carregar observações</td></tr>"; }
  }

  // export PDF (envio token na query para compatibilidade com backend)
  exportSistemaPDF?.addEventListener("click", ()=> {
    if (tipoUsuario !== "coordenador") return alert("Apenas coordenadores podem gerar relatórios.");
    window.open(`/api/relatorio/geral?token=${encodeURIComponent(token)}`, "_blank");
  });

  // NAV
  menu?.addEventListener("click", (e) => {
    const item = e.target.closest(".menu-item");
    if (!item) return;
    if (item.id === "logout") { localStorage.removeItem("token"); return (window.location.href = "/"); }
    document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    showScreen(item.dataset.screen);
  });
  
  async function showScreen(screen) {
  // Oculta todas as telas
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));

  // Aguarda próximo ciclo de renderização
  await new Promise(resolve => setTimeout(resolve, 50));

  // Seleciona a tela desejada
  const el = document.getElementById("screen-" + screen);
  if (el) {
    el.classList.remove("hidden");

    // Aguarda visibilidade antes de carregar dados (ESSENCIAL)
    await new Promise(resolve => setTimeout(resolve, 80));
  }

  // Agora carrega os dados da tela
  if (screen === "alunos") await loadAlunos();
  if (screen === "atividades") await loadAtividades();
  if (screen === "notas") await loadNotas();
  if (screen === "observacoes") await loadObservacoes();

  // Garantir totalmente visível antes do Cypress interagir
  await new Promise(resolve => setTimeout(resolve, 50));
}


  // INIT
  (async function init(){
    try {
      await loadAlunos();
      await atualizarFiltrosDeTurmas();
      applyPermissionsToUI();
      showScreen("alunos");
    } catch (err) { console.error("Erro init:", err); }
  })();

}); // DOMContentLoaded fim
