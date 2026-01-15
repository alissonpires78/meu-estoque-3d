function setStatus(text) {
  const el = document.getElementById("status");
  if (el) el.textContent = text;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderSections(sections) {
  const root = document.getElementById("content");
  root.innerHTML = sections.map(s => `
    <section class="card">
      <h2>${escapeHtml(s.title)}</h2>
      <p>${escapeHtml(s.body)}</p>
    </section>
  `).join("");
}
