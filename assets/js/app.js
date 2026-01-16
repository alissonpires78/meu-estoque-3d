const colorMap = {
  'AZUL': '#3b82f6', 'AMARELO': '#fbbf24', 'ROXO': '#a855f7', 'CINZA': '#9ca3af', 
  'LARANJA': '#f97316', 'PRETO': '#1f2937', 'VERMELHO': '#ef4444', 'VERDE': '#22c55e', 
  'BRANCO': '#f5f5f5', 'ROSA': '#ec4899', 'MARROM': '#92400e', 'BEGE': '#daa520'
};

let filaments = [];
let filteredFilaments = [];
let printers = JSON.parse(localStorage.getItem('printers_data') || '[]');
let usageHistory = JSON.parse(localStorage.getItem('usage_history') || '[]');
let currentEditId = null;

function init() {
  const stored = localStorage.getItem('filamentos_pro');
  if (stored) {
    filaments = JSON.parse(stored);
    filteredFilaments = [...filaments];
    render();
  } else if (typeof loadFilamentosFromSource === 'function') {
    loadFilamentosFromSource().then(data => {
      filaments = data;
      filteredFilaments = [...filaments];
      saveData();
      render();
    });
  }
  setDefaultDate();
}

function saveData() {
  localStorage.setItem('filamentos_pro', JSON.stringify(filaments));
  localStorage.setItem('usage_history', JSON.stringify(usageHistory));
  localStorage.setItem('printers_data', JSON.stringify(printers));
}

function render() {
  populateSelects();
  renderStats();
  renderCards();
  renderPrinters();
  renderUsageHistory();
}

function populateSelects() {
  const brands = [...new Set(filaments.map(f => (f.marca || '').trim()).filter(Boolean))].sort();
  const materials = [...new Set(filaments.map(f => (f.material || '').trim()).filter(Boolean))].sort();
  const colors = [...new Set(filaments.map(f => (f.cor_dominante || '').toUpperCase().trim()).filter(Boolean))].sort();

  const fill = (id, list, text) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<option value="">${text}</option>`;
    list.forEach(item => el.add(new Option(item, item)));
  };

  fill('brandFilter', brands, 'Todas as marcas');
  fill('brandQuickFilter', brands, 'Filtrar por marca...');
  fill('materialFilter', materials, 'Todos os materiais');
  fill('colorFilter', colors, 'Todas as cores');

  const pSelect = document.getElementById('printerSelectUso');
  if (pSelect) {
    pSelect.innerHTML = '<option value="">-- Selecione uma impressora --</option>' + 
    printers.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
  }
}

// LOGICA DE FILTROS CORRIGIDA
function filterFilaments() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const brand = document.getElementById('brandFilter').value;
  const color = document.getElementById('colorFilter').value;
  const material = document.getElementById('materialFilter').value;
  const status = document.getElementById('statusFilter').value;

  filteredFilaments = filaments.filter(f => {
    const matchSearch = !search || f.cor.toLowerCase().includes(search) || f.marca.toLowerCase().includes(search);
    const matchBrand = !brand || f.marca === brand;
    const matchColor = !color || f.cor_dominante.toUpperCase() === color.toUpperCase();
    const matchMaterial = !material || f.material === material;
    const matchStatus = !status || f.status === status;

    return matchSearch && matchBrand && matchColor && matchMaterial && matchStatus;
  });
  renderCards();
  renderStats();
}

function renderStats() {
  const grid = document.getElementById('statsGrid');
  if (!grid) return;
  grid.innerHTML = `<div class=\"stat-card\"><div class=\"stat-label\">Filamentos Exibidos</div><div class=\"stat-value\">${filteredFilaments.length}</div></div>`;
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
        <div class="info-row"><span>Peso:</span><span>${weight.toFixed(0)}g</span></div>
        <div class="card-actions">
          <button class="btn-primary btn-small" onclick="editFilament(${f.id})">Editar</button>
        </div>
      </div>`;
  }).join('');
}

// IMPRESSORAS
function openPrinterModal() { document.getElementById('printerModal').classList.add('active'); }
function closePrinterModal() { document.getElementById('printerModal').classList.remove('active'); }

function savePrinter(e) {
  e.preventDefault();
  printers.push({
    id: Date.now(),
    nome: document.getElementById('printerNome').value,
    slots: parseInt(document.getElementById('printerSlots').value)
  });
  saveData(); render(); closePrinterModal();
}

function renderPrinters() {
  const container = document.getElementById('printerGrid');
  if (!container) return;
  container.innerHTML = printers.map(p => `
    <div class="filament-card" style="border-top-color: var(--primary);">
      <div class="card-title"><b>${p.nome}</b></div>
      <div class="info-row"><span>Capacidade:</span><span>${p.slots} Slot(s)</span></div>
      <button class="btn-danger btn-small" onclick="deletePrinter(${p.id})">Remover</button>
    </div>`).join('');
}

function deletePrinter(id) {
  printers = printers.filter(p => p.id !== id);
  saveData(); render();
}

// REGISTRAR USO (Melhorado com Cor + Marca)
function updateUsageSlots() {
  const printerId = parseInt(document.getElementById('printerSelectUso').value);
  const container = document.getElementById('usageSlotsContainer');
  container.innerHTML = '';
  const printer = printers.find(p => p.id === printerId);
  if (!printer) return;

  for (let i = 1; i <= printer.slots; i++) {
    container.innerHTML += `
      <div class="form-row" style="background:#f9f9f9; padding:10px; margin-bottom:5px; border-radius:8px;">
        <div class="form-group"><label>Slot ${i}:</label>
          <select class="slot-filament" data-slot="${i}">
            <option value="">-- Selecione Filamento --</option>
            ${filaments.map(f => `<option value="${f.id}">${f.cor} (${f.marca})</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Gasto (g):</label><input type="number" class="slot-weight" data-slot="${i}" placeholder="0.0"></div>
      </div>`;
  }
}

function registrarUsoMultiplo() {
  const data = document.getElementById('dataImpressao').value;
  const peca = document.getElementById('nomePeca').value;
  const selects = document.querySelectorAll('.slot-filament');
  
  selects.forEach(sel => {
    const id = parseInt(sel.value);
    const weightInput = document.querySelector(`.slot-weight[data-slot="${sel.dataset.slot}"]`);
    const peso = parseFloat(weightInput.value);
    if (id && peso > 0) {
      const f = filaments.find(x => x.id === id);
      if (f) {
        f.peso_balanca -= peso;
        usageHistory.push({ data, peca, cor: f.cor, marca: f.marca, peso });
      }
    }
  });
  saveData(); render(); alert("Uso registrado!");
  document.getElementById('usageSlotsContainer').innerHTML = '';
}

function renderUsageHistory() {
  const list = document.getElementById('usageList');
  if (!list) return;
  list.innerHTML = usageHistory.slice().reverse().map(u => `
    <div style="font-size:0.85em; border-bottom:1px solid #eee; padding:5px;">
      ${u.data}: -${u.peso}g de ${u.cor} (${u.marca}) ${u.peca ? `[${u.peca}]` : ''}
    </div>`).join('');
}

// FUNCOES DE APOIO
function switchTab(id, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  btn.classList.add('active');
}

function openAddModal() { currentEditId = null; document.querySelector('#addModal form').reset(); document.getElementById('addModal').classList.add('active'); }
function closeAddModal() { document.getElementById('addModal').classList.remove('active'); }

function autoCalcGramas() {
  const b = parseFloat(document.getElementById('pesoBalanca').value) || 0;
  const e = parseFloat(document.getElementById('pesoEmbalagem').value) || 0;
  document.getElementById('gramas').value = (b - e).toFixed(1);
}

function saveFilament(e) {
  e.preventDefault();
  const f = {
    id: currentEditId || Date.now(),
    cor_dominante: document.getElementById('corDominante').value,
    cor: document.getElementById('cor').value,
    marca: document.getElementById('marca').value,
    material: document.getElementById('material').value,
    peso_balanca: parseFloat(document.getElementById('pesoBalanca').value),
    peso_embalagem: parseFloat(document.getElementById('pesoEmbalagem').value),
    status: document.getElementById('status').value || 'em_uso'
  };
  if (currentEditId) {
    const i = filaments.findIndex(x => x.id === currentEditId);
    filaments[i] = f;
  } else { filaments.push(f); }
  saveData(); render(); closeAddModal();
}

function editFilament(id) {
  const f = filaments.find(x => x.id === id);
  currentEditId = id;
  document.getElementById('corDominante').value = f.cor_dominante;
  document.getElementById('cor').value = f.cor;
  document.getElementById('marca').value = f.marca;
  document.getElementById('material').value = f.material;
  document.getElementById('pesoBalanca').value = f.peso_balanca;
  document.getElementById('pesoEmbalagem').value = f.peso_embalagem;
  autoCalcGramas();
  document.getElementById('addModal').classList.add('active');
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
function clearAllData() { if(confirm('Apagar tudo?')) { localStorage.clear(); location.reload(); } }
function setDefaultDate() { document.getElementById('dataImpressao').value = new Date().toISOString().split('T')[0]; }

window.onload = init;
