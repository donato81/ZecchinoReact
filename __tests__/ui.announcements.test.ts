jest.mock('@/announcements/_utils/t', () => ({
  t: jest.fn((key: string, params?: Record<string, unknown>) => {
    if (params) {
      return `${key}:${JSON.stringify(params)}`;
    }
    return key;
  }),
}));

import { t } from '@/announcements/_utils/t';
import {
  modificatoConSuccesso,
  eliminatoConSuccesso,
  creatoConSuccesso,
  aggiuntoConSuccesso,
  salvatoConSuccesso,
  operazioneCompletata,
  operazioneAnnullata,
  erroreGenerico,
  erroreRete,
  erroreValidazione,
  caricamentoInCorso,
  caricamentoCompletato,
  nessunDato,
  nessunRisultato,
  confermaRichiesta,
  confermaEliminazione,
  modificaNonSalvata,
  modificheSalvate,
  campoObbligatorio,
  formatoNonValido,
  importoNonValido,
  dataNonValida,
  selezioneRichiesta,
  schermataAperta,
  dialogoAperto,
  dialogoChiuso,
} from '@/announcements/ui';
import {
  expectAssertive,
  expectPolite,
  expectTCalledWith,
} from './helpers/announcements-test-utils';

const mockT = t as unknown as jest.Mock;

describe('ui announcements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ANNX-01 | modificatoConSuccesso("Conto") -> priority polite', () => {
    const result = modificatoConSuccesso('Conto');
    expectPolite(result);
    expectTCalledWith(mockT, 'modificato_con_successo', { name: 'Conto' });
  });

  test('ANNX-02 | eliminatoConSuccesso("Budget") -> priority polite', () => {
    const result = eliminatoConSuccesso('Budget');
    expectPolite(result);
    expectTCalledWith(mockT, 'eliminato_con_successo', { name: 'Budget' });
  });

  test('ANNX-03 | creatoConSuccesso("Obiettivo") -> priority polite', () => {
    const result = creatoConSuccesso('Obiettivo');
    expectPolite(result);
    expectTCalledWith(mockT, 'creato_con_successo', { name: 'Obiettivo' });
  });

  test('ANNX-04 | aggiuntoConSuccesso("Movimento") -> priority polite', () => {
    const result = aggiuntoConSuccesso('Movimento');
    expectPolite(result);
    expectTCalledWith(mockT, 'aggiunto_con_successo', { name: 'Movimento' });
  });

  test('ANNX-05 | salvatoConSuccesso("Impostazioni") -> priority polite', () => {
    const result = salvatoConSuccesso('Impostazioni');
    expectPolite(result);
    expectTCalledWith(mockT, 'salvato_con_successo', { name: 'Impostazioni' });
  });

  test('ANNX-06 | operazioneCompletata() -> priority polite', () => {
    const result = operazioneCompletata();
    expectPolite(result);
    expectTCalledWith(mockT, 'operazione_completata');
  });

  test('ANNX-07 | operazioneAnnullata() -> priority polite', () => {
    const result = operazioneAnnullata();
    expectPolite(result);
    expectTCalledWith(mockT, 'operazione_annullata');
  });

  test('ANNX-08 | erroreGenerico() -> priority assertive', () => {
    const result = erroreGenerico();
    expectAssertive(result);
    expectTCalledWith(mockT, 'errore_generico');
  });

  test('ANNX-09 | erroreRete() -> priority assertive', () => {
    const result = erroreRete();
    expectAssertive(result);
    expectTCalledWith(mockT, 'errore_rete');
  });

  test('ANNX-10 | erroreValidazione() -> priority assertive', () => {
    const result = erroreValidazione();
    expectAssertive(result);
    expectTCalledWith(mockT, 'errore_validazione');
  });

  test('ANNX-11 | caricamentoInCorso() -> priority polite', () => {
    const result = caricamentoInCorso();
    expectPolite(result);
    expectTCalledWith(mockT, 'caricamento_in_corso');
  });

  test('ANNX-12 | caricamentoCompletato() -> priority polite', () => {
    const result = caricamentoCompletato();
    expectPolite(result);
    expectTCalledWith(mockT, 'caricamento_completato');
  });

  test('ANNX-13 | nessunDato() -> priority polite', () => {
    const result = nessunDato();
    expectPolite(result);
    expectTCalledWith(mockT, 'nessun_dato');
  });

  test('ANNX-14 | nessunRisultato() -> priority polite', () => {
    const result = nessunRisultato();
    expectPolite(result);
    expectTCalledWith(mockT, 'nessun_risultato');
  });

  test('ANNX-15 | confermaRichiesta() -> priority polite', () => {
    const result = confermaRichiesta();
    expectPolite(result);
    expectTCalledWith(mockT, 'conferma_richiesta');
  });

  test('ANNX-16 | confermaEliminazione("Budget Casa") -> priority polite', () => {
    const result = confermaEliminazione('Budget Casa');
    expectPolite(result);
    expectTCalledWith(mockT, 'conferma_eliminazione', { name: 'Budget Casa' });
  });

  test('ANNX-17 | modificaNonSalvata() -> priority assertive', () => {
    const result = modificaNonSalvata();
    expectAssertive(result);
    expectTCalledWith(mockT, 'modifica_non_salvata');
  });

  test('ANNX-18 | modificheSalvate() -> priority polite', () => {
    const result = modificheSalvate();
    expectPolite(result);
    expectTCalledWith(mockT, 'modifiche_salvate');
  });

  test('ANNX-19 | campoObbligatorio("Email") -> priority assertive', () => {
    const result = campoObbligatorio('Email');
    expectAssertive(result);
    expectTCalledWith(mockT, 'campo_obbligatorio', { name: 'Email' });
  });

  test('ANNX-20 | formatoNonValido("Importo") -> priority assertive', () => {
    const result = formatoNonValido('Importo');
    expectAssertive(result);
    expectTCalledWith(mockT, 'formato_non_valido', { name: 'Importo' });
  });

  test('ANNX-21 | importoNonValido() -> priority assertive', () => {
    const result = importoNonValido();
    expectAssertive(result);
    expectTCalledWith(mockT, 'importo_non_valido');
  });

  test('ANNX-22 | dataNonValida() -> priority assertive', () => {
    const result = dataNonValida();
    expectAssertive(result);
    expectTCalledWith(mockT, 'data_non_valida');
  });

  test('ANNX-23 | selezioneRichiesta("Categoria") -> priority assertive', () => {
    const result = selezioneRichiesta('Categoria');
    expectAssertive(result);
    expectTCalledWith(mockT, 'selezione_richiesta', { name: 'Categoria' });
  });

  test('ANNX-24 | schermataAperta("Home") -> priority polite', () => {
    const result = schermataAperta('Home');
    expectPolite(result);
    expectTCalledWith(mockT, 'schermata_aperta', { name: 'Home' });
  });

  test('ANNX-25 | dialogoAperto("Aggiungi Conto") -> priority polite', () => {
    const result = dialogoAperto('Aggiungi Conto');
    expectPolite(result);
    expectTCalledWith(mockT, 'dialogo_aperto', { name: 'Aggiungi Conto' });
  });

  test('ANNX-26 | dialogoChiuso() -> priority polite', () => {
    const result = dialogoChiuso();
    expectPolite(result);
    expectTCalledWith(mockT, 'dialogo_chiuso');
  });

  test('ANNX-27 | Test consolidato ACC-1: le 9 funzioni di errore hanno priority assertive', () => {
    const errors = [
      erroreGenerico(),
      erroreRete(),
      erroreValidazione(),
      modificaNonSalvata(),
      campoObbligatorio('x'),
      formatoNonValido('x'),
      importoNonValido(),
      dataNonValida(),
      selezioneRichiesta('x'),
    ];
    errors.forEach((err) => {
      expect(err.priority).toBe('assertive');
    });
  });

  test('ANNX-28 | Test consolidato: le 17 funzioni non-errore hanno priority polite', () => {
    const politeAnnouncements = [
      modificatoConSuccesso('x'),
      eliminatoConSuccesso('x'),
      creatoConSuccesso('x'),
      aggiuntoConSuccesso('x'),
      salvatoConSuccesso('x'),
      operazioneCompletata(),
      operazioneAnnullata(),
      caricamentoInCorso(),
      caricamentoCompletato(),
      nessunDato(),
      nessunRisultato(),
      confermaRichiesta(),
      confermaEliminazione('x'),
      modificheSalvate(),
      schermataAperta('x'),
      dialogoAperto('x'),
      dialogoChiuso(),
    ];
    politeAnnouncements.forEach((ann) => {
      expect(ann.priority).toBe('polite');
    });
  });

  test('ANNX-29 | campoObbligatorio("") con name vuoto -> gestisce stringa vuota senza crash', () => {
    expect(() => {
      const result = campoObbligatorio('');
      expectAssertive(result);
      expectTCalledWith(mockT, 'campo_obbligatorio', { name: '' });
    }).not.toThrow();
  });

  test('ANNX-30 | Verifica struttura Announcement: text di tipo stringa, priority in ["polite", "assertive"]', () => {
    const result = operazioneCompletata();
    expect(typeof result.text).toBe('string');
    expect(['polite', 'assertive']).toContain(result.priority);
  });
});
