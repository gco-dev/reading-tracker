// js/store.js

const STORAGE_KEYS = {
    countries: 'exlibris_countries',
    authors: 'exlibris_authors',
    themes: 'exlibris_themes',
    books: 'exlibris_books',
    readings: 'exlibris_readings',
    initialized: 'exlibris_initialized'
};

const getCollection = (key) => JSON.parse(localStorage.getItem(key)) || [];
const setCollection = (key, data) => localStorage.setItem(key, JSON.stringify(data));

function getNextId(items) {
    if (!items || items.length === 0) return 1;
    return Math.max(...items.map(item => Number(item.id) || 0)) + 1;
}

// =========================================================
// INITIALIZATION & SEED RESET (FR-07)
// =========================================================
export async function initializeStore() {
    if (!localStorage.getItem(STORAGE_KEYS.initialized)) {
        await resetData();
    }
}

export async function resetData() {
    try {
        const response = await fetch('./seed.json');
        if (!response.ok) {
            throw new Error(`Failed to load seed.json (HTTP ${response.status})`);
        }
        const seed = await response.json();

        setCollection(STORAGE_KEYS.countries, seed.countries || []);
        setCollection(STORAGE_KEYS.authors, seed.authors || []);
        setCollection(STORAGE_KEYS.themes, seed.themes || []);
        setCollection(STORAGE_KEYS.books, seed.books || []);
        setCollection(STORAGE_KEYS.readings, seed.readings || []);
        localStorage.setItem(STORAGE_KEYS.initialized, 'true');
    } catch (error) {
        console.error("Error resetting data:", error);
    }
}

// =========================================================
// NORMALIZATION HELPERS
// =========================================================
function normalizeReadingFields(raw) {
    const status = raw.status;
    const allowsYearAndGrade = status === 'Read' || status === 'Abandoned';
    const allowsPriority = status === 'Want to read';

    return {
        bookId: Number(raw.bookId),
        status,
        yearRead: allowsYearAndGrade && raw.yearRead !== null && raw.yearRead !== undefined && raw.yearRead !== ''
            ? Number(raw.yearRead) : null,
        grade: allowsYearAndGrade && raw.grade !== null && raw.grade !== undefined && raw.grade !== ''
            ? Number(raw.grade) : null,
        priority: allowsPriority && raw.priority !== null && raw.priority !== undefined && raw.priority !== ''
            ? raw.priority : null,
        recommendedBy: (raw.recommendedBy || '').trim() || null,
        notes: (raw.notes || '').trim() || null
    };
}

// =========================================================
// READ OPERATIONS (GETTERS)
// =========================================================
export async function getCountries() { return getCollection(STORAGE_KEYS.countries); }
export async function getAuthors() { return getCollection(STORAGE_KEYS.authors); }
export async function getThemes() { return getCollection(STORAGE_KEYS.themes); }
export async function getBooks() { return getCollection(STORAGE_KEYS.books); }
export async function getReadings() { return getCollection(STORAGE_KEYS.readings); }

export async function getReadingById(id) {
    const readings = await getReadings();
    return readings.find(r => r.id === Number(id)) || null;
}

export async function getReadingsByBookId(bookId) {
    const readings = await getReadings();
    return readings.filter(r => r.bookId === Number(bookId));
}

// =========================================================
// AUTHORS CRUD (FR-01)
// =========================================================
export async function saveAuthor(authorInput) {
    const authors = await getAuthors();
    const newAuthor = {
        id: getNextId(authors),
        name: authorInput.name.trim(),
        countryId: authorInput.countryId ?? null,
        birthDate: authorInput.birthDate || null,
        deathDate: authorInput.deathDate || null
    };
    authors.push(newAuthor);
    setCollection(STORAGE_KEYS.authors, authors);
    return newAuthor;
}

export async function updateAuthor(id, authorInput) {
    const authors = await getAuthors();
    const idx = authors.findIndex(a => a.id === Number(id));
    if (idx !== -1) {
        authors[idx].name = authorInput.name.trim();
        setCollection(STORAGE_KEYS.authors, authors);
    }
}

export async function deleteAuthor(id) {
    const authors = await getAuthors();
    setCollection(STORAGE_KEYS.authors, authors.filter(a => a.id !== Number(id)));
}

// =========================================================
// THEMES CRUD (FR-02)
// =========================================================
export async function saveTheme(name) {
    const themes = await getThemes();
    const newTheme = { 
        id: getNextId(themes), 
        name: name.trim() 
    };
    themes.push(newTheme);
    setCollection(STORAGE_KEYS.themes, themes);
    return newTheme;
}

// =========================================================
// BOOKS CRUD (FR-02 / FR-04)
// =========================================================
export async function saveBook(bookInput) {
    const books = await getBooks();
    const newBook = {
        id: getNextId(books),
        title: bookInput.title.trim(),
        authorIds: bookInput.authorIds || [],
        publicationYear: bookInput.publicationYear ?? null,
        form: bookInput.form || null,
        themeIds: bookInput.themeIds || []
    };
    books.push(newBook);
    setCollection(STORAGE_KEYS.books, books);
    return newBook;
}

export async function updateBook(id, bookInput) {
    const books = await getBooks();
    const idx = books.findIndex(b => b.id === Number(id));
    if (idx !== -1) {
        books[idx] = { 
            ...books[idx], 
            ...bookInput, 
            id: Number(id) // Garante que o ID não mude
        };
        setCollection(STORAGE_KEYS.books, books);
    }
}

export async function deleteBook(bookId) {
    const books = await getBooks();
    const readings = await getReadings();
    
    const id = Number(bookId);
    
    // Calcula quantas leituras serão perdidas (FR-04)
    const removedReadings = readings.filter(r => r.bookId === id).length;

    // Remove o livro e todas as leituras atreladas a ele (Cascade delete)
    setCollection(STORAGE_KEYS.books, books.filter(b => b.id !== id));
    setCollection(STORAGE_KEYS.readings, readings.filter(r => r.bookId !== id));

    return { deletedReadingsCount: removedReadings };
}

// =========================================================
// READINGS CRUD (FR-03)
// =========================================================
export async function saveReading(readingInput) {
    const readings = await getReadings();
    const newReading = {
        id: getNextId(readings),
        ...normalizeReadingFields(readingInput)
    };
    readings.push(newReading);
    setCollection(STORAGE_KEYS.readings, readings);
    return newReading;
}

export async function updateReading(id, readingData) {
    const readings = await getReadings();
    const index = readings.findIndex(r => r.id === Number(id));
    
    if (index !== -1) {
        const existing = readings[index];
        const updated = {
            ...existing,
            ...normalizeReadingFields({ ...existing, ...readingData }),
            id: existing.id
        };
        readings[index] = updated;
        setCollection(STORAGE_KEYS.readings, readings);
        return updated;
    }
    return null;
}

export async function updateReadingStatus(readingId, newStatus) {
    const reading = await getReadingById(readingId);
    if (!reading) return null;

    let payload = { ...reading, status: newStatus };
    
    // Auto-preenche ano se marcou direto como Read pelo dropdown do card
    if (newStatus === 'Read' && !reading.yearRead) {
        payload.yearRead = new Date().getFullYear();
    }
    
    return await updateReading(readingId, payload);
}

export async function deleteReading(readingId) {
    const readings = await getReadings();
    setCollection(STORAGE_KEYS.readings, readings.filter(r => r.id !== Number(readingId)));
}