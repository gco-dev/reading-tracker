// js/app.js
import {
    initializeStore, resetData,
    getAuthors, getBooks, getReadings, getReadingsByBookId,
    saveAuthor, saveBook, saveReading,
    updateReadingStatus, deleteReading, deleteBook
} from './store.js';

import {
    validateAuthor, validateBook, validateReading, throwValidationError
} from './validation.js';

let currentSort = 'recent';

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

// Safe DOM-based HTML escaper to prevent XSS without entity copy-paste issues
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

// =========================================================
// 2. MAIN UI RENDERING
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
        // Resolve one or multiple authors
        let authorNames = 'Unknown Author';
        if (book.authorIds && book.authorIds.length > 0) {
            const matched = book.authorIds
                .map(id => authors.find(a => a.id === id)?.name)
                .filter(Boolean);
            if (matched.length > 0) authorNames = matched.join(', ');
        }

        // Format publication year (negative = BC)
        const yearDisplay = book.publicationYear !== null && book.publicationYear !== undefined
            ? (book.publicationYear < 0 ? `${Math.abs(book.publicationYear)} BC` : book.publicationYear)
            : 'Not informed';

        // Match all readings linked to this book (1 Book : N Readings)
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

        // Render latest Reading details when present
        const extraReadingDetails = [];
        if (latestReading?.yearRead) {
            extraReadingDetails.push(`<p><strong>Year Read:</strong> ${latestReading.yearRead}</p>`);
        }
        if (latestReading?.grade !== null && latestReading?.grade !== undefined) {
            extraReadingDetails.push(`<p><strong>Grade:</strong> ${latestReading.grade}/10</p>`);
        }
        if (latestReading?.priority) {
            extraReadingDetails.push(`<p><strong>Priority:</strong> ${escapeHTML(latestReading.priority)}</p>`);
        }

        return `
            <div class="book-card">
                <div>
                    ${statusSelectHTML}
                    <h3>${escapeHTML(book.title)}</h3>
                    <p><strong>Author:</strong> ${escapeHTML(authorNames)}</p>
                    <p><strong>Published:</strong> ${yearDisplay}</p>
                    <p><strong>Form:</strong> ${escapeHTML(book.form || 'Not informed')}</p>
                    ${extraReadingDetails.join('')}
                </div>
                <div class="card-actions">
                    <button type="button" class="btn-readings" data-book-id="${book.id}">
                        Readings (${bookReadings.length})
                    </button>
                    <button type="button" class="btn-remove" data-book-id="${book.id}">Remove</button>
                </div>
            </div>
        `;
    }).join('');
}

// =========================================================
// 3. READING HISTORY MODAL RENDERING (FR-03)
// =========================================================
async function openReadingModal(bookId) {
    const books = await getBooks();
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const modal = document.getElementById('reading-modal');
    const modalTitle = document.getElementById('modal-book-title');
    const modalBookIdInput = document.getElementById('modal-book-id');
    const modalForm = document.getElementById('form-modal-reading');
    const modalErrorContainer = document.getElementById('modal-error-messages');

    modalTitle.textContent = `Readings: ${book.title}`;
    modalBookIdInput.value = book.id;
    modalForm.reset();
    modalErrorContainer.innerHTML = '';

    await renderModalReadings(book.id);
    modal.showModal();
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

        if (reading.yearRead) {
            details.push(`<p><strong>Year Read:</strong> ${reading.yearRead}</p>`);
        }
        if (reading.grade !== null && reading.grade !== undefined) {
            details.push(`<p><strong>Grade:</strong> ${reading.grade}/10</p>`);
        }
        if (reading.priority) {
            details.push(`<p><strong>Priority:</strong> ${escapeHTML(reading.priority)}</p>`);
        }
        if (reading.recommendedBy) {
            details.push(`<p><strong>Recommended by:</strong> ${escapeHTML(reading.recommendedBy)}</p>`);
        }
        if (reading.notes) {
            details.push(`<p><strong>Notes:</strong> ${escapeHTML(reading.notes)}</p>`);
        }

        return `
            <div class="reading-history-item">
                <div class="reading-item-header">
                    <span>
                        <strong>#${index + 1}</strong>  
                        <span class="status-pill status-${statusClass}">${escapeHTML(reading.status)}</span>
                    </span>
                    <button type="button" class="btn-delete-reading" data-reading-id="${reading.id}">
                        Delete
                    </button>
                </div>
                ${details.join('')}
            </div>
        `;
    }).join('');
}

// =========================================================
// 4. EVENT LISTENERS (NO INLINE HANDLERS)
// =========================================================
function setupEventListeners() {
    const form = document.getElementById('form-new-book');
    const errorContainer = document.getElementById('error-messages');
    const sortBtn = document.getElementById('btn-sort');
    const resetBtn = document.getElementById('btn-reset');
    const bookListEl = document.getElementById('book-list');

    // Modal elements
    const modal = document.getElementById('reading-modal');
    const closeModalBtn = document.getElementById('btn-close-modal');
    const modalForm = document.getElementById('form-modal-reading');
    const modalErrorContainer = document.getElementById('modal-error-messages');
    const modalHistoryList = document.getElementById('modal-readings-list');

    // Main Form: Create Author (if new), Book, and Initial Reading
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorContainer.innerHTML = '';

        const title = document.getElementById('new-title').value.trim();
        const yearRaw = document.getElementById('new-year').value.trim();
        const selectedAuthorId = document.getElementById('new-author').value;
        const typedAuthorName = document.getElementById('typed-author').value.trim();
        const formValue = document.getElementById('new-form').value;

        const status = document.getElementById('new-status').value;
        const yearReadRaw = document.getElementById('new-year-read').value.trim();
        const gradeRaw = document.getElementById('new-grade').value.trim();
        const priority = document.getElementById('new-priority').value;

        try {
            let authorIds = [];
            let newAuthorToSave = null;

            if (typedAuthorName) {
                const existingAuthors = await getAuthors();
                const alreadyExists = existingAuthors.find(
                    a => a.name.trim().toLowerCase() === typedAuthorName.toLowerCase()
                );

                if (alreadyExists) {
                    authorIds = [alreadyExists.id];
                } else {
                    const authorErrors = await validateAuthor({ name: typedAuthorName });
                    throwValidationError(authorErrors);
                    newAuthorToSave = { name: typedAuthorName };
                }
            } else if (selectedAuthorId) {
                authorIds = [parseInt(selectedAuthorId, 10)];
            }

            const bookDraft = {
                title,
                publicationYear: yearRaw !== '' ? parseInt(yearRaw, 10) : null,
                authorIds: newAuthorToSave ? ['PENDING'] : authorIds,
                form: formValue || null
            };

            const readingDraft = {
                status,
                yearRead: yearReadRaw !== '' ? parseInt(yearReadRaw, 10) : null,
                grade: gradeRaw !== '' ? parseFloat(gradeRaw) : null,
                priority: priority || null
            };

            const allErrors = [
                ...validateBook(bookDraft),
                ...validateReading(readingDraft)
            ];
            throwValidationError(allErrors);

            if (newAuthorToSave) {
                const savedAuthor = await saveAuthor(newAuthorToSave);
                bookDraft.authorIds = [savedAuthor.id];
            }

            const savedBook = await saveBook(bookDraft);
            readingDraft.bookId = savedBook.id;
            await saveReading(readingDraft);

            form.reset();
            await refreshUI();

        } catch (error) {
            renderErrors(error, errorContainer);
        }
    });

    // Sort Button
    sortBtn.addEventListener('click', () => {
        if (currentSort === 'recent') {
            currentSort = 'title';
            sortBtn.textContent = 'Sort: A-Z';
        } else {
            currentSort = 'recent';
            sortBtn.textContent = 'Sort: Newest First';
        }
        renderBooks();
    });

    // Reset Data Button (FR-07)
    resetBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset all data back to seed.json?')) {
            await resetData();
            await refreshUI();
        }
    });

    // Book Grid Delegation: Status Change, Open Readings Modal, Remove Book
    bookListEl.addEventListener('change', async (event) => {
        if (event.target.matches('.status-badge')) {
            const readingId = parseInt(event.target.dataset.readingId, 10);
            const newStatus = event.target.value;
            await updateReadingStatus(readingId, newStatus);
            await renderBooks();
        }
    });

    bookListEl.addEventListener('click', async (event) => {
        if (event.target.matches('.btn-readings')) {
            const bookId = parseInt(event.target.dataset.bookId, 10);
            await openReadingModal(bookId);
        }

        if (event.target.matches('.btn-remove')) {
            const bookId = parseInt(event.target.dataset.bookId, 10);
            await deleteBook(bookId);
            await renderBooks();
        }
    });

    // Modal Form: Add New Reading / Re-read to Existing Book
    modalForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        modalErrorContainer.innerHTML = '';

        const bookId = parseInt(document.getElementById('modal-book-id').value, 10);
        const status = document.getElementById('modal-status').value;
        const yearReadRaw = document.getElementById('modal-year-read').value.trim();
        const gradeRaw = document.getElementById('modal-grade').value.trim();
        const priority = document.getElementById('modal-priority').value;
        const recommendedBy = document.getElementById('modal-recommended-by').value.trim();
        const notes = document.getElementById('modal-notes').value.trim();

        try {
            const readingDraft = {
                bookId,
                status,
                yearRead: yearReadRaw !== '' ? parseInt(yearReadRaw, 10) : null,
                grade: gradeRaw !== '' ? parseFloat(gradeRaw) : null,
                priority: priority || null,
                recommendedBy: recommendedBy || null,
                notes: notes || null
            };

            const errors = validateReading(readingDraft);
            throwValidationError(errors);

            await saveReading(readingDraft);
            modalForm.reset();

            await renderModalReadings(bookId);
            await renderBooks();
        } catch (error) {
            renderErrors(error, modalErrorContainer);
        }
    });

    // Modal History Delegation: Delete Individual Reading
    modalHistoryList.addEventListener('click', async (event) => {
        if (event.target.matches('.btn-delete-reading')) {
            const readingId = parseInt(event.target.dataset.readingId, 10);
            const bookId = parseInt(document.getElementById('modal-book-id').value, 10);

            await deleteReading(readingId);
            await renderModalReadings(bookId);
            await renderBooks();
        }
    });

    // Close Modal via 'X' button or backdrop click
    closeModalBtn.addEventListener('click', () => modal.close());
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.close();
        }
    });
}

function renderErrors(error, container) {
    if (error && error.status === 400) {
        error.errors.forEach(err => {
            const p = document.createElement('p');
            p.textContent = `${err.field}: ${err.message}`;
            container.appendChild(p);
        });
    } else {
        console.error('Unexpected error:', error);
    }
}