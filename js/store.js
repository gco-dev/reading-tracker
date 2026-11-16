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

const getNextId = (items) => items.length === 0 ? 1 : Math.max(...items.map(i => Number(i.id) || 0)) + 1;

// =========================================================
// INITIALIZATION
// =========================================================
export async function initializeStore() {
    if (!localStorage.getItem(STORAGE_KEYS.initialized)) {
        await resetData();
    }
}

export async function resetData() {
    try {
        const response = await fetch('./seed.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
    const { status, bookId, yearRead, grade, priority, recommendedBy, notes } = raw;
    const allowsYearAndGrade = status === 'Read' || status === 'Abandoned';
    const allowsPriority = status === 'Want to read';

    return {
        bookId: Number(bookId),
        status,
        yearRead: allowsYearAndGrade && yearRead ? Number(yearRead) : null,
        grade: allowsYearAndGrade && grade ? Number(grade) : null,
        priority: allowsPriority && priority ? priority : null,
        recommendedBy: (recommendedBy || '').trim() || null,
        notes: (notes || '').trim() || null
    };
}

// =========================================================
// READ OPERATIONS
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
// WRITE OPERATIONS (AUTHORS & THEMES)
// =========================================================
export async function saveAuthor(input) {
    const authors = await getAuthors();
    const newAuthor = { id: getNextId(authors), name: input.name.trim() };
    authors.push(newAuthor);
    setCollection(STORAGE_KEYS.authors, authors);
    return newAuthor;
}

export async function updateAuthor(id, input) {
    const authors = await getAuthors();
    const idx = authors.findIndex(a => a.id === Number(id));
    if (idx !== -1) {
        authors[idx].name = input.name.trim();
        setCollection(STORAGE_KEYS.authors, authors);
    }
}

export async function deleteAuthor(id) {
    const authors = await getAuthors();
    setCollection(STORAGE_KEYS.authors, authors.filter(a => a.id !== Number(id)));
}

export async function saveTheme(name) {
    const themes = await getThemes();
    const newTheme = { id: getNextId(themes), name: name.trim() };
    themes.push(newTheme);
    setCollection(STORAGE_KEYS.themes, themes);
    return newTheme;
}

// =========================================================
// WRITE OPERATIONS (BOOKS & READINGS)
// =========================================================
export async function saveBook(input) {
    const books = await getBooks();
    const newBook = {
        id: getNextId(books),
        title: input.title.trim(),
        authorIds: input.authorIds || [],
        publicationYear: input.publicationYear ?? null,
        form: input.form || null,
        themeIds: input.themeIds || []
    };
    books.push(newBook);
    setCollection(STORAGE_KEYS.books, books);
    return newBook;
}

export async function updateBook(id, input) {
    const books = await getBooks();
    const idx = books.findIndex(b => b.id === Number(id));
    if (idx !== -1) {
        books[idx] = { ...books[idx], ...input, id: Number(id) };
        setCollection(STORAGE_KEYS.books, books);
    }
}

export async function deleteBook(bookId) {
    const books = await getBooks();
    const readings = await getReadings();
    const id = Number(bookId);
    
    setCollection(STORAGE_KEYS.books, books.filter(b => b.id !== id));
    setCollection(STORAGE_KEYS.readings, readings.filter(r => r.bookId !== id));
}

export async function saveReading(input) {
    const readings = await getReadings();
    const newReading = { id: getNextId(readings), ...normalizeReadingFields(input) };
    readings.push(newReading);
    setCollection(STORAGE_KEYS.readings, readings);
    return newReading;
}

export async function updateReading(id, data) {
    const readings = await getReadings();
    const index = readings.findIndex(r => r.id === Number(id));
    if (index !== -1) {
        const updated = { ...readings[index], ...normalizeReadingFields({ ...readings[index], ...data }), id: readings[index].id };
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
    if (newStatus === 'Read' && !reading.yearRead) payload.yearRead = new Date().getFullYear();
    
    return await updateReading(readingId, payload);
}

export async function deleteReading(readingId) {
    const readings = await getReadings();
    setCollection(STORAGE_KEYS.readings, readings.filter(r => r.id !== Number(readingId)));
}