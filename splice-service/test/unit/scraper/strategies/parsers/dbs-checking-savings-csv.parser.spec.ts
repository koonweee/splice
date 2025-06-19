import {
  parseCSVLine,
  parseTransactionLine,
} from '../../../../../src/scraper/strategies/parsers/dbs-checking-savings-csv.parser';

describe('DBS CSV Parser', () => {
  describe('parseCSVLine', () => {
    it('should split CSV line by commas and trim whitespace', () => {
      const input = 'field1, field2 , field3,field4';
      const result = parseCSVLine(input);
      expect(result).toEqual(['field1', 'field2', 'field3', 'field4']);
    });

    it('should handle empty fields', () => {
      const input = 'field1,,field3,';
      const result = parseCSVLine(input);
      expect(result).toEqual(['field1', '', 'field3', '']);
    });
  });

  describe('parseTransactionLine', () => {
    it('should parse basic transaction line', () => {
      const input = '03 Mar 2025,ICT, ,238.00,PayNow,Simple Reference,OTHR,';
      const result = parseTransactionLine(input);

      expect(result).toEqual([
        '03 Mar 2025',
        'ICT',
        '',
        '238.00',
        'PayNow',
        'Simple Reference',
        'OTHR',
      ]);
    });

    it('should handle transaction line with commas in reference fields', () => {
      const input =
        '03 Mar 2025,ICT, ,238.00,Incoming PayNow Ref 9938287,From: CHEONG KAR MEI, JEANNIE,OTHR OTHR,';
      const result = parseTransactionLine(input);

      expect(result).toEqual([
        '03 Mar 2025',
        'ICT',
        '',
        '238.00',
        'Incoming PayNow Ref 9938287',
        'From: CHEONG KAR MEI, JEANNIE',
        'OTHR OTHR',
      ]);
    });
  });
});
