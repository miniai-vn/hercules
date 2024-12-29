import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as pdfParse from 'pdf-parse';
import * as cheerio from 'cheerio';
@Injectable()
export class DataExtractionService {
  private chunkString(text: string) {
    const check = text
      .replace(/\n/g, '')
      .split('.')
      .filter((item) => item.length > 0);
    return check;
  }

  async syncDataFromPdf(filePath: string): Promise<string[]> {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const concatenatedText = pdfData.text.replace(/\s+/g, ' ').trim();
    const chunks = this.chunkString(concatenatedText);
    return chunks;
  }

  async syncDataFromUrl(url: string) {
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);

      const textContent = $('body').text().replace(/\s+/g, ' ').trim();

      const chunks = this.chunkString(textContent);
      return chunks;
    } catch (error) {
    }
  }
}
