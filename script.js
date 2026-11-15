// 1. CARREGAR E SALVAR OS DADOS
async function carregarDados() {
    if (localStorage.getItem("meusDados") === null) {
        try {
            const resposta = await fetch('./seed.json');
            if (!resposta.ok) throw new Error("Arquivo seed.json não encontrado.");
            
            const dados = await resposta.json();
            localStorage.setItem("meusDados", JSON.stringify(dados));
            
            mostrarLivrosNaTela();
            preencherDropdownAutores();
        } catch (erro) {
            console.error("Erro:", erro);
        }
    } else {
        mostrarLivrosNaTela();
        preencherDropdownAutores();
    }
}

// 2. MOSTRAR OS LIVROS NA TELA
function mostrarLivrosNaTela() {
    const dadosEmTexto = localStorage.getItem("meusDados");
    
    if (dadosEmTexto) {
        const dados = JSON.parse(dadosEmTexto);
        const caixaDeLivros = document.getElementById("lista-livros");
        caixaDeLivros.innerHTML = "";
        
        dados.books.forEach(function(livro) {
            let nomeDoAutor = "Autor não informado";
            
            if (livro.authorIds && livro.authorIds.length > 0) {
                const idProcurado = livro.authorIds[0];
                const autorEncontrado = dados.authors.find(autor => autor.id === idProcurado);
                if (autorEncontrado) {
                    nomeDoAutor = autorEncontrado.name;
                }
            }

            let anoExibicao = "Não informado";
            if (livro.publicationYear) {
                anoExibicao = livro.publicationYear < 0 
                    ? `${Math.abs(livro.publicationYear)} a.C.` 
                    : livro.publicationYear;
            }

            // Adicionado o botão de Remover dentro do cartão HTML
            const cartaoHTML = `
                <div class="cartao-livro">
                    <h3>${livro.title}</h3>
                    <p><strong>Autor:</strong> ${nomeDoAutor}</p>
                    <p><strong>Ano:</strong> ${anoExibicao}</p>
                    <p><strong>Formato:</strong> ${livro.form || 'Não informado'}</p>
                    <button onclick="removerLivro(${livro.id})" style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Remover</button>
                </div>
            `;
            caixaDeLivros.innerHTML += cartaoHTML;
        });
    }
}

// 3. PREENCHER CAIXA DE AUTORES (DROPDOWN)
function preencherDropdownAutores() {
    const dadosEmTexto = localStorage.getItem("meusDados");
    if (dadosEmTexto) {
        const dados = JSON.parse(dadosEmTexto);
        const dropdown = document.getElementById("novo-autor");
        
        dropdown.innerHTML = '<option value="">Selecione o Autor...</option>';
        
        dados.authors.forEach(function(autor) {
            dropdown.innerHTML += `<option value="${autor.id}">${autor.name}</option>`;
        });
    }
}

// 4. ADICIONAR NOVO LIVRO
const formulario = document.getElementById("form-novo-livro");

formulario.addEventListener("submit", function(evento) {
    evento.preventDefault(); 

    const tituloDigitado = document.getElementById("novo-titulo").value.trim();
    const anoDigitado = document.getElementById("novo-ano").value.trim();
    const autorEscolhido = document.getElementById("novo-autor").value;
    const formatoEscolhido = document.getElementById("novo-formato").value; 
    const autorDigitado = document.getElementById("autor-digitado").value.trim();

    // Validação de título
    if (tituloDigitado === "") {
        alert("Por favor, digite o título do livro.");
        return; 
    }

    // Validação de autor
    if (autorEscolhido === "" && autorDigitado === "") {
        alert("Por favor, selecione um autor da lista ou digite um novo.");
        return;
    }

    // NOVA VALIDAÇÃO: Regras rígidas para o Ano de Publicação
    if (anoDigitado !== "") {
        const anoNumero = Number(anoDigitado);
        const anoAtual = new Date().getFullYear();

        if (isNaN(anoNumero) || anoNumero < -4000 || anoNumero === 0 || anoNumero > (anoAtual + 1)) {
            alert(`Por favor, digite um ano válido (use números negativos para a.C., como -500, até ${anoAtual + 1}).`);
            return;
        }
    }

    // Se passou pelas validações, salva o livro
    salvarNovoLivro(tituloDigitado, anoDigitado, autorEscolhido, autorDigitado, formatoEscolhido);
    
    formulario.reset();
});

// Função isolada apenas para lidar com os dados
function salvarNovoLivro(titulo, ano, autorId, autorNome, formato) {
    const dadosEmTexto = localStorage.getItem("meusDados");
    if (!dadosEmTexto) return;

    const dados = JSON.parse(dadosEmTexto);
    let listaDeAutores = [];

    // Lógica para definir quem é o autor (com trava contra duplicados)
    if (autorNome !== "") {
        // Procura se já existe um autor com o mesmo nome (ignorando maiúsculas/minúsculas)
        const autorExistente = dados.authors.find(
            autor => autor.name.trim().toLowerCase() === autorNome.toLowerCase()
        );

        if (autorExistente) {
            // Reaproveita o ID do autor que já estava cadastrado
            listaDeAutores = [autorExistente.id];
        } else {
            // Cria um novo autor apenas se ele realmente não existir
            const novoIdAutor = Date.now() + 1; 
            dados.authors.push({ id: novoIdAutor, name: autorNome });
            listaDeAutores = [novoIdAutor];
        }
    } else {
        listaDeAutores = [parseInt(autorId)];
    }

    // Monta o objeto do livro
    const novoLivro = {
        id: Date.now(), 
        title: titulo,
        publicationYear: ano ? parseInt(ano) : null,
        authorIds: listaDeAutores, 
        form: formato || "Não informado" 
    };

    // Salva no "banco de dados" e atualiza a tela
    dados.books.push(novoLivro);
    localStorage.setItem("meusDados", JSON.stringify(dados));
    
    mostrarLivrosNaTela();
    preencherDropdownAutores();
}

// 5. REMOVER LIVRO
function removerLivro(idDoLivro) {
    const dadosEmTexto = localStorage.getItem("meusDados");
    if (dadosEmTexto) {
        const dados = JSON.parse(dadosEmTexto);
        
        // Filtra mantendo apenas os livros que têm o ID diferente do clicado
        dados.books = dados.books.filter(function(livro) {
            return livro.id !== idDoLivro;
        });

        localStorage.setItem("meusDados", JSON.stringify(dados));
        mostrarLivrosNaTela();
    }
}

// 6. INICIAR O SISTEMA
carregarDados();