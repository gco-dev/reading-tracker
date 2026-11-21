// js/app.js
import {
    initializeStore, resetData,
    getAuthors, getBooks, getReadings, getReadingsByBookId, getReadingById, getThemes,
    saveAuthor, updateAuthor, deleteAuthor, saveTheme,
    saveBook, updateBook, deleteBook,
    saveReading, updateReading, updateReadingStatus, deleteReading
} from './store.js';
import { validateAuthor, validateBook, validateReading } from './validation.js';

let currentSort = 'recent';
let logSortCol = 'yearRead';
let logSortDir = 'desc';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeStore();
        await refreshUI();
        setupEventListeners();
    } catch (e) { console.error("Initialization Error:", e); }
});

async function refreshUI() {
    await Promise.all([populateAuthorDropdown(), renderBooks()]);
}

const escapeHTML = (str) => {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
};

// =========================================================
// UI HELPERS
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
    if (!statusSelect) return;

    const applyFieldState = (status) => {
        const allowsYandG = status === 'Read' || status === 'Abandoned';
        if (yearInput) yearInput.disabled = !allowsYandG;
        if (gradeInput) gradeInput.disabled = !allowsYandG;
        if (prioritySelect) prioritySelect.disabled = status !== 'Want to read';
    };

    let currentStatus = statusSelect.value;
    applyFieldState(currentStatus);

    statusSelect.addEventListener('change', () => {
        const nextStatus = statusSelect.value;
        const allowsYandG = nextStatus === 'Read' || nextStatus === 'Abandoned';
        const hasData = yearInput?.value || gradeInput?.value;

        if (!allowsYandG && hasData) {
            if (!confirm(`Moving to "${nextStatus}" clears Year Read and Grade. Proceed?`)) {
                statusSelect.value = currentStatus;
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
// RENDERING
// =========================================================
async function populateAuthorDropdown() {
    const authors = await getAuthors();
    const dropdown = document.getElementById('new-author');
    if (!dropdown) return;
    const sorted = [...authors].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    dropdown.innerHTML = `<option value="">Select Existing Author...</option>${sorted.map(a => `<option value="${a.id}">${escapeHTML(a.name)}</option>`).join('')}`;
}

async function renderBooks() {
    const [books, authors, themes, readings] = await Promise.all([
        getBooks(), getAuthors(), getThemes(), getReadings()
    ]);
    
    const bookListEl = document.getElementById('book-list');
    const counterEl = document.getElementById('book-counter');
    if (!bookListEl) return;

    if (!books.length) {
        bookListEl.innerHTML = '<p class="empty-message">No books registered yet.</p>';
        if (counterEl) counterEl.textContent = '(0 books)';
        return;
    }

    const displayBooks = [...books].sort((a, b) => currentSort === 'title' ? (a.title || '').localeCompare(b.title || '') : b.id - a.id);
    if (counterEl) counterEl.textContent = `(${displayBooks.length} books)`;

    bookListEl.innerHTML = displayBooks.map(book => {
        const authorNames = book.authorIds?.map(id => authors.find(a => a.id === id)?.name).filter(Boolean).join(', ') || 'Unknown Author';
        const themeNames = book.themeIds?.map(id => themes.find(t => t.id === id)?.name).filter(Boolean).join(', ');
        const yearDisplay = book.publicationYear ? (book.publicationYear < 0 ? `${Math.abs(book.publicationYear)} BC` : book.publicationYear) : 'Not informed';

        const bookReadings = readings.filter(r => r.bookId === book.id);
        const latest = bookReadings[bookReadings.length - 1];
        const status = latest?.status || 'Want to read';
        
        const statusHTML = latest 
            ? `<select class="status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}" data-reading-id="${latest.id}">
                 ${['Want to read', 'Reading', 'Paused', 'Read', 'Abandoned'].map(s => `<option value="${s}" ${s === status ? 'selected' : ''}>${s}</option>`).join('')}
               </select>`
            : `<span class="status-badge status-unknown">No Reading</span>`;

        return `
            <div class="book-card">
                <div>
                    ${statusHTML}
                    <h3>${escapeHTML(book.title)}</h3>
                    <p><strong>Author:</strong> ${escapeHTML(authorNames)}</p>
                    <p><strong>Published:</strong> ${yearDisplay}</p>
                    ${themeNames ? `<p><strong>Themes:</strong> ${escapeHTML(themeNames)}</p>` : ''}
                    ${latest?.yearRead ? `<p><strong>Year Read:</strong> ${latest.yearRead}</p>` : ''}
                    ${latest?.grade ? `<p><strong>Grade:</strong> ${latest.grade}/10</p>` : ''}
                </div>
                <div class="card-actions">
                    <button type="button" class="btn-readings" data-book-id="${book.id}">Readings (${bookReadings.length})</button>
                    <button type="button" class="btn-edit-book" data-book-id="${book.id}">Edit</button>
                    <button type="button" class="btn-remove" data-book-id="${book.id}">Remove</button>
                </div>
            </div>`;
    }).join('');
}

// =========================================================
// MODALS
// =========================================================
async function processThemesInput(themeStr) {
    if (!themeStr) return [];
    const themeNames = themeStr.split(',').map(t => t.trim()).filter(Boolean);
    const existingThemes = await getThemes();
    const themeIds = [];
    for (let name of themeNames) {
        let found = existingThemes.find(t => t.name.toLowerCase() === name.toLowerCase());
        if (!found) found = await saveTheme(name);
        themeIds.push(found.id);
    }
    return themeIds;
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
    
    if (!bookReadings.length) {
        historyListEl.innerHTML = '<p class="empty-message">No readings logged yet.</p>';
        return;
    }
    historyListEl.innerHTML = bookReadings.map((r, i) => `
        <div class="reading-history-item">
            <div class="reading-item-header">
                <span><strong>#${i + 1}</strong> <span class="status-pill status-${r.status.toLowerCase().replace(/\s+/g, '-')}">${escapeHTML(r.status)}</span></span>
                <div>
                    <button type="button" class="btn-small-edit btn-edit-reading" data-reading-id="${r.id}">Edit</button>
                    <button type="button" class="btn-small-del btn-delete-reading" data-reading-id="${r.id}">Del</button>
                </div>
            </div>
            ${r.yearRead ? `<p><strong>Year Read:</strong> ${r.yearRead}</p>` : ''}
            ${r.grade ? `<p><strong>Grade:</strong> ${r.grade}/10</p>` : ''}
            ${r.priority ? `<p><strong>Priority:</strong> ${escapeHTML(r.priority)}</p>` : ''}
            ${r.recommendedBy ? `<p><strong>Rec. by:</strong> ${escapeHTML(r.recommendedBy)}</p>` : ''}
            ${r.notes ? `<p><strong>Notes:</strong> ${escapeHTML(r.notes)}</p>` : ''}
        </div>`).join('');
}

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

async function renderAuthorTable() {
    const authors = await getAuthors();
    const sorted = [...authors].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    document.querySelector('#author-table tbody').innerHTML = sorted.map(a => `
        <tr>
            <td>${a.id}</td>
            <td>${escapeHTML(a.name)}</td>
            <td>
                <button type="button" class="btn-small-edit" data-edit-author="${a.id}">Edit</button>
                <button type="button" class="btn-small-del" data-del-author="${a.id}">Del</button>
            </td>
        </tr>`).join('');
}

async function renderReadingLogTable() {
    const [readings, books, authors] = await Promise.all([getReadings(), getBooks(), getAuthors()]);
    
    let logData = readings.map(r => {
        const book = books.find(b => b.id === r.bookId) || {};
        return {
            id: r.id, title: book.title || 'Unknown', status: r.status, yearRead: r.yearRead, grade: r.grade,
            authors: book.authorIds?.map(id => authors.find(a => a.id === id)?.name).filter(Boolean).join(', ') || '-'
        };
    });

    logData.sort((a, b) => {
        if (a[logSortCol] === b[logSortCol]) return a.id - b.id;
        if (a[logSortCol] == null) return 1;
        if (b[logSortCol] == null) return -1;
        return a[logSortCol] < b[logSortCol] ? (logSortDir === 'asc' ? -1 : 1) : (logSortDir === 'asc' ? 1 : -1);
    });

    document.querySelector('#log-table tbody').innerHTML = logData.map(d => `
        <tr><td>${escapeHTML(d.title)}</td><td>${escapeHTML(d.authors)}</td><td>${escapeHTML(d.status)}</td><td>${d.yearRead || '-'}</td><td>${d.grade || '-'}</td></tr>
    `).join('');
}

// =========================================================
// EVENT SETUP
// =========================================================
function setupEventListeners() {
    const formNewBook = document.getElementById('form-new-book');
    const formReading = document.getElementById('form-modal-reading');
    
    if(formNewBook) attachReadingWorkflowBehavior(formNewBook);
    if(formReading) attachReadingWorkflowBehavior(formReading);

    document.getElementById('btn-manage-authors')?.addEventListener('click', async () => {
        await renderAuthorTable();
        document.getElementById('author-manager-modal').showModal();
    });
    
    document.getElementById('btn-view-log')?.addEventListener('click', async () => {
        await renderReadingLogTable();
        document.getElementById('reading-log-modal').showModal();
    });
    
    document.getElementById('btn-sort')?.addEventListener('click', (e) => {
        currentSort = currentSort === 'recent' ? 'title' : 'recent';
        e.target.textContent = currentSort === 'recent' ? 'Sort: Newest First' : 'Sort: A-Z';
        renderBooks();
    });
    
    document.getElementById('btn-reset')?.addEventListener('click', async () => {
        if (confirm('Reset all data back to seed.json?')) { await resetData(); await refreshUI(); }
    });
    
    document.querySelectorAll('.btn-close-modal').forEach(btn => btn.addEventListener('click', e => e.target.closest('dialog').close()));

    setupAuthorForm();
    setupBookEditForm();
    setupMainForm(formNewBook);
    setupReadingModalForm(formReading);
    setupDelegatedListeners();
}

function setupAuthorForm() {
    const form = document.getElementById('form-manage-author');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = form.elements['authorId'].value;
        const name = form.elements['authorName'].value;
        const val = await validateAuthor({ id: id ? parseInt(id) : null, name });
        
        if (!val.valid) return showFormErrors(form, val.errors);
        id ? await updateAuthor(id, { name }) : await saveAuthor({ name });
        
        form.reset(); form.elements['authorId'].value = '';
        document.getElementById('btn-cancel-author-edit').style.display = 'none';
        await renderAuthorTable(); await refreshUI();
    });
    document.getElementById('btn-cancel-author-edit')?.addEventListener('click', () => {
        form.reset(); form.elements['authorId'].value = '';
        document.getElementById('btn-cancel-author-edit').style.display = 'none';
        clearFormErrors(form);
    });
}

function setupBookEditForm() {
    const form = document.getElementById('form-edit-book');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = parseInt(form.elements['bookId'].value, 10);
        const books = await getBooks();
        const existingBook = books.find(b => b.id === id);
        if (!existingBook) return;

        const draft = {
            ...existingBook, 
            title: form.elements['title'].value.trim(),
            publicationYear: form.elements['publicationYear'].value ? parseInt(form.elements['publicationYear'].value) : null,
            form: form.elements['form'].value || null,
            themeIds: await processThemesInput(form.elements['themes'].value)
        };
        
        const val = validateBook(draft);
        if (!val.valid) return showFormErrors(form, val.errors);
        
        await updateBook(id, draft);
        document.getElementById('book-edit-modal').close();
        await renderBooks();
    });
}

function setupMainForm(form) {
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearFormErrors(form);

        const yearRaw = form.elements['publicationYear'].value.trim();
        const typedAuthorName = form.elements['typedAuthor'].value.trim();
        const themeIds = await processThemesInput(form.elements['themes'].value);

        let authorIds = [], newAuthorToSave = null, authorErrors = {};
        if (typedAuthorName) {
            const authors = await getAuthors();
            const exists = authors.find(a => a.name.trim().toLowerCase() === typedAuthorName.toLowerCase());
            if (exists) authorIds = [exists.id];
            else {
                const check = await validateAuthor({ name: typedAuthorName });
                if (!check.valid) authorErrors = check.errors;
                else newAuthorToSave = { name: typedAuthorName };
            }
        } else if (form.elements['authorId'].value) {
            authorIds = [parseInt(form.elements['authorId'].value, 10)];
        }

        const bookDraft = {
            title: form.elements['title'].value.trim(),
            publicationYear: yearRaw ? parseInt(yearRaw, 10) : null,
            authorIds: newAuthorToSave ? ['PENDING'] : authorIds,
            form: form.elements['form'].value || null,
            themeIds
        };
        
        const readingDraft = {
            status: form.elements['status'].value,
            yearRead: form.elements['yearRead'].disabled || !form.elements['yearRead'].value ? null : parseInt(form.elements['yearRead'].value, 10),
            grade: form.elements['grade'].disabled || !form.elements['grade'].value ? null : parseFloat(form.elements['grade'].value),
            priority: form.elements['priority'].disabled ? null : form.elements['priority'].value
        };

        const valBook = validateBook(bookDraft);
        const valReading = validateReading(readingDraft, bookDraft, false);
        const allErrors = { ...authorErrors, ...valBook.errors, ...valReading.errors };

        if (Object.keys(allErrors).length > 0) return showFormErrors(form, allErrors);

        if (newAuthorToSave) bookDraft.authorIds = [(await saveAuthor(newAuthorToSave)).id];
        readingDraft.bookId = (await saveBook(bookDraft)).id;
        await saveReading(readingDraft);

        form.reset();
        form.querySelector('[name="status"]').dispatchEvent(new Event('change'));
        await refreshUI();
    });
}

function setupReadingModalForm(form) {
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearFormErrors(form);

        const bookId = parseInt(document.getElementById('modal-book-id').value, 10);
        const editId = document.getElementById('modal-reading-id').value;
        const book = (await getBooks()).find(b => b.id === bookId);

        const draft = {
            bookId, status: form.status.value,
            yearRead: form.yearRead.disabled || !form.yearRead.value ? null : parseInt(form.yearRead.value, 10),
            grade: form.grade.disabled || !form.grade.value ? null : parseFloat(form.grade.value),
            priority: form.priority.disabled ? null : form.priority.value,
            recommendedBy: form.recommendedBy.value.trim() || null,
            notes: form.notes.value.trim() || null
        };

        const val = validateReading(draft, book, true);
        if (!val.valid) return showFormErrors(form, val.errors);

        editId ? await updateReading(editId, draft) : await saveReading(draft);
        
        resetModalForm(bookId);
        await renderModalReadings(bookId); 
        await renderBooks();
    });

    document.getElementById('btn-cancel-edit')?.addEventListener('click', () => {
        const bookId = document.getElementById('modal-book-id').value;
        resetModalForm(bookId);
    });
}

function setupDelegatedListeners() {
    document.querySelector('#author-table')?.addEventListener('click', async (e) => {
        if (e.target.matches('.btn-small-edit')) {
            const author = (await getAuthors()).find(a => a.id === parseInt(e.target.dataset.editAuthor, 10));
            if (!author) return;
            const form = document.getElementById('form-manage-author');
            form.elements['authorId'].value = author.id;
            form.elements['authorName'].value = author.name;
            document.getElementById('btn-cancel-author-edit').style.display = 'inline-block';
            clearFormErrors(form);
        }
        if (e.target.matches('.btn-small-del')) {
            const id = parseInt(e.target.dataset.delAuthor, 10);
            const linked = (await getBooks()).filter(b => b.authorIds?.includes(id));
            if (linked.length > 0) return alert(`Cannot delete. Linked to:\n${linked.map(b=>b.title).join(', ')}`);
            if (confirm("Delete this author?")) { await deleteAuthor(id); await renderAuthorTable(); await refreshUI(); }
        }
    });

    document.querySelectorAll('#log-table th[data-sort]').forEach(th => {
        th.addEventListener('click', async () => {
            logSortDir = logSortCol === th.dataset.sort && logSortDir === 'asc' ? 'desc' : 'asc';
            logSortCol = th.dataset.sort;
            await renderReadingLogTable();
        });
    });

    document.getElementById('book-list')?.addEventListener('change', async (e) => {
        if (e.target.matches('.status-badge')) {
            const reading = await getReadingById(parseInt(e.target.dataset.readingId, 10));
            const newStatus = e.target.value;
            if (reading.yearRead || reading.grade) {
                if (newStatus !== 'Read' && newStatus !== 'Abandoned' && !confirm(`Move to "${newStatus}" clears Year and Grade?`)) {
                    return e.target.value = reading.status;
                }
            }
            await updateReadingStatus(reading.id, newStatus);
            await renderBooks();
        }
    });

    document.getElementById('book-list')?.addEventListener('click', async (e) => {
        const bookId = parseInt(e.target.dataset.bookId, 10);
        if (e.target.matches('.btn-readings')) await openReadingModal(bookId);
        
        if (e.target.matches('.btn-edit-book')) {
            const [books, themes] = await Promise.all([getBooks(), getThemes()]);
            const book = books.find(b => b.id === bookId);
            const form = document.getElementById('form-edit-book');
            form.elements['bookId'].value = book.id;
            form.elements['title'].value = book.title;
            form.elements['publicationYear'].value = book.publicationYear || '';
            form.elements['form'].value = book.form || '';
            form.elements['themes'].value = (book.themeIds || []).map(id => themes.find(t=>t.id===id)?.name).filter(Boolean).join(', ');
            document.getElementById('book-edit-modal').showModal();
        }
        if (e.target.matches('.btn-remove')) {
            const book = (await getBooks()).find(b => b.id === bookId);
            const rCount = (await getReadingsByBookId(bookId)).length;
            if (confirm(`Delete "${book?.title}" and its ${rCount} reading(s)?`)) { await deleteBook(bookId); await renderBooks(); }
        }
    });

    document.getElementById('modal-readings-list')?.addEventListener('click', async (e) => {
        const readingId = parseInt(e.target.dataset.readingId, 10);
        const bookId = parseInt(document.getElementById('modal-book-id').value, 10);
        if (e.target.matches('.btn-delete-reading')) {
            await deleteReading(readingId); await renderModalReadings(bookId); await renderBooks();
        }
        if (e.target.matches('.btn-edit-reading')) {
            const reading = await getReadingById(readingId);
            const form = document.getElementById('form-modal-reading');
            document.getElementById('modal-form-title').textContent = `Edit Reading #${reading.id}`;
            document.getElementById('modal-reading-id').value = reading.id;
            document.getElementById('btn-save-modal-reading').textContent = 'Save Changes';
            document.getElementById('btn-cancel-edit').style.display = 'inline-block';

            form.status.value = reading.status; form.status.dispatchEvent(new Event('change'));
            if (!form.yearRead.disabled) form.yearRead.value = reading.yearRead || '';
            if (!form.grade.disabled) form.grade.value = reading.grade || '';
            if (!form.priority.disabled) form.priority.value = reading.priority || '';
            form.recommendedBy.value = reading.recommendedBy || '';
            form.notes.value = reading.notes || '';
            clearFormErrors(form);
        }
    });
}