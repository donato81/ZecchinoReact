jest.mock('@/locales', () => ({
  strings: {
    operazione_completata: 'Operazione completata.',
    modificato_con_successo: '{name} modificato con successo.',
    conto_creato: 'Conto {name} di tipo {type} con saldo {amount}',
  },
}));

import { t } from '../src/announcements/_utils/t';

describe('t translation helper', () => {
  it('should translate an existing key without parameters', () => {
    expect(t('operazione_completata')).toBe('Operazione completata.');
  });

  it('should translate an existing key with parameters', () => {
    expect(t('modificato_con_successo', { name: 'Conto' })).toBe('Conto modificato con successo.');
  });

  it('should return String(key) if the key does not exist', () => {
    expect(t('chiave_inesistente' as any)).toBe('chiave_inesistente');
  });

  // Nuovi test Sessione E1
  it('UTLT-01: t("conto_creato") senza params -> stringa non interpolata', () => {
    expect(t('conto_creato')).toBe('Conto {name} di tipo {type} con saldo {amount}');
  });

  it('UTLT-02: t("conto_creato", { name, type, amount }) -> sostituisce tutti i placeholder', () => {
    expect(
      t('conto_creato', {
        name: 'Fineco',
        type: 'corrente',
        amount: '1.000 euro',
      }),
    ).toBe('Conto Fineco di tipo corrente con saldo 1.000 euro');
  });

  it('UTLT-03: t("conto_creato", { name: "Solo Nome" }) con params parziali -> placeholder non risolti rimangono', () => {
    expect(t('conto_creato', { name: 'Solo Nome' })).toBe(
      'Conto Solo Nome di tipo {type} con saldo {amount}',
    );
  });

  it('UTLT-04: t("chiave_inesistente", { name: "test" }) -> fallback chiave come stringa senza crash', () => {
    expect(t('chiave_inesistente' as any, { name: 'test' })).toBe(
      'chiave_inesistente',
    );
  });
});
