// js/app.js

import store from './store.js';

// =========================================================
// ESTADO LOCAL DA APLICAÇÃO
// =========================================================
const appState = {
    books: [],
    authors: [],
    readings: [],
    themes: [],
    countries: [],
    sortAscending: true,
};

// =========================================================
// REFERÊNCIAS DO DOM
// =========================================================
const dom = {
    // Tema
    btnTheme: document.getElementById('btn-theme') || document.querySelector('.btn-theme'),

    // Controles Principais
    btnManageAuthors: document.getElementById('btn-manage-authors'),
    btnViewLog: document.getElementById('btn-view-log'),
    btnSort: document.getElementById('btn-sort'),
    btnReset: document.getElementById('btn-reset'),
    searchInput: document.getElementById('search-input') || document.getElementById('filter-search'),
    filterStatus: document.getElementById('filter-status'),
    filterAuthor: document.getElementById('filter-author'),

    // Biblioteca
    bookGrid: document.getElementById('book-grid') || document.querySelector('.book-grid'),
    bookCounter: document.getElementById('book-counter') || document.querySelector('.book-counter'),

    // Formulário de Livro (#form-book)
    bookAccordion: document.querySelector('.add-book-section details'),
    formBook: document.getElementById('form-book') || document.getElementById('form-new-book'),
    bookId: document.getElementById('book-id') || document.getElementById('edit-book-id'),
    bookTitle: document.getElementById('book-title') || document.getElementById('new-title'),
    bookYear: document.getElementById('book-year') || document.getElementById('new-year'),
    bookAuthors: document.getElementById('book-authors') || document.getElementById('new-author'),
    bookThemes: document.getElementById('book-themes') || document.getElementById('new-themes'),
    bookStatus: document.getElementById('book-status') || document.getElementById('new-status'),
    bookYearRead: document.getElementById('book-year-read') || document.getElementById('new-year-read'),
    bookGrade: document.getElementById('book-grade') || document.getElementById('new-grade'),
    bookPriority: document.getElementById('book-priority') || document.getElementById('new-priority'),

    // Modal de Edição de Livro (caso separado)
    bookEditModal: document.getElementById('book-edit-modal'),

    // Formulário de Autor (#form-author)
    authorManagerModal: document.getElementById('author-manager-modal'),
    formAuthor: document.getElementById('form-author') || document.getElementById('form-manage-author'),
    authorName: document.getElementById('author-name'),
    authorCountryId: document.getElementById('author-country-id') || document.getElementById('author-country'),
    authorsTableBody: document.getElementById('authors-table-body') || document.querySelector('#author-manager-modal tbody'),

    // Formulário de Leitura (#form-reading)
    readingModal: document.getElementById('reading-modal'),
    formReading: document.getElementById('form-reading') || document.getElementById('form-modal-reading'),
    readingBookId: document.getElementById('reading-book-id') || document.getElementById('modal-book-id'),
    readingStatus: document.getElementById('reading-status') || document.getElementById('modal-status'),
    readingYear: document.getElementById('reading-year') || document.getElementById('modal-year-read'),
    readingGrade: document.getElementById('reading-grade') || document.getElementById('modal-grade'),
    readingsHistoryList: document.getElementById('readings-history-list') || document.querySelector('#reading-modal .readings-history-list'),

    // Modal de Log Geral de Leituras
    readingLogModal: document.getElementById('reading-log-modal'),
    readingLogTableBody: document.getElementById('reading-log-body') || document.querySelector('#reading-log-modal tbody'),
};

// =========================================================
// HELPERS DE MODAL E TRATAMENTO DE ERROS
// =========================================================
function openModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('active');
    if (typeof modal.showModal === 'function' && !modal.open) {
        modal.showModal();
    }
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    modal.classList.add('hidden');
    if (typeof modal.close === 'function' && modal.open) {
        modal.close();
    }
}

function clearFormSelects(form) {
    if (!form) return;
    form.querySelectorAll('select').forEach(select => {
        if (select.multiple) {
            Array.from(select.options).forEach(opt => {
                opt.selected = false;
            });
        } else {
            select.selectedIndex = 0;
        }
    });
}

function getSelectedNumericIds(selectElement) {
    if (!selectElement) return [];
    if (selectElement.multiple) {
        return Array.from(selectElement.selectedOptions)
            .map(opt => Number(opt.value))
            .filter(id => !Number.isNaN(id) && id > 0);
    }
    const val = Number(selectElement.value);
    return !Number.isNaN(val) && val > 0 ? [val] : [];
}

function handleApiError(error, fallbackMessage = 'Ocorreu um erro ao processar a requisição.') {
    console.error('[Ex-Libris Error]:', error);

    if (error?.errors && typeof error.errors === 'object') {
        const fieldMessages = Array.isArray(error.errors)
            ? error.errors.map(e => (typeof e === 'string' ? e : `${e.field ? `${e.field}: ` : ''}${e.defaultMessage || e.message}`))
            : Object.entries(error.errors).map(([field, msg]) => `${field}: ${msg}`);

        if (fieldMessages.length > 0) {
            alert(`⚠️ Corrija os campos abaixo:\n\n• ${fieldMessages.join('\n• ')}`);
            return;
        }
    }

    const message = error?.message || (typeof error === 'string' ? error : fallbackMessage);

    if (message.includes('400')) {
        alert(`⚠️ Dados inválidos. Verifique os campos obrigatórios e tente novamente.\n\nDetalhes: ${message}`);
    } else if (message.includes('500')) {
        alert(`⚠️ Erro interno no servidor. Tente novamente em instantes.\n\nDetalhes: ${message}`);
    } else {
        alert(`⚠️ ${message}`);
    }
}

// =========================================================
// CARREGAMENTO INICIAL
// =========================================================
async function init() {
    try {
        const [books, authors, readings, themes, countries] = await Promise.all([
            store.getBooks(),
            store.getAuthors(),
            store.getReadings(),
            store.getThemes(),
            store.getCountries(),
        ]);

        appState.books = Array.isArray(books) ? books : [];
        appState.authors = Array.isArray(authors) ? authors : [];
        appState.readings = Array.isArray(readings) ? readings : [];
        appState.themes = Array.isArray(themes) ? themes : [];
        appState.countries = Array.isArray(countries) ? countries : [];

        populateAuthorDropdowns();
        populateCountryDropdown();
        populateThemeDropdown();
        renderBooks();
        renderAuthorsTable();
        renderReadingLog();
    } catch (error) {
        handleApiError(error, 'Não foi possível carregar os dados iniciais da API.');
    }
}

// =========================================================
// TEMA (LIGHT / DARK)
// =========================================================
function initTheme() {
    const savedTheme = localStorage.getItem('exlibris-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    dom.btnTheme?.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('exlibris-theme', next);
        updateThemeIcon(next);
    });
}

function updateThemeIcon(theme) {
    if (!dom.btnTheme) return;
    dom.btnTheme.textContent = theme === 'dark' ? '☀️' : '🌙';
    dom.btnTheme.setAttribute('aria-label', theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro');
}

// =========================================================
// POPULAÇÃO DE DROPDOWNS
// =========================================================
function populateAuthorDropdowns() {
    const optionsHtml = appState.authors
        .map(author => `<option value="${author.id}">${author.name}</option>`)
        .join('');

    if (dom.bookAuthors) {
        const selectedValues = Array.from(dom.bookAuthors.selectedOptions).map(o => o.value);
        const placeholder = dom.bookAuthors.multiple ? '' : '<option value="">Selecione um autor...</option>';
        dom.bookAuthors.innerHTML = `${placeholder}${optionsHtml}`;
        Array.from(dom.bookAuthors.options).forEach(opt => {
            if (selectedValues.includes(opt.value)) opt.selected = true;
        });
    }

    if (dom.filterAuthor) {
        const previousVal = dom.filterAuthor.value;
        dom.filterAuthor.innerHTML = `<option value="">Todos os autores</option>${optionsHtml}`;
        if (previousVal) dom.filterAuthor.value = previousVal;
    }
}

function populateCountryDropdown() {
    if (!dom.authorCountryId) return;
    const previousVal = dom.authorCountryId.value;
    const optionsHtml = appState.countries
        .map(c => `<option value="${c.id}">${c.name}</option>`)
        .join('');
    dom.authorCountryId.innerHTML = `<option value="">Selecione um país...</option>${optionsHtml}`;
    if (previousVal) dom.authorCountryId.value = previousVal;
}

function populateThemeDropdown() {
    if (!dom.bookThemes || dom.bookThemes.tagName !== 'SELECT') return;
    const selectedValues = Array.from(dom.bookThemes.selectedOptions).map(o => o.value);
    const optionsHtml = appState.themes
        .map(t => `<option value="${t.id}">${t.name}</option>`)
        .join('');
    const placeholder = dom.bookThemes.multiple ? '' : '<option value="">Selecione um tema...</option>';
    dom.bookThemes.innerHTML = `${placeholder}${optionsHtml}`;
    Array.from(dom.bookThemes.options).forEach(opt => {
        if (selectedValues.includes(opt.value)) opt.selected = true;
    });
}

// =========================================================
// HELPERS DE EXIBIÇÃO
// =========================================================
function extractBookAuthorIds(book) {
    if (!book) return [];
    if (Array.isArray(book.authorIds) && book.authorIds.length > 0) return book.authorIds.map(Number);
    if (Array.isArray(book.authors) && book.authors.length > 0) {
        return book.authors.map(a => Number(typeof a === 'object' ? a.id : a)).filter(Boolean);
    }
    return [];
}

function extractBookThemeIds(book) {
    if (!book) return [];
    if (Array.isArray(book.themeIds) && book.themeIds.length > 0) return book.themeIds.map(Number);
    if (Array.isArray(book.themes) && book.themes.length > 0) {
        return book.themes.map(t => Number(typeof t === 'object' ? t.id : t)).filter(Boolean);
    }
    return [];
}

function getBookAuthorNames(book) {
    if (Array.isArray(book.authors) && book.authors.length > 0) {
        return book.authors.map(a => (typeof a === 'object' ? a.name : a)).filter(Boolean).join(', ');
    }
    const ids = extractBookAuthorIds(book);
    if (ids.length > 0) {
        const names = ids
            .map(id => appState.authors.find(a => Number(a.id) === id)?.name)
            .filter(Boolean);
        if (names.length > 0) return names.join(', ');
    }
    return 'Autor desconhecido';
}

function formatBookThemes(book) {
    if (!book) return '';
    if (Array.isArray(book.themes)) {
        return book.themes.map(t => (typeof t === 'object' ? t.name : t)).filter(Boolean).join(', ');
    }
    return '';
}

function getLatestReadingForBook(bookId) {
    const bookReadings = appState.readings.filter(r => {
        const rBookId = r.book?.id ?? r.bookId;
        return Number(rBookId) === Number(bookId);
    });
    return bookReadings.length > 0 ? bookReadings[bookReadings.length - 1] : null;
}

function getStatusClass(status) {
    const map = {
        READ: 'status-read',
        PAUSED: 'status-paused',
        WANT_TO_READ: 'status-want-to-read',
        READING: 'status-reading',
        ABANDONED: 'status-abandoned',
    };
    return map[status] || 'status-unknown';
}

function getStatusLabel(status) {
    const map = {
        READ: 'Lido',
        PAUSED: 'Pausado',
        WANT_TO_READ: 'Quero Ler',
        READING: 'Lendo',
        ABANDONED: 'Abandonado',
    };
    return map[status] || 'Sem Leitura';
}

// =========================================================
// RENDERIZAÇÃO DE LIVROS
// =========================================================
function getFilteredBooks() {
    let books = [...appState.books];

    const query = dom.searchInput?.value.trim().toLowerCase() || '';
    const statusFilter = dom.filterStatus?.value || '';
    const authorFilter = dom.filterAuthor?.value || '';

    if (query) {
        books = books.filter(book =>
            (book.title || '').toLowerCase().includes(query) ||
            getBookAuthorNames(book).toLowerCase().includes(query) ||
            formatBookThemes(book).toLowerCase().includes(query)
        );
    }

    if (statusFilter) {
        books = books.filter(book => {
            const latest = getLatestReadingForBook(book.id);
            const currentStatus = book.status || latest?.status || '';
            return currentStatus === statusFilter;
        });
    }

    if (authorFilter) {
        books = books.filter(book =>
            extractBookAuthorIds(book).includes(Number(authorFilter))
        );
    }

    books.sort((a, b) => {
        const titleA = (a.title || '').toLowerCase();
        const titleB = (b.title || '').toLowerCase();
        return appState.sortAscending ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
    });

    return books;
}

function renderBooks() {
    if (!dom.bookGrid) return;

    const books = getFilteredBooks();
    if (dom.bookCounter) {
        dom.bookCounter.textContent = `(${books.length})`;
    }

    if (books.length === 0) {
        dom.bookGrid.innerHTML = `<div class="empty-message">Nenhum livro encontrado.</div>`;
        return;
    }

    dom.bookGrid.innerHTML = books.map(book => {
        const latestReading = getLatestReadingForBook(book.id);
        const status = book.status || latestReading?.status || 'UNKNOWN';
        const authorNames = getBookAuthorNames(book);
        const themesText = formatBookThemes(book);

        return `
            <article class="book-card" data-id="${book.id}">
                <div>
                    <span class="status-badge ${getStatusClass(status)}">${getStatusLabel(status)}</span>
                    <h3>${book.title}</h3>
                    <p><strong>Autor:</strong> ${authorNames}</p>
                    ${book.publicationYear ? `<p><strong>Ano:</strong> ${book.publicationYear}</p>` : ''}
                    ${themesText ? `<p><strong>Temas:</strong> ${themesText}</p>` : ''}
                    ${book.priority ? `<p><strong>Prioridade:</strong> ${book.priority}</p>` : ''}
                </div>
                <div class="card-actions">
                    <button type="button" class="btn-readings" data-id="${book.id}">📖 Leituras</button>
                    <button type="button" class="btn-edit-book" data-id="${book.id}">✏️ Editar</button>
                    <button type="button" class="btn-remove" data-id="${book.id}">🗑️ Excluir</button>
                </div>
            </article>
        `;
    }).join('');
}

// =========================================================
// 1. FORMULÁRIO DE LIVRO (#form-book)
// =========================================================
async function handleBookSubmit(event) {
    event.preventDefault();

    const id = dom.bookId?.value?.trim() || '';
    const title = dom.bookTitle?.value.trim() || '';
    const publicationYear = dom.bookYear?.value ? Number(dom.bookYear.value) : null;
    const authorIds = getSelectedNumericIds(dom.bookAuthors);
    const themeIds = getSelectedNumericIds(dom.bookThemes);
    const status = dom.bookStatus?.value || null;
    const yearRead = dom.bookYearRead?.value ? Number(dom.bookYearRead.value) : null;
    const grade = dom.bookGrade?.value !== '' && dom.bookGrade?.value !== undefined ? Number(dom.bookGrade.value) : null;
    const priority = dom.bookPriority?.value ? Number(dom.bookPriority.value) : null;

    // Validação rápida no cliente antes de enviar ao Spring Boot
    const clientErrors = [];
    if (!title) clientErrors.push('O título é obrigatório.');
    if (!publicationYear) clientErrors.push('O ano de publicação é obrigatório.');
    if (authorIds.length === 0) clientErrors.push('Informe ao menos um autor.');
    if (themeIds.length === 0) clientErrors.push('Informe ao menos um tema.');

    if (clientErrors.length > 0) {
        alert(`⚠️ Corrija os campos abaixo:\n\n• ${clientErrors.join('\n• ')}`);
        return;
    }

    const bookData = {
        title,
        publicationYear,
        authorIds,
        themeIds,
        status,
        yearRead,
        grade,
        priority,
    };

    try {
        if (id) {
            await store.updateBook(id, bookData);
        } else {
            await store.addBook(bookData);
        }

        dom.formBook.reset();
        clearFormSelects(dom.formBook);
        if (dom.bookId) dom.bookId.value = '';
        if (dom.bookAccordion) dom.bookAccordion.open = false;
        if (dom.bookEditModal) closeModal(dom.bookEditModal);

        await init();
    } catch (error) {
        handleApiError(error, 'Erro ao salvar o livro.');
    }
}

function populateBookFormForEdit(bookId) {
    const book = appState.books.find(b => Number(b.id) === Number(bookId));
    if (!book) {
        handleApiError('Livro não encontrado para edição.');
        return;
    }

    const latestReading = getLatestReadingForBook(book.id);

    if (dom.bookId) dom.bookId.value = book.id;
    if (dom.bookTitle) dom.bookTitle.value = book.title || '';
    if (dom.bookYear) dom.bookYear.value = book.publicationYear || '';
    if (dom.bookStatus) dom.bookStatus.value = book.status || latestReading?.status || '';
    if (dom.bookYearRead) dom.bookYearRead.value = latestReading?.yearRead || '';
    if (dom.bookGrade) dom.bookGrade.value = latestReading?.grade ?? '';
    if (dom.bookPriority) dom.bookPriority.value = book.priority ?? '';

    const bookAuthorIds = extractBookAuthorIds(book);
    if (dom.bookAuthors) {
        Array.from(dom.bookAuthors.options).forEach(opt => {
            opt.selected = bookAuthorIds.includes(Number(opt.value));
        });
    }

    const bookThemeIds = extractBookThemeIds(book);
    if (dom.bookThemes) {
        Array.from(dom.bookThemes.options).forEach(opt => {
            opt.selected = bookThemeIds.includes(Number(opt.value));
        });
    }

    if (dom.bookEditModal) {
        openModal(dom.bookEditModal);
    } else if (dom.bookAccordion) {
        dom.bookAccordion.open = true;
        dom.formBook?.scrollIntoView({ behavior: 'smooth' });
    }
}

async function handleDeleteBook(bookId) {
    if (!confirm('Tem certeza que deseja excluir este livro?')) return;

    try {
        await store.deleteBook(bookId);
        await init();
    } catch (error) {
        handleApiError(error, 'Erro ao excluir o livro.');
    }
}

// =========================================================
// 2. FORMULÁRIO DE LEITURA (#form-reading)
// =========================================================
function openReadingModal(bookId) {
    if (dom.formReading) {
        dom.formReading.reset();
        clearFormSelects(dom.formReading);
    }
    if (dom.readingBookId) dom.readingBookId.value = bookId;

    renderBookReadingsHistory(bookId);
    openModal(dom.readingModal);
}

function renderBookReadingsHistory(bookId) {
    if (!dom.readingsHistoryList) return;

    const readings = appState.readings.filter(r => Number(r.book?.id ?? r.bookId) === Number(bookId));
    if (readings.length === 0) {
        dom.readingsHistoryList.innerHTML = `<p class="empty-message">Nenhuma leitura registrada para este livro.</p>`;
        return;
    }

    dom.readingsHistoryList.innerHTML = readings.map(r => `
        <div class="reading-history-item" data-id="${r.id}">
            <div class="reading-item-header">
                <span class="status-pill ${getStatusClass(r.status)}">${getStatusLabel(r.status)}</span>
                <button type="button" class="btn-small-del btn-delete-reading" data-id="${r.id}" data-book-id="${bookId}">Excluir</button>
            </div>
            ${r.yearRead ? `<p><strong>Ano:</strong> ${r.yearRead}</p>` : ''}
            ${r.grade !== null && r.grade !== undefined ? `<p><strong>Nota:</strong> ${r.grade}</p>` : ''}
        </div>
    `).join('');
}

async function handleReadingSubmit(event) {
    event.preventDefault();

    const bookId = dom.readingBookId?.value ? Number(dom.readingBookId.value) : null;
    const status = dom.readingStatus?.value.trim() || '';
    const yearRead = dom.readingYear?.value ? Number(dom.readingYear.value) : null;
    const grade = dom.readingGrade?.value !== '' && dom.readingGrade?.value !== undefined ? Number(dom.readingGrade.value) : null;

    const clientErrors = [];
    if (!bookId) clientErrors.push('O ID do livro é obrigatório.');
    if (!status) clientErrors.push('O status da leitura é obrigatório.');

    if (clientErrors.length > 0) {
        alert(`⚠️ Corrija os campos abaixo:\n\n• ${clientErrors.join('\n• ')}`);
        return;
    }

    const readingData = {
        bookId,
        status,
        yearRead,
        grade,
    };

    try {
        await store.saveReading(readingData);

        dom.formReading.reset();
        clearFormSelects(dom.formReading);
        if (dom.readingBookId) dom.readingBookId.value = '';
        closeModal(dom.readingModal);

        await init();
    } catch (error) {
        handleApiError(error, 'Erro ao salvar a leitura.');
    }
}

async function handleDeleteReading(readingId, bookId) {
    if (!confirm('Deseja excluir este registro de leitura?')) return;

    try {
        await store.deleteReading(readingId);
        await init();
        if (bookId && dom.readingModal?.classList.contains('active')) {
            renderBookReadingsHistory(bookId);
        }
    } catch (error) {
        handleApiError(error, 'Erro ao excluir a leitura.');
    }
}

function renderReadingLog() {
    if (!dom.readingLogTableBody) return;

    if (appState.readings.length === 0) {
        dom.readingLogTableBody.innerHTML = `<tr><td colspan="5" class="empty-message">Nenhuma leitura registrada.</td></tr>`;
        return;
    }

    dom.readingLogTableBody.innerHTML = appState.readings.map(r => {
        const rBookId = r.book?.id ?? r.bookId;
        const book = appState.books.find(b => Number(b.id) === Number(rBookId));
        const bookTitle = book ? book.title : (r.book?.title || `Livro #${rBookId}`);
        return `
            <tr>
                <td>${bookTitle}</td>
                <td><span class="status-pill ${getStatusClass(r.status)}">${getStatusLabel(r.status)}</span></td>
                <td>${r.yearRead || '-'}</td>
                <td>${r.grade ?? '-'}</td>
                <td>
                    <button type="button" class="btn-small-del btn-delete-reading" data-id="${r.id}" data-book-id="${rBookId}">Excluir</button>
                </td>
            </tr>
        `;
    }).join('');
}

// =========================================================
// 3. FORMULÁRIO DE AUTOR (#form-author)
// =========================================================
function renderAuthorsTable() {
    if (!dom.authorsTableBody) return;

    if (appState.authors.length === 0) {
        dom.authorsTableBody.innerHTML = `<tr><td colspan="2" class="empty-message">Nenhum autor cadastrado.</td></tr>`;
        return;
    }

    dom.authorsTableBody.innerHTML = appState.authors.map(author => `
        <tr>
            <td>${author.name} ${author.country?.name ? `(${author.country.name})` : ''}</td>
            <td>
                <button type="button" class="btn-small-del btn-delete-author" data-id="${author.id}">Excluir</button>
            </td>
        </tr>
    `).join('');
}

async function handleAuthorSubmit(event) {
    event.preventDefault();

    const name = dom.authorName?.value.trim() || '';
    const countryId = dom.authorCountryId?.value ? Number(dom.authorCountryId.value) : null;

    const clientErrors = [];
    if (!name) clientErrors.push('O nome do autor é obrigatório.');
    if (!countryId) clientErrors.push('O país do autor é obrigatório.');

    if (clientErrors.length > 0) {
        alert(`⚠️ Corrija os campos abaixo:\n\n• ${clientErrors.join('\n• ')}`);
        return;
    }

    const authorData = {
        name,
        countryId,
    };

    try {
        await store.addAuthor(authorData);

        dom.formAuthor.reset();
        clearFormSelects(dom.formAuthor);
        closeModal(dom.authorManagerModal);

        await init();
    } catch (error) {
        handleApiError(error, 'Erro ao cadastrar o autor.');
    }
}

async function handleDeleteAuthor(authorId) {
    if (!confirm('Deseja excluir este autor?')) return;

    try {
        await store.deleteAuthor(authorId);
        await init();
    } catch (error) {
        handleApiError(error, 'Não foi possível excluir o autor (verifique se há livros vinculados).');
    }
}

// =========================================================
// 4. RESET DE DADOS (#btn-reset)
// =========================================================
async function handleReset() {
    const confirmed = confirm(
        'Tem certeza que deseja restaurar os dados iniciais do sistema?\n\nTodas as alterações atuais serão substituídas.'
    );
    if (!confirmed) return;

    try {
        await store.resetData();

        if (dom.searchInput) dom.searchInput.value = '';
        if (dom.filterStatus) dom.filterStatus.value = '';
        if (dom.filterAuthor) dom.filterAuthor.value = '';
        appState.sortAscending = true;

        await init();
        alert('✅ Dados restaurados com sucesso!');
    } catch (error) {
        handleApiError(
            error,
            'Não foi possível restaurar os dados automaticamente. Verifique se o backend Spring Boot está em execução e tente novamente.'
        );
    }
}

// =========================================================
// EVENT LISTENERS
// =========================================================
function bindEvents() {
    // Formulários
    dom.formBook?.addEventListener('submit', handleBookSubmit);
    dom.formReading?.addEventListener('submit', handleReadingSubmit);
    dom.formAuthor?.addEventListener('submit', handleAuthorSubmit);

    // Botões Principais
    dom.btnManageAuthors?.addEventListener('click', () => {
        renderAuthorsTable();
        openModal(dom.authorManagerModal);
    });

    dom.btnViewLog?.addEventListener('click', () => {
        renderReadingLog();
        openModal(dom.readingLogModal);
    });

    dom.btnSort?.addEventListener('click', () => {
        appState.sortAscending = !appState.sortAscending;
        renderBooks();
    });

    dom.btnReset?.addEventListener('click', handleReset);

    // Filtros
    dom.searchInput?.addEventListener('input', renderBooks);
    dom.filterStatus?.addEventListener('change', renderBooks);
    dom.filterAuthor?.addEventListener('change', renderBooks);

    // Delegação nos Cards de Livros
    dom.bookGrid?.addEventListener('click', event => {
        const editBtn = event.target.closest('.btn-edit-book');
        if (editBtn) {
            populateBookFormForEdit(editBtn.dataset.id);
            return;
        }

        const removeBtn = event.target.closest('.btn-remove');
        if (removeBtn) {
            handleDeleteBook(removeBtn.dataset.id);
            return;
        }

        const readingsBtn = event.target.closest('.btn-readings');
        if (readingsBtn) {
            openReadingModal(readingsBtn.dataset.id);
        }
    });

    // Delegação no Histórico de Leituras e Log Geral
    dom.readingsHistoryList?.addEventListener('click', event => {
        const delBtn = event.target.closest('.btn-delete-reading');
        if (delBtn) {
            handleDeleteReading(delBtn.dataset.id, delBtn.dataset.bookId);
        }
    });

    dom.readingLogTableBody?.addEventListener('click', event => {
        const delBtn = event.target.closest('.btn-delete-reading');
        if (delBtn) {
            handleDeleteReading(delBtn.dataset.id, delBtn.dataset.bookId);
        }
    });

    // Delegação na Tabela de Autores
    dom.authorsTableBody?.addEventListener('click', event => {
        const delBtn = event.target.closest('.btn-delete-author');
        if (delBtn) {
            handleDeleteAuthor(delBtn.dataset.id);
        }
    });

    // Fechar Modais
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('dialog, .modal');
            closeModal(modal);
        });
    });
}

// =========================================================
// BOOTSTRAP
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    bindEvents();
    init();
});