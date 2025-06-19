import { parseCSVLine } from '../dbs-checking-savings-csv.parser';

describe('DBS CSV Parser', () => {
  describe('parseCSVLine', () => {
    it('should correctly parse a line with comma in reference fields', () => {
      const input =
        '03 Mar 2025,ICT, , 238.00,Incoming PayNow Ref 9938287,From: CHEONG KAR MEI, JEANNIE,OTHR OTHR,';

      const result = parseCSVLine(input);

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

    it('should handle simple lines without commas in reference fields', () => {
      const input = '04 Mar 2025,NETS,12.50, ,NETS Payment,Shop A,Purchase,';

      const result = parseCSVLine(input);

      expect(result).toEqual([
        '04 Mar 2025',
        'NETS',
        '12.50',
        '',
        'NETS Payment',
        'Shop A',
        'Purchase',
      ]);
    });

    it('should handle empty fields correctly', () => {
      const input = '05 Mar 2025,ATM,100.00,,,,,';

      const result = parseCSVLine(input);

      expect(result).toEqual(['05 Mar 2025', 'ATM', '100.00', '', '', '', '']);
    });

    it('should handle multiple commas in reference fields', () => {
      const input =
        '06 Mar 2025,TRF, ,1000.00,Transfer Ref 123,From: Lee, Kim, Wei, Family,OTHR,';

      const result = parseCSVLine(input);

      expect(result).toEqual([
        '06 Mar 2025',
        'TRF',
        '',
        '1000.00',
        'Transfer Ref 123',
        'From: Lee, Kim, Wei, Family',
        'OTHR',
      ]);
    });
  });
});
