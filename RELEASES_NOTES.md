# 📋 Release Notes - Versão 3.0

## 🎉 O que Mudou

### ✨ Novas Funcionalidades

#### 1. **IndexedDB - Persistência Robusta**
- ✅ Armazenamento persistente até 50MB+
- ✅ Suporta fotos em alta qualidade
- ✅ Sincronização automática
- ✅ Sem limite de tempo (dados permanecem)
- ✅ Backup e restauração em JSON

#### 2. **Múltiplas Impressoras 🖨️**
- ✅ Cadastro de impressoras
- ✅ Modelo, marca, especificações
- ✅ Histórico de uso por equipamento
- ✅ Seleção ao registrar uso

#### 3. **Registrar Uso Avançado ➖**
- ✅ **Até 4 filamentos simultâneos**
- ✅ Seleção por Slot (Slot 1, 2, 3, 4)
- ✅ Consumo estimado por filamento
- ✅ Atualização automática de estoque
- ✅ Histórico completo

#### 4. **Scanner QR com Câmera 📱**
- ✅ Acesso à câmera do dispositivo
- ✅ Scanner em tempo real
- ✅ Detecção automática
- ✅ Suporte a câmera frontal/traseira
- ✅ Funciona offline após primeira carga

#### 5. **Estrutura GitHub Profissional**
- ✅ README.md completo
- ✅ INSTALACAO.md com guias
- ✅ LICENSE.md (MIT)
- ✅ .gitignore
- ✅ Pronto para fork/clone

---

## 🔧 Melhorias Técnicas

### Interface
- Fotos em modo `contain` (exibição completa)
- Sem cropping ou zoom
- Layout responsivo (desktop/tablet/mobile)
- 6 abas especializadas

### Performance
- SPA (Single Page Application)
- Carregamento < 2 segundos
- Sem dependências backend
- Totalmente offline

### Banco de Dados
- **Antes:** localStorage (5-10MB)
- **Agora:** IndexedDB (50MB+)
- Estrutura multi-store:
  - filamentos
  - impressoras
  - uso_historico
  - qrcodes

---

## 📱 Compatibilidade

### Navegadores
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Opera 47+

### Dispositivos
- ✅ Desktop (Windows, Mac, Linux)
- ✅ Tablet (iPad, Samsung Tab)
- ✅ Smartphone (iOS, Android)

### Câmera
- ✅ Desktop: todos os navegadores
- ✅ Android: Chrome, Firefox, Edge
- ✅ iOS: Safari (recomendado)

---

## 🎯 Como Usar - Guia Rápido

### 1. Instalar
```bash
git clone https://github.com/alissonpires78/meu-estoque-3d.git
cd meu-estoque-3d
python -m http.server 8000
# Acesse: http://localhost:8000
```

### 2. Adicionar Impressora
- Aba "🖨️ Impressoras"
- "+ Adicionar Impressora"
- Nome, modelo, diâmetro

### 3. Adicionar Filamentos
- Aba "📦 Estoque"
- "+ Novo Filamento"
- Preencha campos (fotos opcionais)

### 4. Registrar Uso
- Aba "➖ Registrar Uso"
- Selecione impressora
- Preench até 4 slots
- Clique "✓ Registrar Usos"

### 5. Gerar QR Codes
- Aba "📱 QR Code"
- Selecione filamento
- Imprima etiqueta
- Cole no carretel

### 6. Calcular Preço
- Aba "💰 Calculadora"
- Preencha custos
- Resultado automático

---

## 🔐 Dados e Privacidade

### Armazenamento
- IndexedDB: banco de dados local
- Sem servidor
- Sem sincronização em nuvem
- 100% offline após primeira carga

### Backup
- Exportar dados: JSON completo
- Importar backup: restauração total
- Automático: sem perder dados

### Segurança
- ✅ Sem login necessário
- ✅ Sem email
- ✅ Sem rastreamento
- ✅ Código aberto (auditável)

---

## 📊 Estrutura de Dados

### Filamento
```javascript
{
  id: number,
  cor_dominante: string,
  modelo: string,
  marca: string,
  material: string,
  preco: number,
  peso_balanca: number,
  local: string,
  fotoBlob: data URL
}
```

### Impressora
```javascript
{
  id: number,
  nome: string,
  modelo: string,
  diametro: number
}
```

### Uso
```javascript
{
  printerId: number,
  filamentoId: number,
  peso: number,
  data: date,
  nomePeca: string,
  timestamp: ISO string
}
```

---

## 🐛 Bugs Corrigidos

- ✅ Fotos eram exibidas com zoom/cropping
- ✅ Scanner QR não funcionava sem permissão de câmera
- ✅ localStorage limitado a 5-10MB
- ✅ Sem suporte a múltiplas impressoras
- ✅ Sem rastreamento de múltiplos filamentos por uso

---

## 🚀 Próximas Versões

- [ ] PWA (aplicativo instalável)
- [ ] Sincronização em nuvem
- [ ] Plugin para Cura/PrusaSlicer
- [ ] App mobile nativo
- [ ] Gráficos de consumo
- [ ] Integração com e-commerce

---

## 📥 Como Migrar da Versão Anterior

1. Exporte dados (v2.0)
   - ⚙️ Ferramentas → 📥 Exportar JSON

2. Abra nova versão (v3.0)
   - ⚙️ Ferramentas → 📤 Importar

3. Selecione arquivo JSON
   - Tudo migra automaticamente!

---

## 📞 Suporte

- 📖 Veja INSTALACAO.md
- 🐛 Reporte issues no GitHub
- 💬 Discussões abertas para sugestões

---

## 🙏 Agradecimentos

Desenvolvido com ❤️ para makers e profissionais 3D.

---

**Versão:** 3.0  
**Data:** 2026-01-12  
**Status:** ✅ Pronto para Produção  
**Licença:** MIT
