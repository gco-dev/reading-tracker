// js/store.js

const API_BASE_URL = '/api';

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

// --- Countries ---

async function getCountries() {
  return apiRequest('/countries', { method: 'GET' });
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
  return apiRequest('/themes', { method: 'GET' });
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
  return apiRequest('/authors', { method: 'GET' });
}

async function getAuthorById(id) {
  return apiRequest(`/authors/${id}`, { method: 'GET' });
}

async function saveAuthor(author) {
  if (author && author.id) {
    return apiRequest(`/authors/${author.id}`, {
      method: 'PUT',
      body: author,
    });
  }
  return apiRequest('/authors', {
    method: 'POST',
    body: author,
  });
}

async function deleteAuthor(id) {
  return apiRequest(`/authors/${id}`, { method: 'DELETE' });
}

// --- Books ---

async function getBooks() {
  return apiRequest('/books', { method: 'GET' });
}

async function getBookById(id) {
  return apiRequest(`/books/${id}`, { method: 'GET' });
}

async function saveBook(book) {
  if (book && book.id) {
    return apiRequest(`/books/${book.id}`, {
      method: 'PUT',
      body: book,
    });
  }
  return apiRequest('/books', {
    method: 'POST',
    body: book,
  });
}

async function deleteBook(id) {
  return apiRequest(`/books/${id}`, { method: 'DELETE' });
}

// --- Readings ---

async function getReadings() {
  return apiRequest('/readings', { method: 'GET' });
}

async function getReadingById(id) {
  return apiRequest(`/readings/${id}`, { method: 'GET' });
}

async function saveReading(reading) {
  if (reading && reading.id) {
    return apiRequest(`/readings/${reading.id}`, {
      method: 'PUT',
      body: reading,
    });
  }
  return apiRequest('/readings', {
    method: 'POST',
    body: reading,
  });
}

async function deleteReading(id) {
  return apiRequest(`/readings/${id}`, { method: 'DELETE' });
}

// --- Reset ---

async function resetData() {
  return apiRequest('/reset', { method: 'POST' });
}

// --- Objeto Store ---

const store = {
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
  saveAuthor,
  deleteAuthor,

  getBooks,
  getBookById,
  saveBook,
  deleteBook,

  getReadings,
  getReadingById,
  saveReading,
  deleteReading,

  resetData,
};

export {
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
  saveAuthor,
  deleteAuthor,
  getBooks,
  getBookById,
  saveBook,
  deleteBook,
  getReadings,
  getReadingById,
  saveReading,
  deleteReading,
  resetData,
  store,
};

export default store;