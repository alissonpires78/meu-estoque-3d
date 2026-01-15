document.addEventListener("DOMContentLoaded", async () => {
  try {
    setStatus("Carregando conteúdo…");

    // ESCOLHA UMA:
    const data = await loadFromRepoJson();
    // const data = await loadFromSupabaseRest();

    if (!data || !Array.isArray(data.sections)) {
      throw new Error("Formato inválido: esperado { sections: [...] }");
    }

    renderSections(data.sections);
    setStatus("Pronto.");
  } catch (err) {
    console.error(err);
    setStatus("Erro ao carregar. Veja o console (F12).");
    document.getElementById("content").innerHTML =
      `<pre class="card" style="white-space:pre-wrap;color:#b00020;">${escapeHtml(String(err))}</pre>`;
  }
});
