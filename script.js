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

            // Adicionado o botão de Remover dentro do cartão HTML
            const cartaoHTML = `
                <div class="cartao-livro">
                    <h3>${livro.title}</h3>
                    <p><strong>Autor:</strong> ${nomeDoAutor}</p>
                    <p><strong>Ano:</strong> ${livro.publicationYear || 'Não informado'}</p>
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

    const tituloDigitado = document.getElementById("novo-titulo").value;
    const anoDigitado = document.getElementById("novo-ano").value;
    const autorEscolhido = document.getElementById("novo-autor").value;
    const formatoEscolhido = document.getElementById("novo-formato").value; 
    
    const listaDeAutores = autorEscolhido ? [parseInt(autorEscolhido)] : [];

    const dadosEmTexto = localStorage.getItem("meusDados");
    if (dadosEmTexto) {
        const dados = JSON.parse(dadosEmTexto);

        const novoLivro = {
            id: Date.now(), 
            title: tituloDigitado,
            publicationYear: anoDigitado ? parseInt(anoDigitado) : null,
            authorIds: listaDeAutores, 
            form: formatoEscolhido || "Não informado" 
        };

        dados.books.push(novoLivro);
        localStorage.setItem("meusDados", JSON.stringify(dados));
        mostrarLivrosNaTela();
        formulario.reset();
    }
});

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