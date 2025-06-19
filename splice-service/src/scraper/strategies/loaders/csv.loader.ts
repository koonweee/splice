import { promises as fs } from 'node:fs';
import type { Loader } from '../types';

export class CSVLoader implements Loader {
  async load(filePath: string): Promise<string> {
    try {
      // Read the file as text
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to load CSV file: ${error.message}`);
    }
  }
}
