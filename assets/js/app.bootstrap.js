const DATA_SOURCE = "json"; // "json" agora; depois você troca para "supabase"

async function loadFilamentos() {
  if (DATA_SOURCE === "supabase") return await loadFilamentosFromSupabase();
  return await loadFilamentosFromJson();
}
