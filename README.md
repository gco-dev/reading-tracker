# Ex-Libris - Reading Tracker Web Application (Delivery 1)

**Disciplina:** Desenvolvimento Web / Programação Full-Stack  
**Professor:** Rodrigo Martins Pagliares  
**Instituição:** UNIFAL-MG  
**Prazo da Entrega 1:** 20 de novembro de 2026, 23:59 (Horário de Brasília)  
**Tag do Git:** `delivery-1`

---

## 👥 Equipe

* **Gabriel Cardoso de Oliveira** - Matrícula: 2026.2.08.003

## 📖 Visão Geral do Projeto

O **Ex-Libris Reading Tracker** é uma aplicação web desenvolvida para substituir um diário de leitura pessoal mantido em Word por uma estrutura de dados organizada, automatizada e padronizada.

A aplicação gerencia a separação conceitual entre **Livros** (obras literárias) e **Leituras** (experiências e histórico de leitura), permitindo o registro de releituras e a unificação da lista de desejos (*Wishlist*) e do histórico de leituras no mesmo sistema. Toda a interface e valores controlados utilizam o padrão **US English**.

---

## 🛠️ Tecnologias Utilizadas (Delivery 1)

Em conformidade estrita com as restrições da Entrega 1:

* **HTML5 Semântico:** Estruturação semântica utilizando modais nativos `<dialog>`, formulário expansível via `<details>/<summary>` e zero atributos inline (`onclick` ou `style`).
* **CSS3 Moderno (Glassmorphism):** Design responsivo baseado em Flexbox e CSS Grid, com suporte nativo a temas Claro (*Light Mode*) e Escuro (*AMOLED Dark Mode*), variáveis CSS (`:root`) e efeitos de refração de vidro (`backdrop-filter`).
* **Vanilla JavaScript (ES Modules):** Modularização limpa em código assíncrono (`async/await`), sem a utilização de frameworks, bundlers (npm, Vite) ou bibliotecas de UI proibidas.
* **Persistência no Cliente:** Armazenamento dos dados no `localStorage` do navegador com carga inicial via `fetch` a partir do arquivo `seed.json`.

---

## 🚀 Como Executar o Projeto Localmente

Devido ao uso da API `fetch` para leitura do arquivo `seed.json`, a aplicação deve ser servida por um servidor estático local (como a extensão **Live Server** do VS Code).

### Passo a Passo:

1. Clone o repositório do GitHub:
   ```bash
   git clone https://github.com/gco-dev/reading-tracker
   cd reading-tracker
   ```
2. Abra a pasta do projeto no **Visual Studio Code**.
3. Inicie um servidor HTTP local (por exemplo, clicando em **Go Live** na extensão **Live Server** do VS Code, ou executando `python -m http.server 5500` no terminal).
4. Acesse o endereço exibido pelo servidor (ex.: `http://127.0.0.1:5500`) no seu navegador.

---

## 📋 Checklist dos Requisitos Funcionais (FR-01 a FR-07)

| Requisito | Descrição | Status |
| :--- | :--- | :---: |
| **FR-01** | **Manage authors:** Criar, visualizar, editar e excluir autores. Trava de segurança impedindo exclusão de autores vinculados a livros com mensagem informativa dos títulos associados. | **[x] Implemented** |
| **FR-02** | **Manage books:** Criar, visualizar, editar e excluir livros. Vinculação de autores e criação/seleção dinâmica de temas (*themes*). | **[x] Implemented** |
| **FR-03** | **Manage readings:** Adicionar, editar e excluir leituras/releituras por livro (`1 Book : N Readings`). Cadastro de livro + leitura inicial em passo único. Exclusão em cascata de livros com confirmação de contagem de leituras. | **[x] Implemented** |
| **FR-04** | **Status workflow:** Transição entre status (*Want to read, Reading, Paused, Read, Abandoned*). Confirmação do usuário ao migrar para status que limpam ano e nota. | **[x] Implemented** |
| **FR-05** | **Reading log:** Tabela dedicada de histórico de leituras ordenável por colunas, com exibição de `-` para valores ausentes e ordenação padrão por ano de leitura (mais recente primeiro). | **[x] Implemented** |
| **FR-06** | **Validation:** Validação estrita de todas as regras do modelo de domínio com mensagens de erro exibidas dinamicamente ao lado dos campos correspondentes. | **[x] Implemented** |
| **FR-07** | **Seed data & Reset data:** Carga inicial automática do `seed.json` para o `localStorage` no primeiro uso, persistência de alterações e ação *Reset data* funcional. | **[x] Implemented** |

---

## 🤖 Declaração de Uso de Inteligência Artificial (AI Usage Statement)

Em atendimento à Seção 10 das especificações do projeto, declaramos o uso transparente de assistentes de Inteligência Artificial durante o desenvolvimento do Delivery 1:

| Ferramenta | Finalidade de Uso | Partes e Arquivos Afetados |
| :--- | :--- | :--- |
| **Gemini (Google)** | Auxílio na estruturação da arquitetura assíncrona JS, depuração de manipulação da DOM sem eventos inline, validações de domínio e refinamento do layout responsivo em Glassmorphism. | `js/store.js`, `js/app.js`, `js/validation.js`, `js/theme.js`, `css/style.css`, `index.html` |