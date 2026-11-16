// js/validation.js
import { getAuthors } from './store.js';

export const VALID_STATUSES = ['Want to read', 'Reading', 'Paused', 'Read', 'Abandoned'];
export const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

// =========================================================
// AUTHOR VALIDATION (ASYNC)
// =========================================================
export async function validateAuthor(author) {
    const errors = {};
    const name = (author.name || '').trim();

    if (!name) {
        errors.authorName = 'Author name is required.';
    } else {
        const authors = await getAuthors();
        
        // Verifica se já existe um autor com esse nome exato.
        // O a.id !== author.id garante que ele não acuse erro de duplicidade 
        // caso você esteja apenas editando o próprio autor e salvando o mesmo nome.
        const exists = authors.some(a => 
            a.name.trim().toLowerCase() === name.toLowerCase() && 
            a.id !== author.id 
        );
        
        if (exists) {
            errors.authorName = 'An author with this name already exists.';
        }
    }

    // Regra adaptada caso a semente tenha datas de nascimento/morte
    if (author.birthDate && author.deathDate) {
        if (new Date(author.deathDate) <= new Date(author.birthDate)) {
            errors.deathDate = 'Death date must be greater than birth date.';
        }
    }

    return { valid: Object.keys(errors).length === 0, errors };
}

// =========================================================
// BOOK VALIDATION
// =========================================================
export function validateBook(book) {
    const errors = {};
    const currentYear = new Date().getFullYear();

    if (!(book.title || '').trim()) {
        errors.title = 'Book title is required.';
    }

    if (!book.authorIds || book.authorIds.length === 0) {
        errors.authorName = 'At least one author must be selected or typed.';
    }

    if (book.publicationYear !== null && book.publicationYear !== undefined && book.publicationYear !== '') {
        const pubYear = Number(book.publicationYear);
        if (!Number.isInteger(pubYear) || pubYear === 0 || pubYear > currentYear) {
            errors.publicationYear = 'Publication year must be a valid non-zero integer not in the future.';
        }
    }

    return { valid: Object.keys(errors).length === 0, errors };
}

// =========================================================
// READING VALIDATION
// =========================================================
export function validateReading(reading, book = null, requireBookId = true) {
    const errors = {};
    const status = reading.status;

    if (requireBookId && !reading.bookId) {
        errors.bookId = 'Book is required.';
    }

    if (!status || !VALID_STATUSES.includes(status)) {
        errors.status = 'Please select a valid status.';
    }

    const hasYear = reading.yearRead !== null && reading.yearRead !== undefined && reading.yearRead !== '';
    const allowsYear = status === 'Read' || status === 'Abandoned';
    const currentYear = new Date().getFullYear();

    if (status === 'Read' && !hasYear) {
        errors.yearRead = 'Year read is required when status is Read.';
    } else if (!allowsYear && hasYear) {
        errors.yearRead = `Year read must be empty when status is "${status}".`;
    } else if (hasYear) {
        const y = Number(reading.yearRead);
        if (!Number.isInteger(y)) {
            errors.yearRead = 'Year read must be an integer.';
        } else if (y > currentYear) {
            errors.yearRead = 'Year read cannot be in the future.';
        } else if (book && book.publicationYear && y < Number(book.publicationYear)) {
            errors.yearRead = `Year read cannot be earlier than publication year.`;
        }
    }

    const hasGrade = reading.grade !== null && reading.grade !== undefined && reading.grade !== '';
    const allowsGrade = status === 'Read' || status === 'Abandoned';

    if (hasGrade) {
        if (!allowsGrade) {
            errors.grade = `Grade is only allowed when status is Read or Abandoned.`;
        } else {
            const g = Number(reading.grade);
            if (Number.isNaN(g) || g < 0 || g > 10 || Math.round(g * 2) !== g * 2) {
                errors.grade = 'Grade must be between 0.0 and 10.0 in steps of 0.5.';
            }
        }
    }

    const hasPriority = reading.priority !== null && reading.priority !== undefined && reading.priority !== '';
    if (hasPriority) {
        if (status !== 'Want to read') {
            errors.priority = 'Priority is only allowed when status is Want to read.';
        } else if (!VALID_PRIORITIES.includes(reading.priority)) {
            errors.priority = 'Priority must be Low, Medium, or High.';
        }
    }

    return { valid: Object.keys(errors).length === 0, errors };
}