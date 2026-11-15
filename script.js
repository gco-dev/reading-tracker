const CHAVE_STORAGE = "meusDados";

// UTILITÁRIOS DE ARMAZENAMENTO
function lerDados() {
    const dadosTexto = localStorage.getItem(CHAVE_STORAGE);
    return dadosTexto ? JSON.parse(dadosTexto) : null;
}

function salvarDados(dados) {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados));
}

// 1. CARREGAR DADOS INICIAIS
async function carregarDados() {
    if (!lerDados()) {
        try {
            const resposta = await fetch("./seed.json");
            if (!resposta.ok) throw new Error("Arquivo seed.json não encontrado.");

            const dados = await resposta.json();
            salvarDados(dados);
        } catch (erro) {
            console.error("Erro ao carregar dados:", erro);
            return;
        }
    }
    atualizarInterface();
}

function atualizarInterface() {
    mostrarLivrosNaTela();
    preencherDropdownAutores();
}

// 2. RENDERIZAR CARTÕES DOS LIVROS
function mostrarLivrosNaTela() {
    const dados = lerDados();
    const caixaDeLivros = document.getElementById("lista-livros");
    if (!dados) return;

    if (dados.books.length === 0) {
        caixaDeLivros.innerHTML = '<p class="mensagem-vazia">Nenhum livro cadastrado no acervo ainda.</p>';
        return;
    }

    caixaDeLivros.innerHTML = dados.books.map(livro => {
        const autor = livro.authorIds?.length
            ? dados.authors.find(a => a.id === livro.authorIds[0])
            : null;
        const nomeDoAutor = autor ? autor.name : "Autor não informado";

        let anoExibicao = "Não informado";
        if (livro.publicationYear) {
            anoExibicao = livro.publicationYear < 0
                ? `${Math.abs(livro.publicationYear)} a.C.`
                : livro.publicationYear;
        }

        return `
            <div class="cartao-livro">
                <h3>${livro.title}</h3>
                <p><strong>Autor:</strong> ${nomeDoAutor}</p>
                <p><strong>Ano:</strong> ${anoExibicao}</p>
                <p><strong>Formato:</strong> ${livro.form || "Não informado"}</p>
                <button class="btn-remover" onclick="removerLivro(${livro.id})">Remover</button>
            </div>
        `;
    }).join("");
}

// 3. PREENCHER SELECT DE AUTORES
function preencherDropdownAutores() {
    const dados = lerDados();
    const dropdown = document.getElementById("novo-autor");
    if (!dados) return;

    const opcoesAutores = dados.authors
        .map(autor => `<option value="${autor.id}">${autor.name}</option>`)
        .join("");

    dropdown.innerHTML = `<option value="">Selecione o Autor...</option>${opcoesAutores}`;
}

// 4. FORMULÁRIO E CADASTRO DE NOVO LIVRO
const formulario = document.getElementById("form-novo-livro");

formulario.addEventListener("submit", function(evento) {
    evento.preventDefault();

    const tituloDigitado = document.getElementById("novo-titulo").value.trim();
    const anoDigitado = document.getElementById("novo-ano").value.trim();
    const autorEscolhido = document.getElementById("novo-autor").value;
    const formatoEscolhido = document.getElementById("novo-formato").value;
    const autorDigitado = document.getElementById("autor-digitado").value.trim();

    if (!tituloDigitado) {
        alert("Por favor, digite o título do livro.");
        return;
    }

    if (!autorEscolhido && !autorDigitado) {
        alert("Por favor, selecione um autor da lista ou digite um novo.");
        return;
    }

    if (anoDigitado !== "") {
        const anoNumero = Number(anoDigitado);
        const anoAtual = new Date().getFullYear();

        if (isNaN(anoNumero) || anoNumero < -4000 || anoNumero === 0 || anoNumero > anoAtual + 1) {
            alert(`Por favor, digite um ano válido (use números negativos para a.C., como -500, até ${anoAtual + 1}).`);
            return;
        }
    }

    salvarNovoLivro(tituloDigitado, anoDigitado, autorEscolhido, autorDigitado, formatoEscolhido);
    formulario.reset();
});

function salvarNovoLivro(titulo, ano, autorId, autorNome, formato) {
    const dados = lerDados();
    if (!dados) return;

    let listaDeAutores = [];

    if (autorNome) {
        const autorExistente = dados.authors.find(
            autor => autor.name.trim().toLowerCase() === autorNome.toLowerCase()
        );

        if (autorExistente) {
            listaDeAutores = [autorExistente.id];
        } else {
            const novoIdAutor = Date.now() + 1;
            dados.authors.push({ id: novoIdAutor, name: autorNome });
            listaDeAutores = [novoIdAutor];
        }
    } else {
        listaDeAutores = [parseInt(autorId, 10)];
    }

    dados.books.push({
        id: Date.now(),
        title: titulo,
        publicationYear: ano ? parseInt(ano, 10) : null,
        authorIds: listaDeAutores,
        form: formato || "Não informado"
    });

    salvarDados(dados);
    atualizarInterface();
}

// 5. REMOVER LIVRO
function removerLivro(idDoLivro) {
    const dados = lerDados();
    if (!dados) return;

    dados.books = dados.books.filter(livro => livro.id !== idDoLivro);
    salvarDados(dados);
    mostrarLivrosNaTela();
}

// INICIALIZAÇÃO
carregarDados();