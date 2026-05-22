/**
 * PIN hashing round-trip — crypto.ts (PLAN 005)
 *
 * Verifica che hashPin/verifyPin (bcryptjs) restino funzionalmente
 * INVARIATI dopo la sostituzione di crypto.subtle (V1).
 */

import { hashPin, verifyPin } from '@/lib/crypto';

describe('hashPin / verifyPin (bcryptjs) — invarianti PLAN 005', () => {
  test('hash + verify dello stesso PIN restituisce true', async () => {
    const pin = '482917';
    const hash = await hashPin(pin);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
    await expect(verifyPin(pin, hash)).resolves.toBe(true);
  });

  test('verifyPin con PIN diverso restituisce false', async () => {
    const hash = await hashPin('111111');
    await expect(verifyPin('222222', hash)).resolves.toBe(false);
  });
});
