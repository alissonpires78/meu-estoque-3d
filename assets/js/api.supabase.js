// ===== Opção 1: carregar JSON do próprio GitHub Pages (assets/data/content.json)
async function loadFromRepoJson() {
  const res = await fetch("./assets/data/content.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Não consegui abrir assets/data/content.json");
  return await res.json();
}

// ===== Opção 2: carregar do Supabase via REST (sem biblioteca)
// Você precisa expor um endpoint REST (padrão do Supabase) e ter a tabela.
async function loadFromSupabaseRest() {
  // Troque pelos seus dados:
  const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
  const SUPABASE_ANON_KEY = "SUA_ANON_KEY";

  // Exemplo: tabela "sections" com colunas: id, title, body, order
  const url =
    SUPABASE_URL +
    "/rest/v1/sections?select=title,body&order=order.asc";

  const res = await fetch(url, {
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": "Bearer " + SUPABASE_ANON_KEY
    }
  });

  if (!res.ok) throw new Error("Falha ao buscar dados do Supabase: " + res.status);
  const rows = await res.json();

  return { sections: rows };
}
