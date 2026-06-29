import { RepositoryError } from '../src/lib/supabase/types';

describe('RepositoryError', () => {
  it('should initialize correctly when cause is a string', () => {
    const errorMsg = 'Generic DB error';
    const error = new RepositoryError(errorMsg);

    expect(error.message).toBe(errorMsg);
    expect(error.name).toBe('RepositoryError');
    expect(error.code).toBeNull();
    expect(error.details).toBeNull();
    expect(error.hint).toBeNull();
    expect(error.pgError).toBeUndefined();
  });

  it('should initialize correctly when cause is a DbError object', () => {
    const dbError = {
      message: 'Failed to insert row',
      code: '23505',
      details: 'Key (id)=(123) already exists.',
      hint: 'Use a different ID.',
    };
    const error = new RepositoryError(dbError);

    expect(error.message).toBe(dbError.message);
    expect(error.name).toBe('RepositoryError');
    expect(error.code).toBe(dbError.code);
    expect(error.details).toBe(dbError.details);
    expect(error.hint).toBe(dbError.hint);
    expect(error.pgError).toEqual(dbError);
  });
});
