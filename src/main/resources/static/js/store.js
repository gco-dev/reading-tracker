// js/store.js

const API_BASE_URL = '/api';

const state = {
  books: [],
  authors: [],
  themes: [],
  countries: [],
  readings: [],
};

// --- Helpers internos ---

function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function upsertItem(list, item) {
  if (!item) return list;
  const index = list.findIndex((entry) => Number(entry.id) === Number(item.id));
  if (index >= 0) {
    const updatedList = [...list];
    updatedList[index] = item;
    return updatedList;
  }
  return [...list, item];
}

async function handleFetchResponse(response) {
  if (response.status === 204) {
    return null; // DELETE bem-sucedido sem corpo no JSON
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    // Extrai a mensagem de erro detalhada vinda do GlobalExceptionHandler Java (DTO validation ou Conflict)
    const arrayErrorsMessage =
      Array.isArray(data?.errors) && data.errors.length > 0
        ? data.errors.map((err) => err.defaultMessage || err.message || String(err)).join('; ')
        : null;

    const errorMessage =
      data?.message ||
      (data?.errors && data.errors?.message) ||
      arrayErrorsMessage ||
      data?.error ||
      `HTTP Error ${response.status}: ${response.statusText}`;

    const error = new Error(errorMessage);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };

  if (config.body && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  return handleFetchResponse(response);
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
    const updated = await apiRequest(`/countries/${country.id}`, {
      method: 'PUT',
      body: country,
    });
    if (updated) {
      state.countries = upsertItem(state.countries, updated);
    }
    return updated;
  }

  const created = await apiRequest('/countries', {
    method: 'POST',
    body: country,
  });
  if (created) {
    state.countries = upsertItem(state.countries, created);
  }
  return created;
}

async function deleteCountry(id) {
  await apiRequest(`/countries/${id}`, { method: 'DELETE' });
  state.countries = state.countries.filter((c) => Number(c.id) !== Number(id));
  return null;
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
    const updated = await apiRequest(`/themes/${theme.id}`, {
      method: 'PUT',
      body: theme,
    });
    if (updated) {
      state.themes = upsertItem(state.themes, updated);
    }
    return updated;
  }

  const created = await apiRequest('/themes', {
    method: 'POST',
    body: theme,
  });
  if (created) {
    state.themes = upsertItem(state.themes, created);
  }
  return created;
}

async function deleteTheme(id) {
  await apiRequest(`/themes/${id}`, { method: 'DELETE' });
  state.themes = state.themes.filter((t) => Number(t.id) !== Number(id));
  return null;
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

  const created = await apiRequest('/authors', {
    method: 'POST',
    body: payload,
  });

  if (created) {
    state.authors = upsertItem(state.authors, created);
  }

  return created;
}

async function deleteAuthor(id) {
  try {
    await apiRequest(`/authors/${id}`, { method: 'DELETE' });
    state.authors = state.authors.filter((a) => Number(a.id) !== Number(id));
    return null;
  } catch (error) {
    if (error.status === 409 && !error.payload?.message && !error.payload?.errors) {
      error.message = 'Não é possível excluir este autor pois existem livros vinculados a ele.';
    }
    throw error;
  }
}

// --- Books ---

function buildBookPayload(bookData) {
  return {
    title: bookData.title,
    publicationYear: Number(bookData.publicationYear),
    authorIds: (bookData.authorIds || []).map(Number),
    themeIds: (bookData.themeIds || []).map(Number),
    status: bookData.status || null,
    yearRead: toNullableNumber(bookData.yearRead),
    grade: toNullableNumber(bookData.grade),
    priority: toNullableNumber(bookData.priority),
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

  const created = await apiRequest('/books', {
    method: 'POST',
    body: payload,
  });

  if (created) {
    state.books = upsertItem(state.books, created);
  }

  return created;
}

async function updateBook(id, bookData) {
  const payload = buildBookPayload(bookData);

  const updated = await apiRequest(`/books/${id}`, {
    method: 'PUT',
    body: payload,
  });

  if (updated) {
    state.books = upsertItem(state.books, updated);
  }

  return updated;
}

async function deleteBook(id) {
  await apiRequest(`/books/${id}`, { method: 'DELETE' });
  state.books = state.books.filter((b) => Number(b.id) !== Number(id));
  state.readings = state.readings.filter(
    (r) => Number(r.bookId ?? r.book?.id) !== Number(id)
  );
  return null;
}

// --- Readings ---

function buildReadingPayload(readingData) {
  return {
    bookId: Number(readingData.bookId),
    status: readingData.status,
    yearRead: toNullableNumber(readingData.yearRead),
    grade: toNullableNumber(readingData.grade),
  };
}

async function getReadings() {
  const data = await apiRequest('/readings', { method: 'GET' });
  state.readings = data || [];
  return state.readings;
}

async function getReadingById(id) {
  return apiRequest(`/readings/${id}`, { method: 'GET' });
}

async function createReading(readingData) {
  const payload = buildReadingPayload(readingData);

  const created = await apiRequest('/readings', {
    method: 'POST',
    body: payload,
  });

  if (created) {
    state.readings = upsertItem(state.readings, created);
  }

  return created;
}

async function updateReading(id, readingData) {
  const payload = buildReadingPayload(readingData);

  const updated = await apiRequest(`/readings/${id}`, {
    method: 'PUT',
    body: payload,
  });

  if (updated) {
    state.readings = upsertItem(state.readings, updated);
  }

  return updated;
}

async function saveReading(readingData) {
  if (readingData && readingData.id) {
    return updateReading(readingData.id, readingData);
  }
  return createReading(readingData);
}

async function deleteReading(id) {
  await apiRequest(`/readings/${id}`, { method: 'DELETE' });
  state.readings = state.readings.filter((r) => Number(r.id) !== Number(id));
  return null;
}

// --- Reset ---

async function resetData() {
  await apiRequest('/reset', { method: 'POST' });
  return init();
}

// --- Aliases semânticos (Fase B) mantendo total compatibilidade com js/app.js ---

const fetchCountries = getCountries;
const fetchThemes = getThemes;
const fetchAuthors = getAuthors;
const fetchBooks = getBooks;
const fetchReadings = getReadings;
const createAuthor = addAuthor;
const createBook = addBook;
const executeResetData = resetData;

// --- Objeto Store ---

const store = {
  state,
  handleFetchResponse,
  init,

  getCountries,
  fetchCountries,
  getCountryById,
  saveCountry,
  deleteCountry,

  getThemes,
  fetchThemes,
  getThemeById,
  saveTheme,
  deleteTheme,

  getAuthors,
  fetchAuthors,
  getAuthorById,
  addAuthor,
  createAuthor,
  deleteAuthor,

  getBooks,
  fetchBooks,
  getBookById,
  addBook,
  createBook,
  updateBook,
  deleteBook,

  getReadings,
  fetchReadings,
  getReadingById,
  createReading,
  updateReading,
  saveReading,
  deleteReading,

  resetData,
  executeResetData,
};

export {
  state,
  handleFetchResponse,
  init,
  getCountries,
  fetchCountries,
  getCountryById,
  saveCountry,
  deleteCountry,
  getThemes,
  fetchThemes,
  getThemeById,
  saveTheme,
  deleteTheme,
  getAuthors,
  fetchAuthors,
  getAuthorById,
  addAuthor,
  createAuthor,
  deleteAuthor,
  getBooks,
  fetchBooks,
  getBookById,
  addBook,
  createBook,
  updateBook,
  deleteBook,
  getReadings,
  fetchReadings,
  getReadingById,
  createReading,
  updateReading,
  saveReading,
  deleteReading,
  resetData,
  executeResetData,
  store,
};

export default store;