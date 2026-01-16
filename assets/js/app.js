const colorMap = {
  'AZUL': '#3b82f6', 'AMARELO': '#fbbf24', 'ROXO': '#a855f7', 'CINZA': '#9ca3af', 
  'LARANJA': '#f97316', 'PRETO': '#1f2937', 'VERMELHO': '#ef4444', 'VERDE': '#22c55e', 
  'BRANCO': '#f5f5f5', 'ROSA': '#ec4899', 'MARROM': '#92400e', 'BEGE': '#daa520'
};

let filaments = [];
let filteredFilaments = [];

function init() {
  const stored = localStorage.getItem('filamentos_pro');
  if (stored) {
    filaments = JSON.parse(stored);
    filteredFilaments = [...filaments];
    render();
  } else {
    if (typeof loadFilamentosFromSource === 'function') {
      loadFilamentosFromSource().then(data => {
        filaments = data;
        filteredFilaments = [...filaments];
        saveData();
        render();
      });
    }
  }
}

function saveData() {
  localStorage.setItem('filamentos_pro', JSON.stringify(filaments));
}

function render() {
  populateSelects();
  renderStats();
  renderCards();
}

function populateSelects() {
  const brands = [...new Set(filaments.map(f => (f.marca || '').trim()).filter(Boolean))].sort();
  const materials = [...new Set(filaments.map(f => (f.material || '').trim()).filter(Boolean))].sort();
  const colors = [...new Set(filaments.map(f => (f.cor_dominante || '').toUpperCase().trim()).filter(Boolean))].sort();

  const fill = (id, list, text) => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = `<option value="">${text}</option>`;
      list.forEach(item => el.add(new Option(item, item)));
    }
  };

  fill('brandFilter', brands, 'Todas as marcas');
  fill('brandQuickFilter', brands, 'Filtrar por marca...');
  fill('materialFilter', materials, 'Todos os materiais');
  fill('colorFilter', colors, 'Todas as cores');
}

function renderStats() {
  const grid = document.getElementById('statsGrid');
  if (!grid) return;
  const totalItems = filteredFilaments.length;
  grid.innerHTML = `<div class="stat-card"><div class="stat-label">Filamentos Listados</div><div class="stat-value">${totalItems}</div></div>`;
}

function renderCards() {
  const container = document.getElementById('filamentGrid');
  if (!container) return;
  container.innerHTML = filteredFilaments.map(f => {
    const weight = (parseFloat(f.peso_balanca||0) - parseFloat(f.peso_embalagem||0));
    const color = colorMap[f.cor_dominante.toUpperCase()] || '#ccc';
    return `
      <div class="filament-card" style="border-top-color: ${color}">
        <div class="card-title"><b>${f.cor}</b></div>
        <div class="info-row"><span>Marca:</span><span>${f.marca}</span></div>
        <div class="info-row"><span>Material:</span><span>${f.material}</span></div>
        <div class="info-row"><span>Peso:</span><span>${weight.toFixed(0)}g</span></div>
        <div class="card-actions">
          <button class="btn-secondary btn-small" onclick="viewDetails(${f.id})">Ver</button>
          <button class="btn-primary btn-small" onclick="editFilament(${f.id})">Editar</button>
        </div>
      </div>
    `;
  }).join('');
}

function filterFilaments() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const brand = document.getElementById('brandFilter').value;
  const color = document.getElementById('colorFilter').value;
  const material = document.getElementById('materialFilter').value;
  const status = document.getElementById('statusFilter').value;

  filteredFilaments = filaments.filter(f => {
    return (!search || f.cor.toLowerCase().includes(search) || f.marca.toLowerCase().includes(search)) &&
           (!brand || f.marca === brand) &&
           (!color || f.cor_dominante.toUpperCase() === color.toUpperCase()) &&
           (!material || f.material === material) &&
           (!status || f.status === status);
  });
  renderCards();
  renderStats();
}

function saveFilament(event) {
  event.preventDefault();
  const data = {
    id: currentEditId || Date.now(),
    cor_dominante: document.getElementById('corDominante').value.toUpperCase(),
    cor: document.getElementById('cor').value,
    marca: document.getElementById('marca').value,
    material: document.getElementById('material').value,
    peso_balanca: parseFloat(document.getElementById('pesoBalanca').value),
    peso_embalagem: parseFloat(document.getElementById('pesoEmbalagem').value),
    preco_pago: parseFloat(document.getElementById('precoPago').value),
    status: document.getElementById('status').value
  };
  if (currentEditId) {
    const idx = filaments.findIndex(f => f.id === currentEditId);
    filaments[idx] = data;
  } else {
    filaments.push(data);
  }
  saveData(); init(); closeAddModal();
}

function autoCalcGramas() {
  const b = parseFloat(document.getElementById('pesoBalanca').value) || 0;
  const e = parseFloat(document.getElementById('pesoEmbalagem').value) || 0;
  document.getElementById('gramas').value = b - e;
}

function switchTab(id, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  btn.classList.add('active');
}

function openAddModal() {
  currentEditId = null;
  document.querySelector('#addModal form').reset();
  document.getElementById('addModal').classList.add('active');
}

function closeAddModal() { document.getElementById('addModal').classList.remove('active'); }

function editFilament(id) {
  const f = filaments.find(x => x.id === id);
  currentEditId = id;
  document.getElementById('corDominante').value = f.cor_dominante;
  document.getElementById('cor').value = f.cor;
  document.getElementById('marca').value = f.marca;
  document.getElementById('material').value = f.material;
  document.getElementById('pesoBalanca').value = f.peso_balanca;
  document.getElementById('pesoEmbalagem').value = f.peso_embalagem;
  document.getElementById('precoPago').value = f.preco_pago;
  document.getElementById('status').value = f.status;
  autoCalcGramas();
  document.getElementById('addModal').classList.add('active');
}

function viewDetails(id) {
  const f = filaments.find(x => x.id === id);
  alert(`Detalhes:\nMarca: ${f.marca}\nMaterial: ${f.material}\nStatus: ${f.status}`);
}

function filterByBrand(v) { document.getElementById('brandFilter').value = v; filterFilaments(); }
function showLowStock() {
    filteredFilaments = filaments.filter(f => (f.peso_balanca - f.peso_embalagem) < 200);
    renderCards();
}
function exportJSON() {
    const blob = new Blob([JSON.stringify(filaments)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'estoque.json'; a.click();
}
function importData() { document.getElementById('importFile').click(); }
function handleImport(e) {
    const reader = new FileReader();
    reader.onload = (ev) => {
        filaments = JSON.parse(ev.target.result);
        saveData(); init();
    };
    reader.readAsText(e.target.files[0]);
}
function clearAllData() { if(confirm('Apagar tudo?')) { localStorage.clear(); location.reload(); } }

window.onload = init;
