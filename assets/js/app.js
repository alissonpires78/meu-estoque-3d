/* === app.js COMPLETO E CORRIGIDO === */

const materialDensities = {
  'PLA': 1.24, 'PETG': 1.27, 'ABS': 1.04, 'TPU': 1.22, 'Nylon': 1.08
};

const colorMap = {
  'AZUL': '#3b82f6', 'AMARELO': '#fbbf24', 'ROXO': '#a855f7',
  'CINZA': '#9ca3af', 'LARANJA': '#f97316', 'PRETO': '#1f2937',
  'VERMELHO': '#ef4444', 'VERDE': '#22c55e', 'BRANCO': '#f5f5f5',
  'ROSA': '#ec4899', 'MARROM': '#92400e', 'BEGE': '#daa520'
};

let filaments = [];
let filteredFilaments = [];
let printers = [];
let currentEditId = null;
let currentDetailId = null;
let currentPrinterEditId = null;
let usageHistory = [];
let scannerActive = false;
let currentQRFilament = null;

function init() {
  loadData();
  setDefaultDate();
  render();
}

function setDefaultDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const el = document.getElementById('dataImpressao');
  if (el) el.value = `${yyyy}-${mm}-${dd}`;
}

function loadData() {
  const stored = localStorage.getItem('filamentos_pro');
  if (stored) {
    filaments = JSON.parse(stored);
  } else {
    loadDefaultData();
    return;
  }
  filteredFilaments = [...filaments];
  usageHistory = JSON.parse(localStorage.getItem('usage_history') || '[]');
  printers = JSON.parse(localStorage.getItem('printers_data') || '[]');
}

function loadDefaultData() {
  if (typeof loadFilamentosFromSource === 'function') {
    loadFilamentosFromSource()
      .then(data => {
        filaments = data.map(f => ({
          ...f,
          localizacao: f.localizacao || 'Prateleira A1',
          fotoBlob: f.fotoBlob || null
        }));
        filteredFilaments = [...filaments];
        saveData();
        render();
      })
      .catch(err => console.error("Erro ao carregar dados iniciais:", err));
  }
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
  renderUsageHistory();
  renderPrinters();
}

function populateSelects() {
  // CORES DINÂMICAS
  const colors = [...new Set(filaments.map(f => f.cor_dominante).filter(Boolean))].sort();
  const colorFilter = document.getElementById('colorFilter');
  if (colorFilter) {
    colorFilter.innerHTML = '<option value="">Todas as cores</option>';
    colors.forEach(c => colorFilter.add(new Option(c, c)));
  }

  // MARCAS DINÂMICAS (Resolve Problema 1)
  const brands = [...new Set(filaments.map(f => (f.marca || '').trim()).filter(Boolean))].sort();
  const bFilter = document.getElementById('brandFilter');
  const bQuick = document.getElementById('brandQuickFilter');
  
  if (bFilter) {
    bFilter.innerHTML = '<option value="">Todas as marcas</option>';
    brands.forEach(b => bFilter.add(new Option(b, b)));
  }
  if (bQuick) {
    bQuick.innerHTML = '<option value="">Filtrar por marca...</option>';
    brands.forEach(b => bQuick.add(new Option(b, b)));
  }

  // MATERIAIS DINÂMICOS (Resolve Problema 2 - Nylon)
  const materials = [...new Set(filaments.map(f => f.material).filter(Boolean))].sort();
  const mFilter = document.getElementById('materialFilter');
  if (mFilter) {
    mFilter.innerHTML = '<option value="">Todos os materiais</option>';
    materials.forEach(m => mFilter.add(new Option(m, m)));
  }

  // SELECTS DE APOIO
  const selQR = document.getElementById('filamentSelectQR');
  if (selQR) {
    selQR.innerHTML = '<option value="">-- Selecione um filamento --</option>';
    filaments.forEach(f => selQR.add(new Option(`${f.cor_dominante} - ${f.cor}`, f.id)));
  }

  const printerSelect = document.getElementById('printerSelectUso');
  if (printerSelect) {
    printerSelect.innerHTML = '<option value="">-- Selecione uma impressora --</option>';
    printers.forEach(p => printerSelect.add(new Option(p.nome, p.id)));
  }
}

function filterFilaments() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const color = document.getElementById('colorFilter')?.value || '';
  const brand = document.getElementById('brandFilter')?.value || '';
  const status = document.getElementById('statusFilter')?.value || '';
  const material = document.getElementById('materialFilter')?.value || '';

  filteredFilaments = filaments.filter(f => {
    return (!search || (f.cor||'').toLowerCase().includes(search) || (f.marca||'').toLowerCase().includes(search)) &&
           (!color || f.cor_dominante === color) &&
           (!brand || f.marca === brand) &&
           (!status || f.status === status) &&
           (!material || f.material === material);
  });
  renderCards();
  renderStats();
}

function filterByBrand(brand) {
  const bFilter = document.getElementById('brandFilter');
  if (bFilter) bFilter.value = brand;
  filterFilaments();
}

function renderStats() {
  const grid = document.getElementById('statsGrid');
  if (!grid) return;
  const totalEstoque = filteredFilaments.reduce((s, f) => s + Math.max(0, (f.peso_balanca||0)-(f.peso_embalagem||0)), 0);
  const totalValue = filteredFilaments.reduce((s, f) => s + (f.preco_pago || 0), 0);
  
  grid.innerHTML = `
    <div class="stat-card"><div class="stat-label">Filamentos</div><div class="stat-value">${filteredFilaments.length}</div></div>
    <div class="stat-card"><div class="stat-label">Estoque (g)</div><div class="stat-value">${totalEstoque.toFixed(0)}</div></div>
    <div class="stat-card"><div class="stat-label">Valor Total</div><div class="stat-value">R$ ${totalValue.toFixed(2)}</div></div>
  `;
}

function renderCards() {
  const container = document.getElementById('filamentGrid');
  if (!container) return;
  container.innerHTML = filteredFilaments.map(f => {
    const remaining = (f.peso_balanca || 0) - (f.peso_embalagem || 0);
    const percentage = (f.gramas || 0) > 0 ? (remaining / f.gramas) * 100 : 0;
    const borderColor = colorMap[f.cor_dominante] || '#999';
    return `
      <div class="filament-card" style="border-top-color: ${borderColor};">
        ${f.fotoBlob ? `<img src="${f.fotoBlob}" class="card-image">` : `<div class="card-image" style="background:${borderColor}"></div>`}
        <div class="card-title">${f.cor}</div>
        <div class="info-row"><span class="info-label">Marca:</span><span>${f.marca}</span></div>
        <div class="info-row"><span class="info-label">Estoque:</span><span>${remaining.toFixed(0)}g</span></div>
        <div class="stock-bar"><div class="stock-fill" style="width:${Math.min(100, percentage)}%"></div></div>
        <div class="card-actions">
          <button class="btn-secondary btn-small" onclick="viewDetails(${f.id})">Detalhes</button>
          <button class="btn-primary btn-small" onclick="editFilament(${f.id})">Editar</button>
        </div>
      </div>`;
  }).join('');
}

function openAddModal() {
  currentEditId = null;
  document.getElementById('modalTitle').textContent = 'Novo Filamento';
  document.querySelector('#addModal form').reset();
  document.getElementById('addModal').classList.add('active');
}

function closeAddModal() { document.getElementById('addModal').classList.remove('active'); }

function editFilament(id) {
  const f = filaments.find(x => x.id === id);
  if (!f) return;
  currentEditId = id;
  document.getElementById('corDominante').value = f.cor_dominante;
  document.getElementById('cor').value = f.cor;
  document.getElementById('marca').value = f.marca;
  document.getElementById('precoPago').value = f.preco_pago;
  document.getElementById('material').value = f.material;
  document.getElementById('pesoBalanca').value = f.peso_balanca;
  document.getElementById('pesoEmbalagem').value = f.peso_embalagem;
  document.getElementById('addModal').classList.add('active');
}

function saveFilament(event) {
  event.preventDefault();
  const data = {
    id: currentEditId || Date.now(),
    cor_dominante: document.getElementById('corDominante').value,
    cor: document.getElementById('cor').value,
    marca: document.getElementById('marca').value,
    preco_pago: parseFloat(document.getElementById('precoPago').value),
    material: document.getElementById('material').value,
    peso_balanca: parseFloat(document.getElementById('pesoBalanca').value),
    peso_embalagem: parseFloat(document.getElementById('pesoEmbalagem').value),
    gramas: parseFloat(document.getElementById('pesoBalanca').value) - parseFloat(document.getElementById('pesoEmbalagem').value),
    status: document.getElementById('status').value,
    localizacao: document.getElementById('localizacao').value
  };

  if (currentEditId) {
    const idx = filaments.findIndex(x => x.id === currentEditId);
    filaments[idx] = {...filaments[idx], ...data};
  } else {
    filaments.push(data);
  }
  saveData();
  closeAddModal();
  render();
  showToast("Salvo com sucesso!");
}

function deleteFilament(id) {
    if(confirm("Excluir?")) {
        filaments = filaments.filter(f => f.id !== id);
        saveData();
        render();
    }
}

function viewDetails(id) {
    const f = filaments.find(x => x.id === id);
    alert(`Filamento: ${f.cor}\nMarca: ${f.marca}\nMaterial: ${f.material}\nEstoque: ${f.peso_balanca - f.peso_embalagem}g`);
}

function showToast(m) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = m;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function switchTab(id, el) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  el.classList.add('active');
}

// Inicialização
window.onload = init;
