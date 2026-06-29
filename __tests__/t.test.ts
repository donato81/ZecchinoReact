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
});
