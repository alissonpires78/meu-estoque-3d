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
  loadData();
  setDefaultDate();
  render();
}

function loadData() {
  const stored = localStorage.getItem('filamentos_pro');
  if (stored) {
    filaments = JSON.parse(stored);
  } else if (typeof loadFilamentosFromSource === 'function') {
    loadFilamentosFromSource().then(data => {
      filaments = data;
      saveData();
      render();
    });
  }
  filteredFilaments = [...filaments];
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

function renderStats() {
  const grid = document.getElementById('statsGrid');
  if (!grid) return;
  const totalItems = filteredFilaments.length;
  grid.innerHTML = `<div class="stat-card"><div class="stat-label">Filamentos</div><div class="stat-value">${totalItems}</div></div>`;
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

// GESTÃO DE IMPRESSORAS
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

// USO E SLOTS
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
            <option value="">-- Selecione --</option>
            ${filaments.map(f => `<option value="${f.id}">${f.cor}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Gasto (g):</label><input type="number" class="slot-weight" data-slot="${i}"></div>
      </div>`;
  }
}

function registrarUsoMultiplo() {
  const data = document.getElementById('dataImpressao').value;
  const peca = document.getElementById('nomePeca').value;
  const selects = document.querySelectorAll('.slot-filament');
  
  selects.forEach(sel => {
    const id = parseInt(sel.value);
    const peso = parseFloat(document.querySelector(`.slot-weight[data-slot="${sel.dataset.slot}"]`).value);
    if (id && peso > 0) {
      const f = filaments.find(x => x.id === id);
      if (f) {
        f.peso_balanca -= peso;
        usageHistory.push({ data, peca, cor: f.cor, peso });
      }
    }
  });
  saveData(); render(); alert("Estoque atualizado!");
}

function renderUsageHistory() {
  const list = document.getElementById('usageList');
  if (!list) return;
  list.innerHTML = usageHistory.slice().reverse().map(u => `
    <div style="font-size:0.85em; border-bottom:1px solid #eee; padding:5px;">
      ${u.data}: -${u.peso}g de ${u.cor} ${u.peca ? `(${u.peca})` : ''}
    </div>`).join('');
}

// FUNÇÕES BASE
function switchTab(id, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  btn.classList.add('active');
}

function openAddModal() { currentEditId = null; document.getElementById('addModal').classList.add('active'); }
function closeAddModal() { document.getElementById('addModal').classList.remove('active'); }

function autoCalcGramas() {
  const b = parseFloat(document.getElementById('pesoBalanca').value) || 0;
  const e = parseFloat(document.getElementById('pesoEmbalagem').value) || 0;
  document.getElementById('gramas').value = b - e;
}

function filterFilaments() {
  const s = document.getElementById('searchInput').value.toLowerCase();
  filteredFilaments = filaments.filter(f => !s || f.cor.toLowerCase().includes(s) || f.marca.toLowerCase().includes(s));
  renderCards();
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
  };
  if (currentEditId) {
    const i = filaments.findIndex(x => x.id === currentEditId);
    filaments[i] = f;
  } else { filaments.push(f); }
  saveData(); init(); closeAddModal();
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
  openAddModal();
}

function setDefaultDate() { document.getElementById('dataImpressao').value = new Date().toISOString().split('T')[0]; }

window.onload = init;
