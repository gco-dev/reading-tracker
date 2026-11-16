// js/app.js
import {
    initializeStore, resetData,
    getAuthors, getBooks, getReadings, getReadingsByBookId, getReadingById, getThemes,
    saveAuthor, updateAuthor, deleteAuthor, saveTheme,
    saveBook, updateBook, deleteBook,
    saveReading, updateReading, updateReadingStatus, deleteReading
} from './store.js';

import {
    validateAuthor, validateBook, validateReading
} from './validation.js';

let currentSort = 'recent'; // Para a grid de livros principal
let logSortCol = 'yearRead'; // FR-05: Ordenação padrão do Reading Log
let logSortDir = 'desc';     // FR-05: Direção padrão do Reading Log

// =========================================================
// 1. APPLICATION INITIALIZATION
// =========================================================
document.addEventListener('DOMContentLoaded', async () => {
    await initializeStore();
    await refreshUI();
    setupEventListeners();
});

async function refreshUI() {
    await populateAuthorDropdown();
    await renderBooks();
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

// =========================================================
// UI HELPERS & WORKFLOW (FR-04 / FR-06)
// =========================================================
function showFormErrors(formEl, errors) {
    clearFormErrors(formEl);
    Object.entries(errors).forEach(([field, message]) => {
        const errorSpan = formEl.querySelector(`[data-error-for="${field}"]`);
        const inputEl = formEl.querySelector(`[name="${field}"]`);
        if (errorSpan) errorSpan.textContent = message;
        if (inputEl) inputEl.classList.add('is-invalid');
    });
}

function clearFormErrors(formEl) {
    formEl.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    formEl.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

function attachReadingWorkflowBehavior(form) {
    const statusSelect = form.querySelector('[name="status"]');
    const yearInput = form.querySelector('[name="yearRead"]');
    const gradeInput = form.querySelector('[name="grade"]');
    const prioritySelect = form.querySelector('[name="priority"]');

    function applyFieldState(status) {
        const allowsYearAndGrade = status === 'Read' || status === 'Abandoned';
        const allowsPriority = status === 'Want to read';
        if (yearInput) yearInput.disabled = !allowsYearAndGrade;
        if (gradeInput) gradeInput.disabled = !allowsYearAndGrade;
        if (prioritySelect) prioritySelect.disabled = !allowsPriority;
    }

    let currentStatus = statusSelect.value;
    applyFieldState(currentStatus);

    statusSelect.addEventListener('change', () => {
        const nextStatus = statusSelect.value;
        const nextAllowsYearAndGrade = nextStatus === 'Read' || nextStatus === 'Abandoned';
        const hasYearOrGrade = yearInput && gradeInput && (yearInput.value.trim() !== '' || gradeInput.value.trim() !== '');

        // FR-04: Confirmação de perda de dados ao mudar status
        if (!nextAllowsYearAndGrade && hasYearOrGrade) {
            const ok = window.confirm(`Moving to "${nextStatus}" does not allow a Year Read or Grade. Clear those values?`);
            if (!ok) {
                statusSelect.value = currentStatus; // Reverte UI
                return;
            }
            yearInput.value = '';
            gradeInput.value = '';
        }

        if (currentStatus === 'Want to read' && nextStatus !== 'Want to read' && prioritySelect) {
            prioritySelect.value = '';
        }

        currentStatus = nextStatus;
        applyFieldState(nextStatus);
    });
}

// =========================================================
// 2. MAIN UI RENDERING (BOOKS GRID)
// =========================================================
async function populateAuthorDropdown() {
    const authors = await getAuthors();
    const dropdown = document.getElementById('new-author');

    const sortedAuthors = [...authors].sort((a, b) => a.name.localeCompare(b.name));
    const optionsHTML = sortedAuthors
        .map(author => `<option value="${author.id}">${escapeHTML(author.name)}</option>`)
        .join('');

    dropdown.innerHTML = `<option value="">Select Existing Author...</option>${optionsHTML}`;
}

async function renderBooks() {
    const books = await getBooks();
    const authors = await getAuthors();
    const readings = await getReadings();
    const bookListEl = document.getElementById('book-list');
    const counterEl = document.getElementById('book-counter');

    if (books.length === 0) {
        bookListEl.innerHTML = '<p class="empty-message">No books registered in the collection yet.</p>';
        counterEl.textContent = '(0 books)';
        return;
    }

    const booksToDisplay = [...books];
    counterEl.textContent = `(${booksToDisplay.length} books)`;

    if (currentSort === 'title') {
        booksToDisplay.sort((a, b) => a.title.localeCompare(b.title));
    } else {
        booksToDisplay.sort((a, b) => b.id - a.id);
    }

    bookListEl.innerHTML = booksToDisplay.map(book => {
        let authorNames = 'Unknown Author';
        if (book.authorIds && book.authorIds.length > 0) {
            const matched = book.authorIds.map(id => authors.find(a => a.id === id)?.name).filter(Boolean);
            if (matched.length > 0) authorNames = matched.join(', ');
        }

        const yearDisplay = book.publicationYear !== null && book.publicationYear !== undefined
            ? (book.publicationYear < 0 ? `${Math.abs(book.publicationYear)} BC` : book.publicationYear)
            : 'Not informed';

        const bookReadings = readings.filter(r => r.bookId === book.id);
        const latestReading = bookReadings[bookReadings.length - 1];

        const currentStatus = latestReading ? latestReading.status : 'Want to read';
        const statusClass = currentStatus.toLowerCase().replace(/\s+/g, '-');
        const statuses = ['Want to read', 'Reading', 'Paused', 'Read', 'Abandoned'];

        const statusSelectHTML = latestReading
            ? `<select class="status-badge status-${statusClass}" data-reading-id="${latestReading.id}" aria-label="Reading status">
                 ${statuses.map(s => `<option value="${s}" ${s === currentStatus ? 'selected' : ''}>${s}</option>`).join('')}
               </select>`
            : `<span class="status-badge status-unknown">No Reading</span>`;

        const extraReadingDetails = [];
        if (latestReading?.yearRead) extraReadingDetails.push(`<p><strong>Year Read:</strong> ${latestReading.yearRead}</p>`);
        if (latestReading?.grade !== null && latestReading?.grade !== undefined) extraReadingDetails.push(`<p><strong>Grade:</strong> ${latestReading.grade}/10</p>`);

        return `
            <div class="book-card">
                <div>
                    ${statusSelectHTML}
                    <h3>${escapeHTML(book.title)}</h3>
                    <p><strong>Author:</strong> ${escapeHTML(authorNames)}</p>
                    <p><strong>Published:</strong> ${yearDisplay}</p>
                    ${extraReadingDetails.join('')}
                </div>
                <div class="card-actions">
                    <button type="button" class="btn-readings" data-book-id="${book.id}">Readings (${bookReadings.length})</button>
                    <button type="button" class="btn-edit-book" data-book-id="${book.id}">Edit</button>
                    <button type="button" class="btn-remove" data-book-id="${book.id}">Remove</button>
                </div>
            </div>
        `;
    }).join('');
}

// =========================================================
// 3. MODALS RENDERING LOGIC
// =========================================================

// --- A. Reading History Modal (FR-03) ---
async function openReadingModal(bookId) {
    const books = await getBooks();
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const modal = document.getElementById('reading-modal');
    document.getElementById('modal-book-title').textContent = `Readings: ${book.title}`;
    
    resetModalForm(book.id);
    await renderModalReadings(book.id);
    modal.showModal();
}

function resetModalForm(bookId) {
    const modalForm = document.getElementById('form-modal-reading');
    modalForm.reset();
    clearFormErrors(modalForm);
    
    document.getElementById('modal-book-id').value = bookId;
    document.getElementById('modal-reading-id').value = '';
    document.getElementById('modal-form-title').textContent = 'Log New Reading / Re-read';
    document.getElementById('btn-save-modal-reading').textContent = 'Add Reading';
    document.getElementById('btn-cancel-edit').style.display = 'none';

    modalForm.querySelector('[name="status"]').dispatchEvent(new Event('change'));
}

async function renderModalReadings(bookId) {
    const bookReadings = await getReadingsByBookId(bookId);
    const historyListEl = document.getElementById('modal-readings-list');

    if (bookReadings.length === 0) {
        historyListEl.innerHTML = '<p class="empty-message">No readings logged for this book yet.</p>';
        return;
    }

    historyListEl.innerHTML = bookReadings.map((reading, index) => {
        const statusClass = reading.status.toLowerCase().replace(/\s+/g, '-');
        const details = [];

        if (reading.yearRead) details.push(`<p><strong>Year Read:</strong> ${reading.yearRead}</p>`);
        if (reading.grade !== null && reading.grade !== undefined) details.push(`<p><strong>Grade:</strong> ${reading.grade}/10</p>`);
        if (reading.priority) details.push(`<p><strong>Priority:</strong> ${escapeHTML(reading.priority)}</p>`);

        return `
            <div class="reading-history-item">
                <div class="reading-item-header">
                    <span>
                        <strong>#${index + 1}</strong>  
                        <span class="status-pill status-${statusClass}">${escapeHTML(reading.status)}</span>
                    </span>
                    <div>
                        <button type="button" class="btn-small-edit btn-edit-reading" data-reading-id="${reading.id}">Edit</button>
                        <button type="button" class="btn-small-del btn-delete-reading" data-reading-id="${reading.id}">Delete</button>
                    </div>
                </div>
                ${details.join('')}
            </div>
        `;
    }).join('');
}

// --- B. Author Management Modal (FR-01) ---
async function openAuthorModal() {
    const modal = document.getElementById('author-manager-modal');
    await renderAuthorTable();
    modal.showModal();
}

async function renderAuthorTable() {
    const authors = await getAuthors();
    const tbody = document.querySelector('#author-table tbody');
    tbody.innerHTML = authors.map(a => `
        <tr>
            <td>${a.id}</td>
            <td>${escapeHTML(a.name)}</td>
            <td>
                <button type="button" class="btn-small-edit" data-edit-author="${a.id}">Edit</button>
                <button type="button" class="btn-small-del" data-del-author="${a.id}">Del</button>
            </td>
        </tr>
    `).join('');
}

// --- C. Reading Log Table Modal (FR-05) ---
async function openReadingLog() {
    const modal = document.getElementById('reading-log-modal');
    await renderReadingLogTable();
    modal.showModal();
}

async function renderReadingLogTable() {
    const readings = await getReadings();
    const books = await getBooks();
    const authors = await getAuthors();
    const tbody = document.querySelector('#log-table tbody');

    let logData = readings.map(r => {
        const book = books.find(b => b.id === r.bookId) || {};
        const authorNames = (book.authorIds || []).map(id => authors.find(a => a.id === id)?.name).filter(Boolean).join(', ') || '-';
        return {
            id: r.id,
            title: book.title || 'Unknown',
            authors: authorNames,
            status: r.status,
            yearRead: r.yearRead,
            grade: r.grade
        };
    });

    // Ordenação dinâmica ao clicar no cabeçalho
    logData.sort((a, b) => {
        let valA = a[logSortCol]; let valB = b[logSortCol];
        if (valA === valB) return a.id - b.id;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (valA < valB) return logSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return logSortDir === 'asc' ? 1 : -1;
        return 0;
    });

    tbody.innerHTML = logData.map(d => `
        <tr>
            <td>${escapeHTML(d.title)}</td>
            <td>${escapeHTML(d.authors)}</td>
            <td>${escapeHTML(d.status)}</td>
            <td>${d.yearRead || '-'}</td>
            <td>${d.grade || '-'}</td>
        </tr>
    `).join('');
}

// --- D. Book Edit Modal (FR-02) ---
async function openBookEditModal(bookId) {
    const books = await getBooks();
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const form = document.getElementById('form-edit-book');
    form.elements['bookId'].value = book.id;
    form.elements['title'].value = book.title;
    form.elements['publicationYear'].value = book.publicationYear || '';
    form.elements['form'].value = book.form || '';
    
    document.getElementById('book-edit-modal').showModal();
}

// =========================================================
// 4. EVENT LISTENERS
// =========================================================
function setupEventListeners() {
    const formNewBook = document.getElementById('form-new-book');
    const modalReadingForm = document.getElementById('form-modal-reading');
    
    attachReadingWorkflowBehavior(formNewBook);
    attachReadingWorkflowBehavior(modalReadingForm);

    // --- Header Actions ---
    document.getElementById('btn-manage-authors').addEventListener('click', openAuthorModal);
    document.getElementById('btn-view-log').addEventListener('click', openReadingLog);
    
    // --- Grid Controls ---
    document.getElementById('btn-sort').addEventListener('click', () => {
        currentSort = currentSort === 'recent' ? 'title' : 'recent';
        document.getElementById('btn-sort').textContent = currentSort === 'recent' ? 'Sort: Newest First' : 'Sort: A-Z';
        renderBooks();
    });

    document.getElementById('btn-reset').addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset all data back to seed.json?')) {
            await resetData();
            await refreshUI();
        }
    });

    // --- Modal Closers ---
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => e.target.closest('dialog').close());
    });

    // --- Author Management Form (FR-01) ---
    const authorForm = document.getElementById('form-manage-author');
    if (authorForm) {
        authorForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = authorForm.elements['authorId'].value;
            const name = authorForm.elements['authorName'].value;
            
            const val = await validateAuthor({ name });
            if (!val.valid) { showFormErrors(authorForm, val.errors); return; }
            
            if (id) await updateAuthor(id, { name });
            else await saveAuthor({ name });
            
            authorForm.reset();
            authorForm.elements['authorId'].value = '';
            document.getElementById('btn-cancel-author-edit').style.display = 'none';
            await renderAuthorTable();
            await refreshUI();
        });

        document.getElementById('btn-cancel-author-edit').addEventListener('click', () => {
            authorForm.reset();
            authorForm.elements['authorId'].value = '';
            document.getElementById('btn-cancel-author-edit').style.display = 'none';
            clearFormErrors(authorForm);
        });

        document.querySelector('#author-table').addEventListener('click', async (e) => {
            if (e.target.matches('.btn-small-edit')) {
                const id = parseInt(e.target.dataset.editAuthor, 10);
                const authors = await getAuthors();
                const author = authors.find(a => a.id === id);
                if (author) {
                    authorForm.elements['authorId'].value = author.id;
                    authorForm.elements['authorName'].value = author.name;
                    document.getElementById('btn-cancel-author-edit').style.display = 'inline-block';
                    clearFormErrors(authorForm);
                }
            }
            if (e.target.matches('.btn-small-del')) {
                const id = parseInt(e.target.dataset.delAuthor, 10);
                const books = await getBooks();
                const linkedBooks = books.filter(b => b.authorIds && b.authorIds.includes(id));
                
                if (linkedBooks.length > 0) {
                    const titles = linkedBooks.map(b => b.title).join(', ');
                    alert(`Cannot delete. Author is linked to ${linkedBooks.length} books:\n${titles}`);
                    return;
                }
                
                if (confirm("Are you sure you want to delete this author?")) {
                    await deleteAuthor(id);
                    await renderAuthorTable();
                    await refreshUI();
                }
            }
        });
    }

    // --- Reading Log Sorting (FR-05) ---
    document.querySelectorAll('#log-table th[data-sort]').forEach(th => {
        th.addEventListener('click', async () => {
            const col = th.dataset.sort;
            if (logSortCol === col) logSortDir = logSortDir === 'asc' ? 'desc' : 'asc';
            else { logSortCol = col; logSortDir = 'asc'; }
            await renderReadingLogTable();
        });
    });

    // --- Book Edit Form (FR-02) ---
    document.getElementById('form-edit-book').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const id = form.elements['bookId'].value;
        const draft = {
            title: form.elements['title'].value.trim(),
            publicationYear: form.elements['publicationYear'].value ? parseInt(form.elements['publicationYear'].value) : null,
            form: form.elements['form'].value || null
        };
        
        const val = validateBook(draft);
        if (!val.valid) { showFormErrors(form, val.errors); return; }
        
        await updateBook(id, draft);
        document.getElementById('book-edit-modal').close();
        await renderBooks();
    });

    // --- MAIN FORM: Add Book + Themes + Reading ---
    formNewBook.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearFormErrors(formNewBook);

        const title = formNewBook.elements['title'].value.trim();
        const yearRaw = formNewBook.elements['publicationYear'].value.trim();
        const selectedAuthorId = formNewBook.elements['authorId'].value;
        const typedAuthorName = formNewBook.elements['typedAuthor'].value.trim();
        const formValue = formNewBook.elements['form'].value;
        
        // Trata os Temas (Separados por vírgula)
        const themeStr = formNewBook.elements['themes'].value.trim();
        let themeIds = [];
        if (themeStr) {
            const themeNames = themeStr.split(',').map(t => t.trim()).filter(Boolean);
            const existingThemes = await getThemes();
            for (let name of themeNames) {
                let found = existingThemes.find(t => t.name.toLowerCase() === name.toLowerCase());
                if (!found) found = await saveTheme(name);
                themeIds.push(found.id);
            }
        }

        const status = formNewBook.status.value;
        const yearReadRaw = formNewBook.yearRead.disabled ? '' : formNewBook.yearRead.value.trim();
        const gradeRaw = formNewBook.grade.disabled ? '' : formNewBook.grade.value.trim();
        const priority = formNewBook.priority.disabled ? '' : formNewBook.priority.value;

        let authorIds = [];
        let newAuthorToSave = null;
        let authorErrors = {};

        if (typedAuthorName) {
            const existingAuthors = await getAuthors();
            const alreadyExists = existingAuthors.find(a => a.name.trim().toLowerCase() === typedAuthorName.toLowerCase());
            if (alreadyExists) authorIds = [alreadyExists.id];
            else {
                const authorCheck = await validateAuthor({ name: typedAuthorName });
                if (!authorCheck.valid) authorErrors = authorCheck.errors;
                else newAuthorToSave = { name: typedAuthorName };
            }
        } else if (selectedAuthorId) {
            authorIds = [parseInt(selectedAuthorId, 10)];
        }

        const bookDraft = {
            title,
            publicationYear: yearRaw !== '' ? parseInt(yearRaw, 10) : null,
            authorIds: newAuthorToSave ? ['PENDING'] : authorIds,
            form: formValue || null,
            themeIds
        };

        const readingDraft = {
            status,
            yearRead: yearReadRaw !== '' ? parseInt(yearReadRaw, 10) : null,
            grade: gradeRaw !== '' ? parseFloat(gradeRaw) : null,
            priority: priority || null
        };

        const bookValidation = validateBook(bookDraft);
        const readingValidation = validateReading(readingDraft, bookDraft, false);
        const allErrors = { ...authorErrors, ...bookValidation.errors, ...readingValidation.errors };

        if (Object.keys(allErrors).length > 0) {
            showFormErrors(formNewBook, allErrors);
            return;
        }

        if (newAuthorToSave) {
            const savedAuthor = await saveAuthor(newAuthorToSave);
            bookDraft.authorIds = [savedAuthor.id];
        }

        const savedBook = await saveBook(bookDraft);
        readingDraft.bookId = savedBook.id;
        await saveReading(readingDraft);

        formNewBook.reset();
        formNewBook.querySelector('[name="status"]').dispatchEvent(new Event('change'));
        await refreshUI();
    });

    // --- Book Grid Actions ---
    const bookListEl = document.getElementById('book-list');
    
    bookListEl.addEventListener('change', async (event) => {
        if (event.target.matches('.status-badge')) {
            const readingId = parseInt(event.target.dataset.readingId, 10);
            const newStatus = event.target.value;
            const reading = await getReadingById(readingId);

            const nextAllowsYearAndGrade = newStatus === 'Read' || newStatus === 'Abandoned';
            const hasYearOrGrade = reading.yearRead !== null || reading.grade !== null;

            if (!nextAllowsYearAndGrade && hasYearOrGrade) {
                const ok = window.confirm(`Moving to "${newStatus}" does not allow a Year Read or Grade. Clear those values?`);
                if (!ok) {
                    event.target.value = reading.status; 
                    return;
                }
            }

            await updateReadingStatus(readingId, newStatus);
            await renderBooks();
        }
    });

    bookListEl.addEventListener('click', async (event) => {
        if (event.target.matches('.btn-readings')) {
            const bookId = parseInt(event.target.dataset.bookId, 10);
            await openReadingModal(bookId);
        }

        if (event.target.matches('.btn-edit-book')) {
            const bookId = parseInt(event.target.dataset.bookId, 10);
            await openBookEditModal(bookId);
        }

        if (event.target.matches('.btn-remove')) {
            const bookId = parseInt(event.target.dataset.bookId, 10);
            const books = await getBooks();
            const book = books.find(b => b.id === bookId);
            const readingsCount = (await getReadingsByBookId(bookId)).length;
            const readingLabel = readingsCount === 1 ? '1 reading' : `${readingsCount} readings`;

            // FR-04: Confirmation Alert Cascading Warning
            if (confirm(`Are you sure you want to delete "${book?.title}"? This will also delete ${readingLabel}.`)) {
                await deleteBook(bookId);
                await renderBooks();
            }
        }
    });

    // --- Reading History Modal Form ---
    modalReadingForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearFormErrors(modalReadingForm);

        const bookId = parseInt(document.getElementById('modal-book-id').value, 10);
        const editReadingId = document.getElementById('modal-reading-id').value;
        const isEdit = editReadingId !== '';

        const status = modalReadingForm.status.value;
        const yearReadRaw = modalReadingForm.yearRead.disabled ? '' : modalReadingForm.yearRead.value.trim();
        const gradeRaw = modalReadingForm.grade.disabled ? '' : modalReadingForm.grade.value.trim();
        const priority = modalReadingForm.priority.disabled ? '' : modalReadingForm.priority.value;

        const readingDraft = {
            bookId,
            status,
            yearRead: yearReadRaw !== '' ? parseInt(yearReadRaw, 10) : null,
            grade: gradeRaw !== '' ? parseFloat(gradeRaw) : null,
            priority: priority || null
        };

        const books = await getBooks();
        const book = books.find(b => b.id === bookId);

        const validation = validateReading(readingDraft, book, true);
        if (!validation.valid) {
            showFormErrors(modalReadingForm, validation.errors);
            return;
        }

        if (isEdit) {
            await updateReading(editReadingId, readingDraft);
        } else {
            await saveReading(readingDraft);
        }

        resetModalForm(bookId);
        await renderModalReadings(bookId);
        await renderBooks();
    });

    document.getElementById('btn-cancel-edit').addEventListener('click', () => {
        const bookId = document.getElementById('modal-book-id').value;
        resetModalForm(bookId);
    });

    document.getElementById('modal-readings-list').addEventListener('click', async (event) => {
        if (event.target.matches('.btn-delete-reading')) {
            const readingId = parseInt(event.target.dataset.readingId, 10);
            const bookId = parseInt(document.getElementById('modal-book-id').value, 10);
            await deleteReading(readingId);
            await renderModalReadings(bookId);
            await renderBooks();
        }

        if (event.target.matches('.btn-edit-reading')) {
            const readingId = parseInt(event.target.dataset.readingId, 10);
            const reading = await getReadingById(readingId);
            if (!reading) return;

            document.getElementById('modal-form-title').textContent = `Edit Reading #${reading.id}`;
            document.getElementById('modal-reading-id').value = reading.id;
            document.getElementById('btn-save-modal-reading').textContent = 'Save Changes';
            document.getElementById('btn-cancel-edit').style.display = 'inline-block';

            modalReadingForm.status.value = reading.status;
            modalReadingForm.status.dispatchEvent(new Event('change')); 

            if (!modalReadingForm.yearRead.disabled) modalReadingForm.yearRead.value = reading.yearRead || '';
            if (!modalReadingForm.grade.disabled) modalReadingForm.grade.value = reading.grade || '';
            if (!modalReadingForm.priority.disabled) modalReadingForm.priority.value = reading.priority || '';
            
            clearFormErrors(modalReadingForm);
        }
    });
}