const CHAVE_STORAGE = "meusDados";

let ordenacaoAtual = 'recente'; // Padrão: mais recentes primeiro

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

    // NOVA LÓGICA DE ORDENAÇÃO
    let livrosParaMostrar = [...dados.books];

    if (ordenacaoAtual === 'titulo') {
        livrosParaMostrar.sort((a, b) => a.title.localeCompare(b.title));
    } else if (ordenacaoAtual === 'recente') {
        // Assume que IDs maiores são mais recentes (Date.now())
        livrosParaMostrar.sort((a, b) => b.id - a.id);
    }

    caixaDeLivros.innerHTML = livrosParaMostrar.map(livro => {
        // ... (resto do código continua igual a partir daqui: const autor = ...)
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

        // Define o status (padrão agora é "Desconhecido")
        const statusLivro = livro.status || "Desconhecido";
        const classeStatus = statusLivro.toLowerCase().replace(" ", "-");

        // Gera as opções do dropdown interativo no cartão
        const opcoesStatus = ["Desconhecido", "Quero ler", "Lendo", "Lido", "Abandonado"];
        const selectStatusHTML = `
            <select class="status-badge status-${classeStatus}" onchange="alterarStatus(${livro.id}, this.value)">
                ${opcoesStatus.map(s => `<option value="${s}" ${s === statusLivro ? "selected" : ""}>${s}</option>`).join("")}
            </select>
        `;

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

// 3. PREENCHER SELECT DE AUTORES
function preencherDropdownAutores() {
    const dados = lerDados();
    const dropdown = document.getElementById("novo-autor");
    if (!dados) return;

    // Cria uma cópia da lista de autores e ordena por nome
    const autoresOrdenados = [...dados.authors].sort((a, b) => 
        a.name.localeCompare(b.name)
    );

    const opcoesAutores = autoresOrdenados
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
    const statusEscolhido = document.getElementById("novo-status").value; // NOVO CAMPO
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

    salvarNovoLivro(tituloDigitado, anoDigitado, autorEscolhido, autorDigitado, formatoEscolhido, statusEscolhido);
    formulario.reset();
});

function salvarNovoLivro(titulo, ano, autorId, autorNome, formato, status) {
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
        form: formato || "Não informado",
        status: status || "Lido" // Salva o status
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

// 6. ALTERAR STATUS DIRETAMENTE NO CARTÃO
function alterarStatus(idDoLivro, novoStatus) {
    const dados = lerDados();
    if (!dados) return;

    const livro = dados.books.find(l => l.id === idDoLivro);
    if (livro) {
        livro.status = novoStatus;
        salvarDados(dados);
        mostrarLivrosNaTela(); // Atualiza a tela para mudar a cor da etiqueta
    }
}

// 7. ORDENAÇÃO
function ordenarLivros(criterio) {
    ordenacaoAtual = criterio;
    mostrarLivrosNaTela();
}

// INICIALIZAÇÃO
carregarDados();