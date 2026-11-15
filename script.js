/**
 * EX-LIBRIS | ACERVO PESSOAL
 * Script principal da aplicação
 */

const CHAVE_STORAGE = "meusDados";
let ordenacaoAtual = 'recente'; // Padrão: mais recentes primeiro

// =========================================================
// 1. GERENCIAMENTO DE DADOS (BANCO DE DADOS LOCAL)
// =========================================================

function lerDados() {
    const dadosTexto = localStorage.getItem(CHAVE_STORAGE);
    return dadosTexto ? JSON.parse(dadosTexto) : null;
}

function salvarDados(dados) {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados));
}

// =========================================================
// 2. INICIALIZAÇÃO DA APLICAÇÃO
// =========================================================

async function carregarDados() {
    // Se não houver dados salvos, busca do arquivo original (seed)
    if (!lerDados()) {
        try {
            const resposta = await fetch("./seed.json");
            if (!resposta.ok) throw new Error("Arquivo seed.json não encontrado.");

            const dados = await resposta.json();
            salvarDados(dados);
        } catch (erro) {
            console.error("Erro ao carregar dados iniciais:", erro);
            return;
        }
    }
    atualizarInterface();
}

function atualizarInterface() {
    preencherDropdownAutores();
    mostrarLivrosNaTela();
}

// =========================================================
// 3. RENDERIZAÇÃO DA INTERFACE (TELA)
// =========================================================

function preencherDropdownAutores() {
    const dados = lerDados();
    const dropdown = document.getElementById("novo-autor");
    if (!dados) return;

    // Ordena os autores em ordem alfabética para facilitar a busca
    const autoresOrdenados = [...dados.authors].sort((a, b) => 
        a.name.localeCompare(b.name)
    );

    const opcoesAutores = autoresOrdenados
        .map(autor => `<option value="${autor.id}">${autor.name}</option>`)
        .join("");

    dropdown.innerHTML = `<option value="">Selecione o Autor...</option>${opcoesAutores}`;
}

function mostrarLivrosNaTela() {
    const dados = lerDados();
    const caixaDeLivros = document.getElementById("lista-livros");
    if (!dados) return;

    // Mensagem de acervo vazio
    if (dados.books.length === 0) {
        caixaDeLivros.innerHTML = '<p class="mensagem-vazia">Nenhum livro cadastrado no acervo ainda.</p>';
        return;
    }

    // Aplica a regra de ordenação selecionada
    let livrosParaMostrar = [...dados.books];
    // Atualiza o contador na tela
    document.getElementById("contador-livros").innerText = `(${livrosParaMostrar.length} livros)`;
    if (ordenacaoAtual === 'titulo') {
        livrosParaMostrar.sort((a, b) => a.title.localeCompare(b.title));
    } else if (ordenacaoAtual === 'recente') {
        livrosParaMostrar.sort((a, b) => b.id - a.id);
    }

    // Constrói os cartões dos livros em HTML
    caixaDeLivros.innerHTML = livrosParaMostrar.map(livro => {
        // Busca o nome do autor
        let nomeDoAutor = "Autor Desconhecido";
        if (livro.authorIds?.length > 0) {
            const autorEncontrado = dados.authors.find(a => a.id === livro.authorIds[0]);
            if (autorEncontrado) nomeDoAutor = autorEncontrado.name;
        }

        // Formata o ano de publicação (trata anos a.C.)
        let anoExibicao = livro.publicationYear 
            ? (livro.publicationYear < 0 ? `${Math.abs(livro.publicationYear)} a.C.` : livro.publicationYear)
            : "Não informado";

        // Configuração da Etiqueta de Status Interativa
        const statusLivro = livro.status || "Desconhecido";
        const classeStatus = statusLivro.toLowerCase().replace(" ", "-");
        const opcoesStatus = ["Desconhecido", "Quero ler", "Lendo", "Lido", "Abandonado"];
        
        const selectStatusHTML = `
            <select class="status-badge status-${classeStatus}" onchange="alterarStatus(${livro.id}, this.value)">
                ${opcoesStatus.map(s => `<option value="${s}" ${s === statusLivro ? "selected" : ""}>${s}</option>`).join("")}
            </select>
        `;

        // Retorna a estrutura do cartão
        return `
            <div class="cartao-livro">
                ${selectStatusHTML}
                <h3>${livro.title}</h3>
                <p><strong>Autor:</strong> ${nomeDoAutor}</p>
                <p><strong>Ano:</strong> ${anoExibicao}</p>
                <p><strong>Formato:</strong> ${livro.form || "Não informado"}</p>
                <button class="btn-remover" onclick="removerLivro(${livro.id})">Remover</button>
            </div>
        `;
    }).join("");
}

// =========================================================
// 4. AÇÕES DO USUÁRIO (INTERATIVIDADE)
// =========================================================

// --- 4.1. Cadastro de Novo Livro ---
const formulario = document.getElementById("form-novo-livro");
formulario.addEventListener("submit", function(evento) {
    evento.preventDefault();

    // Captura e limpa os espaços dos valores digitados
    const titulo = document.getElementById("novo-titulo").value.trim();
    const ano = document.getElementById("novo-ano").value.trim();
    const autorId = document.getElementById("novo-autor").value;
    const autorDigitado = document.getElementById("autor-digitado").value.trim();
    const formato = document.getElementById("novo-formato").value;
    const status = document.getElementById("novo-status").value;

    // Validações Básicas
    if (!titulo) return alert("Por favor, digite o título do livro.");
    if (!autorId && !autorDigitado) return alert("Por favor, selecione um autor da lista ou digite um novo.");

    if (ano !== "") {
        const anoNumero = Number(ano);
        const anoAtual = new Date().getFullYear();
        if (isNaN(anoNumero) || anoNumero < -4000 || anoNumero === 0 || anoNumero > anoAtual + 1) {
            return alert(`Por favor, digite um ano válido (use números negativos para a.C., como -500, até ${anoAtual + 1}).`);
        }
    }

    // Salva o livro se passar nas validações
    salvarNovoLivro(titulo, ano, autorId, autorDigitado, formato, status);
    formulario.reset();
});

function salvarNovoLivro(titulo, ano, autorId, autorNome, formato, status) {
    const dados = lerDados();
    if (!dados) return;

    let listaDeAutores = [];

    // Trata se o usuário digitou um autor novo ou usou um da lista
    if (autorNome) {
        const autorExistente = dados.authors.find(a => a.name.trim().toLowerCase() === autorNome.toLowerCase());
        if (autorExistente) {
            listaDeAutores = [autorExistente.id];
        } else {
            const novoIdAutor = Date.now() + 1; // Cria ID único para o autor
            dados.authors.push({ id: novoIdAutor, name: autorNome });
            listaDeAutores = [novoIdAutor];
        }
    } else {
        listaDeAutores = [parseInt(autorId, 10)];
    }

    // Registra o livro no acervo
    dados.books.push({
        id: Date.now(), // ID único baseado no tempo
        title: titulo,
        publicationYear: ano ? parseInt(ano, 10) : null,
        authorIds: listaDeAutores,
        form: formato || "Não informado",
        status: status || "Lido" 
    });

    salvarDados(dados);
    atualizarInterface();
}

// --- 4.2. Excluir Livro ---
function removerLivro(idDoLivro) {
    const dados = lerDados();
    if (!dados) return;

    // Filtra a lista, mantendo apenas os livros que têm ID diferente do excluído
    dados.books = dados.books.filter(livro => livro.id !== idDoLivro);
    salvarDados(dados);
    mostrarLivrosNaTela();
}

// --- 4.3. Alterar Status de Leitura ---
function alterarStatus(idDoLivro, novoStatus) {
    const dados = lerDados();
    if (!dados) return;

    const livro = dados.books.find(l => l.id === idDoLivro);
    if (livro) {
        livro.status = novoStatus;
        salvarDados(dados);
        mostrarLivrosNaTela();
    }
}

// --- 4.4. Alternar Método de Ordenação ---
function alternarOrdenacao() {
    const botao = document.getElementById("btn-ordenacao");

    if (ordenacaoAtual === 'recente') {
        ordenacaoAtual = 'titulo';
        botao.innerText = "Ordenação: A-Z";
    } else {
        ordenacaoAtual = 'recente';
        botao.innerText = "Ordenação: Mais Recentes";
    }
    
    mostrarLivrosNaTela();
}

// =========================================================
// 5. DAR A PARTIDA NO APLICATIVO
// =========================================================
// Esta é a linha que havia sido apagada acidentalmente!
carregarDados();