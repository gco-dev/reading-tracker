import store from './store.js';
import { validateBook, validateAuthor, validateReading } from './validation.js';

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
// REFERÊNCIAS DO DOM (EXATAS DO index.html)
// =========================================================
const dom = {
    // Tema
    btnTheme: document.getElementById('btn-theme') || document.querySelector('.btn-theme'),

    // Botões Principais & Controles
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

    // Formulário Principal de Novo Livro (#form-new-book)
    bookAccordion: document.querySelector('.add-book-section details'),
    formNewBook: document.getElementById('form-new-book'),
    newTitle: document.getElementById('new-title'),
    newYear: document.getElementById('new-year'),
    newAuthor: document.getElementById('new-author'),
    typedAuthor: document.getElementById('typed-author'),
    newForm: document.getElementById('new-form'),
    newThemes: document.getElementById('new-themes'),
    newStatus: document.getElementById('new-status'),
    newYearRead: document.getElementById('new-year-read'),
    newGrade: document.getElementById('new-grade'),
    newPriority: document.getElementById('new-priority'),

    // Modal de Edição de Livro (#book-edit-modal / #form-edit-book)
    bookEditModal: document.getElementById('book-edit-modal'),
    formEditBook: document.getElementById('form-edit-book'),
    editBookId: document.getElementById('edit-book-id'),
    editTitle: document.getElementById('edit-title'),
    editYear: document.getElementById('edit-year'),
    editForm: document.getElementById('edit-form'),
    editThemes: document.getElementById('edit-themes'),
    editPriority: document.getElementById('edit-priority'),

    // Modal de Gerenciamento de Autores (#author-manager-modal)
    authorManagerModal: document.getElementById('author-manager-modal'),
    formManageAuthor: document.getElementById('form-manage-author') || document.querySelector('#author-manager-modal form'),
    authorIdInput: document.getElementById('author-id'),
    authorNameInput: document.getElementById('author-name'),
    authorCountrySelect: document.getElementById('author-country'),
    btnCancelAuthorEdit: document.getElementById('btn-cancel-author-edit'),
    authorsTableBody: document.getElementById('authors-table-body') || document.querySelector('#author-manager-modal tbody'),

    // Modal de Leituras do Livro (#reading-modal / #form-modal-reading)
    readingModal: document.getElementById('reading-modal'),
    formModalReading: document.getElementById('form-modal-reading'),
    modalBookId: document.getElementById('modal-book-id'),
    modalReadingId: document.getElementById('modal-reading-id'),
    modalStatus: document.getElementById('modal-status'),
    modalYearRead: document.getElementById('modal-year-read'),
    modalGrade: document.getElementById('modal-grade'),
    readingsHistoryList: document.getElementById('readings-history-list') || document.querySelector('#reading-modal .readings-history-list'),

    // Modal de Log Geral de Leituras (#reading-log-modal)
    readingLogModal: document.getElementById('reading-log-modal'),
    readingLogTableBody: document.getElementById('reading-log-body') || document.querySelector('#reading-log-modal tbody'),
};

// =========================================================
// HELPERS DE MODAL, NOTIFICAÇÃO E VALIDAÇÃO
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

function notifyError(error, fallbackMessage = 'Ocorreu um erro inesperado.') {
    console.error('[Ex-Libris Error]:', error);
    const message = error?.message || (typeof error === 'string' ? error : fallbackMessage);
    alert(`⚠️ ${message}`);
}

function clearFormErrors(form) {
    if (!form) return;
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    form.querySelectorAll('.field-error').forEach(el => {
        el.textContent = '';
    });
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

function displayValidationErrors(form, result) {
    if (!result || result.valid) return;

    const errors = result.errors || {};
    const unmappedMessages = [];

    if (Array.isArray(errors)) {
        errors.forEach(err => {
            if (typeof err === 'string') {
                unmappedMessages.push(err);
            } else if (err && err.field && err.message) {
                const span = form?.querySelector(`.field-error[data-error-for="${err.field}"]`);
                if (span) {
                    span.textContent = err.message;
                } else {
                    unmappedMessages.push(err.message);
                }
            }
        });
    } else if (typeof errors === 'object') {
        Object.entries(errors).forEach(([field, message]) => {
            if (!message) return;
            const span = form?.querySelector(`.field-error[data-error-for="${field}"]`);
            if (span) {
                span.textContent = message;
                const input = form.querySelector(`[name="${field}"], #${field}`);
                input?.classList.add('is-invalid');
            } else {
                unmappedMessages.push(message);
            }
        });
    }

    if (result.message && unmappedMessages.length === 0 && Object.keys(errors).length === 0) {
        unmappedMessages.push(result.message);
    }

    if (unmappedMessages.length > 0) {
        alert(`⚠️ Corrija os seguintes erros:\n- ${unmappedMessages.join('\n- ')}`);
    }
}

// =========================================================
// CARREGAMENTO INICIAL PARALELO (Promise.all)
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

        populateAuthorDropdown();
        populateCountryDropdown();
        populateThemeDropdown();
        renderBooks();
        renderAuthorsTable();
        renderReadingLog();
    } catch (error) {
        notifyError(error, 'Não foi possível carregar os dados iniciais da API.');
    }
}

// =========================================================
// TEMA (LIGHT / DARK AMOLED)
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
// POPULAÇÃO DE DROPDOWNS (AUTORES, PAÍSES E TEMAS)
// =========================================================
function populateAuthorDropdown() {
    const optionsHtml = appState.authors
        .map(author => `<option value="${author.id}">${author.name}</option>`)
        .join('');

    const targets = [
        { el: dom.newAuthor, placeholder: 'Selecione um autor...' },
        { el: dom.filterAuthor, placeholder: 'Todos os autores' },
    ];

    targets.forEach(({ el, placeholder }) => {
        if (!el) return;
        const previousVal = el.value;
        el.innerHTML = `<option value="">${placeholder}</option>${optionsHtml}`;
        if (previousVal) el.value = previousVal;
    });
}

function populateCountryDropdown() {
    if (!dom.authorCountrySelect) return;
    const previousVal = dom.authorCountrySelect.value;
    const optionsHtml = appState.countries
        .map(c => {
            const id = typeof c === 'object' ? (c.id ?? c.code ?? c.name) : c;
            const label = typeof c === 'object' ? (c.name ?? c.label ?? id) : c;
            return `<option value="${id}">${label}</option>`;
        })
        .join('');
    dom.authorCountrySelect.innerHTML = `<option value="">Selecione um país...</option>${optionsHtml}`;
    if (previousVal) dom.authorCountrySelect.value = previousVal;
}

function populateThemeDropdown() {
    const optionsHtml = appState.themes
        .map(t => {
            const id = typeof t === 'object' ? (t.id ?? t.name) : t;
            const label = typeof t === 'object' ? (t.name ?? t.label ?? id) : t;
            return `<option value="${id}">${label}</option>`;
        })
        .join('');

    [dom.newThemes, dom.editThemes].forEach(el => {
        if (!el || el.tagName !== 'SELECT') return;
        const selectedValues = Array.from(el.selectedOptions).map(o => o.value);
        const placeholder = el.multiple ? '' : '<option value="">Selecione um tema...</option>';
        el.innerHTML = `${placeholder}${optionsHtml}`;
        if (selectedValues.length > 0) {
            Array.from(el.options).forEach(opt => {
                if (selectedValues.includes(opt.value)) opt.selected = true;
            });
        }
    });
}

// =========================================================
// HELPERS DE DADOS DE LIVRO / TEMAS / AUTORES
// =========================================================
function extractBookAuthorIds(book) {
    if (!book) return [];
    if (Array.isArray(book.authorIds) && book.authorIds.length > 0) {
        return book.authorIds;
    }
    if (Array.isArray(book.authors) && book.authors.length > 0) {
        return book.authors.map(a => (typeof a === 'object' ? a.id : a)).filter(Boolean);
    }
    if (book.authorId) return [book.authorId];
    if (book.author?.id) return [book.author.id];
    return [];
}

function getBookAuthorNames(book) {
    if (book.authorName) return book.authorName;
    if (Array.isArray(book.authors) && book.authors.length > 0) {
        return book.authors.map(a => (typeof a === 'object' ? a.name : a)).filter(Boolean).join(', ');
    }
    const ids = extractBookAuthorIds(book);
    if (ids.length > 0) {
        const names = ids
            .map(id => appState.authors.find(a => String(a.id) === String(id))?.name)
            .filter(Boolean);
        if (names.length > 0) return names.join(', ');
    }
    if (book.author?.name) return book.author.name;
    return 'Autor desconhecido';
}

function extractThemesFromField(el) {
    if (!el) return [];
    if (el.tagName === 'SELECT') {
        return Array.from(el.selectedOptions)
            .map(opt => opt.value)
            .filter(Boolean);
    }
    const raw = el.value.trim();
    return raw ? raw.split(',').map(t => t.trim()).filter(Boolean) : [];
}

function formatBookThemes(book) {
    if (!book) return '';
    if (Array.isArray(book.themes)) {
        return book.themes
            .map(t => (typeof t === 'object' ? (t.name ?? t.id) : t))
            .filter(Boolean)
            .join(', ');
    }
    if (Array.isArray(book.themeIds)) {
        return book.themeIds
            .map(id => {
                const found = appState.themes.find(t => String(t.id ?? t) === String(id));
                return found ? (found.name ?? found) : id;
            })
            .filter(Boolean)
            .join(', ');
    }
    return book.themes || '';
}

function getLatestReadingForBook(bookId) {
    const bookReadings = appState.readings.filter(r => String(r.bookId) === String(bookId));
    if (bookReadings.length === 0) return null;
    return bookReadings[bookReadings.length - 1];
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
            const currentStatus = book.currentStatus || book.status || latest?.status || '';
            return currentStatus === statusFilter;
        });
    }

    if (authorFilter) {
        books = books.filter(book =>
            extractBookAuthorIds(book).some(id => String(id) === String(authorFilter))
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
        const status = book.currentStatus || book.status || latestReading?.status || 'UNKNOWN';
        const authorNames = getBookAuthorNames(book);
        const year = book.publicationYear || book.year || '';
        const themesText = formatBookThemes(book);

        return `
            <article class="book-card" data-id="${book.id}">
                <div>
                    <span class="status-badge ${getStatusClass(status)}">${getStatusLabel(status)}</span>
                    <h3>${book.title}</h3>
                    <p><strong>Autor:</strong> ${authorNames}</p>
                    ${year ? `<p><strong>Ano:</strong> ${year}</p>` : ''}
                    ${book.form ? `<p><strong>Forma:</strong> ${book.form}</p>` : ''}
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
// ADICIONAR NOVO LIVRO (#form-new-book)
// =========================================================
async function handleNewBookSubmit(event) {
    event.preventDefault();
    clearFormErrors(dom.formNewBook);

    try {
        let authorId = dom.newAuthor?.value || '';
        const typedAuthorName = dom.typedAuthor?.value.trim() || '';

        if (!authorId && typedAuthorName) {
            const newAuthorPayload = { name: typedAuthorName };
            const authorValidation = validateAuthor(newAuthorPayload);
            if (authorValidation && !authorValidation.valid) {
                displayValidationErrors(dom.formNewBook, authorValidation);
                return;
            }
            const createdAuthor = await store.saveAuthor(newAuthorPayload);
            authorId = createdAuthor?.id || '';
        }

        const authorIds = authorId ? [authorId] : [];
        const themes = extractThemesFromField(dom.newThemes);
        const yearValue = dom.newYear?.value ? Number(dom.newYear.value) : null;
        const priorityValue = dom.newPriority?.value ? Number(dom.newPriority.value) : null;

        const bookPayload = {
            title: dom.newTitle?.value.trim() || '',
            publicationYear: yearValue,
            year: yearValue,
            authorIds,
            form: dom.newForm?.value.trim() || '',
            themes,
            priority: priorityValue,
        };

        const bookValidation = validateBook(bookPayload);
        if (bookValidation && !bookValidation.valid) {
            displayValidationErrors(dom.formNewBook, bookValidation);
            return;
        }

        const savedBook = await store.saveBook(bookPayload);

        const initialStatus = dom.newStatus?.value || '';
        if (initialStatus && savedBook?.id) {
            const rawGrade = dom.newGrade?.value;
            const readingPayload = {
                bookId: savedBook.id,
                status: initialStatus,
                yearRead: dom.newYearRead?.value ? Number(dom.newYearRead.value) : null,
                grade: rawGrade !== '' && rawGrade !== undefined ? Number(rawGrade) : null,
                priority: priorityValue,
            };

            const readingValidation = validateReading(readingPayload);
            if (readingValidation && !readingValidation.valid) {
                displayValidationErrors(dom.formNewBook, readingValidation);
                return;
            }

            await store.saveReading(readingPayload);
        }

        dom.formNewBook.reset();
        clearFormSelects(dom.formNewBook);
        if (dom.bookAccordion) dom.bookAccordion.open = false;

        await init();
    } catch (error) {
        notifyError(error, 'Erro ao cadastrar o livro.');
    }
}

// =========================================================
// EDITAR E EXCLUIR LIVRO (#book-edit-modal / #form-edit-book)
// =========================================================
function openEditBookModal(bookId) {
    const book = appState.books.find(b => String(b.id) === String(bookId));
    if (!book) {
        notifyError('Livro não encontrado para edição.');
        return;
    }

    clearFormErrors(dom.formEditBook);

    if (dom.editBookId) dom.editBookId.value = book.id;
    if (dom.editTitle) dom.editTitle.value = book.title || '';
    if (dom.editYear) dom.editYear.value = book.publicationYear || book.year || '';
    if (dom.editForm) dom.editForm.value = book.form || '';
    if (dom.editPriority) dom.editPriority.value = book.priority ?? '';

    if (dom.editThemes) {
        if (dom.editThemes.tagName === 'SELECT') {
            const bookThemeValues = Array.isArray(book.themeIds)
                ? book.themeIds.map(String)
                : Array.isArray(book.themes)
                    ? book.themes.map(t => String(typeof t === 'object' ? (t.id ?? t.name) : t))
                    : [];
            Array.from(dom.editThemes.options).forEach(opt => {
                opt.selected = bookThemeValues.includes(String(opt.value));
            });
        } else {
            dom.editThemes.value = formatBookThemes(book);
        }
    }

    openModal(dom.bookEditModal);
}

async function handleEditBookSubmit(event) {
    event.preventDefault();
    clearFormErrors(dom.formEditBook);

    try {
        const id = dom.editBookId?.value.trim() || '';
        const existingBook = appState.books.find(b => String(b.id) === String(id));
        const preservedAuthorIds = extractBookAuthorIds(existingBook);

        const themes = extractThemesFromField(dom.editThemes);
        const yearValue = dom.editYear?.value ? Number(dom.editYear.value) : null;
        const priorityValue = dom.editPriority?.value ? Number(dom.editPriority.value) : null;

        const bookPayload = {
            id,
            title: dom.editTitle?.value.trim() || '',
            publicationYear: yearValue,
            year: yearValue,
            authorIds: preservedAuthorIds,
            form: dom.editForm?.value.trim() || '',
            themes,
            priority: priorityValue,
        };

        const validation = validateBook(bookPayload);
        if (validation && !validation.valid) {
            displayValidationErrors(dom.formEditBook, validation);
            return;
        }

        await store.saveBook(bookPayload);

        dom.formEditBook.reset();
        clearFormSelects(dom.formEditBook);
        if (dom.editBookId) dom.editBookId.value = '';
        closeModal(dom.bookEditModal);

        await init();
    } catch (error) {
        notifyError(error, 'Erro ao atualizar o livro.');
    }
}

async function handleDeleteBook(bookId) {
    if (!confirm('Tem certeza que deseja excluir este livro?')) return;

    try {
        await store.deleteBook(bookId);
        await init();
    } catch (error) {
        notifyError(error, 'Erro ao excluir o livro.');
    }
}

// =========================================================
// LEITURAS DO LIVRO (#reading-modal / #form-modal-reading)
// =========================================================
function openReadingModal(bookId) {
    if (dom.formModalReading) {
        dom.formModalReading.reset();
        clearFormSelects(dom.formModalReading);
        clearFormErrors(dom.formModalReading);
    }
    if (dom.modalReadingId) dom.modalReadingId.value = '';
    if (dom.modalBookId) dom.modalBookId.value = bookId;

    renderBookReadingsHistory(bookId);
    openModal(dom.readingModal);
}

function renderBookReadingsHistory(bookId) {
    if (!dom.readingsHistoryList) return;

    const readings = appState.readings.filter(r => String(r.bookId) === String(bookId));
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
            ${r.grade !== null && r.grade !== undefined && r.grade !== '' ? `<p><strong>Nota:</strong> ${r.grade}</p>` : ''}
        </div>
    `).join('');
}

async function handleReadingSubmit(event) {
    event.preventDefault();
    clearFormErrors(dom.formModalReading);

    try {
        const id = dom.modalReadingId?.value.trim() || null;
        const bookId = dom.modalBookId?.value.trim() || '';
        const status = dom.modalStatus?.value || '';
        const rawGrade = dom.modalGrade?.value;

        const readingPayload = {
            ...(id ? { id } : {}),
            bookId,
            status,
            yearRead: dom.modalYearRead?.value ? Number(dom.modalYearRead.value) : null,
            grade: rawGrade !== '' && rawGrade !== undefined ? Number(rawGrade) : null,
        };

        const validation = validateReading(readingPayload);
        if (validation && !validation.valid) {
            displayValidationErrors(dom.formModalReading, validation);
            return;
        }

        await store.saveReading(readingPayload);

        dom.formModalReading.reset();
        clearFormSelects(dom.formModalReading);
        if (dom.modalReadingId) dom.modalReadingId.value = '';
        if (dom.modalBookId) dom.modalBookId.value = '';
        closeModal(dom.readingModal);

        await init();
    } catch (error) {
        notifyError(error, 'Erro ao salvar a leitura.');
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
        notifyError(error, 'Erro ao excluir a leitura.');
    }
}

function renderReadingLog() {
    if (!dom.readingLogTableBody) return;

    if (appState.readings.length === 0) {
        dom.readingLogTableBody.innerHTML = `<tr><td colspan="5" class="empty-message">Nenhuma leitura registrada.</td></tr>`;
        return;
    }

    dom.readingLogTableBody.innerHTML = appState.readings.map(r => {
        const book = appState.books.find(b => String(b.id) === String(r.bookId));
        const bookTitle = book ? book.title : `Livro #${r.bookId}`;
        return `
            <tr>
                <td>${bookTitle}</td>
                <td><span class="status-pill ${getStatusClass(r.status)}">${getStatusLabel(r.status)}</span></td>
                <td>${r.yearRead || '-'}</td>
                <td>${r.grade ?? '-'}</td>
                <td>
                    <button type="button" class="btn-small-del btn-delete-reading" data-id="${r.id}" data-book-id="${r.bookId}">Excluir</button>
                </td>
            </tr>
        `;
    }).join('');
}

// =========================================================
// GERENCIAMENTO DE AUTORES (#author-manager-modal)
// =========================================================
function renderAuthorsTable() {
    if (!dom.authorsTableBody) return;

    if (appState.authors.length === 0) {
        dom.authorsTableBody.innerHTML = `<tr><td colspan="2" class="empty-message">Nenhum autor cadastrado.</td></tr>`;
        return;
    }

    dom.authorsTableBody.innerHTML = appState.authors.map(author => `
        <tr>
            <td>${author.name}</td>
            <td>
                <button type="button" class="btn-small-edit btn-edit-author" data-id="${author.id}">Editar</button>
                <button type="button" class="btn-small-del btn-delete-author" data-id="${author.id}">Excluir</button>
            </td>
        </tr>
    `).join('');
}

async function handleAuthorSubmit(event) {
    event.preventDefault();
    clearFormErrors(dom.formManageAuthor);

    try {
        const id = dom.authorIdInput?.value.trim() || null;
        const name = dom.authorNameInput?.value.trim() || '';
        const country = dom.authorCountrySelect?.value || null;

        const authorPayload = {
            ...(id ? { id } : {}),
            name,
            ...(country ? { country } : {}),
        };

        const validation = validateAuthor(authorPayload);
        if (validation && !validation.valid) {
            displayValidationErrors(dom.formManageAuthor, validation);
            return;
        }

        await store.saveAuthor(authorPayload);

        dom.formManageAuthor.reset();
        clearFormSelects(dom.formManageAuthor);
        if (dom.authorIdInput) dom.authorIdInput.value = '';
        if (dom.btnCancelAuthorEdit) dom.btnCancelAuthorEdit.style.display = 'none';
        closeModal(dom.authorManagerModal);

        await init();
    } catch (error) {
        notifyError(error, 'Erro ao salvar o autor.');
    }
}

async function handleDeleteAuthor(authorId) {
    if (!confirm('Deseja excluir este autor?')) return;

    try {
        await store.deleteAuthor(authorId);
        await init();
    } catch (error) {
        notifyError(error, 'Não foi possível excluir o autor (verifique se há livros vinculados).');
    }
}

// =========================================================
// RESET DE DADOS E FILTROS (#btn-reset)
// =========================================================
async function handleReset() {
    if (!confirm('Deseja restaurar os dados iniciais do banco de dados?')) return;

    try {
        await store.resetData();

        if (dom.searchInput) dom.searchInput.value = '';
        if (dom.filterStatus) dom.filterStatus.value = '';
        if (dom.filterAuthor) dom.filterAuthor.value = '';
        appState.sortAscending = true;

        await init();
    } catch (error) {
        notifyError(error, 'Erro ao resetar os dados.');
    }
}

// =========================================================
// EVENT LISTENERS
// =========================================================
function bindEvents() {
    // Formulários
    dom.formNewBook?.addEventListener('submit', handleNewBookSubmit);
    dom.formEditBook?.addEventListener('submit', handleEditBookSubmit);
    dom.formModalReading?.addEventListener('submit', handleReadingSubmit);
    dom.formManageAuthor?.addEventListener('submit', handleAuthorSubmit);

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

    // Cancelar edição de autor
    dom.btnCancelAuthorEdit?.addEventListener('click', () => {
        dom.formManageAuthor?.reset();
        clearFormSelects(dom.formManageAuthor);
        if (dom.authorIdInput) dom.authorIdInput.value = '';
        dom.btnCancelAuthorEdit.style.display = 'none';
    });

    // Delegação nos Cards de Livros
    dom.bookGrid?.addEventListener('click', event => {
        const editBtn = event.target.closest('.btn-edit-book');
        if (editBtn) {
            openEditBookModal(editBtn.dataset.id);
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
        const editBtn = event.target.closest('.btn-edit-author');
        if (editBtn) {
            const author = appState.authors.find(a => String(a.id) === String(editBtn.dataset.id));
            if (author) {
                if (dom.authorIdInput) dom.authorIdInput.value = author.id;
                if (dom.authorNameInput) dom.authorNameInput.value = author.name;
                if (dom.authorCountrySelect && author.country) dom.authorCountrySelect.value = author.country;
                if (dom.btnCancelAuthorEdit) dom.btnCancelAuthorEdit.style.display = 'inline-block';
            }
            return;
        }

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