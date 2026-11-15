/**
 * EX-LIBRIS | ACERVO PESSOAL
 * Script principal da aplicação (Controlador de Interface)
 */

// Importa as funções do nosso "banco de dados" (store.js)
import { 
    inicializarDados, listarLivros, listarAutores, 
    adicionarLivro, adicionarAutor, excluirLivro, atualizarStatusLivro 
} from './store.js';

// Variável global que controla como a lista está ordenada no momento
let ordenacaoAtual = 'recente'; 

// =========================================================
// 1. INICIALIZAÇÃO DA APLICAÇÃO
// =========================================================

// Função principal que dá o pontapé inicial quando a página carrega
async function carregarTela() {
    // Chama o store para carregar os dados (do localStorage ou lendo o seed.json)
    await inicializarDados(); 
    // Atualiza a tela com os dados carregados
    await atualizarInterface();
}

// Função auxiliar que centraliza a renderização de todas as partes da tela
async function atualizarInterface() {
    await preencherDropdownAutores();
    await mostrarLivrosNaTela();
}

// =========================================================
// 2. RENDERIZAÇÃO DA INTERFACE (TELA)
// =========================================================

// Busca os autores no banco e preenche a caixinha de seleção no formulário
async function preencherDropdownAutores() {
    const autores = await listarAutores();
    const dropdown = document.getElementById("novo-autor");

    // Organiza os autores em ordem alfabética para facilitar a busca
    const autoresOrdenados = [...autores].sort((a, b) => 
        a.name.localeCompare(b.name)
    );

    // Cria o HTML das opções (<option>) baseadas na lista de autores
    const opcoesAutores = autoresOrdenados
        .map(autor => `<option value="${autor.id}">${autor.name}</option>`)
        .join("");

    // Injeta as opções geradas de volta na caixa de seleção no HTML
    dropdown.innerHTML = `<option value="">Selecione o Autor...</option>${opcoesAutores}`;
}

// Busca os livros no banco e desenha os cartões na tela
async function mostrarLivrosNaTela() {
    const livros = await listarLivros();
    const autores = await listarAutores();
    const caixaDeLivros = document.getElementById("lista-livros");

    // Se não houver livros, mostra uma mensagem amigável e zera o contador no título
    if (livros.length === 0) {
        caixaDeLivros.innerHTML = '<p class="mensagem-vazia">Nenhum livro cadastrado no acervo ainda.</p>';
        document.getElementById("contador-livros").innerText = `(0 livros)`;
        return;
    }

    // Faz uma cópia da lista original para não alterar o banco ao aplicar ordenações
    let livrosParaMostrar = [...livros];
    
    // Atualiza o contador de livros no subtítulo
    document.getElementById("contador-livros").innerText = `(${livrosParaMostrar.length} livros)`;
    
    // Aplica a ordenação escolhida pelo usuário
    if (ordenacaoAtual === 'titulo') {
        // Ordem Alfabética (A-Z) usando localeCompare para respeitar acentuação
        livrosParaMostrar.sort((a, b) => a.titulo.localeCompare(b.titulo));
    } else if (ordenacaoAtual === 'recente') {
        // Do mais novo para o mais antigo (baseado no ID gerado por Date.now)
        livrosParaMostrar.sort((a, b) => b.id - a.id);
    }

    // Transforma a matriz de objetos de livros em uma grande string de blocos HTML (os cartões)
    caixaDeLivros.innerHTML = livrosParaMostrar.map(livro => {
        // Tenta encontrar o nome do autor cruzando o 'autorId' do livro com a lista mestre de autores
        let nomeDoAutor = "Autor Desconhecido";
        if (livro.autorIds?.length > 0) {
            const autorEncontrado = autores.find(a => a.id === livro.autorIds[0]);
            if (autorEncontrado) nomeDoAutor = autorEncontrado.name;
        }

        // Formata o ano de exibição (se for negativo, remove o sinal e adiciona "a.C.")
        let anoExibicao = livro.ano 
            ? (livro.ano < 0 ? `${Math.abs(livro.ano)} a.C.` : livro.ano)
            : "Não informado";

        // Prepara a classe CSS dinâmica para definir a cor da etiqueta de status
        const statusLivro = livro.status || "Desconhecido";
        const classeStatus = statusLivro.toLowerCase().replace(" ", "-"); // Ex: "Quero ler" vira "quero-ler"
        const opcoesStatus = ["Desconhecido", "Quero ler", "Lendo", "Lido", "Abandonado"];
        
        // Constrói o HTML do <select> de status interativo injetado no topo do cartão
        const selectStatusHTML = `
            <select class="status-badge status-${classeStatus}" onchange="window.alterarStatus(${livro.id}, this.value)">
                ${opcoesStatus.map(s => `<option value="${s}" ${s === statusLivro ? "selected" : ""}>${s}</option>`).join("")}
            </select>
        `;

        // Retorna o HTML estrutural completo do cartão do livro
        return `
            <div class="cartao-livro">
                ${selectStatusHTML}
                <h3>${livro.titulo}</h3>
                <p><strong>Autor:</strong> ${nomeDoAutor}</p>
                <p><strong>Ano:</strong> ${anoExibicao}</p>
                <p><strong>Formato:</strong> ${livro.formato || "Não informado"}</p>
                <button class="btn-remover" onclick="window.removerLivro(${livro.id})">Remover</button>
            </div>
        `;
    }).join(""); // Transforma o Array gerado pelo .map em um único texto HTML
}

// =========================================================
// 3. AÇÕES DO USUÁRIO (INTERATIVIDADE DOS ELEMENTOS)
// =========================================================

// Captura o evento de 'submit' (envio) do formulário de novo livro
const formulario = document.getElementById("form-novo-livro");
formulario.addEventListener("submit", async function(evento) {
    evento.preventDefault(); // Impede o comportamento padrão de recarregar a página

    // Coleta os valores exatos digitados ou selecionados pelo usuário, removendo espaços extras (trim)
    const titulo = document.getElementById("novo-titulo").value.trim();
    const ano = document.getElementById("novo-ano").value.trim();
    const autorId = document.getElementById("novo-autor").value;
    const autorDigitado = document.getElementById("autor-digitado").value.trim();
    const formato = document.getElementById("novo-formato").value;
    const status = document.getElementById("novo-status").value;

    // Validações básicas de preenchimento de campos essenciais
    if (!titulo) return alert("Por favor, digite o título do livro.");
    if (!autorId && !autorDigitado) return alert("Por favor, selecione um autor.");

    let listaDeAutores = [];
    const autores = await listarAutores();

    // Lógica condicional para o tratamento do Autor:
    if (autorDigitado) {
        // Verifica se o usuário digitou um autor que, por acaso, já existe cadastrado no banco
        const autorExistente = autores.find(a => a.name.trim().toLowerCase() === autorDigitado.toLowerCase());
        
        if (autorExistente) {
            listaDeAutores = [autorExistente.id];
        } else {
            // Se for realmente um autor novo inédito, salva ele no banco primeiro
            const novoId = await adicionarAutor(autorDigitado);
            listaDeAutores = [novoId];
        }
    } else {
        // Se ele apenas selecionou no menu suspenso, converte o texto do ID em número inteiro
        listaDeAutores = [parseInt(autorId, 10)];
    }

    // Monta o objeto formatado que será enviado ao banco de dados local
    const novoLivro = {
        titulo: titulo,
        ano: ano ? parseInt(ano, 10) : null,
        autorIds: listaDeAutores,
        formato: formato || "Não informado",
        status: status || "Lido" 
    };

    // Dispara a função do store.js que insere o novo livro
    await adicionarLivro(novoLivro);
    
    // Limpa os inputs do formulário visualmente
    formulario.reset();
    
    // Atualiza a tela (listagem de livros e o dropdown de autores, caso um novo tenha sido adicionado)
    await atualizarInterface();
});

// IMPORTANTE: Funções chamadas por 'onclick' e 'onchange' no HTML precisam estar no escopo
// global 'window' porque este arquivo foi definido como um 'module' do ES6 no HTML.

// Função que aciona a remoção do livro, passando o ID adiante
window.removerLivro = async function(idDoLivro) {
    await excluirLivro(idDoLivro);
    await mostrarLivrosNaTela(); // Atualiza a tela para sumir com o cartão excluído
};

// Função que atualiza o status de leitura ao alterar o menu suspenso (dropdown) dentro de um cartão
window.alterarStatus = async function(idDoLivro, novoStatus) {
    await atualizarStatusLivro(idDoLivro, novoStatus);
    await mostrarLivrosNaTela(); // Recarrega os cartões para forçar a atualização visual da cor do status
};

// Alterna a lógica e o texto do botão superior, mudando entre ordem cronológica e alfabética
window.alternarOrdenacao = function() {
    const botao = document.getElementById("btn-ordenacao");
    if (ordenacaoAtual === 'recente') {
        ordenacaoAtual = 'titulo';
        botao.innerText = "Ordenação: A-Z";
    } else {
        ordenacaoAtual = 'recente';
        botao.innerText = "Ordenação: Mais Recentes";
    }
    mostrarLivrosNaTela(); // Recarrega a listagem visual aplicando o novo padrão de ordenação
};

// =========================================================
// 4. DAR A PARTIDA
// =========================================================
// Invoca o carregamento da tela no exato momento em que o navegador termina de ler este script
carregarTela();