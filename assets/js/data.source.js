// Troque para "supabase" quando migrar
const DATA_SOURCE = "json"; // "json" | "supabase"

async function loadFilamentosFromSource() {
  if (DATA_SOURCE === "supabase") return await loadFilamentosFromSupabase();
  return await loadFilamentosFromJson();
}
