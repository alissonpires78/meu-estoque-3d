async function loadFilamentosFromJson() {
  const res = await fetch("./assets/data/filamentos_backup.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao carregar assets/data/filamentos_backup.json: " + res.status);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("JSON inválido: esperado um array de filamentos");
  return data;
}
