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

// Gera o próximo ID numérico sequencial (compatível com seed.json e futuro Spring Boot/H2)
function getNextId(items) {
    if (!items || items.length === 0) return 1;
    return Math.max(...items.map(item => Number(item.id) || 0)) + 1;
}

// =========================================================
// INITIALIZATION & SEED RESET (FR-07)
// =========================================================

// Carrega o seed.json no localStorage apenas no primeiro acesso
export async function initializeStore() {
    if (!localStorage.getItem(STORAGE_KEYS.initialized)) {
        await resetData();
    }
}

// FR-07: Lê o seed.json original via fetch e restaura o estado inicial do banco local
export async function resetData() {
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
}

// =========================================================
// READ OPERATIONS (ASYNC - SIMULATING REST API GET)
// =========================================================

export async function getCountries() {
    return getCollection(STORAGE_KEYS.countries);
}

export async function getAuthors() {
    return getCollection(STORAGE_KEYS.authors);
}

export async function getThemes() {
    return getCollection(STORAGE_KEYS.themes);
}

export async function getBooks() {
    return getCollection(STORAGE_KEYS.books);
}

export async function getReadings() {
    return getCollection(STORAGE_KEYS.readings);
}

// =========================================================
// WRITE OPERATIONS (ASYNC - SIMULATING REST API POST/PATCH/DELETE)
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

export async function saveBook(bookInput) {
    const books = await getBooks();
    const newBook = {
        id: getNextId(books),
        title: bookInput.title.trim(),
        authorIds: bookInput.authorIds || [],
        publicationYear: bookInput.publicationYear ?? null,
        form: bookInput.form || null,
        mode: bookInput.mode || null,
        content: bookInput.content || null,
        themeIds: bookInput.themeIds || []
    };
    books.push(newBook);
    setCollection(STORAGE_KEYS.books, books);
    return newBook;
}

export async function saveReading(readingInput) {
    const readings = await getReadings();
    const newReading = {
        id: getNextId(readings),
        bookId: readingInput.bookId,
        status: readingInput.status,
        yearRead: readingInput.yearRead ?? null,
        grade: readingInput.grade ?? null,
        recommendedBy: readingInput.recommendedBy || null,
        priority: readingInput.priority || null,
        notes: readingInput.notes || null
    };
    readings.push(newReading);
    setCollection(STORAGE_KEYS.readings, readings);
    return newReading;
}

export async function updateReadingStatus(readingId, newStatus) {
    const readings = await getReadings();
    const reading = readings.find(r => r.id === readingId);

    if (reading) {
        reading.status = newStatus;

        // Mantém consistência com as regras do FR-06 ao trocar status direto no cartão:
        if (newStatus === 'Read' && !reading.yearRead) {
            reading.yearRead = new Date().getFullYear();
        }
        if (newStatus !== 'Want to read') {
            reading.priority = null;
        }
        if (!['Read', 'Abandoned'].includes(newStatus)) {
            reading.grade = null;
        }

        setCollection(STORAGE_KEYS.readings, readings);
    }
    return reading;
}

export async function deleteBook(bookId) {
    const books = await getBooks();
    const readings = await getReadings();

    // Exclui o livro e todas as leituras vinculadas a ele (integridade referencial)
    setCollection(STORAGE_KEYS.books, books.filter(b => b.id !== bookId));
    setCollection(STORAGE_KEYS.readings, readings.filter(r => r.bookId !== bookId));
}