// js/app.js
import {
    initializeStore, resetData,
    getAuthors, getBooks, getReadings,
    saveAuthor, saveBook, saveReading,
    updateReadingStatus, deleteBook
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

// Helper to prevent HTML injection when rendering titles/authors
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// =========================================================
// 2. UI RENDERING
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

        // Match readings linked to this book (uses the most recent reading entry)
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

        // Render optional Reading details when present
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
                ${statusSelectHTML}
                <h3>${escapeHTML(book.title)}</h3>
                <p><strong>Author:</strong> ${escapeHTML(authorNames)}</p>
                <p><strong>Published:</strong> ${yearDisplay}</p>
                <p><strong>Form:</strong> ${escapeHTML(book.form || 'Not informed')}</p>
                ${extraReadingDetails.join('')}
                <button type="button" class="btn-remove" data-book-id="${book.id}">Remove</button>
            </div>
        `;
    }).join('');
}

// =========================================================
// 3. EVENT LISTENERS (NO INLINE HANDLERS)
// =========================================================
function setupEventListeners() {
    const form = document.getElementById('form-new-book');
    const errorContainer = document.getElementById('error-messages');
    const sortBtn = document.getElementById('btn-sort');
    const resetBtn = document.getElementById('btn-reset');
    const bookListEl = document.getElementById('book-list');

    // Form submission: validates and saves Author (if new), Book, and Reading separately
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

            // Validate Book and Reading rules (FR-06) before persisting anything
            const allErrors = [
                ...validateBook(bookDraft),
                ...validateReading(readingDraft)
            ];
            throwValidationError(allErrors);

            // Persist entities in order
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
            if (error.status === 400) {
                error.errors.forEach(err => {
                    const p = document.createElement('p');
                    p.textContent = `${err.field}: ${err.message}`;
                    errorContainer.appendChild(p);
                });
            } else {
                console.error('Unexpected error:', error);
            }
        }
    });

    // Toggle list sorting
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

    // Reset Data (FR-07)
    resetBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset all data back to seed.json?')) {
            await resetData();
            await refreshUI();
        }
    });

    // Event Delegation for dynamic cards (Status dropdown & Remove button)
    bookListEl.addEventListener('change', async (event) => {
        if (event.target.matches('.status-badge')) {
            const readingId = parseInt(event.target.dataset.readingId, 10);
            const newStatus = event.target.value;
            await updateReadingStatus(readingId, newStatus);
            await renderBooks();
        }
    });

    bookListEl.addEventListener('click', async (event) => {
        if (event.target.matches('.btn-remove')) {
            const bookId = parseInt(event.target.dataset.bookId, 10);
            await deleteBook(bookId);
            await renderBooks();
        }
    });
}