const colorMap = {
  'AZUL': '#3b82f6', 'AMARELO': '#fbbf24', 'ROXO': '#a855f7', 'CINZA': '#9ca3af', 
  'LARANJA': '#f97316', 'PRETO': '#1f2937', 'VERMELHO': '#ef4444', 'VERDE': '#22c55e', 
  'BRANCO': '#f5f5f5', 'ROSA': '#ec4899', 'MARROM': '#92400e', 'BEGE': '#daa520'
};

let filaments = [];
let filteredFilaments = [];
let printers = JSON.parse(localStorage.getItem('printers_data') || '[]');
let usageHistory = JSON.parse(localStorage.getItem('usage_history') || '[]');
let calcHistory = JSON.parse(localStorage.getItem('calc_history') || '[]');
let currentEditId = null;
let currentPrinterEditId = null;

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
  localStorage.setItem('calc_history', JSON.stringify(calcHistory));
}

function render() {
  populateSelects();
  renderStats();
  renderCards();
  renderPrinters();
  renderUsageHistory();
  renderCalcHistory();
}

function populateSelects() {
  const sortedFilaments = [...filaments].sort((a, b) => `${a.cor} ${a.marca}`.localeCompare(`${b.cor} ${b.marca}`));
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

  const cSelect = document.getElementById('calcFilamento');
  if (cSelect) {
    cSelect.innerHTML = '<option value="">-- Escolha o Filamento --</option>' + 
    sortedFilaments.map(f => `<option value="${f.id}">${f.cor} (${f.marca})</option>`).join('');
  }
}

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
  grid.innerHTML = `<div class="stat-card"><div class="stat-label">Total de Itens</div><div class="stat-value">${filteredFilaments.length}</div></div>`;
}

function renderCards() {
  const container = document.getElementById('filamentGrid');
  if (!container) return;
  container.innerHTML = filteredFilaments.map(f => {
    const currentWeight = (parseFloat(f.peso_balanca || 0) - parseFloat(f.peso_embalagem || 0));
    const initialWeight = parseFloat(f.gramas || currentWeight || 1);
    const percentage = Math.max(0, Math.min(100, (currentWeight / initialWeight) * 100));
    
    // Cor da barra (Verde -> Amarelo -> Vermelho)
    const hue = (percentage * 1.2).toString(10); 
    const barColor = `hsl(${hue}, 70%, 45%)`;

    const color = colorMap[f.cor_dominante.toUpperCase()] || '#ccc';
    return `
      <div class="filament-card" style="border-top-color: ${color}">
        <div class="card-title"><b>${f.cor}</b></div>
        <div class="info-row"><span>Marca:</span><span>${f.marca}</span></div>
        <div class="info-row"><span>Restante:</span><span>${currentWeight.toFixed(0)}g</span></div>
        <div style="height: 18px; width: 100%; background: #eee; border-radius: 9px; overflow: hidden; margin-top: 10px; position: relative;">
          <div style="width: ${percentage}%; height: 100%; background: ${barColor}; transition: 0.3s;"></div>
          <span style="position: absolute; width: 100%; text-align: center; font-size: 10px; font-weight: bold; top: 2px; color: ${percentage < 50 ? '#333' : '#fff'}">${percentage.toFixed(1)}%</span>
        </div>
        <div class="card-actions">
          <button class="btn-primary btn-small" onclick="editFilament(${f.id})">Editar</button>
        </div>
      </div>`;
  }).join('');
}

// IMPRESSORAS
function openPrinterModal(id = null) {
  currentPrinterEditId = id;
  if (id) {
    const p = printers.find(x => x.id === id);
    document.getElementById('printerNome').value = p.nome;
    document.getElementById('printerSlots').value = p.slots;
  } else {
    document.querySelector('#printerModal form').reset();
  }
  document.getElementById('printerModal').classList.add('active');
}
function closePrinterModal() { document.getElementById('printerModal').classList.remove('active'); }

function savePrinter(e) {
  e.preventDefault();
  const data = {
    id: currentPrinterEditId || Date.now(),
    nome: document.getElementById('printerNome').value,
    slots: parseInt(document.getElementById('printerSlots').value)
  };
  if (currentPrinterEditId) {
    const idx = printers.findIndex(x => x.id === currentPrinterEditId);
    printers[idx] = data;
  } else {
    printers.push(data);
  }
  saveData(); render(); closePrinterModal();
}

function renderPrinters() {
  const container = document.getElementById('printerGrid');
  if (!container) return;
  container.innerHTML = printers.map(p => `
    <div class="filament-card" style="border-top-color: var(--primary);">
      <div class="card-title"><b>${p.nome}</b></div>
      <div class="info-row"><span>Capacidade:</span><span>${p.slots} Slot(s)</span></div>
      <div class="card-actions">
        <button class="btn-primary btn-small" onclick="openPrinterModal(${p.id})">Editar</button>
        <button class="btn-danger btn-small" onclick="deletePrinter(${p.id})">Remover</button>
      </div>
    </div>`).join('');
}
function deletePrinter(id) {
  if(confirm("Remover impressora?")) { printers = printers.filter(p => p.id !== id); saveData(); render(); }
}

// REGISTRAR USO
function updateUsageSlots() {
  const printerId = parseInt(document.getElementById('printerSelectUso').value);
  const container = document.getElementById('usageSlotsContainer');
  container.innerHTML = '';
  const printer = printers.find(p => p.id === printerId);
  if (!printer) return;
  const sorted = [...filaments].sort((a,b) => a.cor.localeCompare(b.cor));
  for (let i = 1; i <= printer.slots; i++) {
    container.innerHTML += `
      <div class="form-row" style="background:#f9f9f9; padding:10px; margin-bottom:5px; border-radius:8px;">
        <div class="form-group"><label>Slot ${i}:</label>
          <select class="slot-filament" data-slot="${i}">
            <option value="">-- Selecione --</option>
            ${sorted.map(f => `<option value="${f.id}">${f.cor} (${f.marca})</option>`).join('')}
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
    const weightInput = document.querySelector(`.slot-weight[sel.dataset.slot="${sel.dataset.slot}"]`); // Corrigido seletor
    const peso = parseFloat(document.querySelector(`.slot-weight[data-slot="${sel.dataset.slot}"]`).value);
    if (id && peso > 0) {
      const f = filaments.find(x => x.id === id);
      if (f) {
        f.peso_balanca -= peso;
        usageHistory.push({ data, peca, cor: f.cor, marca: f.marca, peso });
      }
    }
  });
  saveData(); render(); alert("Estoque atualizado!");
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

// CALCULADORA AVANÇADA
function calcularPreco() {
  const filamentoId = parseInt(document.getElementById('calcFilamento').value);
  const peso = parseFloat(document.getElementById('calcPeso').value) || 0;
  const h = parseFloat(document.getElementById('calcTempoHoras').value) || 0;
  const m = parseFloat(document.getElementById('calcTempoMinutos').value) || 0;
  const horaMaq = parseFloat(document.getElementById('calcHoraMaq').value) || 0;
  const maoObra = parseFloat(document.getElementById('calcMaoObra').value) || 0;
  const insumos = parseFloat(document.getElementById('calcInsumos').value) || 0;
  const embalagem = parseFloat(document.getElementById('calcEmbalagem').value) || 0;
  const transporte = parseFloat(document.getElementById('calcTransporte').value) || 0;
  const margem = parseFloat(document.getElementById('calcMargem').value) || 0;
  const impostoPct = parseFloat(document.getElementById('calcImposto').value) || 0;

  if (!filamentoId || (peso <= 0 && h <= 0 && m <= 0)) {
    document.getElementById('resultadoCalculo').style.display = 'none';
    return;
  }

  const f = filaments.find(x => x.id === filamentoId);
  const custoMaterial = peso * (f.preco_pago / 1000);
  const tempoTotalHoras = h + (m / 60);
  const custoEnergiaMaq = tempoTotalHoras * horaMaq;
  
  const custoBase = custoMaterial + custoEnergiaMaq + maoObra + insumos + embalagem + transporte;
  const valorComMargem = custoBase * (1 + margem / 100);
  const valorFinal = valorComMargem / (1 - impostoPct / 100);

  document.getElementById('resTotal').textContent = `R$ ${valorFinal.toFixed(2)}`;
  document.getElementById('resBreakdown').innerHTML = `
    Material: R$ ${custoMaterial.toFixed(2)}<br>
    Energia/Maq: R$ ${custoEnergiaMaq.toFixed(2)}<br>
    Mão de Obra + Extras: R$ ${(maoObra + insumos).toFixed(2)}<br>
    <b>Custo de Produção: R$ ${custoBase.toFixed(2)}</b>
  `;
  document.getElementById('resultadoCalculo').style.display = 'block';
}

function salvarOrcamento() {
  const peca = document.getElementById('calcNomePeca').value;
  const cliente = document.getElementById('calcCliente').value || "Final";
  const valor = document.getElementById('resTotal').textContent;
  if (!peca || valor === "R$ 0,00") { alert("Cálculo incompleto!"); return; }
  calcHistory.push({ data: new Date().toLocaleDateString(), peca, cliente, valor });
  saveData(); renderCalcHistory(); alert("Orçamento salvo!");
}

function renderCalcHistory() {
  const list = document.getElementById('calcHistory');
  if (!list) return;
  list.innerHTML = calcHistory.slice().reverse().map(c => `
    <div style="font-size:0.85em; border-bottom:1px solid #eee; padding:8px; background: white; margin-bottom:5px; border-radius:5px;">
      <b>${c.peca}</b> | ${c.cliente}<br><b style="color: var(--primary);">${c.valor}</b> <small style="float:right">${c.data}</small>
    </div>`).join('');
}

// AUXILIARES
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
  const pesoB = parseFloat(document.getElementById('pesoBalanca').value);
  const pesoE = parseFloat(document.getElementById('pesoEmbalagem').value);
  const f = {
    id: currentEditId || Date.now(),
    cor_dominante: document.getElementById('corDominante').value,
    cor: document.getElementById('cor').value,
    marca: document.getElementById('marca').value,
    material: document.getElementById('material').value,
    peso_balanca: pesoB,
    peso_embalagem: pesoE,
    gramas: pesoB - pesoE, // Salva o peso líquido inicial para a barra de progresso
    preco_pago: parseFloat(document.getElementById('precoPago').value),
    status: document.getElementById('status').value || 'em_uso'
  };
  if (currentEditId) {
    const i = filaments.findIndex(x => x.id === currentEditId);
    filaments[i] = {...filaments[i], ...f};
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
  document.getElementById('precoPago').value = f.preco_pago;
  document.getElementById('status').value = f.status;
  autoCalcGramas();
  document.getElementById('addModal').classList.add('active');
}
function filterByBrand(v) { document.getElementById('brandFilter').value = v; filterFilaments(); }
function showLowStock() {
    filteredFilaments = filaments.filter(f => (f.peso_balanca - f.peso_embalagem) < 200);
    renderCards();
}
function exportJSON() {
    const blob = new Blob([JSON.stringify({filaments, printers, usageHistory, calcHistory})], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'backup_3d.json'; a.click();
}
function clearAllData() { if(confirm('Apagar tudo?')) { localStorage.clear(); location.reload(); } }
function setDefaultDate() { document.getElementById('dataImpressao').value = new Date().toISOString().split('T')[0]; }

window.onload = init;
