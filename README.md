# Gerenciador de Estoque 3D - Modular & Supabase

Este projeto foi refatorado para ser mais organizado, seguro e acessível de qualquer lugar.

## Estrutura do Projeto

- `index.html`: Página principal (Dashboard).
- `login.html`: Tela de autenticação.
- `css/style.css`: Todos os estilos do projeto.
- `js/supabase-config.js`: Configurações de conexão com o Supabase.
- `js/app.js`: Lógica principal da aplicação.

## Como Configurar

### 1. Supabase
1. Crie um projeto no [Supabase](https://supabase.com/).
2. No Editor SQL, execute o script SQL fornecido para criar as tabelas `filaments`, `printers` e `usage_history`.
3. Vá em **Project Settings > API** e copie a `URL` e a `anon key`.
4. Cole essas informações no arquivo `js/supabase-config.js`.

### 2. Autenticação
1. No Supabase, vá em **Authentication > Users**.
2. Adicione um novo usuário (E-mail e Senha).
3. Desative a confirmação de e-mail em **Providers > Email** (opcional, para facilitar o teste inicial).

### 3. Hospedagem no GitHub Pages
1. Suba todos os arquivos para o seu repositório no GitHub.
2. Vá em **Settings > Pages**.
3. Em **Build and deployment**, selecione a branch `main` e a pasta `/ (root)`.
4. Salve e aguarde o link ser gerado.

## Sincronização
Os dados são salvos diretamente no Supabase. Qualquer alteração feita pelo celular será refletida no PC e vice-versa, pois ambos consultam a mesma base de dados na nuvem.
