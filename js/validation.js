// js/validation.js
import { getAuthors } from './store.js';

const VALID_STATUSES = ['Want to read', 'Reading', 'Paused', 'Read', 'Abandoned'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

// =========================================================
// AUTHOR VALIDATION (ASYNC - CHECKS UNIQUENESS IN STORE)
// =========================================================
export async function validateAuthor(author) {
    const errors = [];

    if (!author.name || author.name.trim() === '') {
        errors.push({ field: 'authorName', message: 'Author name is required.' });
    } else {
        const authors = await getAuthors();
        const exists = authors.some(
            a => a.name.trim().toLowerCase() === author.name.trim().toLowerCase()
        );
        if (exists) {
            errors.push({ field: 'authorName', message: 'Author name must be unique.' });
        }
    }

    if (author.birthDate && author.deathDate) {
        if (new Date(author.deathDate) <= new Date(author.birthDate)) {
            errors.push({ field: 'deathDate', message: 'Death date must be greater than birth date.' });
        }
    }

    return errors;
}

// =========================================================
// BOOK VALIDATION
// =========================================================
export function validateBook(book) {
    const errors = [];

    if (!book.title || book.title.trim() === '') {
        errors.push({ field: 'title', message: 'Book title is required.' });
    }

    if (!book.authorIds || book.authorIds.length === 0) {
        errors.push({ field: 'authorId', message: 'At least one author must be selected or typed.' });
    }

    if (book.publicationYear !== null && book.publicationYear !== undefined) {
        if (Number.isNaN(book.publicationYear) || book.publicationYear === 0) {
            errors.push({ field: 'publicationYear', message: 'Publication year cannot be 0.' });
        }
    }

    return errors;
}

// =========================================================
// READING VALIDATION
// =========================================================
export function validateReading(reading) {
    const errors = [];

    if (!reading.status || !VALID_STATUSES.includes(reading.status)) {
        errors.push({ field: 'status', message: 'A valid reading status is required.' });
    }

    if (reading.status === 'Read' && !reading.yearRead) {
        errors.push({ field: 'yearRead', message: 'Year read is required when status is "Read".' });
    }

    const hasGrade = reading.grade !== null && reading.grade !== undefined && reading.grade !== '';
    if (hasGrade) {
        if (!['Read', 'Abandoned'].includes(reading.status)) {
            errors.push({ field: 'grade', message: 'Grade is only allowed when status is "Read" or "Abandoned".' });
        } else if (
            Number.isNaN(reading.grade) ||
            reading.grade < 0.0 ||
            reading.grade > 10.0 ||
            Math.round(reading.grade * 10) % 5 !== 0
        ) {
            errors.push({ field: 'grade', message: 'Grade must be between 0.0 and 10.0 in steps of 0.5.' });
        }
    }

    if (reading.priority) {
        if (reading.status !== 'Want to read') {
            errors.push({ field: 'priority', message: 'Priority is only allowed when status is "Want to read".' });
        } else if (!VALID_PRIORITIES.includes(reading.priority)) {
            errors.push({ field: 'priority', message: 'Priority must be Low, Medium, or High.' });
        }
    }

    return errors;
}

// =========================================================
// HTTP 400-LIKE EXCEPTION THROWER
// =========================================================
export function throwValidationError(errors) {
    if (errors.length > 0) {
        throw {
            status: 400,
            message: 'Validation failed',
            errors
        };
    }
}