const SUPABASE = {
  url: "https://SEU-PROJETO.supabase.co",
  anonKey: "SUA_ANON_KEY"
};

async function loadFilamentosFromSupabase() {
  const url = SUPABASE.url + "/rest/v1/filamentos?select=*&order=id.asc";

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE.anonKey,
      Authorization: "Bearer " + SUPABASE.anonKey
    }
  });

  if (!res.ok) throw new Error("Falha Supabase: " + res.status);
  return await res.json();
}
