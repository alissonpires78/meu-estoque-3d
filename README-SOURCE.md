# PrintManager 3D - Código-fonte

## O que foi implementado

1. **Autorização e níveis de acesso**
   - **Administrador**: aprova usuários, altera níveis, remove usuários.
   - **Usuário padrão**: pode criar/editar orçamentos, impressoras, filamentos.
   - **Somente leitura**: só visualiza.
   - Cadastro cria usuário como "pendente"; só acessa o app após aprovação.
   - **Autorizar no app**: em Usuários, o admin escolhe o nível e clica em "Autorizar no app".
   - **Link por e-mail**: "Enviar link por e-mail" copia o link; você cola no e-mail e envia. Ao abrir o link, o usuário já está autorizado e pode fazer login.

2. **Gerenciar usuários** (página Usuários, só admin)
   - Lista de usuários aguardando autorização.
   - Aprovar (escolhendo nível) ou rejeitar.
   - Lista de usuários autorizados: alterar nível (admin / usuário / somente leitura) ou excluir.

3. **PDF e impressão**
   - Utilitário em `src/utils/pdf.ts`: `exportToPdf` e `printElement`.
   - Componente `PdfPrintButtons`: botões "Salvar PDF" e "Imprimir" (usado na Calculadora).
   - Em qualquer tela que precise, use `PdfPrintButtons` passando a ref do elemento a exportar/imprimir.

4. **Calculadora / orçamento**
   - "Criar orçamento" salva na coleção Firestore **orcamentos** (campos: hours, costPerHour, materialCost, extraCost, laborTotal, total, clientName, createdAt).
   - Botões "Salvar PDF" e "Imprimir" para o resumo do orçamento.

5. **QR Code**
   - Página `/filaments/scan` usa **html5-qrcode** para abrir a câmera e escanear.
   - A câmera só funciona em **HTTPS** ou **localhost** (exigência do navegador).
   - Se o Chrome não abrir a câmera: confira se o site está em HTTPS ou localhost; em Configurações do site, verifique permissão de Câmera.
   - Após escanear, redireciona para `/filaments?qr=...` para filtrar/abrir o filamento.

## Configuração

1. **Variáveis de ambiente**  
   Copie `.env.example` para `.env` e preencha com os dados do seu projeto Firebase (Console Firebase > Configurações do projeto):

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

2. **Firestore – coleções e primeiro admin**
   - Coleções usadas: `users`, `pendingUsers`, `printers`, `filaments`, `orcamentos`.
   - Para ter o primeiro administrador: no Firebase Console, Firestore, crie (ou edite) o documento em `users/<uid_do_usuario>` com:
     - `email`, `displayName`, `role: "admin"`, `approved: true`, `createdAt`.

3. **Regras do Firestore (exemplo)**  
   Ajuste conforme sua política de segurança:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
       }
       match /pendingUsers/{userId} {
         allow read, write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
       }
       match /printers/{id} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.approved == true;
       }
       match /filaments/{id} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.approved == true;
       }
       match /orcamentos/{id} {
         allow read, write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.approved == true;
       }
     }
   }
   ```

## Desenvolvimento e build

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # gera saída em dist/
npm run preview # preview do build
```

## Câmera / QR no Chrome

- Use o app em **https://** ou em **http://localhost**.
- Na barra de endereço, clique no ícone de cadeado (ou "informações do site") e confira se a permissão de **Câmera** está permitida para este site.
