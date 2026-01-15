// DENSIDADES PADRÃO
const materialDensities = {
  'PLA': 1.24,
  'PETG': 1.27,
  'ABS': 1.04,
  'TPU': 1.22,
  'Nylon': 1.08
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

  const storedUsage = localStorage.getItem('usage_history');
  usageHistory = storedUsage ? JSON.parse(storedUsage) : [];

  const storedPrinters = localStorage.getItem('printers_data');
  printers = storedPrinters ? JSON.parse(storedPrinters) : [];
}

function loadDefaultData() {
  loadFilamentosFromSource()
    .then(data => {
      filaments = data.map(f => ({
        ...f,
        localizacao: f.localizacao || 'Prateleira A1',
        foto: null,
        fotoBlob: f.fotoBlob || null
      }));
      filteredFilaments = [...filaments];
      saveData();
      render();
    })
    .catch((err) => {
      console.error(err);
      filaments = [];
      filteredFilaments = [];
    });
}

function saveData() {
  const dataToSave = filaments.map(f => ({
    ...f,
    fotoBlob: f.fotoBlob ? f.fotoBlob : null
  }));
  localStorage.setItem('filamentos_pro', JSON.stringify(dataToSave));
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
  // Populate color filter
  const colors = [...new Set(filaments.map(f => f.cor_dominante))].sort();
  const colorFilter = document.getElementById('colorFilter');
  if (colorFilter) {
    const existingOptions = colorFilter.querySelectorAll('option:not(:first-child)');
    existingOptions.forEach(opt => opt.remove());
    colors.forEach(color => {
      const opt = document.createElement('option');
      opt.value = color;
      opt.text = color;
      colorFilter.appendChild(opt);
    });
  }

  // Populate filament selects (QR)
  ['filamentSelectQR'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) {
      sel.innerHTML = '<option value="">-- Selecione um filamento --</option>';
      filaments.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.text = `${f.cor_dominante} - ${f.cor}`;
        sel.appendChild(opt);
      });
    }
  });

  // Populate printer select (uso)
  const printerSelect = document.getElementById('printerSelectUso');
  if (printerSelect) {
    printerSelect.innerHTML = '<option value="">-- Selecione uma impressora --</option>';
    printers.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.text = p.nome;
      printerSelect.appendChild(opt);
    });
  }
}

function renderStats() {
  const total = filteredFilaments.length;
  const totalEstoque = filteredFilaments.reduce((s, f) => {
    const e = (f.peso_balanca || 0) - (f.peso_embalagem || 0);
    return s + Math.max(0, e);
  }, 0);
  const totalValue = filteredFilaments.reduce((s, f) => s + (f.preco_pago || 0), 0);
  const lowStock = filteredFilaments.filter(f => {
    const e = (f.peso_balanca || 0) - (f.peso_embalagem || 0);
    return (f.gramas || 0) > 0 && (e / (f.gramas || 1)) < 0.2 && f.status === 'em_uso';
  }).length;

  const grid = document.getElementById('statsGrid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Filamentos</div>
      <div class="stat-value">${total}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Estoque (g)</div>
      <div class="stat-value">${totalEstoque.toFixed(0)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Valor Total</div>
      <div class="stat-value">R$ ${totalValue.toFixed(2)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Baixo Estoque</div>
      <div class="stat-value" style="color: var(--danger);">${lowStock}</div>
    </div>
  `;
}

function renderCards() {
  const container = document.getElementById('filamentGrid');
  if (!container) return;

  if (filteredFilaments.length === 0) {
    container.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><div class="empty-icon">📦</div><div class="empty-text">Nenhum filamento encontrado</div></div>';
    return;
  }

  container.innerHTML = filteredFilaments.map(f => {
    const remaining = (f.peso_balanca || 0) - (f.peso_embalagem || 0);
    const percentage = (f.gramas || 0) > 0 ? (remaining / (f.gramas || 1)) * 100 : 0;
    const isLowStock = percentage < 20 && f.status === 'em_uso';
    const borderColor = colorMap[f.cor_dominante] || '#999';

    let imageHtml = '';
    if (f.fotoBlob) {
      imageHtml = `<img src="${f.fotoBlob}" class="card-image" alt="Foto">`;
    } else {
      imageHtml = `<div class="card-image" style="background: ${borderColor}; color: white; font-weight: bold;">${f.cor_dominante}</div>`;
    }

    return `
      <div class="filament-card" style="border-top-color: ${borderColor};">
        ${imageHtml}
        <div class="card-header">
          <div>
            <div class="card-title">${f.cor}</div>
            <span class="badge badge-${f.status}">${String(f.status || '').replace('_', ' ').toUpperCase()}</span>
          </div>
        </div>
        <div class="location-badge">📍 ${f.localizacao || 'Sem local'}</div>
        <div class="info-row">
          <span class="info-label">Marca:</span>
          <span>${f.marca}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Material:</span>
          <span>${f.material}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Preço:</span>
          <span>R$ ${(f.preco_pago || 0).toFixed(2)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Estoque:</span>
          <span>${remaining.toFixed(0)}g / ${(f.gramas || 0)}g</span>
        </div>
        ${isLowStock ? '<div style="background: var(--warning); color: white; padding: 6px; border-radius: 6px; font-size: 0.8em; text-align: center; margin: 8px 0;">⚠️ Baixo estoque!</div>' : ''}
        <div class="stock-bar">
          <div class="stock-fill" style="width: ${Math.min(100, percentage)}%;"></div>
        </div>
        <div class="card-actions">
          <button class="btn-secondary btn-small" onclick="viewDetails(${f.id})">Detalhes</button>
          <button class="btn-primary btn-small" onclick="editFilament(${f.id})">Editar</button>
          <button class="btn-danger btn-small" onclick="deleteFilament(${f.id})">Deletar</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderUsageHistory() {
  const list = document.getElementById('usageList');
  if (!list) return;

  if (usageHistory.length === 0) {
    list.innerHTML = '<p style="color: var(--gray); text-align: center; padding: 20px;">Nenhum uso registrado ainda</p>';
    return;
  }

  list.innerHTML = usageHistory.slice().reverse().slice(0, 20).map(u => {
    const f = filaments.find(x => x.id === u.filamentId);
    const p = printers.find(x => x.id === u.printerId);
    return `
      <div class="usage-item" style="padding: 10px; border-bottom: 1px solid var(--border);">
        <div style="display: flex; justify-content: space-between;">
          <strong>${f ? f.cor : 'Filamento Deletado'}</strong>
          <span style="color: var(--danger); font-weight: bold;">-${u.peso}g</span>
        </div>
        <div style="font-size: 0.85em; color: var(--gray);">
          ${u.data} ${u.nomePeca ? `| ${u.nomePeca}` : ''}
          ${p ? `<br>🖨️ ${p.nome} (Slot ${u.slot})` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// CÁLCULOS AUTOMÁTICOS
function autoCalcGramas() {
  const balanca = parseFloat(document.getElementById('pesoBalanca').value) || 0;
  const embalagem = parseFloat(document.getElementById('pesoEmbalagem').value) || 0;
  document.getElementById('gramas').value = (balanca - embalagem).toFixed(2);
  updateMetros();
}

function updateMetros() {
  const gramas = parseFloat(document.getElementById('gramas').value) || 0;
  const material = document.getElementById('material').value;
  const diametro = parseFloat(document.getElementById('diametro').value) || 1.75;
  const densidade = parseFloat(document.getElementById('densidade').value) || materialDensities[material] || 1.24;

  if (gramas > 0 && diametro > 0 && densidade > 0) {
    const d_cm = diametro / 10;
    const volume = Math.PI * Math.pow(d_cm / 2, 2);
    const comprimento = gramas / (volume * densidade);
    document.getElementById('metros').value = comprimento.toFixed(2);
  }
}

function switchTab(tabId, element) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  const targetTab = document.getElementById(tabId);
  if (targetTab) targetTab.classList.add('active');

  if (element) {
    element.classList.add('active');
  } else {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(t => {
      if (t.getAttribute('onclick') && t.getAttribute('onclick').includes(`'${tabId}'`)) {
        t.classList.add('active');
      }
    });
  }
}

function showTab(tabId, element) {
  switchTab(tabId, element);
}

function filterFilaments() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const color = document.getElementById('colorFilter')?.value || '';
  const status = document.getElementById('statusFilter')?.value || '';
  const material = document.getElementById('materialFilter')?.value || '';

  filteredFilaments = filaments.filter(f => {
    const matchSearch = !search || (f.cor || '').toLowerCase().includes(search) || (f.marca || '').toLowerCase().includes(search);
    const matchColor = !color || f.cor_dominante === color;
    const matchStatus = !status || f.status === status;
    const matchMaterial = !material || f.material === material;
    return matchSearch && matchColor && matchStatus && matchMaterial;
  });

  renderCards();
  renderStats();
}

function filterByStatus(status) {
  const el = document.getElementById('statusFilter');
  if (el) el.value = status;
  filterFilaments();
}

function showLowStock() {
  filteredFilaments = filaments.filter(f => {
    const remaining = (f.peso_balanca || 0) - (f.peso_embalagem || 0);
    return remaining < (f.gramas || 0) * 0.2;
  });
  renderCards();
  renderStats();
}

// REGISTRO DE USO (SLOTS)
function updateUsageSlots() {
  const printerId = parseInt(document.getElementById('printerSelectUso').value);
  const container = document.getElementById('usageSlotsContainer');
  container.innerHTML = '';

  if (!printerId) return;

  const printer = printers.find(p => p.id === printerId);
  if (!printer) return;

  for (let i = 1; i <= printer.slots; i++) {
    const slotDiv = document.createElement('div');
    slotDiv.className = 'form-row';
    slotDiv.style.background = '#f8fafc';
    slotDiv.style.padding = '15px';
    slotDiv.style.borderRadius = '8px';
    slotDiv.style.marginBottom = '10px';
    slotDiv.style.border = '1px solid var(--border)';

    slotDiv.innerHTML = `
      <div style="width: 100%; font-weight: bold; margin-bottom: 10px; color: var(--primary);">Slot ${i}</div>
      <div class="form-group" style="flex: 2;">
        <label>Filamento:</label>
        <select class="slot-filament" data-slot="${i}">
          <option value="">-- Não utilizado --</option>
          ${filaments.map(f => `<option value="${f.id}">${f.cor_dominante} - ${f.cor} (${((f.peso_balanca || 0) - (f.peso_embalagem || 0)).toFixed(0)}g)</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="flex: 1;">
        <label>Consumo (g):</label>
        <input type="number" class="slot-weight" data-slot="${i}" placeholder="0.0" step="0.1">
      </div>
    `;
    container.appendChild(slotDiv);
  }
}

function registrarUsoMultiplo() {
  const printerId = document.getElementById('printerSelectUso').value;
  const data = document.getElementById('dataImpressao').value;
  const nomePeca = document.getElementById('nomePeca').value;

  if (!printerId || !data) {
    showToast('Selecione a impressora e a data');
    return;
  }

  const slots = document.querySelectorAll('.slot-filament');
  let registeredCount = 0;

  slots.forEach(slotSelect => {
    const slotNum = slotSelect.dataset.slot;
    const filamentId = parseInt(slotSelect.value);
    const weightInput = document.querySelector(`.slot-weight[data-slot="${slotNum}"]`);
    const peso = parseFloat(weightInput.value);

    if (filamentId && peso > 0) {
      const filament = filaments.find(f => f.id === filamentId);
      if (filament) {
        filament.peso_balanca = (filament.peso_balanca || 0) - peso;
        if (filament.peso_balanca < (filament.peso_embalagem || 0)) {
          filament.peso_balanca = (filament.peso_embalagem || 0);
        }

        filament.gramas = (filament.peso_balanca || 0) - (filament.peso_embalagem || 0);
        updateMetrosForFilament(filament);

        usageHistory.push({
          filamentId: filamentId,
          printerId: parseInt(printerId),
          slot: parseInt(slotNum),
          peso: peso,
          data: data,
          nomePeca: nomePeca,
          timestamp: new Date().getTime()
        });
        registeredCount++;
      }
    }
  });

  if (registeredCount > 0) {
    saveData();
    render();
    showToast(`✓ ${registeredCount} registro(s) de uso realizados!`);

    document.querySelectorAll('.slot-weight').forEach(i => i.value = '');
    document.getElementById('nomePeca').value = '';
  } else {
    showToast('Nenhum consumo válido informado nos slots');
  }
}

function updateMetrosForFilament(f) {
  const gramas = f.gramas || 0;
  const diametro = parseFloat(f.diametro) || 1.75;
  const densidade = f.densidade || materialDensities[f.material] || 1.24;

  if (gramas > 0 && diametro > 0 && densidade > 0) {
    const d_cm = diametro / 10;
    const volume = Math.PI * Math.pow(d_cm / 2, 2);
    f.metros = gramas / (volume * densidade);
  }
}

// IMPRESSORAS
function openPrinterModal(id = null) {
  if (id) {
    const p = printers.find(x => x.id === id);
    if (!p) return;
    currentPrinterEditId = id;
    document.getElementById('printerModalTitle').textContent = 'Editar Impressora';
    document.getElementById('printerNome').value = p.nome;
    document.getElementById('printerModelo').value = p.modelo;
    document.getElementById('printerSlots').value = p.slots;
  } else {
    currentPrinterEditId = null;
    document.getElementById('printerModalTitle').textContent = 'Nova Impressora';
    document.querySelector('#printerModal form').reset();
  }
  document.getElementById('printerModal').classList.add('active');
}

function closePrinterModal() {
  document.getElementById('printerModal').classList.remove('active');
}

function savePrinter(event) {
  event.preventDefault();
  const printerData = {
    id: currentPrinterEditId || Date.now(),
    nome: document.getElementById('printerNome').value,
    modelo: document.getElementById('printerModelo').value,
    slots: parseInt(document.getElementById('printerSlots').value)
  };

  if (currentPrinterEditId) {
    const index = printers.findIndex(p => p.id === currentPrinterEditId);
    printers[index] = printerData;
  } else {
    printers.push(printerData);
  }

  saveData();
  render();
  closePrinterModal();
  showToast('Impressora salva com sucesso!');
}

function deletePrinter(id) {
  if (confirm('Deseja realmente excluir esta impressora?')) {
    printers = printers.filter(p => p.id !== id);
    saveData();
    render();
    showToast('Impressora removida');
  }
}

function renderPrinters() {
  const container = document.getElementById('printerGrid');
  if (!container) return;

  if (printers.length === 0) {
    container.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><div class="empty-icon">🖨️</div><div class="empty-text">Nenhuma impressora cadastrada</div></div>';
    return;
  }

  container.innerHTML = printers.map(p => `
    <div class="filament-card" style="border-top-color: var(--primary);">
      <div class="card-header">
        <div class="card-title">${p.nome}</div>
        <span class="badge badge-em_uso">${p.slots} SLOTS</span>
      </div>
      <div class="info-row">
        <span class="info-label">Modelo:</span>
        <span>${p.modelo || 'N/A'}</span>
      </div>
      <div class="card-actions">
        <button class="btn-primary btn-small" onclick="openPrinterModal(${p.id})">Editar</button>
        <button class="btn-danger btn-small" onclick="deletePrinter(${p.id})">Deletar</button>
      </div>
    </div>
  `).join('');
}

// MODAIS FILAMENTO
function openAddModal() {
  currentEditId = null;
  document.getElementById('modalTitle').textContent = 'Novo Filamento';
  document.querySelector('#addModal form').reset();
  document.getElementById('addModal').classList.add('active');

  const material = document.getElementById('material').value || 'PLA';
  if (material && materialDensities[material]) {
    document.getElementById('densidade').value = materialDensities[material];
  }
}

function closeAddModal() {
  document.getElementById('addModal').classList.remove('active');
}

function editFilament(id) {
  const f = filaments.find(x => x.id === id);
  if (!f) return;

  currentEditId = id;
  document.getElementById('modalTitle').textContent = 'Editar Filamento';

  document.getElementById('corDominante').value = f.cor_dominante;
  document.getElementById('cor').value = f.cor;
  document.getElementById('marca').value = f.marca;
  document.getElementById('fornecedor').value = f.fornecedor || '';
  document.getElementById('precoPago').value = f.preco_pago;
  document.getElementById('material').value = f.material;
  document.getElementById('diametro').value = f.diametro;
  document.getElementById('densidade').value = f.densidade;
  document.getElementById('gramas').value = f.gramas;
  document.getElementById('pesoBalanca').value = f.peso_balanca;
  document.getElementById('pesoEmbalagem').value = f.peso_embalagem;
  document.getElementById('metros').value = f.metros;
  document.getElementById('localizacao').value = f.localizacao || '';
  document.getElementById('status').value = f.status;
  document.getElementById('comentarios').value = f.comentarios || '';

  document.getElementById('addModal').classList.add('active');
}

function editCurrentFilament() {
  closeDetailsModal();
  editFilament(currentDetailId);
}

function saveFilament(event) {
  event.preventDefault();

  const fileInput = document.getElementById('fotoBlobInput');
  const reader = new FileReader();

  reader.onload = (e) => {
    const data = {
      cor_dominante: document.getElementById('corDominante').value,
      cor: document.getElementById('cor').value,
      marca: document.getElementById('marca').value,
      fornecedor: document.getElementById('fornecedor').value,
      preco_pago: parseFloat(document.getElementById('precoPago').value),
      material: document.getElementById('material').value,
      diametro: parseFloat(document.getElementById('diametro').value),
      densidade: parseFloat(document.getElementById('densidade').value),
      gramas: parseFloat(document.getElementById('gramas').value) || 0,
      peso_balanca: parseFloat(document.getElementById('pesoBalanca').value),
      peso_embalagem: parseFloat(document.getElementById('pesoEmbalagem').value),
      metros: parseFloat(document.getElementById('metros').value) || 0,
      localizacao: document.getElementById('localizacao').value,
      status: document.getElementById('status').value,
      comentarios: document.getElementById('comentarios').value,
      fotoBlob: e.target.result || null
    };

    if (currentEditId) {
      const existing = filaments.find(x => x.id === currentEditId);
      Object.assign(existing, data);
      showToast('Filamento atualizado!');
    } else {
      data.id = Math.max(...filaments.map(x => x.id), 0) + 1;
      filaments.push(data);
      showToast('Filamento adicionado!');
    }

    saveData();
    closeAddModal();
    render();
    filterFilaments();
  };

  if (fileInput.files.length > 0) {
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    reader.onload({ target: { result: null } });
  }
}

function deleteFilament(id) {
  if (confirm('Deletar filamento?')) {
    filaments = filaments.filter(x => x.id !== id);
    saveData();
    filterFilaments();
    showToast('Filamento deletado!');
  }
}

function deleteCurrentFilament() {
  deleteFilament(currentDetailId);
  closeDetailsModal();
}

function viewDetails(id) {
  const f = filaments.find(x => x.id === id);
  currentDetailId = id;

  const remaining = (f.peso_balanca || 0) - (f.peso_embalagem || 0);
  const percentage = (f.gramas || 0) > 0 ? (remaining / (f.gramas || 1)) * 100 : 0;
  const costPerGram = (f.gramas || 0) > 0 ? ((f.preco_pago || 0) / (f.gramas || 1)).toFixed(4) : '0.0000';
  const costPerMeter = (f.metros || 0) > 0 ? ((f.preco_pago || 0) / (f.metros || 1)).toFixed(4) : '0.0000';

  const imageHtml = f.fotoBlob ? `<img src="${f.fotoBlob}" style="width: 100%; max-height: 300px; border-radius: 8px; margin-bottom: 15px; object-fit: cover;">` : '';

  document.getElementById('detailsContent').innerHTML = `
    ${imageHtml}
    <div style="background: var(--light); padding: 20px; border-radius: 8px;">
      <div class="info-row" style="border-bottom: 1px solid var(--border); padding-bottom: 10px;">
        <span class="info-label">Cor</span>
        <span>${f.cor_dominante} - ${f.cor}</span>
      </div>
      <div class="info-row" style="border-bottom: 1px solid var(--border); padding-bottom: 10px;">
        <span class="info-label">Marca</span>
        <span>${f.marca}</span>
      </div>
      <div class="info-row" style="border-bottom: 1px solid var(--border); padding-bottom: 10px;">
        <span class="info-label">Material</span>
        <span>${f.material}</span>
      </div>
      <div class="info-row" style="border-bottom: 1px solid var(--border); padding-bottom: 10px;">
        <span class="info-label">Local</span>
        <span>📍 ${f.localizacao}</span>
      </div>
      <div class="info-row" style="border-bottom: 1px solid var(--border); padding-bottom: 10px;">
        <span class="info-label">Preço Pago</span>
        <span>R$ ${(f.preco_pago || 0).toFixed(2)}</span>
      </div>
      <div class="info-row" style="border-bottom: 1px solid var(--border); padding-bottom: 10px;">
        <span class="info-label">Diâmetro</span>
        <span>${f.diametro}mm</span>
      </div>
      <div class="info-row" style="border-bottom: 1px solid var(--border); padding-bottom: 10px;">
        <span class="info-label">Densidade</span>
        <span>${f.densidade} g/cm³</span>
      </div>
      <div class="info-row" style="border-bottom: 1px solid var(--border); padding-bottom: 10px;">
        <span class="info-label">Peso Total</span>
        <span>${f.gramas}g</span>
      </div>
      <div class="info-row" style="border-bottom: 1px solid var(--border); padding-bottom: 10px;">
        <span class="info-label">Comprimento Total</span>
        <span>${(f.metros || 0).toFixed(0)}m</span>
      </div>
      <div class="info-row" style="border-bottom: 1px solid var(--border); padding-bottom: 10px;">
        <span class="info-label">Estoque Restante</span>
        <span>${remaining.toFixed(0)}g (${percentage.toFixed(0)}%)</span>
      </div>
      <div class="info-row" style="border-bottom: 1px solid var(--border); padding-bottom: 10px;">
        <span class="info-label">Custo/Grama</span>
        <span>R$ ${costPerGram}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Custo/Metro</span>
        <span>R$ ${costPerMeter}</span>
      </div>
      ${f.comentarios ? `<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border);"><strong>Notas:</strong><p>${f.comentarios}</p></div>` : ''}
    </div>
  `;

  document.getElementById('detailsModal').classList.add('active');
}

function closeDetailsModal() {
  document.getElementById('detailsModal').classList.remove('active');
}

// QR CODE
function generateQR() {
  const filamentId = parseInt(document.getElementById('filamentSelectQR').value);
  if (!filamentId) return;

  const filament = filaments.find(f => f.id === filamentId);
  if (!filament) return;

  currentQRFilament = filament;

  const qrData = JSON.stringify({
    id: filament.id,
    cor: filament.cor,
    marca: filament.marca,
    localizacao: filament.localizacao
  });

  document.getElementById('qrcode-generator').innerHTML = '';
  new QRCode(document.getElementById('qrcode-generator'), {
    text: qrData,
    width: 256,
    height: 256
  });

  document.getElementById('qrOutput').style.display = 'block';
}

function printQRCode() {
  if (!currentQRFilament) return;

  const printWindow = window.open('', '', 'height=400,width=400');
  const qrcodeHtml = document.getElementById('qrcode-generator').innerHTML;

  printWindow.document.write(`
    <html>
    <head>
      <title>Etiqueta QR - ${currentQRFilament.cor}</title>
      <style>
        body { text-align: center; padding: 20px; font-family: Arial; }
        .label { border: 2px solid black; padding: 20px; width: 300px; margin: 0 auto; }
        h3 { margin: 0; color: #333; }
        p { margin: 5px 0; color: #666; font-size: 12px; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="label">
        <h3>${currentQRFilament.cor}</h3>
        <p>${currentQRFilament.marca}</p>
        <p>📍 ${currentQRFilament.localizacao}</p>
        ${qrcodeHtml}
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

let html5QrCodeScanner = null;

function startScanning() {
  if (!html5QrCodeScanner) {
    html5QrCodeScanner = new Html5Qrcode("scanner");
  }

  const config = { fps: 10, qrbox: 250 };

  html5QrCodeScanner.start(
    { facingMode: "environment" },
    config,
    (decodedText) => {
      try {
        const data = JSON.parse(decodedText);
        const filament = filaments.find(f => f.id === data.id);
        if (filament) {
          document.getElementById('scanResult').style.display = 'block';
          document.getElementById('scanResult').innerHTML = `
            <div style="background: var(--success); color: white; padding: 15px; border-radius: 8px;">
              <strong>✓ Encontrado!</strong><br>
              ${filament.cor}<br>
              ${filament.marca}<br>
              📍 ${filament.localizacao}
              <button class="btn-secondary btn-small" style="width: 100%; margin-top: 10px;" onclick="viewDetails(${filament.id})">Ver Detalhes</button>
            </div>
          `;
          stopScanning();
        }
      } catch (e) {
        console.error("Erro ao processar QR Code", e);
      }
    }
  ).catch(err => {
    showToast("Erro ao acessar câmera: " + err);
  });

  scannerActive = true;
  showToast('Scanner iniciado');
}

function stopScanning() {
  if (html5QrCodeScanner && scannerActive) {
    html5QrCodeScanner.stop().then(() => {
      scannerActive = false;
      showToast('Scanner parado');
    }).catch(err => console.error(err));
  }
}

// CALCULADORA DE PREÇO
function calcularPreco() {
  const custoMaterial = parseFloat(document.getElementById('calcCustoMaterial').value) || 0;
  const tempoHoras = parseFloat(document.getElementById('calcTempoHoras').value) || 0;
  const custoEnergia = parseFloat(document.getElementById('calcCustoEnergia').value) || 0.50;
  const custoMaoObra = parseFloat(document.getElementById('calcCustoMaoObra').value) || 50;
  const margemLucro = parseFloat(document.getElementById('calcMargemLucro').value) || 40;

  const custoEnergiaTotal = tempoHoras * custoEnergia;
  const custoMaoObraTotal = tempoHoras * custoMaoObra;
  const custoTotal = custoMaterial + custoEnergiaTotal + custoMaoObraTotal;
  const lucro = custoTotal * (margemLucro / 100);
  const precoFinal = custoTotal + lucro;

  document.getElementById('resultado-material').textContent = `R$ ${custoMaterial.toFixed(2)}`;
  document.getElementById('resultado-energia').textContent = `R$ ${custoEnergiaTotal.toFixed(2)}`;
  document.getElementById('resultado-mao').textContent = `R$ ${custoMaoObraTotal.toFixed(2)}`;
  document.getElementById('resultado-subtotal').textContent = `R$ ${custoTotal.toFixed(2)}`;
  document.getElementById('resultado-preco').textContent = `R$ ${precoFinal.toFixed(2)}`;
  document.getElementById('resultado-lucro').textContent = `Lucro: R$ ${lucro.toFixed(2)} (${margemLucro}%)`;

  document.getElementById('calculoResultado').style.display = 'block';
}

function copiarPreco() {
  const preco = document.getElementById('resultado-preco').textContent;
  navigator.clipboard.writeText(preco);
  showToast('Preço copiado!');
}

// EXPORTAÇÃO/IMPORTAÇÃO
function exportJSON() {
  const blob = new Blob([JSON.stringify(filaments, null, 2)], { type: 'application/json' });
  downloadFile(blob, 'filamentos_backup.json');
  showToast('Exportado como JSON!');
}

function exportCSV() {
  const headers = ['ID', 'Cor', 'Marca', 'Material', 'Preço', 'Peso', 'Metros', 'Local', 'Status'];
  const rows = filaments.map(f => [f.id, f.cor, f.marca, f.material, f.preco_pago, f.gramas, (f.metros || 0).toFixed(0), f.localizacao, f.status]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadFile(blob, 'filamentos.csv');
  showToast('Exportado como CSV!');
}

function downloadFile(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importData() {
  document.getElementById('importFile').click();
}

function handleImport(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      // Aceita: array direto (filamentos) OU objeto { filaments, printers, usageHistory }
      if (Array.isArray(data)) {
        filaments = data;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.filaments)) filaments = data.filaments;
        if (Array.isArray(data.printers)) printers = data.printers;
        if (Array.isArray(data.usageHistory)) usageHistory = data.usageHistory;
      }

      filteredFilaments = [...filaments];
      saveData();
      render();
      showToast('Dados importados!');
    } catch (err) {
      console.error(err);
      showToast('Erro ao importar');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (confirm('Tem CERTEZA? Esta ação não pode ser desfeita!')) {
    filaments = [];
    filteredFilaments = [];
    usageHistory = [];
    printers = [];
    saveData();
    render();
    showToast('Todos os dados foram deletados!');
  }
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

init();
