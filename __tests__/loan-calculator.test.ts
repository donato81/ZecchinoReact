import {
  validateInput,
  calcolaRataMensile,
  generaPianoAmmortamento,
  calcolaSimulazione,
  calcolaSaldoResiduoAData,
  calcolaDataFinePrevista,
  LoanCalculatorError,
} from '../src/lib/loan-calculator';

describe('loan-calculator', () => {
  describe('validateInput', () => {
    it('should pass with valid input', () => {
      expect(() =>
        validateInput({
          importo: 1000,
          tassoAnnuo: 5,
          durataMesi: 12,
          dataInizio: '2023-01-01',
        }),
      ).not.toThrow();
    });

    it('should throw if importo <= 0', () => {
      expect(() =>
        validateInput({
          importo: 0,
          tassoAnnuo: 5,
          durataMesi: 12,
          dataInizio: '2023-01-01',
        }),
      ).toThrow(LoanCalculatorError);
      expect(() =>
        validateInput({
          importo: -100,
          tassoAnnuo: 5,
          durataMesi: 12,
          dataInizio: '2023-01-01',
        }),
      ).toThrow(LoanCalculatorError);
    });

    it('should throw if tassoAnnuo < 0', () => {
      expect(() =>
        validateInput({
          importo: 1000,
          tassoAnnuo: -1,
          durataMesi: 12,
          dataInizio: '2023-01-01',
        }),
      ).toThrow(LoanCalculatorError);
    });

    it('should throw if durataMesi is invalid', () => {
      expect(() =>
        validateInput({
          importo: 1000,
          tassoAnnuo: 5,
          durataMesi: 0,
          dataInizio: '2023-01-01',
        }),
      ).toThrow(LoanCalculatorError);
      expect(() =>
        validateInput({
          importo: 1000,
          tassoAnnuo: 5,
          durataMesi: 1.5,
          dataInizio: '2023-01-01',
        }),
      ).toThrow(LoanCalculatorError);
    });
  });

  describe('calcolaRataMensile', () => {
    it('should calculate correct monthly payment with zero interest', () => {
      expect(calcolaRataMensile(1200, 0, 12)).toBe(100.0);
    });

    it('should calculate correct monthly payment with interest', () => {
      // 10000, 5% annual, 12 months -> ~856.07
      expect(calcolaRataMensile(10000, 5, 12)).toBeCloseTo(856.07, 2);
    });
  });

  describe('generaPianoAmmortamento', () => {
    it('should generate a correct schedule with zero interest', () => {
      const input = {
        importo: 1200,
        tassoAnnuo: 0,
        durataMesi: 12,
        dataInizio: '2023-01-01',
      };
      const piano = generaPianoAmmortamento(input);
      expect(piano).toHaveLength(12);
      expect(piano[0].importoRata).toBe(100);
      expect(piano[0].quotaInteressi).toBe(0);
      expect(piano[0].quotaCapitale).toBe(100);
      expect(piano[11].saldoResiduo).toBe(0);
    });

    it('should generate a correct schedule with interest', () => {
      const input = {
        importo: 10000,
        tassoAnnuo: 5,
        durataMesi: 12,
        dataInizio: '2023-01-01',
      };
      const piano = generaPianoAmmortamento(input);
      expect(piano).toHaveLength(12);

      // La prima quota interessi è 10000 * (5/100/12) = 41.67
      expect(piano[0].quotaInteressi).toBeCloseTo(41.67, 2);

      // Il saldo residuo finale deve essere 0
      expect(piano[11].saldoResiduo).toBe(0);
    });
  });

  describe('calcolaSimulazione', () => {
    it('should calculate full simulation correctly', () => {
      const input = {
        importo: 10000,
        tassoAnnuo: 5,
        durataMesi: 12,
        dataInizio: '2023-01-01',
      };
      const result = calcolaSimulazione(input);
      expect(result.rataMensile).toBeCloseTo(856.07, 2);
      expect(result.totaleDaPagare).toBeGreaterThan(10000);
      expect(result.totaleInteressi).toBeGreaterThan(0);
      expect(result.totaleDaPagare).toBeCloseTo(
        result.totaleInteressi + 10000,
        1,
      );
      expect(result.pianoAmmortamento).toHaveLength(12);
    });
  });

  describe('calcolaSaldoResiduoAData', () => {
    const input = {
      importo: 10000,
      tassoAnnuo: 5,
      durataMesi: 12,
      dataInizio: '2023-01-01',
    };

    it('should return initial amount if date is before first payment', () => {
      expect(calcolaSaldoResiduoAData(input, '2023-01-15')).toBe(10000);
    });

    it('should return 0 if date is after last payment', () => {
      expect(calcolaSaldoResiduoAData(input, '2025-01-01')).toBe(0);
    });

    it('should return correct balance during the loan', () => {
      const piano = generaPianoAmmortamento(input);
      const dateOfFirstPayment = piano[0].dataScadenza;
      // Data exactly on the first payment
      expect(calcolaSaldoResiduoAData(input, dateOfFirstPayment)).toBe(
        piano[0].saldoResiduo,
      );
    });
  });

  describe('calcolaDataFinePrevista', () => {
    it('should calculate the correct end date', () => {
      expect(calcolaDataFinePrevista('2023-01-01', 12)).toBe('2024-01-01');
      expect(calcolaDataFinePrevista('2023-01-15', 6)).toBe('2023-07-15');
    });
  });
});
