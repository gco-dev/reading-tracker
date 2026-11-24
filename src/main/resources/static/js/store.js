// js/store.js

const API_BASE_URL = '/api';

const state = {
  books: [],
  authors: [],
  themes: [],
  countries: [],
  readings: [],
};

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  };

  if (config.body && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = `Erro ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && (errorData.message || errorData.error)) {
        errorMessage = errorData.message || errorData.error;
      }
    } catch {
      // Mantém a mensagem padrão caso a resposta não seja JSON
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

// --- Inicialização ---

async function init() {
  const [books, authors, themes, countries, readings] = await Promise.all([
    getBooks(),
    getAuthors(),
    getThemes(),
    getCountries(),
    getReadings(),
  ]);

  state.books = books || [];
  state.authors = authors || [];
  state.themes = themes || [];
  state.countries = countries || [];
  state.readings = readings || [];

  return { ...state };
}

// --- Countries ---

async function getCountries() {
  const data = await apiRequest('/countries', { method: 'GET' });
  state.countries = data || [];
  return state.countries;
}

async function getCountryById(id) {
  return apiRequest(`/countries/${id}`, { method: 'GET' });
}

async function saveCountry(country) {
  if (country && country.id) {
    return apiRequest(`/countries/${country.id}`, {
      method: 'PUT',
      body: country,
    });
  }
  return apiRequest('/countries', {
    method: 'POST',
    body: country,
  });
}

async function deleteCountry(id) {
  return apiRequest(`/countries/${id}`, { method: 'DELETE' });
}

// --- Themes ---

async function getThemes() {
  const data = await apiRequest('/themes', { method: 'GET' });
  state.themes = data || [];
  return state.themes;
}

async function getThemeById(id) {
  return apiRequest(`/themes/${id}`, { method: 'GET' });
}

async function saveTheme(theme) {
  if (theme && theme.id) {
    return apiRequest(`/themes/${theme.id}`, {
      method: 'PUT',
      body: theme,
    });
  }
  return apiRequest('/themes', {
    method: 'POST',
    body: theme,
  });
}

async function deleteTheme(id) {
  return apiRequest(`/themes/${id}`, { method: 'DELETE' });
}

// --- Authors ---

async function getAuthors() {
  const data = await apiRequest('/authors', { method: 'GET' });
  state.authors = data || [];
  return state.authors;
}

async function getAuthorById(id) {
  return apiRequest(`/authors/${id}`, { method: 'GET' });
}

async function addAuthor(authorData) {
  const payload = {
    name: authorData.name,
    countryId: Number(authorData.countryId),
  };

  return apiRequest('/authors', {
    method: 'POST',
    body: payload,
  });
}

async function deleteAuthor(id) {
  return apiRequest(`/authors/${id}`, { method: 'DELETE' });
}

// --- Books ---

function buildBookPayload(bookData) {
  return {
    title: bookData.title,
    publicationYear: Number(bookData.publicationYear),
    authorIds: (bookData.authorIds || []).map(Number),
    themeIds: (bookData.themeIds || []).map(Number),
    status: bookData.status || null,
    yearRead: bookData.yearRead ? Number(bookData.yearRead) : null,
    grade: bookData.grade ? Number(bookData.grade) : null,
    priority: bookData.priority ? Number(bookData.priority) : null,
  };
}

async function getBooks() {
  const data = await apiRequest('/books', { method: 'GET' });
  state.books = data || [];
  return state.books;
}

async function getBookById(id) {
  return apiRequest(`/books/${id}`, { method: 'GET' });
}

async function addBook(bookData) {
  const payload = buildBookPayload(bookData);

  return apiRequest('/books', {
    method: 'POST',
    body: payload,
  });
}

async function updateBook(id, bookData) {
  const payload = buildBookPayload(bookData);

  return apiRequest(`/books/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

async function deleteBook(id) {
  return apiRequest(`/books/${id}`, { method: 'DELETE' });
}

// --- Readings ---

async function getReadings() {
  const data = await apiRequest('/readings', { method: 'GET' });
  state.readings = data || [];
  return state.readings;
}

async function getReadingById(id) {
  return apiRequest(`/readings/${id}`, { method: 'GET' });
}

async function saveReading(readingData) {
  const payload = {
    bookId: Number(readingData.bookId),
    status: readingData.status,
    yearRead: readingData.yearRead ? Number(readingData.yearRead) : null,
    grade: readingData.grade ? Number(readingData.grade) : null,
  };

  return apiRequest('/readings', {
    method: 'POST',
    body: payload,
  });
}

async function deleteReading(id) {
  return apiRequest(`/readings/${id}`, { method: 'DELETE' });
}

// --- Reset ---

async function resetData() {
  await apiRequest('/reset', { method: 'POST' });
  return init();
}

// --- Objeto Store ---

const store = {
  state,
  init,

  getCountries,
  getCountryById,
  saveCountry,
  deleteCountry,

  getThemes,
  getThemeById,
  saveTheme,
  deleteTheme,

  getAuthors,
  getAuthorById,
  addAuthor,
  deleteAuthor,

  getBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook,

  getReadings,
  getReadingById,
  saveReading,
  deleteReading,

  resetData,
};

export {
  state,
  init,
  getCountries,
  getCountryById,
  saveCountry,
  deleteCountry,
  getThemes,
  getThemeById,
  saveTheme,
  deleteTheme,
  getAuthors,
  getAuthorById,
  addAuthor,
  deleteAuthor,
  getBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
  getReadings,
  getReadingById,
  saveReading,
  deleteReading,
  resetData,
  store,
};

export default store;