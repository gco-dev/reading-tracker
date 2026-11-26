// js/app.js

import store from './store.js';

// =========================================================
// APPLICATION STATE
// =========================================================
const appState = {
    books: [],
    authors: [],
    readings: [],
    themes: [],
    countries: [],
    sortMode: 'az', // 'az' | 'newest'
};

// =========================================================
// DOM REFERENCES
// =========================================================
const dom = {
    // Top Bar Controls
    btnAddBook: document.getElementById('btn-add-book'),
    btnManageAuthors: document.getElementById('btn-manage-authors'),
    btnSort: document.getElementById('btn-sort'),
    btnReset: document.getElementById('btn-reset'),

    // Optional Notification Banner
    notificationBanner: document.getElementById('notification-banner'),

    // Book Library & Stats
    bookList: document.getElementById('book-list'),
    bookCounter: document.getElementById('book-counter'),
    statTotalBooks: document.getElementById('stat-total-books'),
    statBooksRead: document.getElementById('stat-books-read'),
    statBooksReading: document.getElementById('stat-books-reading'),
    statBooksWantToRead: document.getElementById('stat-books-want-to-read'),
    statTotalAuthors: document.getElementById('stat-total-authors'),

    // 1. Author Modal (#modal-author)
    modalAuthor: document.getElementById('modal-author'),
    formAuthor: document.getElementById('form-author'),
    authorId: document.getElementById('author-id'),
    authorName: document.getElementById('author-name'),
    authorCountryId: document.getElementById('author-country-id'),
    btnCancelAuthorEdit: document.getElementById('btn-cancel-author-edit'),
    authorTableBody: document.querySelector('#author-table tbody'),

    // 2. Book Modal (#modal-book)
    modalBook: document.getElementById('modal-book'),
    modalBookHeader: document.getElementById('modal-book-header'),
    formBook: document.getElementById('form-book'),
    bookId: document.getElementById('book-id'),
    bookTitle: document.getElementById('book-title'),
    bookYear: document.getElementById('book-year'),
    bookAuthorsChips: document.getElementById('book-authors-chips'),
    bookThemesChips: document.getElementById('book-themes-chips'),
    bookStatus: document.getElementById('book-status'),
    bookYearRead: document.getElementById('book-year-read'),
    bookGrade: document.getElementById('book-grade'),
    bookPriority: document.getElementById('book-priority'),
    btnSaveBook: document.getElementById('btn-save-book'),

    // 3. Reading Modal (#modal-reading)
    modalReading: document.getElementById('modal-reading'),
    modalReadingBookTitle: document.getElementById('modal-reading-book-title'),
    modalReadingsList: document.getElementById('modal-readings-list'),
    formReading: document.getElementById('form-reading'),
    readingBookId: document.getElementById('reading-book-id'),
    readingId: document.getElementById('reading-id'),
    readingStatus: document.getElementById('reading-status'),
    readingYear: document.getElementById('reading-year'),
    readingGrade: document.getElementById('reading-grade'),
    btnCancelReadingEdit: document.getElementById('btn-cancel-reading-edit'),
};

let notificationTimeoutId = null;

// =========================================================
// MODAL & FORM HELPERS
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

function clearFormErrors(formElement) {
    if (!formElement) return;

    formElement.querySelectorAll('.field-error').forEach(span => {
        span.textContent = '';
    });

    formElement
        .querySelectorAll('.input-error, .is-invalid, .field-invalid, [aria-invalid="true"]')
        .forEach(element => {
            element.classList.remove('input-error', 'is-invalid', 'field-invalid');
            element.removeAttribute('aria-invalid');
        });
}

function setFieldError(formElement, fieldName, message) {
    const scope = formElement || document;
    const escapedField =
        typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
            ? CSS.escape(fieldName)
            : fieldName.replace(/"/g, '\\"');

    const errorSpan = scope.querySelector(`.field-error[data-error-for="${escapedField}"]`);
    if (errorSpan) {
        errorSpan.textContent = message;
    }

    const inputByName = scope.querySelector(`[name="${escapedField}"]`);
    const fieldGroupControl = errorSpan
        ?.closest('.form-group, .field-group, label')
        ?.querySelector('input, select, textarea, .chips-container');

    const targetControl = inputByName || fieldGroupControl;
    if (targetControl) {
        targetControl.classList.add('input-error', 'is-invalid');
        targetControl.setAttribute('aria-invalid', 'true');
    }

    return Boolean(errorSpan);
}

function getSelectedNumericIds(chipsContainer) {
    if (!chipsContainer) return [];
    return Array.from(chipsContainer.querySelectorAll('input[type="checkbox"]:checked'))
        .map(input => Number(input.value))
        .filter(id => !Number.isNaN(id) && id > 0);
}

// =========================================================
// YEAR FORMATTING (NEGATIVE YEARS -> BC)
// =========================================================
function formatYear(year) {
    if (year === null || year === undefined || year === '') return '';
    const numericYear = Number(year);
    if (Number.isNaN(numericYear)) return String(year);
    if (numericYear < 0) {
        return `${Math.abs(numericYear)} BC`;
    }
    return `${numericYear}`;
}

// =========================================================
// ERROR HANDLING & NOTIFICATIONS
// =========================================================
function showNotification(message, type = 'error') {
    if (dom.notificationBanner) {
        dom.notificationBanner.textContent = message;
        dom.notificationBanner.className = `notification-banner notification-${type}`;
        dom.notificationBanner.classList.remove('hidden');

        if (notificationTimeoutId) {
            clearTimeout(notificationTimeoutId);
        }
        notificationTimeoutId = setTimeout(() => {
            dom.notificationBanner?.classList.add('hidden');
        }, 6000);
        return;
    }

    alert(message);
}

function extractFieldErrors(error) {
    const fieldErrors = {};
    const rawErrors = error?.payload?.errors ?? error?.errors ?? null;

    if (!rawErrors) return fieldErrors;

    if (Array.isArray(rawErrors)) {
        rawErrors.forEach(item => {
            if (item && typeof item === 'object' && item.field) {
                const msg = item.defaultMessage || item.message || String(item);
                fieldErrors[item.field] = fieldErrors[item.field]
                    ? `${fieldErrors[item.field]} ${msg}`
                    : msg;
            }
        });
    } else if (typeof rawErrors === 'object') {
        const entries = Object.entries(rawErrors);
        entries.forEach(([field, msg]) => {
            if (field === 'message' && typeof msg === 'string' && entries.length === 1) {
                return;
            }
            if (msg !== null && msg !== undefined) {
                fieldErrors[field] = Array.isArray(msg) ? msg.join(' ') : String(msg);
            }
        });
    }

    return fieldErrors;
}

function handleApiError(
    error,
    formOrFallback = null,
    fallbackMessage = 'An unexpected error occurred while communicating with the server.'
) {
    console.error('[Ex-Libris Error]:', error);

    const formElement = formOrFallback instanceof HTMLElement ? formOrFallback : null;
    const effectiveFallback =
        typeof formOrFallback === 'string' && formOrFallback.trim() !== ''
            ? formOrFallback
            : fallbackMessage;

    if (typeof error === 'string') {
        showNotification(error || effectiveFallback, 'error');
        return;
    }

    const isErrorObject = error instanceof Error || (error && typeof error === 'object');
    if (!isErrorObject) {
        showNotification(effectiveFallback, 'error');
        return;
    }

    const activeForm =
        formElement || document.querySelector('dialog[open] form, .custom-modal.active form');

    if (activeForm) {
        clearFormErrors(activeForm);
    }

    const fieldErrors = extractFieldErrors(error);
    const fieldErrorEntries = Object.entries(fieldErrors);
    let renderedInlineCount = 0;

    fieldErrorEntries.forEach(([fieldName, message]) => {
        if (setFieldError(activeForm || document, fieldName, message)) {
            renderedInlineCount += 1;
        }
    });

    const apiMessage =
        error.payload?.message ||
        error.message ||
        effectiveFallback;

    if (error.status === 409) {
        showNotification(apiMessage, 'error');
        return;
    }

    if (fieldErrorEntries.length > 0) {
        const detailsList = fieldErrorEntries
            .map(([field, msg]) => `${field}: ${msg}`)
            .join('\n• ');

        const alertText =
            renderedInlineCount === fieldErrorEntries.length
                ? `${apiMessage}\n\nPlease review the highlighted fields.`
                : `Validation Error:\n\n• ${detailsList}`;

        showNotification(alertText, 'error');
        return;
    }

    showNotification(apiMessage, 'error');
}

// =========================================================
// STATE SYNC & INITIAL DATA LOAD
// =========================================================
function syncStateFromStore() {
    appState.books = Array.isArray(store.state.books) ? [...store.state.books] : [];
    appState.authors = Array.isArray(store.state.authors) ? [...store.state.authors] : [];
    appState.readings = Array.isArray(store.state.readings) ? [...store.state.readings] : [];
    appState.themes = Array.isArray(store.state.themes) ? [...store.state.themes] : [];
    appState.countries = Array.isArray(store.state.countries) ? [...store.state.countries] : [];
}

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

        populateCountryDropdown();
        populateAuthorDropdown();
        populateThemeDropdown();
        renderBooks();
        renderStats();
        renderAuthorsTable();
    } catch (error) {
        handleApiError(error, 'Failed to load initial library data from the API.');
    }
}

// =========================================================
// POPULATE MODAL SELECTORS (SORTED ALPHABETICALLY)
// =========================================================
function getCountryNameById(countryId) {
    if (!countryId) return '';
    const country = appState.countries.find(c => Number(c.id) === Number(countryId));
    return country ? country.name : '';
}

function getAuthorCountryName(author) {
    if (!author) return '';
    if (typeof author.country === 'object' && author.country?.name) {
        return author.country.name;
    }
    if (typeof author.country === 'string' && author.country.trim() !== '') {
        return author.country;
    }
    if (author.countryName) {
        return author.countryName;
    }
    if (author.countryId) {
        return getCountryNameById(author.countryId);
    }
    return '';
}

function populateCountryDropdown() {
    if (!dom.authorCountryId) return;

    const previousValue = dom.authorCountryId.value;
    const sortedCountries = [...appState.countries].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'en', { sensitivity: 'base' })
    );

    const optionsHtml = sortedCountries
        .map(country => `<option value="${country.id}">${country.name}</option>`)
        .join('');

    dom.authorCountryId.innerHTML = `<option value="">Select Country...</option>${optionsHtml}`;
    if (previousValue) {
        dom.authorCountryId.value = previousValue;
    }
}

function populateAuthorDropdown(selectedIds = []) {
    if (!dom.bookAuthorsChips) return;

    const selectedSet = new Set(selectedIds.map(Number));
    const sortedAuthors = [...appState.authors].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'en', { sensitivity: 'base' })
    );

    dom.bookAuthorsChips.innerHTML = sortedAuthors
        .map(author => {
            const countryName = getAuthorCountryName(author);
            const label = countryName ? `${author.name} (${countryName})` : author.name;
            const isSelected = selectedSet.has(Number(author.id));

            return `<label class="chip-pill ${isSelected ? 'selected' : ''}">
                <input type="checkbox" value="${author.id}" ${isSelected ? 'checked' : ''}>
                <span>${label}</span>
            </label>`;
        })
        .join('');
}

function populateThemeDropdown(selectedIds = []) {
    if (!dom.bookThemesChips) return;

    const selectedSet = new Set(selectedIds.map(Number));
    const sortedThemes = [...appState.themes].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'en', { sensitivity: 'base' })
    );

    dom.bookThemesChips.innerHTML = sortedThemes
        .map(theme => {
            const isSelected = selectedSet.has(Number(theme.id));

            return `<label class="chip-pill ${isSelected ? 'selected' : ''}">
                <input type="checkbox" value="${theme.id}" ${isSelected ? 'checked' : ''}>
                <span>${theme.name}</span>
            </label>`;
        })
        .join('');
}

// =========================================================
// DISPLAY HELPERS
// =========================================================
function extractBookAuthorIds(book) {
    if (!book) return [];
    if (Array.isArray(book.authorIds) && book.authorIds.length > 0) {
        return book.authorIds.map(Number);
    }
    if (Array.isArray(book.authors) && book.authors.length > 0) {
        return book.authors.map(a => Number(typeof a === 'object' ? a.id : a)).filter(Boolean);
    }
    return [];
}

function extractBookThemeIds(book) {
    if (!book) return [];
    if (Array.isArray(book.themeIds) && book.themeIds.length > 0) {
        return book.themeIds.map(Number);
    }
    if (Array.isArray(book.themes) && book.themes.length > 0) {
        return book.themes.map(t => Number(typeof t === 'object' ? t.id : t)).filter(Boolean);
    }
    return [];
}

function getBookAuthorNames(book) {
    if (Array.isArray(book.authors) && book.authors.length > 0) {
        return book.authors
            .map(a => (typeof a === 'object' ? a.name : a))
            .filter(Boolean)
            .join(', ');
    }
    const ids = extractBookAuthorIds(book);
    if (ids.length > 0) {
        const names = ids
            .map(id => appState.authors.find(a => Number(a.id) === id)?.name)
            .filter(Boolean);
        if (names.length > 0) return names.join(', ');
    }
    return 'Unknown Author';
}

function formatBookThemes(book) {
    if (!book) return '';
    if (Array.isArray(book.themes) && book.themes.length > 0) {
        return book.themes
            .map(t => (typeof t === 'object' ? t.name : t))
            .filter(Boolean)
            .join(', ');
    }
    const ids = extractBookThemeIds(book);
    if (ids.length > 0) {
        return ids
            .map(id => appState.themes.find(t => Number(t.id) === id)?.name)
            .filter(Boolean)
            .join(', ');
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

function getEffectiveBookStatus(book) {
    const latestReading = getLatestReadingForBook(book.id);
    return book.status || latestReading?.status || 'UNREAD';
}

function getStatusClass(status) {
    const map = {
        READ: 'status-read',
        PAUSED: 'status-paused',
        WANT_TO_READ: 'status-want-to-read',
        READING: 'status-reading',
        ABANDONED: 'status-abandoned',
        UNREAD: 'status-unread',
    };
    return map[status] || 'status-unread';
}

function getStatusLabel(status) {
    const map = {
        READ: 'Read',
        PAUSED: 'Paused',
        WANT_TO_READ: 'Want to Read',
        READING: 'Reading',
        ABANDONED: 'Abandoned',
        UNREAD: 'Unread',
    };
    return map[status] || 'Unread';
}

// =========================================================
// STATS, SORTING & RENDERING BOOKS
// =========================================================
function renderStats() {
    const totalBooks = appState.books.length;
    const totalAuthors = appState.authors.length;

    let readCount = 0;
    let readingCount = 0;
    let wantToReadCount = 0;

    appState.books.forEach(book => {
        const status = getEffectiveBookStatus(book);
        if (status === 'READ') readCount += 1;
        else if (status === 'READING') readingCount += 1;
        else if (status === 'WANT_TO_READ') wantToReadCount += 1;
    });

    if (dom.bookCounter) {
        dom.bookCounter.textContent = `(${totalBooks})`;
    }
    if (dom.statTotalBooks) {
        dom.statTotalBooks.textContent = String(totalBooks);
    }
    if (dom.statBooksRead) {
        dom.statBooksRead.textContent = String(readCount);
    }
    if (dom.statBooksReading) {
        dom.statBooksReading.textContent = String(readingCount);
    }
    if (dom.statBooksWantToRead) {
        dom.statBooksWantToRead.textContent = String(wantToReadCount);
    }
    if (dom.statTotalAuthors) {
        dom.statTotalAuthors.textContent = String(totalAuthors);
    }
}

function getSortedBooks() {
    const books = [...appState.books];

    if (appState.sortMode === 'newest') {
        books.sort(
            (a, b) => Number(b.publicationYear ?? -99999) - Number(a.publicationYear ?? -99999)
        );
    } else {
        books.sort((a, b) =>
            (a.title || '').localeCompare(b.title || '', 'en', { sensitivity: 'base' })
        );
    }

    return books;
}

function toggleSortMode() {
    appState.sortMode = appState.sortMode === 'az' ? 'newest' : 'az';
    if (dom.btnSort) {
        dom.btnSort.textContent = appState.sortMode === 'az' ? 'Sort: A-Z' : 'Sort: Newest';
    }
    renderBooks();
}

function renderBooks() {
    if (!dom.bookList) return;

    const books = getSortedBooks();
    if (dom.bookCounter) {
        dom.bookCounter.textContent = `(${books.length})`;
    }

    if (books.length === 0) {
        dom.bookList.innerHTML = `<div class="empty-message">No books found in your collection.</div>`;
        return;
    }

    dom.bookList.innerHTML = books
        .map(book => {
            const status = getEffectiveBookStatus(book);
            const authorNames = getBookAuthorNames(book);
            const themesText = formatBookThemes(book);
            const formattedPubYear = formatYear(book.publicationYear);

            return `
            <article class="book-card" data-id="${book.id}">
                <div>
                    <span class="status-badge ${getStatusClass(status)}">${getStatusLabel(status)}</span>
                    <h3>${book.title}</h3>
                    <p><strong>Author:</strong> ${authorNames}</p>
                    ${formattedPubYear ? `<p><strong>Published:</strong> ${formattedPubYear}</p>` : ''}
                    ${themesText ? `<p><strong>Themes:</strong> ${themesText}</p>` : ''}
                    ${book.priority ? `<p><strong>Priority:</strong> ${book.priority}/5</p>` : ''}
                </div>
                <div class="card-actions">
                    <button type="button" class="btn-readings" data-id="${book.id}">Readings</button>
                    <button type="button" class="btn-edit-book" data-id="${book.id}">Edit</button>
                    <button type="button" class="btn-remove" data-id="${book.id}">Delete</button>
                </div>
            </article>
        `;
        })
        .join('');
}

// =========================================================
// 1. AUTHOR FORM (#form-author) & MANAGEMENT
// =========================================================
function openAuthorModal() {
    if (dom.formAuthor) {
        dom.formAuthor.reset();
        clearFormSelects(dom.formAuthor);
        clearFormErrors(dom.formAuthor);
    }
    if (dom.authorId) dom.authorId.value = '';
    populateCountryDropdown();
    renderAuthorsTable();
    openModal(dom.modalAuthor);
}

function renderAuthorsTable() {
    if (!dom.authorTableBody) return;

    const sortedAuthors = [...appState.authors].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'en', { sensitivity: 'base' })
    );

    if (sortedAuthors.length === 0) {
        dom.authorTableBody.innerHTML = `<tr><td colspan="4" class="empty-message">No authors registered yet.</td></tr>`;
        return;
    }

    dom.authorTableBody.innerHTML = sortedAuthors
        .map(author => {
            const countryName = getAuthorCountryName(author) || '—';
            return `
            <tr>
                <td>${author.id}</td>
                <td>${author.name}</td>
                <td>${countryName}</td>
                <td>
                    <button type="button" class="btn-small-del btn-delete-author" data-id="${author.id}">Delete</button>
                </td>
            </tr>
        `;
        })
        .join('');
}

async function handleAuthorSubmit(event) {
    event.preventDefault();
    clearFormErrors(dom.formAuthor);

    const name = dom.authorName?.value.trim() || '';
    const countryId = dom.authorCountryId?.value ? Number(dom.authorCountryId.value) : null;

    const validationErrors = [];
    if (!name) {
        setFieldError(dom.formAuthor, 'name', 'Author name is required.');
        validationErrors.push('Author name is required.');
    }
    if (!countryId) {
        setFieldError(dom.formAuthor, 'countryId', 'Country is required.');
        validationErrors.push('Country is required.');
    }

    if (validationErrors.length > 0) {
        showNotification(`Validation Error:\n\n• ${validationErrors.join('\n• ')}`, 'error');
        return;
    }

    try {
        await store.addAuthor({ name, countryId });
        await store.getAuthors();
        syncStateFromStore();

        dom.formAuthor.reset();
        clearFormSelects(dom.formAuthor);
        clearFormErrors(dom.formAuthor);
        if (dom.authorId) dom.authorId.value = '';

        populateAuthorDropdown();
        renderAuthorsTable();
        renderStats();
    } catch (error) {
        handleApiError(error, dom.formAuthor, 'Failed to save author.');
    }
}

async function handleDeleteAuthor(authorId) {
    if (!confirm('Are you sure you want to delete this author?')) return;

    try {
        await store.deleteAuthor(authorId);
        syncStateFromStore();

        populateAuthorDropdown();
        renderAuthorsTable();
        renderBooks();
        renderStats();
    } catch (error) {
        if (error?.status === 409) {
            const conflictMessage =
                error.payload?.message ||
                error.message ||
                'Cannot delete this author because there are books linked to them.';
            handleApiError(conflictMessage);
            return;
        }
        handleApiError(
            error,
            'Unable to delete author. Ensure no books are currently linked to this author.'
        );
    }
}

// =========================================================
// 2. BOOK FORM (#form-book) - CREATE & UPDATE
// =========================================================
function openAddBookModal() {
    if (dom.formBook) {
        dom.formBook.reset();
        clearFormSelects(dom.formBook);
        clearFormErrors(dom.formBook);
    }
    if (dom.bookId) dom.bookId.value = '';
    populateAuthorDropdown([]);
    populateThemeDropdown([]);
    if (dom.modalBookHeader) dom.modalBookHeader.textContent = 'Add Book';
    if (dom.btnSaveBook) dom.btnSaveBook.textContent = 'Save Book';
    openModal(dom.modalBook);
}

function openEditBookModal(bookId) {
    const book = appState.books.find(b => Number(b.id) === Number(bookId));
    if (!book) {
        handleApiError('Book not found for editing.');
        return;
    }

    if (dom.formBook) {
        clearFormErrors(dom.formBook);
    }

    const latestReading = getLatestReadingForBook(book.id);

    if (dom.bookId) dom.bookId.value = book.id;
    if (dom.bookTitle) dom.bookTitle.value = book.title || '';
    if (dom.bookYear) dom.bookYear.value = book.publicationYear ?? '';
    if (dom.bookStatus) dom.bookStatus.value = book.status || latestReading?.status || 'UNREAD';
    if (dom.bookYearRead) dom.bookYearRead.value = latestReading?.yearRead ?? '';
    if (dom.bookGrade) dom.bookGrade.value = latestReading?.grade ?? '';
    if (dom.bookPriority) dom.bookPriority.value = book.priority ?? '';

    const bookAuthorIds = extractBookAuthorIds(book);
    const bookThemeIds = extractBookThemeIds(book);
    populateAuthorDropdown(bookAuthorIds);
    populateThemeDropdown(bookThemeIds);

    if (dom.modalBookHeader) dom.modalBookHeader.textContent = 'Edit Book';
    if (dom.btnSaveBook) dom.btnSaveBook.textContent = 'Update Book';
    openModal(dom.modalBook);
}

async function handleBookSubmit(event) {
    event.preventDefault();
    clearFormErrors(dom.formBook);

    const id = dom.bookId?.value.trim() || '';
    const title = dom.bookTitle?.value.trim() || '';
    const publicationYear = dom.bookYear?.value !== '' ? Number(dom.bookYear.value) : null;
    const authorIds = getSelectedNumericIds(dom.bookAuthorsChips);
    const themeIds = getSelectedNumericIds(dom.bookThemesChips);
    const status = dom.bookStatus?.value || null;
    const yearRead = dom.bookYearRead?.value !== '' ? Number(dom.bookYearRead.value) : null;
    const grade = dom.bookGrade?.value !== '' ? Number(dom.bookGrade.value) : null;
    const priority = dom.bookPriority?.value !== '' ? Number(dom.bookPriority.value) : null;

    const validationErrors = [];
    if (!title) {
        setFieldError(dom.formBook, 'title', 'Book title is required.');
        validationErrors.push('Book title is required.');
    }
    if (publicationYear === null || Number.isNaN(publicationYear)) {
        setFieldError(dom.formBook, 'publicationYear', 'Publication year is required.');
        validationErrors.push('Publication year is required.');
    }
    if (authorIds.length === 0) {
        setFieldError(dom.formBook, 'authorIds', 'Please select at least one author.');
        validationErrors.push('Please select at least one author.');
    }
    if (themeIds.length === 0) {
        setFieldError(dom.formBook, 'themeIds', 'Please select at least one theme.');
        validationErrors.push('Please select at least one theme.');
    }
    if (
        yearRead !== null &&
        !Number.isNaN(yearRead) &&
        publicationYear !== null &&
        !Number.isNaN(publicationYear) &&
        yearRead < publicationYear
    ) {
        const yearMsg = `Year read (${formatYear(yearRead)}) cannot be earlier than the publication year (${formatYear(publicationYear)}).`;
        setFieldError(dom.formBook, 'yearRead', yearMsg);
        validationErrors.push(yearMsg);
    }

    if (validationErrors.length > 0) {
        showNotification(`Validation Error:\n\n• ${validationErrors.join('\n• ')}`, 'error');
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
            await store.updateBook(Number(id), bookData);
        } else {
            await store.addBook(bookData);
        }

        await Promise.all([store.getBooks(), store.getReadings()]);
        syncStateFromStore();

        dom.formBook.reset();
        clearFormSelects(dom.formBook);
        clearFormErrors(dom.formBook);
        populateAuthorDropdown([]);
        populateThemeDropdown([]);
        if (dom.bookId) dom.bookId.value = '';
        closeModal(dom.modalBook);

        renderBooks();
        renderStats();
    } catch (error) {
        handleApiError(error, dom.formBook, 'Failed to save book.');
    }
}

async function handleDeleteBook(bookId) {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
        await store.deleteBook(bookId);
        syncStateFromStore();

        renderBooks();
        renderStats();
    } catch (error) {
        handleApiError(error, 'Failed to delete book.');
    }
}

// =========================================================
// 3. READING FORM (#form-reading) & HISTORY
// =========================================================
function openReadingModal(bookId) {
    const book = appState.books.find(b => Number(b.id) === Number(bookId));
    if (dom.modalReadingBookTitle) {
        dom.modalReadingBookTitle.textContent = book ? `Readings: ${book.title}` : 'Book Readings';
    }

    if (dom.formReading) {
        dom.formReading.reset();
        clearFormSelects(dom.formReading);
        clearFormErrors(dom.formReading);
    }
    if (dom.readingId) dom.readingId.value = '';
    if (dom.readingBookId) dom.readingBookId.value = bookId;

    renderBookReadingsHistory(bookId);
    openModal(dom.modalReading);
}

function renderBookReadingsHistory(bookId) {
    if (!dom.modalReadingsList) return;

    const readings = appState.readings.filter(r => {
        const rBookId = r.book?.id ?? r.bookId;
        return Number(rBookId) === Number(bookId);
    });

    if (readings.length === 0) {
        dom.modalReadingsList.innerHTML = `<p class="empty-message">No readings recorded for this book yet.</p>`;
        return;
    }

    dom.modalReadingsList.innerHTML = readings
        .map(reading => {
            const formattedYearRead = formatYear(reading.yearRead);
            return `
            <div class="reading-history-item" data-id="${reading.id}">
                <div class="reading-item-header">
                    <span class="status-pill ${getStatusClass(reading.status)}">${getStatusLabel(reading.status)}</span>
                    <button type="button" class="btn-small-del btn-delete-reading" data-id="${reading.id}" data-book-id="${bookId}">Delete</button>
                </div>
                ${formattedYearRead ? `<p><strong>Year Read:</strong> ${formattedYearRead}</p>` : ''}
                ${reading.grade !== null && reading.grade !== undefined ? `<p><strong>Grade:</strong> ${reading.grade} / 10</p>` : ''}
            </div>
        `;
        })
        .join('');
}

async function handleReadingSubmit(event) {
    event.preventDefault();
    clearFormErrors(dom.formReading);

    const readingId = dom.readingId?.value ? Number(dom.readingId.value) : null;
    const bookId = dom.readingBookId?.value ? Number(dom.readingBookId.value) : null;
    const status = dom.readingStatus?.value || '';
    const yearRead = dom.readingYear?.value !== '' ? Number(dom.readingYear.value) : null;
    const grade = dom.readingGrade?.value !== '' ? Number(dom.readingGrade.value) : null;

    const validationErrors = [];
    if (!bookId) {
        validationErrors.push('Book ID is required.');
    }
    if (!status) {
        setFieldError(dom.formReading, 'status', 'Reading status is required.');
        validationErrors.push('Reading status is required.');
    }

    const book = appState.books.find(b => Number(b.id) === Number(bookId));
    if (
        yearRead !== null &&
        !Number.isNaN(yearRead) &&
        book &&
        book.publicationYear !== null &&
        book.publicationYear !== undefined &&
        yearRead < Number(book.publicationYear)
    ) {
        const yearErrorMessage = `Year read (${formatYear(yearRead)}) must be greater than or equal to the book's publication year (${formatYear(book.publicationYear)}).`;
        setFieldError(dom.formReading, 'yearRead', yearErrorMessage);
        validationErrors.push(yearErrorMessage);
    }

    if (validationErrors.length > 0) {
        showNotification(`Validation Error:\n\n• ${validationErrors.join('\n• ')}`, 'error');
        return;
    }

    const readingData = {
        ...(readingId ? { id: readingId } : {}),
        bookId,
        status,
        yearRead,
        grade,
    };

    try {
        await store.saveReading(readingData);
        await Promise.all([store.getBooks(), store.getReadings()]);
        syncStateFromStore();

        dom.formReading.reset();
        clearFormSelects(dom.formReading);
        clearFormErrors(dom.formReading);
        if (dom.readingId) dom.readingId.value = '';
        if (dom.readingBookId) dom.readingBookId.value = bookId;

        renderBookReadingsHistory(bookId);
        renderBooks();
        renderStats();
    } catch (error) {
        handleApiError(error, dom.formReading, 'Failed to save reading record.');
    }
}

async function handleDeleteReading(readingId, bookId) {
    if (!confirm('Are you sure you want to delete this reading record?')) return;

    try {
        await store.deleteReading(readingId);
        await Promise.all([store.getBooks(), store.getReadings()]);
        syncStateFromStore();

        renderBooks();
        renderStats();
        if (bookId && dom.modalReading?.classList.contains('active')) {
            renderBookReadingsHistory(bookId);
        }
    } catch (error) {
        handleApiError(error, 'Failed to delete reading record.');
    }
}

// =========================================================
// 4. RESET DATA (#btn-reset)
// =========================================================
async function handleReset() {
    if (!confirm('Are you sure you want to reset all data to the original seed state?')) {
        return;
    }

    try {
        await store.resetData();
        syncStateFromStore();

        appState.sortMode = 'az';
        if (dom.btnSort) {
            dom.btnSort.textContent = 'Sort: A-Z';
        }

        populateCountryDropdown();
        populateAuthorDropdown();
        populateThemeDropdown();
        renderBooks();
        renderStats();
        renderAuthorsTable();

        showNotification('Database successfully reset to original seed data!', 'success');
    } catch (error) {
        handleApiError(error, 'Failed to reset database to original seed data.');
    }
}

// =========================================================
// EVENT LISTENERS
// =========================================================
function bindEvents() {
    // Top Bar Buttons
    dom.btnAddBook?.addEventListener('click', openAddBookModal);
    dom.btnManageAuthors?.addEventListener('click', openAuthorModal);
    dom.btnSort?.addEventListener('click', toggleSortMode);
    dom.btnReset?.addEventListener('click', handleReset);

    // Forms
    dom.formAuthor?.addEventListener('submit', handleAuthorSubmit);
    dom.formBook?.addEventListener('submit', handleBookSubmit);
    dom.formReading?.addEventListener('submit', handleReadingSubmit);

    // Tag Chips Visual Toggle (Event Delegation)
    const setupChipToggle = container => {
        container?.addEventListener('change', e => {
            if (e.target.matches('input[type="checkbox"]')) {
                const pill = e.target.closest('.chip-pill');
                if (pill) {
                    pill.classList.toggle('selected', e.target.checked);
                }
            }
        });
    };
    setupChipToggle(dom.bookAuthorsChips);
    setupChipToggle(dom.bookThemesChips);

    // Cancel Buttons inside Modals
    dom.btnCancelAuthorEdit?.addEventListener('click', () => {
        dom.formAuthor?.reset();
        clearFormSelects(dom.formAuthor);
        clearFormErrors(dom.formAuthor);
        if (dom.authorId) dom.authorId.value = '';
        closeModal(dom.modalAuthor);
    });

    dom.btnCancelReadingEdit?.addEventListener('click', () => {
        dom.formReading?.reset();
        clearFormSelects(dom.formReading);
        clearFormErrors(dom.formReading);
        if (dom.readingId) dom.readingId.value = '';
        closeModal(dom.modalReading);
    });

    // Book Card Actions (Event Delegation)
    dom.bookList?.addEventListener('click', event => {
        const readingsBtn = event.target.closest('.btn-readings');
        if (readingsBtn) {
            openReadingModal(readingsBtn.dataset.id);
            return;
        }

        const editBtn = event.target.closest('.btn-edit-book');
        if (editBtn) {
            openEditBookModal(editBtn.dataset.id);
            return;
        }

        const removeBtn = event.target.closest('.btn-remove');
        if (removeBtn) {
            handleDeleteBook(removeBtn.dataset.id);
        }
    });

    // Reading History Delete Action
    dom.modalReadingsList?.addEventListener('click', event => {
        const deleteBtn = event.target.closest('.btn-delete-reading');
        if (deleteBtn) {
            handleDeleteReading(deleteBtn.dataset.id, deleteBtn.dataset.bookId);
        }
    });

    // Author Table Delete Action
    dom.authorTableBody?.addEventListener('click', event => {
        const deleteBtn = event.target.closest('.btn-delete-author');
        if (deleteBtn) {
            handleDeleteAuthor(deleteBtn.dataset.id);
        }
    });

    // Close Modals via Close Buttons
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('dialog, .custom-modal');
            const form = modal?.querySelector('form');
            if (form) clearFormErrors(form);
            closeModal(modal);
        });
    });
}

// =========================================================
// BOOTSTRAP
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    init();
});