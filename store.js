/**
 * EX-LIBRIS | ACERVO PESSOAL
 * Store (Gerenciador de Estado e Banco de Dados Local)
 */

// Chave única usada para guardar os dados no 'localStorage' do navegador
const STORAGE_KEY = 'app_leituras_dados';

// =========================================================
// FUNÇÕES AUXILIARES DE BANCO DE DADOS (USO INTERNO)
// =========================================================

// Busca os dados no navegador. Se não existir nada, retorna uma estrutura limpa (vazia).
function obterDados() {
    const dados = localStorage.getItem(STORAGE_KEY);
    return dados ? JSON.parse(dados) : { livros: [], leituras: [], autores: [] };
}

// Converte os dados do JavaScript em texto (String) e salva no navegador
function salvarDados(dados) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

// =========================================================
// FUNÇÕES EXPORTADAS (A API QUE O SCRIPT.JS VAI USAR)
// =========================================================

// Função principal de inicialização e adaptação (Adapter) dos dados
export async function inicializarDados() {
    const dados = obterDados();
    
    // Verifica se o banco local está completamente vazio
    if (dados.livros.length === 0 && dados.autores.length === 0) {
        try {
            // Faz a requisição para ler o arquivo de dados inicial (seed.json)
            const resposta = await fetch("./seed.json");
            
            if (resposta.ok) {
                const seed = await resposta.json();
                
                // PASSO 1: O Adapter (Tradutor) - Criando o mapa de leituras
                // Como o status de leitura está separado dos livros no seed.json, 
                // criamos um "dicionário" onde a chave é o ID do livro.
                const mapaLeituras = {};
                if (seed.readings) {
                    seed.readings.forEach(leitura => {
                        mapaLeituras[leitura.bookId] = leitura;
                    });
                }

                // PASSO 2: Transferir autores diretamente
                dados.autores = seed.authors || [];
                
                // PASSO 3: Mapear e traduzir os livros do inglês para o português
                dados.livros = (seed.books || []).map(b => {
                    // Busca se existe um status de leitura para este livro específico no mapa
                    const leitura = mapaLeituras[b.id] || {}; 
                    
                    return {
                        id: b.id,                             // Mantém o ID original
                        titulo: b.title,                      // Traduz 'title' para 'titulo'
                        ano: b.publicationYear,               // Traduz 'publicationYear' para 'ano'
                        autorIds: b.authorIds,                // Mantém a ligação com o autor
                        formato: b.form || "Não informado",   // Traduz 'form' para 'formato'
                        
                        // Puxa o status do mapaLeituras. Se não tiver, define como 'Não lido'
                        status: leitura.status || "Não lido",
                        
                        // Puxa a nota (caso queira usar no futuro)
                        nota: leitura.rating || null
                    };
                });
                
                // PASSO 4: Salva os dados limpos e traduzidos no localStorage
                salvarDados(dados);
            }
        } catch (erro) {
            console.error("Erro ao carregar o arquivo seed.json:", erro);
        }
    }
}

// Retorna apenas a lista de livros do banco de dados local
export async function listarLivros() {
    return obterDados().livros;
}

// Retorna apenas a lista de autores do banco de dados local
export async function listarAutores() {
    return obterDados().autores;
}

// Recebe um objeto de livro novo, gera um ID único e o insere na lista
export async function adicionarLivro(livro) {
    const dados = obterDados();
    livro.id = Date.now(); // Usa os milissegundos atuais como um ID falso único
    dados.livros.push(livro);
    salvarDados(dados);
}

// Recebe o nome de um autor novo, gera um ID para ele e o salva
export async function adicionarAutor(nomeAutor) {
    const dados = obterDados();
    const novoAutor = { id: Date.now() + 1, name: nomeAutor };
    dados.autores.push(novoAutor);
    salvarDados(dados);
    return novoAutor.id; // Retorna o ID gerado para ser vinculado ao livro
}

// Varre a lista de livros e remove aquele que tiver o ID correspondente
export async function excluirLivro(id) {
    const dados = obterDados();
    // Filtra mantendo apenas os livros cujo ID seja diferente do ID que queremos excluir
    dados.livros = dados.livros.filter(l => l.id !== id);
    salvarDados(dados);
}

// Encontra um livro pelo ID e atualiza apenas a propriedade de status dele
export async function atualizarStatusLivro(id, novoStatus) {
    const dados = obterDados();
    const livro = dados.livros.find(l => l.id === id);
    
    if (livro) {
        livro.status = novoStatus;
        salvarDados(dados);
    }
}