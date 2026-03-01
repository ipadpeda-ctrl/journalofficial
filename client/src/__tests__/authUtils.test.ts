import { describe, it, expect } from 'vitest';
import { isUnauthorizedError } from '../lib/authUtils';

describe('authUtils', () => {
    describe('isUnauthorizedError', () => {
        it('dovrebbe ritornare true per un errore "401: Unauthorized"', () => {
            const error = new Error('401: Unauthorized');
            expect(isUnauthorizedError(error)).toBe(true);
        });

        it('dovrebbe ritornare true per un errore "401: Non autorizzato"', () => {
            const error = new Error('401: Non autorizzato');
            expect(isUnauthorizedError(error)).toBe(true);
        });

        it('dovrebbe ritornare false per errori HTTP non 401', () => {
            const error1 = new Error('403: Forbidden');
            expect(isUnauthorizedError(error1)).toBe(false);

            const error2 = new Error('500: Server Error');
            expect(isUnauthorizedError(error2)).toBe(false);
        });

        it('dovrebbe gestire stringe vuote', () => {
            const error = new Error('');
            expect(isUnauthorizedError(error)).toBe(false);
        });
    });
});
