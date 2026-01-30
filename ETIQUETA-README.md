# Impressão de etiqueta de filamento

## O que foi feito

1. **Página `etiqueta.html`**  
   Abre com os dados do filamento na URL e oferece:
   - Visualização do **QR Code** e dos dados (nome, cor, material, peso)
   - **Imprimir** – abre o diálogo de impressão do navegador
   - **Salvar PDF** – gera e baixa um PDF da etiqueta
   - **Salvar PNG** – gera e baixa uma imagem PNG da etiqueta

2. **Função global no `index.html`**  
   `window.openEtiquetaFilamento(filament)` abre a etiqueta em nova aba.  
   Parâmetros da URL usados por `etiqueta.html`:
   - `qr` ou `qrCode` – obrigatório (valor do QR Code)
   - `name` / `nome` – nome do filamento
   - `color` / `cor` – cor
   - `material` – material
   - `weightRemaining` / `peso` – peso restante (g)
   - `weightTotal` – peso total (g)

3. **Interceptação de clique**  
   Se no menu de três pontinhos existir um item com o texto exato **"Imprimir etiqueta"**, o clique é interceptado e a página de etiqueta é aberta usando os dados da linha da tabela (quando possível).

## Como usar

- **Direto:** abra `etiqueta.html?qr=CODIGO&name=Nome&color=Cor` (substitua pelos valores desejados).
- **Pelo app:** no código-fonte da página de Filamentos, no menu de ações do filamento (três pontinhos), use um item "Imprimir etiqueta" com:

```tsx
<DropdownMenuItem onClick={() => window.openEtiquetaFilamento?.(filament)}>
  Imprimir etiqueta
</DropdownMenuItem>
```

Assim, ao clicar em "Imprimir etiqueta", a etiqueta abre com QR Code e opções de PDF, PNG e impressão.
